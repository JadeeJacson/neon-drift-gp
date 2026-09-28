/* 射击中枢：弹药状态机（开火/换弹/逐发压弹/切枪）+ hitscan 结算 + 军刀近战
 * game.js 负责读输入并计时，本模块负责“这一枪打出去发生什么”。 */
import * as THREE from 'three';
import { defs, knifeDef, melee, currentSpread, rollDamage } from '../weapons/weapons.js';
import { rand, deg, bus } from '../core/util.js';
import { Vm } from '../weapons/viewmodel.js';
import { Snd } from '../core/audio.js';
import { R } from '../core/render.js';
import { Fx } from '../fx/effects.js';

const _aim = new THREE.Vector3();
const _eye = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _cone = new THREE.Vector3();
const _up = new THREE.Vector3();
const _end = new THREE.Vector3();

/* ---------- 弹药状态 ---------- */
export function makeWeapons(start, slots) {
  const w = { slots: slots || [start, 'pistol'], cur: 0, mag: {}, reserve: {}, unlock: {} };
  for (const key of w.slots) {
    if (key === 'knife') continue;
    w.mag[key] = defs[key].mag;
    w.reserve[key] = defs[key].reserveMax;
  }
  return w;
}
export function curDef(W) { const k = W.slots[W.cur]; return k === 'knife' ? knifeDef : defs[k]; }

export function unlockWeapon(W, key) {                 // 抵墙购买：替换主武器槽
  if (W.unlock[key]) return;
  W.unlock[key] = true;
  W.slots[0] = key;
  W.mag[key] = defs[key].mag;
  W.reserve[key] = defs[key].reserveMax;
  W.cur = 0;
}

export function giveAmmo(W) {                           // 补弹站
  for (const key in W.mag) {
    if (key === 'knife') continue;
    W.mag[key] = defs[key].mag;
    W.reserve[key] = defs[key].reserveMax;
  }
}

/* ---------- 换弹 ---------- */
export function tryReload(RS, W, t) {
  const def = curDef(W);
  if (RS.kind !== 'none' || W.mag[def.key] >= def.mag || W.reserve[def.key] <= 0) return false;
  if (def.reloadPerShell) {
    RS.kind = 'shell'; RS.t0 = t; RS.dur = def.reload;
  } else {
    RS.kind = 'reload'; RS.t0 = t; RS.dur = def.reload;
    Snd.mech('pickup');
  }
  Vm.setReloadDur(def.reload); Vm.kick('reload');
  return true;
}

export function cancelReload(RS) { RS.kind = 'none'; }

// 每帧推进换弹；RS = { kind, t0, dur }
export function updateReload(RS, W, t) {
  if (RS.kind === 'none') return;
  const def = curDef(W);
  if (def.reloadPerShell && RS.kind === 'shell') {
    // 逐发压弹：每 dur 秒压入一发，打到空仓或按开火即中断
    if (t - RS.t0 >= RS.dur) {
      RS.t0 = t;
      W.mag[def.key]++; W.reserve[def.key]--;
      Snd.mech('magin');
      if (W.mag[def.key] >= def.mag || W.reserve[def.key] <= 0) RS.kind = 'none';
      else Vm.kick('reload'), Vm.setReloadDur(RS.dur);
    }
    return;
  }
  if (t - RS.t0 >= RS.dur) {
    const need = def.mag - W.mag[def.key], take = Math.min(need, W.reserve[def.key]);
    W.mag[def.key] += take; W.reserve[def.key] -= take;
    RS.kind = 'none';
    Snd.mech('charge');
  }
}

/* ---------- 切枪 ---------- */
export function switchTo(W, idx, RS) {
  if (idx < 0 || idx >= W.slots.length || idx === W.cur) return false;
  W.cur = idx;
  RS.kind = 'none';
  Vm.show(W.slots[idx] === 'knife' ? 'knife' : W.slots[idx]);
  Vm.kick('draw');
  return true;
}

/* ---------- 开火 ----------
 * 返回 { status: 'shot'|'dry'|'blocked', hits: [{char, part, point, dmg}] }；
 * 命中结算（扣血/击杀）由 game.js 根据 hits 执行，本函数只负责弹道。 */
