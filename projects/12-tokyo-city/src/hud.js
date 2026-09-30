// hud.js — 驾驶 HUD：速度表 / 计时 / 漂移分 / 目标提示 / 小地图 / 倒计时 / 结算面板。
//
// 小地图的做法：路网是静态的，所以只在启动时把整个路网烘焙进一张离屏 canvas，
// 之后每帧只从这张图上按「以车为中心」裁一块出来 blit。
// 逐帧重画几千条路会掉帧，这样做等于零成本。
import { coastX } from './layout.js';

const el = (id) => document.getElementById(id);

function fmtTime(sec) {
  if (sec == null || !isFinite(sec)) return '--:--';
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
}

export class Hud {
  constructor({ layout }) {
    this.layout = layout;
    this.speedNum = el('speed-num');
    this.speedo = el('speedo');
    this.driftRead = el('drift-read');
    this.objective = el('objective');
    this.objTitle = el('obj-title');
    this.objSub = el('obj-sub');
    this.objTimer = el('obj-timer');
    this.minimap = el('minimap');
    this.countdown = el('countdown');
    this.menuPanel = el('menu-panel');
    this.resPanel = el('res-panel');

    this.mmCtx = this.minimap.getContext('2d');
    this.bakeRoadmap();
  }

  // ---- 把整张路网烘焙进离屏画布 ----
  bakeRoadmap() {
    const { roadsV, roadsH } = this.layout;
    let minX = -300, maxX = 300, minZ = -300, maxZ = 300;
    for (const r of roadsV) { minX = Math.min(minX, r.pos - r.w); maxX = Math.max(maxX, r.pos + r.w); }
    for (const r of roadsH) { minZ = Math.min(minZ, r.pos - r.w); maxZ = Math.max(maxZ, r.pos + r.w); }
    const pad = 700;
    minX -= pad; maxX += pad; minZ -= pad; maxZ += pad;

    const size = 1024;
    const spanX = maxX - minX, spanZ = maxZ - minZ;
    const scale = size / Math.max(spanX, spanZ);
    this.mmWorld = { minX, minZ, scale, size };

    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');

    // 底：陆地
    g.fillStyle = '#0b1420';
    g.fillRect(0, 0, size, size);

    const px = (x) => (x - minX) * scale;
    const pz = (z) => (z - minZ) * scale;

    // 海：海岸线以东
    g.fillStyle = '#0a1c2e';
    g.beginPath();
    g.moveTo(px(coastX(minZ)), 0);
    for (let z = minZ; z <= maxZ; z += 120) g.lineTo(px(coastX(z)), pz(z));
    g.lineTo(size, size);
    g.lineTo(px(coastX(maxZ)), size);
    g.closePath();
    g.fill();

    // 支路 / 主干道：分两遍画，主干道更亮更粗
    const draw = (roads, vertical, width, color) => {
      g.strokeStyle = color;
      g.lineWidth = width;
      g.beginPath();
      for (const r of roads) {
        if (vertical) { g.moveTo(px(r.pos), 0); g.lineTo(px(r.pos), size); }
        else { g.moveTo(0, pz(r.pos)); g.lineTo(size, pz(r.pos)); }
      }
      g.stroke();
    };
    const minor = (arr) => arr.filter((r) => !r.major);
    const major = (arr) => arr.filter((r) => r.major);
    draw(minor(roadsV), true, 1.1, '#1c2836');
    draw(minor(roadsH), false, 1.1, '#1c2836');
    draw(major(roadsV), true, 2.4, '#2e4257');
    draw(major(roadsH), false, 2.4, '#2e4257');

    // 河流
    const r = this.layout.river;
    g.strokeStyle = '#153b55';
    g.lineWidth = Math.max(2, r.w * scale);
    g.beginPath(); g.moveTo(0, pz(r.z)); g.lineTo(size, pz(r.z)); g.stroke();

    this.roadmap = c;
  }

  setDriving(on) {
    this.speedo.hidden = !on;
    this.minimap.hidden = !on;
    if (!on) {
      this.driftRead.style.opacity = 0;
      this.objective.hidden = true;
    }
  }

  setObjective(text, sub, timerSec, urgent) {
    this.objective.hidden = false;
    this.objTitle.textContent = text || '';
    this.objSub.textContent = sub || '';
    if (timerSec == null) {
      this.objTimer.textContent = '';
    } else {
      this.objTimer.textContent = fmtTime(timerSec);
      this.objTimer.classList.toggle('urgent', !!urgent);
    }
  }

  setCountdown(n) {
    if (n == null) { this.countdown.classList.remove('show', 'go'); this.countdown.textContent = ''; return; }
    this.countdown.classList.add('show');
    if (n === 0) { this.countdown.textContent = 'GO!'; this.countdown.classList.add('go'); }
    else { this.countdown.textContent = String(n); this.countdown.classList.remove('go'); }
  }

