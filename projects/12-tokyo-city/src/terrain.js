// terrain.js — 内陆山脉：环状低多边形山体（东海侧留出海），雾中围合城市与村镇
import * as THREE from 'three';
import { coastX, makeRng } from './layout.js';

export function buildMountains(scene) {
  const rng = makeRng(20260927 ^ 0xbeef);
  const green = new THREE.MeshStandardMaterial({ color: 0x3c5a40, roughness: 1, flatShading: true });
  const rock = new THREE.MeshStandardMaterial({ color: 0x6b7076, roughness: 1, flatShading: true });
  const spots = [];
  let guard = 0;
  while (spots.length < 120 && guard++ < 900) {
    const ang = rng() * Math.PI * 2;
    const r = 320 + rng() * 500;
    const R = 2520 + r + rng() * 950; // 圆心距 ≥ 路网外缘 + 山体半径，山脚不压街区
    const x = Math.cos(ang) * R, z = Math.sin(ang) * R;
    if (x > coastX(z) - 260) continue; // 不入海
    spots.push({ x, z, r, h: 280 + rng() * 430, rock: rng() < 0.12 });
  }
  const geo = new THREE.ConeGeometry(1, 1, 7);
  geo.translate(0, 0.5, 0);
  const greens = spots.filter((s) => !s.rock);
  const rocks = spots.filter((s) => s.rock);
  const mk = (list, mat) => {
    const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
    const m = new THREE.Matrix4();
    list.forEach((s, i) => {
      m.makeScale(s.r, s.h, s.r * (0.75 + rng() * 0.4));
      m.setPosition(s.x, 0, s.z);
      mesh.setMatrixAt(i, m);
    });
    mesh.count = list.length;
    scene.add(mesh);
  };
  mk(greens, green);
  mk(rocks, rock);
  return spots.length;
}
