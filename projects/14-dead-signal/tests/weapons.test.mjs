/* 武器与弹药状态机单元测试：node tests/weapons.test.mjs
 * shooting.js 依赖渲染层（枪模/相机），故在导入前放一组最小浏览器桩。 */

// ---- 最小 window/document 桩：只满足 render.js 与 viewmodel.js 的模块期求值 ----
globalThis.window = {
  devicePixelRatio: 1, innerWidth: 1280, innerHeight: 720,
  addEventListener() {}, matchMedia: () => ({ matches: false }),
  performance: { now: () => Date.now() }
};
globalThis.document = {
  createElement: () => ({
    width: 0, height: 0, style: {},
    getContext: () => new Proxy({}, {
      get: (t, k) => {
        if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(256 * 256 * 4) });
        if (k === 'createLinearGradient') return () => ({ addColorStop() {} });
        return () => {};
      },
      set: () => true
    }),
    addEventListener() {}
  }),
  getElementById: () => null,
  addEventListener() {},
  querySelectorAll: () => []
};
globalThis.performance = globalThis.performance || { now: () => Date.now() };
globalThis.localStorage = { getItem: () => null, setItem: () => {} };

const { defs, rollDamage, currentSpread, zombieMaxHp, stanceMods } = await import('../src/weapons/weapons.js');
const Sh = await import('../src/weapons/shooting.js');

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) pass++;
  else { fail++; console.error('  ✗ ' + name); }
}
function near(a, b, eps, name) { ok(Math.abs(a - b) < (eps || 1e-6), name + ` (得到 ${a}，期望 ${b})`); }

// 造一个假玩家：射击与散布只读这些字段
const mkPlayer = () => ({
  actor: { pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 } },
  yaw: 0, pitch: 0, adsT: 0, crouching: false, sprinting: false, dead: false,
  spreadGrow: 0, stats: { shots: 0 }, onGround: true,
  getAimDir(o) { o.x = 0; o.y = 0; o.z = -1; return o; },
  addRecoil() {}, eyePos(o) { o.x = 0; o.y = 1.66; o.z = 0; return o; }
});

/* ---------- 1. 弹药初始化 ---------- */
{
  const W = Sh.makeWeapons('rifle', ['rifle', 'pistol', 'knife']);
  ok(W.slots.length === 3 && W.mag.rifle === defs.rifle.mag, '出生弹药 = 弹匣容量');
  ok(W.mag.pistol === defs.pistol.mag && W.mag.knife === undefined, '副武器满弹、军刀无弹药字段');
  Sh.unlockWeapon(W, 'shotgun');
  ok(W.slots[0] === 'shotgun' && W.mag.shotgun === defs.shotgun.mag, '抵墙购买替换主武器槽');
  Sh.giveAmmo(W);
  ok(W.reserve.shotgun === defs.shotgun.reserveMax, '补弹站回满备弹');
}

/* ---------- 2. 整匣换弹（手枪） ---------- */
{
  const W = Sh.makeWeapons('pistol'); W.mag.pistol = 1;
  const RS = { kind: 'none', t0: 0, dur: 0 };
  const res = Sh.tryReload(RS, W, 10);
  ok(res && RS.kind === 'reload', '按 R 进入整匣换弹');
  Sh.updateReload(RS, W, 10 + defs.pistol.reload - 0.01);
  ok(W.mag.pistol === 1, '换弹完成前弹药不变');
  Sh.updateReload(RS, W, 10 + defs.pistol.reload + 0.01);
  ok(RS.kind === 'none' && W.mag.pistol === defs.pistol.mag, '换弹结束装满弹匣');
  ok(W.reserve.pistol === defs.pistol.reserveMax - (defs.pistol.mag - 1), '备弹按补充量扣除');
  // 满匣时拒绝换弹
  ok(Sh.tryReload(RS, W, 20) === false, '满匣不重复换弹');
}

