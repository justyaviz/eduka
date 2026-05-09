-- Eduka 22.1.3 hotfix: run once in Railway Postgres if deploy still reports 42703 schedule_enabled
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS attendance_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS profile_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS rewards_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS achievements_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS homework_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS materials_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS online_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE;
INSERT INTO student_app_settings (organization_id)
SELECT id FROM organizations
ON CONFLICT (organization_id) DO NOTHING;
