
-- Eduka 32.0.0 — Premium CRM Full System Update
CREATE TABLE IF NOT EXISTS crm_automation_rules (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  action_type TEXT NOT NULL DEFAULT 'notification',
  is_enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS crm_lead_activities (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER,
  lead_id INTEGER,
  type TEXT DEFAULT 'note',
  title TEXT,
  note TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS crm_teacher_lesson_reports (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER,
  teacher_id INTEGER,
  group_id INTEGER,
  lesson_id INTEGER,
  topic TEXT,
  homework TEXT,
  note TEXT,
  attendance_summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS crm_launch_audits (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER,
  version TEXT DEFAULT '32.0.0',
  status TEXT DEFAULT 'ok',
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_automation_rules_org ON crm_automation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_lead_activities_org ON crm_lead_activities(organization_id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS demo_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_student_id INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_app_status TEXT DEFAULT 'not_connected';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_cancelled_at TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_token TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS attendance_rate NUMERIC DEFAULT 0;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP;
