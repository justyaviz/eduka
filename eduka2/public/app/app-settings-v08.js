/* EDUKA CRM v0.9.9 Settings bootstrap — legacy controller removed. */
(function(){
  'use strict';
  if(window.__EDUKA_SETTINGS_V099_BOOTSTRAPPED)return;
  window.__EDUKA_SETTINGS_V099_BOOTSTRAPPED=true;
  const s=document.createElement('script');
  s.src='/app/app-settings-edutizim-v099.js?v=0.9.9-'+Date.now();
  s.async=false;
  s.onerror=()=>{
    const root=document.getElementById('content');
    if(/^\/app\/(settings|general-settings)\/?$/i.test(location.pathname)&&root){
      root.innerHTML='<div style="padding:20px;background:#fff5f5;border:1px solid #fecaca;border-radius:10px;color:#b42318">Sozlamalar modulini yuklab bo‘lmadi. Sahifani qayta yangilang.</div>';
    }
  };
  document.head.appendChild(s);
})();
