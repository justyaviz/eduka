/* EDUKA CRM v0.9.8.1 — settings navigation hotfix. Tenant client panel only. */
(function(){
  function openSettings(event){
    const target=event.target.closest('#sideNav button[data-page="settings"],[data-shell-settings]');
    if(!target)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if(location.pathname!=='/app/settings') location.assign('/app/settings');
    else location.reload();
  }
  document.addEventListener('click',openSettings,true);
})();
