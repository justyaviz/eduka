const express=require('express');
const pool=require('../db');
const {requireCenterAuth}=require('../middleware/center-auth');

const router=express.Router();
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const num=v=>{const n=Number(v||0);return Number.isFinite(n)?n:0};
const clean=v=>v==null?'':String(v).trim();
const isoDay=v=>/^\d{4}-\d{2}-\d{2}$/.test(clean(v))?clean(v):null;
function defaultRange(){const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return{from:`${y}-${m}-01`,to:`${y}-${m}-${day}`};}
function dayKey(v){if(!v)return'';if(v instanceof Date&&!Number.isNaN(v.getTime()))return v.toISOString().slice(0,10);return String(v).slice(0,10);}
function bump(map,key,amount=1){key=clean(key)||'Kiritilmagan';map[key]=(map[key]||0)+amount;}
function mapPairs(obj){return Object.entries(obj).map(([key,count])=>({key,count})).sort((a,b)=>b.count-a.count);}

router.get('/reports-v098',requireCenterAuth,async(req,res)=>{
 try{
  const centerId=req.centerUser.centerId,def=defaultRange(),from=isoDay(req.query.from)||def.from,to=isoDay(req.query.to)||def.to,rawBranch=clean(req.query.branchId),branchId=rawBranch&&rawBranch!=='all'?rawBranch:null;
  if(from>to)return res.status(400).json({ok:false,error:'Boshlanish sanasi tugash sanasidan katta bo‘lishi mumkin emas'});
  if(branchId&&!UUID_RE.test(branchId))return res.status(400).json({ok:false,error:'Filial ID noto‘g‘ri'});
  const [branchesQ,studentsQ,groupsQ,membersQ,leadsQ,paymentsQ,expensesQ,usersQ]=await Promise.all([
   pool.query(`SELECT id,name,is_main FROM center_branches WHERE center_id=$1 AND COALESCE(status,'active')<>'deleted' ORDER BY is_main DESC,name`,[centerId]),
   pool.query(`SELECT id,status,gender,created_at FROM students WHERE center_id=$1 AND COALESCE(status,'active')<>'deleted'`,[centerId]),
   pool.query(`SELECT g.id,g.name,g.course_name,g.teacher_name,g.branch_id,b.name branch_name,g.status FROM study_groups g LEFT JOIN center_branches b ON b.id=g.branch_id AND b.center_id=g.center_id WHERE g.center_id=$1 AND COALESCE(g.status,'active')<>'deleted'`,[centerId]),
   pool.query(`SELECT gs.student_id,gs.group_id FROM group_students gs JOIN study_groups g ON g.id=gs.group_id AND g.center_id=gs.center_id WHERE gs.center_id=$1 AND gs.status='active' AND COALESCE(g.status,'active')<>'deleted'`,[centerId]),
   pool.query(`SELECT id,status,source,assigned_to,next_contact_at,created_at FROM leads WHERE center_id=$1 AND COALESCE(status,'LEADS')<>'deleted' AND created_at >= $2::date AND created_at < ($3::date+INTERVAL '1 day')`,[centerId,from,to]),
   pool.query(`SELECT amount,payment_type,branch_id,paid_at FROM center_payments WHERE center_id=$1 AND status='paid' AND paid_at >= $2::date AND paid_at < ($3::date+INTERVAL '1 day')`,[centerId,from,to]),
   pool.query(`SELECT amount,branch_id,spent_at FROM center_expenses WHERE center_id=$1 AND spent_at >= $2::date AND spent_at < ($3::date+INTERVAL '1 day')`,[centerId,from,to]),
   pool.query(`SELECT id,full_name,role,branch_id FROM center_users WHERE center_id=$1 AND COALESCE(status,'active')='active'`,[centerId])
  ]);

  const branches=branchesQ.rows;if(branchId&&!branches.some(b=>String(b.id)===branchId))return res.status(404).json({ok:false,error:'Filial topilmadi'});
  const groupsAll=groupsQ.rows,members=membersQ.rows,users=usersQ.rows;
  const groupById=new Map(groupsAll.map(g=>[String(g.id),g]));
  const userById=new Map(users.map(u=>[String(u.id),u]));
  const studentBranches=new Map(),groupCounts=new Map();
  for(const m of members){const g=groupById.get(String(m.group_id));if(!g)continue;const sid=String(m.student_id);if(!studentBranches.has(sid))studentBranches.set(sid,new Set());if(g.branch_id)studentBranches.get(sid).add(String(g.branch_id));groupCounts.set(String(g.id),(groupCounts.get(String(g.id))||0)+1);}

  const students=studentsQ.rows.filter(s=>!branchId||(studentBranches.get(String(s.id))?.has(branchId)));
  const leads=leadsQ.rows.filter(l=>!branchId||(l.assigned_to&&String(userById.get(String(l.assigned_to))?.branch_id||'')===branchId));
  const payments=paymentsQ.rows.filter(p=>!branchId||String(p.branch_id||'')===branchId);
  const expenses=expensesQ.rows.filter(e=>!branchId||String(e.branch_id||'')===branchId);
  const groups=groupsAll.filter(g=>!branchId||String(g.branch_id||'')===branchId);
  const branchRows=branches.filter(b=>!branchId||String(b.id)===branchId);

  const studentStatus={},studentGender={};let activeStudents=0,archivedStudents=0,newStudents=0;
  for(const s of students){const status=clean(s.status)||'active';bump(studentStatus,status);bump(studentGender,clean(s.gender)||'Kiritilmagan');if(status==='active')activeStudents++;if(status==='archived'||status==='inactive')archivedStudents++;const d=dayKey(s.created_at);if(d>=from&&d<=to)newStudents++;}
  const leadStatus={},leadSource={};let converted=0,unassigned=0;for(const l of leads){const st=clean(l.status)||'LEADS';bump(leadStatus,st);bump(leadSource,clean(l.source)||'Manual');if(st==='Mijoz bo‘ldi')converted++;if(!l.assigned_to)unassigned++;}
  const income=payments.reduce((a,x)=>a+num(x.amount),0),expense=expenses.reduce((a,x)=>a+num(x.amount),0),days={},methods={};
  for(const p of payments){const k=dayKey(p.paid_at);days[k]=days[k]||{day:k,income:0,expenses:0};days[k].income+=num(p.amount);const mk=clean(p.payment_type)||'other';methods[mk]=methods[mk]||{key:mk,total:0,count:0};methods[mk].total+=num(p.amount);methods[mk].count++;}
  for(const e of expenses){const k=dayKey(e.spent_at);days[k]=days[k]||{day:k,income:0,expenses:0};days[k].expenses+=num(e.amount);}

  const managers=users.filter(u=>!branchId||String(u.branch_id||'')===branchId).map(u=>{const rows=leads.filter(l=>String(l.assigned_to||'')===String(u.id));const c=rows.filter(l=>l.status==='Mijoz bo‘ldi').length,over=rows.filter(l=>l.next_contact_at&&new Date(l.next_contact_at)<new Date()&&l.status!=='Mijoz bo‘ldi').length;return{id:u.id,name:u.full_name,role:u.role||'',branchId:u.branch_id,branchName:branches.find(b=>String(b.id)===String(u.branch_id))?.name||'',leadCount:rows.length,convertedCount:c,overdueCount:over,conversionRate:rows.length?Math.round(c/rows.length*1000)/10:0};}).filter(x=>x.leadCount>0).sort((a,b)=>b.convertedCount-a.convertedCount||b.leadCount-a.leadCount);

  const groupOut=groups.map(g=>({id:g.id,name:g.name,courseName:g.course_name||'',teacherName:g.teacher_name||'',branchId:g.branch_id,branchName:g.branch_name||'',status:g.status||'active',studentCount:groupCounts.get(String(g.id))||0})).sort((a,b)=>b.studentCount-a.studentCount||a.name.localeCompare(b.name));
  const branchOut=branchRows.map(b=>{const bid=String(b.id),gids=new Set(groupsAll.filter(g=>String(g.branch_id||'')===bid).map(g=>String(g.id))),sids=new Set(members.filter(m=>gids.has(String(m.group_id))).map(m=>String(m.student_id))),inc=paymentsQ.rows.filter(p=>String(p.branch_id||'')===bid).reduce((a,x)=>a+num(x.amount),0),exp=expensesQ.rows.filter(e=>String(e.branch_id||'')===bid).reduce((a,x)=>a+num(x.amount),0);return{id:b.id,name:b.name,isMain:b.is_main,groupCount:gids.size,studentCount:sids.size,income:inc,expenses:exp,profit:inc-exp};});
  const leadTotal=leads.length;
  return res.json({ok:true,range:{from,to},branchId:branchId||'all',meta:{branches},summary:{students:students.length,activeStudents,newStudents,archivedStudents,leads:leadTotal,convertedLeads:converted,conversionRate:leadTotal?Math.round(converted/leadTotal*1000)/10:0,income,expenses:expense,profit:income-expense,groups:groups.filter(x=>(x.status||'active')==='active').length,branches:branchOut.length,managers:managers.length},students:{byGender:mapPairs(studentGender),byStatus:mapPairs(studentStatus)},leads:{byStatus:mapPairs(leadStatus),bySource:mapPairs(leadSource),unassigned},finance:{income,expenses:expense,profit:income-expense,paymentCount:payments.length,expenseCount:expenses.length,byDay:Object.values(days).filter(x=>x.day).sort((a,b)=>a.day.localeCompare(b.day)),byMethod:Object.values(methods).sort((a,b)=>b.total-a.total)},groups:groupOut,branches:branchOut,managers});
 }catch(error){console.error('REPORTS_V098_ERROR',error.stack||error);return res.status(500).json({ok:false,error:'Hisobotlarni yuklashda xatolik'});}
});

module.exports=router;
