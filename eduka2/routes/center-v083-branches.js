const express=require('express');
const pool=require('../db');
const {requireCenterAuth}=require('../middleware/center-auth');

const router=express.Router();
const PROD=process.env.NODE_ENV==='production';
const ROLES_KEY='rbac.roles.v1';

function clean(v){return v==null?'':String(v).trim();}
function err(res,status,message,error){return res.status(status).json({ok:false,error:message,...(PROD||!error?{}:{realError:error.message,code:error.code||null})});}
function n(v){if(v===''||v==null)return null;const x=Number(v);return Number.isFinite(x)?x:null;}

async function canManage(req){
  const role=String(req.centerUser.role||'').toLowerCase();
  if(['owner','director','admin','administrator'].includes(role))return true;
  const q=await pool.query('SELECT value FROM center_settings WHERE center_id=$1 AND key=$2 LIMIT 1',[req.centerUser.centerId,ROLES_KEY]);
  if(!q.rows[0]?.value)return false;
  try{
    const roles=JSON.parse(q.rows[0].value)||[];
    const r=roles.find(x=>String(x.id)===String(req.centerUser.role)||String(x.name||'').toLowerCase()===role);
    const p=r?.permissions||[];
    return p.includes('*')||p.includes('settings.manage')||p.includes('branches.manage');
  }catch{return false;}
}
async function requireManage(req,res,next){try{if(await canManage(req))return next();return err(res,403,'Filiallarni boshqarish uchun ruxsat yetarli emas');}catch(error){return err(res,500,'Ruxsat tekshiruvida xatolik',error);}}

function branchMap(r){return {id:r.id,name:r.name,phone:r.phone||'',address:r.address||'',latitude:r.latitude==null?null:Number(r.latitude),longitude:r.longitude==null?null:Number(r.longitude),isMain:!!r.is_main,status:r.status,staffCount:Number(r.staff_count||0),groupCount:Number(r.group_count||0),createdAt:r.created_at,updatedAt:r.updated_at};}

async function activeBranch(centerId,id){
  if(!id)return null;
  const q=await pool.query(`SELECT * FROM center_branches WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted' LIMIT 1`,[id,centerId]);
  return q.rows[0]||null;
}
async function syncCount(centerId,client=pool){
  await client.query(`UPDATE centers SET branches_count=(SELECT COUNT(*)::int FROM center_branches WHERE center_id=$1 AND COALESCE(status,'active')<>'deleted'),updated_at=NOW() WHERE id=$1`,[centerId]);
}

router.get('/branches-v083',requireCenterAuth,async(req,res)=>{
  try{
    const id=req.centerUser.centerId;
    const [branches,staff,groups]=await Promise.all([
      pool.query(`SELECT b.*,
        (SELECT COUNT(*) FROM center_users u WHERE u.center_id=b.center_id AND u.branch_id=b.id AND COALESCE(u.status,'active')<>'deleted')::int staff_count,
        (SELECT COUNT(*) FROM study_groups g WHERE g.center_id=b.center_id AND g.branch_id=b.id AND COALESCE(g.status,'active')<>'deleted')::int group_count
        FROM center_branches b WHERE b.center_id=$1 AND COALESCE(b.status,'active')<>'deleted' ORDER BY b.is_main DESC,b.created_at ASC`,[id]),
      pool.query(`SELECT id,full_name,email,role,status,branch_id FROM center_users WHERE center_id=$1 AND COALESCE(status,'active')<>'deleted' ORDER BY full_name`,[id]),
      pool.query(`SELECT g.id,g.name,g.branch_id,g.status,c.name course_name,t.full_name teacher_name FROM study_groups g LEFT JOIN courses c ON c.id=g.course_id LEFT JOIN teachers t ON t.id=g.teacher_id WHERE g.center_id=$1 AND COALESCE(g.status,'active')<>'deleted' ORDER BY g.name`,[id])
    ]);
    return res.json({ok:true,branches:branches.rows.map(branchMap),staff:staff.rows.map(x=>({id:x.id,fullName:x.full_name,email:x.email,role:x.role,status:x.status,branchId:x.branch_id})),groups:groups.rows.map(x=>({id:x.id,name:x.name,branchId:x.branch_id,status:x.status,courseName:x.course_name||'',teacherName:x.teacher_name||''}))});
  }catch(error){return err(res,500,'Filiallarni yuklashda xatolik',error);}
});

