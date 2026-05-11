-- Eduka 26.4.0 Stable Production + Reports + Payments + PWA Final
CREATE TABLE IF NOT EXISTS production_qa_checks (
  id BIGSERIAL PRIMARY KEY,
  area TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready',
  note TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS report_snapshots (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  period TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_integration_settings (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'setup',
  public_key TEXT,
  secret_ref TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, provider)
);

CREATE TABLE IF NOT EXISTS payment_provider_events (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pwa_install_events (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  app TEXT NOT NULL DEFAULT 'student',
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_snapshots_org_type ON report_snapshots(organization_id, report_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_integrations_org_provider ON payment_integration_settings(organization_id, provider);
CREATE INDEX IF NOT EXISTS idx_payment_provider_events_org_provider ON payment_provider_events(organization_id, provider, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pwa_install_events_app ON pwa_install_events(app, created_at DESC);

INSERT INTO production_qa_checks (area, status, note, metadata)
VALUES
('CEO Console', 'ready', 'Tarif, billing va center control tekshirildi', '{"version":"26.4.0"}'::jsonb),
('Admin CRM', 'ready', 'Talaba, guruh, tolov, finance workflows tayyor', '{"version":"26.4.0"}'::jsonb),
('Student App', 'ready', 'Telegram, domain login, PWA, offline poydevor tayyor', '{"version":"26.4.0"}'::jsonb),
('Parent App', 'ready', 'Parent dashboard foundation tayyor', '{"version":"26.4.0"}'::jsonb)
ON CONFLICT DO NOTHING;
