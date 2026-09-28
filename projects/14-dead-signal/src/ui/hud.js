/* HUD：准星扩散 / 命中标记 / 弹药 / 点数滚动 / 回合数字 / 击杀信息流 / 受击方向 / 交互提示 */
import { esc } from '../core/util.js';
import { currentSpread } from '../weapons/weapons.js';

export const Hud = {
  el(id) { return document.getElementById(id); },

  init() {
    const e = this.e = {};
    ['hud', 'cross', 'hitmark', 'ammoBox', 'weaponName', 'ammoLine', 'mag', 'reserve', 'reloadHint',
     'roundNum', 'points', 'aliveInfo', 'killfeed', 'prompt', 'announce', 'dmgDir', 'dmgFlash',
     'lowHealth', 'objText', 'objCap'].forEach((id) => (e[id] = this.el(id)));
    // 准星四瓣（用 transform 平移实现扩散）
    this.gaps = {
      t: e.cross.querySelector('.t'), b: e.cross.querySelector('.b'),
      l: e.cross.querySelector('.l'), r: e.cross.querySelector('.r')
    };
    this._spreadPx = 0;
    this._feed = [];
    this._shownPoints = 0;
    this._hitT = 0;
    this._promptKey = null;
  },

  show(on) { this.e.hud.classList.toggle('hidden', !on); },

  /* 每帧刷新：st = { def, player, W, round, points, alive, sens } */
  tick(dt, st) {
    const e = this.e, P = st.player, W = st.W;
    const def = st.def;
    const key = W.slots[W.cur];

    // 弹药
    if (key !== 'knife') {
      e.mag.textContent = W.mag[key];
      e.reserve.textContent = '/' + W.reserve[key];
      e.weaponName.textContent = def.name;
      e.ammoLine.classList.toggle('low', W.mag[key] <= def.mag * 0.25);
      e.reloadHint.style.opacity = W.mag[key] === 0 ? 0.95 : (W.mag[key] < def.mag * 0.35 ? 0.8 : 0);
    } else {
      e.mag.textContent = '∞'; e.reserve.textContent = '';
      e.weaponName.textContent = 'M1918 军刀';
      e.reloadHint.style.opacity = 0;
    }

    // 准星扩散：散布角 → 像素
    if (def) {
      const spreadDeg = currentSpread(def, P);
      const pxPerDeg = window.innerHeight / (75 * Math.PI / 180);
      const want = Math.round(6 + spreadDeg * pxPerDeg * 0.55) * (P.adsT > 0.6 ? 0 : 1);
      this._spreadPx += (want - this._spreadPx) * Math.min(1, dt * 14);
      const s = Math.round(this._spreadPx);
      this.gaps.t.style.transform = 'translateY(' + s + 'px)';
      this.gaps.b.style.transform = 'translateY(-' + s + 'px)';
      this.gaps.l.style.transform = 'translateX(' + s + 'px)';
      this.gaps.r.style.transform = 'translateX(-' + s + 'px)';
      e.cross.style.opacity = P.adsT > 0.75 ? 0 : 1;
    }

    // 点数滚动
    this._shownPoints += (st.points - this._shownPoints) * Math.min(1, dt * 8);
    if (Math.abs(st.points - this._shownPoints) < 1) this._shownPoints = st.points;
    e.points.textContent = Math.round(this._shownPoints);
    e.roundNum.textContent = st.round;
    e.aliveInfo.textContent = '场上亡灵 ' + st.alive + ' · 待刷 ' + st.pending;

    // 低血量脉动
    e.lowHealth.classList.toggle('pulse', P.hp < 35 && !P.dead);
    e.lowHealth.style.opacity = P.hp < 35 ? '' : '0';

    // 命中标记淡出
    if (this._hitT > 0) {
      this._hitT -= dt;
      e.hitmark.style.opacity = Math.max(0, this._hitT / 0.18);
    }

    // 击杀信息流过期
    const now = performance.now();
    this._feed = this._feed.filter((f) => {
      if (now - f.born > 4200) { f.node.remove(); return false; }
      return true;
    });
  },

  hitmarker(head) {
    const e = this.e;
    e.hitmark.classList.toggle('hs', !!head);
    e.hitmark.style.opacity = 1;
    this._hitT = 0.18;
  },

  addFeed(text, head) {
    const e = this.e;
    const div = document.createElement('div');
    div.className = head ? 'hs' : '';
    div.innerHTML = text;
    e.killfeed.appendChild(div);
    this._feed.push({ node: div, born: performance.now() });
    while (this._feed.length > 5) { const f = this._feed.shift(); f.node.remove(); }
  },

  kill(charName, head) {
    this.addFeed('☠ ' + esc(charName) + (head ? ' <b style="color:#ff6a5a">[爆头]</b>' : ''));
  },

  damageDir(worldX, worldZ, camYaw) {
    const e = this.e;
    const ang = Math.atan2(worldX, worldZ);
    let rel = ang - (camYaw + Math.PI);             // 屏幕上方 = 面朝方向
    while (rel > Math.PI) rel -= Math.PI * 2;
    while (rel < -Math.PI) rel += Math.PI * 2;
    e.dmgDir.querySelector('i').style.transform = 'translateX(-50%) rotate(' + rel + 'rad)';
    e.dmgDir.style.opacity = 0.95;
    clearTimeout(this._ddT);
    this._ddT = setTimeout(() => { e.dmgDir.style.opacity = 0; }, 700);
  },

  flashDamage(k) {
    const e = this.e;
    e.dmgFlash.style.transition = 'none';
    e.dmgFlash.style.opacity = Math.min(1, 0.35 + (k || 0));
    requestAnimationFrame(() => {
      e.dmgFlash.style.transition = 'opacity 0.5s ease-out';
      e.dmgFlash.style.opacity = 0;
    });
  },

  announce(text) {
    const e = this.e;
    e.announce.textContent = text;
    e.announce.classList.remove('show');
    void e.announce.offsetWidth;                    // 重启动画
    e.announce.classList.add('show');
  },

  objective(text) { this.e.objText.textContent = text; },

  // prompt(label) 显示底部购买/补弹提示；null 隐藏
  prompt(label) {
    const e = this.e;
    if (label === this._promptKey) return;
    this._promptKey = label;
    if (label == null) { e.prompt.style.opacity = 0; return; }
    e.prompt.innerHTML = label;
    e.prompt.style.opacity = 1;
  }
};
