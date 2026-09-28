/* 玩家控制器：COD 手感移动（走/蹲/跳/冲刺）+ 弹道后坐叠加视角 + 自动回血
 * 视角 = 鼠标 yaw/pitch + 后坐偏移 recoilPitch/Yaw（随时间回落） */
import * as THREE from 'three';
import { clamp, lerp, deg, smoothDamp } from '../core/util.js';
import { R } from '../core/render.js';
import { Input } from '../core/input.js';
import { Snd } from '../core/audio.js';

const EYE = { stand: 1.66, crouch: 0.96 };
const GRAV = 21;

export class Player {
  constructor(world, spawn) {
    this.world = world;
    this.actor = world.addActor({
      pos: spawn.clone(), vel: new THREE.Vector3(),
      radius: 0.36, height: 1.8, team: 'player', alive: true, noHit: true
    });
    this.yaw = 0; this.pitch = 0;
    this.recoilPitch = 0; this.recoilYaw = 0;
    this.adsT = 0; this.crouching = false; this.sprinting = false;
    this.crouchK = 0;                 // 蹲伏插值进度：0=站立 1=蹲下（必须显式初始化，见 update() 相机段注释）
    this.hp = 100; this.maxHp = 100;
    this.regenDelay = 0;              // 受击后到开始回血的剩余秒数
    this.stamina = 1;                 // 冲刺体力（0~1）
    this.spreadGrow = 0;              // 连射累积散布（度）
    this.onGround = true;
    this.bob = 0; this.stepDist = 0;
    this.dead = false;
    this.stats = { shots: 0, hits: 0, kills: 0, heads: 0, time: 0 };
    this._prevFall = 0;
  }

  place(p) { this.actor.pos.copy(p); this.actor.vel.set(0, 0, 0); }

  /* ---------- 射击接口 ---------- */
  addRecoil(def, kickScale = 1) {
    const ramp = def.recoilRamp || 1;
    this.recoilPitch += deg(def.recoilV) * Math.pow(ramp, this._burstK || 0) * kickScale;
    this.recoilYaw += deg(def.recoilH) * (Math.random() * 2 - 1) * kickScale;
    this.spreadGrow = Math.min(def.spreadMax || 3, this.spreadGrow + (def.spreadRamp || 0.2));
    this._burstK = Math.min(6, (this._burstK || 0) + 0.55);
  }
  getAimDir(out) {                        // 当前视角朝向（含后坐）
    out.set(0, 0, -1).applyEuler(new THREE.Euler(this.pitch + this.recoilPitch, this.yaw + this.recoilYaw, 0, 'YXZ'));
    return out;
  }
  eyePos(out) {                           // 眼位（供 AI/音效的直线检测用）
    const eye = lerp(EYE.stand, EYE.crouch, this.crouching ? 1 : 0);
    return out.copy(this.actor.pos).add(new THREE.Vector3(0, eye, 0));
  }
  // 相机世界朝向（含后坐），out 为单位向量
  camDir(out) { return this.getAimDir(out); }

  /* ---------- 受击与回血（僵尸模式：掉血后停火数秒自动回满） ---------- */
  damage(amount, fromPos) {
    if (this.dead) return;
    this.hp = Math.max(0, this.hp - amount);
    this.regenDelay = 6.0;
    this.stats.lastHitFrom = fromPos ? { x: fromPos.x - this.actor.pos.x, z: fromPos.z - this.actor.pos.z } : null;
    Snd.pain();
    if (this.hp <= 0) { this.dead = true; this.aliveFalse(); }
  }
  aliveFalse() { this.actor.alive = false; }

