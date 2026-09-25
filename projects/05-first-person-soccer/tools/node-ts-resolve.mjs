/**
 * Node ESM 解析钩子：把无扩展名的相对导入（'./ball'）补成 '.ts'。
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') && context.parentURL !== undefined) {
      const base = new URL(specifier, context.parentURL);
      for (const ext of ['.ts', '/index.ts']) {
        const cand = new URL(base.href + ext);
        if (fs.existsSync(fileURLToPath(cand))) {
          return { url: cand.href, shortCircuit: true };
        }
      }
    }
    throw err;
  }
}
