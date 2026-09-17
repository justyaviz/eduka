import {useEffect,useState} from 'react';
export default function SubscriptionBadge(){
 const [info,setInfo]=useState<any>(null);
 useEffect(()=>{let active=true;async function refresh(){try{const r=await fetch('/api/crm/session');if(r.ok){const d=await r.json();if(active)setInfo({...d.center,serverNow:d.serverNow})}}catch{}}refresh();const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh)}},[]);
 if(!info)return null;
 const days=info.expiresAt?Math.max(0,Math.ceil((new Date(info.expiresAt).getTime()-new Date(info.serverNow).getTime())/86400000)):null;
 const trial=String(info.status).toLowerCase()==='trial';
 return <span className={'subscription-badge'+(days===0?' expired':'')} role="status" title={info.expiresAt?new Date(info.expiresAt).toLocaleString('uz-UZ'):undefined}>{days===null?'Obuna faol':days===0?(trial?'Sinov muddati tugagan':'Obuna muddati tugagan'):`${trial?'Sinov muddati':'Obuna'} tugashiga ${days} kun qoldi`}</span>
}
