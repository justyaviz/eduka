
-- Eduka 21.4.3 Payment safety SQL
-- Railway Postgres > Query > Run
BEGIN;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_no TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS due_amount NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_printed_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_status TEXT NOT NULL DEFAULT 'not_printed';

UPDATE payments SET paid_amount = amount WHERE COALESCE(paid_amount,0)=0 AND COALESCE(amount,0)>0;
UPDATE payments SET payment_date = COALESCE(payment_date, paid_at::date, created_at::date, CURRENT_DATE) WHERE payment_date IS NULL;
UPDATE payments SET due_amount = amount WHERE COALESCE(due_amount,0)=0 AND COALESCE(amount,0)>0;

UPDATE payments
SET receipt_no = 'CHK-' || TO_CHAR(COALESCE(payment_date, paid_at::date, CURRENT_DATE), 'YYYYMMDD') || '-' || LPAD(id::text, 5, '0')
WHERE receipt_no IS NULL OR receipt_no = '';

CREATE UNIQUE INDEX IF NOT EXISTS payments_org_receipt_no_unique_2143
ON payments(organization_id, receipt_no)
WHERE receipt_no IS NOT NULL AND receipt_no <> '';

CREATE INDEX IF NOT EXISTS payments_org_student_group_idx_2143
ON payments(organization_id, student_id, group_id);

CREATE INDEX IF NOT EXISTS groups_org_price_idx_2143
ON groups(organization_id, id, monthly_price, price);

COMMIT;
