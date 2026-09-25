import type { Team } from '../core/config';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** 一帧的输入 —— 玩家、bot、AI 三者的统一接口 */
export interface GameInput {
  /** 本地坐标下的移动意图，取值 -1..1 */
  forward: number;
  right: number;
  /** 视角（弧度） */
  yaw: number;
  pitch: number;
  jump: boolean;
  sprint: boolean;
  /** 按住 = 蓄力；松开那一帧触发踢球 */
  kick: boolean;
}

export function emptyInput(): GameInput {
  return { forward: 0, right: 0, yaw: 0, pitch: 0, jump: false, sprint: false, kick: false };
}

/** 踢球者身份 —— 诊断与音效需要区分（同一帧可能多人踢球，靠坐标粗判不可靠） */
export type KickActor = 'player' | 'striker' | 'keeper' | 'blueKeeper';

/** sim 层每帧产出的事件 —— render 与 audio 只消费事件，sim 保持零 DOM / 零 three */
export type SimEvent =
  | { type: 'kick'; pos: Vec3; power: number; actor: KickActor }
  | { type: 'bounce'; pos: Vec3; speed: number }
  | { type: 'goal'; team: Team; scoreBlue: number; scoreRed: number }
  | { type: 'whistle' }
  | { type: 'save'; pos: Vec3 }
  | { type: 'footstep' }
  | { type: 'win'; scoreBlue: number; scoreRed: number; time: number }
  | { type: 'lose'; scoreBlue: number; scoreRed: number; time: number };

/** 渲染层需要的方块人状态（玩家自己第一人称看不到，只渲染 AI） */
export interface ActorView {
  id: number;
  team: Team;
  role: 'striker' | 'keeper';
  /** 胶囊体中心（物理真值）。注意 y 不是脚底 —— 脚底见 footY */
  pos: Vec3;
  /** 模型脚底的世界 y = 胶囊中心 y − (halfHeight + radius)。
   *  渲染模型原点画在脚底，直接用 pos.y 会整体浮空（实测浮空 0.95m）。 */
  footY: number;
  yaw: number;
  /** 踢球动作剩余时间（>0 时抬腿） */
  kickAnim: number;
}

/** 渲染层需要的球状态 */
export interface BallView {
  pos: Vec3;
  /** 球面朝向（Rapier 四元数，供渲染滚转） */
  quat: { x: number; y: number; z: number; w: number };
  speed: number;
}

export interface GameSnapshot {
  phase: 'ready' | 'playing' | 'goal' | 'won' | 'lost';
  time: number;
  scoreBlue: number;
  scoreRed: number;
  goalsToWin: number;
  /** 当前蓄力进度 0..1 */
  charge: number;
  /** 玩家是否在球的触球范围内（HUD 提示可踢） */
  ballInRange: boolean;
  /** 球距玩家的水平距离 */
  ballDist: number;
  /** 上一粒进球方（goal 阶段用于播报） */
  lastScorer: Team | null;
  pos: Vec3;
  yaw: number;
  pitch: number;
  grounded: boolean;
}
