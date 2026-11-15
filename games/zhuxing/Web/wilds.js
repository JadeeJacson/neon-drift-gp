"use strict";
// 0.9: 灯塔纪元。3D 驾驶舱、苔原灯塔与营地生活细节、星际拓荒式的标记层与匹配速度提示。
// 全部为原创视觉与交互外壳：不改轨道、物理、量子与折叠航路的任何规则。
// 分层包装模式：本文件在 touch.js 之后加载，是最外层包装器。
const wildsOld = {
  init,
  initContent,
  updateCamera,
  updateHUD,
};

let wildsReady = false,
  cockpitGroup = null,
  cockpitScreens = null,
  lighthouseBeam = null,
  wildsLighthouse = null,
  campFlags = [],
  screenClock = 0;

const WILDS_LIGHTHOUSE_DIR = [-0.42, 1, 0.15];

// ---------- 小工具 ----------
function wildsCanvasTexture(draw, w = 128, h = 96) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const ctx = canvas.getContext("2d");
  draw(ctx, w, h);
  return { canvas, ctx, tex, draw, w, h };
}
function wildsScreenMat(tex) {
  return new THREE.MeshBasicMaterial({ map: tex, fog: false });
}
function wildsGlowSprite(color, scale, opacity) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d"),
    g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32),
    c = new THREE.Color(color);
  const rgb =
    "rgba(" +
    Math.round(c.r * 255) +
    "," +
    Math.round(c.g * 255) +
    "," +
    Math.round(c.b * 255) +
    ",";
  g.addColorStop(0, rgb + "0.9)");
  g.addColorStop(0.4, rgb + "0.32)");
  g.addColorStop(1, rgb + "0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity,
      depthWrite: false,
      fog: false,
    }),
  );
  s.scale.setScalar(scale);
  return s;
}
// 在候选方向里挑一处不与既有障碍物重叠的灯塔位置（树与岩石是实例化的，无法后移，只能换位）。
function wildsPickClearDir(p, candidates, clearance, minFrom) {
  for (const dir of candidates) {
    const n = V(dir[0], dir[1], dir[2]).normalize(),
      pos = surfacePoint(p, n, 2);
    let ok = true;
    for (const o of obstacles)
      if (o.p === p && o.pos.distanceTo(pos) < o.r + clearance) {
        ok = false;
        break;
      }
    if (ok)
      for (const q of minFrom)
        if (pos.distanceTo(q) < clearance) {
          ok = false;
          break;
        }
    if (ok) return n;
  }
  return V(...candidates[0]).normalize();
}

