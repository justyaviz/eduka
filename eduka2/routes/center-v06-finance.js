const express = require('express');
const pool = require('../db');
const { requireCenterAuth } = require('../middleware/center-auth');

const router = express.Router();
const PROD = process.env.NODE_ENV === 'production';

function num(v) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0; }
function err(res, status, message, error) {
  return res.status(status).json({
    ok: false,
    error: message,
    ...(PROD || !error ? {} : { realError: error.message, code: error.code || null }),
  });
}
function isoDay(v) {
  const s = String(v || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : s;
}
function defaultRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${d}` };
}

router.get('/finance-v2', requireCenterAuth, async (req, res) => {
  try {
    const defaults = defaultRange();
    const from = isoDay(req.query.from) || defaults.from;
    const to = isoDay(req.query.to) || defaults.to;
    if (from > to) return err(res, 400, 'Boshlanish sanasi tugash sanasidan katta bo‘lishi mumkin emas');

    const centerId = req.centerUser.centerId;
    const [incomeQ, expenseQ, paymentsQ, expensesQ, methodsQ, categoriesQ] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(amount),0)::numeric AS total, COUNT(*)::int AS count
           FROM center_payments
          WHERE center_id=$1 AND status='paid'
            AND paid_at >= $2::date AND paid_at < ($3::date + INTERVAL '1 day')`,
        [centerId, from, to]
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount),0)::numeric AS total, COUNT(*)::int AS count
           FROM center_expenses
          WHERE center_id=$1
            AND spent_at >= $2::date AND spent_at < ($3::date + INTERVAL '1 day')`,
        [centerId, from, to]
      ),
      pool.query(
        `SELECT p.*, g.name AS group_name
           FROM center_payments p
           LEFT JOIN study_groups g ON g.id=p.group_id AND g.center_id=p.center_id
          WHERE p.center_id=$1
            AND p.paid_at >= $2::date AND p.paid_at < ($3::date + INTERVAL '1 day')
          ORDER BY p.paid_at DESC, p.created_at DESC
          LIMIT 500`,
        [centerId, from, to]
      ),
      pool.query(
        `SELECT * FROM center_expenses
          WHERE center_id=$1
            AND spent_at >= $2::date AND spent_at < ($3::date + INTERVAL '1 day')
          ORDER BY spent_at DESC, created_at DESC
          LIMIT 500`,
        [centerId, from, to]
      ),
      pool.query(
        `SELECT COALESCE(NULLIF(payment_type,''),'other') AS key,
                COALESCE(SUM(amount),0)::numeric AS total,
                COUNT(*)::int AS count
           FROM center_payments
          WHERE center_id=$1 AND status='paid'
            AND paid_at >= $2::date AND paid_at < ($3::date + INTERVAL '1 day')
          GROUP BY 1 ORDER BY total DESC`,
        [centerId, from, to]
      ),
      pool.query(
        `SELECT COALESCE(NULLIF(category,''),'Boshqa') AS key,
                COALESCE(SUM(amount),0)::numeric AS total,
                COUNT(*)::int AS count
           FROM center_expenses
          WHERE center_id=$1
            AND spent_at >= $2::date AND spent_at < ($3::date + INTERVAL '1 day')
          GROUP BY 1 ORDER BY total DESC`,
        [centerId, from, to]
      ),
    ]);

    const income = num(incomeQ.rows[0]?.total);
    const expenses = num(expenseQ.rows[0]?.total);
    const payments = paymentsQ.rows.map((r) => ({
      id: r.id,
      kind: 'income',
      studentId: r.student_id,
      studentName: r.student_name || '',
      groupId: r.group_id,
      groupName: r.group_name || '',
      amount: num(r.amount),
      paymentType: r.payment_type || 'other',
      status: r.status || 'paid',
      note: r.note || '',
      paidAt: r.paid_at,
      createdAt: r.created_at,
    }));
    const expenseRows = expensesQ.rows.map((r) => ({
      id: r.id,
      kind: 'expense',
      title: r.title || '',
      amount: num(r.amount),
      category: r.category || 'Boshqa',
      note: r.note || '',
      spentAt: r.spent_at,
      createdAt: r.created_at,
    }));

    return res.json({
      ok: true,
      range: { from, to },
      summary: {
        income,
        expenses,
        profit: income - expenses,
        paymentCount: Number(incomeQ.rows[0]?.count || 0),
        expenseCount: Number(expenseQ.rows[0]?.count || 0),
      },
      payments,
      expenses: expenseRows,
      paymentMethods: methodsQ.rows.map((r) => ({ key: r.key, total: num(r.total), count: Number(r.count || 0) })),
      expenseCategories: categoriesQ.rows.map((r) => ({ key: r.key, total: num(r.total), count: Number(r.count || 0) })),
    });
  } catch (error) {
    return err(res, 500, 'Moliya ma’lumotlarini yuklashda xatolik', error);
  }
});

module.exports = router;
