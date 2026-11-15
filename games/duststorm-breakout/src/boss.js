// DUST RUN 2.3-B — End-of-route boss set-piece. Built entirely from existing
// platforms / explosive props / guard zombies: no core changes required.
// 终点前 850 单位矗立一座防线塔（真实结构，可撞穿/炸塌/连锁坍塌）。
// 弱点=塔上的 TNT（连锁引爆）、核心平台（冲撞即毁）、或累计爆炸伤害。击破清除整塔并结算重奖。
const bossNames = ["装甲囚车", "哨塔阵地", "化工罐区", "码头封锁", "空中堡垒", "熔核之心"];
let boss = null,
  bossSeq = 700000;

function bossDefeat() {
  if (!boss || boss.defeated) return;
  boss.defeated = true;
  boss.hp = 0;
  if (run) run.bossDefeated = 1;
  for (const p of boss.platforms) if (p.hp > 0) destroyPlatform(p, "collapse", true);
  const reward = 400 + boss.stage * 300;
  if (field) fieldReward(reward, "防线瓦解", boss.x, ground(boss.x) - 260);
  fieldMessage(
    "避难所 / 防线告破",
    bossNames[boss.stage] + " 已被摧毁。道路畅通，继续冲向终点。",
    "#b5e3dc",
  );
  shake = Math.max(shake, 6);
}
function buildBoss(stage) {
  const x = routes[stage].len - 850,
    base = ground(x),
    group = 900 + stage,
    kind = stage === 4 ? "roof" : stage === 3 ? "dock" : "scaffold",
    deckY = base - 210,
    topY = deckY - 160;
  boss = {
    x,
    stage,
    hp: 100,
    maxHp: 100,
    defeated: false,
    guardTimer: 4,
    warned: false,
    platforms: [],
  };
  // 引桥 + 双层塔身 + 核心甲板
  for (let j = 0; j < 4; j++) {
    const q = addPlatform(
      x - 640 + j * 95,
      x - 640 + (j + 1) * 95,
      lerp(base, deckY, j / 4),
      lerp(base, deckY, (j + 1) / 4),
      "ramp",
    );
    Object.assign(q, { group, level: 0, bottom: base });
    boss.platforms.push(q);
  }
  const deckParts = [];
  for (let j = 0; j < 3; j++) {
    const q = addPlatform(x - 260 + j * 175, x - 260 + (j + 1) * 175, deckY, deckY, kind);
    Object.assign(q, { group, level: 0, bottom: base, hp: 1.6, maxHp: 1.6 });
    deckParts.push(q);
    boss.platforms.push(q);
  }
  for (let j = 0; j < 2; j++) {
    const q = addPlatform(x - 175 + j * 175, x - 175 + (j + 1) * 175, topY, topY, kind);
    Object.assign(q, { group, level: 1, bottom: deckY, hp: 1.6, maxHp: 1.6 });
    boss.platforms.push(q);
  }
  const core = deckParts[1];
  core.hp = 5;
  core.maxHp = 5;
  boss.core = core;
  // 弱点：塔上 TNT（被引爆→连锁伤塔）；随平台坍塌而坠落（props 自带 platform 逻辑）
  for (const [ox, oy, pid] of [
    [-170, deckY, deckParts[0].id],
    [0, topY, boss.platforms[boss.platforms.length - 1].id],
    [170, deckY, deckParts[2].id],
  ])
    props.push({ x: x + ox, y: oy, type: "tnt", hit: false, vy: 0, seed: 0, platform: pid });
}