// ---------- 苔原灯塔 ----------
function wildsBuildLighthouse() {
  const p = planets[0],
    n = wildsPickClearDir(
      p,
      [
        WILDS_LIGHTHOUSE_DIR,
        [-0.5, 1, 0.05],
        [-0.36, 1, 0.24],
        [-0.47, 1, 0.22],
        [-0.3, 1, 0.05],
      ],
      7,
      sites.map((s) => s.pos),
    ),
    g = new THREE.Group();
  scene.add(g);
  placeSurface(g, p, n, 0);
  const stone = mat(0x5d6a6b),
    cream = mat(0xd8d2b4),
    band = mat(0xb96a4a),
    dark = mat(0x2c3a3d),
    lamp = mat(0xdff6ec, { emissive: 0x9fdcc6, emissiveIntensity: 1.1 });
  const base = mesh(new THREE.CylinderGeometry(2.6, 3.1, 1.3, 10), stone, g);
  base.position.y = 0.65;
  solidBoxes.push({ mesh: base, half: V(3, 0.7, 3) });
  const tower = mesh(new THREE.CylinderGeometry(1.05, 1.5, 15, 10), cream, g);
  tower.position.y = 8.8;
  solidBoxes.push({ mesh: tower, half: V(1.5, 7.5, 1.5) });
  for (let i = 0; i < 3; i++) {
    const stripe = mesh(
      new THREE.CylinderGeometry(1.28 - i * 0.1, 1.36 - i * 0.1, 1.4, 10),
      band,
      g,
    );
    stripe.position.y = 3.6 + i * 4.4;
  }
  const gallery = mesh(new THREE.TorusGeometry(1.55, 0.14, 5, 18), dark, g);
  gallery.position.y = 16.5;
  gallery.rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const post = mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), dark, g),
      a = (i / 8) * Math.PI * 2;
    post.position.set(Math.sin(a) * 1.55, 16.9, Math.cos(a) * 1.55);
  }
  const room = mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.7, 10), lamp, g);
  room.position.y = 17.6;
  const core = mesh(new THREE.IcosahedronGeometry(0.55, 1), lamp, g);
  core.position.y = 17.6;
  const roof = mesh(new THREE.ConeGeometry(1.35, 1.7, 10), band, g);
  roof.position.y = 19.3;
  const door = mesh(new THREE.BoxGeometry(0.9, 1.7, 0.2), dark, g);
  door.position.set(0, 1.15, 1.42);
  const glow = wildsGlowSprite(0xbfe8d8, 7, 0.5);
  glow.position.y = 17.6;
  g.add(glow);
  // 旋转光束：细长圆锥，绕灯室缓慢扫过地平线（纯视觉）。
  lighthouseBeam = new THREE.Group();
  lighthouseBeam.position.y = 17.6;
  const beam = mesh(
    new THREE.CylinderGeometry(0.4, 2.6, 150, 10, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xa8dcf0,
      transparent: true,
      opacity: 0.07,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
      blending: THREE.AdditiveBlending,
    }),
    lighthouseBeam,
  );
  beam.rotation.z = Math.PI / 2 - 0.09;
  beam.position.x = 75;
  const beamBack = beam.clone();
  beamBack.rotation.z = -Math.PI / 2 + 0.09;
  beamBack.position.x = -75;
  lighthouseBeam.add(beamBack);
  g.add(lighthouseBeam);
  obstacles.push({ pos: surfacePoint(p, n, 3), r: 2.8, p });
  detailRoots.push({ p, objects: [g] });
  wildsLighthouse = g;
  // 灯塔是纯视觉地标，不注册为第 48 处发现点：47 处发现计数与 QA 基线保持不变。
}

