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
  // The deployment image copies tracked source files again after the build.
  // public/app.html can therefore be stale; the untracked Vite output is authoritative.
  const filePath = path.join(publicDir, fileName === 'app.html' ? 'crm/index.html' : fileName);
  if (fileName === 'app.html') {
    // Tenant CRM shell must never be kept as a stale HTML document by a proxy/browser.
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Vary', 'Host');
    if (!fs.existsSync(filePath)) return res.status(503).send('EDUKA CRM yuklanmadi. Iltimos, keyinroq qayta urinib ko‘ring.');
  }
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  const fallback = path.join(publicDir, 'index.html');
  if (fs.existsSync(fallback)) return res.sendFile(fallback);
  return res.status(503).send('EDUKA public files missing');
}

const STATIC_ASSET_RE = /\.(?:css|js|mjs|png|jpe?g|webp|gif|svg|ico|avif|woff2?|ttf|otf|eot|map|json|txt|xml|pdf|zip)$/i;
function isStaticAssetPath(urlPath) {
  return STATIC_ASSET_RE.test(String(urlPath || ''));
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

// Unknown tenant subdomains fail closed before any CRM HTML is exposed.
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

const apiRoutes = require('./routes/api');
const centerRoutes = require('./routes/center-api');
const centerV05Actions = require('./routes/center-v05-actions');
const centerV06Finance = require('./routes/center-v06-finance');
const centerV07Leads = require('./routes/center-v07-leads');
const centerV08Settings = require('./routes/center-v08-settings');
const centerV081StaffRoles = require('./routes/center-v081-staff-roles');
const centerV082AcademicSettings = require('./routes/center-v082-academic-settings');
const centerV083Branches = require('./routes/center-v083-branches');
const centerV093Leads = require('./routes/center-v093-leads');
const centerV094Groups = require('./routes/center-v094-groups');
const centerV095Students = require('./routes/center-v095-students');
const centerV096Academic = require('./routes/center-v096-academic');
const centerV097FinancePayroll = require('./routes/center-v097-finance-payroll');
const centerV098Reports = require('./routes/center-v098-reports');
const centerV101Profile = require('./routes/center-v101-profile');
const centerV200DataEngine = require('./routes/center-v200-data-engine');
const tenantRoutes = require('./routes/tenant-api');
app.use('/api', apiRoutes);
app.use('/api/app', centerRoutes);
app.use('/api/app', centerV05Actions);
app.use('/api/app', centerV06Finance);
app.use('/api/app', centerV07Leads);
app.use('/api/app', centerV08Settings);
app.use('/api/app', centerV081StaffRoles);
app.use('/api/app', centerV082AcademicSettings);
app.use('/api/app', centerV083Branches);
app.use('/api/app', centerV093Leads);
app.use('/api/app', centerV094Groups);
app.use('/api/app', centerV095Students);
app.use('/api/app', centerV096Academic);
app.use('/api/app', centerV097FinancePayroll);
app.use('/api/app', centerV098Reports);
app.use('/api/app', centerV101Profile);
app.use('/api/app', centerV200DataEngine);
app.use('/api/tenant', tenantRoutes);
app.use('/api/sms', require('./routes/ceo-sms'));
app.use('/api/ceo/support', require('./routes/crm-support'));
app.use('/api/crm', require('./routes/crm-workspace'));

/*
 * CLIENT CRM HOST ROUTER
 * ----------------------
 * A valid center subdomain is an application host, not a marketing host.
 * Every page-like request on <center>.eduka.uz must therefore resolve to the
 * client CRM shell, including /, /index.html, /prices, /ceo and deep SPA URLs.
 * Static assets and APIs are allowed through normally.
 *
 * This middleware intentionally runs BEFORE express.static so a tenant can
 * never accidentally receive the landing/CEO HTML via an explicit .html URL.
 */
app.use((req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method)) return next();
  const tenant = tenantFromRequest(req);
  if (!tenant) return next();
  if (String(req.path || '').startsWith('/api/')) return next();
  if (isStaticAssetPath(req.path)) return next();
  return sendPage(res, 'app.html');
});

