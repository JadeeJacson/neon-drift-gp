/**
 * 唯一胶水层：输入 → sim.step → 事件消费（渲染 / 音频 / HUD）→ 渲染。
 *
 * 两条设计约束：
 *   1. sim 是唯一真相源。渲染层只读 EnemyView / GameSnapshot，不持有任何逻辑状态。
 *   2. 事件驱动反馈。sim 产出 SimEvent，这里翻译成粒子 / 音效 / HUD —— sim 因此保持零 DOM。
 */
import { CONFIG } from './core/config';
import * as THREE from 'three';
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

/** 手雷网格原型（clone 共享几何/材质）；位置与姿态每帧从 sim 的动态刚体读取 */
const grenadeMeshes = new Map<number, THREE.Group>();
const grenadeProto = ((): THREE.Group => {
  const g = new THREE.Group();
  g.name = 'grenade';
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x35503a, roughness: 0.55, metalness: 0.3 }),
  );
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.045, 0.055, 8),
    new THREE.MeshStandardMaterial({ color: 0x8a939b, roughness: 0.4, metalness: 0.75 }),
  );
  cap.position.y = 0.12;
  const lever = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.14, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xb8c0c8, roughness: 0.4, metalness: 0.7 }),
  );
  lever.position.set(0.05, 0.08, 0);
  lever.rotation.z = -0.3;
  ball.castShadow = true;
  g.add(ball, cap, lever);
  return g;
})();

/** 每帧同步手雷网格：新增建 mesh、消失移除（爆炸 / 重开时清场） */
function syncGrenades(): void {
  const alive = new Set<number>();
  for (const gr of sim.grenades.list) {
    alive.add(gr.id);
    let mesh = grenadeMeshes.get(gr.id);
    if (!mesh) {
      mesh = grenadeProto.clone();
      rig.scene.add(mesh);
      grenadeMeshes.set(gr.id, mesh);
    }
    const t = gr.body.translation();
    mesh.position.set(t.x, t.y, t.z);
    const r = gr.body.rotation();
    mesh.quaternion.set(r.x, r.y, r.z, r.w);
  }
  for (const [id, mesh] of grenadeMeshes) {
    if (alive.has(id)) continue;
    rig.scene.remove(mesh);
    grenadeMeshes.delete(id);
  }
}

/** 据点视觉：地面圆环 + 半透明光柱，颜色随占领方（蓝/红/中立）变化 */
function buildCaptureMarker(
  scene: THREE.Scene,
  cp: { x: number; z: number; r: number },
): { group: THREE.Group; update: (capture: number) => void } {
  const group = new THREE.Group();
  group.name = 'capture-point';
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(cp.r, 0.32, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0x9aa6b8, transparent: true, opacity: 0.85 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(cp.x, 0.08, cp.z);
  group.add(ring);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(cp.r * 0.96, cp.r * 0.96, 6, 36, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x9aa6b8,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    }),
  );
  beam.position.set(cp.x, 3, cp.z);
  group.add(beam);

  scene.add(group);

  const ringMat = ring.material as THREE.MeshBasicMaterial;
  const beamMat = beam.material as THREE.MeshBasicMaterial;
  return {
    group,
    update(capture: number) {
      const col = capture > 1 ? 0x3f8cff : capture < -1 ? 0xff5a4d : 0x9aa6b8;
      ringMat.color.setHex(col);
      beamMat.color.setHex(col);
      beamMat.opacity = 0.1 + Math.min(0.28, (Math.abs(capture) / 100) * 0.28);
    },
  };
}

/** 当前地图（bot 跑分基线固定用 DEFAULT_MAP_ID，改默认会失去与历史跑分的可比性） */
let currentMapId = DEFAULT_MAP_ID;
/** 当前模式：survival（生存）/ domination（据点占领） */
let currentMode: 'survival' | 'domination' = 'survival';
let sim = await GameSim.create(1, currentMapId, currentMode);
/** 竞技场几何：换图时必须 dispose 旧的再重建，否则新旧掩体会叠在一起 */
let arenaGroup: ReturnType<typeof buildArena> | null = buildArena(rig.scene, sim.map, sim.boxes);
let seedCounter = 1;
let running = false;

/** 据点标记（环 + 光柱），颜色随占领方变化 */
const captureMarker = buildCaptureMarker(rig.scene, sim.capturePoint);

