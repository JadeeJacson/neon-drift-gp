// main.js — 启动、主循环、HUD 接线
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DayNightRig } from './env.js';
import { buildLayout } from './layout.js';
import { buildGround } from './ground.js';
import { buildBuildings } from './buildings.js';
import { buildHouses } from './houses.js';
import { buildMountains } from './terrain.js';
import { buildBay } from './bay.js';
import { buildLandmarks } from './landmarks.js';
import { decorateBuildings, tickScreens } from './signs.js';
import { Traffic } from './traffic.js';

const app = document.getElementById('app');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 16000);
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
buildGround(scene, layout);
const buildings = buildBuildings(scene, layout);
decorateBuildings(scene, buildings, 777);
buildHouses(scene, layout);
buildMountains(scene);
const bay = buildBay(scene, layout);
buildLandmarks(scene);
const traffic = new Traffic(scene, layout);

const rig = new DayNightRig(scene, camera, renderer);
rig.setMode('night'); // 首屏：夜晚霓虹

// ---- 视角预设 ----
const VIEWS = {
  'v-shibuya': { p: [-8, 5.5, 130], t: [0, 15, -10] },
  'v-aerial': { p: [-620, 420, -660], t: [80, 0, 220] },
  'v-bay': { p: [1210, 170, 880], t: [2500, 20, 260] },
  'v-mtn': { p: [-1450, 150, 820], t: [-2950, 260, -420] },
  'v-tower': { p: [-230, 120, 150], t: [-480, 160, 620] },
  'v-skytree': { p: [430, 120, 360], t: [1000, 300, -180] },
};
function flyTo(v, instant = false) {
  if (instant) {
    camera.position.set(...v.p);
    controls.target.set(...v.t);
    return;
  }
  const p0 = camera.position.clone(), t0 = controls.target.clone();
  const p1 = new THREE.Vector3(...v.p), t1 = new THREE.Vector3(...v.t);
  const start = performance.now(), dur = 1400;
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
  document.getElementById(id).onclick = () => flyTo(v);
}
window.addEventListener('keydown', (ev) => {
  if (ev.code === 'KeyN') {
    const mode = rig.toggle();
    setModeUI(mode);
  }
});

// ---- 主循环 ----
const clock = new THREE.Clock();
const fpsEl = document.getElementById('fps');
let frames = 0, fpsT = 0, screenT = 0;
let firstFrame = true;

function tick(dt, elapsed) {
  rig.update(dt, elapsed);
  traffic.update(dt);
  if (bay.wheel) bay.wheel.rotation.z += dt * 0.12;
  screenT += dt;
  if (screenT > 6) {
    screenT = 0;
    tickScreens();
  }
  controls.update();
  rig.render();

  frames++; fpsT += dt;
  if (fpsT >= 0.5) {
    fpsEl.textContent = `${Math.round(frames / fpsT)} fps · ${renderer.info.render.calls} draws · ${renderer.info.render.triangles.toLocaleString()} tris`;
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
  get cam() { return { p: camera.position.toArray(), t: controls.target.toArray() }; },
  get scene() { return scene; },
};

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  rig.resize(window.innerWidth, window.innerHeight);
});
