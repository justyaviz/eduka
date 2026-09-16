const express=require('express');
const {requireCeoAuth}=require('../middleware/auth');
const pool=require('../db');
const router=express.Router();
router.use(requireCeoAuth);
router.get('/threads',async(req,res,next)=>{try{const rows=(await pool.query(`SELECT m.center_id,m.user_id,c.name center_name,u.full_name,MAX(m.created_at) updated_at,COUNT(*) FILTER(WHERE m.sender='user' AND m.read_at IS NULL)::int unread FROM eduka_support_messages m JOIN centers c ON c.id=m.center_id JOIN center_users u ON u.id=m.user_id AND u.center_id=m.center_id GROUP BY m.center_id,m.user_id,c.name,u.full_name ORDER BY updated_at DESC LIMIT 200`)).rows;res.json({threads:rows})}catch(e){next(e)}});
router.get('/messages',async(req,res,next)=>{try{res.json({messages:(await pool.query('SELECT id,sender,body,created_at FROM eduka_support_messages WHERE center_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 100',[req.query.center,req.query.user])).rows.reverse()})}catch(e){next(e)}});
router.post('/reply',async(req,res,next)=>{try{const {center,user}=req.body,body=String(req.body.body||'').trim();if(!body||body.length>3000)return res.status(400).json({error:'Xabar 1–3000 belgi bo‘lsin'});if(!(await pool.query('SELECT id FROM center_users WHERE id=$1 AND center_id=$2',[user,center])).rows.length)return res.status(404).json({error:'Hisob topilmadi'});const r=await pool.query("INSERT INTO eduka_support_messages(center_id,user_id,sender,body) VALUES($1,$2,'operator',$3) RETURNING id",[center,user,body]);await pool.query("UPDATE eduka_support_messages SET read_at=NOW() WHERE center_id=$1 AND user_id=$2 AND sender='user' AND read_at IS NULL",[center,user]);res.json({ok:true,id:r.rows[0].id})}catch(e){next(e)}});
module.exports=router;
