/**
 * 确定性随机 —— 同一 seed 在 Node 与浏览器产出一致，
 * 这是「bot 跑分」与「确定性回放」的前提。
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 均匀分布 */
export function range(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

/** [-1, 1] 抖动 */
export function jitter(rand: () => number): number {
  return rand() * 2 - 1;
}
