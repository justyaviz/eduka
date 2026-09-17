
const icons = {
  dashboard:`<svg viewBox="0 0 24 24"><path d="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-5H4v5Z"/></svg>`,
  demo:`<svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/></svg>`,
  centers:`<svg viewBox="0 0 24 24"><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16"/><path d="M8 7h4M8 11h4M8 15h4"/></svg>`,
  tariffs:`<svg viewBox="0 0 24 24"><path d="M20 12V8H4v4"/><path d="M6 12v8h12v-8"/><path d="M9 16h6"/></svg>`,
  payments:`<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/><path d="M7 15h4"/></svg>`,
  roles:`<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  settings:`<svg viewBox="0 0 24 24"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .6 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-.6 1Z"/></svg>`,
  search:`<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`,
  bell:`<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>`,
  plus:`<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
  logout:`<svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 3v18"/></svg>`,
};

const TOKEN = "eduka_ceo_token";
const USER = "eduka_ceo_user";
const titles = {
  dashboard: "Boshqaruv paneli",
  demo: "Demo so‘rovlar",
  centers: "O‘quv markazlar",
  tariffs: "Tariflar",
  payments: "To‘lovlar / obunalar",
  roles: "Ruxsatlar / rollar",
  settings: "Platforma sozlamalari",
  sms: "SMS xabarlar",
};

let state = { dashboard: null, demo: [], centers: [], payments: [], tariffs: [], currentPage: "dashboard" };

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

function api(path, options = {}) {
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(localStorage.getItem(TOKEN) ? { Authorization: "Bearer " + localStorage.getItem(TOKEN) } : {}),
      ...(options.headers || {}),
    },
  }).then(async (r) => {
    let d = {};
    try { d = await r.json(); } catch {}
    if (r.status === 401) {
      logout(false);
      throw new Error(d.error || "Unauthorized");
    }
    if (!r.ok || d.ok === false) throw new Error(d.realError || d.error || "API xato");
    return d;
  });
}

function renderIcons() {
  $$("[data-icon]").forEach((e) => (e.innerHTML = icons[e.dataset.icon] || icons.dashboard));
}

function fmt(d) {
  if (!d) return "-";
  try {
    return new Intl.DateTimeFormat("uz-UZ", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(d));
  } catch { return "-"; }
}

function money(n) {
  return Number(n || 0).toLocaleString("uz-UZ");
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
}

function badge(s) {
  const val = s || "-";
  let c = "blue";
  if (["Active", "To‘landi", "Mijoz bo‘ldi"].includes(val)) c = "green";
  if (["Trial", "Kutilmoqda", "Demo belgilandi", "Bog‘lanildi", "Tayinlanmagan"].includes(val)) c = "orange";
  if (["Suspended", "Qarzdor", "Rad etildi", "Muddat o‘tgan", "Expired"].includes(val)) c = "red";
  return `<span class="badge ${c}">${esc(val)}</span>`;
}

function toast(t) {
  let x = $(".ceo-toast");
  if (!x) {
    x = document.createElement("div");
    x.className = "ceo-toast";
    document.body.appendChild(x);
  }
  x.textContent = t;
  x.classList.add("show");
  setTimeout(() => x.classList.remove("show"), 3500);
}

function table(el, heads, rows, map, empty = "Ma’lumot yo‘q") {
  if (!el) return;
  el.innerHTML = `
    <thead><tr>${heads.map((h) => `<th>${h}</th>`).join("")}<th>Amal</th></tr></thead>
    <tbody>${
      rows.length
        ? rows.map((r, i) => `<tr>${map(r, i)}<td><button class="row-action" data-detail="${r.id}">Ochish</button></td></tr>`).join("")
        : `<tr><td colspan="${heads.length + 1}" class="empty-cell">${empty}</td></tr>`
    }</tbody>`;
}

