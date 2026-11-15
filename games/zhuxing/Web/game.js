"use strict";
// Coordinates are meters, time is seconds. Celestial data comes from system.js and is exported to system.json.
const CONFIG = {
  planets: SYSTEM.bodies,
  player: { height: 1.75, walk: 5, sprint: 8, jump: 5.5, jet: 12 },
  ship: { thrust: 18, lateral: 12, lift: 20, brake: 6, clearance: 2.6 },
  physics: { hz: 120 },
  version: "0.8",
};
const $ = (id) => document.getElementById(id),
  V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z),
  UP = V(0, 1, 0),
  ZERO = V(),
  clamp = THREE.MathUtils.clamp;
let renderer,
  scene,
  camera,
  planets = [],
  ship,
  player,
  shipGroup,
  stars,
  started = false,
  paused = false,
  modal = null,
  driving = false,
  third = false,
  targetIndex = 1,
  elapsed = 0,
  keys = {},
  drag = false,
  locked = false,
  toastUntil = 0,
  stepJump = false,
  last = performance.now(),
  accumulator = 0,
  mouseYaw = 0,
  mousePitch = 0,
  autoPause = true;
let skyMesh,
  sunMesh,
  visited = new Set([0]),
  footGrounded = true,
  crashTimer = 0;
const scratch = {};
const obstacles = [];
const solidBoxes = [];
const settings = {
  fov: 76,
  sensitivity: 1,
  quality: 1.25,
  volume: 0.22,
  align: true,
  cockpit: true,
};
const SAVE_KEY = "zhuxing-sandbox-v6",
  SET_KEY = "zhuxing-settings-v3";
let sites = [],
  discovered = new Set(),
  navSite = null,
  flashlight = false,
  flash,
  flashTarget,
  saveStatus = "尚未保存",
  saveTimer = 0,
  stepSound = 0,
  audio = null,
  resumeData = null,
  saveFailed = false;
