// landmarks.js — 地标：东京塔（程序化格构）、晴空塔（镂空纹理+旋成体）、涩谷路口四角
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TOWER, SKYTREE, makeRng } from './layout.js';
import { nightEmissive } from './fx.js';
import { addNightLight } from './env.js';
import { makeVerticalSignTexture, makeBillboardTexture, makeScreenTexture, registerScreen, decorateBuildings } from './signs.js';

export function buildLandmarks(scene) {
  const g = new THREE.Group();
  g.name = 'landmarks';
  buildTokyoTower(g);
  buildSkytree(g);
  scene.add(g);
  const crossingBuildings = buildCrossing(scene, g);
  return crossingBuildings;
}

// ================= 东京塔 333m =================
function buildTokyoTower(parent) {
  const g = new THREE.Group();
  g.position.set(TOWER.x, 0, TOWER.z);

  const halfSide = (h) => 8 + 24 * Math.pow(1 - Math.min(h / 260, 1), 1.35);

  const struts = [];
  const UP = new THREE.Vector3(0, 1, 0);
  const corner = (h, i) => {
    const w = halfSide(h);
    const sx = i === 0 || i === 3 ? 1 : -1;
    const sz = i === 0 || i === 1 ? 1 : -1;
    return new THREE.Vector3(sx * w, h, sz * w);
  };
  const strut = (a, b, thick) => {
    const dir = b.clone().sub(a);
    const len = dir.length();
    const geo = new THREE.BoxGeometry(thick, len, thick);
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
    const mm = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
    geo.applyMatrix4(mm);
    struts.push(geo);
  };

  const bands = 22, topH = 250;
  for (let i = 0; i < bands; i++) {
    const h0 = (i / bands) * topH, h1 = ((i + 1) / bands) * topH;
    for (let c = 0; c < 4; c++) {
      strut(corner(h0, c), corner(h1, c), i < 6 ? 1.5 : 0.9); // 角柱
      strut(corner(h1, c), corner(h1, (c + 1) % 4), i < 6 ? 1.1 : 0.7); // 水平环
      strut(corner(h0, c), corner(h1, (c + 1) % 4), 0.5); // 斜撑 ×2（面斜杆）
      strut(corner(h0, c), corner(h1, (c + 3) % 4), 0.5);
    }
  }
  // 底部四条腿加粗
  for (let c = 0; c < 4; c++) strut(corner(0, c), corner(18, c), 3.2);

  const orangeMat = nightEmissive(
    new THREE.MeshStandardMaterial({ color: 0xe04f17, roughness: 0.55, metalness: 0.25, emissive: 0xff8c1a, emissiveIntensity: 1 }),
    1.1
  );
  const lattice = new THREE.Mesh(mergeGeometries(struts), orangeMat);
  lattice.castShadow = true;
  g.add(lattice);

  // 主展望台 145m、顶级展望台 245m、天线
  const whiteMat = nightEmissive(
    new THREE.MeshStandardMaterial({ color: 0xf2f3f0, roughness: 0.5, metalness: 0.15, emissive: 0xffd9a8, emissiveIntensity: 1 }),
    0.7
  );
  const deck = new THREE.Mesh(new THREE.BoxGeometry(40, 12, 40), whiteMat);
  deck.position.y = 152;
  deck.castShadow = true;
  g.add(deck);
  const deckWin = new THREE.Mesh(
    new THREE.BoxGeometry(40.6, 3.2, 40.6),
    nightEmissive(new THREE.MeshStandardMaterial({ color: 0x1a2028, emissive: 0xffc890, emissiveIntensity: 1 }), 1.2)
  );
  deckWin.position.y = 152;
  g.add(deckWin);
  const topDeck = new THREE.Mesh(new THREE.BoxGeometry(18, 7, 18), whiteMat);
  topDeck.position.y = 248;
  g.add(topDeck);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 2.4, 85, 8), whiteMat);
  ant.position.y = 250 + 42.5;
  g.add(ant);
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff2222, emissiveIntensity: 1.6 })
  );
  beacon.position.y = 334;
  g.add(beacon);

  // 泛光：塔基公园与主展望台在夜里被泛光灯打亮
  addNightLight(g, new THREE.Vector3(0, 30, 0), 0xff9a40, 26000);
  addNightLight(g, new THREE.Vector3(0, 152, 0), 0xffb060, 12000);

  parent.add(g);
}

