/**
 * 漂移胎痕：手刹 + 高速时在路面上画黑痕。
 * 预分配一组小平面 mesh，环形复用，超过的覆盖最早的。
 */
import * as THREE from 'three';

const MAX_MARKS = 240;
const MARK_W = 0.35;
const MARK_L = 0.6;

export class SkidMarks {
  private group = new THREE.Group();
  private marks: THREE.Mesh[] = [];
  private idx = 0;
  private geo: THREE.PlaneGeometry;
  private mat: THREE.MeshBasicMaterial;

  constructor() {
    this.geo = new THREE.PlaneGeometry(MARK_W, MARK_L);
    this.geo.rotateX(-Math.PI / 2); // 平铺到地面
    this.mat = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    for (let i = 0; i < MAX_MARKS; i++) {
      const m = new THREE.Mesh(this.geo, this.mat);
      m.visible = false;
      m.position.y = 0.02;
      this.group.add(m);
      this.marks.push(m);
    }
  }

  get object(): THREE.Group { return this.group; }

  /** 在指定世界坐标贴一条胎痕；yaw 用于对齐方向 */
  add(x: number, z: number, yaw: number): void {
    const m = this.marks[this.idx]!;
    m.visible = true;
    m.position.set(x, 0.02, z);
    m.rotation.y = yaw;
    this.idx = (this.idx + 1) % MAX_MARKS;
  }

  clear(): void {
    for (const m of this.marks) m.visible = false;
    this.idx = 0;
  }
}
