/**
 * 敌人视觉 + 手中武器（viewmodel）。
 *
 * 敌人用「胶囊 + 头 + 面罩」程序化拼装：零资产，但轮廓要能一眼分辨三种敌人
 * （步兵蓝 / 冲锋兵红 / 狙击手紫 / 精英金），这是可读性的底线。
 */
import * as THREE from 'three';
import { CONFIG } from '../core/config';
import type { EnemyView } from '../sim/types';
import type { WeaponId } from '../core/config';

interface EnemyNode {
  group: THREE.Group;
  body: THREE.Mesh;
  head: THREE.Mesh;
  visor: THREE.Mesh;
  /**
   * 四肢：每根挂在自己的 pivot Group 上（pivot 在肩/髋，mesh 向下偏移半个长度），
   * 所以「转 pivot」就是摆臂摆腿，不需要骨骼系统。
   * 顺序固定为 [左臂, 左腿, 右臂, 右腿]。
   */
  limbs: THREE.Group[];
  /** 步行相位：由真实位移累积，走得越快摆得越快（不是凭空播动画） */
  phase: number;
  lastX: number;
  lastZ: number;
  mat: THREE.MeshStandardMaterial;
  headMat: THREE.MeshStandardMaterial;
}

export class EnemyRenderer {
  private readonly root = new THREE.Group();
  private readonly nodes = new Map<number, EnemyNode>();

  constructor(scene: THREE.Scene) {
    this.root.name = 'enemies';
    scene.add(this.root);
  }

  /**
   * 用 sim 的 EnemyView 同步（sim 是唯一真相源，渲染层不持有逻辑状态）。
   * dt 用于从位移反推移动速度，进而驱动摆臂——所以动画幅度是「真走了多快」决定的。
   */
  sync(views: EnemyView[], dt = 1 / 60): void {
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

    // 清理 sim 里已经不存在的
    for (const [id, node] of this.nodes) {
      if (seen.has(id)) continue;
      this.root.remove(node.group);
      // 四肢/肩甲/枪管都是动态加的，遍历释放比逐个列名字可靠（漏一个就泄漏）
      node.group.traverse((o) => {
        (o as THREE.Mesh).geometry?.dispose();
      });
      node.mat.dispose();
      node.headMat.dispose();
      this.nodes.delete(id);
    }
  }

