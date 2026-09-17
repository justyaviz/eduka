const crypto=require('node:crypto');
const fail=(message,status=502)=>Object.assign(new Error(message),{status});
function settings(){const email=process.env.ESKIZ_EMAIL?.trim(),password=process.env.ESKIZ_PASSWORD,from=process.env.ESKIZ_FROM?.trim()||'4546';if(!email||!password||/Eskiz emailingiz|Eskiz parolingiz/i.test(email+' '+password))throw fail('Railway’da haqiqiy ESKIZ_EMAIL va ESKIZ_PASSWORD qiymatlarini kiriting.',503);return {email,password,from}}
function key(){const secret=process.env.EDUKA_INTEGRATION_KEY||process.env.JWT_SECRET;if(!secret)throw fail('Server shifrlash kaliti sozlanmagan.',503);return crypto.createHash('sha256').update('eduka-eskiz-v1:'+secret).digest()}
function encode(token){const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key(),iv);const body=Buffer.concat([c.update(token),c.final()]);return [iv,c.getAuthTag(),body].map(x=>x.toString('base64')).join('.')}
function decode(value){const [iv,tag,body]=value.split('.').map(x=>Buffer.from(x,'base64'));const c=crypto.createDecipheriv('aes-256-gcm',key(),iv);c.setAuthTag(tag);return Buffer.concat([c.update(body),c.final()]).toString()}
async function post(path,fields,token){const form=new FormData();for(const [k,v]of Object.entries(fields))form.append(k,String(v));const r=await fetch('https://notify.eskiz.uz/api/'+path,{method:'POST',headers:token?{Authorization:'Bearer '+token}:{},body:form,signal:AbortSignal.timeout(15000)});let data;try{data=await r.json()}catch{data=null}return {ok:r.ok,status:r.status,data}}
async function token(pool,rejected){const cfg=settings(),fingerprint=crypto.createHash('sha256').update(cfg.email+'\0'+cfg.password).digest('hex');key();const db=await pool.connect();try{await db.query('BEGIN');await db.query('INSERT INTO eskiz_tokens(id) VALUES(1) ON CONFLICT DO NOTHING');const row=(await db.query('SELECT * FROM eskiz_tokens WHERE id=1 FOR UPDATE')).rows[0];let saved;try{if(row.credential_hash===fingerprint&&new Date(row.expires_at)>new Date(Date.now()+60000))saved=decode(row.token_ciphertext)}catch{}
 if(saved&&saved!==rejected){await db.query('COMMIT');return saved}
 let result;try{result=await post('auth/login',{email:cfg.email,password:cfg.password})}catch{throw fail('Eskiz bilan ulanish amalga oshmadi. Keyinroq qayta tekshiring.')}
 const value=result.data?.data?.token;if(!result.ok||typeof value!=='string'||!value)throw fail('Eskiz hisobiga kirib bo‘lmadi. Email va parolni tekshiring.');
 let expiry=Date.now()+86400000;try{const exp=JSON.parse(Buffer.from(value.split('.')[1],'base64url').toString()).exp;if(Number.isFinite(exp))expiry=Math.min(expiry,exp*1000)}catch{}
 await db.query('UPDATE eskiz_tokens SET token_ciphertext=$1,credential_hash=$2,expires_at=$3,updated_at=NOW() WHERE id=1',[encode(value),fingerprint,new Date(expiry).toISOString()]);await db.query('COMMIT');return value;
 }catch(e){await db.query('ROLLBACK');throw e}finally{db.release()}}
async function send(pool,phone,message){let value=await token(pool);const fields={mobile_phone:phone,message,from:settings().from};let r;try{r=await post('message/sms/send',fields,value);if(r.status===401){value=await token(pool,value);r=await post('message/sms/send',fields,value)}}catch{return {status:'unknown',error:'Javob olinmadi. Takror yuborishdan oldin Eskiz tarixini tekshiring.'}}
 if(r.ok&&r.data?.status==='waiting'&&r.data?.id)return {status:'accepted',providerId:String(r.data.id)};
 if(r.status>=500||r.ok)return {status:'unknown',error:'Eskiz natijasi aniq tasdiqlanmadi. Eskiz tarixini tekshiring.'};
 return {status:'failed',error:r.status===401?'Eskiz tokenni rad etdi.':r.status===429?'Eskiz so‘rovlar limiti oshdi.':'Eskiz SMSni rad etdi. Balans, tasdiqlangan matn, raqam va yuboruvchi nomini tekshiring.'};
}
module.exports={settings,token,send};
