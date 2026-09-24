/**
 * 入口：three.js 渲染 + 固定步长游戏循环 + 键盘输入 + 追尾相机 + HUD。
 *
 * sim 层（src/sim/*）保持零 three、零 DOM；本文件是唯一的「胶水」，
 * 把 sim 的状态映射到可视对象。物理以 CONFIG.physics.fixedDt 固定步进，
 * 渲染叠加在其实时插值由相机 lerp 近似。
 */
import * as THREE from 'three';
import {
  createRace, stepRace, ensureRapier, playerOf, standings, forceReset, disposeRace,
  type RaceState,
} from './sim/race';
import type { DriveInput } from './sim/drive';
import { CONFIG } from './core/config';
import { TRACKS } from './sim/track';
import { buildTrackVisual, THEME } from './render/track';
import { CarView } from './render/car';
import { SkidMarks } from './render/skid';
import { Hud } from './ui/hud';
import { GameAudio } from './audio/engine';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// —— 渲染器 / 场景 / 相机 ——
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  CONFIG.camera.fovBase,
  window.innerWidth / window.innerHeight,
  0.1,
  3000,
);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.6, 0.4, 0.85,
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// —— 灯光 ——
const hemi = new THREE.HemisphereLight(0xfff4e0, 0x404050, 0.6);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff0d0, 1.8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 10;
sun.shadow.camera.far = 400;
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;
sun.shadow.bias = -0.0005;
scene.add(sun);
scene.add(sun.target);

// —— 渐变天空穹顶（替代纯色背景）——
const skyGeo = new THREE.SphereGeometry(2000, 32, 16);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  uniforms: {
    topColor: { value: new THREE.Color(0x4a6fa5) },
    bottomColor: { value: new THREE.Color(0xfdb99b) },
    offset: { value: 80 },
    exponent: { value: 0.5 },
  },
  vertexShader: /* glsl */`
    varying vec3 vWorldPos;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPos;
    void main() {
      float h = normalize(vWorldPos + vec3(0.0, offset, 0.0)).y;
      float t = max(pow(max(h, 0.0), exponent), 0.0);
      gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
    }
  `,
});
const skyDome = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyDome);

const hud = new Hud(document.body);
const audio = new GameAudio();

// —— 运行态 ——
let rs: RaceState | null = null;
let carViews: CarView[] = [];
let trackGroup: THREE.Group | null = null;
const skids = new SkidMarks();
scene.add(skids.object);
let currentTrack = TRACKS[0]!.id;

// —— 输入 ——
const keys = new Set<string>();
function readInput(): DriveInput {
  const up = keys.has('ArrowUp') || keys.has('KeyW');
  const down = keys.has('ArrowDown') || keys.has('KeyS');
  const left = keys.has('ArrowLeft') || keys.has('KeyA');
  const right = keys.has('ArrowRight') || keys.has('KeyD');
  const speedNow = rs ? playerOf(rs).vehicle.speed() : 0;
  return {
    throttle: up ? 1 : 0,
    brake: down ? 1 : 0,
    steer: (left ? 1 : 0) - (right ? 1 : 0),
    handbrake: keys.has('Space'),
    reverse: down && speedNow < 2,
  };
}

