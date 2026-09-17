const router=require('express').Router();
const pool=require('../db');
const {requireCeoAuth}=require('../middleware/auth');
const {tenantFromRequest}=require('../utils/tenant');
const {createHash,randomUUID}=require('node:crypto');
const rateLimit=require('express-rate-limit');
const eskiz=require('../utils/eskiz');
router.use(requireCeoAuth,(req,res,next)=>{res.set('Cache-Control','no-store');if(tenantFromRequest(req)||String(req.user.role).toUpperCase()!=='CEO')return res.status(403).json({error:'Faqat CEO paneli uchun'});next()});
router.use(rateLimit({windowMs:60000,limit:30,keyGenerator:req=>req.user.id,standardHeaders:true,legacyHeaders:false,message:{error:'Bir daqiqada ko‘p so‘rov yuborildi. Biroz kuting.'}}));
router.get('/status',async(req,res)=>{try{let configured=true;try{eskiz.settings()}catch{configured=false}const token=(await pool.query('SELECT expires_at,updated_at FROM eskiz_tokens WHERE id=1')).rows[0];res.json({ok:true,configured,from:process.env.ESKIZ_FROM||'4546',tokenExpiresAt:token?.expires_at||null})}catch{res.status(500).json({error:'SMS holati yuklanmadi'})}});
router.post('/check',async(req,res)=>{try{await eskiz.token(pool);res.json({ok:true,message:'Eskiz bilan autentifikatsiya muvaffaqiyatli. SMS yuborilmadi.'})}catch(e){res.status(e.status||502).json({error:e.status?e.message:'Eskiz ulanishi tekshirilmadi'})}});
router.get('/history',async(req,res)=>{try{res.json({ok:true,messages:(await pool.query('SELECT id,phone,message,status,provider_id,error,created_at FROM eduka_sms_messages ORDER BY created_at DESC LIMIT 100')).rows})}catch{res.status(500).json({error:'SMS tarixi yuklanmadi'})}});
router.post('/send',async(req,res)=>{const b=req.body||{};if(typeof b.phone!=='string'||typeof b.message!=='string')return res.status(400).json({error:'Telefon va SMS matnini kiriting'});const phone=b.phone.replace(/[+\s()-]/g,''),message=b.message.trim();if(!/^998\d{9}$/.test(phone)||!message||message.length>1000)return res.status(400).json({error:'Telefon: 998XXXXXXXXX. SMS matni 1–1000 belgi bo‘lsin.'});const requestKey=req.get('Idempotency-Key')||createHash('sha256').update(req.user.id+phone+message+Math.floor(Date.now()/60000)).digest('hex');if(!/^[a-zA-Z0-9_-]{8,100}$/.test(requestKey))return res.status(400).json({error:'So‘rov kaliti noto‘g‘ri'});
 let id;try{eskiz.settings();const inserted=await pool.query("INSERT INTO eduka_sms_messages(id,actor_id,request_key,phone,message,status) VALUES($1,$2,$3,$4,$5,'processing') ON CONFLICT(actor_id,request_key) DO NOTHING RETURNING id",[randomUUID(),req.user.id,requestKey,phone,message]);if(!inserted.rows.length){const row=(await pool.query('SELECT id,phone,message,status,error FROM eduka_sms_messages WHERE actor_id=$1 AND request_key=$2',[req.user.id,requestKey])).rows[0];if(row.phone!==phone||row.message!==message)return res.status(409).json({error:'So‘rov kaliti boshqa SMS uchun ishlatilgan'});return res.json({ok:true,id:row.id,status:row.status,error:row.error,duplicate:true})}id=inserted.rows[0].id;
 let result;try{result=await eskiz.send(pool,phone,message)}catch(e){result={status:'failed',error:e.status?e.message:'SMS tayyorlashda xatolik'}}
 await pool.query('UPDATE eduka_sms_messages SET status=$2,provider_id=$3,error=$4 WHERE id=$1',[id,result.status,result.providerId||null,result.error||null]);res.json({ok:true,id,...result});
 }catch(e){res.status(e.status||500).json({error:id?'Natija saqlanmadi. Qayta yuborishdan oldin SMS tarixini tekshiring.':e.status?e.message:'SMS so‘rovi bajarilmadi'})}
});
module.exports=router;
