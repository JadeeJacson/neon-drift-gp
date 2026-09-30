// props.js — 路面与街具层：让「空马路」变成「城市马路」。
//
// 铁律：所有道具的落地高度必须对齐既有地面分层，否则会触发上一轮修过的 z-fighting。
//   草地 0 · 路面顶 0.10 · 标线 0.12~0.15 · 人行道垫层顶 0.35 · 河面 -0.18 · 海面 -0.42
// 所以：在人行道上 → 底面 y=0.35；在马路上 → 底面 y=0.10；井盖盖在沥青上 → 0.10。
//
// 另一个铁律：道具一律**不进碰撞网格**。赛道是按路网矩形吸附生成的，
// 往碰撞网格里加道具会让已验证的赛道判定失效——这一层只负责视觉。
import * as THREE from 'three';
import { CROSS, coastX, makeRng } from './layout.js';
import { nightEmissive } from './fx.js';

const Y_ROAD = 0.10;   // 沥青顶面
const Y_WALK = 0.35;   // 人行道垫层顶面

// 纯色实例材质（吃 aTint 乘色）
function tintMat(key, params = {}) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, ...params });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aTint;\nvarying vec3 vTint;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTint;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity );\ndiffuseColor.rgb *= vTint;');
  };
  mat.customProgramCacheKey = () => key;
  return mat;
}

// 把 {pos,scale,rot,tint} 列表烤成一个 InstancedMesh
function bake(geo, mat, list, yJitter = 0) {
  if (!list.length) return null;
  const mesh = new THREE.InstancedMesh(geo, mat, list.length);
  const arr = new Float32Array(list.length * 3);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const v = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  list.forEach((p, i) => {
    e.set(0, p.rot || 0, 0);
    q.setFromEuler(e);
    v.set(p.x, p.y + (yJitter ? (Math.random() - 0.5) * yJitter : 0), p.z);
    // 缺省 1：很多调用点不传缩放，直接 set(undefined) 会得到 NaN 矩阵、整批道具消失
    s.set(p.sx ?? 1, p.sy ?? 1, p.sz ?? 1);
    m.compose(v, q, s);
    mesh.setMatrixAt(i, m);
    c.setHex(p.tint);
    arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b;
  });
  geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(arr, 3));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return mesh;
}

