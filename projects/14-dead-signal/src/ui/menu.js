/* 菜单层：标题 / 加载 / 暂停 / 结算 四个覆盖屏的切换与按钮接线 */
import { fmtTime } from '../core/util.js';

export const Menu = {
  init(handlers) {
    const e = this.e = {};
    ['menu', 'loading', 'pause', 'over', 'barFill', 'loadText', 'btnStart', 'btnResume', 'btnRestart', 'sensVal',
     'stRound', 'stKills', 'stHeads', 'stAcc', 'stTime'].forEach((id) => (e[id] = document.getElementById(id)));
    this.e.menu.classList.remove('hidden');
    e.btnStart.addEventListener('click', () => handlers.onStart());
    e.btnResume.addEventListener('click', () => handlers.onResume());
    e.btnRestart.addEventListener('click', () => handlers.onRestart());
    this.handlers = handlers;
  },

  _hideAll() { ['menu', 'loading', 'pause', 'over'].forEach((k) => this.e[k].classList.add('hidden')); },

  title() { this._hideAll(); this.e.menu.classList.remove('hidden'); },
  pause(on, sens) {
    this.e.pause.classList.toggle('hidden', !on);
    if (on && sens != null) this.e.sensVal.textContent = Number(sens).toFixed(1);
  },
  over(stats, round) {
    this._hideAll();
    const e = this.e;
    e.stRound.textContent = round;
    e.stKills.textContent = stats.kills;
    e.stHeads.textContent = stats.heads;
    e.stAcc.textContent = stats.shots ? Math.round((stats.hits / stats.shots) * 100) + '%' : '—';
    e.stTime.textContent = fmtTime(stats.time);
    e.over.classList.remove('hidden');
  },

  /* 加载进度：phase(i, total, text) 驱动进度条；done(cb) 收尾 */
  loadStart() { this._hideAll(); this.e.loading.classList.remove('hidden'); this.phase(0, 1, '准备中…'); },
  phase(i, total, text) {
    this.e.barFill.style.width = Math.round((i / total) * 100) + '%';
    if (text) this.e.loadText.textContent = text;
  },
  loadDone() { this.e.loading.classList.add('hidden'); }
};
