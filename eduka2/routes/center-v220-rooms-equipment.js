const express=require('express');
const pool=require('../db');
const {requireCenterAuth}=require('../middleware/center-auth');

const router=express.Router();
const PROD=process.env.NODE_ENV==='production';
const clean=v=>v==null?'':String(v).trim();
const num=v=>{const n=Number(v||0);return Number.isFinite(n)?n:0};
const err=(res,status,message,error)=>res.status(status).json({ok:false,error:message,...(PROD||!error?{}:{realError:error.message,code:error.code||null})});

async function ownedRoom(centerId,id){if(!id)return null;const q=await pool.query(`SELECT * FROM rooms WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted' LIMIT 1`,[id,centerId]);return q.rows[0]||null}
async function ownedUser(centerId,id){if(!id)return null;const q=await pool.query(`SELECT id,full_name,email,role,status FROM center_users WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')='active' LIMIT 1`,[id,centerId]);return q.rows[0]||null}
async function staff(centerId){const q=await pool.query(`SELECT id,full_name name,email,role FROM center_users WHERE center_id=$1 AND COALESCE(status,'active')='active' ORDER BY full_name,email`,[centerId]);return q.rows}
function roomMap(r){return{id:r.id,name:r.name,capacity:Number(r.capacity||0),note:r.note||'',responsibleUserId:r.responsible_user_id||null,responsibleName:r.responsible_name||'',responsibleRole:r.responsible_role||'',status:r.status||'active',groupCount:Number(r.group_count||0),equipmentCount:Number(r.equipment_count||0),equipmentValue:num(r.equipment_value),createdAt:r.created_at,updatedAt:r.updated_at}}
function equipmentMap(r){return{id:r.id,roomId:r.room_id||null,roomName:r.room_name||'',name:r.name,inventoryCode:r.inventory_code||'',price:num(r.price),purchasedAt:r.purchased_at,note:r.note||'',status:r.status||'active',createdAt:r.created_at,updatedAt:r.updated_at}}

async function roomRows(centerId){return pool.query(`
 SELECT r.*,cu.full_name responsible_name,cu.role responsible_role,
  COUNT(DISTINCT g.id) FILTER(WHERE COALESCE(g.status,'active')<>'deleted')::int group_count,
  COUNT(DISTINCT e.id) FILTER(WHERE COALESCE(e.status,'active')<>'deleted')::int equipment_count,
  COALESCE(SUM(DISTINCT CASE WHEN COALESCE(e.status,'active')<>'deleted' THEN e.price ELSE 0 END),0)::numeric equipment_value
 FROM rooms r
 LEFT JOIN center_users cu ON cu.id=r.responsible_user_id AND cu.center_id=r.center_id
 LEFT JOIN study_groups g ON g.room_id=r.id AND g.center_id=r.center_id
 LEFT JOIN room_equipments e ON e.room_id=r.id AND e.center_id=r.center_id
 WHERE r.center_id=$1 AND COALESCE(r.status,'active')<>'deleted'
 GROUP BY r.id,cu.id
 ORDER BY r.name`,[centerId])}

router.get('/rooms-v220',requireCenterAuth,async(req,res)=>{
 try{
  const [r,s]=await Promise.all([roomRows(req.centerUser.centerId),staff(req.centerUser.centerId)]);let rooms=r.rows.map(roomMap);const q=clean(req.query.q).toLowerCase();
  if(q)rooms=rooms.filter(x=>[x.name,x.note,x.responsibleName].some(v=>String(v||'').toLowerCase().includes(q)));
  return res.json({ok:true,rooms,staff:s,summary:{rooms:rooms.length,capacity:rooms.reduce((a,x)=>a+x.capacity,0),equipment:rooms.reduce((a,x)=>a+x.equipmentCount,0),equipmentValue:rooms.reduce((a,x)=>a+x.equipmentValue,0),usedRooms:rooms.filter(x=>x.groupCount>0).length}});
 }catch(error){return err(res,500,'Xonalarni yuklashda xatolik',error)}
});

