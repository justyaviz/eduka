CREATE TABLE IF NOT EXISTS eskiz_tokens (
 id INTEGER PRIMARY KEY CHECK(id=1), token_ciphertext TEXT,
 credential_hash TEXT, expires_at TIMESTAMPTZ, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS eduka_sms_messages (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 actor_id UUID REFERENCES ceo_users(id) ON DELETE SET NULL,
 request_key VARCHAR(100) NOT NULL, phone VARCHAR(12) NOT NULL, message TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('processing','accepted','failed','unknown')),
 provider_id TEXT, error TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(actor_id,request_key)
);
CREATE INDEX IF NOT EXISTS eduka_sms_messages_created ON eduka_sms_messages(created_at DESC);
