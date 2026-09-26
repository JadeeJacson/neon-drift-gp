import { CONFIG } from '../core/config';
import type { Vec3 } from './types';
import { v3 } from './vecmath';

export interface BoxObstacle {
  pos: Vec3;
  half: Vec3;
  kind: 'crate' | 'pillar' | 'wall' | 'block';
}

export interface MapDef {
  id: string;
  name: string;
  desc: string;
  boxes: BoxObstacle[];
}

/**
 * 地图一律是**预设布局**，不做每次随机生成：
 * 随机布局会让「平衡 bot 跑分」每次都在不同地图上跑，结果不可比（验证体系直接失效）。
 * 想加新地图就在这里加一条——加完必须对每张图单独跑一遍 bot 验收。
 *
 * 几何约定（与渲染层、物理层统一）：
 *   - pos 为「底面中心」，几何中心 = pos.y + half.y
 *   - 场地半边长 CONFIG.arena.half = 26，围墙在 ±26，所有 box 必须留在场内
 *   - 玩家跳跃高度 = jumpSpeed²/(2·|gravity|) = 8.2²/(2·26) ≈ 1.29m
 *     → 想让玩家跳上去的台面，顶面高度必须 ≤ 1.2m
 */
export const MAPS: MapDef[] = [
  {
    id: 'hub',
    name: '枢纽',
    desc: '四角高柱 + 中距箱体，视野开阔的基准图',
    boxes: [
      // 四角高柱：远距离视线遮挡，狙击手的天然掩体
      { pos: v3(8, 0, 8), half: v3(0.6, 2.6, 0.6), kind: 'pillar' },
      { pos: v3(-8, 0, 8), half: v3(0.6, 2.6, 0.6), kind: 'pillar' },
      { pos: v3(8, 0, -8), half: v3(0.6, 2.6, 0.6), kind: 'pillar' },
      { pos: v3(-8, 0, -8), half: v3(0.6, 2.6, 0.6), kind: 'pillar' },

      // 中距离箱体：绕行（1.2 高度超出 autostep，不能翻）
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
    ],
  },
  {
    id: 'cross',
    name: '十字',
    desc: '四条辐射墙切出象限，中心留广场——转角遭遇战',
    boxes: [
      // 辐射墙：中心 |x|<2 且 |z|<2 留空，形成中央广场与四条通道
      { pos: v3(0, 0, 7), half: v3(0.5, 2.0, 5), kind: 'wall' },
      { pos: v3(0, 0, -7), half: v3(0.5, 2.0, 5), kind: 'wall' },
      { pos: v3(7, 0, 0), half: v3(5, 2.0, 0.5), kind: 'wall' },
      { pos: v3(-7, 0, 0), half: v3(5, 2.0, 0.5), kind: 'wall' },

      // 四象限矮掩体：转角后的第一处掩护
      { pos: v3(9, 0, 9), half: v3(1.6, 0.9, 1.6), kind: 'crate' },
      { pos: v3(-9, 0, 9), half: v3(1.6, 0.9, 1.6), kind: 'crate' },
      { pos: v3(9, 0, -9), half: v3(1.6, 0.9, 1.6), kind: 'crate' },
      { pos: v3(-9, 0, -9), half: v3(1.6, 0.9, 1.6), kind: 'crate' },

      // 外圈高柱：对角狙击位
      { pos: v3(18, 0, 18), half: v3(0.7, 2.8, 0.7), kind: 'pillar' },
      { pos: v3(-18, 0, -18), half: v3(0.7, 2.8, 0.7), kind: 'pillar' },

      // 中距箱体：堵塞象限间的直线通道
      { pos: v3(16, 0, -6), half: v3(2.2, 1.2, 1.2), kind: 'crate' },
      { pos: v3(-16, 0, 6), half: v3(2.2, 1.2, 1.2), kind: 'crate' },
    ],
  },
  {
    id: 'terrace',
    name: '高台',
    desc: '中央环形高台（可跳上）+ 外围掩体——抢高地',
    boxes: [
      // 四角高台（顶面 1.2m，可跳上）：给抢高地一个动机。
      //
      // ⚠️ 关键约束（踩过一次才知道）：敌人没有寻路，只有「朝玩家推进 + 切线绕行」。
      // 所以**中心绝不能被围死**——四条主轴必须完全开放。
      // 上一版做成环形高台，只留 4 个小角缺口，bot 实测卡死在第 3 波、
      // 跑满 480s 上限只拿到 21/57 杀（敌人绕不进缺口）。改成四角分离式后正常。
      { pos: v3(11, 0, 11), half: v3(4, 0.6, 4), kind: 'block' },
      { pos: v3(-11, 0, 11), half: v3(4, 0.6, 4), kind: 'block' },
      { pos: v3(11, 0, -11), half: v3(4, 0.6, 4), kind: 'block' },
      { pos: v3(-11, 0, -11), half: v3(4, 0.6, 4), kind: 'block' },

      // 上台台阶（顶面 0.8m）：不必每次都靠极限跳
      { pos: v3(11, 0, 6.2), half: v3(2, 0.4, 1), kind: 'crate' },
      { pos: v3(-11, 0, 6.2), half: v3(2, 0.4, 1), kind: 'crate' },
      { pos: v3(11, 0, -6.2), half: v3(2, 0.4, 1), kind: 'crate' },
      { pos: v3(-11, 0, -6.2), half: v3(2, 0.4, 1), kind: 'crate' },

      // 中距掩体（半径 7）：给玩家断开视线的落脚点。
      // 少了这一圈，中心太开阔，完美 bot 实测在第 5 波被集火打死（42/57 杀）。
      { pos: v3(0, 0, 7), half: v3(1.6, 1.1, 1.6), kind: 'crate' },
      { pos: v3(0, 0, -7), half: v3(1.6, 1.1, 1.6), kind: 'crate' },
      { pos: v3(7, 0, 0), half: v3(1.6, 1.1, 1.6), kind: 'crate' },
      { pos: v3(-7, 0, 0), half: v3(1.6, 1.1, 1.6), kind: 'crate' },

      // 主轴上的中距掩体：制造转角，但不封闭通路
      { pos: v3(0, 0, 15), half: v3(2.5, 1.2, 1.2), kind: 'crate' },
      { pos: v3(0, 0, -15), half: v3(2.5, 1.2, 1.2), kind: 'crate' },
      { pos: v3(15, 0, 0), half: v3(1.2, 1.2, 2.5), kind: 'crate' },
      { pos: v3(-15, 0, 0), half: v3(1.2, 1.2, 2.5), kind: 'crate' },

      // 四角柱
      { pos: v3(20, 0, 20), half: v3(0.7, 2.6, 0.7), kind: 'pillar' },
      { pos: v3(-20, 0, 20), half: v3(0.7, 2.6, 0.7), kind: 'pillar' },
      { pos: v3(20, 0, -20), half: v3(0.7, 2.6, 0.7), kind: 'pillar' },
      { pos: v3(-20, 0, -20), half: v3(0.7, 2.6, 0.7), kind: 'pillar' },
    ],
  },
  {
    id: 'corridor',
    name: '长廊',
    desc: '两条长墙夹出走廊，两端缺口绕行——远距离对枪',
    boxes: [
      // 平行长墙：夹出 z ∈ (-7.5, 7.5) 的走廊；墙到 x=±17，两侧各留 9m 缺口绕行
      { pos: v3(0, 0, 8), half: v3(17, 2.2, 0.5), kind: 'wall' },
      { pos: v3(0, 0, -8), half: v3(17, 2.2, 0.5), kind: 'wall' },

      // 走廊内矮掩体：切断长直视线，逼出走位
      { pos: v3(-9, 0, 0), half: v3(1.2, 0.9, 2.4), kind: 'crate' },
      { pos: v3(9, 0, 0), half: v3(1.2, 0.9, 2.4), kind: 'crate' },
      { pos: v3(0, 0, 3), half: v3(2.0, 0.7, 1.0), kind: 'crate' },
      { pos: v3(0, 0, -3), half: v3(2.0, 0.7, 1.0), kind: 'crate' },

      // 外侧狙击台：走廊外的高位，可俯瞰缺口
      { pos: v3(-12, 0, 15), half: v3(3.0, 1.6, 2.0), kind: 'block' },
      { pos: v3(12, 0, -15), half: v3(3.0, 1.6, 2.0), kind: 'block' },

      // 外侧柱
      { pos: v3(20, 0, 14), half: v3(0.7, 2.6, 0.7), kind: 'pillar' },
      { pos: v3(-20, 0, -14), half: v3(0.7, 2.6, 0.7), kind: 'pillar' },

      // 走廊两端缺口处的掩体
      { pos: v3(22, 0, 0), half: v3(1.5, 1.5, 1.5), kind: 'crate' },
      { pos: v3(-22, 0, 0), half: v3(1.5, 1.5, 1.5), kind: 'crate' },
    ],
  },
  {
    id: 'yard',
    name: '工地',
    desc: '集装箱双排夹道 + 中央广场——中距交火与走廊突击（布局借鉴 04_1 的工地地图）',
    boxes: [
      // 集装箱双排（高 2.6，不可翻越）：夹出东西向中央走廊。
      // ⚠️ 沿用「不能围死中心」硬约束：每排拆成两段，z ∈ (-2, 2) 留 4m 缺口，
      // 东西主轴经缺口直通中心；南北主轴完全无遮挡。
      { pos: v3(10, 0, -7), half: v3(1.2, 1.3, 5), kind: 'block' },
      { pos: v3(10, 0, 7), half: v3(1.2, 1.3, 5), kind: 'block' },
      { pos: v3(-10, 0, -7), half: v3(1.2, 1.3, 5), kind: 'block' },
      { pos: v3(-10, 0, 7), half: v3(1.2, 1.3, 5), kind: 'block' },

      // 中央广场矮箱（0.8 高，可跳上）：广场不是空地，是高低差竞技台
      { pos: v3(0, 0, 5), half: v3(1.4, 0.8, 1.4), kind: 'crate' },
      { pos: v3(0, 0, -5), half: v3(1.4, 0.8, 1.4), kind: 'crate' },
      { pos: v3(3.5, 0, 0), half: v3(1.0, 0.7, 1.0), kind: 'crate' },
      { pos: v3(-3.5, 0, 0), half: v3(1.0, 0.7, 1.0), kind: 'crate' },

      // 集装箱二层堆叠（对角）：俯角火力点，顶面 3.9m 只能当掩体用
      { pos: v3(19, 0, 19), half: v3(1.6, 1.3, 3.2), kind: 'block' },
      { pos: v3(19, 2.6, 19), half: v3(1.6, 1.3, 3.2), kind: 'block' },
      { pos: v3(-19, 0, -19), half: v3(1.6, 1.3, 3.2), kind: 'block' },
      { pos: v3(-19, 2.6, -19), half: v3(1.6, 1.3, 3.2), kind: 'block' },

      // 油桶（小箱近似）+ 灯柱：lane 上的点滴掩护与视线遮挡
      { pos: v3(16, 0, -8), half: v3(0.7, 0.6, 0.7), kind: 'crate' },
      { pos: v3(-16, 0, 8), half: v3(0.7, 0.6, 0.7), kind: 'crate' },
      { pos: v3(20, 0, -16), half: v3(0.6, 2.4, 0.6), kind: 'pillar' },
      { pos: v3(-20, 0, 16), half: v3(0.6, 2.4, 0.6), kind: 'pillar' },

      // 南北两端的混凝土台（1.5 高）：据点模式的出生掩护
      { pos: v3(0, 0, 17), half: v3(2.6, 1.5, 1.8), kind: 'block' },
      { pos: v3(0, 0, -17), half: v3(2.6, 1.5, 1.8), kind: 'block' },
    ],
  },
];

