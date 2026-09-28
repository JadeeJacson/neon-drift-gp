/* 本地开发服务器：Node 标准库实现，多线程无、但带 no-store，改完重建刷新即新代码
 * 用法：node serve.mjs [端口]，默认 8131 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const port = Number(process.argv[2] || 8131);
const root = resolve(process.cwd(), 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.wasm': 'application/wasm'
};

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let p = normalize(join(root, url === '/' ? 'index.html' : url));
    if (!p.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return; }
    if (extname(p) === '') p += '.html';
    const data = await readFile(p);
    res.writeHead(200, {
      'Content-Type': MIME[extname(p)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 ' + e.message);
  }
}).listen(port, () => console.log('[serve] http://127.0.0.1:' + port + '/  (root: dist/)'));
