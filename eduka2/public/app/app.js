const ICONS={
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
"edit":`<svg viewBox="0 0 24 24"><path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>`,
"trash":`<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 14h10l1-14"/><path d="M9 7V4h6v3"/></svg>`,
"mail":`<svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/></svg>`,
"room":`<svg viewBox="0 0 24 24"><path d="M4 20V5a1 1 0 0 1 1-1h9v16"/><path d="M14 8h5a1 1 0 0 1 1 1v11"/><path d="M3 20h18"/><path d="M8 8h2"/><path d="M8 12h2"/><path d="M17 12h1"/></svg>`
};

const API={
 token:localStorage.getItem("eduka_center_token")||localStorage.getItem("token")||"",
 headers(){return this.token?{Authorization:"Bearer "+this.token,"Content-Type":"application/json"}:{"Content-Type":"application/json"}},
 async get(url,fallback){try{const r=await fetch(url,{headers:this.headers()});const d=await r.json();return d||fallback}catch(e){return fallback}},
 async post(url,body){try{const r=await fetch(url,{method:"POST",headers:this.headers(),body:JSON.stringify(body)});return await r.json()}catch(e){return{ok:false,error:e.message}}},
 async put(url,body){try{const r=await fetch(url,{method:"PUT",headers:this.headers(),body:JSON.stringify(body)});return await r.json()}catch(e){return{ok:false,error:e.message}}},
 async patch(url,body){try{const r=await fetch(url,{method:"PATCH",headers:this.headers(),body:JSON.stringify(body)});return await r.json()}catch(e){return{ok:false,error:e.message}}},
 async del(url){try{const r=await fetch(url,{method:"DELETE",headers:this.headers()});return await r.json()}catch(e){return{ok:false,error:e.message}}}
};

