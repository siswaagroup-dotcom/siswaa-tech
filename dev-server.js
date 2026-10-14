/*
 * Local test server with the real AI chat.
 *   1. Copy .env.example to .env.local and paste your Gemini key into it.
 *   2. Run:  npm run dev      (or: node dev-server.js)
 *   3. Open: http://localhost:3000
 *
 * Serves the site with the same security headers as Vercel and runs api/chat.js
 * for /api/chat, so the chat uses Gemini exactly like the live site.
 * No packages to install. Not deployed (listed in .vercelignore).
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;

// Load .env.local (then .env) without any library. Never printed.
for (const name of ['.env.local', '.env']) {
  const file = path.join(ROOT, name);
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}

const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const SECURITY_HEADERS = vercel.headers[0].headers
  .filter((h) => h.key !== 'Strict-Transport-Security')
  .map((h) => [h.key, h.value.replace('; upgrade-insecure-requests', '')]);

const chat = require('./api/chat.js');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml'
};
const BLOCKED = /(^|\/)(\.env.*|\.git|node_modules|dev-server\.js|api)(\/|$)/;

http.createServer((req, res) => {
  for (const [k, v] of SECURITY_HEADERS) res.setHeader(k, v);
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/api/chat') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 20000) req.destroy(); });
    req.on('end', () => {
      try { req.body = JSON.parse(body); } catch (e) { req.body = null; }
      Promise.resolve(chat(req, res)).catch((e) => { console.error(e); res.statusCode = 500; res.end(); });
    });
    return;
  }

  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep) || BLOCKED.test(path.relative(ROOT, file))) {
    res.statusCode = 404; return res.end('Not found');
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader('Content-Type', TYPES['.html']);
      return fs.createReadStream(path.join(ROOT, '404.html')).pipe(res);
    }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(data);
  });
}).listen(PORT, () => {
  const key = process.env.GEMINI_API_KEY;
  const hasKey = key && key !== 'paste-your-key-here';
  console.log(`\nSiswaa site running at http://localhost:${PORT}`);
  console.log(hasKey
    ? `Chat: real AI (${process.env.GEMINI_MODEL || 'gemini-3.8-flash'}), key loaded from .env.local`
    : 'Chat: FAQ answers only. Put GEMINI_API_KEY in .env.local and restart for real AI.');
  console.log('Press Ctrl+C to stop.\n');
});
