/**
 * Node 直跑项目 TS 源码的注册入口。
 *
 * 用途：源码按 Vite/TS 惯例写无扩展名导入（`from './level'`），
 * 浏览器由 Vite 解析、Node 的 ESM 解析器则会报 ERR_MODULE_NOT_FOUND。
 * 本文件注册一个解析钩子把无扩展名导入补成 '.ts'，于是可以直接：
 *
 *   node --experimental-strip-types --import ./tools/node-ts-register.mjs 你的脚本.ts
 *
 * 需要它的场景：脚本 import 了 `src/sim/player.ts` 这类「内部还有无扩展名导入」的模块
 * （如 tools/inspect-level.ts 之外的物理仿真脚本）。
 * 只 import level.ts / levels.ts 的脚本不需要它。
 */
import { register } from 'node:module';
register('./node-ts-resolve.mjs', import.meta.url);
