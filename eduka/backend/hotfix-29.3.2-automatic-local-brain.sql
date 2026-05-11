-- Eduka 29.3.2 no schema migration required.
-- Optional safety seed for AI assistant settings.
CREATE TABLE IF NOT EXISTS ai_assistant_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO ai_assistant_settings (key, value)
VALUES ('local_brain', '{"enabled":true,"external_ai":false,"version":"29.3.2"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW();
