// race-check.mjs — 竞速 / 派单规则的无头验证。
//
// 为什么要这个：本项目的页面在受限的嵌入式浏览器里 rAF 会被节流到近乎停止，
// 靠点按钮跑完整一局不可靠。而赛道几何、闸门顺序、圈数推进、派单倒计时
// 全是纯数学，直接在 Node 里跑断言才是可信的验证（对应路线图硬约束 5）。
//
// 用法：node tools/race-check.mjs
import { readFileSync } from 'node:fs';
import { buildLayout, coastX, makeRng } from '../src/layout.js';
import { CIRCUITS, JOBS, buildCircuit, gateOnRoad, driftRate, GATE_RADIUS, GATE_SPACING } from '../src/circuits.js';

let pass = 0, fail = 0;
const failures = [];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function ok(cond, msg, extra) {
  if (cond) { pass++; }
  else { fail++; failures.push(msg + (extra ? '  →  ' + extra : '')); }
}
function group(name) { console.log('\n── ' + name + ' ' + '─'.repeat(Math.max(0, 46 - name.length))); }

const layout = buildLayout();

group('布局自检');
ok(layout.roadsV.length > 10 && layout.roadsH.length > 10, '路网规模合理', `V=${layout.roadsV.length} H=${layout.roadsH.length}`);
ok(layout.blocks.length > 1000, '街区数量 > 1000', `blocks=${layout.blocks.length}`);
const zones = new Set(layout.blocks.map((b) => b.zone));
ok(zones.has('shibuya') && zones.has('suburb') && zones.has('rural'), '分区齐全', [...zones].join(','));

group('赛道生成');
const circuits = CIRCUITS.map((d) => buildCircuit(layout, d));
ok(circuits.length === 3, '三条赛道', `n=${circuits.length}`);
for (const c of circuits) {
  ok(c.gates.length >= 8, `${c.name}: 闸门数 >= 8`, `n=${c.gates.length}`);

  // 闸门必须落在马路上（吸附生效），否则玩家永远够不到
  const off = c.gates.filter((g) => !gateOnRoad(layout, g));
  ok(off.length === 0, `${c.name}: 全部闸门压在马路上`, `离路 ${off.length}/${c.gates.length}`);

  // 闸间距不能太大，否则抄近路能跳过
  let maxGap = 0;
  for (let i = 0; i < c.gates.length; i++) {
    const a = c.gates[i], b = c.gates[(i + 1) % c.gates.length];
    maxGap = Math.max(maxGap, Math.hypot(a.x - b.x, a.z - b.z));
  }
  ok(maxGap <= GATE_SPACING * 1.6, `${c.name}: 闸间距不过大（防抄近路）`, `maxGap=${maxGap.toFixed(0)}m`);

  // 闭环：首尾闸距离应约等于平均间距
  const a0 = c.gates[0], aL = c.gates[c.gates.length - 1];
  const wrap = Math.hypot(a0.x - aL.x, a0.z - aL.z);
  ok(wrap <= GATE_SPACING * 1.6, `${c.name}: 首尾闭合`, `wrap=${wrap.toFixed(0)}m`);

  // 赛道不能出图（北/南/西）
  const xs = c.gates.map((g) => g.x), zs = c.gates.map((g) => g.z);
  ok(Math.min(...xs) > -2600, `${c.name}: 西侧不越界`, `minX=${Math.min(...xs)}`);
  ok(Math.max(...zs) < 2600, `${c.name}: 南侧不越界`, `maxZ=${Math.max(...zs)}`);

  // 湾岸线东端必须在陆地内（不能放到海里）
  if (c.id === 'bayline') {
    const maxX = Math.max(...xs);
    ok(maxX < coastX(0) - 100, '湾岸线东端不入海', `maxX=${maxX} coastX(0)=${coastX(0).toFixed(0)}`);
  }
}

