const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const publicDir = path.join(__dirname, 'public');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function send(res, code, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(code, {
    'Content-Type': type,
    'Cache-Control': code === 200 ? 'public, max-age=60' : 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/health') {
    return send(res, 200, JSON.stringify({ ok: true, status: 'healthy', service: 'eduka-landing', version: '2.0.1', time: new Date().toISOString() }), 'application/json; charset=utf-8');
  }

  let filePath;
  if (url.pathname === '/' || url.pathname === '/uz' || url.pathname === '/uz/') {
    filePath = path.join(publicDir, 'index.html');
  } else if (url.pathname === '/preview' || url.pathname === '/preview/') {
    filePath = path.join(publicDir, 'index.html');
  } else {
    filePath = path.normalize(path.join(publicDir, decodeURIComponent(url.pathname)));
    if (!filePath.startsWith(publicDir)) return send(res, 403, 'Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (!path.extname(filePath)) {
        return fs.readFile(path.join(publicDir, 'index.html'), (spaErr, html) => {
          if (spaErr) return send(res, 404, 'Not found');
          send(res, 200, html, 'text/html; charset=utf-8');
        });
      }
      return send(res, 404, 'Not found');
    }
    send(res, 200, data, mime[path.extname(filePath)] || 'application/octet-stream');
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Eduka landing running on http://${HOST}:${PORT}`);
});
