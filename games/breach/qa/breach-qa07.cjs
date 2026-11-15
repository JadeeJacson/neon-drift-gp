// BREACH 0.7.0 QA：截面账 / 分段释放 / 落地连锁 / 10 预设冒烟 / 性能对照(0.6 基线)
// 运行：NODE_PATH="F:\Dev\Projects\game-lab\练手小游戏\逐星-0.7折叠航路\node_modules" node _scratch/breach-qa07.cjs
const { chromium } = require("playwright");
const { pathToFileURL } = require("url");
const fs = require("fs");
const path = require("path");

const DIR = "F:/Dev/Projects/game-lab/练手小游戏/BREACH";
const NEW_URL = pathToFileURL(path.join(DIR, "BREACH-0.8.2.html")).href + "?qa";
const OLD_URL = pathToFileURL(path.join(DIR, "BREACH-0.6.0.html")).href + "?qa";
const SHOT = "F:/Dev/Projects/game-lab/_scratch/breach-qa07-topple.png";
const RESULT = "F:/Dev/Projects/game-lab/_scratch/breach-qa07-result.json";

const log = (...a) => console.log("[qa07]", ...a);

async function open(url) {
  const browser = await chromium.launch({
    executablePath: "C:\\Users\\Lenovo\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", e => errors.push("pageerror: " + String(e).slice(0, 260)));
  page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 260)); });
  await page.goto(url, { timeout: 30000 });
  await page.waitForFunction("!!window.BREACH", null, { timeout: 30000, polling: 200 });
  await page.waitForTimeout(900);
  return { browser, page, errors };
}

// 每切片 steps 个模拟步，切片间让出事件循环，避免 evaluate 3s 上限
const RUNNER = `
  window.__run = async (slices, steps, sampler) => {
    const B = window.BREACH, out = [];
    for (let k = 0; k < slices; k++) {
      const t0 = performance.now();
      B.step(steps);
      const wall = performance.now() - t0;
      const row = sampler(B, k + 1, wall);
      out.push(row);
      await new Promise(r => setTimeout(r, 0));
    }
    window.__out = out;
    window.__done = true;
  };
`;

async function run(page, slices, samplerSrc, steps = 60) {
  await page.evaluate(RUNNER);
  await page.evaluate(`window.__done = false, window.__run(${slices}, ${steps}, ${samplerSrc})`);
  await page.waitForFunction("window.__done === true", null, { timeout: 600000, polling: 300 });
  return page.evaluate("window.__out");
}

const PRESETS = ["materials", "steel", "masonry", "factory", "podium", "district", "rc", "twins", "broadcast", "pagoda", "street", "chimney", "bridge", "parking", "clocktower"];

async function testSmoke(page, out) {
  // 10+1 预设冒烟：加载 → 中心爆破 → 2 模拟秒 → 全 finite
  out.smoke = [];
  for (const name of PRESETS) {
    const r = await page.evaluate((name) => {
      const B = window.BREACH;
      B.setPreset(name);
      const s0 = B.stats();
      B.explode(0, 3, 0, "charge");
      B.explode(2, 8, -2, "rpg");
      B.step(120);
      const s = B.stats();
      return {
        name, finite: s.finite, parts: s.parts, buildings: s.buildings,
        members: s.structural && s.structural.members,
        failed: s.structural && s.structural.failed,
        drawCalls: B.render().drawCalls,
        bootFinite: s0.finite
      };
    }, name);
    out.smoke.push(r);
    log("smoke", name, JSON.stringify(r));
    if (!r.finite || !r.parts) throw new Error(`smoke failed: ${name}`);
  }
}

