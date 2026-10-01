const payme=require('./payme');
const owner=req=>['owner','director','admin','administrator'].includes(req.crmRole);
function register(router,pool){
 router.get('/subscription',async(req,res,next)=>{try{
  if(!owner(req))throw Object.assign(new Error('Obunani ko‘rish uchun administrator ruxsati kerak'),{status:403});
  const centerId=req.centerUser.centerId;
  const center=(await pool.query('SELECT name,tariff,status,monthly_payment,trial_ends_at,next_payment_date FROM centers WHERE id=$1',[centerId])).rows[0];
  if(!center)throw Object.assign(new Error('Markaz topilmadi'),{status:404});
  const tariffs=(await pool.query('SELECT id,name,monthly_price,student_limit,branch_limit,features FROM tariffs WHERE is_active=TRUE ORDER BY monthly_price,name')).rows;
  const payments=(await pool.query('SELECT id,tariff,amount,status,payment_date,next_payment_date,created_at FROM platform_payments WHERE center_id=$1 ORDER BY created_at DESC,id DESC LIMIT 50',[centerId])).rows;
  res.json({center,tariffs,payments,serverNow:new Date().toISOString(),payme:{ready:payme.config().ready,mode:payme.config().mode,days:30}});
 }catch(e){next(e)}});
 router.post('/subscription/checkout',async(req,res,next)=>{try{
  if(!owner(req))throw Object.assign(new Error('Ruxsat yo‘q'),{status:403});
  const {order,checkoutUrl}=await payme.createOrder(pool,req.centerUser.centerId,req.body?.requestId);
  res.json({id:order.id,amount:Number(order.amount)/100,tariff:order.tariff,days:order.days,mode:order.mode,status:order.status,checkoutUrl});
 }catch(e){next(e)}});
 router.get('/subscription/orders/:id',async(req,res,next)=>{try{
  if(!owner(req))throw Object.assign(new Error('Ruxsat yo‘q'),{status:403});
  if(!payme.UUID.test(req.params.id))throw Object.assign(new Error('Buyurtma topilmadi'),{status:404});
  const o=(await pool.query('SELECT id,tariff,amount,days,mode,status,expires_at,applied_until FROM eduka_subscription_orders WHERE id=$1 AND center_id=$2',[req.params.id,req.centerUser.centerId])).rows[0];
  if(!o)throw Object.assign(new Error('Buyurtma topilmadi'),{status:404});
  const t=(await pool.query('SELECT state,payme_time,fiscal_perform FROM eduka_payme_transactions WHERE order_id=$1 ORDER BY create_time DESC,id DESC LIMIT 1',[o.id])).rows[0];
  const expired=o.status==='pending'&&(new Date(o.expires_at).getTime()<Date.now()||t?.state===1&&Date.now()-Number(t.payme_time)>=43200000);
  let receiptUrl=null;try{const u=new URL(t?.fiscal_perform?.qr_code_url);if(u.protocol==='https:')receiptUrl=u.href}catch{}
  res.json({...o,amount:Number(o.amount)/100,status:expired?'expired':t?.state<0?'cancelled':o.status,receiptUrl,checkoutUrl:!expired&&o.status==='pending'&&payme.config().ready&&payme.config().mode===o.mode?payme.checkout(o,require('./tenant').normalizeTenantSlug(req.center.subdomain)):null});
 }catch(e){next(e)}});
}
module.exports={register};
