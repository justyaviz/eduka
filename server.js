const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
const VERSION = process.env.EDUKA_VERSION || '2.0.0';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'X-Eduka-Version': VERSION,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer-when-downgrade',
    'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-store',
    ...headers
  });
  res.end(body);
}

function sendJson(res, status, payload) {
  send(res, status, JSON.stringify(payload, null, 2), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  });
}

const appRoutes = new Set([
  '/', '/login', '/ceo', '/ceo/centers', '/ceo/billing', '/admin', '/admin/students',
  '/admin/finance', '/admin/attendance', '/teacher', '/student-app', '/preview'
]);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/api/health') {
    sendJson(res, 200, { ok: true, status: 'healthy', service: 'eduka-2-final-rebuild', version: VERSION, time: new Date().toISOString() });
    return;
  }

  if (pathname.startsWith('/api/')) {
    sendJson(res, 200, { ok: true, message: 'Eduka 2.0 UI preview mode. Real CRM API will be connected in Eduka 2.1.', version: VERSION });
    return;
  }

  const safePath = path.normalize(pathname).replace(/^\.\.(\/|\\|$)/, '');
  const staticFile = path.join(PUBLIC_DIR, safePath);
  if (pathname.startsWith('/css/') || pathname.startsWith('/js/') || pathname.startsWith('/assets/')) {
    serveFile(res, staticFile);
    return;
  }

  if (appRoutes.has(pathname)) {
    serveFile(res, path.join(PUBLIC_DIR, 'index.html'));
    return;
  }

  serveFile(res, path.join(PUBLIC_DIR, 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Eduka 2.0 final rebuild running on 0.0.0.0:${PORT}`);
});