async function testToppleSegments(page, out) {
  // 钢框架定向拆柱 → 侧倾 → 分段释放 + 可见旋转累积
  const setup = await page.evaluate(() => {
    const B = window.BREACH;
    B.setPreset("steel");
    const rec = B.recipe();
    const cols = rec.parts.filter(p => p.type === "column" && (p.level ?? 0) === 0);
    cols.sort((a, b) => b.pos[0] - a.pos[0]); // +x 边为存活侧
    const keep = cols.slice(0, 3), side = cols.slice(3); // 摧毁 2/3 底层柱(0.5 验证口径)
    for (const p of side) B.damagePart(p.id, 1e4);
    const top = rec.parts.reduce((a, b) => ((a.pos[1] > b.pos[1]) ? a : b));
    return { cols: cols.length, side: side.length, keep: keep.length, topId: top.id, topPos0: top.pos.slice() };
  });
  log("topple setup:", JSON.stringify(setup));
  out.toppleSetup = setup;

  const rows = await run(page, 36, `(B, k, wall) => {
    const t = B.topple(), st = B.segStats(), segs = B.segments(), sec = B.sections();
    const ps = B.partState(${setup.topId}).position;
    return {
      k: +(k / 2).toFixed(1), wall: Math.round(wall), finite: B.stats().finite,
      starts: t.starts, runs: t.runs.length, hands: t.hands,
      theta: t.runs[0] ? t.runs[0].theta : null,
      segsReleased: st.released, shattered: st.shattered,
      segView: segs.map(g => ({ b: g.building, th: g.theta, segs: g.segs.map(s => [s.band, s.released ? 1 : 0, +s.minY.toFixed(1)]) })),
      ratios: sec.runs.map(r => r.ratios.map(x => x.ratio)),
      topPos: [+ps.x.toFixed(2), +ps.y.toFixed(2), +ps.z.toFixed(2)]
    };
  }`, 30);
  out.toppleRows = rows;
  for (const r of rows) log("topple", JSON.stringify(r));

  const ev = await page.evaluate(() => {
    const e = window.BREACH.events();
    const list = (e && e.events) || e || [];
    const types = {};
    for (const x of list) types[x.type] = (types[x.type] || 0) + 1;
    const segs = list.filter(x => x.type === "segment-released").map(x => ({ ...(x.payload || x) })).map(p => ({ minH: p.minH, speed: p.speed, tier: p.tier, band: p.band }));
    const secs = list.filter(x => x.type === "section-failed").map(x => ({ ...(x.payload || x) })).map(p => ({ level: p.level, phase: p.phase, ratio: p.ratio, segments: p.segments }));
    return { types, segs, secs };
  });
  out.toppleEvents = ev;
  log("events:", JSON.stringify(ev));

  // 中段截图（可见旋转证据）
  await page.evaluate(() => { window.BREACH.render(); });
  await page.screenshot({ path: SHOT });

  const last = rows[rows.length - 1];
  const p0 = setup.topPos0, p1 = last.topPos;
  const disp = Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
  // 甩尾检测:移交后顶点不得上抛/回甩(v=ω×r 符号回归)
  const handIdx = rows.findIndex(r => r.hands > 0);
  const handRow = handIdx >= 0 ? rows[handIdx] : null;
  const postRows = handRow ? rows.slice(handIdx) : [];
  const postPeakY = postRows.reduce((m, r) => Math.max(m, r.topPos[1]), -1e9);
  const whipUp = handRow ? +(postPeakY - handRow.topPos[1]).toFixed(2) : null;
  out.toppleAssert = {
    starts: rows.reduce((m, r) => Math.max(m, r.starts), 0),
    segsReleased: last.segsReleased,
    segsShattered: last.shattered,
    visualDisplacement: +disp.toFixed(2),
    releaseTimes: rows.filter(r => r.segsReleased > 0).map(r => r.k),
    distinctReleaseSeconds: rows.filter((r, i) => i === 0 ? r.segsReleased > 0 : r.segsReleased > rows[i - 1].segsReleased).length,
    finiteAll: rows.every(r => r.finite),
    groundTouchEvents: ev.segs.filter(s => s.minH <= 0.6).length,
    handoverAt: handRow ? handRow.k : null,
    whipUpAfterHandover: whipUp
  };
  log("topple assert:", JSON.stringify(out.toppleAssert));

  const a = out.toppleAssert;
  if (a.starts < 1) throw new Error("topple never started");
  if (a.segsReleased < 2) throw new Error("segments released < 2");
  if (a.visualDisplacement < 5) throw new Error("no cumulative visual rotation: disp=" + a.visualDisplacement);
  if (!a.finiteAll) throw new Error("non-finite values during topple");
  if (a.distinctReleaseSeconds < 2) throw new Error("segments not released progressively: " + a.distinctReleaseSeconds);
  if (whipUp !== null && whipUp > 1.5) throw new Error("backward/whip rebound after handover: +" + whipUp + "m");
}

async function testMonitorFire(page, out) {
  // 强制折断路径：capacity 系数压低后倾倒中截面应空中折断(链路验证)
  const r = await page.evaluate(() => {
    const B = window.BREACH;
    B.setCollapse({ monitor: { capacity: 0.02, ratio: 1 }, standing: { enabled: false } });
    B.setPreset("steel");
    const rec = B.recipe();
    const cols = rec.parts.filter(p => p.type === "column" && (p.level ?? 0) === 0);
    cols.sort((a, b) => b.pos[0] - a.pos[0]);
    for (const p of cols.slice(3)) B.damagePart(p.id, 1e4);
    for (let k = 0; k < 24; k++) B.step(10);
    const e = window.BREACH.events();
    const list = (e && e.events) || e || [];
    const sec = list.filter(x => x.type === "section-failed").map(x => ({ ...(x.payload || x) }));
    return { segs: B.segStats(), sec, finite: B.stats().finite };
  });
  out.monitorFire = r;
  log("monitor fire:", JSON.stringify(r));
  if (!r.finite) throw new Error("non-finite in monitor fire test");
  if (!r.sec.some(s => s.phase === "topple")) throw new Error("forced mid-air break did not fire");
}

