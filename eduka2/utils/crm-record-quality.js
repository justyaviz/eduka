const {pages,fieldsFor}=require('./crm-catalog.cjs');
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
function fields(entity){const seen=new Map();for(const p of pages.filter(p=>p.entity===entity))for(const f of fieldsFor(p))seen.set(f.key,f);return [...seen.values()]}
function normalize(entity,data){
 if(entity==='transactions'&&(!Number.isFinite(data.amount)||data.amount<=0))throw fail('To‘lov summasi noldan katta bo‘lsin');
 for(const f of fields(entity)){let v=data[f.key];if(v===undefined)continue;if(typeof v==='string')data[f.key]=v=v.trim();if(v==='')continue;if(['text','textarea','date','time','month','tel','email','url','relation','file','color'].includes(f.type||'text')&&typeof v!=='string')throw fail(f.label+': matn kiriting');if(f.type==='checkbox'&&typeof v!=='boolean')throw fail(f.label+': qiymat noto‘g‘ri');
 if(f.type==='tel'){if(typeof v!=='string'||!/^[+\d\s()-]+$/.test(v))throw fail(f.label+': telefon formati noto‘g‘ri');let digits=v.replace(/\D/g,'');if(digits.length===9)digits='998'+digits;if(!/^[1-9]\d{7,14}$/.test(digits)||digits.startsWith('998')&&digits.length!==12)throw fail(f.label+': +998 90 123 45 67 shaklida kiriting');data[f.key]='+'+digits;}
 if(f.type==='email'){if(typeof v!=='string'||v.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(v))throw fail(f.label+': email noto‘g‘ri');data[f.key]=v.toLowerCase()}
 if(f.type==='url'){try{if(!['http:','https:'].includes(new URL(v).protocol))throw Error()}catch{throw fail(f.label+': http yoki https havola kiriting')}}
 if(f.type==='month'&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(v))throw fail(f.label+': oy noto‘g‘ri');
 if(f.key==='birthDate'&&v>new Date().toISOString().slice(0,10))throw fail('Tug‘ilgan sana kelajakda bo‘lishi mumkin emas');
 if(f.type==='number'&&typeof v==='number'&&Math.abs(v)>Number.MAX_SAFE_INTEGER)throw fail(f.label+': raqam juda katta');
 if(['amount','price','monthlyPrice','salary','lessonRate','minimum','maximum'].includes(f.key)&&typeof v==='number'&&Math.abs(v*100-Math.round(v*100))>0.001)throw fail(f.label+': ko‘pi bilan 2 ta kasr xonasi kiriting');
 }
}
const nameKey=v=>String(v||'').normalize('NFKC').toLowerCase().replace(/[‘’ʻʼ`]/g,"'").replace(/\s+/g,' ').trim();
const phoneKey=v=>{let s=String(v||'').replace(/\D/g,'');return s.length===9?'998'+s:s};
async function check(db,center,entity,data,current){
 if(!['students','employees','parents','courses','groups','rooms','branches','roles','cash','payment-type'].includes(entity))return;
 const rows=(await db.query('SELECT id,data FROM eduka_records WHERE center_id=$1 AND entity=$2 AND deleted=0 AND id<>$3',[center,entity,current?.id||'00000000-0000-0000-0000-000000000000'])).rows;
 const duplicate=rows.some(({data:d})=>{
 if(['students','employees','parents'].includes(entity))return entity==='employees'&&data.email&&nameKey(data.email)===nameKey(d.email)||data.phone&&phoneKey(data.phone)===phoneKey(d.phone)&&nameKey(data.name+' '+(data.surname||''))===nameKey(d.name+' '+(d.surname||''))&&(entity!=='parents'||data.student===d.student);
 return nameKey(data.name)===nameKey(d.name)&&String(data.branch||'')===String(d.branch||'')&&(entity!=='payment-type'||data.direction===d.direction);
 });if(duplicate)throw fail('Bunday faol yozuv mavjud. Mavjud yozuvni qidiring va tahrirlang.',409);
}
async function beforeArchive(db,center,current){
 if(!['courses','rooms','branches','roles','cash','payment-type'].includes(current.entity))return;
 const refs=new Map();for(const p of pages)for(const f of fieldsFor(p))if(f.type==='relation'&&f.entity===current.entity)refs.set(p.entity+':'+f.key,{entity:p.entity,key:f.key,title:p.title});
 for(const ref of refs.values()){const result=await db.query("SELECT id FROM eduka_records WHERE center_id=$1 AND entity=$2 AND deleted=0 AND data->>$3=$4 LIMIT 1",[center,ref.entity,ref.key,current.id]);if(result.rows.length)throw fail('Bu yozuv '+ref.title+' bo‘limida ishlatilmoqda. Avval bog‘lanishni o‘zgartiring yoki tegishli yozuvni arxivlang.',409)}
}
module.exports={normalize,check,beforeArchive};
