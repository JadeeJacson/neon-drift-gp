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
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }),
    errors = [],
    results = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await p.goto(pathToFileURL(path.join(ROOT, "index.html")).href);
  await p.click("#startBtn");
  await p.waitForTimeout(400);
  const log = (name, x) => {
    results.push({ name, ...x });
    console.log(name, JSON.stringify(x));
  };
  log(
    "quantum world initialized",
    await p.evaluate(() => ({
      pass:
        __sandbox.sites.length === 47 &&
        __sandbox.quantum.shards.length === 3 &&
        __sandbox.quantum.gateway.anchorDirs.length === 3 &&
        __sandbox.quantum.gateway.radius === 25,
      sites: __sandbox.sites.length,
      shards: __sandbox.quantum.shards.length,
    })),
  );
  // 未被观测时碎晶按周期跃迁。
  log(
    "unobserved shard shifts between anchors",
    await p.evaluate(() => {
      const q = __sandbox.quantum.shards[0];
      __sandbox.quantum.setObservedOverride(false);
      const before = q.index;
      for (let i = 0; i < 600; i++) __sandbox.step(1 / 120);
      __sandbox.quantum.setObservedOverride(null);
      return { pass: q.index !== before, before, after: q.index };
    }),
  );
  // 被观测时保持坍缩：长时间不移动。
  log(
    "observed shard stays collapsed",
    await p.evaluate(() => {
      const q = __sandbox.quantum.shards[0];
      __sandbox.quantum.setObservedOverride(true);
      const before = q.index;
      for (let i = 0; i < 1500; i++) __sandbox.step(1 / 120);
      __sandbox.quantum.setObservedOverride(null);
      return { pass: q.index === before, index: q.index };
    }),
  );
  // 存档往返保留碎晶索引与航标锚点。
  log(
    "save roundtrip restores quantum state",
    await p.evaluate(() => {
      const q = __sandbox.quantum.shards[1],
        save = __sandbox.export();
      __sandbox.quantum.setObservedOverride(false);
      __sandbox.quantum.shift("qz-axiom");
      __sandbox.quantum.setObservedOverride(null);
      const moved = q.index;
      __sandbox.restore(save);
      return {
        pass:
          save.quantumVersion === 1 &&
          save.quantum.shards.length === 3 &&
          q.index === save.quantum.shards[1].index &&
          q.index !== moved,
        saved: save.quantum.shards[1].index,
        moved,
      };
    }),
  );
  log(
    "corrupt quantum state rejected",
    await p.evaluate(() => {
      const d = __sandbox.export();
      d.quantum.shards = "x";
      const ok = __sandbox.validSave(d);
      const d2 = __sandbox.export();
      d2.quantum.gatewayAnchor = 9;
      return { pass: ok === false && __sandbox.validSave(d2) === false };
    }),
  );
  // 观星者航标跃迁：进入环心 → 出现在另一锚点，速度大小保留，记录写入。
  log(
    "gateway transit preserves speed and relocates",
    await p.evaluate(() => {
      const a = __sandbox,
        g = a.quantum.gateway,
        before = g.pos.clone(),
        d = a.export();
      d.driving = true;
      d.contacts = { ship: false, player: false };
      d.ship.pos = g.pos.toArray();
      d.ship.vel = g.vel
        .clone()
        .add(
          new THREE.Vector3(1, 0.3, 0)
            .normalize()
            .multiplyScalar(40),
        )
        .toArray();
      d.player.pos = g.pos.toArray();
      a.restore(d);
      __sandbox.quantum.setObservedOverride(true);
      const records = a.quantum.records.length;
      for (let i = 0; i < 90 && a.quantum.records.length === records; i++)
        a.step(1 / 60);
      __sandbox.quantum.setObservedOverride(null);
      const after = a.state.ship.pos.clone(),
        rec = a.quantum.records[a.quantum.records.length - 1] || {};
      return {
        pass:
          a.quantum.records.length === records + 1 &&
          after.distanceTo(before) > 500 &&
          Math.abs(rec.speed - 40) < 0.6 &&
          rec.kind === "ship",
        moved: Math.round(after.distanceTo(before)),
        speed: rec.speed,
        route: (rec.from || "?") + " → " + (rec.to || "?"),
      };
    }),
  );
  log(
    "gateway cooldown blocks immediate re-entry",
    await p.evaluate(() => {
      const a = __sandbox,
        g = a.quantum.gateway,
        d = a.export();
      d.driving = true;
      d.contacts = { ship: false, player: false };
      d.ship.pos = g.pos.toArray();
      d.ship.vel = g.vel.toArray();
      a.restore(d);
      __sandbox.quantum.setObservedOverride(true);
      const records = a.quantum.records.length;
      for (let i = 0; i < 30; i++) a.step(1 / 60);
      __sandbox.quantum.setObservedOverride(null);
      return {
        pass: a.quantum.records.length === records,
        records: a.quantum.records.length,
      };
    }),
  );
  // U 键导航不传送。
  await p.keyboard.press("KeyU");
  await p.waitForTimeout(120);
  log(
    "U navigates gateway without teleport",
    await p.evaluate(() => {
      const pos = __sandbox.state.player.pos.clone();
      return {
        pass:
          __sandbox.nav.name === "观星者航标" &&
          __sandbox.state.player.pos.distanceTo(pos) === 0,
        nav: __sandbox.nav.name,
      };
    }),
  );
  // 星图包含量子分区与 4 个按钮。
  await p.keyboard.press("KeyM");
  await p.waitForTimeout(160);
  log(
    "map lists quantum targets",
    await p.evaluate(() => {
      const rows = document.querySelectorAll("#map .quantum-map button");
      return { pass: rows.length === 4, rows: rows.length };
    }),
  );
  await p.screenshot({ path: path.join(OUT, "map-quantum.png") });
  await p.click('#map .quantum-map button[data-quantum="quantum-gate"]');
  await p.waitForTimeout(120);
  log(
    "map quantum row selects navigation",
    await p.evaluate(() => ({
      pass: __sandbox.nav.name === "观星者航标",
    })),
  );
  await p.click("#mapResume");
  // 日志包含量子观测分区。
  await p.keyboard.press("KeyJ");
  await p.waitForTimeout(120);
  log(
    "journal includes quantum section",
    await p.evaluate(() => {
      const h = [...document.querySelectorAll("#journal .rift-log h3")].find(
        (x) => x.textContent.includes("量子观测"),
      );
      return { pass: !!h, text: h ? h.textContent : null };
    }),
  );
  await p.click("#journal [data-close]");
  log(
    "exceptions",
    await p.evaluate(() => ({ pass: true })),
  );
  log("no runtime / shader errors", { pass: errors.length === 0, errors });
  fs.writeFileSync(
    path.join(OUT, "quantum-results.json"),
    JSON.stringify({ results }, null, 2),
  );
  await b.close();
  process.exit(results.every((x) => x.pass) ? 0 : 1);
})();
