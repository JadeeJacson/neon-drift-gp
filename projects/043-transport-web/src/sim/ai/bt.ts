/**
 * 轻量行为树 —— sim 层内自写（零依赖、零分配、确定性）。
 *
 * 为什么不用现成库（yuka / behavior3）：
 *   1. sim 层的铁律是「零 three、零 DOM、Node 可直跑」——第三方 AI 库会引入渲染耦合；
 *   2. bot 跑分基线依赖确定性：同 seed → 同结果。自写树保证 tick 顺序固定、无时钟、无随机。
 *
 * 设计约定：
 *   - 节点是纯对象，tick 只读 blackboard、写 blackboard 输出字段；
 *   - 不保存运行时状态（本项目的行为都是无记忆的即时决策），所以只有 success/failure
 *     两态，没有 running——树的决策每帧重算，天然可重放；
 *   - ⚠️ 不要用 TS 构造函数参数属性（constructor(private x)）——
 *     `node --experimental-strip-types`（bot 跑分链路）不支持非可擦除语法，运行即报错；
 *   - 战斗员 AI（Combatant）用它做「移动意图」的顶层决策：
 *       Selector[ Sequence[被压制? → 找掩体], 交战兜底 ]
 */

export type BtStatus = 'success' | 'failure';

export interface BtNode<T> {
  tick(bb: T): BtStatus;
}

/** 选择节点：依序尝试子节点，返回第一个非 failure 的结果；全失败才 failure */
export class BtSelector<T> implements BtNode<T> {
  private readonly children: BtNode<T>[];

  constructor(children: BtNode<T>[]) {
    this.children = children;
  }

  tick(bb: T): BtStatus {
    for (const c of this.children) {
      const s = c.tick(bb);
      if (s === 'success') return 'success';
    }
    return 'failure';
  }
}

/** 顺序节点：依序执行，全部 success 才 success；任何一个 failure 立即短路 */
export class BtSequence<T> implements BtNode<T> {
  private readonly children: BtNode<T>[];

  constructor(children: BtNode<T>[]) {
    this.children = children;
  }

  tick(bb: T): BtStatus {
    for (const c of this.children) {
      if (c.tick(bb) === 'failure') return 'failure';
    }
    return 'success';
  }
}

/** 条件叶节点：谓词成立 = success */
export class BtCondition<T> implements BtNode<T> {
  private readonly fn: (bb: T) => boolean;

  constructor(fn: (bb: T) => boolean) {
    this.fn = fn;
  }

  tick(bb: T): BtStatus {
    return this.fn(bb) ? 'success' : 'failure';
  }
}

/** 行为叶节点：执行副作用（写 blackboard 输出），返回成败 */
export class BtAction<T> implements BtNode<T> {
  private readonly fn: (bb: T) => BtStatus;

  constructor(fn: (bb: T) => BtStatus) {
    this.fn = fn;
  }

  tick(bb: T): BtStatus {
    return this.fn(bb);
  }
}
