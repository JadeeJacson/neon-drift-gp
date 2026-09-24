/**
 * 赛道：控制点 → Catmull-Rom 闭合样条 → 中心线采样 → 路面分段 + 检查点。
 *
 * 物理路面在 race.ts 中用**连续 trimesh**（顶点相邻段共享，无接缝、无棱，消除分段
 * cuboid 在弯道处翘起的弹跳问题）；护栏在 race.ts 中是压低的路肩 cuboid。
 * 视觉上用连续 ribbon mesh，因此看起来仍是平滑路面。
 */

export type TrackTheme = 'dawn' | 'canyon' | 'coast' | 'neon' | 'storm';

export interface TrackDef {
  id: string;
  name: string;
  theme: TrackTheme;
  /** 中心线控制点（XZ 平面），按序连接成闭合回路 */
  points: Array<[number, number]>;
  /** 每个控制点的路面高度（可选，缺省 0） */
  hills?: number[];
  width: number;
  /** 路面摩擦（越低越滑） */
  friction: number;
  laps: number;
  /** 一句话性格描述（选关界面显示） */
  desc: string;
}

export const TRACKS: TrackDef[] = [
  {
    id: 'dawn_boulevard', name: '晨曦大道', theme: 'dawn',
    points: [
      [90, 0], [64, 42], [0, 60], [-64, 42], [-90, 0], [-64, -42], [0, -60], [64, -42],
    ],
    width: 16, friction: 1.95, laps: 3,
    desc: '宽阔的高速环道，缓弯为主。适合熟悉油门与刹车点。',
  },
  {
    id: 'canyon_run', name: '峡谷疾行', theme: 'canyon',
    points: [
      [0, -50], [50, -40], [82, -5], [70, 40], [30, 68], [-20, 62], [-58, 38], [-74, -8], [-40, -38],
    ],
    width: 11.5, friction: 1.72, laps: 3,
    desc: '窄路急弯，两侧岩壁。转向要提前，油门要克制。',
  },
  {
    id: 'sunset_coast', name: '落日海岸', theme: 'coast',
    points: [
      [-130, -55], [-40, -72], [60, -62], [126, -30], [132, 20], [86, 56], [10, 62], [-58, 40], [-116, 6],
    ],
    width: 15, friction: 1.82, laps: 3,
    desc: '长直道接发卡弯。直道尽头重刹，弯心晚给油。',
  },
  {
    id: 'neon_city', name: '霓虹环线', theme: 'neon',
    points: [
      [-100, -40], [-46, -74], [26, -58], [72, -12], [46, 42], [-16, 64], [-74, 40], [-108, -4],
    ],
    width: 13, friction: 1.78, laps: 3,
    desc: '连续 S 弯，节奏密集。重心转移比刹车更重要。',
  },
  {
    id: 'storm_peak', name: '风暴之巅', theme: 'storm',
    points: [
      [-92, -48], [-30, -82], [52, -62], [92, 4], [58, 72], [-12, 92], [-72, 58], [-112, 12],
    ],
    hills: [0, 4, 9, 7, 2, 6, 11, 5],
    width: 12.5, friction: 1.38, laps: 3,
    desc: '高低起伏 + 低摩擦路面。终极赛道：慢进快出，别贪油门。',
  },
];

export function trackById(id: string): TrackDef {
  return TRACKS.find((t) => t.id === id) ?? TRACKS[0]!;
}

// ---------------- 几何 ----------------

export interface Vec3 { x: number; y: number; z: number }

export interface TrackSegment {
  /** 段中心 */
  center: Vec3;
  /** 段长度（沿中心线） */
  length: number;
  /** 段朝向（yaw，弧度） */
  yaw: number;
  /** 坡度（pitch，弧度） */
  pitch: number;
  /** 该段中心线的切线（单位向量，含高度分量） */
  tangent: Vec3;
  /** 法线（水平面内垂直于切线的单位向量） */
  normal: Vec3;
}

export interface Checkpoint {
  index: number;
  center: Vec3;
  /** 沿中心线的弧长参数（0-1） */
  t: number;
}

