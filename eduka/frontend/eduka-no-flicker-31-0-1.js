/* Eduka 31.0.1 — No Flicker UI Loader Fix
   Keeps the boot/skeleton visible until the correct route UI is mounted. */
(function () {
  const VERSION = "31.0.1";
  const PRO_ROUTES = [
    "/admin/dashboard",
    "/admin/students",
    "/admin/teachers",
    "/admin/groups",
    "/admin/payments",
    "/admin/attendance",
    "/admin/crm-core-pro",
    "/admin/operations",
    "/admin/schedule",
    "/admin/daily-operations",
    "/admin/finance-pro"
  ];

  function isAdminOrCeoPath() {
    return /^\/(admin|ceo|super)(\/|$)/.test(window.location.pathname);
  }

  function isProRoute() {
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    return PRO_ROUTES.some((route) => path === route || path.startsWith(route + "/"));
  }

  function setProRouteClass() {
    document.documentElement.classList.toggle("eduka-pro-route", isProRoute());
    if (document.body) document.body.classList.toggle("pro-route", isProRoute());
  }

  function hasRouteUiMounted() {
    if (!isProRoute()) return true;
    const markers = [
      ".crm305-shell",
      ".crm-core-pro-shell",
      ".academy-ops-shell",
      ".operations31-shell",
      "[data-crm305-mount]",
      "[data-ops31-root]",
      "#academy-operations"
    ];
    return markers.some((selector) => document.querySelector(selector));
  }

  function markProReady(reason) {
    if (!document.body) return;
    document.body.classList.add("pro-ui-ready");
    document.body.dataset.proReadyReason = reason || "ready";
  }

  function markProPending() {
    if (!document.body) return;
    if (isProRoute()) document.body.classList.remove("pro-ui-ready");
    else document.body.classList.add("pro-ui-ready");
  }

  function waitForStableUi() {
    setProRouteClass();
    markProPending();

    if (!isProRoute()) {
      markProReady("non-pro-route");
      return;
    }

    const started = Date.now();
    const tick = () => {
      if (hasRouteUiMounted()) return markProReady("mounted");
      if (Date.now() - started > 2400) return markProReady("timeout-safe");
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  }

  function patchHistory() {
    ["pushState", "replaceState"].forEach((name) => {
      const original = history[name];
      if (!original || original.__edukaNoFlickerPatched) return;
      history[name] = function patchedHistoryState() {
        const result = original.apply(this, arguments);
        window.dispatchEvent(new Event("eduka:route-change"));
        return result;
      };
      history[name].__edukaNoFlickerPatched = true;
    });
    window.addEventListener("popstate", () => window.dispatchEvent(new Event("eduka:route-change")));
  }

  function unregisterAdminServiceWorkers() {
    if (!isAdminOrCeoPath() || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations?.().then((registrations) => {
      registrations.forEach((registration) => {
        const activeUrl = registration.active?.scriptURL || registration.installing?.scriptURL || registration.waiting?.scriptURL || "";
        if (/student-sw\.js/.test(activeUrl)) registration.unregister().catch(() => null);
      });
    }).catch(() => null);
  }

  function addCacheDebugVersion() {
    document.documentElement.dataset.edukaNoFlicker = VERSION;
  }

  function boot() {
    addCacheDebugVersion();
    patchHistory();
    setProRouteClass();
    unregisterAdminServiceWorkers();
    waitForStableUi();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();

  window.addEventListener("load", () => window.setTimeout(waitForStableUi, 120));
  window.addEventListener("eduka:route-change", () => window.setTimeout(waitForStableUi, 20));
  window.addEventListener("eduka:app-ready", () => window.setTimeout(waitForStableUi, 20));

  const observer = new MutationObserver(() => {
    if (isProRoute() && !document.body?.classList.contains("pro-ui-ready") && hasRouteUiMounted()) markProReady("mutation");
  });
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
})();
