/**
 * 调参诊断：按 actor 分辨踢球者，逐采样打印球/玩家/前锋位置与 bot 状态标志。
 * 用于「进球数不对 / 某段时间球不动」这类问题定位——先看数据再改代码。
 * bot 策略与 bot-run.ts 共用 tools/bot-policy.ts，避免两边逻辑漂移。
 *
 * 用法：
 *   npm run trace -- idle [秒] [采样间隔]
 *   npm run trace -- bot  [秒] [采样间隔]
 */
import { CONFIG } from '../src/core/config';
import { GameSim } from '../src/sim/game';
import { emptyInput } from '../src/sim/types';
import { seekBehind } from '../src/sim/ai';
import { distXZ, v3 } from '../src/sim/vecmath';
import { driveBot, newBotState } from './bot-policy';

const DT = CONFIG.physics.fixedDt;
const P = CONFIG.pitch;
const mode = process.argv[2] === 'idle' ? 'idle' : 'bot';
const SECONDS = Number(process.argv[3] ?? 120);
const SAMPLE = Number(process.argv[4] ?? 0.5);

const sim = await GameSim.create(1);
const input = emptyInput();
const st = newBotState();
const kickByActor: Record<string, number> = {};
let goals = 0;

console.log(`mode=${mode} 时长=${SECONDS}s`);

for (let i = 0; i < Math.round(SECONDS / DT); i++) {
  if (mode === 'bot') driveBot(sim, input, st);
  const evs = sim.step(mode === 'bot' ? input : emptyInput());

  for (const e of evs) {
    if (e.type === 'kick') kickByActor[e.actor] = (kickByActor[e.actor] ?? 0) + 1;
    if (e.type === 'goal') {
      goals++;
      console.log(`  >>> GOAL ${e.team}  t=${sim.time.toFixed(1)}s  ${e.scoreBlue}:${e.scoreRed}`);
    }
  }

  if (i % Math.round(SAMPLE / DT) === 0) {
    const b = sim.ball.pos();
    const p = sim.player.pos();
    const s = sim.striker.char.pos();
    const rk = sim.keeper.char.pos();
    const bk = sim.blueKeeper.char.pos();
    const cz = rk.z >= 0 ? -2.9 : 2.9;
    const seek = seekBehind(p, b, v3(P.halfLength, 0, cz), 0.75);
    console.log(
      `t=${sim.time.toFixed(1)}s ${sim.scoreBlue}:${sim.scoreRed} ` +
        `ball=(${b.x.toFixed(1)},${b.z.toFixed(1)}) spd=${sim.ball.speed().toFixed(1)} | ` +
        `player=(${p.x.toFixed(1)},${p.z.toFixed(1)}) d=${distXZ(p, b).toFixed(2)} ` +
        `al=${seek.aligned ? 1 : 0} fb=${seek.fallback ? 1 : 0} push=${st.pushing ? 1 : 0} kick=${input.kick ? 1 : 0} | ` +
        `striker=(${s.x.toFixed(1)},${s.z.toFixed(1)}) bK=(${bk.x.toFixed(1)},${bk.z.toFixed(1)})`,
    );
  }
}

console.log(`\n=== 汇总 mode=${mode} ===`);
console.log(`比分 ${sim.scoreBlue}:${sim.scoreRed}  进球 ${goals}`);
console.log(`踢球次数（按 actor）：`, kickByActor);
sim.dispose();
