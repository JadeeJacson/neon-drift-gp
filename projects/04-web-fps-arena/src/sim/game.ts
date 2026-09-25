/**
 * GameSim —— 组装整个游戏逻辑。
 *
 * 分层铁律：本文件及其依赖**不 import three、不碰 DOM**。
 * 因此 Node 里可以直接跑 bot 跑分（tools/bot-run.ts），这是平衡数值唯一的客观判据。
 *
 * 每帧顺序（顺序本身影响确定性，不要随意调换）：
 *   玩家移动 → 武器/射击 → 敌人 AI → 波次调度 → world.step() → 清理尸体 → 胜负判定
 */
import RAPIER from '@dimforge/rapier3d-compat';
import { CONFIG } from '../core/config';
import { DEFAULT_MAP_ID, PLAYER_SPAWN, arenaWalls, findMap, pickSpawnPoint } from './arena';
import type { BoxObstacle, MapDef } from './arena';
import { Enemy } from './enemy';
import { Player } from './player';
import { WaveDirector, type SpawnRequest } from './waves';
import { WeaponSystem } from './weapons';
import { castRay, falloffMul, spreadDir } from './shooting';
import { mulberry32 } from './rng';
import { dirFromAngles } from './vecmath';
import type { EnemyView, GameInput, GameSnapshot, SimEvent, Vec3 } from './types';

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
  readonly wave: WaveDirector;
  readonly enemies: Enemy[] = [];
  readonly stats: GameStats = { shots: 0, hits: 0, headshots: 0, kills: 0 };
  /** 当前地图（预设布局，不是随机生成——随机会让 bot 跑分不可比） */
  readonly map: MapDef;
  readonly boxes: BoxObstacle[];

  phase: 'ready' | 'playing' | 'won' | 'lost' = 'ready';
  time = 0;

  private readonly rand: () => number;
  private readonly byCollider = new Map<number, Enemy>();
  private nextId = 1;
  private events: SimEvent[] = [];

  private constructor(seed: number, mapId: string) {
    this.rand = mulberry32(seed);
    this.map = findMap(mapId);
    this.boxes = [...this.map.boxes, ...arenaWalls()];
    this.world = new RAPIER.World({ x: 0, y: CONFIG.physics.gravity, z: 0 });
    this.world.timestep = CONFIG.physics.fixedDt;
    this.buildStatic();
    this.player = new Player(this.world, PLAYER_SPAWN);
    this.weapons = new WeaponSystem(this.rand);
    this.wave = new WaveDirector(this.rand);
  }

  static async create(seed = 1, mapId: string = DEFAULT_MAP_ID): Promise<GameSim> {
    await ensureRapier();
    return new GameSim(seed, mapId);
  }

  private buildStatic(): void {
    const half = CONFIG.arena.half;
    const ground = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0),
    );
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(half + 4, 0.5, half + 4), ground);

    for (const b of this.boxes) {
      const rb = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(b.pos.x, b.pos.y + b.half.y, b.pos.z),
      );
      this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(b.half.x, b.half.y, b.half.z),
        rb,
      );
    }
  }

  aliveCount(): number {
    let n = 0;
    for (const e of this.enemies) if (e.alive) n += 1;
    return n;
  }

  /** 推进一帧（固定步长），返回本帧事件 */
  step(input: GameInput): SimEvent[] {
    this.events = [];

    if (this.phase === 'ready') {
      this.phase = 'playing';
      this.wave.start(this.events);
    }
    if (this.phase !== 'playing') return this.events;

    const dt = CONFIG.physics.fixedDt;
    this.time += dt;

    // 1. 玩家
    this.player.update(dt, input, this.events);

    // 2. 武器与射击
    if (this.weapons.update(dt, input, this.events)) this.fireWeapon(input);

    // 3. 敌人 AI
    const ctx = {
      world: this.world,
      playerPos: this.player.pos(),
      playerEye: this.player.eye(),
      playerCollider: this.player.collider,
      others: this.enemies,
      rand: this.rand,
      events: this.events,
      damagePlayer: (amount: number, from: Vec3) => this.player.hurt(amount, from, this.events),
    };
    for (const e of this.enemies) e.update(dt, ctx);

    // 4. 波次调度（用「敌人更新之后」的存活数）
    const cleared = this.wave.update(dt, this.aliveCount(), (r) => this.spawn(r), this.events);
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
        });
      }
    }

    // 5. 物理推进（所有 setNextKinematicTranslation 在此生效）
    this.world.step();

    // 6. 清理尸体
    this.cleanup();

    // 7. 胜负
    if (this.player.hp <= 0 && this.phase === 'playing') {
      this.phase = 'lost';
      this.events.push({
        type: 'lose',
        wave: this.wave.waveIndex + 1,
        kills: this.stats.kills,
        time: this.time,
      });
    }

    return this.events;
  }

  /** 一发子弹（霰弹为多颗弹丸）；命中率按「发」统计，不按弹丸 */
  private fireWeapon(input: GameInput): void {
    const def = this.weapons.current.def;
    const origin = this.player.eye();
    const spread = this.weapons.currentSpread();
    // 后坐力直接叠加到射向：枪口跳到哪，子弹就飞到哪
    const baseDir = dirFromAngles(
      input.yaw + this.weapons.recoilYaw,
      input.pitch + this.weapons.recoilPitch,
    );

    let anyHit = false;
    let anyHead = false;

    for (let i = 0; i < def.pellets; i++) {
      const dir = spreadDir(baseDir, spread, this.rand);
      const hit = castRay(this.world, origin, dir, def.range, this.player.collider, this.player.body);
      // 先算命中再发事件：曳光长度用真实命中距离，视觉与判定一致
      this.events.push({
        type: 'shot',
        weapon: def.id,
        origin,
        dir,
        pellets: def.pellets,
        len: hit ? hit.t : def.range * 0.45,
      });
      if (!hit) continue;

      const enemy = this.byCollider.get(hit.colliderHandle);
      if (!enemy || !enemy.alive) {
        this.events.push({ type: 'miss', point: hit.point });
        continue;
      }

      const headshot = hit.point.y > enemy.headY();
      const damage = def.damage * falloffMul(def, hit.t) * (headshot ? def.headshotMul : 1);
      const killed = enemy.hurt(damage);

      anyHit = true;
      if (headshot) anyHead = true;
      this.events.push({
        type: 'hit',
        point: hit.point,
        enemyId: enemy.id,
        headshot,
        damage,
        killed,
      });
      if (killed) {
        this.stats.kills += 1;
        this.events.push({
          type: 'kill',
          point: hit.point,
          enemyId: enemy.id,
          kind: enemy.kind,
          elite: enemy.elite,
        });
      }
    }

    this.stats.shots += 1;
    if (anyHit) this.stats.hits += 1;
    if (anyHead) this.stats.headshots += 1;
  }

  private spawn(req: SpawnRequest): void {
    const p = pickSpawnPoint(this.rand, this.player.pos(), this.boxes);
    const e = new Enemy(this.world, this.nextId++, req.kind, req.elite, p, this.rand);
    this.enemies.push(e);
    this.byCollider.set(e.collider.handle, e);
  }

  /**
   * 死亡后立刻移除物理体 —— 尸体不该继续挡子弹（否则打完的敌人变成掩体）。
   * 渲染层用 EnemyView 里保留的最后位置播放消散动画。
   */
  private cleanup(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e) continue;
      if (!e.alive && !e.removed) {
        e.lastPos = e.center();
        this.byCollider.delete(e.collider.handle);
        this.world.removeCollider(e.collider, false);
        this.world.removeRigidBody(e.body);
        e.removed = true;
      }
      if (!e.alive && e.fade >= 1) this.enemies.splice(i, 1);
    }
  }

  enemyViews(): EnemyView[] {
    return this.enemies.map((e) => ({
      id: e.id,
      kind: e.kind,
      elite: e.elite,
      colliderHandle: e.collider.handle,
      pos: e.center(),
      yaw: e.yaw,
      hp: e.hp,
      maxHp: e.maxHp,
      alive: e.alive,
      fade: e.fade,
      windup: e.windup,
      flash: Math.max(0, e.flash),
      scale: e.scale,
    }));
  }

  snapshot(): GameSnapshot {
    const s = this.weapons.current;
    const shots = this.stats.shots;
    return {
      phase: this.phase,
      time: this.time,
      hp: this.player.hp,
      maxHp: CONFIG.player.maxHp,
      wave: Math.max(1, this.wave.waveIndex + 1),
      waveTotal: this.wave.total,
      enemiesAlive: this.aliveCount(),
      enemiesRemaining: this.wave.remainingTotal(this.aliveCount()),
      weapon: s.def.id,
      slot: this.weapons.active,
      ammo: s.ammo,
      magazine: s.def.magazine,
      reloading: s.reloading,
      reloadProgress: s.reloading ? 1 - s.reloadTimer / s.def.reloadTime : 1,
      spread: this.weapons.currentSpread(),
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
    this.enemies.length = 0;
    this.byCollider.clear();
    this.world.free();
  }
}
