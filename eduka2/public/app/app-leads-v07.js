/* EDUKA CRM v0.7 — Leads pipeline. Tenant admin only; public landing untouched. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const safe=(v)=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const STAGES=[
    {key:'LEADS',label:'Yangi',tone:'blue'},
    {key:'contacted',label:'Aloqa qilindi',tone:'cyan'},
    {key:'trial',label:'Sinov darsi',tone:'orange'},
    {key:'interested',label:'Qiziqmoqda',tone:'violet'},
    {key:'Mijoz bo‘ldi',label:'Mijoz bo‘ldi',tone:'green'},
    {key:'closed',label:'Rad etdi',tone:'gray'}
  ];
  const SOURCES=['Manual','Instagram','Telegram','Telefon','Website','Tavsiya','Boshqa'];
  const ui={rows:null,loading:false,query:'',source:'all',status:'all',timer:null};

  function stageKey(v){
    const x=String(v||'LEADS').trim();
    if(['LEADS','Yangi','new','New'].includes(x)) return 'LEADS';
    if(['contacted','Aloqa qilindi'].includes(x)) return 'contacted';
    if(['trial','Sinov darsi'].includes(x)) return 'trial';
    if(['interested','Qiziqmoqda'].includes(x)) return 'interested';
    if(x==='Mijoz bo‘ldi') return x;
    if(['closed','Rad etdi','rejected'].includes(x)) return 'closed';
    return 'LEADS';
  }
  function stageInfo(v){const k=stageKey(v);return STAGES.find(x=>x.key===k)||STAGES[0]}
  function fmtDate(v){if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('uz-UZ',{day:'2-digit',month:'short',year:'numeric'})}
  function initials(v){const p=String(v||'L').trim().split(/\s+/).filter(Boolean);return(p.slice(0,2).map(x=>x[0]).join('')||'L').toUpperCase()}
  function phoneHref(v){return String(v||'').replace(/[^+\d]/g,'')}

  async function fetchLeads(){
    ui.loading=true;
    refresh();
    const qs=new URLSearchParams();
    if(ui.query) qs.set('q',ui.query);
    if(ui.source!=='all') qs.set('source',ui.source);
    if(ui.status!=='all') qs.set('status',ui.status);
    const d=await API.get('/api/app/leads-v2'+(qs.toString()?`?${qs}`:''),{ok:false,leads:[]});
    ui.loading=false;
    if(d?.ok===false){ui.rows=[];toast(d.error||'Lidlarni yuklab bo‘lmadi',false)}else ui.rows=d.leads||[];
    refresh();
  }

  function stat(icon,label,value,note){return `<div class="lead-stat"><span class="lead-stat-icon"><span data-icon="${icon}"></span></span><div><span>${safe(label)}</span><strong>${safe(value)}</strong><small>${safe(note||'')}</small></div></div>`}
  function card(l){
    const st=stageInfo(l.status);
    const won=st.key==='Mijoz bo‘ldi';
    return `<article class="lead-card-v07" data-lead-card="${l.id}">
      <div class="lead-card-top"><span class="lead-avatar">${safe(initials(l.name))}</span><div class="lead-card-title"><b>${safe(l.name||'Nomsiz lid')}</b><small>${safe(l.phone||'Telefon kiritilmagan')}</small></div><button type="button" class="lead-icon-btn" title="Tahrirlash" data-v07-edit="${l.id}"><span data-icon="edit"></span></button></div>
      <div class="lead-card-meta"><span class="lead-source">${safe(l.source||'Manual')}</span><time>${fmtDate(l.createdAt)}</time></div>
      ${l.note?`<p class="lead-note">${safe(l.note)}</p>`:''}
      <label class="lead-stage-select"><span>Holat</span><select data-v07-stage="${l.id}">${STAGES.map(s=>`<option value="${safe(s.key)}" ${st.key===s.key?'selected':''}>${safe(s.label)}</option>`).join('')}</select></label>
      <div class="lead-card-actions">
        ${l.phone?`<a href="tel:${safe(phoneHref(l.phone))}" title="Qo‘ng‘iroq"><span data-icon="phone"></span></a>`:''}
        <button type="button" title="Tahrirlash" data-v07-edit="${l.id}"><span data-icon="edit"></span></button>
        ${!won?`<button type="button" class="convert" title="Talabaga aylantirish" data-v07-convert="${l.id}"><span data-icon="graduation"></span></button>`:''}
        <button type="button" class="danger" title="O‘chirish" data-v07-delete="${l.id}"><span data-icon="trash"></span></button>
      </div>
    </article>`;
  }
  function column(stage){
    const rows=(ui.rows||[]).filter(l=>stageKey(l.status)===stage.key);
    return `<section class="lead-column tone-${stage.tone}"><header><div><i></i><b>${safe(stage.label)}</b></div><span>${rows.length}</span></header><div class="lead-column-body">${rows.length?rows.map(card).join(''):`<div class="lead-empty-column">Bu bosqichda lid yo‘q</div>`}</div></section>`;
  }

  function leadsV07(){
    if(ui.rows===null&&!ui.loading) setTimeout(fetchLeads,0);
    const rows=ui.rows||[];
    const active=rows.filter(x=>!['Mijoz bo‘ldi','closed'].includes(stageKey(x.status))).length;
    const won=rows.filter(x=>stageKey(x.status)==='Mijoz bo‘ldi').length;
    const trial=rows.filter(x=>stageKey(x.status)==='trial').length;
    const conversion=rows.length?Math.round((won/rows.length)*100):0;
    const shownStages=ui.status==='all'?STAGES:STAGES.filter(s=>s.key===ui.status);

    return `<div class="leads-v07">
      <div class="lead-head"><div><span class="lead-eyebrow">SOTUV PIPELINE</span><h1>Lidlar CRM</h1><p>Murojaatlarni birinchi aloqadan talabaga aylanguncha boshqaring.</p></div><button class="btn orange" type="button" data-v07-add><span data-icon="plus"></span> Yangi lid</button></div>
      <div class="lead-stats">${stat('user-plus','Faol lidlar',active,'Hali yopilmagan murojaatlar')}${stat('presentation','Sinov darsida',trial,'Sinov bosqichidagi lidlar')}${stat('graduation','Mijoz bo‘ldi',won,'Talabaga aylanganlar')}${stat('chart','Konversiya',`${conversion}%`,'Jami lidlardan mijozga')}</div>
      <div class="lead-toolbar">
        <label class="lead-search"><span data-icon="search"></span><input id="leadSearchV07" value="${safe(ui.query)}" placeholder="Ism, telefon yoki izoh bo‘yicha qidirish" autocomplete="off"></label>
        <select id="leadSourceV07"><option value="all">Barcha manbalar</option>${SOURCES.map(x=>`<option value="${safe(x)}" ${ui.source===x?'selected':''}>${safe(x)}</option>`).join('')}</select>
        <select id="leadStatusV07"><option value="all">Barcha bosqichlar</option>${STAGES.map(x=>`<option value="${safe(x.key)}" ${ui.status===x.key?'selected':''}>${safe(x.label)}</option>`).join('')}</select>
        <button type="button" class="lead-refresh" data-v07-refresh title="Yangilash"><span data-icon="clock"></span></button>
      </div>
      ${ui.loading?`<div class="lead-loading"><i></i><span>Lidlar yuklanmoqda...</span></div>`:`<div class="lead-board">${shownStages.map(column).join('')}</div>`}
    </div>`;
  }

  function refresh(focus=false){
    if((state.page||'')!=='leads') return;
    const content=$('#content'); if(!content)return;
    content.innerHTML=leadsV07();
    renderIcons();
    if(focus){const i=$('#leadSearchV07');if(i){i.focus();const p=i.value.length;i.setSelectionRange(p,p)}}
  }

  function setDrawer(title,html){
    $('#drawerTitle').textContent=title;
    $('#drawerBody').innerHTML=html;
    $('#drawerBackdrop').hidden=false;
    $('#drawer').hidden=false;
    renderIcons();
  }
  function closeDrawerV07(){if(typeof closeDrawer==='function')closeDrawer();else{$('#drawerBackdrop').hidden=true;$('#drawer').hidden=true}}
  function getLead(id){return (ui.rows||[]).find(x=>String(x.id)===String(id))}

  function openLeadForm(id=null){
    const l=id?getLead(id):null;
    const st=stageInfo(l?.status).key;
    setDrawer(id?'Lidni tahrirlash':'Yangi lid',`<form id="leadFormV07" class="lead-form-v07">
      <label>Ism va familiya<input id="leadNameV07" value="${safe(l?.name||'')}" placeholder="Masalan, Ali Valiyev"></label>
      <label>Telefon<input id="leadPhoneV07" value="${safe(l?.phone||'')}" placeholder="+998 90 123 45 67"></label>
      <label>Manba<select id="leadSourceFormV07">${SOURCES.map(x=>`<option value="${safe(x)}" ${(l?.source||'Manual')===x?'selected':''}>${safe(x)}</option>`).join('')}</select></label>
      <label>Bosqich<select id="leadStatusFormV07">${STAGES.map(x=>`<option value="${safe(x.key)}" ${st===x.key?'selected':''}>${safe(x.label)}</option>`).join('')}</select></label>
      <label class="wide">Izoh<textarea id="leadNoteV07" rows="5" placeholder="Mijoz nimaga qiziqdi, qachon bog‘lanish kerak...">${safe(l?.note||'')}</textarea></label>
      <div class="lead-form-actions wide"><button type="button" class="ghost" data-v07-close>Bekor qilish</button><button type="submit" class="primary">${id?'Saqlash':'Lid qo‘shish'}</button></div>
    </form>`);
    $('#leadFormV07').addEventListener('submit',async e=>{
      e.preventDefault();
      const payload={name:$('#leadNameV07').value.trim(),phone:$('#leadPhoneV07').value.trim(),source:$('#leadSourceFormV07').value,status:$('#leadStatusFormV07').value,note:$('#leadNoteV07').value.trim()};
      if(!payload.name&&!payload.phone){toast('Ism yoki telefon kiriting',false);return}
      const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent='Saqlanmoqda...';
      const r=id?await API.patch(`/api/app/leads-v2/${id}`,payload):await API.post('/api/app/leads-v2',payload);
      if(!r?.ok){btn.disabled=false;btn.textContent='Saqlash';toast(r?.error||'Saqlashda xatolik',false);return}
      closeDrawerV07();toast(id?'Lid yangilandi':'Yangi lid qo‘shildi');ui.rows=null;await loadData();await fetchLeads();
    });
  }

  function openConvert(id){
    const l=getLead(id); if(!l)return;
    setDrawer('Lidni talabaga aylantirish',`<form id="leadConvertV07" class="lead-form-v07">
      <div class="lead-convert-person wide"><span class="lead-avatar big">${safe(initials(l.name))}</span><div><b>${safe(l.name||'Nomsiz lid')}</b><small>${safe(l.phone||'Telefon kiritilmagan')}</small></div></div>
      <label>Talaba ismi<input id="convertNameV07" value="${safe(l.name||'')}"></label>
      <label>Telefon<input id="convertPhoneV07" value="${safe(l.phone||'')}"></label>
      <label>Ota-ona telefoni<input id="convertParentV07" placeholder="+998..."></label>
      <label>Tug‘ilgan sana<input id="convertBirthV07" type="date"></label>
      <label>Jins<select id="convertGenderV07"><option value="">Tanlanmagan</option><option value="male">Erkak</option><option value="female">Ayol</option></select></label>
      <label>Guruh<select id="convertGroupV07"><option value="">Hozircha guruhsiz</option>${(state.groups||[]).map(g=>`<option value="${safe(g.id)}">${safe(g.name)}</option>`).join('')}</select></label>
      <label class="wide">Talaba izohi<textarea id="convertNoteV07" rows="4">${safe(l.note||'')}</textarea></label>
      <div class="lead-convert-info wide"><span data-icon="info"></span><p>Lid “Mijoz bo‘ldi” bosqichiga o‘tadi. Shu telefonli talaba mavjud bo‘lsa, yangi dublikat yaratilmaydi.</p></div>
      <div class="lead-form-actions wide"><button type="button" class="ghost" data-v07-close>Bekor qilish</button><button type="submit" class="primary">Talabaga aylantirish</button></div>
    </form>`);
    $('#leadConvertV07').addEventListener('submit',async e=>{
      e.preventDefault();const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent='Aylantirilmoqda...';
      const r=await API.post(`/api/app/leads-v2/${id}/convert`,{name:$('#convertNameV07').value.trim(),phone:$('#convertPhoneV07').value.trim(),parentPhone:$('#convertParentV07').value.trim(),birthDate:$('#convertBirthV07').value||null,gender:$('#convertGenderV07').value,groupId:$('#convertGroupV07').value||null,note:$('#convertNoteV07').value.trim()});
      if(!r?.ok){btn.disabled=false;btn.textContent='Talabaga aylantirish';toast(r?.error||'Aylantirishda xatolik',false);return}
      closeDrawerV07();toast(r.created?'Lid yangi talabaga aylantirildi':'Mavjud talaba bilan bog‘landi');ui.rows=null;await loadData();await fetchLeads();
    });
  }

  function confirmDelete(l){return new Promise(resolve=>{const wrap=document.createElement('div');wrap.className='lead-confirm-backdrop';wrap.innerHTML=`<div class="lead-confirm"><span class="lead-confirm-icon"><span data-icon="trash"></span></span><h3>Lidni o‘chirasizmi?</h3><p><b>${safe(l?.name||'Ushbu lid')}</b> pipeline’dan olib tashlanadi.</p><div><button class="cancel">Bekor qilish</button><button class="danger">O‘chirish</button></div></div>`;document.body.appendChild(wrap);renderIcons();const done=v=>{wrap.remove();resolve(v)};wrap.querySelector('.cancel').onclick=()=>done(false);wrap.querySelector('.danger').onclick=()=>done(true);wrap.onclick=e=>{if(e.target===wrap)done(false)}})}

  window.leads=leadsV07;

  document.addEventListener('DOMContentLoaded',()=>{
    const quick=$('#quickPop');
    if(quick&&!quick.querySelector('[data-v07-add]')) quick.insertAdjacentHTML('afterbegin',`<button data-v07-add><span data-icon="user-plus"></span> Yangi lid</button>`);
    renderIcons();
  });

  document.body.addEventListener('input',e=>{
    if(e.target.id!=='leadSearchV07')return;
    ui.query=e.target.value.trim();clearTimeout(ui.timer);ui.timer=setTimeout(()=>fetchLeads(),280);
  });
  document.body.addEventListener('change',async e=>{
    if(e.target.id==='leadSourceV07'){ui.source=e.target.value;await fetchLeads();return}
    if(e.target.id==='leadStatusV07'){ui.status=e.target.value;await fetchLeads();return}
    const stage=e.target.closest('[data-v07-stage]');
    if(stage){const id=stage.dataset.v07Stage;const r=await API.patch(`/api/app/leads-v2/${id}`,{status:stage.value});if(!r?.ok){toast(r?.error||'Holatni yangilab bo‘lmadi',false);return}ui.rows=null;await loadData();await fetchLeads();toast('Lid bosqichi yangilandi');}
  });
  document.body.addEventListener('click',async e=>{
    const add=e.target.closest('[data-v07-add]');if(add){openLeadForm();return}
    const edit=e.target.closest('[data-v07-edit]');if(edit){openLeadForm(edit.dataset.v07Edit);return}
    const conv=e.target.closest('[data-v07-convert]');if(conv){openConvert(conv.dataset.v07Convert);return}
    const close=e.target.closest('[data-v07-close]');if(close){closeDrawerV07();return}
    const reload=e.target.closest('[data-v07-refresh]');if(reload){await fetchLeads();return}
    const delBtn=e.target.closest('[data-v07-delete]');
    if(delBtn){const l=getLead(delBtn.dataset.v07Delete);if(!await confirmDelete(l))return;const r=await API.del(`/api/app/leads-v2/${delBtn.dataset.v07Delete}`);if(!r?.ok){toast(r?.error||'Lidni o‘chirib bo‘lmadi',false);return}toast('Lid o‘chirildi');ui.rows=null;await loadData();await fetchLeads();}
  });
})();
