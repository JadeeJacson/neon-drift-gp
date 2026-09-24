/**
 * 程序化音频：WebAudio 合成，零外部音频文件。
 * - 引擎声：双锯齿波叠加，基频随速度线性变化，油门时升调。
 * - 轮胎尖叫：手刹 + 高速时触发带通噪声。
 * - 碰撞闷响：车速突变时触发低通噪声。
 */
export class GameAudio {
  private ctx: AudioContext | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private tireNoise: AudioBufferSourceNode | null = null;
  private tireGain: GainNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;
  private master: GainNode | null = null;
  private started = false;

  /** 必须在用户手势后调用（浏览器自动播放策略） */
  start(): void {
    if (this.started) return;
    this.started = true;
    const ctx = new AudioContext();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(ctx.destination);

    // —— 引擎声 ——
    this.engineOsc1 = ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc2 = ctx.createOscillator();
    this.engineOsc2.type = 'square';
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0.0;
    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 400;
    this.engineOsc1.connect(engineFilter);
    this.engineOsc2.connect(engineFilter);
    engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.master);
    this.engineOsc1.start();
    this.engineOsc2.start();

    // —— 轮胎噪声（白噪声缓冲）——
    const bufferSize = ctx.sampleRate * 1;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    this.tireNoise = ctx.createBufferSource();
    this.tireNoise.buffer = noiseBuffer;
    this.tireNoise.loop = true;
    this.tireFilter = ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.value = 1200;
    this.tireFilter.Q.value = 2;
    this.tireGain = ctx.createGain();
    this.tireGain.gain.value = 0;
    this.tireNoise.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.master);
    this.tireNoise.start();
  }

  /** 每帧更新：speedKmh 0-250, throttle 0-1, handbrake bool */
  update(speedKmh: number, throttle: number, handbrake: boolean): void {
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineGain || !this.tireGain) return;
    const t = this.ctx.currentTime;

    // 引擎基频：怠速 60Hz → 极速 220Hz，油门推高
    const rpm = 60 + speedKmh * 0.7 + throttle * 40;
    this.engineOsc1.frequency.setTargetAtTime(rpm, t, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(rpm * 1.5, t, 0.05);
    // 引擎音量：怠速低，踩油门高
    const engVol = 0.08 + throttle * 0.12 + Math.min(0.05, speedKmh * 0.0005);
    this.engineGain.gain.setTargetAtTime(engVol, t, 0.1);

    // 轮胎尖叫：手刹 + 速度 > 40km/h
    const skidding = handbrake && speedKmh > 40;
    this.tireGain.gain.setTargetAtTime(skidding ? 0.15 : 0, t, 0.05);
    if (skidding) {
      this.tireFilter!.frequency.setTargetAtTime(800 + speedKmh * 5, t, 0.1);
    }
  }

  /** 碰撞闷响（调用时传入碰撞强度 0-1） */
  thump(strength: number): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
    gain.gain.setValueAtTime(Math.min(0.4, strength * 0.4), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  dispose(): void {
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
    this.started = false;
  }
}
