-- Eduka 24.3.0 hotfix — run in Railway Postgres if deploy complains about learning tables/columns
CREATE TABLE IF NOT EXISTS student_homework_submissions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  homework_id BIGINT REFERENCES student_homework_tasks(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  file_url TEXT,
  comment TEXT,
  score NUMERIC,
  status TEXT NOT NULL DEFAULT 'submitted',
  teacher_note TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS student_homework_submissions_unique_student_homework
  ON student_homework_submissions(organization_id, homework_id, student_id);
ALTER TABLE student_notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE student_tests ADD COLUMN IF NOT EXISTS question_count INTEGER NOT NULL DEFAULT 10;
ALTER TABLE student_tests ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 15;
