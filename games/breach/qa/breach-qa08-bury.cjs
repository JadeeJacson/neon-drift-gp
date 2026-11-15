// 废墟治理实测：rc 30s + 二轮爆破用例，off/fix/hide/gone 对照
const { chromium } = require("playwright");
const { pathToFileURL } = require("url");
const path = require("path");
const DIR = "F:/Dev/Projects/game-lab/练手小游戏/BREACH";
const URL0 = pathToFileURL(path.join(DIR, "BREACH-0.8.1.html")).href + "?qa";
const log = (...a) => console.log("[bury]", ...a);

async function open() {
  const browser = await chromium.launch({
    executablePath: "C:/Users/Lenovo/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(URL0, { timeout: 30000 });
  await page.waitForFunction("!!window.BREACH", null, { timeout: 30000, polling: 200 });
  await page.waitForTimeout(700);
  return { browser, page };
}

(async () => {
  const { browser, page } = await open();
  try {
    // 用例 A：单轮 3 埋点 30 模拟秒
    for (const mode of ["off", "fix", "hide", "gone"]) {
      const r = await page.evaluate((mode) => {
        const B = window.BREACH;
        B.setPerfLab("plBury", mode);
        B.setPerfLab("plBuryDelay", "6");
        B.setPreset("rc");
        B.explode(0, 2, 0, "charge");
        B.explode(-2, 8, 2, "rpg");
        B.explode(3, 4, -3, "grenade");
        B.perfReset();
        const t0 = performance.now();
        B.step(1800);
        const wallMs = Math.round(performance.now() - t0);
        const brk = B.perfBreak();
        return { mode, wallMs, phys: brk.perStepMs.phys, buried: B.bury(), finite: B.stats().finite };
      }, mode);
      log("A", mode.padEnd(5), JSON.stringify(r));
    }
    // 用例 B：沉降后二轮爆破（治理收益的主战场）
    for (const mode of ["off", "gone"]) {
      const r = await page.evaluate((mode) => {
        const B = window.BREACH;
        B.setPerfLab("plBury", mode);
        B.setPerfLab("plBuryDelay", "3");
        B.setPreset("rc");
        B.explode(0, 2, 0, "charge");
        B.explode(-2, 8, 2, "rpg");
        B.explode(3, 4, -3, "grenade");
        B.step(900);
        B.perfReset();
        const t0 = performance.now();
        B.explode(1, 3, 1, "charge");
        B.explode(-1, 7, -2, "rpg");
        B.step(900);
        const wallMs = Math.round(performance.now() - t0);
        const brk = B.perfBreak();
        return { mode, wallMs, phys: brk.perStepMs.phys, buried: B.bury(), finite: B.stats().finite };
      }, mode);
      log("B", mode.padEnd(5), JSON.stringify(r));
    }
  } finally {
    await browser.close();
  }
})().catch(e => { console.error("[bury] FAIL", e); process.exit(1); });
