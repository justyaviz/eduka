CREATE TABLE IF NOT EXISTS report_export_jobs (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'finance',
  format TEXT NOT NULL DEFAULT 'csv',
  status TEXT NOT NULL DEFAULT 'ready',
  file_url TEXT,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS payment_provider_webhooks (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  event_type TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS production_cleanup_runs (
  id BIGSERIAL PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'full',
  status TEXT NOT NULL DEFAULT 'completed',
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS launch_documents (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS platform_security_checks (
  id BIGSERIAL PRIMARY KEY,
  area TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE payment_integration_settings ADD COLUMN IF NOT EXISTS merchant_id TEXT;
ALTER TABLE payment_integration_settings ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE payment_integration_settings ADD COLUMN IF NOT EXISTS test_mode BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE platform_invoices ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE platform_invoices ADD COLUMN IF NOT EXISTS provider_payment_id TEXT;
ALTER TABLE platform_invoices ADD COLUMN IF NOT EXISTS payment_url TEXT;
ALTER TABLE platform_invoices ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS public_launch_ready BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_notes JSONB NOT NULL DEFAULT '{}'::jsonb;
INSERT INTO launch_documents (slug,title,content) VALUES
('deployment-guide','Deployment Guide','GitHub deploy, Railway redeploy, health/audit check, hotfix SQL, final role tests.'),
('pricing-guide','Pricing & Tariff Guide','Start, Pro, Business, Enterprise tariflari va feature flags.'),
('launch-checklist','Public Launch Checklist','CEO owner, demo disabled, clean database, domains, Telegram, payment providers, docs.')
ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, content=EXCLUDED.content, updated_at=NOW();
