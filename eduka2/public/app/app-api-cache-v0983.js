/* EDUKA CRM v1.0 — cache-safe GET + Brandbook theme bootstrap. Client panel only. */
(function(){
  // Brandbook theme is intentionally injected after all legacy stylesheets so it becomes
  // the single visual source of truth without touching the public landing.
  try{
    document.body.classList.add('eduka-brandbook-v1');
    const links=[
      '/brandbook-core-v1.css?v=1.0.0',
      '/app/app-brandbook-v1.css?v=1.0.0'
    ];
    links.forEach((href)=>{
      if(document.querySelector(`link[href^="${href.split('?')[0]}"]`)) return;
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.href=href;
      link.dataset.edukaBrandbook='v1';
      document.head.appendChild(link);
    });
  }catch(e){ console.error('EDUKA_BRANDBOOK_BOOTSTRAP_ERROR',e); }

  if(typeof API==='undefined') return;
  API.get=async function(url,fallback){
    try{
      const sep=String(url).includes('?')?'&':'?';
      const requestUrl=`${url}${sep}__eduka_ts=${Date.now()}`;
      const r=await fetch(requestUrl,{headers:this.headers(),cache:'no-store'});
      const text=await r.text();
      let data=fallback;
      if(text){
        try{data=JSON.parse(text)}catch(e){
          console.error('API_GET_JSON_ERROR',url,r.status,text.slice(0,160));
          return fallback;
        }
      }
      if(!r.ok){
        console.error('API_GET_HTTP_ERROR',url,r.status,data);
        return data||fallback;
      }
      return data??fallback;
    }catch(e){
      console.error('API_GET_ERROR',url,e);
      return fallback;
    }
  };
})();