  private create(v: EnemyView): EnemyNode {
    const def = CONFIG.enemies[v.kind];
    const s = v.scale;

    // 队伍决定基色（蓝队蓝 / 红队红），保证敌我一眼可辨；兵种差异交给剪影与配饰。
    const teamColor = v.team === 'blue' ? 0x3f8cff : 0xff5a4d;
    const visorColor = v.team === 'blue' ? 0x9fe8ff : 0xffd0a0;

    const mat = new THREE.MeshStandardMaterial({
      color: v.elite ? CONFIG.elite.color : teamColor,
      roughness: 0.55,
      metalness: 0.25,
      transparent: true,
      opacity: 1,
      emissive: new THREE.Color(0x000000),
    });
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x1b1f26,
      roughness: 0.4,
      metalness: 0.6,
      transparent: true,
      opacity: 1,
    });

    const group = new THREE.Group();
    const limbs: THREE.Group[] = [];
    const r = def.radius * s;
    const hh = def.halfHeight * s;

    // 躯干：略收窄、只占上半段的胶囊，下半留给腿（原来是整根胶囊，看着像个胶囊罐）
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.86, hh * 1.05, 6, 12), mat);
    body.position.y = hh * 0.42;
    // sim 的 center() 是胶囊中心，渲染直接用它
    group.add(body);

    const headR = r * 0.6;
    const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 14, 10), headMat);
    head.position.y = hh + r * 0.62;
    group.add(head);

    // 面罩：朝向指示 + 出手预警的发光点
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(headR * 1.5, headR * 0.42, headR * 0.3),
      new THREE.MeshBasicMaterial({ color: visorColor }),
    );
    visor.position.set(0, head.position.y, -headR * 0.85);
    group.add(visor);

    // 四肢：pivot 在肩/髋，mesh 在 pivot 内部向下偏移半个长度 → 转 pivot 即摆臂摆腿
    const armH = hh * 1.15;
    const legH = hh * 1.35;
    for (const side of [-1, 1] as const) {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * r * 0.92, hh * 0.92, 0);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(r * 0.34, armH, r * 0.34), mat);
      arm.position.y = -armH / 2;
      shoulder.add(arm);
      group.add(shoulder);
      limbs.push(shoulder);

      const hip = new THREE.Group();
      hip.position.set(side * r * 0.42, -hh * 0.35, 0);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(r * 0.44, legH, r * 0.44), mat);
      leg.position.y = -legH / 2;
      hip.add(leg);
      group.add(hip);
      limbs.push(hip);

      // 肩甲：让剪影从「胶囊」变成「有肩膀的机兵」
      const pad = new THREE.Mesh(new THREE.BoxGeometry(r * 0.5, r * 0.34, r * 0.62), headMat);
      pad.position.set(side * r * 0.9, hh * 0.98, 0);
      group.add(pad);
    }

    // 类型差异化：三种敌人要能在剪影上一眼分辨，不能只靠颜色
    if (v.kind === 'rusher') {
      // 冲锋兵：前倾 + 更长的腿，静态剪影就是「在冲」
      body.rotation.x = 0.16;
      for (const l of limbs) l.scale.y = 1.16;
    } else if (v.kind === 'sniper') {
      // 狙击手：扛一根长枪管——最远的威胁必须能提前认出来
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(r * 0.16, r * 0.16, hh * 2.6), headMat);
      barrel.position.set(r * 0.75, hh * 0.55, -r * 0.2);
      barrel.rotation.y = 0.12;
      group.add(barrel);
    }
    if (v.elite) {
      // 精英：胸口装甲板 + 金色，远看就知道不好惹
      const plate = new THREE.Mesh(new THREE.BoxGeometry(r * 1.1, hh * 0.5, r * 0.35), headMat);
      plate.position.set(0, hh * 0.62, -r * 0.72);
      group.add(plate);
    }

    return {
      group,
      body,
      head,
      visor,
      limbs,
      phase: 0,
      lastX: v.pos.x,
      lastZ: v.pos.z,
      mat,
      headMat,
    };
  }

  private apply(node: EnemyNode, v: EnemyView, dt: number): void {
    node.group.position.set(v.pos.x, v.pos.y, v.pos.z);
    node.group.rotation.y = v.yaw;

    // 走路摆臂：位移 → 速度 → 相位。站定就不摆、跑起来摆幅大，
    // 幅度完全由 sim 的真实移动决定，不是渲染层自己编的动画。
    const moved = Math.hypot(v.pos.x - node.lastX, v.pos.z - node.lastZ);
    node.lastX = v.pos.x;
    node.lastZ = v.pos.z;
    const speed = dt > 1e-6 ? moved / dt : 0;
    node.phase += speed * dt * 2.4;
    const amp = Math.min(1, speed / 3.2) * 0.62;
    const swing = Math.sin(node.phase) * amp;
    const [armL, legL, armR, legR] = node.limbs;
    if (armL && legL && armR && legR) {
      armL.rotation.x = swing;
      armR.rotation.x = -swing;
      legL.rotation.x = -swing;
      legR.rotation.x = swing;
    }

    // 受击闪白
    const flash = Math.min(1, v.flash / 0.12);
    node.mat.emissive.setRGB(flash * 0.9, flash * 0.75, flash * 0.75);

    // 出手预警：整体转橙 + 面罩变红，给玩家一个可读的反应窗口
    const w = v.windup;
    if (w > 0) {
      node.mat.emissive.setRGB(0.85 * w + flash * 0.9, 0.35 * w, 0.05 * w);
      (node.visor.material as THREE.MeshBasicMaterial).color.setRGB(1, 0.35 - 0.3 * w, 0.2);
    } else {
      (node.visor.material as THREE.MeshBasicMaterial).color.setRGB(1, 0.9, 0.7);
    }

    // 死亡：压扁 + 淡出
    if (!v.alive) {
      const f = Math.min(1, v.fade);
      node.group.scale.set(1 + f * 0.25, Math.max(0.05, 1 - f), 1 + f * 0.25);
      node.mat.opacity = 1 - f;
      node.headMat.opacity = 1 - f;
      node.group.rotation.z = f * 0.6;
    } else {
      node.group.scale.set(1, 1, 1);
      node.group.rotation.z = 0;
      node.mat.opacity = 1;
      node.headMat.opacity = 1;
    }
  }
}

