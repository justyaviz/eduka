/* EDUKA CRM v0.8.3 — Branches 2.0. Tenant CRM only; landing untouched. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const safe=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const ui={data:null,loading:false,section:false,active:localStorage.getItem('eduka_active_branch_v083')||'all'};
  let baseGroups=null,baseTeachers=null;

  function isSettings(){const p=String(window.state?.page||'').toLowerCase();return p==='settings'||p==='general-settings'||location.pathname.toLowerCase().endsWith('/app/settings')||location.pathname.toLowerCase().endsWith('/app/general-settings');}
  function branchName(id){if(id==='all')return'Barcha filiallar';return ui.data?.branches?.find(x=>String(x.id)===String(id))?.name||'Filial';}
  function assignedIds(type,branchId){return new Set((ui.data?.[type]||[]).filter(x=>String(x.branchId)===String(branchId)).map(x=>String(x.id)));}
  function fmtCoord(v){return v==null||v===''?'—':Number(v).toFixed(6)}

  async function load(opts={render:false}){
    if(ui.loading)return ui.data;ui.loading=true;
    const d=await API.get('/api/app/branches-v083',{ok:false});ui.loading=false;
    if(!d?.ok){if(opts.render)toast(d?.error||'Filiallar yuklanmadi',false);return null}
    ui.data=d;
    if(ui.active!=='all'&&!d.branches.some(b=>String(b.id)===String(ui.active))){ui.active='all';localStorage.setItem('eduka_active_branch_v083','all')}
    renderSwitcher();injectSettingsNav();
    if(opts.render||ui.section)renderBranches();
    return d;
  }

  function renderSwitcher(){
    const top=$('.crm-page-context');if(!top||!ui.data)return;
    let wrap=$('#branchSwitcherV083');
    if(!wrap){wrap=document.createElement('div');wrap.id='branchSwitcherV083';wrap.className='branch-switcher-v083';top.appendChild(wrap)}
    wrap.innerHTML=`<span data-icon="room"></span><select aria-label="Filial tanlash"><option value="all">Barcha filiallar</option>${ui.data.branches.map(b=>`<option value="${safe(b.id)}" ${String(ui.active)===String(b.id)?'selected':''}>${safe(b.name)}${b.isMain?' · Asosiy':''}</option>`).join('')}</select><i></i>`;
    wrap.querySelector('select').onchange=e=>setActive(e.target.value);
    if(typeof renderIcons==='function')renderIcons();
  }

  function setActive(id){
    ui.active=id||'all';localStorage.setItem('eduka_active_branch_v083',ui.active);window.EDUKA_ACTIVE_BRANCH=ui.active;
    renderSwitcher();
    document.dispatchEvent(new CustomEvent('eduka:branch-change',{detail:{branchId:ui.active,branch:branchName(ui.active)}}));
    if(window.state?.page==='groups'||window.state?.page==='teachers'){try{renderPage()}catch{}}
    toast(ui.active==='all'?'Barcha filiallar ko‘rsatilmoqda':`${branchName(ui.active)} tanlandi`);
  }

  function installScopedRenderers(){
    try{
      if(!baseGroups&&typeof window.groups==='function')baseGroups=window.groups;
      if(!baseTeachers&&typeof window.teachers==='function')baseTeachers=window.teachers;
      if(baseGroups&&!window.groups.__v083){
        const fn=function(){const all=state.groups;if(ui.active==='all'||!ui.data)return baseGroups();const ids=assignedIds('groups',ui.active);state.groups=(all||[]).filter(g=>ids.has(String(g.id)));try{return baseGroups()}finally{state.groups=all}};fn.__v083=true;window.groups=fn;try{groups=fn}catch{}
      }
      if(baseTeachers&&!window.teachers.__v083){
        const fn=function(){const all=state.groups;if(ui.active==='all'||!ui.data)return baseTeachers();const ids=assignedIds('groups',ui.active);state.groups=(all||[]).filter(g=>ids.has(String(g.id)));try{return baseTeachers()}finally{state.groups=all}};fn.__v083=true;window.teachers=fn;try{teachers=fn}catch{}
      }
    }catch{}
  }

  function injectSettingsNav(){
    if(!isSettings())return;const nav=$('.settings-nav-v08');if(!nav)return;
    const old=nav.querySelector('[data-v08-section="center"]');
    if(old){old.removeAttribute('data-v08-section');old.setAttribute('data-v083-section','branches');old.innerHTML='<span data-icon="room"></span>Filiallar';}
    const btn=nav.querySelector('[data-v083-section="branches"]');if(btn)btn.classList.toggle('active',ui.section);
    if(typeof renderIcons==='function')renderIcons();
  }

  function head(){return `<div class="settings-head-v08"><div><h1>Filiallar</h1><p>Markaz filiallari, manzillari, xodimlari va guruhlarini boshqaring.</p></div><button class="settings-save-v08" type="button" data-v083-add><span data-icon="plus"></span> Filial qo‘shish</button></div>`}
  function empty(){return `<div class="branch-empty-v083"><span data-icon="room"></span><h3>Filial topilmadi</h3><p>Birinchi filialni qo‘shing.</p></div>`}
  function card(b){return `<article class="branch-card-v083 ${b.isMain?'main':''}"><header><div class="branch-avatar-v083"><span data-icon="room"></span></div><div><div class="branch-name-v083"><h3>${safe(b.name)}</h3>${b.isMain?'<em>Asosiy</em>':''}</div><p>${safe(b.address||'Manzil kiritilmagan')}</p></div><div class="branch-actions-v083"><button title="Tahrirlash" data-v083-edit="${b.id}"><span data-icon="edit"></span></button>${b.isMain?'':`<button class="danger" title="O‘chirish" data-v083-delete="${b.id}"><span data-icon="trash"></span></button>`}</div></header><div class="branch-meta-v083"><div><span>Telefon</span><b>${safe(b.phone||'—')}</b></div><div><span>Xodimlar</span><b>${b.staffCount} ta</b></div><div><span>Guruhlar</span><b>${b.groupCount} ta</b></div><div><span>Koordinata</span><b>${fmtCoord(b.latitude)}, ${fmtCoord(b.longitude)}</b></div></div><footer><button data-v083-assign="${b.id}"><span data-icon="users"></span> Xodim va guruhlar</button>${b.latitude!=null&&b.longitude!=null?`<a target="_blank" rel="noreferrer" href="https://www.openstreetmap.org/?mlat=${encodeURIComponent(b.latitude)}&mlon=${encodeURIComponent(b.longitude)}#map=16/${encodeURIComponent(b.latitude)}/${encodeURIComponent(b.longitude)}"><span data-icon="arrow-up-right"></span> Xaritada</a>`:''}${!b.isMain?`<button data-v083-main="${b.id}">Asosiy qilish</button>`:''}</footer></article>`}

  function renderBranches(){
    const pane=$('.settings-pane-v08');if(!pane||!ui.data)return;ui.section=true;injectSettingsNav();
    const branches=ui.data.branches||[],totalStaff=(ui.data.staff||[]).length,totalGroups=(ui.data.groups||[]).length;
    pane.innerHTML=head()+`<div class="branch-kpis-v083"><div><span>Filiallar</span><b>${branches.length}</b></div><div><span>Xodimlar</span><b>${totalStaff}</b></div><div><span>Guruhlar</span><b>${totalGroups}</b></div><div><span>Joriy ko‘rinish</span><b>${safe(branchName(ui.active))}</b></div></div><div class="branch-grid-v083">${branches.length?branches.map(card).join(''):empty()}</div>`;
    if(typeof renderIcons==='function')renderIcons();
  }

  function drawer(title,html){$('#drawerTitle').textContent=title;$('#drawerBody').innerHTML=html;$('#drawerBackdrop').hidden=false;$('#drawer').hidden=false;if(typeof renderIcons==='function')renderIcons()}
  function close(){if(typeof closeDrawer==='function')closeDrawer();else{$('#drawerBackdrop').hidden=true;$('#drawer').hidden=true}}
  function mapSrc(lat,lng){const a=Number(lat),o=Number(lng);if(!Number.isFinite(a)||!Number.isFinite(o))return'';const d=.008;return `https://www.openstreetmap.org/export/embed.html?bbox=${o-d}%2C${a-d}%2C${o+d}%2C${a+d}&layer=mapnik&marker=${a}%2C${o}`}

  function openBranch(id=null){
    const x=id?(ui.data?.branches||[]).find(b=>String(b.id)===String(id)):null;
    drawer(id?'Filialni tahrirlash':'Yangi filial',`<form id="branchFormV083" class="branch-form-v083"><label>Filial nomi<input id="branchNameV083" value="${safe(x?.name||'')}" required placeholder="Masalan: Chilonzor filiali"></label><label>Telefon<input id="branchPhoneV083" value="${safe(x?.phone||'')}" placeholder="+998 ..."></label><label class="wide">Manzil<textarea id="branchAddressV083" rows="3" placeholder="To‘liq manzil">${safe(x?.address||'')}</textarea></label><label>Latitude<input id="branchLatV083" type="number" step="0.0000001" min="-90" max="90" value="${x?.latitude??''}" placeholder="41.311081"></label><label>Longitude<input id="branchLngV083" type="number" step="0.0000001" min="-180" max="180" value="${x?.longitude??''}" placeholder="69.240562"></label><label class="branch-main-check-v083 wide"><input id="branchMainV083" type="checkbox" ${x?.isMain?'checked':''} ${x?.isMain?'disabled':''}><span><b>Asosiy filial</b><small>Yangi foydalanuvchi va guruhlar default shu filialga tushadi.</small></span></label><div class="branch-map-v083 wide"><div id="branchMapEmptyV083" ${x?.latitude!=null&&x?.longitude!=null?'hidden':''}>Koordinata kiritsangiz xaritada pin ko‘rinadi</div><iframe id="branchMapV083" loading="lazy" ${x?.latitude!=null&&x?.longitude!=null?`src="${mapSrc(x.latitude,x.longitude)}"`:'hidden'}></iframe></div><div class="staff-form-actions-v081 wide"><button type="button" data-v083-close>Bekor qilish</button><button type="submit">Saqlash</button></div></form>`);
    const updateMap=()=>{const lat=$('#branchLatV083').value,lng=$('#branchLngV083').value,src=mapSrc(lat,lng),frame=$('#branchMapV083'),empty=$('#branchMapEmptyV083');if(src){frame.hidden=false;frame.src=src;empty.hidden=true}else{frame.hidden=true;empty.hidden=false}};
    $('#branchLatV083').onchange=updateMap;$('#branchLngV083').onchange=updateMap;
    $('#branchFormV083').onsubmit=async e=>{e.preventDefault();const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent='Saqlanmoqda...';const payload={name:$('#branchNameV083').value.trim(),phone:$('#branchPhoneV083').value.trim(),address:$('#branchAddressV083').value.trim(),latitude:$('#branchLatV083').value===''?null:Number($('#branchLatV083').value),longitude:$('#branchLngV083').value===''?null:Number($('#branchLngV083').value),isMain:$('#branchMainV083').checked};const r=id?await API.patch(`/api/app/branches-v083/${id}`,payload):await API.post('/api/app/branches-v083',payload);if(!r?.ok){btn.disabled=false;btn.textContent='Saqlash';toast(r?.error||'Filial saqlanmadi',false);return}close();toast(id?'Filial yangilandi':'Filial qo‘shildi');await load({render:true})};
  }

  function branchOptions(selected){return (ui.data?.branches||[]).map(b=>`<option value="${b.id}" ${String(b.id)===String(selected)?'selected':''}>${safe(b.name)}${b.isMain?' · Asosiy':''}</option>`).join('')}
  function openAssignments(branchId){
    const branch=ui.data?.branches?.find(b=>String(b.id)===String(branchId));if(!branch)return;
    drawer(`${branch.name} — biriktirish`,`<div class="branch-assign-v083"><div class="branch-assign-note-v083"><span data-icon="info"></span><p>Xodim yoki guruhning filialini shu yerdan almashtiring. O‘zgarish darhol saqlanadi.</p></div><h3>Xodimlar</h3><div class="branch-assign-list-v083">${(ui.data.staff||[]).map(x=>`<div><span><b>${safe(x.fullName)}</b><small>${safe(x.email)} · ${safe(x.role)}</small></span><select data-v083-staff-select="${x.id}">${branchOptions(x.branchId||branchId)}</select></div>`).join('')||'<p>Xodim yo‘q</p>'}</div><h3>Guruhlar</h3><div class="branch-assign-list-v083">${(ui.data.groups||[]).map(g=>`<div><span><b>${safe(g.name)}</b><small>${safe(g.courseName||'Kurs yo‘q')} · ${safe(g.teacherName||'Ustoz yo‘q')}</small></span><select data-v083-group-select="${g.id}">${branchOptions(g.branchId||branchId)}</select></div>`).join('')||'<p>Guruh yo‘q</p>'}</div></div>`);
    document.querySelectorAll('[data-v083-staff-select]').forEach(s=>s.onchange=async()=>{s.disabled=true;const r=await API.patch(`/api/app/branches-v083/staff/${s.dataset.v083StaffSelect}`,{branchId:s.value});s.disabled=false;if(!r?.ok){toast(r?.error||'Saqlanmadi',false);return}toast('Xodim filiali yangilandi');await load()});
    document.querySelectorAll('[data-v083-group-select]').forEach(s=>s.onchange=async()=>{s.disabled=true;const r=await API.patch(`/api/app/branches-v083/groups/${s.dataset.v083GroupSelect}`,{branchId:s.value});s.disabled=false;if(!r?.ok){toast(r?.error||'Saqlanmadi',false);return}toast('Guruh filiali yangilandi');await load()});
  }

  function ask(title,text){return new Promise(resolve=>{const w=document.createElement('div');w.className='v083-confirm-backdrop';w.innerHTML=`<div class="v083-confirm"><h3>${safe(title)}</h3><p>${safe(text)}</p><div><button data-no>Bekor qilish</button><button class="danger" data-yes>Tasdiqlash</button></div></div>`;document.body.appendChild(w);const done=v=>{w.remove();resolve(v)};w.querySelector('[data-no]').onclick=()=>done(false);w.querySelector('[data-yes]').onclick=()=>done(true);w.onclick=e=>{if(e.target===w)done(false)}})}

  document.addEventListener('click',async e=>{
    const nav=e.target.closest('[data-v083-section="branches"]');if(nav){e.preventDefault();e.stopPropagation();ui.section=true;await load({render:true});return}
    const add=e.target.closest('[data-v083-add]');if(add){openBranch();return}
    const edit=e.target.closest('[data-v083-edit]');if(edit){openBranch(edit.dataset.v083Edit);return}
    const assign=e.target.closest('[data-v083-assign]');if(assign){openAssignments(assign.dataset.v083Assign);return}
    const main=e.target.closest('[data-v083-main]');if(main){const r=await API.patch(`/api/app/branches-v083/${main.dataset.v083Main}`,{isMain:true});if(!r?.ok){toast(r?.error||'Asosiy filial o‘zgarmadi',false);return}toast('Asosiy filial yangilandi');await load({render:true});return}
    const del=e.target.closest('[data-v083-delete]');if(del){const b=ui.data?.branches?.find(x=>String(x.id)===String(del.dataset.v083Delete));if(!await ask('Filialni o‘chirish',`${b?.name||'Bu filial'} o‘chirilsinmi?`))return;const r=await API.del(`/api/app/branches-v083/${del.dataset.v083Delete}`);if(!r?.ok){toast(r?.error||'Filial o‘chirilmadi',false);return}toast('Filial o‘chirildi');await load({render:true});return}
    if(e.target.closest('[data-v083-close]'))close();
    if(isSettings()&&!e.target.closest('[data-v083-section="branches"]')&&e.target.closest('[data-v08-section],[data-v081-section],[data-v082-section]'))ui.section=false;
  },true);

  const observer=new MutationObserver(()=>{injectSettingsNav();installScopedRenderers();const pane=$('.settings-pane-v08');if(ui.section&&isSettings()&&ui.data&&pane&&!pane.querySelector('.branch-grid-v083'))renderBranches()});
  observer.observe(document.body,{childList:true,subtree:true});

  setTimeout(async()=>{installScopedRenderers();await load();window.EDUKA_ACTIVE_BRANCH=ui.active;injectSettingsNav()},450);
})();
