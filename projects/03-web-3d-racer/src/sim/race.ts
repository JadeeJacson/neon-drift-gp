/**
 * 比赛状态机（sim 层）：构建物理世界（路面分段 + 护栏）、车辆、检查点、计时、排名、重置。
 *
 * 零 three、零 DOM —— 机器人跑圈（tools/bot-run.ts）在 Node 里直接 import 它。
 * 所有步进走固定步长 dt：这是「确定性回放」与「自动跑圈」成立的前提。
 */
import RAPIER from '@dimforge/rapier3d-compat';
import { CONFIG } from '../core/config';
import { buildTrack, trackById, nearestIndex, type TrackGeometry } from './track';
import { createVehicle, type Vehicle, type Vec3 } from './vehicle';
import { NEUTRAL, type DriveInput } from './drive';
import { aiInput } from './ai';

export interface RacerState {
  id: string;
  name: string;
  isPlayer: boolean;
  vehicle: Vehicle;
  /** 下一个待通过的检查点 */
  cpIndex: number;
  lap: number;
  lapStart: number;
  lapTimes: number[];
  bestLap: number | null;
  /** 总进度 = 已完成圈数 + 当前圈弧长比例（排名依据） */
  progress: number;
  finished: boolean;
  finishTime: number | null;
  /** nearestIndex 的搜索起点（性能） */
  hintIndex: number;
  offTrackTimer: number;
  stuckTimer: number;
  /** 侧翻计时（up.y<0.5 累计，超阈值即重置，杜绝卡死死循环） */
  flipTimer: number;
  /** 渲染配色（0xRRGGBB） */
  color: number;
  /** 最近一帧的输入（渲染漂移火花用） */
  lastInput: DriveInput;
}

export type RacePhase = 'countdown' | 'racing' | 'finished';

export interface RaceState {
  world: RAPIER.World;
  geo: TrackGeometry;
  racers: RacerState[];
  time: number;
  phase: RacePhase;
  countdown: number;
  log: string[];
  /** 累计步数（确定性校验用） */
  steps: number;
}

export interface RaceOptions {
  trackId?: string;
  opponents?: number;
  segments?: number;
}

/**
 * 路面用连续 trimesh，而不是分段盒子。
 *
 * 踩过的坑：分段 cuboid 在弯道处相邻盒子旋转角不同，路宽 16m 时外沿会翘起约 0.35m 的棱，
 * 车轮压过去就弹跳 + 掉速（实测 56km/h → 13km/h）。trimesh 顶点共享，没有缝也没有棱。
 */
function buildRoadMesh(world: RAPIER.World, geo: TrackGeometry): void {
  const half = geo.def.width / 2;
  const n = geo.segments.length;
  const verts: number[] = [];
  for (let i = 0; i < n; i++) {
    const s = geo.segments[i]!;
    // 用段中心 + 法线生成左右边缘（与视觉 ribbon 完全一致）
    verts.push(
      s.center.x - s.normal.x * half, s.center.y, s.center.z - s.normal.z * half,
      s.center.x + s.normal.x * half, s.center.y, s.center.z + s.normal.z * half,
    );
  }
  const indices: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2;          // left_i
    const b = i * 2 + 1;      // right_i
    const c = ((i + 1) % n) * 2;      // left_{i+1}
    const d = ((i + 1) % n) * 2 + 1;  // right_{i+1}
    indices.push(a, b, c, b, d, c);
  }
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  world.createCollider(
    RAPIER.ColliderDesc.trimesh(new Float32Array(verts), new Uint32Array(indices))
      .setFriction(geo.def.friction),
    body,
  );
}

function buildTrackBodies(world: RAPIER.World, geo: TrackGeometry): void {
  // 物理边界用「软边界力场」（updateRacer 内对临近路沿的车施加朝中心线的回复力），
  // 不再生成实体护栏碰撞体——实体墙会在高速侧滑时把车别翻。
  // 渲染层可另行绘制视觉护栏（从 geo 的 segments 推算）。
  buildRoadMesh(world, geo);
}

let rapierReady: Promise<void> | null = null;

/** WASM 只需初始化一次（浏览器与 Node 通用） */
export function ensureRapier(): Promise<void> {
  if (!rapierReady) rapierReady = RAPIER.init();
  return rapierReady;
}

