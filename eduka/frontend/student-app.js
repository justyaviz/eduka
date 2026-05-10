(() => {
  "use strict";
  const VERSION = "23.0.0";
  const screen = document.querySelector("[data-student-screen]");
  const tg = window.Telegram?.WebApp || null;
  const TOKEN_KEY = "eduka_student_token";
  const qs = new URLSearchParams(location.search);
  const state = { token: "", data: null, loading: false, botUrl: "https://t.me/eduka_student_bot" };
  const moduleRoutes = new Set(["home","schedule","payments","attendance","coins","rewards","my-rewards","ranking","achievements","notifications","materials","homework-tests","profile"]);

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (v) => String(v ?? "").replace(/[&<>'"]/g, (ch) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[ch]));
  const money = (v) => `${Number(v || 0).toLocaleString("uz-UZ")} so'm`;
  const n = (v) => Number(v || 0).toLocaleString("uz-UZ");
  const today = new Date();
  const date = (v) => v ? new Date(v).toLocaleDateString("uz-UZ") : "—";
  const time = (v) => v ? String(v).slice(0, 5) : "—";
  const initials = (name) => String(name || "Eduka").split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0]).join("").toUpperCase() || "E";
  const logo = "/assets/logo_icon.webp";

  function toast(message) {
    const host = document.querySelector("[data-toast-host]");
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = String(message || "Xabar");
    host.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }
  function extractPathToken() {
    const match = location.pathname.match(/\/app\/open\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }
  function route() {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts[0] === "app" && parts[1] === "open") return "home";
    if (parts[0] === "app" && parts[1]) return moduleRoutes.has(parts[1]) ? parts[1] : "home";
    return "welcome";
  }
  function setRoute(r, replace = false) {
    const path = r === "welcome" ? "/app" : `/app/${r}`;
    if (replace) history.replaceState({}, "", path);
    else history.pushState({}, "", path);
    renderRoute(r);
  }
  function setToken(token) {
    state.token = token || "";
    if (token) localStorage.setItem(TOKEN_KEY, token);
  }
  async function api(path, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (!(opts.body instanceof FormData)) headers["Content-Type"] = headers["Content-Type"] || "application/json";
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    const res = await fetch(path, { ...opts, headers, cache: "no-store" });
    const text = await res.text();
    let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch { json = { ok: false, message: text || "Server javobi noto‘g‘ri" }; }
    if (!res.ok || json.ok === false) throw new Error(json.message || `Xatolik: ${res.status}`);
    return json;
  }
  async function loadBotInfo() {
    try {
      const info = await fetch(`/api/telegram/student-bot-info?v=${VERSION}`, { cache: "no-store" }).then(r => r.json());
      const username = info?.username || info?.bot_username || info?.botUsername;
      if (username) state.botUrl = `https://t.me/${String(username).replace(/^@/, "")}`;
    } catch {}
  }
  async function authTelegramIfPossible() {
    const initData = tg?.initData || "";
    const userId = tg?.initDataUnsafe?.user?.id || "";
    if (!initData && !userId) return false;
    try {
      const payload = await api("/api/student-app/auth/telegram", { method: "POST", body: JSON.stringify({ init_data: initData, telegram_user_id: userId }) });
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
    if (Object.prototype.hasOwnProperty.call(e, key)) return Boolean(e[key]);
    return true;
  }
  function titleOf(key) {
    return ({
      home: "Bosh sahifa", schedule: "Jadval", payments: "To‘lovlar", attendance: "Davomat", coins: "Coinlar", rewards: "Sovg‘alar", "my-rewards": "Mening sovg‘alarim", ranking: "Reyting", achievements: "Yutuqlar", notifications: "Xabarlar", materials: "Materiallar", "homework-tests": "Vazifa/Test", profile: "Profil"
    })[key] || key;
  }
  function row(title, sub = "", right = "", icon = "") {
    return `<article class="row">${icon ? `<div class="lesson-icon">${icon}</div>` : ""}<div><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</div>${right ? `<span class="right">${esc(right)}</span>` : ""}</article>`;
  }
  function empty(text) { return `<div class="empty">${esc(text)}</div>`; }
  function skeleton(count = 4) { return `<div class="list">${Array.from({ length: count }, () => `<div class="skeleton"></div>`).join("")}</div>`; }
  function nav(active = "home") {
    const items = [
      ["home", "⌂", "Bosh"], ["schedule", "▣", "Jadval"], ["payments", "▤", "To‘lov"], ["coins", "◉", "Coin"], ["profile", "♙", "Profil"]
    ];
    return `<nav class="bottom-nav">${items.filter(([k]) => enabled(k) || ["home","profile"].includes(k)).map(([k, icon, label]) => `<button class="${active === k ? "active" : ""}" data-go="${k}"><span>${icon}</span>${label}</button>`).join("")}</nav>`;
  }
  function bindNav() {
    $$('[data-go]').forEach(btn => btn.onclick = () => setRoute(btn.dataset.go));
  }
  function header(title, subtitle = "", back = true) {
    return `<div class="screen-head">${back ? `<button class="back-btn" data-go="home">‹</button>` : ""}<div><h2>${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ""}</div><button class="icon-btn" data-go="notifications">⌁</button></div>`;
  }
  function appUrl(path) { return `${location.origin}${path}`; }

  function renderWelcome() {
    screen.innerHTML = `<section class="splash"><img class="brand-icon" src="${logo}" alt="Eduka"/><h1>EDUKA</h1><p>O‘qing, o‘sing, yuting. Student App Pro bilan hammasi bitta joyda.</p><button class="secondary full" data-start>Get Started</button><small>Telegram bot yoki student.eduka.uz orqali kiring.</small></section>`;
    $('[data-start]').onclick = () => renderAuthHub();
  }
  function renderAuthHub(message = "") {
    screen.innerHTML = `<section class="auth-wrap">
      <div class="auth-card"><div class="auth-logo"><img src="${logo}"/><b>EDUKA</b></div><div class="access-hero"><div class="telegram-bubble">➤</div><h2>Student App Pro</h2><p class="muted">2 xil kirish usuli: Telegram bot orqali tezkor kirish yoki student.eduka.uz domenida login/parol.</p>${message ? `<p class="pill red">${esc(message)}</p>` : ""}</div></div>
      <div class="auth-grid">
        <button class="auth-method" data-telegram><div class="big-ico">➤</div><h3>Telegram Access</h3><p>Botda telefon va kodni tasdiqlaysiz, ilova dashboarddan ochiladi.</p><span class="pill">Tavsiya qilinadi</span></button>
        <button class="auth-method" data-domain><div class="big-ico">⌁</div><h3>Domain Login</h3><p>student.eduka.uz orqali login/telefon va parol bilan kirish.</p><span class="pill purple">Web login</span></button>
      </div>
    </section>`;
    $('[data-telegram]').onclick = () => renderTelegramAccess();
    $('[data-domain]').onclick = () => renderDomainLogin();
  }
  function renderTelegramAccess() {
    screen.innerHTML = `<section class="auth-wrap"><div class="auth-card"><button class="back-btn" data-auth>‹</button><div class="access-hero"><div class="telegram-bubble">➤</div><h2>Access with Telegram Bot</h2><p class="muted">Telegram bot orqali telefon raqam va student kodni tasdiqlang. Tasdiqlangandan keyin app avtomatik bosh sahifadan ochiladi.</p></div><div class="list">${row("One-tap login", "Qo‘shimcha login eslab yurish shart emas", "✓")}${row("Secure & private", "Telegram ID student profilingizga ulanadi", "✓")}${row("Auto dashboard", "Token bilan to‘g‘ridan-to‘g‘ri /app/home ochiladi", "✓")}</div><a class="primary full" style="display:flex;align-items:center;justify-content:center;text-decoration:none;margin-top:14px" href="${esc(state.botUrl)}">Continue with Telegram</a></div></section>`;
    $('[data-auth]').onclick = () => renderAuthHub();
  }
  function renderDomainLogin() {
    screen.innerHTML = `<section class="auth-wrap"><div class="auth-card"><button class="back-btn" data-auth>‹</button><div class="auth-logo" style="justify-content:center"><img src="${logo}"/><b>EDUKA</b></div><div class="access-hero" style="padding-top:4px"><span class="domain-badge">🔒 Direct access via student.eduka.uz</span><h2>Welcome back!</h2><p class="muted">O‘quvchi kabinetiga login yoki telefon raqam va parol bilan kiring.</p></div><form class="login-form" data-login><label>Login yoki telefon<input name="phone" autocomplete="username" placeholder="Telefon yoki login" required /></label><label>Parol<input name="password" type="password" autocomplete="current-password" placeholder="Parol" required /></label><button class="primary full">Sign in</button><button type="button" class="link-btn" data-telegram-open>Telegram bot orqali kirish</button></form></div></section>`;
    $('[data-auth]').onclick = () => renderAuthHub();
    $('[data-telegram-open]').onclick = () => renderTelegramAccess();
    $('[data-login]').onsubmit = async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button.primary');
      const old = btn.textContent;
      btn.disabled = true; btn.textContent = "Kirilmoqda...";
      try {
        const body = Object.fromEntries(new FormData(e.target));
        const payload = await api('/api/student-app/auth/password', { method: 'POST', body: JSON.stringify(body) });
        if (payload.token) setToken(payload.token);
        await load();
        toast("Xush kelibsiz!");
        setRoute('home', true);
      } catch (err) { toast(err.message); }
      finally { btn.disabled = false; btn.textContent = old; }
    };
  }

  function home() {
    const d = state.data || {}, s = d.student || {}, org = d.organization || {}, lessons = d.lessons || [], payments = d.paymentSummary || {}, coins = d.coinTransactions || [], next = lessons[0] || {};
    const rankIndex = (d.ranking || []).findIndex(x => Number(x.student_id) === Number(s.id));
    screen.innerHTML = `<section class="hero"><div class="hello"><div class="avatar">${s.avatarUrl ? `<img src="${esc(s.avatarUrl)}"/>` : esc(initials(s.fullName))}</div><div><h2>Salom, ${esc((s.fullName || 'O‘quvchi').split(' ')[0])}! 👋</h2><p>${esc(org.name || 'Eduka')} • Student App Pro</p></div></div><div class="home-stats"><div class="stat"><small>Balans</small><b>${money(s.balance || payments.balance || 0)}</b></div><div class="stat"><small>Davomat</small><b>${s.attendancePercent || lessons[0]?.attendance_percent || 0}%</b></div><div class="stat"><small>Coinlar</small><b>🪙 ${n(s.coins || 0)}</b></div><div class="stat"><small>Reyting</small><b>#${rankIndex >= 0 ? rankIndex + 1 : '—'}</b></div></div></section>
    <div class="section-title"><h2>Bugungi dars</h2><button class="link-btn" data-go="schedule">Jadval</button></div>${next.title ? `<article class="card lesson-card"><div class="lesson-icon">📘</div><div><h3>${esc(next.title)}</h3><b>${esc(next.time || '')}</b><small>${esc(next.teacher_name || 'O‘qituvchi')} • ${esc(next.room || 'xona belgilanmagan')}</small></div></article>` : empty('Bugun dars topilmadi')}
    <div class="section-title"><h2>Quick Actions</h2></div><div class="quick-grid">${[
      ['schedule','📅','Jadval'],['materials','📚','Material'],['homework-tests','📝','Vazifa'],['payments','💳','To‘lov'],['coins','🪙','Coin'],['rewards','🎁','Sovg‘a'],['ranking','🏆','Reyting'],['notifications','🔔','Xabar']
    ].filter(([r]) => r==='homework-tests' ? (enabled('homework')||enabled('tests')) : enabled(r)).map(([r,i,l])=>`<button data-go="${r}"><span>${i}</span>${l}</button>`).join('')}</div>
    <div class="section-title"><h2>So‘nggi coinlar</h2><button class="link-btn" data-go="coins">Barchasi</button></div><div class="list">${coins.slice(0,3).map(c=>row(c.reason || 'Coin berildi', c.teacher_name || c.source || '', `${Number(c.amount)>0?'+':''}${n(c.amount)}`)).join('') || empty('Hali coinlar yo‘q')}</div>${nav('home')}`;
    bindNav();
  }
  function schedule() {
    const lessons = state.data?.lessons || [];
    const days = ['Du','Se','Ch','Pa','Ju','Sh','Ya'];
    screen.innerHTML = `${header('Schedule', 'Haftalik dars jadvali')}<div class="tabs"><button class="active">Week</button><button>Month</button></div><div class="date-strip">${days.map((d,i)=>`<button class="${i===1?'active':''}"><small>${d}</small><br>${12+i}</button>`).join('')}</div><div class="section-title"><h2>Bugungi darslar</h2></div><div class="list">${lessons.map((l,i)=>`<article class="row class-card"><div class="time">${esc((l.time||'09:00 - 10:30').split(' - ')[0])}</div><div><b>${esc(l.title || 'Dars')}</b><small>${esc(l.teacher_name || 'O‘qituvchi')} • ${esc(l.room || 'xona')}</small></div><div class="subject-chip" style="background:${['#16a34a','#145cff','#7c3aed','#f59e0b','#0891b2'][i%5]}"></div></article>`).join('') || empty('Jadval hali yo‘q')}</div>${nav('schedule')}`;
    bindNav();
  }
  function payments() {
    const d = state.data || {}, s = d.student || {}, p = d.payments || [], sum = d.paymentSummary || {};
    screen.innerHTML = `${header('Payments', 'Balans, qarzdorlik va chek tarixi')}<div class="grid-2"><article class="card blue-card"><h3>Balance</h3><strong>${money(sum.balance || s.balance || 0)}</strong></article><article class="card red-card"><h3>Outstanding Debt</h3><strong>${money(Math.max(sum.balance || 0,0))}</strong></article></div><div class="grid-3" style="margin-top:12px"><button class="ghost">Cheklar</button><button class="ghost">Invoice</button><button class="ghost">Tarix</button></div><div class="section-title"><h2>Payment History</h2></div><div class="list">${p.slice(0,12).map(x=>row(x.comment || x.group_name || 'To‘lov', date(x.paid_at || x.created_at), money(x.amount || 0))).join('') || empty('To‘lovlar topilmadi')}</div>${nav('payments')}`;
    bindNav();
  }
  function attendance() {
    const d = state.data || {}, s = d.student || {}, items = d.attendance || [];
    const present = items.filter(x=>['present','online'].includes(x.status)).length, absent = items.filter(x=>x.status==='absent').length, late = items.filter(x=>x.status==='late').length;
    const pct = items.length ? Math.round((present/items.length)*100) : (s.attendancePercent || 0);
    const statuses = new Map(items.map(x => [new Date(x.lesson_date).getDate(), x.status]));
    screen.innerHTML = `${header('Attendance','Davomat statistikasi va tarix')}<div class="grid-3"><article class="card green-card"><h3>Overall</h3><strong>${pct}%</strong></article><article class="card"><h3>Present</h3><strong>${present}</strong></article><article class="card red-card"><h3>Absent</h3><strong>${absent}</strong></article></div><article class="card" style="margin-top:12px"><div class="progress-ring" style="background:conic-gradient(var(--green) 0 ${pct*3.6}deg,#e5eef8 ${pct*3.6}deg)"><span>${pct}%</span></div><p class="muted" style="text-align:center;font-weight:900">Late: ${late} • Jami: ${items.length}</p></article><div class="section-title"><h2>${today.toLocaleString('en-US',{month:'long'})} ${today.getFullYear()}</h2></div><div class="calendar">${Array.from({length:31},(_,i)=>{const day=i+1, st=statuses.get(day); return `<div class="day ${st==='present'||st==='online'?'present':st==='absent'?'absent':st==='late'?'late':day===today.getDate()?'active':''}">${day}</div>`}).join('')}</div><div class="section-title"><h2>So‘nggi darslar</h2></div><div class="list">${items.slice(0,6).map(x=>row(date(x.lesson_date), x.note || 'Dars', x.status || '—')).join('') || empty('Davomat yozuvlari yo‘q')}</div>${nav('attendance')}`;
    bindNav();
  }
  function coins() {
    const d = state.data || {}, s = d.student || {}, items = d.coinTransactions || [];
    const week = items.filter(x => (Date.now() - new Date(x.created_at || Date.now()).getTime()) < 7*864e5).reduce((a,b)=>a+Number(b.amount||0),0);
    screen.innerHTML = `${header('Coin Wallet','O‘qituvchilar bergan coinlar tarixi')}<article class="card orange-card"><h3>Your Coins</h3><strong>🪙 ${n(s.coins||0)}</strong><div class="grid-2" style="margin-top:12px"><button class="secondary" data-go="rewards">Sovg‘alar</button><button class="secondary" data-go="ranking">Reyting</button></div></article><div class="grid-2" style="margin-top:12px"><article class="card"><h3>Haftalik</h3><strong>${week>0?'+':''}${n(week)}</strong></article><article class="card"><h3>Eventlar</h3><strong>${items.length}</strong></article></div><div class="section-title"><h2>Coin History</h2></div><div class="list">${items.map(x=>row(x.reason || 'Coin', x.teacher_name || date(x.created_at), `${Number(x.amount)>0?'+':''}${n(x.amount)}`)).join('') || empty('Coin tarixi yo‘q')}</div>${nav('coins')}`;
    bindNav();
  }
  function rewards() {
    const d = state.data || {}, s = d.student || {}, items = d.rewards || [];
    screen.innerHTML = `${header('Rewards Shop', 'Coin evaziga sovg‘alar')}<div class="tabs"><button class="active">All</button><button>Accessories</button><button>Gift Cards</button><button>Other</button></div><div class="reward-grid">${items.map(x=>{const enough=Number(s.coins||0)>=Number(x.coin_price||0);return `<article class="card reward"><div class="pic">${x.image_url?`<img src="${esc(x.image_url)}"/>`:'🎁'}</div><b>${esc(x.title)}</b><small>${esc(x.description || x.category || '')}</small><p><span class="coin">S</span> ${n(x.coin_price)}</p><button class="${enough?'primary':'ghost'} full" data-redeem="${x.id}" ${enough?'':'disabled'}>${enough?'Olish':'Coin yetmaydi'}</button></article>`}).join('') || empty('Sovg‘alar hali qo‘shilmagan')}</div>${nav('coins')}`;
    bindNav();
    $$('[data-redeem]').forEach(btn => btn.onclick = async () => { if (!confirm('Sovg‘a olishni tasdiqlaysizmi?')) return; try { await api(`/api/student-app/rewards/${btn.dataset.redeem}/redeem`, { method: 'POST', body: '{}' }); toast('Sovg‘a so‘rovi yuborildi'); await load(); rewards(); } catch (e) { toast(e.message); } });
  }
  function myRewards() {
    const items = state.data?.redemptions || [];
    screen.innerHTML = `${header('My Rewards','Sovg‘a so‘rovlari holati')}<div class="tabs"><button class="active">All</button><button>Pending</button><button>Approved</button><button>Delivered</button></div><div class="list">${items.map(x=>row(x.product_title || 'Sovg‘a', `${date(x.created_at)} • ${n(x.coin_price)} coin`, x.status || 'pending')).join('') || empty('Sizda sovg‘a so‘rovlari yo‘q')}</div>${nav('coins')}`; bindNav();
  }
  function ranking() {
    const list = state.data?.ranking || [];
    screen.innerHTML = `${header('Leaderboard','Coin va faoliyat bo‘yicha reyting')}<div class="tabs"><button class="active">Global</button><button>Center</button><button>Group</button></div><div class="leader-top">${list.slice(0,3).map((x,i)=>`<article class="card leader ${i===0?'main':''}"><div class="avatar">${esc(initials(x.full_name))}</div><b>${i+1}. ${esc(x.full_name)}</b><small>🪙 ${n(x.score)}</small></article>`).join('')}</div><div class="section-title"><h2>Top o‘quvchilar</h2></div><div class="list">${list.map((x,i)=>row(`${i+1}. ${x.full_name}`, 'Coin reyting', `🪙 ${n(x.score)}`)).join('') || empty('Reyting topilmadi')}</div>${nav('coins')}`; bindNav();
  }
  function achievements() {
    const items = state.data?.achievements || [];
    screen.innerHTML = `${header('Achievements','Badge, streak va progress')}<div class="grid-2"><article class="card blue-card"><h3>Badges Earned</h3><strong>${items.filter(x=>x.completed || x.completed_at).length}</strong></article><article class="card"><h3>Total Points</h3><strong>${n((state.data?.student?.coins||0)+1000)}</strong></article></div><div class="section-title"><h2>Your Badges</h2></div><div class="badge-grid">${items.map(x=>`<article class="card badge"><div class="medal">${x.completed || x.completed_at ? '🏆':'⭐'}</div><b>${esc(x.title)}</b><small>${esc(x.description || '')}</small><p class="pill">${n(x.progress||0)}/${n(x.target||1)}</p></article>`).join('') || empty('Yutuqlar hali yo‘q')}</div>${nav('coins')}`; bindNav();
  }
  function notifications() {
    const items = state.data?.notifications || [];
    screen.innerHTML = `${header('Notifications','Dars, to‘lov, coin va tizim xabarlari')}<div class="tabs"><button class="active">All</button><button>Unread</button><button>Important</button></div><div class="list">${items.map(x=>row(x.title || 'Xabar', x.description || '', date(x.created_at || x.time))).join('') || empty('Bildirishnomalar yo‘q')}</div>${nav('home')}`; bindNav();
  }
  function materials() {
    const items = state.data?.materials || state.data?.library || [];
    screen.innerHTML = `${header('Materials','PDF, video va dars resurslari')}<div class="tabs"><button class="active">All</button><button>Subjects</button><button>Bookmarks</button></div><div class="list">${items.map(x=>row(x.title || 'Material', `${(x.type||'PDF').toUpperCase()} • ${x.level||x.description||''}`, x.file_url ? '⬇' : '›')).join('') || empty('Materiallar hali qo‘shilmagan')}</div>${nav('home')}`; bindNav();
  }
  function homeworkTests() {
    const hw = state.data?.homework || [], tests = state.data?.tests || [];
    screen.innerHTML = `${header('Homework / Tests','Vazifa topshirish va test ishlash')}<div class="tabs"><button class="active">Assigned</button><button>Submitted</button><button>Tests</button></div><div class="section-title"><h2>Homework</h2></div><div class="list">${hw.map(x=>row(x.title || 'Vazifa', `${x.subject||'Fan'} • Due: ${date(x.due_date)}`, x.submission_status || 'Pending')).join('') || empty('Uyga vazifa yo‘q')}</div><div class="section-title"><h2>Tests</h2></div><div class="list">${tests.map(x=>row(x.title || 'Test', x.description || '10 questions • 15 min', x.status || 'Start')).join('') || empty('Testlar hali yo‘q')}</div>${nav('home')}`; bindNav();
  }
  function profile() {
    const d = state.data || {}, s = d.student || {}, o = d.organization || {}, g = (d.groups || [])[0] || {};
    screen.innerHTML = `<section class="profile-head"><div class="avatar">${s.avatarUrl?`<img src="${esc(s.avatarUrl)}"/>`:esc(initials(s.fullName))}</div><h2>${esc(s.fullName || 'O‘quvchi')}</h2><p>${esc(s.email || s.phone || '')}</p></section><div class="info-list">${row('Group', g.name || s.groupName || '—', '›', '👥')}${row('Center', o.name || 'Eduka', '›', '🏫')}${row('Telefon', s.phone || '—', '', '☎')}${row('Ota-ona telefoni', s.parentPhone || '—', '', '👨‍👩‍👧')}${row('Account Settings', 'Profil va kontakt ma’lumotlari', '›', '⚙')}${row('Security', 'Token, Telegram va parol', '›', '🔒')}${row('Help & Support', 'Markaz adminiga murojaat', '›', '❔')}</div><button class="primary full" style="margin-top:14px" data-edit>Profilni tahrirlash</button><button class="danger full" style="margin-top:10px" data-logout>Log Out</button>${nav('profile')}`;
    bindNav();
    $('[data-edit]').onclick = editProfile;
    $('[data-logout]').onclick = async () => { try { await api('/api/student-app/auth/logout', { method:'POST', body:'{}' }); } catch {} localStorage.removeItem(TOKEN_KEY); state.token=''; state.data=null; renderAuthHub('Siz ilovadan chiqdingiz. Qayta kirish uchun Telegram bot yoki student.eduka.uz dan foydalaning.'); };
  }
  async function uploadStudentAvatar(file) {
    const fd = new FormData(); fd.append('file', file); fd.append('entity_type','student'); fd.append('purpose','profile');
    const res = await fetch('/api/student-app/avatar', { method:'POST', headers: state.token ? { Authorization:`Bearer ${state.token}` } : {}, body: fd });
    const json = await res.json().catch(()=>({}));
    if (!res.ok || json.ok === false) throw new Error(json.message || 'Rasm yuklanmadi');
    return json.url || json.asset?.url || json.avatar_url || json.avatarUrl || '';
  }
  function editProfile() {
    const s = state.data?.student || {};
    screen.insertAdjacentHTML('beforeend', `<div class="drawer"><div class="drawer-head"><h2>Profilni tahrirlash</h2><button class="icon-btn" data-close>×</button></div><form data-profile><div class="avatar-upload-preview"><div class="avatar big">${s.avatarUrl?`<img src="${esc(s.avatarUrl)}"/>`:esc(initials(s.fullName))}</div><label class="upload-chip">Profil rasmi<input type="file" name="avatar_file" accept="image/*" hidden /></label><small class="muted">Rasm markaz papkasida doimiy saqlanadi.</small></div><label>FISH<input name="full_name" value="${esc(s.fullName||'')}"/></label><label>Telefon<input name="phone" value="${esc(s.phone||'')}"/></label><label>Ota-ona telefoni<input name="parent_phone" value="${esc(s.parentPhone||'')}"/></label><label>Manzil<textarea name="address">${esc(s.address||'')}</textarea></label><label>Email<input name="email" value="${esc(s.email||'')}"/></label><button class="primary full">Saqlash</button></form></div>`);
    const drawer = $('.drawer'), file = drawer.querySelector('input[type=file]');
    $('[data-close]', drawer).onclick = () => drawer.remove();
    file.onchange = () => { const f = file.files?.[0]; if (f) drawer.querySelector('.avatar.big').innerHTML = `<img src="${URL.createObjectURL(f)}"/>`; };
    $('[data-profile]', drawer).onsubmit = async (e) => { e.preventDefault(); const btn=e.target.querySelector('button.primary'), old=btn.textContent; btn.disabled=true; btn.textContent='Saqlanmoqda...'; const fd=new FormData(e.target); const data=Object.fromEntries(fd); delete data.avatar_file; try { if (file.files?.[0]) data.avatar_url = await uploadStudentAvatar(file.files[0]); await api('/api/student-app/profile', { method:'POST', body:JSON.stringify(data) }); await load(); toast('Profil saqlandi'); drawer.remove(); profile(); } catch(err){ toast(err.message); } finally { btn.disabled=false; btn.textContent=old; } };
  }

  async function renderRoute(r = route()) {
    if (!state.data && !['welcome','auth'].includes(r)) {
      try { screen.innerHTML = skeleton(6); await load(); } catch { renderAuthHub('Sessiya topilmadi yoki muddati tugagan.'); return; }
    }
    const map = { welcome: renderWelcome, home, schedule, payments, attendance, coins, rewards, 'my-rewards': myRewards, ranking, achievements, notifications, materials, 'homework-tests': homeworkTests, homework: homeworkTests, tests: homeworkTests, profile };
    (map[r] || home)();
  }
  async function boot() {
    try { tg?.ready?.(); tg?.expand?.(); } catch {}
    await loadBotInfo();
    const incoming = qs.get('token') || extractPathToken() || localStorage.getItem(TOKEN_KEY) || '';
    if (incoming) setToken(incoming);
    if (state.token) {
      try { await load(); if (location.pathname.match(/\/app\/open\//)) history.replaceState({}, '', '/app/home'); return renderRoute(route() === 'welcome' ? 'home' : route()); } catch { localStorage.removeItem(TOKEN_KEY); state.token=''; }
    }
    const tgOk = await authTelegramIfPossible();
    if (tgOk) return renderRoute('home');
    if (location.hostname.startsWith('student.')) return renderDomainLogin();
    renderWelcome();
  }
  window.addEventListener('popstate', () => renderRoute(route()));
  boot().catch(err => { console.error(err); renderAuthHub(err.message || 'Student App yuklanmadi'); });
})();