export function buildProps(scene, layout) {
  const rng = makeRng(20260928);
  const g = new THREE.Group();
  g.name = 'props';
  const count = {};

  // 沿路取样器：返回人行道外侧一点的世界坐标
  const majorRoads = layout.roadsV.concat(layout.roadsH).filter((r) => r.major);
  const nearCross = (x, z) => Math.hypot(x - CROSS.x, z - CROSS.z);

  // ================= 锥桶 =================
  {
    const spots = [];
    // 施工路段：随机挑主干道的一小段摆锥桶
    for (const r of majorRoads) {
      if (rng() < 0.72) continue;
      const vertical = layout.roadsV.includes(r);
      const t0 = (rng() - 0.5) * 1400;
      const n = 3 + ((rng() * 5) | 0);
      for (let i = 0; i < n; i++) {
        const t = t0 + i * 2.6;
        const off = (r.w / 2 - 1.6) * (i % 2 ? 1 : -1);
        const x = vertical ? r.pos + off : t;
        const z = vertical ? t : r.pos + off;
        if (nearCross(x, z) < 45) continue;
        if (x > coastX(z) - 30) continue;
        spots.push({ x, y: Y_ROAD, z, tint: i % 3 === 0 ? 0xff6a2a : 0xf0f0ea });
      }
    }
    const coneGeo = new THREE.ConeGeometry(0.34, 0.78, 8);
    coneGeo.translate(0, 0.39, 0);
    const m = bake(coneGeo, tintMat('prop-cone', { roughness: 0.75 }), spots);
    if (m) { g.add(m); count.cone = spots.length; }
  }

  // ================= 护栏（河岸 / 湾岸公路 / 桥头）=====================
  {
    const spots = [];
    const railMat = tintMat('prop-rail', { roughness: 0.55, metalness: 0.45 });
    const rail = (x, z, rot) => spots.push({ x, y: Y_ROAD, z, rot, sx: 1, sy: 1, sz: 1, tint: 0xb8bcc4 });

    // 河两岸
    const rz = layout.river.z, rw = layout.river.w;
    for (let x = -2350; x < coastX(rz) - 60; x += 4.2) {
      for (const s of [-1, 1]) rail(x, rz + s * (rw / 2 + 2.6), Math.PI / 2);
    }
    // 湾岸公路外侧（沿海岸线走）
    for (let z = -2600; z <= 2600; z += 4.2) {
      const cx = coastX(z) - 48;
      rail(cx, z, Math.atan2(coastX(z + 20) - coastX(z - 20), 40) + Math.PI / 2);
    }
    // 箱线图：护栏是长条，用 InstancedMesh 每段一个 box 代价高，这里退化为每 4.2m 一个短立柱 + 顶部横杆
    const postGeo = new THREE.BoxGeometry(0.14, 0.95, 0.14);
    postGeo.translate(0, 0.475, 0);
    const m = bake(postGeo, railMat, spots);
    if (m) { g.add(m); count.rail = spots.length; }
  }

  // ================= 公交站 / 街具 =================
  {
    const busStops = [], benches = [], bins = [], hydrants = [], booths = [], bollards = [];

    for (const r of majorRoads) {
      if (rng() < 0.45) continue;
      const vertical = layout.roadsV.includes(r);
      const off = r.w / 2 + 3.2;
      for (let t = -1500 + rng() * 300; t < 1500; t += 55 + rng() * 90) {
        const x = vertical ? r.pos + off : t;
        const z = vertical ? t : r.pos + off;
        if (nearCross(x, z) < 60) continue;
        if (x > coastX(z) - 60) continue;
        if (Math.abs(x) > 2300 || Math.abs(z) > 2300) continue;
        const rot = vertical ? 0 : Math.PI / 2;
        const roll = rng();
        if (roll < 0.30) busStops.push({ x, y: Y_WALK, z, rot, tint: 0xd9dde2 });
        else if (roll < 0.52) benches.push({ x, y: Y_WALK, z, rot, tint: rng() < 0.5 ? 0x8a6a44 : 0x6f6a60 });
        else if (roll < 0.70) bins.push({ x, y: Y_WALK, z, rot, tint: 0x4c545c });
        else if (roll < 0.80) hydrants.push({ x, y: Y_WALK, z, rot, tint: 0xc4402c });
        else if (roll < 0.87) booths.push({ x, y: Y_WALK, z, rot, tint: 0x2f6a4a });
        else bollards.push({ x, y: Y_WALK, z, rot, tint: 0x5a6068 });
      }
    }

    // 公交站：顶棚（盒）+ 两根立柱
    const canopyGeo = new THREE.BoxGeometry(3.6, 0.16, 1.5);
    canopyGeo.translate(0, 2.45, 0);
    const mc = bake(canopyGeo, tintMat('prop-canopy', { roughness: 0.5, metalness: 0.2 }), busStops);
    if (mc) { g.add(mc); count.busStop = busStops.length; }
    const legList = [];
    for (const b of busStops) {
      for (const s of [-1, 1]) legList.push({ ...b, x: b.x + Math.cos(b.rot) * s * 1.6, z: b.z - Math.sin(b.rot) * s * 1.6, sx: 0.1, sy: 0.62, sz: 0.1, tint: 0x50575e });
    }
    const legGeo = new THREE.BoxGeometry(1, 1, 1);
    legGeo.translate(0, 0.5, 0);
    const ml = bake(legGeo, tintMat('prop-leg', { roughness: 0.5, metalness: 0.3 }), legList);
    if (ml) g.add(ml);

    // 长椅
    const benchGeo = new THREE.BoxGeometry(1.9, 0.12, 0.52);
    benchGeo.translate(0, 0.46, 0);
    const mbe = bake(benchGeo, tintMat('prop-bench', { roughness: 0.9 }), benches);
    if (mbe) { g.add(mbe); count.bench = benches.length; }

    // 垃圾桶（带顶盖）
    const binGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.85, 10);
    binGeo.translate(0, 0.425, 0);
    const mbi = bake(binGeo, tintMat('prop-bin', { roughness: 0.8 }), bins);
    if (mbi) { g.add(mbi); count.bin = bins.length; }

    // 消防栓
    const hyGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.72, 8);
    hyGeo.translate(0, 0.36, 0);
    const mhy = bake(hyGeo, tintMat('prop-hydrant', { roughness: 0.6 }), hydrants);
    if (mhy) { g.add(mhy); count.hydrant = hydrants.length; }

    // 绿色电话亭（东京街头标志物）
    const boothGeo = new THREE.BoxGeometry(1.0, 2.3, 1.0);
    boothGeo.translate(0, 1.15, 0);
    const mbo = bake(boothGeo, tintMat('prop-booth', { roughness: 0.5, metalness: 0.25 }), booths);
    if (mbo) { g.add(mbo); count.booth = booths.length; }

    // 系缆桩
    const bolGeo = new THREE.CylinderGeometry(0.1, 0.13, 0.75, 8);
    bolGeo.translate(0, 0.375, 0);
    const mbol = bake(bolGeo, tintMat('prop-bollard', { roughness: 0.6, metalness: 0.3 }), bollards);
    if (mbol) { g.add(mbol); count.bollard = bollards.length; }
  }

  // ================= 交通信号灯（干道交叉口）=====================
  {
    const posts = [], heads = [];
    for (const rv of layout.roadsV) {
      if (!rv.major) continue;
      for (const rh of layout.roadsH) {
        if (!rh.major) continue;
        if (nearCross(rv.pos, rh.pos) < 60) continue;   // 涩谷路口已有地标信号，另说
        if (rng() < 0.55) continue;
        // 路口东北角的两个方向
        for (const [sx, sz] of [[1, 1], [-1, 1]]) {
          const x = rv.pos + sx * (rv.w / 2 + 2.2);
          const z = rh.pos + sz * (rh.w / 2 + 2.2);
          if (x > coastX(z) - 40) continue;
          posts.push({ x, y: Y_WALK, z, rot: 0, tint: 0x3c4147 });
          heads.push({ x, y: Y_WALK + 5.4, z, rot: sx > 0 ? Math.PI / 2 : -Math.PI / 2, tint: 0x22262b });
        }
      }
    }
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.14, 5.4, 6);
    poleGeo.translate(0, 2.7, 0);
    const mp = bake(poleGeo, tintMat('prop-sigpole', { roughness: 0.6, metalness: 0.35 }), posts);
    if (mp) { g.add(mp); count.signal = posts.length; }
    const headGeo = new THREE.BoxGeometry(0.42, 1.25, 0.34);
    // 红灯夜里自己会亮，白天灭
    const sigMat = nightEmissive(
      new THREE.MeshStandardMaterial({ color: 0x2a0c0c, emissive: 0xff2418, emissiveIntensity: 1, roughness: 0.4 }),
      2.2
    );
    const mh = bake(headGeo, sigMat, heads);
    if (mh) g.add(mh);
  }

  // ================= 井盖 / 路面补丁 =================
  {
    const covers = [];
    for (const r of majorRoads) {
      const vertical = layout.roadsV.includes(r);
      for (let t = -1400; t < 1400; t += 26 + rng() * 40) {
        if (rng() < 0.62) continue;
        const off = (rng() - 0.5) * (r.w - 2.4);
        const x = vertical ? r.pos + off : t;
        const z = vertical ? t : r.pos + off;
        if (nearCross(x, z) < 30) continue;
        if (x > coastX(z) - 40) continue;
        covers.push({ x, y: Y_ROAD, z, rot: rng() * Math.PI, tint: 0x6a6a68 });
      }
    }
    const covGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.03, 12);
    const mc = bake(covGeo, tintMat('prop-manhole', { roughness: 0.85, metalness: 0.3 }), covers);
    if (mc) { g.add(mc); count.manhole = covers.length; }
  }

  // ================= 路面箭头（干道中线，断续）=====================
  {
    const arrows = [];
    for (const r of majorRoads) {
      const vertical = layout.roadsV.includes(r);
      for (let t = -1200; t < 1200; t += 62) {
        if (rng() < 0.7) continue;
        const x = vertical ? r.pos : t;
        const z = vertical ? t : r.pos;
        if (nearCross(x, z) < 55) continue;
        if (x > coastX(z) - 40) continue;
        for (const s of [-1, 1]) {
          const off = s * (r.w * 0.25);
          arrows.push({
            x: vertical ? x + off : x,
            y: Y_ROAD + 0.02,
            z: vertical ? z : z + off,
            rot: (vertical ? 0 : Math.PI / 2) + (s > 0 ? 0 : Math.PI),
            tint: 0xd9d9cf,
          });
        }
      }
    }
    // 箭杆 + 箭头：两个 InstancedMesh 共用同一批变换，远看就是路面行驶箭头
    const arrowMat = nightEmissive(new THREE.MeshStandardMaterial({ color: 0xd9d9cf, roughness: 0.85 }), 0.3);
    const shaftGeo = new THREE.BoxGeometry(0.34, 0.02, 2.4);
    shaftGeo.translate(0, 0, -0.9);
    const ms = bake(shaftGeo, arrowMat, arrows);
    if (ms) { g.add(ms); count.arrow = arrows.length; }
    const headGeo = new THREE.BoxGeometry(0.86, 0.02, 0.9);
    headGeo.translate(0, 0, 0.55);
    const mh = bake(headGeo, arrowMat, arrows);
    if (mh) g.add(mh);
  }

  scene.add(g);
  return count;
}
