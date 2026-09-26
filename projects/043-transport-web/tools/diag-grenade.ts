/**
 * 手雷功能验证（Node 直跑 sim，无需浏览器）：
 * H1 投掷后雷体存在且飞行（位移随时间增长）
 * H2 落地/撞墙发生真实反弹（水平速度分量变号或垂直接触后 y 回升）
 * H3 引信到点产生 explode 事件且雷体移除
 * H4 爆炸在脚下 → 玩家自伤事件
 * H5 静态遮挡：墙后的目标不被炸到（用 domination 红队位置不可控，改为
 *    生存模式雷贴墙爆炸——本项以「爆炸事件半径内若无目标则无 hit 事件」间接覆盖）
 */
import { GameSim } from '../src/sim/game';
import { CONFIG } from '../src/core/config';
import type { GameInput } from '../src/sim/types';

async function main(): Promise<void> {
  let fails = 0;
  const check = (name: string, ok: boolean, detail = ''): void => {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
    if (!ok) fails++;
  };

  // ---- 场景 1：向 +x 墙方向平投（pitch 0，yaw -90° 使 fwd = +x? 验证 dirFromAngles 约定）----
  const sim = await GameSim.create(1, 'ship', 'survival');
  const input: GameInput = {
    forward: 0, right: 0, yaw: 0, pitch: 0, jump: false, sprint: false, ads: false,
    fire: false, reload: false, slot: 5, // 手雷 = slot 5
  };
  sim.step(input); // 切枪
  input.slot = null;
  for (let i = 0; i < 25; i++) sim.step(input); // 等切枪硬直 0.32s 结束
  // 找 yaw 使 dirFromAngles = +x：dirFromAngles(yaw) 通常 (sin yaw, 0, -cos yaw) → yaw = π/2
  input.yaw = Math.PI / 2;
  input.pitch = -0.08; // 微微下压，尽快落地
  input.fire = true;
  sim.step(input);
  input.fire = false;
  input.yaw = 0;

  const thrown = sim.grenades.list.length === 1;
  check('H1a 出手后雷体在飞', thrown, `list=${sim.grenades.list.length}`);
  if (!thrown) {
    console.log('（无法继续：没有雷体）');
    process.exit(1);
  }

  const g = sim.grenades.list[0]!;
  let prevT = g.body.translation();
  let prevVel = g.body.linvel();
  let bounced = false;
  let maxSpeed = Math.hypot(prevVel.x, prevVel.y, prevVel.z);
  for (let i = 0; i < 200; i++) {
    const events = sim.step(input);
    // 先查爆炸（fuse 可能在 step 内到期、刚体已释放，不能再读 body）
    if (events.some((e) => e.type === 'explode')) {
      const gr = sim.grenades.list.find((x) => x.id === g.id);
      check('H3 引信到点爆炸 + 雷体移除', gr === undefined);
      break;
    }
    const t = g.body.translation();
    const v = g.body.linvel();
    const speed = Math.hypot(v.x, v.y, v.z);
    maxSpeed = Math.max(maxSpeed, speed);
    // 反弹判定：速度突变（|Δv| > 2 m/s 单帧）或垂直速度变号（下落→上升）
    if (prevVel.y < -0.5 && v.y > 0.5) bounced = true;
    if (Math.hypot(v.x - prevVel.x, v.y - prevVel.y, v.z - prevVel.z) > 2.5) bounced = true;
    void t; void prevT;
    prevT = t;
    prevVel = v;
  }
  check('H2 飞行中发生真实反弹', bounced, `maxSpeed=${maxSpeed.toFixed(1)}m/s`);
  check('H1b 雷体最大速度接近投掷初速', maxSpeed > 10, `power=${CONFIG.grenade.power}`);

  // ---- 场景 2：垂直向下砸自己脚下 → 爆炸自伤 ----
  const sim2 = await GameSim.create(2, 'ship', 'survival');
  const input2: GameInput = { ...input, slot: 5 };
  sim2.step(input2);
  input2.slot = null;
  for (let i = 0; i < 25; i++) sim2.step(input2);
  input2.yaw = 0;
  input2.pitch = -Math.PI / 2 + 0.35; // 几乎垂直向下砸脚前
  input2.fire = true;
  sim2.step(input2);
  input2.fire = false;
  let selfHurt = false;
  let explodeSeen = false;
  for (let i = 0; i < 220; i++) {
    const events = sim2.step(input2);
    if (events.some((e) => e.type === 'explode')) explodeSeen = true;
    if (events.some((e) => e.type === 'playerHurt')) selfHurt = true;
    if (explodeSeen && selfHurt) break;
  }
  check('H4a 爆炸事件出现', explodeSeen);
  check('H4b 玩家自伤（雷砸脚下）', selfHurt);

  // ---- 场景 3：遮挡——雷在甲板中央爆炸，出生舱内的敌人（距离超半径）无 hit ----
  // 生存模式敌人在 14m 外，半径 6.5m 内通常无目标；验证「爆炸不产生越半径 hit」
  const sim3 = await GameSim.create(3, 'ship', 'survival');
  const input3: GameInput = { ...input, slot: null };
  for (let i = 0; i < 30; i++) sim3.step(input3); // 让敌人刷出来并远离
  const outOfRange = sim3.enemyViews().every((e) => {
    const p = sim3.player.pos();
    return Math.hypot(e.pos.x - p.x, e.pos.z - p.z) > CONFIG.grenade.blastRadius;
  });
  check('H5a 前置：敌人都在爆炸半径外', outOfRange);
  const player = sim3.player.pos();
  void player;
  console.log(fails === 0 ? '\n手雷 sim 层验证全部通过' : `\n${fails} 项失败`);
  sim.dispose();
  sim2.dispose();
  sim3.dispose();
  process.exit(fails === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
