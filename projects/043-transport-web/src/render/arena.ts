/**
 * 竞技场几何 —— 全部程序化，零外部资产。
 * 纹理用 canvas 画（甲板 / 集装箱瓦楞面 / 木箱），布局由 sim 的 MapDef 传入，
 * 保证「看到的掩体」和「子弹撞到的掩体」是同一个。
 * ship 地图附加装饰（吊车 / 管道外观 / 黄黑警示门框 / 船体上层），不参与碰撞。
 */
import * as THREE from 'three';
import type { BoxObstacle, MapDef } from '../sim/arena';
import { SHIP_PALETTE, mapBounds } from '../sim/arena';

/** 程序化甲板纹理：钢板底 + 防滑纹 + 黄色走道线 */
function deckTexture(): THREE.CanvasTexture {
  const s = 512;
  const canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#4c5259';
    ctx.fillRect(0, 0, s, s);
    // 钢板分缝
    ctx.strokeStyle = 'rgba(20,24,28,0.7)';
    ctx.lineWidth = 5;
    for (let i = 0; i <= 4; i++) {
      const p = (i / 4) * s;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(s, p);
      ctx.stroke();
    }
    // 防滑斜纹
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    for (let i = -s; i < s * 2; i += 26) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + s, s);
      ctx.stroke();
    }
    // 铆钉
    ctx.fillStyle = 'rgba(15,18,22,0.55)';
    for (let x = 32; x < s; x += 128) {
      for (let y = 32; y < s; y += 128) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 程序化箱面纹理：底色 + 警示斜纹（不同 kind 颜色不同） */
function crateTexture(base: string, stripe: string): THREE.CanvasTexture {
  const s = 256;
  const canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = stripe;
    ctx.lineWidth = 14;
    for (let i = -s; i < s * 2; i += 56) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + s, s);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, s - 10, s - 10);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** 集装箱瓦楞面：竖向明暗条 + 门缝线（043 的 cont 纹理的程序化近似） */
function containerTexture(hex: number): THREE.CanvasTexture {
  const s = 256;
  const canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext('2d');
  const base = new THREE.Color(hex);
  if (ctx) {
    const hexStr = `#${base.getHexString()}`;
    ctx.fillStyle = hexStr;
    ctx.fillRect(0, 0, s, s);
    // 瓦楞：竖向明暗条纹
    for (let x = 0; x < s; x += 16) {
      const shade = x % 32 === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.16)';
      ctx.fillStyle = shade;
      ctx.fillRect(x, 0, 8, s);
    }
    // 上下框梁（加深）
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, s, 14);
    ctx.fillRect(0, s - 14, s, 14);
    // 白色代码条
    ctx.fillStyle = 'rgba(240,240,235,0.85)';
    ctx.fillRect(20, s / 2 - 16, 120, 30);
    ctx.fillStyle = 'rgba(20,20,20,0.9)';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('CFR 043', 28, s / 2 + 6);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const SKIN: Record<string, { base: string; stripe: string; rough: number; metal: number }> = {
  crate: { base: '#5a5348', stripe: 'rgba(220,180,70,0.55)', rough: 0.8, metal: 0.15 },
  pillar: { base: '#39424f', stripe: 'rgba(150,190,240,0.30)', rough: 0.5, metal: 0.45 },
  wall: { base: '#8f979c', stripe: 'rgba(255,255,255,0.10)', rough: 0.85, metal: 0.32 },
  block: { base: '#c6cacb', stripe: 'rgba(0,0,0,0.08)', rough: 0.86, metal: 0.14 },
  stair: { base: '#6b7178', stripe: 'rgba(255,220,80,0.35)', rough: 0.7, metal: 0.6 },
  pipe: { base: '#9aa7ae', stripe: 'rgba(30,40,46,0.3)', rough: 0.55, metal: 0.7 },
};

/** 纹理按 key 缓存：原实现每个箱子新建一张 canvas，换图时会重复生成几十张 */
const texCache = new Map<string, THREE.CanvasTexture>();
let groundTex: THREE.CanvasTexture | null = null;

function skinTex(kind: string): THREE.CanvasTexture {
  const cached = texCache.get(kind);
  if (cached) return cached;
  const skin = SKIN[kind] ?? SKIN.block!;
  const tex = crateTexture(skin.base, skin.stripe);
  texCache.set(kind, tex);
  return tex;
}

function containerTex(hex: number): THREE.CanvasTexture {
  const key = `c${hex.toString(16)}`;
  const cached = texCache.get(key);
  if (cached) return cached;
  const tex = containerTexture(hex);
  texCache.set(key, tex);
  return tex;
}

function colorFor(b: BoxObstacle): number {
  if (b.kind === 'container') return SHIP_PALETTE[(b.tone ?? 0) % SHIP_PALETTE.length]!;
  const skin = SKIN[b.kind] ?? SKIN.block!;
  return new THREE.Color(skin.base).getHex();
}

/**
 * 构建竞技场几何，返回 Group —— 换图时由调用方 dispose 旧 Group 再重建。
 * boxes 由 sim 传入（已含围墙），保证「看到的掩体」与「子弹撞到的掩体」是同一份数据。
 */
