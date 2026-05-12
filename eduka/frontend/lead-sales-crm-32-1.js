
(() => {
  const VERSION = '32.1.0';
  const API = '/api/app/sales32';
  const SALES_ROUTES = new Set(['/admin/leads','/admin/demo-lessons','/admin/sales','/admin/sales-crm']);
  const state = { data:null, search:'', source:'', status:'' };
  const fmt = new Intl.NumberFormat('uz-UZ');
  const esc = (v) => String(v ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  function route(){ return window.location.pathname.replace(/\/$/,'') || '/admin/leads'; }
  function token(){ return localStorage.getItem('eduka_token') || localStorage.getItem('token') || ''; }
  async function api(path, opts={}){
    const headers = Object.assign({'Content-Type':'application/json'}, opts.headers || {});
    const t = token(); if(t) headers.Authorization = `Bearer ${t}`;
    const res = await fetch(path, Object.assign({}, opts, {headers}));
    const type = res.headers.get('content-type') || '';
    const data = type.includes('json') ? await res.json().catch(()=>({})) : await res.text();
    if(!res.ok) throw new Error((data && data.message) || `HTTP ${res.status}`);
    return data;
  }
  function ensureShell(){
    document.body.classList.add('eduka-sales-pro');
    let main = document.querySelector('main.main') || document.querySelector('[data-main]') || document.querySelector('#app') || document.body;
    let view = document.querySelector('#sales-pro-root');
    if(!view){
      view = document.createElement('section'); view.id='sales-pro-root'; view.className='view sales-pro-active';
      main.prepend(view);
    }
    return view;
  }
  function kpis(data){
    const s = data.summary || {};
    return [
      ['Jami leadlar', s.total_leads || 0, 'Sales bazasi'],
      ['Issiq leadlar', s.hot_leads || 0, 'Demo yoki to‘lovga yaqin'],
      ['Demo darslar', s.demo_lessons || 0, 'Rejalashtirilgan'],
      ['Konversiya', `${s.conversion_rate || 0}%`, 'Lead → student'],
      ['Bugungi follow-up', s.followups_today || 0, 'Shoshilinch vazifalar']
    ].map(([a,b,c])=>`<article class="sales-kpi"><span>${a}</span><strong>${esc(b)}</strong><small>${c}</small></article>`).join('');
  }
  const statusLabel = {new:'Yangi', contacted:'Bog‘lanildi', interested:'Qiziqmoqda', demo:'Demo', paid:'To‘lov qildi', student:'Student', lost:'Yo‘qotildi'};
  function leadCard(l){
    return `<article class="lead-card" data-lead-id="${l.id}"><b>${esc(l.full_name || l.name || 'Nomsiz lead')}</b><p>${esc(l.phone || 'Telefon kiritilmagan')}</p><div class="lead-meta"><span class="lead-chip">${esc(l.course_name || 'Kurs belgilanmagan')}</span><span class="lead-chip">${esc(l.source || 'Manba yo‘q')}</span><span class="lead-chip">${esc(l.students_count || '')} ${l.students_count?'o‘quvchi':''}</span></div><p>${esc(l.note || 'Izoh yo‘q')}</p><div class="lead-actions"><button data-action="profile" data-id="${l.id}">Profil</button><button data-action="demo" data-id="${l.id}">Demo</button><button data-action="next" data-id="${l.id}">Keyingi</button><button data-action="convert" data-id="${l.id}">Studentga aylantirish</button></div></article>`;
  }
  function board(data){
    const statuses = ['new','contacted','interested','demo','paid'];
    const leads = data.leads || [];
    return `<div class="sales-board">${statuses.map(st=>{
      const arr = leads.filter(l => (l.status || 'new') === st);
      return `<section class="sales-column"><div class="sales-column-title"><span>${statusLabel[st]}</span><span>${arr.length}</span></div>${arr.length?arr.map(leadCard).join(''):'<div class="sales-empty">Bu bosqichda lead yo‘q</div>'}</section>`
    }).join('')}</div>`;
  }
  function table(data){
    const rows = (data.leads || []).map(l => `<div class="sales-row"><div><b>${esc(l.full_name || l.name)}</b><br><small>${esc(l.phone || '')}</small></div><div>${esc(l.course_name || '-')}</div><div><span class="sales-status ${esc(l.status||'new')}">${esc(statusLabel[l.status] || l.status || 'Yangi')}</span></div><div>${esc(l.source || '-')}</div><div>${esc(l.manager_name || '-')}</div><div class="lead-actions"><button data-action="profile" data-id="${l.id}">Ochish</button></div></div>`).join('');
    return `<div class="sales-table"><div class="sales-row header"><b>Lead</b><b>Kurs</b><b>Status</b><b>Manba</b><b>Manager</b><b>Amal</b></div>${rows || '<div class="sales-empty">Leadlar topilmadi</div>'}</div>`;
  }
  function tasks(data){
    const items = (data.followups || []).slice(0,8);
    return `<div class="sales-timeline">${items.length?items.map(t=>`<div class="sales-task"><span class="sales-dot"></span><div><b>${esc(t.title || 'Follow-up')}</b><br><small>${esc(t.lead_name || '')} · ${esc(t.due_at || '')}</small></div><button class="sales-btn ghost" data-action="done-task" data-id="${t.id}">OK</button></div>`).join(''):'<div class="sales-empty">Bugun follow-up yo‘q</div>'}</div>`;
  }
  function render(){
    const root = ensureShell(); const data = state.data || {summary:{},leads:[],followups:[]};
    root.innerHTML = `<div class="sales-pro-shell"><div class="sales-pro-wrap"><section class="sales-hero"><div><span>Eduka Sales CRM Pro · ${VERSION}</span><h1>Leadlardan studentgacha bo‘lgan jarayon bitta panelda</h1><p>Instagram, Telegram, qo‘ng‘iroq va walk-in leadlarni yo‘qotmaymiz. Demo dars, follow-up, manager performance va leadni studentga aylantirish oqimi tayyor.</p><div class="sales-hero-actions"><button class="sales-btn" data-open-lead>Lead qo‘shish</button><button class="sales-btn secondary" data-refresh>Yangilash</button><button class="sales-btn secondary" data-export>Export</button></div></div><div class="sales-hero-card"><span>Bugungi holat</span><strong>${esc((data.summary||{}).new_today || 0)}</strong><p>Bugun kelgan yangi leadlar. Issiq leadlarni demo darsga tezroq yozing.</p></div></section><section class="sales-kpis">${kpis(data)}</section><section class="sales-card"><div class="sales-card-head"><h2>Sales pipeline</h2><div class="sales-filter"><input data-sales-search placeholder="Lead, telefon, kurs qidirish" value="${esc(state.search)}"><select data-sales-status><option value="">Barcha status</option>${Object.entries(statusLabel).map(([k,v])=>`<option value="${k}" ${state.status===k?'selected':''}>${v}</option>`).join('')}</select><select data-sales-source><option value="">Barcha manba</option><option>Instagram</option><option>Telegram</option><option>Qo‘ng‘iroq</option><option>Walk-in</option><option>Referral</option></select></div></div>${board(data)}</section><section class="sales-layout"><article class="sales-card"><div class="sales-card-head"><h2>Leadlar jadvali</h2><button class="sales-btn ghost" data-export>CSV</button></div>${table(data)}</article><aside class="sales-card"><div class="sales-card-head"><h2>Follow-up va demo</h2><button class="sales-btn ghost" data-open-task>Task</button></div>${tasks(data)}</aside></section></div></div><div class="sales-drawer-backdrop" data-sales-backdrop></div><aside class="sales-drawer" data-sales-drawer></aside><div class="sales-toast" data-sales-toast></div>`;
  }
  function toast(msg){ const el=document.querySelector('[data-sales-toast]'); if(!el) return; el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),3000); }
  function openLead(data={}){
    const drawer=document.querySelector('[data-sales-drawer]'), bg=document.querySelector('[data-sales-backdrop]');
    drawer.innerHTML=`<div class="sales-drawer-head"><h2>${data.id?'Leadni tahrirlash':'Yangi lead'}</h2><button class="sales-btn ghost" data-close-drawer>Yopish</button></div><form class="sales-drawer-body" data-lead-form><label>Ism-familiya<input name="full_name" required value="${esc(data.full_name||'')}"></label><label>Telefon<input name="phone" required value="${esc(data.phone||'')}"></label><label>Qiziqqan kurs<input name="course_name" value="${esc(data.course_name||'')}"></label><label>Manba<select name="source"><option>Instagram</option><option>Telegram</option><option>Qo‘ng‘iroq</option><option>Walk-in</option><option>Referral</option></select></label><label>Status<select name="status">${Object.entries(statusLabel).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label><label>Manager<input name="manager_name" value="${esc(data.manager_name||'')}"></label><label>Talabalar soni<input name="students_count" type="number" value="${esc(data.students_count||'')}"></label><label>Izoh<textarea name="note" rows="4">${esc(data.note||'')}</textarea></label><button class="sales-btn dark" type="submit">Saqlash</button></form>`;
    drawer.classList.add('active'); bg.classList.add('active');
  }
  function closeDrawer(){ document.querySelector('[data-sales-drawer]')?.classList.remove('active'); document.querySelector('[data-sales-backdrop]')?.classList.remove('active'); }
  async function load(){
    try{ state.data = await api(`${API}/dashboard?search=${encodeURIComponent(state.search)}&status=${encodeURIComponent(state.status)}&source=${encodeURIComponent(state.source)}`); render(); }
    catch(e){ const root=ensureShell(); root.innerHTML=`<div class="sales-pro-shell"><div class="sales-empty">Sales CRM yuklanmadi: ${esc(e.message)}</div></div>`; }
  }
  async function saveLead(form){ const body=Object.fromEntries(new FormData(form).entries()); body.students_count = Number(body.students_count||0) || null; await api(`${API}/leads`, {method:'POST', body:JSON.stringify(body)}); closeDrawer(); toast('Lead saqlandi'); load(); }
  async function action(btn){
    const id=btn.dataset.id, type=btn.dataset.action;
    if(type==='next'){ await api(`${API}/leads/${id}/next`, {method:'POST'}); toast('Status yangilandi'); load(); }
    if(type==='convert'){ await api(`${API}/leads/${id}/convert`, {method:'POST'}); toast('Lead studentga aylantirildi'); load(); }
    if(type==='demo'){ await api(`${API}/leads/${id}/demo`, {method:'POST', body:JSON.stringify({})}); toast('Demo dars yaratildi'); load(); }
    if(type==='profile'){ toast('Lead profili keyingi patchda chuqurlashtiriladi'); }
    if(type==='done-task'){ await api(`${API}/tasks/${id}/done`, {method:'POST'}); toast('Task yopildi'); load(); }
  }
  function bind(){
    document.addEventListener('click', e=>{
      if(e.target.closest('[data-open-lead]')) openLead();
      if(e.target.closest('[data-close-drawer]') || e.target.matches('[data-sales-backdrop]')) closeDrawer();
      if(e.target.closest('[data-refresh]')) load();
      if(e.target.closest('[data-export]')) window.open(`${API}/export?type=leads`, '_blank');
      const btn=e.target.closest('[data-action]'); if(btn) action(btn).catch(err=>toast(err.message));
    });
    document.addEventListener('submit', e=>{ if(e.target.matches('[data-lead-form]')){ e.preventDefault(); saveLead(e.target).catch(err=>toast(err.message)); } });
    document.addEventListener('input', e=>{ if(e.target.matches('[data-sales-search]')){ state.search=e.target.value; clearTimeout(window.__salesSearch); window.__salesSearch=setTimeout(load,450);} });
    document.addEventListener('change', e=>{ if(e.target.matches('[data-sales-status]')){ state.status=e.target.value; load(); } if(e.target.matches('[data-sales-source]')){ state.source=e.target.value; load(); } });
  }
  function init(){ if(!SALES_ROUTES.has(route())) return; bind(); render(); load(); }
  window.EdukaSalesCrm321 = { init, load };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
