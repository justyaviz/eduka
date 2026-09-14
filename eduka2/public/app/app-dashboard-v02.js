/* EDUKA CRM v0.2 — real tenant dashboard. Public landing is intentionally untouched. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const safe=(v)=>typeof esc==="function"?esc(v):String(v??"");
  const cash=(v)=>typeof money==="function"?money(v):Number(v||0).toLocaleString("uz-UZ");

  function fmtDateTime(value){
    if(!value) return "—";
    const d=new Date(value);
    if(Number.isNaN(d.getTime())) return safe(value);
    return d.toLocaleString("uz-UZ",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
  }

  function fmtTime(value){
    if(!value) return "—";
    const d=new Date(value);
    if(Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("uz-UZ",{hour:"2-digit",minute:"2-digit"});
  }

  function isSameMonth(value){
    if(!value) return false;
    const d=new Date(value),n=new Date();
    return !Number.isNaN(d.getTime())&&d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth();
  }

  function reminderState(r){
    if(!r?.dueAt) return "planned";
    const due=new Date(r.dueAt),now=new Date();
    if(Number.isNaN(due.getTime())) return "planned";
    const sameDay=due.toDateString()===now.toDateString();
    if(sameDay) return "today";
    return due<now?"overdue":"upcoming";
  }

  function groupRunsToday(g){
    const text=String(g?.days||g?.scheduleText||"").toLowerCase();
    if(!text) return false;
    const day=new Date().getDay();
    if(text.includes("har kuni")) return true;
    if(text.includes("toq")) return [1,3,5].includes(day);
    if(text.includes("juft")) return [2,4,6].includes(day);
    if(text.includes("dam olish")) return [0,6].includes(day);
    const names={0:["yakshanba","sun"],1:["dushanba","mon"],2:["seshanba","tue"],3:["chorshanba","wed"],4:["payshanba","thu"],5:["juma","fri"],6:["shanba","sat"]};
    return names[day].some(x=>text.includes(x));
  }

  function metric(icon,label,value,note,tone="blue"){
    return `<article class="dash-kpi dash-tone-${tone}">
      <div class="dash-kpi-icon"><span data-icon="${icon}"></span></div>
      <div class="dash-kpi-copy"><span>${safe(label)}</span><strong>${value}</strong><small>${safe(note||"")}</small></div>
    </article>`;
  }

  function todaySchedule(){
    const rows=(state.groups||[]).filter(groupRunsToday).sort((a,b)=>String(a.lessonTime||"").localeCompare(String(b.lessonTime||""))).slice(0,6);
    if(!rows.length) return `<div class="dash-empty compact"><span data-icon="calendar"></span><b>Bugun jadval bo‘yicha dars yo‘q</b><p>Barcha guruhlarni ko‘rish uchun Guruhlar bo‘limiga o‘ting.</p><button data-sub-page="groups">Guruhlarni ko‘rish</button></div>`;
    return `<div class="dash-list">${rows.map(g=>`<button class="dash-schedule-row" data-sub-page="groups">
      <span class="dash-time">${safe(g.lessonTime||"—")}</span>
      <span class="dash-row-main"><b>${safe(g.name||"Guruh")}</b><small>${safe(g.course||"Kurs ko‘rsatilmagan")} · ${safe(g.teacherName||"O‘qituvchi biriktirilmagan")}</small></span>
      <span class="dash-room">${safe(g.roomName||g.room||"Xona —")}</span>
    </button>`).join("")}</div>`;
  }

  function remindersPanel(){
    const items=(state.reminders||[]).filter(r=>r.status!=="deleted"&&r.status!=="done").slice().sort((a,b)=>{
      const aa=a.dueAt?new Date(a.dueAt).getTime():Infinity,bb=b.dueAt?new Date(b.dueAt).getTime():Infinity;
      return aa-bb;
    }).slice(0,5);
    if(!items.length) return `<div class="dash-empty compact"><span data-icon="clock"></span><b>Eslatmalar yo‘q</b><p>Yangi eslatma yaratib, muhim ishlarni shu yerda kuzating.</p><button data-open-drawer="reminder">Eslatma qo‘shish</button></div>`;
    return `<div class="dash-list">${items.map(r=>{const st=reminderState(r);return `<div class="dash-reminder-row"><i class="dash-dot ${st}"></i><span><b>${safe(r.title||"Eslatma")}</b><small>${safe(r.note||"")}</small></span><time>${fmtDateTime(r.dueAt)}</time></div>`}).join("")}</div>`;
  }

  function recentPayments(){
    const rows=(state.finance?.payments||[]).slice(0,6);
    if(!rows.length) return `<div class="dash-empty compact"><span data-icon="wallet"></span><b>Hozircha to‘lov yo‘q</b><p>Birinchi to‘lov qabul qilinganda shu yerda chiqadi.</p><button data-open-drawer="payment">To‘lov qabul qilish</button></div>`;
    return `<div class="dash-table-mini">${rows.map(p=>`<div class="dash-payment-row"><span class="dash-payment-icon"><span data-icon="wallet"></span></span><span class="dash-row-main"><b>${safe(p.studentName||"Talaba")}</b><small>${safe(p.groupName||"Guruh ko‘rsatilmagan")} · ${safe(p.paymentType||"to‘lov")}</small></span><strong>${cash(p.amount)} UZS</strong><time>${fmtDateTime(p.paidAt)}</time></div>`).join("")}</div>`;
  }

  function activitySkeleton(){
    return `<div id="dashActivity" class="dash-activity"><div class="dash-skeleton"></div><div class="dash-skeleton"></div><div class="dash-skeleton"></div></div>`;
  }

  function dashboardV02(){
    const s=state.dashboard||{};
    const paymentsThisMonth=(state.finance?.payments||[]).filter(p=>isSameMonth(p.paidAt)).length;
    const todayCount=Number(s.todayAttendance||0);
    const monthIncome=Number(s.monthlyPayments||0);

    return `<div class="dash-v02">
      <section class="dash-welcome">
        <div><span class="dash-eyebrow">BUGUNGI BOSHQARUV</span><h1>${safe(state.me?.center?.name||"O‘quv markaz")} holati</h1><p>Asosiy ko‘rsatkichlar va tezkor ishlar bitta joyda.</p></div>
        <div class="dash-quick-actions">
          <button data-open-drawer="student"><span data-icon="user-plus"></span> Talaba</button>
          <button data-open-drawer="group"><span data-icon="layers"></span> Guruh</button>
          <button data-open-drawer="payment"><span data-icon="wallet"></span> To‘lov</button>
          <button data-open-drawer="reminder"><span data-icon="clock"></span> Eslatma</button>
        </div>
      </section>

      <section class="dash-kpis">
        ${metric("graduation","Faol talabalar",cash(s.students??state.students.length),"Markazdagi faol o‘quvchilar","blue")}
        ${metric("layers","Faol guruhlar",cash(s.groups??state.groups.length),"Joriy guruhlar soni","indigo")}
        ${metric("coin","Joriy oy tushumi",`${cash(monthIncome)} UZS`,"Faqat to‘langan tranzaksiyalar","green")}
        ${metric("user-plus","Faol lidlar",cash(s.leads||0),"Yopilmagan murojaatlar","violet")}
        ${metric("calendar-check","Bugungi davomat",cash(todayCount),"Bugun yozilgan davomatlar","orange")}
        ${metric("wallet","Oydagi to‘lovlar",cash(paymentsThisMonth),"Joriy oy tranzaksiyalari","cyan")}
      </section>

      <section class="dash-grid-two">
        <article class="dash-card"><header><div><span>Jadval</span><h2>Bugungi darslar</h2></div><button data-sub-page="groups">Barchasi</button></header>${todaySchedule()}</article>
        <article class="dash-card"><header><div><span>Vazifalar</span><h2>Yaqin eslatmalar</h2></div><button data-sub-page="reminders">Barchasi</button></header>${remindersPanel()}</article>
      </section>

      <section class="dash-grid-two dash-bottom-grid">
        <article class="dash-card"><header><div><span>Moliya</span><h2>So‘nggi to‘lovlar</h2></div><button data-sub-page="finance">Barchasi</button></header>${recentPayments()}</article>
        <article class="dash-card"><header><div><span>Faollik</span><h2>Oxirgi amallar</h2></div></header>${activitySkeleton()}</article>
      </section>
    </div>`;
  }

  async function hydrateActivity(){
    if((state.page||"")!=="dashboard") return;
    const root=$("#dashActivity");
    if(!root||root.dataset.loaded==="1") return;
    root.dataset.loaded="1";
    const d=await API.get("/api/app/activity",{activity:[]});
    if((state.page||"")!=="dashboard"||!document.body.contains(root)) return;
    const rows=(d?.activity||[]).slice(0,7);
    if(!rows.length){
      root.innerHTML=`<div class="dash-empty compact"><span data-icon="info"></span><b>Faollik tarixi hali yo‘q</b><p>Talaba, guruh yoki to‘lov bilan ishlaganingizda amallar shu yerda paydo bo‘ladi.</p></div>`;
    }else{
      root.innerHTML=rows.map(a=>`<div class="dash-activity-row"><span class="dash-activity-icon"><span data-icon="${a.module==="payments"?"wallet":a.module==="groups"?"layers":a.module==="students"?"graduation":"info"}"></span></span><span><b>${safe(a.action||"Amal bajarildi")}</b><small>${safe(a.module||"Tizim")}</small></span><time>${fmtDateTime(a.created_at||a.createdAt)}</time></div>`).join("");
    }
    if(typeof renderIcons==="function") renderIcons();
  }

  try{ dashboard=dashboardV02; }catch(e){ window.dashboard=dashboardV02; }
  window.dashboard=dashboardV02;

  function refreshIfReady(){
    if(!window.state||!window.state.me||typeof window.go!=="function") return false;
    if((window.state.page||"dashboard")==="dashboard") window.go("dashboard",false);
    return true;
  }

  document.addEventListener("DOMContentLoaded",()=>{
    const content=$("#content");
    if(content) new MutationObserver(()=>{ if(state.page==="dashboard") setTimeout(hydrateActivity,0); }).observe(content,{childList:true,subtree:false});
    let tries=0;
    const timer=setInterval(()=>{tries++;if(refreshIfReady()||tries>50)clearInterval(timer)},100);
    setTimeout(hydrateActivity,300);
  });
})();