export interface TrackGeometry {
  def: TrackDef;
  /** 采样后的中心线（闭合，长度 = segments） */
  centerline: Vec3[];
  /** 每段的长度/朝向等信息 */
  segments: TrackSegment[];
  /** 总长度（米） */
  length: number;
  /** 检查点（含起跑线 index 0） */
  checkpoints: Checkpoint[];
  /** 起跑格位置与朝向（2 个并排） */
  grid: Array<{ pos: Vec3; yaw: number }>;
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

/** 生成闭合样条上的采样点（XZ 由控制点插值，Y 由 hills 插值） */
export function buildCenterline(def: TrackDef, samples: number): Vec3[] {
  const pts = def.points;
  const n = pts.length;
  const hills = def.hills ?? pts.map(() => 0);
  const out: Vec3[] = [];
  for (let i = 0; i < samples; i++) {
    const u = (i / samples) * n;
    const seg = Math.floor(u);
    const t = u - seg;
    const i0 = (seg - 1 + n) % n;
    const i1 = seg % n;
    const i2 = (seg + 1) % n;
    const i3 = (seg + 2) % n;
    const p0 = pts[i0]!, p1 = pts[i1]!, p2 = pts[i2]!, p3 = pts[i3]!;
    const h0 = hills[i0]!, h1 = hills[i1]!, h2 = hills[i2]!, h3 = hills[i3]!;
    out.push({
      x: catmullRom(p0[0], p1[0], p2[0], p3[0], t),
      y: catmullRom(h0, h1, h2, h3, t),
      z: catmullRom(p0[1], p1[1], p2[1], p3[1], t),
    });
  }
  return out;
}

export function buildTrack(def: TrackDef, segments = 72): TrackGeometry {
  const centerline = buildCenterline(def, segments);
  const segs: TrackSegment[] = [];
  let length = 0;

  for (let i = 0; i < centerline.length; i++) {
    const a = centerline[i]!;
    const b = centerline[(i + 1) % centerline.length]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    const horiz = Math.hypot(dx, dz);
    const len = Math.hypot(horiz, dy);
    const yaw = Math.atan2(dx, dz);
    const pitch = -Math.atan2(dy, horiz);
    // 水平面内的单位切线与法线（法线 = 切线绕 Y 转 90°）
    const tanLen = Math.max(1e-6, len);
    const tangent = { x: dx / tanLen, y: dy / tanLen, z: dz / tanLen };
    const nl = Math.max(1e-6, Math.hypot(-dz, dx));
    const normal = { x: -dz / nl, y: 0, z: dx / nl };
    segs.push({
      center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 },
      length: len,
      yaw,
      pitch,
      tangent,
      normal,
    });
    length += len;
  }

  // 检查点：均匀取 8 个（含起跑线）
  const cpCount = 8;
  const checkpoints: Checkpoint[] = [];
  for (let k = 0; k < cpCount; k++) {
    const idx = Math.round((k / cpCount) * segments) % segments;
    const p = centerline[idx]!;
    checkpoints.push({ index: k, center: { ...p }, t: idx / segments });
  }

  // 起跑格：起跑线（第 0 段）后方，两车并排
  const startSeg = segs[0]!;
  const grid: Array<{ pos: Vec3; yaw: number }> = [];
  for (let i = 0; i < 2; i++) {
    const back = 6 + i * 7;
    const side = (i === 0 ? 1 : -1) * (def.width * 0.22);
    grid.push({
      pos: {
        x: startSeg.center.x - startSeg.tangent.x * back + startSeg.normal.x * side,
        y: startSeg.center.y + 1.6,
        z: startSeg.center.z - startSeg.tangent.z * back + startSeg.normal.z * side,
      },
      yaw: startSeg.yaw,
    });
  }

  return { def, centerline, segments: segs, length, checkpoints, grid };
}

/** 最近中心线索引（用于进度、AI 追踪、重置） */
export function nearestIndex(geo: TrackGeometry, pos: Vec3, hint = -1): number {
  const cl = geo.centerline;
  // 有 hint 时只在附近搜索（每帧调用，避免全量扫描）
  const range = hint >= 0 ? 14 : cl.length;
  let best = hint >= 0 ? hint : 0;
  let bestD = Infinity;
  for (let k = 0; k < range; k++) {
    const i = hint >= 0 ? (hint + k) % cl.length : k;
    const p = cl[i]!;
    const d = (p.x - pos.x) ** 2 + (p.z - pos.z) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

/** 当前弧长进度（0-1） */
export function progressAt(geo: TrackGeometry, index: number): number {
  return index / geo.centerline.length;
}
