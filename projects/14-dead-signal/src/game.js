/* DEAD SIGNAL 入口：启动装配 + 对局状态机（标题/加载/对战/暂停/结算）+ 回合导演 + 主循环
 * 依赖方向：game → {ui, entities, weapons, world, fx} → core；模块间事件走 util.bus。 */
import * as THREE from 'three';
import { bus, makeFps, store, clamp, rand, fmtTime } from './core/util.js';
import { R } from './core/render.js';
import { Input } from './core/input.js';
import { Snd } from './core/audio.js';
import { tex } from './core/textures.js';
import { selfCheck } from './core/physics.js';
import * as WorldMap from './world/map.js';
import { Sky } from './world/sky.js';
import { Player } from './entities/player.js';
import { Bots } from './entities/bots.js';
import { Vm } from './weapons/viewmodel.js';
import { defs, zombieMaxHp, zombieSpeed } from './weapons/weapons.js';
import * as Sh from './weapons/shooting.js';
import { Fx } from './fx/effects.js';
import { Hud } from './ui/hud.js';
import { Menu } from './ui/menu.js';

const G = {
  mode: 'boot',              // boot | menu | loading | play | pause | over
  t: 0,
  map: null, sky: null, player: null, bots: null,
  W: null, RS: { kind: 'none', t0: 0, dur: 0 },
  round: 0, pending: 0, spawnCd: 0, interT: 0, between: false,
  points: 0, entryByChar: new Map(),
  lastFireAt: -9, recoilKick: 0, flashT: 0,
  _semiLatch: false,
  deathT: -1,
  settings: Object.assign({ sens: 1 }, store.load())
};

/* ---------- 启动 ---------- */
function boot() {
  const canvas = document.getElementById('gl');
  R.init(canvas);
  Input.init(canvas);
  Input.sensitivity = G.settings.sens;
  Hud.init();
  Menu.init({
    onStart: startRoundGame,
    onResume: () => setPause(false),
    onRestart: startRoundGame
  });
  Vm.init();

  // 触屏
  if (Input.touch) {
    document.getElementById('touchLayer').classList.add('on');
    window.__touch = Input.Touch(document.getElementById('touchLayer'));
  }

  bus.on('escape', () => {
    if (G.mode === 'play') setPause(true);
    else if (G.mode === 'pause') setPause(false);
  });
  bus.on('lockchange', (locked) => {
    if (!locked && G.mode === 'play') setPause(true);
  });
  canvas.addEventListener('click', () => {
    if (G.mode === 'play' && !Input.locked) Input.lock();
  });

  Menu.title();
  requestAnimationFrame(frame);
}

/* ---------- 分帧加载（进度条可见） ---------- */
function startRoundGame() {
  Snd.init();
  G.mode = 'loading';
  Menu.loadStart();
  const steps = [
    ['生成程序化贴图…', () => { ['dirt', 'concrete', 'brick', 'plaster', 'metal', 'crate', 'sandbag'].forEach((n) => tex(n)); }],
    ['搭建前哨站…', () => {
      if (G.map) return;                                     // 地图只建一次，重开复用
      G.map = WorldMap.build(R.scene);
      G.sky = Sky.build(R.scene);
      G.player = new Player(G.map.world, G.map.spawn);
      G.bots = new Bots(G.map.world, G.map.nav, G.player, R.scene);
      Fx.init(R.scene, G.map.world);
      bus.on('zombie_killed', onZombieKilled);
      bus.on('player_damage', onPlayerDamage);
      bus.on('melee_result', onMeleeResult);
    }],
    ['整备军械…', () => { resetLoadout(); }],
    ['唤醒亡灵…', () => { resetRun(); }]
  ];
  let i = 0;
  const next = () => {
    if (i >= steps.length) {
      Menu.loadDone();
      Hud.show(true);
      G.mode = 'play';
      Input.lock();
      return;
    }
    Menu.phase(i, steps.length, steps[i][0]);
    steps[i][1]();
    i++;
    requestAnimationFrame(next);
  };
  next();
}

