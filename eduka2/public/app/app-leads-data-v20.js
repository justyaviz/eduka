/* EDUKA Clone v2.0 — Leads on universal DataTable + Filter Engine. */
(function(){
  'use strict';
  if(typeof API==='undefined'||!window.EDUKADataEngine)return;
  const Engine=window.EDUKADataEngine,originalGet=API.get.bind(API);
  const COLUMNS=[
    {key:'lead',label:'Buyurtma',required:true},{key:'phone',label:'Telefon'},{key:'source',label:'Manba'},
    {key:'status',label:'Holat'},{key:'assigned',label:'Mas’ul'},{key:'callback',label:'Qayta aloqa'},
    {key:'created',label:'Yaratildi'},{key:'actions',label:'Amal',required:true}
  ];
  let last=null,observer=null,inputTimer=null;
  const isLeads=()=>String(window.state?.page||'').toLowerCase()==='leads'||location.pathname.toLowerCase().endsWith('/app/leads');
  const isTable=()=>localStorage.getItem('eduka_leads_view_v093')==='table'||!!document.querySelector('[data-v093-view="table"].active');
  const refresh=()=>setTimeout(()=>document.querySelector('[data-v093-refresh]')?.click(),0);

  function ensureDefaults(){
    if(!isLeads()||!isTable())return;
    const q=new URLSearchParams(location.search),patch={};
    if(!q.has('page'))patch.page=1;if(!q.has('limit'))patch.limit=50;if(!q.has('sortBy'))patch.sortBy='createdAt';if(!q.has('sortOrder'))patch.sortOrder='desc';
    if(Object.keys(patch).length)Engine.write(patch);
  }

  API.get=async function(url,fallback){
    if(!String(url).startsWith('/api/app/leads-v093')||!isLeads()||!isTable())return originalGet(url,fallback);
    ensureDefaults();
    const state=Engine.read(),incoming=new URL(String(url),location.origin);
    const merged={q:incoming.searchParams.get('q')||state.q,source:incoming.searchParams.get('source')||state.source,status:incoming.searchParams.get('status')||state.status,assignedTo:incoming.searchParams.get('assignedTo')||state.assignedTo,page:state.page,limit:state.limit,sortBy:state.sortBy,sortOrder:state.sortOrder};
    const data=await originalGet(Engine.mergeUrl('/api/app/leads-v200',merged),fallback);
    if(data?.ok!==false&&data){last=data;setTimeout(decorate,0)}return data;
  };

  function syncControls(){
    const s=Engine.read(),search=document.getElementById('lead093Search');if(search&&document.activeElement!==search&&search.value!==s.q)search.value=s.q;
    [['lead093Source',s.source],['lead093Status',s.status],['lead093Assigned',s.assignedTo]].forEach(([id,value])=>{const el=document.getElementById(id);if(el&&[...el.options].some(x=>x.value===value))el.value=value});
  }
  function applySummary(){
    const s=last?.summary;if(!s)return;const values=[s.total,s.unworked,s.callbacks,s.won,`${s.conversion}%`];
    document.querySelectorAll('.lead093-metrics .lead093-metric strong').forEach((el,i)=>{const value=String(values[i]??'—');if(el.textContent!==value)el.textContent=value});
    const first=document.querySelector('.lead093-metric small');if(first)first.textContent='Filial/markaz bo‘yicha umumiy';
  }
  function decorateToolbar(){
    const actions=document.querySelector('.lead093-head-actions');if(!actions||actions.querySelector('[data-eduka-columns-open="leads"]'))return;
    const holder=document.createElement('div');holder.innerHTML=Engine.columnsButton('leads');actions.insertBefore(holder.firstElementChild,actions.querySelector('.lead093-add'));
    if(typeof renderIcons==='function')renderIcons();
  }
  function decorateHeaders(){
    const table=document.querySelector('.lead093-table');if(!table)return;
    const headers=[['Buyurtma','name'],['Telefon','phone'],['Manba','source'],['Holat','status'],['Mas’ul','assignedName'],['Qayta aloqa','nextContactAt'],['Yaratildi','createdAt'],[null,null]],state=Engine.read();
    table.querySelectorAll('thead th').forEach((th,i)=>{const [label,key]=headers[i]||[];if(!key)return;th.innerHTML=Engine.sortButton(label,key,state)});
    Engine.applyColumns(table,'leads',COLUMNS);
  }
  function decoratePager(){
    const wrap=document.querySelector('.lead093-table-wrap');if(!wrap||!last?.pagination)return;wrap.dataset.edukaV20='1';
    const old=wrap.parentElement?.querySelector(':scope > .eduka-data-pager[data-eduka-pager="leads"]'),html=Engine.pager(last.pagination,'leads');
    if(old){if(old.outerHTML!==html)old.outerHTML=html}else wrap.insertAdjacentHTML('afterend',html);
  }
  function decorate(){if(!isLeads()||!isTable())return;syncControls();applySummary();decorateToolbar();decorateHeaders();decoratePager()}

  document.addEventListener('click',e=>{
    const view=e.target.closest('[data-v093-view]');if(view?.dataset.v093View==='table')setTimeout(()=>{ensureDefaults();refresh()},20);
    const columns=e.target.closest('[data-eduka-columns-open="leads"]');if(columns&&isLeads()){e.preventDefault();Engine.openColumns('leads',COLUMNS,()=>decorateHeaders());return}
    const sort=e.target.closest('.leads093 [data-eduka-sort]');if(sort&&isLeads()){
      e.preventDefault();e.stopPropagation();const s=Engine.read(),key=sort.dataset.edukaSort;
      Engine.write({sortBy:key,sortOrder:s.sortBy===key&&s.sortOrder==='asc'?'desc':'asc',page:1},{replace:false});refresh();return;
    }
    const page=e.target.closest('[data-eduka-pager="leads"] [data-eduka-page]');if(page&&isLeads()&&!page.disabled){e.preventDefault();e.stopPropagation();const s=Engine.read();Engine.write({page:page.dataset.edukaPage==='next'?s.page+1:Math.max(1,s.page-1)},{replace:false});refresh()}
  },true);

  document.addEventListener('change',e=>{
    if(!isLeads())return;
    if(e.target.matches('[data-eduka-pager="leads"] [data-eduka-limit]')){Engine.write({limit:e.target.value,page:1},{replace:false});refresh();return}
    if(e.target.id==='lead093Source')Engine.write({source:e.target.value},{resetPage:true});
    if(e.target.id==='lead093Status'){Engine.write({status:e.target.value},{resetPage:true});setTimeout(refresh,15)}
    if(e.target.id==='lead093Assigned')Engine.write({assignedTo:e.target.value},{resetPage:true});
  },true);
  document.addEventListener('input',e=>{if(!isLeads()||e.target.id!=='lead093Search')return;clearTimeout(inputTimer);inputTimer=setTimeout(()=>Engine.write({q:e.target.value.trim()},{resetPage:true}),120)},true);

  function init(){const content=document.getElementById('content');if(!content)return;observer=new MutationObserver(decorate);observer.observe(content,{childList:true,subtree:true});ensureDefaults();decorate()}
  window.addEventListener('popstate',()=>{if(isLeads()&&isTable())refresh()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
