// main.js — 启动、主循环、HUD 接线
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DayNightRig } from './env.js';
import { buildLayout } from './layout.js';
import { buildGround } from './ground.js';
import { applyRoadTexture } from './roadtex.js';
import { buildBuildings } from './buildings.js';
import { buildHouses } from './houses.js';
import { buildMountains } from './terrain.js';
import { buildBay } from './bay.js';
import { buildLandmarks } from './landmarks.js';
import { decorateBuildings, tickScreens } from './signs.js';
import { Traffic } from './traffic.js';
import { PlayController, buildColliderGrid } from './play.js';
import { Game } from './game.js';
import { Hud } from './hud.js';
import { buildProps } from './props.js';
import { loadFoliage } from './foliage.js';
import { AudioEngine } from './audio.js';
import { loadEnvironment } from './envmap.js';

const app = document.getElementById('app');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
  logarithmicDepthBuffer: true, // 大场景（near 1 / far 16000）防远处 z-fighting 闪烁
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
// EffectComposer 每个 pass 都会重置 renderer.info，导致帧率栏永远显示「1 draw」。
// 关掉自动重置、每帧手动清一次，统计才是整帧的真实绘制量。
renderer.info.autoReset = false;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1.0, 16000);
camera.position.set(-30, 60, -260);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = 1.52;
controls.minDistance = 18;
controls.maxDistance = 2600;
controls.target.set(-60, 20, 320);

// ---- 建城 ----
const layout = buildLayout();
const ground = buildGround(scene, layout);
const buildings = buildBuildings(scene, layout);
decorateBuildings(scene, buildings, 777);
const houseResult = buildHouses(scene, layout);
buildMountains(scene);
const bay = buildBay(scene, layout);
const crossingBuildings = buildLandmarks(scene);
const traffic = new Traffic(scene, layout);
const propCount = buildProps(scene, layout);

// 音频要等用户手势才能启动（浏览器策略），先 arm 不建 AudioContext
const audio = new AudioEngine();
audio.arm();

// ---- 碰撞网格 + 可玩模式（散步 / 驾驶）----
const colliderRects = [
  ...buildings.map((b) => ({ x: b.x, z: b.z, hw: b.w / 2, hd: b.d / 2 })),
  ...crossingBuildings.map((b) => ({ x: b.x, z: b.z, hw: b.w / 2, hd: b.d / 2 })),
  ...houseResult.rects,
];
const play = new PlayController({
  scene,
  camera,
  controls,
  dom: renderer.domElement,
  layout,
  colliderGrid: buildColliderGrid(colliderRects),
});

const rig = new DayNightRig(scene, camera, renderer);
rig.setMode('night'); // 首屏：夜晚霓虹

// ---- 视角预设 ----
// keepPos=true：只把视线（orbit target）转到预设目标，相机原地不动。
// 这是默认行为——切视角不该把人从当前位置传送走。
// keepPos=false（Shift+点击）：连相机位置一起飞到预设机位，保留电影感全景。
const VIEWS = {
  'v-shibuya': { p: [-8, 5.5, 130], t: [0, 15, -10] },
  'v-aerial': { p: [-620, 420, -660], t: [80, 0, 220] },
  'v-bay': { p: [1210, 170, 880], t: [2500, 20, 260] },
  'v-mtn': { p: [-1450, 150, 820], t: [-2950, 260, -420] },
  'v-tower': { p: [-230, 120, 150], t: [-480, 160, 620] },
  'v-skytree': { p: [430, 120, 360], t: [1000, 300, -180] },
};

function flyTo(v, instant = false, keepPos = false) {
  const t1 = new THREE.Vector3(...v.t);
  if (instant) {
    controls.target.copy(t1);
    if (!keepPos) camera.position.set(...v.p);
    return;
  }
  const p0 = camera.position.clone();
  const t0 = controls.target.clone();
  const p1 = keepPos ? p0.clone() : new THREE.Vector3(...v.p);
  const start = performance.now(), dur = 900;
  const anim = () => {
    const k = Math.min(1, (performance.now() - start) / dur);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    camera.position.lerpVectors(p0, p1, e);
    controls.target.lerpVectors(t0, t1, e);
    if (k < 1) requestAnimationFrame(anim);
  };
  anim();
}

