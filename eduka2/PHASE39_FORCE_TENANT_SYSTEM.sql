-- EDUKA Phase 3.9 Force Tenant System SQL

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE organizations
SET subdomain = trim(both '-' from regexp_replace(lower(coalesce(name, '')), '[^a-z0-9]+', '-', 'g'))
WHERE (subdomain IS NULL OR subdomain = '')
  AND COALESCE(name, '') <> '';

CREATE INDEX IF NOT EXISTS idx_organizations_subdomain_lower
  ON organizations(lower(COALESCE(subdomain, name)));

-- Tekshir:
-- SELECT id, name, subdomain, status FROM organizations ORDER BY id DESC;
