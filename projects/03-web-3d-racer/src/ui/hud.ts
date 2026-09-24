/**
 * HUD：纯 DOM 叠层，显示圈数、名次、计时、最佳圈、速度，以及倒计时 / GO / 完赛提示。
 * 不依赖 three，独立可测。
 */
export class Hud {
  private lapEl: HTMLElement;
  private posEl: HTMLElement;
  private timeEl: HTMLElement;
  private bestEl: HTMLElement;
  private speedEl: HTMLElement;
  private msgEl: HTMLElement;
  private driftEl: HTMLElement;
  private lastLapEl: HTMLElement;

  constructor(parent: HTMLElement) {
    const root = document.createElement('div');
    root.className = 'hud';
    root.innerHTML = `
      <div class="hud-tl">
        <div class="lap" id="hud-lap">LAP 1/3</div>
        <div class="pos" id="hud-pos">P1/2</div>
        <div class="time" id="hud-time">0.00</div>
        <div class="best" id="hud-best">BEST --.--</div>
      </div>
      <div class="hud-br">
        <div class="speed" id="hud-speed">0</div>
        <div class="unit">km/h</div>
      </div>
      <div class="hud-drift" id="hud-drift"></div>
      <div class="hud-lastlap" id="hud-lastlap"></div>
      <div class="hud-msg" id="hud-msg"></div>`;
    parent.appendChild(root);
    this.lapEl = root.querySelector('#hud-lap')!;
    this.posEl = root.querySelector('#hud-pos')!;
    this.timeEl = root.querySelector('#hud-time')!;
    this.bestEl = root.querySelector('#hud-best')!;
    this.speedEl = root.querySelector('#hud-speed')!;
    this.msgEl = root.querySelector('#hud-msg')!;
    this.driftEl = root.querySelector('#hud-drift')!;
    this.lastLapEl = root.querySelector('#hud-lastlap')!;
  }

  setSpeed(kmh: number): void { this.speedEl.textContent = Math.round(kmh).toString(); }
  setLap(cur: number, total: number): void { this.lapEl.textContent = `LAP ${cur}/${total}`; }
  setPosition(p: number, total: number): void { this.posEl.textContent = `P${p}/${total}`; }
  setTime(s: number): void { this.timeEl.textContent = s.toFixed(2); }
  setBest(s: number | null): void {
    this.bestEl.textContent = s == null ? 'BEST --.--' : `BEST ${s.toFixed(2)}`;
  }
  setDrift(on: boolean): void {
    this.driftEl.style.display = on ? 'block' : 'none';
  }
  setLastLap(s: number | null): void {
    this.lastLapEl.textContent = s == null ? '' : `LAST ${s.toFixed(2)}s`;
  }
  setMessage(text: string | null, color = '#fff'): void {
    if (!text) { this.msgEl.style.display = 'none'; return; }
    this.msgEl.style.display = 'block';
    this.msgEl.style.color = color;
    this.msgEl.textContent = text;
  }
}