function rebuildArena(): void {
  disposeArena(rig.scene, arenaGroup);
  arenaGroup = buildArena(rig.scene, sim.map, sim.boxes);
}

// ---------------- 输入 ----------------
const keys = new Set<string>();
const look = { yaw: 0, pitch: 0 };
/** 验证接口注入的覆盖值（headless 下没有真实键鼠） */
const injected: Partial<GameInput> = {};
let firing = false;
let dragging = false;
/** ADS 开镜（右键按住；移植自 04_1）。灵敏度与 FOV 都跟着它走。 */
let adsHeld = false;

const PITCH_LIMIT = Math.PI / 2 - 0.02;

function adsActive(): boolean {
  return typeof injected.ads === 'boolean' ? injected.ads : adsHeld;
}

function applyLook(dx: number, dy: number): void {
  // 开镜灵敏度缩放（04_1 的 ADS 手感核心之一）：镜内鼠标转速按比例收慢
  const sens = CONFIG.camera.sensitivity * (adsActive() ? CONFIG.player.ads.sensMul : 1);
  look.yaw -= dx * sens;
  look.pitch -= dy * sens;
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
  input.ads = adsActive();
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
        // 每把枪的屏幕震动幅度：AWM 重炮 > 沙鹰 > AK > M4 > MP5
        const shake: Partial<Record<typeof e.weapon, number>> = {
          awm: 0.5,
          deagle: 0.3,
          ak47: 0.12,
          m4a1: 0.09,
          mp5: 0.06,
        };
        rig.shake(shake[e.weapon] ?? 0.1);
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
        // 击杀信息流（移植自 04_2 / 04_1）：谁杀了谁
        hud.killfeed(e.killerTeam, e.byPlayer, e.kind, e.elite);
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
        fx.tracer(e.origin, e.dir, Math.min(sim.bounds.halfZ * 1.6, d + 6), 0xff9a4d);
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
      case 'grenadeThrow':
        audio.grenadeThrow();
        break;
      case 'explode': {
        fx.explosion(e.pos, e.radius);
        // 震动随距离衰减：30m 外只剩轻微颤感
        const loud = Math.max(0.15, 1 - dist3(e.pos, sim.player.pos()) / 30);
        rig.shake(0.65 * loud);
        audio.explode(dist3(e.pos, sim.player.pos()));
        break;
      }
      default:
        break;
    }
  }
}

// ---------------- 主循环（固定步长） ----------------
let last = performance.now();
let acc = 0;
let lastInput = emptyInput();

/** ADS 视场角过渡：开镜时 FOV 平滑收窄，收枪时还原（指数趋近）。
 *  AWM 狙击镜有武器级覆盖（24°），普通枪用全局开镜 FOV（56°）。 */
function updateFov(dt: number): void {
  const cam = rig.camera;
  const adsFov = sim.weapons.current.def.adsFov ?? CONFIG.player.ads.fov;
  const target = adsActive() ? adsFov : CONFIG.camera.fov;
  const lerp = adsActive() ? CONFIG.player.ads.fovLerp : 9; // 收镜略慢，出镜不突兀
  const next = cam.fov + (target - cam.fov) * (1 - Math.exp(-lerp * dt));
  if (Math.abs(next - cam.fov) > 0.01) {
    cam.fov = next;
    cam.updateProjectionMatrix();
  }
}

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
  updateFov(dt);
  enemyRenderer.sync(sim.enemyViews(), dt);
  syncGrenades();
  captureMarker.update(sim.capture);
  fx.update(dt);
  hud.drawMinimap(sim.boxes, sim.enemyViews(), sim.player.pos(), look.yaw, sim.capturePoint, sim.mode, sim.bounds);

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
    adsActive(),
  );
  hud.update(snap, dt);
  rig.render();
}
requestAnimationFrame(frame);

