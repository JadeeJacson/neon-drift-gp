const { chromium } = require("playwright"),
  path = require("path"),
  fs = require("fs"),
  { pathToFileURL } = require("url");
const ROOT = path.resolve(__dirname, "../Web"),
  OUT = path.resolve(__dirname, "../TestOutput");
require("fs").mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_BIN || "/usr/local/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const c = await b.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const p = await c.newPage(),
    errors = [],
    results = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await p.goto(pathToFileURL(path.join(ROOT, "index.html")).href);
  const log = (name, x) => {
    results.push({ name, ...x });
    console.log(name, JSON.stringify(x));
  };
  log(
    "mobile start not blocked",
    await p.evaluate(() => {
      document.getElementById("startBtn").click();
      return { pass: true };
    }),
  );
  await p.waitForTimeout(300);
  log(
    "touch ui visible",
    await p.evaluate(() => ({
      pass:
        document.body.classList.contains("touch") &&
        getComputedStyle(document.getElementById("touchUi")).display !==
          "none",
    })),
  );
  // 摇杆向上 → KeyW 按下，行走前进。
  const stick = await p.locator("#touchStick").boundingBox();
  const cx = stick.x + stick.width / 2,
    cy = stick.y + stick.height / 2;
  await p.locator("#touchStick").dispatchEvent("pointerdown", {
    pointerId: 1,
    clientX: cx,
    clientY: cy,
    bubbles: true,
  });
  await p.locator("#touchStick").dispatchEvent("pointermove", {
    pointerId: 1,
    clientX: cx,
    clientY: cy - 45,
    bubbles: true,
  });
  log(
    "joystick maps to KeyW",
    await p.evaluate(() => ({ pass: keys.KeyW === true })),
  );
  await p.evaluate(() => {
    window.__before = __sandbox.state.player.pos.clone();
    for (let i = 0; i < 120; i++) __sandbox.step(1 / 120);
  });
  log(
    "joystick walks explorer",
    await p.evaluate(() => ({
      pass:
        __sandbox.state.player.pos.distanceTo(window.__before) > 2 &&
        __sandbox.state.footGrounded,
    })),
  );
  await p.locator("#touchStick").dispatchEvent("pointerup", {
    pointerId: 1,
    bubbles: true,
  });
  log(
    "joystick releases KeyW",
    await p.evaluate(() => ({ pass: keys.KeyW === false })),
  );
  // 跳跃键按住 → 离地。
  await p
    .locator('.touch-btns button[data-hold="Space"]')
    .dispatchEvent("pointerdown", { pointerId: 2, bubbles: true });
  await p.evaluate(() => {
    for (let i = 0; i < 20; i++) __sandbox.step(1 / 120);
  });
  log(
    "hold jump leaves ground",
    await p.evaluate(() => ({ pass: !__sandbox.state.footGrounded })),
  );
  await p
    .locator('.touch-btns button[data-hold="Space"]')
    .dispatchEvent("pointerup", { pointerId: 2, bubbles: true });
  // E 键登船（把玩家放到飞船旁）。
  await p.evaluate(() => {
    const a = __sandbox,
      d = a.export();
    d.driving = false;
    d.contacts.player = false;
    d.player.pos = a.state.ship.pos
      .clone()
      .add(new THREE.Vector3(3, 0, 0))
      .toArray();
    d.player.vel = [0, 0, 0];
    a.restore(d);
  });
  await p
    .locator('.touch-btns button[data-tap="KeyE"]')
    .dispatchEvent("pointerdown", { pointerId: 3, bubbles: true });
  await p.waitForTimeout(150);
  log(
    "tap E boards ship",
    await p.evaluate(() => ({ pass: __sandbox.state.driving === true })),
  );
  await p
    .locator('.touch-btns button[data-tap="KeyE"]')
    .dispatchEvent("pointerdown", { pointerId: 4, bubbles: true });
  await p.waitForTimeout(150);
  // 星图键开面板。
  await p
    .locator('.touch-mini button[data-tap="KeyM"]')
    .dispatchEvent("pointerdown", { pointerId: 5, bubbles: true });
  await p.waitForTimeout(150);
  log(
    "tap M opens map",
    await p.evaluate(() => ({
      pass: !document.getElementById("map").classList.contains("hidden"),
    })),
  );
  await p.screenshot({ path: path.join(OUT, "touch-map.png") });
  await p.click("#mapResume");
  await p.waitForTimeout(120);
  // 滑动转向。
  await p.evaluate(() => {
    window.__pitchBefore = __sandbox.state.player.pitch;
  });
  await p.locator("#game").dispatchEvent("pointerdown", {
    pointerId: 6,
    clientX: 200,
    clientY: 400,
    bubbles: true,
  });
  await p.locator("#game").dispatchEvent("pointermove", {
    pointerId: 6,
    clientX: 200,
    clientY: 330,
    bubbles: true,
  });
  await p.locator("#game").dispatchEvent("pointerup", {
    pointerId: 6,
    bubbles: true,
  });
  log(
    "swipe looks around",
    await p.evaluate(() => ({
      pass: __sandbox.state.player.pitch !== window.__pitchBefore,
    })),
  );
  log(
    "portrait no overflow",
    await p.evaluate(() => ({
      pass: document.documentElement.scrollWidth === innerWidth,
    })),
  );
  await p.screenshot({ path: path.join(OUT, "touch-surface.png") });
  log("no runtime / shader errors", { pass: errors.length === 0, errors });
  fs.writeFileSync(
    path.join(OUT, "touch-results.json"),
    JSON.stringify({ results }, null, 2),
  );
  await b.close();
  process.exit(results.every((x) => x.pass) ? 0 : 1);
})();
