/**
 * 掩体点自动采样 —— AI v2「找掩体」行为的空间数据。
 *
 * 从地图掩体几何（BoxObstacle）自动生成：每个足够高的箱体四个侧面各取一个
 * 紧贴面外的点。AI 被压制时选「最近且从当前敌人视角看不见」的点躲进去。
 *
 * 纯函数、零随机：同地图 → 同点集 → bot 跑分可复现。
 */
import type { BoxObstacle } from '../arena';
import type { Vec3 } from '../types';

/** 点到箱体面的外扩距离（贴墙站，但不嵌进碰撞体） */
const OFFSET = 0.55;
/** 低于此半高的箱体挡不住视线（胸口约 1m），不生成掩体点 */
const MIN_HALF_HEIGHT = 0.9;

export function buildCoverPoints(boxes: BoxObstacle[], arenaHalf: number): Vec3[] {
  const pts: Vec3[] = [];
  const limit = arenaHalf - 1.5;
  for (const b of boxes) {
    if (b.kind === 'wall') continue; // 外墙不当掩体
    if (b.half.y < MIN_HALF_HEIGHT) continue;

    const cands: Array<{ x: number; z: number }> = [
      { x: b.pos.x + b.half.x + OFFSET, z: b.pos.z },
      { x: b.pos.x - b.half.x - OFFSET, z: b.pos.z },
      { x: b.pos.x, z: b.pos.z + b.half.z + OFFSET },
      { x: b.pos.x, z: b.pos.z - b.half.z - OFFSET },
    ];

    for (const p of cands) {
      if (Math.abs(p.x) > limit || Math.abs(p.z) > limit) continue;
      // 剔除嵌进其它箱体内部的点（比如两箱贴放时侧面点落在邻箱里）
      let inside = false;
      for (const o of boxes) {
        const dx = Math.abs(p.x - o.pos.x) - o.half.x;
        const dz = Math.abs(p.z - o.pos.z) - o.half.z;
        if (dx < 0 && dz < 0) {
          inside = true;
          break;
        }
      }
      if (!inside) pts.push({ x: p.x, y: 0, z: p.z });
    }
  }
  return pts;
}
