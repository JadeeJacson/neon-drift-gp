// main.js — 启动、画质、主循环，以及 HUD / 面板 / 触屏 / 存档之间的接线。
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
import { Hud, fmtTime } from './hud.js';
import { buildProps } from './props.js';
import { loadFoliage } from './foliage.js';
import { AudioEngine } from './audio.js';
import { loadEnvironment } from './envmap.js';
import { CAR_TUNE } from './car.js';
import { Progress, tunedCar, medalTargets } from './progress.js';
import { TouchControls, isTouchDevice } from './touch.js';
import { UI } from './ui.js';

const app = document.getElementById('app');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const params = new URLSearchParams(location.search);
const DEBUG = params.has('debug');

// ---- 存档 / 设置 ----
const progress = new Progress();
const settings = progress.settings;
const touchCapable = isTouchDevice();
const touchWanted = () => settings.touch === 'on' || (settings.touch === 'auto' && touchCapable);

// ---- 画质预设 ----
// low：手机 / 核显保底（无阴影、无辉光、1x 像素）；high：桌面独显。
// auto：触屏设备从 low 起步、桌面从 high 起步，运行中帧率持续偏低会自动往下降一档。
const QUALITY = {
  low: { label: '流畅', dpr: 1, shadow: 0, extent: 0, bloom: false },
  medium: { label: '均衡', dpr: 1.5, shadow: 1024, extent: 420, bloom: true },
  high: { label: '高清', dpr: 2, shadow: 2048, extent: 700, bloom: true },
};
const ORDER = ['low', 'medium', 'high'];
const urlQuality = QUALITY[params.get('quality')] ? params.get('quality') : null;
const pickQuality = () => urlQuality || (settings.quality !== 'auto' ? settings.quality : touchCapable ? 'low' : 'high');
let quality = pickQuality();

const renderer = new THREE.WebGLRenderer({
  antialias: quality !== 'low', // MSAA 只能在建上下文时决定；low 起步就省掉
  powerPreference: 'high-performance',
  logarithmicDepthBuffer: true, // 大场景（near 1 / far 16000）防远处 z-fighting 闪烁
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, QUALITY[quality].dpr));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
// EffectComposer 每个 pass 都会重置 renderer.info；关掉自动重置、每帧手动清一次
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
controls.autoRotateSpeed = 0.35;
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
audio.setVolume(settings.volume);
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

// ---- 玩法系统 ----
const game = new Game({ scene, layout, car: play.car, progress });
const hud = new Hud({ layout });
const touch = new TouchControls();
play.touch = touch;
play.traffic = traffic;

