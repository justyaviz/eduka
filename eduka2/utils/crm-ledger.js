const cents=value=>Math.round(Number(value||0)*100);
function delta(row){
 if(row.deleted)return 0;
 const sign=row.entity==='charges'?-1:row.entity==='discounts'?1:row.entity==='transactions'?(row.data.direction==='Kirim'?1:row.data.direction==='Chiqim'?-1:0):0;
 return sign*cents(row.data.amount);
}
function statement(student,rows,from='',to=''){
 let opening=cents(student.data.openingBalance),balance=opening;
 const entries=[];
 const ordered=rows.filter(r=>!r.deleted&&r.data.student===student.id&&['transactions','charges','discounts'].includes(r.entity)).sort((a,b)=>String(a.data.date||'').localeCompare(String(b.data.date||''))||(new Date(a.created_at||0).getTime()-new Date(b.created_at||0).getTime())||a.id.localeCompare(b.id));
 for(const row of ordered){
  const date=row.data.date||'',amount=delta(row);
  if(to&&date>to)continue;
  balance+=amount;
  if(from&&date<from){opening+=amount;continue;}
  entries.push({id:row.id,date,entity:row.entity,name:row.data.name||'',kind:row.entity==='charges'?'Hisoblangan':row.entity==='discounts'?'Chegirma':row.data.direction==='Kirim'?'To‘lov':'Qaytarish',increase:Math.max(0,amount)/100,decrease:Math.max(0,-amount)/100,balance:balance/100});
 }
 return {opening:opening/100,closing:balance/100,entries};
}
module.exports={cents,delta,statement};
