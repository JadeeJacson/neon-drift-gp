/**
 * 足球 —— Rapier 动态球体刚体。
 *
 * 拟真物理的三处「Rapier 不给你、必须自己加」的部分（立项探针实测）：
 *   1. 滚动阻力：Rapier 不模拟，手动施加常量减速度（否则球滚 40m 不停）
 *   2. Magnus 弧线：Rapier 不原生模拟，手动施加 F = K·(ω×v)（香蕉球）
 *   3. 恢复系数是「平均合成」：球与地面/墙都要设高弹性，球才够弹
 */
import RAPIER from '@dimforge/rapier3d-compat';
import { CONFIG } from '../core/config';
import type { Vec3 } from './types';
import { cross, scale, v3 } from './vecmath';

export class Ball {
  readonly body: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  /** NaN 哨兵（bot 跑分用） */
  nan = false;
  /**
   * 带球辅助锁定剩余时间（秒）。踢球后置为 kickLock，倒计时内禁止带球辅助，
   * 否则刚踢出的球会被 dribbleAssist 立刻拉回脚前 —— 射门退化成带球。
   */
  private lockT = 0;

  constructor(world: RAPIER.World, spawn: Vec3) {
    const b = CONFIG.ball;
    this.body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(spawn.x, spawn.y, spawn.z)
        .setLinearDamping(b.linearDamping)
        .setAngularDamping(b.angularDamping)
        .setCcdEnabled(true),
    );
    this.collider = world.createCollider(
      RAPIER.ColliderDesc.ball(b.radius)
        .setRestitution(b.restitution)
        .setFriction(b.friction)
        .setDensity(b.density)
        // 必须显式开启碰撞事件，否则 eventQueue.drainCollisionEvents 永远为空
        // → 「弹跳音效」一次都不会触发（实测弹跳计数恒为 0）。
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      this.body,
    );
  }

  pos(): Vec3 {
    const t = this.body.translation();
    return { x: t.x, y: t.y, z: t.z };
  }

  vel(): Vec3 {
    const v = this.body.linvel();
    return { x: v.x, y: v.y, z: v.z };
  }

  angvel(): Vec3 {
    const w = this.body.angvel();
    return { x: w.x, y: w.y, z: w.z };
  }

  quat(): { x: number; y: number; z: number; w: number } {
    const q = this.body.rotation();
    return { x: q.x, y: q.y, z: q.z, w: q.w };
  }

  speed(): number {
    const v = this.vel();
    return Math.hypot(v.x, v.y, v.z);
  }

  /** 带球辅助是否处于锁定窗口（刚踢出球后） */
  get locked(): boolean {
    return this.lockT > 0;
  }

  /** 在 world.step 之前调用：滚动阻力 + Magnus + 限速 + 解锁倒计时 */
  applyForces(dt: number): void {
    if (this.lockT > 0) this.lockT = Math.max(0, this.lockT - dt);
    const b = CONFIG.ball;
    const v = this.vel();
    const w = this.angvel();
    const mass = this.body.mass();

    // 1. 滚动阻力：常量减速度，方向与水平速度相反
    const vh = Math.hypot(v.x, v.z);
    if (vh > 1e-4) {
      const dec = Math.min(vh, b.rollingResistance * dt);
      this.body.applyImpulse(
        { x: (-v.x / vh) * dec * mass, y: 0, z: (-v.z / vh) * dec * mass },
        true,
      );
    }

    // 2. Magnus：F = K·(ω×v)
    const f = cross(w, v);
    const k = b.magnus * dt;
    this.body.applyImpulse({ x: f.x * k, y: f.y * k, z: f.z * k }, true);

    // 3. 限速（防穿模）
    const sp = this.speed();
    if (sp > b.maxSpeed) {
      const s = b.maxSpeed / sp;
      this.body.setLinvel({ x: v.x * s, y: v.y * s, z: v.z * s }, true);
    }

    const p = this.pos();
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) this.nan = true;
  }

  /** 踢球：设置水平速度 + 抬升，并给一点旋转（脚背抽射） */
  kick(dir: Vec3, speed: number): void {
    this.lockT = CONFIG.ball.kickLock;
    this.body.setLinvel({ x: dir.x * speed, y: dir.y * speed, z: dir.z * speed }, true);
    // 侧旋由踢球方向水平分量决定（供 Magnus 产生弧线）
    const spin = CONFIG.ball.kickSpin;
    this.body.setAngvel({ x: dir.z * spin, y: 0, z: -dir.x * spin }, true);
  }

  applyImpulse(imp: Vec3): void {
    this.body.applyImpulse({ x: imp.x, y: imp.y, z: imp.z }, true);
  }

  reset(spawn: Vec3): void {
    this.body.setTranslation({ x: spawn.x, y: spawn.y, z: spawn.z }, true);
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    this.nan = false;
    this.lockT = 0;
  }
}

/** 便捷：从球指向某点的水平方向 + 抬升，单位化 */
export function aimDirXZ(from: Vec3, to: Vec3, lift: number): Vec3 {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const l = Math.hypot(dx, dz) || 1;
  const h = { x: dx / l, y: 0, z: dz / l };
  const d = v3(h.x, lift, h.z);
  return scale(d, 1 / Math.hypot(d.x, d.y, d.z));
}
