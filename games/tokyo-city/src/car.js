// car.js — 街机化但有重量感的车辆模型。
//
// 为什么不用「标量 speed + 固定转向率」：那样车会像在轨道上跑，转向与实际前进方向
// 永远一致，弯中不推头、也不甩尾，缺少街机赛车该有的抓地力博弈。
// 这里改成「世界速度矢量 + 车身朝向」两套状态：
//   yaw  = 车头朝向（由转向 + 自行车模型积分）
//   vel  = 世界速度方向（惯性方向，转向时不会立刻跟着转 → 这就是漂移的来源）
// 侧向抓地力 grip 把 vLat 拉回 0；拉不住时车身与行进方向脱节 = 甩尾。
// 手刹把 grip 降到极低 → 可控甩尾。
//
// 所有手感常数集中在 TUNE 里，调车感只改这一处。
//
// ⚠ 极速不由 maxSpeed 决定，而由「推力 = 滚阻 + 风阻」的平衡点决定。
// 这里曾把 maxSpeed 写成 52m/s(187km/h)，但 rollingDrag=1.05 太强，
// 方程解出来实际极速只有 55km/h —— 参数是假的，油门踩到底也上不去。
// 下面这组参数经数值求解验证：0-100 约 2.6s，极速约 258km/h。
import * as THREE from 'three';
import { nightEmissive } from './fx.js';

