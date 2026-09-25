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
  /** 伤害分发：命中敌队目标时回调（内部按 player / 战斗员分流） */
  damage: (target: CombatantRef, amount: number, from: Vec3) => void;
  /** 全部战斗员的 collider → ref 映射（射线命中后查目标） */
  byCollider: Map<number, CombatantRef>;
  /** 据点（仅友军推进用） */
  capturePoint: { x: number; z: number; r: number } | null;
  /** 自己是否蓝队友军（决定无敌人时是否去占点） */
  isAlly: boolean;
  /** 队伍过滤：返回 false 的碰撞体被射线跳过（同队不互伤 / 不挡视线）。
   *  生存模式为 undefined（与旧版 Enemy 逐帧等价：同队会互相挡视线）。 */
  filterPredicate?: (collider: RAPIER.Collider) => boolean;
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
    this.body = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(pos.x, pos.y + hh + r, pos.z),
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

    // ---- 移动意图 ----
    let mx = 0;
    let mz = 0;
    if (goalRef && goalPos) {
      // 与旧 Enemy 完全一致的移动逻辑（目标从玩家换成敌队战斗员）
      const dToGoal = bestD;
      const toG = normalize({ x: goalPos.x - pos.x, y: 0, z: goalPos.z - pos.z });
      if (this.def.attackType === 'melee') {
        if (dToGoal > this.def.range * 0.8) {
          mx = toG.x;
          mz = toG.z;
        }
      } else if (!goalLos) {
        if (dToGoal > 2.2) {
          mx = toG.x;
          mz = toG.z;
        }
      } else if (dToGoal > e.standoff + 1.5) {
        mx = toG.x;
        mz = toG.z;
      } else if (dToGoal < e.standoff - 2.5) {
        mx = -toG.x;
        mz = -toG.z;
      }
    } else if (ctx.isAlly && ctx.capturePoint) {
      // 友军无敌人目标：向据点推进；进圈后驻守（设计笔记里的「占点」态）
      const cp = ctx.capturePoint;
      const dx = cp.x - pos.x;
      const dz = cp.z - pos.z;
      const dd = Math.hypot(dx, dz);
      if (dd > cp.r * 0.55) {
        mx = dx / dd;
        mz = dz / dd;
      } else {
        // 在圈内：原地小幅游走，不扎堆
        mx = 0;
        mz = 0;
      }
    }

    // 侧移绕圈，避免站桩挨打（敌队目标存在时才侧移；占点驻守时不过度绕）
    this.strafeTimer -= dt;
    if (this.strafeTimer <= 0) {
      this.strafeTimer = e.strafeFlip;
      this.strafeSign *= -1;
    }
    if (goalRef && goalPos) {
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
    const desired = {
      x: mx * this.def.speed * dt,
      y: this.vy * dt,
      z: mz * this.def.speed * dt,
    };
    this.controller.computeColliderMovement(this.collider, desired);
    const m = this.controller.computedMovement();
    const t = this.body.translation();
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
    if (goalLos) {
      this.windupTimer = this.def.windup;
      this.windup = 0.01;
    } else {
      this.windup = 0;
    }
  }

  private fire(ctx: CombatantUpdateCtx): void {
    const eye = this.eye();
    const target = this.goalRef;

    if (this.def.attackType === 'melee') {
      if (target) {
        const d = distXZ(this.center(), target.center());
        if (d <= this.def.range * 1.15) ctx.damage(target, this.def.damage, eye);
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
    ctx.damage(ref, this.def.damage, eye);
  }
}
