#!/usr/bin/env node
// 零依赖静态服务器：node serve.mjs [port]   （默认 8177）
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
// lab 共享素材区：12 号要用引擎音 / HDRI / 路面贴图。
// 浏览器把项目目录当根，无法直接 ../.. 取到 lab 的 assets/，所以开一条 /assets/ 路由。
// 两条路径都做 containment 校验，避免 ../ 穿越（硬约束 6：素材只落在 lab 内）。
const LAB_ASSETS = path.resolve(ROOT, '..', '..', 'assets');
const PORT = Number(process.argv[2]) || 8177;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.hdr': 'application/octet-stream',
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const fromLab = urlPath === '/assets' || urlPath.startsWith('/assets/');
    const base = fromLab ? LAB_ASSETS : ROOT;
    const rel = fromLab ? urlPath.slice('/assets/'.length) : urlPath;
    let filePath = path.normalize(path.join(base, rel));
    if (!filePath.startsWith(base)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('not found: ' + urlPath);
        return;
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      });
      res.end(data);
    });
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log(`[tokyo-city] http://127.0.0.1:${PORT}/`);
  });
