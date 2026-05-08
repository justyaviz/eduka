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

    console.log("Eduka 19.6 migration completed.");
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
