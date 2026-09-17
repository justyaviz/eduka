const express=require('express');
const multer=require('multer');
const {randomUUID}=require('node:crypto');
const pool=require('../db');
const {requireCenterAuth}=require('../middleware/center-auth');
const {normalizeHost,tenantFromRequest}=require('../utils/tenant');
const {pages,fieldsFor,entityAllowlist}=require('../utils/crm-catalog.cjs');
const {importLegacy,syncCanonical}=require('../utils/crm-legacy');
const router=express.Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:20*1024*1024,files:1}});
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const allRoles=['owner','director','admin','administrator'];
const modules={orders:'leads',groups:'groups',enrollments:'groups',students:'students',parents:'students',addresses:'students','student-contracts':'students',calls:'students','student-tasks':'reminders',tasks:'reminders',visits:'attendance',attendance:'attendance',assessments:'attendance',employees:'teachers',transactions:'finance',cash:'finance',charges:'finance',discounts:'finance',installments:'finance',salary:'finance',bonuses:'finance',penalties:'finance','payment-type':'finance','income-plans':'finance','planned-expenses':'finance',settings:'settings',roles:'roles',branches:'settings'};
const defaults={manager:['dashboard.view','leads.*','students.*','groups.*','reminders.*','teachers.view','attendance.view'],teacher:['dashboard.view','groups.view','students.view','attendance.*','reminders.view'],cashier:['dashboard.view','students.view','finance.view','finance.payments','finance.collect'],accountant:['dashboard.view','finance.*','students.view','groups.view']};
function allowed(req,entity,write=false){
 if(allRoles.includes(req.crmRole))return true;
 const module=modules[entity]||'settings';const list=req.crmPermissions;
 if(list.includes('*')||list.includes(module+'.*'))return true;
 if(!write)return list.includes(module+'.view');
 if(entity==='transactions'&&list.includes('finance.collect'))return true;
 return list.includes(module+'.manage');
}
function sameOrigin(req,res,next){
 if(['GET','HEAD'].includes(req.method))return next();
 const origin=req.get('origin');
 if(origin){try{if(new URL(origin).host.toLowerCase()!==normalizeHost(req.get('x-forwarded-host')||req.get('host')))return res.status(403).json({error:'Noto‘g‘ri so‘rov manbasi'})}catch{return res.status(403).json({error:'Noto‘g‘ri so‘rov manbasi'})}}
 if(req.get('sec-fetch-site')==='cross-site')return res.status(403).json({error:'Noto‘g‘ri so‘rov manbasi'});next();
}
router.use(sameOrigin);
router.post('/logout',(req,res)=>{res.clearCookie('eduka_session',{path:'/',httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production'});res.json({ok:true})});
router.use(requireCenterAuth);
router.use(async(req,res,next)=>{try{
 if(!tenantFromRequest(req))throw fail('Markaz subdomeni orqali kiring',403);
 const u=(await pool.query('SELECT id,full_name,email,role,status FROM center_users WHERE id=$1 AND center_id=$2',[req.centerUser.id,req.centerUser.centerId])).rows[0];
 if(!u||u.status!=='active')throw fail('Hisob faol emas',401);
 req.crmRole=String(u.role||'').toLowerCase();req.crmUser=u;
 const row=(await pool.query("SELECT value FROM center_settings WHERE center_id=$1 AND key='rbac.roles.v1'",[req.centerUser.centerId])).rows[0];
 let roles=[];try{roles=JSON.parse(row?.value||'[]')}catch{}
 req.crmPermissions=roles.find(r=>String(r.id).toLowerCase()===req.crmRole)?.permissions||defaults[req.crmRole]||[];
 res.set('Cache-Control','no-store');next();
 }catch(e){next(e)}});
require('../utils/crm-telegram').register(router,pool);
router.get('/notification-status',async(req,res,next)=>{try{if(!['owner','director'].includes(req.crmRole))throw fail('Ruxsat yo‘q',403);res.json({telegramConfigured:!!(await require('../utils/crm-notifications').config(pool,req.centerUser.centerId)),messages:(await pool.query('SELECT id,channel,status,error,created_at,sent_at FROM eduka_notification_outbox WHERE center_id=$1 ORDER BY created_at DESC LIMIT 50',[req.centerUser.centerId])).rows})}catch(e){next(e)}});
router.get('/support',async(req,res,next)=>{try{res.json({messages:(await pool.query('SELECT id,sender,body,created_at FROM eduka_support_messages WHERE center_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 100',[req.centerUser.centerId,req.crmUser.id])).rows.reverse()})}catch(e){next(e)}});
router.post('/support',async(req,res,next)=>{try{const body=String(req.body.body||'').trim();if(!body||body.length>3000)throw fail('Xabar 1–3000 belgi bo‘lsin');const r=await pool.query("INSERT INTO eduka_support_messages(center_id,user_id,sender,body) VALUES($1,$2,'user',$3) RETURNING id",[req.centerUser.centerId,req.crmUser.id,body]);res.json({ok:true,id:r.rows[0].id})}catch(e){next(e)}});
router.get('/session',(req,res)=>res.json({user:{id:req.crmUser.id,fullName:req.crmUser.full_name,role:req.crmRole},center:{id:req.centerUser.centerId,name:req.center?.name||req.centerUser.centerName,status:req.center?.status,expiresAt:String(req.center?.status).toLowerCase()==='trial'?req.center?.trial_ends_at:req.center?.next_payment_date},serverNow:new Date().toISOString(),permissions:req.crmPermissions}));
router.use((req,res,next)=>{const c=req.center;const expiry=String(c?.status).toLowerCase()==='trial'?c?.trial_ends_at:c?.next_payment_date;if(req.method!=='GET'&&expiry&&new Date(expiry).getTime()<Date.now())return res.status(402).json({error:'Obuna muddati tugagan. Markaz tarifini uzaytiring.'});next()});
async function initialized(db,center){
 await db.query('SELECT id FROM centers WHERE id=$1 FOR UPDATE',[center]);
 const flag=await db.query("SELECT id FROM center_settings WHERE center_id=$1 AND key='crm.workspace.v1'",[center]);
 if(!flag.rows.length){const cutoff=(await db.query('SELECT COALESCE(MAX(id),0) id FROM eduka_legacy_changes WHERE center_id=$1',[center])).rows[0].id;await importLegacy(db,center);await db.query("INSERT INTO center_settings(center_id,key,value) VALUES($1,'crm.workspace.v1','ready') ON CONFLICT(center_id,key) DO NOTHING",[center]);await db.query('DELETE FROM eduka_legacy_changes WHERE center_id=$1 AND id<=$2',[center,cutoff]);}
 await require('../utils/crm-reconcile').reconcile(db,center);
}
require('../utils/crm-operations').register(router,{pool,initialized,allowed});
require('../utils/crm-coins').register(router,{pool,initialized,allowed});
router.get('/records',async(req,res,next)=>{const db=await pool.connect();try{await db.query('BEGIN');const center=req.centerUser.centerId;await initialized(db,center);const entities=entityAllowlist.filter(e=>allowed(req,e)&&(!req.query.entity||req.query.entity===e));const cursor=String(req.query.cursor||'00000000-0000-0000-0000-000000000000');if(!UUID.test(cursor))throw fail('Sahifa belgisi noto‘g‘ri');const limit=Math.min(500,Math.max(1,Number(req.query.limit)||500));const records=(await db.query('SELECT id,entity,data,version,deleted,created_at,updated_at FROM eduka_records WHERE center_id=$1 AND entity=ANY($2::text[]) AND id>$3 ORDER BY id LIMIT $4',[center,entities,cursor,limit+1])).rows;const more=records.length>limit;if(more)records.pop();const events=req.query.cursor?[]:(await db.query('SELECT record_id,entity,action,actor,changes,created_at FROM eduka_events WHERE center_id=$1 AND entity=ANY($2::text[]) ORDER BY created_at DESC LIMIT 500',[center,entities])).rows;await db.query('COMMIT');res.json({records,events,nextCursor:more?records.at(-1).id:null})}catch(e){await db.query('ROLLBACK');next(e)}finally{db.release()}});

async function validate(db,center,entity,data,current){
 if(data&&Object.keys(data).some(k=>/password|secret|token/i.test(k)))throw fail('Maxfiy ma’lumotni bu shaklda saqlab bo‘lmaydi');
 if(!data||typeof data!=='object'||Array.isArray(data)||JSON.stringify(data).length>100000)throw fail('Yozuv hajmi yoki formati noto‘g‘ri');
 for(const [key,v]of Object.entries(data))if(['__proto__','constructor','prototype'].includes(key)||!['string','number','boolean'].includes(typeof v)||typeof v==='number'&&!Number.isFinite(v))throw fail('Maydon qiymati noto‘g‘ri');
 for(const k of ['openingBalance','legacyKind','calculation','paymentId','payrollId','sourceAttendance','rewardId']){if(current?.data[k]!==undefined)data[k]=current.data[k];else delete data[k]}
 const definition=pages.find(p=>p.entity===entity&&p.fields.length);
 for(const f of definition?fieldsFor(definition):[]){const v=data[f.key];if(f.required&&(v===undefined||v===''))throw fail(f.label+' majburiy');if(v===undefined||v==='')continue;
  if(f.type==='number'&&(typeof v!=='number'||v<0&&!['latitude','longitude'].includes(f.key)))throw fail(f.label+': musbat raqam kiriting');
  if(f.type==='select'&&f.options&&!f.options.includes(v))throw fail(f.label+': variantni tanlang');
  if(f.type==='date'&&(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v))throw fail(f.label+': sana noto‘g‘ri');
  if(f.type==='time'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))throw fail(f.label+': vaqt noto‘g‘ri');
  if(f.type==='relation'){
   if(!UUID.test(v))throw fail(f.label+': yozuvni tanlang');
   if(!(await db.query('SELECT id FROM eduka_records WHERE id=$1 AND center_id=$2 AND entity=$3 AND deleted=0',[v,center,f.entity])).rows.length)throw fail(f.label+': yozuv topilmadi');
  }
  if(f.type==='file'){const m=typeof v==='string'&&v.match(/^\/api\/crm\/files\?id=([a-f0-9-]+)$/);if(!m||!UUID.test(m[1])||!(await db.query('SELECT id FROM eduka_files WHERE id=$1 AND center_id=$2',[m[1],center])).rows.length)throw fail('Fayl topilmadi')}
 }
 if(data.startDate&&data.endDate&&data.endDate<data.startDate)throw fail('Tugash sanasi boshlanishdan oldin');
 if(entity==='groups'&&data.time&&data.endTime&&data.endTime<=data.time)throw fail('Dars tugash vaqti noto‘g‘ri');
 if(entity==='coins'&&(!Number.isInteger(data.amount)||data.amount<=0))throw fail('Coin musbat butun son bo‘lsin');
 if(entity==='rewards'&&(!Number.isInteger(data.cost)||data.cost<=0||!Number.isInteger(data.stock)||data.stock<0))throw fail('Narx va qoldiq butun son bo‘lsin');
 if(entity==='settings'&&data.attendanceCoins!==undefined&&(!Number.isInteger(data.attendanceCoins)||data.attendanceCoins<0||data.attendanceCoins>1000))throw fail('Dars uchun coin 0–1000 oralig‘ida bo‘lsin');
 if(entity==='employees'&&Number(data.revenuePercent||0)>100)throw fail('Foiz 0–100 oralig‘ida bo‘lsin');
 if(current?.data.calculation==='v1'||current?.data.payrollId||current?.data.sourceAttendance||current?.data.rewardId)throw fail('Hisoblangan maoshni qo‘lda o‘zgartirib bo‘lmaydi');
 if(entity==='ratings'&&(data.rating<1||data.rating>5))throw fail('Reyting 1 dan 5 gacha');
 if(entity==='charges'&&Number(data.teacherShare||0)>data.amount)throw fail('O‘qituvchi ulushi jami summadan katta');
 if(data.latitude!==undefined&&Math.abs(Number(data.latitude))>90||data.longitude!==undefined&&Math.abs(Number(data.longitude))>180)throw fail('Koordinata noto‘g‘ri');
 if(entity==='transactions'&&current&&data.direction!==current.data.direction)throw fail('Tranzaksiya yo‘nalishini almashtirib bo‘lmaydi. Uni arxivlab yangi yozuv kiriting.');
 if(['transactions','charges','discounts','enrollments','attendance'].includes(entity)&&current)for(const key of ['student','group'])if(current.data[key]!==data[key])throw fail('Bog‘langan o‘quvchi/guruhni almashtirish uchun yozuvni arxivlab qayta yarating.');
 if(entity==='installments'&&data.parts){let parts;try{parts=JSON.parse(data.parts)}catch{throw fail('To‘lov qismlari noto‘g‘ri')}if(!Array.isArray(parts)||!parts.length||parts.length>100||parts.some(p=>!p||!Number.isFinite(p.amount)||p.amount<=0||typeof p.note!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||!Number.isFinite(Date.parse(p.date))))throw fail('To‘lov qismlariga summa va sana kiriting');data.amount=parts.reduce((s,p)=>s+p.amount,0);data.date=parts.map(p=>p.date).sort()[0]}
 if(entity==='visits'&&(!Number.isFinite(Date.parse(data.arrivedAt))||data.leftAt&&(!Number.isFinite(Date.parse(data.leftAt))||data.leftAt<data.arrivedAt)))throw fail('Kelish yoki ketish vaqti noto‘g‘ri');
 if(entity==='attendance'&&!data.group)throw fail('Davomat uchun guruh majburiy');
 if(['visits','enrollments','attendance'].includes(entity)){
  const rows=(await db.query('SELECT id,data FROM eduka_records WHERE center_id=$1 AND entity=$2 AND deleted=0 AND id<>$3',[center,entity,current?.id||'00000000-0000-0000-0000-000000000000'])).rows;
  if(rows.some(r=>r.data.student===data.student&&(entity==='visits'?!r.data.leftAt&&!data.leftAt:entity==='enrollments'?r.data.group===data.group&&r.data.status!=='Yakunlangan'&&data.status!=='Yakunlangan':r.data.group===data.group&&r.data.date===data.date)))throw fail('Bu o‘quvchi uchun bunday faol yozuv mavjud',409);
 }
 const config=(await db.query("SELECT data FROM eduka_records WHERE center_id=$1 AND entity='settings' AND data->>'section'='system' AND deleted=0 ORDER BY updated_at DESC LIMIT 1",[center])).rows[0]?.data||{};
 if(entity==='students')for(const [setting,key]of [['requiredBirthDate','birthDate'],['requiredPhone','phone'],['requiredSource','source']])if(config[setting]&&!String(data[key]??'').trim())throw fail(key+' majburiy');
 if(entity==='assessments'&&Number(data.grade)>Number(config.maxGrade||5))throw fail('Baho maksimal qiymatdan katta');
}
router.post('/records',async(req,res,next)=>{let db;try{
 const b=req.body||{},center=req.centerUser.centerId;
 if(!entityAllowlist.includes(b.entity)||!['create','update','archive','restore'].includes(b.action))throw fail('Noto‘g‘ri amal yoki bo‘lim');
 if(!allowed(req,b.entity,true))throw fail('Bu amal uchun ruxsat yo‘q',403);
 if(b.action!=='create'&&!UUID.test(b.id||''))throw fail('ID noto‘g‘ri');
 db=await pool.connect();await db.query('BEGIN');await initialized(db,center);
 const current=b.action==='create'?null:(await db.query('SELECT * FROM eduka_records WHERE id=$1 AND center_id=$2 AND entity=$3 FOR UPDATE',[b.id,center,b.entity])).rows[0];
 if(b.action!=='create'&&!current)throw fail('Yozuv topilmadi',404);
 if(current&&b.version!==current.version)throw fail('Yozuv yangilangan. Sahifani yangilang.',409);
 const data=['archive','restore'].includes(b.action)?{...current.data}:{...b.data};
 // Restore must recheck uniqueness and relations too.
 if(current?.data.calculation==='v1'||current?.data.payrollId||current?.data.sourceAttendance||current?.data.rewardId)throw fail('Avtomatik yaratilgan yozuvni qo‘lda o‘zgartirib bo‘lmaydi');
 if(b.entity==='settings'){if(!['owner','director'].includes(req.crmRole))throw fail('Sozlamalarni faqat rahbar o‘zgartiradi',403);if(b.action==='archive')throw fail('Sozlamalarni arxivlash mumkin emas');await require('../utils/crm-settings').validateSettings(db,center,data,current)}
 if(b.entity==='roles'&&!['owner','director'].includes(req.crmRole))throw fail('Rollarni faqat rahbar boshqaradi',403);
 if(b.action==='archive'&&b.entity==='attendance')await require('../utils/crm-settings').rules(db,center,b.entity,data,current);
 if(b.action!=='archive'){await require('../utils/crm-settings').rules(db,center,b.entity,data,current);await validate(db,center,b.entity,data,current);}
 await require('../utils/crm-limits').checkLimit(db,center,b.entity,current,data,b.action);
 const record={id:current?.id||randomUUID(),entity:b.entity,data,version:(current?.version||0)+1,deleted:b.action==='archive'?1:b.action==='restore'?0:current?.deleted||0,created_at:current?.created_at||new Date(),updated_at:new Date()};
 const changes=Object.fromEntries([...new Set([...Object.keys(current?.data||{}),...Object.keys(data)])].filter(k=>JSON.stringify(current?.data[k])!==JSON.stringify(data[k])&&!/password|secret|token/i.test(k)).map(k=>[k,{before:current?.data[k]??null,after:data[k]??null}]));
 await db.query('INSERT INTO eduka_records(id,center_id,entity,data,version,deleted,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data,version=EXCLUDED.version,deleted=EXCLUDED.deleted,updated_at=EXCLUDED.updated_at WHERE eduka_records.center_id=EXCLUDED.center_id',[record.id,center,record.entity,JSON.stringify(data),record.version,record.deleted,record.created_at,record.updated_at]);
 await syncCanonical(db,record,center);
 if(b.entity==='settings'&&data.section==='system'&&data.centerName)await db.query('UPDATE centers SET name=$2,updated_at=NOW() WHERE id=$1',[center,data.centerName.trim()]);
 await require('../utils/crm-notifications').payment(db,center,record,b.action);
 await require('../utils/crm-coins').attendanceCoins(db,center,record);
 if(record.entity==='coins')await require('../utils/crm-coins').ensureBalances(db,center);
 if(b.entity==='employees'&&record.deleted){if(record.id===req.centerUser.id||(await db.query("SELECT id FROM center_users WHERE center_id=$1 AND id=$2 AND role IN ('owner','director')",[center,record.id])).rows.length)throw fail('Rahbar hisobini arxivlab bo‘lmaydi');await db.query("UPDATE center_users SET status='inactive' WHERE center_id=$1 AND id=$2",[center,record.id])}
 if(b.entity==='roles'){const row=(await db.query("SELECT value FROM center_settings WHERE center_id=$1 AND key='rbac.roles.v1'",[center])).rows[0];let roles=[];try{roles=JSON.parse(row?.value||'[]')}catch{};roles=roles.filter(r=>r.id!==record.id);roles.push({id:record.id,name:record.data.name,permissions:record.deleted?[]:require('../utils/crm-operations').rolePermissions(record.data)});await db.query("INSERT INTO center_settings(center_id,key,value) VALUES($1,'rbac.roles.v1',$2) ON CONFLICT(center_id,key) DO UPDATE SET value=EXCLUDED.value",[center,JSON.stringify(roles)])}
 const event={record_id:record.id,entity:b.entity,action:b.action,actor:req.crmUser.full_name,changes,created_at:record.updated_at};
 await db.query('INSERT INTO eduka_events(center_id,record_id,entity,action,actor,changes) VALUES($1,$2,$3,$4,$5,$6)',[center,record.id,b.entity,b.action,event.actor,JSON.stringify(changes)]);
 await db.query('COMMIT');res.json({record,event});
 }catch(e){if(db)await db.query('ROLLBACK');next(e)}finally{db?.release()}});
router.post('/files',upload.single('file'),async(req,res,next)=>{try{
 if(!allRoles.includes(req.crmRole))throw fail('Fayl yuklashga ruxsat yo‘q',403);
 const f=req.file;if(!f||!['image/jpeg','image/png','image/webp','application/pdf','video/mp4'].includes(f.mimetype))throw fail('JPG, PNG, WebP, PDF yoki MP4; 20 MB gacha');
 const id=randomUUID();await pool.query('INSERT INTO eduka_files(id,center_id,name,mime,size,content) VALUES($1,$2,$3,$4,$5,$6)',[id,req.centerUser.centerId,f.originalname,f.mimetype,f.size,f.buffer]);res.json({id,name:f.originalname,url:'/api/crm/files?id='+id});
 }catch(e){next(e)}});
router.get('/files',async(req,res,next)=>{try{
 if(!allRoles.includes(req.crmRole))throw fail('Faylni ochishga ruxsat yo‘q',403);
 if(!UUID.test(String(req.query.id||'')))throw fail('Fayl topilmadi',404);
 const f=(await pool.query('SELECT * FROM eduka_files WHERE id=$1 AND center_id=$2',[req.query.id,req.centerUser.centerId])).rows[0];if(!f)throw fail('Fayl topilmadi',404);
 res.set({'Content-Type':f.mime,'X-Content-Type-Options':'nosniff','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(f.name)}).send(Buffer.from(f.content));
 }catch(e){next(e)}});
router.use((e,req,res,next)=>{console.error('CRM request failed:',e.code||e.status||'INTERNAL');res.status(e.status||e.code==='23505'&&409||e instanceof multer.MulterError&&400||500).json({error:e.status?e.message:e instanceof multer.MulterError?'Fayl hajmi 20 MB dan oshmasin':'Amal bajarilmadi. Qayta urinib ko‘ring.'})});
module.exports=router;
