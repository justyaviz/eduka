(() => {
  const state = {
    user: null,
    page: new URL(location.href).pathname.split('/').filter(Boolean)[1] || 'dashboard',
    dashboard: null,
    centers: [],
    plans: [],
    subscriptions: [],
    payments: [],
    support: [],
    admins: [],
    audit: [],
    search: ''
  };

  const featureLabels = {
    students: 'Talabalar', groups: 'Guruhlar', teachers: 'O‘qituvchilar', finance: 'Moliya', attendance: 'Davomat', leads: 'Leadlar', student_app: 'Student App', parent_app: 'Parent App', sms: 'SMS', telegram: 'Telegram', custom_domain: 'Custom domain', advanced_reports: 'Keng hisobotlar', multi_branch: 'Filiallar', teacher_salary: 'Oylik/KPI', import_export: 'Import/Export', api_access: 'API access', white_label: 'White label', role_permission: 'Rollar/Ruxsatlar'
  };
  const planDefaults = {
    Start: { students:true, groups:true, teachers:true, finance:true, attendance:true, leads:false, student_app:false, parent_app:false, sms:false, telegram:false, custom_domain:false, advanced_reports:false, multi_branch:false, teacher_salary:false, import_export:false, api_access:false, white_label:false, role_permission:false },
    Growth: { students:true, groups:true, teachers:true, finance:true, attendance:true, leads:true, student_app:true, parent_app:false, sms:false, telegram:true, custom_domain:false, advanced_reports:true, multi_branch:true, teacher_salary:true, import_export:true, api_access:false, white_label:false, role_permission:false },
    Pro: { students:true, groups:true, teachers:true, finance:true, attendance:true, leads:true, student_app:true, parent_app:true, sms:true, telegram:true, custom_domain:true, advanced_reports:true, multi_branch:true, teacher_salary:true, import_export:true, api_access:true, white_label:false, role_permission:true },
    Enterprise: { students:true, groups:true, teachers:true, finance:true, attendance:true, leads:true, student_app:true, parent_app:true, sms:true, telegram:true, custom_domain:true, advanced_reports:true, multi_branch:true, teacher_salary:true, import_export:true, api_access:true, white_label:true, role_permission:true }
  };

  const $ = (s) => document.querySelector(s);
  const root = $('#appRoot');
  const modal = $('#modal');
  const modalTitle = $('#modalTitle');
  const modalBody = $('#modalBody');
  const title = $('#pageTitle');
  const userLine = $('#userLine');

  function escapeHtml(v='') { return String(v ?? '').replace(/[&<>"]/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }
  function money(v) { return `${Number(v || 0).toLocaleString('uz-UZ')} UZS`; }
  function date(v) { return v ? String(v).slice(0,10) : '-'; }
  function badge(v) { const k = String(v || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g,'-'); return `<span class="badge ${k}">${escapeHtml(v || 'unknown')}</span>`; }
  function toast(text) { const t=$('#toast'); t.textContent=text; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }
  function pagePath(page) { return page === 'dashboard' ? '/ceo/dashboard' : `/ceo/${page}`; }
  function isSuperRole(role) { return ['super_admin','platform_owner','platform_admin','owner'].includes(String(role||'').toLowerCase()); }

  async function api(url, options={}) {
    const res = await fetch(url, { credentials:'same-origin', headers:{'Content-Type':'application/json', ...(options.headers||{})}, ...options });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `${res.status} ${res.statusText}`);
    return data;
  }
  async function loadMe() {
    const data = await api('/api/auth/me');
    const user = data.user;
    if (!isSuperRole(user?.role)) throw new Error('Bu sahifa faqat CEO/Super Admin uchun. /admin markaz CRM uchun ishlatiladi.');
    state.user = user;
    userLine.textContent = `${user.fullName || user.full_name || user.email} · ${user.role}`;
  }
  async function loadAll() {
    root.classList.add('loading');
    try {
      const [dash, centers, plans, subs, payments, support, admins, audit] = await Promise.allSettled([
        api('/api/super/dashboard'), api('/api/super/centers'), api('/api/super/plans'), api('/api/super/subscriptions'), api('/api/super/payments'), api('/api/super/support-tickets'), api('/api/super/admin-users'), api('/api/super/audit')
      ]);
      state.dashboard = dash.value || {};
      state.centers = centers.value?.items || [];
      state.plans = plans.value?.items || [];
      state.subscriptions = subs.value?.items || [];
      state.payments = payments.value?.items || [];
      state.support = support.value?.items || support.value?.tickets || [];
      state.admins = admins.value?.items || [];
      state.audit = audit.value?.items || [];
      if (!state.plans.length) state.plans = Object.keys(planDefaults).map((name, i) => ({ id:i+1, name, monthly_price:[0,250000,500000,1200000][i], student_limit:[50,200,500,5000][i], teacher_limit:[3,10,30,100][i], branch_limit:[1,2,5,50][i], group_limit:[5,20,80,1000][i], feature_flags:planDefaults[name], support_level:['basic','standard','priority','vip'][i], is_active:true }));
    } finally { root.classList.remove('loading'); }
  }

  function setPage(page, push=true) {
    state.page = page || 'dashboard';
    if (push) history.pushState({}, '', pagePath(state.page));
    document.querySelectorAll('#ceoNav button').forEach(b => b.classList.toggle('active', b.dataset.page === state.page));
    title.textContent = ({dashboard:'CEO Dashboard',centers:'O‘quv markazlar',plans:'Tariflar va ruxsatlar',subscriptions:'Obunalar',payments:'Platforma to‘lovlari',support:'Support',admins:'CEO adminlar',audit:'Audit log',settings:'Sozlamalar'})[state.page] || 'CEO Console';
    render();
  }

  function render() {
    const map = { dashboard: renderDashboard, centers: renderCenters, plans: renderPlans, subscriptions: renderSubscriptions, payments: renderPayments, support: renderSupport, admins: renderAdmins, audit: renderAudit, settings: renderSettings };
    root.innerHTML = (map[state.page] || renderDashboard)();
  }

  function kpis(items) { return `<div class="kpis">${items.map(([l,v])=>`<article class="kpi"><span>${l}</span><strong>${v}</strong></article>`).join('')}</div>`; }
  function table(headers, rows, empty='Ma’lumot yo‘q') { return `<div class="table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.join(''):`<tr><td colspan="${headers.length}"><div class="empty">${empty}</div></td></tr>`}</tbody></table></div>`; }
  function panel(name, body, tools='') { return `<section class="panel"><div class="panel-head"><h2>${name}</h2><div class="panel-tools">${tools}</div></div>${body}</section>`; }
  function centerRows() {
    const q = state.search.toLowerCase();
    return state.centers.filter(c => !q || JSON.stringify(c).toLowerCase().includes(q)).map(c => `<tr><td><strong>${escapeHtml(c.name)}</strong><br><small>${escapeHtml(c.subdomain || c.slug || '')}.eduka.uz</small></td><td>${escapeHtml(c.owner_name || c.owner || '-')}<br><small>${escapeHtml(c.email || c.phone || '')}</small></td><td>${escapeHtml(c.plan || c.tariff_name || 'Start')}</td><td>${badge(c.status)}</td><td>${badge(c.subscription_status || 'trial')}</td><td>${c.students_count||0}</td><td>${date(c.license_expires_at || c.trial_ends_at)}</td><td class="actions"><button data-action="center-view" data-id="${c.id}">Ko‘rish</button><button data-action="center-plan" data-id="${c.id}">Tarif</button><button data-action="center-features" data-id="${c.id}">Ruxsatlar</button><button class="${c.status==='blocked'?'green':'red'}" data-action="center-block" data-id="${c.id}">${c.status==='blocked'?'Aktiv qilish':'Bloklash'}</button></td></tr>`);
  }

  function renderDashboard() {
    const s = state.dashboard.summary || state.dashboard || {};
    return `${kpis([['Markazlar',s.centers||state.centers.length],['Faol',s.active_centers||0],['Trial',s.trial_centers||0],['Bloklangan',s.blocked_centers||0],['MRR',money(s.mrr||0)],['Oylik tushum',money(s.monthly_revenue||0)],['Kutilayotgan',money(s.expected_revenue||0)],['Bugun yangi',s.new_today||0]])}${panel('Tezkor amallar',`<div class="content"><button class="btn primary" data-action="center-new">Yangi markaz qo‘shish</button> <button class="btn" data-page-go="plans">Tariflarni sozlash</button> <button class="btn" data-page-go="support">Supportni ko‘rish</button></div>`)}${panel('Oxirgi o‘quv markazlar', table(['Markaz','Owner','Tarif','Status','Obuna','O‘quvchi','Muddati','Amallar'], centerRows().slice(0,6)), '<input class="input" data-search placeholder="Qidirish...">')}`;
  }
  function renderCenters() { return `${panel('O‘quv markazlar', table(['Markaz','Owner','Tarif','Status','Obuna','O‘quvchi','Muddati','Amallar'], centerRows(), 'Hali markaz yo‘q'), `<input class="input" data-search placeholder="Markaz qidirish..."><button class="btn primary" data-action="center-new">Yangi markaz qo‘shish</button>`)}`; }
  function renderPlans() {
    const cards = `<div class="plans">${state.plans.map(p=>`<article class="plan"><h3>${escapeHtml(p.name)}</h3><strong>${money(p.monthly_price||p.price)}</strong><p>${p.student_limit||0} o‘quvchi · ${p.teacher_limit||0} o‘qituvchi · ${p.branch_limit||1} filial</p>${badge(p.is_active===false?'inactive':'active')}<div class="actions"><button data-action="plan-edit" data-id="${p.id}">Tahrirlash</button></div></article>`).join('')}</div>`;
    return `${panel('Tariflar va ruxsatlar', cards, '<button class="btn primary" data-action="plan-new">Tarif qo‘shish</button>')}`;
  }
  function renderSubscriptions() { const rows=state.subscriptions.map(x=>`<tr><td>${escapeHtml(x.center_name||x.organization_name||'-')}</td><td>${escapeHtml(x.tariff_name||x.plan||'-')}</td><td>${badge(x.status)}</td><td>${money(x.monthly_price)}</td><td>${date(x.ends_at||x.current_period_end)}</td><td>${badge(x.payment_status||'-')}</td></tr>`); return panel('Obunalar', table(['Markaz','Tarif','Status','Narx','Tugash','To‘lov'], rows)); }
  function renderPayments() { const rows=state.payments.map(x=>`<tr><td>${escapeHtml(x.center_name||'-')}</td><td>${money(x.amount)}</td><td>${escapeHtml(x.payment_type||x.method||'-')}</td><td>${badge(x.status||'paid')}</td><td>${date(x.paid_at||x.created_at)}</td></tr>`); return panel('Platforma to‘lovlari', table(['Markaz','Summa','Usul','Status','Sana'], rows)); }
  function renderSupport() { const rows=state.support.map(x=>`<tr><td>${escapeHtml(x.center_name||'-')}</td><td>${escapeHtml(x.subject||x.title||'Support')}</td><td>${badge(x.status||'open')}</td><td>${escapeHtml(x.priority||'-')}</td><td>${date(x.created_at)}</td></tr>`); return panel('Support', table(['Markaz','Mavzu','Status','Prioritet','Sana'], rows)); }
  function renderAdmins() { const rows=state.admins.map(a=>`<tr><td>${escapeHtml(a.full_name||a.name||'-')}</td><td>${escapeHtml(a.email||'-')}</td><td>${escapeHtml(a.role||'-')}</td><td>${badge(a.is_active===false?'blocked':'active')}</td><td class="actions"><button data-action="admin-reset" data-id="${a.id}">Parol</button></td></tr>`); return panel('CEO adminlar', table(['Ism','Email','Rol','Status','Amal'], rows), '<button class="btn primary" data-action="admin-new">Admin qo‘shish</button>'); }
  function renderAudit() { const rows=state.audit.map(a=>`<tr><td>${escapeHtml(a.admin_name||a.user_id||'-')}</td><td>${escapeHtml(a.action||'-')}</td><td>${escapeHtml(a.entity||a.target_type||'-')}</td><td>${escapeHtml(a.entity_id||a.target_id||'-')}</td><td>${date(a.created_at)}</td></tr>`); return panel('Audit log', table(['Admin','Action','Entity','ID','Sana'], rows)); }
  function renderSettings() { return panel('Soddalashtirilgan sozlamalar', `<div class="content"><div class="notice">CEO console hozir CRMdan to‘liq ajratilgan. /ceo/* faqat platforma boshqaruvi, /admin/* esa o‘quv markaz CRM.</div><button class="btn" data-action="reload-cache">Cache/session tozalash</button></div>`); }

  function openModal(name, body) { modalTitle.textContent=name; modalBody.innerHTML=body; modal.classList.add('open'); }
  function closeModal(){ modal.classList.remove('open'); modalBody.innerHTML=''; }
  function planOptions(selected='') { return state.plans.map(p=>`<option value="${escapeHtml(p.name)}" ${p.name===selected?'selected':''}>${escapeHtml(p.name)}</option>`).join(''); }
  function featureInputs(flags={}) { return `<div class="features">${Object.entries(featureLabels).map(([key,label])=>`<label><input type="checkbox" name="${key}" ${flags[key]?'checked':''}> ${label}</label>`).join('')}</div>`; }
  function collectFeatures(form) { const out={}; Object.keys(featureLabels).forEach(k=>out[k]=Boolean(form.elements[k]?.checked)); return out; }

  async function handleAction(action, id) {
    const center = state.centers.find(c=>String(c.id)===String(id));
    const plan = state.plans.find(p=>String(p.id)===String(id));
    if (action==='center-new') return openModal('Yangi markaz qo‘shish', `<form data-form="center"><div class="form-grid"><label>Markaz nomi<input class="input" name="name" required></label><label>Subdomain<input class="input" name="subdomain" required placeholder="ilm-academy"></label><label>Owner ism<input class="input" name="admin_name" required></label><label>Owner email<input class="input" name="admin_email" required type="email"></label><label>Telefon<input class="input" name="admin_phone" required></label><label>Tarif<select class="select" name="plan">${planOptions('Start')}</select></label><label>Trial kun<input class="input" name="trial_days" type="number" value="14"></label><label>Manzil<input class="input" name="address"></label><label class="full">Custom domain<input class="input" name="custom_domain" placeholder="academy.uz"></label></div><br><button class="btn primary" type="submit">Markaz yaratish</button></form>`);
    if (action==='center-view' && center) return openModal(center.name, `<div class="grid2"><div><h3>Ma’lumot</h3><p>Subdomain: <b>${escapeHtml(center.subdomain||center.slug||'-')}</b></p><p>Status: ${badge(center.status)}</p><p>Obuna: ${badge(center.subscription_status)}</p><p>Tarif: <b>${escapeHtml(center.plan||'Start')}</b></p></div><div><h3>Amallar</h3><p><button class="btn" data-action="center-plan" data-id="${center.id}">Tarif tanlash</button></p><p><button class="btn" data-action="center-features" data-id="${center.id}">Ruxsatlar</button></p><p><button class="btn danger" data-action="center-block" data-id="${center.id}">Bloklash/Aktiv</button></p></div></div>`);
    if (action==='center-block' && center) { await api(`/api/super/centers/${center.id}/status`, {method:'PUT', body:JSON.stringify({status:center.status==='blocked'?'active':'blocked'})}); toast('Status yangilandi'); await loadAll(); render(); return; }
    if (action==='center-plan' && center) return openModal('Tarif tanlash', `<form data-form="center-plan" data-id="${center.id}"><label>Tarif<select class="select" name="plan">${planOptions(center.plan)}</select></label><br><button class="btn primary" type="submit">Tarifni yangilash</button></form>`);
    if (action==='center-features' && center) { const flags=center.feature_flags||planDefaults[center.plan]||{}; return openModal('Markaz ruxsatlari', `<form data-form="center-features" data-id="${center.id}">${featureInputs(flags)}<br><button class="btn primary" type="submit">Ruxsatlarni saqlash</button></form>`); }
    if (action==='plan-new') return openModal('Tarif qo‘shish', `<form data-form="plan"><div class="form-grid"><label>Nomi<input class="input" name="name" required></label><label>Narx<input class="input" name="monthly_price" type="number" value="0"></label><label>O‘quvchi limit<input class="input" name="student_limit" type="number" value="100"></label><label>O‘qituvchi limit<input class="input" name="teacher_limit" type="number" value="5"></label><label>Filial limit<input class="input" name="branch_limit" type="number" value="1"></label><label>Guruh limit<input class="input" name="group_limit" type="number" value="10"></label><label>Support<input class="input" name="support_level" value="standard"></label></div>${featureInputs(planDefaults.Start)}<br><button class="btn primary" type="submit">Tarif saqlash</button></form>`);
    if (action==='plan-edit' && plan) return openModal('Tarifni tahrirlash', `<form data-form="plan" data-id="${plan.id}"><div class="form-grid"><label>Nomi<input class="input" name="name" value="${escapeHtml(plan.name)}" required></label><label>Narx<input class="input" name="monthly_price" type="number" value="${plan.monthly_price||0}"></label><label>O‘quvchi limit<input class="input" name="student_limit" type="number" value="${plan.student_limit||0}"></label><label>O‘qituvchi limit<input class="input" name="teacher_limit" type="number" value="${plan.teacher_limit||0}"></label><label>Filial limit<input class="input" name="branch_limit" type="number" value="${plan.branch_limit||1}"></label><label>Guruh limit<input class="input" name="group_limit" type="number" value="${plan.group_limit||10}"></label><label>Support<input class="input" name="support_level" value="${escapeHtml(plan.support_level||'standard')}"></label></div>${featureInputs(plan.feature_flags||planDefaults[plan.name]||{})}<br><button class="btn primary" type="submit">Tarif yangilash</button></form>`);
    if (action==='admin-new') return openModal('CEO admin qo‘shish', `<form data-form="admin"><div class="form-grid"><label>Ism<input class="input" name="full_name" required></label><label>Email<input class="input" name="email" type="email" required></label><label>Telefon<input class="input" name="phone"></label><label>Rol<select class="select" name="role"><option>platform_admin</option><option>sales_manager</option><option>support_manager</option><option>finance_manager</option></select></label></div><br><button class="btn primary" type="submit">Admin yaratish</button></form>`);
    if (action==='reload-cache') { localStorage.clear(); sessionStorage.clear(); toast('Browser cache/session tozalandi'); return; }
  }

  async function submitForm(form) {
    const kind = form.dataset.form;
    const data = Object.fromEntries(new FormData(form).entries());
    if (kind==='center') {
      const res = await api('/api/super/centers/wizard', {method:'POST', body:JSON.stringify(data)});
      closeModal(); await loadAll(); render();
      return toast(`Markaz yaratildi. Login: ${res.login?.email || data.admin_email}, parol: ${res.login?.password || 'yaratildi'}`);
    }
    if (kind==='center-plan') { await api(`/api/super/centers/${form.dataset.id}/plan`, {method:'PUT', body:JSON.stringify({plan:data.plan})}); closeModal(); await loadAll(); render(); return toast('Tarif yangilandi'); }
    if (kind==='center-features') { await api(`/api/super/centers/${form.dataset.id}/features`, {method:'PUT', body:JSON.stringify({features:collectFeatures(form)})}); closeModal(); await loadAll(); render(); return toast('Ruxsatlar saqlandi'); }
    if (kind==='plan') {
      data.feature_flags = collectFeatures(form); data.is_active = true;
      await api(`/api/super/plans${form.dataset.id?`/${form.dataset.id}`:''}`, {method:form.dataset.id?'PUT':'POST', body:JSON.stringify(data)});
      closeModal(); await loadAll(); render(); return toast('Tarif saqlandi');
    }
    if (kind==='admin') { const res=await api('/api/super/admin-users', {method:'POST', body:JSON.stringify(data)}); closeModal(); await loadAll(); render(); return toast(`Admin yaratildi. Parol: ${res.temporaryPassword || 'yaratildi'}`); }
  }

  document.addEventListener('click', async (e) => {
    const nav = e.target.closest('[data-page]'); if (nav) return setPage(nav.dataset.page);
    const go = e.target.closest('[data-page-go]'); if (go) return setPage(go.dataset.pageGo);
    const act = e.target.closest('[data-action]'); if (act) { try { await handleAction(act.dataset.action, act.dataset.id); } catch(err) { toast(err.message); } }
  });
  document.addEventListener('input', (e) => { if (e.target.matches('[data-search]')) { state.search=e.target.value; render(); } });
  document.addEventListener('submit', async (e) => { if (e.target.matches('[data-form]')) { e.preventDefault(); try { await submitForm(e.target); } catch(err) { toast(err.message); } } });
  $('#modalClose').addEventListener('click', closeModal);
  $('#refreshBtn').addEventListener('click', async()=>{ await loadAll(); render(); toast('Yangilandi'); });
  $('#logoutBtn').addEventListener('click', async()=>{ try{await api('/api/auth/logout',{method:'POST'});}catch{} location.href='/ceo/login'; });
  window.addEventListener('popstate',()=>{ const p=location.pathname.split('/').filter(Boolean)[1]||'dashboard'; setPage(p,false); });

  (async function init(){
    try { await loadMe(); await loadAll(); setPage(state.page,false); }
    catch(err) { localStorage.clear(); sessionStorage.clear(); location.replace('/ceo/login?reason=' + encodeURIComponent(err.message)); }
  })();
})();
