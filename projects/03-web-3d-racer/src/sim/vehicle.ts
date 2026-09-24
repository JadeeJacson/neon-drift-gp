/**
 * 载具封装：Rapier 的 DynamicRayCastVehicleController（射线投射车轮 + 悬挂）。
 *
 * 手感旋钮全部来自 config.ts；本文件不硬编码任何调校数值。
 * 额外做了三件引擎没有的事：
 *   1. 转向平滑（steerRate）——按键直接给满舵会像开关，不像方向盘
 *   2. 高速转向衰减（steerSpeedFalloff）——防高速一打方向就失控甩尾
 *   3. 空气阻力与下压力——给极速上限与高速稳定性
 */
import RAPIER from '@dimforge/rapier3d-compat';
import { CONFIG } from '../core/config';
import type { DriveInput } from './drive';

export interface Vec3 { x: number; y: number; z: number }
export interface Quat { x: number; y: number; z: number; w: number }

export interface WheelState {
  /** 底盘局部坐标下的连接点 */
  connection: Vec3;
  /** 悬挂压缩后的世界位置（渲染用） */
  world: Vec3;
  steer: number;
  /** 车轮自转角（渲染花纹滚动） */
  rotation: number;
  /** 是否接地 */
  grounded: boolean;
}

export interface Vehicle {
  chassis: RAPIER.RigidBody;
  controller: RAPIER.DynamicRayCastVehicleController;
  /** 当前实际转向角（弧度，已平滑） */
  steer: number;
  apply(inp: DriveInput, dt: number): void;
  update(dt: number): void;
  speed(): number;
  speedKmh(): number;
  pos(): Vec3;
  quat(): Quat;
  /** 车头朝向（水平） */
  heading(): number;
  /** 车体世界上方向向量的 y 分量（1=正立，≈0=侧翻/倒置） */
  upY(): number;
  wheels(): WheelState[];
  /** 传送到指定位姿（重置用） */
  teleport(pos: Vec3, yaw: number): void;
  /** 施加外力（撞击反馈等） */
  reset(): void;
  /** 施加水平外力（软边界推回用），不影响竖直 */
  push(fx: number, fz: number): void;
}

export interface SpawnPose { pos: Vec3; yaw: number }

