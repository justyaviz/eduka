
(function () {
  const salesUrl = "https://t.me/eduka_sales";

  function loadBrandbookForNonLanding(){
    const isBrandPage = document.body && document.body.classList.contains('brand-page');
    const isNotFound = !!document.querySelector('.notfound');
    if(!isBrandPage && !isNotFound) return; // landing page stays completely untouched

    document.body.classList.add('eduka-brandbook-v1');
    const hrefs = isNotFound
      ? ['/brandbook-core-v1.css?v=1.0.0','/brandbook-404-v1.css?v=1.0.0']
      : ['/brandbook-core-v1.css?v=1.0.0','/brandbook-public-v1.css?v=1.0.0'];

    hrefs.forEach((href)=>{
      const base=href.split('?')[0];
      if(document.querySelector(`link[href^="${base}"]`)) return;
      const link=document.createElement('link');
      link.rel='stylesheet';
      link.href=href;
      link.dataset.edukaBrandbook='v1';
      document.head.appendChild(link);
    });
  }

  function bindSalesLinks() {
    document.querySelectorAll("a").forEach((a) => {
      const text = (a.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (
        text.includes("sotuv bo") ||
        text.includes("sales department") ||
        text.includes("отдел продаж")
      ) {
        a.setAttribute("href", salesUrl);
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noreferrer");
      }
    });
  }

  function init(){
    loadBrandbookForNonLanding();
    bindSalesLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  window.addEventListener("load", bindSalesLinks);
})();
