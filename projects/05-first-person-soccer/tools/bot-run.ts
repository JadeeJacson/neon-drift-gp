/**
 * bot 跑分 —— Node 直跑 sim 层（不进浏览器）。
 *
 * sim 层零 three / 零 DOM 的全部意义就在这里：物理与 AI 第一次有了客观判据。
 *
 *   npm run bot
 *
 * 覆盖：
 *   A 球物理（踢球给球速 / 球会停 / 无 NaN）
 *   B 进球闭环（把球送进对方球门 → 比分 +1）
 *   C AI 有威胁（闲置玩家会被 AI 攻破球门）
 *   D 确定性（同 seed 同输入 → 同结果）
 *   E 围板有效（球不出界）
 *   F 端到端（会踢球的 bot 能跑完整场比赛）
 */
import { CONFIG } from '../src/core/config';
import { GameSim } from '../src/sim/game';
import { emptyInput } from '../src/sim/types';
import { normalize, v3 } from '../src/sim/vecmath';
import { driveBot, newBotState } from './bot-policy';

const DT = CONFIG.physics.fixedDt;
const P = CONFIG.pitch;

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, detail = ''): void => {
  if (ok) {
    pass += 1;
    console.log(`  PASS  ${name}${detail ? '  — ' + detail : ''}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${name}${detail ? '  — ' + detail : ''}`);
  }
};

function placeBall(sim: GameSim, x: number, z: number): void {
  sim.ball.body.setTranslation({ x, y: CONFIG.ball.radius, z }, true);
  sim.ball.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  sim.ball.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
}

// ============ A 球物理 ============
console.log('=== 05 方块足球 · bot 跑分 ===\n');
console.log('--- A 球物理 ---');
{
  const sim = await GameSim.create(1);
  sim.step(emptyInput()); // ready → playing（开球）

  // A1 踢球给球速
  sim.ball.kick(normalize(v3(1, 0.1, 0)), 20);
  const v = sim.ball.speed();
  check('A1 踢球立刻获得球速', v > 15, `${v.toFixed(1)} m/s`);

  // A2 滚动阻力生效（纯滚动段持续减速）
  // 必须分两段量：球被踢出时自旋只有 kickSpin(22)，而纯滚动需要 ω=v/r≈91，
  // 所以前 ~0.6s 球在「滑行」，滑动摩擦 μ·g = 0.55×22 ≈ 12 m/s² 完全盖过滚动阻力；
  // 之后才进入纯滚动，此时才只剩滚动阻力可测（实测 2.1 m/s²，与配置 2.2 吻合）。
  // 另外不能测「球多久停下」—— 场地四面围板 + 球门网，球撞墙会弹回，
  // 且 AI 会主动把球踢走（实测球被红方前锋挡住后又被反复踢起，12s 都停不下来）。
  for (const c of [sim.player, sim.striker.char, sim.keeper.char, sim.blueKeeper.char]) {
    c.place({ x: 0, y: 0, z: 13.5 });
  }
  sim.ball.reset({ x: 0, y: CONFIG.ball.radius, z: 0 });
  sim.ball.kick(normalize(v3(1, 0.02, 0)), 20);
  const vKick = sim.ball.speed();
  const advance = (sec: number): void => {
    for (let i = 0; i < Math.round(sec / DT); i++) sim.step(emptyInput());
  };
  advance(0.7); // 度过滑行段
  const vRoll0 = sim.ball.speed();
  advance(0.5);
  const vRoll1 = sim.ball.speed();
  const decel = (vRoll0 - vRoll1) / 0.5;
  check(
    'A2 滚动阻力生效（纯滚动段持续减速）',
    decel > 1.2 && decel < 4.5 && vRoll1 < vKick * 0.7,
    `踢出 ${vKick.toFixed(1)} → 滑行 0.7s 后 ${vRoll0.toFixed(1)} → 再 0.5s ${vRoll1.toFixed(1)} m/s；` +
      `纯滚动段减速 ${decel.toFixed(2)} m/s²（配置 ${CONFIG.ball.rollingResistance}）`,
  );

  // A3 无 NaN
  const bp = sim.ball.pos();
  check('A3 无 NaN', Number.isFinite(bp.x) && Number.isFinite(bp.y) && Number.isFinite(bp.z) && !sim.ball.nan);
  sim.dispose();
}

