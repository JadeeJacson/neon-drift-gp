// fx.js — 材质补丁与小纹理工具
import * as THREE from 'three';
import { shared } from './env.js';

// 让任意 MeshStandardMaterial 的自发光只在夜里出现（白天强度归零）。
// intensity: 夜间峰值强度。
export function nightEmissive(mat, intensity = 1.0) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uDay = shared.uDay;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uDay;')
      .replace(
        'vec3 totalEmissiveRadiance = emissive;',
        `vec3 totalEmissiveRadiance = emissive * (1.0 - uDay) * ${intensity.toFixed(2)};`
      );
  };
  mat.customProgramCacheKey = () => 'nightEm' + intensity.toFixed(2);
  return mat;
}

// 灰度噪声纹理（沥青 / 混凝土用）
export function makeNoiseTexture(size = 256, base = 128, variation = 40) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = Math.max(0, Math.min(255, base + (Math.random() - 0.5) * 2 * variation));
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
