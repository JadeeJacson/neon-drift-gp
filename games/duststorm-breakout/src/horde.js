// DUST RUN 2.3-A — Horde Director. Pursuit waves that punish idling; additive wrapper layer.
// 敌人此前对静止车辆零威胁（撞击判定要求 |vx|>48），停车救援=零风险。本层从车后方投放追击尸群：
// 低速贴身时撕咬装甲，让「减速停靠」「原地修整」变成带时钟的战术决策。设置可关闭（低压=2.2 行为）。
const hordeTune = {
  firstWave: 18, // 首波出发时刻（秒）
  waveBase: 24, // 波次基础间隔
  waveStage: -1.6, // 每区间隔缩短
  waveFloor: 11,
  waveRamp: 150, // 每 N 秒 +1 只
  maxPerWave: 6,
  maxChasers: 14,
  spawnBack: 500, // 出生点位于车后方
  moveSpeed: 52, // 车外窗口移动速度
  biteDps: 2.6, // 每只撕咬伤害/秒
  biteTick: 0.33,
  biteCap: 9,
};
let horde = null,
  hordeSeq = 900000;

function hordeAliveCount() {
  return zombies.reduce((n, z) => n + (z.horde && !z.hit ? 1 : 0), 0);
}
function spawnHordeWave(n) {
  for (let i = 0; i < n && hordeAliveCount() < hordeTune.maxChasers; i++) {
    const x = car.x - hordeTune.spawnBack - i * 46 + rand(-40, 40),
      volatile = Math.random() < 0.18;
    zombies.push({
      id: hordeSeq++,
      x,
      y: ground(x),
      scale: 1.15 + Math.random() * 0.28,
      phase: Math.random() * 6.28,
      skin: volatile ? "#b2ab76" : ["#959a72", "#a5a17c", "#7f8d6b"][Math.floor(Math.random() * 3)],
      shirt: volatile ? "#9a7544" : "#905b4d",
      hit: false,
      walk: (car.x > x ? 1 : -1) * (hordeTune.moveSpeed + Math.random() * 8),
      variant: volatile ? "volatile" : "runner",
      horde: true,
    });
  }
}

function updateHorde(dt) {
  if (!field || !run || run.finished || !car || !horde) return;
  // 周期清理：身后的僵尸（含已击杀）移出数组，防止长跑内存与迭代膨胀。
  horde.gc = (horde.gc || 0) + dt;
  if (horde.gc > 1.5) {
    horde.gc = 0;
    zombies = zombies.filter((z) => z.x > car.x - 2600);
  }
  // 追击尸群在核心窗口（车后 550）之外自行移动；窗口内由核心与 runner 逻辑接管，避免双重位移。
  for (const z of zombies) {
    if (!z.horde || z.hit || (z.x >= car.x - 550 && z.x <= car.x + 1100)) continue;
    z.walk = (car.x > z.x ? 1 : -1) * (hordeTune.moveSpeed + Math.sin(z.phase) * 6);
    z.x += z.walk * dt;
    updateZombieY(z, dt);
  }
  if (!save.settings.horde) return;
  horde.timer -= dt;
  const newbie = run.stage === 0 && car.x < 1700;
  if (horde.timer <= 0 && !newbie) {
    horde.timer = Math.max(
      hordeTune.waveFloor,
      hordeTune.waveBase + run.stage * hordeTune.waveStage - Math.min(7, run.elapsed / 150),
    );
    const size = clamp(
      2 + Math.floor(run.stage * 0.8) + Math.floor(run.elapsed / 150),
      2,
      hordeTune.maxPerWave,
    );
    spawnHordeWave(size);
    horde.wave++;
    run.hordeWaves = horde.wave;
    if (horde.wave === 1 || horde.wave % 3 === 0)
      fieldMessage(
        "尸潮觉醒 / 后方告警",
        "后方出现追击尸群！减速停靠时它们会贴身撕咬装甲，保持移动或用导弹清场。",
        "#e8a97c",
      );
  }
  // 撕咬：仅对追击尸群生效；低速贴身时累积伤害，分段结算以驱动受击反馈。
  let biters = 0;
  for (const z of zombies) {
    if (!z.horde || z.hit) continue;
    if (
      Math.abs(z.x - car.x) < 95 &&
      Math.abs(z.y - 29 * z.scale - car.y) < 80 &&
      Math.abs(car.vx) < 48
    )
      biters++;
  }
  if (biters > 0) {
    horde.biteAccum += Math.min(biters, 3) * hordeTune.biteDps * dt;
    horde.biteTick += dt;
    if (horde.biteTick >= hordeTune.biteTick) {
      horde.biteTick = 0;
      const amount = Math.min(horde.biteAccum, hordeTune.biteCap * hordeTune.biteTick);
      horde.biteAccum = 0;
      if (amount > 0) {
        damageCar(amount, "zombie");
        if (field) field.damagePulse = Math.min(0.35, field.damagePulse + 0.06);
        if (run.elapsed - (horde.lastBiteNotice ?? -10) > 1.4) {
          horde.lastBiteNotice = run.elapsed;
          floater(car.x, car.y - 105, "尸群撕咬！", "#e89a7c");
          AudioSystem.hit(0.28);
          shake = Math.max(shake, 2);
        }
      }
    }
  } else {
    horde.biteAccum = 0;
    horde.biteTick = 0;
  }
}

// 入场包装：核心与远征层初始化完成后再建立导演状态。
const hordeStart = startRun;
startRun = function () {
  hordeStart();
  horde = { timer: hordeTune.firstWave, wave: 0, gc: 0, biteAccum: 0, biteTick: 0, lastBiteNotice: -10 };
  run.hordeWaves = 0;
};