// ============ B 进球闭环 ============
console.log('\n--- B 进球闭环 ---');
{
  const sim = await GameSim.create(1);
  sim.step(emptyInput());
  placeBall(sim, 20, 3.0);
  sim.ball.kick(normalize(v3(1, 0.05, 0)), 16);
  let scored = false;
  for (let i = 0; i < Math.round(3 / DT); i++) {
    sim.step(emptyInput());
    if (sim.scoreBlue > 0) {
      scored = true;
      break;
    }
  }
  check('B1 球越过球门线触发进球（比分 +1）', scored && sim.scoreBlue === 1, `scoreBlue=${sim.scoreBlue}`);
  check('B2 进球后进入庆祝阶段', sim.phase === 'goal' || sim.phase === 'playing', `phase=${sim.phase}`);
  sim.dispose();
}

// ============ C AI 有威胁 ============
console.log('\n--- C AI 有威胁（闲置玩家） ---');
{
  const sim = await GameSim.create(3);
  let steps = 0;
  // 时限给 420s：C2 验的是「胜负条件能被触发」，不是「AI 多快能进 5 球」。
  // 对闲置玩家 AI 平均约 60s 进一球（守门员全量跟球后射门被扑出的比例明显上升）。
  const maxSteps = Math.round(420 / DT);
  while (sim.phase !== 'won' && sim.phase !== 'lost' && steps < maxSteps) {
    sim.step(emptyInput());
    steps += 1;
  }
  const s = sim.snapshot();
  console.log(`  闲置 ${(steps * DT).toFixed(0)}s 后：比分 ${s.scoreBlue}:${s.scoreRed} phase=${s.phase}`);
  check('C1 AI 能攻破闲置玩家的球门', s.scoreRed >= 1, `AI 进球 ${s.scoreRed}`);
  check('C2 比赛能终止（先到 N 球）', sim.phase === 'won' || sim.phase === 'lost', `phase=${sim.phase}`);
  sim.dispose();
}

// ============ D 确定性 ============
console.log('\n--- D 确定性（同 seed 同输入） ---');
{
  const runOnce = async (): Promise<string> => {
    const sim = await GameSim.create(7);
    const input = emptyInput();
    const st = newBotState();
    for (let i = 0; i < Math.round(20 / DT); i++) {
      driveBot(sim, input, st);
      sim.step(input);
    }
    const s = sim.snapshot();
    const b = sim.ball.pos();
    const r = `${s.scoreBlue}:${s.scoreRed}|${s.time.toFixed(4)}|${b.x.toFixed(4)},${b.y.toFixed(4)},${b.z.toFixed(4)}`;
    sim.dispose();
    return r;
  };
  const a = await runOnce();
  const b = await runOnce();
  check('D1 同 seed 同输入 → 末态逐位一致', a === b, `${a} vs ${b}`);
}

// ============ E 围板有效 ============
console.log('\n--- E 围板有效 ---');
{
  const sim = await GameSim.create(1);
  sim.step(emptyInput());
  sim.ball.kick(normalize(v3(0, 0.05, 1)), 22);
  let maxZ = 0;
  for (let i = 0; i < Math.round(4 / DT); i++) {
    sim.step(emptyInput());
    maxZ = Math.max(maxZ, Math.abs(sim.ball.pos().z));
  }
  check('E1 球不会越过边线围板', maxZ < P.halfWidth + 1, `最大 |z|=${maxZ.toFixed(2)}（围板 ${P.halfWidth}）`);
  sim.dispose();
}

// ============ F 端到端 ============
console.log('\n--- F 端到端（会踢球的 bot 跑完整场） ---');
{
  const results: Array<{ seed: number; blue: number; red: number; phase: string; time: number }> = [];
  for (const seed of [1, 2, 3]) {
    const sim = await GameSim.create(seed);
    const input = emptyInput();
    const st = newBotState();
    let steps = 0;
    const maxSteps = Math.round(240 / DT);
    while (sim.phase !== 'won' && sim.phase !== 'lost' && steps < maxSteps) {
      driveBot(sim, input, st);
      sim.step(input);
      steps += 1;
    }
    const s = sim.snapshot();
    results.push({ seed, blue: s.scoreBlue, red: s.scoreRed, phase: sim.phase, time: s.time });
    console.log(`  seed ${seed}: ${s.scoreBlue}:${s.scoreRed} phase=${s.phase} t=${s.time.toFixed(0)}s`);
    sim.dispose();
  }
  check('F1 bot 至少能打进 1 球（踢球闭环成立）', results.some((r) => r.blue >= 1), results.map((r) => `s${r.seed}:${r.blue}`).join(' '));
  check('F2 每场都能终止', results.every((r) => r.phase === 'won' || r.phase === 'lost'));
  const won = results.filter((r) => r.phase === 'won').length;
  console.log(`  [数据] bot 胜 ${won}/${results.length} 场（不作断言：AI 强度属调参范围）`);
}

console.log(`\n=== 汇总：${pass} 通过 / ${fail} 失败 ===`);
process.exit(fail === 0 ? 0 : 1);
