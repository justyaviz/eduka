(function () {
  const BRAND_MARK = "/assets/eduka-mark.svg";
  const FEATURE_NODE = "/assets/feature-node.svg";

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

    document.querySelectorAll(
      ".iso-illustration img, .lead-card img, .integration-art img"
    ).forEach((img) => {
      img.setAttribute("src", FEATURE_NODE);
      img.setAttribute("alt", "");
      img.setAttribute("aria-hidden", "true");
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

  function normalizeLegalAndFooterLinks() {
    document.querySelectorAll(".eduka-footer__bottom > div").forEach((group) => {
      const links = group.querySelectorAll("a");
      if (links[0]) links[0].setAttribute("href", "/privacy");
      if (links[1]) links[1].setAttribute("href", "/terms");
    });

    document.querySelectorAll(".demo-check a").forEach((link) => {
      link.setAttribute("href", "/privacy");
      link.removeAttribute("target");
      link.removeAttribute("rel");
    });

    document.querySelectorAll(".eduka-footer__bottom p").forEach((copyright) => {
      copyright.textContent = copyright.textContent.replace(/©\s*\d{4}/, `© ${new Date().getFullYear()}`);
    });

    document.querySelectorAll(".eduka-footer__col").forEach((column) => {
      const phoneLinks = Array.from(column.querySelectorAll('a[href^="tel:"]'));
      const seen = new Set();
      phoneLinks.forEach((link) => {
        const normalized = (link.getAttribute("href") || "").replace(/\s+/g, "");
        if (seen.has(normalized)) link.remove();
        else seen.add(normalized);
      });
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

  function buildMobileNavigation() {
    const header = document.querySelector(".eduka-topbar");
    const actions = header?.querySelector(".eduka-topbar__actions");
    const desktopNav = header?.querySelector(".eduka-topbar__links");
    if (!header || !actions || !desktopNav || header.querySelector(".eduka-mobile-toggle")) return;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "eduka-mobile-toggle";
    toggle.setAttribute("aria-label", "Menyuni ochish");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "eduka-mobile-drawer");
    toggle.innerHTML = "<span aria-hidden=\"true\"></span>";
    actions.appendChild(toggle);

    const backdrop = document.createElement("div");
    backdrop.className = "eduka-mobile-backdrop";
    backdrop.setAttribute("aria-hidden", "true");

    const drawer = document.createElement("aside");
    drawer.id = "eduka-mobile-drawer";
    drawer.className = "eduka-mobile-drawer";
    drawer.setAttribute("aria-hidden", "true");
    drawer.setAttribute("aria-label", "Mobil menyu");

    const nav = document.createElement("nav");
    nav.className = "eduka-mobile-nav";

    Array.from(desktopNav.querySelectorAll("a")).forEach((source) => {
      const link = document.createElement("a");
      const href = source.getAttribute("href") || "/";
      link.href = href;
      link.textContent = source.textContent.trim();
      if (source.classList.contains("active")) link.classList.add("active");

      if (source.hasAttribute("data-support-open") || href === "#support") {
        link.href = "#support";
        link.classList.add("eduka-mobile-support");
        link.addEventListener("click", (event) => {
          event.preventDefault();
          closeMobileMenu();
          setTimeout(() => document.querySelector(".eduka-topbar__links [data-support-open]")?.click(), 120);
        });
      } else {
        link.addEventListener("click", closeMobileMenu);
      }
      nav.appendChild(link);
    });

    const meta = document.createElement("div");
    meta.className = "eduka-mobile-meta";

    const desktopPhone = header.querySelector(".eduka-topbar__phone");
    if (desktopPhone) {
      const phone = document.createElement("a");
      phone.className = "eduka-mobile-phone";
      phone.href = desktopPhone.getAttribute("href") || "tel:+998998939000";
      phone.textContent = desktopPhone.textContent.trim();
      meta.appendChild(phone);
    }

    const lang = document.createElement("div");
    lang.className = "eduka-mobile-lang";
    ["uz", "en", "ru"].forEach((code) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.mobileLang = code;
      button.textContent = code.toUpperCase();
      button.addEventListener("click", () => {
        window.EdukaLanguage?.applyLanguage?.(code);
        lang.querySelectorAll("button").forEach((item) => item.classList.toggle("is-active", item === button));
      });
      lang.appendChild(button);
    });
    const currentLang = (document.documentElement.lang || "uz").slice(0, 2).toLowerCase();
    lang.querySelector(`[data-mobile-lang="${currentLang}"]`)?.classList.add("is-active");
    meta.appendChild(lang);

    const demo = document.createElement("a");
    demo.className = "eduka-mobile-demo";
    demo.href = "#demo";
    demo.textContent = "Demo olish";
    demo.addEventListener("click", (event) => {
      event.preventDefault();
      closeMobileMenu();
      setTimeout(() => document.querySelector(".eduka-topbar__demo[data-demo-open]")?.click(), 120);
    });
    meta.appendChild(demo);

    drawer.append(nav, meta);
    document.body.append(backdrop, drawer);

    function openMobileMenu() {
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Menyuni yopish");
      drawer.classList.add("is-open");
      backdrop.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
      backdrop.setAttribute("aria-hidden", "false");
      document.body.classList.add("eduka-mobile-menu-open");
    }

    function closeMobileMenu() {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Menyuni ochish");
      drawer.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      drawer.setAttribute("aria-hidden", "true");
      backdrop.setAttribute("aria-hidden", "true");
      document.body.classList.remove("eduka-mobile-menu-open");
    }

    toggle.addEventListener("click", () => {
      if (toggle.getAttribute("aria-expanded") === "true") closeMobileMenu();
      else openMobileMenu();
    });
    backdrop.addEventListener("click", closeMobileMenu);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMobileMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1060) closeMobileMenu();
    });
  }

  applyCanonicalBrandAssets();
  normalizeBrandWordmarks();
  normalizeLegalAndFooterLinks();
  setActiveTopbarLink();
  bindLogoScrollTop();
  buildMobileNavigation();
})();
