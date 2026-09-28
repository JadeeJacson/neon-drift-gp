/* 地图：「死信号」前哨站 —— 被高墙围起的废弃军事设施院落（COD 僵尸式关卡）
 * 结构：砖营房（L 形、室内隔断）、弹药棚、木箱/油桶/沙袋掩体、
 *       无线电塔、了望台（木箱塔可跳上）、三处抵墙购买点、三处亡灵刷新闸口。
 * 每个可见实体同时向物理世界注册 OBB 碰撞盒，并采样出导航网格供 AI 寻路。 */
import * as THREE from 'three';
import { seedRng, clamp } from '../core/util.js';
import { mat } from '../core/textures.js';
import { World, CELL } from '../core/physics.js';

const HW = 32, HD = 24;          // 院落半边长（64 × 48）
const WALL_H = 5;

export function build(scene) {
  const rnd = seedRng(20771);
  const world = new World();

  // ---------- 通用：贴图盒子（视觉 + 碰撞一次到位） ----------
  function slab(name, texName, w, h, d, x, y, z, opts = {}) {
    const m = mat(texName, { repeat: opts.repeat || Math.max(1, (w + d) / 6) });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = opts.noShadow !== true;
    mesh.receiveShadow = true;
    if (opts.yaw) mesh.rotation.y = opts.yaw;
    scene.add(mesh);
    if (opts.collide !== false) {
      world.addBox(x, y + h / 2, z, w, h, d, {
        yaw: opts.yaw || 0, solid: opts.solid !== false,
        blocksRay: opts.thin ? false : true, step: opts.step,
        name, tag: texName, group: opts.group || ''
      });
    }
    return mesh;
  }
  const wall = (name, texName, x, z, w, d, h = WALL_H, y = 0, opts = {}) =>
    slab(name, texName, w, h, d, x, y, z, { solid: true, group: opts.group });

  // ---------- 地面 ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2 + 8, HD * 2 + 8), mat('dirt', { repeat: 26 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ---------- 外围高墙（四角搭接属正常，归同一组） ----------
  wall('北墙', 'concrete', 0, -HD - 0.4, HW * 2 + 1.6, 0.8, WALL_H + 0.6, 0, { group: 'perim' });
  wall('南墙', 'concrete', 0, HD + 0.4, HW * 2 + 1.6, 0.8, WALL_H + 0.6, 0, { group: 'perim' });
  wall('东墙', 'concrete', HW + 0.4, 0, 0.8, HD * 2 + 1.6, WALL_H + 0.6, 0, { group: 'perim' });
  wall('西墙', 'concrete', -HW - 0.4, 0, 0.8, HD * 2 + 1.6, WALL_H + 0.6, 0, { group: 'perim' });
  // 墙顶铁丝网的视觉暗示：一圈深色薄带（不挡子弹）
  for (const [x, z, w, d] of [[0, -HD, HW * 2, 0.3], [0, HD, HW * 2, 0.3], [HW, 0, 0.3, HD * 2], [-HW, 0, 0.3, HD * 2]]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(w, 0.7, d), new THREE.MeshStandardMaterial({ color: 0x20242a, roughness: 1 }));
    band.position.set(x, WALL_H + 0.9, z);
    scene.add(band);
  }

  // ---------- 砖营房（L 形，两间屋，门洞连通） ----------
  const B = { x: -14, z: -6, w: 16, d: 12, t: 0.45, h: 3.4 };     // 主体
  function bhouse() {
    const { x, z, w, d, t, h } = B;
    const G = 'bhouse';                       // 墙体相互搭接为有意结构
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2;
    // 室内混凝土地面（无碰撞）
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w - t, d - t), mat('concrete', { repeat: 5 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(x, 0.02, z);
    floor.receiveShadow = true; scene.add(floor);
    // 北墙整面 + 南墙两段（留 2.2m 门洞于 x=-17）
    wall('营房东山墙', 'brick', x1, z, t, d, h, 0, { group: G });
    wall('营房西山墙', 'brick', x0, z, t, d, h, 0, { group: G });
    wall('营房北墙', 'brick', x, z0, w, t, h, 0, { group: G });
    wall('营房南墙-左', 'brick', x0 + 3.1, z1, 6.2, t, h, 0, { group: G });
    wall('营房南墙-右', 'brick', x + 3.1, z1, w - 8.4, t, h, 0, { group: G });
    // 室内隔断：东西向一堵，东端留 2.2m 门洞（不嵌进山墙）
    wall('营房隔断', 'plaster', x - 1.4, z, 7.8, t, h, 0, { group: G });
    // 东翼（弹药棚）：3×4 小隔间挂在东南角
    wall('棚北墙', 'metal', x + 5, z + d / 2 + 2.2, 6, t, 2.6, 0, { group: G });
    wall('棚东墙', 'metal', x + 8 - t / 2, z + d / 2 + 4.4, t, 4.4, 2.6, 0, { group: G });
    wall('棚南墙', 'metal', x + 5, z + d / 2 + 6.6, 6, t, 2.6, 0, { group: G });
    const shedFloor = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.4), mat('concrete', { repeat: 2 }));
    shedFloor.rotation.x = -Math.PI / 2; shedFloor.position.set(x + 5, 0.03, z + d / 2 + 4.4);
    scene.add(shedFloor);
  }
  bhouse();

  // ---------- 木箱塔（营房西北角，跳上了望平台用的台阶） ----------
  function crateStack(x, z) {
    slab('木箱A', 'crate', 1.1, 1.1, 1.1, x, 0, z, { repeat: 1 });
    slab('木箱B', 'crate', 1.1, 1.1, 1.1, x + 1.2, 0, z + 0.3, { repeat: 1 });
    slab('木箱C', 'crate', 1.0, 1.0, 1.0, x + 0.5, 1.1, z + 0.15, { repeat: 1 });
  }
  crateStack(-24, -13);
  crateStack(24, 4);
  crateStack(9, -15);

  // ---------- 零散掩体 ----------
  for (let i = 0; i < 8; i++) {                                   // 油桶
    const bx = [-6, 2, 15, -20, 26, -28, 12, 24][i], bz = [8, -4, -8, 4, -16, -18, 14, 16][i];
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.05, 14), mat('metal', { repeat: 1, metal: 0.4, rough: 0.7 }));
    drum.position.set(bx, 0.53, bz); drum.castShadow = true; scene.add(drum);
    world.addBox(bx, 0.53, bz, 0.84, 1.05, 0.84, { name: '油桶', tag: 'metal' });
  }
  // 沙袋掩体：中路两处 + 营门口一处
  slab('沙袋1', 'sandbag', 4, 1.0, 1.2, 2, 0, 3, { yaw: 0.3 });
  slab('沙袋2', 'sandbag', 3.4, 1.0, 1.2, -4, 0, -14, { yaw: -0.8 });
  slab('沙袋3', 'sandbag', 3.2, 1.0, 1.2, -15.5, 0, 2.6, { yaw: 1.4 });
  // 翻倒的军卡（车体与车头有意搭接，归同一组）
  slab('卡车厢', 'metal', 5.2, 1.7, 2.3, 17.5, 0, 15, { yaw: -0.5, repeat: 2, group: 'truck' });
  slab('卡车头', 'metal', 2.2, 1.5, 2.3, 20.6, 0, 13.6, { yaw: -0.5, group: 'truck' });
  // 瓦砾堆（低矮可踏步；落地前先确认可落点没被其它实体占住）
  for (let i = 0; i < 14; i++) {
    const rx = rnd() * 52 - 26, rz = rnd() * 40 - 19;
    if (world.overlapsAll(rx, 0.35, rz, 1.0, 0.5)) continue;   // 避开墙体/木箱/卡车（网格未完，用全量扫描）
    const r = 0.5 + rnd() * 0.8;
    slab('瓦砾' + i, 'concrete', r, r * 0.5, r * 0.8, rx, 0, rz, { yaw: rnd() * 3, repeat: 1 });
  }

  // ---------- 了望台（东南角）：4 柱 + 2.3m 平台，木箱塔可跳上 ----------
  function watchtower(x, z) {
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      slab('塔柱' + dx + dz, 'crate', 0.3, 2.3, 0.3, x + dx * 1.1, 0, z + dz * 1.1, { repeat: 1, group: 'tower' });
    }
    slab('塔平台', 'crate', 2.8, 0.22, 2.8, x, 2.3, z, { repeat: 1, group: 'tower' });
    slab('塔护栏', 'crate', 2.8, 0.7, 0.16, x, 2.52, z - 1.3, { repeat: 1, group: 'tower' });
  }
  watchtower(24, 19);
  slab('上塔箱1', 'crate', 1.1, 1.1, 1.1, 22.2, 0, 17.2, { repeat: 1 });
  slab('上塔箱2', 'crate', 1.1, 1.1, 1.1, 23.0, 0, 16.0, { repeat: 1 });
  slab('上塔箱3', 'crate', 1.0, 1.0, 1.0, 22.6, 1.1, 16.6, { repeat: 1 });   // 蹬上塔平台的台阶

  // ---------- 无线电塔（中央偏北）：实心锥形杆 + 横臂 + 顶红闪灯 ----------
  // （早先用四根细杆 + 环格架，夜里细杆看不见、环会变成“天上漂着的箱子”）
  const mast = new THREE.Group();
  const latMat = new THREE.MeshStandardMaterial({ color: 0x39404a, roughness: 0.55, metalness: 0.75 });
  const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.24, 9, 8), latMat);
  pole1.position.y = 4.5; pole1.castShadow = true;
  mast.add(pole1);
  for (let k = 0; k < 3; k++) {                          // 三层横臂（天线）
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5 - k * 0.35, 0.07, 0.07), latMat);
    arm.position.set(0, 4.4 + k * 1.9, 0);
    mast.add(arm);
    const arm2 = arm.clone(); arm2.rotation.y = Math.PI / 2; mast.add(arm2);
  }
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 12), latMat);
  dish.rotation.x = Math.PI / 2; dish.position.set(0, 3.9, 0.35);
  mast.add(dish);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
  beacon.position.y = 9.2; mast.add(beacon);
  mast.position.set(-2, 0, -18);
  scene.add(mast);
  world.addBox(-2, 4.5, -18, 0.7, 9, 0.7, { name: '无线电塔', tag: 'metal' });

  // ---------- 灯杆（频闪聚光灯挂在上面，由 sky.update 调制） ----------
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 7, 8), latMat);
  pole.position.set(6, 3.5, 6); scene.add(pole);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.8), latMat);
  head.position.set(6, 6.9, 6); scene.add(head);
  const spot = new THREE.SpotLight(0xffdca0, 120, 40, 0.6, 0.5, 1.7);
  spot.position.set(6, 6.8, 6);
  spot.target.position.set(4, 0, 2);
  scene.add(spot, spot.target);
  world.addBox(6, 3.5, 6, 0.3, 7, 0.3, { name: '灯杆', tag: 'metal' });

  // ---------- 三处闸口（亡灵刷新点，木质路障） ----------
  const gates = [
    { name: '西北闸', pos: [-24, 0, -HD + 0.9], yaw: 0 },
    { name: '东北闸', pos: [22, 0, -HD + 0.9], yaw: 0 },
    { name: '南闸', pos: [4, 0, HD - 0.9], yaw: 0 }
  ];
  for (const g of gates) {
    slab(g.name, 'crate', 3.6, 3.2, 0.5, g.pos[0], g.pos[1], g.pos[2], { yaw: g.yaw, repeat: 1 });
  }

  // ---------- 抵墙购买点（枪 2 处 + 补弹 2 处） ----------
  // ---------- 电力开关（西南角）：基座 + 拉杆 + 状态灯，合闸后顶灯转绿、拉杆立起 ----------
  const leverGroup = new THREE.Group();
  const leverBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.5), mat('concrete', { repeat: 1 }));
  leverBase.position.y = 0.55; leverBase.castShadow = true;
  leverGroup.add(leverBase);
  const leverArm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8), latMat);
  leverArm.position.set(0, 1.32, 0); leverArm.rotation.x = -0.75; leverGroup.add(leverArm);   // 初始拉下
  const leverLampMat = new THREE.MeshBasicMaterial({ color: 0xb02020 });
  const leverLamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), leverLampMat);
  leverLamp.position.set(0, 1.75, 0.12); leverGroup.add(leverLamp);
  leverGroup.position.set(-24, 0, 18);
  scene.add(leverGroup);
  world.addBox(-24, 0.55, 18, 0.9, 1.1, 0.5, { name: '电力开关', tag: 'metal' });

  // ---------- 神秘盒子（院落中东部）：木箱 + 南北两侧的金色发光封条 ----------
  slab('神秘盒子', 'crate', 1.5, 0.95, 0.95, 12, 0, 10, { repeat: 1 });
  const boxGlowMat = new THREE.MeshBasicMaterial({ color: 0xffc84d, transparent: true, opacity: 0.75 });
  const boxGlowS = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.16), boxGlowMat);
  boxGlowS.position.set(12, 0.98, 10.49); scene.add(boxGlowS);
  const boxGlowN = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.16), boxGlowMat);
  boxGlowN.position.set(12, 0.98, 9.51); boxGlowN.rotation.y = Math.PI; scene.add(boxGlowN);

  const buys = [
    { id: 'power', kind: 'power', cost: 1000, pos: new THREE.Vector3(-24, 0, 19.4), label: '合闸供电 · 1000' },
    { id: 'mystery', kind: 'mystery', cost: 950, pos: new THREE.Vector3(12, 0, 11.6), label: '神秘盒子 · 950' },
    { id: 'shotgun', kind: 'gun', weapon: 'shotgun', cost: 1200, pos: new THREE.Vector3(-8, 0, -HD + 1.4), label: 'SPAS-12 · 1200' },
    { id: 'smg', kind: 'gun', weapon: 'smg', cost: 900, pos: new THREE.Vector3(26.4, 0, -6), label: 'MP5 · 900' },
    { id: 'ammo1', kind: 'ammo', pos: new THREE.Vector3(0, 0, HD - 1.5), label: '全弹药补给 · 300' },
    { id: 'ammo2', kind: 'ammo', pos: new THREE.Vector3(-HW + 1.5, 0, 8), label: '全弹药补给 · 300' }
  ];
  // 购买点地牌：一小块亮色贴地面板，方便玩家辨认
  for (const b of buys) {
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0),
      new THREE.MeshBasicMaterial({ color: b.kind === 'gun' ? 0x7a6a1f : b.kind === 'power' ? 0x1f4a7a : b.kind === 'mystery' ? 0x8a5f10 : 0x2e5a3f, transparent: true, opacity: 0.5 }));
    pad.rotation.x = -Math.PI / 2;
    pad.position.copy(b.pos); pad.position.y = 0.03;
    // 面板朝向院子中心
    pad.lookAt(pad.position.x + (b.pos.x > 0 ? -1 : b.pos.x < 0 ? 1 : 0), 0.03, b.pos.z + (b.pos.z > 0 ? -1 : 1));
    scene.add(pad);
  }

  world.finish();

  // ---------- 导航网格（AI 寻路用） ----------
  const CS = 1.6;
  const nx = Math.floor((HW * 2) / CS), nz = Math.floor((HD * 2) / CS);
  const solid = new Uint8Array(nx * nz);
  const toCell = (x, z) => [clamp(Math.floor((x + HW) / CS), 0, nx - 1), clamp(Math.floor((z + HD) / CS), 0, nz - 1)];
  const toPos = (i, j) => [-HW + (i + 0.5) * CS, -HD + (j + 0.5) * CS];
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const [px, pz] = toPos(i, j);
      solid[j * nx + i] = world.overlapsSolid(px, 0.05, pz, 0.45, 1.7) ? 1 : 0;
    }
  }
  const walkable = (i, j) => i >= 0 && j >= 0 && i < nx && j < nz && solid[j * nx + i] === 0;

  // A*：返回路径点数组（世界坐标），失败返回最近可达点的单元素数组
  function findPath(sx, sz, tx, tz) {
    const cellS = toCell(sx, sz), cellT = toCell(tx, tz);
    let si = cellS[0], sj = cellS[1], ti = cellT[0], tj = cellT[1];
    if (!walkable(si, sj) || !walkable(ti, tj)) {
      // 端点卡在墙里：就近找一个可走格
      const fix = (i, j) => {
        if (walkable(i, j)) return [i, j];
        for (let r = 1; r <= 4; r++)
          for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++)
            if (walkable(i + di, j + dj)) return [i + di, j + dj];
        return null;
      };
      const a = fix(si, sj), b = fix(ti, tj);
      if (!a || !b) return null;
      si = a[0]; sj = a[1]; ti = b[0]; tj = b[1];
    }
    const g = new Float32Array(nx * nz).fill(Infinity);
    const from = new Int32Array(nx * nz).fill(-1);
    const open = [[0, si, sj]];
    g[sj * nx + si] = 0;
    const H = (i, j) => Math.abs(i - ti) + Math.abs(j - tj);
    const inOpen = new Uint8Array(nx * nz);
    inOpen[sj * nx + si] = 1;
    let found = false, guard = nx * nz;
    while (open.length && guard-- > 0) {
      // 小规模网格用线性取最小即可
      let bi = 0;
      for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;
      const [, ci, cj] = open.splice(bi, 1)[0];
      inOpen[cj * nx + ci] = 0;
      if (ci === ti && cj === tj) { found = true; break; }
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const ni = ci + di, nj = cj + dj;
        if (!walkable(ni, nj)) continue;
        if (di && dj && (!walkable(ci + di, cj) || !walkable(ci, cj + dj))) continue; // 禁止切角
        const step = (di && dj ? 1.414 : 1) * CS;
        const ng = g[cj * nx + ci] + step;
        if (ng < g[nj * nx + ni]) {
          g[nj * nx + ni] = ng;
          from[nj * nx + ni] = cj * nx + ci;
          if (!inOpen[nj * nx + ni]) { open.push([ng + H(ni, nj) * CS, ni, nj]); inOpen[nj * nx + ni] = 1; }
        }
      }
    }
    if (!found) return null;
    const pts = [];
    for (let cur = tj * nx + ti; cur !== -1; cur = from[cur]) {
      const j = Math.floor(cur / nx), i = cur % nx;
      pts.push(toPos(i, j));
    }
    pts.reverse();
    pts.pop();                        // 去掉终点格（目标会移动）
    return pts.length ? pts : null;
  }

  return {
    world,
    dims: { HW, HD },
    spawn: new THREE.Vector3(-3, 0, 10),
    gates,
    buys,
    beacon,
    lightPole: { spot },
    powerLever: { lampMat: leverLampMat, arm: leverArm },
    nav: {
      CS, nx, nz, toCell, toPos, walkable, findPath,
      randomPoint() {                               // 随机可走格（预留给出尸兜底）
        for (let k = 0; k < 40; k++) {
          const i = (rnd() * nx) | 0, j = (rnd() * nz) | 0;
          if (walkable(i, j)) return toPos(i, j);
        }
        return [0, 0];
      }
    }
  };
}
