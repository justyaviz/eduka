const express=require('express');
const pool=require('../db');
const {requireCenterAuth}=require('../middleware/center-auth');

const router=express.Router();
const PROD=process.env.NODE_ENV==='production';
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function clean(v){return v==null?'':String(v).trim();}
function err(res,status,message,error){return res.status(status).json({ok:false,error:message,...(PROD||!error?{}:{realError:error.message,code:error.code||null})});}
function mapLead(r){return{id:r.id,name:r.full_name||'',fullName:r.full_name||'',phone:r.phone||'',source:r.source||'Manual',status:r.status||'LEADS',note:r.note||'',assignedTo:r.assigned_to||null,assignedName:r.assigned_name||'',nextContactAt:r.next_contact_at||null,createdAt:r.created_at,updatedAt:r.updated_at};}
async function validStaff(centerId,id,client=pool){if(!id)return null;if(!UUID_RE.test(String(id)))return false;const q=await client.query(`SELECT id,full_name FROM center_users WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')='active' LIMIT 1`,[id,centerId]);return q.rows[0]||false;}
async function activity(centerId,userId,action,details={}){try{await pool.query(`INSERT INTO center_activity_logs(center_id,user_id,action,module,details) VALUES($1,$2,$3,'leads',$4)`,[centerId,userId||null,action,JSON.stringify(details)]);}catch(e){console.error('Lead v093 activity failed:',e.message);}}

router.get('/leads-v093',requireCenterAuth,async(req,res)=>{
  try{
    const centerId=req.centerUser.centerId,q=clean(req.query.q),status=clean(req.query.status),source=clean(req.query.source),assignedTo=clean(req.query.assignedTo);
    const params=[centerId];let where=`l.center_id=$1 AND COALESCE(l.status,'LEADS')<>'deleted'`;
    if(q){params.push(`%${q}%`);where+=` AND (l.full_name ILIKE $${params.length} OR l.phone ILIKE $${params.length} OR l.note ILIKE $${params.length})`;}
    if(status&&status!=='all'){params.push(status);where+=` AND l.status=$${params.length}`;}
    if(source&&source!=='all'){params.push(source);where+=` AND l.source=$${params.length}`;}
    if(assignedTo&&assignedTo!=='all'){
      if(assignedTo==='unassigned')where+=` AND l.assigned_to IS NULL`;
      else{if(!UUID_RE.test(assignedTo))return err(res,400,'Xodim ID noto‘g‘ri');params.push(assignedTo);where+=` AND l.assigned_to=$${params.length}`;}
    }
    const result=await pool.query(`SELECT l.*,u.full_name assigned_name FROM leads l LEFT JOIN center_users u ON u.id=l.assigned_to AND u.center_id=l.center_id WHERE ${where} ORDER BY COALESCE(l.next_contact_at,l.created_at) ASC,l.created_at DESC`,params);
    return res.json({ok:true,leads:result.rows.map(mapLead)});
  }catch(error){return err(res,500,'Lidlarni yuklashda xatolik',error);}
});

