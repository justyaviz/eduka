-- EDUKA Phase 3.6 — Existing CEO Centers Allow Fix

-- Sabab:
-- Phase 3.5 faqat created_by_ceo=TRUE bo‘lgan markazlarni ochardi.
-- Oldin yaratilgan real markazlarda bu qiymat NULL/FALSE bo‘lishi mumkin.
-- Shu sabab CEO’da bor markazlar ham ochilmay qolgan.

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS admin_password TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_by_ceo BOOLEAN DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_organizations_strict_subdomain
  ON organizations(lower(COALESCE(subdomain, name)));

-- Oldin CEO orqali yaratilgan markazlarni tasdiqlash:
-- Login/parol/email/telefon ma’lumoti bor real markazlar ochilishi uchun tasdiqlanadi.
UPDATE organizations
SET created_by_ceo = TRUE,
    approved_at = COALESCE(approved_at, NOW()),
    status = COALESCE(status, 'active'),
    deleted_at = NULL
WHERE deleted_at IS NULL
  AND (
    COALESCE(admin_password, '') <> ''
    OR COALESCE(email, '') <> ''
    OR COALESCE(phone, '') <> ''
    OR COALESCE(owner_name, '') <> ''
  );

-- Agar bitta aniq markazni tasdiqlash kerak bo‘lsa:
-- UPDATE organizations SET created_by_ceo=TRUE, approved_at=NOW(), status='active', deleted_at=NULL
-- WHERE lower(COALESCE(subdomain, name)) = lower('jun');
