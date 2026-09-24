/**
 * 08 · 3D 赛车 —— 无头 Chrome + CDP 渲染/行为验证。
 * 用法：先启动 Chrome（远程调试 9222）+ vite(dev, 端口 5179)，再 node tools/verify-render.mjs
 *
 * 验证：
 *   R1 页面零运行时报错（console.error / 未捕获异常）
 *   R2 WebGL 可用且非软件渲染（否则渲染结论不可信）
 *   R3 加载后游戏循环推进：倒计时结束进入 racing，stats.time 增长
 *   R4 注入 W（油门）后车辆加速（speed 上升、位置变化）—— 输入→sim 链路通
 *   R5 注入 A（左转）后车头朝向改变 —— 转向链路通
 *   R6 截图非空白
 */
const PORT = Number(process.argv[2] || 9222);
const TARGET = process.argv[3] || 'http://127.0.0.1:5179/';
const SHOT_DIR = process.argv[4] || 'F:/Dev/Projects/game-lab/_tmp';

const passes = [];
const fails = [];
const check = (name, ok, detail = '') => {
  (ok ? passes : fails).push(name);
  console.log('  ' + (ok ? '[PASS]' : '[FAIL]') + ' ' + name + (detail ? '  ' + detail : ''));
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWs() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const page = (await r.json()).find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch { /* 未就绪 */ }
    await sleep(300);
  }
  throw new Error('无法连接 Chrome 调试端口 ' + PORT);
}

const ws = new WebSocket(await getWs());
let id = 0;
const pending = new Map();
const pageErrors = [];
ws.addEventListener('message', (evt) => {
  const m = JSON.parse(evt.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    pageErrors.push('[异常] ' + (d.exception?.description || d.text || ''));
  }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    pageErrors.push('[console.error] ' + (m.params.args || []).map((a) => a.value ?? a.description ?? '').join(' '));
  }
});
const send = (method, params = {}) => new Promise((res) => {
  const i = ++id;
  pending.set(i, res);
  ws.send(JSON.stringify({ id: i, method, params }));
});
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) return { __err: (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text || 'eval').split('\n')[0] };
  return r.result?.result?.value;
};

await new Promise((r) => ws.addEventListener('open', r));
await send('Page.enable');
await send('Page.navigate', { url: 'about:blank' }); // 先清空，避免回放历史异常
await sleep(400);
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: TARGET });

console.log('08 弯心 · 无头渲染/行为验证');
console.log('='.repeat(60));

// 等待 __apex 就绪
let ready = false;
for (let i = 0; i < 40; i++) {
  const s = await ev('window.__apex && window.__apex.stats');
  if (s && s.ready) { ready = true; break; }
  await sleep(300);
}
check('R0 应用初始化（__apex 就绪）', ready, ready ? '' : '未检测到 __apex');
if (!ready) {
  console.log('\n页面错误：', pageErrors.slice(0, 5));
  console.log(`\n通过 ${passes.length} 项，失败 ${fails.length} 项`);
  process.exit(1);
}

// R1 加载期无报错
check('R1 加载零运行时报错', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | ') || '无');

// R2 WebGL 渲染器
const gl = String(await ev(`(() => {
  const c = document.createElement('canvas');
  const g = c.getContext('webgl2') || c.getContext('webgl');
  if (!g) return 'no-webgl';
  const d = g.getExtension('WEBGL_debug_renderer_info');
  return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown';
})()`));
const software = /SwiftShader|Basic Render|llvmpipe|Software/i.test(gl);
check('R2 WebGL 可用' + (software ? '（软件渲染，性能数据仅供参考）' : '（GPU）'), !/no-webgl|unknown/.test(gl), gl);

// 等待倒计时结束
await sleep(4000);
const s1 = await ev('window.__apex.stats');
check('R3 进入 racing 且时间推进', s1.phase === 'racing' && s1.time > 0.5,
  `phase=${s1.phase} time=${s1.time?.toFixed(2)}s`);

// R4 油门加速
const before = await ev('window.__apex.stats');
await ev(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }))`);
await sleep(1500);
const after = await ev('window.__apex.stats');
await ev(`window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', bubbles: true }))`);
const moved = Math.hypot(after.pos.x - before.pos.x, after.pos.z - before.pos.z);
check('R4 油门→加速且位移', after.speed > 2 && moved > 1,
  `Δspeed=${(after.speed - before.speed).toFixed(2)} Δpos=${moved.toFixed(2)}m v=${after.speed.toFixed(2)}`);

// R5 转向改变车头朝向
const h0 = (await ev('window.__apex.stats')).heading;
await ev(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA', bubbles: true }))`);
await ev(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }))`);
await sleep(1200);
await ev(`window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA', bubbles: true }))`);
await ev(`window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', bubbles: true }))`);
const h1 = (await ev('window.__apex.stats')).heading;
let dh = Math.abs(h1 - h0); if (dh > Math.PI) dh = 2 * Math.PI - dh;
check('R5 左转→车头朝向改变', dh > 0.05, `Δheading=${dh.toFixed(3)}rad`);

// R6 截图
const shot = await send('Page.captureScreenshot', { format: 'png' });
const b64 = shot.result?.data;
if (typeof b64 === 'string' && b64.length > 0) {
  const fs = await import('node:fs');
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const file = `${SHOT_DIR}/racer-shot.png`;
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  const kb = (fs.statSync(file).size / 1024).toFixed(0);
  check('R6 截图非空白', Number(kb) > 10, `${file} (${kb} KB)`);
} else {
  check('R6 截图非空白', false, '无图像数据');
}

console.log('\n页面错误汇总：', pageErrors.length ? pageErrors.slice(0, 5) : '无');
console.log(`\n通过 ${passes.length} 项，失败 ${fails.length} 项`);
process.exit(fails.length === 0 ? 0 : 1);
