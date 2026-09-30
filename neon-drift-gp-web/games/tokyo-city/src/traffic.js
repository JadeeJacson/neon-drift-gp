// traffic.js — 车流（靠左行驶）、山手线式高架环线电车、涩谷路口人流
import * as THREE from 'three';
import { shared } from './env.js';
import { makeRng } from './layout.js';

// 注入点纪律（three.js meshphysical 片元着色器里 main() 的声明顺序）：
//   vec4 diffuseColor = ...;        ← 只有 diffuseColor 可用
//   vec3 totalEmissiveRadiance = ...;← 自发光只能挂在这里
//   #include <normal_fragment_begin>  ← normal（法线）到这里才存在
// 所以「碰 diffuseColor 的部分」和「碰自发光的部分」必须拆成两段挂到不同锚点；
// 需要法线时不要读 fragment 里的 normal，改用顶点阶段传下来的 objectNormal varying。
const VERT_PARS = /* glsl */ `
attribute vec3 aTint;
varying float vLocalY;
varying vec3 vTint;
varying vec3 vObjN;
`;
// objectNormal 由 <beginnormal_vertex> 声明，早于 <begin_vertex>，此处可安全取用
const VERT_CODE = /* glsl */ `
vLocalY = position.y;
vTint = aTint;
vObjN = objectNormal;
`;
const FRAG_PARS = /* glsl */ `
uniform float uDay;
varying float vLocalY;
varying vec3 vTint;
varying vec3 vObjN;
`;
// 车体上段车窗暗带 + 车身色（局部 y 以米计，几何已平移到底面为 0）
const FRAG_DIFFUSE = /* glsl */ `
diffuseColor.rgb *= vTint;
float winBand = step(0.72, vLocalY) * (1.0 - step(1.12, vLocalY));
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.06, 0.08), winBand);
`;
// 夜：前白灯(+z) / 尾红灯(-z)
const FRAG_EMISSIVE = /* glsl */ `
float nightF = 1.0 - uDay;
float lampY = step(0.45, vLocalY) * (1.0 - step(0.9, vLocalY));
float front = step(0.5, vObjN.z) * lampY;
float rear = step(vObjN.z, -0.5) * lampY;
totalEmissiveRadiance += vec3(1.0, 0.95, 0.85) * front * nightF * 2.4;
totalEmissiveRadiance += vec3(1.0, 0.12, 0.08) * rear * nightF * 2.0;
`;

function makeVehicleMaterial() {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.18 });
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
  mat.customProgramCacheKey = () => 'vehicle-v2';
  return mat;
}
export { makeVehicleMaterial };

