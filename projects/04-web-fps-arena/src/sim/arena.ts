import { CONFIG } from '../core/config';
import type { Vec3 } from './types';
import { v3 } from './vecmath';

export interface BoxObstacle {
  pos: Vec3;
  half: Vec3;
  kind: 'crate' | 'pillar' | 'wall' | 'block';
}

/**
 * 竞技场布局 —— 固定数据而非随机生成：
 * 随机布局会让「平衡 bot 跑分」每次都在不同地图上跑，结果不可比。
 */
export const ARENA_BOXES: BoxObstacle[] = [
  // 四角高柱：远距离视线遮挡，狙击手的天然掩体
  { pos: v3(8, 0, 8), half: v3(0.6, 2.6, 0.6), kind: 'pillar' },
  { pos: v3(-8, 0, 8), half: v3(0.6, 2.6, 0.6), kind: 'pillar' },
  { pos: v3(8, 0, -8), half: v3(0.6, 2.6, 0.6), kind: 'pillar' },
  { pos: v3(-8, 0, -8), half: v3(0.6, 2.6, 0.6), kind: 'pillar' },

  // 中距离箱体：可翻越（autostep 0.4 覆盖不了 1.2 高度，需绕行）
  { pos: v3(0, 0, 12), half: v3(2.5, 1.2, 1.2), kind: 'crate' },
  { pos: v3(0, 0, -12), half: v3(2.5, 1.2, 1.2), kind: 'crate' },
  { pos: v3(13, 0, 0), half: v3(1.2, 1.2, 2.5), kind: 'crate' },
  { pos: v3(-13, 0, 0), half: v3(1.2, 1.2, 2.5), kind: 'crate' },

  // 矮箱：可跳上去，制造高低差
  { pos: v3(6, 0, -6), half: v3(1.5, 0.8, 1.5), kind: 'crate' },
  { pos: v3(-6, 0, 6), half: v3(1.5, 0.8, 1.5), kind: 'crate' },

  // 长墙：切分战场，迫使走位
  { pos: v3(17, 0, 10), half: v3(0.5, 1.8, 4.5), kind: 'wall' },
  { pos: v3(-17, 0, -10), half: v3(0.5, 1.8, 4.5), kind: 'wall' },

  // 中央掩体：出生点附近的即时掩护
  { pos: v3(3.5, 0, -3.5), half: v3(1.1, 1.1, 1.1), kind: 'block' },

  // 后方高台
  { pos: v3(0, 0, -19), half: v3(3.2, 1.6, 2.2), kind: 'block' },
];

/** 四面围墙（正方形竞技场） */
export function arenaWalls(): BoxObstacle[] {
  const h = CONFIG.arena.half;
  const wh = CONFIG.arena.wallHeight;
  // 约定：pos 为「底面中心」，物理与渲染统一用 pos.y + half.y 求几何中心
  return [
    { pos: v3(0, 0, -h), half: v3(h + 1, wh / 2, 0.5), kind: 'wall' },
    { pos: v3(0, 0, h), half: v3(h + 1, wh / 2, 0.5), kind: 'wall' },
    { pos: v3(-h, 0, 0), half: v3(0.5, wh / 2, h + 1), kind: 'wall' },
    { pos: v3(h, 0, 0), half: v3(0.5, wh / 2, h + 1), kind: 'wall' },
  ];
}

/** 点到最近障碍的距离（XZ 平面，粗略）—— 用于挑选不与掩体重叠的出生点 */
function clearanceXZ(p: Vec3): number {
  let best = Infinity;
  for (const b of ARENA_BOXES) {
    const dx = Math.max(Math.abs(p.x - b.pos.x) - b.half.x, 0);
    const dz = Math.max(Math.abs(p.z - b.pos.z) - b.half.z, 0);
    best = Math.min(best, Math.hypot(dx, dz));
  }
  return best;
}

/**
 * 挑一个出生点：距玩家足够远（避免贴脸刷怪）、离掩体有余量、在场内。
 * 重试上限 24 次，失败则退化为任意角度的合法点。
 */
export function pickSpawnPoint(
  rand: () => number,
  playerPos: Vec3,
  minDistFromPlayer = 14,
): Vec3 {
  const { spawnMinDist, spawnMaxDist } = CONFIG.wave;
  const limit = CONFIG.arena.half - 3;
  for (let i = 0; i < 24; i++) {
    const a = rand() * Math.PI * 2;
    const r = spawnMinDist + rand() * (spawnMaxDist - spawnMinDist);
    const p = v3(Math.cos(a) * r, 0, Math.sin(a) * r);
    if (Math.abs(p.x) > limit || Math.abs(p.z) > limit) continue;
    if (clearanceXZ(p) < 1.6) continue;
    if (Math.hypot(p.x - playerPos.x, p.z - playerPos.z) < minDistFromPlayer) continue;
    return p;
  }
  // 退化路径：至少保证在场地内且离玩家不太近
  const a = rand() * Math.PI * 2;
  const r = Math.min(spawnMaxDist, limit);
  let p = v3(Math.cos(a) * r, 0, Math.sin(a) * r);
  if (Math.hypot(p.x - playerPos.x, p.z - playerPos.z) < minDistFromPlayer) {
    p = v3(-p.x, 0, -p.z);
  }
  return p;
}

/** 玩家出生点 */
export const PLAYER_SPAWN: Vec3 = v3(0, 0, 0);
