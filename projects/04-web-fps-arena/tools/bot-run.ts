/**
 * bot 跑分 —— Node 直跑 sim 层（不进浏览器）。
 *
 * sim 层零 three / 零 DOM 的全部意义就在这里：平衡数值第一次有了客观判据，
 * 不用靠「我感觉这波怪有点多」。
 *
 *   npm run bot
 *
 * 两组 bot：
 *   完美 bot —— 100% 瞄准、无反应延迟。它的作用是证明「这局是可通关的」。
 *   人类 bot —— 瞄准抖动 + 换目标反应延迟。它的作用才是回答「对真人难度如何」。
 *
 * 只用完美 bot 测平衡是自欺：它枪枪命中，会把任何难度都打成通关。
 */
import { CONFIG } from '../src/core/config';
import { GameSim } from '../src/sim/game';
import { emptyInput, type GameInput } from '../src/sim/types';
import { hasLineOfSight } from '../src/sim/shooting';
import { mulberry32 } from '../src/sim/rng';
import { distXZ, len, sub } from '../src/sim/vecmath';
import type { EnemyView } from '../src/sim/types';

const DT = CONFIG.physics.fixedDt;
const MAX_STEPS = Math.round((60 * 8) / DT); // 8 分钟硬上限

interface RunResult {
  seed: number;
  phase: string;
  time: number;
  wave: number;
  kills: number;
  shots: number;
  hits: number;
  accuracy: number;
  hp: number;
  waveTimes: number[];
}

interface BotOpts {
  passive: boolean;
  slot: number;
  /** 瞄准抖动（弧度）—— 模拟人类手抖 */
  jitter: number;
  /** 换目标的反应延迟（秒） */
  reaction: number;
  label: string;
}

const PERFECT: BotOpts = { passive: false, slot: 1, jitter: 0, reaction: 0, label: '完美' };
const HUMAN: BotOpts = { passive: false, slot: 1, jitter: 0.045, reaction: 0.28, label: '人类' };

/** 由 from 指向 to 所需的 yaw / pitch（与 dirFromAngles 约定一致） */
function aimAt(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }) {
  const d = sub(to, from);
  const l = len(d);
  if (l < 1e-6) return { yaw: 0, pitch: 0 };
  return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.asin(d.y / l) };
}

/**
 * 选目标：优先「有视线的最近敌人」。
 * 没有视线感知的 bot 会对着掩体打空整个弹匣 —— 那样测出来的命中率毫无意义。
 */
function pickTarget(sim: GameSim): { view: EnemyView; dist: number; los: boolean } | null {
  const p = sim.player.pos();
  const eye = sim.player.eye();
  let visible: { view: EnemyView; dist: number; los: boolean } | null = null;
  let any: { view: EnemyView; dist: number; los: boolean } | null = null;

  for (const e of sim.enemyViews()) {
    if (!e.alive) continue;
    const d = distXZ(e.pos, p);
    const aimPoint = { x: e.pos.x, y: e.pos.y + 0.15 * e.scale, z: e.pos.z };
    // 贴脸豁免（与 sim 的敌人 AI 同一条规则）：3m 内不判视线
    const los =
      d < 3 ||
      hasLineOfSight(
        sim.world,
        eye,
        aimPoint,
        sim.player.collider,
        sim.player.body,
        e.colliderHandle,
      );
    const cand = { view: e, dist: d, los };
    if (!any || d < any.dist) any = cand;
    if (los && (!visible || d < visible.dist)) visible = cand;
  }
  return visible ?? any;
}

interface BotState {
  prevX: number;
  prevZ: number;
  stuckTimer: number;
  strafeSign: number;
  strafeHold: number;
  lastTargetId: number;
  reactionTimer: number;
}

const newBotState = (): BotState => ({
  prevX: 0,
  prevZ: 0,
  stuckTimer: 0,
  strafeSign: 1,
  strafeHold: 0,
  lastTargetId: -1,
  reactionTimer: 0,
});

