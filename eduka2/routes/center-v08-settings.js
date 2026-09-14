const express = require('express');
const pool = require('../db');
const { requireCenterAuth } = require('../middleware/center-auth');

const router = express.Router();
const PROD = process.env.NODE_ENV === 'production';

function clean(v) { return v == null ? '' : String(v).trim(); }
function err(res, status, message, error) {
  return res.status(status).json({ ok:false, error:message, ...(PROD || !error ? {} : { realError:error.message }) });
}
function bool(v, fallback=false) {
  if (v === true || v === 'true' || v === '1' || v === 1) return true;
  if (v === false || v === 'false' || v === '0' || v === 0) return false;
  return fallback;
}
function num(v, fallback=0) { const n=Number(v); return Number.isFinite(n)?n:fallback; }

const SECTION_KEYS = {
  general: ['work_start','work_end','timezone','language','address','logo_url'],
  academic: ['academic.default_lesson_duration','academic.require_student_phone','academic.require_birth_date','academic.require_parent_phone','academic.default_group_capacity'],
  attendance: ['attendance.enabled','attendance.default_present','attendance.allow_backfill','attendance.auto_remove_after_absences','attendance.absence_limit','attendance.max_mark'],
  finance: ['finance.currency','finance.debt_limit','finance.confirm_cashbox_transfer','finance.cancellation_note_required','finance.withdrawal_time','finance.keep_old_course_price_on_transfer'],
  receipt: ['receipt.logo_url','receipt.header','receipt.footer','receipt.show_center_phone','receipt.show_student_phone','receipt.show_group','receipt.show_payment_method','receipt.show_qr','receipt.qr_url'],
  integrations: ['integration.telegram_enabled','integration.sms_enabled','integration.google_sheets_enabled','integration.click_enabled','integration.payme_enabled']
};

const DEFAULTS = {
  work_start:'09:00', work_end:'18:00', timezone:'Asia/Tashkent', language:'uz', address:'', logo_url:'',
  'academic.default_lesson_duration':'90', 'academic.require_student_phone':'true', 'academic.require_birth_date':'false', 'academic.require_parent_phone':'false', 'academic.default_group_capacity':'12',
  'attendance.enabled':'true', 'attendance.default_present':'false', 'attendance.allow_backfill':'true', 'attendance.auto_remove_after_absences':'false', 'attendance.absence_limit':'3', 'attendance.max_mark':'100',
  'finance.currency':'UZS', 'finance.debt_limit':'0', 'finance.confirm_cashbox_transfer':'true', 'finance.cancellation_note_required':'true', 'finance.withdrawal_time':'00:00', 'finance.keep_old_course_price_on_transfer':'false',
  'receipt.logo_url':'', 'receipt.header':'', 'receipt.footer':'EDUKA CRM orqali yaratildi', 'receipt.show_center_phone':'true', 'receipt.show_student_phone':'true', 'receipt.show_group':'true', 'receipt.show_payment_method':'true', 'receipt.show_qr':'false', 'receipt.qr_url':'',
  'integration.telegram_enabled':'false', 'integration.sms_enabled':'false', 'integration.google_sheets_enabled':'false', 'integration.click_enabled':'false', 'integration.payme_enabled':'false'
};

async function readSettings(centerId) {
  const q = await pool.query('SELECT key,value FROM center_settings WHERE center_id=$1',[centerId]);
  const map = { ...DEFAULTS };
  for (const row of q.rows) map[row.key] = row.value;
  return map;
}

function sectionObject(section, map) {
  const out={};
  for (const key of SECTION_KEYS[section] || []) {
    const short = key.includes('.') ? key.split('.').slice(1).join('_') : key;
    out[short]=map[key] ?? DEFAULTS[key] ?? '';
  }
  return out;
}

