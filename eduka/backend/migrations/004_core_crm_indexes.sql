-- Eduka 21.7.0 core CRM indexes
CREATE INDEX IF NOT EXISTS idx_students_org_phone ON students(organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_students_org_status ON students(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_groups_org_status ON groups(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_teachers_org_status ON teachers(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_org_paid_at ON payments(organization_id, paid_at);
CREATE INDEX IF NOT EXISTS idx_attendance_org_lesson_date ON attendance(organization_id, lesson_date);
