// houses.js — 郊区独栋与农村村落：盒体 + 四棱锥屋顶（实例化），农田色块。
// 房屋墙面用缩小版窗写着色器（夜里有暖窗），屋顶深灰/赭红。
import * as THREE from 'three';
import { makeRng } from './layout.js';
import { shared } from './env.js';

const VERT_PARS = /* glsl */ `
attribute vec3 aSize;
attribute float aSeed;
attribute vec3 aTint;
varying vec3 vFacade;
varying vec2 vDim;
varying float vSeed;
varying vec3 vTint;
`;
const VERT_CODE = /* glsl */ `
vec3 an = objectNormal;
if (abs(an.y) > 0.5) {
  vFacade = vec3(0.0);
} else if (abs(an.x) > 0.5) {
  vFacade = vec3(transformed.z * aSize.z, transformed.y * aSize.y, an.x);
  vDim = vec2(aSize.z, aSize.y);
} else {
  vFacade = vec3(transformed.x * aSize.x, transformed.y * aSize.y, an.z + 2.0);
  vDim = vec2(aSize.x, aSize.y);
}
vSeed = aSeed;
vTint = aTint;
`;
const FRAG_PARS = /* glsl */ `
uniform float uDay;
varying vec3 vFacade;
varying vec2 vDim;
varying float vSeed;
varying vec3 vTint;
float hHash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
`;
const FRAG_DIFFUSE = /* glsl */ `
diffuseColor.rgb *= vTint;
float inU = step(0.5, vFacade.x) * step(vFacade.x, vDim.x - 0.5);
float winY = step(0.75, vFacade.y) * (1.0 - step(min(2.7, vDim.y - 0.7), vFacade.y));
vec2 cell = vec2(2.6, 2.3);
vec2 wid = floor(vFacade.xy / cell);
vec2 wf = fract(vFacade.xy / cell);
float win = step(0.22, wf.x) * step(wf.x, 0.78) * step(0.18, wf.y) * step(wf.y, 0.72);
float isWin = win * winY * inU * step(0.5, abs(vFacade.z));
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.30, 0.34, 0.40), isWin);
`;
const FRAG_EMISSIVE = /* glsl */ `
float nightF = 1.0 - uDay;
if (nightF > 0.003) {
  float lit = step(hHash(wid + vSeed * 9.17), 0.42);
  vec3 wcol = mix(vec3(1.0, 0.72, 0.42), vec3(0.75, 0.85, 1.0), step(0.75, hHash(wid * 1.31 + vSeed)));
  totalEmissiveRadiance += wcol * isWin * lit * 1.5 * nightF;
}
`;

function makeHouseMaterial() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0.02 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uDay = shared.uDay;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + VERT_PARS)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VERT_CODE);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + FRAG_PARS)
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity );\n' + FRAG_DIFFUSE)
      .replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive;\n' + FRAG_EMISSIVE);
  };
  mat.customProgramCacheKey = () => 'house-v1';
  return mat;
}

// 屋顶/农田这类「实例纯色」材质（aTint 乘色）
export function makeTintMaterial(baseParams = {}, key = 'tint-v1') {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, ...baseParams });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aTint;\nvarying vec3 vTint;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTint;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity );\ndiffuseColor.rgb *= vTint;');
  };
  mat.customProgramCacheKey = () => key;
  return mat;
}

const WALL_COLORS = [0xe8e2d4, 0xdcd4c2, 0xcfc4ae, 0xe2d8c8, 0xd8cfc0, 0xc9beb2, 0xbfc7cc, 0xd9c9b2];
const ROOF_COLORS = [0x3d444e, 0x4a4238, 0x5a4438, 0x3a4048, 0x6b4a3a, 0x464e44];
const FIELD_COLORS = [0x7a9a4a, 0x93ac52, 0xb0a044, 0x6a8a3a, 0x86a058];