/** 默认地图：bot 跑分基线用的就是它，改默认会失去与历史跑分的可比性 */
export const DEFAULT_MAP_ID = 'hub';

export function findMap(id: string): MapDef {
  return MAPS.find((m) => m.id === id) ?? MAPS[0]!;
}

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
function clearanceXZ(p: Vec3, boxes: BoxObstacle[]): number {
  let best = Infinity;
  for (const b of boxes) {
    const dx = Math.max(Math.abs(p.x - b.pos.x) - b.half.x, 0);
    const dz = Math.max(Math.abs(p.z - b.pos.z) - b.half.z, 0);
    best = Math.min(best, Math.hypot(dx, dz));
  }
  return best;
}

/**
 * 挑一个出生点：距玩家足够远（避免贴脸刷怪）、离掩体有余量、在场内。
 * 重试上限 24 次，失败则退化为任意角度的合法点。
 *
 * boxes 由调用方传入（当前地图），这里不再引用全局常量——否则换图后出生点校验会失效。
 */
export function pickSpawnPoint(
  rand: () => number,
  playerPos: Vec3,
  boxes: BoxObstacle[],
  minDistFromPlayer = 14,
): Vec3 {
  const { spawnMinDist, spawnMaxDist } = CONFIG.wave;
  const limit = CONFIG.arena.half - 3;
  for (let i = 0; i < 24; i++) {
    const a = rand() * Math.PI * 2;
    const r = spawnMinDist + rand() * (spawnMaxDist - spawnMinDist);
    const p = v3(Math.cos(a) * r, 0, Math.sin(a) * r);
    if (Math.abs(p.x) > limit || Math.abs(p.z) > limit) continue;
    if (clearanceXZ(p, boxes) < 1.6) continue;
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
