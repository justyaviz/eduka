const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
const express=require('express');
const bcrypt=require('bcryptjs');
async function main(){
 process.env.BASE_DOMAIN='eduka.uz';process.env.JWT_SECRET='isolated-test-only';
 const pg=new PGlite();
 // pgcrypto is not needed for this isolated database; UUIDs are built into PG.
 for(const name of fs.readdirSync(path.join(__dirname,'../migrations')).filter(n=>n.endsWith('.sql')).sort()){
  let sql=fs.readFileSync(path.join(__dirname,'../migrations',name),'utf8').replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;/gi,'');
  await pg.exec(sql);
 }
 const adapter={query:(...args)=>pg.query(...args),connect:async()=>({query:(...args)=>pg.query(...args),release(){}})};
 require.cache[require.resolve('../db')]={exports:adapter};
 const center=randomUUID(),other=randomUUID(),user=randomUUID(),student=randomUUID(),payment=randomUUID();
 await pg.query("INSERT INTO centers(id,name,subdomain,status) VALUES($1,'Alpha','alpha','Active'),($2,'Beta','beta','Active')",[center,other]);
 await pg.query("INSERT INTO center_users(id,center_id,full_name,email,password_hash,role,status) VALUES($1,$2,'Test Director','director@example.test',$3,'director','active')",[user,center,await bcrypt.hash('local-test-only',4)]);
 await pg.query("INSERT INTO students(id,center_id,full_name,balance) VALUES($1,$2,'Existing Student',-50000)",[student,center]);
 await pg.query("INSERT INTO center_payments(id,center_id,student_id,amount,status) VALUES($1,$2,$3,100000,'paid')",[payment,center,student]);
 const app=require('../server');
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 for(const [host,url,file] of [['eduka.uz','/','index.html'],['eduka.uz','/ceo','ceo.html'],['eduka.uz','/prices','prices.html'],['alpha.eduka.uz','/','app.html'],['alpha.eduka.uz','/students/student-list','app.html'],['alpha.eduka.uz','/ceo','app.html']]){const r=await fetch(base+url,{headers:{'X-Forwarded-Host':host}});assert.equal(r.status,200);assert.equal(await r.text(),fs.readFileSync(path.join(__dirname,'../public',file),'utf8'));}
 const unknown=await fetch(base+'/',{headers:{'X-Forwarded-Host':'missing.eduka.uz'}});assert.equal(unknown.status,404);
 const {signCenterToken}=require('../middleware/center-auth');const token=signCenterToken({id:user,center_id:center,role:'director',full_name:'Test Director'},{subdomain:'alpha',name:'Alpha'});
 async function request(route,body,host='alpha.eduka.uz',auth=true){const r=await fetch(base+'/api/'+route,{method:body?'POST':'GET',headers:{Host:host,'X-Forwarded-Host':host,...(auth?{Cookie:'eduka_session='+token}:{}),...(body?{'Content-Type':'application/json',Origin:'https://'+host}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json(),headers:r.headers}}
 const create=(entity,data)=>request('crm/records',{action:'create',entity,data});
 assert.equal((await request('crm/records',null,'alpha.eduka.uz',false)).status,401);
 assert.equal((await request('crm/records',null,'beta.eduka.uz')).status,403);
 assert.equal((await request('crm/records',null,'eduka.uz')).status,403);
 const login=await request('tenant/login',{login:'director@example.test',password:'local-test-only'},'alpha.eduka.uz',false);assert.equal(login.status,200,JSON.stringify(login.body));assert.match(login.headers.get('set-cookie'),/HttpOnly/);assert.match(login.headers.get('set-cookie'),/SameSite=Strict/);
 let got=await request('crm/records');assert.equal(got.status,200,JSON.stringify(got.body));let old=got.body.records.find(r=>r.id===student);assert.equal(old.data.openingBalance,-150000);assert.equal(got.body.records.find(r=>r.id===payment).data.amount,100000);
 assert.equal((await request('crm/records')).body.records.length,got.body.records.length,'idempotent cutover');
 const cash=(await create('cash',{name:'Desk',status:'Faol'})).body.record;
 const group=(await create('groups',{name:'Group A',status:'Faol'})).body.record;
 const created=await create('students',{name:'New Student',status:'Faol'});assert.equal(created.status,200,JSON.stringify(created));
 assert.equal((await pg.query('SELECT full_name FROM students WHERE id=$1',[created.body.record.id])).rows[0].full_name,'New Student');
 const enrollment={student,group:group.id,startDate:'2026-09-16',status:'Faol'};
 assert.equal((await create('enrollments',enrollment)).status,200);
 assert.equal((await create('enrollments',enrollment)).status,409);
 assert.equal((await pg.query('SELECT * FROM group_students WHERE center_id=$1',[center])).rows.length,1);
 assert.equal((await create('transactions',{name:'Payment',amount:25000,date:'2026-09-16',direction:'Kirim',student,cash:cash.id,paymentMethod:'Naqd'})).status,200);
 assert.equal(Number((await pg.query('SELECT balance FROM students WHERE id=$1',[student])).rows[0].balance),-25000,'opening balance maintained');
 const charge=await create('charges',{name:'Lesson',student,date:'2026-09-16',amount:10000});assert.equal(charge.status,200,JSON.stringify(charge));
 assert.equal(Number((await pg.query('SELECT balance FROM students WHERE id=$1',[student])).rows[0].balance),-35000);
 const changed=await request('crm/records',{action:'update',entity:'students',id:old.id,version:old.version,data:{...old.data,name:'Edited'}});assert.equal(changed.status,200);assert.equal(changed.body.event.changes.name.before,'Existing Student');
 assert.equal((await request('crm/records',{action:'update',entity:'students',id:old.id,version:old.version,data:old.data})).status,409);
 assert.equal((await create('parents',{name:'Wrong',student:randomUUID()})).status,400);
 const visit=(await create('visits',{student,arrivedAt:'2026-09-16T08:00'})).body.record;assert.ok(visit);
 assert.equal((await create('visits',{student,arrivedAt:'2026-09-16T09:00'})).status,409);
 const part=await create('installments',{student,amount:1,date:'2026-09-16',parts:JSON.stringify([{amount:100,date:'2026-10-01',note:''},{amount:200,date:'2026-09-16',note:''}])});assert.equal(part.body.record.data.amount,300);
 assert.equal((await create('student-contracts',{student,number:'1',date:'2026-09-16',file:'/api/crm/files?id='+randomUUID()})).status,400);
 const form=new FormData();form.append('file',new Blob(['%PDF-local-test'],{type:'application/pdf'}),'test.pdf');
 const uploaded=await fetch(base+'/api/crm/files',{method:'POST',headers:{Host:'alpha.eduka.uz','X-Forwarded-Host':'alpha.eduka.uz',Cookie:'eduka_session='+token,Origin:'https://alpha.eduka.uz'},body:form});assert.equal(uploaded.status,200);const file=await uploaded.json();
 const downloaded=await fetch(base+file.url,{headers:{Host:'alpha.eduka.uz','X-Forwarded-Host':'alpha.eduka.uz',Cookie:'eduka_session='+token}});assert.equal(downloaded.status,200);assert.equal(await downloaded.text(),'%PDF-local-test');
 assert.equal((await fetch(base+file.url,{headers:{Host:'beta.eduka.uz','X-Forwarded-Host':'beta.eduka.uz',Cookie:'eduka_session='+token}})).status,403);
 const pageOne=await request('crm/records?limit=1');assert.equal(pageOne.body.records.length,1);assert.ok(pageOne.body.nextCursor);const pageTwo=await request('crm/records?limit=1&cursor='+pageOne.body.nextCursor);assert.notEqual(pageOne.body.records[0].id,pageTwo.body.records[0].id);
 const beforeDiscount=Number((await pg.query('SELECT balance FROM students WHERE id=$1',[student])).rows[0].balance);assert.equal((await create('discounts',{student,name:'Discount',amount:5000,date:'2026-09-16'})).status,200);assert.equal(Number((await pg.query('SELECT balance FROM students WHERE id=$1',[student])).rows[0].balance),beforeDiscount+5000);
 assert.equal((await create('transactions',{student,name:'Refund',amount:2000,date:'2026-09-16',direction:'Chiqim',cash:cash.id,paymentMethod:'Naqd'})).status,200);assert.equal(Number((await pg.query('SELECT balance FROM students WHERE id=$1',[student])).rows[0].balance),beforeDiscount+3000);
 const ceo=randomUUID();await pg.query("INSERT INTO ceo_users(id,full_name,email,password_hash,role,status) VALUES($1,'Test CEO','ceo@example.test','unused','CEO','active')",[ceo]);const ceoToken=require('../middleware/auth').signToken({id:ceo,email:'ceo@example.test',role:'CEO',full_name:'Test CEO'});
 const newCenterResponse=await fetch(base+'/api/ceo/centers',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+ceoToken},body:JSON.stringify({name:'Empty Test',subdomain:'empty-test',ownerName:'Owner',ownerEmail:'empty@example.test',tariff:'Start'})});assert.equal(newCenterResponse.status,201);const newCenter=await newCenterResponse.json();assert.ok(newCenter.centerAdmin.password.length>=20);
 const newLogin=await request('tenant/login',{login:newCenter.centerAdmin.email,password:newCenter.centerAdmin.password},'empty-test.eduka.uz',false);assert.equal(newLogin.status,200,JSON.stringify(newLogin.body));const newCookie=newLogin.headers.get('set-cookie').split(';')[0];
 const emptyResponse=await fetch(base+'/api/crm/records',{headers:{Host:'empty-test.eduka.uz','X-Forwarded-Host':'empty-test.eduka.uz',Cookie:newCookie}});const emptyData=await emptyResponse.json();assert.equal(emptyData.records.filter(r=>r.entity!=='employees').length,0,'new center has no business/demo records');
 assert.equal((await pg.query('SELECT students_count,branches_count FROM centers WHERE id=$1',[newCenter.center.id])).rows[0].branches_count,0);
 await pg.query("UPDATE centers SET next_payment_date=NOW()-INTERVAL '1 day' WHERE id=$1",[center]);assert.equal((await create('courses',{name:'Expired'})).status,402);await pg.query('UPDATE centers SET next_payment_date=NULL WHERE id=$1',[center]);
 await pg.query("UPDATE tariffs SET student_limit=1 WHERE name='Start'");assert.equal((await create('students',{name:'Over limit'})).status,409);await pg.query("UPDATE tariffs SET student_limit=100 WHERE name='Start'");
 // Legacy API writes are mirrored on the next authorized CRM read.
 await pg.query("UPDATE students SET full_name='Legacy renamed',phone='+998900000002' WHERE id=$1",[student]);let reconciled=await request('crm/records');assert.equal(reconciled.body.records.find(r=>r.id===student).data.name,'Legacy renamed');
 const legacyPayment=randomUUID();const legacyBefore=Number((await pg.query('SELECT balance FROM students WHERE id=$1',[student])).rows[0].balance);await pg.query("INSERT INTO center_payments(id,center_id,student_id,amount,status,paid_at) VALUES($1,$2,$3,7000,'paid','2026-09-16')",[legacyPayment,center,student]);await request('crm/records');assert.equal(Number((await pg.query('SELECT balance FROM students WHERE id=$1',[student])).rows[0].balance),legacyBefore+7000);await request('crm/records');assert.equal(Number((await pg.query('SELECT balance FROM students WHERE id=$1',[student])).rows[0].balance),legacyBefore+7000);
 await pg.query("UPDATE center_payments SET status='cancelled' WHERE id=$1",[legacyPayment]);await request('crm/records');assert.equal(Number((await pg.query('SELECT balance FROM students WHERE id=$1',[student])).rows[0].balance),legacyBefore);
 // New operational flows use isolated data, never real customer accounts.
 const roleCreated=await create('roles',{name:'Test role'});assert.equal(roleCreated.status,200,JSON.stringify(roleCreated.body));
 const employeeCreated=await create('employees',{name:'Teacher',surname:'Test',phone:'+998900000001',role:roleCreated.body.record.id,salary:100000,lessonRate:10000,revenuePercent:10});assert.equal(employeeCreated.status,200,JSON.stringify(employeeCreated.body));const employee=employeeCreated.body.record.id;
 const access=await request('crm/staff-access',{employee,email:'new@example.test',password:'test-only-strong-password',role:'teacher',status:'active'});assert.equal(access.status,200,JSON.stringify(access.body));
 const staffLogin=await request('tenant/login',{login:'new@example.test',password:'test-only-strong-password'},'alpha.eduka.uz',false);assert.equal(staffLogin.status,200,JSON.stringify(staffLogin.body));
 const staffCookie=staffLogin.headers.get('set-cookie').split(';')[0];const restricted=await fetch(base+'/api/crm/staff-access',{headers:{Host:'alpha.eduka.uz','X-Forwarded-Host':'alpha.eduka.uz',Cookie:staffCookie}});assert.equal(restricted.status,403);
 assert.ok(!JSON.stringify((await request('crm/records')).body).includes('test-only-strong-password'));
 const salary=await request('crm/payroll-run',{employee,month:'2026-09'});assert.equal(salary.status,200,JSON.stringify(salary.body));assert.equal(salary.body.record.data.total,100000);
 assert.equal((await request('crm/payroll-run',{employee,month:'2026-09'})).status,409);
 const salaryPaid=await request('crm/payroll-pay',{id:salary.body.record.id,cash:cash.id});assert.equal(salaryPaid.status,200,JSON.stringify(salaryPaid.body));assert.equal((await request('crm/payroll-pay',{id:salary.body.record.id,cash:cash.id})).body.paymentId,salaryPaid.body.paymentId);
 assert.equal((await pg.query("SELECT COUNT(*)::int n FROM eduka_records WHERE center_id=$1 AND data->>'payrollId'=$2",[center,salary.body.record.id])).rows[0].n,1);
 assert.equal((await request('crm/records',{entity:'salary',action:'archive',id:salary.body.record.id,version:2})).status,400);
 assert.equal((await request('crm/support',{body:'Isolated test question'})).status,200);assert.equal((await request('crm/support')).body.messages.length,1);
 const supportReply=await fetch(base+'/api/ceo/support/reply',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+ceoToken},body:JSON.stringify({center,user,body:'Test operator reply'})});assert.equal(supportReply.status,200);assert.equal((await request('crm/support')).body.messages.at(-1).sender,'operator');
 const ceoAccess=await fetch(base+'/api/ceo/support/threads',{headers:{Authorization:'Bearer '+token}});assert.equal(ceoAccess.status,403,'tenant token never grants CEO access');
 assert.equal((await create('coins',{student,direction:'Ayirish',amount:1,date:'2026-09-16',reason:'No balance'})).status,409);
 assert.equal((await create('coins',{student,direction:'Qo‘shish',amount:20,date:'2026-09-16',reason:'Award'})).status,200);
 const reward=await create('rewards',{name:'Notebook',cost:15,stock:1});assert.equal(reward.status,200,JSON.stringify(reward.body));const redeem={student,reward:reward.body.record.id,key:randomUUID()};assert.equal((await request('crm/rewards/redeem',redeem)).status,200);assert.equal((await request('crm/rewards/redeem',redeem)).status,200);assert.equal((await request('crm/rewards/redeem',{...redeem,key:randomUUID()})).status,400);
 const config=await create('settings',{section:'system',attendanceCoins:5});assert.equal(config.status,200);
 const settingsId=config.body.record.id;
 assert.equal((await create('settings',{section:'system',maxGrade:5})).status,409,'one settings record per section');
 const updateSettings=(data,version=1)=>request('crm/records',{entity:'settings',action:'update',id:settingsId,version,data:{section:'system',attendanceCoins:5,...data}});
 assert.equal((await updateSettings({dayStart:'18:00',dayEnd:'08:00'})).status,400);
 assert.equal((await updateSettings({maxGrade:0})).status,400);
 assert.equal((await updateSettings({requiredPhone:'yes'})).status,400);
 assert.equal((await updateSettings({autoExit:true})).status,400,'unimplemented automation cannot be enabled');
 assert.equal((await updateSettings({centerLogo:'/api/crm/files?id='+randomUUID()})).status,400);
 const savedSettings=await updateSettings({centerName:'Alpha Learning',centerPhone:'+998901234567',centerAddress:'Test address',requiredPhone:true,maxGrade:10,tablePageSize:'50',dayStart:'09:00',dayEnd:'20:00',oldAttendance:false});assert.equal(savedSettings.status,200,JSON.stringify(savedSettings.body));
 assert.equal((await request('crm/session')).body.center.name,'Alpha Learning');
 assert.equal((await request('crm/records')).body.records.find(r=>r.id===settingsId).data.tablePageSize,'50');
 assert.equal((await create('students',{name:'Missing phone'})).status,400);
 assert.equal((await create('assessments',{student,grade:11})).status,400);
 assert.equal((await create('attendance',{student,group:group.id,date:'2020-01-01',status:'Keldi'})).status,400);
 const studySettings=await create('settings',{section:'study',lessonDuration:90,maxCapacity:1});assert.equal(studySettings.status,200);
 const timedGroup=await create('groups',{name:'Settings duration',time:'09:00'});assert.equal(timedGroup.status,200,JSON.stringify(timedGroup.body));assert.equal(timedGroup.body.record.data.endTime,'10:30');
 assert.equal((await create('groups',{name:'Out of hours',time:'07:00',endTime:'08:00'})).status,400);
 assert.equal((await create('enrollments',{student,group:timedGroup.body.record.id,startDate:'2026-09-17',status:'Faol'})).status,200);
 assert.equal((await create('enrollments',{student:created.body.record.id,group:timedGroup.body.record.id,startDate:'2026-09-17',status:'Faol'})).status,400);
 assert.equal((await updateSettings({centerName:'Alpha',oldAttendance:true},2)).status,200);
 assert.equal((await updateSettings({centerName:'Old stale copy'},2)).status,409);
 const attended=await create('attendance',{student,group:group.id,date:'2026-09-17',status:'Keldi'});assert.equal(attended.status,200,JSON.stringify(attended.body));
 assert.equal((await pg.query("SELECT COUNT(*)::int n FROM eduka_records WHERE center_id=$1 AND entity='coins' AND data->>'sourceAttendance'=$2",[center,attended.body.record.id])).rows[0].n,1);
 const {calculatePayroll}=require('../utils/crm-operations');const fixtures=[{id:'g',entity:'groups',data:{teacher:'t'}},{entity:'attendance',data:{group:'g',date:'2026-09-01',status:'Keldi'}},{entity:'attendance',data:{group:'g',date:'2026-09-01',status:'Keldi'}},{entity:'transactions',data:{student:'s',group:'g',date:'2026-09-01',direction:'Kirim',amount:200000}},{entity:'transactions',data:{student:'s',group:'g',date:'2026-09-02',direction:'Chiqim',amount:50000}}];const calc=calculatePayroll(fixtures,{id:'t',data:{salary:100000,lessonRate:10000,revenuePercent:10}},'2026-09');assert.equal(calc.lessonCount,1);assert.equal(calc.total,125000);
 process.env.EDUKA_TELEGRAM_CENTERS=JSON.stringify({[center]:{token:'123:test_token',chatId:'123',payments:true}});
 const notified=await create('transactions',{name:'Queue test',amount:1000,date:'2026-09-16',direction:'Kirim',student,cash:cash.id,paymentMethod:'Naqd'});assert.equal(notified.status,200);
 assert.equal((await pg.query('SELECT COUNT(*)::int n FROM eduka_notification_outbox WHERE center_id=$1',[center])).rows[0].n,1);
 const realFetch=global.fetch;let sent=0;global.fetch=async()=>{sent++;return {ok:true,json:async()=>({ok:true})}};try{await require('../utils/crm-notifications').tick(adapter);await require('../utils/crm-notifications').tick(adapter)}finally{global.fetch=realFetch;delete process.env.EDUKA_TELEGRAM_CENTERS}assert.equal(sent,1,'outbox claim prevents duplicate sends');

 async function tenantAction(method,body,cookie='eduka_session='+token,host='alpha.eduka.uz'){const r=await realFetch(base+'/api/crm/telegram',{method,headers:{Host:host,'X-Forwarded-Host':host,Cookie:cookie,'Content-Type':'application/json',Origin:'https://'+host},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()}}
 const fakeToken='987654:synthetic_token_only';let telegramCalls=0;
 global.fetch=async(url,opts)=>{if(!String(url).startsWith('https://api.telegram.org/'))return realFetch(url,opts);telegramCalls++;const method=String(url).split('/').at(-1);return {ok:true,json:async()=>({ok:true,result:method==='getMe'?{id:987654,username:'test_bot'}:method==='getChat'?{type:'supergroup',title:'Synthetic group'}:{status:'administrator'}})}};
 try{
 assert.equal((await tenantAction('PUT',{token:fakeToken,chatId:'123'})).status,400);
 assert.equal((await tenantAction('PUT',{token:fakeToken,chatId:'-1001234567890'},staffCookie)).status,403);
 assert.equal((await tenantAction('PUT',{token:fakeToken,chatId:'-1001234567890'})).status,200);
 assert.equal(telegramCalls,3,'saving verifies bot and membership without sending');
 const view=await tenantAction('GET');assert.equal(view.body.configured,true);assert.ok(!JSON.stringify(view).includes(fakeToken));
 const encrypted=(await pg.query('SELECT token_ciphertext FROM eduka_telegram_settings WHERE center_id=$1',[center])).rows[0].token_ciphertext;assert.ok(!encrypted.includes(fakeToken));
 assert.equal((await tenantAction('GET',null,'eduka_session='+token,'beta.eduka.uz')).status,403);
 assert.equal((await tenantAction('PUT',{chatId:'-1001234567890',enabled:false})).status,200);
 assert.equal(await require('../utils/crm-telegram').config(adapter,center),null);
 assert.equal((await tenantAction('PUT',{chatId:'-1001234567890',enabled:true})).status,200);
 assert.equal((await require('../utils/crm-telegram').config(adapter,center)).token,fakeToken);
 }finally{global.fetch=realFetch}
 async function ceoAction(id,suffix,method,body,auth=ceoToken){const r=await fetch(base+'/api/ceo/centers/'+id+suffix,{method,headers:{Authorization:'Bearer '+auth,'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()}}
 for(const days of [3,7,10]){assert.equal((await ceoAction(center,'/trial','POST',{days})).status,200);const session=(await request('crm/session')).body;assert.equal(session.center.status,'Trial');assert.equal(Math.ceil((new Date(session.center.expiresAt)-new Date(session.serverNow))/86400000),days)}
 assert.equal((await ceoAction(center,'/trial','POST',{days:4})).status,400);
 assert.equal((await ceoAction(center,'','DELETE',{confirmName:'Alpha'},token)).status,403);
 assert.equal((await ceoAction(center,'','DELETE',{confirmName:'wrong'})).status,400);
 const beforeOther=(await pg.query('SELECT * FROM centers WHERE id=$1',[other])).rows[0];
 assert.equal((await ceoAction(center,'','DELETE',{confirmName:'Alpha'})).status,200);
 for(const table of ['eduka_records','eduka_support_messages','eduka_telegram_settings','eduka_notification_outbox','center_users','students'])assert.equal((await pg.query(`SELECT COUNT(*)::int n FROM ${table} WHERE center_id=$1`,[center])).rows[0].n,0,table+' removed');
 assert.deepEqual((await pg.query('SELECT * FROM centers WHERE id=$1',[other])).rows[0],beforeOther);
 assert.ok([401,404].includes((await request('crm/session')).status));
 await pg.query("UPDATE center_users SET status='inactive' WHERE id=$1",[user]);assert.ok([401,404].includes((await request('crm/session')).status));

 process.env.ESKIZ_EMAIL='sms@example.test';process.env.ESKIZ_PASSWORD='fake-secret-for-test';process.env.ESKIZ_FROM='4546';
 let smsSends=0,authLogins=0,smsMode='accepted';
 const providerFetch=global.fetch;
 global.fetch=async(url,options)=>{if(!String(url).startsWith('https://notify.eskiz.uz/'))return providerFetch(url,options);if(String(url).endsWith('/auth/login')){authLogins++;assert.equal(options.body.get('email'),'sms@example.test');return {ok:true,status:200,json:async()=>({data:{token:'synthetic-eskiz-token-'+authLogins}})}}smsSends++;assert.equal(options.body.get('mobile_phone'),'998901234567');assert.equal(options.body.get('from'),'4546');if(smsMode==='timeout')throw Error('network error secret should not leak');if(smsMode==='reject')return {ok:false,status:400,json:async()=>({message:'provider raw secret'})};if(smsMode==='expired'){smsMode='accepted';return {ok:false,status:401,json:async()=>({})}}return {ok:true,status:200,json:async()=>({id:'provider-id',status:'waiting'})}};
 async function sms(route,body,key,auth=ceoToken){const r=await providerFetch(base+'/api/sms/'+route,{method:body?'POST':'GET',headers:{...(auth?{Authorization:'Bearer '+auth}:{}),'Content-Type':'application/json',...(key?{'Idempotency-Key':key}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()}}
 try{
 assert.equal((await sms('send',{phone:'998901234567',message:'Test'},'anonymous-test',null)).status,401);
 assert.equal((await sms('send',{phone:'998901234567',message:'Test'},'tenant-test-key',token)).status,403);
 assert.equal((await sms('send',{phone:'bad',message:'Test'},'invalid-phone')).status,400);
 assert.equal((await sms('check',{})).status,200);assert.equal(smsSends,0,'connection check never sends SMS');
 const smsBody={phone:'+998 90 123 45 67',message:'Isolated SMS test'};
 assert.equal((await sms('send',smsBody,'sms-request-one')).body.status,'accepted');assert.equal(authLogins,1,'cached token');
 assert.equal((await sms('send',smsBody,'sms-request-one')).body.duplicate,true);assert.equal(smsSends,1);
 assert.equal((await sms('send',{...smsBody,message:'Changed'},'sms-request-one')).status,409);
 smsMode='expired';assert.equal((await sms('send',smsBody,'sms-request-expired')).body.status,'accepted');assert.equal(authLogins,2);
 smsMode='timeout';assert.equal((await sms('send',smsBody,'sms-request-timeout')).body.status,'unknown');const count=smsSends;await sms('send',smsBody,'sms-request-timeout');assert.equal(smsSends,count,'uncertain delivery never resent');
 smsMode='reject';assert.equal((await sms('send',smsBody,'sms-request-reject')).body.status,'failed');
 const history=JSON.stringify((await sms('history')).body);assert.ok(!history.includes('synthetic-eskiz-token'));assert.ok(!history.includes('provider raw secret'));assert.ok(!history.includes('fake-secret-for-test'));
 const saved=(await pg.query('SELECT token_ciphertext FROM eskiz_tokens WHERE id=1')).rows[0];assert.ok(!saved.token_ciphertext.includes('synthetic-eskiz-token'));
 }finally{global.fetch=providerFetch;delete process.env.ESKIZ_EMAIL;delete process.env.ESKIZ_PASSWORD;delete process.env.ESKIZ_FROM}
 const {loginError}=require('../utils/eskiz');
 for(const [status,data,code]of [[401,{message:'secret password rejected'},'ESKIZ_CREDENTIALS_REJECTED'],[403,null,'ESKIZ_ACCESS_DENIED'],[422,{errors:{email:['private email']}},'ESKIZ_AUTH_FIELDS'],[429,{},'ESKIZ_AUTH_LIMIT'],[503,{},'ESKIZ_UNAVAILABLE'],[200,null,'ESKIZ_AUTH_RESPONSE']]){const err=loginError({status,data});assert.equal(err.code,code);assert.ok(!err.message.includes('secret password'));assert.ok(!err.message.includes('private email'))}
 console.log('PASS: CEO SMS authentication, validation, encrypted token cache, 401 refresh, idempotency, timeout and provider rejection.');
 await new Promise(r=>server.close(r));await pg.close();
 console.log('PASS: tenant isolation, empty onboarding, billing limits, pagination, staff access, payroll idempotency, coins/rewards, support replies, CEO authorization, ledger/refunds, native login, legacy import and private files.');
}
main().catch(e=>{console.error(e);process.exit(1)});
