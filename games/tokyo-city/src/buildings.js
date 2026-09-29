// buildings.js — 实例化建筑：单一 InstancedMesh + onBeforeCompile 立面着色器。
// 白天：窗洞是暗色玻璃；夜晚：逐窗随机亮灯（暖/冷），底层店铺常亮。
// 同时产出屋顶杂物（空调外机箱、水塔、天线+航空障碍灯）。
import * as THREE from 'three';
import { makeRng } from './layout.js';
import { shared } from './env.js';
import { nightEmissive } from './fx.js';

const VERT_PARS = /* glsl */ `
attribute vec3 aSize;
attribute float aSeed;
attribute float aGlass;
varying vec3 vFacade;   // x: 沿墙米数, y: 离地米数, z: 墙编号
varying vec2 vDim;      // (墙向宽度, 建筑高)
varying float vSeed;
varying float vGlass;
varying float vWall;    // 0=墙 1=屋顶
`;

const VERT_CODE = /* glsl */ `
vec3 an = objectNormal;
if (abs(an.y) > 0.5) {
  vWall = 1.0;
  vFacade = vec3(0.0);
} else if (abs(an.x) > 0.5) {
  vWall = 0.0;
  vFacade = vec3(transformed.z * aSize.z, transformed.y * aSize.y, an.x * 1.5);
  vDim = vec2(aSize.z, aSize.y);
} else {
  vWall = 0.0;
  vFacade = vec3(transformed.x * aSize.x, transformed.y * aSize.y, an.z * 1.5 + 3.0);
  vDim = vec2(aSize.x, aSize.y);
}
vSeed = aSeed;
vGlass = aGlass;
`;

const FRAG_PARS = /* glsl */ `
uniform float uDay;
varying vec3 vFacade;
varying vec2 vDim;
varying float vSeed;
varying float vGlass;
varying float vWall;

float bHash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
`;

const FRAG_DIFFUSE = /* glsl */ `
float isRoof = vWall;
float winCell = mix(3.0, 4.3, vGlass);
vec2 cell = vec2(winCell, mix(3.35, 3.6, vGlass));
// 窗户是纯程序化的高频图案：直接 step 会在远处低于一个像素，
// 随相机移动产生剧烈摩尔纹/闪烁（夜里最明显，因为亮灯对比强）。
// 对策：① 用 fwidth 把窗洞边缘软化成覆盖率 ② 图案接近像素尺度时整体淡出到窗面积平均值。
vec2 fuv = vFacade.xy / cell;
vec2 fw = max(fwidth(fuv), vec2(1e-4));
vec2 wid = floor(fuv);
vec2 wf = fract(fuv);
vec2 wlo = mix(vec2(0.20, 0.28), vec2(0.07, 0.10), vGlass);
vec2 whi = mix(vec2(0.82, 0.80), vec2(0.93, 0.88), vGlass);
vec2 eIn = fw * 0.8;
float winX = smoothstep(wlo.x - eIn.x, wlo.x + eIn.x, wf.x)
           * (1.0 - smoothstep(whi.x - eIn.x, whi.x + eIn.x, wf.x));
float winY = smoothstep(wlo.y - eIn.y, wlo.y + eIn.y, wf.y)
           * (1.0 - smoothstep(whi.y - eIn.y, whi.y + eIn.y, wf.y));
float winSharp = winX * winY;
// winLod: 1=图案清晰可辨，0=已细到只剩几像素，改用平均值
// 淡出带必须卡在「窗还剩 3~11px」这一小段。之前写成 0.14~0.50，等于让逐窗随机的
// 亮灭在整个 0.14~0.50 区间以近满权重参与——那对应几百米纵深，相机一动就有大批
// 窗格越过边界整片翻牌，夜里对比度高，看上去就是整片楼体在闪。
float winLod = 1.0 - smoothstep(0.05, 0.18, max(fw.x, fw.y));
float winCover = mix(0.34, 0.52, vGlass);
float win = mix(winCover, winSharp, winLod);
// 楼体边缘与顶部两米不留窗
float inU = step(1.4, vFacade.x) * step(vFacade.x, vDim.x - 1.4);
float inV = step(2.2, vFacade.y) * step(vFacade.y, vDim.y - 2.4);
float isWin = win * inU * inV * (1.0 - isRoof);
// 底层店铺带
float store = step(0.1, vFacade.y) * (1.0 - step(3.6, vFacade.y)) * (1.0 - isRoof) * inU;

vec3 glassTint = mix(vec3(0.32, 0.38, 0.46), vec3(0.20, 0.28, 0.40), vGlass);
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * glassTint, isWin);
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.50, 0.48, 0.46), store * (1.0 - isWin));
`;

