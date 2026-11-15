// DUST RUN 2.3-C — New special infected + nest objects. Additive wrapper layer.
// 投石者（lobber）：远程抛掷爆燃物，逼玩家导弹清场或加速冲过；
// 尸巢（nest）：地面巢穴持续孵化，给「回头清场」一个理由；
// 尖啸者（screamer）：光环动员周围尸群（普通→疾行），优先击杀目标。
let mutantMarks = [], // 落点预警圈
  mutantShots = [], // 抛掷物
  nests = [],
  mutantSeq = 800000;

function destroyNest(n) {
  if (n.dead) return;
  n.dead = true;
  burst(n.x, n.y - 18, 16, "#8a5c46", 1, "shard");
  if (field) fieldReward(25, "尸巢清除", n.x, n.y - 95);
  if (run) run.nestsCleared = (run.nestsCleared || 0) + 1;
  AudioSystem.hit(0.8, true);
}
function placeNests(fromX, toX) {
  for (let x = Math.max(2800, fromX); x < toX - 1500; x += 7200 + rand(-1500, 1500))
    nests.push({ x, y: ground(x), hp: 3, maxHp: 3, spawnAt: 6, flash: 0, dead: false });
}
function updateMutants(dt) {
  if (!field || !run || run.finished || !car) return;
  const now = run.elapsed;
  // 落点预警 → 抛掷
  for (const z of zombies) {
    if (z.hit || z.variant !== "lobber") continue;
    z.throwAt = z.throwAt == null ? now + rand(1.5, 3) : z.throwAt;
    const dx = Math.abs(z.x - car.x);
    if (dx > 1150 || dx < 260) {
      z.throwAt = now + rand(1.2, 2.2);
      continue;
    }
    if (now >= z.throwAt) {
      z.throwAt = now + rand(3.5, 5.2);
      mutantMarks.push({ x: car.x + car.vx * 0.32, y: ground(car.x + car.vx * 0.32), until: now + 0.85, src: z });
    }
  }
  for (const m of mutantMarks) {
    if (m.done || now < m.until) continue;
    m.done = true;
    const src = m.src;
    if (!src.hit) {
      const sx = src.x,
        sy = src.y - 42,
        t = 0.95,
        g = 760;
      mutantShots.push({
        x: sx,
        y: sy,
        px: sx,
        py: sy,
        vx: (m.x - sx) / t,
        vy: (m.y - sy - 0.5 * g * t * t) / t,
        life: 3,
      });
      AudioSystem.tone(180, 90, 0.18, 0.06);
    }
  }
  mutantMarks = mutantMarks.filter((m) => !m.done && now < m.until + 0.2);
  for (const s of mutantShots) {
    s.life -= dt;
    s.px = s.x;
    s.py = s.y;
    s.vy += 760 * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (Math.random() < dt * 40)
      addParticle(s.x, s.y, -s.vx * 0.06, -s.vy * 0.06, "#c98a5c", 3, 0.35, "smoke");
    if (s.life <= 0 || s.y >= supportY(s.x, s.y, s.py) - 2) {
      s.dead = true;
      explode(s.x, s.y, 95, 0.75, "environment");
    }
  }
  mutantShots = mutantShots.filter((s) => !s.dead && s.x > car.x - 2200);
  // 尖啸者：周期动员周围普通感染者转为疾行者
  for (const z of zombies) {
    if (z.hit || z.variant !== "screamer") continue;
    z.convertAt = z.convertAt == null ? now + 4 : z.convertAt;
    if (now >= z.convertAt && Math.abs(z.x - car.x) < 1000) {
      z.convertAt = now + 4.2;
      let converted = 0;
      for (const q of zombies) {
        if (converted >= 2) break;
        if (q.hit || q.variant !== "normal" || Math.abs(q.x - z.x) > 380) continue;
        q.variant = "runner";
        q.walk = (car.x > q.x ? 1 : -1) * 52;
        converted++;
      }
      if (converted) floater(z.x, z.y - 118, "尖啸动员！", "#d98ea0");
    }
  }
  // 尸巢：孵化 + 近身冲撞清除
  for (const n of nests) {
    if (n.dead) continue;
    n.flash = Math.max(0, n.flash - dt);
    if (Math.abs(n.x - car.x) > 2800) continue;
    if (now >= n.spawnAt) {
      n.spawnAt = now + 5.5;
      if (zombies.length < 340) {
        const x = n.x + rand(-70, 70),
          runner = Math.random() < 0.3;
        zombies.push({
          id: mutantSeq++,
          x,
          y: ground(x),
          scale: 1.18 + Math.random() * 0.3,
          phase: Math.random() * 6.28,
          skin: "#959a72",
          shirt: runner ? "#905b4d" : "#555e50",
          hit: false,
          walk: runner ? (car.x > x ? 1 : -1) * 52 : (Math.random() - 0.7) * 12,
          variant: runner ? "runner" : "normal",
        });
      }
    }
    if (
      Math.abs(car.x - n.x) < 100 &&
      Math.abs(car.y - (n.y - 30)) < 95 &&
      Math.abs(car.vx) > 55 &&
      now - (n.lastRam ?? -10) > 0.5
    ) {
      n.lastRam = now;
      n.hp -= 1;
      n.flash = 0.25;
      burst(n.x, n.y - 22, 8, "#8a5c46", 0.7, "shard");
      shake = Math.max(shake, 3);
      AudioSystem.hit(0.7, true);
      if (n.hp <= 0) destroyNest(n);
    }
  }
}