const state=window.state={page:"dashboard",students:[],teachers:[],groups:[],courses:[],rooms:[],reminders:[],finance:{income:0,expenses:0,profit:0,payments:[]},dashboard:{},me:null,license:null,settings:{name:"",phone:"",workStart:"09:00",workEnd:"18:00"},selectedGroupId:null,selectedGroup:null,selectedGroupStudents:[]};
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
function renderIcons(){ $$("[data-icon]").forEach(el=>{const k=el.dataset.icon;if(ICONS[k])el.innerHTML=ICONS[k]}) }
function money(n){return Number(n||0).toLocaleString("uz-UZ")}
function today(){return new Date().toISOString().slice(0,10)}
function val(id){return ($("#"+id)?.value||"").trim()}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function toast(msg,ok=true){let t=$("#toast");if(!t){t=document.createElement("div");t.id="toast";t.className="toast";document.body.appendChild(t)}t.className="toast "+(ok?"ok":"bad");t.textContent=msg;t.hidden=false;setTimeout(()=>t.hidden=true,2400)}
function option(items,label,map=(x)=>x.name){return `<option value="">${label}</option>`+(items||[]).map(x=>`<option value="${x.id}">${esc(map(x))}</option>`).join("")}
function pageHead(t,count,action){return `<div class="page-head"><h1>${t}${count!==undefined?` <small>Miqdor — <b>${count}</b></small>`:""}</h1>${action||""}</div>`}
function btn(label,type,cls=""){return `<button class="btn ${cls}" data-open-drawer="${type}"><span data-icon="plus"></span>${label}</button>`}
function table(heads,rows){return `<div class="table-wrap"><table class="table"><thead><tr>${heads.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.length?rows.join(""):`<tr><td class="empty-row" colspan="${heads.length}">Ko‘rsatiladigan ma'lumotlar yo‘q</td></tr>`}</tbody></table></div>`}
function filters(items){return `<div class="filters">${items.map(x=>x.startsWith("select:")?`<select><option>${x.slice(7)}</option></select>`:`<input placeholder="${x}">`).join("")}</div>`}

async function loadData(){
 const [students,teachers,groups,courses,rooms,reminders,finance,dashboard,me,license,settings]=await Promise.all([
  API.get("/api/app/students",{students:[]}),
  API.get("/api/app/teachers",{teachers:[]}),
  API.get("/api/app/groups-v2",{groups:[]}),
  API.get("/api/app/courses-v2",{courses:[]}),
  API.get("/api/app/rooms",{rooms:[]}),
  API.get("/api/app/reminders",{reminders:[]}),
  API.get("/api/app/finance/summary",{income:0,expenses:0,profit:0,payments:[]}),
  API.get("/api/app/dashboard",{stats:{}}),
  API.get("/api/app/me",{}),
  API.get("/api/app/license",{}),
  API.get("/api/app/settings/general",{settings:{}})
 ]);
 state.students=students.students||[];
 state.teachers=teachers.teachers||[];
 state.groups=(groups.groups||[]).filter(x=>x.status!=="deleted");
 state.courses=courses.courses||[];
 state.rooms=rooms.rooms||[];
 state.reminders=reminders.reminders||[];
 state.finance=finance.ok!==false?finance:{income:0,expenses:0,profit:0,payments:[]};
 state.dashboard=dashboard.stats||{};
 state.me=me||null;
 state.license=license.license||null;
 state.settings={...state.settings,...(settings.settings||{})};
 updateShellMeta();
}
function updateShellMeta(){
 const p=$("#profileName"); if(p) p.textContent=state.me?.user?.fullName||state.me?.center?.name||"CRM";
 const until=$("#licenseUntil"), status=$("#licenseStatus");
 const l=state.license||{}; const d=l.trial_ends_at||l.next_payment_date;
 if(until) until.textContent=d?new Date(d).toLocaleString("uz-UZ"):`${l.tariff||"Tarif"} · muddat ko‘rsatilmagan`;
 if(status) status.textContent=l.status?`Holat: ${l.status}`:"Litsenziya holati noma’lum";
}

function statCards(){
 const s=state.dashboard||{};
 const cards=[
  ["user-plus","Faol lidlar",s.leads||0],
  ["graduation","Faol talabalar",s.students||state.students.length],
  ["layers","Guruhlar",s.groups||state.groups.length],
  ["alert","Qarzdorlar",0],
  ["presentation","Sinov darsida",0],
  ["handshake","Joriy oyda to‘laganlar",state.finance.payments?.length||0],
  ["user-x","Faol guruhni tark etganlar",0],
  ["users","Sinov muddatidan keyin ketdi",0]
 ];
 return `<div class="stats-grid">${cards.map(c=>`<div class="stat-card"><span data-icon="${c[0]}"></span><p>${c[1]}</p><b>${c[2]}</b></div>`).join("")}</div>`;
}
function dashboard(){
 return statCards()+`<div class="empty-panel">Ko‘rsatiladigan ma'lumotlar yo‘q</div><div class="schedule"><div class="tabs"><button class="active">Toq kunlar</button><button>Juft kunlar</button><button>Boshqa</button><h3>Jadval</h3><span>Gorizontal <i></i></span></div><div class="schedule-line"></div></div>`;
}
function teachers(){
 const rows=state.teachers.filter(t=>t.status!=="deleted").map(t=>`<tr><td>${esc(t.name)}</td><td>${esc(t.phone||"")}</td><td>${esc(t.subject||"")}</td><td>${state.groups.filter(g=>g.teacherId===t.id).length} guruhlar</td><td><button class="icon-btn" data-edit-teacher="${t.id}"><span data-icon="edit"></span></button><button class="icon-btn danger" data-delete-teacher="${t.id}"><span data-icon="trash"></span></button></td></tr>`);
 return pageHead("O‘qituvchilar",state.teachers.length,btn("Yangisini qo‘shish","teacher","orange"))+`<div class="notice"><span data-icon="user-check"></span><div><b>Diqqat!</b><br>CEO profili orqali o‘qituvchini boshqa filialga biriktirishingiz mumkin.</div></div>`+table(["Ism","Telefon","Fan","Guruhlar","Amallar"],rows);
}
function students(){
 const rows=state.students.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.name)}</td><td>${esc(s.phone||"")}</td><td>${esc(s.groupName||"")}</td><td>${money(s.balance)} UZS</td><td><button class="icon-btn" data-open-drawer="payment" data-student-id="${s.id}"><span data-icon="wallet"></span></button></td></tr>`);
 return pageHead("Talabalar",state.students.length,btn("Yangisini qo‘shish","student","orange"))+filters(["Ism yoki telefon orqali qidirish","select:Kurslar","select:Talaba holati","select:Moliyaviy holati","Teglar bo‘yicha"])+table(["#","Ism","Telefon","Guruhlar","Balans","Amallar"],rows);
}
function courses(){
 const rows=state.courses.map(c=>`<div class="course-card" data-open-course="${c.id}"><div class="course-hero"><h3>${esc(c.name)}</h3><span data-icon="graduation"></span></div><div class="course-body"><b>${esc(c.name)}</b><p>${money(c.price)} UZS</p><small>Kod: ${esc(c.code||"-")} · ${esc(c.lessonDuration||"90 daqiqa")} · ${c.durationMonths||1} oy</small></div></div>`);
 return settingsShell("courses",`<div class="settings-page-head"><h1>Kurslar</h1>${btn("Yangisini qo‘shish","course","orange")}</div><div class="course-grid">${rows.join("")||`<div class="empty-panel">Kurslar hali yo‘q</div>`}</div>`);
}
function rooms(){
 const rows=state.rooms.map(r=>`<tr><td>${String(r.id).slice(0,8)}</td><td>${esc(r.name)}</td><td>${r.capacity||0}</td><td><button class="icon-btn" data-edit-room="${r.id}"><span data-icon="edit"></span></button><button class="icon-btn danger" data-delete-room="${r.id}"><span data-icon="trash"></span></button></td></tr>`);
 return settingsShell("rooms",`<div class="settings-page-head"><h1>Xonalar</h1>${btn("Yangisini qo‘shish","room","orange")}</div>`+table(["id","Ism","Xona sig‘imi","Amallar"],rows));
}
function groups(){
 const rows=state.groups.map((g,i)=>`<tr class="click-row" data-group-id="${g.id}"><td>${i+1}. ${esc(g.name)}</td><td>${esc(g.course||"")}</td><td>${esc(g.teacherName||"")}</td><td>${esc(g.days||"")}<br>${esc(g.lessonTime||"")}</td><td>${esc((g.startDate||"").slice(0,10))} — ${esc((g.endDate||"").slice(0,10))}</td><td>${g.courseDurationMonths||0} oy<br>0 hafta</td><td>${esc(g.roomName||g.room||"")}</td><td>${g.studentCount||0}</td><td><button class="icon-btn menu-dots" data-group-id="${g.id}">⋮</button></td></tr>`);
 return pageHead("Guruhlar",state.groups.length,btn("Yangisini qo‘shish","group","orange"))+filters(["select:Faol guruhlar","select:O‘qituvchi","select:Kurslar bo‘yicha","select:Kunlar","Teglar","Boshlanish sanasi","Tugash sanasi"])+table(["Guruh","Kurslar","O‘qituvchi","Kunlar","Mashg‘ulotlar sanalari","O‘tilgan muddat","Xonalar","Talabalar","Amallar"],rows);
}
function finance(){
 const f=state.finance;
 const rows=(f.payments||[]).map(p=>`<tr><td>${esc((p.paidAt||"").slice(0,16).replace("T"," "))}</td><td>${esc(p.studentName||"-")}</td><td>${money(p.amount)}</td><td>${esc(p.paymentType||"-")}</td><td>${esc(p.groupName||"-")}</td><td>${esc(p.note||"")}</td></tr>`);
 return pageHead("Barcha to‘lovlar")+`<div class="metric-row"><div class="metric-card"><div><h2>To‘lovlar miqdori: ${money(f.income)} UZS</h2><p>01.05.2026 — 31.05.2026</p></div></div><div class="metric-card"><div><h2>Sof foyda miqdori: ${money(f.profit)} UZS</h2><p>01.05.2026 — 31.05.2026</p></div></div></div>`+table(["Sana","Talaba ismi","Sum","To‘lov turi","Guruh","Izoh"],rows);
}
function settingsShell(active,inner){
 const items=[
  ["general-settings","Umumiy sozlamalari"],["login-settings","Sistemaga kirish"],["lead-form-settings","Lid forma"],["payment-methods","To‘lov usullari"],["contacts-settings","Aloqa"],["integrations","Integratsiyalar"],["exams-settings","Imtihonlar"],["receipt-settings","Chek"],["billing-settings","Hisob va to‘lovlar"],["landing-settings","Landing page"],["courses","Kurslar"],["rooms","Xonalar"],["auto-sms","SMS sozlamalari"]
 ];
 return `<div class="settings-shell"><div class="settings-tabs">${items.map(x=>`<button class="${active===x[0]?"active":""}" data-sub-page="${x[0]}">${x[1]}</button>`).join("")}</div><div class="settings-content">${inner}</div></div>`;
}
function generalSettings(){const x=state.settings||{};return settingsShell("general-settings",`<h1>Umumiy sozlamalari</h1><form id="generalSettingsForm"><div class="form-grid two module"><label>O‘quv markazingiz nomi<input id="gs_name" value="${esc(x.name||state.me?.center?.name||"")}"></label><label>Telefon<input id="gs_phone" value="${esc(x.phone||"")}"></label><label>Ish boshlanish vaqti<input id="gs_start" type="time" value="${esc(x.workStart||"09:00")}"></label><label>Ish tugash vaqti<input id="gs_end" type="time" value="${esc(x.workEnd||"18:00")}"></label></div><br><button class="btn" type="submit">Saqlash</button></form>`)}
function simpleSettings(key,title){return settingsShell(key,`<h1>${title}</h1><div class="module">Bu bo‘lim keyingi bosqichda real sozlamalar bilan ulanadi.</div>`)}
function groupDetail(){
 const g=state.selectedGroup;
 if(!g) return `<div class="module">Guruh topilmadi</div>`;
 const students=state.selectedGroupStudents||[];
 const rows=students.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.name)}</td><td>${esc(s.phone||"")}</td><td>${esc((s.joinedAt||"").slice(0,10))}</td><td><button class="icon-btn danger" data-remove-student="${s.id}" data-group-id="${g.id}"><span data-icon="trash"></span></button></td></tr>`);
 return `<div class="group-title"><h1>${esc(g.name)} · ${esc(g.course||"")} · ${esc(g.teacherName||"")}</h1><button class="btn orange" data-open-drawer="attachStudent" data-group-id="${g.id}"><span data-icon="plus"></span> Talabani guruhga qo‘shish</button></div>
 <div class="group-detail-grid">
  <div>
   <div class="module group-info"><p><b>Kurs:</b> ${esc(g.course||"-")}</p><p><b>O‘qituvchi:</b> ${esc(g.teacherName||"-")}</p><p><b>Narx:</b> ${money(g.coursePrice)} UZS</p><p><b>Vaqt:</b> ${esc(g.days||"-")} · ${esc(g.lessonTime||"-")}</p><p><b>Xonalar:</b> ${esc(g.roomName||g.room||"-")}</p><p><b>Xona sig‘imi:</b> ${g.roomCapacity||0}</p><p><b>Mashg‘ulot sanalari:</b><br>${esc((g.startDate||"").slice(0,10))} — ${esc((g.endDate||"").slice(0,10))}</p><small>(id: ${String(g.id).slice(0,8)})</small><div class="circle-actions"><button><span data-icon="edit"></span></button><button class="danger"><span data-icon="trash"></span></button><button><span data-icon="mail"></span></button><button data-open-drawer="attachStudent" data-group-id="${g.id}"><span data-icon="plus"></span></button><button><span data-icon="clock"></span></button></div></div>
   <div class="module group-note">Eslatma <span data-icon="info"></span></div>
  </div>
  <div class="module">
   <div class="detail-tabs"><button class="active">Davomat</button><button>Baholash</button><button>Onlayn Darslar va materiallar</button><button>Chegirmali Narx</button><button>Imtihonlar</button><button>Tarix</button><button>Izohlar</button></div>
   <h2>Davomat</h2>
   ${table(["#","Ism","Telefon","Qo‘shilgan sana","Amal"],rows)}
  </div>
 </div>`;
}
function reminders(){return pageHead("Eslatmalar",state.reminders.length,btn("Qo‘shish","reminder"))+`<div class="two-col equal"><div class="module"><h2>0 Muddat o‘tgan</h2></div><div class="module"><h2>0 Bugun</h2></div></div>`}
function placeholders(title){return pageHead(title)+`<div class="empty-panel">Bu bo‘lim keyingi bosqichda ulanadi</div>`}

