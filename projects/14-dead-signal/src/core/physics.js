/* 物理层：旋转盒（OBB）碰撞世界 + 射线检测 + 角色移动求解 + 命中盒
 * 地图所有可碰撞体都是「绕 Y 轴旋转的盒子」，角色是「竖直长方体 + 头部球」，
 * 既能表达斜放的掩体，又能用解析法快速求解，不需要引入物理引擎。
 * （移植自本人前一工程并 ESM 化，删去了运输船专用的单向阀逻辑） */
import * as THREE from 'three';

export const CELL = 8; // 宽相网格边长（米）

export function World() {
  this.boxes = [];       // 静态碰撞盒
  this.grid = new Map(); // XZ 宽相网格
  this.actors = [];      // 动态命中盒（角色）
}

/* ---------- 碰撞盒 ---------- */
World.prototype.addBox = function (cx, cy, cz, sx, sy, sz, opts) {
  const o = opts || {};
  const yaw = o.yaw || 0;
  const b = {
    c: new THREE.Vector3(cx, cy, cz),
    h: new THREE.Vector3(sx * 0.5, sy * 0.5, sz * 0.5),
    yaw: yaw, cos: Math.cos(yaw), sin: Math.sin(yaw),
    solid: o.solid !== false,          // 阻挡移动
    blocksRay: o.blocksRay !== false,  // 阻挡子弹与视线
    step: o.step !== false,            // 允许被踩上（台阶/箱顶）
    name: o.name || '', tag: o.tag || '', group: o.group || ''   // group：同一组的盒子允许有意搭接（如墙角）
  };
  this.boxes.push(b);
  return b;
};

export function aabbOf(b, out) {
  const ex = Math.abs(b.cos) * b.h.x + Math.abs(b.sin) * b.h.z;
  const ez = Math.abs(b.sin) * b.h.x + Math.abs(b.cos) * b.h.z;
  out.minX = b.c.x - ex; out.maxX = b.c.x + ex;
  out.minY = b.c.y - b.h.y; out.maxY = b.c.y + b.h.y;
  out.minZ = b.c.z - ez; out.maxZ = b.c.z + ez;
  return out;
}

World.prototype.finish = function () {
  this.grid.clear();
  const tmp = {};
  for (let i = 0; i < this.boxes.length; i++) {
    const b = this.boxes[i];
    aabbOf(b, tmp);
    const gx0 = Math.floor(tmp.minX / CELL), gx1 = Math.floor(tmp.maxX / CELL);
    const gz0 = Math.floor(tmp.minZ / CELL), gz1 = Math.floor(tmp.maxZ / CELL);
    for (let gx = gx0; gx <= gx1; gx++) {
      for (let gz = gz0; gz <= gz1; gz++) {
        const k = gx + '_' + gz;
        let arr = this.grid.get(k);
        if (!arr) this.grid.set(k, (arr = []));
        arr.push(b);
      }
    }
  }
};

// 返回 (x,z) 附近 pad 范围内的候选盒数组
World.prototype.near = function (x, z, pad, out) {
  out = out || []; out.length = 0;
  const r = pad || 0;
  const gx0 = Math.floor((x - r) / CELL), gx1 = Math.floor((x + r) / CELL);
  const gz0 = Math.floor((z - r) / CELL), gz1 = Math.floor((z + r) / CELL);
  for (let gx = gx0; gx <= gx1; gx++) {
    for (let gz = gz0; gz <= gz1; gz++) {
      const arr = this.grid.get(gx + '_' + gz);
      if (arr) for (let i = 0; i < arr.length; i++) if (arr[i] && out.indexOf(arr[i]) < 0) out.push(arr[i]);
    }
  }
  return out;
};

/* ---------- 世界 <-> 盒局部 ---------- */
function toLocal(b, px, pz, out) {
  const dx = px - b.c.x, dz = pz - b.c.z;
  out.x = dx * b.cos + dz * b.sin;
  out.z = -dx * b.sin + dz * b.cos;
  return out;
}

