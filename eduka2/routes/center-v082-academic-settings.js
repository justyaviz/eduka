const express = require('express');
const pool = require('../db');
const { requireCenterAuth } = require('../middleware/center-auth');

const router = express.Router();
const PROD = process.env.NODE_ENV === 'production';

const KEYS = {
  levels: 'academic.levels.v1',
  reasons: 'academic.reasons.v1',
  grades: 'academic.grades.v1'
};

const REASON_TYPES = new Set(['attendance','student_leave','lead_lost','payment_cancel','other']);

function clean(v){ return v == null ? '' : String(v).trim(); }
function num(v, fallback=0){ const n=Number(v); return Number.isFinite(n) ? n : fallback; }
function bool(v, fallback=true){ if(v===true||v==='true'||v===1||v==='1')return true;if(v===false||v==='false'||v===0||v==='0')return false;return fallback; }
function err(res,status,message,error){ return res.status(status).json({ok:false,error:message,...(PROD||!error?{}:{realError:error.message,code:error.code||null})}); }
function color(v, fallback='#4565E3'){ const s=clean(v); return /^#[0-9a-fA-F]{6}$/.test(s) ? s.toUpperCase() : fallback; }
function makeId(prefix){ return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`; }

async function readJson(centerId,key){
  const q=await pool.query('SELECT value FROM center_settings WHERE center_id=$1 AND key=$2 LIMIT 1',[centerId,key]);
  if(!q.rows[0]?.value) return [];
  try{ const v=JSON.parse(q.rows[0].value); return Array.isArray(v)?v:[]; }catch{return [];}
}
async function writeJson(centerId,key,value){
  await pool.query(`INSERT INTO center_settings(center_id,key,value) VALUES($1,$2,$3)
    ON CONFLICT(center_id,key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,[centerId,key,JSON.stringify(value)]);
}
async function canManage(req){
  const role=String(req.centerUser.role||'').toLowerCase();
  if(['owner','director','admin','administrator'].includes(role)) return true;
  const q=await pool.query("SELECT value FROM center_settings WHERE center_id=$1 AND key='rbac.roles.v1' LIMIT 1",[req.centerUser.centerId]);
  if(!q.rows[0]?.value) return false;
  try{
    const roles=JSON.parse(q.rows[0].value);
    const current=(Array.isArray(roles)?roles:[]).find(r=>String(r.id)===String(req.centerUser.role)||String(r.name||'').toLowerCase()===role);
    const perms=current?.permissions||[];
    return perms.includes('*')||perms.includes('settings.manage')||perms.includes('academic.*')||perms.includes('academic.manage');
  }catch{return false;}
}
async function requireManage(req,res,next){
  try{ if(await canManage(req)) return next(); return err(res,403,'Akademik sozlamalarni o‘zgartirish uchun ruxsat yetarli emas'); }
  catch(error){ return err(res,500,'Ruxsatni tekshirishda xatolik',error); }
}

function normalizeLevels(items){
  return items.map((x,i)=>({
    id: clean(x.id)||makeId('lvl'),
    name: clean(x.name),
    code: clean(x.code),
    color: color(x.color),
    price: Math.max(0,num(x.price,0)),
    courseId: clean(x.courseId)||null,
    active: bool(x.active,true),
    sortOrder: Number.isFinite(Number(x.sortOrder))?Number(x.sortOrder):i
  })).filter(x=>x.name).slice(0,200);
}
function normalizeReasons(items){
  return items.map(x=>({
    id: clean(x.id)||makeId('reason'),
    name: clean(x.name),
    type: REASON_TYPES.has(clean(x.type))?clean(x.type):'other',
    deductMoney: bool(x.deductMoney,false),
    trialNoCharge: bool(x.trialNoCharge,false),
    active: bool(x.active,true)
  })).filter(x=>x.name).slice(0,300);
}
function normalizeGrades(items){
  return items.map((x,i)=>{
    let min=Math.max(0,Math.min(100,num(x.minScore,0))), max=Math.max(0,Math.min(100,num(x.maxScore,100)));
    if(min>max){ const t=min; min=max; max=t; }
    return {
      id: clean(x.id)||makeId('grade'),
      name: clean(x.name),
      color: color(x.color,'#2DBE74'),
      minScore:min,
      maxScore:max,
      active:bool(x.active,true),
      sortOrder:Number.isFinite(Number(x.sortOrder))?Number(x.sortOrder):i
    };
  }).filter(x=>x.name).slice(0,100);
}
function normalize(kind,items){
  if(!Array.isArray(items)) return null;
  if(kind==='levels') return normalizeLevels(items);
  if(kind==='reasons') return normalizeReasons(items);
  if(kind==='grades') return normalizeGrades(items);
  return null;
}

router.get('/academic-config-v082',requireCenterAuth,async(req,res)=>{
  try{
    const [levels,reasons,grades,courses]=await Promise.all([
      readJson(req.centerUser.centerId,KEYS.levels),
      readJson(req.centerUser.centerId,KEYS.reasons),
      readJson(req.centerUser.centerId,KEYS.grades),
      pool.query(`SELECT id,name,price,status FROM courses WHERE center_id=$1 AND COALESCE(status,'active')<>'deleted' ORDER BY name`,[req.centerUser.centerId])
    ]);
    return res.json({ok:true,levels,reasons,grades,courses:courses.rows.map(x=>({id:x.id,name:x.name,price:num(x.price),status:x.status}))});
  }catch(error){return err(res,500,'Akademik sozlamalarni yuklashda xatolik',error);}
});

router.put('/academic-config-v082/:kind',requireCenterAuth,requireManage,async(req,res)=>{
  try{
    const kind=req.params.kind;
    if(!KEYS[kind]) return err(res,404,'Akademik bo‘lim topilmadi');
    const items=normalize(kind,req.body?.items);
    if(!items) return err(res,400,'items massivi kerak');
    await writeJson(req.centerUser.centerId,KEYS[kind],items);
    pool.query(`INSERT INTO center_activity_logs(center_id,user_id,action,module,details) VALUES($1,$2,$3,'settings',$4)`,[
      req.centerUser.centerId,req.centerUser.id,`Akademik sozlama yangilandi: ${kind}`,JSON.stringify({kind,count:items.length})
    ]).catch(()=>{});
    return res.json({ok:true,items});
  }catch(error){return err(res,500,'Akademik sozlamalarni saqlashda xatolik',error);}
});

module.exports=router;
