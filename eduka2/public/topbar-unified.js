(function () {
  const BRAND_MARK = "/assets/eduka-mark.svg";

  function setActiveTopbarLink() {
    const path = window.location.pathname.replace(/\/$/, "");
    document.querySelectorAll(".eduka-topbar__links a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      link.classList.remove("active");

      if (href === "/prices" && (path === "/prices" || path === "/uz/prices")) link.classList.add("active");
      if (href === "/gamification" && (path === "/gamification" || path === "/uz/gamification")) link.classList.add("active");
      if (href === "/vacancies" && (path === "/vacancies" || path === "/uz/vacancies")) link.classList.add("active");
    });
  }

  function applyCanonicalBrandAssets() {
    document.querySelectorAll(
      ".eduka-topbar__logo img, .eduka-footer__logo img, .support-brand-badge img"
    ).forEach((img) => {
      img.setAttribute("src", BRAND_MARK);
      img.setAttribute("width", "64");
      img.setAttribute("height", "64");
      img.setAttribute("decoding", "async");
    });

    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.setAttribute("href", BRAND_MARK);
      favicon.setAttribute("type", "image/svg+xml");
    }
  }

  function normalizeBrandWordmarks() {
    document.querySelectorAll(".eduka-topbar__logo span, .eduka-footer__logo span").forEach((wordmark) => {
      wordmark.textContent = "EDUKA";
      wordmark.classList.add("eduka-brand-wordmark");
    });
  }

  function bindLogoScrollTop() {
    document.querySelectorAll("[data-scroll-top]").forEach((logo) => {
      logo.addEventListener("click", (event) => {
        const path = window.location.pathname.replace(/\/$/, "");
        if (path === "" || path === "/" || path === "/uz") {
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });
  }

  applyCanonicalBrandAssets();
  normalizeBrandWordmarks();
  setActiveTopbarLink();
  bindLogoScrollTop();
})();
