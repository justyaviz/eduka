import {useEffect,useState,type FormEvent} from 'react';
import {createRoot} from 'react-dom/client';
import CRM from './app/crm';
import {BookLoader} from './app/loading';
import BrandLogo from './app/brand-logo';
import './app/globals.css';
function App(){
 const [session,setSession]=useState<any>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function check(){setLoading(true);try{const r=await fetch('/api/crm/session');const d=await r.json();if(r.ok)setSession(d);else if(r.status!==401)setError(d.error||'Markazga kirish imkoni yo‘q')}catch{setError('Server bilan aloqa yo‘q. Sahifani qayta oching.')}finally{setLoading(false)}}
 useEffect(()=>{check();const expired=()=>{setSession(null);setError('Sessiya tugadi. Qayta kiring.')};window.addEventListener('eduka-session-expired',expired);return()=>window.removeEventListener('eduka-session-expired',expired)},[]);
 async function login(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const form=new FormData(e.currentTarget);try{const r=await fetch('/api/tenant/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({login:form.get('login'),password:form.get('password')})});const d=await r.json();if(!r.ok)throw Error(d.error||'Kirish amalga oshmadi');await check()}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 async function logout(){try{await fetch('/api/crm/logout',{method:'POST'});setSession(null);history.replaceState({},'','/login');document.documentElement.classList.remove('dark')}catch{setError('Chiqishda xatolik')}}
 if(loading)return <div className="boot"><BookLoader/></div>;
 if(session)return <CRM userName={session.user.fullName||'Administrator'} centerName={session.center.name} onLogout={logout}/>;
 return <main className="login-page"><div className="login-brand"><BrandLogo/></div><section className="login-card"><h1>Tizimga kirish</h1><p className="login-caption">O‘quv markazlari uchun zamonaviy CRM platformasi</p><form onSubmit={login}><label className="tenant-label" htmlFor="login">Login yoki telefon</label><input className="tenant-input" id="login" name="login" autoComplete="username" required/><label className="tenant-label" htmlFor="password">Parol</label><input className="tenant-input" id="password" name="password" type="password" autoComplete="current-password" required/>{error&&<p role="alert" className="form-error">{error}</p>}<button className="login-submit" disabled={busy}>{busy?'Kirilmoqda…':'Kirish'}</button></form><p className="login-note">Markazingiz uchun berilgan login va paroldan foydalaning.</p></section><footer>EDUKA</footer></main>
}
createRoot(document.getElementById('root')!).render(<App/>);
