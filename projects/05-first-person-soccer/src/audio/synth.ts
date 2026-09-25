/**
 * WebAudio 程序化音效 —— 零外部资产，全部现场合成。
 *
 * 无头验证的边界（必须诚实标注）：自动验证只能证明「AudioContext 建起来了、
 * 事件计数在涨、没抛异常」，证明不了「好不好听」——听感只能人工验收。
 */
import { CONFIG } from '../core/config';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;

  playCount = 0;
  lastKind = '';

  state(): string {
    return this.ctx?.state ?? 'none';
  }

  init(): boolean {
    if (this.ctx) {
      void this.ctx.resume();
      return true;
    }
    try {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return false;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = CONFIG.audio.master;
      this.master.connect(this.ctx.destination);

      const len = Math.floor(this.ctx.sampleRate);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
      return true;
    } catch {
      return false;
    }
  }

  private ok(): boolean {
    return this.ctx !== null && this.master !== null;
  }

  private env(t: number, attack: number, decay: number, peak: number): GainNode {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }

  private blip(
    kind: string,
    type: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    peak: number,
    delay = 0,
  ): void {
    if (!this.ok()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    const g = this.env(t, 0.004, dur, peak);
    osc.connect(g);
    g.connect(this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.05);
    this.playCount += 1;
    this.lastKind = kind;
  }

  private noise(kind: string, lp: number, hp: number, dur: number, peak: number, delay = 0): void {
    if (!this.ok() || !this.noiseBuf) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const lo = ctx.createBiquadFilter();
    lo.type = 'lowpass';
    lo.frequency.value = lp;
    const hi = ctx.createBiquadFilter();
    hi.type = 'highpass';
    hi.frequency.value = hp;
    const g = this.env(t, 0.002, dur, peak);
    src.connect(hi);
    hi.connect(lo);
    lo.connect(g);
    g.connect(this.master!);
    src.start(t);
    src.stop(t + dur + 0.05);
    this.playCount += 1;
    this.lastKind = kind;
  }

  /** 踢球：低频闷响 + 皮球冲击噪声，力量越大越响 */
  kick(power: number): void {
    const k = Math.min(1, power / CONFIG.kick.maxPower);
    this.noise('kick', 1800, 120, 0.09 + k * 0.06, 0.3 + k * 0.35);
    this.blip('kick', 'sine', 150 + k * 40, 60, 0.12 + k * 0.06, 0.3 + k * 0.3);
  }

  /** 弹跳：短促点击，速度越快越响 */
  bounce(speed: number): void {
    const k = Math.min(1, speed / 20);
    this.noise('bounce', 2600, 400, 0.05, 0.12 + k * 0.16);
  }

  /** 进球：上行号角 */
  goal(): void {
    [523, 659, 784, 1046, 1318].forEach((f, i) => {
      this.blip('goal', 'triangle', f, f, 0.34, 0.28, i * 0.11);
    });
  }

  /** 哨声：高频振荡 */
  whistle(): void {
    this.blip('whistle', 'square', 2100, 2200, 0.28, 0.14);
    this.blip('whistle', 'square', 2600, 2500, 0.26, 0.1, 0.05);
  }

  /** 扑救：闷响 */
  save(): void {
    this.noise('save', 1400, 160, 0.12, 0.32);
    this.blip('save', 'sine', 120, 70, 0.14, 0.28);
  }

  footstep(): void {
    this.noise('step', 520, 90, 0.05, 0.09);
  }

  win(): void {
    [523, 659, 784, 1046].forEach((f, i) => this.blip('win', 'triangle', f, f, 0.28, 0.24, i * 0.13));
  }

  lose(): void {
    [392, 330, 262, 196].forEach((f, i) => this.blip('lose', 'sawtooth', f, f * 0.94, 0.3, 0.22, i * 0.16));
  }
}
