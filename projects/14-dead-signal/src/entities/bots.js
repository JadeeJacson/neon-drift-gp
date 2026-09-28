/* 亡灵 AI：A* 追击 + 群体分离 + 视线直冲 + 扑咬；被击退短暂硬直
 * 不攻击“战术”，只制造“尸潮压力”：目标永远是玩家，路径被堵就贴着墙绕行。 */
import * as THREE from 'three';
import { rand, chance, bus } from '../core/util.js';
import { ZombieChar } from './character.js';
import { Snd } from '../core/audio.js';

const _tmp = new THREE.Vector3();
const _tmp2 = new THREE.Vector3();
const _eye = new THREE.Vector3();

export class Bots {
  constructor(world, nav, player, scene) {
    this.world = world; this.nav = nav; this.player = player; this.scene = scene;
    this.list = [];
    this.maxAlive = 26;
  }

  spawn(x, z, hp, speed, team) {
    if (this.list.length >= this.maxAlive + 8) return null;
    const z_ = new ZombieChar(this.world, { team: team || 'zombie' });
    z_.char = z_;                         // 统一访问路径：结算代码拿到的条目总有 .char
    this.scene.add(z_.group);
    z_.place(x, 0.05, z);
    z_.hp = hp; z_.maxHp = hp; z_.speed = speed;
    z_.path = null; z_.pathIdx = 0; z_.repathT = rand(0, 1.2);
    z_.atkCd = rand(0.4, 1.2); z_.groanCd = rand(0.5, 5);
    z_.stuckT = 0; z_.lastX = x; z_.lastZ = z;
    z_.alive = true;
    this.list.push(z_);
    return z_;
  }

  // 玩家受击与击杀都通过事件总线广播，UI/音效各自订阅
  damage(z, dmg, part, knockDir) {
    if (!z.alive) return;
    z.hp -= dmg;
    z.char.hitReact();
    // 轻微击退
    z.char.actor.pos.addScaledVector(knockDir, 0.06);
    if (z.hp <= 0) this._kill(z, part === 'head');
  }

  _kill(z, head) {
    if (!z.alive) return;
    z.alive = false;
    z.char.kill();
    z.removeT = 2.3;
    const p = z.char.actor.pos;
    bus.emit('zombie_killed', { name: z.char.name, head, x: p.x, z: p.z });
    if (p.distanceTo(this.player.actor.pos) < 20) Snd.dead();
  }

