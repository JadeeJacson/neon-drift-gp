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
  const p = await b.newPage({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  }),
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
    "goals registry present",
    await p.evaluate(() => ({
      pass: __sandbox.goals.definitions.length === 8,
      goals: __sandbox.goals.definitions.length,
    })),
  );
  log(
    "travel log records first landing",
    await p.evaluate(() => {
      for (let i = 0; i < 60; i++) __sandbox.step(1 / 120);
      const log = __sandbox.goals.travelLog;
      return { pass: log.some((x) => x.i === 0), log };
    }),
  );
  // 近曦心 → 逐星者里程碑解锁（轮询约每秒一次）。
  log(
    "star proximity unlocks milestone",
    await p.evaluate(() => {
      const a = __sandbox,
        d = a.export(),
        star = new THREE.Vector3(-3000, 2500, -4800),
        pos = star.clone().add(new THREE.Vector3(1, 0.2, 0).normalize().multiplyScalar(620 + 250));
      d.driving = false;
      d.contacts.player = false;
      d.player.pos = pos.toArray();
      d.player.vel = [0, 0, 0];
      a.restore(d);
      for (let i = 0; i < 240; i++) a.step(1 / 120);
      return { pass: a.goals.unlocked.includes("star-prox") };
    }),
  );
  // 碎晶目击 → quantum.witnessed 写入。
  log(
    "shard witness recorded",
    await p.evaluate(() => {
      const a = __sandbox,
        q = a.quantum.shards[0];
      a.quantum.shift("qz-still");
      q.observed = true;
      for (let i = 0; i < 30; i++) a.step(1 / 120);
      return { pass: a.export().quantum?.witnessed === true };
    }),
  );
  // 照片模式：C 隐藏 HUD，X 触发保存，C 恢复。
  await p.keyboard.press("KeyC");
  await p.waitForTimeout(120);
  log(
    "photo mode hides HUD",
    await p.evaluate(() => ({
      pass:
        document.body.classList.contains("photo-mode") &&
        getComputedStyle(document.getElementById("hud")).display === "none",
    })),
  );
  const dl = p.waitForEvent("download", { timeout: 5000 }).catch(() => null);
  await p.keyboard.press("KeyX");
  const download = await dl;
  await p.waitForTimeout(200);
  log("photo capture downloads png", {
    pass:
      !!download &&
      (await p.evaluate(() => __sandbox.goals.photoCount >= 1)),
    download: download ? download.suggestedFilename() : null,
  });
  results[results.length - 1].pass =
    !!download && results[results.length - 1].pass;
  await p.keyboard.press("KeyC");
  await p.waitForTimeout(120);
  log(
    "photo mode exits",
    await p.evaluate(() => ({
      pass: !document.body.classList.contains("photo-mode"),
    })),
  );
  // 存档往返保留里程碑与航线志。
  log(
    "save roundtrip keeps goals",
    await p.evaluate(() => {
      const a = __sandbox,
        save = a.export(),
        count = save.goals.unlocked.length;
      a.restore(save);
      return {
        pass:
          count >= 1 &&
          a.export().goals.unlocked.length === count &&
          a.export().goals.travelLog.length >= 1,
        unlocked: count,
      };
    }),
  );
  log(
    "corrupt goals rejected",
    await p.evaluate(() => {
      const d = __sandbox.export();
      d.goals.travelLog = [{ i: 99, t: 0 }];
      return { pass: __sandbox.validSave(d) === false };
    }),
  );
  // 日志含航行志分区。
  await p.keyboard.press("KeyJ");
  await p.waitForTimeout(120);
  log(
    "journal includes voyage section",
    await p.evaluate(() => {
      const h = [...document.querySelectorAll("#journal .rift-log h3")].find(
        (x) => x.textContent.includes("航行志"),
      );
      return { pass: !!h };
    }),
  );
  await p.click("#journal [data-close]");
  log("no runtime / shader errors", { pass: errors.length === 0, errors });
  fs.writeFileSync(
    path.join(OUT, "goals-results.json"),
    JSON.stringify({ results }, null, 2),
  );
  await b.close();
  process.exit(results.every((x) => x.pass) ? 0 : 1);
})();
