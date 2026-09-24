/**
 * 全局参数表（08 · 弯心 APEX）
 *
 * 车辆手感的所有旋钮集中在这里 —— M3 的「手感自动扫参」就是在这些字段上做网格搜索。
 * 物理层与渲染层都不允许硬编码数值。
 */
import type { TrackTheme } from '../sim/track';

export const CONFIG = {
  physics: {
    gravity: -9.81,
    /** 固定步长：确定性回放与机器人跑圈的前提 */
    fixedDt: 1 / 60,
    /** 单帧最多补几步（防止切后台回来后爆炸） */
    maxSubSteps: 5,
    /**
     * 软边界力场系数（N/米越界）：车临近路沿时施加朝中心线的平滑回复力，
     * 替代实体护栏——既能 containment 又不因碰撞把车别翻（街机赛车常用方案）。
     * 越界越深推力越大，封顶 3 米。整车约 1000kg，需足够大才能稳稳推回。
     */
    softWallForce: 30000,
  },

  vehicle: {
    /** 底盘半尺寸（长×宽按 Z×X） */
    halfExtents: { x: 0.9, y: 0.38, z: 2.0 },
    /**
     * 底盘质量密度。整车目标质量约 1000kg（底盘+加重底板的组合质量）。
     * 曾用 1.1 导致整车仅 ~17.6kg，引擎力相对过大，起步猛踩油门时重量转移让前轮
     * 离地、车尾着地卡死（后翻式 wheelie）——这是落日海岸卡死的真正根因。
     */
    density: 62,
    /** 质心相对底盘中心的下移量（防翻车的关键，进一步压低提升抗侧翻） */
    centerOfMassY: -0.55,
    linearDamping: 0.08,
    /** 角阻尼加大：抑制高速急打方向引发的旋转/侧翻 */
    angularDamping: 1.5,

    wheel: {
      radius: 0.42,
      /** 车轮安装位置（底盘局部坐标）；轮距加宽到 ±1.0 提高翻车阈值 */
      mounts: [
        { x: 1.0, y: -0.28, z: 1.32 },
        { x: -1.0, y: -0.28, z: 1.32 },
        { x: 1.0, y: -0.28, z: -1.42 },
        { x: -1.0, y: -0.28, z: -1.42 },
      ],
      suspensionRest: 0.34,
      suspensionStiffness: 32,
      suspensionCompression: 0.85,
      suspensionRelaxation: 0.88,
      maxSuspensionTravel: 0.3,
      /** 纵向抓地（加速/刹车） */
      frictionSlip: 2.6,
      /** 横向抓地（抗侧滑）—— 调低会飘，这是漂移手感的旋钮 */
      sideFrictionStiffness: 1.6,
    },

    /** 后轮驱动的总引擎力（N）：约 1000kg 下车重下给 ~9 m/s² 加速，不抬头 */
    engineForce: 9000,
    /** 刹车力（N）：强于引擎，街机式制动 */
    brakeForce: 14000,
    /** 手刹（锁后轮）力 */
    handbrakeForce: 900,
    /** 最大转向角（弧度） */
    maxSteer: 0.65,
    /** 高速时的转向衰减系数（速度越高转向越小，防高速甩尾失控） */
    steerSpeedFalloff: 0.022,
    /** 转向响应速率（每秒趋向目标角的比例） */
    steerRate: 6.5,
    /** 空气阻力系数（与速度平方成正比，决定极速，约 210 km/h） */
    dragCoefficient: 2.6,
    /** 下压力（速度越快越贴地，高速稳定性） */
    downforce: 18,
  },

  ai: {
    /** 前瞻距离（米）：转向追踪点与曲率采样都用它，按米换算成段数（赛道尺寸无关） */
    lookAhead: 18,
    /** 转向比例增益 */
    steerGain: 1.7,
    /** 直线目标速度上限（m/s，约 162 km/h） */
    vMax: 45,
    /**
     * 轮胎可用侧向加速度（m/s²）—— 据此反推安全过弯速度。
     * 注：这是「统一 AI」下的保守值。更高的取值会让扭弯赛道极速更高，但会让
     * 落日海岸（宽/快）与风暴之巅（低摩擦+起伏）重新翻车，故取此安全值。
     */
    latGrip: 7.5,
    /** 过弯速度安全裕度（留余量，别贴着极限走） */
    cornerMargin: 0.82,
    /** 最低目标速度（急弯也不会停死） */
    minSpeed: 10,
  },

  camera: {
    distance: 8.2,
    height: 3.2,
    lookAhead: 6,
    /** 基础 FOV 与速度带来的增量（速度感来源） */
    fovBase: 62,
    fovSpeedGain: 0.42,
    /** 位置跟随硬度（越大越跟手） */
    lerpPos: 7.5,
    lerpLook: 9,
    /** 相机最低离地高度（防穿地） */
    minGround: 1.2,
  },

  race: {
    countdown: 3,
    laps: 3,
    /** 掉出赛道后自动重置的延迟（秒） */
    resetDelay: 1.2,
    /** 判定"掉出赛道"的高度阈值 */
    fallY: -8,
    /** 卡住判定：速度低于此值持续 stuckSeconds 秒则提示重置 */
    stuckSpeed: 1.5,
    stuckSeconds: 4,
  },

  render: {
    /** 路面分段数（物理与视觉共用） */
    segments: 72,
    /** 护栏高度 */
    railHeight: 1.5,
    /** 天空与雾 */
    fogNear: 90,
    fogFar: 520,
  },

  defaultTrack: 'dawn_boulevard',
} as const;

export type ThemeName = TrackTheme;