const FRAG_EMISSIVE = /* glsl */ `
float nightF = 1.0 - uDay;
if (nightF > 0.003) {
  float litP = mix(0.5, 0.18, vGlass);
  float lit = step(bHash21(wid + vSeed * 7.31), litP);
  // 少数整层熄灯（写字楼）
  float floorLit = step(bHash21(vec2(wid.y * 0.37, vSeed * 2.13)), 0.9);
  // 远场连颜色都要退化成均值：逐格 hash 出来的冷暖色差落在几像素的窗上，
  // 表现为整片楼的色温抖动，比亮度抖动更难受。
  vec3 wcol = mix(vec3(0.85, 0.78, 0.735),
                  mix(vec3(1.0, 0.76, 0.47), vec3(0.70, 0.80, 1.0),
                      step(0.5, bHash21(wid * 1.71 + vSeed * 3.7))),
                  winLod);
  wcol = mix(wcol, vec3(1.0, 0.86, 0.62), vGlass * 0.5);
  float storeLit = step(bHash21(vec2(floor(vFacade.x / 5.0), vSeed * 5.31)), 0.72);
  float litAmp = mix(1.15, 0.85, vGlass);
  float e = isWin * lit * floorLit * litAmp + store * storeLit * 1.0;
  // 远处逐窗随机的 hash 同样会闪：用窗口平均亮度近似，保持夜景整体发光感。
  // floorLit 的均值是 0.9（10% 整层熄灯），必须计入，否则远场比近场平均亮 11%，
  // LOD 交界处整片楼会跳一次亮度。
  float eAvg = (winCover * inU * inV * (1.0 - isRoof)) * litP * 0.9 * litAmp
             + store * 0.72;
  float eMix = mix(eAvg, e, winLod);
  totalEmissiveRadiance += wcol * eMix * nightF;
}
`;