function activeMain(page){
 $$(".side-nav button").forEach(b=>{
  const p=b.dataset.page;
  const active=p===page||(page==="courses"||page==="rooms"||page.includes("settings")||page==="auto-sms"?p==="settings":false)||(page==="finance"?p==="finance":false)||(page==="group-detail"?p==="groups":false);
  b.classList.toggle("active",active);
 });
}
async function openGroup(id){
 state.selectedGroupId=id;
 const d=await API.get(`/api/app/groups-v2/${id}`,{group:null,students:[]});
 state.selectedGroup=d.group;
 state.selectedGroupStudents=d.students||[];
 go("group-detail",false);
}
function renderPage(page){
 const map={
  dashboard,teachers,students,groups,finance,reminders,
  "group-detail":groupDetail,
  "courses":courses,"rooms":rooms,
  "settings":generalSettings,"general-settings":generalSettings,
  "login-settings":()=>simpleSettings("login-settings","Sistemaga kirish"),
  "lead-form-settings":()=>simpleSettings("lead-form-settings","Lid forma"),
  "payment-methods":()=>simpleSettings("payment-methods","To‘lov usullari"),
  "contacts-settings":()=>simpleSettings("contacts-settings","Aloqa"),
  "integrations":()=>simpleSettings("integrations","Integratsiyalar"),
  "exams-settings":()=>simpleSettings("exams-settings","Imtihonlar"),
  "receipt-settings":()=>simpleSettings("receipt-settings","Chek"),
  "billing-settings":()=>simpleSettings("billing-settings","Hisob va to‘lovlar"),
  "landing-settings":()=>simpleSettings("landing-settings","Landing page"),
  "auto-sms":()=>simpleSettings("auto-sms","SMS sozlamalari"),
  leads:()=>placeholders("Lidlar"),rating:()=>placeholders("Reyting"),attendance:()=>placeholders("Davomat hisobotlari"),"teacher-attendance":()=>placeholders("Ustozlar davomati"),reports:()=>placeholders("Hisobotlar")
 };
 $("#content").innerHTML=(map[page]||dashboard)();
 renderIcons();
}
function go(page,push=true){
 state.page=page;
 activeMain(page);
 if(push) history.replaceState(null,"",`/app/${page}`);
 renderPage(page);
}