// 圆与 OBB 的水平穿透修正：返回「把圆推出盒外所需的世界 XZ 位移向量」，无重叠返回 null
const _lp = { x: 0, z: 0 }, _wp = { x: 0, z: 0 };
export function pushCircleBox(px, pz, radius, b) {
  toLocal(b, px, pz, _lp);
  const dx = _lp.x, dz = _lp.z, ex = b.h.x, ez = b.h.z;
  // 最近点法：统一处理「角区 / 单轴 / 完全在内」三种情形
  const qx = dx < -ex ? -ex : dx > ex ? ex : dx;
  const qz = dz < -ez ? -ez : dz > ez ? ez : dz;
  let lx = 0, lz = 0;
  if (qx === dx && qz === dz) {
    // 圆心落在盒内：沿穿透最浅的轴推出
    const ox = ex - Math.abs(dx), oz = ez - Math.abs(dz);
    if (ox < oz) lx = (dx >= 0 ? 1 : -1) * (ox + radius);
    else lz = (dz >= 0 ? 1 : -1) * (oz + radius);
  } else {
    const ddx = dx - qx, ddz = dz - qz;
    const d2 = ddx * ddx + ddz * ddz;
    if (d2 >= radius * radius) return null;
    const d = Math.sqrt(d2);
    const pen = radius - d;
    lx = (ddx / d) * pen;
    lz = (ddz / d) * pen;
  }
  _wp.x = lx * b.cos - lz * b.sin;
  _wp.z = lx * b.sin + lz * b.cos;
  return _wp;
}

/* ---------- 射线 vs OBB（slab 法） ---------- */
const _ro = { x: 0, y: 0, z: 0 }, _rd = { x: 0, y: 0, z: 0 };
export function rayBox(ox, oy, oz, dx, dy, dz, b, maxDist) {
  toLocal(b, ox, oz, _ro);
  _rd.x = dx * b.cos + dz * b.sin;
  _rd.z = -dx * b.sin + dz * b.cos;
  const o = [_ro.x, oy - b.c.y, _ro.z], d = [_rd.x, dy, _rd.z], h = [b.h.x, b.h.y, b.h.z];
  let tmin = 0, tmax = maxDist, axis = -1, sign = 1;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-8) {
      if (o[i] < -h[i] || o[i] > h[i]) return null;
      continue;
    }
    let t1 = (-h[i] - o[i]) / d[i], t2 = (h[i] - o[i]) / d[i], s = -1;
    if (t1 > t2) { const tt = t1; t1 = t2; t2 = tt; s = 1; }
    if (t1 > tmin) { tmin = t1; axis = i; sign = s; }
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return null;
  }
  if (tmax < 0 || tmin > maxDist) return null;
  let nlx = 0, nly = 0, nlz = 0;
  if (axis === 0) nlx = sign; else if (axis === 1) nly = sign; else if (axis === 2) nlz = sign;
  return { t: Math.max(0, tmin), nx: nlx * b.cos - nlz * b.sin, ny: nly, nz: nlx * b.sin + nlz * b.cos, box: b };
}

function rayAABB(ox, oy, oz, dx, dy, dz, min, max, maxDist) {
  let tmin = 0, tmax = maxDist, axis = -1, sign = 1;
  const o = [ox, oy, oz], d = [dx, dy, dz];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-8) {
      if (o[i] < min[i] || o[i] > max[i]) return null;
      continue;
    }
    let t1 = (min[i] - o[i]) / d[i], t2 = (max[i] - o[i]) / d[i], s = -1;
    if (t1 > t2) { const tt = t1; t1 = t2; t2 = tt; s = 1; }
    if (t1 > tmin) { tmin = t1; axis = i; sign = s; }
    if (t2 < tmax) tmax = t2;
    if (tmin > tmax) return null;
  }
  if (axis < 0) return null;
  const n = [0, 0, 0]; n[axis] = sign;
  return { t: tmin, nx: n[0], ny: n[1], nz: n[2] };
}

