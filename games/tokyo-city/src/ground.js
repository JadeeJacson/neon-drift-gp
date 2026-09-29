// ground.js — 大地系统：波浪海洋、弧形海岸线、沙滩、河流+桥+樱花岸线、
// 沥青路带、分区分级垫层、干道交叉口斑马线、行道树/公园树、路灯（夜间光池）
import * as THREE from 'three';
import { CROSS, coastX } from './layout.js';
import { makeRng } from './layout.js';
import { makeNoiseTexture, nightEmissive } from './fx.js';
import { shared } from './env.js';

const LIGHT_POOL_SHADER = {
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform float uDay;
    varying vec2 vUv;
    void main() {
      float d = distance(vUv, vec2(0.5)) * 2.0;
      float fall = smoothstep(1.0, 0.15, d);
      float a = fall * (1.0 - uDay) * 0.2;
      gl_FragColor = vec4(vec3(1.0, 0.80, 0.52) * a, a);
    }`,
};

// 把 BoxGeometry(1,1,1) 的 UV 换算成「1 个 UV 单位 = tile 米」，这样同一张贴图
// 贴到 13m 宽的支路和 30m 宽的主干道上，颗粒密度才一致。
// three.js 的 BoxGeometry 顶点顺序固定为 px / nx / py / ny / pz / nz，每面 4 个顶点，
// 且 px|nx 面的 u↔z、v↔y，py|ny 面的 u↔x、v↔z，pz|nz 面的 u↔x、v↔y。
export const ROAD_TILE = 8; // 一张 1K 沥青贴图覆盖 8m

function tileBoxUV(geo, w, h, d, tile) {
  const uv = geo.attributes.uv;
  const spans = [
    [d, h], [d, h],   // px, nx
    [w, d], [w, d],   // py, ny
    [w, h], [w, h],   // pz, nz
  ];
  for (let f = 0; f < 6; f++) {
    const [su, sv] = spans[f];
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * su / tile, uv.getY(i) * sv / tile);
    }
  }
  uv.needsUpdate = true;
  return geo;
}

export function buildGround(scene, layout) {
  const rng = makeRng(7331);
  const g = new THREE.Group();
  g.name = 'ground';

  // UV 已经按 ROAD_TILE 换算成世界尺度，所以贴图的 repeat 保持 1,1；
  // 这层程序化噪声只是 ambientCG 贴图加载前的兜底（离线时不至于变成一块纯色）。
  const asphaltNoise = makeNoiseTexture(256, 120, 26);
  const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x6a6e75, roughness: 0.96, metalness: 0.0, map: asphaltNoise });
  const grassNoise = makeNoiseTexture(128, 205, 28);
  grassNoise.repeat.set(60, 60);

  // ---- 大地（草地基底，东侧随海岸线收边）----
  // 多边形绕向必须一致（shape.y = -世界z），否则 earcut 自交出洞露出黑底
  const Z0 = -3600, Z1 = 3600;
  const landShape = new THREE.Shape();
  landShape.moveTo(coastX(Z0) - 30, -Z0);
  for (let z = Z0 + 100; z <= Z1; z += 100) landShape.lineTo(coastX(z) - 30, -z);
  landShape.lineTo(-3800, -Z1);
  landShape.lineTo(-3800, -Z0);
  landShape.closePath();
  const landGeo = new THREE.ShapeGeometry(landShape);
  landGeo.rotateX(-Math.PI / 2);
  const land = new THREE.Mesh(
    landGeo,
    new THREE.MeshStandardMaterial({ color: 0x828a5e, roughness: 1, map: grassNoise })
  );
  land.receiveShadow = true;
  g.add(land);

  // ---- 沙滩（海岸线两侧的沙带）----
  const beachShape = new THREE.Shape();
  beachShape.moveTo(coastX(Z1) - 30, -Z1);
  for (let z = Z1; z >= Z0; z -= 100) beachShape.lineTo(coastX(z) - 30, -z);
  for (let z = Z0; z <= Z1; z += 100) beachShape.lineTo(coastX(z) + 42, -z);
  beachShape.closePath();
  const beachGeo = new THREE.ShapeGeometry(beachShape);
  beachGeo.rotateX(-Math.PI / 2);
  const beach = new THREE.Mesh(
    beachGeo,
    new THREE.MeshStandardMaterial({ color: 0xcabb90, roughness: 1 })
  );
  beach.position.y = 0.03;
  beach.receiveShadow = true;
  g.add(beach);

  // ---- 海（顶点波动 + 法线扰动的反光）----
  const oceanGeo = new THREE.PlaneGeometry(9000, 9000, 120, 120);
  const oceanMat = new THREE.MeshStandardMaterial({ color: 0x1e5f8a, roughness: 0.34, metalness: 0.06 });
  oceanMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = shared.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 wp4 = modelMatrix * vec4(position, 1.0);
        float w1 = sin(wp4.x * 0.021 + uTime * 0.9) + sin(wp4.z * 0.017 - uTime * 0.7);
        float w2 = sin((wp4.x + wp4.z) * 0.045 + uTime * 1.7);
        transformed.z += w1 * 0.055 + w2 * 0.05;
        vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nuniform float uTime;')
      .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
        normal = normalize(normal + vec3(
          sin(vWPos.x * 0.11 + uTime * 1.3) * 0.10 + sin(vWPos.z * 0.053 - uTime) * 0.06, 0.0,
          cos(vWPos.z * 0.09 + uTime * 1.1) * 0.10 + cos(vWPos.x * 0.047 + uTime) * 0.06));`);
  };
  oceanMat.customProgramCacheKey = () => 'ocean-v1';
  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(4200, -0.42, 0);
  ocean.receiveShadow = true;
  g.add(ocean);

  // ---- 河流（穿城入海）+ 两岸 + 樱花岸树 ----
  const riverZ = layout.river.z, riverW = layout.river.w;
  const rL = coastX(riverZ) + 46 + 2700;
  const riverC = (-2700 + coastX(riverZ) + 46) / 2;
  const river = new THREE.Mesh(
    new THREE.BoxGeometry(rL, 0.25, riverW),
    new THREE.MeshStandardMaterial({ color: 0x274f6d, roughness: 0.4, metalness: 0.05 })
  );
  river.position.set(riverC, -0.18, riverZ);
  g.add(river);
  const bankMat = new THREE.MeshStandardMaterial({ color: 0x8f8b83, roughness: 0.95 });
  for (const s of [-1, 1]) {
    const bank = new THREE.Mesh(new THREE.BoxGeometry(rL, 0.5, 3), bankMat);
    bank.position.set(riverC, 0.16, riverZ + s * (riverW / 2 + 1.2));
    bank.castShadow = false;
    bank.receiveShadow = true;
    g.add(bank);
  }
  // 跨河桥（每条与河相交的南北向路一块平桥板 + 护栏）
  const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x6a6d72, roughness: 0.9 });
  let bridgeCount = 0;
  for (const road of layout.roadsV) {
    if (road.pos > coastX(riverZ) - 20) continue;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(road.w + 5, 0.14, riverW + 12), bridgeMat);
    deck.position.set(road.pos, 0.04, riverZ);
    deck.receiveShadow = true;
    g.add(deck);
    for (const s of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(road.w + 5, 0.55, 0.35), bridgeMat);
      rail.position.set(road.pos, 0.4, riverZ + s * (riverW / 2 + 5.6));
      g.add(rail);
    }
    bridgeCount++;
  }

  // ---- 城市路带（沥青条：草地基底上铺出每一 条 路）----
  let extent = 0;
  for (const r of [...layout.roadsV, ...layout.roadsH]) extent = Math.max(extent, Math.abs(r.pos) + r.w / 2);
  const SPAN = extent + 20;
  for (const road of [...layout.roadsV, ...layout.roadsH]) {
    const vertical = layout.roadsV.includes(road);
    // 每条路一份几何体：共享 BoxGeometry 的 0..1 UV 会让窄路纹理被拉长，宽路纹理又过密
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const strip = new THREE.Mesh(geo, asphaltMat);
    if (vertical) {
      tileBoxUV(geo, road.w, 0.1, SPAN * 2, ROAD_TILE);
      strip.scale.set(road.w, 0.1, SPAN * 2);
      strip.position.set(road.pos, 0.05, 0);
    } else {
      const eastEnd = coastX(road.pos) - 34; // 不入海
      const len = eastEnd + SPAN;
      tileBoxUV(geo, len, 0.1, road.w, ROAD_TILE);
      strip.scale.set(len, 0.1, road.w);
      strip.position.set(-SPAN + len / 2, 0.05, road.pos);
    }
    strip.receiveShadow = true;
    g.add(strip);
  }

  // ---- 街区垫层：城区混凝土 / 公园绿地 / 郊区草地 ----
  const pads = [], greens = [], lawns = [];
  for (const b of layout.blocks) {
    const w = b.x1 - b.x0, d = b.z1 - b.z0;
    if (b.zone === 'park' || b.zone === 'towerpark') greens.push({ x: b.cx, z: b.cz, w, d });
    else if (b.zone === 'suburb') lawns.push({ x: b.cx, z: b.cz, w, d });
    else if (b.zone !== 'rural' && b.zone !== 'coast') pads.push({ x: b.cx, z: b.cz, w, d });
  }
  const padMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x8f8b83, roughness: 0.94 }),
    pads.length
  );
  {
    const m = new THREE.Matrix4();
    pads.forEach((p, i) => {
      m.makeScale(p.w, 0.35, p.d);
      m.setPosition(p.x, 0.175, p.z);
      padMesh.setMatrixAt(i, m);
    });
  }
  padMesh.receiveShadow = true;
  g.add(padMesh);

  const greenMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), grassMat(), greens.length);
  {
    const m = new THREE.Matrix4();
    greens.forEach((p, i) => {
      m.makeScale(p.w - 2, 0.42, p.d - 2);
      m.setPosition(p.x, 0.19, p.z);
      greenMesh.setMatrixAt(i, m);
    });
  }
  greenMesh.receiveShadow = true;
  g.add(greenMesh);

  const lawnMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), grassMat(0x8a9664), lawns.length);
  {
    const m = new THREE.Matrix4();
    lawns.forEach((p, i) => {
      m.makeScale(p.w, 0.2, p.d);
      m.setPosition(p.x, 0.1, p.z);
      lawnMesh.setMatrixAt(i, m);
    });
  }
  lawnMesh.receiveShadow = true;
  g.add(lawnMesh);

  // ---- 公园池塘 ----
  const parkBlock = layout.blocks.find((b) => b.zone === 'park');
  if (parkBlock) {
    const pond = new THREE.Mesh(
      new THREE.CircleGeometry(42, 24),
      new THREE.MeshStandardMaterial({ color: 0x2e6284, roughness: 0.25, metalness: 0.1 })
    );
    pond.rotation.x = -Math.PI / 2;
    pond.scale.set(1.4, 0.75, 1);
    pond.position.set(parkBlock.cx + 20, 0.44, parkBlock.cz);
    g.add(pond);
  }

  // ---- 车道中央虚线 + 主干道边线 ----
  const stripeGeo = new THREE.BoxGeometry(1, 1, 1);
  const stripeMat = nightEmissive(
    new THREE.MeshStandardMaterial({ color: 0xd9d9cf, roughness: 0.85, emissive: 0xcfd2d8, emissiveIntensity: 1 }),
    0.32
  );
  const dashes = [];
  const edgeLines = [];
  for (const road of [...layout.roadsV, ...layout.roadsH]) {
    const vertical = layout.roadsV.includes(road);
    const coastClip = vertical ? SPAN : coastX(road.pos) - 40;
    const n = Math.floor((SPAN + coastClip) / 7);
    for (let i = 0; i < n; i++) {
      const t = -SPAN + i * 7;
      if (t > coastClip) break;
      dashes.push(vertical ? { x: road.pos, z: t, sx: 0.35, sz: 3.1 } : { x: t, z: road.pos, sx: 3.1, sz: 0.35 });
    }
    if (road.major) {
      const half = road.w / 2 - 0.8;
      for (const s of [-1, 1]) {
        edgeLines.push(
          vertical
            ? { x: road.pos + s * half, z: (SPAN - coastClip) / 2 - (SPAN - coastClip) / 2, sx: 0.3, sz: SPAN * 2 }
            : { x: (-SPAN + coastClip) / 2, z: road.pos + s * half, sx: SPAN + coastClip, sz: 0.3 }
        );
      }
    }
  }
  const dashMesh = new THREE.InstancedMesh(stripeGeo, stripeMat, dashes.length);
  {
    const m = new THREE.Matrix4();
    dashes.forEach((d, i) => {
      m.makeScale(d.sx, 0.04, d.sz);
      m.setPosition(d.x, 0.12, d.z);
      dashMesh.setMatrixAt(i, m);
    });
  }
  dashMesh.receiveShadow = true;
  g.add(dashMesh);
  const edgeMesh = new THREE.InstancedMesh(stripeGeo, stripeMat, edgeLines.length);
  {
    const m = new THREE.Matrix4();
    edgeLines.forEach((d, i) => {
      m.makeScale(d.sx, 0.04, d.sz);
      m.setPosition(d.x, 0.12, d.z);
      edgeMesh.setMatrixAt(i, m);
    });
  }
  g.add(edgeMesh);

  // ---- 斑马线：涩谷全向 + 其余干道交叉口 ----
  const zebraStripes = [];
  collectZebra(zebraStripes, CROSS.x, CROSS.z, CROSS.wV, CROSS.wH, 4.2, true);
  for (const rv of layout.roadsV) {
    if (!rv.major) continue;
    for (const rh of layout.roadsH) {
      if (!rh.major) continue;
      if (Math.hypot(rv.pos - CROSS.x, rh.pos - CROSS.z) < 10) continue;
      collectZebra(zebraStripes, rv.pos, rh.pos, rv.w, rh.w, 3.6, false);
    }
  }
  const zebraMat = new THREE.MeshStandardMaterial({ color: 0xe4e4da, roughness: 0.85 });
  const zebraMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), zebraMat, zebraStripes.length);
  {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    zebraStripes.forEach((s, i) => {
      e.set(0, s.rot, 0);
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(s.x, 0.13, s.z), q, new THREE.Vector3(s.sx, 0.04, s.sz));
      zebraMesh.setMatrixAt(i, m);
    });
  }
  zebraMesh.receiveShadow = true;
  g.add(zebraMesh);

  // ---- 树：行道树 / 公园树 / 河岸樱花 / 郊野散树 ----
  buildTrees(g, layout, rng, SPAN, riverZ, riverW, coastX(riverZ));

  // ---- 路灯 ----
  buildLamps(g, layout, Math.min(SPAN, 1650));

  scene.add(g);
  return { roadMat: asphaltMat };
}

