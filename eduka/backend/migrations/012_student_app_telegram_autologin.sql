-- Eduka 22.1.4 — Telegram WebApp auto-login compatibility
CREATE TABLE IF NOT EXISTS student_app_sessions (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  telegram_user_id TEXT,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_address TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS telegram_user_id TEXT;
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS student_app_sessions_token_hash_idx ON student_app_sessions(token_hash);
CREATE INDEX IF NOT EXISTS student_app_sessions_telegram_idx ON student_app_sessions(telegram_user_id) WHERE telegram_user_id IS NOT NULL;

ALTER TABLE students ADD COLUMN IF NOT EXISTS telegram_user_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_student_app_login TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_app_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_app_blocked BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS student_app_settings (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS attendance_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS profile_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS rewards_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS achievements_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS materials_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS session_days INTEGER NOT NULL DEFAULT 30;
