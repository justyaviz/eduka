
CREATE TABLE IF NOT EXISTS cashbox_transactions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'in',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'cash',
  note TEXT,
  payment_id BIGINT,
  created_by BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS cashbox_closings (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_in NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_out NUMERIC(14,2) NOT NULL DEFAULT 0,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  closed_by BIGINT,
  note TEXT
);
CREATE TABLE IF NOT EXISTS teacher_payroll (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
  period TEXT NOT NULL,
  base_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  bonus_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS platform_tariff_features (
  id BIGSERIAL PRIMARY KEY,
  plan_code TEXT NOT NULL,
  feature_code TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(plan_code, feature_code)
);
CREATE TABLE IF NOT EXISTS parent_access_sessions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  parent_phone TEXT,
  telegram_user_id TEXT,
  telegram_chat_id TEXT,
  token_hash TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_telegram_user_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_telegram_chat_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_access_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS debt_amount NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_sent_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
INSERT INTO platform_tariff_features(plan_code,feature_code,enabled,limits) VALUES
('start','student_app',TRUE,'{"students":100}'::jsonb),('start','gamification',FALSE,'{}'::jsonb),('start','parent_access',FALSE,'{}'::jsonb),
('pro','student_app',TRUE,'{"students":500}'::jsonb),('pro','gamification',TRUE,'{}'::jsonb),('pro','telegram_bot',TRUE,'{}'::jsonb),
('business','finance',TRUE,'{}'::jsonb),('business','parent_access',TRUE,'{}'::jsonb),('enterprise','custom_branding',TRUE,'{}'::jsonb)
ON CONFLICT(plan_code,feature_code) DO NOTHING;