function openDrawer(type,opts={}){
 const id=opts.id||null;
 const data = id ? [...state.teachers,...state.courses,...state.rooms,...state.groups,...state.students].find(x=>x.id===id) : null;
 const titles={student:"Yangi foydalanuvchi qo‘shish",teacher:"Yangi o‘qituvchi qo‘shish",course:"Yangi element qo‘shish",room:"Yangi xona qo‘shish",group:"Yangi guruh qo‘shish",payment:"To‘lov qabul qilish",attachStudent:"Yangi talaba",reminder:"Eslatma yaratish"};
 $("#drawerTitle").textContent=titles[type]||"Qo‘shish";
 let html="";
 if(type==="teacher"){
  html=`<form id="drawerForm" class="form-grid"><label>Telefon<input id="f_phone" value="${esc(data?.phone||"")}"></label><label>Ism<input id="f_name" value="${esc(data?.name||"")}" required></label><label>Tug‘ilgan sana<input id="f_birth" type="date" value="${esc((data?.birthDate||"").slice(0,10))}"></label><label>Jins<select id="f_gender"><option value="">Tanlang</option><option value="male">Erkak</option><option value="female">Ayol</option></select></label><label>Fan<input id="f_subject" value="${esc(data?.subject||"")}"></label><label>Parol<input id="f_password" type="password"></label><button>Saqlash</button></form>`;
 } else if(type==="student"){
  html=`<form id="drawerForm" class="form-grid"><label>Telefon<input id="f_phone"></label><label>Ism<input id="f_name" required></label><label>Tug‘ilgan sana<input id="f_birth" type="date"></label><label>Jins<select id="f_gender"><option value="">Tanlang</option><option value="male">Erkak</option><option value="female">Ayol</option></select></label><label>Guruh<select id="f_group">${option(state.groups,"Guruhni tanlang",x=>x.name)}</select></label><label>Izoh<textarea id="f_note"></textarea></label><button>Saqlash</button></form>`;
 } else if(type==="course"){
  html=`<form id="drawerForm" class="form-grid"><label>Ism<input id="f_name" value="${esc(data?.name||"")}" required></label><label>Kurs kodi<input id="f_code" value="${esc(data?.code||"")}"></label><label>Dars davomiyligi<select id="f_lesson"><option>60 daqiqa</option><option selected>90 daqiqa</option><option>120 daqiqa</option></select></label><label>Kurs davomiyligi (oylarda)<input id="f_duration" type="number" value="${esc(data?.durationMonths||"1")}"></label><label>Narx<input id="f_price" type="number" value="${esc(data?.price||"")}"></label><label>Izoh<textarea id="f_note">${esc(data?.note||"")}</textarea></label><button>Saqlash</button></form>`;
 } else if(type==="room"){
  html=`<form id="drawerForm" class="form-grid"><label>Ism<input id="f_name" value="${esc(data?.name||"")}" required></label><label>Xona sig‘imi<input id="f_capacity" type="number" value="${esc(data?.capacity||"")}"></label><button>Saqlash</button></form>`;
 } else if(type==="group"){
  html=`<form id="drawerForm" class="form-grid"><label>Nomi<input id="f_name" required></label><label>Kurs tanlash<select id="f_course">${option(state.courses,"Kursni tanlang",x=>x.name)}</select></label><label>O‘qituvchini tanlang<select id="f_teacher">${option(state.teachers,"O‘qituvchini tanlang",x=>x.name)}</select></label><label>Kunlar<select id="f_days"><option>Toq kunlar</option><option>Juft kunlar</option><option>Dam olish kuni</option><option>Har kuni</option><option>Boshqa</option></select></label><label>Xonani tanlang<select id="f_room">${option(state.rooms,"Xonani tanlang",x=>x.name)}</select></label><label>Darsning boshlanish vaqti<input id="f_time" type="time"></label><label>Guruh boshlanish sanasi<input id="f_start" type="date" value="${today()}"></label><label>Guruh tugash sanasi<input id="f_end" type="date"></label><button>Saqlash</button></form>`;
 } else if(type==="attachStudent"){
  html=`<form id="drawerForm" class="form-grid"><label>Talabani tanlang<select id="f_student">${option(state.students,"Talabani tanlang",x=>`${x.name} ${x.phone||""}`)}</select></label><label>Sanadan boshlab<input id="f_joined" type="date" value="${today()}"></label><button>Saqlash</button></form>`;
 } else if(type==="payment"){
  html=`<form id="drawerForm" class="form-grid"><label>Talaba<select id="f_student">${option(state.students,"Talabani tanlang",x=>x.name)}</select></label><label>Guruh<select id="f_group">${option(state.groups,"Guruhni tanlang",x=>x.name)}</select></label><label>Summa<input id="f_amount" type="number" required></label><label>To‘lov turi<select id="f_type"><option value="cash">Naqd pul</option><option value="card">Karta</option><option value="click">Click</option><option value="payme">Payme</option></select></label><label>Izoh<textarea id="f_note"></textarea></label><button>Saqlash</button></form>`;
 } else if(type==="reminder"){
  html=`<form id="drawerForm" class="form-grid"><label>Sarlavha<input id="f_title" required></label><label>Izoh<textarea id="f_note"></textarea></label><label>Vaqt<input id="f_due" type="datetime-local"></label><button>Saqlash</button></form>`;
 }
 $("#drawerBody").innerHTML=html;
 $("#drawerBackdrop").hidden=false; $("#drawer").hidden=false;
 const form=$("#drawerForm");
 if(form) form.addEventListener("submit",async e=>{
  e.preventDefault();
  let r={ok:false};
  const groupId=opts.groupId||state.selectedGroupId;
  if(type==="teacher") r=id?await API.put(`/api/app/teachers-v2/${id}`,{name:val("f_name"),phone:val("f_phone"),birthDate:val("f_birth"),gender:val("f_gender"),subject:val("f_subject")}):await API.post("/api/app/teachers-v2",{name:val("f_name"),phone:val("f_phone"),birthDate:val("f_birth"),gender:val("f_gender"),subject:val("f_subject"),password:val("f_password")});
  if(type==="student") r=await API.post("/api/app/students",{name:val("f_name"),phone:val("f_phone"),birthDate:val("f_birth"),gender:val("f_gender"),groupId:val("f_group")||null,note:val("f_note")});
  if(type==="course") r=id?await API.put(`/api/app/courses-v2/${id}`,{name:val("f_name"),code:val("f_code"),lessonDuration:val("f_lesson"),durationMonths:val("f_duration"),price:val("f_price"),note:val("f_note")}):await API.post("/api/app/courses-v2",{name:val("f_name"),code:val("f_code"),lessonDuration:val("f_lesson"),durationMonths:val("f_duration"),price:val("f_price"),note:val("f_note")});
  if(type==="room") r=id?await API.put(`/api/app/rooms/${id}`,{name:val("f_name"),capacity:val("f_capacity")}):await API.post("/api/app/rooms",{name:val("f_name"),capacity:val("f_capacity")});
  if(type==="group"){const room=state.rooms.find(x=>x.id===val("f_room"));r=await API.post("/api/app/groups-v2",{name:val("f_name"),courseId:val("f_course"),teacherId:val("f_teacher"),roomId:val("f_room"),roomName:room?.name||"",days:val("f_days"),lessonTime:val("f_time"),startDate:val("f_start"),endDate:val("f_end")})}
  if(type==="attachStudent") r=await API.post(`/api/app/groups-v2/${groupId}/students`,{studentId:val("f_student"),joinedAt:val("f_joined")});
  if(type==="payment") r=await API.post("/api/app/payments",{studentId:val("f_student"),groupId:val("f_group"),amount:val("f_amount"),paymentType:val("f_type"),note:val("f_note")});
  if(type==="reminder") r=await API.post("/api/app/reminders",{title:val("f_title"),note:val("f_note"),dueAt:val("f_due")});
  if(!r.ok){console.error("SAVE_ERROR", r);toast(r.realError||r.error||r.detail||"Saqlashda xatolik",false);return}
  closeDrawer(); toast("Muvaffaqiyatli yakunlandi!");
  await loadData();
  if(type==="attachStudent"&&groupId) await openGroup(groupId); else go(state.page);
 });
 renderIcons();
}
function closeDrawer(){ $("#drawerBackdrop").hidden=true; $("#drawer").hidden=true; }

