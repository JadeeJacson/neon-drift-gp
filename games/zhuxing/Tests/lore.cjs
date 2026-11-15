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
    "lore sites present",
    await p.evaluate(() => {
      const ids = __sandbox.sites.map((s) => s.id);
      return {
        pass:
          __sandbox.sites.length === 47 &&
          ids.includes("monolith") &&
          ids.includes("archive"),
        sites: __sandbox.sites.length,
      };
    }),
  );
  // 档案索引台：三条摘录循环，动作写入存档。
  log(
    "archive console cycles excerpts",
    await p.evaluate(() => {
      const a = __sandbox,
        it = a.instruments.find((x) => x.id === "archive"),
        d = a.export();
      d.driving = false;
      d.contacts.player = false;
      d.player.pos = it.pos.toArray();
      d.player.vel = [0, 0, 0];
      a.restore(d);
      const first = a.useInstrument(),
        v1 = a.getActions().archive,
        second = a.useInstrument(),
        v2 = a.getActions().archive;
      return {
        pass: first && second && v1 === 1 && v2 === 2,
        v1,
        v2,
      };
    }),
  );
  // 缄默方碑：走近并注视 → 触发一次回应，且只触发一次。
  await p.evaluate(() => {
    const a = __sandbox,
      s = a.sites.find((x) => x.id === "monolith"),
      d = a.export();
    d.driving = false;
    d.contacts.player = false;
    const up = s.up.clone(),
      tangent = new THREE.Vector3()
        .crossVectors(up, new THREE.Vector3(0.3, 0.2, 0.9))
        .normalize(),
      pos = s.pos.clone().addScaledVector(tangent, 9).addScaledVector(up, 2.5),
      target = s.pos.clone().addScaledVector(up, 5.3),
      toStone = target.sub(pos).normalize();
    d.player.pos = pos.toArray();
    d.player.vel = [0, 0, 0];
    d.player.q = new THREE.Quaternion()
      .setFromRotationMatrix(
        new THREE.Matrix4().lookAt(new THREE.Vector3(), toStone, up),
      )
      .toArray();
    d.player.pitch = 0;
    a.restore(d);
  });
  await p.waitForTimeout(700);
  log(
    "monolith responds to gaze once",
    await p.evaluate(() => ({
      pass: __sandbox.export().lore?.monolithResponded === true,
    })),
  );
  // 存档往返保留方碑回应与档案动作。
  log(
    "save roundtrip keeps lore state",
    await p.evaluate(() => {
      const a = __sandbox,
        save = a.export();
      a.restore(save);
      return {
        pass:
          save.lore?.monolithResponded === true &&
          a.export().lore.monolithResponded === true &&
          a.getActions().archive === 2,
        archive: a.getActions().archive,
      };
    }),
  );
  log(
    "corrupt lore state rejected",
    await p.evaluate(() => {
      const d = __sandbox.export();
      d.lore.monolithResponded = "yes";
      return { pass: __sandbox.validSave(d) === false };
    }),
  );
  log("no runtime / shader errors", { pass: errors.length === 0, errors });
  fs.writeFileSync(
    path.join(OUT, "lore-results.json"),
    JSON.stringify({ results }, null, 2),
  );
  await b.close();
  process.exit(results.every((x) => x.pass) ? 0 : 1);
})();
