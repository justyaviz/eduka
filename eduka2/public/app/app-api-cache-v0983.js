/* EDUKA CRM v0.9.8.3 — cache-safe GET requests for SPA modules. Client panel only. */
(function(){
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
