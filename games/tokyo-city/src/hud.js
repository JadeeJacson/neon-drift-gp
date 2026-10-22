// hud.js — 驾驶 HUD：速度表 / 计时 / 漂移分 / 目标提示 / 导航箭头 / 小地图 / 倒计时 / 提示条。
// 各种面板（菜单、结算、车库、设置）在 ui.js。
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
    this.objExtra = el('obj-extra');
    this.nav = el('nav');
    this.navArrow = el('nav-arrow');
    this.navLabel = el('nav-label');
    this.navDist = el('nav-dist');
    this.moneyEl = el('money');
    this.toasts = el('toasts');

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
      this.nav.hidden = true;
    }
  }

  setObjective(text, sub, timerSec, urgent, extra) {
    if (!text && !sub && timerSec == null) { this.objective.hidden = true; return; }
    this.objective.hidden = false;
    this.objTitle.textContent = text || '';
    this.objSub.textContent = sub || '';
    this.objExtra.textContent = extra || '';
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

  setMoney(n) { this.moneyEl.textContent = '¥' + Math.round(n).toLocaleString(); }

  /** 屏幕中上方的短提示（圈速、打卡、撞车…） */
  toast(text, kind = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.textContent = text;
    this.toasts.appendChild(t);
    while (this.toasts.children.length > 3) this.toasts.firstChild.remove();
    setTimeout(() => t.classList.add('out'), 1900);
    setTimeout(() => t.remove(), 2400);
  }

  /**
   * 指向导航目标的箭头。camYaw 与车 yaw 同一约定：前方 = (sin, cos)，角度增大 = 向左。
   */
  updateNav(target, car, camYaw) {
    if (!target) { this.nav.hidden = true; return; }
    this.nav.hidden = false;
    const dx = target.x - car.pos.x, dz = target.z - car.pos.z;
    const dist = Math.hypot(dx, dz);
    let rel = Math.atan2(dx, dz) - camYaw;
    while (rel > Math.PI) rel -= Math.PI * 2;
    while (rel < -Math.PI) rel += Math.PI * 2;
    this.navArrow.style.transform = `rotate(${(-rel * 180) / Math.PI}deg)`;
    this.navLabel.textContent = target.label;
    this.navDist.textContent = dist >= 1000 ? (dist / 1000).toFixed(1) + ' km' : Math.round(dist) + ' m';
  }

  // ---- 小地图 ----
  drawMinimap(car, game, traffic) {
    const ctx = this.mmCtx;
    const W = this.minimap.width;
    const { minX, minZ, scale } = this.mmWorld;
    const viewM = 1500;                       // 小地图覆盖 1500m 见方
    const srcPx = viewM * scale;
    const sx = (car.pos.x - minX) * scale - srcPx / 2;
    const sy = (car.pos.z - minZ) * scale - srcPx / 2;

    ctx.clearRect(0, 0, W, W);
    ctx.save();
    ctx.fillStyle = '#070d16';
    ctx.fillRect(0, 0, W, W);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.roadmap, sx, sy, srcPx, srcPx, 0, 0, W, W);

    const viewScale = W / viewM;             // 屏幕像素 / 米
    const toX = (x) => (x - car.pos.x) * viewScale + W / 2;
    const toY = (z) => (z - car.pos.z) * viewScale + W / 2;

    // 车流
    if (traffic) {
      ctx.fillStyle = 'rgba(200,210,230,.45)';
      const half = viewM / 2;
      for (const c of traffic.cars) {
        if (c.x == null || Math.abs(c.x - car.pos.x) > half || Math.abs(c.z - car.pos.z) > half) continue;
        ctx.fillRect(toX(c.x) - 1.5, toY(c.z) - 1.5, 3, 3);
      }
    }

    // 闸门
    if (game && game.mode === 'circuit' && game.circuit && game.active) {
      const gates = game.circuit.gates;
      ctx.strokeStyle = 'rgba(70,150,255,.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      gates.forEach((g, i) => (i ? ctx.lineTo(toX(g.x), toY(g.z)) : ctx.moveTo(toX(g.x), toY(g.z))));
      ctx.closePath();
      ctx.stroke();
      for (let i = 0; i < gates.length; i++) {
        const g = gates[i];
        const isNext = i === game.gateIndex;
        ctx.fillStyle = isNext ? '#4dffa6' : i === 0 ? '#ffffff' : 'rgba(70,150,255,.7)';
        ctx.beginPath();
        ctx.arc(toX(g.x), toY(g.z), isNext ? 7 : 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 导航目标：超出地图范围时钉在边缘，并画成箭头
    const t = game?.navTarget;
    if (t && game.mode !== 'circuit') {
      let x = toX(t.x), y = toY(t.z);
      const m = 14;
      const inside = x >= m && x <= W - m && y >= m && y <= W - m;
      const color = game.mode === 'rally' ? '#ff5fd2' : game.jobStage === 'pickup' ? '#4dffa6' : '#ffd23d';
      if (!inside) {
        const cx = W / 2, cy = W / 2;
        const ang = Math.atan2(y - cy, x - cx);
        const k = Math.min((W / 2 - m) / Math.abs(Math.cos(ang) || 1e-6), (W / 2 - m) / Math.abs(Math.sin(ang) || 1e-6));
        x = cx + Math.cos(ang) * k; y = cy + Math.sin(ang) * k;
        ctx.save();
        ctx.translate(x, y); ctx.rotate(ang);
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -9); ctx.lineTo(-6, 9); ctx.closePath(); ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = color; ctx.globalAlpha = 0.6; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // 自车：三角形指向车头
    ctx.translate(W / 2, W / 2);
    ctx.rotate(-car.yaw);
    ctx.fillStyle = '#ff5f4a';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(8, 9);
    ctx.lineTo(0, 4.5);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }
}

export { fmtTime };