export function buildHouses(scene, layout) {
  const rng = makeRng(4747);
  const spots = [];   // 郊区/农村宅地
  const fields = [];  // 农田

  for (const b of layout.blocks) {
    const w = b.x1 - b.x0, d = b.z1 - b.z0;
    if (b.zone === 'suburb') {
      // 郊区：每街区 3–6 栋 + 半数带块田/园地
      const n = 3 + ((rng() * 4) | 0);
      for (let i = 0; i < n; i++) {
        spots.push({
          x: b.x0 + 8 + rng() * (w - 16),
          z: b.z0 + 8 + rng() * (d - 16),
          big: rng() < 0.18,
        });
      }
      if (rng() < 0.5) fields.push({ x: b.cx, z: b.cz, w: w * 0.4, d: d * 0.4 });
    } else if (b.zone === 'rural') {
      // 农村：1–2 个村落团簇 + 大块农田
      const clusters = 1 + ((rng() * 2) | 0);
      for (let c = 0; c < clusters; c++) {
        const ccx = b.x0 + 14 + rng() * (w - 28);
        const ccz = b.z0 + 14 + rng() * (d - 28);
        const n = 4 + ((rng() * 7) | 0);
        const spread = 26 + rng() * 42;
        for (let i = 0; i < n; i++) {
          spots.push({
            x: ccx + (rng() - 0.5) * 2 * spread,
            z: ccz + (rng() - 0.5) * 2 * spread,
            big: rng() < 0.12,
          });
        }
      }
      const nF = 2 + ((rng() * 3) | 0);
      for (let i = 0; i < nF; i++) {
        fields.push({
          x: b.x0 + 20 + rng() * (w - 40),
          z: b.z0 + 20 + rng() * (d - 40),
          w: 50 + rng() * 90,
          d: 40 + rng() * 70,
        });
      }
    }
  }

  const n = spots.length;
  const rects = []; // 供碰撞网格使用
  const bodyGeo = new THREE.BoxGeometry(1, 1, 1);
  bodyGeo.translate(0, 0.5, 0);
  const roofGeo = new THREE.ConeGeometry(0.72, 1, 4); // 四棱锥屋顶，转 45° 对齐盒体
  roofGeo.rotateY(Math.PI / 4);
  roofGeo.translate(0, 0.5, 0);

  const bodyMesh = new THREE.InstancedMesh(bodyGeo, makeHouseMaterial(), Math.max(1, n));
  const roofMesh = new THREE.InstancedMesh(roofGeo, makeTintMaterial({ flatShading: true }, 'rooftint-v1'), Math.max(1, n));
  const aSize = new Float32Array(n * 3);
  const aSeed = new Float32Array(n);
  const wallTint = new Float32Array(n * 3);
  const roofTint = new Float32Array(n * 3);
  const col = new THREE.Color();
  const m = new THREE.Matrix4();

  for (let i = 0; i < n; i++) {
    const p = spots[i];
    const bw = (p.big ? 11 : 7.5) + rng() * 4.5;
    const bd = (p.big ? 8 : 6) + rng() * 3.5;
    const bh = (p.big ? 5.5 : 3.2) + rng() * 2.4;
    rects.push({ x: p.x, z: p.z, hw: bw / 2, hd: bd / 2 });
    m.makeScale(bw, bh, bd);
    m.setPosition(p.x, 0.06, p.z);
    bodyMesh.setMatrixAt(i, m);
    aSize[i * 3] = bw; aSize[i * 3 + 1] = bh; aSize[i * 3 + 2] = bd;
    aSeed[i] = rng() * 10;
    col.setHex(WALL_COLORS[(rng() * WALL_COLORS.length) | 0]);
    const sh = 0.85 + rng() * 0.25;
    wallTint[i * 3] = col.r * sh; wallTint[i * 3 + 1] = col.g * sh; wallTint[i * 3 + 2] = col.b * sh;
    col.setHex(ROOF_COLORS[(rng() * ROOF_COLORS.length) | 0]);
    roofTint[i * 3] = col.r; roofTint[i * 3 + 1] = col.g; roofTint[i * 3 + 2] = col.b;

    const rh = 1.7 + rng() * 1.5;
    m.makeScale(bw * 0.78, rh, bd * 0.78);
    m.setPosition(p.x, 0.06 + bh, p.z);
    roofMesh.setMatrixAt(i, m);
  }
  bodyGeo.setAttribute('aSize', new THREE.InstancedBufferAttribute(aSize, 3));
  bodyGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
  bodyGeo.setAttribute('aTint', new THREE.InstancedBufferAttribute(wallTint, 3));
  roofGeo.setAttribute('aTint', new THREE.InstancedBufferAttribute(roofTint, 3));
  bodyMesh.castShadow = true; bodyMesh.receiveShadow = true;
  roofMesh.castShadow = true; roofMesh.receiveShadow = true;
  bodyMesh.frustumCulled = false;
  roofMesh.frustumCulled = false;
  scene.add(bodyMesh);
  scene.add(roofMesh);

  // ---- 农田 ----
  const nf = fields.length;
  const fieldGeo = new THREE.BoxGeometry(1, 1, 1);
  const fieldMesh = new THREE.InstancedMesh(fieldGeo, makeTintMaterial({}, 'field-v1'), Math.max(1, nf));
  const fTint = new Float32Array(nf * 3);
  for (let i = 0; i < nf; i++) {
    const f = fields[i];
    m.makeScale(f.w, 0.08, f.d);
    m.setPosition(f.x, 0.04, f.z);
    fieldMesh.setMatrixAt(i, m);
    col.setHex(FIELD_COLORS[(rng() * FIELD_COLORS.length) | 0]);
    fTint[i * 3] = col.r; fTint[i * 3 + 1] = col.g; fTint[i * 3 + 2] = col.b;
  }
  fieldGeo.setAttribute('aTint', new THREE.InstancedBufferAttribute(fTint, 3));
  fieldMesh.receiveShadow = true;
  scene.add(fieldMesh);

  return { houses: n, fields: nf, rects };
}
