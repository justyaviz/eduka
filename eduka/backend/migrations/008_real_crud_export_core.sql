-- Eduka 21.8.0 Real CRUD & Database Update
-- Safe additive migration: indexes, audit/export readiness and finance consistency.
CREATE TABLE IF NOT EXISTS schema_migrations (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE students ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE groups ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE courses ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS students_org_search_218_idx ON students USING gin (to_tsvector('simple', COALESCE(full_name,'') || ' ' || COALESCE(phone,'') || ' ' || COALESCE(parent_phone,'')));
CREATE INDEX IF NOT EXISTS leads_org_search_218_idx ON leads USING gin (to_tsvector('simple', COALESCE(full_name,'') || ' ' || COALESCE(phone,'')));
CREATE INDEX IF NOT EXISTS groups_org_search_218_idx ON groups USING gin (to_tsvector('simple', COALESCE(name,'') || ' ' || COALESCE(course_name,'')));
CREATE INDEX IF NOT EXISTS teachers_org_search_218_idx ON teachers USING gin (to_tsvector('simple', COALESCE(full_name,'') || ' ' || COALESCE(phone,'')));
CREATE INDEX IF NOT EXISTS payments_org_paid_at_218_idx ON payments(organization_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS attendance_org_lesson_date_218_idx ON attendance_records(organization_id, lesson_date DESC);

CREATE TABLE IF NOT EXISTS export_jobs (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  resource TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  row_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
