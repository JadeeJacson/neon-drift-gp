/**
 * AI 对手：前瞻点追踪（pure pursuit）+ 曲率减速。
 *
 * 关键约束：AI 与玩家用**同一套车辆物理**（同样是 Rapier 车辆控制器、同样的力与转向接口），
 * 强度差异只来自 config.ai 的系数——保证"对手不作弊"，也让机器人跑圈验证对两者都成立。
 *
 * 过弯减速采用物理模型而非经验值：
 *   采样前方一段弧长上的累计转角 → 平均转弯半径 R = 弧长 / 转角；
 *   安全过弯速度 v = √(μ·R)（μ = latGrip），再乘裕度。
 * 这样无论赛道大小，AI 都会按抓地极限留余量减速，不会高速冲出弯道撞护栏。
 */
import { CONFIG } from '../core/config';
import type { DriveInput } from './drive';
import type { RaceState, RacerState } from './race';
import type { Vec3 } from './vehicle';

function wrapAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

function headingBetween(a: Vec3, b: Vec3): number {
  return Math.atan2(b.x - a.x, b.z - a.z);
}

export function aiInput(rs: RaceState, r: RacerState): DriveInput {
  const A = CONFIG.ai;
  const cl = rs.geo.centerline;
  const n = cl.length;
  const segLen = rs.geo.length / n;

  // 前瞻目标点（米 → 段数，赛道尺寸无关）
  const aheadIdx = Math.max(2, Math.round(A.lookAhead / segLen));
  const target = cl[(r.hintIndex + aheadIdx) % n]!;
  const pos: Vec3 = r.vehicle.pos();

  const desired = Math.atan2(target.x - pos.x, target.z - pos.z);
  const diff = wrapAngle(desired - r.vehicle.heading());

  // 前瞻窗口内取「最急的单段曲率」→ 最小转弯半径 → 安全过弯速度（为最急处留余量，
  // 而非平均半径，避免急弯被拉平后过估半径、过高速冲弯侧翻）
  const L = A.lookAhead * 2;
  const samples = Math.max(2, Math.round(L / segLen));
  let maxCurv = 0;
  for (let k = 1; k <= samples; k++) {
    const i0 = (r.hintIndex + k - 1) % n;
    const i1 = (r.hintIndex + k) % n;
    const h0 = headingBetween(cl[(i0 - 1 + n) % n]!, cl[i0]!);
    const h1 = headingBetween(cl[i0]!, cl[i1]!);
    const dA = Math.abs(wrapAngle(h1 - h0));
    const curv = dA / segLen; // 每米转角（曲率）
    if (curv > maxCurv) maxCurv = curv;
  }
  const radius = maxCurv > 1e-4 ? 1 / maxCurv : 1e6;
  const vSafe = Math.sqrt(A.latGrip * radius) * A.cornerMargin;
  const targetSpeed = Math.max(A.minSpeed, Math.min(A.vMax, vSafe));

  const v = r.vehicle.speed();
  let throttle = 0;
  let brake = 0;
  if (v < targetSpeed) throttle = 1;
  else if (v > targetSpeed * 1.06) brake = Math.min(1, (v - targetSpeed) / 6);

  // 大角度差时收油（避免推头冲出赛道）
  if (Math.abs(diff) > 0.7) throttle *= 0.5;

  return {
    throttle,
    brake,
    steer: Math.max(-1, Math.min(1, diff * A.steerGain)),
    handbrake: false,
  };
}
