import {useCallback,useEffect,useRef,useState} from 'react';
import {ArrowUpRight,CheckCircle2,Clock3,Info,RefreshCw,ReceiptText,ShieldCheck,XCircle} from 'lucide-react';
import {Button} from '@/components/ui/button';
type Order={id:string;amount:number;tariff:string;days:number;mode:string;status:string;checkoutUrl?:string;receiptUrl?:string};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const money=(n:number)=>new Intl.NumberFormat('uz-UZ').format(n);
const storageKey='eduka-subscription-order';
function savedId(){const returned=new URLSearchParams(location.search).get('order');if(returned)return returned;try{return sessionStorage.getItem(storageKey)||''}catch{return ''}}
export default function PaymeCheckout({ready,mode,onPaid}:{ready:boolean;mode:string;onPaid:()=>void}){
 const [order,setOrder]=useState<Order|null>(null),[orderId,setOrderId]=useState(savedId),[error,setError]=useState(''),[busy,setBusy]=useState(false),[checking,setChecking]=useState(false),[checkedAt,setCheckedAt]=useState(''),[attempt,setAttempt]=useState(0);
 const lock=useRef(false),requestId=useRef(''),mounted=useRef(true),request=useRef<AbortController|null>(null),lastStatus=useRef('');
 const paidHandler=useRef(onPaid);paidHandler.current=onPaid;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;request.current?.abort()}},[]);
 useEffect(()=>{try{if(orderId&&uuid.test(orderId))sessionStorage.setItem(storageKey,orderId);else sessionStorage.removeItem(storageKey)}catch{}},[orderId]);
 useEffect(()=>{
  if(!orderId)return;
  if(!uuid.test(orderId)){setError('To‘lov havolasi noto‘g‘ri. Yangi hisob yarating.');return}
  let active=true,timer:ReturnType<typeof setTimeout>|undefined,tries=0;const controller=new AbortController();
  async function check(){setChecking(true);try{
   const r=await fetch('/api/crm/subscription/orders/'+orderId,{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});if(r.status===401)window.dispatchEvent(new Event('eduka-session-expired'));
   const d=await r.json();if(!r.ok)throw Error(d.error||'To‘lov holati yuklanmadi');if(!active)return;
   setOrder(d);setError('');setCheckedAt(new Date().toLocaleTimeString('uz-UZ',{hour:'2-digit',minute:'2-digit'}));
   if(['paid','cancelled'].includes(d.status)&&lastStatus.current!==`${d.id}:${d.status}`)paidHandler.current();lastStatus.current=`${d.id}:${d.status}`;
   if(d.status==='pending'&&++tries<60)timer=setTimeout(check,5000);
  }catch(e:any){if(active)setError(e.name==='TimeoutError'?'Tekshirish vaqti tugadi. Qayta urinib ko‘ring.':e.message||'Server bilan aloqa yo‘q.')}finally{if(active)setChecking(false)}}
  void check();const focus=()=>{if(document.visibilityState==='visible'){clearTimeout(timer);controller.abort();setAttempt(n=>n+1)}};
  document.addEventListener('visibilitychange',focus);
  return()=>{active=false;controller.abort();clearTimeout(timer);document.removeEventListener('visibilitychange',focus)};
 },[orderId,attempt]);
 const reset=useCallback(()=>{setOrder(null);setOrderId('');setError('');setCheckedAt('');setChecking(false);requestId.current='';lastStatus.current='';const u=new URL(location.href);u.searchParams.delete('order');history.replaceState(history.state,'',u.pathname+u.search+u.hash)},[]);
 async function start(){if(lock.current||!ready)return;lock.current=true;setBusy(true);setError('');requestId.current||=crypto.randomUUID();const controller=new AbortController();request.current=controller;try{
  const r=await fetch('/api/crm/subscription/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:requestId.current}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])});if(r.status===401)window.dispatchEvent(new Event('eduka-session-expired'));const d=await r.json();if(!r.ok)throw Error(d.error||'To‘lov hisobini yaratib bo‘lmadi');if(!mounted.current)return;setOrder(d);setOrderId(d.id);
 }catch(e:any){if(mounted.current)setError(e.name==='TimeoutError'?'Javob kechikdi. Qayta bosishingiz mumkin — hisob takror yaratilmaydi.':e.message)}finally{lock.current=false;if(mounted.current)setBusy(false)}}
 const labels:Record<string,string>={pending:'To‘lov kutilmoqda',paid:order?.mode==='test'?'Sinov to‘lovi tasdiqlandi':'To‘lov tasdiqlandi',cancelled:'To‘lov bekor qilingan',expired:'Hisob muddati tugagan'};
 const StateIcon=order?.status==='paid'?CheckCircle2:['cancelled','expired'].includes(order?.status||'')?XCircle:Clock3;
 return <div>
  <p className="sub-checkout-copy">To‘lov tasdiqlangach, obunangizga 30 kun qo‘shiladi. To‘lov summasini Payme’ga o‘tishdan oldin ko‘rasiz.</p>
  {!ready&&<div className="sub-notice"><Info size={17}/><span>Onlayn to‘lov hozircha mavjud emas. Yordam xizmatiga murojaat qiling.</span></div>}
  {mode==='test'&&<div className="sub-notice test"><Info size={17}/><span><strong>Payme sinov rejimida.</strong> Hozir haqiqiy pul yechilmaydi va obuna uzaytirilmaydi.</span></div>}
  {error&&<div className="sub-error" role="alert">{error}</div>}
  {!orderId&&<Button id="payme-start" className="sub-checkout-start" disabled={!ready||busy} onClick={()=>void start()}>{busy?<RefreshCw className="spin"/>:<ShieldCheck/>}{busy?'Hisob tayyorlanmoqda…':mode==='test'?'Sinov hisobini yaratish':'Payme orqali to‘lash'}{!busy&&<ArrowUpRight size={16}/>}</Button>}
  {orderId&&!order&&<div className="sub-checkout-actions"><Button variant="outline" disabled={checking} onClick={()=>setAttempt(n=>n+1)}><RefreshCw className={checking?'spin':''}/>{checking?'Hisob tekshirilmoqda…':'Qayta tekshirish'}</Button><Button variant="ghost" onClick={reset}>Yangi hisob yaratish</Button></div>}
  {order&&<div className="sub-order"><div className="sub-order-heading" role="status"><StateIcon size={19}/>{labels[order.status]||order.status}</div><div className="sub-order-total"><span>{order.tariff} <small>· {order.days} kun</small></span><strong>{money(order.amount)} <small>so‘m</small></strong></div>{order.status==='paid'&&<p>{order.mode==='test'?'Bu sinov edi. Amaldagi obuna muddati o‘zgarmadi.':'Obuna muddati yangilandi. Yuqorida yangi tugash sanasini ko‘rishingiz mumkin.'}</p>}<small className="sub-order-id">Hisob raqami: {order.id}</small><div className="sub-checkout-actions">
   {order.status==='pending'&&order.checkoutUrl&&<Button asChild><a href={order.checkoutUrl}>{order.mode==='test'?'Payme sinov sahifasi':'Payme’da to‘lash'}<ArrowUpRight size={16}/></a></Button>}
   <Button variant="outline" disabled={checking} onClick={()=>setAttempt(n=>n+1)}><RefreshCw size={16} className={checking?'spin':''}/>{checking?'Tekshirilmoqda…':'Holatni tekshirish'}</Button>
   {order.receiptUrl&&<Button asChild variant="outline"><a href={order.receiptUrl} target="_blank" rel="noopener noreferrer"><ReceiptText size={16}/>Fiskal chek</a></Button>}
   {(['paid','expired','cancelled'].includes(order.status)||!order.checkoutUrl)&&<Button variant="outline" onClick={reset}>Yangi hisob</Button>}
  </div>{checkedAt&&<small className="sub-check-time">Oxirgi tekshiruv: {checkedAt}{order.status==='pending'?' · Avtomatik tekshiruv 5 daqiqagacha':''}</small>}</div>}
 </div>
}
