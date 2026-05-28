const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { requireCenterAuth, signCenterToken } = require("../middleware/center-auth");

const router = express.Router();

function studentMap(r) {
  return {
    id: r.id,
    centerId: r.center_id,
    fullName: r.full_name,
    phone: r.phone,
    parentPhone: r.parent_phone,
    birthDate: r.birth_date,
    status: r.status,
    balance: Number(r.balance || 0),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function groupMap(r) {
  return {
    id: r.id,
    centerId: r.center_id,
    name: r.name,
    courseName: r.course_name,
    teacherName: r.teacher_name,
    scheduleText: r.schedule_text,
    monthlyPrice: Number(r.monthly_price || 0),
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function paymentMap(r) {
  return {
    id: r.id,
    centerId: r.center_id,
    studentId: r.student_id,
    studentName: r.student_name,
    amount: Number(r.amount || 0),
    paymentType: r.payment_type,
    status: r.status,
    note: r.note,
    paidAt: r.paid_at,
    createdAt: r.created_at,
  };
}

async function activity(centerId, userId, action, module, details = {}) {
  try {
    await pool.query(
      `INSERT INTO center_activity_logs (center_id, user_id, action, module, details)
       VALUES ($1,$2,$3,$4,$5)`,
      [centerId, userId || null, action, module, JSON.stringify(details)]
    );
  } catch (error) {
    console.error("Center activity error:", error.message);
  }
}

router.post("/login", async (req, res) => {
  try {
    const { email, password, subdomain } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: "Email va parol kerak" });

    const params = [email];
    let where = `cu.email=$1 AND cu.status='active'`;
    if (subdomain) {
      params.push(subdomain);
      where += ` AND c.subdomain=$2`;
    }

    const result = await pool.query(
      `SELECT cu.*, c.name AS center_name, c.subdomain, c.status AS center_status
       FROM center_users cu
       JOIN centers c ON c.id = cu.center_id
       WHERE ${where}
       LIMIT 1`,
      params
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ ok: false, error: "Login topilmadi" });
    if (["Suspended", "Expired", "Blocked"].includes(user.center_status)) {
      return res.status(403).json({ ok: false, error: "Markaz vaqtincha bloklangan" });
    }

    let valid = await bcrypt.compare(String(password || ""), user.password_hash).catch(() => false);
    if (!valid) {
      const pgCheck = await pool.query(
        `SELECT crypt($1, password_hash) = password_hash AS ok FROM center_users WHERE id=$2`,
        [password, user.id]
      ).catch(() => ({ rows: [{ ok: false }] }));
      valid = !!pgCheck.rows[0]?.ok;
    }

    if (!valid) return res.status(401).json({ ok: false, error: "Parol xato" });

    await pool.query(`UPDATE center_users SET last_login_at=NOW() WHERE id=$1`, [user.id]);

    const center = { id: user.center_id, name: user.center_name, subdomain: user.subdomain };
    const token = signCenterToken(user, center);

    return res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        centerId: user.center_id,
      },
      center,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Center login server error", realError: error.message });
  }
});

router.get("/me", requireCenterAuth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM centers WHERE id=$1 LIMIT 1`, [req.centerUser.centerId]);
    return res.json({ ok: true, user: req.centerUser, center: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Me server error", realError: error.message });
  }
});

router.get("/dashboard", requireCenterAuth, async (req, res) => {
  try {
    const centerId = req.centerUser.centerId;
    const [students, groups, payments, todayAttendance, activityRows] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM students WHERE center_id=$1 AND status='active'`, [centerId]),
      pool.query(`SELECT COUNT(*)::int AS count FROM study_groups WHERE center_id=$1 AND status='active'`, [centerId]),
      pool.query(`SELECT COALESCE(SUM(amount),0)::numeric AS total FROM center_payments WHERE center_id=$1 AND status='paid' AND paid_at >= date_trunc('month', NOW())`, [centerId]),
      pool.query(`SELECT COUNT(*)::int AS count FROM attendance WHERE center_id=$1 AND lesson_date=CURRENT_DATE`, [centerId]),
      pool.query(`SELECT * FROM center_activity_logs WHERE center_id=$1 ORDER BY created_at DESC LIMIT 12`, [centerId]),
    ]);

    return res.json({
      ok: true,
      stats: {
        students: students.rows[0].count,
        groups: groups.rows[0].count,
        monthlyPayments: Number(payments.rows[0].total || 0),
        todayAttendance: todayAttendance.rows[0].count,
      },
      activity: activityRows.rows,
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Dashboard server error", realError: error.message });
  }
});

