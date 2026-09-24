/**
 * 特效：曳光弹道、命中火花、击杀碎块。
 *
 * 全部走两个预分配的对象池（LineSegments + Points），不在运行时 new 几何体 ——
 * 波次射击的特效是每帧高频事件，临时分配会让 GC 抖动直接变成可见卡顿。
 */
import * as THREE from 'three';
import { CONFIG } from '../core/config';

const MAX_TRACERS = 64;
const MAX_PARTICLES = 500;

interface Tracer {
  from: THREE.Vector3;
  to: THREE.Vector3;
  life: number;
  color: THREE.Color;
}

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
  size: number;
}

export class Fx {
  private readonly tracers: Tracer[] = [];
  private readonly particles: Particle[] = [];

  private readonly tracerGeom = new THREE.BufferGeometry();
  private readonly tracerPos = new Float32Array(MAX_TRACERS * 6);
  private readonly tracerCol = new Float32Array(MAX_TRACERS * 6);
  private readonly tracerMesh: THREE.LineSegments;

  private readonly partGeom = new THREE.BufferGeometry();
  private readonly partPos = new Float32Array(MAX_PARTICLES * 3);
  private readonly partCol = new Float32Array(MAX_PARTICLES * 3);
  private readonly partSize = new Float32Array(MAX_PARTICLES);
  private readonly points: THREE.Points;

  constructor(scene: THREE.Scene) {
    this.tracerGeom.setAttribute('position', new THREE.BufferAttribute(this.tracerPos, 3));
    this.tracerGeom.setAttribute('color', new THREE.BufferAttribute(this.tracerCol, 3));
    this.tracerMesh = new THREE.LineSegments(
      this.tracerGeom,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.tracerMesh.frustumCulled = false;
    this.tracerMesh.name = 'tracers';
    scene.add(this.tracerMesh);

    this.partGeom.setAttribute('position', new THREE.BufferAttribute(this.partPos, 3));
    this.partGeom.setAttribute('color', new THREE.BufferAttribute(this.partCol, 3));
    this.partGeom.setAttribute('size', new THREE.BufferAttribute(this.partSize, 1));
    this.points = new THREE.Points(
      this.partGeom,
      new THREE.PointsMaterial({
        size: 0.09,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );
    this.points.frustumCulled = false;
    this.points.name = 'particles';
    scene.add(this.points);
  }

  /** 一条曳光（玩家黄白 / 敌人橙红） */
  tracer(from: { x: number; y: number; z: number }, dir: { x: number; y: number; z: number }, len: number, color: number): void {
    if (this.tracers.length >= MAX_TRACERS) this.tracers.shift();
    const to = new THREE.Vector3(
      from.x + dir.x * len,
      from.y + dir.y * len,
      from.z + dir.z * len,
    );
    this.tracers.push({
      from: new THREE.Vector3(from.x, from.y, from.z),
      to,
      life: CONFIG.fx.tracerLife,
      color: new THREE.Color(color),
    });
  }

  /** 粒子爆发（命中火花 / 击杀碎块） */
  burst(
    at: { x: number; y: number; z: number },
    color: number,
    count: number,
    speed = 4,
    size = 0.09,
  ): void {
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) this.particles.shift();
      const a = Math.random() * Math.PI * 2;
      const up = 0.3 + Math.random() * 0.9;
      const r = Math.sqrt(Math.random());
      this.particles.push({
        pos: new THREE.Vector3(at.x, at.y, at.z),
        vel: new THREE.Vector3(
          Math.cos(a) * r * speed,
          up * speed * 0.7,
          Math.sin(a) * r * speed,
        ),
        life: 0.25 + Math.random() * 0.35,
        maxLife: 0.6,
        color: c.clone(),
        size: size * (0.6 + Math.random() * 0.8),
      });
    }
  }

  update(dt: number): void {
    // ---- 曳光 ----
    let n = 0;
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      if (!t) continue;
      t.life -= dt;
      if (t.life <= 0) {
        this.tracers.splice(i, 1);
        continue;
      }
      if (n < MAX_TRACERS) {
        const o = n * 6;
        this.tracerPos[o] = t.from.x;
        this.tracerPos[o + 1] = t.from.y;
        this.tracerPos[o + 2] = t.from.z;
        this.tracerPos[o + 3] = t.to.x;
        this.tracerPos[o + 4] = t.to.y;
        this.tracerPos[o + 5] = t.to.z;
        const fade = Math.min(1, t.life / CONFIG.fx.tracerLife);
        for (let k = 0; k < 2; k++) {
          this.tracerCol[o + k * 3] = t.color.r * fade;
          this.tracerCol[o + k * 3 + 1] = t.color.g * fade;
          this.tracerCol[o + k * 3 + 2] = t.color.b * fade;
        }
        n += 1;
      }
    }
    this.tracerGeom.setDrawRange(0, n * 2);
    (this.tracerGeom.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.tracerGeom.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;

    // ---- 粒子 ----
    let m = 0;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p) continue;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vel.y -= 14 * dt; // 重力
      p.pos.addScaledVector(p.vel, dt);
      if (p.pos.y < 0.03) {
        p.pos.y = 0.03;
        p.vel.y *= -0.28;
        p.vel.x *= 0.7;
        p.vel.z *= 0.7;
      }
      if (m < MAX_PARTICLES) {
        const o = m * 3;
        this.partPos[o] = p.pos.x;
        this.partPos[o + 1] = p.pos.y;
        this.partPos[o + 2] = p.pos.z;
        const fade = Math.min(1, p.life / p.maxLife);
        this.partCol[o] = p.color.r * fade;
        this.partCol[o + 1] = p.color.g * fade;
        this.partCol[o + 2] = p.color.b * fade;
        m += 1;
      }
    }
    this.partGeom.setDrawRange(0, m);
    (this.partGeom.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.partGeom.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
    (this.partGeom.getAttribute('size') as THREE.BufferAttribute).needsUpdate = true;
  }

  /** 验证接口用：特效实体数（计数型指标，无头下可比） */
  counts(): { tracers: number; particles: number } {
    return { tracers: this.tracers.length, particles: this.particles.length };
  }
}
