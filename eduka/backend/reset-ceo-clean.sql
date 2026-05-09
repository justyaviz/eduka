-- Eduka 21.8.2 CEO clean reset
-- Railway Postgres > Database > Query oynasida ishga tushiring.
-- Natija: barcha demo/markaz/o'quvchi/o'qituvchi/guruh/to'lovlar o'chadi va faqat CEO super admin qoladi.

BEGIN;

DO $$
DECLARE
  sql_text TEXT;
BEGIN
  SELECT
    'TRUNCATE TABLE ' ||
    string_agg(format('%I.%I', schemaname, tablename), ', ') ||
    ' RESTART IDENTITY CASCADE'
  INTO sql_text
  FROM pg_tables
  WHERE schemaname = 'public';

  IF sql_text IS NOT NULL THEN
    EXECUTE sql_text;
  END IF;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS temporary_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '["*"]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

INSERT INTO users (
  organization_id,
  full_name,
  email,
  phone,
  normalized_phone,
  role,
  password_hash,
  is_active,
  temporary_password,
  permissions,
  metadata,
  created_at,
  updated_at
)
VALUES (
  NULL,
  'Yaviz Super Admin',
  'yaviz@eduka.uz',
  '+998200049899',
  '998200049899',
  'super_admin',
  'scrypt$eduka-owner-final-2026$5d26c0d626efa8f44e81062a11c8ae09764685f0d79e247ffb6ccce77a08bea0f45c9a1cc184cc37a6632109da575366f341cf2d05ec3ed08c8dceecb9c69b6d',
  TRUE,
  FALSE,
  '["*"]'::jsonb,
  '{"owner": true, "clean_install": true, "created_by": "reset-ceo-clean.sql"}'::jsonb,
  NOW(),
  NOW()
);

COMMIT;

-- Tekshirish:
-- SELECT 'organizations' AS table_name, COUNT(*) FROM organizations
-- UNION ALL SELECT 'users', COUNT(*) FROM users
-- UNION ALL SELECT 'students', COUNT(*) FROM students
-- UNION ALL SELECT 'teachers', COUNT(*) FROM teachers
-- UNION ALL SELECT 'groups', COUNT(*) FROM groups
-- UNION ALL SELECT 'payments', COUNT(*) FROM payments;