async function testXColor(page, out) {
  // X 调试配色残留回归：停泊/休眠件关调试后必须还原（0.8.1 修复）
  const r = await page.evaluate(() => {
    const B = window.BREACH;
    B.setPreset("rc");
    B.explode(0, 2, 0, "charge");
    B.step(240);
    let id = -1;
    for (let i = 0; i < 800; i++) { const c = B.partColor(i); if (c && !c.active) { id = i; break; } }
    const before = B.partColor(id);
    B.debugToggle();
    const on = B.partColor(id);
    B.debugToggle();
    const after = B.partColor(id);
    return { id, before, on, after };
  });
  out.xColor = r;
  log("x-color:", JSON.stringify(r));
  if (r.on.color === r.before.color) throw new Error("debug coloring did not apply");
  if (r.after.color !== r.before.color) throw new Error("debug color residue after toggle-off: " + JSON.stringify(r.after));
}

async function testPerfLab(page, out) {
  // 性能实验面板：组合开关即刻生效、数值 finite、一键复位
  const r = await page.evaluate(() => {
    const B = window.BREACH;
    B.setPreset("rc");
    const combos = [
      { plStagger: "8", plTol: "1e-2" },
      { plFric: "0", plThrottle: "6", plStruct: "fast" },
      { plDedup: "0", plBudget: "240", plPark: "0.5" },
    ];
    const rows = [];
    for (const c of combos) {
      for (const [k, v] of Object.entries(c)) B.setPerfLab(k, v);
      B.explode(0, 2, 0, "charge");
      B.step(120);
      rows.push({ lab: B.perfLab(), finite: B.stats().finite });
    }
    for (const [k, v] of Object.entries({ plBudget: "420", plStagger: "0", plIters: "7", plTol: "1e-7", plFric: "0.64", plPark: "1.6", plThrottle: "1", plDedup: "1", plStruct: "std" })) B.setPerfLab(k, v);
    return { rows, after: B.perfLab() };
  });
  out.perfLab = r;
  log("perf lab after-reset:", JSON.stringify(r.after));
  if (!r.rows.every(x => x.finite)) throw new Error("perf lab combo broke finiteness");
  if (r.after.iters !== 7 || r.after.stagger !== 0 || r.after.dedup !== true || r.after.friction !== 0.64) throw new Error("perf lab reset failed: " + JSON.stringify(r.after));
}

async function testBury(page, out) {
  // 0.8.2 废墟治理回归：被压件隐藏、爆炸解封还原、数值 finite
  const r = await page.evaluate(() => {
    const B = window.BREACH;
    B.setPerfLab("plBury", "gone");
    B.setPerfLab("plBuryDelay", "3");
    B.setPreset("rc");
    B.explode(0, 2, 0, "charge");
    B.explode(-2, 8, 2, "rpg");
    B.step(1200);
    const mid = B.bury();
    B.explode(0, 2, 0, "charge");
    B.step(90);
    const after = B.bury();
    B.setPerfLab("plBury", "off");
    return { mid, after, finite: B.stats().finite };
  });
  out.bury = r;
  log("bury:", JSON.stringify(r));
  if (!r.finite) throw new Error("non-finite in bury test");
  if (r.mid.gone < 20) throw new Error("buried cleanup did not engage: " + r.mid.gone);
  if (r.mid.visible > 520) throw new Error("meshes not hidden: " + r.mid.visible);
  if (r.after.visible <= r.mid.visible) throw new Error("explosion did not restore visibility");
}

