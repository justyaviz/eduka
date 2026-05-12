-- Eduka 31.0.0 — Academy Operations Pro
ALTER TABLE groups ADD COLUMN IF NOT EXISTS room_id BIGINT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS schedule_days TEXT[] DEFAULT '{}'::text[];
ALTER TABLE groups ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS lesson_instance_id BIGINT;

CREATE TABLE IF NOT EXISTS academy_rooms (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 0,
  branch TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academy_schedule_slots (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL,
  group_id BIGINT NOT NULL,
  teacher_id BIGINT,
  room_id BIGINT,
  weekday INT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_academy_schedule_org_weekday ON academy_schedule_slots(organization_id, weekday);
CREATE INDEX IF NOT EXISTS idx_academy_schedule_teacher ON academy_schedule_slots(organization_id, teacher_id);
CREATE INDEX IF NOT EXISTS idx_academy_schedule_room ON academy_schedule_slots(organization_id, room_id);

CREATE TABLE IF NOT EXISTS academy_lesson_instances (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL,
  schedule_slot_id BIGINT,
  group_id BIGINT NOT NULL,
  teacher_id BIGINT,
  room_id BIGINT,
  lesson_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  attendance_saved_at TIMESTAMPTZ,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, group_id, lesson_date, start_time)
);
CREATE INDEX IF NOT EXISTS idx_academy_lessons_org_date ON academy_lesson_instances(organization_id, lesson_date);
CREATE INDEX IF NOT EXISTS idx_academy_lessons_teacher_date ON academy_lesson_instances(organization_id, teacher_id, lesson_date);

CREATE TABLE IF NOT EXISTS teacher_lesson_reports (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL,
  lesson_instance_id BIGINT,
  teacher_id BIGINT,
  group_id BIGINT,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  topic TEXT,
  homework TEXT,
  note TEXT,
  attendance_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academy_operations_logs (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT,
  user_id BIGINT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id BIGINT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
