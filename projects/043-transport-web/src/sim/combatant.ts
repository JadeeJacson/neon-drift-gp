/**
 * 战斗员 AI —— 三种行为：接近 / 侧移绕圈 / 出手（带可读的预警窗口）。
 *
 * 由 enemy.ts 泛化而来：原版只追玩家，现在统一追「最近的敌队战斗员」
 * （玩家或友军都是 CombatantRef），并支持队伍过滤射击（友军不互伤）。
 * 蓝队 bot（友军）在没有可打的敌人时，会向据点推进 / 在据点内驻守——
 * 这就是设计笔记里的「跟随 / 推进 / 占点」三态的落地。
 *
 * ⚠️ 与旧版保持一致的硬约束（决定数值手感）：
 *   - 威胁必须可读：每种敌人开火前都有 windup（预警），狙击手最长。
 *   - 贴脸豁免 3m 内不判视线，否则掩体擦边角让双方互判无视线 → 死锁。
 *   - 移动数学（standoff / strafe / 受阻绕行）与旧 Enemy 完全相同，
 *     因此生存模式下红队 bot 的行为与旧版逐帧等价，bot 跑分基线（A–G）零回归。
 */
import RAPIER from '@dimforge/rapier3d-compat';
import { CONFIG } from '../core/config';
import type { EnemyDef, EnemyId } from '../core/config';
import { BtAction, BtCondition, BtSelector, BtSequence, type BtNode } from './ai/bt';
import type { NavGrid } from './ai/nav';
import type { CombatantRef, SimEvent, Team, Vec3 } from './types';
import { castRay, hasLineOfSight, spreadDir } from './shooting';
import { distXZ, normalize, sub } from './vecmath';

export interface CombatantUpdateCtx {
  world: RAPIER.World;
  rand: () => number;
  events: SimEvent[];
  /** 自己所属队伍 */
  selfTeam: Team;
  /** 敌队战斗员（活着的），用于选目标 */
  targets: CombatantRef[];
  /** 同队战斗员（含自己），用于相互排斥、防止叠成一团 */
  allies: CombatantRef[];
  /** 伤害分发：命中敌队目标时回调（内部按 player / 战斗员分流）。
   *  killer 用于 killfeed（谁杀的）；省略 = 未标注（等价旧行为）。 */
  damage: (target: CombatantRef, amount: number, from: Vec3, killer?: { team: Team; isPlayer: boolean }) => void;
  /** 全部战斗员的 collider → ref 映射（射线命中后查目标） */
  byCollider: Map<number, CombatantRef>;
  /** 据点（仅友军推进用） */
  capturePoint: { x: number; z: number; r: number } | null;
  /** 自己是否蓝队友军（决定无敌人时是否去占点） */
  isAlly: boolean;
  /** 队伍过滤：返回 false 的碰撞体被射线跳过（同队不互伤 / 不挡视线）。
   *  生存模式为 undefined（与旧版 Enemy 逐帧等价：同队会互相挡视线）。 */
  filterPredicate?: (collider: RAPIER.Collider) => boolean;
  /** AI v2（仅据点模式）：启用行为树 / 掩体寻找 / 反应延迟。
   *  生存模式必须为 falsy —— 红队行为与旧版 Enemy 逐帧等价是 bot 基线的硬前提。 */
  aiV2?: boolean;
  /** 掩体点集合（v2 用；GameSim 构造时从地图几何预计算，纯函数零随机） */
  coverPoints?: Vec3[];
  /** 导航网格（043 移植）：无视线追击 / 掩体转移 / 占点推进时走 BFS 路径 */
  nav?: NavGrid;
}

/** 行为树黑板：一次 tick 的输入输出 */
interface CombatBb {
  self: Combatant;
  ctx: CombatantUpdateCtx;
  /** 被压制 = 低生命 + 最近受击在窗口内 */
  suppressed: boolean;
  /** 行为树输出：掩体目标（null = 不找掩体，走交战逻辑） */
  out: Vec3 | null;
}

