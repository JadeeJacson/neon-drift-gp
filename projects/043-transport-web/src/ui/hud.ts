/**
 * HUD —— DOM 叠层。
 *
 * 准星会随 sim 的真实散布张开：玩家看到的散布就是子弹真实的散布，
 * 不是渲染层另画一个好看的动画。手感因此是「可测的」而不是「看起来像」。
 *
 * 移植自 04_2 / 04_1 的新增件：小地图（04_2 canvas 绘制思路）、击杀信息流（04_2/04_1）。
 */
import { CONFIG } from '../core/config';
import type { BoxObstacle, MapBounds } from '../sim/arena';
import type { EnemyView, GameMode, GameSnapshot, Team, Vec3 } from '../sim/types';

const CSS = `
#hud { font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif; }
#xhud { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:120px; height:120px; }
#xhud .arm { position:absolute; background:#eaf2ff; box-shadow:0 0 3px rgba(0,0,0,.9); }
#xhud .dot { position:absolute; left:50%; top:50%; width:2px; height:2px; margin:-1px 0 0 -1px;
  background:#ff6b35; border-radius:50%; }
#xhud.hit .arm { background:#ff5a4d; }
#hm { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:26px; height:26px;
  opacity:0; transition:opacity 90ms; }
#hm.on { opacity:1; }
#hm i { position:absolute; width:11px; height:2px; background:#fff; box-shadow:0 0 4px #000; }
#hm i:nth-child(1){ left:1px; top:12px; transform:rotate(45deg); }
#hm i:nth-child(2){ left:14px; top:12px; transform:rotate(-45deg); }
#hm i:nth-child(3){ left:14px; top:12px; transform:rotate(45deg); }
#hm i:nth-child(4){ left:1px; top:12px; transform:rotate(-45deg); }
#hm.head i { background:#ffd166; height:3px; }

#hpwrap { position:absolute; left:34px; bottom:30px; width:230px; }
#hpwrap .lbl { font-size:11px; letter-spacing:2px; color:#8c98ab; margin-bottom:5px; }
#hpbar { height:12px; background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.18); border-radius:3px; overflow:hidden; }
#hpfill { height:100%; width:100%; background:linear-gradient(90deg,#ff6b35,#ffb066); transition:width 120ms linear; }
#hpnum { margin-top:5px; font-size:26px; font-weight:700; color:#eaf2ff; line-height:1; }
#hpnum small { font-size:12px; color:#8c98ab; font-weight:400; }
#hpwrap.low #hpfill { background:linear-gradient(90deg,#e03040,#ff7a6a); }
#hpwrap.low #hpnum { color:#ff6b6b; }

#ammo { position:absolute; right:38px; bottom:26px; text-align:right; }
#ammonum { font-size:40px; font-weight:700; color:#eaf2ff; line-height:1; letter-spacing:1px; }
#ammonum.empty { color:#ff5a4d; }
#ammomag { font-size:15px; color:#8c98ab; margin-top:2px; }
#wname { font-size:12px; letter-spacing:3px; color:#ff6b35; margin-top:6px; }
#slots { margin-top:8px; display:flex; gap:6px; justify-content:flex-end; }
#slots span { font-size:11px; padding:3px 8px; border:1px solid rgba(255,255,255,.16); border-radius:4px; color:#7d8899; }
#slots span.on { border-color:#ff6b35; color:#ffb066; background:rgba(255,107,53,.12); }
#rlbar { margin-top:7px; height:4px; width:150px; margin-left:auto; background:rgba(255,255,255,.12); border-radius:2px; overflow:hidden; opacity:0; }
#rlbar.on { opacity:1; }
#rlfill { height:100%; width:0%; background:#ffc14d; }

#top { position:absolute; left:50%; top:24px; transform:translateX(-50%); text-align:center; }
#wave { font-size:13px; letter-spacing:4px; color:#c9d4e4; }
#wave b { color:#ff6b35; font-size:17px; }
#left { font-size:11px; color:#8c98ab; margin-top:4px; letter-spacing:1px; }

#banner { position:absolute; left:50%; top:31%; transform:translate(-50%,-50%); text-align:center;
  opacity:0; transition:opacity 200ms; pointer-events:none; }
#banner.on { opacity:1; }
#banner .b1 { font-size:34px; font-weight:800; letter-spacing:6px; color:#ff6b35;
  text-shadow:0 3px 14px rgba(0,0,0,.85); }
#banner .b2 { font-size:13px; letter-spacing:2px; color:#c9d4e4; margin-top:6px; }

#dmgv { position:absolute; inset:0; box-shadow:inset 0 0 160px 24px rgba(200,20,40,.75); opacity:0;
  transition:opacity 260ms; }
#help { position:absolute; left:50%; bottom:12px; transform:translateX(-50%); font-size:11px; color:#5f6a7c; letter-spacing:1px; }

#capwrap { position:absolute; left:50%; top:60px; transform:translateX(-50%); width:360px; display:none; }
#capwrap.on { display:block; }
#capwrap .lbl { font-size:11px; letter-spacing:3px; color:#9aa6b8; text-align:center; margin-bottom:5px; }
#capbar { height:15px; background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.20); border-radius:8px; overflow:hidden; position:relative; }
#capfill { height:100%; width:50%; background:linear-gradient(90deg,#2f6fd0,#3f8cff); transition:width 120ms linear; }
#capmid { position:absolute; left:50%; top:0; width:1px; height:100%; background:rgba(255,255,255,.55); }
#capterms { display:flex; justify-content:space-between; font-size:12px; margin-top:5px; letter-spacing:1px; }
#capterms .b { color:#5aa9ff; font-weight:700; }
#capterms .r { color:#ff7a6a; font-weight:700; }
#capterms .c { color:#cfd8e6; }

/* ---- 小地图（移植自 04_2）---- */
#minimap { position:absolute; top:18px; right:18px; width:150px; height:150px;
  border:1px solid rgba(255,255,255,.16); border-radius:8px;
  background:rgba(8,10,20,.55); }
/* ---- 击杀信息流（移植自 04_2 / 04_1）---- */
#killfeed { position:absolute; top:18px; left:18px; display:flex; flex-direction:column; gap:5px; pointer-events:none; }
#killfeed .kf { font-size:12px; letter-spacing:1px; padding:4px 10px;
  background:rgba(8,10,20,.6); border:1px solid rgba(255,255,255,.08); border-radius:6px;
  color:#cfd8e6; transition:opacity .45s; }
#killfeed .kf b.blue { color:#5aa9ff; }
#killfeed .kf b.red { color:#ff7a6a; }
#killfeed .kf.fade { opacity:0; }
`;

