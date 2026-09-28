/* 着色器小工具：给枪模材质注入程序化粗粒噪声（替代外部贴图，贴近 COD 的胶片颗粒感） */
import * as THREE from 'three';

// 对 MeshStandardMaterial 打补丁：片元颜色乘上一层高频噪点
export function addGrain(material, strength = 0.12) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGrain = { value: strength };
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
       {
         float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
         gl_FragColor.rgb *= 1.0 + (g - 0.5) * uGrain;
       }`
    );
    shader.fragmentShader = 'uniform float uGrain;\n' + shader.fragmentShader;
  };
  // 让着色器缓存区分开，避免污染同配置的普通材质
  material.customProgramCacheKey = () => 'grain' + strength;
  return material;
}

// 屏幕雪花噪点纹理（DataTexture，供 HUD 特效层以后扩展用）
export function grainDataTexture(size = 128) {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const v = (Math.random() * 255) | 0;
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}
