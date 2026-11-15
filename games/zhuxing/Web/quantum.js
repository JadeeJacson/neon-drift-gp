"use strict";
// 0.8 量子纪元: observation-collapsed superposition objects. Game-scale rules, not real quantum physics.
// 被观测时坍缩到确定状态；移开视线时在锚点间跃迁。凝视航标可安全穿越，未注视时它会搬家。
const QUANTUM_SHARD_DEFS = [
  {
    id: "qz-still",
    name: "静默碎晶",
    planet: 0,
    phase: 3.1,
    note: "看稳它时，它安分得像块普通石头。视线移开的某个瞬间，它会出现在别处——仿佛宇宙趁你没注意，重新掷了一次骰子。碎晶不构成威胁，也不奖励；它只是证明这里允许被重新掷骰。",
    anchors: [
      [0.72, 0.35, 0.6],
      [-0.6, 0.42, 0.68],
      [0.05, 0.55, -0.83],
    ],
    color: 0x9fe8c8,
  },
  {
    id: "qz-axiom",
    name: "公理碎晶",
    planet: 5,
    phase: 5.7,
    note: "低重力让它的每次现身都像慢动作。铭文写着一句被简化过的公理：观测者参与了现实的铸造。刻下这句话的人早已离场，碎晶仍在按字面意思执行。",
    anchors: [
      [0.2, 0.9, -0.4],
      [-0.72, 0.5, 0.5],
      [0.8, 0.32, 0.5],
    ],
    color: 0xb9c4ef,
  },
  {
    id: "qz-dream",
    name: "菌梦碎晶",
    planet: 7,
    phase: 7.3,
    note: "菌林的微光会在碎晶移动之后重新排列，像一群围观者换了个角度看热闹。有人说碎晶记得每一个曾注视过它的人；它从不回应，只是继续搬家。",
    anchors: [
      [0.1, 0.85, 0.5],
      [-0.6, 0.6, -0.5],
      [0.7, 0.55, 0.12],
    ],
    color: 0xa4d7ea,
  },
];
const QUANTUM_GATE_ANCHORS = [
  { planet: 0, dir: [0.3, 0.92, 0.25], height: 850, label: "苔原锚点" },
  { planet: 6, dir: [-0.55, 0.7, -0.45], height: 700, label: "霜镜锚点" },
  { planet: 8, dir: [0.62, 0.6, 0.42], height: 1100, label: "环岚锚点" },
];
const quantumShards = [],
  quantumLocks = new WeakMap();
let quantumReady = false,
  quantumGateway = null,
  quantumRecords = [],
  quantumWitnessed = false,
  quantumFlash = 0,
  quantumObservedOverride = null;
const quantumOld = {
  init,
  initContent,
  physicsStep,
  updateCelestials,
  updateCamera,
  updateHUD,
  createMap,
  renderJournal,
  makeSave,
  validSave,
  restoreSave,
  targetPoint,
  targetVelocity,
  scanSites,
};

