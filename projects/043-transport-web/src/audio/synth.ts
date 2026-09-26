/**
 * WebAudio 程序化音效 —— 零外部资产，全部现场合成。
 *
 * 枪声合成思路移植自 04_1 frontline-cq 的 AudioSystem：
 *   1. 「爆裂噪声 + 低频三角波冲击」双成分枪声；
 *   2. **pitch 抖动**：每发 ±6% 随机音高偏移，避免连发听起来像电动缝纫机；
 *   3. 远处枪声走 lowpass 闷响分层（enemyShot），与玩家枪声在听感上区分空间。
 * 音色按 043 运输船的 5 把枪分层（AK 闷 / M4 脆 / AWM 重 / MP5 薄 / 沙鹰 punch）。
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

      // 预生成 1.2 秒白噪声，所有枪声/脚步都从它切片（04_1 同款 buffer 复用，零分配）
      const len = Math.floor(this.ctx.sampleRate * 1.2);
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

  /**
   * 开火：按 04_1 的「噪声爆裂 + 低频冲击 + pitch 抖动」配方，5 把枪各有音色。
   * jitter：音高 ±6% 随机偏移（04_1 的种子 RNG 抖动在音频层退化为 Math.random
   * —— 音频层不在确定性 sim 内，不影响 bot 基线）。
   */
  shot(weapon: WeaponId): void {
    const j = 1 + (Math.random() - 0.5) * 0.12;
    switch (weapon) {
      case 'ak47':
        // 闷而狠：低通扫掉的爆裂 + 150→46Hz 三角波冲击（04_1 gunshot 配方，音色拉低）
        this.noise('shot', 2400 * j, 420, 0.13, 0.5);
        this.blip('shot', 'triangle', 150 * j, 46, 0.14, 0.42);
        break;
      case 'm4a1':
        // 脆而密：更高频的爆裂 + 短冲击，与 AK 形成「闷 vs 脆」对比
        this.noise('shot', 3600 * j, 700, 0.095, 0.42);
        this.blip('shot', 'sine', 175 * j, 70, 0.1, 0.36);
        break;
      case 'awm':
        // 重炮：长尾低频 + 深噪声，一发顶三发
        this.noise('shot', 2000 * j, 130, 0.3, 0.6);
        this.blip('shot', 'sine', 95 * j, 38, 0.4, 0.52);
        break;
      case 'mp5':
        // 射速最高（0.068s/发）→ 音色最短最薄，否则连发糊成一团
        this.noise('shot', 5200 * j, 950, 0.055, 0.26);
        this.blip('shot', 'square', 235 * j, 135, 0.055, 0.2);
        break;
      case 'deagle':
        // 手炮：punch 感——短促大动态 + 明显低频
        this.noise('shot', 3800 * j, 480, 0.14, 0.52);
        this.blip('shot', 'sine', 145 * j, 58, 0.16, 0.44);
        break;
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

  /**
   * 换弹：三段机械声（04_1 的两段 click + 收尾上膛）。
   * 卸匣（620Hz 短噪）→ 插匣（430Hz）→ 上膛（高频双击）。
   */
  reload(): void {
    this.noise('reload', 3400, 1500, 0.05, 0.28);
    this.noise('reload', 2700, 1150, 0.06, 0.26, 0.12);
    this.noise('reload', 4200, 1900, 0.045, 0.3, 0.26);
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

  /**
   * 敌人开火：04_1 的远/近分层——
   * 近距听得见中频「crack」，远距只剩 lowpass 闷响（420Hz，与 04_1 distantShot 一致）。
   */
  enemyShot(distance: number): void {
    const near = Math.max(0, 1 - distance / 30);
    const far = Math.max(0, 1 - distance / 60);
    if (near > 0.02) this.noise('enemyShot', 2800, 420, 0.1, 0.2 * near * near);
    if (far > 0.02) this.noise('enemyShot', 420, 60, 0.22, 0.16 * far);
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

  /** 手雷出手：布料摩擦 + 挥臂风声（短促带通噪声扫频） */
  grenadeThrow(): void {
    this.noise('throw', 1200, 300, 0.09, 0.18);
    this.noise('throw', 700, 140, 0.13, 0.12, 0.04);
  }

  /** 手雷爆炸：低频冲击（随距离衰减）+ 双层噪声爆裂 + 金属残响 */
  explode(distance: number): void {
    const d = Math.max(0, distance);
    // 30m 内线性衰减，30m 外远处闷响保底
    const near = Math.max(0.08, 1 - d / 30);
    const j = 1 + (Math.random() - 0.5) * 0.12;
    // 低频冲击：正弦 70→28Hz，是「胸口挨了一锤」的来源
    this.blip('explode', 'sine', 70 * j, 28, 0.5, 0.55 * near);
    // 爆裂主体：宽带噪声，低通从 3000 塌到 200（能量向后收）
    this.noise('explode', 3000 * j, 180, 0.35, 0.6 * near);
    // 高频碎片飞溅
    this.noise('explode', 5200, 1600, 0.14, 0.3 * near, 0.02);
    // 余响：中频隆隆
    this.noise('explode', 320, 60, 0.7, 0.22 * near, 0.1);
  }
}
