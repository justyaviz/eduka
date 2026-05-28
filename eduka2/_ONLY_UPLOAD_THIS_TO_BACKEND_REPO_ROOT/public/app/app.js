const SVG_ICONS = {
  "arrow-up-right": `<svg viewBox="0 0 24 24"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>`,
  "plus": `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
  "download": `<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>`,
  "teacher": `<svg viewBox="0 0 24 24"><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M6 10v4c0 2 3 4 6 4s6-2 6-4v-4"/></svg>`,
  "layers": `<svg viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/></svg>`,
  "graduation": `<svg viewBox="0 0 24 24"><path d="M22 9 12 4 2 9l10 5 10-5Z"/><path d="M6 11v5c2 3 10 3 12 0v-5"/><path d="M22 9v6"/></svg>`,
  "clock": `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  "trophy": `<svg viewBox="0 0 24 24"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v6a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v3a3 3 0 0 0 3 3"/><path d="M17 6h3v3a3 3 0 0 1-3 3"/></svg>`,
  "calendar": `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/></svg>`,
  "calendar-check": `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/><path d="m8 16 2 2 5-5"/></svg>`,
  "coin": `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9.5c-.7-.7-1.7-1-3-1-1.8 0-3 1-3 2.4 0 3 6 1.5 6 4.2 0 1.3-1.2 2.4-3 2.4-1.3 0-2.4-.4-3.2-1.2"/></svg>`,
  "search": `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`,
  "maximize": `<svg viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>`,
  "help": `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4.3 2.2c-1 .7-1.8 1.3-1.8 2.8"/><path d="M12 17h.01"/></svg>`,
  "bell": `<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>`,
  "settings": `<svg viewBox="0 0 24 24"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .6 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-.6 1Z"/></svg>`,
  "refresh": `<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M3 12A9 9 0 0 1 18.5 5.8"/><path d="M18 2v4h4"/><path d="M6 22v-4H2"/></svg>`,
  "check-circle": `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>`,
  "user-check": `<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg>`,
  "user-x": `<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m17 8 5 5M22 8l-5 5"/></svg>`,
  "users": `<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>`,
  "alert": `<svg viewBox="0 0 24 24"><path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 17h.01"/></svg>`,
  "presentation": `<svg viewBox="0 0 24 24"><path d="M3 4h18v12H3z"/><path d="M12 16v5M8 21h8"/><path d="M8 9h3M8 12h8"/></svg>`,
  "handshake": `<svg viewBox="0 0 24 24"><path d="m8 12 3 3a2 2 0 0 0 3 0l5-5"/><path d="m2 12 4-4 4 4"/><path d="m18 8 4 4-4 4"/><path d="M6 8h12"/></svg>`,
  "wallet": `<svg viewBox="0 0 24 24"><path d="M3 7h18v12H3z"/><path d="M16 12h5v4h-5z"/><path d="M3 7l3-4h12l3 4"/></svg>`,
  "pie": `<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-9-9v9h9Z"/><path d="M12 3a9 9 0 0 1 9 9"/></svg>`,
  "receipt": `<svg viewBox="0 0 24 24"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z"/><path d="M9 7h6M9 11h6M9 15h3"/></svg>`,
  "user-plus": `<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>`
};
function renderSvgIcons(){document.querySelectorAll("[data-icon]").forEach(el=>{const key=el.dataset.icon;if(SVG_ICONS[key]) el.innerHTML=SVG_ICONS[key];});}