function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const rand = seeded(9417);
function mat(c, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color: c,
    roughness: 0.9,
    flatShading: true,
    ...extra,
  });
}
function mesh(g, m, parent = scene) {
  let o = new THREE.Mesh(g, m);
  parent.add(o);
  return o;
}
function legacyTerrain(p, n) {
  let f = 1 - Math.exp(-((1 - n.y) * 90));
  let h =
    (Math.sin(n.x * 12 + n.z * 3) * Math.cos(n.z * 11 - n.y * 4) * 0.47 +
      Math.sin(n.y * 21 + n.x * 8) * 0.23 +
      Math.cos(n.z * 29 + n.x * 15) * 0.13) *
    p.amp;
  return h * f;
}
function radius(p, n) {
  return p.r + terrain(p, n);
}
function nearest(pos) {
  let best = planets[0],
    d = Infinity;
  for (const p of planets) {
    const gap = pos.distanceTo(p.pos) - p.r;
    if (gap < d) {
      d = gap;
      best = p;
    }
  }
  return best;
}
function altitude(pos, p) {
  let d = pos.clone().sub(p.pos);
  return d.length() - radius(p, d.clone().normalize());
}
function legacyGravity(pos) {
  let out = V();
  for (const p of planets) {
    let d = p.pos.clone().sub(pos),
      r2 = d.lengthSq();
    out.addScaledVector(d.normalize(), p.mu / Math.max(r2, p.r * p.r * 0.9));
  }
  return out;
}
function frameQ(up, forward = V(0, 0, -1)) {
  let right = forward.clone().cross(up);
  if (right.lengthSq() < 0.001) right = V(1, 0, 0).cross(up);
  right.normalize();
  let back = right.clone().cross(up).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(right, up, back),
  );
}
function surfacePoint(p, dir, extra = 0) {
  return p.pos.clone().addScaledVector(dir, radius(p, dir) + extra);
}
function placeSurface(group, p, dir, offset = 0) {
  group.position.copy(surfacePoint(p, dir, offset));
  group.quaternion.setFromUnitVectors(UP, dir);
  return group;
}
function reserve(n, index) {
  return (
    (index === 0 && n.dot(V(-0.14, 1, -0.28).normalize()) > 0.987) ||
    (index === 2 && n.dot(V(-0.24, 1, -0.16).normalize()) > 0.98)
  );
}
function legacyAddNature(p, index) {
  const count = index === 0 ? 190 : index === 1 ? 80 : 100;
  const rockGeo = new THREE.IcosahedronGeometry(1, 0),
    rockMat = mat(index === 0 ? 0x9b9e86 : index === 1 ? 0x647c8b : 0x9d6349);
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, count);
  scene.add(rocks);
  let dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const n = V(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
    if ((index === 0 && n.y > 0.965) || reserve(n, index)) {
      i--;
      continue;
    }
    let size = 1 + rand() * (index === 2 ? 7 : 3);
    dummy.position.copy(surfacePoint(p, n, size * 0.32));
    dummy.quaternion.setFromUnitVectors(UP, n);
    dummy.rotateY(rand() * 6.28);
    dummy.scale.set(size, size * (0.6 + rand() * 0.6), size);
    dummy.updateMatrix();
    rocks.setMatrixAt(i, dummy.matrix);
    obstacles.push({ pos: dummy.position.clone(), r: size * 0.73, p });
  }
  rocks.instanceMatrix.needsUpdate = true;
  if (index === 0) {
    let trunks = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.35, 0.6, 5, 5),
      mat(0x6c5741),
      170,
    );
    let leaves = new THREE.InstancedMesh(
      new THREE.ConeGeometry(3.4, 10, 5),
      mat(0x284f45),
      170,
    );
    scene.add(trunks, leaves);
    for (let i = 0; i < 170; i++) {
      let n = V(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
      if (n.y > 0.98 || reserve(n, index)) {
        i--;
        continue;
      }
      const scale = 0.7 + rand() * 0.9;
      dummy.quaternion.setFromUnitVectors(UP, n);
      dummy.scale.setScalar(scale);
      dummy.position.copy(surfacePoint(p, n, 2.5 * scale));
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      obstacles.push({
        pos: surfacePoint(p, n, 1.6 * scale),
        r: 0.6 * scale,
        p,
      });
      dummy.position.copy(surfacePoint(p, n, 8 * scale));
      dummy.updateMatrix();
      leaves.setMatrixAt(i, dummy.matrix);
    }
  }
  if (index === 1) {
    for (let i = 0; i < 16; i++) {
      let n = V(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
      let ring = mesh(
        new THREE.TorusGeometry(5 + rand() * 8, 0.55, 4, 20),
        mat(0x566d7b),
      );
      ring.position.copy(surfacePoint(p, n, 0.2));
      ring.quaternion.setFromUnitVectors(V(0, 0, 1), n);
    }
  }
  if (index === 2) {
    for (let i = 0; i < 20; i++) {
      let n = V(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
      let h = 8 + rand() * 16;
      let pillar = mesh(
        new THREE.CylinderGeometry(1.7, 3, h, 5),
        mat(0x764b44),
      );
      pillar.position.copy(surfacePoint(p, n, h / 2 - 0.5));
      pillar.quaternion.setFromUnitVectors(UP, n);
      obstacles.push({ pos: surfacePoint(p, n, 2), r: 2.5, p });
    }
  }
}
function makeBeacon(p, n, title) {
  let g = new THREE.Group();
  scene.add(g);
  placeSurface(g, p, n);
  let steel = mat(0x31424a),
    glow = mat(0xb4e0bc, { emissive: 0x74b895, emissiveIntensity: 0.9 });
  const base = mesh(new THREE.CylinderGeometry(3, 3.5, 0.5, 12), steel, g);
  base.position.y = 0.25;
  solidBoxes.push({ mesh: base, half: V(3.2, 0.25, 3.2) });
  const mast = mesh(new THREE.CylinderGeometry(0.22, 0.35, 9, 6), steel, g);
  mast.position.y = 4.5;
  solidBoxes.push({ mesh: mast, half: V(0.35, 4.5, 0.35) });
  mesh(new THREE.IcosahedronGeometry(1, 1), glow, g).position.y = 9;
  let ring = mesh(new THREE.TorusGeometry(2.2, 0.08, 4, 24), glow, g);
  ring.position.y = 8;
  ring.rotation.x = Math.PI / 2;
  p.beacon = g;
}
function makeCamp() {
  let p = planets[0],
    g = new THREE.Group();
  scene.add(g);
  let n = V(-0.1, 1, -0.12).normalize();
  placeSurface(g, p, n);
  let wood = mat(0x8e7454),
    ivory = mat(0xe0d6b2),
    roof = mat(0x416e6b);
  mesh(new THREE.CylinderGeometry(6.5, 6.5, 0.6, 8), wood, g).position.y = 0.3;
  mesh(new THREE.CylinderGeometry(4.4, 4.4, 5, 6), ivory, g).position.y = 2.9;
  mesh(new THREE.ConeGeometry(6, 3, 6), roof, g).position.y = 6.9;
  for (let i = 0; i < 6; i++) {
    let a = (i / 6) * Math.PI * 2;
    let window = mesh(
      new THREE.BoxGeometry(1.5, 1.6, 0.12),
      mat(0x83b3b0, { emissive: 0x34595d, emissiveIntensity: 0.4 }),
      g,
    );
    window.position.set(Math.sin(a) * 3.85, 3, Math.cos(a) * 3.85);
    window.rotation.y = a;
  }
  obstacles.push({ pos: g.position.clone().addScaledVector(n, 2), r: 4.6, p });
  makeBeacon(p, V(0.09, 1, -0.15).normalize(), "营地信标");
  const pad = new THREE.Group();
  scene.add(pad);
  placeSurface(pad, p, V(12, p.r, -16).normalize(), 0.08);
  let disc = mesh(
    new THREE.CylinderGeometry(7, 7, 0.12, 32),
    mat(0x34494a),
    pad,
  );
  disc.position.y = 0.06;
  let ring = mesh(
    new THREE.TorusGeometry(6.2, 0.12, 4, 40),
    mat(0xd9bb74, { emissive: 0x59461c, emissiveIntensity: 0.3 }),
    pad,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.15;
  for (let i = 0; i < 8; i++) {
    let l = mesh(new THREE.BoxGeometry(0.4, 0.1, 0.9), mat(0xd8d9af), pad);
    l.position.set(
      Math.sin((i * Math.PI) / 4) * 5,
      0.2,
      Math.cos((i * Math.PI) / 4) * 5,
    );
    l.rotation.y = (i * Math.PI) / 4;
  }
}
function makeShip() {
  shipGroup = new THREE.Group();
  scene.add(shipGroup);
  let cream = mat(0xd3cdab),
    yellow = mat(0xcda45a),
    dark = mat(0x263e48),
    glass = mat(0x3c7787, { metalness: 0.4, roughness: 0.24 }),
    metal = mat(0x56666b);
  mesh(new THREE.SphereGeometry(2.25, 12, 8), cream, shipGroup).scale.set(
    1,
    1,
    0.95,
  );
  let nose = mesh(new THREE.SphereGeometry(1.72, 12, 8), glass, shipGroup);
  nose.position.set(0, 0.45, -1.2);
  nose.scale.set(1, 0.85, 0.8);
  let band = mesh(
    new THREE.TorusGeometry(2.14, 0.16, 5, 12),
    yellow,
    shipGroup,
  );
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.1;
  for (let side of [-1, 1]) {
    let tank = mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 3.5, 8),
      yellow,
      shipGroup,
    );
    tank.position.set(side * 2.65, -0.2, 0.3);
    tank.rotation.x = Math.PI / 2;
    let cap = mesh(new THREE.SphereGeometry(0.72, 8, 6), cream, shipGroup);
    cap.position.set(side * 2.65, -0.2, -1.45);
    let wing = mesh(new THREE.BoxGeometry(2, 0.2, 1.1), metal, shipGroup);
    wing.position.set(side * 2, -0.6, 0.5);
    let nozzle = mesh(
      new THREE.CylinderGeometry(0.6, 0.46, 0.6, 8),
      dark,
      shipGroup,
    );
    nozzle.position.set(side * 2.65, -0.2, 2.2);
    nozzle.rotation.x = Math.PI / 2;
  }
  for (let x of [-1, 1])
    for (let z of [-1, 1]) {
      let leg = mesh(
        new THREE.CylinderGeometry(0.1, 0.14, 1.9, 5),
        metal,
        shipGroup,
      );
      leg.position.set(x * 1.75, -1.8, z * 1.55);
      leg.rotation.z = x * 0.22;
      let foot = mesh(
        new THREE.CylinderGeometry(0.5, 0.55, 0.14, 6),
        dark,
        shipGroup,
      );
      foot.position.set(x * 1.95, -2.6, z * 1.55);
    }
  let dish = mesh(new THREE.ConeGeometry(0.7, 0.5, 8), cream, shipGroup);
  dish.rotation.x = -0.5;
  dish.position.set(0.8, 2.5, 0.6);
  let mast = mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1, 4),
    metal,
    shipGroup,
  );
  mast.position.set(0.8, 2, 0.6);
  let engine = mesh(
    new THREE.ConeGeometry(0.75, 2.5, 8),
    new THREE.MeshBasicMaterial({
      color: 0xb9e9d1,
      transparent: true,
      opacity: 0.65,
    }),
    shipGroup,
  );
  engine.rotation.x = -Math.PI / 2;
  engine.position.set(0, 0, 3.5);
  engine.visible = false;
  shipGroup.userData.flame = engine;
  ship = { pos: V(), vel: V(), q: new THREE.Quaternion(), grounded: true };
}
function initCore() {
  if (!window.THREE)
    throw Error("运行库未载入。请下载完整 ZIP，或使用单文件版本。");
  renderer = new THREE.WebGLRenderer({
    canvas: $("game"),
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040d19);
  camera = new THREE.PerspectiveCamera(
    76,
    innerWidth / innerHeight,
    0.08,
    80000,
  );
  scene.add(new THREE.AmbientLight(0xc7dfef, 2.0));
  let sun = new THREE.PointLight(0xffe3bb, 3.2, 0, 0);
  sun.position.set(...SYSTEM.star.pos);
  scene.add(sun);
  let starGeo = new THREE.BufferGeometry(),
    points = [];
  for (let i = 0; i < 2300; i++) {
    let n = V(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1)
      .normalize()
      .multiplyScalar(35000);
    points.push(n.x, n.y, n.z);
  }
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      color: 0xc1d7e3,
      size: 8,
      sizeAttenuation: true,
      fog: false,
      transparent: true,
      opacity: 0.85,
    }),
  );
  scene.add(stars);
  sunMesh = mesh(
    new THREE.SphereGeometry(SYSTEM.star.r, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0xffedbc, fog: false }),
  );
  sunMesh.position.set(-3000, 2500, -4800);
  let glowGeo = new THREE.SphereGeometry(SYSTEM.star.r * 1.1, 32, 24);
  mesh(
    glowGeo,
    new THREE.MeshBasicMaterial({
      color: 0xfdd992,
      fog: false,
      transparent: true,
      opacity: 0.13,
      side: THREE.BackSide,
    }),
  ).position.copy(sunMesh.position);
  for (let i = 0; i < CONFIG.planets.length; i++) {
    let p = makePlanet(CONFIG.planets[i], i);
    addNature(p, i);
  }
  makeCamp();
  makeBeacon(planets[1], V(0, 1, 0), "浮砾信标");
  makeBeacon(planets[2], V(0, 1, 0), "赤岬信标");
  const ruins = new THREE.Group();
  scene.add(ruins);
  const ruinN = V(0.1, 1, -0.2).normalize();
  placeSurface(ruins, planets[2], ruinN);
  const ruinMat = mat(0xb6a183);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const post = new THREE.Group();
    ruins.add(post);
    post.position.set(Math.sin(angle) * 12, 0, Math.cos(angle) * 12);
    post.rotation.y = angle;
    for (const side of [-1, 1]) {
      let c = mesh(new THREE.BoxGeometry(1.2, 17, 1.5), ruinMat, post);
      c.position.set(side * 2.5, -1.5, 0);
      solidBoxes.push({ mesh: c, half: V(0.6, 8.5, 0.75) });
    }
    let lintel = mesh(new THREE.BoxGeometry(7, 1.2, 2), ruinMat, post);
    lintel.position.y = 7;
    solidBoxes.push({ mesh: lintel, half: V(3.5, 0.6, 1) });
  }

  // Soft sky dome follows the explorer. Its opacity follows proximity to the home planet.
  skyMesh = mesh(
    new THREE.SphereGeometry(8500, 24, 16),
    new THREE.MeshBasicMaterial({
      color: 0x477788,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      fog: false,
    }),
  );
  skyMesh.renderOrder = -10;
  buildExpansion();
  for (const b of solidBoxes) {
    b.pos = b.mesh.getWorldPosition(V());
    b.q = b.mesh.getWorldQuaternion(new THREE.Quaternion());
    b.inv = b.q.clone().invert();
  }
  makeShip();
  player = {
    pos: V(),
    vel: V(),
    q: new THREE.Quaternion(),
    pitch: 0,
    up: UP.clone(),
  };
  resetWorld();
  createMap();
  updateCamera(1);
  renderer.render(scene, camera);
  window.addEventListener("resize", resize);
  setupInput();
  setupExpansion();
  requestAnimationFrame(animate);
  window.__sandbox = {
    get state() {
      return {
        driving,
        third,
        paused,
        started,
        player,
        ship,
        planets,
        footGrounded,
        elapsed,
      };
    },
    config: CONFIG,
    gravity,
    altitude,
    reset: resetWorld,
    step: physicsStep,
    nearest,
    get sites() {
      return sites;
    },
    get discovered() {
      return [...discovered];
    },
    save: saveGame,
    restore: restoreSave,
    export: makeSave,
    get nav() {
      return navData();
    },
    get settings() {
      return settings;
    },
    scan: scanSites,
  };
}
function baseResetWorld() {
  let p = planets[0];
  player.pos.copy(surfacePoint(p, UP, CONFIG.player.height));
  player.vel.set(0, 0, 0);
  player.q.setFromAxisAngle(UP, -0.17);
  player.pitch = 0;
  player.up.copy(UP);
  let n = V(12, p.r, -16).normalize();
  ship.pos.copy(surfacePoint(p, n, CONFIG.ship.clearance));
  ship.vel.set(0, 0, 0);
  ship.q.copy(frameQ(n));
  ship.grounded = true;
  shipGroup.position.copy(ship.pos);
  shipGroup.quaternion.copy(ship.q);
  driving = false;
  third = false;
  footGrounded = true;
  mousePitch = 0;
  mouseYaw = 0;
  keys = {};
  stepJump = false;
  targetIndex = 1;
  navSite = null;
}
function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
function toast(text, seconds = 3.5) {
  $("toast").textContent = text;
  toastUntil = performance.now() + seconds * 1000;
  $("toast").style.opacity = "1";
}
function setModal(id) {
  if (started) saveGame(false);
  if (audio) audio.gain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.04);
  if (id === "journal") renderJournal();
  if (id === "settings") syncSettings();
  modal = id;
  paused = true;
  keys = {};
  stepJump = false;
  for (let x of ["help", "map", "pause", "reset", "settings", "journal"])
    $(x).classList.toggle("hidden", x !== id);
  if (document.pointerLockElement) document.exitPointerLock();
  if (id === "map") createMap();
  let f = $(id)?.querySelector("button");
  if (f) setTimeout(() => f.focus(), 10);
}
function closeModal() {
  for (let x of ["help", "map", "pause", "reset", "settings", "journal"])
    $(x).classList.add("hidden");
  modal = null;
  paused = false;
  if (started) initAudio();
  last = performance.now();
  accumulator = 0;
  $("game").focus();
  requestLock();
}
function requestLock() {
  try {
    let result = $("game").requestPointerLock?.();
    if (result?.catch)
      result.catch(() => {
        toast("鼠标锁定不可用：按住左键拖动视角，键盘照常操作。", 5);
      });
  } catch (e) {
    toast("按住左键拖动视角，键盘照常操作。", 5);
  }
}
function start() {
  started = true;
  paused = false;
  $("intro").classList.add("hidden");
  $("hud").style.display = "block";
  $("game").focus();
  requestLock();
  initAudio();
  if (resumeData) {
    restoreSave(resumeData);
    resumeData = null;
    saveGame(false);
    toast("已恢复上次位置与发现记录。J 查看日志，O 打开设置。", 6);
  } else toast("飞船在右前方。E 登船；M 查看附近地标，O 调整镜头。", 7);
}
function interact() {
  if (driving) {
    let exit = ship.pos.clone().add(V(5, -0.5, 0).applyQuaternion(ship.q));
    let p = nearest(exit),
      n = exit.clone().sub(p.pos).normalize();
    if (altitude(exit, p) < CONFIG.player.height)
      exit.copy(surfacePoint(p, n, CONFIG.player.height + 0.2));
    player.pos.copy(exit);
    player.vel.copy(ship.vel);
    player.up.copy(n);
    player.q.copy(frameQ(n, V(0, 0, -1).applyQuaternion(ship.q)));
    player.pitch = 0;
    driving = false;
    footGrounded = false;
    toast(
      ship.grounded
        ? "已出舱。飞船停留在当前位置。"
        : "已出舱：保留飞船速度。空格可用宇航服喷气。",
      5,
    );
  } else if (player.pos.distanceTo(ship.pos) < 8) {
    driving = true;
    toast("空格向上起飞 · WASD 推进 · F 辅助减速 · V 切换视角", 6);
  } else toast("靠近飞船至 8 米以内，再按 E 登船。");
}
function setupInput() {
  const canvas = $("game");
  $("startBtn").onclick = start;
  $("helpBtn").onclick = () => setModal("help");
  $("mapBtn").onclick = () => setModal("map");
  $("pauseHelp").onclick = () => setModal("help");
  $("continueBtn").onclick = closeModal;
  $("resumeBtn").onclick = closeModal;
  $("mapResume").onclick = closeModal;
  document
    .querySelectorAll("[data-close]")
    .forEach((b) => (b.onclick = closeModal));
  $("confirmReset").onclick = () => {
    resetWorld();
    closeModal();
    toast("已返回苔原营地。");
  };
  $("fullBtn").onclick = async () => {
    try {
      if (!document.fullscreenElement)
        await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (e) {
      toast("此预览不支持全屏，可下载后用浏览器打开。");
    }
  };
  canvas.addEventListener("click", () => {
    if (started && !paused && !locked) requestLock();
  });
  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0 && started && !paused) drag = true;
  });
  window.addEventListener("mouseup", () => (drag = false));
  document.addEventListener("pointerlockchange", () => {
    const was = locked;
    locked = document.pointerLockElement === canvas;
    if (was && !locked && started && !modal) {
      setModal("pause");
    }
  });
  document.addEventListener("mousemove", (e) => {
    if (!started || paused || (!locked && !drag)) return;
    let dx = clamp(e.movementX || 0, -160, 160) * 0.002 * settings.sensitivity,
      dy = clamp(e.movementY || 0, -160, 160) * 0.002 * settings.sensitivity;
    if (driving) {
      mouseYaw += dx;
      mousePitch += dy;
    } else {
      let q = new THREE.Quaternion().setFromAxisAngle(UP, -dx);
      player.q.multiply(q);
      player.pitch = clamp(player.pitch - dy, -1.45, 1.45);
    }
  });
  window.addEventListener("keydown", (e) => {
    if (!started) return;
    if (
      [
        "Space",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Tab",
      ].includes(e.code) &&
      !modal
    )
      e.preventDefault();
    if (e.repeat) {
      if (!paused) keys[e.code] = true;
      return;
    }
    if (e.code === "Escape") {
      if (!locked) {
        if (modal) closeModal();
        else setModal("pause");
      }
      return;
    }
    if (e.code === "KeyO") {
      if (modal === "settings") closeModal();
      else setModal("settings");
      return;
    }
    if (e.code === "KeyJ") {
      if (modal === "journal") closeModal();
      else setModal("journal");
      return;
    }
    if (e.code === "KeyH") {
      if (modal === "help") closeModal();
      else setModal("help");
      return;
    }
    if (e.code === "KeyM") {
      if (modal === "map") closeModal();
      else setModal("map");
      return;
    }
    if (paused) return;
    keys[e.code] = true;
    if (e.code === "Space") stepJump = true;
    if (e.code === "KeyG") useInstrument();
    if (e.code === "KeyE") {
      interact();
      saveGame(false);
    }
    if (e.code === "KeyL") {
      flashlight = !flashlight;
      toast(flashlight ? "头灯已开启" : "头灯已关闭", 1.5);
    }
    if (e.code === "KeyB") {
      navSite = "ship";
      toast("导航：拾光号停泊点", 2);
    }
    if (e.code === "KeyK") saveGame(true);
    if (e.code === "KeyV" && driving) {
      third = !third;
      toast(third ? "第三人称驾驶" : "第一人称驾驶", 1.5);
    }
    if (e.code === "KeyT") {
      navSite = null;
      targetIndex = (targetIndex + 1) % planets.length;
      toast("导航目标：" + planets[targetIndex].name, 2);
    }
    if (e.code === "KeyR") setModal("reset");
  });
  window.addEventListener("keyup", (e) => (keys[e.code] = false));
  window.addEventListener("blur", () => {
    keys = {};
    drag = false;
    if (started && !modal) setModal("pause");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && started && !modal) setModal("pause");
  });
}
function rotateShip(dt) {
  let yaw = mouseYaw,
    pitch = mousePitch;
  mouseYaw = mousePitch = 0;
  ship.q.multiply(new THREE.Quaternion().setFromAxisAngle(UP, -yaw));
  ship.q.multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -pitch));
  const roll = (keys.KeyQ ? 1 : 0) - (keys.KeyZ ? 1 : 0);
  ship.q.multiply(
    new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), roll * dt * 1.2),
  );
  ship.q.normalize();
}
function baseCollideBody(body, clearance, isShip, dt) {
  let grounded = false;
  for (const p of planets) {
    let d = body.pos.clone().sub(p.pos),
      dist = d.length(),
      n = d.normalize(),
      r = radius(p, n) + clearance;
    if (dist < r || (dist < r + 0.025 && body.vel.dot(n) < 0.4)) {
      body.pos.copy(p.pos).addScaledVector(n, r);
      const vn = body.vel.dot(n);
      if (vn < 0) {
        if (isShip && vn < -18 && crashTimer <= 0) {
          sound("impact");
          toast("接触地表：速度过高。原型已缓冲撞击；提前按 F 减速。", 4);
          crashTimer = 5;
        }
        body.vel.addScaledVector(n, -vn * (isShip && vn < -10 ? 1.08 : 1));
      }
      let radial = n.clone().multiplyScalar(body.vel.dot(n)),
        tangent = body.vel.clone().sub(radial);
      body.vel
        .copy(radial)
        .addScaledVector(
          tangent,
          Math.exp(-(isShip ? 3 : p.theme === "ice" ? 0.08 : 1) * dt),
        );
      grounded = true;
    }
  }
  for (const o of obstacles) {
    if (o.pos.distanceToSquared(body.pos) > Math.pow(o.r + clearance + 1, 2))
      continue;
    let d = body.pos.clone().sub(o.pos),
      len = d.length(),
      r = o.r + (isShip ? 2 : 0.45);
    if (len < r && len > 0.001) {
      let n = d.divideScalar(len);
      body.pos.addScaledVector(n, r - len);
      let vn = body.vel.dot(n);
      if (vn < 0) body.vel.addScaledVector(n, -vn * 1.05);
    }
  }
  for (const b of solidBoxes) {
    if (b.pos.distanceToSquared(body.pos) > 6400) continue;
    const upBody = body.pos.clone().sub(nearest(body.pos).pos).normalize();
    for (const offset of isShip ? [0] : [-1.3, -0.25]) {
      let center = body.pos.clone().addScaledVector(upBody, offset);
      let local = center.sub(b.pos).applyQuaternion(b.inv),
        closest = local.clone().clamp(b.half.clone().negate(), b.half),
        delta = local.clone().sub(closest),
        len = delta.length(),
        r = isShip ? 2 : 0.45;
      if (len < r) {
        let penetration = r - len;
        if (len > 0.0001) delta.divideScalar(len);
        else {
          let gaps = [
            b.half.x - Math.abs(local.x),
            b.half.y - Math.abs(local.y),
            b.half.z - Math.abs(local.z),
          ];
          let ax = gaps.indexOf(Math.min(...gaps));
          delta.set(0, 0, 0);
          delta.setComponent(ax, Math.sign(local.getComponent(ax)) || 1);
          penetration = r + gaps[ax];
        }
        delta.applyQuaternion(b.q);
        body.pos.addScaledVector(delta, penetration);
        let vn = body.vel.dot(delta);
        if (vn < 0) body.vel.addScaledVector(delta, -vn);
        if (delta.dot(upBody) > 0.55 && vn < 0.4) grounded = true;
      }
    }
  }
  return grounded;
}
function basePhysicsStep(dt) {
  const wasFootGrounded=footGrounded;
  crashTimer -= dt;
  if (driving) rotateShip(dt);
  const pShip = nearest(ship.pos),
    up = ship.pos.clone().sub(pShip.pos).normalize();
  let acc = gravity(ship.pos).add(environmentForce(ship.pos)).sub(ship.grounded?frameAcceleration(pShip,ship.pos):ZERO),
    active = false;
  if (driving) {
    let local = V(
      ((keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0)) * CONFIG.ship.lateral,
      ((keys.Space ? 1 : 0) - (keys.ControlLeft || keys.ControlRight ? 1 : 0)) *
        CONFIG.ship.lift,
      ((keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0)) * CONFIG.ship.thrust,
    );
    active = local.lengthSq() > 0;
    acc.add(local.applyQuaternion(ship.q));
    const brakeVelocity=relativeVelocity(ship);if (keys.KeyF && brakeVelocity.length() > 0) {
      const amount = Math.min(CONFIG.ship.brake, brakeVelocity.length() / dt);
      acc.addScaledVector(brakeVelocity.clone().normalize(), -amount);
    }
  }
  if (
    ship.grounded &&
    !active &&
    relativeVelocity(ship).projectOnPlane(up).length() < 0.6 &&
    acc.clone().projectOnPlane(up).length() < Math.abs(acc.dot(up)) * 0.65
  ) {
    ship.vel.addScaledVector(up, -ship.vel.dot(up));
    ship.vel.copy(surfaceVelocity(pShip,ship.pos));
    const radialAcc = acc.dot(up);
    acc.copy(up).multiplyScalar(radialAcc);
  }
  ship.vel.addScaledVector(acc, dt);
  ship.pos.addScaledVector(ship.grounded?ship.vel.clone().sub(surfaceVelocity(pShip,ship.pos)):ship.vel, dt);
  protectStar(ship);
  ship.grounded = collideBody(ship, CONFIG.ship.clearance, true, dt);
  if (settings.align && ship.grounded && relativeVelocity(ship).length() < 4) {
    let forward = V(0, 0, -1).applyQuaternion(ship.q);
    let ideal = frameQ(up, forward);
    ship.q.slerp(ideal, 1 - Math.exp(-dt * 2.2));
  }
  shipGroup.position.copy(ship.pos);
  shipGroup.quaternion.copy(ship.q);
  shipGroup.visible = !driving || third;
  shipGroup.userData.flame.visible = driving && !!keys.KeyW;
  shipGroup.userData.flame.scale.y = 0.8 + Math.sin(elapsed * 30) * 0.15;
  if (!driving) {
    let p = nearest(player.pos),
      upNow = player.pos.clone().sub(p.pos).normalize();
    let transport = new THREE.Quaternion().setFromUnitVectors(player.up, upNow);
    player.q.premultiply(transport).normalize();
    player.up.copy(upNow);
    let forward = V(0, 0, -1).applyQuaternion(player.q),
      right = V(1, 0, 0).applyQuaternion(player.q);
    forward.addScaledVector(upNow, -forward.dot(upNow)).normalize();
    right.addScaledVector(upNow, -right.dot(upNow)).normalize();
    let wish = forward
      .multiplyScalar((keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0))
      .addScaledVector(right, (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0));
    if (wish.lengthSq() > 0) wish.normalize();
    let speed =
      keys.ShiftLeft || keys.ShiftRight
        ? CONFIG.player.sprint
        : CONFIG.player.walk;
    if (footGrounded) {
      const groundVelocity=surfaceVelocity(p,player.pos);player.vel.sub(groundVelocity);
      let normal = upNow.clone().multiplyScalar(player.vel.dot(upNow)),
        tangent = player.vel.clone().sub(normal);
      let goal = wish.multiplyScalar(speed);
      tangent.lerp(goal, 1 - Math.exp(-dt * (p.theme === "ice" ? 2.2 : 16)));
      player.vel.copy(normal).add(tangent).add(groundVelocity);
      if (stepJump) {
        player.vel.addScaledVector(upNow, CONFIG.player.jump);
        footGrounded = false;
        stepJump = false;
      }
    } else {
      player.vel.addScaledVector(wish, dt * 2.5);
      if (keys.Space) player.vel.addScaledVector(upNow, CONFIG.player.jet * dt);
    }
    const footAcc=gravity(player.pos).add(environmentForce(player.pos)).sub(wasFootGrounded?frameAcceleration(p,player.pos):ZERO);
    // Static friction holds an idle explorer to a non-icy moving surface.
    if(footGrounded && p.theme!=="ice" && wish.lengthSq()===0 && relativeVelocity(player).length()<.1 && footAcc.clone().projectOnPlane(upNow).length()<.3){
      player.vel.copy(surfaceVelocity(p,player.pos));
      footAcc.copy(upNow).multiplyScalar(footAcc.dot(upNow));
    }
    player.vel.addScaledVector(footAcc,dt);
    player.pos.addScaledVector(wasFootGrounded?player.vel.clone().sub(surfaceVelocity(p,player.pos)):player.vel, dt);
    protectStar(player);
    footGrounded = collideBody(player, CONFIG.player.height, false, dt);
    let hull = player.pos.clone().sub(ship.pos),
      hl = hull.length();
    if (hl < 2.8 && hl > 0.001) {
      hull.divideScalar(hl);
      player.pos.addScaledVector(hull, 2.8 - hl);
      let vn = player.vel.dot(hull);
      if (vn < 0) player.vel.addScaledVector(hull, -vn);
    }
    if (!keys.Space) stepJump = false;
  }
  if (!driving) {
    stepSound += dt;
    if (footGrounded && relativeVelocity(player).length() > 1 && stepSound > 0.42) {
      sound("step");
      stepSound = 0;
    }
  }
  const pos = driving ? ship.pos : player.pos;
  let np = nearest(pos);
  if (altitude(pos, np) < 20 && !visited.has(np.index)) {
    visited.add(np.index);
    toast("已抵达 " + np.name + "。整颗星球都可以自由探索。", 6);
  }
}
function legacyUpdateCamera(dt) {
  let pos = driving ? ship.pos : player.pos;
  if (driving) {
    camera.quaternion.copy(ship.q);
    if (third) {
      let desired = ship.pos.clone().add(V(0, 5.5, 16).applyQuaternion(ship.q));
      let p = nearest(desired),
        n = desired.clone().sub(p.pos).normalize();
      if (altitude(desired, p) < 1.5) desired.copy(surfacePoint(p, n, 1.5));
      camera.position.copy(desired);
      camera.up.copy(V(0, 1, 0).applyQuaternion(ship.q));
      camera.lookAt(ship.pos.clone().add(V(0, 0, -5).applyQuaternion(ship.q)));
    } else
      camera.position
        .copy(ship.pos)
        .add(V(0, 0.6, -1.25).applyQuaternion(ship.q));
  } else {
    camera.position.copy(player.pos);
    camera.quaternion
      .copy(player.q)
      .multiply(
        new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), player.pitch),
      );
  }
  if (!started) {
    camera.position.set(430, 300, 470);
    camera.up.copy(UP);
    camera.lookAt(-230, 50, -100);
  }
  let homeAlt = altitude(camera.position, planets[0]),
    opacity = clamp(1 - homeAlt / 180, 0, 1) * 0.57;
  skyMesh.position.copy(camera.position);
  skyMesh.material.opacity = opacity;
  stars.material.opacity = 1 - opacity * 0.8;
  let p = nearest(pos);
  const alt = altitude(pos, p);
  scene.fog =
    alt < 90
      ? new THREE.FogExp2(
          p.index === 0 ? 0x698e8a : p.index === 1 ? 0x0c1724 : 0x473536,
          p.index === 0 ? Math.max(0, 0.00045 * (1 - alt / 90)) : 0,
        )
      : null;
  camera.updateMatrixWorld(true);
  if (flash) {
    flash.visible = flashlight && !driving && started;
    flash.position.copy(camera.position);
    flashTarget.position
      .copy(camera.position)
      .add(V(0, 0, -12).applyQuaternion(camera.quaternion));
  }
  if (driving && third) {
    const delta = camera.position.clone().sub(ship.pos);
    const ray = new THREE.Raycaster(
      ship.pos,
      delta.clone().normalize(),
      2.9,
      delta.length(),
    );
    const hits = ray.intersectObjects(
      [...planets.map((p) => p.mesh), ...solidBoxes.map((b) => b.mesh)],
      false,
    );
    if (hits.length && hits[0].distance < delta.length())
      camera.position
        .copy(ship.pos)
        .addScaledVector(
          delta.normalize(),
          Math.max(3, hits[0].distance - 0.4),
        );
    camera.updateMatrixWorld(true);
  }
  $("cockpit").style.display = driving && !third ? "block" : "none";
}
function formatDist(d) {
  return d >= 1000 ? (d / 1000).toFixed(2) + " km" : Math.round(d) + " m";
}
function legacyUpdateHUD() {
  const pos = driving ? ship.pos : player.pos,
    vel = relativeVelocity(driving?ship:player),
    p = nearest(pos),
    alt = Math.max(
      0,
      altitude(pos, p) -
        (driving ? CONFIG.ship.clearance : CONFIG.player.height),
    );
  $("alt").textContent =
    alt < 1000 ? alt.toFixed(1) : (alt / 1000).toFixed(2) + "k";
  $("speed").textContent = vel.length().toFixed(1);
  $("grav").textContent = gravity(pos).length().toFixed(1);
  $("place").textContent =
    p.name + (alt < 15 ? " · 地表" : alt < 200 ? " · 近地空间" : " · 引力区");
  $("region").textContent =
    (driving ? "FLIGHT" : "EXPLORER") + " / 0" + (p.index + 1);
  $("mode").textContent = driving
    ? third
      ? "第三人称驾驶"
      : "第一人称驾驶"
    : footGrounded
      ? "地表探索"
      : "空中 / 喷气背包";
  $("flightBadge").textContent = driving
    ? keys.KeyF
      ? "辅助减速中 · 非自动悬停"
      : ship.grounded
        ? "已接地 · 空格起飞"
        : "惯性飞行 · 按住 F 辅助减速"
    : "引力在线 · 无生存消耗";
  $("clock").textContent =
    String(Math.floor(elapsed / 60)).padStart(2, "0") +
    ":" +
    String(Math.floor(elapsed % 60)).padStart(2, "0");
  $("hintline").textContent = driving
    ? "WASD 推进 · Space / Ctrl 升降 · Q / Z 滚转 · F 减速 · V 视角 · E 出舱"
    : "WASD 移动 · Space 跳跃 / 喷气 · Shift 冲刺 · E 登船 · M 星图 · H 操作";
  let prompt = "";
  if (!driving && pos.distanceTo(ship.pos) < 8)
    prompt = "<kbd>E</kbd> 登上「拾光号」";
  else if (driving && ship.grounded && vel.length() < 3)
    prompt = "<kbd>Space</kbd> 起飞　<kbd>E</kbd> 出舱";
  $("interaction").innerHTML = prompt;
  $("interaction").style.display = prompt ? "block" : "none";
  updateNavigation();
  $("hintline").textContent = driving
    ? "WASD 推进 · Space / Ctrl 升降 · F 减速 · V 视角 · E 出舱 · M 星图 · O 设置"
    : "WASD 移动 · Space 跳跃 / 喷气 · E 登船 · L 头灯 · B 找飞船 · J 日志 · O 设置";
  if (performance.now() > toastUntil) $("toast").style.opacity = "0";
}
function animate(now) {
  requestAnimationFrame(animate);
  let dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (started && !paused) {
    elapsed += dt;
    saveTimer += dt;
    if (saveTimer > 15) {
      saveGame(false);
      saveTimer = 0;
    }
    scanSites();
    updateAudio();
    accumulator += dt;
    const step = 1 / CONFIG.physics.hz;
    let steps = 0;
    while (accumulator >= step && steps++ < 8) {
      physicsStep(step);
      accumulator -= step;
    }
  }
  updateSystemVisuals(dt);
  updateCamera(dt);
  if (started) updateHUD();
  renderer.render(scene, camera);
}
// Expansion systems: original landmarks, walkable interiors, navigation, local saves and synthesized audio.
function box(parent, size, pos, material, rotation = 0) {
  const m = mesh(new THREE.BoxGeometry(...size), material, parent);
  m.position.set(...pos);
  m.rotation.x = rotation;
  solidBoxes.push({ mesh: m, half: V(...size).multiplyScalar(0.5) });
  return m;
}
function site(id, name, planet, note, dir, offset = 1) {
  const p = planets[planet],
    n = V(...dir).normalize(),
    pos = surfacePoint(p, n, offset);
  let x = { id, name, planet, note, pos, up: n };
  sites.push(x);
  return x;
}
function atSite(s) {
  const g = new THREE.Group();
  scene.add(g);
  g.position.copy(s.pos);
  g.quaternion.setFromUnitVectors(UP, s.up);
  return g;
}
function buildLegacyExpansion() {
  const ivory = mat(0xc6cab0),
    steel = mat(0x314c52),
    copper = mat(0xae895d),
    glass = mat(0x80c8c4, {
      emissive: 0x296568,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.55,
    }),
    lamp = mat(0xcfeac3, { emissive: 0xa0dba6, emissiveIntensity: 0.8 });
  site(
    "camp",
    "苔原起航营地",
    0,
    "这里的重力适合练习起降。飞船不会因松开推进键而停住。营地坐标已记录。",
    [0, 1, 0],
  );
  let obs = site(
      "observatory",
      "外廊观测站",
      0,
      "穿过敞开的门，登上观测平台。窗外能看见远处的微型世界；建筑内部和外部处于同一连续空间。",
      [-0.14, 1, -0.28],
      0,
    ),
    g = atSite(obs);
  box(g, [17, 1, 22], [0, 4, 0], steel);
  for (const side of [-1, 1]) {
    box(g, [1, 3, 22], [side * 8, 5.5, 0], ivory);
    box(g, [1, 2, 22], [side * 8, 12, 0], ivory);
    box(g, [0.12, 4, 20], [side * 8, 9, 0], glass);
    for (const z of [-10, 0, 10]) box(g, [1, 4, 0.6], [side * 8, 9, z], steel);
  }
  box(g, [17, 4, 1], [0, 5.5, -10.5], ivory);
  box(g, [17, 2, 1], [0, 12, -10.5], ivory);
  box(g, [5.5, 3.5, 1], [-5.75, 9.25, -10.5], ivory);
  box(g, [5.5, 3.5, 1], [5.75, 9.25, -10.5], ivory);
  box(g, [6, 3.5, 0.12], [0, 9.25, -10.5], glass);
  box(g, [5.5, 10, 1], [-5.75, 8, 10.5], ivory);
  box(g, [5.5, 10, 1], [5.75, 8, 10.5], ivory);
  box(g, [6, 3, 1], [0, 11.5, 10.5], steel);
  box(g, [18, 1, 23], [0, 13, 0], steel);
  box(g, [6, 0.6, 30], [0, 0.7, 25], steel, Math.atan(7 / 30));
  for (let side of [-1, 1]) {
    let w = mesh(new THREE.BoxGeometry(0.1, 3, 11), glass, g);
    w.position.set(side * 8.55, 9, 0);
    for (let i = 0; i < 3; i++) {
      let strip = mesh(new THREE.BoxGeometry(0.2, 0.15, 3), lamp, g);
      strip.position.set(side * 7.3, 12.3, -6 + i * 6);
    }
  }
  // Open viewing slit on the front; interior telescope and walkable floor.
  let pedestal = mesh(new THREE.CylinderGeometry(0.9, 1.2, 2, 8), copper, g);
  pedestal.position.set(0, 5.5, -2);
  solidBoxes.push({ mesh: pedestal, half: V(1, 1, 1) });
  box(g, [0.35, 1.5, 0.35], [0, 7.25, -2], steel);
  let scope = mesh(new THREE.CylinderGeometry(0.8, 0.6, 5, 10), steel, g);
  scope.position.set(0, 8, -2);
  scope.rotation.x = -1.3;
  let lens = mesh(new THREE.CircleGeometry(0.65, 12), glass, scope);
  lens.position.set(0, 2.51, 0);
  lens.rotation.x = -Math.PI / 2;
  let roomLight = new THREE.PointLight(0xa9d9cc, 65, 20, 1.5);
  roomLight.position.set(0, 10, 3);
  g.add(roomLight);
  obs.pos.copy(g.localToWorld(V(0, 6, 7)));
  let stones = site(
    "standing-stones",
    "远坡石阵",
    0,
    "几块孤立岩石围住一片空地。站在外侧时，脚下弯曲的地平线比远景更容易感知。",
    [0.65, 0.5, -0.55],
    0,
  );
  let sg = atSite(stones);
  for (let i = 0; i < 7; i++) {
    let a = (i * Math.PI * 2) / 7;
    let rock = mesh(new THREE.IcosahedronGeometry(1, 0), mat(0x9caa8a), sg);
    rock.position.set(Math.sin(a) * 9, 3, Math.cos(a) * 9);
    rock.scale.set(2, 5, 2);
    obstacles.push({
      pos: sg.localToWorld(rock.position.clone()),
      r: 2,
      p: planets[0],
    });
  }
  site(
    "moon-beacon",
    "浮砾北极信标",
    1,
    "这里的表面重力明显更低。同样一次跳跃，会在空中停留更久。",
    [0, 1, 0],
    0,
  );
  let rings = site(
      "ringfield",
      "石环盆地",
      1,
      "石环不是传送门。沿着地表穿行，可以观察球面朝向如何连续变化。",
      [0.65, 0.68, 0.1],
      0,
    ),
    rg = atSite(rings);
  for (let i = 0; i < 4; i++) {
    const r = mesh(
      new THREE.TorusGeometry(4 + i * 1.3, 0.5, 5, 24),
      mat(0x9db0b6),
      rg,
    );
    r.position.set((i - 1.5) * 10, 4, 0);
    r.rotation.y = 0.3 * i;
  }
  let crystal = site(
      "crystals",
      "漂砾晶簇",
      1,
      "晶簇在黑暗中发出微弱的光。这里没有资源采集；发现本身就是探索的回报。",
      [-0.5, 0.3, -0.81],
      0,
    ),
    cg = atSite(crystal);
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4,
      h = 3 + (i % 4) * 2;
    const c = mesh(
      new THREE.CylinderGeometry(0, 1.3, h, 5),
      mat(0x86b7c1, { emissive: 0x365f6c, emissiveIntensity: 0.5 }),
      cg,
    );
    c.position.set(
      Math.sin(a) * (2 + i * 0.4),
      h * 0.5,
      Math.cos(a) * (2 + i * 0.4),
    );
    c.rotation.z = Math.sin(i) * 0.2;
  }
  site(
    "gates",
    "赤岬石门遗迹",
    2,
    "这些原创石门只标示地点，不开启任务。你可以穿过它们，继续沿球面寻找下一处地貌。",
    [0.1, 1, -0.2],
    0,
  );
  let tunnel = site(
      "tunnel",
      "岩拱隧道",
      2,
      "这是一段有顶、两端开放的地表岩拱通道，不是地下挖掘洞穴。坡道、内部地面和外部地表连续相连。",
      [-0.24, 1, -0.16],
      0,
    ),
    tg = atSite(tunnel),
    stone = mat(0x93694f),
    floor = mat(0x665148);
  box(tg, [12, 1, 36], [0, 4, 0], floor);
  box(tg, [3, 17, 38], [-7, 4, 0], stone);
  box(tg, [3, 17, 38], [7, 4, 0], stone);
  for (let i = 0; i < 7; i++) {
    let roof = box(tg, [18, 4, 6], [0, 12, -18 + i * 6], stone);
    roof.rotation.z = (i % 2 ? 1 : -1) * 0.06;
  }
  box(tg, [9, 0.6, 28], [0, 0.7, 31], floor, Math.atan(7 / 28));
  box(tg, [9, 0.6, 28], [0, 0.7, -31], floor, -Math.atan(7 / 28));
  for (let i = 0; i < 7; i++) {
    for (const side of [-1, 1]) {
      let crag = mesh(
        new THREE.IcosahedronGeometry(1, 0),
        mat(i % 2 ? 0x8c634f : 0xa67b58),
        tg,
      );
      crag.position.set(side * 6, 7, -16 + i * 5);
      crag.scale.set(2.2, 4.3, 3.6);
      crag.rotation.z = side * 0.18;
      obstacles.push({
        pos: tg.localToWorld(V(side * 5.6, 5, -16 + i * 5)),
        r: 1.35,
        p: planets[2],
      });
      let crown = mesh(new THREE.IcosahedronGeometry(1, 0), stone, tg);
      crown.position.set(side * 3.5, 11.2, -16 + i * 5);
      crown.scale.set(3.4, 1.8, 3.8);
    }
  }
  for (let i = 0; i < 5; i++) {
    let l = mesh(new THREE.IcosahedronGeometry(0.25, 0), lamp, tg);
    l.position.set(3.9, 7, -12 + i * 6);
    let light = new THREE.PointLight(0xe7bf8a, 18, 10, 1.5);
    light.position.copy(l.position);
    tg.add(light);
  }
  tunnel.pos.copy(tg.localToWorld(V(0, 6, 0)));
  let spires = site(
      "spires",
      "熔色石柱群",
      2,
      "赤色只是岩石的颜色，这里没有熔岩流体模拟。高低石柱提供了一个适合低速绕飞的地形参照。",
      [0.6, -0.2, -0.77],
      0,
    ),
    pg = atSite(spires);
  for (let i = 0; i < 9; i++) {
    let a = i * 2.39,
      h = 8 + (i % 4) * 5;
    const p = mesh(new THREE.CylinderGeometry(1.2, 3, h, 5), mat(0xa77551), pg);
    p.position.set(Math.sin(a) * (6 + i), h / 2, Math.cos(a) * (6 + i));
    obstacles.push({
      pos: pg.localToWorld(V(p.position.x, 2, p.position.z)),
      r: 2.5,
      p: planets[2],
    });
  }
  for (const s of sites) {
    if (s.id === "camp" || s.id.endsWith("beacon")) continue;
    const marker = new THREE.Group();
    scene.add(marker);
    marker.position.copy(s.pos);
    marker.quaternion.setFromUnitVectors(UP, s.up);
    const mast = mesh(
      new THREE.CylinderGeometry(0.07, 0.12, 4, 5),
      steel,
      marker,
    );
    mast.position.y = 2;
    const tip = mesh(new THREE.OctahedronGeometry(0.5), lamp, marker);
    tip.position.y = 4;
  }
  flashTarget = new THREE.Object3D();
  scene.add(flashTarget);
  flash = new THREE.SpotLight(0xd9f3dc, 40, 38, 0.48, 0.55, 1.5);
  flash.target = flashTarget;
  scene.add(flash);
}
function legacyTargetPoint() {
  if (navSite === "ship")
    return {
      name: "拾光号",
      point: ship.pos.clone(),
      planet: nearest(ship.pos),
      surface: true,
    };
  if (navSite) {
    const s = sites.find((s) => s.id === navSite);
    if (s)
      return {
        name: s.name,
        point: s.pos.clone(),
        planet: planets[s.planet],
        surface: true,
      };
  }
  const p = planets[targetIndex];
  return { name: p.name, point: p.pos.clone(), planet: p, surface: false };
}
function navData() {
  const body = driving ? ship : player,
    t = targetPoint(),
    delta = t.point.clone().sub(body.pos),
    distance = delta.length(),
    dir = delta.clone().normalize(),
    range = Math.max(0, distance - (t.surface ? 0 : t.planet.r)),
    closing = body.vel.clone().sub(targetVelocity(t)).dot(dir),
    gAlong = gravity(body.pos).dot(dir),
    effective = CONFIG.ship.brake - gAlong;
  return {
    ...t,
    range,
    closing,
    effective,
    braking:
      closing > 0 && effective > 0.1
        ? (closing * closing) / (2 * effective)
        : closing > 0
          ? Infinity
          : 0,
    vertical: relativeVelocity(body).dot(
      body.pos.clone().sub(nearest(body.pos).pos).normalize(),
    ),
  };
}
function updateNavigation() {
  const n = navData(),
    el = $("target"),
    projected = n.point.clone().project(camera),
    ray = n.point.clone().sub(camera.position),
    front = ray.dot(V(0, 0, -1).applyQuaternion(camera.quaternion)) > 0,
    p = n.planet;
  let occluded = false;
  if (n.surface) {
    const v = camera.position.clone().sub(p.pos),
      d = ray.clone().normalize(),
      b = v.dot(d),
      c = v.lengthSq() - Math.pow(p.r - 3, 2),
      disc = b * b - c;
    if (disc > 0) {
      const hit = -b - Math.sqrt(disc);
      occluded = hit > 0 && hit < ray.length() - 6;
    }
  }
  const y = (-projected.y * 0.5 + 0.5) * innerHeight;
  if (
    front &&
    !occluded &&
    Math.abs(projected.x) < 0.8 &&
    Math.abs(projected.y) < 0.72 &&
    y > 235
  ) {
    el.style.left = (projected.x * 0.5 + 0.5) * innerWidth + "px";
    el.style.top = y + "px";
    $("targetName").textContent = n.name;
  } else {
    el.style.left = innerWidth / 2 + "px";
    el.style.top = "185px";
    $("targetName").textContent =
      "◇ " +
      n.name +
      (occluded
        ? " · 地平线外"
        : n.range < 12
          ? " · 已抵达"
          : front
            ? " · 视野边缘"
            : " · 转向寻找");
  }
  el.style.display = "block";
  $("targetDistance").textContent =
    formatDist(n.range) + (occluded ? " / 沿球面前进" : "");
  $("navTitle").textContent = n.name;
  let risk = driving && n.closing > 8 && n.braking > n.range * 0.8;
  const braking = Number.isFinite(n.braking)
    ? formatDist(n.braking)
    : "F 推力不足";
  $("navLines").innerHTML =
    "距离　" +
    formatDist(n.range) +
    "<br>接近　" +
    n.closing.toFixed(1) +
    " m/s<br>" +
    (driving
      ? "垂速　" + n.vertical.toFixed(1) + " m/s<br>刹距　" + braking
      : "发现　" + discovered.size + " / " + sites.length) +
    '<br><span style="color:' +
    (risk ? "#f0bb7d" : "#b3cbbd") +
    '">' +
    (risk
      ? "提前减速 · 留出余量"
      : driving
        ? "F 刹距估计，非自动驾驶"
        : flashlight
          ? "头灯已开 / L 关闭"
          : "B 寻找飞船 / L 头灯") +
    "</span>";
  $("recordCount").textContent =
    "发现 " +
    discovered.size +
    " / " +
    sites.length +
    (saveFailed ? " · 本地保存受限" : "");
}
function scanSites() {
  if (driving) return;
  for (const s of sites) {
    if (!discovered.has(s.id) && player.pos.distanceTo(s.pos) < 15) {
      discovered.add(s.id);
      sound("discover");
      toast("新发现：" + s.name + " · J 查看记录", 4);
      saveGame(false);
    }
  }
}
function baseMakeSave() {
  return {
    version: 6,
    actions: { ...actions },
    settings: { ...settings },
    savedAt: new Date().toISOString(),
    elapsed,
    driving,
    third,
    navSite,
    targetIndex,
    discovered: [...discovered],
    visited: [...visited],
    flashlight,
    player: {
      pos: player.pos.toArray(),
      vel: player.vel.toArray(),
      q: player.q.toArray(),
      pitch: player.pitch,
    },
    ship: {
      pos: ship.pos.toArray(),
      vel: ship.vel.toArray(),
      q: ship.q.toArray(),
    },
  };
}
function baseValidSave(d) {
  const vec = (a, n, limit) =>
    Array.isArray(a) &&
    a.length === n &&
    a.every(
      (x) => typeof x === "number" && Number.isFinite(x) && Math.abs(x) < limit,
    );
  return !!(
    d &&
    [3, 5, 6].includes(d.version) &&
    ["player", "ship"].every(
      (k) =>
        d[k] &&
        vec(d[k].pos, 3, 1e6) &&
        vec(d[k].vel, 3, 1e4) &&
        vec(d[k].q, 4, 2) &&
        d[k].q.reduce((s, x) => s + x * x, 0) > 0.1 &&
        (d.version===6||SYSTEM.bodies.every((p) => V(...d[k].pos).distanceTo(V(...p.pos)) > p.r * 0.4)),
    ) &&
    typeof d.driving === "boolean" &&
    typeof d.third === "boolean" &&
    Number.isFinite(d.elapsed) &&
    d.elapsed >= 0 &&
    Number.isInteger(d.targetIndex) &&
    d.targetIndex >= 0 &&
    d.targetIndex < planets.length &&
    Array.isArray(d.discovered) &&
    Array.isArray(d.visited) &&
    Number.isFinite(d.player.pitch) &&
    Math.abs(d.player.pitch) < 1.6
  );
}
function baseRestoreSave(d) {
  if (!validSave(d))
    throw Error("存档结构或数值不合法，请选择本版本导出的 JSON。");
  for (const k of ["player", "ship"]) {
    const obj = k === "player" ? player : ship;
    obj.pos.fromArray(d[k].pos);
    obj.vel.fromArray(d[k].vel);
    obj.q.fromArray(d[k].q).normalize();
  }
  player.pitch = d.player.pitch;
  player.up.copy(player.pos.clone().sub(nearest(player.pos).pos).normalize());
  actions = {};
  for (const x of instruments)
    if (Number.isInteger(d.actions?.[x.id]))
      actions[x.id] = clamp(d.actions[x.id], 0, x.states - 1);
  refreshInstruments();
  protectStar(player);
  protectStar(ship);
  driving = d.driving;
  third = d.third;
  elapsed = d.elapsed;
  navSite =
    d.navSite === "sun" ||
    d.navSite === "ship" ||
    sites.some((s) => s.id === d.navSite)
      ? d.navSite
      : null;
  targetIndex = d.targetIndex;
  discovered = new Set(
    d.discovered.filter((id) => sites.some((s) => s.id === id)),
  );
  visited = new Set(
    d.visited.filter(
      (x) => Number.isInteger(x) && x >= 0 && x < planets.length,
    ),
  );
  flashlight = !!d.flashlight;
  if (d.settings && typeof d.settings === "object") {
    for (const key of Object.keys(settings))
      if (Object.prototype.hasOwnProperty.call(d.settings, key))
        settings[key] = d.settings[key];
    applySettings();
  }
  shipGroup.position.copy(ship.pos);
  shipGroup.quaternion.copy(ship.q);
  footGrounded = false;
  ship.grounded = false;
  keys = {};
  return true;
}
function saveGame(notify = false) {
  if (!started) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(makeSave()));
    saveStatus =
      "已保存至此浏览器 · " +
      new Date().toLocaleTimeString("zh-CN", { hour12: false });
    saveFailed = false;
    if (notify) toast("已保存当前位置与发现记录。", 2);
  } catch (e) {
    saveStatus = "此环境无法持久保存，请使用“导出存档”备份。";
    saveFailed = true;
    if (notify) toast(saveStatus, 4);
  }
  if ($("storageStatus")) $("storageStatus").textContent = saveStatus;
}
function applySettings() {
  settings.fov = clamp(Number(settings.fov) || 76, 60, 95);
  settings.sensitivity = clamp(Number(settings.sensitivity) || 1, 0.35, 2);
  settings.volume = clamp(Number(settings.volume) || 0, 0, 0.7);
  settings.quality = [0.85, 1.25, 1.7].includes(Number(settings.quality))
    ? Number(settings.quality)
    : 1.25;
  settings.align = !!settings.align;
  camera.fov = settings.fov;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, settings.quality));
  renderer.setSize(innerWidth, innerHeight);
  if (audio)
    audio.master.gain.setTargetAtTime(
      settings.volume,
      audio.ctx.currentTime,
      0.05,
    );
  try {
    localStorage.setItem(SET_KEY, JSON.stringify(settings));
  } catch (e) {}
  syncSettings();
}
function syncSettings() {
  for (const [id, key] of [
    ["fov", "fov"],
    ["sens", "sensitivity"],
    ["volume", "volume"],
  ]) {
    $(id + "Input").value = settings[key];
    $(id + "Output").textContent =
      key === "fov"
        ? settings[key] + "°"
        : key === "volume"
          ? Math.round(settings[key] * 100) + "%"
          : settings[key].toFixed(2);
  }
  $("qualityInput").value = settings.quality;
  $("alignInput").checked = settings.align;
  $("storageStatus").textContent = saveStatus;
}
function initAudio() {
  try {
    if (audio) {
      audio.ctx.resume();
      return;
    }
    const ctx = new (window.AudioContext || window.webkitAudioContext)(),
      master = ctx.createGain(),
      engine = ctx.createOscillator(),
      gain = ctx.createGain();
    master.gain.value = settings.volume;
    master.connect(ctx.destination);
    engine.type = "triangle";
    engine.frequency.value = 48;
    gain.gain.value = 0;
    engine.connect(gain);
    gain.connect(master);
    engine.start();
    audio = { ctx, master, engine, gain };
  } catch (e) {
    toast("此浏览器未启用音效，游戏可继续。", 3);
  }
}
function sound(kind) {
  if (!audio || settings.volume === 0) return;
  const { ctx, master } = audio;
  let o = ctx.createOscillator(),
    g = ctx.createGain();
  o.connect(g);
  g.connect(master);
  let t = ctx.currentTime,
    d = kind === "discover" ? 0.5 : 0.07;
  o.type = kind === "step" ? "triangle" : "sine";
  o.frequency.setValueAtTime(
    kind === "discover" ? 540 : kind === "impact" ? 65 : 90,
    t,
  );
  if (kind === "discover")
    o.frequency.exponentialRampToValueAtTime(880, t + 0.35);
  g.gain.setValueAtTime(kind === "discover" ? 0.18 : 0.08, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.start(t);
  o.stop(t + d + 0.02);
}
function updateAudio() {
  if (!audio) return;
  const thrust =
    driving &&
    (keys.KeyW ||
      keys.KeyS ||
      keys.KeyA ||
      keys.KeyD ||
      keys.Space ||
      keys.ControlLeft ||
      keys.KeyF);
  audio.gain.gain.setTargetAtTime(
    thrust ? 0.16 : driving ? 0.025 : 0,
    audio.ctx.currentTime,
    0.15,
  );
  audio.engine.frequency.setTargetAtTime(
    thrust ? 62 : 38,
    audio.ctx.currentTime,
    0.1,
  );
}
function legacySetupExpansion() {
  try {
    const cfg = JSON.parse(localStorage.getItem(SET_KEY) || "null");
    if (cfg && typeof cfg === "object")
      for (const key of Object.keys(settings))
        if (Object.prototype.hasOwnProperty.call(cfg, key))
          settings[key] = cfg[key];
  } catch (e) {}
  applySettings();
  try {
    const d = JSON.parse(
      localStorage.getItem(SAVE_KEY) ||
        localStorage.getItem("zhuxing-sandbox-v5") || localStorage.getItem("zhuxing-sandbox-v3") ||
        "null",
    );
    if (validSave(d)) {
      resumeData = d;
      $("startBtn").textContent = "继续上次探索 ↗";
      $("campStart").classList.remove("hidden");
    }
  } catch (e) {}
  $("campStart").onclick = () => {
    const d = resumeData;
    resumeData = null;
    if (d) {
      discovered = new Set(
        d.discovered.filter((id) => sites.some((s) => s.id === id)),
      );
      visited = new Set(d.visited.filter((x) => x >= 0 && x < planets.length));
    }
    resetWorld();
    navSite = null;
    start();
  };
  $("settingsBtn").onclick = () => setModal("settings");
  $("journalBtn").onclick = () => setModal("journal");
  for (const [id, key] of [
    ["fov", "fov"],
    ["sens", "sensitivity"],
    ["volume", "volume"],
  ])
    $(id + "Input").oninput = () => {
      settings[key] = Number($(id + "Input").value);
      applySettings();
    };
  $("qualityInput").onchange = () => {
    settings.quality = Number($("qualityInput").value);
    applySettings();
  };
  $("alignInput").onchange = () => {
    settings.align = $("alignInput").checked;
    applySettings();
  };
  $("saveBtn").onclick = () => saveGame(true);
  $("exportBtn").onclick = () => {
    const blob = new Blob([JSON.stringify(makeSave(), null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "逐星-探索存档.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("importBtn").onclick = () => $("importFile").click();
  $("importFile").onchange = async () => {
    const f = $("importFile").files[0];
    if (!f) return;
    try {
      if (f.size > 100000) throw Error("存档文件过大。");
      const d = JSON.parse(await f.text());
      restoreSave(d);
      saveGame(false);
      $("storageStatus").textContent =
        "存档已导入，位置、发现记录与设置均已恢复。关闭设置后继续。";
      toast("存档已导入。关闭设置后继续。", 4);
    } catch (e) {
      const message =
        e instanceof SyntaxError
          ? "文件不是有效 JSON，可能已损坏；请重新选择导出的存档。"
          : e.message;
      $("storageStatus").textContent = "导入失败：" + message;
      toast("导入失败：" + message, 5);
    }
    $("importFile").value = "";
  };
  window.addEventListener("pagehide", () => saveGame(false));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && audio)
      audio.gain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.05);
  });
}

function launch() {
  try {
    init();
  } catch (e) {
    $("error").style.display = "block";
    $("errorText").textContent =
      "启动失败：" + e.message + "。请在 Chrome / Edge 开启硬件加速后重试。";
    console.error(e);
  }
}
