const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');
const VERSION = process.env.EDUKA_VERSION || '2.0.0-clean';

const routesToIndex = new Set([
  '/', '/ceo', '/ceo/dashboard', '/ceo/centers', '/ceo/billing', '/ceo/analytics',
  '/admin', '/admin/dashboard', '/admin/students', '/admin/finance', '/admin/attendance', '/admin/schedule',
  '/teacher', '/teacher/dashboard', '/student-app', '/student', '/login'
]);

function sendJson(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Eduka-Version': VERSION
  });
  res.end(body);
}

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon'
  }[ext] || 'application/octet-stream';
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) return sendJson(res, 404, { ok: false, message: 'Not found' });
    res.writeHead(200, {
      'Content-Type': contentType(filePath),
      'Content-Length': data.length,
      'Cache-Control': filePath.endsWith('.html') ? 'no-store' : 'public, max-age=86400',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Eduka-Version': VERSION
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/api/health' || pathname === '/health') {
    return sendJson(res, 200, { ok: true, status: 'healthy', service: 'eduka-2-clean', version: VERSION, time: new Date().toISOString(), requestId });
  }

  if (pathname === '/api/demo/stats') {
    return sendJson(res, 200, {
      ok: true,
      version: VERSION,
      ceo: { centers: 128, students: 38540, revenue: '12.45 mlrd', activeUsers: 29608 },
      center: { students: 1278, teachers: 58, groups: 96, attendance: 92.3, revenue: '128 450 000' },
      student: { balance: '1 280', attendance: 85, payments: '1 250 000' }
    });
  }

  if (routesToIndex.has(pathname)) return sendFile(res, path.join(PUBLIC_DIR, 'index.html'));

  const safePath = path.normalize(pathname).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath === '/' ? 'index.html' : safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) return sendJson(res, 403, { ok: false, message: 'Forbidden' });
  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) return sendFile(res, filePath);
    return sendFile(res, path.join(PUBLIC_DIR, 'index.html'));
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Eduka 2.0 clean running on http://${HOST}:${PORT}`);
  console.log(`Healthcheck: /api/health`);
});
