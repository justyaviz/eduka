require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { installPhase35HardPageGate } = require('./hard-page-gate');
const { normalizeHost, tenantFromRequest } = require('./utils/tenant');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const publicDir = path.join(__dirname, 'public');
const PROD = process.env.NODE_ENV === 'production';

let dbReady = false;
let dbError = null;
let dbStarted = false;

function sendPage(res, fileName) {
  const filePath = path.join(publicDir, fileName);
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  const fallback = path.join(publicDir, 'index.html');
  if (fs.existsSync(fallback)) return res.sendFile(fallback);
  return res.status(503).send('EDUKA public files missing');
}

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Juda ko‘p urinish. 15 daqiqadan keyin qayta urinib ko‘ring.' },
});
app.use(['/api/ceo/login', '/api/tenant/login', '/api/app/login'], authLimiter);

// Tenant gate API routelardan oldin: noma'lum subdomainlar API'ga ham kira olmaydi.
installPhase35HardPageGate(app);

app.get(['/api/health', '/health', '/healthz'], (req, res) => {
  const ready = dbStarted && dbReady && !dbError;
  res.status(ready ? 200 : 503).json({
    ok: ready,
    status: ready ? 'healthy' : 'starting',
    service: 'eduka',
    version: process.env.EDUKA_VERSION || '3.0.0',
    server: 'online',
    dbReady,
    dbStarted,
    dbError: PROD ? null : (dbError ? dbError.message : null),
    host: normalizeHost(req.headers['x-forwarded-host'] || req.headers.host),
    tenantSubdomain: tenantFromRequest(req),
    timestamp: new Date().toISOString(),
  });
});

if (!PROD) {
  app.get('/api/server-status', (req, res) => {
    res.status(dbError ? 500 : 200).json({
      ok: !dbError,
      dbReady,
      dbStarted,
      dbError: dbError ? dbError.message : null,
      databaseUrlExists: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV || null,
      host: normalizeHost(req.headers['x-forwarded-host'] || req.headers.host),
      tenantSubdomain: tenantFromRequest(req),
    });
  });
}

// API ROUTES — barcha API routelar SPA fallbackdan OLDIN.
const apiRoutes = require('./routes/api');
const centerRoutes = require('./routes/center-api');
const tenantRoutes = require('./routes/tenant-api');
app.use('/api', apiRoutes);
app.use('/api/app', centerRoutes);
app.use('/api/tenant', tenantRoutes);

// Static assets.
app.use(express.static(publicDir, {
  extensions: ['html'],
  maxAge: PROD ? '1h' : 0,
  fallthrough: true,
  index: false,
}));

// Public marketing pages.
app.get('/', (req, res) => tenantFromRequest(req) ? sendPage(res, 'app.html') : sendPage(res, 'index.html'));
app.get(['/uz', '/index.html'], (req, res) => tenantFromRequest(req) ? sendPage(res, 'app.html') : sendPage(res, 'index.html'));
app.get(['/gamification', '/uz/gamification'], (req, res) => tenantFromRequest(req) ? sendPage(res, 'app.html') : sendPage(res, 'gamification.html'));
app.get(['/prices', '/uz/prices'], (req, res) => tenantFromRequest(req) ? sendPage(res, 'app.html') : sendPage(res, 'prices.html'));
app.get(['/vacancies', '/uz/vacancies'], (req, res) => tenantFromRequest(req) ? sendPage(res, 'app.html') : sendPage(res, 'vacancies.html'));

app.get(['/ceo', '/ceo/', '/ceo/*'], (req, res) => sendPage(res, 'ceo.html'));
app.get(['/app', '/app/', '/app/*'], (req, res) => sendPage(res, 'app.html'));

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /ceo\nDisallow: /app\nSitemap: https://eduka.uz/sitemap.xml\n');
});

app.get('/sitemap.xml', (req, res) => {
  const urls = ['/', '/prices', '/gamification', '/vacancies'].map((urlPath) =>
    `<url><loc>https://eduka.uz${urlPath}</loc><changefreq>weekly</changefreq><priority>${urlPath === '/' ? '1.0' : '0.8'}</priority></url>`
  ).join('');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});

// API 404 SPA fallbackdan oldin.
app.all('/api/*', (req, res) => res.status(404).json({ ok: false, error: 'Not found' }));

// Final SPA/page fallback.
app.get('*', (req, res) => {
  if (tenantFromRequest(req)) return sendPage(res, 'app.html');
  if (req.path.startsWith('/ceo')) return sendPage(res, 'ceo.html');
  if (req.path.startsWith('/app')) return sendPage(res, 'app.html');
  return sendPage(res, 'index.html');
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) return next(err);
  return res.status(500).json({ ok: false, error: 'Server error', ...(PROD ? {} : { realError: err.message }) });
});

app.listen(PORT, HOST, () => {
  console.log(`✅ EDUKA running on ${HOST}:${PORT}`);
  console.log('✅ Healthcheck ready: /api/health');

  setTimeout(async () => {
    try {
      dbStarted = true;
      const { initDatabase } = require('./utils/init-db');
      const result = await initDatabase();
      dbReady = !!result.ok;
      dbError = result.ok ? null : new Error(result.error || 'Database init failed');
      if (dbReady) console.log('✅ DB migrations ready');
      else console.log('⚠️ DB setup failed:', dbError.message);
    } catch (error) {
      dbReady = false;
      dbError = error;
      console.error('❌ Background DB setup failed:', error.message);
    }
  }, 1200);
});
