// 干净配对：每轮显式还原全部旋钮，rc 0-10s 瞬变窗
const { chromium } = require("playwright");
const { pathToFileURL } = require("url");
const path = require("path");
const DIR = "F:/Dev/Projects/game-lab/练手小游戏/BREACH";
const URL0 = pathToFileURL(path.join(DIR, "BREACH-0.7.0.html")).href + "?qa";
const log = (...a) => console.log("[tr2]", ...a);

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
  ["baseline", 1e-7, 0.64, 9],
  ["tol1e-3", 1e-3, 0.64, 9],
  ["tol1e-2", 1e-2, 0.64, 9],
  ["tol1e-3+fric0.4", 1e-3, 0.4, 9],
  ["tol1e-3+iter7", 1e-3, 0.64, 7],
];

(async () => {
  const { browser, page } = await open();
  try {
    for (let round = 1; round <= 2; round++) {
      for (const [name, tol, fric, iters] of variants) {
        const r = await page.evaluate(({ tol, fric, iters }) => {
          const B = window.BREACH;
          B.setPreset("rc");
          const w = B.world();
          w.solver.tolerance = tol;
          w.defaultContactMaterial.friction = fric;
          w.solver.iterations = iters;
          B.setPark(1.6);
          B.explode(0, 2, 0, "charge");
          B.explode(-2, 8, 2, "rpg");
          B.explode(3, 4, -3, "grenade");
          B.perfReset();
          const t0 = performance.now();
          B.step(600);
          const wallMs = Math.round(performance.now() - t0);
          const brk = B.perfBreak();
          return { wallMs, phys: brk.perStepMs.phys, maxLive: brk.maxLiveDynamic, parked: B.parked(), finite: B.stats().finite };
        }, { tol, fric, iters });
        log(`r${round}`, name, JSON.stringify(r));
      }
    }
  } finally {
    await browser.close();
  }
})().catch(e => { console.error("[tr2] FAIL", e); process.exit(1); });