// 击杀奖励：投石者/尖啸者在通用特殊奖励之上追加赏金。
const mutantHit = hitZombie;
hitZombie = function (z) {
  const wasAlive = !z.hit;
  mutantHit(z);
  if (field && wasAlive && z.hit) {
    if (z.variant === "lobber") {
      run.lobberKills = (run.lobberKills || 0) + 1;
      field.cash += 6;
      floater(z.x, z.y - 110, "投石者清除 +$6", "#e8b48c");
    } else if (z.variant === "screamer") {
      run.screamerKills = (run.screamerKills || 0) + 1;
      field.cash += 8;
      floater(z.x, z.y - 110, "尖啸者清除 +$8", "#e8a4b8");
    }
  }
};
// 爆炸波及尸巢。
const mutantExplode = explode;
explode = function (x, y, r, power, source) {
  mutantExplode(x, y, r, power, source);
  for (const n of nests)
    if (!n.dead && Math.hypot(n.x - x, n.y - 25 - y) < r + 40) destroyNest(n);
};

// 外观：变种轮廓叠加 + 尖啸光环。
const mutantDrawZombie = drawZombie;
drawZombie = function (z) {
  mutantDrawZombie(z);
  if (!z.variant || z.variant === "normal" || z.hit) return;
  ctx.save();
  ctx.translate(z.x, z.y);
  ctx.scale(z.scale, z.scale);
  if (z.variant === "lobber") {
    rect(-12, -30, 8, 14, "#6a4b52");
    line(-8, -34, 6, -22, "#b06a5c", 2);
    line(6, -40, 18, -52, "#8a4f43", 3);
    circle(19, -55, 3.5, "#c9764e");
  }
  if (z.variant === "screamer") {
    circle(1, -55, 8.5, "#c9a292");
    circle(1, -53, 3, "#4a2630");
    line(-8, -62, 8, -62, "#8a4f63", 3);
    line(-12, -35, 12, -35, "#8a4f63", 2);
  }
  ctx.restore();
  if (z.variant === "screamer" && !reducedFieldMotion) {
    ctx.save();
    ctx.globalAlpha = 0.1 + 0.05 * Math.sin(run.elapsed * 5 + z.phase);
    circle(z.x, z.y - 30, 380, null, "#d98ea0", 2);
    ctx.globalAlpha = 0.28;
    circle(z.x, z.y - 30, 60, null, "#d98ea0", 1);
    ctx.restore();
  } else if (z.variant === "screamer") {
    ctx.save();
    ctx.globalAlpha = 0.22;
    circle(z.x, z.y - 30, 380, null, "#d98ea0", 1);
    ctx.restore();
  }
};

// 世界层绘制：预警圈、抛掷物、尸巢。
const mutantArsenal = drawArsenalWorld;
drawArsenalWorld = function (...args) {
  mutantArsenal(...args);
  if (!field || !car) return;
  const now = run.elapsed;
  for (const m of mutantMarks) {
    if (Math.abs(m.x - car.x) > 950) continue;
    const t = clamp((m.until - now) / 0.85, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.75;
    circle(m.x, m.y, 20 + t * 26, null, "#e8a24e", 2);
    circle(m.x, m.y, 5 + t * 5, "#e8c24e");
    ctx.restore();
  }
  for (const s of mutantShots) {
    if (Math.abs(s.x - car.x) > 950) continue;
    ctx.save();
    circle(s.x, s.y, 9, "#c9764e");
    circle(s.x, s.y, 14, null, "#e8a24e", 2);
    ctx.restore();
  }
  for (const n of nests) {
    if (n.dead || Math.abs(n.x - car.x) > 950) continue;
    ctx.save();
    ctx.translate(n.x, n.y);
    const pulse = reducedFieldMotion ? 0 : Math.sin(now * 3 + n.x) * 3;
    poly([[-42, 0], [-30, -26], [30, -26], [42, 0]], "#4a3a32", "#2e2620", 2);
    poly([[-26, -20], [-16, -38], [16, -38], [26, -20]], "#5c463a", "#2e2620", 1);
    circle(0, -30 - pulse, 9 + pulse * 0.4, n.flash > 0 ? "#e8c24e" : "#b45c3e");
    circle(0, -30 - pulse, 15, null, "#8a5c46", 2);
    for (let i = 0; i < n.maxHp; i++)
      rect(-14 + i * 10, -52, 7, 3, i < n.hp ? "#c98a5c" : "#4a3a32");
    ctx.restore();
  }
};

// 结算：本次尸巢/投石者/尖啸者战果计入生存档案（在远征结算归零重建前入账）。
const mutantFinish = finish;
finish = function (reason, win = false) {
  if (field && !field.settled) {
    normalizeField();
    save.fieldStats.nests += run.nestsCleared || 0;
    save.fieldStats.lobbers += run.lobberKills || 0;
    save.fieldStats.screamers += run.screamerKills || 0;
  }
  mutantFinish(reason, win);
};

// 入场包装：远征层完成变种分布后，再抽取普通感染者转为投石者/尖啸者并铺设尸巢。
const mutantStart = startRun;
startRun = function () {
  mutantStart();
  mutantMarks = [];
  mutantShots = [];
  nests = [];
  run.lobberKills = 0;
  run.screamerKills = 0;
  run.nestsCleared = 0;
  for (const z of zombies) {
    if (z.hit || z.variant !== "normal" || (run.stage === 0 && z.x < 1700)) continue;
    const t = Math.random();
    if (t < 0.045) {
      z.variant = "lobber";
      z.shirt = "#6a4b52";
      z.walk = 0;
    } else if (t < 0.075) {
      z.variant = "screamer";
      z.shirt = "#8a4f63";
    }
  }
  placeNests(2800, routes[run.stage].len);
};
