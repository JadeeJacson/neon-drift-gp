import { CONFIG } from '../core/config';
import type { Vec3 } from './types';
import { v3 } from './vecmath';

/**
 * 盒子障碍：pos 为「底面中心」，half 为半尺寸。
 * yaw（弧度，绕 Y）为可选 —— 运输船地图的斜放集装箱需要旋转盒；
 * 缺省 0 时与旧版 AABB 行为完全一致。tone 是渲染层的配色索引（集装箱涂装）。
 */
export interface BoxObstacle {
  pos: Vec3;
  half: Vec3;
  kind: 'crate' | 'pillar' | 'wall' | 'block' | 'container' | 'stair' | 'pipe';
  yaw?: number;
  tone?: number;
}

/** 地图边界：缺省用 CONFIG.arena 的正方形；运输船是长条甲板，必须独立给 */
export interface MapBounds {
  halfX: number;
  halfZ: number;
}

export interface MapDef {
  id: string;
  name: string;
  desc: string;
  boxes: BoxObstacle[];
  bounds?: MapBounds;
  /** 据点模式双方基地（缺省 = 东西两半场中点） */
  bases?: { blue: Vec3; red: Vec3 };
  /** 渲染层附加元素开关（船体装饰 / 吊车 / 管道外观） */
  ship?: boolean;
}

/** 地图有效边界（未给 bounds 的地图退回正方形竞技场） */
export function mapBounds(map: MapDef): MapBounds {
  return map.bounds ?? { halfX: CONFIG.arena.half, halfZ: CONFIG.arena.half };
}

/* ================= 运输船几何常量（移植自 043 map.js） ================= */
const C_W = 2.44; // 集装箱宽
const C_H = 2.59; // 集装箱高
const L20 = 6.06; // 20 尺箱长
const L40 = 12.19; // 40 尺箱长

/** 沿用 043 的集装箱涂装色板（tone 索引 → 渲染层主色） */
export const SHIP_PALETTE = [
  0x9c4632, 0x2f7d86, 0x1f4f8c, 0x2b6d3f, 0x3b7f8f, 0x8a6a2f, 0x2d3f5e, 0x7a3a4a,
];

/** 生成集装箱盒子（tiers=2 时上下两截；rotDeg 绕 Y 旋转） */
function cont(x: number, z: number, len: number, tiers: number, rotDeg: number, tone: number): BoxObstacle[] {
  const out: BoxObstacle[] = [];
  for (let t = 0; t < tiers; t++) {
    out.push({
      pos: v3(x, t * C_H, z),
      half: v3(len / 2, C_H / 2, C_W / 2),
      kind: 'container',
      yaw: (rotDeg * Math.PI) / 180,
      tone,
    });
  }
  return out;
}

/** 两级错开木箱塔：跳上 1.2 → 再上 2.1 → 跨进 2.59 的集装箱顶「二楼」 */
function climbTower(x: number, z: number): BoxObstacle[] {
  return [
    { pos: v3(x, 0, z), half: v3(0.6, 0.6, 0.6), kind: 'crate' },
    { pos: v3(x + 1.15, 0, z), half: v3(0.6, 0.6, 0.6), kind: 'crate' },
    { pos: v3(x + 1.15, 1.2, z), half: v3(0.6, 0.45, 0.6), kind: 'crate' },
  ];
}

/** 木箱 / 油桶（油桶用小方盒近似，与 043 的碰撞做法一致） */
function crate(x: number, z: number, s = 1.15): BoxObstacle {
  return { pos: v3(x, 0, z), half: v3(s / 2, s / 2, s / 2), kind: 'crate' };
}
function barrel(x: number, z: number): BoxObstacle {
  return { pos: v3(x, 0, z), half: v3(0.34, 0.475, 0.34), kind: 'crate' };
}