/* ---------- 3. 逐发压弹（霰弹枪） ---------- */
{
  const W = Sh.makeWeapons('shotgun'); W.mag.shotgun = 2;
  const RS = { kind: 'none', t0: 0, dur: 0 };
  Sh.tryReload(RS, W, 0);
  ok(RS.kind === 'shell' && Math.abs(RS.dur - defs.shotgun.reload) < 1e-9, '霰弹枪进入逐发压弹');
  Sh.updateReload(RS, W, defs.shotgun.reload * 0.99);
  ok(W.mag.shotgun === 2, '未到间隔不压弹');
  Sh.updateReload(RS, W, defs.shotgun.reload);
  ok(W.mag.shotgun === 3, '一个间隔压入一发');
  Sh.updateReload(RS, W, defs.shotgun.reload * 2);
  ok(W.mag.shotgun === 4, '第二个间隔再压一发');
  // 打到满匣自动结束
  let t = defs.shotgun.reload * 2;
  for (let i = 0; i < 20; i++) { t += defs.shotgun.reload; Sh.updateReload(RS, W, t); }
  ok(W.mag.shotgun === defs.shotgun.mag && RS.kind === 'none', '压满后退出压弹状态');
  // 再按一次 R 应中断
  W.mag.shotgun = 3;
  Sh.tryReload(RS, W, t);
  Sh.cancelReload(RS);
  ok(RS.kind === 'none', '开火/再按 R 可中断压弹');
}

/* ---------- 4. 伤害公式：爆头倍率与距离衰减 ---------- */
{
  const d = defs.rifle;
  near(rollDamage(d, 'body', 5), d.dmg, 1e-9, '有效射程内全额伤害');
  near(rollDamage(d, 'head', 5), d.dmg * d.headMul, 1e-9, '爆头倍率');
  near(rollDamage(d, 'body', d.range1), d.dmg * d.falloffMin, 1e-9, '衰减末端系数');
  ok(rollDamage(d, 'body', 999) === d.dmg * d.falloffMin, '超出远端不再继续衰减');
  const mid = rollDamage(d, 'body', (d.range0 + d.range1) / 2);
  ok(mid > d.dmg * d.falloffMin && mid < d.dmg, '中段线性插值');
}

/* ---------- 5. 散布：机瞄/蹲姿收敛，连射扩张 ---------- */
{
  const d = defs.rifle;
  const hip = currentSpread(d, { adsT: 0, crouching: false, spreadGrow: 0 });
  const ads = currentSpread(d, { adsT: 1, crouching: false, spreadGrow: 0 });
  const crouch = currentSpread(d, { adsT: 0, crouching: true, spreadGrow: 0 });
  ok(ads < hip, `机瞄比腰射准 (${ads.toFixed(2)} < ${hip.toFixed(2)})`);
  ok(crouch < hip, '蹲姿比站立准');
  const grown = currentSpread(d, { adsT: 0, crouching: false, spreadGrow: 1 });
  ok(grown > hip, '连射累积散布变大');
  ok(stanceMods({ crouching: true, adsT: 1 }).spread < stanceMods({ crouching: false, adsT: 0 }).spread, '蹲+机瞄叠加最稳');
}

/* ---------- 6. 回合成长曲线：单调递增且前期不至于两枪死 ---------- */
{
  ok(zombieMaxHp(1) === 190, '第 1 回合 190 血');
  ok(zombieMaxHp(5) > zombieMaxHp(4), '逐轮变硬');
  ok(zombieMaxHp(10) / zombieMaxHp(9) > 1.1 && zombieMaxHp(10) / zombieMaxHp(9) < 1.2, '每轮约 +15%');
  // 手枪弹容量应足以处理前期回合（数值平衡底线）
  ok(defs.pistol.mag * defs.pistol.dmg > zombieMaxHp(3), '手枪一匣能扛住第 3 回合');
}

/* ---------- 7. 开火闸门：换弹中/死亡/空仓 ---------- */
{
  const world = { raycast: () => null };
  const P = mkPlayer();
  const W = Sh.makeWeapons('rifle');
  const RS = { kind: 'none', t0: 0, dur: 0 };
  let r = Sh.fire(RS, W, P, world, 1);
  ok(r.status === 'shot' && W.mag.rifle === defs.rifle.mag - 1, '正常击发消耗一发');
  RS.kind = 'reload';
  ok(Sh.fire(RS, W, P, world, 2).status === 'blocked', '换弹中拒绝开火');
  RS.kind = 'none';
  P.dead = true;
  ok(Sh.fire(RS, W, P, world, 3).status === 'blocked', '死亡后拒绝开火');
  P.dead = false;
  W.mag.rifle = 0; W.reserve.rifle = 0;
  ok(Sh.fire(RS, W, P, world, 4).status === 'dry', '空仓空响');
  ok(RS.kind === 'none', '无备弹时不启动换弹');
}

console.log(fail === 0 ? 'PASS ' + pass + '/' + pass : 'FAIL 通过 ' + pass + ' / 失败 ' + fail);
process.exit(fail === 0 ? 0 : 1);