function bind(){
 $("#sideNav").addEventListener("click",e=>{const b=e.target.closest("button[data-page]");if(!b)return;let p=b.dataset.page;if(p==="settings")p="general-settings";if(p==="reports")p="reports";go(p)});
 document.body.addEventListener("click",async e=>{
  const sub=e.target.closest("[data-sub-page]"); if(sub){go(sub.dataset.subPage);return}
  const open=e.target.closest("[data-open-drawer]"); if(open){openDrawer(open.dataset.openDrawer,{groupId:open.dataset.groupId,studentId:open.dataset.studentId});return}
  const gr=e.target.closest("[data-group-id]"); if(gr && gr.classList.contains("click-row")){await openGroup(gr.dataset.groupId);return}
  const course=e.target.closest("[data-open-course]"); if(course){openDrawer("course",{id:course.dataset.openCourse});return}
  const er=e.target.closest("[data-edit-room]"); if(er){openDrawer("room",{id:er.dataset.editRoom});return}
  const dr=e.target.closest("[data-delete-room]"); if(dr && confirm("Xonani o‘chirasizmi?")){await API.del(`/api/app/rooms/${dr.dataset.deleteRoom}`);await loadData();go(state.page);return}
  const et=e.target.closest("[data-edit-teacher]"); if(et){openDrawer("teacher",{id:et.dataset.editTeacher});return}
  const dt=e.target.closest("[data-delete-teacher]"); if(dt && confirm("O‘qituvchini o‘chirasizmi?")){await API.del(`/api/app/teachers/${dt.dataset.deleteTeacher}`);await loadData();go("teachers");return}
  const rs=e.target.closest("[data-remove-student]"); if(rs && confirm("Talabani guruhdan chiqarasizmi?")){await API.del(`/api/app/groups-v2/${rs.dataset.groupId}/students/${rs.dataset.removeStudent}`);await loadData();await openGroup(rs.dataset.groupId);return}
 });
 $("#quickAddBtn").addEventListener("click",()=>$("#quickPop").hidden=!$("#quickPop").hidden);
 $("#drawerClose").addEventListener("click",closeDrawer);
 $("#drawerBackdrop").addEventListener("click",closeDrawer);
 $("#langBtn").addEventListener("click",()=>$("#langPop").hidden=!$("#langPop").hidden);
 $("#profileBtn").addEventListener("click",()=>$("#profilePop").hidden=!$("#profilePop").hidden);
 $("#logoutBtn")?.addEventListener("click",()=>{localStorage.removeItem("eduka_center_token");localStorage.removeItem("eduka_tenant");API.token="";location.href="/"});
 const qp=$("#quickPop"); if(qp&&!qp.querySelector('[data-open-drawer="course"]')) qp.insertAdjacentHTML("beforeend",`<button data-open-drawer="course"><span data-icon="presentation"></span> Yangi kurs</button><button data-open-drawer="room"><span data-icon="room"></span> Yangi xona</button><button data-open-drawer="reminder"><span data-icon="bell"></span> Eslatma</button>`);
 document.body.addEventListener("submit",async e=>{const f=e.target.closest("#generalSettingsForm");if(!f)return;e.preventDefault();const r=await API.patch("/api/app/settings/general",{name:val("gs_name"),phone:val("gs_phone"),workStart:val("gs_start"),workEnd:val("gs_end")});if(!r.ok){toast(r.error||"Saqlashda xatolik",false);return}state.settings={...state.settings,name:val("gs_name"),phone:val("gs_phone"),workStart:val("gs_start"),workEnd:val("gs_end")};toast("Sozlamalar saqlandi");});
}
document.addEventListener("DOMContentLoaded",async()=>{
 renderIcons(); bind();
 const phase35ok = await phase35FrontendHardCheck(); if (!phase35ok) return; const allowed = await installTenantLoginGuard();
 if (allowed) {
   await loadData();
   const p=location.pathname.replace("/app/","").replace(/^\/+|\/+$/g,"")||"dashboard";
   go(p==="app"?"dashboard":p,false);
 }
 setTimeout(()=>$("#bootLoader")?.classList.add("hide"),250);
});