/** 台阶式钢梯：每级 0.25 高、0.34 深，KCC autostep(0.45) 可直接走上去 */
function stairs(x: number, z: number, dirZ: number, steps: number, width: number, rise = 0.25): BoxObstacle[] {
  const out: BoxObstacle[] = [];
  const run = 0.34;
  for (let i = 0; i < steps; i++) {
    out.push({
      pos: v3(x, i * rise, z + dirZ * (i + 0.5) * run),
      half: v3(width / 2, rise / 2, run / 2),
      kind: 'stair',
    });
  }
  return out;
}

/** 单向管道（本移植改为双向通道）：内空 2.56 宽 × 2.3 高的可走管身 */
function pipe(x: number, zA: number, zB: number): BoxObstacle[] {
  const cz = (zA + zB) / 2;
  const len = Math.abs(zA - zB);
  const inner = 1.28;
  return [
    { pos: v3(x, 0.05, cz), half: v3(inner, 0.15, len / 2), kind: 'pipe' },
    { pos: v3(x - inner - 0.15, 0.1, cz), half: v3(0.15, 1.2, len / 2), kind: 'pipe' },
    { pos: v3(x + inner + 0.15, 0.1, cz), half: v3(0.15, 1.2, len / 2), kind: 'pipe' },
    { pos: v3(x, 2.62, cz), half: v3(inner + 0.3, 0.15, len / 2), kind: 'pipe' },
  ];
}

/** 两端出生舱（移植 043 spawnHouse 的墙体，含大门 / 侧门 / 顶棚洞口 + 钢梯） */
function spawnHouse(side: 1 | -1): BoxObstacle[] {
  const out: BoxObstacle[] = [];
  const zWall = side * 36.5;
  const zBack = side * 48.1;
  const cz = (zWall + zBack) / 2;
  const span = Math.abs(zBack - zWall);
  const roofBottom = 3.4;
  const roofH = 0.35;
  const wall = (x: number, y: number, z: number, w: number, h: number, d: number): void => {
    out.push({ pos: v3(x, y, z), half: v3(w / 2, h / 2, d / 2), kind: 'wall' });
  };

  // 前墙：中央大门（|x|<2.1）+ 侧门（5.4~8.0）
  wall(-6.05, 0, zWall, 7.9, 3.4, 0.5);
  wall(3.75, 0, zWall, 3.3, 3.4, 0.5);
  wall(9.0, 0, zWall, 2.0, 3.4, 0.5);
  // 门楣
  wall(0, 2.75, zWall, 4.2, 0.65, 0.5);
  wall(6.7, 2.75, zWall, 1.3, 0.65, 0.5);
  // 后墙 + 侧墙
  wall(0, 0, zBack, 20.0, 3.4, 0.6);
  wall(-9.7, 0, cz, 0.6, 3.4, span);
  wall(9.7, 0, cz, 0.6, 3.4, span);

  // 顶棚（给左舷钢梯留洞 x∈[-9.55,-7.85]，z 在洞口两侧各留一块）
  const holeX = -8.7;
  const holeW = 1.7;
  const holeZ = zBack - side * 7.36;
  const holeD = 2.6;
  const zA = cz - span / 2 + 0.3;
  const zB = cz + span / 2 - 0.3;
  const roof = (x0: number, x1: number, z0: number, z1: number): void => {
    if (x1 - x0 < 0.2 || z1 - z0 < 0.2) return;
    out.push({
      pos: v3((x0 + x1) / 2, roofBottom, (z0 + z1) / 2),
      half: v3((x1 - x0) / 2, roofH / 2, (z1 - z0) / 2),
      kind: 'wall',
    });
  };
  const hz0 = holeZ - holeD / 2;
  const hz1 = holeZ + holeD / 2;
  const lo = Math.min(zA, zB);
  const hi = Math.max(zA, zB);
  roof(holeX + holeW / 2, 9.7, lo, hi);
  roof(holeX - holeW / 2, holeX + holeW / 2, lo, Math.min(Math.max(hz0, lo), hi));
  roof(holeX - holeW / 2, holeX + holeW / 2, Math.max(Math.min(hz1, hi), lo), hi);
  roof(-9.7, holeX - holeW / 2, lo, hi);

  // 钢梯：贴左舷墙上顶棚（14 级 × 0.25 = 3.5 ≈ 顶棚上沿）
  const stairStart = zBack - side * 3.2;
  out.push(...stairs(holeX, stairStart, -side, 14, 1.4));

  // 舱内掩体与点缀
  out.push(...cont(6.2, zBack - side * 8.5, L20, 1, 0, side < 0 ? 0 : 1));
  out.push(crate(-4.6, zBack - side * 9.2, 1.2));
  out.push(barrel(-2.0, zBack - side * 9.4));
  out.push(barrel(-1.3, zBack - side * 10.1));
  return out;
}

