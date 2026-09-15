/* EDUKA CRM v0.9.8.4 — cache-safe API + settings stability. Client panel only; landing untouched. */
(function(){
  if(typeof API!=='undefined'){
    API.get=async function(url,fallback){
      try{
        const sep=String(url).includes('?')?'&':'?';
        const requestUrl=`${url}${sep}__eduka_ts=${Date.now()}`;
        const r=await fetch(requestUrl,{headers:this.headers(),cache:'no-store'});
        const text=await r.text();
        let data=fallback;
        if(text){
          try{data=JSON.parse(text)}catch(e){
            console.error('API_GET_JSON_ERROR',url,r.status,text.slice(0,160));
            return fallback;
          }
        }
        if(!r.ok){
          console.error('API_GET_HTTP_ERROR',url,r.status,data);
          return data||fallback;
        }
        return data??fallback;
      }catch(e){
        console.error('API_GET_ERROR',url,e);
        return fallback;
      }
    };
  }

  const isSettingsPath=()=>{
    const p=location.pathname.replace(/\/+$/,'').toLowerCase();
    return p==='/app/settings'||p==='/app/general-settings';
  };

  const isSettingsTarget=(el)=>!!el?.closest?.('#sideNav [data-page="settings"], [data-shell-settings]');

  function detachLegacySettingsObserver(){
    const root=document.getElementById('content');
    if(!root) return null;
    const clone=root.cloneNode(true);
    clone.dataset.settingsStableRoot=String(Date.now());
    root.replaceWith(clone);
    return clone;
  }

  function normalizeSettingsIds(){
    const root=document.getElementById('content');
    if(!root) return;
    root.querySelectorAll('[id]').forEach(el=>{
      if(String(el.id).startsWith('#')) el.id=el.id.slice(1);
    });
  }

  function normalizeSoon(){
    [0,80,250,600,1200].forEach(ms=>setTimeout(normalizeSettingsIds,ms));
  }

  // Legacy settings v0.8 creates a MutationObserver on #content. When data is not loaded yet,
  // it repeatedly renders the loading placeholder forever. Replace the observed node only when
  // entering Settings, so that observer remains attached to a detached node and cannot loop.
  document.addEventListener('pointerdown',e=>{
    if(isSettingsTarget(e.target)) detachLegacySettingsObserver();
  },true);

  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&isSettingsTarget(e.target)) detachLegacySettingsObserver();
  },true);

  // This listener is registered before app-settings-v08.js, therefore it normalizes malformed
  // legacy ids (id="#v08_name") before Save/section handlers read them.
  document.addEventListener('click',e=>{
    if(isSettingsTarget(e.target)) normalizeSoon();
    if(e.target.closest?.('[data-v08-section],[data-v08-save]')){
      normalizeSettingsIds();
      normalizeSoon();
    }
  },true);

  function wrapGo(){
    const current=window.go;
    if(typeof current!=='function'||current.__edukaSettingsStable) return;
    const wrapped=function(page,...args){
      if(String(page||'').toLowerCase()==='settings') detachLegacySettingsObserver();
      const result=current.call(this,page,...args);
      if(String(page||'').toLowerCase()==='settings') normalizeSoon();
      return result;
    };
    wrapped.__edukaSettingsStable=true;
    window.go=wrapped;
  }

  // Direct /app/settings opening: app-settings registers its observer during DOMContentLoaded.
  // Run on the next task, after all DOMContentLoaded listeners have attached, but before its
  // delayed 500ms initial settings render/load.
  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{
      if(isSettingsPath()){
        detachLegacySettingsObserver();
        normalizeSoon();
      }
      wrapGo();
    },0);
    setTimeout(wrapGo,700);
    setTimeout(wrapGo,1800);
  });
})();
