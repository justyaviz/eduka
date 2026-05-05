const crypto = require("crypto");

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 9) return `998${digits}`;
  return digits;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

const name = process.argv[2] || "Eduka Admin";
const phone = process.argv[3] || "+998901234567";
const password = process.argv[4] || "ChangeMe123!";
const organization = process.argv[5] || "ilm academy uz";
const normalizedPhone = normalizePhone(phone);
const passwordHash = hashPassword(password);

console.log(`
-- Run backend/schema.sql first, then run this SQL once:
WITH org AS (
  INSERT INTO organizations (name, license_expires_at)
  VALUES ('${organization.replace(/'/g, "''")}', '2026-05-10 23:59:00+05')
  ON CONFLICT DO NOTHING
  RETURNING id
), selected_org AS (
  SELECT id FROM org
  UNION ALL
  SELECT id FROM organizations WHERE name = '${organization.replace(/'/g, "''")}'
  LIMIT 1
)
INSERT INTO users (organization_id, full_name, phone, normalized_phone, role, password_hash)
SELECT id, '${name.replace(/'/g, "''")}', '${phone.replace(/'/g, "''")}', '${normalizedPhone}', 'admin', '${passwordHash}'
FROM selected_org
ON CONFLICT (normalized_phone) DO UPDATE
SET full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    password_hash = EXCLUDED.password_hash,
    is_active = TRUE,
    updated_at = NOW();
`);
