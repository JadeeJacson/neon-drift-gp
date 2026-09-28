/* 音频层：WebAudio 程序化合成 —— 枪声 / 泵动 / 换弹 / 亡灵嘶吼 / 近战 / 环境风声
 * 全部用噪声脉冲 + 滤波器现场合成，不加载任何音频文件（单文件构建的前提）。 */

export const Snd = { ctx: null, master: null, ready: false };

Snd.init = function () {
  if (Snd.ctx) { if (Snd.ctx.state === 'suspended') Snd.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  Snd.ctx = new AC();
  Snd.master = Snd.ctx.createGain();
  Snd.master.gain.value = 0.62;
  Snd.master.connect(Snd.ctx.destination);
  Snd.ready = true;
  startAmbience();
};

Snd.setVolume = function (v) { if (Snd.master) Snd.master.gain.value = Math.max(0, Math.min(1, v)); };

/* ---------- 基础件 ---------- */

// 程序化噪声缓冲（2 秒白噪声，循环复用）
let _noiseBuf = null;
function noiseBuf() {
  if (_noiseBuf) return _noiseBuf;
  const ctx = Snd.ctx, len = ctx.sampleRate * 2;
  _noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = _noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return _noiseBuf;
}

// 一段噪声经过滤波器播出：{t0 起始, dur, type 滤波, f0→f1 频率扫动, g0 音量, q}
function noiseShot(o) {
  const ctx = Snd.ctx, t = o.t0 || ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(); src.loop = true;
  src.playbackRate.value = o.rate || 1;
  const f = ctx.createBiquadFilter();
  f.type = o.type || 'lowpass'; f.frequency.setValueAtTime(o.f0, t);
  if (o.f1) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + o.dur);
  f.Q.value = o.q || 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(o.g0 == null ? 0.9 : o.g0, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + o.dur);
  src.connect(f); f.connect(g); g.connect(Snd.master);
  src.start(t); src.stop(t + o.dur + 0.05);
}

// 单个音源：正弦/方波/锯齿滑音
function beep(type, f0, f1, dur, vol, t0) {
  const ctx = Snd.ctx, t = t0 || ctx.currentTime;
  const o = ctx.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(Snd.master);
  o.start(t); o.stop(t + dur + 0.02);
}

/* ---------- 对外音效 ---------- */

// 枪声：rifle 连发、pistol 短促、shotgun 厚重低频
Snd.shot = function (kind) {
  if (!Snd.ready) return;
  const t = Snd.ctx.currentTime;
  if (kind === 'shotgun') {
    noiseShot({ t0: t, dur: 0.32, type: 'lowpass', f0: 1600, f1: 90, g0: 1.0 });
    beep('triangle', 120, 38, 0.22, 0.55, t);           // 低频炮口冲击
  } else if (kind === 'pistol') {
    noiseShot({ t0: t, dur: 0.14, type: 'highpass', f0: 900, g0: 0.6 });
    noiseShot({ t0: t, dur: 0.1, type: 'lowpass', f0: 2600, f1: 500, g0: 0.8 });
    beep('square', 190, 60, 0.07, 0.3, t);
  } else { // rifle / smg
    noiseShot({ t0: t, dur: 0.11, type: 'highpass', f0: 1100, g0: 0.5 });
    noiseShot({ t0: t, dur: 0.09, type: 'lowpass', f0: 3200, f1: 700, g0: 0.9 });
    beep('square', 230, 70, 0.05, 0.24, t);
  }
};

// 机械声：上膛 / 换弹各阶段（stage: pickup maglock magin charge）
Snd.mech = function (stage) {
  if (!Snd.ready) return;
  const t = Snd.ctx.currentTime;
  const map = {
    pickup:  { f: 2200, d: 0.05, g: 0.25 },
    magout:  { f: 1500, d: 0.06, g: 0.3 },
    magin:   { f: 900,  d: 0.08, g: 0.4 },
    charge:  { f: 2600, d: 0.05, g: 0.35 },
    pump:    { f: 1800, d: 0.07, g: 0.45 },
    dry:     { f: 3000, d: 0.03, g: 0.2 }
  };
  const m = map[stage] || map.charge;
  noiseShot({ t0: t, dur: m.d, type: 'bandpass', f0: m.f, g0: m.g, q: 2 });
};

