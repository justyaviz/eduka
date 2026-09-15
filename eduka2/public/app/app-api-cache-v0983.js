/* EDUKA CRM v1.0.1 — cache-safe GET + Brandbook bootstrap. Client panel only. */
(function(){
  /*
   * Keep all visual dependencies in <head> as early as this bootstrap can run.
   * The CRM boot-loader remains visible during startup, so users never need to see
   * the legacy theme before these styles finish loading.
   */
  try{
    document.body.classList.add('eduka-brandbook-v1','eduka-brandbook-v101');

    const ensureLink=(href,attrs={})=>{
      const base=href.split('?')[0];
      if(document.querySelector(`link[href^="${base}"]`)) return;
      const link=document.createElement('link');
      link.rel=attrs.rel||'stylesheet';
      link.href=href;
      if(attrs.crossOrigin) link.crossOrigin=attrs.crossOrigin;
      link.dataset.edukaBrandbook='v1.0.1';
      document.head.appendChild(link);
    };

    if(!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]')){
      ensureLink('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Manrope:wght@500;600;700;800&display=swap');
    }
    ensureLink('/brandbook-core-v1.css?v=1.0.1');
    ensureLink('/app/app-brandbook-v1.css?v=1.0.1');
    ensureLink('/app/app-hardening-v101.css?v=1.0.1');
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

  const originalPatch=API.patch.bind(API);
  API.patch=async function(url,body){
    const data=await originalPatch(url,body);
    if(data?.ok && data?.token && String(url).startsWith('/api/app/profile-v101')){
      localStorage.setItem('eduka_center_token',data.token);
      this.token=data.token;
    }
    return data;
  };
})();
