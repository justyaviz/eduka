// Eduka 31.1.0 — Premium CRM Dashboard & Design System
(function(){
  const VERSION = '31.1.0';
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  const money = (v)=>`${Number(v||0).toLocaleString('uz-UZ')} so'm`;
  const cleanPath = ()=>location.pathname.replace(/\/$/,'') || '/';
  const isAdminPath = ()=>cleanPath().startsWith('/admin');
  const isDashboard = ()=>cleanPath()==='/admin/dashboard' || ($('#dashboard') && $('#dashboard').classList.contains('active'));
  const icon = (name)=>{
    const icons={
      dashboard:'M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z',
      users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
      groups:'M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5',
      teacher:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M16 11l2 2 4-4',
      calendar:'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
      check:'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
      wallet:'M20 7H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2ZM16 12h4',
      alert:'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01',
      lead:'M3 6h18M3 12h18M3 18h18M7 6v12M17 6v12',
      chart:'M3 3v18h18M7 16v-5M12 16V7M17 16v-9',
      settings:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 4.3l.06.06A1.65 1.65 0 0 0 8.92 4a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 1 1 19.63 6l-.06.06A1.65 1.65 0 0 0 19.4 9c.36.59.98 1 1.6 1H21a2 2 0 1 1 0 4h-.09c-.62 0-1.24.41-1.51 1Z',
      bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 0 1-3.46 0',
      search:'M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z',
      plus:'M12 5v14M5 12h14'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name]||icons.dashboard}"/></svg>`;
  };
  async function api(path){
    try{
      const res=await fetch(path,{credentials:'same-origin'});
      const data=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.message||'error');
      return data;
    }catch(e){ return {error:e.message}; }
  }
  function applyBody(){ if(isAdminPath()) document.body.classList.add('eduka-premium-crm'); }
  function simplifySidebar(){
    const nav=$('.side-nav'); if(!nav || nav.dataset.premiumSidebar==='true') return;
    const groups=[
      ['Asosiy', [
        ['Dashboard','/admin/dashboard','dashboard','dashboard'], ['Talabalar','/admin/students','students','users'], ['Guruhlar','/admin/groups','groups','groups'], ['O‘qituvchilar','/admin/teachers','teachers','teacher'], ['Dars jadvali','/admin/schedule','schedule','calendar'], ['Davomat','/admin/attendance','attendance','check']
      ]],
      ['Moliya', [
        ['To‘lovlar','/admin/payments','finance','wallet'], ['Qarzdorlik','/admin/debts','debtors','alert'], ['Kassa','/admin/finance-pro','finance-cash','wallet'], ['Hisobotlar','/admin/reports','reports','chart']
      ]],
      ['Sotuv', [
        ['Leadlar','/admin/leads','leads','lead'], ['Demo darslar','/admin/demo-lessons','demo-lessons','calendar']
      ]],
      ['Platforma', [
        ['Student App','/admin/student-app','student-app','users'], ['Gamification','/admin/gamification','gamification','chart'], ['Sozlamalar','/admin/settings','settings','settings']
      ]]
    ];
    const current=cleanPath();
    nav.innerHTML=groups.map(([title,items])=>`<div class="premium-side-section"><h4>${title}</h4>${items.map(([label,route,view,ic])=>`<button type="button" data-view="${view}" data-route="${route}" class="${current===route?'active':''}">${icon(ic)}<span>${label}</span></button>`).join('')}</div>`).join('');
    nav.dataset.premiumSidebar='true';
  }
  function simplifyTopbar(){
    const top=$('.topbar'); if(!top || top.dataset.premiumTopbar==='true') return;
    const center=$('[data-center-name]')?.textContent?.trim() || 'Eduka CRM';
    top.innerHTML=`
      <button class="mobile-menu icon-button" type="button" data-mobile-menu aria-label="Menyuni ochish">${icon('dashboard')}</button>
      <strong class="center-name" data-center-name>${center}</strong>
      <label class="search-box crm-search-wrap"><span>${icon('search')}</span><input type="search" aria-label="Qidiruv" data-global-search placeholder="Talaba, telefon, guruh yoki to‘lov qidirish..."/><div class="crm-search-results" data-global-results hidden></div></label>
      <button class="lang-button" type="button">uz</button>
      <button class="ghost-icon icon-button" type="button" data-crm-action="notifications" aria-label="Bildirishnomalar">${icon('bell')}</button>
      <button class="ghost-icon logout-button" type="button" data-crm-action="avatar-menu">Profil</button>`;
    top.dataset.premiumTopbar='true';
  }
  function num(v){return Number(v||0).toLocaleString('uz-UZ');}
  function pick(obj, keys, fallback=0){ for(const k of keys){ if(obj && obj[k]!==undefined && obj[k]!==null) return obj[k]; } return fallback; }
  async function renderDashboard(){
    const node=$('#dashboard'); if(!node) return;
    if(!isDashboard()) return;
    document.body.classList.add('eduka-premium-dashboard-route');
    node.dataset.premiumOwned='true';
    let holder=$('[data-premium-dashboard]',node);
    if(!holder){ holder=document.createElement('div'); holder.setAttribute('data-premium-dashboard',''); node.prepend(holder); }
    if(holder.dataset.rendering==='true') return;
    holder.dataset.rendering='true';
    holder.innerHTML=`<div class="eduka-premium-dashboard"><section class="eduka-premium-hero"><div><div class="eduka-premium-eyebrow">Eduka CRM</div><h1>Dashboard yuklanmoqda...</h1><p>Bugungi dars, to‘lov, davomat va shoshilinch vazifalar tayyorlanmoqda.</p></div></section></div>`;
    const [overview, lessons, ops]=await Promise.all([api('/api/app/crm30/overview'), api('/api/app/operations31/today-lessons'), api('/api/app/admin-crm27/overview')]);
    const k=overview.kpi || overview.summary || overview || {};
    const lessonList=lessons.lessons || lessons.items || [];
    const totalStudents=pick(k,['active_students','students_count','students','activeStudents'],0);
    const groups=pick(k,['active_groups','groups_count','groups'],0);
    const todayPayments=pick(k,['today_payments_amount','today_revenue','today_payments','revenue_today'],0);
    const debtors=pick(k,['debtors','debtors_count'],0);
    const debtSum=pick(k,['debt_amount','debt_total','debts_total'],0);
    const attendance=pick(k,['attendance_percent','attendance_rate'],0);
    const leads=pick(k,['new_leads','leads_count','leads'],0);
    const todayLessons=lessonList.length || pick(k,['today_lessons','lessons_today'],0);
    const center=$('[data-center-name]')?.textContent?.trim() || 'Eduka CRM';
    const lessonHtml=(lessonList.slice(0,5).map(l=>`<div class="eduka-premium-item"><div class="eduka-premium-item-icon">${icon('calendar')}</div><div><h3>${l.group_name||l.group||l.name||'Guruh darsi'}</h3><p>${l.teacher_name||l.teacher||'O‘qituvchi'} · ${l.room_name||l.room||'Xona'} · ${l.start_time||''}${l.end_time?' - '+l.end_time:''}</p></div><span class="eduka-premium-status ${l.status==='live'?'good':''}">${l.status==='live'?'Davom etmoqda':l.status==='completed'?'Tugadi':'Kutilmoqda'}</span></div>`).join('')) || `<div class="eduka-premium-empty">Bugun uchun darslar topilmadi</div>`;
    const actionItems=[
      ['Davomat olinmagan guruhlar','Bugungi darslarda davomatni tekshiring','warn','check'],
      ['Qarzdorlik eslatmasi','Qarzdor talabalarga eslatma yuborish','danger','alert'],
      ['To‘lov kutayotganlar','To‘lov holatini tezkor ko‘rib chiqing','warn','wallet'],
      ['Demo dars leadlari','Yangi leadlarni studentga aylantiring','good','lead']
    ];
    holder.innerHTML=`
      <div class="eduka-premium-dashboard">
        <section class="eduka-premium-hero">
          <div>
            <div class="eduka-premium-eyebrow">${center}</div>
            <h1>Premium CRM boshqaruv markazi</h1>
            <p>Bugungi darslar, to‘lovlar, davomat, qarzdorlik va shoshilinch vazifalarni bitta aniq dashboardda nazorat qiling.</p>
            <div class="eduka-premium-hero-actions">
              <button class="eduka-premium-btn" data-open-modal="students">Talaba qo‘shish</button>
              <button class="eduka-premium-btn secondary" data-route="/admin/payments" data-view="finance">To‘lov qo‘shish</button>
              <button class="eduka-premium-btn secondary" data-route="/admin/attendance" data-view="attendance">Davomat olish</button>
            </div>
          </div>
          <aside class="eduka-premium-hero-panel">
            <h3>Bugungi holat</h3>
            <div class="eduka-premium-hero-row"><span>Bugungi darslar</span><strong>${todayLessons}</strong></div>
            <div class="eduka-premium-hero-row"><span>Bugungi tushum</span><strong>${money(todayPayments)}</strong></div>
            <div class="eduka-premium-hero-row"><span>Qarzdorlar</span><strong>${debtors}</strong></div>
            <div class="eduka-premium-hero-row"><span>Davomat</span><strong>${num(attendance)}%</strong></div>
          </aside>
        </section>
        <section class="eduka-premium-kpis">
          ${kpi('Jami talabalar',totalStudents,'faol talaba','users','+ real vaqt')}
          ${kpi('Bugungi darslar',todayLessons,'jadvaldagi dars','calendar','live')}
          ${kpi('Bugungi tushum',money(todayPayments),'to‘lovlar','wallet','+12%')}
          ${kpi('Qarzdorlik',money(debtSum),`${debtors} qarzdor`,'alert','nazorat')}
          ${kpi('Davomat foizi',`${num(attendance)}%`,'bugungi holat','check','monitoring')}
          ${kpi('Yangi leadlar',leads,'sotuv pipeline','lead','follow-up')}
        </section>
        <section class="eduka-premium-grid">
          <article class="eduka-premium-card">
            <div class="eduka-premium-card-head"><div><h2>Bugungi ishlar</h2><p>Dars, to‘lov va davomat bo‘yicha real operatsiyalar.</p></div><span class="eduka-premium-pill">Operations</span></div>
            <div class="eduka-premium-list">${lessonHtml}</div>
          </article>
          <article class="eduka-premium-card">
            <div class="eduka-premium-card-head"><div><h2>Action Center</h2><p>Admin uchun tezkor qarorlar va ogohlantirishlar.</p></div><span class="eduka-premium-pill">${actionItems.length} vazifa</span></div>
            <div class="eduka-premium-actions-grid">${actionItems.map(([t,d,s,ic])=>`<button class="eduka-premium-action" type="button"><span>${icon(ic)}</span><b>${t}</b><small>${d}</small><span class="eduka-premium-status ${s}">${s==='danger'?'Muhim':s==='warn'?'Tekshirish':'OK'}</span></button>`).join('')}</div>
          </article>
        </section>
      </div>`;
    holder.dataset.rendering='false';
    if(window.lucide?.createIcons) window.lucide.createIcons();
  }
  function kpi(title,value,sub,ic,trend){
    return `<article class="eduka-premium-kpi"><div class="kpi-top"><span>${title}</span><i class="kpi-icon">${icon(ic)}</i></div><strong>${value}</strong><small>${sub}</small><em class="eduka-premium-trend">${trend}</em></article>`;
  }
  function boot(){
    applyBody(); simplifySidebar(); simplifyTopbar(); renderDashboard();
    document.title='Eduka CRM 31.1.0 — Premium Dashboard';
  }
  document.addEventListener('DOMContentLoaded',()=>{ boot(); setTimeout(boot,350); setTimeout(boot,1600); });
  window.addEventListener('popstate',()=>setTimeout(boot,80));
  window.addEventListener('eduka:legacy-render-complete',()=>setTimeout(boot,30));
  window.addEventListener('eduka:force-pro-render',()=>setTimeout(boot,30));
  document.addEventListener('click',(e)=>{ if(e.target.closest('[data-route]')) setTimeout(boot,120); });
  const obs=new MutationObserver(()=>{ clearTimeout(window.__edukaPremiumTimer); window.__edukaPremiumTimer=setTimeout(boot,120); });
  document.addEventListener('DOMContentLoaded',()=>{ const shell=$('[data-app-shell]'); if(shell) obs.observe(shell,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']}); });
  window.__edukaPremiumDashboardVersion=VERSION;
})();
