import type { EnemyId, WeaponId } from '../core/config';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** sim 层每帧产出的事件 —— render 与 audio 只消费事件，sim 保持零 DOM / 零 three */
export type SimEvent =
  /** len：曳光长度（真实命中距离；未命中则画到半程） */
  | { type: 'shot'; weapon: WeaponId; origin: Vec3; dir: Vec3; pellets: number; len: number }
  | { type: 'hit'; point: Vec3; enemyId: number; headshot: boolean; damage: number; killed: boolean }
  | { type: 'kill'; point: Vec3; enemyId: number; kind: EnemyId; elite: boolean }
  | { type: 'miss'; point: Vec3 }
  | { type: 'reloadStart'; weapon: WeaponId }
  | { type: 'reloadEnd'; weapon: WeaponId }
  | { type: 'empty'; weapon: WeaponId }
  | { type: 'switch'; weapon: WeaponId }
  | { type: 'playerHurt'; amount: number; from: Vec3; hp: number }
  | { type: 'enemyShot'; kind: EnemyId; origin: Vec3; dir: Vec3 }
  | { type: 'waveStart'; wave: number; total: number }
  | { type: 'waveClear'; wave: number; nextIn: number }
  | { type: 'win'; totalShots: number; hits: number; headshots: number; kills: number; time: number }
  | { type: 'lose'; wave: number; kills: number; time: number }
  | { type: 'footstep'; speed: number };

/** 一帧的输入 —— 玩家、bot、回放三者的统一接口 */
export interface GameInput {
  /** 本地坐标下的移动意图，取值 -1..1（forward / right） */
  forward: number;
  right: number;
  /** 视角（弧度） */
  yaw: number;
  pitch: number;
  fire: boolean;
  reload: boolean;
  jump: boolean;
  sprint: boolean;
  /** 切枪请求：0/1/2 或 null */
  slot: number | null;
}

export function emptyInput(): GameInput {
  return {
    forward: 0,
    right: 0,
    yaw: 0,
    pitch: 0,
    fire: false,
    reload: false,
    jump: false,
    sprint: false,
    slot: null,
  };
}

/** 渲染层需要的敌人状态 */
export interface EnemyView {
  id: number;
  kind: EnemyId;
  elite: boolean;
  /** 命中体 handle —— bot 与 HUD 判定视线时要用 */
  colliderHandle: number;
  pos: Vec3;
  yaw: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  /** 死亡后的消散进度 0..1 */
  fade: number;
  /** 出手预警进度 0..1（>0 时渲染指示线） */
  windup: number;
  /** 受击闪白剩余时间 */
  flash: number;
  scale: number;
}

export interface GameSnapshot {
  phase: 'ready' | 'playing' | 'won' | 'lost';
  time: number;
  hp: number;
  maxHp: number;
  wave: number;
  waveTotal: number;
  enemiesAlive: number;
  enemiesRemaining: number;
  weapon: WeaponId;
  slot: number;
  ammo: number;
  magazine: number;
  reloading: boolean;
  reloadProgress: number;
  spread: number;
  shots: number;
  hits: number;
  headshots: number;
  kills: number;
  accuracy: number;
  pos: Vec3;
  yaw: number;
  pitch: number;
  grounded: boolean;
}
