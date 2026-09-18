const {randomUUID}=require('node:crypto');
const {syncCanonical}=require('./crm-legacy');
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const days=value=>({'Toq kunlar':[1,3,5],'Juft kunlar':[2,4,6],'Dam olish kuni':[0,6]})[value]||[0,1,2,3,4,5,6];
const validDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
function overlap(a,b){
 if(!a.time||!a.endTime||!b.time||!b.endTime||a.time>=b.endTime||b.time>=a.endTime)return false;
 const start=[a.startDate||'2000-01-01',b.startDate||'2000-01-01'].sort().at(-1),end=[a.endDate||'9999-12-31',b.endDate||'9999-12-31'].sort()[0];
 if(start>end)return false;
 for(let i=0;i<7;i++){const d=new Date(start+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+i);if(d.toISOString().slice(0,10)>end)break;if(days(a.days).includes(d.getUTCDay())&&days(b.days).includes(d.getUTCDay()))return true}return false;
}
function member(rows,student,group,date){
 const s=rows.find(r=>r.id===student&&r.entity==='students'&&!r.deleted&&r.data.status!=='Arxiv');if(!s)return false;
 const enrollments=rows.filter(r=>r.entity==='enrollments'&&!r.deleted&&r.data.student===student&&r.data.group===group);
 if(enrollments.length)return enrollments.some(r=>(!r.data.startDate||r.data.startDate<=date)&&(!r.data.endDate||r.data.endDate>=date)&&(r.data.status!=='Yakunlangan'||r.data.endDate));
 return s.data.group===group;
}
async function rules(db,c,entity,data,current){
 if(!['groups','attendance','assessments','enrollments','students'].includes(entity))return;
 const rows=(await db.query("SELECT * FROM eduka_records WHERE center_id=$1 AND entity IN ('groups','students','enrollments','rooms') AND deleted=0",[c])).rows;
 if(entity==='groups'&&(data.status||'Faol')==='Faol'){
  const conflict=rows.find(r=>r.entity==='groups'&&r.id!==current?.id&&(r.data.status||'Faol')==='Faol'&&((data.room&&data.room===r.data.room)||(data.teacher&&data.teacher===r.data.teacher))&&overlap(data,r.data));
  if(conflict)throw fail('Xona yoki o‘qituvchi vaqti «'+conflict.data.name+'» guruhi bilan to‘qnashmoqda',409);
 }
 if(data.group&&(entity==='enrollments'&&data.status!=='Yakunlangan'||entity==='students'&&data.status!=='Arxiv')){
  const g=rows.find(r=>r.id===data.group&&r.entity==='groups');if(g?.data.status==='Arxiv')throw fail('Arxiv guruhga biriktirib bo‘lmaydi');
  const cap=Number(rows.find(r=>r.id===g?.data.room&&r.entity==='rooms')?.data.capacity||0);
  const ids=new Set(rows.filter(r=>r.entity==='students'&&r.data.group===data.group&&r.data.status!=='Arxiv').map(r=>r.id));
  rows.filter(r=>r.entity==='enrollments'&&r.data.group===data.group&&r.data.status!=='Yakunlangan').forEach(r=>ids.add(r.data.student));ids.delete(entity==='students'?current?.id:data.student);
  if(cap>0&&ids.size>=cap)throw fail('Xona sig‘imi to‘lgan');
 }
 if(['attendance','assessments'].includes(entity)&&data.group){
  const date=data.date||data.month+'-01';
  const monthEnd=entity==='assessments'?new Date(Date.UTC(Number(data.month.slice(0,4)),Number(data.month.slice(5)),0)).toISOString().slice(0,10):date;
  const inMonth=entity==='assessments'&&rows.some(r=>r.entity==='enrollments'&&r.data.student===data.student&&r.data.group===data.group&&(!r.data.startDate||r.data.startDate<=monthEnd)&&(!r.data.endDate||r.data.endDate>=date)&&(r.data.status!=='Yakunlangan'||r.data.endDate));
  if(!member(rows,data.student,data.group,date)&&!inMonth)throw fail('O‘quvchi tanlangan davrda bu guruhga biriktirilmagan');
  const g=rows.find(r=>r.entity==='groups'&&r.id===data.group);
  if(entity==='attendance'&&g){if(g.data.startDate&&date<g.data.startDate||g.data.endDate&&date>g.data.endDate)throw fail('Sana guruhning o‘qish davridan tashqarida');data.teacher=g.data.teacher||'';}
 }
}
async function teacherScope(req,db,c,entity,data){
 if(req.crmRole!=='teacher'||!['attendance','assessments'].includes(entity))return;
 const g=(await db.query("SELECT data FROM eduka_records WHERE center_id=$1 AND entity='groups' AND id=$2 AND deleted=0",[c,data.group||null])).rows[0];
 if(!g||g.data.teacher!==req.crmUser.id)throw fail('Faqat o‘zingizga biriktirilgan guruh uchun ruxsat bor',403);
}
function register(router,{pool,initialized,allowed,validate}){
 const route=(path,fn)=>router.post(path,async(req,res,next)=>{let db;try{db=await pool.connect();await db.query('BEGIN');const c=req.centerUser.centerId;await initialized(db,c);const result=await fn(req,db,c);await db.query('COMMIT');res.json(result)}catch(e){if(db)await db.query('ROLLBACK');next(e)}finally{db?.release()}});
 async function save(req,db,c,entity,data,old){
  if(!allowed(req,entity,true,old?'update':'create'))throw fail('Bu amal uchun ruxsat yo‘q',403);
  require('./crm-record-quality').normalize(entity,data);await require('./crm-record-quality').check(db,c,entity,data,old);
  await require('./crm-settings').rules(db,c,entity,data,old);await validate(db,c,entity,data,old);await rules(db,c,entity,data,old);await teacherScope(req,db,c,entity,data);
  const r=(await db.query('INSERT INTO eduka_records(id,center_id,entity,data,version) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data,version=EXCLUDED.version,updated_at=NOW() RETURNING *',[old?.id||randomUUID(),c,entity,JSON.stringify(data),(old?.version||0)+1])).rows[0];await syncCanonical(db,r,c);
  await db.query('INSERT INTO eduka_events(center_id,record_id,entity,action,actor,changes) VALUES($1,$2,$3,$4,$5,$6)',[c,r.id,entity,old?'update':'create',req.crmUser.full_name,JSON.stringify({before:old?.data||null,after:data,source:'study'})]);
  await require('./crm-coins').attendanceCoins(db,c,r);return r;
 }
 route('/group-transfer',async(req,db,c)=>{
  const {student,from,to,date,version}=req.body||{};const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());if(date>today)throw fail('Ko‘chirish darhol bajariladi. Bugungi yoki oldingi sanani tanlang');if(!validDate(date)||!student||!from||from===to)throw fail('O‘quvchi, sana va boshqa guruhni tanlang');
  const s=(await db.query("SELECT * FROM eduka_records WHERE center_id=$1 AND id=$2 AND entity='students' AND deleted=0",[c,student])).rows[0];if(!s)throw fail('O‘quvchi topilmadi',404);if(s.version!==version)throw fail('O‘quvchi yangilangan. Sahifani yangilang.',409);
  const rows=(await db.query("SELECT * FROM eduka_records WHERE center_id=$1 AND entity='enrollments' AND deleted=0 AND data->>'student'=$2",[c,student])).rows;
  const source=rows.filter(r=>r.data.group===from&&r.data.status!=='Yakunlangan');if(!source.length&&s.data.group!==from)throw fail('O‘quvchi bu guruhda yo‘q',409);
  if(to&&rows.some(r=>r.data.group===to&&r.data.status!=='Yakunlangan'))throw fail('O‘quvchi yangi guruhga allaqachon biriktirilgan',409);
  const end=new Date(date+'T00:00:00Z');end.setUTCDate(end.getUTCDate()-1);const endDate=end.toISOString().slice(0,10);
  for(const e of source){if(e.data.startDate>date)throw fail('Ko‘chirish sanasi biriktirishdan oldin');await save(req,db,c,'enrollments',{...e.data,status:'Yakunlangan',endDate: e.data.startDate===date?date:endDate},e)}
  if(to)await save(req,db,c,'enrollments',{student,group:to,startDate:date,status:'Faol',price:source[0]?.data.price||0});
  // Update the primary group too, so a later profile edit cannot revive the old group.
  await save(req,db,c,'students',{...s.data,...(s.data.group===from?{group:to||''}:{})},s);
  return {ok:true};
 });
 route('/attendance-batch',async(req,db,c)=>{
  const {group,date,entries}=req.body||{};if(!validDate(date)||!Array.isArray(entries)||!entries.length||entries.length>500||entries.some(e=>!e||typeof e.student!=='string'||!Number.isInteger(e.version)||e.version<0)||new Set(entries.map(e=>e.student)).size!==entries.length)throw fail('Sana yoki davomat ro‘yxati noto‘g‘ri');
  const saved=[];for(const entry of entries){const old=(await db.query("SELECT * FROM eduka_records WHERE center_id=$1 AND entity='attendance' AND deleted=0 AND data->>'group'=$2 AND data->>'date'=$3 AND data->>'student'=$4",[c,group,date,entry.student])).rows[0];if((old?.version||0)!==entry.version)throw fail('Davomat boshqa foydalanuvchi tomonidan yangilangan. Qayta yuklang.',409);saved.push(await save(req,db,c,'attendance',{...old?.data,student:entry.student,group,date,status:entry.status,note:String(entry.note||'').slice(0,2000)},old))}return {records:saved};
 });
}
module.exports={rules,teacherScope,register,overlap,member};
