// DUST RUN 2.3-D — Endless mode. 流式路段拼接：地形/尸群/道具/结构/补给/救援/测速门随行驶前伸，
// 身后过期清理；难度随距离加压。不设终点与 Boss（endlessPending 供 boss.js 跳过防线）。
// 无尽旅程期间 routes[stage].len 置为巨值以架空核心终点判定；下一次普通远征开始前自动恢复真实长度。
let endlessPending = false,
  endlessRealLen = {},
  endlessGen = null;

function extendEndlessChunk() {
  const gen = endlessGen,
    stage = run.stage,
    from = gen.generatedTo,
    to = from + 2800;
  for (let x = from + 40; x <= to; x += 40) {
    let y = 530 + Math.sin(x / 430) * 19 + Math.sin(x / 185) * 8;
    if (stage === 1 || stage === 4) y = 530 + Math.sin(x / 540) * 30 + Math.sin(x / 210) * 12;
    if (stage === 2 || stage === 3 || stage === 5) y = 530 + Math.sin(x / 470) * 23 + Math.sin(x / 170) * 12;
    const rp = x % 2200;
    if (rp > 1300 && rp < 1630) y -= (rp - 1300) * 0.26;
    else if (rp >= 1630 && rp < 1950) y -= (1950 - rp) * 0.27;
    terrain.push({ x, y });
  }
  gen.generatedTo = to;
  gen.chunks++;
  const group = 5000 + gen.chunks;
  // 尸群簇：随距离加压（每块 +0.2 只/簇上限 6）
  const density = Math.min(6, 3 + gen.chunks * 0.2);
  for (let x = from + 140; x < to - 200; x += 230) {
    const n = 2 + Math.floor(Math.random() * (density - 1));
    for (let j = 0; j < n; j++) {
      const xx = x + j * 34 + Math.random() * 40,
        t = Math.random();
      zombies.push({
        id: 600000 + gen.chunks * 100 + j,
        x: xx,
        y: ground(xx),
        scale: 1.22 + Math.random() * 0.4,
        phase: Math.random() * 6.28,
        skin: ["#959a72", "#a5a17c", "#7f8d6b", "#a1a089"][Math.floor(Math.random() * 4)],
        shirt: ["#555e50", "#6e5141", "#49575a", "#7c6c4d", "#57454b"][Math.floor(Math.random() * 5)],
        hit: false,
        walk: (Math.random() - 0.7) * 12,
        variant: t < 0.045 ? "lobber" : t < 0.075 ? "screamer" : "normal",
      });
      const z = zombies[zombies.length - 1];
      if (z.variant === "lobber") {
        z.shirt = "#6a4b52";
        z.walk = 0;
      } else if (z.variant === "screamer") z.shirt = "#8a4f63";
    }
  }
  // 道具：爆炸物/补给/残骸
  for (let x = from + 300; x < to - 300; x += 620 + Math.random() * 420) {
    const t = Math.random();
    props.push({
      x,
      y: ground(x),
      type: t < 0.3 ? "barrel" : t < 0.48 ? "gas" : t < 0.62 ? "tnt" : t < 0.76 ? "crate" : t < 0.9 ? "wreck" : "supply",
      hit: false,
      vy: 0,
      seed: Math.random(),
    });
  }
  // 迷你结构：坡道 + 两段甲板（可撞穿/连锁坍塌），甲板上放少量尸与 TNT
  const sx = from + 900,
    base = ground(sx),
    deckY = base - 170;
  for (let j = 0; j < 4; j++) {
    const q = addPlatform(sx + j * 90, sx + (j + 1) * 90, lerp(base, deckY, j / 4), lerp(base, deckY, (j + 1) / 4), "ramp");
    Object.assign(q, { group, level: 0, bottom: base });
  }
  for (let j = 0; j < 2; j++) {
    const q = addPlatform(sx + 360 + j * 155, sx + 360 + (j + 1) * 155, deckY, deckY, "scaffold");
    Object.assign(q, { group, level: 0, bottom: base, hp: 0.9, maxHp: 0.9 });
    if (Math.random() < 0.7)
      zombies.push({
        id: 610000 + gen.chunks * 10 + j,
        x: sx + 360 + j * 155 + 77,
        y: deckY,
        scale: 1.22 + Math.random() * 0.4,
        phase: Math.random() * 6.28,
        skin: "#a5aa88",
        shirt: ["#4c6871", "#8a7250", "#75594f"][Math.floor(Math.random() * 3)],
        hit: false,
        walk: 0,
        platform: q.id,
        variant: "normal",
      });
    if (Math.random() < 0.35)
      props.push({ x: sx + 360 + j * 155 + 77, y: deckY, type: Math.random() < 0.5 ? "supply" : "tnt", hit: false, vy: 0, seed: 0, platform: q.id });
  }
  // 远征事件物：补给 / 救援 / 测速门（复用 updateField 的通用处理）
  for (let x = from + 1150; x < to; x += 1150)
    field.pickups.push({
      x,
      y: ground(x) - 24,
      platform: null,
      type: ["fuel", "repair", "ammo"][Math.floor(Math.random() * 3)],
      taken: false,
      phase: Math.random() * 6.28,
      vy: 0,
    });
  if (gen.chunks % 2 === 1 && to - from > 2400)
    field.rescues.push({ x: from + 1500, y: ground(from + 1500), progress: 0, done: false, missed: false });
  if (gen.chunks % 2 === 0)
    field.gates.push({ x: from + 2100, y: ground(from + 2100), required: 70, done: false, passed: false });
  placeNests(from, to);
}

