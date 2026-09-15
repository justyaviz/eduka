const express=require('express');
const pool=require('../db');
const {requireCenterAuth}=require('../middleware/center-auth');

const router=express.Router();
const PROD=process.env.NODE_ENV==='production';
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LEAD_SORT_MAP={
  name:'l.full_name',phone:'l.phone',source:'l.source',status:'l.status',assignedName:'u.full_name',nextContactAt:'l.next_contact_at',createdAt:'l.created_at'
};
const STUDENT_SORT_KEYS=new Set(['name','phone','status','balance','attendance','lastPaymentAt','createdAt']);
function clean(v){return v==null?'':String(v).trim();}
function int(v,fallback,min,max){const n=Number.parseInt(v,10);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;}
function num(v){const n=Number(v||0);return Number.isFinite(n)?n:0;}
function err(res,status,message,error){return res.status(status).json({ok:false,error:message,...(PROD||!error?{}:{realError:error.message,code:error.code||null})});}
function mapLead(r){return{id:r.id,name:r.full_name||'',fullName:r.full_name||'',phone:r.phone||'',source:r.source||'Manual',status:r.status||'LEADS',note:r.note||'',assignedTo:r.assigned_to||null,assignedName:r.assigned_name||'',nextContactAt:r.next_contact_at||null,createdAt:r.created_at,updatedAt:r.updated_at};}
function recent(createdAt){const t=new Date(createdAt||0).getTime();return Number.isFinite(t)&&t>=Date.now()-30*24*60*60*1000;}
function groupsOf(r){return Array.isArray(r.groups)?r.groups:[];}
function mapStudent(r){
  const groups=groupsOf(r),status=String(r.status||'active').toLowerCase();
  return{id:r.id,centerId:r.center_id,name:r.full_name,fullName:r.full_name,phone:r.phone||'',parentPhone:r.parent_phone||'',birthDate:r.birth_date,gender:r.gender||'',note:r.note||'',status,balance:num(r.balance),createdAt:r.created_at,updatedAt:r.updated_at,groups,groupName:groups.map(g=>g.name).filter(Boolean).join(', '),totalPaid:num(r.total_paid),lastPaymentAt:r.last_payment_at||null,attendance:{total:Number(r.attendance_total||0),present:Number(r.attendance_present||0),absent:Number(r.attendance_absent||0),late:Number(r.attendance_late||0)},isNew:recent(r.created_at),isArchived:['archived','inactive'].includes(status)};
}
function attendancePct(s){const total=Number(s.attendance?.total||0);return total?Math.round(Number(s.attendance?.present||0)*100/total):0;}
function studentSortValue(s,key){
  if(key==='name')return String(s.name||'').toLocaleLowerCase('uz');
  if(key==='phone')return String(s.phone||'');
  if(key==='status')return String(s.status||'');
  if(key==='balance')return Number(s.balance||0);
  if(key==='attendance')return attendancePct(s);
  if(key==='lastPaymentAt')return s.lastPaymentAt?new Date(s.lastPaymentAt).getTime():null;
  return s.createdAt?new Date(s.createdAt).getTime():null;
}
function sortStudents(rows,key,order){
  const dir=order==='asc'?1:-1;
  return rows.slice().sort((a,b)=>{
    const av=studentSortValue(a,key),bv=studentSortValue(b,key);
    if(av==null&&bv==null)return 0;if(av==null)return 1;if(bv==null)return-1;
    if(typeof av==='number'&&typeof bv==='number')return(av-bv)*dir;
    return String(av).localeCompare(String(bv),'uz',{numeric:true,sensitivity:'base'})*dir;
  });
}

