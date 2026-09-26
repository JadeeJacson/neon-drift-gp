/**
 * 穿模诊断：SHIP_BOXES 两两 OBB 重叠检查（2D SAT，XZ 平面）。
 * - 垂直区间不重叠（一盒叠在另一盒顶上）→ 有意堆叠，跳过
 * - kind 对（stair×任意 / 顶棚×墙）属于建筑结构，只报告深穿
 * - 报告水平穿透深度 > 0.15m 的组合
 */
import { MAPS, boxTop } from '../src/sim/arena';
import type { BoxObstacle } from '../src/sim/arena';

/** 旋转盒的 2D 轴（局部 X/Z 在世界中的方向） */
function axes(yaw: number): Array<{ x: number; z: number }> {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  // 局部 +X → (c, -s)；局部 +Z → (s, c)（与 Rapier/three +θ 约定一致）
  return [
    { x: c, z: -s },
    { x: s, z: c },
  ];
}

/** 2D SAT：返回两旋转盒的最小穿透深度（负值=不重叠） */
function satPenetration(a: BoxObstacle, b: BoxObstacle): number {
  const ax = axes(a.yaw ?? 0);
  const bx = axes(b.yaw ?? 0);
  const dx = b.pos.x - a.pos.x;
  const dz = b.pos.z - a.pos.z;
  const radius = (h: { x: number; z: number }, u: Array<{ x: number; z: number }>, axis: { x: number; z: number }): number =>
    h.x * Math.abs(u[0]!.x * axis.x + u[0]!.z * axis.z) + h.z * Math.abs(u[1]!.x * axis.x + u[1]!.z * axis.z);
  let minPen = Infinity;
  for (const axis of [...ax, ...bx]) {
    const ra = radius(a.half, ax, axis);
    const rb = radius(b.half, bx, axis);
    const dist = Math.abs(dx * axis.x + dz * axis.z);
    const pen = ra + rb - dist;
    if (pen <= 0) return -1; // 该轴分离 → 不重叠
    minPen = Math.min(minPen, pen);
  }
  return minPen;
}

/** 垂直区间重叠 */
function verticalOverlap(a: BoxObstacle, b: BoxObstacle): number {
  const aTop = boxTop(a);
  const bTop = boxTop(b);
  return Math.min(aTop, bTop) - Math.max(a.pos.y, b.pos.y);
}

function main(): void {
  // 诊断对象：ship 的完整盒子（含边界墙，与 GameSim.boxes 同源）
  const shipMap = MAPS.find((m) => m.id === 'ship')!;
  const boxes = shipMap.boxes;
  const wh = 3; // arenaWalls 高度只需要粗略垂直判断
  const walls: BoxObstacle[] = [
    { pos: { x: 0, y: 0, z: -49 }, half: { x: 11.5, y: wh / 2, z: 0.5 }, kind: 'wall' },
    { pos: { x: 0, y: 0, z: 49 }, half: { x: 11.5, y: wh / 2, z: 0.5 }, kind: 'wall' },
    { pos: { x: -10.5, y: 0, z: 0 }, half: { x: 0.5, y: wh / 2, z: 50 }, kind: 'wall' },
    { pos: { x: 10.5, y: 0, z: 0 }, half: { x: 0.5, y: wh / 2, z: 50 }, kind: 'wall' },
  ];

  const all: Array<[BoxObstacle, string]> = [
    ...boxes.map((b) => [b, 'map'] as [BoxObstacle, string]),
    ...walls.map((b) => [b, 'bound'] as [BoxObstacle, string]),
  ];

  console.log(`总盒数 ${boxes.length} + 边界 ${walls.length}`);
  const report: string[] = [];
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const [a, ta] = all[i]!;
      const [b, tb] = all[j]!;
      const pen = satPenetration(a, b);
      if (pen <= 0.15) continue;
      const vOver = verticalOverlap(a, b);
      if (vOver <= 0.05) continue; // 垂直不交 → 一个站在另一个顶上，合法
      // 深度分级：>1.0 严重穿模；0.15~1.0 轻微
      const label = (x: BoxObstacle, t: string): string =>
        `${t}(${x.kind}) @(${x.pos.x},${x.pos.y},${x.pos.z}) half(${x.half.x},${x.half.y},${x.half.z}) yaw${(((x.yaw ?? 0) * 180) / Math.PI).toFixed(0)}°`;
      const sev = pen > 0.6 ? '!!' : pen > 0.3 ? ' !' : '  ';
      report.push(`${sev} pen=${pen.toFixed(2)} vOver=${vOver.toFixed(2)}  ${label(a, ta)}  ×  ${label(b, tb)}`);
    }
  }
  console.log(`重叠组合 ${report.length} 个：`);
  report.forEach((r) => console.log(r));
}

main();
