const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { signToken, requireCeoAuth } = require("../middleware/auth");
const { sendTelegramMessage } = require("../utils/telegram");
const { initDatabase } = require("../utils/init-db");

const router = express.Router();

function demoMap(r) {
  return {
    id: r.id,
    name: r.name,
    center: r.center_name,
    phone: r.phone,
    payment: r.payment_mode,
    source: r.source,
    status: r.status,
    manager: r.manager,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function centerMap(r) {
  return {
    id: r.id,
    name: r.name,
    subdomain: r.subdomain,
    ownerName: r.owner_name,
    ownerPhone: r.owner_phone,
    ownerEmail: r.owner_email,
    tariff: r.tariff,
    status: r.status,
    students: r.students_count,
    branches: r.branches_count,
    monthlyPayment: r.monthly_payment,
    trialEndsAt: r.trial_ends_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function paymentMap(r) {
  return {
    id: r.id,
    centerId: r.center_id,
    center: r.center_name,
    tariff: r.tariff,
    amount: r.amount,
    status: r.status,
    paymentDate: r.payment_date,
    nextDate: r.next_payment_date,
    receiptUrl: r.receipt_url,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function makeSubdomain(s) {
  return String(s || "center")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || `center-${Date.now()}`;
}

async function audit({ user, action, module, details, req }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, module, details, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        user?.id || null,
        user?.fullName || user?.email || "System",
        action,
        module,
        JSON.stringify(details || {}),
        req?.ip || null,
      ]
    );
  } catch (error) {
    console.error("Audit error:", error.message);
  }
}

router.get("/debug/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    const users = await pool.query("SELECT email, role, status FROM ceo_users ORDER BY created_at DESC LIMIT 5").catch((e) => ({ error: e.message, rows: [] }));

    return res.json({
      ok: true,
      postgres: true,
      active: pool.getActiveInfo ? pool.getActiveInfo() : null,
      candidates: pool.getCandidatesInfo ? pool.getCandidatesInfo() : [],
      now: result.rows[0].now,
      ceoUsers: users.rows,
      ceoUsersError: users.error || null,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "DB debug failed",
      active: pool.getActiveInfo ? pool.getActiveInfo() : null,
      candidates: pool.getCandidatesInfo ? pool.getCandidatesInfo() : [],
      realError: error.message,
      code: error.code || null,
      detail: error.detail || null,
      candidateErrors: error.candidates || null,
    });
  }
});

router.post("/debug/init-db", async (req, res) => {
  try {
    const result = await initDatabase();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "init-db failed",
      realError: error.message,
      code: error.code || null,
      detail: error.detail || null,
    });
  }
});