export class Hud {
  private readonly root: HTMLElement;
  private readonly arms: HTMLElement[] = [];
  private readonly el: Record<string, HTMLElement> = {};
  private hitTimer = 0;
  private bannerTimer = 0;
  private minimapCtx: CanvasRenderingContext2D | null = null;
  /** killfeed 条目：{dom, 剩余寿命}；在 update(dt) 里统一倒计时 */
  private readonly feed: Array<{ el: HTMLElement; life: number }> = [];

  constructor(root: HTMLElement) {
    this.root = root;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    this.root.innerHTML = `
      <div id="xhud">
        <div class="arm" data-a="up"></div>
        <div class="arm" data-a="down"></div>
        <div class="arm" data-a="left"></div>
        <div class="arm" data-a="right"></div>
        <div class="dot"></div>
      </div>
      <div id="hm"><i></i><i></i><i></i><i></i></div>
      <div id="dmgv"></div>
      <div id="top">
        <div id="wave">WAVE <b>1</b> / 5</div>
        <div id="left">剩余敌人 0</div>
      </div>
      <div id="capwrap">
        <div class="lbl">据点占领</div>
        <div id="capbar"><div id="capfill"></div><div id="capmid"></div></div>
        <div id="capterms"><span class="b">蓝 0</span><span class="c">中立</span><span class="r">红 0</span></div>
      </div>
      <div id="banner"><div class="b1"></div><div class="b2"></div></div>
      <div id="hpwrap">
        <div class="lbl">生命</div>
        <div id="hpbar"><div id="hpfill"></div></div>
        <div id="hpnum">100<small> / 100</small></div>
      </div>
      <div id="ammo">
        <div id="ammonum">30</div>
        <div id="ammomag">/ 30</div>
        <div id="wname">RIFLE</div>
        <div id="slots">${CONFIG.weapons
          .map((_, i) => `<span data-s="${i}">${i + 1}</span>`)
          .join('')}</div>
        <div id="rlbar"><div id="rlfill"></div></div>
      </div>
      <div id="help">鼠标转视角 · 左键开火 · 右键开镜 · R 换弹 · 1/2/3 切枪 · Shift 疾跑 · Esc 释放鼠标</div>
      <canvas id="minimap" width="150" height="150"></canvas>
      <div id="killfeed"></div>
    `;

    const q = (id: string): HTMLElement => {
      const n = this.root.querySelector<HTMLElement>(`#${id}`);
      if (!n) throw new Error(`HUD 缺少元素 #${id}`);
      this.el[id] = n;
      return n;
    };
    q('xhud');
    q('hm');
    q('dmgv');
    q('wave');
    q('left');
    q('capwrap');
    q('capfill');
    q('capterms');
    q('banner');
    q('hpwrap');
    q('hpfill');
    q('hpnum');
    q('ammonum');
    q('ammomag');
    q('wname');
    q('slots');
    q('rlbar');
    q('rlfill');
    q('killfeed');

    const mm = this.root.querySelector<HTMLCanvasElement>('#minimap');
    this.minimapCtx = mm?.getContext('2d') ?? null;

    const xhud = this.el.xhud!;
    for (const a of ['up', 'down', 'left', 'right']) {
      const n = xhud.querySelector<HTMLElement>(`[data-a="${a}"]`);
      if (n) this.arms.push(n);
    }
  }

