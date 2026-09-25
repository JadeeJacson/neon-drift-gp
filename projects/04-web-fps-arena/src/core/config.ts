/**
 * 全局可调参数 —— 自动扫参 / 手感调校只动这个文件。
 * 全部数值为实测调校基线（2026-09-24），改动请同步 README 的「调参记录」。
 */

export type WeaponId = 'pistol' | 'rifle' | 'shotgun' | 'smg' | 'dmr';
export type EnemyId = 'grunt' | 'rusher' | 'sniper';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  short: string;
  /** 单发伤害（霰弹为每颗弹丸的伤害） */
  damage: number;
  /** 每发弹丸数 */
  pellets: number;
  /** 射击间隔（秒） */
  interval: number;
  /** 是否连发（按住持续射击） */
  auto: boolean;
  /** 基础散布（弧度，半角） */
  spreadBase: number;
  /** 每发累积散布 */
  spreadPerShot: number;
  /** 散布上限 */
  spreadMax: number;
  /** 散布恢复（弧度/秒） */
  spreadRecover: number;
  /** 弹匣容量 */
  magazine: number;
  /** 换弹时长（秒） */
  reloadTime: number;
  /** 最大射程 */
  range: number;
  /** 伤害衰减：falloffStart 之前不衰减，到 falloffEnd 衰减到 falloffMin 倍 */
  falloffStart: number;
  falloffEnd: number;
  falloffMin: number;
  /** 每发后坐力（弧度） */
  recoilPitch: number;
  recoilYaw: number;
  /** 后坐力回落速度（越大回得越快） */
  recoilRecover: number;
  /** 爆头倍率 */
  headshotMul: number;
  /** 准星显示色（渲染层用） */
  color: number;
}

export interface EnemyDef {
  id: EnemyId;
  name: string;
  hp: number;
  speed: number;
  radius: number;
  halfHeight: number;
  /** hitscan：远程射击；melee：接触伤害 */
  attackType: 'hitscan' | 'melee';
  damage: number;
  /** 攻击间隔（秒） */
  interval: number;
  /** 攻击距离 */
  range: number;
  /** 出手预警时间（秒）—— 玩家可读的反应窗口 */
  windup: number;
  /** 射击散布（弧度） */
  spread: number;
  color: number;
  score: number;
}

export interface WaveDef {
  grunt: number;
  rusher: number;
  sniper: number;
  /** 精英：grunt 的强化变体 */
  elite: number;
}

