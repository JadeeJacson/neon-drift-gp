/* 武器数值表：四把 COD 味道具名（均为虚构致敬，不对应真实参数）+ 伤害结算公式 */
import { clamp, lerp } from '../core/util.js';

export const defs = {
  rifle: {
    key: 'rifle', name: 'M16A1', vm: 'rifle', sound: 'rifle', slot: 1,
    dmg: 34, headMul: 3.0, rpm: 750, auto: true,
    mag: 30, reserveMax: 240, reload: 2.4,
    // 散布：腰射基础角 + 每发累积增长（度）
    hipSpread: 1.7, adsSpread: 0.25, spreadRamp: 0.22, spreadMax: 3.2, spreadCool: 6.5,
    recoilV: 0.9, recoilH: 0.26, recoilRamp: 1.35, recoilKick: 0.06,   // 每发蹲姿系数前先乘 stance
    range0: 32, range1: 72, falloffMin: 0.55,
    adsFov: 63, adsTime: 0.14, vmScale: 1.0
  },
  shotgun: {
    key: 'shotgun', name: 'SPAS-12', vm: 'shotgun', sound: 'shotgun', slot: 1,
    dmg: 17, headMul: 1.8, rpm: 75, auto: false, pellets: 8,
    mag: 8, reserveMax: 64, reload: 0.55, reloadPerShell: true,
    hipSpread: 4.6, adsSpread: 3.4, spreadRamp: 0, spreadMax: 0, spreadCool: 0,
    recoilV: 2.4, recoilH: 0.5, recoilRamp: 1.0, recoilKick: 0.13,
    range0: 9, range1: 22, falloffMin: 0.3,
    adsFov: 68, adsTime: 0.18, vmScale: 1.0
  },
  smg: {
    key: 'smg', name: 'MP5K', vm: 'smg', sound: 'rifle', slot: 1,
    dmg: 21, headMul: 2.6, rpm: 900, auto: true,
    mag: 32, reserveMax: 288, reload: 2.1,
    hipSpread: 2.2, adsSpread: 0.5, spreadRamp: 0.16, spreadMax: 2.8, spreadCool: 7.5,
    recoilV: 0.62, recoilH: 0.3, recoilRamp: 1.2, recoilKick: 0.045,
    range0: 16, range1: 38, falloffMin: 0.42,
    adsFov: 65, adsTime: 0.12, vmScale: 0.92
  },
  pistol: {
    key: 'pistol', name: '.44 马格南', vm: 'pistol', sound: 'pistol', slot: 2,
    dmg: 62, headMul: 3.2, rpm: 260, auto: false,
    mag: 8, reserveMax: 64, reload: 1.9,
    hipSpread: 1.3, adsSpread: 0.35, spreadRamp: 0.45, spreadMax: 3.6, spreadCool: 5.5,
    recoilV: 1.7, recoilH: 0.3, recoilRamp: 1.6, recoilKick: 0.1,
    range0: 22, range1: 48, falloffMin: 0.5,
    adsFov: 60, adsTime: 0.12, vmScale: 0.8
  }
};

export const melee = { dmg: 450, range: 2.1, cooldown: 0.65 };   // 军刀：高伤但贴身
// 军刀的伪武器定义：仅供 HUD/散布函数读取，不参与射击流程
export const knifeDef = { name: 'M1918 军刀', key: 'knife', hipSpread: 0, adsSpread: 0, spreadRamp: 0, spreadMax: 0, mag: 0, reserveMax: 0 };

// 蹲姿/机瞄对散布与后坐的修正
export function stanceMods(p) {
  const crouchK = p.crouching ? 0.62 : 1.0;
  const adsK = p.adsT > 0.7 ? 0.66 : 1.0;
  return { spread: crouchK * adsK, recoil: (p.crouching ? 0.7 : 1) * (p.adsT > 0.7 ? 0.8 : 1) };
}

// 当前散布角（度）：基础 + 累积，取腰射/机瞄插值
export function currentSpread(def, p) {
  const base = lerp(def.hipSpread, def.adsSpread, clamp(p.adsT, 0, 1));
  return (base + p.spreadGrow) * stanceMods(p).spread;
}

// 距离衰减后的单发伤害
export function rollDamage(def, part, dist) {
  const t = clamp((dist - def.range0) / (def.range1 - def.range0), 0, 1);
  const fall = 1 - (1 - def.falloffMin) * t;
  const base = def.dmg * fall;
  return part === 'head' ? base * def.headMul : base;
}

/* 僵尸生命成长曲线（经典 600×1.1^r 的收敛版）：第 r 回合（从 1 起）
 * 190 / 219 / 251 / ... 逐回合约 +15%，并给出击杀基础分值 */
export function zombieMaxHp(round) {
  return Math.round(190 * Math.pow(1.15, round - 1));
}
export function zombieSpeed(round) {
  return Math.min(3.3, 1.55 + round * 0.075);        // 蹒跚 → 部分疯跑
}
export const pointsPerKill = 60;
export const pointsPerHead = 200;
export const pointsPerHit = 10;
