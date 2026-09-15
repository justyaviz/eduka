/* EDUKA Clone v2.0 — reusable platform core. Tenant CRM only. */
(function(){
  'use strict';
  const root=window.EDUKA_CORE=window.EDUKA_CORE||{};
  const listeners=new Set();
  const clone=o=>JSON.parse(JSON.stringify(o||{}));

  const query={
    read(){const p=new URLSearchParams(location.search);const out={};for(const [k,v] of p.entries())out[k]=v;return out},
    get(key,fallback=null){const v=new URLSearchParams(location.search).get(key);return v===null?fallback:v},
    patch(values,{replace=true,dropEmpty=true}={}){
      const url=new URL(location.href);
      Object.entries(values||{}).forEach(([k,v])=>{
        const empty=v===undefined||v===null||v===''||v==='all';
        if(empty&&dropEmpty)url.searchParams.delete(k);else url.searchParams.set(k,String(v));
      });
      const next=url.pathname+(url.searchParams.toString()?`?${url.searchParams}`:'')+url.hash;
      history[replace?'replaceState':'pushState'](history.state,'',next);
      const detail={values:clone(values),query:query.read(),url:next};
      window.dispatchEvent(new CustomEvent('eduka:querychange',{detail}));
      listeners.forEach(fn=>{try{fn(detail)}catch(e){console.warn('EDUKA query listener',e)}});
      return detail.query;
    },
    clear(keys){const patch={};(keys||[]).forEach(k=>patch[k]=null);return query.patch(patch)},
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}
  };

  function normalizeSchema(schema){return Object.fromEntries(Object.entries(schema||{}).map(([key,cfg])=>[key,typeof cfg==='string'?{type:cfg}:cfg||{}]))}
  function coerce(value,cfg){if(value===null||value===undefined||value==='')return cfg.default??'';if(cfg.type==='number'){const n=Number(value);return Number.isFinite(n)?n:(cfg.default??0)}if(cfg.type==='boolean')return value==='1'||value==='true'||value===true;if(cfg.type==='array')return String(value).split(',').filter(Boolean);return String(value)}
  function serialize(value,cfg){if(Array.isArray(value))return value.join(',');if(cfg.type==='boolean')return value?'1':'0';return value}

  function createFilterStore({schema={},namespace='',defaults={},syncUrl=true}={}){
    schema=normalizeSchema(schema);const subs=new Set();
    const key=k=>namespace?`${namespace}_${k}`:k;
    const state={};
    Object.entries(schema).forEach(([k,cfg])=>{const raw=syncUrl?query.get(key(k)):null;state[k]=coerce(raw,cfg);if((raw===null||raw==='')&&defaults[k]!==undefined)state[k]=defaults[k]});
    function emit(meta={}){const snapshot=clone(state);subs.forEach(fn=>fn(snapshot,meta));return snapshot}
    return {
      get state(){return clone(state)},get(k){return state[k]},
      set(k,v,{url=syncUrl,replace=true}={}){if(!schema[k])return clone(state);state[k]=coerce(v,schema[k]);if(url)query.patch({[key(k)]:serialize(state[k],schema[k])},{replace});return emit({key:k})},
      patch(values,{url=syncUrl,replace=true}={}){const q={};Object.entries(values||{}).forEach(([k,v])=>{if(!schema[k])return;state[k]=coerce(v,schema[k]);q[key(k)]=serialize(state[k],schema[k])});if(url)query.patch(q,{replace});return emit({keys:Object.keys(values||{})})},
      reset(){const q={};Object.keys(schema).forEach(k=>{state[k]=defaults[k]??schema[k].default??'';q[key(k)]=null});if(syncUrl)query.patch(q);return emit({reset:true})},
      subscribe(fn){subs.add(fn);return()=>subs.delete(fn)},
      hydrate(){Object.entries(schema).forEach(([k,cfg])=>state[k]=coerce(query.get(key(k)),cfg));return emit({hydrate:true})}
    }
  }

  const table={
    sort(rows,sortBy,sortOrder='asc',columns={}){if(!sortBy)return[...(rows||[])];const col=columns[sortBy]||{};const getter=typeof col.value==='function'?col.value:(r=>r?.[sortBy]);const dir=sortOrder==='desc'?-1:1;return[...(rows||[])].sort((a,b)=>{const av=getter(a),bv=getter(b);if(av==null&&bv==null)return 0;if(av==null)return 1;if(bv==null)return-1;if(typeof av==='number'&&typeof bv==='number')return(av-bv)*dir;return String(av).localeCompare(String(bv),'uz',{numeric:true,sensitivity:'base'})*dir})},
    paginate(rows,page=1,limit=50){const safeLimit=Math.max(1,Number(limit)||50),total=(rows||[]).length,pages=Math.max(1,Math.ceil(total/safeLimit)),safePage=Math.min(Math.max(1,Number(page)||1),pages),start=(safePage-1)*safeLimit;return{rows:(rows||[]).slice(start,start+safeLimit),page:safePage,limit:safeLimit,total,pages,start,end:Math.min(start+safeLimit,total)}},
    search(rows,q,fields=[]){const needle=String(q||'').trim().toLocaleLowerCase('uz');if(!needle)return[...(rows||[])];return(rows||[]).filter(row=>fields.some(field=>{const value=typeof field==='function'?field(row):row?.[field];return String(value??'').toLocaleLowerCase('uz').includes(needle)}))},
    exportCSV({rows=[],columns=[],filename='eduka-export.csv'}={}){const visible=columns.filter(c=>c.export!==false);const esc=v=>`"${String(v??'').replace(/"/g,'""')}"`;const lines=[visible.map(c=>esc(c.label||c.key)).join(',')];rows.forEach(r=>lines.push(visible.map(c=>esc(typeof c.value==='function'?c.value(r):r?.[c.key])).join(',')));const blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},0)},
    columnState(id,columns=[]){const key=`eduka_columns_${id}`;const saved=JSON.parse(localStorage.getItem(key)||'null');const all=columns.map(c=>c.key);let visible=Array.isArray(saved)?saved.filter(x=>all.includes(x)):columns.filter(c=>c.hidden!==true).map(c=>c.key);return{get visible(){return[...visible]},isVisible:k=>visible.includes(k),set(next){visible=[...new Set(next)].filter(x=>all.includes(x));localStorage.setItem(key,JSON.stringify(visible));return[...visible]},toggle(k){return this.set(visible.includes(k)?visible.filter(x=>x!==k):[...visible,k])},reset(){visible=columns.filter(c=>c.hidden!==true).map(c=>c.key);localStorage.removeItem(key);return[...visible]}}}
  };

  const page={
    mount(rootEl,{id,title='',subtitle='',className=''}={}){if(!rootEl)return null;rootEl.dataset.edukaPage=id||'';if(className)rootEl.classList.add(...className.split(/\s+/).filter(Boolean));if(title&&document.getElementById('shellPageTitle'))document.getElementById('shellPageTitle').textContent=title;window.dispatchEvent(new CustomEvent('eduka:pagemount',{detail:{id,title,subtitle,root:rootEl}}));return rootEl},
    state({loading=false,error=null,empty=false,message=''}={}){if(loading)return`<div class="ed-core-state is-loading" role="status" aria-live="polite"><span class="ed-core-spinner"></span><b>${message||'Yuklanmoqda...'}</b></div>`;if(error)return`<div class="ed-core-state is-error" role="alert"><b>Xatolik yuz berdi</b><span>${String(error)}</span></div>`;if(empty)return`<div class="ed-core-state is-empty" role="status"><b>Ma’lumot topilmadi</b><span>${message||'Filtrlarni o‘zgartirib ko‘ring.'}</span></div>`;return''}
  };

  root.version='2.0.0';root.query=query;root.filters={create:createFilterStore};root.table=table;root.page=page;
  window.addEventListener('popstate',()=>window.dispatchEvent(new CustomEvent('eduka:historychange',{detail:{query:query.read()}})));
})();