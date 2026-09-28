/* 第一人称枪模：全部由盒子/圆柱程序化拼装，挂在 R.vmScene 上
 * 动画由状态驱动：腰射位置 / 机瞄位置 / 后坐回位 / 换弹（含逐发压弹）/ 掏枪 / 军刀挥击 / 冲刺 tilt */
import * as THREE from 'three';
import { R } from '../core/render.js';
import { clamp, lerp, deg, rand } from '../core/util.js';
import { addGrain } from '../fx/grain.js';

const METAL = () => addGrain(new THREE.MeshStandardMaterial({ color: 0x23262b, metalness: 0.65, roughness: 0.5 }), 0.16);
const WOOD = () => addGrain(new THREE.MeshStandardMaterial({ color: 0x4d3b26, metalness: 0.05, roughness: 0.85 }), 0.2);
const BLK = () => addGrain(new THREE.MeshStandardMaterial({ color: 0x14161a, metalness: 0.3, roughness: 0.7 }), 0.14);

function part(parent, geo, m, x, y, z, rx) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  if (rx) mesh.rotation.x = rx;
  parent.add(mesh);
  return mesh;
}
const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cy = (r, h, s) => new THREE.CylinderGeometry(r, r, h, s || 10);

/* ---------- 各枪构建 ---------- */
function buildRifle() {
  const g = new THREE.Group();
  part(g, bx(0.06, 0.075, 0.5), METAL(), 0, 0, -0.1);                 // 机匣
  part(g, bx(0.05, 0.06, 0.34), WOOD(), 0, -0.004, -0.52);            // 木质护木
  part(g, cy(0.011, 0.5, 8), METAL(), 0, 0.012, -0.78, Math.PI / 2);  // 枪管
  part(g, bx(0.012, 0.05, 0.02), METAL(), 0, 0.055, -0.92);           // 准星
  part(g, bx(0.014, 0.045, 0.03), METAL(), 0, 0.05, -0.32);           // 照门
  part(g, bx(0.05, 0.055, 0.16), METAL(), 0, 0.035, -0.98);           // 消焰器座
  const mag = new THREE.Group(); mag.position.set(0, -0.05, -0.06);
  part(mag, bx(0.045, 0.16, 0.07), BLK(), 0, -0.08, 0, deg(6));       // 弹匣
  g.add(mag);
  part(g, bx(0.045, 0.12, 0.05), BLK(), 0, -0.085, 0.04, deg(-14));   // 握把
  part(g, bx(0.05, 0.075, 0.3), WOOD(), 0, -0.012, 0.24);             // 枪托
  part(g, bx(0.055, 0.03, 0.12), WOOD(), 0, -0.05, 0.42);             // 托底
  const bolt = part(g, bx(0.05, 0.03, 0.08), METAL(), 0.035, 0.02, -0.02);
  // 手套：握把上的右手 + 护木下的左手（低多边形，仅靠体块读形）
  part(g, bx(0.085, 0.1, 0.1), BLK(), 0.01, -0.13, 0.03);
  part(g, bx(0.08, 0.075, 0.11), BLK(), -0.005, -0.09, -0.5);
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.012, -1.02); g.add(muzzle);
  return { g, mag, bolt, muzzle, sight: [-0.004, 0.078, 0] };
}
function buildShotgun() {
  const g = new THREE.Group();
  part(g, bx(0.062, 0.08, 0.42), METAL(), 0, 0, -0.06);               // 机匣
  part(g, cy(0.016, 0.62, 8), METAL(), 0, 0.02, -0.62, Math.PI / 2);  // 粗枪管
  part(g, cy(0.013, 0.56, 8), METAL(), 0, -0.028, -0.58, Math.PI / 2);// 管下弹仓
  part(g, bx(0.055, 0.05, 0.18), WOOD(), 0, -0.028, -0.56);           // 泵动护木
  const pump = part(g, bx(0.058, 0.052, 0.16), WOOD(), 0, -0.028, -0.5);
  part(g, bx(0.012, 0.04, 0.02), METAL(), 0, 0.062, -0.9);            // 准星
  const mag = new THREE.Group();
  part(g, bx(0.05, 0.11, 0.05), BLK(), 0, -0.075, -0.02, deg(-8));    // 弹仓管（换弹时整体不动，取管口压弹）
  part(g, bx(0.055, 0.08, 0.34), WOOD(), 0, -0.035, 0.26);             // 枪托
  part(g, bx(0.09, 0.1, 0.1), BLK(), 0.005, -0.12, 0.1);               // 右手（握把）
  part(g, bx(0.085, 0.08, 0.12), BLK(), -0.005, -0.1, -0.5);           // 左手（泵动护木）
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.02, -0.92); g.add(muzzle);
  return { g, mag, bolt: pump, muzzle, sight: [0, 0.08, 0] };
}
function buildSmg() {
  const g = new THREE.Group();
  part(g, bx(0.055, 0.075, 0.36), BLK(), 0, 0, -0.05);                // 机匣
  part(g, cy(0.01, 0.26, 8), METAL(), 0, 0.008, -0.36, Math.PI / 2);  // 短枪管
  part(g, bx(0.04, 0.05, 0.14), BLK(), 0, -0.005, -0.3);              // 护木
  part(g, bx(0.012, 0.04, 0.02), METAL(), 0, 0.05, -0.46);            // 准星
  const mag = new THREE.Group(); mag.position.set(0, -0.05, -0.04);
  part(mag, bx(0.038, 0.22, 0.055), BLK(), 0, -0.11, 0);              // 长弹匣
  g.add(mag);
  part(g, bx(0.042, 0.11, 0.045), BLK(), 0, -0.08, 0.06, deg(-12));   // 握把
  part(g, bx(0.03, 0.02, 0.24), METAL(), 0, -0.01, 0.24);             // 钢丝折叠托
  part(g, bx(0.05, 0.06, 0.03), BLK(), 0, -0.005, 0.36);              // 托板
  const bolt = part(g, bx(0.012, 0.02, 0.09), METAL(), 0.028, 0.03, -0.05);
  part(g, bx(0.08, 0.095, 0.09), BLK(), 0.005, -0.12, 0.07);
  part(g, bx(0.075, 0.07, 0.1), BLK(), -0.005, -0.085, -0.28);
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.008, -0.5); g.add(muzzle);
  return { g, mag, bolt, muzzle, sight: [0, 0.056, 0] };
}
function buildPistol() {
  const g = new THREE.Group();
  part(g, bx(0.036, 0.05, 0.19), METAL(), 0, 0.012, -0.05);           // 套筒
  part(g, bx(0.032, 0.028, 0.15), METAL(), 0, -0.016, -0.03);         // 底把
  part(g, bx(0.01, 0.028, 0.02), METAL(), 0, 0.045, -0.135);          // 前准星
  part(g, bx(0.012, 0.03, 0.03), METAL(), 0, 0.045, 0.025);           // 照门
  const mag = new THREE.Group(); mag.position.set(0, -0.03, 0.015);
  part(mag, bx(0.03, 0.13, 0.04), BLK(), 0, -0.065, 0);
  g.add(mag);
  part(g, bx(0.034, 0.09, 0.045), BLK(), 0, -0.075, 0.028, deg(-16)); // 握把
  part(g, bx(0.085, 0.1, 0.1), BLK(), 0.005, -0.1, 0.03);             // 握枪手
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.012, -0.16); g.add(muzzle);
  return { g, mag, bolt: null, muzzle, sight: [0, 0.062, -0.05] };
}
function buildKnife() {
  const g = new THREE.Group();
  part(g, bx(0.024, 0.012, 0.26), METAL(), 0, 0.02, -0.12, 0);        // 刀身
  part(g, bx(0.026, 0.014, 0.1), BLK(), 0, 0.0, 0.03);                // 护手
  part(g, bx(0.02, 0.024, 0.12), BLK(), 0, -0.005, 0.12);             // 刀柄
  part(g, bx(0.09, 0.1, 0.1), BLK(), 0.005, -0.03, 0.13);             // 握刀的手
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, 0.02, -0.26); g.add(muzzle);
  return { g, mag: null, bolt: null, muzzle, sight: null };
}