function quantumSound(kind) {
  if (!audio || settings.volume === 0) return;
  try {
    const c = audio.ctx,
      t = c.currentTime,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = "sine";
    if (kind === "shift") {
      o.frequency.setValueAtTime(760, t);
      o.frequency.exponentialRampToValueAtTime(1180, t + 0.12);
      g.gain.setValueAtTime(0.09, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.start(t);
      o.stop(t + 0.24);
    } else {
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(660, t + 0.3);
      o.frequency.exponentialRampToValueAtTime(330, t + 0.7);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      o.start(t);
      o.stop(t + 0.92);
    }
    o.connect(g);
    g.connect(audio.master);
  } catch (e) {}
}

// 观测判定：目标投影在视野内、距离足够近、且未被最近天体球体遮挡。
function quantumObserved(pos) {
  if (quantumObservedOverride !== null) return quantumObservedOverride;
  if (!started) return true;
  const delta = pos.clone().sub(camera.position),
    projected = pos.clone().project(camera);
  if (projected.z < -1 || projected.z > 1) return false;
  if (Math.abs(projected.x) > 0.94 || Math.abs(projected.y) > 0.9)
    return false;
  if (delta.length() > 15000) return false;
  const p = nearest(pos),
    v = camera.position.clone().sub(p.pos),
    d = delta.clone().normalize(),
    b = v.dot(d),
    c = v.lengthSq() - Math.pow(Math.max(p.r - 4, 1), 2),
    disc = b * b - c;
  if (disc > 0) {
    const hit = -b - Math.sqrt(disc);
    if (hit > 0 && hit < delta.length() - 8) return false;
  }
  return true;
}

function syncQuantum() {
  if (!quantumReady) return;
  for (const q of quantumShards) {
    const p = planets[q.def.planet];
    q.group.position
      .copy(q.locals[q.index])
      .applyQuaternion(p.spinQ)
      .add(p.pos);
    q.site.pos.copy(q.group.position);
    q.site.up.copy(q.dirs[q.index]).applyQuaternion(p.spinQ);
  }
  const g = quantumGateway,
    ap = QUANTUM_GATE_ANCHORS[g.anchor],
    host = planets[ap.planet];
  g.pos.copy(g.locals).applyQuaternion(host.spinQ).add(host.pos);
  g.vel.copy(surfaceVelocity(host, g.pos));
  g.q.copy(host.spinQ);
  g.group.position.copy(g.pos);
  g.group.quaternion.copy(g.q);
  g.site.pos.copy(g.pos);
  g.site.up.copy(g.dir).applyQuaternion(host.spinQ);
}

function shiftShard(q, silent = false) {
  q.index = (q.index + 1) % q.locals.length;
  q.lastShift = simTime;
  const p = planets[q.def.planet];
  q.group.position
    .copy(q.locals[q.index])
    .applyQuaternion(p.spinQ)
    .add(p.pos);
  q.site.pos.copy(q.group.position);
  q.fx = 1;
  if (!silent) {
    quantumSound("shift");
    const b = driving ? ship : player;
    if (started && b.pos.distanceTo(q.group.position) < 900)
      toast("碎晶在你移开视线时换了位置。", 2.5);
  }
}

function hopGateway() {
  const g = quantumGateway;
  g.anchor = (g.anchor + 1 + (Math.floor(simTime * 7) % 2)) % 3;
  syncQuantum();
  g.fx = 1;
  quantumSound("shift");
  const b = driving ? ship : player;
  if (started && b.pos.distanceTo(g.pos) < 2000)
    toast("观星者航标在无人注视时更换了锚点。", 3);
}

function quantumTransit(body, isProbe = false) {
  const g = quantumGateway;
  const from = g.anchor;
  let to = (from + 1 + (Math.floor(simTime * 13 + 1) % 2)) % 3;
  const ap = QUANTUM_GATE_ANCHORS[to],
    host = planets[ap.planet],
    anchorPos = g.anchorDirs[to]
      .clone()
      .multiplyScalar(host.r + ap.height)
      .applyQuaternion(host.spinQ)
      .add(host.pos),
    up = anchorPos.clone().sub(host.pos).normalize(),
    inward = body.vel.clone().sub(g.vel),
    speed = Math.max(12, inward.length()),
    tilt = 0.35 + ((simTime * 61) % 100) / 260,
    spin = new THREE.Quaternion().setFromAxisAngle(up, tilt * Math.PI);
  let direction = inward.lengthSq() > 1e-6 ? inward.normalize() : up.clone();
  direction.applyQuaternion(spin).normalize();
  if (direction.dot(up) < -0.15) direction.addScaledVector(up, 0.6).normalize();
  body.pos.copy(anchorPos).addScaledVector(direction, 45);
  body.vel.copy(direction).multiplyScalar(speed).add(g.vel);
  body.grounded = false;
  quantumLocks.set(body, { until: simTime + 5.5 });
  if (body === ship) {
    if (driving) {
      player.pos.copy(ship.pos);
      player.vel.copy(ship.vel);
    }
    shipGroup.position.copy(ship.pos);
    shipGroup.quaternion.copy(ship.q);
  }
  if (body === player) {
    footGrounded = false;
    player.up.copy(body.pos).sub(host.pos).normalize();
  }
  quantumRecords.push({
    from: QUANTUM_GATE_ANCHORS[from].label,
    to: ap.label,
    time: simTime,
    speed: Math.round(speed * 10) / 10,
    kind: isProbe ? "probe" : body === ship ? "ship" : "suit",
  });
  quantumRecords = quantumRecords.slice(-8);
  if (!isProbe || started) {
    toast(
      "量子跃迁：" +
        QUANTUM_GATE_ANCHORS[from].label +
        " → " +
        ap.label +
        " · 速度大小保留 " +
        speed.toFixed(1) +
        " m/s",
      5,
    );
  }
  if (!isProbe) {
    quantumFlash = 1;
    quantumSound("transit");
  }
}

initContent = function () {
  quantumOld.initContent();
  // 碎晶与航标在 init 包装中创建，与折叠航路一样手动同步（不进入站点绑定）。
};
init = function () {
  quantumOld.init();
  for (const def of QUANTUM_SHARD_DEFS) {
    const p = planets[def.planet];
    const group = new THREE.Group();
    scene.add(group);
    // 锚点贴地：局部坐标 = 方向 ×（基础半径 + 地形 + 微抬升）
    const dirs = def.anchors.map((a) => V(...a).normalize()),
      locals = dirs.map((n) =>
        n.clone().multiplyScalar(p.r + terrain(p, n) + 8),
      );
    const core = mesh(
      new THREE.OctahedronGeometry(1.7, 0),
      new THREE.MeshBasicMaterial({ color: def.color }),
      group,
    );
    core.scale.set(0.7, 1.6, 0.7);
    const halo = mesh(
      new THREE.IcosahedronGeometry(2.6, 1),
      new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
      group,
    );
    const site = {
      id: def.id,
      name: def.name,
      planet: def.planet,
      note: def.note,
      pos: V(),
      up: V(0, 1, 0),
      quantum: true,
    };
    sites.push(site);
    const q = {
      def,
      group,
      core,
      halo,
      site,
      dirs,
      locals,
      index: 0,
      observed: true,
      fx: 0,
      next: def.phase,
    };
    quantumShards.push(q);
    detailRoots.push({ p, objects: [group] });
  }
  // 观星者航标：三处随天体共动的锚点。
  const gate = QUANTUM_GATE_ANCHORS[0],
    host0 = planets[gate.planet],
    dir0 = V(...gate.dir).normalize();
  const group = new THREE.Group();
  scene.add(group);
  const ringMat = mat(0xa8e6d8, { emissive: 0x4f9f92, emissiveIntensity: 1.1 });
  const ringA = mesh(new THREE.TorusGeometry(6.5, 0.35, 8, 48), ringMat, group);
  const ringB = mesh(new THREE.TorusGeometry(4.6, 0.28, 8, 40), ringMat, group);
  ringB.rotation.x = Math.PI / 2;
  const core = mesh(
    new THREE.IcosahedronGeometry(2.2, 1),
    new THREE.MeshBasicMaterial({
      color: 0xd9fbf2,
      transparent: true,
      opacity: 0.85,
    }),
    group,
  );
  const veil = mesh(
    new THREE.SphereGeometry(9, 20, 14),
    new THREE.MeshBasicMaterial({
      color: 0x7fd8c6,
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
    }),
    group,
  );
  const gsite = {
    id: "quantum-gate",
    name: "观星者航标",
    planet: gate.planet,
    note: "远航者留下的路标：凝视它，它就安分；移开视线，它会更换锚点。趁它安静时飞进环心，你会出现在另一处锚点——方向被重新洗牌，速度大小保留。白洞只去一处，它去所有它记得的地方。",
    pos: V(),
    up: V(0, 1, 0),
    quantum: true,
  };
  sites.push(gsite);
  quantumGateway = {
    anchor: 0,
    pos: V(),
    vel: V(),
    q: new THREE.Quaternion(),
    dir: dir0,
    anchorDirs: QUANTUM_GATE_ANCHORS.map((a) => V(...a.dir).normalize()),
    locals: dir0.clone().multiplyScalar(host0.r + gate.height),
    group,
    ringA,
    ringB,
    core,
    veil,
    site: gsite,
    observed: true,
    fx: 0,
    next: 14,
    radius: 25,
  };
  syncQuantum();
  quantumReady = true;
  const flash = document.createElement("div");
  flash.id = "quantumFlash";
  document.body.append(flash);
  const info = document.createElement("div");
  info.id = "quantumStatus";
  info.setAttribute("aria-live", "polite");
  document.body.append(info);
  window.addEventListener("keydown", (e) => {
    if (
      !started ||
      paused ||
      e.repeat ||
      e.ctrlKey ||
      e.metaKey ||
      /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)
    )
      return;
    if (e.code === "KeyU") {
      navSite = "quantum-gate";
      targetIndex = QUANTUM_GATE_ANCHORS[quantumGateway.anchor].planet;
      toast("导航：观星者航标 · 被观测时稳定，进入环心触发跃迁", 5);
    }
  });
  Object.assign(__sandbox, {
    quantum: {
      get shards() {
        return quantumShards;
      },
      get gateway() {
        return quantumGateway;
      },
      get records() {
        return [...quantumRecords];
      },
      get witnessed() {
        return quantumWitnessed;
      },
      setObservedOverride: (v) => {
        quantumObservedOverride = v === null ? null : !!v;
      },
      shift: (id) => {
        const q = quantumShards.find((q) => q.def.id === id);
        if (q) shiftShard(q, true);
        return q;
      },
      transit: (body, isProbe = false) => quantumTransit(body, isProbe),
      observed: quantumObserved,
    },
  });
  // initCore 捕获了旧函数对象：刷新公开测试/集成入口。
  Object.assign(__sandbox, {
    step: physicsStep,
    restore: restoreSave,
    export: makeSave,
    getSave: makeSave,
    validSave,
    scan: scanSites,
  });
};

