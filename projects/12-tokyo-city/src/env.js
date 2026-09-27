// env.js — 昼夜环境中枢：天空穹顶、日/月、半球光、雾、辉光后处理。
// 所有材质通过 import { shared } 拿到同一批 uniform 对象引用，
// rig.update() 改一个 value，全部材质同步生效。
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const shared = {
  uDay: { value: 1.0 },   // 1 = 白天, 0 = 夜晚
  uDusk: { value: 0.0 },  // 1 = 日落/黄昏暖色峰值
  uTime: { value: 0.0 },
  uSunDir: { value: new THREE.Vector3(0.35, 0.75, 0.4).normalize() },
  uMoonDir: { value: new THREE.Vector3(-0.45, 0.62, -0.55).normalize() },
};

const D2R = Math.PI / 180;

// 夜间点光源登记表：白天强度自动归零（update 里统一驱动）
export const nightLights = [];
export function addNightLight(parent, pos, color, intensity, distance = 0) {
  const l = new THREE.PointLight(color, 0, distance, 2);
  l.position.copy(pos);
  l.userData.nightI = intensity;
  parent.add(l);
  nightLights.push(l);
  return l;
}

function dirFrom(elDeg, azDeg) {
  const el = elDeg * D2R, az = azDeg * D2R;
  return new THREE.Vector3(
    Math.cos(el) * Math.sin(az),
    Math.sin(el),
    Math.cos(el) * Math.cos(az)
  );
}

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const SKY_FRAG = /* glsl */ `
uniform float uDay;
uniform float uDusk;
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uMoonDir;
varying vec3 vDir;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

void main() {
  vec3 d = normalize(vDir);
  float h = max(d.y, 0.0);

  vec3 dayZen   = vec3(0.15, 0.35, 0.72);
  vec3 dayHor   = vec3(0.76, 0.85, 0.93);
  vec3 nightZen = vec3(0.006, 0.012, 0.038);
  vec3 nightHor = vec3(0.025, 0.045, 0.095);
  vec3 zen = mix(nightZen, dayZen, uDay);
  vec3 hor = mix(nightHor, dayHor, uDay);

  // 黄昏：地平线暖橙带
  float duskBand = exp(-abs(d.y - 0.03) * 7.0) * uDusk;
  hor = mix(hor, vec3(0.95, 0.42, 0.16), duskBand * 0.9);
  zen = mix(zen, vec3(0.14, 0.14, 0.30), duskBand * 0.4);

  float t = pow(1.0 - h, 1.7);
  vec3 col = mix(zen, hor, t);

  // 太阳：昼盘 + 黄昏光晕
  float sd = max(dot(d, uSunDir), 0.0);
  col += vec3(1.0, 0.9, 0.72) * pow(sd, 900.0) * 2.2 * uDay;
  col += vec3(1.0, 0.55, 0.25) * pow(sd, 14.0) * (0.10 + 0.55 * uDusk);

  // 月亮：夜盘 + 晕
  float md = max(dot(d, uMoonDir), 0.0);
  float moonVis = 1.0 - uDay;
  col += vec3(0.86, 0.90, 1.0) * smoothstep(0.99965, 0.99985, md) * 1.6 * moonVis;
  col += vec3(0.55, 0.62, 0.85) * pow(md, 260.0) * 0.45 * moonVis;

  // 星空（夜）
  float night2 = (1.0 - uDay) * (1.0 - uDay);
  if (night2 > 0.01 && d.y > 0.02) {
    vec3 cell = floor(d * 320.0);
    float s = hash13(cell);
    float star = step(0.9993, s);
    float tw = 0.65 + 0.35 * sin(uTime * 2.4 + s * 610.0);
    col += vec3(0.9, 0.93, 1.0) * star * tw * night2 * (0.4 + 0.6 * h);
  }

  gl_FragColor = vec4(col, 1.0);
}`;

export class DayNightRig {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.factor = 1.0;      // 当前昼夜因子 1=白天
    this.target = 1.0;      // 目标（手动切换时）
    this.mode = 'day';      // 'day' | 'night' | 'auto'
    this.autoT = 0;
    this.cycle = 110;       // 自动模式一整天秒数

    scene.fog = new THREE.Fog(0xccd9e6, 380, 3100);

    // ---- 天空穹顶 ----
    const skyGeo = new THREE.SphereGeometry(8500, 32, 20);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: shared,
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.sky = new THREE.Mesh(skyGeo, skyMat);
    this.sky.frustumCulled = false;
    scene.add(this.sky);