function resetLoadout() {
  G.W = Sh.makeWeapons('rifle', ['rifle', 'pistol', 'knife']);
  G.RS = { kind: 'none', t0: 0, dur: 0 };
  Vm.show('rifle');
  Vm.kick('draw');
}

function resetRun() {
  const P = G.player;
  P.dead = false; P.actor.alive = true; P.hp = P.maxHp; P.regenDelay = 0;
  P.place(G.map.spawn);
  P.stats = { shots: 0, hits: 0, kills: 0, heads: 0, time: 0 };
  G.bots.clear();
  G.entryByChar.clear();
  G.round = 0; G.pending = 0; G.between = true; G.interT = 2.6; G.points = 2000;
  G.deathT = -1;
  R.camera.rotation.set(0, Math.PI, 0);
  P.yaw = Math.PI; P.pitch = 0;
  Hud.objective('找到武器，活过第一夜');
}

/* ---------- 回合导演 ---------- */
function beginRound() {
  G.round++;
  G.pending = 4 + G.round * 3;
  G.between = false;
  G.spawnCd = 0;
  Snd.roundStart();
  Hud.announce('ROUND ' + G.round);
  Hud.objective('清除本轮亡灵 · 点数抵墙购买武器与弹药');
}

function updateDirector(dt) {
  const B = G.bots;
  if (G.between) {
    G.interT -= dt;
    if (G.interT <= 0) beginRound();
    return;
  }
  // 分批出尸：前期压力低（靠间距与卡点拉距），逐轮抬高在场上限
  const alive = B.aliveCount();
  const cap = Math.min(B.maxAlive, 3 + G.round * 2);
  G.spawnCd -= dt;
  if (G.pending > 0 && alive < cap && G.spawnCd <= 0) {
    G.spawnCd = 1.4;
    const n = Math.min(G.pending, 1 + ((G.round / 3) | 0));
    for (let k = 0; k < n; k++) spawnZombie();
  }
  // 回合清空 → 间歇
  if (G.pending === 0 && alive === 0 && !G.between) {
    G.between = true;
    G.interT = 12;
    G.points += 300;
    Hud.announce('第 ' + G.round + ' 轮已肃清');
    Hud.objective('间歇 ' + Math.ceil(G.interT) + ' 秒 —— 趁机补弹买枪');
  }
  if (G.between && G.interT > 0) Hud.objective('间歇 ' + Math.ceil(G.interT) + ' 秒 —— 趁机补弹买枪');

  // 氛围：远处偶尔哨声/群吼
  if (Math.random() < dt * 0.06) Snd.whistle();
}

function spawnZombie() {
  const gates = G.map.gates;
  const g = gates[(Math.random() * gates.length) | 0];
  const hp = zombieMaxHp(G.round);
  let sp = zombieSpeed(G.round);
  if (G.round >= 4 && Math.random() < 0.22) sp *= 1.55;       // 疯跑者
  const x = g.pos[0] + rand(-1.6, 1.6);
  const z = g.pos[2] + rand(-0.5, 2.4);                        // 闸口内侧
  const entry = G.bots.spawn(x, z, hp, sp);
  if (!entry) return;
  G.pending--;
  G.entryByChar.set(entry.char, entry);
}

/* ---------- 命中与事件结算 ---------- */
function applyHits(hits) {
  const P = G.player;
  for (const h of hits) {
    P.stats.hits++;
    // raycast 命中时 actor.owner 即 ZombieChar（= Bots 条目，spawn 时已把 .char 指向自身）
    const entry = h.char;
    if (!entry || !entry.alive) continue;
    Fx.blood(h.point, -h.dir.x, -h.dir.y + 0.4, -h.dir.z, h.dmg > 120);
    const wasAlive = entry.alive;
    G.bots.damage(entry, h.dmg, h.part, h.dir);
    if (wasAlive) {
      const head = h.part === 'head';
      Hud.hitmarker(head);
      G.points += 10;
      Snd.ching(head);
    }
  }
}