  // ---- 小地图 ----
  drawMinimap(car, game) {
    const ctx = this.mmCtx;
    const W = this.minimap.width;
    const { minX, minZ, scale, size } = this.mmWorld;
    const viewM = 1500;                       // 小地图覆盖 1500m 见方
    const srcPx = viewM * scale;
    const sx = (car.pos.x - minX) * scale - srcPx / 2;
    const sy = (car.pos.z - minZ) * scale - srcPx / 2;

    ctx.clearRect(0, 0, W, W);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, W);
    ctx.clip();
    ctx.fillStyle = '#070d16';
    ctx.fillRect(0, 0, W, W);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.roadmap, sx, sy, srcPx, srcPx, 0, 0, W, W);

    const viewScale = W / viewM;             // 屏幕像素 / 米
    const toX = (x) => (x - car.pos.x) * viewScale + W / 2;
    const toY = (z) => (z - car.pos.z) * viewScale + W / 2;

    // 闸门
    if (game && game.mode === 'circuit' && game.circuit) {
      const gates = game.circuit.gates;
      for (let i = 0; i < gates.length; i++) {
        const g = gates[i];
        const isNext = i === game.gateIndex;
        ctx.fillStyle = isNext ? '#4dffa6' : 'rgba(70,150,255,.55)';
        ctx.beginPath();
        ctx.arc(toX(g.x), toY(g.z), isNext ? 6 : 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // 派单目标
    if (game && game.mode === 'job' && game.jobStage) {
      const j = game.activeJob;
      const t = game.jobStage === 'pickup' ? j.fromXZ : j.toXZ;
      ctx.fillStyle = '#ffd23d';
      ctx.beginPath();
      ctx.arc(toX(t[0]), toY(t[1]), 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,210,61,.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(toX(t[0]), toY(t[1]), 13, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 自车：三角形指向车头
    const cx = W / 2, cy = W / 2;
    ctx.translate(cx, cy);
    ctx.rotate(-car.yaw);
    ctx.fillStyle = '#ff5f4a';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6.5, 7);
    ctx.lineTo(0, 3.5);
    ctx.lineTo(-6.5, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---- 面板 ----
  buildMenu(circuits, job) {
    const list = el('circuit-list');
    list.innerHTML = '';
    for (const c of circuits) {
      const b = document.createElement('button');
      b.className = 'circuit';
      b.innerHTML =
        `<div class="row1"><span class="nm">${c.name}</span>` +
        `<span class="tag">${c.laps} 圈 · ${c.difficulty}</span></div>` +
        `<div class="bl">${c.blurb}</div>` +
        `<div class="best">${c.best != null ? '最佳 ' + fmtTime(c.best) : '尚无记录'}</div>`;
      b.onclick = () => this.onPickCircuit?.(c.id);
      list.appendChild(b);
    }
    el('job-preview').textContent = `当前派单：${job.label} · 限时 ${job.limit}s · 酬金 ¥${job.pay}`;
  }

  openMenu() { this.menuPanel.hidden = false; }
  closeMenu() { this.menuPanel.hidden = true; }
  get menuOpen() { return !this.menuPanel.hidden; }

  showResult(r) {
    const title = el('res-title'), sub = el('res-sub'), body = el('res-body');
    const row = (k, v, big) => `<div class="k">${k}</div><div class="v${big ? ' big' : ''}">${v}</div>`;
    if (r.type === 'circuit') {
      title.textContent = r.title + ' 完成';
      sub.innerHTML = r.record
        ? '<span class="record">新纪录！</span> 刷新了本地最佳成绩'
        : `最佳成绩 ${fmtTime(r.prevBest)}`;
      body.innerHTML =
        row('用时', fmtTime(r.time), true) +
        row('圈数', `${r.laps} 圈`) +
        row('漂移分', r.drift) +
        row('撞车', r.crashes + ' 次') +
        row('奖金', '¥' + r.payout.toLocaleString());
    } else {
      title.textContent = r.title;
      sub.textContent = r.success ? '准时送达，订单完成' : (r.reason || '订单失败');
      body.innerHTML =
        row('结果', r.success ? '完成' : '失败', true) +
        row('用时', fmtTime(r.time)) +
        row('剩余时间', r.success ? fmtTime(r.left) : '—') +
        row('漂移分', r.drift) +
        row('撞车', r.crashes + ' 次') +
        row('酬金', '¥' + r.payout.toLocaleString());
    }
    this.resPanel.hidden = false;
  }

  closeResult() { this.resPanel.hidden = true; }
  get resultOpen() { return !this.resPanel.hidden; }
}

export { fmtTime };
