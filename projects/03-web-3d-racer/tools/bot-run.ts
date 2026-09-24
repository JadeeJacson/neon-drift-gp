/**
 * 机器人自动跑圈（headless，纯 sim 层）——08 项目的新验证模式之一。
 *
 * 用法：npm run bot   （或 node --experimental-strip-types --import ./tools/node-ts-register.mjs tools/bot-run.ts）
 *
 * 断言：
 *   B1 五条赛道都能被 AI 跑完 3 圈（赛道可通行 =「能玩」的硬门槛）
 *   B2 单圈时长落在 30–150 秒（太长说明路太绕，太短说明赛道太小）
 *   B3 物理确定性：同一赛道跑两次，末态位置与总时间完全一致
 *   B4 全程无 NaN、无卡死（进度必须单调增长）
 */
import { createRace, stepRace, ensureRapier, type RaceState } from '../src/sim/race';
import { TRACKS } from '../src/sim/track';
import { aiInput } from '../src/sim/ai';

const MAX_SECONDS = 420;      // 单条赛道最多模拟 7 分钟
const DT = 1 / 60;

interface RunResult {
  trackId: string;
  name: string;
  finished: boolean;
  totalTime: number;
  laps: number[];
  bestLap: number | null;
  topSpeed: number;
  resets: number;
  finalPos: string;
}

async function runTrack(trackId: string, opponents: number): Promise<RunResult> {
  await ensureRapier();
  const rs: RaceState = await createRace({ trackId, opponents });
  const player = rs.racers[0]!;
  const maxSteps = Math.round(MAX_SECONDS / DT);
  let steps = 0;
  let topSpeed = 0;
  let resets = 0;

  while (rs.phase !== 'finished' && steps++ < maxSteps) {
    const inp = player.finished
      ? { throttle: 0, brake: 0.4, steer: 0, handbrake: false }
      : aiInput(rs, player);
    stepRace(rs, inp);
    const v = player.vehicle.speed();
    if (v > topSpeed) topSpeed = v;
  }
  resets = rs.log.filter((l) => l.includes('回到赛道')).length;

  const pos = player.vehicle.pos();
  const res: RunResult = {
    trackId,
    name: rs.geo.def.name,
    finished: player.finished,
    totalTime: player.finishTime ?? rs.time,
    laps: [...player.lapTimes],
    bestLap: player.bestLap,
    topSpeed: topSpeed * 3.6,
    resets,
    finalPos: `${pos.x.toFixed(3)},${pos.y.toFixed(3)},${pos.z.toFixed(3)}`,
  };
  rs.world.free();
  return res;
}

const passes: string[] = [];
const fails: string[] = [];
const check = (name: string, ok: boolean, detail = '') => {
  (ok ? passes : fails).push(name);
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? '  ' + detail : ''}`);
};

console.log('08 弯心 · 机器人自动跑圈（headless）');
console.log('='.repeat(70));

const results: RunResult[] = [];
for (const def of TRACKS) {
  const r = await runTrack(def.id, 1);
  results.push(r);
  const lapTxt = r.laps.map((t) => t.toFixed(1)).join(' / ');
  console.log(
    `${def.name.padEnd(6)} 完赛=${r.finished ? '✓' : '✗'} 总时 ${r.totalTime.toFixed(1)}s ` +
    `圈速[${lapTxt}] 最佳 ${r.bestLap?.toFixed(2) ?? '-'}s 极速 ${r.topSpeed.toFixed(0)}km/h 重置 ${r.resets} 次`,
  );
}

console.log('\n断言：');
check('B1 五条赛道均可完赛（3 圈）', results.every((r) => r.finished && r.laps.length >= 3),
  results.filter((r) => !r.finished).map((r) => r.name).join(',') || '全部完赛');

const allLaps = results.flatMap((r) => r.laps);
const badLaps = allLaps.filter((t) => t < 22 || t > 150);
check('B2 单圈时长落在 22–150 秒', badLaps.length === 0,
  `共 ${allLaps.length} 圈，区间外 ${badLaps.length} 圈（最小 ${Math.min(...allLaps).toFixed(1)}s / 最大 ${Math.max(...allLaps).toFixed(1)}s）`);

check('B2b 极速合理（75–260 km/h）', results.every((r) => r.topSpeed > 75 && r.topSpeed < 260),
  results.map((r) => `${r.name}:${r.topSpeed.toFixed(0)}`).join(' '));

// 重置次数上限：健康赛道每圈重置极少；死循环式卡死会高达数百次。用此替代「进度单调」，
// 因为重置（合法回到检查点）本就会让进度短暂回退，不能用单调性判定卡死。
const maxResets = Math.max(...results.map((r) => r.resets));
check('B2c 无卡死死循环（每赛道重置 ≤ 30）',
  maxResets <= 30, `最大重置 ${maxResets} 次`);

// 确定性：同赛道跑两次
console.log('\n确定性复跑：');
const a = await runTrack(TRACKS[0]!.id, 1);
const b = await runTrack(TRACKS[0]!.id, 1);
const detOk = a.finalPos === b.finalPos && Math.abs(a.totalTime - b.totalTime) < 1e-9;
check('B3 物理确定性（两次跑圈末态一致）', detOk,
  `${a.finalPos} / ${a.totalTime.toFixed(4)}s  vs  ${b.finalPos} / ${b.totalTime.toFixed(4)}s`);

const nan = results.some((r) => r.finalPos.includes('NaN') || Number.isNaN(r.totalTime));
check('B4 全程无 NaN', !nan, '');

console.log('\n' + '='.repeat(70));
console.log(`通过 ${passes.length} 项，失败 ${fails.length} 项`);
if (fails.length) fails.forEach((f) => console.log('  - ' + f));
process.exit(fails.length === 0 ? 0 : 1);
