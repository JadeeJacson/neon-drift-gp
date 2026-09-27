// ground.js — 沥青地面、人行道垫层、车道标线、涩谷斑马线、行道树、路灯（夜间光池）
import * as THREE from 'three';
import { CROSS } from './layout.js';
import { makeRng } from './layout.js';
import { makeNoiseTexture, nightEmissive } from './fx.js';
import { shared } from './env.js';

const MAP = 1300; // 路网半幅（地面更大）
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

export function buildGround(scene, layout) {
  const rng = makeRng(7331);
  const g = new THREE.Group();
  g.name = 'ground';

  // 路网实际范围（虚线/路灯/树只铺到路网尽头，不画幽灵路）
  let extent = 0;
  for (const r of [...layout.roadsV, ...layout.roadsH]) {
    extent = Math.max(extent, Math.abs(r.pos) + r.w / 2);
  }
  const SPAN = extent + 20;

  const asphaltNoise = makeNoiseTexture(256, 120, 26);
  asphaltNoise.repeat.set(220, 220);

  const asphalt = new THREE.Mesh(
    new THREE.PlaneGeometry(4200, 4200),
    new THREE.MeshStandardMaterial({ color: 0x45484d, roughness: 0.96, metalness: 0.0, map: asphaltNoise })
  );
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.receiveShadow = true;
  g.add(asphalt);

  // ---- 人行道垫层（每街区一块，公园/塔基为绿地）----
  const pads = [];
  const greens = [];
  for (const b of layout.blocks) {
    const w = b.x1 - b.x0, d = b.z1 - b.z0;
    const isGreen = b.zone === 'park' || b.zone === 'towerpark';
    (isGreen ? greens : pads).push({ x: b.cx, z: b.cz, w, d });
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
  padMesh.castShadow = false;
  g.add(padMesh);

  const grassMat = new THREE.MeshStandardMaterial({ color: 0x41602f, roughness: 1.0 });
  const grassNoise = makeNoiseTexture(128, 110, 46);
  grassNoise.repeat.set(6, 6);
  grassMat.map = grassNoise;
  const greenMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), grassMat, greens.length);
  {
    const m = new THREE.Matrix4();
    greens.forEach((p, i) => {
      m.makeScale(p.w - 2, 0.42, p.d - 2);
      m.setPosition(p.x, 0.21, p.z);
      greenMesh.setMatrixAt(i, m);
    });
  }
  greenMesh.receiveShadow = true;
  g.add(greenMesh);

  // ---- 车道中央虚线（白）+ 主干道边线 ----
  const stripeGeo = new THREE.BoxGeometry(1, 1, 1);
  const stripeMat = nightEmissive(
    new THREE.MeshStandardMaterial({ color: 0xd9d9cf, roughness: 0.85, emissive: 0xcfd2d8, emissiveIntensity: 1 }),
    0.32
  ); // 标线夜间微反光，让路网可读
  const dashes = [];
  const edgeLines = [];
  const span = SPAN;
  for (const road of [...layout.roadsV, ...layout.roadsH]) {
    const vertical = layout.roadsV.includes(road);
    const n = Math.floor((span * 2) / 7);
    for (let i = 0; i < n; i++) {
      const t = -span + i * 7;
      dashes.push(vertical ? { x: road.pos, z: t, sx: 0.35, sz: 3.1 } : { x: t, z: road.pos, sx: 3.1, sz: 0.35 });
    }
    if (road.major) {
      const half = road.w / 2 - 0.8;
      for (const s of [-1, 1]) {
        edgeLines.push(
          vertical ? { x: road.pos + s * half, z: 0, sx: 0.3, sz: span * 2 } : { x: 0, z: road.pos + s * half, sx: span * 2, sz: 0.3 }
        );
      }
    }
  }
  const dashMesh = new THREE.InstancedMesh(stripeGeo, stripeMat, dashes.length);
  {
    const m = new THREE.Matrix4();
    dashes.forEach((d, i) => {
      m.makeScale(d.sx, 0.04, d.sz);
      m.setPosition(d.x, 0.03, d.z);
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
      m.setPosition(d.x, 0.03, d.z);
      edgeMesh.setMatrixAt(i, m);
    });
  }
  g.add(edgeMesh);

  buildZebra(g);
  buildTrees(g, layout, rng, SPAN);
  buildLamps(g, layout, SPAN);

  scene.add(g);
}