/**
 * 运输船 TRANSPORT SHIP（移植自 043 map.js 的完整布局）：
 *   长条钢甲板（x ∈ ±10，z ∈ ±48.5）+ 两端出生舱（大门 + 侧门 + 钢梯上顶棚）
 *   + 中路 V 形斜放 40 尺箱（中央留 ~6.6m 通道）+ 两侧 L 形箱堆
 *   + 木箱踏板塔跳上集装箱「二楼」+ 两条管形侧翼通道 + 右舷驾驶舱（可登顶）。
 * 几何差异说明：043 的单向阀需要专用碰撞机制，这里改为双向管形通道；
 * 出生舱按 04 的内墙位置（±10.0）微调了墙厚。
 */
const SHIP_BOXES: BoxObstacle[] = [
  // ---- 两端出生舱 ----
  ...spawnHouse(-1),
  ...spawnHouse(1),

  // ---- 中路 V 形斜放集装箱（内端拉开，中央 ~6.6m 通行）----
  ...cont(-5.2, 3.0, L40, 1, 108, 0),
  ...cont(5.2, 3.0, L40, 1, 72, 1),
  ...climbTower(-3.4, -2.8),
  // 贴斜箱堆 (-5,12) 的 -x 端面外（原 (3.4,11.6) 嵌进箱堆 1.46m，SAT 诊断）
  ...climbTower(0, 13.9),

  // ---- 两侧 20 尺双层箱堆（斜放，制造斜向掩体角）----
  ...cont(-5.6, -8.0, L20, 2, 20, 4),
  ...cont(5.6, -8.0, L20, 2, -20, 6),
  ...cont(-5.0, 12.0, L20, 2, -20, 3),
  ...cont(5.0, 12.0, L20, 2, 20, 5),
  ...climbTower(-6.2, -4.2),
  ...climbTower(6.2, -4.2),
  ...climbTower(-6.0, 15.8),
  ...climbTower(6.0, 15.8),

  // ---- 中央掩体（故意偏离轴心：对称摆会让两队顶在同一个箱面上互相看不见）----
  ...cont(-3.4, 21.0, L20, 1, 0, 2),
  ...cont(3.4, -21.0, L20, 1, 0, 7),
  ...climbTower(0, 24.6),
  ...climbTower(0, -24.6),
  barrel(5.6, 22.6),
  barrel(-5.6, -22.6),

  // ---- 侧翼 L 形箱堆 ----
  ...cont(-6.5, -30.0, L20, 2, 0, 1),
  ...cont(3.6, 26.5, L20, 2, 0, 6),
  // 原 cont(±4.6, ∓22, yaw90) 横穿中央掩体箱 3.05m（SAT 诊断），已删除
  // 左舷横箱：z 8.0→6.8，脱离斜箱堆 (-5,12) 的端角（原穿 1.03m）
  ...cont(-8.0, 6.8, L20, 1, 90, 5),
  // 右舷横箱：z=−8 一线被双层斜箱堆占据（左舷无对应物），南移至 (8,−16)；
  // 原 (8.8,-2.6) 与 V 右箱端/踏板塔/油桶三处相穿
  ...cont(8.0, -16.0, L20, 1, 90, 3),
  ...climbTower(-5.4, 26.4),
  ...climbTower(4.9, -26.4), // 原 (5.4,-26.4) 第二级箱嵌入管道外壁 0.23m
  crate(-9.2, 12.8, 1.2), // 原 (-8.4,12.4) 嵌斜箱堆端角 0.45m
  crate(8.6, -12.2, 1.2), // 原 (8.4,-12.4)，让位右舷横箱 (8,-16)
  barrel(-9.5, 2.6), // 原 (-9.4,4.2) 嵌左舷横箱端部
  barrel(9.4, -2.9), // 原 (9.4,-4.2) 嵌右舷横箱端部 0.96m
  // 管道一侧只放低矮掩体
  barrel(8.2, 16.0),
  barrel(-8.2, -16.0),
  crate(-7.4, 15.2, 1.1),
  crate(6.0, -15.2, 1.1), // 原 (7.4,-15.2) 落在右舷横箱 (8,-16) 内部，西移贴箱外侧

  // ---- 两条管形侧翼通道（043 的单向管道去掉单向阀，双向可走）----
  ...pipe(8.5, -34, -19), // 潜伏者（船尾 / 蓝方）右舷通道
  ...pipe(-8.5, 34, 19), // 保卫者（船头 / 红方）左舷通道

  // ---- 右舷驾驶舱（白色上层建筑，钢梯可登顶 y≈4.25；x 8.4→8.2 让下层块脱离船舷墙）----
  { pos: v3(8.2, 0, 33.0), half: v3(1.8, 2.1, 2.8), kind: 'block' },
  { pos: v3(8.2, 4.2, 33.0), half: v3(1.6, 0.7, 2.5), kind: 'block' },
  ...stairs(5.1, 30.0, 1, 17, 1.4),

  // ---- 四台吊车的碰撞体（渲染几何在 render/buildShipExtras）----
  // 立柱在舷墙走道内（x=±9.25，玩家可达 9.65），悬挂箱底 2.8 高于 V 箱顶 2.59
  // 但低于箱顶站立者的头顶 4.29——原为纯装饰，玩家可直接穿过（043 遗留的反向空气墙）。
  ...[-1, 1].flatMap((sx) =>
    [-1, 1].flatMap((sz): BoxObstacle[] => [
      { pos: v3(sx * 9.25, 0, sz * 12), half: v3(0.25, 3.8, 0.25), kind: 'pillar' },
      { pos: v3(sx * 5.05, 2.8, sz * 6.4), half: v3(2.3, 1.2, 1.15), kind: 'container', tone: 6 },
    ]),
  ),
];

