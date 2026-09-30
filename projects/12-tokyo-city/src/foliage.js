// foliage.js — Kenney Nature Kit 植被接入（CC0，已登记 SOURCES.md §15）。
//
// 之前城里的绿只有三种东西：程序化行道树（圆柱 + 二十面体球冠）、公园一块纯色绿板、
// 郊区一块纯色草坪板。远看还行，走进去就很假——尤其公园和农村，整块地是空的。
// 这里按分区补一层真正的植被：公园阔叶 + 灌木 + 花丛，郊区小乔木 + 绿篱，
// 农村散树 + 松林 + 岩石，海岸棕榈 + 礁石。
//
// 四条工程约束（都是这轮踩出来的）：
// 1) 落地高度必须对齐地面分层。街区垫层的顶面不是 0：城区混凝土 0.35、公园绿板 0.40、
//    郊区草坪 0.20、农村裸地 0。搞错就出现「树悬空 0.4m」或「树埋进地里」。
// 2) 只在街区矩形内部撒点。街区本身就是「相邻两条路之间」切出来的，
//    所以落在街区里天然压不到马路——不需要再写一遍道路避让。
// 3) 和 props.js 同样的铁律：植被不进碰撞网格。但也不允许压到房子，
//    所以要把 houses.js 的 rects 传进来剔除。
// 4) 一个 glb 常常是「树干 + 树冠」两段 mesh、两个材质（Kenney 的 rock/flower 也是），
//    所以必须按 mesh 拆开各自成 InstancedMesh，不能当成一个整体网格。
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TOWER, SKYTREE, coastX, makeRng } from './layout.js';

// 目录名里有空格，必须显式编码；serve.mjs 用 decodeURIComponent 还原
const DIR = '/assets/models/environment/kenney_nature-kit/Models/GLTF%20format/';

// 分区地面高度（对应 ground.js 里垫层的顶面）
const GROUND_Y = { park: 0.40, towerpark: 0.40, suburb: 0.20, rural: 0.0, coast: 0.0 };

// h = 目标高度（米），y = 沉入地面的量（负值，藏住低模的平底），w = 相对权重
const SPECS = [
  // ---- 阔叶乔木：公园主力 ----
  { file: 'tree_default.glb', h: 9.0, zones: ['park', 'towerpark', 'suburb'], w: 3, y: -0.15 },
  { file: 'tree_oak.glb', h: 10.5, zones: ['park', 'towerpark', 'suburb', 'rural'], w: 3, y: -0.10 },
  { file: 'tree_blocks.glb', h: 8.0, zones: ['park', 'suburb'], w: 2, y: -0.10 },
  { file: 'tree_detailed.glb', h: 11.0, zones: ['park', 'towerpark'], w: 2, y: -0.15 },
  { file: 'tree_tall.glb', h: 12.0, zones: ['park', 'rural'], w: 2, y: -0.15 },
  { file: 'tree_fat.glb', h: 7.0, zones: ['park', 'suburb'], w: 2, y: -0.10 },
  { file: 'tree_simple.glb', h: 6.5, zones: ['park', 'suburb'], w: 2, y: -0.10 },
  { file: 'tree_plateau.glb', h: 9.5, zones: ['rural'], w: 2, y: -0.20 },
  // ---- 针叶：农村松林 ----
  { file: 'tree_pineSmallA.glb', h: 7.0, zones: ['rural', 'park'], w: 2, y: -0.10 },
  { file: 'tree_pineDefaultA.glb', h: 11.0, zones: ['rural'], w: 3, y: -0.15 },
  { file: 'tree_pineTallA.glb', h: 15.0, zones: ['rural'], w: 2, y: -0.20 },
  { file: 'tree_pineRoundB.glb', h: 9.0, zones: ['rural'], w: 2, y: -0.15 },
  // ---- 海岸棕榈 ----
  { file: 'tree_palm.glb', h: 9.0, zones: ['coast'], w: 3, y: -0.15 },
  { file: 'tree_palmShort.glb', h: 6.5, zones: ['coast'], w: 2, y: -0.10 },
  // ---- 灌木 / 绿篱：铺底层 ----
  { file: 'plant_bush.glb', h: 1.5, zones: ['park', 'towerpark', 'suburb', 'rural'], w: 4, y: -0.12 },
  { file: 'plant_bushLarge.glb', h: 2.2, zones: ['park', 'suburb', 'rural'], w: 3, y: -0.15 },
  { file: 'plant_bushSmall.glb', h: 0.9, zones: ['park', 'suburb'], w: 3, y: -0.08 },
  { file: 'plant_flatShort.glb', h: 1.2, zones: ['park', 'rural'], w: 2, y: -0.10 },
  // ---- 草丛 / 花：贴地，压低整体噪声 ----
  { file: 'grass_large.glb', h: 1.1, zones: ['park', 'rural', 'coast'], w: 3, y: -0.06, twoSided: true },
  { file: 'grass_leafsLarge.glb', h: 1.4, zones: ['park', 'suburb'], w: 2, y: -0.08, twoSided: true },
  { file: 'flower_redA.glb', h: 0.8, zones: ['park', 'suburb'], w: 2, y: -0.05, twoSided: true },
  { file: 'flower_yellowB.glb', h: 0.9, zones: ['park', 'suburb'], w: 2, y: -0.05, twoSided: true },
  { file: 'flower_purpleA.glb', h: 0.8, zones: ['park'], w: 1, y: -0.05, twoSided: true },
  // ---- 岩石：农村和海岸的点缀 ----
  { file: 'rock_largeA.glb', h: 2.4, zones: ['rural', 'coast'], w: 2, y: -0.30 },
  { file: 'rock_smallA.glb', h: 1.1, zones: ['rural', 'park', 'coast'], w: 2, y: -0.15 },
  { file: 'rock_tallB.glb', h: 3.2, zones: ['rural', 'coast'], w: 1, y: -0.35 },
];

