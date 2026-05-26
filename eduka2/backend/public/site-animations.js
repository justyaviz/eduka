
(function () {
  document.documentElement.classList.add("is-loading");

  const loader = document.getElementById("site-loader");

  function hideLoader() {
    document.body.classList.add("is-ready");
    document.documentElement.classList.remove("is-loading");

    if (loader) {
      loader.classList.add("is-hidden");
      setTimeout(() => {
        loader.remove();
      }, 650);
    }
  }

  const revealSelectors = [
    ".hero-copy",
    ".hero-visual",
    ".hero-shot",
    ".dashboard-window",
    ".partner-card",
    ".feature-card",
    ".stat-card",
    ".pricing-table-wrap",
    ".pricing-table tr",
    ".payment-banner",
    ".bonus-badges",
    ".down-arrows",
    ".gamification-price-card",
    ".game-hero-inner",
    ".floating-icon",
    ".game-section-title",
    ".game-card",
    ".game-cta-box",
    ".brand-footer-grid > *",
    ".brand-footer",
    ".faq-item",
    ".tabs",
    ".plan-card",
    ".section-title",
    ".trust-row > *",
    ".primary-btn",
    ".outline-btn"
  ];

  function prepareRevealElements() {
    const nodes = [];
    revealSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        if (!node.classList.contains("reveal") && !node.classList.contains("reveal-left") && !node.classList.contains("reveal-right") && !node.classList.contains("reveal-zoom")) {
          nodes.push(node);
        }
      });
    });

    nodes.forEach((node, index) => {
      const className = index % 7 === 1 ? "reveal-left" : index % 7 === 2 ? "reveal-right" : index % 7 === 3 ? "reveal-zoom" : "reveal";
      node.classList.add(className);
      node.style.setProperty("--reveal-delay", `${Math.min((index % 10) * 55, 420)}ms`);
    });

    return document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-zoom");
  }

  function startReveal() {
    const revealItems = prepareRevealElements();

    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -50px 0px"
    });

    revealItems.forEach((item) => observer.observe(item));
  }

  function animatePageLinks() {
    document.querySelectorAll('a[href^="/"]').forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.includes("#") || link.dataset.noTransition === "true") return;

      link.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();

        document.body.classList.add("page-changing");

        const main = document.querySelector("main");
        if (main) {
          main.classList.add("page-leave");
        }

        setTimeout(() => {
          window.location.href = href;
        }, 210);
      });
    });
  }

  window.addEventListener("load", () => {
    setTimeout(() => {
      hideLoader();
      startReveal();
      animatePageLinks();
    }, 450);
  });

  setTimeout(() => {
    if (document.documentElement.classList.contains("is-loading")) {
      hideLoader();
      startReveal();
      animatePageLinks();
    }
  }, 2500);
})();
