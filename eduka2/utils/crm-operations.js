const {randomUUID}=require('node:crypto');
const bcrypt=require('bcryptjs');
const {syncCanonical}=require('./crm-legacy');
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const management=req=>{if(!['owner','director'].includes(req.crmRole))throw fail('Faqat markaz rahbari boshqarishi mumkin',403)};
const builtins=['manager','teacher','cashier','accountant','admin'];
const sectionModules={tasks:'reminders',leads:'leads',groups:'groups',students:'students',finance:'finance',control:'attendance',management:'teachers',settings:'settings',reports:'finance'};
function rolePermissions(data){const permissions=[];for(const [key,value]of Object.entries(data)){if(value!==true)continue;const match=key.match(/^permission:([^:]+):(Ko‘rish|Qo‘shish|Tahrirlash|Arxivlash)$/);if(match&&sectionModules[match[1]])permissions.push(sectionModules[match[1]]+'.'+({'Ko‘rish':'view','Qo‘shish':'create','Tahrirlash':'update','Arxivlash':'archive'}[match[2]]))}return [...new Set(permissions)]}
async function record(db,center,entity,data,id=randomUUID(),actor='Tizim'){
 const r=(await db.query('INSERT INTO eduka_records(id,center_id,entity,data) VALUES($1,$2,$3,$4) RETURNING *',[id,center,entity,JSON.stringify(data)])).rows[0];await syncCanonical(db,r,center);await db.query("INSERT INTO eduka_events(center_id,record_id,entity,action,actor,changes) VALUES($1,$2,$3,'create',$4,$5)",[center,r.id,entity,actor,JSON.stringify({source:'payroll'})]);return r;
}
function calculatePayroll(rows,employee,month){
 rows=rows.filter(r=>!r.deleted);const d=employee.data;const groups=new Set(rows.filter(r=>r.entity==='groups'&&r.data.teacher===employee.id).map(r=>r.id));
 const inMonth=r=>String(r.data.date||'').startsWith(month+'-');
 const lessonCount=new Set(rows.filter(r=>r.entity==='attendance'&&groups.has(r.data.group)&&inMonth(r)&&['Keldi','Birinchi dars','Kechikdi'].includes(r.data.status)).map(r=>r.data.group+':'+r.data.date)).size;
 const revenue=rows.filter(r=>r.entity==='transactions'&&groups.has(r.data.group)&&r.data.student&&inMonth(r)).reduce((s,r)=>s+(r.data.direction==='Kirim'?1:-1)*Number(r.data.amount||0),0);
 const adjustment=entity=>rows.filter(r=>r.entity===entity&&r.data.moderator===employee.id&&inMonth(r)).reduce((s,r)=>s+Number(r.data.amount||0),0);
 const base=Number(d.salary||0),lessonRate=Number(d.lessonRate||0),percent=Number(d.revenuePercent||0),bonus=adjustment('bonuses'),penalty=adjustment('penalties');
 const lessonAmount=lessonCount*lessonRate,percentageAmount=Math.round(Math.max(0,revenue)*percent)/100;
 return {moderator:employee.id,month,base,lessonCount,lessonRate,lessonAmount,revenue,revenuePercent:percent,percentageAmount,bonus,penalty,advance:0,total:Math.max(0,Math.round((base+lessonAmount+percentageAmount+bonus-penalty)*100)/100),status:'Hisoblandi',calculation:'v1'};
}
function register(router,{pool,initialized,allowed}){
 async function transaction(req,fn){const db=await pool.connect();try{await db.query('BEGIN');await initialized(db,req.centerUser.centerId);const result=await fn(db,req.centerUser.centerId);await db.query('COMMIT');return result}catch(e){await db.query('ROLLBACK');throw e}finally{db.release()}}
 const route=(method,path,fn)=>router[method](path,async(req,res,next)=>{try{res.json(await fn(req))}catch(e){next(e)}});
 route('get','/staff-access',async req=>{management(req);return {accounts:(await pool.query('SELECT id,full_name,email,role,status FROM center_users WHERE center_id=$1 ORDER BY full_name',[req.centerUser.centerId])).rows,roles:builtins}});
 route('post','/staff-access',async req=>{management(req);const b=req.body||{};return transaction(req,async(db,c)=>{
 const employee=(await db.query("SELECT * FROM eduka_records WHERE center_id=$1 AND id=$2 AND entity='employees' AND deleted=0",[c,b.employee])).rows[0];if(!employee)throw fail('Xodim topilmadi',404);
 const old=(await db.query('SELECT id,role FROM center_users WHERE center_id=$1 AND id=$2',[c,employee.id])).rows[0];
 if(old&&(['owner','director'].includes(old.role)||old.id===req.centerUser.id))throw fail('Rahbar yoki o‘z hisobingizni bu oynada o‘zgartirib bo‘lmaydi',403);
 if(!['active','inactive'].includes(b.status))throw fail('Hisob holatini tanlang');
 const email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw fail('Email kiriting');
 if((!old||password)&& (password.length<12||Buffer.byteLength(password)>72))throw fail('Parol kamida 12 belgi, ko‘pi bilan 72 bayt bo‘lsin');
 if(!builtins.includes(b.role)){
 const role=(await db.query("SELECT data FROM eduka_records WHERE center_id=$1 AND id=$2 AND entity='roles' AND deleted=0",[c,b.role])).rows[0];if(!role)throw fail('Rol topilmadi');
 const settings=(await db.query("SELECT value FROM center_settings WHERE center_id=$1 AND key='rbac.roles.v1'",[c])).rows[0];let roles=[];try{roles=JSON.parse(settings?.value||'[]')}catch{}
 roles=roles.filter(r=>r.id!==b.role);roles.push({id:b.role,name:role.data.name,permissions:rolePermissions(role.data)});
 await db.query("INSERT INTO center_settings(center_id,key,value) VALUES($1,'rbac.roles.v1',$2) ON CONFLICT(center_id,key) DO UPDATE SET value=EXCLUDED.value",[c,JSON.stringify(roles)]);
 }
 if((await db.query('SELECT id FROM center_users WHERE center_id=$1 AND LOWER(email)=$2 AND id<>$3',[c,email,employee.id])).rows.length)throw fail('Bu login boshqa xodimga tegishli',409);
 const hash=password?await bcrypt.hash(password,12):null;
 if(old)await db.query('UPDATE center_users SET full_name=$3,email=$4,role=$5,status=$6,password_hash=COALESCE($7,password_hash),auth_version=auth_version+1,updated_at=NOW() WHERE center_id=$1 AND id=$2',[c,employee.id,[employee.data.name,employee.data.surname].filter(Boolean).join(' '),email,b.role,b.status,hash]);
 else await db.query('INSERT INTO center_users(id,center_id,full_name,email,role,status,password_hash) VALUES($1,$2,$3,$4,$5,$6,$7)',[employee.id,c,[employee.data.name,employee.data.surname].filter(Boolean).join(' '),email,b.role,b.status,hash]);
 await db.query("INSERT INTO eduka_events(center_id,record_id,entity,action,actor,changes) VALUES($1,$2,'employees','access',$3,$4)",[c,employee.id,req.crmUser.full_name,JSON.stringify({role:b.role,status:b.status,email})]);return {ok:true};
 })});
 route('get','/payroll-preview',async req=>{if(!allowed(req,'salary'))throw fail('Ruxsat yo‘q',403);const month=String(req.query.month||'');if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw fail('Oyni tanlang');return transaction(req,async(db,c)=>{const rows=(await db.query('SELECT * FROM eduka_records WHERE center_id=$1 AND deleted=0',[c])).rows;return {previews:rows.filter(r=>r.entity==='employees').map(e=>({...calculatePayroll(rows,e,month),name:[e.data.name,e.data.surname].filter(Boolean).join(' ')}))}})});
 route('post','/payroll-run',async req=>{if(!allowed(req,'salary',true,'create'))throw fail('Ruxsat yo‘q',403);const {employee,month}=req.body;if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw fail('Oyni tanlang');return transaction(req,async(db,c)=>{
 const rows=(await db.query('SELECT * FROM eduka_records WHERE center_id=$1 AND deleted=0',[c])).rows;const e=rows.find(r=>r.id===employee&&r.entity==='employees');if(!e)throw fail('Xodim topilmadi');if(rows.some(r=>r.entity==='salary'&&r.data.moderator===employee&&r.data.month===month))throw fail('Bu oy uchun maosh allaqachon hisoblangan',409);
 return {record:await record(db,c,'salary',calculatePayroll(rows,e,month),undefined,req.crmUser.full_name)};})});
 route('post','/payroll-pay',async req=>{if(!allowed(req,'salary',true,'update')||!allowed(req,'transactions',true,'create'))throw fail('Ruxsat yo‘q',403);return transaction(req,async(db,c)=>{const r=(await db.query("SELECT * FROM eduka_records WHERE center_id=$1 AND id=$2 AND entity='salary' AND deleted=0",[c,req.body.id])).rows[0];if(!r)throw fail('Maosh topilmadi',404);if(r.data.paymentId)return {ok:true,paymentId:r.data.paymentId};if(!(Number(r.data.total)>0))throw fail('To‘lanadigan summa noldan katta bo‘lsin');if(r.data.calculation!=='v1')throw fail('Avval avtomatik maosh hisoblang');
 if(!(await db.query("SELECT id FROM eduka_records WHERE center_id=$1 AND id=$2 AND entity='cash' AND deleted=0",[c,req.body.cash])).rows.length)throw fail('Kassani tanlang');
 const payment=await record(db,c,'transactions',{name:r.data.month+' — maosh',amount:r.data.total,direction:'Chiqim',date:new Date().toISOString().slice(0,10),cash:req.body.cash,paymentMethod:'Naqd',payrollId:r.id},undefined,req.crmUser.full_name);
 await db.query("UPDATE eduka_records SET data=data||$3::jsonb,version=version+1,updated_at=NOW() WHERE center_id=$1 AND id=$2",[c,r.id,JSON.stringify({status:'To‘landi',paymentId:payment.id})]);return {ok:true,paymentId:payment.id};})});
}
module.exports={register,calculatePayroll,rolePermissions};
