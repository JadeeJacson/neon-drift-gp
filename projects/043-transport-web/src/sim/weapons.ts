/**
 * 武器状态机：切枪 / 射速 / 弹匣 / 换弹 / 散布累积 / 后坐力。
 *
 * 散布与后坐力都在这里累积，渲染层只读不写 —— 保证「手感」是可测的 sim 状态，
 * bot 跑分能拿到真实的散布值，而不是渲染层的视觉近似。
 */
import { CONFIG } from '../core/config';
import type { WeaponDef } from '../core/config';
import type { GameInput, SimEvent } from './types';

/** 切枪硬直（秒） */
const SWITCH_TIME = 0.32;

export interface SlotState {
  def: WeaponDef;
  ammo: number;
  reloading: boolean;
  reloadTimer: number;
  cooldown: number;
  /** 连发累积的额外散布（不含基础散布） */
  spread: number;
}

export class WeaponSystem {
  readonly slots: SlotState[];
  active = 0;
  switchTimer = 0;
  /** 叠加到相机上的后坐力偏移（弧度），指数回落 */
  recoilPitch = 0;
  recoilYaw = 0;
  /** ADS 开镜态（每帧从输入同步；bot 注入的输入不带 ads 即 false，基线不受影响） */
  ads = false;

  private prevFire = false;
  private readonly rand: () => number;

  constructor(rand: () => number) {
    this.rand = rand;
    this.slots = CONFIG.weapons.map((def) => ({
      def,
      ammo: def.magazine,
      reloading: false,
      reloadTimer: 0,
      cooldown: 0,
      spread: 0,
    }));
  }

  get current(): SlotState {
    return this.slots[this.active] ?? this.slots[0]!;
  }

  /**
   * 当前实际散布半角 = (基础 + 连发累积) × ADS 乘区。
   * ADS 乘到「总散布」上：开镜时准星（= 真实散布）会自动收紧，两个系统天然联动。
   * 武器级覆盖：AWM 狙击镜的 adsSpreadMul 远小于全局值（0.012 vs 0.38）。
   */
  currentSpread(): number {
    const s = this.current;
    const raw = s.def.spreadBase + s.spread;
    if (!this.ads) return raw;
    const mul = s.def.adsSpreadMul ?? CONFIG.player.ads.spreadMul;
    return raw * mul;
  }

  /** 波次之间补满所有弹匣 */
  refillAll(): void {
    for (const s of this.slots) {
      s.ammo = s.def.magazine;
      s.reloading = false;
      s.reloadTimer = 0;
    }
  }

  reset(): void {
    this.active = 0;
    this.switchTimer = 0;
    this.recoilPitch = 0;
    this.recoilYaw = 0;
    this.prevFire = false;
    this.refillAll();
    for (const s of this.slots) {
      s.cooldown = 0;
      s.spread = 0;
    }
  }

  /** 推进一帧；返回本帧是否发射 */
  update(dt: number, input: GameInput, events: SimEvent[]): boolean {
    // 开镜态：疾跑时自动解除（与 04_1 的 isSprint 要求 !ads 对偶）
    this.ads = input.ads && !input.sprint;
    if (this.switchTimer > 0) this.switchTimer -= dt;

    // 切枪
    if (
      input.slot !== null &&
      input.slot !== this.active &&
      input.slot >= 0 &&
      input.slot < this.slots.length &&
      this.switchTimer <= 0
    ) {
      const prev = this.current;
      prev.reloading = false;
      prev.reloadTimer = 0;
      prev.spread = 0;
      this.active = input.slot;
      this.switchTimer = SWITCH_TIME;
      this.recoilPitch = 0;
      this.recoilYaw = 0;
      events.push({ type: 'switch', weapon: this.current.def.id });
    }

    const s = this.current;
    const def = s.def;

    if (s.cooldown > 0) s.cooldown -= dt;
    s.spread = Math.max(0, s.spread - def.spreadRecover * dt);

    // 后坐力指数回落（recoilRecover = 每秒衰减系数）
    this.recoilPitch *= Math.exp(-def.recoilRecover * dt);
    this.recoilYaw *= Math.exp(-def.recoilRecover * dt);
    if (this.recoilPitch < 1e-5) this.recoilPitch = 0;
    if (Math.abs(this.recoilYaw) < 1e-5) this.recoilYaw = 0;

    // 换弹（投掷物不换弹：3 颗丢完为止，波间 refillAll 补满）
    if (s.reloading) {
      s.reloadTimer -= dt;
      if (s.reloadTimer <= 0) {
        s.reloading = false;
        s.reloadTimer = 0;
        s.ammo = def.magazine;
        events.push({ type: 'reloadEnd', weapon: def.id });
      }
    } else if (input.reload && !def.throwable && s.ammo < def.magazine) {
      s.reloading = true;
      s.reloadTimer = def.reloadTime;
      events.push({ type: 'reloadStart', weapon: def.id });
    }

    // 开火意图：连发武器按住即射，单发武器要求重新按下
    const wantFire = def.auto ? input.fire : input.fire && !this.prevFire;
    this.prevFire = input.fire;

    if (!wantFire || s.reloading || this.switchTimer > 0 || s.cooldown > 0) return false;

    if (s.ammo <= 0) {
      events.push({ type: 'empty', weapon: def.id });
      s.cooldown = 0.28;
      if (!def.throwable) {
        // 枪械空仓自动换弹；手雷丢完就是真的没了（等波间补给）
        s.reloading = true;
        s.reloadTimer = def.reloadTime;
        events.push({ type: 'reloadStart', weapon: def.id });
      }
      return false;
    }

    s.ammo -= 1;
    s.cooldown = def.interval;
    s.spread = Math.min(def.spreadMax, s.spread + def.spreadPerShot);
    this.recoilPitch += def.recoilPitch;
    this.recoilYaw += (this.rand() * 2 - 1) * def.recoilYaw;
    return true;
  }
}
