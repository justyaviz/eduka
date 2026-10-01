const {timingSafeEqual,createHash}=require('node:crypto');
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TTL=43200000,DAY=86400000;
const rpcError=(code,message,data)=>({code,message:{uz:message,ru:message,en:message},...(data===undefined?{}:{data})});
const fail=(code,message,data)=>{throw Object.assign(new Error(message),{rpc:rpcError(code,message,data)})};
const webError=(message,status=400)=>Object.assign(new Error(message),{status});
function config(){
 const mode=process.env.PAYME_MODE==='live'?'live':'test';
 const merchant=process.env.PAYME_MERCHANT_ID||'';
 const key=mode==='live'?process.env.PAYME_KEY:process.env.PAYME_TEST_KEY;
 const distinct=!(process.env.PAYME_KEY&&process.env.PAYME_KEY===process.env.PAYME_TEST_KEY);
 const ready=distinct&&/^[a-f0-9]{24}$/i.test(merchant)&&!!key&&(mode==='test'||process.env.PAYME_LIVE_ENABLED==='true');
 return {mode,merchant,ready,days:30};
}
function authenticate(header){
 if(process.env.PAYME_KEY&&process.env.PAYME_KEY===process.env.PAYME_TEST_KEY)return null;
 if(typeof header!=='string'||!/^Basic /i.test(header))return null;
 const value=Buffer.from(header.slice(6),'base64');
 for(const [mode,key] of [['live',process.env.PAYME_KEY],['test',process.env.PAYME_TEST_KEY]]){
  if(!key)continue;const expected=Buffer.from('Paycom:'+key);
  if(value.length===expected.length&&timingSafeEqual(value,expected))return mode;
 }
 return null;
}
function checkout(order,subdomain){
 const {merchant}=config();const root=require('./tenant').rootDomain();
 if(!/^[a-z0-9][a-z0-9-]{0,62}$/.test(subdomain)||!/^[a-z0-9.-]+$/.test(root))throw webError('Markaz domeni noto‘g‘ri');
 const params=`m=${merchant};ac.order_id=${order.id};a=${order.amount};l=uz;c=https://${subdomain}.${root}/subscription?order=${order.id};ct=5000`;
 return (order.mode==='test'?'https://test.paycom.uz/':'https://checkout.paycom.uz/')+Buffer.from(params).toString('base64');
}
const summary=t=>({create_time:Number(t.create_time),perform_time:Number(t.perform_time),cancel_time:Number(t.cancel_time),transaction:t.id,state:t.state,reason:t.reason});
async function expire(db,t,now){
 if(t.state===1&&now-Number(t.payme_time)>=TTL){
  await db.query('UPDATE eduka_payme_transactions SET state=-1,cancel_time=$2,reason=4 WHERE id=$1',[t.id,now]);
  Object.assign(t,{state:-1,cancel_time:now,reason:4});
 }
 return t;
}
async function createOrder(pool,centerId,requestId){
 if(!UUID.test(requestId||''))throw webError('So‘rov identifikatori noto‘g‘ri');
 const c=config();if(!c.ready)throw webError('Payme ulanishi hali faollashtirilmagan',503);
 const db=await pool.connect();try{await db.query('BEGIN');
 const center=(await db.query('SELECT * FROM centers WHERE id=$1 FOR UPDATE',[centerId])).rows[0];
 if(!center||['Suspended','Blocked'].includes(center.status))throw webError('Markaz to‘lov uchun ochiq emas',403);
 const previous=(await db.query('SELECT * FROM eduka_subscription_orders WHERE center_id=$1 AND mode=$2 AND request_id=$3',[centerId,c.mode,requestId])).rows[0];
 if(previous){await db.query('COMMIT');return {order:previous,checkoutUrl:checkout(previous,require('./tenant').normalizeTenantSlug(center.subdomain))}}
 const tariff=(await db.query('SELECT * FROM tariffs WHERE name=$1 AND is_active=TRUE',[center.tariff])).rows[0];
 if(!tariff)throw webError('Faol tarif belgilanmagan. Administratorga murojaat qiling.');
 const price=Number(center.monthly_payment)>0?center.monthly_payment:tariff.monthly_price;
 const amount=Math.round(Number(price)*100);if(!Number.isSafeInteger(amount)||amount<=0)throw webError('Tarif narxi belgilanmagan');
 // One unexpired pending invoice per center/mode, even across browser tabs.
 const pending=(await db.query("SELECT o.* FROM eduka_subscription_orders o WHERE center_id=$1 AND mode=$2 AND status='pending' AND expires_at>NOW() AND NOT EXISTS(SELECT 1 FROM eduka_payme_transactions t WHERE t.order_id=o.id AND t.state<0) ORDER BY created_at DESC LIMIT 1",[centerId,c.mode])).rows[0];
 const order=pending||(await db.query('INSERT INTO eduka_subscription_orders(center_id,mode,request_id,tariff,amount) VALUES($1,$2,$3,$4,$5) RETURNING *',[centerId,c.mode,requestId,center.tariff,amount])).rows[0];
 await db.query('COMMIT');return {order,checkoutUrl:checkout(order,require('./tenant').normalizeTenantSlug(center.subdomain))};
 }catch(e){await db.query('ROLLBACK');throw e}finally{db.release()}
}
async function dispatch(db,mode,method,p,now){
 if(method==='GetStatement'){
  if(!Number.isSafeInteger(p.from)||!Number.isSafeInteger(p.to)||p.from<0||p.to<p.from)fail(-32602,'Davr noto‘g‘ri');
  const rows=(await db.query('SELECT t.*,o.amount FROM eduka_payme_transactions t JOIN eduka_subscription_orders o ON o.id=t.order_id WHERE t.mode=$1 AND t.payme_time BETWEEN $2 AND $3 ORDER BY t.payme_time,t.id',[mode,p.from,p.to])).rows;
  return {transactions:rows.map(t=>({id:t.payme_id,time:Number(t.payme_time),amount:Number(t.amount),account:{order_id:t.order_id},...summary(t)}))};
 }
 const supported=['CheckPerformTransaction','CreateTransaction','PerformTransaction','CancelTransaction','CheckTransaction','SetFiscalData'];
 if(!supported.includes(method))fail(-32601,'Metod topilmadi',method);
 let order,t;
 if(['CheckPerformTransaction','CreateTransaction'].includes(method)){
  if(!p.account||!UUID.test(p.account.order_id||''))fail(-31050,'Buyurtma topilmadi','order_id');
  if(!Number.isSafeInteger(p.amount)||p.amount<=0)fail(-31001,'Summa noto‘g‘ri');
  order=(await db.query('SELECT * FROM eduka_subscription_orders WHERE id=$1 AND mode=$2 FOR UPDATE',[p.account.order_id,mode])).rows[0];
  if(!order)fail(-31050,'Buyurtma topilmadi','order_id');
  if(Number(order.amount)!==p.amount)fail(-31001,'Summa noto‘g‘ri');
  if(method==='CreateTransaction'){
   if(typeof p.id!=='string'||!/^[a-f0-9]{24}$/i.test(p.id)||!Number.isSafeInteger(p.time)||p.time<=0)fail(-32602,'Tranzaksiya parametrlari noto‘g‘ri');
   // Serialize provider IDs, including collisions involving different orders.
   await db.query('SELECT pg_advisory_xact_lock($1)',[createHash('sha256').update(mode+p.id).digest().readInt32BE()]);
   t=(await db.query('SELECT * FROM eduka_payme_transactions WHERE mode=$1 AND payme_id=$2 FOR UPDATE',[mode,p.id])).rows[0];
   if(t){if(t.order_id!==order.id)fail(-31050,'Buyurtma mos emas','order_id');await expire(db,t,now);if(t.state<0)fail(-31008,'Tranzaksiya bekor qilingan');return {create_time:Number(t.create_time),transaction:t.id,state:t.state}}
  }
  if(order.status!=='pending'||new Date(order.expires_at).getTime()<=now)fail(-31050,'Buyurtma to‘lov uchun yopiq','order_id');
  const center=(await db.query('SELECT tariff,status FROM centers WHERE id=$1',[order.center_id])).rows[0];
  if(!center||center.tariff!==order.tariff||['Blocked','Suspended'].includes(center.status))fail(-31050,'Markaz yoki tarif o‘zgargan','order_id');
  const active=(await db.query('SELECT * FROM eduka_payme_transactions WHERE order_id=$1 AND state IN (1,2) FOR UPDATE',[order.id])).rows[0];
  if(active){await expire(db,active,now);if(active.state>0)fail(-31008,'Buyurtmada faol tranzaksiya mavjud','order_id')}
  if(method==='CheckPerformTransaction'){
   const result={allow:true};
   const code=process.env.PAYME_MXIK,pack=process.env.PAYME_PACKAGE_CODE,vat=process.env.PAYME_VAT_PERCENT;
   if(code&&pack&&vat!==undefined&&Number.isFinite(Number(vat)))result.detail={receipt_type:0,items:[{title:'EDUKA '+order.tariff+' — 30 kunlik obuna',price:Number(order.amount),count:1,code,package_code:pack,vat_percent:Number(vat)}]};
   return result;
  }
  if(now-p.time>=TTL||p.time>now+300000)fail(-31008,'Tranzaksiya vaqti noto‘g‘ri');
  t=(await db.query('INSERT INTO eduka_payme_transactions(mode,payme_id,order_id,payme_time,create_time) VALUES($1,$2,$3,$4,$5) RETURNING *',[mode,p.id,order.id,p.time,now])).rows[0];
  return {create_time:now,transaction:t.id,state:1};
 }
 if(typeof p.id!=='string'||!/^[a-f0-9]{24}$/i.test(p.id))fail(-32602,'Tranzaksiya IDsi noto‘g‘ri');
 // Order -> transaction -> center lock order is shared by all mutating methods.
 const lookup=(await db.query('SELECT order_id FROM eduka_payme_transactions WHERE mode=$1 AND payme_id=$2',[mode,p.id])).rows[0];
 if(!lookup)fail(method==='SetFiscalData'?-32001:-31003,'Tranzaksiya topilmadi');
 order=(await db.query('SELECT * FROM eduka_subscription_orders WHERE id=$1 FOR UPDATE',[lookup.order_id])).rows[0];
 t=(await db.query('SELECT * FROM eduka_payme_transactions WHERE mode=$1 AND payme_id=$2 FOR UPDATE',[mode,p.id])).rows[0];
 await expire(db,t,now);
 if(method==='CheckTransaction')return summary(t);
 if(method==='SetFiscalData'){
  if(!['PERFORM','CANCEL'].includes(p.type)||!p.fiscal_data||Array.isArray(p.fiscal_data)||typeof p.fiscal_data!=='object'||JSON.stringify(p.fiscal_data).length>16000)fail(-32602,'Fiskal ma’lumot noto‘g‘ri');
  await db.query(`UPDATE eduka_payme_transactions SET ${p.type==='PERFORM'?'fiscal_perform':'fiscal_cancel'}=$2 WHERE id=$1`,[t.id,JSON.stringify(p.fiscal_data)]);return {success:true};
 }
 if(method==='PerformTransaction'){
  if(t.state===2)return {transaction:t.id,perform_time:Number(t.perform_time),state:2};
  if(t.state!==1||order.status!=='pending')fail(-31008,'Tranzaksiyani bajarib bo‘lmaydi');
  if(mode==='live'){
   const center=(await db.query('SELECT * FROM centers WHERE id=$1 FOR UPDATE',[order.center_id])).rows[0];
   if(!center||center.tariff!==order.tariff||['Blocked','Suspended'].includes(center.status))fail(-31050,'Markaz yoki tarif o‘zgargan','order_id');
   const before={status:center.status,next_payment_date:center.next_payment_date,trial_ends_at:center.trial_ends_at};
   const base=Math.max(now,new Date(center.next_payment_date||0).getTime(),center.status==='Trial'?new Date(center.trial_ends_at||0).getTime():0);
   const end=new Date(base+order.days*DAY).toISOString();
   const payment=(await db.query("INSERT INTO platform_payments(center_id,center_name,tariff,amount,status,payment_date,next_payment_date,note) VALUES($1,$2,$3,$4,'To‘landi',$5,$6,$7) RETURNING id",[center.id,center.name,order.tariff,Number(order.amount)/100,new Date(now).toISOString(),end,'Payme: '+p.id])).rows[0];
   await db.query("UPDATE centers SET status='Active',next_payment_date=$2,updated_at=NOW() WHERE id=$1",[center.id,end]);
   await db.query('UPDATE eduka_subscription_orders SET previous_subscription=$2,applied_until=$3,platform_payment_id=$4 WHERE id=$1',[order.id,JSON.stringify(before),end,payment.id]);
  }
  await db.query("UPDATE eduka_subscription_orders SET status='paid' WHERE id=$1",[order.id]);
  await db.query('UPDATE eduka_payme_transactions SET state=2,perform_time=$2 WHERE id=$1',[t.id,now]);
  return {transaction:t.id,perform_time:now,state:2};
 }
 if(!Number.isInteger(p.reason)||p.reason<1||p.reason>10)fail(-32602,'Bekor qilish sababi noto‘g‘ri');
 if(t.state<0)return {transaction:t.id,cancel_time:Number(t.cancel_time),state:t.state};
 if(t.state===2&&mode==='live'){
  const center=(await db.query('SELECT * FROM centers WHERE id=$1 FOR UPDATE',[order.center_id])).rows[0];
  // Do not overwrite later renewals or CEO adjustments. Those refunds require reconciliation first.
  if(!center||center.tariff!==order.tariff||center.status!=='Active'||new Date(center.next_payment_date).getTime()!==new Date(order.applied_until).getTime()||!order.previous_subscription)fail(-31007,'Obuna keyinchalik o‘zgargan. Administrator orqali solishtirish kerak.');
  const b=order.previous_subscription;
  await db.query('UPDATE centers SET status=$2,next_payment_date=$3,trial_ends_at=$4,updated_at=NOW() WHERE id=$1',[center.id,b.status,b.next_payment_date,b.trial_ends_at]);
  await db.query("UPDATE platform_payments SET status='Bekor qilindi',updated_at=NOW() WHERE id=$1",[order.platform_payment_id]);
 }
 const state=t.state===2?-2:-1;
 await db.query('UPDATE eduka_payme_transactions SET state=$2,cancel_time=$3,reason=$4 WHERE id=$1',[t.id,state,now,p.reason]);
 await db.query("UPDATE eduka_subscription_orders SET status='cancelled' WHERE id=$1",[order.id]);
 return {transaction:t.id,cancel_time:now,state};
}
function register(app,pool){
 // Own parser before the application's JSON parser: Payme also uses text/json.
 const express=require('express'),router=express.Router();
 router.use(express.json({type:['application/json','text/json','application/*+json'],limit:'64kb'}));
 router.all('/',async(req,res)=>{
  res.set('Cache-Control','no-store');const body=req.body;const id=Number.isSafeInteger(body?.id)?body.id:null;
  const reply=error=>res.json({jsonrpc:'2.0',id,error});
  if(req.method!=='POST')return reply(rpcError(-32300,'POST kerak'));
  const mode=authenticate(req.get('authorization'));if(!mode)return reply(rpcError(-32504,'Ruxsat yo‘q'));
  if(!body||Array.isArray(body)||typeof body.method!=='string'||!body.params||typeof body.params!=='object'||Array.isArray(body.params)||body.id!==undefined&&id===null)return reply(rpcError(-32600,'So‘rov noto‘g‘ri'));
  let db;try{
   db=await pool.connect();await db.query('BEGIN');
   let result,error;try{result=await dispatch(db,mode,body.method,body.params,Date.now())}catch(e){if(!e.rpc)throw e;error=e.rpc}
   // Persist timeout transitions even when the requested operation returns an RPC error.
   await db.query('COMMIT');if(error)return reply(error);
   return res.json({jsonrpc:'2.0',id,result});
  }catch{if(db)await db.query('ROLLBACK').catch(()=>{});return reply(rpcError(-32400,'Tizim xatosi'))}finally{db?.release()}
 });
 router.use((err,req,res,next)=>res.status(200).json({jsonrpc:'2.0',id:null,error:rpcError(err.type==='entity.parse.failed'?-32700:-32600,'So‘rov noto‘g‘ri')}));
 app.use('/api/payme',router);
}
module.exports={register,config,createOrder,checkout,UUID};
