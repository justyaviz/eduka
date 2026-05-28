const ICONS = {
  "arrow-up-right":`<svg viewBox="0 0 24 24"><path d="M7 17L17 7"/><path d="M9 7h8v8"/></svg>`,
  "plus":`<svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`,
  "home":`<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg>`,
  "download":`<svg viewBox="0 0 24 24"><path d="M12 4v10"/><path d="M8 10l4 4 4-4"/><path d="M5 20h14"/></svg>`,
  "teacher":`<svg viewBox="0 0 24 24"><path d="M12 4L3 8.5l9 4.5 9-4.5L12 4Z"/><path d="M7 11v4.5c0 2 2.5 3.5 5 3.5s5-1.5 5-3.5V11"/><path d="M20 9v5"/></svg>`,
  "layers":`<svg viewBox="0 0 24 24"><path d="M12 3.5 21 8l-9 4.5L3 8l9-4.5Z"/><path d="M3 12l9 4.5 9-4.5"/><path d="M3 16l9 4.5 9-4.5"/></svg>`,
  "graduation":`<svg viewBox="0 0 24 24"><path d="M12 4 3 8.5l9 4.5 9-4.5L12 4Z"/><path d="M6.5 11.5V16c2.2 2.4 8.8 2.4 11 0v-4.5"/><path d="M21 9v6"/></svg>`,
  "clock":`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.5 2"/></svg>`,
  "trophy":`<svg viewBox="0 0 24 24"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7.5 4h9v6.2a4.5 4.5 0 0 1-9 0V4Z"/><path d="M7.5 6H4v2.5a3.5 3.5 0 0 0 3.5 3.5"/><path d="M16.5 6H20v2.5a3.5 3.5 0 0 1-3.5 3.5"/></svg>`,
  "calendar":`<svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M8 3.5v4"/><path d="M16 3.5v4"/><path d="M4 10h16"/></svg>`,
  "calendar-check":`<svg viewBox="0 0 24 24"><rect x="4" y="5.5" width="16" height="15" rx="2.5"/><path d="M8 3.5v4"/><path d="M16 3.5v4"/><path d="M4 10h16"/><path d="m8.5 15.5 2 2 5-5"/></svg>`,
  "coin":`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.4c-.7-.6-1.6-.9-2.8-.9-1.7 0-2.8.8-2.8 2s1 1.7 2.9 2.1c2 .4 3.2 1 3.2 2.4 0 1.5-1.3 2.5-3.2 2.5-1.4 0-2.5-.4-3.3-1.2"/><path d="M12 7v10"/></svg>`,
  "search":`<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4.2-4.2"/></svg>`,
  "maximize":`<svg viewBox="0 0 24 24"><path d="M8 4H4v4"/><path d="M16 4h4v4"/><path d="M8 20H4v-4"/><path d="M16 20h4v-4"/></svg>`,
  "help":`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.3a2.6 2.6 0 1 1 4.2 2.1c-.95.65-1.8 1.25-1.8 2.6"/><path d="M12 17.2h.01"/></svg>`,
  "bell":`<svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 6-2.5 7-2.5 8.5h17C20.5 16 18 15 18 9Z"/><path d="M10 20.5h4"/></svg>`,
  "settings":`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M19 12a7.8 7.8 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2-1.1L14.2 3h-4.4l-.4 2.8a7 7 0 0 0-2 1.1l-2.4-1-2 3.4 2 1.5A7.8 7.8 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2 1.1l.4 2.8h4.4l.4-2.8a7 7 0 0 0 2-1.1l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/></svg>`,
  "chart":`<svg viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3-3 3 2 5-6"/></svg>`,
  "wallet":`<svg viewBox="0 0 24 24"><rect x="3.5" y="6.5" width="17" height="13" rx="2.5"/><path d="M16 11.5h4.5v4H16a2 2 0 0 1 0-4Z"/><path d="M5.5 6.5 8 4h10"/></svg>`,
  "receipt":`<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-3-1.8-3 1.8-3-1.8L6 21V3Z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h3"/></svg>`,
  "alert":`<svg viewBox="0 0 24 24"><path d="M12 4 21 20H3L12 4Z"/><path d="M12 9.5v5"/><path d="M12 17.5h.01"/></svg>`,
  "user-plus":`<svg viewBox="0 0 24 24"><circle cx="9" cy="7.5" r="3.5"/><path d="M3.5 20c.6-3.2 2.6-5 5.5-5h1.5c1.2 0 2.2.3 3.1.8"/><path d="M19 8v6"/><path d="M22 11h-6"/></svg>`,
  "user-check":`<svg viewBox="0 0 24 24"><circle cx="9" cy="7.5" r="3.5"/><path d="M3.5 20c.6-3.2 2.6-5 5.5-5h1.5c1.2 0 2.2.3 3.1.8"/><path d="m15.5 13.5 2 2 4-4"/></svg>`,
  "user-x":`<svg viewBox="0 0 24 24"><circle cx="9" cy="7.5" r="3.5"/><path d="M3.5 20c.6-3.2 2.6-5 5.5-5h1.5c1.2 0 2.2.3 3.1.8"/><path d="m17 10 4 4"/><path d="m21 10-4 4"/></svg>`,
  "users":`<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3.5"/><path d="M2.5 20c.6-3.1 2.5-5 5.5-5s4.9 1.9 5.5 5"/><path d="M15.5 7.5a3 3 0 0 1 0 5.8"/><path d="M16.5 15c2.5.4 4.1 2.1 4.7 5"/></svg>`,
  "presentation":`<svg viewBox="0 0 24 24"><rect x="4" y="4.5" width="16" height="11.5" rx="1.5"/><path d="M12 16v4"/><path d="M8 20h8"/><path d="M8 9h3"/><path d="M8 12h7"/></svg>`,
  "handshake":`<svg viewBox="0 0 24 24"><path d="M7 12.5 10.5 16a2 2 0 0 0 2.8 0l3.9-3.9"/><path d="m2.8 12 4-4 3.2 3.2"/><path d="m21.2 12-4-4-3 3"/><path d="M8 8h8"/></svg>`,
  "info":`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 8h.01"/></svg>`,
  "play":`<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7-11-7Z"/></svg>`,
  "list":`<svg viewBox="0 0 24 24"><path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><path d="M4 6h.01"/><path d="M4 12h.01"/><path d="M4 18h.01"/></svg>`,
  "phone":`<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 11.2 19 19.4 19.4 0 0 1 5 12.8 19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.45 2.1L8 9.7a16 16 0 0 0 6.3 6.3l1.3-1.25a2 2 0 0 1 2.1-.45c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9Z"/></svg>`,
  "link":`<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/></svg>`,
  "upload":`<svg viewBox="0 0 24 24"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/></svg>`,
  "facebook":`<svg viewBox="0 0 24 24"><path d="M15 8h-2a2 2 0 0 0-2 2v2H9v3h2v6h3v-6h2.2l.8-3H14v-1.5c0-.6.4-1 1-1h2V8h-2Z"/></svg>`
};
const API = {
  token: localStorage.getItem("eduka_center_token") || localStorage.getItem("token") || "",
  headers(){ return this.token ? {Authorization:"Bearer "+this.token,"Content-Type":"application/json"} : {"Content-Type":"application/json"}; },
  async get(url, fallback){ try{ const r=await fetch(url,{headers:this.headers()}); const d=await r.json(); return d || fallback; }catch(e){ return fallback; } },
  async post(url, body){ try{ const r=await fetch(url,{method:"POST",headers:this.headers(),body:JSON.stringify(body)}); return await r.json(); }catch(e){ return {ok:false,error:e.message}; } }
};
const state = window.state = { page:"dashboard", finance:null, students:[], teachers:[], groups:[], courses:[], expenses:[], debtors:[], attendance:[], dashboard:{}, leads:[], reminders:[] };
const $ = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
window.renderIcons = function renderIcons(){ $$("[data-icon]").forEach(el=>{ const k=el.dataset.icon; if(ICONS[k]) el.innerHTML=ICONS[k]; }); }
function money(n){ return Number(n||0).toLocaleString("uz-UZ"); }
function pageTitle(t, count){ return `<div class="page-head"><h1>${t}${count!==undefined?` <small>Miqdor — <b>${count}</b></small>`:""}</h1></div>`; }
function btn(label, cls="", icon="plus"){ return `<button class="btn ${cls}">${icon?`<span data-icon="${icon}"></span>`:""}${label}</button>`; }
function filters(items){ return `<div class="filters">${items.map(x=> x.startsWith("select:") ? `<select><option>${x.replace("select:","")}</option></select>` : x==="Filtr" ? `<button class="primary">Filtr</button>` : `<input placeholder="${x}">`).join("")}</div>`; }
function table(heads, rows){ return `<div class="table-wrap"><table class="table"><thead><tr>${heads.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows?.length?rows.join(""):`<tr><td class="empty-row" colspan="${heads.length}">Ko‘rsatiladigan ma'lumotlar yo‘q</td></tr>`}</tbody></table></div>`; }
function setActive(page){ $$(".side-nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===page || (financePages.includes(page)&&b.dataset.page==="finance") || (reportPages[page]&&b.dataset.page==="reports") || (settingsPages[page]&&b.dataset.page==="settings"))); }
window.go = function go(page){ state.page=page; setActive(page); history.replaceState(null,"",`/app/${page}`); renderPage(page); }

const financePages = ["finance","finance-withdraw","finance-expenses","salary","debtors"];
const reportPages = {"conversion-reports":"Konversiya hisobotlari","attendance-summary":"Davomat hisobotlari","leads-report":"Lidlar hisobotlari","left-students":"Guruhni tark etgan o‘quvchilar","workly-report":"Workly hisobotlari","sms-journal":"Yuborilgan SMS jurnali","calls-journal":"Qo‘ng‘iroqlar jurnali","journals":"Jurnallar"};
const settingsPages = {"general-settings":"Umumiy sozlamalari","login-settings":"Sistemaga kirish","lead-form-settings":"Lid forma","payment-methods":"To‘lov usullari","contacts-settings":"Aloqa","integrations":"Integratsiyalar","exams-settings":"Imtihonlar","receipt-settings":"Chek","billing-settings":"Hisob va to‘lovlar","landing-settings":"Landing page","auto-sms":"Auto-SMS"};

window.loadData = async function loadData(){
  await API.post('/api/app/init', { centerName: location.hostname.split('.')[0] || 'main' });
  const [students,teachers,groups,courses,leads,reminders,finance,expenses,debtors,attendance,dashboard] = await Promise.all([
    API.get("/api/app/students",{ok:false,students:[]}),
    API.get("/api/app/teachers",{ok:false,teachers:[]}),
    API.get("/api/app/groups",{ok:false,groups:[]}),
    API.get("/api/app/courses",{ok:false,courses:[]}),
    API.get("/api/app/leads",{ok:false,leads:[]}),
    API.get("/api/app/reminders",{ok:false,reminders:[]}),
    API.get("/api/app/finance/summary",{ok:false,income:0,expenses:0,profit:0,payments:[]}),
    API.get("/api/app/expenses",{ok:false,expenses:[]}),
    API.get("/api/app/debtors",{ok:false,debtors:[]}),
    API.get("/api/app/attendance",{ok:false,attendance:[]}),
    API.get("/api/app/dashboard",{ok:false,stats:{}})
  ]);
  state.students = students.students || students.items || [];
  state.teachers = teachers.teachers || teachers.items || [];
  state.groups = groups.groups || groups.items || [];
  state.courses = courses.courses || courses.items || [];
  state.leads = leads.leads || leads.items || [];
  state.reminders = reminders.reminders || reminders.items || [];
  state.finance = finance.ok !== false ? finance : {income:0,expenses:0,profit:0,payments:[]};
  state.expenses = expenses.expenses || [];
  state.debtors = debtors.debtors || [];
  state.attendance = attendance.attendance || [];
  state.dashboard = dashboard.stats || {};
}

function dashboard(){
  const cards = [
    ["user-check","Faol lidlar",state.leads.length],
    ["graduation","Faol talabalar",state.students.length],
    ["layers","Guruhlar",state.groups.length],
    ["alert","Qarzdorlar",0],
    ["presentation","Sinov darsida",0],
    ["handshake","Joriy oyda to‘laganlar",0],
    ["user-x","Faol guruhni tark etganlar",0],
    ["users","Sinov muddatidan keyin ketdi",0]
  ];
  return `<div class="stats-grid">${cards.map(c=>`<article class="stat-card"><span data-icon="${c[0]}"></span><p>${c[1]}</p><b>${c[2]}</b></article>`).join("")}</div>
  <div class="empty-panel">Ko‘rsatiladigan ma'lumotlar yo‘q</div>
  <section class="schedule"><div class="tabs"><button class="active">Toq kunlar</button><button>Juft kunlar</button><button>Boshqa</button><h3>Jadval</h3><span>Gorizontal <i></i></span></div><div class="schedule-line"></div></section>`;
}
function leads(){ return `${filters(["Ism yoki telefon orqali qidirish","select:Bo‘lim","select:Kurslar bo‘yicha","select:Taglar","select:Mijoz manbalari","select:Xodimlar tomonidan","select:Vazifa","Sanadan boshlab - Sana bo‘yicha","Filtr"])}
  <div class="kanban">${["LEADS","EXPECTATION","SET"].map((x,i)=>`<div class="kanban-col"><h3>${x} (0 / 0)</h3><div class="lead-card"><span data-icon="user-plus"></span></div></div>`).join("")}</div>`; }
function teachers(){ return `${pageTitle("O‘qituvchilar",state.teachers.length).replace("</div>",`<div>${btn("Yangisini qo‘shish","orange","plus")} ${btn("Import","outline","upload")}</div></div>`)}
  <div class="notice"><span data-icon="check-circle"></span> Diqqat! CEO profili orqali o‘qituvchini boshqa filialga biriktirishingiz mumkin.</div>
  ${table(["Ism","Telefon","Fan","Holat"], state.teachers.map(t=>`<tr><td>${t.name||t.full_name||"-"}</td><td>${t.phone||"-"}</td><td>${t.subject||"-"}</td><td><span class="badge green">Faol</span></td></tr>`))}`; }
function groups(){ return `${pageTitle("Guruhlar",state.groups.length).replace("</div>",`${btn("Yangisini qo‘shish","orange","plus")}</div>`)}
  ${filters(["select:Faol guruhlar","select:O‘qituvchi","select:Kurslar bo‘yicha","select:Kunlar","select:Taglar","Boshlanish sanasi","Tugash sanasi"])}
  ${table(["Guruh","Kurslar","O‘qituvchi","Kunlar","Mashg‘ulotlar sanalari","O‘tilgan muddat","Xonalar","Talabalar","Amallar"], state.groups.map(g=>`<tr><td>${g.name||"-"}</td><td>${g.course||"-"}</td><td>${g.teacherName||g.teacher_name||"-"}</td><td>${g.days||"-"}</td><td>${g.time||"-"}</td><td>-</td><td>${g.room||"-"}</td><td>${g.studentCount||0}</td><td>...</td></tr>`))}`; }
function students(){ return `${pageTitle("Talabalar",state.students.length).replace("</div>",`${btn("Yangisini qo‘shish","orange","plus")}</div>`)}
  ${filters(["Ism yoki telefon orqali qidirish","select:Kurslar","select:Talaba holati","select:Moliyaviy holati","select:Taglar bo‘yicha","Qo‘shimcha ID","Guruhlar soni","Boshlanish sanasi","Tugash sanasi","Filtr"])}
  ${table(["Foto","Ism","Telefon","Guruhlar","O‘qituvchilar","Mashg‘ulotlar sanalari","Balans","Izoh"], state.students.map(s=>`<tr><td></td><td>${s.name||s.full_name||"-"}</td><td>${s.phone||"-"}</td><td>${s.groupName||"-"}</td><td>${s.teacherName||"-"}</td><td>-</td><td>${money(s.balance||0)}</td><td>${s.note||"-"}</td></tr>`))}`; }
function reminders(){ return `${pageTitle("Eslatmalar").replace("</div>",`${btn("Qo‘shish","","plus")}</div>`)}${filters(["select:Aktiv","select:Xodimni tanlang","select:Tag tanlang","Sanani tanlang","Sanani tanlang"])}
  <div class="two-col equal"><div class="module"><h2><b style="color:#ef4444">0</b> Muddati o‘tgan</h2><div class="empty-panel" style="min-height:120px">Boshqa yo‘q</div></div><div class="module"><h2><b style="color:#1455ff">0</b> Bugun</h2><div class="empty-panel" style="min-height:120px">Boshqa yo‘q</div></div></div>`; }
function attendance(){ return `${pageTitle("Davomat hisobotlari",0)}<div class="module">${filters(["28.05.2026","Ism","Telefon","select:Faol","select:Guruh","select:O‘qituvchi","select:Davomat","Filtr"])}${table(["№","Ism","Telefon","Holati","Guruh","O‘qituvchi","Dars vaqti","Davomat","Oxirgi izoh","Harakatlar"],[])}</div>`; }
function teacherAttendance(){ return `${pageTitle("Ustozlar davomati")}<div class="module"><div class="empty-panel" style="min-height:180px">Bo‘sh</div></div>`; }
function rating(){ return `${pageTitle("Reyting")}<div class="module"><div class="empty-panel" style="min-height:180px">Ko‘rsatiladigan ma'lumotlar yo‘q</div></div>`; }

function financeShell(active, body){
  const items = [["finance","coin","Barcha to‘lovlar"],["finance-withdraw","wallet","Yechib olish"],["finance-expenses","chart","Xarajatlar"],["salary","receipt","Ish haqi"],["debtors","alert","Qarzdorlar"]];
  return `<div class="layout-with-sub"><aside class="sub-menu"><div class="sub-title">Moliya</div>${items.map(i=>`<button data-sub-page="${i[0]}" class="${active===i[0]?"active":""}"><span data-icon="${i[1]}"></span>${i[2]}</button>`).join("")}</aside><section>${body}</section></div>`;
}
function finance(){
  const f=state.finance||{income:0,profit:0,payments:[]};
  const rows=(f.payments||[]).map(p=>`<tr><td>${String(p.paidAt||p.paid_at||"").slice(0,16).replace("T"," ")}</td><td>${p.studentName||p.student_name||"-"}</td><td>${money(p.amount)}</td><td>${p.paymentType||p.payment_type||"-"}</td><td>-</td><td>${p.note||"-"}</td><td>-</td></tr>`);
  return financeShell("finance", `<h1>Barcha to‘lovlar</h1><div class="metric-row"><div class="metric-card"><div><h2>To‘lovlar miqdori: <b>${money(f.income)} UZS</b></h2><p>01.05.2026 — 31.05.2026</p></div></div><div class="metric-card"><div><h2>Sof foyda miqdori: <b>${money(f.profit)} UZS</b></h2><p>01.05.2026 — 31.05.2026</p></div></div></div><div class="empty-panel" style="min-height:170px;width:40%">Ko‘rsatiladigan ma'lumotlar yo‘q</div>${filters(["Sanadan boshlab","Sana bo‘yicha","Ism yoki Telefon","select:Guruhni tanlash","select:Kurs","select:O‘qituvchi","select:To‘lov turi","Sum","Filtr"])}${table(["Sana","Talaba ismi","Sum","To‘lov turi","O‘qituvchi","Izoh","Xodim"],rows)}`);
}
function financeWithdraw(){ return financeShell("finance-withdraw", `<h1>Yechib olish</h1><div class="two-col"><div><div class="metric-card"><div><h2>Jami yechib olishlar: <b>0 UZS</b> (01.05.2026 — 31.05.2026)</h2></div><span data-icon="coin"></span></div>${filters(["Sanadan boshlab","Sana bo‘yicha","Ism yoki Telefon","Sum","select:Kurs","Filtr"])}${table(["Sana","Talaba ismi","Sum","Izoh","Xodim","Harakatlar"],[])}</div><div class="module empty-panel" style="min-height:170px">Ko‘rsatiladigan ma'lumotlar yo‘q</div></div>`); }
function financeExpenses(){ return financeShell("finance-expenses", `<h1>Xarajatlar</h1><div class="two-col"><div><div class="metric-card"><div><h2>Jami xarajatlar miqdori: <b>0 UZS</b></h2></div><span data-icon="coin"></span></div><div class="chart-box" data-name="Xarajatlar"></div></div><div class="module"><h2>Yangi xarajatlar</h2><div class="form-grid"><label>Nomi *<input></label><label>Sana *<input value="28.05.2026"></label><label>Turkum *<select><option>Tanlang</option></select></label><label>Oluvchi<input></label><label>Sum *<input></label><label>To‘lov turi *</label><div class="radio-grid"><label><input type="radio"> Naqd pul</label><label><input type="radio"> Payme</label><label><input type="radio"> Plastik karta</label><label><input type="radio"> Uzum</label><label><input type="radio"> Click</label><label><input type="radio"> Humo</label></div><button class="btn orange">Saqlash</button></div></div></div>`); }
function salary(){ return financeShell("salary", `<h1>Ish haqi</h1><div class="module"><h2><span data-icon="settings"></span> Ish haqi kalkulyatorini sozlash</h2><div class="metric-card"><h2><b>1</b> Barcha o‘qituvchilar uchun standart xarajatlarni belgilash parametrlarini ko‘rsating</h2></div><div class="filters"><input placeholder="Oylik miqdori"><select><option>O‘zgarmas</option></select><button>Qo‘shish</button></div><div class="metric-card"><h2><b>2</b> Individual hisob-kitobni belgilang</h2></div>${table(["Hisoblash usuli","Maosh turi","Miqdori","Kurs","Guruh","O‘qituvchi","Talaba","Amallar"],[])}</div>`); }
function debtors(){ return financeShell("debtors", `<h1>Qarzdorlar <small>Miqdor — <b>0</b></small></h1><div class="metric-card"><h2>Jami: <b>0 UZS</b></h2><span data-icon="coin"></span></div>${filters(["Qidiruv","select:Talaba holati","select:Guruh","select:Qarz miqdori (oldin)","select:Qarz miqdori (gacha)","Sanadan boshlab","Sana bo‘yicha","select:Vazifa","Filtr"])}<div class="module" style="background:#d9f1f5;color:#2992a8">Ko‘rsatiladigan ma'lumotlar yo‘q</div>`); }

function reportShell(active, body){
 const items=Object.entries(reportPages).map(([k,v])=>[k,"chart",v]);
 return `<div class="layout-with-sub"><aside class="sub-menu"><div class="sub-title">Hisobotlar</div>${items.map(i=>`<button data-sub-page="${i[0]}" class="${active===i[0]?"active":""}"><span data-icon="${i[1]}"></span>${i[2]}</button>`).join("")}</aside><section>${body}</section></div>`;
}
function conversionReports(){ return reportShell("conversion-reports", `<h1>Konversiya hisobotlari</h1>${filters(["01.05.2026","28.05.2026","select:Mijoz manbalari","select:Xodimlar tomonidan","select:Umumiy"])}<div class="two-col"><div><div class="module"><h3>Konversiya</h3><div class="report-tabs"><button class="active">So‘rovlar</button><button>Kutish</button><button>To‘plam</button><button>Davomat</button><button>To‘langan</button></div><table class="soft-table"><tr><th>Jami</th><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td></tr></table></div><br>${table(["FIO","Telefon","Holati","Xodimni ismi"],[])}</div><div class="module"><h3>Sotuv voronkasi</h3>${["So‘rovlar","Kutish","To‘plam","Davomat","To‘langan"].map(x=>`<div class="funnel-row"><b>0</b><span>${x}<div class="bar"></div></span><em>0%</em></div>`).join("")}</div></div>`); }
function attendanceSummary(){ return reportShell("attendance-summary", `<h1>Davomat hisobotlari</h1><div class="two-col"><table class="soft-table"><tr><td>Kelgan talabalar (eng kami bir marta)</td><td>0</td></tr><tr><td>Kelmagan (martadan ko‘p)</td><td>0</td></tr><tr><td>Davomat bo‘sh</td><td>0</td></tr><tr style="background:#eaf4ff"><td>Barchasi</td><td>0</td></tr></table><div class="module"><h3>Filtr</h3><div class="form-grid"><label>Sanadan boshlab<input value="28.05.2026"></label><label>Sana bo‘yicha<input value="28.05.2026"></label><label>Filiallar<select><option>Main branch</option></select></label><label>Guruh<select><option>Select</option></select></label><button class="btn">Filtr</button></div></div></div>`); }
function leadsReport(){ return reportShell("leads-report", `<h1>Lidlar hisobotlari</h1><div class="module"><div class="two-col"><div><div class="metric-card"><h2>Lidlar soni: <b>0</b> (01.01.2026 — 31.05.2026)</h2><span data-icon="coin"></span></div><div class="filters"><input value="01.01.2026"><input value="31.05.2026"><button class="primary">Hisoblang</button></div></div><div class="chart-box" data-name="Lidlar soni"></div></div></div>`); }
function leftStudents(){ return reportShell("left-students", `<h1>Guruhni tark etgan o‘quvchilar <small>Miqdor — <b>0</b></small></h1><div class="module">${filters(["01.05.2026","29.05.2026","select:Kurs","select:O‘qituvchi","select:Arxivlash sabablari","select:Holati","Filtr"])}<div class="two-col equal"><div><h3>Ustoz kesimida</h3><div class="chart-box"></div></div><div><h3>Kurs kesimida</h3><div class="chart-box"></div></div><div><h3>Oylik kesimida</h3><div class="chart-box"></div></div><div><h3>Sabab kesimida</h3><div class="chart-box"></div></div></div></div>`); }
function genericReport(key){ return reportShell(key, `<h1>${reportPages[key]||"Hisobot"}</h1><div class="module"><div class="empty-panel" style="min-height:180px">Ko‘rsatiladigan ma'lumotlar yo‘q</div>${table(["Sana","Holat","Xodim","Izoh"],[])}</div>`); }

function settingsShell(active, body){
 const items=Object.entries(settingsPages);
 return `<div class="layout-with-sub"><aside class="sub-menu"><div class="sub-title">Sozlamalar</div>${items.map(([k,v])=>`<button data-sub-page="${k}" class="${active===k?"active":""}"><span data-icon="${k==="integrations"?"link":k==="auto-sms"?"bell":"settings"}"></span>${v}</button>`).join("")}</aside><section>${body}</section></div>`;
}
function generalSettings(){return settingsShell("general-settings",`<div class="settings-shell"><aside class="settings-tabs"><button class="active">Umumiy sozlamalari</button><button>Sistemaga kirish</button><button>Lid forma</button><button>To‘lov usullari</button></aside><div class="settings-content"><h1>Umumiy sozlamalari</h1><div class="form-grid two"><label>O‘quv markazining nomi *<input value="EDUKA"></label><label>O‘quv markazining telefon raqami *<input value="998998939000"></label><label>Ish boshlanish vaqti *<input value="09:00"></label><label>Ish tugash vaqti *<input value="18:00"></label><label>Animatsiya <span class="switch on"></span></label><label>Asosiy rang<div class="color-dots"><span></span><span></span><span></span><span></span><span></span></div></label></div><br><button class="btn">Saqlash</button></div></div>`)}
function loginSettings(){return settingsShell("login-settings",`<div class="settings-shell"><aside class="settings-tabs"><button>Umumiy sozlamalari</button><button class="active">Sistemaga kirish</button><button>Lid forma</button></aside><div class="settings-content"><h1>Sistemaga kirish</h1><div class="two-col"><div><h3>Shakl rasm</h3><div class="upload-box">Faylni bu yerga suring yoki yuklash uchun bosing</div><h3>Forma matni</h3><div class="editor-box"><div class="editor-toolbar">Normal · Sans Serif · ≡ · link · A</div><div class="editor-area">Platformani ishga tushirishda EDUKA qo‘llab-quvvatlash resurslaridan foydalanishingiz mumkin!</div></div><h3>Shaxsiy CSS</h3><textarea style="width:100%;height:120px;border:1px solid #d7e0ec"></textarea><br><br><button class="btn">Saqlash</button></div><div><div class="module">Platformani ishga tushirishda EDUKA qo‘llab-quvvatlash resurslaridan foydalanishingiz mumkin!</div></div></div></div></div>`)}
function leadFormSettings(){return settingsShell("lead-form-settings",`<h1>Lid forma</h1><div class="two-col"><div class="module"><h3>Shakl rasm</h3><div class="upload-box">Faylni bu yerga suring yoki yuklash uchun bosing</div><h3>Forma matni</h3><div class="editor-box"><div class="editor-toolbar">Normal · Sans Serif · ≡ · link · A</div><div class="editor-area">O‘quv markaziga so‘rov qoldirish</div></div><h3>Forma to‘ldirilgandan so‘ng chiqadigan matn</h3><div class="editor-box"><div class="editor-toolbar">Normal</div><div class="editor-area">Tez orada siz bilan bog‘lanamiz.</div></div></div><div class="module" style="border-top:8px solid #1455ff"><h2>O‘quv markaziga so‘rov qoldirish</h2><p>Kerakli ma'lumotlarni qoldiring va menejerlarimiz siz bilan bog‘lanadi.</p></div></div>`)}
function paymentMethods(){return settingsShell("payment-methods",`<h1>To‘lov usullari</h1><div class="form-grid three module"><label>Payme merchant ID<input></label><label>Uzum service ID<input></label><label>Click service ID<input></label></div><br><div class="two-col"><div class="module"><h3>Payme</h3><div class="form-grid"><label>Kompaniya havolasi<input value="https://api.eduka.uz/payme_billing/8029"></label><label>Identifikator<input></label><label>Foydalanuvchi nomi<input value="Paycom"></label><label>Parol<input></label></div></div><div class="module"><h3>Midtrans</h3><div class="form-grid"><label>MIDTRANS SERVER KEY<input></label><label>MIDTRANS CLIENT KEY<input></label></div></div></div><br><button class="btn">Saqlash</button>`)}
function contactsSettings(){return settingsShell("contacts-settings",`<h1>Aloqa</h1><div class="two-col"><div class="module"><h3>PlayMobile SMS</h3><div class="form-grid"><label>Gateway username<input></label><label>Gateway password<input></label><label>Originator<input value="3700"></label></div></div><div class="module"><h3>Eskiz SMS</h3><div class="form-grid"><label>Eskiz email<input></label><label>Eskiz secret key<input></label><label>Eskiz nickname<input></label></div></div></div><br><button class="btn">Saqlash</button>`)}
function integrations(){return settingsShell("integrations",`<h1>Bog‘langan integratsiyalar</h1><p>Ijtimoiy tarmoq hisoblari va CRM tizimlarini ulang va boshqaring</p><div class="integration-row"><div class="app-icon"><span data-icon="facebook"></span></div><div><b>Facebook sahifasi</b><br><small>Facebook biznes sahifangizni ulang</small></div><span>Ulanmagan</span><button>Ulash</button></div><div class="integration-row"><div class="app-icon"><span data-icon="link"></span></div><div><b>amoCRM | Kommo</b><br><small>Lidlarni amoCRM bilan sinxronlang</small></div><span>Ulanmagan</span><button>Ulash</button></div><div class="two-col"><div class="module"><h3>Workly</h3><div class="form-grid"><label>Workly client id<input></label><label>Workly secret<input></label><label>Workly username<input></label><label>Workly password<input></label></div></div><div class="module"><h3>Telegram Reports</h3><input style="width:100%;height:38px;border:1px solid #d7e0ec"><p>Telegram bot orqali avtomatik hisobot yuborilishi uchun ID kiriting.</p></div></div>`)}
function examsSettings(){return settingsShell("exams-settings",`<h1>Imtihonlar</h1><div class="module form-grid">${["faol talabalarni","sinov darsidagi talabalarni","arxivlangan talabalarni","muzlatilgan talabalarni","o‘chirilgan talabalarni"].map(x=>`<label><input type="checkbox"> Imtihonlar: ${x} hisobga oling</label>`).join("")}<button class="btn">Saqlash</button></div>`)}
function receiptSettings(){return settingsShell("receipt-settings",`<h1>Chek</h1><div class="two-col"><div class="module form-grid">${["Logotip","Image field","Text field","Tekshirish raqami","Kompaniya","Filial","Talaba","Telefon","Balans","Guruh","Kurs narxi","O‘qituvchi","Turi","To‘lov miqdori","Sana","Xodim"].map(x=>`<label><input type="checkbox"> Yashirish: ${x}</label>`).join("")}</div><div class="receipt"><p><b>Tekshirish raqami:</b> №12345</p><p><b>Kompaniya:</b> EDUKA</p><p><b>Filial:</b> Main branch</p><p><b>Talaba:</b> Student Name</p><p><b>Telefon:</b> +998901234567</p><p><b>Balans:</b> 1 000 UZS</p><p><b>Guruh:</b> Group Name</p><p><b>To‘lov miqdori:</b> 200000 UZS</p></div></div>`)}
function billingSettings(){return settingsShell("billing-settings",`<h1>Hisob va to‘lovlar</h1><div class="module"><label>Talabalar uchun to‘lov rejimi *</label><input style="width:100%;height:38px;border:1px solid #d7e0ec" value="Oylik (kalendar oyiga)" disabled><br><br><h3>Others</h3><div class="form-grid">${["O‘qituvchilarga: talabalarga SMS yuborishga ruxsat bering","O‘qituvchilarga: talabalar ma'lumotlarini yashirish","O‘qituvchilar: davomatni faqat dars davomida belgilash","Jadval: guruhlarni kabinet/o‘qituvchi bilan kesib o‘tishga ruxsat bering","Guruh balansini ko‘rsatish"].map(x=>`<label><input type="checkbox"> ${x}</label>`).join("")}</div><br><button class="btn">Saqlash</button></div>`)}
function landingSettings(){return settingsShell("landing-settings",`<h1>Landing page</h1><div class="module form-grid two"><label>Hero sarlavha<input value="O‘quv markazingizni yangi bosqichga olib chiqing"></label><label>Telefon<input value="+998 99 893 90 00"></label><label>Telegram<input value="https://t.me/eduka_sales"></label><label>Instagram<input value="https://www.instagram.com/eduka_uz/"></label></div><br><button class="btn">Saqlash</button>`)}
function autoSms(){return settingsShell("auto-sms",`<h1>Auto-SMS</h1><div class="sms-layout"><div>${["Oldindan to‘lov haqida xabarnoma","Balans yetarli emas","To‘lov amalga oshirildi","Talaba guruhga qo‘shildi","Talaba tug‘ilgan kuni","Talaba darsda ishtirok etmadi"].map((x,i)=>`<div class="sms-type ${i===0?"active":""}"><span>${x}</span><span class="switch ${i===0?"on":""}"></span></div>`).join("")}</div><div class="module"><h3>SMS matn</h3><textarea style="width:100%;height:140px;border:1px solid #d7e0ec;border-radius:8px;padding:14px">Assalomu Alaykum, {STUDENT}! {LC} o‘quv markazida o‘qish uchun to‘lovingiz tez orada tugaydi.</textarea><h3>Yuborilgan SMS misoli</h3><div class="module" style="background:#eef2f7">Assalomu Alaykum, Ibrohim! EDUKA o‘quv markazida o‘qish uchun to‘lovingiz tez orada tugaydi.</div><br><button class="btn">Saqlash</button></div><div class="module"><h3>Tavsif</h3><p>Xabar talabaga to‘lov muddati tugashidan 3 kun oldin yuboriladi.</p><p style="color:#ef4444">Diqqat! Ushbu o‘zgaruvchilar faqat Auto-SMS uchun ishlaydi.</p><p>{STUDENT} - Talabaning ismi<br>{GROUP} - Guruh nomi<br>{SUM} - To‘lov miqdori<br>{TEACHER} - O‘qituvchi ismi<br>{ROOM} - Xona<br>{BALANCE} - Talabaning balansi</p></div></div>`)}

function renderPage(page){
 const map = {dashboard,leads,teachers,groups,students,reminders,rating,attendance,"teacher-attendance":teacherAttendance,finance,"finance-withdraw":financeWithdraw,"finance-expenses":financeExpenses,salary,debtors,"conversion-reports":conversionReports,"attendance-summary":attendanceSummary,"leads-report":leadsReport,"left-students":leftStudents,"workly-report":()=>genericReport("workly-report"),"sms-journal":()=>genericReport("sms-journal"),"calls-journal":()=>genericReport("calls-journal"),journals:()=>genericReport("journals"),"general-settings":generalSettings,"login-settings":loginSettings,"lead-form-settings":leadFormSettings,"payment-methods":paymentMethods,"contacts-settings":contactsSettings,integrations, "exams-settings":examsSettings,"receipt-settings":receiptSettings,"billing-settings":billingSettings,"landing-settings":landingSettings,"auto-sms":autoSms, reports:conversionReports, settings:generalSettings };
 $("#content").innerHTML = (map[page]||dashboard)();
 renderIcons();
}
window.openDrawer = function openDrawer(type){
 const titles={student:"Yangi foydalanuvchi qo‘shish",teacher:"Yangi o‘qituvchi qo‘shish",group:"Yangi guruh qo‘shish",payment:"To‘lov qabul qilish"};
 $("#drawerTitle").textContent=titles[type]||"Qo‘shish";
 $("#drawerBody").innerHTML=`<div class="form-grid"><label>Telefon<input placeholder="+998"></label><label>Ism<input></label>${type==="group"?`<label>Kurs tanlash<select><option>Tanlang</option></select></label><label>O‘qituvchi<select><option>Tanlang</option></select></label><label>Dars vaqti<input></label>`:""}${type==="payment"?`<label>Summa<input></label><label>To‘lov turi<select><option>Naqd pul</option><option>Card</option></select></label>`:""}<label>Izoh<textarea></textarea></label><button>Saqlash</button></div>`;
 $("#drawerBackdrop").hidden=false; $("#drawer").hidden=false;
}
window.closeDrawer = function closeDrawer(){ $("#drawerBackdrop").hidden=true; $("#drawer").hidden=true; }
function bind(){
 $("#sideNav").addEventListener("click",e=>{ const b=e.target.closest("button[data-page]"); if(!b) return; go(b.dataset.page==="reports"?"conversion-reports":b.dataset.page==="settings"?"general-settings":b.dataset.page); });
 document.body.addEventListener("click",e=>{ const b=e.target.closest("[data-sub-page]"); if(b){ go(b.dataset.subPage); } const d=e.target.closest("[data-open-drawer]"); if(d){ openDrawer(d.dataset.openDrawer); } });
 $("#quickAddBtn").addEventListener("click",()=>{ $("#quickPop").hidden=!$("#quickPop").hidden; });
 $("#drawerClose").addEventListener("click",closeDrawer); $("#drawerBackdrop").addEventListener("click",closeDrawer);
 $("#langBtn").addEventListener("click",()=>$("#langPop").hidden=!$("#langPop").hidden); $("#profileBtn").addEventListener("click",()=>$("#profilePop").hidden=!$("#profilePop").hidden);
 $("#logoutBtn")?.addEventListener("click",()=>{localStorage.removeItem("eduka_center_token"); location.href="/";});
}
document.addEventListener("DOMContentLoaded",async()=>{
 renderIcons(); bind();
 await loadData();
 const key = location.pathname.replace("/app/","").replace(/^\/+|\/+$/g,"");
 go(key && key!=="app" ? key : "dashboard");
 setTimeout(()=>$("#bootLoader")?.classList.add("hide"),250);
});

/* ===== EDUKA REAL CRM ENGINE FRONTEND PHASE 1 ===== */
(function(){
  const oldLoadData = window.loadData;
  const oldOpenDrawer = window.openDrawer;
  const apiHeaders = () => {
    const token = localStorage.getItem("eduka_center_token") || localStorage.getItem("token") || "";
    return token ? { Authorization: "Bearer " + token, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
  };
  async function apiGet(url, fallback){
    try {
      const r = await fetch(url, { headers: apiHeaders() });
      const d = await r.json();
      return d || fallback;
    } catch(e) { return fallback; }
  }
  async function apiPost(url, body){
    const r = await fetch(url, { method:"POST", headers: apiHeaders(), body: JSON.stringify(body) });
    return await r.json();
  }
  async function initRealCrm(){
    try { await apiPost("/api/app/init", { centerName: location.hostname.split(".")[0] || "main" }); } catch(e) {}
  }
  function toast(msg, ok=true){
    let t = document.getElementById("realCrmToast");
    if(!t){
      t = document.createElement("div");
      t.id = "realCrmToast";
      t.style.cssText = "position:fixed;right:24px;bottom:96px;z-index:9999;background:#071137;color:#fff;padding:14px 18px;border-radius:14px;box-shadow:0 14px 35px rgba(0,0,0,.18);font-weight:800;transition:.2s";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.background = ok ? "#071137" : "#dc2626";
    t.style.opacity = "1";
    setTimeout(()=>t.style.opacity="0", 2200);
  }
  function closeDrawerSafe(){
    const b = document.getElementById("drawerBackdrop");
    const d = document.getElementById("drawer");
    if(b) b.hidden = true;
    if(d) d.hidden = true;
  }
  function getVal(id){ return (document.getElementById(id)?.value || "").trim(); }
  function optionList(items, label, valueKey="id", labelKey="name"){
    return `<option value="">${label}</option>` + (items||[]).map(x=>`<option value="${x[valueKey]}">${x[labelKey] || "-"}</option>`).join("");
  }
  async function refreshRealData(){
    if(typeof loadData === "function") await loadData();
    if(typeof go === "function") go((window.state && state.page) || "dashboard");
  }

  window.openDrawer = function(type){
    const titles={student:"Yangi talaba qo‘shish",teacher:"Yangi o‘qituvchi qo‘shish",group:"Yangi guruh qo‘shish",payment:"To‘lov qabul qilish",course:"Yangi kurs qo‘shish",expense:"Yangi xarajat qo‘shish",reminder:"Eslatma yaratish"};
    document.getElementById("drawerTitle").textContent=titles[type]||"Qo‘shish";
    let html = "";
    const courses = (window.state && state.courses) || [];
    const teachers = (window.state && state.teachers) || [];
    const students = (window.state && state.students) || [];
    const groups = (window.state && state.groups) || [];

    if(type === "student"){
      html = `<form id="realCrmForm" class="form-grid">
        <label>Telefon<input id="f_phone" placeholder="+998"></label>
        <label>Ism<input id="f_name" required></label>
        <label>Tug‘ilgan sana<input id="f_birth" type="date"></label>
        <label>Jins<select id="f_gender"><option value="">Tanlang</option><option value="male">Erkak</option><option value="female">Ayol</option></select></label>
        <label>Guruh<select id="f_group">${optionList(groups,"Guruhni tanlang")}</select></label>
        <label>Izoh<textarea id="f_note"></textarea></label>
        <button>Saqlash</button>
      </form>`;
    } else if(type === "teacher"){
      html = `<form id="realCrmForm" class="form-grid">
        <label>Telefon<input id="f_phone" placeholder="+998"></label>
        <label>Ism<input id="f_name" required></label>
        <label>Fan<input id="f_subject" placeholder="Masalan: Ingliz tili"></label>
        <label>Oylik<input id="f_salary" type="number" placeholder="0"></label>
        <button>Saqlash</button>
      </form>`;
    } else if(type === "course"){
      html = `<form id="realCrmForm" class="form-grid">
        <label>Kurs nomi<input id="f_name" required placeholder="Masalan: IELTS"></label>
        <label>Narx<input id="f_price" type="number" placeholder="600000"></label>
        <label>Davomiylik oy<input id="f_duration" type="number" value="1"></label>
        <button>Saqlash</button>
      </form>`;
    } else if(type === "group"){
      html = `<form id="realCrmForm" class="form-grid">
        <label>Nomi<input id="f_name" required placeholder="Masalan: IELTS Evening"></label>
        <label>Kurs tanlash<select id="f_course">${optionList(courses,"Kurs tanlang")}</select></label>
        <label>O‘qituvchi<select id="f_teacher">${optionList(teachers,"O‘qituvchi tanlang")}</select></label>
        <label>Kunlar<input id="f_days" placeholder="Dush, Chorsh, Jum"></label>
        <label>Dars vaqti<input id="f_time" placeholder="09:00 - 10:30"></label>
        <label>Xona<input id="f_room" placeholder="201-xona"></label>
        <label>Boshlanish sanasi<input id="f_start" type="date"></label>
        <button>Saqlash</button>
      </form>`;
    } else if(type === "payment"){
      html = `<form id="realCrmForm" class="form-grid">
        <label>Talaba<select id="f_student">${optionList(students,"Talabani tanlang")}</select></label>
        <label>Guruh<select id="f_group">${optionList(groups,"Guruhni tanlang")}</select></label>
        <label>Summa<input id="f_amount" type="number" required></label>
        <label>To‘lov turi<select id="f_payment_type"><option value="cash">Naqd pul</option><option value="card">Karta</option><option value="click">Click</option><option value="payme">Payme</option><option value="uzum">Uzum</option></select></label>
        <label>Izoh<textarea id="f_note"></textarea></label>
        <button>Saqlash</button>
      </form>`;
    } else if(type === "expense"){
      html = `<form id="realCrmForm" class="form-grid">
        <label>Nomi<input id="f_title" required></label>
        <label>Turkum<input id="f_category"></label>
        <label>Summa<input id="f_amount" type="number" required></label>
        <label>To‘lov turi<select id="f_payment_type"><option value="cash">Naqd pul</option><option value="card">Karta</option></select></label>
        <label>Izoh<textarea id="f_note"></textarea></label>
        <button>Saqlash</button>
      </form>`;
    } else if(type === "reminder"){
      html = `<form id="realCrmForm" class="form-grid">
        <label>Sarlavha<input id="f_title" required></label>
        <label>Izoh<textarea id="f_note"></textarea></label>
        <label>Vaqt<input id="f_due" type="datetime-local"></label>
        <button>Saqlash</button>
      </form>`;
    }

    document.getElementById("drawerBody").innerHTML = html || "<p>Forma topilmadi</p>";
    document.getElementById("drawerBackdrop").hidden=false;
    document.getElementById("drawer").hidden=false;

    const form = document.getElementById("realCrmForm");
    if(form){
      form.addEventListener("submit", async (e)=>{
        e.preventDefault();
        const submit = form.querySelector("button");
        submit.disabled = true;
        submit.textContent = "Saqlanmoqda...";
        try{
          let result;
          if(type==="student"){
            result = await apiPost("/api/app/students", { name:getVal("f_name"), phone:getVal("f_phone"), birthDate:getVal("f_birth") || null, gender:getVal("f_gender"), groupId:getVal("f_group") || null, note:getVal("f_note") });
          } else if(type==="teacher"){
            result = await apiPost("/api/app/teachers", { name:getVal("f_name"), phone:getVal("f_phone"), subject:getVal("f_subject"), salary:getVal("f_salary") });
          } else if(type==="course"){
            result = await apiPost("/api/app/courses", { name:getVal("f_name"), price:getVal("f_price"), durationMonths:getVal("f_duration") });
          } else if(type==="group"){
            result = await apiPost("/api/app/groups", { name:getVal("f_name"), courseId:getVal("f_course") || null, teacherId:getVal("f_teacher") || null, days:getVal("f_days"), lessonTime:getVal("f_time"), room:getVal("f_room"), startDate:getVal("f_start") || null });
          } else if(type==="payment"){
            result = await apiPost("/api/app/payments", { studentId:getVal("f_student") || null, groupId:getVal("f_group") || null, amount:getVal("f_amount"), paymentType:getVal("f_payment_type"), note:getVal("f_note") });
          } else if(type==="expense"){
            result = await apiPost("/api/app/expenses", { title:getVal("f_title"), category:getVal("f_category"), amount:getVal("f_amount"), paymentType:getVal("f_payment_type"), note:getVal("f_note") });
          } else if(type==="reminder"){
            result = await apiPost("/api/app/reminders", { title:getVal("f_title"), note:getVal("f_note"), dueAt:getVal("f_due") || null });
          }
          if(!result || !result.ok) throw new Error(result?.error || "Saqlanmadi");
          toast("Ma'lumot saqlandi ✅");
          closeDrawerSafe();
          await refreshRealData();
        }catch(err){
          toast(err.message || "Xatolik", false);
          submit.disabled = false;
          submit.textContent = "Saqlash";
        }
      });
    }
  };

  const oldLoadData2 = window.loadData;
  window.loadData = async function(){
    await initRealCrm();
    const [students,teachers,groups,courses,leads,reminders,finance,expenses,debtors,attendance,dashboard] = await Promise.all([
      apiGet("/api/app/students",{students:[]}),
      apiGet("/api/app/teachers",{teachers:[]}),
      apiGet("/api/app/groups",{groups:[]}),
      apiGet("/api/app/courses",{courses:[]}),
      apiGet("/api/app/leads",{leads:[]}),
      apiGet("/api/app/reminders",{reminders:[]}),
      apiGet("/api/app/finance/summary",{income:0,expenses:0,profit:0,payments:[]}),
      apiGet("/api/app/expenses",{expenses:[]}),
      apiGet("/api/app/debtors",{debtors:[]}),
      apiGet("/api/app/attendance",{attendance:[]}),
      apiGet("/api/app/dashboard",{stats:{}})
    ]);
    if(!window.state) window.state = {};
    state.students = students.students || [];
    state.teachers = teachers.teachers || [];
    state.groups = groups.groups || [];
    state.courses = courses.courses || [];
    state.leads = leads.leads || [];
    state.reminders = reminders.reminders || [];
    state.finance = finance.ok !== false ? finance : {income:0,expenses:0,profit:0,payments:[]};
    state.expenses = expenses.expenses || [];
    state.debtors = debtors.debtors || [];
    state.attendance = attendance.attendance || [];
    state.dashboard = dashboard.stats || {};
  };

  function addRealButtons(){
    document.body.addEventListener("click", (e)=>{
      const txt = (e.target.textContent || "").trim();
      if(e.target.closest(".btn") && txt.includes("Yangisini qo‘shish")){
        const page = window.state?.page;
        if(page==="students") return openDrawer("student");
        if(page==="teachers") return openDrawer("teacher");
        if(page==="groups") return openDrawer("group");
      }
      if(e.target.closest(".btn") && txt.includes("Qo‘shish") && window.state?.page==="reminders"){
        return openDrawer("reminder");
      }
    }, true);
  }

  // Patch render functions if they are global function declarations.
  setTimeout(()=>{
    try{
      addRealButtons();
      const quick = document.getElementById("quickPop");
      if(quick && !quick.querySelector('[data-open-drawer="course"]')){
        quick.insertAdjacentHTML("beforeend", `<button data-open-drawer="course"><span data-icon="presentation"></span> Yangi kurs</button><button data-open-drawer="expense"><span data-icon="chart"></span> Xarajat</button><button data-open-drawer="reminder"><span data-icon="bell"></span> Eslatma</button>`);
        if(typeof renderIcons === "function") renderIcons();
      }
    }catch(e){}
  }, 500);
})();
