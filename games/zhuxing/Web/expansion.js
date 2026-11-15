"use strict";
// Original 0.5 content; metres and seconds. Static celestial layout, not N-body dynamics.
let actions = {},
  instruments = [],
  effects = [],
  detailRoots = [],
  mapHits = [],
  starPos;
const SITE_DIRS = [
  [0, 1, 0],
  [0.45, 0.76, -0.47],
  [-0.56, 0.61, 0.56],
];
const newSites = {
  3: [
    [
      "thermal",
      "奔沙风塔",
      "风塔附近的上升热流会托起离地的人与飞船。G 可切换热流强度，不是自动悬停。",
    ],
    [
      "arcade",
      "陶土拱廊",
      "三座厚重拱门沿沙脊展开。穿过门洞，近处的低地与远方的白色沙脊连续相连。",
    ],
    [
      "sundial",
      "日晷镜阵",
      "镜片围住日晷。静态勘探模式下日照方向不会因公转改变，镜片也不是传送装置。",
    ],
  ],
  4: [
    [
      "heatwell",
      "热井灯站",
      "在热井边切换指示灯。发光熔痕是固态玄武岩裂纹，没有流体熔岩或伤害。",
    ],
    [
      "glassforest",
      "黑玻璃林",
      "黑色六棱玻璃从地面升起，紫色棱线在恒星背面仍然可见。绕过尖柱可继续步行。",
    ],
    [
      "emberwall",
      "熔痕环璧",
      "环形岩壁留出两道出口。岩壁下缘伸入地表，暗红光线标记冷却的痕迹。",
    ],
  ],
  5: [
    [
      "survey",
      "测绘桅杆",
      "G 启动桅杆，读取半径、引力与母星信息。扫描不解锁地图，也不限制探索。",
    ],
    [
      "brokenbridge",
      "低重力断桥",
      "桥墩支撑三段桥面，空隙需要跳过去。它们并非悬浮物理；低重力让跨越更从容。",
    ],
    [
      "impact",
      "同心陨击坑",
      "地表的凹陷、环形坑缘与散落岩石记录撞击痕迹。坑底仍是可步行的连续地形。",
    ],
  ],
  6: [
    [
      "aurora",
      "极光阵列",
      "G 切换三种极光相位。高空光带是艺术化效果；蓝冰地面会让转向与停步变慢。",
    ],
    [
      "icegate",
      "蓝冰峡门",
      "高耸的半透明冰面围成通道。冰体不可破坏；你可以穿行其间，观察远处星空。",
    ],
    [
      "coldroom",
      "低温观测室",
      "两端敞开的观测室与外部冰面连续相连。缓坡通向室内，刻线标记恒星方向。",
    ],
  ],
  7: [
    [
      "fogtower",
      "环雾灯塔",
      "G 切换宇航服减雾滤镜。滤镜改善近地能见度，但不会清除整颗卫星的薄雾。",
    ],
    [
      "mushrooms",
      "菌冠庭",
      "青蓝与紫色菌盖像小路灯。菌柄和岩石有简化碰撞；菌类不可采集。",
    ],
    [
      "luminous",
      "菌光廊道",
      "两列菌柱在拱架下形成微光廊道。离开后，整颗小卫星仍可自由绕行。",
    ],
  ],
  8: [
    [
      "weather",
      "风脊气象站",
      "G 开关测量显示。高空横风按时间变化，不会因为关闭仪器而消失。",
    ],
    [
      "ringport",
      "环影渡口",
      "着陆平台正对星环。薄尘带无碰撞，大块碎石具有简化球体碰撞，位置固定。",
    ],
    [
      "ringstones",
      "星环石阵",
      "地面的小石环呼应天上的大星环。沿石阵行走，可以感知星球曲率。",
    ],
  ],
  9: [
    [
      "resonator",
      "三音石场",
      "G 启动三组不同音高的共鸣。音效由浏览器实时合成；设置中需开启音量。",
    ],
    [
      "dome",
      "沙浪圆顶",
      "分段穹顶留出入口。拱肋与沙脊形成重复节奏，内外属于同一连续空间。",
    ],
    [
      "soundbridge",
      "共鸣石桥",
      "短桥有固定支柱与两端缓坡。六角音石只是地标；可操作的三音设备位于另一侧石场。",
    ],
  ],
  10: [
    [
      "relay",
      "静潮中继站",
      "G 切换中继天线方向灯，记录母星环岚方向。无需电源或任务前置。",
    ],
    [
      "saltmirror",
      "盐镜盆地",
      "浅色盐壳具有镜面感。这是实心地面，不是水；没有游泳或真实水面反射。",
    ],
    [
      "ringview",
      "环影观景台",
      "走上缓坡，在栏杆旁观看环岚及星环。平台没有快速旅行功能。",
    ],
  ],
};
function initContent() {
  starPos = V(...SYSTEM.star.pos);
  initCore();
  Object.assign(window.__sandbox, {
    environment: environmentForce,
    protectStar,
    validSave,
    instruments,
    useInstrument,
    select: (index, id = null) => {
      targetIndex = index;
      navSite = id;
      createMap();
    },
    view: () => ({
      camera: camera.position.toArray(),
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
    }),
    getActions: () => ({ ...actions }),
  });
}
function localTerrain(p, n) {
  if (p.index < 3) return legacyTerrain(p, n);
  const f = 1 - Math.exp(-(1 - n.y) * 70);
  let h;
  switch (p.theme) {
    case "dune":
      h =
        Math.sin(n.x * 18 + n.z * 9) * 0.45 + Math.sin(n.x * 8 - n.y * 9) * 0.3;
      break;
    case "basalt":
      h = Math.abs(Math.sin(n.x * 18) * Math.cos(n.z * 15)) * 0.9 - 0.25;
      break;
    case "fracture":
      h =
        Math.sin(n.x * 17 + n.z * 9) * Math.cos(n.y * 13) * 0.5 -
        Math.exp(-Math.pow((n.y + 0.2) / 0.2, 2)) * 0.25;
      break;
    case "ice":
      h =
        Math.abs(Math.sin(n.x * 12 + n.z * 4)) * 0.65 +
        Math.cos(n.z * 16) * 0.2 -
        0.3;
      break;
    case "mist":
      h = Math.sin(n.x * 10) * Math.cos(n.z * 8) * 0.35;
      break;
    case "wind":
      h =
        Math.sin(n.x * 11 + n.y * 7) * Math.cos(n.z * 9) * 0.6 +
        Math.cos(n.z * 23) * 0.15;
      break;
    case "sound":
      h = Math.sin(n.x * 19 + n.z * 6) * 0.5 + Math.sin(n.y * 9) * 0.2;
      break;
    case "salt":
      h = Math.sin(n.x * 8) * Math.cos(n.z * 8) * 0.4;
      break;
    default:
      h = 0;
  }
  let result = h * p.amp * f;
  if (p.theme === "fracture") {
    const dir = V(...SITE_DIRS[2]).normalize(),
      d = n.angleTo(dir) * p.r;
    result -= 5 * Math.exp(-Math.pow(d / 9, 2));
    result += 2 * Math.exp(-Math.pow((d - 13) / 2.2, 2));
  }
  return result;
}
function makePlanet(def, index) {
  const p = { ...def, index, pos: V(...def.pos), mu: def.g * def.r * def.r };
  const geo = new THREE.IcosahedronGeometry(p.r, index < 3 ? 34 : 26),
    a = geo.attributes.position,
    colors = [],
    c = new THREE.Color();
  for (let i = 0; i < a.count; i++) {
    const n = V().fromBufferAttribute(a, i).normalize(),
      h = terrain(p, n);
    a.setXYZ(i, n.x * (p.r + h), n.y * (p.r + h), n.z * (p.r + h));
    c.set(p.palette[h > p.amp * 0.22 ? 2 : h < -p.amp * 0.16 ? 0 : 1]);
    c.multiplyScalar(0.96 + rand() * 0.08);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  p.mesh = mesh(
    geo,
    mat(0xffffff, {
      vertexColors: true,
      metalness: p.theme === "ice" ? 0.22 : p.theme === "salt" ? 0.3 : 0,
      roughness: ["ice", "salt"].includes(p.theme) ? 0.28 : 0.9,
    }),
  );
  p.mesh.position.copy(p.pos);
  planets.push(p);
  return p;
}
function addNature(p, i) {
  const before = new Set(scene.children);
  if (i < 3) legacyAddNature(p, i);
  else {
    const count = p.r > 200 ? 125 : 65,
      dummy = new THREE.Object3D();
    const geo =
      p.theme === "mist"
        ? new THREE.CylinderGeometry(0.3, 0.65, 5, 5)
        : ["basalt", "ice"].includes(p.theme)
          ? new THREE.ConeGeometry(1, 5, 6)
          : new THREE.IcosahedronGeometry(1, 0);
    const inst = new THREE.InstancedMesh(
      geo,
      mat(p.palette[0], {
        emissive: p.theme === "mist" ? 0x264f65 : 0,
        emissiveIntensity: 0.35,
      }),
      count,
    );
    scene.add(inst);
    let cap;
    if (p.theme === "mist") {
      cap = new THREE.InstancedMesh(
        new THREE.SphereGeometry(2.6, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2),
        mat(0x83c2bc, { emissive: 0x3d9b9b, emissiveIntensity: 0.7 }),
        count,
      );
      scene.add(cap);
    }
    for (let k = 0; k < count; k++) {
      const n = V(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
      if (
        [...SITE_DIRS, ...(p.index === 10 ? [[0.1, 0.8, 0.6]] : [])].some(
          (d) => n.dot(V(...d).normalize()) > (p.r < 120 ? 0.94 : 0.985),
        )
      ) {
        k--;
        continue;
      }
      const sc = 0.7 + rand() * 1.8;
      dummy.position.copy(
        surfacePoint(p, n, p.theme === "mist" ? 2 * sc : sc * 0.4),
      );
      dummy.quaternion.setFromUnitVectors(UP, n);
      dummy.rotateY(rand() * 6.28);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      inst.setMatrixAt(k, dummy.matrix);
      obstacles.push({
        pos: surfacePoint(p, n, 1.4 * sc),
        r: p.theme === "mist" ? 0.65 * sc : sc,
        p,
      });
      if (cap) {
        dummy.position.copy(surfacePoint(p, n, 4.5 * sc));
        dummy.updateMatrix();
        cap.setMatrixAt(k, dummy.matrix);
      }
    }
  }
  detailRoots.push({
    p,
    objects: scene.children.filter((o) => !before.has(o)),
  });
}
function gravity(pos) {
  const out = legacyGravity(pos),
    d = starPos.clone().sub(pos);
  return out.addScaledVector(
    d.normalize(),
    SYSTEM.star.mu /
      Math.max(pos.distanceToSquared(starPos), SYSTEM.star.r ** 2),
  );
}
function protectStar(body) {
  const d = body.pos.clone().sub(starPos),
    r = SYSTEM.star.r + 125;
  if (d.length() < r) {
    const n = d.lengthSq() > 0 ? d.normalize() : UP.clone();
    body.pos.copy(starPos).addScaledVector(n, r);
    const v = body.vel.dot(n);
    if (v < 4) body.vel.addScaledVector(n, 4 - v);
    if (started && performance.now() > toastUntil)
      toast("曦心热边界：已缓冲推离。恒星不可着陆，请转向固态天体。", 5);
    return true;
  }
  return false;
}
function environmentForce(pos) {
  const p = nearest(pos),
    h = altitude(pos, p),
    n = pos.clone().sub(p.pos).normalize(),
    f = V();
  if (h < 0 || h > 160) return f;
  if (p.theme === "wind") {
    const east = V(0, 0, 1).cross(n).normalize();
    f.addScaledVector(
      east,
      (0.65 + 0.35 * Math.sin(elapsed * 0.37)) *
        1.35 *
        clamp((h - 3) / 28, 0, 1) *
        clamp((160 - h) / 60, 0, 1),
    );
  }
  if (p.theme === "dune") {
    const s = sites.find((x) => x.id === "thermal");
    if (s) {
      const d = pos.clone().sub(s.pos),
        axial = d.dot(s.up),
        side = d.clone().addScaledVector(s.up, -axial).length();
      if (side < 18 && axial > 2 && axial < 130)
        f.addScaledVector(
          s.up,
          (actions.thermal ? 9 : 6.8) *
            (1 - side / 18) *
            clamp((130 - axial) / 45, 0, 1),
        );
    }
  }
  return f;
}
function rootSite(s) {
  const g = atSite(s);
  s.root = g;
  if (s.id === "ringview")
    g.quaternion.copy(frameQ(s.up, planets[8].pos.clone().sub(s.pos)));
  detailRoots.push({ p: planets[s.planet], objects: [g] });
  return g;
}
function pillar(g, x, z, h, material, w = 1) {
  return box(g, [w, h + 10, w], [x, (h - 10) / 2, z], material);
}
function platform(g, w, d, y, material) {
  box(g, [w, 0.7, d], [0, y, 0], material);
  for (const x of [-w / 2 + 1, w / 2 - 1])
    for (const z of [-d / 2 + 1, d / 2 - 1]) pillar(g, x, z, y, material, 0.5);
  return y + 0.35;
}
function ramp(g, width, length, y, z, material, sign = 1) {
  const p = nearest(g.position),
    far = z + (sign * length) / 2,
    probe = g.localToWorld(V(0, 0, far)),
    n = probe.clone().sub(p.pos).normalize(),
    bottom = g.worldToLocal(surfacePoint(p, n, -0.5)).y,
    top = y + 0.35,
    dy = top - bottom,
    actual = Math.hypot(length, dy);
  return box(
    g,
    [width, 0.4, actual],
    [0, (top + bottom) / 2, z],
    material,
    sign * Math.atan2(dy, length),
  );
}
function arch(g, x, z, height, width, material) {
  pillar(g, x - width / 2, z, height, material, 2);
  pillar(g, x + width / 2, z, height, material, 2);
  box(g, [width + 2, 2, 3], [x, height, z], material);
}
function glowGem(g, pos, c = 0xa4e7d3, size = 0.5) {
  const m = mesh(
    new THREE.OctahedronGeometry(size),
    mat(c, { emissive: c, emissiveIntensity: 1.3 }),
    g,
  );
  m.position.set(...pos);
  return m;
}
function consoleAt(s, g, label, states = 2) {
  box(g, [1.6, 1.2, 0.8], [0, 0.6, 7], mat(0x344d59));
  const screen = mesh(
    new THREE.BoxGeometry(1.4, 0.5, 0.12),
    mat(0x9edeb5, { emissive: 0x80c899, emissiveIntensity: 0.8 }),
    g,
  );
  screen.position.set(0, 1.2, 7.46);
  screen.rotation.x = -0.4;
  const it = {
    id: s.id,
    s,
    root: g,
    pos: g.localToWorld(V(0, 1.7, 9)),
    label,
    states,
    screen,
    parts: [],
  };
  instruments.push(it);
  return it;
}
function buildExpansion() {
  buildLegacyExpansion();
  const steel = mat(0x304852),
    stone = mat(0xc1bba0),
    gold = mat(0xc6a86c),
    white = mat(0xd3e2db),
    ice = mat(0x92c8dc, {
      metalness: 0.24,
      roughness: 0.2,
      transparent: true,
      opacity: 0.8,
    });
  for (const [key, list] of Object.entries(newSites)) {
    const i = +key,
      p = planets[i];
    for (let j = 0; j < 3; j++) {
      const [id, name, note] = list[j],
        s = site(
          id,
          name,
          i,
          note,
          id === "ringview" ? [0.1, 0.8, 0.6] : SITE_DIRS[j],
          0,
        ),
        g = rootSite(s),
        rock = mat(p.palette[1]);
      switch (id) {
        case "thermal": {
          const it = consoleAt(s, g, "普通 / 增强热流");
          for (const side of [-1, 1]) {
            pillar(g, side * 6, 0, 17, steel, 1.2);
            box(g, [4, 0.8, 4], [side * 6, 17, 0], gold);
          }
          const ring = mesh(new THREE.TorusGeometry(7, 0.5, 5, 32), gold, g);
          ring.position.y = 17;
          ring.rotation.x = Math.PI / 2;
          const pts = [];
          for (let k = 0; k < 100; k++)
            pts.push((rand() - 0.5) * 24, rand() * 100, (rand() - 0.5) * 24);
          const bg = new THREE.BufferGeometry();
          bg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
          const flow = new THREE.Points(
            bg,
            new THREE.PointsMaterial({
              color: 0xf5d6a4,
              size: 0.5,
              transparent: true,
              opacity: 0.6,
            }),
          );
          g.add(flow);
          effects.push({ type: "thermal", object: flow, it });
          break;
        }
        case "arcade":
          for (let k = 0; k < 3; k++) arch(g, 0, -k * 10, 9 + k * 2, 9, rock);
          break;
        case "sundial": {
          platform(g, 15, 15, 0.4, rock);
          pillar(g, 0, 0, 7, gold, 0.45);
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4,
              m = mesh(
                new THREE.BoxGeometry(2, 3, 0.3),
                mat(0xdce3ce, { metalness: 0.75, roughness: 0.16 }),
                g,
              );
            m.position.set(Math.sin(a) * 8, 2, Math.cos(a) * 8);
            m.lookAt(V(0, 3, 0));
            obstacles.push({
              pos: g.localToWorld(m.position.clone()),
              r: 1.1,
              p,
            });
          }
          break;
        }
        case "heatwell": {
          const it = consoleAt(s, g, "热井照明");
          const basin = mesh(
            new THREE.TorusGeometry(5, 1.1, 5, 24),
            mat(0x292c3a),
            g,
          );
          basin.rotation.x = Math.PI / 2;
          basin.position.y = 0.4;
          for (let k = 0; k < 6; k++) {
            const a = (k * Math.PI) / 3;
            pillar(g, Math.sin(a) * 5.8, Math.cos(a) * 5.8, 3, steel, 0.4);
            it.parts.push(
              glowGem(
                g,
                [Math.sin(a) * 5.8, 3.2, Math.cos(a) * 5.8],
                0xff925e,
                0.5,
              ),
            );
          }
          for (let k = 0; k < 7; k++) {
            const pts = [];
            for (let j = 0; j <= 20; j++) {
              const a = k * 2.4,
                x = Math.sin(a) * (3 + j * 0.6),
                z = Math.cos(a) * (3 + j * 0.6),
                probe = g.localToWorld(V(x, 0, z)),
                n = probe.sub(p.pos).normalize();
              pts.push(surfacePoint(p, n, 0.09));
            }
            const line = new THREE.Line(
              new THREE.BufferGeometry().setFromPoints(pts),
              new THREE.LineBasicMaterial({ color: 0xee956d }),
            );
            scene.add(line);
            detailRoots.push({ p, objects: [line] });
          }
          break;
        }
        case "glassforest":
          for (let k = 0; k < 17; k++) {
            const a = k * 2.4,
              h = 4 + (k % 5) * 1.3,
              x = Math.sin(a) * (3 + k * 0.45),
              z = Math.cos(a) * (3 + k * 0.45),
              ob = mesh(
                new THREE.CylinderGeometry(0.1, 1.2, h, 6),
                mat(k % 2 ? 0x29293b : 0x564468, {
                  metalness: 0.6,
                  roughness: 0.18,
                }),
                g,
              );
            ob.position.set(x, h / 2 - 0.5, z);
            obstacles.push({ pos: g.localToWorld(V(x, 1, z)), r: 1.2, p });
            glowGem(g, [x, h - 0.5, z], 0xa886be, 0.23);
          }
          break;
        case "emberwall":
          for (let k = 0; k < 12; k++) {
            if (k % 6 === 0) continue;
            const a = (k * Math.PI) / 6,
              x = Math.sin(a) * 10,
              z = Math.cos(a) * 10,
              b = box(g, [4, 12, 3], [x, 1, z], rock);
            b.rotation.y = a;
            glowGem(g, [x, 5.2, z], 0xef8a69, 0.25);
          }
          break;
        case "survey": {
          const it = consoleAt(s, g, "待机 / 扫描");
          pillar(g, 0, 0, 14, steel, 0.5);
          const dish = mesh(new THREE.ConeGeometry(3, 1, 12, 1, true), gold, g);
          dish.position.y = 14;
          dish.rotation.x = 0.75;
          effects.push({ type: "scan", object: dish, it });
          break;
        }
        case "brokenbridge": {
          for (let k = 0; k < 3; k++) {
            const z = -10 + k * 10;
            box(g, [5, 0.7, 7], [0, 3, z], stone);
            pillar(g, 0, z, 3, steel, 0.7);
            for (const side of [-1, 1]) pillar(g, side * 2, z, 5, steel, 0.13);
          }
          ramp(g, 5, 15, 3, 20, stone);
          ramp(g, 5, 15, 3, -20, stone, -1);
          break;
        }
        case "impact": {
          const m = mat(0x9b9c9a);
          for (let k = 0; k < 2; k++) {
            const r = mesh(
              new THREE.TorusGeometry(7 + k * 5, 0.65, 5, 36),
              m,
              g,
            );
            r.rotation.x = Math.PI / 2;
            r.position.y = -0.3 - k * 0.4;
          }
          for (let k = 0; k < 8; k++) {
            const a = k * 0.785,
              ob = mesh(new THREE.IcosahedronGeometry(1.5, 0), rock, g);
            ob.position.set(Math.sin(a) * 11, 0.2, Math.cos(a) * 11);
            obstacles.push({
              pos: g.localToWorld(ob.position.clone()),
              r: 1.5,
              p,
            });
          }
          break;
        }
        case "aurora": {
          consoleAt(s, g, "青 / 紫 / 暖极光", 3);
          for (let k = 0; k < 3; k++) {
            pillar(g, -7 + k * 7, -3, 6 + k, steel, 0.3);
            glowGem(g, [-7 + k * 7, 6 + k, -3], 0x9de6cb, 0.8);
          }
          break;
        }
        case "icegate":
          for (let k = 0; k < 4; k++) {
            const side = k % 2 ? 1 : -1,
              z = -12 + k * 7,
              b = box(g, [3, 24, 9], [side * 7, 5, z], ice);
            b.rotation.z = side * 0.16;
            box(g, [18, 3, 6], [0, 16, z], ice);
          }
          break;
        case "coldroom": {
          platform(g, 16, 22, 2.5, steel);
          box(g, [2.2, 1.1, 7], [5, 3.4, -1], steel);
          for (let a = 0; a < 3; a++) {
            const sample = mesh(new THREE.ConeGeometry(0.55, 1.7, 5), ice, g);
            sample.position.set(5, 4.8, -3 + a * 2);
            glowGem(g, [6.4, 5.2, -3 + a * 2], 0xb4e4d8, 0.17);
          }
          box(g, [2.5, 0.5, 7], [-5, 3.7, 0], white);
          for (const side of [-1, 1]) {
            box(g, [1, 10, 22], [side * 8, 6, 0], white);
            box(g, [0.12, 4, 17], [side * 7.4, 7, 0], ice);
          }
          box(g, [17, 1, 23], [0, 11, 0], white);
          ramp(g, 6, 22, 2.5, 22, steel);
          ramp(g, 6, 22, 2.5, -22, steel, -1);
          for (let k = 0; k < 4; k++) {
            box(g, [0.15, 0.05, 9], [-3 + k * 2, 2.88, 0], gold);
            glowGem(g, [-6 + k * 4, 10, 0], 0x8be1df, 0.4);
          }
          break;
        }
        case "fogtower": {
          const it = consoleAt(s, g, "普通 / 减雾视野");
          pillar(g, 0, 0, 16, steel, 0.8);
          for (let k = 0; k < 3; k++) {
            const ring = mesh(
              new THREE.TorusGeometry(3 - k * 0.5, 0.15, 4, 24),
              mat(0xafd8cc, { emissive: 0x66c7ae, emissiveIntensity: 0.8 }),
              g,
            );
            ring.position.y = 12 + k * 2;
            ring.rotation.x = Math.PI / 2;
            it.parts.push(ring);
          }
          glowGem(g, [0, 17, 0], 0xc7f1d3, 1.5);
          break;
        }
        case "mushrooms":
        case "luminous": {
          const count = id === "mushrooms" ? 13 : 10;
          for (let k = 0; k < count; k++) {
            const x =
                id === "luminous"
                  ? k % 2
                    ? 5
                    : -5
                  : Math.sin(k * 2.4) * (4 + k * 0.5),
              z =
                id === "luminous"
                  ? Math.floor(k / 2) * 6 - 12
                  : Math.cos(k * 2.4) * (4 + k * 0.5),
              h = 4 + (k % 4) * 1.8;
            const stem = mesh(
              new THREE.CylinderGeometry(0.48, 0.8, h + 5, 7),
              mat(0xa2b9aa),
              g,
            );
            stem.position.set(x, (h - 5) / 2, z);
            obstacles.push({ pos: g.localToWorld(V(x, 1, z)), r: 0.85, p });
            const cap = mesh(
              new THREE.SphereGeometry(
                2.8,
                8,
                5,
                0,
                Math.PI * 2,
                0,
                Math.PI / 2,
              ),
              mat(k % 2 ? 0x85c6b2 : 0xa294c7, {
                emissive: k % 2 ? 0x3c907c : 0x6f548e,
                emissiveIntensity: 0.8,
              }),
              g,
            );
            cap.position.set(x, h, z);
            cap.scale.y = 0.6;
            const underside = mesh(
              new THREE.CircleGeometry(2.8, 8),
              mat(0xd0d9bf, {
                side: THREE.DoubleSide,
                emissive: 0x688b7f,
                emissiveIntensity: 0.35,
              }),
              g,
            );
            underside.position.set(x, h - 0.02, z);
            underside.rotation.x = -Math.PI / 2;
          }
          if (id === "luminous")
            for (let k = 0; k < 3; k++) arch(g, 0, k * 8 - 8, 10, 12, steel);
          break;
        }
        case "weather": {
          const it = consoleAt(s, g, "待机 / 风向测量");
          pillar(g, 0, 0, 18, steel, 0.7);
          const rotor = new THREE.Group();
          g.add(rotor);
          rotor.position.y = 18;
          for (let k = 0; k < 3; k++) {
            const a = k * 2.094,
              b = mesh(new THREE.BoxGeometry(0.6, 6, 0.22), gold, rotor);
            b.position.set(Math.sin(a) * 3, Math.cos(a) * 3, 0);
            b.rotation.z = -a;
          }
          glowGem(g, [0, 18, 0.3], 0xb8debe, 0.6);
          effects.push({ type: "wind", object: rotor, it });
          break;
        }
        case "ringport": {
          platform(g, 24, 24, 2, steel);
          ramp(g, 7, 22, 2, 23, steel);
          const ring = mesh(new THREE.TorusGeometry(9, 0.18, 4, 40), gold, g);
          ring.rotation.x = Math.PI / 2;
          ring.position.y = 2.4;
          for (let k = 0; k < 8; k++)
            glowGem(
              g,
              [
                Math.sin((k * Math.PI) / 4) * 11,
                2.6,
                Math.cos((k * Math.PI) / 4) * 11,
              ],
              0xc3e4b5,
              0.35,
            );
          break;
        }
        case "ringstones":
          for (let k = 0; k < 5; k++) {
            const r = mesh(
              new THREE.TorusGeometry(5 + k * 0.7, 0.6, 5, 28),
              stone,
              g,
            );
            r.position.set((k - 2) * 10, 4, -Math.abs(k - 2) * 4);
            r.rotation.y = (k - 2) * 0.25;
            for (const side of [-1, 1])
              pillar(
                g,
                (k - 2) * 10 + side * 4,
                -Math.abs(k - 2) * 4,
                4,
                steel,
                0.5,
              );
          }
          break;
        case "resonator": {
          const it = consoleAt(s, g, "三组共鸣序列", 3);
          for (let k = 0; k < 3; k++) {
            const fork = new THREE.Group();
            g.add(fork);
            fork.position.set((k - 1) * 6, 0, -2);
            pillar(fork, 0, 0, 3, steel, 0.5);
            box(fork, [3, 0.4, 0.5], [0, 3, 0], gold);
            for (const side of [-1, 1])
              box(fork, [0.4, 4 + k, 0.5], [side * 1.3, 5 + k / 2, 0], gold);
            effects.push({ type: "sound", object: fork, it, index: k });
          }
          break;
        }
        case "dome": {
          for (let k = 0; k < 7; k++) {
            const rib = mesh(
              new THREE.TorusGeometry(9, 0.38, 5, 24, Math.PI),
              stone,
              g,
            );
            rib.rotation.y = (k * Math.PI) / 6;
            rib.position.y = 0.3;
            for (const side of [-1, 1])
              pillar(
                g,
                side * 9 * Math.cos((k * Math.PI) / 6),
                -side * 9 * Math.sin((k * Math.PI) / 6),
                0.6,
                stone,
                0.8,
              );
          }
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4;
            pillar(g, Math.sin(a) * 9, Math.cos(a) * 9, 0.4, rock, 0.7);
          }
          break;
        }
        case "soundbridge": {
          platform(g, 6, 22, 3, stone);
          ramp(g, 6, 20, 3, 21, stone);
          ramp(g, 6, 20, 3, -21, stone, -1);
          for (let k = 0; k < 6; k++)
            pillar(
              g,
              k % 2 ? 5 : -5,
              Math.floor(k / 2) * 7 - 7,
              5 + (k % 3),
              rock,
              1.5,
            );
          break;
        }
        case "relay": {
          const it = consoleAt(s, g, "方向灯 A / B");
          pillar(g, 0, 0, 12, steel, 0.5);
          const dish = mesh(
            new THREE.ConeGeometry(4, 1.4, 12, 1, true),
            white,
            g,
          );
          dish.position.y = 12;
          dish.rotation.x = 0.8;
          for (const side of [-1, 1])
            it.parts.push(glowGem(g, [side * 4, 2, 0], 0xa8e8d6, 0.8));
          break;
        }
        case "saltmirror": {
          const mirror = mesh(
            new THREE.CircleGeometry(13, 40),
            mat(0xc8e5df, { metalness: 0.65, roughness: 0.11 }),
            g,
          );
          mirror.rotation.x = -Math.PI / 2;
          mirror.position.y = 0.15;
          for (let k = 0; k < 10; k++) {
            const a = (k * Math.PI) / 5,
              c = mesh(new THREE.CylinderGeometry(0.15, 0.6, 1.8, 5), white, g);
            c.position.set(Math.sin(a) * 14, 0.3, Math.cos(a) * 14);
          }
          break;
        }
        case "ringview": {
          platform(g, 15, 17, 3.5, steel);
          ramp(g, 6, 26, 3.5, 21, steel);
          for (const side of [-1, 1]) {
            box(g, [0.18, 1.2, 17], [side * 7, 4.4, 0], white);
            for (let k = 0; k < 3; k++)
              pillar(g, side * 7, -7 + k * 7, 4.8, white, 0.16);
          }
          box(g, [14, 1.2, 0.2], [0, 4.4, -8], white);
          break;
        }
      }
      if (!instruments.some((it) => it.id === id)) {
        glowGem(g, [5, 1.8, 7], 0xbfe3c7, 0.35);
        pillar(g, 5, 7, 1.7, steel, 0.15);
      }
    }
  }
  buildRings();
  buildAurora();
  buildStarSurface();
  refreshInstruments();
}
function buildRings() {
  const p = planets[8],
    root = new THREE.Group();
  scene.add(root);
  root.position.copy(p.pos);
  root.rotation.set(0.35, 0, -0.38);
  for (let k = 0; k < 4; k++) {
    const r = mesh(
      new THREE.RingGeometry(570 + k * 70, 615 + k * 70, 100),
      new THREE.MeshBasicMaterial({
        color: 0xcbbd97,
        transparent: true,
        opacity: 0.13 + k * 0.025,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      root,
    );
    r.rotation.x = -Math.PI / 2;
  }
  const count = 220,
    inst = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 0),
      mat(0xb7ae98),
      count,
    );
  root.add(inst);
  const d = new THREE.Object3D();
  root.updateMatrixWorld(true);
  for (let k = 0; k < count; k++) {
    const a = rand() * Math.PI * 2,
      r = 585 + rand() * 240,
      sc = 2 + rand() * 9;
    d.position.set(Math.sin(a) * r, (rand() - 0.5) * 12, Math.cos(a) * r);
    d.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    d.scale.set(sc, sc * 0.55, sc * 0.8);
    d.updateMatrix();
    inst.setMatrixAt(k, d.matrix);
    if (sc > 6)
      obstacles.push({
        pos: root.localToWorld(d.position.clone()),
        r: sc * 0.8,
        p,
        inertialRing:true,
      });
  }
  p.rings = root;
}
function buildAurora() {
  const p = planets[6],
    r = p.r * 0.82,
    geo = new THREE.BufferGeometry(),
    positions = [],
    uv = [];
  for (let k = 0; k <= 100; k++) {
    const a = (k / 100) * Math.PI * 2;
    for (let j = 0; j < 2; j++) {
      positions.push(
        Math.sin(a) * r,
        p.r + 55 + j * 65 + Math.sin(a * 5) * 12,
        Math.cos(a) * r,
      );
      uv.push(k / 100, j);
    }
  }
  const idx = [];
  for (let k = 0; k < 100; k++) {
    const a = k * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: { time: { value: 0 }, phase: { value: 0 } },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:
      "varying vec2 vUv;uniform float time;uniform float phase;void main(){float wave=.5+.5*sin(vUv.x*105.+time*.5+sin(vUv.x*31.)*3.);vec3 a=phase<.5?vec3(.25,.9,.65):phase<1.5?vec3(.65,.4,.95):vec3(.95,.64,.35);gl_FragColor=vec4(a,sin(vUv.y*3.14159)*(.18+.33*wave));}",
  });
  const m = mesh(geo, material);
  m.position.copy(p.pos);
  effects.push({ type: "aurora", object: m });
}
function buildStarSurface() {
  sunMesh.material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader:
      "varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:
      "varying vec3 p;uniform float time;void main(){float f=sin(p.y*.04+sin(p.x*.027+time*.12)*2.+sin(p.z*.02-time*.07));vec3 c=mix(vec3(.95,.32,.08),vec3(1.,.87,.42),f*.5+.5);gl_FragColor=vec4(c,1.);}",
  });
  effects.push({ type: "star", object: sunMesh });
}
function nearbyInstrument() {
  if (driving) return null;
  let best = null,
    d = 6;
  for (const it of instruments) {
    const n = player.pos.distanceTo(it.pos);
    if (n < d) {
      best = it;
      d = n;
    }
  }
  return best;
}
function useInstrument() {
  const it = nearbyInstrument();
  if (!it) {
    toast("靠近带浅绿色屏幕的仪器，至 6 米内按 G。", 3);
    return false;
  }
  actions[it.id] = ((actions[it.id] || 0) + 1) % it.states;
  refreshInstruments();
  if (it.id === "resonator") playSequence(actions[it.id]);
  else sound("discover");
  scanSites();
  toast(it.s.name + " · " + instrumentReadout(it), 5);
  saveGame(false);
  return true;
}
function instrumentReadout(it) {
  const v = actions[it.id] || 0,
    p = planets[it.s.planet];
  if (it.id === "thermal")
    return v ? "热流增强：中心约 9 m/s²" : "普通热流：中心约 6.8 m/s²";
  if (it.id === "heatwell") return v ? "照明：暖光增强" : "照明：低亮度";
  if (it.id === "survey")
    return v
      ? "扫描：半径 " + p.r + " m / 表面 " + p.g + " m/s² / 母星赤岬"
      : "测绘待机";
  if (it.id === "aurora") return ["青绿色相位", "紫色相位", "暖金相位"][v];
  if (it.id === "fogtower")
    return v ? "减雾滤镜已开启（非清除薄雾）" : "普通视野";
  if (it.id === "weather")
    return v ? "横风测量：高空约 0.4–1.35 m/s²" : "风向仪待机（横风仍存在）";
  if (it.id === "resonator")
    return [
      "回声 1：220 / 277 / 330 Hz",
      "回声 2：262 / 330 / 392 Hz",
      "回声 3：294 / 370 / 440 Hz",
    ][v];
  return v ? "方向灯 B / 母星环岚" : "方向灯 A / 母星环岚";
}
function refreshInstruments() {
  for (const it of instruments) {
    const v = actions[it.id] || 0;
    it.screen.material.color.set(v ? 0xe3d398 : 0x9edeb5);
    for (const part of it.parts)
      part.material.emissiveIntensity = v ? 1.6 : 0.45;
  }
}
function playSequence(index) {
  if (!audio) return;
  const freqs = [
    [220, 277, 330],
    [262, 330, 392],
    [294, 370, 440],
  ][index];
  freqs.forEach((hz, k) => {
    const o = audio.ctx.createOscillator(),
      g = audio.ctx.createGain(),
      t = audio.ctx.currentTime + k * 0.3;
    o.type = "sine";
    o.frequency.value = hz;
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.24, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    o.connect(g);
    g.connect(audio.master);
    o.start(t);
    o.stop(t + 1);
  });
}
function updateSystemVisuals(dt) {
  if(paused || !started)dt=0;
  const pos = started ? (driving ? ship.pos : player.pos) : camera.position;
  for (const e of detailRoots) {
    const visible = pos.distanceTo(e.p.pos) < e.p.r * 7 + 500;
    for (const o of e.objects) o.visible = visible;
  }
  for (const e of effects) {
    if (e.type === "star") e.object.material.uniforms.time.value = elapsed;
    if (e.type === "aurora") {
      e.object.material.uniforms.time.value = elapsed;
      e.object.material.uniforms.phase.value = actions.aurora || 0;
    }
    if (e.type === "thermal") {
      const a = e.object.geometry.attributes.position;
      for (let k = 0; k < a.count; k++) {
        const y = a.getY(k) + dt * (actions.thermal ? 18 : 12);
        a.setY(k, y > 100 ? 0 : y);
      }
      a.needsUpdate = true;
    }
    if (e.type === "scan")
      e.object.rotation.y = actions.survey ? elapsed * 0.22 : 0;
    if (e.type === "wind")
      e.object.rotation.z += dt * (1.3 + Math.sin(elapsed * 0.37) * 0.5);
    if (e.type === "sound")
      e.object.rotation.z =
        Math.sin(elapsed * 3 + e.index) *
        0.016 *
        (1 + (actions.resonator || 0));
  }
}
function updateCamera(dt) {
  legacyUpdateCamera(dt);
  const p = nearest(camera.position),
    h = altitude(camera.position, p);
  if (p.theme === "mist" && h < 155) {
    scene.fog = new THREE.FogExp2(
      0x304e61,
      clamp(1 - h / 155, 0, 1) * (actions.fogtower ? 0.002 : 0.006),
    );
    skyMesh.material.color.set(0x304b63);
    skyMesh.material.opacity = clamp(1 - h / 180, 0, 1) * 0.43;
  } else skyMesh.material.color.set(0x477788);
}
function contentHUD() {
  legacyUpdateHUD();
  const p = nearest(driving ? ship.pos : player.pos),
    h = altitude(driving ? ship.pos : player.pos, p),
    force = environmentForce(driving ? ship.pos : player.pos).length();
  let label = "";
  if (p.theme === "ice" && h < 35) label = "蓝冰地表 · 低摩擦，提前停步";
  if (p.theme === "mist" && h < 155)
    label = actions.fogtower ? "雾灯 · 减雾滤镜开启" : "雾灯 · 近地薄雾";
  if (p.theme === "wind" && h < 160)
    label = "高地横风 · " + force.toFixed(2) + " m/s²";
  if (p.theme === "dune" && force > 0.1)
    label = "热上升气流 · " + force.toFixed(1) + " m/s²";
  if ((driving ? ship : player).pos.distanceTo(starPos) < SYSTEM.star.r + 500)
    label = "曦心热边界 · 不可降落";
  $("envStatus").textContent = label;
  $("envStatus").classList.toggle("hidden", !label);
  $("region").textContent =
    (driving ? "FLIGHT" : "EXPLORER") +
    " / " +
    String(p.index + 1).padStart(2, "0");
  const it = nearbyInstrument();
  if (it) {
    $("interaction").innerHTML = "<kbd>G</kbd> " + it.s.name + " · 操作仪器";
    $("interaction").style.display = "block";
  }
  if (!driving)
    $("hintline").textContent =
      "WASD 行走 · Space 跳跃 / 喷气 · E 登船 · G 仪器 · M 星图 · J 日志 · O 设置";
}
function targetPoint() {
  if (navSite === "sun")
    return {
      name: "曦心 · 热边界",
      point: starPos.clone(),
      planet: { pos: starPos, r: SYSTEM.star.r + 125 },
      surface: false,
    };
  return legacyTargetPoint();
}
function bodyButton(p) {
  return (
    '<button class="' +
    (p.kind === "moon" ? "moon " : "") +
    (navSite !== "sun" && targetIndex === p.index ? "active" : "") +
    '" data-planet="' +
    p.index +
    '"><span class="mini-orb" style="background:#' +
    p.color.toString(16) +
    '"></span>' +
    (p.kind === "moon" ? "— " : "") +
    p.name +
    "<small>" +
    (visited.has(p.index) ? "已到访" : p.kind === "moon" ? "卫星" : "行星") +
    "</small></button>"
  );
}
function contentCreateMap() {
  let html =
    '<button class="' +
    (navSite === "sun" ? "active" : "") +
    '" data-sun><span class="mini-orb" style="background:#efbc75"></span>曦心<small>恒星</small></button>';
  for (const p of planets.filter((p) => p.kind === "planet")) {
    html += bodyButton(p);
    for (const m of planets.filter((m) => m.parent === p.index))
      html += bodyButton(m);
  }
  $("planetList").innerHTML = html;
  $("planetList")
    .querySelectorAll("[data-planet]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          targetIndex = +b.dataset.planet;
          navSite = null;
          createMap();
        }),
    );
  $("planetList").querySelector("[data-sun]").onclick = () => {
    navSite = "sun";
    createMap();
  };
  const p = planets[targetIndex],
    isStar = navSite === "sun";
  $("bodyDetail").innerHTML = isStar
    ? '<div class="eyebrow">CENTRAL STAR / 不可着陆</div><h3>曦心</h3><p>中心恒星。接近热边界会被缓冲推离；所有固态世界均可直接飞抵。</p><div class="body-meta">半径 620 m · 弱引力 · 热边界 745 m</div>'
    : '<div class="eyebrow">' +
      (p.kind === "moon"
        ? "MOON / " + planets[p.parent].name + "的卫星"
        : "PLANET / " + SYSTEM.name) +
      "</div><h3>" +
      p.name +
      "</h3><p>" +
      p.environment +
      '</p><div class="body-meta">半径 ' +
      p.r +
      " m · 表面 " +
      p.g +
      " m/s²<br>" +
      p.description +
      "</div>";
  $("siteList").innerHTML = isStar
    ? "<p>无地表地标。恒星不是任务目标或可进入场景。</p>"
    : sites
        .filter((s) => s.planet === targetIndex)
        .map(
          (s) =>
            '<button class="site-row ' +
            (navSite === s.id ? "selected" : "") +
            '" data-site="' +
            s.id +
            '"><span>' +
            s.name +
            "</span><small>" +
            (discovered.has(s.id) ? "已记录" : "未记录") +
            (instruments.some((it) => it.id === s.id) ? " · G 仪器" : "") +
            "　→</small></button>",
        )
        .join("");
  $("siteList")
    .querySelectorAll("button")
    .forEach(
      (b) =>
        (b.onclick = () => {
          navSite = b.dataset.site;
          createMap();
          toast("导航：" + sites.find((s) => s.id === navSite).name, 2);
        }),
    );
  drawSystemMap();
}
function staticDrawSystemMap() {
  const c = $("systemMap"),
    ctx = c.getContext("2d"),
    w = c.clientWidth || 900,
    h = c.clientHeight || 245;
  c.width = Math.round(w * devicePixelRatio);
  c.height = Math.round(h * devicePixelRatio);
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const all = [
      { name: "曦心", pos: starPos, r: 620, color: 0xefbc75, index: -1 },
      ...planets,
    ],
    xy = (pos) => [
      55 + ((pos.x + 9500) / 17000) * (w - 110),
      h - 42 + ((pos.z - 1000) / 15000) * (h - 82),
    ];
  const [sx, sy] = xy(starPos);
  ctx.strokeStyle = "#48646c55";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 7]);
  for (const p of planets.filter((x) => x.kind === "planet")) {
    const [x, y] = xy(p.pos);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  mapHits = [];
  for (const p of all) {
    const [x, y] = xy(p.pos),
      r = p.index === -1 ? 12 : p.kind === "moon" ? 5 : 8;
    if (p.kind === "moon") {
      const [px, py] = xy(planets[p.parent].pos);
      ctx.strokeStyle = "#a4c3b955";
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    const selected =
      p.index === -1
        ? navSite === "sun"
        : targetIndex === p.index && navSite !== "sun";
    ctx.fillStyle = "#" + p.color.toString(16);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (selected) {
      ctx.strokeStyle = "#d5edb4";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.kind !== "moon" || selected) {
      ctx.fillStyle = selected ? "#d5edb4" : "#d2e2d8";
      ctx.font = (selected ? "500 " : "") + "14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(p.name, x, y - 19);
    }
    mapHits.push({ x, y, index: p.index });
  }
  ctx.textAlign = "left";
  ctx.fillStyle = "#91ada7";
  ctx.font = "13px system-ui";
  ctx.fillText("静态勘探 · 不公转 / 不自转", 24, h - 15);
  c.onclick = (e) => {
    const r = c.getBoundingClientRect(),
      x = ((e.clientX - r.left) / r.width) * w,
      y = ((e.clientY - r.top) / r.height) * h;
    let best = null,
      d = 22;
    for (const hit of mapHits) {
      const n = Math.hypot(x - hit.x, y - hit.y);
      if (n < d) {
        d = n;
        best = hit;
      }
    }
    if (best) {
      if (best.index === -1) navSite = "sun";
      else {
        targetIndex = best.index;
        navSite = null;
      }
      createMap();
    }
  };
}
function renderJournal() {
  $("journalSummary").textContent =
    "已记录 " +
    discovered.size +
    " / " +
    sites.length +
    " 处地标 · 9 处可操作仪器。徒步靠近自动记录，没有探索顺序或任务门槛。";
  $("journalList").innerHTML = planets
    .map(
      (p) =>
        '<h3 class="journal-body-head">' +
        p.name +
        " / " +
        (p.kind === "moon" ? planets[p.parent].name + "的卫星" : "行星") +
        "</h3>" +
        sites
          .filter((s) => s.planet === p.index)
          .map((s) => {
            const known = discovered.has(s.id),
              it = instruments.find((x) => x.id === s.id);
            return (
              '<article class="journal-entry ' +
              (known ? "" : "unseen") +
              '"><small>' +
              (known ? "已记录" : "未记录") +
              "</small><h3>" +
              s.name +
              "</h3><p>" +
              (known ? s.note : "M 星图可选地表导航。亲自靠近后记录观察。") +
              "</p>" +
              (known && it
                ? '<p class="instrument-info">G 仪器 / ' +
                  instrumentReadout(it) +
                  "</p>"
                : "") +
              "</article>"
            );
          })
          .join(""),
    )
    .join("");
}
function setupExpansion() {
  legacySetupExpansion();
  window.addEventListener("resize", () => {
    if (modal === "map") createMap();
  });
  if (resumeData?.version === 3)
    saveStatus = "发现 0.3 存档 · 继续后迁移；原存档保留。";
}
