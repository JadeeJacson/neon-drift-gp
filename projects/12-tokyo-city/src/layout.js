// layout.js — 城市规划数据：路网（网格 + 主干道）、街区划分、分区与保留地。
// 全部确定性（固定种子），保证每次生成同一座城。
// 圈层结构（Chebyshev 半径 r = max(|cx|,|cz|)）：
//   核心(r<950 中高层) → 低层(950–1450) → 郊区住宅(1450–2050，独栋) → 农村(>2050，村落+农田)
//   东侧海岸线（coastX，东京湾）：海 / 沙滩 / 港区；内陆侧由山脉围合。
export const TOWER = { x: -480, z: 620 };   // 东京塔（西南）
export const SKYTREE = { x: 1000, z: -180 }; // 晴空塔（东北，湾岸方向内陆侧）
export const CROSS = { x: 0, z: 0, wV: 30, wH: 26 }; // 涩谷十字路口

// 海岸线：x = coastX(z)（东侧）
export function coastX(z) {
  return 1750 + 180 * Math.sin(z * 0.0016) + 90 * Math.sin(z * 0.0007 + 2);
}

// 内陆路网界限：东侧在海岸前收住，其余方向伸入农村
export const LIMIT_E = 1450;
export const LIMIT_INLAND = 2450;

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
    // 东西向路网：东侧（+x）在海岸前收住
    for (const r of roadLine(rng, (CROSS.wV / 2) * side, side > 0 ? LIMIT_E : LIMIT_INLAND)) roadsV.push(r);
    for (const r of roadLine(rng, (CROSS.wH / 2) * side, LIMIT_INLAND)) roadsH.push(r);
  }
  roadsV.sort((a, b) => a.pos - b.pos);
  roadsH.sort((a, b) => a.pos - b.pos);

  // 河流：东西向，穿城入海；与河冲突的横向路让位挪移
  const RIVER = { z: -620, w: 46 };
  for (const r of roadsH) {
    const d = r.pos - RIVER.z;
    if (Math.abs(d) < 50) r.pos += Math.sign(d || 1) * (50 - Math.abs(d) + 6);
  }
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
  return { roadsV, roadsH, blocks, river: RIVER };
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
  // 地标周边留白（东京塔 / 晴空塔）
  if (Math.hypot(cx - TOWER.x, cz - TOWER.z) < 170) return 'towerpark';
  if (Math.hypot(cx - SKYTREE.x, cz - SKYTREE.z) < 140) return 'towerpark';
  // 海岸带：街区伸进海岸线以东 → 港区（无住宅）
  if (cx > coastX(cz) - 130) return 'coast';

  const r = Math.max(Math.abs(cx), Math.abs(cz));
  // 涩谷核心
  if (r < 950) {
    if (Math.abs(cx) < 175 && Math.abs(cz) < 195) return 'shibuya';
    return 'mid';
  }
  if (r < 1450) return 'low';       // 低层过渡
  if (r < 2050) return 'suburb';    // 郊区独栋
  return 'rural';                   // 农村：村落 + 农田
}
