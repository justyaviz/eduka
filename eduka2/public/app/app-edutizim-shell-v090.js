/* EDUKA CRM v1.0.1 — stable product shell. No MutationObserver. Landing untouched. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const NAV=[
    ['dashboard','Bosh sahifa','home','Dashboard va dars jadvali'],
    ['leads','Lidlar','user-plus','Buyurtmalar va sotuv voronkasi'],
    ['groups','Guruhlar','layers','Guruhlar va darslar'],
    ['students','O‘quvchilar','graduation','O‘quvchilar ro‘yxati'],
    ['teachers','O‘qituvchilar','teacher','Ustozlar va yuklama'],
    ['courses','O‘quv bo‘limi','presentation','Kurslar, darajalar va xonalar'],
    ['reminders','Topshiriqlar','clock','Bugungi va kechikkan vazifalar'],
    ['finance','Moliya','coin','To‘lov, kirim va chiqim'],
    ['reports','Hisobotlar','chart','KPI, tahlil va eksport'],
    ['settings','Sozlamalar','settings','Markaz va tizim sozlamalari'],
    ['profile','Profil','user-check','Profil va xavfsizlik']
  ];

  function icon(name){return `<span data-icon="${name}"></span>`}
  function safe(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function money(v){return Number(v||0).toLocaleString('uz-UZ')}
  function getState(){try{return typeof state!=='undefined'&&state?state:{}}catch{return {}}}
  function coreNavigate(page,push=true){if(typeof window.go==='function') return window.go(page,push); location.href=`/app/${page}`}

  /* ===== Mobile navigation ===== */
  function closeMobileNav(){document.body.classList.remove('mobile-nav-open')}
  function ensureMobileNav(){
    if(!$('#clientMobileMenuV101')){
      const btn=document.createElement('button');
      btn.id='clientMobileMenuV101';
      btn.className='client-mobile-menu';
      btn.type='button';
      btn.setAttribute('aria-label','Menyuni ochish');
      btn.setAttribute('title','Menyu');
      btn.innerHTML=icon('list');
      const back=$('#clientBackStaticV090');
      back?.parentNode?.insertBefore(btn,back);
      btn.addEventListener('click',()=>document.body.classList.toggle('mobile-nav-open'));
    }
    if(!$('#clientMobileOverlayV101')){
      const overlay=document.createElement('div');
      overlay.id='clientMobileOverlayV101';
      overlay.className='client-mobile-overlay';
      overlay.addEventListener('click',closeMobileNav);
      document.body.appendChild(overlay);
    }
    $('#sideNav')?.addEventListener('click',()=>{if(innerWidth<=760)closeMobileNav()});
    window.addEventListener('resize',()=>{if(innerWidth>760)closeMobileNav()});
  }

  /* ===== Global search ===== */
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
    const add=(item)=>{const hay=`${item.label||''} ${item.meta||''} ${item.type||''}`.toLowerCase();if(!q||hay.includes(q))out.push(item)};
    NAV.forEach(([page,label,ic,meta])=>add({page,label,icon:ic,meta,type:'Bo‘limlar'}));

    const st=getState();
    (st.students||[]).slice(0,120).forEach(x=>add({page:'students',label:x.name||x.fullName||'O‘quvchi',icon:'graduation',meta:[x.phone,x.groupName].filter(Boolean).join(' · '),type:'O‘quvchilar'}));
    (st.groups||[]).slice(0,100).forEach(x=>add({page:'groups',label:x.name||'Guruh',icon:'layers',meta:[x.course,x.courseName,x.teacherName].filter(Boolean).join(' · '),type:'Guruhlar'}));
    (st.teachers||[]).slice(0,100).forEach(x=>add({page:'teachers',label:x.name||x.fullName||'O‘qituvchi',icon:'teacher',meta:[x.phone,x.subject].filter(Boolean).join(' · '),type:'O‘qituvchilar'}));
    (st.courses||[]).slice(0,80).forEach(x=>add({page:'courses',label:x.name||'Kurs',icon:'presentation',meta:[x.code,x.price?`${money(x.price)} UZS`:null].filter(Boolean).join(' · '),type:'Kurslar'}));
    (st.leads||[]).slice(0,120).forEach(x=>add({page:'leads',label:x.name||x.fullName||x.phone||'Lid',icon:'user-plus',meta:[x.phone,x.status,x.source].filter(Boolean).join(' · '),type:'Lidlar'}));
    ((st.finance&&st.finance.payments)||[]).slice(0,80).forEach(x=>add({page:'finance',label:x.studentName||'To‘lov',icon:'wallet',meta:[x.amount?`${money(x.amount)} UZS`:null,x.paymentType,x.groupName].filter(Boolean).join(' · '),type:'To‘lovlar'}));
    (st.reminders||[]).slice(0,80).forEach(x=>add({page:'reminders',label:x.title||'Topshiriq',icon:'clock',meta:[x.status,x.assignedTo].filter(Boolean).join(' · '),type:'Topshiriqlar'}));
    return out.slice(0,36);
  }

  function renderSearch(query=''){
    const pop=ensureSearchPop(),items=searchItems(query);
    if(!items.length){pop.innerHTML='<div class="client-search-empty">Hech narsa topilmadi</div>';return}
    const groups=new Map();
    items.forEach(x=>{if(!groups.has(x.type))groups.set(x.type,[]);groups.get(x.type).push(x)});
    pop.innerHTML=[...groups].map(([name,arr])=>`<div class="client-search-group">${safe(name)}</div>${arr.map(x=>`<button type="button" class="client-search-item" data-page="${safe(x.page)}">${icon(x.icon)}<span><b>${safe(x.label)}</b><small>${safe(x.meta||'')}</small></span><em class="search-type-v101">${safe(x.type)}</em></button>`).join('')}`).join('');
    if(typeof window.renderIcons==='function')window.renderIcons();
    $$('.client-search-item',pop).forEach(btn=>btn.onclick=()=>{pop.hidden=true;const input=$('#clientGlobalSearchV090');if(input)input.value='';coreNavigate(btn.dataset.page)});
  }
  function openSearch(){const pop=ensureSearchPop();renderSearch($('#clientGlobalSearchV090')?.value||'');pop.hidden=false}
  function closeSearch(){const pop=$('#clientSearchPopV090');if(pop)pop.hidden=true}
  function bindSearch(){
    const input=$('#clientGlobalSearchV090'); if(!input)return;
    input.addEventListener('focus',openSearch);
    input.addEventListener('input',()=>{renderSearch(input.value);ensureSearchPop().hidden=false});
    input.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSearch();input.blur()}if(e.key==='Enter')$('.client-search-item',ensureSearchPop())?.click()});
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){e.preventDefault();input.focus();openSearch()}if(e.key==='Escape'){closeSearch();closeMobileNav()}});
    document.addEventListener('click',e=>{if(!e.target.closest('.client-global-search')&&!e.target.closest('#clientSearchPopV090'))closeSearch()});
  }

  /* ===== Profile ===== */
  function initials(name){return String(name||'ED').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'ED'}
  function fmtDate(v){if(!v)return '—';try{return new Date(v).toLocaleString('uz-UZ')}catch{return '—'}}
  function profileLoading(){
    const content=$('#content'); if(!content)return;
    content.innerHTML='<div class="profile-card-v101"><div class="profile-card-body-v101">Profil yuklanmoqda...</div></div>';
  }
  function syncPageChrome(page,title){
    $$('#sideNav button[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
    const shellTitle=$('#shellPageTitle');if(shellTitle)shellTitle.textContent=title;
    closeMobileNav();
  }
  async function renderProfile(push=true){
    syncPageChrome('profile','Profil');
    if(push!==false && location.pathname!=='/app/profile') history.pushState({page:'profile'},'', '/app/profile');
    profileLoading();
    const d=await API.get('/api/app/profile-v101',{ok:false,error:'Profilni yuklab bo‘lmadi'});
    const content=$('#content'); if(!content)return;
    if(!d||d.ok===false){content.innerHTML=`<div class="profile-card-v101"><div class="profile-card-body-v101"><b>Profilni yuklashda xatolik</b><p>${safe(d?.error||'Noma’lum xatolik')}</p><button class="profile-primary-v101" id="profileRetryV101">Qayta urinish</button></div></div>`;$('#profileRetryV101')?.addEventListener('click',()=>renderProfile(false));return}
    const p=d.profile||{};
    const lang=localStorage.getItem('eduka_ui_language')||'uz';
    content.innerHTML=`
      <section class="profile-v101">
        <div class="profile-hero-v101">
          <div class="profile-hero-main-v101">
            <div class="profile-avatar-v101" id="profileAvatarV101">${safe(initials(p.fullName))}</div>
            <div><h1>${safe(p.fullName||'Foydalanuvchi')}</h1><p>${safe(p.email||'')} · ${safe(p.roleName||p.role||'')}</p></div>
          </div>
          <span class="profile-status-v101"><i></i>${safe(p.status||'active')}</span>
        </div>
        <div class="profile-grid-v101">
          <div class="profile-card-v101">
            <div class="profile-card-head-v101"><div><h2>Profil ma’lumotlari</h2><p>Shaxsiy ma’lumot va interfeys tilini boshqaring.</p></div></div>
            <div class="profile-card-body-v101">
              <form id="profileInfoFormV101" class="profile-form-v101">
                <label>To‘liq ism<input id="profileFullNameV101" value="${safe(p.fullName||'')}" required></label>
                <label>Email<input id="profileEmailV101" type="email" value="${safe(p.email||'')}" required></label>
                <label>Rol<input value="${safe(p.roleName||p.role||'')}" disabled></label>
                <label>Filial<input value="${safe(p.branchName||'Barcha filiallar')}" disabled></label>
                <label class="full">Interfeys tili<select id="profileLanguageV101"><option value="uz" ${lang==='uz'?'selected':''}>O‘zbekcha</option><option value="ru" ${lang==='ru'?'selected':''}>Русский</option><option value="en" ${lang==='en'?'selected':''}>English</option></select></label>
                <div class="profile-form-actions-v101"><button class="profile-primary-v101" type="submit">Saqlash</button></div>
              </form>
            </div>
          </div>
          <div class="profile-card-v101">
            <div class="profile-card-head-v101"><div><h2>Hisob holati</h2><p>Joriy akkaunt va sessiya ma’lumotlari.</p></div></div>
            <div class="profile-card-body-v101">
              <div class="profile-meta-list-v101">
                <div class="profile-meta-v101"><span>Markaz</span><b>${safe(d.center?.name||'—')}</b></div>
                <div class="profile-meta-v101"><span>Subdomain</span><b>${safe(d.center?.subdomain||location.hostname)}</b></div>
                <div class="profile-meta-v101"><span>Oxirgi kirish</span><b>${safe(fmtDate(p.lastLoginAt))}</b></div>
                <div class="profile-meta-v101"><span>Akkaunt yaratilgan</span><b>${safe(fmtDate(p.createdAt))}</b></div>
              </div>
            </div>
          </div>
          <div class="profile-card-v101">
            <div class="profile-card-head-v101"><div><h2>Xavfsizlik</h2><p>Parolni xavfsiz yangilang.</p></div></div>
            <div class="profile-card-body-v101">
              <div class="profile-security-note-v101">${icon('info')}<span>Parolni almashtirish uchun joriy parolni tasdiqlash talab qilinadi.</span></div>
              <form id="profilePasswordFormV101" class="profile-form-v101">
                <label class="full">Joriy parol<input id="profileCurrentPasswordV101" type="password" autocomplete="current-password" required></label>
                <label>Yangi parol<input id="profileNewPasswordV101" type="password" autocomplete="new-password" minlength="6" required></label>
                <label>Yangi parolni takrorlang<input id="profileConfirmPasswordV101" type="password" autocomplete="new-password" minlength="6" required></label>
                <div class="profile-form-actions-v101"><button class="profile-primary-v101" type="submit">Parolni yangilash</button></div>
              </form>
              <div class="profile-session-v101"><div><strong>Joriy sessiya</strong><small>Ushbu brauzer · himoyalangan tenant token</small></div><span class="current">Faol</span></div>
            </div>
          </div>
        </div>
      </section>`;
    if(typeof window.renderIcons==='function')window.renderIcons();

    $('#profileInfoFormV101')?.addEventListener('submit',async e=>{
      e.preventDefault();
      const fullName=$('#profileFullNameV101').value.trim(),email=$('#profileEmailV101').value.trim();
      const r=await API.patch('/api/app/profile-v101',{fullName,email});
      if(!r.ok){toast(r.error||'Profilni saqlashda xatolik',false);return}
      localStorage.setItem('eduka_ui_language',$('#profileLanguageV101').value);
      const profileName=$('#profileName');if(profileName)profileName.textContent=fullName;
      const avatar=$('#shellProfileAvatar');if(avatar)avatar.textContent=initials(fullName);
      toast('Profil saqlandi');
      await renderProfile(false);
    });
    $('#profilePasswordFormV101')?.addEventListener('submit',async e=>{
      e.preventDefault();
      const currentPassword=$('#profileCurrentPasswordV101').value,newPassword=$('#profileNewPasswordV101').value,confirm=$('#profileConfirmPasswordV101').value;
      if(newPassword!==confirm){toast('Yangi parollar mos emas',false);return}
      const r=await API.patch('/api/app/profile-v101/password',{currentPassword,newPassword});
      if(!r.ok){toast(r.error||'Parolni yangilashda xatolik',false);return}
      e.target.reset();toast('Parol yangilandi');
    });
  }

  function patchNavigation(){
    const original=typeof window.go==='function'?window.go:null;
    if(original&&!window.__edukaV101GoPatched){
      window.__edukaV101GoPatched=true;
      window.go=function(page,push=true){if(page==='profile')return renderProfile(push);return original(page,push)};
    }
    const profileAction=$('[data-shell-settings]');
    if(profileAction){
      profileAction.innerHTML=`${icon('user-check')} Profil va xavfsizlik`;
      profileAction.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();$('#profilePop').hidden=true;coreNavigate('profile')});
    }
    window.addEventListener('popstate',()=>{if(location.pathname.replace(/\/+$/,'')==='/app/profile')renderProfile(false)});
    if(location.pathname.replace(/\/+$/,'')==='/app/profile')setTimeout(()=>renderProfile(false),0);
  }

  function bindBack(){const b=$('#clientBackStaticV090');if(b)b.onclick=()=>{if(history.length>1)history.back()}}
  function syncStaticLabels(){const map=Object.fromEntries(NAV.map(x=>[x[0],x[1]]));$$('#sideNav button[data-page]').forEach(btn=>{const em=btn.querySelector('em');if(em&&map[btn.dataset.page])em.textContent=map[btn.dataset.page]})}

  function init(){
    document.body.classList.add('edutizim-client-v090','eduka-brandbook-v101');
    syncStaticLabels();
    ensureMobileNav();
    bindSearch();
    bindBack();
    patchNavigation();
    if(typeof window.renderIcons==='function')window.renderIcons();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
