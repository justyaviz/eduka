/* EDUKA Clone v2.0 — Students on universal DataTable + Filter Engine. */
(function(){
  'use strict';
  if(typeof API==='undefined'||!window.EDUKADataEngine)return;
  const Engine=window.EDUKADataEngine,originalGet=API.get.bind(API);
  const COLUMNS=[
    {key:'student',label:'O‘quvchi',required:true},{key:'phone',label:'Telefon'},{key:'groups',label:'Guruh / kurs'},
    {key:'status',label:'Holat'},{key:'balance',label:'Balans'},{key:'attendance',label:'Davomat'},
    {key:'payment',label:'Oxirgi to‘lov'},{key:'actions',label:'Amallar',required:true}
  ];
  let last=null,observer=null,inputTimer=null;
  const isStudents=()=>String(window.state?.page||'').toLowerCase()==='students'||location.pathname.toLowerCase().endsWith('/app/students');
  const refresh=()=>setTimeout(()=>document.querySelector('[data-v095-tab].active')?.click(),0);
  const currentUrl=()=>new URLSearchParams(location.search);

  function ensureDefaults(){
    if(!isStudents())return;const q=currentUrl(),patch={};
    if(!q.has('page'))patch.page=1;if(!q.has('limit'))patch.limit=50;if(!q.has('sortBy'))patch.sortBy='createdAt';if(!q.has('sortOrder'))patch.sortOrder='desc';if(!q.has('tab'))patch.tab='active';
    if(Object.keys(patch).length)Engine.write(patch);
  }
  API.get=async function(url,fallback){
    if(!String(url).startsWith('/api/app/students-v095')||!isStudents())return originalGet(url,fallback);
    ensureDefaults();
    const state=Engine.read(),incoming=new URL(String(url),location.origin),q=currentUrl(),activeBranch=window.EDUKA_ACTIVE_BRANCH||localStorage.getItem('eduka_active_branch_v083')||'all';
    const merged={q:q.get('q')??incoming.searchParams.get('q')??'',tab:q.get('tab')||incoming.searchParams.get('tab')||'active',groupId:q.get('groupId')??incoming.searchParams.get('groupId')??'',courseId:q.get('courseId')||'',gender:q.get('gender')||'',balance:q.get('balance')??incoming.searchParams.get('balance')??'',branchId:incoming.searchParams.get('branchId')||activeBranch,page:state.page,limit:state.limit,sortBy:state.sortBy,sortOrder:state.sortOrder};
    const data=await originalGet(Engine.mergeUrl('/api/app/students-v200',merged),fallback);if(data?.ok!==false&&data){last=data;setTimeout(decorate,0)}return data;
  };

  function syncControls(){
    if(!isStudents())return;const s=Engine.read(),search=document.getElementById('studentSearchV095');if(search&&document.activeElement!==search&&search.value!==s.q)search.value=s.q;
    [['studentGroupV095',s.groupId],['studentCourseV095',s.courseId],['studentGenderV095',s.gender],['studentBalanceV095',s.balance]].forEach(([id,value])=>{const el=document.getElementById(id);if(el&&[...el.options].some(x=>x.value===value))el.value=value});
    const tab=s.tab||'active';document.querySelectorAll('[data-v095-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.v095Tab===tab));
    const result=document.querySelector('.student-resultbar-v095 span');if(result){const labels={new:'Yangi',active:'Aktiv',archive:'Arxiv',all:'Barcha o‘quvchilar'},prefix=(window.EDUKA_ACTIVE_BRANCH||localStorage.getItem('eduka_active_branch_v083')||'all')==='all'?'Barcha filiallar':'Tanlangan filial';result.textContent=`${prefix} · ${labels[tab]||labels.active}`}
  }
  function decorateTools(){
    const list=document.querySelector('.student-list-v095');if(!list||list.previousElementSibling?.classList.contains('eduka-data-table-tools'))return;
    const tools=document.createElement('div');tools.className='eduka-data-table-tools';tools.innerHTML=Engine.columnsButton('students');list.parentElement.insertBefore(tools,list);if(typeof renderIcons==='function')renderIcons();
  }
  function decorateHeaders(){
    const table=document.querySelector('.student-table-v095');if(!table)return;
    const headers=[['O‘quvchi','name'],['Telefon','phone'],[null,null],['Holat','status'],['Balans','balance'],['Davomat','attendance'],['Oxirgi to‘lov','lastPaymentAt'],[null,null]],state=Engine.read();
    table.querySelectorAll('thead th').forEach((th,i)=>{const [label,key]=headers[i]||[];if(key)th.innerHTML=Engine.sortButton(label,key,state)});Engine.applyColumns(table,'students',COLUMNS);
  }
  function decoratePager(){
    const list=document.querySelector('.student-list-v095');if(!list||!last?.pagination)return;list.dataset.edukaV20='1';
    const total=document.querySelector('.student-resultbar-v095 b');if(total)total.textContent=`${Number(last.pagination.total||0).toLocaleString('uz-UZ')} ta natija`;
    const old=list.parentElement?.querySelector(':scope > .eduka-data-pager[data-eduka-pager="students"]'),html=Engine.pager(last.pagination,'students');
    if(old){if(old.outerHTML!==html)old.outerHTML=html}else list.insertAdjacentHTML('afterend',html);
  }
  function decorate(){if(!isStudents())return;syncControls();decorateTools();decorateHeaders();decoratePager()}

  document.addEventListener('click',e=>{
    if(!isStudents())return;
    const tab=e.target.closest('[data-v095-tab]');if(tab)Engine.write({tab:tab.dataset.v095Tab},{resetPage:true});
    const columns=e.target.closest('[data-eduka-columns-open="students"]');if(columns){e.preventDefault();Engine.openColumns('students',COLUMNS,decorateHeaders);return}
    const sort=e.target.closest('.students-v095 [data-eduka-sort]');if(sort){e.preventDefault();e.stopPropagation();const s=Engine.read(),key=sort.dataset.edukaSort;Engine.write({sortBy:key,sortOrder:s.sortBy===key&&s.sortOrder==='asc'?'desc':'asc',page:1},{replace:false});refresh();return}
    const page=e.target.closest('[data-eduka-pager="students"] [data-eduka-page]');if(page&&!page.disabled){e.preventDefault();e.stopPropagation();const s=Engine.read();Engine.write({page:page.dataset.edukaPage==='next'?s.page+1:Math.max(1,s.page-1)},{replace:false});refresh()}
  },true);
  document.addEventListener('change',e=>{
    if(!isStudents())return;
    if(e.target.matches('[data-eduka-pager="students"] [data-eduka-limit]')){Engine.write({limit:e.target.value,page:1},{replace:false});refresh();return}
    if(e.target.id==='studentGroupV095')Engine.write({groupId:e.target.value},{resetPage:true});
    if(e.target.id==='studentBalanceV095')Engine.write({balance:e.target.value},{resetPage:true});
    if(e.target.id==='studentCourseV095'){Engine.write({courseId:e.target.value},{resetPage:true});setTimeout(refresh,20)}
    if(e.target.id==='studentGenderV095'){Engine.write({gender:e.target.value},{resetPage:true});setTimeout(refresh,20)}
  },true);
  document.addEventListener('input',e=>{if(!isStudents()||e.target.id!=='studentSearchV095')return;clearTimeout(inputTimer);inputTimer=setTimeout(()=>Engine.write({q:e.target.value.trim()},{resetPage:true}),120)},true);
  document.addEventListener('eduka:branch-change',()=>{if(isStudents())Engine.write({page:1})});window.addEventListener('popstate',()=>{if(isStudents())refresh()});
  function init(){const content=document.getElementById('content');if(!content)return;observer=new MutationObserver(decorate);observer.observe(content,{childList:true,subtree:true});ensureDefaults();decorate()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