function raySphere(ox, oy, oz, dx, dy, dz, cx, cy, cz, r, maxDist) {
  const lx = cx - ox, ly = cy - oy, lz = cz - oz;
  const b = lx * dx + ly * dy + lz * dz;
  if (b < 0) return null;
  const disc = b * b - (lx * lx + ly * ly + lz * lz - r * r);
  if (disc < 0) return null;
  const t = b - Math.sqrt(disc);
  if (t < 0 || t > maxDist) return null;
  const hx = ox + dx * t - cx, hy = oy + dy * t - cy, hz = oz + dz * t - cz;
  const l = Math.sqrt(hx * hx + hy * hy + hz * hz) || 1;
  return { t: t, nx: hx / l, ny: hy / l, nz: hz / l };
}

/* ---------- 角色命中盒 ---------- */
// a: { pos(脚底), height, bodyW, bodyD, headR, team, alive, owner }
World.prototype.addActor = function (a) { a._w = this; this.actors.push(a); return a; };
World.prototype.removeActor = function (a) { const i = this.actors.indexOf(a); if (i >= 0) this.actors.splice(i, 1); };

function hitActor(a, ro, rd, maxDist) {
  if (!a.alive || a.noHit) return null;
  const p = a.pos, hw = a.bodyW * 0.5, hd = a.bodyD * 0.5;
  const body = rayAABB(ro.x, ro.y, ro.z, rd.x, rd.y, rd.z,
    [p.x - hw, p.y + 0.02, p.z - hd], [p.x + hw, p.y + a.height * 0.78, p.z + hd], maxDist);
  // 腿部盒略窄，保证低处命中的手感
  const legs = rayAABB(ro.x, ro.y, ro.z, rd.x, rd.y, rd.z,
    [p.x - hw * 0.8, p.y, p.z - hd * 0.8], [p.x + hw * 0.8, p.y + a.height * 0.55, p.z + hd * 0.8], maxDist);
  const hy = p.y + a.height - 0.11;
  const head = raySphere(ro.x, ro.y, ro.z, rd.x, rd.y, rd.z, p.x, hy, p.z, a.headR, maxDist);
  let best = null, part = '';
  if (legs) { best = legs; part = 'body'; }
  if (body && (!best || body.t < best.t)) { best = body; part = 'body'; }
  if (head && (!best || head.t < best.t)) { best = head; part = 'head'; }
  return best ? { t: best.t, nx: best.nx, ny: best.ny, nz: best.nz, part: part } : null;
}

/* ---------- 统一射线
 * opt: { maxDist, actors, team(命中该阵营则忽略), skipActor } */
const _ro2 = { x: 0, y: 0, z: 0 }, _rd2 = { x: 0, y: 0, z: 0 };
World.prototype.raycast = function (origin, dir, opt) {
  opt = opt || {};
  const maxDist = opt.maxDist || 200;
  const ro = _ro2, rd = _rd2;
  ro.x = origin.x; ro.y = origin.y; ro.z = origin.z;
  rd.x = dir.x; rd.y = dir.y; rd.z = dir.z;
  let bestT = maxDist, hit = null;

  const seen = [];
  const step = CELL * 0.6;
  for (let s = 0; s <= bestT + step; s += step) {
    const px = ro.x + rd.x * Math.min(s, bestT), pz = ro.z + rd.z * Math.min(s, bestT);
    const arr = this.near(px, pz, 3, []);
    for (let i = 0; i < arr.length; i++) {
      const b = arr[i];
      if (!b.blocksRay || seen.indexOf(b) >= 0) continue;
      seen.push(b);
      const h = rayBox(ro.x, ro.y, ro.z, rd.x, rd.y, rd.z, b, bestT);
      if (h && h.t < bestT) {
        bestT = h.t;
        hit = { t: h.t, nx: h.nx, ny: h.ny, nz: h.nz, type: 'world', box: b, actor: null, part: '' };
      }
    }
    if (bestT <= s) break;
  }

  if (opt.actors !== false) {
    const list = this.actors;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (opt.skipActor === a || !a.alive || a.noHit) continue;
      if (opt.team != null && a.team === opt.team) continue;
      const cx = a.pos.x - ro.x, cz = a.pos.z - ro.z;
      const proj = cx * rd.x + cz * rd.z;
      if (proj < -3 || proj > bestT + 3) continue;
      const h = hitActor(a, ro, rd, bestT);
      if (h && h.t < bestT) {
        bestT = h.t;
        hit = { t: h.t, nx: h.nx, ny: h.ny, nz: h.nz, type: 'actor', actor: a.owner || a, actorBox: a, part: h.part, box: null };
      }
    }
  }
  if (hit) hit.point = new THREE.Vector3(ro.x + rd.x * hit.t, ro.y + rd.y * hit.t, ro.z + rd.z * hit.t);
  return hit;
};

