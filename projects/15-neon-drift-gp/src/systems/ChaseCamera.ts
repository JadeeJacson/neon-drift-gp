import * as THREE from 'three';

export class ChaseCamera {
  private readonly desired = new THREE.Vector3();
  private readonly lookAt = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly offset = new THREE.Vector3();
  private baseFov = 58;
  private currentFov = 58;
  private trauma = 0;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private lag = 4.5,
  ) {}

  snapTo(position: THREE.Vector3, heading: number): void {
    this.forward.set(Math.sin(heading), 0, Math.cos(heading));
    this.offset.copy(this.forward).multiplyScalar(-10).add(new THREE.Vector3(0, 4.2, 0));
    this.camera.position.copy(position).add(this.offset);
    this.lookAt.copy(position).addScaledVector(this.forward, 6).add(new THREE.Vector3(0, 1.2, 0));
    this.camera.lookAt(this.lookAt);
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
  }

  update(
    dt: number,
    position: THREE.Vector3,
    heading: number,
    speed: number,
    drifting: boolean,
    boostActive: boolean,
  ): void {
    const speedT = THREE.MathUtils.clamp(speed / 50, 0, 1);
    const dist = 11 + speedT * 2.5;
    const height = 4.0 + speedT * 0.8;
    // lead the car slightly more when drifting
    const lead = drifting ? 9 : 7;

    this.forward.set(Math.sin(heading), 0, Math.cos(heading));
    this.offset.copy(this.forward).multiplyScalar(-dist);
    this.offset.y = height;
    // lateral drift sway
    if (drifting) {
      const right = new THREE.Vector3(this.forward.z, 0, -this.forward.x);
      this.offset.addScaledVector(right, 1.2);
    }
    this.desired.copy(position).add(this.offset);

    const smooth = 1 - Math.exp(-this.lag * dt);
    this.camera.position.lerp(this.desired, smooth);

    this.lookAt.copy(position).addScaledVector(this.forward, lead);
    this.lookAt.y = 1.1;
    this.camera.lookAt(this.lookAt);

    const targetFov = this.baseFov + speedT * 14 + (boostActive ? 8 : 0) + (drifting ? 3 : 0);
    this.currentFov += (targetFov - this.currentFov) * (1 - Math.exp(-6 * dt));
    if (Math.abs(this.camera.fov - this.currentFov) > 0.05) {
      this.camera.fov = this.currentFov;
      this.camera.updateProjectionMatrix();
    }

    // trauma shake
    if (this.trauma > 0.001) {
      const t = this.trauma * this.trauma;
      const time = performance.now() / 1000;
      this.camera.position.x += (Math.sin(time * 47) + Math.sin(time * 31)) * 0.08 * t;
      this.camera.position.y += Math.sin(time * 39) * 0.05 * t;
      this.camera.rotation.z += Math.sin(time * 53) * 0.02 * t;
      this.trauma = Math.max(0, this.trauma - dt * 2.2);
    }
  }

  addTrauma(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }
}