group('圈数推进（模拟沿赛道行驶）');
for (const c of circuits) {
  const gates = c.gates;
  let idx = 0, lap = 0, steps = 0, finished = false, outOfOrder = 0;
  let px = gates[0].x, pz = gates[0].z;
  // 沿闸门序列前进 4 圈
  const maxSteps = gates.length * (c.laps + 3) + 16;
  while (steps++ < maxSteps && !finished) {
    const g = gates[idx];
    // 步进到该闸门（模拟 1m 步长）
    const d = Math.hypot(g.x - px, g.z - pz);
    px = g.x; pz = g.z;
    if (d < GATE_RADIUS) {
      idx++;
      if (idx >= gates.length) {
        idx = 0; lap++;
        if (lap >= c.laps) finished = true;
      }
    }
    if (idx !== 0 && lap > c.laps) outOfOrder++;
  }
  ok(finished, `${c.name}: 跑满 ${c.laps} 圈后判定完赛`, `lap=${lap}`);
  ok(outOfOrder === 0, `${c.name}: 闸门顺序无错乱`, `bad=${outOfOrder}`);
  ok(idx === 0 && finished, `${c.name}: 完赛时指针归零`);
}

group('漏门不计时（抄近路惩罚）');
{
  const c = circuits[0];
  // 直接跳到最后一个闸（模拟从对面冲过来）
  let idx = 0, lap = 0;
  const g = c.gates[c.gates.length - 1];
  const d = Math.hypot(g.x - c.gates[0].x, g.z - c.gates[0].z);
  ok(d > GATE_RADIUS, '反向的闸不在起点判定半径内（必须按顺序）', `d=${d.toFixed(0)}m`);
  ok(idx === 0 && lap === 0, '未按顺序时圈数不推进');
}

group('派单规则');
ok(JOBS.length >= 5, '派单数量 >= 5', `n=${JOBS.length}`);
for (const j of JOBS) {
  const d = Math.hypot(j.fromXZ[0] - j.toXZ[0], j.fromXZ[1] - j.toXZ[1]);
  // 限时必须够跑完：按 20m/s 的保守城区均速算，再留 1.25 倍余量
  const need = d / 20 * 1.25;
  ok(j.limit >= need, `${j.label}: 限时够用（保守均速 72km/h）`, `限时${j.limit}s 需${need.toFixed(0)}s`);
  ok(j.pay > 0, `${j.label}: 酬金为正`);
  // 车被硬夹在 x <= coastX(z) - 14，订单点必须全部在陆地可达范围内
  ok(j.fromXZ[0] < coastX(j.fromXZ[1]) - 20, `${j.label}: 取货点在陆地内`, `x=${j.fromXZ[0]} coast=${coastX(j.fromXZ[1]).toFixed(0)}`);
  ok(j.toXZ[0] < coastX(j.toXZ[1]) - 20, `${j.label}: 卸货点在陆地内（车开得到）`, `x=${j.toXZ[0]} coast=${coastX(j.toXZ[1]).toFixed(0)}`);
  // 也不能跑到路网尽头之外
  ok(Math.abs(j.fromXZ[0]) < 2500 && Math.abs(j.toXZ[0]) < 2500, `${j.label}: 在地图范围内`);
}
ok(new Set(JOBS.map((j) => j.id)).size === JOBS.length, '派单 id 无重复');

group('漂移分曲线');
ok(driftRate(0, 30) === 0, '不漂移不加分', `r=${driftRate(0, 30)}`);
ok(driftRate(0.2, 30) === 0, '弱侧滑（阈值下）不加分', `r=${driftRate(0.2, 30)}`);
ok(driftRate(0.9, 30) > 0, '明显漂移加分', `r=${driftRate(0.9, 30).toFixed(1)}`);
ok(driftRate(0.9, 4) === 0, '低速不加分（避免停车刷分）', `r=${driftRate(0.9, 4)}`);
ok(driftRate(1.0, 40) > driftRate(0.5, 40), '漂移越深分越高');
ok(driftRate(0.9, 40) > driftRate(0.9, 12), '越快分越高');
ok(Number.isFinite(driftRate(0.9, 500)), '极端高速不产生 Infinity/NaN');

