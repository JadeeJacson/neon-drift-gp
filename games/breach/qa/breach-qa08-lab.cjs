// PERF LAB 配对矩阵：0.8.1 面板开关逐个/组合实测（瞬变窗 0-10s 交错两轮）
const { chromium } = require("playwright");
const { pathToFileURL } = require("url");
const path = require("path");
const DIR = "F:/Dev/Projects/game-lab/练手小游戏/BREACH";
const URL0 = pathToFileURL(path.join(DIR, "BREACH-0.8.1.html")).href + "?qa";
const log = (...a) => console.log("[lab]", ...a);

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

const RESET = { plBudget: "420", plStagger: "0", plIters: "7", plTol: "1e-7", plFric: "0.64", plPark: "1.6", plThrottle: "1", plDedup: "1", plStruct: "std" };
const variants = [
  ["baseline", {}],
  ["park0.5", { plPark: "0.5" }],
  ["struct-fast", { plStruct: "fast" }],
  ["throttle6", { plThrottle: "6" }],
  ["dedup-off", { plDedup: "0" }],
  ["stagger8", { plStagger: "8" }],
  ["combo-park+throttle+struct", { plPark: "0.5", plThrottle: "6", plStruct: "fast" }],
];

async function run(page, patch) {
  return page.evaluate(({ reset, patch }) => {
    const B = window.BREACH;
    for (const [k, v] of Object.entries(reset)) B.setPerfLab(k, v);
    B.setPreset("rc");
    for (const [k, v] of Object.entries(patch)) B.setPerfLab(k, v);
    B.explode(0, 2, 0, "charge");
    B.explode(-2, 8, 2, "rpg");
    B.explode(3, 4, -3, "grenade");
    B.perfReset();
    const t0 = performance.now();
    B.step(600);
    const wallMs = Math.round(performance.now() - t0);
    const brk = B.perfBreak();
    return {
      wallMs, phys: brk.perStepMs.phys, struct: brk.perStepMs.struct, sync: brk.perStepMs.sync,
      maxLive: brk.maxLiveDynamic, parked: B.parked(), finite: B.stats().finite
    };
  }, { reset: RESET, patch });
}

(async () => {
  const { browser, page } = await open();
  try {
    for (let round = 1; round <= 2; round++) {
      for (const [name, patch] of variants) {
        const r = await run(page, patch);
        log(`r${round}`, name.padEnd(26), JSON.stringify(r));
      }
    }
  } finally {
    await browser.close();
  }
})().catch(e => { console.error("[lab] FAIL", e); process.exit(1); });
