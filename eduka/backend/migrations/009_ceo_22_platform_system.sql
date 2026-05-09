-- Eduka 22.0 CEO Platform System
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'Start';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS monthly_payment NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS student_limit INTEGER NOT NULL DEFAULT 100;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS teacher_limit INTEGER NOT NULL DEFAULT 5;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS branch_limit INTEGER NOT NULL DEFAULT 1;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sms_limit INTEGER NOT NULL DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER NOT NULL DEFAULT 1024;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE tariffs ADD COLUMN IF NOT EXISTS billing_period TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE tariffs ADD COLUMN IF NOT EXISTS group_limit INTEGER NOT NULL DEFAULT 20;
ALTER TABLE tariffs ADD COLUMN IF NOT EXISTS sms_limit INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tariffs ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER NOT NULL DEFAULT 1024;
ALTER TABLE tariffs ADD COLUMN IF NOT EXISTS feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE tariffs ADD COLUMN IF NOT EXISTS support_level TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE tariffs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS subscription_payments (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,
  invoice_id BIGINT REFERENCES subscription_invoices(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'paid',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS organization_feature_flags (
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  limit_value INTEGER,
  source TEXT NOT NULL DEFAULT 'plan',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, feature_key)
);
CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS support_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL DEFAULT 'admin',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO tariffs (name, monthly_price, student_limit, teacher_limit, branch_limit, group_limit, sms_limit, feature_flags, support_level)
VALUES
  ('Start', 99000, 100, 5, 1, 10, 0, '{"students":true,"groups":true,"teachers":true,"payments":true,"attendance":true,"reports":false,"student_app":false}'::jsonb, 'basic'),
  ('Growth', 249000, 500, 20, 3, 50, 1000, '{"students":true,"groups":true,"teachers":true,"payments":true,"attendance":true,"reports":true,"finance":true,"student_app":true,"telegram":true,"import_export":true}'::jsonb, 'priority'),
  ('Pro', 499000, 2000, 100, 10, 200, 5000, '{"students":true,"groups":true,"teachers":true,"payments":true,"attendance":true,"reports":true,"finance":true,"student_app":true,"parent_app":true,"telegram":true,"sms":true,"custom_domain":true,"api_access":true,"role_permission":true}'::jsonb, 'premium'),
  ('Enterprise', 0, 100000, 5000, 1000, 10000, 100000, '{"students":true,"groups":true,"teachers":true,"payments":true,"attendance":true,"reports":true,"finance":true,"student_app":true,"parent_app":true,"telegram":true,"sms":true,"custom_domain":true,"api_access":true,"role_permission":true,"custom_branding":true,"multi_branch":true}'::jsonb, 'dedicated')
ON CONFLICT DO NOTHING;
