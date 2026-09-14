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
function leadMap(r) {
  return {
    id: r.id,
    name: r.full_name,
    fullName: r.full_name,
    phone: r.phone,
    source: r.source,
    status: r.status,
    note: r.note,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
async function activity(centerId, userId, action, details = {}) {
  try {
    await pool.query(
      `INSERT INTO center_activity_logs(center_id,user_id,action,module,details)
       VALUES($1,$2,$3,'leads',$4)`,
      [centerId, userId || null, action, JSON.stringify(details)]
    );
  } catch (e) {
    console.error('Lead activity log failed:', e.message);
  }
}

router.get('/leads-v2', requireCenterAuth, async (req, res) => {
  try {
    const centerId = req.centerUser.centerId;
    const q = clean(req.query.q);
    const status = clean(req.query.status);
    const source = clean(req.query.source);
    const params = [centerId];
    let where = `center_id=$1 AND COALESCE(status,'LEADS') <> 'deleted'`;

    if (q) {
      params.push(`%${q}%`);
      where += ` AND (full_name ILIKE $${params.length} OR phone ILIKE $${params.length} OR note ILIKE $${params.length})`;
    }
    if (status && status !== 'all') {
      params.push(status);
      where += ` AND status=$${params.length}`;
    }
    if (source && source !== 'all') {
      params.push(source);
      where += ` AND source=$${params.length}`;
    }

    const result = await pool.query(
      `SELECT * FROM leads WHERE ${where} ORDER BY created_at DESC`,
      params
    );
    return res.json({ ok: true, leads: result.rows.map(leadMap) });
  } catch (error) {
    return err(res, 500, 'Lidlarni yuklashda xatolik', error);
  }
});

router.post('/leads-v2', requireCenterAuth, async (req, res) => {
  try {
    const b = req.body || {};
    const name = clean(b.name || b.fullName);
    const phone = clean(b.phone);
    if (!name && !phone) return err(res, 400, 'Ism yoki telefon kerak');

    const q = await pool.query(
      `INSERT INTO leads(center_id,full_name,phone,source,status,note)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        req.centerUser.centerId,
        name || null,
        phone || null,
        clean(b.source) || 'Manual',
        clean(b.status) || 'LEADS',
        clean(b.note) || null,
      ]
    );
    await activity(req.centerUser.centerId, req.centerUser.id, 'Yangi lid qo‘shildi', { leadId: q.rows[0].id });
    return res.status(201).json({ ok: true, lead: leadMap(q.rows[0]) });
  } catch (error) {
    return err(res, 500, 'Lid yaratishda xatolik', error);
  }
});

router.patch('/leads-v2/:id', requireCenterAuth, async (req, res) => {
  try {
    const b = req.body || {};
    const noteProvided = Object.prototype.hasOwnProperty.call(b, 'note');
    const q = await pool.query(
      `UPDATE leads
          SET full_name=COALESCE($3,full_name),
              phone=COALESCE($4,phone),
              source=COALESCE($5,source),
              status=COALESCE($6,status),
              note=CASE WHEN $7::boolean THEN $8 ELSE note END,
              updated_at=NOW()
        WHERE id=$1 AND center_id=$2 AND COALESCE(status,'LEADS') <> 'deleted'
        RETURNING *`,
      [
        req.params.id,
        req.centerUser.centerId,
        clean(b.name || b.fullName) || null,
        clean(b.phone) || null,
        clean(b.source) || null,
        clean(b.status) || null,
        noteProvided,
        noteProvided ? (clean(b.note) || null) : null,
      ]
    );
    if (!q.rows[0]) return err(res, 404, 'Lid topilmadi');
    await activity(req.centerUser.centerId, req.centerUser.id, 'Lid yangilandi', { leadId: req.params.id, status: q.rows[0].status });
    return res.json({ ok: true, lead: leadMap(q.rows[0]) });
  } catch (error) {
    return err(res, 500, 'Lidni yangilashda xatolik', error);
  }
});

router.delete('/leads-v2/:id', requireCenterAuth, async (req, res) => {
  try {
    const q = await pool.query(
      `UPDATE leads SET status='deleted',updated_at=NOW()
        WHERE id=$1 AND center_id=$2 AND COALESCE(status,'LEADS') <> 'deleted'
        RETURNING id`,
      [req.params.id, req.centerUser.centerId]
    );
    if (!q.rows[0]) return err(res, 404, 'Lid topilmadi');
    await activity(req.centerUser.centerId, req.centerUser.id, 'Lid o‘chirildi', { leadId: req.params.id });
    return res.json({ ok: true });
  } catch (error) {
    return err(res, 500, 'Lidni o‘chirishda xatolik', error);
  }
});

router.post('/leads-v2/:id/convert', requireCenterAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const centerId = req.centerUser.centerId;
    const b = req.body || {};
    await client.query('BEGIN');

    const leadQ = await client.query(
      `SELECT * FROM leads
        WHERE id=$1 AND center_id=$2 AND COALESCE(status,'LEADS') <> 'deleted'
        FOR UPDATE`,
      [req.params.id, centerId]
    );
    const lead = leadQ.rows[0];
    if (!lead) {
      await client.query('ROLLBACK');
      client.release();
      return err(res, 404, 'Lid topilmadi');
    }
    if (lead.status === 'Mijoz bo‘ldi') {
      await client.query('ROLLBACK');
      client.release();
      return err(res, 409, 'Bu lid allaqachon talabaga aylantirilgan');
    }

    const name = clean(b.name) || clean(lead.full_name) || 'Yangi talaba';
    const phone = clean(b.phone) || clean(lead.phone) || null;
    let student = null;
    let created = false;

    if (phone) {
      const existing = await client.query(
        `SELECT * FROM students
          WHERE center_id=$1 AND phone=$2 AND COALESCE(status,'active') <> 'deleted'
          ORDER BY created_at DESC LIMIT 1`,
        [centerId, phone]
      );
      student = existing.rows[0] || null;
    }

    if (!student) {
      const studentQ = await client.query(
        `INSERT INTO students(center_id,full_name,phone,parent_phone,birth_date,gender,note,status,balance)
         VALUES($1,$2,$3,$4,$5,$6,$7,'active',0) RETURNING *`,
        [
          centerId,
          name,
          phone,
          clean(b.parentPhone) || null,
          b.birthDate || null,
          clean(b.gender) || null,
          clean(b.note) || clean(lead.note) || null,
        ]
      );
      student = studentQ.rows[0];
      created = true;
    }

    if (b.groupId) {
      const groupQ = await client.query(
        `SELECT id FROM study_groups
          WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active') <> 'deleted'`,
        [b.groupId, centerId]
      );
      if (!groupQ.rows[0]) throw new Error('Tanlangan guruh topilmadi');
      await client.query(
        `INSERT INTO group_students(center_id,group_id,student_id,status,joined_at)
         VALUES($1,$2,$3,'active',CURRENT_DATE)
         ON CONFLICT(group_id,student_id)
         DO UPDATE SET status='active',updated_at=NOW()`,
        [centerId, b.groupId, student.id]
      );
    }

    await client.query(
      `UPDATE leads SET status='Mijoz bo‘ldi',updated_at=NOW() WHERE id=$1 AND center_id=$2`,
      [req.params.id, centerId]
    );
    await client.query('COMMIT');
    client.release();

    await activity(centerId, req.centerUser.id, 'Lid talabaga aylantirildi', {
      leadId: req.params.id,
      studentId: student.id,
      created,
      groupId: b.groupId || null,
    });

    return res.json({
      ok: true,
      created,
      student: {
        id: student.id,
        name: student.full_name,
        phone: student.phone,
        parentPhone: student.parent_phone,
        status: student.status,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    return err(res, 500, 'Lidni talabaga aylantirishda xatolik', error);
  }
});

module.exports = router;
