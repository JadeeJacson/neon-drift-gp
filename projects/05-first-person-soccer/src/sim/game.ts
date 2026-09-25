/**
 * GameSim —— 组装整个游戏逻辑。
 *
 * 分层铁律：本文件及其依赖**不 import three、不碰 DOM**，因此 Node 里可直接跑 bot 跑分。
 *
 * 每帧顺序（顺序影响确定性，不要随意调换）：
 *   玩家移动 → 玩家踢球/蓄力 → AI（前锋/守门员）→ 带球辅助 → 球受力 → world.step()
 *   → 碰撞事件（弹跳）→ 进球判定 → 胜负判定
 */
import RAPIER from '@dimforge/rapier3d-compat';
import { CONFIG } from '../core/config';
import type { Team } from '../core/config';
import { Character } from './character';
import { Ball } from './ball';
import { Keeper, Striker, dribbleAssist } from './ai';
import type { KickCmd } from './ai';
import { SPAWNS, inGoal, pitchWalls } from './pitch';
import { aimAngles, clamp, distXZ, forwardXZ, normalize, v3 } from './vecmath';
import type { ActorView, BallView, GameInput, GameSnapshot, KickActor, SimEvent, Vec3 } from './types';

let rapierReady: Promise<void> | null = null;

/** Rapier WASM 只需初始化一次 */
export function ensureRapier(): Promise<void> {
  if (!rapierReady) rapierReady = RAPIER.init();
  return rapierReady;
}

const DT = CONFIG.physics.fixedDt;

/** 守门员角色参数：横向速度用 keeperSpeed（远慢于前锋），否则守门员变成一堵墙 */
const KEEPER_OPTS = {
  radius: CONFIG.ai.radius,
  halfHeight: CONFIG.ai.halfHeight,
  walkSpeed: CONFIG.ai.keeperSpeed,
  sprintSpeed: CONFIG.ai.keeperSpeed * 1.15,
  jumpSpeed: CONFIG.ai.jumpSpeed,
};

export class GameSim {
  readonly world: RAPIER.World;
  readonly player: Character;
  readonly ball: Ball;
  readonly striker: Striker;
  readonly keeper: Keeper;
  readonly blueKeeper: Keeper;

  phase: 'ready' | 'playing' | 'goal' | 'won' | 'lost' = 'ready';
  time = 0;
  scoreBlue = 0;
  scoreRed = 0;
  lastScorer: Team | null = null;

  /** 玩家蓄力进度 0..1 */
  private charge = 0;
  private kickHeld = false;
  /** 进球后的庆祝倒计时 */
  private goalTimer = 0;
  /** 球静止累计时长（死球判定用） */
  private ballStillT = 0;
  private events: SimEvent[] = [];
  private readonly eventQueue = new RAPIER.EventQueue(true);

  private constructor(seed: number) {
    void seed;
    this.world = new RAPIER.World({ x: 0, y: CONFIG.physics.gravity, z: 0 });
    this.world.timestep = DT;
    this.buildStatic();

    this.player = new Character(this.world, SPAWNS.player, CONFIG.player);
    this.ball = new Ball(this.world, SPAWNS.ball);
    this.striker = new Striker(
      new Character(this.world, SPAWNS.redStriker, CONFIG.ai),
      'red',
      -CONFIG.pitch.halfLength,
    );
    this.keeper = new Keeper(
      new Character(this.world, SPAWNS.redKeeper, KEEPER_OPTS),
      'red',
      CONFIG.pitch.halfLength,
    );
    this.blueKeeper = new Keeper(
      new Character(this.world, SPAWNS.blueKeeper, KEEPER_OPTS),
      'blue',
      -CONFIG.pitch.halfLength,
    );
  }

  static async create(seed = 1): Promise<GameSim> {
    await ensureRapier();
    return new GameSim(seed);
  }

