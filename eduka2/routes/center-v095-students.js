const express=require('express');
const pool=require('../db');
const {requireCenterAuth}=require('../middleware/center-auth');

const router=express.Router();
const PROD=process.env.NODE_ENV==='production';
function clean(v){return v==null?'':String(v).trim();}
function num(v){const n=Number(v||0);return Number.isFinite(n)?n:0;}
function err(res,status,message,error){return res.status(status).json({ok:false,error:message,...(PROD||!error?{}:{realError:error.message,code:error.code||null})});}
function recent(createdAt){const t=new Date(createdAt||0).getTime();return Number.isFinite(t)&&t>=Date.now()-30*24*60*60*1000;}
function groupsOf(r){return Array.isArray(r.groups)?r.groups:[];}
function mapStudent(r){
  const groups=groupsOf(r);
  const status=String(r.status||'active').toLowerCase();
  return {
    id:r.id,centerId:r.center_id,name:r.full_name,fullName:r.full_name,phone:r.phone||'',parentPhone:r.parent_phone||'',birthDate:r.birth_date,gender:r.gender||'',note:r.note||'',status,
    balance:num(r.balance),createdAt:r.created_at,updatedAt:r.updated_at,groups,groupName:groups.map(g=>g.name).filter(Boolean).join(', '),
    totalPaid:num(r.total_paid),lastPaymentAt:r.last_payment_at||null,
    attendance:{total:Number(r.attendance_total||0),present:Number(r.attendance_present||0),absent:Number(r.attendance_absent||0),late:Number(r.attendance_late||0)},
    isNew:recent(r.created_at),isArchived:['archived','inactive'].includes(status)
  };
}
async function activity(centerId,userId,action,details={}){try{await pool.query(`INSERT INTO center_activity_logs(center_id,user_id,action,module,details) VALUES($1,$2,$3,'students',$4)`,[centerId,userId||null,action,JSON.stringify(details)]);}catch{}}

const LIST_SQL=`SELECT s.*,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('id',g.id,'name',g.name,'courseId',g.course_id,'courseName',COALESCE(c.name,g.course_name,''),'teacherId',g.teacher_id,'teacherName',COALESCE(t.full_name,g.teacher_name,''),'branchId',g.branch_id,'roomName',COALESCE(r.name,g.room_name,'')) ORDER BY g.name)
    FROM group_students gs JOIN study_groups g ON g.id=gs.group_id AND g.center_id=s.center_id
    LEFT JOIN courses c ON c.id=g.course_id AND c.center_id=g.center_id
    LEFT JOIN teachers t ON t.id=g.teacher_id AND t.center_id=g.center_id
    LEFT JOIN rooms r ON r.id=g.room_id AND r.center_id=g.center_id
    WHERE gs.center_id=s.center_id AND gs.student_id=s.id AND gs.status='active' AND COALESCE(g.status,'active')<>'deleted'),'[]'::jsonb) groups,
  COALESCE((SELECT SUM(p.amount) FROM center_payments p WHERE p.center_id=s.center_id AND p.student_id=s.id AND p.status='paid'),0)::numeric total_paid,
  (SELECT MAX(p.paid_at) FROM center_payments p WHERE p.center_id=s.center_id AND p.student_id=s.id AND p.status='paid') last_payment_at,
  (SELECT COUNT(*)::int FROM attendance a WHERE a.center_id=s.center_id AND a.student_id=s.id) attendance_total,
  (SELECT COUNT(*)::int FROM attendance a WHERE a.center_id=s.center_id AND a.student_id=s.id AND a.status='present') attendance_present,
  (SELECT COUNT(*)::int FROM attendance a WHERE a.center_id=s.center_id AND a.student_id=s.id AND a.status='absent') attendance_absent,
  (SELECT COUNT(*)::int FROM attendance a WHERE a.center_id=s.center_id AND a.student_id=s.id AND a.status='late') attendance_late
 FROM students s WHERE s.center_id=$1 AND COALESCE(s.status,'active')<>'deleted' ORDER BY s.created_at DESC`;

router.get('/students-v095',requireCenterAuth,async(req,res)=>{
  try{
    const q=await pool.query(LIST_SQL,[req.centerUser.centerId]);
    let rows=q.rows.map(mapStudent);
    const search=clean(req.query.q).toLowerCase(),tab=clean(req.query.tab)||'all',groupId=clean(req.query.groupId),branchId=clean(req.query.branchId),balance=clean(req.query.balance);
    if(search)rows=rows.filter(s=>[s.name,s.phone,s.parentPhone,s.groupName,...s.groups.map(g=>g.courseName)].some(v=>String(v||'').toLowerCase().includes(search)));
    if(tab==='new')rows=rows.filter(s=>s.isNew&&!s.isArchived);
    if(tab==='active')rows=rows.filter(s=>s.status==='active');
    if(tab==='archive')rows=rows.filter(s=>s.isArchived);
    if(groupId)rows=rows.filter(s=>s.groups.some(g=>String(g.id)===groupId));
    if(branchId&&branchId!=='all')rows=rows.filter(s=>s.groups.some(g=>String(g.branchId)===branchId));
    if(balance==='debt')rows=rows.filter(s=>s.balance<0);
    if(balance==='zero')rows=rows.filter(s=>s.balance===0);
    if(balance==='positive')rows=rows.filter(s=>s.balance>0);
    const all=q.rows.map(mapStudent);
    const summary={total:all.length,new:all.filter(s=>s.isNew&&!s.isArchived).length,active:all.filter(s=>s.status==='active').length,archive:all.filter(s=>s.isArchived).length,debt:all.filter(s=>s.balance<0).length,grouped:all.filter(s=>s.groups.length>0).length};
    return res.json({ok:true,students:rows,summary});
  }catch(error){return err(res,500,'O‘quvchilarni yuklashda xatolik',error);}
});

