/**
 * 掩体点自动采样 —— AI v2「找掩体」行为的空间数据。
 *
 * 从地图掩体几何（BoxObstacle）自动生成：每个足够高的箱体四个侧面各取一个
 * 紧贴面外的点（yaw 旋转盒按局部坐标系旋转到世界系）。AI 被压制时选
 * 「最近且从当前敌人视角看不见」的点躲进去。
 *
 * 纯函数、零随机：同地图 → 同点集 → bot 跑分可复现。
 */
import type { BoxObstacle, MapBounds } from '../arena';
import { pointInBoxXZ } from '../arena';
import type { Vec3 } from '../types';

/** 点到箱体面的外扩距离（贴墙站，但不嵌进碰撞体） */
const OFFSET = 0.55;
/** 低于此半高的箱体挡不住视线（胸口约 1m），不生成掩体点 */
const MIN_HALF_HEIGHT = 0.9;

export function buildCoverPoints(boxes: BoxObstacle[], bounds: MapBounds): Vec3[] {
  const pts: Vec3[] = [];
  for (const b of boxes) {
    if (b.kind === 'wall' || b.kind === 'stair' || b.kind === 'pipe') continue;
    if (b.half.y < MIN_HALF_HEIGHT) continue;

    // 局部坐标系的四个侧面点 → 按 yaw 旋到世界系
    const c = Math.cos(b.yaw ?? 0);
    const s = Math.sin(b.yaw ?? 0);
    const local: Array<[number, number]> = [
      [b.half.x + OFFSET, 0],
      [-b.half.x - OFFSET, 0],
      [0, b.half.z + OFFSET],
      [0, -b.half.z - OFFSET],
    ];
    const cands = local.map(([lx, lz]) => ({
      x: b.pos.x + c * lx + s * lz,
      z: b.pos.z - s * lx + c * lz,
    }));

    for (const p of cands) {
      if (Math.abs(p.x) > bounds.halfX - 0.6 || Math.abs(p.z) > bounds.halfZ - 0.9) continue;
      // 剔除嵌进其它箱体内部的点（比如两箱贴放时侧面点落在邻箱里）
      let inside = false;
      for (const o of boxes) {
        if (pointInBoxXZ(p.x, p.z, o, 0.1)) {
          inside = true;
          break;
        }
      }
      if (!inside) pts.push({ x: p.x, y: 0, z: p.z });
    }
  }
  return pts;
}
