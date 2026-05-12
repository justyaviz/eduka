
-- Eduka 32.1.0 Lead & Sales CRM Pro
CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  full_name TEXT,
  phone TEXT,
  course_name TEXT,
  source TEXT DEFAULT 'Instagram',
  status TEXT DEFAULT 'new',
  manager_name TEXT,
  note TEXT,
  students_count INT,
  demo_at TIMESTAMPTZ,
  converted_student_id BIGINT,
  lost_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS organization_id BIGINT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Instagram';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS students_count INT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS demo_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_student_id BIGINT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_leads_org_status ON leads(organization_id,status);
CREATE TABLE IF NOT EXISTS lead_followups (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  lead_id BIGINT,
  title TEXT,
  note TEXT,
  due_at TIMESTAMPTZ,
  status TEXT DEFAULT 'open',
  created_by BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lead_followups_org_due ON lead_followups(organization_id,due_at,status);
CREATE TABLE IF NOT EXISTS demo_lessons (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  lead_id BIGINT,
  course_name TEXT,
  teacher_id BIGINT,
  group_id BIGINT,
  demo_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sales_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  lead_id BIGINT,
  actor_id BIGINT,
  action TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