const STUDENT_LIST_SQL=`SELECT s.*,
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

router.get('/leads-v200',requireCenterAuth,async(req,res)=>{
  try{
    const centerId=req.centerUser.centerId;
    const q=clean(req.query.q),status=clean(req.query.status),source=clean(req.query.source),assignedTo=clean(req.query.assignedTo);
    const limit=int(req.query.limit,50,1,100),requestedPage=int(req.query.page,1,1,1000000);
    const sortBy=LEAD_SORT_MAP[clean(req.query.sortBy)]?clean(req.query.sortBy):'createdAt';
    const sortOrder=String(req.query.sortOrder||'desc').toLowerCase()==='asc'?'asc':'desc';
    const params=[centerId];let where=`l.center_id=$1 AND COALESCE(l.status,'LEADS')<>'deleted'`;
    if(q){params.push(`%${q}%`);where+=` AND (l.full_name ILIKE $${params.length} OR l.phone ILIKE $${params.length} OR l.note ILIKE $${params.length})`;}
    if(status&&status!=='all'){params.push(status);where+=` AND l.status=$${params.length}`;}
    if(source&&source!=='all'){params.push(source);where+=` AND l.source=$${params.length}`;}
    if(assignedTo&&assignedTo!=='all'){
      if(assignedTo==='unassigned')where+=` AND l.assigned_to IS NULL`;
      else{if(!UUID_RE.test(assignedTo))return err(res,400,'Xodim ID noto‘g‘ri');params.push(assignedTo);where+=` AND l.assigned_to=$${params.length}`;}
    }
    const countQ=await pool.query(`SELECT COUNT(*)::int total FROM leads l WHERE ${where}`,params);
    const total=Number(countQ.rows[0]?.total||0),totalPages=Math.max(1,Math.ceil(total/limit)),page=Math.min(requestedPage,totalPages),offset=(page-1)*limit;
    const queryParams=[...params,limit,offset],limitIndex=queryParams.length-1,offsetIndex=queryParams.length,orderExpr=LEAD_SORT_MAP[sortBy];
    const rowsQ=await pool.query(`SELECT l.*,u.full_name assigned_name FROM leads l LEFT JOIN center_users u ON u.id=l.assigned_to AND u.center_id=l.center_id WHERE ${where} ORDER BY ${orderExpr} ${sortOrder.toUpperCase()} NULLS LAST,l.created_at DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}`,queryParams);
    const summaryQ=await pool.query(`SELECT COUNT(*) FILTER (WHERE COALESCE(status,'LEADS')<>'deleted')::int total,COUNT(*) FILTER (WHERE COALESCE(status,'LEADS')='LEADS')::int unworked,COUNT(*) FILTER (WHERE status='interested')::int callbacks,COUNT(*) FILTER (WHERE status='Mijoz bo‘ldi')::int won FROM leads WHERE center_id=$1`,[centerId]);
    const summary=summaryQ.rows[0]||{total:0,unworked:0,callbacks:0,won:0};summary.conversion=summary.total?Math.round((summary.won/summary.total)*100):0;
    return res.json({ok:true,leads:rowsQ.rows.map(mapLead),pagination:{page,limit,total,totalPages,sortBy,sortOrder},summary});
  }catch(error){return err(res,500,'Lidlarni yuklashda xatolik',error);}
});

router.get('/students-v200',requireCenterAuth,async(req,res)=>{
  try{
    const centerId=req.centerUser.centerId;
    const q=await pool.query(STUDENT_LIST_SQL,[centerId]);
    const all=q.rows.map(mapStudent);
    let rows=all.slice();
    const search=clean(req.query.q).toLowerCase(),tab=clean(req.query.tab)||'active',groupId=clean(req.query.groupId),courseId=clean(req.query.courseId),branchId=clean(req.query.branchId),gender=clean(req.query.gender),balance=clean(req.query.balance);
    const limit=int(req.query.limit,50,1,100),requestedPage=int(req.query.page,1,1,1000000);
    const sortBy=STUDENT_SORT_KEYS.has(clean(req.query.sortBy))?clean(req.query.sortBy):'createdAt';
    const sortOrder=String(req.query.sortOrder||'desc').toLowerCase()==='asc'?'asc':'desc';
    if(search)rows=rows.filter(s=>[s.name,s.phone,s.parentPhone,s.groupName,...s.groups.map(g=>g.courseName)].some(v=>String(v||'').toLowerCase().includes(search)));
    if(tab==='new')rows=rows.filter(s=>s.isNew&&!s.isArchived);
    else if(tab==='active')rows=rows.filter(s=>s.status==='active');
    else if(tab==='archive')rows=rows.filter(s=>s.isArchived);
    if(groupId)rows=rows.filter(s=>s.groups.some(g=>String(g.id)===groupId));
    if(courseId)rows=rows.filter(s=>s.groups.some(g=>String(g.courseId)===courseId));
    if(branchId&&branchId!=='all')rows=rows.filter(s=>s.groups.some(g=>String(g.branchId)===branchId));
    if(gender)rows=rows.filter(s=>String(s.gender||'')===gender);
    if(balance==='debt')rows=rows.filter(s=>s.balance<0);else if(balance==='zero')rows=rows.filter(s=>s.balance===0);else if(balance==='positive')rows=rows.filter(s=>s.balance>0);
    rows=sortStudents(rows,sortBy,sortOrder);
    const total=rows.length,totalPages=Math.max(1,Math.ceil(total/limit)),page=Math.min(requestedPage,totalPages),offset=(page-1)*limit;
    const summary={total:all.length,new:all.filter(s=>s.isNew&&!s.isArchived).length,active:all.filter(s=>s.status==='active').length,archive:all.filter(s=>s.isArchived).length,debt:all.filter(s=>s.balance<0).length,grouped:all.filter(s=>s.groups.length>0).length};
    return res.json({ok:true,students:rows.slice(offset,offset+limit),summary,pagination:{page,limit,total,totalPages,sortBy,sortOrder}});
  }catch(error){return err(res,500,'O‘quvchilarni yuklashda xatolik',error);}
});

module.exports=router;
