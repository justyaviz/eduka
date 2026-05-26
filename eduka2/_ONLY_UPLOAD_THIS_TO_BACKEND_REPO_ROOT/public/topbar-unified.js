
(function () {
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

  setActiveTopbarLink();
  bindLogoScrollTop();
})();
