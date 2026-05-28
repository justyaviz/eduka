-- EDUKA Phase 3.3 Strict Tenant Isolation SQL
-- Muhim: bu SQL subdomain yo‘q bo‘lsa avtomatik markaz yaratmaydi.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS admin_password TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_organizations_subdomain ON organizations(lower(COALESCE(subdomain, name)));
CREATE INDEX IF NOT EXISTS idx_crm_tenant_admins_tenant ON crm_tenant_admins(tenant);
CREATE INDEX IF NOT EXISTS idx_crm_sessions_tenant ON crm_sessions(tenant);
