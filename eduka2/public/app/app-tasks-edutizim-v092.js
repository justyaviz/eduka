/* EDUKA CRM v0.9.2 — Edutizim-inspired tasks. Tenant CRM only; landing untouched. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const safe=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const ui={tab:'today',q:'',assignee:'all',type:'all',staff:[],staffLoaded:false,loadingStaff:false};
  const DEFAULT_TYPES=['Qo‘ng‘iroq','Uchrashuv','Hujjat','To‘lov','O‘quvchi','Boshqa'];

  function startOfDay(d=new Date()){return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
  function bucket(r){
    if(String(r?.status||'active')==='done')return'done';
    const raw=r?.dueAt||r?.remindAt;if(!raw)return'upcoming';
    const d=new Date(raw);if(Number.isNaN(d.getTime()))return'upcoming';
    const today=startOfDay(),tomorrow=new Date(today);tomorrow.setDate(tomorrow.getDate()+1);
    if(d<today)return'overdue';if(d<tomorrow)return'today';return'upcoming';
  }
  function dateTime(v){
    if(!v)return'Vaqt belgilanmagan';const d=new Date(v);if(Number.isNaN(d.getTime()))return safe(v);
    return d.toLocaleString('uz-UZ',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  function inputDateTime(v){
    if(!v)return'';const d=new Date(v);if(Number.isNaN(d.getTime()))return'';
    const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  function activeRows(){return(state.reminders||[]).filter(r=>String(r.status||'active')!=='cancelled')}
  function counts(){const out={overdue:0,today:0,upcoming:0,done:0};activeRows().forEach(r=>out[bucket(r)]++);return out}
  function staffName(value){
    if(!value)return'Biriktirilmagan';const x=ui.staff.find(s=>String(s.id)===String(value));return x?.fullName||String(value);
  }
  function taskTypes(){return [...new Set([...DEFAULT_TYPES,...activeRows().map(r=>String(r.tag||'').trim()).filter(Boolean)])]}
  function filteredRows(){
    const q=ui.q.trim().toLowerCase();
    return activeRows().filter(r=>bucket(r)===ui.tab).filter(r=>{
      if(ui.assignee!=='all'&&String(r.assignedTo||'')!==ui.assignee)return false;
      if(ui.type!=='all'&&String(r.tag||'')!==ui.type)return false;
      if(q){const hay=[r.title,r.note,r.tag,staffName(r.assignedTo)].join(' ').toLowerCase();if(!hay.includes(q))return false}
      return true;
    }).sort((a,b)=>{
      const aa=a.dueAt||a.remindAt?new Date(a.dueAt||a.remindAt).getTime():Infinity;
      const bb=b.dueAt||b.remindAt?new Date(b.dueAt||b.remindAt).getTime():Infinity;
      return aa-bb;
    });
  }
  function summaryCard(key,label,icon,n){return `<button type="button" class="tasks-summary-card-v092 ${key}" data-v092-tab="${key}"><span class="tasks-summary-icon-v092"><span data-icon="${icon}"></span></span><span><span>${safe(label)}</span><strong>${n}</strong></span></button>`}
  function taskRow(r){
    const kind=bucket(r),isDone=kind==='done';
    return `<div class="task-row-v092" data-task-id="${safe(r.id)}"><div class="task-title-v092"><b>${safe(r.title||'Topshiriq')}</b><p>${safe(r.note||'Izoh kiritilmagan')}</p></div><div class="task-person-v092">${safe(staffName(r.assignedTo))}</div><div><span class="task-type-v092">${safe(r.tag||'Boshqa')}</span></div><div class="task-time-v092 ${kind==='overdue'?'overdue':''}">${dateTime(r.dueAt||r.remindAt)}</div><div class="task-actions-v092"><button type="button" title="Tahrirlash" data-v092-edit="${safe(r.id)}"><span data-icon="edit"></span></button>${isDone?`<button type="button" title="Qayta ochish" data-v092-status="active" data-task-id="${safe(r.id)}"><span data-icon="clock"></span></button>`:`<button type="button" class="done" title="Bajarildi" data-v092-status="done" data-task-id="${safe(r.id)}"><span data-icon="user-check"></span></button>`}<button type="button" class="danger" title="O‘chirish" data-v092-delete="${safe(r.id)}"><span data-icon="trash"></span></button></div></div>`;
  }
  function empty(){return `<div class="tasks-empty-v092"><span data-icon="clock"></span><b>Bu bo‘limda topshiriq yo‘q</b><p>Yangi topshiriq qo‘shing yoki filtrlarni o‘zgartiring.</p></div>`}

  function remindersV092(){
    const c=counts(),rows=filteredRows(),types=taskTypes();
    return `<div class="tasks-v092"><div class="tasks-head-v092"><div class="tasks-head-copy-v092"><h1>Topshiriqlar</h1><p>Jamoa vazifalari, muddatlar va bajarilish holatini bir joyda boshqaring.</p></div><div class="tasks-head-actions-v092"><button type="button" class="tasks-btn-v092" data-v092-toggle-filter><span data-icon="search"></span> Filtr</button><button type="button" class="tasks-btn-v092 primary" data-v092-add><span data-icon="plus"></span> Qo‘shish</button></div></div><div class="tasks-summary-v092">${summaryCard('overdue','O‘tib ketgan','alert',c.overdue)}${summaryCard('today','Bugun','calendar',c.today)}${summaryCard('upcoming','Kelgusi','clock',c.upcoming)}${summaryCard('done','Bajarilgan','user-check',c.done)}</div><div class="tasks-tabs-v092"><button class="tasks-tab-v092 ${ui.tab==='overdue'?'active':''}" data-v092-tab="overdue">O‘tib ketgan <b>${c.overdue}</b></button><button class="tasks-tab-v092 ${ui.tab==='today'?'active':''}" data-v092-tab="today">Bugun <b>${c.today}</b></button><button class="tasks-tab-v092 ${ui.tab==='upcoming'?'active':''}" data-v092-tab="upcoming">Kelgusi <b>${c.upcoming}</b></button><button class="tasks-tab-v092 ${ui.tab==='done'?'active':''}" data-v092-tab="done">Bajarilgan <b>${c.done}</b></button></div><div class="tasks-filter-v092" id="tasksFilterV092"><input id="taskSearchV092" value="${safe(ui.q)}" placeholder="Topshiriq yoki izoh bo‘yicha qidirish"><select id="taskAssigneeV092"><option value="all">Barcha xodimlar</option>${ui.staff.map(s=>`<option value="${safe(s.id)}" ${ui.assignee===String(s.id)?'selected':''}>${safe(s.fullName)}${s.status!=='active'?' · nofaol':''}</option>`).join('')}</select><select id="taskTypeV092"><option value="all">Barcha turlar</option>${types.map(t=>`<option value="${safe(t)}" ${ui.type===t?'selected':''}>${safe(t)}</option>`).join('')}</select><select id="taskStatusFilterV092" disabled><option>${ui.tab==='overdue'?'O‘tib ketgan':ui.tab==='today'?'Bugun':ui.tab==='upcoming'?'Kelgusi':'Bajarilgan'}</option></select></div><div class="tasks-board-v092"><div class="tasks-list-head-v092"><span>Topshiriq</span><span>Xodim</span><span>Turi</span><span>Sana va vaqt</span><span>Amallar</span></div>${rows.length?rows.map(taskRow).join(''):empty()}</div></div>`;
  }

  async function loadStaff(){
    if(ui.staffLoaded||ui.loadingStaff)return;ui.loadingStaff=true;
    const d=await API.get('/api/app/staff-v081',{ok:false,staff:[]});ui.loadingStaff=false;
    if(d?.ok!==false){ui.staff=(d.staff||[]);ui.staffLoaded=true}
  }
  function closeTaskDrawer(){if(typeof closeDrawer==='function')closeDrawer();else{const d=$('#drawer'),b=$('#drawerBackdrop');if(d)d.hidden=true;if(b)b.hidden=true}}
  async function refreshTasks(){
    const d=await API.get('/api/app/reminders',{ok:false,reminders:[]});
    if(d?.ok===false){if(typeof toast==='function')toast(d.error||'Topshiriqlar yuklanmadi',false);return}
    state.reminders=d.reminders||[];if((state.page||'')==='reminders')go('reminders',false);
  }
  function taskById(id){return activeRows().find(r=>String(r.id)===String(id))||null}
  async function openTaskDrawer(task=null){
    await loadStaff();
    const drawer=$('#drawer'),backdrop=$('#drawerBackdrop'),title=$('#drawerTitle'),body=$('#drawerBody');if(!drawer||!backdrop||!title||!body)return;
    title.textContent=task?'Topshiriqni tahrirlash':'Yangi topshiriq';
    const types=taskTypes();const currentType=String(task?.tag||'Boshqa');if(currentType&&!types.includes(currentType))types.push(currentType);
    const currentAssignee=String(task?.assignedTo||'');
    body.innerHTML=`<form id="taskFormV092" class="task-drawer-form-v092"><label class="wide">Topshiriq<input id="taskTitleV092" required maxlength="180" value="${safe(task?.title||'')}" placeholder="Masalan: Mijozga qayta qo‘ng‘iroq qilish"></label><label>Xodim<select id="taskAssigneeFormV092"><option value="">Biriktirilmagan</option>${ui.staff.map(s=>`<option value="${safe(s.id)}" ${currentAssignee===String(s.id)?'selected':''}>${safe(s.fullName)}</option>`).join('')}${currentAssignee&&!ui.staff.some(s=>String(s.id)===currentAssignee)?`<option value="${safe(currentAssignee)}" selected>${safe(currentAssignee)}</option>`:''}</select></label><label>Sana va vaqt<input id="taskDueV092" type="datetime-local" value="${safe(inputDateTime(task?.dueAt||task?.remindAt))}"></label><label>Topshiriq turi<select id="taskTypeFormV092">${types.map(t=>`<option value="${safe(t)}" ${currentType===t?'selected':''}>${safe(t)}</option>`).join('')}</select></label><label>Holat<select id="taskStatusV092"><option value="active" ${String(task?.status||'active')!=='done'?'selected':''}>Faol</option><option value="done" ${String(task?.status||'')==='done'?'selected':''}>Bajarilgan</option></select></label><label class="wide">Izoh<textarea id="taskNoteV092" maxlength="1200" placeholder="Qo‘shimcha ma’lumot...">${safe(task?.note||'')}</textarea></label><div class="task-form-actions-v092"><button type="button" data-v092-close>Bekor qilish</button><button class="primary" type="submit">${task?'Saqlash':'Topshiriq qo‘shish'}</button></div></form>`;
    backdrop.hidden=false;drawer.hidden=false;if(typeof renderIcons==='function')renderIcons();
    $('#taskFormV092').onsubmit=async e=>{
      e.preventDefault();const submit=e.currentTarget.querySelector('button[type="submit"]');submit.disabled=true;submit.textContent='Saqlanmoqda...';
      const payload={title:$('#taskTitleV092').value.trim(),assignedTo:$('#taskAssigneeFormV092').value,remindAt:$('#taskDueV092').value||null,tag:$('#taskTypeFormV092').value,note:$('#taskNoteV092').value.trim(),status:$('#taskStatusV092').value};
      const r=task?await API.patch(`/api/app/reminders/${task.id}`,payload):await API.post('/api/app/reminders',payload);
      if(!r?.ok){submit.disabled=false;submit.textContent=task?'Saqlash':'Topshiriq qo‘shish';if(typeof toast==='function')toast(r?.error||'Topshiriq saqlanmadi',false);return}
      closeTaskDrawer();if(typeof toast==='function')toast(task?'Topshiriq yangilandi':'Topshiriq qo‘shildi');await refreshTasks();
    };
  }
  function askDelete(task){return new Promise(resolve=>{const w=document.createElement('div');w.className='task-confirm-v092';w.innerHTML=`<div class="task-confirm-card-v092"><h3>Topshiriqni o‘chirish</h3><p>${safe(task?.title||'Bu topshiriq')} bekor qilinsinmi? Bu amal topshiriqni ro‘yxatdan olib tashlaydi.</p><div class="task-confirm-actions-v092"><button type="button" data-v092-no>Bekor qilish</button><button type="button" class="danger" data-v092-yes>O‘chirish</button></div></div>`;document.body.appendChild(w);const done=v=>{w.remove();resolve(v)};w.querySelector('[data-v092-no]').onclick=()=>done(false);w.querySelector('[data-v092-yes]').onclick=()=>done(true);w.onclick=e=>{if(e.target===w)done(false)}})}
  async function setStatus(id,status){const r=await API.patch(`/api/app/reminders/${id}`,{status});if(!r?.ok){if(typeof toast==='function')toast(r?.error||'Topshiriq yangilanmadi',false);return}if(typeof toast==='function')toast(status==='done'?'Topshiriq bajarildi':'Topshiriq qayta ochildi');await refreshTasks()}

  try{reminders=remindersV092}catch(e){window.reminders=remindersV092}window.reminders=remindersV092;

  document.addEventListener('click',e=>{
    const legacy=e.target.closest('[data-open-drawer="reminder"]');if(legacy){e.preventDefault();e.stopImmediatePropagation();openTaskDrawer();return}
  },true);

  document.addEventListener('click',async e=>{
    const tab=e.target.closest('[data-v092-tab]');if(tab){ui.tab=tab.dataset.v092Tab;go('reminders',false);return}
    if(e.target.closest('[data-v092-add]')){await openTaskDrawer();return}
    if(e.target.closest('[data-v092-close]')){closeTaskDrawer();return}
    const edit=e.target.closest('[data-v092-edit]');if(edit){await openTaskDrawer(taskById(edit.dataset.v092Edit));return}
    const status=e.target.closest('[data-v092-status]');if(status){await setStatus(status.dataset.taskId,status.dataset.v092Status);return}
    const del=e.target.closest('[data-v092-delete]');if(del){const task=taskById(del.dataset.v092Delete);if(!task||!await askDelete(task))return;const r=await API.del(`/api/app/reminders/${task.id}`);if(!r?.ok){if(typeof toast==='function')toast(r?.error||'Topshiriq o‘chirilmadi',false);return}if(typeof toast==='function')toast('Topshiriq o‘chirildi');await refreshTasks();return}
    if(e.target.closest('[data-v092-toggle-filter]')){const f=$('#tasksFilterV092');if(f)f.hidden=!f.hidden}
  });
  document.addEventListener('input',e=>{if(e.target.id==='taskSearchV092'){ui.q=e.target.value;go('reminders',false)}});
  document.addEventListener('change',e=>{if(e.target.id==='taskAssigneeV092'){ui.assignee=e.target.value;go('reminders',false)}if(e.target.id==='taskTypeV092'){ui.type=e.target.value;go('reminders',false)}});

  document.addEventListener('DOMContentLoaded',()=>{loadStaff().then(()=>{if(window.state?.page==='reminders')go('reminders',false)});});
})();
