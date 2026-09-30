import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {NativeSelect} from '@/components/ui/native-select';
import {exportRows} from '@/lib/domain';
import {requestReceipt} from './experience';
type Balance={id:string;name:string;balance:number;storedBalance:number|null;difference:number|null};
type Entry={id:string;date:string;entity:string;name:string;kind:string;increase:number;decrease:number;balance:number};
type Statement={student:{id:string;name:string};opening:number;closing:number;entries:Entry[]};
const money=(v:number)=>v.toLocaleString('uz-UZ');
export default function StudentLedger({balances,from,to}:{balances:Balance[];from:string;to:string}){
 const [query,setQuery]=useState(''),[mode,setMode]=useState('debt'),[page,setPage]=useState(1),[student,setStudent]=useState(''),[data,setData]=useState<Statement|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{setPage(1)},[query,mode,balances]);
 useEffect(()=>{setData(null);setError('');if(!student)return;const controller=new AbortController();setBusy(true);
  fetch('/api/crm/student-ledger/'+student+'?'+new URLSearchParams({from,to}),{signal:controller.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Hisob ko‘chirmasi yuklanmadi');setData(d)}).catch(e=>{if(e.name!=='AbortError')setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setBusy(false)});
  return()=>controller.abort();
 },[student,from,to,balances]);
 const filtered=balances.filter(b=>b.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())&&(mode==='all'||mode==='debt'&&b.balance<0||mode==='credit'&&b.balance>0||mode==='mismatch'&&b.difference!==0));
 const totalPages=Math.max(1,Math.ceil(filtered.length/25)),current=Math.min(page,totalPages);
 return <section aria-label="O‘quvchilar hisob-kitobi"><h3>O‘quvchilar balansi va hisob ko‘chirmasi</h3>
  <div className="profile-actions"><Input aria-label="O‘quvchini qidirish" placeholder="O‘quvchi ismi" value={query} onChange={e=>setQuery(e.target.value)}/><NativeSelect aria-label="Balans turi" value={mode} onChange={e=>setMode(e.target.value)}><option value="debt">Qarzdorlar</option><option value="credit">Oldindan to‘laganlar</option><option value="mismatch">Balansi mos kelmaganlar</option><option value="all">Barcha o‘quvchilar</option></NativeSelect><Button variant="outline" disabled={!filtered.length} onClick={()=>exportRows('Oquvchilar-balansi',['O‘quvchi','Hisoblangan balans','Bazadagi balans','Farq'],filtered.map(b=>[b.name,b.balance,b.storedBalance??'Mavjud emas',b.difference??'Mavjud emas']))}>Balanslarni yuklash</Button></div>
  <p className="form-note">Manfiy balans — qarz, musbat balans — oldindan to‘langan qoldiq. Bu ro‘yxat barcha sanalar bo‘yicha joriy holatni ko‘rsatadi.</p>
  <div className="table-panel"><table><thead><tr><th>O‘quvchi</th><th>Balans, UZS</th><th>Bazadagi balans</th><th>Farq</th><th>Hisob</th></tr></thead><tbody>{filtered.slice((current-1)*25,current*25).map(b=><tr key={b.id}><td><Link href={'/students/student-list/edit/'+b.id}>{b.name}</Link></td><td>{money(b.balance)}</td><td>{b.storedBalance===null?'Mavjud emas':money(b.storedBalance)}</td><td>{b.difference===null?'Tekshirish kerak':money(b.difference)}</td><td><Button variant="outline" onClick={()=>setStudent(b.id)}>Ko‘chirma</Button></td></tr>)}</tbody></table></div>
  {!filtered.length&&<p>Tanlangan filtr bo‘yicha o‘quvchilar yo‘q.</p>}{totalPages>1&&<div className="profile-actions"><Button variant="outline" disabled={current<=1} onClick={()=>setPage(current-1)}>Oldingi</Button><span>{current} / {totalPages}</span><Button variant="outline" disabled={current>=totalPages} onClick={()=>setPage(current+1)}>Keyingi</Button></div>}
  {student&&<section aria-label="Hisob ko‘chirmasi"><div className="profile-actions"><h3>{data?.student.name||'Hisob ko‘chirmasi'}</h3><Button variant="outline" onClick={()=>setStudent('')}>Yopish</Button></div>{busy&&<p role="status">Hisob ko‘chirmasi yuklanmoqda…</p>}{error&&<p role="alert">{error}</p>}{data&&<>
   <p>{from||'Boshidan'} — {to||'Barcha sanalar'} · Boshlang‘ich balans: {money(data.opening)} UZS · Yakuniy balans: {money(data.closing)} UZS</p>
   <Button variant="outline" onClick={()=>exportRows('Hisob-kochirmasi',['Sana','Amal','Izoh','Kredit (+)','Debet (−)','Balans'],[['','Boshlang‘ich balans','','','',data.opening],...data.entries.map(e=>[e.date,e.kind,e.name,e.increase,e.decrease,e.balance]),['','Yakuniy balans','','','',data.closing]])}>Ko‘chirmani yuklash</Button>
   <div className="table-panel"><table><thead><tr><th>Sana</th><th>Amal</th><th>Izoh</th><th>Kredit (+)</th><th>Debet (−)</th><th>Balans</th><th>Chek</th></tr></thead><tbody>{data.entries.map(e=><tr key={e.id}><td>{e.date||'Sanasiz'}</td><td>{e.kind}</td><td>{e.name}</td><td>{money(e.increase)}</td><td>{money(e.decrease)}</td><td>{money(e.balance)}</td><td>{e.entity==='transactions'&&<Button variant="outline" onClick={()=>requestReceipt({id:e.id},data.student.name)}>Chek</Button>}</td></tr>)}</tbody></table></div>{!data.entries.length&&<p>Tanlangan davrda operatsiyalar yo‘q.</p>}
   <p className="form-note">Boshlang‘ich balansga tanlangan davrgacha bo‘lgan amallar kiradi. Bekor qilingan yozuvlar hisobga olinmaydi. Bu ko‘chirma o‘quvchi hisobini ko‘rsatadi; chegirma kassaga pul tushishi emas.</p>
  </>}</section>}
 </section>;
}
