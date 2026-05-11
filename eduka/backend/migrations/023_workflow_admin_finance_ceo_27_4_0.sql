-- Eduka 27.4.0 — Real Workflow, Admin CRM, Finance Accounting, CEO Monetization Final

CREATE TABLE IF NOT EXISTS workflow_test_runs (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE SET NULL,
  scope TEXT NOT NULL DEFAULT 'full-workflow',
  status TEXT NOT NULL DEFAULT 'draft',
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS workflow_issue_fixes (
  id BIGSERIAL PRIMARY KEY,
  run_id BIGINT REFERENCES workflow_test_runs(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  issue TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  solution TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS finance_cashbox_sessions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  opened_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  closed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_in NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_out NUMERIC(14,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS finance_cashbox_entries (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  session_id BIGINT REFERENCES finance_cashbox_sessions(id) ON DELETE SET NULL,
  payment_id BIGINT REFERENCES payments(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'in',
  category TEXT NOT NULL DEFAULT 'payment',
  method TEXT NOT NULL DEFAULT 'cash',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  note TEXT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS finance_expenses (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'other',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'cash',
  note TEXT,
  spent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS finance_teacher_salary (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
  period TEXT NOT NULL,
  base_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  bonus_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  penalty_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  payable_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS finance_bonuses (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'approved',
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_plan_catalog (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  monthly_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  annual_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_invoices (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_no TEXT UNIQUE,
  plan_code TEXT,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'UZS',
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_code TEXT DEFAULT 'start';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS limits JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE students ADD COLUMN IF NOT EXISTS debt_amount NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS canceled_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_token TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_sent_at TIMESTAMPTZ;

INSERT INTO platform_plan_catalog (code, name, monthly_price, annual_price, limits, features, sort_order)
VALUES
('start','Start',199000,1990000,'{"students":100,"teachers":5,"branches":1,"sms":0}'::jsonb,'{"student_app":true,"gamification":false,"telegram_bot":false,"parent_access":false}'::jsonb,10),
('pro','Pro',399000,3990000,'{"students":500,"teachers":25,"branches":3,"sms":1000}'::jsonb,'{"student_app":true,"gamification":true,"telegram_bot":true,"parent_access":false}'::jsonb,20),
('business','Business',799000,7990000,'{"students":1500,"teachers":75,"branches":10,"sms":5000}'::jsonb,'{"student_app":true,"gamification":true,"telegram_bot":true,"parent_access":true,"advanced_reports":true}'::jsonb,30),
('enterprise','Enterprise',0,0,'{"students":"unlimited","teachers":"unlimited","branches":"unlimited","sms":"custom"}'::jsonb,'{"student_app":true,"gamification":true,"telegram_bot":true,"parent_access":true,"advanced_reports":true,"custom_branding":true}'::jsonb,40)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, monthly_price=EXCLUDED.monthly_price, annual_price=EXCLUDED.annual_price, limits=EXCLUDED.limits, features=EXCLUDED.features, sort_order=EXCLUDED.sort_order, updated_at=NOW();

CREATE INDEX IF NOT EXISTS workflow_test_runs_org_idx ON workflow_test_runs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS finance_cashbox_entries_org_idx ON finance_cashbox_entries(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS finance_expenses_org_idx ON finance_expenses(organization_id, spent_at DESC);
CREATE INDEX IF NOT EXISTS platform_invoices_org_idx ON platform_invoices(organization_id, created_at DESC);
