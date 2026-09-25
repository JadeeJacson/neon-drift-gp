/**
 * 05 方块足球 —— 无头 Chrome + CDP 端到端验证。
 *
 * 用法：先起 dev server（5182）与无头 Chrome（9222），再
 *   node tools/verify-render.mjs 9222 http://127.0.0.1:5182/ F:/Dev/Projects/game-lab/_tmp
 *
 * 验证的是「链路通不通」，不是「好不好玩」：
 *   R1  页面零运行时报错
 *   R2  WebGL2 可用
 *   R3  开始后 sim 推进（phase=playing、time 增长）
 *   R4  球与方块人存在
 *   R5  移动链路：注入 W → 位置变化
 *   R6  踢球链路：按住→松开 → 球速增加、音效计数增加
 *   R7  进球链路：球进对方球门 → 比分 +1
 *   R9  渲染非空：draw call / 三角面数 > 0
 *   R10 方块人视图（前锋 + 守门员）
 *   R11 截图非空白
 */
const PORT = Number(process.argv[2] || 9222);
const TARGET = process.argv[3] || 'http://127.0.0.1:5182/';
const SHOT_DIR = process.argv[4] || 'F:/Dev/Projects/game-lab/_tmp';

const passes = [];
const fails = [];
const check = (name, ok, detail = '') => {
  (ok ? passes : fails).push(name);
  console.log('  ' + (ok ? '[PASS]' : '[FAIL]') + ' ' + name + (detail ? '  ' + detail : ''));
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWs() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const page = (await r.json()).find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* 未就绪 */
    }
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
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
    return;
  }
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    pageErrors.push('[异常] ' + (d.exception?.description || d.text || ''));
  }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    pageErrors.push('[console.error] ' + (m.params.args || []).map((a) => a.value ?? a.description ?? '').join(' '));
  }
});
const send = (method, params = {}) =>
  new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) {
    return {
      __err: (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text || 'eval')
        .split('\n')
        .slice(0, 2)
        .join(' | '),
    };
  }
  return r.result?.result?.value;
};

await new Promise((r) => ws.addEventListener('open', r));
await send('Page.enable');
await send('Page.navigate', { url: 'about:blank' });
await sleep(400);
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: TARGET });
await sleep(800);
await send('Page.reload', { ignoreCache: true });
await sleep(800);

let ready = false;
for (let i = 0; i < 60; i++) {
  const t = await ev('typeof window.__ball');
  if (t === 'object') {
    ready = true;
    break;
  }
  await sleep(400);
}
console.log('=== 05 方块足球 · CDP 渲染验证 ===');
check('R0 页面加载并暴露 __ball 接口', ready);

const renderer = await ev(`(() => {
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl2');
  if (!gl) return 'no-webgl2';
  const d = gl.getExtension('WEBGL_debug_renderer_info');
  return d ? String(gl.getParameter(d.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
})()`);
console.log('  渲染器: ' + renderer);
check('R2 WebGL2 可用', typeof renderer === 'string' && renderer !== 'no-webgl2', String(renderer));

await ev('window.__ball.start()');
await sleep(1500);
const s1 = await ev('window.__ball.state()');
console.log('  起始状态: phase=' + s1.phase + ' time=' + s1.time?.toFixed(2) + ' score=' + s1.scoreBlue + ':' + s1.scoreRed);
check('R3 开始后进入 playing 且时间推进', s1.phase === 'playing' && s1.time > 0, `time=${s1.time?.toFixed(2)}s`);

// R4 球与方块人存在
const ball0 = await ev('window.__ball.ball()');
const actors0 = await ev('window.__ball.actors()');
check(
  'R4 球与方块人存在',
  ball0 && typeof ball0.pos?.x === 'number' && Array.isArray(actors0) && actors0.length === 3,
  `ball=(${ball0?.pos?.x?.toFixed(1)},${ball0?.pos?.z?.toFixed(1)}) actors=${actors0?.length}`,
);

// R5 移动链路
const p0 = await ev('window.__ball.state().pos');
await ev('window.__ball.setInput({ forward: 1 })');
await sleep(1800);
const p1 = await ev('window.__ball.state().pos');
await ev('window.__ball.setInput({ forward: 0 })');
const moved = Math.hypot(p1.x - p0.x, p1.z - p0.z);
check('R5 注入前进后玩家位移（输入→sim 链路通）', moved > 0.3, `Δ=${moved.toFixed(2)}m`);

// R6 踢球链路：把球放到玩家脚前，蓄力后松开
await ev('window.__ball.debugPlaceBall(-5.0, 0)');
await sleep(200);
const audioBefore = await ev('window.__ball.audioInfo()');
await ev('window.__ball.setInput({ kick: true })');
await sleep(900);
await ev('window.__ball.setInput({ kick: false })');
await sleep(300);
const ballAfter = await ev('window.__ball.ball()');
const audioAfter = await ev('window.__ball.audioInfo()');
check('R6 蓄力松开后球获得速度（踢球链路通）', ballAfter.speed > 3, `球速 ${ballAfter.speed?.toFixed(1)} m/s`);
check(
  'R6b 音效硬指标：AudioContext 已建立且事件计数在涨',
  audioAfter.state !== 'none' && audioAfter.playCount > audioBefore.playCount,
  `state=${audioAfter.state} count=${audioBefore.playCount}→${audioAfter.playCount} last=${audioAfter.last}`,
);

// R7 进球链路：把球放到对方门前，踢进去
const scoreBefore = await ev('window.__ball.state().scoreBlue');
await ev('window.__ball.debugPlaceBall(17, 0)');
await sleep(150);
await ev('window.__ball.debugKickBall(1, 0.05, 0, 16)');
let scoreAfter = scoreBefore;
for (let i = 0; i < 12; i++) {
  await sleep(300);
  scoreAfter = await ev('window.__ball.state().scoreBlue');
  if (scoreAfter > scoreBefore) break;
}
check('R7 球进对方球门触发进球（比分 +1）', scoreAfter > scoreBefore, `scoreBlue ${scoreBefore}→${scoreAfter}`);

// R10 方块人视图：前锋 + 守门员
const roles = await ev('window.__ball.actors().map(a => a.role)');
check(
  'R10 方块人视图（前锋 + 守门员）',
  Array.isArray(roles) && roles.includes('striker') && roles.includes('keeper'),
  Array.isArray(roles) ? roles.join(',') : String(roles),
);

// R9 渲染统计（强制渲染一帧再读）
const info = await ev('window.__ball.info()');
check('R9 渲染非空：draw call 与三角面数 > 0', info.drawCalls > 0 && info.triangles > 0,
  `drawCalls=${info.drawCalls} triangles=${info.triangles} programs=${info.programs}`);

// R11 截图
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await sleep(600);
const shot = await send('Page.captureScreenshot', { format: 'png' });
const buf = Buffer.from(shot.result.data, 'base64');
const fs = await import('node:fs');
const path = `${SHOT_DIR}/05-blockball.png`;
fs.writeFileSync(path, buf);
check('R11 截图非空白（体积 > 25KB）', buf.length > 25 * 1024, `${(buf.length / 1024).toFixed(0)}KB → ${path}`);

check('R1 全程零运行时报错', pageErrors.length === 0, pageErrors.slice(0, 3).join(' ; '));

console.log(`\n=== 汇总：${passes.length} 通过 / ${fails.length} 失败 ===`);
if (fails.length) console.log('失败项: ' + fails.join(', '));
process.exit(fails.length === 0 ? 0 : 1);