updateCelestials = function (t) {
  quantumOld.updateCelestials(t);
  syncQuantum();
};

physicsStep = function (dt) {
  quantumOld.physicsStep(dt);
  if (!quantumReady || !started || paused) return;
  const observedNow = (o) =>
    quantumObservedOverride !== null ? quantumObservedOverride : o;
  // 观测与坍缩：未被观测时按周期跃迁；被观测时保持确定状态。
  for (const q of quantumShards) {
    if (simTime >= q.next) {
      if (!observedNow(q.observed)) {
        shiftShard(q);
        q.next = simTime + 9 + (q.def.phase % 2.3);
      } else q.next = simTime + 0.5;
    }
  }
  const g = quantumGateway;
  if (simTime >= g.next) {
    if (!observedNow(g.observed)) {
      hopGateway();
      g.next = simTime + 14;
    } else g.next = simTime + 0.5;
  }
  const bodies = driving ? [ship] : [ship, player];
  if (probe) bodies.push(probe);
  for (const b of bodies) {
    const lock = quantumLocks.get(b);
    if (lock && simTime < lock.until) continue;
    if (b.pos.distanceTo(g.pos) < g.radius) quantumTransit(b, b === probe);
  }
};

updateCamera = function (dt) {
  quantumOld.updateCamera(dt);
  if (!quantumReady) return;
  const active = driving ? ship : player;
  for (const q of quantumShards) {
    q.observed = quantumObserved(q.group.position);
    q.group.visible = active.pos.distanceTo(q.group.position) < 15000;
    if (q.fx > 0) q.fx = Math.max(0, q.fx - dt * 1.8);
    const pulse = reduceRiftMotion ? 0 : Math.sin(simTime * 2.2 + q.def.phase) * 0.12;
    const s = 1 + q.fx * 0.8 + pulse * 0.4;
    q.core.scale.set(0.7 * s, 1.6 * s, 0.7 * s);
    q.core.rotation.y = reduceRiftMotion ? 0 : simTime * 0.7;
    q.halo.material.opacity = (q.observed ? 0.26 : 0.12) + q.fx * 0.3;
    q.halo.scale.setScalar(1 + q.fx * 1.4);
  }
  const g = quantumGateway;
  g.observed = quantumObserved(g.pos);
  if (g.fx > 0) g.fx = Math.max(0, g.fx - dt * 1.4);
  g.ringA.rotation.y = reduceRiftMotion ? 0 : simTime * 0.5;
  g.ringB.rotation.z = reduceRiftMotion ? 0 : -simTime * 0.34;
  const pulse = reduceRiftMotion ? 1 : 1 + Math.sin(simTime * 3) * 0.12;
  g.core.scale.setScalar(pulse * (1 + g.fx));
  g.veil.material.opacity = (g.observed ? 0.1 : 0.05) + g.fx * 0.25;
  if (started && !paused) quantumFlash = Math.max(0, quantumFlash - dt * 1.1);
  const flash = $("quantumFlash");
  if (flash) {
    flash.style.opacity = reduceRiftMotion ? "0" : String(quantumFlash * 0.5);
    flash.style.transform = "scale(" + (1 + quantumFlash * 0.1) + ")";
  }
};

