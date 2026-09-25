/**
 * 足球 AI —— 前锋（追球/带球/射门）与守门员（跟球横移/出击解围）。
 *
 * 与 04 的战斗 AI 不同：这不是「朝敌人开火」，而是「多智能体为同一个球分工」——
 * 前锋要把球推进对方球门，守门员要守住自家球门。这是本项目对 agent 学习线的贡献。
 *
 * 确定性：AI 不含随机数，同输入必然同输出（bot 跑分与回放的前提）。
 */
import { CONFIG } from '../core/config';
import type { Character } from './character';
import type { MoveIntent } from './character';
import type { Team } from '../core/config';
import type { Vec3 } from './types';
import { aimAngles, clamp, distXZ, forwardXZ, normalize, sub, v3 } from './vecmath';

export interface KickCmd {
  dir: Vec3;
  power: number;
}

export interface AgentDecision {
  kick: KickCmd | null;
  /** 踢球动作是否触发（渲染层抬腿动画） */
  kicked: boolean;
}

export interface BallInfo {
  pos: Vec3;
  vel: Vec3;
}

/** 把球朝目标点踢出的方向（含抬升），已单位化 */
function kickDirToward(from: Vec3, to: Vec3, lift: number): Vec3 {
  const d = sub(to, from);
  const l = Math.hypot(d.x, d.z) || 1;
  return normalize(v3(d.x / l, lift, d.z / l));
}

/**
 * 计算「绕到球的进攻侧后方」的站位点。
 *
 * 这是踢球方向正确的前提：踢球方向 = 玩家朝向，只有站到球的**目标反侧**，
 * 「面朝目标推进」才等于「把球推向目标」。否则会像踩香蕉皮一样把球踢偏/踢反。
 */
export function approachBehind(
  self: Vec3,
  ball: Vec3,
  target: Vec3,
  standoff = 0.7,
): { point: Vec3; dist: number } {
  const tg = normalize(v3(target.x - ball.x, 0, target.z - ball.z));
  const point = v3(ball.x - tg.x * standoff, 0, ball.z - tg.z * standoff);
  return { point, dist: distXZ(self, point) };
}

/** 点是否在场内（留 margin 余量）。用于判断绕后点是否可达 */
function insidePitch(p: Vec3, margin: number): boolean {
  return (
    Math.abs(p.x) <= CONFIG.pitch.halfLength - margin &&
    Math.abs(p.z) <= CONFIG.pitch.halfWidth - margin
  );
}

/**
 * 绕后寻路 —— AI 前锋与 bot 共用同一套，保证「bot 跑分」测的是真实可达性。
 *
 * 返回下一步该朝哪个点走：
 *  - fallback=true：绕后点落在场外（球贴底线/边线时该点甚至可能落进球门网内部）。
 *    调用方应改用「直接逼近球 + 朝目标开出」策略 —— kick 的方向由「球 → 目标」算出，
 *    与站位无关，所以不绕到球后也能踢对方向。
 *  - 否则返回切向航点或绕后点。贴近球但尚未绕到位时走切向航点，
 *    沿弧线绕过球 —— 直线奔向绕后点必然穿过球的位置，角色身体会把球顶向反方向
 *    （实测前锋一边绕后一边把球顶进自家角旗区）。
 */
