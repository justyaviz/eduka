require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../db");

async function createCEO() {
  const fullName = process.env.CEO_NAME || "EDUKA CEO";
  const email = process.env.CEO_EMAIL || "ceo@eduka.uz";
  const password = process.env.CEO_PASSWORD || "admin123";
  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO ceo_users (full_name,email,password_hash,role,status)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, updated_at=NOW()`,
    [fullName,email,passwordHash,"CEO","active"]
  );
  console.log("CEO user ready");
  console.log("Email:", email);
  console.log("Password:", password);
  await pool.end();
}
createCEO().catch((error)=>{ console.error(error); process.exit(1); });
