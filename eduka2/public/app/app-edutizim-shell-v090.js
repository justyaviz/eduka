/* EDUKA CRM v0.9.0-v2 — static shell interactions only. No MutationObserver. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const NAV=[
    ['dashboard','Bosh sahifa','home','Dashboard va dars jadvali'],
    ['leads','Lidlar','user-plus','Buyurtmalar va sotuv voronkasi'],
    ['groups','Guruhlar','layers','Guruhlar va darslar'],
    ['students','O‘quvchilar','graduation','O‘quvchilar ro‘yxati'],
    ['teachers','O‘qituvchilar','teacher','Ustozlar va yuklama'],
    ['reminders','Topshiriqlar','clock','Bugungi va kechikkan vazifalar'],
    ['finance','Moliya','coin','To‘lov, kirim va chiqim'],
    ['settings','Sozlamalar','settings','Markaz va tizim sozlamalari']
  ];

  function icon(name){return `<span data-icon="${name}"></span>`}
  function safe(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

  function go(page){
    if(typeof window.go==='function') window.go(page);
    else location.href=`/app/${page}`;
  }

  function ensureSearchPop(){
    let pop=$('#clientSearchPopV090');
    if(pop)return pop;
    pop=document.createElement('div');
    pop.id='clientSearchPopV090';
    pop.className='client-search-pop';
    pop.hidden=true;
    document.body.appendChild(pop);
    return pop;
  }

  function searchItems(query=''){
    const q=String(query||'').trim().toLowerCase();
    const out=[];
    NAV.forEach(([page,label,ic,meta])=>{
      if(!q||`${label} ${meta}`.toLowerCase().includes(q)) out.push({page,label,icon:ic,meta,type:'Bo‘limlar'});
    });
    const st=window.state||{};
    (st.students||[]).slice(0,80).forEach(x=>{
      const label=x.name||x.fullName||'O‘quvchi',meta=x.phone||x.groupName||'';
      if(!q||`${label} ${meta}`.toLowerCase().includes(q)) out.push({page:'students',label,icon:'graduation',meta,type:'O‘quvchilar'});
    });
    (st.groups||[]).slice(0,60).forEach(x=>{
      const label=x.name||'Guruh',meta=[x.course,x.courseName,x.teacherName].filter(Boolean).join(' · ');
      if(!q||`${label} ${meta}`.toLowerCase().includes(q)) out.push({page:'groups',label,icon:'layers',meta,type:'Guruhlar'});
    });
    return out.slice(0,24);
  }

  function renderSearch(query=''){
    const pop=ensureSearchPop(),items=searchItems(query);
    if(!items.length){pop.innerHTML='<div class="client-search-empty">Hech narsa topilmadi</div>';return}
    const groups=new Map();
    items.forEach(x=>{if(!groups.has(x.type))groups.set(x.type,[]);groups.get(x.type).push(x)});
    pop.innerHTML=[...groups].map(([name,arr])=>`<div class="client-search-group">${safe(name)}</div>${arr.map(x=>`<button type="button" class="client-search-item" data-page="${safe(x.page)}">${icon(x.icon)}<span><b>${safe(x.label)}</b><small>${safe(x.meta||'')}</small></span></button>`).join('')}`).join('');
    if(typeof window.renderIcons==='function')window.renderIcons();
    $$('.client-search-item',pop).forEach(btn=>btn.onclick=()=>{pop.hidden=true;const input=$('#clientGlobalSearchV090');if(input)input.value='';go(btn.dataset.page)});
  }

  function openSearch(){const pop=ensureSearchPop();renderSearch($('#clientGlobalSearchV090')?.value||'');pop.hidden=false}
  function closeSearch(){const pop=$('#clientSearchPopV090');if(pop)pop.hidden=true}

  function bindSearch(){
    const input=$('#clientGlobalSearchV090');
    if(!input)return;
    input.addEventListener('focus',openSearch);
    input.addEventListener('input',()=>{renderSearch(input.value);ensureSearchPop().hidden=false});
    input.addEventListener('keydown',e=>{
      if(e.key==='Escape'){closeSearch();input.blur()}
      if(e.key==='Enter'){const first=$('.client-search-item',ensureSearchPop());first?.click()}
    });
    document.addEventListener('keydown',e=>{
      if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){e.preventDefault();input.focus();openSearch()}
      if(e.key==='Escape')closeSearch();
    });
    document.addEventListener('click',e=>{if(!e.target.closest('.client-global-search')&&!e.target.closest('#clientSearchPopV090'))closeSearch()});
  }

  function bindBack(){const b=$('#clientBackStaticV090');if(b)b.onclick=()=>{if(history.length>1)history.back()}}

  function syncStaticLabels(){
    const map=Object.fromEntries(NAV.map(x=>[x[0],x[1]]));
    $$('#sideNav button[data-page]').forEach(btn=>{const em=btn.querySelector('em');if(em&&map[btn.dataset.page])em.textContent=map[btn.dataset.page]});
  }

  function init(){
    document.body.classList.add('edutizim-client-v090');
    syncStaticLabels();
    bindSearch();
    bindBack();
    if(typeof window.renderIcons==='function')window.renderIcons();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
