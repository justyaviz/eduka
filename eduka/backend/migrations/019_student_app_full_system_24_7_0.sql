-- Eduka 24.7.0 — Student App Full System Final
CREATE TABLE IF NOT EXISTS student_app_sessions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  student_id BIGINT,
  telegram_user_id TEXT,
  token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  revoked_at TIMESTAMPTZ
);
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS organization_id BIGINT;
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS student_id BIGINT;
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS telegram_user_id TEXT;
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS token_hash TEXT;
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS student_app_sessions_token_hash_247_idx ON student_app_sessions(token_hash);
CREATE INDEX IF NOT EXISTS student_app_sessions_student_247_idx ON student_app_sessions(organization_id, student_id);
CREATE INDEX IF NOT EXISTS student_app_sessions_active_247_idx ON student_app_sessions(student_id, expires_at) WHERE revoked_at IS NULL;

ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS payments_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS attendance_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS coins_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS rewards_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS reward_shop_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS rating_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS achievements_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS materials_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS homework_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS tests_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS telegram_notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS parent_access_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE students ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS app_password_hash TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS app_password_set_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS app_password_reset_required BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_student_app_login TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS telegram_user_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_app_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_app_blocked BOOLEAN DEFAULT FALSE;
