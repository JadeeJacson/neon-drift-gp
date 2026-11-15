// 瞬变窗口配对实验：rc 0-10s，变体交错两轮，压并发动态接触
const { chromium } = require("playwright");
const { pathToFileURL } = require("url");
const path = require("path");
const DIR = "F:/Dev/Projects/game-lab/练手小游戏/BREACH";
const URL0 = pathToFileURL(path.join(DIR, "BREACH-0.7.0.html")).href + "?qa";
const log = (...a) => console.log("[tr]", ...a);

async function open() {
  const browser = await chromium.launch({
    executablePath: "C:\\Users\\Lenovo\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(URL0, { timeout: 30000 });
  await page.waitForFunction("!!window.BREACH", null, { timeout: 30000, polling: 200 });
  await page.waitForTimeout(700);
  return { browser, page };
}

const variants = [
  ["default", {}],
  ["park1.0", { park: 1.0 }],
  ["tol0.01", { tol: 0.01 }],
  ["park1.0+tol0.01", { park: 1.0, tol: 0.01 }],
];

async function run(page, v) {
  return page.evaluate((v) => {
    const B = window.BREACH;
    B.setPreset("rc");
    const w = B.world();
    if (v.park !== undefined) B.setPark(v.park);
    if (v.tol !== undefined) w.solver.tolerance = v.tol;
    B.explode(0, 2, 0, "charge");
    B.explode(-2, 8, 2, "rpg");
    B.explode(3, 4, -3, "grenade");
    B.perfReset();
    const t0 = performance.now();
    B.step(600);
    const wallMs = Math.round(performance.now() - t0);
    const brk = B.perfBreak();
    return { wallMs, phys: brk.perStepMs.phys, maxLive: brk.maxLiveDynamic, parked: B.parked(), finite: B.stats().finite };
  }, v);
}

(async () => {
  const { browser, page } = await open();
  try {
    log("defaults:", JSON.stringify(await page.evaluate(() => {
      const w = window.BREACH.world();
      return { friction: w.defaultContactMaterial.friction, tolerance: w.solver.tolerance, iterations: w.solver.iterations };
    })));
    for (let round = 1; round <= 2; round++) {
      for (const [name, v] of variants) {
        const r = await run(page, v);
        log(`r${round}`, name, JSON.stringify(r));
      }
    }
  } finally {
    await browser.close();
  }
})().catch(e => { console.error("[tr] FAIL", e); process.exit(1); });
