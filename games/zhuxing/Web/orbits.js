"use strict";
// Hierarchical restricted two-body Kepler motion, SI units. Not an N-body solver.
let orbitReady = false,
  simTime = 0,
  showOrbits = false,
  orbitRoots = [],
  orbitLines = [],
  bodyBindings = [],
  siteBindings = [],
  instrumentBindings = [];
const legacyDefs = SYSTEM.bodies.map((p) => ({ ...p, pos: [...p.pos] }));
SYSTEM.star.mu = 2000000;
SYSTEM.version = "0.8";
const ORBIT_LAYOUT = {
  0: [null, Math.hypot(3000, -2500, 4800) / 0.97, 0.03, 360, 12],
  2: [null, 9500, 0.045, 420, 18],
  3: [null, 3500, 0.025, 240, 8],
  6: [null, 14500, 0.035, 540, 22],
  8: [null, 20500, 0.05, 660, 27],
  1: [0, 950, 0.02, 180, 7],
  4: [3, 420, 0.015, 160, 11],
  5: [2, 430, 0.025, 220, 5],
  7: [6, 680, 0.02, 240, 15],
  9: [8, 1050, 0.02, 220, 12],
  10: [8, 1650, 0.025, 300, 17],
};
function init() {
  initContent();
  setupOrbitalWorld();
  Object.assign(window.__sandbox, {
    orbit: {
      get time() {
        return simTime;
      },
      get guides() {
        return showOrbits;
      },
      setGuides: (v) => {
        showOrbits = !!v;
        syncOrbitGuides();
      },
      stateAt: (i, t) => orbitalState(planets[i], t),
      velocity: surfaceVelocity,
      relative: relativeVelocity,
      advance: physicsStep,
    },
    getSave: makeSave,
  });
}
function terrain(p, n) {
  return localTerrain(
    p,
    p.spinQ ? n.clone().applyQuaternion(p.spinQ.clone().invert()) : n,
  );
}
function setupOrbitalWorld() {
  for (const p of planets) {
    const [parent, a, e, spin, tilt] = ORBIT_LAYOUT[p.index],
      oldParent = parent === null ? starPos : V(...legacyDefs[parent].pos);
    let ax = V(...legacyDefs[p.index].pos)
        .sub(oldParent)
        .normalize(),
      az = UP.clone().cross(ax).normalize();
    if (az.lengthSq() < 0.01) az = V(0, 0, 1);
    p.orbit = {
      parent,
      a,
      e,
      ax,
      az,
      mu: parent === null ? SYSTEM.star.mu : planets[parent].mu,
    };
    p.orbit.n = Math.sqrt(p.orbit.mu / a ** 3);
    p.orbit.period = (2 * Math.PI) / p.orbit.n;
    p.spinPeriod = spin;
    p.spinAxis = V(
      Math.sin((tilt * Math.PI) / 180),
      Math.cos((tilt * Math.PI) / 180),
      0,
    );
    p.spinQ = new THREE.Quaternion();
    p.vel = V();
    p.acc = V();
    p.omega = p.spinAxis.clone().multiplyScalar((2 * Math.PI) / spin);
    p.initialPos = p.pos.clone();
  }
  // Add an optional, original moving orrery station on the home world.
  const s = site(
      "orrery",
      "天体轨道观测台",
      0,
      "这里的模型实时显示五颗行星的轨道相位。G 或 I 开关空间轨迹；天体按开普勒轨道公转，地表随自转一起运动。离地会继承当地运动速度。",
      [0.36, 0.82, 0.45],
      0,
    ),
    g = rootSite(s),
    steel = mat(0x304852),
    brass = mat(0xd5ba7c);
  platform(g, 13, 14, 1.5, steel);
  ramp(g, 5, 22, 1.5, 18, steel);
  const it = consoleAt(s, g, "空间轨迹：关 / 开");
  it.states = 2;
  const table = mesh(new THREE.CylinderGeometry(4, 4, 0.35, 32), steel, g);
  table.position.y = 3.1;
  const mini = new THREE.Group();
  g.add(mini);
  mini.position.y = 3.45;
  glowGem(mini, [0, 0.3, 0], 0xffd38a, 0.45);
  for (let k = 0; k < 5; k++) {
    const ring = mesh(
      new THREE.TorusGeometry(1 + k * 0.6, 0.035, 4, 48),
      brass,
      mini,
    );
    ring.rotation.x = Math.PI / 2;
    const dot = mesh(
      new THREE.IcosahedronGeometry(0.18, 1),
      mat([0xd7b383, 0x84b798, 0xc98161, 0xa5d9e9, 0xb1b9a2][k]),
      mini,
    );
    effects.push({
      type: "orrery",
      object: dot,
      planet: [3, 0, 2, 6, 8][k],
      radius: 1 + k * 0.6,
    });
  }
  // Any collider added after initCore must be initialized before binding.
  for (const b of solidBoxes) {
    if (!b.pos) {
      b.pos = b.mesh.getWorldPosition(V());
      b.q = b.mesh.getWorldQuaternion(new THREE.Quaternion());
      b.inv = b.q.clone().invert();
    }
  }
  const ownership = new Map();
  for (const d of detailRoots) for (const o of d.objects) ownership.set(o, d.p);
  const excluded = new Set([
    skyMesh,
    stars,
    sunMesh,
    shipGroup,
    flash,
    flashTarget,
  ]);
  const roots = [...scene.children];
  for (const p of planets) {
    const root = new THREE.Group();
    root.position.copy(p.initialPos);
    scene.add(root);
    orbitRoots[p.index] = root;
  }
  for (const o of roots) {
    if (
      excluded.has(o) ||
      o.isLight ||
      (!o.isMesh &&
        !o.isGroup &&
        !o.isInstancedMesh &&
        !o.isPoints &&
        !o.isLine)
    )
      continue;
    if (o.position.distanceTo(starPos) < SYSTEM.star.r + 150) continue;
    let p =
      ownership.get(o) ||
      planets.find((p) => p.mesh === o) ||
      nearest(o.getWorldPosition(V()));
    orbitRoots[p.index].attach(o);
  }
  for (const o of obstacles) {
    const p = o.p || nearest(o.pos);
    bodyBindings.push({ o, p, local: o.pos.clone().sub(p.initialPos) });
  }
  for (const b of solidBoxes) {
    const p = nearest(b.pos);
    b.owner = p;
    b.local = b.pos.clone().sub(p.initialPos);
    b.localQ = b.q.clone();
  }
  for (const s of sites)
    siteBindings.push({
      s,
      p: planets[s.planet],
      local: s.pos.clone().sub(planets[s.planet].initialPos),
      up: s.up.clone(),
    });
  for (const it of instruments)
    instrumentBindings.push({
      it,
      p: planets[it.s.planet],
      local: it.pos.clone().sub(planets[it.s.planet].initialPos),
    });
  buildOrbitGuides();
  orbitReady = true;
  updateCelestials(0);
  resetWorld();
  scene.children
    .filter((o) => o.isAmbientLight)
    .forEach((o) => (o.intensity = 0.85));
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyI" && !e.repeat && started && !paused) {
      showOrbits = !showOrbits;
      actions.orrery = showOrbits ? 1 : 0;
      syncOrbitGuides();
      toast(showOrbits ? "轨迹已显示：实际轨道，非飞行通道" : "轨迹已隐藏", 2);
    }
  });
  const origUse = useInstrument;
  window.__sandbox.useInstrument = origUse;
}
function orbitalState(p, t) {
  const o = p.orbit,
    M = (o.n * t) % (2 * Math.PI);
  let E = M;
  for (let k = 0; k < 8; k++)
    E -= (E - o.e * Math.sin(E) - M) / (1 - o.e * Math.cos(E));
  const c = Math.cos(E),
    s = Math.sin(E),
    edot = o.n / (1 - o.e * c),
    b = o.a * Math.sqrt(1 - o.e ** 2),
    offset = o.ax
      .clone()
      .multiplyScalar(o.a * (c - o.e))
      .addScaledVector(o.az, b * s),
    vel = o.ax
      .clone()
      .multiplyScalar(-o.a * s * edot)
      .addScaledVector(o.az, b * c * edot),
    acc = offset.clone().multiplyScalar(-o.mu / offset.length() ** 3);
  return { offset, vel, acc, E };
}
function updateCelestials(t) {
  if (!orbitReady) return;
  simTime = t;
  function update(p) {
    if (p._epoch === t) return;
    const a = orbitalState(p, t),
      par = p.orbit.parent === null ? null : planets[p.orbit.parent];
    if (par) update(par);
    p.pos.copy(par ? par.pos : starPos).add(a.offset);
    p.vel.copy(par ? par.vel : ZERO).add(a.vel);
    p.acc.copy(par ? par.acc : ZERO).add(a.acc);
    p.spinQ.setFromAxisAngle(p.spinAxis, (2 * Math.PI * t) / p.spinPeriod);
    p._epoch = t;
    const root = orbitRoots[p.index];
    root.position.copy(p.pos);
    root.quaternion.copy(p.spinQ);
  }
  for (const p of planets) update(p);
  for (const b of bodyBindings) {
    b.o.pos.copy(b.local);
    if (!b.o.inertialRing) b.o.pos.applyQuaternion(b.p.spinQ);
    b.o.pos.add(b.p.pos);
  }
  for (const b of solidBoxes) {
    b.pos.copy(b.local).applyQuaternion(b.owner.spinQ).add(b.owner.pos);
    b.q.copy(b.owner.spinQ).multiply(b.localQ);
    b.inv.copy(b.q).invert();
  }
  for (const b of siteBindings) {
    b.s.pos.copy(b.local).applyQuaternion(b.p.spinQ).add(b.p.pos);
    b.s.up.copy(b.up).applyQuaternion(b.p.spinQ);
  }
  for (const b of instrumentBindings)
    b.it.pos.copy(b.local).applyQuaternion(b.p.spinQ).add(b.p.pos);
  for (const line of orbitLines)
    if (line.parentIndex !== null)
      line.object.position.copy(planets[line.parentIndex].pos);
  // The rings orbit with their planet but do not spin as a rigid slab with the surface.
  const p = planets[8];
  if (p.rings) {
    p.rings.quaternion
      .copy(p.spinQ.clone().invert())
      .multiply(
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0.35, 0, -0.38)),
      );
  }
  for (const e of effects)
    if (e.type === "orrery") {
      const a = orbitalState(planets[e.planet], t).E;
      e.object.position.set(
        Math.cos(a) * e.radius,
        0.3,
        Math.sin(a) * e.radius,
      );
    }
  if (!!actions.orrery !== showOrbits) {
    showOrbits = !!actions.orrery;
    syncOrbitGuides();
  }
  scene.updateMatrixWorld(true);
}
function surfaceVelocity(p, pos) {
  if (!orbitReady || !p?.vel) return V();
  return p.omega.clone().cross(pos.clone().sub(p.pos)).add(p.vel);
}
function referenceVelocity(pos) {
  const p = nearest(pos),
    h = Math.max(0, altitude(pos, p)),
    x = clamp((h - 40) / 160, 0, 1),
    blend = 1 - x * x * (3 - 2 * x);
  return p.vel
    .clone()
    .addScaledVector(p.omega.clone().cross(pos.clone().sub(p.pos)), blend);
}
function relativeVelocity(body) {
  return body.vel.clone().sub(referenceVelocity(body.pos));
}
function frameAcceleration(p, pos) {
  if (!orbitReady) return V();
  const r = pos.clone().sub(p.pos);
  return p.omega.clone().cross(p.omega.clone().cross(r)).add(p.acc);
}
function physicsStep(dt) {
  if (!orbitReady) return basePhysicsStep(dt);
  const bindings = [];
  for (const [body, grounded] of [
    [ship, ship.grounded],
    [player, !driving && footGrounded],
  ])
    if (grounded) {
      const p = nearest(body.pos);
      bindings.push({
        body,
        p,
        local: body.pos
          .clone()
          .sub(p.pos)
          .applyQuaternion(p.spinQ.clone().invert()),
        rel: relativeVelocity(body).applyQuaternion(p.spinQ.clone().invert()),
        q: p.spinQ.clone().invert().multiply(body.q),
      });
    }
  updateCelestials(simTime + dt);
  for (const b of bindings) {
    b.body.pos.copy(b.local).applyQuaternion(b.p.spinQ).add(b.p.pos);
    b.body.vel
      .copy(b.rel)
      .applyQuaternion(b.p.spinQ)
      .add(surfaceVelocity(b.p, b.body.pos));
    b.body.q.copy(b.p.spinQ).multiply(b.q);
    if (b.body === player)
      player.up.copy(player.pos.clone().sub(b.p.pos).normalize());
  }
  basePhysicsStep(dt);
}
function collideBody(body, clearance, isShip, dt) {
  if (!orbitReady) return baseCollideBody(body, clearance, isShip, dt);
  const p = nearest(body.pos),
    frame = surfaceVelocity(p, body.pos);
  body.vel.sub(frame);
  const hit = baseCollideBody(body, clearance, isShip, dt);
  body.vel.add(surfaceVelocity(p, body.pos));
  return hit;
}
function resetWorld() {
  baseResetWorld();
  if (!orbitReady) return;
  const p = planets[0],
    camp = sites.find((s) => s.id === "camp");
  player.pos.copy(surfacePoint(p, camp.up, CONFIG.player.height));
  player.up.copy(camp.up);
  player.q
    .copy(p.spinQ)
    .multiply(new THREE.Quaternion().setFromAxisAngle(UP, -0.17));
  const n = V(12, p.r, -16).normalize().applyQuaternion(p.spinQ);
  ship.pos.copy(surfacePoint(p, n, CONFIG.ship.clearance));
  ship.q.copy(frameQ(n, V(0, 0, -1).applyQuaternion(p.spinQ)));
  player.vel.copy(surfaceVelocity(p, player.pos));
  ship.vel.copy(surfaceVelocity(p, ship.pos));
  shipGroup.position.copy(ship.pos);
  shipGroup.quaternion.copy(ship.q);
}
function targetVelocity(t) {
  if (!orbitReady) return ZERO;
  if (navSite === "sun") return ZERO;
  if (navSite === "ship") return ship.vel;
  if (t.surface) return surfaceVelocity(t.planet, t.point);
  return t.planet.vel || ZERO;
}
function buildOrbitGuides() {
  for (const p of planets) {
    const pts = [];
    for (let k = 0; k <= 180; k++) {
      const E = (k / 180) * Math.PI * 2,
        o = p.orbit;
      pts.push(
        o.ax
          .clone()
          .multiplyScalar(o.a * (Math.cos(E) - o.e))
          .addScaledVector(o.az, o.a * Math.sqrt(1 - o.e ** 2) * Math.sin(E)),
      );
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({
        color: p.kind === "moon" ? 0x8caaa8 : 0x6b868e,
        transparent: true,
        opacity: 0.23,
        depthWrite: false,
      }),
    );
    scene.add(line);
    line.position.copy(
      p.orbit.parent === null ? starPos : planets[p.orbit.parent].pos,
    );
    orbitLines.push({ object: line, parentIndex: p.orbit.parent });
  }
  syncOrbitGuides();
}
function syncOrbitGuides() {
  for (const l of orbitLines) l.object.visible = showOrbits;
}
function updateHUD() {
  contentHUD();
  if (!orbitReady) return;
  const body = driving ? ship : player,
    p = nearest(body.pos),
    speed = relativeVelocity(body).length();
  $("speed").textContent = speed.toFixed(1);
  $("orbitInfo").innerHTML =
    "动态星系 · I " +
    (showOrbits ? "隐藏" : "显示") +
    "轨迹<br>" +
    p.name +
    "：自转 " +
    p.spinPeriod +
    " s / 公转 " +
    Math.round(p.orbit.period) +
    " s<br>地表参考速度 " +
    surfaceVelocity(p, body.pos).length().toFixed(1) +
    " m/s";
  if (driving)
    $("flightBadge").textContent = keys.KeyF
      ? "匹配附近参考系速度 · 非悬停"
      : ship.grounded
        ? "已接地 · 随星球自转 / 公转"
        : "惯性飞行 · F 近地 / 深空参考减速";
}
function createMap() {
  contentCreateMap();
  if (orbitReady) {
    const p = planets[targetIndex];
    $("bodyDetail").insertAdjacentHTML(
      "beforeend",
      '<p class="body-meta">公转周期 ' +
        Math.round(p.orbit.period) +
        " s · 自转 " +
        p.spinPeriod +
        " s<br>轨道偏心率 " +
        p.orbit.e +
        "<br>轨道速度 " +
        p.vel.length().toFixed(1) +
        " m/s · 表面逃逸速度 " +
        Math.sqrt((2 * p.mu) / p.r).toFixed(1) +
        " m/s<br>周期与尺度为探索压缩；暂停时星系也暂停</p>",
    );
  }
}
function drawSystemMap() {
  if (!orbitReady) return staticDrawSystemMap();
  const c = $("systemMap"),
    ctx = c.getContext("2d"),
    w = c.clientWidth || 900,
    h = c.clientHeight || 245;
  c.width = w * devicePixelRatio;
  c.height = h * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const max = 22500,
    sc = Math.min((w - 80) / (max * 2), (h - 50) / (max * 2)),
    xy = (p) => [
      w / 2 + (p.x - starPos.x) * sc,
      h / 2 + (p.z - starPos.z) * sc,
    ];
  ctx.strokeStyle = "#536e7866";
  for (const p of planets.filter((p) => p.kind === "planet")) {
    ctx.beginPath();
    for (let k = 0; k <= 120; k++) {
      const o = p.orbit,
        E = (k / 120) * 2 * Math.PI,
        pos = starPos
          .clone()
          .addScaledVector(o.ax, o.a * (Math.cos(E) - o.e))
          .addScaledVector(o.az, o.a * Math.sqrt(1 - o.e ** 2) * Math.sin(E)),
        [x, y] = xy(pos);
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  mapHits = [];
  const labels = [];
  function label(text, x, y, selected) {
    ctx.font = "13px system-ui";
    const width = ctx.measureText(text).width;
    let best = null;
    for (let radius = 14; radius < 180 && !best; radius += 14) {
      for (const [dx, dy] of [
        [radius, -radius],
        [radius, radius],
        [-radius - width, -radius],
        [-radius - width, radius],
        [radius, 0],
        [-radius - width, 0],
        [0, -radius],
        [0, radius],
      ]) {
        const b = { x: x + dx, y: y + dy - 12, w: width + 6, h: 18 };
        if (b.x < 12 || b.x + b.w > w - 12 || b.y < 12 || b.y + b.h > h - 35)
          continue;
        if (
          labels.some(
            (a) =>
              b.x < a.x + a.w + 7 &&
              b.x + b.w + 7 > a.x &&
              b.y < a.y + a.h + 5 &&
              b.y + b.h + 5 > a.y,
          )
        )
          continue;
        best = b;
        break;
      }
    }
    if (!best) return;
    labels.push(best);
    ctx.strokeStyle = "#738e98";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(best.x + width / 2, best.y + 8);
    ctx.stroke();
    ctx.fillStyle = selected ? "#d8efb7" : "#d0dfd4";
    ctx.fillText(text, best.x, best.y + 12);
  }
  for (const p of [
    { index: -1, pos: starPos, color: 0xefc57b, name: "曦心" },
    ...planets,
  ]) {
    const [x, y] = xy(p.pos),
      sel = p.index === targetIndex && navSite !== "sun";
    ctx.fillStyle = "#" + p.color.toString(16);
    ctx.beginPath();
    ctx.arc(x, y, p.index < 0 ? 7 : p.kind === "moon" ? 3 : 5, 0, Math.PI * 2);
    ctx.fill();
    if (p.kind !== "moon" || sel) {
      label(p.name, x, y, sel);
    }
    mapHits.push({ x, y, index: p.index });
  }
  ctx.fillStyle = "#b3c9c0";
  ctx.font = "12px system-ui";
  ctx.fillText("真实位置投影 · 卫星请用下方层级选择", 16, h - 14);
  c.onclick = (e) => {
    const r = c.getBoundingClientRect(),
      x = e.clientX - r.left,
      y = e.clientY - r.top;
    const hit = mapHits.find((a) => Math.hypot(a.x - x, a.y - y) < 10);
    if (hit) {
      if (hit.index < 0) navSite = "sun";
      else {
        targetIndex = hit.index;
        navSite = null;
      }
      createMap();
    }
  };
}
function makeSave() {
  const d = baseMakeSave();
  d.version = 6;
  d.simTime = simTime;
  d.showOrbits = showOrbits;
  d.contacts = { player: !driving && footGrounded, ship: ship.grounded };
  return d;
}
function validSave(d) {
  return (
    baseValidSave(d) &&
    (d.version !== 6 ||
      (Number.isFinite(d.simTime) && d.simTime >= 0 && d.simTime < 1e9))
  );
}
function restoreSave(d) {
  if (!validSave(d)) throw Error("存档数据无效。");
  if (!orbitReady) return baseRestoreSave(d);
  let data = JSON.parse(JSON.stringify(d));
  if (data.version === 6) {
    updateCelestials(data.simTime);
  } else {
    for (const key of ["player", "ship"]) {
      const old = V(...data[key].pos);
      let i = 0,
        gap = Infinity;
      for (let j = 0; j < legacyDefs.length; j++) {
        const v = old.distanceTo(V(...legacyDefs[j].pos)) - legacyDefs[j].r;
        if (v < gap) {
          gap = v;
          i = j;
        }
      }
      if (gap < 600) {
        const p = planets[i],
          offset = old.sub(V(...legacyDefs[i].pos)).applyQuaternion(p.spinQ);
        data[key].pos = offset.add(p.pos).toArray();
        data[key].q = p.spinQ
          .clone()
          .multiply(new THREE.Quaternion(...data[key].q))
          .toArray();
        data[key].vel = V(...data[key].vel)
          .applyQuaternion(p.spinQ)
          .add(surfaceVelocity(p, offset))
          .toArray();
      } else {
        data[key].pos = surfacePoint(planets[0], UP, 60).toArray();
        data[key].vel = surfaceVelocity(
          planets[0],
          V(...data[key].pos),
        ).toArray();
      }
    }
  }
  baseRestoreSave(data);
  footGrounded = !!data.contacts?.player;
  ship.grounded = !!data.contacts?.ship;
  showOrbits = !!data.showOrbits;
  syncOrbitGuides();
  return true;
}
