/* 构建脚本：esbuild 把 src/game.js 打成一段 JS，内联进 index.template.html，
 * 产物 dist/index.html 为单文件，无外部依赖，双击即玩（与参考仓库同款做法）。 */
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(root, 'dist');

const result = await build({
  entryPoints: [resolve(root, 'src/game.js')],
  bundle: true,
  minify: true,          // 仅压缩语法与空白，不做高级优化，保持行为可预期
  format: 'iife',        // 立即执行函数，直接内联进 <script>
  target: 'es2020',
  write: false,
  logLevel: 'warning'
});

const js = result.outputFiles[0].text;
const template = await readFile(resolve(root, 'index.template.html'), 'utf8');
// 用函数形式替换，避免 js 里的 $& 等特殊序列被 String.replace 误解
const html = template.replace('/*__GAME_JS__*/', () => js);

await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, 'index.html'), html);

const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log('[build] dist/index.html 完成：产物 ' + kb(html.length) + '（其中 JS 包 ' + kb(js.length) + '）');
