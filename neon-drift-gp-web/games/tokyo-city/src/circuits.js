// circuits.js — 赛道的「纯逻辑」部分：不 import three.js，不碰 DOM。
//
// 为什么单独拆：路线图要求「核心流程可被脚本跑通」。赛道几何、闸门顺序、
// 圈数推进、派单计时都是纯数学，拆出来就能在 Node 里无头跑断言，
// 不必依赖被节流的浏览器。项目沿用练习期「sim / render 分离」的做法。
import { coastX } from './layout.js';

export const CIRCUITS = [
  {
    id: 'shibuya', name: '涩谷环线', laps: 2, difficulty: '入门',
    blurb: '核心区小环，两圈计时，熟悉路口与漂移。',
    bounds: { x0: -430, x1: 430, z0: -430, z1: 430 },
  },
  {
    id: 'midtown', name: '都心环线', laps: 2, difficulty: '进阶',
    blurb: '穿过高楼群与河流，长直道多，适合全油门冲极速。',
    bounds: { x0: -1150, x1: 1180, z0: -1100, z1: 1120 },
  },
  {
    id: 'bayline', name: '湾岸线', laps: 1, difficulty: '挑战',
    blurb: '一路向东开到东京湾，跨河、沿海，最后折返。',
    bounds: { x0: -620, x1: 1560, z0: -1180, z1: 1180 },
  },
];

// 卸货/取货点必须落在**陆地上**且在可行车范围内。
// 玩法的 _collide 会把车硬夹在 x <= coastX(z) - 14，所以任何放进湾里的坐标
// 都是永远到不了的死目标（台场小岛是海上的，只能作为景观，不能当订单点）。
// 这里取湾岸公路（coastX - 90）上的位置。
const ODAIBA = [Math.round(coastX(520) - 90), 520];
const SHIBUYA = [60, 70];
const TOWER = [-450, 580];
const SKYTREE = [960, -120];
const SUBURB = [-1500, 1500];

/**
 * 限时由路程推导，不手写。
 * 手写的限时曾经出现过「直线距离 3km 却只给 92s」这种物理上不可能完成的任务，
 * 而且改地图后不会自动跟着变。基准取城区保守均速 20m/s(72km/h) × 1.25 余量。
 */
function jobLimit(fromXZ, toXZ) {
  const d = Math.hypot(fromXZ[0] - toXZ[0], fromXZ[1] - toXZ[1]);
  // 用 ceil 而不是 round：限时只应偏宽松，绝不能因为四舍五入而比所需时间短
  return Math.max(45, Math.ceil((d / 20) * 1.25));
}

function mkJob(id, from, fromXZ, to, toXZ, pay, label) {
  return { id, from, fromXZ, to, toXZ, pay, label, limit: jobLimit(fromXZ, toXZ) };
}

export const JOBS = [
  mkJob('j1', '涩谷站', SHIBUYA, '东京塔', TOWER, 1200, '涩谷 → 东京塔'),
  mkJob('j2', '东京塔', TOWER, '湾岸台场', ODAIBA, 2400, '东京塔 → 湾岸台场（长途）'),
  mkJob('j3', '湾岸台场', ODAIBA, '晴空塔', SKYTREE, 1800, '湾岸台场 → 晴空塔'),
  mkJob('j4', '晴空塔', SKYTREE, '涩谷站', SHIBUYA, 1600, '晴空塔 → 涩谷'),
  mkJob('j5', '涩谷站', SHIBUYA, '郊区住宅区', SUBURB, 2000, '涩谷 → 郊区（长途）'),
];

export const GATE_SPACING = 210;   // 目标闸间距（米）
export const GATE_RADIUS = 11;     // 判定半径（米）
export const GATE_HIT_RADIUS = 9;  // 闸门环面半径（与判定一致，视觉上「穿环而过」）

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function nearest(roads, target) {
  return roads.reduce((a, b) => (Math.abs(b.pos - target) < Math.abs(a.pos - target) ? b : a));
}

/**
 * 把赛道矩形的四条边吸附到真实路中心线上，再沿周长均匀布闸。
 * 吸附是必要的：否则赛道闸门会落在街区内部，玩家永远够不到。
 */
export function buildCircuit(layout, def) {
  const { roadsV, roadsH } = layout;
  const xW = nearest(roadsV, def.bounds.x0).pos;
  const xE = nearest(roadsV, def.bounds.x1).pos;
  const zN = nearest(roadsH, def.bounds.z0).pos;
  const zS = nearest(roadsH, def.bounds.z1).pos;

  const corners = [
    { x: xW, z: zN }, { x: xE, z: zN },
    { x: xE, z: zS }, { x: xW, z: zS },
  ];

  const perim = [];
  for (let i = 0; i < 4; i++) {
    const a = corners[i], b = corners[(i + 1) % 4];
    perim.push(Math.hypot(b.x - a.x, b.z - a.z));
  }
  const total = perim.reduce((a, b) => a + b, 0);
  const count = Math.max(8, Math.round(total / GATE_SPACING));

  const base = [0, 0, 0, 0];
  for (let i = 1; i < 4; i++) base[i] = base[i - 1] + perim[i - 1];

  const gates = [];
  for (let i = 0; i < count; i++) {
    const s = (i / count) * total;
    let seg = 3;
    for (let k = 0; k < 4; k++) { if (s < base[k] + perim[k]) { seg = k; break; } }
    const a = corners[seg], b = corners[(seg + 1) % 4];
    const lt = clamp((s - base[seg]) / Math.max(perim[seg], 1e-3), 0, 1);
    gates.push({ x: a.x + (b.x - a.x) * lt, z: a.z + (b.z - a.z) * lt, index: i });
  }
  return { id: def.id, name: def.name, laps: def.laps, difficulty: def.difficulty, blurb: def.blurb, corners, gates, perim, count, total };
}

/** 闸门是否压在马路上（吸附是否生效的自检） */
export function gateOnRoad(layout, g) {
  const onV = layout.roadsV.some((r) => Math.abs(r.pos - g.x) <= r.w / 2 + 0.5);
  const onH = layout.roadsH.some((r) => Math.abs(r.pos - g.z) <= r.w / 2 + 0.5);
  return onV || onH;
}

/** 漂移分的累积速率（纯函数，便于断言手感曲线） */
export function driftRate(drift, speed) {
  if (drift <= 0.25 || Math.abs(speed) <= 6) return 0;
  return drift * clamp(Math.abs(speed) / 22, 0.2, 1.6) * 120;
}
