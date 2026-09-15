/* EDUKA CRM v0.9.1 — Edutizim-style dashboard. Tenant CRM only; landing untouched. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const safe=(v)=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const num=(v)=>Number(v||0).toLocaleString('uz-UZ');
  const DAY_NAMES=['Yak','Du','Se','Chor','Pa','Ju','Sha'];
  const DAY_LONG=['Yakshanba','Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
  const ui={
    leads:[],branches:null,loaded:false,loading:false,
    day:Number(new URLSearchParams(location.search).get('day')),
    view:new URLSearchParams(location.search).get('view')||localStorage.getItem('eduka_dash_view_v091')||'grid',
    groupBy:new URLSearchParams(location.search).get('groupBy')||localStorage.getItem('eduka_dash_group_v091')||'room',
    filterOpen:false,statsOpen:false,
    filters:{course:'all',teacher:'all',room:'all'},
  };
  if(!Number.isInteger(ui.day)||ui.day<0||ui.day>6)ui.day=new Date().getDay();

  function activeBranch(){return window.EDUKA_ACTIVE_BRANCH||localStorage.getItem('eduka_active_branch_v083')||'all'}
  function monthStart(){const n=new Date();return new Date(n.getFullYear(),n.getMonth(),1)}
  function validDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?null:d}
  function inCurrentMonth(v){const d=validDate(v);return !!d&&d>=monthStart()}
  function inactiveStatus(v){return ['inactive','archived'].includes(String(v||'').toLowerCase())}
  function branchGroupIds(){
    const branch=activeBranch();
    if(branch==='all'||!ui.branches)return null;
    return new Set((ui.branches.groups||[]).filter(g=>String(g.branchId)===String(branch)).map(g=>String(g.id)));
  }
  function scopedGroups(){
    const ids=branchGroupIds();
    return (state.groups||[]).filter(g=>!ids||ids.has(String(g.id)));
  }

  function computeMetrics(){
    const students=state.students||[],groups=scopedGroups(),leads=ui.leads||[],payments=state.finance?.payments||[];
    const paidThisMonth=payments.filter(p=>inCurrentMonth(p.paidAt)&&String(p.status||'paid').toLowerCase()!=='cancelled');
    const uniquePayers=new Set(paidThisMonth.map(p=>p.studentId||p.studentName).filter(Boolean));
    return {
      orders:leads.length,
      firstLesson:leads.filter(l=>String(l.status||'').toLowerCase()==='trial').length,
      newStudents:students.filter(s=>String(s.status||'active').toLowerCase()==='active'&&inCurrentMonth(s.createdAt)).length,
      activeStudents:students.filter(s=>String(s.status||'active').toLowerCase()==='active').length,
      lostOrders:leads.filter(l=>String(l.status||'').toLowerCase()==='closed').length,
      lostNewStudents:students.filter(s=>inactiveStatus(s.status)&&inCurrentMonth(s.createdAt)).length,
      lostActiveStudents:students.filter(s=>inactiveStatus(s.status)&&!inCurrentMonth(s.createdAt)&&inCurrentMonth(s.updatedAt)).length,
      debtors:students.filter(s=>Number(s.balance||0)<0&&String(s.status||'active').toLowerCase()!=='archived').length,
      groups:groups.filter(g=>String(g.status||'active').toLowerCase()==='active').length,
      firstPayments:uniquePayers.size,
      frozen:students.filter(s=>String(s.status||'').toLowerCase()==='frozen').length,
      archives:students.filter(s=>String(s.status||'').toLowerCase()==='archived').length,
    };
  }

  function metricCard(icon,label,value,tone,nav,title=''){
    return `<button class="edu-dash-metric tone-${tone}" type="button" ${nav?`data-dash-nav="${nav}"`:''} title="${safe(title||label)}">
      <span class="edu-dash-metric-icon"><span data-icon="${icon}"></span></span>
      <span class="edu-dash-metric-copy"><b>${safe(label)}</b><strong>${num(value)}</strong></span>
    </button>`;
  }

  function weekDates(){
    const now=new Date(),d=now.getDay();
    return Array.from({length:7},(_,i)=>{const x=new Date(now);x.setDate(now.getDate()+(i-d));x.setHours(12,0,0,0);return x});
  }
  function syncUrl(){
    const u=new URL(location.href);u.searchParams.set('day',String(ui.day));u.searchParams.set('dayName',DAY_LONG[ui.day]);u.searchParams.set('groupBy',ui.groupBy);u.searchParams.set('view',ui.view);u.searchParams.set('fromHour','08:00');u.searchParams.set('toHour','22:00');history.replaceState(history.state,'',u.pathname+'?'+u.searchParams.toString());
  }
  function normalizedDays(g){return String(g.days||g.daysText||g.scheduleText||'').toLowerCase().replace(/[ʻ’‘']/g,"'")}
  function runsOnDate(g,date){
    const start=g.startDate?new Date(String(g.startDate).slice(0,10)+'T00:00:00'):null,end=g.endDate?new Date(String(g.endDate).slice(0,10)+'T23:59:59'):null;
    if(start&&!Number.isNaN(start.getTime())&&date<start)return false;if(end&&!Number.isNaN(end.getTime())&&date>end)return false;
    const text=normalizedDays(g),day=date.getDay();if(!text)return true;
    if(/har\s*kuni|every\s*day|каждый/.test(text))return true;
    if(/toq|нечет/.test(text))return [1,3,5].includes(day);
    if(/juft|четн/.test(text))return [2,4,6].includes(day);
    const names={0:['yak','yakshanba','sun','вс'],1:['du','dush','dushanba','mon','пон'],2:['se','sesh','seshanba','tue','вт'],3:['chor','chorshanba','wed','ср'],4:['pa','pay','payshanba','thu','чт'],5:['ju','juma','fri','пт'],6:['sha','shanba','sat','сб']};
    return names[day].some(x=>text.includes(x));
  }
  function timeMinutes(v){const m=String(v||'').match(/(\d{1,2}):(\d{2})/);if(!m)return null;return Number(m[1])*60+Number(m[2])}
  function durationMinutes(g){const raw=String(g.lessonDuration||g.courseLessonDuration||'90');const m=raw.match(/\d+/);return Math.max(30,Math.min(240,m?Number(m[0]):90))}
  function filteredSchedule(){
    const date=weekDates()[ui.day];
    return scopedGroups().filter(g=>runsOnDate(g,date)).filter(g=>ui.filters.course==='all'||String(g.courseId)===ui.filters.course).filter(g=>ui.filters.teacher==='all'||String(g.teacherId)===ui.filters.teacher).filter(g=>ui.filters.room==='all'||String(g.roomId)===ui.filters.room).sort((a,b)=>(timeMinutes(a.lessonTime)??9999)-(timeMinutes(b.lessonTime)??9999));
  }
  function unique(items,key,label){const m=new Map();items.forEach(x=>{const id=x[key];if(id&&!m.has(String(id)))m.set(String(id),x[label]||'—')});return [...m].map(([id,name])=>({id,name})).sort((a,b)=>a.name.localeCompare(b.name,'uz'))}

  function filtersHtml(){
    const groups=scopedGroups(),courses=unique(groups,'courseId','courseName'),teachers=unique(groups,'teacherId','teacherName'),rooms=unique(groups,'roomId','roomName');
    const opts=(arr,selected,label)=>`<option value="all">${label}</option>${arr.map(x=>`<option value="${safe(x.id)}" ${String(selected)===String(x.id)?'selected':''}>${safe(x.name)}</option>`).join('')}`;
    return `<div class="edu-dash-filters ${ui.filterOpen?'open':''}">
      <select data-dash-filter="course">${opts(courses,ui.filters.course,'Barcha kurslar')}</select>
      <select data-dash-filter="teacher">${opts(teachers,ui.filters.teacher,'Barcha ustozlar')}</select>
      <select data-dash-filter="room">${opts(rooms,ui.filters.room,'Barcha xonalar')}</select>
      <button type="button" data-dash-clear>Tozalash</button>
    </div>`;
  }

  function statsHtml(){
    if(!ui.statsOpen)return'';const rows=filteredSchedule();
    const teachers=new Set(rows.map(x=>x.teacherId).filter(Boolean)).size,rooms=new Set(rows.map(x=>x.roomId).filter(Boolean)).size;
    return `<div class="edu-dash-stat-strip"><div><span>Darslar</span><b>${rows.length}</b></div><div><span>Ustozlar</span><b>${teachers}</b></div><div><span>Xonalar</span><b>${rooms}</b></div><div><span>Faol guruhlar</span><b>${computeMetrics().groups}</b></div></div>`;
  }

  function dayTabs(){const dates=weekDates();return `<div class="edu-dash-days">${dates.map((d,i)=>`<button type="button" class="${ui.day===i?'active':''}" data-dash-day="${i}"><b>${DAY_NAMES[i]}</b><span>${String(d.getDate()).padStart(2,'0')}</span></button>`).join('')}</div>`}
  function groupLabel(g){return ui.groupBy==='teacher'?(g.teacherName||'Ustoz biriktirilmagan'):(g.roomName||'Xona biriktirilmagan')}
  function scheduleList(){
    const rows=filteredSchedule();if(!rows.length)return `<div class="edu-dash-empty"><span data-icon="calendar"></span><b>Bu kunda dars topilmadi</b><p>Filtr yoki guruh jadvalini tekshiring.</p></div>`;
    return `<div class="edu-dash-list">${rows.map(g=>`<button type="button" class="edu-dash-list-row" data-dash-nav="groups"><time>${safe(g.lessonTime||'—')}</time><span><b>${safe(g.name||'Guruh')}</b><small>${safe(g.courseName||g.course||'Kurs')} · ${safe(g.teacherName||'Ustoz yo‘q')}</small></span><em>${safe(g.roomName||'Xona yo‘q')}</em></button>`).join('')}</div>`;
  }
  function scheduleGrid(){
    const rows=filteredSchedule();if(!rows.length)return `<div class="edu-dash-empty"><span data-icon="calendar"></span><b>Bu kunda dars topilmadi</b><p>Filtr yoki guruh jadvalini tekshiring.</p></div>`;
    const labels=[...new Set(rows.map(groupLabel))];if(!labels.length)labels.push('Jadval');
    const slots=[];for(let m=8*60;m<22*60;m+=30)slots.push(m);
    const colCount=labels.length;
    const header=`<div class="edu-grid-corner"></div>${labels.map(x=>`<div class="edu-grid-col-head">${safe(x)}</div>`).join('')}`;
    const backgrounds=slots.map((m,i)=>`<div class="edu-grid-time" style="grid-row:${i+2}">${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}</div>${labels.map((_,j)=>`<div class="edu-grid-cell" style="grid-row:${i+2};grid-column:${j+2}"></div>`).join('')}`).join('');
    const events=rows.map((g,idx)=>{const start=timeMinutes(g.lessonTime);if(start==null||start<480||start>=1320)return'';const row=Math.floor((start-480)/30)+2,span=Math.max(1,Math.ceil(durationMinutes(g)/30)),col=Math.max(0,labels.indexOf(groupLabel(g)))+2;return `<button type="button" class="edu-grid-event event-${idx%6}" style="grid-row:${row}/span ${span};grid-column:${col}" data-dash-nav="groups"><b>${safe(g.name||'Guruh')}</b><span>${safe(g.lessonTime||'')} · ${safe(g.courseName||g.course||'')}</span><small>${safe(g.teacherName||'Ustoz yo‘q')}</small></button>`}).join('');
    return `<div class="edu-dash-grid-scroll"><div class="edu-dash-grid" style="--edu-cols:${colCount}">${header}${backgrounds}${events}</div></div>`;
  }

  function scheduleCard(){
    return `<section class="edu-dash-schedule" id="eduDashSchedule"><div class="edu-dash-schedule-head"><div><h2>Dars jadvali</h2><span>08:00 — 22:00 · 30 daqiqalik qator</span></div><div class="edu-dash-tools"><button type="button" class="${ui.statsOpen?'active':''}" data-dash-stats><span data-icon="chart"></span> Statistika</button><button type="button" class="${ui.filterOpen?'active':''}" data-dash-filter-toggle><span data-icon="search"></span> Filtr</button><button type="button" data-dash-export><span data-icon="download"></span> Export</button></div></div>${statsHtml()}${filtersHtml()}<div class="edu-dash-schedule-controls">${dayTabs()}<div class="edu-dash-view-controls"><select data-dash-groupby><option value="room" ${ui.groupBy==='room'?'selected':''}>Xona bo‘yicha</option><option value="teacher" ${ui.groupBy==='teacher'?'selected':''}>Ustoz bo‘yicha</option></select><button type="button" class="${ui.view==='grid'?'active':''}" data-dash-view="grid" title="Grid"><span data-icon="calendar"></span></button><button type="button" class="${ui.view==='list'?'active':''}" data-dash-view="list" title="List"><span data-icon="list"></span></button><button type="button" data-dash-fullscreen title="Katta ko‘rish"><span data-icon="maximize"></span></button></div></div><div class="edu-dash-schedule-body">${ui.view==='grid'?scheduleGrid():scheduleList()}</div></section>`;
  }

  function dashboardMarkup(){
    const m=computeMetrics();
    return `<div class="edu-dashboard-v091">
      <div class="edu-dash-kpis">
        ${metricCard('user-plus','Buyurtmalar',m.orders,'blue','leads','Barcha lid/buyurtmalar')}
        ${metricCard('presentation','Birinchi darsga keladiganlar',m.firstLesson,'violet','leads','Sinov darsi bosqichidagi lidlar')}
        ${metricCard('user-check','Yangi o‘quvchilar',m.newStudents,'green','students','Joriy oyda qo‘shilgan faol o‘quvchilar')}
        ${metricCard('graduation','Aktiv o‘quvchilar',m.activeStudents,'cyan','students')}
        ${metricCard('user-x','Buyurtmadan ketganlar',m.lostOrders,'red','leads','Yopilgan lidlar')}
        ${metricCard('user-x','Yangi o‘quvchidan ketganlar',m.lostNewStudents,'orange','students','Joriy oyda qo‘shilib inactive/arxiv holatiga o‘tganlar')}
        ${metricCard('alert','Aktiv o‘quvchidan ketganlar',m.lostActiveStudents,'pink','students','Avvalgi faol o‘quvchilardan joriy oyda inactive/arxiv holatiga o‘tganlar')}
        ${metricCard('wallet','Qarzdorlar',m.debtors,'amber','students','Balansi manfiy o‘quvchilar')}
        ${metricCard('layers','Guruhlar',m.groups,'indigo','groups','Tanlangan filialdagi faol guruhlar')}
        ${metricCard('handshake','Birinchi to‘lovni qilganlar',m.firstPayments,'emerald','finance','Joriy oyda to‘lov qilgan unikal o‘quvchilar')}
        ${metricCard('clock','Muzlatilgan',m.frozen,'slate','students')}
        ${metricCard('list','Arxivlar',m.archives,'gray','students')}
      </div>
      ${scheduleCard()}
    </div>`;
  }

  function renderLoaded(){const root=$('#eduDashV091Root');if(!root||state.page!=='dashboard')return;root.innerHTML=dashboardMarkup();if(typeof renderIcons==='function')renderIcons();syncUrl()}
  async function hydrate(){
    if(ui.loading)return;ui.loading=true;
    const [leads,branches]=await Promise.all([API.get('/api/app/leads-v2',{leads:[]}),API.get('/api/app/branches-v083',{ok:false})]);
    ui.leads=leads?.leads||[];ui.branches=branches?.ok?branches:null;ui.loaded=true;ui.loading=false;renderLoaded();
  }
  function dashboardV091(){setTimeout(()=>{if(ui.loaded)renderLoaded();else hydrate()},0);return `<div id="eduDashV091Root" class="edu-dashboard-v091"><div class="edu-dash-loading"><i></i><span>Dashboard yuklanmoqda...</span></div></div>`}

  function rerender(){if(state.page==='dashboard')renderLoaded()}
  function exportCsv(){
    const rows=filteredSchedule(),date=weekDates()[ui.day].toISOString().slice(0,10),head=['Sana','Vaqt','Guruh','Kurs','Ustoz','Xona'];
    const csv=[head,...rows.map(g=>[date,g.lessonTime||'',g.name||'',g.courseName||g.course||'',g.teacherName||'',g.roomName||''])].map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`eduka-jadval-${date}.csv`;document.body.appendChild(a);a.click();URL.revokeObjectURL(a.href);a.remove();
  }

  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-dash-nav]');if(nav&&state.page==='dashboard'){e.preventDefault();if(typeof go==='function')go(nav.dataset.dashNav);return}
    const day=e.target.closest('[data-dash-day]');if(day){ui.day=Number(day.dataset.dashDay);rerender();return}
    const view=e.target.closest('[data-dash-view]');if(view){ui.view=view.dataset.dashView;localStorage.setItem('eduka_dash_view_v091',ui.view);rerender();return}
    if(e.target.closest('[data-dash-filter-toggle]')){ui.filterOpen=!ui.filterOpen;rerender();return}
    if(e.target.closest('[data-dash-stats]')){ui.statsOpen=!ui.statsOpen;rerender();return}
    if(e.target.closest('[data-dash-clear]')){ui.filters={course:'all',teacher:'all',room:'all'};rerender();return}
    if(e.target.closest('[data-dash-export]')){exportCsv();return}
    if(e.target.closest('[data-dash-fullscreen]')){$('#eduDashSchedule')?.requestFullscreen?.();return}
  });
  document.addEventListener('change',e=>{
    const f=e.target.closest('[data-dash-filter]');if(f){ui.filters[f.dataset.dashFilter]=f.value;rerender();return}
    const g=e.target.closest('[data-dash-groupby]');if(g){ui.groupBy=g.value;localStorage.setItem('eduka_dash_group_v091',ui.groupBy);rerender()}
  });
  document.addEventListener('eduka:branch-change',()=>{if(state.page==='dashboard')hydrate()});

  try{dashboard=dashboardV091}catch(e){window.dashboard=dashboardV091}
  window.dashboard=dashboardV091;
})();
