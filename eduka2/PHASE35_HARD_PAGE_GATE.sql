-- EDUKA Phase 3.5 Hard Page Gate SQL
-- CRM HTML faqat CEO yaratgan subdomainlarga ochiladi.

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_by_ceo BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_organizations_strict_subdomain
  ON organizations(lower(COALESCE(subdomain, name)));

-- Eski avtomatik yaratilgan markazlar CRM ochmasligi uchun default false qoladi.
-- Real markaz CEO orqali yaratilganda created_by_ceo TRUE bo‘ladi.