    // ---- 太阳（带阴影）----
    this.sun = new THREE.DirectionalLight(0xfff2df, 3.0);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -700; sc.right = 700; sc.top = 700; sc.bottom = -700;
    sc.near = 100; sc.far = 3600;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 2.0;
    scene.add(this.sun);
    scene.add(this.sun.target);

    // ---- 月光（无阴影）----
    this.moon = new THREE.DirectionalLight(0x8fa3ff, 0.0);
    scene.add(this.moon);

    // ---- 半球环境光 ----
    this.hemi = new THREE.HemisphereLight(0xb8d4f2, 0x948e82, 0.55);
    scene.add(this.hemi);

    // ---- 后处理：辉光 ----
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1920, 1080), 0.2, 0.55, 0.88);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this._cFogDay = new THREE.Color(0xccd9e6);
    this._cFogNight = new THREE.Color(0x060a13);
    this._cFogDusk = new THREE.Color(0xe0a070);
    this._cSunLow = new THREE.Color(0xffc98f);
    this._cSunHigh = new THREE.Color(0xfff3e2);
    this._cHemiSkyD = new THREE.Color(0xb8d4f2);
    this._cHemiSkyN = new THREE.Color(0x0d1830);
    this._cHemiGndD = new THREE.Color(0x948e82);
    this._cHemiGndN = new THREE.Color(0x0a0a12);
    this._tmp = new THREE.Color();
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'day') this.target = 1.0;
    if (mode === 'night') this.target = 0.0;
  }

  toggle() {
    this.setMode(this.target > 0.5 ? 'night' : 'day');
    return this.mode;
  }

  resize(w, h) {
    this.composer.setSize(w, h);
  }

  update(dt, elapsed) {
    if (this.mode === 'auto') {
      this.autoT += dt;
      // 从正午开始：f = 0.5 + 0.5*cos(2π t / cycle)
      const ph = (this.autoT / this.cycle) * Math.PI * 2;
      this.factor = 0.5 + 0.5 * Math.cos(ph);
    } else {
      // 手动切换：3 秒平滑
      const k = Math.min(1, dt / 3);
      this.factor += (this.target - this.factor) * (1 - Math.pow(1 - k, 2.2) * 0.98 - 0.02);
      if (Math.abs(this.factor - this.target) < 0.004) this.factor = this.target;
    }
    const f = this.factor;
    shared.uDay.value = f;
    shared.uTime.value = elapsed;

    const dusk = Math.pow(1 - Math.abs(2 * f - 1), 1.4);
    shared.uDusk.value = dusk;

    // 太阳位置：从夜(-14°)到昼(58°)，方位固定西南（dirFrom 的 az=0 是正南）
    const elev = -14 + 72 * f;
    const sunDir = dirFrom(elev, -32);
    shared.uSunDir.value.copy(sunDir);
    this.sun.position.copy(sunDir).multiplyScalar(1500);
    this.sun.target.position.set(0, 0, 0);

    // 月亮：固定东南高空
    const moonDir = dirFrom(48, 35);
    shared.uMoonDir.value.copy(moonDir);
    this.moon.position.copy(moonDir).multiplyScalar(1200);

    // 强度与颜色
    this.sun.intensity = 2.7 * THREE.MathUtils.smoothstep(f, 0.02, 0.4);
    this._tmp.lerpColors(this._cSunLow, this._cSunHigh, THREE.MathUtils.smoothstep(f, 0.1, 0.9));
    this.sun.color.copy(this._tmp);
    this.moon.intensity = 0.48 * (1 - f);
    this.hemi.intensity = 0.34 + 0.26 * f;
    this.hemi.color.lerpColors(this._cHemiSkyN, this._cHemiSkyD, f);
    this.hemi.groundColor.lerpColors(this._cHemiGndN, this._cHemiGndD, f);

    // 雾：夜更近更暗，黄昏偏暖
    this._tmp.lerpColors(this._cFogNight, this._cFogDay, f);
    this._tmp.lerp(this._cFogDusk, dusk * 0.22);
    this.scene.fog.color.copy(this._tmp);
    this.scene.fog.near = 900 + 200 * f;
    this.scene.fog.far = 6000 + 3500 * f;

    // 辉光：夜里适中（过强会把招牌糊成一片）
    this.bloom.strength = 0.12 + (1 - f) * 0.42;
    this.renderer.toneMappingExposure = 1.0 + (1 - f) * 0.18;

    for (const l of nightLights) l.intensity = l.userData.nightI * (1 - f);
  }

  render() {
    this.composer.render();
  }
}