router.post("/demo-requests", async (req, res) => {
  try {
    const { name, center, centerName, phone, payment, paymentMode, password, source } = req.body;

    if (!name || !(center || centerName) || !phone) {
      return res.status(400).json({ ok: false, error: "name, center and phone are required" });
    }

    const result = await pool.query(
      `INSERT INTO demo_requests (name, center_name, phone, payment_mode, password_text, source)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        String(name).trim(),
        String(center || centerName).trim(),
        String(phone).trim(),
        String(payment || paymentMode || "Tanlanmagan").trim(),
        password ? String(password) : null,
        source || "landing",
      ]
    );

    const demo = demoMap(result.rows[0]);

    await pool.query(
      `INSERT INTO notifications (title, message, type) VALUES ($1,$2,$3)`,
      ["Yangi demo so‘rov", `${demo.name} — ${demo.center} (${demo.phone})`, "demo"]
    ).catch(() => {});

    await sendTelegramMessage(
      `<b>🆕 EDUKA — Yangi demo so‘rov</b>\n\n` +
      `<b>Ism:</b> ${demo.name}\n` +
      `<b>Markaz:</b> ${demo.center}\n` +
      `<b>Telefon:</b> ${demo.phone}\n` +
      `<b>To‘lov rejimi:</b> ${demo.payment || "-"}\n` +
      `<b>Manba:</b> ${demo.source}`
    );

    return res.status(201).json({ ok: true, demo });
  } catch (error) {
    console.error("Create demo request error:", error);
    return res.status(500).json({
      ok: false,
      error: "Demo request server error",
      realError: error.message,
      code: error.code || null,
      detail: error.detail || null,
    });
  }
});

router.post("/ceo/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        ok: false,
        error: "DATABASE_URL missing",
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Email va parol kerak",
      });
    }

    const result = await pool.query(
      `SELECT * FROM ceo_users WHERE email = $1 AND status = 'active' LIMIT 1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "CEO user topilmadi. /api/debug/init-db ni ishga tushiring yoki redeploy qiling.",
      });
    }

    if (!user.password_hash) {
      return res.status(500).json({
        ok: false,
        error: "CEO password_hash yo‘q",
      });
    }

    const valid = await bcrypt.compare(String(password || ""), user.password_hash);

    if (!valid) {
      return res.status(401).json({
        ok: false,
        error: "Parol xato",
      });
    }

    await pool.query(`UPDATE ceo_users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

    await audit({
      user: { id: user.id, fullName: user.full_name, email: user.email },
      action: "CEO login qildi",
      module: "auth",
      req,
    });

    return res.json({
      ok: true,
      token: signToken(user),
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("CEO LOGIN ERROR:", error);
    return res.status(500).json({
      ok: false,
      error: "CEO login server error",
      realError: error.message,
      code: error.code || null,
      detail: error.detail || null,
    });
  }
});

router.get("/ceo/me", requireCeoAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

router.get("/ceo/dashboard", requireCeoAuth, async (req, res) => {
  try {
    const [
      demoTotal,
      demoToday,
      demoNew,
      centersTotal,
      centersActive,
      paymentsPaid,
      paymentsDebt,
      recent,
      notifications,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM demo_requests`),
      pool.query(`SELECT COUNT(*)::int AS count FROM demo_requests WHERE created_at::date = CURRENT_DATE`),
      pool.query(`SELECT COUNT(*)::int AS count FROM demo_requests WHERE status = 'Yangi'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM centers`),
      pool.query(`SELECT COUNT(*)::int AS count FROM centers WHERE status = 'Active'`),
      pool.query(`SELECT COALESCE(SUM(amount),0)::numeric AS total FROM platform_payments WHERE status = 'To‘landi'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM platform_payments WHERE status IN ('Qarzdor','Muddat o‘tgan')`),
      pool.query(`SELECT * FROM demo_requests ORDER BY created_at DESC LIMIT 5`),
      pool.query(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10`),
    ]);

    return res.json({
      ok: true,
      stats: {
        demoTotal: demoTotal.rows[0].count,
        demoToday: demoToday.rows[0].count,
        demoNew: demoNew.rows[0].count,
        centersTotal: centersTotal.rows[0].count,
        centersActive: centersActive.rows[0].count,
        paymentsPaid: Number(paymentsPaid.rows[0].total || 0),
        paymentsDebt: paymentsDebt.rows[0].count,
      },
      recentDemoRequests: recent.rows.map(demoMap),
      notifications: notifications.rows,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Dashboard server error", realError: error.message });
  }
});

router.get("/ceo/demo-requests", requireCeoAuth, async (req, res) => {
  try {
    const params = [];
    let where = "WHERE 1=1";

    if (req.query.status && req.query.status !== "all") {
      params.push(req.query.status);
      where += ` AND status = $${params.length}`;
    }

    if (req.query.q) {
      params.push(`%${req.query.q}%`);
      where += ` AND (name ILIKE $${params.length} OR center_name ILIKE $${params.length} OR phone ILIKE $${params.length})`;
    }

    const result = await pool.query(`SELECT * FROM demo_requests ${where} ORDER BY created_at DESC`, params);
    return res.json({ ok: true, demoRequests: result.rows.map(demoMap) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Demo list server error", realError: error.message });
  }
});

router.patch("/ceo/demo-requests/:id/status", requireCeoAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE demo_requests
       SET status = COALESCE($2,status),
           manager = COALESCE($3,manager),
           note = COALESCE($4,note),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id, req.body.status || null, req.body.manager || null, req.body.note || null]
    );

    if (!result.rows[0]) return res.status(404).json({ ok: false, error: "Demo request not found" });

    const demo = demoMap(result.rows[0]);
    await audit({ user: req.user, action: `Demo statusi ${demo.status} qilindi`, module: "demo_requests", details: { demoId: demo.id }, req });
    return res.json({ ok: true, demo });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Demo status server error", realError: error.message });
  }
});

router.post("/ceo/demo-requests/:id/convert-to-center", requireCeoAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const demoResult = await client.query(`SELECT * FROM demo_requests WHERE id = $1 FOR UPDATE`, [req.params.id]);
    const demo = demoResult.rows[0];

    if (!demo) {
      await client.query("ROLLBACK");
      return res.status(404).json({ ok: false, error: "Demo request not found" });
    }

    const settings = await client.query(`SELECT value FROM platform_settings WHERE key = 'default_trial_days' LIMIT 1`);
    const trialDays = Number(settings.rows[0]?.value || 7);

    const base = makeSubdomain(demo.center_name);
    let subdomain = `${base}.eduka.uz`;
    let index = 1;

    while ((await client.query(`SELECT id FROM centers WHERE subdomain = $1 LIMIT 1`, [subdomain])).rows[0]) {
      subdomain = `${base}-${index}.eduka.uz`;
      index += 1;
    }

    const centerResult = await client.query(
      `INSERT INTO centers (name,subdomain,owner_name,owner_phone,tariff,status,trial_ends_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW()+($7 || ' days')::interval)
       RETURNING *`,
      [demo.center_name, subdomain, demo.name, demo.phone, "Start", "Trial", trialDays]
    );

    await client.query(`UPDATE demo_requests SET status = 'Mijoz bo‘ldi', updated_at = NOW() WHERE id = $1`, [demo.id]);

    await client.query("COMMIT");

    return res.json({ ok: true, center: centerMap(centerResult.rows[0]) });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ ok: false, error: "Convert server error", realError: error.message });
  } finally {
    client.release();
  }
});

router.get("/ceo/centers", requireCeoAuth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM centers ORDER BY created_at DESC`);
    return res.json({ ok: true, centers: result.rows.map(centerMap) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Centers server error", realError: error.message });
  }
});

