/**
 * 手雷系统 —— 修复 043「手雷没有物理反弹」的核心件。
 *
 * 雷是真 Rapier 动态刚体球（restitution 0.55）：出手后走真实抛物线，
 * 砸甲板弹跳、撞集装箱壁反弹、落进管道滚两圈——视觉与物理完全同一份。
 * sim 零 three / 零 DOM：渲染层通过 GameSim.grenades.list 每帧同步网格。
 */
import RAPIER from '@dimforge/rapier3d-compat';
import { CONFIG } from '../core/config';
import type { Vec3, SimEvent } from './types';

export interface Grenade {
  /** 稳定 id：渲染层维护 id → mesh 映射，爆炸事件到来时移除 */
  id: number;
  body: RAPIER.RigidBody;
  /** 剩余引信（秒） */
  fuse: number;
}

export interface Explosion {
  id: number;
  pos: Vec3;
}

export class GrenadeSystem {
  readonly list: Grenade[] = [];
  private nextId = 1;
  private readonly world: RAPIER.World;

  constructor(world: RAPIER.World) {
    this.world = world;
  }

  /** 出手一颗雷：origin 为出手点，dir 为瞄准方向（含 pitch） */
  throwG(origin: Vec3, dir: Vec3, rand: () => number, events: SimEvent[]): void {
    const g = CONFIG.grenade;
    const id = this.nextId++;
    const vel = {
      x: dir.x * g.power,
      y: dir.y * g.power + g.upBias,
      z: dir.z * g.power,
    };
    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(origin.x, origin.y, origin.z)
        .setLinvel(vel.x, vel.y, vel.z)
        // 随机自旋：让滚动/翻滚在视觉上可信（不影响命中判定，只影响观感）
        .setAngvel({ x: (rand() - 0.5) * 14, y: (rand() - 0.5) * 14, z: (rand() - 0.5) * 14 })
        .setLinearDamping(0.12)
        .setAngularDamping(0.6)
        // 高速小球（15 m/s × 0.11m 半径）一步能飞 0.25m，接近薄墙厚度，开 CCD 防穿
        .setCcdEnabled(true),
    );
    this.world.createCollider(
      RAPIER.ColliderDesc.ball(g.radius)
        .setRestitution(g.restitution)
        .setFriction(g.friction)
        .setDensity(g.density),
      body,
    );
    this.list.push({ id, body, fuse: g.fuse });
    events.push({ type: 'grenadeThrow', id, origin, vel });
  }

  /**
   * 每帧推进引信；返回本帧爆炸的雷（由 GameSim 结算伤害）。
   * removeRigidBody 会连带移除附着 collider，无需单独清理。
   */
  update(dt: number): Explosion[] {
    const out: Explosion[] = [];
    for (let i = this.list.length - 1; i >= 0; i--) {
      const gr = this.list[i]!;
      gr.fuse -= dt;
      if (gr.fuse > 0) continue;
      const t = gr.body.translation();
      out.push({ id: gr.id, pos: { x: t.x, y: t.y, z: t.z } });
      this.world.removeRigidBody(gr.body);
      this.list.splice(i, 1);
    }
    return out;
  }
}
