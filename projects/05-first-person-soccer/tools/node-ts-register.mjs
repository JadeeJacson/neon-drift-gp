/**
 * Node 直跑项目 TS 源码的注册入口。
 *
 * 源码按 Vite/TS 惯例写无扩展名导入（`from './ball'`），浏览器由 Vite 解析、
 * Node 的 ESM 解析器会报 ERR_MODULE_NOT_FOUND。本文件注册解析钩子把无扩展名导入补成 '.ts'。
 *
 *   node --experimental-strip-types --import ./tools/node-ts-register.mjs 你的脚本.ts
 */
import { register } from 'node:module';
register('./node-ts-resolve.mjs', import.meta.url);