export function seekBehind(
  self: Vec3,
  ball: Vec3,
  goal: Vec3,
  standoff = 0.75,
): { point: Vec3; dist: number; fallback: boolean; aligned: boolean } {
  const behind = approachBehind(self, ball, goal, standoff);
  if (!insidePitch(behind.point, 0.6)) {
    return { point: ball, dist: distXZ(self, ball), fallback: true, aligned: false };
  }
  const dBall = distXZ(self, ball);
  const gdir = normalize(v3(goal.x - ball.x, 0, goal.z - ball.z));
  const sideDot = (self.x - ball.x) * gdir.x + (self.z - ball.z) * gdir.z;
  // aligned = 已站在球的「目标反侧」，此时面朝目标前进就等于把球推向目标
  const aligned = sideDot < -0.25;
  // 避球绕行：判断「直线奔向绕后点」会不会撞上球 —— 会撞就走切向航点绕过去。
  // 不能用固定距离阈值：实测阈值 3.2 时 bot 恰好在 3.27m 处走直线穿球，
  // 边追边把球顶向反方向，结果全场 0 次踢球。用路径到球的垂距才是正确判据。
  const segX = behind.point.x - self.x;
  const segZ = behind.point.z - self.z;
  const segL2 = segX * segX + segZ * segZ;
  let pathDist = dBall;
  if (segL2 > 1e-6) {
    const t = Math.max(
      0,
      Math.min(1, ((ball.x - self.x) * segX + (ball.z - self.z) * segZ) / segL2),
    );
    pathDist = Math.hypot(ball.x - (self.x + segX * t), ball.z - (self.z + segZ * t));
  }
  if (!aligned && pathDist < 1.0) {
    const rx = self.x - ball.x;
    const rz = self.z - ball.z;
    const rl = Math.hypot(rx, rz);
    // 与球几乎重合时方向退化，直接用「目标反侧」作为径向
    const radial = rl > 0.35 ? v3(rx / rl, 0, rz / rl) : v3(-gdir.x, 0, -gdir.z);
    let tx = -radial.z;
    let tz = radial.x;
    // 两个切向里选朝向绕后点的那个，避免绕远路
    if (tx * (behind.point.x - self.x) + tz * (behind.point.z - self.z) < 0) {
      tx = radial.z;
      tz = -radial.x;
    }
    return {
      point: v3(self.x + tx * 2.5, 0, self.z + tz * 2.5),
      dist: behind.dist,
      fallback: false,
      aligned,
    };
  }
  return { point: behind.point, dist: behind.dist, fallback: false, aligned };
}

/** 前锋：绕到球后 → 带球推进 → 射门 */
export class Striker {
  yaw = 0;
  private kickCd = 0;
  /** 状态保持：一旦绕到球后，就持续「推进」直到丢球（否则两状态每帧翻转 → 原地振荡） */
  private pushing = false;
  /** 解卡计时：处于推进态、球在脚下、但球几乎不动 —— 说明推不动（被对方身体挡住/球卡在死角） */
  private holdT = 0;
  readonly char: Character;
  readonly team: Team;
  /** 进攻的球门 x（红队攻 -X = 玩家球门） */
  private readonly attackGoalX: number;

  constructor(char: Character, team: Team, attackGoalX: number) {
    this.char = char;
    this.team = team;
    this.attackGoalX = attackGoalX;
  }

