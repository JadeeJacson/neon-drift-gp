// ph() 分桶剖析：rc 3 埋点 30 模拟秒，找热点
const { chromium } = require("playwright");
const { pathToFileURL } = require("url");
const path = require("path");
const DIR = "F:/Dev/Projects/game-lab/练手小游戏/BREACH";
const URL0 = pathToFileURL(path.join(DIR, "BREACH-0.7.0.html")).href + "?qa";
const log = (...a) => console.log("[prof]", ...a);

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:\\Users\\Lenovo\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(URL0, { timeout: 30000 });
  await page.waitForFunction("!!window.BREACH", null, { timeout: 30000, polling: 200 });
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const B = window.BREACH;
    B.setPreset("rc");
    B.explode(0, 2, 0, "charge");
    B.explode(-2, 8, 2, "rpg");
    B.explode(3, 4, -3, "grenade");
    B.perfReset();
    const t0 = performance.now();
    B.step(1800);
    const wallMs = Math.round(performance.now() - t0);
    return { wallMs, brk: B.perfBreak(), parked: B.parked(), segs: B.segStats(), finite: B.stats().finite };
  });
  log(JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error("[prof] FAIL", e); process.exit(1); });