  /** 每帧更新 */
  update(snap: GameSnapshot, dt: number): void {
    // 准星张开：sim 的真实散布 → 像素
    const h = window.innerHeight;
    const halfFov = (CONFIG.camera.fov * Math.PI) / 180 / 2;
    const px = (snap.spread / halfFov) * (h / 2);
    const gap = 5 + px;
    const len = 8;
    const [up, down, left, right] = this.arms;
    if (up && down && left && right) {
      up.style.width = '2px';
      up.style.height = `${len}px`;
      up.style.left = '50%';
      up.style.top = `${60 - gap - len}px`;
      down.style.width = '2px';
      down.style.height = `${len}px`;
      down.style.left = '50%';
      down.style.top = `${60 + gap}px`;
      left.style.width = `${len}px`;
      left.style.height = '2px';
      left.style.top = '50%';
      left.style.left = `${60 - gap - len}px`;
      right.style.width = `${len}px`;
      right.style.height = '2px';
      right.style.top = '50%';
      right.style.left = `${60 + gap}px`;
    }

    // 命中标记淡出
    if (this.hitTimer > 0) {
      this.hitTimer -= dt;
      if (this.hitTimer <= 0) this.el.hm!.classList.remove('on');
    }
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.el.banner!.classList.remove('on');
    }

    // 生命
    const hpPct = Math.max(0, snap.hp / snap.maxHp);
    this.el.hpfill!.style.width = `${hpPct * 100}%`;
    this.el.hpnum!.innerHTML = `${Math.ceil(snap.hp)}<small> / ${snap.maxHp}</small>`;
    this.el.hpwrap!.classList.toggle('low', hpPct < 0.35);

    // 弹药
    this.el.ammonum!.textContent = String(snap.ammo);
    this.el.ammonum!.classList.toggle('empty', snap.ammo === 0);
    this.el.ammomag!.textContent = `/ ${snap.magazine}`;
    const def = CONFIG.weapons[snap.slot];
    this.el.wname!.textContent = def?.short ?? '';

    const slotEls = this.el.slots!.querySelectorAll<HTMLElement>('span');
    slotEls.forEach((s, i) => s.classList.toggle('on', i === snap.slot));

    // 换弹进度
    this.el.rlbar!.classList.toggle('on', snap.reloading);
    this.el.rlfill!.style.width = `${Math.round(snap.reloadProgress * 100)}%`;

    // 模式分支：据点占领显示占领进度条 + 双方存活；生存显示波次
    if (snap.mode === 'domination') {
      this.el.wave!.style.display = 'none';
      this.el.left!.style.display = 'none';
      this.el.capwrap!.classList.add('on');
      const pct = ((snap.capture + 100) / 2).toFixed(1);
      this.el.capfill!.style.width = `${pct}%`;
      this.el.capfill!.style.background =
        snap.capture >= 0
          ? 'linear-gradient(90deg,#2f6fd0,#3f8cff)'
          : 'linear-gradient(90deg,#ff5a4d,#d83a2a)';
      const status = snap.capture > 5 ? '蓝队占领中' : snap.capture < -5 ? '红队占领中' : '中立';
      this.el.capterms!.innerHTML =
        `<span class="b">蓝 ${snap.blueAlive}</span>` +
        `<span class="c">${status} ${Math.abs(Math.round(snap.capture))}%</span>` +
        `<span class="r">红 ${snap.redAlive}</span>`;
    } else {
      this.el.wave!.style.display = '';
      this.el.left!.style.display = '';
      this.el.capwrap!.classList.remove('on');
      this.el.wave!.innerHTML = `WAVE <b>${snap.wave}</b> / ${snap.waveTotal}`;
      this.el.left!.textContent =
        snap.phase === 'playing'
          ? `场上 ${snap.enemiesAlive} · 剩余 ${snap.enemiesRemaining}`
          : '';
    }

