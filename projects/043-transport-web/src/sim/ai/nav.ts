/**
 * 导航网格 —— 移植自 043 cf-transport-ship 的 buildNav（栅格采样可站立面 + 连边 + BFS）。
 *
 * 与 043 的两点关键差异：
 *   1. 043 依赖自家 OBB 碰撞世界的查询接口；这里全部改用 sim/arena.ts 的
 *      旋转盒几何工具（pointInBoxXZ / columnBlocked / supportTop），零物理依赖，
 *      构造期纯函数跑一次即可，bot 跑分同样可用。
 *   2. 产出的路径由 combatant.ts 的行为逻辑消费（无视线 / 掩体 / 占点推进时走路径点）。
 *
 * 确定性：采样网格、连边规则、BFS 全部无随机 —— 同地图产出同一张网格。
 */
import type { BoxObstacle, MapBounds } from '../arena';
import { boxTop, columnBlocked, pointInBoxXZ, supportTop } from '../arena';
import type { Vec3 } from '../types';

interface NavNode {
  x: number;
  y: number;
  z: number;
  links: number[];
  /** 跳跃边标记（上行高差 > 0.6 的边，bot 走这条边需要起跳） */
  jump: Set<number>;
  comp: number;
}

const STEP = 2.0; // 采样步长（043 用 2.2；甲板窄，取 2.0 提高分辨率）
const R = 0.45; // 采样点半径（人体近似）
const H = 1.75; // 采样点身高
/** 平地连边最大水平距离 */
const LINK_DIST = 3.2;
/** 跳跃上行边：高差 (0.6, 1.45]，水平距离 < 2.6（玩家跳跃高度 ≈ 1.29m） */
const JUMP_UP = { min: 0.6, max: 1.45, dist: 2.6 };
/** 跳落下行边：高差 [-2.8, -0.6)，水平距离 < 3.0 */
const DROP_DOWN = { min: -2.8, max: -0.6, dist: 3.0 };

export class NavGrid {
  readonly nodes: NavNode[] = [];

  constructor(boxes: BoxObstacle[], bounds: MapBounds) {
    this.sample(boxes, bounds);
    this.link(boxes);
    this.labelComponents();
  }

  /** 采样可站立面：每个格点尝试「甲板 0」与「附近盒子的顶面」两个高度 */
  private sample(boxes: BoxObstacle[], bounds: MapBounds): void {
    const seen = new Set<string>();
    const tryAdd = (x: number, z: number, top: number): void => {
      if (top < -0.5 || top > 9) return;
      const y = top + 0.02;
      // 身体被墙/箱卡住 → 站不了
      if (columnBlocked(x, z, y, H, boxes, R)) return;
      // 支撑面必须是「恰好这个高度」（防止悬空 / 嵌进台面）
      const sy = supportTop(x, z, boxes, top + 0.5);
      if (Math.abs(sy - top) > 0.15) return;
      const key = `${Math.round(x * 5)}_${Math.round(z * 5)}_${Math.round(top * 10)}`;
      if (seen.has(key)) return;
      seen.add(key);
      this.nodes.push({ x, y, z, links: [], jump: new Set(), comp: -1 });
    };

    const x0 = -bounds.halfX + 0.8;
    const x1 = bounds.halfX - 0.4;
    const z0 = -bounds.halfZ + 0.9;
    const z1 = bounds.halfZ - 0.9;
    for (let x = x0; x <= x1; x += STEP) {
      for (let z = z0; z <= z1; z += STEP) {
        // 甲板面
        tryAdd(x, z, 0);
        // 附近盒子的顶面（集装箱顶、木箱塔、驾驶舱顶……）
        for (const b of boxes) {
          if (b.kind === 'wall' || b.kind === 'pipe') continue;
          const t = boxTop(b);
          if (t < 0.5 || t > 6) continue;
          if (!pointInBoxXZ(x, z, b, 0.3)) continue;
          tryAdd(x, z, t);
        }
      }
    }
  }

