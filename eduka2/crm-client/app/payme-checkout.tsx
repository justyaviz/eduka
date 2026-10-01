import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
type Order={id:string;amount:number;tariff:string;days:number;mode:string;status:string;checkoutUrl?:string;receiptUrl?:string;applied_until?:string};
export default function PaymeCheckout({ready,mode,onPaid}:{ready:boolean;mode:string;onPaid:()=>void}){
 const [order,setOrder]=useState<Order|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[checking,setChecking]=useState(false);
 const lock=useRef(false),requestId=useRef('');
 const current=useRef<Order|null>(null);current.current=order;
 const paidHandler=useRef(onPaid);paidHandler.current=onPaid;
 const returned=new URLSearchParams(window.location.search).get('order');
 const orderId=order?.id||returned;
 useEffect(()=>{
  if(!orderId||!/^[a-f0-9-]{36}$/i.test(orderId))return;
  let active=true,timer:ReturnType<typeof setTimeout>;const controller=new AbortController();let tries=0;
  async function check(){try{
   const r=await fetch('/api/crm/subscription/orders/'+orderId,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});const d=await r.json();if(!r.ok)throw Error(d.error||'Tekshirish bajarilmadi');if(!active)return;
   setOrder(prev=>({...prev,...d}));setError('');
   if(['paid','cancelled'].includes(d.status)&&current.current?.status!==d.status)paidHandler.current();
   if(d.status==='pending'&&++tries<60)timer=setTimeout(check,5000);
  }catch(e:any){if(active)setError(e.message||'To‘lov holatini tekshirib bo‘lmadi')}}
  void check();return()=>{active=false;controller.abort();clearTimeout(timer)};
 },[orderId,checking]);
 async function start(){if(lock.current)return;lock.current=true;setBusy(true);setError('');requestId.current||=crypto.randomUUID();try{
  const r=await fetch('/api/crm/subscription/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:requestId.current}),signal:AbortSignal.timeout(20000)});const d=await r.json();if(!r.ok)throw Error(d.error||'To‘lov ochilmadi');setOrder(d);
 }catch(e:any){setError(e.name==='TimeoutError'?'Javob kelmadi. Qayta urinish xavfsiz — bir xil so‘rov tekshiriladi.':e.message)}finally{lock.current=false;setBusy(false)}}
 const labels:Record<string,string>={pending:'To‘lov kutilmoqda',paid:order?.mode==='test'?'Test to‘lovi tasdiqlandi. Real obuna o‘zgarmadi.':'To‘lov tasdiqlandi, obuna uzaytirildi',cancelled:'To‘lov bekor qilingan',expired:'To‘lov vaqti tugagan'};
 return <div>
  <p>Joriy tarifni 30 kunga uzaytirish. Amaldagi obunaning qolgan muddati saqlanadi.</p>
  {!ready&&<p className="form-note">Payme sozlamalari yakunlanmoqda. Hozircha administratorga murojaat qiling.</p>}
  {ready&&mode==='test'&&<p className="form-note">Sinov rejimi — haqiqiy to‘lov va obunani uzaytirish bajarilmaydi.</p>}
  {error&&<p className="error-banner" role="alert">{error}</p>}
  {!order&&<Button disabled={!ready||busy} onClick={start}>{busy?'Hisob tayyorlanmoqda…':mode==='test'?'Payme sinov hisobini yaratish':'Payme orqali to‘lash'}</Button>}
  {order&&<div style={{padding:16,border:'1px solid #E4E7EC',borderRadius:12,marginTop:12}}><strong>{order.tariff} · {new Intl.NumberFormat('uz-UZ').format(order.amount)} so‘m · {order.days} kun</strong><p role="status">{labels[order.status]||order.status}</p><small style={{overflowWrap:'anywhere'}}>Hisob: {order.id}</small><div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:12}}>
   {order.status==='pending'&&order.checkoutUrl&&<Button asChild><a href={order.checkoutUrl}>Payme sahifasiga o‘tish</a></Button>}
   <Button variant="outline" onClick={()=>setChecking(v=>!v)}>To‘lovni tekshirish</Button>
   {order.receiptUrl&&<Button asChild variant="outline"><a href={order.receiptUrl} target="_blank" rel="noopener noreferrer">Fiskal chek</a></Button>}
   {['paid','expired','cancelled'].includes(order.status)&&<Button variant="outline" onClick={()=>{setOrder(null);requestId.current='';history.replaceState({},'','/subscription')}}>Yangi to‘lov</Button>}
  </div></div>}
 </div>
}
