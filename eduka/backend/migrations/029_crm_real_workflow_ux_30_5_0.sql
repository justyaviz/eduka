-- Eduka 30.5.0 — CRM Real Workflow & UX Final
CREATE TABLE IF NOT EXISTS group_students (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL,
  group_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at DATE DEFAULT CURRENT_DATE,
  left_at DATE,
  monthly_price NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, group_id, student_id)
);
ALTER TABLE group_students ADD COLUMN IF NOT EXISTS monthly_price NUMERIC(14,2) DEFAULT 0;
ALTER TABLE group_students ADD COLUMN IF NOT EXISTS joined_at DATE DEFAULT CURRENT_DATE;
ALTER TABLE group_students ADD COLUMN IF NOT EXISTS left_at DATE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS monthly_price NUMERIC(14,2) DEFAULT 0;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS days TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS room TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qr_token TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS telegram_sent_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_cancelled_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS crm_payment_plans (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  group_id BIGINT,
  monthly_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS crm_receipt_events (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  payment_id BIGINT,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS crm_role_permissions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  role TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, role)
);
