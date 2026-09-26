/**
 * 竞技场几何 —— 全部程序化，零外部资产。
 * 纹理用 canvas 画（网格地面 / 金属箱面），布局由 sim 的 MapDef 传入，
 * 保证「看到的掩体」和「子弹撞到的掩体」是同一个。
 */
import * as THREE from 'three';
import { CONFIG } from '../core/config';
import type { BoxObstacle } from '../sim/arena';

/** 程序化地面纹理：深色底 + 网格线 + 噪点 */
function groundTexture(): THREE.CanvasTexture {
  const s = 512;
  const canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#232a33';
    ctx.fillRect(0, 0, s, s);

    // 噪点
    const img = ctx.getImageData(0, 0, s, s);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() * 2 - 1) * 16;
      img.data[i] = Math.max(0, Math.min(255, img.data[i]! + n));
      img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1]! + n));
      img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2]! + n));
    }
    ctx.putImageData(img, 0, 0);

    // 网格
    ctx.strokeStyle = 'rgba(120,150,190,0.30)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 8; i++) {
      const p = (i / 8) * s;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(s, p);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
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
    // 边框
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, s - 10, s - 10);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const SKIN: Record<string, { base: string; stripe: string; rough: number; metal: number }> = {
  crate: { base: '#5a5348', stripe: 'rgba(220,180,70,0.55)', rough: 0.8, metal: 0.15 },
  pillar: { base: '#39424f', stripe: 'rgba(150,190,240,0.30)', rough: 0.5, metal: 0.45 },
  wall: { base: '#2f3742', stripe: 'rgba(255,120,60,0.35)', rough: 0.9, metal: 0.1 },
  block: { base: '#4a4438', stripe: 'rgba(210,210,210,0.22)', rough: 0.85, metal: 0.1 },
};

/** 纹理按 kind 缓存：原实现每个箱子新建一张 canvas，换图时会重复生成几十张 */
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

/**
 * 构建竞技场几何，返回 Group —— 换图时由调用方 dispose 旧 Group 再重建。
 * boxes 由 sim 传入（已含围墙），保证「看到的掩体」与「子弹撞到的掩体」是同一份数据。
 */
export function buildArena(scene: THREE.Scene, boxes: BoxObstacle[]): THREE.Group {
  const half = CONFIG.arena.half;
  const group = new THREE.Group();
  group.name = 'arena';

  if (!groundTex) groundTex = groundTexture();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(half * 2 + 8, half * 2 + 8),
    new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95, metalness: 0.05 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.name = 'ground';
  ground.receiveShadow = true;
  group.add(ground);

  for (const b of boxes) {
    const skin = SKIN[b.kind] ?? SKIN.block!;
    const map = b.kind === 'pillar' ? null : skinTex(b.kind);
    const mat = new THREE.MeshStandardMaterial({
      map,
      color: map ? 0xffffff : new THREE.Color(skin.base).getHex(),
      roughness: skin.rough,
      metalness: skin.metal,
    });
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(b.half.x * 2, b.half.y * 2, b.half.z * 2),
      mat,
    );
    // 约定：sim 里 pos 是底面中心
    mesh.position.set(b.pos.x, b.pos.y + b.half.y, b.pos.z);
    mesh.name = `obstacle-${b.kind}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  // 边界警示环：让玩家一眼看出场地边界，避免撞墙困惑
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(half - 0.6, half, 64),
    new THREE.MeshBasicMaterial({
      color: 0xff6b35,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  group.add(ring);

  scene.add(group);
  return group;
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