export function fire(RS, W, player, world, t, opts = {}) {
  const out = { status: 'blocked', hits: [] };
  const def = curDef(W);
  if (RS.kind !== 'none' || player.dead) return out;
  if (W.mag[def.key] <= 0) {
    if (player.lastDry == null || t - player.lastDry >= 0.4) {
      player.lastDry = t;
      Snd.mech('dry');
      tryReload(RS, W, t);
      out.status = 'dry';
    }
    return out;
  }
  W.mag[def.key]--;
  out.status = 'shot';

  // 视线基底：以玩家眼位与相机朝向为中心加散布锥（不直接读相机，便于无头测试）
  player.getAimDir(_aim);
  player.eyePos(_eye);
  _up.crossVectors(_aim, new THREE.Vector3(0, 1, 0)).normalize();   // 侧向
  _cone.crossVectors(_aim, _up).normalize();                        // 纵向
  const spread = deg(currentSpread(def, player));

  const pellets = def.pellets || 1;

  for (let p = 0; p < pellets; p++) {
    const ang = Math.sqrt(Math.random()) * spread;   // sqrt 保证圆盘均匀
    const phi = rand(0, Math.PI * 2);
    _dir.copy(_aim)
      .addScaledVector(_up, Math.cos(phi) * Math.tan(ang))
      .addScaledVector(_cone, Math.sin(phi) * Math.tan(ang))
      .normalize();

    // team: 'player' —— 忽略玩家一方的命中盒，只留下亡灵
    const hit = world.raycast(_eye, _dir, { maxDist: 160, team: 'player', skipActor: player.actor });
    const muzzle = Vm.muzzleWorld || _eye;              // 枪模未初始化时以眼位作曳光起点
    if (!hit) { _end.copy(_eye).addScaledVector(_dir, 90); Fx.tracer(muzzle, _end); continue; }

    Fx.tracer(muzzle, _end.copy(hit.point));

    if (hit.type === 'actor') {
      const dist = _eye.distanceTo(hit.point);
      out.hits.push({
        char: hit.actor, part: hit.part, point: hit.point,
        dir: _dir.clone(), dmg: rollDamage(def, hit.part, dist), dist
      });
    } else if (hit.type === 'world') {
      Fx.bulletHole(hit.point, hit.nx, hit.ny, hit.nz);
    }
  }

  // 后坐 / 枪声 / 弹壳
  player.addRecoil(def, player.sprinting ? 1.3 : 1);
  Snd.shot(def.sound);
  Fx.casings(R.camera, 1);          // 无头环境下 R.camera 为 null，casings 自行跳过
  return out;
}

/* ---------- 军刀近战 ---------- */
export function meleeAttack(W, player, world, bots, t) {
  if (player.dead || (player.meleeCd || 0) > t) return false;
  player.meleeCd = t + melee.cooldown;
  Vm.show('knife');
  Vm.kick('melee');
  Snd.melee(false);
  // 延迟 0.16s 判定（挥到位）
  setTimeout(() => {
    if (player.dead) return;
    player.getAimDir(_aim);
    player.eyePos(_eye);
    let best = null, bestT = 1e9;
    for (const z of bots.list) {
      if (!z.alive) continue;
      const a = z.char.actor;
      _dir.set(a.pos.x - _eye.x, (a.pos.y + 1.1) - _eye.y, a.pos.z - _eye.z);
      const d = _dir.length();
      if (d > melee.range + 0.5) continue;
      _dir.normalize();
      if (_dir.dot(_aim) < 0.62) continue;            // 约 52° 内
      if (d < bestT) { bestT = d; best = z; }
    }
    if (best) {
      Snd.melee(true);
      _dir.copy(best.char.actor.pos).sub(_eye).normalize();
      // 与射击同一结算通道：由 game.js 读 hits 扣血
      bus.emit('melee_result', {
        char: best.char, part: Math.random() < 0.3 ? 'head' : 'body',
        point: best.char.actor.pos.clone().setY(best.char.actor.pos.y + 1.2),
        dir: _dir, dmg: melee.dmg, dist: bestT
      });
    }
  }, 160);
  return true;
}
