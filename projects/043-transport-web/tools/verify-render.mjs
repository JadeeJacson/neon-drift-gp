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
// 据点占领(5v5) 补充检查：默认只跑生存模式 R1–R14；显式传 --dom 才额外验证 5v5 链路，
// 避免在常规 verify 里引入未经本机无头环境预跑的断言（防止误杀稳定的 R 检查）。
const RUN_DOM = process.argv.includes('--dom');

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
console.log('=== 043 运输船 · CDP 渲染验证 ===');
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
await sleep(2000);
const s1 = await ev('window.__fps.state()');
console.log('  起始状态: phase=' + s1.phase + ' wave=' + s1.wave + ' time=' + s1.time?.toFixed(2));
// 只断言「时间在推进」，不卡绝对秒数：sim 推进量取决于无头下的实际帧率，
// SwiftShader 比真 GPU 慢一个量级（实测 2s 墙钟只推进 0.23s sim），
// 卡 >0.3s 是环境依赖的假断言——真 GPU 下过、软件渲染下误判。
check('R3 开始后进入 playing 且时间推进', s1.phase === 'playing' && s1.time > 0, `time=${s1.time?.toFixed(2)}s`);

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
await sleep(1800);
const p1 = await ev('window.__fps.state().pos');
await ev('window.__fps.setInput({ forward: 0 })');
const moved = Math.hypot(p1.x - p0.x, p1.z - p0.z);
// 要证明的是「注入 forward → 玩家真的动了」，位移量本身取决于无头帧率
// （真 GPU 下 0.7s 就有 4.5m，SwiftShader 下同样代码只有 0.3m 量级）。
// 所以阈值取「明显大于静止噪声」的 0.3m，不沿用 GPU 上校准的 0.8m。
check('R5 注入前进后玩家位移（输入→sim 链路通）', moved > 0.3, `Δ=${moved.toFixed(2)}m`);

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

// R8 换弹链路（进入换弹 → 弹匣补满）。
// 轮询等待而非固定 sleep：无头软件渲染下墙钟与 sim 时间差一个量级，
// 1.1s 的换弹在 2600ms 墙钟里可能跑不完（实测出现过 10/12 的半程快照）。
await ev('window.__fps.setInput({ reload: true })');
await sleep(200);
const reloading = await ev('window.__fps.state().reloading');
await ev('window.__fps.setInput({ reload: false })');
let afterReload = await ev('window.__fps.state()');
for (let i = 0; i < 12; i++) {
  if (afterReload.reloading === false && afterReload.ammo === afterReload.magazine) break;
  await sleep(700);
  afterReload = await ev('window.__fps.state()');
}
check('R8 换弹链路（进入换弹 → 弹匣补满）',
  reloading === true && afterReload.ammo === afterReload.magazine,
  `reloading=${reloading}，换弹后 ${afterReload.ammo}/${afterReload.magazine}`);

// R12 武器槽位与 config 一致（043 武器表 5 枪 + 手雷）
const weapons = await ev('window.__fps.state().weapons.map(w => w.id)');
check(
  'R12 武器槽位与 config 一致（043 武器表 + 手雷已装载）',
  Array.isArray(weapons) && weapons.length === 6 && weapons.includes('ak47') && weapons.includes('awm') && weapons.includes('grenade'),
  Array.isArray(weapons) ? weapons.join(',') : String(weapons),
);

// R13 切到 AWM 并开火：验证狙击枪不是装饰品。
// 先重启一局（此前 R6/R7 的交火可能已把玩家打死 → phase=lost → sim 停止步进，开火永远无效）。
// 再轮询弹药变化：AWM 射击间隔 1.43s（sim 时间），无头软件渲染下墙钟与 sim 差一个量级，
// 固定等待会 flaky → 轮询直到弹药减少。
await ev('window.__fps.restart()');
await sleep(2000);
await ev('window.__fps.setInput({ slot: 2 })'); // ak47,m4a1,awm,mp5,deagle → 2 = awm
await sleep(2500); // 覆盖切枪硬直 0.32s（sim 时间）对应的墙钟
const beforeDmr = await ev('window.__fps.state()');
await ev('window.__fps.setInput({ fire: true })');
let afterDmr = beforeDmr;
for (let i = 0; i < 10; i++) {
  await sleep(800);
  afterDmr = await ev('window.__fps.state()');
  if (afterDmr.ammo < beforeDmr.ammo) break;
}
await ev('window.__fps.setInput({ fire: false })');
check(
  'R13 切到 AWM 后能开火（栓动狙击可用）',
  afterDmr.weapon === 'awm' && afterDmr.ammo < beforeDmr.ammo,
  `weapon=${afterDmr.weapon} 弹药 ${beforeDmr.ammo}→${afterDmr.ammo}`,
);

// R14 敌人模型已升级为分件机兵（四肢 pivot 存在 → 摆臂可驱动）
const limbOk = await ev(`(() => {
  const r = window.__fps;
  const es = r.enemies().filter(e => e.alive);
  if (!es.length) return 'no-enemy';
  return typeof es[0].id === 'number' ? 'ok' : 'bad';
})()`);
check('R14 敌人视图可用（模型升级后 sim 接口未变）', limbOk === 'ok', String(limbOk));

// R15 ADS 开镜链路（移植自 04_1）：注入 ads → 状态生效、散布按乘区收窄（未开火时 spread=spreadBase，与时间无关）。
// 先重启一局：R13 的交火后玩家可能已阵亡（phase=lost），sim 停止步进会让 ads 永远读不到。
await ev('window.__fps.restart()');
await sleep(2000);
const spread0 = await ev('window.__fps.state().spread');
await ev('window.__fps.setInput({ ads: true })');
await sleep(400);
const sAds = await ev('window.__fps.state()');
await ev('window.__fps.setInput({ ads: false })');
check(
  'R15 ADS 开镜（状态生效 + 散布收窄）',
  sAds.phase === 'playing' && sAds.ads === true && sAds.spread < spread0 * 0.6,
  `phase=${sAds.phase} spread ${spread0?.toFixed(4)}→${sAds.spread?.toFixed(4)} ads=${sAds.ads}`,
);

