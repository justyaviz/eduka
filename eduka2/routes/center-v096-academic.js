const express=require('express');
const pool=require('../db');
const {requireCenterAuth}=require('../middleware/center-auth');

const router=express.Router();
const PROD=process.env.NODE_ENV==='production';
function clean(v){return v==null?'':String(v).trim();}
function num(v){const n=Number(v||0);return Number.isFinite(n)?n:0;}
function err(res,status,message,error){return res.status(status).json({ok:false,error:message,...(PROD||!error?{}:{realError:error.message,code:error.code||null})});}
function teacherMap(r){return {id:r.id,name:r.full_name,fullName:r.full_name,phone:r.phone||'',subject:r.subject||'',salary:num(r.salary),birthDate:r.birth_date,gender:r.gender||'',photoUrl:r.photo_url||'',status:r.status||'active',createdAt:r.created_at,groupCount:Number(r.group_count||0),studentCount:Number(r.student_count||0),branchCount:Number(r.branch_count||0),attendanceTotal:Number(r.attendance_total||0),attendancePresent:Number(r.attendance_present||0),attendanceAbsent:Number(r.attendance_absent||0),attendanceLate:Number(r.attendance_late||0)};}

const TEACHERS_SQL=`SELECT t.*,
 (SELECT COUNT(*)::int FROM study_groups g WHERE g.center_id=t.center_id AND g.teacher_id=t.id AND COALESCE(g.status,'active')<>'deleted') group_count,
 (SELECT COUNT(DISTINCT gs.student_id)::int FROM study_groups g JOIN group_students gs ON gs.group_id=g.id AND gs.center_id=g.center_id AND gs.status='active' WHERE g.center_id=t.center_id AND g.teacher_id=t.id AND COALESCE(g.status,'active')<>'deleted') student_count,
 (SELECT COUNT(DISTINCT g.branch_id)::int FROM study_groups g WHERE g.center_id=t.center_id AND g.teacher_id=t.id AND g.branch_id IS NOT NULL AND COALESCE(g.status,'active')<>'deleted') branch_count,
 (SELECT COUNT(*)::int FROM attendance a JOIN study_groups g ON g.id=a.group_id AND g.center_id=a.center_id WHERE a.center_id=t.center_id AND g.teacher_id=t.id) attendance_total,
 (SELECT COUNT(*)::int FROM attendance a JOIN study_groups g ON g.id=a.group_id AND g.center_id=a.center_id WHERE a.center_id=t.center_id AND g.teacher_id=t.id AND a.status='present') attendance_present,
 (SELECT COUNT(*)::int FROM attendance a JOIN study_groups g ON g.id=a.group_id AND g.center_id=a.center_id WHERE a.center_id=t.center_id AND g.teacher_id=t.id AND a.status='absent') attendance_absent,
 (SELECT COUNT(*)::int FROM attendance a JOIN study_groups g ON g.id=a.group_id AND g.center_id=a.center_id WHERE a.center_id=t.center_id AND g.teacher_id=t.id AND a.status='late') attendance_late
 FROM teachers t WHERE t.center_id=$1 AND COALESCE(t.status,'active')<>'deleted'`;

router.get('/teachers-v096',requireCenterAuth,async(req,res)=>{
 try{
  const q=await pool.query(TEACHERS_SQL+' ORDER BY t.created_at DESC',[req.centerUser.centerId]);
  const teachers=q.rows.map(teacherMap);const search=clean(req.query.q).toLowerCase();
  const rows=search?teachers.filter(t=>[t.name,t.phone,t.subject].some(v=>String(v||'').toLowerCase().includes(search))):teachers;
  return res.json({ok:true,teachers:rows,summary:{total:teachers.length,active:teachers.filter(t=>String(t.status).toLowerCase()==='active').length,assigned:teachers.filter(t=>t.groupCount>0).length,subjects:new Set(teachers.map(t=>t.subject).filter(Boolean)).size,monthlySalary:teachers.reduce((a,t)=>a+t.salary,0)}});
 }catch(error){return err(res,500,'O‘qituvchilarni yuklashda xatolik',error);}
});