router.post("/ceo/centers", requireCeoAuth, async (req, res) => {
  try {
    const b = req.body;
    const result = await pool.query(
      `INSERT INTO centers (name,subdomain,owner_name,owner_phone,owner_email,tariff,status,students_count,branches_count,monthly_payment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        b.name,
        b.subdomain || `${makeSubdomain(b.name)}.eduka.uz`,
        b.ownerName || null,
        b.ownerPhone || null,
        b.ownerEmail || null,
        b.tariff || "Start",
        b.status || "Trial",
        Number(b.students || 0),
        Number(b.branches || 1),
        Number(b.monthlyPayment || 0),
      ]
    );

    return res.status(201).json({ ok: true, center: centerMap(result.rows[0]) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Create center server error", realError: error.message });
  }
});

router.get("/ceo/tariffs", requireCeoAuth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM tariffs ORDER BY monthly_price ASC`);
    return res.json({ ok: true, tariffs: result.rows });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Tariffs server error", realError: error.message });
  }
});

router.get("/ceo/payments", requireCeoAuth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM platform_payments ORDER BY created_at DESC`);
    return res.json({ ok: true, payments: result.rows.map(paymentMap) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Payments server error", realError: error.message });
  }
});

router.post("/ceo/payments", requireCeoAuth, async (req, res) => {
  try {
    const b = req.body;
    const result = await pool.query(
      `INSERT INTO platform_payments (center_id,center_name,tariff,amount,status,payment_date,next_payment_date,note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [b.centerId || null, b.center || null, b.tariff || null, Number(b.amount || 0), b.status || "Kutilmoqda", b.paymentDate || null, b.nextDate || null, b.note || null]
    );

    return res.status(201).json({ ok: true, payment: paymentMap(result.rows[0]) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Create payment server error", realError: error.message });
  }
});

router.get("/ceo/settings", requireCeoAuth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT key,value FROM platform_settings ORDER BY key ASC`);
    const settings = {};
    result.rows.forEach((r) => { settings[r.key] = r.value; });
    return res.json({ ok: true, settings });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Settings server error", realError: error.message });
  }
});

router.patch("/ceo/settings", requireCeoAuth, async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body || {})) {
      await pool.query(
        `INSERT INTO platform_settings (key,value)
         VALUES ($1,$2)
         ON CONFLICT (key)
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, String(value)]
      );
    }

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Update settings server error", realError: error.message });
  }
});

router.get("/ceo/audit", requireCeoAuth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`);
    return res.json({ ok: true, auditLogs: result.rows });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Audit server error", realError: error.message });
  }
});

module.exports = router;
