/** 诊断：复现「打到一半卡住、敌人消失」——打印卡住敌人的位置与位移历史 */
import { CONFIG } from '../src/core/config';
import { GameSim } from '../src/sim/game';
import { emptyInput } from '../src/sim/types';
import { hasLineOfSight } from '../src/sim/shooting';
import { mulberry32 } from '../src/sim/rng';
import { distXZ } from '../src/sim/vecmath';

const DT = CONFIG.physics.fixedDt;
const seed = Number(process.argv[2] ?? 4);
const steps = Number(process.argv[3] ?? 12000);

const sim = await GameSim.create(seed);
const input = emptyInput();
const rand = mulberry32(seed * 7919 + 13);
input.slot = 1;

const hist = new Map<number, { x: number; z: number }>();
let stuckTimer = 0;
let strafeSign = 1;
let strafeHold = 0;
let prevX = 0;
let prevZ = 0;

console.log(`seed=${seed} steps=${steps}`);

for (let i = 0; i < steps; i++) {
  const p = sim.player.pos();
  const eye = sim.player.eye();

  // 选最近有视线的敌人（与 bot 一致）
  let vis: { id: number; pos: { x: number; y: number; z: number }; d: number; h: number } | null = null;
  let anyT: { id: number; pos: { x: number; y: number; z: number }; d: number; h: number } | null = null;
  for (const e of sim.enemyViews()) {
    if (!e.alive) continue;
    const d = distXZ(e.pos, p);
    const ap = { x: e.pos.x, y: e.pos.y + 0.15 * e.scale, z: e.pos.z };
    const los = hasLineOfSight(sim.world, eye, ap, sim.player.collider, sim.player.body, e.colliderHandle);
    const c = { id: e.id, pos: e.pos, d, h: e.colliderHandle };
    if (!anyT || d < anyT.d) anyT = c;
    if (los && (!vis || d < vis.d)) vis = c;
  }
  const t = vis ?? anyT;

  if (!t) {
    input.forward = 0;
    input.right = 0;
    input.fire = false;
  } else {
    const dx = t.pos.x - eye.x;
    const dy = t.pos.y + 0.15 - eye.y;
    const dz = t.pos.z - eye.z;
    const l = Math.hypot(dx, dy, dz);
    input.yaw = Math.atan2(-dx, -dz);
    input.pitch = Math.asin(dy / l);
    if (!vis) {
      if (strafeHold > 0) strafeHold -= DT;
      if (stuckTimer > 0.4 && strafeHold <= 0) {
        strafeSign *= -1;
        strafeHold = 1.4;
        stuckTimer = 0;
      }
      input.forward = 1;
      input.right = strafeSign * (strafeHold > 0 ? 1 : 0.35);
      input.fire = false;
    } else {
      const d = t.d;
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
      input.fire = true;
      input.reload = sim.snapshot().ammo === 0;
    }
  }
  void rand;

  sim.step(input);

  const pp = sim.player.pos();
  const moved = Math.hypot(pp.x - prevX, pp.z - prevZ);
  prevX = pp.x;
  prevZ = pp.z;
  if (moved < 0.008) stuckTimer += DT;
  else stuckTimer = 0;

  if (i % 1200 === 0 || i === steps - 1) {
    console.log(
      `\n[t=${sim.time.toFixed(1)}s] wave=${sim.snapshot().wave} alive=${sim.redAlive()} kills=${sim.stats.kills} hp=${sim.player.hp.toFixed(0)} 玩家=(${pp.x.toFixed(1)}, ${pp.z.toFixed(1)})`,
    );
    for (const e of sim.enemyViews()) {
      const prev = hist.get(e.id);
      const delta = prev ? Math.hypot(e.pos.x - prev.x, e.pos.z - prev.z) : 0;
      console.log(
        `   #${e.id} ${e.kind}${e.elite ? '(E)' : ''} hp=${e.hp.toFixed(0)} d=${distXZ(e.pos, pp).toFixed(1)} ` +
          `pos=(${e.pos.x.toFixed(1)}, ${e.pos.z.toFixed(1)}) Δ20s=${delta.toFixed(2)}m`,
      );
      hist.set(e.id, { x: e.pos.x, z: e.pos.z });
    }
  }
}
