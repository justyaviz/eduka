/* EDUKA Demo API Bridge */
(function(){
  if(window.__EDUKA_DEMO_API_BRIDGE__)return; window.__EDUKA_DEMO_API_BRIDGE__=true;
  function val(form,names,rx){for(const n of names){const e=form.querySelector(`[name="${n}"]`);if(e&&e.value)return e.value}const els=[...form.querySelectorAll("input,select,textarea")];const f=els.find(e=>rx.test(e.placeholder||"")||rx.test(e.name||""));return f?f.value:""}
  function phone(x){x=String(x||"").trim();if(x.startsWith("+"))return x;const d=x.replace(/\D/g,"");return d?`+998 ${d}`:""}
  async function send(form){
    const payload={name:val(form,["name","fullName"],/ism|name/i),center:val(form,["center","centerName"],/markaz|center/i),phone:phone(val(form,["phone"],/telefon|phone|99/i)),payment:val(form,["payment","paymentMode"],/to.?lov|payment/i)||form.querySelector("select")?.value||"Tanlanmagan",password:val(form,["password"],/parol|password/i),source:"landing"};
    if(!payload.name||!payload.center||!payload.phone)return;
    try{const r=await fetch("/api/demo-requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await r.json();if(data.ok)window.dispatchEvent(new CustomEvent("eduka:demo-request-created",{detail:data.demo}));return data}
    catch(e){console.warn("Demo API fallback:",e);const fb={id:`DR-${Date.now()}`,...payload,status:"Yangi",manager:"Tayinlanmagan",createdAt:new Date().toISOString()};const list=JSON.parse(localStorage.getItem("eduka_demo_requests_real")||"[]");list.unshift(fb);localStorage.setItem("eduka_demo_requests_real",JSON.stringify(list));return{ok:true,demo:fb,fallback:true}}
  }
  document.addEventListener("submit",function(ev){const form=ev.target;if(!(form instanceof HTMLFormElement))return;const text=(form.textContent||"").toLowerCase();const isDemo=form.closest(".demo-modal-root,.demo-modal-overlay,.eduka-demo-fallback,#demo-modal-root,#demo-modal")||text.includes("demo olish")||form.querySelector("[name='center'],[name='payment']");if(isDemo)send(form)},true);
})();
