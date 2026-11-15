const { chromium } = require("playwright"),
  fs = require("fs"),
  path = require("path"),
  { pathToFileURL } = require("url");
(async () => {
  const b = await chromium.launch({
      executablePath: process.env.CHROMIUM_BIN || "/usr/local/bin/chromium",
      headless: true,
      args: [
        "--no-sandbox",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    }),
    p = await b.newPage({ viewport: { width: 1440, height: 900 } }),
    errors = [],
    results = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await p.goto(
    pathToFileURL(path.resolve(__dirname, "../Web/逐星-折叠航路0.9.html")).href,
  );
  await p.click("#startBtn");
  await p.evaluate(() => {
    const a = __sandbox,
      r = a.rifts.nodes[0],
      d = a.export();
    d.driving = true;
    d.ship.pos = r.pos
      .clone()
      .add(new THREE.Vector3(0, 0, 100))
      .toArray();
    d.ship.vel = r.vel
      .clone()
      .add(new THREE.Vector3(0, 0, -20))
      .toArray();
    d.ship.q = new THREE.Quaternion()
      .setFromRotationMatrix(
        new THREE.Matrix4().lookAt(
          new THREE.Vector3(...d.ship.pos),
          r.pos,
          new THREE.Vector3(0, 1, 0),
        ),
      )
      .toArray();
    d.contacts.ship = false;
    a.restore(d);
    for (let j = 0; j < 80; j++) a.step(1 / 120);
  });
  await p.keyboard.press("KeyP");
  await p.waitForTimeout(130);
  results.push({
    name: "P launches probe via actual control",
    pass: await p.evaluate(() => !!__sandbox.rifts.probe),
  });
  await p.screenshot({
    path: path.resolve(__dirname, "../Previews/probe-flight.png"),
  });
  await p.evaluate(() => {
    const a = __sandbox,
      r = a.rifts.nodes[0],
      s = a.state.ship;
    // 探针先判龄清场：它的穿越记录会终止循环，而探针穿越不触发亮雾。
    const pr = a.rifts.probe;
    if (pr) pr.age = 91;
    a.step(1 / 60);
    const n = a.rifts.records.length;
    // 截图等待期间真实帧可能已触发一次穿越并进入 3 秒冷却；
    // 在步进中点重新放置船位，保证飞船穿越发生在受控采样窗口内。
    for (let j = 0; j < 1200 && a.rifts.records.length === n; j++) {
      if (j === 500) {
        s.pos.copy(r.pos);
        s.vel.copy(r.vel);
      }
      a.step(1 / 120);
    }
  });
  // 亮雾在下一渲染帧才写入样式且按 0.8/s 衰减；轮询等待首帧后立即采样，先采样再截图。
  let transitState = false;
  for (let k = 0; k < 25 && !transitState; k++) {
    await p.waitForTimeout(80);
    transitState = await p.evaluate(
      () =>
        __sandbox.rifts.records.length > 0 &&
        Number(
          getComputedStyle(document.getElementById("riftTransit")).opacity,
        ) > 0,
    );
  }
  await p.screenshot({
    path: path.resolve(__dirname, "../Previews/transit.png"),
  });
  results.push({
    name: "transit creates record and visual feedback",
    pass: transitState,
  });
  await p.keyboard.press("KeyO");
  await p.locator("#riftMotion").check();
  await p.click("#settings [data-close]");
  await p.waitForTimeout(100);
  results.push({
    name: "reduced motion suppresses transit overlay",
    pass: await p.evaluate(
      () =>
        Number(
          getComputedStyle(document.getElementById("riftTransit")).opacity,
        ) === 0,
    ),
  });
  results.push({
    name: "final single-file runtime and shaders",
    pass: errors.length === 0,
    errors,
  });
  fs.writeFileSync(
    path.resolve(__dirname, "../TestOutput/visual-smoke-results.json"),
    JSON.stringify({ results }, null, 2),
  );
  console.log(JSON.stringify(results));
  await b.close();
  process.exit(results.every((x) => x.pass) ? 0 : 1);
})();
