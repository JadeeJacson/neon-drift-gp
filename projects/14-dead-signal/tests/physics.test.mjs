/* 物理层单元测试：node tests/physics.test.mjs 直接运行（three 从 node_modules 解析）
 * 覆盖：圆-盒推出、踏步、落地、射线命中部位、阵营过滤、视线遮挡 */
import * as THREE from 'three';
import { World, pushCircleBox, selfCheck } from '../src/core/physics.js';

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ ' + name); }
}
function near(a, b, eps, name) { ok(Math.abs(a - b) < (eps || 0.02), name + ' (得到 ' + a.toFixed(3) + '，期望 ' + b + ')'); }

/* ---------- 1. 圆与轴对齐盒推出 ---------- */
{
  const w = new World();
  const b = w.addBox(0, 1, 0, 2, 2, 2, {});          // 中心原点、边长 2 的实心盒
  let c = pushCircleBox(0.5, 0, 0.3, b);              // 圆心在盒内偏 +x
  ok(!!c, '盒内应产生推出');
  ok(c.x > 0, '推出方向朝 +x');
  near(0.5 + c.x, 1.3, 0.001, '推出后贴合表面');

  c = pushCircleBox(2.0, 0, 0.3, b);                 // 距离 1.0 > r 无重叠
  ok(c === null, '盒外远处不相交');

  c = pushCircleBox(1.15, 0, 0.3, b);                // 轻微穿透 x 面
  ok(c && Math.abs(c.x) > 0.1 && Math.abs(c.x) < 0.35, '浅穿透按 x 轴推出');
  ok(Math.abs(c.z) < 1e-9, '浅穿透不应有 z 分量');

  c = pushCircleBox(1.2, 1.2, 0.35, b);              // 角区（距角 0.283 < r，存在重叠）
  ok(c && c.x > 0 && c.z > 0, '角区沿对角推出');
}

/* ---------- 2. 旋转盒（yaw 45°） ---------- */
{
  const w = new World();
  const d45 = Math.PI / 4;
  const b = w.addBox(0, 1, 0, 3, 2, 0.6, { yaw: d45 });
  const c = pushCircleBox(1.2, 1.2, 0.35, b);        // 斜盒对角线上应能推出
  ok(!!c, '45° 斜盒可推出');
}

/* ---------- 3. 角色移动：落地 / 踩箱 / 踏步 / 撞墙 ---------- */
{
  const w = new World();
  w.addBox(0, -0.5, 0, 20, 1, 20, {});               // 地面盒：顶面 y=0
  w.addBox(3, 0.5, 0, 2, 1, 2, {});                  // 高台：顶面 y=1
  w.addBox(6, 0.15, 0, 1, 0.3, 1, {});               // 矮槛：顶面 y=0.3
  w.addBox(9, 1, 0, 1, 2, 4, {});                    // 挡墙
  w.finish();

  const mk = (x, y) => ({ pos: new THREE.Vector3(x, y, 0), vel: new THREE.Vector3(), radius: 0.35, height: 1.8, _fallSpeed: 0 });

  // 自由落体到地面
  let a = mk(0, 3);
  let res;
  for (let i = 0; i < 120; i++) { a.vel.y -= 21 * 0.016; res = w.moveActor(a, 0.016, { floor: null }); }
  ok(res.onGround && Math.abs(a.pos.y - 0) < 0.01, '落到地面盒顶 (y=' + a.pos.y.toFixed(3) + ')');

  // 落到箱顶
  a = mk(3, 3);
  for (let i = 0; i < 120; i++) { a.vel.y -= 21 * 0.016; res = w.moveActor(a, 0.016, {}); }
  ok(res.onGround && Math.abs(a.pos.y - 1) < 0.01, '落到高台顶 (y=' + a.pos.y.toFixed(3) + ')');

  // 踏步上矮槛
  a = mk(5.0, 0);
  a.vel.x = 2;
  for (let i = 0; i < 60; i++) { a.vel.y -= 21 * 0.016; res = w.moveActor(a, 0.016, { stepUp: 0.5, floor: 0 }); }
  ok(a.pos.x > 6.2, '矮槛被踩上而非挡路 (x=' + a.pos.x.toFixed(2) + ')');
  ok(a.pos.y > 0.2, '踏步后脚底抬到槛顶附近 (y=' + a.pos.y.toFixed(2) + ')');

  // 撞墙停止
  a = mk(7.4, 0);
  a.vel.x = 3;
  for (let i = 0; i < 60; i++) { a.vel.y -= 21 * 0.016; res = w.moveActor(a, 0.016, { stepUp: 0.5, floor: 0 }); }
  ok(a.pos.x < 8.4 && res.hitWall, '高墙阻挡移动 (x=' + a.pos.x.toFixed(2) + ')');
}

