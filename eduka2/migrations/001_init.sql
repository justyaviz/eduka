
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS ceo_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'CEO',
  status VARCHAR(30) DEFAULT 'active',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  center_name VARCHAR(180) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  payment_mode VARCHAR(80),
  password_text VARCHAR(120),
  source VARCHAR(80) DEFAULT 'landing',
  status VARCHAR(50) DEFAULT 'Yangi',
  manager VARCHAR(120) DEFAULT 'Tayinlanmagan',
  note TEXT,
  converted_center_id UUID,
  demo_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(180) NOT NULL,
  subdomain VARCHAR(100) UNIQUE,
  owner_name VARCHAR(120),
  owner_phone VARCHAR(50),
  owner_email VARCHAR(160),
  tariff VARCHAR(80) DEFAULT 'Start',
  status VARCHAR(50) DEFAULT 'Trial',
  students_count INTEGER DEFAULT 0,
  branches_count INTEGER DEFAULT 1,
  monthly_payment NUMERIC(14,2) DEFAULT 0,
  trial_ends_at TIMESTAMP,
  next_payment_date TIMESTAMP,
  created_from_demo_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tariffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) UNIQUE NOT NULL,
  student_limit INTEGER DEFAULT 0,
  branch_limit INTEGER DEFAULT 1,
  monthly_price NUMERIC(14,2) DEFAULT 0,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES centers(id) ON DELETE SET NULL,
  center_name VARCHAR(180),
  tariff VARCHAR(80),
  amount NUMERIC(14,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Kutilmoqda',
  payment_date TIMESTAMP,
  next_payment_date TIMESTAMP,
  receipt_url TEXT,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ceo_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120),
  phone VARCHAR(50),
  question TEXT,
  message TEXT,
  status VARCHAR(50) DEFAULT 'Yangi',
  manager VARCHAR(120) DEFAULT 'Tayinlanmagan',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(180) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES ceo_users(id) ON DELETE SET NULL,
  user_name VARCHAR(120),
  action VARCHAR(180) NOT NULL,
  module VARCHAR(80),
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(80),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(120) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS converted_center_id UUID;
ALTER TABLE demo_requests ADD COLUMN IF NOT EXISTS demo_date TIMESTAMP;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMP;
ALTER TABLE centers ADD COLUMN IF NOT EXISTS created_from_demo_id UUID;

-- CEO user is created safely by utils/init-db.js only when required.

INSERT INTO tariffs (name, student_limit, branch_limit, monthly_price, features)
VALUES
('Start', 100, 1, 2700000, '["O‘quvchilar", "Guruhlar", "To‘lovlar"]'),
('Basic', 300, 2, 5616000, '["O‘quvchilar", "Guruhlar", "To‘lovlar", "Davomat", "Hisobot"]'),
('Pro', 1000, 5, 8424000, '["Davomat", "Hisobot", "Telegram bot", "Gamification", "Student app"]'),
('Premium', 999999, 999, 16200000, '["Barcha modullar", "API", "Multi-branch", "Premium support"]')
ON CONFLICT (name) DO UPDATE SET
  student_limit = EXCLUDED.student_limit,
  branch_limit = EXCLUDED.branch_limit,
  monthly_price = EXCLUDED.monthly_price,
  features = EXCLUDED.features,
  is_active = TRUE,
  updated_at = NOW();

INSERT INTO ceo_roles (name, description, permissions)
VALUES
('CEO', 'Barcha ruxsatlar', '["*"]'),
('Admin', 'Platforma admini', '["dashboard.view", "demo.manage", "centers.manage", "tariffs.manage"]'),
('Sales manager', 'Sotuv bo‘limi', '["demo.view", "demo.update", "centers.create"]'),
('Finance manager', 'To‘lovlar bo‘limi', '["payments.view", "payments.manage"]'),
('Support manager', 'Support bo‘limi', '["support.view", "support.reply"]'),
('Viewer', 'Faqat ko‘rish', '["dashboard.view"]')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

INSERT INTO platform_settings (key, value)
VALUES
('platform_name', 'EDUKA'),
('call_center_phone', '+998 99 893 90 00'),
('sales_phone', '+998 20 027 29 00'),
('sales_telegram', 'https://t.me/eduka_sales'),
('support_telegram', 'https://t.me/eduka_uz'),
('instagram', 'https://www.instagram.com/eduka_uz/'),
('default_trial_days', '7'),
('default_language', 'uz')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();


-- ===== PHASE 2 CENTER CRM CORE =====

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS center_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'director',
  status VARCHAR(30) DEFAULT 'active',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(center_id, email)
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
  full_name VARCHAR(160) NOT NULL,
  phone VARCHAR(50),
  parent_phone VARCHAR(50),
  birth_date DATE,
  status VARCHAR(40) DEFAULT 'active',
  balance NUMERIC(14,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  course_name VARCHAR(160),
  teacher_name VARCHAR(160),
  schedule_text VARCHAR(200),
  monthly_price NUMERIC(14,2) DEFAULT 0,
  status VARCHAR(40) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(40) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, student_id)
);

CREATE TABLE IF NOT EXISTS center_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  student_name VARCHAR(160),
  amount NUMERIC(14,2) DEFAULT 0,
  payment_type VARCHAR(50) DEFAULT 'cash',
  status VARCHAR(40) DEFAULT 'paid',
  note TEXT,
  paid_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  lesson_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(40) DEFAULT 'present',
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, student_id, lesson_date)
);

CREATE TABLE IF NOT EXISTS center_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES center_users(id) ON DELETE SET NULL,
  action VARCHAR(180) NOT NULL,
  module VARCHAR(80),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);



-- ===== PHASE 3 MODME-LIKE CENTER CRM UI TABLES =====
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
  full_name VARCHAR(160) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(160),
  status VARCHAR(40) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
  full_name VARCHAR(160),
  phone VARCHAR(50),
  source VARCHAR(80),
  status VARCHAR(50) DEFAULT 'LEADS',
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  note TEXT,
  tag VARCHAR(80),
  assigned_to VARCHAR(160),
  remind_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS center_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  amount NUMERIC(14,2) DEFAULT 0,
  category VARCHAR(80),
  spent_at TIMESTAMP DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS days_text VARCHAR(160);
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS room_name VARCHAR(100);
ALTER TABLE study_groups ADD COLUMN IF NOT EXISTS started_at DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS note TEXT;