// The apex domain keeps only the public landing and CEO console. The client CRM
// is entered through a center subdomain; the old apex /app entry is retired.
app.get(['/app', '/app/', '/app.html'], (req, res) => {
  if (tenantFromRequest(req)) return sendPage(res, 'app.html');
  return res.redirect(302, '/');
});

app.use(express.static(publicDir, {
  extensions: ['html'],
  maxAge: PROD ? '1h' : 0,
  fallthrough: true,
  index: false,
}));

// Public landing routes. On tenant hosts these are intercepted above and open CRM.
app.get('/', (req, res) => tenantFromRequest(req) ? sendPage(res, 'app.html') : sendPage(res, 'index.html'));
app.get(['/uz', '/index.html'], (req, res) => tenantFromRequest(req) ? sendPage(res, 'app.html') : sendPage(res, 'index.html'));
app.get(['/gamification', '/uz/gamification'], (req, res) => tenantFromRequest(req) ? sendPage(res, 'app.html') : sendPage(res, 'gamification.html'));
app.get(['/prices', '/uz/prices'], (req, res) => tenantFromRequest(req) ? sendPage(res, 'app.html') : sendPage(res, 'prices.html'));
app.get(['/vacancies', '/uz/vacancies'], (req, res) => tenantFromRequest(req) ? sendPage(res, 'app.html') : sendPage(res, 'vacancies.html'));

// CEO design/routes stay untouched and are available only from the apex host.
app.get(['/ceo', '/ceo/', '/ceo/*'], (req, res) => {
  if (tenantFromRequest(req)) return sendPage(res, 'app.html');
  return sendPage(res, 'ceo.html');
});

// Old client CRM path on the apex host is intentionally retired.
app.get(['/app/*'], (req, res) => {
  if (tenantFromRequest(req)) return sendPage(res, 'app.html');
  return res.redirect(302, '/');
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /ceo\nDisallow: /app\nSitemap: https://eduka.uz/sitemap.xml\n');
});

app.get('/sitemap.xml', (req, res) => {
  const urls = ['/', '/prices', '/gamification', '/vacancies'].map((urlPath) =>
    `<url><loc>https://eduka.uz${urlPath}</loc><changefreq>weekly</changefreq><priority>${urlPath === '/' ? '1.0' : '0.8'}</priority></url>`
  ).join('');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});

app.all('/api/*', (req, res) => res.status(404).json({ ok: false, error: 'Not found' }));

app.get('*', (req, res) => {
  if (tenantFromRequest(req)) {
    if (isStaticAssetPath(req.path)) return res.status(404).end();
    return sendPage(res, 'app.html');
  }
  if (req.path.startsWith('/ceo')) return sendPage(res, 'ceo.html');
  if (req.path.startsWith('/app')) return res.redirect(302, '/');
  return sendPage(res, 'index.html');
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) return next(err);
  return res.status(500).json({ ok: false, error: 'Server error', ...(PROD ? {} : { realError: err.message }) });
});

if (require.main === module) app.listen(PORT, HOST, () => {
  console.log(`✅ EDUKA running on ${HOST}:${PORT}`);
  console.log('✅ Healthcheck ready: /api/health');

  setTimeout(async () => {
    try {
      dbStarted = true;
      const { initDatabase } = require('./utils/init-db');
      const result = await initDatabase();
      dbReady = !!result.ok;
      dbError = result.ok ? null : new Error(result.error || 'Database init failed');
      if (dbReady) {console.log('✅ DB migrations ready');require('./utils/crm-notifications').start(require('./db'));if(process.env.ESKIZ_EMAIL&&process.env.ESKIZ_PASSWORD)void require('./utils/eskiz').checkConnection(require('./db'));}
      else console.log('⚠️ DB setup failed:', dbError.message);
    } catch (error) {
      dbReady = false;
      dbError = error;
      console.error('❌ Background DB setup failed:', error.message);
    }
  }, 1200);
});

module.exports = app;
