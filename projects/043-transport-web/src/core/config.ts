/**
 * 全局可调参数 —— 自动扫参 / 手感调校只动这个文件。
 * 全部数值为实测调校基线（2026-09-24），改动请同步 README 的「调参记录」。
 */

export type WeaponId = 'ak47' | 'm4a1' | 'awm' | 'mp5' | 'deagle' | 'grenade';
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
  /** ADS 开镜视场角覆盖（狙击镜用；缺省 = CONFIG.player.ads.fov） */
  adsFov?: number;
  /** ADS 散布乘区覆盖（狙击镜要求近乎零散布；缺省 = CONFIG.player.ads.spreadMul） */
  adsSpreadMul?: number;
  /** 投掷物：fire = 出手一颗雷，不走射线，伤害走 CONFIG.grenade 的爆炸结算 */
  throwable?: boolean;
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
    /**
     * ADS 开镜（移植自 04_1 frontline-cq）。
     * 数值参照其比例校准：spread 1.9°→0.35°（≈0.35 倍）、speed 3.9/6.0（0.65）。
     * 开镜时禁止疾跑（04_1 的 InputController.isSprint 同样要求 !ads）。
     */
    ads: {
      /** 开镜视场角（度）——FOV 从 camera.fov 平滑过渡到它 */
      fov: 56,
      /** 开镜散布乘区（乘到「基础 + 连发累积」总散布上） */
      spreadMul: 0.38,
      /** 开镜灵敏度乘区 */
      sensMul: 0.62,
      /** 开镜移速乘区（相对 walkSpeed） */
      speedMul: 0.62,
      /** FOV 过渡速度（指数趋近系数/秒） */
      fovLerp: 14,
    },
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
   * 武器数据表（移植自 043 cf-transport-ship 的 weapons.js，字段映射到 04 的 WeaponDef）：
   *   rpm → interval = 60/rpm；rangeFull/rangeFar/farMul → falloffStart/End/Min；
   *   spreadHip → spreadBase；recoil.v/h/recover → recoilPitch/recoilYaw/recoilRecover。
   * TTK 参考（满血 grunt 45hp，全命中躯干）：AK 2 发 0.2s；M4 2 发 0.18s；MP5 3 发 0.2s；
   * AWM 1 发（狙击镜）；沙鹰 1 发 58 伤害近距一枪BODY。
   */
  weapons: [
    {
      id: 'ak47',
      name: 'AK-47',
      short: 'AK-47',
      damage: 34,
      pellets: 1,
      interval: 0.1, // 600 rpm
      auto: true,
      spreadBase: 0.021,
      spreadPerShot: 0.0045,
      spreadMax: 0.052,
      spreadRecover: 0.09,
      magazine: 30,
      reloadTime: 2.4,
      range: 62,
      falloffStart: 26,
      falloffEnd: 62,
      falloffMin: 0.72,
      recoilPitch: 0.0165,
      recoilYaw: 0.0055,
      recoilRecover: 7.5,
      headshotMul: 3.4,
      color: 0xff8a4d,
    },
    {
      id: 'm4a1',
      name: 'M4A1',
      short: 'M4A1',
      damage: 28,
      pellets: 1,
      interval: 0.0882, // 680 rpm
      auto: true,
      spreadBase: 0.017,
      spreadPerShot: 0.0038,
      spreadMax: 0.044,
      spreadRecover: 0.1,
      magazine: 35,
      reloadTime: 2.2,
      range: 65,
      falloffStart: 28,
      falloffEnd: 65,
      falloffMin: 0.75,
      recoilPitch: 0.0115,
      recoilYaw: 0.004,
      recoilRecover: 9,
      headshotMul: 3.2,
      color: 0x6ec8ff,
    },
    {
      id: 'awm',
      name: 'AWM',
      short: 'AWM',
      // 栓动狙击：一枪致命（115 > 任何敌人满血），interval 1.43s 是射击节奏的全部代价
      damage: 115,
      pellets: 1,
      interval: 1.43, // 42 rpm，栓动
      auto: false,
      spreadBase: 0.05, // 腰射几乎打不着人——狙击必须开镜
      spreadPerShot: 0.012,
      spreadMax: 0.09,
      spreadRecover: 0.04,
      magazine: 10,
      reloadTime: 3.4,
      range: 120,
      falloffStart: 90,
      falloffEnd: 200,
      falloffMin: 0.9,
      recoilPitch: 0.055,
      recoilYaw: 0.01,
      recoilRecover: 4.5,
      headshotMul: 1.6,
      color: 0xc9b26b,
      // 狙击镜：FOV 收到 24°（0.31× 基准 78），腰射散布 0.05 → 镜内 0.0006
      adsFov: 24,
      adsSpreadMul: 0.012,
    },
    {
      id: 'mp5',
      name: 'MP5',
      short: 'MP5',
      damage: 21,
      pellets: 1,
      interval: 0.0682, // 880 rpm
      auto: true,
      spreadBase: 0.024,
      spreadPerShot: 0.005,
      spreadMax: 0.07,
      spreadRecover: 0.08,
      magazine: 30,
      reloadTime: 2.1,
      range: 40,
      falloffStart: 16,
      falloffEnd: 40,
      falloffMin: 0.55,
      recoilPitch: 0.008,
      recoilYaw: 0.005,
      recoilRecover: 11,
      headshotMul: 2.6,
      color: 0x5ad1c0,
    },
    {
      id: 'deagle',
      name: '沙漠之鹰',
      short: 'DEAGLE',
      damage: 58,
      pellets: 1,
      interval: 0.286, // 210 rpm
      auto: false,
      spreadBase: 0.016,
      spreadPerShot: 0.008,
      spreadMax: 0.05,
      spreadRecover: 0.09,
      magazine: 7,
      reloadTime: 1.9,
      range: 45,
      falloffStart: 18,
      falloffEnd: 45,
      falloffMin: 0.62,
      recoilPitch: 0.03,
      recoilYaw: 0.008,
      recoilRecover: 7,
      headshotMul: 3.0,
      color: 0xffc14d,
    },
    {
      id: 'grenade',
      name: '破片手雷',
      short: 'GRENADE',
      // 043 的手雷在这里只有「投掷手感」字段；爆炸伤害/半径/引信全部走 CONFIG.grenade
      damage: 115,
      pellets: 1,
      interval: 0.9, // 出手一颗到掏出下一颗
      auto: false,
      spreadBase: 0,
      spreadPerShot: 0,
      spreadMax: 0,
      spreadRecover: 1,
      magazine: 3, // 3 颗，丢完为止（throwable 不换弹；波间 refillAll 补满）
      reloadTime: 2.5,
      range: 0,
      falloffStart: 0,
      falloffEnd: 0,
      falloffMin: 1,
      recoilPitch: 0.012, // 出手的身体晃动
      recoilYaw: 0.004,
      recoilRecover: 8,
      headshotMul: 1,
      color: 0x9fe86e,
      throwable: true,
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

  /**
   * AI v2（移植/借鉴自 04_1 frontline-cq 的拟人化设计）—— 仅据点模式启用。
   * 生存模式红队必须与旧版 Enemy 逐帧等价（bot 基线 A–G 可比性是硬前提），
   * 所以 v2 行为树 / 掩体 / 反应延迟全部挂在 domination 分支下，survival 走旧路径。
   */
  ai: {
    /** 目标首次进入视线后，累计注视多久才允许起手（04_1 的 reactionSec） */
    reactionSec: 0.28,
    /** 生命低于该比例时才有资格寻找掩体 */
    coverHpRatio: 0.5,
    /** 受击后多少秒内视为「正在被压制」（压制窗口内才找掩体） */
    underFireWindow: 1.5,
    /** 距掩体点小于该距离视为「已进入掩体」 */
    coverArriveDist: 0.9,
  },

  /**
   * 手雷（新增：修复 043「手雷没有物理反弹」——雷是 Rapier 动态刚体球，
   * 撞甲板/集装箱按 restitution 真实反弹，引信到点爆炸做范围伤害）
   */
  grenade: {
    /** 碰撞球半径 */
    radius: 0.11,
    /** 投掷初速（沿瞄准方向） */
    power: 15,
    /** 垂直补偿：平指也能过肩抛出弧线 */
    upBias: 2.6,
    /** 引信时长（从出手计） */
    fuse: 2.2,
    /** 反弹保留速度比例（0.55 ≈ 橡胶感：甲板弹两下、集装箱壁弹开） */
    restitution: 0.55,
    /** 摩擦系数（落地滚动衰减） */
    friction: 0.7,
    /** 密度（球质量 ≈ 4πr³/3·ρ ≈ 0.124kg——动量小，不会推动任何东西） */
    density: 2.0,
    /** 爆炸半径 */
    blastRadius: 6.5,
    /** 爆心伤害（grunt 45hp 必杀；2.5m 内对精英也近乎致命） */
    damage: 115,
    /** 玩家自伤倍率（自己被自己的雷炸半伤） */
    selfDamageMul: 0.5,
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
