/* EDUKA CRM Settings — stable controller. Tenant panel only; landing untouched. */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const ui={section:'general',data:null,loading:false,error:''};
  const NAV=[['general','settings','Umumiy'],['academic','graduation','O‘quv bo‘limi'],['attendance','calendar-check','Davomat'],['finance','coin','Moliya'],['receipt','receipt','Chek'],['center','room','Filial / markaz'],['integrations','link','Integratsiyalar']];

  const isRoute=()=>/\/app\/(settings|general-settings)\/?$/i.test(location.pathname);
  const token=()=>localStorage.getItem('eduka_center_token')||localStorage.getItem('token')||'';
  const bool=v=>v===true||String(v)==='true';
  const val=id=>($(id)?.value??'').trim();
  const chk=id=>!!$(id)?.checked;
  const notify=(msg,ok=true)=>{ try{ if(typeof toast==='function') toast(msg,ok); else console[ok?'log':'error'](msg); }catch(e){} };

  async function request(method,url,body){
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),15000);
    try{
      const headers={'Content-Type':'application/json'};
      const t=token(); if(t) headers.Authorization='Bearer '+t;
      const r=await fetch(url+(method==='GET'?(url.includes('?')?'&':'?')+'__ts='+Date.now():''),{
        method,headers,cache:'no-store',signal:ctrl.signal,body:body==null?undefined:JSON.stringify(body)
      });
      const text=await r.text();
      let d={}; try{ d=text?JSON.parse(text):{}; }catch(e){ throw new Error('Server JSON javob qaytarmadi'); }
      if(!r.ok) throw new Error(d?.error||('HTTP '+r.status));
      return d;
    } finally { clearTimeout(timer); }
  }

  function syncRoute(){
    try{ if(window.state) window.state.page='settings'; }catch(e){}
    if(location.pathname!='/app/settings') history.replaceState(history.state,'','/app/settings');
    $$('#sideNav [data-page]').forEach(x=>x.classList.toggle('active',x.dataset.page==='settings'));
  }

  function icon(name){ return `<span data-icon="${name}"></span>`; }
  function shell(inner){
    return `<div class="settings-v08">
      <aside class="settings-nav-v08">
        <div class="settings-nav-title"><small>MARKAZ SOZLAMALARI</small><h2>Boshqaruv</h2></div>
        ${NAV.map(([key,ic,label])=>`<button type="button" data-v08-section="${key}" class="${ui.section===key?'active':''}">${icon(ic)}${label}</button>`).join('')}
      </aside>
      <section class="settings-pane-v08">${inner}</section>
    </div>`;
  }
  function head(title,desc,save=true){return `<div class="settings-head-v08"><div><h1>${esc(title)}</h1><p>${esc(desc)}</p></div>${save?`<button class="settings-save-v08" type="button" data-v08-save="${ui.section}">Saqlash</button>`:''}</div>`}
  function field(label,id,value,type='text',extra=''){return `<label class="settings-field-v08"><span>${esc(label)}</span><input id="${id}" type="${type}" value="${esc(value)}" ${extra}></label>`}
  function select(label,id,value,opts){return `<label class="settings-field-v08"><span>${esc(label)}</span><select id="${id}">${opts.map(([v,t])=>`<option value="${esc(v)}" ${String(value)===String(v)?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`}
  function toggle(id,title,desc,on){return `<div class="toggle-row-v08"><div><b>${esc(title)}</b><p>${esc(desc)}</p></div><label class="switch-v08"><input id="${id}" type="checkbox" ${on?'checked':''}><i></i></label></div>`}
  function card(title,desc,body){return `<section class="settings-card-v08"><header><div><h3>${esc(title)}</h3>${desc?`<p>${esc(desc)}</p>`:''}</div></header>${body}</section>`}

  function general(){
    const c=ui.data.center||{},s=ui.data.sections?.general||{};
    return head('Umumiy sozlamalar','O‘quv markaz identifikatsiyasi va ish vaqtini boshqaring.')+
      `<div class="settings-summary-v08"><div><span>Subdomain</span><b>${esc(c.subdomain||'—')}</b></div><div><span>Tarif</span><b>${esc(c.tariff||'—')}</b></div><div><span>Holat</span><b>${esc(c.status||'—')}</b></div><div><span>Filiallar</span><b>${esc(c.branchesCount||1)}</b></div></div>`+
      card('Markaz ma’lumotlari','Topbar va CRM identifikatsiyasida ishlatiladi.',`<div class="settings-grid-v08">
        ${field('O‘quv markaz nomi','v08_name',c.name)}${field('Rahbar / egasi','v08_owner',c.ownerName)}${field('Telefon','v08_phone',c.ownerPhone)}${field('Email','v08_email',c.ownerEmail,'email')}
        <label class="settings-field-v08 wide"><span>Manzil</span><textarea id="v08_address" rows="3">${esc(s.address||'')}</textarea></label>${field('Logo URL','v08_logo',s.logo_url)}
      </div>`)+
      card('Ish vaqti','Jadval va avtomatik qoidalar uchun.',`<div class="settings-grid-v08">${field('Ish boshlanishi','v08_start',s.work_start||'09:00','time')}${field('Ish tugashi','v08_end',s.work_end||'18:00','time')}${select('Til','v08_lang',s.language||'uz',[['uz','O‘zbekcha'],['ru','Русский'],['en','English']])}${select('Vaqt zonasi','v08_tz',s.timezone||'Asia/Tashkent',[['Asia/Tashkent','Toshkent (UTC+5)'],['Europe/Istanbul','Istanbul'],['Asia/Almaty','Olmaota']])}</div>`);
  }
  function academic(){
    const s=ui.data.sections?.academic||{};
    return head('O‘quv bo‘limi','Talaba va guruhlar uchun akademik qoidalar.')+
      card('Talaba ma’lumotlari','Yangi talaba yaratish qoidalari.',toggle('v08_req_phone','Telefon raqamini majburiy qilish','Telefon kiritilmasa saqlashga ruxsat bermaydi.',bool(s.require_student_phone))+toggle('v08_req_birth','Tug‘ilgan sanani majburiy qilish','Profil uchun tug‘ilgan sana talab qilinadi.',bool(s.require_birth_date))+toggle('v08_req_parent','Ota-ona telefonini majburiy qilish','Ota-ona aloqa raqamini talab qiladi.',bool(s.require_parent_phone)))+
      card('Dars va guruh defaultlari','Yangi guruh boshlang‘ich qiymatlari.',`<div class="settings-grid-v08">${field('Dars davomiyligi (daqiqa)','v08_lesson',s.default_lesson_duration||90,'number','min="15" step="5"')}${field('Default guruh sig‘imi','v08_capacity',s.default_group_capacity||12,'number','min="1"')}</div>`)+
      card('Akademik ma’lumotlar','Mavjud modullar.',`<div class="settings-links-v08"><button class="settings-link-card" data-v08-go="courses"><div><b>Kurslar</b><p>Kurs, level va narxlar</p></div>${icon('arrow-up-right')}</button><button class="settings-link-card" data-v08-go="rooms"><div><b>Xonalar</b><p>Sig‘im va xonalar</p></div>${icon('arrow-up-right')}</button></div>`);
  }
  function attendance(){
    const s=ui.data.sections?.attendance||{};
    return head('Davomat sozlamalari','Davomat va avtomatik qoidalarni boshqaring.')+
      card('Asosiy funksionallik','Davomat biznes qoidalari.',toggle('v08_att_enabled','Davomat funksiyasini yoqish','Guruhda davomat belgilash.',bool(s.enabled))+toggle('v08_att_present','Default “hamma keldi”','Yangi sana ochilganda default holat.',bool(s.default_present))+toggle('v08_att_backfill','Oldingi sanalarga davomat','Oldingi dars kunlariga belgi qo‘yish.',bool(s.allow_backfill))+toggle('v08_att_remove','Ko‘p kelmaganlarni avtomatik chiqarish','Limitdan oshganda avtomatik qoida.',bool(s.auto_remove_after_absences)))+
      card('Limitlar','Davomat chegaralari.',`<div class="settings-grid-v08">${field('Kelmaslik limiti','v08_absence',s.absence_limit||3,'number','min="1"')}${field('Maksimal baho','v08_maxmark',s.max_mark||100,'number','min="1"')}</div>`);
  }
  function finance(){
    const s=ui.data.sections?.finance||{};
    return head('Moliya sozlamalari','To‘lov, qarzdorlik va pul oqimi qoidalari.')+
      card('Hisob-kitob','Asosiy moliyaviy parametrlar.',`<div class="settings-grid-v08">${select('Pul birligi','v08_currency',s.currency||'UZS',[['UZS','UZS — so‘m'],['USD','USD — dollar'],['TRY','TRY — lira']])}${field('Qarzdorlik limiti','v08_debt',s.debt_limit||0,'number','min="0"')}${field('Kunlik pul yechish vaqti','v08_withdraw',s.withdrawal_time||'00:00','time')}</div>`)+
      card('Biznes qoidalari','Moliya toggle’lari.',toggle('v08_transfer','Kassalararo transferni tasdiqlash','Transfer tasdiq bilan yakunlanadi.',bool(s.confirm_cashbox_transfer))+toggle('v08_cancel_note','Bekor qilishda izoh majburiy','Bekor qilish sababi talab qilinadi.',bool(s.cancellation_note_required))+toggle('v08_oldprice','Transferda eski kurs narxini saqlash','Guruh almashtirilganda eski narx saqlanadi.',bool(s.keep_old_course_price_on_transfer)));
  }
  function receipt(){
    const s=ui.data.sections?.receipt||{},c=ui.data.center||{};
    return head('Chek sozlamalari','Chek ko‘rinishi va maydonlarini boshqaring.')+
      `<div class="receipt-layout-v08"><div>${card('Dizayn va matn','Chek matnlari.',`<div class="settings-grid-v08">${field('Chek logo URL','v08_rlogo',s.logo_url||'')}<label class="settings-field-v08 wide"><span>Header matni</span><textarea id="v08_rheader" rows="2">${esc(s.header||'')}</textarea></label><label class="settings-field-v08 wide"><span>Footer matni</span><textarea id="v08_rfooter" rows="2">${esc(s.footer||'')}</textarea></label>${field('QR manzil','v08_qrurl',s.qr_url||'')}</div>`)}${card('Chek maydonlari','Kerakli maydonlarni tanlang.',toggle('v08_rphone','Markaz telefonini ko‘rsatish','Chek headerida.',bool(s.show_center_phone))+toggle('v08_sphone','Talaba telefonini ko‘rsatish','Talaba kontakti.',bool(s.show_student_phone))+toggle('v08_rgroup','Guruhni ko‘rsatish','Guruh nomi.',bool(s.show_group))+toggle('v08_rmethod','To‘lov usulini ko‘rsatish','Naqd/karta va boshqalar.',bool(s.show_payment_method))+toggle('v08_rqr','QR kodni ko‘rsatish','QR blok.',bool(s.show_qr)))}</div><div class="receipt-preview-v08"><div class="receipt-paper-v08"><img class="receipt-logo-v08" src="${esc(s.logo_url||'/assets/logo-icon.png')}"><h4>${esc(c.name||'EDUKA')}</h4><p>${esc(s.header||c.ownerPhone||'To‘lov cheki')}</p><div class="receipt-line-v08"><span>Talaba</span><b>Ali Valiyev</b></div><div class="receipt-line-v08 receipt-total-v08"><span>Jami</span><b>500 000 ${esc(ui.data.sections?.finance?.currency||'UZS')}</b></div><div class="receipt-footer-v08">${esc(s.footer||'EDUKA CRM orqali yaratildi')}</div></div></div></div>`;
  }
  function center(){
    const c=ui.data.center||{},g=ui.data.sections?.general||{};
    return head('Filial / markaz','Joriy tenant identifikatsiyasi.',false)+`<div class="settings-summary-v08"><div><span>Markaz</span><b>${esc(c.name||'—')}</b></div><div><span>Subdomain</span><b>${esc(c.subdomain||'—')}</b></div><div><span>Tarif</span><b>${esc(c.tariff||'—')}</b></div><div><span>Filial soni</span><b>${esc(c.branchesCount||1)}</b></div></div>`+card('Markaz ma’lumotlari','Filiallar alohida modulda boshqariladi.',`<div class="settings-grid-v08">${field('Markaz nomi','v08_center_name',c.name,'text','disabled')}${field('Telefon','v08_center_phone',c.ownerPhone,'text','disabled')}<label class="settings-field-v08 wide"><span>Manzil</span><textarea disabled rows="3">${esc(g.address||'Manzil kiritilmagan')}</textarea></label></div>`);
  }
  function integrations(){
    const s=ui.data.sections?.integrations||{}; const cards=[['telegram','TG','Telegram Bot'],['sms','SMS','SMS provayder'],['google_sheets','GS','Google Sheets'],['click','CL','Click'],['payme','PM','Payme']];
    return head('Integratsiyalar','Tashqi servislarni yoqing yoki o‘chiring.')+`<div class="integration-grid-v08">${cards.map(([k,a,n])=>`<div class="integration-card-v08"><div class="integration-top"><div class="integration-brand"><span class="integration-logo">${a}</span><b>${n}</b></div><label class="switch-v08"><input id="v08_int_${k}" type="checkbox" ${bool(s[k+'_enabled'])?'checked':''}><i></i></label></div><p>Integratsiya holatini boshqaring.</p></div>`).join('')}</div>`;
  }

  function render(){
    if(!isRoute()) return;
    syncRoute();
    const root=$('#content'); if(!root) return;
    if(ui.loading && !ui.data){ root.innerHTML='<div class="settings-toast-note">Sozlamalar yuklanmoqda...</div>'; return; }
    if(ui.error && !ui.data){ root.innerHTML=`<div class="settings-toast-note"><b>Sozlamalarni yuklab bo‘lmadi</b><br>${esc(ui.error)}<br><br><button type="button" data-v08-retry class="settings-save-v08">Qayta urinish</button></div>`; return; }
    if(!ui.data){ root.innerHTML='<div class="settings-toast-note">Sozlamalar yuklanmoqda...</div>'; return; }
    const fn={general,academic,attendance,finance,receipt,center,integrations}[ui.section]||general;
    root.innerHTML=shell(fn());
    try{ if(typeof renderIcons==='function') renderIcons(); }catch(e){ console.error('SETTINGS_ICONS',e); }
  }

  async function load(force=false){
    if(ui.loading&&!force) return;
    ui.loading=true; ui.error=''; render();
    try{
      const d=await request('GET','/api/app/settings-v2');
      if(!d?.ok) throw new Error(d?.error||'Noma’lum xatolik');
      ui.data=d;
    }catch(e){ ui.error=e?.name==='AbortError'?'So‘rov vaqti tugadi':(e?.message||'Sozlamalarni yuklab bo‘lmadi'); }
    finally{ ui.loading=false; render(); }
  }

  async function save(section){
    let payload={};
    if(section==='general') payload={name:val('#v08_name'),ownerName:val('#v08_owner'),ownerPhone:val('#v08_phone'),ownerEmail:val('#v08_email'),address:val('#v08_address'),logoUrl:val('#v08_logo'),workStart:val('#v08_start'),workEnd:val('#v08_end'),language:val('#v08_lang'),timezone:val('#v08_tz')};
    if(section==='academic') payload={default_lesson_duration:val('#v08_lesson'),require_student_phone:chk('#v08_req_phone'),require_birth_date:chk('#v08_req_birth'),require_parent_phone:chk('#v08_req_parent'),default_group_capacity:val('#v08_capacity')};
    if(section==='attendance') payload={enabled:chk('#v08_att_enabled'),default_present:chk('#v08_att_present'),allow_backfill:chk('#v08_att_backfill'),auto_remove_after_absences:chk('#v08_att_remove'),absence_limit:val('#v08_absence'),max_mark:val('#v08_maxmark')};
    if(section==='finance') payload={currency:val('#v08_currency'),debt_limit:val('#v08_debt'),confirm_cashbox_transfer:chk('#v08_transfer'),cancellation_note_required:chk('#v08_cancel_note'),withdrawal_time:val('#v08_withdraw'),keep_old_course_price_on_transfer:chk('#v08_oldprice')};
    if(section==='receipt') payload={logo_url:val('#v08_rlogo'),header:val('#v08_rheader'),footer:val('#v08_rfooter'),show_center_phone:chk('#v08_rphone'),show_student_phone:chk('#v08_sphone'),show_group:chk('#v08_rgroup'),show_payment_method:chk('#v08_rmethod'),show_qr:chk('#v08_rqr'),qr_url:val('#v08_qrurl')};
    if(section==='integrations') payload={telegram_enabled:chk('#v08_int_telegram'),sms_enabled:chk('#v08_int_sms'),google_sheets_enabled:chk('#v08_int_google_sheets'),click_enabled:chk('#v08_int_click'),payme_enabled:chk('#v08_int_payme')};
    const btn=$(`[data-v08-save="${section}"]`); if(btn){btn.disabled=true;btn.textContent='Saqlanmoqda...';}
    try{ const r=await request('PATCH','/api/app/settings-v2/'+section,payload); if(!r?.ok) throw new Error(r?.error||'Saqlash xatoligi'); notify('Sozlamalar saqlandi'); await load(true); }
    catch(e){ notify(e?.message||'Saqlashda xatolik',false); if(btn){btn.disabled=false;btn.textContent='Saqlash';} }
  }

  function openSettings(force=true){
    syncRoute(); ui.section='general'; render(); if(force||!ui.data) load(force);
  }
  window.EDUKA_SETTINGS_OPEN=openSettings;

  document.addEventListener('click',e=>{
    const side=e.target.closest('#sideNav [data-page="settings"], [data-shell-settings]');
    if(side){ e.preventDefault(); e.stopImmediatePropagation(); openSettings(false); return; }
    if(!isRoute()) return;
    const sec=e.target.closest('[data-v08-section]'); if(sec){ e.preventDefault(); ui.section=sec.dataset.v08Section; render(); return; }
    const retry=e.target.closest('[data-v08-retry]'); if(retry){ e.preventDefault(); load(true); return; }
    const saveBtn=e.target.closest('[data-v08-save]'); if(saveBtn){ e.preventDefault(); save(saveBtn.dataset.v08Save); return; }
    const goBtn=e.target.closest('[data-v08-go]'); if(goBtn&&typeof go==='function'){ e.preventDefault(); go(goBtn.dataset.v08Go); return; }
  },true);

  window.addEventListener('popstate',()=>{ if(isRoute()) openSettings(false); });
  function boot(){ if(isRoute()){ syncRoute(); render(); load(false); setTimeout(()=>{if(isRoute())render()},900); } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
