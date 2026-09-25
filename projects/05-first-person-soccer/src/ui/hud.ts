/**
 * HUD —— 比分板 / 计时 / 蓄力条 / 触球提示 / 中央播报。
 * 只读 GameSnapshot，不持有逻辑状态。
 */
import type { GameSnapshot } from '../sim/types';
import type { Team } from '../core/config';

export class Hud {
  private readonly root: HTMLElement;
  private readonly score: HTMLDivElement;
  private readonly timer: HTMLDivElement;
  private readonly hint: HTMLDivElement;
  private readonly chargeWrap: HTMLDivElement;
  private readonly chargeFill: HTMLDivElement;
  private readonly bannerEl: HTMLDivElement;

  constructor(root: HTMLElement) {
    this.root = root;
    root.innerHTML = `
      <div id="bb-score" style="position:absolute;top:18px;left:50%;transform:translateX(-50%);
        display:flex;align-items:center;gap:14px;font-weight:800;font-size:30px;letter-spacing:2px;
        text-shadow:0 2px 10px rgba(0,0,0,0.6);">
        <span id="bb-blue" style="color:#5aa2ff">0</span>
        <span style="color:#8a94a4;font-size:18px">:</span>
        <span id="bb-red" style="color:#ff6a5d">0</span>
      </div>
      <div id="bb-timer" style="position:absolute;top:56px;left:50%;transform:translateX(-50%);
        font-size:13px;color:#cfd8e3;letter-spacing:1px;text-shadow:0 1px 6px rgba(0,0,0,0.7)">0:00</div>
      <div id="bb-hint" style="position:absolute;bottom:120px;left:50%;transform:translateX(-50%);
        font-size:14px;font-weight:700;color:#ffe14d;letter-spacing:1px;opacity:0;
        text-shadow:0 2px 8px rgba(0,0,0,0.8);transition:opacity 120ms">按住左键蓄力</div>
      <div id="bb-charge" style="position:absolute;bottom:88px;left:50%;transform:translateX(-50%);
        width:220px;height:9px;border-radius:5px;background:rgba(0,0,0,0.45);
        border:1px solid rgba(255,255,255,0.25);overflow:hidden;opacity:0;transition:opacity 120ms">
        <div id="bb-charge-fill" style="height:100%;width:0%;
          background:linear-gradient(90deg,#4be08a,#ffe14d,#ff6a5d)"></div>
      </div>
      <div id="bb-banner" style="position:absolute;top:38%;left:50%;transform:translate(-50%,-50%);
        font-size:60px;font-weight:900;letter-spacing:6px;opacity:0;
        text-shadow:0 6px 24px rgba(0,0,0,0.8);transition:opacity 200ms;pointer-events:none"></div>
    `;
    this.score = root.querySelector('#bb-score') as HTMLDivElement;
    this.timer = root.querySelector('#bb-timer') as HTMLDivElement;
    this.hint = root.querySelector('#bb-hint') as HTMLDivElement;
    this.chargeWrap = root.querySelector('#bb-charge') as HTMLDivElement;
    this.chargeFill = root.querySelector('#bb-charge-fill') as HTMLDivElement;
    this.bannerEl = root.querySelector('#bb-banner') as HTMLDivElement;
    void this.score;
  }

  update(snap: GameSnapshot): void {
    const blue = this.root.querySelector('#bb-blue') as HTMLSpanElement;
    const red = this.root.querySelector('#bb-red') as HTMLSpanElement;
    blue.textContent = String(snap.scoreBlue);
    red.textContent = String(snap.scoreRed);

    const m = Math.floor(snap.time / 60);
    const s = Math.floor(snap.time % 60);
    this.timer.textContent = `${m}:${String(s).padStart(2, '0')} · 先进 ${snap.goalsToWin} 球`;

    // 触球提示 + 蓄力条
    const charging = snap.charge > 0.001;
    this.hint.style.opacity = snap.ballInRange && !charging ? '1' : '0';
    this.chargeWrap.style.opacity = charging ? '1' : '0';
    this.chargeFill.style.width = `${Math.round(snap.charge * 100)}%`;
  }

  banner(title: string, color = '#ffe14d', sub = ''): void {
    this.bannerEl.innerHTML = `${title}${sub ? `<div style="font-size:20px;letter-spacing:3px;margin-top:8px;color:#cfd8e3">${sub}</div>` : ''}`;
    this.bannerEl.style.color = color;
    this.bannerEl.style.opacity = '1';
    window.setTimeout(() => {
      this.bannerEl.style.opacity = '0';
    }, 1400);
  }

  goal(team: Team): void {
    const title = team === 'blue' ? 'GOAL!' : '失球';
    this.banner(title, team === 'blue' ? '#4be08a' : '#ff6a5d', team === 'blue' ? '进球' : '对方进球');
  }
}