export function buildBuildings(scene, layout) {
  const rng = makeRng(20260927 ^ 0x5eed);
  const lots = [];
  for (const b of layout.blocks) {
    if (b.zone === 'park' || b.zone === 'towerpark' || b.zone === 'crossing' || b.zone === 'suburb' || b.zone === 'rural' || b.zone === 'coast') continue;
    subdivide(lots, b, b.zone, rng);
  }

  const info = [];   // 供 signs/landmarks 使用
  const mats = [];
  const list = [];
  for (const lot of lots) {
    const inset = 0.8 + rng() * 2.6;
    const w = lot.w - inset * 2;
    const d = lot.d - inset * 2;
    if (w < 7 || d < 7) continue;
    if (lot.zone === 'low') {
      // 低层圈向外交错稀疏，形成「城市→郊区」的渐变
      const rr = Math.hypot(lot.cx, lot.cz);
      const thin = 0.05 + THREE.MathUtils.smoothstep(rr, 1000, 1450) * 0.5;
      if (rng() < thin) continue;
    }
    const h = heightOf(lot.zone, rng);
    const glass = lot.zone === 'tower' ? 1 : (lot.zone === 'shibuya' && rng() < 0.2 ? 1 : 0);
    list.push({ x: lot.cx, z: lot.cz, w, d, h, zone: lot.zone, glass });
  }

  const n = list.length;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  const aSize = new Float32Array(n * 3);
  const aSeed = new Float32Array(n);
  const aGlass = new Float32Array(n);
  const aTint = new Float32Array(n * 3);
  const mat = makeFacadeMaterial();

  const mesh = new THREE.InstancedMesh(geo, mat, n);
  const palette = [0xbdb5a6, 0xa89f8f, 0x98938a, 0xb2ab9d, 0x8d979b, 0xa19b8c, 0xc4bfb2, 0x7e8388];
  const glassPalette = [0x77848f, 0x6a7683, 0x808d9a, 0x5f6c7a];
  const m = new THREE.Matrix4();
  const col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const b = list[i];
    m.makeScale(b.w, b.h, b.d);
    m.setPosition(b.x, 0.35, b.z);
    mesh.setMatrixAt(i, m);
    aSize[i * 3] = b.w; aSize[i * 3 + 1] = b.h; aSize[i * 3 + 2] = b.d;
    aSeed[i] = rng() * 10;
    aGlass[i] = b.glass;
    const base = b.glass ? glassPalette[(rng() * glassPalette.length) | 0] : palette[(rng() * palette.length) | 0];
    col.setHex(base);
    const shade = 0.72 + rng() * 0.34;
    aTint[i * 3] = col.r * shade; aTint[i * 3 + 1] = col.g * shade; aTint[i * 3 + 2] = col.b * shade;
    info.push(b);
  }
  geo.setAttribute('aSize', new THREE.InstancedBufferAttribute(aSize, 3));
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
  geo.setAttribute('aGlass', new THREE.InstancedBufferAttribute(aGlass, 1));
  geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(aTint, 3));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  scene.add(mesh);

  mats.push(mesh);
  buildRoofClutter(scene, info, rng);
  return info;
}

function makeFacadeMaterial() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.04 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uDay = shared.uDay;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + VERT_PARS)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VERT_CODE);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + FRAG_PARS + '\nuniform vec3 aTintDummy;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity );\n' + FRAG_DIFFUSE)
      .replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive;\n' + FRAG_EMISSIVE);
  };
  // 改片元代码必须换 cache key，否则同一会话里会复用旧程序，着色器改动看不见
  mat.customProgramCacheKey = () => 'facade-v3';
  return mat;
}

function heightOf(zone, rng) {
  switch (zone) {
    case 'shibuya': return rng() < 0.12 ? 42 + rng() * 20 : 13 + Math.pow(rng(), 1.6) * 36;
    case 'tower': return 58 + Math.pow(rng(), 1.9) * 165;
    case 'low': return 7 + Math.pow(rng(), 1.4) * 17;
    default: return 10 + Math.pow(rng(), 1.6) * 46;
  }
}

function subdivide(out, b, zone, rng) {
  const maxA = zone === 'tower' ? 1900 : zone === 'shibuya' ? 700 : zone === 'low' ? 620 : 1050;
  const minA = 130;
  const stack = [{ x0: b.x0 + 1.5, x1: b.x1 - 1.5, z0: b.z0 + 1.5, z1: b.z1 - 1.5, zone }];
  let guard = 0;
  while (stack.length && guard++ < 4000) {
    const r = stack.pop();
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    const area = w * d;
    if (area < minA) continue;
    if (area <= maxA || w < 16 || d < 16) {
      out.push({ cx: (r.x0 + r.x1) / 2, cz: (r.z0 + r.z1) / 2, w, d, zone: r.zone });
      continue;
    }
    const splitGap = 1.6; // 巷道
    if (w >= d) {
      const cut = r.x0 + w * (0.36 + rng() * 0.28);
      stack.push({ x0: r.x0, x1: cut - splitGap / 2, z0: r.z0, z1: r.z1, zone: r.zone });
      stack.push({ x0: cut + splitGap / 2, x1: r.x1, z0: r.z0, z1: r.z1, zone: r.zone });
    } else {
      const cut = r.z0 + d * (0.36 + rng() * 0.28);
      stack.push({ x0: r.x0, x1: r.x1, z0: r.z0, z1: cut - splitGap / 2, zone: r.zone });
      stack.push({ x0: r.x0, x1: r.x1, z0: cut + splitGap / 2, z1: r.z1, zone: r.zone });
    }
  }
}