router.get('/teachers-v096/:id',requireCenterAuth,async(req,res)=>{
 try{
  const t=await pool.query(TEACHERS_SQL+' AND t.id=$2 LIMIT 1',[req.centerUser.centerId,req.params.id]);
  if(!t.rows[0])return err(res,404,'O‘qituvchi topilmadi');
  const cid=req.centerUser.centerId,id=req.params.id;
  const [groups,attendance]=await Promise.all([
   pool.query(`SELECT g.id,g.name,g.course_id,g.room_id,g.branch_id,g.days_text,g.lesson_time,g.started_at,g.ended_at,g.group_type,COALESCE(c.name,g.course_name,'') course_name,COALESCE(r.name,g.room_name,'') room_name,COALESCE(b.name,'') branch_name,COUNT(gs.student_id) FILTER(WHERE gs.status='active')::int student_count FROM study_groups g LEFT JOIN courses c ON c.id=g.course_id AND c.center_id=g.center_id LEFT JOIN rooms r ON r.id=g.room_id AND r.center_id=g.center_id LEFT JOIN center_branches b ON b.id=g.branch_id AND b.center_id=g.center_id LEFT JOIN group_students gs ON gs.group_id=g.id AND gs.center_id=g.center_id WHERE g.center_id=$1 AND g.teacher_id=$2 AND COALESCE(g.status,'active')<>'deleted' GROUP BY g.id,c.id,r.id,b.id ORDER BY g.name`,[cid,id]),
   pool.query(`SELECT a.lesson_date,a.status,a.note,g.id group_id,g.name group_name,s.id student_id,s.full_name student_name FROM attendance a JOIN study_groups g ON g.id=a.group_id AND g.center_id=a.center_id JOIN students s ON s.id=a.student_id AND s.center_id=a.center_id WHERE a.center_id=$1 AND g.teacher_id=$2 ORDER BY a.lesson_date DESC,a.created_at DESC LIMIT 150`,[cid,id])
  ]);
  return res.json({ok:true,teacher:teacherMap(t.rows[0]),groups:groups.rows.map(g=>({id:g.id,name:g.name,courseId:g.course_id,courseName:g.course_name,roomId:g.room_id,roomName:g.room_name,branchId:g.branch_id,branchName:g.branch_name,days:g.days_text||'',lessonTime:g.lesson_time||'',startDate:g.started_at,endDate:g.ended_at,groupType:g.group_type||'standard',studentCount:Number(g.student_count||0)})),attendance:attendance.rows.map(a=>({lessonDate:a.lesson_date,status:a.status,note:a.note||'',groupId:a.group_id,groupName:a.group_name,studentId:a.student_id,studentName:a.student_name}))});
 }catch(error){return err(res,500,'O‘qituvchi profilini yuklashda xatolik',error);}
});

router.get('/academic-overview-v096',requireCenterAuth,async(req,res)=>{
 try{
  const cid=req.centerUser.centerId;
  const [courses,rooms,groups,settings]=await Promise.all([
   pool.query(`SELECT c.*,COUNT(g.id) FILTER(WHERE COALESCE(g.status,'active')<>'deleted')::int group_count FROM courses c LEFT JOIN study_groups g ON g.course_id=c.id AND g.center_id=c.center_id WHERE c.center_id=$1 AND COALESCE(c.status,'active')<>'deleted' GROUP BY c.id ORDER BY c.name`,[cid]),
   pool.query(`SELECT r.*,COUNT(g.id) FILTER(WHERE COALESCE(g.status,'active')<>'deleted')::int group_count FROM rooms r LEFT JOIN study_groups g ON g.room_id=r.id AND g.center_id=r.center_id WHERE r.center_id=$1 AND COALESCE(r.status,'active')<>'deleted' GROUP BY r.id ORDER BY r.name`,[cid]),
   pool.query(`SELECT COUNT(*)::int count FROM study_groups WHERE center_id=$1 AND COALESCE(status,'active')<>'deleted'`,[cid]),
   pool.query(`SELECT value FROM center_settings WHERE center_id=$1 AND key='academic.levels.v1' LIMIT 1`,[cid])
  ]);
  let levels=[];try{levels=JSON.parse(settings.rows[0]?.value||'[]');if(!Array.isArray(levels))levels=[];}catch{levels=[];}
  return res.json({ok:true,courses:courses.rows.map(c=>({id:c.id,name:c.name,code:c.code||'',price:num(c.price),lessonDuration:c.lesson_duration||'',durationMonths:Number(c.duration_months||1),note:c.note||'',status:c.status,groupCount:Number(c.group_count||0)})),rooms:rooms.rows.map(r=>({id:r.id,name:r.name,capacity:Number(r.capacity||0),status:r.status,groupCount:Number(r.group_count||0)})),levels,summary:{courses:courses.rows.length,rooms:rooms.rows.length,levels:levels.filter(x=>x.active!==false).length,groups:Number(groups.rows[0]?.count||0)}});
 }catch(error){return err(res,500,'O‘quv bo‘limini yuklashda xatolik',error);}
});

module.exports=router;