function driveBot(sim: GameSim, input: GameInput, opts: BotOpts, st: BotState, rand: () => number): void {
  input.slot = opts.slot;
  const target = pickTarget(sim);

  if (opts.passive || !target) {
    input.forward = 0;
    input.right = 0;
    input.fire = false;
    input.reload = false;
    input.sprint = false;
    input.jump = false;
    return;
  }

  const eye = sim.player.eye();
  const aimPoint = {
    x: target.view.pos.x,
    y: target.view.pos.y + 0.15 * target.view.scale,
    z: target.view.pos.z,
  };
  const aim = aimAt(eye, aimPoint);
  input.yaw = aim.yaw + (rand() * 2 - 1) * opts.jitter;
  input.pitch = aim.pitch + (rand() * 2 - 1) * opts.jitter;

  // 换目标需要反应时间（人类 bot 的主要劣势来源）
  if (target.view.id !== st.lastTargetId) {
    st.lastTargetId = target.view.id;
    st.reactionTimer = opts.reaction;
  }

  const d = target.dist;

  // 没有视线：推进找角度，撞住了就沿障碍绕
  if (!target.los) {
    if (st.strafeHold > 0) st.strafeHold -= DT;
    if (st.stuckTimer > 0.4 && st.strafeHold <= 0) {
      st.strafeSign *= -1;
      st.strafeHold = 1.4;
      st.stuckTimer = 0;
    }
    // 近距离却打不到（被掩体角擦边挡住）：先拉开距离，别顶着敌人卡死
    input.forward = d < 4 ? -1 : 1;
    input.right = st.strafeSign * (st.strafeHold > 0 ? 1 : 0.35);
    input.fire = false;
    input.reload = sim.snapshot().ammo === 0;
    input.sprint = false;
    input.jump = false;
    return;
  }

  if (d < 5) {
    input.forward = -1;
    input.right = 0.7;
  } else if (d > 13) {
    input.forward = 1;
    input.right = 0;
  } else {
    input.forward = 0;
    input.right = 0.5;
  }

  const snap = sim.snapshot();
  const lowAmmo = snap.ammo <= Math.max(1, Math.round(snap.magazine * 0.2));
  if (snap.ammo === 0 || (lowAmmo && d > 8)) {
    input.reload = true;
    input.fire = false;
  } else {
    input.reload = false;
    input.fire = st.reactionTimer <= 0 && d < 40;
  }
}

async function run(seed: number, opts: BotOpts): Promise<RunResult> {
  const sim = await GameSim.create(seed);
  const input = emptyInput();
  const st = newBotState();
  const rand = mulberry32(seed * 7919 + 13);
  const trace = process.env.BOT_TRACE === String(seed);
  const waveTimes: number[] = [];
  let lastWave = 0;
  let steps = 0;
  let nan = false;

  while (sim.phase === 'ready' || sim.phase === 'playing') {
    if (steps >= MAX_STEPS) break;
    if (st.reactionTimer > 0) st.reactionTimer -= DT;
    driveBot(sim, input, opts, st, rand);
    sim.step(input);
    steps += 1;

    const snap = sim.snapshot();
    if (snap.wave !== lastWave) {
      lastWave = snap.wave;
      waveTimes.push(sim.time);
    }
    if (trace && steps % 600 === 0) {
      const pos = sim.player.pos();
      console.log(
        `    [t=${sim.time.toFixed(1)}] wave=${snap.wave} alive=${snap.enemiesAlive} ` +
          `kills=${sim.stats.kills} hp=${snap.hp.toFixed(0)} ammo=${snap.ammo}/${snap.magazine} ` +
          `reload=${snap.reloading} pos=(${pos.x.toFixed(1)}, ${pos.z.toFixed(1)})`,
      );
      for (const e of sim.enemyViews()) {
        console.log(
          `       敌 #${e.id} ${e.kind}${e.elite ? '(E)' : ''} hp=${e.hp.toFixed(0)} ` +
            `d=${distXZ(e.pos, pos).toFixed(1)} pos=(${e.pos.x.toFixed(1)}, ${e.pos.z.toFixed(1)}) ` +
            `windup=${e.windup.toFixed(2)}`,
        );
      }
    }
    const p = sim.player.pos();
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.z)) nan = true;
  }

  const snap = sim.snapshot();
  const res: RunResult = {
    seed,
    phase: sim.phase,
    time: sim.time,
    wave: snap.wave,
    kills: sim.stats.kills,
    shots: sim.stats.shots,
    hits: sim.stats.hits,
    accuracy: snap.accuracy,
    hp: snap.hp,
    waveTimes,
  };
  if (nan) res.phase = 'NaN';
  sim.dispose();
  return res;
}

const TOTAL_ENEMIES = CONFIG.waves.reduce((n, w) => n + w.grunt + w.rusher + w.sniper + w.elite, 0);
const SEEDS = [1, 2, 3, 4, 5];

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, detail = '') => {
  if (ok) {
    pass += 1;
    console.log(`  PASS  ${name}${detail ? '  — ' + detail : ''}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${name}${detail ? '  — ' + detail : ''}`);
  }
};