export async function createRace(opts: RaceOptions = {}): Promise<RaceState> {
  await ensureRapier();
  const def = trackById(opts.trackId ?? CONFIG.defaultTrack);
  const geo = buildTrack(def, opts.segments ?? CONFIG.render.segments);

  const world = new RAPIER.World({ x: 0, y: CONFIG.physics.gravity, z: 0 });
  world.timestep = CONFIG.physics.fixedDt;
  buildTrackBodies(world, geo);

  const count = 1 + Math.max(0, opts.opponents ?? 1);
  const colors = [0xff6b4a, 0x4aa3f5, 0x8ce06a, 0xf0b429];
  const racers: RacerState[] = [];
  for (let i = 0; i < count; i++) {
    const grid = geo.grid[i % geo.grid.length]!;
    const veh = createVehicle(world, grid, def.friction);
    racers.push({
      id: i === 0 ? 'player' : `ai${i}`,
      name: i === 0 ? '你' : `对手 ${i}`,
      isPlayer: i === 0,
      vehicle: veh,
      cpIndex: 1 % geo.checkpoints.length,
      lap: 0,
      lapStart: 0,
      lapTimes: [],
      bestLap: null,
      progress: 0,
      finished: false,
      finishTime: null,
      hintIndex: 0,
      offTrackTimer: 0,
      stuckTimer: 0,
      flipTimer: 0,
      color: colors[i % colors.length]!,
      lastInput: { ...NEUTRAL },
    });
  }

  return {
    world,
    geo,
    racers,
    time: 0,
    phase: 'countdown',
    countdown: CONFIG.race.countdown,
    log: [`${def.name} · ${def.laps} 圈 · ${geo.length.toFixed(0)} 米`],
    steps: 0,
  };
}

/** 距离最近的中心线的横向偏离 */
function lateralOffset(geo: TrackGeometry, index: number, pos: Vec3): number {
  const p = geo.centerline[index]!;
  return Math.hypot(pos.x - p.x, pos.z - p.z);
}

function updateRacer(rs: RaceState, r: RacerState, dt: number): void {
  const geo = rs.geo;
  const pos = r.vehicle.pos();
  r.hintIndex = nearestIndex(geo, pos, r.hintIndex);
  const idx = r.hintIndex;
  r.progress = r.lap + idx / geo.centerline.length;

  if (r.finished) return;

  // 软边界：临近路沿时朝中心线平滑推回（力场，不翻车）
  const off = lateralOffset(geo, idx, pos);
  const half = geo.def.width / 2;
  const edgeStart = half - 1.2;
  if (off > edgeStart) {
    const over = Math.min(3, off - edgeStart);
    const cl = geo.centerline[idx]!;
    const dx = cl.x - pos.x, dz = cl.z - pos.z;
    const d = Math.hypot(dx, dz) || 1;
    const f = over * CONFIG.physics.softWallForce;
    r.vehicle.push((dx / d) * f * dt, (dz / d) * f * dt);
  }

  // 掉出赛道 / 偏离过远 → 延迟重置（兜底；正常被软边界挡住不会到这）
  const outLimit = half + 4;
  if (pos.y < CONFIG.race.fallY || off > outLimit) r.offTrackTimer += dt;
  else r.offTrackTimer = 0;
  if (r.offTrackTimer > CONFIG.race.resetDelay) {
    resetToCheckpoint(rs, r);
    return;
  }

  // 侧翻自愈：车身倒下（up.y<0.5）持续 0.5s 即重置，避免卡在翻车状态无限循环
  if (r.vehicle.upY() < 0.5) r.flipTimer += dt;
  else r.flipTimer = 0;
  if (r.flipTimer > 0.5) {
    resetToCheckpoint(rs, r);
    return;
  }

  // 卡住（速度极低且不在倒计时）→ 也重置
  if (r.vehicle.speed() < CONFIG.race.stuckSpeed && rs.phase === 'racing') r.stuckTimer += dt;
  else r.stuckTimer = 0;
  if (r.stuckTimer > CONFIG.race.stuckSeconds) {
    resetToCheckpoint(rs, r);
    return;
  }

  // 检查点：依次通过（顺序天然保证不会抄近路）
  const cp = geo.checkpoints[r.cpIndex];
  if (cp) {
    const d = Math.hypot(pos.x - cp.center.x, pos.z - cp.center.z);
    if (d < geo.def.width * 0.9 + 7) {
      r.cpIndex = (r.cpIndex + 1) % geo.checkpoints.length;
      if (r.cpIndex === 1) {
        // 通过起跑线 → 完成一圈（起跑时 cpIndex 从 1 开始，回到 1 即一圈）
        r.lap += 1;
        const lapTime = rs.time - r.lapStart;
        r.lapTimes.push(lapTime);
        if (r.bestLap === null || lapTime < r.bestLap) r.bestLap = lapTime;
        r.lapStart = rs.time;
        rs.log.push(`${r.name} 第 ${r.lap} 圈 ${lapTime.toFixed(2)}s`);
        if (r.lap >= geo.def.laps) {
          r.finished = true;
          r.finishTime = rs.time;
          rs.log.push(`${r.name} 完赛 ${rs.time.toFixed(2)}s`);
        }
      }
    }
  }
}