  update(dt) {
    const P = this.player, pPos = P.actor.pos;
    const eye = P.eyePos(_eye);

    // 群体分离：两两检查（尸群规模小，O(n²) 可接受）
    for (let i = 0; i < this.list.length; i++) {
      const a = this.list[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < this.list.length; j++) {
        const b = this.list[j];
        if (!b.alive) continue;
        const pa = a.char.actor.pos, pb = b.char.actor.pos;
        const dx = pb.x - pa.x, dz = pb.z - pa.z;
        const d2 = dx * dx + dz * dz;
        if (d2 < 0.64 && d2 > 1e-6) {
          const d = Math.sqrt(d2), push = (0.8 - d) * 0.5;
          const ux = dx / d, uz = dz / d;
          pa.x -= ux * push; pa.z -= uz * push;
          pb.x += ux * push; pb.z += uz * push;
        }
      }
    }

    for (let i = this.list.length - 1; i >= 0; i--) {
      const z = this.list[i];
      const ch = z.char, a = ch.actor;

      // 死亡处理与移除
      if (!z.alive) {
        ch.update(dt, a.facingYaw || 0);
        a.pos.y = Math.max(0, a.pos.y);
        z.removeT -= dt;
        if (z.removeT <= 0) {
          ch.dispose(this.world);
          if (ch.group.parent) ch.group.parent.remove(ch.group);
          this.list.splice(i, 1);
        }
        continue;
      }

      const dx = pPos.x - a.pos.x, dz = pPos.z - a.pos.z;
      const dist = Math.hypot(dx, dz);

      // 嘶吼（给玩家方位信息）
      z.groanCd -= dt;
      if (z.groanCd <= 0 && dist < 22) {
        z.groanCd = rand(3.5, 9);
        Snd.groan(dist);
      }

      // 攻击判定：近身且有视线
      z.atkCd -= dt;
      if (dist < 1.75 && !P.dead && z.atkCd <= 0 && ch.state !== 'stagger') {
        _tmp.set(a.pos.x, a.pos.y + 1.5, a.pos.z);
        if (!this.world.losBlocked(_tmp, eye)) {
          z.atkCd = 1.3;                    // 扑咬间隔：留出走位与回血窗口
          ch.state = 'attack'; ch.attackT = -1;
          z.biteAt = 0.3; z.biteDmg = 18 + Math.round((z.speed - 1.5) * 8);   // 前扑动画播到顶点时结算
        }
      }

      // 扑咬结算（随游戏时基走，暂停即冻结）
      if (z.biteAt > 0) {
        z.biteAt -= dt;
        if (z.biteAt <= 0 && !P.dead && dist < 2.3) {
          P.damage(z.biteDmg, a.pos);
          bus.emit('player_damage', { from: a.pos });
        }
      }

      // 目标速度方向：优先沿 A* 路径，其次视线直冲，最后兜底直线
      let tx = dx, tz = dz;
      const losOK = dist < 30 && !this.world.losBlocked(_tmp.set(a.pos.x, a.pos.y + 1.4, a.pos.z), _tmp2.copy(pPos).setY(pPos.y + 1.4));
      if (losOK && dist < 12) {
        z.path = null;                              // 看得清就直接冲
      } else {
        z.repathT -= dt;
        if (!z.path || z.pathIdx >= z.path.length || z.repathT <= 0) {
          z.path = this.nav.findPath(a.pos.x, a.pos.z, pPos.x, pPos.z);
          z.pathIdx = 0;
          z.repathT = rand(0.9, 1.6);
        }
        if (z.path && z.path.length) {
          // 推进到下一个路点
          while (z.pathIdx < z.path.length) {
            const wp = z.path[z.pathIdx];
            const wdx = wp[0] - a.pos.x, wdz = wp[1] - a.pos.z;
            if (wdx * wdx + wdz * wdz < 1.4) z.pathIdx++;
            else { tx = wdx; tz = wdz; break; }
          }
          if (z.pathIdx >= z.path.length) { tx = dx; tz = dz; }
        }
      }

      // 卡住兜底：判定必须按「实际位移 / 期望位移」算，且阈值要含 dt。
      // 原写法 moved < 0.02 * speed 是不含 dt 的绝对阈值：60fps 下正常行走每帧只移动
      // 约 0.015 米（speed 0.9），小于阈值 0.03 → 正常前进的僵尸被误判为卡住并触发
      // 侧向绕行，表现为原地来回震荡（实测 5 只里 3 只如此，距离十几秒不变）。
      const expect = Math.max(1e-5, (z.speed || 1.5) * dt);
      const moved = Math.hypot(a.pos.x - z.lastX, a.pos.z - z.lastZ);
      z.lastX = a.pos.x; z.lastZ = a.pos.z;
      if (moved < expect * 0.25) z.stuckT += dt;
      else z.stuckT = Math.max(0, z.stuckT - dt * 2);          // 一恢复移动就快速消气
      if (z.stuckT > 0.9) {
        const side = z.sideSign || (z.sideSign = chance(0.5) ? 1 : -1);
        const nt = tx, nn = tz;
        tx = -tz * side + nt * 0.3; tz = nt * side + nn * 0.3;
        if (z.stuckT > 2.4) {
          z.stuckT = 0; z.sideSign = -side;
          z.path = null; z.repathT = 0;                        // 别只换边，强制重算一条路
        }
      }

      // 施加移动
      const tl = Math.hypot(tx, tz) || 1;
      const sp = z.speed * (ch.state === 'stagger' ? 0.2 : 1);
      a.vel.x = (tx / tl) * sp;
      a.vel.z = (tz / tl) * sp;
      a.vel.y = Math.max(-24, (a.vel.y || 0) - 21 * dt);
      this.world.moveActor(a, dt, { stepUp: 0.5, floor: 0 });
      a._fallSpeed = a.vel.y;
      a.pos.y = Math.max(0, a.pos.y);

      // 朝向：平滑转向目标
      const wantYaw = Math.atan2(dx, dz);
      a.facingYaw = a.facingYaw === undefined ? wantYaw : a.facingYaw + wrap(wantYaw - a.facingYaw) * Math.min(1, dt * 4);

      ch.speed = Math.hypot(a.vel.x, a.vel.z);
      ch.update(dt, a.facingYaw);
    }
  }

  aliveCount() { let n = 0; for (const z of this.list) if (z.alive) n++; return n; }

  clear() {
    for (const z of this.list) {
      z.char.dispose(this.world);
      if (z.char.group.parent) z.char.group.parent.remove(z.char.group);
    }
    this.list = [];
  }
}

function wrap(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
