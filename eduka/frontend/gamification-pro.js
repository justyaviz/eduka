(function(){
  const VIEWS = ["gamification-dashboard","gamification-award","gamification-products","gamification-redemptions","gamification-ranking","gamification-achievements","gamification-rules","gamification-limits","gamification-telegram"];
  const LABELS = {
    "gamification-dashboard":"Dashboard",
    "gamification-award":"Coin berish",
    "gamification-products":"Sovg'alar",
    "gamification-redemptions":"So'rovlar",
    "gamification-ranking":"Reyting",
    "gamification-achievements":"Yutuqlar",
    "gamification-rules":"Qoidalar",
    "gamification-limits":"Coin limit",
    "gamification-telegram":"Telegram"
  };
  const ICONS = {
    "gamification-dashboard":"sparkles",
    "gamification-award":"coins",
    "gamification-products":"gift",
    "gamification-redemptions":"shopping-bag",
    "gamification-ranking":"trophy",
    "gamification-achievements":"medal",
    "gamification-rules":"scroll-text",
    "gamification-limits":"shield-check",
    "gamification-telegram":"send"
  };
  const state = { loaded:false, loading:false, overview:null, students:[], products:[], redemptions:[], coins:[], achievements:[], rules:[], limits:[], activeTab:"all" };
  const fmt = new Intl.NumberFormat('uz-UZ');
  const money = (n)=>`${fmt.format(Number(n||0))} so'm`;
  const esc = (v)=>String(v ?? '').replace(/[&<>'"]/g,(m)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const num = (v)=>fmt.format(Number(v||0));
  async function api(path, options={}){
    const res = await fetch(path,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
    const data = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.message || 'API xatolik');
    return data;
  }
  function toast(msg,type='success'){
    document.querySelectorAll('.gami-toast').forEach(x=>x.remove());
    const el=document.createElement('div'); el.className=`gami-toast ${type}`; el.textContent=msg; document.body.append(el);
    setTimeout(()=>el.remove(),3200);
  }
  function ensureShell(){
    const side=document.querySelector('.side-nav');
    if(side && !side.querySelector('[data-view="gamification-dashboard"]')){
      const btn=document.createElement('button');
      btn.type='button'; btn.dataset.view='gamification-dashboard'; btn.dataset.route='/admin/gamification'; btn.dataset.lucideIcon='trophy'; btn.innerHTML='<i data-lucide="trophy"></i>Gamification';
      const before=side.querySelector('[data-view="reports"]') || side.querySelector('[data-view="settings"]');
      side.insertBefore(btn,before || null);
    }
    const sidebar=document.querySelector('.sidebar');
    if(sidebar && !sidebar.querySelector('[data-subnav="gamification"]')){
      const sub=document.createElement('div'); sub.className='side-subnav'; sub.dataset.subnav='gamification'; sub.hidden=true;
      sub.innerHTML=VIEWS.map(v=>`<button type="button" data-view="${v}"><i data-lucide="${ICONS[v]}"></i>${LABELS[v]}</button>`).join('');
      const settings=sidebar.querySelector('[data-subnav="settings"]'); sidebar.insertBefore(sub,settings || sidebar.querySelector('.sidebar-footer'));
    }
    const content=document.querySelector('.content');
    if(content){
      VIEWS.forEach(v=>{ if(!document.getElementById(v)){ const s=document.createElement('section'); s.className='view gamification-pro-view'; s.id=v; s.innerHTML='<div class="gami-pro-page" data-gami-page="'+v+'"></div>'; content.append(s); } });
    }
    if(!document.querySelector('[data-gami-modal]')){
      const m=document.createElement('div'); m.className='gami-modal'; m.hidden=true; m.dataset.gamiModal='true';
      m.innerHTML='<div class="gami-modal-card"><div class="gami-modal-head"><h2 data-gami-modal-title></h2><button type="button" data-gami-modal-close>×</button></div><form data-gami-modal-form></form></div>';
      document.body.append(m);
    }
    window.lucide?.createIcons({attrs:{'stroke-width':1.8}});
  }
  async function load(force=false){
    if(state.loading || (state.loaded && !force)) return;
    state.loading=true;
    try{
      const [overview, students, products, redemptions, coins, achievements, rules, limits] = await Promise.allSettled([
        api('/api/app/gamification/overview'),
        api('/api/students?limit=300'),
        api('/api/app/student-app/rewards'),
        api('/api/app/student-app/reward-redemptions'),
        api('/api/app/student-app/coin-transactions'),
        api('/api/app/student-app/achievements'),
        api('/api/app/student-app/gamification-rules'),
        api('/api/app/student-app/teacher-coin-limits')
      ]);
      const val=(r,fb)=>r.status==='fulfilled'?r.value:fb;
      state.overview=val(overview,{});
      state.students=val(students,{items:[]}).items || [];
      state.products=val(products,{items:[]}).items || [];
      state.redemptions=val(redemptions,{items:[]}).items || [];
      state.coins=val(coins,{items:[]}).items || [];
      state.achievements=val(achievements,{items:[]}).items || [];
      state.rules=val(rules,{items:[]}).items || [];
      state.limits=val(limits,{items:[]}).items || [];
      state.loaded=true;
    }catch(e){ toast(e.message,'error'); }
    finally{state.loading=false;}
  }
  function shell(title,desc,actions=''){
    return `<div class="gami-hero"><span><i data-lucide="trophy"></i> Eduka Gamification Pro</span><h1>${esc(title)}</h1><p>${esc(desc)}</p><div class="gami-hero-actions">${actions}<button type="button" class="secondary" data-gami-action="refresh">Yangilash</button></div></div>`;
  }
  function kpi(label,value,hint,icon='sparkles'){
    return `<article class="gami-kpi"><i data-lucide="${icon}"></i><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(hint||'')}</small></article>`;
  }
  function empty(text){ return `<div class="gami-empty">${esc(text)}</div>`; }
  function table(headers, rows){ return `<div class="gami-table-wrap"><table class="gami-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}">${empty('Hozircha ma\'lumot yo\'q')}</td></tr>`}</tbody></table></div>`; }
  function render(){
    ensureShell();
    const active=document.querySelector('.view.active')?.id;
    const view=VIEWS.includes(active)?active:'gamification-dashboard';
    const node=document.querySelector(`[data-gami-page="${view}"]`); if(!node) return;
    if(!state.loaded){ node.innerHTML=shell('Gamification yuklanmoqda','Coin, sovg\'alar, reyting va yutuqlar ma\'lumotlari olinmoqda...')+empty('Yuklanmoqda...'); load().then(render); return; }
    const summary=state.overview?.summary || {};
    const top=state.overview?.topStudents || state.students.slice().sort((a,b)=>Number(b.coins||0)-Number(a.coins||0)).slice(0,10);
    if(view==='gamification-dashboard'){
      node.innerHTML=shell('Gamification boshqaruvi','O\'qituvchi coin beradi, o\'quvchi coin evaziga sovg\'a oladi, admin esa hammasini nazorat qiladi.',`<button type="button" data-view="gamification-award">Coin berish</button><button type="button" data-view="gamification-products" class="secondary">Sovg\'a qo\'shish</button>`)+
      `<section class="gami-kpis">${kpi('Jami coin',num(summary.total_coins),'Barcha o\'quvchilar balansi','coins')}${kpi('Aktiv sovg\'alar',num(summary.active_products),'Do\'konda ko\'rinadi','gift')}${kpi('Kutilayotgan so\'rov',num(summary.pending_redemptions),'Admin tasdiqlashi kerak','shopping-bag')}${kpi('Bugungi coinlar',num(summary.today_coin_events),'Bugungi rag\'batlar','sparkles')}</section>`+
      `<section class="gami-grid"><article class="gami-panel"><div class="gami-panel-head"><div><h2>Top reyting</h2><p>Coin bo\'yicha eng faol o\'quvchilar</p></div><button class="gami-mini-btn" data-view="gamification-ranking">Hammasi</button></div>${top.length?top.map((s,i)=>`<div class="gami-rank-row ${i<3?'top':''}"><span class="gami-rank-num">${i+1}</span><div><b>${esc(s.full_name)}</b><br><small>${esc(s.phone||'')}</small></div><strong style="margin-left:auto">${num(s.coins)} 🪙</strong></div>`).join(''):empty('Reyting hali yo\'q')}</article><article class="gami-panel"><div class="gami-panel-head"><div><h2>Tezkor amallar</h2><p>Admin va o\'qituvchi ishlatadigan actionlar</p></div></div><div class="gami-actions"><button data-view="gamification-award">Coin berish</button><button data-view="gamification-products">Mahsulotlar</button><button data-view="gamification-redemptions">So\'rovlar</button><button data-view="gamification-limits">Limitlar</button><button data-view="gamification-telegram">Telegram</button></div></article></section>`;
    }
    if(view==='gamification-award') renderAward(node);
    if(view==='gamification-products') renderProducts(node);
    if(view==='gamification-redemptions') renderRedemptions(node);
    if(view==='gamification-ranking') renderRanking(node);
    if(view==='gamification-achievements') renderAchievements(node);
    if(view==='gamification-rules') renderRules(node);
    if(view==='gamification-limits') renderLimits(node);
    if(view==='gamification-telegram') renderTelegram(node);
    window.lucide?.createIcons({attrs:{'stroke-width':1.8}});
  }
  function renderAward(node){
    const options=state.students.map(s=>`<option value="${s.id}">${esc(s.full_name)} — ${esc(s.phone||'')}</option>`).join('');
    node.innerHTML=shell('O\'quvchiga coin berish','Coin berilganda tarix yoziladi, balans yangilanadi va Telegram ulangan bo\'lsa xabar yuboriladi.')+
    `<section class="gami-grid"><article class="gami-award-card"><form data-gami-award-form class="gami-form-grid"><label><span>O\'quvchi</span><select name="student_id" required><option value="">Tanlang</option>${options}</select></label><label><span>Coin miqdori</span><input type="number" name="amount" value="50" min="1" max="10000" required></label><label><span>Sabab</span><select name="reason"><option>Darsda faol qatnashdi</option><option>Uyga vazifani bajardi</option><option>A\'lo baho oldi</option><option>Davomat yaxshi</option><option>Musobaqada yutdi</option><option>Qo\'shimcha rag\'bat</option></select></label><label><span>Izoh</span><input name="note" placeholder="Masalan: matematika darsida faol bo\'ldi"></label><div style="grid-column:1/-1"><button class="gami-primary" type="submit">Coin berish</button></div></form></article><article class="gami-panel"><h2>So\'nggi coinlar</h2>${table(['O\'quvchi','Miqdor','Sabab','Manba'], state.coins.slice(0,8).map(c=>`<tr><td>${esc(studentName(c.student_id))}</td><td>${num(c.amount)} 🪙</td><td>${esc(c.reason||'-')}</td><td>${esc(c.source||'-')}</td></tr>`).join(''))}</article></section>`;
  }
  function renderProducts(node){
    node.innerHTML=shell('Sovg\'alar / mahsulotlar','Student App do\'konida ko\'rinadigan mahsulotlarni boshqaring.',`<button type="button" data-gami-action="product-new">Mahsulot qo\'shish</button>`)+
    `<section class="gami-product-grid">${state.products.length?state.products.map(p=>`<article class="gami-product"><div class="gami-product-img">${p.image_url?`<img src="${esc(p.image_url)}" alt="">`:'<i data-lucide="gift"></i>'}</div><h3>${esc(p.title)}</h3><p>${esc(p.description||'Tavsif kiritilmagan')}</p><span class="gami-price">🪙 ${num(p.coin_price)}</span><p><small>Ombor: ${num(p.stock)} • ${esc(p.category||'Boshqalar')} • ${esc(p.status||'active')}</small></p><div class="gami-actions"><button data-gami-action="product-edit" data-id="${p.id}">Tahrirlash</button><button class="danger" data-gami-action="product-delete" data-id="${p.id}">O\'chirish</button></div></article>`).join(''):empty('Mahsulot yo\'q. Birinchi sovg\'ani qo\'shing.')}</section>`;
  }
  function renderRedemptions(node){
    const rows=state.redemptions.map(r=>`<tr><td>${esc(studentName(r.student_id)||r.student_id)}</td><td>${esc(r.product_title||'-')}</td><td>${num(r.coin_price)} 🪙</td><td>${esc(r.status)}</td><td><div class="gami-actions"><button class="success" data-gami-action="redemption" data-do="approve" data-id="${r.id}">Tasdiqlash</button><button data-gami-action="redemption" data-do="complete" data-id="${r.id}">Berildi</button><button class="danger" data-gami-action="redemption" data-do="reject" data-id="${r.id}">Rad</button></div></td></tr>`).join('');
    node.innerHTML=shell('Sovg\'a so\'rovlari','O\'quvchilar olmoqchi bo\'lgan sovg\'alarni tasdiqlang yoki rad eting.')+`<section class="gami-panel">${table(['O\'quvchi','Sovg\'a','Coin','Status','Amallar'],rows)}</section>`;
  }
  function renderRanking(node){
    const sorted=state.students.slice().sort((a,b)=>Number(b.coins||0)-Number(a.coins||0));
    node.innerHTML=shell('Reyting','Coin bo\'yicha o\'quvchilar reytingi.')+`<section class="gami-panel">${sorted.length?sorted.map((s,i)=>`<div class="gami-rank-row ${i<3?'top':''}"><span class="gami-rank-num">${i+1}</span><div><b>${esc(s.full_name)}</b><br><small>${esc(s.phone||'')}</small></div><strong style="margin-left:auto">${num(s.coins)} 🪙</strong></div>`).join(''):empty('Reyting uchun o\'quvchi yo\'q')}</section>`;
  }
  function renderAchievements(node){
    node.innerHTML=shell('Yutuqlar','O\'quvchi medallari va achievement yozuvlari.',`<button type="button" data-gami-action="achievement-new">Yutuq qo\'shish</button>`)+`<section class="gami-panel">${table(['O\'quvchi','Yutuq','Progress','Holat'], state.achievements.map(a=>`<tr><td>${esc(studentName(a.student_id)||a.student_id)}</td><td>${esc(a.title||a.key)}</td><td>${num(a.progress)}/${num(a.target)}</td><td>${a.completed_at?'Tugallangan':'Jarayonda'}</td></tr>`).join(''))}</section>`;
  }
  function renderRules(node){
    node.innerHTML=shell('Coin qoidalari','O\'qituvchilar coin berishda foydalanadigan standart sabablar.',`<button type="button" data-gami-action="rule-new">Qoida qo\'shish</button>`)+`<section class="gami-panel">${table(['Nomi','Sabab key','Coin','Status','Amallar'], state.rules.map(r=>`<tr><td>${esc(r.title)}</td><td>${esc(r.reason_key||'-')}</td><td>${num(r.amount)} 🪙</td><td>${esc(r.status)}</td><td><div class="gami-actions"><button data-gami-action="rule-edit" data-id="${r.id}">Tahrirlash</button><button class="danger" data-gami-action="rule-delete" data-id="${r.id}">O\'chirish</button></div></td></tr>`).join(''))}</section>`;
  }
  function renderLimits(node){
    node.innerHTML=shell('O\'qituvchi coin limiti','Har bir o\'qituvchi kunlik va oylik qancha coin bera olishini boshqaring.',`<button type="button" data-gami-action="limit-new">Limit qo\'shish</button>`)+`<section class="gami-panel">${table(['Teacher ID','Kunlik','Oylik','Status','Amallar'], state.limits.map(l=>`<tr><td>${esc(l.teacher_id||'-')}</td><td>${num(l.daily_limit)}</td><td>${num(l.monthly_limit)}</td><td>${esc(l.status)}</td><td><div class="gami-actions"><button data-gami-action="limit-edit" data-id="${l.id}">Tahrirlash</button><button class="danger" data-gami-action="limit-delete" data-id="${l.id}">O\'chirish</button></div></td></tr>`).join(''))}</section>`;
  }
  function renderTelegram(node){
    node.innerHTML=shell('Telegram notification','Coin, sovg\'a, to\'lov va dars eslatmalarini bot orqali yuborish uchun nazorat markazi.')+`<section class="gami-grid"><article class="gami-panel"><h2>Avtomatik xabarlar</h2><div class="gami-actions"><button>Coin berilganda</button><button>Sovg\'a tasdiqlanganda</button><button>To\'lov qilinganda</button><button>Dars eslatmasi</button><button>Qarzdorlik eslatmasi</button></div><p>Bu xabarlar backendda tayyor eventlar orqali ishlaydi. Telegram ID ulangan o\'quvchilarga yuboriladi.</p></article><article class="gami-panel"><h2>QR receipt linking</h2><p>Chekdagi QR orqali /start receipt_TOKEN ochiladi, o\'quvchi Telegram ID profilga ulanadi va to\'lov xabari botdan keladi.</p></article></section>`;
  }
  function studentName(id){ return (state.students.find(s=>String(s.id)===String(id))||{}).full_name || ''; }
  function modal(title, body, onSubmit){
    const m=document.querySelector('[data-gami-modal]'), f=document.querySelector('[data-gami-modal-form]');
    document.querySelector('[data-gami-modal-title]').textContent=title; f.innerHTML=body; m.hidden=false; f.onsubmit=async(e)=>{e.preventDefault(); await onSubmit(Object.fromEntries(new FormData(f).entries())); m.hidden=true;};
  }
  function closeModal(){ const m=document.querySelector('[data-gami-modal]'); if(m) m.hidden=true; }
  function productForm(item={}){ return `<div class="gami-form-grid"><label><span>Mahsulot nomi</span><input name="title" required value="${esc(item.title||'')}"></label><label><span>Coin narxi</span><input type="number" name="coin_price" required value="${esc(item.coin_price||0)}"></label><label><span>Ombor</span><input type="number" name="stock" value="${esc(item.stock||0)}"></label><label><span>Kategoriya</span><input name="category" value="${esc(item.category||'Boshqalar')}"></label><label><span>Rasm URL</span><input name="image_url" value="${esc(item.image_url||'')}"></label><label><span>Status</span><select name="status"><option value="active">active</option><option value="draft">draft</option><option value="sold_out">sold_out</option></select></label><label style="grid-column:1/-1"><span>Tavsif</span><textarea name="description">${esc(item.description||'')}</textarea></label><div style="grid-column:1/-1"><button class="gami-primary" type="submit">Saqlash</button></div></div>`; }
  function ruleForm(item={}){ return `<div class="gami-form-grid"><label><span>Nomi</span><input name="title" required value="${esc(item.title||'')}"></label><label><span>Reason key</span><input name="reason_key" value="${esc(item.reason_key||'')}"></label><label><span>Coin</span><input type="number" name="amount" value="${esc(item.amount||10)}"></label><label><span>Status</span><select name="status"><option value="active">active</option><option value="draft">draft</option></select></label><label style="grid-column:1/-1"><span>Tavsif</span><textarea name="description">${esc(item.description||'')}</textarea></label><div style="grid-column:1/-1"><button class="gami-primary" type="submit">Saqlash</button></div></div>`; }
  function limitForm(item={}){ return `<div class="gami-form-grid"><label><span>Teacher ID</span><input type="number" name="teacher_id" value="${esc(item.teacher_id||'')}"></label><label><span>Kunlik limit</span><input type="number" name="daily_limit" value="${esc(item.daily_limit||100)}"></label><label><span>Oylik limit</span><input type="number" name="monthly_limit" value="${esc(item.monthly_limit||1000)}"></label><label><span>Status</span><select name="status"><option value="active">active</option><option value="blocked">blocked</option></select></label><div style="grid-column:1/-1"><button class="gami-primary" type="submit">Saqlash</button></div></div>`; }
  async function handleAction(btn){
    const a=btn.dataset.gamiAction;
    if(a==='refresh'){ state.loaded=false; await load(true); render(); toast('Yangilandi'); return; }
    if(a==='product-new'||a==='product-edit'){
      const item=state.products.find(x=>String(x.id)===String(btn.dataset.id))||{}; modal(item.id?'Mahsulotni tahrirlash':'Mahsulot qo\'shish', productForm(item), async(data)=>{ if(item.id) await api(`/api/app/student-app/rewards/${item.id}`,{method:'PUT',body:JSON.stringify(data)}); else await api('/api/app/student-app/rewards',{method:'POST',body:JSON.stringify(data)}); state.loaded=false; await load(true); render(); toast('Mahsulot saqlandi'); }); return;
    }
    if(a==='product-delete'){ if(!confirm('Mahsulot o\'chirilsinmi?')) return; await api(`/api/app/student-app/rewards/${btn.dataset.id}`,{method:'DELETE'}); state.loaded=false; await load(true); render(); toast('Mahsulot o\'chirildi'); return; }
    if(a==='redemption'){ await api(`/api/app/gamification/redemptions/${btn.dataset.id}/${btn.dataset.do}`,{method:'POST',body:'{}'}); state.loaded=false; await load(true); render(); toast('So\'rov yangilandi'); return; }
    if(a==='rule-new'||a==='rule-edit'){
      const item=state.rules.find(x=>String(x.id)===String(btn.dataset.id))||{}; modal(item.id?'Qoidani tahrirlash':'Qoida qo\'shish', ruleForm(item), async(data)=>{ if(item.id) await api(`/api/app/student-app/gamification-rules/${item.id}`,{method:'PUT',body:JSON.stringify(data)}); else await api('/api/app/student-app/gamification-rules',{method:'POST',body:JSON.stringify(data)}); state.loaded=false; await load(true); render(); toast('Qoida saqlandi'); }); return;
    }
    if(a==='rule-delete'){ if(!confirm('Qoida o\'chirilsinmi?')) return; await api(`/api/app/student-app/gamification-rules/${btn.dataset.id}`,{method:'DELETE'}); state.loaded=false; await load(true); render(); toast('Qoida o\'chirildi'); return; }
    if(a==='limit-new'||a==='limit-edit'){
      const item=state.limits.find(x=>String(x.id)===String(btn.dataset.id))||{}; modal(item.id?'Limitni tahrirlash':'Limit qo\'shish', limitForm(item), async(data)=>{ if(item.id) await api(`/api/app/student-app/teacher-coin-limits/${item.id}`,{method:'PUT',body:JSON.stringify(data)}); else await api('/api/app/student-app/teacher-coin-limits',{method:'POST',body:JSON.stringify(data)}); state.loaded=false; await load(true); render(); toast('Limit saqlandi'); }); return;
    }
    if(a==='limit-delete'){ if(!confirm('Limit o\'chirilsinmi?')) return; await api(`/api/app/student-app/teacher-coin-limits/${btn.dataset.id}`,{method:'DELETE'}); state.loaded=false; await load(true); render(); toast('Limit o\'chirildi'); return; }
  }
  document.addEventListener('DOMContentLoaded',()=>{ensureShell(); render();});
  document.addEventListener('click', async(e)=>{
    const close=e.target.closest('[data-gami-modal-close]'); if(close){closeModal(); return;}
    const action=e.target.closest('[data-gami-action]'); if(action){ e.preventDefault(); try{ await handleAction(action); }catch(err){ toast(err.message,'error'); } return; }
    const viewBtn=e.target.closest('[data-view]'); if(viewBtn){ setTimeout(()=>{ const active=document.querySelector('.view.active')?.id; const sub=document.querySelector('[data-subnav="gamification"]'); if(sub) sub.hidden=!VIEWS.includes(active); if(VIEWS.includes(active)) { load().then(render); } },30); }
  });
  document.addEventListener('submit', async(e)=>{
    const form=e.target.closest('[data-gami-award-form]'); if(!form) return; e.preventDefault();
    const data=Object.fromEntries(new FormData(form).entries());
    if(!data.student_id){ toast('O\'quvchini tanlang','error'); return; }
    try{ await api(`/api/app/gamification/students/${data.student_id}/coins`,{method:'POST',body:JSON.stringify(data)}); state.loaded=false; await load(true); render(); toast('Coin berildi'); }catch(err){toast(err.message,'error');}
  });
  window.edukaGamificationPro={reload:async()=>{state.loaded=false; await load(true); render();}};
})();
