
const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { signToken, requireCeoAuth } = require("../middleware/auth");
const { sendTelegramMessage, telegramEscape } = require("../utils/telegram");
const { initDatabase } = require("../utils/init-db");

const router = express.Router();
const PROD = process.env.NODE_ENV === "production";

router.use((req, res, next) => {
  if (!PROD) return next();
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body === "object" && !Array.isArray(body)) {
      body = { ...body };
      delete body.realError;
      delete body.detail;
      delete body.candidateErrors;
      delete body.stack;
    }
    return originalJson(body);
  };
  return next();
});

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
    demoDate: r.demo_date,
    convertedCenterId: r.converted_center_id,
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
    students: Number(r.students_count || 0),
    branches: Number(r.branches_count || 1),
    monthlyPayment: Number(r.monthly_payment || 0),
    trialEndsAt: r.trial_ends_at,
    nextPaymentDate: r.next_payment_date,
    createdFromDemoId: r.created_from_demo_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    adminLogin: r.admin_login || null,
  };
}

function paymentMap(r) {
  return {
    id: r.id,
    centerId: r.center_id,
    center: r.center_name,
    tariff: r.tariff,
    amount: Number(r.amount || 0),
    status: r.status,
    paymentDate: r.payment_date,
    nextDate: r.next_payment_date,
    receiptUrl: r.receipt_url,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function slugify(s) {
  return String(s || "center")
    .toLowerCase()
    .replace(/['‘’"]/g, "")
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

if (process.env.NODE_ENV !== "production") {
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

router.get("/debug/init-db", async (req, res) => {
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

}

/* Landing demo form */
router.post("/demo-requests", async (req, res) => {
  try {
    const { name, center, centerName, phone, payment, paymentMode, source } = req.body;

    if (!name || !(center || centerName) || !phone) {
      return res.status(400).json({ ok: false, error: "Ism, markaz nomi va telefon raqam kerak" });
    }

    const result = await pool.query(
      `INSERT INTO demo_requests (name, center_name, phone, payment_mode, source)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [
        String(name).trim(),
        String(center || centerName).trim(),
        String(phone).trim(),
        String(payment || paymentMode || "Tanlanmagan").trim(),
        source || "landing",
      ]
    );

    const demo = demoMap(result.rows[0]);

    await pool.query(
      `INSERT INTO notifications (title, message, type) VALUES ($1,$2,$3)`,
      ["Yangi demo so‘rov", `${demo.name} — ${demo.center} (${demo.phone})`, "demo"]
    ).catch(() => {});

    await audit({ user: null, action: "Yangi demo so‘rov keldi", module: "demo_requests", details: demo, req });

    const telegramResult = await sendTelegramMessage(
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

/* Support form/chat first stage */
router.post("/support-requests", async (req, res) => {
  try {
    const { name, phone, question, message } = req.body;
    if (!name || !phone) return res.status(400).json({ ok: false, error: "Ism va telefon kerak" });

    const result = await pool.query(
      `INSERT INTO support_requests (name, phone, question, message)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, phone, question || null, message || null]
    );

    await pool.query(
      `INSERT INTO notifications (title, message, type) VALUES ($1,$2,$3)`,
      ["Yangi support so‘rov", `${name} — ${phone}`, "support"]
    ).catch(() => {});

    return res.status(201).json({ ok: true, support: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Support server error", realError: error.message });
  }
});

router.post("/ceo/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: "Email va parol kerak" });

    const result = await pool.query(
      `SELECT * FROM ceo_users WHERE email = $1 AND status = 'active' LIMIT 1`,
      [email]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ ok: false, error: "CEO user topilmadi" });

    let valid = false;
    try {
      valid = await bcrypt.compare(String(password || ""), user.password_hash);
    } catch {
      valid = false;
    }

    if (!valid) {
      const pgCheck = await pool.query(`SELECT crypt($1, password_hash) = password_hash AS ok FROM ceo_users WHERE email=$2`, [password, email]).catch(() => ({ rows: [{ ok: false }] }));
      valid = !!pgCheck.rows[0]?.ok;
    }

    if (!valid) return res.status(401).json({ ok: false, error: "Parol xato" });

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
      demoContacted,
      demoScheduled,
      demoConverted,
      centersTotal,
      centersTrial,
      centersActive,
      centersDebt,
      paymentsPaid,
      paymentsPending,
      recent,
      centersRecent,
      activity,
      notifications,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM demo_requests`),
      pool.query(`SELECT COUNT(*)::int AS count FROM demo_requests WHERE created_at::date = CURRENT_DATE`),
      pool.query(`SELECT COUNT(*)::int AS count FROM demo_requests WHERE status = 'Yangi'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM demo_requests WHERE status = 'Bog‘lanildi'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM demo_requests WHERE status = 'Demo belgilandi'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM demo_requests WHERE status = 'Mijoz bo‘ldi'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM centers`),
      pool.query(`SELECT COUNT(*)::int AS count FROM centers WHERE status = 'Trial'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM centers WHERE status = 'Active'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM centers WHERE status IN ('Qarzdor','Suspended','Expired')`),
      pool.query(`SELECT COALESCE(SUM(amount),0)::numeric AS total FROM platform_payments WHERE status = 'To‘landi'`),
      pool.query(`SELECT COALESCE(SUM(amount),0)::numeric AS total FROM platform_payments WHERE status IN ('Kutilmoqda','Qarzdor','Muddat o‘tgan')`),
      pool.query(`SELECT * FROM demo_requests ORDER BY created_at DESC LIMIT 8`),
      pool.query(`SELECT * FROM centers ORDER BY created_at DESC LIMIT 6`),
      pool.query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 12`),
      pool.query(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10`),
    ]);

    return res.json({
      ok: true,
      stats: {
        demoTotal: demoTotal.rows[0].count,
        demoToday: demoToday.rows[0].count,
        demoNew: demoNew.rows[0].count,
        demoContacted: demoContacted.rows[0].count,
        demoScheduled: demoScheduled.rows[0].count,
        demoConverted: demoConverted.rows[0].count,
        centersTotal: centersTotal.rows[0].count,
        centersTrial: centersTrial.rows[0].count,
        centersActive: centersActive.rows[0].count,
        centersDebt: centersDebt.rows[0].count,
        paymentsPaid: Number(paymentsPaid.rows[0].total || 0),
        paymentsPending: Number(paymentsPending.rows[0].total || 0),
      },
      recentDemoRequests: recent.rows.map(demoMap),
      recentCenters: centersRecent.rows.map(centerMap),
      activity: activity.rows,
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

router.patch("/ceo/demo-requests/:id", requireCeoAuth, async (req, res) => {
  try {
    const { status, manager, note, demoDate } = req.body;
    const result = await pool.query(
      `UPDATE demo_requests
       SET status = COALESCE($2,status),
           manager = COALESCE($3,manager),
           note = COALESCE($4,note),
           demo_date = COALESCE($5,demo_date),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [req.params.id, status || null, manager || null, note || null, demoDate || null]
    );

    if (!result.rows[0]) return res.status(404).json({ ok: false, error: "Demo request not found" });

    const demo = demoMap(result.rows[0]);
    await audit({ user: req.user, action: `Demo so‘rov yangilandi: ${demo.status}`, module: "demo_requests", details: { demoId: demo.id, status: demo.status }, req });
    return res.json({ ok: true, demo });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Demo update server error", realError: error.message });
  }
});

router.patch("/ceo/demo-requests/:id/status", requireCeoAuth, async (req, res) => {
  req.body.status = req.body.status || "Bog‘lanildi";
  return router.handle({ ...req, method: "PATCH", url: `/ceo/demo-requests/${req.params.id}` }, res);
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

    if (demo.converted_center_id) {
      const existing = await client.query(`SELECT * FROM centers WHERE id = $1`, [demo.converted_center_id]);
      await client.query("COMMIT");
      return res.json({ ok: true, center: centerMap(existing.rows[0]), alreadyConverted: true });
    }

    const settings = await client.query(`SELECT value FROM platform_settings WHERE key = 'default_trial_days' LIMIT 1`);
    const trialDays = Number(settings.rows[0]?.value || 7);

    const tariffName = req.body.tariff || demo.payment_mode || "Start";
    const tariff = await client.query(`SELECT * FROM tariffs WHERE name=$1 LIMIT 1`, [tariffName]);
    const selectedTariff = tariff.rows[0] || (await client.query(`SELECT * FROM tariffs WHERE name='Start' LIMIT 1`)).rows[0];

    const base = slugify(demo.center_name);
    let subdomain = base;
    let index = 1;

    while ((await client.query(`SELECT id FROM centers WHERE lower(subdomain)=lower($1) OR lower(subdomain)=lower($1 || '.eduka.uz') LIMIT 1`, [subdomain])).rows[0]) {
      subdomain = `${base}-${index}`;
      index += 1;
    }

    const centerResult = await client.query(
      `INSERT INTO centers (
        name, subdomain, owner_name, owner_phone, tariff, status,
        trial_ends_at, next_payment_date, monthly_payment, created_from_demo_id
       )
       VALUES ($1,$2,$3,$4,$5,$6,NOW()+($7 || ' days')::interval,NOW()+($7 || ' days')::interval,$8,$9)
       RETURNING *`,
      [
        demo.center_name,
        subdomain,
        demo.name,
        demo.phone,
        selectedTariff?.name || "Start",
        "Trial",
        trialDays,
        Number(selectedTariff?.monthly_price || 0),
        demo.id,
      ]
    );

    const center = centerResult.rows[0];

    
    const adminEmail = `admin+${base}@eduka.uz`;
    const adminPassword = require('node:crypto').randomBytes(18).toString('base64url');
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const centerUserResult = await client.query(
      `INSERT INTO center_users (center_id, full_name, email, password_hash, role, status)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (center_id, email)
       DO UPDATE SET password_hash=EXCLUDED.password_hash, status='active', updated_at=NOW()
       RETURNING id, full_name, email, role`,
      [center.id, demo.name || "Center Admin", adminEmail, passwordHash, "director", "active"]
    );

await client.query(
      `UPDATE demo_requests
       SET status = 'Mijoz bo‘ldi',
           converted_center_id = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [demo.id, center.id]
    );

    await client.query(
      `INSERT INTO notifications (title, message, type) VALUES ($1,$2,$3)`,
      ["Yangi o‘quv markaz yaratildi", `${center.name} — ${center.subdomain}`, "center"]
    );

    await client.query(
      `INSERT INTO audit_logs (user_id, user_name, action, module, details, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        req.user?.id || null,
        req.user?.fullName || req.user?.email || "CEO",
        "Demo so‘rov o‘quv markazga aylantirildi",
        "centers",
        JSON.stringify({ demoId: demo.id, centerId: center.id, centerName: center.name }),
        req.ip || null,
      ]
    );

    await client.query("COMMIT");

    await sendTelegramMessage(
      `<b>✅ EDUKA — Yangi markaz yaratildi</b>\n\n` +
      `<b>Markaz:</b> ${telegramEscape(center.name)}\n` +
      `<b>Domen:</b> https://${telegramEscape(center.subdomain)}.eduka.uz\n` +
      `<b>Login:</b> <code>${telegramEscape(centerUserResult.rows[0].email)}</code>\n` +
      `<b>Bir martalik parol:</b> <code>${telegramEscape(adminPassword)}</code>\n` +
      `<b>Egasi:</b> ${telegramEscape(center.owner_name)}\n` +
      `<b>Telefon:</b> ${telegramEscape(center.owner_phone)}\n` +
      `<b>Tarif:</b> ${telegramEscape(center.tariff)}\n` +
      `<b>Status:</b> Trial\n\n` +
      `<i>Parolni xavfsiz kanal orqali mijozga yetkazing. Keyin CEO panelida almashtirish mumkin.</i>`
    );

    return res.json({ ok: true, center: centerMap(center), centerAdmin: typeof centerUserResult !== "undefined" ? { email: centerUserResult.rows[0].email, password: adminPassword } : null, telegramDelivered: telegramResult?.ok === true });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ ok: false, error: "Convert server error", realError: error.message });
  } finally {
    client.release();
  }
});

require('../utils/ceo-center-actions').register(router,{pool,requireCeoAuth});

router.get("/ceo/centers", requireCeoAuth, async (req, res) => {
  try {
    const params = [];
    let where = "WHERE 1=1";
    if (req.query.status && req.query.status !== "all") {
      params.push(req.query.status);
      where += ` AND status = $${params.length}`;
    }
    if (req.query.q) {
      params.push(`%${req.query.q}%`);
      where += ` AND (name ILIKE $${params.length} OR subdomain ILIKE $${params.length} OR owner_phone ILIKE $${params.length})`;
    }
    const result = await pool.query(`SELECT centers.*,
      (SELECT email FROM center_users WHERE center_id=centers.id AND role IN ('owner','director') AND status='active' ORDER BY CASE WHEN role='owner' THEN 0 ELSE 1 END, created_at LIMIT 1) AS admin_login
      FROM centers ${where} ORDER BY created_at DESC`, params);
    return res.json({ ok: true, centers: result.rows.map(centerMap) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Centers server error", realError: error.message });
  }
});

router.post("/ceo/centers", requireCeoAuth, async (req, res) => {
 const db=await pool.connect();try {
 const b=req.body||{},name=String(b.name||'').trim();if(!name)return res.status(400).json({ok:false,error:'Markaz nomi kerak'});
 const slug=String(b.subdomain||slugify(name)).toLowerCase().replace(/\.eduka\.uz$/,'');
 if(!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug)||['www','api','ceo','admin','mail','app'].includes(slug))return res.status(400).json({ok:false,error:'Subdomen noto‘g‘ri yoki band'});
 await db.query('BEGIN');await db.query('LOCK TABLE centers IN SHARE ROW EXCLUSIVE MODE');
 if((await db.query("SELECT id FROM centers WHERE lower(subdomain) IN ($1,$2)",[slug,slug+'.eduka.uz'])).rows.length){await db.query('ROLLBACK');return res.status(409).json({ok:false,error:'Subdomen band'})}
 const tariff=(await db.query('SELECT * FROM tariffs WHERE name=$1 AND is_active=TRUE',[b.tariff||'Start'])).rows[0];if(!tariff){await db.query('ROLLBACK');return res.status(400).json({ok:false,error:'Faol tarifni tanlang'})}
 const days=Math.max(1,Math.min(90,Number(b.trialDays)||7));
 const center=(await db.query(`INSERT INTO centers(name,subdomain,owner_name,owner_phone,owner_email,tariff,status,students_count,branches_count,monthly_payment,trial_ends_at,next_payment_date)
 VALUES($1,$2,$3,$4,$5,$6,'Trial',0,0,$7,NOW()+$8*INTERVAL '1 day',NOW()+$8*INTERVAL '1 day') RETURNING *`,[name,slug,b.ownerName||name,b.ownerPhone||null,b.ownerEmail||null,tariff.name,tariff.monthly_price,days])).rows[0];
 const email=String(b.ownerEmail||('admin@'+slug+'.eduka.uz')).toLowerCase(),password=require('node:crypto').randomBytes(18).toString('base64url');
 await db.query("INSERT INTO center_users(center_id,full_name,email,password_hash,role,status) VALUES($1,$2,$3,$4,'director','active')",[center.id,b.ownerName||name,email,await bcrypt.hash(password,12)]);
 await db.query('COMMIT');res.set('Cache-Control','no-store');return res.status(201).json({ok:true,center:centerMap(center),centerAdmin:{email,password}});
 }catch(error){await db.query('ROLLBACK');return res.status(error.code==='23505'?409:500).json({ok:false,error:error.code==='23505'?'Subdomen yoki hisob band':'Markaz yaratilmadi'})}finally{db.release()}
});

router.patch("/ceo/centers/:id", requireCeoAuth, async (req, res) => {
  try {
    const b = req.body;
    const result = await pool.query(
      `UPDATE centers SET
        name = COALESCE($2,name),
        subdomain = COALESCE($3,subdomain),
        owner_name = COALESCE($4,owner_name),
        owner_phone = COALESCE($5,owner_phone),
        owner_email = COALESCE($6,owner_email),
        tariff = COALESCE($7,tariff),
        status = COALESCE($8,status),
        students_count = COALESCE($9,students_count),
        branches_count = COALESCE($10,branches_count),
        monthly_payment = COALESCE($11,monthly_payment),
        next_payment_date = COALESCE($12,next_payment_date),
        updated_at = NOW()
       WHERE id=$1 RETURNING *`,
      [
        req.params.id,
        b.name || null,
        b.subdomain || null,
        b.ownerName || null,
        b.ownerPhone || null,
        b.ownerEmail || null,
        b.tariff || null,
        b.status || null,
        b.students !== undefined ? Number(b.students) : null,
        b.branches !== undefined ? Number(b.branches) : null,
        b.monthlyPayment !== undefined ? Number(b.monthlyPayment) : null,
        b.nextPaymentDate || null,
      ]
    );

    if (!result.rows[0]) return res.status(404).json({ ok: false, error: "Center not found" });
    await audit({ user: req.user, action: "O‘quv markaz yangilandi", module: "centers", details: { centerId: req.params.id }, req });
    return res.json({ ok: true, center: centerMap(result.rows[0]) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Update center server error", realError: error.message });
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

router.post("/ceo/tariffs", requireCeoAuth, async (req, res) => {
  try {
    const b = req.body;
    const result = await pool.query(
      `INSERT INTO tariffs (name, student_limit, branch_limit, monthly_price, features, is_active)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (name) DO UPDATE SET
        student_limit=EXCLUDED.student_limit,
        branch_limit=EXCLUDED.branch_limit,
        monthly_price=EXCLUDED.monthly_price,
        features=EXCLUDED.features,
        is_active=EXCLUDED.is_active,
        updated_at=NOW()
       RETURNING *`,
      [b.name, Number(b.studentLimit || 0), Number(b.branchLimit || 1), Number(b.monthlyPrice || 0), JSON.stringify(b.features || []), b.isActive !== false]
    );
    await audit({ user: req.user, action: "Tarif saqlandi", module: "tariffs", details: { name: b.name }, req });
    return res.json({ ok: true, tariff: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Tariff save server error", realError: error.message });
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

    if (b.centerId && b.status === "To‘landi") {
      await pool.query(`UPDATE centers SET status='Active', next_payment_date=$2, updated_at=NOW() WHERE id=$1`, [b.centerId, b.nextDate || null]);
    }

    await audit({ user: req.user, action: "Platforma to‘lovi qo‘shildi", module: "payments", details: { paymentId: result.rows[0].id }, req });
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

    await audit({ user: req.user, action: "Platforma sozlamalari yangilandi", module: "settings", details: req.body, req });
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

router.get("/ceo/notifications", requireCeoAuth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`);
    return res.json({ ok: true, notifications: result.rows });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Notifications server error", realError: error.message });
  }
});

module.exports = router;
