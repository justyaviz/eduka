// Eduka 30.5.0 — CRM Real Workflow & UX Final
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const money = (v) => `${Number(v || 0).toLocaleString('uz-UZ')} so'm`;
  const fmt = (v) => v ? String(v).slice(0,10) : '-';
  const apiCall = async (path, options={}) => {
    if (typeof window.api === 'function') return window.api(path, options);
    const res = await fetch(path, { credentials:'same-origin', headers:{ 'Content-Type':'application/json' }, ...options });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(data.message || 'So\'rov bajarilmadi');
    return data;
  };
  const toast = (msg, type='info') => typeof window.showToast === 'function' ? window.showToast(msg, type) : console.log(type, msg);
  const badge = (v) => `<span class="crm305-badge ${String(v||'').toLowerCase()}">${label(v)}</span>`;
  const label = (v) => ({active:'Faol', archived:'Arxiv', debtor:'Qarzdor', paid:'To\'langan', partial:'Qisman', debt:'Qarzdor', cancelled:'Bekor qilingan', present:'Keldi', absent:'Kelmadi', late:'Kech qoldi', excused:'Sababli'}[String(v||'').toLowerCase()] || (v || '-'));
  const initials = (name='') => name.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase() || 'ED';
  const viewIds = ['dashboard','students','teachers','groups','finance','attendance'];
  function activeView(){ return $('.view.active')?.id || null; }
  function ensureDrawer(){
    let d = $('.crm305-profile-drawer');
    if(!d){
      d = document.createElement('div'); d.className='crm305-profile-drawer';
      d.innerHTML = `<div class="crm305-backdrop" data-crm305-close></div><aside class="crm305-drawer-card"><div class="crm305-drawer-head"><h2 data-crm305-title>Profil</h2><button class="crm305-close" data-crm305-close>Yopish</button></div><div data-crm305-body></div></aside>`;
      document.body.appendChild(d);
      d.addEventListener('click', e => { if(e.target.matches('[data-crm305-close]')) d.classList.remove('open'); });
    }
    return d;
  }
  function openDrawer(title, html){ const d=ensureDrawer(); $('[data-crm305-title]',d).textContent=title; $('[data-crm305-body]',d).innerHTML=html; d.classList.add('open'); }
  function mountTop(view, html){
    const node = document.getElementById(view); if(!node) return;
    let holder = $('[data-crm305-mount]', node);
    if(!holder){ holder = document.createElement('div'); holder.setAttribute('data-crm305-mount',''); node.prepend(holder); }
    holder.innerHTML = html;
  }
  async function renderDashboard(){
    try{
      const data = await apiCall('/api/app/crm30/overview'); const k=data.kpi||{};
      mountTop('dashboard', `<div class="crm305-shell"><section class="crm305-hero"><div><h2>CRM Real Workflow Dashboard</h2><p>Bugungi dars, to'lov, davomat va qarzdorlik nazorati.</p></div><div class="crm305-actions"><button class="crm305-btn" data-view="students">Talaba qo'shish</button><button class="crm305-btn secondary" data-crm305-export="payments">To'lov export</button></div></section><div class="crm305-kpis"><article><span>Talabalar</span><strong>${k.students||0}</strong><small>faol</small></article><article><span>Guruhlar</span><strong>${k.groups||0}</strong><small>faol guruh</small></article><article><span>Bugungi to'lov</span><strong>${money(k.today_payments)}</strong><small>${k.today_payment_count||0} ta to'lov</small></article><article><span>Qarzdorlar</span><strong>${k.debtors||0}</strong><small>${money(k.debt_total)}</small></article><article><span>Davomat</span><strong>${k.attendance_rate||0}%</strong><small>${k.attendance_came||0}/${k.attendance_total||0}</small></article><article><span>Bugungi darslar</span><strong>${(data.today_lessons||[]).length}</strong><small>jadval</small></article></div></div>`);
    }catch(e){ mountTop('dashboard', `<div class="crm305-panel"><div class="crm305-empty">Dashboard yuklanmadi: ${e.message}</div></div>`); }
  }
  async function renderStudents(){
    const node = document.getElementById('students'); if(!node) return;
    mountTop('students', `<div class="crm305-shell"><section class="crm305-hero"><div><h2>Talabalar Pro</h2><p>Profil, guruh, to'lov, davomat, qarzdorlik va Student App statusi bir joyda.</p></div><div class="crm305-actions"><button class="crm305-btn" data-open-modal="students">Yangi talaba</button><button class="crm305-btn secondary" data-crm305-export="students">Excel/CSV</button><button class="crm305-btn secondary" data-crm305-recalc>Qarzdorlikni hisoblash</button></div></section><section class="crm305-panel"><div class="crm305-panel-head"><h3>Tezkor qidiruv</h3><span class="crm305-badge">Real workflow</span></div><div class="crm305-filterbar"><input class="crm305-input" data-crm305-search placeholder="Ism, telefon, guruh..."/><select class="crm305-select" data-crm305-status><option value="">Barcha status</option><option value="active">Faol</option><option value="debtor">Qarzdor</option><option value="archived">Arxiv</option></select></div><div data-crm305-results class="crm305-loading">Qidiruv uchun matn yozing yoki eski ro'yxatdan profilni oching.</div></section></div>`);
  }
  async function runSearch(q){
    const box = $('[data-crm305-results]'); if(!box) return;
    if(!q) { box.innerHTML='<div class="crm305-empty">Talaba, telefon yoki guruh nomini yozing.</div>'; return; }
    box.innerHTML='<div class="crm305-loading">Qidirilmoqda...</div>';
    try{
      const data = await apiCall(`/api/app/crm30/search?q=${encodeURIComponent(q)}`);
      const students = data.students || [];
      box.innerHTML = students.length ? `<table class="crm305-table"><thead><tr><th>Talaba</th><th>Telefon</th><th>Kurs</th><th>Balans</th><th>Status</th><th></th></tr></thead><tbody>${students.map(s=>`<tr><td><b>${s.full_name||'-'}</b></td><td>${s.phone||'-'}</td><td>${s.course_name||'-'}</td><td>${money(s.balance)}</td><td>${badge(s.status)}</td><td><button class="crm305-btn secondary" data-crm305-student="${s.id}">Profil</button></td></tr>`).join('')}</tbody></table>` : '<div class="crm305-empty">Natija topilmadi</div>';
    }catch(e){ box.innerHTML=`<div class="crm305-empty">Xato: ${e.message}</div>`; }
  }
  async function openStudentProfile(id){
    openDrawer('Talaba profili', '<div class="crm305-loading">Profil yuklanmoqda...</div>');
    try{
      const data = await apiCall(`/api/app/crm305/students/${id}/profile`); const s=data.student||{}; const sum=data.summary||{};
      openDrawer(s.full_name || 'Talaba profili', `<div class="crm305-profile-card"><div class="crm305-profile-top"><div class="crm305-avatar">${s.avatar_url?`<img src="${s.avatar_url}"/>`:initials(s.full_name)}</div><div><h2>${s.full_name||'-'}</h2><p>${s.phone||'-'} · ${s.course_name||'-'}</p><p>${badge(s.status)} ${sum.telegram_linked?'<span class="crm305-badge active">Telegram ulangan</span>':'<span class="crm305-badge">Telegram ulanmagan</span>'}</p></div></div></div><div class="crm305-kpis"><article><span>Qarzdorlik</span><strong>${money(sum.debt)}</strong></article><article><span>Davomat</span><strong>${sum.attendance_rate||0}%</strong></article><article><span>Guruhlar</span><strong>${sum.groups_count||0}</strong></article><article><span>To'lovlar</span><strong>${sum.payments_count||0}</strong></article></div><div class="crm305-profile-card"><h3>Amallar</h3><div class="crm305-actions"><button class="crm305-btn" data-crm305-reset-app="${s.id}">Student App kod</button><button class="crm305-btn secondary" data-crm305-assign="${s.id}">Guruhga biriktirish</button><button class="crm305-btn danger" data-crm305-archive="${s.id}">Arxiv</button></div></div><div class="crm305-grid2"><section class="crm305-profile-card"><h3>Guruhlar tarixi</h3>${(data.groups||[]).length?(data.groups||[]).map(g=>`<div class="crm305-time"><span class="crm305-dot"></span><div><b>${g.name||'-'}</b><p>${fmt(g.joined_at)} · ${money(g.monthly_price)}</p><button class="crm305-btn secondary" data-crm305-remove-group="${s.id}:${g.group_id}">Guruhdan chiqarish</button></div></div>`).join(''):'<p class="crm305-empty">Guruh yo\'q</p>'}</section><section class="crm305-profile-card"><h3>To'lovlar tarixi</h3>${(data.payments||[]).slice(0,8).map(p=>`<div class="crm305-time"><span class="crm305-dot"></span><div><b>${money(p.amount||p.paid_amount)}</b><p>${fmt(p.payment_date||p.paid_at)} · ${p.payment_type||'-'} · ${badge(p.status)}</p><button class="crm305-btn secondary" data-crm305-receipt="${p.id}">Chek</button></div></div>`).join('')||'<p class="crm305-empty">To\'lov yo\'q</p>'}</section></div><section class="crm305-profile-card"><h3>Davomat tarixi</h3>${(data.attendance||[]).slice(0,12).map(a=>`<div class="crm305-time"><span class="crm305-dot"></span><div><b>${fmt(a.lesson_date)} — ${label(a.status)}</b><p>${a.group_name||''} ${a.note||''}</p></div></div>`).join('')||'<p class="crm305-empty">Davomat yo\'q</p>'}</section><section class="crm305-profile-card"><h3>Timeline</h3><div class="crm305-timeline">${(data.timeline||[]).slice(0,10).map(t=>`<div class="crm305-time"><span class="crm305-dot"></span><div><b>${t.action}</b><p>${fmt(t.created_at)} · ${t.entity||''}</p></div></div>`).join('')||'<p class="crm305-empty">Timeline bo\'sh</p>'}</div></section>`);
    }catch(e){ openDrawer('Talaba profili', `<div class="crm305-empty">Profil ochilmadi: ${e.message}</div>`); }
  }
  async function renderTeachers(){
    mountTop('teachers', `<div class="crm305-shell"><section class="crm305-hero"><div><h2>O'qituvchilar Pro</h2><p>Profil, guruhlar, jadval, davomat va oylik poydevori.</p></div><div class="crm305-actions"><button class="crm305-btn" data-open-modal="teachers">Yangi o'qituvchi</button></div></section><section class="crm305-panel"><div class="crm305-panel-head"><h3>O'qituvchi profillari</h3><span class="crm305-badge">/api/app/crm30/teachers/:id/profile</span></div><div class="crm305-empty">Eski jadvaldagi amallar orqali profilni oching. Keyingi patchda full table almashtiriladi.</div></section></div>`);
  }
  async function renderGroups(){
    mountTop('groups', `<div class="crm305-shell"><section class="crm305-hero"><div><h2>Guruhlar Pro</h2><p>Talabalar, jadval, oylik narx, davomat va moliya summary.</p></div><div class="crm305-actions"><button class="crm305-btn" data-open-modal="groups">Yangi guruh</button><button class="crm305-btn secondary" data-crm305-export="attendance">Davomat export</button></div></section><section class="crm305-panel"><div class="crm305-panel-head"><h3>Guruh workflow</h3><span class="crm305-badge">Dars jadvali + davomat</span></div><div class="crm305-empty">Guruh ro'yxatidan profilni ochib talabalar, to'lov va davomatni ko'ring.</div></section></div>`);
  }
  async function renderFinance(){
    mountTop('finance', `<div class="crm305-shell"><section class="crm305-hero"><div><h2>To'lovlar Pro</h2><p>Qarzdorlik, chek/QR, bekor qilish, Telegram status va export.</p></div><div class="crm305-actions"><button class="crm305-btn" data-open-modal="payments">To'lov qo'shish</button><button class="crm305-btn secondary" data-crm305-export="payments">Excel/CSV</button><button class="crm305-btn secondary" data-crm305-recalc>Qarzdorlikni qayta hisoblash</button></div></section><section class="crm305-panel"><div class="crm305-panel-head"><h3>Chek / QR</h3><span class="crm305-badge">Thermal receipt</span></div><div class="crm305-filterbar"><input class="crm305-input" data-crm305-receipt-id placeholder="To'lov ID kiriting"/><button class="crm305-btn" data-crm305-open-receipt>Chekni ochish</button></div><div data-crm305-receipt-preview></div></section></div>`);
  }
  async function renderAttendance(){
    try{
      const data = await apiCall('/api/app/crm30/attendance/today'); const groups=data.groups||[];
      mountTop('attendance', `<div class="crm305-shell"><section class="crm305-hero"><div><h2>Davomat Pro</h2><p>Guruhni tanlang, bir bosishda Keldi/Kelmadi/Kech qoldi/Sababli belgilang.</p></div><div class="crm305-actions"><button class="crm305-btn good" data-crm305-mark-all>Hammasi keldi</button><button class="crm305-btn" data-crm305-save-attendance>Saqlash</button></div></section><section class="crm305-panel"><div class="crm305-panel-head"><h3>Bugungi guruhlar</h3><span class="crm305-badge">${groups.length} ta</span></div><div class="crm305-filterbar"><select class="crm305-select" data-crm305-att-group><option value="">Guruh tanlang</option>${groups.map(g=>`<option value="${g.id}">${g.name||g.course_name||'Guruh'} · ${g.start_time||''}</option>`).join('')}</select><input class="crm305-input" type="date" data-crm305-att-date value="${data.date||new Date().toISOString().slice(0,10)}"/></div><div class="crm305-attendance-list" data-crm305-att-list><div class="crm305-empty">Guruh tanlang</div></div></section></div>`);
    }catch(e){ mountTop('attendance', `<div class="crm305-empty">Davomat yuklanmadi: ${e.message}</div>`); }
  }
  async function loadAttendanceStudents(){
    const groupId = $('[data-crm305-att-group]')?.value; const date = $('[data-crm305-att-date]')?.value || new Date().toISOString().slice(0,10); const list=$('[data-crm305-att-list]'); if(!groupId||!list) return;
    list.innerHTML='<div class="crm305-loading">Talabalar yuklanmoqda...</div>';
    try{ const data=await apiCall(`/api/app/crm305/attendance/groups/${groupId}/students?date=${date}`); list.innerHTML=(data.students||[]).map(s=>`<div class="crm305-att-row" data-student-id="${s.id}"><b>${s.full_name}</b>${['present','absent','late','excused'].map(st=>`<button type="button" data-status="${st}" class="${s.attendance_status===st?'active':''}">${label(st)}</button>`).join('')}</div>`).join('')||'<div class="crm305-empty">Talaba yo\'q</div>'; }catch(e){ list.innerHTML=`<div class="crm305-empty">Xato: ${e.message}</div>`; }
  }
  async function saveAttendance(){
    const groupId = $('[data-crm305-att-group]')?.value; const date = $('[data-crm305-att-date]')?.value; if(!groupId) return toast('Guruh tanlang','error');
    const records = $$('.crm305-att-row').map(row=>({ student_id: Number(row.dataset.studentId), status: row.querySelector('button.active')?.dataset.status || 'present' }));
    try{ await apiCall('/api/app/crm30/attendance/save',{ method:'POST', body: JSON.stringify({ group_id:Number(groupId), lesson_date:date, records }) }); toast('Davomat saqlandi','success'); }catch(e){ toast(e.message,'error'); }
  }
  async function openReceipt(id){
    const target = $('[data-crm305-receipt-preview]'); if(target) target.innerHTML='<div class="crm305-loading">Chek yuklanmoqda...</div>';
    try{ const data=await apiCall(`/api/app/crm305/payments/${id}/receipt-pro`); const r=data.receipt||{}; const html=`<div class="crm305-profile-card"><h3>Thermal chek</h3><pre>${(data.thermal||[]).join('\n')}</pre><p><b>QR:</b> ${data.qr_payload}</p><div class="crm305-actions"><button class="crm305-btn secondary" onclick="window.print()">Print</button><button class="crm305-btn danger" data-crm305-cancel-payment="${id}">Bekor qilish</button></div></div>`; target?target.innerHTML=html:openDrawer('Chek',html); }catch(e){ if(target) target.innerHTML=`<div class="crm305-empty">${e.message}</div>`; else toast(e.message,'error'); }
  }
  async function recalc(){ try{ const data=await apiCall('/api/app/crm305/debt-engine/recalculate',{method:'POST', body:'{}'}); toast(`${data.count} ta talaba qarzdorligi hisoblandi`,'success'); }catch(e){ toast(e.message,'error'); } }
  function renderActive(){ const v=activeView(); if(!viewIds.includes(v)) return; if(v==='dashboard') renderDashboard(); if(v==='students') renderStudents(); if(v==='teachers') renderTeachers(); if(v==='groups') renderGroups(); if(v==='finance') renderFinance(); if(v==='attendance') renderAttendance(); }
  document.addEventListener('click', async (e)=>{
    const st=e.target.closest('[data-crm305-student]'); if(st) return openStudentProfile(st.dataset.crm305Student);
    if(e.target.matches('[data-crm305-export]')) window.location.href=`/api/app/crm305/export?type=${e.target.dataset.crm305Export}`;
    if(e.target.matches('[data-crm305-recalc]')) return recalc();
    if(e.target.matches('[data-crm305-open-receipt]')) return openReceipt($('[data-crm305-receipt-id]')?.value);
    if(e.target.matches('[data-crm305-reset-app]')) { const d=await apiCall(`/api/app/crm305/students/${e.target.dataset.crm305ResetApp}/app-reset`,{method:'POST',body:'{}'}); return toast(`Kod: ${d.temporary_code}`,'success'); }
    if(e.target.matches('[data-crm305-archive]')) { await apiCall(`/api/app/crm305/students/${e.target.dataset.crm305Archive}/archive`,{method:'POST',body:'{}'}); toast('Arxivga o\'tkazildi','success'); }
    if(e.target.matches('[data-crm305-assign]')) { const groupId=prompt('Guruh ID kiriting'); if(groupId){ await apiCall(`/api/app/crm305/students/${e.target.dataset.crm305Assign}/groups`,{method:'POST',body:JSON.stringify({group_id:Number(groupId)})}); toast('Guruhga biriktirildi','success'); openStudentProfile(e.target.dataset.crm305Assign); } }
    if(e.target.matches('[data-crm305-remove-group]')) { const [sid,gid]=e.target.dataset.crm305RemoveGroup.split(':'); await apiCall(`/api/app/crm305/students/${sid}/groups/${gid}`,{method:'DELETE'}); toast('Guruhdan chiqarildi','success'); openStudentProfile(sid); }
    if(e.target.matches('[data-status]')) { const row=e.target.closest('.crm305-att-row'); $$('button',row).forEach(b=>b.classList.remove('active')); e.target.classList.add('active'); }
    if(e.target.matches('[data-crm305-mark-all]')) { $$('[data-status="present"]').forEach(btn=>{ const row=btn.closest('.crm305-att-row'); $$('button',row).forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }); }
    if(e.target.matches('[data-crm305-save-attendance]')) return saveAttendance();
    if(e.target.matches('[data-crm305-cancel-payment]')) { const reason=prompt('Bekor qilish sababi','Xatolik sababli'); if(reason){ await apiCall(`/api/app/crm305/payments/${e.target.dataset.crm305CancelPayment}/cancel`,{method:'POST',body:JSON.stringify({reason})}); toast('To\'lov bekor qilindi','success'); } }
  });
  document.addEventListener('input', (e)=>{ if(e.target.matches('[data-crm305-search]')) { clearTimeout(window.__crm305SearchTimer); window.__crm305SearchTimer=setTimeout(()=>runSearch(e.target.value.trim()),350); } });
  document.addEventListener('change', (e)=>{ if(e.target.matches('[data-crm305-att-group],[data-crm305-att-date]')) loadAttendanceStudents(); });
  const obs = new MutationObserver(()=>{ clearTimeout(window.__crm305Timer); window.__crm305Timer=setTimeout(renderActive,80); });
  document.addEventListener('DOMContentLoaded', ()=>{ renderActive(); const main=$('.content'); if(main) obs.observe(main,{subtree:true,attributes:true,attributeFilter:['class']}); });
  window.addEventListener('popstate', ()=>setTimeout(renderActive,80));
})();