updateHUD = function () {
  quantumOld.updateHUD();
  if (!quantumReady) return;
  const b = driving ? ship : player,
    g = quantumGateway,
    d = b.pos.distanceTo(g.pos),
    el = $("quantumStatus");
  let nearShard = null,
    shardDist = Infinity;
  for (const q of quantumShards) {
    const n = b.pos.distanceTo(q.group.position);
    if (n < shardDist) {
      shardDist = n;
      nearShard = q;
    }
  }
  const showGate = d < 420,
    showShard = shardDist < 70;
  el.classList.toggle("active", showGate || showShard);
  if (showGate) {
    el.innerHTML =
      "<span>QUANTUM NODE / 观星者航标</span><strong>" +
      QUANTUM_GATE_ANCHORS[g.anchor].label +
      " · " +
      formatDist(d) +
      "</strong><small>" +
      (g.observed
        ? "观测中 · 状态稳定 · 飞入环心触发跃迁"
        : "未观测 · 它可能随时更换锚点") +
      "</small>";
  } else if (showShard) {
    el.innerHTML =
      "<span>QUANTUM SHARD / 量子碎晶</span><strong>" +
      nearShard.def.name +
      " · " +
      formatDist(shardDist) +
      "</strong><small>" +
      (nearShard.observed
        ? "被观测 · 保持坍缩"
        : "视线之外 · 正处于叠加态") +
      (quantumWitnessed ? " · 你已目击过坍缩" : "") +
      "</small>";
  }
};

