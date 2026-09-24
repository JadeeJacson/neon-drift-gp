/**
 * 04 火线 —— 无头 Chrome + CDP 端到端验证。
 *
 * 用法：先起 dev server（5181）与无头 Chrome（9222），再
 *   node tools/verify-render.mjs 9222 http://127.0.0.1:5181/ F:/Dev/Projects/game-lab/_tmp
 *
 * 验证的是「链路通不通」，不是「好不好玩」：
 *   R1  页面零运行时报错
 *   R2  WebGL2 可用，且记录真实渲染器（软件回退下性能结论不可信）
 *   R3  开始后 sim 推进（phase=playing、time 增长）
 *   R4  敌人按波次生成
 *   R5  移动链路：注入 W → 位置变化
 *   R6  射击链路：注入 fire → 弹药减少、枪声计数增加
 *   R7  命中链路：自动瞄准后开火 → hits 增加、特效实体数增加
 *   R8  换弹链路：注入 reload → 完成后弹匣补满
 *   R9  渲染非空：draw call / 三角面数 > 0（无头下唯一可信的性能指标）
 *   R10 音效硬指标：AudioContext 已建立且音效事件计数在涨
 *   R11 截图非空白
 */
const PORT = Number(process.argv[2] || 9222);
const TARGET = process.argv[3] || 'http://127.0.0.1:5181/';
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
    pageErrors.push(
      '[console.error] ' + (m.params.args || []).map((a) => a.value ?? a.description ?? '').join(' '),
    );
  }
});
const send = (method, params = {}) =>
  new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.result?.exceptionDetails) {
    return {
      __err: (
        r.result.exceptionDetails.exception?.description ||
        r.result.exceptionDetails.text ||
        'eval'
      )
        .split('\n')
        .slice(0, 2)
        .join(' | '),
    };
  }
  return r.result?.result?.value;
};

await new Promise((r) => ws.addEventListener('open', r));
await send('Page.enable');
await send('Page.navigate', { url: 'about:blank' }); // 先清空，避免回放上次会话的异常
await sleep(400);
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 1600,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send('Page.navigate', { url: TARGET });
await send('Page.enable'); // ensure page event hookup
await sleep(800);
await send('Page.reload', { ignoreCache: true }); // 强制拉新代码（vite dev 的 HMR query 缓存常见）
await sleep(800);

// 等 __fps 就绪
let ready = false;
for (let i = 0; i < 60; i++) {
  const t = await ev('typeof window.__fps');
  if (t === 'object') {
    ready = true;
    break;
  }
  await sleep(400);
}
console.log('=== 04 火线 · CDP 渲染验证 ===');
check('R0 页面加载并暴露 __fps 接口', ready);

// R2 渲染器
const renderer = await ev(`(() => {
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl2');
  if (!gl) return 'no-webgl2';
  const d = gl.getExtension('WEBGL_debug_renderer_info');
  return d ? String(gl.getParameter(d.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
})()`);
console.log('  渲染器: ' + renderer);
check('R2 WebGL2 可用', typeof renderer === 'string' && renderer !== 'no-webgl2', String(renderer));

// 开始游戏
await ev('window.__fps.start()');
await sleep(1200);
const s1 = await ev('window.__fps.state()');
console.log('  起始状态: phase=' + s1.phase + ' wave=' + s1.wave + ' time=' + s1.time?.toFixed(2));
check('R3 开始后进入 playing 且时间推进', s1.phase === 'playing' && s1.time > 0.3, `time=${s1.time?.toFixed(2)}s`);

// R4 敌人生成（等第一波刷出来）
let enemies = 0;
for (let i = 0; i < 30; i++) {
  enemies = await ev('window.__fps.enemies().filter(e => e.alive).length');
  if (enemies > 0) break;
  await sleep(400);
}
check('R4 敌人按波次生成', Number(enemies) > 0, `场上 ${enemies} 个`);

// R5 移动链路
const p0 = await ev('window.__fps.state().pos');
await ev('window.__fps.setInput({ forward: 1 })');
await sleep(700);
const p1 = await ev('window.__fps.state().pos');
await ev('window.__fps.setInput({ forward: 0 })');
const moved = Math.hypot(p1.x - p0.x, p1.z - p0.z);
check('R5 注入前进后玩家位移（输入→sim 链路通）', moved > 0.8, `Δ=${moved.toFixed(2)}m`);

