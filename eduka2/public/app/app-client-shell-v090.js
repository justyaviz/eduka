/* EDUKA CRM v0.9.0 — Edutizim-inspired customer panel shell. Landing untouched. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const safe=(v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
  const NAV_LABELS={dashboard:'Bosh sahifa',leads:'Lidlar',teachers:'O‘qituvchilar',groups:'Guruhlar',students:'O‘quvchilar',reminders:'Topshiriqlar',finance:'Moliya',settings:'Sozlamalar'};
  let commandOpen=false;

  function icon(name){return `<span data-icon="${name}"></span>`}

  function rebuildSidebar(){
    const top=$('.side-top');
    if(top&&!top.querySelector('.client-brand-copy-v090')){
      const copy=document.createElement('div');
      copy.className='client-brand-copy-v090';
      copy.innerHTML='<b>EDUKA</b><small>Education CRM</small>';
      const mark=top.querySelector('.tenant-brand-mark');
      mark?.insertAdjacentElement('afterend',copy);
    }

    const nav=$('#sideNav');
    if(nav){
      if(!nav.previousElementSibling?.classList?.contains('client-nav-label-v090')){
        const label=document.createElement('div');
        label.className='client-nav-label-v090';
        label.textContent='Boshqaruv';
        nav.insertAdjacentElement('beforebegin',label);
      }
      $$('button[data-page]',nav).forEach(btn=>{
        const page=btn.dataset.page;
        const em=btn.querySelector('em');
        const label=NAV_LABELS[page]||em?.textContent||'';
        if(em&&NAV_LABELS[page]&&em.textContent!==NAV_LABELS[page]) em.textContent=NAV_LABELS[page];
        if(btn.title!==label) btn.title=label;
      });
    }

    const sidebar=$('.sidebar');
    if(sidebar&&!sidebar.querySelector('.client-side-bottom-v090')){
      const bottom=document.createElement('div');
      bottom.className='client-side-bottom-v090';
      bottom.innerHTML=`<a href="https://t.me/eduka_sales" target="_blank" rel="noreferrer">${icon('help')}<span>Texnik yordam</span></a>`;
      sidebar.appendChild(bottom);
    }
  }

  function rebuildTopbar(){
    const topbar=$('.topbar'); if(!topbar)return;
    if(!$('#clientBackV090')){
      const back=document.createElement('button');
      back.id='clientBackV090';back.className='client-back-v090';back.type='button';back.title='Orqaga';back.setAttribute('aria-label','Orqaga');back.textContent='←';
      topbar.prepend(back);back.onclick=()=>history.length>1?history.back():null;
    }

    const context=$('.crm-page-context');
    if(context&&!$('#clientGlobalSearchV090')){
      const search=document.createElement('label');
      search.id='clientGlobalSearchV090';search.className='client-global-search-v090';
      search.innerHTML=`${icon('search')}<input id="clientGlobalInputV090" autocomplete="off" placeholder="Qidirish..." aria-label="Global qidiruv"><kbd>Ctrl K</kbd>`;
      context.insertAdjacentElement('afterend',search);
      const input=$('#clientGlobalInputV090');
      input.addEventListener('focus',()=>openCommand(input.value));
      input.addEventListener('input',()=>{openCommand(input.value);renderCommand(input.value)});
    }

    if(!$('#clientSubscriptionV090')){
      const sub=document.createElement('div');sub.id='clientSubscriptionV090';sub.className='client-subscription-v090';
      sub.innerHTML='<span>Obuna:</span><b>—</b>';
      const actions=$('.top-actions');actions?.insertAdjacentElement('beforebegin',sub);
    }
    syncSubscription();
  }

  function syncSubscription(){
    const out=$('#clientSubscriptionV090 b'),src=$('#licenseUntil');
    if(out&&src){
      const next=(src.textContent||'—').trim()||'—';
      if(out.textContent!==next) out.textContent=next;
    }
  }

  function commandItems(){
    const st=window.state||{};
    const items=[
      {type:'Bo‘limlar',label:'Bosh sahifa',meta:'Dashboard va asosiy ko‘rsatkichlar',icon:'home',page:'dashboard'},
      {type:'Bo‘limlar',label:'Lidlar',meta:'Sotuv pipeline',icon:'user-plus',page:'leads'},
      {type:'Bo‘limlar',label:'Guruhlar',meta:'Guruhlar va darslar',icon:'layers',page:'groups'},
      {type:'Bo‘limlar',label:'O‘quvchilar',meta:'O‘quvchilar ro‘yxati',icon:'graduation',page:'students'},
      {type:'Bo‘limlar',label:'O‘qituvchilar',meta:'Ustozlar va yuklama',icon:'teacher',page:'teachers'},
      {type:'Bo‘limlar',label:'Topshiriqlar',meta:'Bugungi va o‘tib ketgan vazifalar',icon:'clock',page:'reminders'},
      {type:'Bo‘limlar',label:'Moliya',meta:'Kirim, chiqim va to‘lovlar',icon:'coin',page:'finance'},
      {type:'Bo‘limlar',label:'Sozlamalar',meta:'Markaz va tizim sozlamalari',icon:'settings',page:'settings'},
      {type:'Tezkor amal',label:'Yangi o‘quvchi',meta:'O‘quvchi qo‘shish',icon:'user-plus',drawer:'student'},
      {type:'Tezkor amal',label:'Yangi guruh',meta:'Guruh yaratish',icon:'layers',drawer:'group'},
      {type:'Tezkor amal',label:'Yangi o‘qituvchi',meta:'O‘qituvchi qo‘shish',icon:'teacher',drawer:'teacher'},
      {type:'Tezkor amal',label:'To‘lov qabul qilish',meta:'Yangi to‘lov',icon:'wallet',drawer:'payment'}
    ];
    (st.students||[]).slice(0,250).forEach(x=>items.push({type:'O‘quvchilar',label:x.name||x.fullName||'O‘quvchi',meta:x.phone||x.groupName||'',icon:'graduation',page:'students'}));
    (st.groups||[]).slice(0,200).forEach(x=>items.push({type:'Guruhlar',label:x.name||'Guruh',meta:[x.course,x.teacherName].filter(Boolean).join(' · '),icon:'layers',page:'groups'}));
    (st.teachers||[]).slice(0,150).forEach(x=>items.push({type:'O‘qituvchilar',label:x.name||x.fullName||'O‘qituvchi',meta:x.subject||x.phone||'',icon:'teacher',page:'teachers'}));
    (st.courses||[]).slice(0,100).forEach(x=>items.push({type:'Kurslar',label:x.name||'Kurs',meta:x.code||'',icon:'presentation',page:'settings'}));
    return items;
  }

  function ensureCommand(){
    let wrap=$('#clientCommandBackdropV090');if(wrap)return wrap;
    wrap=document.createElement('div');wrap.id='clientCommandBackdropV090';wrap.className='client-command-backdrop-v090';wrap.hidden=true;
    wrap.innerHTML=`<section class="client-command-v090" role="dialog" aria-modal="true" aria-label="Global qidiruv"><div class="client-command-head-v090">${icon('search')}<input id="clientCommandInputV090" autocomplete="off" placeholder="O‘quvchi, guruh, bo‘lim yoki amal qidiring"><kbd>ESC</kbd></div><div id="clientCommandResultsV090" class="client-command-results-v090"></div></section>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click',e=>{if(e.target===wrap)closeCommand()});
    const input=$('#clientCommandInputV090');input.addEventListener('input',()=>renderCommand(input.value));
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=$('.client-command-item-v090',wrap);first?.click()}});
    return wrap;
  }

  function renderCommand(query=''){
    ensureCommand();const out=$('#clientCommandResultsV090');if(!out)return;
    const q=String(query||'').trim().toLowerCase();
    let items=commandItems().filter(x=>!q||`${x.label} ${x.meta} ${x.type}`.toLowerCase().includes(q));
    items=items.slice(0,28);
    if(!items.length){out.innerHTML='<div class="client-command-empty-v090">Hech narsa topilmadi</div>';return}
    const groups=new Map();items.forEach(x=>{if(!groups.has(x.type))groups.set(x.type,[]);groups.get(x.type).push(x)});
    out.innerHTML=[...groups].map(([type,arr])=>`<div class="client-command-group-v090"><small>${safe(type)}</small>${arr.map(x=>`<button class="client-command-item-v090" type="button" data-command-page="${safe(x.page||'')}" data-command-drawer="${safe(x.drawer||'')}"><span class="client-command-icon-v090">${icon(x.icon||'search')}</span><span><b>${safe(x.label)}</b><em>${safe(x.meta||'')}</em></span></button>`).join('')}</div>`).join('');
    if(typeof window.renderIcons==='function')window.renderIcons();
    $$('.client-command-item-v090',out).forEach(btn=>btn.onclick=()=>{
      closeCommand();
      if(btn.dataset.commandDrawer){const trigger=document.querySelector(`[data-open-drawer="${btn.dataset.commandDrawer}"]`);if(trigger)trigger.click();else if(typeof window.openDrawer==='function')window.openDrawer(btn.dataset.commandDrawer);return}
      if(btn.dataset.commandPage){if(typeof window.go==='function')window.go(btn.dataset.commandPage);else location.href=`/app/${btn.dataset.commandPage}`}
    });
  }

  function openCommand(query=''){
    const wrap=ensureCommand();wrap.hidden=false;commandOpen=true;
    const input=$('#clientCommandInputV090');input.value=query||'';renderCommand(query||'');
    setTimeout(()=>input.focus(),0);
  }
  function closeCommand(){const wrap=$('#clientCommandBackdropV090');if(wrap)wrap.hidden=true;commandOpen=false;const top=$('#clientGlobalInputV090');if(top&&top.value)top.value=''}

  function keyboard(){
    document.addEventListener('keydown',e=>{
      if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){e.preventDefault();openCommand('');return}
      if(e.key==='Escape'&&commandOpen){e.preventDefault();closeCommand()}
    });
  }

  function syncPage(){
    const page=window.state?.page||'dashboard';
    const title=$('#shellPageTitle');
    const next=NAV_LABELS[page];
    if(title&&next&&title.textContent!==next) title.textContent=next;
  }

  function init(){
    document.body.classList.add('client-shell-v090');
    rebuildSidebar();rebuildTopbar();keyboard();syncPage();
    if(typeof window.renderIcons==='function')window.renderIcons();
    let scheduled=false;
    const observer=new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{
        scheduled=false;
        rebuildSidebar();rebuildTopbar();syncSubscription();syncPage();
      });
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