// ================= 东京晴空塔 634m =================
function buildSkytree(parent) {
  const g = new THREE.Group();
  g.position.set(SKYTREE.x, 0, SKYTREE.z);

  // 半径轮廓（分段线性，均匀采样保证 lathe 的 v 均匀）
  const keys = [
    [0, 27], [40, 16], [120, 10.5], [200, 9], [240, 9.5],
    [252, 9.5], [258, 20], [266, 20], [272, 10],  // 第一展望台（实际 350m，压缩到 258 保比例观感）
    [330, 8.5], [336, 8.5], [342, 15], [350, 15], [356, 8],
    [430, 6], [500, 3.6], [560, 1.8], [620, 1.1], [634, 0.6],
  ];
  const radiusAt = (h) => {
    for (let i = 0; i < keys.length - 1; i++) {
      const [h0, r0] = keys[i], [h1, r1] = keys[i + 1];
      if (h <= h1) return r0 + ((h - h0) / (h1 - h0)) * (r1 - r0);
    }
    return keys[keys.length - 1][1];
  };
  const pts = [];
  const N = 56;
  for (let i = 0; i <= N; i++) {
    const h = (i / N) * 634;
    pts.push(new THREE.Vector2(Math.max(0.4, radiusAt(h)), h));
  }
  const lat = new THREE.LatheGeometry(pts, 28);

  const c = document.createElement('canvas');
  c.width = 128; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.strokeStyle = 'rgba(226,232,240,1)';
  ctx.lineWidth = 5;
  for (let x = -512; x <= 512; x += 22) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 128, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, 512); ctx.lineTo(x + 128, 0); ctx.stroke();
  }
  ctx.lineWidth = 8;
  for (let y = 0; y <= 512; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(128, y); ctx.stroke();
  }
  const latticeTex = new THREE.CanvasTexture(c);
  latticeTex.wrapS = latticeTex.wrapT = THREE.RepeatWrapping;
  latticeTex.repeat.set(18, 6);

  const latticeMat = new THREE.MeshStandardMaterial({
    map: latticeTex, alphaMap: latticeTex, transparent: false, alphaTest: 0.25,
    side: THREE.DoubleSide, color: 0xf4f7fa, roughness: 0.5, metalness: 0.3,
    emissive: 0x9aa8c0, emissiveIntensity: 0.32, // 抬亮背光面；夜里近似“点亮”状态
  });
  const shell = new THREE.Mesh(lat, latticeMat);
  shell.castShadow = true;
  g.add(shell);

  // 塔基绿地
  const base = new THREE.Mesh(
    new THREE.CircleGeometry(130, 28),
    new THREE.MeshStandardMaterial({ color: 0x4a6337, roughness: 1 })
  );
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.08;
  base.receiveShadow = true;
  g.add(base);
  const rngT = makeRng(8080);
  const tN = 26;
  const trunkGeoT = new THREE.CylinderGeometry(0.2, 0.3, 4, 5);
  trunkGeoT.translate(0, 2, 0);
  const crownGeoT = new THREE.IcosahedronGeometry(2.6, 1);
  crownGeoT.translate(0, 5.6, 0);
  const trunkMeshT = new THREE.InstancedMesh(trunkGeoT, new THREE.MeshStandardMaterial({ color: 0x5d4a36, roughness: 1 }), tN);
  const crownMeshT = new THREE.InstancedMesh(crownGeoT, new THREE.MeshStandardMaterial({ color: 0x33612f, roughness: 1, flatShading: true }), tN);
  {
    const mm = new THREE.Matrix4();
    for (let i = 0; i < tN; i++) {
      const a = rngT() * Math.PI * 2, rr = 40 + rngT() * 80;
      const s = 1.1 + rngT() * 0.7;
      mm.makeScale(s, s, s);
      mm.setPosition(Math.cos(a) * rr, 0.1, Math.sin(a) * rr);
      trunkMeshT.setMatrixAt(i, mm);
      crownMeshT.setMatrixAt(i, mm);
    }
  }
  trunkMeshT.castShadow = true;
  crownMeshT.castShadow = true;
  g.add(trunkMeshT);
  g.add(crownMeshT);

  // 内芯 + 展望台环（实体）
  const coreMat = new THREE.MeshStandardMaterial({ color: 0xdfe4ea, roughness: 0.6 });
  const core = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 4, 500, 10), coreMat);
  core.position.y = 250;
  g.add(core);
  for (const [y, r, h] of [[258, 14, 9], [348, 11, 8]]) {
    const deckM = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, h, 24),
      nightEmissive(new THREE.MeshStandardMaterial({ color: 0xe8edf3, roughness: 0.5, emissive: 0xbfc8ff, emissiveIntensity: 1 }), 1.0)
    );
    deckM.position.y = y;
    deckM.castShadow = true;
    g.add(deckM);
  }
  parent.add(g);
}

