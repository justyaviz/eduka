/* EDUKA sales links — explicit selector mapping (v0.2) */
(function () {
  const salesUrl = "https://t.me/eduka_sales";

  function bindSalesLinks() {
    document.querySelectorAll('a[href="#sales"], a[data-sales-link]').forEach((link) => {
      link.setAttribute("href", salesUrl);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noreferrer noopener");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindSalesLinks);
  } else {
    bindSalesLinks();
  }
})();
