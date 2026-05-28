/* EDUKA CEO API Client Patch */
(function(){
  const TOKEN="eduka_ceo_token", USER="eduka_ceo_user";
  const api=(p,o={})=>fetch(p,{...o,headers:{"Content-Type":"application/json",...(localStorage.getItem(TOKEN)?{Authorization:"Bearer "+localStorage.getItem(TOKEN)}:{}),...(o.headers||{})}}).then(async r=>{let d={};try{d=await r.json()}catch{} if(r.status===401){localStorage.removeItem(TOKEN);localStorage.removeItem(USER);location.href="/ceo/login"} if(!r.ok||d.ok===false)throw new Error(d.error||"API xato");return d});
  window.EDUKA_API={api,TOKEN,USER};
})();
