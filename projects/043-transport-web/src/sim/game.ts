/**
 * GameSim —— 组装整个游戏逻辑。
 *
 * 分层铁律：本文件及其依赖**不 import three、不碰 DOM**。
 * 因此 Node 里可以直接跑 bot 跑分（tools/bot-run.ts），这是平衡数值唯一的客观判据。
 *
 * 每帧顺序（顺序本身影响确定性，不要随意调换）：
 *   玩家移动 → 武器/射击 → 战斗员 AI → 波次/据点调度 → world.step() → 清理尸体 → 胜负判定
 *
 * 两种模式：
 *   survival（生存）：波次刷红队敌人，玩家单挑，清完 5 波胜。
 *   domination（据点占领）：蓝队（玩家 + 友军）vs 红队 5v5，抢中央据点，占满或团灭对方胜。
 *   两种模式共用同一套 sim 与 AI —— 红队在生存模式下的行为与旧版逐帧等价（bot 基线零回归）。
 */
import RAPIER from '@dimforge/rapier3d-compat';
import { CONFIG } from '../core/config';
import {
  DEFAULT_MAP_ID,
  PLAYER_SPAWN,
  arenaWalls,
  findMap,
  mapBounds,
  pickSpawnPoint,
} from './arena';
import type { BoxObstacle, MapBounds, MapDef } from './arena';
import { Combatant } from './combatant';
import { buildCoverPoints } from './ai/cover';
import { GrenadeSystem } from './grenades';
import { NavGrid } from './ai/nav';
import { Player } from './player';
import { WaveDirector, type SpawnRequest } from './waves';
import { WeaponSystem } from './weapons';
import { castRay, falloffMul, spreadDir } from './shooting';
import { mulberry32 } from './rng';
import { dirFromAngles } from './vecmath';
import type {
  CombatantRef,
  EnemyView,
  GameInput,
  GameMode,
  GameSnapshot,
  SimEvent,
  Team,
  Vec3,
} from './types';

let rapierReady: Promise<void> | null = null;

/** Rapier WASM 只需初始化一次（compat 版内联 base64，重复 init 很慢） */
export function ensureRapier(): Promise<void> {
  if (!rapierReady) rapierReady = RAPIER.init();
  return rapierReady;
}

export interface GameStats {
  shots: number;
  hits: number;
  headshots: number;
  kills: number;
}

export class GameSim {
  readonly world: RAPIER.World;
  readonly player: Player;
  readonly weapons: WeaponSystem;
  readonly mode: GameMode;
  /** 波次导演（仅 survival 使用） */
  readonly wave: WaveDirector;
  /** 全部 bot 战斗员（红队 + 蓝队友军） */
  readonly combatants: Combatant[] = [];
  readonly stats: GameStats = { shots: 0, hits: 0, headshots: 0, kills: 0 };
  /** 当前地图（预设布局，不是随机生成——随机会让 bot 跑分不可比） */
  readonly map: MapDef;
  readonly boxes: BoxObstacle[];
  /** 地图边界（ship 是窄长甲板；旧图退回正方形） */
  readonly bounds: MapBounds;
  /** 导航网格（043 移植：可站立面采样 + BFS 寻路；构造期一次性建好） */
  readonly nav: NavGrid;
  /** 手雷（Rapier 动态刚体 + restitution 弹跳；渲染层读 list 同步网格） */
  readonly grenades: GrenadeSystem;
  /** 据点（仅 domination 有含义） */
  readonly capturePoint: { x: number; z: number; r: number };
  /** 掩体点（AI v2「找掩体」用；从地图几何预计算，纯函数零随机，仅据点模式消费） */
  readonly coverPoints: Vec3[];

  phase: 'ready' | 'playing' | 'won' | 'lost' = 'ready';
  time = 0;
  /** 据点占领进度：-100=红占满，+100=蓝占满，0=中立 */
  capture = 0;

  /** collider handle → 战斗员/玩家引用（射击命中后查目标；玩家与所有战斗员都在内） */
  private readonly byCollider = new Map<number, CombatantRef>();
  /** 人类玩家的引用包装（满足 CombatantRef，团队=蓝） */
  private readonly playerRef: CombatantRef;
  private nextId = 1;
  private events: SimEvent[] = [];

