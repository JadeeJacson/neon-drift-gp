/**
 * R5 诊断 v4：hub vs ship 对照 + 出生抬升修复验证
 */
import { GameSim } from '../src/sim/game';
import { CONFIG } from '../src/core/config';

function makeInput(): any {
  return { forward: 1, right: 0, yaw: 0, pitch: 0, jump: false, sprint: true, ads: false, fire: false, weaponSwitch: 0 };
}

async function runCase(name: string, mapId: string, lift: number): Promise<void> {
  const sim = await GameSim.create(1, mapId, 'survival');
  // 手动抬升玩家出生位置（模拟修复；正常修复会写进 Player 构造器）
  if (lift > 0) {
    const t = sim.player.body.translation();
    sim.player.body.setTranslation({ x: t.x, y: t.y + lift, z: t.z }, true);
  }
  const input = makeInput();
  let freedAt = -1;
  const z0 = sim.player.pos().z;
  let firstY = -1;
  for (let i = 1; i <= 140; i++) {
    sim.step(input);
    const p = sim.player.pos();
    if (i === 1) firstY = p.y;
    if (freedAt < 0 && Math.abs(p.z - z0) > 1) freedAt = i;
  }
  const p = sim.player.pos();
  console.log(`[${name}] step1 y=${firstY.toFixed(4)}  freedAt=${freedAt < 0 ? '未' : freedAt}  终点 z=${p.z.toFixed(2)} (理想 ${(140 * CONFIG.player.sprintSpeed / 60).toFixed(1)})`);
  sim.dispose();
}

async function main(): Promise<void> {
  await runCase('ship 现状', 'ship', 0);
  await runCase('hub 现状', 'hub', 0);
  await runCase('yard 现状', 'yard', 0);
  console.log('');
  await runCase('ship +2cm', 'ship', 0.02);
  await runCase('ship +5cm', 'ship', 0.05);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
