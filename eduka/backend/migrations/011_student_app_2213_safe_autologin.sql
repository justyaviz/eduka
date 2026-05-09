-- Eduka 22.1.3 — safe Student App compatibility for existing Railway databases
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS attendance_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS profile_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS rewards_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS achievements_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS homework_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS materials_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS online_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Safe row creation: avoid INSERT target columns that may not exist before compatibility is applied.
INSERT INTO student_app_settings (organization_id)
SELECT id FROM organizations
ON CONFLICT (organization_id) DO NOTHING;
