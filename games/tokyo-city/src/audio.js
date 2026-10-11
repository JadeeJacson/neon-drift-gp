// audio.js — 引擎 / 碰撞 / 胎噪。
//
// 素材来源与授权见 CREDITS.md：
//   引擎循环  assets/audio/sfx/oga_racing-engine-loops/loop_*.wav
//   碰撞      assets/audio/sfx/kenney_impact-sounds/impactMetal_*.ogg
// 界面音效（倒计时、闸门、金币、喇叭、完赛）用振荡器现场合成，不额外占下载体积。
//
// 两条浏览器铁律：
//   1) AudioContext 必须等用户手势才能启动 → arm() 挂一次性监听，交互前不建 ctx。
//   2) 引擎音用 playbackRate 变调：wav 循环会同时变快变调，恰好就是引擎随转速升调的感觉，
//      不用合成音。这里刻意不做「音高不变、只变音量」的假引擎。
const ASSET = './assets/audio/sfx/';
// 只用得到第一条能解码的循环；其余 5 条原本也会被打包下载，已从仓库移除
const ENGINE_LOOPS = ['loop_0.wav'];
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
    this.volume = 0.7;
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
    this.master.gain.value = this.volume * 0.75;
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
    this.volume = clamp(v, 0, 1);
    if (this.master) this.master.gain.value = this.volume * 0.75;
  }

  /** 暂停 / 切后台：直接挂起整个 AudioContext */
  setPaused(on) {
    if (!this.ctx) return;
    if (on && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
    if (!on && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  // ---- 合成界面音效 ----
  _tone(freq, dur, { type = 'sine', vol = 0.2, at = 0, slide = 0 } = {}) {
    if (!this.ctx || !this.master || this.ctx.state !== 'running') return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime + at;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
    o.onended = () => { try { o.disconnect(); g.disconnect(); } catch { /* 已断开 */ } };
  }

  sfx(name) {
    switch (name) {
      case 'tick': this._tone(660, 0.16, { type: 'square', vol: 0.09 }); break;
      case 'go': this._tone(990, 0.42, { type: 'square', vol: 0.11 }); break;
      case 'gate': this._tone(1320, 0.12, { vol: 0.12 }); this._tone(1760, 0.14, { vol: 0.09, at: 0.06 }); break;
      case 'lap': [784, 988, 1175].forEach((f, i) => this._tone(f, 0.18, { type: 'triangle', vol: 0.13, at: i * 0.08 })); break;
      case 'checkpoint': [880, 1320].forEach((f, i) => this._tone(f, 0.2, { type: 'triangle', vol: 0.13, at: i * 0.09 })); break;
      case 'coin': this._tone(1568, 0.08, { type: 'square', vol: 0.06 }); this._tone(2093, 0.22, { type: 'square', vol: 0.06, at: 0.07 }); break;
      case 'honk': this._tone(392, 0.32, { type: 'sawtooth', vol: 0.07 }); this._tone(466, 0.32, { type: 'sawtooth', vol: 0.05 }); break;
      case 'fail': this._tone(330, 0.5, { type: 'sawtooth', vol: 0.08, slide: 0.5 }); break;
      case 'finish': [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.32, { type: 'triangle', vol: 0.14, at: i * 0.11 })); break;
      case 'click': this._tone(1200, 0.04, { type: 'square', vol: 0.035 }); break;
      default: break;
    }
  }
}
