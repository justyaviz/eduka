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
 await pg.query("UPDATE center_users SET status='inactive' WHERE id=$1",[user]);assert.equal((await request('crm/session')).status,401);
 await new Promise(r=>server.close(r));await pg.close();
 console.log('PASS: tenant isolation, native login cookie, revoked user, legacy import, balance preservation, canonical writes, enrollment/visit duplicates, stale writes, audit, installments and private files.');
}
main().catch(e=>{console.error(e);process.exit(1)});
