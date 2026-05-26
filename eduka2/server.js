const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': status === 200 ? 'public, max-age=3600' : 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  res.end(body);
}

function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/\\/g, '/');
  const requested = clean === '/' || clean === '/uz' ? '/index.html' : clean;
  const full = path.normalize(path.join(PUBLIC_DIR, requested));
  if (!full.startsWith(PUBLIC_DIR)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/health') {
    return send(res, 200, JSON.stringify({
      ok: true,
      status: 'healthy',
      service: 'eduka-landing-2',
      version: '2.0.0',
      time: new Date().toISOString()
    }), 'application/json; charset=utf-8');
  }

  if (url.pathname === '/health') {
    return send(res, 200, 'OK');
  }

  if (url.pathname === '/preview') {
    const file = path.join(PUBLIC_DIR, 'preview.html');
    return fs.readFile(file, (err, data) => err ? send(res, 404, 'Not found') : send(res, 200, data, MIME['.html']));
  }

  const filePath = safePath(url.pathname);
  if (!filePath) return send(res, 403, 'Forbidden');

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      return fs.readFile(filePath, (readErr, data) => {
        if (readErr) return send(res, 500, 'Server error');
        send(res, 200, data, MIME[ext] || 'application/octet-stream');
      });
    }

    const index = path.join(PUBLIC_DIR, 'index.html');
    fs.readFile(index, (indexErr, data) => {
      if (indexErr) return send(res, 404, 'Not found');
      send(res, 200, data, MIME['.html']);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`EDUKA 2.0 running on http://${HOST}:${PORT}`);
  console.log(`Healthcheck: /api/health`);
});
