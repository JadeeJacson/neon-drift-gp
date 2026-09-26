/**
 * 人物视觉 + 第一人称 viewmodel。
 *
 * 人物：在 04 的「胶囊 + 头 + 四肢摆动」骨架上移植 043 character.js 的装备细节 ——
 * 带檐头盔 / 分队头带 / 战术背心 + 弹匣包 / 双手持枪 / 冲锋兵近战刃。
 * 步行摆动仍由 sim 的真实位移驱动（走得越快摆得越快）。
 *
 * viewmodel：移植 043 viewmodel.js 的做法 ——
 *   5 把枪各自独立建模 + 双手（手套 + 袖管）+ 换弹三段动画（下沉 / 抖动 / 拉栓）
 *   + 抽枪动画 + 开镜位置过渡 + 呼吸 sway。挂相机下，不受场景雾影响。
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

    // 队伍决定基色（蓝队蓝 / 红队红）；分队头带用亮色区分（043 的 bandana/goggles 思路）
    const teamColor = v.team === 'blue' ? 0x3f8cff : 0xff5a4d;
    const bandColor = v.team === 'blue' ? 0x9fe8ff : 0xffd0a0;

    const mat = new THREE.MeshStandardMaterial({
      color: v.elite ? CONFIG.elite.color : teamColor,
      roughness: 0.55,
      metalness: 0.25,
      transparent: true,
      opacity: 1,
      emissive: new THREE.Color(0x000000),
    });
    const gearMat = new THREE.MeshStandardMaterial({
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

    // 躯干：略收窄、只占上半段的胶囊，下半留给腿
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.86, hh * 1.05, 6, 12), mat);
    body.position.y = hh * 0.42;
    group.add(body);

    const headR = r * 0.6;
    const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 14, 10), gearMat);
    head.position.y = hh + r * 0.62;
    group.add(head);

    // 面罩：朝向指示 + 出手预警的发光点
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(headR * 1.5, headR * 0.42, headR * 0.3),
      new THREE.MeshBasicMaterial({ color: bandColor }),
    );
    visor.position.set(0, head.position.y, -headR * 0.85);
    group.add(visor);

    // ---- 043 装备细节 ----
    // 带檐头盔（半球 + 前檐）
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(headR * 1.16, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
      gearMat,
    );
    helmet.position.y = head.position.y + r * 0.05;
    group.add(helmet);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(headR * 1.7, headR * 0.14, headR * 0.6), gearMat);
    brim.position.set(0, head.position.y + headR * 0.42, -headR * 1.05);
    group.add(brim);
    // 分队头带（头盔下缘一圈的亮色条）
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(headR * 1.17, headR * 1.17, headR * 0.22, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: bandColor }),
    );
    band.position.y = head.position.y + headR * 0.18;
    group.add(band);
    // 战术背心 + 双弹匣包
    const vest = new THREE.Mesh(new THREE.BoxGeometry(r * 1.6, hh * 0.52, r * 1.05), gearMat);
    vest.position.set(0, hh * 0.5, 0);
    group.add(vest);
    for (const px of [-r * 0.32, r * 0.32]) {
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(r * 0.34, hh * 0.3, r * 0.2), gearMat);
      pouch.position.set(px, hh * 0.36, -r * 0.62);
      group.add(pouch);
    }

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
      const pad = new THREE.Mesh(new THREE.BoxGeometry(r * 0.5, r * 0.34, r * 0.62), gearMat);
      pad.position.set(side * r * 0.9, hh * 0.98, 0);
      group.add(pad);
    }

    // 类型差异化：剪影一眼分辨兵种
    if (v.kind === 'rusher') {
      // 冲锋兵：前倾 + 长腿 + 近战刃（melee 不持枪）
      body.rotation.x = 0.16;
      for (const l of limbs) l.scale.y = 1.16;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(r * 0.1, r * 0.1, hh * 1.05), gearMat);
      blade.position.set(r * 0.78, hh * 0.62, -r * 0.55);
      group.add(blade);
    } else {
      // 步兵 / 狙击手 / 精英：双手持枪（枪身 + 弹匣 + 枪管；狙击手的枪管最长）
      const gunLen = v.kind === 'sniper' ? hh * 2.3 : hh * 1.15;
      const gunBody = new THREE.Mesh(new THREE.BoxGeometry(r * 0.16, r * 0.24, gunLen), gearMat);
      gunBody.position.set(r * 0.72, hh * 0.6, -(gunLen / 2) - r * 0.3);
      const gunMag = new THREE.Mesh(new THREE.BoxGeometry(r * 0.12, r * 0.3, r * 0.14), gearMat);
      gunMag.position.set(r * 0.72, hh * 0.42, -r * 0.45);
      group.add(gunBody, gunMag);
      if (v.kind === 'sniper') {
        const scope = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.08, r * 0.08, r * 0.5, 8), gearMat);
        scope.rotation.x = Math.PI / 2;
        scope.position.set(r * 0.72, hh * 0.78, -r * 0.9);
        group.add(scope);
      }
    }
    if (v.elite) {
      // 精英：胸口装甲板 + 金色，远看就知道不好惹
      const plate = new THREE.Mesh(new THREE.BoxGeometry(r * 1.1, hh * 0.5, r * 0.35), gearMat);
      plate.position.set(0, hh * 0.62, -r * 0.72);
      group.add(plate);
    }

    // 阴影投射
    group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true;
    });

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
      headMat: gearMat,
    };
  }

  private apply(node: EnemyNode, v: EnemyView, dt: number): void {
    node.group.position.set(v.pos.x, v.pos.y, v.pos.z);
    node.group.rotation.y = v.yaw;

    // 走路摆臂：位移 → 速度 → 相位。站定就不摆、跑起来摆幅大
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
 * 第一人称 viewmodel（043 移植版）：5 把枪独立建模 + 双手 + 三段换弹动画。
 * 挂在相机下，不受场景雾影响。
 */