function demoRow(x) {
  return `<td><b>${esc(x.name)}</b></td><td>${esc(x.center)}</td><td>${esc(x.phone)}</td><td>${esc(x.payment || "-")}</td><td>${badge(x.status)}</td><td>${esc(x.manager || "-")}</td><td>${fmt(x.createdAt)}</td>`;
}

function updateStats(s = {}) {
  const set = (id, val) => { const e = $(id); if (e) e.textContent = val; };
  set("#statDemoTotal", s.demoTotal || 0);
  set("#statDemoToday", s.demoToday || 0);
  set("#statCentersTotal", s.centersTotal || 0);
  set("#statCentersActive", s.centersActive || 0);
  set("#statPaymentsPaid", money(s.paymentsPaid || 0));
  set("#statDebt", s.centersDebt || 0);
  set("#statDemoNew", s.demoNew || 0);
  set("#statDemoConverted", s.demoConverted || 0);
  const bell = $(".ceo-bell b");
  if (bell) bell.textContent = s.demoNew || 0;
  const nav = $('[data-page="demo"] b');
  if (nav) nav.textContent = s.demoNew || 0;
}

async function loadDashboard() {
  const d = await api("/api/ceo/dashboard");
  state.dashboard = d;
  updateStats(d.stats || {});
  table($("#recentDemoTable"), ["Ism", "Markaz", "Telefon", "To‘lov", "Status", "Menejer", "Vaqt"], d.recentDemoRequests || [], demoRow, "Hali demo so‘rov kelmagan");
  const act = $("#activityList");
  if (act) {
    act.innerHTML = (d.activity || []).length
      ? d.activity.map((x) => `<p><b>${esc(x.action)}</b><span>${fmt(x.created_at)}</span></p>`).join("")
      : `<p><b>Hali faoliyat yo‘q</b><span>—</span></p>`;
  }
  const recentCenters = $("#recentCenters");
  if (recentCenters) {
    recentCenters.innerHTML = (d.recentCenters || []).length
      ? d.recentCenters.map((c) => `<article><b>${esc(c.name)}</b><span>${esc(c.subdomain)}</span>${badge(c.status)}</article>`).join("")
      : `<div class="empty-mini">Hali markaz yo‘q</div>`;
  }
}

async function loadDemo() {
  const f = $(".filter.active")?.dataset.demoFilter || "all";
  const q = $("#demoSearch")?.value || "";
  const qs = new URLSearchParams();
  if (f !== "all") qs.set("status", f);
  if (q) qs.set("q", q);
  const d = await api(`/api/ceo/demo-requests?${qs.toString()}`);
  state.demo = d.demoRequests || [];
  table($("#demoTable"), ["Ism", "Markaz", "Telefon", "To‘lov", "Status", "Menejer", "Vaqt"], state.demo, demoRow, "Hali demo so‘rov yo‘q");
}

async function loadCenters() {
  const q = $("#centerSearch")?.value || "";
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  const d = await api(`/api/ceo/centers${qs}`);
  state.centers = d.centers || [];
  const grid = $("#centerGrid");
  if (!grid) return;
  grid.innerHTML = state.centers.length
    ? state.centers.map((c) => `
      <article class="center-card" data-center="${c.id}">
        <div class="card-top">
          <div><h3>${esc(c.name)}</h3><p>${esc(c.subdomain || "-")}</p></div>${badge(c.status)}
        </div>
        <div class="center-meta">
          <span>Egasi <b>${esc(c.ownerName || "-")}</b></span>
          <span>Telefon <b>${esc(c.ownerPhone || "-")}</b></span>
          <span>Tarif <b>${esc(c.tariff || "Start")}</b></span>
          <span>Oylik <b>${money(c.monthlyPayment)}</b></span>
          <span>Trial <b>${c.trialEndsAt ? fmt(c.trialEndsAt) : "-"}</b></span>
          <span>Yaratildi <b>${fmt(c.createdAt)}</b></span>
        </div>
        <div class="card-actions">
          <label>Trial <select data-trial-days="${c.id}"><option value="3">3 kun</option><option value="7" selected>7 kun</option><option value="10">10 kun</option></select></label><button data-trial-center="${c.id}">Trial belgilash</button><button data-delete-center="${c.id}" style="color:#F04438">Butunlay o‘chirish</button>
          <button data-edit-center="${c.id}">Tahrirlash</button>
          <button data-center-status="${c.id}" data-status="Active">Active</button>
          <button data-center-status="${c.id}" data-status="Suspended">To‘xtatish</button>
        </div>
      </article>`).join("")
    : `<div class="empty-panel">Hali o‘quv markaz yo‘q. Demo so‘rovdan markaz yaratishingiz mumkin.</div>`;
}

