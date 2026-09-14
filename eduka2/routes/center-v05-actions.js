const express = require('express');
const pool = require('../db');
const { requireCenterAuth } = require('../middleware/center-auth');

const router = express.Router();
const PROD = process.env.NODE_ENV === 'production';

function clean(v) { return v == null ? '' : String(v).trim(); }
function err(res, status, message, error) {
  return res.status(status).json({
    ok: false,
    error: message,
    ...(PROD || !error ? {} : { realError: error.message, code: error.code || null }),
  });
}

router.patch('/reminders/:id', requireCenterAuth, async (req, res) => {
  try {
    const b = req.body || {};
    const status = clean(b.status) || null;
    const allowed = new Set(['active', 'done', 'cancelled']);
    if (status && !allowed.has(status)) return err(res, 400, 'Reminder status noto‘g‘ri');

    const q = await pool.query(
      `UPDATE reminders
          SET title = COALESCE($3, title),
              note = COALESCE($4, note),
              tag = COALESCE($5, tag),
              assigned_to = COALESCE($6, assigned_to),
              remind_at = COALESCE($7, remind_at),
              status = COALESCE($8, status),
              updated_at = NOW()
        WHERE id = $1 AND center_id = $2
        RETURNING *`,
      [
        req.params.id,
        req.centerUser.centerId,
        clean(b.title) || null,
        b.note === undefined ? null : clean(b.note),
        b.tag === undefined ? null : clean(b.tag),
        b.assignedTo === undefined ? null : clean(b.assignedTo),
        b.remindAt || b.dueAt || null,
        status,
      ]
    );

    if (!q.rows[0]) return err(res, 404, 'Eslatma topilmadi');
    const r = q.rows[0];
    return res.json({
      ok: true,
      reminder: {
        id: r.id,
        title: r.title,
        note: r.note,
        tag: r.tag,
        assignedTo: r.assigned_to,
        remindAt: r.remind_at,
        dueAt: r.remind_at,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      },
    });
  } catch (error) {
    return err(res, 500, 'Eslatmani yangilashda xatolik', error);
  }
});

router.delete('/reminders/:id', requireCenterAuth, async (req, res) => {
  try {
    const q = await pool.query(
      `UPDATE reminders SET status='cancelled', updated_at=NOW()
        WHERE id=$1 AND center_id=$2 RETURNING id`,
      [req.params.id, req.centerUser.centerId]
    );
    if (!q.rows[0]) return err(res, 404, 'Eslatma topilmadi');
    return res.json({ ok: true });
  } catch (error) {
    return err(res, 500, 'Eslatmani o‘chirishda xatolik', error);
  }
});

module.exports = router;
