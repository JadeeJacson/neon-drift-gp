// game.js — 玩法循环：竞速计时赛 + 跑腿派单。
//
// 硬约束 1 要求「有开始、有进行中状态、有结束条件」，场景 demo 满足不了，
// 所以这里补上完整的一套状态机：
//   menu → countdown(3-2-1-GO) → running → finished(结算面板，可重开)
// 两种玩法共用同一台状态机与同一套「检查点必须按顺序通过」的判定。
//
// 竞速：路网矩形环线 + 沿边均匀布闸门。中间闸门不是为了好看——它逼你贴着
//       赛道走，抄近路穿楼会被判定漏门，漏门就不计圈速。
// 派单：在取货点接单 → 开到卸货点，全程倒计时，超时失败。
//
// 漂移分：甩尾时按「侧滑角 × 车速 × 持续时间」累积，撞车清零，完赛结算。
// 结算与最佳成绩写 localStorage，刷新不丢。
import * as THREE from 'three';
import { CROSS } from './layout.js';
import { nightEmissive } from './fx.js';
import { CIRCUITS, JOBS, buildCircuit, GATE_RADIUS, driftRate } from './circuits.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const BEST_KEY = 'tokyo-city.best.v1';

// ---- 赛道与派单定义在 circuits.js（纯逻辑，可无头测试）----

export class Game {
  constructor({ scene, layout, car }) {
    this.scene = scene;
    this.layout = layout;
    this.car = car;

    this.phase = 'menu';   // menu | countdown | running | finished
    this.mode = null;      // 'circuit' | 'job'
    this.time = 0;
    this.countdown = 0;
    this.driftScore = 0;
    this.bankedScore = 0;
    this.crashes = 0;
    this.onEvent = () => {};   // 结算/阶段切换时通知 HUD

    this.gates = [];
    this.gateGroup = new THREE.Group();
    this.gateGroup.name = 'race-gates';
    scene.add(this.gateGroup);

    this.markers = new THREE.Group();
    this.markers.name = 'job-markers';
    scene.add(this.markers);

    this.circuits = CIRCUITS.map((d) => buildCircuit(layout, d));
    this.jobs = JOBS;
    this.jobIndex = 0;
    this.jobStage = null;   // 'pickup' | 'dropoff'

    this._buildMarkers();
    this.best = this._loadBest();
  }


  _buildMarkers() {
    // 派单接取点（一个发光的旋转环 + 地面光斑）
    this.markerMeshes = new Map();
    for (const j of this.jobs) {
      const g = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(6, 0.5, 8, 28),
        nightEmissive(new THREE.MeshStandardMaterial({ color: 0x1a1d24, emissive: 0x36e08a, emissiveIntensity: 1, roughness: 0.4 }), 2.0)
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 6;
      g.add(ring);
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(5.4, 5.4, 12, 20, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x36e08a, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
      );
      beam.position.y = 6;
      g.add(beam);
      g.position.set(j.fromXZ[0], 0, j.fromXZ[1]);
      g.visible = false;
      this.markers.add(g);
      this.markerMeshes.set(j.id, { group: g, ring, beam });
    }
  }

  // ---------------- 流程控制 ----------------
  get activeJob() { return this.jobs[this.jobIndex % this.jobs.length]; }

  startCircuit(id) {
    const c = this.circuits.find((x) => x.id === id);
    if (!c) return;
    this.mode = 'circuit';
    this.circuit = c;
    this.jobStage = null;
    this._showCircuitGates(c);
    this._hideMarkers();
    // 车放到起点闸门，朝向沿赛道前进方向
    const g0 = c.gates[0], g1 = c.gates[1];
    this._placeCarAtGate(g0, g1);
    this._beginCountdown();
  }

  startJob() {
    const j = this.activeJob;
    this.mode = 'job';
    this.circuit = null;
    this._clearGates();
    this.jobStage = 'pickup';
    this.jobLimit = j.limit;
    this._showMarker(j.id, j.fromXZ);
    // 车放在取货点附近
    this.car.reset(j.fromXZ[0] + 6, j.fromXZ[1] + 14, Math.PI);
    this._beginCountdown();
  }

