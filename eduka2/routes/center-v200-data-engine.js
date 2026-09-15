const express=require('express');
const pool=require('../db');
const {requireCenterAuth}=require('../middleware/center-auth');

const router=express.Router();
const PROD=process.env.NODE_ENV==='production';
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SORT_MAP={
  name:'l.full_name',
  phone:'l.phone',
  source:'l.source',
  status:'l.status',
  assignedName:'u.full_name',
  nextContactAt:'l.next_contact_at',
  createdAt:'l.created_at'
};
function clean(v){return v==null?'':String(v).trim();}
function int(v,fallback,min,max){const n=Number.parseInt(v,10);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;}
function err(res,status,message,error){return res.status(status).json({ok:false,error:message,...(PROD||!error?{}:{realError:error.message,code:error.code||null})});}
function mapLead(r){return{id:r.id,name:r.full_name||'',fullName:r.full_name||'',phone:r.phone||'',source:r.source||'Manual',status:r.status||'LEADS',note:r.note||'',assignedTo:r.assigned_to||null,assignedName:r.assigned_name||'',nextContactAt:r.next_contact_at||null,createdAt:r.created_at,updatedAt:r.updated_at};}

router.get('/leads-v200',requireCenterAuth,async(req,res)=>{
  try{
    const centerId=req.centerUser.centerId;
    const q=clean(req.query.q),status=clean(req.query.status),source=clean(req.query.source),assignedTo=clean(req.query.assignedTo);
    const limit=int(req.query.limit,50,1,100);
    const requestedPage=int(req.query.page,1,1,1000000);
    const sortBy=SORT_MAP[clean(req.query.sortBy)]?clean(req.query.sortBy):'createdAt';
    const sortOrder=String(req.query.sortOrder||'desc').toLowerCase()==='asc'?'asc':'desc';

    const params=[centerId];
    let where=`l.center_id=$1 AND COALESCE(l.status,'LEADS')<>'deleted'`;
    if(q){params.push(`%${q}%`);where+=` AND (l.full_name ILIKE $${params.length} OR l.phone ILIKE $${params.length} OR l.note ILIKE $${params.length})`;}
    if(status&&status!=='all'){params.push(status);where+=` AND l.status=$${params.length}`;}
    if(source&&source!=='all'){params.push(source);where+=` AND l.source=$${params.length}`;}
    if(assignedTo&&assignedTo!=='all'){
      if(assignedTo==='unassigned')where+=` AND l.assigned_to IS NULL`;
      else{
        if(!UUID_RE.test(assignedTo))return err(res,400,'Xodim ID noto‘g‘ri');
        params.push(assignedTo);where+=` AND l.assigned_to=$${params.length}`;
      }
    }

    const countQ=await pool.query(`SELECT COUNT(*)::int total FROM leads l WHERE ${where}`,params);
    const total=Number(countQ.rows[0]?.total||0);
    const totalPages=Math.max(1,Math.ceil(total/limit));
    const page=Math.min(requestedPage,totalPages);
    const offset=(page-1)*limit;
    const queryParams=[...params,limit,offset];
    const limitIndex=queryParams.length-1,offsetIndex=queryParams.length;
    const orderExpr=SORT_MAP[sortBy];
    const rowsQ=await pool.query(`
      SELECT l.*,u.full_name assigned_name
      FROM leads l
      LEFT JOIN center_users u ON u.id=l.assigned_to AND u.center_id=l.center_id
      WHERE ${where}
      ORDER BY ${orderExpr} ${sortOrder.toUpperCase()} NULLS LAST,l.created_at DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `,queryParams);

    const summaryQ=await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE COALESCE(status,'LEADS')<>'deleted')::int total,
        COUNT(*) FILTER (WHERE COALESCE(status,'LEADS')='LEADS')::int unworked,
        COUNT(*) FILTER (WHERE status='interested')::int callbacks,
        COUNT(*) FILTER (WHERE status='Mijoz bo‘ldi')::int won
      FROM leads WHERE center_id=$1
    `,[centerId]);
    const summary=summaryQ.rows[0]||{total:0,unworked:0,callbacks:0,won:0};
    summary.conversion=summary.total?Math.round((summary.won/summary.total)*100):0;

    return res.json({
      ok:true,
      leads:rowsQ.rows.map(mapLead),
      pagination:{page,limit,total,totalPages,sortBy,sortOrder},
      summary
    });
  }catch(error){return err(res,500,'Lidlarni yuklashda xatolik',error);}
});

module.exports=router;