  private buildStatic(): void {
    const P = CONFIG.pitch;
    const ground = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0),
    );
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(P.halfLength + P.goalDepth + 2, 0.5, P.halfWidth + 2)
        .setFriction(CONFIG.ball.friction)
        .setRestitution(0.55),
      ground,
    );

    for (const b of pitchWalls()) {
      const rb = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(b.pos.x, b.pos.y, b.pos.z),
      );
      this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(b.half.x, b.half.y, b.half.z)
          .setFriction(0.4)
          .setRestitution(0.6),
        rb,
      );
    }
  }

  /** 重新开球：球回中圈，球员回开球位 */
  private kickoff(): void {
    this.ball.reset(SPAWNS.ball);
    this.player.place(SPAWNS.kickoffBlue);
    this.striker.char.place(SPAWNS.kickoffRed);
    this.keeper.char.place(SPAWNS.redKeeper);
    this.blueKeeper.char.place(SPAWNS.blueKeeper);
    this.charge = 0;
    this.kickHeld = false;
    this.ballStillT = 0;
  }

  /** 球是否在玩家的可踢范围（近距豁免角度） */
  private playerCanKick(yaw: number): boolean {
    const self = this.player.pos();
    const bp = this.ball.pos();
    const dx = bp.x - self.x;
    const dz = bp.z - self.z;
    const d = Math.hypot(dx, dz);
    if (d > CONFIG.player.kickRange) return false;
    if (d < 0.95) return true; // 球在脚下，任意方向可踢
    const fwd = forwardXZ(yaw);
    const cos = (fwd.x * dx + fwd.z * dz) / (d || 1);
    return cos > Math.cos(CONFIG.player.kickHalfAngle);
  }

  private playerKick(yaw: number, pitch: number, power: number): void {
    const fwd = forwardXZ(yaw);
    const lift = CONFIG.kick.lift + Math.max(0, pitch) * 0.9;
    const dir = normalize(v3(fwd.x, lift, fwd.z));
    this.ball.kick(dir, power);
    this.events.push({ type: 'kick', pos: this.ball.pos(), power, actor: 'player' });
  }

  /** 执行 AI 踢球（校验范围，避免隔空踢球） */
  private execAgentKick(char: Character, cmd: KickCmd | null, actor: KickActor): boolean {
    if (!cmd) return false;
    if (distXZ(char.pos(), this.ball.pos()) > CONFIG.ai.controlRange + 0.4) return false;
    this.ball.kick(cmd.dir, cmd.power);
    this.events.push({ type: 'kick', pos: this.ball.pos(), power: cmd.power, actor });
    // 守门员出脚即记一次扑救（音效/播报用）
    if (actor === 'keeper' || actor === 'blueKeeper') {
      this.events.push({ type: 'save', pos: this.ball.pos() });
    }
    return true;
  }

  step(input: GameInput): SimEvent[] {
    this.events = [];

    if (this.phase === 'ready') {
      this.phase = 'playing';
      this.kickoff();
      this.events.push({ type: 'whistle' });
    }
    if (this.phase === 'won' || this.phase === 'lost') return this.events;

    // 进球庆祝：冻结物理，倒计时结束重新开球
    if (this.phase === 'goal') {
      this.goalTimer -= DT;
      if (this.goalTimer <= 0) {
        this.kickoff();
        this.phase = 'playing';
        this.events.push({ type: 'whistle' });
      }
      return this.events;
    }

    this.time += DT;
    this.lastYaw = input.yaw;

    // 1. 玩家移动
    this.player.update(DT, {
      forward: input.forward,
      right: input.right,
      yaw: input.yaw,
      jump: input.jump,
      sprint: input.sprint,
    });

    // 2. 玩家蓄力踢球
    const inRange = this.playerCanKick(input.yaw);
    if (input.kick) {
      this.kickHeld = true;
      if (inRange) this.charge = Math.min(1, this.charge + DT / CONFIG.kick.chargeTime);
    } else if (this.kickHeld) {
      // 松开 → 踢
      if (inRange) {
        const power =
          CONFIG.kick.minPower + (CONFIG.kick.maxPower - CONFIG.kick.minPower) * this.charge;
        this.playerKick(input.yaw, input.pitch, power);
      }
      this.kickHeld = false;
      this.charge = 0;
    }

    // 3. AI
    const ballInfo = { pos: this.ball.pos(), vel: this.ball.vel() };
    const sDec = this.striker.update(DT, ballInfo, this.blueKeeper.char.pos().z);
    const kDec = this.keeper.update(DT, ballInfo);
    const bkDec = this.blueKeeper.update(DT, ballInfo);
    this.strikerKickAnim = sDec.kicked ? 0.35 : Math.max(0, this.strikerKickAnim - DT);
    this.keeperKickAnim = kDec.kicked ? 0.35 : Math.max(0, this.keeperKickAnim - DT);
    this.blueKeeperKickAnim = bkDec.kicked ? 0.35 : Math.max(0, this.blueKeeperKickAnim - DT);
    this.execAgentKick(this.striker.char, sDec.kick, 'striker');
    this.execAgentKick(this.keeper.char, kDec.kick, 'keeper');
    this.execAgentKick(this.blueKeeper.char, bkDec.kick, 'blueKeeper');

    // 4. 带球辅助（玩家 + 前锋）
    //    刚踢出的球处于锁定窗口内 → 跳过，否则 dribbleAssist 会把球立刻拉回脚前，
    //    射门被自己吃成带球（实测 15 次踢球 11 次被吃）。
    if (!this.ball.locked) {
      dribbleAssist(this.player, input.yaw, this.ball);
      dribbleAssist(this.striker.char, this.striker.yaw, this.ball);
    }

    // 5. 球受力（滚动阻力 + Magnus + 限速）
    this.ball.applyForces(DT);

    // 6. 物理
    this.world.step(this.eventQueue);
    this.eventQueue.drainCollisionEvents((h1, h2, started) => {
      if (!started) return;
      const bh = this.ball.collider.handle;
      if (h1 !== bh && h2 !== bh) return;
      const s = this.ball.speed();
      if (s > 2.5) this.events.push({ type: 'bounce', pos: this.ball.pos(), speed: s });
    });

    // 7. 进球判定
    this.checkGoal();

    // 8. 死球兜底（球静止且无人靠近 → 重新开球，保证比赛不卡死）
    this.checkDeadBall();

    return this.events;
  }

  /**
   * 死球兜底：球几乎静止、且所有角色都离球较远 → 判死球，回到中圈开球。
   *
   * 这是 M1 的规则简化（真实足球用界外球/球门球），目的是保证比赛永不卡死：
   * 实测球滚到边线死角 (21.5,-14.5) 后双方都够不到，静止 22 秒。
   * 两个条件缺一不可 —— 只看「球静止」会把「玩家停在球前蓄力」误判为死球。
   */
  private checkDeadBall(): void {
    if (this.ball.speed() > CONFIG.match.deadBallSpeed) {
      this.ballStillT = 0;
      return;
    }
    this.ballStillT += DT;

    // 硬死球：球速极低持续过久 → 无条件重新开球，不再要求「无人靠近」。
    // 为什么需要它：常规死球的两个条件同时成立才判死球，但实测会出现
    //   「闲置玩家恰好卡在球与前锋之间」——球静止 150 秒（t=72.8s → 222.8s），
    //   而玩家始终在 clearRadius 内，常规判据永远不成立，比赛彻底锁死。
    // 前锋侧已先尝试解卡（ai.holdKickTime 到点就开一脚），此处是最后兜底。
    if (this.ballStillT >= CONFIG.match.deadBallHardTime) {
      this.kickoff();
      this.events.push({ type: 'whistle' });
      return;
    }

    if (this.ballStillT < CONFIG.match.deadBallTime) return;

    const bp = this.ball.pos();
    const near = [
      this.player.pos(),
      this.striker.char.pos(),
      this.keeper.char.pos(),
      this.blueKeeper.char.pos(),
    ].some((p) => distXZ(p, bp) < CONFIG.match.deadBallClearRadius);
    if (near) return;

    this.kickoff();
    this.events.push({ type: 'whistle' });
  }

  /** 前锋/守门员踢球动画计时（渲染层读） */
  strikerKickAnim = 0;
  keeperKickAnim = 0;
  blueKeeperKickAnim = 0;

  private checkGoal(): void {
    const bp = this.ball.pos();
    if (inGoal(bp, 1)) {
      this.scoreBlue += 1;
      this.lastScorer = 'blue';
      this.events.push({ type: 'goal', team: 'blue', scoreBlue: this.scoreBlue, scoreRed: this.scoreRed });
      this.afterGoal('blue');
    } else if (inGoal(bp, -1)) {
      this.scoreRed += 1;
      this.lastScorer = 'red';
      this.events.push({ type: 'goal', team: 'red', scoreBlue: this.scoreBlue, scoreRed: this.scoreRed });
      this.afterGoal('red');
    }
  }

  private afterGoal(scorer: Team): void {
    const blue = this.scoreBlue;
    const red = this.scoreRed;
    if (blue >= CONFIG.match.goalsToWin) {
      this.phase = 'won';
      this.events.push({ type: 'win', scoreBlue: blue, scoreRed: red, time: this.time });
    } else if (red >= CONFIG.match.goalsToWin) {
      this.phase = 'lost';
      this.events.push({ type: 'lose', scoreBlue: blue, scoreRed: red, time: this.time });
    } else {
      void scorer;
      this.phase = 'goal';
      this.goalTimer = CONFIG.match.goalCelebrate;
    }
  }

  actorViews(): ActorView[] {
    return [
      {
        id: 1,
        team: this.striker.team,
        role: 'striker',
        pos: this.striker.char.pos(),
        yaw: this.striker.yaw,
        kickAnim: this.strikerKickAnim,
      },
      {
        id: 2,
        team: this.keeper.team,
        role: 'keeper',
        pos: this.keeper.char.pos(),
        yaw: this.keeper.yaw,
        kickAnim: this.keeperKickAnim,
      },
      {
        id: 3,
        team: this.blueKeeper.team,
        role: 'keeper',
        pos: this.blueKeeper.char.pos(),
        yaw: this.blueKeeper.yaw,
        kickAnim: this.blueKeeperKickAnim,
      },
    ];
  }

  ballView(): BallView {
    return { pos: this.ball.pos(), quat: this.ball.quat(), speed: this.ball.speed() };
  }

  snapshot(): GameSnapshot {
    const self = this.player.pos();
    const bp = this.ball.pos();
    return {
      phase: this.phase,
      time: this.time,
      scoreBlue: this.scoreBlue,
      scoreRed: this.scoreRed,
      goalsToWin: CONFIG.match.goalsToWin,
      charge: this.charge,
      ballInRange: this.playerCanKick(this.lastYaw),
      ballDist: Math.hypot(bp.x - self.x, bp.z - self.z),
      lastScorer: this.lastScorer,
      pos: self,
      yaw: this.lastYaw,
      pitch: 0,
      grounded: this.player.grounded,
    };
  }

  /** 最近一次输入视角（snapshot 用） */
  private lastYaw = 0;

  dispose(): void {
    this.world.free();
  }
}

/** 供外部（bot）使用的便利：把球踢向某点 */
export function kickToward(sim: GameSim, from: Vec3, to: Vec3, power: number): void {
  const a = aimAngles(from, to);
  const fwd = forwardXZ(a.yaw);
  const dir = normalize(v3(fwd.x, CONFIG.kick.lift, fwd.z));
  sim.ball.kick(dir, clamp(power, CONFIG.kick.minPower, CONFIG.kick.maxPower));
}
