
BEGIN;

-- Eduka 21.4 production safety patch. Safe to run multiple times.
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_app_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_app_blocked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS app_password_hash TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS app_password_set_at TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS crystals INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS referral_code TEXT;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_no TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(14,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'paid';

CREATE UNIQUE INDEX IF NOT EXISTS student_app_settings_org_unique_exact_2104 ON student_app_settings (organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS student_app_modules_org_key_unique_exact_2104 ON student_app_modules (organization_id, key);
CREATE UNIQUE INDEX IF NOT EXISTS payment_receipt_no_unique_exact_2104 ON payments (receipt_no) WHERE receipt_no IS NOT NULL AND receipt_no <> '';
CREATE INDEX IF NOT EXISTS students_student_app_phone_idx_2104 ON students (organization_id, phone) WHERE student_app_enabled = TRUE;
CREATE INDEX IF NOT EXISTS notifications_org_unread_idx_2104 ON notifications (organization_id, read_at) WHERE read_at IS NULL;

-- Ensure the requested test student can enter Student App at /app.
UPDATE students
SET student_app_enabled = TRUE,
    student_app_blocked = FALSE,
    coins = GREATEST(COALESCE(coins, 0), 3700),
    crystals = GREATEST(COALESCE(crystals, 0), 245000),
    referral_code = COALESCE(referral_code, 'HARVEY21')
WHERE regexp_replace(COALESCE(phone, ''), '\D', '', 'g') = '998931949200';

COMMIT;
