/**
 * 通用角色控制器 —— Rapier KinematicCharacterController 封装。
 * 玩家与 AI 共用同一套移动语义（这样「AI 跑动」和「玩家跑动」手感一致）。
 *
 * 相对 04 的 FPS 版：去掉生命/受击，保留土狼时间与空中控制衰减；
 * 新增 velocity()（带球辅助需要玩家真实速度）。
 */
import RAPIER from '@dimforge/rapier3d-compat';
import { CONFIG } from '../core/config';
import type { Vec3 } from './types';
import { dirFromAngles, rightFromYaw } from './vecmath';

export interface CharacterOpts {
  radius: number;
  halfHeight: number;
  walkSpeed: number;
  sprintSpeed: number;
  jumpSpeed: number;
}

export interface MoveIntent {
  forward: number;
  right: number;
  yaw: number;
  jump: boolean;
  sprint: boolean;
}

export class Character {
  readonly body: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  readonly controller: RAPIER.KinematicCharacterController;

  vy = 0;
  grounded = false;

  private readonly opts: CharacterOpts;
  private coyote = 0;
  private prev: Vec3;

  constructor(world: RAPIER.World, spawn: Vec3, opts: CharacterOpts) {
    this.opts = opts;
    const y = spawn.y + opts.halfHeight + opts.radius;
    this.body = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(spawn.x, y, spawn.z),
    );
    this.collider = world.createCollider(
      RAPIER.ColliderDesc.capsule(opts.halfHeight, opts.radius),
      this.body,
    );

    this.controller = world.createCharacterController(0.01);
    this.controller.setUp({ x: 0, y: 1, z: 0 });
    this.controller.enableAutostep(0.45, 0.2, true);
    this.controller.enableSnapToGround(0.35);
    this.controller.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
    this.controller.setMinSlopeSlideAngle((35 * Math.PI) / 180);
    // 允许角色推动动态刚体（这样走路会顶到球，而不是穿过去）
    this.controller.setApplyImpulsesToDynamicBodies(true);

    this.prev = { x: spawn.x, y: 0, z: spawn.z };
  }

  pos(): Vec3 {
    const t = this.body.translation();
    return { x: t.x, y: t.y, z: t.z };
  }

  eye(eyeOffset: number): Vec3 {
    const t = this.body.translation();
    return { x: t.x, y: t.y + eyeOffset, z: t.z };
  }

  /** 上一帧的水平速度（带球辅助用） */
  velocity(): Vec3 {
    const t = this.body.translation();
    const dt = 1 / 60;
    return { x: (t.x - this.prev.x) / dt, y: 0, z: (t.z - this.prev.z) / dt };
  }

  update(dt: number, m: MoveIntent): void {
    const fwd = dirFromAngles(m.yaw, 0);
    const right = rightFromYaw(m.yaw);
    let wx = fwd.x * m.forward + right.x * m.right;
    let wz = fwd.z * m.forward + right.z * m.right;
    const wl = Math.hypot(wx, wz);
    if (wl > 1) {
      wx /= wl;
      wz /= wl;
    }
    const speed = m.sprint && m.forward > 0.1 ? this.opts.sprintSpeed : this.opts.walkSpeed;
    const airCtl = this.grounded ? 1 : 0.62;

    if (m.jump && (this.grounded || this.coyote > 0)) {
      this.vy = this.opts.jumpSpeed;
      this.grounded = false;
      this.coyote = 0;
    }

    this.vy += CONFIG.physics.gravity * dt;

    const desired = { x: wx * speed * airCtl * dt, y: this.vy * dt, z: wz * speed * airCtl * dt };
    this.controller.computeColliderMovement(this.collider, desired);
    const mv = this.controller.computedMovement();
    const grounded = this.controller.computedGrounded();

    const t = this.body.translation();
    this.body.setNextKinematicTranslation({ x: t.x + mv.x, y: t.y + mv.y, z: t.z + mv.z });

    if (grounded && this.vy < 0) this.vy = 0;
    if (this.grounded && !grounded) this.coyote = 0.12;
    else if (grounded) this.coyote = 0;
    else if (this.coyote > 0) this.coyote -= dt;
    this.grounded = grounded;

    this.prev = { x: t.x, y: t.y, z: t.z };
  }

  /** 重新放置（开球 / 进球后重置） */
  place(spawn: Vec3): void {
    const y = spawn.y + this.opts.halfHeight + this.opts.radius;
    this.body.setTranslation({ x: spawn.x, y, z: spawn.z }, true);
    this.body.setNextKinematicTranslation({ x: spawn.x, y, z: spawn.z });
    this.vy = 0;
    this.grounded = false;
    this.prev = { x: spawn.x, y, z: spawn.z };
  }
}