async function loadTariffs() {
  const d = await api("/api/ceo/tariffs");
  state.tariffs = d.tariffs || [];
  const grid = $("#tariffGrid");
  if (!grid) return;
  grid.innerHTML = state.tariffs.length
    ? state.tariffs.map((t) => `
      <article class="tariff-card">
        <div class="card-top"><h3>${esc(t.name)}</h3>${badge(t.is_active ? "Active" : "Inactive")}</div>
        <p>${t.student_limit} o‘quvchi / ${t.branch_limit} filial</p>
        <h2>${money(t.monthly_price)} so‘m</h2>
        <ul>${(t.features || []).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      </article>`).join("")
    : `<div class="empty-panel">Tariflar yo‘q</div>`;
}

async function loadPayments() {
  const d = await api("/api/ceo/payments");
  state.payments = d.payments || [];
  table($("#paymentsTable"), ["Markaz", "Tarif", "Summa", "Status", "Keyingi to‘lov"], state.payments, (x) =>
    `<td>${esc(x.center || "-")}</td><td>${esc(x.tariff || "-")}</td><td>${money(x.amount)}</td><td>${badge(x.status)}</td><td>${x.nextDate ? fmt(x.nextDate) : "-"}</td>`, "Hali to‘lovlar yo‘q");
}

function renderRoles() {
  const roles = [
    ["CEO", "Barcha ruxsatlar", "7/7 modul"],
    ["Admin", "Platforma admini", "5/7 modul"],
    ["Sales manager", "Demo va markaz yaratish", "2/7 modul"],
    ["Finance manager", "To‘lovlar va obunalar", "2/7 modul"],
    ["Support manager", "Support so‘rovlari", "1/7 modul"],
    ["Viewer", "Faqat ko‘rish", "Read only"],
  ];
  $("#rolesGrid").innerHTML = roles.map((r) => `<article class="role-card"><h3>${r[0]}</h3><p>${r[1]}</p><span class="badge blue">${r[2]}</span></article>`).join("");
}

const smsLabels={processing:'Jarayonda — qayta yubormang',accepted:'Eskiz qabul qildi',failed:'Rad etildi',unknown:'Natija noma’lum — Eskiz tarixini tekshiring'};
let smsRequestKey=null,smsPayload=null;
async function loadSms(){
 const [status,history]=await Promise.all([api('/api/sms/status'),api('/api/sms/history')]);
 $('#smsStatus').textContent=status.configured?`Eskiz sozlamalari mavjud. Yuboruvchi: ${status.from}. Ulanishni tekshirish tugmasini bosing.`:'Railway’da ESKIZ_EMAIL va ESKIZ_PASSWORD qiymatlarini tekshiring.';
 $('#smsHistory').innerHTML='<thead><tr><th>Sana</th><th>Telefon</th><th>Matn</th><th>Holat</th><th>Izoh</th></tr></thead><tbody>'+history.messages.map(m=>`<tr><td>${esc(fmt(m.created_at))}</td><td>${esc(m.phone)}</td><td style="max-width:320px;white-space:pre-wrap;overflow-wrap:anywhere">${esc(m.message)}</td><td>${esc(smsLabels[m.status]||m.status)}</td><td>${esc(m.error||'—')}</td></tr>`).join('')+'</tbody>';
 if(!history.messages.length)$('#smsHistory').innerHTML='<tbody><tr><td>Hozircha SMS yuborilmagan.</td></tr></tbody>';
}
async function sendSms(e){e.preventDefault();const body={phone:$('#smsPhone').value,message:$('#smsMessage').value};const payload=JSON.stringify(body);if(payload!==smsPayload){smsPayload=payload;smsRequestKey=crypto.randomUUID()}
 if(!confirm(`${body.phone} raqamiga ushbu SMS yuborilsinmi?\n\n${body.message}`))return;
 const button=$('#smsSend');button.disabled=true;$('#smsNew').disabled=true;$('#smsResult').textContent='Yuborilmoqda…';
 try{const d=await api('/api/sms/send',{method:'POST',headers:{'Idempotency-Key':smsRequestKey},body:payload});$('#smsResult').textContent=(smsLabels[d.status]||d.status)+(d.error?' — '+d.error:'')+(d.duplicate?' (oldingi so‘rov natijasi)':'');await loadSms()}catch(err){$('#smsResult').textContent=err.message}finally{button.disabled=false;$('#smsNew').disabled=false}
}

