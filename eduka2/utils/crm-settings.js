const {settingsSections,activeSettingKeys}=require('./crm-settings-catalog.cjs');
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
async function validateSettings(db,center,data,current){
 const groups=settingsSections[data.section];if(!groups)throw fail('Sozlama bo‘limi noto‘g‘ri');
 if(current&&current.data.section!==data.section)throw fail('Sozlama bo‘limini almashtirib bo‘lmaydi');
 const duplicate=await db.query("SELECT id FROM eduka_records WHERE center_id=$1 AND entity='settings' AND deleted=0 AND data->>'section'=$2 AND id<>$3",[center,data.section,current?.id||'00000000-0000-0000-0000-000000000000']);if(duplicate.rows.length)throw fail('Bu bo‘lim sozlamalari mavjud. Sahifani yangilang.',409);
 const fields=Object.values(groups).flat();for(const [key,v]of Object.entries(data)){if(key==='section')continue;const f=fields.find(f=>f.key===key);if(!f)throw fail('Noma’lum sozlama: '+key);if(!activeSettingKeys.includes(key)&&JSON.stringify(current?.data[key])!==JSON.stringify(v))throw fail(f.label+': bu funksiya hali ulanmagan');if(v==='')continue;
 if(f.type==='switch'&&typeof v!=='boolean'||f.type==='number'&&(typeof v!=='number'||!Number.isFinite(v)||v<0)||!['switch','number'].includes(f.type)&&typeof v!=='string')throw fail(f.label+': qiymat noto‘g‘ri');
 if(f.options&&!f.options.includes(v))throw fail(f.label+': variantni tanlang');if(f.type==='time'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))throw fail(f.label+': vaqt noto‘g‘ri');if(typeof v==='string'&&v.length>1500)throw fail(f.label+': matn juda uzun');
 }
 if(data.dayStart&&data.dayEnd&&data.dayStart>=data.dayEnd)throw fail('Ish kuni tugashi boshlanishidan keyin bo‘lsin');
 for(const [key,min,max]of [['maxGrade',1,100],['attendanceCoins',0,1000],['receiptFontSize',10,24],['lessonDuration',5,480],['maxCapacity',1,1000]])if(data[key]!==undefined&&data[key]!==''&&(!Number.isInteger(data[key])||data[key]<min||data[key]>max))throw fail(key+': '+min+'–'+max+' oralig‘ida butun son kiriting');
 if(data.centerName!==undefined&&!String(data.centerName).trim())throw fail('Markaz nomi bo‘sh bo‘lmasin');if(data.centerName?.length>180)throw fail('Markaz nomi 180 belgidan oshmasin');
 if(data.centerPhone&&!/^\+?[0-9 ()-]{7,25}$/.test(data.centerPhone))throw fail('Markaz telefoni noto‘g‘ri');
 if(data.centerLogo){const id=data.centerLogo.match(/^\/api\/crm\/files\?id=([a-f0-9-]{36})$/)?.[1];if(!id||!(await db.query("SELECT id FROM eduka_files WHERE id=$1 AND center_id=$2 AND mime IN ('image/png','image/jpeg','image/webp') AND size<=2097152",[id,center])).rows.length)throw fail('Logo JPG, PNG yoki WebP, 2 MB gacha bo‘lsin');}
}
async function rules(db,center,entity,data,current){
 const rows=(await db.query("SELECT data FROM eduka_records WHERE center_id=$1 AND entity='settings' AND deleted=0 ORDER BY updated_at DESC",[center])).rows;const system=rows.find(r=>r.data.section==='system')?.data||{},study=rows.find(r=>r.data.section==='study')?.data||{};
 if(entity==='attendance'&&system.oldAttendance===false){const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());if(data.date<today||current?.data.date<today)throw fail('O‘tgan dars davomatini o‘zgartirish sozlamalarda taqiqlangan');}
 if(entity==='groups'){
 if(!current&&data.time&&!data.endTime){const [h,m]=data.time.split(':').map(Number),end=h*60+m+Number(study.lessonDuration||60);if(end>=1440)throw fail('Dars bir kun ichida tugashi kerak');data.endTime=String(Math.floor(end/60)).padStart(2,'0')+':'+String(end%60).padStart(2,'0')}
 if(data.time&&data.time<(system.dayStart||'08:00')||data.endTime&&data.endTime>(system.dayEnd||'22:00'))throw fail('Dars vaqti markaz ish vaqtiga mos emas');
 }
 if(study.maxCapacity&&data.group&&((entity==='enrollments'&&data.status!=='Yakunlangan')||(entity==='students'&&data.status!=='Arxiv'))){
 const student=entity==='students'?current?.id:data.student;
 const n=(await db.query(`SELECT COUNT(DISTINCT student_id)::int n FROM (
 SELECT data->>'student' student_id FROM eduka_records WHERE center_id=$1 AND entity='enrollments' AND deleted=0 AND data->>'group'=$2 AND COALESCE(data->>'status','Faol')<>'Yakunlangan'
 UNION SELECT id::text student_id FROM eduka_records WHERE center_id=$1 AND entity='students' AND deleted=0 AND data->>'group'=$2 AND COALESCE(data->>'status','Faol')<>'Arxiv'
 ) members WHERE student_id<>$3`,[center,data.group,student||'00000000-0000-0000-0000-000000000000'])).rows[0].n;if(n>=study.maxCapacity)throw fail('Guruh maksimal sig‘imiga yetdi');
 }
 if(entity==='payment-type'&&data.minimum&&data.maximum&&data.minimum>data.maximum)throw fail('Minimal summa maksimal summadan katta');
 if(entity==='transactions'&&data.category){const c=(await db.query("SELECT data FROM eduka_records WHERE center_id=$1 AND id=$2 AND entity='payment-type' AND deleted=0",[center,data.category])).rows[0]?.data;if(c&&(c.direction!==data.direction||c.minimum&&data.amount<c.minimum||c.maximum&&data.amount>c.maximum))throw fail('Tranzaksiya turi yo‘nalishi yoki summa chegarasi mos emas');}
}
module.exports={validateSettings,rules};
