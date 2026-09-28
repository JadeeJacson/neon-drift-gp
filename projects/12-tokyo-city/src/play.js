// play.js — 可玩模式：第一人称散步（WASD+鼠标视角，跳跃/疾跑，建筑碰撞）
// 与街机驾驶（WASD 油门转向，追逐镜头）。观景模式交还 OrbitControls。
import * as THREE from 'three';
import { coastX } from './layout.js';
import { nightEmissive } from './fx.js';

const EYE = 1.7;
const WALK = 4.6, RUN = 9.5, JUMP_V = 4.8, GRAVITY = 13;
const CAR_ACCEL = 10, CAR_MAX = 30, CAR_REVERSE = -9, CAR_FRICTION = 5;

const BOUND = 3400; // 地图边缘

export class PlayController {
  constructor({ scene, camera, controls, dom, layout, colliderGrid, carMaterial }) {
    this.camera = camera;
    this.controls = controls;
    this.dom = dom;
    this.layout = layout;
    this.grid = colliderGrid;
    this.mode = 'orbit';
    this.onHint = () => {};

    // 步行状态
    this.pos = new THREE.Vector3(-8, 0, 140);
    this.yaw = Math.PI;        // 面朝路口（-z）
    this.pitch = 0;
    this.vy = 0;
    this.onGround = true;
    this.bobT = 0;

    // 驾驶状态
    this.carPos = new THREE.Vector3(-8, 0, 140);
    this.carYaw = Math.PI;
    this.speed = 0;
    this.wheelSpin = 0;

    // 键盘
    this.keys = new Set();
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    // 指针锁定（步行视角）
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

    // 玩家座车（专属涂装 + 夜间前后灯组，保证昼夜都醒目）
    this.car = new THREE.Group();
    const paint = nightEmissive(
      new THREE.MeshStandardMaterial({ color: 0xd84a35, roughness: 0.35, metalness: 0.25, emissive: 0x8a1408, emissiveIntensity: 1 }),
      0.5
    );
    const glass = new THREE.MeshStandardMaterial({ color: 0x11141a, roughness: 0.25, metalness: 0.4 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.0, 4.5), paint);
    body.position.y = 0.75;
    body.castShadow = true;
    this.car.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.75, 2.3), glass);
    cabin.position.set(0, 1.55, -0.25);
    cabin.castShadow = true;
    this.car.add(cabin);
    const headMat = nightEmissive(new THREE.MeshStandardMaterial({ color: 0x333330, emissive: 0xfff2cc, emissiveIntensity: 1 }), 3.2);
    const tailMat = nightEmissive(new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff2020, emissiveIntensity: 1 }), 2.6);
    for (const x of [-0.58, 0.58]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.08), headMat);
      hl.position.set(x, 0.82, 2.26);
      this.car.add(hl);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.08), tailMat);
      tl.position.set(x, 0.86, -2.26);
      this.car.add(tl);
    }
    this.wheels = [];
    const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 10);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.9 });
    for (const [wx, wz] of [[-0.88, 1.5], [0.88, 1.5], [-0.88, -1.5], [0.88, -1.5]]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(wx, 0.36, wz);
      this.wheels.push(w);
      this.car.add(w);
    }
    this.car.visible = false;
    scene.add(this.car);
  }

  setMode(mode) {
    if (mode === this.mode) return;
    if (this.mode === 'orbit') {
      this.savedCam = { p: this.camera.position.clone(), t: this.controls.target.clone() };
    }
    this.mode = mode;
    this.controls.enabled = mode === 'orbit';
    this.car.visible = mode === 'drive';
    if (document.pointerLockElement && mode !== 'walk') document.exitPointerLock();
    if (mode === 'orbit') {
      if (this.savedCam) {
        this.camera.position.copy(this.savedCam.p);
        this.controls.target.copy(this.savedCam.t);
      }
    } else if (mode === 'walk') {
      this.pos.set(-8, 0, 140);
      this.yaw = Math.PI; this.pitch = -0.05; this.vy = 0;
      this.dom.requestPointerLock?.();
    } else if (mode === 'drive') {
      this.carPos.set(-8, 0, 150);
      this.carYaw = Math.PI; this.speed = 0;
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

  // 圆 vs AABB 群推挤
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
            if (px > pz) {
              pos.x += Math.sign(dx || 1) * -px;
            } else {
              pos.z += Math.sign(dz || 1) * -pz;
            }
            hitCb && hitCb();
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
    if (this.mode === 'walk') this._updateWalk(dt);
    else if (this.mode === 'drive') this._updateDrive(dt);
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
    if ((k.has('Space')) && this.onGround) {
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
    if (k.has('KeyW') || k.has('ArrowUp')) this.speed += CAR_ACCEL * dt;
    else if (k.has('KeyS') || k.has('ArrowDown')) this.speed -= CAR_ACCEL * 0.8 * dt;
    else {
      // 铲斗滑行
      const drop = CAR_FRICTION * dt;
      if (Math.abs(this.speed) <= drop) this.speed = 0;
      else this.speed -= Math.sign(this.speed) * drop;
    }
    this.speed = Math.max(CAR_REVERSE, Math.min(CAR_MAX, this.speed));

    const steerInput = (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0) - (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0);
    // 速度越快转向越缓；倒车时反向
    const yawRate = steerInput * Math.min(Math.abs(this.speed), 14) * 0.055 * Math.sign(this.speed || 1);
    this.carYaw += yawRate * dt;

    const fwd = new THREE.Vector3(Math.sin(this.carYaw), 0, Math.cos(this.carYaw));
    this.carPos.addScaledVector(fwd, this.speed * dt);

    let bumped = false;
    this._collide(this.carPos, 1.25, () => { bumped = true; });
    if (bumped) this.speed *= 0.35;

    this.car.position.set(this.carPos.x, 0.11, this.carPos.z);
    this.car.rotation.y = this.carYaw;
    this.wheelSpin += (this.speed / 0.36) * dt;
    for (const w of this.wheels) w.rotation.x = this.wheelSpin;

    // 追逐镜头
    const camTarget = new THREE.Vector3(
      this.carPos.x - fwd.x * 8.5, 3.4, this.carPos.z - fwd.z * 8.5
    );
    this.camera.position.lerp(camTarget, Math.min(1, dt * 4.5));
    this.camera.lookAt(this.carPos.x + fwd.x * 4, 1.4, this.carPos.z + fwd.z * 4);
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