export const CONFIG = {
  physics: {
    /** 固定步长 —— 确定性回放与 bot 跑分的基础 */
    fixedDt: 1 / 60,
    /** FPS 手感重力远大于真实值：跳跃干脆、落地快 */
    gravity: -26,
  },

  player: {
    radius: 0.35,
    halfHeight: 0.5,
    /** 眼睛相对胶囊中心的高度偏移 */
    eyeOffset: 0.62,
    walkSpeed: 6.4,
    sprintSpeed: 9.6,
    jumpSpeed: 8.2,
    maxHp: 100,
    /** 波次间恢复的最大生命比例 */
    waveHealRatio: 0.35,
    /** 受击后短暂无敌，避免同帧多次伤害 */
    hurtCooldown: 0.12,
  },

  camera: {
    fov: 78,
    near: 0.05,
    far: 400,
    /** 鼠标灵敏度（弧度/像素） */
    sensitivity: 0.0022,
    /** 后坐力回落速度 */
    recoilRecover: 9,
    /** 屏幕震动衰减 */
    shakeDecay: 7,
    /** 受击时屏幕震动强度 */
    hurtShake: 0.35,
  },

  /**
   * TTK 参考（满血、全命中躯干）：
   *   步枪 vs grunt(45hp)：3 发 ≈ 0.17s；手枪 2 发 ≈ 0.20s；霰弹近距 1 发
   */
  weapons: [
    {
      id: 'pistol',
      name: '手枪',
      short: 'SIDEARM',
      damage: 26,
      pellets: 1,
      interval: 0.2,
      auto: false,
      spreadBase: 0.004,
      spreadPerShot: 0.005,
      spreadMax: 0.024,
      spreadRecover: 0.09,
      magazine: 12,
      reloadTime: 1.1,
      range: 60,
      falloffStart: 22,
      falloffEnd: 48,
      falloffMin: 0.55,
      recoilPitch: 0.021,
      recoilYaw: 0.004,
      recoilRecover: 11,
      headshotMul: 2,
      color: 0xffc14d,
    },
    {
      id: 'rifle',
      name: '步枪',
      short: 'RIFLE',
      damage: 15,
      pellets: 1,
      interval: 0.086,
      auto: true,
      spreadBase: 0.006,
      spreadPerShot: 0.006,
      spreadMax: 0.048,
      spreadRecover: 0.07,
      magazine: 30,
      reloadTime: 1.9,
      range: 70,
      falloffStart: 28,
      falloffEnd: 58,
      falloffMin: 0.62,
      recoilPitch: 0.011,
      recoilYaw: 0.003,
      recoilRecover: 13,
      headshotMul: 2,
      color: 0xff6b35,
    },
    {
      id: 'shotgun',
      name: '霰弹枪',
      short: 'SHOTGUN',
      damage: 12,
      pellets: 8,
      interval: 0.8,
      auto: false,
      spreadBase: 0.05,
      spreadPerShot: 0,
      spreadMax: 0.05,
      spreadRecover: 0.2,
      magazine: 6,
      reloadTime: 2.3,
      range: 26,
      falloffStart: 7,
      falloffEnd: 19,
      falloffMin: 0.22,
      recoilPitch: 0.05,
      recoilYaw: 0.008,
      recoilRecover: 8,
      headshotMul: 1.5,
      color: 0x9ad14b,
    },
    {
      id: 'smg',
      name: '冲锋枪',
      short: 'SMG',
      // 近距压制：射速最快、弹匣最大，代价是伤害与射程都低于步枪
      // DPS = 10/0.065 ≈ 154（步枪 174），但弹匣 45、换弹 1.6s，持续压制能力最强
      damage: 10,
      pellets: 1,
      interval: 0.065,
      auto: true,
      spreadBase: 0.011,
      spreadPerShot: 0.008,
      spreadMax: 0.075,
      spreadRecover: 0.06,
      magazine: 45,
      reloadTime: 1.6,
      range: 38,
      falloffStart: 12,
      falloffEnd: 30,
      falloffMin: 0.5,
      recoilPitch: 0.008,
      recoilYaw: 0.005,
      recoilRecover: 15,
      headshotMul: 1.6,
      color: 0x5ad1c0,
    },
    {
      id: 'dmr',
      name: '精确射手步枪',
      short: 'DMR',
      // 远距精确：一发带走杂兵（grunt 45 / rusher 32 / sniper 38），精英 99hp 需 3 发
      // DPS = 48/0.6 = 80，仍远低于步枪 174——用射速换取射程与单发效率。
      // interval 从 0.85 降到 0.6、弹匣 8→10：原值下 bot 实测第 2 波就被冲锋兵冲死
      // （3 个冲锋兵 6m/s 冲脸，0.85s 一发来不及逐个点掉），作为可用武器太脆。
      damage: 48,
      pellets: 1,
      interval: 0.6,
      auto: false,
      spreadBase: 0.0006,
      spreadPerShot: 0.005,
      spreadMax: 0.014,
      spreadRecover: 0.05,
      magazine: 10,
      reloadTime: 2.1,
      range: 120,
      falloffStart: 60,
      falloffEnd: 110,
      falloffMin: 0.8,
      recoilPitch: 0.05,
      recoilYaw: 0.004,
      recoilRecover: 7,
      headshotMul: 2.5,
      color: 0xb388ff,
    },
  ] as WeaponDef[],

  enemies: {
    grunt: {
      id: 'grunt',
      name: '步兵',
      hp: 45,
      speed: 3.4,
      radius: 0.4,
      halfHeight: 0.5,
      attackType: 'hitscan',
      damage: 9,
      interval: 1.15,
      range: 22,
      windup: 0.35,
      spread: 0.055,
      color: 0x5aa9e6,
      score: 100,
    },
    rusher: {
      id: 'rusher',
      name: '冲锋兵',
      hp: 32,
      speed: 6.0,
      radius: 0.38,
      halfHeight: 0.45,
      attackType: 'melee',
      damage: 20,
      interval: 1.0,
      range: 1.7,
      windup: 0.25,
      spread: 0,
      color: 0xff5c5c,
      score: 150,
    },
    sniper: {
      id: 'sniper',
      name: '狙击手',
      hp: 38,
      speed: 2.2,
      radius: 0.4,
      halfHeight: 0.55,
      attackType: 'hitscan',
      damage: 24,
      interval: 2.6,
      range: 40,
      windup: 0.9,
      spread: 0.012,
      color: 0xc08bff,
      score: 200,
    },
  } as Record<EnemyId, EnemyDef>,

  /** 精英：在 grunt 基础上放大 */
  elite: {
    hpMul: 2.2,
    speedMul: 1.12,
    damageMul: 1.35,
    scale: 1.35,
    color: 0xffd166,
    score: 300,
  },

  /** 合计 57 个敌人；配合 batchInterval=7 得到约 2 分钟的单局节奏 */
  waves: [
    { grunt: 4, rusher: 0, sniper: 0, elite: 0 },
    { grunt: 4, rusher: 3, sniper: 0, elite: 0 },
    { grunt: 5, rusher: 4, sniper: 2, elite: 0 },
    { grunt: 6, rusher: 5, sniper: 3, elite: 0 },
    { grunt: 8, rusher: 6, sniper: 4, elite: 3 },
  ] as WaveDef[],

  wave: {
    /**
     * 同波内两批之间的间隔。这是单局时长的主控旋钮：
     * 清怪快于放怪时，放怪节奏决定总时长（4.5 → 单局约 70s；7 → 约 113s）。
     */
    batchInterval: 7,
    /** 场上同时存在的敌人上限（决定「同时被几个人打」） */
    maxAlive: 8,
    /** 每批最多放出的数量 */
    batchSize: 4,
    /** 波次之间的喘息时间 */
    breakTime: 3.2,
    /** 敌人出生点距中心的最小/最大距离 */
    spawnMinDist: 17,
    spawnMaxDist: 24,
  },

  arena: {
    /** 竞技场半边长（正方形） */
    half: 26,
    /** 围墙高度 */
    wallHeight: 4,
  },

  /** 据点占领（5v5）参数 */
  dom: {
    /** 队伍人数：蓝队 = 玩家 + blueAllies；红队 = redCount */
    blueAllies: 4,
    redCount: 5,
    /** 据点中心（XZ）与半径 */
    point: { x: 0, z: 0 },
    radius: 7,
    /** 单人独占据点时，占满所需秒数（被对方抵消时更慢） */
    captureSeconds: 25,
  },

  enemy: {
    /** 敌人保持的理想交战距离（hitscan 类） */
    standoff: 9,
    /** 侧移绕圈强度 */
    strafe: 0.55,
    /** 侧移方向翻转周期（秒） */
    strafeFlip: 1.8,
    /** 相互排斥半径，防止叠在一起 */
    separation: 1.6,
  },

  audio: {
    master: 0.55,
  },

  fx: {
    /** 曳光存活时间 */
    tracerLife: 0.06,
    /** 命中火花数量 */
    sparkCount: 12,
    /** 击杀碎块数量 */
    gibCount: 14,
  },
} as const;

export const WEAPON_BY_ID = Object.fromEntries(
  CONFIG.weapons.map((w) => [w.id, w]),
) as Record<WeaponId, WeaponDef>;
