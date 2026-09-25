/**
 * 场地静态几何 + 出生点。
 *
 * 坐标约定：+X = 敌方球门（玩家进攻方向），-X = 己方球门。沿 Z 为宽度。
 * 围板比球门高 → 球不会飞出场外（省掉界外球规则，M1 用「场地围栏」而非边线）。
 */
import { CONFIG } from '../core/config';
import type { Vec3 } from './types';

export interface BoxObstacle {
  pos: Vec3;
  half: Vec3;
}

const P = CONFIG.pitch;

/** 生成所有静态围墙 + 球门网的碰撞体盒 */
export function pitchWalls(): BoxObstacle[] {
  const L = P.halfLength;
  const W = P.halfWidth;
  const H = P.wallHeight;
  const gw = P.goalWidth / 2;
  const gh = P.goalHeight;
  const gd = P.goalDepth;
  const t = 0.3; // 墙厚半径
  const out: BoxObstacle[] = [];

  const wall = (pos: Vec3, half: Vec3): void => {
    out.push({ pos, half });
  };

  // 两侧边线围板（延伸到球门纵深之外）
  wall({ x: 0, y: H / 2, z: W }, { x: L + gd, y: H / 2, z: t });
  wall({ x: 0, y: H / 2, z: -W }, { x: L + gd, y: H / 2, z: t });

  for (const sx of [1, -1] as const) {
    const x = sx * L;
    // 底线段（z 从 gw 到 W）
    wall({ x, y: H / 2, z: (gw + W) / 2 }, { x: t, y: H / 2, z: (W - gw) / 2 });
    wall({ x, y: H / 2, z: -(gw + W) / 2 }, { x: t, y: H / 2, z: (W - gw) / 2 });
    // 门楣（球门上方到围板顶）
    wall({ x, y: (gh + H) / 2, z: 0 }, { x: t, y: (H - gh) / 2, z: gw });
    // 球门网：后壁 + 两侧壁
    // 侧壁必须放在 |z| = gw 之外（中心 gw+t，半厚 t），内表面才正好落在门柱线上。
    // 若中心直接取 gw，内表面会落到 gw-t = 3.2 —— 向门内凸进 0.3m，
    // 射向门柱内侧的球会在门线上被这块网壁挡住
    // （实测 35 次进攻里大量射门停在 x=-21.8、|z|=3.0~3.1，即贴柱内侧被挡）。
    wall({ x: sx * (L + gd), y: gh / 2, z: 0 }, { x: t, y: gh / 2, z: gw + t });
    wall({ x: sx * (L + gd / 2), y: gh / 2, z: gw + t }, { x: gd / 2, y: gh / 2, z: t });
    wall({ x: sx * (L + gd / 2), y: gh / 2, z: -(gw + t) }, { x: gd / 2, y: gh / 2, z: t });
  }

  return out;
}

/** 球门柱位置（渲染用） */
export function goalPosts(sx: 1 | -1): { x: number; z: number }[] {
  const gw = P.goalWidth / 2;
  return [
    { x: sx * P.halfLength, z: gw },
    { x: sx * P.halfLength, z: -gw },
  ];
}

/** 该点是否落在某侧球门内（进球判定） */
export function inGoal(p: Vec3, sx: 1 | -1): boolean {
  return (
    sx * p.x > P.halfLength &&
    Math.abs(p.z) < P.goalWidth / 2 &&
    p.y < P.goalHeight
  );
}

export const SPAWNS = {
  ball: { x: 0, y: CONFIG.ball.radius, z: 0 } as Vec3,
  player: { x: -6, y: 0, z: 0 } as Vec3,
  redStriker: { x: 6, y: 0, z: 0 } as Vec3,
  redKeeper: { x: P.halfLength - CONFIG.ai.keeperDepth, y: 0, z: 0 } as Vec3,
  /** 蓝队（玩家方）守门员，守住 -X 球门 —— 双方对称，否则玩家吃亏 */
  blueKeeper: { x: -(P.halfLength - CONFIG.ai.keeperDepth), y: 0, z: 0 } as Vec3,
  /** 开球时球员站位（玩家在左，红方在右） */
  kickoffBlue: { x: -6, y: 0, z: 0 } as Vec3,
  kickoffRed: { x: 6, y: 0, z: 0 } as Vec3,
};