// ================= 涩谷十字路口四角 =================
function buildCrossing(scene, parent) {
  const buildings = [];
  // 四角地块范围（与 layout.js 的 crossing 区一致）：|x|,|z| ∈ (15, 110)
  const corners = [
    { x0: 15, x1: 110, z0: 15, z1: 110, kind: 'stream' },   // 东南
    { x0: -110, x1: -15, z0: 15, z1: 110, kind: 'tsutaya' }, // 西南
    { x0: 15, x1: 110, z0: -110, z1: -15, kind: 'qfront' },  // 东北
    { x0: -110, x1: -15, z0: -110, z1: -15, kind: '109' },   // 西北
  ];

  const concreteMat = new THREE.MeshStandardMaterial({ color: 0xb8b2a6, roughness: 0.9 });
  const darkGlassMat = new THREE.MeshStandardMaterial({ color: 0x4a545e, roughness: 0.5, metalness: 0.12 });

  for (const c of corners) {
    // 靠路口内角点
    const ix = c.x0 > 0 ? c.x0 : c.x1;
    const iz = c.z0 > 0 ? c.z0 : c.z1;
    const sgnX = Math.sign(ix), sgnZ = Math.sign(iz);

    if (c.kind === '109') {
      // 银色圆柱塔 + 109 标志
      const r = 15, h = 36;
      const b = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, h, 24),
        nightEmissive(new THREE.MeshStandardMaterial({ color: 0xd6dbe2, roughness: 0.45, metalness: 0.25, emissive: 0xaab4c8, emissiveIntensity: 1 }), 0.55)
      );
      b.position.set(-38, 0.35 + h / 2, -38);
      b.castShadow = true; b.receiveShadow = true;
      parent.add(b);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r, 4, 24), concreteMat);
      cap.position.set(-38, 0.35 + h + 2, -38);
      parent.add(cap);
      buildings.push({ x: -38, z: -38, w: r * 2, d: r * 2, h, zone: 'shibuya' });
      addLogoBoard(parent, '109', new THREE.Vector3(-38 + r * 0.72, 22, -38 + r * 0.72), 7.5, Math.PI / 4);
    } else if (c.kind === 'qfront') {
      // 曲面大屏楼（QFRONT 意向）
      const w = 34, d = 30, h = 42;
      const bx = 58, bz = -50;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), concreteMat);
      b.position.set(bx, 0.35 + h / 2, bz);
      b.castShadow = true; b.receiveShadow = true;
      parent.add(b);
      // 两面大屏（朝 -x 与 +z，即朝向路口）
      addScreen(parent, 17, 13, new THREE.Vector3(bx - w / 2 - 0.25, 24, bz + 2), -Math.PI / 2);
      addScreen(parent, 17, 13, new THREE.Vector3(bx + 2, 24, bz + d / 2 + 0.25), 0);
      buildings.push({ x: bx, z: bz, w, d, h, zone: 'shibuya' });
    } else if (c.kind === 'stream') {
      const w = 38, d = 30, h = 33;
      const bx = 56, bz = 52;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), darkGlassMat);
      b.position.set(bx, 0.35 + h / 2, bz);
      b.castShadow = true; b.receiveShadow = true;
      parent.add(b);
      addScreen(parent, 15, 10, new THREE.Vector3(bx - 4, 21, bz - d / 2 - 0.25), Math.PI);
      addScreen(parent, 12, 8, new THREE.Vector3(bx - w / 2 - 0.25, 23, bz), -Math.PI / 2);
      addScreen(parent, 14, 9, new THREE.Vector3(bx + 4, 20, bz + d / 2 + 0.25), 0);
      buildings.push({ x: bx, z: bz, w, d, h, zone: 'shibuya' });
    } else {
      // tsutaya：矮层长横向玻璃 + 屋顶招牌
      const w = 44, d = 28, h = 18;
      const bx = -52, bz = 54;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), concreteMat);
      b.position.set(bx, 0.35 + h / 2, bz);
      b.castShadow = true; b.receiveShadow = true;
      parent.add(b);
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.86, 6, d * 0.86),
        nightEmissive(new THREE.MeshStandardMaterial({ color: 0x2a3138, emissive: 0xfff3d0, emissiveIntensity: 1 }), 1.0)
      );
      band.position.set(bx, 11, bz);
      parent.add(band);
      addBillboardMesh(parent, '渋谷 109-', new THREE.Vector3(bx + w / 2 + 0.3, 15.5, bz), 10, 4, Math.PI / 2);
      buildings.push({ x: bx, z: bz, w, d, h, zone: 'shibuya' });
    }
  }

  // 四角地块外围补两栋配楼，避免路口像空广场
  const rng = makeRng(31415);
  for (const c of corners) {
    const ox = c.x0 > 0 ? c.x1 - 22 : c.x0 + 22;
    const oz = c.z0 > 0 ? c.z1 - 22 : c.z0 + 22;
    const mx = c.x0 > 0 ? c.x1 - 22 : c.x0 + 22;
    const mz = c.z0 > 0 ? c.z0 + 20 : c.z1 - 20;
    const fillers = [
      { x: ox, z: oz, w: 26 + rng() * 8, d: 26 + rng() * 8, h: 16 + rng() * 16 },
      { x: mx, z: mz, w: 18 + rng() * 6, d: 20 + rng() * 6, h: 14 + rng() * 12 },
    ];
    for (const f of fillers) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(f.w, f.h, f.d), concreteMat);
      b.position.set(f.x, 0.35 + f.h / 2, f.z);
      b.castShadow = true; b.receiveShadow = true;
      parent.add(b);
      buildings.push({ x: f.x, z: f.z, w: f.w, d: f.d, h: f.h, zone: 'shibuya' });
    }
  }

  // 自动售货机（路口四角人行道）
  const vmGeo = new THREE.BoxGeometry(1.0, 1.85, 0.85);
  const vmFrontGeo = new THREE.PlaneGeometry(0.82, 1.55);
  const vmMat = new THREE.MeshStandardMaterial({ color: 0xdde1e6, roughness: 0.4, metalness: 0.2 });
  const vmFronts = ['#e33d3d', '#2e6fe3', '#e3a02e', '#2ea84f'];
  const vmSpots = [
    [20, 20], [30, 18], [-22, 20], [-34, 18], [20, -22], [30, -20], [-22, -22], [-34, -20],
  ];
  vmSpots.forEach((p, i) => {
    const vm = new THREE.Mesh(vmGeo, vmMat);
    vm.position.set(p[0], 0.35 + 0.92, p[1]);
    vm.rotation.y = Math.atan2(-p[0], -p[1]);
    vm.castShadow = true;
    parent.add(vm);
    const fc = document.createElement('canvas');
    fc.width = 64; fc.height = 128;
    const fx2 = fc.getContext('2d');
    fx2.fillStyle = vmFronts[i % 4];
    fx2.fillRect(0, 0, 64, 128);
    fx2.fillStyle = 'rgba(255,255,255,0.85)';
    for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) fx2.fillRect(8 + q * 18, 12 + r * 22, 12, 14);
    const ftex = new THREE.CanvasTexture(fc);
    ftex.colorSpace = THREE.SRGBColorSpace;
    const front = new THREE.Mesh(
      vmFrontGeo,
      nightEmissive(new THREE.MeshStandardMaterial({ map: ftex, emissiveMap: ftex, emissive: 0xffffff, roughness: 0.5 }), 0.8)
    );
    front.position.copy(vm.position).add(new THREE.Vector3(Math.sin(vm.rotation.y) * 0.46, 0, Math.cos(vm.rotation.y) * 0.46));
    front.rotation.y = vm.rotation.y;
    parent.add(front);
  });

  decorateBuildings(scene, buildings, 4242);
  addNightLight(scene, new THREE.Vector3(0, 30, 0), 0xffd9a0, 3200, 230);
  return buildings;
}

