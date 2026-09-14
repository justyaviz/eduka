const { tenantFromRequest, findCenterByTenant, normalizeHost } = require('./utils/tenant');

const cache = new Map();
const CACHE_MS = Number(process.env.TENANT_CACHE_MS || 30000);

async function cachedCenter(tenant) {
  const now = Date.now();
  const current = cache.get(tenant);
  if (current && current.expires > now) return current.value;
  const value = await findCenterByTenant(tenant);
  cache.set(tenant, { value, expires: now + CACHE_MS });
  return value;
}

function notFoundHtml(req, tenant) {
  const host = normalizeHost(req.headers['x-forwarded-host'] || req.headers.host || '');
  return `<!doctype html>
<html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>O‘quv markaz topilmadi — EDUKA</title>
<style>*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif;background:linear-gradient(135deg,#f7fbff,#eef4ff);color:#071137;min-height:100vh;display:grid;place-items:center;padding:24px}.card{width:min(560px,100%);background:#fff;border:1px solid #e4ebf6;border-radius:28px;box-shadow:0 30px 90px rgba(6,18,62,.14);padding:38px}.logo{display:flex;align-items:center;gap:12px;font-size:26px;font-weight:950;margin-bottom:22px}.mark{width:38px;height:38px;border-radius:11px;background:#1455ff;color:#fff;display:grid;place-items:center;font-weight:950}.badge{display:inline-flex;background:#fff1f2;color:#e11d48;border-radius:999px;padding:8px 14px;font-weight:900;margin-bottom:18px}h1{font-size:36px;line-height:1.05;margin:0 0 14px}p{font-size:16px;line-height:1.7;color:#5c6a86;margin:0 0 24px}b{color:#071137}.actions{display:flex;gap:12px;flex-wrap:wrap}a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border-radius:14px;text-decoration:none;font-weight:900}a.primary{background:#1455ff;color:#fff}a.secondary{background:#eef4ff;color:#1455ff}.host{margin-top:18px;color:#7b89a3;font-size:13px}</style>
</head><body><div class="card"><div class="logo"><div class="mark">↗</div><span>EDUKA</span></div><span class="badge">Subdomain topilmadi</span><h1>O‘quv markaz topilmadi</h1><p><b>${String(tenant || '').replace(/[<>]/g, '')}.eduka.uz</b> subdomaini EDUKA CEO panelidagi markazlar ro‘yxatida topilmadi.</p><div class="actions"><a class="primary" href="tel:+998998939000">+998 99 893 90 00</a><a class="secondary" href="https://t.me/eduka_sales" target="_blank" rel="noopener">Telegram support</a></div><div class="host">Host: ${host.replace(/[<>]/g, '')}</div></div></body></html>`;
}

function installPhase35HardPageGate(app) {
  app.use(async (req, res, next) => {
    if (req.method !== 'GET') return next();
    const tenant = tenantFromRequest(req);
    if (!tenant) return next();

    try {
      const center = await cachedCenter(tenant);
      if (center) return next();

      if ((req.path || '').startsWith('/api/')) {
        return res.status(404).json({ ok: false, code: 'TENANT_NOT_FOUND', tenant, message: 'O‘quv markaz topilmadi' });
      }
      return res.status(404).send(notFoundHtml(req, tenant));
    } catch (error) {
      // DB vaqtincha ishlamasa tenantni "mavjud emas" deb noto‘g‘ri ko‘rsatmaymiz.
      return next(error);
    }
  });
}

module.exports = {
  installPhase35HardPageGate,
  phase35Subdomain: tenantFromRequest,
  phase35NotFoundHtml: (req) => notFoundHtml(req, tenantFromRequest(req)),
  phase35TenantExists: async (req) => !!(await cachedCenter(tenantFromRequest(req))),
  phase37GetTenantRecord: async (req) => cachedCenter(tenantFromRequest(req)),
  phase37FindCenterRecord: cachedCenter,
};