router.get("/students", requireCenterAuth, async (req, res) => {
  try {
    const q = req.query.q ? `%${req.query.q}%` : null;
    const result = await pool.query(
      `SELECT * FROM students
       WHERE center_id=$1
       AND ($2::text IS NULL OR full_name ILIKE $2 OR phone ILIKE $2 OR parent_phone ILIKE $2)
       ORDER BY created_at DESC`,
      [req.centerUser.centerId, q]
    );
    return res.json({ ok: true, students: result.rows.map(studentMap) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Students server error", realError: error.message });
  }
});

router.post("/students", requireCenterAuth, async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.fullName) return res.status(400).json({ ok: false, error: "O‘quvchi ismi kerak" });
    const result = await pool.query(
      `INSERT INTO students (center_id, full_name, phone, parent_phone, birth_date, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.centerUser.centerId, b.fullName, b.phone || null, b.parentPhone || null, b.birthDate || null, b.status || "active"]
    );
    await activity(req.centerUser.centerId, req.centerUser.id, "O‘quvchi qo‘shildi", "students", { studentId: result.rows[0].id });
    return res.status(201).json({ ok: true, student: studentMap(result.rows[0]) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Create student server error", realError: error.message });
  }
});

router.patch("/students/:id", requireCenterAuth, async (req, res) => {
  try {
    const b = req.body || {};
    const result = await pool.query(
      `UPDATE students SET
        full_name=COALESCE($3,full_name),
        phone=COALESCE($4,phone),
        parent_phone=COALESCE($5,parent_phone),
        birth_date=COALESCE($6,birth_date),
        status=COALESCE($7,status),
        updated_at=NOW()
       WHERE id=$1 AND center_id=$2 RETURNING *`,
      [req.params.id, req.centerUser.centerId, b.fullName || null, b.phone || null, b.parentPhone || null, b.birthDate || null, b.status || null]
    );
    if (!result.rows[0]) return res.status(404).json({ ok: false, error: "Student not found" });
    await activity(req.centerUser.centerId, req.centerUser.id, "O‘quvchi yangilandi", "students", { studentId: req.params.id });
    return res.json({ ok: true, student: studentMap(result.rows[0]) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Update student server error", realError: error.message });
  }
});

router.get("/groups", requireCenterAuth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM study_groups WHERE center_id=$1 ORDER BY created_at DESC`, [req.centerUser.centerId]);
    return res.json({ ok: true, groups: result.rows.map(groupMap) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Groups server error", realError: error.message });
  }
});

router.post("/groups", requireCenterAuth, async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.name) return res.status(400).json({ ok: false, error: "Guruh nomi kerak" });
    const result = await pool.query(
      `INSERT INTO study_groups (center_id, name, course_name, teacher_name, schedule_text, monthly_price, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.centerUser.centerId, b.name, b.courseName || null, b.teacherName || null, b.scheduleText || null, Number(b.monthlyPrice || 0), b.status || "active"]
    );
    await activity(req.centerUser.centerId, req.centerUser.id, "Guruh yaratildi", "groups", { groupId: result.rows[0].id });
    return res.status(201).json({ ok: true, group: groupMap(result.rows[0]) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Create group server error", realError: error.message });
  }
});

router.post("/groups/:groupId/students", requireCenterAuth, async (req, res) => {
  try {
    const { studentId } = req.body || {};
    if (!studentId) return res.status(400).json({ ok: false, error: "studentId kerak" });
    const result = await pool.query(
      `INSERT INTO group_students (center_id, group_id, student_id)
       VALUES ($1,$2,$3)
       ON CONFLICT (group_id, student_id) DO UPDATE SET status='active'
       RETURNING *`,
      [req.centerUser.centerId, req.params.groupId, studentId]
    );
    await activity(req.centerUser.centerId, req.centerUser.id, "O‘quvchi guruhga qo‘shildi", "groups", { groupId: req.params.groupId, studentId });
    return res.json({ ok: true, groupStudent: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Add student to group server error", realError: error.message });
  }
});

router.get("/payments", requireCenterAuth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM center_payments WHERE center_id=$1 ORDER BY paid_at DESC`, [req.centerUser.centerId]);
    return res.json({ ok: true, payments: result.rows.map(paymentMap) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Payments server error", realError: error.message });
  }
});