  _beginCountdown() {
    this.phase = 'countdown';
    this.countdown = 3.2;
    this.time = 0;
    this.driftScore = 0;
    this.bankedScore = 0;
    this.crashes = 0;
    this.gateIndex = 0;
    this.lap = 0;
    this.result = null;
    this.onEvent({ type: 'countdown' });
  }

  abort() {
    this.phase = 'menu';
    this.mode = null;
    this._clearGates();
    this._hideMarkers();
    this.onEvent({ type: 'menu' });
  }

  _placeCarAtGate(g0, g1) {
    const dx = g1.x - g0.x, dz = g1.z - g0.z;
    const len = Math.hypot(dx, dz) || 1;
    const yaw = Math.atan2(dx / len, dz / len);
    this.car.reset(g0.x - (dx / len) * 14, g0.z - (dz / len) * 14, yaw);
    this.car.body.visible = true;
  }

  // ---------------- 闸门可视化 ----------------
  // 闸门刻意不用 nightEmissive：它是玩法反馈，必须白天夜里一样亮，
  // 否则白天比赛时玩家看不见下一个闸在哪。
  _showCircuitGates(c) {
    this._clearGates();
    for (const g of c.gates) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0e1620, emissive: 0x2ea8ff, emissiveIntensity: 2.2, roughness: 0.35,
      });
      const m = new THREE.Mesh(new THREE.TorusGeometry(9, 0.42, 8, 26), mat);
      m.position.set(g.x, 7, g.z);
      // 环面立起来，法线垂直于赛道前进方向
      const next = c.gates[(g.index + 1) % c.gates.length];
      m.rotation.y = Math.atan2(next.x - g.x, next.z - g.z);
      this.gateGroup.add(m);
      this.gates.push(m);
    }
  }

  _clearGates() {
    for (const g of this.gates) {
      g.geometry?.dispose?.();
      g.material?.dispose?.();
      this.gateGroup.remove(g);
    }
    this.gates.length = 0;
  }

  _showMarker(id, xz) {
    for (const [k, v] of this.markerMeshes) v.group.visible = (k === id);
    const m = this.markerMeshes.get(id);
    if (m) m.group.position.set(xz[0], 0, xz[1]);
  }

  _hideMarkers() {
    for (const v of this.markerMeshes.values()) v.group.visible = false;
  }

  // ---------------- 存档 ----------------
  _loadBest() {
    try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}'); }
    catch { return {}; }
  }
  _saveBest() {
    try { localStorage.setItem(BEST_KEY, JSON.stringify(this.best)); } catch { /* 隐私模式忽略 */ }
  }

  // ---------------- 每帧更新 ----------------
  update(dt) {
    if (this.phase === 'countdown') {
      this.countdown -= dt;
      if (this.countdown <= 0) {
        this.phase = 'running';
        this.onEvent({ type: 'start' });
      }
      this._animateMarkers(dt);
      return;
    }
    if (this.phase !== 'running') {
      this._animateMarkers(dt);
      return;
    }

    this.time += dt;

    // 漂移分：侧滑越大、车越快，涨分越快；靠车头行驶（无侧滑）不涨
    const car = this.car;
    const rate = driftRate(car.drift, car.speed);
    if (rate > 0) this.driftScore += rate * dt;
    else this.driftScore = Math.max(0, this.driftScore - 40 * dt); // 不漂移慢慢回落，鼓励连贯

    if (this.mode === 'circuit') this._updateCircuit(dt);
    else if (this.mode === 'job') this._updateJob(dt);

    this._animateMarkers(dt);
  }

  _updateCircuit(dt) {
    const car = this.car;
    const gates = this.circuit.gates;
    if (!gates.length) return;
    const g = gates[this.gateIndex];
    const d = Math.hypot(car.pos.x - g.x, car.pos.z - g.z);
    if (d < GATE_RADIUS) {
      this.gateIndex++;
      if (this.gateIndex >= gates.length) {
        this.gateIndex = 0;
        this.lap++;
        if (this.lap >= this.circuit.laps) { this._finishCircuit(); return; }
      }
    }
    // 高亮下一个闸门：绿=要过的那个，蓝=其它
    const next = this.gateIndex;
    for (let i = 0; i < this.gates.length; i++) {
      this.gates[i].material.emissive.setHex(i === next ? 0x36ff9a : 0x2ea8ff);
    }
  }

  _updateJob(dt) {
    const car = this.car;
    const j = this.activeJob;
    const target = this.jobStage === 'pickup' ? j.fromXZ : j.toXZ;
    const d = Math.hypot(car.pos.x - target[0], car.pos.z - target[1]);

    // 剩余时间（倒计时）
    const left = this.jobLimit - this.time;
    if (left <= 0) {
      this._finishJob(false, '超时，订单作废');
      return;
    }
    if (d < 13) {
      if (this.jobStage === 'pickup') {
        this.jobStage = 'dropoff';
        this._showMarker(j.id, j.toXZ);
        this.bankedScore += 200;
        this.onEvent({ type: 'stage', stage: 'dropoff', job: j });
      } else {
        this._finishJob(true);
      }
    }
  }

  _finishCircuit() {
    const t = this.time;
    const prev = this.best[this.circuit.id];
    const isRecord = prev == null || t < prev;
    if (isRecord) { this.best[this.circuit.id] = t; this._saveBest(); }
    this.phase = 'finished';
    this.result = {
      type: 'circuit',
      title: this.circuit.name,
      time: t,
      laps: this.circuit.laps,
      record: isRecord,
      prevBest: prev,
      drift: Math.round(this.driftScore),
      crashes: this.crashes,
      payout: Math.round(this.driftScore * (isRecord ? 1.5 : 1)),
    };
    this._clearGates();
    this.onEvent({ type: 'finish', result: this.result });
  }

  _finishJob(success, reason) {
    this.phase = 'finished';
    const j = this.activeJob;
    const left = success ? this.jobLimit - this.time : 0;
    this.result = {
      type: 'job',
      title: j.label,
      success,
      reason,
      time: this.time,
      left,
      drift: Math.round(this.driftScore),
      crashes: this.crashes,
      payout: success ? j.pay + Math.round(this.driftScore * 0.5) : 0,
    };
    this._hideMarkers();
    if (success) { this.jobIndex = (this.jobIndex + 1) % this.jobs.length; }
    this.onEvent({ type: 'finish', result: this.result });
  }

  registerCrash() {
    if (this.phase !== 'running') return;
    this.crashes++;
    this.driftScore = 0; // 撞车清零：这是漂移分的核心风险
  }

  _animateMarkers(dt) {
    const t = performance.now() * 0.001;
    for (const v of this.markerMeshes.values()) {
      if (!v.group.visible) continue;
      v.ring.rotation.z = t * 1.1;
      v.ring.position.y = 6 + Math.sin(t * 2) * 0.4;
      v.beam.material.opacity = 0.12 + 0.07 * Math.sin(t * 3);
    }
  }

  // 给 HUD 用的只读快照
  get hud() {
    const j = this.activeJob;
    let sub = '';
    if (this.mode === 'job') {
      sub = this.jobStage === 'pickup' ? `前往取货 · ${j.from}` : `送达 ${j.to}`;
    }
    return {
      phase: this.phase,
      mode: this.mode,
      countdown: Math.max(0, Math.ceil(this.countdown - 0.2)),
      time: this.time,
      left: this.mode === 'job' ? Math.max(0, this.jobLimit - this.time) : null,
      drift: Math.round(this.driftScore),
      sub,
      job: j,
      circuits: this.circuits.map((c) => ({ id: c.id, name: c.name, best: this.best[c.id] ?? null, laps: c.laps, difficulty: c.difficulty, blurb: c.blurb })),
      result: this.result,
    };
  }
}
