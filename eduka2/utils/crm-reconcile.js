const {maps}=require('./crm-legacy');
const text=v=>v==null?'':String(v),date=v=>v?String(v).slice(0,10):'';
async function reconcile(db,center){
 // Called under the existing center transaction lock. Each captured change is
 // consumed exactly once; new external events remain for the next batch.
 let batch;
 do{
 batch=(await db.query('SELECT * FROM eduka_legacy_changes WHERE center_id=$1 ORDER BY id LIMIT 500 FOR UPDATE',[center])).rows;
 for(const change of batch){
 let pair=Object.entries(maps).find(([,v])=>v[0]===change.source_table);
 if(change.source_table==='center_users')pair=['employees',['center_users',r=>({name:r.full_name,email:r.email,branch:text(r.branch_id),status:r.status==='active'?'Faol':'Arxiv',legacyKind:'staff'})]];
 if(change.source_table==='center_expenses')pair=['transactions',['center_expenses',r=>({name:r.title,amount:Number(r.amount||0),cash:text(r.cashbox_id),branch:text(r.branch_id),direction:'Chiqim',date:date(r.spent_at),paymentMethod:'Naqd',note:text(r.note),legacyKind:'expense'})]];
 if(!pair)continue;const [entity,[,map]]=pair;
 const oldData=change.old_row?map(change.old_row):{},newData=change.new_row?map(change.new_row):{};
 let current=(await db.query('SELECT * FROM eduka_records WHERE center_id=$1 AND id=$2',[center,change.record_id])).rows[0];
 if(current&&current.entity!==entity)throw Error('Legacy entity identity conflict');
 if(current&&['students','employees'].includes(entity)&&newData.name){if([current.data.name,current.data.surname].filter(Boolean).join(' ')===newData.name)newData.name=current.data.name;else if(newData.name!==oldData.name)newData.surname='';}
 const data={...current?.data};
 for(const key of Object.keys(newData))if(!current||JSON.stringify(newData[key])!==JSON.stringify(oldData[key]))data[key]=newData[key];
 if(!current&&entity==='students')data.openingBalance=Number(change.new_row?.balance||0);
 if(!current&&entity==='employees'&&change.source_table==='teachers')data.legacyKind='teacher';
 const deleted=!change.new_row||change.new_row.status==='deleted'||change.new_row.status==='cancelled'||change.source_table==='center_payments'&&change.new_row.status!=='paid'?1:0;
 if(!current||JSON.stringify(data)!==JSON.stringify(current.data)||deleted!==current.deleted){
 const timestamp=change.new_row?.created_at||current?.created_at||new Date();
 await db.query('INSERT INTO eduka_records(id,center_id,entity,data,deleted,created_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data,deleted=EXCLUDED.deleted,version=eduka_records.version+1,updated_at=NOW() WHERE eduka_records.center_id=EXCLUDED.center_id',[change.record_id,center,entity,JSON.stringify(data),deleted,timestamp]);
 await db.query("INSERT INTO eduka_events(center_id,record_id,entity,action,actor,changes) VALUES($1,$2,$3,'legacy-sync','Eski API',$4)",[center,change.record_id,entity,JSON.stringify({source:change.source_table})]);
 }
 // The CRM ledger is authoritative after cutover. Raw balance edits are not
 // imported as new money; payments/charges/discounts carry financial meaning.
 const affected=entity==='students'?[change.record_id]:entity==='transactions'?[data.student,current?.data.student,oldData.student].filter(Boolean):[];
 for(const student of new Set(affected)){const rows=(await db.query("SELECT entity,data FROM eduka_records WHERE center_id=$1 AND deleted=0 AND (id=$2 OR data->>'student'=$3)",[center,student,student])).rows;let balance=Number(rows.find(r=>r.entity==='students')?.data.openingBalance||0);for(const r of rows){const n=Number(r.data.amount||0);if(r.entity==='transactions')balance+=r.data.direction==='Kirim'?n:-n;if(r.entity==='charges')balance-=n;if(r.entity==='discounts')balance+=n}await db.query("SELECT set_config('eduka.workspace_write','1',true)");await db.query('UPDATE students SET balance=$3 WHERE center_id=$1 AND id=$2',[center,student,balance]);}
 await db.query('DELETE FROM eduka_legacy_changes WHERE id=$1',[change.id]);
 }
 }while(batch.length===500);
}
module.exports={reconcile};
