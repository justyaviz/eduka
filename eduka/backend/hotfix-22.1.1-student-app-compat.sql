-- Eduka 22.1.1 hotfix for existing Railway Postgres databases.
-- Run this manually only if deploy still crashes with PostgreSQL code 42703.

CREATE TABLE IF NOT EXISTS student_app_settings (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS crystals_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS coins_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS rating_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS referral_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS library_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS dictionary_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS extra_lessons_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS exams_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS news_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS payments_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS complaints_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS theme_primary TEXT NOT NULL DEFAULT '#0A84FF';
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS app_name TEXT NOT NULL DEFAULT 'Eduka Student App';
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS support_text TEXT;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS session_days INTEGER NOT NULL DEFAULT 30;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS attendance_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS profile_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS rewards_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS achievements_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS homework_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS materials_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS online_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS student_app_modules (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL
);
ALTER TABLE student_app_modules ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE student_app_modules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE student_app_modules ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE student_app_modules ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_modules ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE student_app_modules ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS student_app_modules_org_key_unique_2211_hotfix ON student_app_modules (organization_id, key);
