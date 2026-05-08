const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
let bcrypt = null;
try { bcrypt = require("bcryptjs"); } catch { bcrypt = null; }
const { Pool } = require("pg");

function hashPassword(password) {
  if (bcrypt) return bcrypt.hashSync(String(password), 10);
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function applyProductionHardening(pool) {
  console.log("Applying production unique constraints...");
  await pool.query(`
    -- Clean duplicates before exact ON CONFLICT indexes.
    DELETE FROM users a USING users b
    WHERE a.id < b.id AND a.email IS NOT NULL AND b.email IS NOT NULL AND a.email = b.email;

    -- Keep all user records, but make duplicate normalized_phone values unique before indexes/upserts.
    WITH ranked AS (
      SELECT id, normalized_phone, ROW_NUMBER() OVER (PARTITION BY normalized_phone ORDER BY id DESC) AS rn
      FROM users
      WHERE normalized_phone IS NOT NULL AND normalized_phone <> ''
    )
    UPDATE users u
    SET normalized_phone = CONCAT('legacy-', u.id, '-', regexp_replace(COALESCE(u.normalized_phone, ''), '[^0-9a-zA-Z]+', '', 'g'))
    FROM ranked r
    WHERE u.id = r.id AND r.rn > 1;

    DELETE FROM organization_settings a USING organization_settings b
    WHERE a.ctid < b.ctid AND a.organization_id = b.organization_id;

    DELETE FROM organization_branding a USING organization_branding b
    WHERE a.ctid < b.ctid AND a.organization_id = b.organization_id;

    DELETE FROM organization_feature_flags a USING organization_feature_flags b
    WHERE a.ctid < b.ctid AND a.organization_id = b.organization_id AND a.feature_key = b.feature_key;

    DELETE FROM subscriptions a USING subscriptions b
    WHERE a.id < b.id AND a.organization_id = b.organization_id;

    DELETE FROM organization_roles a USING organization_roles b
    WHERE a.id < b.id AND a.organization_id = b.organization_id AND a.name = b.name;

    DELETE FROM organization_permissions a USING organization_permissions b
    WHERE a.id < b.id AND a.role_id = b.role_id AND a.permission_key = b.permission_key;

    DELETE FROM admin_permissions a USING admin_permissions b
    WHERE a.id < b.id AND a.role_id = b.role_id AND a.permission_key = b.permission_key;

    -- Exact indexes required by ON CONFLICT(column) and ON CONFLICT(col1,col2).
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_exact_2001 ON users (email);
    -- schema.sql already defines users.normalized_phone as UNIQUE. This partial index helps older DBs but avoids blank values.
    CREATE UNIQUE INDEX IF NOT EXISTS users_normalized_phone_unique_exact_2001 ON users (normalized_phone) WHERE normalized_phone IS NOT NULL AND normalized_phone <> '';
    CREATE UNIQUE INDEX IF NOT EXISTS organization_settings_org_unique_exact_2001 ON organization_settings (organization_id);
    CREATE UNIQUE INDEX IF NOT EXISTS organization_branding_org_unique_exact_2001 ON organization_branding (organization_id);
    CREATE UNIQUE INDEX IF NOT EXISTS organization_feature_flags_org_key_unique_exact_2001 ON organization_feature_flags (organization_id, feature_key);
    CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_org_unique_exact_2001 ON subscriptions (organization_id);
    CREATE UNIQUE INDEX IF NOT EXISTS organization_roles_org_name_unique_exact_2001 ON organization_roles (organization_id, name);
    CREATE UNIQUE INDEX IF NOT EXISTS organization_permissions_role_key_unique_exact_2001 ON organization_permissions (role_id, permission_key);
    CREATE UNIQUE INDEX IF NOT EXISTS admin_roles_name_unique_exact_2001 ON admin_roles (name);
    CREATE UNIQUE INDEX IF NOT EXISTS admin_permissions_role_key_unique_exact_2001 ON admin_permissions (role_id, permission_key);
    CREATE UNIQUE INDEX IF NOT EXISTS student_app_modules_org_key_unique_exact_2001 ON student_app_modules (organization_id, key);
    CREATE UNIQUE INDEX IF NOT EXISTS attendance_org_group_student_date_unique_exact_2001 ON attendance_records (organization_id, group_id, student_id, lesson_date);
    CREATE UNIQUE INDEX IF NOT EXISTS group_students_org_group_student_unique_exact_2001 ON group_students (organization_id, group_id, student_id);
  `);
}

async function run() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
  });

  const superEmail = (process.env.SUPER_ADMIN_EMAIL || "admin@eduka.uz").toLowerCase();
  const superPassword = process.env.SUPER_ADMIN_PASSWORD || "12345678";
  const superPhone = process.env.SUPER_ADMIN_PHONE || "+998901234567";
  const normalizedPhone = String(superPhone).replace(/\D/g, "") || "998901234567";

  try {
    console.log("Running Eduka schema.sql...");
    const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await pool.query(sql);

    await applyProductionHardening(pool);

    // Make sure the platform owner phone does not conflict with an existing non-owner account.
    // Email is the authoritative login for the platform owner; phone can be reassigned safely.
    await pool.query(
      `UPDATE users
       SET normalized_phone = CONCAT('legacy-', id, '-', regexp_replace(COALESCE(normalized_phone, ''), '[^0-9a-zA-Z]+', '', 'g'))
       WHERE normalized_phone = $1 AND LOWER(COALESCE(email, '')) <> $2`,
      [normalizedPhone, superEmail]
    );

    console.log("Seeding platform owner...");
    await pool.query(
      `INSERT INTO users (organization_id, full_name, email, phone, normalized_phone, role, password_hash, is_active, temporary_password, permissions, metadata)
       VALUES (NULL, 'Eduka Platform Owner', $1, $2, $3, 'super_admin', $4, TRUE, FALSE, '["*"]'::jsonb, '{"seed":"migrate-19.6"}'::jsonb)
       ON CONFLICT (email) DO UPDATE SET
         full_name=EXCLUDED.full_name,
         phone=EXCLUDED.phone,
         normalized_phone=EXCLUDED.normalized_phone,
         role='super_admin',
         password_hash=EXCLUDED.password_hash,
         is_active=TRUE,
         temporary_password=FALSE,
         permissions='["*"]'::jsonb,
         updated_at=NOW()`,
      [superEmail, superPhone, normalizedPhone, hashPassword(superPassword)]
    );

    console.log("Eduka 20.0.2 migration completed.");
    console.log(`Super Admin: ${superEmail}`);
    console.log(`Temporary password: ${superPassword}`);
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