/**
 * 手中的枪：三把武器几何各不相同，后坐力 / 换弹 / 切枪都有动作。
 * 挂在相机下，所以不受场景雾影响（雾只作用于世界物体）。
 */
export class ViewModel {
  readonly root = new THREE.Group();
  private readonly slots = new Map<WeaponId, THREE.Group>();
  private readonly muzzle: THREE.PointLight;
  private readonly muzzleFlash: THREE.Mesh;
  private flashTimer = 0;
  private bob = 0;

  constructor(camera: THREE.Camera) {
    for (const def of CONFIG.weapons) {
      const g = this.buildWeapon(def.id);
      g.visible = false;
      this.slots.set(def.id, g);
      this.root.add(g);
    }

    this.muzzle = new THREE.PointLight(0xffd08a, 0, 6, 2);
    this.muzzle.position.set(0, 0, -0.6);
    this.root.add(this.muzzle);

    this.muzzleFlash = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xfff0c0, transparent: true, opacity: 0 }),
    );
    this.muzzleFlash.position.set(0, 0, -0.62);
    this.root.add(this.muzzleFlash);

    camera.add(this.root);
  }

  private buildWeapon(id: WeaponId): THREE.Group {
    const g = new THREE.Group();
    // viewmodel 用 Lambert + emissive：金属材质在暗光下会变成纯黑剪影，
    // 哪怕 PointLight 照着、反射角不对就看不见。Lambert 受光均匀，emissive 保证基础可见。
    const metal = new THREE.MeshLambertMaterial({
      color: 0x4a525e,
      emissive: 0x2a323c,
      fog: false,
    });
    const accent = new THREE.MeshLambertMaterial({
      color: CONFIG.weapons.find((w) => w.id === id)?.color ?? 0xff6b35,
      emissive: new THREE.Color(CONFIG.weapons.find((w) => w.id === id)?.color ?? 0xff6b35).multiplyScalar(0.35),
      fog: false,
    });

    if (id === 'pistol') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.22), metal);
      body.position.set(0, 0, -0.06);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.08), metal);
      grip.position.set(0, -0.1, 0.02);
      grip.rotation.x = -0.25;
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), accent);
      tip.position.set(0, 0.01, -0.19);
      g.add(body, grip, tip);
      g.position.set(0.18, -0.18, -0.45);
      g.scale.setScalar(0.72);
    } else if (id === 'rifle') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.5), metal);
      body.position.set(0, 0, -0.16);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.09), metal);
      mag.position.set(0, -0.13, -0.06);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.14, 0.07), metal);
      grip.position.set(0, -0.11, 0.06);
      grip.rotation.x = -0.2;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.3), accent);
      rail.position.set(0, 0.08, -0.2);
      g.add(body, mag, grip, rail);
      g.position.set(0.18, -0.18, -0.42);
      g.scale.setScalar(0.72);
    } else if (id === 'smg') {
      // 紧凑短枪身 + 鼓形弹匣：一眼区别于步枪的修长轮廓
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.1, 0.3), metal);
      body.position.set(0, 0, -0.09);
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.055, 12), metal);
      drum.rotation.z = Math.PI / 2;
      drum.position.set(0, -0.11, -0.04);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.07), metal);
      grip.position.set(0, -0.1, 0.06);
      grip.rotation.x = -0.22;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.16, 8), metal);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.015, -0.3);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.028, 0.2), accent);
      rail.position.set(0, 0.07, -0.12);
      g.add(body, drum, grip, barrel, rail);
      g.position.set(0.18, -0.18, -0.42);
      g.scale.setScalar(0.72);
    } else if (id === 'dmr') {
      // 长枪管 + 瞄准镜 + 枪托：最长的轮廓，配合最低射速形成视觉暗示
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.5), metal);
      body.position.set(0, 0, -0.14);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 8), metal);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.01, -0.52);
      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.2, 10), accent);
      scope.rotation.x = Math.PI / 2;
      scope.position.set(0, 0.11, -0.16);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.1, 0.18), metal);
      stock.position.set(0, -0.02, 0.2);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.07), metal);
      grip.position.set(0, -0.1, 0.06);
      grip.rotation.x = -0.18;
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.08), metal);
      mag.position.set(0, -0.1, -0.08);
      g.add(body, barrel, scope, stock, grip, mag);
      g.position.set(0.18, -0.18, -0.38);
      g.scale.setScalar(0.72);
    } else {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.42), metal);
      body.position.set(0, 0, -0.14);
      const barrelA = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.36, 8), metal);
      barrelA.rotation.x = Math.PI / 2;
      barrelA.position.set(-0.028, 0.02, -0.3);
      const barrelB = barrelA.clone();
      barrelB.position.x = 0.028;
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.08), metal);
      grip.position.set(0, -0.11, 0.05);
      grip.rotation.x = -0.2;
      const shell = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.06), accent);
      shell.position.set(0, -0.02, 0.02);
      g.add(body, barrelA, barrelB, grip, shell);
      g.position.set(0.18, -0.18, -0.42);
      g.scale.setScalar(0.72);
    }
    return g;
  }

  /** 开火：枪口火光 + 后坐位移 */
  flash(): void {
    this.flashTimer = 0.055;
  }

  update(
    dt: number,
    weapon: WeaponId,
    recoilPitch: number,
    reloading: boolean,
    reloadProgress: number,
    switching: boolean,
    moving: boolean,
    sprint: boolean,
  ): void {
    for (const [id, g] of this.slots) g.visible = id === weapon;
    const g = this.slots.get(weapon);

    // 走路摆动
    this.bob += dt * (sprint ? 13 : 8.5);
    const amp = moving ? (sprint ? 0.022 : 0.012) : 0.004;
    const bobX = Math.sin(this.bob) * amp;
    const bobY = Math.abs(Math.cos(this.bob)) * amp * 0.8;

    // 后坐力：向后 + 上抬
    const kick = Math.min(0.16, recoilPitch * 2.6);
    // 换弹：下沉并侧转
    const reloadDip = reloading ? Math.sin(reloadProgress * Math.PI) : 0;
    // 切枪：从下方抬起
    const switchDip = switching ? 0.22 : 0;

    if (g) {
      const base = g.userData.baseY ?? (g.userData.baseY = g.position.y);
      g.position.x = (g.userData.baseX ?? (g.userData.baseX = g.position.x)) + bobX;
      g.position.y = base + bobY - reloadDip * 0.16 - switchDip;
      g.position.z = (g.userData.baseZ ?? (g.userData.baseZ = g.position.z)) + kick * 0.5;
      g.rotation.x = -kick * 1.6 + reloadDip * 0.5;
      g.rotation.z = reloadDip * 0.45;
    }

    // 枪口火光
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      const t = Math.max(0, this.flashTimer / 0.055);
      this.muzzle.intensity = 14 * t;
      (this.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = t;
      const s = 0.7 + t * 0.9;
      this.muzzleFlash.scale.setScalar(s);
    } else {
      this.muzzle.intensity = 0;
      (this.muzzleFlash.material as THREE.MeshBasicMaterial).opacity = 0;
    }
  }
}