router.post('/leads-v093',requireCenterAuth,async(req,res)=>{
  try{
    const b=req.body||{},name=clean(b.name||b.fullName),phone=clean(b.phone),assigned=clean(b.assignedTo)||null;
    if(!name&&!phone)return err(res,400,'Ism yoki telefon kerak');
    if(assigned&&!(await validStaff(req.centerUser.centerId,assigned)))return err(res,400,'Tanlangan xodim topilmadi');
    const q=await pool.query(`INSERT INTO leads(center_id,full_name,phone,source,status,note,assigned_to,next_contact_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[req.centerUser.centerId,name||null,phone||null,clean(b.source)||'Manual',clean(b.status)||'LEADS',clean(b.note)||null,assigned,b.nextContactAt||null]);
    const row=q.rows[0],staff=assigned?await validStaff(req.centerUser.centerId,assigned):null;
    await activity(req.centerUser.centerId,req.centerUser.id,'Yangi lid qo‘shildi',{leadId:row.id,assignedTo:assigned});
    return res.status(201).json({ok:true,lead:mapLead({...row,assigned_name:staff?.full_name||''})});
  }catch(error){return err(res,500,'Lid yaratishda xatolik',error);}
});

router.patch('/leads-v093/:id',requireCenterAuth,async(req,res)=>{
  try{
    const b=req.body||{},centerId=req.centerUser.centerId;
    const assignedProvided=Object.prototype.hasOwnProperty.call(b,'assignedTo');
    const nextProvided=Object.prototype.hasOwnProperty.call(b,'nextContactAt');
    const noteProvided=Object.prototype.hasOwnProperty.call(b,'note');
    const assigned=assignedProvided?(clean(b.assignedTo)||null):null;
    if(assignedProvided&&assigned&&!(await validStaff(centerId,assigned)))return err(res,400,'Tanlangan xodim topilmadi');
    const q=await pool.query(`UPDATE leads SET
      full_name=COALESCE($3,full_name),phone=COALESCE($4,phone),source=COALESCE($5,source),status=COALESCE($6,status),
      note=CASE WHEN $7::boolean THEN $8 ELSE note END,
      assigned_to=CASE WHEN $9::boolean THEN $10::uuid ELSE assigned_to END,
      next_contact_at=CASE WHEN $11::boolean THEN $12::timestamp ELSE next_contact_at END,
      updated_at=NOW()
      WHERE id=$1 AND center_id=$2 AND COALESCE(status,'LEADS')<>'deleted' RETURNING *`,[
        req.params.id,centerId,clean(b.name||b.fullName)||null,clean(b.phone)||null,clean(b.source)||null,clean(b.status)||null,
        noteProvided,noteProvided?(clean(b.note)||null):null,assignedProvided,assigned,nextProvided,nextProvided?(b.nextContactAt||null):null
      ]);
    if(!q.rows[0])return err(res,404,'Lid topilmadi');
    const staff=q.rows[0].assigned_to?await validStaff(centerId,q.rows[0].assigned_to):null;
    await activity(centerId,req.centerUser.id,'Lid yangilandi',{leadId:req.params.id,status:q.rows[0].status,assignedTo:q.rows[0].assigned_to});
    return res.json({ok:true,lead:mapLead({...q.rows[0],assigned_name:staff?.full_name||''})});
  }catch(error){return err(res,500,'Lidni yangilashda xatolik',error);}
});

router.delete('/leads-v093/:id',requireCenterAuth,async(req,res)=>{
  try{const q=await pool.query(`UPDATE leads SET status='deleted',updated_at=NOW() WHERE id=$1 AND center_id=$2 AND COALESCE(status,'LEADS')<>'deleted' RETURNING id`,[req.params.id,req.centerUser.centerId]);if(!q.rows[0])return err(res,404,'Lid topilmadi');await activity(req.centerUser.centerId,req.centerUser.id,'Lid o‘chirildi',{leadId:req.params.id});return res.json({ok:true});}catch(error){return err(res,500,'Lidni o‘chirishda xatolik',error);}
});

router.post('/leads-v093/:id/convert',requireCenterAuth,async(req,res)=>{
  const client=await pool.connect();
  try{
    const centerId=req.centerUser.centerId,b=req.body||{};await client.query('BEGIN');
    const leadQ=await client.query(`SELECT * FROM leads WHERE id=$1 AND center_id=$2 AND COALESCE(status,'LEADS')<>'deleted' FOR UPDATE`,[req.params.id,centerId]);
    const lead=leadQ.rows[0];if(!lead){await client.query('ROLLBACK');client.release();return err(res,404,'Lid topilmadi');}
    if(lead.status==='Mijoz bo‘ldi'){await client.query('ROLLBACK');client.release();return err(res,409,'Bu lid allaqachon o‘quvchiga aylantirilgan');}
    const name=clean(b.name)||clean(lead.full_name)||'Yangi o‘quvchi',phone=clean(b.phone)||clean(lead.phone)||null;let student=null,created=false;
    if(phone){const ex=await client.query(`SELECT * FROM students WHERE center_id=$1 AND phone=$2 AND COALESCE(status,'active')<>'deleted' ORDER BY created_at DESC LIMIT 1`,[centerId,phone]);student=ex.rows[0]||null;}
    if(!student){const sq=await client.query(`INSERT INTO students(center_id,full_name,phone,parent_phone,birth_date,gender,note,status,balance) VALUES($1,$2,$3,$4,$5,$6,$7,'active',0) RETURNING *`,[centerId,name,phone,clean(b.parentPhone)||null,b.birthDate||null,clean(b.gender)||null,clean(b.note)||clean(lead.note)||null]);student=sq.rows[0];created=true;}
    if(b.groupId){const gq=await client.query(`SELECT id FROM study_groups WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted'`,[b.groupId,centerId]);if(!gq.rows[0])throw new Error('Tanlangan guruh topilmadi');await client.query(`INSERT INTO group_students(center_id,group_id,student_id,status,joined_at) VALUES($1,$2,$3,'active',CURRENT_DATE) ON CONFLICT(group_id,student_id) DO UPDATE SET status='active',updated_at=NOW()`,[centerId,b.groupId,student.id]);}
    await client.query(`UPDATE leads SET status='Mijoz bo‘ldi',next_contact_at=NULL,updated_at=NOW() WHERE id=$1 AND center_id=$2`,[req.params.id,centerId]);
    await client.query('COMMIT');client.release();await activity(centerId,req.centerUser.id,'Lid o‘quvchiga aylantirildi',{leadId:req.params.id,studentId:student.id,created,groupId:b.groupId||null});
    return res.json({ok:true,created,student:{id:student.id,name:student.full_name,phone:student.phone,status:student.status}});
  }catch(error){await client.query('ROLLBACK').catch(()=>{});client.release();return err(res,500,'Lidni o‘quvchiga aylantirishda xatolik',error);}
});

module.exports=router;