async function loadSettings() {
  const d = await api("/api/ceo/settings");
  const s = d.settings || {};
  const map = {
    platform_name: "#settingPlatformName",
    call_center_phone: "#settingCallPhone",
    sales_telegram: "#settingSalesTelegram",
    support_telegram: "#settingSupportTelegram",
    default_trial_days: "#settingTrialDays",
    default_language: "#settingLang",
  };
  Object.entries(map).forEach(([k, sel]) => { if ($(sel) && s[k]) $(sel).value = s[k]; });
  const a = await api("/api/ceo/audit");
  $("#auditList").innerHTML = (a.auditLogs || []).length
    ? a.auditLogs.map((x) => `<p><b>${esc(x.action)}</b><span>${fmt(x.created_at)}</span></p>`).join("")
    : `<p><b>Hali audit log yo‘q</b><span>—</span></p>`;
}

async function openPage(p) {
  state.currentPage = p;
  $$(".ceo-page").forEach((x) => x.classList.toggle("active", x.dataset.view === p));
  $$(".ceo-nav button").forEach((x) => x.classList.toggle("active", x.dataset.page === p));
  $("#pageTitle").textContent = titles[p] || titles.dashboard;
  history.replaceState(null, "", p === "dashboard" ? "/ceo/dashboard" : `/ceo/${p === "demo" ? "demo-requests" : p}`);
  try {
    if (p === "dashboard") await loadDashboard();
    if (p === "demo") await loadDemo();
    if (p === "centers") await loadCenters();
    if (p === "tariffs") await loadTariffs();
    if (p === "payments") await loadPayments();
    if (p === "roles") renderRoles();
    if (p === "settings") await loadSettings();
    if (p === "sms") await loadSms();
  } catch (e) { toast(e.message); }
}

function showLogin() {
  document.body.classList.add("ceo-locked");
  $("#ceoLoginPage").hidden = false;
  $("#ceoApp").hidden = true;
}

async function showApp() {
  document.body.classList.remove("ceo-locked");
  $("#ceoLoginPage").hidden = true;
  $("#ceoApp").hidden = false;
  const u = JSON.parse(localStorage.getItem(USER) || "{}");
  if (u.email) {
    $(".ceo-profile strong").textContent = u.role || "CEO";
    $(".ceo-profile span").textContent = u.email;
  }
  const path = location.pathname;
  let p = "dashboard";
  if (path.includes("demo")) p = "demo";
  if (path.includes("centers")) p = "centers";
  if (path.includes("tariffs")) p = "tariffs";
  if (path.includes("payments")) p = "payments";
  if (path.includes("roles")) p = "roles";
  if (path.includes("settings")) p = "settings";
  if (path.includes("sms")) p = "sms";
  await openPage(p);
}

