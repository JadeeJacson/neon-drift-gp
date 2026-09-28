/* 渲染层：渲染器 + 主场景/相机 + 枪模场景（第二 pass 叠加）+ 画质档位
 * 与参考工程同样的「两个 pass」做法：枪模画在单独 scene/vmCamera 上，
 * 主场景先渲染，再不清屏地叠加枪模，避免枪模穿墙。 */
import * as THREE from 'three';
import { clamp } from './util.js';

export const R = {
  renderer: null,
  scene: null, camera: null,
  vmScene: null, vmCamera: null,
  fps: 60
};

const QUALITY = {
  low:    { pixelRatio: 0.75, shadow: false, fogKai: 1.0 },
  medium: { pixelRatio: 1.0,  shadow: true,  fogKai: 1.0 },
  high:   { pixelRatio: Math.min(1.5, window.devicePixelRatio || 1), shadow: true, fogKai: 1.0 }
};

R.init = function (canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x05060a, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // ACES 色调映射：夜战场景靠它把暗部提起来而不丢高光
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  // 0.16x 起默认输出 sRGB，无需再设 outputEncoding
  R.renderer = renderer;

  R.scene = new THREE.Scene();
  R.scene.fog = new THREE.FogExp2(0x0d131c, 0.0125); // 夜色薄雾：氛围 + 天然裁剪远景

  R.camera = new THREE.PerspectiveCamera(75, 1, 0.05, 300);

  // 枪模场景：独立相机，近裁剪更小
  R.vmScene = new THREE.Scene();
  R.vmCamera = new THREE.PerspectiveCamera(55, 1, 0.01, 12);
  const vmKey = new THREE.DirectionalLight(0xcfd6e6, 2.4); vmKey.position.set(-0.4, 1.2, 0.9);
  const vmFill = new THREE.HemisphereLight(0x39445c, 0x14100c, 1.7);
  R.vmScene.add(vmKey, vmFill);

  R.setQuality('medium');
  R.resize();
  window.addEventListener('resize', () => R.resize());
};

R.setQuality = function (name) {
  const q = QUALITY[name] || QUALITY.medium;
  R.quality = name;
  R.renderer.setPixelRatio(q.pixelRatio);
  R.renderer.shadowMap.enabled = q.shadow;
};

R.resize = function () {
  const w = window.innerWidth, h = window.innerHeight;
  R.renderer.setSize(w, h);
  R.camera.aspect = w / h; R.camera.updateProjectionMatrix();
  R.vmCamera.aspect = w / h; R.vmCamera.updateProjectionMatrix();
};

R.setFov = function (fov) {
  const f = clamp(fov, 30, 110);
  if (Math.abs(R.camera.fov - f) > 0.01) { R.camera.fov = f; R.camera.updateProjectionMatrix(); }
};

R.render = function () {
  const r = R.renderer;
  r.autoClear = true;
  r.render(R.scene, R.camera);
  r.autoClear = false;          // 第二 pass 不清屏，直接叠在画面上层
  r.render(R.vmScene, R.vmCamera);
  r.autoClear = true;
};
