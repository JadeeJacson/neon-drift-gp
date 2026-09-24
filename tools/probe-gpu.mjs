#!/usr/bin/env node
// GPU / 渲染能力探测：通过 CDP 连接已启动的 Chrome，从浏览器侧读取真实渲染后端信息。
// 用法：
//   1) 先启动 Chrome（勿加 --disable-gpu）：
//      chrome.exe --headless=new --remote-debugging-port=9222 --user-data-dir=<临时目录> about:blank
//   2) node tools/probe-gpu.mjs
//
// 注意：headless 环境下的 GPU 报告可能与有窗口环境存在差异，结果会显式标注。

const PORT = Number(process.argv[2] || 9222);

async function getWs() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const page = (await r.json()).find((t) => t.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* 端口未就绪，重试 */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('无法连接 Chrome 调试端口 ' + PORT);
}

const ws = new WebSocket(await getWs());
let id = 0;
const pending = new Map();
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
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
  if (r.result?.exceptionDetails) return { ERR: r.result.exceptionDetails.text };
  return r.result?.result?.value;
};

await new Promise((r) => ws.addEventListener('open', r));
await send('Page.enable');
await send('Page.navigate', { url: 'about:blank' });
await new Promise((r) => setTimeout(r, 400));
await send('Runtime.enable');
await send('Page.navigate', { url: 'about:blank' });
await new Promise((r) => setTimeout(r, 300));

const raw = await ev(`(async () => {
  const out = {};
  out.ua = navigator.userAgent;

  const c = document.createElement('canvas');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  if (gl) {
    out.webglVersion = gl.getParameter(gl.VERSION);
    out.glslVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      out.glVendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
      out.glRenderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
    }
    out.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    out.maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    const ext = gl.getSupportedExtensions() || [];
    out.glExtCount = ext.length;
    out.hasColorBufferFloat = ext.includes('EXT_color_buffer_float');
    out.hasFloatBlend = ext.includes('EXT_float_blend');
  } else {
    out.webglVersion = 'NO WEBGL CONTEXT';
  }

  out.hasWebGPU = !!navigator.gpu;
  if (navigator.gpu) {
    try {
      const ad = await navigator.gpu.requestAdapter();
      if (!ad) {
        out.gpuAdapter = null;
      } else {
        let info = null;
        if (ad.info) {
          info = {
            vendor: ad.info.vendor,
            architecture: ad.info.architecture,
            device: ad.info.device,
            description: ad.info.description,
          };
        } else if (ad.requestAdapterInfo) {
          const i2 = await ad.requestAdapterInfo();
          info = { vendor: i2.vendor, architecture: i2.architecture, device: i2.device, description: i2.description };
        }
        out.gpuAdapter = info;
        out.gpuFeatures = [...ad.features].slice(0, 40);
        out.gpuLimits = {
          maxTextureDimension2D: ad.limits.maxTextureDimension2D,
          maxBindGroups: ad.limits.maxBindGroups,
          maxComputeWorkgroupSizeX: ad.limits.maxComputeWorkgroupSizeX,
          maxComputeInvocationsPerWorkgroup: ad.limits.maxComputeInvocationsPerWorkgroup,
          maxBufferSize: ad.limits.maxBufferSize,
        };
      }
    } catch (e) {
      out.gpuError = String(e);
    }
  }

  out.screen = {
    w: screen.width,
    h: screen.height,
    availW: screen.availWidth,
    availH: screen.availHeight,
    dpr: devicePixelRatio,
    colorDepth: screen.colorDepth,
  };
  out.hardwareConcurrency = navigator.hardwareConcurrency;
  out.deviceMemory = navigator.deviceMemory ?? null;
  return JSON.stringify(out);
})()`);

if (typeof raw === 'string') {
  const o = JSON.parse(raw);
  console.log('');
  console.log('浏览器侧渲染能力探测');
  console.log('='.repeat(58));
  console.log('User-Agent      : ' + o.ua);
  console.log('');
  console.log('[ WebGL ]');
  console.log('  版本          : ' + o.webglVersion);
  console.log('  GLSL          : ' + (o.glslVersion || '-'));
  console.log('  Vendor        : ' + (o.glVendor || '-'));
  console.log('  Renderer      : ' + (o.glRenderer || '-'));
  console.log('  最大纹理尺寸  : ' + (o.maxTextureSize || '-'));
  console.log('  扩展数        : ' + (o.glExtCount ?? '-'));
  console.log('  float 渲染目标: ' + (o.hasColorBufferFloat ? '支持' : '不支持'));
  console.log('  float 混合    : ' + (o.hasFloatBlend ? '支持' : '不支持'));
  console.log('');
  console.log('[ WebGPU ]');
  console.log('  navigator.gpu : ' + (o.hasWebGPU ? '存在' : '不存在'));
  if (o.gpuAdapter) {
    console.log('  适配器        : ' + JSON.stringify(o.gpuAdapter));
    console.log('  特性数        : ' + (o.gpuFeatures ? o.gpuFeatures.length : '-'));
    if (o.gpuFeatures && o.gpuFeatures.length) {
      console.log('  特性          : ' + o.gpuFeatures.join(', '));
    }
    console.log('  限制          : ' + JSON.stringify(o.gpuLimits));
  } else if (o.gpuError) {
    console.log('  适配器错误    : ' + o.gpuError);
  } else {
    console.log('  适配器        : 未获取到');
  }
  console.log('');
  console.log('[ 环境 ]');
  console.log('  屏幕          : ' + o.screen.w + 'x' + o.screen.h + ' 可用 ' + o.screen.availW + 'x' + o.screen.availH);
  console.log('  devicePixelRatio: ' + o.screen.dpr);
  console.log('  色深          : ' + o.screen.colorDepth + ' bit');
  console.log('  逻辑核心      : ' + o.hardwareConcurrency);
  console.log('  deviceMemory  : ' + (o.deviceMemory ?? '未提供') + ' GB');
  console.log('='.repeat(58));
  console.log('注：以上为 headless 环境实测值，有窗口环境可能略有差异。');
  console.log('');
} else {
  console.log('探测失败：', raw);
}
ws.close();
process.exit(0);
