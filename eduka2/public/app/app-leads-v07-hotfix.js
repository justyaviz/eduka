/* EDUKA CRM v0.7.1 — Leads renderer hotfix. Tenant CRM only; public landing untouched. */
(function(){
  function isLeadsPage(){
    return (window.state && window.state.page === 'leads') || /\/app\/leads\/?$/.test(location.pathname);
  }

  function renderLeadsNow(){
    if(!isLeadsPage()) return;
    if(typeof window.leads !== 'function') return;
    const content=document.getElementById('content');
    if(!content) return;
    try{
      const html=window.leads();
      if(typeof html !== 'string' || !html.trim()) return;
      content.innerHTML=html;
      if(typeof window.renderIcons === 'function') window.renderIcons();
    }catch(error){
      console.error('EDUKA_LEADS_RENDER_HOTFIX',error);
    }
  }

  const originalGo=window.go;
  if(typeof originalGo === 'function'){
    window.go=function(page,push){
      const result=originalGo.apply(this,arguments);
      if(page==='leads') setTimeout(renderLeadsNow,0);
      return result;
    };
  }

  document.addEventListener('DOMContentLoaded',function(){
    const nav=document.getElementById('sideNav');
    if(nav){
      nav.addEventListener('click',function(event){
        const btn=event.target.closest('button[data-page="leads"]');
        if(btn) setTimeout(renderLeadsNow,0);
      });
    }
    if(isLeadsPage()){
      setTimeout(renderLeadsNow,0);
      setTimeout(renderLeadsNow,250);
    }
  });

  window.addEventListener('popstate',function(){setTimeout(renderLeadsNow,0)});
})();
