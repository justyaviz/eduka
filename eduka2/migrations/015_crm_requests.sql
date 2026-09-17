CREATE TABLE IF NOT EXISTS eduka_record_requests (
 center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
 actor_id UUID NOT NULL,
 request_id UUID NOT NULL,
 payload_hash TEXT NOT NULL,
 record_id UUID NOT NULL REFERENCES eduka_records(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY(center_id,actor_id,request_id)
);
