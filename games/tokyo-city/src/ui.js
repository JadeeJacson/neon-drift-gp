// ui.js — 全部全屏面板：标题 / 玩法菜单 / 结算 / 暂停 / 车库 / 设置 / 操作说明。
//
// 面板是一个栈：从标题进设置，再「返回」会回到标题；从暂停进设置，返回回到暂停。
// 所有按钮都通过 data-act 委托给 actions（main.js 注入），面板自己不碰游戏状态，
// 只读 progress / game.hud 的快照来渲染。
import { PAINTS, UPGRADES, MEDALS } from './progress.js';
import { fmtTime } from './hud.js';

const MEDAL_ICON = Object.fromEntries(MEDALS.map((m) => [m.id, m.icon]));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const yen = (n) => '¥' + Math.round(n || 0).toLocaleString();
const hex = (c) => '#' + c.toString(16).padStart(6, '0');

export class UI {
  constructor({ progress, game, actions, isTouch }) {
    this.progress = progress;
    this.game = game;
    this.actions = actions;
    this.isTouch = isTouch;
    this.stack = [];
    this.root = document.getElementById('panel');
    this.card = document.getElementById('panel-card');
    this.onOpenChange = () => {};

    this.root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b || b.disabled) return;
      this.actions.click?.();
      this._act(b.dataset.act, b.dataset.arg, b);
    });
    this.root.addEventListener('input', (e) => {
      const t = e.target;
      if (t.dataset.setting) this._setting(t.dataset.setting, t.type === 'checkbox' ? t.checked : t.value, t);
    });
    // 点卡片外的暗色背景 = 返回（标题页除外）
    this.root.addEventListener('pointerdown', (e) => {
      if (e.target === this.root && this.top && this.top !== 'title' && this.top !== 'result') this.back();
    });
  }

  get top() { return this.stack[this.stack.length - 1] || null; }
  get open() { return this.stack.length > 0; }

  /** 打开一个面板。replace=true：替换栈顶（结算 → 菜单这种不该能「返回」的跳转） */
  show(name, data, { replace = false, root = false } = {}) {
    if (root) this.stack = [];
    else if (replace) this.stack.pop();
    this.stack.push(name);
    this.data = data;
    this.render();
  }

  back() {
    const leaving = this.stack.pop();
    if (leaving === 'pause') this.actions.resume?.();
    if (!this.stack.length) { this.close(); return; }
    this.render();
  }

  close() {
    this.stack = [];
    this.root.hidden = true;
    this.onOpenChange(false);
  }

  render() {
    const name = this.top;
    if (!name) return this.close();
    const fn = this['_' + name];
    this.card.className = 'panel-card p-' + name;
    this.card.innerHTML = fn.call(this, this.data);
    this.root.hidden = false;
    this.card.scrollTop = 0;
    this.onOpenChange(true);
  }

  _act(act, arg, el) {
    const a = this.actions;
    switch (act) {
      case 'back': this.back(); break;
      case 'nav': this.show(arg); break;
      case 'circuit': this.close(); a.startCircuit(arg); break;
      case 'rally': this.close(); a.startRally(); break;
      case 'job': this.close(); a.startJob({}); break;
      case 'job-skip': this.game.jobIndex = (this.game.jobIndex + 1) % this.game.jobs.length; this.game.jobStreak = 0; this.render(); break;
      case 'job-next': this.close(); a.startJob({ chain: true }); break;
      case 'again': this.close(); a.restart(); break;
      case 'free': this.close(); a.freeDrive(); break;
      case 'mode': this.close(); a.setPlay(arg); break;
      case 'resume': this.back(); break;
      case 'quit': a.quitToMenu(); break;
      case 'title': a.toTitle(); break;
      case 'paint': {
        if (this.progress.buyPaint(arg)) { a.applyCar(); a.sfx?.('coin'); } else a.sfx?.('fail');
        this.render(); break;
      }
      case 'upgrade': {
        if (this.progress.buyUpgrade(arg)) { a.applyCar(); a.sfx?.('coin'); } else a.sfx?.('fail');
        this.render(); break;
      }
      case 'reset-save': {
        if (el.dataset.confirm) { this.progress.reset(); a.applyCar(); a.applySettings(); this.render(); }
        else { el.dataset.confirm = '1'; el.textContent = '再点一次确认清空'; el.classList.add('danger'); }
        break;
      }
      case 'set': this._setting(el.dataset.key, arg, el); this.render(); break;
      default: break;
    }
  }

  _setting(key, value, el) {
    const s = this.progress.settings;
    if (key === 'volume') s.volume = Math.max(0, Math.min(1, Number(value) / 100));
    else if (key === 'shake' || key === 'showFps') s[key] = !!value;
    else s[key] = value;
    this.progress.save();
    this.actions.applySettings();
    if (el && key === 'volume') { const o = el.parentElement.querySelector('output'); if (o) o.textContent = Math.round(s.volume * 100); }
  }

  // ---------------------------------------------------------------- 面板模板
  _medalSummary() {
    const m = this.progress.data.medals;
    const n = { gold: 0, silver: 0, bronze: 0 };
    for (const v of Object.values(m)) if (v in n) n[v]++;
    return `🥇${n.gold} 🥈${n.silver} 🥉${n.bronze}`;
  }

  _title() {
    const p = this.progress.data;
    return `
      <div class="t-hero">
        <div class="t-logo">TOKYO</div>
        <div class="t-sub">東京シティ・スケープ · 开放城市驾驶</div>
        <div class="t-stats"><span class="pill">${yen(p.money)}</span><span class="pill">${this._medalSummary()}</span><span class="pill">完成订单 ${p.jobs.done}</span></div>
      </div>
      <div class="t-menu">
        <button class="btn primary big" data-act="nav" data-arg="play">开始游戏</button>
        <button class="btn" data-act="free">自由驾驶</button>
        <button class="btn" data-act="mode" data-arg="walk">街头散步</button>
        <button class="btn" data-act="mode" data-arg="orbit">城市观景</button>
        <button class="btn" data-act="nav" data-arg="garage">车库</button>
        <button class="btn" data-act="nav" data-arg="settings">设置</button>
        <button class="btn" data-act="nav" data-arg="help">操作说明</button>
        <a class="btn ghost" href="../../index.html">← 返回游戏大厅</a>
      </div>
      <div class="muted center">${this.isTouch ? '已启用触屏操控 · 横屏体验更佳' : '键盘 + 鼠标 · Esc 暂停 · V 切换模式 · N 昼夜'}</div>`;
  }

  _medalRow(targets, best) {
    return targets.map((t) => `<span class="tgt ${best != null && best <= t.time ? 'got' : ''}">${t.icon} ${fmtTime(t.time)}</span>`).join('');
  }

  _play() {
    const h = this.game.hud;
    const circuits = h.circuits.map((c) => `
      <button class="card-btn ${c.unlocked ? '' : 'locked'}" data-act="circuit" data-arg="${c.id}" ${c.unlocked ? '' : 'disabled'}>
        <div class="row1"><span class="nm">${c.unlocked ? '' : '🔒 '}${esc(c.name)} ${c.medal ? MEDAL_ICON[c.medal] : ''}</span><span class="tag">${esc(c.difficulty)} · ${c.laps} 圈 · ${c.lengthKm} km</span></div>
        <div class="bl">${c.unlocked ? esc(c.blurb) : esc(c.lockHint)}</div>
        <div class="row2"><span class="best">${c.best != null ? '最佳 ' + fmtTime(c.best) : '尚无成绩'}${c.bestLap != null ? ' · 单圈 ' + fmtTime(c.bestLap) : ''}</span><span>${this._medalRow(c.targets, c.best)}</span></div>
      </button>`).join('');
    const r = h.rally;
    const j = h.job;
    return `
      <h2>选择玩法</h2>
      <div class="muted">完赛拿奖金和奖牌，奖金可以在车库里买涂装、改装。漂移持续加分，撞车清零。</div>
      <div class="sec">⏱ 赛道计时赛</div>
      ${circuits}
      <div class="sec">📍 地标打卡</div>
      <button class="card-btn" data-act="rally">
        <div class="row1"><span class="nm">${esc(r.name)} ${r.medal ? MEDAL_ICON[r.medal] : ''}</span><span class="tag">${esc(r.difficulty)} · 约 ${r.lengthKm} km</span></div>
        <div class="bl">${esc(r.blurb)}</div>
        <div class="row2"><span class="best">${r.best != null ? '最佳 ' + fmtTime(r.best) : '尚无成绩'}</span><span>${this._medalRow(r.targets, r.best)}</span></div>
      </button>
      <div class="sec">📦 跑腿派单</div>
      <div class="card-btn static">
        <div class="row1"><span class="nm">${esc(j.label)}</span><span class="tag">酬金 ${yen(j.pay)} · 限时 ${fmtTime(j.limit)}</span></div>
        <div class="bl">先到「${esc(j.from)}」取货，再送到「${esc(j.to)}」。连续接单有连击加成，撞车会造成货损扣钱。</div>
        <div class="panel-actions"><button class="btn primary" data-act="job">接单</button><button class="btn" data-act="job-skip">换一单</button></div>
      </div>
      <div class="panel-actions"><button class="btn" data-act="back">返回</button></div>`;
  }

  _result(res) {
    if (!res) return '';
    const rows = [];
    const row = (k, v, cls = '') => rows.push(`<div class="k">${k}</div><div class="v ${cls}">${v}</div>`);
    let head = '', sub = '';
    if (res.type === 'job') {
      head = res.success ? '送达成功 ' + '★'.repeat(res.stars) + '☆'.repeat(3 - res.stars) : '派单失败';
      sub = res.success ? esc(res.title) : esc(res.reason || '超时了');
      row('用时', fmtTime(res.time), 'big');
      if (res.success) row('剩余时间', fmtTime(res.left));
      row('漂移分', res.drift.toLocaleString());
      row('碰撞', res.crashes + ' 次' + (res.success && res.damageMul < 1 ? `（货损 −${Math.round((1 - res.damageMul) * 100)}%）` : ''));
      if (res.success && res.streak > 1) row('连击', `×${res.streak}（酬金 ×${res.streakMul.toFixed(2)}）`, 'gold');
    } else {
      const medal = res.medal ? `${res.medal.icon} ${res.medal.name}` : '未获奖牌';
      head = `${esc(res.title)} · 完赛`;
      sub = res.record ? '<span class="record">新纪录！</span>' + (res.prevBest != null ? ` 比之前快 ${(res.prevBest - res.time).toFixed(1)}s` : '') : `最佳 ${fmtTime(res.prevBest)}`;
      row('总用时', fmtTime(res.time), 'big');
      row('奖牌', medal + (res.newMedal ? ` <span class="record">+${yen(res.medalBonus)}</span>` : ''), res.medal ? 'gold' : '');
      row('奖牌线', this._medalRow(res.targets, res.time));
      if (res.lapTimes?.length > 1) row('单圈', res.lapTimes.map((t) => fmtTime(t)).join(' / ') + (res.bestLap != null ? `（最佳 ${fmtTime(res.bestLap)}）` : ''));
      row('漂移分', res.drift.toLocaleString());
      row('碰撞', res.crashes + ' 次');
    }
    row('奖金', `<span class="money-up">+${yen(res.payout)}</span>`, 'big');
    row('钱包', yen(this.progress.money));
    const extra = res.unlocked ? `<div class="unlock">🔓 解锁新赛道：${esc(res.unlocked)}</div>` : '';
    const nextJob = res.type === 'job' && res.success && res.next
      ? `<button class="btn primary" data-act="job-next">下一单：${esc(res.next.to)}</button>` : '';
    return `
      <h2>${head}</h2>
      <div class="muted">${sub}</div>
      <div class="res-grid">${rows.join('')}</div>
      ${extra}
      ${this.isTouch ? '' : '<div class="muted small">R 再来一次 · Esc 自由驾驶</div>'}
      <div class="panel-actions">
        ${nextJob}
        <button class="btn ${nextJob ? '' : 'primary'}" data-act="again">${res.type === 'job' && !res.success ? '重试' : '再来一次'}</button>
        <button class="btn" data-act="nav" data-arg="play">玩法菜单</button>
        <button class="btn" data-act="free">自由驾驶</button>
      </div>`;
  }

  _pause() {
    const g = this.game;
    return `
      <h2>暂停</h2>
      <div class="muted">${g.active ? esc(g.hud.title) + ' 进行中' : '游戏已暂停'}</div>
      <div class="t-menu">
        <button class="btn primary big" data-act="resume">继续</button>
        ${g.active ? '<button class="btn" data-act="again">重新开始</button><button class="btn" data-act="quit">放弃并返回玩法菜单</button>' : '<button class="btn" data-act="nav" data-arg="play">玩法菜单</button>'}
        <button class="btn" data-act="nav" data-arg="garage">车库</button>
        <button class="btn" data-act="nav" data-arg="settings">设置</button>
        <button class="btn" data-act="nav" data-arg="help">操作说明</button>
        <button class="btn ghost" data-act="title">回到标题</button>
      </div>`;
  }

  _garage() {
    const p = this.progress;
    const paints = PAINTS.map((c) => {
      const own = p.ownsPaint(c.id), sel = p.data.paint === c.id;
      const label = sel ? '使用中' : own ? '使用' : yen(c.price);
      return `<button class="swatch ${sel ? 'sel' : ''} ${!own && p.money < c.price ? 'poor' : ''}" data-act="paint" data-arg="${c.id}">
        <span class="chip" style="background:${hex(c.color)}"></span><span class="sw-nm">${esc(c.name)}</span><span class="sw-pr">${label}</span></button>`;
    }).join('');
    const ups = UPGRADES.map((u) => {
      const lv = p.upgradeLevel(u.id), price = p.nextUpgradePrice(u.id);
      const pips = Array.from({ length: u.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
      return `<div class="up-row">
        <div><div class="nm">${esc(u.name)} <span class="pips">${pips}</span></div><div class="bl">${esc(u.desc)}</div></div>
        ${price == null ? '<span class="tag">已满级</span>' : `<button class="btn ${p.money >= price ? 'primary' : ''}" data-act="upgrade" data-arg="${u.id}" ${p.money >= price ? '' : 'disabled'}>升级 ${yen(price)}</button>`}
      </div>`;
    }).join('');
    return `
      <h2>车库</h2>
      <div class="muted">钱包 <b>${yen(p.money)}</b> · 比赛、打卡、送单都能赚钱。</div>
      <div class="sec">涂装</div>
      <div class="swatches">${paints}</div>
      <div class="sec">改装</div>
      ${ups}
      <div class="panel-actions"><button class="btn" data-act="back">返回</button></div>`;
  }

  _seg(key, options, current) {
    return `<div class="seg">${options.map(([v, l]) => `<button class="${current === v ? 'on' : ''}" data-act="set" data-key="${key}" data-arg="${v}">${l}</button>`).join('')}</div>`;
  }

  _settings() {
    const s = this.progress.settings;
    const q = this.actions.qualityLabel?.() || '';
    return `
      <h2>设置</h2>
      <div class="set-row"><div>画质<div class="bl">自动：按设备与帧率调整${q ? ' · 当前 ' + esc(q) : ''}</div></div>
        ${this._seg('quality', [['auto', '自动'], ['low', '流畅'], ['medium', '均衡'], ['high', '高清']], s.quality)}</div>
      <div class="set-row"><div>音量</div><label class="range"><input type="range" min="0" max="100" step="5" value="${Math.round(s.volume * 100)}" data-setting="volume" /><output>${Math.round(s.volume * 100)}</output></label></div>
      <div class="set-row"><div>镜头震动<div class="bl">高速与碰撞时的画面抖动</div></div><label class="switch"><input type="checkbox" data-setting="shake" ${s.shake ? 'checked' : ''} /><span></span></label></div>
      <div class="set-row"><div>显示帧率</div><label class="switch"><input type="checkbox" data-setting="showFps" ${s.showFps ? 'checked' : ''} /><span></span></label></div>
      <div class="set-row"><div>触屏按键</div>${this._seg('touch', [['auto', '自动'], ['on', '开启'], ['off', '关闭']], s.touch)}</div>
      <div class="set-row"><div>存档<div class="bl">清空钱包、成绩、奖牌与车库（保留设置）</div></div><button class="btn" data-act="reset-save">清空存档</button></div>
      <div class="panel-actions"><button class="btn primary" data-act="back">完成</button></div>`;
  }

  _help() {
    const kb = [
      ['通用', 'Esc / P 暂停 · V 切换 观景/散步/驾驶 · N 切换昼夜'],
      ['驾驶', 'W/↑ 油门 · S/↓ 刹车/倒车 · A D/← → 转向 · 空格 手刹漂移 · C 切换视角 · R 复位到路面'],
      ['散步', 'WASD 移动 · Shift 疾跑 · 空格 跳跃 · 点击画面锁定鼠标视角'],
      ['观景', '拖拽旋转 · 滚轮缩放 · WASD 平移 · Q/E 升降 · 顶部按钮快速切换地标视角'],
    ];
    const touch = [
      ['驾驶', '左下摇杆转向（上推=油门 下拉=刹车） · 右下 油门/刹车/漂移 · 视角/复位'],
      ['散步', '左下摇杆移动 · 屏幕空白处拖动转视角 · 疾跑/跳跃'],
      ['观景', '单指旋转 · 双指缩放/平移'],
    ];
    const tbl = (rows) => `<div class="res-grid help">${rows.map(([k, v]) => `<div class="k">${k}</div><div class="v left">${v}</div>`).join('')}</div>`;
    return `
      <h2>操作说明</h2>
      <div class="sec">${this.isTouch ? '触屏' : '键盘 / 鼠标'}</div>
      ${tbl(this.isTouch ? touch : kb)}
      <div class="sec">${this.isTouch ? '键盘 / 鼠标' : '触屏'}</div>
      ${tbl(this.isTouch ? kb : touch)}
      <div class="sec">玩法</div>
      <div class="bl">赛道：按顺序穿过绿色闸门（白色为终点）。打卡：跟随导航箭头前往粉色光柱。派单：绿色光柱取货，黄色光柱送达。<br />奖牌按全程平均速度评定，首次拿到更高等级奖牌有额外奖金。</div>
      <div class="panel-actions"><button class="btn primary" data-act="back">知道了</button></div>`;
  }
}