// ---- 画质切换 ----
let shadowsOn = true;
function applyQuality(q) {
  quality = q;
  const Q = QUALITY[q];
  const pr = Math.min(window.devicePixelRatio, Q.dpr);
  renderer.setPixelRatio(pr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  rig.composer?.setPixelRatio?.(pr);
  rig.resize(window.innerWidth, window.innerHeight);
  rig.setShadows(Q.shadow, Q.extent);
  rig.setBloom(Q.bloom);
  // 阴影开关会改变着色器变体，需要让材质重新编译一次
  if (shadowsOn !== Q.shadow > 0) {
    shadowsOn = Q.shadow > 0;
    scene.traverse((o) => {
      const m = o.material;
      if (Array.isArray(m)) m.forEach((x) => { x.needsUpdate = true; }); else if (m) m.needsUpdate = true;
    });
  }
}
applyQuality(quality);

// ---- 车库：涂装 + 改装 ----
function applyCar() {
  play.car.setPaint(progress.paintColor);
  play.car.setTune(tunedCar(CAR_TUNE, progress.data.upgrades));
}
applyCar();

const fpsEl = document.getElementById('fps');
function applySettings() {
  audio.setVolume(settings.volume);
  play.shakeEnabled = settings.shake;
  fpsEl.hidden = !(settings.showFps || DEBUG);
  touch.setEnabled(touchWanted());
  const q = pickQuality();
  if (q !== quality && (urlQuality || settings.quality !== 'auto')) applyQuality(q);
  setPlayUI(play.mode);
}

// ---- HUD 按钮 ----
const hudEl = document.getElementById('hud');
document.getElementById('menu-toggle').onclick = () => hudEl.classList.toggle('expanded');
hudEl.querySelector('.row').addEventListener('click', (e) => {
  if (e.target.closest('button')) hudEl.classList.remove('expanded');
});

const modeBtns = { day: document.getElementById('btn-day'), night: document.getElementById('btn-night'), auto: document.getElementById('btn-auto') };
function setModeUI(mode) {
  for (const [k, e] of Object.entries(modeBtns)) e.classList.toggle('on', k === mode);
}
setModeUI('night');
modeBtns.day.onclick = () => { rig.setMode('day'); setModeUI('day'); };
modeBtns.night.onclick = () => { rig.setMode('night'); setModeUI('night'); };
modeBtns.auto.onclick = () => { rig.setMode('auto'); setModeUI('auto'); };
for (const [id, v] of Object.entries(VIEWS)) {
  document.getElementById(id).onclick = (ev) => {
    if (play.mode !== 'orbit') setPlay('orbit');
    flyTo(v, false, !ev.shiftKey); // 默认原地转视角；Shift = 飞到预设机位
  };
}

const playBtns = { orbit: document.getElementById('m-orbit'), walk: document.getElementById('m-walk'), drive: document.getElementById('m-drive') };
const HINTS = {
  orbit: '拖拽旋转 · 滚轮缩放 · WASD 平移 · Q/E 升降 · N 昼夜 · V 切模式 · Esc 菜单',
  walk: 'WASD 移动 · Shift 疾跑 · 空格跳跃 · 点击画面锁定鼠标 · V 切换 · Esc 暂停',
  drive: 'W 油门 · S 刹车/倒车 · A/D 转向 · 空格漂移 · C 视角 · R 复位 · Esc 暂停',
};
const hintEl = document.getElementById('hint');
function setPlayUI(mode) {
  for (const [k, e] of Object.entries(playBtns)) e.classList.toggle('on', k === mode);
  hintEl.textContent = HINTS[mode];
  touch.setMode(mode);
  document.body.classList.toggle('playing', mode !== 'orbit');
}
play.onHint = (mode) => setPlayUI(mode);

/** 切换观景/散步/驾驶。离开驾驶 = 放弃进行中的玩法 */
function setPlay(mode) {
  if (mode !== 'drive' && game.phase !== 'menu') game.abort();
  play.setMode(mode);
  setPlayUI(mode);
  if (mode === 'drive' && !progress.data.seenHelp) {
    progress.data.seenHelp = true;
    progress.save();
    hud.toast(touch.enabled ? '左摇杆转向 · 右侧油门/刹车/漂移' : 'W/S 油门刹车 · A/D 转向 · 空格漂移 · R 复位', 'good');
  }
}
playBtns.orbit.onclick = () => setPlay('orbit');
playBtns.walk.onclick = () => setPlay('walk');
playBtns.drive.onclick = () => setPlay('drive');

// ---- 面板 ----
const ensureDrive = () => { if (play.mode !== 'drive') setPlay('drive'); };
const ui = new UI({
  progress, game, isTouch: touchCapable || settings.touch === 'on',
  actions: {
    click: () => audio.sfx('click'),
    sfx: (n) => audio.sfx(n),
    startCircuit: (id) => { ensureDrive(); game.startCircuit(id); },
    startRally: () => { ensureDrive(); game.startRally(); },
    startJob: (opts) => { ensureDrive(); game.startJob(opts); },
    restart: () => { ensureDrive(); if (game.mode) game.restart(); },
    freeDrive: () => { if (game.phase !== 'menu') game.abort(); ensureDrive(); },
    setPlay: (m) => setPlay(m),
    resume: () => {},
    quitToMenu: () => { game.abort(); ui.show('play', null, { root: true }); },
    toTitle: () => { setPlay('orbit'); ui.show('title', null, { root: true }); },
    applyCar, applySettings,
    qualityLabel: () => QUALITY[quality].label,
  },
});
ui.onOpenChange = (open) => {
  touch.setSuppressed(open);
  document.body.classList.toggle('in-title', ui.top === 'title');
  if (open && document.pointerLockElement) document.exitPointerLock();
  if (open) play.keys.clear();
};
const openPause = () => { if (!ui.open) ui.show('pause'); };
document.getElementById('m-play').onclick = () => ui.show('play');
document.getElementById('m-garage').onclick = () => ui.show('garage');
document.getElementById('pause-btn').onclick = () => (ui.open ? ui.back() : openPause());

// ---- 钱包 ----
const moneyEl = document.getElementById('money');
let shownMoney = progress.money;
hud.setMoney(shownMoney);
progress.onChange = (d) => {
  if (d.money > shownMoney) { moneyEl.classList.remove('bump'); void moneyEl.offsetWidth; moneyEl.classList.add('bump'); }
  shownMoney = d.money;
  hud.setMoney(d.money);
};

// ---- 复位（卡墙 / 翻进角落时）----
function respawnCar() {
  if (play.mode !== 'drive' || game.locked) return;
  play.respawn(game.respawnPoint());
  hud.toast('已复位');
}

touch.onAction = (act) => {
  if (act === 'camera') play.toggleCamera();
  else if (act === 'reset') respawnCar();
  else if (act === 'pause') openPause();
};

// ---- 玩法事件 → 音效 / 提示 / 结算 ----
game.onEvent = (ev) => {
  switch (ev.type) {
    case 'tick': audio.sfx('tick'); break;
    case 'go': audio.sfx('go'); break;
    case 'gate': audio.sfx('gate'); break;
    case 'lap':
      audio.sfx('lap');
      hud.toast(`第 ${ev.lap} 圈 ${fmtTime(ev.lapTime)}${ev.bestLap ? ' · 最佳单圈！' : ''}`, ev.bestLap ? 'gold' : 'good');
      break;
    case 'stage': audio.sfx('checkpoint'); hud.toast(`已取货 → 送往 ${ev.job.to}`, 'good'); break;
    case 'checkpoint': audio.sfx('checkpoint'); hud.toast(`📍 ${ev.name} 打卡 ${ev.index}/${ev.total}`, 'good'); break;
    case 'finish': {
      const r = ev.result;
      const ok = r.type !== 'job' || r.success;
      audio.sfx(ok ? 'finish' : 'fail');
      if (r.payout > 0) setTimeout(() => audio.sfx('coin'), 450);
      ui.show('result', r, { root: true });
      break;
    }
    case 'menu': hud.setObjective('', '', null); break;
    default: break;
  }
};

let lastCrashToast = 0, lastHonk = 0;
play.onCrash = (impact) => {
  game.registerCrash();
  audio.impact(impact);
  const now = performance.now();
  if (game.phase === 'running' && impact > 6 && now - lastCrashToast > 1500) {
    lastCrashToast = now;
    if (game.mode === 'job' && game.jobStage === 'dropoff') hud.toast('货物受损！', 'bad');
    else if (game.hud.drift === 0) hud.toast('碰撞 · 漂移分清零', 'bad');
  }
};
play.onTrafficHit = () => {
  const now = performance.now();
  if (now - lastHonk > 1200) { lastHonk = now; audio.sfx('honk'); }
};

// ---- 键盘 ----
window.addEventListener('keydown', (ev) => {
  if (ev.repeat) return;
  const code = ev.code;
  if (code === 'Escape' || code === 'KeyP') {
    if (!ui.open) { openPause(); return; }
    if (ui.top === 'result') { ui.close(); if (code === 'Escape') ui.actions.freeDrive(); return; }
    if (ui.top !== 'title') ui.back();
    return;
  }
  if (ui.open) {
    if (code === 'KeyR' && ui.top === 'result') { ui.close(); ui.actions.restart(); }
    return;
  }
  if (code === 'KeyN') setModeUI(rig.toggle());
  if (code === 'KeyV') setPlay(play.mode === 'orbit' ? 'walk' : play.mode === 'walk' ? 'drive' : 'orbit');
  if (code === 'KeyC' && play.mode === 'drive') play.toggleCamera();
  if (code === 'KeyR' && play.mode === 'drive') respawnCar();
});

// 切到后台自动暂停（手机来电 / 切 App 时不该继续计时撞车）
document.addEventListener('visibilitychange', () => {
  if (document.hidden && play.mode !== 'orbit') openPause();
  audio.setPaused(document.hidden);
});

// ---- 异步素材：失败都只降级，不拖垮场景 ----
loadEnvironment(scene).catch((e) => console.warn('[env] HDRI 加载失败，降级为无环境反射：', e.message));
applyRoadTexture(ground.roadMat).catch((e) => console.warn('[road] 路面贴图加载失败，改用程序化噪声：', e.message));
loadFoliage(scene, layout, { houseRects: houseResult.rects })
  .then((r) => {
    if (r.failed.length) console.warn(`[foliage] ${r.failed.length} 个模型加载失败：`, r.failed.map((f) => `${f.file}(${f.error})`).join(', '));
    if (!shadowsOn) scene.traverse((o) => { if (o.material && !Array.isArray(o.material)) o.material.needsUpdate = true; });
  })
  .catch((e) => console.warn('[foliage] 植被加载失败：', e.message));

// ---- 自动画质：持续低帧率就降一档 ----
const autoQ = { t: 0, frames: 0, warm: 6 };
function autoQuality(dt) {
  if (urlQuality || settings.quality !== 'auto' || quality === 'low' || document.hidden) return;
  if (autoQ.warm > 0) { autoQ.warm -= dt; return; }
  autoQ.t += dt; autoQ.frames++;
  if (autoQ.t < 4) return;
  const fps = autoQ.frames / autoQ.t;
  autoQ.t = 0; autoQ.frames = 0;
  if (fps < 32) {
    const q = ORDER[ORDER.indexOf(quality) - 1];
    applyQuality(q);
    autoQ.warm = 3;
    hud.toast(`帧率偏低，画质已调整为「${QUALITY[q].label}」`);
  }
}

// ---- 主循环 ----
const clock = new THREE.Clock();
let frames = 0, fpsT = 0, screenT = 0, statT = 0, lastOdo = 0;
let firstFrame = true;

function objectiveHud() {
  const gh = game.hud;
  if (!(gh.phase === 'running' || gh.phase === 'countdown')) { hud.setObjective('', '', null); return; }
  if (gh.mode === 'circuit') {
    const c = game.circuit;
    const gold = gh.circuits.find((x) => x.id === c.id)?.targets[0];
    hud.setObjective(gh.title, gh.sub, gh.time, false, `本圈 ${fmtTime(gh.lapTime)} · 🥇 ${fmtTime(gold?.time)}`);
  } else if (gh.mode === 'job') {
    hud.setObjective(gh.title, gh.sub, gh.left, gh.left != null && gh.left < 12, `酬金 ¥${gh.job.pay.toLocaleString()}`);
  } else if (gh.mode === 'rally') {
    hud.setObjective(gh.title, gh.sub, gh.time, false, `🥇 ${fmtTime(gh.rally.targets[0].time)}`);
  }
}

function tick(dt, elapsed, draw = true) {
  renderer.info.reset();
  const paused = ui.open && play.mode !== 'orbit';
  rig.update(dt, elapsed);
  if (bay.wheel) bay.wheel.rotation.z += dt * 0.12;
  screenT += dt;
  if (screenT > 6) { screenT = 0; tickScreens(); }

  if (!paused) {
    traffic.update(dt, play.mode === 'drive' ? play.car : null);
    play.locked = game.locked;
    if (!ui.open) play.update(dt); // 观景模式的 WASD 平移要先落地，再交给 OrbitControls
    game.update(dt);
  }
  controls.autoRotate = ui.top === 'title' && play.mode === 'orbit';
  if (play.mode === 'orbit') controls.update();

  // 阴影跟着关注点走（车 / 行人 / 观景中心）
  const f = play.mode === 'drive' ? play.car.pos : play.mode === 'walk' ? play.pos : controls.target;
  rig.setFocus(f.x, f.z);

  // ---- HUD ----
  const driving = play.mode === 'drive';
  hud.setDriving(driving);
  const car = play.car;
  if (driving) {
    hud.speedNum.textContent = Math.round(car.kph);
    const d = game.hud.drift;
    hud.driftRead.textContent = '漂移 ' + d.toLocaleString();
    hud.driftRead.style.opacity = d > 40 ? '1' : '0';
    hud.drawMinimap(car, game, traffic);
    hud.updateNav(game.navTarget, car, play.camMode === 1 ? car.yaw : play.camYaw);
    objectiveHud();
    audio.update(paused ? 0 : clamp(car.kph / 260, 0, 1), paused ? 0 : car.throttle, paused ? 0 : car.drift, !paused);
  } else {
    audio.update(0, 0, 0, false);
  }
  const gh = game.hud;
  hud.setCountdown(gh.phase === 'countdown' && !paused ? gh.countdown : null);

  if (draw) rig.render();

  // ---- 统计（行驶里程 / 游玩时间），每 10s 存一次 ----
  if (!paused && play.mode !== 'orbit') progress.data.stats.playTime += dt;
  statT += dt;
  if (statT > 10) {
    statT = 0;
    progress.data.stats.distance += play.odometer - lastOdo;
    lastOdo = play.odometer;
    progress.save();
  }

  autoQuality(dt);
  frames++; fpsT += dt;
  if (fpsT >= 0.5) {
    if (!fpsEl.hidden) {
      const dbg = DEBUG ? ` | ${quality} g:${gh.phase}/${gh.mode} lap:${game.lap} gi:${game.gateIndex}` : '';
      fpsEl.textContent = `${Math.round(frames / fpsT)} fps · ${renderer.info.render.calls} draws · ${renderer.info.render.triangles.toLocaleString()} tris${dbg}`;
    }
    frames = 0; fpsT = 0;
  }
  if (firstFrame) {
    firstFrame = false;
    document.getElementById('loading').classList.add('done');
  }
}

applySettings();
setPlayUI('orbit');
ui.show('title', null, { root: true });

function loop() {
  requestAnimationFrame(loop);
  if (window.__tokyo?.frozen) { clock.getDelta(); return; } // 测试用：冻结自动循环，只靠 step() 推进
  const dt = Math.min(clock.getDelta(), 0.1);
  tick(dt, clock.elapsedTime);
}
loop();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  rig.resize(window.innerWidth, window.innerHeight);
});
window.addEventListener('pagehide', () => {
  progress.data.stats.distance += play.odometer - lastOdo;
  lastOdo = play.odometer;
  progress.save();
});

// 自查/调试钩子：内嵌预览被节流时，可手动步进模拟与渲染
window.__tokyo = {
  // 只渲染最后一帧：软件渲染下逐帧绘制太慢
  step(dt = 1 / 30, n = 1) {
    for (let i = 0; i < n; i++) tick(dt, clock.elapsedTime + i * dt, i === n - 1);
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
  setPlay(m) { if (['orbit', 'walk', 'drive'].includes(m)) setPlay(m); },
  startCircuit(id) { ui.close(); ui.actions.startCircuit(id); },
  startJob() { ui.close(); ui.actions.startJob({}); },
  startRally() { ui.close(); ui.actions.startRally(); },
  setQuality(q) { if (QUALITY[q]) applyQuality(q); },
  get quality() { return quality; },
  get mode() { return play.mode; },
  get cam() { return { p: camera.position.toArray(), t: controls.target.toArray() }; },
  scene, game, play, ui, progress, hud, medalTargets,
};
