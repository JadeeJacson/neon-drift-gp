// layout.js — 城市规划数据：路网（网格 + 主干道）、街区划分、分区与保留地。
// 全部确定性（固定种子），保证每次生成同一座城。
export const TOWER = { x: -480, z: 620 };   // 东京塔（西南）
export const SKYTREE = { x: 1000, z: -180 }; // 晴空塔（东北远郊）

export const CROSS = { x: 0, z: 0, wV: 30, wH: 26 }; // 涩谷十字路口

export function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roadLine(rng, originHalf, limit) {
  // 从原点向外生成一侧的路中心线；side 由 originHalf 符号决定，位置取绝对值后镜像。
  const roads = [];
  const s = Math.sign(originHalf) || 1;
  let edge = Math.abs(originHalf); // 当前路的外边缘（正方向累计）
  let i = 0;
  while (edge < limit) {
    // 第一个街区固定 95m 且其后紧跟一条路（保证路口四角是独立的 95m 街区）
    const bw = i === 0 ? 95 : i === 1 ? 0 : 58 + rng() * 78;
    const major = i > 1 && i % 3 === 2;
    const rw = i === 0 ? 0 : major ? 28 : 13;
    const pos = edge + bw / 2 + rw / 2; // 这条路的中心（正方向）
    if (rw > 0) roads.push({ pos: pos * s, w: rw, major });
    edge = pos + rw / 2 + bw / 2;
    i++;
  }
  return roads;
}

export function buildLayout() {
  const rng = makeRng(20260927);

  const roadsV = [{ pos: CROSS.x, w: CROSS.wV, major: true }]; // x=0 南北向
  const roadsH = [{ pos: CROSS.z, w: CROSS.wH, major: true }]; // z=0 东西向
  for (const side of [1, -1]) {
    for (const r of roadLine(rng, (CROSS.wV / 2) * side, 880)) roadsV.push(r);
    for (const r of roadLine(rng, (CROSS.wH / 2) * side, 880)) roadsH.push(r);
  }
  roadsV.sort((a, b) => a.pos - b.pos);
  roadsH.sort((a, b) => a.pos - b.pos);

  // 街区 = 相邻两条路之间的矩形
  const blocks = [];
  for (let i = 0; i < roadsV.length - 1; i++) {
    const vx0 = roadsV[i].pos + roadsV[i].w / 2;
    const vx1 = roadsV[i + 1].pos - roadsV[i + 1].w / 2;
    if (vx1 - vx0 < 26) continue;
    for (let j = 0; j < roadsH.length - 1; j++) {
      const hz0 = roadsH[j].pos + roadsH[j].w / 2;
      const hz1 = roadsH[j + 1].pos - roadsH[j + 1].w / 2;
      if (hz1 - hz0 < 26) continue;
      const cx = (vx0 + vx1) / 2, cz = (hz0 + hz1) / 2;
      blocks.push({ x0: vx0, x1: vx1, z0: hz0, z1: hz1, cx, cz, zone: zoneOf(cx, cz, vx0, vx1, hz0, hz1) });
    }
  }
  return { roadsV, roadsH, blocks };
}

function zoneOf(cx, cz, x0, x1, z0, z1) {
  // 涩谷十字路口四个角（第一圈街区固定 95m → 恰好落在此范围）
  if (x0 > 8 && x1 < 122 && z0 > 8 && z1 < 122) return 'crossing';
  if (x0 > -122 && x1 < -8 && z0 > 8 && z1 < 122) return 'crossing';
  if (x0 > 8 && x1 < 122 && z0 > -122 && z1 < -8) return 'crossing';
  if (x0 > -122 && x1 < -8 && z0 > -122 && z1 < -8) return 'crossing';
  // 高楼群（东南，新宿式天际线）
  if (cx > 260 && cx < 720 && cz > 280 && cz < 760) return 'tower';
  // 公园（十字路口西南侧）
  if (cx > -400 && cx < -140 && cz > 170 && cz < 420) return 'park';
  // 东京塔周边留白
  const dt = Math.hypot(cx - TOWER.x, cz - TOWER.z);
  if (dt < 170) return 'towerpark';
  // 边缘低层
  if (Math.max(Math.abs(cx), Math.abs(cz)) > 800) return 'low';
  // 涩谷核心
  if (Math.abs(cx) < 175 && Math.abs(cz) < 195) return 'shibuya';
  return 'mid';
}