// ---------- 营地生活细节：木栈道、串灯、旗帜、进场灯带、着陆坪泛光灯 ----------
function wildsBuildCampLife() {
  const p = planets[0],
    campN = V(-0.1, 1, -0.12).normalize(),
    g = new THREE.Group();
  scene.add(g);
  placeSurface(g, p, campN, 0.05);
  const wood = mat(0x7a6248),
    woodB = mat(0x6b5540),
    poleM = mat(0x4a4f45),
    warm = mat(0xffd9a0, { emissive: 0xffb765, emissiveIntensity: 0.9 });
  // 环形木栈道。
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2,
      plank = mesh(new THREE.BoxGeometry(0.55, 0.09, 3.4), i % 2 ? wood : woodB, g);
    plank.position.set(Math.sin(a) * 8.4, 0.14, Math.cos(a) * 8.4);
    plank.rotation.y = a;
  }
  // 串灯柱与暖光。
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4,
      post = mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.4, 5), poleM, g);
    post.position.set(Math.sin(a) * 9.6, 1.2, Math.cos(a) * 9.6);
    const bulb = mesh(new THREE.IcosahedronGeometry(0.2, 0), warm, g);
    bulb.position.set(Math.sin(a) * 9.6, 2.45, Math.cos(a) * 9.6);
    if (i % 2 === 0) {
      const light = new THREE.PointLight(0xffb765, 9, 24, 1.7);
      light.position.copy(bulb.position);
      g.add(light);
    }
  }
  // 三面小旗。
  const flagColors = [0xd99a5c, 0x7fb8a8, 0xd8d2b4];
  for (let i = 0; i < 3; i++) {
    const a = -1.9 + i * 0.5,
      pole = mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.6, 5), poleM, g);
    pole.position.set(Math.sin(a) * 10.6, 1.8, Math.cos(a) * 10.6);
    const flag = mesh(
      new THREE.ConeGeometry(0.42, 1.3, 3),
      mat(flagColors[i]),
      g,
    );
    flag.scale.z = 0.08;
    flag.position.set(Math.sin(a) * 10.6 + 0.55, 3.15, Math.cos(a) * 10.6);
    flag.rotation.z = -Math.PI / 2;
    campFlags.push(flag);
  }
  detailRoots.push({ p, objects: [g] });

  // 营地 → 着陆坪的进场灯带。
  const padN = V(12, p.r, -16).normalize(),
    path = new THREE.Group();
  scene.add(path);
  const tile = mat(0xcfe8d8, { emissive: 0x8fd0b4, emissiveIntensity: 0.55 });
  for (let i = 1; i <= 10; i++) {
    const n = campN.clone().lerp(padN, i / 11).normalize(),
      t = mesh(new THREE.BoxGeometry(0.4, 0.07, 0.4), tile, path);
    t.position.copy(surfacePoint(p, n, 0.1));
    t.quaternion.setFromUnitVectors(UP, n);
  }
  detailRoots.push({ p, objects: [path] });

  // 着陆坪四角泛光灯与角标。
  const pad = new THREE.Group();
  scene.add(pad);
  placeSurface(pad, p, padN, 0.08);
  const steel = mat(0x3a4c50),
    head = mat(0xe8f2d8, { emissive: 0xcfe8b0, emissiveIntensity: 0.7 }),
    corner = mat(0xd9705a, { emissive: 0xa03c2c, emissiveIntensity: 0.6 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4,
      x = Math.sin(a) * 6.9,
      z = Math.cos(a) * 6.9;
    const pole = mesh(new THREE.CylinderGeometry(0.09, 0.13, 4, 5), steel, pad);
    pole.position.set(x, 2, z);
    const lampBox = mesh(new THREE.BoxGeometry(0.5, 0.28, 0.3), head, pad);
    lampBox.position.set(x * 0.94, 3.95, z * 0.94);
    lampBox.lookAt(0, 0, 0);
    if (i % 2 === 0) {
      const spot = wildsGlowSprite(0xdff0c8, 2.6, 0.32);
      spot.position.set(x * 0.9, 3.8, z * 0.9);
      pad.add(spot);
    }
    const mark = mesh(new THREE.BoxGeometry(0.34, 0.12, 0.34), corner, pad);
    mark.position.set(Math.sin(a) * 7.4, 0.16, Math.cos(a) * 7.4);
  }
  detailRoots.push({ p, objects: [pad] });
}