// ---- 涩谷全向斑马线（四臂 + 对角）----
function buildZebra(g) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xe4e4da, roughness: 0.85 });
  const stripes = [];
  const band = 4.2; // 斑马带宽
  const off = Math.max(CROSS.wV, CROSS.wH) / 2 + 2.5;

  // 北臂（横穿南北向路）：条纹沿 z 长条
  for (let x = -CROSS.wV / 2 + 1.2; x <= CROSS.wV / 2 - 1.2; x += 1.55) {
    stripes.push({ x, z: -(off + band / 2), sx: 0.72, sz: band, rot: 0 });
    stripes.push({ x, z: off + band / 2, sx: 0.72, sz: band, rot: 0 });
  }
  // 东西臂
  for (let z = -CROSS.wH / 2 + 1.2; z <= CROSS.wH / 2 - 1.2; z += 1.55) {
    stripes.push({ x: -(off + band / 2), z, sx: band, sz: 0.72, rot: 0 });
    stripes.push({ x: off + band / 2, z, sx: band, sz: 0.72, rot: 0 });
  }
  // 两条对角线
  const diagLen = 30;
  const dirs = [[1, 1], [1, -1]];
  for (const [dx, dz] of dirs) {
    const len = Math.hypot(dx, dz);
    const ux = dx / len, uz = dz / len;
    const ang = Math.atan2(uz, ux);
    for (let t = -diagLen / 2; t <= diagLen / 2; t += 1.5) {
      stripes.push({
        x: ux * t - uz * 1.9, z: uz * t + ux * 1.9, // 垂直偏移形成条带
        sx: 0.72, sz: band, rot: -ang + Math.PI / 2,
      });
    }
  }
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, stripes.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  stripes.forEach((s, i) => {
    e.set(0, s.rot, 0);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(s.x, 0.045, s.z), q, new THREE.Vector3(s.sx, 0.04, s.sz));
    mesh.setMatrixAt(i, m);
  });
  mesh.receiveShadow = true;
  g.add(mesh);
}

// ---- 行道树（主干道两侧）+ 公园树 ----
function buildTrees(g, layout, rng, span) {
  const spots = [];
  for (const road of [...layout.roadsV, ...layout.roadsH]) {
    if (!road.major) continue;
    const vertical = layout.roadsV.includes(road);
    for (let t = -span; t <= span; t += 27) {
      if (Math.hypot(vertical ? 0 : t, vertical ? t : 0) < 70) continue; // 路口附近不种
      for (const s of [-1, 1]) {
        if (rng() < 0.25) continue;
        const off = (road.w / 2 + 2.6) * s;
        spots.push(vertical ? { x: road.pos + off, z: t } : { x: t, z: road.pos + off });
      }
    }
  }
  for (const b of layout.blocks) {
    if (b.zone !== 'park' && b.zone !== 'towerpark') continue;
    const n = Math.floor(((b.x1 - b.x0) * (b.z1 - b.z0)) / 900);
    for (let i = 0; i < n; i++) {
      spots.push({
        x: b.x0 + 6 + rng() * (b.x1 - b.x0 - 12),
        z: b.z0 + 6 + rng() * (b.z1 - b.z0 - 12),
        big: true,
      });
    }
  }
  const n = spots.length;
  const trunkGeo = new THREE.CylinderGeometry(0.14, 0.22, 3.2, 6);
  trunkGeo.translate(0, 1.6, 0);
  const crownGeo = new THREE.IcosahedronGeometry(1, 1);
  crownGeo.translate(0, 4.4, 0);
  const trunkMesh = new THREE.InstancedMesh(
    trunkGeo,
    new THREE.MeshStandardMaterial({ color: 0x5d4a36, roughness: 1 }),
    n
  );
  const crownMesh = new THREE.InstancedMesh(
    crownGeo,
    new THREE.MeshStandardMaterial({ color: 0x2f5b2b, roughness: 1, flatShading: true }),
    n
  );
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
    m.makeTranslation(p.x + Math.sin(p.face) * -2.0, 0.06, p.z + Math.cos(p.face) * -2.0);
    pools.setMatrixAt(i, m);
  });
  pools.count = poolSpots.length;
  g.add(poles); g.add(arms); g.add(heads); g.add(pools);
}
