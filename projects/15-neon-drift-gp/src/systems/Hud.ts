export type HudSnapshot = {
  speedKph: number;
  boost: number;
  drifting: boolean;
  lap: number;
  totalLaps: number;
  position: number;
  fieldSize: number;
  raceTime: number;
  currentLapTime: number;
  bestLap: number;
  lastLap: number;
  countdown: number;
  message: string;
  phase: 'countdown' | 'racing' | 'finished';
  standings: { name: string; isPlayer: boolean; lap: number; paint: string }[];
};

export class Hud {
  private readonly speedEl = this.get('#hud-speed');
  private readonly boostFill = this.get('#hud-boost-fill');
  private readonly lapEl = this.get('#hud-lap');
  private readonly posEl = this.get('#hud-pos');
  private readonly timeEl = this.get('#hud-time');
  private readonly lapTimeEl = this.get('#hud-lap-time');
  private readonly bestEl = this.get('#hud-best');
  private readonly messageEl = this.get('#hud-message');
  private readonly countdownEl = this.get('#hud-countdown');
  private readonly standingsEl = this.get('#hud-standings');
  private readonly driftEl = this.get('#hud-drift');
  private readonly finishEl = this.get('#hud-finish');
  private readonly finishTitle = this.get('#hud-finish-title');
  private readonly finishDetail = this.get('#hud-finish-detail');
  private lastMessage = '';

  flashCountdown(): void {
    this.lastMessage = '';
  }

  update(s: HudSnapshot): void {
    this.speedEl.textContent = String(Math.round(s.speedKph)).padStart(3, '0');
    this.boostFill.style.width = `${Math.round(s.boost * 100)}%`;
    this.boostFill.classList.toggle('hot', s.boost > 0.85);
    this.lapEl.textContent = `${s.lap}/${s.totalLaps}`;
    this.posEl.textContent = `${s.position}/${s.fieldSize}`;
    this.timeEl.textContent = formatTime(s.raceTime);
    this.lapTimeEl.textContent = formatTime(s.currentLapTime);
    this.bestEl.textContent = s.bestLap > 0 ? formatTime(s.bestLap) : '--:--.--';
    this.driftEl.classList.toggle('on', s.drifting);

    if (s.phase === 'countdown') {
      this.countdownEl.hidden = false;
      this.countdownEl.textContent = s.countdown > 0 ? String(s.countdown) : 'GO';
      this.countdownEl.classList.toggle('go', s.countdown <= 0);
    } else {
      this.countdownEl.hidden = true;
    }

    if (s.message && s.message !== this.lastMessage) {
      this.messageEl.textContent = s.message;
      this.messageEl.classList.remove('show');
      // reflow
      void this.messageEl.offsetWidth;
      this.messageEl.classList.add('show');
      this.lastMessage = s.message;
      window.setTimeout(() => this.messageEl.classList.remove('show'), 1600);
    } else if (!s.message) {
      this.lastMessage = '';
    }

    this.standingsEl.innerHTML = s.standings
      .map(
        (row, i) =>
          `<li class="${row.isPlayer ? 'you' : ''}"><span class="p">${i + 1}</span><span class="c" style="background:${row.paint}"></span><span class="n">${escapeHtml(row.name)}</span><span class="l">L${Math.min(row.lap + 1, s.totalLaps)}</span></li>`,
      )
      .join('');

    if (s.phase === 'finished') {
      this.finishEl.hidden = false;
      this.finishTitle.textContent = s.position === 1 ? 'FIRST!' : `${ordinal(s.position)} PLACE`;
      this.finishDetail.textContent = `Best ${formatTime(s.bestLap)} · Race ${formatTime(s.raceTime)} · R to rematch`;
    } else {
      this.finishEl.hidden = true;
    }
  }

  private get(selector: string): HTMLElement {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) throw new Error(`Missing HUD element: ${selector}`);
    return el;
  }
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--.--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

function ordinal(n: number): string {
  const map: Record<number, string> = { 1: '1ST', 2: '2ND', 3: '3RD', 4: '4TH' };
  return map[n] ?? `${n}TH`;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
