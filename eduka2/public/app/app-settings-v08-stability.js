/* EDUKA CRM settings stability hotfix — neutralizes legacy settings MutationObserver loop. Landing untouched. */
(function(){
  let lastDetach=0;

  function isSettingsTarget(el){
    return !!el?.closest?.('#sideNav [data-page="settings"], [data-shell-settings]');
  }

  function detachLegacySettingsObserver(){
    const root=document.getElementById('content');
    if(!root||root.dataset.settingsStableRoot==='1') return root;
    const clone=root.cloneNode(true);
    clone.dataset.settingsStableRoot='1';
    root.replaceWith(clone);
    lastDetach=Date.now();
    return clone;
  }

  // Direct /app/settings load: legacy listener attaches its observer first on DOMContentLoaded.
  // Our listener runs after it and replaces the observed node before its delayed render/load starts.
  document.addEventListener('DOMContentLoaded',()=>{
    const path=location.pathname.replace(/\/+$/,'').toLowerCase();
    if(path==='/app/settings'||path==='/app/general-settings'){
      detachLegacySettingsObserver();
    }
  });

  // Mouse/touch navigation: detach before the click handler renders the settings placeholder.
  document.addEventListener('pointerdown',e=>{
    if(isSettingsTarget(e.target)) detachLegacySettingsObserver();
  },true);

  // Keyboard navigation fallback.
  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&isSettingsTarget(e.target)) detachLegacySettingsObserver();
  },true);

  // Programmatic navigation (global search / other modules).
  const wrapGo=()=>{
    if(typeof window.go!=='function'||window.go.__settingsStableWrapped) return false;
    const original=window.go;
    const wrapped=function(page,...args){
      if(String(page||'').toLowerCase()==='settings') detachLegacySettingsObserver();
      return original.call(this,page,...args);
    };
    wrapped.__settingsStableWrapped=true;
    window.go=wrapped;
    return true;
  };
  if(!wrapGo()){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(wrapGo()||tries>30) clearInterval(timer);
    },100);
  }

  // Safety: if legacy placeholder survives unusually long, trigger one clean settings navigation,
  // without reloading the whole CRM shell.
  setInterval(()=>{
    const path=location.pathname.replace(/\/+$/,'').toLowerCase();
    if(path!=='/app/settings'&&path!=='/app/general-settings') return;
    const root=document.getElementById('content');
    if(!root) return;
    const stuck=root.textContent?.includes('Sozlamalar yuklanmoqda')&&!root.querySelector('.settings-v08');
    if(stuck&&Date.now()-lastDetach>1200){
      detachLegacySettingsObserver();
      if(window.state) window.state.page='settings';
      // Let the existing settings module's delayed loader/render complete on the fresh root.
    }
  },1500);
})();
