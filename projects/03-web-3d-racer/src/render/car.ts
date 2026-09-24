/**
 * 车辆视觉：从 sim 的 Vehicle 每帧更新——车身跟随 pos/quat，
 * 四轮按 mounts 固定挂点，并叠加 sim 给出的转向角与自转角（前轮转向、全轮滚动）。
 * 车型仍为程序化低多边形，但比初始方块更有识别度：前唇、尾翼、车灯、轮毂。
 */
import * as THREE from 'three';
import { CONFIG } from '../core/config';
import type { Vehicle } from '../sim/vehicle';

export class CarView {
  group = new THREE.Group();
  private wheels: THREE.Group[] = [];

  constructor(color: number) {
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.5 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0c0f14, roughness: 0.2, metalness: 0.7 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.2 });
    const lightMat = new THREE.MeshStandardMaterial({
      color: 0xffffcc, emissive: 0xffee88, emissiveIntensity: 1.5,
    });
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xff3333, emissive: 0xff0000, emissiveIntensity: 1.0,
    });

    // 主车身（低矮楔形）
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 4.2), bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;
    this.group.add(body);

    // 引擎盖（前端略低的斜面块）
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.18, 1.2), bodyMat);
    hood.position.set(0, 0.82, 1.3);
    hood.castShadow = true;
    this.group.add(hood);

    // 座舱/车顶（向后移，呈驾驶舱姿态）
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.45, 1.8), darkMat);
    cabin.position.set(0, 0.95, -0.35);
    cabin.castShadow = true;
    this.group.add(cabin);

    // 尾翼
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.5), trimMat);
    wing.position.set(0, 1.25, -2.0);
    wing.castShadow = true;
    this.group.add(wing);
    const wingPostL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), trimMat);
    wingPostL.position.set(-0.6, 1.05, -2.0);
    const wingPostR = wingPostL.clone();
    wingPostR.position.x = 0.6;
    this.group.add(wing, wingPostL, wingPostR);

    // 前唇
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.2, 0.5), trimMat);
    nose.position.set(0, 0.35, 2.15);
    this.group.add(nose);

    // 前大灯
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.05), lightMat);
    headL.position.set(-0.6, 0.6, 2.12);
    const headR = headL.clone();
    headR.position.x = 0.6;
    this.group.add(headL, headR);

    // 尾灯
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.05), tailMat);
    tailL.position.set(-0.55, 0.6, -2.12);
    const tailR = tailL.clone();
    tailR.position.x = 0.55;
    this.group.add(tailL, tailR);

    // 车轮（带轮毂）
    const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.34, 18);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 });
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.36, 8);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.8 });

    for (const m of CONFIG.vehicle.wheel.mounts) {
      const wg = new THREE.Group();
      const tire = new THREE.Mesh(tireGeo, tireMat);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wg.add(tire, rim);
      wg.position.set(m.x, m.y, m.z);
      this.wheels.push(wg);
      this.group.add(wg);
    }
  }

  update(veh: Vehicle): void {
    const p = veh.pos();
    const q = veh.quat();
    this.group.position.set(p.x, p.y, p.z);
    this.group.quaternion.set(q.x, q.y, q.z, q.w);
    const ws = veh.wheels();
    for (let i = 0; i < this.wheels.length; i++) {
      const state = ws[i];
      if (!state) continue;
      this.wheels[i]!.rotation.set(state.rotation, i < 2 ? state.steer : 0, 0, 'YXZ');
    }
  }
}
