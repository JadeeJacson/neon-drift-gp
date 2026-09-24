/** 诊断脚本：查「敌人为什么不接近玩家」——不做断言，只打印事实 */
import { GameSim } from '../src/sim/game';
import { emptyInput } from '../src/sim/types';
import { distXZ } from '../src/sim/vecmath';

const seed = Number(process.argv[2] ?? 1);
const steps = Number(process.argv[3] ?? 1800);

const sim = await GameSim.create(seed);
const input = emptyInput();
input.slot = 1;

console.log(`seed=${seed}  步数=${steps}`);
let last = new Map<number, { x: number; z: number }>();

for (let i = 0; i < steps; i++) {
  // bot 原地不动，只观察
  input.fire = false;
  sim.step(input);

  if (i % 300 === 0 || i === steps - 1) {
    const p = sim.player.pos();
    console.log(
      `\n[t=${sim.time.toFixed(1)}s] 玩家 pos=(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}) hp=${sim.player.hp.toFixed(0)} wave=${sim.snapshot().wave} alive=${sim.aliveCount()}`,
    );
    for (const e of sim.enemyViews()) {
      const prev = last.get(e.id);
      const moved = prev ? Math.hypot(e.pos.x - prev.x, e.pos.z - prev.z) : 0;
      const total = prev ? moved : 0;
      console.log(
        `   #${e.id} ${e.kind}${e.elite ? '(E)' : ''} hp=${e.hp.toFixed(0)}/${e.maxHp} ` +
          `d=${distXZ(e.pos, p).toFixed(1)}m pos=(${e.pos.x.toFixed(1)}, ${e.pos.y.toFixed(1)}, ${e.pos.z.toFixed(1)}) ` +
          `Δ5s=${total.toFixed(2)}m windup=${e.windup.toFixed(2)} fade=${e.fade.toFixed(2)}`,
      );
      last.set(e.id, { x: e.pos.x, z: e.pos.z });
    }
  }
}
void 0;
