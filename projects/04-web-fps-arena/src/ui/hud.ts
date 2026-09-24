/**
 * HUD —— DOM 叠层。
 *
 * 准星会随 sim 的真实散布张开：玩家看到的散布就是子弹真实的散布，
 * 不是渲染层另画一个好看的动画。手感因此是「可测的」而不是「看起来像」。
 */
import { CONFIG } from '../core/config';
import type { GameSnapshot } from '../sim/types';

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
`;

export class Hud {
  private readonly root: HTMLElement;
  private readonly arms: HTMLElement[] = [];
  private readonly el: Record<string, HTMLElement> = {};
  private hitTimer = 0;
  private bannerTimer = 0;

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
        <div id="slots"><span data-s="0">1</span><span data-s="1">2</span><span data-s="2">3</span></div>
        <div id="rlbar"><div id="rlfill"></div></div>
      </div>
      <div id="help">鼠标转视角 · 左键开火 · R 换弹 · 1/2/3 切枪 · Shift 疾跑 · Esc 释放鼠标</div>
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

    // 波次
    this.el.wave!.innerHTML = `WAVE <b>${snap.wave}</b> / ${snap.waveTotal}`;
    this.el.left!.textContent =
      snap.phase === 'playing'
        ? `场上 ${snap.enemiesAlive} · 剩余 ${snap.enemiesRemaining}`
        : '';
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
}