function resetToCheckpoint(rs: RaceState, r: RacerState): void {
  const geo = rs.geo;
  // 回到上一个已通过的检查点（即 cpIndex 的前一个）
  const backIdx = (r.cpIndex - 1 + geo.checkpoints.length) % geo.checkpoints.length;
  const cp = geo.checkpoints[backIdx]!;
  const clIdx = Math.round(cp.t * geo.centerline.length) % geo.centerline.length;
  const seg = geo.segments[clIdx]!;
  r.vehicle.teleport({ x: cp.center.x, y: cp.center.y + 1.8, z: cp.center.z }, seg.yaw);
  r.hintIndex = clIdx;
  r.offTrackTimer = 0;
  r.stuckTimer = 0;
  rs.log.push(`${r.name} 回到赛道`);
}

/** 推进一个固定步长 */
export function stepRace(rs: RaceState, playerInput: DriveInput): void {
  const dt = CONFIG.physics.fixedDt;
  rs.steps += 1;

  if (rs.phase === 'countdown') {
    rs.countdown -= dt;
    for (const r of rs.racers) {
      r.lastInput = { throttle: 0, brake: 1, steer: 0, handbrake: false };
      r.vehicle.apply(r.lastInput, dt);
      r.vehicle.update(dt);
    }
    rs.world.step();
    if (rs.countdown <= 0) {
      rs.phase = 'racing';
      rs.time = 0;
      for (const r of rs.racers) r.lapStart = 0;
      rs.log.push('GO!');
    }
    return;
  }

  if (rs.phase === 'finished') return;

  rs.time += dt;
  for (const r of rs.racers) {
    let inp: DriveInput;
    if (r.finished) inp = { throttle: 0, brake: 0.4, steer: 0, handbrake: false };
    else inp = r.isPlayer ? playerInput : aiInput(rs, r);
    r.lastInput = inp;
    r.vehicle.apply(inp, dt);
    r.vehicle.update(dt);
  }
  rs.world.step();
  for (const r of rs.racers) updateRacer(rs, r, dt);

  if (rs.racers.every((r) => r.finished)) {
    rs.phase = 'finished';
    rs.log.push('比赛结束');
  }
}

/** 名次：完赛者按完赛时间，其余按总进度 */
export function standings(rs: RaceState): RacerState[] {
  return [...rs.racers].sort((a, b) => {
    if (a.finished && b.finished) return (a.finishTime ?? 0) - (b.finishTime ?? 0);
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.progress - a.progress;
  });
}

export function playerOf(rs: RaceState): RacerState {
  return rs.racers.find((r) => r.isPlayer) ?? rs.racers[0]!;
}

/** 强制重置玩家（R 键） */
export function forceReset(rs: RaceState, r: RacerState): void {
  resetToCheckpoint(rs, r);
}

export function disposeRace(rs: RaceState): void {
  rs.world.free();
}

/** 相对某位车手的名次（1 起） */
export function rankOf(rs: RaceState, id: string): number {
  return standings(rs).findIndex((r) => r.id === id) + 1;
}
