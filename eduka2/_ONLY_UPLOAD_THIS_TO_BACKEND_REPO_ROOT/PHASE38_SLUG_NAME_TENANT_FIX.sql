-- EDUKA Phase 3.8 — Slug Name Tenant Fix
-- CEO’da markaz nomi "ILM CHASHMALARI" bo‘lsa, URL "ilm-chashmalari.eduka.uz" ochilishi uchun.

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Postgres slugify function
CREATE OR REPLACE FUNCTION eduka_slugify(input_text TEXT)
RETURNS TEXT AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(input_text, '')), '[^a-z0-9]+', '-', 'g'));
$$ LANGUAGE SQL IMMUTABLE;

-- Subdomain bo‘sh bo‘lsa, name’dan slug yozib qo‘yadi.
UPDATE organizations
SET subdomain = eduka_slugify(name)
WHERE (subdomain IS NULL OR subdomain = '')
  AND COALESCE(name, '') <> '';

CREATE INDEX IF NOT EXISTS idx_organizations_subdomain_lower
  ON organizations(lower(COALESCE(subdomain, name)));

-- Tekshirish:
-- SELECT id, name, subdomain FROM organizations ORDER BY id DESC;
