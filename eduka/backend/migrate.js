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


async function applyMigrationFiles(pool) {
  const migrationsDir = path.join(__dirname, "migrations");
  if (!fs.existsSync(migrationsDir)) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id BIGSERIAL PRIMARY KEY,
    filename TEXT NOT NULL UNIQUE,
    checksum TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();
  for (const file of files) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, "utf8");
    const checksum = crypto.createHash("sha256").update(sql).digest("hex");
    const exists = await pool.query("SELECT checksum FROM schema_migrations WHERE filename=$1", [file]);
    if (exists.rows[0]) continue;
    console.log(`Applying migration ${file}...`);
    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query("INSERT INTO schema_migrations (filename, checksum) VALUES ($1,$2)", [file, checksum]);
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }
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

    DELETE FROM student_app_settings a USING student_app_settings b
    WHERE a.ctid < b.ctid AND a.organization_id = b.organization_id;

    DELETE FROM student_app_modules a USING student_app_modules b
    WHERE a.id < b.id AND a.organization_id = b.organization_id AND a.key = b.key;

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
    CREATE UNIQUE INDEX IF NOT EXISTS student_app_settings_org_unique_exact_2101 ON student_app_settings (organization_id);
    CREATE UNIQUE INDEX IF NOT EXISTS organization_feature_flags_org_key_unique_exact_2001 ON organization_feature_flags (organization_id, feature_key);
    CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_org_unique_exact_2001 ON subscriptions (organization_id);
    CREATE UNIQUE INDEX IF NOT EXISTS organization_roles_org_name_unique_exact_2001 ON organization_roles (organization_id, name);
    CREATE UNIQUE INDEX IF NOT EXISTS organization_permissions_role_key_unique_exact_2001 ON organization_permissions (role_id, permission_key);
    CREATE UNIQUE INDEX IF NOT EXISTS admin_roles_name_unique_exact_2001 ON admin_roles (name);
    CREATE UNIQUE INDEX IF NOT EXISTS admin_permissions_role_key_unique_exact_2001 ON admin_permissions (role_id, permission_key);
    CREATE UNIQUE INDEX IF NOT EXISTS student_app_modules_org_key_unique_exact_2001 ON student_app_modules (organization_id, key);
    CREATE UNIQUE INDEX IF NOT EXISTS attendance_org_group_student_date_unique_exact_2001 ON attendance_records (organization_id, group_id, student_id, lesson_date);
    CREATE UNIQUE INDEX IF NOT EXISTS group_students_org_group_student_unique_exact_2001 ON group_students (organization_id, group_id, student_id);
    CREATE UNIQUE INDEX IF NOT EXISTS payments_org_receipt_no_unique_211 ON payments (organization_id, receipt_no) WHERE receipt_no IS NOT NULL;
  `);
}


async function applyEduka21Stability(pool) {
  console.log("Applying Eduka 21.0 stability schema...");
  await pool.query(`
    ALTER TABLE students ADD COLUMN IF NOT EXISTS gender TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS father_name TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_name TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS crystals INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    ALTER TABLE groups ADD COLUMN IF NOT EXISTS teacher_salary NUMERIC(14,2) NOT NULL DEFAULT 0;
    ALTER TABLE groups ADD COLUMN IF NOT EXISTS salary_type TEXT NOT NULL DEFAULT 'fixed';
    ALTER TABLE groups ADD COLUMN IF NOT EXISTS chat_id TEXT;
    ALTER TABLE groups ADD COLUMN IF NOT EXISTS delivery_mode TEXT NOT NULL DEFAULT 'offline';
    ALTER TABLE groups ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    ALTER TABLE teachers ADD COLUMN IF NOT EXISTS birth_date DATE;
    ALTER TABLE teachers ADD COLUMN IF NOT EXISTS gender TEXT;
    ALTER TABLE teachers ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE teachers ADD COLUMN IF NOT EXISTS note TEXT;
    ALTER TABLE teachers ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_no TEXT;
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_printed_at TIMESTAMPTZ;
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_status TEXT NOT NULL DEFAULT 'not_printed';
    ALTER TABLE courses ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
    ALTER TABLE salaries ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

    CREATE INDEX IF NOT EXISTS students_org_group_idx ON students(organization_id, group_id);
    CREATE INDEX IF NOT EXISTS students_org_status_idx ON students(organization_id, status);
    CREATE INDEX IF NOT EXISTS leads_org_status_idx ON leads(organization_id, status);
    CREATE INDEX IF NOT EXISTS payments_org_student_idx ON payments(organization_id, student_id);
    CREATE INDEX IF NOT EXISTS groups_org_teacher_idx ON groups(organization_id, teacher_id);
    CREATE INDEX IF NOT EXISTS attendance_org_student_date_idx ON attendance_records(organization_id, student_id, lesson_date);
    CREATE INDEX IF NOT EXISTS finance_transactions_org_type_date_idx ON finance_transactions(organization_id, type, transaction_date);
  `);
}



const studentApp21DefaultModules = [
  ["library", "Explore Library", "Reading, listening and grammar resources", "library", 1],
  ["support-teacher", "Support Teacher", "Ask questions and request help", "teacher", 2],
  ["translator", "Cambridge Translator", "Translate class words and phrases", "translate", 3],
  ["mock-club", "IELTS Mock Club", "Mock exam registration and results", "calendar", 4],
  ["idp-exam", "IDP IELTS Exam", "Exam dates and registration support", "exam", 5],
  ["university-support", "University Support", "Application and document help", "university", 6],
  ["letter-request", "Letter Request", "Certificate and recommendation letters", "letter", 7],
  ["mid-final", "Mid & Final Exams", "Midterm and final results", "exam", 8],
  ["events", "Cambridge Events", "Events and speaking club", "location", 9]
];

async function ensureStudentAppDefaults(pool, organizationId) {
  if (!organizationId) return;
  await pool.query(
    `INSERT INTO student_app_settings (organization_id, enabled, app_name, theme_primary, coins_enabled, crystals_enabled, rating_enabled, library_enabled, exams_enabled)
     VALUES ($1, TRUE, 'Aloo Academy Student App', '#13A8FF', TRUE, TRUE, TRUE, TRUE, TRUE)
     ON CONFLICT (organization_id) DO UPDATE SET enabled=TRUE, app_name=EXCLUDED.app_name, theme_primary=EXCLUDED.theme_primary`,
    [organizationId]
  );
  for (const [key, title, description, icon, sortOrder] of studentApp21DefaultModules) {
    await pool.query(
      `INSERT INTO student_app_modules (organization_id, key, title, description, icon, sort_order, enabled)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE)
       ON CONFLICT (organization_id, key) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order, enabled=TRUE`,
      [organizationId, key, title, description, icon, sortOrder]
    );
  }
}

async function seedStudentApp21Demo(pool) {
  console.log("Seeding Eduka 21.0 Student App demo...");
  const demoPhone = "+998931949200";
  const normalizedPhone = demoPhone.replace(/\D/g, "");
  const orgResult = await pool.query(
    `INSERT INTO organizations (name, slug, subdomain, owner_name, phone, email, status, subscription_status, plan, monthly_payment, setup_completed_at)
     VALUES ('ALOO ACADEMY', 'aloo-academy', 'aloo-academy', 'Just Yaviz', '+998931949200', 'student@app.demo', 'active', 'active', 'Pro', 0, NOW())
     ON CONFLICT (slug) DO UPDATE SET
       name=EXCLUDED.name,
       subdomain=EXCLUDED.subdomain,
       status='active',
       subscription_status='active',
       setup_completed_at=COALESCE(organizations.setup_completed_at, NOW())
     RETURNING id`,
  );
  const organizationId = orgResult.rows[0].id;

  await pool.query(
    `INSERT INTO courses (organization_id, name, description, price, duration, level, lesson_type, status)
     VALUES ($1, 'Pre-Intermediate', 'Cambridge style English course', 700000, '12 weeks', 'Pre-Intermediate', 'group', 'active')
     ON CONFLICT DO NOTHING`,
    [organizationId]
  );

  const teacherResult = await pool.query(
    `INSERT INTO teachers (organization_id, full_name, phone, email, course_name, subjects, groups, login_enabled, status, salary_type, salary_rate)
     VALUES ($1, 'Support Teacher', '+998901111111', 'support@alooacademy.uz', 'Pre-Intermediate', 'English, IELTS', 'Elementary 10:30', TRUE, 'active', 'fixed', 0)
     RETURNING id`,
    [organizationId]
  ).catch(async () => {
    return pool.query("SELECT id FROM teachers WHERE organization_id=$1 ORDER BY id DESC LIMIT 1", [organizationId]);
  });
  const teacherId = teacherResult.rows[0]?.id || null;

  const groupResult = await pool.query(
    `INSERT INTO groups (organization_id, name, course_name, status, teacher_id, teacher_name, days, start_time, end_time, monthly_price, starts_at, room, teacher_salary, salary_type, delivery_mode)
     VALUES ($1, 'Elementary 10:30', 'Pre-Intermediate', 'active', $2, 'Support Teacher', 'Mon, Wed, Fri', '10:30', '12:00', 700000, CURRENT_DATE, 'Room A', 0, 'fixed', 'offline')
     RETURNING id`,
    [organizationId, teacherId]
  ).catch(async () => {
    return pool.query("SELECT id FROM groups WHERE organization_id=$1 AND name='Elementary 10:30' ORDER BY id DESC LIMIT 1", [organizationId]);
  });
  const groupId = groupResult.rows[0]?.id || null;

  const studentResult = await pool.query(
    `INSERT INTO students (organization_id, full_name, phone, parent_phone, course_name, group_id, payment_type, discount, status, balance, note, student_app_enabled, student_app_blocked, app_password_hash, app_password_set_at, crystals, coins, referral_code)
     VALUES ($1, 'Harvey Specter', $2, '+998901234567', 'Pre-Intermediate', $3, 'monthly', 0, 'active', 0, 'Eduka 21.0 demo student', TRUE, FALSE, $4, NOW(), 245000, 3700, 'HARVEY21')
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [organizationId, demoPhone, groupId, hashPassword("8888")]
  ).catch(async () => {
    await pool.query(
      `UPDATE students SET full_name='Harvey Specter', course_name='Pre-Intermediate', group_id=$3, student_app_enabled=TRUE, student_app_blocked=FALSE, app_password_hash=$4, app_password_set_at=NOW(), crystals=245000, coins=3700, referral_code='HARVEY21'
       WHERE organization_id=$1 AND regexp_replace(COALESCE(phone,''), '\D', '', 'g')=$2`,
      [organizationId, normalizedPhone, groupId, hashPassword("8888")]
    );
    return pool.query("SELECT id FROM students WHERE organization_id=$1 AND regexp_replace(COALESCE(phone,''), '\\D', '', 'g')=$2 LIMIT 1", [organizationId, normalizedPhone]);
  });
  const studentId = studentResult.rows[0]?.id;
  if (studentId && groupId) {
    await pool.query(
      `INSERT INTO group_students (organization_id, group_id, student_id, status)
       VALUES ($1,$2,$3,'active')
       ON CONFLICT (organization_id, group_id, student_id) DO UPDATE SET status='active'`,
      [organizationId, groupId, studentId]
    );
  }

  await pool.query(
    `INSERT INTO payments (organization_id, student_id, group_id, payment_month, due_amount, amount, discount, status, payment_type, note, paid_at)
     VALUES ($1,$2,$3,'May 2026',700000,700000,0,'paid','Naqd pul','Demo payment',NOW())
     ON CONFLICT DO NOTHING`,
    [organizationId, studentId, groupId]
  );

  await pool.query(
    `INSERT INTO attendance_records (organization_id, group_id, student_id, lesson_date, status, note)
     VALUES ($1,$2,$3,CURRENT_DATE,'present','Demo attendance')
     ON CONFLICT (organization_id, group_id, student_id, lesson_date) DO UPDATE SET status='present'`,
    [organizationId, groupId, studentId]
  );

  await pool.query(
    `INSERT INTO student_exam_results (organization_id, student_id, title, score, max_score, grade, exam_date, status)
     VALUES ($1,$2,'Weekly Test',97,100,'A+',CURRENT_DATE,'published')
     ON CONFLICT DO NOTHING`,
    [organizationId, studentId]
  );

  await pool.query(
    `INSERT INTO student_library_items (organization_id, title, type, description, level, status)
     VALUES
       ($1,'Beginner Resources','book','Starter reading pack','Beginner','published'),
       ($1,'Elementary Resources','book','Elementary grammar pack','Elementary','published'),
       ($1,'Pre-Intermediate Resources','book','Pre-Intermediate reading and listening','Pre-Intermediate','published'),
       ($1,'Intermediate Resources','book','Intermediate vocabulary pack','Intermediate','published')
     ON CONFLICT DO NOTHING`,
    [organizationId]
  );

  await pool.query(
    `INSERT INTO student_dictionary_words (organization_id, word, translation, pronunciation, example, level, category, status)
     VALUES
       ($1,'improve','yaxshilamoq','/ɪmˈpruːv/','I improve my English every day.','Pre-Intermediate','verb','published'),
       ($1,'support','qo‘llab-quvvatlash','/səˈpɔːrt/','Support teacher helps students.','Elementary','noun','published')
     ON CONFLICT DO NOTHING`,
    [organizationId]
  );

  await pool.query(
    `INSERT INTO student_events (organization_id, title, description, event_date, event_time, registration_enabled, status)
     VALUES ($1,'Cambridge Speaking Event','Speaking practice with support teacher',CURRENT_DATE + INTERVAL '3 days','15:00',TRUE,'active')
     ON CONFLICT DO NOTHING`,
    [organizationId]
  );

  await pool.query(
    `INSERT INTO student_tasks (organization_id, student_id, group_id, title, description, due_date, max_score, score, status)
     VALUES
       ($1,$2,$3,'Homework','Done 0 of 2 parts',CURRENT_DATE + INTERVAL '1 day',100,55,'assigned'),
       ($1,$2,$3,'Extra Tasks','Done 0 of 4 parts',CURRENT_DATE + INTERVAL '2 day',100,43,'assigned'),
       ($1,$2,$3,'Fun Box','Done 1 of 4 parts',CURRENT_DATE + INTERVAL '3 day',100,25,'assigned')
     ON CONFLICT DO NOTHING`,
    [organizationId, studentId, groupId]
  );

  await ensureStudentAppDefaults(pool, organizationId);
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
    await applyEduka21Stability(pool);
    await applyMigrationFiles(pool);

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
       VALUES (NULL, 'Eduka Platform Owner', $1, $2, $3, 'super_admin', $4, TRUE, FALSE, '["*"]'::jsonb, '{"seed":"migrate-21.0"}'::jsonb)
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

    try {
      await seedStudentApp21Demo(pool);
    } catch (seedError) {
      console.warn("Optional Student App 21.0 demo seed skipped:", seedError.message);
      console.warn("Migration will continue so the production server can start.");
    }

    console.log("Eduka 21.8 migration completed.");
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