targetPoint = function () {
  if (quantumReady && navSite === "quantum-gate")
    return {
      name: "观星者航标",
      point: quantumGateway.pos.clone(),
      planet: planets[QUANTUM_GATE_ANCHORS[quantumGateway.anchor].planet],
      surface: true,
    };
  const shard = quantumReady
    ? quantumShards.find((q) => q.def.id === navSite)
    : null;
  if (shard)
    return {
      name: shard.def.name,
      point: shard.group.position.clone(),
      planet: planets[shard.def.planet],
      surface: true,
    };
  return quantumOld.targetPoint();
};
targetVelocity = function (t) {
  if (quantumReady && navSite === "quantum-gate") return quantumGateway.vel;
  const shard = quantumReady
    ? quantumShards.find((q) => q.def.id === navSite)
    : null;
  if (shard)
    return surfaceVelocity(
      planets[shard.def.planet],
      shard.group.position,
    );
  return quantumOld.targetVelocity(t);
};

scanSites = function () {
  quantumOld.scanSites();
  if (!quantumReady) return;
  const b = driving ? ship : player;
  for (const q of quantumShards)
    if (b.pos.distanceTo(q.group.position) < 14 && !discovered.has(q.def.id)) {
      discovered.add(q.def.id);
      sound("discover");
      toast("新发现：" + q.def.name + " · J 查看记录", 4);
      saveGame(false);
    }
  if (b.pos.distanceTo(quantumGateway.pos) < 190) {
    discovered.add("quantum-gate");
  }
};

createMap = function () {
  document.querySelector("#map .quantum-map")?.remove();
  quantumOld.createMap();
  if (!quantumReady) return;
  const box = document.createElement("section");
  box.className = "rift-map quantum-map";
  box.innerHTML =
    '<div class="eyebrow">QUANTUM / 量子观测</div><p>被观测时坍缩为确定状态；移开视线时在锚点间跃迁。选择只设导航，不传送。</p>' +
    quantumShards
      .map(
        (q) =>
          '<button class="rift-row ' +
          (navSite === q.def.id ? "selected" : "") +
          '" data-quantum="' +
          q.def.id +
          '"><span class="rift-icon white">◈</span><span>' +
          q.def.name +
          "<small>" +
          planets[q.def.planet].name +
          " · " +
          q.locals.length +
          " 处叠加锚点</small></span><span>↗</span></button>",
      )
      .join("") +
    '<button class="rift-row ' +
    (navSite === "quantum-gate" ? "selected" : "") +
    '" data-quantum="quantum-gate"><span class="rift-icon white">◉</span><span>观星者航标<small>' +
    3 +
    " 处锚点 · 凝视穿越</small></span><span>↗</span></button>";
  document.querySelector("#map .system-layout").prepend(box);
  box.querySelectorAll("button").forEach(
    (btn) =>
      (btn.onclick = () => {
        navSite = btn.dataset.quantum;
        if (navSite === "quantum-gate")
          targetIndex = QUANTUM_GATE_ANCHORS[quantumGateway.anchor].planet;
        else
          targetIndex = quantumShards.find(
            (q) => q.def.id === navSite,
          ).def.planet;
        createMap();
        toast("已设导航量子目标。", 3);
      }),
  );
};

