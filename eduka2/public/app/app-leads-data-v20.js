/* EDUKA Clone v2.0 — Leads pilot for universal DataTable + Filter Engine. */
(function(){
  'use strict';
  if(typeof API==='undefined'||!window.EDUKADataEngine)return;
  const Engine=window.EDUKADataEngine;
  const originalGet=API.get.bind(API);
  let last=null,observer=null,inputTimer=null;
  const isLeads=()=>String(window.state?.page||'').toLowerCase()==='leads'||location.pathname.toLowerCase().endsWith('/app/leads');
  const isTable=()=>localStorage.getItem('eduka_leads_view_v093')==='table'||!!document.querySelector('[data-v093-view="table"].active');
  const refresh=()=>setTimeout(()=>document.querySelector('[data-v093-refresh]')?.click(),0);

  function ensureDefaults(){
    if(!isLeads()||!isTable())return;
    const q=new URLSearchParams(location.search),patch={};
    if(!q.has('page'))patch.page=1;
    if(!q.has('limit'))patch.limit=50;
    if(!q.has('sortBy'))patch.sortBy='createdAt';
    if(!q.has('sortOrder'))patch.sortOrder='desc';
    if(Object.keys(patch).length)Engine.write(patch);
  }

  API.get=async function(url,fallback){
    if(!String(url).startsWith('/api/app/leads-v093')||!isLeads()||!isTable())return originalGet(url,fallback);
    ensureDefaults();
    const state=Engine.read();
    const incoming=new URL(String(url),location.origin);
    const merged={
      q:incoming.searchParams.get('q')||state.q,
      source:incoming.searchParams.get('source')||state.source,
      status:incoming.searchParams.get('status')||state.status,
      assignedTo:incoming.searchParams.get('assignedTo')||state.assignedTo,
      page:state.page,limit:state.limit,sortBy:state.sortBy,sortOrder:state.sortOrder
    };
    const target=Engine.mergeUrl('/api/app/leads-v200',merged);
    const data=await originalGet(target,fallback);
    if(data?.ok!==false&&data){last=data;setTimeout(()=>decorate(),0)}
    return data;
  };

  function syncControls(){
    const s=Engine.read();
    const search=document.getElementById('lead093Search');if(search&&document.activeElement!==search&&search.value!==s.q)search.value=s.q;
    const source=document.getElementById('lead093Source');if(source&&[...source.options].some(x=>x.value===s.source))source.value=s.source;
    const status=document.getElementById('lead093Status');if(status&&[...status.options].some(x=>x.value===s.status))status.value=s.status;
    const assigned=document.getElementById('lead093Assigned');if(assigned&&[...assigned.options].some(x=>x.value===s.assignedTo))assigned.value=s.assignedTo;
  }

  function applySummary(){
    const s=last?.summary;if(!s)return;
    const values=[s.total,s.unworked,s.callbacks,s.won,`${s.conversion}%`];
    document.querySelectorAll('.lead093-metrics .lead093-metric strong').forEach((el,i)=>{const value=String(values[i]??'—');if(el.textContent!==value)el.textContent=value});
    const first=document.querySelector('.lead093-metric small');if(first&&first.textContent!=='Filial/markaz bo‘yicha umumiy')first.textContent='Filial/markaz bo‘yicha umumiy';
  }

  function decorateHeaders(){
    const table=document.querySelector('.lead093-table');if(!table)return;
    const headers=[['Buyurtma','name'],['Telefon','phone'],['Manba','source'],['Holat','status'],['Mas’ul','assignedName'],['Qayta aloqa','nextContactAt'],['Yaratildi','createdAt'],[null,null]];
    const state=Engine.read();
    table.querySelectorAll('thead th').forEach((th,i)=>{
      const [label,key]=headers[i]||[];if(!key||th.dataset.edukaSortReady)return;
      th.dataset.edukaSortReady='1';th.innerHTML=Engine.sortButton(label,key,state);
    });
  }

  function decoratePager(){
    const wrap=document.querySelector('.lead093-table-wrap');if(!wrap||!last?.pagination)return;
    wrap.dataset.edukaV20='1';
    const old=wrap.parentElement?.querySelector(':scope > .eduka-data-pager[data-eduka-pager="leads"]');
    const html=Engine.pager(last.pagination,'leads');
    if(old){if(old.outerHTML!==html)old.outerHTML=html}else wrap.insertAdjacentHTML('afterend',html);
  }

  function decorate(){
    if(!isLeads()||!isTable())return;
    syncControls();applySummary();decorateHeaders();decoratePager();
  }

  document.addEventListener('click',e=>{
    const view=e.target.closest('[data-v093-view]');
    if(view?.dataset.v093View==='table')setTimeout(()=>{ensureDefaults();refresh()},20);
    const sort=e.target.closest('[data-eduka-sort]');
    if(sort&&isLeads()){
      e.preventDefault();e.stopPropagation();
      const s=Engine.read(),key=sort.dataset.edukaSort;
      Engine.write({sortBy:key,sortOrder:s.sortBy===key&&s.sortOrder==='asc'?'desc':'asc',page:1},{replace:false});refresh();return;
    }
    const page=e.target.closest('[data-eduka-page]');
    if(page&&isLeads()&&!page.disabled){
      e.preventDefault();e.stopPropagation();const s=Engine.read();
      Engine.write({page:page.dataset.edukaPage==='next'?s.page+1:Math.max(1,s.page-1)},{replace:false});refresh();
    }
  },true);

  document.addEventListener('change',e=>{
    if(!isLeads())return;
    if(e.target.id==='lead093Source')Engine.write({source:e.target.value},{resetPage:true});
    if(e.target.id==='lead093Status'){Engine.write({status:e.target.value},{resetPage:true});setTimeout(refresh,15)}
    if(e.target.id==='lead093Assigned')Engine.write({assignedTo:e.target.value},{resetPage:true});
  },true);

  document.addEventListener('input',e=>{
    if(!isLeads()||e.target.id!=='lead093Search')return;
    clearTimeout(inputTimer);inputTimer=setTimeout(()=>Engine.write({q:e.target.value.trim()},{resetPage:true}),120);
  },true);

  function init(){
    const content=document.getElementById('content');if(!content)return;
    observer=new MutationObserver(()=>decorate());observer.observe(content,{childList:true,subtree:true});
    ensureDefaults();decorate();
  }
  window.addEventListener('popstate',()=>{if(isLeads()&&isTable())refresh()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
