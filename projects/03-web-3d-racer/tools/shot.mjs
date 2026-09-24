// 截图：晨曦大道 + 霓虹环线
async function getJSON(path) { return (await fetch('http://127.0.0.1:9222' + path)).json(); }

async function wsSend(ws, id, method, params) {
  return new Promise((resolve) => {
    const onMsg = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id === id) { ws.removeEventListener('message', onMsg); resolve(msg.result); }
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  const tab = await (await fetch('http://127.0.0.1:9222/json/new?http://127.0.0.1:5179/', { method: 'PUT' })).json();
  console.log('tab:', tab.id);
  await new Promise(r => setTimeout(r, 6000));

  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  // 等 game ready
  for (let i = 0; i < 20; i++) {
    const r = await wsSend(ws, i+1, 'Runtime.evaluate', { expression: 'window.__apex?.stats?.ready', returnByValue: true });
    if (r.result.value === true) break;
    await new Promise(r => setTimeout(r, 500));
  }
  await new Promise(r => setTimeout(r, 1500)); // 等倒计时结束

  // 晨曦大道起点截图
  async function shot(name) {
    const r = await wsSend(ws, 999, 'Page.captureScreenshot', { format: 'png' });
    const fs = await import('node:fs');
    fs.writeFileSync(name, Buffer.from(r.data, 'base64'));
    console.log('saved', name);
  }
  await shot('screenshots/polish-dawn.png');

  // 开一点油门
  await wsSend(ws, 1000, 'Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyW' });
  await new Promise(r => setTimeout(r, 2500));
  await wsSend(ws, 1001, 'Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyW' });
  await new Promise(r => setTimeout(r, 500));
  await shot('screenshots/polish-dawn-drive.png');

  // 切到霓虹环线（Digit4）
  await wsSend(ws, 1002, 'Input.dispatchKeyEvent', { type: 'keyDown', code: 'Digit4' });
  await wsSend(ws, 1003, 'Input.dispatchKeyEvent', { type: 'keyUp', code: 'Digit4' });
  await new Promise(r => setTimeout(r, 5000));
  await shot('screenshots/polish-neon.png');

  ws.close();
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
