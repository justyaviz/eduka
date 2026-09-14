const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireCenterAuth, signCenterToken } = require('../middleware/center-auth');

const router = express.Router();
const PROD = process.env.NODE_ENV === 'production';

function clean(v) { return v == null ? '' : String(v).trim(); }
function num(v) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0; }
function err(res, status, message, error) {
  return res.status(status).json({ ok: false, error: message, ...(PROD || !error ? {} : { realError: error.message, code: error.code || null }) });
}

function studentMap(r) {
  return {
    id: r.id,
    centerId: r.center_id,
    name: r.full_name,
    fullName: r.full_name,
    phone: r.phone,
    parentPhone: r.parent_phone,
    birthDate: r.birth_date,
    gender: r.gender,
    note: r.note,
    status: r.status,
    balance: num(r.balance),
    groupName: r.group_name || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function teacherMap(r) {
  return {
    id: r.id,
    centerId: r.center_id,
    name: r.full_name,
    fullName: r.full_name,
    phone: r.phone,
    subject: r.subject,
    salary: num(r.salary),
    birthDate: r.birth_date,
    gender: r.gender,
    photoUrl: r.photo_url,
    status: r.status,
    createdAt: r.created_at,
  };
}

function courseMap(r) {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    price: num(r.price),
    lessonDuration: r.lesson_duration,
    durationMonths: Number(r.duration_months || 1),
    note: r.note,
    status: r.status,
    groupCount: Number(r.group_count || 0),
    createdAt: r.created_at,
  };
}

function roomMap(r) {
  return {
    id: r.id,
    name: r.name,
    capacity: Number(r.capacity || 0),
    status: r.status,
    createdAt: r.created_at,
  };
}

function groupMap(r) {
  return {
    id: r.id,
    centerId: r.center_id,
    name: r.name,
    courseId: r.course_id,
    course: r.course || r.course_name || '',
    courseName: r.course || r.course_name || '',
    coursePrice: num(r.course_price ?? r.monthly_price),
    courseDurationMonths: Number(r.course_duration_months || 0),
    courseLessonDuration: r.course_lesson_duration || null,
    teacherId: r.teacher_id,
    teacherName: r.teacher_name || '',
    roomId: r.room_id,
    room: r.room_name || '',
    roomName: r.room_name || '',
    roomCapacity: Number(r.room_capacity || 0),
    days: r.days_text || '',
    lessonTime: r.lesson_time || '',
    lessonDuration: r.lesson_duration || '',
    scheduleText: r.schedule_text || '',
    startDate: r.started_at,
    endDate: r.ended_at,
    monthlyPrice: num(r.monthly_price),
    studentCount: Number(r.student_count || 0),
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
    groupId: r.group_id,
    groupName: r.group_name || '',
    amount: num(r.amount),
    paymentType: r.payment_type,
    status: r.status,
    note: r.note,
    paidAt: r.paid_at,
    createdAt: r.created_at,
  };
}

function reminderMap(r) {
  return {
    id: r.id,
    title: r.title,
    note: r.note,
    tag: r.tag,
    assignedTo: r.assigned_to,
    remindAt: r.remind_at,
    dueAt: r.remind_at,
    status: r.status,
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
    console.error('Center activity error:', error.message);
  }
}

async function getGroupRows(centerId, id = null) {
  const params = [centerId];
  let where = `g.center_id=$1 AND COALESCE(g.status,'active') <> 'deleted'`;
  if (id) { params.push(id); where += ` AND g.id=$2`; }
  return pool.query(
    `SELECT g.*,
            c.name AS course, c.price AS course_price, c.duration_months AS course_duration_months,
            c.lesson_duration AS course_lesson_duration,
            t.full_name AS teacher_name,
            r.name AS room_name, r.capacity AS room_capacity,
            COUNT(gs.student_id) FILTER (WHERE gs.status='active')::int AS student_count
       FROM study_groups g
       LEFT JOIN courses c ON c.id=g.course_id AND c.center_id=g.center_id
       LEFT JOIN teachers t ON t.id=g.teacher_id AND t.center_id=g.center_id
       LEFT JOIN rooms r ON r.id=g.room_id AND r.center_id=g.center_id
       LEFT JOIN group_students gs ON gs.group_id=g.id AND gs.center_id=g.center_id
      WHERE ${where}
      GROUP BY g.id,c.id,t.id,r.id
      ORDER BY g.created_at DESC`,
    params
  );
}

router.post('/login', async (req, res) => {
  try {
    const { email, password, subdomain } = req.body || {};
    if (!email || !password) return err(res, 400, 'Email va parol kerak');
    const result = await pool.query(
      `SELECT cu.*, c.name AS center_name, c.subdomain, c.status AS center_status
         FROM center_users cu JOIN centers c ON c.id=cu.center_id
        WHERE lower(cu.email)=lower($1) AND cu.status='active'
          AND ($2::text IS NULL OR lower(c.subdomain)=lower($2))
        LIMIT 1`,
      [clean(email), subdomain ? clean(subdomain) : null]
    );
    const user = result.rows[0];
    if (!user) return err(res, 401, 'Login topilmadi');
    if (['Suspended','Expired','Blocked'].includes(user.center_status)) return err(res, 403, 'Markaz vaqtincha bloklangan');
    let valid = await bcrypt.compare(String(password), user.password_hash).catch(() => false);
    if (!valid) {
      const q = await pool.query(`SELECT crypt($1,password_hash)=password_hash AS ok FROM center_users WHERE id=$2`, [password,user.id]).catch(() => ({rows:[{ok:false}]}));
      valid = !!q.rows[0]?.ok;
    }
    if (!valid) return err(res, 401, 'Parol xato');
    await pool.query(`UPDATE center_users SET last_login_at=NOW(), updated_at=NOW() WHERE id=$1`, [user.id]);
    const center = { id:user.center_id, name:user.center_name, subdomain:user.subdomain };
    return res.json({ ok:true, token:signCenterToken(user,center), user:{id:user.id,fullName:user.full_name,email:user.email,role:user.role,centerId:user.center_id}, center });
  } catch (error) { return err(res, 500, 'Center login server error', error); }
});

router.post('/init', requireCenterAuth, async (req,res) => res.json({ok:true}));
router.get('/save-health', requireCenterAuth, async (req,res) => {
  try {
    const q = await pool.query('SELECT NOW() AS now');
    return res.json({ok:true, database:true, now:q.rows[0].now, centerId:req.centerUser.centerId});
  } catch (error) { return err(res,500,'Database save-health failed',error); }
});

router.get('/me', requireCenterAuth, async (req,res) => {
  try {
    const q = await pool.query(`SELECT * FROM centers WHERE id=$1 LIMIT 1`,[req.centerUser.centerId]);
    return res.json({ok:true,user:req.centerUser,center:q.rows[0]||null});
  } catch(error){return err(res,500,'Me server error',error);}
});

router.get('/dashboard', requireCenterAuth, async (req,res) => {
  try {
    const id=req.centerUser.centerId;
    const [students,groups,payments,attendance,leads,activityRows]=await Promise.all([
      pool.query(`SELECT COUNT(*)::int count FROM students WHERE center_id=$1 AND COALESCE(status,'active')='active'`,[id]),
      pool.query(`SELECT COUNT(*)::int count FROM study_groups WHERE center_id=$1 AND COALESCE(status,'active')='active'`,[id]),
      pool.query(`SELECT COALESCE(SUM(amount),0)::numeric total FROM center_payments WHERE center_id=$1 AND status='paid' AND paid_at>=date_trunc('month',NOW())`,[id]),
      pool.query(`SELECT COUNT(*)::int count FROM attendance WHERE center_id=$1 AND lesson_date=CURRENT_DATE`,[id]),
      pool.query(`SELECT COUNT(*)::int count FROM leads WHERE center_id=$1 AND COALESCE(status,'LEADS') NOT IN ('closed','deleted','Mijoz bo‘ldi')`,[id]),
      pool.query(`SELECT * FROM center_activity_logs WHERE center_id=$1 ORDER BY created_at DESC LIMIT 12`,[id]),
    ]);
    return res.json({ok:true,stats:{students:students.rows[0].count,groups:groups.rows[0].count,monthlyPayments:num(payments.rows[0].total),todayAttendance:attendance.rows[0].count,leads:leads.rows[0].count},activity:activityRows.rows});
  } catch(error){return err(res,500,'Dashboard server error',error);}
});

router.get('/students', requireCenterAuth, async (req,res) => {
  try {
    const q=req.query.q?`%${req.query.q}%`:null;
    const result=await pool.query(
      `SELECT s.*, string_agg(DISTINCT g.name, ', ') FILTER (WHERE gs.status='active') AS group_name
         FROM students s
         LEFT JOIN group_students gs ON gs.student_id=s.id AND gs.center_id=s.center_id
         LEFT JOIN study_groups g ON g.id=gs.group_id
        WHERE s.center_id=$1 AND COALESCE(s.status,'active') <> 'deleted'
          AND ($2::text IS NULL OR s.full_name ILIKE $2 OR s.phone ILIKE $2 OR s.parent_phone ILIKE $2)
        GROUP BY s.id ORDER BY s.created_at DESC`,
      [req.centerUser.centerId,q]
    );
    return res.json({ok:true,students:result.rows.map(studentMap)});
  } catch(error){return err(res,500,'Students server error',error);}
});

router.post('/students', requireCenterAuth, async (req,res) => {
  const client=await pool.connect();
  try {
    const b=req.body||{}; const name=clean(b.name||b.fullName);
    if(!name){client.release();return err(res,400,'O‘quvchi ismi kerak');}
    await client.query('BEGIN');
    const q=await client.query(
      `INSERT INTO students(center_id,full_name,phone,parent_phone,birth_date,gender,note,status,balance)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.centerUser.centerId,name,clean(b.phone)||null,clean(b.parentPhone)||null,b.birthDate||null,clean(b.gender)||null,clean(b.note)||null,b.status||'active',num(b.balance)]
    );
    if(b.groupId){
      await client.query(`INSERT INTO group_students(center_id,group_id,student_id,status,joined_at) VALUES($1,$2,$3,'active',CURRENT_DATE) ON CONFLICT(group_id,student_id) DO UPDATE SET status='active',updated_at=NOW()`,[req.centerUser.centerId,b.groupId,q.rows[0].id]);
    }
    await client.query('COMMIT'); client.release();
    await activity(req.centerUser.centerId,req.centerUser.id,'O‘quvchi qo‘shildi','students',{studentId:q.rows[0].id});
    return res.status(201).json({ok:true,student:studentMap(q.rows[0])});
  } catch(error){await client.query('ROLLBACK').catch(()=>{});client.release();return err(res,500,'Create student server error',error);}
});

async function updateStudent(req,res){
  try{const b=req.body||{};const q=await pool.query(
    `UPDATE students SET full_name=COALESCE($3,full_name),phone=COALESCE($4,phone),parent_phone=COALESCE($5,parent_phone),birth_date=COALESCE($6,birth_date),gender=COALESCE($7,gender),note=COALESCE($8,note),status=COALESCE($9,status),updated_at=NOW() WHERE id=$1 AND center_id=$2 RETURNING *`,
    [req.params.id,req.centerUser.centerId,clean(b.name||b.fullName)||null,clean(b.phone)||null,clean(b.parentPhone)||null,b.birthDate||null,clean(b.gender)||null,b.note??null,b.status||null]);
    if(!q.rows[0])return err(res,404,'Student not found'); return res.json({ok:true,student:studentMap(q.rows[0])});
  }catch(error){return err(res,500,'Update student server error',error);}
}
router.patch('/students/:id',requireCenterAuth,updateStudent);
router.put('/students/:id',requireCenterAuth,updateStudent);
router.delete('/students/:id',requireCenterAuth,async(req,res)=>{try{await pool.query(`UPDATE students SET status='deleted',updated_at=NOW() WHERE id=$1 AND center_id=$2`,[req.params.id,req.centerUser.centerId]);return res.json({ok:true});}catch(error){return err(res,500,'Delete student failed',error);}});

router.get('/teachers',requireCenterAuth,async(req,res)=>{try{const q=await pool.query(`SELECT * FROM teachers WHERE center_id=$1 AND COALESCE(status,'active')<>'deleted' ORDER BY created_at DESC`,[req.centerUser.centerId]);return res.json({ok:true,teachers:q.rows.map(teacherMap)});}catch(error){return err(res,500,'Teachers server error',error);}});
async function createTeacher(req,res){try{const b=req.body||{};const name=clean(b.name||b.fullName);if(!name)return err(res,400,'O‘qituvchi ismi kerak');const q=await pool.query(`INSERT INTO teachers(center_id,full_name,phone,subject,salary,birth_date,gender,photo_url,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'active') RETURNING *`,[req.centerUser.centerId,name,clean(b.phone)||null,clean(b.subject)||null,num(b.salary),b.birthDate||null,clean(b.gender)||null,clean(b.photoUrl)||null]);await activity(req.centerUser.centerId,req.centerUser.id,'O‘qituvchi qo‘shildi','teachers',{teacherId:q.rows[0].id});return res.status(201).json({ok:true,teacher:teacherMap(q.rows[0])});}catch(error){return err(res,500,'Create teacher server error',error);}}
router.post('/teachers',requireCenterAuth,createTeacher);router.post('/teachers-v2',requireCenterAuth,createTeacher);
async function updateTeacher(req,res){try{const b=req.body||{};const q=await pool.query(`UPDATE teachers SET full_name=COALESCE($3,full_name),phone=COALESCE($4,phone),subject=COALESCE($5,subject),salary=COALESCE($6,salary),birth_date=COALESCE($7,birth_date),gender=COALESCE($8,gender),photo_url=COALESCE($9,photo_url),updated_at=NOW() WHERE id=$1 AND center_id=$2 RETURNING *`,[req.params.id,req.centerUser.centerId,clean(b.name||b.fullName)||null,clean(b.phone)||null,clean(b.subject)||null,b.salary==null?null:num(b.salary),b.birthDate||null,clean(b.gender)||null,clean(b.photoUrl)||null]);if(!q.rows[0])return err(res,404,'Teacher not found');return res.json({ok:true,teacher:teacherMap(q.rows[0])});}catch(error){return err(res,500,'Update teacher failed',error);}}
router.put('/teachers-v2/:id',requireCenterAuth,updateTeacher);router.patch('/teachers/:id',requireCenterAuth,updateTeacher);
router.delete('/teachers/:id',requireCenterAuth,async(req,res)=>{try{await pool.query(`UPDATE teachers SET status='deleted',updated_at=NOW() WHERE id=$1 AND center_id=$2`,[req.params.id,req.centerUser.centerId]);return res.json({ok:true});}catch(error){return err(res,500,'Delete teacher failed',error);}});

router.get('/courses-v2',requireCenterAuth,async(req,res)=>{try{const q=await pool.query(`SELECT c.*,COUNT(g.id) FILTER(WHERE COALESCE(g.status,'active')<>'deleted')::int group_count FROM courses c LEFT JOIN study_groups g ON g.course_id=c.id AND g.center_id=c.center_id WHERE c.center_id=$1 AND COALESCE(c.status,'active')<>'deleted' GROUP BY c.id ORDER BY c.created_at DESC`,[req.centerUser.centerId]);return res.json({ok:true,courses:q.rows.map(courseMap)});}catch(error){return err(res,500,'Courses load failed',error);}});
router.post('/courses-v2',requireCenterAuth,async(req,res)=>{try{const b=req.body||{};if(!clean(b.name))return err(res,400,'Kurs nomi kerak');const q=await pool.query(`INSERT INTO courses(center_id,name,code,price,lesson_duration,duration_months,note,status) VALUES($1,$2,$3,$4,$5,$6,$7,'active') RETURNING *`,[req.centerUser.centerId,clean(b.name),clean(b.code)||null,num(b.price),clean(b.lessonDuration)||'90 daqiqa',Number(b.durationMonths||1),clean(b.note)||null]);return res.status(201).json({ok:true,course:courseMap(q.rows[0])});}catch(error){return err(res,500,'Course save failed',error);}});
router.put('/courses-v2/:id',requireCenterAuth,async(req,res)=>{try{const b=req.body||{};const q=await pool.query(`UPDATE courses SET name=COALESCE($3,name),code=$4,price=COALESCE($5,price),lesson_duration=COALESCE($6,lesson_duration),duration_months=COALESCE($7,duration_months),note=$8,updated_at=NOW() WHERE id=$1 AND center_id=$2 RETURNING *`,[req.params.id,req.centerUser.centerId,clean(b.name)||null,clean(b.code)||null,b.price==null?null:num(b.price),clean(b.lessonDuration)||null,b.durationMonths==null?null:Number(b.durationMonths),b.note??null]);if(!q.rows[0])return err(res,404,'Course not found');return res.json({ok:true,course:courseMap(q.rows[0])});}catch(error){return err(res,500,'Course update failed',error);}});
router.delete('/courses-v2/:id',requireCenterAuth,async(req,res)=>{try{await pool.query(`UPDATE courses SET status='deleted',updated_at=NOW() WHERE id=$1 AND center_id=$2`,[req.params.id,req.centerUser.centerId]);return res.json({ok:true});}catch(error){return err(res,500,'Course delete failed',error);}});

router.get('/rooms',requireCenterAuth,async(req,res)=>{try{const q=await pool.query(`SELECT * FROM rooms WHERE center_id=$1 AND COALESCE(status,'active')<>'deleted' ORDER BY created_at DESC`,[req.centerUser.centerId]);return res.json({ok:true,rooms:q.rows.map(roomMap)});}catch(error){return err(res,500,'Rooms load failed',error);}});
router.post('/rooms',requireCenterAuth,async(req,res)=>{try{const b=req.body||{};if(!clean(b.name))return err(res,400,'Xona nomi kerak');const q=await pool.query(`INSERT INTO rooms(center_id,name,capacity,status) VALUES($1,$2,$3,'active') RETURNING *`,[req.centerUser.centerId,clean(b.name),Number(b.capacity||0)]);return res.status(201).json({ok:true,room:roomMap(q.rows[0])});}catch(error){return err(res,500,'Room save failed',error);}});
router.put('/rooms/:id',requireCenterAuth,async(req,res)=>{try{const b=req.body||{};const q=await pool.query(`UPDATE rooms SET name=COALESCE($3,name),capacity=COALESCE($4,capacity),updated_at=NOW() WHERE id=$1 AND center_id=$2 RETURNING *`,[req.params.id,req.centerUser.centerId,clean(b.name)||null,b.capacity==null?null:Number(b.capacity)]);if(!q.rows[0])return err(res,404,'Room not found');return res.json({ok:true,room:roomMap(q.rows[0])});}catch(error){return err(res,500,'Room update failed',error);}});
router.delete('/rooms/:id',requireCenterAuth,async(req,res)=>{try{await pool.query(`UPDATE rooms SET status='deleted',updated_at=NOW() WHERE id=$1 AND center_id=$2`,[req.params.id,req.centerUser.centerId]);return res.json({ok:true});}catch(error){return err(res,500,'Room delete failed',error);}});

router.get('/groups-v2',requireCenterAuth,async(req,res)=>{try{const q=await getGroupRows(req.centerUser.centerId);return res.json({ok:true,groups:q.rows.map(groupMap)});}catch(error){return err(res,500,'Groups load failed',error);}});
router.get('/groups',requireCenterAuth,async(req,res)=>{try{const q=await getGroupRows(req.centerUser.centerId);return res.json({ok:true,groups:q.rows.map(groupMap)});}catch(error){return err(res,500,'Groups load failed',error);}});
async function createGroup(req,res){try{const b=req.body||{};if(!clean(b.name))return err(res,400,'Guruh nomi kerak');const [course,teacher,room]=await Promise.all([
 b.courseId?pool.query(`SELECT * FROM courses WHERE id=$1 AND center_id=$2`,[b.courseId,req.centerUser.centerId]):Promise.resolve({rows:[]}),
 b.teacherId?pool.query(`SELECT * FROM teachers WHERE id=$1 AND center_id=$2`,[b.teacherId,req.centerUser.centerId]):Promise.resolve({rows:[]}),
 b.roomId?pool.query(`SELECT * FROM rooms WHERE id=$1 AND center_id=$2`,[b.roomId,req.centerUser.centerId]):Promise.resolve({rows:[]})]);
 const c=course.rows[0],t=teacher.rows[0],r=room.rows[0];
 const q=await pool.query(`INSERT INTO study_groups(center_id,name,course_id,teacher_id,room_id,course_name,teacher_name,room_name,days_text,lesson_time,lesson_duration,started_at,ended_at,schedule_text,monthly_price,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'active') RETURNING *`,[req.centerUser.centerId,clean(b.name),b.courseId||null,b.teacherId||null,b.roomId||null,c?.name||clean(b.courseName)||null,t?.full_name||clean(b.teacherName)||null,r?.name||clean(b.roomName)||null,clean(b.days)||null,clean(b.lessonTime)||null,clean(b.lessonDuration)||c?.lesson_duration||null,b.startDate||null,b.endDate||null,clean(b.scheduleText)||null,c?.price||num(b.monthlyPrice)]);
 await activity(req.centerUser.centerId,req.centerUser.id,'Guruh yaratildi','groups',{groupId:q.rows[0].id});const full=await getGroupRows(req.centerUser.centerId,q.rows[0].id);return res.status(201).json({ok:true,group:groupMap(full.rows[0]||q.rows[0])});}catch(error){return err(res,500,'Group save failed',error);}}
router.post('/groups-v2',requireCenterAuth,createGroup);router.post('/groups',requireCenterAuth,createGroup);
router.get('/groups-v2/:id',requireCenterAuth,async(req,res)=>{try{const g=await getGroupRows(req.centerUser.centerId,req.params.id);if(!g.rows[0])return err(res,404,'Group not found');const s=await pool.query(`SELECT st.*,gs.joined_at FROM group_students gs JOIN students st ON st.id=gs.student_id WHERE gs.center_id=$1 AND gs.group_id=$2 AND gs.status='active' AND COALESCE(st.status,'active')<>'deleted' ORDER BY st.full_name`,[req.centerUser.centerId,req.params.id]);return res.json({ok:true,group:groupMap(g.rows[0]),students:s.rows.map(x=>({...studentMap(x),joinedAt:x.joined_at}))});}catch(error){return err(res,500,'Group detail load failed',error);}});
router.put('/groups-v2/:id',requireCenterAuth,async(req,res)=>{try{const b=req.body||{};const q=await pool.query(`UPDATE study_groups SET name=COALESCE($3,name),course_id=COALESCE($4,course_id),teacher_id=COALESCE($5,teacher_id),room_id=COALESCE($6,room_id),days_text=COALESCE($7,days_text),lesson_time=COALESCE($8,lesson_time),lesson_duration=COALESCE($9,lesson_duration),started_at=COALESCE($10,started_at),ended_at=COALESCE($11,ended_at),updated_at=NOW() WHERE id=$1 AND center_id=$2 RETURNING *`,[req.params.id,req.centerUser.centerId,clean(b.name)||null,b.courseId||null,b.teacherId||null,b.roomId||null,clean(b.days)||null,clean(b.lessonTime)||null,clean(b.lessonDuration)||null,b.startDate||null,b.endDate||null]);if(!q.rows[0])return err(res,404,'Group not found');const full=await getGroupRows(req.centerUser.centerId,req.params.id);return res.json({ok:true,group:groupMap(full.rows[0])});}catch(error){return err(res,500,'Group update failed',error);}});
router.delete('/groups-v2/:id',requireCenterAuth,async(req,res)=>{try{await pool.query(`UPDATE study_groups SET status='deleted',updated_at=NOW() WHERE id=$1 AND center_id=$2`,[req.params.id,req.centerUser.centerId]);return res.json({ok:true});}catch(error){return err(res,500,'Group delete failed',error);}});
router.get('/groups-v2/:id/available-students',requireCenterAuth,async(req,res)=>{try{const q=await pool.query(`SELECT s.* FROM students s WHERE s.center_id=$1 AND COALESCE(s.status,'active')<>'deleted' AND NOT EXISTS(SELECT 1 FROM group_students gs WHERE gs.group_id=$2 AND gs.student_id=s.id AND gs.status='active') ORDER BY s.full_name`,[req.centerUser.centerId,req.params.id]);return res.json({ok:true,students:q.rows.map(studentMap)});}catch(error){return err(res,500,'Available students failed',error);}});
async function attachStudent(req,res){try{if(!req.body?.studentId)return err(res,400,'Talaba tanlanmagan');await pool.query(`INSERT INTO group_students(center_id,group_id,student_id,status,joined_at) VALUES($1,$2,$3,'active',COALESCE($4,CURRENT_DATE)) ON CONFLICT(group_id,student_id) DO UPDATE SET status='active',joined_at=EXCLUDED.joined_at,updated_at=NOW()`,[req.centerUser.centerId,req.params.id||req.params.groupId,req.body.studentId,req.body.joinedAt||null]);return res.json({ok:true});}catch(error){return err(res,500,'Attach student failed',error);}}
router.post('/groups-v2/:id/students',requireCenterAuth,attachStudent);router.post('/groups/:groupId/students',requireCenterAuth,attachStudent);
router.delete('/groups-v2/:groupId/students/:studentId',requireCenterAuth,async(req,res)=>{try{await pool.query(`UPDATE group_students SET status='removed',updated_at=NOW() WHERE center_id=$1 AND group_id=$2 AND student_id=$3`,[req.centerUser.centerId,req.params.groupId,req.params.studentId]);return res.json({ok:true});}catch(error){return err(res,500,'Remove student failed',error);}});

router.get('/payments',requireCenterAuth,async(req,res)=>{try{const q=await pool.query(`SELECT p.*,g.name AS group_name FROM center_payments p LEFT JOIN study_groups g ON g.id=p.group_id WHERE p.center_id=$1 ORDER BY p.paid_at DESC`,[req.centerUser.centerId]);return res.json({ok:true,payments:q.rows.map(paymentMap)});}catch(error){return err(res,500,'Payments server error',error);}});
router.post('/payments',requireCenterAuth,async(req,res)=>{try{const b=req.body||{};if(!num(b.amount))return err(res,400,'Summa kerak');let studentName=clean(b.studentName)||null;if(b.studentId&&!studentName){const s=await pool.query(`SELECT full_name FROM students WHERE id=$1 AND center_id=$2`,[b.studentId,req.centerUser.centerId]);studentName=s.rows[0]?.full_name||null;}const q=await pool.query(`INSERT INTO center_payments(center_id,student_id,group_id,student_name,amount,payment_type,status,note,paid_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,NOW())) RETURNING *`,[req.centerUser.centerId,b.studentId||null,b.groupId||null,studentName,num(b.amount),clean(b.paymentType)||'cash',b.status||'paid',clean(b.note)||null,b.paidAt||null]);await activity(req.centerUser.centerId,req.centerUser.id,'To‘lov qabul qilindi','payments',{paymentId:q.rows[0].id,amount:num(b.amount)});return res.status(201).json({ok:true,payment:paymentMap(q.rows[0])});}catch(error){return err(res,500,'Create payment server error',error);}});

router.get('/finance/summary',requireCenterAuth,async(req,res)=>{try{const id=req.centerUser.centerId;const [income,expenses,payments]=await Promise.all([pool.query(`SELECT COALESCE(SUM(amount),0)::numeric total FROM center_payments WHERE center_id=$1 AND status='paid'`,[id]),pool.query(`SELECT COALESCE(SUM(amount),0)::numeric total FROM center_expenses WHERE center_id=$1`,[id]),pool.query(`SELECT p.*,g.name group_name FROM center_payments p LEFT JOIN study_groups g ON g.id=p.group_id WHERE p.center_id=$1 ORDER BY p.paid_at DESC LIMIT 100`,[id])]);const inc=num(income.rows[0].total),exp=num(expenses.rows[0].total);return res.json({ok:true,income:inc,expenses:exp,profit:inc-exp,payments:payments.rows.map(paymentMap)});}catch(error){return err(res,500,'Finance server error',error);}});
router.get('/expenses',requireCenterAuth,async(req,res)=>{try{const q=await pool.query(`SELECT * FROM center_expenses WHERE center_id=$1 ORDER BY spent_at DESC`,[req.centerUser.centerId]);return res.json({ok:true,expenses:q.rows});}catch(error){return err(res,500,'Expenses load failed',error);}});
router.post('/expenses',requireCenterAuth,async(req,res)=>{try{const b=req.body||{};if(!clean(b.title)||!num(b.amount))return err(res,400,'Nomi va summa kerak');const q=await pool.query(`INSERT INTO center_expenses(center_id,title,amount,category,spent_at,note) VALUES($1,$2,$3,$4,COALESCE($5,NOW()),$6) RETURNING *`,[req.centerUser.centerId,clean(b.title),num(b.amount),clean(b.category)||null,b.spentAt||null,clean(b.note)||null]);return res.status(201).json({ok:true,expense:q.rows[0]});}catch(error){return err(res,500,'Expense save failed',error);}});

router.get('/attendance',requireCenterAuth,async(req,res)=>{try{const date=req.query.date||new Date().toISOString().slice(0,10);const q=await pool.query(`SELECT a.*,s.full_name student_name,g.name group_name FROM attendance a JOIN students s ON s.id=a.student_id JOIN study_groups g ON g.id=a.group_id WHERE a.center_id=$1 AND a.lesson_date=$2 ORDER BY g.name,s.full_name`,[req.centerUser.centerId,date]);return res.json({ok:true,attendance:q.rows});}catch(error){return err(res,500,'Attendance server error',error);}});
router.post('/attendance',requireCenterAuth,async(req,res)=>{try{const b=req.body||{};if(!b.groupId||!b.studentId)return err(res,400,'groupId va studentId kerak');const q=await pool.query(`INSERT INTO attendance(center_id,group_id,student_id,lesson_date,status,note) VALUES($1,$2,$3,COALESCE($4,CURRENT_DATE),$5,$6) ON CONFLICT(group_id,student_id,lesson_date) DO UPDATE SET status=EXCLUDED.status,note=EXCLUDED.note RETURNING *`,[req.centerUser.centerId,b.groupId,b.studentId,b.lessonDate||null,b.status||'present',clean(b.note)||null]);return res.json({ok:true,attendance:q.rows[0]});}catch(error){return err(res,500,'Save attendance server error',error);}});

function leadMap(r){return{id:r.id,name:r.full_name,fullName:r.full_name,phone:r.phone,source:r.source,status:r.status,note:r.note,createdAt:r.created_at};}
router.get('/leads',requireCenterAuth,async(req,res)=>{try{const q=await pool.query(`SELECT * FROM leads WHERE center_id=$1 ORDER BY created_at DESC`,[req.centerUser.centerId]);return res.json({ok:true,leads:q.rows.map(leadMap)});}catch(error){return err(res,500,'Leads server error',error);}});
router.post('/leads',requireCenterAuth,async(req,res)=>{try{const b=req.body||{};const q=await pool.query(`INSERT INTO leads(center_id,full_name,phone,source,status,note) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[req.centerUser.centerId,clean(b.name||b.fullName)||null,clean(b.phone)||null,clean(b.source)||'Manual',b.status||'LEADS',clean(b.note)||null]);return res.status(201).json({ok:true,lead:leadMap(q.rows[0])});}catch(error){return err(res,500,'Create lead failed',error);}});
router.patch('/leads/:id',requireCenterAuth,async(req,res)=>{try{const b=req.body||{};const q=await pool.query(`UPDATE leads SET full_name=COALESCE($3,full_name),phone=COALESCE($4,phone),source=COALESCE($5,source),status=COALESCE($6,status),note=COALESCE($7,note),updated_at=NOW() WHERE id=$1 AND center_id=$2 RETURNING *`,[req.params.id,req.centerUser.centerId,clean(b.name||b.fullName)||null,clean(b.phone)||null,clean(b.source)||null,b.status||null,b.note??null]);if(!q.rows[0])return err(res,404,'Lead not found');return res.json({ok:true,lead:leadMap(q.rows[0])});}catch(error){return err(res,500,'Update lead failed',error);}});

