"use strict";
// 0.7: original, game-scaled one-way wormholes. Not relativistic simulation.
const RIFT_DEFS = [
  {
    id: "rift-a-in",
    name: "折光黑洞",
    planet: 0,
    dir: [0, 1, 0],
    height: 430,
    white: false,
    pair: 1,
    route: "折光航路",
  },
  {
    id: "rift-a-out",
    name: "静潮白洞",
    planet: 10,
    dir: [0, 1, 0],
    height: 310,
    white: true,
    pair: 0,
    route: "折光航路",
  },
  {
    id: "rift-b-in",
    name: "冰穹黑洞",
    planet: 6,
    dir: [0.7, 0.7, 0.12],
    height: 420,
    white: false,
    pair: 3,
    route: "冰穹航路",
  },
  {
    id: "rift-b-out",
    name: "赤岬白洞",
    planet: 2,
    dir: [-0.4, 0.85, 0.3],
    height: 390,
    white: true,
    pair: 2,
    route: "冰穹航路",
  },
];
const rifts = [],
  riftBodies = new WeakMap();
let riftReady = false,
  riftRecords = [],
  riftSeen = new Set(),
  transitFlash = 0,
  probe = null,
  probeTrail = [],
  probeTime = 0;
let reduceRiftMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let riftTarget = null,
  riftTexture = null,
  probeLine = null;
