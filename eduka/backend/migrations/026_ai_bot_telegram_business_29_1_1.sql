-- Eduka 29.1.1 — AI Bot Telegram Business Support
CREATE TABLE IF NOT EXISTS ai_assistant_business_connections (
  id SERIAL PRIMARY KEY,
  business_connection_id TEXT UNIQUE NOT NULL,
  user_id TEXT,
  user_first_name TEXT,
  user_username TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS business_connection_id TEXT;
ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS is_business_chat BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS business_connection_id TEXT;
ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS business_message_id TEXT;
ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS is_business_message BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_ai_assistant_messages_business ON ai_assistant_messages(business_connection_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_assistant_business_connections_enabled ON ai_assistant_business_connections(is_enabled, updated_at DESC);