router.post('/rooms-v220',requireCenterAuth,async(req,res)=>{
 try{
  const b=req.body||{};if(!clean(b.name))return err(res,400,'Xona nomi kerak');
  const responsible=b.responsibleUserId?await ownedUser(req.centerUser.centerId,b.responsibleUserId):null;if(b.responsibleUserId&&!responsible)return err(res,400,'Mas’ul xodim topilmadi');
  const q=await pool.query(`INSERT INTO rooms(center_id,name,capacity,note,responsible_user_id,status) VALUES($1,$2,$3,$4,$5,'active') RETURNING id`,[req.centerUser.centerId,clean(b.name),Math.max(0,Number(b.capacity||0)),clean(b.note)||null,responsible?.id||null]);
  const all=await roomRows(req.centerUser.centerId);return res.status(201).json({ok:true,room:roomMap(all.rows.find(x=>String(x.id)===String(q.rows[0].id)))});
 }catch(error){return err(res,500,'Xona yaratishda xatolik',error)}
});

router.put('/rooms-v220/:id',requireCenterAuth,async(req,res)=>{
 try{
  const current=await ownedRoom(req.centerUser.centerId,req.params.id);if(!current)return err(res,404,'Xona topilmadi');const b=req.body||{};
  const responsible=b.responsibleUserId?await ownedUser(req.centerUser.centerId,b.responsibleUserId):null;if(b.responsibleUserId&&!responsible)return err(res,400,'Mas’ul xodim topilmadi');
  await pool.query(`UPDATE rooms SET name=COALESCE($3,name),capacity=COALESCE($4,capacity),note=$5,responsible_user_id=$6,updated_at=NOW() WHERE id=$1 AND center_id=$2`,[req.params.id,req.centerUser.centerId,clean(b.name)||null,b.capacity==null?null:Math.max(0,Number(b.capacity||0)),b.note===undefined?current.note:clean(b.note)||null,b.responsibleUserId===undefined?current.responsible_user_id:(responsible?.id||null)]);
  const all=await roomRows(req.centerUser.centerId);return res.json({ok:true,room:roomMap(all.rows.find(x=>String(x.id)===String(req.params.id)))});
 }catch(error){return err(res,500,'Xonani yangilashda xatolik',error)}
});

router.delete('/rooms-v220/:id',requireCenterAuth,async(req,res)=>{
 try{
  const q=await pool.query(`SELECT COUNT(*)::int count FROM study_groups WHERE center_id=$1 AND room_id=$2 AND COALESCE(status,'active')<>'deleted'`,[req.centerUser.centerId,req.params.id]);if(Number(q.rows[0]?.count||0)>0)return err(res,409,'Avval ushbu xonadagi guruhlarni boshqa xonaga o‘tkazing');
  const d=await pool.query(`UPDATE rooms SET status='deleted',updated_at=NOW() WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted' RETURNING id`,[req.params.id,req.centerUser.centerId]);if(!d.rows[0])return err(res,404,'Xona topilmadi');return res.json({ok:true});
 }catch(error){return err(res,500,'Xonani o‘chirishda xatolik',error)}
});