/* ===== EDUKA PHASE 3 FRONTEND SAVE DIAGNOSTICS ===== */
async function crmSaveDebug() {
  const d = await API.get("/api/app/save-health", null);
  if (!d || d.ok === false) {
    toast((d && (d.realError || d.error)) || "Database save-health ishlamadi", false);
    console.error("SAVE_HEALTH_ERROR", d);
    return d;
  }
  console.log("SAVE_HEALTH_OK", d);
  return d;
}
async function reloadAndRenderAfterSave(pageOverride) {
  await loadData();
  if (state.page === "group-detail" && state.selectedGroupId) {
    await openGroup(state.selectedGroupId);
  } else {
    go(pageOverride || state.page, false);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(crmSaveDebug, 1200);
});


/* ===== EDUKA PHASE 3.2 TENANT LOGIN FRONTEND ===== */
async function tenantStatus() {
  try {
    const token = localStorage.getItem("eduka_center_token") || "";
    const r = await fetch("/api/tenant/status", { headers: token ? { Authorization:"Bearer " + token } : {} });
    return await r.json();
  } catch(e) {
    return { ok:false, error:e.message };
  }
}
function showTenantLogin(status) {
  let screen = document.getElementById("tenantLoginScreen");
  if (!screen) {
    document.body.insertAdjacentHTML("beforeend", `
<div id="tenantLoginScreen" class="tenant-login-screen" hidden>
  <div class="tenant-login-card">
    <div class="login-logo"><span data-icon="arrow-up-right"></span><b>EDUKA</b></div>
    <span class="login-badge">O‘quv markaz CRM</span>
    <h1>CRM panelga kirish</h1>
    <p id="tenantLoginInfo">Subdomain uchun login qiling.</p>
    <form id="tenantLoginForm">
      <label>Login / Email / Telefon
        <input id="tenantLoginEmail" autocomplete="username" placeholder="Login">
      </label>
      <label>Parol
        <input id="tenantLoginPassword" type="password" autocomplete="current-password" placeholder="Parol">
      </label>
      <button type="submit">CRM panelga kirish</button>
    </form>
    <small id="tenantLoginHint"></small>
  </div>
</div>
`);
    screen = document.getElementById("tenantLoginScreen");
  }
  document.body.classList.add("tenant-locked");
  screen.hidden = false;
  document.getElementById("tenantLoginInfo").textContent = `${status.tenant || "markaz"} subdomaini uchun login qiling.`;
  document.getElementById("tenantLoginHint").textContent = "Telegramga yuborilgan login va parolni kiriting.";
  renderIcons();
}
function hideTenantLogin() {
  const screen = document.getElementById("tenantLoginScreen");
  if (screen) screen.hidden = true;
  document.body.classList.remove("tenant-locked");
}
async function installTenantLoginGuard() {
  const status = await tenantStatus();
  if (status && status.loginRequired) {
    showTenantLogin(status);
    return false;
  }
  hideTenantLogin();
  return true;
}
document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("submit", async (e) => {
    const form = e.target.closest("#tenantLoginForm");
    if (!form) return;
    e.preventDefault();
    const email = document.getElementById("tenantLoginEmail").value.trim();
    const password = document.getElementById("tenantLoginPassword").value.trim();
    const btn = form.querySelector("button");
    btn.disabled = true;
    btn.textContent = "Tekshirilmoqda...";
    try {
      const r = await edukaLoginFetchWithTimeout("/api/tenant/login", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({ email, password })
      });
      const d = await r.json();
      if (!d.ok) {
        toast(d.realError || d.error || "Login xato", false);
        btn.disabled = false;
        btn.textContent = "CRM panelga kirish";
        return;
      }
      localStorage.setItem("eduka_center_token", d.token);
      localStorage.setItem("eduka_tenant", d.tenant);
      API.token = d.token;
      hideTenantLogin();
      toast("Kirish muvaffaqiyatli!");
      btn.disabled = false; btn.textContent = "CRM panelga kirish";
      try { await loadData(); } catch(e) { console.warn(e); }
      go("dashboard", false);
    } catch(err) {
      toast(err.message, false);
      btn.disabled = false;
      btn.textContent = "CRM panelga kirish";
    }
  });
});


