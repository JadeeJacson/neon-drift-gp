/**
 * 唯一胶水层：输入 → sim.step → 事件消费（渲染 / 音频 / HUD）→ 渲染。
 *
 * 两条设计约束：
 *   1. sim 是唯一真相源。渲染层只读 EnemyView / GameSnapshot，不持有任何逻辑状态。
 *   2. 事件驱动反馈。sim 产出 SimEvent，这里翻译成粒子 / 音效 / HUD —— sim 因此保持零 DOM。
 */
import { CONFIG } from './core/config';
import { GameSim } from './sim/game';
import { emptyInput } from './sim/types';
import type { GameInput, SimEvent } from './sim/types';
import { SceneRig } from './render/scene';
import { buildArena, disposeArena } from './render/arena';
import { EnemyRenderer, ViewModel } from './render/actors';
import { Fx } from './render/fx';
import { AudioEngine } from './audio/synth';
import { Hud } from './ui/hud';
import { DEFAULT_MAP_ID, MAPS } from './sim/arena';

/** 取必需容器：缺了就是 index.html 结构错了，早失败比运行时 undefined 好查 */
function need(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`index.html 缺少必要容器 #${id}`);
  return el;
}
const container = need('app');
const hudRoot = need('hud');
const overlay = need('overlay');
const panel = need('panel');

const rig = new SceneRig(container);
const enemyRenderer = new EnemyRenderer(rig.scene);
const fx = new Fx(rig.scene);
const viewModel = new ViewModel(rig.camera);
const hud = new Hud(hudRoot);
const audio = new AudioEngine();

/** 当前地图（bot 跑分基线固定用 DEFAULT_MAP_ID，改默认会失去与历史跑分的可比性） */
let currentMapId = DEFAULT_MAP_ID;
let sim = await GameSim.create(1, currentMapId);
/** 竞技场几何：换图时必须 dispose 旧的再重建，否则新旧掩体会叠在一起 */
let arenaGroup: ReturnType<typeof buildArena> | null = buildArena(rig.scene, sim.boxes);
let seedCounter = 1;
let running = false;

function rebuildArena(): void {
  disposeArena(rig.scene, arenaGroup);
  arenaGroup = buildArena(rig.scene, sim.boxes);
}

// ---------------- 输入 ----------------
const keys = new Set<string>();
const look = { yaw: 0, pitch: 0 };
/** 验证接口注入的覆盖值（headless 下没有真实键鼠） */
const injected: Partial<GameInput> = {};
let firing = false;
let dragging = false;

const PITCH_LIMIT = Math.PI / 2 - 0.02;

function applyLook(dx: number, dy: number): void {
  look.yaw -= dx * CONFIG.camera.sensitivity;
  look.pitch -= dy * CONFIG.camera.sensitivity;
  look.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, look.pitch));
}

function currentInput(): GameInput {
  const input = emptyInput();
  input.forward = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
  input.right = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
  input.jump = keys.has('Space');
  input.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
  input.reload = keys.has('KeyR');
  input.fire = firing;
  input.yaw = look.yaw;
  input.pitch = look.pitch;
  // 槽位按键按武器数量动态生成：加武器只改 config，不用动这里
  for (let i = 0; i < CONFIG.weapons.length; i++) {
    if (keys.has(`Digit${i + 1}`)) {
      input.slot = i;
      break;
    }
  }
  return Object.assign(input, injected);
}