  update(dt: number, ball: BallInfo, oppKeeperZ: number): AgentDecision {
    if (this.kickCd > 0) this.kickCd -= dt;

    const self = this.char.pos();
    const move: MoveIntent = { forward: 0, right: 0, yaw: this.yaw, jump: false, sprint: false };
    let kick: KickCmd | null = null;

    // 打远角：瞄对方守门员的反侧，否则直射中路会被守门员稳稳扑出。
    // 只取 ±2.9 而不是贴着门柱的 ±3.2：球半径 0.22，贴柱射门稍有偏差就会打柱/蹭网。
    const cornerZ = oppKeeperZ >= 0 ? -2.9 : 2.9;
    const goalPos = v3(this.attackGoalX, 0, cornerZ);

    const seek = seekBehind(self, ball.pos, goalPos, 0.75);
    const dBall = distXZ(self, ball.pos);
    const distToGoal = Math.hypot(this.attackGoalX - self.x, self.z);

    // ── 退化模式：绕后点不可达 → 直接逼近球，够近就朝进攻方向开出 ──
    // 要停在球前 0.9m 而不是撞上去，否则会把球顶向错误方向（含顶进自家球门）。
    if (seek.fallback) {
      this.pushing = false;
      this.holdT = 0;
      const aim = aimAngles(self, ball.pos);
      this.yaw = aim.yaw;
      move.forward = dBall > 0.9 ? 1 : 0;
      move.sprint = dBall > 6;
      if (dBall < CONFIG.ai.controlRange + 0.2 && this.kickCd <= 0) {
        kick = { dir: kickDirToward(ball.pos, goalPos, 0.35), power: CONFIG.kick.maxPower * 0.85 };
        this.kickCd = 0.7;
      }
      move.yaw = this.yaw;
      this.char.update(dt, move);
      return { kick, kicked: kick !== null };
    }

    // 迟滞状态机：站到球的进攻侧后方且够近 → 进入推进；球跑远（丢球）→ 回到绕后。
    // 判据用「侧别 + 距离」而不是「到达某个点」：绕后点会随球移动，
    // 追一个会跑的点会让角色永远进不了推进态（实测 bot 全场 0 次踢球）。
    if (!this.pushing && seek.aligned && dBall < 1.5) this.pushing = true;
    if (this.pushing && dBall > CONFIG.ai.controlRange * 1.6) this.pushing = false;

    // 解卡计时：推进态 + 球在控制范围内 + 球几乎不动 → 累积。
    // 正常带球时球速 ≈ 角色速度 5.9 m/s，条件不成立、计时归零；只有真卡住才累积。
    // 触发场景（实测）：闲置玩家恰好站在球与前锋之间，两者互相顶住，
    //   球停在 (-8.6,-0.4) 静止 150 秒（t=72.8s → 222.8s），前锋 14m 外又够不到射程。
    const ballSpeedXZ = Math.hypot(ball.vel.x, ball.vel.z);
    const stuck = this.pushing && dBall < CONFIG.ai.controlRange * 1.2 && ballSpeedXZ < 0.8;
    this.holdT = stuck ? this.holdT + dt : 0;

    if (!this.pushing) {
      // 绕后寻路（含避球切向航点）见 seekBehind
      const aim = aimAngles(self, seek.point);
      this.yaw = aim.yaw;
      move.forward = 1;
      move.sprint = seek.dist > 4;
    } else {
      const aim = aimAngles(self, goalPos);
      this.yaw = aim.yaw;
      move.forward = 1;
      if (distToGoal < CONFIG.ai.shootRange && this.kickCd <= 0) {
        const power = clamp(9 + distToGoal * 0.6, CONFIG.kick.minPower, CONFIG.kick.maxPower);
        kick = { dir: kickDirToward(ball.pos, goalPos, CONFIG.kick.lift), power };
        this.kickCd = 0.5;
      } else if (this.holdT >= CONFIG.ai.holdKickTime && this.kickCd <= 0) {
        // 解卡：还没推进到射程就推不动了 → 直接把球朝球门方向开出去（低平，便于继续追）
        kick = { dir: kickDirToward(ball.pos, goalPos, 0.25), power: CONFIG.ai.holdKickPower };
        this.kickCd = 0.6;
        this.holdT = 0;
      }
    }

    move.yaw = this.yaw;
    this.char.update(dt, move);
    return { kick, kicked: kick !== null };
  }
}

/** 守门员：站住自家球门线，跟球横向移动，球贴近时出击解围 */
export class Keeper {
  yaw = 0;
  private kickCd = 0;
  readonly char: Character;
  readonly team: Team;
  /** 防守的球门 x */
  private readonly defendGoalX: number;

  constructor(char: Character, team: Team, defendGoalX: number) {
    this.char = char;
    this.team = team;
    this.defendGoalX = defendGoalX;
  }

