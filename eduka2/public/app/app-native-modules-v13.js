/* EDUKA Brandbook v1.3 — passive UX/accessibility bridge for remaining CRM modules. */
(function(){
  'use strict';
  const ROOTS='.tasks-v092,.edu-v096,.reports-v098,.settings-v099';
  const labels={
    edit:'Tahrirlash',pencil:'Tahrirlash',trash:'O‘chirish',delete:'O‘chirish',eye:'Ko‘rish',view:'Ko‘rish',more:'Boshqa amallar',
    phone:'Qo‘ng‘iroq',message:'Xabar yuborish',check:'Bajarildi',archive:'Arxivlash',plus:'Qo‘shish',filter:'Filtr',
    search:'Qidirish',download:'Yuklab olish',calendar:'Sana',settings:'Sozlamalar',close:'Yopish',x:'Yopish',user:'Profil'
  };

  function enhanceNode(root){
    if(!root||root.nodeType!==1)return;
    const scopes=[];
    if(root.matches?.(ROOTS))scopes.push(root);
    root.querySelectorAll?.(ROOTS).forEach(x=>scopes.push(x));
    scopes.forEach(scope=>{
      scope.dataset.edukaNative='v1.3';
      scope.querySelectorAll('button,a').forEach(el=>{
        if(el.dataset.edukaNativeV13)return;
        el.dataset.edukaNativeV13='1';
        const text=(el.textContent||'').replace(/\s+/g,' ').trim();
        const icon=el.querySelector('[data-icon]')?.dataset.icon||el.dataset.icon||'';
        let label=text||labels[icon]||'';
        if(!label&&el.classList.contains('danger'))label='O‘chirish';
        if(!label&&el.classList.contains('done'))label='Bajarildi';
        if(label&&!el.getAttribute('aria-label')&&!text)el.setAttribute('aria-label',label);
        if(label&&!el.getAttribute('title')&&!text)el.setAttribute('title',label);
      });
      scope.querySelectorAll('table').forEach(table=>{
        if(!table.getAttribute('role'))table.setAttribute('role','table');
      });
      scope.querySelectorAll('.tasks-empty-v092,.edu-empty-v096,.r98-empty,.r98-error,.r98-loading,.settings-loading-v099,.settings-alert-v099').forEach(el=>{
        el.setAttribute('role','status');
        el.setAttribute('aria-live','polite');
      });
      scope.querySelectorAll('.r98-loading,.settings-loading-v099').forEach(el=>el.setAttribute('aria-busy','true'));
    });
  }

  function init(){
    enhanceNode(document.body);
    const content=document.getElementById('content');
    if(!content)return;
    const observer=new MutationObserver(records=>{
      records.forEach(r=>r.addedNodes.forEach(n=>enhanceNode(n)));
    });
    observer.observe(content,{childList:true,subtree:true});
    window.__EDUKA_NATIVE_V13_OBSERVER=observer;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
