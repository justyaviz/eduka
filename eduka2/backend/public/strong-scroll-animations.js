
(function () {
  const selectorList = [
    "main > section",
    "section h1",
    "section h2",
    "section h3",
    "section p",
    ".page-pill",
    ".hero-copy",
    ".hero-visual",
    ".hero-shot",
    ".hero-shot-frame",
    ".dashboard-window",
    ".eduka-stats-heading",
    ".eduka-stat-card",
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
    ".vacancy-card",
    ".vacancy-card-head",
    ".language-box",
    ".vacancy-desc",
    ".vacancy-columns > *",
    ".offer-box",
    ".vacancy-bottom",
    ".vacancy-note",
    ".brand-footer-grid > *",
    ".eduka-footer__inner > *",
    ".eduka-footer__bottom > *",
    ".faq-item",
    ".tabs",
    ".plan-card",
    ".trust-row > *",
    ".primary-btn",
    ".outline-btn",
    ".brand-demo",
    ".footer-demo",
    ".apply-btn",
    ".telegram-btn"
  ];

  function addAnimations() {
    const nodes = [];
    selectorList.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        if (!node.closest(".site-loader") && !node.closest(".demo-modal-root") && !node.closest(".support-chat-root")) {
          nodes.push(node);
        }
      });
    });

    const unique = Array.from(new Set(nodes));

    unique.forEach((node, index) => {
      if (!node.hasAttribute("data-animate")) {
        const type = index % 9 === 1 ? "left" : index % 9 === 2 ? "right" : index % 9 === 3 ? "zoom" : "fade";
        node.setAttribute("data-animate", type);
      }
      node.style.setProperty("--anim-delay", `${Math.min((index % 8) * 55, 360)}ms`);
    });

    return unique;
  }

  function observeAnimations() {
    const items = addAnimations();

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
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
      threshold: 0.11,
      rootMargin: "0px 0px -45px 0px"
    });

    items.forEach((item) => observer.observe(item));
  }

  function animateCounters() {
    const counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;

    function runCounter(el) {
      if (el.dataset.done === "true") return;
      el.dataset.done = "true";

      const target = Number(el.dataset.count || "0");
      const duration = 1300;
      const start = performance.now();

      function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        el.textContent = String(value);
        if (progress < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(runCounter);
      return;
    }

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.45 });

    counters.forEach((counter) => counterObserver.observe(counter));
  }

  function init() {
    observeAnimations();
    animateCounters();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("load", () => {
    setTimeout(init, 350);
  });
})();