// 密度档位 → 每 1000 ㎡ 的期望株数
const DENSITY = {
  park: { tree: 2.6, bush: 4.5, ground: 5.0 },
  towerpark: { tree: 1.8, bush: 3.0, ground: 3.0 },
  suburb: { tree: 1.6, bush: 2.6, ground: 2.0 },
  rural: { tree: 2.2, bush: 1.8, ground: 3.2 },
  coast: { tree: 1.2, bush: 1.0, ground: 2.6 },
};

const TIER = (file) =>
  file.startsWith('rock') || file.startsWith('grass') || file.startsWith('flower') ? 'ground'
    : file.startsWith('plant_') ? 'bush' : 'tree';

// 地面高度表也导出去：断言里要拿它核对「每株的 y 确实是该分区的地高 + 下沉量」
export { GROUND_Y, SPECS };

function pickWeighted(list, rng) {
  let r = rng() * list.reduce((s, x) => s + x.w, 0);
  for (const x of list) if ((r -= x.w) <= 0) return x;
  return list[list.length - 1];
}

// 极简空间哈希：同株距太近会长成「一坨」，用网格挑开
function makeGrid(cell) { return { cell, m: new Map() }; }
function gridFree(g, x, z, r) {
  const cx = Math.floor(x / g.cell), cz = Math.floor(z / g.cell);
  const span = Math.ceil(r / g.cell);
  for (let i = -span; i <= span; i++) {
    for (let j = -span; j <= span; j++) {
      const arr = g.m.get((cx + i) + ',' + (cz + j));
      if (!arr) continue;
      for (const p of arr) {
        const dx = p.x - x, dz = p.z - z;
        if (dx * dx + dz * dz < (r + p.r) * (r + p.r)) return false;
      }
    }
  }
  return true;
}
function gridAdd(g, p) {
  const k = Math.floor(p.x / g.cell) + ',' + Math.floor(p.z / g.cell);
  if (!g.m.has(k)) g.m.set(k, []);
  g.m.get(k).push(p);
}

// 把 glb 拆成「按材质分组的、已归一化到目标高度的几何体」
function normalize(gltf, targetH, twoSided) {
  gltf.scene.updateMatrixWorld(true);
  const parts = [];
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const geo = o.geometry.clone();
    geo.applyMatrix4(o.matrixWorld); // glb 节点自带缩放/旋转，先烘进几何体
    const src = Array.isArray(o.material) ? o.material[0] : o.material;
    parts.push({ geo, color: src.color ? src.color.clone() : new THREE.Color(0x7fa05a) });
  });
  if (!parts.length) return [];

  // 归一化：高度对齐 targetH、XZ 居中、最低点落到 y=0（下沉量在摆放时再加）
  // 注意 three 0.180 的 computeBoundingBox()/computeBoundingSphere() 不再返回 this，
  // 结果只挂在 geometry.boundingBox 上——按老写法 `b.union(g.computeBoundingBox())` 会直接抛
  const b = new THREE.Box3();
  for (const p of parts) {
    p.geo.computeBoundingBox();
    b.union(p.geo.boundingBox);
  }
  const s = targetH / Math.max(1e-3, b.max.y - b.min.y);
  const m = new THREE.Matrix4().makeScale(s, s, s).premultiply(
    new THREE.Matrix4().makeTranslation(
      -((b.max.x + b.min.x) / 2) * s,
      -b.min.y * s,
      -((b.max.z + b.min.z) / 2) * s
    )
  );
  for (const p of parts) {
    p.geo.applyMatrix4(m);
    // glTF 导出器默认 metallicFactor=1，那不是美术意图；按漫反射木/叶处理
    p.mat = new THREE.MeshStandardMaterial({
      color: p.color,
      roughness: 0.92,
      metalness: 0.0,
      side: twoSided ? THREE.DoubleSide : THREE.FrontSide,
    });
  }
  return parts;
}

