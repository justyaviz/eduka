/* EDUKA UI Kit v1.1 — shared feedback helpers for CRM/CEO. */
(function(){
  'use strict';
  if(window.EDUKA_UI)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function stack(){let x=document.querySelector('.eduka-ui-toast-stack');if(x)return x;x=document.createElement('div');x.className='eduka-ui-toast-stack';x.setAttribute('aria-live','polite');document.body.appendChild(x);return x}
  function toast(message,opts={}){
    const type=opts.type||'info';
    const title=opts.title||(type==='success'?'Muvaffaqiyatli':type==='error'?'Xatolik':type==='warning'?'Diqqat':'EDUKA');
    const icon=type==='success'?'✓':type==='error'?'!':type==='warning'?'!':'i';
    const el=document.createElement('div');el.className=`eduka-ui-toast ${type}`;el.innerHTML=`<div class="eduka-ui-toast-icon">${icon}</div><div class="eduka-ui-toast-copy"><b>${esc(title)}</b><span>${esc(message)}</span></div><button class="eduka-ui-toast-close" type="button" aria-label="Yopish">×</button>`;
    const remove=()=>{if(!el.isConnected)return;el.classList.add('is-leaving');setTimeout(()=>el.remove(),190)};
    el.querySelector('button').onclick=remove;stack().appendChild(el);setTimeout(remove,Number(opts.duration||3500));return el;
  }
  function stateHTML(type,title,message,actionLabel='Qayta urinish'){
    const icon=type==='error'?'!':type==='empty'?'—':'…';
    return `<div class="eduka-ui-state ${esc(type)}"><div class="eduka-ui-state-inner"><div class="eduka-ui-state-icon">${icon}</div><h3>${esc(title)}</h3><p>${esc(message)}</p>${actionLabel?`<div class="eduka-ui-state-actions"><button class="eduka-ui-btn primary" type="button" data-eduka-state-action>${esc(actionLabel)}</button></div>`:''}</div></div>`;
  }
  function confirmDialog(opts={}){
    return new Promise(resolve=>{
      const back=document.createElement('div');back.className='eduka-ui-confirm-backdrop';
      const danger=opts.danger===true;back.innerHTML=`<section class="eduka-ui-confirm ${danger?'danger':''}" role="dialog" aria-modal="true"><div class="eduka-ui-confirm-icon">${danger?'!':'?'}</div><h3>${esc(opts.title||'Tasdiqlaysizmi?')}</h3><p>${esc(opts.message||'Bu amalni davom ettirmoqchimisiz?')}</p><div class="eduka-ui-confirm-actions"><button type="button" class="eduka-ui-btn" data-cancel>${esc(opts.cancelText||'Bekor qilish')}</button><button type="button" class="eduka-ui-btn ${danger?'danger':'primary'}" data-confirm>${esc(opts.confirmText||'Tasdiqlash')}</button></div></section>`;
      const done=v=>{back.remove();resolve(v)};back.querySelector('[data-cancel]').onclick=()=>done(false);back.querySelector('[data-confirm]').onclick=()=>done(true);back.addEventListener('click',e=>{if(e.target===back)done(false)});document.addEventListener('keydown',function onKey(e){if(e.key==='Escape'){document.removeEventListener('keydown',onKey);done(false)}},{once:true});document.body.appendChild(back);back.querySelector('[data-confirm]').focus();
    });
  }
  function startProgress(){let p=document.querySelector('.eduka-ui-progress');if(!p){p=document.createElement('div');p.className='eduka-ui-progress';p.innerHTML='<i></i>';document.body.appendChild(p)}return p}
  function stopProgress(){document.querySelector('.eduka-ui-progress')?.remove()}
  window.EDUKA_UI={toast,stateHTML,confirm:confirmDialog,startProgress,stopProgress};
})();