async function batch(opts: BotOpts, seeds: number[]): Promise<RunResult[]> {
  const out: RunResult[] = [];
  for (const seed of seeds) {
    const r = await run(seed, opts);
    out.push(r);
    console.log(
      `  seed ${seed}: ${r.phase.padEnd(7)} t=${r.time.toFixed(1)}s wave=${r.wave} ` +
        `kills=${r.kills}/${TOTAL_ENEMIES} acc=${(r.accuracy * 100).toFixed(1)}% hp=${r.hp.toFixed(0)}`,
    );
  }
  return out;
}

console.log('=== 04 火线 · bot 跑分 ===');
console.log(`敌人总数（配置推导）: ${TOTAL_ENEMIES}\n`);

// ---- A. 完美 bot：证明可通关 ----
console.log(`--- A 完美 bot（${PERFECT.label}：零抖动、零反应延迟） ---`);
const perfect = await batch(PERFECT, SEEDS);
const pWins = perfect.filter((r) => r.phase === 'won');
console.log('');
check('A1 完美 bot 通关率 100%（证明这一局是可通关的）', pWins.length === SEEDS.length, `${pWins.length}/${SEEDS.length}`);
check('A2 无 NaN 位置', perfect.every((r) => r.phase !== 'NaN'));
check(
  'A3 通关局击杀数 = 敌人总数',
  pWins.every((r) => r.kills === TOTAL_ENEMIES),
  `配置 ${TOTAL_ENEMIES}`,
);

// ---- B. 人类 bot：真正的难度判据 ----
console.log(`\n--- B 人类 bot（抖动 ${HUMAN.jitter} rad、反应 ${HUMAN.reaction}s） ---`);
const human = await batch(HUMAN, SEEDS);
const hWins = human.filter((r) => r.phase === 'won');
const hRate = hWins.length / SEEDS.length;
console.log('');
check(
  'B1 人类 bot 通关率 20%–80%（太容易=无挑战，太难=劝退）',
  hRate >= 0.2 && hRate <= 0.8,
  `${hWins.length}/${SEEDS.length} = ${(hRate * 100).toFixed(0)}%`,
);
const hAcc = human.map((r) => r.accuracy);
check(
  'B2 人类 bot 命中率 40%–85%（落在真人区间，验证抖动参数合理）',
  hAcc.every((a) => a >= 0.4 && a <= 0.85),
  hAcc.map((a) => (a * 100).toFixed(0) + '%').join(' / '),
);
check(
  'B3 人类 bot 至少推进到第 3 波',
  human.some((r) => r.wave >= 3),
  '最高波次 ' + Math.max(...human.map((r) => r.wave)),
);

// ---- C. 时长 ----
console.log('\n--- C 单局时长 ---');
const allTimes = [...pWins, ...hWins].map((r) => r.time);
const lo = allTimes.length ? Math.min(...allTimes) : 0;
const hi = allTimes.length ? Math.max(...allTimes) : 0;
console.log(`  通关时长 ${lo.toFixed(0)}s – ${hi.toFixed(0)}s（完美 / 人类合并）`);
check(
  'C1 通关时长 100–360s（1.7–6 分钟）',
  allTimes.length > 0 && lo >= 100 && hi <= 360,
  `${lo.toFixed(0)}s – ${hi.toFixed(0)}s`,
);

// ---- D. 确定性 ----
console.log('\n--- D 确定性（同 seed 两次） ---');
const d1 = await run(7, PERFECT);
const d2 = await run(7, PERFECT);
check(
  'D1 同 seed 两次结果逐项一致',
  d1.phase === d2.phase &&
    d1.kills === d2.kills &&
    d1.shots === d2.shots &&
    d1.hits === d2.hits &&
    Math.abs(d1.time - d2.time) < 1e-9,
  `${d1.phase}/${d1.kills}杀/${d1.shots}发 vs ${d2.phase}/${d2.kills}杀/${d2.shots}发`,
);

// ---- E. 敌人威胁 ----
console.log('\n--- E 被动 bot（不移动、不开火） ---');
const passive = await run(11, { ...PERFECT, passive: true, label: '被动' });
console.log(`  seed 11: ${passive.phase} t=${passive.time.toFixed(1)}s hp=${passive.hp.toFixed(0)}`);
check(
  'E1 被动 bot 会死（证明敌人有威胁，不是站桩靶场）',
  passive.phase === 'lost',
  `终态 ${passive.phase}，剩余 HP ${passive.hp.toFixed(0)}`,
);

console.log(`\n=== 汇总：${pass} 通过 / ${fail} 失败 ===`);
process.exit(fail === 0 ? 0 : 1);