// ---------- 3D 驾驶舱 ----------
function wildsBuildCockpit() {
  cockpitGroup = new THREE.Group();
  camera.add(cockpitGroup);
  scene.add(camera);
  const shell = mat(0x3c4448),
    trim = mat(0x8f9488),
    dark = mat(0x23292b),
    amber = mat(0xd99a5c);
  // 仪表台。
  const dash = mesh(new THREE.BoxGeometry(1.55, 0.3, 0.62), shell, cockpitGroup);
  dash.position.set(0, -0.56, -0.78);
  dash.rotation.x = 0.22;
  const dashLip = mesh(new THREE.BoxGeometry(1.6, 0.06, 0.12), trim, cockpitGroup);
  dashLip.position.set(0, -0.4, -0.52);
  // 左右舷窗立柱与顶部遮阳沿。
  for (const side of [-1, 1]) {
    const pillar = mesh(new THREE.BoxGeometry(0.1, 1.25, 0.14), shell, cockpitGroup);
    pillar.position.set(side * 0.78, 0.05, -0.62);
    pillar.rotation.z = side * -0.16;
    const knuckle = mesh(new THREE.BoxGeometry(0.16, 0.2, 0.2), trim, cockpitGroup);
    knuckle.position.set(side * 0.72, -0.42, -0.66);
  }
  const visor = mesh(new THREE.BoxGeometry(1.7, 0.14, 0.42), shell, cockpitGroup);
  visor.position.set(0, 0.6, -0.55);
  visor.rotation.x = -0.16;
  const visorLip = mesh(new THREE.BoxGeometry(1.72, 0.05, 0.1), trim, cockpitGroup);
  visorLip.position.set(0, 0.52, -0.36);
  // 中央操纵台与指示灯。
  const consoleBox = mesh(new THREE.BoxGeometry(0.34, 0.26, 0.5), dark, cockpitGroup);
  consoleBox.position.set(0, -0.66, -0.5);
  consoleBox.rotation.x = 0.3;
  for (let i = 0; i < 3; i++) {
    const dot = mesh(
      new THREE.IcosahedronGeometry(0.025, 0),
      mat(0xffffff, {
        emissive: [0x74c895, 0xd9b45c, 0xc86a55][i],
        emissiveIntensity: 0.9,
      }),
      cockpitGroup,
    );
    dot.position.set(-0.07 + i * 0.07, -0.56, -0.42);
  }
  // 两块屏幕：左为星图意象，右为速度/高度读数。
  const left = wildsCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = "#0d211d";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(150,226,196,.5)";
    for (let k = 1; k <= 3; k++) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, k * 14, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#f5d28c";
    ctx.fillRect(w / 2 - 2, h / 2 - 2, 4, 4);
    ctx.fillStyle = "#9fe8c8";
    ctx.fillRect(w / 2 + 24, h / 2 - 40, 3, 3);
    ctx.fillRect(w / 2 - 38, h / 2 + 16, 3, 3);
  });
  const right = wildsCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = "#1a140c";
    ctx.fillRect(0, 0, w, h);
    const v = driving ? relativeVelocity(ship) : relativeVelocity(player);
    ctx.fillStyle = "#f0b46a";
    ctx.font = "26px monospace";
    ctx.fillText(v.length().toFixed(0), 10, 34);
    ctx.font = "11px monospace";
    ctx.fillText("m/s", 76, 34);
    const alt = Math.max(
      0,
      altitude(driving ? ship.pos : player.pos, nearest(driving ? ship.pos : player.pos)),
    );
    ctx.fillStyle = "#cfe0c8";
    ctx.font = "17px monospace";
    ctx.fillText(alt < 1000 ? alt.toFixed(0) + "m" : (alt / 1000).toFixed(2) + "km", 10, 62);
    ctx.fillStyle = "rgba(240,180,106,.85)";
    ctx.fillRect(10, 74, Math.min(100, v.length() * 0.6), 6);
  });
  cockpitScreens = { left, right, clock: 0 };
  for (const [side, scr] of [
    [-0.42, left],
    [0.42, right],
  ]) {
    const frame = mesh(new THREE.BoxGeometry(0.36, 0.28, 0.04), dark, cockpitGroup);
    frame.position.set(side, -0.42, -0.72);
    frame.rotation.x = -0.32;
    const screen = mesh(new THREE.PlaneGeometry(0.3, 0.22), wildsScreenMat(scr.tex), cockpitGroup);
    screen.position.set(side, -0.415, -0.695);
    screen.rotation.x = -0.32;
  }
  const lamp = new THREE.PointLight(0xd9e8c8, 1.6, 2.6, 1.6);
  lamp.position.set(0, -0.2, -0.4);
  cockpitGroup.add(lamp);
  cockpitGroup.visible = false;
}

// ---------- DOM 层：标记、匹配速度提示、驾驶舱读数 ----------
let wildsMarkerLayer = null,
  wildsHintEl = null,
  wildsConsoleEl = null,
  wildsArrowEl = null;
