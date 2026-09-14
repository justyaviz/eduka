/* EDUKA CRM v0.1 — tenant admin shell interactions only. */
(function(){
  const $=(s,r=document)=>r.querySelector(s);

  const pageNames={
    dashboard:"Dashboard",teachers:"O‘qituvchilar",groups:"Guruhlar",students:"Talabalar",
    reminders:"Eslatmalar",finance:"Moliya",settings:"Sozlamalar","general-settings":"Sozlamalar",
    courses:"Kurslar",rooms:"Xonalar","group-detail":"Guruh tafsilotlari"
  };

  function initials(value){
    const parts=String(value||"CRM").trim().split(/\s+/).filter(Boolean);
    return (parts.slice(0,2).map(x=>x[0]).join("")||"CR").toUpperCase();
  }

  function currentPage(){
    const p=(window.state&&window.state.page)||location.pathname.replace(/^.*\/app\/?/,"").replace(/^\/+|\/+$/g,"");
    return p||"dashboard";
  }

  function syncOriginalLogo(){
    const loginLogo=$(".tenant-login-card .login-logo");
    if(!loginLogo||loginLogo.querySelector(".crm-login-original-logo")) return;
    const legacyIcon=loginLogo.querySelector("[data-icon]");
    if(legacyIcon) legacyIcon.remove();
    const img=document.createElement("img");
    img.src="/assets/logo-icon.png";
    img.alt="EDUKA";
    img.className="crm-login-original-logo";
    loginLogo.prepend(img);
  }

  function syncIdentity(){
    const st=window.state||{};
    const center=st.me?.center||{};
    const user=st.me?.user||{};
    const centerName=center.name||"O‘quv markaz";
    const subdomain=center.subdomain||localStorage.getItem("eduka_tenant")||location.hostname.split(".")[0]||"markaz";
    const userName=user.fullName||centerName||"CRM";

    const centerNameEl=$("#shellCenterName"); if(centerNameEl) centerNameEl.textContent=centerName;
    const subdomainEl=$("#shellSubdomain"); if(subdomainEl) subdomainEl.textContent=`${subdomain}.eduka.uz`;
    const centerAvatar=$("#shellCenterAvatar"); if(centerAvatar) centerAvatar.textContent=initials(centerName);
    const profileAvatar=$("#shellProfileAvatar"); if(profileAvatar) profileAvatar.textContent=initials(userName);
    const profileName=$("#profileName"); if(profileName) profileName.textContent=userName;

    const page=currentPage();
    const pageTitle=$("#shellPageTitle"); if(pageTitle) pageTitle.textContent=pageNames[page]||"Boshqaruv paneli";
    syncOriginalLogo();
  }

  function closeShellMenus(except){
    const quick=$("#quickPop");
    const profile=$("#profilePop");
    if(quick&&except!=="quick") quick.hidden=true;
    if(profile&&except!=="profile") profile.hidden=true;
  }

  function bindShell(){
    const fullscreen=$("#fullScreenBtn");
    fullscreen?.addEventListener("click",async()=>{
      try{
        if(!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      }catch(e){ console.warn("Fullscreen unavailable",e); }
    });

    document.addEventListener("fullscreenchange",()=>{
      fullscreen?.setAttribute("title",document.fullscreenElement?"Fullscreen’dan chiqish":"Fullscreen");
    });

    document.body.addEventListener("click",e=>{
      const target=e.target;
      if(!target.closest("#quickAddBtn")&&!target.closest("#quickPop")) $("#quickPop") && ($("#quickPop").hidden=true);
      if(!target.closest("#profileBtn")&&!target.closest("#profilePop")) $("#profilePop") && ($("#profilePop").hidden=true);

      const settings=target.closest("[data-shell-settings]");
      if(settings){
        e.preventDefault();
        closeShellMenus();
        if(typeof window.go==="function") window.go("general-settings");
        else location.href="/app/general-settings";
      }
    });

    document.addEventListener("keydown",e=>{
      if(e.key!=="Escape") return;
      closeShellMenus();
      const drawer=$("#drawer");
      if(drawer&&!drawer.hidden&&typeof window.closeDrawer==="function") window.closeDrawer();
    });

    let ticks=0;
    const timer=setInterval(()=>{
      syncIdentity();
      ticks++;
      if((window.state?.me&&window.state?.page)||ticks>30) clearInterval(timer);
    },180);

    const content=$("#content");
    if(content) new MutationObserver(syncIdentity).observe(content,{childList:true,subtree:false});
    new MutationObserver(syncOriginalLogo).observe(document.body,{childList:true,subtree:true});
    syncIdentity();
  }

  document.addEventListener("DOMContentLoaded",bindShell);
})();
