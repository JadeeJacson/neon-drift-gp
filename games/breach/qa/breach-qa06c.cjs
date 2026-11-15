// qa06c: 沉降期物理/游戏开销拆分 + 激进回收参数对比
const { chromium } = require("playwright");
const { pathToFileURL } = require("url");
const path = require("path");
const DIR = "F:/Dev/Projects/game-lab/练手小游戏/BREACH";
const NEW_URL = pathToFileURL(path.join(DIR, "BREACH-0.6.0.html")).href + "?qa";
const log = (...a) => console.log("[qa3]", ...a);

async function open(url) {
  const browser = await chromium.launch({
    executablePath: "C:\\Users\\Lenovo\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on("pageerror", e => console.log("[pageerror]", String(e).slice(0, 200)));
  await page.goto(url, { timeout: 30000 });
  await page.waitForFunction("!!window.BREACH", null, { timeout: 30000, polling: 200 });
  await page.waitForTimeout(800);
  return { browser, page };
}

(async () => {
  const { browser, page } = await open(NEW_URL);
  try {
    await page.evaluate(() => { window.BREACH.pause(true); window.BREACH.setPreset("street"); window.BREACH.raidStart(); });
    // 快进 24 模拟秒（两波空袭）
    await page.evaluate(() => { for (let i = 0; i < 24; i++) window.BREACH.step(60); });
    // 沉降期逐秒采样 + 每秒做一次 30 步 ee.step 微基准
    for (let k = 0; k < 10; k++) {
      const row = await page.evaluate(() => {
        const B = window.BREACH, ee = B.world();
        const t0 = performance.now();
        B.step(60);
        const full = performance.now() - t0;
        const t1 = performance.now();
        for (let i = 0; i < 30; i++) ee.step(1 / 60);
        const eeMs = performance.now() - t1;
        const s = B.stats();
        return { full: Math.round(full), eeMsPerSec: Math.round(eeMs * 2), active: s.active, sleeping: s.sleeping, parked: s.parked, cons: s.constraints, solver: { iters: s.structural.iterations, residual: +s.structural.residual.toExponential(1) } };
      });
      log("settle", k + 1, JSON.stringify(row));
    }
  } finally {
    await browser.close();
  }
})().catch(e => { console.error("[qa3-fatal]", e); process.exit(1); });
