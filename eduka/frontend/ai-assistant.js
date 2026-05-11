const $ = (s)=>document.querySelector(s);
const toast = (m)=>{ const t=$('#toast'); t.textContent=m; t.classList.remove('hidden'); setTimeout(()=>t.classList.add('hidden'),2800); };
async function api(url, opts={}){ const r=await fetch(url,{headers:{'Content-Type':'application/json'},...opts}); const j=await r.json().catch(()=>({ok:false,message:'JSON error'})); if(!r.ok||j.ok===false) throw new Error(j.message||'Xatolik'); return j; }
function fmtDate(v){ try{return new Date(v).toLocaleString('uz-UZ')}catch{return '-'} }
async function load(){
  const [overview, leads, messages, faqs, intelligence] = await Promise.all([
    api('/api/app/ai-assistant/overview'),
    api('/api/app/ai-assistant/leads'),
    api('/api/app/ai-assistant/messages'),
    api('/api/app/ai-assistant/faqs'),
    api('/api/app/ai-assistant/intelligence')
  ]);
  $('#statsGrid').innerHTML = `
    <div class="card stat"><h3>Bot holati</h3><strong>${overview.config?.enabled?'ON':'OFF'}</strong><small>@${overview.config?.username||'eduka_aibot'}</small></div>
    <div class="card stat"><h3>Leadlar</h3><strong>${overview.leads?.total||0}</strong><small>Yangi: ${overview.leads?.new_count||0}</small></div>
    <div class="card stat"><h3>24 soat xabar</h3><strong>${overview.messages_24h||0}</strong><small>Webhook log</small></div>
    <div class="card stat"><h3>Business chat</h3><strong>${overview.business?.connections?.active||0}</strong><small>24 soat: ${overview.business?.business_messages_24h||0}</small></div>
    <div class="card stat"><h3>FAQ</h3><strong>${overview.faq_count||0}</strong><small>Aktiv javoblar</small></div>`;
  $('#intelligenceGrid').innerHTML = `
    <div class="card stat"><h3>AI niyatlar</h3><strong>${intelligence.intents?.length||0}</strong><small>7 kunlik intent turlari</small></div>
    <div class="card stat"><h3>Qualified lead</h3><strong>${intelligence.conversations?.qualified||0}</strong><small>Avg score: ${intelligence.conversations?.avg_score||0}</small></div>
    <div class="card stat"><h3>Hot leadlar</h3><strong>${intelligence.hot_leads?.length||0}</strong><small>Score 60+</small></div>`;
  $('#hotLeadList').innerHTML = intelligence.hot_leads?.length ? intelligence.hot_leads.map(c=>`<div class="item hot"><b>${c.first_name||c.username||'Mijoz'} — ${c.lead_score}/100</b><p>${c.summary||c.last_message||'AI memory bor'}</p><div class="meta"><span class="pill amber">${c.last_intent||'unknown'}</span><span class="pill green">${c.qualified?'qualified':'warming'}</span><span class="pill">${fmtDate(c.updated_at)}</span></div></div>`).join('') : '<div class="item"><b>Hot lead yo‘q</b><p>Mijozlar savol berganida AI score shu yerda chiqadi.</p></div>';
  
  $('#leadCount').textContent = leads.leads.length;
  $('#leadsList').innerHTML = leads.leads.length ? leads.leads.map(l=>`<div class="item"><b>${l.full_name||'Noma’lum'}</b><p>${l.center_name||'-'} • ${l.city||'-'} • ${l.student_count||'-'} o‘quvchi</p><div class="meta"><span class="pill green">${l.status}</span><span class="pill">${l.phone||'-'}</span><span class="pill">${fmtDate(l.created_at)}</span>${l.username?`<span class="pill">@${l.username}</span>`:''}</div></div>`).join('') : '<div class="item"><b>Lead yo‘q</b><p>Demo so‘rovlari shu yerda ko‘rinadi.</p></div>';
  $('#messagesList').innerHTML = messages.messages.length ? messages.messages.map(m=>`<div class="item"><b>${m.is_business_message?'Business ':''}${m.direction==='in'?'Kiruvchi':'Chiquvchi'} xabar</b><p>${(m.text||'').slice(0,220) || '-'}</p><div class="meta"><span class="pill ${m.direction==='in'?'amber':'green'}">${m.direction}</span>${m.is_business_message?'<span class="pill">business</span>':''}${m.intent?`<span class="pill amber">${m.intent}</span>`:''}<span class="pill">${fmtDate(m.created_at)}</span></div></div>`).join('') : '<div class="item"><b>Xabar yo‘q</b><p>Bot xabarlari shu yerda chiqadi.</p></div>';
  $('#faqList').innerHTML = faqs.faqs.map(f=>`<div class="faq"><h3>${f.title}</h3><p>${f.answer}</p><p><small>${(f.keywords||[]).join(', ')}</small></p></div>`).join('');
}
$('#refreshBtn').onclick=()=>load().then(()=>toast('Yangilandi')).catch(e=>toast(e.message));
$('#setWebhookBtn').onclick=async()=>{ try{ const r=await api('/api/ai-bot/set-webhook',{method:'POST',body:'{}'}); toast('Webhook ulandi'); console.log(r); }catch(e){toast(e.message)} };
$('#faqToggle').onclick=()=>$('#faqForm').classList.toggle('hidden');
$('#faqForm').onsubmit=async(e)=>{ e.preventDefault(); const fd=new FormData(e.target); const body={ title:fd.get('title'), key:fd.get('key'), keywords:String(fd.get('keywords')||'').split(',').map(x=>x.trim()).filter(Boolean), answer:fd.get('answer')}; try{ await api('/api/app/ai-assistant/faqs',{method:'POST',body:JSON.stringify(body)}); e.target.reset(); e.target.classList.add('hidden'); await load(); toast('FAQ saqlandi'); }catch(err){toast(err.message)} };
load().catch(e=>toast(e.message));