export class Combatant {
  readonly id: number;
  readonly kind: EnemyId;
  readonly elite: boolean;
  readonly team: Team;
  readonly isAlly: boolean;
  /** Combatant 本身即满足 CombatantRef（玩家用包装对象区分） */
  readonly isPlayer = false;
  readonly def: EnemyDef;
  readonly scale: number;
  readonly maxHp: number;

  readonly body: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  readonly controller: RAPIER.KinematicCharacterController;

  hp: number;
  alive = true;
  removed = false;
  lastPos: Vec3 = { x: 0, y: 0, z: 0 };
  fade = 0;
  flash = 0;
  windup = 0;
  yaw = 0;

  private attackTimer: number;
  private windupTimer = 0;
  private strafeSign: number;
  private strafeTimer: number;
  private vy = 0;
  private blockedTimer = 0;
  private detourTimer = 0;
  /** 本帧锁定的目标（供 fire 使用） */
  private goalRef: CombatantRef | null = null;

  // ---- AI v2 专用状态（仅据点模式被驱动；生存模式全程保持初值，零影响） ----
  /** 目标连续可见时长（反应延迟的累积器，04_1 的 reactionSec 机制） */
  private seeTimer = 0;
  /** 距上次受击的秒数（Infinity = 从未受击） */
  private hurtAge = Infinity;
  /** 掩体重评估倒计时（避免每帧对全部掩体点做 LOS 扫描） */
  private coverSeekTimer = 0;
  /** 当前掩体目标（缓存 0.4s） */
  private coverTarget: Vec3 | null = null;
  /** ---- BFS 寻路状态（043 移植）----
   * pathTimer：重规划节流（0.6s，与 043 的 repath 周期一致）；
   * path：当前路径点序列；pathGoalKey：路径目标（目标挪动超阈值才重算）。 */
  private pathTimer = 0;
  private path: Vec3[] = [];
  private pathGoalKey: Vec3 | null = null;
  private pathDirX = 0;
  private pathDirZ = 0;
  private pathActive = false;
  /** ---- 卡死软复位（移植 043 的「净位移判定 + 软复位」）----
   *  每 2.5s 检查一次净位移；意图移动但几乎没挪窝 → 眨移到最近的导航节点。
   *  KCC 在旋转盒夹角等处会物理楔死，任何移动数学都救不回来，只能换位置。 */
  private unstuckTimer = 2.5;
  private unstuckPos: Vec3 | null = null;
  /** 行为树：Selector[ Sequence[被压制 → 找掩体], 交战兜底 ] */
  private readonly tree: BtNode<CombatBb> = new BtSelector<CombatBb>([
    new BtSequence<CombatBb>([
      new BtCondition<CombatBb>(
        (bb) => bb.suppressed && bb.self.goalRef !== null && bb.ctx.coverPoints !== undefined,
      ),
      new BtAction<CombatBb>((bb) => {
        const pt = bb.self.pickCoverPoint(bb.ctx);
        if (!pt) return 'failure';
        bb.out = pt;
        return 'success';
      }),
    ]),
    // 兜底：交战（不输出掩体目标，update 走 v1 同款交战移动逻辑）
    new BtAction<CombatBb>(() => 'success'),
  ]);

  constructor(
    world: RAPIER.World,
    id: number,
    kind: EnemyId,
    elite: boolean,
    team: Team,
    isAlly: boolean,
    pos: Vec3,
    rand: () => number,
  ) {
    this.id = id;
    this.kind = kind;
    this.elite = elite;
    this.team = team;
    this.isAlly = isAlly;
    this.scale = elite ? CONFIG.elite.scale : 1;

    const base = CONFIG.enemies[kind];
    this.def = elite
      ? {
          ...base,
          hp: Math.round(base.hp * CONFIG.elite.hpMul),
          speed: base.speed * CONFIG.elite.speedMul,
          damage: base.damage * CONFIG.elite.damageMul,
        }
      : base;
    this.maxHp = this.def.hp;
    this.hp = this.def.hp;

    const r = base.radius * this.scale;
    const hh = base.halfHeight * this.scale;
    // 与 Player 相同的 +2cm 悬空出生：底面恰好贴地会让第一步重力位移把胶囊压进地面，
    // KCC 慢速脱困期间横向移动被拒（敌人同样中招，表现为出生后短暂僵直）
    this.body = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(pos.x, pos.y + hh + r + 0.02, pos.z),
    );
    this.collider = world.createCollider(
      RAPIER.ColliderDesc.capsule(hh, r),
      this.body,
    );