// ---- 生成种植计划（纯计算，必须在加载之前跑完，保证确定性）----
// 导出是为了让 tools/race-check.mjs 能在 Node 里无头断言种植规则
// （不悬空、不压马路、不长进房子、间距够），不必依赖被节流的浏览器。
export function planSpots(layout, houseRects = []) {
  const rng = makeRng(90210);
  const byZone = {};
  for (let i = 0; i < SPECS.length; i++) {
    for (const z of SPECS[i].zones) (byZone[z] ||= []).push(i);
  }

  // 公园池塘（ground.js 里 CircleGeometry(42) 缩放 1.4/0.75 后摆在 cx+20）
  const park = layout.blocks.find((b) => b.zone === 'park');
  const pond = park ? { x: park.cx + 20, z: park.cz, rx: 42 * 1.4 + 4, rz: 42 * 0.75 + 4 } : null;

  const grid = makeGrid(16);
  const plan = SPECS.map(() => []);
  const MAX = 9000;
  let count = 0;

  for (const b of layout.blocks) {
    const zone = b.zone;
    const idxs = byZone[zone];
    if (!idxs || zone === 'crossing') continue;
    const gy = GROUND_Y[zone];

    // 海岸区只种到沙滩内沿以西，免得棕榈长在水里
    const xLo = b.x0 + (zone === 'coast' ? 6 : 5);
    const xHi = (zone === 'coast' ? Math.min(b.x1 - 6, coastX(b.cz) - 50) : b.x1 - 5);
    if (xHi <= xLo) continue;

    const d = DENSITY[zone];
    const per = area => Math.min(120, Math.round((area / 1000) * (d.tree + d.bush + d.ground) * 0.10));
    const total = Math.min(per((b.x1 - b.x0) * (b.z1 - b.z0)), MAX - count);

    for (let i = 0; i < total; i++) {
      const x = xLo + rng() * (xHi - xLo);
      const z = b.z0 + 5 + rng() * (b.z1 - b.z0 - 10);
      // 房子（含 3m 余量）、地标基座、池塘
      if (houseRects.some((h) => Math.abs(x - h.x) < h.hw + 3 && Math.abs(z - h.z) < h.hd + 3)) continue;
      if (Math.hypot(x - TOWER.x, z - TOWER.z) < 42) continue;
      if (Math.hypot(x - SKYTREE.x, z - SKYTREE.z) < 34) continue;
      if (pond && Math.hypot((x - pond.x) / pond.rx, (z - pond.z) / pond.rz) < 1) continue;

      // 先按权重抽，再有 60% 概率把档位拉到乔木——否则灌木/花会淹掉树。
      // 注意 pickWeighted 返回的是 spec 对象，这里要换回 SPECS 下标才能定位 plan[si]。
      const toSpec = (pool) => pool.map((k) => SPECS[k]);
      let si = SPECS.indexOf(pickWeighted(toSpec(idxs), rng));
      if (TIER(SPECS[si].file) !== 'tree' && rng() < 0.6) {
        const trees = toSpec(idxs).filter((s) => TIER(s.file) === 'tree');
        if (trees.length) si = SPECS.indexOf(pickWeighted(trees, rng));
      }
      const spec = SPECS[si];
      const minR = TIER(spec.file) === 'tree' ? 5.5 : 1.4;
      if (!gridFree(grid, x, z, minR)) continue;
      gridAdd(grid, { x, z, r: minR });

      plan[si].push({
        x, y: gy + spec.y, z,
        s: 0.78 + rng() * 0.5,
        rot: rng() * Math.PI * 2,
      });
      count++;
    }
  }
  return plan;
}

// ---- 加载模型并实例化 ----
export async function loadFoliage(scene, layout, { houseRects = [] } = {}) {
  const plan = planSpots(layout, houseRects);  const loader = new GLTFLoader();
  const group = new THREE.Group();
  group.name = 'foliage';

  const results = await Promise.allSettled(
    SPECS.map(async (spec, i) => {
      if (!plan[i].length) return 0;
      const gltf = await loader.loadAsync(DIR + spec.file);
      const parts = normalize(gltf, spec.h, !!spec.twoSided);
      gltf.scene.clear();
      if (!parts.length) return 0;

      const spots = plan[i];
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      const v = new THREE.Vector3();
      const sv = new THREE.Vector3();
      for (const p of parts) {
        const inst = new THREE.InstancedMesh(p.geo, p.mat, spots.length);
        spots.forEach((sp, k) => {
          e.set(0, sp.rot, 0);
          q.setFromEuler(e);
          // 横向轻微错落，避免一排树是同一个剪影
          sv.set(sp.s * (0.86 + (0.28 * ((k * 37) % 13)) / 13), sp.s, sp.s);
          v.set(sp.x, sp.y, sp.z);
          m.compose(v, q, sv);
          inst.setMatrixAt(k, m);
        });
        inst.instanceMatrix.needsUpdate = true;
        inst.castShadow = true;
        inst.receiveShadow = true;
        group.add(inst);
      }
      return spots.length;
    })
  );

  scene.add(group);
  const placed = results.reduce((s, r) => s + (r.status === 'fulfilled' ? r.value : 0), 0);
  // allSettled 会把异常吞掉，不带出原因的话只能看到「N 个模型失败」这种没法定位的日志
  const failed = results
    .map((r, i) => (r.status === 'rejected' ? { file: SPECS[i].file, error: r.reason?.message || String(r.reason) } : null))
    .filter(Boolean);
  return { placed, models: SPECS.length - failed.length, failed, group };
}