// 视线是否被静态体遮挡
World.prototype.losBlocked = function (from, to) {
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (len < 0.01) return false;
  const h = this.raycast(from, { x: dx / len, y: dy / len, z: dz / len }, { maxDist: Math.max(0, len - 0.2), actors: false });
  return !!h;
};

/* ---------- 支撑面：返回 [refY - drop, refY + stepUp] 内可站立的最高面 ---------- */
World.prototype.supportY = function (x, z, radius, refY, stepUp, drop) {
  const su = stepUp == null ? 0.02 : stepUp;
  const dp = drop == null ? 3.5 : drop;
  const arr = this.near(x, z, radius + 3, []);
  let best = null;
  for (let i = 0; i < arr.length; i++) {
    const b = arr[i];
    if (!b.solid) continue;
    const top = b.c.y + b.h.y;
    if (top > refY + su || top < refY - dp) continue;
    toLocal(b, x, z, _lp);
    if (Math.abs(_lp.x) < b.h.x + radius && Math.abs(_lp.z) < b.h.z + radius) {
      if (best === null || top > best) best = top;
    }
  }
  return best;
};

// 头顶是否有空间
World.prototype.hasHeadroom = function (x, y, z, radius, height) {
  const arr = this.near(x, z, radius + 2, []);
  for (let i = 0; i < arr.length; i++) {
    const b = arr[i];
    if (!b.solid) continue;
    if (b.c.y + b.h.y <= y + 0.05 || b.c.y - b.h.y >= y + height - 0.05) continue;
    if (pushCircleBox(x, z, radius, b)) return false;
  }
  return true;
};

// 胶囊是否与静态体水平重叠（给定脚底高度）
World.prototype.overlapsSolid = function (x, y, z, radius, height) {
  const arr = this.near(x, z, radius + 2, []);
  return overlapsList(arr, x, y, z, radius, height);
};

// 同上，但不依赖宽相网格（建图阶段网格尚未 finish 时使用）
World.prototype.overlapsAll = function (x, y, z, radius, height) {
  return overlapsList(this.boxes, x, y, z, radius, height);
};

function overlapsList(arr, x, y, z, radius, height) {
  for (let i = 0; i < arr.length; i++) {
    const b = arr[i];
    if (!b.solid) continue;
    if (b.c.y + b.h.y <= y + 0.05 || b.c.y - b.h.y >= y + height - 0.05) continue;
    if (pushCircleBox(x, z, radius, b)) return true;
  }
  return false;
}

/* ---------- 角色移动求解 ----------
 * a: { pos(脚底), vel, radius, height }
 * opt: { stepUp, floor(无盒时的地面高度), killY } */
