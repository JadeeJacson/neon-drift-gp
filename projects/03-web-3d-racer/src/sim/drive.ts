/**
 * 驾驶输入：玩家键盘、AI、回放序列三者的统一接口。
 * 数值约定：throttle/brake ∈ [0,1]，steer ∈ [-1,1]（1 = 左满舵）。
 */
export interface DriveInput {
  throttle: number;
  brake: number;
  steer: number;
  handbrake: boolean;
  /** 倒车档（仅玩家低速按 S 时设 true；AI 永远 false） */
  reverse?: boolean;
}

export const NEUTRAL: DriveInput = { throttle: 0, brake: 0, steer: 0, handbrake: false };

export function clampInput(i: DriveInput): DriveInput {
  return {
    throttle: Math.max(0, Math.min(1, i.throttle)),
    brake: Math.max(0, Math.min(1, i.brake)),
    steer: Math.max(-1, Math.min(1, i.steer)),
    handbrake: !!i.handbrake,
  };
}

/** 一条固定输入序列（确定性回放用） */
export type InputSeq = DriveInput[];

export function emptySeq(steps: number): InputSeq {
  return Array.from({ length: steps }, () => ({ ...NEUTRAL }));
}