  private constructor(seed: number, mapId: string, mode: GameMode) {
    this.rand = mulberry32(seed);
    this.mode = mode;
    this.map = findMap(mapId);
    this.bounds = mapBounds(this.map);
    this.boxes = [...this.map.boxes, ...arenaWalls(this.bounds)];

    const d = CONFIG.dom;
    this.capturePoint = { x: d.point.x, z: d.point.z, r: d.radius };
    // 据点模式玩家出生在蓝队基地（地图定义，ship 为船尾舱），生存模式在中心
    const playerSpawn: Vec3 =
      mode === 'domination'
        ? { ...(this.map.bases?.blue ?? { x: -(this.bounds.halfX - 6), y: 0, z: 0 }) }
        : PLAYER_SPAWN;

    this.world = new RAPIER.World({ x: 0, y: CONFIG.physics.gravity, z: 0 });
    this.world.timestep = CONFIG.physics.fixedDt;
    this.buildStatic();
    this.coverPoints = buildCoverPoints(this.boxes, this.bounds);
    this.nav = new NavGrid(this.boxes, this.bounds);

    this.player = new Player(this.world, playerSpawn);
    this.byCollider.set(this.player.collider.handle, this.makePlayerRef());
    this.playerRef = this.byCollider.get(this.player.collider.handle)!;

    this.weapons = new WeaponSystem(this.rand);
    this.wave = new WaveDirector(this.rand);
    this.grenades = new GrenadeSystem(this.world);

    if (mode === 'domination') this.spawnTeams();
  }

  private rand: () => number;

  static async create(seed = 1, mapId: string = DEFAULT_MAP_ID, mode: GameMode = 'survival'): Promise<GameSim> {
    await ensureRapier();
    return new GameSim(seed, mapId, mode);
  }

  /** 玩家引用包装：团队蓝色、伤害走 player.hurt */
  private makePlayerRef(): CombatantRef {
    const player = this.player;
    return {
      team: 'blue',
      isPlayer: true,
      get alive() {
        return player.hp > 0;
      },
      collider: player.collider,
      center: () => player.pos(),
      eye: () => player.eye(),
    };
  }