router.post('/branches-v083',requireCenterAuth,requireManage,async(req,res)=>{
  const client=await pool.connect();
  try{
    const b=req.body||{},name=clean(b.name),lat=n(b.latitude),lng=n(b.longitude);
    if(!name){client.release();return err(res,400,'Filial nomi kerak');}
    if(lat!=null&&(lat<-90||lat>90)){client.release();return err(res,400,'Latitude noto‘g‘ri');}
    if(lng!=null&&(lng<-180||lng>180)){client.release();return err(res,400,'Longitude noto‘g‘ri');}
    await client.query('BEGIN');
    const dup=await client.query(`SELECT id FROM center_branches WHERE center_id=$1 AND lower(name)=lower($2) AND COALESCE(status,'active')<>'deleted' LIMIT 1`,[req.centerUser.centerId,name]);
    if(dup.rows[0]){await client.query('ROLLBACK');client.release();return err(res,409,'Bu nomli filial mavjud');}
    const count=await client.query(`SELECT COUNT(*)::int count FROM center_branches WHERE center_id=$1 AND COALESCE(status,'active')<>'deleted'`,[req.centerUser.centerId]);
    const makeMain=b.isMain===true||count.rows[0].count===0;
    if(makeMain)await client.query(`UPDATE center_branches SET is_main=FALSE,updated_at=NOW() WHERE center_id=$1`,[req.centerUser.centerId]);
    const q=await client.query(`INSERT INTO center_branches(center_id,name,phone,address,latitude,longitude,is_main,status) VALUES($1,$2,$3,$4,$5,$6,$7,'active') RETURNING *`,[req.centerUser.centerId,name,clean(b.phone)||null,clean(b.address)||null,lat,lng,makeMain]);
    await syncCount(req.centerUser.centerId,client);
    await client.query('COMMIT');client.release();
    return res.status(201).json({ok:true,branch:branchMap(q.rows[0])});
  }catch(error){await client.query('ROLLBACK').catch(()=>{});client.release();return err(res,500,'Filial yaratishda xatolik',error);}
});

router.patch('/branches-v083/:id',requireCenterAuth,requireManage,async(req,res)=>{
  const client=await pool.connect();
  try{
    const b=req.body||{},lat=b.latitude===undefined?undefined:n(b.latitude),lng=b.longitude===undefined?undefined:n(b.longitude);
    if(lat!==undefined&&lat!=null&&(lat<-90||lat>90)){client.release();return err(res,400,'Latitude noto‘g‘ri');}
    if(lng!==undefined&&lng!=null&&(lng<-180||lng>180)){client.release();return err(res,400,'Longitude noto‘g‘ri');}
    await client.query('BEGIN');
    const current=await client.query(`SELECT * FROM center_branches WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted' FOR UPDATE`,[req.params.id,req.centerUser.centerId]);
    if(!current.rows[0]){await client.query('ROLLBACK');client.release();return err(res,404,'Filial topilmadi');}
    if(b.isMain===true)await client.query(`UPDATE center_branches SET is_main=FALSE,updated_at=NOW() WHERE center_id=$1 AND id<>$2`,[req.centerUser.centerId,req.params.id]);
    const q=await client.query(`UPDATE center_branches SET name=COALESCE($3,name),phone=CASE WHEN $4::text IS NULL THEN phone ELSE $4 END,address=CASE WHEN $5::text IS NULL THEN address ELSE $5 END,latitude=CASE WHEN $6::numeric IS NULL AND $8::boolean=FALSE THEN latitude ELSE $6 END,longitude=CASE WHEN $7::numeric IS NULL AND $9::boolean=FALSE THEN longitude ELSE $7 END,is_main=CASE WHEN $10::boolean THEN TRUE ELSE is_main END,updated_at=NOW() WHERE id=$1 AND center_id=$2 RETURNING *`,[req.params.id,req.centerUser.centerId,clean(b.name)||null,b.phone===undefined?null:clean(b.phone),b.address===undefined?null:clean(b.address),lat===undefined?null:lat,lng===undefined?null:lng,b.latitude!==undefined,b.longitude!==undefined,b.isMain===true]);
    await client.query('COMMIT');client.release();return res.json({ok:true,branch:branchMap(q.rows[0])});
  }catch(error){await client.query('ROLLBACK').catch(()=>{});client.release();return err(res,500,'Filialni yangilashda xatolik',error);}
});

