import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.hdr': 'application/octet-stream',
  '.map': 'application/json',
  '.glb': 'model/gltf-binary',
};

http
  .createServer((req, res) => {
    let u = decodeURIComponent((req.url || '/').split('?')[0]);
    if (u.endsWith('/')) u += 'index.html';
    const f = path.join(root, u);
    if (!f.startsWith(root)) {
      res.writeHead(403);
      return res.end('403');
    }
    fs.readFile(f, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('404 ' + u);
      }
      res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(4177, '127.0.0.1', () => console.log('up 4177'));