window.addEventListener('keydown', (e) => {
  audio.start();
  keys.add(e.code);
  if (e.code === 'KeyR' && rs) forceReset(rs, playerOf(rs));
  if (e.code === 'Enter' && rs?.phase === 'finished') void startRace(currentTrack);
  const m = /^Digit([1-5])$/.exec(e.code);
  if (m) {
    const idx = Number(m[1]) - 1;
    if (TRACKS[idx]) { currentTrack = TRACKS[idx]!.id; void startRace(currentTrack); }
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // 碰撞震动：随机偏移随时间衰减
  shake *= 0.9;
  if (shake > 0.01) {
    camera.position.x += (Math.random() - 0.5) * shake * 0.5;
    camera.position.y += (Math.random() - 0.5) * shake * 0.3;
  }
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

async function startRace(trackId: string): Promise<void> {
  if (rs) disposeRace(rs);
  for (const cv of carViews) scene.remove(cv.group);
  carViews = [];
  if (trackGroup) { scene.remove(trackGroup); trackGroup = null; }

  rs = null;
  const race = await createRace({ trackId, opponents: 1 });
  rs = race;

  skids.clear();
  trackGroup = buildTrackVisual(race.geo);
  scene.add(trackGroup);
  const theme = THEME[race.geo.def.theme]!;
  // 天空穹顶颜色按主题
  (skyMat.uniforms.topColor!.value as THREE.Color).set(theme.skyTop);
  (skyMat.uniforms.bottomColor!.value as THREE.Color).set(theme.skyBottom);
  scene.fog = new THREE.Fog(theme.fog, CONFIG.render.fogNear, CONFIG.render.fogFar);
  hemi.color.set(theme.hemiSky);
  hemi.groundColor.set(theme.hemiGround);
  hemi.intensity = theme.hemiIntensity;
  sun.color.set(theme.sunColor);
  sun.intensity = theme.sunIntensity;
  bloomPass.strength = theme.bloom ?? 0.6;

  for (const r of race.racers) {
    const cv = new CarView(r.color);
    carViews.push(cv);
    scene.add(cv.group);
  }
}

// —— 相机追尾 ——
const _fwd = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _camTarget = new THREE.Vector3();
const _look = new THREE.Vector3();
const _sunOffset = new THREE.Vector3(80, 160, 60);
function updateCamera(player: RaceState['racers'][number]): void {
  const p = player.vehicle.pos();
  const q = player.vehicle.quat();
  _q.set(q.x, q.y, q.z, q.w);
  _fwd.set(0, 0, 1).applyQuaternion(_q);
  const dist = CONFIG.camera.distance;
  _camTarget.set(p.x - _fwd.x * dist, p.y + CONFIG.camera.height, p.z - _fwd.z * dist);
  const k = 1 - Math.exp(-CONFIG.camera.lerpPos * (1 / 60));
  camera.position.lerp(_camTarget, k);
  _look.set(p.x + _fwd.x * 5, p.y + 1.2, p.z + _fwd.z * 5);
  camera.lookAt(_look);
  const sp = player.vehicle.speedKmh();
  const fov = CONFIG.camera.fovBase + Math.min(28, sp * CONFIG.camera.fovSpeedGain);
  camera.fov += (fov - camera.fov) * 0.08;
  camera.updateProjectionMatrix();

  // 碰撞震动：随机偏移随时间衰减
  shake *= 0.9;
  if (shake > 0.01) {
    camera.position.x += (Math.random() - 0.5) * shake * 0.5;
    camera.position.y += (Math.random() - 0.5) * shake * 0.3;
  }

  // 太阳光跟随玩家，阴影范围始终覆盖周围
  sun.position.set(p.x + _sunOffset.x, p.y + _sunOffset.y, p.z + _sunOffset.z);
  sun.target.position.set(p.x, p.y, p.z);
  sun.target.updateMatrixWorld();

  // 天空穹顶跟随相机，避免移到天边时出界
  skyDome.position.copy(camera.position);
}

// —— 主循环：固定步长步进 ——
let last = performance.now();
let lastSpd = 0;
let shake = 0;
let acc = 0;
function frame(now: number): void {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;

  if (rs) {
    acc += dt;
    const fixed = CONFIG.physics.fixedDt;
    let steps = 0;
    while (acc >= fixed && steps < CONFIG.physics.maxSubSteps) {
      stepRace(rs, readInput());
      acc -= fixed;
      steps++;
    }
    if (acc > fixed) acc = 0;

    const player = playerOf(rs);
    for (let i = 0; i < rs.racers.length; i++) carViews[i]?.update(rs.racers[i]!.vehicle);
    updateCamera(player);

    const st = standings(rs);
    const pos = st.findIndex((r) => r.isPlayer) + 1;
    hud.setSpeed(player.vehicle.speedKmh());
    hud.setLap(Math.min(player.lap + 1, rs.geo.def.laps), rs.geo.def.laps);
    hud.setPosition(pos, rs.racers.length);
    hud.setTime(rs.time);
    hud.setBest(player.bestLap);

    const spd = player.vehicle.speedKmh();
    const drifting = readInput().handbrake && spd > 40;
    audio.update(spd, readInput().throttle, readInput().handbrake);
    hud.setDrift(drifting);
    hud.setLastLap(player.lapTimes[player.lapTimes.length - 1] ?? null);

    // 漂移胎痕：手刹 + 速度 > 40km/h 时在四轮位置画黑痕
    if (drifting && rs.phase === 'racing') {
      const wheels = player.vehicle.wheels();
      const h = player.vehicle.heading();
      // 四个轮各贴一条（后两轮更密）
      for (const w of wheels) {
        if (w.grounded) skids.add(w.world.x, w.world.z, h);
      }
    }
    // 碰撞闷响：速度骤降 > 15 km/h
    const dSpd = lastSpd - spd;
    if (dSpd > 15) { audio.thump(Math.min(1, dSpd / 50)); shake = Math.min(1, dSpd / 40); }
    lastSpd = spd;

    if (rs.phase === 'countdown') hud.setMessage(Math.ceil(rs.countdown).toString(), '#fff');
    else if (rs.phase === 'racing') hud.setMessage(null);
    else hud.setMessage(`完赛！\n${st.map((r) => r.name).join('  >  ')}\n按 Enter 重开`, '#ffd54a');
  }
  composer.render();
}

// —— 调试快照（供 CDP 验证读取，不影响游戏逻辑）——
const errors: string[] = [];
window.addEventListener('error', (e) => errors.push(String(e.message)));
window.addEventListener('unhandledrejection', (e) => errors.push('reason: ' + String((e as PromiseRejectionEvent).reason)));

declare global {
  interface Window { __apex?: unknown }
}

window.__apex = {
  get stats() {
    if (!rs) return { ready: false as const };
    const p = playerOf(rs);
    const pos = p.vehicle.pos();
    return {
      ready: true as const,
      phase: rs.phase,
      time: rs.time,
      lap: p.lap,
      speed: p.vehicle.speed(),
      heading: p.vehicle.heading(),
      pos: { x: pos.x, y: pos.y, z: pos.z },
      racers: rs.racers.length,
      errors,
    };
  },
  get debug() {
    const cv = carViews[0];
    return {
      camPos: camera.position.toArray(),
      camFov: camera.fov,
      carGroupPos: cv ? cv.group.position.toArray() : null,
      carGroupVisible: cv ? cv.group.visible : null,
      sceneChildren: scene.children.length,
    };
  },
};

void ensureRapier().then(() => {
  void startRace(currentTrack);
  requestAnimationFrame(frame);
});
