const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../db');

async function initDatabase() {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.POSTGRES_PRIVATE_URL) {
    return { ok: false, error: 'DATABASE_URL missing' };
  }

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((x) => x.endsWith('.sql')).sort();
  if (!files.length) return { ok: false, error: 'No migration files found' };

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    console.log(`✅ Migration applied: ${file}`);
  }

  const existing = await pool.query(`SELECT id, email FROM ceo_users ORDER BY created_at ASC LIMIT 1`);
  if (!existing.rows[0]) {
    const email = String(process.env.CEO_EMAIL || '').trim();
    const password = String(process.env.CEO_PASSWORD || '');
    const fullName = String(process.env.CEO_NAME || 'EDUKA CEO');

    if (!email || !password) {
      return {
        ok: true,
        warning: 'CEO user not created. Set CEO_EMAIL and CEO_PASSWORD once for first bootstrap.',
      };
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query(
      `INSERT INTO ceo_users (full_name, email, password_hash, role, status)
       VALUES ($1,$2,$3,'CEO','active')`,
      [fullName, email, passwordHash]
    );
    console.log('✅ First CEO user created:', email);
  }

  if (process.env.FORCE_CEO_PASSWORD_RESET === 'true' && process.env.CEO_EMAIL && process.env.CEO_PASSWORD) {
    const passwordHash = await bcrypt.hash(process.env.CEO_PASSWORD, 12);
    await pool.query(
      `UPDATE ceo_users SET password_hash=$1, updated_at=NOW() WHERE lower(email)=lower($2)`,
      [passwordHash, process.env.CEO_EMAIL]
    );
    console.log('⚠️ CEO password reset by FORCE_CEO_PASSWORD_RESET');
  }

  return { ok: true };
}

module.exports = { initDatabase };
