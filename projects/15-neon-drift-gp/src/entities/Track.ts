import * as THREE from 'three';

export type TrackSample = {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  /** 0..1 progress along the closed centerline */
  u: number;
  /** lateral offset from centerline (right positive when looking along tangent) */
  lateral: number;
};

const CONTROL_POINTS: [number, number][] = [
  [0, -90],
  [40, -88],
  [70, -70],
  [78, -30],
  [70, 0],
  [85, 30],
  [80, 70],
  [50, 95],
  [0, 100],
  [-45, 92],
  [-75, 70],
  [-70, 35],
  [-45, 15],
  [-70, -10],
  [-85, -45],
  [-75, -80],
  [-40, -95],
];

const ROAD_HALF_WIDTH = 9;
const CURVE_SEGMENTS = 400;

export class Track {
  readonly group = new THREE.Group();
  readonly curve: THREE.CatmullRomCurve3;
  readonly length: number;
  readonly roadHalfWidth = ROAD_HALF_WIDTH;

  private readonly samples: {
    position: THREE.Vector3;
    tangent: THREE.Vector3;
    right: THREE.Vector3;
    u: number;
    curvature: number;
  }[] = [];

  constructor() {
    const points = CONTROL_POINTS.map(([x, z]) => new THREE.Vector3(x, 0, z));
    this.curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.35);
    this.length = this.curve.getLength();
    this.buildSamples();
    this.group.add(this.buildRoadMesh());
    this.group.add(this.buildEdgeLights());
    this.group.add(this.buildStartGate());
    this.group.add(this.buildBoostPads());
    this.group.add(this.buildBillboards());
  }

  private buildSamples(): void {
    for (let i = 0; i < CURVE_SEGMENTS; i += 1) {
      const u = i / CURVE_SEGMENTS;
      const position = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).setY(0).normalize();
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const prev = this.curve.getTangentAt((u - 1 / CURVE_SEGMENTS + 1) % 1).setY(0).normalize();
      const next = this.curve.getTangentAt((u + 1 / CURVE_SEGMENTS) % 1).setY(0).normalize();
      const cross = prev.x * next.z - prev.z * next.x;
      const dot = THREE.MathUtils.clamp(prev.dot(next), -1, 1);
      const curvature = Math.sign(cross) * Math.acos(dot) * CURVE_SEGMENTS;
      this.samples.push({ position, tangent, right, u, curvature });
    }
  }

  /** Closest sample index by world position (linear scan with coarse stride then refine). */
  findClosestU(position: THREE.Vector3, hintU = 0): { u: number; lateral: number; sampleIndex: number } {
    const stride = 8;
    let bestIndex = 0;
    let bestDist = Infinity;
    const hintIndex = Math.floor(hintU * CURVE_SEGMENTS);
    for (let i = 0; i < CURVE_SEGMENTS; i += stride) {
      const s = this.samples[i];
      const d = s.position.distanceToSquared(position);
      if (d < bestDist) {
        bestDist = d;
        bestIndex = i;
      }
    }
    // refine around best and around hint
    const windows = [bestIndex, hintIndex];
    for (const start of windows) {
      for (let o = -stride; o <= stride; o += 1) {
        const i = ((start + o) % CURVE_SEGMENTS + CURVE_SEGMENTS) % CURVE_SEGMENTS;
        const s = this.samples[i];
        const d = s.position.distanceToSquared(position);
        if (d < bestDist) {
          bestDist = d;
          bestIndex = i;
        }
      }
    }
    const s = this.samples[bestIndex];
    const offset = position.clone().sub(s.position);
    const lateral = offset.dot(s.right);
    return { u: s.u, lateral, sampleIndex: bestIndex };
  }

  getSample(index: number): (typeof this.samples)[number] {
    return this.samples[((index % CURVE_SEGMENTS) + CURVE_SEGMENTS) % CURVE_SEGMENTS];
  }

  sampleAtU(u: number): (typeof this.samples)[number] {
    const i = Math.floor((((u % 1) + 1) % 1) * CURVE_SEGMENTS) % CURVE_SEGMENTS;
    return this.samples[i];
  }

  /** World position on centerline + lateral offset. */
  pointAt(u: number, lateral = 0): THREE.Vector3 {
    const s = this.sampleAtU(u);
    return s.position.clone().addScaledVector(s.right, lateral);
  }

  curvatureAtU(u: number): number {
    return this.sampleAtU(u).curvature;
  }

  isOnRoad(lateral: number): boolean {
    return Math.abs(lateral) <= ROAD_HALF_WIDTH;
  }

  spawnGrid(index: number): { position: THREE.Vector3; heading: number } {
    // Grid behind start line, two columns
    const u = 0.985 - Math.floor(index / 2) * 0.012;
    const lateral = (index % 2 === 0 ? -3.2 : 3.2);
    const position = this.pointAt(u, lateral);
    const s = this.sampleAtU(u);
    const heading = Math.atan2(s.tangent.x, s.tangent.z);
    return { position, heading };
  }

  private buildRoadMesh(): THREE.Mesh {
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const stripCount = CURVE_SEGMENTS + 1;

    for (let i = 0; i <= CURVE_SEGMENTS; i += 1) {
      const u = (i % CURVE_SEGMENTS) / CURVE_SEGMENTS;
      const s = this.getSample(i % CURVE_SEGMENTS);
      const left = s.position.clone().addScaledVector(s.right, -ROAD_HALF_WIDTH);
      const right = s.position.clone().addScaledVector(s.right, ROAD_HALF_WIDTH);
      positions.push(left.x, 0.02, left.z, right.x, 0.02, right.z);
      uvs.push(0, u * 40, 1, u * 40);
      if (i < CURVE_SEGMENTS) {
        const a = i * 2;
        // CCW when viewed from +Y so computeVertexNormals points up
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const texture = this.createRoadTexture();
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.65,
        metalness: 0.05,
        color: '#ffffff',
        emissive: '#4a2a80',
        emissiveIntensity: 0.55,
        side: THREE.DoubleSide,
      }),
    );
    mesh.receiveShadow = true;
    mesh.renderOrder = 2;
    mesh.name = 'road';
    void stripCount;
    return mesh;
  }

  private createRoadTexture(): THREE.CanvasTexture {
    const w = 256;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    // road surface should read above the world grid
    ctx.fillStyle = '#2a1850';
    ctx.fillRect(0, 0, w, h);

    // side neon curbs
    ctx.fillStyle = '#ff2d95';
    ctx.fillRect(0, 0, 14, h);
    ctx.fillStyle = '#2dfff3';
    ctx.fillRect(w - 14, 0, 14, h);

    // center dashed lane
    ctx.fillStyle = 'rgba(255, 245, 180, 0.75)';
    for (let y = 0; y < h; y += 48) {
      ctx.fillRect(w / 2 - 4, y, 8, 30);
    }

    // lane edge lines
    ctx.fillStyle = 'rgba(200, 170, 255, 0.35)';
    ctx.fillRect(28, 0, 3, h);
    ctx.fillRect(w - 31, 0, 3, h);

    // subtle grid
    ctx.strokeStyle = 'rgba(120, 80, 255, 0.18)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private buildEdgeLights(): THREE.Group {
    const group = new THREE.Group();
    const postGeo = new THREE.BoxGeometry(0.25, 1.4, 0.25);
    const leftMat = new THREE.MeshStandardMaterial({
      color: '#ff2d95',
      emissive: '#ff2d95',
      emissiveIntensity: 1.6,
      roughness: 0.4,
    });
    const rightMat = new THREE.MeshStandardMaterial({
      color: '#2dfff3',
      emissive: '#2dfff3',
      emissiveIntensity: 1.6,
      roughness: 0.4,
    });

    for (let i = 0; i < CURVE_SEGMENTS; i += 4) {
      const s = this.getSample(i);
      const left = new THREE.Mesh(postGeo, leftMat);
      left.position.copy(s.position).addScaledVector(s.right, -ROAD_HALF_WIDTH - 1.1);
      left.position.y = 0.7;
      group.add(left);
      const right = new THREE.Mesh(postGeo, rightMat);
      right.position.copy(s.position).addScaledVector(s.right, ROAD_HALF_WIDTH + 1.1);
      right.position.y = 0.7;
      group.add(right);
    }
    return group;
  }

  private buildStartGate(): THREE.Group {
    const group = new THREE.Group();
    const s = this.sampleAtU(0);
    const center = s.position.clone();
    const right = s.right.clone();

    const archMat = new THREE.MeshStandardMaterial({
      color: '#ff6ec7',
      emissive: '#ff2d95',
      emissiveIntensity: 1.2,
      roughness: 0.35,
      metalness: 0.4,
    });
    const pillarGeo = new THREE.BoxGeometry(1.2, 10, 1.2);
    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(pillarGeo, archMat);
      pillar.position.copy(center).addScaledVector(right, side * (ROAD_HALF_WIDTH + 1.5));
      pillar.position.y = 5;
      group.add(pillar);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(ROAD_HALF_WIDTH * 2 + 4, 1.4, 1.4), archMat);
    beam.position.copy(center);
    beam.position.y = 10;
    beam.lookAt(center.clone().add(s.tangent));
    group.add(beam);

    // checkered strip
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_HALF_WIDTH * 2, 3),
      new THREE.MeshBasicMaterial({ map: this.createCheckerTexture(), transparent: true }),
    );
    strip.rotation.x = -Math.PI / 2;
    strip.rotation.z = -Math.atan2(s.tangent.x, s.tangent.z);
    strip.position.copy(center);
    strip.position.y = 0.04;
    group.add(strip);
    return group;
  }

  private createCheckerTexture(): THREE.CanvasTexture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const cell = size / 8;
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#12081f';
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private buildBoostPads(): THREE.Group {
    const group = new THREE.Group();
    const us = [0.12, 0.38, 0.62, 0.85];
    const geo = new THREE.PlaneGeometry(4.5, 7);
    for (const u of us) {
      const s = this.getSample(Math.floor(u * CURVE_SEGMENTS));
      const mat = new THREE.MeshStandardMaterial({
        color: '#2dfff3',
        emissive: '#2dfff3',
        emissiveIntensity: 1.4,
        transparent: true,
        opacity: 0.85,
        roughness: 0.3,
      });
      const pad = new THREE.Mesh(geo, mat);
      pad.rotation.x = -Math.PI / 2;
      pad.rotation.z = -Math.atan2(s.tangent.x, s.tangent.z);
      pad.position.copy(s.position);
      pad.position.y = 0.03;
      group.add(pad);
      group.userData[`u${u}`] = u;
    }
    group.name = 'boostPads';
    return group;
  }

  getBoostPadUs(): number[] {
    return [0.12, 0.38, 0.62, 0.85];
  }

  private buildBillboards(): THREE.Group {
    const group = new THREE.Group();
    const palette = ['#ff2d95', '#2dfff3', '#ffe600', '#b84dff', '#ff6e40'];
    const phrases = ['NEON', 'DRIFT', 'POP!', 'VAPOR', 'GP 99', '夜', '漂移', 'RUSH'];
    for (let i = 0; i < 12; i += 1) {
      const u = i / 12 + 0.03;
      const s = this.getSample(Math.floor(u * CURVE_SEGMENTS));
      const side = i % 2 === 0 ? -1 : 1;
      const lat = side * (ROAD_HALF_WIDTH + 8 + (i % 3) * 3);
      const base = s.position.clone().addScaledVector(s.right, lat);
      const height = 8 + (i % 4) * 3;
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(7 + (i % 3) * 2, height, 6),
        new THREE.MeshStandardMaterial({
          color: '#1a0b2e',
          emissive: palette[i % palette.length],
          emissiveIntensity: 0.12,
          roughness: 0.6,
          metalness: 0.2,
        }),
      );
      building.position.copy(base);
      building.position.y = height / 2;
      building.castShadow = true;
      group.add(building);

      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(6.5, 3),
        new THREE.MeshBasicMaterial({
          map: this.createSignTexture(phrases[i % phrases.length], palette[i % palette.length]),
          transparent: true,
          side: THREE.DoubleSide,
        }),
      );
      sign.position.copy(base);
      sign.position.y = height - 1.5;
      sign.position.addScaledVector(s.right, side * -0.1);
      sign.lookAt(sign.position.clone().add(s.tangent.clone().multiplyScalar(-side)));
      group.add(sign);
    }
    return group;
  }

  private createSignTexture(text: string, color: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(8, 4, 20, 0.92)';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = color;
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 492, 236);
    ctx.fillStyle = color;
    ctx.font = 'bold 96px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = 24;
    ctx.fillText(text, 256, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
  }
}
