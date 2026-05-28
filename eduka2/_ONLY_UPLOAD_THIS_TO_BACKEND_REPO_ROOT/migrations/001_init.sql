
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

INSERT INTO ceo_users (
  full_name,
  email,
  password_hash,
  role,
  status
)
VALUES (
  'EDUKA CEO',
  'ceo@eduka.uz',
  crypt('admin123', gen_salt('bf', 10)),
  'CEO',
  'active'
)
ON CONFLICT (email)
DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password_hash = crypt('admin123', gen_salt('bf', 10)),
  role = 'CEO',
  status = 'active',
  updated_at = NOW();

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