/* ===== EDUKA PHASE 3.3 TENANT NOT FOUND UI ===== */
function showTenantNotFound(status) {
  document.body.classList.add("tenant-locked");
  let screen = document.getElementById("tenantNotFoundScreen");
  if (!screen) {
    document.body.insertAdjacentHTML("beforeend", `
      <div id="tenantNotFoundScreen" class="tenant-notfound-screen">
        <div class="tenant-notfound-card">
          <div class="login-logo"><span data-icon="alert-triangle"></span><b>EDUKA</b></div>
          <span class="login-badge error">Subdomain topilmadi</span>
          <h1>O‘quv markaz topilmadi</h1>
          <p>
            Siz kiritgan <b id="tenantMissingName"></b> subdomaini EDUKA CEO panelida ro‘yxatdan o‘tmagan.
            Iltimos, linkni tekshiring yoki qo‘llab-quvvatlash bilan bog‘laning.
          </p>
          <div class="support-actions">
            <a href="tel:+998998939000">+998 99 893 90 00</a>
            <a href="https://t.me/eduka_sales" target="_blank">Telegram support</a>
          </div>
        </div>
      </div>
    `);
    screen = document.getElementById("tenantNotFoundScreen");
  }
  document.getElementById("tenantMissingName").textContent = status?.tenant || location.hostname;
  renderIcons();
}

