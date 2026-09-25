/**
 * bot 策略 —— 「会踢球的玩家」的模拟，供 bot-run.ts（跑分）与 dbg.ts（诊断）共用。
 *
 * 为什么单独一个文件：bot 是**测试基准**，它和 AI 用同一套寻路（seekBehind）才有意义。
 * 曾经 bot-run.ts 与 dbg.ts 各写一份，改了一边没改另一边，导致诊断结果与跑分结果对不上。
 *
 * 玩家与 AI 的关键差异：玩家的踢球方向 = **朝向**（AI 的踢球方向由「球 → 目标」算出，与站位无关）。
 * 所以 bot 必须先站到球后、面朝球门才能射门。
 */
import { CONFIG } from '../src/core/config';
import type { GameSim } from '../src/sim/game';
import type { GameInput } from '../src/sim/types';
import { seekBehind } from '../src/sim/ai';
import { aimAngles, distXZ, v3 } from '../src/sim/vecmath';

const DT = CONFIG.physics.fixedDt;
const P = CONFIG.pitch;

export interface BotState {
  chargeT: number;
  pushing: boolean;
}

export function newBotState(): BotState {
  return { chargeT: 0, pushing: false };
}

/** 会踢球的 bot：绕到球后方 → 朝球门远角推进 → 进入射程蓄力射门 */
export function driveBot(sim: GameSim, input: GameInput, st: BotState): void {
  const self = sim.player.pos();
  const bp = sim.ball.pos();
  input.pitch = 0;

  // 打对方守门员的反侧远角
  const rk = sim.actorViews().find((a) => a.team === 'red' && a.role === 'keeper');
  const cornerZ = (rk?.pos.z ?? 0) >= 0 ? -2.9 : 2.9;
  const goal = v3(P.halfLength, 0, cornerZ);

  const seek = seekBehind(self, bp, goal, 0.75);
  const dBall = distXZ(self, bp);

  // 退化模式：绕后点在场外（球贴底线/边线）→ 直接逼近球。
  // 玩家踢球方向 = 朝向，所以要先进「近距豁免」范围（<0.95 时任意方向可踢），
  // 再转身面向球门远角射门。
  if (seek.fallback) {
    st.pushing = false;
    if (dBall > 0.85) {
      const aim = aimAngles(self, bp);
      input.yaw = aim.yaw;
      input.forward = 1;
      input.sprint = dBall > 6;
      input.kick = false;
      st.chargeT = 0;
      return;
    }
    const ga = aimAngles(self, goal);
    input.yaw = ga.yaw;
    input.forward = 0;
    input.sprint = false;
    st.chargeT += DT;
    input.kick = st.chargeT < 0.45;
    if (st.chargeT >= 0.5) st.chargeT = 0;
    return;
  }

  // 迟滞状态机：站到球的进攻侧后方且够近 → 进入推进；球跑远（丢球）→ 回到绕后。
  // 判据用「侧别 + 距离」而不是「到达某个点」—— 绕后点会随球移动，
  // 追一个会跑的点会让 bot 永远进不了推进态（实测全场 0 次踢球）。
  if (!st.pushing && seek.aligned && dBall < 1.5) st.pushing = true;
  if (st.pushing && dBall > 2.6) st.pushing = false;

  // 1. 绕到球的进攻侧后方（含避球切向航点）
  if (!st.pushing) {
    const aim = aimAngles(self, seek.point);
    input.yaw = aim.yaw;
    input.forward = 1;
    input.sprint = seek.dist > 4;
    input.kick = false;
    st.chargeT = 0;
    return;
  }

  // 2. 已在球后：朝球门远角推进
  const ga = aimAngles(self, goal);
  input.yaw = ga.yaw;
  input.sprint = false;
  const distToGoal = Math.hypot(P.halfLength - self.x, self.z);
  if (distToGoal > 11) {
    // 离球门还远 → 球在脚下就定期往前开一脚，然后追。
    // 不能一路闷头带球：开球瞬间双方同时扑向中圈的球，球会被两人夹住，
    // 带球者反而被挤开、球权易手（实测 bot 只在中圈带球，全场 0 次踢球）。
    // 真人玩家在这时就是直接开一脚，这里照做。
    input.forward = 1;
    input.sprint = dBall > 3;
    if (dBall < 1.3) {
      st.chargeT += DT;
      input.kick = st.chargeT < 0.2; // 轻触式推进，不是全力射门
      if (st.chargeT >= 0.25) st.chargeT = 0;
    } else {
      input.kick = false;
      st.chargeT = 0;
    }
    return;
  }

  // 3. 进入射程：蓄力 → 松开
  input.forward = 0.4;
  st.chargeT += DT;
  if (st.chargeT < 0.4) {
    input.kick = true;
  } else {
    input.kick = false;
    st.chargeT = 0;
  }
}