function wildsBuildDom() {
  const layer = document.createElement("div");
  layer.id = "wildsMarkers";
  document.body.append(layer);
  wildsMarkerLayer = layer;
  const hint = document.createElement("div");
  hint.id = "wildsHint";
  hint.innerHTML = "<kbd>F</kbd>（按住）匹配速度";
  document.body.append(hint);
  wildsHintEl = hint;
  const consoleEl = document.createElement("div");
  consoleEl.id = "wildsConsole";
  consoleEl.innerHTML =
    '速度<b id="wildsSpeed">0</b>m/s　高度<b id="wildsAlt">0</b>m';
  document.body.append(consoleEl);
  wildsConsoleEl = consoleEl;
  // 主导航标记内的相对速度小箭头。
  const arrow = document.createElement("div");
  arrow.className = "varrow";
  arrow.style.display = "none";
  $("target").append(arrow);
  wildsArrowEl = arrow;
}
const wildsMarkerPool = new Map();
function wildsMarker(key, cls) {
  let el = wildsMarkerPool.get(key);
  if (!el) {
    el = document.createElement("div");
    el.className = "wmark " + cls;
    el.innerHTML = "<div class='chev'>▸</div><b></b><span></span>";
    wildsMarkerLayer.append(el);
    wildsMarkerPool.set(key, el);
  }
  return el;
}
function wildsPlaceMarker(el, point, name, distText) {
  const delta = point.clone().sub(camera.position),
    front = delta.dot(V(0, 0, -1).applyQuaternion(camera.quaternion)) > 0,
    projected = point.clone().project(camera);
  if (!front || Math.abs(projected.x) > 1.35 || Math.abs(projected.y) > 1.35) {
    el.style.display = "none";
    return false;
  }
  const x = clamp(projected.x, -0.94, 0.94) * 0.5 + 0.5,
    y = clamp(-projected.y, -0.9, 0.9) * 0.5 + 0.5;
  el.style.left = x * innerWidth + "px";
  el.style.top = y * innerHeight + "px";
  el.querySelector("b").textContent = name;
  el.querySelector("span").textContent = distText;
  el.style.display = "block";
  return true;
}
function wildsSyncMarkers() {
  const layer = wildsMarkerLayer;
  if (!layer) return;
  if (!started || paused || modal || document.body.classList.contains("photo-mode")) {
    layer.style.display = "none";
    wildsHintEl.style.display = "none";
    wildsConsoleEl.style.display = "none";
    wildsArrowEl.style.display = "none";
    return;
  }
  layer.style.display = "block";
  const body = driving ? ship : player,
    nav = navData();
  // 飞船标记（徒步且远离时）。
  const shipMark = wildsMarker("ship", "ship");
  if (!driving && body.pos.distanceTo(ship.pos) > 60)
    wildsPlaceMarker(
      shipMark,
      ship.pos,
      "拾光号",
      formatDist(body.pos.distanceTo(ship.pos)),
    );
  else shipMark.style.display = "none";
  // 最近的黑洞 / 白洞标记。
  const riftMark = wildsMarker("rift", "rift");
  let rift = null,
    riftDist = 25000;
  try {
    for (const r of __sandbox.rifts.nodes) {
      const d = body.pos.distanceTo(r.pos);
      if (d < riftDist) {
        riftDist = d;
        rift = r;
      }
    }
  } catch (e) {}
  if (
    rift &&
    rift.name !== nav.name &&
    wildsPlaceMarker(riftMark, rift.pos, rift.name, formatDist(riftDist))
  )
    riftMark.querySelector("b").style.color = "#f0c48e";
  else riftMark.style.display = "none";
  // 匹配速度提示（星际拓荒式）。
  const closing = nav.range > 30 && nav.closing > 22;
  wildsHintEl.style.display = driving && closing ? "block" : "none";
  // 驾驶舱读数。
  const inCockpit = cockpitGroup && cockpitGroup.visible;
  wildsConsoleEl.style.display = inCockpit ? "block" : "none";
  if (inCockpit) {
    const rel = relativeVelocity(driving ? ship : player),
      p = nearest(body.pos),
      alt = Math.max(0, altitude(body.pos, p) - CONFIG.ship.clearance);
    $("wildsSpeed").textContent = rel.length().toFixed(0);
    $("wildsAlt").textContent =
      alt < 1000 ? alt.toFixed(0) : (alt / 1000).toFixed(1) + "k";
  }
  // 主导航标记内的相对速度箭头。
  const rel = relativeVelocity(body);
  if (rel.length() > 3 && driving) {
    const cam = rel.clone().applyQuaternion(camera.quaternion.clone().invert());
    wildsArrowEl.style.display = "block";
    wildsArrowEl.style.transform =
      "rotate(" + (Math.atan2(cam.x, cam.y) * 180) / Math.PI + "deg)";
  } else wildsArrowEl.style.display = "none";
}