const TOKEN="eduka_center_token", USER="eduka_center_user", CENTER="eduka_center_info";
let state={students:[],groups:[],payments:[],teachers:[],leads:[],reminders:[],page:"dashboard"};
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
function api(path,o={}){return fetch(path,{...o,headers:{"Content-Type":"application/json",...(localStorage.getItem(TOKEN)?{Authorization:"Bearer "+localStorage.getItem(TOKEN)}:{}),...(o.headers||{})}}).then(async r=>{let d={};try{d=await r.json()}catch{}if(r.status===401){logout(false);throw new Error(d.error||"Unauthorized")}if(!r.ok||d.ok===false)throw new Error(d.realError||d.error||"API xato");return d})}
function money(n){return Number(n||0).toLocaleString("uz-UZ")}
function fmt(d){if(!d)return"-";try{return new Intl.DateTimeFormat("uz-UZ",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(d))}catch{return"-"}}
function badge(s){return `<span class="badge ${s||""}">${s||"-"}</span>`}
function toast(t){const x=document.createElement("div");x.textContent=t;x.style.cssText="position:fixed;right:22px;bottom:22px;background:#06123e;color:white;padding:14px 18px;border-radius:12px;z-index:9999;font-weight:800";document.body.appendChild(x);setTimeout(()=>x.remove(),3000)}
function table(el,heads,rows,map,empty="Bo‘sh"){el.innerHTML=`<thead><tr>${heads.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.length?rows.map(map).join(""):`<tr><td class="empty-row" colspan="${heads.length}">${empty}</td></tr>`}</tbody>`}
async function login(){const d=await api("/api/app/login",{method:"POST",body:JSON.stringify({email:$("#appEmail").value,password:$("#appPassword").value,subdomain:$("#appSubdomain").value||undefined})});localStorage.setItem(TOKEN,d.token);localStorage.setItem(USER,JSON.stringify(d.user));localStorage.setItem(CENTER,JSON.stringify(d.center));showApp()}
function logout(red=true){localStorage.removeItem(TOKEN);localStorage.removeItem(USER);localStorage.removeItem(CENTER);if(red)history.replaceState(null,"","/app/login");showLogin()}
function showLogin(){$("#appLoginPage").hidden=false;$("#appShell").hidden=true}
async function showApp(){$("#appLoginPage").hidden=true;$("#appShell").hidden=false;const u=JSON.parse(localStorage.getItem(USER)||"{}"),c=JSON.parse(localStorage.getItem(CENTER)||"{}");$("#userName").textContent=(u.fullName||"YAHYOBEK").toUpperCase();await openPage(pageFromPath())}
function pageFromPath(){const p=location.pathname.replace("/app/","").replace("/",""); const map={dashboard:"dashboard",leads:"leads",teachers:"teachers",groups:"groups",students:"students",reminders:"reminders",attendance:"attendance",finance:"finance",rating:"rating"};return map[p]||"dashboard"}
async function openPage(p){state.page=p;$$(".page").forEach(x=>x.classList.toggle("active",x.dataset.view===p));$$(".crm-nav button").forEach(x=>x.classList.toggle("active",x.dataset.page===p));history.replaceState(null,"",p==="dashboard"?"/app/dashboard":`/app/${p}`);try{if(p==="dashboard")await loadDashboard();if(p==="leads")await loadLeads();if(p==="teachers")await loadTeachers();if(p==="students")await loadStudents();if(p==="groups")await loadGroups();if(p==="reminders")await loadReminders();if(p==="attendance")await loadAttendance();if(p==="finance")await loadFinance()}catch(e){toast(e.message)}}
async function loadDashboard(){const d=await api("/api/app/dashboard");$("#dashStudents").textContent=d.stats.students||0;$("#dashGroups").textContent=d.stats.groups||0;$("#dashPaid").textContent=d.stats.monthlyPayments?1:0;try{const l=await api("/api/app/leads");$("#dashLeads").textContent=(l.leads||[]).filter(x=>x.status==="LEADS").length}catch{}}
async function loadStudents(){const q=$("#studentSearch")?.value||"";const d=await api(`/api/app/students${q?`?q=${encodeURIComponent(q)}`:""}`);state.students=d.students||[];$("#studentCount").textContent=state.students.length;table($("#studentsTable"),["☐","Foto","Ism","Telefon","Guruhlar","O‘qituvchilar","Mashg‘ulotlar sanalari","Balans","Izoh"],state.students,s=>`<tr><td>☐</td><td>—</td><td>${s.fullName}</td><td>${s.phone||"-"}</td><td>-</td><td>-</td><td>-</td><td>${money(s.balance)}</td><td>${s.note||"-"}</td></tr>`)}
async function loadGroups(){const d=await api("/api/app/groups");state.groups=d.groups||[];$("#groupCount").textContent=state.groups.length;table($("#groupsTable"),["Guruh","Kurslar","O‘qituvchi","Kunlar","Mashg‘ulotlar sanalari","O‘tilgan muddat","Xonalar","Tags","Talabalar","Amallar"],state.groups,g=>`<tr><td>${g.name}</td><td>${g.courseName||"-"}</td><td>${g.teacherName||"-"}</td><td>${g.scheduleText||"-"}</td><td>${fmt(g.createdAt)}</td><td>-</td><td>-</td><td>-</td><td>-</td><td>↓</td></tr>`)}
async function loadTeachers(){const d=await api("/api/app/teachers");state.teachers=d.teachers||[];$("#teacherCount").textContent=state.teachers.length;table($("#teachersTable"),["Ism","Telefon","Fan","Holat","Yaratildi"],state.teachers,t=>`<tr><td>${t.fullName}</td><td>${t.phone||"-"}</td><td>${t.subject||"-"}</td><td>${badge(t.status)}</td><td>${fmt(t.createdAt)}</td></tr>`)}
async function loadLeads(){const d=await api("/api/app/leads");state.leads=d.leads||[];const statuses=["LEADS","EXPECTATION","SET"];$("#leadsKanban").innerHTML=statuses.map(st=>{const items=state.leads.filter(x=>x.status===st);return `<section class="kanban-col"><h3>${st} (${items.length} / ${state.leads.length})</h3>${items.length?items.map(x=>`<div class="lead-card">${x.fullName||x.phone||"Lead"}</div>`).join(""):`<div class="lead-card">♙</div>`}</section>`}).join("")}
async function loadReminders(){const d=await api("/api/app/reminders");state.reminders=d.reminders||[];const now=new Date();const over=state.reminders.filter(r=>r.remindAt&&new Date(r.remindAt)<now);const today=state.reminders.filter(r=>r.remindAt&&new Date(r.remindAt).toDateString()===now.toDateString());const future=state.reminders.filter(r=>r.remindAt&&new Date(r.remindAt)>now);$("#reminderColumns").innerHTML=[["Muddati o‘tgan",over,"#ff4b4b"],["Bugun",today,"#2992ff"],["Kelajak",future,"#89909a"]].map(x=>`<div class="reminder-col"><h2 style="color:${x[2]}"><b>${x[1].length}</b>${x[0]}</h2><div class="reminder-line"><span>✓ Boshqa yo‘q</span></div></div>`).join("")}
async function loadAttendance(){const date=$("#attendanceDate")?.value||new Date().toISOString().slice(0,10);if($("#attendanceDate"))$("#attendanceDate").value=date;const d=await api(`/api/app/attendance?date=${date}`);$("#attendanceCount").textContent=(d.attendance||[]).length;table($("#attendanceTable"),["№","Ism","Telefon","Holati","Guruh","O‘qituvchi","Dars vaqti","Davomat","Oxirgi izoh","Harakatlar"],(d.attendance||[]),(a,i)=>`<tr><td>${i+1}</td><td>${a.student_name}</td><td>-</td><td>-</td><td>${a.group_name}</td><td>-</td><td>-</td><td>${badge(a.status)}</td><td>${a.note||"-"}</td><td>...</td></tr>`)}
async function loadFinance(){const d=await api("/api/app/finance/summary");$("#financeIncome").textContent=money(d.income)+" UZS";$("#financeProfit").textContent=money(d.profit)+" UZS";table($("#financeTable"),["Sana","Talaba ismi","Sum","To‘lov turi","O‘qituvchi","Izoh","Xodim"],d.payments||[],p=>`<tr><td>${fmt(p.paidAt)}</td><td>${p.studentName||"-"}</td><td>${money(p.amount)}</td><td>${p.paymentType}</td><td>-</td><td>${p.note||"-"}</td><td>-</td></tr>`)}
function openDrawer(title,html){$("#drawerTitle").textContent=title;$("#drawerBody").innerHTML=html;$("#drawer").hidden=false;$("#drawerOverlay").hidden=false}
function closeDrawer(){$("#drawer").hidden=true;$("#drawerOverlay").hidden=true}
function studentForm(){openDrawer("Yangi foydalanuvchi qo‘shish",`<div class="drawer-form"><label>Telefon<input id="mPhone" placeholder="+998"></label><label>Ism<input id="mFullName"></label><label>Tug‘ilgan sana<input id="mBirth" type="date"></label><label>Jins<div class="radio-row"><span>○ Erkak</span><span>○ Ayol</span></div></label><label>Izoh<textarea id="mNote"></textarea></label><p>Qo‘shimcha aloqa</p><div class="contact-icons"><span>☏</span><span>🔑</span><span>♙</span><span>✉</span><span>➤</span><span>⚑</span><span>⌖</span><span>▣</span></div><label>Guruh<select id="mGroup"><option value="">Guruhni tanlang</option>${state.groups.map(g=>`<option value="${g.id}">${g.name}</option>`).join("")}</select></label><label>Sanadan boshlab<input id="mStart" type="date"></label><button id="saveStudent">Saqlash</button></div>`)}
function teacherForm(){openDrawer("Yangi o‘qituvchi qo‘shish",`<div class="drawer-form"><label>Telefon<input id="mPhone" placeholder="+998"></label><label>Ism<input id="mFullName"></label><label>Fan<input id="mSubject"></label><label>Tug‘ilgan sana<input type="date"></label><label>Jins<div class="radio-row"><span>○ Erkak</span><span>○ Ayol</span></div></label><label>Foto<input type="file"></label><button id="saveTeacher">Saqlash</button></div>`)}
function groupForm(){openDrawer("Yangi guruh qo‘shish",`<div class="drawer-form"><label>Nomi<input id="mGroupName"></label><label>Kurs tanlash<input id="mCourse" placeholder="Variantlarni tanlang"></label><label>O‘qituvchini tanlang<input id="mTeacher" placeholder="Variantlarni tanlang"></label><label>Kunlar<input id="mSchedule" placeholder="Variantlarni tanlang"></label><label>Xonani tanlang<input id="mRoom" placeholder="Variantlarni tanlang"></label><label>Darsning boshlanish vaqti<input type="time"></label><label>Guruh boshlanish sanasi<input type="date"></label><button id="saveGroup">Saqlash</button></div>`)}
function reminderForm(){openDrawer("Eslatma yaratish",`<div class="drawer-form"><label>*Sarlavha<input id="mTitle" placeholder="Sarlavhani kiriting"></label><label>Izoh<textarea id="mNote" placeholder="Izohni kiriting"></textarea></label><label>Taglar<select id="mTag"><option>Tag tanlang</option></select></label><label>Tafsilotlar<input id="mRemindAt" type="datetime-local"></label><label>Xodimni tanlang<select id="mAssign"><option>Tanlanmagan</option></select></label><button id="saveReminder">Yaratish</button></div>`)}
function paymentForm(){openDrawer("To‘lov",`<div class="drawer-form"><label>Talaba ismi<input id="mStudentName"></label><label>Summa<input id="mAmount" type="number"></label><label>To‘lov turi<select id="mType"><option value="cash">Naqd</option><option value="card">Karta</option></select></label><label>Izoh<textarea id="mPayNote"></textarea></label><button id="savePayment">Saqlash</button></div>`)}
async function saveStudent(){await api("/api/app/students",{method:"POST",body:JSON.stringify({fullName:$("#mFullName").value,phone:$("#mPhone").value,birthDate:$("#mBirth").value||undefined,note:$("#mNote")?.value||undefined})});closeDrawer();toast("Talaba qo‘shildi");await loadStudents()}
async function saveTeacher(){await api("/api/app/teachers",{method:"POST",body:JSON.stringify({fullName:$("#mFullName").value,phone:$("#mPhone").value,subject:$("#mSubject").value})});closeDrawer();toast("O‘qituvchi qo‘shildi");await loadTeachers()}
async function saveGroup(){await api("/api/app/groups",{method:"POST",body:JSON.stringify({name:$("#mGroupName").value,courseName:$("#mCourse").value,teacherName:$("#mTeacher").value,scheduleText:$("#mSchedule").value})});closeDrawer();toast("Guruh qo‘shildi");await loadGroups()}
async function saveReminder(){await api("/api/app/reminders",{method:"POST",body:JSON.stringify({title:$("#mTitle").value,note:$("#mNote").value,remindAt:$("#mRemindAt").value||undefined})});closeDrawer();toast("Eslatma yaratildi");await loadReminders()}
async function savePayment(){await api("/api/app/payments",{method:"POST",body:JSON.stringify({studentName:$("#mStudentName").value,amount:$("#mAmount").value,paymentType:$("#mType").value,note:$("#mPayNote").value})});closeDrawer();toast("To‘lov qo‘shildi");await loadFinance()}
document.addEventListener("DOMContentLoaded",async()=>{renderSvgIcons();const host=location.hostname;if(host.endsWith(".eduka.uz")&&host!=="eduka.uz"&&host!=="www.eduka.uz"){$("#appSubdomain")&&(($("#appSubdomain").value=host),$(".subdomain-label")?.setAttribute("hidden","hidden"))}$("#appLoginForm")?.addEventListener("submit",e=>{e.preventDefault();login().catch(err=>toast(err.message))});$("#appLogout")?.addEventListener("click",()=>logout(true));$$("[data-page]").forEach(b=>b.addEventListener("click",()=>openPage(b.dataset.page)));$("#quickPlus")?.addEventListener("click",()=>$("#quickMenu").hidden=!$("#quickMenu").hidden);$("#langBtn")?.addEventListener("click",()=>$("#langMenu").hidden=!$("#langMenu").hidden);$("#profileBtn")?.addEventListener("click",()=>$("#profileMenu").hidden=!$("#profileMenu").hidden);$("#drawerClose")?.addEventListener("click",closeDrawer);$("#drawerOverlay")?.addEventListener("click",closeDrawer);$("#studentSearch")?.addEventListener("input",()=>loadStudents());$("#refreshAttendance")?.addEventListener("click",()=>loadAttendance());document.addEventListener("click",e=>{const open=e.target.closest("[data-open]");if(open){const t=open.dataset.open;if(t==="student")studentForm();if(t==="teacher")teacherForm();if(t==="group")groupForm();if(t==="reminder")reminderForm()}const q=e.target.closest("[data-quick]");if(q){$("#quickMenu").hidden=true;const t=q.dataset.quick;if(t==="student")studentForm();if(t==="teacher")teacherForm();if(t==="group")groupForm();if(t==="payment")paymentForm()}if(e.target.id==="saveStudent")saveStudent().catch(err=>toast(err.message));if(e.target.id==="saveTeacher")saveTeacher().catch(err=>toast(err.message));if(e.target.id==="saveGroup")saveGroup().catch(err=>toast(err.message));if(e.target.id==="saveReminder")saveReminder().catch(err=>toast(err.message));if(e.target.id==="savePayment")savePayment().catch(err=>toast(err.message))});setTimeout(()=>$("#appLoader")?.classList.add("hide"),500);if(localStorage.getItem(TOKEN)){try{await api("/api/app/me");await showApp()}catch{logout(false)}}else showLogin()})

