CREATE TABLE IF NOT EXISTS organizations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  subdomain TEXT,
  owner_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  plan TEXT NOT NULL DEFAULT 'Start',
  monthly_payment NUMERIC(14, 2) NOT NULL DEFAULT 0,
  logo_url TEXT,
  has_branches BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '7 days'),
  license_expires_at TIMESTAMPTZ,
  setup_completed_at TIMESTAMPTZ,
  support_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'Start';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS monthly_payment NUMERIC(14, 2) NOT NULL DEFAULT 0;
UPDATE organizations SET subdomain = slug WHERE subdomain IS NULL AND slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS organizations_subdomain_unique_idx ON organizations (LOWER(subdomain)) WHERE subdomain IS NOT NULL;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT NOT NULL,
  normalized_phone TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin',
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS demo_requests (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  center TEXT,
  students TEXT,
  lang TEXT,
  source TEXT NOT NULL DEFAULT 'eduka.uz landing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  course_name TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  source TEXT,
  manager_name TEXT,
  next_contact_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  duration TEXT,
  level TEXT,
  lesson_type TEXT NOT NULL DEFAULT 'group',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  parent_phone TEXT,
  birth_date DATE,
  address TEXT,
  course_name TEXT,
  group_id BIGINT,
  payment_type TEXT,
  discount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teachers (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  course_name TEXT,
  subjects TEXT,
  groups TEXT,
  login_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  salary_type TEXT NOT NULL DEFAULT 'fixed',
  salary_rate NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  course_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
  teacher_name TEXT,
  days TEXT,
  start_time TIME,
  end_time TIME,
  monthly_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  starts_at DATE,
  ends_at DATE,
  room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_students (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (organization_id, group_id, student_id)
);

CREATE TABLE IF NOT EXISTS rooms (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE SET NULL,
  group_id BIGINT REFERENCES groups(id) ON DELETE SET NULL,
  payment_month TEXT,
  due_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'paid',
  payment_type TEXT,
  note TEXT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lessons (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  group_id BIGINT REFERENCES groups(id) ON DELETE SET NULL,
  lesson_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned'
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  lesson_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present',
  note TEXT,
  marked_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, group_id, student_id, lesson_date)
);

CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  spent_at DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  withdrawn_at DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salaries (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  salary_month TEXT NOT NULL,
  note TEXT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tariffs (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  monthly_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  student_limit INTEGER NOT NULL DEFAULT 500,
  teacher_limit INTEGER NOT NULL DEFAULT 10,
  branch_limit INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  tariff_id BIGINT REFERENCES tariffs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'trial',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_settings (
  organization_id BIGINT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id BIGINT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS has_branches BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'trial';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '7 days');
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS manager_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS support_note TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_contact_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS course_id BIGINT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS group_id BIGINT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS payment_type TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS discount NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE students ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE students ADD COLUMN IF NOT EXISTS balance NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS lessons_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS price NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS level TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS lesson_type TEXT NOT NULL DEFAULT 'group';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS groups TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS login_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS salary_type TEXT NOT NULL DEFAULT 'fixed';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS salary_rate NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS salary_value NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS course_id BIGINT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS teacher_id BIGINT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS room_id BIGINT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS teacher_name TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS days TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS lesson_days TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS price NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS monthly_price NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS starts_at DATE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS ends_at DATE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS room TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'offline';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS teacher_salary_type TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS teacher_salary_value NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS group_id BIGINT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_month TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS month TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS due_amount NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS discount NUMERIC(14, 2) NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type_id BIGINT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_by BIGINT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_no TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_printed_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_status TEXT NOT NULL DEFAULT 'not_printed';
CREATE UNIQUE INDEX IF NOT EXISTS payments_org_receipt_no_unique_211 ON payments(organization_id, receipt_no) WHERE receipt_no IS NOT NULL;

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS marked_by BIGINT;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS score NUMERIC(8, 2);
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS homework TEXT;

CREATE TABLE IF NOT EXISTS payment_types (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Markaz',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  category TEXT,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  payment_type_id BIGINT REFERENCES payment_types(id) ON DELETE SET NULL,
  employee_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  note TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id BIGINT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIME,
  check_out TIME,
  status TEXT NOT NULL DEFAULT 'absent',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedule_lessons (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id BIGINT REFERENCES groups(id) ON DELETE SET NULL,
  teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
  room_id BIGINT REFERENCES rooms(id) ON DELETE SET NULL,
  lesson_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  type TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (organization_id, key)
);

CREATE UNIQUE INDEX IF NOT EXISTS organizations_slug_unique_idx ON organizations(slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users(LOWER(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS courses_org_status_idx ON courses(organization_id, status);
CREATE INDEX IF NOT EXISTS branches_org_status_idx ON branches(organization_id, status);
CREATE INDEX IF NOT EXISTS rooms_org_status_idx ON rooms(organization_id, status);
CREATE INDEX IF NOT EXISTS payment_types_org_active_idx ON payment_types(organization_id, active);
CREATE INDEX IF NOT EXISTS finance_transactions_org_date_idx ON finance_transactions(organization_id, transaction_date);
CREATE INDEX IF NOT EXISTS staff_attendance_org_date_idx ON staff_attendance(organization_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS staff_attendance_org_employee_date_unique_idx ON staff_attendance(organization_id, employee_id, date);
CREATE INDEX IF NOT EXISTS schedule_lessons_org_date_idx ON schedule_lessons(organization_id, lesson_date);
CREATE INDEX IF NOT EXISTS tags_org_type_idx ON tags(organization_id, type);
CREATE INDEX IF NOT EXISTS leads_org_status_idx ON leads(organization_id, status);
CREATE INDEX IF NOT EXISTS students_org_status_idx ON students(organization_id, status);
CREATE INDEX IF NOT EXISTS students_org_balance_idx ON students(organization_id, balance);
CREATE INDEX IF NOT EXISTS groups_org_status_idx ON groups(organization_id, status);
CREATE INDEX IF NOT EXISTS group_students_org_group_idx ON group_students(organization_id, group_id);
CREATE INDEX IF NOT EXISTS payments_org_paid_at_idx ON payments(organization_id, paid_at);
CREATE INDEX IF NOT EXISTS payments_org_student_idx ON payments(organization_id, student_id);
CREATE INDEX IF NOT EXISTS payments_org_group_idx ON payments(organization_id, group_id);
CREATE INDEX IF NOT EXISTS lessons_org_lesson_at_idx ON lessons(organization_id, lesson_at);
CREATE INDEX IF NOT EXISTS teachers_org_status_idx ON teachers(organization_id, status);
CREATE INDEX IF NOT EXISTS attendance_org_date_idx ON attendance_records(organization_id, lesson_date);
CREATE INDEX IF NOT EXISTS attendance_org_student_idx ON attendance_records(organization_id, student_id);
CREATE INDEX IF NOT EXISTS attendance_org_group_idx ON attendance_records(organization_id, group_id);
CREATE INDEX IF NOT EXISTS audit_logs_org_created_idx ON audit_logs(organization_id, created_at);
CREATE INDEX IF NOT EXISTS notifications_org_read_idx ON notifications(organization_id, is_read);

ALTER TABLE students ADD COLUMN IF NOT EXISTS telegram_user_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS app_password_hash TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS app_password_set_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS app_password_reset_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_app_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_app_blocked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_student_app_login TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS crystals INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS referred_by_student_id BIGINT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS student_app_sessions (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  telegram_user_id TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_address TEXT
);

CREATE TABLE IF NOT EXISTS student_app_settings (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  crystals_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  coins_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  rating_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  referral_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  library_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  dictionary_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  extra_lessons_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  exams_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  news_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  payments_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  complaints_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  theme_primary TEXT NOT NULL DEFAULT '#0A84FF',
  app_name TEXT NOT NULL DEFAULT 'Eduka Student App',
  support_text TEXT,
  session_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_app_modules (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, key)
);

CREATE TABLE IF NOT EXISTS student_library_items (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  file_url TEXT,
  external_url TEXT,
  course_id BIGINT REFERENCES courses(id) ON DELETE SET NULL,
  level TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_dictionary_words (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT,
  pronunciation TEXT,
  example TEXT,
  level TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_news (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  publish_date DATE,
  target_type TEXT NOT NULL DEFAULT 'all',
  target_group_id BIGINT REFERENCES groups(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_events (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  event_date DATE,
  event_time TEXT,
  registration_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_referrals (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  referrer_student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  referred_name TEXT,
  referred_phone TEXT,
  referred_student_id BIGINT REFERENCES students(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new',
  reward_type TEXT NOT NULL DEFAULT 'crystal',
  reward_amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_extra_lesson_requests (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
  requested_date DATE,
  requested_time TEXT,
  purpose TEXT,
  price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_feedback (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  admin_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_exam_results (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  score NUMERIC(8, 2),
  max_score NUMERIC(8, 2) NOT NULL DEFAULT 100,
  grade TEXT,
  exam_date DATE,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_mock_exams (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  exam_date DATE,
  price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  registration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_mock_exam_registrations (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mock_exam_id BIGINT NOT NULL REFERENCES student_mock_exams(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered',
  result_score NUMERIC(8, 2),
  result_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, mock_exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS student_app_sessions_token_idx ON student_app_sessions(token_hash);
CREATE INDEX IF NOT EXISTS student_app_sessions_student_idx ON student_app_sessions(organization_id, student_id);
CREATE INDEX IF NOT EXISTS students_student_app_phone_idx ON students(organization_id, phone);
CREATE INDEX IF NOT EXISTS students_student_app_telegram_idx ON students(organization_id, telegram_user_id);

-- Eduka 22.1.1 compatibility: keep old Railway databases aligned with current Student App columns.
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS crystals_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS coins_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS rating_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS referral_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS library_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS dictionary_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS extra_lessons_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS exams_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS news_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS payments_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS complaints_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS theme_primary TEXT NOT NULL DEFAULT '#0A84FF';
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS app_name TEXT NOT NULL DEFAULT 'Eduka Student App';
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS support_text TEXT;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS session_days INTEGER NOT NULL DEFAULT 30;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE student_app_modules ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE student_app_modules ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE student_app_modules ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE student_app_modules ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_modules ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE student_app_modules ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS student_app_modules_org_key_unique_2211_schema ON student_app_modules (organization_id, key);

CREATE INDEX IF NOT EXISTS student_app_modules_org_sort_idx ON student_app_modules(organization_id, sort_order);
CREATE INDEX IF NOT EXISTS student_library_items_org_status_idx ON student_library_items(organization_id, status);
CREATE INDEX IF NOT EXISTS student_dictionary_words_org_status_idx ON student_dictionary_words(organization_id, status);
CREATE INDEX IF NOT EXISTS student_news_org_status_idx ON student_news(organization_id, status);
CREATE INDEX IF NOT EXISTS student_events_org_status_idx ON student_events(organization_id, status);
CREATE INDEX IF NOT EXISTS student_referrals_org_status_idx ON student_referrals(organization_id, status);
CREATE INDEX IF NOT EXISTS student_extra_lessons_org_status_idx ON student_extra_lesson_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS student_feedback_org_status_idx ON student_feedback(organization_id, status);
CREATE INDEX IF NOT EXISTS student_exam_results_org_student_idx ON student_exam_results(organization_id, student_id);
CREATE INDEX IF NOT EXISTS student_mock_exams_org_status_idx ON student_mock_exams(organization_id, status);


-- Eduka professional CRM extension tables (real CRUD; no demo/local-only logic)
CREATE TABLE IF NOT EXISTS student_notes (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Eslatma',
  note TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  remind_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open',
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_discounts (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  group_id BIGINT REFERENCES groups(id) ON DELETE SET NULL,
  discount_type TEXT NOT NULL DEFAULT 'amount',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  reason TEXT,
  starts_at DATE,
  ends_at DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_messages (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE SET NULL,
  lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
  teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'manual',
  recipient TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  provider_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_tasks (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  max_score NUMERIC(8,2) NOT NULL DEFAULT 100,
  score NUMERIC(8,2),
  status TEXT NOT NULL DEFAULT 'assigned',
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gamification_transactions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('coin','crystal')),
  amount INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_history (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES students(id) ON DELETE CASCADE,
  group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE,
  entity TEXT NOT NULL,
  entity_id BIGINT,
  action TEXT NOT NULL,
  title TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_exams (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exam_date DATE,
  pass_score NUMERIC(8,2) NOT NULL DEFAULT 60,
  max_score NUMERIC(8,2) NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'planned',
  note TEXT,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_homeworks (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_notes (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_notes_org_student_idx ON student_notes(organization_id, student_id);
CREATE INDEX IF NOT EXISTS student_discounts_org_student_idx ON student_discounts(organization_id, student_id);
CREATE INDEX IF NOT EXISTS crm_messages_org_student_idx ON crm_messages(organization_id, student_id);
CREATE INDEX IF NOT EXISTS student_tasks_org_student_idx ON student_tasks(organization_id, student_id);
CREATE INDEX IF NOT EXISTS gamification_org_student_idx ON gamification_transactions(organization_id, student_id);
CREATE INDEX IF NOT EXISTS crm_history_org_student_idx ON crm_history(organization_id, student_id);
CREATE INDEX IF NOT EXISTS group_exams_org_group_idx ON group_exams(organization_id, group_id);
CREATE INDEX IF NOT EXISTS group_homeworks_org_group_idx ON group_homeworks(organization_id, group_id);
CREATE INDEX IF NOT EXISTS group_notes_org_group_idx ON group_notes(organization_id, group_id);

-- Eduka 19.5 SaaS platform upgrade
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS brand_color TEXT NOT NULL DEFAULT '#0A84FF';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS read_only_until TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER NOT NULL DEFAULT 1024;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sms_limit INTEGER NOT NULL DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS student_limit INTEGER NOT NULL DEFAULT 100;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS teacher_limit INTEGER NOT NULL DEFAULT 5;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS branch_limit INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS organization_domains (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'subdomain',
  verification_token TEXT NOT NULL DEFAULT md5(random()::text || clock_timestamp()::text),
  verification_status TEXT NOT NULL DEFAULT 'pending_dns',
  ssl_status TEXT NOT NULL DEFAULT 'pending',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  dns_target TEXT NOT NULL DEFAULT 'cname.eduka.uz',
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(domain)
);

CREATE TABLE IF NOT EXISTS organization_branding (
  organization_id BIGINT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#0A84FF',
  secondary_color TEXT NOT NULL DEFAULT '#111827',
  accent_color TEXT NOT NULL DEFAULT '#22C55E',
  student_app_name TEXT NOT NULL DEFAULT 'Eduka Student App',
  white_label_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  sms_sender_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_feature_flags (
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  limit_value INTEGER,
  source TEXT NOT NULL DEFAULT 'plan',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, feature_key)
);

ALTER TABLE tariffs ADD COLUMN IF NOT EXISTS billing_period TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE tariffs ADD COLUMN IF NOT EXISTS group_limit INTEGER NOT NULL DEFAULT 20;
ALTER TABLE tariffs ADD COLUMN IF NOT EXISTS sms_limit INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tariffs ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER NOT NULL DEFAULT 1024;
ALTER TABLE tariffs ADD COLUMN IF NOT EXISTS feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE tariffs ADD COLUMN IF NOT EXISTS support_level TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE tariffs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS plan_features (
  id BIGSERIAL PRIMARY KEY,
  tariff_id BIGINT NOT NULL REFERENCES tariffs(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  limit_value INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tariff_id, feature_key)
);

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS monthly_price NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
UPDATE subscriptions SET current_period_start = COALESCE(current_period_start, starts_at), current_period_end = COALESCE(current_period_end, ends_at), next_payment_date = COALESCE(next_payment_date, ends_at) WHERE current_period_start IS NULL OR current_period_end IS NULL OR next_payment_date IS NULL;

CREATE TABLE IF NOT EXISTS subscription_invoices (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_payments (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,
  invoice_id BIGINT REFERENCES subscription_invoices(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  method TEXT NOT NULL DEFAULT 'bank',
  status TEXT NOT NULL DEFAULT 'paid',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_roles (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_permissions (
  id BIGSERIAL PRIMARY KEY,
  role_id BIGINT REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(role_id, permission_key)
);

CREATE TABLE IF NOT EXISTS organization_roles (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS organization_permissions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_id BIGINT REFERENCES organization_roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(role_id, permission_key)
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL DEFAULT 'admin',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS domain_verifications (
  id BIGSERIAL PRIMARY KEY,
  organization_domain_id BIGINT NOT NULL REFERENCES organization_domains(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL DEFAULT 'dns',
  status TEXT NOT NULL DEFAULT 'pending',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_rules (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_key TEXT NOT NULL,
  title TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'telegram',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, rule_key)
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  rule_id BIGINT REFERENCES notification_rules(id) ON DELETE SET NULL,
  recipient TEXT,
  channel TEXT NOT NULL DEFAULT 'system',
  title TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  provider_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS organization_domains_org_idx ON organization_domains(organization_id);
CREATE INDEX IF NOT EXISTS subscription_invoices_org_idx ON subscription_invoices(organization_id);
CREATE INDEX IF NOT EXISTS subscription_payments_org_idx ON subscription_payments(organization_id);
CREATE INDEX IF NOT EXISTS support_tickets_org_idx ON support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS notification_logs_org_idx ON notification_logs(organization_id);

INSERT INTO tariffs (name, monthly_price, student_limit, teacher_limit, branch_limit, group_limit, sms_limit, feature_flags, support_level)
SELECT * FROM (VALUES
  ('Start', 99000::numeric, 100, 5, 1, 10, 0, '{"students":true,"groups":true,"teachers":true,"finance":true,"attendance":true,"student_app":false,"custom_domain":false,"advanced_reports":false}'::jsonb, 'standard'),
  ('Growth', 249000::numeric, 500, 20, 3, 50, 1000, '{"students":true,"groups":true,"teachers":true,"finance":true,"attendance":true,"leads":true,"student_app":true,"telegram":true,"import_export":true,"custom_domain":false,"advanced_reports":true}'::jsonb, 'priority'),
  ('Pro', 499000::numeric, 2000, 100, 10, 200, 5000, '{"students":true,"groups":true,"teachers":true,"finance":true,"attendance":true,"leads":true,"student_app":true,"parent_app":true,"telegram":true,"sms":true,"import_export":true,"custom_domain":true,"advanced_reports":true,"api_access":true,"role_permission":true}'::jsonb, 'premium'),
  ('Enterprise', 0::numeric, 100000, 5000, 1000, 10000, 100000, '{"students":true,"groups":true,"teachers":true,"finance":true,"attendance":true,"leads":true,"student_app":true,"parent_app":true,"telegram":true,"sms":true,"import_export":true,"custom_domain":true,"advanced_reports":true,"api_access":true,"role_permission":true,"white_label":true}'::jsonb, 'dedicated')
) AS seed(name, monthly_price, student_limit, teacher_limit, branch_limit, group_limit, sms_limit, feature_flags, support_level)
WHERE NOT EXISTS (SELECT 1 FROM tariffs t WHERE LOWER(t.name)=LOWER(seed.name));


-- Eduka 19.6 stabilization: safe constraints, indexes, admin users and no-demo production foundations
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS temporary_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS brand_color TEXT NOT NULL DEFAULT '#0A84FF';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS read_only_until TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER NOT NULL DEFAULT 1024;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS sms_limit INTEGER NOT NULL DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS student_limit INTEGER NOT NULL DEFAULT 100;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS teacher_limit INTEGER NOT NULL DEFAULT 5;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS branch_limit INTEGER NOT NULL DEFAULT 1;

-- Deduplicate rows before adding production unique indexes. Keeps the newest row by id.
DELETE FROM organization_domains a USING organization_domains b
WHERE a.id < b.id AND lower(a.domain)=lower(b.domain);

DELETE FROM organization_feature_flags a USING organization_feature_flags b
WHERE a.ctid < b.ctid AND a.organization_id=b.organization_id AND a.feature_key=b.feature_key;

DELETE FROM subscriptions a USING subscriptions b
WHERE a.id < b.id AND a.organization_id=b.organization_id;

DELETE FROM organization_roles a USING organization_roles b
WHERE a.id < b.id AND a.organization_id=b.organization_id AND lower(a.name)=lower(b.name);

DELETE FROM organization_permissions a USING organization_permissions b
WHERE a.id < b.id AND a.role_id=b.role_id AND a.permission_key=b.permission_key;

CREATE UNIQUE INDEX IF NOT EXISTS organizations_subdomain_unique_196
ON organizations (lower(subdomain)) WHERE subdomain IS NOT NULL AND subdomain <> '';

CREATE UNIQUE INDEX IF NOT EXISTS organizations_custom_domain_unique_196
ON organizations (lower(custom_domain)) WHERE custom_domain IS NOT NULL AND custom_domain <> '';

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_196
ON users (lower(email)) WHERE email IS NOT NULL AND email <> '';

CREATE UNIQUE INDEX IF NOT EXISTS users_normalized_phone_unique_196
ON users (normalized_phone) WHERE normalized_phone IS NOT NULL AND normalized_phone <> '';

CREATE UNIQUE INDEX IF NOT EXISTS organization_domains_domain_unique_196
ON organization_domains (lower(domain));

CREATE UNIQUE INDEX IF NOT EXISTS organization_domains_org_domain_type_unique_196
ON organization_domains (organization_id, lower(domain), type);

CREATE UNIQUE INDEX IF NOT EXISTS organization_feature_flags_org_key_unique_196
ON organization_feature_flags (organization_id, feature_key);

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_org_unique_196
ON subscriptions (organization_id);

CREATE UNIQUE INDEX IF NOT EXISTS organization_settings_org_unique_196
ON organization_settings (organization_id);

CREATE UNIQUE INDEX IF NOT EXISTS organization_branding_org_unique_196
ON organization_branding (organization_id);

CREATE UNIQUE INDEX IF NOT EXISTS organization_roles_org_name_unique_196
ON organization_roles (organization_id, lower(name));

CREATE UNIQUE INDEX IF NOT EXISTS organization_permissions_role_key_unique_196
ON organization_permissions (role_id, permission_key);

CREATE INDEX IF NOT EXISTS audit_logs_org_created_idx_196 ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS users_role_idx_196 ON users(role);

-- Platform owner roles/permissions seed.
INSERT INTO admin_roles (name, description)
VALUES
  ('platform_owner','Eduka platformasi egasi'),
  ('support_manager','Support manager'),
  ('sales_manager','Sales manager'),
  ('finance_manager','Finance manager'),
  ('technical_manager','Technical manager')
ON CONFLICT (name) DO NOTHING;

INSERT INTO admin_permissions (role_id, permission_key, enabled)
SELECT ar.id, p.permission_key, TRUE
FROM admin_roles ar
CROSS JOIN (VALUES
  ('centers.view'),('centers.create'),('centers.block'),('centers.delete'),
  ('billing.view'),('billing.manage'),('domains.manage'),('support.manage'),
  ('plans.manage'),('admins.manage'),('audit.view'),('settings.manage')
) AS p(permission_key)
WHERE ar.name='platform_owner'
ON CONFLICT (role_id, permission_key) DO UPDATE SET enabled=EXCLUDED.enabled;


-- Eduka 21.0 stabilization schema hardening
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE students ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS crystals INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS teacher_salary NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS salary_type TEXT NOT NULL DEFAULT 'fixed';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS chat_id TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS delivery_mode TEXT NOT NULL DEFAULT 'offline';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_no TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_printed_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_status TEXT NOT NULL DEFAULT 'not_printed';
CREATE UNIQUE INDEX IF NOT EXISTS payments_org_receipt_no_unique_211 ON payments(organization_id, receipt_no) WHERE receipt_no IS NOT NULL;

ALTER TABLE courses ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE salaries ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS students_org_group_idx ON students(organization_id, group_id);
CREATE INDEX IF NOT EXISTS students_org_status_idx ON students(organization_id, status);
CREATE INDEX IF NOT EXISTS leads_org_status_idx ON leads(organization_id, status);
CREATE INDEX IF NOT EXISTS payments_org_student_idx ON payments(organization_id, student_id);
CREATE INDEX IF NOT EXISTS groups_org_teacher_idx ON groups(organization_id, teacher_id);
CREATE INDEX IF NOT EXISTS attendance_org_student_date_idx ON attendance_records(organization_id, student_id, lesson_date);