router.delete('/branches-v083/:id',requireCenterAuth,requireManage,async(req,res)=>{
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const q=await client.query(`SELECT * FROM center_branches WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted' FOR UPDATE`,[req.params.id,req.centerUser.centerId]);
    const branch=q.rows[0];
    if(!branch){await client.query('ROLLBACK');client.release();return err(res,404,'Filial topilmadi');}
    if(branch.is_main){await client.query('ROLLBACK');client.release();return err(res,400,'Asosiy filialni o‘chirib bo‘lmaydi');}
    const assigned=await client.query(`SELECT (SELECT COUNT(*) FROM center_users WHERE center_id=$1 AND branch_id=$2 AND COALESCE(status,'active')<>'deleted')::int staff,(SELECT COUNT(*) FROM study_groups WHERE center_id=$1 AND branch_id=$2 AND COALESCE(status,'active')<>'deleted')::int groups`,[req.centerUser.centerId,req.params.id]);
    if(Number(assigned.rows[0].staff)+Number(assigned.rows[0].groups)>0){await client.query('ROLLBACK');client.release();return err(res,400,'Avval filialdagi xodim va guruhlarni boshqa filialga o‘tkazing');}
    await client.query(`UPDATE center_branches SET status='deleted',updated_at=NOW() WHERE id=$1 AND center_id=$2`,[req.params.id,req.centerUser.centerId]);
    await syncCount(req.centerUser.centerId,client);await client.query('COMMIT');client.release();return res.json({ok:true});
  }catch(error){await client.query('ROLLBACK').catch(()=>{});client.release();return err(res,500,'Filialni o‘chirishda xatolik',error);}
});

router.patch('/branches-v083/staff/:id',requireCenterAuth,requireManage,async(req,res)=>{
  try{
    const branch=await activeBranch(req.centerUser.centerId,req.body?.branchId);
    if(!branch)return err(res,400,'Filial tanlanmagan yoki topilmadi');
    const q=await pool.query(`UPDATE center_users SET branch_id=$3,updated_at=NOW() WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted' RETURNING id,full_name,email,role,status,branch_id`,[req.params.id,req.centerUser.centerId,branch.id]);
    if(!q.rows[0])return err(res,404,'Xodim topilmadi');return res.json({ok:true,staff:{id:q.rows[0].id,fullName:q.rows[0].full_name,email:q.rows[0].email,role:q.rows[0].role,status:q.rows[0].status,branchId:q.rows[0].branch_id}});
  }catch(error){return err(res,500,'Xodim filialini saqlashda xatolik',error);}
});

router.patch('/branches-v083/groups/:id',requireCenterAuth,requireManage,async(req,res)=>{
  try{
    const branch=await activeBranch(req.centerUser.centerId,req.body?.branchId);
    if(!branch)return err(res,400,'Filial tanlanmagan yoki topilmadi');
    const q=await pool.query(`UPDATE study_groups SET branch_id=$3,updated_at=NOW() WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted' RETURNING id,name,branch_id`,[req.params.id,req.centerUser.centerId,branch.id]);
    if(!q.rows[0])return err(res,404,'Guruh topilmadi');return res.json({ok:true,group:{id:q.rows[0].id,name:q.rows[0].name,branchId:q.rows[0].branch_id}});
  }catch(error){return err(res,500,'Guruh filialini saqlashda xatolik',error);}
});

module.exports=router;