async function login() {
  const d = await api("/api/ceo/login", {
    method: "POST",
    body: JSON.stringify({ email: $("#ceoEmail").value, password: $("#ceoPassword").value }),
  });
  localStorage.setItem(TOKEN, d.token);
  localStorage.setItem(USER, JSON.stringify(d.user));
  await showApp();
}

function logout(red = true) {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(USER);
  if (red) history.replaceState(null, "", "/ceo/login");
  showLogin();
}

function openDemoModal(r) {
  $("#modalBody").innerHTML = `
    <div class="detail-list">
      <p><span>Ism</span>${esc(r.name)}</p>
      <p><span>Markaz</span>${esc(r.center)}</p>
      <p><span>Telefon</span>${esc(r.phone)}</p>
      <p><span>To‘lov rejimi</span>${esc(r.payment || "-")}</p>
      <p><span>Status</span>${esc(r.status)}</p>
      <p><span>Menejer</span>${esc(r.manager || "-")}</p>
      <p><span>Kelgan vaqt</span>${fmt(r.createdAt)}</p>
      <label>Menejer
        <input id="modalManager" value="${esc(r.manager === "Tayinlanmagan" ? "" : (r.manager || ""))}" placeholder="Masalan: Sales manager">
      </label>
      <label>Izoh
        <textarea id="modalNote" placeholder="Qo‘shimcha izoh">${esc(r.note || "")}</textarea>
      </label>
      <div class="modal-actions">
        <button class="primary-action" data-convert="${r.id}">O‘quv markazga aylantirish</button>
        <button class="secondary-action" data-set-status="Bog‘lanildi" data-id="${r.id}">Bog‘lanildi</button>
        <button class="secondary-action" data-set-status="Demo belgilandi" data-id="${r.id}">Demo belgilandi</button>
        <button class="danger-action" data-set-status="Rad etildi" data-id="${r.id}">Rad etildi</button>
      </div>
    </div>`;
  $("#demoModal").hidden = false;
}

async function convertDemo(id) {
  const d = await api(`/api/ceo/demo-requests/${id}/convert-to-center`, { method: "POST" });
  $("#demoModal").hidden = true;
  toast(d.alreadyConverted ? "Bu so‘rov avval markazga aylantirilgan" : "O‘quv markaz yaratildi");
  await openPage("centers");
}

