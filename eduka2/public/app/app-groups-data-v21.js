/* EDUKA Clone v2.1 — Groups parity adapter. Tenant CRM only. */
(function(){
  'use strict';
  if(!window.EDUKADataEngine)return;
  const Engine=window.EDUKADataEngine;
  const COLUMNS=[
    {key:'group',label:'Guruh',required:true},{key:'branch',label:'Filial'},{key:'course',label:'Kurs / daraja'},
    {key:'teacher',label:'O‘qituvchi'},{key:'schedule',label:'Jadval'},{key:'room',label:'Xona'},
    {key:'students',label:'O‘quvchi'},{key:'type',label:'Tur'},{key:'actions',label:'Amal',required:true}
  ];
  const HEADER_SORT=[['Guruh','name'],['Filial','branchName'],['Kurs / daraja','courseName'],['O‘qituvchi','teacherName'],['Jadval','lessonTime'],['Xona','roomName'],['O‘quvchi','studentCount'],['Tur','groupType'],[null,null]];
  let observer=null,queued=false,inputTimer=null;
  const isGroups=()=>String(window.state?.page||'').toLowerCase()==='groups'||/\/app\/groups\/?$/i.test(location.pathname);
  const rows=()=>Array.isArray(window.state?.groups)?window.state.groups:[];
  const normTime=v=>String(v||'').slice(0,5);
  const text=v=>String(v||'').toLocaleLowerCase('uz');
  const unique=(items,key,label)=>{const map=new Map();items.forEach(x=>{const k=x?.[key];if(k!=null&&k!==''&&!map.has(String(k)))map.set(String(k),String(x?.[label]||k))});return [...map.entries()].sort((a,b)=>a[1].localeCompare(b[1],'uz'))};

  function ensureDefaults(){
    if(!isGroups())return;const q=new URLSearchParams(location.search),patch={};
    if(!q.has('page'))patch.page=1;if(!q.has('limit'))patch.limit=50;if(!q.has('sortBy'))patch.sortBy='createdAt';if(!q.has('sortOrder'))patch.sortOrder='desc';
    if(Object.keys(patch).length)Engine.write(patch);
  }
  function stateNow(){return Engine.read({sortBy:'createdAt',sortOrder:'desc'})}
  function setIfExists(id,value){const el=document.getElementById(id);if(!el)return;const v=value==null?'':String(value);if([...el.options||[]].some(x=>x.value===v)||el.tagName==='INPUT')el.value=v}
  function syncExistingControls(){
    const s=stateNow();
    const search=document.getElementById('groupSearchV094');if(search&&document.activeElement!==search)search.value=s.q||'';
    setIfExists('groupBranchV094',s.branchId||'all');setIfExists('groupCourseV094',s.courseId||'all');setIfExists('groupTeacherV094',s.teacherId||'all');setIfExists('groupLevelV094',s.levelId||'all');
  }
  function advancedMarkup(){
    const s=stateNow(),all=rows(),rooms=unique(all,'roomId','roomName'),statuses=[...new Set(all.map(x=>String(x.status||'active')).filter(Boolean))].sort(),times=[...new Set(all.map(x=>normTime(x.lessonTime)).filter(Boolean))].sort();
    const statusLabel=v=>v==='active'?'Aktiv':v==='paused'?'Muzlatilgan':v==='archived'?'Arxiv':v;
    return `<div class="eduka-groups-filter-v21" data-groups-v21-filter>
      <select data-g21-room><option value="">Barcha xonalar</option>${rooms.map(([id,name])=>`<option value="${id}" ${s.roomId===id?'selected':''}>${name}</option>`).join('')}</select>
      <select data-g21-day><option value="">Barcha kunlar</option>${['Du','Se','Chor','Pa','Ju','Sha','Yak'].map(v=>`<option value="${v}" ${s.day===v?'selected':''}>${v}</option>`).join('')}</select>
      <select data-g21-status><option value="">Barcha holatlar</option>${statuses.map(v=>`<option value="${v}" ${s.groupStatus===v?'selected':''}>${statusLabel(v)}</option>`).join('')}</select>
      <select data-g21-time><option value="">Barcha vaqtlar</option>${times.map(v=>`<option value="${v}" ${normTime(s.lessonTime)===v?'selected':''}>${v}</option>`).join('')}</select>
      ${Engine.columnsButton('groups')}
      <button type="button" class="eduka-groups-reset-v21" data-g21-reset>Filtrlarni tozalash</button>
    </div>`;
  }
  function decorateFilters(){
    const toolbar=document.querySelector('.groups-toolbar-v094');if(!toolbar)return;
    let adv=document.querySelector('[data-groups-v21-filter]');
    const html=advancedMarkup();
    if(!adv){toolbar.insertAdjacentHTML('afterend',html);if(typeof renderIcons==='function')renderIcons()}
    else if(document.activeElement?.closest?.('[data-groups-v21-filter]')==null&&adv.outerHTML!==html)adv.outerHTML=html;
  }
  function sortValue(g,key){
    if(key==='studentCount')return Number(g.studentCount||0);
    if(key==='createdAt')return g.createdAt?new Date(g.createdAt).getTime():0;
    if(key==='lessonTime')return normTime(g.lessonTime);
    return text(g?.[key]);
  }
  function compare(a,b,key,order){
    const av=sortValue(a,key),bv=sortValue(b,key),dir=order==='asc'?1:-1;
    if(typeof av==='number'&&typeof bv==='number')return(av-bv)*dir;
    return String(av).localeCompare(String(bv),'uz',{numeric:true,sensitivity:'base'})*dir;
  }
  function match(g,s){
    const q=text(s.q);
    if(q&&![g.name,g.courseName,g.teacherName,g.roomName,g.branchName,g.levelName,g.days].some(v=>text(v).includes(q)))return false;
    if(s.branchId&&s.branchId!=='all'&&String(g.branchId||'')!==s.branchId)return false;
    if(s.courseId&&String(g.courseId||'')!==s.courseId)return false;
    if(s.teacherId&&String(g.teacherId||'')!==s.teacherId)return false;
    if(s.levelId&&String(g.levelId||'')!==s.levelId)return false;
    if(s.roomId&&String(g.roomId||'')!==s.roomId)return false;
    if(s.groupStatus&&String(g.status||'active')!==s.groupStatus)return false;
    if(s.lessonTime&&normTime(g.lessonTime)!==normTime(s.lessonTime))return false;
    if(s.day){const days=String(g.days||'').split(',').map(x=>x.trim());if(!days.includes(s.day))return false}
    return true;
  }
  function decorateTable(){
    const wrap=document.querySelector('.groups-table-wrap-v094'),table=wrap?.querySelector('.groups-table-v094');if(!wrap||!table)return;
    const s=stateNow(),all=rows(),byId=new Map(all.map(g=>[String(g.id),g]));
    table.querySelectorAll('thead th').forEach((th,i)=>{const [label,key]=HEADER_SORT[i]||[];if(!key)return;const sig=`${key}:${s.sortBy}:${s.sortOrder}`;if(th.dataset.edukaSortSig!==sig){th.dataset.edukaSortSig=sig;th.innerHTML=Engine.sortButton(label,key,s)}});
    Engine.applyColumns(table,'groups',COLUMNS);
    const domRows=[...table.querySelectorAll('tbody tr')],mapped=domRows.map(row=>{const id=row.querySelector('[data-v094-open]')?.dataset.v094Open;return{id:String(id||''),row,g:byId.get(String(id||''))}}).filter(x=>x.g);
    const filtered=mapped.filter(x=>match(x.g,s)).sort((a,b)=>compare(a.g,b.g,s.sortBy,s.sortOrder));
    const total=filtered.length,totalPages=Math.max(1,Math.ceil(total/s.limit)),page=Math.min(s.page,totalPages),start=(page-1)*s.limit,end=start+s.limit,visible=new Set(filtered.slice(start,end).map(x=>x.id));
    if(page!==s.page)Engine.write({page});
    mapped.forEach(x=>{x.row.hidden=!visible.has(x.id)});
    const tbody=table.tBodies[0],current=[...tbody.children].filter(r=>visible.has(String(r.querySelector('[data-v094-open]')?.dataset.v094Open||''))).map(r=>String(r.querySelector('[data-v094-open]')?.dataset.v094Open||'')),desired=filtered.slice(start,end).map(x=>x.id);
    if(current.join('|')!==desired.join('|'))desired.forEach(id=>{const item=mapped.find(x=>x.id===id);if(item)tbody.appendChild(item.row)});
    table.hidden=total===0;
    let empty=wrap.querySelector('.eduka-groups-empty-v21');if(total===0&&!empty){wrap.insertAdjacentHTML('beforeend','<div class="eduka-groups-empty-v21"><b>Filtrga mos guruh topilmadi</b><span>Filtrlarni o‘zgartiring yoki tozalang.</span></div>')}else if(total>0&&empty)empty.remove();
    const meta={page,limit:s.limit,total,totalPages,sortBy:s.sortBy,sortOrder:s.sortOrder};let pager=wrap.parentElement?.querySelector(':scope > .eduka-data-pager[data-eduka-pager="groups"]'),html=Engine.pager(meta,'groups');
    wrap.dataset.edukaV21='1';if(pager){if(pager.outerHTML!==html)pager.outerHTML=html}else wrap.insertAdjacentHTML('afterend',html);
  }
  function decorate(){if(!isGroups())return;syncExistingControls();decorateFilters();decorateTable()}
  function schedule(){if(queued)return;queued=true;setTimeout(()=>{queued=false;decorate()},0)}

  document.addEventListener('input',e=>{
    if(!isGroups()||e.target.id!=='groupSearchV094')return;clearTimeout(inputTimer);inputTimer=setTimeout(()=>{Engine.write({q:e.target.value.trim()},{resetPage:true});schedule()},100)
  },true);
  document.addEventListener('change',e=>{
    if(!isGroups())return;
    const map={groupBranchV094:'branchId',groupCourseV094:'courseId',groupTeacherV094:'teacherId',groupLevelV094:'levelId'};
    if(map[e.target.id]){Engine.write({[map[e.target.id]]:e.target.value},{resetPage:true});schedule();return}
    if(e.target.matches('[data-g21-room]'))Engine.write({roomId:e.target.value},{resetPage:true});
    else if(e.target.matches('[data-g21-day]'))Engine.write({day:e.target.value},{resetPage:true});
    else if(e.target.matches('[data-g21-status]'))Engine.write({groupStatus:e.target.value},{resetPage:true});
    else if(e.target.matches('[data-g21-time]'))Engine.write({lessonTime:e.target.value},{resetPage:true});
    else if(e.target.matches('[data-eduka-pager="groups"] [data-eduka-limit]'))Engine.write({limit:e.target.value,page:1},{replace:false});else return;schedule();
  },true);
  document.addEventListener('click',e=>{
    if(!isGroups())return;
    const sort=e.target.closest('.groups-v094 [data-eduka-sort]');if(sort){e.preventDefault();e.stopPropagation();const s=stateNow(),key=sort.dataset.edukaSort;Engine.write({sortBy:key,sortOrder:s.sortBy===key&&s.sortOrder==='asc'?'desc':'asc',page:1},{replace:false});schedule();return}
    const page=e.target.closest('[data-eduka-pager="groups"] [data-eduka-page]');if(page&&!page.disabled){e.preventDefault();const s=stateNow();Engine.write({page:page.dataset.edukaPage==='next'?s.page+1:Math.max(1,s.page-1)},{replace:false});schedule();return}
    if(e.target.closest('[data-eduka-columns-open="groups"]')){e.preventDefault();Engine.openColumns('groups',COLUMNS,()=>{decorateTable()});return}
    if(e.target.closest('[data-g21-reset]')){e.preventDefault();Engine.write({q:'',branchId:'',courseId:'',teacherId:'',levelId:'',roomId:'',day:'',groupStatus:'',lessonTime:'',page:1},{replace:false});const q=document.getElementById('groupSearchV094');if(q){q.value='';q.dispatchEvent(new Event('input',{bubbles:true}))}['groupBranchV094','groupCourseV094','groupTeacherV094','groupLevelV094'].forEach(id=>{const el=document.getElementById(id);if(el){el.value='all';el.dispatchEvent(new Event('change',{bubbles:true}))}});schedule()}
  },true);
  document.addEventListener('eduka:branch-change',()=>{if(isGroups()){Engine.write({branchId:'',page:1});schedule()}});
  window.addEventListener('popstate',()=>{if(isGroups())schedule()});
  function init(){ensureDefaults();const content=document.getElementById('content');if(content){observer=new MutationObserver(schedule);observer.observe(content,{childList:true,subtree:true})}schedule()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