renderJournal = function () {
  quantumOld.renderJournal();
  if (!quantumReady) return;
  const note = document.createElement("section");
  note.className = "rift-log";
  const shardLines = quantumShards
    .map(
      (q) =>
        "<p><strong>" +
        q.def.name +
        "</strong> · " +
        (discovered.has(q.def.id) ? "已记录" : "未记录") +
        (q.observed ? " · 坍缩中" : " · 叠加中") +
        "</p>",
    )
    .join("");
  note.innerHTML =
    "<h3>量子观测 · 记录</h3><p>碎晶会趁你不看时移动；航标会趁无人注视时更换锚点。" +
    (quantumWitnessed
      ? "你已亲眼目击过一次坍缩。"
      : "长期盯着一个碎晶看，然后突然回头——也许能目击它搬家的瞬间。") +
    "</p>" +
    shardLines +
    (!quantumRecords.length
      ? "<p><small>尚未使用观星者航标跃迁。U 导航，凝视时飞入环心。</small></p>"
      : quantumRecords
          .slice()
          .reverse()
          .map(
            (x) =>
              "<p><small>" +
              x.from +
              " → " +
              x.to +
              " · " +
              { probe: "探针", ship: "拾光号", suit: "宇航服" }[x.kind] +
              " · 星系时刻 " +
              x.time.toFixed(1) +
              " s · 速度 " +
              x.speed.toFixed(1) +
              " m/s</small></p>",
          )
          .join(""));
  $("journalList").prepend(note);
};

makeSave = function () {
  const d = quantumOld.makeSave();
  d.quantumVersion = 1;
  d.quantum = {
    shards: quantumShards.map((q) => ({
      id: q.def.id,
      index: q.index,
      discovered: discovered.has(q.def.id),
    })),
    gatewayAnchor: quantumGateway.anchor,
    records: quantumRecords.map((x) => ({ ...x })),
    witnessed: quantumWitnessed,
    gateDiscovered: discovered.has("quantum-gate"),
  };
  return d;
};
validSave = function (d) {
  if (!quantumOld.validSave(d)) return false;
  if (d.quantum === undefined) return true;
  const s = d.quantum;
  return !!(
    s &&
    Array.isArray(s.shards) &&
    s.shards.length <= QUANTUM_SHARD_DEFS.length &&
    s.shards.every(
      (x) =>
        x &&
        QUANTUM_SHARD_DEFS.some(
          (def) =>
            def.id === x.id &&
            Number.isInteger(x.index) &&
            x.index >= 0 &&
            x.index < def.anchors.length,
        ) &&
        typeof x.discovered === "boolean",
    ) &&
    Number.isInteger(s.gatewayAnchor) &&
    s.gatewayAnchor >= 0 &&
    s.gatewayAnchor < QUANTUM_GATE_ANCHORS.length &&
    Array.isArray(s.records) &&
    s.records.length <= 8 &&
    typeof s.witnessed === "boolean" &&
    s.records.every(
      (x) =>
        x &&
        Number.isFinite(x.time) &&
        x.time >= 0 &&
        x.time <= d.simTime &&
        Number.isFinite(x.speed) &&
        x.speed >= 0 &&
        x.speed < 20000 &&
        ["probe", "ship", "suit"].includes(x.kind) &&
        QUANTUM_GATE_ANCHORS.some((a) => a.label === x.from) &&
        QUANTUM_GATE_ANCHORS.some((a) => a.label === x.to),
    )
  );
};
restoreSave = function (d) {
  if (!validSave(d)) throw Error("量子观测存档数据无效。");
  const ok = quantumOld.restoreSave(d);
  if (d.quantum && quantumReady) {
    for (const x of d.quantum.shards) {
      const q = quantumShards.find((q) => q.def.id === x.id);
      if (!q) continue;
      q.index = x.index;
      if (x.discovered) discovered.add(q.def.id);
    }
    quantumGateway.anchor = d.quantum.gatewayAnchor;
    quantumRecords = (d.quantum.records || []).map((x) => ({ ...x }));
    quantumWitnessed = !!d.quantum.witnessed;
    if (d.quantum.gateDiscovered) discovered.add("quantum-gate");
    quantumLocks.set(ship, { until: simTime + 0.6 });
    quantumLocks.set(player, { until: simTime + 0.6 });
    quantumObservedOverride = null;
    quantumFlash = 0;
    syncQuantum();
  }
  return ok;
};
