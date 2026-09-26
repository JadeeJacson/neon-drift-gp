/**
 * 波次导演：分批放怪、控制同屏数量、波间喘息、推进胜负。
 *
 * 关键手感参数：maxAlive 决定「同时被几个人打」，batchSize 决定「一波涌进来多少」。
 * 两者一起决定了难度曲线的斜率，是平衡扫参时最先动的两个数。
 */
import { CONFIG } from '../core/config';
import type { EnemyId } from '../core/config';
import type { SimEvent } from './types';

export interface SpawnRequest {
  kind: EnemyId;
  elite: boolean;
}

export type WaveState = 'idle' | 'spawning' | 'break' | 'done';

export class WaveDirector {
  /** 0-based；-1 表示尚未开始 */
  waveIndex = -1;
  queue: SpawnRequest[] = [];
  state: WaveState = 'idle';
  batchTimer = 0;
  breakTimer = 0;

  private readonly rand: () => number;

  constructor(rand: () => number) {
    this.rand = rand;
  }

  get total(): number {
    return CONFIG.waves.length;
  }

  /** 本波及后续所有敌人总数（HUD 显示剩余） */
  remainingTotal(aliveCount: number): number {
    let n = aliveCount + this.queue.length;
    for (let i = this.waveIndex + 1; i < CONFIG.waves.length; i++) {
      const w = CONFIG.waves[i];
      if (!w) continue;
      n += w.grunt + w.rusher + w.sniper + w.elite;
    }
    return n;
  }

  start(events: SimEvent[]): void {
    this.waveIndex = 0;
    this.buildQueue();
    this.state = 'spawning';
    this.batchTimer = 0;
    events.push({ type: 'waveStart', wave: 1, total: this.total });
  }

  private buildQueue(): void {
    const def = CONFIG.waves[this.waveIndex];
    const list: SpawnRequest[] = [];
    if (def) {
      for (let i = 0; i < def.grunt; i++) list.push({ kind: 'grunt', elite: false });
      for (let i = 0; i < def.rusher; i++) list.push({ kind: 'rusher', elite: false });
      for (let i = 0; i < def.sniper; i++) list.push({ kind: 'sniper', elite: false });
      for (let i = 0; i < def.elite; i++) list.push({ kind: 'grunt', elite: true });
    }
    // Fisher–Yates（用 sim 的确定性随机，保证 bot 跑分可复现）
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      const a = list[i]!;
      const b = list[j]!;
      list[i] = b;
      list[j] = a;
    }
    this.queue = list;
  }

  /**
   * @param aliveCount 场上存活敌人数
   * @param spawn      实际生成回调（由 GameSim 提供）
   * @returns 本帧是否刚清空一波（供 GameSim 触发补给）
   */
  update(
    dt: number,
    aliveCount: number,
    spawn: (req: SpawnRequest) => void,
    events: SimEvent[],
  ): boolean {
    if (this.state === 'idle' || this.state === 'done') return false;

    if (this.state === 'break') {
      this.breakTimer -= dt;
      if (this.breakTimer <= 0) {
        // 喘息结束：自己推进到下一波，GameSim 无需感知内部状态
        this.advance(events);
        this.state = 'spawning';
        this.batchTimer = 0;
      }
      return false;
    }

    // spawning
    let clearedThisFrame = false;
    if (this.queue.length === 0 && aliveCount === 0) {
      const isLast = this.waveIndex >= CONFIG.waves.length - 1;
      if (isLast) {
        this.state = 'done';
        events.push({ type: 'waveClear', wave: this.waveIndex + 1, nextIn: 0 });
      } else {
        this.state = 'break';
        this.breakTimer = CONFIG.wave.breakTime;
        events.push({ type: 'waveClear', wave: this.waveIndex + 1, nextIn: CONFIG.wave.breakTime });
      }
      clearedThisFrame = true;
      return clearedThisFrame;
    }

    this.batchTimer -= dt;
    const room = CONFIG.wave.maxAlive - aliveCount;
    if (this.batchTimer <= 0 && this.queue.length > 0 && room > 0) {
      const n = Math.min(CONFIG.wave.batchSize, room, this.queue.length);
      for (let i = 0; i < n; i++) {
        const req = this.queue.shift();
        if (req) spawn(req);
      }
      this.batchTimer = CONFIG.wave.batchInterval;
    }
    return false;
  }

  /** 进入下一波（由 GameSim 在 break 结束时调用） */
  advance(events: SimEvent[]): void {
    this.waveIndex += 1;
    if (this.waveIndex >= CONFIG.waves.length) {
      this.state = 'done';
      return;
    }
    this.buildQueue();
    events.push({ type: 'waveStart', wave: this.waveIndex + 1, total: this.total });
  }
}
