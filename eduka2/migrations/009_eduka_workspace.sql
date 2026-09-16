-- Additive workspace storage; canonical tenant/auth/CEO tables are preserved.
CREATE TABLE IF NOT EXISTS eduka_records (
 id UUID PRIMARY KEY, center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
 entity TEXT NOT NULL, data JSONB NOT NULL DEFAULT '{}', version INTEGER NOT NULL DEFAULT 1,
 deleted INTEGER NOT NULL DEFAULT 0 CHECK(deleted IN (0,1)),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS eduka_records_center_entity ON eduka_records(center_id,entity);
CREATE TABLE IF NOT EXISTS eduka_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
 record_id UUID NOT NULL,entity TEXT NOT NULL,action TEXT NOT NULL,actor TEXT NOT NULL,changes JSONB NOT NULL DEFAULT '{}',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS eduka_events_center_time ON eduka_events(center_id,created_at DESC);
CREATE TABLE IF NOT EXISTS eduka_files (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
 name TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL CHECK(size<=20971520),content BYTEA NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
