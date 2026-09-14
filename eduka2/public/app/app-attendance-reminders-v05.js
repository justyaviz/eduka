/* EDUKA CRM v0.5 — Attendance + Reminders 2.0. Public landing untouched. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const safe=(v)=>typeof esc==="function"?esc(v):String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const ui={groupTab:"students",attDate:localDate(),attRows:new Map(),attPersisted:new Set(),attDirty:new Set(),loadingAttendance:false};

  function localDate(d=new Date()){
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  }
  function shiftDate(value,days){const d=new Date(`${value}T12:00:00`);d.setDate(d.getDate()+days);return localDate(d)}
  function dateOnly(v){return v?String(v).slice(0,10):"—"}
  function dateTime(v){if(!v)return"Vaqt belgilanmagan";const d=new Date(v);return Number.isNaN(d.getTime())?safe(v):d.toLocaleString("uz-UZ",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}
  function initials(v){const p=String(v||"T").trim().split(/\s+/).filter(Boolean);return(p.slice(0,2).map(x=>x[0]).join("")||"T").toUpperCase()}
  function statusLabel(s){return s==="present"?"Keldi":s==="absent"?"Kelmadi":s==="late"?"Kechikdi":"Belgilanmagan"}
  function empty(title,text){return `<div class="academic-empty"><b>${safe(title)}</b><span>${safe(text)}</span></div>`}

  function studentTable(g,students){
    return students.length?`<div class="academic-table-card"><table class="academic-table"><thead><tr><th>#</th><th>Talaba</th><th>Telefon</th><th>Qo‘shilgan sana</th><th>Amal</th></tr></thead><tbody>${students.map((s,i)=>`<tr><td>${i+1}</td><td><b>${safe(s.name)}</b></td><td>${safe(s.phone||"—")}</td><td>${dateOnly(s.joinedAt)}</td><td><button class="student-action danger" data-remove-student="${s.id}" data-group-id="${g.id}" title="Guruhdan chiqarish"><span data-icon="trash"></span></button></td></tr>`).join("")}</tbody></table></div>`:empty("Guruhda talaba yo‘q","Yuqoridagi tugma orqali birinchi talabani qo‘shing.")
  }

  function attendanceShell(g,students){
    return `<div class="v05-attendance" id="attendanceV05" data-group-id="${g.id}">
      <div class="v05-att-head"><div><h2>Davomat</h2><p>${safe(g.name)} guruhi uchun kunlik davomatni belgilang.</p></div><div class="v05-date-controls"><button type="button" data-v05-date-shift="-1">←</button><input id="attendanceDateV05" type="date" value="${ui.attDate}"><button type="button" data-v05-date-shift="1">→</button><button type="button" data-v05-today>Bugun</button></div></div>
      <div class="v05-att-stats" id="attendanceStatsV05"></div>
      <div class="v05-att-card"><div class="v05-att-toolbar"><div class="v05-att-toolbar-left"><button type="button" class="success" data-v05-all-present>Hammasi keldi</button><span id="attendanceSaveInfoV05" class="v05-att-saved"></span></div><div class="v05-att-toolbar-right"><button type="button" class="primary" data-v05-save-attendance>Davomatni saqlash</button></div></div><div id="attendanceBodyV05" class="v05-att-loading">Davomat yuklanmoqda...</div></div>
    </div>`;
  }

  function groupDetailV05(){
    const g=state.selectedGroup;if(!g)return empty("Guruh topilmadi","Guruh ma’lumotini qayta oching.");
    const students=state.selectedGroupStudents||[];
    return `<div class="academic-v04"><div class="group-v04-head"><div class="group-v04-title"><span class="group-v04-icon"><span data-icon="layers"></span></span><div><h1>${safe(g.name)}</h1><p>${safe(g.course||"Kurs ko‘rsatilmagan")} · ${safe(g.teacherName||"Ustoz biriktirilmagan")}</p></div></div><div class="academic-actions"><button title="Tahrirlash" data-v04-edit-group="${g.id}"><span data-icon="edit"></span></button><button class="danger" title="O‘chirish" data-v04-delete-group="${g.id}"><span data-icon="trash"></span></button></div></div>
      <div class="group-v04-layout"><aside class="group-v04-panel"><div class="group-v04-info"><div><span>Kurs</span><b>${safe(g.course||"—")}</b></div><div><span>O‘qituvchi</span><b>${safe(g.teacherName||"—")}</b></div><div><span>Jadval</span><b>${safe(g.days||"—")} · ${safe(g.lessonTime||"—")}</b></div><div><span>Xona</span><b>${safe(g.roomName||g.room||"—")} (${Number(g.roomCapacity||0)} kishi)</b></div><div><span>Narx</span><b>${typeof money==="function"?money(g.coursePrice||g.monthlyPrice):Number(g.coursePrice||g.monthlyPrice||0).toLocaleString("uz-UZ")} UZS</b></div><div><span>Muddat</span><b>${dateOnly(g.startDate)} — ${dateOnly(g.endDate)}</b></div></div></aside>
      <section class="group-v04-panel"><div class="v05-tabs"><button type="button" class="${ui.groupTab==="students"?"active":""}" data-v05-group-tab="students">Talabalar · ${students.length}</button><button type="button" class="${ui.groupTab==="attendance"?"active":""}" data-v05-group-tab="attendance">Davomat</button></div>${ui.groupTab==="students"?`<div class="group-v04-students-head"><div><h2>Talabalar</h2><span style="font-size:11px;color:#94a3b8">${students.length} ta o‘quvchi</span></div><button class="btn orange" data-open-drawer="attachStudent" data-group-id="${g.id}"><span data-icon="plus"></span> Talaba qo‘shish</button></div>${studentTable(g,students)}`:attendanceShell(g,students)}</section></div></div>`;
  }

  function renderAttendanceRows(){
    const body=$("#attendanceBodyV05"),stats=$("#attendanceStatsV05"),info=$("#attendanceSaveInfoV05");
    if(!body||!stats)return;
    const students=state.selectedGroupStudents||[];
    const counts={present:0,absent:0,late:0,unmarked:0};
    students.forEach(s=>{const st=ui.attRows.get(String(s.id));counts[st||"unmarked"]++});
    stats.innerHTML=`<div class="v05-att-stat present"><i></i><div><span>Keldi</span><b>${counts.present}</b></div></div><div class="v05-att-stat absent"><i></i><div><span>Kelmadi</span><b>${counts.absent}</b></div></div><div class="v05-att-stat late"><i></i><div><span>Kechikdi</span><b>${counts.late}</b></div></div><div class="v05-att-stat unmarked"><i></i><div><span>Belgilanmagan</span><b>${counts.unmarked}</b></div></div>`;
    if(info)info.textContent=ui.attDirty.size?`${ui.attDirty.size} ta o‘zgarish saqlanmagan`:ui.attPersisted.size?"Saqlangan davomat":"Davomat hali kiritilmagan";
    if(info)info.classList.toggle("yes",!ui.attDirty.size&&ui.attPersisted.size>0);
    if(!students.length){body.innerHTML=`<div class="v05-att-loading">Guruhda talaba yo‘q.</div>`;return}
    body.innerHTML=`<table class="v05-att-table"><thead><tr><th>#</th><th>Talaba</th><th>Holat</th><th>Saqlanish</th></tr></thead><tbody>${students.map((s,i)=>{const st=ui.attRows.get(String(s.id))||"";const persisted=ui.attPersisted.has(String(s.id))&&!ui.attDirty.has(String(s.id));return `<tr><td>${i+1}</td><td><div class="v05-student-cell"><span class="v05-avatar">${safe(initials(s.name))}</span><span><b>${safe(s.name)}</b><small>${safe(s.phone||"Telefon yo‘q")}</small></span></div></td><td><div class="v05-status-set"><button type="button" class="v05-status-btn present ${st==="present"?"active":""}" data-v05-att-status="present" data-student-id="${s.id}">Keldi</button><button type="button" class="v05-status-btn absent ${st==="absent"?"active":""}" data-v05-att-status="absent" data-student-id="${s.id}">Kelmadi</button><button type="button" class="v05-status-btn late ${st==="late"?"active":""}" data-v05-att-status="late" data-student-id="${s.id}">Kechikdi</button></div></td><td><span class="v05-att-saved ${persisted?"yes":""}">${persisted?"Saqlangan":st?"Saqlanmagan":"—"}</span></td></tr>`}).join("")}</tbody></table>`;
  }

  async function loadAttendance(force=false){
    if(state.page!=="group-detail"||ui.groupTab!=="attendance"||!state.selectedGroup)return;
    const body=$("#attendanceBodyV05");if(!body)return;
    if(ui.loadingAttendance&&!force)return;ui.loadingAttendance=true;body.innerHTML=`<div class="v05-att-loading">Davomat yuklanmoqda...</div>`;
    const d=await API.get(`/api/app/attendance?date=${encodeURIComponent(ui.attDate)}`,{attendance:[]});
    ui.loadingAttendance=false;ui.attRows=new Map();ui.attPersisted=new Set();ui.attDirty=new Set();
    if(d?.ok===false){body.innerHTML=`<div class="v05-att-loading">${safe(d.error||"Davomat yuklanmadi")}</div>`;return}
    const gid=String(state.selectedGroup.id);
    (d.attendance||[]).filter(a=>String(a.group_id??a.groupId)===gid).forEach(a=>{const sid=String(a.student_id??a.studentId);ui.attRows.set(sid,a.status||"present");ui.attPersisted.add(sid)});
    renderAttendanceRows();
  }

  async function saveAttendance(){
    const g=state.selectedGroup;if(!g)return;
    const students=state.selectedGroupStudents||[];
    const targets=students.filter(s=>ui.attRows.has(String(s.id))&&(ui.attDirty.has(String(s.id))||!ui.attPersisted.has(String(s.id))));
    if(!targets.length){if(typeof toast==="function")toast("Saqlanadigan o‘zgarish yo‘q");return}
    const btn=$("[data-v05-save-attendance]");if(btn){btn.disabled=true;btn.textContent="Saqlanmoqda..."}
    const results=await Promise.all(targets.map(s=>API.post("/api/app/attendance",{groupId:g.id,studentId:s.id,lessonDate:ui.attDate,status:ui.attRows.get(String(s.id))})));
    if(btn){btn.disabled=false;btn.textContent="Davomatni saqlash"}
    const failed=results.find(x=>!x||x.ok===false);
    if(failed){if(typeof toast==="function")toast(failed?.error||"Davomatni saqlashda xatolik",false);return}
    if(typeof toast==="function")toast(`${targets.length} ta davomat saqlandi`);
    await loadAttendance(true);
  }

  function dayKey(v){const d=new Date(v);if(Number.isNaN(d.getTime()))return"upcoming";const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),now.getDate()),end=new Date(start);end.setDate(end.getDate()+1);if(d>=start&&d<end)return"today";return d<start?"overdue":"upcoming"}
  function reminderCard(r,type){return `<article class="v05-reminder-card ${type}"><div class="v05-reminder-card-top"><div><h4>${safe(r.title||"Eslatma")}</h4>${r.note?`<p>${safe(r.note)}</p>`:""}</div></div><div class="v05-reminder-time"><span data-icon="clock"></span>${dateTime(r.dueAt||r.remindAt)}</div><div class="v05-reminder-actions">${type==="done"?`<button type="button" data-v05-reminder-reopen="${r.id}">Qayta ochish</button>`:`<button type="button" class="primary" data-v05-reminder-done="${r.id}">Bajarildi</button>`}<button type="button" class="danger" data-v05-reminder-delete="${r.id}">O‘chirish</button></div></article>`}
  function reminderColumn(title,type,items,extra=""){return `<section class="v05-reminder-col ${extra}"><header><h3>${title}</h3><span>${items.length}</span></header><div class="v05-reminder-list">${items.length?items.map(r=>reminderCard(r,type)).join(""):`<div class="v05-reminder-empty">Bu bo‘limda eslatma yo‘q.</div>`}</div></section>`}

  function remindersV05(){
    const all=(state.reminders||[]).filter(r=>String(r.status||"active")!=="cancelled");
    const done=all.filter(r=>String(r.status||"")==="done");
    const active=all.filter(r=>String(r.status||"active")!=="done");
    const overdue=active.filter(r=>dayKey(r.dueAt||r.remindAt)==="overdue");
    const todayRows=active.filter(r=>dayKey(r.dueAt||r.remindAt)==="today");
    const upcoming=active.filter(r=>dayKey(r.dueAt||r.remindAt)==="upcoming");
    return `<div class="v05-reminders"><div class="v05-reminders-head"><div><h1>Eslatmalar</h1><p>Muddati o‘tgan, bugungi va kelgusi vazifalarni bir joyda boshqaring.</p></div><button class="btn orange" data-open-drawer="reminder"><span data-icon="plus"></span> Yangi eslatma</button></div><div class="v05-reminder-summary"><div class="v05-reminder-stat"><span>Muddati o‘tgan</span><strong>${overdue.length}</strong></div><div class="v05-reminder-stat"><span>Bugun</span><strong>${todayRows.length}</strong></div><div class="v05-reminder-stat"><span>Kelgusi</span><strong>${upcoming.length}</strong></div><div class="v05-reminder-stat"><span>Bajarilgan</span><strong>${done.length}</strong></div></div><div class="v05-reminder-columns">${reminderColumn("Muddati o‘tgan","overdue",overdue)}${reminderColumn("Bugun","today",todayRows)}${reminderColumn("Kelgusi","upcoming",upcoming,"upcoming-col")}</div>${done.length?`<section class="v05-done-wrap"><header><h3>Bajarilgan eslatmalar</h3><span style="font-size:10px;color:#94a3b8">${done.length} ta</span></header><div class="v05-done-list">${done.slice(0,20).map(r=>reminderCard(r,"done")).join("")}</div></section>`:""}</div>`;
  }

  function confirmAction(title,text){return new Promise(resolve=>{const wrap=document.createElement("div");wrap.className="v05-confirm-backdrop";wrap.innerHTML=`<div class="v05-confirm"><h3>${safe(title)}</h3><p>${safe(text)}</p><div class="v05-confirm-actions"><button type="button" class="cancel">Bekor qilish</button><button type="button" class="danger">Tasdiqlash</button></div></div>`;document.body.appendChild(wrap);const done=v=>{wrap.remove();resolve(v)};wrap.querySelector(".cancel").onclick=()=>done(false);wrap.querySelector(".danger").onclick=()=>done(true);wrap.addEventListener("click",e=>{if(e.target===wrap)done(false)});});}

  async function refreshReminders(){await loadData();go("reminders",false)}
  async function setReminderStatus(id,status){const r=await API.patch(`/api/app/reminders/${id}`,{status});if(!r?.ok){if(typeof toast==="function")toast(r?.error||"Eslatma yangilanmadi",false);return}if(typeof toast==="function")toast(status==="done"?"Eslatma bajarildi":"Eslatma qayta ochildi");await refreshReminders()}

  try{groupDetail=groupDetailV05;reminders=remindersV05}catch(e){window.groupDetail=groupDetailV05;window.reminders=remindersV05}
  window.groupDetail=groupDetailV05;window.reminders=remindersV05;

  document.body.addEventListener("click",async e=>{
    const tab=e.target.closest("[data-v05-group-tab]");if(tab){ui.groupTab=tab.dataset.v05GroupTab;go("group-detail",false);if(ui.groupTab==="attendance")setTimeout(()=>loadAttendance(true),0);return}
    const shift=e.target.closest("[data-v05-date-shift]");if(shift){ui.attDate=shiftDate(ui.attDate,Number(shift.dataset.v05DateShift||0));const input=$("#attendanceDateV05");if(input)input.value=ui.attDate;await loadAttendance(true);return}
    if(e.target.closest("[data-v05-today]")){ui.attDate=localDate();const input=$("#attendanceDateV05");if(input)input.value=ui.attDate;await loadAttendance(true);return}
    const st=e.target.closest("[data-v05-att-status]");if(st){const sid=String(st.dataset.studentId);ui.attRows.set(sid,st.dataset.v05AttStatus);ui.attDirty.add(sid);renderAttendanceRows();return}
    if(e.target.closest("[data-v05-all-present]")){(state.selectedGroupStudents||[]).forEach(s=>{const sid=String(s.id);ui.attRows.set(sid,"present");ui.attDirty.add(sid)});renderAttendanceRows();return}
    if(e.target.closest("[data-v05-save-attendance]")){await saveAttendance();return}
    const done=e.target.closest("[data-v05-reminder-done]");if(done){await setReminderStatus(done.dataset.v05ReminderDone,"done");return}
    const reopen=e.target.closest("[data-v05-reminder-reopen]");if(reopen){await setReminderStatus(reopen.dataset.v05ReminderReopen,"active");return}
    const del=e.target.closest("[data-v05-reminder-delete]");if(del){if(!await confirmAction("Eslatmani o‘chirish","Bu eslatma ro‘yxatdan olib tashlanadi."))return;const r=await API.del(`/api/app/reminders/${del.dataset.v05ReminderDelete}`);if(!r?.ok){if(typeof toast==="function")toast(r?.error||"Eslatma o‘chirilmadi",false);return}if(typeof toast==="function")toast("Eslatma o‘chirildi");await refreshReminders();return}
  });

  document.body.addEventListener("change",async e=>{if(e.target.id==="attendanceDateV05"){ui.attDate=e.target.value||localDate();await loadAttendance(true)}});

  document.addEventListener("DOMContentLoaded",()=>{
    const content=$("#content");
    if(content)new MutationObserver(()=>{if(state.page==="group-detail"&&ui.groupTab==="attendance")setTimeout(()=>loadAttendance(false),0)}).observe(content,{childList:true,subtree:false});
    let tries=0;const timer=setInterval(()=>{tries++;if(window.state&&typeof window.go==="function"){if(state.page==="group-detail")go("group-detail",false);if(state.page==="reminders")go("reminders",false);clearInterval(timer)}else if(tries>50)clearInterval(timer)},100);
  });
})();