// 近战军刀：挥击 + 命中肉体
Snd.melee = function (hit) {
  if (!Snd.ready) return;
  const t = Snd.ctx.currentTime;
  noiseShot({ t0: t, dur: 0.12, type: 'bandpass', f0: hit ? 400 : 2400, g0: 0.4, q: 1.5 });
  if (hit) { beep('sawtooth', 140, 45, 0.14, 0.4, t); noiseShot({ t0: t, dur: 0.1, type: 'lowpass', f0: 700, g0: 0.5 }); }
};

// 亡灵嘶吼：基频随机 + 颤抖振幅（近距离威胁的听觉标志）
Snd.groan = function (dist) {
  if (!Snd.ready) return;
  const ctx = Snd.ctx, t = ctx.currentTime;
  const vol = Math.max(0.05, 0.6 - dist * 0.012);
  const o = ctx.createOscillator(); o.type = 'sawtooth';
  const f0 = 62 + Math.random() * 70;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.linearRampToValueAtTime(f0 * (0.6 + Math.random() * 1.1), t + 0.7);
  // 颤抖：低频振荡调制音量
  const lfo = ctx.createOscillator(); lfo.frequency.value = 7 + Math.random() * 6;
  const lfoG = ctx.createGain(); lfoG.gain.value = vol * 0.4;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480;
  lfo.connect(lfoG); lfoG.connect(g.gain);
  o.connect(lp); lp.connect(g); g.connect(Snd.master);
  o.start(t); lfo.start(t); o.stop(t + 0.9); lfo.stop(t + 0.9);
};

// 中弹痛哼 / 死亡倒地
Snd.pain = function () { if (Snd.ready) { const t = Snd.ctx.currentTime; beep('triangle', 300, 180, 0.12, 0.3, t); noiseShot({ t0: t, dur: 0.1, type: 'lowpass', f0: 900, g0: 0.25 }); } };
Snd.dead = function () { if (Snd.ready) { const t = Snd.ctx.currentTime; beep('sawtooth', 160, 40, 0.8, 0.4, t); noiseShot({ t0: t, dur: 0.6, type: 'lowpass', f0: 500, f1: 80, g0: 0.5 }); } };

// 脚步：短促低频摩擦（冲刺更重）
Snd.foot = function (sprint) { if (Snd.ready) noiseShot({ dur: 0.05, type: 'lowpass', f0: sprint ? 480 : 340, g0: sprint ? 0.16 : 0.1 }); };

// 远处哨声/亡灵群吼（氛围事件，由 game 定时触发）
Snd.whistle = function () { if (Snd.ready) { const t = Snd.ctx.currentTime; const f = 1500 + Math.random() * 700; beep('sine', f, f * 1.25, 0.5, 0.06, t); beep('sine', f * 1.25, f, 0.5, 0.05, t + 0.5); } };

// 爆头 / 击杀反馈叮
Snd.ching = function (head) { if (Snd.ready) beep('sine', head ? 1500 : 950, head ? 1900 : 1000, 0.14, 0.22); };

// 回合起始低音刺入（COD 式 overture）
Snd.roundStart = function () {
  if (!Snd.ready) return;
  const t = Snd.ctx.currentTime;
  beep('sawtooth', 42, 40, 1.4, 0.5, t);
  beep('sine', 84, 80, 1.2, 0.3, t + 0.05);
  noiseShot({ t0: t, dur: 1.0, type: 'lowpass', f0: 300, f1: 60, g0: 0.35 });
};

// 购买成功
Snd.buy = function () { if (Snd.ready) { const t = Snd.ctx.currentTime; beep('square', 660, 660, 0.08, 0.2, t); beep('square', 990, 990, 0.1, 0.2, t + 0.09); } };
Snd.deny = function () { if (Snd.ready) beep('square', 220, 160, 0.16, 0.2); };

/* ---------- 环境风声：循环滤波噪声 + 缓慢音量起伏 ---------- */
function startAmbience() {
  const ctx = Snd.ctx;
  const src = ctx.createBufferSource(); src.buffer = noiseBuf(); src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = 0.4;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 210; bp.Q.value = 0.6;
  const g = ctx.createGain(); g.gain.value = 0.05;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
  const lfoG = ctx.createGain(); lfoG.gain.value = 0.03;
  lfo.connect(lfoG); lfoG.connect(g.gain);
  src.connect(lp); lp.connect(bp); bp.connect(g); g.connect(Snd.master);
  src.start(); lfo.start();
}
