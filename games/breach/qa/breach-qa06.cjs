// BREACH 0.6.0 QA：城市街道空袭 + 废墟静态回收 + 画质档位 + rc 场景性能
// 运行：NODE_PATH="F:\Dev\Projects\game-lab\练手小游戏\逐星-0.7折叠航路\node_modules" node _scratch/breach-qa06.cjs
const { chromium } = require("playwright");
const { pathToFileURL } = require("url");
const fs = require("fs");
const path = require("path");

const DIR = "F:/Dev/Projects/game-lab/练手小游戏/BREACH";
const NEW_URL = pathToFileURL(path.join(DIR, "BREACH-0.6.0.html")).href + "?qa";
const OLD_URL = pathToFileURL(path.join(DIR, "BREACH-0.5.0.html")).href + "?qa";
const SHOT = "F:/Dev/Projects/game-lab/_scratch/breach-street-raid.png";
const RESULT = "F:/Dev/Projects/game-lab/_scratch/breach-qa06-result.json";

const log = (...a) => console.log("[qa]", ...a);

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

// 每 1 模拟秒一个切片，切片间让出事件循环，避免 evaluate 3s 上限
const RUNNER = `
  window.__run = async (slices, sampler) => {
    const B = window.BREACH, out = [];
    for (let k = 0; k < slices; k++) {
      const t0 = performance.now();
      B.step(60);
      const wall = performance.now() - t0;
      const row = sampler(B, k + 1, wall);
      out.push(row);
      await new Promise(r => setTimeout(r, 0));
    }
    window.__out = out;
    window.__done = true;
  };
`;

async function run(page, slices, samplerSrc) {
  await page.evaluate(RUNNER);
  await page.evaluate(`window.__done = false, window.__run(${slices}, ${samplerSrc})`);
  await page.waitForFunction("window.__done === true", null, { timeout: 600000, polling: 300 });
  return page.evaluate("window.__out");
}

async function testNewBuild() {
  const { browser, page, errors } = await open(NEW_URL);
  const out = { build: "0.6.0", errors };
  try {
    // ── 启动健康 ──
    out.boot = await page.evaluate(() => {
      const B = window.BREACH, s = B.stats();
      B.pause(true);
      return { finite: s.finite, parts: s.parts, buildings: s.buildings, tier: s.tier, bodies: s.bodies };
    });
    log("boot:", JSON.stringify(out.boot));

    // ── street 场景构建 ──
    out.street = await page.evaluate(() => {
      const B = window.BREACH;
      B.setPreset("street");
      const s = B.stats();
      const d = B.render();
      return { finite: s.finite, parts: s.parts, buildings: s.buildings, members: s.structural.members, nodes: s.structural.nodes, drawCalls: d.drawCalls };
    });
    log("street:", JSON.stringify(out.street));

    // ── 行走 ──
    out.walk = await page.evaluate(() => {
      const B = window.BREACH;
      B.setFoot([2.5, 0, 30]);
      for (let i = 0; i < 20; i++) B.walk(0, -1, 1 / 60, {});
      const w = B.walker();
      return { foot: w.foot.map(v => +v.toFixed(2)), grounded: w.grounded, speed: +w.speed.toFixed(2) };
    });
    log("walk:", JSON.stringify(out.walk));

    // ── 空袭剧本 42 模拟秒 ──
    await page.evaluate(() => { window.BREACH.raidStart(); });
    out.raid = await run(page, 42, (B, t, wall) => {
      const s = B.stats(), r = B.raid(), p = B.peds();
      const row = { t, wallMs: Math.round(wall), msPerStep: +(wall / 60).toFixed(2), phase: r.phase, wave: r.wave, bombs: r.bombs, blasts: s.blasts, active: s.active, sleeping: s.sleeping, parked: s.parked, finite: s.finite, fleeing: p.fleeing };
      if (t % 6 === 0) row.drawCalls = B.render().drawCalls;
      return row;
    });
    const raidPhases = [...new Set(out.raid.map(r => r.phase))];
    const maxBlasts = Math.max(...out.raid.map(r => r.blasts));
    const maxPark = Math.max(...out.raid.map(r => r.parked));
    log("raid phases:", raidPhases.join("→"), "| blasts:", maxBlasts, "| parked(max):", maxPark,
        "| wallMs first5 mean:", Math.round(out.raid.slice(0, 5).reduce((a, r) => a + r.wallMs, 0) / 5),
        "| wallMs last5 mean:", Math.round(out.raid.slice(-5).reduce((a, r) => a + r.wallMs, 0) / 5));

    // ── 画质档位 ──
    out.quality = await page.evaluate(() => {
      const B = window.BREACH, o = {};
      B.setQuality("performance"); o.performance = B.render().drawCalls;
      B.setQuality("balanced"); o.balanced = B.render().drawCalls;
      B.setQuality("ultra"); o.ultra = B.render().drawCalls;
      B.setQuality("auto"); o.autoTier = B.stats().tier;
      B.setQuality("standard"); o.backStandard = B.stats().tier;
      o.finite = B.stats().finite;
      return o;
    });
    log("quality:", JSON.stringify(out.quality));

    // ── 恢复运行让 rAF 同步一帧，截图存档 ──
    await page.evaluate(() => { window.BREACH.pause(false); });
    await page.waitForTimeout(1600);
    await page.evaluate(() => { window.BREACH.pause(true); });
    await page.screenshot({ path: SHOT });
    log("screenshot:", SHOT);

    out.finalFinite = await page.evaluate(() => window.BREACH.stats().finite);
  } finally {
    await browser.close();
  }
  return out;
}

async function testRcPerf(url, label) {
  const { browser, page, errors } = await open(url);
  const out = { build: label, errors };
  try {
    await page.evaluate(() => {
      const B = window.BREACH;
      B.pause(true);
      B.setPreset("rc");
      B.reset();
    });
    await page.waitForTimeout(600);
    const setup = await page.evaluate(() => {
      const B = window.BREACH, s = B.stats();
      for (let i = 0; i < 3; i++) B.explode((i - 1) * 2.2, 2 + i * .8, 0, "charge");
      return { parts: s.parts, bodies: s.bodies };
    });
    out.setup = setup;
    out.collapse = await run(page, 30, (B, t, wall) => {
      const s = B.stats();
      return { t, wallMs: Math.round(wall), msPerStep: +(wall / 60).toFixed(2), active: s.active, sleeping: s.sleeping, parked: s.parked ?? null, finite: s.finite };
    });
    const rows = out.collapse;
    const mean = a => Math.round(a.reduce((x, y) => x + y.wallMs, 0) / a.length);
    out.summary = {
      peakWallMs: Math.max(...rows.map(r => r.wallMs)),
      first5Mean: mean(rows.slice(0, 5)),
      last5Mean: mean(rows.slice(-5)),
      finalActive: rows.at(-1).active,
      finalSleeping: rows.at(-1).sleeping,
      finalParked: rows.at(-1).parked,
      allFinite: rows.every(r => r.finite),
    };
    log(label, "rc 30s collapse:", JSON.stringify(out.summary));
  } finally {
    await browser.close();
  }
  return out;
}

(async () => {
  const result = {};
  result.newBuild = await testNewBuild();
  result.oldRc = await testRcPerf(OLD_URL, "0.5.0");
  result.newRc = await testRcPerf(NEW_URL, "0.6.0");
  fs.writeFileSync(RESULT, JSON.stringify(result, null, 2));
  log("written:", RESULT);
})().catch(e => { console.error("[qa-fatal]", e); process.exit(1); });
