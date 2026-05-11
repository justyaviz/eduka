-- Eduka 27.0.0 — Production Stable Fix
-- Safe, idempotent migration for old Railway databases.

CREATE TABLE IF NOT EXISTS production_audit_runs (
  id BIGSERIAL PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'full',
  status TEXT NOT NULL DEFAULT 'completed',
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_issue_logs (
  id BIGSERIAL PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'general',
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS student_app_sessions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  student_id BIGINT,
  telegram_user_id TEXT,
  token_hash TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS student_reward_products (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  name TEXT NOT NULL DEFAULT 'Sovg''a',
  description TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  coin_price INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_coin_transactions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  student_id BIGINT,
  teacher_id BIGINT,
  amount INTEGER NOT NULL DEFAULT 0,
  type TEXT DEFAULT 'earn',
  reason TEXT DEFAULT '',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_reward_redemptions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  student_id BIGINT,
  product_id BIGINT,
  coin_price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_notifications (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  student_id BIGINT,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL DEFAULT 'Xabar',
  body TEXT DEFAULT '',
  action_url TEXT DEFAULT '',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telegram_notification_logs (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  student_id BIGINT,
  chat_id TEXT,
  type TEXT NOT NULL DEFAULT 'system',
  status TEXT NOT NULL DEFAULT 'skipped',
  message TEXT DEFAULT '',
  error TEXT DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parent_access_links (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  student_id BIGINT,
  parent_name TEXT DEFAULT '',
  parent_phone TEXT DEFAULT '',
  telegram_user_id TEXT,
  telegram_chat_id TEXT,
  token_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_cashdesk_entries (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  user_id BIGINT,
  payment_id BIGINT,
  type TEXT NOT NULL DEFAULT 'income',
  category TEXT DEFAULT 'payment',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  method TEXT DEFAULT 'cash',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_provider_settings (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'setup',
  public_key TEXT DEFAULT '',
  secret_ref TEXT DEFAULT '',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, provider)
);

ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS telegram_user_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_app_password_hash TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS app_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_code TEXT DEFAULT 'Start';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS license_expires_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_token TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'cash';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS telegram_sent_at TIMESTAMPTZ;
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days');
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE student_app_sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;

CREATE INDEX IF NOT EXISTS stable27_students_org_idx ON students(organization_id);
CREATE INDEX IF NOT EXISTS stable27_students_phone_idx ON students(normalized_phone);
CREATE INDEX IF NOT EXISTS stable27_payments_org_student_idx ON payments(organization_id, student_id);
CREATE INDEX IF NOT EXISTS stable27_coin_student_idx ON student_coin_transactions(organization_id, student_id);
CREATE INDEX IF NOT EXISTS stable27_notifications_student_idx ON student_notifications(organization_id, student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stable27_sessions_token_idx ON student_app_sessions(token_hash);
CREATE INDEX IF NOT EXISTS stable27_parent_phone_idx ON parent_access_links(parent_phone);
CREATE INDEX IF NOT EXISTS stable27_tg_logs_org_idx ON telegram_notification_logs(organization_id, created_at DESC);
