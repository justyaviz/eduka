
/* ===== EDUKA REAL CRM ENGINE PHASE 1 ===== */
const expressRealCrm = (() => {
  try { return require("express"); } catch (_) { return null; }
})();
const { Pool: RealCrmPool } = (() => {
  try { return require("pg"); } catch (_) { return { Pool: null }; }
})();

function getRealCrmDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRIVATE_URL || "";
}

function getRealCrmPool() {
  if (!RealCrmPool) return null;
  if (!global.__edukaRealCrmPool) {
    const connectionString = getRealCrmDatabaseUrl();
    if (!connectionString) return null;
    global.__edukaRealCrmPool = new RealCrmPool({
      connectionString,
      ssl: connectionString.includes("railway") && !connectionString.includes(".internal")
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
  }
  return global.__edukaRealCrmPool;
}

function realCrmSlug(value) {
  return String(value || "main")
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .split(".")[0]
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+|-+$/g, "") || "main";
}

function realCrmTenantFromReq(req) {
  const host = req.headers.host || "";
  if (req.headers["x-tenant-subdomain"]) return realCrmSlug(req.headers["x-tenant-subdomain"]);
  if (req.query && req.query.tenant) return realCrmSlug(req.query.tenant);
  const parts = host.split(".");
  if (parts.length >= 3 && parts[0] !== "www") return realCrmSlug(parts[0]);
  return "main";
}

async function realCrmQuery(sql, params = []) {
  const pool = getRealCrmPool();
  if (!pool) {
    const err = new Error("DATABASE_URL is missing or pg package unavailable");
    err.code = "DB_NOT_CONFIGURED";
    throw err;
  }
  return pool.query(sql, params);
}

async function ensureRealCrmSchema() {
  if (global.__edukaRealCrmSchemaReady) return true;

  await realCrmQuery(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS crm_centers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      subdomain TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL DEFAULT 'Main branch',
      phone TEXT,
      owner_name TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      tariff TEXT NOT NULL DEFAULT 'trial',
      trial_ends_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS crm_courses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant TEXT NOT NULL DEFAULT 'main',
      name TEXT NOT NULL,
      price NUMERIC(14,2) NOT NULL DEFAULT 0,
      duration_months INT NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS crm_teachers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant TEXT NOT NULL DEFAULT 'main',
      name TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      salary NUMERIC(14,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS crm_students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant TEXT NOT NULL DEFAULT 'main',
      name TEXT NOT NULL,
      phone TEXT,
      birth_date DATE,
      gender TEXT,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      balance NUMERIC(14,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS crm_groups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant TEXT NOT NULL DEFAULT 'main',
      name TEXT NOT NULL,
      course_id UUID REFERENCES crm_courses(id) ON DELETE SET NULL,
      teacher_id UUID REFERENCES crm_teachers(id) ON DELETE SET NULL,
      room TEXT,
      days TEXT,
      lesson_time TEXT,
      start_date DATE,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS crm_group_students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant TEXT NOT NULL DEFAULT 'main',
      group_id UUID NOT NULL REFERENCES crm_groups(id) ON DELETE CASCADE,
      student_id UUID NOT NULL REFERENCES crm_students(id) ON DELETE CASCADE,
      joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
      status TEXT NOT NULL DEFAULT 'active',
      UNIQUE(group_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS crm_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant TEXT NOT NULL DEFAULT 'main',
      student_id UUID REFERENCES crm_students(id) ON DELETE SET NULL,
      group_id UUID REFERENCES crm_groups(id) ON DELETE SET NULL,
      amount NUMERIC(14,2) NOT NULL DEFAULT 0,
      payment_type TEXT NOT NULL DEFAULT 'cash',
      note TEXT,
      paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS crm_expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant TEXT NOT NULL DEFAULT 'main',
      title TEXT NOT NULL,
      category TEXT,
      amount NUMERIC(14,2) NOT NULL DEFAULT 0,
      payment_type TEXT DEFAULT 'cash',
      note TEXT,
      spent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS crm_attendance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant TEXT NOT NULL DEFAULT 'main',
      student_id UUID REFERENCES crm_students(id) ON DELETE CASCADE,
      group_id UUID REFERENCES crm_groups(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'present',
      note TEXT,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(student_id, group_id, date)
    );

    CREATE TABLE IF NOT EXISTS crm_reminders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant TEXT NOT NULL DEFAULT 'main',
      title TEXT NOT NULL,
      note TEXT,
      due_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS crm_activity_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant TEXT NOT NULL DEFAULT 'main',
      action TEXT NOT NULL,
      entity TEXT,
      entity_id TEXT,
      payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_crm_students_tenant ON crm_students(tenant);
    CREATE INDEX IF NOT EXISTS idx_crm_teachers_tenant ON crm_teachers(tenant);
    CREATE INDEX IF NOT EXISTS idx_crm_groups_tenant ON crm_groups(tenant);
    CREATE INDEX IF NOT EXISTS idx_crm_payments_tenant ON crm_payments(tenant);
    CREATE INDEX IF NOT EXISTS idx_crm_expenses_tenant ON crm_expenses(tenant);
    CREATE INDEX IF NOT EXISTS idx_crm_attendance_tenant ON crm_attendance(tenant);
    CREATE INDEX IF NOT EXISTS idx_crm_reminders_tenant ON crm_reminders(tenant);
  `);

  global.__edukaRealCrmSchemaReady = true;
  return true;
}

async function logRealCrm(tenant, action, entity, entityId, payload) {
  try {
    await realCrmQuery(
      `INSERT INTO crm_activity_logs(tenant, action, entity, entity_id, payload) VALUES($1,$2,$3,$4,$5)`,
      [tenant, action, entity, entityId || null, payload ? JSON.stringify(payload) : null]
    );
  } catch (_) {}
}

function cleanText(v) {
  const s = String(v || "").trim();
  return s || null;
}

function num(v) {
  const n = Number(String(v || 0).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

async function ensureCenter(tenant, name) {
  await realCrmQuery(
    `INSERT INTO crm_centers(subdomain, name) VALUES($1,$2)
     ON CONFLICT(subdomain) DO NOTHING`,
    [tenant, name || tenant]
  );
}

function installRealCrmEngine(app) {
  if (!app || app.__realCrmEngineInstalled) return;
  app.__realCrmEngineInstalled = true;

  app.use(expressRealCrm.json({ limit: "5mb" }));

  app.get("/api/app/health", async (req, res) => {
    try {
      await ensureRealCrmSchema();
      res.json({ ok: true, dbReady: true, tenant: realCrmTenantFromReq(req), service: "eduka-real-crm" });
    } catch (e) {
      res.status(500).json({ ok: false, dbReady: false, error: e.message, code: e.code || null });
    }
  });

  app.post("/api/app/init", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      await ensureCenter(tenant, req.body?.centerName || tenant);

      const existingCourses = await realCrmQuery(`SELECT COUNT(*)::int AS c FROM crm_courses WHERE tenant=$1`, [tenant]);
      if (!existingCourses.rows[0].c) {
        await realCrmQuery(
          `INSERT INTO crm_courses(tenant, name, price) VALUES
           ($1,'Ingliz tili',600000),
           ($1,'Matematika',500000),
           ($1,'IELTS Preparation',800000)`,
          [tenant]
        );
      }

      res.json({ ok: true, tenant, message: "Real CRM schema initialized" });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message, code: e.code || null });
    }
  });

  app.get("/api/app/dashboard", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      const q = await realCrmQuery(`
        SELECT
          (SELECT COUNT(*)::int FROM crm_students WHERE tenant=$1 AND status='active') AS students,
          (SELECT COUNT(*)::int FROM crm_teachers WHERE tenant=$1 AND status='active') AS teachers,
          (SELECT COUNT(*)::int FROM crm_groups WHERE tenant=$1 AND status='active') AS groups,
          (SELECT COUNT(*)::int FROM crm_reminders WHERE tenant=$1 AND status='active') AS reminders,
          (SELECT COALESCE(SUM(amount),0)::numeric FROM crm_payments WHERE tenant=$1 AND paid_at >= date_trunc('month', now())) AS monthly_income,
          (SELECT COALESCE(SUM(amount),0)::numeric FROM crm_expenses WHERE tenant=$1 AND spent_at >= date_trunc('month', now())) AS monthly_expenses
      `, [tenant]);
      const row = q.rows[0];
      row.monthly_profit = Number(row.monthly_income || 0) - Number(row.monthly_expenses || 0);
      res.json({ ok: true, tenant, stats: row });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message, code: e.code || null });
    }
  });

  app.get("/api/app/courses", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      const q = await realCrmQuery(`SELECT id, name, price, duration_months AS "durationMonths", status, created_at AS "createdAt" FROM crm_courses WHERE tenant=$1 ORDER BY created_at DESC`, [tenant]);
      res.json({ ok: true, courses: q.rows });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post("/api/app/courses", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      await ensureCenter(tenant);
      const q = await realCrmQuery(
        `INSERT INTO crm_courses(tenant, name, price, duration_months, status) VALUES($1,$2,$3,$4,$5) RETURNING *`,
        [tenant, cleanText(req.body.name) || "Yangi kurs", num(req.body.price), Number(req.body.durationMonths || 1), cleanText(req.body.status) || "active"]
      );
      await logRealCrm(tenant, "create", "course", q.rows[0].id, req.body);
      res.json({ ok: true, course: q.rows[0] });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.get("/api/app/teachers", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      const q = await realCrmQuery(`SELECT id, name, phone, subject, salary, status, created_at AS "createdAt" FROM crm_teachers WHERE tenant=$1 ORDER BY created_at DESC`, [tenant]);
      res.json({ ok: true, teachers: q.rows });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post("/api/app/teachers", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      await ensureCenter(tenant);
      const q = await realCrmQuery(
        `INSERT INTO crm_teachers(tenant, name, phone, subject, salary, status) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
        [tenant, cleanText(req.body.name) || "Yangi o‘qituvchi", cleanText(req.body.phone), cleanText(req.body.subject), num(req.body.salary), "active"]
      );
      await logRealCrm(tenant, "create", "teacher", q.rows[0].id, req.body);
      res.json({ ok: true, teacher: q.rows[0] });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.get("/api/app/students", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      const q = await realCrmQuery(`
        SELECT s.id, s.name, s.phone, s.birth_date AS "birthDate", s.gender, s.note, s.status, s.balance, s.created_at AS "createdAt",
               COALESCE(string_agg(DISTINCT g.name, ', ') FILTER (WHERE g.name IS NOT NULL), '') AS "groupName"
        FROM crm_students s
        LEFT JOIN crm_group_students gs ON gs.student_id=s.id AND gs.status='active'
        LEFT JOIN crm_groups g ON g.id=gs.group_id
        WHERE s.tenant=$1
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `, [tenant]);
      res.json({ ok: true, students: q.rows });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post("/api/app/students", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      await ensureCenter(tenant);
      const q = await realCrmQuery(
        `INSERT INTO crm_students(tenant, name, phone, birth_date, gender, note, status, balance) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [tenant, cleanText(req.body.name) || "Yangi talaba", cleanText(req.body.phone), req.body.birthDate || null, cleanText(req.body.gender), cleanText(req.body.note), "active", num(req.body.balance)]
      );
      const student = q.rows[0];

      if (req.body.groupId) {
        await realCrmQuery(
          `INSERT INTO crm_group_students(tenant, group_id, student_id) VALUES($1,$2,$3) ON CONFLICT(group_id, student_id) DO NOTHING`,
          [tenant, req.body.groupId, student.id]
        );
      }
      await logRealCrm(tenant, "create", "student", student.id, req.body);
      res.json({ ok: true, student });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.get("/api/app/groups", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      const q = await realCrmQuery(`
        SELECT g.id, g.name, g.room, g.days, g.lesson_time AS "lessonTime", g.start_date AS "startDate", g.status,
               c.name AS course, c.price AS "coursePrice",
               t.name AS "teacherName",
               COUNT(gs.student_id)::int AS "studentCount",
               g.created_at AS "createdAt"
        FROM crm_groups g
        LEFT JOIN crm_courses c ON c.id=g.course_id
        LEFT JOIN crm_teachers t ON t.id=g.teacher_id
        LEFT JOIN crm_group_students gs ON gs.group_id=g.id AND gs.status='active'
        WHERE g.tenant=$1
        GROUP BY g.id, c.name, c.price, t.name
        ORDER BY g.created_at DESC
      `, [tenant]);
      res.json({ ok: true, groups: q.rows });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post("/api/app/groups", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      await ensureCenter(tenant);
      const q = await realCrmQuery(
        `INSERT INTO crm_groups(tenant, name, course_id, teacher_id, room, days, lesson_time, start_date, status)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [tenant, cleanText(req.body.name) || "Yangi guruh", req.body.courseId || null, req.body.teacherId || null, cleanText(req.body.room), cleanText(req.body.days), cleanText(req.body.lessonTime), req.body.startDate || null, "active"]
      );
      await logRealCrm(tenant, "create", "group", q.rows[0].id, req.body);
      res.json({ ok: true, group: q.rows[0] });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post("/api/app/group-students", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      await realCrmQuery(
        `INSERT INTO crm_group_students(tenant, group_id, student_id) VALUES($1,$2,$3) ON CONFLICT(group_id, student_id) DO UPDATE SET status='active'`,
        [tenant, req.body.groupId, req.body.studentId]
      );
      await logRealCrm(tenant, "attach", "group_student", req.body.groupId, req.body);
      res.json({ ok: true });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.get("/api/app/payments", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      const q = await realCrmQuery(`
        SELECT p.id, p.amount, p.payment_type AS "paymentType", p.note, p.paid_at AS "paidAt",
               s.name AS "studentName", g.name AS "groupName"
        FROM crm_payments p
        LEFT JOIN crm_students s ON s.id=p.student_id
        LEFT JOIN crm_groups g ON g.id=p.group_id
        WHERE p.tenant=$1
        ORDER BY p.paid_at DESC
      `, [tenant]);
      res.json({ ok: true, payments: q.rows });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post("/api/app/payments", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      const q = await realCrmQuery(
        `INSERT INTO crm_payments(tenant, student_id, group_id, amount, payment_type, note, created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [tenant, req.body.studentId || null, req.body.groupId || null, num(req.body.amount), cleanText(req.body.paymentType) || "cash", cleanText(req.body.note), cleanText(req.body.createdBy)]
      );
      if (req.body.studentId) {
        await realCrmQuery(`UPDATE crm_students SET balance = balance + $1, updated_at=NOW() WHERE id=$2 AND tenant=$3`, [num(req.body.amount), req.body.studentId, tenant]);
      }
      await logRealCrm(tenant, "create", "payment", q.rows[0].id, req.body);
      res.json({ ok: true, payment: q.rows[0] });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.get("/api/app/expenses", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      const q = await realCrmQuery(`SELECT id, title, category, amount, payment_type AS "paymentType", note, spent_at AS "spentAt" FROM crm_expenses WHERE tenant=$1 ORDER BY spent_at DESC`, [tenant]);
      res.json({ ok: true, expenses: q.rows });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post("/api/app/expenses", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      const q = await realCrmQuery(
        `INSERT INTO crm_expenses(tenant, title, category, amount, payment_type, note, created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [tenant, cleanText(req.body.title) || "Xarajat", cleanText(req.body.category), num(req.body.amount), cleanText(req.body.paymentType) || "cash", cleanText(req.body.note), cleanText(req.body.createdBy)]
      );
      await logRealCrm(tenant, "create", "expense", q.rows[0].id, req.body);
      res.json({ ok: true, expense: q.rows[0] });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.get("/api/app/finance/summary", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      const summary = await realCrmQuery(`
        SELECT
          (SELECT COALESCE(SUM(amount),0)::numeric FROM crm_payments WHERE tenant=$1) AS income,
          (SELECT COALESCE(SUM(amount),0)::numeric FROM crm_expenses WHERE tenant=$1) AS expenses
      `, [tenant]);
      const payments = await realCrmQuery(`
        SELECT p.id, p.amount, p.payment_type AS "paymentType", p.note, p.paid_at AS "paidAt",
               s.name AS "studentName", g.name AS "groupName"
        FROM crm_payments p
        LEFT JOIN crm_students s ON s.id=p.student_id
        LEFT JOIN crm_groups g ON g.id=p.group_id
        WHERE p.tenant=$1
        ORDER BY p.paid_at DESC
        LIMIT 50
      `, [tenant]);
      const income = Number(summary.rows[0].income || 0);
      const expenses = Number(summary.rows[0].expenses || 0);
      res.json({ ok: true, income, expenses, profit: income - expenses, payments: payments.rows });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.get("/api/app/debtors", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      const q = await realCrmQuery(`
        SELECT s.id, s.name, s.phone,
               COALESCE(SUM(c.price),0)::numeric AS "totalExpected",
               COALESCE((SELECT SUM(p.amount) FROM crm_payments p WHERE p.student_id=s.id),0)::numeric AS "totalPaid",
               (COALESCE(SUM(c.price),0) - COALESCE((SELECT SUM(p.amount) FROM crm_payments p WHERE p.student_id=s.id),0))::numeric AS debt
        FROM crm_students s
        LEFT JOIN crm_group_students gs ON gs.student_id=s.id AND gs.status='active'
        LEFT JOIN crm_groups g ON g.id=gs.group_id
        LEFT JOIN crm_courses c ON c.id=g.course_id
        WHERE s.tenant=$1
        GROUP BY s.id
        HAVING (COALESCE(SUM(c.price),0) - COALESCE((SELECT SUM(p.amount) FROM crm_payments p WHERE p.student_id=s.id),0)) > 0
        ORDER BY debt DESC
      `, [tenant]);
      res.json({ ok: true, debtors: q.rows });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.get("/api/app/attendance", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      const q = await realCrmQuery(`
        SELECT a.id, a.date, a.status, a.note, s.name AS "studentName", g.name AS "groupName"
        FROM crm_attendance a
        LEFT JOIN crm_students s ON s.id=a.student_id
        LEFT JOIN crm_groups g ON g.id=a.group_id
        WHERE a.tenant=$1
        ORDER BY a.date DESC, a.created_at DESC
      `, [tenant]);
      res.json({ ok: true, attendance: q.rows });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post("/api/app/attendance", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      const records = Array.isArray(req.body.records) ? req.body.records : [req.body];
      for (const r of records) {
        await realCrmQuery(
          `INSERT INTO crm_attendance(tenant, student_id, group_id, status, note, date)
           VALUES($1,$2,$3,$4,$5,$6)
           ON CONFLICT(student_id, group_id, date) DO UPDATE SET status=EXCLUDED.status, note=EXCLUDED.note`,
          [tenant, r.studentId, r.groupId, cleanText(r.status) || "present", cleanText(r.note), r.date || new Date().toISOString().slice(0,10)]
        );
      }
      await logRealCrm(tenant, "save", "attendance", null, req.body);
      res.json({ ok: true, saved: records.length });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.get("/api/app/reminders", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      const q = await realCrmQuery(`SELECT id, title, note, due_at AS "dueAt", status, created_at AS "createdAt" FROM crm_reminders WHERE tenant=$1 ORDER BY created_at DESC`, [tenant]);
      res.json({ ok: true, reminders: q.rows });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });

  app.post("/api/app/reminders", async (req, res) => {
    const tenant = realCrmTenantFromReq(req);
    try {
      await ensureRealCrmSchema();
      const q = await realCrmQuery(
        `INSERT INTO crm_reminders(tenant, title, note, due_at, status) VALUES($1,$2,$3,$4,$5) RETURNING *`,
        [tenant, cleanText(req.body.title) || "Eslatma", cleanText(req.body.note), req.body.dueAt || null, "active"]
      );
      await logRealCrm(tenant, "create", "reminder", q.rows[0].id, req.body);
      res.json({ ok: true, reminder: q.rows[0] });
    } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
  });
}

module.exports = { installRealCrmEngine, ensureRealCrmSchema };
