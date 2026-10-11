// progress.js — 存档与成长系统（纯数据，不碰 three.js / DOM，便于无头测试）。
//
// 一份存档包含：钱包、各赛事最佳成绩与奖牌、车库（涂装 + 改装等级）、设置、统计。
// v1 只存了 { circuitId: bestTime }（key = tokyo-city.best.v1），这里自动迁移过来。

export const SAVE_KEY = 'tokyo-city.save.v2';
const LEGACY_BEST_KEY = 'tokyo-city.best.v1';

// ---- 涂装 ----
export const PAINTS = [
  { id: 'ember', name: '赤焰红', color: 0xd84a35, price: 0 },
  { id: 'pearl', name: '珍珠白', color: 0xe8e6e0, price: 1500 },
  { id: 'midnight', name: '午夜蓝', color: 0x1f3f8f, price: 2500 },
  { id: 'lime', name: '荧光绿', color: 0x7bd63a, price: 4000 },
  { id: 'sakura', name: '樱花粉', color: 0xf28ab8, price: 6000 },
  { id: 'gold', name: '香槟金', color: 0xc9a446, price: 12000 },
];

// ---- 改装：每级的倍率与价格 ----
export const UPGRADES = [
  { id: 'engine', name: '引擎', desc: '加速与极速提升', max: 3, prices: [3000, 7000, 15000] },
  { id: 'tires', name: '轮胎', desc: '过弯抓地更稳，漂移更好控制', max: 3, prices: [2500, 6000, 12000] },
  { id: 'brakes', name: '刹车', desc: '刹车距离更短', max: 3, prices: [1500, 4000, 8000] },
];

/** 按改装等级生成车辆调校（返回对 base 的覆盖值） */
export function tunedCar(base, up = {}) {
  const e = up.engine || 0, t = up.tires || 0, b = up.brakes || 0;
  return {
    ...base,
    enginePower: base.enginePower * (1 + 0.1 * e),
    powerTaperSpeed: base.powerTaperSpeed + 7 * e,
    grip: base.grip * (1 + 0.08 * t),
    driftGrip: base.driftGrip * (1 + 0.05 * t),
    handbrakeGrip: base.handbrakeGrip * (1 + 0.04 * t),
    brakePower: base.brakePower * (1 + 0.14 * b),
  };
}

// ---- 奖牌：目标用时由赛程长度推导（和派单限时同一思路，改地图后自动跟着变）----
// 金 / 银 / 铜 分别对应约 122 / 104 / 86 km/h 的全程均速
export const MEDALS = [
  { id: 'gold', name: '金牌', icon: '🥇', mps: 34, bonus: 3000 },
  { id: 'silver', name: '银牌', icon: '🥈', mps: 29, bonus: 1500 },
  { id: 'bronze', name: '铜牌', icon: '🥉', mps: 24, bonus: 600 },
];
export const MEDAL_RANK = { gold: 3, silver: 2, bronze: 1 };

export function medalTargets(distanceM) {
  return MEDALS.map((m) => ({ ...m, time: Math.ceil(distanceM / m.mps) }));
}

export function medalFor(time, distanceM) {
  for (const m of medalTargets(distanceM)) if (time <= m.time) return m;
  return null;
}

// ---- 默认存档 ----
export function defaultSave() {
  return {
    v: 2,
    money: 0,
    best: {},          // eventId -> 秒
    bestLap: {},       // circuitId -> 秒
    medals: {},        // eventId -> 'gold'|'silver'|'bronze'
    paint: 'ember',
    paints: ['ember'],
    upgrades: { engine: 0, tires: 0, brakes: 0 },
    jobs: { done: 0, bestStreak: 0 },
    stats: { distance: 0, bestDrift: 0, crashes: 0, playTime: 0 },
    settings: {
      quality: 'auto',   // auto | low | medium | high
      volume: 0.7,
      shake: true,
      showFps: false,
      touch: 'auto',     // auto | on | off
    },
    seenHelp: false,
  };
}