function onMeleeResult(r) {
  const entry = r.char;              // 同上：直接就是 Bots 条目
  if (!entry || !entry.alive) return;
  Fx.blood(r.point, -r.dir.x, 0.4, -r.dir.z, true);
  G.bots.damage(entry, r.dmg, r.part, r.dir);
  Hud.hitmarker(r.part === 'head');
  G.points += 10;
}

function onZombieKilled(ev) {
  const P = G.player;
  P.stats.kills++;
  if (ev.head) P.stats.heads++;
  G.points += ev.head ? 200 : 60;
  Hud.kill(ev.name, ev.head);
  Fx.burst(new THREE.Vector3(ev.x, 1.2, ev.z));
}

function onPlayerDamage(ev) {
  Hud.flashDamage(0.35 + (1 - G.player.hp / G.player.maxHp) * 0.4);
  if (ev.from) Hud.damageDir(ev.from.x, ev.from.z, G.player.yaw);
}

/* ---------- 暂停 ---------- */
function setPause(on) {
  if (on && G.mode === 'play') { G.mode = 'pause'; Input.unlock(); Menu.pause(true, Input.sensitivity); }
  else if (!on && G.mode === 'pause') { G.mode = 'play'; Menu.pause(false); Input.lock(); }
}

/* ---------- 输入意图 → 玩家/射击 ---------- */
function readIntent(look) {
  const I = Input, T = window.__touch;
  const want = {
    fwd: (I.down('forward') ? 1 : 0) - (I.down('back') ? 1 : 0),
    right: (I.down('right') ? 1 : 0) - (I.down('left') ? 1 : 0),
    jump: I.down('jump'), crouch: I.down('crouch'),
    sprint: I.down('shift') || (T && T.btn.sprint),
    ads: I.mouseDown('right') && !G.player.sprinting,
    firing: false, fireNow: false,
    adsFov: Sh.curDef(G.W).adsFov || 63
  };
  if (T) { want.fwd += -T.move.y; want.right += T.move.x; if (T.btn.jump) want.jump = true; }
  return want;
}

function handleActions(want, look) {
  const I = Input, G_ = G, t = G.t;
  // 灵敏度
  if (I.wasPressed('sensUp')) { Input.sensitivity = clamp(Input.sensitivity * 1.2, 0.2, 5); store.save({ sens: Input.sensitivity }); }
  if (I.wasPressed('sensDown')) { Input.sensitivity = clamp(Input.sensitivity / 1.2, 0.2, 5); store.save({ sens: Input.sensitivity }); }

  const key = G.W.slots[G.W.cur];

  // 开火
  const def = Sh.curDef(G.W);
  const fireHeld = (I.mouseDown('left') || (window.__touch && window.__touch.btn.fire)) && !G.player.sprinting;
  const wantFire = def.auto ? fireHeld : (I.wasPressed('fire') || (fireHeld && !G._semiLatch));
  if (def.auto) {
    if (fireHeld && t - G.lastFireAt >= 60 / def.rpm) { G.lastFireAt = t; doFire(); }
  } else {
    if (wantFire && t - G.lastFireAt >= 60 / def.rpm) { G.lastFireAt = t; G._semiLatch = true; doFire(); }
    if (!fireHeld) G._semiLatch = false;
  }
  want.firing = fireHeld && t - G.lastFireAt < 0.12;

  // 换弹 / 打断逐发压弹
  if (I.wasPressed('reload')) {
    if (G.RS.kind === 'shell') Sh.cancelReload(G.RS);
    else Sh.tryReload(G.RS, G.W, t);
  }
  // 近战：V 在军刀/主武器间切换；持刀时顺便挥一刀
  if (I.wasPressed('melee')) {
    if (key !== 'knife') { G.W.cur = 2; G.RS.kind = 'none'; Vm.show('knife'); Vm.kick('draw'); }
    else { G.W.cur = 0; G.RS.kind = 'none'; Vm.show(G.W.slots[0]); Vm.kick('draw'); Sh.meleeAttack(G.W, G.player, G.map.world, G.bots, t); }
  }
  if (key === 'knife' && fireHeld && t - (G.knifeSwingAt || -9) > 0.65) {
    G.knifeSwingAt = t; G.lastFireAt = t;
    Sh.meleeAttack(G.W, G.player, G.map.world, G.bots, t);
  }
  // 切枪：1 主武器 / 2 手枪 / 3 军刀；滚轮循环
  if (I.wasPressed('1')) Sh.switchTo(G.W, G.W.cur === 0 ? 1 : 0, G.RS);
  if (I.wasPressed('2')) Sh.switchTo(G.W, G.W.cur === 1 ? 0 : 1, G.RS);
  if (I.wasPressed('3')) Sh.switchTo(G.W, G.W.cur === 2 ? 0 : 2, G.RS);
  if (I.wheel) { const n = G.W.slots.length; Sh.switchTo(G.W, (G.W.cur + (I.wheel > 0 ? 1 : n - 1)) % n, G.RS); }

  // 抵墙购买
  updateBuyZones();
}

