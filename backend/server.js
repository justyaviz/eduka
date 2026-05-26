const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const publicDir = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(body));
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(data);
  });
}

const routeMap = new Map([
  ['/', 'index.html'],
  ['/uz', 'index.html'],
  ['/uz/', 'index.html'],
  ['/uz/prices', 'prices.html'],
  ['/uz/prices/', 'prices.html'],
  ['/uz/gamification', 'gamification.html'],
  ['/uz/gamification/', 'gamification.html'],
  ['/uz/support', 'support.html'],
  ['/uz/support/', 'support.html'],
  ['/uz/vacancies', 'vacancies.html'],
  ['/uz/vacancies/', 'vacancies.html'],
  ['/uz/about', 'about.html'],
  ['/uz/about/', 'about.html'],
  ['/uz/contacts', 'contacts.html'],
  ['/uz/contacts/', 'contacts.html'],
  ['/uz/demo', 'demo.html'],
  ['/uz/demo/', 'demo.html'],
  ['/demo', 'demo.html'],
  ['/prices', 'prices.html']
]);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      status: 'healthy',
      service: 'eduka-landing',
      version: 'modme-style-1.0.0',
      time: new Date().toISOString()
    });
  }

  if (routeMap.has(pathname)) {
    return sendFile(res, path.join(publicDir, routeMap.get(pathname)));
  }

  const safePath = path.normalize(pathname).replace(/^([/\\])+/, '');
  const staticPath = path.join(publicDir, safePath);
  if (!staticPath.startsWith(publicDir)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.stat(staticPath, (err, stat) => {
    if (!err && stat.isFile()) return sendFile(res, staticPath);
    sendFile(res, path.join(publicDir, 'index.html'));
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Eduka landing running on http://${HOST}:${PORT}`);
});
