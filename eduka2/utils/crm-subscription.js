function register(router,pool){
 router.get('/subscription',async(req,res,next)=>{try{
  if(!['owner','director','admin'].includes(req.crmRole))throw Object.assign(new Error('Obunani ko‘rish uchun administrator ruxsati kerak'),{status:403});
  const centerId=req.centerUser.centerId;
  const center=(await pool.query('SELECT name,tariff,status,monthly_payment,trial_ends_at,next_payment_date FROM centers WHERE id=$1',[centerId])).rows[0];
  if(!center)throw Object.assign(new Error('Markaz topilmadi'),{status:404});
  const tariffs=(await pool.query('SELECT id,name,monthly_price,student_limit,branch_limit,features FROM tariffs WHERE is_active=TRUE ORDER BY monthly_price,name')).rows;
  const payments=(await pool.query('SELECT id,tariff,amount,status,payment_date,next_payment_date,created_at FROM platform_payments WHERE center_id=$1 ORDER BY created_at DESC,id DESC LIMIT 50',[centerId])).rows;
  res.json({center,tariffs,payments,serverNow:new Date().toISOString(),payme:{ready:false}});
 }catch(e){next(e)}});
}
module.exports={register};