function doFire() {
  const res = Sh.fire(G.RS, G.W, G.player, G.map.world, G.t);
  G.player.stats.shots += (Sh.curDef(G.W).pellets || 1);
  if (res.status === 'shot') {
    G.recoilKick = 1;
    G.flashT = Sh.curDef(G.W).key === 'shotgun' ? 0.08 : 0.05;
    applyHits(res.hits);
  }
}

/* ---------- 购买点 ---------- */
function updateBuyZones() {
  const P = G.player, pos = P.actor.pos;
  let near = null;
  for (const b of G.map.buys) {
    const d = Math.hypot(pos.x - b.pos.x, pos.z - b.pos.z);
    if (d < 2.0 && (!near || d < near.d)) near = { b, d };
  }
  if (!near) { Hud.prompt(null); return; }
  const b = near.b;
  let label;
  if (b.kind === 'gun' && G.W.unlock[b.weapon]) label = '已购买 · ' + b.label;
  else if (G.points < b.cost) label = '<b>' + b.label + '</b> · 点数不足';
  else label = '按住 <b>[F]</b> 购买 · ' + b.label;
  Hud.prompt(label);
  if (Input.down('use') && (b.kind !== 'gun' || !G.W.unlock[b.weapon]) && G.points >= b.cost) {
    G.points -= b.cost;
    if (b.kind === 'gun') {
      Sh.unlockWeapon(G.W, b.weapon);
      G.W.cur = Math.max(0, G.W.slots.indexOf(b.weapon));
      Vm.show(b.weapon); Vm.kick('draw');
    } else {
      Sh.giveAmmo(G.W);
    }
    Snd.buy();
    Hud.announce(b.kind === 'gun' ? defs[b.weapon].name + ' 已入列' : '弹药已补满');
    Hud.prompt(null);
  }
}

/* ---------- 一帧对局逻辑（主循环与调试快进共用） ---------- */
function tickPlay(dt, look) {
  G.t += dt;
  const want = readIntent(look);
  handleActions(want, look);

  G.player.update(dt, look, want);
  Sh.updateReload(G.RS, G.W, G.t);
  G.bots.update(dt);
  updateDirector(dt);

  // 死亡流程
  if (G.player.dead && G.deathT < 0) G.deathT = 2.2;
  if (G.deathT > 0) {
    G.deathT -= dt;
    R.camera.rotation.x = clamp(R.camera.rotation.x - dt * 0.5, -1.4, 1.4);
    R.camera.rotation.z += dt * 0.3;
    if (G.deathT <= 0) { G.mode = 'over'; Input.unlock(); Menu.over(G.player.stats, G.round); }
  }

  Hud.tick(dt, {
    def: Sh.curDef(G.W), player: G.player, W: G.W,
    round: G.round, points: G.points, alive: G.bots.aliveCount(), pending: G.pending
  });
}

