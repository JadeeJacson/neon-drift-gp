"use strict";
// 0.8: deep-space ambience and exaggerated world signatures. Artistic rendering, not physical scattering.
// 星云背景、大气辉光壳、星冕、高速尾迹、太阳风与赤岬侧环——纯视觉与轻物理增味，不改核心轨道模型。
const COSMOS_ATMOSPHERES = [
  { index: 0, color: 0x86c9a8, power: 2.1 },
  { index: 1, color: 0x9fb4c8, power: 2.6 },
  { index: 2, color: 0xd99a7a, power: 2.2 },
  { index: 3, color: 0xe8b87a, power: 2.1 },
  { index: 4, color: 0xb98a95, power: 2.7 },
  { index: 5, color: 0xa8b4cf, power: 2.8 },
  { index: 6, color: 0xa8d4f2, power: 2.0 },
  { index: 7, color: 0x9fd4d8, power: 2.4 },
  { index: 8, color: 0xc9d8b4, power: 2.0 },
  { index: 9, color: 0xd8c9a4, power: 2.5 },
  { index: 10, color: 0xbfe0dc, power: 2.4 },
];
const COSMOS_SKY = [
  0x477788, 0x2a3a4d, 0x6b4a42, 0x8a6647, 0x3a2f42, 0x3d4a63, 0x7fa8c9,
  0x304e61, 0x4d6377, 0x6e6248, 0x88a8a4,
];
let cosmosReady = false,
  nebulaMesh = null,
  corona = [],
  shipTrail = null,
  trailPoints = [],
  marsRing = null;
const cosmosOld = {
  init,
  initContent,
  environmentForce,
  updateCamera,
  updateCelestials,
  updateHUD,
};

const cosmosNoise = `
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.55;for(int k=0;k<4;k++){v+=a*noise(p);p*=2.13;a*=.5;}return v;}
`;

function buildNebula() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      tintA: { value: new THREE.Color(0x1c3a52) },
      tintB: { value: new THREE.Color(0x3d2a55) },
    },
    vertexShader:
      "varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:
      "precision highp float;varying vec3 vDir;uniform vec3 tintA;uniform vec3 tintB;" +
      cosmosNoise +
      "void main(){vec3 d=normalize(vDir);" +
      "float band=exp(-pow(dot(d,normalize(vec3(.24,.88,-.42))),2.)*1.9);" +
      "float n=fbm(d*2.7);float n2=fbm(d*5.6+4.7);" +
      "vec3 c=mix(tintA,tintB,n);float glow=pow(max(n-.28,0.),1.8)*.9+pow(max(n2-.34,0.),2.2)*.5;" +
      "gl_FragColor=vec4(c*(.28+band*.85)*glow*1.35,1.);}",
  });
  nebulaMesh = mesh(new THREE.SphereGeometry(58000, 32, 20), material);
  nebulaMesh.renderOrder = -20;
}

function buildCorona() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d"),
    g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, "rgba(255,236,190,0.85)");
  g.addColorStop(0.32, "rgba(255,196,110,0.34)");
  g.addColorStop(0.62, "rgba(255,150,72,0.12)");
  g.addColorStop(1, "rgba(255,120,40,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  for (const [scale, opacity] of [
    [4.6, 0.55],
    [2.5, 0.4],
  ]) {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity,
        depthWrite: false,
        fog: false,
      }),
    );
    s.position.copy(starPos);
    s.scale.setScalar(SYSTEM.star.r * scale);
    scene.add(s);
    corona.push({ sprite: s, base: opacity });
  }
}

function buildMarsRing() {
  const p = planets[2];
  marsRing = new THREE.Group();
  scene.add(marsRing);
  for (const [inner, outer, opacity] of [
    [305, 360, 0.16],
    [378, 460, 0.1],
  ]) {
    const band = mesh(
      new THREE.RingGeometry(inner, outer, 96),
      new THREE.MeshBasicMaterial({
        color: 0xcfd8e2,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      marsRing,
    );
    band.rotation.x = -Math.PI / 2;
  }
  const inst = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    mat(0xaeb6c4),
    46,
  );
  marsRing.add(inst);
  const d = new THREE.Object3D(),
    rng = seeded(208);
  for (let k = 0; k < 46; k++) {
    const a = rng() * Math.PI * 2,
      r = 310 + rng() * 140,
      sc = 1.2 + rng() * 3.4;
    d.position.set(Math.sin(a) * r, (rng() - 0.5) * 6, Math.cos(a) * r);
    d.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    d.scale.setScalar(sc);
    d.updateMatrix();
    inst.setMatrixAt(k, d.matrix);
  }
  marsRing.rotation.set(1.12, 0, 0.42);
}

function buildTrail() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(new Float32Array(64 * 3), 3),
  );
  geo.setDrawRange(0, 0);
  shipTrail = new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({
      color: 0xbfe9e4,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    }),
  );
  shipTrail.frustumCulled = false;
  scene.add(shipTrail);
}

