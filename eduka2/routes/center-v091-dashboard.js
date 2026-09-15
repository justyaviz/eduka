/* EDUKA CRM v0.9.1 — Edutizim-inspired dashboard data. Tenant CRM only; landing untouched. */
const express = require('express');
const pool = require('../db');
const { requireCenterAuth } = require('../middleware/center-auth');

const router = express.Router();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const n = (v) => Number(v || 0);

router.get('/dashboard-v091', requireCenterAuth, async (req, res) => {
  try {
    const centerId = req.centerUser.centerId;
    let branchId = req.query.branchId && req.query.branchId !== 'all' ? String(req.query.branchId) : null;
    if (branchId && !UUID_RE.test(branchId)) return res.status(400).json({ ok:false, error:'Filial ID noto‘g‘ri' });

    if (branchId) {
      const branch = await pool.query(
        `SELECT id,name FROM center_branches WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted' LIMIT 1`,
        [branchId, centerId]
      );
      if (!branch.rows[0]) return res.status(404).json({ ok:false, error:'Filial topilmadi' });
    }

    const studentBranchFilter = branchId
      ? `AND EXISTS (
           SELECT 1
             FROM group_students gs
             JOIN study_groups gg ON gg.id=gs.group_id AND gg.center_id=s.center_id
            WHERE gs.center_id=s.center_id
              AND gs.student_id=s.id
              AND COALESCE(gs.status,'active')='active'
              AND gg.branch_id=$2
              AND COALESCE(gg.status,'active')<>'deleted'
         )`
      : '';

    const groupBranchFilter = branchId ? 'AND g.branch_id=$2' : '';
    const paymentBranchJoin = branchId ? `JOIN study_groups pg ON pg.id=cp.group_id AND pg.center_id=cp.center_id AND pg.branch_id=$2` : '';

    const [studentStats, groupStats, leadStats, firstPayments, scheduleRows] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE COALESCE(s.status,'active')='active')::int AS active_students,
           COUNT(*) FILTER (WHERE COALESCE(s.status,'active')='active' AND s.created_at>=date_trunc('month',NOW()))::int AS new_students,
           COUNT(*) FILTER (WHERE COALESCE(s.balance,0)<0 AND COALESCE(s.status,'active')<>'deleted')::int AS debtors,
           COUNT(*) FILTER (WHERE lower(COALESCE(s.status,''))='frozen')::int AS frozen,
           COUNT(*) FILTER (WHERE lower(COALESCE(s.status,''))='archived')::int AS archives,
           COUNT(*) FILTER (
             WHERE lower(COALESCE(s.status,'')) IN ('inactive','archived','deleted')
               AND s.created_at>=date_trunc('month',NOW())
           )::int AS lost_new_students,
           COUNT(*) FILTER (
             WHERE lower(COALESCE(s.status,'')) IN ('inactive','archived','deleted')
               AND s.created_at<date_trunc('month',NOW())
               AND COALESCE(s.updated_at,s.created_at)>=date_trunc('month',NOW())
           )::int AS lost_active_students
         FROM students s
        WHERE s.center_id=$1 ${studentBranchFilter}`,
        branchId ? [centerId, branchId] : [centerId]
      ),
      pool.query(
        `SELECT COUNT(*) FILTER (WHERE COALESCE(g.status,'active')='active')::int AS groups
           FROM study_groups g
          WHERE g.center_id=$1 AND COALESCE(g.status,'active')<>'deleted' ${groupBranchFilter}`,
        branchId ? [centerId, branchId] : [centerId]
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE COALESCE(status,'LEADS')<>'deleted')::int AS orders,
           COUNT(*) FILTER (WHERE lower(COALESCE(status,''))='trial')::int AS first_lesson,
           COUNT(*) FILTER (WHERE lower(COALESCE(status,''))='closed')::int AS lost_orders
         FROM leads
        WHERE center_id=$1`,
        [centerId]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS first_payments
           FROM (
             SELECT cp.student_id, MIN(cp.paid_at) AS first_paid_at
               FROM center_payments cp
               ${paymentBranchJoin}
              WHERE cp.center_id=$1
                AND cp.student_id IS NOT NULL
                AND COALESCE(cp.status,'paid')='paid'
              GROUP BY cp.student_id
           ) x
          WHERE x.first_paid_at>=date_trunc('month',NOW())`,
        branchId ? [centerId, branchId] : [centerId]
      ),
      pool.query(
        `SELECT g.id,g.name,g.branch_id,g.days_text,g.lesson_time,g.lesson_duration,g.started_at,g.ended_at,
                c.id AS course_id,c.name AS course_name,
                t.id AS teacher_id,t.full_name AS teacher_name,
                r.id AS room_id,r.name AS room_name
           FROM study_groups g
           LEFT JOIN courses c ON c.id=g.course_id AND c.center_id=g.center_id
           LEFT JOIN teachers t ON t.id=g.teacher_id AND t.center_id=g.center_id
           LEFT JOIN rooms r ON r.id=g.room_id AND r.center_id=g.center_id
          WHERE g.center_id=$1
            AND COALESCE(g.status,'active')='active'
            ${groupBranchFilter}
          ORDER BY COALESCE(g.lesson_time,''),g.name`,
        branchId ? [centerId, branchId] : [centerId]
      ),
    ]);

    const s = studentStats.rows[0] || {};
    const g = groupStats.rows[0] || {};
    const l = leadStats.rows[0] || {};
    const fp = firstPayments.rows[0] || {};

    const metrics = {
      orders: n(l.orders),
      firstLesson: n(l.first_lesson),
      newStudents: n(s.new_students),
      activeStudents: n(s.active_students),
      lostOrders: n(l.lost_orders),
      lostNewStudents: n(s.lost_new_students),
      lostActiveStudents: n(s.lost_active_students),
      debtors: n(s.debtors),
      groups: n(g.groups),
      firstPayments: n(fp.first_payments),
      frozen: n(s.frozen),
      archives: n(s.archives),
    };

    const schedule = scheduleRows.rows.map(row => ({
      id: row.id,
      name: row.name,
      branchId: row.branch_id,
      daysText: row.days_text || '',
      lessonTime: row.lesson_time || '',
      lessonDuration: row.lesson_duration || '',
      startDate: row.started_at,
      endDate: row.ended_at,
      courseId: row.course_id,
      courseName: row.course_name || '',
      teacherId: row.teacher_id,
      teacherName: row.teacher_name || '',
      roomId: row.room_id,
      roomName: row.room_name || '',
    }));

    return res.json({
      ok:true,
      scope:{ centerId, branchId:branchId || 'all' },
      metrics,
      schedule,
      generatedAt:new Date().toISOString(),
    });
  } catch (error) {
    console.error('dashboard-v091 error:', error);
    return res.status(500).json({ ok:false, error:'Dashboard ma’lumotlari yuklanmadi' });
  }
});

module.exports = router;
