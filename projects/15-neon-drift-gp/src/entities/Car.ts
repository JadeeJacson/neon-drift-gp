import * as THREE from 'three';
import type { Track } from './Track';

export type CarControls = {
  throttle: number; // -1..1
  steer: number; // -1..1 (positive = right)
  brake: boolean;
  drift: boolean;
  boost: boolean;
};

export type CarTuning = {
  accel: number;
  maxSpeed: number;
  boostSpeed: number;
  reverseSpeed: number;
  steerRate: number;
  grip: number;
  driftGrip: number;
  brakeForce: number;
  drag: number;
  boostDrain: number;
};

export const DEFAULT_CAR_TUNING: CarTuning = {
  accel: 28,
  maxSpeed: 42,
  boostSpeed: 58,
  reverseSpeed: 12,
  steerRate: 2.4,
  grip: 9.5,
  driftGrip: 2.2,
  brakeForce: 40,
  drag: 0.4,
  boostDrain: 0.35,
};

export type CarPaint = {
  body: string;
  accent: string;
  emissive: string;
  name: string;
};

export const PLAYER_PAINT: CarPaint = {
  body: '#ff2d95',
  accent: '#2dfff3',
  emissive: '#ff2d95',
  name: 'YOU',
};

export class Car {
  readonly group = new THREE.Group();
  readonly controls: CarControls = {
    throttle: 0,
    steer: 0,
    brake: false,
    drift: false,
    boost: false,
  };

  position = new THREE.Vector3();
  heading = 0; // radians, forward = (sin, 0, cos)
  velocity = new THREE.Vector3();
  speed = 0;
  lateralSpeed = 0;
  boost = 0.5;
  driftCharge = 0;
  drifting = false;
  trackU = 0;
  unwrappedProgress = 0;
  lap = 0;
  lapTime = 0;
  bestLap = 0;
  lastLap = 0;
  finished = false;
  onRoad = true;
  collisionFlash = 0;
  readonly isPlayer: boolean;
  readonly paint: CarPaint;
  readonly index: number;
  readonly radius = 1.4;

  private prevTrackU = 0;
  private readonly localOffset = new THREE.Vector3();
  private visualYaw = 0;
  private readonly wheels: THREE.Object3D[] = [];

  constructor(
    readonly track: Track,
    index: number,
    paint: CarPaint,
    isPlayer: boolean,
    private tuning: CarTuning = { ...DEFAULT_CAR_TUNING },
  ) {
    this.index = index;
    this.isPlayer = isPlayer;
    this.paint = paint;
    this.group.add(this.buildMesh());
    this.gridReset();
  }

