/* EDUKA Clone v2.0 — universal data state/table engine. Tenant CRM only. */
(function(){
  'use strict';
  const DEFAULTS={page:1,limit:50,sortBy:'createdAt',sortOrder:'desc'};
  const LIMITS=[25,50,100];
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  const safe=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function params(){return new URLSearchParams(location.search)}
  function read(overrides={}){
    const q=params(),d={...DEFAULTS,...overrides};
    return{
      page:clamp(parseInt(q.get('page')||d.page,10)||d.page,1,1000000),
      limit:clamp(parseInt(q.get('limit')||d.limit,10)||d.limit,1,100),
      sortBy:q.get('sortBy')||d.sortBy,
      sortOrder:(q.get('sortOrder')||d.sortOrder)==='asc'?'asc':'desc',
      q:q.get('q')||'',source:q.get('source')||'all',status:q.get('status')||'all',assignedTo:q.get('assignedTo')||'all',
      tab:q.get('tab')||'',groupId:q.get('groupId')||'',courseId:q.get('courseId')||'',teacherId:q.get('teacherId')||'',levelId:q.get('levelId')||'',
      roomId:q.get('roomId')||'',day:q.get('day')||'',groupStatus:q.get('groupStatus')||'',lessonTime:q.get('lessonTime')||'',
      gender:q.get('gender')||'',balance:q.get('balance')||'',branchId:q.get('branchId')||''
    };
  }
  function write(patch,{replace=true,resetPage=false}={}){
    const url=new URL(location.href);
    if(resetPage)url.searchParams.set('page','1');
    Object.entries(patch||{}).forEach(([key,value])=>{
      const empty=value==null||value===''||value==='all';
      if(empty)url.searchParams.delete(key);else url.searchParams.set(key,String(value));
    });
    const next=url.pathname+(url.searchParams.toString()?`?${url.searchParams}`:'')+url.hash;
    history[replace?'replaceState':'pushState'](history.state,'',next);
    return read();
  }
  function mergeUrl(url,extra={}){
    const u=new URL(url,location.origin);
    Object.entries(extra).forEach(([k,v])=>{if(v!=null&&v!==''&&v!=='all')u.searchParams.set(k,String(v));else u.searchParams.delete(k)});
    return u.pathname+(u.searchParams.toString()?`?${u.searchParams}`:'');
  }
  function pager(meta,ns='data'){
    if(!meta)return'';
    const start=meta.total?((meta.page-1)*meta.limit)+1:0,end=Math.min(meta.total,meta.page*meta.limit);
    const limits=[...new Set([...LIMITS,Number(meta.limit||50)])].sort((a,b)=>a-b);
    return `<div class="eduka-data-pager" data-eduka-pager="${safe(ns)}"><div class="eduka-data-pager-info"><b>${start}–${end}</b><span>/ ${Number(meta.total||0)}</span><label>Sahifada <select data-eduka-limit>${limits.map(n=>`<option value="${n}" ${Number(meta.limit)===n?'selected':''}>${n}</option>`).join('')}</select></label></div><div class="eduka-data-pager-actions"><button type="button" data-eduka-page="prev" ${meta.page<=1?'disabled':''} aria-label="Oldingi sahifa">‹</button><span>${meta.page} / ${meta.totalPages}</span><button type="button" data-eduka-page="next" ${meta.page>=meta.totalPages?'disabled':''} aria-label="Keyingi sahifa">›</button></div></div>`;
  }
  function sortButton(label,key,state){
    const active=state.sortBy===key,dir=active?state.sortOrder:'';
    return `<button type="button" class="eduka-data-sort ${active?'active':''}" data-eduka-sort="${safe(key)}" aria-label="${safe(label)} bo‘yicha saralash"><span>${safe(label)}</span><i>${active?(dir==='asc'?'↑':'↓'):'↕'}</i></button>`;
  }
  function storageKey(ns){return`eduka_columns_${String(ns||'data')}_v20`}
  function getColumns(ns,columns){
    const all=(columns||[]).map(c=>c.key);
    try{
      const saved=JSON.parse(localStorage.getItem(storageKey(ns))||'null');
      if(!Array.isArray(saved))return new Set(all);
      const valid=new Set(saved.filter(k=>all.includes(k)));
      (columns||[]).filter(c=>c.required).forEach(c=>valid.add(c.key));
      return valid.size?valid:new Set(all);
    }catch(_){return new Set(all)}
  }
  function setColumns(ns,visible){localStorage.setItem(storageKey(ns),JSON.stringify([...visible]))}
  function applyColumns(table,ns,columns){
    if(!table)return;
    const visible=getColumns(ns,columns);
    (columns||[]).forEach((col,i)=>{
      const show=visible.has(col.key);
      table.querySelectorAll(`tr > *:nth-child(${i+1})`).forEach(el=>{el.hidden=!show;el.classList.toggle('eduka-col-hidden',!show)});
    });
    table.dataset.edukaColumns=ns;
  }
  function columnsButton(ns,label='Ustunlar'){return `<button type="button" class="eduka-data-columns-btn" data-eduka-columns-open="${safe(ns)}"><span data-icon="settings"></span>${safe(label)}</button>`}
  function openColumns(ns,columns,onChange){
    document.getElementById('edukaDataColumnsModal')?.remove();
    const visible=getColumns(ns,columns);
    const modal=document.createElement('div');modal.id='edukaDataColumnsModal';modal.className='eduka-columns-backdrop';
    modal.innerHTML=`<section class="eduka-columns-card" role="dialog" aria-modal="true" aria-labelledby="edukaColumnsTitle"><header><div><small>JADVAL SOZLAMASI</small><h3 id="edukaColumnsTitle">Ko‘rinadigan ustunlar</h3></div><button type="button" data-eduka-columns-close aria-label="Yopish">×</button></header><div class="eduka-columns-list">${(columns||[]).map(c=>`<label><input type="checkbox" value="${safe(c.key)}" ${visible.has(c.key)?'checked':''} ${c.required?'disabled':''}><span><b>${safe(c.label)}</b>${c.required?'<small>Majburiy</small>':''}</span></label>`).join('')}</div><footer><button type="button" data-eduka-columns-reset>Standart</button><button type="button" class="primary" data-eduka-columns-save>Saqlash</button></footer></section>`;
    document.body.appendChild(modal);
    const close=()=>modal.remove();
    modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-eduka-columns-close]'))close()});
    modal.querySelector('[data-eduka-columns-reset]').onclick=()=>{localStorage.removeItem(storageKey(ns));close();onChange?.()};
    modal.querySelector('[data-eduka-columns-save]').onclick=()=>{
      const next=new Set([...modal.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value));
      (columns||[]).filter(c=>c.required).forEach(c=>next.add(c.key));setColumns(ns,next);close();onChange?.();
    };
    modal.querySelector('input:not(:disabled)')?.focus();
  }
  window.EDUKADataEngine={DEFAULTS,LIMITS,read,write,mergeUrl,pager,sortButton,getColumns,setColumns,applyColumns,columnsButton,openColumns};
})();
