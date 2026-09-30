// audio.js — 引擎 / 碰撞 / 胎噪。
//
// 素材来自 lab 共享区（CC0，已登记在 assets/SOURCES.md 第 15 节）：
//   引擎循环  assets/audio/sfx/oga_racing-engine-loops/loop_*.wav
//   碰撞      assets/audio/sfx/kenney_impact-sounds/impactMetal_*.ogg
// 通过 serve.mjs 的 /assets/ 路由取（见该文件顶部说明）。
//
// 两条浏览器铁律：
//   1) AudioContext 必须等用户手势才能启动 → arm() 挂一次性监听，交互前不建 ctx。
//   2) 引擎音用 playbackRate 变调：wav 循环会同时变快变调，恰好就是引擎随转速升调的感觉，
//      不用合成音。这里刻意不做「音高不变、只变音量」的假引擎。
const ASSET = './assets/audio/sfx/';
const ENGINE_LOOPS = ['loop_0.wav', 'loop_1_0.wav', 'loop_2_0.wav', 'loop_3_0.wav', 'loop_4_0.wav', 'loop_5_0.wav'];
const IMPACTS = [
  'impactMetal_heavy_000.ogg', 'impactMetal_heavy_002.ogg', 'impactMetal_heavy_004.ogg',
  'impactMetal_medium_001.ogg', 'impactMetal_medium_003.ogg',
  'impactPlate_heavy_000.ogg', 'impactPlate_medium_002.ogg',
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.armed = false;
    this.enabled = true;
    this.master = null;
    this.engineSrc = null;
    this.engineGain = null;
    this.driftSrc = null;
    this.driftGain = null;
    this.buffers = {};
    this.started = false;
    this._pendingImpact = 0;
  }

  /** 等第一次用户手势再真正建 AudioContext */
  arm() {
    if (this.armed) return;
    this.armed = true;
    const go = () => this.init();
    window.addEventListener('pointerdown', go, { once: true });
    window.addEventListener('keydown', go, { once: true });
  }

  async init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.enabled = false; return; }
    const ctx = new AC();
    this.ctx = ctx;
    if (ctx.state === 'suspended') { try { await ctx.resume(); } catch { /* 等下一次手势 */ } }

    this.master = ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(ctx.destination);

    await this.load();
    this.started = true;
  }

  async load() {
    const ctx = this.ctx;
    const fetchBuf = async (url) => {
      try {
        const r = await fetch(url);
        if (!r.ok) return null;
        return await ctx.decodeAudioData(await r.arrayBuffer());
      } catch { return null; }
    };
    // 引擎：取第一条能解码的（素材是 OGG/WAV 混装，解码失败要能降级）
    for (const f of ENGINE_LOOPS) {
      const b = await fetchBuf(ASSET + 'oga_racing-engine-loops/' + f);
      if (b) { this.buffers.engine = b; break; }
    }
    for (const f of IMPACTS) {
      const b = await fetchBuf(ASSET + 'kenney_impact-sounds/' + f);
      if (b) { (this.buffers.impacts ||= []).push(b); break; }  // 只取第一条，避免 7 个并发请求
    }
    if (this.buffers.engine) this._startEngine();
  }

  _startEngine() {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.buffers.engine;
    src.loop = true;
    const g = ctx.createGain();
    g.gain.value = 0;
    // 轻微低通：去掉 wav 循环点的毛刺，听感更接近排气声
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    src.connect(lp).connect(g).connect(this.master);
    src.start();
    this.engineSrc = src;
    this.engineGain = g;

    // 胎噪：复用同一条循环，但走独立的高 Q 带通 + 更轻的音量，
    // 听感上和引擎分层，不至于只有一个声源在打架。
    const dsrc = ctx.createBufferSource();
    dsrc.buffer = this.buffers.engine;
    dsrc.loop = true;
    dsrc.playbackRate.value = 1.9;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1750;
    bp.Q.value = 3.2;
    const dg = ctx.createGain();
    dg.gain.value = 0;
    dsrc.connect(bp).connect(dg).connect(this.master);
    dsrc.start();
    this.driftSrc = dsrc;
    this.driftGain = dg;
  }

  /**
   * 每帧调用。
   * speedNorm: 0..1 当前速度归一（用极速归一，别用 200 硬编码）
   * throttle:  0..1
   * drift:     0..1 甩尾强度
   * running:   是否在驾驶模式
   */
  update(speedNorm, throttle, drift, running) {
    if (!this.started || !this.ctx) return;
    const t = this.ctx.currentTime;

    if (this.engineGain && this.engineSrc) {
      const target = running ? 0.06 + throttle * 0.12 + speedNorm * 0.10 : 0;
      this.engineGain.gain.setTargetAtTime(clamp(target, 0, 0.3), t, 0.08);
      // 怠速 ~0.62，红线 ~2.1
      const rate = 0.62 + speedNorm * 1.48 + throttle * 0.12;
      this.engineSrc.playbackRate.setTargetAtTime(rate, t, 0.09);
    }
    if (this.driftGain) {
      const d = running ? drift * 0.085 : 0;
      this.driftGain.gain.setTargetAtTime(d, t, 0.12);
    }
  }

  /** 碰撞：音量随撞击速度，轻蹭不出声 */
  impact(strength) {
    if (!this.started || !this.ctx || !this.buffers.impacts) return;
    const s = clamp(strength / 18, 0, 1);
    if (s < 0.12) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.buffers.impacts[(Math.random() * this.buffers.impacts.length) | 0];
    const g = ctx.createGain();
    g.gain.value = s * 0.7;
    src.connect(g).connect(this.master);
    src.start();
    src.onended = () => { try { src.disconnect(); g.disconnect(); } catch { /* 已断开 */ } };
  }

  setVolume(v) {
    if (this.master) this.master.gain.value = clamp(v, 0, 1);
  }
}
