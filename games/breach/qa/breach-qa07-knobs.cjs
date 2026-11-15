// 旋钮矩阵：rc 30 模拟秒，测 releasePerStep/摩擦/迭代/接触对方程量
const { chromium } = require("playwright");
const { pathToFileURL } = require("url");
const path = require("path");
const DIR = "F:/Dev/Projects/game-lab/练手小游戏/BREACH";
const URL0 = pathToFileURL(path.join(DIR, "BREACH-0.7.0.html")).href + "?qa";
const log = (...a) => console.log("[knobs]", ...a);

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

(async () => {
  const { browser, page } = await open();
  try {
    const variants = [
      ["budget-off", { releasePerStep: 1e6 }, null, null],
      ["budget-16", { releasePerStep: 16 }, null, null],
      ["budget-off+fric0", { releasePerStep: 1e6 }, 0, null],
      ["budget-off+iter4", { releasePerStep: 1e6 }, null, 4],
      ["budget-off+fric0.15+iter6", { releasePerStep: 1e6 }, 0.15, 6],
    ];
    for (const [name, patch, friction, iters] of variants) {
      const r = await page.evaluate(({ patch, friction, iters }) => {
        const B = window.BREACH;
        // 释放预算走 setCollapse 不到 budgets——用探针直接改行不通,这里用 setQuality 刷新后手改
        B.setPreset("rc");
        const w = B.world();
        if (friction !== null) w.defaultContactMaterial.friction = friction;
        if (iters !== null) w.solver.iterations = iters;
        B.explode(0, 2, 0, "charge");
        B.explode(-2, 8, 2, "rpg");
        B.explode(3, 4, -3, "grenade");
        B.perfReset();
        const t0 = performance.now();
        B.step(1800);
        const wallMs = Math.round(performance.now() - t0);
        const brk = B.perfBreak();
        let maxEq = 0;
        return {
          wallMs, phys: brk.perStepMs.phys, struct: brk.perStepMs.struct,
          parked: B.parked(), finite: B.stats().finite,
          eqs: w.solver.equations.length, contacts: w.contacts.length
        };
      }, { patch, friction, iters });
      log(name, JSON.stringify(r));
    }
  } finally {
    await browser.close();
  }
})().catch(e => { console.error("[knobs] FAIL", e); process.exit(1); });
