const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireCenterAuth } = require('../middleware/center-auth');

const router = express.Router();
const PROD = process.env.NODE_ENV === 'production';

function clean(v){ return v == null ? '' : String(v).trim(); }
function err(res,status,message,error){
  return res.status(status).json({ok:false,error:message,...(PROD||!error?{}:{realError:error.message,code:error.code||null})});
}

async function readProfile(userId,centerId){
  const q=await pool.query(`
    SELECT u.id,u.full_name,u.email,u.role,u.status,u.branch_id,u.last_login_at,u.created_at,u.updated_at,
           b.name AS branch_name,
           c.name AS center_name,c.subdomain
      FROM center_users u
      JOIN centers c ON c.id=u.center_id
      LEFT JOIN center_branches b ON b.id=u.branch_id AND b.center_id=u.center_id
     WHERE u.id=$1 AND u.center_id=$2 AND COALESCE(u.status,'active')<>'deleted'
     LIMIT 1`,[userId,centerId]);
  return q.rows[0]||null;
}

function mapProfile(r){
  return {
    id:r.id,
    fullName:r.full_name,
    email:r.email,
    role:r.role,
    roleName:r.role,
    status:r.status||'active',
    branchId:r.branch_id||null,
    branchName:r.branch_name||null,
    lastLoginAt:r.last_login_at||null,
    createdAt:r.created_at||null,
    updatedAt:r.updated_at||null,
  };
}

router.get('/profile-v101',requireCenterAuth,async(req,res)=>{
  try{
    const row=await readProfile(req.centerUser.id,req.centerUser.centerId);
    if(!row) return err(res,404,'Profil topilmadi');
    return res.json({
      ok:true,
      profile:mapProfile(row),
      center:{id:req.centerUser.centerId,name:row.center_name,subdomain:row.subdomain}
    });
  }catch(error){return err(res,500,'Profilni yuklashda xatolik',error);}
});

router.patch('/profile-v101',requireCenterAuth,async(req,res)=>{
  try{
    const fullName=clean(req.body?.fullName||req.body?.name);
    const email=clean(req.body?.email).toLowerCase();
    if(!fullName) return err(res,400,'To‘liq ism kerak');
    if(!email || !email.includes('@')) return err(res,400,'To‘g‘ri email kiriting');

    const q=await pool.query(`
      UPDATE center_users
         SET full_name=$3,email=$4,updated_at=NOW()
       WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted'
       RETURNING id`,[req.centerUser.id,req.centerUser.centerId,fullName,email]);
    if(!q.rows[0]) return err(res,404,'Profil topilmadi');

    const row=await readProfile(req.centerUser.id,req.centerUser.centerId);
    return res.json({ok:true,profile:mapProfile(row),center:{id:req.centerUser.centerId,name:row.center_name,subdomain:row.subdomain}});
  }catch(error){
    if(error.code==='23505') return err(res,409,'Bu email boshqa akkauntda ishlatilgan',error);
    return err(res,500,'Profilni saqlashda xatolik',error);
  }
});

router.patch('/profile-v101/password',requireCenterAuth,async(req,res)=>{
  try{
    const currentPassword=String(req.body?.currentPassword||'');
    const newPassword=String(req.body?.newPassword||'');
    if(!currentPassword) return err(res,400,'Joriy parolni kiriting');
    if(newPassword.length<6) return err(res,400,'Yangi parol kamida 6 belgidan iborat bo‘lsin');

    const q=await pool.query(`SELECT password_hash FROM center_users WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted' LIMIT 1`,[req.centerUser.id,req.centerUser.centerId]);
    const row=q.rows[0];
    if(!row) return err(res,404,'Profil topilmadi');
    const ok=await bcrypt.compare(currentPassword,String(row.password_hash||''));
    if(!ok) return err(res,400,'Joriy parol noto‘g‘ri');

    const hash=await bcrypt.hash(newPassword,10);
    await pool.query('UPDATE center_users SET password_hash=$3,updated_at=NOW() WHERE id=$1 AND center_id=$2',[req.centerUser.id,req.centerUser.centerId,hash]);
    return res.json({ok:true});
  }catch(error){return err(res,500,'Parolni yangilashda xatolik',error);}
});

module.exports=router;