group('车辆纵向性能（守住「假极速」回归）');
{
  // 从 car.js 源码里读 TUNE，避免测试里抄一份常量后与实现漂移
  const src = readFileSync(new URL('../src/car.js', import.meta.url), 'utf8');
  const start = src.indexOf('const TUNE = {');
  const body = src.slice(start, src.indexOf('};', start));
  const T = {};
  for (const m of body.matchAll(/(\w+):\s*([-\d.]+)/g)) T[m[1]] = +m[2];

  ok(T.powerTaperSpeed > 0 && T.enginePower > 0, 'TUNE 含动力参数', JSON.stringify({ P: T.enginePower, taper: T.powerTaperSpeed }));

  // 复刻 car.js 的纵向积分，量出真实 0-100 与极速
  let v = 0, t = 0, t100 = null;
  const dt = 1 / 120;
  for (let i = 0; i < 120 * 180; i++) {
    const sp = Math.abs(v);
    const pf = 1 - Math.pow(clamp(sp / T.powerTaperSpeed, 0, 1), T.powerFalloff);
    let a = T.enginePower * pf;
    a -= T.rollingDrag * v;
    a -= T.aeroDrag * v * sp;
    v += a * dt;
    if (v > T.maxSpeed) v = T.maxSpeed;
    t += dt;
    if (t100 === null && v * 3.6 >= 100) t100 = t;
  }
  const top = v * 3.6;
  // 曾经的 bug：maxSpeed 写 187km/h，实际只有 55km/h，参数与体感完全脱节
  ok(top > 200, '实际极速 > 200km/h（与 maxSpeed 声明相符）', `实测 ${top.toFixed(0)}km/h`);
  ok(top < 300, '实际极速不过高（不超过声明的硬上限太多）', `实测 ${top.toFixed(0)}km/h`);
  // 硬上限必须是「安全钳」而不是实际限制：留足余量，确保它从不被触发
  ok(top < T.maxSpeed * 0.9 * 3.6, '硬上限不参与限速（只是安全钳）', `实测 ${top.toFixed(0)} / cap ${(T.maxSpeed * 3.6).toFixed(0)}km/h`);
  ok(t100 !== null && t100 > 1.5 && t100 < 4.0, '0-100 在 1.5~4.0s（街机合理区间）', `${t100 === null ? 'never' : t100.toFixed(2)}s`);
  console.log(`  · 实测 0-100 ${t100 === null ? '—' : t100.toFixed(2)}s，极速 ${top.toFixed(0)}km/h`);
}

// ---- 车身姿态轴向 -------------------------------------------------------
// 曾经的 bug：body 用 three.js 默认的欧拉顺序 XYZ，俯仰的 Rx 被放在 Ry 外侧，
// 于是「俯仰」实际绕的是**世界 X 轴**而不是车身横轴。车头朝 +Z 时碰巧是对的，
// 朝 -Z（默认出生朝向 yaw=π）时就变成低头，半路转弯更会变成侧倾——
// 也就是「一给油车头就往下扎」。这里按 8 个朝向实测车头高度来钉死。
import * as THREE from 'three';
import { Car } from '../src/car.js';

