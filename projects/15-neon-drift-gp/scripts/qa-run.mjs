/**
 * Local QA runner: uses system Google Chrome (Playwright channel:"chrome")
 * because bundled chromium download was unavailable.
 * Writes inspector-compatible JSON for check_evidence.py.
 */
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.QA_URL ?? 'http://127.0.0.1:5188';
const OUT = path.resolve('artifacts/pass-1');
fs.mkdirSync(OUT, { recursive: true });

function analyze(buffer) {
  const png = PNG.sync.read(buffer);
  let min = 255;
  let max = 0;
  let alpha = 0;
  const hist = new Map();
  const buckets = new Set();
  const stride = Math.max(1, Math.floor((png.width * png.height) / 8192));
  let n = 0;
  for (let i = 0; i < png.width * png.height; i += stride) {
    const o = i * 4;
    const r = png.data[o];
    const g = png.data[o + 1];
    const b = png.data[o + 2];
    const a = png.data[o + 3];
    min = Math.min(min, r, g, b);
    max = Math.max(max, r, g, b);
    if (a > 0) alpha += 1;
    buckets.add(`${r >> 4},${g >> 4},${b >> 4},${a >> 6}`);
    const key = (r >> 3) * 1024 + (g >> 3) * 32 + (b >> 3);
    hist.set(key, (hist.get(key) ?? 0) + 1);
    n += 1;
  }
  let entropy = 0;
  for (const count of hist.values()) {
    const p = count / n;
    entropy -= p * Math.log2(p);
  }
  const ok = alpha > 256 && (max - min > 8 || buckets.size > 3);
  return {
    ok,
    metrics: {
      colorEntropyBits: Math.round(entropy * 100) / 100,
      colorBuckets: buckets.size,
      variance: max - min,
      alphaPixels: alpha,
    },
  };
}

async function runMode(browser, mode) {
  const context = await browser.newContext(
    mode === 'mobile'
      ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
      : { viewport: { width: 1280, height: 720 } },
  );
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  const t0 = Date.now();
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => (window.__THREE_GAME_DIAGNOSTICS__?.frame ?? 0) > 5, null, {
    timeout: 30000,
  });
  const loadMs = Date.now() - t0;

  const stateAck = await page.evaluate(() => {
    const hooks = window.__THREE_GAME_TEST_HOOKS__;
    if (!hooks) return { error: 'no-hooks' };
    hooks.seed(42);
    const ack = hooks.setState('active-play');
    hooks.setPausedForScreenshot(true);
    return ack;
  });
  await page.waitForTimeout(500);

  const canvas = page.locator('#game-canvas');
  const box = await canvas.boundingBox();
  const shot = await canvas.screenshot();
  const shotRel = path
    .relative(path.resolve('.'), path.join(OUT, `${mode}-active-play.png`))
    .split(path.sep)
    .join('/');
  fs.writeFileSync(path.join(OUT, `${mode}-active-play.png`), shot);
  const analysis = analyze(shot);

  await page.evaluate(() => window.__THREE_GAME_TEST_HOOKS__?.setPausedForScreenshot(false));
  const before = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.player.position.z ?? 0);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(600);
  await page.keyboard.up('KeyW');
  const after = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.player.position.z ?? 0);
  await page.screenshot({ path: path.join(OUT, `${mode}-full.png`), fullPage: true });

  const diag = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__);
  const report = {
    runId: 'pass-1',
    mode,
    state: 'active-play',
    requestedState: 'active-play',
    appliedState: stateAck?.state ?? null,
    screenshotPath: shotRel,
    consoleErrors,
    pageErrors,
    result: {
      ok: analysis.ok && stateAck?.state === 'active-play' && consoleErrors.length === 0 && pageErrors.length === 0,
      reason: 'sampled',
      metrics: analysis.metrics,
      canvas: box,
      moved: { before, after, delta: after - before },
      loadMs,
      diagnostics: diag,
      rendererGpuNote: 'channel:chrome system browser',
    },
  };
  fs.writeFileSync(path.join(OUT, `${mode}-active-play.json`), JSON.stringify(report, null, 2));
  await context.close();
  return report;
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
for (const mode of ['desktop', 'mobile']) {
  try {
    results.push(await runMode(browser, mode));
  } catch (err) {
    results.push({ mode, result: { ok: false }, error: String(err) });
  }
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
process.exit(results.every((r) => r.result?.ok) ? 0 : 1);
