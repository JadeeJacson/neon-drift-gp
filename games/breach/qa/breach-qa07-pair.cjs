// 交错配对基线：0.6 / 0.7(both-off) 各两轮，确认残余性能差是否真实
const { chromium } = require("playwright");
const { pathToFileURL } = require("url");
const path = require("path");

const DIR = "F:/Dev/Projects/game-lab/练手小游戏/BREACH";
const NEW_URL = pathToFileURL(path.join(DIR, "BREACH-0.7.0.html")).href + "?qa";
const OLD_URL = pathToFileURL(path.join(DIR, "BREACH-0.6.0.html")).href + "?qa";
const log = (...a) => console.log("[pair]", ...a);

async function open(url) {
  const browser = await chromium.launch({
    executablePath: "C:\\Users\\Lenovo\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(url, { timeout: 30000 });
  await page.waitForFunction("!!window.BREACH", null, { timeout: 30000, polling: 200 });
  await page.waitForTimeout(700);
  return { browser, page };
}

async function perf(page, patch) {
  return page.evaluate((patch) => {
    const B = window.BREACH;
    if (patch && B.setCollapse) B.setCollapse(patch);
    B.setPreset("rc");
    B.explode(0, 2, 0, "charge");
    B.explode(-2, 8, 2, "rpg");
    B.explode(3, 4, -3, "grenade");
    const t0 = performance.now();
    B.step(1800);
    return { wallMs: Math.round(performance.now() - t0), finite: B.stats().finite };
  }, patch || null);
}

(async () => {
  const n = await open(NEW_URL);
  const o = await open(OLD_URL);
  try {
    for (let round = 1; round <= 2; round++) {
      const oldR = await perf(o.page, null);
      const newR = await perf(n.page, { standing: { enabled: false }, monitor: { enabled: false } });
      log(`round ${round}  0.6=${oldR.wallMs}ms  0.7-both-off=${newR.wallMs}ms  ratio=${(newR.wallMs / oldR.wallMs).toFixed(3)}`);
    }
  } finally {
    await n.browser.close();
    await o.browser.close();
  }
})().catch(e => { console.error("[pair] FAIL", e); process.exit(1); });