router.get('/equipment-v220',requireCenterAuth,async(req,res)=>{
 try{
  const cid=req.centerUser.centerId,p=[cid];let where=`e.center_id=$1 AND COALESCE(e.status,'active')<>'deleted'`;
  const add=(sql,val)=>{p.push(val);where+=` ${sql.replace('?',`$${p.length}`)}`};
  const q=clean(req.query.q);if(q)add(`AND (e.name ILIKE ? OR e.inventory_code ILIKE ? OR e.note ILIKE ?)`,`%${q}%`);
  // Search uses one bound value repeated safely by separate condition below when present.
  if(q){p.pop();where=where.replace(/ AND \(e\.name ILIKE \$2 OR e\.inventory_code ILIKE \$2 OR e\.note ILIKE \$2\)$/,'');p.push(`%${q}%`);const ix=p.length;where+=` AND (e.name ILIKE $${ix} OR e.inventory_code ILIKE $${ix} OR e.note ILIKE $${ix})`}
  if(clean(req.query.roomId))add('AND e.room_id=?',clean(req.query.roomId));if(clean(req.query.dateFrom))add('AND e.purchased_at>=?::date',clean(req.query.dateFrom));if(clean(req.query.dateTo))add('AND e.purchased_at<=?::date',clean(req.query.dateTo));
  if(req.query.minPrice!==undefined&&req.query.minPrice!=='')add('AND e.price>=?::numeric',num(req.query.minPrice));if(req.query.maxPrice!==undefined&&req.query.maxPrice!=='')add('AND e.price<=?::numeric',num(req.query.maxPrice));
  const rows=await pool.query(`SELECT e.*,r.name room_name FROM room_equipments e LEFT JOIN rooms r ON r.id=e.room_id AND r.center_id=e.center_id WHERE ${where} ORDER BY e.created_at DESC`,p);const equipment=rows.rows.map(equipmentMap);
  const rooms=await roomRows(cid);return res.json({ok:true,equipment,rooms:rooms.rows.map(roomMap),summary:{count:equipment.length,value:equipment.reduce((a,x)=>a+x.price,0),assigned:equipment.filter(x=>x.roomId).length,unassigned:equipment.filter(x=>!x.roomId).length}});
 }catch(error){return err(res,500,'Jihozlarni yuklashda xatolik',error)}
});

router.post('/equipment-v220',requireCenterAuth,async(req,res)=>{
 try{
  const b=req.body||{};if(!clean(b.name))return err(res,400,'Jihoz nomi kerak');const room=b.roomId?await ownedRoom(req.centerUser.centerId,b.roomId):null;if(b.roomId&&!room)return err(res,400,'Xona topilmadi');
  const q=await pool.query(`INSERT INTO room_equipments(center_id,room_id,name,inventory_code,price,purchased_at,note,status) VALUES($1,$2,$3,$4,$5,$6,$7,'active') RETURNING *`,[req.centerUser.centerId,room?.id||null,clean(b.name),clean(b.inventoryCode)||null,num(b.price),b.purchasedAt||null,clean(b.note)||null]);return res.status(201).json({ok:true,equipment:equipmentMap({...q.rows[0],room_name:room?.name||''})});
 }catch(error){return err(res,500,'Jihoz yaratishda xatolik',error)}
});

router.put('/equipment-v220/:id',requireCenterAuth,async(req,res)=>{
 try{
  const cid=req.centerUser.centerId,cur=await pool.query(`SELECT * FROM room_equipments WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted' LIMIT 1`,[req.params.id,cid]);if(!cur.rows[0])return err(res,404,'Jihoz topilmadi');const b=req.body||{},room=b.roomId?await ownedRoom(cid,b.roomId):null;if(b.roomId&&!room)return err(res,400,'Xona topilmadi');
  const q=await pool.query(`UPDATE room_equipments SET room_id=$3,name=COALESCE($4,name),inventory_code=$5,price=COALESCE($6,price),purchased_at=$7,note=$8,updated_at=NOW() WHERE id=$1 AND center_id=$2 RETURNING *`,[req.params.id,cid,b.roomId===undefined?cur.rows[0].room_id:(room?.id||null),clean(b.name)||null,b.inventoryCode===undefined?cur.rows[0].inventory_code:clean(b.inventoryCode)||null,b.price==null?null:num(b.price),b.purchasedAt===undefined?cur.rows[0].purchased_at:(b.purchasedAt||null),b.note===undefined?cur.rows[0].note:clean(b.note)||null]);return res.json({ok:true,equipment:equipmentMap({...q.rows[0],room_name:room?.name||''})});
 }catch(error){return err(res,500,'Jihozni yangilashda xatolik',error)}
});

router.delete('/equipment-v220/:id',requireCenterAuth,async(req,res)=>{
 try{const q=await pool.query(`UPDATE room_equipments SET status='deleted',updated_at=NOW() WHERE id=$1 AND center_id=$2 AND COALESCE(status,'active')<>'deleted' RETURNING id`,[req.params.id,req.centerUser.centerId]);if(!q.rows[0])return err(res,404,'Jihoz topilmadi');return res.json({ok:true})}catch(error){return err(res,500,'Jihozni o‘chirishda xatolik',error)}
});

module.exports=router;
