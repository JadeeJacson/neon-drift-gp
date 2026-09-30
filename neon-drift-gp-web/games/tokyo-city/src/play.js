// play.js — 三种模式的控制权仲裁：观景 / 散步 / 驾驶。
//
// 观景：OrbitControls 负责转视角，额外接管 WASD/QE 做自由平移（位置与目标点同步移动，
//       OrbitControls 之后重新解算球坐标，两边不会打架）。
// 散步：第一人称，建筑 AABB 碰撞 + 重力跳跃。
// 驾驶：car.js 的街机车模型 + 追尾镜头（FOV 随速度、漂移时镜头跟速度方向而不是车头方向）。
import * as THREE from 'three';
import { coastX } from './layout.js';
import { Car } from './car.js';

const EYE = 1.7;
const WALK = 4.6, RUN = 9.5, JUMP_V = 4.8, GRAVITY = 13;
const BOUND = 3400;

// 驾驶镜头的「体感」常数，不是物理量，集中放一处方便调。
// 重要判断：速度感**主要来自 FOV 张开和镜头拉远**，抖动只是点缀。
// 抖过头会晕车，而且会盖掉真正想传达的信息（路面标线、弯道走向）。
// 之前的 rumblePerSpeed=0.06 在满速时约 2~3cm 峰峰值，叠上撞击抖动（可达 14cm）
// 再叠上第一人称全量继承的车身侧倾（漂移时可达 17°），主观上就是「抖到看不清路」。
const CAM = {
  rumblePerSpeed: 0.026,  // 满速持续微颤的幅度系数（再乘各轴系数）
  rumbleStart: 70,        // 低于此速度不颤：低速路面细节本就看不清，抖了只是噪点
  rumbleFreqX: 47.3,      // rad/s ≈ 7.5Hz
  rumbleFreqY: 39.7,      // rad/s ≈ 6.3Hz
  rumbleAxisX: 0.30,      // 横向幅度
  rumbleAxisY: 0.42,      // 纵向幅度（略大于横向，路面起伏感主要来自上下）
  crashShake: 0.30,       // 撞击抖动权重（撞完立刻衰减，不该压过画面）
  crashPerImpact: 0.05,   // 每 1m/s 撞击速度带来的抖动量
  crashCap: 0.35,         // 单次撞击的抖动上限
  crashDecay: 2.6,        // 抖动衰减速度（1/s）
  // 第一人称只继承一部分车身姿态。全量继承时，漂移中车身侧倾会把地平线甩到 17°，
  // 这是「镜头抖得看不清路」在第一人称下的真正来源。
  fpPitch: 0.35,
  fpRoll: 0.20,
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class PlayController {
  constructor({ scene, camera, controls, dom, layout, colliderGrid }) {
    this.camera = camera;
    this.controls = controls;
    this.dom = dom;
    this.layout = layout;
    this.grid = colliderGrid;
    this.mode = 'orbit';
    this.onHint = () => {};
    this.onCrash = () => {};   // 碰撞回调（游戏系统用来清漂移分）

    // ---- 步行状态 ----
    this.pos = new THREE.Vector3(-8, 0, 140);
    this.yaw = Math.PI;        // 面朝路口（-z）
    this.pitch = 0;
    this.vy = 0;
    this.onGround = true;
    this.bobT = 0;

    // ---- 键盘 ----
    this.keys = new Set();
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    // 失焦时松开所有键，否则切窗口回来会「幽灵加速」
    window.addEventListener('blur', () => this.keys.clear());

    // ---- 指针锁定（步行视角）----
    dom.addEventListener('click', () => {
      if (this.mode === 'walk' && document.pointerLockElement !== dom) {
        dom.requestPointerLock();
      }
    });
    document.addEventListener('mousemove', (e) => {
      if (this.mode === 'walk' && document.pointerLockElement === dom) {
        this.yaw -= e.movementX * 0.0022;
        this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - e.movementY * 0.0022));
      }
    });

    // ---- 车辆 ----
    this.car = new Car({ scene, x: -8, z: 150, yaw: Math.PI });
    this.car.body.visible = false;

    // 追尾镜头状态
  this.camMode = 0;       // 0=追尾 1=车头（准第一人称）
    this.camYaw = Math.PI;
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();
    this.fovBase = camera.fov;
    this.shake = 0;
  }

  toggleCamera() {
    this.camMode = this.camMode === 0 ? 1 : 0;
  }

  setMode(mode) {
    if (mode === this.mode) return;
    if (this.mode === 'orbit') {
      this.savedCam = { p: this.camera.position.clone(), t: this.controls.target.clone() };
    }
    this.mode = mode;
    this.controls.enabled = mode === 'orbit';
    this.car.body.visible = mode === 'drive';
    if (document.pointerLockElement && mode !== 'walk') document.exitPointerLock();
    if (mode === 'orbit') {
      if (this.savedCam) {
        this.camera.position.copy(this.savedCam.p);
        this.controls.target.copy(this.savedCam.t);
      }
      this.camera.fov = this.fovBase;
      this.camera.updateProjectionMatrix();
    } else if (mode === 'walk') {
      this.pos.set(-8, 0, 140);
      this.yaw = Math.PI; this.pitch = -0.05; this.vy = 0;
      this.dom.requestPointerLock?.();
    } else if (mode === 'drive') {
      // 出生点：路口前，能直接上马路；朝向沿 x=0 主干道向北
      this.car.reset(-6, 190, Math.PI);
      this.camYaw = Math.PI;
      this.shake = 0;
    }
    this.onHint(mode);
  }

  cycle() {
    this.setMode(this.mode === 'orbit' ? 'walk' : this.mode === 'walk' ? 'drive' : 'orbit');
    return this.mode;
  }

  // 地面高度：城区街区 = 人行道垫层 0.35，其余（路面/草地）0.1
  _groundHeight(x, z) {
    for (const b of this.layout.blocks) {
      if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1) {
        return (b.zone === 'rural' || b.zone === 'coast' || b.zone === 'suburb') ? 0.1 : 0.35;
      }
    }
    return 0.1;
  }

  // 圆 vs AABB 群推挤。hitCb 返回被撞到的法向（用于让车「贴着」墙滑而不是弹开）
  _collide(pos, radius, hitCb) {
    const cx = Math.floor(pos.x / 50), cz = Math.floor(pos.z / 50);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const cell = this.grid.get((cx + i) + ',' + (cz + j));
        if (!cell) continue;
        for (const r of cell) {
          const dx = pos.x - r.x, dz = pos.z - r.z;
          const px = Math.abs(dx) - (r.hw + radius);
          const pz = Math.abs(dz) - (r.hd + radius);
          if (px < 0 && pz < 0) {
            let nx = 0, nz = 0;
            if (px > pz) {
              pos.x += Math.sign(dx || 1) * -px;
              nx = Math.sign(dx || 1);
            } else {
              pos.z += Math.sign(dz || 1) * -pz;
              nz = Math.sign(dz || 1);
            }
            hitCb && hitCb(nx, nz, Math.min(-px, -pz));
          }
        }
      }
    }
    // 地图边界：东不出海，四缘不出图
    const shore = coastX(pos.z) - 14;
    if (pos.x > shore) pos.x = shore;
    if (pos.x < -BOUND) pos.x = -BOUND;
    if (pos.z > BOUND) pos.z = BOUND;
    if (pos.z < -BOUND) pos.z = -BOUND;
  }

  update(dt) {
    if (this.mode === 'orbit') this._updateOrbitPan(dt);
    else if (this.mode === 'walk') this._updateWalk(dt);
    else if (this.mode === 'drive') this._updateDrive(dt);
  }

  // ---- 观景模式自由移动 ----
  // 相机位置与 orbit target 同步平移：视角方向不变，只是整体在世界里走。
  // 速度随当前观察距离缩放，近看时慢、俯瞰时快，和 Blender/Maya 的平移手感一致。
  _updateOrbitPan(dt) {
    const k = this.keys;
    let f = 0, s = 0, u = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) f += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) f -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) s += 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) s -= 1;
    if (k.has('KeyE') || k.has('KeyR') || k.has('PageUp')) u += 1;
    if (k.has('KeyQ') || k.has('KeyF') || k.has('PageDown')) u -= 1;
    if (!f && !s && !u) return;

    const boost = (k.has('ShiftLeft') || k.has('ShiftRight')) ? 3.2 : 1;
    const dist = this.camera.position.distanceTo(this.controls.target);
    const sp = clamp(dist * 0.75, 14, 900) * boost;

    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    dir.y = 0;
    if (dir.lengthSq() < 1e-8) return; // 正俯视时水平方向退化，忽略平移
    dir.normalize();
    // 右向量 = forward × up = (-fz, 0, fx)。
    // 注意：写成 (fz, 0, -fx) 取到的是它的相反向量，A/D 就会左右互换。
    const right = new THREE.Vector3(-dir.z, 0, dir.x);

    const delta = new THREE.Vector3()
      .addScaledVector(dir, f)
      .addScaledVector(right, s);
    if (delta.lengthSq() > 1e-8) delta.normalize().multiplyScalar(sp * dt);
    delta.y = u * sp * dt;

    this.camera.position.add(delta);
    this.controls.target.add(delta);
  }

  _updateWalk(dt) {
    const k = this.keys;
    const run = k.has('ShiftLeft') || k.has('ShiftRight');
    const speed = run ? RUN : WALK;
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const move = new THREE.Vector3();
    if (k.has('KeyW') || k.has('ArrowUp')) move.add(fwd);
    if (k.has('KeyS') || k.has('ArrowDown')) move.sub(fwd);
    if (k.has('KeyD') || k.has('ArrowRight')) move.add(right);
    if (k.has('KeyA') || k.has('ArrowLeft')) move.sub(right);
    const moving = move.lengthSq() > 0;
    if (moving) {
      move.normalize().multiplyScalar(speed * dt);
      this.pos.add(move);
    }

    // 跳跃 / 重力
    const ground = this._groundHeight(this.pos.x, this.pos.z);
    if (k.has('Space') && this.onGround) {
      this.vy = JUMP_V;
      this.onGround = false;
    }
    this.vy -= GRAVITY * dt;
    this.pos.y += this.vy * dt;
    if (this.pos.y <= ground) {
      this.pos.y = ground;
      this.vy = 0;
      this.onGround = true;
    }

    this._collide(this.pos, 0.45);

    // 头部摆动
    let bob = 0;
    if (moving && this.onGround) {
      this.bobT += dt * (run ? 11 : 7.5);
      bob = Math.sin(this.bobT) * 0.04;
    }
    this.camera.position.set(this.pos.x, this.pos.y + EYE + bob, this.pos.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  _updateDrive(dt) {
    const k = this.keys;
    const input = {
      throttle: (k.has('KeyW') || k.has('ArrowUp')) ? 1 : 0,
      brake: (k.has('KeyS') || k.has('ArrowDown')) ? 1 : 0,
      steer: (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0) - (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0),
      handbrake: k.has('Space'),
    };

    let hitDepth = 0, hitNx = 0, hitNz = 0;
    this.car.update(dt, input);

    // 碰撞：把速度里撞墙的那一分吃掉，剩下的沿墙滑（不再是「整体乘 0.35」的顿挫感）
    this._collide(this.car.pos, 1.25, (nx, nz, depth) => {
      if (depth > hitDepth) { hitDepth = depth; hitNx = nx; hitNz = nz; }
    });
    if (hitDepth > 0) {
      const vn = this.car.vel.x * hitNx + this.car.vel.y * hitNz; // 朝墙的速度分量
      if (vn < 0) {
        this.car.vel.x -= vn * hitNx;
        this.car.vel.y -= vn * hitNz;
        // 只有真正「撞上去」（速度够大）才算一次碰撞，轻蹭不打断连击
        if (-vn > 4) this.onCrash(-vn);
      }
      this.shake = Math.min(CAM.crashCap, this.shake + Math.min(CAM.crashCap, -vn * CAM.crashPerImpact));
    }

    this._driveCamera(dt);
  }

  _driveCamera(dt) {
    const car = this.car;
    const kph = car.kph;
    // 参考值取实际极速 258km/h 附近，否则高速段镜头/FOV 会早早饱和，
    // 90→190km/h 感觉不出区别（这正是「车不够快」体感的一部分来源）
    const speedT = clamp(kph / 250, 0, 1.15);

    // 震动：碰撞瞬间 + 高速持续微颤（两种镜头共用）
    this.shake = Math.max(0, this.shake - dt * CAM.crashDecay);
    const speedRumble = clamp((kph - CAM.rumbleStart) / 250, 0, 1) * CAM.rumblePerSpeed;
    const rumble = speedRumble + this.shake * CAM.crashShake;
    const t = performance.now() * 0.001;

    if (this.camMode === 1) {
      // 车头视角：视线完全跟车头，漂移时能直观看到车在横着走
      const fx = Math.sin(car.yaw), fz = Math.cos(car.yaw);
      this.camera.position.set(car.pos.x + fx * 0.35, 1.42, car.pos.z + fz * 0.35);
      if (rumble > 0.001) this.camera.position.y += Math.sin(t * CAM.rumbleFreqY) * rumble * 0.45;
      // 车身侧倾/俯仰按比例带进镜头才有贴地感；全量继承会在漂移时把地平线甩飞
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.set(
        car.body.rotation.x * CAM.fpPitch,
        car.yaw,
        car.body.rotation.z * CAM.fpRoll
      );
      const hfov = this.fovBase + speedT * 20;
      if (Math.abs(this.camera.fov - hfov) > 0.01) {
        this.camera.fov = hfov;
        this.camera.updateProjectionMatrix();
      }
      return;
    }

    // 镜头朝向：跟速度方向而不是车头方向，漂移时不会跟着车尾转圈
    const speedLen = car.vel.length();
    let wantYaw = car.yaw;
    if (speedLen > 3.5) {
      // vel 是 (x, z) 分量，转成与 yaw 同构的角度
      const velYaw = Math.atan2(car.vel.x, car.vel.y);
      let d = velYaw - car.yaw;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      // 漂移时偏一点向速度方向（不超过 35°），兼顾「看得见车」和「看得见路」
      wantYaw = car.yaw + clamp(d, -0.61, 0.61) * (0.35 + car.drift * 0.5);
    }
    let dy = wantYaw - this.camYaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    this.camYaw += dy * Math.min(1, dt * 5.5);

    // 速度越高镜头拉远抬高，FOV 张开 —— 速度感主要来自这两项而不是单纯数值
    const dist = 8.2 + speedT * 2.4;
    const height = 3.2 + speedT * 0.7;

    const cx = car.pos.x - Math.sin(this.camYaw) * dist;
    const cz = car.pos.z - Math.cos(this.camYaw) * dist;
    this.camPos.set(cx, height, cz);
    this.camera.position.lerp(this.camPos, Math.min(1, dt * (6.5 + speedT * 4)));

    if (rumble > 0.001) {
      this.camera.position.x += Math.sin(t * CAM.rumbleFreqX) * rumble * CAM.rumbleAxisX;
      this.camera.position.y += Math.sin(t * CAM.rumbleFreqY) * rumble * CAM.rumbleAxisY;
    }

    const lx = car.pos.x + Math.sin(this.camYaw) * 6;
    const lz = car.pos.z + Math.cos(this.camYaw) * 6;
    this.camLook.set(lx, 1.3, lz);
    this.camera.lookAt(this.camLook);

    const fov = this.fovBase + speedT * 16 + this.shake * 4;
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
  }
}

// 碰撞网格：矩形 {x,z,hw,hd} → 50m 均匀格
export function buildColliderGrid(rects) {
  const grid = new Map();
  for (const r of rects) {
    const x0 = Math.floor((r.x - r.hw) / 50), x1 = Math.floor((r.x + r.hw) / 50);
    const z0 = Math.floor((r.z - r.hd) / 50), z1 = Math.floor((r.z + r.hd) / 50);
    for (let i = x0; i <= x1; i++) {
      for (let j = z0; j <= z1; j++) {
        const key = i + ',' + j;
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(r);
      }
    }
  }
  return grid;
}
