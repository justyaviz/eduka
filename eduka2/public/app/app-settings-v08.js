/* EDUKA CRM v0.8 — Settings Hub. Tenant admin only; landing untouched. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const safe=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const ui={section:'general',data:null,loading:false,rendering:false};

  const NAV=[
    ['general','settings','Umumiy'],
    ['academic','graduation','O‘quv bo‘limi'],
    ['attendance','calendar-check','Davomat'],
    ['finance','coin','Moliya'],
    ['receipt','receipt','Chek'],
    ['center','room','Filial / markaz'],
    ['integrations','link','Integratsiyalar']
  ];

  const isSettingsRoute=()=>{
    const p=(window.state?.page||'').toLowerCase();
    const path=location.pathname.toLowerCase();
    return p==='settings'||p==='general-settings'||path.endsWith('/app/settings')||path.endsWith('/app/general-settings');
  };
  const b=v=>String(v)==='true'||v===true;
  const v=(id)=>($(id)?.value??'').trim();
  const checked=(id)=>!!$(id)?.checked;

  async function load(){
    if(ui.loading)return;ui.loading=true;
    const d=await API.get('/api/app/settings-v2',{ok:false});
    ui.loading=false;
    if(!d?.ok){toast(d?.error||'Sozlamalarni yuklab bo‘lmadi',false);return}
    ui.data=d;render();
  }

  function shell(inner){
    return `<div class="settings-v08">
      <aside class="settings-nav-v08">
        <div class="settings-nav-title"><small>MARKAZ SOZLAMALARI</small><h2>Boshqaruv</h2></div>
        ${NAV.map(([key,icon,label])=>`<button type="button" data-v08-section="${key}" class="${ui.section===key?'active':''}"><span data-icon="${icon}"></span>${label}</button>`).join('')}
      </aside>
      <section class="settings-pane-v08">${inner}</section>
    </div>`;
  }
  function head(title,desc,save=true){return `<div class="settings-head-v08"><div><h1>${title}</h1><p>${desc}</p></div>${save?`<button class="settings-save-v08" type="button" data-v08-save="${ui.section}">Saqlash</button>`:''}</div>`}
  function field(label,id,value,type='text',extra=''){return `<label class="settings-field-v08"><span>${label}</span><input id="${id}" type="${type}" value="${safe(value??'')}" ${extra}></label>`}
  function select(label,id,value,opts){return `<label class="settings-field-v08"><span>${label}</span><select id="${id}">${opts.map(([val,txt])=>`<option value="${safe(val)}" ${String(value)===String(val)?'selected':''}>${safe(txt)}</option>`).join('')}</select></label>`}
  function toggle(id,title,desc,on){return `<div class="toggle-row-v08"><div><b>${safe(title)}</b><p>${safe(desc)}</p></div><label class="switch-v08"><input id="${id}" type="checkbox" ${on?'checked':''}><i></i></label></div>`}
  function card(title,desc,body){return `<section class="settings-card-v08"><header><div><h3>${title}</h3>${desc?`<p>${desc}</p>`:''}</div></header>${body}</section>`}

  function general(){
    const c=ui.data.center||{},s=ui.data.sections?.general||{};
    return head('Umumiy sozlamalar','O‘quv markaz identifikatsiyasi va ish vaqtini boshqaring.')+
      `<div class="settings-summary-v08"><div><span>Subdomain</span><b>${safe(c.subdomain||'—')}</b></div><div><span>Tarif</span><b>${safe(c.tariff||'—')}</b></div><div><span>Holat</span><b>${safe(c.status||'—')}</b></div><div><span>Filiallar</span><b>${safe(c.branchesCount||1)}</b></div></div>`+
      card('Markaz ma’lumotlari','Bu ma’lumotlar topbar va CRM identifikatsiyasida ishlatiladi.',`<div class="settings-grid-v08">
        ${field('O‘quv markaz nomi','#v08_name',c.name)}${field('Rahbar / egasi','#v08_owner',c.ownerName)}${field('Telefon','#v08_phone',c.ownerPhone)}${field('Email','#v08_email',c.ownerEmail,'email')}
        <label class="settings-field-v08 wide"><span>Manzil</span><textarea id="v08_address" rows="3">${safe(s.address||'')}</textarea></label>
        ${field('Logo URL','#v08_logo',s.logo_url)}
      </div>`)+
      card('Ish vaqti','Jadval va avtomatik biznes qoidalari uchun asosiy vaqt.',`<div class="settings-grid-v08">${field('Ish boshlanishi','#v08_start',s.work_start||'09:00','time')}${field('Ish tugashi','#v08_end',s.work_end||'18:00','time')}${select('Til','#v08_lang',s.language||'uz',[['uz','O‘zbekcha'],['ru','Русский'],['en','English']])}${select('Vaqt zonasi','#v08_tz',s.timezone||'Asia/Tashkent',[['Asia/Tashkent','Toshkent (UTC+5)'],['Europe/Istanbul','Istanbul'],['Asia/Almaty','Olmaota']])}</div>`);
  }

  function academic(){const s=ui.data.sections?.academic||{};return head('O‘quv bo‘limi','Talaba va guruhlar uchun asosiy akademik qoidalar.')+
    `<div class="settings-toast-note">Videodagi yangi Edutizim konsepti bo‘yicha kurslar, darajalar, xonalar va talabalar formasi shu markazdan boshqariladi.</div>`+
    card('Talaba ma’lumotlari','Yangi talaba yaratishda qaysi maydonlar majburiy bo‘lishini belgilang.',
      toggle('#v08_req_phone','Telefon raqamini majburiy qilish','Talaba qo‘shishda telefon kiritilmasa saqlashga ruxsat bermaydi.',b(s.require_student_phone))+
      toggle('#v08_req_birth','Tug‘ilgan sanani majburiy qilish','O‘quvchi profili uchun tug‘ilgan sana talab qilinadi.',b(s.require_birth_date))+
      toggle('#v08_req_parent','Ota-ona telefonini majburiy qilish','Voyaga yetmagan o‘quvchilar uchun aloqa raqami.',b(s.require_parent_phone)))+
    card('Dars va guruh defaultlari','Yangi guruh yaratishda ishlatiladigan boshlang‘ich qiymatlar.',`<div class="settings-grid-v08">${field('Dars davomiyligi (daqiqa)','#v08_lesson',s.default_lesson_duration||90,'number','min="15" step="5"')}${field('Default guruh sig‘imi','#v08_capacity',s.default_group_capacity||12,'number','min="1"')}</div>`)+
    card('Akademik ma’lumotlar','Mavjud EDUKA modullarini shu yerdan boshqaring.',`<div class="settings-links-v08"><button class="settings-link-card" data-v08-go="courses"><div><b>Kurslar</b><p>Narx, davomiylik va kurslar</p></div><span data-icon="arrow-up-right"></span></button><button class="settings-link-card" data-v08-go="rooms"><div><b>Xonalar</b><p>Sig‘im va o‘quv xonalari</p></div><span data-icon="arrow-up-right"></span></button></div>`);
  }

  function attendance(){const s=ui.data.sections?.attendance||{};return head('Davomat sozlamalari','Davomatni belgilash va avtomatik qoidalarni boshqaring.')+
    card('Asosiy funksionallik','Edutizim videosidagi attendance business-rule konsepti.',
      toggle('#v08_att_enabled','Davomat funksiyasini yoqish','Guruhlar ichida davomat belgilash imkoniyati.',b(s.enabled))+
      toggle('#v08_att_present','Default “hamma keldi”','Yangi sana ochilganda barcha talabalarni kelgan deb belgilaydi.',b(s.default_present))+
      toggle('#v08_att_backfill','Oldingi sanalarga davomat','Yangi o‘quvchi qo‘shilganda oldingi dars kunlariga belgi qo‘yishga ruxsat.',b(s.allow_backfill))+
      toggle('#v08_att_remove','Ko‘p kelmaganlarni avtomatik chiqarish','Belgilangan limitdan oshganda avtomatik guruhdan chiqarish uchun tayyor qoida.',b(s.auto_remove_after_absences)))+
    card('Limitlar','Avtomatik qoidalar uchun raqamli chegaralar.',`<div class="settings-grid-v08">${field('Kelmaslik limiti','#v08_absence',s.absence_limit||3,'number','min="1"')}${field('Maksimal baho','#v08_maxmark',s.max_mark||100,'number','min="1"')}</div>`);
  }

  function finance(){const s=ui.data.sections?.finance||{};return head('Moliya sozlamalari','To‘lov, qarzdorlik va pul oqimi bo‘yicha markaz qoidalari.')+
    card('Hisob-kitob','Markazning asosiy moliyaviy parametrlarini belgilang.',`<div class="settings-grid-v08">${select('Pul birligi','#v08_currency',s.currency||'UZS',[['UZS','UZS — so‘m'],['USD','USD — dollar'],['TRY','TRY — lira']])}${field('Qarzdorlik limiti','#v08_debt',s.debt_limit||0,'number','min="0"')}${field('Kunlik pul yechish vaqti','#v08_withdraw',s.withdrawal_time||'00:00','time')}</div>`)+
    card('Biznes qoidalari','Edutizim videosida ko‘rsatilgan moliyaviy toggle’lar.',
      toggle('#v08_transfer','Kassalararo transferni tasdiqlash','Pul o‘tkazmasi ikkinchi tomon tasdig‘idan keyin yakunlanadi.',b(s.confirm_cashbox_transfer))+
      toggle('#v08_cancel_note','Bekor qilishda izoh majburiy','Abonement/to‘lov bekor qilinganda sabab yozilishi kerak.',b(s.cancellation_note_required))+
      toggle('#v08_oldprice','Transferda eski kurs narxini saqlash','Talaba boshqa guruhga o‘tganda avvalgi narxni saqlash.',b(s.keep_old_course_price_on_transfer)));
  }

  function receipt(){const s=ui.data.sections?.receipt||{},c=ui.data.center||{};return head('Chek sozlamalari','Chek ko‘rinishi va qaysi ma’lumotlar chiqishini boshqaring.')+
    `<div class="receipt-layout-v08"><div>${card('Dizayn va matn','O‘ng tomonda real-time preview yangilanadi.',`<div class="settings-grid-v08">${field('Chek logo URL','#v08_rlogo',s.logo_url||'')}<label class="settings-field-v08 wide"><span>Header matni</span><textarea id="v08_rheader" rows="2">${safe(s.header||'')}</textarea></label><label class="settings-field-v08 wide"><span>Footer matni</span><textarea id="v08_rfooter" rows="2">${safe(s.footer||'')}</textarea></label>${field('QR manzil','#v08_qrurl',s.qr_url||'')}</div>`)}${card('Chek maydonlari','Kerak bo‘lmagan ma’lumotlarni yashiring.',toggle('#v08_rphone','Markaz telefonini ko‘rsatish','Chek headerida markaz telefoni.',b(s.show_center_phone))+toggle('#v08_sphone','Talaba telefonini ko‘rsatish','Talaba kontaktini chekda chiqaradi.',b(s.show_student_phone))+toggle('#v08_rgroup','Guruhni ko‘rsatish','To‘lov tegishli guruh bilan ko‘rsatiladi.',b(s.show_group))+toggle('#v08_rmethod','To‘lov usulini ko‘rsatish','Naqd/karta/Click/Payme kabi.',b(s.show_payment_method))+toggle('#v08_rqr','QR kodni ko‘rsatish','QR blok uchun URL ishlatiladi.',b(s.show_qr)))}</div>
      <div class="receipt-preview-v08"><div class="receipt-paper-v08" id="v08ReceiptPreview">${receiptPaper(c,s)}</div></div></div>`;
  }
  function receiptPaper(c,s){const logo=s.logo_url||'/assets/logo-icon.png';return `<img class="receipt-logo-v08" src="${safe(logo)}" onerror="this.src='/assets/logo-icon.png'"><h4>${safe(c.name||'EDUKA')}</h4><p>${safe(s.header||c.ownerPhone||'To‘lov cheki')}</p><div class="receipt-line-v08"><span>Talaba</span><b>Ali Valiyev</b></div>${b(s.show_group)?`<div class="receipt-line-v08"><span>Guruh</span><b>IELTS 7+</b></div>`:''}${b(s.show_payment_method)?`<div class="receipt-line-v08"><span>To‘lov turi</span><b>Karta</b></div>`:''}<div class="receipt-line-v08 receipt-total-v08"><span>Jami</span><b>500 000 ${safe(ui.data?.sections?.finance?.currency||'UZS')}</b></div>${b(s.show_qr)?`<div class="receipt-line-v08"><span>QR</span><b>▦</b></div>`:''}<div class="receipt-footer-v08">${safe(s.footer||'EDUKA CRM orqali yaratildi')}</div>`}

  function center(){const c=ui.data.center||{},g=ui.data.sections?.general||{};return head('Filial / markaz','Joriy tenant va filial identifikatsiyasi.',false)+
    `<div class="settings-summary-v08"><div><span>Markaz</span><b>${safe(c.name)}</b></div><div><span>Subdomain</span><b>${safe(c.subdomain)}</b></div><div><span>Tarif</span><b>${safe(c.tariff)}</b></div><div><span>Filial soni</span><b>${safe(c.branchesCount||1)}</b></div></div>`+
    card('Joriy filial','Multi-branch v0.8.1’da alohida CRUD bilan kengaytiriladi.',`<div class="settings-grid-v08">${field('Markaz nomi','#v08_center_name',c.name,'text','disabled')}${field('Telefon','#v08_center_phone',c.ownerPhone,'text','disabled')}<label class="settings-field-v08 wide"><span>Manzil</span><textarea disabled rows="3">${safe(g.address||'Manzil kiritilmagan')}</textarea></label></div>`)+
    `<div class="settings-toast-note">Keyingi kichik versiya: filial qo‘shish, xaritadan manzil/pin, filialga xodim va guruh biriktirish.</div>`;
  }

  function integrations(){const s=ui.data.sections?.integrations||{};const cards=[['telegram','TG','Telegram Bot','Lid, to‘lov va bildirishnomalarni Telegramga yuborish.'],['sms','SMS','SMS provayder','Davomat, qarzdorlik va reminder xabarlari.'],['google_sheets','GS','Google Sheets','Hisobot va lidlarni Sheets bilan sinxronlash.'],['click','CL','Click','Onlayn to‘lov integratsiyasi.'],['payme','PM','Payme','Onlayn to‘lov integratsiyasi.']];return head('Integratsiyalar','Tashqi servislarni markaz kesimida yoqing yoki o‘chiring.')+`<div class="integration-grid-v08">${cards.map(([key,abbr,name,desc])=>`<div class="integration-card-v08"><div class="integration-top"><div class="integration-brand"><span class="integration-logo">${abbr}</span><b>${name}</b></div><label class="switch-v08"><input id="v08_int_${key}" type="checkbox" ${b(s[key+'_enabled'])?'checked':''}><i></i></label></div><p>${desc}</p><span class="settings-coming-v08">Konfiguratsiya maydonlari v0.8.2</span></div>`).join('')}</div>`}

  function content(){if(!ui.data)return `<div class="settings-toast-note">Sozlamalar yuklanmoqda...</div>`;const fn={general,academic,attendance,finance,receipt,center,integrations}[ui.section]||general;return shell(fn())}
  function render(){if(!isSettingsRoute())return;const root=$('#content');if(!root)return;ui.rendering=true;root.innerHTML=content();renderIcons();ui.rendering=false;bindReceiptPreview()}

  async function save(section){
    const btn=$(`[data-v08-save="${section}"]`);if(btn){btn.disabled=true;btn.textContent='Saqlanmoqda...'}
    let payload={};
    if(section==='general')payload={name:v('#v08_name'),ownerName:v('#v08_owner'),ownerPhone:v('#v08_phone'),ownerEmail:v('#v08_email'),address:v('#v08_address'),logoUrl:v('#v08_logo'),workStart:v('#v08_start'),workEnd:v('#v08_end'),language:v('#v08_lang'),timezone:v('#v08_tz')};
    if(section==='academic')payload={default_lesson_duration:v('#v08_lesson'),require_student_phone:checked('#v08_req_phone'),require_birth_date:checked('#v08_req_birth'),require_parent_phone:checked('#v08_req_parent'),default_group_capacity:v('#v08_capacity')};
    if(section==='attendance')payload={enabled:checked('#v08_att_enabled'),default_present:checked('#v08_att_present'),allow_backfill:checked('#v08_att_backfill'),auto_remove_after_absences:checked('#v08_att_remove'),absence_limit:v('#v08_absence'),max_mark:v('#v08_maxmark')};
    if(section==='finance')payload={currency:v('#v08_currency'),debt_limit:v('#v08_debt'),confirm_cashbox_transfer:checked('#v08_transfer'),cancellation_note_required:checked('#v08_cancel_note'),withdrawal_time:v('#v08_withdraw'),keep_old_course_price_on_transfer:checked('#v08_oldprice')};
    if(section==='receipt')payload={logo_url:v('#v08_rlogo'),header:v('#v08_rheader'),footer:v('#v08_rfooter'),show_center_phone:checked('#v08_rphone'),show_student_phone:checked('#v08_sphone'),show_group:checked('#v08_rgroup'),show_payment_method:checked('#v08_rmethod'),show_qr:checked('#v08_rqr'),qr_url:v('#v08_qrurl')};
    if(section==='integrations')payload={telegram_enabled:checked('#v08_int_telegram'),sms_enabled:checked('#v08_int_sms'),google_sheets_enabled:checked('#v08_int_google_sheets'),click_enabled:checked('#v08_int_click'),payme_enabled:checked('#v08_int_payme')};
    const r=await API.patch(`/api/app/settings-v2/${section}`,payload);
    if(btn){btn.disabled=false;btn.textContent='Saqlash'}
    if(!r?.ok){toast(r?.error||'Saqlashda xatolik',false);return}
    toast('Sozlamalar saqlandi');await load();
    try{if(typeof loadData==='function')await loadData()}catch(e){}
  }

  function bindReceiptPreview(){if(ui.section!=='receipt')return;['#v08_rlogo','#v08_rheader','#v08_rfooter','#v08_rgroup','#v08_rmethod','#v08_rqr'].forEach(sel=>$(sel)?.addEventListener('input',()=>{const c=ui.data.center||{},s={...ui.data.sections.receipt,logo_url:v('#v08_rlogo'),header:v('#v08_rheader'),footer:v('#v08_rfooter'),show_group:String(checked('#v08_rgroup')),show_payment_method:String(checked('#v08_rmethod')),show_qr:String(checked('#v08_rqr'))};const p=$('#v08ReceiptPreview');if(p)p.innerHTML=receiptPaper(c,s)}))}

  document.addEventListener('click',e=>{
    const side=e.target.closest('#sideNav [data-page="settings"], [data-shell-settings]');
    if(side){e.preventDefault();e.stopPropagation();if(window.state)state.page='settings';history.replaceState(null,'','/app/settings');ui.section='general';render();if(!ui.data)load();return}
    const s=e.target.closest('[data-v08-section]');if(s){ui.section=s.dataset.v08Section;render();return}
    const saveBtn=e.target.closest('[data-v08-save]');if(saveBtn){save(saveBtn.dataset.v08Save);return}
    const goBtn=e.target.closest('[data-v08-go]');if(goBtn&&typeof go==='function'){go(goBtn.dataset.v08Go);return}
  },true);

  const obs=new MutationObserver(()=>{if(ui.rendering||!isSettingsRoute())return;const root=$('#content');if(!root)return;if(!root.querySelector('.settings-v08'))setTimeout(()=>render(),0)});
  document.addEventListener('DOMContentLoaded',()=>{
    const root=$('#content');if(root)obs.observe(root,{childList:true,subtree:false});
    setTimeout(()=>{if(isSettingsRoute()){if(window.state)state.page='settings';history.replaceState(null,'','/app/settings');render();load()}},500);
  });
})();
