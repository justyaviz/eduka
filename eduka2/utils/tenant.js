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

function tenantFromRequest(req) {
  const host = normalizeHost(req.headers['x-forwarded-host'] || req.headers.host || '');
  const root = rootDomain();

  if (!host || host === root || host === `www.${root}`) return null;
  if (host.includes('localhost') || host.includes('127.0.0.1') || host.endsWith('.railway.app')) return null;
  if (!host.endsWith(`.${root}`)) return null;

  const left = host.slice(0, -(`.${root}`).length);
  return left.split('.')[0] || null;
}

async function findCenterByTenant(tenant) {
  if (!tenant) return null;
  const result = await pool.query(
    `SELECT *
       FROM centers
      WHERE lower(subdomain) = lower($1)
         OR lower(subdomain) = lower($1 || '.eduka.uz')
      LIMIT 1`,
    [tenant]
  );
  return result.rows[0] || null;
}

module.exports = {
  normalizeHost,
  rootDomain,
  tenantFromRequest,
  findCenterByTenant,
};
