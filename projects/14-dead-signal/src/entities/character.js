/* 角色：低多边形亡灵士兵 —— 解析命中盒 + 无骨骼的程序化动画（绕枢轴摆动）
 * 状态机：walk / attack / stagger / dead，全部在 update 里按时间驱动。 */
import * as THREE from 'three';
import { rand, pick, zombieNames } from '../core/util.js';

const SKINS = [0x7f8f6b, 0x8fa08a, 0x6d7a5e, 0x97a284];       // 病态绿灰皮肤
const UNIFORMS = [0x37402c, 0x4a4438, 0x2f3438, 0x55513f];    // 破烂军装
const PANTS = [0x2c2f28, 0x3d3a30, 0x23282a];

let nextId = 1;

export class ZombieChar {
  constructor(world, opts = {}) {
    this.id = nextId++;
    this.name = opts.name || pick(zombieNames);
    this.bot = null;                       // 反向引用所属 AI 条目（射击结算时找回 Bots 对象）
    this.group = new THREE.Group();

    // ---- 材质（每具独立实例，便于受击闪白） ----
    const skinC = pick(SKINS), uniC = pick(UNIFORMS), pantC = pick(PANTS);
    const dark = 0x15100c;
    this.matSkin = new THREE.MeshStandardMaterial({ color: skinC, roughness: 1 });
    this.matUni = new THREE.MeshStandardMaterial({ color: uniC, roughness: 1 });
    this.matPant = new THREE.MeshStandardMaterial({ color: pantC, roughness: 1 });
    const matBoot = new THREE.MeshStandardMaterial({ color: dark, roughness: 0.9 });

    const box = (w, h, d, m, x, y, z, parent) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      (parent || this.group).add(mesh);
      return mesh;
    };

    // ---- 躯干 / 头 ----
    this.torso = box(0.52, 0.72, 0.32, this.matUni, 0, 1.1, 0);
    this.head = box(0.26, 0.3, 0.26, this.matSkin, 0, 1.72, 0.02);
    box(0.3, 0.1, 0.3, this.matPant, 0, 1.44, 0, this.head);      // 乱发/残破帽檐
    // 前扑姿态：躯干略前倾
    this.torso.rotation.x = 0.14;

    // ---- 四肢（枢轴在根部，摆动 = 绕枢轴旋转） ----
    const limb = (m, x, y, z, w, h) => {
      const p = new THREE.Group(); p.position.set(x, y, z);
      const mesh = box(w, h, w, m, 0, -h / 2, 0, p);
      this.group.add(p);
      return p;
    };
    // 手臂前伸（僵尸经典 pose）
    this.armL = limb(this.matUni, -0.36, 1.42, 0, 0.14, 0.62);
    this.armR = limb(this.matUni, 0.36, 1.42, 0, 0.14, 0.62);
    this.armL.rotation.x = -1.15; this.armR.rotation.x = -1.0;
    limb(this.matSkin, -0.36, 1.42, 0.3, 0.12, 0.34);             // 前臂+手（接在上臂方向，简化直接伸出）
    limb(this.matSkin, 0.36, 1.42, 0.3, 0.12, 0.34);
    // 腿
    this.legL = limb(this.matPant, -0.14, 0.76, 0, 0.17, 0.66);
    this.legR = limb(this.matPant, 0.14, 0.76, 0, 0.17, 0.66);
    limb(matBoot, -0.14, 0.1, 0.04, 0.19, 0.14);
    limb(matBoot, 0.14, 0.1, 0.04, 0.19, 0.14);

    // ---- 物理命中盒 ----
    const h = opts.height || rand(1.82, 1.96);
    this.actor = world.addActor({
      pos: new THREE.Vector3(0, 0, 0),
      vel: new THREE.Vector3(),            // moveActor 依赖：缺失会让 AI 每帧抛错
      _fallSpeed: 0,
      height: h, bodyW: 0.6, bodyD: 0.42, headR: 0.21,
      radius: 0.34, team: opts.team, alive: true, owner: this
    });

    // ---- 动画状态 ----
    this.phase = rand(0, 6.28);        // 步态相位（错开多具尸体避免整齐划一）
    this.state = 'walk';
    this.speed = 0;
    this.staggerT = 0;
    this.attackT = -1;
    this.flash = 0;
    this.deathT = -1;
    this.colBase = {
      skin: new THREE.Color(skinC), uni: new THREE.Color(uniC)
    };
  }

  place(x, y, z) {
    this.actor.pos.set(x, y, z);
    this.group.position.set(x, y, z);
  }

  // 受击：闪白 + 硬直
  hitReact() {
    this.flash = 0.12;
    if (this.state !== 'dead') { this.state = 'stagger'; this.staggerT = 0.22; }
  }

  kill() {
    this.state = 'dead';
    this.deathT = 0;
    this.actor.alive = false;
  }

  update(dt, facingYaw) {
    const g = this.group;
    g.position.copy(this.actor.pos);
    g.rotation.y = facingYaw;

    // 受击闪白衰减
    if (this.flash > 0) {
      this.flash -= dt;
      const k = 1.8;
      this.matSkin.color.copy(this.colBase.skin).multiplyScalar(1 + k);
      this.matUni.color.copy(this.colBase.uni).multiplyScalar(1 + k);
      if (this.flash <= 0) {
        this.matSkin.color.copy(this.colBase.skin);
        this.matUni.color.copy(this.colBase.uni);
      }
    }

    this.phase += dt * (2.5 + this.speed * 2.2);
    const sw = Math.sin(this.phase);

    if (this.state === 'walk') {
      this.legL.rotation.x = sw * 0.55;
      this.legR.rotation.x = -sw * 0.55;
      this.armL.rotation.x = -1.15 + sw * 0.12;
      this.armR.rotation.x = -1.0 - sw * 0.12;
      this.torso.position.y = 1.1 + Math.abs(sw) * 0.035;         // 蹒跚起伏
      this.head.rotation.z = sw * 0.08;
    } else if (this.state === 'attack') {
      this.attackT += dt;
      const t = Math.min(1, this.attackT / 0.5);
      const lunge = Math.sin(t * Math.PI);                        // 前扑一下
      this.armL.rotation.x = -1.15 - lunge * 0.7;
      this.armR.rotation.x = -1.0 - lunge * 0.7;
      this.torso.rotation.x = 0.14 + lunge * 0.25;
      if (this.attackT > 0.55) { this.attackT = -1; this.state = 'walk'; }
    } else if (this.state === 'stagger') {
      this.staggerT -= dt;
      this.torso.rotation.x = 0.14 - 0.3;                          // 被打得后仰
      this.head.rotation.x = -0.3;
      if (this.staggerT <= 0) { this.state = 'walk'; this.head.rotation.x = 0; }
    } else if (this.state === 'dead') {
      this.deathT += dt;
      const t = Math.min(1, this.deathT / 0.5);
      g.rotation.x = -t * t * 1.5;                                 // 向前栽倒
      g.position.y = this.actor.pos.y + 0.12;
      this.armL.rotation.x = -0.3; this.armR.rotation.x = -0.5;
      if (this.deathT > 1.15 && !this.removed) { g.visible = false; }
    }
  }

  dispose(world) {
    world.removeActor(this.actor);
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    [this.matSkin, this.matUni, this.matPant].forEach((m) => m && m.dispose());
  }
}
