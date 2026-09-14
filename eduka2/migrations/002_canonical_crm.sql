-- EDUKA V3 canonical CRM schema. centers + center_users are the single tenant/auth source.

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  name VARCHAR(180) NOT NULL,
  code VARCHAR(80),
  price NUMERIC(14,2) DEFAULT 0,
  lesson_duration VARCHAR(80) DEFAULT '90 daqiqa',
  duration_months INTEGER DEFAULT 1,
  note TEXT,
  status VARCHAR(40) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  capacity INTEGER DEFAULT 0,
  status VARCHAR(40) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS center_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(center_id, key)
);

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS salary NUMERIC(14,2) DEFAULT 0;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL;
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS days_text VARCHAR(160);
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS lesson_time VARCHAR(40);
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS lesson_duration VARCHAR(80);
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS started_at DATE;
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS ended_at DATE;

ALTER TABLE group_students ADD COLUMN IF NOT EXISTS joined_at DATE DEFAULT CURRENT_DATE;
ALTER TABLE group_students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE center_payments ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES study_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_centers_subdomain_lower ON centers(lower(subdomain));
CREATE INDEX IF NOT EXISTS idx_center_users_center_email ON center_users(center_id, lower(email));
CREATE INDEX IF NOT EXISTS idx_students_center ON students(center_id);
CREATE INDEX IF NOT EXISTS idx_teachers_center ON teachers(center_id);
CREATE INDEX IF NOT EXISTS idx_groups_center ON study_groups(center_id);
CREATE INDEX IF NOT EXISTS idx_courses_center ON courses(center_id);
CREATE INDEX IF NOT EXISTS idx_rooms_center ON rooms(center_id);
CREATE INDEX IF NOT EXISTS idx_payments_center ON center_payments(center_id);
CREATE INDEX IF NOT EXISTS idx_group_students_center_group ON group_students(center_id, group_id);

