// One-way cutover reads existing canonical records and mirrors CRM edits back to
// canonical tables, keeping CEO totals and existing integrations consistent.
const date=v=>v?(v instanceof Date?v.toISOString():String(v)).slice(0,10):'';
const text=v=>v==null?'':String(v);
const num=v=>Number(v)||0;
const status=v=>['archived','inactive','deleted'].includes(v)?'Arxiv':v==='frozen'?'Muzlatilgan':'Faol';
const canonicalStatus=r=>r.deleted?'deleted':r.data.status==='Arxiv'?'archived':r.data.status==='Muzlatilgan'?'frozen':'active';
const maps={
 branches:['center_branches',r=>({name:r.name,phone:text(r.phone),address:text(r.address),status:status(r.status)})],
 courses:['courses',r=>({name:r.name,monthlyPrice:num(r.price),note:text(r.note)})],
 rooms:['rooms',r=>({name:r.name,capacity:num(r.capacity)})],
 cash:['finance_cashboxes',r=>({name:r.name,status:status(r.status)})],
 employees:['teachers',r=>({name:r.full_name,phone:text(r.phone),status:status(r.status)})],
 groups:['study_groups',r=>({name:r.name,course:text(r.course_id),teacher:text(r.teacher_id),room:text(r.room_id),branch:text(r.branch_id),days:text(r.days_text),time:text(r.lesson_time).slice(0,5),startDate:date(r.started_at),endDate:date(r.ended_at),price:num(r.monthly_price),status:status(r.status)})],
 students:['students',r=>({name:r.full_name,phone:text(r.phone),parentPhone:text(r.parent_phone),birthDate:date(r.birth_date),note:text(r.note),status:status(r.status)})],
 enrollments:['group_students',r=>({student:text(r.student_id),group:text(r.group_id),startDate:date(r.joined_at||r.created_at),status:r.status==='active'?'Faol':'Yakunlangan'})],
 attendance:['attendance',r=>({student:text(r.student_id),group:text(r.group_id),date:date(r.lesson_date),status:({present:'Keldi',absent:'Sababsiz',late:'Kechikdi',excused:'Sababli'})[r.status]||'Sababli',note:text(r.note)})],
 tasks:['reminders',r=>({name:r.title,date:date(r.remind_at||r.created_at),status:r.status==='done'?'Bajarilgan':'Yangi',note:text(r.note)})],
 transactions:['center_payments',r=>({name:'To‘lov',student:text(r.student_id),group:text(r.group_id),branch:text(r.branch_id),cash:text(r.cashbox_id),amount:num(r.amount),direction:'Kirim',date:date(r.paid_at||r.created_at),paymentMethod:({cash:'Naqd',card:'Karta',bank:'Bank o‘tkazmasi'})[r.payment_type]||'Naqd',note:text(r.note)})],
 orders:['leads',r=>({name:text(r.full_name),phone:text(r.phone),source:text(r.source),status:({LEADS:'Yangi',interested:'Imtihonga yozildi','Mijoz bo‘ldi':'Shartnoma',lost:'Bekor qilindi'})[r.status]||'Yangi',note:text(r.note)})]
};
async function importLegacy(db,center){
 for(const [entity,[table,map]] of Object.entries(maps)){
  const rows=(await db.query(`SELECT * FROM ${table} WHERE center_id=$1`,[center])).rows;
  for(const row of rows){
   const data=map(row);
   if(entity==='students'){
    const paid=await db.query("SELECT COALESCE(SUM(amount),0) total FROM center_payments WHERE center_id=$1 AND student_id=$2 AND status='paid'",[center,row.id]);
    data.openingBalance=num(row.balance)-num(paid.rows[0].total);
   }
   if(entity==='employees')data.legacyKind='teacher';
   const deleted=row.status==='deleted'||entity==='transactions'&&row.status!=='paid'?1:0;
   await db.query('INSERT INTO eduka_records(id,center_id,entity,data,deleted,created_at,updated_at) VALUES($1,$2,$3,$4,$5,COALESCE($6,NOW()),COALESCE($7,NOW())) ON CONFLICT(id) DO NOTHING',[row.id,center,entity,JSON.stringify(data),deleted,row.created_at,row.updated_at||row.created_at]);
  }
 }
 const staff=(await db.query('SELECT id,full_name,email,branch_id,status,created_at,updated_at FROM center_users WHERE center_id=$1',[center])).rows;
 for(const r of staff)await db.query("INSERT INTO eduka_records(id,center_id,entity,data,created_at,updated_at) VALUES($1,$2,'employees',$3,$4,$5) ON CONFLICT(id) DO NOTHING",[r.id,center,JSON.stringify({name:r.full_name,email:r.email,branch:r.branch_id||'',status:status(r.status),legacyKind:'staff'}),r.created_at,r.updated_at]);
 const expenses=(await db.query('SELECT * FROM center_expenses WHERE center_id=$1',[center])).rows;
 for(const r of expenses)await db.query("INSERT INTO eduka_records(id,center_id,entity,data,created_at) VALUES($1,$2,'transactions',$3,$4) ON CONFLICT(id) DO NOTHING",[r.id,center,JSON.stringify({name:r.title,amount:num(r.amount),cash:text(r.cashbox_id),branch:text(r.branch_id),direction:'Chiqim',date:date(r.spent_at),paymentMethod:'Naqd',note:text(r.note),legacyKind:'expense'}),r.created_at]);
}
async function upsert(db,table,id,center,values){
 const keys=Object.keys(values),args=[id,center,...Object.values(values)];
 await db.query(`INSERT INTO ${table}(id,center_id,${keys.join(',')}) VALUES(${args.map((_,i)=>'$'+(i+1)).join(',')}) ON CONFLICT(id) DO UPDATE SET ${keys.map(k=>`${k}=EXCLUDED.${k}`).join(',')} WHERE ${table}.center_id=EXCLUDED.center_id`,args);
}
async function syncCanonical(db,r,center){
 await db.query("SELECT set_config('eduka.workspace_write','1',true)");
 const d=r.data,s=canonicalStatus(r),n=[d.name,d.surname].filter(Boolean).join(' '),ref=v=>v||null;
 const write=(table,values)=>upsert(db,table,r.id,center,values);
 switch(r.entity){
 case 'students':await write('students',{full_name:n,phone:d.phone||'',parent_phone:d.parentPhone||'',birth_date:ref(d.birthDate),note:d.note||'',status:s,updated_at:new Date()});
  if(d.group&&!r.deleted){const e=(await db.query("INSERT INTO group_students(center_id,group_id,student_id,status,joined_at) VALUES($1,$2,$3,'active',CURRENT_DATE) ON CONFLICT(group_id,student_id) DO UPDATE SET status='active' WHERE group_students.center_id=EXCLUDED.center_id RETURNING *",[center,d.group,r.id])).rows[0];if(e)await db.query("INSERT INTO eduka_records(id,center_id,entity,data) VALUES($1,$2,'enrollments',$3) ON CONFLICT(id) DO NOTHING",[e.id,center,JSON.stringify({student:r.id,group:d.group,startDate:date(e.joined_at),status:'Faol'})]);}break;
 case 'branches':await write('center_branches',{name:n,phone:d.phone||'',address:d.address||'',status:s,updated_at:new Date()});break;
 case 'courses':await write('courses',{name:n,price:num(d.monthlyPrice),note:d.note||'',status:s,updated_at:new Date()});break;
 case 'rooms':await write('rooms',{name:n,capacity:num(d.capacity),status:s,updated_at:new Date()});break;
 case 'cash':await write('finance_cashboxes',{name:n,status:s,updated_at:new Date()});break;
 case 'employees':
  if(d.legacyKind==='staff')await db.query('UPDATE center_users SET full_name=$3,email=COALESCE(NULLIF($4,\'\'),email),status=$5,branch_id=$6,updated_at=NOW() WHERE id=$1 AND center_id=$2',[r.id,center,n,d.email||'',s==='active'?'active':'inactive',ref(d.branch)]);
  else await write('teachers',{full_name:n,phone:d.phone||'',status:s,updated_at:new Date()});break;
 case 'groups':if(d.teacher){const t=(await db.query("SELECT data FROM eduka_records WHERE id=$1 AND center_id=$2 AND entity='employees'",[d.teacher,center])).rows[0];if(t)await db.query("INSERT INTO teachers(id,center_id,full_name,phone,status) VALUES($1,$2,$3,$4,'active') ON CONFLICT(id) DO NOTHING",[d.teacher,center,[t.data.name,t.data.surname].filter(Boolean).join(' '),t.data.phone||'']);}await write('study_groups',{name:n,course_id:ref(d.course),teacher_id:ref(d.teacher),room_id:ref(d.room),branch_id:ref(d.branch),days_text:d.days||'',lesson_time:d.time||'',started_at:ref(d.startDate),ended_at:ref(d.endDate),monthly_price:num(d.price),status:s,updated_at:new Date()});break;
 case 'enrollments':await db.query("INSERT INTO group_students(id,center_id,group_id,student_id,status,joined_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(group_id,student_id) DO UPDATE SET status=EXCLUDED.status,joined_at=EXCLUDED.joined_at,updated_at=NOW() WHERE group_students.center_id=EXCLUDED.center_id",[r.id,center,d.group,d.student,r.deleted||d.status!=='Faol'?'removed':'active',d.startDate]);break;
 case 'attendance':await db.query("INSERT INTO attendance(id,center_id,group_id,student_id,lesson_date,status,note) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(group_id,student_id,lesson_date) DO UPDATE SET status=EXCLUDED.status,note=EXCLUDED.note WHERE attendance.center_id=EXCLUDED.center_id",[r.id,center,d.group,d.student,d.date,r.deleted?'cancelled':({Keldi:'present',Sababsiz:'absent',Kechikdi:'late',Sababli:'excused'})[d.status]||'excused',d.note||'']);break;
 case 'orders':await write('leads',{full_name:n||'Buyurtma',phone:d.phone||'',source:d.source||'',status:r.deleted?'deleted':({Yangi:'LEADS','Imtihonga yozildi':'interested',Shartnoma:'Mijoz bo‘ldi','Bekor qilindi':'lost'})[d.status]||d.status,note:d.note||'',updated_at:new Date()});break;
 case 'tasks':await write('reminders',{title:n,remind_at:d.date+(d.time?'T'+d.time: 'T09:00'),note:d.note||'',status:r.deleted?'deleted':d.status==='Bajarilgan'?'done':'active',updated_at:new Date()});break;
 case 'transactions':
  if(d.direction==='Kirim')await write('center_payments',{student_id:ref(d.student),group_id:ref(d.group),cashbox_id:ref(d.cash),branch_id:ref(d.branch),amount:num(d.amount),payment_type:({'Naqd':'cash','Karta':'card','Bank o‘tkazmasi':'bank'})[d.paymentMethod]||'cash',status:r.deleted?'cancelled':'paid',note:d.note||'',paid_at:d.date});
  else await write('center_expenses',{title:n,amount:r.deleted?0:num(d.amount),cashbox_id:ref(d.cash),branch_id:ref(d.branch),spent_at:d.date,note:d.note||''});break;
 }
 if(['students','transactions','charges','discounts'].includes(r.entity)){
  const ids=r.entity==='students'?[r.id]:[d.student].filter(Boolean);
  for(const id of ids){const all=(await db.query("SELECT entity,data FROM eduka_records WHERE center_id=$1 AND deleted=0 AND (id=$2 OR data->>'student'=$3)",[center,id,id])).rows;let balance=num(all.find(x=>x.entity==='students')?.data.openingBalance);for(const x of all){const amount=num(x.data.amount);if(x.entity==='transactions')balance+=x.data.direction==='Kirim'?amount:-amount;if(x.entity==='charges')balance-=amount;if(x.entity==='discounts')balance+=amount}await db.query('UPDATE students SET balance=$3 WHERE id=$1 AND center_id=$2',[id,center,balance]);}
 }
 if(['students','branches'].includes(r.entity))await db.query("UPDATE centers SET students_count=(SELECT COUNT(*) FROM students WHERE center_id=$1 AND status='active'),branches_count=(SELECT COUNT(*) FROM center_branches WHERE center_id=$1 AND status<>'deleted') WHERE id=$1",[center]);
}
module.exports={importLegacy,syncCanonical,maps};
