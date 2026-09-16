const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { signCenterToken } = require('../middleware/center-auth');
const { tenantFromRequest, findCenterByTenant } = require('../utils/tenant');

const router = express.Router();
const PROD = process.env.NODE_ENV === 'production';

function errorPayload(message, error) {
  const out = { ok: false, error: message };
  if (!PROD && error) out.realError = error.message;
  return out;
}

function bearer(req) {
  const h = String(req.headers.authorization || '');
  return h.startsWith('Bearer ') ? h.slice(7) : '';
}

function verifyCenterToken(token) {
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || (PROD ? null : 'dev-only-eduka-secret');
    if (!secret) return null;
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

router.get('/status', async (req, res) => {
  try {
    const tenant = tenantFromRequest(req);
    if (!tenant) {
      return res.json({ ok: true, tenant: null, root: true, loginRequired: true, authenticated: false });
    }

    const center = await findCenterByTenant(tenant);
    if (!center) {
      return res.status(404).json({
        ok: false,
        code: 'TENANT_NOT_FOUND',
        tenant,
        message: 'O‘quv markaz topilmadi. Iltimos, EDUKA admini bilan bog‘laning.',
      });
    }

    const payload = verifyCenterToken(bearer(req));
    const authenticated = !!(
      payload &&
      String(payload.centerId || '') === String(center.id) &&
      String(payload.subdomain || '').toLowerCase() === String(center.subdomain || '').toLowerCase()
    );

    return res.json({
      ok: true,
      tenant,
      center: {
        id: center.id,
        name: center.name,
        subdomain: center.subdomain,
        status: center.status,
        tariff: center.tariff,
      },
      authenticated,
      loginRequired: !authenticated,
    });
  } catch (error) {
    return res.status(500).json(errorPayload('Tenant status server error', error));
  }
});

router.post('/login', async (req, res) => {
  try {
    const origin=req.get('origin');
    if(origin){try{if(new URL(origin).hostname.toLowerCase()!==String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim().split(':')[0].toLowerCase())return res.status(403).json({ok:false,error:'Noto‘g‘ri so‘rov manbasi'})}catch{return res.status(403).json({ok:false,error:'Noto‘g‘ri so‘rov manbasi'})}}
    const tenant = tenantFromRequest(req);
    if (!tenant) return res.status(400).json({ ok: false, error: 'CRM login markaz subdomainida bajarilishi kerak' });

    const center = await findCenterByTenant(tenant);
    if (!center) return res.status(404).json({ ok: false, code: 'TENANT_NOT_FOUND', tenant, error: 'O‘quv markaz topilmadi' });
    if (['Suspended', 'Expired', 'Blocked'].includes(center.status)) {
      return res.status(403).json({ ok: false, error: 'Markaz vaqtincha bloklangan' });
    }

    const login = String(req.body?.email || req.body?.login || req.body?.phone || '').trim();
    const password = String(req.body?.password || '');
    if (!login || !password) return res.status(400).json({ ok: false, error: 'Login va parol kerak' });

    const result = await pool.query(
      `SELECT cu.*, c.name AS center_name, c.subdomain, c.status AS center_status
         FROM center_users cu
         JOIN centers c ON c.id = cu.center_id
        WHERE cu.center_id = $1
          AND cu.status = 'active'
          AND (
            lower(cu.email) = lower($2)
            OR (cu.role IN ('owner','director') AND lower(COALESCE(c.owner_email,'')) = lower($2))
            OR (cu.role IN ('owner','director') AND regexp_replace($2, '[^0-9]', '', 'g') <> '' AND regexp_replace(COALESCE(c.owner_phone,''), '[^0-9]', '', 'g') = regexp_replace($2, '[^0-9]', '', 'g'))
          )
        ORDER BY cu.created_at ASC
        LIMIT 1`,
      [center.id, login]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ ok: false, error: 'Login topilmadi' });

    let valid = await bcrypt.compare(password, user.password_hash).catch(() => false);
    if (!valid) {
      const pgCheck = await pool.query(
        `SELECT crypt($1, password_hash) = password_hash AS ok FROM center_users WHERE id=$2`,
        [password, user.id]
      ).catch(() => ({ rows: [{ ok: false }] }));
      valid = !!pgCheck.rows[0]?.ok;
    }
    if (!valid) return res.status(401).json({ ok: false, error: 'Parol xato' });

    await pool.query(`UPDATE center_users SET last_login_at=NOW(), updated_at=NOW() WHERE id=$1`, [user.id]);
    const token = signCenterToken(user, center);
    res.cookie('eduka_session',token,{httpOnly:true,secure:PROD,sameSite:'strict',path:'/',maxAge:7*24*60*60*1000});

    return res.json({
      ok: true,
      token,
      tenant,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        centerId: center.id,
      },
      center: {
        id: center.id,
        name: center.name,
        subdomain: center.subdomain,
        status: center.status,
        tariff: center.tariff,
      },
    });
  } catch (error) {
    return res.status(500).json(errorPayload('Tenant login server error', error));
  }
});

module.exports = router;