-- Best-effort migration from the previous crm_* schema. IDs are preserved so relations stay intact.
DO $$
BEGIN
  IF to_regclass('public.crm_courses') IS NOT NULL THEN
    INSERT INTO courses (id, center_id, name, code, price, lesson_duration, duration_months, note, status, created_at, updated_at)
    SELECT cc.id, c.id, cc.name,
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_courses' AND column_name='code') THEN cc.code ELSE NULL END,
           COALESCE(cc.price,0),
           COALESCE(CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_courses' AND column_name='lesson_duration') THEN cc.lesson_duration ELSE NULL END, '90 daqiqa'),
           COALESCE(cc.duration_months,1),
           CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_courses' AND column_name='note') THEN cc.note ELSE NULL END,
           COALESCE(cc.status,'active'), cc.created_at, cc.updated_at
      FROM crm_courses cc
      JOIN centers c ON (lower(c.subdomain)=lower(cc.tenant) OR lower(c.subdomain)=lower(cc.tenant || '.eduka.uz') OR lower(c.subdomain || '.eduka.uz')=lower(cc.tenant))
    ON CONFLICT (id) DO NOTHING;
  END IF;
EXCEPTION WHEN undefined_column THEN
  INSERT INTO courses (id, center_id, name, price, duration_months, status, created_at, updated_at)
  SELECT cc.id, c.id, cc.name, COALESCE(cc.price,0), COALESCE(cc.duration_months,1), COALESCE(cc.status,'active'), cc.created_at, cc.updated_at
    FROM crm_courses cc JOIN centers c ON (lower(c.subdomain)=lower(cc.tenant) OR lower(c.subdomain)=lower(cc.tenant || '.eduka.uz') OR lower(c.subdomain || '.eduka.uz')=lower(cc.tenant))
  ON CONFLICT (id) DO NOTHING;
END $$;

DO $$
BEGIN
  IF to_regclass('public.crm_rooms') IS NOT NULL THEN
    INSERT INTO rooms (id, center_id, name, capacity, status, created_at, updated_at)
    SELECT cr.id, c.id, cr.name, COALESCE(cr.capacity,0), COALESCE(cr.status,'active'), cr.created_at, cr.updated_at
      FROM crm_rooms cr JOIN centers c ON (lower(c.subdomain)=lower(cr.tenant) OR lower(c.subdomain)=lower(cr.tenant || '.eduka.uz') OR lower(c.subdomain || '.eduka.uz')=lower(cr.tenant))
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.crm_teachers') IS NOT NULL THEN
    INSERT INTO teachers (id, center_id, full_name, phone, subject, salary, birth_date, gender, photo_url, status, created_at, updated_at)
    SELECT ct.id, c.id, ct.name, ct.phone, ct.subject, COALESCE(ct.salary,0), ct.birth_date, ct.gender, ct.photo_url, COALESCE(ct.status,'active'), ct.created_at, ct.updated_at
      FROM crm_teachers ct JOIN centers c ON (lower(c.subdomain)=lower(ct.tenant) OR lower(c.subdomain)=lower(ct.tenant || '.eduka.uz') OR lower(c.subdomain || '.eduka.uz')=lower(ct.tenant))
    ON CONFLICT (id) DO NOTHING;
  END IF;
EXCEPTION WHEN undefined_column THEN
  INSERT INTO teachers (id, center_id, full_name, phone, subject, status, created_at, updated_at)
  SELECT ct.id, c.id, ct.name, ct.phone, ct.subject, COALESCE(ct.status,'active'), ct.created_at, ct.updated_at
    FROM crm_teachers ct JOIN centers c ON (lower(c.subdomain)=lower(ct.tenant) OR lower(c.subdomain)=lower(ct.tenant || '.eduka.uz') OR lower(c.subdomain || '.eduka.uz')=lower(ct.tenant))
  ON CONFLICT (id) DO NOTHING;
END $$;

DO $$
BEGIN
  IF to_regclass('public.crm_students') IS NOT NULL THEN
    INSERT INTO students (id, center_id, full_name, phone, birth_date, gender, note, status, balance, created_at, updated_at)
    SELECT cs.id, c.id, cs.name, cs.phone, cs.birth_date, cs.gender, cs.note, COALESCE(cs.status,'active'), COALESCE(cs.balance,0), cs.created_at, cs.updated_at
      FROM crm_students cs JOIN centers c ON (lower(c.subdomain)=lower(cs.tenant) OR lower(c.subdomain)=lower(cs.tenant || '.eduka.uz') OR lower(c.subdomain || '.eduka.uz')=lower(cs.tenant))
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.crm_groups') IS NOT NULL THEN
    INSERT INTO study_groups (
      id, center_id, name, course_id, teacher_id, room_id, room_name, days_text, lesson_time, lesson_duration,
      started_at, ended_at, course_name, teacher_name, schedule_text, monthly_price, status, created_at, updated_at
    )
    SELECT cg.id, c.id, cg.name, cg.course_id, cg.teacher_id, cg.room_id,
           COALESCE(r.name, cg.room), cg.days, cg.lesson_time, cg.lesson_duration,
           cg.start_date, cg.end_date, co.name, t.full_name,
           trim(concat_ws(' ', cg.days, cg.lesson_time)), COALESCE(co.price,0), COALESCE(cg.status,'active'), cg.created_at, cg.updated_at
      FROM crm_groups cg
      JOIN centers c ON (lower(c.subdomain)=lower(cg.tenant) OR lower(c.subdomain)=lower(cg.tenant || '.eduka.uz') OR lower(c.subdomain || '.eduka.uz')=lower(cg.tenant))
      LEFT JOIN courses co ON co.id=cg.course_id
      LEFT JOIN teachers t ON t.id=cg.teacher_id
      LEFT JOIN rooms r ON r.id=cg.room_id
    ON CONFLICT (id) DO NOTHING;
  END IF;
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

DO $$
BEGIN
  IF to_regclass('public.crm_group_students') IS NOT NULL THEN
    INSERT INTO group_students (id, center_id, group_id, student_id, status, joined_at, created_at, updated_at)
    SELECT cgs.id, c.id, cgs.group_id, cgs.student_id, COALESCE(cgs.status,'active'), COALESCE(cgs.joined_at,CURRENT_DATE), COALESCE(cgs.created_at,NOW()), COALESCE(cgs.updated_at,NOW())
      FROM crm_group_students cgs JOIN centers c ON (lower(c.subdomain)=lower(cgs.tenant) OR lower(c.subdomain)=lower(cgs.tenant || '.eduka.uz') OR lower(c.subdomain || '.eduka.uz')=lower(cgs.tenant))
    ON CONFLICT (group_id, student_id) DO NOTHING;
  END IF;
EXCEPTION WHEN undefined_column THEN
  INSERT INTO group_students (id, center_id, group_id, student_id, status, joined_at, created_at, updated_at)
  SELECT cgs.id, c.id, cgs.group_id, cgs.student_id, COALESCE(cgs.status,'active'), COALESCE(cgs.joined_at,CURRENT_DATE), NOW(), NOW()
    FROM crm_group_students cgs
    JOIN centers c ON (lower(c.subdomain)=lower(cgs.tenant) OR lower(c.subdomain)=lower(cgs.tenant || '.eduka.uz') OR lower(c.subdomain || '.eduka.uz')=lower(cgs.tenant))
  ON CONFLICT (group_id, student_id) DO NOTHING;
END $$;

DO $$
BEGIN
  IF to_regclass('public.crm_payments') IS NOT NULL THEN
    INSERT INTO center_payments (id, center_id, student_id, group_id, student_name, amount, payment_type, status, note, paid_at, created_at)
    SELECT cp.id, c.id, cp.student_id, cp.group_id, s.full_name, COALESCE(cp.amount,0), COALESCE(cp.payment_type,'cash'), COALESCE(cp.status,'paid'), cp.note, cp.paid_at, cp.created_at
      FROM crm_payments cp
      JOIN centers c ON (lower(c.subdomain)=lower(cp.tenant) OR lower(c.subdomain)=lower(cp.tenant || '.eduka.uz') OR lower(c.subdomain || '.eduka.uz')=lower(cp.tenant))
      LEFT JOIN students s ON s.id=cp.student_id
    ON CONFLICT (id) DO NOTHING;
  END IF;
EXCEPTION WHEN undefined_column THEN
  INSERT INTO center_payments (id, center_id, student_id, group_id, student_name, amount, payment_type, status, note, paid_at, created_at)
  SELECT cp.id, c.id, cp.student_id, cp.group_id, s.full_name, COALESCE(cp.amount,0), COALESCE(cp.payment_type,'cash'), 'paid', cp.note, cp.paid_at, cp.created_at
    FROM crm_payments cp JOIN centers c ON (lower(c.subdomain)=lower(cp.tenant) OR lower(c.subdomain)=lower(cp.tenant || '.eduka.uz') OR lower(c.subdomain || '.eduka.uz')=lower(cp.tenant)) LEFT JOIN students s ON s.id=cp.student_id
  ON CONFLICT (id) DO NOTHING;
END $$;

DO $$
BEGIN
  IF to_regclass('public.crm_expenses') IS NOT NULL THEN
    INSERT INTO center_expenses (id, center_id, title, amount, category, spent_at, note, created_at)
    SELECT ce.id, c.id, ce.title, COALESCE(ce.amount,0), ce.category, ce.spent_at, ce.note, ce.created_at
      FROM crm_expenses ce JOIN centers c ON (lower(c.subdomain)=lower(ce.tenant) OR lower(c.subdomain)=lower(ce.tenant || '.eduka.uz') OR lower(c.subdomain || '.eduka.uz')=lower(ce.tenant))
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.crm_reminders') IS NOT NULL THEN
    INSERT INTO reminders (id, center_id, title, note, remind_at, status, created_at, updated_at)
    SELECT cr.id, c.id, cr.title, cr.note, cr.due_at, COALESCE(cr.status,'active'), cr.created_at, COALESCE(cr.updated_at,cr.created_at)
      FROM crm_reminders cr JOIN centers c ON (lower(c.subdomain)=lower(cr.tenant) OR lower(c.subdomain)=lower(cr.tenant || '.eduka.uz') OR lower(c.subdomain || '.eduka.uz')=lower(cr.tenant))
    ON CONFLICT (id) DO NOTHING;
  END IF;
EXCEPTION WHEN undefined_column THEN
  INSERT INTO reminders (id, center_id, title, note, remind_at, status, created_at, updated_at)
  SELECT cr.id, c.id, cr.title, cr.note, cr.due_at, COALESCE(cr.status,'active'), cr.created_at, cr.created_at
    FROM crm_reminders cr JOIN centers c ON (lower(c.subdomain)=lower(cr.tenant) OR lower(c.subdomain)=lower(cr.tenant || '.eduka.uz') OR lower(c.subdomain || '.eduka.uz')=lower(cr.tenant))
  ON CONFLICT (id) DO NOTHING;
END $$;
