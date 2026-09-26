import type { EnemyId, WeaponId } from '../core/config';
import type RAPIER from '@dimforge/rapier3d-compat';

/** 队伍：蓝队（玩家方）/ 红队（敌方） */
export type Team = 'blue' | 'red';
/** 游戏模式：生存（波次）/ 据点占领（5v5） */
export type GameMode = 'survival' | 'domination';

/**
 * 可被瞄准 / 被命中的「战斗单位」抽象 —— 玩家与 bot 战斗员共用。
 * 射击与 AI 只通过这个接口交互，从而天然支持按队伍过滤（友军不互伤）。
 * sim 层零 three / 零 DOM 的约束同样适用于它：只用纯数据与 Rapier 类型。
 */
export interface CombatantRef {
  readonly team: Team;
  /** 是否为人类玩家（伤害走 player.hurt 而非战斗员 hurt） */
  readonly isPlayer: boolean;
  alive: boolean;
  /** 命中体（射线命中的就是这个） */
  readonly collider: RAPIER.Collider;
  /** 中心位置（胶囊中心） */
  center(): Vec3;
  /** 射击原点（约胸高） */
  eye(): Vec3;
}

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
  | { type: 'kill'; point: Vec3; enemyId: number; kind: EnemyId; elite: boolean;
      /** 击杀者队伍（null = 环境击杀，当前不存在） */
      killerTeam: Team | null;
      /** 是否玩家亲自击杀（killfeed 用） */
      byPlayer: boolean }
  | { type: 'miss'; point: Vec3 }
  | { type: 'reloadStart'; weapon: WeaponId }
  | { type: 'reloadEnd'; weapon: WeaponId }
  | { type: 'empty'; weapon: WeaponId }
  | { type: 'switch'; weapon: WeaponId }
  | { type: 'playerHurt'; amount: number; from: Vec3; hp: number }
  | { type: 'enemyShot'; kind: EnemyId; origin: Vec3; dir: Vec3 }
  | { type: 'waveStart'; wave: number; total: number }
  | { type: 'waveClear'; wave: number; nextIn: number }
  | { type: 'win'; totalShots: number; hits: number; headshots: number; kills: number; time: number; reason?: 'waves' | 'capture' | 'elimination' }
  | { type: 'lose'; wave: number; kills: number; time: number; reason?: 'waves' | 'capture' | 'elimination' }
  | { type: 'footstep'; speed: number }
  /** 手雷出手（渲染层据此生成可抛物线飞行的雷体网格） */
  | { type: 'grenadeThrow'; id: number; origin: Vec3; vel: Vec3 }
  /** 手雷爆炸（渲染层放闪光/粒子/震动，音频层放爆炸声） */
  | { type: 'explode'; pos: Vec3; radius: number };

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
  /** ADS 开镜（右键按住；移植自 04_1） */
  ads: boolean;
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
    ads: false,
    slot: null,
  };
}

/** 渲染层需要的战斗员状态（敌我共用；team 决定着色与敌我识别） */
export interface EnemyView {
  id: number;
  kind: EnemyId;
  elite: boolean;
  /** 队伍：蓝队（友）/ 红队（敌） */
  team: Team;
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
  mode: GameMode;
  /** 据点占领进度：-100=红队占满，+100=蓝队占满，0=中立（仅据点模式有含义） */
  capture: number;
  /** 据点中心与半径（XZ 平面） */
  capturePoint: { x: number; z: number; r: number };
  /** 双方存活战斗员数（含玩家；玩家死亡不计入蓝队） */
  blueAlive: number;
  redAlive: number;
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
  /** 当前是否处于 ADS 开镜态（HUD 与验证用） */
  ads: boolean;
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
