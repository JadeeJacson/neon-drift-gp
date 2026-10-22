// game.js — 玩法循环：赛道计时赛 / 跑腿派单 / 地标打卡。
//
// 三种玩法共用一台状态机：
//   menu → countdown(3-2-1-GO，车被锁住) → running → finished(结算面板，可重开)
//
// 赛道：路网矩形环线 + 沿边均匀布闸门。闸门必须按顺序通过，抄近路穿楼会漏门。
// 派单：取货 → 送达，全程倒计时。连续完成订单有连击加成，撞车会损坏货物扣酬金。
// 打卡：按顺序经过东京地标，路线自选，计时拿奖牌。
//
// 漂移分：侧滑角 × 车速 × 持续时间累积，撞车清零，完赛结算进奖金。
// 成绩 / 奖牌 / 钱包全部交给 progress.js 存档。
import * as THREE from 'three';
import { nightEmissive } from './fx.js';
import {
  CIRCUITS, JOBS, RALLY, buildCircuit, GATE_RADIUS, POINT_RADIUS, driftRate, rallyDistance,
} from './circuits.js';
import { medalTargets } from './progress.js';

const CIRCUIT_PAY = { shibuya: 800, midtown: 1600, bayline: 2200 };
const RALLY_PAY = 2500;

export class Game {
  constructor({ scene, layout, car, progress }) {
    this.scene = scene;
    this.layout = layout;
    this.car = car;
    this.progress = progress;

    this.phase = 'menu';   // menu | countdown | running | finished
    this.mode = null;      // 'circuit' | 'job' | 'rally'
    this.time = 0;
    this.countdown = 0;
    this.driftScore = 0;
    this.crashes = 0;
    this.onEvent = () => {};

    this.gates = [];
    this.gateGroup = new THREE.Group();
    this.gateGroup.name = 'race-gates';
    scene.add(this.gateGroup);

    this.circuits = CIRCUITS.map((d) => buildCircuit(layout, d));
    this.jobs = JOBS;
    this.jobIndex = 0;
    this.jobStage = null;   // 'pickup' | 'dropoff'
    this.jobStreak = 0;
    this.rallyIndex = 0;
    this.lapTimes = [];

    this._buildMarker();
  }

