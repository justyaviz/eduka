/* EDUKA CRM v0.9.8.2 — settings SPA routing/loader safety. Client panel only. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);

  function isSettingsPath(){
    return location.pathname.replace(/\/+$/,'')==='/app/settings';
  }

  function settleSettings(){
    if(!isSettingsPath())return;
    const started=Date.now();
    const tick=()=>{
      const ready=$('#content .settings-v08');
      if(ready){
        $('#bootLoader')?.classList.add('hide');
        return;
      }
      if(Date.now()-started<6000)setTimeout(tick,100);
    };
    tick();
  }

  document.addEventListener('click',e=>{
    const target=e.target.closest('#sideNav button[data-page="settings"],[data-shell-settings]');
    if(!target)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(window.state)window.state.page='settings';
    history.replaceState(null,'','/app/settings');
    // app-settings-v08 owns the actual rendering. Trigger its existing route observer
    // without forcing a full page navigation/reload.
    const root=$('#content');
    if(root&&!root.querySelector('.settings-v08')){
      root.innerHTML='<div class="settings-toast-note">Sozlamalar yuklanmoqda...</div>';
    }
    setTimeout(settleSettings,0);
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',settleSettings,{once:true});
  else settleSettings();
})();
