const UUID=/^[0-9a-f-]{36}$/i;
function register(router,{pool,requireCeoAuth}){
 const ceo=(req,res,next)=>String(req.user.role).toUpperCase()==='CEO'?next():res.status(403).json({error:'Faqat CEO bu amalni bajara oladi'});
 router.get('/ceo/centers/:id/admin-access',requireCeoAuth,ceo,async(req,res)=>{try{
  if(!UUID.test(req.params.id))return res.status(400).json({error:'Markaz IDsi noto‘g‘ri'});
  const row=(await pool.query("SELECT cu.id,cu.full_name,cu.email,cu.role,cu.status,c.subdomain,c.name center_name FROM center_users cu JOIN centers c ON c.id=cu.center_id WHERE cu.center_id=$1 AND cu.role IN ('owner','director') ORDER BY CASE WHEN cu.role='owner' THEN 0 ELSE 1 END,cu.created_at LIMIT 1",[req.params.id])).rows[0];
  if(!row)return res.status(404).json({error:'Markaz administratori topilmadi'});
  res.json({ok:true,admin:{id:row.id,fullName:row.full_name,email:row.email,role:row.role,status:row.status},domain:'https://'+String(row.subdomain).replace(/\.eduka\.uz$/,'')+'.eduka.uz',centerName:row.center_name});
 }catch{res.status(500).json({error:'Administrator ma’lumoti yuklanmadi'})}});
 router.patch('/ceo/centers/:id/admin-access',requireCeoAuth,ceo,async(req,res)=>{const db=await pool.connect();try{
  if(!UUID.test(req.params.id))return res.status(400).json({error:'Markaz IDsi noto‘g‘ri'});
  const email=String(req.body.email||'').trim().toLowerCase(),fullName=String(req.body.fullName||'').trim(),password=String(req.body.password||'');
  if(!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>160)return res.status(400).json({error:'Login email noto‘g‘ri'});
  if(!fullName||fullName.length>120)return res.status(400).json({error:'Administrator ismini kiriting'});
  if(password&&(password.length<12||password.length>128))return res.status(400).json({error:'Yangi parol 12–128 belgi bo‘lsin'});
  await db.query('BEGIN');const admin=(await db.query("SELECT id,email FROM center_users WHERE center_id=$1 AND role IN ('owner','director') ORDER BY CASE WHEN role='owner' THEN 0 ELSE 1 END,created_at LIMIT 1 FOR UPDATE",[req.params.id])).rows[0];if(!admin){await db.query('ROLLBACK');return res.status(404).json({error:'Markaz administratori topilmadi'})}
  const hash=password?await require('bcryptjs').hash(password,12):null;
  const row=(await db.query("UPDATE center_users SET full_name=$3,email=$4,password_hash=COALESCE($5,password_hash),auth_version=auth_version+CASE WHEN $5::text IS NULL THEN 0 ELSE 1 END,status='active',updated_at=NOW() WHERE id=$2 AND center_id=$1 RETURNING id,full_name,email,role,status",[req.params.id,admin.id,fullName,email,hash])).rows[0];
  await db.query("INSERT INTO audit_logs(user_id,user_name,action,module,details,ip_address) VALUES($1,$2,$3,'centers',$4,$5)",[req.user.id,req.user.fullName||req.user.email,password?'Markaz admin logini va paroli yangilandi':'Markaz admin logini yangilandi',JSON.stringify({centerId:req.params.id,adminId:row.id,oldEmail:admin.email,newEmail:email,passwordReset:!!password}),req.ip||null]);
  await db.query('COMMIT');res.json({ok:true,admin:{id:row.id,fullName:row.full_name,email:row.email,role:row.role,status:row.status},passwordChanged:!!password});
 }catch(e){await db.query('ROLLBACK');res.status(e.code==='23505'?409:500).json({error:e.code==='23505'?'Bu login boshqa hisobda ishlatilgan':'Administrator kirishi yangilanmadi'})}finally{db.release()}});
 router.post('/ceo/centers/:id/trial',requireCeoAuth,ceo,async(req,res)=>{
 if(!UUID.test(req.params.id)||![3,7,10].includes(req.body.days))return res.status(400).json({error:'3, 7 yoki 10 kunni tanlang'});
 try{const row=(await pool.query("UPDATE centers SET status='Trial',trial_ends_at=NOW()+$2*INTERVAL '1 day',next_payment_date=NOW()+$2*INTERVAL '1 day',updated_at=NOW() WHERE id=$1 RETURNING trial_ends_at",[req.params.id,req.body.days])).rows[0];if(!row)return res.status(404).json({error:'Markaz topilmadi'});require('../hard-page-gate').clearCenterCache();res.json({ok:true,trialEndsAt:row.trial_ends_at})}catch{res.status(500).json({error:'Trial belgilanmadi'})}
 });
 router.delete('/ceo/centers/:id',requireCeoAuth,ceo,async(req,res)=>{
 if(!UUID.test(req.params.id))return res.status(400).json({error:'Markaz IDsi noto‘g‘ri'});
 const db=await pool.connect();try{
 await db.query('BEGIN');const center=(await db.query('SELECT * FROM centers WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0];if(!center){await db.query('ROLLBACK');return res.status(404).json({error:'Markaz topilmadi'})}
 if(req.body.confirmName!==center.name){await db.query('ROLLBACK');return res.status(400).json({error:'Tasdiqlash uchun markaz nomini aynan kiriting'})}
 await db.query("SELECT set_config('eduka.workspace_write','1',true)");
 for(const table of ['eduka_support_messages','eduka_notification_outbox','platform_payments'])await db.query(`DELETE FROM ${table} WHERE center_id=$1`,[center.id]);
 await db.query('DELETE FROM demo_requests WHERE converted_center_id=$1 OR id=$2',[center.id,center.created_from_demo_id]);
 // Clean up the retired tenant-keyed engine when its optional tables exist.
 const slug=String(center.subdomain||'').split('.')[0];
 if(slug)for(const table of ['crm_sessions','crm_group_students','crm_attendance','crm_payments','crm_expenses','crm_reminders','crm_activity_logs','crm_groups','crm_students','crm_teachers','crm_courses','crm_rooms','crm_tenant_admins']){
 if((await db.query("SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name='tenant'",[table])).rows.length)await db.query(`DELETE FROM ${table} WHERE tenant=$1`,[slug]);
 }
 if(slug&&(await db.query("SELECT to_regclass('public.crm_centers') AS table_name")).rows[0].table_name)await db.query('DELETE FROM crm_centers WHERE subdomain=$1 OR subdomain=$2',[slug,center.subdomain]);
 await db.query('DELETE FROM centers WHERE id=$1',[center.id]);await db.query("INSERT INTO audit_logs(user_id,user_name,action,module,details) VALUES($1,$2,'Markaz butunlay o‘chirildi','centers',$3)",[req.user.id,req.user.fullName||req.user.email,JSON.stringify({centerId:center.id})]);await db.query('COMMIT');require('../hard-page-gate').clearCenterCache();res.json({ok:true});
 }catch{await db.query('ROLLBACK');res.status(500).json({error:'Markaz o‘chirilmadi. Ma’lumotlar saqlandi.'})}finally{db.release()}
 });
}
module.exports={register};
