const jwt = require('jsonwebtoken');
const { tenantFromRequest, findCenterByTenant } = require('../utils/tenant');

const PROD = process.env.NODE_ENV === 'production';
const BLOCKED_CENTER_STATUSES = new Set(['Suspended', 'Expired', 'Blocked']);

function jwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (PROD) {
    throw new Error('JWT_SECRET is required in production');
  }
  return 'dev-only-eduka-secret';
}

function signCenterToken(user, center) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      centerId: user.center_id || center?.id,
      centerName: center?.name,
      subdomain: center?.subdomain,
    },
    jwtSecret(),
    { expiresIn: '7d' }
  );
}

async function requireCenterAuth(req, res, next) {
  const header = String(req.headers.authorization || '');
  const cookie=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('eduka_session='));
  const token = header.startsWith('Bearer ') ? header.slice(7) : cookie?.slice('eduka_session='.length);
  if (!token) return res.status(401).json({ ok: false, error: 'Unauthorized' });

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret());
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid token' });
  }

  if (!payload.centerId) {
    return res.status(401).json({ ok: false, error: 'Center token required' });
  }

  try {
    const tenant = tenantFromRequest(req);

    // Production CRM APIs must always be opened through a center subdomain.
    // This prevents a valid token from one center being replayed on another
    // *.eduka.uz host (or on the root domain).
    if (PROD && !tenant) {
      return res.status(403).json({
        ok: false,
        code: 'TENANT_HOST_REQUIRED',
        error: 'CRM markaz subdomaini orqali ochilishi kerak',
      });
    }

    if (tenant) {
      const center = await findCenterByTenant(tenant);
      if (!center) {
        return res.status(404).json({
          ok: false,
          code: 'TENANT_NOT_FOUND',
          error: 'O‘quv markaz topilmadi',
        });
      }

      if (String(center.id) !== String(payload.centerId)) {
        return res.status(403).json({
          ok: false,
          code: 'TENANT_TOKEN_MISMATCH',
          error: 'Bu login boshqa o‘quv markaziga tegishli',
        });
      }

      if (BLOCKED_CENTER_STATUSES.has(String(center.status || ''))) {
        return res.status(403).json({
          ok: false,
          code: 'CENTER_BLOCKED',
          error: 'Markaz vaqtincha bloklangan',
        });
      }

      req.tenant = tenant;
      req.center = center;
    }

    req.centerUser = payload;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { signCenterToken, requireCenterAuth };
