/**
 * 第一人称角色控制器 —— Rapier KinematicCharacterController 封装。
 *
 * 相对 03 的载具控制器，这里多三件 FPS 特有问题：
 *   1. 土狼时间（coyote）：离开地面后 0.12s 内仍可跳，避免边缘起跳被吞
 *   2. 空中控制衰减：空中转向能力打折，否则空中变向像在地面一样灵活
 *   3. 脚步事件：sim 层产出 footstep 事件供音频消费（sim 本身不碰 WebAudio）
 */
import RAPIER from '@dimforge/rapier3d-compat';
import { CONFIG } from '../core/config';
import type { GameInput, SimEvent, Vec3 } from './types';
import { dirFromAngles, rightFromYaw } from './vecmath';

export class Player {
  readonly body: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  readonly controller: RAPIER.KinematicCharacterController;

  hp: number;
  vy = 0;
  grounded = false;
  hurtTimer = 0;

  private coyote = 0;
  private footTimer = 0;

  constructor(world: RAPIER.World, spawn: Vec3) {
    const p = CONFIG.player;
    // 抬升 2cm 让胶囊落体着陆：若底面恰好贴地（y=spawn.y+hh+r），第一步重力位移
    // (26·dt²≈7.2mm) 会把胶囊压进地面，KCC 陷入慢速脱困（0.1mm/步），横向移动被拒
    // 整整 1 秒（实测 ship 出生点钉 60 步）。悬空出生则一步内干净落地。
    const y = spawn.y + p.halfHeight + p.radius + 0.02;
    this.body = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(spawn.x, y, spawn.z),
    );
    this.collider = world.createCollider(
      RAPIER.ColliderDesc.capsule(p.halfHeight, p.radius),
      this.body,
    );

    this.controller = world.createCharacterController(0.01);
    this.controller.setUp({ x: 0, y: 1, z: 0 });
    this.controller.enableAutostep(0.45, 0.2, true);
    this.controller.enableSnapToGround(0.35);
    this.controller.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
    this.controller.setMinSlopeSlideAngle((35 * Math.PI) / 180);
    // 敌人同样是 kinematic，不需要把冲量推给动态刚体
    this.controller.setApplyImpulsesToDynamicBodies(false);

    this.hp = p.maxHp;
  }

  pos(): Vec3 {
    const t = this.body.translation();
    return { x: t.x, y: t.y, z: t.z };
  }

  /** 眼睛位置（射击原点、相机位置） */
  eye(): Vec3 {
    const t = this.body.translation();
    return { x: t.x, y: t.y + CONFIG.player.eyeOffset, z: t.z };
  }

  update(dt: number, input: GameInput, events: SimEvent[]): void {
    const p = CONFIG.player;
    if (this.hurtTimer > 0) this.hurtTimer -= dt;

    // 移动意图 → 世界方向（以 yaw 为基准）
    const fwd = dirFromAngles(input.yaw, 0);
    const right = rightFromYaw(input.yaw);
    let wx = fwd.x * input.forward + right.x * input.right;
    let wz = fwd.z * input.forward + right.z * input.right;
    const wl = Math.hypot(wx, wz);
    if (wl > 1) {
      wx /= wl;
      wz /= wl;
    }
    const moving = wl > 0.1;
    // ADS 开镜减速（移植自 04_1：开镜移速 3.9/6.0 ≈ 0.62），且开镜时不可疾跑
    const speed =
      input.ads && !input.sprint
        ? p.walkSpeed * p.ads.speedMul
        : input.sprint && input.forward > 0.1
          ? p.sprintSpeed
          : p.walkSpeed;
    const airCtl = this.grounded ? 1 : 0.62;

    // 跳跃（含土狼时间）
    if (input.jump && (this.grounded || this.coyote > 0)) {
      this.vy = p.jumpSpeed;
      this.grounded = false;
      this.coyote = 0;
    }

    this.vy += CONFIG.physics.gravity * dt;

    const desired = {
      x: wx * speed * airCtl * dt,
      y: this.vy * dt,
      z: wz * speed * airCtl * dt,
    };
    this.controller.computeColliderMovement(this.collider, desired);
    const m = this.controller.computedMovement();
    const grounded = this.controller.computedGrounded();

    const t = this.body.translation();
    this.body.setNextKinematicTranslation({ x: t.x + m.x, y: t.y + m.y, z: t.z + m.z });

    if (grounded && this.vy < 0) this.vy = 0;
    if (this.grounded && !grounded) this.coyote = 0.12;
    else if (grounded) this.coyote = 0;
    else if (this.coyote > 0) this.coyote -= dt;
    this.grounded = grounded;

    // 脚步（供音频层消费；sim 不碰 WebAudio）
    if (grounded && moving) {
      this.footTimer -= dt * (input.sprint ? 1.35 : 1);
      if (this.footTimer <= 0) {
        this.footTimer = 0.34;
        events.push({ type: 'footstep', speed: input.sprint ? p.sprintSpeed : p.walkSpeed });
      }
    } else if (!moving) {
      this.footTimer = 0.1;
    }
  }

  /** 受伤；hurtCooldown 内的重复伤害被吞掉（防同帧多点命中秒杀） */
  hurt(amount: number, from: Vec3, events: SimEvent[]): void {
    if (this.hurtTimer > 0) return;
    this.hp = Math.max(0, this.hp - amount);
    this.hurtTimer = CONFIG.player.hurtCooldown;
    events.push({ type: 'playerHurt', amount, from, hp: this.hp });
  }

  heal(ratio: number): void {
    this.hp = Math.min(CONFIG.player.maxHp, this.hp + CONFIG.player.maxHp * ratio);
  }
}