router.post("/payments", requireCenterAuth, async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.amount) return res.status(400).json({ ok: false, error: "Summa kerak" });
    let studentName = b.studentName || null;
    if (b.studentId && !studentName) {
      const s = await pool.query(`SELECT full_name FROM students WHERE id=$1 AND center_id=$2`, [b.studentId, req.centerUser.centerId]);
      studentName = s.rows[0]?.full_name || null;
    }
    const result = await pool.query(
      `INSERT INTO center_payments (center_id, student_id, student_name, amount, payment_type, status, note, paid_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8,NOW())) RETURNING *`,
      [req.centerUser.centerId, b.studentId || null, studentName, Number(b.amount || 0), b.paymentType || "cash", b.status || "paid", b.note || null, b.paidAt || null]
    );
    await activity(req.centerUser.centerId, req.centerUser.id, "To‘lov qabul qilindi", "payments", { paymentId: result.rows[0].id, amount: result.rows[0].amount });
    return res.status(201).json({ ok: true, payment: paymentMap(result.rows[0]) });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Create payment server error", realError: error.message });
  }
});

router.get("/attendance", requireCenterAuth, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const result = await pool.query(
      `SELECT a.*, s.full_name AS student_name, g.name AS group_name
       FROM attendance a
       JOIN students s ON s.id=a.student_id
       JOIN study_groups g ON g.id=a.group_id
       WHERE a.center_id=$1 AND a.lesson_date=$2
       ORDER BY g.name, s.full_name`,
      [req.centerUser.centerId, date]
    );
    return res.json({ ok: true, attendance: result.rows });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Attendance server error", realError: error.message });
  }
});

router.post("/attendance", requireCenterAuth, async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.groupId || !b.studentId) return res.status(400).json({ ok: false, error: "groupId va studentId kerak" });
    const result = await pool.query(
      `INSERT INTO attendance (center_id, group_id, student_id, lesson_date, status, note)
       VALUES ($1,$2,$3,COALESCE($4,CURRENT_DATE),$5,$6)
       ON CONFLICT (group_id, student_id, lesson_date)
       DO UPDATE SET status=EXCLUDED.status, note=EXCLUDED.note
       RETURNING *`,
      [req.centerUser.centerId, b.groupId, b.studentId, b.lessonDate || null, b.status || "present", b.note || null]
    );
    await activity(req.centerUser.centerId, req.centerUser.id, "Davomat belgilandi", "attendance", { attendanceId: result.rows[0].id });
    return res.json({ ok: true, attendance: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Save attendance server error", realError: error.message });
  }
});

router.get("/activity", requireCenterAuth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM center_activity_logs WHERE center_id=$1 ORDER BY created_at DESC LIMIT 100`, [req.centerUser.centerId]);
    return res.json({ ok: true, activity: result.rows });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Activity server error", realError: error.message });
  }
});

module.exports = router;