  update(dt: number, ball: BallInfo): AgentDecision {
    if (this.kickCd > 0) this.kickCd -= dt;

    const self = this.char.pos();
    const sign = Math.sign(this.defendGoalX) || 1;
    const lineX = this.defendGoalX - sign * CONFIG.ai.keeperDepth;
    // 只覆盖近门柱一侧（0.55 比例），远门柱留出射门角度。
    // 若完全镜像球的 z，守门员会跟着射门轨迹实时移动，球门变成无懈可击（实测双方都进不了球）。
    // 全量跟随球的横向位置（不是 0.55 比例）。
    // 关键：守门员速度只有 3.2 m/s，远慢于带球者（5.9 m/s）——
    //   慢速带球：守门员有足够时间横移到位，正好挡在球与球门之间 → 挡下；
    //   快速远角射门：球 0.5s 就到位，守门员只能横移 ~1.7m，够不到远角 → 进球。
    // 所以「全量跟随」同时封住带球突破、又保留远角射门空间；
    // 而按 0.55 比例跟球时守门员反而挡不住带球（实测 AI 直接带球进网）。
    const trackZ = clamp(ball.pos.z, -CONFIG.ai.keeperTrack, CONFIG.ai.keeperTrack);

    const move: MoveIntent = { forward: 0, right: 0, yaw: this.yaw, jump: false, sprint: false };
    let kick: KickCmd | null = null;

    // 球贴近本方球门 → 出击抢球。
    // 必须存在：否则球滚到门线死角停下后，按门线站位 + 小解围半径永远够不到
    // （实测球停在 (21.8,-3.3)，守门员距离 2.2 > 解围半径 1.7，静止 18 秒变成死球）。
    const dGoal = Math.hypot(ball.pos.x - this.defendGoalX, ball.pos.z);
    const rushing = dGoal < CONFIG.ai.keeperRush;

    // 朝目标点移动
    const target = rushing ? v3(ball.pos.x, 0, ball.pos.z) : v3(lineX, 0, trackZ);
    const d = distXZ(self, target);
    const aim = aimAngles(self, target);
    this.yaw = aim.yaw;
    move.forward = d > 0.4 ? 1 : 0;
    move.sprint = d > 3;

    // 球进入解围半径 → 朝远离自家球门的方向踢出。
    // 半径必须用 keeperReach 而非 controlRange：后者 1.7 会让「跟球 + 解围」覆盖整条门线。
    if (distXZ(self, ball.pos) < CONFIG.ai.keeperReach && this.kickCd <= 0) {
      const clearTo = v3(-sign * CONFIG.pitch.halfLength, 0, ball.pos.z * 0.3);
      const dir = kickDirToward(ball.pos, clearTo, 0.35);
      kick = { dir, power: CONFIG.kick.maxPower * 0.9 };
      this.kickCd = 0.8;
    }

    move.yaw = this.yaw;
    this.char.update(dt, move);
    return { kick, kicked: kick !== null };
  }
}

/** 带球辅助：球贴脚时把它「吸附」到玩家/前锋身前（否则球会被落下） */
export function dribbleAssist(
  char: Character,
  yaw: number,
  ball: { pos(): Vec3; vel(): Vec3; applyImpulse(imp: Vec3): void; body: { mass(): number } },
): void {
  const b = CONFIG.ball;
  const self = char.pos();
  const bp = ball.pos();
  const d = Math.hypot(bp.x - self.x, bp.z - self.z);
  const bv = ball.vel();
  const speedXZ = Math.hypot(bv.x, bv.z);
  if (d > b.dribbleRange || speedXZ > b.captureSpeed || bp.y > 1.1) return;

  const fwd = forwardXZ(yaw);
  const targetX = self.x + fwd.x * b.dribbleDist;
  const targetZ = self.z + fwd.z * b.dribbleDist;
  const pv = char.velocity();

  const desiredVx = pv.x + (targetX - bp.x) * b.dribbleStiffness;
  const desiredVz = pv.z + (targetZ - bp.z) * b.dribbleStiffness;
  const dvx = (desiredVx - bv.x) * b.dribbleGrip;
  const dvz = (desiredVz - bv.z) * b.dribbleGrip;

  const m = ball.body.mass();
  ball.applyImpulse(v3(dvx * m, 0, dvz * m));
}