// ---- 屋顶杂物 ----
function buildRoofClutter(scene, info, rng) {
  const boxes = [];
  const towers = []; // 水塔
  const antennas = []; // 高楼天线
  for (const b of info) {
    if (b.h < 70) {
      const nB = 1 + ((rng() * 2) | 0);
      for (let i = 0; i < nB; i++) {
        const s = 1.4 + rng() * 2.6;
        boxes.push({
          x: b.x + (rng() - 0.5) * (b.w - s - 2),
          z: b.z + (rng() - 0.5) * (b.d - s - 2),
          y: b.h, s, h: 1 + rng() * 1.6,
        });
      }
      if (b.h < 26 && rng() < 0.3) {
        towers.push({ x: b.x + (rng() - 0.5) * (b.w - 6), z: b.z + (rng() - 0.5) * (b.d - 6), y: b.h, s: 0.9 + rng() * 0.5 });
      }
    }
    if (b.h > 95) {
      antennas.push({ x: b.x, z: b.z, y: b.h, h: Math.min(22, b.h * 0.16) });
    }
  }
  const boxMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x8a857c, roughness: 0.95 }),
    Math.max(1, boxes.length)
  );
  {
    const m = new THREE.Matrix4();
    boxes.forEach((p, i) => {
      m.makeScale(p.s, p.h, p.s * 0.8);
      m.setPosition(p.x, p.y + 0.35 + p.h / 2, p.z);
      boxMesh.setMatrixAt(i, m);
    });
  }
  boxMesh.castShadow = true;
  boxMesh.count = boxes.length;
  scene.add(boxMesh);

  const towerGeo = new THREE.CylinderGeometry(1, 1.15, 2.6, 8);
  towerGeo.translate(0, 1.3, 0);
  const towerMesh = new THREE.InstancedMesh(
    towerGeo,
    new THREE.MeshStandardMaterial({ color: 0x6d6a63, roughness: 0.9, flatShading: true }),
    Math.max(1, towers.length)
  );
  {
    const m = new THREE.Matrix4();
    towers.forEach((p, i) => {
      m.makeScale(p.s, 1, p.s);
      m.setPosition(p.x, p.y + 0.35, p.z);
      towerMesh.setMatrixAt(i, m);
    });
  }
  towerMesh.count = towers.length;
  towerMesh.castShadow = true;
  scene.add(towerMesh);

  if (antennas.length) {
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.2, 1, 5);
    poleGeo.translate(0, 0.5, 0);
    const poleMesh = new THREE.InstancedMesh(
      poleGeo,
      new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.6, metalness: 0.5 }),
      antennas.length
    );
    const beaconGeo = new THREE.SphereGeometry(0.42, 8, 6);
    const beaconMat = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff2200, emissiveIntensity: 3 });
    const m = new THREE.Matrix4();
    antennas.forEach((p, i) => {
      m.makeScale(1, p.h, 1);
      m.setPosition(p.x, p.y + 0.35, p.z);
      poleMesh.setMatrixAt(i, m);
    });
    const beacons = new THREE.InstancedMesh(beaconGeo, nightEmissive(beaconMat, 3.0), antennas.length);
    antennas.forEach((p, i) => {
      m.makeTranslation(p.x, p.y + 0.35 + p.h + 0.4, p.z);
      beacons.setMatrixAt(i, m);
    });
    poleMesh.castShadow = true;
    scene.add(poleMesh);
    scene.add(beacons);
  }
}