// 表现层（枪模/环境/特效）与渲染
function visuals(dt, look) {
  G.recoilKick = Math.max(0, G.recoilKick - dt * 12);
  G.flashT = Math.max(0, G.flashT - dt);
  const hv = G.player ? Math.hypot(G.player.actor.vel.x, G.player.actor.vel.z) : 0;
  if (G.player) {
    Vm.update(dt, {
      adsT: G.player.adsT, sprint: G.player.sprinting ? 1 : 0,
      moveK: clamp(hv / 4.6, 0, 1.4), time: G.t,
      lookDx: look.dx, lookDy: look.dy,
      recoilKick: G.recoilKick, flashT: G.flashT,
      shell: G.RS.kind === 'shell' ? (G.t - G.RS.t0) : -1
    });
  }
  if (G.sky) G.sky.update(dt, G.map && G.map.lightPole);
  Fx.update(dt);
  if (G.map && G.map.beacon) {
    const k = 1 + Math.sin(performance.now() / 480) * 0.25;
    G.map.beacon.scale.setScalar(k);
  }
  R.render();
}

/* ---------- 主循环 ---------- */
const fpsMeter = makeFps();
let lastNow = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - lastNow) / 1000);
  lastNow = now;
  fpsMeter.tick(now);
  const look = Input.beginFrame();

  if (G.mode === 'play' || G.mode === 'pause' || G.mode === 'over') {
    if (G.mode === 'play') tickPlay(dt, look);
    visuals(dt, look);
  } else {
    // 菜单背景也渲染一帧静态场景（如果已建过图）
    if (G.map) R.render();
  }
  Input.endFrame();
}

/* ---------- 调试入口（浏览器 console） ---------- */
window.DEAD = {
  G, R,          // R 供 console 遍历场景：DEAD.R.scene.traverse(...)
  Fx, Vm, Input,
  perf: () => ({
    fps: fpsMeter.value, round: G.round, points: G.points,
    alive: G.bots && G.bots.aliveCount(), pending: G.pending,
    draws: R.renderer.info.render.calls, tris: R.renderer.info.render.triangles
  }),
  mapCheck: () => selfCheck(G.map.world),
  // 同步推进 n 帧（不受浏览器后台 rAF 节流影响）：快进浸泡测试用
  // 每帧尾清理边沿输入，保证与真实主循环语义一致
  step: (n = 60, dt = 1 / 60, withVisuals = false) => {
    const zero = { dx: 0, dy: 0, wheel: 0 };
    for (let i = 0; i < n; i++) {
      tickPlay(dt, zero);
      if (withVisuals) visuals(dt, zero);
      Input.endFrame();
    }
    return { t: +G.t.toFixed(1), round: G.round, alive: G.bots.aliveCount(), pending: G.pending, hp: Math.round(G.player.hp) };
  },
  give: (k) => { Sh.unlockWeapon(G.W, k); G.W.cur = Math.max(0, G.W.slots.indexOf(k)); Vm.show(k); },
  // 调试用复活（测试脚本需要在存活状态下验证射击/换弹链路）
  revive: () => {
    const P = G.player;
    P.dead = false; P.actor.alive = true; P.hp = P.maxHp; P.regenDelay = 0;
    G.deathT = -1; G.mode = 'play';
    return { hp: P.hp, mode: G.mode };
  },
  round: (n) => { G.round = n - 1; G.between = true; G.interT = 0.1; },
  // 调试用单发：直接走完整开火链（弹道→命中→结算），不依赖指针锁定
  fireOnce: (n = 1) => {
    const zero = { dx: 0, dy: 0, wheel: 0 };
    G.player.update(0.001, zero, { fwd: 0, right: 0, ads: false, sprint: false, crouch: false, jump: false, firing: false });  // 先把相机对齐到当前朝向
    const before = G.bots.list.map(z => z.hp);
    for (let i = 0; i < n; i++) doFire();
    const after = G.bots.list.map(z => z.hp);
    let dmg = 0;
    for (let i = 0; i < before.length; i++) if (before[i] !== undefined) dmg += Math.max(0, before[i] - (after[i] === undefined ? 0 : after[i]));
    return { status: G.RS.kind, alive: G.bots.aliveCount(), damageApplied: Math.round(dmg), shots: G.player.stats.shots };
  }
};

boot();
