const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireCenterAuth } = require('../middleware/center-auth');

const router = express.Router();
const PROD = process.env.NODE_ENV === 'production';
const ROLES_KEY = 'rbac.roles.v1';

function clean(v){ return v == null ? '' : String(v).trim(); }
function err(res,status,message,error){ return res.status(status).json({ok:false,error:message,...(PROD||!error?{}:{realError:error.message,code:error.code||null})}); }

const DEFAULT_ROLES = [
  {id:'owner',name:'Owner',description:'Markaz egasi — barcha ruxsatlar',system:true,permissions:['*']},
  {id:'admin',name:'Administrator',description:'CRM boshqaruvi va sozlamalar',system:true,permissions:['dashboard.view','leads.*','students.*','groups.*','teachers.*','attendance.*','reminders.*','finance.*','settings.view','staff.view','staff.manage','roles.view','roles.manage']},
  {id:'manager',name:'Manager',description:'Lidlar, talabalar va guruhlar bilan ishlash',system:true,permissions:['dashboard.view','leads.*','students.*','groups.view','groups.manage','reminders.*','teachers.view','attendance.view']},
  {id:'teacher',name:'Teacher',description:'O‘z guruhlari, talabalar va davomat',system:true,permissions:['dashboard.view','groups.view','students.view','attendance.*','reminders.view']},
  {id:'cashier',name:'Cashier',description:'To‘lovlar va moliya kassasi',system:true,permissions:['dashboard.view','students.view','finance.view','finance.payments','finance.collect']},
  {id:'accountant',name:'Accountant',description:'Moliya va hisobotlar',system:true,permissions:['dashboard.view','finance.*','students.view','groups.view']}
];

