const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const {cents,delta,statement}=require('./crm-ledger');
function range(query){
 const from=String(query.from||''),to=String(query.to||'');
 for(const v of [from,to])if(v&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v))throw fail('Sana noto‘g‘ri');
 if(from&&to&&from>to)throw fail('Sana oralig‘i noto‘g‘ri');
 return {from,to};
}
function summarize(rows,from='',to=''){
 const totals={income:0,refunds:0,expenses:0,net:0};const cash=new Map();let undatedCount=0,unclassifiedCount=0;
 for(const r of rows){
  if(r.deleted||r.entity!=='transactions')continue;
  if(!['Kirim','Chiqim'].includes(r.data.direction)){unclassifiedCount++;continue;}
  if((from||to)&&!/^\d{4}-\d{2}-\d{2}$/.test(r.data.date||'')){undatedCount++;continue;}
  if(from&&r.data.date<from||to&&r.data.date>to)continue;
  const d=r.data,key=d.cash||'',c=cash.get(key)||{id:key,income:0,refunds:0,expenses:0,net:0};
  const field=d.direction==='Kirim'?'income':d.student?'refunds':'expenses';
  totals[field]+=cents(d.amount);c[field]+=cents(d.amount);cash.set(key,c);
 }
 const finish=x=>{x.net=x.income-x.refunds-x.expenses;for(const k of ['income','refunds','expenses','net'])x[k]/=100;return x};
 return {totals:finish(totals),cash:[...cash.values()].map(finish),undatedCount,unclassifiedCount};
}
function register(router,{pool,initialized,allowed}){
 const get=(path,fn)=>router.get(path,async(req,res,next)=>{let db;try{
  if(!allowed(req,'transactions'))throw fail('Moliyani ko‘rishga ruxsat yo‘q',403);
  db=await pool.connect();await db.query('BEGIN');const center=req.centerUser.centerId;await initialized(db,center);
  const result=await fn(req,db,center);await db.query('COMMIT');res.json(result);
 }catch(e){if(db)await db.query('ROLLBACK');next(e)}finally{db?.release()}});
 get('/receipts/:id',async(req,db,center)=>{
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id))throw fail('Chek topilmadi',404);
  const record=(await db.query("SELECT id,data,deleted,created_at,updated_at,version FROM eduka_records WHERE center_id=$1 AND id=$2 AND entity='transactions'",[center,req.params.id])).rows[0];
  if(!record)throw fail('Chek topilmadi',404);
  const names=(await db.query('SELECT id,data FROM eduka_records WHERE center_id=$1 AND id=ANY($2::uuid[])',[center,[record.data.student,record.data.group,record.data.cash].filter(Boolean)])).rows;
  const label=id=>{const d=names.find(r=>r.id===id)?.data;return d?[d.name,d.surname].filter(Boolean).join(' '):'—'};
  const actor=(await db.query("SELECT actor FROM eduka_events WHERE center_id=$1 AND record_id=$2 AND action='create' ORDER BY created_at LIMIT 1",[center,record.id])).rows[0]?.actor||'Eski yozuv — kassir qayd etilmagan';
  return {record,student:label(record.data.student),group:label(record.data.group),cash:label(record.data.cash),cashier:actor,centerName:(await db.query('SELECT name FROM centers WHERE id=$1',[center])).rows[0].name};
 });
 get('/finance-summary',async(req,db,center)=>{
  const {from,to}=range(req.query);
  const rows=(await db.query("SELECT id,entity,data,deleted FROM eduka_records WHERE center_id=$1 AND entity IN ('transactions','cash','students','charges','discounts')",[center])).rows;
  const report=summarize(rows,from,to);report.cash=report.cash.map(c=>({...c,name:rows.find(r=>r.id===c.id)?.data.name||'Kassa belgilanmagan'}));
  const ledger=new Map(rows.filter(r=>r.entity==='students'&&!r.deleted).map(r=>[r.id,cents(r.data.openingBalance)]));
  for(const r of rows){if(r.deleted||!ledger.has(r.data.student))continue;ledger.set(r.data.student,ledger.get(r.data.student)+delta(r))}
  const canonical=(await db.query('SELECT id,balance FROM students WHERE center_id=$1',[center])).rows;
  const stored=new Map(canonical.map(r=>[r.id,cents(r.balance)]));
  const balances=rows.filter(r=>ledger.has(r.id)).map(r=>({id:r.id,name:[r.data.name,r.data.surname].filter(Boolean).join(' '),balance:ledger.get(r.id)/100,storedBalance:stored.has(r.id)?stored.get(r.id)/100:null,difference:stored.has(r.id)?(ledger.get(r.id)-stored.get(r.id))/100:null})).sort((a,b)=>a.balance-b.balance||a.name.localeCompare(b.name));
  const mismatches=balances.filter(r=>r.difference!==0).length;
  return {...report,from,to,balances,studentDebt:[...ledger.values()].reduce((s,v)=>s+Math.max(0,-v),0)/100,studentCredit:[...ledger.values()].reduce((s,v)=>s+Math.max(0,v),0)/100,balanceMismatches:mismatches};
 });
 get('/student-ledger/:id',async(req,db,center)=>{
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id))throw fail('O‘quvchi topilmadi',404);
  const student=(await db.query("SELECT id,data FROM eduka_records WHERE center_id=$1 AND id=$2 AND entity='students' AND deleted=0",[center,req.params.id])).rows[0];
  if(!student)throw fail('O‘quvchi topilmadi',404);
  const {from,to}=range(req.query);
  const rows=(await db.query("SELECT id,entity,data,deleted,created_at FROM eduka_records WHERE center_id=$1 AND data->>'student'=$2 AND entity IN ('transactions','charges','discounts') AND deleted=0",[center,student.id])).rows;
  return {student:{id:student.id,name:[student.data.name,student.data.surname].filter(Boolean).join(' ')},from,to,...statement(student,rows,from,to)};
 });
}
module.exports={register,summarize};