  /** 连边：平地互连 + 可跳上行 + 可落下行；中点被挡则不连 */
  private link(boxes: BoxObstacle[]): void {
    const n = this.nodes.length;
    for (let i = 0; i < n; i++) {
      const a = this.nodes[i]!;
      for (let j = i + 1; j < n; j++) {
        const b = this.nodes[j]!;
        const dx = a.x - b.x;
        const dz = a.z - b.z;
        const dy = b.y - a.y;
        const d2 = dx * dx + dz * dz;
        if (Math.abs(dy) < 0.6) {
          if (d2 > LINK_DIST * LINK_DIST) continue;
          const mx = (a.x + b.x) / 2;
          const mz = (a.z + b.z) / 2;
          if (columnBlocked(mx, mz, a.y + 0.02, H, boxes, R * 0.6)) continue;
          a.links.push(j);
          b.links.push(i);
        } else if (dy >= JUMP_UP.min && dy <= JUMP_UP.max && d2 < JUMP_UP.dist * JUMP_UP.dist) {
          a.links.push(j);
          b.links.push(i);
          a.jump.add(j);
        } else if (dy <= DROP_DOWN.max && dy > DROP_DOWN.min && d2 < DROP_DOWN.dist * DROP_DOWN.dist) {
          // 大落差边与 043 一致保持双向（下行即跳落；上行方向 KCC 上不去会触发受阻绕行）
          a.links.push(j);
          b.links.push(i);
        }
      }
    }
  }

  /** 连通块编号：保证给出的路径确实可达（不同块之间 BFS 自然失败） */
  private labelComponents(): void {
    let comp = 0;
    const stack: number[] = [];
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i]!.comp >= 0) continue;
      this.nodes[i]!.comp = comp;
      stack.push(i);
      while (stack.length) {
        const cur = stack.pop()!;
        for (const k of this.nodes[cur]!.links) {
          if (this.nodes[k]!.comp < 0) {
            this.nodes[k]!.comp = comp;
            stack.push(k);
          }
        }
      }
      comp++;
    }
  }

  /** 距 (x,z) 最近的导航节点（XZ 平面）；没有节点返回 -1 */
  private nearest(x: number, z: number): number {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i]!;
      const d = (n.x - x) * (n.x - x) + (n.z - z) * (n.z - z);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  /**
   * 卡死软复位用：找 (x,z) 附近一个「确实错开」的可站立节点。
   * maxDist 内、距当前位置至少 minShift 米；找不到返回 null（调用方原地不动）。
   */
  nearestFreeNode(x: number, z: number, maxDist: number, minShift: number): Vec3 | null {
    let best: Vec3 | null = null;
    let bestD = Infinity;
    for (const n of this.nodes) {
      const d = Math.hypot(n.x - x, n.z - z);
      if (d < minShift || d > maxDist) continue;
      if (d < bestD) {
        bestD = d;
        best = { x: n.x, y: n.y, z: n.z };
      }
    }
    return best;
  }

  /**
   * BFS 寻路：from → to 的世界坐标路径点序列（不含起点，含终点附近的节点）。
   * 不可达（不同连通块）返回 null；调用方退回直线移动 + 受阻绕行。
   */
  findPath(from: Vec3, to: Vec3): Vec3[] | null {
    const s = this.nearest(from.x, from.z);
    const t = this.nearest(to.x, to.z);
    if (s < 0 || t < 0) return null;
    if (s === t) return [{ x: this.nodes[t]!.x, y: this.nodes[t]!.y, z: this.nodes[t]!.z }];
    if (this.nodes[s]!.comp !== this.nodes[t]!.comp) return null;

    const prev = new Int32Array(this.nodes.length).fill(-1);
    const visited = new Uint8Array(this.nodes.length);
    const queue: number[] = [s];
    visited[s] = 1;
    let head = 0;
    while (head < queue.length) {
      const cur = queue[head++]!;
      if (cur === t) break;
      for (const k of this.nodes[cur]!.links) {
        if (!visited[k]) {
          visited[k] = 1;
          prev[k] = cur;
          queue.push(k);
        }
      }
    }
    if (!visited[t]) return null;

    const path: Vec3[] = [];
    let cur = t;
    while (cur !== s && cur >= 0) {
      const n = this.nodes[cur]!;
      path.push({ x: n.x, y: n.y, z: n.z });
      cur = prev[cur]!;
    }
    path.reverse();
    return path;
  }
}