async function getRoles(centerId){
  const q=await pool.query('SELECT value FROM center_settings WHERE center_id=$1 AND key=$2 LIMIT 1',[centerId,ROLES_KEY]);
  if(!q.rows[0]?.value) return DEFAULT_ROLES;
  try{
    const parsed=JSON.parse(q.rows[0].value);
    if(Array.isArray(parsed) && parsed.length) return parsed;
  }catch{}
  return DEFAULT_ROLES;
}
async function saveRoles(centerId,roles){
  await pool.query(`INSERT INTO center_settings(center_id,key,value) VALUES($1,$2,$3)
    ON CONFLICT(center_id,key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,[centerId,ROLES_KEY,JSON.stringify(roles)]);
}
function roleMatches(roleId,permission,roles){
  const role=roles.find(r=>String(r.id)===String(roleId)||String(r.name).toLowerCase()===String(roleId||'').toLowerCase());
  if(!role) return false;
  const list=role.permissions||[];
  if(list.includes('*')||list.includes(permission)) return true;
  const mod=permission.split('.')[0];
  return list.includes(mod+'.*');
}
async function requireRbacManage(req,res,next){
  try{
    const role=String(req.centerUser.role||'').toLowerCase();
    if(['owner','director','admin','administrator'].includes(role)) return next();
    const roles=await getRoles(req.centerUser.centerId);
    if(roleMatches(req.centerUser.role,'staff.manage',roles)||roleMatches(req.centerUser.role,'roles.manage',roles)) return next();
    return err(res,403,'Bu amal uchun ruxsat yetarli emas');
  }catch(error){return err(res,500,'Ruxsatni tekshirishda xatolik',error);}
}
function mapStaff(r){return {id:r.id,fullName:r.full_name,email:r.email,role:r.role,status:r.status,lastLoginAt:r.last_login_at,createdAt:r.created_at,updatedAt:r.updated_at};}

router.get('/staff-v081',requireCenterAuth,async(req,res)=>{
  try{
    const [users,roles]=await Promise.all([
      pool.query(`SELECT id,full_name,email,role,status,last_login_at,created_at,updated_at FROM center_users WHERE center_id=$1 AND COALESCE(status,'active')<>'deleted' ORDER BY created_at ASC`,[req.centerUser.centerId]),
      getRoles(req.centerUser.centerId)
    ]);
    return res.json({ok:true,staff:users.rows.map(mapStaff),roles,currentUserId:req.centerUser.id});
  }catch(error){return err(res,500,'Xodimlarni yuklashda xatolik',error);}
});

router.get('/roles-v081',requireCenterAuth,async(req,res)=>{
  try{return res.json({ok:true,roles:await getRoles(req.centerUser.centerId)});}catch(error){return err(res,500,'Rollarni yuklashda xatolik',error);}
});

router.post('/staff-v081',requireCenterAuth,requireRbacManage,async(req,res)=>{
  try{
    const b=req.body||{}; const fullName=clean(b.fullName||b.name),email=clean(b.email).toLowerCase(),password=String(b.password||'');
    if(!fullName||!email||password.length<6) return err(res,400,'Ism, email va kamida 6 belgili parol kerak');
    const roles=await getRoles(req.centerUser.centerId);
    const role=clean(b.role)||'manager';
    if(!roles.some(r=>String(r.id)===role)) return err(res,400,'Noto‘g‘ri rol');
    const hash=await bcrypt.hash(password,10);
    const q=await pool.query(`INSERT INTO center_users(center_id,full_name,email,password_hash,role,status)
      VALUES($1,$2,$3,$4,$5,'active') RETURNING id,full_name,email,role,status,last_login_at,created_at,updated_at`,[req.centerUser.centerId,fullName,email,hash,role]);
    return res.status(201).json({ok:true,staff:mapStaff(q.rows[0])});
  }catch(error){if(error.code==='23505') return err(res,409,'Bu email bilan xodim mavjud',error);return err(res,500,'Xodim yaratishda xatolik',error);}
});

router.patch('/staff-v081/:id',requireCenterAuth,requireRbacManage,async(req,res)=>{
  try{
    const b=req.body||{}; const id=req.params.id;
    if(String(id)===String(req.centerUser.id) && b.status && b.status!=='active') return err(res,400,'O‘zingizni bloklay olmaysiz');
    let role=null;
    if(b.role!=null){
      role=clean(b.role); const roles=await getRoles(req.centerUser.centerId);
      if(!roles.some(r=>String(r.id)===role)) return err(res,400,'Noto‘g‘ri rol');
    }
    const q=await pool.query(`UPDATE center_users SET
      full_name=COALESCE($3,full_name),email=COALESCE($4,email),role=COALESCE($5,role),status=COALESCE($6,status),updated_at=NOW()
      WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted'
      RETURNING id,full_name,email,role,status,last_login_at,created_at,updated_at`,[id,req.centerUser.centerId,clean(b.fullName||b.name)||null,clean(b.email).toLowerCase()||null,role,clean(b.status)||null]);
    if(!q.rows[0]) return err(res,404,'Xodim topilmadi');
    if(String(b.password||'').length>=6){
      const hash=await bcrypt.hash(String(b.password),10);
      await pool.query('UPDATE center_users SET password_hash=$3,updated_at=NOW() WHERE id=$1 AND center_id=$2',[id,req.centerUser.centerId,hash]);
    }
    return res.json({ok:true,staff:mapStaff(q.rows[0])});
  }catch(error){if(error.code==='23505') return err(res,409,'Bu email bilan xodim mavjud',error);return err(res,500,'Xodimni yangilashda xatolik',error);}
});

router.delete('/staff-v081/:id',requireCenterAuth,requireRbacManage,async(req,res)=>{
  try{
    if(String(req.params.id)===String(req.centerUser.id)) return err(res,400,'O‘zingizni o‘chira olmaysiz');
    const q=await pool.query(`UPDATE center_users SET status='deleted',updated_at=NOW() WHERE id=$1 AND center_id=$2 RETURNING id`,[req.params.id,req.centerUser.centerId]);
    if(!q.rows[0]) return err(res,404,'Xodim topilmadi');
    return res.json({ok:true});
  }catch(error){return err(res,500,'Xodimni o‘chirishda xatolik',error);}
});

router.post('/roles-v081',requireCenterAuth,requireRbacManage,async(req,res)=>{
  try{
    const b=req.body||{}; const name=clean(b.name); if(!name) return err(res,400,'Rol nomi kerak');
    const roles=await getRoles(req.centerUser.centerId);
    const id=clean(b.id)||('role_'+Date.now().toString(36));
    if(roles.some(r=>String(r.id)===id)) return err(res,409,'Bu rol mavjud');
    roles.push({id,name,description:clean(b.description),system:false,permissions:Array.isArray(b.permissions)?b.permissions:[]});
    await saveRoles(req.centerUser.centerId,roles); return res.status(201).json({ok:true,roles});
  }catch(error){return err(res,500,'Rol yaratishda xatolik',error);}
});

router.patch('/roles-v081/:id',requireCenterAuth,requireRbacManage,async(req,res)=>{
  try{
    const roles=await getRoles(req.centerUser.centerId); const i=roles.findIndex(r=>String(r.id)===String(req.params.id));
    if(i<0) return err(res,404,'Rol topilmadi');
    const b=req.body||{}; roles[i]={...roles[i],name:clean(b.name)||roles[i].name,description:b.description==null?roles[i].description:clean(b.description),permissions:Array.isArray(b.permissions)?b.permissions:roles[i].permissions};
    await saveRoles(req.centerUser.centerId,roles); return res.json({ok:true,role:roles[i],roles});
  }catch(error){return err(res,500,'Rolni yangilashda xatolik',error);}
});

router.delete('/roles-v081/:id',requireCenterAuth,requireRbacManage,async(req,res)=>{
  try{
    const roles=await getRoles(req.centerUser.centerId); const role=roles.find(r=>String(r.id)===String(req.params.id));
    if(!role) return err(res,404,'Rol topilmadi');
    if(role.system) return err(res,400,'Tizim rolini o‘chirib bo‘lmaydi');
    const inUse=await pool.query(`SELECT COUNT(*)::int count FROM center_users WHERE center_id=$1 AND role=$2 AND COALESCE(status,'active')<>'deleted'`,[req.centerUser.centerId,req.params.id]);
    if(inUse.rows[0].count>0) return err(res,400,'Bu rol xodimga biriktirilgan');
    const next=roles.filter(r=>String(r.id)!==String(req.params.id)); await saveRoles(req.centerUser.centerId,next); return res.json({ok:true,roles:next});
  }catch(error){return err(res,500,'Rolni o‘chirishda xatolik',error);}
});

router.get('/permissions-v081/me',requireCenterAuth,async(req,res)=>{
  try{
    const roles=await getRoles(req.centerUser.centerId); const role=roles.find(r=>String(r.id)===String(req.centerUser.role)||String(r.name).toLowerCase()===String(req.centerUser.role||'').toLowerCase());
    return res.json({ok:true,role:req.centerUser.role,permissions:role?.permissions||[]});
  }catch(error){return err(res,500,'Ruxsatlarni yuklashda xatolik',error);}
});

module.exports=router;
