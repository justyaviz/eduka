/* EDUKA CEO v1.1 — native shell interactions. */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function closeNav(){document.body.classList.remove('ceo-nav-open')}
  function initMobile(){
    $('#ceoMobileMenuV11')?.addEventListener('click',()=>document.body.classList.toggle('ceo-nav-open'));
    $('#ceoMobileOverlayV11')?.addEventListener('click',closeNav);
    document.querySelector('.ceo-nav')?.addEventListener('click',()=>{if(innerWidth<=840)closeNav()});
    window.addEventListener('resize',()=>{if(innerWidth>840)closeNav()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNav()});
  }

  function patchToast(){
    const legacy=window.toast;
    if(!window.EDUKA_UI||typeof legacy!=='function')return;
    window.toast=function(message,ok){
      const text=String(message||'');
      const looksError=ok===false||/(xato|error|noto.?g.?ri|unauthorized|failed|topilmadi)/i.test(text);
      return window.EDUKA_UI.toast(text,{type:looksError?'error':'success'});
    };
  }

  function patchDangerConfirm(){
    document.addEventListener('click',async e=>{
      const btn=e.target.closest('[data-center-status]');
      if(!btn||btn.dataset.status!=='Suspended'||!window.EDUKA_UI||typeof window.updateCenterStatus!=='function')return;
      e.preventDefault();e.stopImmediatePropagation();
      const yes=await window.EDUKA_UI.confirm({title:'Markazni to‘xtatish',message:'Ushbu markaz holatini Suspended qilasizmi? Markaz foydalanuvchilari kirishi cheklanishi mumkin.',confirmText:'To‘xtatish',danger:true});
      if(!yes)return;
      try{window.EDUKA_UI.startProgress();await window.updateCenterStatus(btn.dataset.centerStatus,'Suspended')}catch(err){window.toast?.(err.message,false)}finally{window.EDUKA_UI.stopProgress()}
    },true);
  }

  function ensureSearchPop(){
    let pop=$('#ceoSearchPopV11');if(pop)return pop;
    pop=document.createElement('div');pop.id='ceoSearchPopV11';pop.className='ceo-search-pop-v11';pop.hidden=true;document.body.appendChild(pop);return pop;
  }
  function items(q){
    const term=String(q||'').trim().toLowerCase(),out=[];
    const st=window.state||{};
    (st.centers||[]).forEach(x=>{const hay=`${x.name||''} ${x.subdomain||''} ${x.ownerName||''} ${x.ownerPhone||''}`.toLowerCase();if(!term||hay.includes(term))out.push({type:'Markaz',page:'centers',label:x.name||'Markaz',meta:x.subdomain||x.ownerPhone||''})});
    (st.demo||[]).forEach(x=>{const hay=`${x.name||''} ${x.center||''} ${x.phone||''} ${x.status||''}`.toLowerCase();if(!term||hay.includes(term))out.push({type:'Demo',page:'demo',label:x.name||'Demo so‘rov',meta:[x.center,x.phone].filter(Boolean).join(' · '),id:x.id})});
    (st.payments||[]).forEach(x=>{const hay=`${x.center||''} ${x.tariff||''} ${x.status||''}`.toLowerCase();if(!term||hay.includes(term))out.push({type:'To‘lov',page:'payments',label:x.center||'To‘lov',meta:[x.tariff,x.status].filter(Boolean).join(' · ')})});
    return out.slice(0,20);
  }
  function renderSearch(q){
    const pop=ensureSearchPop(),arr=items(q);
    pop.innerHTML=arr.length?arr.map(x=>`<button type="button" data-page="${esc(x.page)}" data-demo-id="${esc(x.id||'')}"><span><b>${esc(x.label)}</b><small>${esc(x.meta||'')}</small></span><em>${esc(x.type)}</em></button>`).join(''):'<div class="ceo-search-empty-v11">Hech narsa topilmadi</div>';
    pop.hidden=false;
    pop.querySelectorAll('button').forEach(b=>b.onclick=async()=>{pop.hidden=true;input.value='';if(typeof window.openPage==='function')await window.openPage(b.dataset.page);if(b.dataset.demoId&&typeof window.openDemoModal==='function'){const st=window.state||{};const r=(st.demo||[]).find(x=>String(x.id)===String(b.dataset.demoId));if(r)window.openDemoModal(r)}});
  }
  let input;
  function initSearch(){
    input=$('#ceoGlobalSearchV11')||$('.ceo-topbar .search input');if(!input)return;
    input.addEventListener('focus',()=>renderSearch(input.value));input.addEventListener('input',()=>renderSearch(input.value));
    input.addEventListener('keydown',e=>{if(e.key==='Escape'){ensureSearchPop().hidden=true;input.blur()}});
    document.addEventListener('click',e=>{if(!e.target.closest('.search')&&!e.target.closest('#ceoSearchPopV11'))ensureSearchPop().hidden=true});
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){e.preventDefault();input.focus();renderSearch(input.value)}});
  }

  function addStyles(){
    if($('#ceoNativeInlineV11'))return;
    const s=document.createElement('style');s.id='ceoNativeInlineV11';s.textContent=`.ceo-search-pop-v11{position:fixed;z-index:150;top:56px;right:150px;width:min(430px,calc(100vw - 32px));max-height:390px;overflow:auto;padding:6px;background:#fff;border:1px solid var(--eduka-border);border-radius:12px;box-shadow:var(--eduka-shadow-md)}.ceo-search-pop-v11[hidden]{display:none!important}.ceo-search-pop-v11 button{width:100%;min-height:44px;border:0;border-radius:9px;background:#fff;padding:8px 10px;display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;cursor:pointer}.ceo-search-pop-v11 button:hover{background:#F5F8FC}.ceo-search-pop-v11 span{display:grid;gap:2px;min-width:0}.ceo-search-pop-v11 b{font-size:11px;color:var(--eduka-navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ceo-search-pop-v11 small{font-size:9px;color:var(--eduka-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ceo-search-pop-v11 em{font-style:normal;font:800 8px Manrope,Inter,sans-serif;color:var(--eduka-blue);background:var(--eduka-blue-soft);border-radius:999px;padding:5px 7px}.ceo-search-empty-v11{padding:26px;text-align:center;color:var(--eduka-muted);font-size:11px}@media(max-width:840px){.ceo-search-pop-v11{right:12px;left:12px;top:60px;width:auto}}`;document.head.appendChild(s);
  }

  function init(){addStyles();patchToast();initMobile();initSearch();patchDangerConfirm()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