const __oldInstallTenantLoginGuard = typeof installTenantLoginGuard === "function" ? installTenantLoginGuard : null;
installTenantLoginGuard = async function() {
  const status = await tenantStatus();

  if (!status || status.ok === false) {
    if (status && status.code === "TENANT_NOT_FOUND") {
      showTenantNotFound(status);
      return false;
    }
    toast((status && (status.message || status.error || status.realError)) || "Tenant tekshiruv xatosi", false);
    return false;
  }

  if (status.loginRequired) {
    showTenantLogin(status);
    return false;
  }

  hideTenantLogin();
  return true;
};


/* ===== EDUKA PHASE 3.4 FRONTEND HARD TENANT CHECK ===== */
tenantStatus = async function() {
  try {
    const token = localStorage.getItem("eduka_center_token") || "";
    const r = await fetch("/api/tenant/status?t=" + Date.now(), {
      cache:"no-store",
      headers: token ? { Authorization:"Bearer " + token } : {}
    });
    let d;
    try { d = await r.json(); } catch(e) { d = { ok:false, error:"Tenant status JSON emas", status:r.status }; }
    if (d && d.code === "TENANT_NOT_FOUND") {
      localStorage.removeItem("eduka_center_token");
      localStorage.removeItem("eduka_tenant");
    }
    return d;
  } catch(e) {
    return { ok:false, error:e.message };
  }
};

installTenantLoginGuard = async function() {
  const status = await tenantStatus();

  if (!status || status.ok === false) {
    if (status && status.code === "TENANT_NOT_FOUND") {
      showTenantNotFound(status);
      return false;
    }
    toast((status && (status.message || status.error || status.realError)) || "Tenant tekshiruv xatosi", false);
    return false;
  }

  if (status.loginRequired) {
    showTenantLogin(status);
    return false;
  }

  hideTenantLogin();
  return true;
};


/* ===== EDUKA PHASE 3.5 FRONTEND FAIL-CLOSED GUARD ===== */
(function(){
  const root = "eduka.uz";
  const host = location.hostname.toLowerCase();
  const isRoot = host === root || host === "www."+root || host.includes("localhost") || host.includes("railway.app");
  if (!isRoot) {
    document.documentElement.classList.add("tenant-pending");
  }
})();
async function phase35FrontendHardCheck(){
  const root = "eduka.uz";
  const host = location.hostname.toLowerCase();
  const isRoot = host === root || host === "www."+root || host.includes("localhost") || host.includes("railway.app");
  if (isRoot) {
    document.documentElement.classList.remove("tenant-pending");
    return true;
  }
  const st = await tenantStatus();
  if (!st || st.ok === false || st.code === "TENANT_NOT_FOUND") {
    document.body.innerHTML = `
      <div class="tenant-notfound-screen">
        <div class="tenant-notfound-card">
          <div class="login-logo"><span data-icon="alert-triangle"></span><b>EDUKA</b></div>
          <span class="login-badge error">Subdomain topilmadi</span>
          <h1>O‘quv markaz topilmadi</h1>
          <p>Bu subdomain EDUKA CEO panelida yaratilmagan yoki tasdiqlanmagan. Iltimos, EDUKA admini bilan bog‘laning.</p>
          <div class="support-actions">
            <a href="tel:+998998939000">+998 99 893 90 00</a>
            <a href="https://t.me/eduka_sales" target="_blank">Telegram support</a>
          </div>
        </div>
      </div>`;
    document.documentElement.classList.remove("tenant-pending");
    if (typeof renderIcons === "function") renderIcons();
    return false;
  }
  document.documentElement.classList.remove("tenant-pending");
  return true;
}


/* ===== EDUKA PHASE 3.7 FRONTEND: CEO CENTERS ARE VALID =====
   Tenant status backend endi CEO paneldagi mavjud markazlarni valid deb oladi.
*/


/* ===== EDUKA PHASE 4.0 LOGIN FETCH TIMEOUT FIX ===== */
async function edukaLoginFetchWithTimeout(url, options, ms = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const r = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return r;
  } catch (e) {
    clearTimeout(timer);
    if (e && e.name === "AbortError") {
      throw new Error("Server javob bermadi. Backend deploy yoki /api/tenant/login route tekshiring.");
    }
    throw e;
  }
}
