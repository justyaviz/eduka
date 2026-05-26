
(function () {
  const salesUrl = "https://t.me/eduka_sales";
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
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindSalesLinks);
  } else {
    bindSalesLinks();
  }
  window.addEventListener("load", bindSalesLinks);
})();
