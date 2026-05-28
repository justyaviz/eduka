-- EDUKA CRM Phase 3 database safety migration
-- Railway Postgres Query ichiga copy-paste qilish mumkin.
-- Bu kod data o‘chirmaydi, faqat kerakli column/table/indexlarni qo‘shadi.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE crm_students ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE crm_students ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE crm_students ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE crm_students ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;
ALTER TABLE crm_students ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE crm_students ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE crm_teachers ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE crm_teachers ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE crm_teachers ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE crm_teachers ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE crm_teachers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE crm_courses ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE crm_courses ADD COLUMN IF NOT EXISTS lesson_duration TEXT DEFAULT '90 daqiqa';
ALTER TABLE crm_courses ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE crm_courses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE crm_groups ADD COLUMN IF NOT EXISTS room_id UUID;
ALTER TABLE crm_groups ADD COLUMN IF NOT EXISTS room TEXT;
ALTER TABLE crm_groups ADD COLUMN IF NOT EXISTS days TEXT;
ALTER TABLE crm_groups ADD COLUMN IF NOT EXISTS lesson_time TEXT;
ALTER TABLE crm_groups ADD COLUMN IF NOT EXISTS lesson_duration TEXT;
ALTER TABLE crm_groups ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE crm_groups ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE crm_groups ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

CREATE TABLE IF NOT EXISTS crm_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant TEXT NOT NULL DEFAULT 'main',
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_group_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant TEXT NOT NULL DEFAULT 'main',
  group_id UUID NOT NULL,
  student_id UUID NOT NULL,
  joined_at DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_crm_group_students_group_student
  ON crm_group_students(group_id, student_id);

CREATE INDEX IF NOT EXISTS idx_crm_students_tenant ON crm_students(tenant);
CREATE INDEX IF NOT EXISTS idx_crm_teachers_tenant ON crm_teachers(tenant);
CREATE INDEX IF NOT EXISTS idx_crm_courses_tenant ON crm_courses(tenant);
CREATE INDEX IF NOT EXISTS idx_crm_groups_tenant ON crm_groups(tenant);
CREATE INDEX IF NOT EXISTS idx_crm_rooms_tenant ON crm_rooms(tenant);
CREATE INDEX IF NOT EXISTS idx_crm_group_students_tenant ON crm_group_students(tenant);