function grassMat(color = 0x41602f) {
  const tex = makeNoiseTexture(128, 205, 28);
  tex.repeat.set(5, 5);
  return new THREE.MeshStandardMaterial({ color, roughness: 1, map: tex });
}

// 一处交叉口的全向斑马线（四臂；scramble 加对角）
function collectZebra(arr, cx, cz, wV, wH, band, diagonal) {
  const off = Math.max(wV, wH) / 2 + 2.5;
  for (let x = -wV / 2 + 1.2; x <= wV / 2 - 1.2; x += 1.55) {
    arr.push({ x: cx + x, z: cz - (off + band / 2), sx: 0.72, sz: band, rot: 0 });
    arr.push({ x: cx + x, z: cz + off + band / 2, sx: 0.72, sz: band, rot: 0 });
  }
  for (let z = -wH / 2 + 1.2; z <= wH / 2 - 1.2; z += 1.55) {
    arr.push({ x: cx - (off + band / 2), z: cz + z, sx: band, sz: 0.72, rot: 0 });
    arr.push({ x: cx + off + band / 2, z: cz + z, sx: band, sz: 0.72, rot: 0 });
  }
  if (diagonal) {
    const diagLen = Math.min(wV, wH) + 4;
    for (const [dx, dz] of [[1, 1], [1, -1]]) {
      const len = Math.hypot(dx, dz);
      const ux = dx / len, uz = dz / len;
      const ang = Math.atan2(uz, ux);
      for (let t = -diagLen / 2; t <= diagLen / 2; t += 1.5) {
        arr.push({ x: cx + ux * t - uz * 1.9, z: cz + uz * t + ux * 1.9, sx: 0.72, sz: band, rot: -ang + Math.PI / 2 });
      }
    }
  }
}

