/* EDUKA CRM v1.1 — bridge legacy feedback into shared UI kit. */
(function(){
  'use strict';
  if(window.__EDUKA_UI_BRIDGE_V11)return;window.__EDUKA_UI_BRIDGE_V11=true;
  if(!window.EDUKA_UI)return;
  const oldToast=window.toast;
  window.toast=function(message,ok=true){
    const text=String(message||'');
    const error=ok===false||/(xato|error|failed|noto.?g.?ri|topilmadi|unauthorized|blok)/i.test(text);
    return window.EDUKA_UI.toast(text,{type:error?'error':'success'});
  };
  window.edukaConfirm=(opts)=>window.EDUKA_UI.confirm(opts);
  window.edukaStateHTML=(type,title,message,actionLabel)=>window.EDUKA_UI.stateHTML(type,title,message,actionLabel);
  window.addEventListener('unhandledrejection',e=>{const msg=e?.reason?.message;if(msg&&!/AbortError/i.test(msg))console.error('EDUKA_UNHANDLED_PROMISE',e.reason)});
  if(typeof oldToast==='function')window.__EDUKA_LEGACY_TOAST=oldToast;
})();