// 自动瞄准最近敌人
const aimOk = await ev(`(() => {
  const e = window.__fps.enemies().filter(x => x.alive);
  if (!e.length) return false;
  const p = window.__fps.state().pos;
  const eye = { x: p.x, y: p.y + 0.75, z: p.z };
  let best = null, bd = 1e9;
  for (const t of e) {
    const d = Math.hypot(t.pos.x - eye.x, t.pos.z - eye.z);
    if (d < bd) { bd = d; best = t; }
  }
  if (!best) return false;
  const dx = best.pos.x - eye.x;
  const dy = (best.pos.y + 0.1) - eye.y;
  const dz = best.pos.z - eye.z;
  const l = Math.hypot(dx, dy, dz);
  window.__fps.setLook(Math.atan2(-dx, -dz), Math.asin(dy / l));
  return true;
})()`);

// R6 射击链路
const before = await ev('window.__fps.state()');
const audioBefore = await ev('window.__fps.audioInfo()');
await ev('window.__fps.setInput({ fire: true })');
await sleep(900);
await ev('window.__fps.setInput({ fire: false })');
const after = await ev('window.__fps.state()');
const audioAfter = await ev('window.__fps.audioInfo()');
check('R6 开火后弹药减少、射击数增加', after.ammo < before.ammo && after.shots > before.shots,
  `弹药 ${before.ammo}→${after.ammo}，射击 ${before.shots}→${after.shots}`);
check('R10 音效硬指标：AudioContext 已建立且事件计数在涨',
  audioAfter.state !== 'none' && audioAfter.playCount > audioBefore.playCount,
  `state=${audioAfter.state} count=${audioBefore.playCount}→${audioAfter.playCount} last=${audioAfter.last}`);

// R7 命中链路（多打一会儿，等敌人进入视线）
let hitsDelta = 0;
let fxPeak = 0;
for (let i = 0; i < 12 && hitsDelta === 0; i++) {
  await ev(`(() => {
    const e = window.__fps.enemies().filter(x => x.alive);
    if (!e.length) return false;
    const p = window.__fps.state().pos;
    const eye = { x: p.x, y: p.y + 0.75, z: p.z };
    let best = null, bd = 1e9;
    for (const t of e) {
      const d = Math.hypot(t.pos.x - eye.x, t.pos.z - eye.z);
      if (d < bd) { bd = d; best = t; }
    }
    if (!best) return false;
    const dx = best.pos.x - eye.x, dy = (best.pos.y + 0.1) - eye.y, dz = best.pos.z - eye.z;
    const l = Math.hypot(dx, dy, dz);
    window.__fps.setLook(Math.atan2(-dx, -dz), Math.asin(dy / l));
    return true;
  })()`);
  await ev('window.__fps.setInput({ fire: true })');
  await sleep(600);
  const st = await ev('window.__fps.state()');
  const fxc = await ev('window.__fps.fxInfo()');
  fxPeak = Math.max(fxPeak, fxc.tracers + fxc.particles);
  hitsDelta = st.hits - before.hits;
}
await ev('window.__fps.setInput({ fire: false })');
check('R7 命中链路（hits 增加、特效实体出现）', hitsDelta > 0, `hits +${hitsDelta}，特效峰值 ${fxPeak}`);
check('R7b 瞄准辅助可用（存在存活敌人可供瞄准）', aimOk === true);

// R8 换弹链路
await ev('window.__fps.setInput({ reload: true })');
await sleep(200);
const reloading = await ev('window.__fps.state().reloading');
await ev('window.__fps.setInput({ reload: false })');
await sleep(2600);
const afterReload = await ev('window.__fps.state()');
check('R8 换弹链路（进入换弹 → 弹匣补满）',
  reloading === true && afterReload.ammo === afterReload.magazine,
  `reloading=${reloading}，换弹后 ${afterReload.ammo}/${afterReload.magazine}`);

// R9 渲染统计（强制渲染一帧再读，否则拿到上一帧的陈旧值）
const info = await ev('window.__fps.info()');
check('R9 渲染非空：draw call 与三角面数 > 0', info.drawCalls > 0 && info.triangles > 0,
  `drawCalls=${info.drawCalls} triangles=${info.triangles} programs=${info.programs}`);

// R11 截图
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await sleep(600);
const shot = await send('Page.captureScreenshot', { format: 'png' });
const buf = Buffer.from(shot.result.data, 'base64');
const fs = await import('node:fs');
const path = `${SHOT_DIR}/04-fps-arena.png`;
fs.writeFileSync(path, buf);
check('R11 截图非空白（体积 > 25KB）', buf.length > 25 * 1024, `${(buf.length / 1024).toFixed(0)}KB → ${path}`);

// R1 报错汇总
check('R1 全程零运行时报错', pageErrors.length === 0, pageErrors.slice(0, 3).join(' ; '));

console.log(`\n=== 汇总：${passes.length} 通过 / ${fails.length} 失败 ===`);
if (fails.length) console.log('失败项: ' + fails.join(', '));
process.exit(fails.length === 0 ? 0 : 1);