// ---------- 包装链 ----------
initContent = function () {
  wildsOld.initContent();
  wildsBuildLighthouse();
  wildsBuildCampLife();
};

init = function () {
  wildsOld.init();
  wildsBuildCockpit();
  wildsBuildDom();
  // 设置面板：3D 驾驶舱开关（默认开；触屏设备保持轻量界面）。
  settings.cockpit = settings.cockpit !== false;
  const line = document.createElement("div");
  line.className = "setting-line";
  line.innerHTML =
    '<label for="cockpitInput">3D 驾驶舱框架</label><input id="cockpitInput" type="checkbox">';
  $("settings").querySelector(".settings-grid").append(line);
  $("cockpitInput").onchange = () => {
    settings.cockpit = $("cockpitInput").checked;
    applySettings();
  };
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyY" && !e.repeat && started && !modal && !paused) {
      settings.cockpit = !settings.cockpit;
      applySettings();
      toast(settings.cockpit ? "3D 驾驶舱已开启" : "3D 驾驶舱已关闭", 1.8);
    }
  });
  wildsReady = true;
  // 测试锚点：供 QA 定位灯塔世界坐标，不属于玩家功能。
  Object.defineProperty(__sandbox, "wilds", {
    get: () => ({
      get lighthouse() {
        return wildsLighthouse
          ? wildsLighthouse.getWorldPosition(V())
          : null;
      },
    }),
  });
};

const wildsSyncSettings = syncSettings;
syncSettings = function () {
  wildsSyncSettings();
  const box = $("cockpitInput");
  if (box) box.checked = settings.cockpit !== false;
};

updateCamera = function (dt) {
  wildsOld.updateCamera(dt);
  if (!wildsReady) return;
  const touchUI = document.body.classList.contains("touch"),
    photo = document.body.classList.contains("photo-mode"),
    on = started && driving && !third && settings.cockpit !== false && !touchUI && !photo;
  if (cockpitGroup) cockpitGroup.visible = on;
  // 3D 驾驶舱在位时收起旧的 CSS 立柱。
  if (on) $("cockpit").style.display = "none";
  // 灯塔光束与旗帜的缓慢动画。
  if (started && !paused && lighthouseBeam) lighthouseBeam.rotation.y += dt * 0.42;
  if (started && !paused)
    for (let i = 0; i < campFlags.length; i++)
      campFlags[i].rotation.x = Math.sin(elapsed * 1.7 + i * 2.1) * 0.14;
  // 屏幕内容节流刷新。
  if (on && cockpitScreens && (screenClock += dt) > 0.25) {
    screenClock = 0;
    const { ctx, w, h, tex } = cockpitScreens.right,
      rel = relativeVelocity(ship),
      alt = Math.max(0, altitude(ship.pos, nearest(ship.pos)) - CONFIG.ship.clearance);
    ctx.fillStyle = "#1a140c";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#f0b46a";
    ctx.font = "26px monospace";
    ctx.fillText(rel.length().toFixed(0), 10, 34);
    ctx.font = "11px monospace";
    ctx.fillText("m/s", 78, 34);
    ctx.fillStyle = "#cfe0c8";
    ctx.font = "16px monospace";
    ctx.fillText(alt < 1000 ? alt.toFixed(0) + "m" : (alt / 1000).toFixed(2) + "km", 10, 62);
    ctx.fillStyle = "rgba(240,180,106,.85)";
    ctx.fillRect(10, 74, Math.min(100, rel.length() * 0.6), 6);
    ctx.fillStyle = keys.KeyF ? "#7fd8b0" : "rgba(140,160,150,.5)";
    ctx.fillRect(10, 84, keys.KeyF ? 30 : 12, 5);
    tex.needsUpdate = true;
  }
};

updateHUD = function () {
  wildsOld.updateHUD();
  if (!wildsReady) return;
  wildsSyncMarkers();
  if (driving && $("hintline"))
    $("hintline").textContent += " · Y 驾驶舱 · N 黑洞 · P 探针";
};