router.get('/reminders',requireCenterAuth,async(req,res)=>{try{const q=await pool.query(`SELECT * FROM reminders WHERE center_id=$1 ORDER BY remind_at ASC NULLS LAST,created_at DESC`,[req.centerUser.centerId]);return res.json({ok:true,reminders:q.rows.map(reminderMap)});}catch(error){return err(res,500,'Reminders server error',error);}});
router.post('/reminders',requireCenterAuth,async(req,res)=>{try{const b=req.body||{};if(!clean(b.title))return err(res,400,'Sarlavha kerak');const q=await pool.query(`INSERT INTO reminders(center_id,title,note,tag,assigned_to,remind_at,status) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[req.centerUser.centerId,clean(b.title),clean(b.note)||null,clean(b.tag)||null,clean(b.assignedTo)||null,b.remindAt||b.dueAt||null,b.status||'active']);return res.status(201).json({ok:true,reminder:reminderMap(q.rows[0])});}catch(error){return err(res,500,'Create reminder failed',error);}});

router.get('/license',requireCenterAuth,async(req,res)=>{try{const q=await pool.query(`SELECT name,status,trial_ends_at,next_payment_date,tariff FROM centers WHERE id=$1 LIMIT 1`,[req.centerUser.centerId]);return res.json({ok:true,license:q.rows[0]||null});}catch(error){return err(res,500,'License server error',error);}});

router.get('/settings/general',requireCenterAuth,async(req,res)=>{try{const [c,s]=await Promise.all([pool.query(`SELECT name,owner_phone FROM centers WHERE id=$1`,[req.centerUser.centerId]),pool.query(`SELECT key,value FROM center_settings WHERE center_id=$1 AND key IN ('work_start','work_end')`,[req.centerUser.centerId])]);const map=Object.fromEntries(s.rows.map(x=>[x.key,x.value]));return res.json({ok:true,settings:{name:c.rows[0]?.name||'',phone:c.rows[0]?.owner_phone||'',workStart:map.work_start||'09:00',workEnd:map.work_end||'18:00'}});}catch(error){return err(res,500,'Settings load failed',error);}});
router.patch('/settings/general',requireCenterAuth,async(req,res)=>{const client=await pool.connect();try{const b=req.body||{};await client.query('BEGIN');await client.query(`UPDATE centers SET name=COALESCE($2,name),owner_phone=COALESCE($3,owner_phone),updated_at=NOW() WHERE id=$1`,[req.centerUser.centerId,clean(b.name)||null,clean(b.phone)||null]);for(const [key,value] of [['work_start',clean(b.workStart)||'09:00'],['work_end',clean(b.workEnd)||'18:00']])await client.query(`INSERT INTO center_settings(center_id,key,value) VALUES($1,$2,$3) ON CONFLICT(center_id,key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,[req.centerUser.centerId,key,value]);await client.query('COMMIT');client.release();return res.json({ok:true});}catch(error){await client.query('ROLLBACK').catch(()=>{});client.release();return err(res,500,'Settings save failed',error);}});

router.get('/activity',requireCenterAuth,async(req,res)=>{try{const q=await pool.query(`SELECT * FROM center_activity_logs WHERE center_id=$1 ORDER BY created_at DESC LIMIT 100`,[req.centerUser.centerId]);return res.json({ok:true,activity:q.rows});}catch(error){return err(res,500,'Activity server error',error);}});

module.exports = router;