// ---------------- 开始 / 结算 / 重开 ----------------
async function beginRun(): Promise<void> {
  audio.init();
  // sim 在加载时就按默认地图/模式建好了；开始前如果换了图或换了模式，必须重建，
  // 否则物理按新图、渲染还是旧图（或反之）——看到的掩体和子弹撞到的掩体不是同一个。
  if (sim.map.id !== currentMapId || sim.mode !== currentMode) {
    const next = await GameSim.create(seedCounter, currentMapId, currentMode);
    const old = sim;
    sim = next;
    old.dispose();
    rebuildArena();
  }
  // 据点模式玩家出生在蓝队基地（船尾舱），面向船头（+Z → yaw=π）；生存面向船头方向
  look.yaw = sim.mode === 'domination' ? Math.PI : 0;
  look.pitch = 0;
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
  const isDom = sim.mode === 'domination';
  const capPct = Math.round(snap.capture);

  const title = won ? '任务完成' : '任务失败';
  const sub = isDom
    ? won
      ? '蓝队占领据点！'
      : snap.capture <= -100
        ? '据点失守'
        : '蓝队全员阵亡'
    : won
      ? '五波全清'
      : `倒在第 ${snap.wave} 波`;

  const stats = isDom
    ? `用时 <b>${mins}:${secs}</b> · 击杀红队 <b>${snap.kills}</b><br />
       蓝队存活 <b>${snap.blueAlive}</b> · 红队存活 <b>${snap.redAlive}</b><br />
       占领进度 <b>${capPct}%</b> · 地图 <b>${sim.map.name}</b>`
    : `用时 <b>${mins}:${secs}</b> · 击杀 <b>${snap.kills}</b><br />
       命中率 <b>${accPct}%</b>（${snap.hits}/${snap.shots}） · 爆头 <b>${snap.headshots}</b><br />
       剩余生命 <b>${Math.ceil(snap.hp)}</b> · 地图 <b>${sim.map.name}</b>`;

  panel.innerHTML = `
    <h1 style="${won ? '' : 'color:#ff5a4d'}">${title}</h1>
    <h2>${sub}</h2>
    <div class="stats">${stats}</div>
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
  const next = await GameSim.create(seedCounter, currentMapId, currentMode);
  const old = sim;
  sim = next;
  old.dispose();
  rebuildArena();
  look.yaw = sim.mode === 'domination' ? Math.PI : 0;
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

// ---------------- 模式选择 ----------------
/**
 * 从两个模式生成按钮。与地图选择同理：finish() 整体替换 panel.innerHTML，
 * 所以结算面板里不显示模式选择（模式在开局前定），这里只在起始面板渲染。
 */
function renderModeOptions(): void {
  const row = document.getElementById('mode-row');
  if (!row) return;
  row.innerHTML = '';
  const modes: Array<{ id: 'survival' | 'domination'; name: string }> = [
    { id: 'survival', name: '生存（5 波）' },
    { id: 'domination', name: '据点占领（5v5）' },
  ];
  for (const m of modes) {
    const b = document.createElement('button');
    b.className = 'mapopt' + (m.id === currentMode ? ' on' : '');
    b.textContent = m.name;
    b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      currentMode = m.id;
      renderModeOptions();
    });
    row.appendChild(b);
  }
}

renderMapOptions();
renderModeOptions();

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
  } else if (ev.button === 2) {
    adsHeld = true; // 右键开镜（04_1 同款：按住即开）
  }
});
window.addEventListener('mouseup', (ev) => {
  if (ev.button === 0) {
    firing = false;
    dragging = false;
  } else if (ev.button === 2) {
    adsHeld = false;
  }
});
canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
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
  /** 开局前切换模式（'survival' | 'domination'），beginRun 会据此重建 sim */
  setMode(mode: 'survival' | 'domination'): void;
  setInput(p: Partial<GameInput>): void;
  setLook(yaw: number, pitch: number): void;
  clearInput(): void;
  state(): Record<string, unknown>;
  enemies(): unknown[];
  /** 手雷状态（CDP 验证 H 项用）：场上雷体 id/位置/引信 */
  grenades(): Array<{ id: number; pos: { x: number; y: number; z: number }; fuse: number }>;
  info(): { drawCalls: number; triangles: number; programs: number };
  audioInfo(): { state: string; playCount: number; last: string };
  fxInfo(): { tracers: number; particles: number };
}

const api: FpsApi = {
  version: '043-transport-web',
  start: () => beginRun(),
  restart: () => restart(),
  setMode: (mode) => {
    currentMode = mode;
  },
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
  grenades: () =>
    sim.grenades.list.map((gr) => {
      const t = gr.body.translation();
      return { id: gr.id, pos: { x: t.x, y: t.y, z: t.z }, fuse: gr.fuse };
    }),
  info: () => rig.info(),
  audioInfo: () => ({ state: audio.state(), playCount: audio.playCount, last: audio.lastKind }),
  fxInfo: () => fx.counts(),
};
(window as unknown as { __fps: FpsApi }).__fps = api;