function updateEndless(dt) {
  if (!run || !run.endless || run.finished || !car || !endlessGen) return;
  const gen = endlessGen;
  if (car.x + 3200 > gen.generatedTo) extendEndlessChunk();
  gen.cull = (gen.cull || 0) + dt;
  if (gen.cull > 3) {
    gen.cull = 0;
    // 结构过期：标记销毁（不触发坍塌演出），zombie/prop 数组由 horde 层与下方过滤控制
    for (const p of platforms) if (p.x2 < car.x - 3200 && !p.destroyed) { p.hp = 0; p.destroyed = true; }
    props = props.filter((p) => p.x > car.x - 2600);
    field.pickups = field.pickups.filter((p) => !p.taken || p.x > car.x - 2600);
    field.rescues = field.rescues.filter((s) => s.x > car.x - 2600);
    field.gates = field.gates.filter((g) => g.x > car.x - 2600);
  }
}

// 结算：无尽纪录入账 + 结果词条。
const endlessFinish = finish;
finish = function (reason, win = false) {
  const wasEndless = !!run?.endless;
  endlessFinish(reason, win);
  if (wasEndless && run.endlessSettled) return;
  if (wasEndless) {
    run.endlessSettled = true;
    endlessPending = true; // 结算页「再跑一趟」默认续接无尽
    const dist = Math.floor(run.distance / 12),
      best = save.endlessBest,
      record = dist > best.dist;
    best.dist = Math.max(best.dist, dist);
    best.kills = Math.max(best.kills, run.kills);
    normalizeField();
    save.fieldStats.endlessDist = Math.max(save.fieldStats.endlessDist, dist);
    save.fieldStats.endlessKills = Math.max(save.fieldStats.endlessKills, run.kills);
    persist();
    $("fieldResults").insertAdjacentHTML(
      "beforeend",
      `<span>无尽远征 ${fmt(dist)} m · 击杀 ${run.kills}${record ? " · 新纪录！" : ""}</span>`,
    );
  }
};

// 远征档案注入无尽入口与纪录。
const endlessFieldbook = renderFieldbook;
renderFieldbook = function () {
  endlessFieldbook();
  if (fieldTab !== "prep") return;
  const best = save.endlessBest;
  $("fieldBody").insertAdjacentHTML(
    "beforeend",
    `<div class="field-section-title"><span>04 / 无尽远征</span><small>没有终点 · 耗尽燃料即结算</small></div><div class="intel-grid"><article><b>无尽远征</b><p>当前纪录：${fmt(best.dist)} m · ${best.kills} 击杀。尸潮、防线废墟与特殊感染体会随距离加压，补给节奏逐渐收紧。地图样式沿用当前所选区域。</p><button id="startEndless" class="field-open" style="margin-top:10px"><span>进入无尽远征</span><b>ENDLESS</b><span>→</span></button></article></div>`,
  );
  $("startEndless").onclick = () => {
    endlessPending = true;
    startRun();
  };
};

// 入场包装（本层位于功能链最外层）：endlessPending 时以短块生成后架空终点判定。
const endlessStart = startRun;
startRun = function () {
  if (!endlessPending) {
    // 普通远征：恢复被无尽模式临时改写的路线长度
    for (const k in endlessRealLen) routes[k].len = endlessRealLen[k];
    endlessGen = null;
    endlessStart();
    return;
  }
  const stage = save.selected;
  if (!(stage in endlessRealLen)) endlessRealLen[stage] = routes[stage].len;
  routes[stage].len = 2600;
  try {
    endlessStart();
  } catch (e) {
    routes[stage].len = endlessRealLen[stage];
    throw e;
  }
  endlessPending = false;
  routes[stage].len = 2000000; // 终点判定不可达
  run.endless = true;
  endlessGen = { generatedTo: terrain[terrain.length - 1].x, chunks: 0, cull: 0 };
  $("target").textContent = "无尽 / ENDLESS";
  fieldMessage(
    "避难所 / 无尽远征",
    "没有终点，只有更远。尸潮与防线会随距离加压，燃料耗尽即结算。",
    "#c6b5e3",
  );
};
