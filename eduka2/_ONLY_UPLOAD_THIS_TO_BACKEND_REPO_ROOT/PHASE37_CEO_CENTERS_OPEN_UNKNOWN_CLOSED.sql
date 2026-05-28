-- EDUKA Phase 3.7 — CEO Centers Open, Unknown Closed

-- Bu SQL mavjud CEO markazlarni majburan ochish uchun emas,
-- faqat kerakli ustunlar/indexlarni tayyorlaydi.
-- Muhim yechim kodda: mavjud organizations/centers yozuvi bor subdomain ochiladi.

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS admin_password TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_by_ceo BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_organizations_subdomain_lower
  ON organizations(lower(COALESCE(subdomain, name)));

-- CEO ro‘yxatida bor markazlarni belgilab qo‘yish:
UPDATE organizations
SET created_by_ceo = TRUE,
    approved_at = COALESCE(approved_at, NOW())
WHERE COALESCE(subdomain, '') <> ''
   OR COALESCE(name, '') <> '';

-- Tekshirish:
-- SELECT id, name, subdomain, status, created_by_ceo FROM organizations ORDER BY created_at DESC;
