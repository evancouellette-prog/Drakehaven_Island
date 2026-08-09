/* A dependency-free static server, for hosts that expect a web service rather
   than a static site (Render, Railway, Fly, a plain VPS).

   The game itself needs no server at all — you can open index.html directly —
   but a platform that wants a start command wants this.

     node server.js            → http://localhost:8000
     PORT=3000 node server.js  → http://localhost:3000
*/
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PORT = process.env.PORT || 8000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  /* strip the query, decode, and refuse anything that climbs out of the root */
  let rel;
  try { rel = decodeURIComponent(req.url.split('?')[0]); }
  catch (e) { res.writeHead(400).end('bad request'); return; }
  if (rel === '/' || rel === '') rel = '/index.html';

  const file = path.join(ROOT, path.normalize(rel));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('forbidden'); return; }

  fs.readFile(file, (err, data) => {
    if (err) {
      /* unknown paths fall back to the game rather than a bare 404 */
      fs.readFile(path.join(ROOT, 'index.html'), (e2, home) => {
        if (e2) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found'); return; }
        res.writeHead(200, { 'Content-Type': TYPES['.html'] }).end(home);
      });
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    }).end(data);
  });
}).listen(PORT, () => {
  console.log('Drakehaven Island → http://localhost:' + PORT);
});
