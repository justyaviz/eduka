import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const publicDir = existsSync(distDir) ? distDir : path.join(__dirname, 'public');
const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

function safeResolve(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const clean = decoded === '/' ? '/index.html' : decoded;
  const target = path.normalize(path.join(publicDir, clean));
  if (!target.startsWith(publicDir)) return null;
  return target;
}

async function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const body = await readFile(filePath);
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': body.length,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  res.end(body);
}

const server = createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (reqUrl.pathname === '/api/health' || reqUrl.pathname === '/health') {
      return sendJson(res, 200, {
        ok: true,
        status: 'healthy',
        service: 'modme-landing',
        version: process.env.npm_package_version || '0.0.0',
        time: new Date().toISOString(),
      });
    }

    let filePath = safeResolve(reqUrl.pathname);
    if (!filePath) return sendJson(res, 403, { ok: false, message: 'Forbidden' });

    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!existsSync(filePath)) {
      const fallback = path.join(publicDir, 'index.html');
      if (existsSync(fallback)) return await sendFile(res, fallback);
      return sendJson(res, 404, { ok: false, message: 'Not found' });
    }

    return await sendFile(res, filePath);
  } catch (error) {
    console.error('Request failed:', error);
    return sendJson(res, 500, { ok: false, message: 'Internal server error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Modme landing server running on http://${HOST}:${PORT}`);
  console.log(`Serving static files from ${publicDir}`);
});
