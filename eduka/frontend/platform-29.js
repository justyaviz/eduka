(function(){
  const state={data:null};
  const money=(v)=>`${Number(v||0).toLocaleString('uz-UZ')} so'm`;
  const api=async(url,opts={})=>{const r=await fetch(url,{credentials:'include',headers:{'Content-Type':'application/json'},...opts}); const type=r.headers.get('content-type')||''; const data=type.includes('json')?await r.json():await r.text(); if(!r.ok) throw new Error(data?.message||data||'API xato'); return data;};
  function mount(){
    const path=location.pathname;
    const isApp=path.startsWith('/admin/')||path.startsWith('/ceo/');
    if(!isApp) return;
    if(!['/admin/ui-final','/admin/reports-export','/admin/payment-providers','/admin/launch-check','/ceo/launch','/ceo/monetization-final','/ceo/reports-export'].includes(path)) return;
    document.body.innerHTML='<div id="p29" class="p29-shell"><div class="p29-wrap"><div class="p29-empty">Eduka 29.0 yuklanmoqda...</div></div></div>';
    if(path.includes('ui-final')) renderAdminUi();
    else if(path.includes('payment-providers')) renderPaymentProviders();
    else if(path.includes('monetization-final')) renderCeoMonetization();
    else if(path.includes('reports-export')) renderReports();
    else renderLaunch();
  }
  function shell(title,subtitle,actions='',body=''){
    document.getElementById('p29').innerHTML=`<div class="p29-wrap"><section class="p29-hero"><div><span class="p29-kicker">Eduka 29.0 Public Launch</span><h1>${title}</h1><p>${subtitle}</p></div><div class="p29-actions">${actions}<a class="p29-btn secondary" href="/admin/dashboard">Admin</a><a class="p29-btn secondary" href="/ceo/dashboard">CEO</a></div></section>${body}<p class="p29-footer-note">Stable SaaS, demo disabled, launch docs, reports, payment providers va UI integration final.</p></div>`;
  }
  async function renderAdminUi(){
    shell('Admin CRM Real UI Integration','Talaba, guruh, o‘qituvchi, to‘lov, davomat, QR/chek va export jarayonlari uchun professional UI monitoring.','<button class="p29-btn" id="p29Refresh">Yangilash</button>', '<div class="p29-grid" id="p29Metrics"></div><section class="p29-section"><h2>UI komponentlar</h2><div class="p29-list" id="p29Components"></div></section>');
    document.getElementById('p29Refresh').onclick=renderAdminUi;
    try{const res=await api('/api/ui28/admin-crm'); const d=res.data; document.getElementById('p29Metrics').innerHTML=[['Talabalar',d.students],['O‘qituvchilar',d.teachers],['Guruhlar',d.groups],['Tushum',money(d.revenue)],['Davomat',`${d.attendance_rate}%`]].map(x=>`<article class="p29-card"><h3>${x[0]}</h3><div class="p29-metric">${x[1]}</div><p>Real database asosida.</p></article>`).join(''); document.getElementById('p29Components').innerHTML=d.components.map(c=>`<div class="p29-check"><span class="p29-icon">✓</span><b>${c}</b><span class="p29-pill ok">ready</span></div>`).join('');}catch(e){document.getElementById('p29Metrics').innerHTML=`<div class="p29-empty">${e.message}</div>`}
  }
  async function renderReports(){
    shell('Full Reports & Export','Finance, qarzdorlar va davomat bo‘yicha CSV/Excelga mos export.', '<a class="p29-btn" href="/api/app/reports281/export?type=finance">Finance CSV</a><a class="p29-btn secondary" href="/api/app/reports281/export?type=debtors">Qarzdorlar CSV</a><a class="p29-btn secondary" href="/api/app/reports281/export?type=attendance">Davomat CSV</a>', '<div class="p29-grid"><article class="p29-card"><h3>Finance report</h3><p>To‘lovlar, status va receipt export.</p></article><article class="p29-card"><h3>Debtors report</h3><p>Qarzdor talabalar ro‘yxati.</p></article><article class="p29-card"><h3>Attendance report</h3><p>Statuslar bo‘yicha davomat.</p></article><article class="p29-card"><h3>CEO analytics</h3><p>Platform analytics poydevori.</p></article></div>');
  }
  async function renderPaymentProviders(){
    shell('Payment Providers Real Integration','Click, Payme, Uzum, Alif va Paynet uchun test checkout/webhook poydevori.', '<button class="p29-btn" id="testCheckout">Test checkout</button>', '<div class="p29-grid">'+['click','payme','uzum','alif','paynet'].map(p=>`<article class="p29-card"><h3>${p.toUpperCase()}</h3><p>Webhook, checkout, status mapping tayyor.</p><span class="p29-pill warn">setup required</span></article>`).join('')+'</div><section class="p29-section"><h2>Natija</h2><div id="checkoutResult" class="p29-empty">Test checkout bosilmagan.</div></section>');
    document.getElementById('testCheckout').onclick=async()=>{try{const r=await api('/api/app/payment-providers/checkout',{method:'POST',body:JSON.stringify({provider:'click',amount:1000})});document.getElementById('checkoutResult').innerHTML=`Invoice: <b>${r.invoice.invoice_no}</b><br>URL: ${r.payment_url}`;}catch(e){document.getElementById('checkoutResult').textContent=e.message}};
  }
  async function renderCeoMonetization(){
    shell('CEO SaaS Monetization Final','Tariflar, markazlar, invoice, feature flags va obuna boshqaruvi.', '<button class="p29-btn" id="ceoReload">Yangilash</button>', '<div class="p29-grid" id="ceoCards"></div><section class="p29-section"><h2>Tariflar</h2><div class="p29-table" id="planTable"></div></section>');
    document.getElementById('ceoReload').onclick=renderCeoMonetization;
    try{const r=await api('/api/super/ui28/monetization'); const c=r.data.centers; document.getElementById('ceoCards').innerHTML=[['Markazlar',c.total],['Aktiv',c.active],['Bloklangan',c.blocked],['Invoice',r.data.invoices.count]].map(x=>`<article class="p29-card"><h3>${x[0]}</h3><div class="p29-metric">${x[1]||0}</div></article>`).join(''); document.getElementById('planTable').innerHTML='<div class="p29-row head"><span>Kod</span><span>Nomi</span><span>Narx</span><span>Status</span><span>Feature</span></div>'+r.data.plans.map(p=>`<div class="p29-row"><b>${p.code}</b><span>${p.name}</span><span>${money(p.monthly_price)}</span><span class="p29-pill ok">${p.status}</span><span>${Object.keys(p.features||{}).length} feature</span></div>`).join('');}catch(e){document.getElementById('ceoCards').innerHTML=`<div class="p29-empty">${e.message}</div>`}
  }
  async function renderLaunch(){
    shell('Public Launch Readiness','Stable SaaS, demo disabled, clean production, docs va deployment guide tayyorligi.', '<button class="p29-btn" id="launchReload">Tekshirish</button><button class="p29-btn secondary" id="safeCleanup">Safe cleanup</button>', '<div class="p29-list" id="launchChecks"></div><section class="p29-section"><h2>Launch docs</h2><div class="p29-grid" id="launchDocs"></div></section>');
    document.getElementById('launchReload').onclick=renderLaunch;
    document.getElementById('safeCleanup').onclick=async()=>{await api('/api/production/cleanup29',{method:'POST',body:JSON.stringify({mode:'safe'})}); renderLaunch();};
    try{const r=await api('/api/production/audit29'); document.getElementById('launchChecks').innerHTML=r.checks.map(x=>`<div class="p29-check"><span class="p29-icon">${x.status==='ready'?'✓':'!'}</span><b>${x.label}</b><span class="p29-pill ${x.status==='ready'?'ok':x.status==='manual_check'?'warn':'bad'}">${x.status}</span></div>`).join(''); document.getElementById('launchDocs').innerHTML=r.docs.map(d=>`<article class="p29-card"><h3>${d.title}</h3><p>${d.slug}</p><a class="p29-btn secondary" href="/api/docs/launch/${d.slug}" target="_blank">Ochish</a></article>`).join('');}catch(e){document.getElementById('launchChecks').innerHTML=`<div class="p29-empty">${e.message}</div>`}
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
})();