export const MAPS: MapDef[] = [
  {
    id: 'ship',
    name: '运输船',
    desc: '长条钢甲板 + V 形集装箱 + 二楼箱顶 + 侧翼管道——经典 CF 布局（移植自 043）',
    boxes: SHIP_BOXES,
    bounds: { halfX: 10.5, halfZ: 49.0 },
    bases: {
      blue: { x: 0, y: 0, z: -42.5 },
      red: { x: 0, y: 0, z: 42.5 },
    },
    ship: true,
  },
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
    id: 'yard',
    name: '工地',
    desc: '集装箱双排夹道 + 中央广场——中距交火与走廊突击',
    boxes: [
      { pos: v3(10, 0, -7), half: v3(1.2, 1.3, 5), kind: 'block' },
      { pos: v3(10, 0, 7), half: v3(1.2, 1.3, 5), kind: 'block' },
      { pos: v3(-10, 0, -7), half: v3(1.2, 1.3, 5), kind: 'block' },
      { pos: v3(-10, 0, 7), half: v3(1.2, 1.3, 5), kind: 'block' },

      { pos: v3(0, 0, 5), half: v3(1.4, 0.8, 1.4), kind: 'crate' },
      { pos: v3(0, 0, -5), half: v3(1.4, 0.8, 1.4), kind: 'crate' },
      { pos: v3(3.5, 0, 0), half: v3(1.0, 0.7, 1.0), kind: 'crate' },
      { pos: v3(-3.5, 0, 0), half: v3(1.0, 0.7, 1.0), kind: 'crate' },

      { pos: v3(19, 0, 19), half: v3(1.6, 1.3, 3.2), kind: 'block' },
      { pos: v3(19, 2.6, 19), half: v3(1.6, 1.3, 3.2), kind: 'block' },
      { pos: v3(-19, 0, -19), half: v3(1.6, 1.3, 3.2), kind: 'block' },
      { pos: v3(-19, 2.6, -19), half: v3(1.6, 1.3, 3.2), kind: 'block' },

      { pos: v3(16, 0, -8), half: v3(0.7, 0.6, 0.7), kind: 'crate' },
      { pos: v3(-16, 0, 8), half: v3(0.7, 0.6, 0.7), kind: 'crate' },
      { pos: v3(20, 0, -16), half: v3(0.6, 2.4, 0.6), kind: 'pillar' },
      { pos: v3(-20, 0, 16), half: v3(0.6, 2.4, 0.6), kind: 'pillar' },

      { pos: v3(0, 0, 17), half: v3(2.6, 1.5, 1.8), kind: 'block' },
      { pos: v3(0, 0, -17), half: v3(2.6, 1.5, 1.8), kind: 'block' },
    ],
  },
];

