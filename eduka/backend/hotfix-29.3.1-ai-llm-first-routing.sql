-- Eduka 29.3.1 — AI LLM First Routing Fix
-- FAQ endi asosiy javob emas, faqat LLM context. Duplicate business javoblarni yopish uchun event guard.

CREATE TABLE IF NOT EXISTS ai_assistant_processed_updates (
  id SERIAL PRIMARY KEY,
  event_key TEXT UNIQUE NOT NULL,
  update_id TEXT,
  chat_id TEXT,
  message_id TEXT,
  business_connection_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_processed_updates_created_at ON ai_assistant_processed_updates(created_at DESC);

ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS ai_reason JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS lead_score_delta INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS intent TEXT;
ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 0;

INSERT INTO ai_assistant_settings (key, value, updated_at)
VALUES ('llm_first_routing', '{"enabled":true,"version":"29.3.1","faq_as_context_only":true,"duplicate_guard":true}'::jsonb, NOW())
ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW();
