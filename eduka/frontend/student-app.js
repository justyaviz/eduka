(() => {
  "use strict";

  const VERSION = "24.1.0";
  const TOKEN_KEY = "eduka_student_token";
  const screen = document.querySelector("[data-student-screen]");
  const tg = window.Telegram?.WebApp || null;
  const qs = new URLSearchParams(location.search);
  const state = { token: "", data: null, botUrl: "https://t.me/eduka_student_bot" };

  const routes = new Set([
    "welcome", "telegram", "login", "home", "schedule", "payments", "attendance", "coins", "rewards",
    "my-rewards", "ranking", "achievements", "notifications", "materials", "homework", "tests", "profile", "security"
  ]);

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (v) => String(v ?? "").replace(/[&<>'"]/g, (ch) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[ch]));
  const number = (v) => Number(v || 0).toLocaleString("uz-UZ");
  const money = (v) => `${number(v)} so'm`;
  const date = (v) => v ? new Date(v).toLocaleDateString("uz-UZ") : "—";
  const today = new Date();
  const logo = "/assets/logo_icon.webp";

  const pageTitle = {
    home: "Bosh sahifa", schedule: "Jadval", payments: "To'lovlar", attendance: "Davomat",
    coins: "Coin Wallet", rewards: "Sovg'alar do'koni", "my-rewards": "Mening sovg'alarim",
    ranking: "Reyting", achievements: "Yutuqlar", notifications: "Bildirishnomalar",
    materials: "Materiallar", homework: "Uyga vazifa", tests: "Testlar", profile: "Profil", security: "Xavfsizlik"
  };

  function toast(message, type = "info") {
    const host = $("[data-toast-host]");
    if (!host) return;
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    const icon = type === "success" ? "check" : type === "error" ? "lock" : type === "warning" ? "bell" : "book";
    el.innerHTML = `${svg(icon)}<span>${esc(message || "Xabar")}</span>`;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 260); }, 3600);
  }

  function haptic(type = "light") {
    try { tg?.HapticFeedback?.impactOccurred?.(type); } catch {}
  }

  function setBusy(el, busy = true, label = "Kutilmoqda...") {
    if (!el) return;
    if (busy) {
      el.dataset.oldText = el.innerHTML;
      el.disabled = true;
      el.classList.add("is-busy");
      el.innerHTML = `<span class="btn-spinner"></span>${esc(label)}`;
    } else {
      el.disabled = false;
      el.classList.remove("is-busy");
      if (el.dataset.oldText) el.innerHTML = el.dataset.oldText;
    }
  }

  function confirmSheet({ title = "Tasdiqlaysizmi?", message = "Amalni bajarish davom ettirilsinmi?", ok = "Tasdiqlash", cancel = "Bekor qilish", icon = "gift" } = {}) {
    return new Promise((resolve) => {
      const root = document.createElement("div");
      root.className = "modal-backdrop-24";
      root.innerHTML = `<section class="confirm-sheet-24">${svg(icon)}<h2>${esc(title)}</h2><p>${esc(message)}</p><div class="confirm-actions-24"><button class="ghost-24" data-no>${esc(cancel)}</button><button class="primary-24" data-yes>${esc(ok)}</button></div></section>`;
      document.body.appendChild(root);
      requestAnimationFrame(() => root.classList.add("show"));
      const close = (v) => { root.classList.remove("show"); setTimeout(() => root.remove(), 220); resolve(v); };
      root.addEventListener("click", (e) => { if (e.target === root) close(false); });
      root.querySelector("[data-no]").onclick = () => close(false);
      root.querySelector("[data-yes]").onclick = () => { haptic("medium"); close(true); };
    });
  }

  function initials(name) {
    return String(name || "Eduka").split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "ED";
  }

  function extractPathToken() {
    const m = location.pathname.match(/\/app\/open\/([^/?#]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  function route() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts[0] === "app" && parts[1] === "open") return "home";
    if (parts[0] === "app" && routes.has(parts[1])) return parts[1];
    if (location.hostname.startsWith("student.")) return "login";
    return "welcome";
  }

  function setRoute(name, replace = false) {
    const target = routes.has(name) ? name : "home";
    const path = target === "welcome" ? "/app" : `/app/${target}`;
    haptic("light");
    screen.classList.add("route-leave-24");
    setTimeout(() => {
      if (replace) history.replaceState({}, "", path);
      else history.pushState({}, "", path);
      renderRoute(target);
    }, 90);
  }

  function setToken(token) {
    state.token = token || "";
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (!(options.body instanceof FormData)) headers["Content-Type"] = headers["Content-Type"] || "application/json";
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 18000);
    try {
      const res = await fetch(path, { ...options, headers, cache: "no-store", signal: controller.signal });
      const text = await res.text();
      let json = {};
      try { json = text ? JSON.parse(text) : {}; } catch { json = { ok: false, message: text || "Server javobi noto'g'ri" }; }
      if (!res.ok || json.ok === false) throw new Error(json.message || `Xatolik: ${res.status}`);
      return json;
    } catch (err) {
      if (err?.name === "AbortError") throw new Error("Server javobi kechikdi. Internetni tekshirib qayta urinib ko‘ring.");
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function loadBotInfo() {
    try {
      const info = await fetch(`/api/telegram/student-bot-info?v=${VERSION}`, { cache: "no-store" }).then((r) => r.json());
      const username = info?.username || info?.bot_username || info?.botUsername;
      if (username) state.botUrl = `https://t.me/${String(username).replace(/^@/, "")}`;
    } catch {}
  }

  async function authTelegramIfPossible() {
    const initData = tg?.initData || "";
    const userId = tg?.initDataUnsafe?.user?.id || "";
    if (!initData && !userId) return false;
    try {
      const payload = await api("/api/student-app/auth/telegram", {
        method: "POST",
        body: JSON.stringify({ init_data: initData, telegram_user_id: userId })
      });
      if (payload.token) setToken(payload.token);
      state.data = payload;
      return true;
    } catch { return false; }
  }

  async function load() {
    const payload = await api(`/api/student-app/me?v=${VERSION}`);
    state.data = payload;
    return payload;
  }

  function enabled(key) {
    if (!state.data) return true;
    const e = state.data.enabled || {};
    const aliases = { ranking: "rating", rewards: "rewards", coins: "coins", homework: "homework", tests: "tests" };
    const real = aliases[key] || key;
    return Object.prototype.hasOwnProperty.call(e, real) ? Boolean(e[real]) : true;
  }

  function svg(type, cls = "") {
    const common = `class="ui-3d ${cls}" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"`;
    const defs = `<defs><linearGradient id="g1" x1="12" y1="8" x2="82" y2="88"><stop stop-color="#55B8FF"/><stop offset="1" stop-color="#075CFF"/></linearGradient><linearGradient id="g2" x1="16" y1="4" x2="72" y2="88"><stop stop-color="#FFD36A"/><stop offset="1" stop-color="#F59E0B"/></linearGradient><filter id="sh" x="0" y="0" width="120" height="120" filterUnits="userSpaceOnUse"><feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#0F3C7A" flood-opacity=".18"/></filter></defs>`;
    const base = {
      home: `${defs}<rect x="14" y="20" width="68" height="58" rx="22" fill="url(#g1)" filter="url(#sh)"/><path d="M28 47L48 30L68 47" stroke="white" stroke-width="8" stroke-linecap="round"/><path d="M36 48V67H60V48" stroke="white" stroke-width="8" stroke-linecap="round"/>`,
      calendar: `${defs}<rect x="14" y="18" width="68" height="62" rx="18" fill="url(#g1)" filter="url(#sh)"/><path d="M30 14v14M66 14v14M14 39h68" stroke="white" stroke-width="7" stroke-linecap="round"/><rect x="29" y="50" width="12" height="12" rx="4" fill="white"/><rect x="55" y="50" width="12" height="12" rx="4" fill="#BFE4FF"/>`,
      wallet: `${defs}<rect x="13" y="28" width="70" height="46" rx="18" fill="url(#g1)" filter="url(#sh)"/><path d="M22 31L59 16c8-3 14 1 16 8l1 4" fill="#BFE4FF"/><rect x="57" y="43" width="26" height="18" rx="9" fill="#DFF2FF"/><circle cx="67" cy="52" r="4" fill="#075CFF"/>`,
      coin: `${defs}<ellipse cx="48" cy="64" rx="30" ry="12" fill="#E89000" opacity=".24"/><circle cx="48" cy="43" r="29" fill="url(#g2)" filter="url(#sh)"/><circle cx="48" cy="43" r="20" fill="#FFE6A3"/><path d="M39 45c3 8 16 8 18 0 2-8-16-4-14-12 2-7 13-6 16 0" stroke="#B66D00" stroke-width="6" stroke-linecap="round"/><path d="M48 24v38" stroke="#B66D00" stroke-width="5" stroke-linecap="round"/>`,
      gift: `${defs}<rect x="18" y="39" width="60" height="38" rx="12" fill="url(#g1)" filter="url(#sh)"/><rect x="44" y="34" width="9" height="43" fill="#FFD36A"/><path d="M16 38h64" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M47 34c-8-17-26-7-16 4 7 8 16-4 16-4Zm4 0c8-17 26-7 16 4-7 8-16-4-16-4Z" fill="#FFD36A"/>`,
      trophy: `${defs}<path d="M32 19h32v22c0 14-9 24-16 24S32 55 32 41V19Z" fill="url(#g2)" filter="url(#sh)"/><path d="M32 25H19c0 16 7 25 17 27M64 25h13c0 16-7 25-17 27" stroke="#F59E0B" stroke-width="8" stroke-linecap="round"/><path d="M48 65v12M32 79h32" stroke="#B66D00" stroke-width="8" stroke-linecap="round"/>`,
      bell: `${defs}<path d="M25 65h46l-5-8V41c0-11-7-20-18-20S30 30 30 41v16l-5 8Z" fill="url(#g1)" filter="url(#sh)"/><path d="M40 70c3 8 13 8 16 0" stroke="#075CFF" stroke-width="7" stroke-linecap="round"/><circle cx="69" cy="26" r="9" fill="#F59E0B"/>`,
      book: `${defs}<path d="M18 22h26c8 0 12 5 12 12v42H30c-7 0-12-5-12-12V22Z" fill="url(#g1)" filter="url(#sh)"/><path d="M78 22H56c-8 0-12 5-12 12v42h22c7 0 12-5 12-12V22Z" fill="#BFE4FF"/><path d="M32 39h13M32 52h13M59 39h9M59 52h9" stroke="white" stroke-width="5" stroke-linecap="round"/>`,
      check: `${defs}<rect x="18" y="18" width="60" height="60" rx="22" fill="url(#g1)" filter="url(#sh)"/><path d="M31 49l11 11 24-28" stroke="white" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
      document: `${defs}<rect x="24" y="13" width="46" height="66" rx="14" fill="url(#g1)" filter="url(#sh)"/><path d="M57 13v18h13" fill="#BFE4FF"/><path d="M34 43h25M34 55h25M34 67h15" stroke="white" stroke-width="5" stroke-linecap="round"/><path d="M63 63l12 12" stroke="#F59E0B" stroke-width="8" stroke-linecap="round"/>`,
      quiz: `${defs}<rect x="18" y="16" width="60" height="64" rx="20" fill="url(#g1)" filter="url(#sh)"/><circle cx="34" cy="37" r="6" fill="white"/><path d="M47 37h17M34 56h30" stroke="white" stroke-width="6" stroke-linecap="round"/><path d="M30 57l5 5 10-13" stroke="#FFD36A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
      user: `${defs}<circle cx="48" cy="32" r="18" fill="url(#g1)" filter="url(#sh)"/><path d="M19 78c4-18 18-27 29-27s25 9 29 27" fill="#BFE4FF"/><path d="M19 78h58" stroke="#075CFF" stroke-width="8" stroke-linecap="round"/>`,
      lock: `${defs}<rect x="22" y="40" width="52" height="38" rx="16" fill="url(#g1)" filter="url(#sh)"/><path d="M34 41V31c0-10 6-17 14-17s14 7 14 17v10" stroke="#0B63CE" stroke-width="8" stroke-linecap="round"/><circle cx="48" cy="59" r="6" fill="white"/>`
    };
    return `<svg ${common}>${base[type] || base.home}</svg>`;
  }

  function miniIcon(type) { return `<span class="mini-3d">${svg(type)}</span>`; }

  function statusPill(status) {
    const s = String(status || "").toLowerCase();
    const cls = s.includes("paid") || s.includes("active") || s.includes("approved") || s.includes("delivered") || s.includes("keldi") || s.includes("present") ? "green" : s.includes("reject") || s.includes("debt") || s.includes("absent") || s.includes("kelmadi") ? "red" : s.includes("pending") || s.includes("late") || s.includes("kech") ? "orange" : "";
    return `<span class="pill ${cls}">${esc(status || "—")}</span>`;
  }

  function empty(text, type = "document") { return `<div class="empty-24">${svg(type)}<b>Ma'lumot yo'q</b><p>${esc(text)}</p></div>`; }
  function skeleton(count = 5) { return `<div class="list-24">${Array.from({ length: count }, () => `<div class="skeleton-24"></div>`).join("")}</div>`; }

  function row(title, sub = "", right = "", type = "document") {
    return `<article class="row-24">${miniIcon(type)}<div><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</div>${right ? `<span class="right-24">${esc(right)}</span>` : ""}</article>`;
  }

  function nav(active = "home") {
    const items = [
      ["home", "home", "Bosh"], ["schedule", "calendar", "Jadval"], ["payments", "wallet", "To'lov"], ["coins", "coin", "Coin"], ["profile", "user", "Profil"]
    ];
    return `<nav class="dock-24" aria-label="Student App menu">${items.filter(([k]) => enabled(k) || ["home", "profile"].includes(k)).map(([k, icon, label]) => `<button class="${active === k ? "active" : ""}" data-go="${k}">${svg(icon)}<b>${label}</b></button>`).join("")}</nav>`;
  }

  function bindNav() {
    $$('[data-go]').forEach((btn) => btn.onclick = () => setRoute(btn.dataset.go));
    bindMicroInteractions();
  }

  function bindMicroInteractions(root = screen) {
    $$('button, .primary-24, .ghost-24, .danger-24, .row-24, .reward-24', root).forEach((el) => {
      if (el.dataset.rippleBound) return;
      el.dataset.rippleBound = "1";
      el.addEventListener('pointerdown', (e) => {
        const r = document.createElement('span');
        const rect = el.getBoundingClientRect();
        r.className = 'ripple-24';
        r.style.left = `${e.clientX - rect.left}px`;
        r.style.top = `${e.clientY - rect.top}px`;
        el.appendChild(r);
        setTimeout(() => r.remove(), 520);
      }, { passive: true });
    });
  }

  function header(title, subtitle = "", back = true, icon = "home") {
    return `<header class="head-24">${back ? `<button class="head-action" data-go="home" aria-label="Orqaga">${svg("home")}</button>` : `<img class="head-logo" src="${logo}" alt="Eduka"/>`}<div><h2>${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}</div><button class="head-action" data-go="notifications" aria-label="Bildirishnomalar">${svg(icon === "bell" ? "bell" : "bell")}</button></header>`;
  }

  function renderWelcome() {
    screen.innerHTML = `<section class="welcome-24"><div class="orb-24">${svg("book")}</div><img class="welcome-logo" src="${logo}" alt="Eduka"/><h1>EDUKA</h1><p>Premium Student App: dars, to'lov, davomat, coin, sovg'alar va o'quv materiallari bitta joyda.</p><button class="primary-24" data-start>Student Appga kirish</button><small>Telegram bot yoki student.eduka.uz orqali xavfsiz kirish.</small></section>`;
    $('[data-start]').onclick = () => renderAuthHub();
  }

  function renderAuthHub(message = "") {
    screen.innerHTML = `<section class="access-24"><div class="access-hero-24"><img src="${logo}" alt="Eduka"/><h1>Student App Pro</h1><p>2 xil kirish: Telegram bot orqali tezkor tasdiqlash yoki student.eduka.uz domenida login/parol.</p>${message ? `<div class="alert-24">${esc(message)}</div>` : ""}</div><div class="access-grid-24"><button data-telegram><span>${svg("bell")}</span><b>Telegram Access</b><small>Botda telefon va kodni tasdiqlaysiz. Dashboard avtomatik ochiladi.</small></button><button data-domain><span>${svg("lock")}</span><b>Domain Login</b><small>student.eduka.uz orqali login/telefon va parol bilan kirish.</small></button></div></section>`;
    $('[data-telegram]').onclick = () => renderTelegramAccess();
    $('[data-domain]').onclick = () => renderDomainLogin();
  }

  function renderTelegramAccess() {
    screen.innerHTML = `<section class="access-24"><button class="head-action floating" data-auth>${svg("home")}</button><div class="access-hero-24">${svg("bell", "hero-svg")}<h1>Telegram bot orqali kirish</h1><p>Botda telefon raqam va Student App kodini tasdiqlang. Tasdiqlashdan keyin tokenli tugma sizni login sahifasiz dashboardga olib kiradi.</p></div><div class="list-24">${row("Xavfsiz bog'lash", "Telegram ID talaba profilingizga ulanadi", "", "lock")}${row("Tokenli kirish", "Student App /app/open/TOKEN orqali ochiladi", "", "check")}${row("Qayta start kerak emas", "Ulangan bo'lsangiz, bot darhol App tugmasini beradi", "", "bell")}</div><a class="primary-24 link" href="${esc(state.botUrl)}">Telegram botga o'tish</a></section>`;
    $('[data-auth]').onclick = () => renderAuthHub();
  }

  function renderDomainLogin() {
    screen.innerHTML = `<section class="access-24"><button class="head-action floating" data-auth>${svg("home")}</button><div class="access-hero-24 compact"><img src="${logo}" alt="Eduka"/><h1>student.eduka.uz</h1><p>Login yoki telefon raqam va parol orqali kiring.</p></div><form class="login-24" data-domain-login><label>Login yoki telefon<input name="login" placeholder="Telefon yoki login" required autocomplete="username"/></label><label>Parol<input name="password" type="password" placeholder="Parol" required autocomplete="current-password"/></label><button class="primary-24">Kirish</button><small>Parolni unutgan bo'lsangiz, markaz administratoriga murojaat qiling.</small></form></section>`;
    $('[data-auth]').onclick = () => renderAuthHub();
    $('[data-domain-login]').onsubmit = async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button');
      const old = btn.textContent;
      btn.disabled = true; btn.textContent = "Kirilmoqda...";
      try {
        const body = Object.fromEntries(new FormData(e.target));
        const payload = await api('/api/student-app/auth/password', { method: 'POST', body: JSON.stringify(body) });
        if (payload.token) setToken(payload.token);
        await load();
        toast("Xush kelibsiz");
        setRoute('home', true);
      } catch (err) { toast(err.message); }
      finally { btn.disabled = false; btn.textContent = old; }
    };
  }

  function home() {
    const d = state.data || {}, s = d.student || {}, org = d.organization || {}, lessons = d.lessons || [], payments = d.paymentSummary || {}, coins = d.coinTransactions || [], next = lessons[0] || {};
    const rankIndex = (d.ranking || []).findIndex((x) => Number(x.student_id) === Number(s.id));
    const firstName = (s.fullName || s.full_name || "O'quvchi").split(' ')[0];
    screen.innerHTML = `<section class="home-hero-24"><header><div><img src="${logo}" alt="Eduka"/><h2>Salom, ${esc(firstName)}</h2><p>${esc(org.name || 'Eduka')} Student App</p></div><div class="avatar-24">${s.avatarUrl ? `<img src="${esc(s.avatarUrl)}"/>` : esc(initials(s.fullName || s.full_name))}</div></header><div class="hero-grid-24"><div class="hero-copy-24"><span>Bugungi dars</span><b>${esc(next.title || 'Dars belgilanmagan')}</b><small>${esc(next.time || 'Jadvalni tekshiring')} • ${esc(next.room || 'xona')}</small></div><div class="hero-art-24">${svg("book")}</div></div></section><section class="stats-24"><article>${svg("wallet")}<small>Balans</small><b>${money(s.balance || payments.balance || 0)}</b></article><article>${svg("check")}<small>Davomat</small><b>${s.attendancePercent || next.attendance_percent || 0}%</b></article><article>${svg("coin")}<small>Coin</small><b>${number(s.coins || 0)}</b></article><article>${svg("trophy")}<small>Reyting</small><b>#${rankIndex >= 0 ? rankIndex + 1 : '—'}</b></article></section><div class="section-title-24"><h2>Tezkor amallar</h2></div><div class="actions-24">${[
      ['schedule','calendar','Jadval'], ['payments','wallet','To‘lov'], ['coins','coin','Coin'], ['rewards','gift','Sovg‘alar'], ['homework','document','Vazifa'], ['materials','book','Material'], ['ranking','trophy','Reyting'], ['notifications','bell','Xabarlar']
    ].filter(([r]) => r === 'homework' ? enabled('homework') : enabled(r)).map(([r, icon, label]) => `<button data-go="${r}">${svg(icon)}<b>${label}</b></button>`).join('')}</div><div class="section-title-24"><h2>So'nggi coinlar</h2><button data-go="coins">Barchasi</button></div><div class="list-24">${coins.slice(0, 3).map((c) => row(c.reason || 'Coin berildi', c.teacher_name || c.source || date(c.created_at), `${Number(c.amount) > 0 ? '+' : ''}${number(c.amount)}`, 'coin')).join('') || empty('Hali coinlar yo‘q', 'coin')}</div>${nav('home')}`;
    bindNav();
  }

  function schedule() {
    const lessons = state.data?.lessons || [];
    const days = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
    screen.innerHTML = `${header('Jadval', 'Haftalik dars jadvali', true, 'calendar')}<div class="tabs-24"><button class="active">Hafta</button><button>Kun</button></div><div class="date-strip-24">${days.map((d, i) => `<button class="${i === 1 ? 'active' : ''}"><small>${d}</small><b>${12 + i}</b></button>`).join('')}</div><div class="list-24 lesson-list-24">${lessons.map((l, i) => `<article class="row-24 lesson-24"><span class="time-24">${esc(String(l.time || '09:00 - 10:30').split(' - ')[0])}</span>${miniIcon(['book','calendar','document','quiz'][i % 4])}<div><b>${esc(l.title || 'Dars')}</b><small>${esc(l.teacher_name || 'O‘qituvchi')} • ${esc(l.room || 'xona')}</small></div><i style="--accent:${['#10B981','#1690F5','#8B5CF6','#F59E0B'][i%4]}"></i></article>`).join('') || empty('Jadval hali yo‘q', 'calendar')}</div>${nav('schedule')}`;
    bindNav();
  }

  function payments() {
    const d = state.data || {}, s = d.student || {}, p = d.payments || [], sum = d.paymentSummary || {};
    const debt = Math.max(Number(sum.balance || s.balance || 0), 0);
    screen.innerHTML = `${header('To‘lovlar', 'Balans, qarzdorlik va chek tarixi', true, 'wallet')}<section class="pay-hero-24"><div>${svg('wallet')}<span>Joriy balans</span><b>${money(sum.balance || s.balance || 0)}</b><small>${debt > 0 ? 'Qarzdorlik mavjud' : 'To‘lov holati faol'}</small></div><aside>${money(debt)}</aside></section><div class="actions-line-24"><button>Cheklar</button><button>Invoice</button><button>Tarix</button></div><div class="section-title-24"><h2>To‘lov tarixi</h2></div><div class="list-24">${p.slice(0, 12).map((x) => row(x.comment || x.group_name || 'To‘lov', date(x.paid_at || x.created_at), money(x.amount || 0), 'wallet')).join('') || empty('To‘lovlar topilmadi', 'wallet')}</div>${nav('payments')}`;
    bindNav();
  }

  function attendance() {
    const d = state.data || {}, s = d.student || {}, items = d.attendance || [];
    const present = items.filter((x) => ['present', 'online', 'keldi'].includes(String(x.status).toLowerCase())).length;
    const absent = items.filter((x) => ['absent', 'kelmadi'].includes(String(x.status).toLowerCase())).length;
    const late = items.filter((x) => ['late', 'kech'].includes(String(x.status).toLowerCase())).length;
    const pct = items.length ? Math.round((present / items.length) * 100) : (s.attendancePercent || 0);
    const statuses = new Map(items.map((x) => [new Date(x.lesson_date || x.created_at).getDate(), String(x.status).toLowerCase()]));
    screen.innerHTML = `${header('Davomat', 'Davomat foizi va darslar tarixi', true, 'check')}<section class="attendance-hero-24"><div class="ring-24" style="--pct:${pct}"><span>${pct}%</span></div><div>${row('Keldi', `${present} ta dars`, '', 'check')}${row('Kelmadi', `${absent} ta dars`, '', 'calendar')}${row('Kech qoldi', `${late} ta dars`, '', 'bell')}</div></section><div class="section-title-24"><h2>${today.toLocaleString('uz-UZ', { month: 'long' })}</h2></div><div class="calendar-24">${Array.from({ length: 31 }, (_, i) => { const day = i + 1, st = statuses.get(day); return `<div class="day-24 ${st.includes('present') || st.includes('keldi') || st.includes('online') ? 'present' : st.includes('absent') || st.includes('kelmadi') ? 'absent' : st.includes('late') || st.includes('kech') ? 'late' : day === today.getDate() ? 'active' : ''}">${day}</div>`; }).join('')}</div><div class="section-title-24"><h2>So‘nggi darslar</h2></div><div class="list-24">${items.slice(0, 7).map((x) => row(date(x.lesson_date || x.created_at), x.note || 'Dars', x.status || '—', 'check')).join('') || empty('Davomat yozuvlari yo‘q', 'calendar')}</div>${nav('attendance')}`;
    bindNav();
  }

  function coins() {
    const d = state.data || {}, s = d.student || {}, items = d.coinTransactions || [];
    const week = items.filter((x) => (Date.now() - new Date(x.created_at || Date.now()).getTime()) < 7 * 864e5).reduce((a, b) => a + Number(b.amount || 0), 0);
    const month = items.filter((x) => (Date.now() - new Date(x.created_at || Date.now()).getTime()) < 30 * 864e5).reduce((a, b) => a + Number(b.amount || 0), 0);
    screen.innerHTML = `${header('Coin Wallet', 'O‘qituvchilar bergan coinlar tarixi', true, 'coin')}<section class="coin-hero-24"><div>${svg('coin')}<span>Jami coin</span><b>${number(s.coins || 0)}</b></div><div class="coin-stats-24"><article><small>Bugun</small><b>${number(items.filter((x) => new Date(x.created_at).toDateString() === new Date().toDateString()).reduce((a,b)=>a+Number(b.amount||0),0))}</b></article><article><small>Hafta</small><b>${week > 0 ? '+' : ''}${number(week)}</b></article><article><small>Oy</small><b>${month > 0 ? '+' : ''}${number(month)}</b></article></div></section><div class="actions-line-24"><button data-go="rewards">Sovg‘alar</button><button data-go="ranking">Reyting</button><button data-go="achievements">Yutuqlar</button></div><div class="section-title-24"><h2>Coin tarixi</h2></div><div class="list-24">${items.map((x) => row(x.reason || 'Coin', x.teacher_name || date(x.created_at), `${Number(x.amount) > 0 ? '+' : ''}${number(x.amount)}`, 'coin')).join('') || empty('Coin tarixi yo‘q', 'coin')}</div>${nav('coins')}`;
    bindNav();
  }

  function rewards() {
    const d = state.data || {}, s = d.student || {}, items = d.rewards || [];
    const fallbackArt = ["gift", "book", "wallet", "coin", "document", "trophy"];
    screen.innerHTML = `${header('Sovg‘alar do‘koni', 'Coin evaziga mahsulotlar', true, 'gift')}<div class="tabs-24"><button class="active">Barchasi</button><button>Gadjet</button><button>Kitob</button><button>Voucher</button></div><div class="reward-grid-24">${items.map((x, i) => { const enough = Number(s.coins || 0) >= Number(x.coin_price || 0); return `<article class="reward-24"><div class="product-visual-24">${x.image_url ? `<img src="${esc(x.image_url)}"/>` : svg(fallbackArt[i % fallbackArt.length])}</div><b>${esc(x.title)}</b><small>${esc(x.description || x.category || 'Sovg‘a')}</small><p>${svg('coin')} ${number(x.coin_price)}</p><button class="${enough ? 'primary-24' : 'ghost-24'}" data-redeem="${x.id}" ${enough ? '' : 'disabled'}>${enough ? 'Olish' : 'Coin yetmaydi'}</button></article>`; }).join('') || empty('Sovg‘alar hali qo‘shilmagan', 'gift')}</div>${nav('coins')}`;
    bindNav();
    $$('[data-redeem]').forEach((btn) => btn.onclick = async () => {
      const ok = await confirmSheet({ title: 'Sovg‘ani olasizmi?', message: 'Coinlaringizdan yechiladi va so‘rov admin tasdig‘iga yuboriladi.', ok: 'Ha, olish', icon: 'gift' });
      if (!ok) return;
      setBusy(btn, true, 'Yuborilmoqda...');
      try { await api(`/api/student-app/rewards/${btn.dataset.redeem}/redeem`, { method: 'POST', body: '{}' }); toast('Sovg‘a so‘rovi yuborildi', 'success'); await load(); rewards(); } catch (e) { toast(e.message, 'error'); } finally { setBusy(btn, false); }
    });
  }

  function myRewards() {
    const items = state.data?.redemptions || [];
    screen.innerHTML = `${header('Mening sovg‘alarim', 'Sovg‘a so‘rovlari holati', true, 'gift')}<div class="tabs-24"><button class="active">Hammasi</button><button>Kutilmoqda</button><button>Tasdiqlandi</button><button>Berildi</button></div><div class="list-24">${items.map((x) => row(x.product_title || 'Sovg‘a', `${date(x.created_at)} • ${number(x.coin_price)} coin`, x.status || 'pending', 'gift')).join('') || empty('Sizda sovg‘a so‘rovlari yo‘q', 'gift')}</div>${nav('coins')}`;
    bindNav();
  }

  function ranking() {
    const list = state.data?.ranking || [];
    screen.innerHTML = `${header('Reyting', 'Coin va faoliyat bo‘yicha reyting', true, 'trophy')}<div class="tabs-24"><button class="active">Umumiy</button><button>Guruh</button><button>Oy</button></div><section class="podium-24">${list.slice(0, 3).map((x, i) => `<article class="${i === 0 ? 'top' : ''}"><div class="rank-avatar-24">${esc(initials(x.full_name))}</div>${svg('trophy')}<b>${i + 1}. ${esc(x.full_name)}</b><small>${number(x.score)} coin</small></article>`).join('') || empty('Reyting topilmadi', 'trophy')}</section><div class="list-24">${list.map((x, i) => row(`${i + 1}. ${x.full_name}`, 'Coin reyting', `${number(x.score)} coin`, 'trophy')).join('') || ''}</div>${nav('coins')}`;
    bindNav();
  }

  function achievements() {
    const items = state.data?.achievements || [];
    screen.innerHTML = `${header('Yutuqlar', 'Badge, progress va mukofot coin', true, 'trophy')}<div class="stats-24 two"><article>${svg('trophy')}<small>Olingan</small><b>${items.filter((x) => x.completed || x.completed_at).length}</b></article><article>${svg('coin')}<small>Bonus</small><b>${number(items.reduce((a,x)=>a+Number(x.reward_coin||0),0))}</b></article></div><div class="badge-grid-24">${items.map((x, i) => `<article class="badge-24">${svg(['trophy','check','coin','book'][i % 4])}<b>${esc(x.title)}</b><small>${esc(x.description || 'Yutuq sharti')}</small><div class="progress-24"><i style="width:${Math.min(100, (Number(x.progress||0)/Math.max(1,Number(x.target||1)))*100)}%"></i></div><p>${number(x.progress || 0)}/${number(x.target || 1)}</p></article>`).join('') || empty('Yutuqlar hali yo‘q', 'trophy')}</div>${nav('coins')}`;
    bindNav();
  }

  function notifications() {
    const items = state.data?.notifications || [];
    screen.innerHTML = `${header('Bildirishnomalar', 'Dars, to‘lov, coin va tizim xabarlari', true, 'bell')}<div class="tabs-24"><button class="active">Hammasi</button><button>O‘qilmagan</button><button>Muhim</button></div><div class="list-24">${items.map((x) => row(x.title || 'Xabar', x.description || '', date(x.created_at || x.time), 'bell')).join('') || empty('Bildirishnomalar yo‘q', 'bell')}</div>${nav('home')}`;
    bindNav();
  }

  function materials() {
    const items = state.data?.materials || state.data?.library || [];
    screen.innerHTML = `${header('Materiallar', 'PDF, video va dars resurslari', true, 'book')}<div class="tabs-24"><button class="active">Barchasi</button><button>PDF</button><button>Video</button><button>Link</button></div><div class="list-24">${items.map((x) => row(x.title || 'Material', `${String(x.type || 'PDF').toUpperCase()} • ${x.level || x.description || ''}`, x.file_url ? 'Ochish' : 'Ko‘rish', 'book')).join('') || empty('Materiallar hali qo‘shilmagan', 'book')}</div>${nav('home')}`;
    bindNav();
  }

  function homework() {
    const hw = state.data?.homework || [];
    screen.innerHTML = `${header('Uyga vazifa', 'Topshiriqlar va o‘qituvchi izohlari', true, 'document')}<div class="tabs-24"><button class="active">Yangi</button><button>Topshirilgan</button><button>Kechikkan</button></div><div class="list-24">${hw.map((x) => row(x.title || 'Vazifa', `${x.subject || 'Fan'} • Deadline: ${date(x.due_date)}`, x.submission_status || 'Pending', 'document')).join('') || empty('Uyga vazifa yo‘q', 'document')}</div>${nav('home')}`;
    bindNav();
  }

  function tests() {
    const tests = state.data?.tests || [];
    screen.innerHTML = `${header('Testlar', 'Savollar, vaqt limiti va natijalar', true, 'quiz')}<div class="list-24">${tests.map((x) => row(x.title || 'Test', x.description || '10 savol • 15 daqiqa', x.status || 'Boshlash', 'quiz')).join('') || empty('Testlar hali yo‘q', 'quiz')}</div>${nav('home')}`;
    bindNav();
  }

  function security() {
    const s = state.data?.student || {};
    screen.innerHTML = `${header('Xavfsizlik', 'Sessiya, parol va Telegram bog‘lanishi', true, 'lock')}<div class="stats-24 two"><article>${svg('bell')}<small>Telegram</small><b>${s.telegramUserId || s.telegram_user_id ? 'Ulangan' : 'Ulanmagan'}</b></article><article>${svg('lock')}<small>Session</small><b>Active</b></article></div><form class="login-24" data-password><label>Joriy parol<input type="password" name="current_password" placeholder="Joriy parol" /></label><label>Yangi parol<input type="password" name="new_password" placeholder="Kamida 6 belgi" required /></label><button class="primary-24">Parolni yangilash</button></form><button class="danger-24" data-revoke>Hamma qurilmalardan chiqish</button>${nav('profile')}`;
    bindNav();
    $('[data-password]').onsubmit = async (e) => { e.preventDefault(); const body = Object.fromEntries(new FormData(e.target)); try { await api('/api/student-app/password', { method: 'POST', body: JSON.stringify(body) }); toast('Parol yangilandi'); e.target.reset(); } catch(err) { toast(err.message); } };
    $('[data-revoke]').onclick = async () => { try { await api('/api/student-app/auth/logout', { method: 'POST', body: '{}' }); } catch {} setToken(''); state.data = null; renderAuthHub('Sessiya yakunlandi. Qayta kiring.'); };
  }

  async function uploadStudentAvatar(file) {
    const fd = new FormData(); fd.append('file', file); fd.append('entity_type', 'student'); fd.append('purpose', 'profile');
    const res = await fetch('/api/student-app/avatar', { method: 'POST', headers: state.token ? { Authorization: `Bearer ${state.token}` } : {}, body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.ok === false) throw new Error(json.message || 'Rasm yuklanmadi');
    return json.url || json.asset?.url || json.avatar_url || json.avatarUrl || '';
  }

  function profile() {
    const d = state.data || {}, s = d.student || {}, o = d.organization || {}, g = (d.groups || [])[0] || {};
    screen.innerHTML = `${header('Profil', 'Account va sozlamalar', true, 'user')}<section class="profile-card-24"><div class="avatar-24 big">${s.avatarUrl ? `<img src="${esc(s.avatarUrl)}"/>` : svg('user')}</div><h2>${esc(s.fullName || s.full_name || 'O‘quvchi')}</h2><p>${esc(s.email || s.phone || '')}</p><span>Eduka ID: ${esc(s.id || '—')}</span></section><div class="list-24">${row('Guruh', g.name || s.groupName || '—', '', 'book')}${row('Markaz', o.name || 'Eduka', '', 'home')}${row('Telefon', s.phone || '—', '', 'bell')}${row('Ota-ona telefoni', s.parentPhone || s.parent_phone || '—', '', 'user')}${row('Telegram', s.telegramUserId || s.telegram_user_id ? 'Ulangan' : 'Ulanmagan', '', 'bell')}${row('Domain login', 'student.eduka.uz', '', 'lock')}</div><button class="primary-24" data-edit>Profilni tahrirlash</button><button class="ghost-24" data-go="security">Xavfsizlik va parol</button><button class="danger-24" data-logout>Chiqish</button>${nav('profile')}`;
    bindNav();
    $('[data-edit]').onclick = editProfile;
    $('[data-logout]').onclick = async () => { try { await api('/api/student-app/auth/logout', { method: 'POST', body: '{}' }); } catch {} setToken(''); state.data = null; renderAuthHub('Siz ilovadan chiqdingiz.'); };
  }

  function editProfile() {
    const s = state.data?.student || {};
    screen.insertAdjacentHTML('beforeend', `<div class="drawer-24"><div class="drawer-head-24"><h2>Profilni tahrirlash</h2><button data-close>×</button></div><form data-profile><div class="upload-preview-24"><div class="avatar-24 big">${s.avatarUrl ? `<img src="${esc(s.avatarUrl)}"/>` : svg('user')}</div><label>Profil rasmi<input type="file" name="avatar_file" accept="image/*" hidden /></label><small>Rasm markaz papkasida doimiy saqlanadi.</small></div><label>FISH<input name="full_name" value="${esc(s.fullName || s.full_name || '')}"/></label><label>Telefon<input name="phone" value="${esc(s.phone || '')}"/></label><label>Ota-ona telefoni<input name="parent_phone" value="${esc(s.parentPhone || s.parent_phone || '')}"/></label><label>Email<input name="email" value="${esc(s.email || '')}"/></label><label>Manzil<textarea name="address">${esc(s.address || '')}</textarea></label><button class="primary-24">Saqlash</button></form></div>`);
    const drawer = $('.drawer-24'), file = drawer.querySelector('input[type=file]');
    $('[data-close]', drawer).onclick = () => drawer.remove();
    file.onchange = () => { const f = file.files?.[0]; if (f) drawer.querySelector('.avatar-24.big').innerHTML = `<img src="${URL.createObjectURL(f)}"/>`; };
    $('[data-profile]', drawer).onsubmit = async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button.primary-24'), old = btn.textContent;
      btn.disabled = true; btn.textContent = 'Saqlanmoqda...';
      const fd = new FormData(e.target), data = Object.fromEntries(fd); delete data.avatar_file;
      try { if (file.files?.[0]) data.avatar_url = await uploadStudentAvatar(file.files[0]); await api('/api/student-app/profile', { method: 'POST', body: JSON.stringify(data) }); await load(); toast('Profil saqlandi'); drawer.remove(); profile(); } catch (err) { toast(err.message); } finally { btn.disabled = false; btn.textContent = old; }
    };
  }

  async function renderRoute(name = route()) {
    screen.dataset.route = name;
    screen.classList.remove('route-leave-24');
    screen.classList.add('route-enter-24');
    setTimeout(() => screen.classList.remove('route-enter-24'), 280);
    if (!state.data && !['welcome', 'telegram', 'login'].includes(name)) {
      try { screen.innerHTML = skeleton(6); await load(); } catch { renderAuthHub('Sessiya topilmadi yoki muddati tugagan.'); return; }
    }
    if (!enabled(name) && !['home', 'profile', 'security'].includes(name)) {
      screen.innerHTML = `${header(pageTitle[name] || name, 'Bu modul markazingizda yoqilmagan')}${empty('Bu modul tarif yoki CEO sozlamalarida o‘chirilgan.', 'lock')}${nav('home')}`; bindNav(); return;
    }
    const map = { welcome: renderWelcome, telegram: renderTelegramAccess, login: renderDomainLogin, home, schedule, payments, attendance, coins, rewards, 'my-rewards': myRewards, ranking, achievements, notifications, materials, homework, tests, profile, security };
    (map[name] || home)();
  }

  function setupPullToRefresh() {
    const phone = document.querySelector('[data-student-phone]');
    if (!phone || phone.dataset.ptrBound) return;
    phone.dataset.ptrBound = '1';
    const indicator = document.createElement('div');
    indicator.className = 'ptr-24';
    indicator.textContent = 'Yangilash uchun pastga torting';
    phone.appendChild(indicator);
    let startY = 0, distance = 0, pulling = false;
    phone.addEventListener('touchstart', (e) => {
      if (screen.scrollTop > 0) return;
      startY = e.touches[0].clientY;
      distance = 0;
      pulling = true;
    }, { passive: true });
    phone.addEventListener('touchmove', (e) => {
      if (!pulling) return;
      distance = Math.max(0, e.touches[0].clientY - startY);
      if (distance > 10) {
        indicator.classList.add('show');
        indicator.style.transform = `translateX(-50%) translateY(${Math.min(70, distance / 2)}px)`;
        indicator.textContent = distance > 86 ? 'Qo‘yib yuboring — yangilanadi' : 'Yangilash uchun pastga torting';
      }
    }, { passive: true });
    phone.addEventListener('touchend', async () => {
      if (!pulling) return;
      pulling = false;
      if (distance > 86 && state.token) {
        indicator.textContent = 'Yangilanmoqda...';
        indicator.classList.add('loading');
        try { await load(); await renderRoute(route() === 'welcome' ? 'home' : route()); toast('Ma’lumotlar yangilandi', 'success'); }
        catch (e) { toast(e.message, 'error'); }
      }
      setTimeout(() => { indicator.classList.remove('show', 'loading'); indicator.style.transform = ''; }, 360);
    }, { passive: true });
  }

  async function boot() {
    try { tg?.ready?.(); tg?.expand?.(); } catch {}
    setupPullToRefresh();
    bindMicroInteractions(document);
    await loadBotInfo();
    const incoming = qs.get('token') || extractPathToken() || localStorage.getItem(TOKEN_KEY) || '';
    if (incoming) setToken(incoming);
    if (state.token) {
      try { await load(); if (location.pathname.match(/\/app\/open\//)) history.replaceState({}, '', '/app/home'); return renderRoute(route() === 'welcome' || route() === 'login' ? 'home' : route()); } catch { setToken(''); }
    }
    if (await authTelegramIfPossible()) return renderRoute('home');
    if (location.hostname.startsWith('student.')) return renderDomainLogin();
    renderWelcome();
  }

  window.addEventListener('popstate', () => renderRoute(route()));
  boot().catch((err) => { console.error(err); renderAuthHub(err.message || 'Student App yuklanmadi'); });
})();
