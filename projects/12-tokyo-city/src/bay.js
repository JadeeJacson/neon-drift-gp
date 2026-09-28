// bay.js — 东京湾：货轮/小艇、集装箱港区、桥吊、台场意向小岛（含摩天轮）
import * as THREE from 'three';
import { coastX, makeRng } from './layout.js';
import { nightEmissive } from './fx.js';

export function buildBay(scene, layout) {
  const rng = makeRng(9090);
  const g = new THREE.Group();
  g.name = 'bay';
  const riverZ = layout.river.z;

  // ---- 港区仓库（沿海岸线成带布置，网格外也覆盖）----
  const whMat = new THREE.MeshStandardMaterial({ color: 0xd9d5cc, roughness: 0.85 });
  const whRoofMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.8 });
  const siloMat = new THREE.MeshStandardMaterial({ color: 0xe4e0d4, roughness: 0.7 });
  const coastAngle = (z) => Math.atan2(coastX(z + 40) - coastX(z - 40), 80); // 岸线走向角
  for (let z = -3100; z <= 3100; z += 95) {
    if (rng() < 0.15) continue;
    const cz = z + (rng() - 0.5) * 40;
    const shore = coastX(cz);
    if (shore < 1620) continue; // 岸线太靠里就留给网格街区
    if (Math.abs(cz - riverZ) < 95) continue; // 河口留空
    const wx = shore - 195 - rng() * 260;
    if (wx - 60 < 1500) continue; // 不侵入城市网格区
    const bw = 46 + rng() * 44;
    const bd = 22 + rng() * 20;
    const bh = 8 + rng() * 8;
    const wh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), whMat);
    wh.position.set(wx, bh / 2, cz);
    wh.rotation.y = -coastAngle(cz);
    wh.castShadow = true; wh.receiveShadow = true;
    g.add(wh);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(bw + 1.2, 0.8, bd + 1.2), whRoofMat);
    roof.position.set(wx, bh + 0.4, cz);
    roof.rotation.y = wh.rotation.y;
    g.add(roof);
    if (rng() < 0.35) {
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 20, 10), siloMat);
      silo.position.set(wx - bw / 2 - 10, 10, cz);
      silo.castShadow = true;
      g.add(silo);
    }
  }

  // ---- 沿岸道路（贴着海岸线内侧的一条弧形路）----
  const coastRoadMat = new THREE.MeshStandardMaterial({ color: 0x4a4d52, roughness: 0.95 });
  for (let z = -3300; z < 3300; z += 48) {
    const zMid = z + 24;
    const x0 = coastX(z) - 62, x1 = coastX(z + 48) - 62;
    const len = Math.hypot(x1 - x0, 48);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 14), coastRoadMat);
    seg.position.set((x0 + x1) / 2, 0.05, zMid);
    seg.rotation.y = -Math.atan2(x1 - x0, 48);
    seg.receiveShadow = true;
    g.add(seg);
  }

  // ---- 货轮 ----
  const hullColors = [0x8a3030, 0x30507a, 0x3a5a46, 0x707680];
  const shipSpecs = [
    { z: -900, dist: 420, len: 150 }, { z: -100, dist: 640, len: 190 },
    { z: 500, dist: 330, len: 130 }, { z: 1350, dist: 520, len: 170 },
  ];
  shipSpecs.forEach((s, i) => {
    const x = coastX(s.z) + s.dist;
    const ship = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(s.len, 12, 22),
      new THREE.MeshStandardMaterial({ color: hullColors[i % 4], roughness: 0.8 })
    );
    hull.position.y = 4;
    hull.castShadow = true;
    ship.add(hull);
    const castle = new THREE.Mesh(
      new THREE.BoxGeometry(16, 16, 18),
      new THREE.MeshStandardMaterial({ color: 0xe8e8e4, roughness: 0.7 })
    );
    castle.position.set(-s.len / 2 + 14, 16, 0);
    ship.add(castle);
    // 甲板集装箱
    const cont = new THREE.InstancedMesh(
      new THREE.BoxGeometry(11, 2.6, 4.6),
      makeTintSimple(),
      24
    );
    const cols = [0xa04848, 0x4878a0, 0xa09048, 0x4a8a5a];
    const m = new THREE.Matrix4(), c = new THREE.Color();
    const arr = new Float32Array(24 * 3);
    for (let k = 0; k < 24; k++) {
      m.makeTranslation(-s.len / 2 + 32 + (k % 8) * 12.4, 11 + Math.floor(k / 8) * 2.7, (k % 3) * 5.2 - 5.2);
      cont.setMatrixAt(k, m);
      c.setHex(cols[(rng() * 4) | 0]);
      arr[k * 3] = c.r; arr[k * 3 + 1] = c.g; arr[k * 3 + 2] = c.b;
    }
    cont.geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(arr, 3));
    cont.castShadow = true;
    ship.add(cont);
    ship.position.set(x, -0.2, s.z);
    ship.rotation.y = (rng() - 0.5) * 0.5;
    g.add(ship);
  });

  // ---- 小艇 ----
  for (let i = 0; i < 7; i++) {
    const z = -1500 + rng() * 3000;
    const x = coastX(z) + 120 + rng() * 700;
    const boat = new THREE.Mesh(
      new THREE.BoxGeometry(9 + rng() * 10, 2.4, 4),
      new THREE.MeshStandardMaterial({ color: [0xe8e8e4, 0xd0d0cc, 0x8898a8][(rng() * 3) | 0], roughness: 0.7 })
    );
    boat.position.set(x, 0.2, z);
    boat.rotation.y = rng() * Math.PI;
    g.add(boat);
  }

  // ---- 港区：集装箱堆场 + 桥吊（南岸） ----
  const yardZ0 = 260, yardZ1 = 1150;
  const stacks = new THREE.InstancedMesh(new THREE.BoxGeometry(12, 2.7, 4.8), makeTintSimple(), 96);
  {
    const cols = [0xa04848, 0x4878a0, 0xa09048, 0x4a8a5a, 0xb07030];
    const m = new THREE.Matrix4(), c = new THREE.Color();
    const arr = new Float32Array(96 * 3);
    for (let k = 0; k < 96; k++) {
      const rowZ = yardZ0 + ((k / 6) | 0) * 34 + rng() * 10;
      const baseX = coastX(rowZ) - 105 - ((k % 2) * 26) - rng() * 30;
      const lvl = Math.floor(rng() * 3);
      m.makeTranslation(baseX, 1.5 + lvl * 2.8, rowZ + ((k % 6) - 2.5) * 5.4);
      stacks.setMatrixAt(k, m);
      c.setHex(cols[(rng() * cols.length) | 0]);
      arr[k * 3] = c.r; arr[k * 3 + 1] = c.g; arr[k * 3 + 2] = c.b;
    }
    stacks.geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(arr, 3));
    stacks.castShadow = true;
    g.add(stacks);
  }
  // 桥吊 ×3
  const craneMat = new THREE.MeshStandardMaterial({ color: 0xc85a28, roughness: 0.6, metalness: 0.3 });
  for (let i = 0; i < 3; i++) {
    const cz = 430 + i * 260;
    const cx = coastX(cz) - 32;
    const crane = new THREE.Group();
    const legG = new THREE.BoxGeometry(3, 58, 3);
    for (const [lx, lz] of [[-14, -9], [14, -9], [-14, 9], [14, 9]]) {
      const leg = new THREE.Mesh(legG, craneMat);
      leg.position.set(lx, 29, lz);
      crane.add(leg);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(150, 4, 5), craneMat);
    beam.position.set(10, 60, 0);
    crane.add(beam);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 26), craneMat);
    boom.position.set(70, 58, 0);
    crane.add(boom);
    crane.position.set(cx, 0, cz);
    crane.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.add(crane);
  }

  // ---- 台场意向小岛 + 摩天轮 ----
  const isZ = 520;
  const isX = coastX(isZ) + 820;
  const island = new THREE.Mesh(
    new THREE.CircleGeometry(210, 28),
    new THREE.MeshStandardMaterial({ color: 0xcabb90, roughness: 1 })
  );
  island.rotation.x = -Math.PI / 2;
  island.position.set(isX, 0.05, isZ);
  g.add(island);
  const isGreen = new THREE.Mesh(
    new THREE.CircleGeometry(150, 24),
    new THREE.MeshStandardMaterial({ color: 0x5a7a44, roughness: 1 })
  );
  isGreen.rotation.x = -Math.PI / 2;
  isGreen.position.set(isX - 40, 0.09, isZ);
  g.add(isGreen);
  const bMat = new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: 0.6 });
  const bSpecs = [
    [-90, -60, 34, 46, 20], [-40, 40, 26, 30, 24], [30, -70, 30, 24, 18],
    [70, 30, 22, 38, 22], [-10, -10, 40, 18, 30],
  ];
  for (const [dx, dz, w, h, d] of bSpecs) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bMat);
    b.position.set(isX + dx, h / 2, isZ + dz);
    b.castShadow = true;
    g.add(b);
  }
  // 摩天轮（夜里轮圈自发光）
  const wheel = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(46, 2.4, 8, 40),
    nightEmissive(new THREE.MeshStandardMaterial({ color: 0xd8dce2, roughness: 0.5, metalness: 0.3, emissive: 0xff88b0, emissiveIntensity: 1 }), 1.3)
  );
  wheel.add(ring);
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const cab = new THREE.Mesh(new THREE.SphereGeometry(3.4, 8, 6), cabinMat);
    cab.position.set(Math.cos(a) * 46, Math.sin(a) * 46, 0);
    wheel.add(cab);
  }
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(4, 66, 4), craneMat);
    leg.position.set(s * 14, -32, 0);
    leg.rotation.z = s * 0.28;
    wheel.add(leg);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 6, 8), craneMat);
  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);
  wheel.position.set(isX + 95, 56, isZ);
  wheel.rotation.y = Math.PI / 2; // 轮面朝西（城市方向）
  g.add(wheel);

  scene.add(g);
  return { wheel };
}

function makeTintSimple() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aTint;\nvarying vec3 vTint;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTint;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity );\ndiffuseColor.rgb *= vTint;');
  };
  mat.customProgramCacheKey = () => 'tint-v1';
  return mat;
}
