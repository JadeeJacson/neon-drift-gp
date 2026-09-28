import * as THREE from 'three';
import { createSeededRandom } from '../utils/random';

/** Vaporwave / pop / anime world dressing around the track. */
export function buildVaporWorld(trackLengthInfo?: {
  curve: THREE.CatmullRomCurve3;
  halfWidth: number;
}): THREE.Group {
  const group = new THREE.Group();
  group.name = 'vapor-world';

  // —— sky dome gradient via large sphere ——
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(400, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {},
      vertexShader: `varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `
        varying vec3 vPos;
        void main(){
          float h = normalize(vPos).y * 0.5 + 0.5;
          vec3 bottom = vec3(0.12, 0.03, 0.22);
          vec3 mid = vec3(0.55, 0.12, 0.45);
          vec3 top = vec3(0.08, 0.05, 0.28);
          vec3 col = h < 0.45 ? mix(bottom, mid, smoothstep(0.15,0.45,h)) : mix(mid, top, smoothstep(0.45,0.95,h));
          // horizon glow line
          float band = exp(-pow((h-0.48)*18.0, 2.0));
          col += vec3(0.35, 0.1, 0.4) * band * 0.6;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    }),
  );
  sky.name = 'sky';
  group.add(sky);

  // —— vaporwave sun ——
  const sunGroup = new THREE.Group();
  sunGroup.position.set(0, 28, -180);
  const sunCanvas = document.createElement('canvas');
  sunCanvas.width = 256;
  sunCanvas.height = 256;
  const sctx = sunCanvas.getContext('2d')!;
  const sg = sctx.createLinearGradient(0, 0, 0, 256);
  sg.addColorStop(0, '#ffe600');
  sg.addColorStop(0.45, '#ff6ec7');
  sg.addColorStop(1, '#b84dff');
  sctx.fillStyle = sg;
  sctx.beginPath();
  sctx.arc(128, 128, 110, 0, Math.PI * 2);
  sctx.fill();
  sctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 8; i += 1) {
    const y = 140 + i * 14;
    sctx.fillRect(0, y, 256, 6 + i * 0.5);
  }
  const sunTex = new THREE.CanvasTexture(sunCanvas);
  sunTex.colorSpace = THREE.SRGBColorSpace;
  const sun = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, depthWrite: false }),
  );
  sunGroup.add(sun);
  group.add(sunGroup);

  // —— perspective grid floor ——
  const grid = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600, 1, 1),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        void main(){
          vec2 p = (vUv - 0.5) * 60.0;
          p.y += uTime * 2.0;
          vec2 g = abs(fract(p) - 0.5);
          float line = 1.0 - smoothstep(0.0, 0.06, min(g.x, g.y));
          float fade = 1.0 - smoothstep(0.2, 0.5, length(vUv - 0.5));
          vec3 col = vec3(0.2, 1.0, 0.95) * line;
          float a = line * fade * 0.22;
          if (a < 0.02) discard;
          gl_FragColor = vec4(col, a);
        }
      `,
    }),
  );
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = -0.05;
  grid.name = 'grid';
  // keep decorative grid from fighting the track ribbon
  grid.renderOrder = -1;
  group.add(grid);

  // —— ground plane under grid ——
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(700, 700),
    new THREE.MeshStandardMaterial({
      color: '#1a0b33',
      roughness: 0.95,
      metalness: 0,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.12;
  ground.receiveShadow = true;
  group.add(ground);

  // —— mountains / distant peaks ——
  const rng = createSeededRandom(42);
  const mountainMat = new THREE.MeshStandardMaterial({
    color: '#2b1055',
    roughness: 0.9,
    emissive: '#120428',
    emissiveIntensity: 0.3,
  });
  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * Math.PI * 2;
    const r = 160 + rng() * 40;
    const h = 30 + rng() * 50;
    const peak = new THREE.Mesh(new THREE.ConeGeometry(20 + rng() * 25, h, 5), mountainMat);
    peak.position.set(Math.cos(a) * r, h / 2 - 2, Math.sin(a) * r);
    peak.rotation.y = rng() * Math.PI;
    group.add(peak);
  }

  // —— floating cubes (pop accents) ——
  const cubeGeo = new THREE.BoxGeometry(2, 2, 2);
  const colors = ['#ff2d95', '#2dfff3', '#ffe600', '#b84dff'];
  for (let i = 0; i < 24; i += 1) {
    const mesh = new THREE.Mesh(
      cubeGeo,
      new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        emissive: colors[i % colors.length],
        emissiveIntensity: 0.45,
        roughness: 0.4,
      }),
    );
    const a = rng() * Math.PI * 2;
    const r = 40 + rng() * 100;
    mesh.position.set(Math.cos(a) * r, 8 + rng() * 25, Math.sin(a) * r);
    mesh.rotation.set(rng(), rng(), rng());
    mesh.userData.spin = 0.2 + rng() * 0.6;
    mesh.userData.baseY = mesh.position.y;
    mesh.userData.phase = rng() * Math.PI * 2;
    mesh.name = 'float-cube';
    group.add(mesh);
  }

  // —— palm silhouettes (vaporwave staple) ——
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2 + 0.2;
    const r = 110 + rng() * 30;
    group.add(makePalm(Math.cos(a) * r, Math.sin(a) * r, rng));
  }

  // —— lighting ——
  const hemi = new THREE.HemisphereLight('#ff9ad5', '#1a0530', 1.1);
  group.add(hemi);
  const key = new THREE.DirectionalLight('#fff0ff', 2.2);
  key.position.set(40, 60, 20);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 220;
  key.shadow.camera.left = -120;
  key.shadow.camera.right = 120;
  key.shadow.camera.top = 120;
  key.shadow.camera.bottom = -120;
  group.add(key);
  group.add(key.target);

  const fill = new THREE.DirectionalLight('#2dfff3', 0.55);
  fill.position.set(-30, 20, -40);
  group.add(fill);

  const rim = new THREE.PointLight('#ff2d95', 1.2, 80);
  rim.position.set(0, 15, 0);
  group.add(rim);

  void trackLengthInfo;
  return group;
}

function makePalm(x: number, z: number, rng: () => number): THREE.Group {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#12041f', roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({
    color: '#ff2d95',
    emissive: '#ff2d95',
    emissiveIntensity: 0.2,
    roughness: 0.7,
  });
  const h = 8 + rng() * 6;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, h, 6), trunkMat);
  trunk.position.y = h / 2;
  g.add(trunk);
  for (let i = 0; i < 7; i += 1) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 4), leafMat);
    leaf.position.y = h;
    leaf.rotation.y = (i / 7) * Math.PI * 2;
    leaf.rotation.x = -0.4 - rng() * 0.3;
    leaf.translateZ(1.8);
    g.add(leaf);
  }
  g.position.set(x, 0, z);
  return g;
}

export function animateVaporWorld(group: THREE.Group, elapsed: number): void {
  const grid = group.getObjectByName('grid');
  if (grid instanceof THREE.Mesh) {
    const mat = grid.material;
    if (mat instanceof THREE.ShaderMaterial) {
      mat.uniforms.uTime.value = elapsed;
    }
  }
  group.traverse((obj) => {
    if (obj.name === 'float-cube') {
      obj.rotation.x += 0.01;
      obj.rotation.y += 0.015;
      const baseY = obj.userData.baseY as number;
      const phase = obj.userData.phase as number;
      obj.position.y = baseY + Math.sin(elapsed * 0.8 + phase) * 1.2;
    }
  });
}