router.get('/settings-v2', requireCenterAuth, async (req,res)=>{
  try {
    const [centerQ, map] = await Promise.all([
      pool.query(`SELECT id,name,subdomain,owner_name,owner_phone,owner_email,tariff,status,trial_ends_at,next_payment_date,branches_count FROM centers WHERE id=$1 LIMIT 1`,[req.centerUser.centerId]),
      readSettings(req.centerUser.centerId)
    ]);
    const center=centerQ.rows[0];
    if(!center) return err(res,404,'Markaz topilmadi');
    return res.json({
      ok:true,
      center:{
        id:center.id,name:center.name,subdomain:center.subdomain,ownerName:center.owner_name||'',ownerPhone:center.owner_phone||'',ownerEmail:center.owner_email||'',tariff:center.tariff,status:center.status,trialEndsAt:center.trial_ends_at,nextPaymentDate:center.next_payment_date,branchesCount:center.branches_count||1
      },
      sections:{
        general:sectionObject('general',map),
        academic:sectionObject('academic',map),
        attendance:sectionObject('attendance',map),
        finance:sectionObject('finance',map),
        receipt:sectionObject('receipt',map),
        integrations:sectionObject('integrations',map)
      }
    });
  } catch(error){ return err(res,500,'Sozlamalarni yuklashda xatolik',error); }
});

router.patch('/settings-v2/general', requireCenterAuth, async(req,res)=>{
  const client=await pool.connect();
  try{
    const b=req.body||{};
    await client.query('BEGIN');
    await client.query(`UPDATE centers SET name=COALESCE($2,name),owner_name=COALESCE($3,owner_name),owner_phone=COALESCE($4,owner_phone),owner_email=COALESCE($5,owner_email),updated_at=NOW() WHERE id=$1`,[
      req.centerUser.centerId, clean(b.name)||null, clean(b.ownerName)||null, clean(b.ownerPhone)||null, clean(b.ownerEmail)||null
    ]);
    const pairs=[['work_start',clean(b.workStart)||'09:00'],['work_end',clean(b.workEnd)||'18:00'],['timezone',clean(b.timezone)||'Asia/Tashkent'],['language',clean(b.language)||'uz'],['address',clean(b.address)],['logo_url',clean(b.logoUrl)]];
    for(const [key,value] of pairs) await client.query(`INSERT INTO center_settings(center_id,key,value) VALUES($1,$2,$3) ON CONFLICT(center_id,key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,[req.centerUser.centerId,key,value]);
    await client.query('COMMIT'); client.release();
    return res.json({ok:true});
  }catch(error){await client.query('ROLLBACK').catch(()=>{});client.release();return err(res,500,'Umumiy sozlamalarni saqlashda xatolik',error);}
});

router.patch('/settings-v2/:section', requireCenterAuth, async(req,res)=>{
  try{
    const section=req.params.section;
    if(section==='general') return err(res,400,'General uchun alohida endpoint ishlatiladi');
    const keys=SECTION_KEYS[section];
    if(!keys) return err(res,404,'Sozlama bo‘limi topilmadi');
    const b=req.body||{};
    const entries=[];
    for(const key of keys){
      const short=key.split('.').slice(1).join('_');
      if(!(short in b)) continue;
      let value=b[short];
      if(typeof value==='boolean') value=value?'true':'false';
      else value=String(value??'');
      entries.push([key,value]);
    }
    for(const [key,value] of entries){
      await pool.query(`INSERT INTO center_settings(center_id,key,value) VALUES($1,$2,$3) ON CONFLICT(center_id,key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,[req.centerUser.centerId,key,value]);
    }
    return res.json({ok:true,saved:entries.length});
  }catch(error){return err(res,500,'Sozlamalarni saqlashda xatolik',error);}
});

router.get('/settings-v2/preview/receipt', requireCenterAuth, async(req,res)=>{
  try{
    const map=await readSettings(req.centerUser.centerId);
    const c=await pool.query('SELECT name,owner_phone FROM centers WHERE id=$1',[req.centerUser.centerId]);
    return res.json({ok:true,preview:{centerName:c.rows[0]?.name||'O‘quv markaz',phone:c.rows[0]?.owner_phone||'',header:map['receipt.header']||'',footer:map['receipt.footer']||'',currency:map['finance.currency']||'UZS',logoUrl:map['receipt.logo_url']||map.logo_url||'',showQr:bool(map['receipt.show_qr']),qrUrl:map['receipt.qr_url']||''}});
  }catch(error){return err(res,500,'Chek preview xatoligi',error);}
});

module.exports=router;