const _res = { onGround: false, groundY: 0, hitWall: false, landed: false, wallN: { x: 0, z: 0 } };
World.prototype.moveActor = function (a, dt, opt) {
  opt = opt || {};
  const stepUp = opt.stepUp != null ? opt.stepUp : 0.45;
  const R = a.radius, pos = a.pos, vel = a.vel;
  let hitWall = false;
  _res.wallN.x = 0; _res.wallN.z = 0;
  const prevY = pos.y, prevX = pos.x, prevZ = pos.z;

  // --- 水平：分轴推进，逐步推出 ---
  for (let axis = 0; axis < 2; axis++) {
    const k = axis === 0 ? 'x' : 'z';
    const d = axis === 0 ? vel.x * dt : vel.z * dt;
    if (Math.abs(d) < 1e-7) continue;
    pos[k] += d;
    for (let pass = 0; pass < 4; pass++) {
      const arr = this.near(pos.x, pos.z, R + 2, []);
      let moved = false;
      for (let i = 0; i < arr.length; i++) {
        const b = arr[i];
        if (!b.solid) continue;
        const top = b.c.y + b.h.y, bot = b.c.y - b.h.y;
        if (top <= pos.y + 0.02) continue;              // 已在脚下，可踩
        if (bot >= pos.y + a.height - 0.02) continue;   // 在头顶之上
        const corr = pushCircleBox(pos.x, pos.z, R, b);
        if (!corr) continue;                            // 水平未真正重叠（宽相粗筛会带进远处的盒）
        if (b.step !== false && (top - pos.y) <= stepUp) {
          // 矮障碍：有头顶空间就抬脚踏步
          if (this.hasHeadroom(pos.x, top + 0.001, pos.z, R, a.height)) { pos.y = top + 0.001; moved = true; continue; }
        }
        // corr 是「把圆推出盒外」的位移量，只取当前轴分量，另一轴留给下一个轴
        if (axis === 0) {
          if (Math.abs(corr.x) < 1e-5) continue;
          pos.x += corr.x; hitWall = true; _res.wallN.x = corr.x > 0 ? 1 : -1;
          moved = true;
        } else {
          if (Math.abs(corr.z) < 1e-5) continue;
          pos.z += corr.z; hitWall = true; _res.wallN.z = corr.z > 0 ? 1 : -1;
          moved = true;
        }
      }
      if (!moved) break;
    }
  }

  // --- 垂直 ---
  pos.y += vel.y * dt;
  const gy = this.supportY(pos.x, pos.z, R * 0.85, prevY, stepUp, Math.max(3.5, Math.abs(vel.y) * dt + 2));
  let floor = gy;
  if (floor == null && opt.floor != null) floor = opt.floor;
  let onGround = false, groundY = pos.y, landed = false;
  if (floor != null && vel.y <= 0 && pos.y <= floor + 0.002) {
    pos.y = floor; onGround = true; groundY = floor;
    if (a._fallSpeed == null || a._fallSpeed < -7) landed = true;
    vel.y = 0;
  } else if (floor != null && onGround === false && Math.abs(pos.y - floor) < 0.02) {
    pos.y = floor; onGround = true; groundY = floor; vel.y = 0;
  }
  if (opt.killY != null && pos.y < opt.killY) { pos.y = opt.killY; vel.y = 0; }

  // --- 侧向再次校正（抬脚后可能嵌进盒里） ---
  const arr2 = this.near(pos.x, pos.z, R + 2, []);
  for (let i = 0; i < arr2.length; i++) {
    const b = arr2[i];
    if (!b.solid) continue;
    if (b.c.y + b.h.y <= pos.y + 0.02 || b.c.y - b.h.y >= pos.y + a.height - 0.02) continue;
    const corr = pushCircleBox(pos.x, pos.z, R, b);
    if (corr) { pos.x += corr.x; pos.z += corr.z; }
  }

  _res.onGround = onGround; _res.groundY = groundY;
  _res.hitWall = hitWall; _res.landed = landed;
  return _res;
};

/* ---------- 地图穿模自检：返回互相穿模的实心盒清单（浏览器 console 工具）
 * 判定：三轴重叠都超过 0.3m 才算真穿模；同一 group（如墙体/塔体）的搭接直接跳过。 ---------- */
export function selfCheck(world, opts) {
  const eps = (opts && opts.eps) != null ? opts.eps : 0.3;
  const bad = [];
  const A = {}, B = {};
  const list = world.boxes.filter((b) => b.solid && b.blocksRay);
  for (let i = 0; i < list.length; i++) {
    aabbOf(list[i], A);
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      aabbOf(b, B);
      if (list[i].group && list[i].group === b.group) continue;
      const ox = Math.min(A.maxX, B.maxX) - Math.max(A.minX, B.minX);
      const oy = Math.min(A.maxY, B.maxY) - Math.max(A.minY, B.minY);
      const oz = Math.min(A.maxZ, B.maxZ) - Math.max(A.minZ, B.minZ);
      if (ox > eps && oy > eps && oz > eps) {
        bad.push([list[i].name || '盒' + i, b.name || '盒' + j, +ox.toFixed(2), +oy.toFixed(2), +oz.toFixed(2)]);
      }
    }
  }
  return bad;
}