group('车身姿态轴向（守住「一给油就低头」的回归）');
{
  const scene = new THREE.Scene();
  const NOSE = new THREE.Vector3(0, 0, 2.2); // 车头保险杠（车身局部坐标，+Z 为车头）
  const settle = (car, accel, lat) => {
    car.accelLong = accel;
    car.lateral = lat;
    car.speed = 20;
    for (let i = 0; i < 400; i++) car.applyVisual(1 / 60); // 跑满姿态平滑
  };
  const noseY = (car) => NOSE.clone().applyQuaternion(car.body.quaternion).y;

  let accelMin = Infinity, brakeMax = -Infinity, deadAxes = 0;
  for (let deg = 0; deg < 360; deg += 45) {
    const acc = new Car({ scene, x: 0, z: 0, yaw: (deg * Math.PI) / 180 });
    ok(acc.body.rotation.order === 'YXZ', `yaw=${deg}°: 欧拉顺序为 YXZ`, `实际 ${acc.body.rotation.order}`);
    settle(acc, 9, 0);
    const up = noseY(acc);
    settle(acc, -9, 0);
    const down = noseY(acc);
    accelMin = Math.min(accelMin, up);
    brakeMax = Math.max(brakeMax, down);
    // 轴向串了的话（yaw=90°/270°）车头根本不会上下动，会严丝合缝地卡在 0
    if (Math.abs(up) < 0.05) deadAxes++;
  }
  ok(deadAxes === 0, '俯仰在所有朝向下都真的作用在车头（无失效轴向）', `失效朝向 ${deadAxes} 个`);
  ok(accelMin > 0.1, '给油时车头一律抬起（重量后移）', `最小 ${accelMin.toFixed(3)}m`);
  ok(brakeMax < -0.1, '刹车时车头一律下压（前轮载荷增加）', `最大 ${brakeMax.toFixed(3)}m`);
  console.log(`  · 抬头最低 ${accelMin.toFixed(3)}m / 点头最高 ${brakeMax.toFixed(3)}m`);
}

// ---- 档位与倒车 ---------------------------------------------------------
// 曾经的 bug：油门写成 (vLong < -0.5 ? -0.6 : 1)，意思是「倒车中再给油 = 继续倒」。
// 结果倒车后按 W 只会把车推得更远，永远出不来倒车状态，玩家以为油门坏了。
// 倒车必须由 S 键独占，油门永远是「往前」。
group('档位与倒车（守住「倒出去回不来」的回归）');
{
  const car = new Car({ scene: new THREE.Scene() });
  const drive = (secs, input) => {
    for (let i = 0; i < secs * 60; i++) {
      car.update(1 / 60, { throttle: 0, brake: 0, steer: 0, handbrake: false, ...input });
    }
  };

  drive(3, { throttle: 1 });
  ok(car.speed > 20, '全油门能跑起来', `${car.speed.toFixed(1)}m/s`);
  drive(4, { brake: 1 });
  ok(car.speed < -2, 'S 键能刹停并挂上倒挡', `${car.speed.toFixed(2)}m/s`);
  drive(1.5, { throttle: 1 });
  ok(car.speed > -1, '倒车中给油能刹回前进方向（不是继续倒）', `${car.speed.toFixed(2)}m/s`);
  drive(3, { throttle: 1 });
  ok(car.speed > 10, '倒车中给油后能正常加速', `${car.speed.toFixed(1)}m/s`);

  car.reset(0, 0, 0);
  drive(8, { brake: 1 });
  ok(car.speed <= -1 && car.speed >= -14.01, '倒车仍有速度上限（不会无限倒）', `${car.speed.toFixed(2)}m/s`);
  drive(8, { throttle: 1 });
  ok(car.speed > 5, '长时间满油门也能脱离倒车状态', `${car.speed.toFixed(2)}m/s`);
}

// ---- 植被层（foliage.js）------------------------------------------------
// 植被是异步加载的，浏览器里只能看到「3911 株」这种计数，看不出有没有树长在
// 马路上、悬在半空、或者长进房子里。所以把 planSpots 拉出来无头断言。
// 注意 foliage.js 只在函数内部用 three，加载路径不碰 DOM，Node 里可以安全 import。
import { planSpots, GROUND_Y } from '../src/foliage.js';

