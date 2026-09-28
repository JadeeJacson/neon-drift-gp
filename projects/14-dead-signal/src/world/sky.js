/* 世界环境：夜空穹顶 + 月光 + 浓雾照明 + 飘尘 + 闪烁电线 + 探照灯剪影 */
import * as THREE from 'three';
import { rand, seedRng } from '../core/util.js';

export const Sky = {};

// 在场景里铺好灯光与氛围元素，返回可每帧更新的句柄
Sky.build = function (scene) {
  const rnd = seedRng(2024);

  // ---- 夜空穹顶：背面球 + 顶点色纵向渐变 ----
  const domeGeo = new THREE.SphereGeometry(240, 24, 16);
  const cols = [];
  const pos = domeGeo.attributes.position;
  const top = new THREE.Color(0x05070d), hor = new THREE.Color(0x1b2634), hor2 = new THREE.Color(0x2c2a24);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 240;                      // [-1,1]
    const c = y > 0.06 ? top.clone().lerp(hor, THREE.MathUtils.clamp((0.5 - y) / 0.44, 0, 1))
      : hor.clone().lerp(hor2, THREE.MathUtils.clamp(-y / 0.3, 0, 1));
    cols.push(c.r, c.g, c.b);
  }
  domeGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const dome = new THREE.Mesh(domeGeo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.BackSide }));
  scene.add(dome);

  // ---- 月亮（发光圆盘） ----
  const moonMat = new THREE.SpriteMaterial({ color: 0xdfe6f0, transparent: true, opacity: 0.95, fog: false });
  const moon = new THREE.Sprite(moonMat);
  moon.position.set(-140, 86, -190); moon.scale.setScalar(26);
  scene.add(moon);

  // ---- 灯光：半球冷光 + 月光平行光（弱阴影） + 环境补光 ----
  // 夜战要能看清掩体轮廓，所以环境光不能太低；氛围交给冷色调与雾
  const hemi = new THREE.HemisphereLight(0x465a78, 0x1d1a14, 1.75);
  const moonLight = new THREE.DirectionalLight(0xa9bdda, 1.25);
  moonLight.position.set(-40, 62, -55);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(1024, 1024);
  moonLight.shadow.camera.left = -45; moonLight.shadow.camera.right = 45;
  moonLight.shadow.camera.top = 45; moonLight.shadow.camera.bottom = -45;
  moonLight.shadow.camera.far = 160;
  moonLight.shadow.bias = -0.0015;
  const amb = new THREE.AmbientLight(0x2a3040, 1.05);
  scene.add(hemi, moonLight, amb);

  // ---- 飘尘粒子（缓慢漂移，营造夜雾里的浮尘） ----
  const N = 380;
  const pGeo = new THREE.BufferGeometry();
  const arr = new Float32Array(N * 3);
  const vel = new Float32Array(N * 2);
  for (let i = 0; i < N; i++) {
    arr[i * 3] = rand(-32, 32); arr[i * 3 + 1] = rand(0.2, 7); arr[i * 3 + 2] = rand(-26, 26);
    vel[i * 2] = rand(0.15, 0.5); vel[i * 2 + 1] = rand(-0.05, 0.05);
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const dust = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0x9aa6b8, size: 0.045, transparent: true, opacity: 0.5, depthWrite: false
  }));
  scene.add(dust);

  // ---- 探照灯剪影：缓慢扫动的扁锥体（只有形状没有真实光照，做氛围） ----
  const beamGeo = new THREE.ConeGeometry(5.2, 44, 10, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xbfd2e8, transparent: true, opacity: 0.045, side: THREE.DoubleSide, depthWrite: false, fog: false });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(30, 0.4, -22);
  beam.rotation.z = Math.PI / 2.6;
  const beamPivot = new THREE.Group();
  beamPivot.position.set(30, 9, -22);
  beam.position.set(0, 0, 0);
  beam.rotation.set(Math.PI / 2 - 0.5, 0, 0);
  beam.translateZ(22);
  beamPivot.add(beam);
  scene.add(beamPivot);

  let t = 0;
  return {
    dust, moon, beamPivot,
    update(dt, lightPole) {
      t += dt;
      // 飘尘缓慢横移并回绕
      const p = dust.geometry.attributes.position.array;
      for (let i = 0; i < N; i++) {
        p[i * 3] += vel[i * 2] * dt;
        p[i * 3 + 2] += vel[i * 2 + 1] * dt;
        if (p[i * 3] > 32) p[i * 3] = -32;
        if (p[i * 3 + 2] > 26) p[i * 3 + 2] = -26;
        if (p[i * 3 + 2] < -26) p[i * 3 + 2] = 26;
      }
      dust.geometry.attributes.position.needsUpdate = true;
      // 探照灯扫动
      beamPivot.rotation.y = Math.sin(t * 0.13) * 1.1 + 0.4;
      // 电线灯杆的闪烁由 game.js 传入 spotlight。
      // 原实现 120 * (f > -0.55 ? 1 : 0.18) * (0.9 + rnd()*0.15) 有三个问题：
      //   ① 硬阈值切换 → 强度在 120 与 21.6 之间瞬间跳变（跌 84%），观感就是「屏幕在闪」；
      //   ② 每帧 rnd() → 叠加一层随机噪点，即使同一状态下也在抖；
      //   ③ t*37 rad/s ≈ 5.9 Hz，60fps 下接近奈奎斯特极限，产生 aliasing。
      // 改为低频 + 平滑：大部分时间接近满亮，偶尔压暗，过渡连续——像老化灯管而非频闪灯。
      if (lightPole && lightPole.spot) {
        const f = Math.sin(t * 5.3) * Math.sin(t * 2.1);
        lightPole.spot.intensity = 120 * (0.35 + 0.65 * THREE.MathUtils.smoothstep(f, -0.75, 0.25));
      }
    }
  };
};