/** 默认地图：运输船（本项目的主地图） */
export const DEFAULT_MAP_ID = 'ship';

export function findMap(id: string): MapDef {
  return MAPS.find((m) => m.id === id) ?? MAPS[0]!;
}

/* ================= 旋转盒几何工具（sim 层内共享，零依赖） ================= */

/** 点是否在盒子的 XZ 投影内（考虑 yaw；pad 为外扩量）。
 *  ⚠️ 约定对齐：Rapier setRotation / three rotation.y 的 +θ 均把局部 +X 转向 -Z，
 *  正变换是 world = [c, s; -s, c]·local，这里做它的逆变换把世界坐标转回局部。 */
export function pointInBoxXZ(px: number, pz: number, b: BoxObstacle, pad = 0): boolean {
  const c = Math.cos(b.yaw ?? 0);
  const s = Math.sin(b.yaw ?? 0);
  const dx = px - b.pos.x;
  const dz = pz - b.pos.z;
  const lx = c * dx - s * dz;
  const lz = s * dx + c * dz;
  return Math.abs(lx) <= b.half.x + pad && Math.abs(lz) <= b.half.z + pad;
}

/** 盒子顶面高度 */
export function boxTop(b: BoxObstacle): number {
  return b.pos.y + b.half.y * 2;
}

/** 盒子的轴对齐包围半宽（yaw 旋转后的 AABB，用于粗略间距判定） */
export function boxAabbHalf(b: BoxObstacle): { hx: number; hz: number } {
  const c = Math.abs(Math.cos(b.yaw ?? 0));
  const s = Math.abs(Math.sin(b.yaw ?? 0));
  return { hx: c * b.half.x + s * b.half.z, hz: s * b.half.x + c * b.half.z };
}

/**
 * (x,z) 竖直线上方 y..y+h 区间是否被任何实心盒占据（考虑 yaw 与 pad 外扩）。
 * nav 采样与出生点校验共用，保证「能站的点」在物理上真的站得进去。
 */
export function columnBlocked(x: number, z: number, y: number, h: number, boxes: BoxObstacle[], pad = 0): boolean {
  for (const b of boxes) {
    if (!pointInBoxXZ(x, z, b, pad)) continue;
    const top = boxTop(b);
    const bottom = b.pos.y;
    if (top > y + 0.05 && bottom < y + h) return true;
  }
  return false;
}

/** (x,z) 竖直线的支撑面高度（最高的盒顶；无盒则 0 = 甲板） */
export function supportTop(x: number, z: number, boxes: BoxObstacle[], maxY = 9): number {
  let top = 0;
  for (const b of boxes) {
    if (b.kind === 'wall' || b.kind === 'pipe') continue;
    if (!pointInBoxXZ(x, z, b, 0)) continue;
    const t = boxTop(b);
    if (t > top && t <= maxY) top = t;
  }
  return top;
}

