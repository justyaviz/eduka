-- EDUKA Phase 3.4 Hard Tenant Gate SQL
-- Unknown/random subdomainlarni bloklash uchun.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS admin_password TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_by_ceo BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS crm_tenant_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  email TEXT,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_sessions (
  token TEXT PRIMARY KEY,
  tenant TEXT NOT NULL,
  admin_id UUID,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_strict_subdomain
  ON organizations(lower(COALESCE(subdomain, name)));
CREATE INDEX IF NOT EXISTS idx_crm_tenant_admins_tenant ON crm_tenant_admins(tenant);
CREATE INDEX IF NOT EXISTS idx_crm_sessions_tenant ON crm_sessions(tenant);

-- DIQQAT:
-- CEO panel orqali yaratilgan markazlarda created_by_ceo = TRUE bo‘lishi shart.
-- Random/autocreated eski tenantlarni bloklash uchun:
-- UPDATE organizations SET created_by_ceo = FALSE WHERE created_by_ceo IS NULL;