async function updateDemo(id, status) {
  await api(`/api/ceo/demo-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      manager: $("#modalManager")?.value || undefined,
      note: $("#modalNote")?.value || undefined,
    }),
  });
  $("#demoModal").hidden = true;
  toast("Demo so‘rov yangilandi");
  await openPage(state.currentPage);
}

async function updateCenterStatus(id, status) {
  await api(`/api/ceo/centers/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  toast("Markaz statusi yangilandi");
  await loadCenters();
}

async function saveSettings() {
  await api("/api/ceo/settings", {
    method: "PATCH",
    body: JSON.stringify({
      platform_name: $("#settingPlatformName")?.value,
      call_center_phone: $("#settingCallPhone")?.value,
      sales_telegram: $("#settingSalesTelegram")?.value,
      support_telegram: $("#settingSupportTelegram")?.value,
      default_trial_days: $("#settingTrialDays")?.value,
      default_language: $("#settingLang")?.value,
    }),
  });
  toast("Sozlamalar saqlandi");
  await loadSettings();
}

document.addEventListener("DOMContentLoaded", async () => {
  renderIcons();
  $('#smsForm')?.addEventListener('submit',sendSms);
  $('#smsForm')?.addEventListener('reset',()=>{smsRequestKey=null;smsPayload=null;$('#smsResult').textContent='';$('#smsCount').textContent='0 / 1000 belgi'});
  $('#smsMessage')?.addEventListener('input',()=>{$('#smsCount').textContent=$('#smsMessage').value.length+' / 1000 belgi'});
  $('#smsRefresh')?.addEventListener('click',()=>loadSms().catch(e=>toast(e.message)));
  $('#smsCheck')?.addEventListener('click',async()=>{const b=$('#smsCheck');b.disabled=true;try{const d=await api('/api/sms/check',{method:'POST',body:'{}'});$('#smsStatus').textContent=d.message}catch(e){$('#smsStatus').textContent=e.message}finally{b.disabled=false}});


  $("#ceoLoginForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    login().catch((err) => toast(err.message));
  });

  $("#ceoLogout")?.addEventListener("click", () => logout(true));
  $("#saveSettings")?.addEventListener("click", (e) => { e.preventDefault(); saveSettings().catch((err) => toast(err.message)); });
  $("#demoSearch")?.addEventListener("input", () => loadDemo().catch((err) => toast(err.message)));
  $("#centerSearch")?.addEventListener("input", () => loadCenters().catch((err) => toast(err.message)));

  $$("[data-page]").forEach((b) => b.addEventListener("click", () => openPage(b.dataset.page)));
  $$("[data-page-jump]").forEach((b) => b.addEventListener("click", () => openPage(b.dataset.pageJump)));
  $$("[data-close-modal]").forEach((x) => x.addEventListener("click", () => ($("#demoModal").hidden = true)));

  $$(".filter").forEach((f) => f.addEventListener("click", () => {
    $$(".filter").forEach((x) => x.classList.remove("active"));
    f.classList.add("active");
    loadDemo().catch((err) => toast(err.message));
  }));

  document.addEventListener("click", (e) => {
    const detail = e.target.closest("[data-detail]");
    if (detail) {
      const r = state.demo.find((x) => x.id === detail.dataset.detail) ||
        (state.dashboard?.recentDemoRequests || []).find((x) => x.id === detail.dataset.detail);
      if (r) openDemoModal(r);
    }

    const convert = e.target.closest("[data-convert]");
    if (convert) convertDemo(convert.dataset.convert).catch((err) => toast(err.message));

    const st = e.target.closest("[data-set-status]");
    if (st) updateDemo(st.dataset.id, st.dataset.setStatus).catch((err) => toast(err.message));

    const trial = e.target.closest('[data-trial-center]');
    if(trial){const id=trial.dataset.trialCenter;const days=Number(document.querySelector(`[data-trial-days="${id}"]`).value);if(confirm(`Trial bugundan ${days} kunga belgilanadi. Tasdiqlaysizmi?`)){trial.disabled=true;api(`/api/ceo/centers/${id}/trial`,{method:'POST',body:JSON.stringify({days})}).then(()=>{toast('Trial belgilandi');return loadCenters()}).catch(err=>{toast(err.message);trial.disabled=false})}}
    const del = e.target.closest('[data-delete-center]');
    if(del){const c=state.centers.find(c=>c.id===del.dataset.deleteCenter);const confirmName=prompt(`DIQQAT: ${c.name} markazi, hisoblari va barcha ma’lumotlari qayta tiklab bo‘lmaydigan tarzda o‘chiriladi. Tasdiqlash uchun markaz nomini aynan kiriting: ${c.name}`);if(confirmName===c.name){del.disabled=true;api(`/api/ceo/centers/${c.id}`,{method:'DELETE',body:JSON.stringify({confirmName})}).then(()=>{toast('Markaz butunlay o‘chirildi');return loadCenters()}).catch(err=>{toast(err.message);del.disabled=false})}else if(confirmName!==null)toast('Markaz nomi mos kelmadi')}
    const cs = e.target.closest("[data-center-status]");
    if (cs) updateCenterStatus(cs.dataset.centerStatus, cs.dataset.status).catch((err) => toast(err.message));
  });

  setTimeout(() => $("#ceoLoader")?.classList.add("hide"), 450);

  if (localStorage.getItem(TOKEN)) {
    try {
      await api("/api/ceo/me");
      await showApp();
    } catch {
      logout(false);
    }
  } else {
    showLogin();
  }

  setInterval(() => {
    if (localStorage.getItem(TOKEN) && ["dashboard", "demo"].includes(state.currentPage)) {
      openPage(state.currentPage);
    }
  }, 7000);
});
