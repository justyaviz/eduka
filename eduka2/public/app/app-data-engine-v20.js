/* EDUKA Clone v2.0 — universal data state engine. Tenant CRM only. */
(function(){
  'use strict';
  const DEFAULTS={page:1,limit:50,sortBy:'createdAt',sortOrder:'desc'};
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  function params(){return new URLSearchParams(location.search)}
  function read(overrides={}){
    const q=params();
    const d={...DEFAULTS,...overrides};
    return{
      page:clamp(parseInt(q.get('page')||d.page,10)||d.page,1,1000000),
      limit:clamp(parseInt(q.get('limit')||d.limit,10)||d.limit,1,100),
      sortBy:q.get('sortBy')||d.sortBy,
      sortOrder:(q.get('sortOrder')||d.sortOrder)==='asc'?'asc':'desc',
      q:q.get('q')||'',source:q.get('source')||'all',status:q.get('status')||'all',assignedTo:q.get('assignedTo')||'all'
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
    const start=meta.total?((meta.page-1)*meta.limit)+1:0;
    const end=Math.min(meta.total,meta.page*meta.limit);
    return `<div class="eduka-data-pager" data-eduka-pager="${ns}"><div><b>${start}–${end}</b><span>/ ${meta.total}</span><em>${meta.limit} ta / sahifa</em></div><div class="eduka-data-pager-actions"><button type="button" data-eduka-page="prev" ${meta.page<=1?'disabled':''} aria-label="Oldingi sahifa">‹</button><span>${meta.page} / ${meta.totalPages}</span><button type="button" data-eduka-page="next" ${meta.page>=meta.totalPages?'disabled':''} aria-label="Keyingi sahifa">›</button></div></div>`;
  }
  function sortButton(label,key,state){
    const active=state.sortBy===key,dir=active?state.sortOrder:'';
    return `<button type="button" class="eduka-data-sort ${active?'active':''}" data-eduka-sort="${key}" aria-label="${label} bo‘yicha saralash"><span>${label}</span><i>${active?(dir==='asc'?'↑':'↓'):'↕'}</i></button>`;
  }
  window.EDUKADataEngine={DEFAULTS,read,write,mergeUrl,pager,sortButton};
})();
