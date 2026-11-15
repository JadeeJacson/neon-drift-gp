// BREACH 0.6.0 QA 第二轮：空闲成本定位 + 强制睡眠回收验证
const { chromium } = require("playwright");
const { pathToFileURL } = require("url");
const fs = require("fs");
const path = require("path");

const DIR = "F:/Dev/Projects/game-lab/练手小游戏/BREACH";
const NEW_URL = pathToFileURL(path.join(DIR, "BREACH-0.6.0.html")).href + "?qa";
const RESULT = "F:/Dev/Projects/game-lab/_scratch/breach-qa06b-result.json";
const log = (...a) => console.log("[qa2]", ...a);

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
  await page.waitForTimeout(800);
  return { browser, page, errors };
}

const RUNNER = `
  window.__run = async (slices, sampler) => {
    const B = window.BREACH, out = [];
    for (let k = 0; k < slices; k++) {
      const t0 = performance.now();
      B.step(60);
      const wall = performance.now() - t0;
      out.push(sampler(B, k + 1, wall));
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

(async () => {
  const { browser, page, errors } = await open(NEW_URL);
  const out = { errors };
  try {
    await page.evaluate(() => { window.BREACH.pause(true); });

    // ── street 空闲成本拆解 ──
    await page.evaluate(() => { window.BREACH.setPreset("street"); });
    out.idle = await page.evaluate(() => {
      const B = window.BREACH, ee = B.world();
      const t0 = performance.now();
      B.step(300);
      const full = performance.now() - t0;
      const t1 = performance.now();
      for (let i = 0; i < 300; i++) ee.step(1 / 60);
      const eeOnly = performance.now() - t1;
      return { fullMsPerSimSec: +(full / 5).toFixed(1), eeMsPerSimSec: +(eeOnly / 5).toFixed(1), gameMsPerSimSec: +((full - eeOnly) / 5).toFixed(1), parts: B.stats().parts };
    });
    log("idle street:", JSON.stringify(out.idle));

    // ── 空袭 24 模拟秒（两波）+ 沉降观察 ──
    await page.evaluate(() => { window.BREACH.raidStart(); });
    out.raid = await run(page, 24, (B, t, wall) => {
      const s = B.stats(), r = B.raid();
      return { t, wallMs: Math.round(wall), phase: r.phase, blasts: s.blasts, active: s.active, sleeping: s.sleeping, parked: s.parked, finite: s.finite };
    });
    // 沉降期：无新爆炸，看 parked 收敛与耗时下降
    out.settle = await run(page, 14, (B, t, wall) => {
      const s = B.stats();
      return { t: t + 24, wallMs: Math.round(wall), active: s.active, sleeping: s.sleeping, parked: s.parked, cons: s.constraints, finite: s.finite };
    });
    const rows = out.settle;
    out.settleSummary = {
      first3MeanWall: Math.round(rows.slice(0, 3).reduce((a, r) => a + r.wallMs, 0) / 3),
      last3MeanWall: Math.round(rows.slice(-3).reduce((a, r) => a + r.wallMs, 0) / 3),
      finalParked: rows.at(-1).parked,
      finalActive: rows.at(-1).active,
      finalSleeping: rows.at(-1).sleeping,
      allFinite: rows.every(r => r.finite),
    };
    log("settle 14s:", JSON.stringify(out.settleSummary));
    log("raid rows:", JSON.stringify(out.raid.filter(r => r.t % 4 === 0)));
    log("settle rows:", JSON.stringify(rows));
  } finally {
    await browser.close();
  }
  fs.writeFileSync(RESULT, JSON.stringify(out, null, 2));
  log("written:", RESULT);
})().catch(e => { console.error("[qa2-fatal]", e); process.exit(1); });