  /* ---------- 每帧更新 ---------- */
  update(dt, look, want) {
    const W = this.world, a = this.actor;
    this.stats.time += dt;

    // --- 视角 ---
    const sens = deg(0.022) * Input.sensitivity * (this.adsT > 0.5 ? 0.45 : 1);
    this.yaw -= look.dx * sens;
    this.pitch = clamp(this.pitch - look.dy * sens, -deg(87), deg(87));
    // 后坐回落：先快后慢
    this.recoilPitch = smoothDamp(this.recoilPitch, 0, 6.5, dt);
    this.recoilYaw = smoothDamp(this.recoilYaw, 0, 6.5, dt);
    if (!want.firing) this._burstK = 0;
    this.spreadGrow = Math.max(0, this.spreadGrow - (this.spreadGrow * 6 + 0.4) * dt);

    // --- 机瞄插值与视场角 ---
    this.adsT = clamp(this.adsT + (want.ads ? dt / 0.13 : -dt / 0.1), 0, 1);
    const baseFov = this.sprinting ? 82 : 75;
    R.setFov(lerp(baseFov, want.adsFov || 63, this.adsT));

    // --- 移动输入 → 愿望速度 ---
    let mx = want.right, mz = want.fwd;                  // -1..1
    if (Input.touch && window.__touch) {                // 触屏摇杆叠加
      mx += window.__touch.move.x; mz += -window.__touch.move.y;
    }
    mx = clamp(mx, -1, 1); mz = clamp(mz, -1, 1);

    // 冲刺：按住 Shift 且前进且未机瞄；机瞄/射击时立即退出
    const wantSprint = want.sprint && mz > 0.3 && this.adsT < 0.2 && !this.slowTimer;
    this.sprinting = wantSprint && this.stamina > 0.02 && !want.fireNow;
    if (this.sprinting) { this.stamina = Math.max(0, this.stamina - dt / 6.5); }
    else { this.stamina = Math.min(1, this.stamina + dt / 9); }
    if (wantSprint && this.stamina <= 0.02) this.slowTimer = 0.9;   // 力竭慢走
    if (this.slowTimer) { this.slowTimer -= dt; if (this.slowTimer <= 0) this.slowTimer = 0; }

    this.crouching = !!want.crouch;
    const speed = this.dead ? 0
      : this.sprinting ? 7.2
      : this.crouching ? 1.9
      : this.adsT > 0.5 ? 2.6
      : 4.6;

    // 前向 (-sin yaw, -cos yaw)、右向 (cos yaw, -sin yaw)；输入向量限幅到单位长
    const len = Math.min(1, Math.hypot(mx, mz));
    const inv = Math.hypot(mx, mz) > 1e-6 ? len / Math.hypot(mx, mz) : 0;
    const ix = mx * inv, iz = mz * inv;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const wishX = ix * cos + iz * -sin;
    const wishZ = ix * -sin + iz * -cos;
    const accel = this.onGround ? 42 : 9;
    a.vel.x = approachLinear(a.vel.x, wishX * speed, accel * dt);
    a.vel.z = approachLinear(a.vel.z, wishZ * speed, accel * dt);

    // --- 跳跃与重力 ---
    if (want.jump && this.onGround && !this.crouching) { a.vel.y = 7.6; this.onGround = false; }
    a.vel.y = Math.max(-32, a.vel.y - GRAV * dt);

    // --- 物理求解 ---
    const res = W.moveActor(a, dt, { stepUp: 0.5, floor: 0 });
    this.onGround = res.onGround;
    a._fallSpeed = a.vel.y;

    // --- 脚步声（冲刺一步一听） ---
    const hv = Math.hypot(a.vel.x, a.vel.z);
    if (res.onGround && hv > 1) {
      this.stepDist += hv * dt;
      const stride = this.sprinting ? 2.4 : this.crouching ? 3.2 : 1.9;
      if (this.stepDist > stride) {
        this.stepDist = 0;
        if (!this.crouching) Snd.foot(this.sprinting);
      }
    }

    // --- 回血 ---
    if (!this.dead) {
      if (this.regenDelay > 0) this.regenDelay -= dt;
      else if (this.hp < this.maxHp) {
        this.hp = Math.min(this.maxHp, this.hp + 34 * dt);
        if (this.hp >= this.maxHp) Snd.ching(false);
      }
    }

    // --- 相机 ---
    const cam = R.camera;
    // 蹲伏插值：crouchK 0=站立、1=蹲下，0.18 秒走完。
    // 注意：这里绝不能用 `this.crouchK || 1` 兜底——crouchK 递减到 0 时 0 是 falsy，
    // `0 || 1` 会把它弹回 1，相机高度就在 1.66/0.96 之间反复跳，表现为
    // 「主角半身卡在地下 + 画面持续闪动」。故 crouchK 在构造函数里显式初始化为 0。
    this.crouchK = clamp(this.crouchK + (this.crouching ? dt / 0.18 : -dt / 0.18), 0, 1);
    const eye = lerp(EYE.stand, EYE.crouch, smoothK(this.crouchK));
    this.bob += hv * dt * (this.sprinting ? 1.7 : 1);
    const bobA = this.adsT > 0.6 ? 0.004 : this.sprinting ? 0.05 : 0.028;
    const moving = hv > 0.5 && res.onGround ? 1 : 0;
    cam.position.set(
      a.pos.x,
      a.pos.y + eye + Math.sin(this.bob * 9.4) * bobA * moving,
      a.pos.z
    );
    cam.rotation.set(
      this.pitch + this.recoilPitch + Math.sin(this.bob * 4.7) * 0.006 * moving,
      this.yaw + this.recoilYaw,
      Math.sin(this.bob * 4.7) * (this.sprinting ? 0.02 : 0.008) * moving
    );
    this.camera = cam;
  }
}

function approachLinear(v, t, d) {
  if (v < t) return Math.min(t, v + d);
  if (v > t) return Math.max(t, v - d);
  return t;
}
const smoothK = (k) => k * k * (3 - 2 * k);
