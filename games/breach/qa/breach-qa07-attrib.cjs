// BREACH 0.7 归因/标定：性能热点归因(站立截面/倾倒监视/分段行为) + 监视容量系数标定
// 运行：NODE_PATH=... node _scratch/breach-qa07-attrib.cjs
const { chromium } = require("playwright");
const { pathToFileURL } = require("url");
const path = require("path");

const DIR = "F:/Dev/Projects/game-lab/练手小游戏/BREACH";
const NEW_URL = pathToFileURL(path.join(DIR, "BREACH-0.7.0.html")).href + "?qa";
const log = (...a) => console.log("[attrib]", ...a);

async function open() {
  const browser = await chromium.launch({
    executablePath: "C:\\Users\\Lenovo\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", e => errors.push(String(e).slice(0, 200)));
  await page.goto(NEW_URL, { timeout: 30000 });
  await page.waitForFunction("!!window.BREACH", null, { timeout: 30000, polling: 200 });
  await page.waitForTimeout(800);
  return { browser, page, errors };
}

(async () => {
  const { browser, page, errors } = await open();
  try {
    // ── 性能归因：rc 3 埋点 30 模拟秒，逐开关 ──
    const variants = [
      ["all-on", {}],
      ["snap-dead", { standing: { util: 1e9 } }],
      ["standing-off", { standing: { enabled: false } }],
      ["monitor-off", { monitor: { enabled: false } }],
      ["both-off", { standing: { enabled: false }, monitor: { enabled: false } }],
    ];
    const perf = {};
    for (const [name, patch] of variants) {
      const r = await page.evaluate(({ patch }) => {
        const B = window.BREACH;
        B.setCollapse(patch);
        B.reset && B.reset();
        B.setPreset("rc");
        B.explode(0, 2, 0, "charge");
        B.explode(-2, 8, 2, "rpg");
        B.explode(3, 4, -3, "grenade");
        const t0 = performance.now();
        B.step(1800);
        const s = B.stats();
        return {
          wallMs: Math.round(performance.now() - t0),
          finite: s.finite, parked: B.parked(),
          segs: B.segStats(), failed: s.structural && s.structural.failed
        };
      }, { patch });
      perf[name] = r;
      log("perf", name, JSON.stringify(r));
    }

    // ── 容量标定：steel 倾倒过程 ratio 曲线(监视只记不折) ──
    const cal = await page.evaluate(() => {
      const B = window.BREACH;
      B.setCollapse({ monitor: { ratio: 1e9 }, standing: { enabled: false } });
      B.setPreset("steel");
      const rec = B.recipe();
      const cols = rec.parts.filter(p => p.type === "column" && (p.level ?? 0) === 0);
      cols.sort((a, b) => b.pos[0] - a.pos[0]);
      for (const p of cols.slice(3)) B.damagePart(p.id, 1e4);
      const rows = [];
      for (let k = 0; k < 30; k++) {
        B.step(10);
        const t = B.topple(), sec = B.sections();
        rows.push({
          k: k * 10 / 60,
          theta: t.runs[0] ? +t.runs[0].theta.toFixed(3) : null,
          alpha: t.runs[0] ? +t.runs[0].raw && 0 : null,
          ratios: sec.runs.map(r => r.ratios.map(x => ({ cut: x.cut, ratio: x.ratio, demand: x.demand, cap: x.cap })))
        });
      }
      return rows;
    });
    for (const r of cal) log("cal", JSON.stringify(r));
  } finally {
    await browser.close();
  }
  if (errors.length) log("errors:", errors);
})().catch(e => { console.error("[attrib] FAIL", e && e.stack || e); process.exit(1); });
