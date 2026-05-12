/* Eduka 31.0.3 — Hard Pro UI Override
   Root fix for old UI showing after 10–20s: old app.js still renders legacy content.
   This file makes Pro routes authoritative and hides legacy DOM permanently. */
(function(){
  const VERSION = '31.0.3';
  const ROUTE_VIEW = {
    '/admin/dashboard': 'dashboard',
    '/admin/students': 'students',
    '/admin/teachers': 'teachers',
    '/admin/groups': 'groups',
    '/admin/payments': 'finance',
    '/admin/attendance': 'attendance'
  };
  const PRO_PATHS = Object.keys(ROUTE_VIEW);
  const cleanPath = () => (location.pathname || '/').replace(/\/$/, '') || '/';
  const routeView = () => ROUTE_VIEW[cleanPath()] || null;
  const isProRoute = () => !!routeView() || ['/admin/crm-core-pro','/admin/operations','/admin/schedule','/admin/daily-operations','/admin/finance-pro'].some(p => cleanPath() === p || cleanPath().startsWith(p + '/'));

  function setBodyFlags(){
    if(!document.body) return;
    if(isProRoute()){
      document.documentElement.classList.add('eduka-pro-route');
      document.body.classList.add('eduka-hard-pro-active');
      document.body.dataset.proUiVersion = VERSION;
    }
  }

  function ensureActiveView(){
    const v = routeView();
    if(!v) return;
    document.querySelectorAll('.view.active').forEach(el => { if(el.id !== v) el.classList.remove('active'); });
    const node = document.getElementById(v);
    if(node){
      node.classList.add('active');
      node.hidden = false;
      node.style.display = '';
    }
    document.querySelectorAll('.side-nav button.active').forEach(btn => btn.classList.remove('active'));
    const routeButton = document.querySelector(`.side-nav button[data-route="${cleanPath()}"]`);
    if(routeButton) routeButton.classList.add('active');
  }

  function ensureMount(){
    const v = routeView();
    if(!v) return null;
    const node = document.getElementById(v);
    if(!node) return null;
    let holder = node.querySelector('[data-crm305-mount]');
    if(!holder){
      holder = document.createElement('div');
      holder.setAttribute('data-crm305-mount','hard-override');
      holder.innerHTML = `<div class="eduka-hard-pro-loading">Pro CRM yuklanmoqda...</div>`;
      node.prepend(holder);
    }
    return holder;
  }

  function renderPro(reason){
    if(!routeView()) return;
    setBodyFlags();
    ensureActiveView();
    ensureMount();
    try{
      if(typeof window.__crm305RenderActive === 'function') window.__crm305RenderActive();
    }catch(e){ console.warn('CRM305 render failed', e); }
    window.dispatchEvent(new CustomEvent('eduka:hard-pro-rendered', { detail:{ version: VERSION, reason: reason || 'manual' } }));
  }

  function hardCheck(reason){
    if(!isProRoute()) return;
    setBodyFlags();
    if(routeView()) renderPro(reason);
  }

  function boot(){
    hardCheck('boot');
    const content = document.querySelector('.content');
    if(content){
      const obs = new MutationObserver(() => {
        clearTimeout(window.__edukaHardProTimer);
        window.__edukaHardProTimer = setTimeout(() => hardCheck('mutation'), 25);
      });
      obs.observe(content, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style','hidden'] });
    }
    [50,150,400,900,1800,3200,6000,10000,16000,24000].forEach(ms => setTimeout(() => hardCheck('delayed-'+ms), ms));
  }

  const wrapHistory = (name) => {
    const original = history[name];
    if(!original || original.__edukaHardProPatched) return;
    history[name] = function(){ const r = original.apply(this, arguments); setTimeout(() => hardCheck(name), 20); return r; };
    history[name].__edukaHardProPatched = true;
  };
  wrapHistory('pushState');
  wrapHistory('replaceState');
  window.addEventListener('popstate', () => setTimeout(() => hardCheck('popstate'), 20));
  window.addEventListener('eduka:legacy-render-complete', () => setTimeout(() => hardCheck('legacy-complete'), 10));
  window.addEventListener('eduka:app-ready', () => setTimeout(() => hardCheck('app-ready'), 10));
  window.addEventListener('eduka:force-pro-render', () => setTimeout(() => hardCheck('force'), 10));

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
  window.__edukaHardProOverride = { version: VERSION, render: renderPro, check: hardCheck };
})();
