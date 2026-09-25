/**
 * 全局可调参数 —— 手感调校只动这个文件。
 *
 * 数值依据（2026-09-25 立项探针 `_tmp/soccer-probe.mjs` 实测）：
 *   - 恢复系数默认「平均合成」，故球与地面/墙都要设高弹性
 *   - Rapier 不模拟滚动阻力 → rollingResistance 手动施加（常量减速度）
 *   - Rapier 不原生模拟 Magnus → magnus 系数手动施加 F = K·(ω×v)
 */

export type Team = 'blue' | 'red';

export const CONFIG = {
  physics: {
    /** 固定步长 —— 确定性回放与 bot 跑分的基础 */
    fixedDt: 1 / 60,
    /** 略强于真实值：落地干脆，球路下坠可读 */
    gravity: -22,
  },

  /** 场地：沿 X 为长（球门方向），沿 Z 为宽。+X = 敌方球门（玩家进攻），-X = 己方球门 */
  pitch: {
    halfLength: 22,
    halfWidth: 15,
    /** 围板高度（比球门高，保证球不会飞出场外） */
    wallHeight: 2.8,
    goalWidth: 7.0,
    goalHeight: 2.2,
    /** 球门纵深（球门线之后的网兜深度） */
    goalDepth: 2.0,
  },

  player: {
    radius: 0.35,
    halfHeight: 0.5,
    eyeOffset: 0.62,
    walkSpeed: 6.8,
    sprintSpeed: 9.6,
    jumpSpeed: 7.6,
    /** 可触球距离（水平） */
    kickRange: 1.9,
    /** 触球锥半角（弧度）—— 太大会「隔空踢球」 */
    kickHalfAngle: 1.0,
  },

  ai: {
    radius: 0.4,
    halfHeight: 0.55,
    eyeOffset: 0.7,
    walkSpeed: 5.9,
    sprintSpeed: 7.4,
    jumpSpeed: 6.4,
    /** 前锋 */
    controlRange: 1.7,
    /** 进入该距离才射门（太远射 = 送守门员表演，必须带球靠近） */
    shootRange: 11,
    /**
     * 带球超过这个时长仍推进不到射程 → 直接往前开一脚（解卡）。
     *
     * 必须存在：球被对手身体卡住时前锋推不动球，又因距离球门 > shootRange 而不射门，
     * 就会永久僵死（实测闲置玩家恰好站在球与前锋之间 → 全场静止 150 秒）。
     */
    holdKickTime: 1.4,
    /** 解卡开球的力度（中等，够推进但不至于一脚送球权） */
    holdKickPower: 16,
    /**
     * 守门员横向跟随范围。必须明显小于球门半宽（3.5），
     * 否则「跟球范围 + 解围半径」≥ 半宽 → 一人封死整条门线。
     */
    keeperTrack: 2.6,
    keeperDepth: 1.3,
    /** 守门员横向速度：必须明显慢于前锋，否则一人守住整条球门线（实测 5.9 时双方都进不了球） */
    keeperSpeed: 3.2,
    /**
     * 守门员实际解围半径（水平）—— 独立于 controlRange 且明显更小。
     * 实测教训：controlRange=1.7 时「跟球 0.55 + 解围 1.7」= 3.57 ≥ 球门半宽 3.5，
     * 几何上球门被完全覆盖，双方 240s 都进不了球。
     */
    keeperReach: 0.95,
    /**
     * 球离本方球门多近时守门员主动出击抢球。
     * 必须存在：否则球滚到门线死角停下后，守门员（只按门线站位 + 小解围半径）永远够不到，
     * 实测球停在 (21.8, -3.3) 静止 18 秒，比赛变成死球。
     * 不能太大：守门员出击会离开球门线，留出空门。
     */
    keeperRush: 3.0,
  },

  /** 球：Rapier 动态球体刚体 */
  ball: {
    radius: 0.22,
    /** 密度 → 质量 ≈ 0.43kg（标准 5 号球） */
    density: 9.6,
    restitution: 0.82,
    friction: 0.55,
    linearDamping: 0.05,
    angularDamping: 0.07,
    /** 滚动阻力：常量减速度（m/s²）。Rapier 不模拟，手动施加 */
    rollingResistance: 2.2,
    /** Magnus 系数（弧线强度），K·(ω×v) */
    magnus: 0.0018,
    /** 速度上限，防止穿模 */
    maxSpeed: 34,
    /** 踢球附带的自旋（供 Magnus 产生弧线） */
    kickSpin: 22,
    /**
     * 踢球后的「带球辅助锁定」时间（秒）。
     *
     * 必须存在，否则射门会被自己吃掉：dribbleAssist 会把球拉回脚前，
     * 而它的跳过门槛是 captureSpeed=14，前锋射门力度 = 9 + 距离*0.6，
     * 实测 15.6 → 1 帧后 8.46、12.4 → 4.95、11.1 → 3.84（15 次踢球里 11 次被吃），
     * 于是「射门」全退化成慢速带球，前锋一路把球送到守门员脚下。
     */
    kickLock: 0.3,
    /** 带球辅助：球进入该水平距离内被「吸附」到脚前 */
    dribbleRange: 1.6,
    /** 吸附目标点距玩家前方距离 */
    dribbleDist: 0.8,
    /** 吸附刚度（把球拉向目标点的速度比例） */
    dribbleStiffness: 9,
    /** 每步速度收敛比例 0..1（越大球越黏脚） */
    dribbleGrip: 0.55,
    /** 球速超过此值不再被吸附（快球抓不住） */
    captureSpeed: 14,
  },

  kick: {
    /** 蓄满力所需时间（秒） */
    chargeTime: 0.6,
    /** 轻踢（点一下）速度 */
    minPower: 7.0,
    /** 满力踢球速度 */
    maxPower: 23,
    /** 抬脚抬升比例（相对水平速度） */
    lift: 0.26,
  },

  match: {
    /** 先进 N 球者胜 */
    goalsToWin: 5,
    /** 进球后重新开球的停顿（秒） */
    goalCelebrate: 2.4,
    /** 开球前的哨声停顿 */
    kickoffDelay: 1.2,
    /**
     * 死球兜底（M1 规则简化，真实足球用界外球/球门球）。
     * 球速 < deadBallSpeed 持续 deadBallTime 秒，且所有角色都离球超过 deadBallClearRadius
     * → 判死球，回到中圈开球。
     *
     * 两个条件缺一不可：只看「球静止」会把「玩家停在球前蓄力」误判成死球。
     * 实测球滚到边线死角 (21.5,-14.5) 后双方都够不到，静止 22 秒，比赛卡死。
     */
    deadBallSpeed: 0.35,
    deadBallTime: 4.0,
    deadBallClearRadius: 3.0,
    /**
     * 硬死球：球速极低持续这么久 → 无条件重新开球（不再要求「无人靠近」）。
     * 兜底用：有角色站在球边但不推进时，上面那条规则永远不触发（实测卡死 150 秒）。
     * 取值必须够长，否则会误伤「玩家停在球前瞄准/蓄力」。
     */
    deadBallHardTime: 12.0,
  },

  camera: {
    fov: 80,
    near: 0.05,
    far: 420,
    sensitivity: 0.0022,
    shakeDecay: 7,
    goalShake: 0.5,
  },

  audio: { master: 0.55 },
} as const;