  // ---------------- 目标标记（取货点 / 卸货点 / 打卡点共用一个）----------------
  _buildMarker() {
    const g = new THREE.Group();
    g.name = 'objective-marker';
    this.markerMat = nightEmissive(
      new THREE.MeshStandardMaterial({ color: 0x1a1d24, emissive: 0x36e08a, emissiveIntensity: 1, roughness: 0.4 }), 2.0);
    // 白天也要看得见：额外叠一层不受光照的发光体
    const ring = new THREE.Mesh(new THREE.TorusGeometry(6, 0.5, 8, 28), this.markerMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 6;
    g.add(ring);
    this.beamMat = new THREE.MeshBasicMaterial({
      color: 0x36e08a, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.4, 60, 20, 1, true), this.beamMat);
    beam.position.y = 30;
    g.add(beam);
    g.visible = false;
    this.scene.add(g);
    this.marker = { group: g, ring, beam };
  }

  _showMarker(xz, color = 0x36e08a) {
    this.marker.group.visible = true;
    this.marker.group.position.set(xz[0], 0, xz[1]);
    this.markerMat.emissive.setHex(color);
    this.beamMat.color.setHex(color);
  }

  _hideMarker() { this.marker.group.visible = false; }

  // ---------------- 流程控制 ----------------
  get activeJob() { return this.jobs[this.jobIndex % this.jobs.length]; }
  get locked() { return this.phase === 'countdown'; }
  get active() { return this.phase === 'countdown' || this.phase === 'running'; }

  circuitById(id) { return this.circuits.find((x) => x.id === id); }

  startCircuit(id) {
    const c = this.circuitById(id);
    if (!c) return;
    this.mode = 'circuit';
    this.circuit = c;
    this.jobStage = null;
    this._hideMarker();
    this._showCircuitGates(c);
    this._placeCarAtGate(c.gates[0], c.gates[1]);
    this._beginCountdown();
  }

  /** chain=true：接着上一单从当前位置继续（连击不断） */
  startJob({ chain = false, skip = false } = {}) {
    if (skip) { this.jobIndex = (this.jobIndex + 1) % this.jobs.length; this.jobStreak = 0; }
    if (!chain) this.jobStreak = 0;
    const j = this.activeJob;
    this.mode = 'job';
    this.circuit = null;
    this._clearGates();
    this.jobLimit = j.limit;
    const near = Math.hypot(this.car.pos.x - j.fromXZ[0], this.car.pos.z - j.fromXZ[1]) < 60;
    if (chain && near) {
      // 上一单的终点就是这一单的起点：直接装货出发
      this.jobStage = 'dropoff';
      this._showMarker(j.toXZ, 0xffc93d);
    } else {
      this.jobStage = 'pickup';
      this._showMarker(j.fromXZ, 0x36e08a);
      this.car.reset(j.fromXZ[0] + 6, j.fromXZ[1] + 14, Math.PI);
    }
    this._beginCountdown(chain ? 1.6 : 3.2);
  }

  startRally() {
    this.mode = 'rally';
    this.circuit = null;
    this.jobStage = null;
    this._clearGates();
    this.rallyIndex = 0;
    this._showMarker(RALLY.points[0].xz, 0xff5fd2);
    this.car.reset(RALLY.start[0] + 6, RALLY.start[1] + 14, Math.PI);
    this._beginCountdown();
  }

  restart() {
    if (this.mode === 'circuit' && this.circuit) this.startCircuit(this.circuit.id);
    else if (this.mode === 'job') this.startJob();
    else if (this.mode === 'rally') this.startRally();
  }

  _beginCountdown(sec = 3.2) {
    this.phase = 'countdown';
    this.countdown = sec;
    this._lastTick = Math.ceil(sec);
    this.time = 0;
    this.driftScore = 0;
    this.peakDrift = 0;
    this.crashes = 0;
    this.gateIndex = 0;
    this.lap = 0;
    this.lapStart = 0;
    this.lapTimes = [];
    this.result = null;
    this.car.vel.set(0, 0);
    this.onEvent({ type: 'countdown' });
  }

  abort() {
    if (this.mode === 'job') this.jobStreak = 0;
    this.phase = 'menu';
    this.mode = null;
    this.circuit = null;
    this._clearGates();
    this._hideMarker();
    this.onEvent({ type: 'menu' });
  }

  _placeCarAtGate(g0, g1, back = 14) {
    const dx = g1.x - g0.x, dz = g1.z - g0.z;
    const len = Math.hypot(dx, dz) || 1;
    const yaw = Math.atan2(dx / len, dz / len);
    this.car.reset(g0.x - (dx / len) * back, g0.z - (dz / len) * back, yaw);
  }

  /** 复位点：赛道回到上一个闸门；其它玩法交给调用方吸附到最近道路 */
  respawnPoint() {
    if (this.mode === 'circuit' && this.circuit && this.active) {
      const gs = this.circuit.gates;
      const prev = gs[(this.gateIndex - 1 + gs.length) % gs.length];
      const next = gs[this.gateIndex];
      const dx = next.x - prev.x, dz = next.z - prev.z;
      const len = Math.hypot(dx, dz) || 1;
      return { x: prev.x + (dx / len) * 4, z: prev.z + (dz / len) * 4, yaw: Math.atan2(dx / len, dz / len) };
    }
    return null;
  }

  /** 当前导航目标（给 HUD 指向箭头与小地图用） */
  get navTarget() {
    if (!this.active) return null;
    if (this.mode === 'circuit' && this.circuit) {
      const g = this.circuit.gates[this.gateIndex];
      return { x: g.x, z: g.z, label: '下一闸门' };
    }
    if (this.mode === 'job') {
      const j = this.activeJob;
      const t = this.jobStage === 'pickup' ? j.fromXZ : j.toXZ;
      return { x: t[0], z: t[1], label: this.jobStage === 'pickup' ? '取货 · ' + j.from : '送达 · ' + j.to };
    }
    if (this.mode === 'rally') {
      const p = RALLY.points[this.rallyIndex];
      return p ? { x: p.xz[0], z: p.xz[1], label: '打卡 · ' + p.name } : null;
    }
    return null;
  }

  // ---------------- 闸门可视化 ----------------
  // 闸门刻意不用 nightEmissive：它是玩法反馈，必须白天夜里一样亮。
  _showCircuitGates(c) {
    this._clearGates();
    this._gateGeo = new THREE.TorusGeometry(9, 0.42, 8, 26);
    for (const g of c.gates) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0e1620, emissive: 0x2ea8ff, emissiveIntensity: 2.2, roughness: 0.35,
      });
      const m = new THREE.Mesh(this._gateGeo, mat);
      m.position.set(g.x, 7, g.z);
      const next = c.gates[(g.index + 1) % c.gates.length];
      m.rotation.y = Math.atan2(next.x - g.x, next.z - g.z);
      this.gateGroup.add(m);
      this.gates.push(m);
    }
    this._highlightGates();
  }

  _clearGates() {
    for (const g of this.gates) {
      g.material?.dispose?.();
      this.gateGroup.remove(g);
    }
    this._gateGeo?.dispose?.();
    this._gateGeo = null;
    this.gates.length = 0;
  }

  _highlightGates() {
    const n = this.gates.length;
    for (let i = 0; i < n; i++) {
      const isNext = i === this.gateIndex;
      const isAfter = i === (this.gateIndex + 1) % n;
      const finishLine = i === 0;
      const m = this.gates[i];
      m.material.emissive.setHex(isNext ? 0x36ff9a : finishLine ? 0xffffff : 0x2ea8ff);
      m.material.emissiveIntensity = isNext ? 3.2 : isAfter ? 1.8 : 0.9;
      m.scale.setScalar(isNext ? 1.08 : 1);
    }
  }

  // ---------------- 每帧更新 ----------------
  update(dt) {
    this._animateMarker(dt);
    if (this.phase === 'countdown') {
      this.countdown -= dt;
      const c = Math.ceil(this.countdown);
      if (c < this._lastTick && c > 0) this.onEvent({ type: 'tick', n: c });
      this._lastTick = c;
      if (this.countdown <= 0) {
        this.phase = 'running';
        this.onEvent({ type: 'go' });
      }
      return;
    }
    if (this.phase !== 'running') return;

    this.time += dt;

    const car = this.car;
    const rate = driftRate(car.drift, car.speed);
    if (rate > 0) this.driftScore += rate * dt;
    else this.driftScore = Math.max(0, this.driftScore - 40 * dt);
    this.peakDrift = Math.max(this.peakDrift, this.driftScore);

    if (this.mode === 'circuit') this._updateCircuit();
    else if (this.mode === 'job') this._updateJob();
    else if (this.mode === 'rally') this._updateRally();
  }

  _updateCircuit() {
    const car = this.car;
    const gates = this.circuit.gates;
    const g = gates[this.gateIndex];
    const d = Math.hypot(car.pos.x - g.x, car.pos.z - g.z);
    if (d >= GATE_RADIUS) return;
    this.gateIndex++;
    if (this.gateIndex >= gates.length) {
      this.gateIndex = 0;
      this.lap++;
      const lapTime = this.time - this.lapStart;
      this.lapStart = this.time;
      this.lapTimes.push(lapTime);
      const bestLap = this.progress?.recordLap(this.circuit.id, lapTime);
      if (this.lap >= this.circuit.laps) { this._finishCircuit(); return; }
      this.onEvent({ type: 'lap', lap: this.lap, lapTime, bestLap });
    } else {
      this.onEvent({ type: 'gate' });
    }
    this._highlightGates();
  }

  _updateJob() {
    const car = this.car;
    const j = this.activeJob;
    const target = this.jobStage === 'pickup' ? j.fromXZ : j.toXZ;
    const d = Math.hypot(car.pos.x - target[0], car.pos.z - target[1]);
    if (this.jobLimit - this.time <= 0) { this._finishJob(false, '超时，订单作废'); return; }
    if (d >= POINT_RADIUS) return;
    if (this.jobStage === 'pickup') {
      this.jobStage = 'dropoff';
      this._showMarker(j.toXZ, 0xffc93d);
      this.onEvent({ type: 'stage', stage: 'dropoff', job: j });
    } else {
      this._finishJob(true);
    }
  }

  _updateRally() {
    const p = RALLY.points[this.rallyIndex];
    const d = Math.hypot(this.car.pos.x - p.xz[0], this.car.pos.z - p.xz[1]);
    if (d >= POINT_RADIUS) return;
    this.rallyIndex++;
    if (this.rallyIndex >= RALLY.points.length) { this._finishRally(); return; }
    this._showMarker(RALLY.points[this.rallyIndex].xz, 0xff5fd2);
    this.onEvent({ type: 'checkpoint', name: p.name, index: this.rallyIndex, total: RALLY.points.length });
  }

  // ---------------- 结算 ----------------
  _commonStats() {
    const st = this.progress?.data.stats;
    if (st) {
      st.bestDrift = Math.max(st.bestDrift || 0, Math.round(this.peakDrift));
      st.crashes = (st.crashes || 0) + this.crashes;
    }
  }

  _finishCircuit() {
    const c = this.circuit;
    const t = this.time;
    const distance = c.total * c.laps;
    const rec = this.progress ? this.progress.recordTime(c.id, t, distance) : { record: false };
    const order = this.circuits.indexOf(c);
    const next = this.circuits[order + 1];
    const unlocked = next && rec.prevBest == null ? next.name : null;
    const base = CIRCUIT_PAY[c.id] ?? 1000;
    const drift = Math.round(this.driftScore);
    const payout = Math.max(0, Math.round(base * (rec.record ? 1.25 : 1) + drift * 0.5 + (rec.medalBonus || 0) - this.crashes * 100));
    this._commonStats();
    this.progress?.addMoney(payout);
    this.phase = 'finished';
    this.result = {
      type: 'circuit', id: c.id, title: c.name, time: t, laps: c.laps,
      lapTimes: this.lapTimes.slice(), bestLap: this.progress?.data.bestLap[c.id] ?? null,
      record: rec.record, prevBest: rec.prevBest, medal: rec.medal, newMedal: rec.newMedal,
      medalBonus: rec.medalBonus || 0, targets: medalTargets(distance),
      drift, crashes: this.crashes, payout, unlocked,
    };
    this._clearGates();
    this.onEvent({ type: 'finish', result: this.result });
  }

  _finishJob(success, reason) {
    this.phase = 'finished';
    const j = this.activeJob;
    const left = success ? this.jobLimit - this.time : 0;
    const drift = Math.round(this.driftScore);
    let payout = 0, stars = 0, streakMul = 1, damageMul = 1;
    if (success) {
      this.jobStreak++;
      streakMul = 1 + 0.25 * Math.min(this.jobStreak - 1, 4);
      damageMul = Math.max(0.4, 1 - 0.1 * this.crashes);
      const frac = left / this.jobLimit;
      stars = frac > 0.35 ? 3 : frac > 0.15 ? 2 : 1;
      payout = Math.round((j.pay * (0.7 + 0.15 * stars) + drift * 0.5) * streakMul * damageMul);
      const jd = this.progress?.data.jobs;
      if (jd) { jd.done++; jd.bestStreak = Math.max(jd.bestStreak, this.jobStreak); }
      this.jobIndex = (this.jobIndex + 1) % this.jobs.length;
    } else {
      this.jobStreak = 0;
    }
    this._commonStats();
    if (payout) this.progress?.addMoney(payout); else this.progress?.save();
    this.result = {
      type: 'job', title: j.label, success, reason, time: this.time, left,
      drift, crashes: this.crashes, payout, stars, streak: this.jobStreak, streakMul, damageMul,
      next: success ? this.activeJob : null,
    };
    this._hideMarker();
    this.onEvent({ type: 'finish', result: this.result });
  }

  _finishRally() {
    const t = this.time;
    const distance = rallyDistance();
    const rec = this.progress ? this.progress.recordTime(RALLY.id, t, distance) : { record: false };
    const drift = Math.round(this.driftScore);
    const payout = Math.max(0, Math.round(RALLY_PAY * (rec.record ? 1.25 : 1) + drift * 0.5 + (rec.medalBonus || 0) - this.crashes * 100));
    this._commonStats();
    this.progress?.addMoney(payout);
    this.phase = 'finished';
    this.result = {
      type: 'rally', id: RALLY.id, title: RALLY.name, time: t,
      record: rec.record, prevBest: rec.prevBest, medal: rec.medal, newMedal: rec.newMedal,
      medalBonus: rec.medalBonus || 0, targets: medalTargets(distance),
      drift, crashes: this.crashes, payout,
    };
    this._hideMarker();
    this.onEvent({ type: 'finish', result: this.result });
  }

  registerCrash() {
    if (this.phase !== 'running') return;
    this.crashes++;
    this.driftScore = 0; // 撞车清零：这是漂移分的核心风险
  }

  _animateMarker() {
    const m = this.marker;
    if (!m.group.visible) return;
    const t = performance.now() * 0.001;
    m.ring.rotation.z = t * 1.1;
    m.ring.position.y = 6 + Math.sin(t * 2) * 0.4;
    this.beamMat.opacity = 0.14 + 0.08 * Math.sin(t * 3);
  }

  // ---------------- 给 HUD / 菜单用的只读快照 ----------------
  get hud() {
    const j = this.activeJob;
    let sub = '';
    if (this.mode === 'job') {
      sub = this.jobStage === 'pickup' ? `前往取货 · ${j.from}` : `送达 ${j.to}`;
      if (this.jobStreak > 0) sub += ` · 连击 ×${this.jobStreak}`;
      if (this.crashes > 0 && this.jobStage === 'dropoff') sub += ` · 货损 ${Math.min(60, this.crashes * 10)}%`;
    } else if (this.mode === 'circuit' && this.circuit) {
      sub = `第 ${Math.min(this.lap + 1, this.circuit.laps)}/${this.circuit.laps} 圈 · 闸门 ${this.gateIndex}/${this.circuit.gates.length}`;
    } else if (this.mode === 'rally') {
      sub = `打卡 ${this.rallyIndex}/${RALLY.points.length} · 下一站 ${RALLY.points[this.rallyIndex]?.name ?? ''}`;
    }
    const best = this.progress?.data.best || {};
    const medals = this.progress?.data.medals || {};
    return {
      phase: this.phase,
      mode: this.mode,
      countdown: Math.max(0, Math.ceil(this.countdown - 0.2)),
      time: this.time,
      lapTime: this.time - this.lapStart,
      left: this.mode === 'job' ? Math.max(0, this.jobLimit - this.time) : null,
      drift: Math.round(this.driftScore),
      title: this.mode === 'circuit' ? this.circuit?.name : this.mode === 'rally' ? RALLY.name : '跑腿派单',
      sub,
      job: j,
      streak: this.jobStreak,
      circuits: this.circuits.map((c, i) => ({
        id: c.id, name: c.name, laps: c.laps, difficulty: c.difficulty, blurb: c.blurb,
        best: best[c.id] ?? null, bestLap: this.progress?.data.bestLap[c.id] ?? null,
        medal: medals[c.id] || null,
        targets: medalTargets(c.total * c.laps),
        unlocked: this.progress ? this.progress.circuitUnlocked(i, this.circuits) : true,
        lockHint: i > 0 ? `完成「${this.circuits[i - 1].name}」解锁` : '',
        lengthKm: (c.total * c.laps / 1000).toFixed(1),
      })),
      rally: {
        ...RALLY, best: best[RALLY.id] ?? null, medal: medals[RALLY.id] || null,
        targets: medalTargets(rallyDistance()), lengthKm: (rallyDistance() / 1000).toFixed(1),
      },
      result: this.result,
    };
  }
}
