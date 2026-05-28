-- EDUKA Phase 4.0 — Tenant Login Force Fix SQL

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS admin_password TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE organizations
SET subdomain = trim(both '-' from regexp_replace(lower(coalesce(name, '')), '[^a-z0-9]+', '-', 'g'))
WHERE (subdomain IS NULL OR subdomain = '')
  AND COALESCE(name, '') <> '';

CREATE TABLE IF NOT EXISTS crm_tenant_admins (
  id SERIAL PRIMARY KEY,
  tenant TEXT NOT NULL,
  name TEXT,
  email TEXT,
  phone TEXT,
  password TEXT,
  role TEXT DEFAULT 'admin',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_sessions (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  tenant TEXT NOT NULL,
  admin_id INTEGER,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_tenant_admins_tenant ON crm_tenant_admins(lower(tenant));
CREATE INDEX IF NOT EXISTS idx_crm_sessions_token ON crm_sessions(token);

-- Agar organizations ichida admin_password mavjud bo‘lsa, admin login yaratadi.
INSERT INTO crm_tenant_admins(tenant, name, email, phone, password, role, status)
SELECT
  trim(both '-' from regexp_replace(lower(coalesce(subdomain, name)), '[^a-z0-9]+', '-', 'g')) AS tenant,
  COALESCE(owner_name, name, 'Admin') AS name,
  COALESCE(email, 'admin@' || trim(both '-' from regexp_replace(lower(coalesce(subdomain, name)), '[^a-z0-9]+', '-', 'g')) || '.eduka.uz') AS email,
  COALESCE(phone, '') AS phone,
  admin_password AS password,
  'admin' AS role,
  'active' AS status
FROM organizations
WHERE COALESCE(admin_password, '') <> ''
  AND NOT EXISTS (
    SELECT 1 FROM crm_tenant_admins a
    WHERE lower(a.tenant)=lower(trim(both '-' from regexp_replace(lower(coalesce(organizations.subdomain, organizations.name)), '[^a-z0-9]+', '-', 'g')))
  );

-- Tekshirish:
-- SELECT tenant, name, email, phone, password, status FROM crm_tenant_admins ORDER BY id DESC;