export function createVehicle(world: RAPIER.World, spawn: SpawnPose, friction: number): Vehicle {
  const V = CONFIG.vehicle;
  const he = V.halfExtents;

  const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(spawn.pos.x, spawn.pos.y, spawn.pos.z)
    .setRotation({ x: 0, y: Math.sin(spawn.yaw / 2), z: 0, w: Math.cos(spawn.yaw / 2) })
    .setLinearDamping(V.linearDamping)
    .setAngularDamping(V.angularDamping);
  const chassis = world.createRigidBody(bodyDesc);

  // 主车身
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(he.x, he.y, he.z).setDensity(V.density).setFriction(friction),
    chassis,
  );
  // 底部配重：把质心压低，显著减少翻车（比调质心 API 更可靠）
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(he.x * 0.8, 0.16, he.z * 0.82)
      .setTranslation(0, V.centerOfMassY, 0)
      .setDensity(V.density * 7)
      .setFriction(friction),
    chassis,
  );

  const controller = world.createVehicleController(chassis);
  const W = V.wheel;
  for (const m of W.mounts) {
    // 轮轴方向决定车辆前进方向（Rapier 内部取 axle × suspension）：
    // 实测 axle=(1,0,0) 会让车朝车身 -Z 方向前进（倒着开），故取 (-1,0,0) 使车头 = 车身 +Z。
    controller.addWheel(
      { x: m.x, y: m.y, z: m.z },
      { x: 0, y: -1, z: 0 },
      { x: -1, y: 0, z: 0 },
      W.suspensionRest,
      W.radius,
    );
  }
  for (let i = 0; i < W.mounts.length; i++) {
    controller.setWheelSuspensionStiffness(i, W.suspensionStiffness);
    controller.setWheelMaxSuspensionTravel(i, W.maxSuspensionTravel);
    controller.setWheelFrictionSlip(i, W.frictionSlip * (friction / 1.8));
    controller.setWheelSideFrictionStiffness(i, W.sideFrictionStiffness * (friction / 1.8));
    try {
      controller.setWheelSuspensionCompression(i, W.suspensionCompression);
      controller.setWheelSuspensionRelaxation(i, W.suspensionRelaxation);
    } catch { /* 版本差异：忽略 */ }
  }

  const veh: Vehicle = {
    chassis,
    controller,
    steer: 0,
    apply(inp: DriveInput, dt: number) {
      const speed = Math.abs(this.speed());
      // 高速转向衰减
      const falloff = 1 / (1 + speed * V.steerSpeedFalloff);
      const target = inp.steer * V.maxSteer * falloff;
      // 转向平滑
      const k = Math.min(1, V.steerRate * dt);
      this.steer += (target - this.steer) * k;
      // 符号约定：输入 steer 为正 = 车头向左（yaw 增大）。
      // （配合 axle=(-1,0,0) 的车头定义，实测该符号满足此约定）
      controller.setWheelSteering(0, this.steer);
      controller.setWheelSteering(1, this.steer);

      // 后轮驱动
      const engine = inp.throttle * V.engineForce;
      controller.setWheelEngineForce(2, engine);
      controller.setWheelEngineForce(3, engine);

      // —— 刹车 / 倒车 ——
      // 用车头方向的局部速度判断：局部 z>0.5 = 在向前走（按 S = 刹车）；
      // 局部 z<=0.5 = 停住或在后退（按 S = 倒车档）。
      // 这样倒车时局部 z 变负，条件持续满足，不会在 1.5m/s 处振荡。
      const lv = chassis.linvel();
      // 把世界速度变换到车身局部坐标（只取 yaw）
      const cy = Math.cos(-this.heading()), sy = Math.sin(-this.heading());
      const localVz = lv.x * sy + lv.z * cy;
      const movingForward = localVz > 0.5;

      if (inp.reverse && !movingForward) {
        // 倒车档：后轮反向驱动（力稍小）
        const revF = -inp.brake * V.engineForce * 0.6;
        controller.setWheelEngineForce(2, revF);
        controller.setWheelEngineForce(3, revF);
        for (let i = 0; i < 4; i++) controller.setWheelBrake(i, 0);
      } else {
        const brake = inp.brake * V.brakeForce;
        for (let i = 0; i < 4; i++) controller.setWheelBrake(i, brake);
      }
      if (inp.handbrake) {
        controller.setWheelBrake(2, V.handbrakeForce);
        controller.setWheelBrake(3, V.handbrakeForce);
      }

      // 空气阻力（限制极速）+ 下压力（高速稳定）
      const v = chassis.linvel();
      const vh = Math.hypot(v.x, v.z);
      if (vh > 0.01) {
        const drag = V.dragCoefficient * vh * vh;
        chassis.applyImpulse({ x: -v.x / vh * drag * dt, y: 0, z: -v.z / vh * drag * dt }, true);
      }
      chassis.applyImpulse({ x: 0, y: -V.downforce * vh * dt, z: 0 }, true);
    },
    update(dt: number) {
      controller.updateVehicle(dt);
    },
    speed() {
      const v = chassis.linvel();
      return Math.hypot(v.x, v.z);
    },
    speedKmh() {
      return this.speed() * 3.6;
    },
    pos() {
      const t = chassis.translation();
      return { x: t.x, y: t.y, z: t.z };
    },
    quat() {
      const r = chassis.rotation();
      return { x: r.x, y: r.y, z: r.z, w: r.w };
    },
    heading() {
      const r = chassis.rotation();
      // 车身 +Z 为车头方向，绕 Y 的偏航角
      return Math.atan2(2 * (r.w * r.y + r.x * r.z), 1 - 2 * (r.y * r.y + r.x * r.x));
    },
    upY() {
      const r = chassis.rotation();
      // 车体局部 +Y 经四元数旋转后世界向量的 y 分量 = 1 - 2(x² + z²)
      return 1 - 2 * (r.x * r.x + r.z * r.z);
    },
    wheels(): WheelState[] {
      const out: WheelState[] = [];
      for (let i = 0; i < W.mounts.length; i++) {
        const m = W.mounts[i]!;
        let wp: { x: number; y: number; z: number } | null = null;
        try {
          wp = controller.wheelContactPoint(i) ?? null;
        } catch { wp = null; }
        const grounded = !!wp;
        out.push({
          connection: { x: m.x, y: m.y, z: m.z },
          world: wp ?? { x: m.x, y: m.y - W.suspensionRest, z: m.z },
          steer: controller.wheelSteering(i) ?? 0,
          rotation: controller.wheelRotation(i) ?? 0,
          grounded,
        });
      }
      return out;
    },
    teleport(pos: Vec3, yaw: number) {
      chassis.setTranslation({ x: pos.x, y: pos.y, z: pos.z }, true);
      chassis.setRotation({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) }, true);
      chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
      chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);
      this.steer = 0;
      for (let i = 0; i < 4; i++) {
        controller.setWheelEngineForce(i, 0);
        controller.setWheelBrake(i, 0);
        controller.setWheelSteering(i, 0);
      }
    },
    reset() {
      this.steer = 0;
    },
    push(fx: number, fz: number) {
      chassis.applyImpulse({ x: fx, y: 0, z: fz }, true);
    },
  };
  return veh;
}
