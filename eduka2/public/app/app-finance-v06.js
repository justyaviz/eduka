/* EDUKA CRM v0.6 — Finance 2.0. Tenant admin only; public landing untouched. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const safe=(v)=>typeof esc==="function"?esc(v):String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const cash=(v)=>typeof money==="function"?money(v):Number(v||0).toLocaleString("uz-UZ");
  const ui={from:"",to:"",tab:"all",query:"",filter:"all",data:null,loading:false,key:""};

  function isoLocal(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
  function monthRange(offset=0){const n=new Date(),first=new Date(n.getFullYear(),n.getMonth()+offset,1),last=offset===0?n:new Date(n.getFullYear(),n.getMonth()+offset+1,0);return{from:isoLocal(first),to:isoLocal(last)}}
  function todayRange(){const d=isoLocal(new Date());return{from:d,to:d}}
  function initRange(){if(!ui.from||!ui.to){const r=monthRange(0);ui.from=r.from;ui.to=r.to}}
  function fmtDate(v){if(!v)return"—";const d=new Date(v);return Number.isNaN(d.getTime())?safe(v):d.toLocaleString("uz-UZ",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
  function localDateTimeValue(v){const d=v?new Date(v):new Date();if(Number.isNaN(d.getTime()))return"";const p=n=>String(n).padStart(2,"0");return`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`}
  function methodLabel(v){const m={cash:"Naqd",card:"Karta",click:"Click",payme:"Payme",other:"Boshqa"};return m[String(v||"").toLowerCase()]||v||"Boshqa"}
  function periodLabel(){return `${ui.from.split("-").reverse().join(".")} — ${ui.to.split("-").reverse().join(".")}`}

  async function loadRange(force=false){
    initRange();
    const key=`${ui.from}|${ui.to}`;
    if(ui.loading||(!force&&ui.data&&ui.key===key))return;
    ui.loading=true;ui.key=key;
    if((state.page||"")==="finance")renderFinance();
    const d=await API.get(`/api/app/finance-v2?from=${encodeURIComponent(ui.from)}&to=${encodeURIComponent(ui.to)}`,null);
    ui.loading=false;
    if(!d||d.ok===false){ui.data={ok:false,error:d?.error||"Moliya ma’lumotlari yuklanmadi",summary:{income:0,expenses:0,profit:0,paymentCount:0,expenseCount:0},payments:[],expenses:[],paymentMethods:[],expenseCategories:[]};if(typeof toast==="function")toast(ui.data.error,false)}else ui.data=d;
    if((state.page||"")==="finance")renderFinance();
  }

  function combinedRows(){
    const d=ui.data||{};
    const payments=(d.payments||[]).map(x=>({...x,kind:"income",at:x.paidAt,label:x.studentName||"Talaba",sub:x.groupName||methodLabel(x.paymentType),filterKey:String(x.paymentType||"other")}));
    const expenses=(d.expenses||[]).map(x=>({...x,kind:"expense",at:x.spentAt,label:x.title||"Xarajat",sub:x.category||"Boshqa",filterKey:String(x.category||"Boshqa")}));
    const q=ui.query.trim().toLowerCase();
    return [...payments,...expenses]
      .filter(x=>ui.tab==="all"||x.kind===ui.tab)
      .filter(x=>ui.filter==="all"||x.filterKey===ui.filter)
      .filter(x=>!q||[x.label,x.sub,x.note,x.paymentType,x.category,x.groupName].some(v=>String(v||"").toLowerCase().includes(q)))
      .sort((a,b)=>new Date(b.at||0)-new Date(a.at||0));
  }

  function kpi(icon,label,value,note,cls=""){return `<article class="finance-kpi ${cls}"><span class="finance-kpi-icon"><span data-icon="${icon}"></span></span><div><span>${safe(label)}</span><strong>${value}</strong><small>${safe(note)}</small></div></article>`}
  function breakdown(title,rows,kind){
    return `<div class="finance-card finance-breakdown"><h3>${safe(title)}</h3>${rows?.length?rows.slice(0,6).map(x=>`<div class="finance-breakdown-row"><span>${safe(kind==="method"?methodLabel(x.key):x.key)}</span><b>${cash(x.total)} UZS</b><small>${x.count} ta operatsiya</small></div>`).join(""):`<div class="finance-empty"><b>Ma’lumot yo‘q</b><span>Tanlangan davrda operatsiya topilmadi.</span></div>`}</div>`;
  }

  function financeV06(){
    initRange();
    if((!ui.data||ui.key!==`${ui.from}|${ui.to}`)&&!ui.loading)setTimeout(()=>loadRange(false),0);
    const d=ui.data||{summary:{income:0,expenses:0,profit:0,paymentCount:0,expenseCount:0},payments:[],expenses:[],paymentMethods:[],expenseCategories:[]};
    const s=d.summary||{};const rows=combinedRows();
    const filterOptions=[...new Set([...(d.payments||[]).map(x=>String(x.paymentType||"other")),...(d.expenses||[]).map(x=>String(x.category||"Boshqa"))])];
    return `<div class="finance-v06">
      <div class="finance-head"><div><h1>Moliya</h1><p>Tushum, xarajat va sof foydani real sana oralig‘ida boshqaring.</p></div><div class="finance-head-actions"><button type="button" data-v06-expense><span data-icon="receipt"></span> Xarajat qo‘shish</button><button type="button" class="primary" data-v06-payment><span data-icon="wallet"></span> To‘lov qabul qilish</button></div></div>
      <div class="finance-period"><label>Boshlanish sanasi<input id="financeFromV06" type="date" value="${safe(ui.from)}"></label><label>Tugash sanasi<input id="financeToV06" type="date" value="${safe(ui.to)}"></label><div class="period-shortcuts"><button data-v06-range="today">Bugun</button><button data-v06-range="month">Joriy oy</button><button data-v06-range="previous">Oldingi oy</button></div><button class="apply" data-v06-apply>Ko‘rsatish</button></div>
      <section class="finance-summary">
        ${kpi("wallet","Tushum",`${cash(s.income)} UZS`,periodLabel(),"")}
        ${kpi("receipt","Xarajat",`${cash(s.expenses)} UZS`,`${Number(s.expenseCount||0)} ta xarajat`,"expense")}
        ${kpi("chart","Sof foyda",`${cash(s.profit)} UZS`,Number(s.profit||0)>=0?"Musbat natija":"Xarajat tushumdan yuqori","profit")}
        ${kpi("coin","Tranzaksiyalar",`${Number(s.paymentCount||0)+Number(s.expenseCount||0)} ta`,`${Number(s.paymentCount||0)} to‘lov · ${Number(s.expenseCount||0)} xarajat`,"count")}
      </section>
      <div class="finance-layout">
        <section class="finance-card"><div class="finance-card-head"><div><h2>Tranzaksiyalar</h2><span>${periodLabel()}</span></div><span>${rows.length} ta natija</span></div>
          <div class="finance-toolbar"><div class="finance-tabs"><button class="${ui.tab==="all"?"active":""}" data-v06-tab="all">Barchasi</button><button class="${ui.tab==="income"?"active":""}" data-v06-tab="income">To‘lovlar</button><button class="${ui.tab==="expense"?"active":""}" data-v06-tab="expense">Xarajatlar</button></div><label class="finance-search"><span data-icon="search"></span><input id="financeSearchV06" value="${safe(ui.query)}" placeholder="Talaba, guruh, xarajat yoki izoh..."></label><select id="financeFilterV06" class="finance-filter-select"><option value="all">Barcha turlar</option>${filterOptions.map(x=>`<option value="${safe(x)}" ${ui.filter===x?"selected":""}>${safe(methodLabel(x))}</option>`).join("")}</select></div>
          ${ui.loading?`<div class="finance-loading">Moliya ma’lumotlari yuklanmoqda...</div>`:rows.length?`<div class="finance-table-wrap"><table class="finance-table"><thead><tr><th>Sana</th><th>Turi</th><th>Nomi</th><th>Guruh / kategoriya</th><th>Usul</th><th>Summa</th></tr></thead><tbody>${rows.map(x=>`<tr data-v06-detail="${x.kind}:${x.id}"><td>${fmtDate(x.at)}</td><td><span class="finance-kind ${x.kind}">${x.kind==="income"?"Tushum":"Xarajat"}</span></td><td><b>${safe(x.label)}</b>${x.note?`<br><small>${safe(x.note)}</small>`:""}</td><td>${safe(x.sub||"—")}</td><td>${safe(x.kind==="income"?methodLabel(x.paymentType):x.category||"—")}</td><td><span class="finance-amount ${x.kind}">${x.kind==="income"?"+":"−"}${cash(x.amount)} UZS</span></td></tr>`).join("")}</tbody></table></div>`:`<div class="finance-empty"><b>Tranzaksiya topilmadi</b><span>Sana yoki filterlarni o‘zgartirib ko‘ring.</span></div>`}
        </section>
        <aside class="finance-side">${breakdown("To‘lov usullari",d.paymentMethods||[],"method")}${breakdown("Xarajat kategoriyalari",d.expenseCategories||[],"category")}</aside>
      </div>
    </div>`;
  }

  function renderFinance(){if((state.page||"")!=="finance")return;const c=$("#content");if(!c)return;c.innerHTML=financeV06();if(typeof renderIcons==="function")renderIcons()}
  function close(){if(typeof closeDrawer==="function")closeDrawer();else{$("#drawerBackdrop").hidden=true;$("#drawer").hidden=true}}
  function showDrawer(title,html){$("#drawerTitle").textContent=title;$("#drawerBody").innerHTML=html;$("#drawerBackdrop").hidden=false;$("#drawer").hidden=false;if(typeof renderIcons==="function")renderIcons()}
  function options(items,label,map=x=>x.name){return `<option value="">${safe(label)}</option>`+(items||[]).map(x=>`<option value="${safe(x.id)}">${safe(map(x))}</option>`).join("")}

  function openPayment(){
    showDrawer("To‘lov qabul qilish",`<form id="financePaymentFormV06" class="finance-drawer-form"><label>Talaba<select id="fp_student">${options(state.students,"Talabani tanlang",x=>x.name)}</select></label><label>Guruh<select id="fp_group">${options(state.groups,"Guruhni tanlang",x=>x.name)}</select></label><div class="two"><label>Summa<input id="fp_amount" type="number" min="1" required></label><label>To‘lov turi<select id="fp_type"><option value="cash">Naqd</option><option value="card">Karta</option><option value="click">Click</option><option value="payme">Payme</option></select></label></div><label>Sana va vaqt<input id="fp_at" type="datetime-local" value="${localDateTimeValue()}"></label><label>Izoh<textarea id="fp_note" placeholder="Ixtiyoriy izoh"></textarea></label><button type="submit">To‘lovni saqlash</button></form>`);
  }
  function openExpense(){
    showDrawer("Yangi xarajat",`<form id="financeExpenseFormV06" class="finance-drawer-form"><label>Xarajat nomi<input id="fe_title" required placeholder="Masalan: Ijara"></label><div class="two"><label>Summa<input id="fe_amount" type="number" min="1" required></label><label>Kategoriya<select id="fe_category"><option>Ijara</option><option>Maosh</option><option>Kommunal</option><option>Reklama</option><option>Jihoz</option><option>Transport</option><option>Boshqa</option></select></label></div><label>Sana va vaqt<input id="fe_at" type="datetime-local" value="${localDateTimeValue()}"></label><label>Izoh<textarea id="fe_note" placeholder="Ixtiyoriy izoh"></textarea></label><button type="submit">Xarajatni saqlash</button></form>`);
  }
  function findTransaction(kind,id){const d=ui.data||{};return kind==="income"?(d.payments||[]).find(x=>String(x.id)===String(id)):(d.expenses||[]).find(x=>String(x.id)===String(id))}
  function openDetail(key){const [kind,id]=String(key).split(":");const x=findTransaction(kind,id);if(!x)return;const income=kind==="income";showDrawer(income?"To‘lov tafsilotlari":"Xarajat tafsilotlari",`<div class="finance-detail"><div class="finance-detail-hero"><span>${income?"Tushum":"Xarajat"}</span><strong class="finance-amount ${income?"income":"expense"}">${income?"+":"−"}${cash(x.amount)} UZS</strong></div><div class="finance-detail-grid"><div class="finance-detail-item"><span>Sana</span><b>${fmtDate(income?x.paidAt:x.spentAt)}</b></div><div class="finance-detail-item"><span>${income?"To‘lov turi":"Kategoriya"}</span><b>${safe(income?methodLabel(x.paymentType):x.category||"Boshqa")}</b></div>${income?`<div class="finance-detail-item"><span>Talaba</span><b>${safe(x.studentName||"—")}</b></div><div class="finance-detail-item"><span>Guruh</span><b>${safe(x.groupName||"—")}</b></div>`:`<div class="finance-detail-item"><span>Nomi</span><b>${safe(x.title||"—")}</b></div><div class="finance-detail-item"><span>Holat</span><b>Saqlangan</b></div>`}</div>${x.note?`<div class="finance-note"><b>Izoh:</b> ${safe(x.note)}</div>`:""}</div>`)}

  async function refreshAfterSave(){await loadData();ui.data=null;await loadRange(true);renderFinance()}

  try{finance=financeV06}catch(e){window.finance=financeV06}
  window.finance=financeV06;

  document.addEventListener("click",async e=>{
    if(e.target.closest("[data-v06-payment]")){e.preventDefault();openPayment();return}
    if(e.target.closest("[data-v06-expense]")){e.preventDefault();openExpense();return}
    const tab=e.target.closest("[data-v06-tab]");if(tab){ui.tab=tab.dataset.v06Tab;renderFinance();return}
    const range=e.target.closest("[data-v06-range]");if(range){const r=range.dataset.v06Range==="today"?todayRange():monthRange(range.dataset.v06Range==="previous"?-1:0);ui.from=r.from;ui.to=r.to;ui.data=null;await loadRange(true);return}
    if(e.target.closest("[data-v06-apply]")){const f=$("#financeFromV06")?.value,t=$("#financeToV06")?.value;if(!f||!t){toast("Sana oralig‘ini tanlang",false);return}if(f>t){toast("Boshlanish sanasi tugash sanasidan katta",false);return}ui.from=f;ui.to=t;ui.data=null;await loadRange(true);return}
    const detail=e.target.closest("[data-v06-detail]");if(detail){openDetail(detail.dataset.v06Detail);return}
  });

  document.addEventListener("input",e=>{if(e.target.id==="financeSearchV06"){ui.query=e.target.value;renderFinance();const i=$("#financeSearchV06");if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}}});
  document.addEventListener("change",e=>{if(e.target.id==="financeFilterV06"){ui.filter=e.target.value;renderFinance()}});
  document.addEventListener("submit",async e=>{
    if(e.target.id==="financePaymentFormV06"){
      e.preventDefault();const body={studentId:$("#fp_student").value||null,groupId:$("#fp_group").value||null,amount:$("#fp_amount").value,paymentType:$("#fp_type").value,paidAt:$("#fp_at").value||null,note:$("#fp_note").value.trim()};const r=await API.post("/api/app/payments",body);if(!r.ok){toast(r.error||"To‘lov saqlanmadi",false);return}close();toast("To‘lov saqlandi");await refreshAfterSave();return;
    }
    if(e.target.id==="financeExpenseFormV06"){
      e.preventDefault();const body={title:$("#fe_title").value.trim(),amount:$("#fe_amount").value,category:$("#fe_category").value,spentAt:$("#fe_at").value||null,note:$("#fe_note").value.trim()};const r=await API.post("/api/app/expenses",body);if(!r.ok){toast(r.error||"Xarajat saqlanmadi",false);return}close();toast("Xarajat saqlandi");await refreshAfterSave();return;
    }
  });

  document.addEventListener("DOMContentLoaded",()=>{initRange();const c=$("#content");if(c)new MutationObserver(()=>{if((state.page||"")==="finance"&&!c.querySelector(".finance-v06"))setTimeout(renderFinance,0)}).observe(c,{childList:true,subtree:false})});
})();