// ---- 行道树 / 公园树 / 樱花 / 郊野散树 ----
function buildTrees(g, layout, rng, span, riverZ, riverW, riverCoastX) {
  const spots = [];
  for (const road of [...layout.roadsV, ...layout.roadsH]) {
    if (!road.major) continue;
    const vertical = layout.roadsV.includes(road);
    for (let t = -Math.min(span, 1700); t <= Math.min(span, 1700); t += 27) {
      if (Math.hypot(vertical ? 0 : t, vertical ? t : 0) < 70) continue;
      for (const s of [-1, 1]) {
        if (rng() < 0.25) continue;
        const off = (road.w / 2 + 2.6) * s;
        spots.push(vertical ? { x: road.pos + off, z: t } : { x: t, z: road.pos + off });
      }
    }
  }
  for (const b of layout.blocks) {
    if (b.zone === 'park' || b.zone === 'towerpark') {
      const n = Math.floor(((b.x1 - b.x0) * (b.z1 - b.z0)) / 900);
      for (let i = 0; i < n; i++) {
        spots.push({ x: b.x0 + 6 + rng() * (b.x1 - b.x0 - 12), z: b.z0 + 6 + rng() * (b.z1 - b.z0 - 12), big: true });
      }
    } else if (b.zone === 'suburb') {
      const n = 1 + ((rng() * 3) | 0);
      for (let i = 0; i < n; i++) {
        spots.push({ x: b.x0 + 8 + rng() * (b.x1 - b.x0 - 16), z: b.z0 + 8 + rng() * (b.z1 - b.z0 - 16) });
      }
    } else if (b.zone === 'rural') {
      const n = 5 + ((rng() * 5) | 0);
      for (let i = 0; i < n; i++) {
        spots.push({ x: b.x0 + 10 + rng() * (b.x1 - b.x0 - 20), z: b.z0 + 10 + rng() * (b.z1 - b.z0 - 20), big: true });
      }
    }
  }
  // 樱花（河岸两列）
  const cherries = [];
  for (let x = -2350; x < riverCoastX - 30; x += 34) {
    if (Math.abs(x) < 40 && false) continue;
    for (const s of [-1, 1]) {
      if (rng() < 0.2) continue;
      cherries.push({ x, z: riverZ + s * (riverW / 2 + 5.5), big: false });
    }
  }
  const n = spots.length;
  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.22, 3.2, 6);
  trunkGeo.translate(0, 1.25, 0); // 基部下探 0.35m：人行道垫层(0.35)与草地(0)都能“生根”
  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  crownGeo.translate(0, 4.4, 0);
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ color: 0x5d4a36, roughness: 1 }), n);
  const crownMesh = new THREE.InstancedMesh(crownGeo, new THREE.MeshStandardMaterial({ color: 0x2f5b2b, roughness: 1, flatShading: true }), n);
  const m = new THREE.Matrix4();
  spots.forEach((p, i) => {
    const s = p.big ? 1.5 + rng() * 0.7 : 0.85 + rng() * 0.5;
    m.makeScale(s, s * (0.9 + rng() * 0.5), s);
    m.setPosition(p.x, 0.3, p.z);
    trunkMesh.setMatrixAt(i, m);
    crownMesh.setMatrixAt(i, m);
  });
  trunkMesh.castShadow = true;
  crownMesh.castShadow = true;
  crownMesh.receiveShadow = true;
  g.add(trunkMesh);
  g.add(crownMesh);

  // 樱花：粉色树冠
  const cTrunk = new THREE.InstancedMesh(trunkGeo, trunkMesh.material, cherries.length);
  const cCrown = new THREE.InstancedMesh(crownGeo, new THREE.MeshStandardMaterial({ color: 0xe8a8b8, roughness: 1, flatShading: true }), cherries.length);
  cherries.forEach((p, i) => {
    const s = 1.0 + rng() * 0.5;
    m.makeScale(s, s, s);
    m.setPosition(p.x, 0.3, p.z);
    cTrunk.setMatrixAt(i, m);
    cCrown.setMatrixAt(i, m);
  });
  cTrunk.castShadow = true;
  cCrown.castShadow = true;
  g.add(cTrunk);
  g.add(cCrown);
}

