const pool = require('../db');

function normalizeHost(host) {
  return String(host || '')
    .split(',')[0]
    .trim()
    .split(':')[0]
    .toLowerCase();
}

function rootDomain() {
  return String(process.env.BASE_DOMAIN || 'eduka.uz')
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}

function normalizeTenantSlug(value) {
  const root = rootDomain();
  let v = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .split(':')[0]
    .replace(/^www\./, '')
    .replace(/\.$/, '');

  if (v.endsWith(`.${root}`)) {
    v = v.slice(0, -(`.${root}`).length);
  }

  // EDUKA uses one tenant level: <center>.eduka.uz
  return v.split('.')[0] || null;
}

function tenantFromRequest(req) {
  const host = normalizeHost(req.headers['x-forwarded-host'] || req.headers.host || '');
  const root = rootDomain();

  if (!host || host === root || host === `www.${root}`) return null;
  if (host.includes('localhost') || host.includes('127.0.0.1') || host.endsWith('.railway.app')) return null;
  if (!host.endsWith(`.${root}`)) return null;

  const left = host.slice(0, -(`.${root}`).length);
  return normalizeTenantSlug(left);
}

async function findCenterByTenant(tenant) {
  const slug = normalizeTenantSlug(tenant);
  if (!slug) return null;
  const root = rootDomain();
  const result = await pool.query(
    `SELECT *
       FROM centers
      WHERE lower(subdomain) = lower($1)
         OR lower(subdomain) = lower($1 || $2)
      LIMIT 1`,
    [slug, `.${root}`]
  );
  return result.rows[0] || null;
}

module.exports = {
  normalizeHost,
  rootDomain,
  normalizeTenantSlug,
  tenantFromRequest,
  findCenterByTenant,
};