// ---- HUD ----
const modeBtns = { day: document.getElementById('btn-day'), night: document.getElementById('btn-night'), auto: document.getElementById('btn-auto') };
function setModeUI(mode) {
  for (const [k, el] of Object.entries(modeBtns)) el.classList.toggle('on', k === mode);
}
setModeUI('night');
modeBtns.day.onclick = () => { rig.setMode('day'); setModeUI('day'); };
modeBtns.night.onclick = () => { rig.setMode('night'); setModeUI('night'); };
modeBtns.auto.onclick = () => { rig.setMode('auto'); setModeUI('auto'); };
for (const [id, v] of Object.entries(VIEWS)) {
  document.getElementById(id).onclick = (ev) => {
    if (play.mode !== 'orbit') { play.setMode('orbit'); setPlayUI('orbit'); }
    flyTo(v, false, !ev.shiftKey); // 默认原地转视角；Shift = 飞到预设机位
  };
}

// 可玩模式按钮与提示
const playBtns = { orbit: document.getElementById('m-orbit'), walk: document.getElementById('m-walk'), drive: document.getElementById('m-drive') };
const HINTS = {
  orbit: '拖拽旋转 · 滚轮缩放 · WASD 自由移动 · Q/E 升降 · Shift 加速 · N 昼夜 · V 切模式',
  walk: 'WASD 移动 · Shift 疾跑 · 空格跳跃 · 鼠标视角（点击画面锁定指针，ESC 释放）· V 切换',
  drive: 'W 油门 · S 刹车/倒车 · A/D 转向 · 空格手刹漂移 · C 切视角 · V 回到观景',
};
const hintEl = document.getElementById('hint');
function setPlayUI(mode) {
  for (const [k, e] of Object.entries(playBtns)) e.classList.toggle('on', k === mode);
  hintEl.textContent = HINTS[mode];
}
setPlayUI('orbit');
play.onHint = (mode) => setPlayUI(mode);
playBtns.orbit.onclick = () => play.setMode('orbit');
playBtns.walk.onclick = () => play.setMode('walk');
playBtns.drive.onclick = () => play.setMode('drive');

// ---- 玩法系统 ----
const game = new Game({ scene, layout, car: play.car });
const hud = new Hud({ layout });

play.onCrash = (impact) => { game.registerCrash(); audio.impact(impact); };

hud.onPickCircuit = (id) => {
  hud.closeMenu();
  if (play.mode !== 'drive') { play.setMode('drive'); setPlayUI('drive'); }
  game.startCircuit(id);
};

document.getElementById('m-play').onclick = () => {
  hud.buildMenu(game.hud.circuits, game.activeJob);
  hud.openMenu();
};
document.getElementById('btn-menu-close').onclick = () => hud.closeMenu();
document.getElementById('btn-dispatch').onclick = () => {
  hud.closeMenu();
  if (play.mode !== 'drive') { play.setMode('drive'); setPlayUI('drive'); }
  game.startJob();
};
document.getElementById('btn-again').onclick = () => {
  hud.closeResult();
  if (game.mode === 'job') game.startJob();
  else if (game.circuit) game.startCircuit(game.circuit.id);
};
document.getElementById('btn-free').onclick = () => {
  hud.closeResult();
  game.abort();
  hud.setObjective('', '', null);
};

game.onEvent = ({ type, result, stage }) => {
  if (type === 'finish') hud.showResult(result);
  if (type === 'menu') hud.setObjective('', '', null);
};

window.addEventListener('keydown', (ev) => {
  if (ev.code === 'KeyN') setModeUI(rig.toggle());
  if (ev.code === 'KeyV') setPlayUI(play.cycle());
  // 驾驶中：C 切换第一人称 / 追尾镜头
  if (ev.code === 'KeyC' && play.mode === 'drive') play.toggleCamera?.();
  if (ev.code === 'Escape') { hud.closeMenu(); hud.closeResult(); }
  if (ev.code === 'KeyR' && game.phase === 'finished') {
    hud.closeResult();
    if (game.mode === 'job') game.startJob(); else if (game.circuit) game.startCircuit(game.circuit.id);
  }
});

// 玩法进行中时把 HUD 打开
function syncHudVisibility() {
  hud.setDriving(play.mode === 'drive');
}

// HDRI 是异步加载的，失败也不该拖垮整个场景（离线/素材缺失时降级为无环境光）
loadEnvironment(scene).catch((e) => console.warn('[env] HDRI 加载失败，降级为无环境反射：', e.message));

// 路面 PBR：失败就继续用 ground.js 里那张程序化噪声兜底
applyRoadTexture(ground.roadMat).catch((e) => console.warn('[road] 路面贴图加载失败，沿用程序化噪声：', e.message));

