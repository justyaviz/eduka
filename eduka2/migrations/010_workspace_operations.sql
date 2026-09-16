CREATE TABLE IF NOT EXISTS eduka_support_messages (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
 user_id UUID NOT NULL REFERENCES center_users(id),
 sender TEXT NOT NULL CHECK(sender IN ('user','operator')),
 body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 3000),
 read_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS eduka_support_thread ON eduka_support_messages(center_id,user_id,created_at);
CREATE INDEX IF NOT EXISTS eduka_record_entity_cursor ON eduka_records(center_id,entity,created_at,id);

ALTER TABLE center_users ADD COLUMN IF NOT EXISTS auth_version INTEGER NOT NULL DEFAULT 0;
