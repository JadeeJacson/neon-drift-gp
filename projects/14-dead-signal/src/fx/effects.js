/* 特效池：血雾 / 弹孔与血迹贴花 / 弹壳 / 曳光 / 击杀喷溅
 * 全部对象池复用，运行期不新增也不销毁 GPU 资源（对齐参考仓库的浸泡测试思路）。 */
import * as THREE from 'three';
import { rand } from '../core/util.js';

const MAX_BLOOD = 220, MAX_DECAL = 120, MAX_CASE = 60, MAX_TRACER = 40;

export const Fx = {
  scene: null, world: null,
  _blood: [], _decal: [], _case: [], _tracer: [],
  _t: 0,
  _shared: {},

  init(scene, world) {
    this.scene = scene; this.world = world;
    const s = this._shared;
    s.bloodGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    s.bloodMat = new THREE.MeshBasicMaterial({ color: 0x6d1310 });
    s.caseGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.028, 6);
    s.caseMat = new THREE.MeshStandardMaterial({ color: 0xb08a3e, metalness: 0.9, roughness: 0.35 });
    s.holeMat = new THREE.MeshBasicMaterial({ color: 0x0e0c0a, transparent: true, opacity: 0.85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    s.bloodDecalMat = new THREE.MeshBasicMaterial({ color: 0x5e0d09, transparent: true, opacity: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    s.tracerMat = new THREE.LineBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.85 });
    s.planeGeo = new THREE.PlaneGeometry(1, 1);

    // 预分配池
    for (let i = 0; i < MAX_BLOOD; i++) { const m = new THREE.Mesh(s.bloodGeo, s.bloodMat); m.visible = false; scene.add(m); this._blood.push({ m, life: 0 }); }
    for (let i = 0; i < MAX_CASE; i++) { const m = new THREE.Mesh(s.caseGeo, s.caseMat); m.visible = false; scene.add(m); this._case.push({ m, life: 0, v: new THREE.Vector3() }); }
    for (let i = 0; i < MAX_DECAL; i++) {
      const m = new THREE.Mesh(s.planeGeo, s.holeMat); m.visible = false; m.scale.setScalar(0.12);
      scene.add(m); this._decal.push({ m, life: 0 });
    }
    for (let i = 0; i < MAX_TRACER; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(geo, s.tracerMat.clone()); line.visible = false;
      line.frustumCulled = false;
      scene.add(line); this._tracer.push({ line, life: 0, dur: 0.09 });
    }
  },

  _take(pool) {                                   // 找空闲槽位，找不到就抢最老的；池未初始化时返回 null
    if (!pool || !pool.length) return null;
    for (let i = 0; i < pool.length; i++) if (pool[i].life <= 0) return pool[i];
    return pool[(Math.random() * pool.length) | 0];
  },

  // 血雾：中弹点朝子弹反方向喷
  blood(point, nx, ny, nz, big) {
    const n = big ? 16 : 7;
    for (let i = 0; i < n; i++) {
      const p = this._take(this._blood);
      if (!p) break;
      p.m.visible = true; p.m.position.copy(point);
      const k = big ? 3.4 : 2.1;
      p.v = p.v || new THREE.Vector3();
      p.v.set(nx * k + rand(-1.2, 1.2), ny * k + rand(0.4, 2.2), nz * k + rand(-1.2, 1.2));
      p.life = rand(0.25, 0.5);
      const s = rand(0.6, 1.6); p.m.scale.setScalar(s);
    }
    // 血迹贴花按概率落地，避免高频命中抽干贴花池
    if (Math.random() < 0.45) {
      const d = this._take(this._decal);
      if (d) {
        d.m.visible = true; d.life = 14;
        d.m.material = this._shared.bloodDecalMat;
        d.m.position.copy(point).addScaledVector(new THREE.Vector3(nx, ny, nz), -0.03);
        d.m.scale.setScalar(rand(0.28, 0.5));
        d.m.lookAt(d.m.position.clone().add(new THREE.Vector3(nx, ny, nz)));
      }
    }
  },

  // 世界表面弹孔
  bulletHole(point, nx, ny, nz) {
    const d = this._take(this._decal);
    if (!d) return;
    d.m.visible = true; d.life = 16;
    d.m.material = this._shared.holeMat;
    d.m.position.copy(point).addScaledVector(new THREE.Vector3(nx, ny, nz), 0.015);
    d.m.scale.setScalar(rand(0.07, 0.11));
    d.m.lookAt(d.m.position.clone().add(new THREE.Vector3(nx, ny, nz)));
  },

  // 弹壳（相机坐标系向右后方抛出）
  casings(cam, count) {
    if (!cam) return;                                  // 无头测试/未初始化时直接跳过
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    for (let i = 0; i < count; i++) {
      const p = this._take(this._case);
      if (!p) break;
      p.m.visible = true;
      p.m.position.copy(cam.position).addScaledVector(right, 0.25).addScaledVector(up, -0.1);
      p.v = p.v || new THREE.Vector3();
      p.v.copy(right).multiplyScalar(rand(1.4, 2.6)).addScaledVector(up, rand(1.4, 2.4)).y += rand(0.4, 1);
      p.life = 1.6;
    }
  },

  // 曳光：枪口 → 终点
  tracer(from, to) {
    const p = this._take(this._tracer);
    if (!p) return;
    p.line.visible = true; p.life = 0.07;
    const arr = p.line.geometry.attributes.position.array;
    arr[0] = from.x; arr[1] = from.y; arr[2] = from.z;
    arr[3] = to.x; arr[4] = to.y; arr[5] = to.z;
    p.line.geometry.attributes.position.needsUpdate = true;
  },

  // 击杀爆浆
  burst(point) { this.blood(point, 0, 1, 0, true); },

  update(dt) {
    this._t += dt;
    const g = -9.8;
    for (const p of this._blood) {
      if (p.life <= 0) { if (p.m.visible) p.m.visible = false; continue; }
      p.life -= dt;
      p.v.y += g * dt * 2.2;
      p.m.position.addScaledVector(p.v, dt);
      if (p.m.position.y < 0.02) { p.m.position.y = 0.02; p.v.set(0, 0, 0); p.life = Math.min(p.life, 0.2); }
      if (p.life <= 0) p.m.visible = false;
    }
    for (const p of this._case) {
      if (p.life <= 0) { if (p.m.visible) p.m.visible = false; continue; }
      p.life -= dt;
      p.v.y += g * dt;
      p.m.position.addScaledVector(p.v, dt);
      p.m.rotation.x += dt * 9; p.m.rotation.z += dt * 6;
      if (p.m.position.y < 0.02) { p.m.position.y = 0.02; p.v.multiplyScalar(0.2); p.v.y = 0; }
      if (p.life <= 0) p.m.visible = false;
    }
    for (const p of this._decal) {
      if (p.life <= 0) { if (p.m.visible) p.m.visible = false; continue; }
      p.life -= dt;
      if (p.life <= 0) p.m.visible = false;
    }
    for (const p of this._tracer) {
      if (p.life <= 0) { if (p.line.visible) p.line.visible = false; continue; }
      p.life -= dt;
      p.line.material.opacity = Math.max(0, p.life / 0.07) * 0.85;
      if (p.life <= 0) p.line.visible = false;
    }
  }
};