// ---- 路灯：杆 + 悬臂 + 夜间发光灯头 + 地面光池 ----
function buildLamps(g, layout, span) {
  const spots = [];
  const poolSpots = [];
  for (const road of [...layout.roadsV, ...layout.roadsH]) {
    if (road.w < 13) continue;
    const vertical = layout.roadsV.includes(road);
    for (let t = -span + 10, i = 0; t <= span; t += 34, i++) {
      const s = i % 2 === 0 ? 1 : -1;
      const off = (road.w / 2 + 1.4) * s;
      spots.push({
        x: vertical ? road.pos + off : t,
        z: vertical ? t : road.pos + off,
        face: vertical ? (s > 0 ? -Math.PI / 2 : Math.PI / 2) : s > 0 ? Math.PI : 0,
      });
      if (road.major) {
        poolSpots.push({
          x: vertical ? road.pos + off : t,
          z: vertical ? t : road.pos + off,
          face: vertical ? (s > 0 ? -Math.PI / 2 : Math.PI / 2) : s > 0 ? Math.PI : 0,
        });
      }
    }
  }
  const n = spots.length;
  const poleGeo = new THREE.CylinderGeometry(0.09, 0.13, 8.2, 5);
  poleGeo.translate(0, 4.1, 0);
  const armGeo = new THREE.BoxGeometry(2.4, 0.09, 0.09);
  armGeo.translate(1.2, 8.1, 0);
  const headGeo = new THREE.BoxGeometry(1.05, 0.16, 0.34);
  headGeo.translate(2.1, 8.0, 0);
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x3c4147, roughness: 0.6, metalness: 0.4 });
  const headMat = nightEmissive(new THREE.MeshStandardMaterial({ color: 0x2c2c2e, emissive: 0xffd9a0, emissiveIntensity: 1.6, roughness: 0.6 }), 1.6);

  const poles = new THREE.InstancedMesh(poleGeo, metalMat, n);
  const arms = new THREE.InstancedMesh(armGeo, metalMat, n);
  const heads = new THREE.InstancedMesh(headGeo, headMat, n);
  const poolGeo = new THREE.PlaneGeometry(10, 10);
  poolGeo.rotateX(-Math.PI / 2);
  const poolMat = new THREE.ShaderMaterial({
    uniforms: shared,
    ...LIGHT_POOL_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pools = new THREE.InstancedMesh(poolGeo, poolMat, Math.max(1, poolSpots.length));

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  spots.forEach((p, i) => {
    e.set(0, p.face, 0);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(p.x, 0.3, p.z), q, new THREE.Vector3(1, 1, 1));
    poles.setMatrixAt(i, m);
    arms.setMatrixAt(i, m);
    heads.setMatrixAt(i, m);
  });
  poolSpots.forEach((p, i) => {
    m.makeTranslation(p.x + Math.sin(p.face) * -2.0, 0.17, p.z + Math.cos(p.face) * -2.0);
    pools.setMatrixAt(i, m);
  });
  pools.count = poolSpots.length;
  g.add(poles); g.add(arms); g.add(heads); g.add(pools);
}
