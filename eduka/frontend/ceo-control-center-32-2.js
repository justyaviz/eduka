(() => {
  "use strict";
  const VERSION = "32.2.0";
  const FEATURES = {
    students: "Talabalar", groups: "Guruhlar", teachers: "O‘qituvchilar", courses: "Kurslar", payments: "To‘lovlar", attendance: "Davomat", reports: "Hisobotlar", finance: "Moliya", leads: "Leadlar", student_app: "Student App", parent_app: "Parent App", gamification: "Gamification", telegram: "Telegram bot", homework: "Uyga vazifa", tests: "Testlar", materials: "Materiallar", custom_domain: "Custom domain", custom_branding: "Brending", multi_branch: "Filiallar", role_permission: "Rollar"
  };
  const NAV = [
    ["Asosiy", [["dashboard","Dashboard","D"],["centers","O‘quv markazlar","M"],["new-center","Yangi markaz","+"],["workflow","System Check","✓"]]],
    ["Monetizatsiya", [["plans","Tariflar","T"],["features","Ruxsatlar","R"],["subscriptions","Obunalar","O"],["billing","Billing","B"],["invoices","Invoice","I"]]],
    ["Boshqaruv", [["support","Support","S"],["admins","CEO adminlar","A"],["audit","Audit log","L"],["settings","Sozlamalar","⚙"]]]
  ];
  const state = {
    page: pathPage(), me: null, loading: true, q: "", errors: [],
    dashboard: {}, centers: [], plans: [], subscriptions: [], payments: [], invoices: [], support: [], admins: [], audit: [], notifications: []
  };
  const app = document.getElementById("ceoApp");
  const toastEl = document.getElementById("ceoToast");
  const qs = (s, r=document) => r.querySelector(s);
  const qsa = (s, r=document) => Array.from(r.querySelectorAll(s));
  const esc = (v="") => String(v ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const money = v => `${Number(v || 0).toLocaleString("uz-UZ")} so‘m`;
  const num = v => Number(v || 0).toLocaleString("uz-UZ");
  const date = v => v ? String(v).slice(0,10) : "-";
  const idOf = v => Number(String(v || "").replace(/\D/g, "")) || v;
  function pathPage(){ const seg = location.pathname.split("/").filter(Boolean)[1]; return seg && seg !== "login" ? seg : "dashboard"; }
  function pageUrl(p){ return p === "dashboard" ? "/ceo/dashboard" : `/ceo/${p}`; }
  function toast(msg){ toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toast._t); toast._t=setTimeout(()=>toastEl.classList.remove("show"), 3200); }
  function badge(v){ const k=String(v||"unknown").toLowerCase().replace(/[^a-z0-9]+/g,"-"); return `<span class="badge ${k}">${esc(v||"unknown")}</span>`; }
  async function api(url, options={}){
    const res = await fetch(url, { credentials:"same-origin", headers:{ "Content-Type":"application/json", ...(options.headers||{}) }, ...options });
    const data = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.message || data.error || `${res.status} ${res.statusText}`);
    return data;
  }
  async function safeApi(url, fallback={}){ try { return await api(url); } catch(err){ state.errors.push(`${url}: ${err.message}`); return fallback; } }
  function allowedRole(role){ return ["super_admin","platform_owner","platform_admin","support_manager","sales_manager","finance_manager","technical_manager","ceo","owner"].includes(String(role||"").toLowerCase()); }
  async function loadMe(){ const data = await api("/api/auth/me"); const user = data.user || data.item || data; if(!allowedRole(user.role)) throw new Error("CEO panelga faqat platforma adminlari kira oladi."); state.me = user; }
  function normalizeItems(data){ return data.items || data.rows || data.centers || data.plans || data.invoices || data.payments || data.support || data.admins || data.audit || data || []; }
  async function loadData(){
    state.errors = [];
    const [dashboard, centers, plans, subscriptions, payments, invoices, support, admins, audit, notifications] = await Promise.all([
      safeApi("/api/super/dashboard", {}),
      safeApi("/api/super/centers", {items:[]}),
      safeApi("/api/super/plans", {items:[]}),
      safeApi("/api/super/subscriptions", {items:[]}),
      safeApi("/api/super/payments", {items:[]}),
      safeApi("/api/super/invoices", {items:[]}),
      safeApi("/api/super/support-tickets", {items:[]}),
      safeApi("/api/super/admin-users", {items:[]}),
      safeApi("/api/super/audit", {items:[]}),
      safeApi("/api/super/notifications", {items:[]})
    ]);
    state.dashboard = dashboard || {};
    state.centers = normalizeItems(centers);
    state.plans = normalizeItems(plans); if(!state.plans.length) state.plans = defaultPlans();
    state.subscriptions = normalizeItems(subscriptions);
    state.payments = normalizeItems(payments);
    state.invoices = normalizeItems(invoices);
    state.support = normalizeItems(support);
    state.admins = normalizeItems(admins);
    state.audit = normalizeItems(audit);
    state.notifications = normalizeItems(notifications); if(!state.notifications.length) state.notifications = localNotifications();
  }
  function defaultFlags(level="Start"){
    const base = Object.fromEntries(Object.keys(FEATURES).map(k=>[k, ["students","groups","teachers","courses","payments","attendance"].includes(k)]));
    if(level === "Growth") return {...base, reports:true, finance:true, student_app:true, telegram:true, leads:true};
    if(level === "Pro") return Object.fromEntries(Object.keys(FEATURES).map(k=>[k, !["custom_branding","custom_domain"].includes(k)]));
    if(level === "Business" || level === "Enterprise") return Object.fromEntries(Object.keys(FEATURES).map(k=>[k,true]));
    return base;
  }
  function defaultPlans(){ return [
    {id:"start", name:"Start", monthly_price:99000, student_limit:100, teacher_limit:5, branch_limit:1, feature_flags:defaultFlags("Start"), is_active:true},
    {id:"growth", name:"Growth", monthly_price:249000, student_limit:500, teacher_limit:20, branch_limit:3, feature_flags:defaultFlags("Growth"), is_active:true},
    {id:"pro", name:"Pro", monthly_price:499000, student_limit:2000, teacher_limit:80, branch_limit:10, feature_flags:defaultFlags("Pro"), is_active:true},
    {id:"business", name:"Business", monthly_price:0, student_limit:100000, teacher_limit:1000, branch_limit:100, feature_flags:defaultFlags("Business"), is_active:true}
  ]; }
  function localNotifications(){
    const list = [];
    state.centers.filter(c=>["blocked","inactive"].includes(String(c.status).toLowerCase())).slice(0,4).forEach(c=>list.push({title:"Markaz bloklangan", body:c.name, type:"warning"}));
    state.invoices.filter(i=>["unpaid","overdue","pending"].includes(String(i.status).toLowerCase())).slice(0,4).forEach(i=>list.push({title:"Invoice kutilmoqda", body:`${i.center_name||i.organization_name||"Markaz"} · ${money(i.amount)}`, type:"billing"}));
    state.support.filter(s=>["open","in_progress","pending"].includes(String(s.status).toLowerCase())).slice(0,4).forEach(s=>list.push({title:"Support murojaat", body:s.subject || s.message || "Yangi ticket", type:"support"}));
    return list;
  }
  function mount(){
    app.innerHTML = `
      <div class="ceo-shell">
        <aside class="ceo-sidebar" id="sidebar">
          <div class="brand"><div class="logo-mark">E</div><div><b>Eduka CEO</b><small>Control Center 32.2</small></div></div>
          <nav>${NAV.map(([g,items])=>`<div class="nav-group"><div class="nav-title">${g}</div>${items.map(([p,t,i])=>`<button class="nav-btn ${state.page===p?'active':''}" data-page="${p}"><span class="nav-icon">${i}</span>${t}</button>`).join("")}</div>`).join("")}</nav>
          <div class="side-card"><b>Platforma holati</b><br><span>CEO panel yangilandi. Eski scriptlar olib tashlandi, tugmalar real API bilan ulandi.</span></div>
        </aside>
        <main class="main">
          <header class="topbar">
            <button class="btn ghost menu-btn" data-action="toggle-sidebar">Menu</button>
            <div class="title"><h1 id="pageTitle">${pageTitle()}</h1><p>${esc((state.me && (state.me.fullName||state.me.full_name||state.me.email)) || "CEO")}</p></div>
            <label class="search"><span>Qidiruv</span><input id="globalSearch" placeholder="Markaz, email, invoice, support..." value="${esc(state.q)}"></label>
            <div class="top-actions"><button class="btn ghost" data-action="refresh">Yangilash</button><a class="btn ghost" href="/admin/login" target="_blank">Center CRM</a><button class="btn danger" data-action="logout">Chiqish</button></div>
          </header>
          <section id="pageRoot">${renderPage()}</section>
        </main>
      </div>
      <div class="drawer" id="drawer"><div class="drawer-panel"><div class="drawer-head"><h2 id="drawerTitle">Natijalar</h2><button class="btn ghost" data-action="close-drawer">Yopish</button></div><div id="drawerBody"></div></div></div>
      <div class="modal" id="modal"><div class="modal-box"><div class="modal-head"><h2 id="modalTitle">Modal</h2><button class="btn ghost" data-action="close-modal">Yopish</button></div><div id="modalBody"></div></div></div>
    `;
  }
  function pageTitle(){ return ({dashboard:"CEO Dashboard", centers:"O‘quv markazlar", "new-center":"Yangi markaz", plans:"Tariflar", features:"Ruxsatlar", subscriptions:"Obunalar", billing:"Billing", invoices:"Invoice", support:"Support", admins:"CEO adminlar", audit:"Audit log", settings:"Sozlamalar", workflow:"System Check"})[state.page] || "CEO Console"; }
  function renderPage(){ return (pages[state.page] || pages.dashboard)(); }
  function rerender(){ mount(); }
  function setPage(p, push=true){ state.page = p || "dashboard"; if(push) history.pushState({}, "", pageUrl(state.page)); rerender(); }
  const pages = {
    dashboard(){
      const d = state.dashboard || {};
      const totalCenters = state.centers.length || d.centers || d.total_centers || 0;
      const activeCenters = state.centers.filter(c=>!["blocked","inactive","deleted"].includes(String(c.status).toLowerCase())).length || d.active_centers || 0;
      const mrr = state.subscriptions.reduce((s,x)=>s+Number(x.monthly_price||x.amount||0),0) || d.mrr || 0;
      const unpaid = state.invoices.filter(i=>["unpaid","overdue","pending"].includes(String(i.status).toLowerCase())).length;
      return `
        ${hero("Platformani nazorat qilish markazi", "CEO panel endi soddalashtirildi: markazlar, tariflar, ruxsatlar, billing va support bir joyda. Har bir tugma real endpoint bilan ulangan.", "dashboard")}
        <div class="grid cols-4">
          ${kpi("Jami markazlar", totalCenters, "Platformadagi barcha tenantlar", "good")}
          ${kpi("Faol markazlar", activeCenters, "Ishlayotgan markazlar", "good")}
          ${kpi("MRR", money(mrr), "Oylik taxminiy tushum", "warn")}
          ${kpi("Kutilayotgan invoice", unpaid, "To‘lov nazorati", unpaid?"bad":"good")}
        </div>
        <div class="split" style="margin-top:18px">
          ${panel("Oxirgi markazlar", centersTable(state.centers.slice(0,6)), `<button class="btn primary small" data-page="new-center">Yangi markaz</button>`)}
          ${panel("Action Center", actionList(), `<button class="btn ghost small" data-page="workflow">System Check</button>`)}
        </div>
        ${state.errors.length ? `<div class="ceo-error" style="margin-top:18px"><b>API ogohlantirish:</b><br>${state.errors.map(esc).join("<br>")}</div>` : ""}
      `;
    },
    centers(){ return `${pageHeader("O‘quv markazlar", "Markazlarni boshqarish, bloklash, tarif/ruxsatlarni berish va owner parolini reset qilish.", `<button class="btn primary" data-page="new-center">Yangi markaz</button>`)}${panel("Markazlar ro‘yxati", centersTable(filtered(state.centers)), `<input class="input" data-filter placeholder="Qidirish...">`)}`; },
    "new-center"(){ return `${pageHeader("Yangi markaz qo‘shish", "Yangi hamkor markaz ochish, owner account va tarif/ruxsatlarni sozlash.", "")}${panel("Markaz yaratish", centerForm(), "")}`; },
    plans(){ return `${pageHeader("Tariflar", "Start, Growth, Pro va Business paketlarini boshqarish.", `<button class="btn primary" data-action="plan-new">Tarif qo‘shish</button>`)}<div class="grid cols-4">${state.plans.map(planCard).join("")}</div>`; },
    features(){ return `${pageHeader("Ruxsatlar", "Har bir markaz uchun Student App, Gamification, Telegram, Finance va boshqa modullarni yoqib/o‘chirish.", "")}${panel("Markaz bo‘yicha ruxsatlar", `<div class="list">${state.centers.map(c=>`<div class="list-item"><div><b>${esc(c.name)}</b><small>${esc(c.plan||c.tariff||"Start")} · ${esc(c.status||"active")}</small></div><button class="btn primary small" data-action="center-features" data-id="${c.id}">Sozlash</button></div>`).join("")||empty("Markazlar topilmadi")}</div>`, "")}`; },
    subscriptions(){ return `${pageHeader("Obunalar", "Markazlarning obuna holati, trial va muddati tugayotgan paketlar.", "")}${panel("Obuna jadvali", table(["Markaz","Tarif","Status","Boshlanish","Tugash","Amal"], filtered(state.subscriptions).map(s=>`<tr><td>${esc(s.center_name||s.organization_name||s.name||'-')}</td><td>${esc(s.plan||s.plan_name||'-')}</td><td>${badge(s.status||'active')}</td><td>${date(s.starts_at||s.created_at)}</td><td>${date(s.ends_at||s.expires_at)}</td><td><button class="btn ghost small" data-action="subscription-action" data-id="${s.id}">Yangilash</button></td></tr>`)), "")}`; },
    billing(){ return `${pageHeader("Billing", "Platforma to‘lovlari, kirimlar va markazlardan tushumlar.", `<button class="btn primary" data-action="payment-new">To‘lov qo‘shish</button>`)}${panel("Platforma to‘lovlari", table(["Markaz","Summa","Usul","Status","Sana"], filtered(state.payments).map(p=>`<tr><td>${esc(p.center_name||p.organization_name||'-')}</td><td>${money(p.amount)}</td><td>${esc(p.method||p.payment_method||'-')}</td><td>${badge(p.status||'paid')}</td><td>${date(p.created_at||p.date)}</td></tr>`)), "")}`; },
    invoices(){ return `${pageHeader("Invoice", "Markazlar uchun platform invoice yaratish va statusni kuzatish.", `<button class="btn primary" data-action="invoice-new">Invoice yaratish</button>`)}${panel("Invoice ro‘yxati", table(["Invoice","Markaz","Summa","Status","Muddat","Amal"], filtered(state.invoices).map(i=>`<tr><td>${esc(i.invoice_number||i.id)}</td><td>${esc(i.center_name||i.organization_name||'-')}</td><td>${money(i.amount)}</td><td>${badge(i.status||'unpaid')}</td><td>${date(i.due_date)}</td><td><button class="btn ghost small" data-action="invoice-edit" data-id="${i.id}">Status</button></td></tr>`)), "")}`; },
    support(){ return `${pageHeader("Support", "Markazlardan kelgan murojaatlar, ustuvorlik va javoblar.", `<button class="btn primary" data-action="support-new">Ticket yaratish</button>`)}${panel("Support ticketlar", table(["Markaz","Mavzu","Prioritet","Status","Sana","Amal"], filtered(state.support).map(s=>`<tr><td>${esc(s.center_name||s.organization_name||'-')}</td><td>${esc(s.subject||s.message||'-')}</td><td>${badge(s.priority||'normal')}</td><td>${badge(s.status||'open')}</td><td>${date(s.created_at)}</td><td class="actions"><button class="btn ghost small" data-action="support-reply" data-id="${s.id}">Javob</button><button class="btn danger small" data-action="support-close" data-id="${s.id}">Yopish</button></td></tr>`)), "")}`; },
    admins(){ return `${pageHeader("CEO adminlar", "Platforma adminlari, support/finance/sales rollarini boshqarish.", `<button class="btn primary" data-action="admin-new">Admin qo‘shish</button>`)}${panel("Adminlar", table(["Ism","Email","Rol","Status","Amal"], filtered(state.admins).map(a=>`<tr><td>${esc(a.full_name||a.fullName||'-')}</td><td>${esc(a.email)}</td><td>${badge(a.role||'platform_admin')}</td><td>${badge(a.is_active===false?'blocked':'active')}</td><td class="actions"><button class="btn ghost small" data-action="admin-edit" data-id="${a.id}">Tahrir</button><button class="btn ghost small" data-action="admin-reset" data-id="${a.id}">Parol</button><button class="btn danger small" data-action="admin-block" data-id="${a.id}">${a.is_active===false?'Aktiv':'Blok'}</button></td></tr>`)), "")}`; },
    audit(){ return `${pageHeader("Audit log", "Platformada qilingan muhim harakatlar tarixi.", "")}${panel("Audit", table(["User","Action","Target","Sana"], filtered(state.audit).map(a=>`<tr><td>${esc(a.user_email||a.user||'-')}</td><td>${esc(a.action||'-')}</td><td>${esc(a.target||a.entity||'-')}</td><td>${date(a.created_at)}</td></tr>`)), "")}`; },
    settings(){ return `${pageHeader("Sozlamalar", "Platforma xavfsizligi, cache/session va production check.", "")}${panel("Tezkor sozlamalar", `<div class="grid cols-3"><button class="btn ghost" data-action="clear-local">Local session tozalash</button><button class="btn ghost" data-action="run-audit">Production audit</button><button class="btn danger" data-action="logout">Chiqish</button></div><br><div class="ceo-business-card"><b>Versiya</b><span>CEO Control Center ${VERSION}</span><small>Eski platform scriptlar olib tashlandi, bitta renderer ishlaydi.</small></div>`, "")}`; },
    workflow(){ return `${pageHeader("System Check", "CEO, markaz, admin, student app va billing bo‘yicha real workflow checklist.", `<button class="btn primary" data-action="run-workflow">Tekshirish</button>`)}${panel("Workflow checklist", `<div class="list">${["CEO login","Yangi markaz yaratish","Owner login","Talaba yaratish","To‘lov qo‘shish","Student App","Telegram xabar","Invoice/Billing"].map(x=>`<div class="list-item"><div><b>${x}</b><small>Manual/endpoint check</small></div>${badge('ready')}</div>`).join("")}</div>`, "")}`; }
  };
  function hero(title, text){ return `<section class="hero"><div><h2>${esc(title)}</h2><p>${esc(text)}</p><div class="hero-actions"><button class="btn primary" data-page="new-center">Yangi markaz</button><button class="btn ghost" data-page="centers">Markazlar</button><button class="btn ghost" data-page="plans">Tariflar</button></div></div><div class="status-card"><span>CEO Control</span><strong>${VERSION}</strong><small>Stable admin panel</small></div></section>`; }
  function kpi(label,value,sub,type="good"){ return `<article class="card kpi"><small>${esc(label)}</small><strong>${esc(value)}</strong><span class="trend ${type}">${esc(sub)}</span></article>`; }
  function pageHeader(title,sub,tools=""){ return `<div class="hero" style="grid-template-columns:1fr auto;margin-bottom:18px"><div><h2>${esc(title)}</h2><p>${esc(sub)}</p></div><div class="hero-actions">${tools}</div></div>`; }
  function panel(title, body, tools=""){ return `<section class="panel"><div class="panel-head"><h3>${esc(title)}</h3><div class="actions">${tools}</div></div><div class="panel-body">${body}</div></section>`; }
  function table(heads, rows, tools=""){ return `<div class="table-wrap"><table class="table"><thead><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.join("") : `<tr><td colspan="${heads.length}">${empty("Ma’lumot topilmadi")}</td></tr>`}</tbody></table></div>`; }
  function empty(t){ return `<div class="empty">${esc(t)}</div>`; }
  function filtered(list){ if(!state.q) return list || []; const q=state.q.toLowerCase(); return (list||[]).filter(x=>JSON.stringify(x).toLowerCase().includes(q)); }
  function actionList(){ const items = [
    ["Yangi markaz", "Hamkor/tenant ochish", "new-center"],
    ["Invoice yaratish", "Platforma billing", "invoice-new"],
    ["Support", "Ochiq ticketlar", "support"],
    ["Ruxsatlar", "Feature flags", "features"]
  ];
    return `<div class="list">${items.map(([a,b,go])=>`<div class="list-item"><div><b>${a}</b><small>${b}</small></div>${go.includes('-new')?`<button class="btn primary small" data-action="${go}">Boshlash</button>`:`<button class="btn ghost small" data-page="${go}">Ochish</button>`}</div>`).join("")}</div>`;
  }
  function centersTable(list){ return table(["Markaz","Owner","Tarif","Status","Talaba","Amal"], (list||[]).map(c=>`<tr><td><b>${esc(c.name||c.title||'-')}</b><br><small class="mini">${esc(c.subdomain||c.slug||'')}</small></td><td>${esc(c.owner_name||c.admin_name||c.email||'-')}<br><small class="mini">${esc(c.phone||'')}</small></td><td>${badge(c.plan||c.tariff||'Start')}</td><td>${badge(c.status||'active')}</td><td>${num(c.students_count||c.student_count||0)}</td><td class="actions"><button class="btn ghost small" data-action="center-view" data-id="${c.id}">Ko‘rish</button><button class="btn ghost small" data-action="center-plan" data-id="${c.id}">Tarif</button><button class="btn ghost small" data-action="center-features" data-id="${c.id}">Ruxsat</button><button class="btn danger small" data-action="center-toggle" data-id="${c.id}">${String(c.status).toLowerCase()==='blocked'?'Aktiv':'Blok'}</button></td></tr>`)); }
  function planCard(p){ const flags = p.feature_flags || defaultFlags(p.name); const active = Object.values(flags).filter(Boolean).length; return `<article class="plan-card"><h3>${esc(p.name)}</h3><div class="price">${Number(p.monthly_price||0) ? money(p.monthly_price) : 'Kelishiladi'}</div><small>${num(p.student_limit)} student · ${num(p.teacher_limit)} teacher · ${num(p.branch_limit)} filial</small><span class="badge pro">${active} ta funksiya</span><div class="actions"><button class="btn ghost small" data-action="plan-edit" data-id="${p.id}">Tahrir</button><button class="btn primary small" data-action="plan-features" data-id="${p.id}">Ruxsatlar</button></div></article>`; }
  function centerForm(){ return `<form data-form="center"><div class="form-grid"><label class="field">Markaz nomi<input class="input" name="name" required></label><label class="field">Subdomain<input class="input" name="subdomain" placeholder="aloacademy"></label><label class="field">Owner FISH<input class="input" name="admin_name" required></label><label class="field">Owner email<input class="input" type="email" name="admin_email" required></label><label class="field">Telefon<input class="input" name="phone"></label><label class="field">Tarif<select class="select" name="plan">${state.plans.map(p=>`<option>${esc(p.name)}</option>`).join("")}</select></label><label class="field">Trial kun<input class="input" type="number" name="trial_days" value="7"></label><label class="field">Parol<input class="input" name="password" value="Eduka12345"></label><label class="field full">Izoh<textarea name="note" rows="3"></textarea></label></div><br><button class="btn primary">Markaz yaratish</button></form>`; }
  function featureInputs(flags={}){ return `<div class="feature-grid">${Object.entries(FEATURES).map(([k,l])=>`<label class="switch"><input type="checkbox" name="feature:${k}" ${flags[k]?'checked':''}>${esc(l)}</label>`).join("")}</div>`; }
  function collectFeatures(form){ const out={}; Object.keys(FEATURES).forEach(k=>out[k]=!!qs(`[name="feature:${k}"]`,form)?.checked); return out; }
  function openModal(title, html){ qs("#modalTitle").textContent=title; qs("#modalBody").innerHTML=html; qs("#modal").classList.add("show"); }
  function closeModal(){ qs("#modal")?.classList.remove("show"); }
  function openDrawer(title, html){ qs("#drawerTitle").textContent=title; qs("#drawerBody").innerHTML=html; qs("#drawer").classList.add("show"); }
  function closeDrawer(){ qs("#drawer")?.classList.remove("show"); }
  async function reload(msg){ await loadData(); rerender(); if(msg) toast(msg); }
  function findById(list,id){ return (list||[]).find(x=>String(x.id)===String(id)) || {}; }
  function planSelect(value=""){ return `<select class="select" name="plan">${state.plans.map(p=>`<option ${String(p.name)===String(value)?'selected':''}>${esc(p.name)}</option>`).join("")}</select>`; }
  function centerFeaturesForm(c){ const flags = c.feature_flags || c.features || defaultFlags(c.plan || c.tariff || "Start"); return `<form data-form="center-features" data-id="${c.id}"><p><b>${esc(c.name)}</b> uchun modul ruxsatlari</p>${featureInputs(flags)}<br><button class="btn primary">Saqlash</button></form>`; }
  function planForm(p={}){ const flags=p.feature_flags||defaultFlags(p.name); return `<form data-form="plan" data-id="${p.id||''}"><div class="form-grid"><label class="field">Nomi<input class="input" name="name" value="${esc(p.name||'')}"></label><label class="field">Narx<input class="input" name="monthly_price" type="number" value="${Number(p.monthly_price||0)}"></label><label class="field">Student limit<input class="input" name="student_limit" type="number" value="${Number(p.student_limit||100)}"></label><label class="field">Teacher limit<input class="input" name="teacher_limit" type="number" value="${Number(p.teacher_limit||5)}"></label><label class="field">Filial limit<input class="input" name="branch_limit" type="number" value="${Number(p.branch_limit||1)}"></label></div>${featureInputs(flags)}<br><button class="btn primary">Saqlash</button></form>`; }
  async function handleAction(action, id){
    if(action === "toggle-sidebar") return qs("#sidebar").classList.toggle("open");
    if(action === "refresh") return reload("Yangilandi");
    if(action === "close-modal") return closeModal();
    if(action === "close-drawer") return closeDrawer();
    if(action === "logout"){ try{ await api("/api/auth/logout",{method:"POST"}); }catch{} location.href="/ceo/login"; return; }
    if(action === "clear-local"){ localStorage.clear(); sessionStorage.clear(); toast("Local session tozalandi"); return; }
    if(action === "run-audit"){ const data = await safeApi("/api/production/audit29", {status:"manual"}); return openDrawer("Production audit", `<pre>${esc(JSON.stringify(data,null,2))}</pre>`); }
    if(action === "run-workflow"){ const data = await safeApi("/api/workflow27/checklist", {items:[]}); return openDrawer("Workflow check", `<pre>${esc(JSON.stringify(data,null,2))}</pre>`); }
    if(action === "center-view"){ const c=findById(state.centers,id); return openDrawer("Markaz profili", `<div class="grid cols-2"><div class="ceo-business-card"><b>${esc(c.name)}</b><small>${esc(c.email||c.phone||'')}</small>${badge(c.status||'active')}</div><div class="ceo-business-card"><b>Tarif</b><span>${esc(c.plan||c.tariff||'Start')}</span><small>${num(c.students_count||0)} student</small></div></div><br><div class="actions"><button class="btn primary" data-action="center-plan" data-id="${c.id}">Tarif o‘zgartirish</button><button class="btn ghost" data-action="center-features" data-id="${c.id}">Ruxsatlar</button><button class="btn ghost" data-action="center-reset" data-id="${c.id}">Owner parol reset</button></div>`); }
    if(action === "center-plan"){ const c=findById(state.centers,id); return openModal("Tarifni o‘zgartirish", `<form data-form="center-plan" data-id="${c.id}"><label class="field">Markaz<b>${esc(c.name)}</b></label><label class="field">Tarif${planSelect(c.plan||c.tariff)}</label><button class="btn primary">Saqlash</button></form>`); }
    if(action === "center-features"){ const c=findById(state.centers,id); return openModal("Markaz ruxsatlari", centerFeaturesForm(c)); }
    if(action === "center-toggle"){ const c=findById(state.centers,id); const next = String(c.status).toLowerCase()==="blocked" ? "active" : "blocked"; await api(`/api/super/centers/${id}/status`,{method:"PUT",body:JSON.stringify({status:next})}); return reload("Markaz statusi yangilandi"); }
    if(action === "center-reset"){ const res = await api(`/api/super/centers/${id}/admin-reset`,{method:"POST",body:JSON.stringify({})}); return openModal("Owner paroli", `<p>Yangi vaqtinchalik parol:</p><h2>${esc(res.password||res.temporaryPassword||'owner')}</h2>`); }
    if(action === "plan-new") return openModal("Tarif qo‘shish", planForm());
    if(action === "plan-edit" || action === "plan-features"){ const p=findById(state.plans,id); return openModal(action==="plan-edit"?"Tarif tahrirlash":"Tarif ruxsatlari", planForm(p)); }
    if(action === "invoice-new") return openModal("Invoice yaratish", `<form data-form="invoice"><div class="form-grid"><label class="field">Markaz<select class="select" name="organization_id">${state.centers.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></label><label class="field">Summa<input class="input" type="number" name="amount" required></label><label class="field">Muddat<input class="input" type="date" name="due_date"></label><label class="field">Status<select class="select" name="status"><option>unpaid</option><option>paid</option><option>overdue</option></select></label><label class="field full">Izoh<textarea name="note"></textarea></label></div><br><button class="btn primary">Yaratish</button></form>`);
    if(action === "invoice-edit"){ const inv=findById(state.invoices,id); return openModal("Invoice status", `<form data-form="invoice-status" data-id="${id}"><label class="field">Status<select class="select" name="status"><option ${inv.status==='unpaid'?'selected':''}>unpaid</option><option ${inv.status==='paid'?'selected':''}>paid</option><option ${inv.status==='overdue'?'selected':''}>overdue</option><option ${inv.status==='cancelled'?'selected':''}>cancelled</option></select></label><button class="btn primary">Saqlash</button></form>`); }
    if(action === "payment-new") return openModal("Platforma to‘lovi", `<form data-form="payment"><div class="form-grid"><label class="field">Markaz<select class="select" name="organization_id">${state.centers.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></label><label class="field">Summa<input class="input" type="number" name="amount" required></label><label class="field">Usul<select class="select" name="method"><option>cash</option><option>card</option><option>click</option><option>payme</option><option>bank</option></select></label><label class="field">Status<select class="select" name="status"><option>paid</option><option>pending</option></select></label></div><br><button class="btn primary">Saqlash</button></form>`);
    if(action === "subscription-action") return openModal("Obuna yangilash", `<form data-form="sub-action" data-id="${id}"><label class="field">Action<select class="select" name="action"><option>extend</option><option>trial</option><option>pause</option><option>cancel</option></select></label><label class="field">Kun<input class="input" name="days" type="number" value="30"></label><button class="btn primary">Saqlash</button></form>`);
    if(action === "support-new") return openModal("Support ticket", `<form data-form="support"><label class="field">Mavzu<input class="input" name="subject" required></label><label class="field">Prioritet<select class="select" name="priority"><option>normal</option><option>high</option><option>urgent</option></select></label><label class="field">Xabar<textarea name="message" rows="4"></textarea></label><button class="btn primary">Yuborish</button></form>`);
    if(action === "support-reply") return openModal("Support javob", `<form data-form="support-reply" data-id="${id}"><label class="field">Status<select class="select" name="status"><option>open</option><option>in_progress</option><option>resolved</option><option>closed</option></select></label><label class="field">Javob<textarea name="message" rows="4"></textarea></label><button class="btn primary">Saqlash</button></form>`);
    if(action === "support-close"){ await api(`/api/super/support-tickets/${id}`,{method:"PUT",body:JSON.stringify({status:"closed"})}); return reload("Ticket yopildi"); }
    if(action === "admin-new") return openModal("Admin qo‘shish", adminForm());
    if(action === "admin-edit") return openModal("Admin tahrirlash", adminForm(findById(state.admins,id)));
    if(action === "admin-reset"){ const res=await api(`/api/super/admin-users/${id}/reset-password`,{method:"POST",body:JSON.stringify({})}); return openModal("Admin paroli", `<h2>${esc(res.temporaryPassword||res.password||'Eduka12345')}</h2>`); }
    if(action === "admin-block"){ const a=findById(state.admins,id); await api(`/api/super/admin-users/${id}`,{method:"PUT",body:JSON.stringify({is_active:!(a.is_active!==false)})}); return reload("Admin statusi yangilandi"); }
  }
  function adminForm(a={}){ return `<form data-form="admin" data-id="${a.id||''}"><div class="form-grid"><label class="field">Ism<input class="input" name="full_name" value="${esc(a.full_name||a.fullName||'')}"></label><label class="field">Email<input class="input" name="email" type="email" value="${esc(a.email||'')}"></label><label class="field">Telefon<input class="input" name="phone" value="${esc(a.phone||'')}"></label><label class="field">Rol<select class="select" name="role"><option>platform_admin</option><option>support_manager</option><option>sales_manager</option><option>finance_manager</option></select></label></div><br><button class="btn primary">Saqlash</button></form>`; }
  async function submit(form){
    const kind = form.dataset.form; const data = Object.fromEntries(new FormData(form).entries());
    if(kind === "center"){ const res = await api("/api/super/centers/wizard",{method:"POST",body:JSON.stringify(data)}); closeModal(); await reload(); return openModal("Markaz yaratildi", `<p>Login URL: <b>${esc(res.login?.url || '/admin/login')}</b></p><p>Email: <b>${esc(res.login?.email || data.admin_email)}</b></p><p>Parol:</p><h2>${esc(res.login?.password || data.password || 'Eduka12345')}</h2>`); }
    if(kind === "center-plan"){ await api(`/api/super/centers/${form.dataset.id}/plan`,{method:"PUT",body:JSON.stringify(data)}); closeModal(); return reload("Tarif yangilandi"); }
    if(kind === "center-features"){ await api(`/api/super/centers/${form.dataset.id}/features`,{method:"PUT",body:JSON.stringify({features:collectFeatures(form)})}); closeModal(); return reload("Ruxsatlar saqlandi"); }
    if(kind === "plan"){ await api(`/api/super/plans${form.dataset.id?`/${form.dataset.id}`:""}`,{method:form.dataset.id?"PUT":"POST",body:JSON.stringify({...data,feature_flags:collectFeatures(form),is_active:true})}); closeModal(); return reload("Tarif saqlandi"); }
    if(kind === "invoice"){ await api("/api/super/invoices",{method:"POST",body:JSON.stringify(data)}); closeModal(); return reload("Invoice yaratildi"); }
    if(kind === "invoice-status"){ await api(`/api/super/invoices/${form.dataset.id}`,{method:"PUT",body:JSON.stringify(data)}); closeModal(); return reload("Invoice yangilandi"); }
    if(kind === "payment"){ await api("/api/super/payments",{method:"POST",body:JSON.stringify(data)}); closeModal(); return reload("To‘lov saqlandi"); }
    if(kind === "sub-action"){ await api(`/api/super/subscriptions/${form.dataset.id}/action`,{method:"PUT",body:JSON.stringify(data)}); closeModal(); return reload("Obuna yangilandi"); }
    if(kind === "support"){ await api("/api/super/support-tickets",{method:"POST",body:JSON.stringify(data)}); closeModal(); return reload("Ticket yaratildi"); }
    if(kind === "support-reply"){ await api(`/api/super/support-tickets/${form.dataset.id}`,{method:"PUT",body:JSON.stringify(data)}); closeModal(); return reload("Support yangilandi"); }
    if(kind === "admin"){ await api(`/api/super/admin-users${form.dataset.id?`/${form.dataset.id}`:""}`,{method:form.dataset.id?"PUT":"POST",body:JSON.stringify(data)}); closeModal(); return reload("Admin saqlandi"); }
  }
  document.addEventListener("click", async e => {
    const page = e.target.closest("[data-page]"); if(page) return setPage(page.dataset.page);
    const action = e.target.closest("[data-action]"); if(action){ try{ await handleAction(action.dataset.action, action.dataset.id); } catch(err){ toast(err.message); console.error(err); } }
  });
  document.addEventListener("submit", async e => { const form=e.target.closest("[data-form]"); if(form){ e.preventDefault(); try{ await submit(form); } catch(err){ toast(err.message); console.error(err); } } });
  document.addEventListener("input", e => { if(e.target.id === "globalSearch" || e.target.matches("[data-filter]")){ state.q = e.target.value.trim(); rerender(); setTimeout(()=>{ const i=qs("#globalSearch"); if(i) i.focus(); },0); } });
  window.addEventListener("popstate",()=>{ state.page=pathPage(); rerender(); });
  (async function init(){
    try { await loadMe(); await loadData(); mount(); }
    catch(err){ app.innerHTML = `<div class="ceo-boot"><div class="ceo-error"><b>CEO panel ochilmadi</b><br>${esc(err.message)}</div><a class="btn primary" href="/ceo/login">Login sahifaga qaytish</a></div>`; }
  })();
})();