    this.controller = world.createCharacterController(0.01);
    this.controller.setUp({ x: 0, y: 1, z: 0 });
    this.controller.enableAutostep(0.5, 0.25, true);
    this.controller.enableSnapToGround(0.35);
    this.controller.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
    this.controller.setApplyImpulsesToDynamicBodies(false);

    this.attackTimer = this.def.interval * (0.4 + rand() * 0.6);
    this.strafeSign = rand() < 0.5 ? -1 : 1;
    this.strafeTimer = CONFIG.enemy.strafeFlip * rand();
  }

  center(): Vec3 {
    if (this.removed) return this.lastPos;
    const t = this.body.translation();
    return { x: t.x, y: t.y, z: t.z };
  }

  eye(): Vec3 {
    const t = this.body.translation();
    return { x: t.x, y: t.y + this.def.halfHeight * this.scale * 0.55, z: t.z };
  }

  headY(): number {
    return this.center().y + this.def.halfHeight * this.scale * 0.6;
  }

  hurt(amount: number): boolean {
    if (!this.alive) return false;
    this.hp -= amount;
    this.flash = 0.12;
    this.hurtAge = 0; // v2 的「被压制」计时起点；v1 不读它，无副作用
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.fade = 0;
      return true;
    }
    return false;
  }

  update(dt: number, ctx: CombatantUpdateCtx): void {
    if (!this.alive) {
      this.fade = Math.min(1, this.fade + dt * 1.6);
      return;
    }
    if (this.flash > 0) this.flash -= dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;
    if (this.pathTimer > 0) this.pathTimer -= dt;
    this.pathActive = false;
    if (ctx.aiV2) this.hurtAge += dt;

    const pos = this.center();

    // ---- 选目标：最近的敌队战斗员（带视线判定）----
    let goalRef: CombatantRef | null = null;
    let goalPos: Vec3 | null = null;
    let goalEye: Vec3 | null = null;
    let bestD = Infinity;
    let goalLos = false;
    for (const t of ctx.targets) {
      if (!t.alive) continue;
      const tc = t.center();
      const d = distXZ(pos, tc);
      if (d >= bestD) continue;
      bestD = d;
      goalRef = t;
      goalPos = tc;
      goalEye = t.eye();
      const pointBlank = d < 3;
      goalLos =
        pointBlank ||
        hasLineOfSight(
          ctx.world,
          this.eye(),
          goalEye,
          this.collider,
          this.body,
          t.collider.handle,
          ctx.filterPredicate,
        );
    }
    this.goalRef = goalRef;

    const e = CONFIG.enemy;

    // ---- AI v2：反应延迟 + 行为树掩体决策（仅据点模式；生存模式跳过，红队逐帧等价旧版） ----
    let coverIntent: Vec3 | null = null;
    if (ctx.aiV2) {
      // 反应延迟：目标连续可见才累积 seeTimer，达到 reactionSec 才允许起手（04_1 机制）
      if (goalLos && goalRef) this.seeTimer += dt;
      else this.seeTimer = 0;

      // 行为树：被压制（低生命 + 最近受击在窗口内）→ 找掩体；否则交战兜底
      const bb: CombatBb = {
        self: this,
        ctx,
        suppressed:
          this.hp / this.maxHp <= CONFIG.ai.coverHpRatio && this.hurtAge <= CONFIG.ai.underFireWindow,
        out: null,
      };
      this.tree.tick(bb);
      coverIntent = bb.out;
    }

    // ---- 移动意图 ----
    let mx = 0;
    let mz = 0;
    if (coverIntent) {
      // 掩体意图：优先走 BFS 路径（绕箱堆），失败退回直线；进点后停住
      const dx = coverIntent.x - pos.x;
      const dz = coverIntent.z - pos.z;
      const d = Math.hypot(dx, dz);
      if (d > CONFIG.ai.coverArriveDist) {
        let moved = false;
        if (ctx.nav && d > 3) moved = this.followPath(ctx, coverIntent);
        if (!moved) {
          mx = dx / d;
          mz = dz / d;
        }
      }
    } else if (goalRef && goalPos) {
      // 与旧 Enemy 一致的交战距离数学（目标从玩家换成敌队战斗员）。
      // 差异点：无视线追击 / 近战冲刺时先尝试 BFS 路径（043 移植），
      // 路径不可用再退回直线——直线失败仍有后面的受阻切向绕行兜底。
      const dToGoal = bestD;
      const toG = normalize({ x: goalPos.x - pos.x, y: 0, z: goalPos.z - pos.z });
      if (this.def.attackType === 'melee') {
        if (dToGoal > this.def.range * 0.8) {
          let moved = false;
          if (ctx.nav && dToGoal > 3) moved = this.followPath(ctx, goalPos);
          if (!moved) {
            mx = toG.x;
            mz = toG.z;
          }
        }
      } else if (!goalLos) {
        if (dToGoal > 2.2) {
          let moved = false;
          if (ctx.nav && dToGoal > 3) moved = this.followPath(ctx, goalPos);
          if (!moved) {
            mx = toG.x;
            mz = toG.z;
          }
        }
      } else if (dToGoal > e.standoff + 1.5) {
        mx = toG.x;
        mz = toG.z;
      } else if (dToGoal < e.standoff - 2.5) {
        mx = -toG.x;
        mz = -toG.z;
      }
    } else if (ctx.isAlly && ctx.capturePoint) {
      // 友军无敌人目标：向据点推进（走 BFS 路径绕开箱堆）；进圈后驻守
      const cp = ctx.capturePoint;
      const dx = cp.x - pos.x;
      const dz = cp.z - pos.z;
      const dd = Math.hypot(dx, dz);
      if (dd > cp.r * 0.55) {
        let moved = false;
        if (ctx.nav && dd > 3) moved = this.followPath(ctx, { x: cp.x, y: 0, z: cp.z });
        if (!moved) {
          mx = dx / dd;
          mz = dz / dd;
        }
      } else {
        mx = 0;
        mz = 0;
      }
    }

    // 路径跟随的移动方向（followPath 成功时覆盖直线意图）
    if (this.pathActive) {
      mx = this.pathDirX;
      mz = this.pathDirZ;
    }

    // 卡死软复位：想移动但净位移≈0（持续 2.5s）→ 眨移到附近导航节点（043 移植）
    const mlRaw = Math.hypot(mx, mz);
    if (ctx.nav && mlRaw > 0.3) {
      this.unstuckTimer -= dt;
      if (this.unstuckTimer <= 0) {
        const p0 = this.center();
        if (this.unstuckPos && distXZ(p0, this.unstuckPos) < 0.6) {
          const node = ctx.nav.nearestFreeNode(p0.x, p0.z, 6, 1.5);
          if (node) {
            this.body.setTranslation({ x: node.x, y: node.y, z: node.z }, true);
            this.vy = 0;
          }
        }
        this.unstuckTimer = 2.5;
        this.unstuckPos = this.center();
      }
    } else {
      this.unstuckTimer = 2.5;
      this.unstuckPos = this.center();
    }

    // 侧移绕圈（路径跟随时不叠加——侧移会把 bot 拽离路径点）
    this.strafeTimer -= dt;
    if (this.strafeTimer <= 0) {
      this.strafeTimer = e.strafeFlip;
      this.strafeSign *= -1;
    }
    if (goalRef && goalPos && !coverIntent && !this.pathActive) {
      const gx = goalPos.x - pos.x;
      const gz = goalPos.z - pos.z;
      const gl = Math.hypot(gx, gz) || 1;
      // 与旧版 Enemy 逐帧等价：侧移是「朝目标方向」顺时针旋转 90°（即 (-gz, gx)），
      // 不是把 x 取反（(-gx, gz) 是镜像，会让敌人斜着后退而非横移，破坏交战距离数学）。
      mx += (-gz / gl) * this.strafeSign * e.strafe;
      mz += (gx / gl) * this.strafeSign * e.strafe;
    }

    // 相互排斥（同队），防止叠成一团
    for (const o of ctx.allies) {
      if (o === this || !o.alive) continue;
      const op = o.center();
      const dd = distXZ(pos, op);
      if (dd < e.separation && dd > 1e-4) {
        const push = ((e.separation - dd) / e.separation) * 1.4;
        mx += ((pos.x - op.x) / dd) * push;
        mz += ((pos.z - op.z) / dd) * push;
      }
    }
    const ml = Math.hypot(mx, mz);
    if (ml > 1) {
      mx /= ml;
      mz /= ml;
    }

    // 绕行模式：沿障碍切向走（带一点向内分量，避免绕着绕着跑远）
    if (this.detourTimer > 0) {
      this.detourTimer -= dt;
      const gx = goalPos ? (goalPos.x - pos.x) : 0;
      const gz = goalPos ? (goalPos.z - pos.z) : 0;
      const gl = Math.hypot(gx, gz) || 1;
      const ngx = gx / gl;
      const ngz = gz / gl;
      const dtx = -ngz * this.strafeSign + ngx * 0.35;
      const dtz = ngx * this.strafeSign + ngz * 0.35;
      const tl = Math.hypot(dtx, dtz) || 1;
      mx = dtx / tl;
      mz = dtz / tl;
    }

    // ---- 物理移动 ----
    this.vy += CONFIG.physics.gravity * dt;
    const t = this.body.translation();
    // 跳跃（043 的跳跃边在 04 KCC 上的对应实现）：
    //   1. 路径下一跳比脚下的高 0.35m 以上且已落地 → 起跳（上木箱塔 / 上台阶）
    //   2. 路径跟随时被挡 0.5s+ → 起跳一次（翻矮箱，避免对着箱壁平推到天荒地老）
    if (this.pathActive && this.path.length > 0 && this.controller.computedGrounded() && this.vy <= 0.01) {
      const wp = this.path[0]!;
      if (wp.y > t.y + 0.35) this.vy = CONFIG.player.jumpSpeed;
      else if (this.blockedTimer > 0.5) this.vy = CONFIG.player.jumpSpeed * 0.9;
    }
    const desired = {
      x: mx * this.def.speed * dt,
      y: this.vy * dt,
      z: mz * this.def.speed * dt,
    };
    this.controller.computeColliderMovement(this.collider, desired);
    const m = this.controller.computedMovement();
    this.body.setNextKinematicTranslation({ x: t.x + m.x, y: t.y + m.y, z: t.z + m.z });
    if (this.controller.computedGrounded() && this.vy < 0) this.vy = 0;

    // 受阻检测
    const wanted = Math.hypot(desired.x, desired.z);
    const actual = Math.hypot(m.x, m.z);
    if (wanted > 1e-5 && actual < wanted * 0.45) {
      this.blockedTimer += dt;
      if (this.blockedTimer > 0.25 && this.detourTimer <= 0) {
        this.detourTimer = 1.3;
        this.strafeSign *= -1;
        this.blockedTimer = 0;
      }
    } else {
      this.blockedTimer = Math.max(0, this.blockedTimer - dt * 2);
    }

    // 朝向：有目标朝目标，否则朝移动方向
    if (goalRef && goalPos) {
      this.yaw = Math.atan2(-(goalPos.x - pos.x), -(goalPos.z - pos.z));
    } else if (ml > 0.1) {
      this.yaw = Math.atan2(-mx, -mz);
    }

    // ---- 攻击 ----
    if (this.windupTimer > 0) {
      this.windupTimer -= dt;
      this.windup = 1 - Math.max(0, this.windupTimer) / this.def.windup;
      if (this.windupTimer <= 0) {
        this.windup = 0;
        this.attackTimer = this.def.interval;
        this.fire(ctx);
      }
      return;
    }

    const inRange = goalRef && goalPos ? distXZ(this.center(), goalPos) <= this.def.range : false;
    if (!inRange || this.attackTimer > 0) {
      this.windup = 0;
      return;
    }
    // v2：反应延迟 —— 目标可见时长不足 reactionSec 时不起手（持续可见后累积，丢失即清零）
    const readyToFire = !ctx.aiV2 || this.seeTimer >= CONFIG.ai.reactionSec;
    if (goalLos && readyToFire) {
      this.windupTimer = this.def.windup;
      this.windup = 0.01;
    } else {
      this.windup = 0;
    }
  }

  /**
   * BFS 路径跟随（043 移植）：0.6s 节流重规划，目标挪动 >2.5m 立即重算。
   * 成功产出本帧移动方向（pathDirX/Z）并置 pathActive → 返回 true；
   * 无导航 / 无路径 / 已抵达终点附近 → 返回 false（调用方退回直线逻辑）。
   */
  private followPath(ctx: CombatantUpdateCtx, goal: Vec3): boolean {
    if (!ctx.nav) return false;
    const pos = this.center();
    const gk = this.pathGoalKey;
    const goalMoved = !gk || distXZ(gk, goal) > 2.5;
    if (this.pathTimer <= 0 || goalMoved) {
      this.pathTimer = 0.6;
      this.pathGoalKey = { x: goal.x, y: 0, z: goal.z };
      this.path = ctx.nav.findPath(pos, goal) ?? [];
    }
    while (this.path.length > 0 && distXZ(this.path[0]!, pos) < 1.1) this.path.shift();
    if (this.path.length === 0) return false;
    const wp = this.path[0]!;
    const dx = wp.x - pos.x;
    const dz = wp.z - pos.z;
    const d = Math.hypot(dx, dz);
    if (d < 1e-4) return false;
    this.pathDirX = dx / d;
    this.pathDirZ = dz / d;
    this.pathActive = true;
    return true;
  }

  /**
   * v2 掩体查找：最近的「从当前最近敌人视角看不见」的掩体点。
   * 结果缓存 0.4s（coverSeekTimer），避免每帧对全部掩体点做 LOS 射线。
   * 纯确定性：点集由地图几何预计算，选择规则只用距离与 LOS，无随机。
   */
  pickCoverPoint(ctx: CombatantUpdateCtx): Vec3 | null {
    if (this.coverSeekTimer > 0) return this.coverTarget;
    this.coverSeekTimer = 0.4;
    this.coverTarget = null;

    const enemy = this.goalRef;
    const pts = ctx.coverPoints;
    if (!enemy || !pts || pts.length === 0) return null;

    const enemyEye = enemy.eye();
    const pos = this.center();
    let best: Vec3 | null = null;
    let bestD = Infinity;
    for (const p of pts) {
      const d = distXZ(pos, p);
      if (d >= bestD) continue;
      // 掩体点眼高（1.0m）与敌人眼位不通视 → 该点被遮挡，可作掩体
      const concealed = !hasLineOfSight(
        ctx.world,
        enemyEye,
        { x: p.x, y: 1.0, z: p.z },
        this.collider,
        this.body,
        undefined,
        ctx.filterPredicate,
      );
      if (!concealed) continue;
      bestD = d;
      best = p;
    }
    this.coverTarget = best;
    return best;
  }

  private fire(ctx: CombatantUpdateCtx): void {
    const eye = this.eye();
    const target = this.goalRef;

    if (this.def.attackType === 'melee') {
      if (target) {
        const d = distXZ(this.center(), target.center());
        if (d <= this.def.range * 1.15) {
          ctx.damage(target, this.def.damage, eye, { team: this.team, isPlayer: false });
        }
      }
      return;
    }

    if (!target || !target.eye) return;
    const targetEye = target.eye();
    const dir = spreadDir(normalize(sub(targetEye, eye)), this.def.spread, ctx.rand);
    ctx.events.push({ type: 'enemyShot', kind: this.kind, origin: eye, dir });
    const hit = castRay(ctx.world, eye, dir, this.def.range * 1.3, this.collider, undefined, ctx.filterPredicate);
    if (!hit) return;
    const ref = ctx.byCollider.get(hit.colliderHandle);
    // 同队命中（理论上 predicate 已排除，这里双保险）+ 目标必须是敌队才造成伤害
    if (!ref || ref.team === this.team) return;
    ctx.damage(ref, this.def.damage, eye, { team: this.team, isPlayer: false });
  }
}
