/**
 * 方块人渲染（我的世界风）+ 第一人称双手。
 *
 * 方块人：头/躯干/双臂/双腿都是 Box，四肢各挂在自己的 pivot Group 上
 * （pivot 在肩/髋，mesh 向下偏移半个长度）——「转 pivot」就是摆臂摆腿，不需要骨骼系统。
 * 跑步动画相位由真实位移驱动（走得越快摆得越快，不是凭空播动画）。
 *
 * 第一人称双手：挂在相机下，让玩家「看见自己的身体」，缓解第一人称看不到脚的问题。
 */
import * as THREE from 'three';
import type { ActorView } from '../sim/types';

interface BlockNode {
  group: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  torso: THREE.Mesh;
  phase: number;
  lastX: number;
  lastZ: number;
}

const SKIN = 0xe0b48a;
const PANTS = 0x2b3a55;

function makeMats(role: ActorView['role'], team: ActorView['team']): {
  skin: THREE.Material;
  jersey: THREE.Material;
  pants: THREE.Material;
} {
  // 守门员用黄色球衣区分；前锋用队伍色
  const jerseyColor = role === 'keeper' ? 0xffd23f : team === 'blue' ? 0x3f8cff : 0xff5a4d;
  return {
    skin: new THREE.MeshLambertMaterial({ color: SKIN }),
    jersey: new THREE.MeshLambertMaterial({ color: jerseyColor }),
    pants: new THREE.MeshLambertMaterial({ color: PANTS }),
  };
}

export class ActorRenderer {
  private readonly root = new THREE.Group();
  private readonly nodes = new Map<number, BlockNode>();

  constructor(scene: THREE.Scene) {
    this.root.name = 'actors';
    scene.add(this.root);
  }

  sync(views: ActorView[], dt = 1 / 60): void {
    const seen = new Set<number>();
    for (const v of views) {
      seen.add(v.id);
      let node = this.nodes.get(v.id);
      if (!node) {
        node = this.create(v);
        this.nodes.set(v.id, node);
        this.root.add(node.group);
      }
      this.apply(node, v, dt);
    }
    for (const [id, node] of this.nodes) {
      if (seen.has(id)) continue;
      this.root.remove(node.group);
      node.group.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      this.nodes.delete(id);
    }
  }

  /** 调试/验证：模型原点（脚底）的世界 y —— 站地时应 ≈ 0 */
  worldFeetY(id: number): number {
    const node = this.nodes.get(id);
    if (!node) return NaN;
    node.group.updateWorldMatrix(true, false);
    return node.group.matrixWorld.elements[13];
  }