router.get('/students-v095/:id',requireCenterAuth,async(req,res)=>{
  try{
    const base=await pool.query(LIST_SQL.replace("ORDER BY s.created_at DESC","AND s.id=$2 ORDER BY s.created_at DESC"),[req.centerUser.centerId,req.params.id]);
    if(!base.rows[0])return err(res,404,'O‘quvchi topilmadi');
    const id=req.params.id,cid=req.centerUser.centerId;
    const [payments,attendance,history]=await Promise.all([
      pool.query(`SELECT p.*,g.name group_name FROM center_payments p LEFT JOIN study_groups g ON g.id=p.group_id AND g.center_id=p.center_id WHERE p.center_id=$1 AND p.student_id=$2 ORDER BY p.paid_at DESC,p.created_at DESC LIMIT 100`,[cid,id]),
      pool.query(`SELECT a.*,g.name group_name FROM attendance a LEFT JOIN study_groups g ON g.id=a.group_id AND g.center_id=a.center_id WHERE a.center_id=$1 AND a.student_id=$2 ORDER BY a.lesson_date DESC,a.created_at DESC LIMIT 120`,[cid,id]),
      pool.query(`SELECT id,action,module,details,created_at FROM center_activity_logs WHERE center_id=$1 AND details::text ILIKE $2 ORDER BY created_at DESC LIMIT 60`,[cid,`%${id}%`]).catch(()=>({rows:[]}))
    ]);
    const student=mapStudent(base.rows[0]);
    return res.json({ok:true,student,payments:payments.rows.map(x=>({id:x.id,amount:num(x.amount),paymentType:x.payment_type,status:x.status,note:x.note||'',paidAt:x.paid_at,createdAt:x.created_at,groupId:x.group_id,groupName:x.group_name||''})),attendance:attendance.rows.map(x=>({id:x.id,groupId:x.group_id,groupName:x.group_name||'',lessonDate:x.lesson_date,status:x.status,note:x.note||'',createdAt:x.created_at})),history:history.rows});
  }catch(error){return err(res,500,'O‘quvchi profilini yuklashda xatolik',error);}
});

router.patch('/students-v095/:id/status',requireCenterAuth,async(req,res)=>{
  try{
    const status=clean(req.body?.status).toLowerCase();
    if(!['active','paused','inactive','archived'].includes(status))return err(res,400,'O‘quvchi holati noto‘g‘ri');
    const q=await pool.query(`UPDATE students SET status=$3,updated_at=NOW() WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted' RETURNING id,full_name,status`,[req.params.id,req.centerUser.centerId,status]);
    if(!q.rows[0])return err(res,404,'O‘quvchi topilmadi');
    await activity(req.centerUser.centerId,req.centerUser.id,status==='archived'?'O‘quvchi arxivlandi':'O‘quvchi holati yangilandi',{studentId:req.params.id,status});
    return res.json({ok:true,student:{id:q.rows[0].id,name:q.rows[0].full_name,status:q.rows[0].status}});
  }catch(error){return err(res,500,'O‘quvchi holatini saqlashda xatolik',error);}
});

router.put('/students-v095/:id/groups',requireCenterAuth,async(req,res)=>{
  const client=await pool.connect();
  try{
    const groupIds=Array.isArray(req.body?.groupIds)?[...new Set(req.body.groupIds.map(clean).filter(Boolean))]:[];
    await client.query('BEGIN');
    const student=await client.query(`SELECT id FROM students WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted'`,[req.params.id,req.centerUser.centerId]);
    if(!student.rows[0]){await client.query('ROLLBACK');client.release();return err(res,404,'O‘quvchi topilmadi');}
    if(groupIds.length){const valid=await client.query(`SELECT id FROM study_groups WHERE center_id=$1 AND id=ANY($2::uuid[]) AND COALESCE(status,'active')<>'deleted'`,[req.centerUser.centerId,groupIds]);if(valid.rows.length!==groupIds.length){await client.query('ROLLBACK');client.release();return err(res,400,'Guruhlardan biri topilmadi');}}
    await client.query(`UPDATE group_students SET status='removed',updated_at=NOW() WHERE center_id=$1 AND student_id=$2 AND status='active'`,[req.centerUser.centerId,req.params.id]);
    for(const gid of groupIds){await client.query(`INSERT INTO group_students(center_id,group_id,student_id,status,joined_at) VALUES($1,$2,$3,'active',CURRENT_DATE) ON CONFLICT(group_id,student_id) DO UPDATE SET status='active',updated_at=NOW()`,[req.centerUser.centerId,gid,req.params.id]);}
    await client.query('COMMIT');client.release();
    await activity(req.centerUser.centerId,req.centerUser.id,'O‘quvchi guruhlari yangilandi',{studentId:req.params.id,groupIds});
    return res.json({ok:true,groupIds});
  }catch(error){await client.query('ROLLBACK').catch(()=>{});client.release();return err(res,500,'O‘quvchi guruhlarini saqlashda xatolik',error);}
});

module.exports=router;
