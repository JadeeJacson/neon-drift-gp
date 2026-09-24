/**
 * 敌人 AI —— 三种行为：接近 / 侧移绕圈 / 出手（带可读的预警窗口）。
 *
 * 设计原则：**威胁必须可读**。每种敌人开火前都有 windup（预警），
 * 狙击手的预警最长（0.9s）以匹配它最高的伤害。没有预警的高伤害 = 玩家觉得不公平。
 */
import RAPIER from '@dimforge/rapier3d-compat';
import { CONFIG } from '../core/config';
import type { EnemyDef, EnemyId } from '../core/config';
import type { SimEvent, Vec3 } from './types';
import { castRay, hasLineOfSight, spreadDir } from './shooting';
import { distXZ, normalize, sub } from './vecmath';

export interface EnemyUpdateCtx {
  world: RAPIER.World;
  playerPos: Vec3;
  playerEye: Vec3;
  playerCollider: RAPIER.Collider;
  others: Enemy[];
  rand: () => number;
  events: SimEvent[];
  damagePlayer: (amount: number, from: Vec3) => void;
}

export class Enemy {
  readonly id: number;
  readonly kind: EnemyId;
  readonly elite: boolean;
  readonly def: EnemyDef;
  readonly scale: number;
  readonly maxHp: number;

  readonly body: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  readonly controller: RAPIER.KinematicCharacterController;

  hp: number;
  alive = true;
  /** 物理体是否已从世界移除（死后立刻移除，尸体不该继续挡子弹） */
  removed = false;
  /** 移除物理体后保留的最后位置，供渲染层播消散动画 */
  lastPos: Vec3 = { x: 0, y: 0, z: 0 };
  /** 死亡消散进度 0..1 */
  fade = 0;
  /** 受击闪白剩余时间 */
  flash = 0;
  /** 出手预警进度 0..1（>0 时渲染层画指示线） */
  windup = 0;
  yaw = 0;

  private attackTimer: number;
  private windupTimer = 0;
  private strafeSign: number;
  private strafeTimer: number;
  private vy = 0;
  /** 连续受阻时长（实际位移远小于期望位移） */
  private blockedTimer = 0;
  /** 绕行剩余时长：受阻后沿障碍切向走，避免贴着掩体来回蹭 */
  private detourTimer = 0;

  constructor(
    world: RAPIER.World,
    id: number,
    kind: EnemyId,
    elite: boolean,
    pos: Vec3,
    rand: () => number,
  ) {
    this.id = id;
    this.kind = kind;
    this.elite = elite;
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

  /** 射击原点（约在胸高） */
  eye(): Vec3 {
    const t = this.body.translation();
    return { x: t.x, y: t.y + this.def.halfHeight * this.scale * 0.55, z: t.z };
  }

  /** 爆头判定线：命中点高于此线即算头部 */
  headY(): number {
    return this.center().y + this.def.halfHeight * this.scale * 0.6;
  }

  /** 返回是否致死 */
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

  update(dt: number, ctx: EnemyUpdateCtx): void {
    if (!this.alive) {
      this.fade = Math.min(1, this.fade + dt * 1.6);
      return;
    }
    if (this.flash > 0) this.flash -= dt;
    if (this.attackTimer > 0) this.attackTimer -= dt;

    const pos = this.center();
    const dToPlayer = distXZ(pos, ctx.playerPos);
    const toP = normalize({ x: ctx.playerPos.x - pos.x, y: 0, z: ctx.playerPos.z - pos.z });

    // ---- 视线（先算，用于决定「维持交战距离」还是「压上去」）----
    const eye = this.eye();
    // 贴脸豁免：3m 内不再做视线判定。否则一道掩体的「擦边角」就能让贴身的双方
    // 互相判为无视线 —— 谁都不开火、谁都不后退，直接死锁。
    const pointBlank = dToPlayer < 3;
    const los =
      pointBlank ||
      hasLineOfSight(
        ctx.world,
        eye,
        ctx.playerEye,
        this.collider,
        this.body,
        ctx.playerCollider.handle,
      );

    // ---- 移动意图 ----
    const e = CONFIG.enemy;
    let mx = 0;
    let mz = 0;
    if (this.def.attackType === 'melee') {
      if (dToPlayer > this.def.range * 0.8) {
        mx = toP.x;
        mz = toP.z;
      }
    } else if (!los) {
      // 看不见玩家就压上去 —— 否则会永远停在掩体背面，形成双方都打不到的僵局。
      // 但别贴到玩家身上：把玩家挤在掩体与敌人之间会让双方都动不了。
      if (dToPlayer > 2.2) {
        mx = toP.x;
        mz = toP.z;
      }
    } else if (dToPlayer > e.standoff + 1.5) {
      mx = toP.x;
      mz = toP.z;
    } else if (dToPlayer < e.standoff - 2.5) {
      mx = -toP.x;
      mz = -toP.z;
    }

    // 侧移绕圈，避免站桩挨打
    this.strafeTimer -= dt;
    if (this.strafeTimer <= 0) {
      this.strafeTimer = e.strafeFlip;
      this.strafeSign *= -1;
    }
    mx += -toP.z * this.strafeSign * e.strafe;
    mz += toP.x * this.strafeSign * e.strafe;

    // 相互排斥，防止叠成一团
    for (const o of ctx.others) {
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

    // 绕行模式：沿障碍切向走（带一点向内的分量，避免绕着绕着跑远）
    if (this.detourTimer > 0) {
      this.detourTimer -= dt;
      const tx = -toP.z * this.strafeSign + toP.x * 0.35;
      const tz = toP.x * this.strafeSign + toP.z * 0.35;
      const tl = Math.hypot(tx, tz) || 1;
      mx = tx / tl;
      mz = tz / tl;
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

    // 受阻检测：期望位移远大于实际位移 = 贴着掩体蹭
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

    // 朝向玩家（yaw 约定：0 = 朝 -Z）
    this.yaw = Math.atan2(-toP.x, -toP.z);

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

    const inRange = dToPlayer <= this.def.range;
    if (!inRange || this.attackTimer > 0) {
      this.windup = 0;
      return;
    }
    if (los) {
      this.windupTimer = this.def.windup;
      this.windup = 0.01;
    } else {
      this.windup = 0;
    }
  }

  private fire(ctx: EnemyUpdateCtx): void {
    const eye = this.eye();
    const target = ctx.playerEye;

    if (this.def.attackType === 'melee') {
      const d = distXZ(this.center(), ctx.playerPos);
      if (d <= this.def.range * 1.15) {
        ctx.damagePlayer(this.def.damage, eye);
      }
      return;
    }

    const dir = spreadDir(normalize(sub(target, eye)), this.def.spread, ctx.rand);
    ctx.events.push({ type: 'enemyShot', kind: this.kind, origin: eye, dir });
    const hit = castRay(ctx.world, eye, dir, this.def.range * 1.3, this.collider, undefined);
    if (hit && hit.colliderHandle === ctx.playerCollider.handle) {
      ctx.damagePlayer(this.def.damage, eye);
    }
  }
}
