/* EDUKA CRM v0.8.2 — Academic Settings 2.0. Tenant admin only; landing untouched. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const safe=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const ui={section:null,data:null,loading:false,query:''};
  const REASON_LABELS={attendance:'Davomat',student_leave:'O‘quvchi ketishi',lead_lost:'Lid yo‘qotilishi',payment_cancel:'To‘lov bekori',other:'Boshqa'};

  function isSettings(){
    const p=(window.state?.page||'').toLowerCase(),path=location.pathname.toLowerCase();
    return p==='settings'||p==='general-settings'||path.endsWith('/app/settings')||path.endsWith('/app/general-settings');
  }
  const money=v=>`${Number(v||0).toLocaleString('uz-UZ')} so‘m`;
  const courseName=id=>(ui.data?.courses||[]).find(x=>String(x.id)===String(id))?.name||'Barcha kurslar';

  async function load(){
    if(ui.loading)return;ui.loading=true;
    const d=await API.get('/api/app/academic-config-v082',{ok:false});
    ui.loading=false;
    if(!d?.ok){toast(d?.error||'Akademik sozlamalar yuklanmadi',false);return}
    ui.data=d;renderCurrent();
  }

  function injectNav(){
    if(!isSettings())return;
    const nav=$('.settings-nav-v08');if(!nav)return;
    if(!nav.querySelector('[data-v082-section="levels"]')){
      const html=`<div class="settings-nav-divider-v082"><span>O‘QUV TIZIMI</span></div>
        <button type="button" data-v082-section="levels"><span data-icon="graduation"></span>Darajalar</button>
        <button type="button" data-v082-section="reasons"><span data-icon="info"></span>Sabablar</button>
        <button type="button" data-v082-section="grades"><span data-icon="chart"></span>Baholash darajalari</button>`;
      const before=nav.querySelector('.settings-nav-divider-v081');
      if(before)before.insertAdjacentHTML('beforebegin',html);else nav.insertAdjacentHTML('beforeend',html);
      if(typeof renderIcons==='function')renderIcons();
    }
    nav.querySelectorAll('button').forEach(b=>{
      if(b.dataset.v082Section)b.classList.toggle('active',b.dataset.v082Section===ui.section);
      else if(ui.section)b.classList.remove('active');
      if(b.dataset.v08Section&&!b.dataset.v082Hook){b.dataset.v082Hook='1';b.addEventListener('click',()=>{ui.section=null;ui.query='';});}
      if(b.dataset.v081Section&&!b.dataset.v082Hook){b.dataset.v082Hook='1';b.addEventListener('click',()=>{ui.section=null;ui.query='';});}
    });
  }

  function head(title,desc,actionLabel){return `<div class="settings-head-v08"><div><h1>${safe(title)}</h1><p>${safe(desc)}</p></div><button class="settings-save-v08" type="button" data-v082-add><span data-icon="plus"></span> ${safe(actionLabel)}</button></div>`}
  function kpis(items,thirdLabel,thirdValue){const active=items.filter(x=>x.active!==false).length;return `<div class="academic-kpis-v082"><div><span>Jami</span><b>${items.length}</b></div><div><span>Faol</span><b>${active}</b></div><div><span>${safe(thirdLabel)}</span><b>${safe(thirdValue)}</b></div><div><span>Nofaol</span><b>${items.length-active}</b></div></div>`}
  function toolbar(placeholder){return `<div class="academic-toolbar-v082"><label><span data-icon="search"></span><input id="academicSearchV082" value="${safe(ui.query)}" placeholder="${safe(placeholder)}"></label></div>`}
  function empty(icon,title,text){return `<div class="academic-empty-v082"><span data-icon="${icon}"></span><h3>${safe(title)}</h3><p>${safe(text)}</p></div>`}
  function actions(kind,id){return `<div class="academic-actions-v082"><button type="button" title="Tahrirlash" data-v082-edit="${safe(id)}" data-kind="${kind}"><span data-icon="edit"></span></button><button type="button" class="danger" title="O‘chirish" data-v082-delete="${safe(id)}" data-kind="${kind}"><span data-icon="trash"></span></button></div>`}

  function filtered(items){const q=ui.query.toLowerCase().trim();if(!q)return items;return items.filter(x=>JSON.stringify(x).toLowerCase().includes(q));}

  function renderLevels(){
    const items=filtered(ui.data?.levels||[]),all=ui.data?.levels||[],linked=new Set(all.filter(x=>x.courseId).map(x=>x.courseId)).size,pane=$('.settings-pane-v08');if(!pane)return;
    pane.innerHTML=head('Darajalar / Level','Kurs darajalari, ranglari va narxlarini boshqaring.','Daraja qo‘shish')+kpis(all,'Bog‘langan kurslar',linked)+
      `<div class="academic-note-v082">Masalan: Beginner, Elementary, Intermediate. Ranglar jadval va guruh kartalarida tez ajratish uchun ishlatiladi.</div>`+toolbar('Daraja nomi yoki kodi bo‘yicha qidirish')+
      (items.length?`<div class="academic-table-v082"><div class="academic-row-v082 level head"><span>Daraja</span><span>Kurs</span><span>Narx</span><span>Rang</span><span>Holat</span><span></span></div>${items.map(x=>`<div class="academic-row-v082 level"><div class="academic-name-v082"><i style="background:${safe(x.color||'#4565E3')}"></i><div><b>${safe(x.name)}</b><small>${safe(x.code||'Kod yo‘q')}</small></div></div><span>${safe(courseName(x.courseId))}</span><b>${money(x.price)}</b><span class="academic-chip-v082"><i style="width:8px;height:8px;border-radius:50%;background:${safe(x.color)}"></i>${safe(x.color)}</span><span class="academic-chip-v082 ${x.active!==false?'active':'off'}">${x.active!==false?'Faol':'Nofaol'}</span>${actions('levels',x.id)}</div>`).join('')}</div>`:empty('graduation','Darajalar hali yo‘q','“Daraja qo‘shish” orqali birinchi levelni yarating.'));
    finish();
  }

  function renderReasons(){
    const items=filtered(ui.data?.reasons||[]),all=ui.data?.reasons||[],moneyCount=all.filter(x=>x.deductMoney).length,pane=$('.settings-pane-v08');if(!pane)return;
    pane.innerHTML=head('Sabablar','Davomat, ketish, lid va to‘lov jarayonlari uchun biznes sabablarini boshqaring.','Sabab qo‘shish')+kpis(all,'Pul yechadigan',moneyCount)+
      `<div class="academic-note-v082">Sabab faqat matn emas: ayrim sabablar pul yechish yoki sinov darsida pul yechmaslik kabi biznes qoidalariga ulanadi.</div>`+toolbar('Sabab nomi yoki turi bo‘yicha qidirish')+
      (items.length?`<div class="academic-table-v082"><div class="academic-row-v082 reason head"><span>Sabab</span><span>Turi</span><span>Pul yechadi</span><span>Sinovda yechmaydi</span><span>Holat</span><span></span></div>${items.map(x=>`<div class="academic-row-v082 reason"><div class="academic-name-v082"><i style="background:${x.active!==false?'#4565E3':'#98A2B3'}"></i><div><b>${safe(x.name)}</b><small>${safe(REASON_LABELS[x.type]||'Boshqa')}</small></div></div><span class="academic-chip-v082">${safe(REASON_LABELS[x.type]||'Boshqa')}</span><b>${x.deductMoney?'Ha':'Yo‘q'}</b><b>${x.trialNoCharge?'Ha':'Yo‘q'}</b><span class="academic-chip-v082 ${x.active!==false?'active':'off'}">${x.active!==false?'Faol':'Nofaol'}</span>${actions('reasons',x.id)}</div>`).join('')}</div>`:empty('info','Sabablar hali yo‘q','Davomat yoki o‘quvchi ketishi sabablarini yarating.'));
    finish();
  }

  function renderGrades(){
    const items=filtered(ui.data?.grades||[]),all=ui.data?.grades||[],covered=all.filter(x=>x.active!==false).reduce((s,x)=>s+Math.max(0,Number(x.maxScore||0)-Number(x.minScore||0)+1),0),pane=$('.settings-pane-v08');if(!pane)return;
    pane.innerHTML=head('Baholash darajalari','Ball oralig‘i va rang bilan o‘quvchi natijasini standartlashtiring.','Daraja qo‘shish')+kpis(all,'Qamrab olingan ball',Math.min(101,covered))+
      `<div class="academic-note-v082">Masalan: A’lo 86–100, Yaxshi 71–85. Interval kesishmasligi tavsiya qilinadi.</div>`+toolbar('Baholash darajasi bo‘yicha qidirish')+
      (items.length?`<div class="academic-table-v082"><div class="academic-row-v082 grade head"><span>Daraja</span><span>Min ball</span><span>Max ball</span><span>Rang</span><span>Holat</span><span></span></div>${items.map(x=>`<div class="academic-row-v082 grade"><div class="academic-name-v082"><i style="background:${safe(x.color||'#2DBE74')}"></i><div><b>${safe(x.name)}</b><small>${safe(x.minScore)}–${safe(x.maxScore)} ball</small></div></div><b>${safe(x.minScore)}</b><b>${safe(x.maxScore)}</b><span class="academic-chip-v082">${safe(x.color)}</span><span class="academic-chip-v082 ${x.active!==false?'active':'off'}">${x.active!==false?'Faol':'Nofaol'}</span>${actions('grades',x.id)}</div>`).join('')}</div>`:empty('chart','Baholash darajalari hali yo‘q','Ball oralig‘i va rang bilan birinchi darajani yarating.'));
    finish();
  }

  function renderCurrent(){if(!ui.data)return;if(ui.section==='levels')renderLevels();else if(ui.section==='reasons')renderReasons();else if(ui.section==='grades')renderGrades();}
  function finish(){injectNav();if(typeof renderIcons==='function')renderIcons();const s=$('#academicSearchV082');if(s){s.oninput=()=>{ui.query=s.value;clearTimeout(s._t);s._t=setTimeout(renderCurrent,120)}}}

  function setDrawer(title,html){$('#drawerTitle').textContent=title;$('#drawerBody').innerHTML=html;$('#drawerBackdrop').hidden=false;$('#drawer').hidden=false;if(typeof renderIcons==='function')renderIcons();}
  function close(){if(typeof closeDrawer==='function')closeDrawer();else{$('#drawerBackdrop').hidden=true;$('#drawer').hidden=true}}

  function openForm(kind,id=null){
    const items=ui.data?.[kind]||[],x=id?items.find(v=>String(v.id)===String(id)):null;
    if(kind==='levels'){
      setDrawer(id?'Darajani tahrirlash':'Yangi daraja',`<form id="academicFormV082" class="academic-form-v082"><label>Daraja nomi<input id="v082_name" value="${safe(x?.name||'')}" placeholder="Masalan, Elementary" required></label><label>Kod<input id="v082_code" value="${safe(x?.code||'')}" placeholder="ELM"></label><label>Kurs<select id="v082_course"><option value="">Barcha kurslar</option>${(ui.data?.courses||[]).map(c=>`<option value="${safe(c.id)}" ${String(x?.courseId||'')===String(c.id)?'selected':''}>${safe(c.name)}</option>`).join('')}</select></label><label>Narx<input id="v082_price" type="number" min="0" value="${safe(x?.price??0)}"></label><label>Rang<input id="v082_color" type="color" value="${safe(x?.color||'#4565E3')}"></label><label>Tartib<input id="v082_sort" type="number" value="${safe(x?.sortOrder??items.length)}"></label><label class="toggle-line-v082"><span>Faol</span><input id="v082_active" type="checkbox" ${x?.active===false?'':'checked'}></label><div class="academic-form-actions-v082"><button type="button" data-v082-close>Bekor qilish</button><button class="primary" type="submit">Saqlash</button></div></form>`);
    }else if(kind==='reasons'){
      setDrawer(id?'Sababni tahrirlash':'Yangi sabab',`<form id="academicFormV082" class="academic-form-v082"><label class="wide">Sabab nomi<input id="v082_name" value="${safe(x?.name||'')}" placeholder="Masalan, Qattiq kasal bo‘lgan" required></label><label>Turi<select id="v082_type">${Object.entries(REASON_LABELS).map(([k,v])=>`<option value="${k}" ${x?.type===k?'selected':''}>${safe(v)}</option>`).join('')}</select></label><label class="toggle-line-v082"><span>Faol</span><input id="v082_active" type="checkbox" ${x?.active===false?'':'checked'}></label><label class="toggle-line-v082"><span>Pul yechadi</span><input id="v082_deduct" type="checkbox" ${x?.deductMoney?'checked':''}></label><label class="toggle-line-v082"><span>Sinov darsida pul yechilmaydi</span><input id="v082_trial" type="checkbox" ${x?.trialNoCharge?'checked':''}></label><div class="academic-form-actions-v082"><button type="button" data-v082-close>Bekor qilish</button><button class="primary" type="submit">Saqlash</button></div></form>`);
    }else{
      setDrawer(id?'Baholash darajasini tahrirlash':'Yangi baholash darajasi',`<form id="academicFormV082" class="academic-form-v082"><label class="wide">Daraja nomi<input id="v082_name" value="${safe(x?.name||'')}" placeholder="Masalan, A’lo" required></label><label>Min ball<input id="v082_min" type="number" min="0" max="100" value="${safe(x?.minScore??0)}"></label><label>Max ball<input id="v082_max" type="number" min="0" max="100" value="${safe(x?.maxScore??100)}"></label><label>Rang<input id="v082_color" type="color" value="${safe(x?.color||'#2DBE74')}"></label><label>Tartib<input id="v082_sort" type="number" value="${safe(x?.sortOrder??items.length)}"></label><label class="toggle-line-v082"><span>Faol</span><input id="v082_active" type="checkbox" ${x?.active===false?'':'checked'}></label><div class="academic-form-actions-v082"><button type="button" data-v082-close>Bekor qilish</button><button class="primary" type="submit">Saqlash</button></div></form>`);
    }
    $('#academicFormV082').onsubmit=async e=>{
      e.preventDefault();const next=items.map(v=>({...v}));let payload;
      if(kind==='levels')payload={...(x||{}),name:$('#v082_name').value.trim(),code:$('#v082_code').value.trim(),courseId:$('#v082_course').value||null,price:Number($('#v082_price').value||0),color:$('#v082_color').value,sortOrder:Number($('#v082_sort').value||0),active:$('#v082_active').checked};
      else if(kind==='reasons')payload={...(x||{}),name:$('#v082_name').value.trim(),type:$('#v082_type').value,deductMoney:$('#v082_deduct').checked,trialNoCharge:$('#v082_trial').checked,active:$('#v082_active').checked};
      else payload={...(x||{}),name:$('#v082_name').value.trim(),minScore:Number($('#v082_min').value||0),maxScore:Number($('#v082_max').value||100),color:$('#v082_color').value,sortOrder:Number($('#v082_sort').value||0),active:$('#v082_active').checked};
      if(!payload.name){toast('Nom kiriting',false);return}
      if(id){const i=next.findIndex(v=>String(v.id)===String(id));if(i>=0)next[i]=payload;}else next.push(payload);
      const btn=e.currentTarget.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent='Saqlanmoqda...';
      const r=await API.put(`/api/app/academic-config-v082/${kind}`,{items:next});
      if(!r?.ok){btn.disabled=false;btn.textContent='Saqlash';toast(r?.error||'Saqlashda xatolik',false);return}
      ui.data[kind]=r.items||next;close();toast(id?'Yangilandi':'Qo‘shildi');renderCurrent();
    };
  }

  function confirmDelete(title){return new Promise(resolve=>{const w=document.createElement('div');w.className='academic-confirm-v082';w.innerHTML=`<div><h3>O‘chirasizmi?</h3><p><b>${safe(title)}</b> bu ro‘yxatdan olib tashlanadi.</p><footer><button type="button" data-no>Bekor qilish</button><button type="button" class="danger" data-yes>O‘chirish</button></footer></div>`;document.body.appendChild(w);w.querySelector('[data-no]').onclick=()=>{w.remove();resolve(false)};w.querySelector('[data-yes]').onclick=()=>{w.remove();resolve(true)};w.onclick=e=>{if(e.target===w){w.remove();resolve(false)}}})}

  document.addEventListener('click',async e=>{
    const nav=e.target.closest('[data-v082-section]');if(nav){ui.section=nav.dataset.v082Section;ui.query='';injectNav();if(!ui.data)await load();else renderCurrent();return}
    if(!ui.section)return;
    if(e.target.closest('[data-v082-add]')){openForm(ui.section);return}
    const edit=e.target.closest('[data-v082-edit]');if(edit){openForm(edit.dataset.kind,edit.dataset.v082Edit);return}
    const del=e.target.closest('[data-v082-delete]');if(del){const kind=del.dataset.kind,id=del.dataset.v082Delete,items=ui.data?.[kind]||[],x=items.find(v=>String(v.id)===String(id));if(!(await confirmDelete(x?.name||'Ushbu element')))return;const next=items.filter(v=>String(v.id)!==String(id));const r=await API.put(`/api/app/academic-config-v082/${kind}`,{items:next});if(!r?.ok){toast(r?.error||'O‘chirishda xatolik',false);return}ui.data[kind]=r.items||next;toast('O‘chirildi');renderCurrent();return}
    if(e.target.closest('[data-v082-close]'))close();
  });

  const observer=new MutationObserver(()=>{if(isSettings())injectNav();});
  document.addEventListener('DOMContentLoaded',()=>{observer.observe(document.body,{childList:true,subtree:true});setTimeout(injectNav,180)});
  setInterval(()=>{if(isSettings())injectNav();},1500);
})();
