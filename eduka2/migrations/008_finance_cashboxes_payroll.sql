-- EDUKA CRM v0.9.7 — Finance 2.0 + payroll. Additive, tenant-scoped, idempotent.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS finance_cashboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  kind VARCHAR(40) DEFAULT 'cash',
  currency VARCHAR(12) DEFAULT 'UZS',
  is_default BOOLEAN DEFAULT FALSE,
  status VARCHAR(40) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_finance_cashboxes_center ON finance_cashboxes(center_id);

ALTER TABLE center_payments ADD COLUMN IF NOT EXISTS cashbox_id UUID REFERENCES finance_cashboxes(id) ON DELETE SET NULL;
ALTER TABLE center_payments ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES center_branches(id) ON DELETE SET NULL;
ALTER TABLE center_expenses ADD COLUMN IF NOT EXISTS cashbox_id UUID REFERENCES finance_cashboxes(id) ON DELETE SET NULL;
ALTER TABLE center_expenses ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES center_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_center_payments_cashbox ON center_payments(center_id,cashbox_id);
CREATE INDEX IF NOT EXISTS idx_center_payments_branch ON center_payments(center_id,branch_id);
CREATE INDEX IF NOT EXISTS idx_center_expenses_cashbox ON center_expenses(center_id,cashbox_id);
CREATE INDEX IF NOT EXISTS idx_center_expenses_branch ON center_expenses(center_id,branch_id);

CREATE TABLE IF NOT EXISTS teacher_payroll_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  base_salary NUMERIC(14,2) DEFAULT 0,
  lesson_rate NUMERIC(14,2) DEFAULT 0,
  revenue_percent NUMERIC(7,3) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(center_id,teacher_id)
);
CREATE INDEX IF NOT EXISTS idx_teacher_payroll_rules_center ON teacher_payroll_rules(center_id,teacher_id);

CREATE TABLE IF NOT EXISTS teacher_payroll_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_amount NUMERIC(14,2) DEFAULT 0,
  lesson_count INTEGER DEFAULT 0,
  lesson_rate NUMERIC(14,2) DEFAULT 0,
  lesson_amount NUMERIC(14,2) DEFAULT 0,
  revenue_amount NUMERIC(14,2) DEFAULT 0,
  revenue_percent NUMERIC(7,3) DEFAULT 0,
  percentage_amount NUMERIC(14,2) DEFAULT 0,
  bonus_amount NUMERIC(14,2) DEFAULT 0,
  deduction_amount NUMERIC(14,2) DEFAULT 0,
  total_amount NUMERIC(14,2) DEFAULT 0,
  status VARCHAR(40) DEFAULT 'draft',
  cashbox_id UUID REFERENCES finance_cashboxes(id) ON DELETE SET NULL,
  paid_at TIMESTAMP,
  note TEXT,
  created_by UUID REFERENCES center_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_teacher_payroll_entries_center_period ON teacher_payroll_entries(center_id,period_start,period_end);
CREATE INDEX IF NOT EXISTS idx_teacher_payroll_entries_teacher ON teacher_payroll_entries(center_id,teacher_id);

ALTER TABLE center_expenses ADD COLUMN IF NOT EXISTS payroll_entry_id UUID REFERENCES teacher_payroll_entries(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_center_expenses_payroll_entry ON center_expenses(payroll_entry_id) WHERE payroll_entry_id IS NOT NULL;

-- Every center gets one default cashbox.
INSERT INTO finance_cashboxes(center_id,name,kind,currency,is_default,status)
SELECT c.id,'Asosiy kassa','cash','UZS',TRUE,'active'
  FROM centers c
 WHERE NOT EXISTS (SELECT 1 FROM finance_cashboxes f WHERE f.center_id=c.id AND COALESCE(f.status,'active')<>'deleted');

UPDATE finance_cashboxes f SET is_default=TRUE,updated_at=NOW()
 WHERE f.id IN (
   SELECT DISTINCT ON(center_id) id FROM finance_cashboxes x
    WHERE COALESCE(x.status,'active')<>'deleted'
      AND NOT EXISTS (SELECT 1 FROM finance_cashboxes d WHERE d.center_id=x.center_id AND d.is_default=TRUE AND COALESCE(d.status,'active')<>'deleted')
    ORDER BY center_id,created_at
 );

-- Historical transactions without a cashbox are assigned to the center default cashbox.
UPDATE center_payments p
   SET cashbox_id=(SELECT f.id FROM finance_cashboxes f WHERE f.center_id=p.center_id AND f.is_default=TRUE AND COALESCE(f.status,'active')<>'deleted' ORDER BY f.created_at LIMIT 1)
 WHERE p.cashbox_id IS NULL;
UPDATE center_expenses e
   SET cashbox_id=(SELECT f.id FROM finance_cashboxes f WHERE f.center_id=e.center_id AND f.is_default=TRUE AND COALESCE(f.status,'active')<>'deleted' ORDER BY f.created_at LIMIT 1)
 WHERE e.cashbox_id IS NULL;

-- Historical transaction branch falls back to group branch, then center main branch.
UPDATE center_payments p
   SET branch_id=COALESCE((SELECT g.branch_id FROM study_groups g WHERE g.id=p.group_id AND g.center_id=p.center_id),
                          (SELECT b.id FROM center_branches b WHERE b.center_id=p.center_id AND b.is_main=TRUE AND COALESCE(b.status,'active')<>'deleted' ORDER BY b.created_at LIMIT 1))
 WHERE p.branch_id IS NULL;
UPDATE center_expenses e
   SET branch_id=(SELECT b.id FROM center_branches b WHERE b.center_id=e.center_id AND b.is_main=TRUE AND COALESCE(b.status,'active')<>'deleted' ORDER BY b.created_at LIMIT 1)
 WHERE e.branch_id IS NULL;

-- Seed payroll rules from existing teacher salary without changing teacher records.
INSERT INTO teacher_payroll_rules(center_id,teacher_id,base_salary,lesson_rate,revenue_percent,active)
SELECT t.center_id,t.id,COALESCE(t.salary,0),0,0,TRUE FROM teachers t
 WHERE COALESCE(t.status,'active')<>'deleted'
ON CONFLICT(center_id,teacher_id) DO NOTHING;