/* ---------- 枪模管理器 ---------- */
export const Vm = {
  guns: {},
  init() {
    this.guns = {
      rifle: buildRifle(), shotgun: buildShotgun(), smg: buildSmg(),
      pistol: buildPistol(), knife: buildKnife()
    };
    // 枪口焰：十字双面片，闪光时随机旋转
    for (const key in this.guns) {
      const gun = this.guns[key];
      const flash = new THREE.Group();
      const fm = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false });
      const p1 = new THREE.Mesh(bx(0.16, 0.02, 0.001), fm);
      const p2 = new THREE.Mesh(bx(0.02, 0.16, 0.001), fm);
      const p3 = new THREE.Mesh(bx(0.1, 0.1, 0.001), fm); p3.rotation.z = 0.7;
      flash.add(p1, p2, p3);
      flash.position.copy(gun.muzzle.position);
      flash.visible = false;
      gun.g.add(flash);
      gun.flash = flash;
      gun.g.visible = false;
      R.vmScene.add(gun.g);
    }
    this.key = 'rifle';
    this.muzzleWorld = new THREE.Vector3();
    // 记录换弹可动件的初始位，动画回位用
    for (const key in this.guns) {
      const gun = this.guns[key];
      if (gun.mag) gun.mag.userData.y0 = gun.mag.position.y;
      if (gun.bolt) gun.bolt.userData.z0 = gun.bolt.position.z;
    }
  },

  show(key) {
    if (this.guns[this.key]) this.guns[this.key].g.visible = false;
    this.key = key;
    this.guns[key].g.visible = true;
  },

  // 触发一次性动画
  kick(kind) {
    this.anim = { t: 0, dur: kind === 'melee' ? 0.4 : kind === 'draw' ? 0.5 : (this._reloadDur || 2.2), kind };
  },
  setReloadDur(d) { this._reloadDur = d; },

  /* 每帧：state = { adsT, sprint, moveK, lookDx, lookDy, recoilKick, firing, reloadT(0..1 或 -1), shell } */
  update(dt, state) {
    const gun = this.guns[this.key];
    if (!gun) return;
    const g = gun.g;
    const ads = clamp(state.adsT, 0, 1);

    // 基础位：腰射右下 → 机瞄中央
    // 腰射偏移需满足 atan(|py|/|pz|) < 半视场角（vm 相机 fov 55° → 27.5°），否则枪会被推到画面外
    const SC = 0.72;
    const hip = [0.135, -0.115, -0.34];
    const aim = gun.sight ? [gun.sight[0], -gun.sight[1] * SC, -0.26] : [0, -0.1, -0.26];
    let px = lerp(hip[0], aim[0], ads);
    let py = lerp(hip[1], aim[1], ads);
    let pz = lerp(hip[2], aim[2], ads);

    // 走路摇晃 + 冲刺 tilt
    const bob = state.moveK * (1 - ads * 0.8);
    px += Math.sin(state.time * 8.4) * 0.006 * bob;
    py += Math.abs(Math.cos(state.time * 8.4)) * 0.007 * bob - 0.003 * bob;
    let rx = 0.02, ry = lerp(deg(3.5), 0, ads), rz = lerp(deg(-2), 0, ads) + state.sprint * deg(9);

    // 后坐：视觉回位
    const rk = state.recoilKick || 0;
    pz += rk * 0.05; rx -= rk * deg(3.6);

    // 视角甩动惯性（ sway ）
    px -= clamp(state.lookDx, -60, 60) * 0.00035;
    py += clamp(state.lookDy, -60, 60) * 0.00035;
    ry += clamp(state.lookDx, -60, 60) * 0.06 * 0.01;

    // 一次性动画叠加
    let drawHidden = false;
    if (this.anim) {
      const a = this.anim; a.t += dt;
      const t = a.t / a.dur;
      if (a.kind === 'draw') {
        const k = t < 0.25 ? 1 - t / 0.25 : 0;
        py -= k * 0.35; rx += k * deg(22);
      } else if (a.kind === 'reload') {
        // 下半倾 → 中段回正 → 上膛抬起
        const dip = Math.sin(clamp(t, 0, 1) * Math.PI) * deg(24);
        py -= 0.12 * Math.sin(clamp(t, 0, 1) * Math.PI); rx += dip;
        if (gun.mag && gun.mag.userData.y0 !== undefined) gun.mag.position.y = gun.mag.userData.y0 - clamp((t - 0.15) / 0.2, 0, 1) * 0.16 + clamp((t - 0.5) / 0.2, 0, 1) * 0.16;
        if (gun.bolt) gun.bolt.position.z = (gun.bolt.userData.z0 || 0) + (t > 0.75 ? 0.04 * (1 - (t - 0.75) / 0.25) : t > 0.7 ? 0.04 : 0);
      } else if (a.kind === 'melee') {
        // 军刀斜劈
        const k = Math.sin(clamp(t, 0, 1) * Math.PI);
        px += 0.12 * k; py += 0.1 * k;
        rx -= deg(50) * k; rz += deg(70) * k; ry -= deg(25) * k;
      }
      if (a.t >= a.dur) { this.anim = null; if (gun.mag && gun.mag.userData.y0 !== undefined) gun.mag.position.y = gun.mag.userData.y0; }
    } else if (gun.mag) gun.mag.position.y = gun.mag.userData.y0 !== undefined ? gun.mag.userData.y0 : -0.05;

    // 逐发压弹（霰弹枪）：弹仓管不进弹匣，简化为节奏性小幅抖动
    if (state.shell > 0 && gun.g === this.guns.shotgun.g) py += Math.sin(state.shell * 40) * 0.004;

    g.position.set(px, py, pz);
    g.rotation.set(rx, ry, rz);
    g.scale.setScalar(0.72 * (this.guns[this.key] === this.guns.pistol ? 1.2 : 1));

    // 枪口焰
    if (gun.flash) {
      const on = (state.flashT || 0) > 0;
      gun.flash.visible = on;
      if (on) {
        gun.flash.rotation.z = rand(0, 6.28);
        const s = rand(0.8, 1.3);
        gun.flash.scale.set(s, s, 1);
      }
    }

    // 世界空间的枪口位置（曳光弹起点）
    gun.muzzle.getWorldPosition(this.muzzleWorld);
  }
};