function merge(base, src) {
  if (!src || typeof src !== 'object') return base;
  for (const k of Object.keys(base)) {
    if (!(k in src)) continue;
    const b = base[k], s = src[k];
    if (b && typeof b === 'object' && !Array.isArray(b)) base[k] = merge(b, s);
    else if (typeof s === typeof b || b === null) base[k] = s;
  }
  // 动态 key 的字典（best / medals）直接整体保留
  for (const k of ['best', 'bestLap', 'medals']) if (src[k] && typeof src[k] === 'object') base[k] = { ...src[k] };
  return base;
}

export class Progress {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.data = this._load();
    this.onChange = () => {};
  }

  _load() {
    const d = defaultSave();
    try {
      const raw = this.storage?.getItem(SAVE_KEY);
      if (raw) return merge(d, JSON.parse(raw));
      // 迁移 v1 最佳成绩
      const legacy = this.storage?.getItem(LEGACY_BEST_KEY);
      if (legacy) {
        const best = JSON.parse(legacy);
        for (const [k, v] of Object.entries(best)) if (typeof v === 'number') d.best[k] = v;
      }
    } catch { /* 存档损坏：用默认值 */ }
    return d;
  }

  save() {
    try { this.storage?.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch { /* 隐私模式忽略 */ }
    this.onChange(this.data);
  }

  reset() {
    const settings = this.data.settings;
    this.data = defaultSave();
    this.data.settings = settings;
    this.save();
  }

  get money() { return this.data.money; }
  get settings() { return this.data.settings; }

  addMoney(n) {
    this.data.money = Math.max(0, Math.round(this.data.money + n));
    this.save();
  }

  /** 记录成绩，返回 { record, prevBest, medal, newMedal, medalBonus } */
  recordTime(eventId, time, distanceM) {
    const prevBest = this.data.best[eventId] ?? null;
    const record = prevBest == null || time < prevBest;
    if (record) this.data.best[eventId] = time;
    const medal = medalFor(time, distanceM);
    const prevMedal = this.data.medals[eventId] || null;
    let newMedal = false, medalBonus = 0;
    if (medal && (MEDAL_RANK[medal.id] || 0) > (MEDAL_RANK[prevMedal] || 0)) {
      this.data.medals[eventId] = medal.id;
      newMedal = true;
      medalBonus = medal.bonus; // 首次拿到更高一级奖牌才发奖金，防止刷钱
    }
    this.save();
    return { record, prevBest, medal, newMedal, medalBonus };
  }

  recordLap(circuitId, lapTime) {
    const prev = this.data.bestLap[circuitId];
    if (prev == null || lapTime < prev) { this.data.bestLap[circuitId] = lapTime; this.save(); return true; }
    return false;
  }

  // ---- 车库 ----
  ownsPaint(id) { return this.data.paints.includes(id); }

  buyPaint(id) {
    const p = PAINTS.find((x) => x.id === id);
    if (!p) return false;
    if (!this.ownsPaint(id)) {
      if (this.data.money < p.price) return false;
      this.data.money -= p.price;
      this.data.paints.push(id);
    }
    this.data.paint = id;
    this.save();
    return true;
  }

  upgradeLevel(id) { return this.data.upgrades[id] || 0; }

  nextUpgradePrice(id) {
    const u = UPGRADES.find((x) => x.id === id);
    const lv = this.upgradeLevel(id);
    return u && lv < u.max ? u.prices[lv] : null;
  }

  buyUpgrade(id) {
    const price = this.nextUpgradePrice(id);
    if (price == null || this.data.money < price) return false;
    this.data.money -= price;
    this.data.upgrades[id] = this.upgradeLevel(id) + 1;
    this.save();
    return true;
  }

  get paintColor() {
    return (PAINTS.find((p) => p.id === this.data.paint) || PAINTS[0]).color;
  }

  /** 赛道解锁：上一条赛道完赛（任意成绩）即解锁下一条 */
  circuitUnlocked(order, circuits) {
    if (order === 0) return true;
    const prev = circuits[order - 1];
    return this.data.best[prev.id] != null;
  }
}