function updateBoss(dt) {
  if (!run || run.finished || !car) return;
  if (!boss) return;
  if (boss.defeated) return;
  if (boss.hp <= 0 || boss.core.destroyed) {
    bossDefeat();
    return;
  }
  const dist = Math.abs(car.x - boss.x);
  if (dist < 1800 && !boss.warned) {
    boss.warned = true;
    fieldMessage(
      "避难所 / 前方防线",
      bossNames[boss.stage] + " 封锁了终点。炸掉塔上的 TNT，或直接撞穿核心甲板。",
      "#e8c24e",
    );
  }
  if (dist < 1500) {
    boss.guardTimer -= dt;
    if (boss.guardTimer <= 0) {
      boss.guardTimer = 8;
      const live = zombies.reduce((n, z) => n + (z.bossGuard && !z.hit ? 1 : 0), 0);
      for (let i = 0; i < 3 && live + i < 12; i++) {
        const x = boss.x + rand(-420, 420),
          t = Math.random();
        zombies.push({
          id: bossSeq++,
          x,
          y: ground(x),
          scale: 1.2 + Math.random() * 0.3,
          phase: Math.random() * 6.28,
          skin: "#9eaa92",
          shirt: t < 0.25 ? "#677776" : t < 0.45 ? "#9a7544" : t < 0.75 ? "#905b4d" : "#555e50",
          hit: false,
          walk: (car.x > x ? 1 : -1) * 46,
          variant: t < 0.25 ? "armored" : t < 0.45 ? "volatile" : t < 0.75 ? "runner" : "normal",
          bossGuard: true,
        });
        const z = zombies[zombies.length - 1];
        if (z.variant === "armored") {
          z.armorIntact = true;
          z.scale *= 1.08;
        }
      }
    }
  }
}

// 爆炸伤害累计到防线血量（弱点 TNT 连锁也走这里）；血量归零立即瓦解。
const bossExplode = explode;
explode = function (x, y, r, power, source) {
  bossExplode(x, y, r, power, source);
  if (boss && !boss.defeated && Math.abs(x - boss.x) < 340) {
    boss.hp -= power * 16;
    if (boss.hp <= 0) bossDefeat();
  }
};

// 结算：防线击破计入生存档案；结果页追加词条。
const bossFinish = finish;
finish = function (reason, win = false) {
  if (field && !field.settled) {
    normalizeField();
    save.fieldStats.bosses += boss?.defeated ? 1 : 0;
  }
  bossFinish(reason, win);
  if (boss && boss.defeated && !boss.resultShown) {
    boss.resultShown = true;
    $("fieldResults").insertAdjacentHTML(
      "beforeend",
      `<span>防线击破 · ${bossNames[boss.stage]} 已瓦解</span>`,
    );
  }
};

// HUD 血条。
$("hud").insertAdjacentHTML(
  "beforeend",
  '<div id="bossBar" style="position:absolute;top:152px;left:50%;transform:translateX(-50%);width:min(420px,60vw);display:none;pointer-events:none"><b style="display:block;text-align:center;color:#e8c24e;font-size:12px;letter-spacing:2px"></b><i style="display:block;height:6px;margin-top:4px;background:#2e2620;border-radius:3px;overflow:hidden"><u style="display:block;height:100%;width:100%;background:linear-gradient(90deg,#c9764e,#e8a24e);transition:width .15s"></u></i></div>',
);
const bossHud = updateHUD;
updateHUD = function () {
  bossHud();
  const bar = $("bossBar");
  if (!boss || !bar) return;
  const show = !!boss && !boss.defeated && Math.abs((car?.x ?? 0) - boss.x) < 1900;
  bar.style.display = show ? "block" : "none";
  if (show) {
    bar.querySelector("b").textContent = "防线 / " + bossNames[boss.stage];
    bar.querySelector("u").style.width = clamp((boss.hp / boss.maxHp) * 100, 0, 100) + "%";
  }
};

// 入场包装：无尽模式（endlessPending 由 endless.js 置位）不设 Boss。
const bossStart = startRun;
startRun = function () {
  bossStart();
  boss = null;
  run.bossDefeated = 0;
  if (!endlessPending) {
    buildBoss(run.stage);
    run.bossName = bossNames[run.stage];
  }
};