/* ---------- 4. 射线命中角色：躯干 / 头 / 阵营过滤 / 遮挡 ---------- */
{
  const w = new World();
  w.addBox(0, -0.5, -20, 40, 1, 40, {});             // 地面（在射线路径之外）
  const actor = w.addActor({
    pos: new THREE.Vector3(0, 0, 5), vel: new THREE.Vector3(),
    radius: 0.35, height: 1.9, bodyW: 0.6, bodyD: 0.42, headR: 0.21,
    team: 'zombie', alive: true
  });
  w.finish();

  // 平射命中躯干
  let h = w.raycast(new THREE.Vector3(0, 1.2, 0), new THREE.Vector3(0, 0, 1), { maxDist: 30 });
  ok(h && h.type === 'actor' && h.part === 'body', '平射命中躯干');

  // 抬角命中头部：射线先碰到头球（球心 y=1.79），再才会进躯干盒
  h = w.raycast(new THREE.Vector3(0, 0.8, 3.6), new THREE.Vector3(0, 0.9, 1).normalize(), { maxDist: 30 });
  ok(h && h.type === 'actor' && h.part === 'head', '抬角命中头部 (part=' + (h && h.part) + ')');

  // 阵营过滤
  h = w.raycast(new THREE.Vector3(0, 1.2, 0), new THREE.Vector3(0, 0, 1), { maxDist: 30, team: 'zombie' });
  ok(!h || h.type !== 'actor', '同阵营被过滤');

  // 死亡角色不再被命中
  actor.alive = false;
  h = w.raycast(new THREE.Vector3(0, 1.2, 0), new THREE.Vector3(0, 0, 1), { maxDist: 30 });
  ok(!h || h.type !== 'actor', '死亡后不被命中');
  actor.alive = true;

  // 世界盒遮挡
  w.addBox(0, 1.2, 3, 2, 2, 0.4, {});
  w.finish();
  h = w.raycast(new THREE.Vector3(0, 1.2, 0), new THREE.Vector3(0, 0, 1), { maxDist: 30 });
  ok(h && h.type === 'world', '掩体挡住射线');
  ok(w.losBlocked(new THREE.Vector3(0, 1.2, 0), new THREE.Vector3(0, 1.2, 5)), 'losBlocked 判定正确');
}

/* ---------- 5. supportY 与 overlapsSolid ---------- */
{
  const w = new World();
  w.addBox(0, 0.5, 0, 4, 1, 4, {});
  w.finish();
  ok(w.supportY(0, 0, 0.3, 0.9, 0.1, 2) === 1, '台顶支撑面 y=1');
  ok(w.supportY(10, 10, 0.3, 0.5, 0.1, 2) === null, '远处无支撑');
  ok(w.overlapsSolid(0, 0.2, 0, 0.35, 1.8) === true, '盒内判定重叠');
  ok(w.overlapsSolid(3, 0.2, 0, 0.35, 1.8) === false, '盒外不重叠');
}

/* ---------- 6. selfCheck：干净地图应无穿模告警 ---------- */
{
  const w = new World();
  w.addBox(0, 1, 0, 2, 2, 2, { name: 'A' });
  w.addBox(5, 1, 0, 2, 2, 2, { name: 'B' });
  w.addBox(1.05, 1, 0, 2, 2, 2, { name: 'C(与A重叠)' });
  w.finish();
  const bad = selfCheck(w);
  ok(bad.length === 1, '穿模自检抓到 A/C 重叠 (抓到 ' + bad.length + ' 组)');
}

console.log(fail === 0 ? 'PASS ' + pass + '/' + pass : 'FAIL 通过 ' + pass + ' / 失败 ' + fail);
process.exit(fail === 0 ? 0 : 1);