async function testRaid(page, out) {
  // 0.8 剧本参数化回归：raid 时间线走完 ≥2 波、投弹落点、全 finite
  const pre = await page.evaluate(() => {
    const B = window.BREACH;
    B.setPreset("street");
    B.raidStart();
    return B.raid();
  });
  const rows = await run(page, 22, `(B, k) => {
    const r = B.raid();
    return { k, phase: r.phase, wave: r.wave, bombs: r.bombs, blasts: r.blasts, finite: B.stats().finite };
  }`, 100);
  out.raidStart = pre;
  const post = rows[rows.length - 1];
  out.raidRows = rows.filter(r => r.phase !== "calm").slice(0, 12);
  // raidBlasts 是 0.6s TTL 瞬态环(渲染用),累计落弹数从事件日志的 explosion 计
  const ev = await page.evaluate(() => {
    const e = window.BREACH.events();
    const list = (e && e.events) || e || [];
    return list.filter(x => x.type === "explosion").length;
  });
  out.raidAssert = { startPhase: pre.phase, endPhase: post.phase, endWave: post.wave, explosionEvents: ev, finiteAll: rows.every(r => r.finite) };
  log("raid assert:", JSON.stringify(out.raidAssert));
  if (!out.raidAssert.finiteAll) throw new Error("non-finite during raid");
  if (out.raidAssert.endWave < 2) throw new Error("raid waves did not progress: wave=" + out.raidAssert.endWave);
  if (out.raidAssert.explosionEvents < 3) throw new Error("raid bombs did not land: explosions=" + out.raidAssert.explosionEvents);
}

async function testRestrike(page, out) {
  // rc 废墟停泊后落块砸入 → 落地连锁解封（软断言:记录）
  const r = await page.evaluate(() => {
    const B = window.BREACH;
    B.setPreset("rc");
    B.explode(0, 2, 0, "charge");
    B.explode(1.5, 6, 1, "rpg");
    B.step(1200); // 20s 沉降
    const parked0 = B.parked();
    const rec = B.recipe();
    const heavy = rec.parts.filter(p => p.mass > 200 && (p.level ?? 0) >= 3).slice(0, 3);
    for (const p of heavy) B.dropPart(p.id, p.pos[0], 24, p.pos[2], 0, -18, 0);
    B.step(300);
    return { parked0, parked1: B.parked(), finite: B.stats().finite, dropped: heavy.length };
  });
  out.restrike = r;
  log("restrike:", JSON.stringify(r));
  if (!r.finite) throw new Error("non-finite in restrike test");
}

async function perfRun(page) {
  return page.evaluate(() => {
    const B = window.BREACH;
    B.setPreset("rc");
    B.explode(0, 2, 0, "charge");
    B.explode(-2, 8, 2, "rpg");
    B.explode(3, 4, -3, "grenade");
    const t0 = performance.now();
    B.step(1800); // 30 模拟秒
    return { wallMs: Math.round(performance.now() - t0), finite: B.stats().finite };
  });
}

(async () => {
  const out = { build: "0.7.0" };
  const { browser, page, errors } = await open(NEW_URL);
  out.errors = errors;
  try {
    out.boot = await page.evaluate(() => {
      const B = window.BREACH, s = B.stats();
      B.pause(true);
      return { finite: s.finite, parts: s.parts, buildings: s.buildings, tier: s.tier, bodies: s.bodies };
    });
    log("boot:", JSON.stringify(out.boot));
    if (!out.boot.finite) throw new Error("boot not finite");

    await testSmoke(page, out);
    await testToppleSegments(page, out);
    await testMonitorFire(page, out);
    await testXColor(page, out);
    await testPerfLab(page, out);
    await testBury(page, out);
    await testRaid(page, out);
    await testRestrike(page, out);
  } finally {
    await browser.close();
  }

  // perf 对照用全新页面，避免前置测试的 setCollapse 残留污染
  {
    const { browser, page, errors } = await open(NEW_URL);
    try {
      out.perfNew = await perfRun(page);
      out.perfNewErrors = errors;
      log("perf 0.7:", JSON.stringify(out.perfNew));
    } finally {
      await browser.close();
    }
  }

  // 0.6 基线对照（同场景 rc 30 模拟秒）
  {
    const { browser, page, errors } = await open(OLD_URL);
    try {
      out.perfOld = await perfRun(page);
      out.perfOldErrors = errors;
      log("perf 0.6:", JSON.stringify(out.perfOld));
    } finally {
      await browser.close();
    }
    out.perfRatio = +(out.perfNew.wallMs / Math.max(1, out.perfOld.wallMs)).toFixed(3);
    log("perf ratio (new/old):", out.perfRatio);
    if (out.perfRatio > 1.1) throw new Error("perf regression: ratio " + out.perfRatio);
  }

  if (errors.length) log("page errors:", JSON.stringify(errors));
  fs.writeFileSync(RESULT, JSON.stringify(out, null, 2));
  log("PASS →", RESULT);
})().catch(e => {
  console.error("[qa07] FAIL:", e && e.stack || e);
  try { fs.writeFileSync(RESULT, JSON.stringify({ fail: String(e) }, null, 2)); } catch (_) {}
  process.exit(1);
});
