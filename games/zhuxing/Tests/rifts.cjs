const { chromium } = require("playwright"),
  path = require("path"),
  fs = require("fs"),
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
  });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }),
    errors = [],
    results = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await p.goto(
    pathToFileURL(path.resolve(__dirname, "../Web/index.html")).href,
  );
  await p.click("#startBtn");
  await p.waitForTimeout(500);
  const log = (name, x) => {
    results.push({ name, ...x });
    console.log(name, JSON.stringify(x));
  };
  log(
    "world initialized",
    await p.evaluate(() => ({
      pass: __sandbox.sites.length === 47 && __sandbox.rifts.nodes.length === 4,
      sites: __sandbox.sites.length,
      nodes: __sandbox.rifts.nodes.length,
    })),
  );
  // Capture deterministic observer positions without changing user-facing gameplay.
  async function observe(index, distance, name) {
    await p.evaluate(
      ({ index, distance }) => {
        const a = __sandbox,
          r = a.rifts.nodes[index],
          d = a.export(),
          off = new THREE.Vector3(0, 25, distance).applyQuaternion(r.q);
        d.driving = true;
        d.third = false;
        d.ship.pos = r.pos.clone().add(off).toArray();
        d.ship.vel = r.vel.toArray();
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
      },
      { index, distance },
    );
    await p.waitForTimeout(150);
    await p.screenshot({
      path: path.resolve(__dirname, "../Previews/" + name + ".png"),
    });
  }
  await observe(0, 240, "black-hole");
  await observe(1, 245, "white-hole");
  for (const [id, name] of [
    ["rift-watch", "watch-ruins"],
    ["rift-listen", "echo-ruins"],
    ["rift-ice", "ice-ruins"],
  ]) {
    await p.evaluate((id) => {
      const a = __sandbox,
        s = a.sites.find((s) => s.id === id),
        d = a.export();
      d.driving = false;
      d.player.pos = s.root.localToWorld(new THREE.Vector3(0, 3, 23)).toArray();
      const look = s.root.localToWorld(new THREE.Vector3(0, 4, 0));
      d.player.q = new THREE.Quaternion()
        .setFromRotationMatrix(
          new THREE.Matrix4().lookAt(
            new THREE.Vector3(...d.player.pos),
            look,
            s.up,
          ),
        )
        .toArray();
      d.player.pitch = 0;
      d.player.vel = a.orbit
        .velocity(a.state.planets[s.planet], new THREE.Vector3(...d.player.pos))
        .toArray();
      d.contacts.player = false;
      d.navSite = id;
      d.targetIndex = s.planet;
      a.restore(d);
    }, id);
    await p.waitForTimeout(120);
    await p.screenshot({
      path: path.resolve(__dirname, "../Previews/" + name + ".png"),
    });
  }

  log(
    "gravity and repulsion",
    await p.evaluate(() => {
      const a = __sandbox;
      return {
        pass: a.rifts.nodes.every((r) => {
          const d = new THREE.Vector3(60, 0, 0);
          return (
            a.rifts.force(r.pos.clone().add(d)).dot(d) * (r.white ? 1 : -1) > 0
          );
        }),
      };
    }),
  );
  for (const i of [0, 2])
    for (const suit of [false, true]) {
      log(
        "swept " + (suit ? "suit" : "ship") + " route " + i,
        await p.evaluate(
          ({ i, suit }) => {
            const a = __sandbox,
              r = a.rifts.nodes[i],
              out = a.rifts.nodes[r.pair],
              d = a.export();
            d.driving = !suit;
            const k = suit ? "player" : "ship";
            d[k].pos = r.pos
              .clone()
              .add(new THREE.Vector3(0, 0, 130))
              .toArray();
            d[k].vel = r.vel
              .clone()
              .add(new THREE.Vector3(0, 0, -1900))
              .toArray();
            d.contacts[k] = false;
            a.restore(d);
            for (let j = 0; j < 150; j++) a.step(1 / 120); // pass restore grace before positioning for exact crossing
            const body = a.state[k];
            body.pos.copy(r.pos).add(new THREE.Vector3(0, 0, 20));
            body.vel.copy(r.vel).add(new THREE.Vector3(0, 0, -4900));
            body.grounded = false;
            const old = a.rifts.records.length;
            a.step(1 / 120);
            const rec = a.rifts.records.at(-1),
              speed = body.vel.clone().sub(out.vel).length();
            return {
              pass:
                a.rifts.records.length === old + 1 &&
                rec.to === out.id &&
                body.pos.distanceTo(out.pos) > 40 &&
                body.pos.distanceTo(out.pos) < 44 &&
                Math.abs(speed - rec.speed) < 0.2 &&
                !body.grounded,
              exitDistance: body.pos.distanceTo(out.pos),
              speed,
              record: rec,
            };
          },
          { i, suit },
        ),
      );
    }
  log(
    "no white reverse / cooldown",
    await p.evaluate(() => {
      const a = __sandbox,
        r = a.rifts.nodes[1],
        s = a.state.ship;
      const n = a.rifts.records.length;
      s.pos.copy(r.pos);
      s.vel.copy(r.vel);
      s.grounded = false;
      for (let j = 0; j < 100; j++) a.step(1 / 120);
      return { pass: n === a.rifts.records.length };
    }),
  );
  log(
    "probe can cross",
    await p.evaluate(() => {
      const a = __sandbox,
        r = a.rifts.nodes[0];
      a.rifts.launchProbe();
      let pr = a.rifts.probe;
      pr.pos.copy(r.pos).add(new THREE.Vector3(0, 0, 20));
      pr.vel.copy(r.vel).add(new THREE.Vector3(0, 0, -200));
      let n = a.rifts.records.length;
      for (let j = 0; j < 40; j++) a.step(1 / 120);
      return {
        pass:
          a.rifts.records.length === n + 1 &&
          a.rifts.records.at(-1).kind === "probe",
        record: a.rifts.records.at(-1),
      };
    }),
  );
  log(
    "natural low speed approach and cooldown",
    await p.evaluate(() => {
      const a = __sandbox,
        r = a.rifts.nodes[0],
        s = a.state.ship,
        d = a.export();
      d.driving = true;
      d.ship.pos = r.pos
        .clone()
        .add(new THREE.Vector3(0, 0, 100))
        .toArray();
      d.ship.vel = r.vel
        .clone()
        .add(new THREE.Vector3(0, 0, -24))
        .toArray();
      d.contacts.ship = false;
      a.restore(d);
      const n = a.rifts.records.length;
      for (let j = 0; j < 720 && a.rifts.records.length === n; j++)
        a.step(1 / 120);
      const passed = a.rifts.records.length === n + 1;
      s.pos.copy(r.pos);
      s.vel.copy(r.vel);
      s.grounded = false;
      a.step(1 / 120);
      const locked = a.rifts.records.length === n + 1;
      for (let j = 0; j < 370; j++) a.step(1 / 120);
      s.pos.copy(r.pos);
      s.vel.copy(r.vel);
      s.grounded = false;
      a.step(1 / 120);
      return {
        pass: passed && locked && a.rifts.records.length === n + 2,
        approach: passed,
        cooldown: locked,
        records: a.rifts.records.length,
      };
    }),
  );
  log(
    "save and legacy migration",
    await p.evaluate(() => {
      const a = __sandbox,
        d = a.export();
      a.restore(d);
      const same = JSON.stringify(a.export().rifts) === JSON.stringify(d.rifts);
      const old = JSON.parse(JSON.stringify(d));
      delete old.rifts;
      delete old.riftVersion;
      a.restore(old);
      const ok = a.rifts.records.length === 0;
      a.restore(d);
      return { pass: same && ok && a.rifts.probe === null };
    }),
  );
  log(
    "reject corrupt feature state",
    await p.evaluate(() => {
      const a = __sandbox,
        d = a.export();
      d.rifts.records[0].time = Infinity;
      let throws = false;
      try {
        a.restore(d);
      } catch (e) {
        throws = true;
      }
      return { pass: !a.validSave(d) && throws };
    }),
  );
  await p.keyboard.press("KeyM");
  await p.waitForTimeout(120);
  await p.screenshot({
    path: path.resolve(__dirname, "../Previews/rift-map.png"),
  });
  log(
    "map does not teleport",
    await p.evaluate(() => {
      const a = __sandbox,
        b = a.state.driving ? a.state.ship : a.state.player,
        pos = b.pos.clone();
      document.querySelector('[data-rift="rift-b-in"]').click();
      return { pass: b.pos.distanceTo(pos) === 0 && a.nav.name === "冰穹黑洞" };
    }),
  );
  await p.click("#mapResume");
  await p.keyboard.press("KeyJ");
  await p.screenshot({
    path: path.resolve(__dirname, "../Previews/rift-journal.png"),
  });
  await p.click("#journal [data-close]");
  await p.keyboard.press("KeyO");
  await p.locator("#riftMotion").check();
  await p.screenshot({
    path: path.resolve(__dirname, "../Previews/rift-settings.png"),
  });
  log(
    "reduced motion",
    await p.evaluate(() => ({
      pass:
        __sandbox.rifts.reducedMotion && __sandbox.export().rifts.reducedMotion,
    })),
  );
  await p.click("#settings [data-close]");
  await p.keyboard.press("KeyN");
  log(
    "keyboard anomaly nav",
    await p.evaluate(() => ({ pass: __sandbox.nav.name.includes("黑洞") })),
  );
  log(
    "pause freezes orbital and rift state",
    await p.evaluate(() => {
      setModal("help");
      return { pass: paused };
    }),
  );
  let t = await p.evaluate(() => __sandbox.orbit.time);
  await p.waitForTimeout(180);
  log("paused time", {
    pass: t === (await p.evaluate(() => __sandbox.orbit.time)),
  });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.reload();
  await p.screenshot({
    path: path.resolve(__dirname, "../Previews/mobile-07.png"),
  });
  log(
    "mobile fits",
    await p.evaluate(() => ({
      pass: document.documentElement.scrollWidth === innerWidth,
    })),
  );
  log("no runtime / shader errors", { pass: errors.length === 0, errors });
  fs.writeFileSync(
    path.resolve(__dirname, "../TestOutput/rift-results.json"),
    JSON.stringify({ results }, null, 2),
  );
  await b.close();
  process.exit(results.every((x) => x.pass) ? 0 : 1);
})();
