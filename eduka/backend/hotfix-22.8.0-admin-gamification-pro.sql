-- Eduka 22.8.0 — Admin Gamification Pro
-- Safe migration for teacher coin limits, gamification rules and reward metadata.

CREATE TABLE IF NOT EXISTS student_gamification_rules (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reason_key TEXT,
  amount INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_gamification_rules_org_status_idx
  ON student_gamification_rules(organization_id, status, amount);

ALTER TABLE student_reward_products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE student_reward_products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE student_reward_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE student_reward_redemptions ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE student_reward_redemptions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE student_coin_transactions ADD COLUMN IF NOT EXISTS created_by BIGINT;

CREATE TABLE IF NOT EXISTS teacher_coin_limits (
  id BIGSERIAL PRIMARY KEY,
  organization_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  teacher_id BIGINT REFERENCES teachers(id) ON DELETE CASCADE,
  daily_limit INTEGER NOT NULL DEFAULT 100,
  monthly_limit INTEGER NOT NULL DEFAULT 1000,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, teacher_id)
);

INSERT INTO student_gamification_rules (organization_id, title, description, reason_key, amount, status)
SELECT o.id, 'Darsda faol qatnashdi', 'O‘qituvchi darsdagi faollik uchun beradi', 'active_lesson', 30, 'active'
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM student_gamification_rules r WHERE r.organization_id=o.id AND r.reason_key='active_lesson');

INSERT INTO student_gamification_rules (organization_id, title, description, reason_key, amount, status)
SELECT o.id, 'Uyga vazifani bajardi', 'Topshiriq vaqtida topshirilganda beriladi', 'homework_done', 20, 'active'
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM student_gamification_rules r WHERE r.organization_id=o.id AND r.reason_key='homework_done');

INSERT INTO student_gamification_rules (organization_id, title, description, reason_key, amount, status)
SELECT o.id, 'A’lo baho oldi', 'Yuqori natija uchun rag‘bat', 'excellent_grade', 50, 'active'
FROM organizations o
WHERE NOT EXISTS (SELECT 1 FROM student_gamification_rules r WHERE r.organization_id=o.id AND r.reason_key='excellent_grade');