const TUNE = {
  // 动力衰减参考点与曲线：推力 = enginePower * (1 - (v/taperSpeed)^powerFalloff)
  powerTaperSpeed: 130,
  powerFalloff: 4,
  enginePower: 12,        // m/s² 起步加速度
  brakePower: 34,         // m/s² 刹车减速度
  reversePower: 9,       // m/s² 倒车加速度
  rollingDrag: 0.08,      // 线性阻力（过大会把极速压死）
  aeroDrag: 0.001,        // 平方阻力
  maxSpeed: 90,           // 硬上限（安全钳），远高于实际极速
  reverseMax: 14,         // m/s 倒车极速
  wheelBase: 2.7,
  steerMax: 0.56,        // rad ≈ 32°
  steerRate: 9.5,        // 方向盘响应速度（1/s）
  steerSpeedFalloff: 0.055, // 速度越高转向越钝
  grip: 8.5,             // 侧向抓地（1/s），越大越不滑
  handbrakeGrip: 1.15,   // 手刹抓地
  driftGrip: 3.2,        // 超过侧滑阈值后的抓地（进入甩尾）
  driftEnter: 2.6,       // m/s 侧滑进入甩尾的阈值
  driftExit: 1.4,
  bodyRoll: 0.030,       // 侧倾系数
  bodyPitch: 0.0095,     // 俯仰系数
  maxRoll: 0.30,
  maxPitch: 0.10,
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class Car {
  constructor({ scene, x = -8, z = 150, yaw = Math.PI, bodyColor = 0xd84a35 } = {}) {
    this.tune = TUNE;

    // ---- 状态 ----
    this.pos = new THREE.Vector3(x, 0, z);
    this.yaw = yaw;
    this.vel = new THREE.Vector2(0, 0);  // 世界 XZ 速度
    this.steer = 0;
    this.yawRate = 0;
    this.speed = 0;        // 纵向速度（带符号，负=倒车）
    this.lateral = 0;      // 侧滑速度（车身坐标系）
    this.drift = 0;        // 0..1 甩尾强度
    this.wheelSpin = 0;
    this.accelLong = 0;
    this.accelLat = 0;
    this.handbrake = false;
    this.throttle = 0;
    this.brake = 0;
    this.steerInput = 0;

    this.build(scene, bodyColor);
  }

  build(scene, bodyColor) {
    const g = new THREE.Group();
    g.name = 'player-car';

    // 涂装：夜里也要醒目，所以自发光地板
    const paint = nightEmissive(
      new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.32, metalness: 0.35, emissive: 0x5a1206, emissiveIntensity: 1 }),
      0.35
    );
    const glass = new THREE.MeshStandardMaterial({ color: 0x0d1014, roughness: 0.18, metalness: 0.5 });
    const trim = new THREE.MeshStandardMaterial({ color: 0x1b1d22, roughness: 0.7, metalness: 0.2 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xb8bcc4, roughness: 0.25, metalness: 0.9 });

    // 车身主体：分三段做出腰线，比单个盒子有形
    const lower = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.52, 4.35), paint);
    lower.position.y = 0.62;
    const upper = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.42, 2.15), paint);
    upper.position.set(0, 1.09, -0.22);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.20, 1.35), paint);
    hood.position.set(0, 0.96, 1.42);
    for (const m of [lower, upper, hood]) { m.castShadow = true; g.add(m); }

    // 车舱玻璃
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.60, 0.46, 1.95), glass);
    cabin.position.set(0, 1.42, -0.24);
    cabin.castShadow = true;
    g.add(cabin);
    // 车顶
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.10, 1.55), paint);
    roof.position.set(0, 1.66, -0.30);
    roof.castShadow = true;
    g.add(roof);

    // 前后保险杠 + 进气格栅
    const bumperF = new THREE.Mesh(new THREE.BoxGeometry(1.80, 0.30, 0.24), trim);
    bumperF.position.set(0, 0.56, 2.20);
    const bumperR = new THREE.Mesh(new THREE.BoxGeometry(1.80, 0.30, 0.24), trim);
    bumperR.position.set(0, 0.56, -2.20);
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.20, 0.10), chrome);
    grille.position.set(0, 0.74, 2.22);
    g.add(bumperF, bumperR, grille);

    // 侧裙
    for (const s of [-1, 1]) {
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 2.6), trim);
      skirt.position.set(s * 0.95, 0.48, -0.1);
      g.add(skirt);
    }

    // 尾翼
    const wingPost = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.07, 0.22), trim);
    wingPost.position.set(0, 1.30, -2.05);
    g.add(wingPost);
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.30, 0.12), trim);
      post.position.set(s * 0.55, 1.14, -2.05);
      g.add(post);
    }

    // 灯组
    const headMat = nightEmissive(new THREE.MeshStandardMaterial({ color: 0x30302c, emissive: 0xfff4d6, emissiveIntensity: 1 }), 3.0);
    const tailMat = nightEmissive(new THREE.MeshStandardMaterial({ color: 0x2a0808, emissive: 0xff2424, emissiveIntensity: 1 }), 2.4);
    for (const s of [-1, 1]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.10), headMat);
      hl.position.set(s * 0.60, 0.86, 2.20);
      g.add(hl);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.14, 0.10), tailMat);
      tl.position.set(s * 0.58, 0.90, -2.20);
      g.add(tl);
    }

    // 车轮：前轮要能跟着方向盘转，所以单独分组
    const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    const tyre = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.95 });
    const rimGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.26, 10);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.3, metalness: 0.85 });
    this.wheels = [];
    for (const [wx, wz, front] of [[-0.84, 1.32, true], [0.84, 1.32, true], [-0.84, -1.36, false], [0.84, -1.36, false]]) {
      const pivot = new THREE.Group();
      pivot.position.set(wx, 0.34, wz);
      const spin = new THREE.Group();
      const w = new THREE.Mesh(wheelGeo, tyre);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      w.castShadow = true;
      spin.add(w, rim);
      pivot.add(spin);
      g.add(pivot);
      this.wheels.push({ pivot, spin, front });
    }

    // 车身姿态容器：侧倾/俯仰挂在这里，不污染 yaw
    this.body = g;
    // ⚠ 欧拉顺序必须是 YXZ（先 yaw，再 pitch，再 roll），这是车辆的常规约定。
    // 默认的 XYZ 会把 Rx 放在 Ry 外侧，也就是「俯仰绕的是世界 X 轴」而不是车身横轴：
    // 车头朝 +Z 时看起来对，车头朝 -Z（默认出生朝向 yaw=π）时同一个 pitch 就变成低头，
    // 半路转弯时更会变成侧倾。表现就是「一给油车头就往下扎」。
    g.rotation.order = 'YXZ';
    scene.add(g);
  }

  reset(x, z, yaw) {
    this.pos.set(x, 0, z);
    this.yaw = yaw;
    this.vel.set(0, 0);
    this.steer = 0;
    this.yawRate = 0;
    this.speed = 0;
    this.lateral = 0;
    this.drift = 0;
    this.accelLong = 0;
    this.accelLat = 0;
  }

  // input: { throttle: 0|1, brake: 0|1, steer: -1..1, handbrake: bool }
  update(dt, input) {
    const T = this.tune;
    this.throttle = input.throttle;
    this.brake = input.brake;
    this.steerInput = input.steer;
    this.handbrake = !!input.handbrake;

    // 车头方向与右方向
    const fwdX = Math.sin(this.yaw), fwdZ = Math.cos(this.yaw);
    const rgtX = fwdZ, rgtZ = -fwdX;

    // 当前速度分解到车身坐标系
    let vLong = this.vel.x * fwdX + this.vel.y * fwdZ;
    let vLat = this.vel.x * rgtX + this.vel.y * rgtZ;

    // ---------- 纵向 ----------
    const spdAbs = Math.abs(vLong);
    const powerFrac = 1 - Math.pow(clamp(spdAbs / T.powerTaperSpeed, 0, 1), T.powerFalloff);
    let a = 0;
    if (this.throttle) {
      // 油门永远是「往前」。这里原来写成 (vLong < -0.5 ? -0.6 : 1)，
      // 意思是「倒车中再给油 = 继续倒」——结果倒车后按 W 只会把车推得更远，
      // 永远出不来倒车状态，玩家以为油门坏了。倒车由 S 键独占。
      a += T.enginePower * powerFrac;
    }
    if (this.brake) {
      if (vLong > 0.6) a -= T.brakePower;          // 前进中刹车
      else a -= T.reversePower;                     // 停住/倒车中 = 挂倒挡
    }
    // 阻力
    a -= T.rollingDrag * vLong;
    a -= T.aeroDrag * vLong * spdAbs;
    if (this.handbrake) a -= Math.sign(vLong) * 9;

    const prevLong = vLong;
    vLong += a * dt;
    // 倒车限速
    if (vLong < -T.reverseMax) vLong = -T.reverseMax;
    if (vLong > T.maxSpeed) vLong = T.maxSpeed;
    // 停稳后归零，避免无限小抖动
    if (Math.abs(vLong) < 0.06 && !this.throttle && !this.brake) vLong = 0;
    this.accelLong = (vLong - prevLong) / Math.max(dt, 1e-4);

    // ---------- 转向 ----------
    // 速度越高方向盘越钝，低速几乎能原地转（街机手感的关键）
    const speedFactor = 1 / (1 + spdAbs * T.steerSpeedFalloff);
    const target = this.steerInput * T.steerMax * speedFactor;
    this.steer += (target - this.steer) * Math.min(1, T.steerRate * dt);

    // 自行车模型：前轮转过 steer 时车头绕后轴转
    // 低速（<0.7m/s）允许原地转，否则停车时车头会僵住
    const steerAuthority = spdAbs < 0.7 ? this.steerInput * 0.9 : vLong / T.wheelBase;
    this.yawRate = Math.tan(this.steer) * steerAuthority;
    this.yaw += this.yawRate * dt;

    // ---------- 侧向抓地 ----------
    // 手刹 → 几乎不抓地；大幅侧滑 → 抓地下降（甩尾更容易维持）
    const prevLat = vLat;
    let grip = this.handbrake ? T.handbrakeGrip : T.grip;
    if (Math.abs(vLat) > T.driftEnter) grip = T.driftGrip;
    vLat -= vLat * Math.min(1, grip * dt);
    // 转向把侧滑「甩」出来：车头转了，惯性还指向原方向
    vLat -= this.yawRate * vLong * dt * 0.30;
    if (this.handbrake) vLat -= this.yawRate * vLong * dt * 0.55;

    this.lateral = vLat;
    this.speed = vLong;
    this.accelLat = (vLat - prevLat) / Math.max(dt, 1e-4);

    // 漂移强度：侧滑速度归一化，驱动轮胎烟/积碳/音效
    const driftRaw = clamp((Math.abs(vLat) - 0.6) / 6.5, 0, 1);
    this.drift += (driftRaw - this.drift) * Math.min(1, dt * 9);

    // ---------- 写回世界速度 ----------
    this.vel.set(fwdX * vLong + rgtX * vLat, fwdZ * vLong + rgtZ * vLat);
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.y * dt;

    this.applyVisual(dt);
  }

  applyVisual(dt) {
    const T = this.tune;
    this.body.position.set(this.pos.x, 0, this.pos.z);
    this.body.rotation.y = this.yaw;

    // 侧倾：横向加速度把车身压向外侧；俯仰：加速抬头、刹车点头
    const roll = clamp(-this.lateral * T.bodyRoll, -T.maxRoll, T.maxRoll);
    const pitch = clamp(-this.accelLong * T.bodyPitch, -T.maxPitch, T.maxPitch);
    this.body.rotation.z += (roll - this.body.rotation.z) * Math.min(1, dt * 8);
    this.body.rotation.x += (pitch - this.body.rotation.x) * Math.min(1, dt * 8);

    // 车轮：前轮跟随方向盘，后轮随速度滚动
    this.wheelSpin += (this.speed / 0.34) * dt;
    for (const w of this.wheels) {
      if (w.front) w.pivot.rotation.y = this.steer;
      w.spin.rotation.x = this.wheelSpin;
    }
  }

  // 速度表读数（km/h）
  get kph() {
    return Math.abs(this.speed) * 3.6;
  }

  // 车身朝向（供相机用）
  get forward() {
    return { x: Math.sin(this.yaw), z: Math.cos(this.yaw) };
  }

  get isDrifting() {
    return this.drift > 0.25;
  }
}

export { TUNE as CAR_TUNE };
