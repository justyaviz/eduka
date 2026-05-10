-- Eduka 22.1.7 — Safe gamification tables for old Railway databases
CREATE TABLE IF NOT EXISTS student_coin_transactions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id BIGINT REFERENCES teachers(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'award',
  reason TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS student_coin_transactions_org_student_idx
  ON student_coin_transactions(organization_id, student_id, created_at DESC);

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
CREATE INDEX IF NOT EXISTS student_reward_products_org_status_idx
  ON student_reward_products(organization_id, status, coin_price);

CREATE TABLE IF NOT EXISTS student_reward_redemptions (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES student_reward_products(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL DEFAULT '',
  coin_price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS student_reward_redemptions_org_status_idx
  ON student_reward_redemptions(organization_id, status, created_at DESC);

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS student_achievements_org_student_key_unique
  ON student_achievements(organization_id, student_id, key);
CREATE INDEX IF NOT EXISTS student_achievements_org_student_idx
  ON student_achievements(organization_id, student_id);