export class Traffic {
  constructor(scene, layout) {
    const rng = makeRng(910);
    this.group = new THREE.Group();
    this.group.name = 'traffic';

    // ---- 车流 ----
    this.cars = [];
    const carGeo = new THREE.BoxGeometry(1.9, 1.35, 4.4);
    carGeo.translate(0, 0.72, 0);
    const palette = [0xd8d8dc, 0xc8c8cc, 0x2a2d33, 0x8a8f96, 0x3a4a6a, 0x6a2a2a, 0xd8b418, 0x37503a];
    const N = 130;
    this.carMesh = new THREE.InstancedMesh(carGeo, makeVehicleMaterial(), N);
    const tint = new Float32Array(N * 3);
    const col = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const roadV = rng() < 0.5;
      const road = roadV ? layout.roadsV[(rng() * layout.roadsV.length) | 0] : layout.roadsH[(rng() * layout.roadsH.length) | 0];
      const dir = rng() < 0.5 ? 1 : -1;
      const laneOff = road.w * (road.major ? 0.22 + (rng() < 0.5 ? 0 : 0.16) : 0.24);
      this.cars.push({
        vertical: roadV, pos: road.pos, dir,
        lane: roadV ? laneOff : -laneOff, // 行进方向左侧偏移（见 positionAt）
        t: (rng() * 2 - 1) * 1200,
        speed: 9 + rng() * 6,
      });
      col.setHex(palette[(rng() * palette.length) | 0]);
      tint[i * 3] = col.r; tint[i * 3 + 1] = col.g; tint[i * 3 + 2] = col.b;
    }
    carGeo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3));
    this.carMesh.frustumCulled = false;
    this.group.add(this.carMesh);
    this._m = new THREE.Matrix4();
    this._q = new THREE.Quaternion();
    this._e = new THREE.Euler();
    this._v = new THREE.Vector3();
    this._s = new THREE.Vector3(1, 1, 1);

    // ---- 高架环线电车（贴着干道走的矩形环）----
    this.buildTrain(rng, layout);

    // ---- 人流（涩谷全向斑马线）----
    this.buildCrowd(rng);

    scene.add(this.group);
  }

  positionAt(c) {
    // 日本靠左行驶：行进方向左侧偏移
    if (c.vertical) {
      // 南行(+z) 左侧 = +x；北行 左侧 = -x
      return { x: c.pos + c.lane * c.dir, z: c.t, yaw: c.dir > 0 ? 0 : Math.PI };
    }
    // 东行(+x) 左侧 = -z；西行 左侧 = +z
    return { x: c.t, z: c.pos + c.lane * c.dir, yaw: c.dir > 0 ? Math.PI / 2 : -Math.PI / 2 };
  }

  buildTrain(rng, layout) {
    const near = (roads, target) =>
      roads.reduce((a, b) => (Math.abs(b.pos - target) < Math.abs(a.pos - target) ? b : a));
    const xW = near(layout.roadsV, -520).pos;
    const xE = near(layout.roadsV, 520).pos;
    const zN = near(layout.roadsH, -480).pos;
    const zS = near(layout.roadsH, 480).pos;
    this.rail = { xW, xE, zN, zS, t: 0, speed: 19, per: 0 };
    const deckY = 11.2;

    const deckMat = new THREE.MeshStandardMaterial({ color: 0x5a5e63, roughness: 0.85 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x7c8086, roughness: 0.9 });
    const deckGeo = new THREE.BoxGeometry(1, 1, 1);
    deckGeo.translate(0, 0, 0);
    const segs = [];
    const pillars = [];
    const step = 24;
    // 四条边
    const edges = [
      { ax: 'x', from: xW, to: xE, at: zN }, { ax: 'z', from: zN, to: zS, at: xE },
      { ax: 'x', from: xE, to: xW, at: zS }, { ax: 'z', from: zS, to: zN, at: xW },
    ];
    for (const e of edges) {
      const len = Math.abs(e.to - e.from);
      const sgn = Math.sign(e.to - e.from);
      for (let t = 0; t < len; t += step) {
        const p = e.from + sgn * (t + step / 2);
        segs.push(e.ax === 'x' ? { x: p, z: e.at, sx: step, sz: 9 } : { x: e.at, z: p, sx: 9, sz: step });
        if (t % 48 === 0) pillars.push({ x: e.ax === 'x' ? p : e.at, z: e.ax === 'x' ? e.at : p });
      }
    }
    const deckMesh = new THREE.InstancedMesh(deckGeo, deckMat, segs.length);
    {
      const m = new THREE.Matrix4();
      segs.forEach((s, i) => {
        m.makeScale(s.sx, 1.1, s.sz);
        m.setPosition(s.x, deckY, s.z);
        deckMesh.setMatrixAt(i, m);
      });
    }
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    this.group.add(deckMesh);

    const pillarGeo = new THREE.CylinderGeometry(0.7, 0.9, deckY, 8);
    pillarGeo.translate(0, deckY / 2, 0);
    const pillarMesh = new THREE.InstancedMesh(pillarGeo, pillarMat, pillars.length);
    {
      const m = new THREE.Matrix4();
      pillars.forEach((p, i) => {
        m.makeTranslation(p.x, 0, p.z);
        pillarMesh.setMatrixAt(i, m);
      });
    }
    pillarMesh.castShadow = true;
    this.group.add(pillarMesh);

    // 列车：4 节，绿色山手线风
    const carGeo = new THREE.BoxGeometry(2.9, 3.1, 18.5);
    carGeo.translate(0, 1.55, 0);
    const trainMat = new THREE.MeshStandardMaterial({ color: 0x4fae4a, roughness: 0.5, metalness: 0.2 });
    trainMat.onBeforeCompile = (shader) => {
      shader.uniforms.uDay = shared.uDay;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vLocalY;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocalY = position.y;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uDay;\nvarying float vLocalY;')
        .replace('vec4 diffuseColor = vec4( diffuse, opacity );',
          'vec4 diffuseColor = vec4( diffuse, opacity );\nfloat band = step(1.35, vLocalY) * (1.0 - step(1.95, vLocalY));\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92,0.94,0.96), band);')
        .replace('vec3 totalEmissiveRadiance = emissive;',
          'vec3 totalEmissiveRadiance = emissive;\nfloat wband = step(1.95, vLocalY) * (1.0 - step(2.55, vLocalY));\ntotalEmissiveRadiance += vec3(1.0,0.92,0.7) * wband * (1.0 - uDay) * 1.2;');
    };
    trainMat.customProgramCacheKey = () => 'train-v1';
    this.trainMesh = new THREE.InstancedMesh(carGeo, trainMat, 4);
    this.trainMesh.frustumCulled = false;
    this.group.add(this.trainMesh);
    this.trainY = deckY + 0.55 + 1.1;
  }

  trainPos(t) {
    const { xW, xE, zN, zS } = this.rail;
    const per = 2 * ((xE - xW) + (zS - zN));
    let d = ((t % per) + per) % per;
    const wE = xE - xW, sN = zS - zN;
    if (d < wE) return { x: xW + d, z: zN, yaw: Math.PI / 2 };
    d -= wE;
    if (d < sN) return { x: xE, z: zN + d, yaw: 0 };
    d -= sN;
    if (d < wE) return { x: xE - d, z: zS, yaw: -Math.PI / 2 };
    d -= wE;
    return { x: xW, z: zS - d, yaw: Math.PI };
  }

  buildCrowd(rng) {
    const N = 220;
    this.crowd = [];
    // 6 条过街路径：4 臂斑马带 + 2 对角
    const band = 2.0, off = 19.6;
    const paths = [
      { from: [-17, off], to: [17, off], jit: band },    // 北带（沿 x 走）
      { from: [17, -off], to: [-17, -off], jit: band },  // 南带
      { from: [off, -13], to: [off, 13], jit: band },    // 东带（沿 z 走）
      { from: [-off, 13], to: [-off, -13], jit: band },  // 西带
      { from: [-13, -13], to: [13, 13], jit: 2.4 },      // 对角 /
      { from: [-13, 13], to: [13, -13], jit: 2.4 },      // 对角 \
    ];
    const geo = new THREE.CapsuleGeometry(0.27, 1.05, 3, 6);
    geo.translate(0, 0.85, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    this.crowdMesh = new THREE.InstancedMesh(geo, mat, N);
    const tint = new Float32Array(N * 3);
    const col = new THREE.Color();
    const clothes = [0x7a8090, 0x9aa0aa, 0xb0a08a, 0x8a9a7a, 0xa08a9a, 0x6a7080, 0xc0b4a4, 0x8095aa];
    for (let i = 0; i < N; i++) {
      const p = paths[(rng() * paths.length) | 0];
      this.crowd.push({
        path: p, dir: rng() < 0.5 ? 1 : -1,
        t: rng(), speed: 0.010 + rng() * 0.012,
        jit: (rng() - 0.5) * 2 * p.jit,
      });
      col.setHex(clothes[(rng() * clothes.length) | 0]);
      tint[i * 3] = col.r; tint[i * 3 + 1] = col.g; tint[i * 3 + 2] = col.b;
    }
    geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tint, 3));
    // capsule 也要吃 aTint：纯色实例染色
    const matTint = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    matTint.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 aTint;\nvarying vec3 vTint;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vTint;')
        .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity );\ndiffuseColor.rgb *= vTint;');
    };
    matTint.customProgramCacheKey = () => 'tint-v1';
    this.crowdMesh.material = matTint;
    this.crowdMesh.frustumCulled = false;
    this.group.add(this.crowdMesh);
  }

  update(dt) {
    // 车流
    const m = this._m, q = this._q, e = this._e, v = this._v, s = this._s;
    for (let i = 0; i < this.cars.length; i++) {
      const c = this.cars[i];
      c.t += c.dir * c.speed * dt;
      if (c.t > 1250) c.t = -1250;
      if (c.t < -1250) c.t = 1250;
      const p = this.positionAt(c);
      e.set(0, p.yaw, 0);
      q.setFromEuler(e);
      v.set(p.x, 0.11, p.z);
      m.compose(v, q, s);
      this.carMesh.setMatrixAt(i, m);
    }
    this.carMesh.instanceMatrix.needsUpdate = true;

    // 电车
    this.rail.t += this.rail.speed * dt;
    for (let i = 0; i < 4; i++) {
      const back = i * 20.5;
      const p = this.trainPos(this.rail.t - back);
      e.set(0, p.yaw, 0);
      q.setFromEuler(e);
      v.set(p.x, this.trainY, p.z);
      m.compose(v, q, s);
      this.trainMesh.setMatrixAt(i, m);
    }
    this.trainMesh.instanceMatrix.needsUpdate = true;

    // 人流
    for (let i = 0; i < this.crowd.length; i++) {
      const c = this.crowd[i];
      c.t += c.speed * c.dir * dt * 0.6;
      if (c.t > 1) { c.t = 0; c.jit = (Math.random() - 0.5) * 2 * c.path.jit; }
      if (c.t < 0) { c.t = 1; c.jit = (Math.random() - 0.5) * 2 * c.path.jit; }
      const [x0, z0] = c.path.from, [x1, z1] = c.path.to;
      const x = x0 + (x1 - x0) * c.t + c.jit * 0.5;
      const z = z0 + (z1 - z0) * c.t + c.jit;
      const bob = Math.abs(Math.sin(c.t * 90 + i)) * 0.05;
      v.set(x, 0.15 + bob, z);
      e.set(0, Math.atan2(x1 - x0, z1 - z0) * c.dir, 0);
      q.setFromEuler(e);
      m.compose(v, q, s);
      this.crowdMesh.setMatrixAt(i, m);
    }
    this.crowdMesh.instanceMatrix.needsUpdate = true;
  }
}
