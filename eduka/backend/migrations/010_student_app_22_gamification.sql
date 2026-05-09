-- Eduka 22.1.0 — Student App 22 + Gamification core

ALTER TABLE students ADD COLUMN IF NOT EXISTS telegram_user_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS crystals INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_student_app_login TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_app_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_app_blocked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS app_password_hash TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS app_password_set_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS app_password_reset_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS attendance_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS profile_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS rewards_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS achievements_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS homework_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS materials_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE student_app_settings ADD COLUMN IF NOT EXISTS online_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS student_coin_transactions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'award',
  reason TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_coin_transactions_org_student_idx ON student_coin_transactions(organization_id, student_id, created_at DESC);

CREATE TABLE IF NOT EXISTS student_reward_products (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  coin_price INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Boshqalar',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_reward_products_org_status_idx ON student_reward_products(organization_id, status, coin_price);

CREATE TABLE IF NOT EXISTS student_reward_redemptions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES student_reward_products(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  coin_price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS student_reward_redemptions_org_status_idx ON student_reward_redemptions(organization_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS student_achievements (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL DEFAULT 1,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, student_id, key)
);

CREATE INDEX IF NOT EXISTS student_achievements_org_student_idx ON student_achievements(organization_id, student_id);

-- Keep module list clean: only useful Student App 22 modules enabled by default.
INSERT INTO student_app_modules (organization_id, key, title, description, icon, enabled, sort_order)
SELECT o.id, 'home', 'Bosh sahifa', 'Bugungi dars, to‘lov, davomat va coin balans', 'home', TRUE, 1 FROM organizations o
ON CONFLICT (organization_id, key) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, enabled=TRUE, sort_order=EXCLUDED.sort_order;

INSERT INTO student_app_modules (organization_id, key, title, description, icon, enabled, sort_order)
SELECT o.id, 'schedule', 'Jadval', 'Haftalik va bugungi dars jadvali', 'calendar', TRUE, 2 FROM organizations o
ON CONFLICT (organization_id, key) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, enabled=TRUE, sort_order=EXCLUDED.sort_order;

INSERT INTO student_app_modules (organization_id, key, title, description, icon, enabled, sort_order)
SELECT o.id, 'payments', 'To‘lovlar', 'To‘lov holati va tarix', 'wallet', TRUE, 3 FROM organizations o
ON CONFLICT (organization_id, key) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, enabled=TRUE, sort_order=EXCLUDED.sort_order;

INSERT INTO student_app_modules (organization_id, key, title, description, icon, enabled, sort_order)
SELECT o.id, 'attendance', 'Davomat', 'Davomat foizi va tarix', 'check-circle', TRUE, 4 FROM organizations o
ON CONFLICT (organization_id, key) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, enabled=TRUE, sort_order=EXCLUDED.sort_order;

INSERT INTO student_app_modules (organization_id, key, title, description, icon, enabled, sort_order)
SELECT o.id, 'coins', 'Coinlar', 'O‘qituvchi bergan coinlar va sovg‘alar', 'coins', TRUE, 5 FROM organizations o
ON CONFLICT (organization_id, key) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, enabled=TRUE, sort_order=EXCLUDED.sort_order;

INSERT INTO student_app_modules (organization_id, key, title, description, icon, enabled, sort_order)
SELECT o.id, 'rewards', 'Sovg‘alar do‘koni', 'Coin evaziga sovg‘alar olish', 'gift', TRUE, 6 FROM organizations o
ON CONFLICT (organization_id, key) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, enabled=TRUE, sort_order=EXCLUDED.sort_order;

INSERT INTO student_app_modules (organization_id, key, title, description, icon, enabled, sort_order)
SELECT o.id, 'rating', 'Reyting', 'Coin va natijalar bo‘yicha reyting', 'trophy', TRUE, 7 FROM organizations o
ON CONFLICT (organization_id, key) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, enabled=TRUE, sort_order=EXCLUDED.sort_order;

INSERT INTO student_app_modules (organization_id, key, title, description, icon, enabled, sort_order)
SELECT o.id, 'materials', 'Materiallar', 'PDF va video dars materiallari', 'book-open', TRUE, 8 FROM organizations o
ON CONFLICT (organization_id, key) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, enabled=TRUE, sort_order=EXCLUDED.sort_order;

-- Disable older empty modules so they do not show as useless buttons.
UPDATE student_app_modules
SET enabled=FALSE
WHERE key IN ('dictionary','extra_lesson','referral','feedback','exams')
  AND organization_id IS NOT NULL;
