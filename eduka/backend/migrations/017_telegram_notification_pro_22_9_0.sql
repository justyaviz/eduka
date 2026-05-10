-- Eduka 22.9.0 — Telegram Notification Pro
CREATE TABLE IF NOT EXISTS telegram_notification_logs (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL DEFAULT 'system',
  chat_id TEXT,
  title TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS telegram_notification_logs_org_student_idx
  ON telegram_notification_logs(organization_id, student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS telegram_notification_logs_org_type_idx
  ON telegram_notification_logs(organization_id, notification_type, status, created_at DESC);

CREATE TABLE IF NOT EXISTS telegram_notification_settings (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  payment_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  coin_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  reward_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  attendance_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  debt_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  lesson_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  homework_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  material_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO telegram_notification_settings (organization_id)
SELECT id FROM organizations
ON CONFLICT (organization_id) DO NOTHING;
