CREATE TABLE IF NOT EXISTS eduka_notification_outbox (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), center_id UUID NOT NULL REFERENCES centers(id),
 event_key TEXT NOT NULL, channel TEXT NOT NULL DEFAULT 'telegram', message TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','sent','failed','unknown')),
 error TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),sent_at TIMESTAMPTZ,
 UNIQUE(center_id,event_key,channel)
);
CREATE INDEX IF NOT EXISTS eduka_notification_pending ON eduka_notification_outbox(status,created_at);