  private buildStatic(): void {
    const { halfX, halfZ } = this.bounds;
    const ground = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0),
    );
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(halfX + 4, 0.5, halfZ + 4), ground);

    for (const b of this.boxes) {
      const rb = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(b.pos.x, b.pos.y + b.half.y, b.pos.z),
      );
      const desc = RAPIER.ColliderDesc.cuboid(b.half.x, b.half.y, b.half.z);
      // 旋转盒（运输船的斜放集装箱）：yaw → 四元数；无 yaw 时单位旋转零开销
      if (b.yaw) {
        desc.setRotation({ x: 0, y: Math.sin(b.yaw / 2), z: 0, w: Math.cos(b.yaw / 2) });
      }
      this.world.createCollider(desc, rb);
    }
  }

  /** 据点模式：蓝队（玩家 + 友军）与红队各在船舱基地，开局即全部入场 */
  private spawnTeams(): void {
    const blueBase: Vec3 = { ...(this.map.bases?.blue ?? { x: -(this.bounds.halfX - 6), y: 0, z: 0 }) };
    const redBase: Vec3 = { ...(this.map.bases?.red ?? { x: this.bounds.halfX - 6, y: 0, z: 0 }) };
    const blueKinds = ['grunt', 'grunt', 'rusher', 'grunt'] as const;
    const redKinds = ['grunt', 'rusher', 'sniper', 'grunt', 'rusher'] as const;

    for (let i = 0; i < CONFIG.dom.blueAllies; i++) {
      const p = this.ringSpawn(blueBase, i, CONFIG.dom.blueAllies);
      this.addCombatant(blueKinds[i] ?? 'grunt', false, 'blue', true, p);
    }
    for (let i = 0; i < CONFIG.dom.redCount; i++) {
      const p = this.ringSpawn(redBase, i, CONFIG.dom.redCount);
      this.addCombatant(redKinds[i] ?? 'grunt', false, 'red', false, p);
    }
  }

  /** 围绕基地环形撒点（带地图边界与掩体余量校验） */
  private ringSpawn(base: Vec3, i: number, n: number): Vec3 {
    for (let attempt = 0; attempt < 12; attempt++) {
      const a = (i / n) * Math.PI * 2 + this.rand() * 0.6;
      const r = 2.5 + this.rand() * 1.5;
      const p = { x: base.x + Math.cos(a) * r, y: 0, z: base.z + Math.sin(a) * r };
      if (Math.abs(p.x) > this.bounds.halfX - 1.2 || Math.abs(p.z) > this.bounds.halfZ - 1.6) continue;
      if (this.clearanceXZ(p) < 1.2) continue;
      return p;
    }
    return {
      x: Math.max(-(this.bounds.halfX - 1.2), Math.min(this.bounds.halfX - 1.2, base.x)),
      y: 0,
      z: Math.max(-(this.bounds.halfZ - 1.6), Math.min(this.bounds.halfZ - 1.6, base.z)),
    };
  }

  private clearanceXZ(p: Vec3): number {
    let best = Infinity;
    for (const b of this.boxes) {
      const c = Math.abs(Math.cos(b.yaw ?? 0));
      const s = Math.abs(Math.sin(b.yaw ?? 0));
      const hx = c * b.half.x + s * b.half.z;
      const hz = s * b.half.x + c * b.half.z;
      const dx = Math.max(Math.abs(p.x - b.pos.x) - hx, 0);
      const dz = Math.max(Math.abs(p.z - b.pos.z) - hz, 0);
      best = Math.min(best, Math.hypot(dx, dz));
    }
    return best;
  }

  private addCombatant(
    kind: 'grunt' | 'rusher' | 'sniper',
    elite: boolean,
    team: Team,
    isAlly: boolean,
    p: Vec3,
  ): void {
    const c = new Combatant(this.world, this.nextId++, kind, elite, team, isAlly, p, this.rand);
    this.combatants.push(c);
    this.byCollider.set(c.collider.handle, c);
  }

  /** 红队存活数（生存模式即为场上敌人数） */
  redAlive(): number {
    let n = 0;
    for (const c of this.combatants) if (c.team === 'red' && c.alive) n += 1;
    return n;
  }

  /** 蓝队存活数（含玩家） */
  blueAlive(): number {
    let n = this.player.hp > 0 ? 1 : 0;
    for (const c of this.combatants) if (c.team === 'blue' && c.alive) n += 1;
    return n;
  }

  /** 推进一帧（固定步长），返回本帧事件 */
  step(input: GameInput): SimEvent[] {
    this.events = [];

    if (this.phase === 'ready') {
      this.phase = 'playing';
      if (this.mode === 'survival') this.wave.start(this.events);
    }
    if (this.phase !== 'playing') return this.events;

    const dt = CONFIG.physics.fixedDt;
    this.time += dt;

    // 1. 玩家
    this.player.update(dt, input, this.events);

    // 2. 武器与射击
    if (this.weapons.update(dt, input, this.events)) this.fireWeapon(input);

    // 3. 战斗员 AI
    this.updateCombatants(dt);

    // 4. 模式调度
    if (this.mode === 'survival') {
      const cleared = this.wave.update(dt, this.redAlive(), (r) => this.spawn(r), this.events);
      if (cleared) {
        this.weapons.refillAll();
        this.player.heal(CONFIG.player.waveHealRatio);
        if (this.wave.state === 'done') {
          this.phase = 'won';
          this.events.push({
            type: 'win',
            totalShots: this.stats.shots,
            hits: this.stats.hits,
            headshots: this.stats.headshots,
            kills: this.stats.kills,
            time: this.time,
            reason: 'waves',
          });
        }
      }
    } else {
      this.updateCapture(dt);
    }

    // 5. 物理推进（所有 setNextKinematicTranslation 在此生效）
    this.world.step();

    // 5.5 手雷引信（物理推进后取位，爆炸用最新位置结算伤害）
    for (const ex of this.grenades.update(dt)) this.explode(ex.pos);

    // 6. 清理尸体
    this.cleanup();

    // 7. 胜负
    if (this.player.hp <= 0 && this.phase === 'playing') {
      this.phase = 'lost';
      this.events.push({
        type: 'lose',
        wave: this.mode === 'survival' ? this.wave.waveIndex + 1 : 0,
        kills: this.stats.kills,
        time: this.time,
        reason: this.mode === 'survival' ? 'waves' : 'capture',
      });
    } else if (this.mode === 'domination') {
      if (this.redAlive() === 0 && this.phase === 'playing') {
        this.phase = 'won';
        this.events.push({
          type: 'win',
          totalShots: this.stats.shots,
          hits: this.stats.hits,
          headshots: this.stats.headshots,
          kills: this.stats.kills,
          time: this.time,
          reason: 'elimination',
        });
      }
    }

    return this.events;
  }

  /** 驱动所有 bot 战斗员（敌我统一 AI，目标为最近敌队单位） */
  private updateCombatants(dt: number): void {
    const blueRefs: CombatantRef[] = [this.playerRef];
    const redRefs: CombatantRef[] = [];
    for (const c of this.combatants) {
      const ref: CombatantRef = c;
      if (c.team === 'blue') blueRefs.push(ref);
      else redRefs.push(ref);
    }

    for (const c of this.combatants) {
      const enemyRefs = c.team === 'red' ? blueRefs : redRefs;
      const allyRefs = c.team === 'red' ? redRefs : blueRefs;
      // 同队碰撞体 handle 集合（射线/视线过滤用，确保友军不互伤、不挡视线）
      const sameTeamHandles = new Set<number>();
      for (const a of allyRefs) sameTeamHandles.add(a.collider.handle);

      const ctx = {
        world: this.world,
        rand: this.rand,
        events: this.events,
        selfTeam: c.team,
        targets: enemyRefs,
        allies: allyRefs,
        capturePoint: this.mode === 'domination' ? this.capturePoint : null,
        isAlly: c.isAlly,
        // 生存模式与旧版 Enemy 逐帧等价：红队 LOS/射线会被同队挡住（旧版无 filterPredicate）。
        // 仅据点模式启用队伍过滤（友军不挡视线、不互伤）——这是 5v5 才需要的新行为。
        filterPredicate:
          this.mode === 'domination'
            ? (col: RAPIER.Collider) => !sameTeamHandles.has(col.handle)
            : undefined,
        // AI v2 仅据点模式：行为树（被压制找掩体）+ 反应延迟。
        // 生存模式保持 falsy —— 红队行为与旧版 Enemy 逐帧等价（bot 基线 A–G 硬前提）。
        aiV2: this.mode === 'domination',
        coverPoints: this.coverPoints,
        // 导航网格：无视线追击 / 掩体转移 / 占点推进时走 BFS 路径（043 移植）
        nav: this.nav,
        damage: (target: CombatantRef, amount: number, from: Vec3) => this.damageRef(target, amount, from),
        byCollider: this.byCollider,
      };
      c.update(dt, ctx);
    }
  }

  /** 据点占领推进：某队在圈内人数更多则向该队累积，平手（含空集）不动 */
  private updateCapture(dt: number): void {
    const cp = this.capturePoint;
    let blue = 0;
    let red = 0;
    if (this.player.hp > 0 && this.inZone(this.player.pos(), cp)) blue += 1;
    for (const c of this.combatants) {
      if (!c.alive) continue;
      const p = c.center();
      if (this.inZone(p, cp)) {
        if (c.team === 'blue') blue += 1;
        else red += 1;
      }
    }
    const net = blue - red;
    if (net !== 0) {
      const rate = 100 / CONFIG.dom.captureSeconds;
      this.capture = Math.max(-100, Math.min(100, this.capture + Math.sign(net) * rate * dt));
    }
    if (this.capture >= 100 && this.phase === 'playing') {
      this.phase = 'won';
      this.events.push({
        type: 'win',
        totalShots: this.stats.shots,
        hits: this.stats.hits,
        headshots: this.stats.headshots,
        kills: this.stats.kills,
        time: this.time,
        reason: 'capture',
      });
    } else if (this.capture <= -100 && this.phase === 'playing') {
      this.phase = 'lost';
      this.events.push({
        type: 'lose',
        wave: 0,
        kills: this.stats.kills,
        time: this.time,
        reason: 'capture',
      });
    }
  }

  private inZone(p: Vec3, cp: { x: number; z: number; r: number }): boolean {
    return Math.hypot(p.x - cp.x, p.z - cp.z) <= cp.r;
  }

  /** 对某个战斗员引用造成伤害（玩家 / bot 分流） */
  private damageRef(
    target: CombatantRef,
    amount: number,
    from: Vec3,
    killer?: { team: Team; isPlayer: boolean },
  ): void {
    if (target.isPlayer) {
      this.player.hurt(amount, from, this.events);
      return;
    }
    const c = target as Combatant;
    const killed = c.hurt(amount);
    this.events.push({
      type: 'hit',
      point: c.center(),
      enemyId: c.id,
      headshot: false,
      damage: amount,
      killed,
    });
    if (killed) {
      this.events.push({
        type: 'kill',
        point: c.center(),
        enemyId: c.id,
        kind: c.kind,
        elite: c.elite,
        killerTeam: killer?.team ?? null,
        byPlayer: killer?.isPlayer ?? false,
      });
    }
  }

  /** 玩家开火：射线排除所有蓝队碰撞体（友军不互伤），只命中红队 */
  private fireWeapon(input: GameInput): void {
    const def = this.weapons.current.def;

    // 投掷物：出手一颗雷，不走射线（伤害在引信到点的 explode() 结算）
    if (def.throwable) {
      const eye = this.player.eye();
      const dir = dirFromAngles(input.yaw, input.pitch);
      // 出膛点前移 0.5m：避开玩家自身胶囊（r=0.35），留 0.04m 间隙
      const origin: Vec3 = {
        x: eye.x + dir.x * 0.5,
        y: eye.y - 0.12 + dir.y * 0.5,
        z: eye.z + dir.z * 0.5,
      };
      this.grenades.throwG(origin, dir, this.rand, this.events);
      this.stats.shots += 1;
      return;
    }

    const origin = this.player.eye();
    const spread = this.weapons.currentSpread();
    const baseDir = dirFromAngles(
      input.yaw + this.weapons.recoilYaw,
      input.pitch + this.weapons.recoilPitch,
    );

    // 排除蓝队（玩家 + 友军）所有碰撞体
    const blueHandles = new Set<number>();
    if (this.player.hp > 0) blueHandles.add(this.player.collider.handle);
    for (const c of this.combatants) if (c.team === 'blue') blueHandles.add(c.collider.handle);
    const blueFilter = (col: RAPIER.Collider) => !blueHandles.has(col.handle);

    let anyHit = false;
    let anyHead = false;

    for (let i = 0; i < def.pellets; i++) {
      const dir = spreadDir(baseDir, spread, this.rand);
      const hit = castRay(this.world, origin, dir, def.range, this.player.collider, this.player.body, blueFilter);
      this.events.push({
        type: 'shot',
        weapon: def.id,
        origin,
        dir,
        pellets: def.pellets,
        len: hit ? hit.t : def.range * 0.45,
      });
      if (!hit) continue;

      const ref = this.byCollider.get(hit.colliderHandle);
      if (!ref || ref.team === 'blue') {
        this.events.push({ type: 'miss', point: hit.point });
        continue;
      }

      const c = ref as Combatant;
      const headshot = hit.point.y > c.headY();
      const damage = def.damage * falloffMul(def, hit.t) * (headshot ? def.headshotMul : 1);
      const killed = c.hurt(damage);

      anyHit = true;
      if (headshot) anyHead = true;
      this.events.push({
        type: 'hit',
        point: hit.point,
        enemyId: c.id,
        headshot,
        damage,
        killed,
      });
      if (killed) {
        this.stats.kills += 1;
        this.events.push({
          type: 'kill',
          point: hit.point,
          enemyId: c.id,
          kind: c.kind,
          elite: c.elite,
          killerTeam: 'blue',
          byPlayer: true,
        });
      }
    }

    this.stats.shots += 1;
    if (anyHit) this.stats.hits += 1;
    if (anyHead) this.stats.headshots += 1;
  }

  /**
   * 手雷爆炸结算：范围伤害 + 静态遮挡判定（墙这边炸不到那边）。
   * 伤害对象 = 红队全员 + 玩家自伤（×selfDamageMul）；蓝队 AI 免伤——
   * 玩家误炸队友直接扣据点战力太挫败，043 原作同样不炸友军。
   */
  private explode(pos: Vec3): void {
    const g = CONFIG.grenade;
    this.events.push({ type: 'explode', pos, radius: g.blastRadius });

    // 静态遮挡射线：只让非战斗员碰撞体（墙/箱/地面）挡爆炸
    const staticFilter = (col: RAPIER.Collider): boolean => !this.byCollider.has(col.handle);

    for (const c of this.combatants) {
      if (c.team !== 'red' || !c.alive) continue;
      const cp = c.center();
      const dx = cp.x - pos.x;
      const dy = cp.y - pos.y;
      const dz = cp.z - pos.z;
      const d = Math.hypot(dx, dy, dz);
      if (d > g.blastRadius) continue;
      if (this.occluded(pos, cp, d, staticFilter)) continue;
      const damage = g.damage * (1 - (d / g.blastRadius) * 0.55);
      const killed = c.hurt(damage);
      this.events.push({
        type: 'hit',
        point: cp,
        enemyId: c.id,
        headshot: false,
        damage,
        killed,
      });
      if (killed) {
        this.stats.kills += 1;
        this.events.push({
          type: 'kill',
          point: cp,
          enemyId: c.id,
          kind: c.kind,
          elite: c.elite,
          killerTeam: 'blue',
          byPlayer: true,
        });
      }
    }

    // 玩家自伤（不衰减遮挡：雷就在脚下，距离衰减已足够）
    const pp = this.player.pos();
    const pd = Math.hypot(pp.x - pos.x, pp.y - pos.y, pp.z - pos.z);
    if (pd <= g.blastRadius) {
      this.player.hurt(g.damage * g.selfDamageMul * (1 - (pd / g.blastRadius) * 0.55), pos, this.events);
    }
  }

  /** 爆点到目标中心之间是否被静态几何挡住（墙后雷无效） */
  private occluded(
    from: Vec3,
    to: Vec3,
    dist: number,
    filter: (col: RAPIER.Collider) => boolean,
  ): boolean {
    const len = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
    if (len < 1e-4) return false;
    const dir = { x: (to.x - from.x) / len, y: (to.y - from.y) / len, z: (to.z - from.z) / len };
    const hit = castRay(this.world, from, dir, Math.min(dist - 0.1, len), undefined, undefined, filter);
    return hit != null;
  }

  private spawn(req: SpawnRequest): void {
    const p = pickSpawnPoint(this.rand, this.player.pos(), this.boxes, this.bounds);
    this.addCombatant(req.kind, req.elite, 'red', false, p);
  }

  private cleanup(): void {
    for (let i = this.combatants.length - 1; i >= 0; i--) {
      const c = this.combatants[i]!;
      if (!c.alive && !c.removed) {
        c.lastPos = c.center();
        this.byCollider.delete(c.collider.handle);
        this.world.removeCollider(c.collider, false);
        this.world.removeRigidBody(c.body);
        c.removed = true;
      }
      if (!c.alive && c.fade >= 1) this.combatants.splice(i, 1);
    }
  }

  enemyViews(): EnemyView[] {
    return this.combatants.map((c) => ({
      id: c.id,
      kind: c.kind,
      elite: c.elite,
      team: c.team,
      colliderHandle: c.collider.handle,
      pos: c.center(),
      yaw: c.yaw,
      hp: c.hp,
      maxHp: c.maxHp,
      alive: c.alive,
      fade: c.fade,
      windup: c.windup,
      flash: Math.max(0, c.flash),
      scale: c.scale,
    }));
  }

  snapshot(): GameSnapshot {
    const s = this.weapons.current;
    const shots = this.stats.shots;
    return {
      phase: this.phase,
      time: this.time,
      mode: this.mode,
      capture: this.capture,
      capturePoint: this.capturePoint,
      blueAlive: this.blueAlive(),
      redAlive: this.redAlive(),
      hp: this.player.hp,
      maxHp: CONFIG.player.maxHp,
      wave: Math.max(1, this.wave.waveIndex + 1),
      waveTotal: this.wave.total,
      enemiesAlive: this.redAlive(),
      enemiesRemaining: this.mode === 'survival' ? this.wave.remainingTotal(this.redAlive()) : this.redAlive(),
      weapon: s.def.id,
      slot: this.weapons.active,
      ammo: s.ammo,
      magazine: s.def.magazine,
      reloading: s.reloading,
      reloadProgress: s.reloading ? 1 - s.reloadTimer / s.def.reloadTime : 1,
      spread: this.weapons.currentSpread(),
      ads: this.weapons.ads,
      shots,
      hits: this.stats.hits,
      headshots: this.stats.headshots,
      kills: this.stats.kills,
      accuracy: shots > 0 ? this.stats.hits / shots : 0,
      pos: this.player.pos(),
      yaw: 0,
      pitch: 0,
      grounded: this.player.grounded,
    };
  }

  dispose(): void {
    this.combatants.length = 0;
    this.byCollider.clear();
    this.world.free();
  }
}