  private buildMesh(): THREE.Group {
    const root = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: this.paint.body,
      roughness: 0.35,
      metalness: 0.45,
      emissive: this.paint.emissive,
      emissiveIntensity: 0.15,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: this.paint.accent,
      roughness: 0.3,
      metalness: 0.5,
      emissive: this.paint.accent,
      emissiveIntensity: 0.55,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: '#14081f',
      roughness: 0.7,
      metalness: 0.2,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: '#88f7ff',
      roughness: 0.1,
      metalness: 0.6,
      transparent: true,
      opacity: 0.75,
      emissive: '#2dfff3',
      emissiveIntensity: 0.25,
    });

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.45, 3.4), bodyMat);
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    root.add(chassis);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 1.1), bodyMat);
    nose.position.set(0, 0.52, -1.7);
    nose.castShadow = true;
    root.add(nose);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.45, 1.5), glassMat);
    cabin.position.set(0, 1.0, 0.15);
    cabin.castShadow = true;
    root.add(cabin);

    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 0.35), accentMat);
    spoiler.position.set(0, 1.05, 1.55);
    root.add(spoiler);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 3.2), accentMat);
    stripe.position.set(0, 0.79, 0);
    root.add(stripe);

    const exhaustGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.35, 8);
    for (const x of [-0.45, 0.45]) {
      const exhaust = new THREE.Mesh(exhaustGeo, darkMat);
      exhaust.rotation.x = Math.PI / 2;
      exhaust.position.set(x, 0.5, 1.75);
      root.add(exhaust);
    }

    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 12);
    const wheelPositions: [number, number][] = [
      [-0.9, -1.15],
      [0.9, -1.15],
      [-0.9, 1.15],
      [0.9, 1.15],
    ];
    for (const [x, z] of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, darkMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.38, z);
      wheel.castShadow = true;
      this.wheels.push(wheel);
      root.add(wheel);
    }

    // pop-art outline shell (slightly larger, backface)
    const outline = new THREE.Mesh(
      new THREE.BoxGeometry(1.85, 0.55, 3.55),
      new THREE.MeshBasicMaterial({
        color: '#0a0412',
        side: THREE.BackSide,
      }),
    );
    outline.position.y = 0.55;
    root.add(outline);

    // underglow
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 3.5),
      new THREE.MeshBasicMaterial({
        color: this.paint.accent,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.08;
    root.add(glow);

    return root;
  }

  gridReset(): void {
    const spawn = this.track.spawnGrid(this.index);
    this.position.copy(spawn.position);
    this.position.y = 0;
    this.heading = spawn.heading;
    this.velocity.set(0, 0, 0);
    this.speed = 0;
    this.lateralSpeed = 0;
    this.boost = 0.55;
    this.driftCharge = 0;
    this.drifting = false;
    this.lap = 0;
    this.lapTime = 0;
    this.lastLap = 0;
    this.bestLap = 0;
    this.finished = false;
    this.collisionFlash = 0;
    const close = this.track.findClosestU(this.position);
    this.trackU = close.u;
    this.prevTrackU = close.u;
    this.unwrappedProgress = close.u;
    this.syncTransform(0);
  }

  resetProgress(): void {
    this.gridReset();
  }

  update(dt: number, raceActive: boolean): void {
    if (!raceActive || this.finished) {
      this.controls.throttle *= Math.max(0, 1 - dt * 4);
      this.controls.boost = false;
      this.controls.drift = false;
    }

    this.applyControls(dt);
    this.integrate(dt);
    this.constrainToTrack();
    this.updateProgress(dt);
    this.syncTransform(dt);
    this.collisionFlash = Math.max(0, this.collisionFlash - dt * 3);
  }

  private applyControls(dt: number): void {
    const t = this.tuning;
    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);

    const speedAlong = this.velocity.dot(forward);
    this.speed = this.velocity.length();
    this.lateralSpeed = this.velocity.dot(right);

    // boost
    const boosting = this.controls.boost && this.boost > 0.02 && this.controls.throttle > 0.1;
    if (boosting) {
      this.boost = Math.max(0, this.boost - t.boostDrain * dt);
    }

    // accelerate / brake / reverse
    let targetMax = t.maxSpeed;
    if (boosting) targetMax = t.boostSpeed;
    if (this.controls.throttle > 0) {
      const accelScale = speedAlong < targetMax ? t.accel * this.controls.throttle : 0;
      this.velocity.addScaledVector(forward, accelScale * dt);
      if (speedAlong > targetMax) {
        const excess = speedAlong - targetMax;
        this.velocity.addScaledVector(forward, -Math.min(excess, 20 * dt));
      }
    } else if (this.controls.throttle < 0) {
      if (speedAlong > 1) {
        this.velocity.addScaledVector(forward, -t.brakeForce * dt);
      } else {
        this.velocity.addScaledVector(forward, t.reverseSpeed * this.controls.throttle * dt);
      }
    }
    if (this.controls.brake && speedAlong > 0) {
      this.velocity.addScaledVector(forward, -t.brakeForce * dt);
    }

    // steering (speed-sensitive)
    // Camera looks along +forward; screen-right is -X at heading 0, so positive
    // steer must DECREASE heading to turn right (fixes inverted left/right).
    const steerAuthority = THREE.MathUtils.clamp(Math.abs(speedAlong) / 8, 0.15, 1);
    const reverseSign = speedAlong < -0.5 ? -1 : 1;
    const driftBoostSteer = this.drifting ? 1.35 : 1;
    this.heading -= this.controls.steer * t.steerRate * steerAuthority * reverseSign * driftBoostSteer * dt;

    // grip: split into forward / lateral
    const grip = this.controls.drift && Math.abs(speedAlong) > 12 ? t.driftGrip : t.grip;
    const latDecay = Math.exp(-grip * dt);
    this.velocity.addScaledVector(right, -this.lateralSpeed * (1 - latDecay));

    // drift state + charge
    const wasDrifting = this.drifting;
    this.drifting =
      this.controls.drift &&
      Math.abs(speedAlong) > 14 &&
      Math.abs(this.lateralSpeed) > 4 &&
      Math.abs(this.controls.steer) > 0.15;
    if (this.drifting) {
      this.driftCharge = Math.min(1, this.driftCharge + dt * 0.35);
      this.boost = Math.min(1, this.boost + dt * 0.22);
      this.velocity.addScaledVector(right, this.controls.steer * 6 * dt);
      if (!wasDrifting && this.isPlayer) {
        // entry tick — juice via slight speed hold
        this.velocity.multiplyScalar(1.01);
      }
    } else {
      this.driftCharge = Math.max(0, this.driftCharge - dt * 0.15);
    }

    // drag + clamp
    const dragFactor = Math.exp(-t.drag * dt);
    this.velocity.x *= dragFactor;
    this.velocity.z *= dragFactor;
    const maxNow = boosting ? t.boostSpeed : t.maxSpeed;
    const flatSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (flatSpeed > maxNow + 2) {
      const s = (maxNow + 2) / flatSpeed;
      this.velocity.x *= s;
      this.velocity.z *= s;
    }
  }

  private integrate(dt: number): void {
    this.position.addScaledVector(this.velocity, dt);
    this.position.y = 0;
  }

  private constrainToTrack(): void {
    const { u, lateral } = this.track.findClosestU(this.position, this.trackU);
    this.trackU = u;
    const limit = this.track.roadHalfWidth + 2.5;
    if (Math.abs(lateral) > limit) {
      this.onRoad = false;
      const s = this.track.getSample(Math.floor(u * 400));
      const clamped = THREE.MathUtils.clamp(lateral, -limit, limit);
      this.position.copy(s.position).addScaledVector(s.right, clamped);
      // scrape wall
      const speed = this.velocity.length();
      if (speed > 8) {
        this.velocity.multiplyScalar(0.72);
        this.collisionFlash = 1;
      } else {
        this.velocity.multiplyScalar(0.85);
      }
    } else {
      this.onRoad = Math.abs(lateral) <= this.track.roadHalfWidth;
      if (!this.onRoad) {
        // grass / runoff: heavy drag
        this.velocity.multiplyScalar(Math.exp(-1.8 * 0.016));
      }
    }

    // boost pads
    for (const padU of this.track.getBoostPadUs()) {
      let du = Math.abs(u - padU);
      if (du > 0.5) du = 1 - du;
      if (du < 0.008 && this.onRoad) {
        this.boost = Math.min(1, this.boost + 0.45);
        const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
        this.velocity.addScaledVector(forward, 8);
        break;
      }
    }
  }

  private updateProgress(dt: number): void {
    this.lapTime += dt;
    let delta = this.trackU - this.prevTrackU;
    if (delta > 0.5) delta -= 1;
    if (delta < -0.5) delta += 1;
    this.unwrappedProgress += delta;
    this.prevTrackU = this.trackU;

    // lap when crossing 0
    if (delta > 0 && this.trackU < 0.08 && this.prevTrackU > 0.92) {
      // handled by unwrapped integer below
    }
    const lapsCompleted = Math.floor(this.unwrappedProgress);
    if (lapsCompleted > this.lap) {
      this.lastLap = this.lapTime;
      if (this.bestLap === 0 || this.lastLap < this.bestLap) this.bestLap = this.lastLap;
      this.lap = lapsCompleted;
      this.lapTime = this.lapTime - this.lastLap;
    }
    // prevent backwards lap cheese
    if (this.unwrappedProgress < this.lap) {
      this.unwrappedProgress = this.lap;
    }
  }

  private syncTransform(dt: number): void {
    const desiredYaw = this.heading;
    const speedFactor = Math.min(1, this.speed / 30);
    const targetVisual = desiredYaw + (this.drifting ? -this.controls.steer * 0.35 : 0);
    const blend = dt > 0 ? 1 - Math.exp(-10 * dt) : 1;
    this.visualYaw += shortAngle(this.visualYaw, targetVisual) * blend;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.visualYaw;

    // body lean (positive steer = screen right → bank right)
    const lean = THREE.MathUtils.clamp(this.controls.steer * speedFactor * (this.drifting ? 0.2 : 0.1), -0.2, 0.2);
    this.group.rotation.z = THREE.MathUtils.lerp(this.group.rotation.z, lean, dt > 0 ? 0.15 : 1);

    const spin = this.speed * dt * 2.5;
    for (const wheel of this.wheels) {
      wheel.rotation.x -= spin;
    }

    // flash tint
    const mats = this.collectBodyMaterials();
    for (const m of mats) {
      m.emissiveIntensity = 0.15 + this.collisionFlash * 1.5 + (this.drifting ? 0.25 : 0);
    }
    void this.localOffset;
  }

  private bodyMats: THREE.MeshStandardMaterial[] | null = null;

  private collectBodyMaterials(): THREE.MeshStandardMaterial[] {
    if (this.bodyMats) return this.bodyMats;
    const mats: THREE.MeshStandardMaterial[] = [];
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
        if (obj.material.color.getHexString() === new THREE.Color(this.paint.body).getHexString()) {
          mats.push(obj.material);
        }
      }
    });
    this.bodyMats = mats;
    return mats;
  }

  /** Circle-circle separation used by RaceSystem. */
  resolveCarCollision(other: Car): void {
    const dx = this.position.x - other.position.x;
    const dz = this.position.z - other.position.z;
    const dist = Math.hypot(dx, dz);
    const minDist = this.radius + other.radius;
    if (dist <= 0.001 || dist >= minDist) return;
    const nx = dx / dist;
    const nz = dz / dist;
    const overlap = minDist - dist;
    this.position.x += nx * overlap * 0.5;
    this.position.z += nz * overlap * 0.5;
    other.position.x -= nx * overlap * 0.5;
    other.position.z -= nz * overlap * 0.5;
    // transfer a bit of speed — arcade bump
    const rel = new THREE.Vector3(this.velocity.x - other.velocity.x, 0, this.velocity.z - other.velocity.z);
    const approach = rel.x * nx + rel.z * nz;
    if (approach < 0) {
      const impulse = -approach * 0.55;
      this.velocity.x += nx * impulse;
      this.velocity.z += nz * impulse;
      other.velocity.x -= nx * impulse;
      other.velocity.z -= nz * impulse;
      this.collisionFlash = Math.max(this.collisionFlash, 0.8);
      other.collisionFlash = Math.max(other.collisionFlash, 0.8);
    }
  }

  setTuning(tuning: CarTuning): void {
    this.tuning = tuning;
  }

  getForward(): THREE.Vector3 {
    return new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
  }
}

function shortAngle(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
