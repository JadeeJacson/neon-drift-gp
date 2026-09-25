/**
 * 球的渲染 —— 白底黑斑球体 + 地面投影 + 高亮环。
 *
 * 高亮环是「第一人称足球头号风险（看不到球）」的直接对策：
 * 球在脚下时，投影 + 高亮环保证玩家任何时候都能定位球。
 */
import * as THREE from 'three';
import { CONFIG } from '../core/config';
import type { BallView } from '../sim/types';

/** 白底 + 黑五边形斑块（程序化，零资产） */
function makeBallTexture(): THREE.CanvasTexture {
  const S = 256;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f4f6f8';
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = '#1b1f26';
    const spots: [number, number, number][] = [
      [64, 64, 26], [192, 70, 22], [128, 128, 30],
      [70, 196, 24], [196, 190, 26], [128, 24, 16], [24, 128, 16], [232, 128, 16],
    ];
    for (const [x, y, r] of spots) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class BallRenderer {
  private readonly group = new THREE.Group();
  private readonly mesh: THREE.Mesh;
  private readonly shadow: THREE.Mesh;
  private readonly ring: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    const r = CONFIG.ball.radius;
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, 20, 14),
      new THREE.MeshStandardMaterial({ map: makeBallTexture(), roughness: 0.7, metalness: 0.0 }),
    );
    this.group.add(this.mesh);

    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(r * 1.35, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.group.add(this.shadow);

    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(r * 1.5, r * 1.95, 24),
      new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0.75, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.group.add(this.ring);

    scene.add(this.group);
  }

  sync(v: BallView): void {
    this.mesh.position.set(v.pos.x, v.pos.y, v.pos.z);
    this.mesh.quaternion.set(v.quat.x, v.quat.y, v.quat.z, v.quat.w);

    // 投影与高亮环贴地，随球水平位置移动
    this.shadow.position.set(v.pos.x, 0.03, v.pos.z);
    this.ring.position.set(v.pos.x, 0.025, v.pos.z);
    // 球越高，投影越淡越小
    const h = Math.max(0, v.pos.y - CONFIG.ball.radius);
    const k = Math.max(0.25, 1 - h * 0.35);
    this.shadow.scale.setScalar(k);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.32 * k;
  }
}
