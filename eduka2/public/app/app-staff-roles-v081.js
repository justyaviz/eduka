/* EDUKA CRM v0.8.1 — Staff + Roles/Permissions. Tenant admin only. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const safe=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const ui={section:null,data:null,loading:false};

  const PERMISSION_GROUPS=[
    ['Dashboard','home',[['dashboard.view','Ko‘rish']]],
    ['Lidlar','user-plus',[['leads.view','Ko‘rish'],['leads.create','Qo‘shish'],['leads.edit','Tahrirlash'],['leads.delete','O‘chirish'],['leads.convert','Talabaga aylantirish']]],
    ['Talabalar','graduation',[['students.view','Ko‘rish'],['students.create','Qo‘shish'],['students.edit','Tahrirlash'],['students.delete','O‘chirish'],['students.payments','To‘lovlar']]],
    ['Guruhlar','layers',[['groups.view','Ko‘rish'],['groups.manage','Boshqarish']]],
    ['O‘qituvchilar','teacher',[['teachers.view','Ko‘rish'],['teachers.manage','Boshqarish']]],
    ['Davomat','calendar-check',[['attendance.view','Ko‘rish'],['attendance.manage','Belgilash / tahrirlash']]],
    ['Eslatmalar','clock',[['reminders.view','Ko‘rish'],['reminders.manage','Boshqarish']]],
    ['Moliya','coin',[['finance.view','Ko‘rish'],['finance.collect','To‘lov qabul qilish'],['finance.payments','To‘lovlar'],['finance.expenses','Xarajatlar']]],
    ['Sozlamalar','settings',[['settings.view','Ko‘rish'],['settings.manage','Tahrirlash']]],
    ['Xodimlar','users',[['staff.view','Ko‘rish'],['staff.manage','Boshqarish']]],
    ['Rollar','list',[['roles.view','Ko‘rish'],['roles.manage','Boshqarish']]],
    ['Hisobotlar','chart',[['reports.view','Ko‘rish'],['reports.export','Eksport']]]
  ];

  function isSettings(){
    const p=(window.state?.page||'').toLowerCase(),path=location.pathname.toLowerCase();
    return p==='settings'||p==='general-settings'||path.endsWith('/app/settings')||path.endsWith('/app/general-settings');
  }
  function roleLabel(id){const r=ui.data?.roles?.find(x=>String(x.id)===String(id));return r?.name||id||'—'}
  function roleHas(role,perm){
    const list=role?.permissions||[]; if(list.includes('*')||list.includes(perm))return true;
    const mod=perm.split('.')[0]; return list.includes(mod+'.*');
  }
  function fmtDate(v){if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('uz-UZ',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
  function initials(v){return String(v||'X').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'X'}

  async function load(){
    if(ui.loading)return; ui.loading=true;
    const d=await API.get('/api/app/staff-v081',{ok:false}); ui.loading=false;
    if(!d?.ok){toast(d?.error||'Xodimlar yuklanmadi',false);return}
    ui.data=d; renderCurrent();
  }

  function injectNav(){
    if(!isSettings())return;
    const nav=$('.settings-nav-v08'); if(!nav)return;
    if(!nav.querySelector('[data-v081-section="staff"]')){
      nav.insertAdjacentHTML('beforeend',`<div class="settings-nav-divider-v081"><span>BOSHQARUV</span></div>
        <button type="button" data-v081-section="staff"><span data-icon="users"></span>Xodimlar</button>
        <button type="button" data-v081-section="roles"><span data-icon="list"></span>Rollar va ruxsatlar</button>`);
      if(typeof renderIcons==='function')renderIcons();
    }
    nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.v081Section===ui.section));
  }

  function head(title,desc,action=''){return `<div class="settings-head-v08"><div><h1>${safe(title)}</h1><p>${safe(desc)}</p></div>${action}</div>`}

  function renderStaff(){
    const rows=ui.data?.staff||[],active=rows.filter(x=>x.status==='active').length,blocked=rows.filter(x=>x.status!=='active').length;
    const pane=$('.settings-pane-v08'); if(!pane)return;
    pane.innerHTML=head('Xodimlar','Markaz xodimlari, loginlari va rollarini boshqaring.',`<button class="settings-save-v08" type="button" data-v081-add-staff><span data-icon="plus"></span> Xodim qo‘shish</button>`)+
      `<div class="staff-kpis-v081"><div><span>Jami xodimlar</span><b>${rows.length}</b></div><div><span>Faol</span><b>${active}</b></div><div><span>Bloklangan</span><b>${blocked}</b></div><div><span>Rollar</span><b>${(ui.data?.roles||[]).length}</b></div></div>`+
      `<section class="settings-card-v08 staff-table-card-v081"><div class="staff-toolbar-v081"><label><span data-icon="search"></span><input id="staffSearchV081" placeholder="Ism, email yoki rol bo‘yicha qidirish"></label><select id="staffRoleFilterV081"><option value="">Barcha rollar</option>${(ui.data?.roles||[]).map(r=>`<option value="${safe(r.id)}">${safe(r.name)}</option>`).join('')}</select></div><div id="staffRowsV081">${staffRows(rows)}</div></section>`;
    if(typeof renderIcons==='function')renderIcons(); injectNav();
  }

  function staffRows(rows){
    if(!rows.length)return `<div class="staff-empty-v081">Hozircha xodim yo‘q</div>`;
    return `<div class="staff-table-v081"><div class="staff-tr staff-th"><span>Xodim</span><span>Rol</span><span>Holat</span><span>Oxirgi kirish</span><span></span></div>${rows.map(x=>`<div class="staff-tr" data-staff-row="${x.id}" data-staff-name="${safe((x.fullName+' '+x.email+' '+x.role).toLowerCase())}" data-staff-role="${safe(x.role)}"><div class="staff-person-v081"><i>${safe(initials(x.fullName))}</i><div><b>${safe(x.fullName)}</b><small>${safe(x.email)}</small></div></div><span><em class="staff-role-v081">${safe(roleLabel(x.role))}</em></span><span><em class="staff-status-v081 ${x.status==='active'?'active':'blocked'}">${x.status==='active'?'Faol':'Bloklangan'}</em></span><span class="staff-last-v081">${fmtDate(x.lastLoginAt)}</span><span class="staff-actions-v081"><button title="Tahrirlash" data-v081-edit-staff="${x.id}"><span data-icon="edit"></span></button>${String(x.id)===String(ui.data.currentUserId)?'':`<button class="danger" title="O‘chirish" data-v081-delete-staff="${x.id}"><span data-icon="trash"></span></button>`}</span></div>`).join('')}</div>`;
  }

  function renderRoles(){
    const roles=ui.data?.roles||[],staff=ui.data?.staff||[]; const pane=$('.settings-pane-v08');if(!pane)return;
    pane.innerHTML=head('Rollar va ruxsatlar','Har bir rol qaysi modulni ko‘rishi va boshqarishini aniq belgilang.',`<button class="settings-save-v08" type="button" data-v081-add-role><span data-icon="plus"></span> Yangi rol</button>`)+
      `<div class="roles-grid-v081">${roles.map(r=>{const count=staff.filter(s=>String(s.role)===String(r.id)).length;return `<article class="role-card-v081"><header><div><span class="role-icon-v081"><span data-icon="${r.id==='teacher'?'teacher':r.id==='cashier'?'wallet':r.id==='accountant'?'coin':'users'}"></span></span><div><h3>${safe(r.name)}</h3><p>${safe(r.description||'')}</p></div></div><span class="role-badge-v081">${r.system?'Tizim':'Custom'}</span></header><div class="role-card-meta-v081"><span>${count} xodim</span><span>${(r.permissions||[]).includes('*')?'Barcha ruxsatlar':`${(r.permissions||[]).length} ruxsat`}</span></div><div class="role-card-actions-v081"><button data-v081-edit-role="${safe(r.id)}">Ruxsatlarni boshqarish</button>${r.system?'':`<button class="danger" data-v081-delete-role="${safe(r.id)}"><span data-icon="trash"></span></button>`}</div></article>`}).join('')}</div>`;
    if(typeof renderIcons==='function')renderIcons(); injectNav();
  }

  function renderCurrent(){if(ui.section==='staff')renderStaff();else if(ui.section==='roles')renderRoles();}

  function setDrawer(title,html){
    $('#drawerTitle').textContent=title; $('#drawerBody').innerHTML=html; $('#drawerBackdrop').hidden=false; $('#drawer').hidden=false;
    if(typeof renderIcons==='function')renderIcons();
  }
  function close(){if(typeof closeDrawer==='function')closeDrawer();else{$('#drawerBackdrop').hidden=true;$('#drawer').hidden=true}}
  function roleOptions(selected){
    const roles=ui.data?.roles||[]; const has=roles.some(r=>String(r.id)===String(selected));
    return `${!has&&selected?`<option value="${safe(selected)}" selected>${safe(selected)}</option>`:''}${roles.map(r=>`<option value="${safe(r.id)}" ${String(r.id)===String(selected)?'selected':''}>${safe(r.name)}</option>`).join('')}`;
  }

  function openStaff(id=null){
    const x=id?(ui.data?.staff||[]).find(s=>String(s.id)===String(id)):null;
    setDrawer(id?'Xodimni tahrirlash':'Yangi xodim',`<form id="staffFormV081" class="staff-form-v081"><label>Ism va familiya<input id="staffNameV081" value="${safe(x?.fullName||'')}" required></label><label>Email / login<input id="staffEmailV081" type="email" value="${safe(x?.email||'')}" required></label><label>Rol<select id="staffRoleV081">${roleOptions(x?.role||'manager')}</select></label><label>Holat<select id="staffStatusV081"><option value="active" ${x?.status!=='blocked'?'selected':''}>Faol</option><option value="blocked" ${x?.status==='blocked'?'selected':''}>Bloklangan</option></select></label><label class="wide">${id?'Yangi parol (ixtiyoriy)':'Parol'}<input id="staffPasswordV081" type="password" ${id?'':'required'} minlength="6" placeholder="Kamida 6 belgi"></label><div class="staff-form-note-v081 wide"><span data-icon="info"></span><p>Rol o‘zgarsa, xodim keyingi loginida yangi ruxsatlar bilan ishlaydi.</p></div><div class="staff-form-actions-v081 wide"><button type="button" data-v081-close>Bekor qilish</button><button type="submit">Saqlash</button></div></form>`);
    $('#staffFormV081').onsubmit=async e=>{
      e.preventDefault();const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent='Saqlanmoqda...';
      const payload={fullName:$('#staffNameV081').value.trim(),email:$('#staffEmailV081').value.trim(),role:$('#staffRoleV081').value,status:$('#staffStatusV081').value,password:$('#staffPasswordV081').value};
      const r=id?await API.patch(`/api/app/staff-v081/${id}`,payload):await API.post('/api/app/staff-v081',payload);
      if(!r?.ok){btn.disabled=false;btn.textContent='Saqlash';toast(r?.error||'Saqlashda xatolik',false);return}
      close();toast(id?'Xodim yangilandi':'Xodim qo‘shildi');await load();
    };
  }

  function permissionMatrix(role){
    const owner=role?.id==='owner';
    return `<div class="permission-matrix-v081">${PERMISSION_GROUPS.map(([name,icon,items])=>`<section><header><span data-icon="${icon}"></span><div><b>${safe(name)}</b><small>${items.length} amal</small></div><label><input type="checkbox" data-v081-module="${safe(items[0][0].split('.')[0])}" ${items.every(i=>roleHas(role,i[0]))?'checked':''} ${owner?'disabled':''}> Barchasi</label></header><div>${items.map(([perm,label])=>`<label><input type="checkbox" name="permV081" value="${safe(perm)}" ${roleHas(role,perm)?'checked':''} ${owner?'disabled':''}><span>${safe(label)}</span></label>`).join('')}</div></section>`).join('')}</div>`;
  }

  function openRole(id=null){
    const role=id?(ui.data?.roles||[]).find(r=>String(r.id)===String(id)):null,owner=role?.id==='owner';
    setDrawer(id?'Rol va ruxsatlar':'Yangi rol',`<form id="roleFormV081" class="role-form-v081"><div class="role-fields-v081"><label>Rol nomi<input id="roleNameV081" value="${safe(role?.name||'')}" required ${owner?'disabled':''}></label><label>Tavsif<input id="roleDescV081" value="${safe(role?.description||'')}" ${owner?'disabled':''}></label></div>${owner?`<div class="role-owner-note-v081"><span data-icon="info"></span><p>Owner rolida barcha ruxsatlar doim yoqilgan va o‘zgartirilmaydi.</p></div>`:permissionMatrix(role||{permissions:[]})}<div class="staff-form-actions-v081"><button type="button" data-v081-close>Bekor qilish</button>${owner?'':`<button type="submit">${id?'Saqlash':'Rol yaratish'}</button>`}</div></form>`);
    if(!owner){
      document.querySelectorAll('[data-v081-module]').forEach(master=>master.onchange=()=>{const mod=master.dataset.v081Module;document.querySelectorAll('input[name="permV081"]').forEach(c=>{if(c.value.startsWith(mod+'.'))c.checked=master.checked})});
      document.querySelectorAll('input[name="permV081"]').forEach(c=>c.onchange=()=>{const mod=c.value.split('.')[0],items=[...document.querySelectorAll('input[name="permV081"]')].filter(x=>x.value.startsWith(mod+'.')),m=document.querySelector(`[data-v081-module="${mod}"]`);if(m)m.checked=items.every(x=>x.checked)});
      $('#roleFormV081').onsubmit=async e=>{
        e.preventDefault();const permissions=[...document.querySelectorAll('input[name="permV081"]:checked')].map(x=>x.value);const payload={name:$('#roleNameV081').value.trim(),description:$('#roleDescV081').value.trim(),permissions};const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent='Saqlanmoqda...';
        const r=id?await API.patch(`/api/app/roles-v081/${encodeURIComponent(id)}`,payload):await API.post('/api/app/roles-v081',payload);
        if(!r?.ok){btn.disabled=false;btn.textContent='Saqlash';toast(r?.error||'Rol saqlanmadi',false);return}
        close();toast(id?'Rol yangilandi':'Yangi rol yaratildi');await load();
      };
    }
  }

  function confirmBox(title,text){return new Promise(resolve=>{const b=document.createElement('div');b.className='staff-confirm-backdrop-v081';b.innerHTML=`<div class="staff-confirm-v081"><span><span data-icon="trash"></span></span><h3>${safe(title)}</h3><p>${safe(text)}</p><div><button data-no>Bekor qilish</button><button class="danger" data-yes>O‘chirish</button></div></div>`;document.body.appendChild(b);if(typeof renderIcons==='function')renderIcons();const done=v=>{b.remove();resolve(v)};b.querySelector('[data-no]').onclick=()=>done(false);b.querySelector('[data-yes]').onclick=()=>done(true);b.onclick=e=>{if(e.target===b)done(false)}})}

  function filterStaff(){const q=($('#staffSearchV081')?.value||'').toLowerCase(),role=$('#staffRoleFilterV081')?.value||'';document.querySelectorAll('[data-staff-row]').forEach(r=>{const okQ=!q||r.dataset.staffName.includes(q),okR=!role||r.dataset.staffRole===role;r.hidden=!(okQ&&okR)})}

  document.addEventListener('click',async e=>{
    const sec=e.target.closest('[data-v081-section]');if(sec){ui.section=sec.dataset.v081Section;injectNav();if(!ui.data)await load();else renderCurrent();return}
    if(e.target.closest('[data-v081-add-staff]')){openStaff();return}
    const edit=e.target.closest('[data-v081-edit-staff]');if(edit){openStaff(edit.dataset.v081EditStaff);return}
    const del=e.target.closest('[data-v081-delete-staff]');if(del){const x=(ui.data?.staff||[]).find(s=>String(s.id)===String(del.dataset.v081DeleteStaff));if(await confirmBox('Xodimni o‘chirasizmi?',`${x?.fullName||'Xodim'} CRM kirishidan chiqariladi.`)){const r=await API.del(`/api/app/staff-v081/${del.dataset.v081DeleteStaff}`);if(!r?.ok)toast(r?.error||'O‘chirilmadi',false);else{toast('Xodim o‘chirildi');await load()}}return}
    if(e.target.closest('[data-v081-add-role]')){openRole();return}
    const er=e.target.closest('[data-v081-edit-role]');if(er){openRole(er.dataset.v081EditRole);return}
    const dr=e.target.closest('[data-v081-delete-role]');if(dr){const r0=(ui.data?.roles||[]).find(r=>String(r.id)===String(dr.dataset.v081DeleteRole));if(await confirmBox('Rolni o‘chirasizmi?',`${r0?.name||'Rol'} butunlay olib tashlanadi.`)){const r=await API.del(`/api/app/roles-v081/${encodeURIComponent(dr.dataset.v081DeleteRole)}`);if(!r?.ok)toast(r?.error||'Rol o‘chirilmadi',false);else{toast('Rol o‘chirildi');await load()}}return}
    if(e.target.closest('[data-v081-close]')){close();return}
    if(e.target.closest('[data-v08-section]')){ui.section=null;setTimeout(injectNav,0)}
  });
  document.addEventListener('input',e=>{if(e.target.id==='staffSearchV081')filterStaff()});
  document.addEventListener('change',e=>{if(e.target.id==='staffRoleFilterV081')filterStaff()});

  const observer=new MutationObserver(()=>{if(isSettings())injectNav()});
  document.addEventListener('DOMContentLoaded',()=>{observer.observe(document.body,{childList:true,subtree:true});setTimeout(injectNav,300)});
})();