export class ViewModel {
  readonly root = new THREE.Group();
  private readonly slots = new Map<WeaponId, THREE.Group>();
  /** 每把枪的开镜位置（腰射位 → 镜位） */
  private readonly adsPos = new Map<WeaponId, THREE.Vector3>();
  private readonly muzzle: THREE.PointLight;
  private readonly muzzleFlash: THREE.Mesh;
  private flashTimer = 0;
  private bob = 0;
  private breath = 0;
  private adsBlend = 0;

  constructor(camera: THREE.Camera) {
    for (const def of CONFIG.weapons) {
      const g = this.buildWeapon(def.id);
      g.visible = false;
      this.slots.set(def.id, g);
      this.root.add(g);
      // 开镜位：枪收到屏幕中下方（AWM 镜位更正）
      const hip = g.position.clone();
      this.adsPos.set(def.id, new THREE.Vector3(def.adsFov ? 0.02 : 0.0, hip.y + 0.045, hip.z + 0.1));
      g.userData.hip = hip;
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

  /** 通用小件：手套 / 袖管（043 的 addArms 思路：双手入镜才有「我在持枪」的感觉） */
  private addArm(g: THREE.Group, x: number, y: number, z: number, rx: number, sleeveColor: number): void {
    const sleeve = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.055, 0.2),
      new THREE.MeshLambertMaterial({ color: sleeveColor, emissive: new THREE.Color(sleeveColor).multiplyScalar(0.2), fog: false }),
    );
    sleeve.position.set(x, y, z);
    sleeve.rotation.x = rx;
    const glove = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.07),
      new THREE.MeshLambertMaterial({ color: 0x23282f, emissive: 0x10141a, fog: false }),
    );
    glove.position.set(x, y + 0.005, z - 0.12);
    glove.rotation.x = rx;
    g.add(sleeve, glove);
  }

  private buildWeapon(id: WeaponId): THREE.Group {
    const g = new THREE.Group();
    const def = CONFIG.weapons.find((w) => w.id === id);
    // viewmodel 用 Lambert + emissive：金属材质在暗光下会变成纯黑剪影
    const metal = new THREE.MeshLambertMaterial({ color: 0x3a4149, emissive: 0x22282e, fog: false });
    const dark = new THREE.MeshLambertMaterial({ color: 0x24292f, emissive: 0x14181d, fog: false });
    const wood = new THREE.MeshLambertMaterial({ color: 0x6e4526, emissive: 0x2a1a0e, fog: false });
    const accent = new THREE.MeshLambertMaterial({
      color: def?.color ?? 0xff6b35,
      emissive: new THREE.Color(def?.color ?? 0xff6b35).multiplyScalar(0.3),
      fog: false,
    });

    // 双手：左手护前托 / 右手握把（袖色随枪的强调色微调，增强「换枪感」）
    this.addArm(g, 0.1, -0.1, -0.1, -0.5, 0x3d4a3a);
    this.addArm(g, 0.12, -0.12, 0.08, -0.35, 0x3d4a3a);

    if (id === 'deagle') {
      // 沙鹰： oversized 手枪，粗套筒 + 大握把
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.11, 0.26), metal);
      body.position.set(0, 0, -0.08);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.17, 0.09), dark);
      grip.position.set(0, -0.12, 0.03);
      grip.rotation.x = -0.28;
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.024, 0.18), accent);
      vent.position.set(0, 0.062, -0.09);
      g.add(body, grip, vent);
      g.position.set(0.19, -0.19, -0.44);
      g.scale.setScalar(0.78);
    } else if (id === 'ak47') {
      // AK：木护木 / 木枪托 + 大弯匣（用两段斜盒近似弯度）
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.34), metal);
      body.position.set(0, 0, -0.14);
      const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.14), wood);
      handguard.position.set(0, -0.008, -0.34);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.2), wood);
      stock.position.set(0, -0.02, 0.16);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.2, 0.09), dark);
      mag.position.set(0, -0.14, -0.04);
      mag.rotation.x = 0.35;
      const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8), metal);
      gasTube.rotation.x = Math.PI / 2;
      gasTube.position.set(0, 0.045, -0.3);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.07), wood);
      grip.position.set(0, -0.1, 0.08);
      grip.rotation.x = -0.25;
      g.add(body, handguard, stock, mag, gasTube, grip);
      g.position.set(0.18, -0.19, -0.4);
      g.scale.setScalar(0.78);
    } else if (id === 'm4a1') {
      // M4：直匣 + 提把 / 导轨 + 伸缩托
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.1, 0.36), metal);
      body.position.set(0, 0, -0.14);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.26), dark);
      rail.position.set(0, 0.065, -0.16);
      const carryHandle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.035, 0.12), accent);
      carryHandle.position.set(0, 0.095, -0.05);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.08), dark);
      mag.position.set(0, -0.13, -0.05);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.085, 0.18), dark);
      stock.position.set(0, -0.01, 0.16);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.07), dark);
      grip.position.set(0, -0.1, 0.07);
      grip.rotation.x = -0.22;
      g.add(body, rail, carryHandle, mag, stock, grip);
      g.position.set(0.18, -0.19, -0.4);
      g.scale.setScalar(0.78);
    } else if (id === 'awm') {
      // AWM：长枪管 + 大瞄准镜 + 两脚架暗示 + 绿色枪身
      const awmBody = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.44), accent);
      awmBody.position.set(0, 0, -0.1);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.5, 8), dark);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.01, -0.56);
      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.24, 10), dark);
      scope.rotation.x = Math.PI / 2;
      scope.position.set(0, 0.1, -0.14);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.008, 10), new THREE.MeshBasicMaterial({ color: 0x9fd8ff }));
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0, 0.1, -0.262);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.24), accent);
      stock.position.set(0, -0.015, 0.2);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.1), dark);
      mag.position.set(0, -0.09, -0.02);
      g.add(awmBody, barrel, scope, lens, stock, mag);
      g.position.set(0.18, -0.2, -0.38);
      g.scale.setScalar(0.8);
    } else if (id === 'grenade') {
      // 破片手雷：单手持雷（左手收回），弹体 + 顶部引信 + 保险握片
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), dark);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.03, 8), metal);
      cap.position.set(0, 0.068, 0);
      const lever = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.075, 0.03), accent);
      lever.position.set(0.03, 0.045, 0.01);
      lever.rotation.z = -0.35;
      const pin = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 6, 12), metal);
      pin.position.set(0.055, 0.085, 0.01);
      pin.rotation.x = Math.PI / 2;
      // 弹体刻槽（破片沟）：细环
      for (const ly of [-0.02, 0.01, 0.04]) {
        const groove = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.004, 4, 14), metal);
        groove.rotation.x = Math.PI / 2;
        groove.position.set(0, ly, 0);
        g.add(groove);
      }
      g.add(ball, cap, lever, pin);
      // 与沙鹰同区位的持握位（双手共用的 addArm 布局对齐）
      g.position.set(0.2, -0.2, -0.44);
      g.scale.setScalar(0.85);
    } else {
      // MP5：短枪身 + 波浪弹匣（斜置长盒）+ 圆孔托
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.095, 0.28), metal);
      body.position.set(0, 0, -0.1);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.22, 0.07), dark);
      mag.position.set(0, -0.13, -0.06);
      mag.rotation.x = 0.18;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 8), dark);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.012, -0.3);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.16), dark);
      stock.position.set(0, 0.0, 0.14);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.065), dark);
      grip.position.set(0, -0.095, 0.05);
      grip.rotation.x = -0.2;
      g.add(body, mag, barrel, stock, grip);
      g.position.set(0.18, -0.19, -0.42);
      g.scale.setScalar(0.76);
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
    ads: boolean,
  ): void {
    for (const [id, g] of this.slots) g.visible = id === weapon;
    const g = this.slots.get(weapon);
    const target = this.adsPos.get(weapon);

    // 开镜过渡（渲染层表现；真实散布/灵敏度在 sim 与输入层）
    this.adsBlend += ((ads ? 1 : 0) - this.adsBlend) * Math.min(1, dt * 14);
    const adsK = this.adsBlend;

    // 走路摆动 + 呼吸 sway（043 的 breathing sway：站立时枪口缓慢起伏）
    this.bob += dt * (sprint ? 13 : 8.5);
    this.breath += dt * 1.6;
    const amp = moving ? (sprint ? 0.022 : 0.012) : 0.003;
    const bobX = (Math.sin(this.bob) * amp) * (1 - adsK * 0.85);
    const bobY = (Math.abs(Math.cos(this.bob)) * amp * 0.8 + Math.sin(this.breath) * 0.0022) * (1 - adsK * 0.85);

    // 后坐力：向后 + 上抬
    const kick = Math.min(0.16, recoilPitch * 2.6);
    // 换弹三段（043 的 reloadT<0.32 拉栓思路，映射到进度 p）：
    //   p<0.3 下沉卸匣 / 0.3-0.55 抖动插匣 / 0.55-0.8 拉栓（枪身上仰 + 快速回弹）
    let reloadDip = 0;
    let reloadRoll = 0;
    let boltPull = 0;
    if (reloading) {
      const p = reloadProgress;
      reloadDip = Math.sin(Math.min(1, p / 0.85) * Math.PI) * 0.14;
      reloadRoll = Math.sin(p * Math.PI) * 0.4;
      if (p > 0.55 && p < 0.85) boltPull = Math.sin(((p - 0.55) / 0.3) * Math.PI);
      if (p < 0.55) reloadDip += Math.sin(p * 40) * 0.008; // 插匣抖动
    }
    // 切枪：从下方抬起（043 的 draw anim）
    const switchDip = switching ? 0.22 : 0;

    if (g && target) {
      const hip = (g.userData.hip ??= g.position.clone());
      // 腰射位 → 镜位插值；开镜时枪口上收、贴近视线轴
      const bx = hip.x + bobX;
      const by = hip.y + bobY - reloadDip - switchDip;
      const bz = hip.z + kick * 0.5;
      g.position.set(
        bx + (target.x - hip.x) * adsK,
        by + (target.y - hip.y) * adsK,
        bz + (target.z - hip.z) * adsK,
      );
      g.rotation.x = -kick * 1.6 + boltPull * 0.5 + reloadDip * 0.3 - switchDip * 0.8;
      g.rotation.z = reloadRoll * (1 - adsK);
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