// ---------------- 事件消费 ----------------
function dist3(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function consume(events: SimEvent[]): void {
  for (const e of events) {
    switch (e.type) {
      case 'shot': {
        fx.tracer(e.origin, e.dir, e.len, 0xffe0a0);
        viewModel.flash();
        audio.shot(e.weapon);
        rig.shake(e.weapon === 'shotgun' ? 0.45 : e.weapon === 'pistol' ? 0.16 : 0.09);
        break;
      }
      case 'hit':
        fx.burst(e.point, e.headshot ? 0xffd166 : 0xff8a5a, CONFIG.fx.sparkCount, 5);
        audio.hit(e.headshot);
        hud.hitmarker(e.headshot);
        break;
      case 'kill': {
        const def = CONFIG.enemies[e.kind];
        fx.burst(
          e.point,
          e.elite ? CONFIG.elite.color : def.color,
          CONFIG.fx.gibCount,
          6.5,
          0.14,
        );
        audio.kill();
        break;
      }
      case 'miss':
        fx.burst(e.point, 0xbfc8d6, 5, 3, 0.06);
        break;
      case 'reloadStart':
        audio.reload();
        break;
      case 'empty':
        audio.empty();
        break;
      case 'switch':
        audio.swap();
        break;
      case 'playerHurt':
        audio.playerHurt();
        rig.shake(CONFIG.camera.hurtShake);
        hud.damage(0.55);
        break;
      case 'enemyShot': {
        const d = dist3(e.origin, sim.player.pos());
        fx.tracer(e.origin, e.dir, Math.min(CONFIG.arena.half * 1.6, d + 6), 0xff9a4d);
        audio.enemyShot(d);
        break;
      }
      case 'waveStart':
        audio.waveStart(e.wave);
        hud.banner(`WAVE ${e.wave}`, e.wave >= CONFIG.waves.length ? '最终波' : '');
        break;
      case 'waveClear':
        hud.banner('波次清空', '补充弹药 · 恢复生命');
        break;
      case 'win':
        audio.win();
        finish(true);
        break;
      case 'lose':
        audio.lose();
        finish(false);
        break;
      case 'footstep':
        audio.footstep();
        break;
      default:
        break;
    }
  }
}

// ---------------- 主循环（固定步长） ----------------
let last = performance.now();
let acc = 0;
let lastInput = emptyInput();

function frame(now: number): void {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  // running 期间持续 step。注意 sim 是在第一次 step 里才从 ready 转 playing，
  // 所以这里必须把 ready 也算进去，否则永远等不到 playing（自锁）。
  if (running && (sim.phase === 'ready' || sim.phase === 'playing')) {
    acc += dt;
    let steps = 0;
    while (acc >= CONFIG.physics.fixedDt && steps < 6) {
      const input = currentInput();
      lastInput = input;
      consume(sim.step(input));
      acc -= CONFIG.physics.fixedDt;
      steps += 1;
    }
    if (steps >= 6) acc = 0; // 掉帧太狠时丢弃积压，避免雪崩
  }

  const snap = sim.snapshot();
  const eye = sim.player.eye();
  rig.update(dt, {
    pos: eye,
    yaw: look.yaw,
    pitch: look.pitch,
    recoilPitch: sim.weapons.recoilPitch,
    recoilYaw: sim.weapons.recoilYaw,
  });
  enemyRenderer.sync(sim.enemyViews(), dt);
  fx.update(dt);

  const moving = Math.abs(lastInput.forward) + Math.abs(lastInput.right) > 0.1;
  viewModel.update(
    dt,
    snap.weapon,
    sim.weapons.recoilPitch,
    snap.reloading,
    snap.reloadProgress,
    sim.weapons.switchTimer > 0,
    moving,
    lastInput.sprint,
  );
  hud.update(snap, dt);
  rig.render();
}
requestAnimationFrame(frame);

// ---------------- 开始 / 结算 / 重开 ----------------
async function beginRun(): Promise<void> {
  audio.init();
  // sim 在加载时就按默认地图建好了；开始前如果换了图，必须重建，
  // 否则物理按新图、渲染还是旧图（或反之）——看到的掩体和子弹撞到的掩体不是同一个。
  if (sim.map.id !== currentMapId) {
    const next = await GameSim.create(seedCounter, currentMapId);
    const old = sim;
    sim = next;
    old.dispose();
    rebuildArena();
  }
  overlay.classList.add('hidden');
  running = true;
  acc = 0;
  last = performance.now();
}

function finish(won: boolean): void {
  running = false;
  const snap = sim.snapshot();
  const accPct = (snap.accuracy * 100).toFixed(0);
  const mins = Math.floor(snap.time / 60);
  const secs = (snap.time % 60).toFixed(0).padStart(2, '0');
  panel.innerHTML = `
    <h1 style="${won ? '' : 'color:#ff5a4d'}">${won ? '任务完成' : '任务失败'}</h1>
    <h2>${won ? '五波全清' : `倒在第 ${snap.wave} 波`}</h2>
    <div class="stats">
      用时 <b>${mins}:${secs}</b> · 击杀 <b>${snap.kills}</b><br />
      命中率 <b>${accPct}%</b>（${snap.hits}/${snap.shots}） · 爆头 <b>${snap.headshots}</b><br />
      剩余生命 <b>${Math.ceil(snap.hp)}</b> · 地图 <b>${sim.map.name}</b>
    </div>
    <div class="maplbl">换一张地图</div>
    <div class="maprow" id="map-row"></div>
    <button class="btn" id="again-btn">再来一局（Enter）</button>
    <div class="hint">点击后重新锁定鼠标</div>
  `;
  renderMapOptions();
  overlay.classList.remove('hidden');
  const again = document.getElementById('again-btn');
  again?.addEventListener('click', () => void restart());
}

async function restart(): Promise<void> {
  seedCounter += 1;
  // 先建新世界再释放旧的：否则 rAF 空窗期会踩到已释放的 Rapier world（09 号项目的教训）
  const next = await GameSim.create(seedCounter, currentMapId);
  const old = sim;
  sim = next;
  old.dispose();
  rebuildArena();
  look.yaw = 0;
  look.pitch = 0;
  keys.clear();
  firing = false;
  beginRun();
}

// ---------------- 地图选择 ----------------
/**
 * 从 MAPS 生成地图按钮。注意 finish() 会整体替换 panel.innerHTML，
 * 所以结算面板出现后必须重新调用一次，否则「换一张地图」是空的。
 */
function renderMapOptions(): void {
  const row = document.getElementById('map-row');
  if (!row) return;
  row.innerHTML = '';
  for (const m of MAPS) {
    const b = document.createElement('button');
    b.className = 'mapopt' + (m.id === currentMapId ? ' on' : '');
    b.textContent = m.name;
    b.title = m.desc;
    b.addEventListener('click', (ev) => {
      ev.stopPropagation(); // 否则会触发 overlay 的「点击任意处即开始」
      currentMapId = m.id;
      renderMapOptions();
    });
    row.appendChild(b);
  }
}
renderMapOptions();

// ---------------- 事件绑定 ----------------
overlay.addEventListener('click', (ev) => {
  const t = ev.target as HTMLElement | null;
  if (t?.id === 'start-btn' || t?.id === 'again-btn') return; // 按钮自己处理
  if (overlay.classList.contains('hidden')) return;
  if (sim.phase === 'won' || sim.phase === 'lost') void restart();
  else void beginRun();
});

document.getElementById('start-btn')?.addEventListener('click', (ev) => {
  ev.stopPropagation();
  void beginRun();
  rig.renderer.domElement.requestPointerLock?.();
});

window.addEventListener('keydown', (ev) => {
  if (ev.code === 'Enter' && (sim.phase === 'won' || sim.phase === 'lost')) {
    void restart();
    return;
  }
  keys.add(ev.code);
  if (ev.code === 'Space') ev.preventDefault();
});
window.addEventListener('keyup', (ev) => keys.delete(ev.code));
window.addEventListener('blur', () => keys.clear());

const canvas = rig.renderer.domElement;
canvas.addEventListener('mousedown', (ev) => {
  if (ev.button === 0) {
    firing = true;
    dragging = document.pointerLockElement !== canvas;
  }
});
window.addEventListener('mouseup', () => {
  firing = false;
  dragging = false;
});
window.addEventListener('mousemove', (ev) => {
  // PointerLock 下用 movement；未锁定时按住左键拖拽同样可以转视角（无锁降级 + 可访问性）
  if (document.pointerLockElement === canvas || dragging) {
    applyLook(ev.movementX, ev.movementY);
  }
});
window.addEventListener('resize', () => rig.resize());

// ---------------- 验证接口（CDP / 调试用） ----------------
export interface FpsApi {
  version: string;
  start(): void;
  restart(): Promise<void>;
  setInput(p: Partial<GameInput>): void;
  setLook(yaw: number, pitch: number): void;
  clearInput(): void;
  state(): Record<string, unknown>;
  enemies(): unknown[];
  info(): { drawCalls: number; triangles: number; programs: number };
  audioInfo(): { state: string; playCount: number; last: string };
  fxInfo(): { tracers: number; particles: number };
}

const api: FpsApi = {
  version: '04-fireround',
  start: () => beginRun(),
  restart: () => restart(),
  setInput: (p) => Object.assign(injected, p),
  setLook: (yaw, pitch) => {
    injected.yaw = yaw;
    injected.pitch = pitch;
    look.yaw = yaw;
    look.pitch = pitch;
  },
  clearInput: () => {
    for (const k of Object.keys(injected)) delete (injected as Record<string, unknown>)[k];
  },
  state: () => ({
    ...sim.snapshot(),
    running,
    weapons: sim.weapons.slots.map((s) => ({ id: s.def.id, ammo: s.ammo })),
  }),
  enemies: () => sim.enemyViews(),
  info: () => rig.info(),
  audioInfo: () => ({ state: audio.state(), playCount: audio.playCount, last: audio.lastKind }),
  fxInfo: () => fx.counts(),
};
(window as unknown as { __fps: FpsApi }).__fps = api;
