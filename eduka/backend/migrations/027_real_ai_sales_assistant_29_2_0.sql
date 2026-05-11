-- Eduka 29.2.0 — Real AI Sales Assistant
CREATE TABLE IF NOT EXISTS ai_assistant_intent_logs (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER,
  chat_id TEXT,
  telegram_user_id TEXT,
  intent TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  score_delta INTEGER NOT NULL DEFAULT 0,
  entities JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggested_action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS memory JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS lead_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS last_intent TEXT;
ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS interest_tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS qualified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ai_assistant_conversations ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS intent TEXT;
ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 0;
ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS lead_score_delta INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ai_assistant_messages ADD COLUMN IF NOT EXISTS ai_reason JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE ai_assistant_leads ADD COLUMN IF NOT EXISTS intent TEXT;
ALTER TABLE ai_assistant_leads ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ai_assistant_leads ADD COLUMN IF NOT EXISTS interest_tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE ai_assistant_leads ADD COLUMN IF NOT EXISTS ai_summary TEXT;
CREATE INDEX IF NOT EXISTS idx_ai_assistant_intent_logs_intent ON ai_assistant_intent_logs(intent, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_assistant_conversations_score ON ai_assistant_conversations(lead_score DESC, updated_at DESC);
