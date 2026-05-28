const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const pool = require("../db");

async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL yo‘q. Railway Variables ichiga DATABASE_URL qo‘ying.");
    return { ok: false, error: "DATABASE_URL missing" };
  }

  const sqlPath = path.join(__dirname, "..", "migrations", "001_init.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  await pool.query(sql);

  const fullName = process.env.CEO_NAME || "EDUKA CEO";
  const email = process.env.CEO_EMAIL || "ceo@eduka.uz";
  const password = process.env.CEO_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    `
    INSERT INTO ceo_users (full_name, email, password_hash, role, status)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (email)
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      status = EXCLUDED.status,
      updated_at = NOW()
    `,
    [fullName, email, passwordHash, "CEO", "active"]
  );

  console.log("✅ Database schema ready");
  console.log("✅ CEO user ready:", email);
  return { ok: true, email, password };
}

module.exports = { initDatabase };
