/**
 * WebAudio 程序化音效 —— 零外部资产，全部现场合成。
 *
 * 这是 04 的 DoD 硬指标：lab 前三个项目（01/02/03）都没有音效，是距参考标尺最大的共性差距。
 *
 * 无头验证的边界（必须诚实标注）：
 *   自动验证只能证明「AudioContext 建起来了、事件计数在涨、没抛异常」，
 *   证明不了「好不好听」。听感只能人工验收。
 */
import { CONFIG } from '../core/config';
import type { WeaponId } from '../core/config';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;

  /** 已触发的音效次数 —— CDP 验证靠这个断言「音效真的响了」 */
  playCount = 0;
  /** 最近一次音效类型 */
  lastKind = '';
  /** AudioContext 状态，验证接口直接读 */
  state(): string {
    return this.ctx?.state ?? 'none';
  }

  /** 必须在用户手势里调用（浏览器自动播放策略） */
  init(): boolean {
    if (this.ctx) {
      void this.ctx.resume();
      return true;
    }
    try {
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return false;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = CONFIG.audio.master;
      this.master.connect(this.ctx.destination);

      // 预生成 1 秒白噪声，所有枪声/脚步都从它切片
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

  /** 包络：瞬时起音 + 指数衰减 */
  private env(t: number, attack: number, decay: number, peak: number): GainNode {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }

  /** 音调型音效（可用频率滑音） */
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

  /** 噪声型音效（带通/高低通塑形） */
  private noise(
    kind: string,
    lp: number,
    hp: number,
    dur: number,
    peak: number,
    delay = 0,
  ): void {
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

  // ---------------- 具体音效 ----------------

  /** 开火：三把枪各有音色（手枪脆、步枪密、霰弹闷长） */
  shot(weapon: WeaponId): void {
    if (weapon === 'shotgun') {
      this.noise('shot', 1500, 90, 0.3, 0.55);
      this.blip('shot', 'sine', 110, 48, 0.26, 0.42);
    } else if (weapon === 'pistol') {
      this.noise('shot', 5200, 600, 0.1, 0.4);
      this.blip('shot', 'sine', 180, 90, 0.11, 0.34);
    } else {
      this.noise('shot', 4200, 380, 0.085, 0.34);
      this.blip('shot', 'sine', 150, 85, 0.09, 0.3);
    }
  }

  /** 命中：普通命中短促高频，爆头更高更亮（双击感） */
  hit(headshot: boolean): void {
    if (headshot) {
      this.blip('hit', 'square', 1750, 1300, 0.07, 0.3);
      this.blip('hit', 'square', 2300, 1900, 0.05, 0.22, 0.045);
    } else {
      this.blip('hit', 'square', 1150, 900, 0.055, 0.22);
    }
  }

  /** 击杀：下滑音，明确的「解决了」反馈 */
  kill(): void {
    this.blip('kill', 'sawtooth', 420, 70, 0.26, 0.3);
    this.noise('kill', 900, 200, 0.16, 0.22);
  }

  /** 换弹：卸弹匣 + 上膛两声机械 click */
  reload(): void {
    this.noise('reload', 3200, 1400, 0.05, 0.28);
    this.noise('reload', 2600, 1100, 0.06, 0.3, 0.28);
  }

  /** 空仓：干涩的咔哒 */
  empty(): void {
    this.noise('empty', 4000, 2200, 0.035, 0.26);
  }

  /** 玩家受击：低频闷响 + 噪声冲击 */
  playerHurt(): void {
    this.blip('hurt', 'sine', 130, 60, 0.24, 0.45);
    this.noise('hurt', 700, 80, 0.19, 0.3);
  }

  /** 敌人开火：按距离衰减的远处闷响 */
  enemyShot(distance: number): void {
    const v = Math.max(0, 1 - distance / 45);
    this.noise('enemyShot', 2600, 300, 0.11, 0.2 * v * v);
  }

  /** 波次开始：上行提示音 */
  waveStart(wave: number): void {
    const base = 300 + wave * 40;
    this.blip('wave', 'triangle', base, base * 1.5, 0.34, 0.26);
    this.blip('wave', 'triangle', base * 1.5, base * 2, 0.3, 0.2, 0.16);
  }

  /** 胜利：上行三音 */
  win(): void {
    [523, 659, 784, 1046].forEach((f, i) => {
      this.blip('win', 'triangle', f, f, 0.28, 0.24, i * 0.13);
    });
  }

  /** 失败：下行 */
  lose(): void {
    [392, 330, 262, 196].forEach((f, i) => {
      this.blip('lose', 'sawtooth', f, f * 0.94, 0.3, 0.22, i * 0.16);
    });
  }

  footstep(): void {
    this.noise('step', 520, 90, 0.055, 0.1);
  }

  /** 切枪 */
  swap(): void {
    this.noise('swap', 2200, 900, 0.045, 0.2);
  }
}
