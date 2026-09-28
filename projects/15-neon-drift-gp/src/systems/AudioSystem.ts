export class AudioSystem {
  private context: AudioContext | null = null;
  private unlocked = false;
  muted = false;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  constructor() {
    const unlock = () => {
      void this.unlock();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  async unlock(): Promise<void> {
    if (this.unlocked) return;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    this.context = new AudioContextClass();
    await this.context.resume();
    this.unlocked = true;
    this.startEngine();
  }

  private startEngine(): void {
    if (!this.context || this.engineOsc) return;
    const ctx = this.context;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.value = 60;
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    gain.gain.value = 0.0;
    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start();
    this.engineOsc = osc;
    this.engineGain = gain;
    this.engineFilter = filter;
  }

  updateEngine(speed01: number, drifting: boolean, boosting: boolean, active: boolean): void {
    if (!this.context || !this.engineOsc || !this.engineGain || !this.engineFilter) return;
    if (this.muted) {
      this.engineGain.gain.value = 0;
      return;
    }
    const now = this.context.currentTime;
    const base = 55 + speed01 * 90 + (boosting ? 30 : 0);
    this.engineOsc.frequency.setTargetAtTime(base, now, 0.05);
    this.engineFilter.frequency.setTargetAtTime(300 + speed01 * 1200, now, 0.08);
    const target = active ? 0.03 + speed01 * 0.045 : 0.0;
    this.engineGain.gain.setTargetAtTime(target, now, 0.1);
    this.engineFilter.Q.value = drifting ? 4 : 1;
  }

  lap(): void {
    this.blip(520, 780, 0.15, 'triangle');
    window.setTimeout(() => this.blip(780, 1040, 0.18, 'triangle'), 120);
  }

  boost(): void {
    this.blip(200, 900, 0.2, 'sawtooth');
  }

  impact(): void {
    this.blip(120, 60, 0.12, 'square');
  }

  private blip(from: number, to: number, duration: number, type: OscillatorType): void {
    if (!this.context || this.muted || this.context.state !== 'running') return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, to), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.05);
  }

  pickup(index: number): void {
    this.blip(320 + index * 20, 700 + index * 20, 0.14, 'triangle');
  }

  dispose(): void {
    try {
      this.engineOsc?.stop();
    } catch {
      /* already stopped */
    }
    this.engineOsc = null;
    this.engineGain = null;
    this.engineFilter = null;
    void this.context?.close();
    this.context = null;
  }
}