/** 四面围墙（按地图边界生成；ship 的围墙就是船壳与首尾舱壁） */
export function arenaWalls(bounds: MapBounds): BoxObstacle[] {
  const wh = CONFIG.arena.wallHeight;
  return [
    { pos: v3(0, 0, -bounds.halfZ), half: v3(bounds.halfX + 1, wh / 2, 0.5), kind: 'wall' },
    { pos: v3(0, 0, bounds.halfZ), half: v3(bounds.halfX + 1, wh / 2, 0.5), kind: 'wall' },
    { pos: v3(-bounds.halfX, 0, 0), half: v3(0.5, wh / 2, bounds.halfZ + 1), kind: 'wall' },
    { pos: v3(bounds.halfX, 0, 0), half: v3(0.5, wh / 2, bounds.halfZ + 1), kind: 'wall' },
  ];
}

/** 点到最近障碍的距离（XZ 平面，yaw 感知的 AABB 近似）—— 用于出生点挑选 */
function clearanceXZ(p: Vec3, boxes: BoxObstacle[]): number {
  let best = Infinity;
  for (const b of boxes) {
    const { hx, hz } = boxAabbHalf(b);
    const dx = Math.max(Math.abs(p.x - b.pos.x) - hx, 0);
    const dz = Math.max(Math.abs(p.z - b.pos.z) - hz, 0);
    best = Math.min(best, Math.hypot(dx, dz));
  }
  return best;
}

/**
 * 挑一个出生点：距玩家足够远（避免贴脸刷怪）、离掩体有余量、在场内且真的站得下。
 * 运输船是窄长甲板，环形采样会被夹出船舷 → 改为界内均匀采样 + 站立空间校验。
 */
export function pickSpawnPoint(
  rand: () => number,
  playerPos: Vec3,
  boxes: BoxObstacle[],
  bounds: MapBounds,
  minDistFromPlayer = 14,
): Vec3 {
  const { spawnMinDist, spawnMaxDist } = CONFIG.wave;
  for (let i = 0; i < 32; i++) {
    const x = (rand() * 2 - 1) * (bounds.halfX - 1.2);
    const z = (rand() * 2 - 1) * (bounds.halfZ - 1.6);
    const p = v3(x, 0, z);
    if (clearanceXZ(p, boxes) < 1.4) continue;
    if (columnBlocked(p.x, p.z, 0.05, 1.8, boxes, 0.45)) continue;
    const d = Math.hypot(p.x - playerPos.x, p.z - playerPos.z);
    if (d < Math.min(minDistFromPlayer, spawnMinDist)) continue;
    if (d > spawnMaxDist + 6) continue;
    return p;
  }
  // 放松约束重采样：忽略距离，只保证「在界内且没有嵌进实体」。
  // ⚠️ 绝不能退化成「把点硬塞进任意位置」——嵌进集装箱里的敌人永远动不了，
  //    波次永远清不完（实测 seed5 卡在第 2 波 470 秒就是这个原因）。
  for (let i = 0; i < 48; i++) {
    const x = (rand() * 2 - 1) * (bounds.halfX - 1.2);
    const z = (rand() * 2 - 1) * (bounds.halfZ - 1.6);
    if (columnBlocked(x, z, 0.05, 1.8, boxes, 0.45)) continue;
    return v3(x, 0, z);
  }
  // 最终兜底：船舱中轴（x=0 的门洞通道永远无遮挡）
  const zSide = playerPos.z >= 0 ? -1 : 1;
  return v3(0, 0, zSide * (bounds.halfZ - 4));
}

/** 玩家出生点（生存模式：甲板中央，V 形箱之间的空地） */
export const PLAYER_SPAWN: Vec3 = v3(0, 0, 0);
