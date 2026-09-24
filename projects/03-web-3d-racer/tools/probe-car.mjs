/**
 * 临时探针：连接 CDP，打开游戏，读取 __apex.stats + __apex.debug，截图。
 * 用法：node tools/probe-car.mjs [port] [target] [shotPath]
 */
const PORT = Number(process.argv[2] || 9222);
const TARGET = process.argv[3] || 'http://127.0.0.1:5179/';
const SHOT = process.argv[4] || 'F:/Dev/Projects/game-lab/_tmp/probe-shot.png';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
const page = (await r.json()).find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener('message', (evt) => {
  const m = JSON.parse(evt.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => new Promise((res) => {
  const i = ++id;
  pending.set(i, res);
  ws.send(JSON.stringify({ id: i, method, params }));
});
const ev = async (expr) => {
  const r2 = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r2.result?.exceptionDetails) return { __err: r2.result.exceptionDetails.exception?.description || 'eval' };
  return r2.result?.result?.value;
};
await new Promise((r3) => ws.addEventListener('open', r3));
await send('Page.enable');
await send('Page.navigate', { url: 'about:blank' });
await sleep(300);
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: TARGET });

let ready = false;
for (let i = 0; i < 40; i++) {
  const s = await ev('window.__apex && window.__apex.stats');
  if (s && s.ready) { ready = true; break; }
  await sleep(300);
}
if (!ready) { console.log('NOT READY'); process.exit(1); }
await sleep(3500); // 等 racing + 相机稳定

const stats = await ev('window.__apex.stats');
const dbg = await ev('window.__apex.debug');
console.log('stats =', JSON.stringify(stats, null, 2));
console.log('debug =', JSON.stringify(dbg, null, 2));

// 相机→车 向量与「视线夹角」估算（把车中心近似在 groupPos + 0.6y）
if (dbg?.camPos && dbg?.carGroupPos) {
  const c = dbg.camPos, g = dbg.carGroupPos;
  const dx = g[0] - c[0], dy = g[1] + 0.6 - c[1], dz = g[2] - c[2];
  const dist = Math.hypot(dx, dy, dz);
  console.log(`cam→car 距离 = ${dist.toFixed(2)}m`);
}
const shot = await send('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) {
  const fs = await import('node:fs');
  fs.writeFileSync(SHOT, Buffer.from(shot.result.data, 'base64'));
  console.log('screenshot ->', SHOT);
}

// —— 行驶后再截一张：油门 1.5s → 松开 → 等 2.5s（相机追上减速的车）——
await ev(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }))`);
await sleep(1500);
await ev(`window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', bubbles: true }))`);
await sleep(2500);
const stats2 = await ev('window.__apex.stats');
const dbg2 = await ev('window.__apex.debug');
console.log('after-drive speed =', stats2.speed?.toFixed(2), 'm/s');
const SHOT2 = SHOT.replace(/\.png$/, '-moving.png');
const shot2 = await send('Page.captureScreenshot', { format: 'png' });
if (shot2.result?.data) {
  const fs2 = await import('node:fs');
  fs2.writeFileSync(SHOT2, Buffer.from(shot2.result.data, 'base64'));
  console.log('screenshot ->', SHOT2, '| cam=', dbg2.camPos.map((v) => v.toFixed(1)).join(','), '| car=', dbg2.carGroupPos.map((v) => v.toFixed(1)).join(','));
}
process.exit(0);