/* ===== PHASE 3.2 REMAINING SECTIONS JS ===== */
(function(){
  const reportsItems = [
    ["conversion-reports","users","Konversiya hisobotlari"],
    ["attendance-summary","calendar-check","Davomat hisobotlari"],
    ["leads-report","download","Lidlar hisobotlari"],
    ["left-students","chart","Guruhni tark etgan o‘quvchilar"],
    ["workly-report","user-check","Workly hisobotlari"],
    ["sms-journal","phone","Yuborilgan SMS jurnali"],
    ["calls-journal","phone","Qo‘ng‘iroqlar jurnali"],
    ["journals","list","Jurnallar"]
  ];

  const settingsItems = [
    ["general-settings","settings","Umumiy sozlamalari"],
    ["login-settings","upload","Sistemaga kirish"],
    ["lead-form-settings","download","Lid forma"],
    ["payment-methods","wallet","To‘lov usullari"],
    ["contacts-settings","phone","Aloqa"],
    ["integrations","link","Integratsiyalar"],
    ["exams-settings","check-circle","Imtihonlar"],
    ["receipt-settings","receipt","Chek"],
    ["billing-settings","coin","Hisob va to‘lovlar"],
    ["landing-settings","presentation","Landing page"],
    ["auto-sms","bell","Auto-SMS"]
  ];

  const financeItems = [
    ["finance","coin","Barcha to‘lovlar"],
    ["finance-withdraw","wallet","Yechib olish"],
    ["finance-expenses","chart","Xarajatlar"],
    ["salary","receipt","Ish haqi"],
    ["debtors","alert","Qarzdorlar"]
  ];

  function icon(key){ return `<span data-icon="${key}"></span>`; }

  function ensureExtraIcons(){
    if(!window.SVG_ICONS && typeof SVG_ICONS !== "undefined") window.SVG_ICONS = SVG_ICONS;
    const target = (typeof SVG_ICONS !== "undefined") ? SVG_ICONS : {};
    Object.assign(target, {
      chart:`<svg viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 3-3 3 2 5-6"/></svg>`,
      list:`<svg viewBox="0 0 24 24"><path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/><path d="M4 6h.01"/><path d="M4 12h.01"/><path d="M4 18h.01"/></svg>`,
      phone:`<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 11.2 19 19.4 19.4 0 0 1 5 12.8 19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.45 2.1L8 9.7a16 16 0 0 0 6.3 6.3l1.3-1.25a2 2 0 0 1 2.1-.45c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9Z"/></svg>`,
      link:`<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/></svg>`,
      upload:`<svg viewBox="0 0 24 24"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/></svg>`
    });
    if(typeof renderSvgIcons === "function") renderSvgIcons();
  }

  function ensureSubPanels(){
    if(document.getElementById("reportsSubPanel")) return;
    const reports = document.createElement("aside");
    reports.className = "sub-panel";
    reports.id = "reportsSubPanel";
    reports.innerHTML = `<div class="sub-title">Hisobotlar</div>` + reportsItems.map(x=>`<button data-extra-page="${x[0]}">${icon(x[1])}<span>${x[2]}</span></button>`).join("");
    document.body.appendChild(reports);

    const settings = document.createElement("aside");
    settings.className = "sub-panel";
    settings.id = "settingsSubPanel";
    settings.innerHTML = `<div class="sub-title">Sozlamalar</div>` + settingsItems.map(x=>`<button data-extra-page="${x[0]}">${icon(x[1])}<span>${x[2]}</span></button>`).join("");
    document.body.appendChild(settings);
    ensureExtraIcons();
  }

  function ensureSidebarButtons(){
    const nav = document.querySelector(".crm-nav");
    if(!nav || nav.querySelector('[data-page="reports"]')) return;
    nav.insertAdjacentHTML("beforeend", `
      <button data-page="reports">${icon("chart")}<em>Hisobotlar</em></button>
      <button data-page="settings">${icon("settings")}<em>Sozlamalar</em></button>
    `);
    ensureExtraIcons();
  }

  function ensureExtraContainer(){
    if(document.getElementById("extraPage")) return document.getElementById("extraPage");
    const main = document.querySelector(".crm-main");
    const footer = document.querySelector(".crm-footer");
    const section = document.createElement("section");
    section.className = "workspace-page";
    section.id = "extraPage";
    main.insertBefore(section, footer);
    return section;
  }

  function hideNormalPages(){
    document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".workspace-page").forEach(x=>x.classList.remove("active"));
  }

  function showPanel(type){
    ensureSubPanels();
    document.getElementById("reportsSubPanel")?.classList.toggle("show", type==="reports");
    document.getElementById("settingsSubPanel")?.classList.toggle("show", type==="settings");
  }

  function hidePanels(){
    document.getElementById("reportsSubPanel")?.classList.remove("show");
    document.getElementById("settingsSubPanel")?.classList.remove("show");
  }

  function header(title, count=false){
    return `<h1>${title}${count ? ` <small>Miqdor — <b>0</b></small>` : ""}</h1>`;
  }

  function license(){
    return "";
  }

  function filters(names){
    return `<div class="filters-row long">${names.map(n=>{
      if(n.includes("sana") || n.includes("Sana") || n.includes("date")) return `<input placeholder="${n}" value="${n.includes("boshlab")?"01.05.2026":""}">`;
      if(n.includes("Filtr")) return `<button class="blue">${n}</button>`;
      return `<input placeholder="${n}">`;
    }).join("")}</div>`;
  }

  function financeWithdraw(){
    return `${header("Yechib olish")}
      <div class="two-col">
        <div>
          <div class="metric-card"><h2>Jami yechib olishlar: <b>0 UZS</b> (01.05.2026 — 31.05.2026)</h2>${icon("coin")}</div>
          ${filters(["Sanadan boshlab","Sana bo‘yicha","Ism yoki Telefon","Sum","Kurs","Filtr"])}
          <div class="table-wrap"><table><thead><tr><th>Sana</th><th>Talaba ismi</th><th>Sum</th><th>Izoh</th><th>Xodim</th><th>Harakatlar</th></tr></thead><tbody><tr><td class="empty-row" colspan="6">Ko‘rsatiladigan ma'lumotlar yo‘q</td></tr></tbody></table></div>
        </div>
        <div class="module-card empty-wide small">Ko‘rsatiladigan ma'lumotlar yo‘q</div>
      </div>`;
  }

  function financeExpenses(){
    return `${header("Xarajatlar")}
      <div class="two-col">
        <div>
          <div class="metric-card"><h2>Jami xarajatlar miqdori: <b>0 UZS</b></h2>${icon("coin")}</div>
          <div class="chart-box" data-label="" data-name="Xarajatlar"></div>
        </div>
        <div class="module-card">
          <h2>Yangi xarajatlar</h2>
          <div class="form-grid">
            <label>Nomi *<input></label>
            <label>Sana *<input value="28.05.2026"></label>
            <label>Turkum *<select><option>Tanlang</option></select></label>
            <label>Oluvchi<input></label>
            <label>Sum *<input></label>
            <label>To‘lov turi *</label>
            <div class="radio-grid">
              <label><input type="radio"> Naqd pul</label><label><input type="radio"> Payme</label>
              <label><input type="radio"> Plastik karta</label><label><input type="radio"> Uzum</label>
              <label><input type="radio"> Click</label><label><input type="radio"> Humo</label>
              <label><input type="radio"> Bank hisobi</label>
            </div>
            <button class="action-save action-orange">Saqlash</button>
          </div>
        </div>
      </div>`;
  }

  function salary(){
    return `${header("Ish haqi")}
      <div class="module-card">
        <h2>${icon("settings")} Ish haqi kalkulyatorini sozlash</h2>
        <div class="metric-card"><h2><b>1</b> Barcha o‘qituvchilar uchun standart xarajatlarni belgilash parametrlarini ko‘rsating</h2></div>
        <div class="filters-row"><input placeholder="Oylik miqdori"><select><option>O‘zgarmas</option></select><button class="outline">Qo‘shish</button></div>
        <div class="metric-card"><h2><b>2</b> Siz har qanday o‘qituvchilar / kurslar / guruhlar / talabalar uchun individual hisob-kitobni belgilashingiz mumkin.</h2></div>
        <div class="filters-row"><select><option>Hisoblash usuli</option></select><input placeholder="Oylik miqdori"><select><option>O‘zgarmas</option></select><button class="outline">Qo‘shish</button></div>
        <div class="table-wrap"><table><thead><tr><th>Hisoblash usuli</th><th>Maosh turi</th><th>Miqdori</th><th>Kurs</th><th>Guruh</th><th>O‘qituvchi</th><th>Talaba</th><th>Amallar</th></tr></thead><tbody><tr><td class="empty-row" colspan="8">Bo‘sh</td></tr></tbody></table></div>
      </div>`;
  }

  function debtors(){
    return `${header("Qarzdorlar", true)}
      <div class="metric-card"><h2>Jami: <b>0 UZS</b></h2>${icon("coin")}</div>
      ${filters(["Qidiruv","Talaba holati","Guruh","Qarz miqdori (oldin)","Qarz miqdori (gacha)","Sanadan boshlab","Sana bo‘yicha","Vazifa","Filtr"])}
      <div class="module-card" style="background:#d9f1f5;color:#2992a8">Ko‘rsatiladigan ma'lumotlar yo‘q</div>`;
  }

  function conversionReports(){
    return `${header("Konversiya hisobotlari")}
      ${filters(["01.05.2026","28.05.2026","Mijoz manbalari","Xodimlar tomonidan","Umumiy"])}
      <div class="two-col">
        <div>
          <div class="module-card">
            <h3>Konversiya</h3>
            <div class="report-tabs"><button class="active">So‘rovlar</button><button>Kutish</button><button>To‘plam</button><button>Davomat</button><button>To‘langan</button></div>
            <table class="soft-table"><tr><th>Jami</th><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td></tr></table>
          </div>
          <div class="module-card" style="margin-top:16px"><table class="soft-table"><tr><th>FIO</th><th>Telefon</th><th>Holati</th><th>Xodimni ismi</th></tr><tr><td colspan="4" style="text-align:center;height:64px">Hisobotni ko‘rish uchun yuqoridagi voronka bosqichlaridan birini tanlang.</td></tr></table></div>
        </div>
        <div class="module-card">
          <h3>Sotuv voronkasi</h3>
          ${["So‘rovlar","Kutish","To‘plam","Davomat","To‘langan"].map(x=>`<div class="funnel-row"><b>0</b><span>${x}<div class="bar"></div></span><em>0%</em></div>`).join("")}
        </div>
      </div>`;
  }

  function leadsReport(){
    return `${header("Lidlar hisobotlari")}
      <div class="module-card">
        <div class="two-col">
          <div>
            <div class="metric-card"><h2>Lidlar soni: <b>0</b> (01.01.2026 — 31.05.2026)</h2>${icon("coin")}</div>
            <div class="filters-row"><input value="01.01.2026"><input value="31.05.2026"><button class="orange">Hisoblang</button></div>
          </div>
          <div class="chart-box" data-label="" data-name="Lidlar soni"></div>
        </div>
      </div>`;
  }

  function leftStudents(){
    return `${header("Guruhni tark etgan o‘quvchilar", true)}
      <div class="module-card">
        ${filters(["01.05.2026","29.05.2026","Kurs","O‘qituvchi","Arxivlash sabablari","Holati","Filtr"])}
        <div class="two-col wide">
          <div><h3>Ustoz kesimida</h3><div class="chart-box"></div></div>
          <div><h3>Kurs kesimida</h3><div class="chart-box"></div></div>
          <div><h3>Oylik kesimida</h3><div class="chart-box"></div></div>
          <div><h3>Sabab kesimida</h3><div class="chart-box"></div></div>
        </div>
      </div>`;
  }

  function attendanceSummary(){
    return `${header("Davomat hisobotlari")}
      <div class="two-col">
        <table class="soft-table">
          <tr><td>Kelgan talabalar (eng kami bir marta)</td><td>0</td></tr>
          <tr><td>Kelmagan (martadan ko‘p)</td><td>0</td></tr>
          <tr><td>Davomat bo‘sh</td><td>0</td></tr>
          <tr style="background:#eaf4ff"><td>Barchasi</td><td>0</td></tr>
        </table>
        <div class="module-card"><h3>Filtr</h3><div class="form-grid"><label>Sanadan boshlab<input value="28.05.2026"></label><label>Sana bo‘yicha<input value="28.05.2026"></label><label>Filiallar<select><option>Main branch</option></select></label><label>Guruh<select><option>Select</option></select></label><div><button class="action-save">Filtr</button> <button class="outline">Tozalash</button></div></div></div>
      </div>`;
  }

  function genericReport(title){
    return `${header(title)}<div class="module-card"><div class="empty-wide small">Ko‘rsatiladigan ma'lumotlar yo‘q</div><table class="soft-table"><tr><th>Sana</th><th>Holat</th><th>Xodim</th><th>Izoh</th></tr><tr><td colspan="4" style="text-align:center;height:70px">Ma'lumot mavjud emas</td></tr></table></div>`;
  }

  function autoSms(){
    return `${header("Auto-SMS")}
      <div class="tabs-line"><button class="active">Auto-SMS</button><button>SMS shablonlar</button></div>
      <div class="sms-layout">
        <div>
          <h3>SMS turi</h3>
          ${["Oldindan to‘lov haqida xabarnoma","Balans yetarli emas","To‘lov amalga oshirildi","Talaba guruhga qo‘shildi","Talaba tug‘ilgan kuni","Talaba darsda ishtirok etmadi"].map((x,i)=>`<div class="sms-type-card ${i===0?"active":""}"><span>${x}</span><span class="switch ${i===0?"on":""}"></span></div>`).join("")}
        </div>
        <div class="module-card">
          <h3>SMS matn: Oldindan to‘lov haqida xabarnoma</h3>
          <textarea style="width:100%;height:140px;border:1px solid #d7e0ec;border-radius:8px;padding:14px">Assalomu Alaykum, {STUDENT}! {LC} o‘quv markazida o‘qish uchun to‘lovingiz tez orada tugaydi.</textarea>
          <h3>Yuborilgan SMS misoli</h3>
          <div class="module-card" style="background:#eef2f7">Assalomu Alaykum, Ibrohim! EDUKA o‘quv markazida o‘qish uchun to‘lovingiz tez orada tugaydi.</div>
          <button class="action-save" style="float:right;margin-top:20px">Saqlash</button>
        </div>
        <div class="module-card"><h3>Tavsif</h3><p>Xabar talabaga to‘lov muddati tugashidan 3 kun oldin yuboriladi.</p><p style="color:#ef4444">Diqqat! Ushbu o‘zgaruvchilar faqat Auto-SMS uchun ishlaydi.</p><p>{STUDENT} - Talabaning ismi<br>{GROUP} - Guruh nomi<br>{SUM} - To‘lov miqdori<br>{TEACHER} - O‘qituvchi ismi<br>{ROOM} - Xona<br>{BALANCE} - Talabaning balansi</p></div>
      </div>`;
  }

  function settingsShell(active, body){
    return `<div class="settings-layout">
      <aside class="settings-tabs">${settingsItems.filter(x=>!["auto-sms"].includes(x[0])).map(x=>`<button data-settings-tab="${x[0]}" class="${x[0]===active?"active":""}">${x[2]}</button>`).join("")}</aside>
      <section class="settings-content">${body}</section>
    </div>`;
  }

  function generalSettings(){
    return settingsShell("general-settings", `<h1>Umumiy sozlamalari</h1><div class="form-grid two">
      <label>O‘quv markazining nomi *<input value="EDUKA"></label><label>O‘quv markazining telefon raqami *<input value="998998939000"></label>
      <label>Ish boshlanish vaqti *<input value="09:00"></label><label>Ish tugash vaqti *<input value="18:00"></label>
      <label>Dars boshlanish vaqti<input placeholder="Qadam 5 daqiqa"></label><label>Animatsiya <span class="switch on"></span></label>
      <label>Logotip<div class="upload-box">Fayl yuklash</div></label>
      <label>Asosiy rangni ko‘rsating<div class="color-dots"><span></span><span></span><span></span><span></span><span></span></div></label>
    </div><br><button class="action-save">Saqlash</button>`);
  }

  function loginSettings(){
    return settingsShell("login-settings", `<h1>Sistemaga kirish</h1><h3>Shakl rasm</h3><div class="two-col"><div><div class="upload-box">Faylni bu yerga suring yoki yuklash uchun bosing</div><p>Rasm o‘lchami 610x160px bo‘lishini tavsiya etamiz</p><h3>Forma matni</h3><div class="editor-box"><div class="editor-toolbar">Normal · Sans Serif · ≡ · 🔗 · A</div><div class="editor-area">Platformani ishga tushirishda EDUKA qo‘llab-quvvatlash resurslaridan foydalanishingiz mumkin!</div></div><h3>Shaxsiy CSS</h3><textarea style="width:100%;height:120px;border:1px solid #d7e0ec"></textarea><br><br><button class="action-save">Saqlash</button></div><div><div class="module-card">Platformani ishga tushirishda EDUKA qo‘llab-quvvatlash resurslaridan foydalanishingiz mumkin!</div></div></div>`);
  }

  function leadFormSettings(){
    return settingsShell("lead-form-settings", `<h1>Lid forma</h1><div class="two-col"><div><h3>Shakl rasm</h3><div class="upload-box">Faylni bu yerga suring yoki yuklash uchun bosing</div><h3>Forma matni</h3><div class="editor-box"><div class="editor-toolbar">Normal · Sans Serif · ≡ · 🔗 · A</div><div class="editor-area">O‘quv markaziga so‘rov qoldirish</div></div><h3>Forma to‘ldirilgandan so‘ng chiqadigan matn</h3><div class="editor-box"><div class="editor-toolbar">Normal · Sans Serif</div><div class="editor-area">Tez orada siz bilan bog‘lanamiz.</div></div></div><div><div class="module-card" style="border-top:8px solid #1455ff"><h2>O‘quv markaziga so‘rov qoldirish</h2><p>Kerakli ma'lumotlarni qoldiring va menejerlarimiz siz bilan bog‘lanadi.</p></div></div></div>`);
  }

  function paymentMethods(){
    return settingsShell("payment-methods", `<h1>To‘lov usullari</h1><div class="form-grid three"><label>Payme merchant ID<input></label><label>Uzum service ID<input></label><label>Click service ID<input></label></div><br><div class="two-col"><div class="module-card"><h3>Payme</h3><div class="form-grid"><label>Kompaniya havolasi<input value="https://api.eduka.uz/payme_billing/8029"></label><label>Identifikator<input></label><label>Foydalanuvchi nomi<input value="Paycom"></label><label>Parol<input></label></div></div><div class="module-card"><h3>Midtrans</h3><div class="form-grid"><label>MIDTRANS SERVER KEY<input></label><label>MIDTRANS CLIENT KEY<input></label></div></div></div><br><button class="action-save">Saqlash</button>`);
  }

  function contactsSettings(){
    return settingsShell("contacts-settings", `<h1>Aloqa</h1><div class="two-col"><div class="module-card"><h3>PlayMobile SMS</h3><div class="form-grid"><label>Gateway username<input></label><label>Gateway password<input></label><label>Originator<input value="3700"></label></div></div><div class="module-card"><h3>Eskiz SMS</h3><div class="form-grid"><label>Eskiz email<input></label><label>Eskiz secret key<input></label><label>Eskiz nickname<input></label></div></div></div><br><button class="action-save">Saqlash</button>`);
  }

  function integrations(){
    return settingsShell("integrations", `<h1>Bog‘langan integratsiyalar</h1><p>Ijtimoiy tarmoq hisoblari va CRM tizimlarini ulang va boshqaring</p>${[
      ["Facebook sahifasi","Facebook biznes sahifangizni ulang","facebook"],
      ["amoCRM | Kommo","Lidlarni amoCRM hisobingiz bilan sinxronlang","link"]
    ].map(x=>`<div class="integration-row"><div class="app-icon">${icon(x[2])}</div><div><b>${x[0]}</b><br><small>${x[1]}</small></div><span>Ulanmagan</span><button>Ulash</button></div>`).join("")}
    <div class="two-col"><div class="module-card"><h3>Workly</h3><div class="form-grid"><label>Workly client id<input></label><label>Workly secret<input></label><label>Workly username<input></label><label>Workly password<input></label></div></div><div class="module-card"><h3>Telegram Reports</h3><input style="width:100%;height:38px;border:1px solid #d7e0ec"><p>Telegram bot orqali avtomatik hisobot yuborilishi uchun ID kiriting.</p></div></div>`);
  }

  function examsSettings(){
    return settingsShell("exams-settings", `<h1>Imtihonlar</h1><div class="form-grid"><label><input type="checkbox"> Imtihonlar: faol talabalarni hisobga oling</label><label><input type="checkbox"> Imtihonlar: sinov darsidagi talabalarni hisobga oling</label><label><input type="checkbox"> Imtihonlar: arxivlangan talabalarni hisobga oling</label><label><input type="checkbox"> Imtihonlar: muzlatilgan talabalarni hisobga oling</label><label><input type="checkbox"> Imtihonlar: o‘chirilgan talabalarni hisobga oling</label></div><br><button class="action-save">Saqlash</button>`);
  }

  function receiptSettings(){
    return settingsShell("receipt-settings", `<h1>Chek</h1><div class="two-col"><div class="form-grid">
      ${["Logotip","Image field","Text field","Tekshirish raqami","Kompaniya","Filial","Talaba","Telefon","Balans","Guruh","Kurs narxi","O‘qituvchi","Turi","To‘lov miqdori","Sana","Xodim"].map(x=>`<label><input type="checkbox"> Yashirish: ${x}</label>`).join("")}
      </div><div class="receipt-preview"><p><b>Tekshirish raqami:</b> №12345</p><p><b>Kompaniya:</b> EDUKA</p><p><b>Filial:</b> Main branch</p><p><b>Talaba:</b> Student Name</p><p><b>Telefon:</b> +998901234567</p><p><b>Balans:</b> 1 000 UZS</p><p><b>Guruh:</b> Group Name</p><p><b>Kurs narxi:</b> 200000 UZS</p><p><b>O‘qituvchi:</b> Teacher Name</p><p><b>To‘lov miqdori:</b> 200000 UZS</p></div></div>`);
  }

  function billingSettings(){
    return settingsShell("billing-settings", `<h1>Hisob va to‘lovlar</h1><label>Talabalar uchun to‘lov rejimi *</label><input style="width:100%;height:38px;border:1px solid #d7e0ec" value="Oylik (kalendar oyiga)" disabled><br><br><div class="module-card"><h3>Others</h3><div class="form-grid"><label><input type="checkbox"> O‘qituvchilarga: talabalarga SMS yuborishga ruxsat bering</label><label><input type="checkbox"> O‘qituvchilarga: talabalar ma'lumotlarini yashirish</label><label><input type="checkbox"> O‘qituvchilar: davomatni faqat dars davomida belgilash</label><label><input type="checkbox"> Jadval: guruhlarni bitta kabinet / o‘qituvchi bilan kesib o‘tishga ruxsat bering</label><label><input type="checkbox"> Guruh balansini ko‘rsatish</label></div></div><br><button class="action-save">Saqlash</button>`);
  }

  function landingSettings(){
    return settingsShell("landing-settings", `<h1>Landing page</h1><div class="form-grid two"><label>Hero sarlavha<input value="O‘quv markazingizni yangi bosqichga olib chiqing"></label><label>Telefon<input value="+998 99 893 90 00"></label><label>Telegram<input value="https://t.me/eduka_sales"></label><label>Instagram<input value="https://www.instagram.com/eduka_uz/"></label></div><br><button class="action-save">Saqlash</button>`);
  }

  function renderExtraPage(page){
    const el = ensureExtraContainer();
    hideNormalPages();
    el.classList.add("active");
    document.querySelectorAll(".crm-nav button").forEach(x=>x.classList.toggle("active", x.dataset.page===page || (page.includes("report") && x.dataset.page==="reports") || (settingsItems.some(s=>s[0]===page) && x.dataset.page==="settings") || (financeItems.some(f=>f[0]===page) && x.dataset.page==="finance")));
    document.querySelectorAll("[data-extra-page]").forEach(x=>x.classList.toggle("active",x.dataset.extraPage===page));
    document.querySelectorAll("[data-settings-tab]").forEach(x=>x.classList.toggle("active",x.dataset.settingsTab===page));

    const map = {
      "finance-withdraw": financeWithdraw,
      "finance-expenses": financeExpenses,
      "salary": salary,
      "debtors": debtors,
      "conversion-reports": conversionReports,
      "attendance-summary": attendanceSummary,
      "leads-report": leadsReport,
      "left-students": leftStudents,
      "workly-report": () => genericReport("Workly hisobotlari"),
      "sms-journal": () => genericReport("Yuborilgan SMS jurnali"),
      "calls-journal": () => genericReport("Qo‘ng‘iroqlar jurnali"),
      "journals": () => genericReport("Jurnallar"),
      "auto-sms": autoSms,
      "general-settings": generalSettings,
      "login-settings": loginSettings,
      "lead-form-settings": leadFormSettings,
      "payment-methods": paymentMethods,
      "contacts-settings": contactsSettings,
      "integrations": integrations,
      "exams-settings": examsSettings,
      "receipt-settings": receiptSettings,
      "billing-settings": billingSettings,
      "landing-settings": landingSettings
    };

    el.innerHTML = (map[page] || (()=>genericReport(page)))();
    ensureExtraIcons();
    history.replaceState(null,"",`/app/${page}`);
  }

  function patchOpenPage(){
    const oldOpenPage = window.openPage || (typeof openPage === "function" ? openPage : null);
    window.openPage = async function(page){
      ensureSubPanels();
      ensureSidebarButtons();
      if(page==="reports"){ showPanel("reports"); return renderExtraPage("conversion-reports"); }
      if(page==="settings"){ showPanel("settings"); return renderExtraPage("general-settings"); }
      if(financeItems.some(x=>x[0]===page) && page!=="finance"){ hidePanels(); return renderExtraPage(page); }
      if(reportsItems.some(x=>x[0]===page)){ showPanel("reports"); return renderExtraPage(page); }
      if(settingsItems.some(x=>x[0]===page)){ showPanel("settings"); return renderExtraPage(page); }
      hidePanels();
      document.querySelectorAll(".workspace-page").forEach(x=>x.classList.remove("active"));
      if(oldOpenPage) return oldOpenPage(page);
    };
  }

  document.addEventListener("DOMContentLoaded", function(){
    ensureExtraIcons();
    ensureSidebarButtons();
    ensureSubPanels();
    patchOpenPage();

    document.body.addEventListener("click", function(e){
      const extra = e.target.closest("[data-extra-page]");
      if(extra){
        e.preventDefault();
        renderExtraPage(extra.dataset.extraPage);
      }

      const settingsTab = e.target.closest("[data-settings-tab]");
      if(settingsTab){
        e.preventDefault();
        renderExtraPage(settingsTab.dataset.settingsTab);
      }

      const nav = e.target.closest(".crm-nav button[data-page]");
      if(nav && ["reports","settings"].includes(nav.dataset.page)){
        e.preventDefault();
        window.openPage(nav.dataset.page);
      }

      if(nav && nav.dataset.page==="finance"){
        hidePanels();
      }
    });

    // If opened directly from URL
    setTimeout(()=>{
      const key = location.pathname.replace("/app/","");
      if(financeItems.some(x=>x[0]===key) || reportsItems.some(x=>x[0]===key) || settingsItems.some(x=>x[0]===key)){
        renderExtraPage(key);
      }
    }, 700);
  });
})();