initContent = function () {
  cosmosOld.initContent();
  for (const a of COSMOS_ATMOSPHERES) {
    const p = planets[a.index],
      material = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
        uniforms: {
          glowColor: { value: new THREE.Color(a.color) },
          power: { value: a.power },
        },
        vertexShader:
          "varying vec3 vNormal;varying vec3 vView;void main(){vNormal=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vView=-mv.xyz;gl_Position=projectionMatrix*mv;}",
        fragmentShader:
          "varying vec3 vNormal;varying vec3 vView;uniform vec3 glowColor;uniform float power;void main(){float f=pow(max(0.,0.72-abs(dot(vNormal,normalize(vView)))),power);gl_FragColor=vec4(glowColor*f*.9,f*.62);}",
      }),
      shell = mesh(new THREE.SphereGeometry(p.r * 1.045, 40, 26), material);
    shell.renderOrder = -5;
    detailRoots.push({ p, objects: [shell] });
  }
};

init = function () {
  cosmosOld.init();
  buildNebula();
  buildCorona();
  buildMarsRing();
  buildTrail();
  cosmosReady = true;
  // 飞行控制器与测试读取的环境力接口指向包装后的版本。
  __sandbox.environment = environmentForce;
};

environmentForce = function (pos) {
  const force = cosmosOld.environmentForce(pos);
  const gap = pos.distanceTo(starPos) - SYSTEM.star.r;
  if (gap > 0 && gap < 4000)
    force.addScaledVector(
      pos.clone().sub(starPos).normalize(),
      6 *
        Math.exp(-gap / 1400) *
        (0.85 + 0.15 * Math.sin((typeof simTime === "number" ? simTime : 0) * 0.9)),
    );
  return force;
};

updateCelestials = function (t) {
  cosmosOld.updateCelestials(t);
  if (!cosmosReady) return;
  // 赤岬侧环：随公转平移，倾角固定，不随地表刚性自转。
  const p = planets[2];
  marsRing.position.copy(p.pos);
  marsRing.quaternion
    .copy(p.spinQ.clone().invert())
    .multiply(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(1.12, 0, 0.42)),
    );
};

updateCamera = function (dt) {
  cosmosOld.updateCamera(dt);
  if (!cosmosReady) return;
  if (nebulaMesh) nebulaMesh.position.copy(camera.position);
  const t = reduceRiftMotion ? 0 : elapsed;
  for (const c of corona)
    c.sprite.material.opacity = c.base * (1 + Math.sin(t * 0.8) * 0.07);
  // 高速凝结尾迹（视觉，无碰撞）。
  const speed = relativeVelocity(ship).length();
  if (
    started &&
    !paused &&
    !ship.grounded &&
    speed > 55 &&
    trailPoints.length < 64
  )
    trailPoints.push(ship.pos.clone());
  else if (trailPoints.length && (!started || paused || speed <= 55))
    trailPoints.shift();
  const attr = shipTrail.geometry.attributes.position;
  for (let k = 0; k < trailPoints.length; k++)
    attr.setXYZ(k, trailPoints[k].x, trailPoints[k].y, trailPoints[k].z);
  attr.needsUpdate = true;
  shipTrail.geometry.setDrawRange(0, trailPoints.length);
  shipTrail.visible = trailPoints.length > 1;
  // 天空色板：为每一颗大气世界提供彩色天穹与雾色，深空保持星野。
  const p = nearest(camera.position),
    alt = altitude(camera.position, p);
  if (p.theme !== "mist") {
    skyMesh.material.color.set(COSMOS_SKY[p.index]);
    const skyGlow = clamp(1 - alt / 240, 0, 1) * 0.5;
    skyMesh.material.opacity = Math.max(skyMesh.material.opacity, skyGlow);
    stars.material.opacity = Math.min(
      stars.material.opacity,
      1 - skyGlow * 0.85,
    );
    if (scene.fog) scene.fog.color.set(COSMOS_SKY[p.index]);
  }
  if (marsRing) {
    const d = camera.position.distanceTo(planets[2].pos);
    marsRing.visible = d < 14000;
  }
};

updateHUD = function () {
  cosmosOld.updateHUD();
  if (!cosmosReady) return;
  const b = driving ? ship : player,
    gap = b.pos.distanceTo(starPos) - SYSTEM.star.r;
  if (gap < 3000 && gap > 0) {
    $("envStatus").textContent =
      "太阳风 · 带电粒子流 " +
      (6 * Math.exp(-gap / 1400)).toFixed(2) +
      " m/s²（推离）";
    $("envStatus").classList.remove("hidden");
  }
};
