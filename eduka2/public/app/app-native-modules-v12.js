/* EDUKA Brandbook v1.2 — safe native module UX bridge. */
(function(){
  'use strict';
  const MODULES='.edu-dashboard-v091,.leads093,.groups-v094,.students-v095,.finance-v097';
  const iconLabels={
    edit:'Tahrirlash',pencil:'Tahrirlash',trash:'O‘chirish',delete:'O‘chirish',eye:'Ko‘rish',view:'Ko‘rish',more:'Boshqa amallar',
    phone:'Qo‘ng‘iroq',message:'Xabar yuborish',check:'Tasdiqlash',archive:'Arxivlash',user:'Profil',users:'O‘quvchilar',
    plus:'Qo‘shish',filter:'Filtr',search:'Qidirish',download:'Yuklab olish',calendar:'Sana',settings:'Sozlamalar',close:'Yopish',x:'Yopish'
  };

  function labelFor(btn){
    const icon=btn.querySelector('[data-icon]')?.dataset.icon||btn.dataset.icon||'';
    if(iconLabels[icon])return iconLabels[icon];
    if(btn.classList.contains('danger'))return 'O‘chirish';
    if(btn.classList.contains('archive'))return 'Arxivlash';
    return '';
  }

  function enhance(root){
    const scope=root?.matches?.(MODULES)?root:root?.querySelector?.(MODULES);
    if(scope)scope.dataset.edukaNative='v1.2';
    (root?.querySelectorAll?.(`${MODULES} button,${MODULES} a`)||[]).forEach(el=>{
      if(el.dataset.edukaNativeReady)return;
      el.dataset.edukaNativeReady='1';
      const visible=(el.textContent||'').trim();
      if(!visible){
        const label=labelFor(el);
        if(label){if(!el.getAttribute('aria-label'))el.setAttribute('aria-label',label);if(!el.getAttribute('title'))el.setAttribute('title',label)}
      }
    });
    (root?.querySelectorAll?.('.edu-dash-loading,.lead093-loading,.student-loading-v095')||[]).forEach(el=>{el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.setAttribute('aria-busy','true')});
    (root?.querySelectorAll?.('.groups-empty-v094,.student-empty-v095,.fin-empty-v097,.lead093-empty')||[]).forEach(el=>{el.setAttribute('role','status');el.setAttribute('aria-live','polite')});
  }

  function init(){
    enhance(document);
    const content=document.getElementById('content');
    if(!content)return;
    const observer=new MutationObserver(records=>{
      records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===1)enhance(node)}));
    });
    observer.observe(content,{childList:true,subtree:true});
    window.__EDUKA_NATIVE_V12_OBSERVER=observer;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
