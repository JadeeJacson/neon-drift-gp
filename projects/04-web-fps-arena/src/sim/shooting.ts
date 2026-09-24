/**
 * 射线命中判定（hitscan）。
 *
 * 两条实测得出的硬约束（2026-09-24 探针 _tmp/fps-probe/probe.mjs）：
 *   1. 必须排除射手自身碰撞体：眼高在胶囊内部，不排除则每发都 t=0 命中自己
 *   2. Rapier 0.20 的命中距离字段是 timeOfImpact（不是旧版的 toi）
 */
import RAPIER from '@dimforge/rapier3d-compat';
import type { WeaponDef } from '../core/config';
import type { Vec3 } from './types';
import { add, cross, normalize, scale } from './vecmath';
import { discPoint } from './rng';

export interface RayHit {
  colliderHandle: number;
  t: number;
  point: Vec3;
}

export function castRay(
  world: RAPIER.World,
  origin: Vec3,
  dir: Vec3,
  maxToi: number,
  excludeCollider?: RAPIER.Collider,
  excludeBody?: RAPIER.RigidBody,
): RayHit | null {
  const ray = new RAPIER.Ray(origin, dir);
  const hit = world.castRay(ray, maxToi, true, undefined, undefined, excludeCollider, excludeBody);
  if (!hit) return null;
  return {
    colliderHandle: hit.collider.handle,
    t: hit.timeOfImpact,
    point: add(origin, scale(dir, hit.timeOfImpact)),
  };
}

/**
 * 两点之间是否通视。
 *
 * ⚠️ 必须传 targetHandle：射线终点就是目标中心，射线必然先命中目标自己的表面
 * （t ≈ dist − 半径）。只用「命中距离是否够远」来判断会把目标本身当成遮挡物，
 * 结果就是永远判定无视线 —— 敌人不开火、bot 不开枪，双方干瞪眼。
 *
 * @param targetHandle 目标碰撞体 handle；命中它即视为通视
 */
export function hasLineOfSight(
  world: RAPIER.World,
  from: Vec3,
  to: Vec3,
  selfCollider?: RAPIER.Collider,
  selfBody?: RAPIER.RigidBody,
  targetHandle?: number,
): boolean {
  const d = { x: to.x - from.x, y: to.y - from.y, z: to.z - from.z };
  const dist = Math.hypot(d.x, d.y, d.z);
  if (dist < 1e-6) return true;
  const dir = scale(d, 1 / dist);
  const hit = castRay(world, from, dir, dist, selfCollider, selfBody);
  if (!hit) return true;
  if (targetHandle !== undefined) return hit.colliderHandle === targetHandle;
  // 没有给目标时退化处理：命中点离目标足够近就算通视
  return hit.t >= dist - 0.6;
}

/** 在 dir 周围按半角 spread 随机偏转 —— 枪械散布 */
export function spreadDir(dir: Vec3, spread: number, rand: () => number): Vec3 {
  if (spread <= 1e-6) return dir;
  const { x, y } = discPoint(rand);
  const upRef: Vec3 = Math.abs(dir.y) > 0.95 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
  const right = normalize(cross(dir, upRef));
  const up = cross(right, dir);
  const off = {
    x: right.x * x * spread + up.x * y * spread,
    y: right.y * x * spread + up.y * y * spread,
    z: right.z * x * spread + up.z * y * spread,
  };
  return normalize(add(dir, off));
}

/** 距离衰减系数 */
export function falloffMul(def: WeaponDef, distance: number): number {
  if (distance <= def.falloffStart) return 1;
  if (distance >= def.falloffEnd) return def.falloffMin;
  const t = (distance - def.falloffStart) / (def.falloffEnd - def.falloffStart);
  return 1 + (def.falloffMin - 1) * t;
}