// 植被：靠 houseRects 剔除，避免树长在房子上；失败只是少一层绿化，不影响玩法
loadFoliage(scene, layout, { houseRects: houseResult.rects })
  .then((r) => {
    if (r.failed.length) {
      console.warn(`[foliage] ${r.failed.length} 个模型加载失败：`, r.failed.map((f) => `${f.file}(${f.error})`).join(', '));
    }
    console.log(`[foliage] 植被 ${r.placed} 株 / ${r.models} 种模型`);
  })
  .catch((e) => console.warn('[foliage] 植被加载失败：', e.message));

// ---- 主循环 ----
const clock = new THREE.Clock();
const fpsEl = document.getElementById('fps');
let frames = 0, fpsT = 0, screenT = 0;
let firstFrame = true;

function tick(dt, elapsed) {
  renderer.info.reset();
  rig.update(dt, elapsed);
  traffic.update(dt);
  if (bay.wheel) bay.wheel.rotation.z += dt * 0.12;
  screenT += dt;
  if (screenT > 6) {
    screenT = 0;
    tickScreens();
  }
  // 观景模式的 WASD 平移要先落地，再交给 OrbitControls 重新解算球坐标
  play.update(dt);
  if (play.mode === 'orbit') controls.update();

  // ---- 玩法 + HUD ----
  syncHudVisibility();
  game.update(dt);
  if (play.mode === 'drive') {
    hud.speedNum.textContent = Math.round(play.car.kph);
    const d = game.hud.drift;
    hud.driftRead.textContent = '漂移 ' + d.toLocaleString();
    hud.driftRead.style.opacity = d > 40 ? '1' : '0';
    hud.drawMinimap(play.car, game);
  }
  const gh = game.hud;
  const gh0 = gh;
  if (play.mode === 'drive') {
    const car = play.car;
    // 速度归一要用实际极速（258km/h），别用 200 之类的硬编码
    audio.update(
      clamp(car.kph / 260, 0, 1),
      car.throttle,
      car.drift,
      true
    );
  } else {
    audio.update(0, 0, 0, false);
  }
  if (gh.phase === 'countdown') hud.setCountdown(gh.countdown);
  else hud.setCountdown(null);
  if (gh.phase === 'running' || gh.phase === 'countdown') {
    if (gh.mode === 'circuit') {
      hud.setObjective(gh.mode === 'circuit' ? game.circuit.name : '', `第 ${Math.min(game.lap + 1, game.circuit.laps)}/${game.circuit.laps} 圈 · 下一个闸门`, gh.time);
    } else {
      hud.setObjective('跑腿派单', gh.sub, gh.left, gh.left != null && gh.left < 12);
    }
  }

  rig.render();

  frames++; fpsT += dt;
  if (fpsT >= 0.5) {
    const dbg = location.search.includes('debug')
      ? ` | g:${gh0.phase}/${gh0.mode} id:${game.circuit?.id} lap:${game.lap} gi:${game.gateIndex} cg:${game.circuit?.gates?.length}`
      : '';
    fpsEl.textContent = `${Math.round(frames / fpsT)} fps · ${renderer.info.render.calls} draws · ${renderer.info.render.triangles.toLocaleString()} tris${dbg}`;
    frames = 0; fpsT = 0;
  }
  if (firstFrame) {
    firstFrame = false;
    document.getElementById('loading').classList.add('done');
  }
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.1);
  tick(dt, clock.elapsedTime);
}
loop();

// 自查/调试钩子：内嵌预览被节流时，可手动步进模拟与渲染
window.__tokyo = {
  step(dt = 1 / 30, n = 1) {
    for (let i = 0; i < n; i++) tick(dt, clock.elapsedTime + i * dt);
  },
  setDay(v) {
    rig.mode = v > 0.5 ? 'day' : 'night';
    rig.target = v;
    rig.factor = v;
    setModeUI(rig.mode);
  },
  fly(name) {
    const v = VIEWS['v-' + name] || VIEWS[name];
    if (v) flyTo(v, true);
  },
  view(p, t) {
    if (Array.isArray(p) && Array.isArray(t)) flyTo({ p, t }, true);
  },
  setPlay(m) { if (['orbit', 'walk', 'drive'].includes(m)) { play.setMode(m); setPlayUI(m); } },
  get mode() { return play.mode; },
  get cam() { return { p: camera.position.toArray(), t: controls.target.toArray() }; },
  get scene() { return scene; },
};

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  rig.resize(window.innerWidth, window.innerHeight);
});
