/* EDUKA CRM v0.3 — Students 2.0. Tenant admin only; public landing untouched. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const safe=(v)=>typeof esc==="function"?esc(v):String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  const cash=(v)=>typeof money==="function"?money(v):Number(v||0).toLocaleString("uz-UZ");
  const ui={query:"",status:"all",group:"all",finance:"all",remoteRows:null,searchTimer:null,searchSeq:0};

  function token(){return localStorage.getItem("eduka_center_token")||localStorage.getItem("token")||""}
  async function request(url,opts={}){
    try{
      const headers={"Content-Type":"application/json",...(opts.headers||{})};
      const t=token(); if(t) headers.Authorization="Bearer "+t;
      const r=await fetch(url,{...opts,headers});
      const d=await r.json().catch(()=>({ok:false,error:`HTTP ${r.status}`}));
      if(!r.ok&&d.ok!==false)d.ok=false;
      return d;
    }catch(e){return{ok:false,error:e.message}}
  }
  const get=(u)=>request(u);
  const put=(u,b)=>request(u,{method:"PUT",body:JSON.stringify(b)});
  const post=(u,b)=>request(u,{method:"POST",body:JSON.stringify(b)});
  const del=(u)=>request(u,{method:"DELETE"});

  function initials(v){const p=String(v||"T").trim().split(/\s+/).filter(Boolean);return(p.slice(0,2).map(x=>x[0]).join("")||"T").toUpperCase()}
  function dateOnly(v){if(!v)return"";return String(v).slice(0,10)}
  function dateFmt(v){if(!v)return"—";const d=new Date(v);return Number.isNaN(d.getTime())?safe(v):d.toLocaleDateString("uz-UZ",{day:"2-digit",month:"short",year:"numeric"})}
  function dateTime(v){if(!v)return"—";const d=new Date(v);return Number.isNaN(d.getTime())?safe(v):d.toLocaleString("uz-UZ",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
  function groupNames(s){return String(s?.groupName||"").split(",").map(x=>x.trim()).filter(Boolean)}
  function statusLabel(v){const x=String(v||"active").toLowerCase();if(x==="active")return"Faol";if(x==="paused")return"To‘xtatilgan";if(x==="inactive")return"Nofaol";return v||"Faol"}
  function balanceClass(v){const n=Number(v||0);return n<0?"neg":n>0?"pos":"zero"}
  function studentRows(){
    const source=Array.isArray(ui.remoteRows)?ui.remoteRows:(window.state?.students||[]);
    return source.filter(s=>{
      const st=String(s.status||"active").toLowerCase();
      if(ui.status!=="all"&&st!==ui.status)return false;
      if(ui.group!=="all"&&!groupNames(s).includes(ui.group))return false;
      const b=Number(s.balance||0);
      if(ui.finance==="zero"&&b!==0)return false;
      if(ui.finance==="negative"&&b>=0)return false;
      if(ui.finance==="positive"&&b<=0)return false;
      return true;
    });
  }

  function chips(s){const names=groupNames(s);if(!names.length)return`<span class="student-group-chip">Guruhsiz</span>`;return names.map(x=>`<span class="student-group-chip">${safe(x)}</span>`).join("")}
  function row(s,i){
    return `<tr>
      <td>${i+1}</td>
      <td><div class="student-main-cell"><span class="student-avatar-v03">${safe(initials(s.name))}</span><span><b>${safe(s.name||"Nomsiz")}</b><small>${safe(s.parentPhone?`Ota-ona: ${s.parentPhone}`:"Ota-ona telefoni yo‘q")}</small></span></div></td>
      <td>${safe(s.phone||"—")}</td>
      <td><div class="student-groups">${chips(s)}</div></td>
      <td><span class="student-status ${String(s.status||"active").toLowerCase()==="active"?"":"other"}">${safe(statusLabel(s.status))}</span></td>
      <td><span class="student-balance ${balanceClass(s.balance)}">${cash(s.balance)} UZS</span></td>
      <td><div class="student-row-actions">
        <button class="student-action" type="button" title="Profil" data-v03-profile="${s.id}"><span data-icon="info"></span></button>
        <button class="student-action" type="button" title="To‘lov" data-v03-payment="${s.id}"><span data-icon="wallet"></span></button>
        <button class="student-action" type="button" title="Tahrirlash" data-v03-edit="${s.id}"><span data-icon="edit"></span></button>
        <button class="student-action danger" type="button" title="O‘chirish" data-v03-delete="${s.id}"><span data-icon="trash"></span></button>
      </div></td>
    </tr>`;
  }

  function studentsV03(){
    const all=window.state?.students||[];
    const rows=studentRows();
    const active=all.filter(s=>String(s.status||"active").toLowerCase()==="active").length;
    const grouped=all.filter(s=>groupNames(s).length).length;
    const nonZero=all.filter(s=>Number(s.balance||0)!==0).length;
    const groups=(window.state?.groups||[]).slice().sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));
    return `<div class="students-v03">
      <div class="students-v03-head">
        <div><h1>Talabalar</h1><p>Talaba profili, guruhlari, aloqa ma’lumotlari va to‘lovlarini boshqaring.</p></div>
        <button class="btn orange" data-open-drawer="student"><span data-icon="user-plus"></span> Yangi talaba</button>
      </div>
      <div class="student-summary-grid">
        <div class="student-summary-card"><span class="student-summary-icon"><span data-icon="graduation"></span></span><div><span>Jami</span><strong>${cash(all.length)}</strong></div></div>
        <div class="student-summary-card"><span class="student-summary-icon"><span data-icon="user-check"></span></span><div><span>Faol</span><strong>${cash(active)}</strong></div></div>
        <div class="student-summary-card"><span class="student-summary-icon"><span data-icon="layers"></span></span><div><span>Guruhga biriktirilgan</span><strong>${cash(grouped)}</strong></div></div>
        <div class="student-summary-card"><span class="student-summary-icon"><span data-icon="coin"></span></span><div><span>Balansi 0 emas</span><strong>${cash(nonZero)}</strong></div></div>
      </div>
      <div class="students-toolbar">
        <label class="student-search-wrap"><span data-icon="search"></span><input id="studentSearchV03" value="${safe(ui.query)}" placeholder="Ism, telefon yoki ota-ona telefoni bo‘yicha qidirish" autocomplete="off"></label>
        <select id="studentGroupV03"><option value="all">Barcha guruhlar</option>${groups.map(g=>`<option value="${safe(g.name)}" ${ui.group===g.name?"selected":""}>${safe(g.name)}</option>`).join("")}</select>
        <select id="studentStatusV03"><option value="all" ${ui.status==="all"?"selected":""}>Barcha holatlar</option><option value="active" ${ui.status==="active"?"selected":""}>Faol</option><option value="paused" ${ui.status==="paused"?"selected":""}>To‘xtatilgan</option><option value="inactive" ${ui.status==="inactive"?"selected":""}>Nofaol</option></select>
        <select id="studentFinanceV03"><option value="all" ${ui.finance==="all"?"selected":""}>Barcha balanslar</option><option value="negative" ${ui.finance==="negative"?"selected":""}>Balans manfiy</option><option value="zero" ${ui.finance==="zero"?"selected":""}>Balans 0</option><option value="positive" ${ui.finance==="positive"?"selected":""}>Balans musbat</option></select>
      </div>
      <div class="students-result-note"><span>${ui.query?`“${safe(ui.query)}” bo‘yicha qidiruv`:"Barcha talabalar"}</span><b>${cash(rows.length)} ta natija</b></div>
      <div class="student-list-card">${rows.length?`<table class="student-table-v03"><thead><tr><th>#</th><th>Talaba</th><th>Telefon</th><th>Guruhlar</th><th>Holat</th><th>Balans</th><th style="text-align:right">Amallar</th></tr></thead><tbody>${rows.map(row).join("")}</tbody></table>`:`<div class="students-empty"><span data-icon="search"></span><b>Talaba topilmadi</b><p>Qidiruv yoki filterlarni o‘zgartirib ko‘ring.</p></div>`}</div>
    </div>`;
  }

  function rerender(focusSearch=false){
    if((window.state?.page||"")!=="students")return;
    const content=$("#content");if(!content)return;
    content.innerHTML=studentsV03();
    if(typeof renderIcons==="function")renderIcons();
    if(focusSearch){const i=$("#studentSearchV03");if(i){i.focus();const p=i.value.length;i.setSelectionRange(p,p)}}
  }

  async function runSearch(q){
    const seq=++ui.searchSeq;
    if(!q){ui.remoteRows=null;rerender(true);return}
    const d=await get(`/api/app/students?q=${encodeURIComponent(q)}`);
    if(seq!==ui.searchSeq)return;
    if(d.ok===false){if(typeof toast==="function")toast(d.error||"Qidiruvda xatolik",false);return}
    ui.remoteRows=d.students||[];
    rerender(true);
  }

  function setDrawer(title,html){
    const titleEl=$("#drawerTitle"),body=$("#drawerBody"),back=$("#drawerBackdrop"),drawer=$("#drawer");
    if(!titleEl||!body||!back||!drawer)return;
    titleEl.textContent=title;body.innerHTML=html;back.hidden=false;drawer.hidden=false;
    if(typeof renderIcons==="function")renderIcons();
  }
  function close(){if(typeof window.closeDrawer==="function")window.closeDrawer();else{const b=$("#drawerBackdrop"),d=$("#drawer");if(b)b.hidden=true;if(d)d.hidden=true}}

  async function openProfile(id){
    const s=(window.state?.students||[]).find(x=>String(x.id)===String(id));if(!s)return;
    setDrawer("Talaba profili",`<div class="student-profile-v03"><div class="student-profile-hero"><span class="student-profile-avatar">${safe(initials(s.name))}</span><div><h3>${safe(s.name)}</h3><p>${safe(s.phone||"Telefon kiritilmagan")}</p></div><div class="student-profile-actions"><button type="button" data-v03-edit="${s.id}">Tahrirlash</button><button type="button" class="primary" data-v03-payment="${s.id}">To‘lov</button></div></div><div class="student-profile-section"><div class="student-profile-empty">Ma’lumotlar yuklanmoqda...</div></div></div>`);
    const p=await get("/api/app/payments");
    if(!$("#drawerBody")||$("#drawer").hidden)return;
    const payments=(p.payments||[]).filter(x=>String(x.studentId)===String(s.id));
    const total=payments.filter(x=>String(x.status||"paid").toLowerCase()==="paid").reduce((a,b)=>a+Number(b.amount||0),0);
    const names=groupNames(s);
    $("#drawerBody").innerHTML=`<div class="student-profile-v03">
      <div class="student-profile-hero"><span class="student-profile-avatar">${safe(initials(s.name))}</span><div><h3>${safe(s.name)}</h3><p>${safe(s.phone||"Telefon kiritilmagan")}</p></div><div class="student-profile-actions"><button type="button" data-v03-edit="${s.id}">Tahrirlash</button><button type="button" class="primary" data-v03-payment="${s.id}">To‘lov</button></div></div>
      <div class="student-info-grid">
        <div class="student-info-item"><span>Telefon</span><b>${safe(s.phone||"—")}</b></div>
        <div class="student-info-item"><span>Ota-ona telefoni</span><b>${safe(s.parentPhone||"—")}</b></div>
        <div class="student-info-item"><span>Tug‘ilgan sana</span><b>${dateFmt(s.birthDate)}</b></div>
        <div class="student-info-item"><span>Jins</span><b>${safe(s.gender==="male"?"Erkak":s.gender==="female"?"Ayol":s.gender||"—")}</b></div>
        <div class="student-info-item"><span>Holat</span><b>${safe(statusLabel(s.status))}</b></div>
        <div class="student-info-item"><span>Balans</span><b>${cash(s.balance)} UZS</b></div>
        <div class="student-info-item"><span>Guruhlar</span><b>${safe(names.join(", ")||"Guruhga biriktirilmagan")}</b></div>
        <div class="student-info-item"><span>Jami to‘lov</span><b>${cash(total)} UZS</b></div>
      </div>
      ${s.note?`<div class="student-profile-section"><header><h4>Izoh</h4></header><div style="padding:13px 14px;color:#56647b;font-size:12px;line-height:1.55">${safe(s.note)}</div></div>`:""}
      <div class="student-profile-section"><header><h4>To‘lov tarixi</h4><span>${payments.length} ta tranzaksiya</span></header>${payments.length?`<div class="student-payment-list">${payments.slice(0,30).map(x=>`<div class="student-payment-item"><b>${safe(x.groupName||"Guruh ko‘rsatilmagan")}</b><strong>+${cash(x.amount)} UZS</strong><small>${dateTime(x.paidAt)} · ${safe(x.paymentType||"to‘lov")}${x.note?` · ${safe(x.note)}`:""}</small></div>`).join("")}</div>`:`<div class="student-profile-empty">Hozircha to‘lov tarixi yo‘q.</div>`}</div>
    </div>`;
    if(typeof renderIcons==="function")renderIcons();
  }

  function currentGroupIds(s){const names=new Set(groupNames(s));return(window.state?.groups||[]).filter(g=>names.has(String(g.name||"").trim())).map(g=>String(g.id))}
  function openEdit(id){
    const s=(window.state?.students||[]).find(x=>String(x.id)===String(id));if(!s)return;
    const current=new Set(currentGroupIds(s));
    const groups=(window.state?.groups||[]).slice().sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));
    setDrawer("Talabani tahrirlash",`<form id="studentEditFormV03" class="student-edit-v03 form-grid">
      <label>Ism<input id="sv03_name" value="${safe(s.name||"")}" required></label>
      <label>Telefon<input id="sv03_phone" value="${safe(s.phone||"")}"></label>
      <label>Ota-ona telefoni<input id="sv03_parent" value="${safe(s.parentPhone||"")}"></label>
      <label>Tug‘ilgan sana<input id="sv03_birth" type="date" value="${safe(dateOnly(s.birthDate))}"></label>
      <label>Jins<select id="sv03_gender"><option value="">Tanlang</option><option value="male" ${s.gender==="male"?"selected":""}>Erkak</option><option value="female" ${s.gender==="female"?"selected":""}>Ayol</option></select></label>
      <label>Holat<select id="sv03_status"><option value="active" ${String(s.status||"active")==="active"?"selected":""}>Faol</option><option value="paused" ${s.status==="paused"?"selected":""}>To‘xtatilgan</option><option value="inactive" ${s.status==="inactive"?"selected":""}>Nofaol</option></select></label>
      <label style="grid-column:1/-1">Guruhlar<div class="group-checks">${groups.length?groups.map(g=>`<label><input type="checkbox" name="sv03_groups" value="${g.id}" ${current.has(String(g.id))?"checked":""}> ${safe(g.name)}</label>`).join(""):`<span style="color:#8a96a8;font-size:12px">Faol guruh yo‘q</span>`}</div></label>
      <label style="grid-column:1/-1">Izoh<textarea id="sv03_note">${safe(s.note||"")}</textarea></label>
      <div class="student-edit-footer" style="grid-column:1/-1"><button type="button" data-v03-close>Bekor qilish</button><button class="save" type="submit">Saqlash</button></div>
    </form>`);
    const form=$("#studentEditFormV03");
    form?.addEventListener("submit",async e=>{
      e.preventDefault();const submit=form.querySelector('button[type="submit"]');if(submit.disabled)return;submit.disabled=true;submit.textContent="Saqlanmoqda...";
      const payload={name:$("#sv03_name").value.trim(),phone:$("#sv03_phone").value.trim(),parentPhone:$("#sv03_parent").value.trim(),birthDate:$("#sv03_birth").value||null,gender:$("#sv03_gender").value,status:$("#sv03_status").value,note:$("#sv03_note").value.trim()};
      const r=await put(`/api/app/students/${s.id}`,payload);
      if(!r.ok){submit.disabled=false;submit.textContent="Saqlash";if(typeof toast==="function")toast(r.error||"Talabani saqlab bo‘lmadi",false);return}
      const selected=new Set(Array.from(form.querySelectorAll('input[name="sv03_groups"]:checked')).map(x=>String(x.value)));
      const before=new Set(currentGroupIds(s));
      const adds=[...selected].filter(x=>!before.has(x));
      const removes=[...before].filter(x=>!selected.has(x));
      const groupResults=await Promise.all([
        ...adds.map(gid=>post(`/api/app/groups-v2/${gid}/students`,{studentId:s.id,joinedAt:new Date().toISOString().slice(0,10)})),
        ...removes.map(gid=>del(`/api/app/groups-v2/${gid}/students/${s.id}`))
      ]);
      if(groupResults.some(x=>x&&x.ok===false)&&typeof toast==="function")toast("Profil saqlandi, lekin ayrim guruhlar yangilanmadi",false);
      await refreshStudents();close();if(typeof toast==="function")toast("Talaba ma’lumotlari saqlandi");
    });
  }

  function confirmDelete(id){
    const s=(window.state?.students||[]).find(x=>String(x.id)===String(id));if(!s)return;
    document.querySelector(".student-confirm-overlay")?.remove();
    document.body.insertAdjacentHTML("beforeend",`<div class="student-confirm-overlay" role="dialog" aria-modal="true"><div class="student-confirm-card"><div class="student-confirm-icon"><span data-icon="trash"></span></div><h3>Talabani o‘chirish</h3><p><b>${safe(s.name)}</b> CRM’dan o‘chiriladi. Bu soft-delete bo‘lib, boshqa markaz ma’lumotlariga ta’sir qilmaydi.</p><div class="student-confirm-actions"><button type="button" data-v03-cancel-delete>Bekor qilish</button><button type="button" class="danger" data-v03-confirm-delete="${s.id}">O‘chirish</button></div></div></div>`);
    if(typeof renderIcons==="function")renderIcons();
  }

  async function refreshStudents(){
    const d=await get("/api/app/students");
    if(d.ok!==false&&Array.isArray(d.students))window.state.students=d.students;
    ui.remoteRows=ui.query?null:null;
    rerender(false);
  }

  function openPayment(id){
    const s=(window.state?.students||[]).find(x=>String(x.id)===String(id));if(!s)return;
    if(typeof window.openDrawer==="function")window.openDrawer("payment",{studentId:id});
    else if(typeof openDrawer==="function")openDrawer("payment",{studentId:id});
    setTimeout(()=>{
      const student=$("#f_student");if(student)student.value=String(id);
      const names=groupNames(s);const group=(window.state?.groups||[]).find(g=>names.includes(g.name));const sel=$("#f_group");if(sel&&group)sel.value=String(group.id);
    },0);
  }

  function bind(){
    document.body.addEventListener("input",e=>{
      if(e.target.id!=="studentSearchV03")return;
      ui.query=e.target.value.trim();clearTimeout(ui.searchTimer);ui.searchTimer=setTimeout(()=>runSearch(ui.query),320);
    });
    document.body.addEventListener("change",e=>{
      if(e.target.id==="studentGroupV03"){ui.group=e.target.value;rerender(false)}
      if(e.target.id==="studentStatusV03"){ui.status=e.target.value;rerender(false)}
      if(e.target.id==="studentFinanceV03"){ui.finance=e.target.value;rerender(false)}
    });
    document.body.addEventListener("click",async e=>{
      const profile=e.target.closest("[data-v03-profile]");if(profile){e.preventDefault();await openProfile(profile.dataset.v03Profile);return}
      const edit=e.target.closest("[data-v03-edit]");if(edit){e.preventDefault();openEdit(edit.dataset.v03Edit);return}
      const pay=e.target.closest("[data-v03-payment]");if(pay){e.preventDefault();openPayment(pay.dataset.v03Payment);return}
      const remove=e.target.closest("[data-v03-delete]");if(remove){e.preventDefault();confirmDelete(remove.dataset.v03Delete);return}
      if(e.target.closest("[data-v03-close]")){e.preventDefault();close();return}
      if(e.target.closest("[data-v03-cancel-delete]")){document.querySelector(".student-confirm-overlay")?.remove();return}
      const confirm=e.target.closest("[data-v03-confirm-delete]");if(confirm){
        const id=confirm.dataset.v03ConfirmDelete;confirm.disabled=true;confirm.textContent="O‘chirilmoqda...";
        const r=await del(`/api/app/students/${id}`);if(!r.ok){confirm.disabled=false;confirm.textContent="O‘chirish";if(typeof toast==="function")toast(r.error||"O‘chirishda xatolik",false);return}
        document.querySelector(".student-confirm-overlay")?.remove();await refreshStudents();if(typeof toast==="function")toast("Talaba o‘chirildi");return;
      }
      const overlay=e.target.closest(".student-confirm-overlay");if(overlay&&e.target===overlay)overlay.remove();
    });
    document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelector(".student-confirm-overlay")?.remove()});
  }

  try{students=studentsV03}catch(e){window.students=studentsV03}
  window.students=studentsV03;

  document.addEventListener("DOMContentLoaded",()=>{
    bind();
    let tries=0;const timer=setInterval(()=>{tries++;if(window.state?.me&&typeof window.go==="function"){if(window.state.page==="students")window.go("students",false);clearInterval(timer)}else if(tries>60)clearInterval(timer)},100);
  });
})();