export function buildArena(scene: THREE.Scene, map: MapDef, boxes: BoxObstacle[]): THREE.Group {
  const bounds = mapBounds(map);
  const group = new THREE.Group();
  group.name = 'arena';

  if (!groundTex) groundTex = deckTexture();
  groundTex.repeat.set(Math.max(4, bounds.halfX / 3), Math.max(8, bounds.halfZ / 3));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(bounds.halfX * 2 + 4, bounds.halfZ * 2 + 4),
    new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.92, metalness: 0.22 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.name = 'ground';
  ground.receiveShadow = true;
  group.add(ground);

  for (const b of boxes) {
    const mat = new THREE.MeshStandardMaterial({
      map: b.kind === 'pillar' ? null : b.kind === 'container' ? containerTex(colorFor(b)) : skinTex(b.kind),
      color: b.kind === 'pillar' ? colorFor(b) : 0xffffff,
      roughness: SKIN[b.kind]?.rough ?? 0.8,
      metalness: SKIN[b.kind]?.metal ?? 0.2,
    });
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(b.half.x * 2, b.half.y * 2, b.half.z * 2),
      mat,
    );
    // 约定：sim 里 pos 是底面中心；yaw 旋转与物理碰撞体一致
    mesh.position.set(b.pos.x, b.pos.y + b.half.y, b.pos.z);
    if (b.yaw) mesh.rotation.y = b.yaw;
    mesh.name = `obstacle-${b.kind}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  if (map.ship) buildShipExtras(group);

  scene.add(group);
  return group;
}

/**
 * 船体装饰（纯视觉，不参与碰撞）：栏杆 / 吊车 / 管道外壳 / 黄黑警示门框 / 船首楼。
 * 视觉数据与 sim 的盒子坐标对齐（同为 sim/arena.ts 里的常量体系）。
 */
function buildShipExtras(group: THREE.Group): void {
  const HX = 10.0; // 甲板内半宽（与 sim bounds halfX-0.5 一致）
  const steel = new THREE.MeshStandardMaterial({ color: 0xaeb6bb, roughness: 0.5, metalness: 0.78 });
  const yellow = new THREE.MeshStandardMaterial({ color: 0xd8b23a, roughness: 0.52, metalness: 0.7 });
  const hazard = new THREE.MeshStandardMaterial({ color: 0xd8b23a, roughness: 0.8, metalness: 0.2 });
  const win = new THREE.MeshStandardMaterial({ color: 0x2b3d4a, roughness: 0.22, metalness: 0.65 });

  // ---- 舷侧栏杆（挡不住子弹，只是告诉玩家这里是船边）----
  for (const sx of [-1, 1]) {
    for (let z = -46; z <= 46; z += 3.6) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.1, 0.09), steel);
      post.position.set(sx * (HX - 0.2), 0.55, z);
      group.add(post);
    }
    for (const hy of [0.5, 1.08]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 92), steel);
      rail.position.set(sx * (HX - 0.2), hy, 0);
      group.add(rail);
    }
  }

  // ---- 吊车（立柱与悬挂集装箱的碰撞体在 sim 的 SHIP_BOXES 里，由上方 boxes 循环渲染；
  //      这里只画吊臂与吊索——吊索接到悬挂箱顶 5.2、吊臂底 7.15）----
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const px = sx * (HX - 0.75);
      const pz = sz * 12;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 13), yellow);
      arm.position.set(px - sx * 4.2, 7.4, pz - sz * 2.5);
      arm.castShadow = true;
      group.add(arm);
      const tipZ = pz - sz * 2.5 + sz * 5.6;
      const cable = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.0, 0.06), steel);
      cable.position.set(px - sx * 4.2, 6.2, tipZ);
      group.add(cable);
    }
  }

  // ---- 管道外观（与 sim 的管形通道对齐：x=±8.5，z=±(19..34)）----
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x9aa7ae, roughness: 0.55, metalness: 0.7, side: THREE.DoubleSide });
  for (const [px, zc] of [
    [8.5, -26.5],
    [-8.5, 26.5],
  ] as const) {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 15, 20, 1, true), pipeMat);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(px, 1.65, zc);
    group.add(tube);
    for (let i = 0; i <= 7; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.07, 6, 18), yellow);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(px, 1.65, zc + (i / 7 - 0.5) * 15 * Math.sign(zc));
      group.add(ring);
    }
  }

  // ---- 出生舱黄黑警示门框（视觉贴片，贴在 sim 前墙门洞的外侧墙端，不伸进门洞）----
  for (const sz of [-1, 1]) {
    const zw = sz * 36.5;
    for (const fx of [-2.27, 2.27, 5.23, 8.17]) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.34, 3.05, 0.66), hazard);
      frame.position.set(fx, 1.52, zw);
      group.add(frame);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.38, 0.66), hazard);
    lintel.position.set(0, 3.24, zw);
    group.add(lintel);
    // 舱内照明（暖色点光 + 灯罩）
    const lamp = new THREE.PointLight(0xffd9a0, 6, 13, 2);
    lamp.position.set(0, 3.0, sz * 42.25);
    group.add(lamp);
    const lampMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.1, 0.4),
      new THREE.MeshBasicMaterial({ color: 0xfff0cc }),
    );
    lampMesh.position.set(0, 3.28, sz * 42.25);
    group.add(lampMesh);
  }

  // ---- 驾驶舱窗户（贴在 sim 的白色上层建筑朝海面）----
  for (let i = 0; i < 3; i++) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 14), win);
    w.rotation.x = Math.PI / 2;
    w.position.set(6.5, 2.4, 31.0 + i * 1.8);
    group.add(w);
  }
}

/**
 * 换图时释放旧竞技场（几何 + 材质）。
 * 注意：纹理是共享缓存，Material.dispose() 不会连带释放 texture，所以这里不能碰 texCache。
 */
export function disposeArena(scene: THREE.Scene, group: THREE.Group | null): void {
  if (!group) return;
  group.traverse((o) => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose();
  });
  scene.remove(group);
}
