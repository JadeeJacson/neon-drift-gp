// 快速标定探针：steel 倾倒 3s 内监视器 dbg/ratio
const { chromium } = require("playwright");
const { pathToFileURL } = require("url");
const path = require("path");
const DIR = "F:/Dev/Projects/game-lab/练手小游戏/BREACH";
const URL0 = pathToFileURL(path.join(DIR, "BREACH-0.7.0.html")).href + "?qa";

(async () => {
  const browser = await chromium.launch({
    executablePath: "C:\\Users\\Lenovo\\AppData\\Local\\ms-playwright\\chromium-1243\\chrome-win64\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on("pageerror", e => console.log("[cal2] PAGEERROR", String(e).slice(0, 300)));
  await page.goto(URL0, { timeout: 30000 });
  await page.waitForFunction("!!window.BREACH", null, { timeout: 30000, polling: 200 });
  await page.waitForTimeout(700);
  const rows = await page.evaluate(() => {
    const B = window.BREACH;
    B.setCollapse({ monitor: { ratio: 1e9 }, standing: { enabled: false } });
    B.setPreset("steel");
    const rec = B.recipe();
    const cols = rec.parts.filter(p => p.type === "column" && (p.level ?? 0) === 0);
    cols.sort((a, b) => b.pos[0] - a.pos[0]);
    for (const p of cols.slice(3)) B.damagePart(p.id, 1e4);
    const out = [];
    for (let k = 0; k < 36; k++) {
      B.step(10);
      const t = B.topple(), sec = B.sections();
      out.push({
        k: +(k * 10 / 60).toFixed(2),
        theta: t.runs[0] ? +t.runs[0].theta.toFixed(3) : null,
        runs: sec.runs.map(r => ({ th: r.theta, dbg: r.dbg, ratios: r.ratios }))
      });
    }
    return out;
  });
  for (const r of rows) console.log("[cal2]", JSON.stringify(r));
  await browser.close();
})().catch(e => { console.error("[cal2] FAIL", e); process.exit(1); });