const riftOld = {
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
const riftVertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const riftFragment = `
precision highp float;
varying vec2 vUv; uniform float time; uniform float whiteHole; uniform sampler2D backdrop; uniform vec2 resolution;
float ring(float r,float c,float w){return exp(-pow((r-c)/w,2.));}
void main(){
 vec2 p=(vUv-.5)*2.; float r=length(p); float a=atan(p.y,p.x); float h=.080;
 if(r>.97)discard;
 vec2 uv=gl_FragCoord.xy/resolution;
 float lens=(1.-smoothstep(.10,.53,r))*.025/(r+.09);
 vec3 bg=texture2D(backdrop,clamp(uv+normalize(p+vec2(.00001))*lens,vec2(.001),vec2(.999))).rgb;
 float twist=atan(p.y*4.7,p.x); float diskR=length(vec2(p.x,p.y*4.7));
 float grain=.66+.22*sin(diskR*220.-time*2.8+sin(twist*5.+time)*2.)+.12*sin(diskR*370.+twist*8.-time*3.);
 float disk=smoothstep(.105,.17,diskR)*(1.-smoothstep(.42,.86,diskR))*grain;
 disk*=.7+.3*sin(twist-time*.32);
 float bend=ring(length(vec2(p.x,p.y*1.25)),.19,.019)*(p.y>0. ? .95 : .45);
 float photon=ring(r,.089,.0045)*1.7+ring(r,.100,.009)*.5;
 float halo=exp(-r*10.)*.14;
 vec3 hot=mix(vec3(1.,.38,.065),vec3(.39,.77,1.),whiteHole);
 vec3 light=mix(vec3(1.,.81,.44),vec3(.83,.97,1.),whiteHole);
 float strength=disk*1.28+bend*.9+photon+halo;
 vec3 c=bg+hot*strength+light*pow(max(strength-.32,0.),2.)*.7;
 if(r<h)c=mix(vec3(.0003,.0006,.001),vec3(.84,.96,1.)*(.9+.1*cos(time)),whiteHole);
 float alpha=max(1.-smoothstep(.09,.13,r),max(clamp(strength*1.8,0.,1.),(1.-smoothstep(.13,.40,r))*.60))*(1.-smoothstep(.86,.97,r));
 float wave=whiteHole*ring(r,.17+fract(time*.22)*.58,.008)*(1.-fract(time*.22))*.16;
 c+=vec3(.33,.68,1.)*wave;
 gl_FragColor=vec4(c,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

initContent = function () {
  riftOld.initContent();
  const ruins = [
    [
      "rift-watch",
      "折光观测庭",
      0,
      [0.18, 0.94, -0.28],
      "观测庭记录：庭中的黑球只是示意模型。真实黑洞只接收，白洞只排出。M 选择「折光黑洞」，从营地上空约 430 米处进入，出口位于静潮。P 可先发射探针。",
    ],
    [
      "rift-listen",
      "静潮回声碑",
      10,
      [-0.32, 0.88, 0.31],
      "回声碑记录：碑中白球只是示意模型。离开真实白洞后仍有速度。先按 F 减速，再接近卫星。白洞不是返程入口；返程可自行飞行或从暂停菜单回营地。",
    ],
    [
      "rift-ice",
      "冰穹折跃遗址",
      6,
      [0.24, 0.94, -0.24],
      "折跃遗址记录：遗址中的黑球只是示意模型。上空的冰穹黑洞连向赤岬白洞。传送会转换入口参考系中的动量与姿态；不是瞬移后清零速度。",
    ],
  ];
  for (const [id, name, i, dir, note] of ruins) {
    const s = site(id, name, i, note, dir, 1),
      g = atSite(s);
    s.root = g;
    const stone = mat(0x354753),
      metal = mat(0x899b9a, { metalness: 0.55, roughness: 0.4 });
    box(g, [18, 1, 18], [0, -0.5, 0], stone);
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3,
        x = Math.cos(a) * 7,
        z = Math.sin(a) * 7;
      box(g, [1.1, 8 + (k % 2) * 3, 1.1], [x, 4 + (k % 2) * 1.5, z], metal);
      glowGem(g, [x, 8 + (k % 2) * 3, z], i === 10 ? 0x8edfff : 0xffb76c, 0.35);
    }
    const ring = mesh(
      new THREE.TorusGeometry(3.5, 0.16, 8, 64),
      mat(0xc9ab7a, { emissive: 0x715329, emissiveIntensity: 0.6 }),
      g,
    );
    ring.position.y = 3.4;
    const core = mesh(
      new THREE.SphereGeometry(1.5, 24, 16),
      new THREE.MeshBasicMaterial({ color: i === 10 ? 0xc6efff : 0x020409 }),
      g,
    );
    core.position.y = 3.4;
  }
};
init = function () {
  riftOld.init();
  // Fixed screen-size radial sprites: no giant square points at the exit.
  const dustCanvas = document.createElement("canvas");
  dustCanvas.width = dustCanvas.height = 32;
  const dc = dustCanvas.getContext("2d"),
    gradient = dc.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.3, "rgba(255,255,255,.8)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  dc.fillStyle = gradient;
  dc.fillRect(0, 0, 32, 32);
  const dustSprite = new THREE.CanvasTexture(dustCanvas);
  for (const d of RIFT_DEFS) {
    const p = planets[d.planet],
      n = V(...d.dir).normalize(),
      local = n.multiplyScalar(p.r + d.height);
    const group = new THREE.Group();
    scene.add(group);
    const material = new THREE.ShaderMaterial({
      vertexShader: riftVertex,
      fragmentShader: riftFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        time: { value: 0 },
        whiteHole: { value: d.white ? 1 : 0 },
        backdrop: { value: null },
        resolution: { value: new THREE.Vector2(1440, 900) },
      },
    });
    const veil = mesh(new THREE.PlaneGeometry(350, 350), material, group);
    veil.renderOrder = 8;
    const parts = [];
    const rng = seeded(710 + d.planet),
      count = 220,
      geo = new THREE.BufferGeometry(),
      arr = new Float32Array(count * 3);
    for (let j = 0; j < count; j++) {
      const a = rng() * Math.PI * 2,
        r = 28 + rng() * 105;
      arr[j * 3] = Math.cos(a) * r;
      arr[j * 3 + 1] = (rng() - 0.5) * 4;
      arr[j * 3 + 2] = Math.sin(a) * r;
      parts.push([a, r, (rng() - 0.5) * 4]);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const dust = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: d.white ? 0x9fdbff : 0xffbd79,
        size: 2.4,
        sizeAttenuation: false,
        map: dustSprite,
        alphaTest: 0.02,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }),
    );
    group.add(dust);
    const s = {
      id: d.id,
      name: d.name,
      planet: d.planet,
      note: d.white
        ? "单向出口：向外排斥，不可反向穿越。离开后按 F 减速。"
        : "单向入口：穿越事件视界会从配对白洞排出；飞船与宇航服都可通过。P 发射探针先行。",
      pos: V(),
      up: V(0, 1, 0),
      rift: true,
    };
    sites.push(s);
    rifts.push({
      ...d,
      local,
      pos: V(),
      vel: V(),
      q: new THREE.Quaternion(),
      group,
      veil,
      dust,
      parts,
      site: s,
      radius: 14,
    });
  }
  riftReady = true;
  syncRifts();
  const rendererRender = renderer.render.bind(renderer);
  riftTarget = new THREE.WebGLRenderTarget(720, 450, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
  });
  riftTexture = riftTarget.texture;
  renderer.render = function (sc, cam) {
    if (sc !== scene || cam !== camera || !riftReady)
      return rendererRender(sc, cam);
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const near = rifts.some((r) => r.pos.distanceTo(cam.position) < 2400);
    if (near) {
      const w = Math.max(1, Math.floor(size.x * 0.6)),
        h = Math.max(1, Math.floor(size.y * 0.6));
      if (riftTarget.width !== w || riftTarget.height !== h)
        riftTarget.setSize(w, h);
      const old = renderer.getRenderTarget();
      rifts.forEach((r) => (r.group.visible = false));
      renderer.setRenderTarget(riftTarget);
      rendererRender(sc, cam);
      renderer.setRenderTarget(old);
      rifts.forEach((r) => (r.group.visible = true));
    }
    for (const r of rifts) {
      r.group.visible = near || r.pos.distanceTo(cam.position) < 12000;
      r.veil.material.uniforms.backdrop.value = riftTexture;
      r.veil.material.uniforms.resolution.value.copy(size);
    }
    rendererRender(sc, cam);
  };
  const info = document.createElement("div");
  info.id = "riftStatus";
  info.setAttribute("aria-live", "polite");
  document.body.append(info);
  const flash = document.createElement("div");
  flash.id = "riftTransit";
  document.body.append(flash);
  const control = document.createElement("div");
  control.className = "setting-line";
  control.innerHTML =
    '<label for="riftMotion">减少跃迁动态效果</label><input id="riftMotion" type="checkbox">';
  $("settings").querySelector(".setting-line").parentElement.append(control);
  $("riftMotion").checked = reduceRiftMotion;
  $("riftMotion").onchange = (e) => {
    reduceRiftMotion = e.target.checked;
  };
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
    if (e.code === "KeyN") {
      const b = driving ? ship : player;
      const a = rifts
        .filter((r) => !r.white)
        .sort((x, y) => x.pos.distanceTo(b.pos) - y.pos.distanceTo(b.pos))[0];
      navSite = a.id;
      targetIndex = a.planet;
      toast("导航 " + a.name + " · P 发射探针 · 进入黑色球心自动穿越", 5);
    }
    if (e.code === "KeyP") launchProbe();
  });
  Object.assign(__sandbox, {
    rifts: {
      get nodes() {
        return rifts;
      },
      get records() {
        return [...riftRecords];
      },
      get seen() {
        return [...riftSeen];
      },
      get probe() {
        return probe;
      },
      launchProbe,
      force: riftForce,
      get reducedMotion() {
        return reduceRiftMotion;
      },
    },
  });
  // initCore captured the old function objects: refresh public test/integration entrypoints.
  Object.assign(__sandbox, {
    step: physicsStep,
    restore: restoreSave,
    export: makeSave,
    getSave: makeSave,
    validSave,
    scan: scanSites,
  });
};
function syncRifts() {
  if (!riftReady) return;
  for (const r of rifts) {
    const p = planets[r.planet];
    r.pos.copy(r.local).applyQuaternion(p.spinQ).add(p.pos);
    r.vel.copy(surfaceVelocity(p, r.pos));
    r.q.copy(p.spinQ);
    r.group.position.copy(r.pos);
    r.dust.quaternion.copy(p.spinQ);
    r.site.pos.copy(r.pos);
    r.site.up.copy(r.local).normalize().applyQuaternion(p.spinQ);
  }
}
updateCelestials = function (t) {
  riftOld.updateCelestials(t);
  syncRifts();
};
function riftForce(pos) {
  const force = V();
  if (!riftReady) return force;
  for (const r of rifts) {
    const delta = r.pos.clone().sub(pos),
      d = delta.length();
    if (d < 0.001 || d > 230) continue;
    const strength =
      Math.min(24, 17000 / (d * d + 160)) * (1 - smoothRift(160, 230, d));
    force.addScaledVector(delta, ((r.white ? -1 : 1) * strength) / d);
  }
  return force;
}
function smoothRift(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
function crossedRift(a, b, r) {
  const u = b.clone().sub(a),
    den = u.lengthSq();
  const t = den ? clamp(r.clone().sub(a).dot(u) / den, 0, 1) : 0;
  return a.clone().addScaledVector(u, t).distanceTo(r) < 14;
}
function transitBody(body, entry, isProbe = false) {
  const out = rifts[entry.pair],
    inward = body.vel.clone().sub(entry.vel),
    rotation = out.q
      .clone()
      .multiply(new THREE.Quaternion().setFromAxisAngle(UP, Math.PI))
      .multiply(entry.q.clone().invert());
  let direction = inward.clone().applyQuaternion(rotation);
  if (direction.lengthSq() < 1e-6) direction.copy(out.site.up);
  direction.normalize();
  const speed = Math.max(18, inward.length());
  body.pos.copy(out.pos).addScaledVector(direction, 42);
  body.vel.copy(direction).multiplyScalar(speed).add(out.vel);
  body.q.premultiply(rotation).normalize();
  body.grounded = false;
  riftBodies.set(body, { until: simTime + 3 });
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
    player.up.copy(body.pos).sub(planets[out.planet].pos).normalize();
  }
  riftSeen.add(entry.id);
  riftSeen.add(out.id);
  discovered.add(entry.id);
  discovered.add(out.id);
  riftRecords.push({
    from: entry.id,
    to: out.id,
    time: simTime,
    speed: Math.round(speed * 10) / 10,
    kind: isProbe ? "probe" : body === ship ? "ship" : "suit",
  });
  riftRecords = riftRecords.slice(-24);
  if (!isProbe || started) {
    toast(
      (isProbe ? "探针回传" : "穿越完成") +
        "：" +
        entry.name +
        " → " +
        out.name +
        " · 出口相对速度 " +
        speed.toFixed(1) +
        " m/s",
      5,
    );
  }
  if (isProbe) probeTrail = [];
  if (!isProbe) {
    transitFlash = 1;
    riftSound();
  }
}
function riftSound() {
  if (!audio) return;
  try {
    const c = audio.ctx,
      t = c.currentTime,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.24);
    o.frequency.exponentialRampToValueAtTime(640, t + 0.62);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    o.connect(g);
    g.connect(audio.master);
    o.start(t);
    o.stop(t + 0.82);
  } catch (e) {}
}
function integrateRift(body, old, dt, isProbe = false) {
  const lock = riftBodies.get(body);
  if (lock && simTime < lock.until) return;
  for (const r of rifts)
    if (
      !r.white &&
      crossedRift(
        old.clone().add(r.vel.clone().multiplyScalar(dt)),
        body.pos,
        r.pos,
      )
    ) {
      transitBody(body, r, isProbe);
      return;
    }
}
physicsStep = function (dt) {
  if (!riftReady) return riftOld.physicsStep(dt);
  const bodies = driving ? [ship] : [ship, player],
    before = bodies.map((b) => b.pos.clone());
  for (const b of bodies) {
    if (!b.grounded && !(b === player && footGrounded))
      b.vel.addScaledVector(riftForce(b.pos), dt);
  }
  riftOld.physicsStep(dt);
  bodies.forEach((b, i) => integrateRift(b, before[i], dt));
  if (probe) {
    const old = probe.pos.clone();
    probe.vel.addScaledVector(gravity(probe.pos).add(riftForce(probe.pos)), dt);
    probe.pos.addScaledVector(probe.vel, dt);
    integrateRift(probe, old, dt, true);
    probe.age += dt;
    probe.object.position.copy(probe.pos);
    probeTime += dt;
    if (probeTime > 0.12) {
      probeTime = 0;
      probeTrail.push(probe.pos.clone());
      if (probeTrail.length > 100) probeTrail.shift();
      probeLine.geometry.dispose();
      probeLine.geometry = new THREE.BufferGeometry().setFromPoints(probeTrail);
    }
    if (probe.age > 90 || altitude(probe.pos, nearest(probe.pos)) < 1) {
      clearProbe();
    }
  }
};
function clearProbe() {
  if (probe) {
    scene.remove(probe.object);
    probe.object.geometry.dispose();
    probe.object.material.dispose();
    scene.remove(probeLine);
    probeLine.geometry.dispose();
    probeLine.material.dispose();
  }
  probe = null;
  probeTrail = [];
}
function launchProbe() {
  clearProbe();
  const b = driving ? ship : player,
    dir = V(0, 0, -1).applyQuaternion(camera.quaternion);
  probe = {
    pos: b.pos.clone().addScaledVector(dir, 6),
    vel: b.vel.clone().addScaledVector(dir, 55),
    q: b.q.clone(),
    age: 0,
  };
  probe.object = mesh(
    new THREE.IcosahedronGeometry(0.5, 1),
    new THREE.MeshBasicMaterial({ color: 0x9dfff2 }),
  );
  probe.object.position.copy(probe.pos);
  probeLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({
      color: 0x78dfd6,
      transparent: true,
      opacity: 0.65,
    }),
  );
  scene.add(probeLine);
  toast("探针已发射 · 90 秒遥测 · 再按 P 替换", 3);
}
scanSites = function () {
  riftOld.scanSites();
  if (!riftReady) return;
  const b = driving ? ship : player;
  for (const r of rifts)
    if (b.pos.distanceTo(r.pos) < 190) {
      riftSeen.add(r.id);
      discovered.add(r.id);
    }
};
updateCamera = function (dt) {
  riftOld.updateCamera(dt);
  if (!riftReady) return;
  for (const r of rifts) {
    r.veil.quaternion.copy(camera.quaternion);
    r.veil.material.uniforms.time.value = reduceRiftMotion ? 0 : simTime;
    const positions = r.dust.geometry.attributes.position,
      t = reduceRiftMotion ? 0 : simTime;
    for (let k = 0; k < r.parts.length; k++) {
      const [a, seed, y] = r.parts[k],
        rad =
          22 + ((((seed - 22 + (r.white ? 1 : -1) * t * 7) % 112) + 112) % 112),
        ang = a + t * (r.white ? -0.2 : 0.24);
      positions.setXYZ(k, Math.cos(ang) * rad, y, Math.sin(ang) * rad);
    }
    positions.needsUpdate = true;
  }
  if (started && !paused) transitFlash = Math.max(0, transitFlash - dt * 0.8);
  const flash = $("riftTransit");
  if (flash) {
    flash.style.opacity = reduceRiftMotion ? "0" : String(transitFlash * 0.6);
    flash.style.transform = "scale(" + (1 + transitFlash * 0.15) + ")";
  }
  const active = driving ? ship : player,
    near = rifts.reduce((a, b) =>
      active.pos.distanceTo(a.pos) < active.pos.distanceTo(b.pos) ? a : b,
    );
  const d = active.pos.distanceTo(near.pos),
    warp = reduceRiftMotion
      ? 0
      : Math.max(transitFlash * 10, (1 - smoothRift(20, 125, d)) * 9);
  camera.fov = settings.fov + warp;
  camera.updateProjectionMatrix();
};
updateHUD = function () {
  riftOld.updateHUD();
  if (!riftReady) return;
  const b = driving ? ship : player,
    r = rifts.reduce((a, c) =>
      b.pos.distanceTo(a.pos) < b.pos.distanceTo(c.pos) ? a : c,
    ),
    d = b.pos.distanceTo(r.pos),
    el = $("riftStatus");
  el.classList.toggle("active", d < 330);
  el.innerHTML =
    "<span>" +
    (r.white ? "WHITE HOLE / 单向出口" : "BLACK HOLE / 单向入口") +
    "</span><strong>" +
    r.name +
    " · " +
    formatDist(d) +
    "</strong><small>" +
    (r.white
      ? "排斥场 · 不可反向进入"
      : d < 100
        ? "强牵引 · 穿过黑色球心自动跃迁"
        : "配对 → " + rifts[r.pair].name + " · P 探针先行") +
    "</small>";
  if (probe) {
    el.classList.add("active");
    el.innerHTML +=
      '<small class="probe-telemetry">探针 ' +
      formatDist(probe.pos.distanceTo(b.pos)) +
      " · " +
      probe.age.toFixed(0) +
      " / 90 s · N 最近黑洞</small>";
  }
};
targetPoint = function () {
  const r = riftReady ? rifts.find((r) => r.id === navSite) : null;
  return r
    ? {
        name: r.name,
        point: r.pos.clone(),
        planet: planets[r.planet],
        surface: true,
        rift: true,
      }
    : riftOld.targetPoint();
};
targetVelocity = function (t) {
  const r = riftReady ? rifts.find((r) => r.id === navSite) : null;
  return r ? r.vel : riftOld.targetVelocity(t);
};
createMap = function () {
  document.querySelector("#map .rift-map")?.remove();
  riftOld.createMap();
  if (!riftReady) return;
  const box = document.createElement("section");
  box.className = "rift-map";
  box.innerHTML =
    '<div class="eyebrow">FOLDED SPACE / 折叠航路</div><p>黑洞 → 白洞，单向穿越。选择只设导航，不传送。</p>' +
    rifts
      .map(
        (r) =>
          '<button class="rift-row ' +
          (navSite === r.id ? "selected" : "") +
          '" data-rift="' +
          r.id +
          '"><span class="rift-icon ' +
          (r.white ? "white" : "") +
          '">' +
          (r.white ? "◉" : "●") +
          "</span><span>" +
          r.name +
          "<small>" +
          planets[r.planet].name +
          "上空 · " +
          (r.white ? "单向出口" : "通往" + rifts[r.pair].name) +
          "</small></span><span>↗</span></button>",
      )
      .join("");
  document.querySelector("#map .system-layout").prepend(box);
  box.querySelectorAll("button").forEach(
    (btn) =>
      (btn.onclick = () => {
        navSite = btn.dataset.rift;
        targetIndex = rifts.find((r) => r.id === navSite).planet;
        createMap();
        toast("已设导航；请飞抵并进入黑色球心。", 3);
      }),
  );
};
renderJournal = function () {
  riftOld.renderJournal();
  if (!riftReady) return;
  $("journalSummary").textContent =
    "已记录 " +
    discovered.size +
    " / " +
    sites.length +
    " 处地标 · 9 处仪器 · 2 条单向折叠航路。N 导航最近入口，P 发射探针。";
  const note = document.createElement("section");
  note.className = "rift-log";
  note.innerHTML =
    "<h3>折叠航路 · 穿越记录</h3><p>已观测 " +
    riftSeen.size +
    " / 4 处异常 · 已保存最近 " +
    riftRecords.length +
    " 次穿越。探针与身体均可触发。</p>" +
    (!riftRecords.length
      ? "<p>尚未穿越。先从苔原上空的折光黑洞开始。</p>"
      : riftRecords
          .slice()
          .reverse()
          .map(
            (x) =>
              "<p><strong>" +
              rifts.find((r) => r.id === x.from).name +
              " → " +
              rifts.find((r) => r.id === x.to).name +
              "</strong><br><small>" +
              { probe: "探针", ship: "拾光号", suit: "宇航服" }[x.kind] +
              " / 星系时刻 " +
              x.time.toFixed(1) +
              " s / 出口相对速度 " +
              x.speed.toFixed(1) +
              " m/s</small></p>",
          )
          .join(""));
  $("journalList").prepend(note);
};
// Keep v6 orbital payload intact; namespace feature state for backward-compatible migration.
makeSave = function () {
  const d = riftOld.makeSave();
  d.riftVersion = 1;
  d.rifts = {
    seen: [...riftSeen],
    records: riftRecords.map((x) => ({ ...x })),
    reducedMotion: reduceRiftMotion,
  };
  return d;
};
validSave = function (d) {
  if (!riftOld.validSave(d)) return false;
  if (d.rifts === undefined) return true;
  const s = d.rifts;
  return !!(
    s &&
    Array.isArray(s.seen) &&
    s.seen.length <= 4 &&
    s.seen.every((x) => RIFT_DEFS.some((r) => r.id === x)) &&
    Array.isArray(s.records) &&
    s.records.length <= 24 &&
    typeof s.reducedMotion === "boolean" &&
    s.records.every(
      (x) =>
        x &&
        RIFT_DEFS.some(
          (r) => !r.white && r.id === x.from && RIFT_DEFS[r.pair].id === x.to,
        ) &&
        ["probe", "ship", "suit"].includes(x.kind) &&
        Number.isFinite(x.time) &&
        x.time >= 0 &&
        x.time <= d.simTime &&
        Number.isFinite(x.speed) &&
        x.speed >= 0 &&
        x.speed < 20000,
    )
  );
};
restoreSave = function (d) {
  if (!validSave(d)) throw Error("折叠航路存档数据无效。");
  const ok = riftOld.restoreSave(d);
  riftSeen = new Set(d.rifts?.seen || []);
  riftRecords = (d.rifts?.records || []).map((x) => ({ ...x }));
  reduceRiftMotion =
    d.rifts?.reducedMotion ??
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ($("riftMotion")) $("riftMotion").checked = reduceRiftMotion;
  clearProbe();
  transitFlash = 0;
  syncRifts();
  if (riftReady) {
    riftBodies.set(ship, { until: simTime + 0.6 });
    riftBodies.set(player, { until: simTime + 0.6 });
  }
  return ok;
};
