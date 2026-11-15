// 物理耗时曲线：rc 30 模拟秒，每 5s 一个采样窗
const { chromium } = require("playwright");
const { pathToFileURL } = require("url");
const path = require("path");
const DIR = "F:/Dev/Projects/game-lab/练手小游戏/BREACH";
const URL0 = pathToFileURL(path.join(DIR, "BREACH-0.7.0.html")).href + "?qa";
const log = (...a) => console.log("[curve]", ...a);

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:\\Users\\Lenovo\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(URL0, { timeout: 30000 });
  await page.waitForFunction("!!window.BREACH", null, { timeout: 30000, polling: 200 });
  await page.waitForTimeout(700);
  const rows = await page.evaluate(() => {
    const B = window.BREACH;
    B.setPreset("rc");
    B.explode(0, 2, 0, "charge");
    B.explode(-2, 8, 2, "rpg");
    B.explode(3, 4, -3, "grenade");
    const out = [];
    for (let w = 0; w < 6; w++) {
      B.perfReset();
      const t0 = performance.now();
      B.step(300);
      const wallMs = Math.round(performance.now() - t0);
      const brk = B.perfBreak();
      out.push({
        window: `${w * 5}-${(w + 1) * 5}s`, wallMs, phys: brk.perStepMs.phys,
        struct: brk.perStepMs.struct, sync: brk.perStepMs.sync,
        parked: B.parked(), live: brk.liveDynamic, maxLive: brk.maxLiveDynamic, q: brk.queueLen
      });
    }
    return out;
  });
  for (const r of rows) log(JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error("[curve] FAIL", e); process.exit(1); });