group('植被层');
{
  // 用 houses.js 同样的确定性规则造一批房子矩形，验证「不长进房子」
  const rng = makeRng(4242);
  const houseRects = [];
  for (const b of layout.blocks) {
    if (b.zone !== 'suburb') continue;
    for (let i = 0; i < 2; i++) {
      const x = b.x0 + 8 + rng() * (b.x1 - b.x0 - 16);
      const z = b.z0 + 8 + rng() * (b.z1 - b.z0 - 16);
      houseRects.push({ x, z, hw: 5, hd: 5 });
    }
  }
  const spots = planSpots(layout, houseRects).flat();

  ok(spots.length > 2000, '总株数 > 2000（绿化确实铺开了）', `n=${spots.length}`);
  ok(spots.length < 9000, '总株数未撞上限（说明密度是设计值不是兜底）', `n=${spots.length}`);

  // 1) 不许长在马路上：block 本身就是「相邻两条路之间」，落在 block 内即天然离路
  let onRoad = 0, minEdge = Infinity;
  for (const s of spots) {
    const b = layout.blocks.find((b) => s.x > b.x0 && s.x < b.x1 && s.z > b.z0 && s.z < b.z1);
    if (!b) continue;
    minEdge = Math.min(minEdge, s.x - b.x0, b.x1 - s.x, s.z - b.z0, b.z1 - s.z);
    // 再直接核一遍：离最近的路中心线必须大于「半路宽 + 路肩」
    const dv = layout.roadsV.reduce((m, r) => Math.min(m, Math.abs(s.x - r.pos) - r.w / 2), Infinity);
    const dh = layout.roadsH.reduce((m, r) => Math.min(m, Math.abs(s.z - r.pos) - r.w / 2), Infinity);
    if (dv < 0 || dh < 0) onRoad++;
  }
  ok(onRoad === 0, '没有一株压在路面上', `压路 ${onRoad} 株`);
  ok(minEdge >= 4.5, '离街区边界至少 4.5m（给人行道留位）', `实测 ${minEdge.toFixed(2)}m`);

  // 2) 不许悬空 / 埋太深：每株 y 必须严格等于「该分区地高 + 该模型下沉量」
  let badY = 0;
  for (const s of spots) {
    const b = layout.blocks.find((b) => s.x > b.x0 && s.x < b.x1 && s.z > b.z0 && s.z < b.z1);
    if (!b) continue;
    if (!(GROUND_Y[b.zone] >= 0) || s.y > GROUND_Y[b.zone] + 0.001) badY++;
  }
  ok(badY === 0, '没有一株高于所在分区的地面', `越界 ${badY} 株`);

  // 3) 不许长进房子（含 3m 余量，与实现保持一致）
  let inHouse = 0;
  for (const s of spots) {
    if (houseRects.some((h) => Math.abs(s.x - h.x) < h.hw + 3 && Math.abs(s.z - h.z) < h.hd + 3)) inHouse++;
  }
  ok(inHouse === 0, '没有一株与房子重叠', `重叠 ${inHouse} 株`);

  // 4) 海岸区不许种到海里
  let inSea = 0;
  for (const s of spots) {
    if (s.x > coastX(s.z) - 50) inSea++;
  }
  ok(inSea === 0, '没有一株种进海里', `下海 ${inSea} 株`);

  // 5) 同类最小间距（空间哈希去重是否真的生效）
  let tooClose = 0;
  const cell = 20;
  const grid = new Map();
  for (const s of spots) {
    const k = `${Math.floor(s.x / cell)},${Math.floor(s.z / cell)}`;
    const list = grid.get(k) || [];
    for (const o of list) {
      const d = Math.hypot(o.x - s.x, o.z - s.z);
      if (d < 1.3) tooClose++;
    }
    list.push(s);
    grid.set(k, list);
  }
  ok(tooClose === 0, '同格内无重叠株（最小间距 >= 1.3m）', `过近 ${tooClose} 对`);
  console.log(`  · 共 ${spots.length} 株，离街区边界最近 ${minEdge.toFixed(2)}m`);
}

group('结果');
console.log(`  ${pass} 通过 / ${fail} 失败`);
if (fail) {
  console.log('\n失败明细：');
  for (const f of failures) console.log('  ✗ ' + f);
  process.exit(1);
} else {
  console.log('  全部通过 ✓');
}