  private create(v: ActorView): BlockNode {
    const mats = makeMats(v.role, v.team);
    const group = new THREE.Group();

    const legH = 0.72;
    const legW = 0.22;
    const bodyH = 0.62;
    const bodyW = 0.52;
    const bodyD = 0.3;
    const armH = 0.62;
    const armW = 0.2;
    const headS = 0.46;

    const hipY = legH;
    const shoulderY = hipY + bodyH;

    // 躯干
    const torso = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), mats.jersey);
    torso.position.y = hipY + bodyH / 2;
    group.add(torso);

    // 头
    const head = new THREE.Mesh(new THREE.BoxGeometry(headS, headS, headS), mats.skin);
    head.position.y = shoulderY + headS / 2;
    group.add(head);

    // 脸（朝向 -Z）
    const face = new THREE.Mesh(
      new THREE.BoxGeometry(headS * 0.7, headS * 0.28, headS * 0.06),
      new THREE.MeshBasicMaterial({ color: 0x1b1f26 }),
    );
    face.position.set(0, head.position.y + 0.02, -headS / 2 - 0.01);
    group.add(face);

    const mkLimb = (
      w: number,
      h: number,
      mat: THREE.Material,
      px: number,
      py: number,
    ): THREE.Group => {
      const pivot = new THREE.Group();
      pivot.position.set(px, py, 0);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat);
      mesh.position.y = -h / 2;
      pivot.add(mesh);
      group.add(pivot);
      return pivot;
    };

    const armL = mkLimb(armW, armH, mats.skin, -bodyW / 2 - armW / 2, shoulderY - 0.04);
    const armR = mkLimb(armW, armH, mats.skin, bodyW / 2 + armW / 2, shoulderY - 0.04);
    const legL = mkLimb(legW, legH, mats.pants, -legW * 0.55, hipY);
    const legR = mkLimb(legW, legH, mats.pants, legW * 0.55, hipY);

    return { group, armL, armR, legL, legR, torso, phase: 0, lastX: v.pos.x, lastZ: v.pos.z };
  }

  private apply(node: BlockNode, v: ActorView, dt: number): void {
    // 模型原点在脚底；v.pos 是胶囊中心（站立时 y ≈ halfHeight+radius ≈ 0.95m），
    // 直接用会把整个人抬到半空 —— 必须用 footY
    node.group.position.set(v.pos.x, v.footY, v.pos.z);
    node.group.rotation.y = v.yaw;

    // 位移 → 速度 → 摆臂相位
    const moved = Math.hypot(v.pos.x - node.lastX, v.pos.z - node.lastZ);
    node.lastX = v.pos.x;
    node.lastZ = v.pos.z;
    const speed = dt > 1e-6 ? moved / dt : 0;
    node.phase += speed * dt * 3.2;
    const amp = Math.min(1, speed / 3.0) * 0.7;
    const swing = Math.sin(node.phase) * amp;

    node.armL.rotation.x = swing;
    node.armR.rotation.x = -swing;
    node.legL.rotation.x = -swing;
    node.legR.rotation.x = swing;

    // 踢球：右腿前摆 + 躯干前倾。
    // 符号约定：模型面朝 -Z，肢体挂在 pivot 上向下垂（局部 -Y），
    // rotation.x 为正 = 向前摆（-Z 方向），为负 = 向后摆。
    // 最初写成负号，踢腿看起来是「向后踢」。
    const t = Math.max(0, Math.min(1, v.kickAnim / 0.35));
    if (t > 0) {
      node.legR.rotation.x = 1.3 * t;
      node.legL.rotation.x = -0.35 * t; // 支撑腿微向后
      node.armL.rotation.x = 0.5 * t; // 对侧臂前摆维持平衡
      node.torso.rotation.x = -0.12 * t; // 上身微前倾
    } else {
      node.torso.rotation.x = 0;
    }
  }
}

/** 第一人称双手：挂在相机下，踢球时前摆 */
export class ViewHands {
  readonly root = new THREE.Group();
  private readonly armL: THREE.Group;
  private readonly armR: THREE.Group;
  private bob = 0;

  constructor(camera: THREE.Camera) {
    const skin = new THREE.MeshLambertMaterial({ color: SKIN, emissive: 0x3a2a1c });
    const sleeve = new THREE.MeshLambertMaterial({ color: 0x3f8cff, emissive: 0x0d2040 });

    const mk = (side: -1 | 1): THREE.Group => {
      const g = new THREE.Group();
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.4), sleeve);
      arm.position.z = -0.2;
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), skin);
      hand.position.z = -0.44;
      g.add(arm, hand);
      g.position.set(side * 0.24, -0.28, -0.05);
      g.rotation.x = -0.15;
      g.rotation.y = side * 0.12;
      return g;
    };

    this.armL = mk(-1);
    this.armR = mk(1);
    this.root.add(this.armL, this.armR);
    camera.add(this.root);
  }

  update(dt: number, moving: boolean, sprint: boolean, charge: number, kickAnim: number): void {
    this.bob += dt * (sprint ? 13 : 8.5);
    const amp = moving ? (sprint ? 0.02 : 0.011) : 0.004;
    const bobX = Math.sin(this.bob) * amp;
    const bobY = Math.abs(Math.cos(this.bob)) * amp * 0.8;

    // 蓄力：双臂后收；踢球：前摆
    const back = charge * 0.28;
    const swing = Math.max(0, Math.min(1, kickAnim / 0.3));
    const fwd = swing * 0.5;

    for (const [arm, side] of [[this.armL, -1], [this.armR, 1]] as const) {
      arm.position.x = side * 0.24 + bobX;
      arm.position.y = -0.28 + bobY;
      arm.rotation.x = -0.15 + back - fwd;
    }
  }
}
