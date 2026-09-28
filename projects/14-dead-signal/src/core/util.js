/* 通用工具：数学、随机、事件总线、帧率、设置持久化（ESM 版，移植自本人前一工程） */
import * as THREE from 'three';

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
// 角度插值（处理 ±π 边界）
export function aLerp(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * Math.min(1, t);
}
export const approach = (v, target, delta) => {
  if (v < target) return Math.min(target, v + delta);
  if (v > target) return Math.max(target, v - delta);
  return target;
};
export const smoothDamp = (cur, target, t, dt) => cur + (target - cur) * (1 - Math.exp(-t * dt));
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
export const pick = (arr) => arr[(Math.random() * arr.length) | 0];
export const chance = (p) => Math.random() < p;
export const deg = (d) => (d * Math.PI) / 180;

// 可复现随机数（地图摆位希望每次构建一致）
export function seedRng(seed) {
  let s = seed >>> 0;
  return function () {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

export function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = (sec / 60) | 0, s = sec % 60;
  return m + ':' + (s < 10 ? '0' : '') + s;
}

// 插入 innerHTML 前转义
export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---------- 极简事件总线（模块间解耦通信的唯一入口） ---------- */
function makeBus() {
  const map = {};
  return {
    on(k, fn) { (map[k] || (map[k] = [])).push(fn); return this; },
    off(k, fn) { if (map[k]) map[k] = map[k].filter((f) => f !== fn); return this; },
    emit(k, payload) { (map[k] || []).forEach((f) => { try { f(payload); } catch (e) { console.error('[bus:' + k + ']', e); } }); return this; }
  };
}
export const bus = makeBus();

/* ---------- 帧率统计 ---------- */
export function makeFps() {
  let last = performance.now(), acc = 0, n = 0, fps = 60;
  return {
    tick(now) {
      const dt = now - last; last = now;
      acc += dt; n++;
      if (acc >= 500) { fps = (n * 1000) / acc; acc = 0; n = 0; }
      return fps;
    },
    get value() { return Math.round(fps); }
  };
}

/* ---------- 设置持久化 ---------- */
const SKEY = 'dead-signal-settings-v1';
export const store = {
  load() { try { return JSON.parse(localStorage.getItem(SKEY) || '{}') || {}; } catch (e) { return {}; } },
  save(obj) { try { localStorage.setItem(SKEY, JSON.stringify(obj)); } catch (e) { /* 隐私模式下忽略 */ } }
};

/* ---------- 网格构造便捷函数 ---------- */
export function mesh(geo, mat, x, y, z) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x || 0, y || 0, z || 0);
  return m;
}
export const boxGeo = (w, h, d) => new THREE.BoxGeometry(w, h, d);

/* ---------- 亡灵代号池（击杀信息流用） ---------- */
export const zombieNames = [
  '步尸-07', '夜行种', '尖啸体', '腐化工兵', '四臂攀爬者', '臃肿体', '守闸亡灵', '疯跑者',
  '灰皮', '拖肠者', '站岗壳', '信号游魂', '坑道居民', '铁颚', '夜嚎种', '断颌',
  '巡检残体', '燃烬', '佝偻者', '浅坟来客'
];