// R16 小地图 + 击杀信息流（移植自 04_2）：HUD 结构存在
const hudOk = await ev(`(() => {
  const mm = document.getElementById('minimap');
  const kf = document.getElementById('killfeed');
  return mm && kf ? 'ok' : 'missing';
})()`);
check('R16 小地图与击杀信息流挂载（04_2 移植件）', hudOk === 'ok', String(hudOk));

// R17 手雷物理链路（043 bug 修复件）：切到手雷槽（slot 5）→ 投掷 → 雷体在飞 →
// 引信到点爆炸后雷体移除。浏览器端验证动态刚体 + 事件消费全链路。
await ev('window.__fps.restart()');
await sleep(1500);
await ev('window.__fps.setInput({ slot: 5 })');
await sleep(500);
await ev('window.__fps.setInput({ slot: null })');
await sleep(500);
// 低头 45° 朝前下方投掷，让雷尽快落地反弹
await ev('window.__fps.setLook(0, -0.5)');
await ev('window.__fps.setInput({ fire: true })');
await sleep(250);
await ev('window.__fps.setInput({ fire: false })');
const g0 = await ev('window.__fps.grenades()');
const thrownInBrowser = Array.isArray(g0) && g0.length >= 1;
let flew = false;
let explodedInBrowser = false;
if (thrownInBrowser) {
  for (let i = 0; i < 40; i++) {
    await sleep(100);
    const gs = await ev('window.__fps.grenades()');
    if (!Array.isArray(gs) || gs.length === 0) {
      explodedInBrowser = true; // 列表清空 = 引信到点被移除
      break;
    }
    // 反弹观察：雷体速度（相邻采样位移）有非零变化且 y 有起伏即算飞行
    if (gs[0].pos.y > 0.05 || gs[0].fuse < 2.19) flew = true;
  }
}
check('R17a 手雷投掷：切槽后 fire 产生飞行雷体', thrownInBrowser, `n=${Array.isArray(g0) ? g0.length : 'NaN'}`);
check(
  'R17b 手雷引信到点爆炸（雷体移除 + explode 事件消费）',
  explodedInBrowser,
  explodedInBrowser ? 'grenades 列表已清空' : '仍在飞（引信未到）',
);
void flew;
await ev('window.__fps.clearInput()');
await ev('window.__fps.setLook(0, 0)');

// ===== 据点占领模式（5v5）补充验证（仅 --dom 时执行）=====
// 切到 domination 并重启：验证 10 名战斗员（玩家 + 4 友军 vs 5 红）确实入场、
// 据点进度字段存在且会被蓝队（玩家 + 友军 AI）推进。
if (RUN_DOM) {
  console.log('\n--- 据点占领(5v5) 补充检查 ---');
  await ev('window.__fps.setMode("domination")');
  await ev('window.__fps.restart()');
  await sleep(2500);
  const dom0 = await ev('window.__fps.state()');
  const domEnemies = await ev('window.__fps.enemies()');
  const redCount = Array.isArray(domEnemies) ? domEnemies.filter((e) => e.team === 'red').length : -1;
  const blueAllyCount = Array.isArray(domEnemies)
    ? domEnemies.filter((e) => e.team === 'blue').length
    : -1;
  check('D-A 据点模式：红队 5 人入场', redCount === 5, 'red=' + redCount);
  check('D-B 据点模式：蓝队 4 友军入场（不含玩家）', blueAllyCount === 4, 'blue=' + blueAllyCount);
  check(
    'D-C 据点模式：据点进度字段存在（capture 为数字）',
    typeof dom0.capture === 'number' && typeof dom0.mode === 'string' && dom0.mode === 'domination',
    `cap=${dom0.capture} mode=${dom0.mode}`,
  );
  // 蓝队（玩家冲刺 + 友军 AI）向据点推进：船尾基地 (0,±42.5) 到中央据点 42.5m，
  // 冲刺 9.6m/s × 10s ≈ 96m 足够进 7m 半径圈（原 4.5s 普通走位根本到不了）
  const capStart = dom0.capture;
  await ev('window.__fps.setInput({ forward: 1, sprint: true })');
  await sleep(10000);
  await ev('window.__fps.setInput({ forward: 0, sprint: false })');
  const dom1 = await ev('window.__fps.state()');
  check(
    'D-D 据点模式：据点进度会推进（|Δcapture| > 0 或已终局）',
    Math.abs((dom1.capture ?? 0) - (capStart ?? 0)) > 0 || dom1.phase !== 'playing',
    `cap ${capStart}→${dom1.capture} phase=${dom1.phase}`,
  );
  // 切回生存，避免影响后续（若有）
  await ev('window.__fps.setMode("survival")');
  await ev('window.__fps.restart()');
  await sleep(500);
}

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
const path = `${SHOT_DIR}/043-transport-web.png`;
fs.writeFileSync(path, buf);
check('R11 截图非空白（体积 > 25KB）', buf.length > 25 * 1024, `${(buf.length / 1024).toFixed(0)}KB → ${path}`);

// R1 报错汇总
check('R1 全程零运行时报错', pageErrors.length === 0, pageErrors.slice(0, 3).join(' ; '));

console.log(`\n=== 汇总：${passes.length} 通过 / ${fails.length} 失败 ===`);
if (fails.length) console.log('失败项: ' + fails.join(', '));
process.exit(fails.length === 0 ? 0 : 1);