// ---- 小工具 ----
function addScreen(parent, w, h, pos, yaw) {
  const state = makeScreenTexture((Math.random() * 5) | 0);
  registerScreen(state);
  const mat = nightEmissive(
    new THREE.MeshStandardMaterial({ map: state.tex, emissiveMap: state.tex, emissive: 0xffffff, roughness: 0.35 }),
    1.25
  );
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.copy(pos);
  mesh.rotation.y = yaw;
  parent.add(mesh);
  // 屏幕框
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.8, h + 0.8, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.6 })
  );
  frame.position.copy(pos).add(new THREE.Vector3(Math.sin(yaw) * -0.2, 0, Math.cos(yaw) * -0.2));
  frame.rotation.y = yaw;
  parent.add(frame);
}

function addBillboardMesh(parent, text, pos, w, h, yaw) {
  const tex = makeBillboardTexture(text, { fg: '#ff5f8f' });
  const mat = nightEmissive(
    new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, roughness: 0.6 }),
    1.8
  );
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.copy(pos);
  mesh.rotation.y = yaw;
  parent.add(mesh);
}

// 竖向 logo 看板（109 用）
function addLogoBoard(parent, text, pos, size, yaw) {
  const tex = makeVerticalSignTexture(text.trim() || '109', { fg: '#ff2d4e', bg: '#171a20', rng: Math.random });
  const mat = nightEmissive(
    new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, roughness: 0.5, side: THREE.DoubleSide }),
    1.4
  );
  const h = size * 2.2;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, h), mat);
  mesh.position.copy(pos);
  mesh.position.y = pos.y;
  mesh.rotation.y = yaw;
  parent.add(mesh);
}
