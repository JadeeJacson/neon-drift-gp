/**
 * bot 跑分 —— 据点占领（5v5）模式。
 *
 * 与生存 bot（bot-run.ts）完全独立，互不影响：生存模式的 A–G 基线零回归。
 * 这里验证的是「5v5 据点模式是否可玩、可胜、可终局、可复现」：
 *   - 蓝队（玩家 bot + 4 友军）能否在合理时间内占下据点或团灭红队
 *   - 不出现 NaN / 死锁（跑到 MAX_STEPS 上限仍未结束 = 失败）
 *   - 同 seed 两次结果一致（确定性）
 *
 *   npm run bot:dom
 */
import { CONFIG } from '../src/core/config';
import { GameSim } from '../src/sim/game';
import { emptyInput, type GameInput } from '../src/sim/types';
import { hasLineOfSight } from '../src/sim/shooting';
import { distXZ, len, sub } from '../src/sim/vecmath';
import { DEFAULT_MAP_ID } from '../src/sim/arena';
import type { EnemyView } from '../src/sim/types';

const DT = CONFIG.physics.fixedDt;
const MAX_STEPS = Math.round((10 * 60) / DT); // 10 分钟硬上限

const TOTAL_RED = CONFIG.dom.redCount;
const SEEDS = [1, 2, 3, 4, 5];

function aimAt(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }) {
  const d = sub(to, from);
  const l = len(d);
  if (l < 1e-6) return { yaw: 0, pitch: 0 };
  return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.asin(d.y / l) };
}

/** 把角度差归一化到 [-π, π] */
function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function nearestRed(sim: GameSim): { view: EnemyView; dist: number; los: boolean } | null {
  const p = sim.player.pos();
  const eye = sim.player.eye();
  let best: { view: EnemyView; dist: number; los: boolean } | null = null;
  for (const e of sim.enemyViews()) {
    if (e.team !== 'red' || !e.alive) continue;
    const d = distXZ(e.pos, p);
    const aimPoint = { x: e.pos.x, y: e.pos.y + 0.15 * e.scale, z: e.pos.z };
    const los =
      d < 3 ||
      hasLineOfSight(sim.world, eye, aimPoint, sim.player.collider, sim.player.body, e.colliderHandle);
    if (!best || d < best.dist) best = { view: e, dist: d, los };
  }
  return best;
}

function driveDom(sim: GameSim, input: GameInput, st: { yaw: number }): void {
  input.slot = 1; // 步枪
  const p = sim.player.pos();
  const cp = sim.capturePoint;
  const red = nearestRed(sim);

  // 瞄准最近红队（有则瞄，无则平视）
  if (red) {
    const aimPoint = { x: red.view.pos.x, y: red.view.pos.y + 0.15 * red.view.scale, z: red.view.pos.z };
    const aim = aimAt(sim.player.eye(), aimPoint);
    input.yaw = aim.yaw;
    input.pitch = aim.pitch;
  }

  // 移动目标：始终奔向据点（守点型）。红队贴脸（<5m）才后撤，否则压向据点中心
  const dx = cp.x - p.x;
  const dz = cp.z - p.z;
  const gd = Math.hypot(dx, dz);
  const desiredYaw = Math.atan2(-dx, -dz);
  const diff = angleDiff(desiredYaw, input.yaw);
  const rot = Math.max(-3 * DT, Math.min(3 * DT, diff));
  input.yaw += rot;
  st.yaw = input.yaw;

  input.forward = red && red.dist < 5 ? -1 : gd > 1.5 ? 1 : 0;
  input.right = 0;
  input.sprint = gd > 8;
  input.jump = false;

  // 开火：红队在视线内且进入射程
  const snap = sim.snapshot();
  const range = sim.weapons.current.def.range * 0.9;
  input.fire = !!(red && red.los && red.dist < range);
  input.reload = snap.ammo === 0;
}

interface DomResult {
  seed: number;
  phase: string;
  time: number;
  capture: number;
  blueAlive: number;
  redAlive: number;
  kills: number;
  nan: boolean;
}

async function domRun(seed: number, mapId: string = DEFAULT_MAP_ID): Promise<DomResult> {
  const sim = await GameSim.create(seed, mapId, 'domination');
  const input = emptyInput();
  const st = { yaw: -Math.PI / 2 };
  let steps = 0;
  let nan = false;
  // 给初始朝向一点时间稳定
  input.yaw = -Math.PI / 2;

  while (sim.phase === 'ready' || sim.phase === 'playing') {
    if (steps >= MAX_STEPS) break;
    driveDom(sim, input, st);
    sim.step(input);
    steps += 1;
    const p = sim.player.pos();
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) nan = true;
  }

  const snap = sim.snapshot();
  sim.dispose();
  return {
    seed,
    phase: sim.phase,
    time: snap.time,
    capture: snap.capture,
    blueAlive: snap.blueAlive,
    redAlive: snap.redAlive,
    kills: snap.kills,
    nan,
  };
}

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, detail = '') => {
  if (ok) {
    pass += 1;
    console.log(`  PASS  ${name}${detail ? '  — ' + detail : ''}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${name}${detail ? '  — ' + detail : ''}`);
  }
};

console.log('=== 04 火线 · 据点占领 bot 跑分 ===\n');

const runs: DomResult[] = [];
for (const s of SEEDS) {
  const r = await domRun(s);
  runs.push(r);
  console.log(
    `  seed ${s}: ${r.phase.padEnd(7)} t=${r.time.toFixed(1)}s cap=${r.capture.toFixed(0)} ` +
      `蓝${r.blueAlive}/红${r.redAlive} 击杀${r.kills} ${r.nan ? 'NaN!' : ''}`,
  );
}

check(
  'D1 蓝队能获胜（占点满或团灭红队）',
  runs.every((r) => r.phase === 'won'),
  runs.map((r) => `${r.seed}:${r.phase}`).join(' '),
);
check('D2 无 NaN', runs.every((r) => !r.nan));
check(
  'D3 单局时长 < 10 分钟（未死锁 / 未卡上限）',
  runs.every((r) => r.time < (10 * 60 - 1)),
  `最长 ${Math.max(...runs.map((r) => r.time)).toFixed(0)}s`,
);
check(
  'D4 蓝队确实在推进据点（至少一局 capture 越过 +30）',
  runs.some((r) => r.capture >= 30 || r.phase === 'won'),
  'capture 峰值 ' + Math.max(...runs.map((r) => r.capture)).toFixed(0),
);

// 确定性
console.log('\n--- 确定性（同 seed 两次） ---');
const a1 = await domRun(7);
const a2 = await domRun(7);
check(
  'D5 同 seed 两次结果一致',
  a1.phase === a2.phase && a1.kills === a2.kills && Math.abs(a1.time - a2.time) < 1e-9,
  `${a1.phase}/${a1.kills}杀 vs ${a2.phase}/${a2.kills}杀`,
);

// 红队人数正确（据点模式出生即满员，不含玩家）
console.log(`\n红队配置人数: ${TOTAL_RED}`);

console.log(`\n=== 汇总：${pass} 通过 / ${fail} 失败 ===`);
process.exit(fail === 0 ? 0 : 1);