    this.tickFeed(dt);
  }

  hitmarker(headshot: boolean): void {
    const hm = this.el.hm!;
    hm.classList.add('on');
    hm.classList.toggle('head', headshot);
    this.hitTimer = 0.16;
  }

  banner(main: string, sub = ''): void {
    const b = this.el.banner!;
    b.classList.add('on');
    const b1 = b.querySelector<HTMLElement>('.b1');
    const b2 = b.querySelector<HTMLElement>('.b2');
    if (b1) b1.textContent = main;
    if (b2) b2.textContent = sub;
    this.bannerTimer = 2.0;
  }

  /** 受击时的屏幕红边 */
  damage(intensity: number): void {
    const v = this.el.dmgv!;
    v.style.opacity = String(Math.min(0.95, 0.35 + intensity));
    window.setTimeout(() => {
      v.style.opacity = '0';
    }, 130);
  }

  /**
   * 小地图（移植自 04_2）：北朝上固定视角；运输船是窄长甲板 →
   * 按地图边界做等比缩放 + 居中（不再假设正方形），旋转盒按 yaw 画。
   * 数据全部来自 sim（boxes / enemyViews / playerPos），渲染层只做投影，不持逻辑。
   */
  drawMinimap(
    boxes: BoxObstacle[],
    views: EnemyView[],
    playerPos: Vec3,
    yaw: number,
    capturePoint: { x: number; z: number; r: number },
    mode: GameMode,
    bounds: MapBounds,
  ): void {
    const ctx = this.minimapCtx;
    if (!ctx) return;
    const S = 150;
    // 等比缩放：长边贴满，短边居中
    const k = Math.min(S / (bounds.halfX * 2 + 1), S / (bounds.halfZ * 2 + 1));
    const ox = S / 2;
    const oz = S / 2;
    const px = (x: number): number => ox + x * k;
    const pz = (z: number): number => oz + z * k;

    ctx.clearRect(0, 0, S, S);

    // 掩体（不含外墙——外墙就是地图边框本身）；yaw 盒走旋转绘制
    for (const b of boxes) {
      if (b.kind === 'wall') continue;
      const shade =
        b.kind === 'pillar' ? '#525c6e' : b.kind === 'container' ? '#4a5570' : '#39415a';
      if (!b.yaw) {
        ctx.fillStyle = shade;
        ctx.fillRect(px(b.pos.x - b.half.x), pz(b.pos.z - b.half.z), b.half.x * 2 * k, b.half.z * 2 * k);
      } else {
        ctx.save();
        ctx.translate(px(b.pos.x), pz(b.pos.z));
        ctx.rotate(-b.yaw); // 画布 y 轴向下 → 旋转方向取反
        ctx.fillStyle = shade;
        ctx.fillRect(-b.half.x * k, -b.half.z * k, b.half.x * 2 * k, b.half.z * 2 * k);
        ctx.restore();
      }
    }

    // 据点圈（仅据点模式）
    if (mode === 'domination') {
      ctx.strokeStyle = 'rgba(160,180,210,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px(capturePoint.x), pz(capturePoint.z), capturePoint.r * k, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 战斗员点
    for (const v of views) {
      if (!v.alive) continue;
      ctx.fillStyle = v.team === 'blue' ? '#5aa9ff' : '#ff5a4d';
      ctx.beginPath();
      ctx.arc(px(v.pos.x), pz(v.pos.z), v.elite ? 3.2 : 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 玩家：箭头（朝向 = sim 同款 yaw 约定，forward = (-sin yaw, -cos yaw)）
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    const cx = px(playerPos.x);
    const cy = pz(playerPos.z);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(cx + fx * 6, cy + fz * 6);
    ctx.lineTo(cx - fz * 3 - fx * 3, cy + fx * 3 - fz * 3);
    ctx.lineTo(cx + fz * 3 - fx * 3, cy - fx * 3 - fz * 3);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 击杀信息流（移植自 04_2 / 04_1）。killerTeam=null 时不显示（不应发生）。
   */
  killfeed(killerTeam: Team | null, byPlayer: boolean, kind: EnemyView['kind'], elite: boolean): void {
    if (!killerTeam) return;
    const feed = this.el.killfeed!;
    const def = CONFIG.enemies[kind];
    const victimName = `${elite ? '精英·' : ''}${def.name}`;
    const killerName = byPlayer ? '你' : killerTeam === 'blue' ? '蓝·友军' : '红·兵';
    const item = document.createElement('div');
    item.className = 'kf';
    item.innerHTML =
      `<b class="${killerTeam}">${killerName}</b>` +
      ` <span style="opacity:.6">击杀</span> ` +
      `<b class="${killerTeam === 'blue' ? 'red' : 'blue'}">${victimName}</b>`;
    feed.appendChild(item);
    this.feed.push({ el: item, life: 3.2 });
    // 上限 5 条：多了直接砍最旧的
    while (this.feed.length > 5) {
      const old = this.feed.shift();
      old?.el.remove();
    }
  }

  /** killfeed 倒计时（在 update(dt) 末尾调用） */
  private tickFeed(dt: number): void {
    for (let i = this.feed.length - 1; i >= 0; i--) {
      const f = this.feed[i]!;
      f.life -= dt;
      if (f.life < 0.45) f.el.classList.add('fade');
      if (f.life <= 0) {
        f.el.remove();
        this.feed.splice(i, 1);
      }
    }
  }
}
