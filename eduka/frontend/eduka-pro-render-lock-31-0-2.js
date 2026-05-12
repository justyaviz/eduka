/* Eduka 31.0.2 — Pro Render Lock
   Prevents legacy app.js dashboard/page render from overwriting CRM Pro UI after data loads. */
(function () {
  const VERSION = "31.0.2";
  const ROUTE_TO_VIEW = {
    "/admin/dashboard": "dashboard",
    "/admin/students": "students",
    "/admin/teachers": "teachers",
    "/admin/groups": "groups",
    "/admin/payments": "finance",
    "/admin/attendance": "attendance"
  };
  let timer = null;
  let restoring = false;
  function cleanPath() { return (location.pathname || "/").replace(/\/$/, "") || "/"; }
  function proView() { return ROUTE_TO_VIEW[cleanPath()] || null; }
  function activeViewId() { return document.querySelector(".view.active")?.id || null; }
  function viewNode() { const id = proView() || activeViewId(); return id ? document.getElementById(id) : null; }
  function hasProMarker(node) {
    if (!node) return false;
    return !!node.querySelector("[data-crm305-mount] .crm305-shell, [data-crm305-mount] .crm305-panel, .academy-ops-shell, [data-ops31-root]");
  }
  function looksLikeLegacyOverwrite(node) {
    if (!node) return false;
    const txt = (node.textContent || "").slice(0, 800);
    return /CRM boshqaruv paneli|Eduka 20\.0 analytics|Oylik tushum grafigi/.test(txt) && !hasProMarker(node);
  }
  function requestProRender(reason) {
    if (!proView()) return;
    clearTimeout(timer);
    document.body?.classList.add("pro-render-restoring");
    restoring = true;
    timer = setTimeout(() => {
      try {
        if (typeof window.__crm305RenderActive === "function") window.__crm305RenderActive();
        window.dispatchEvent(new Event("eduka:force-pro-render"));
      } finally {
        setTimeout(() => {
          document.body?.classList.remove("pro-render-restoring");
          restoring = false;
          document.documentElement.dataset.edukaProRenderLock = VERSION;
          document.body && (document.body.dataset.proRenderLockReason = reason || "route");
        }, 120);
      }
    }, 30);
  }
  function check(reason) {
    const pv = proView();
    if (!pv) return;
    const node = viewNode();
    if (!node) return;
    if (activeViewId() && activeViewId() !== pv) return;
    if (!hasProMarker(node) || looksLikeLegacyOverwrite(node)) requestProRender(reason);
  }
  function boot() {
    check("boot");
    const content = document.querySelector(".content");
    if (content) {
      const obs = new MutationObserver(() => {
        if (restoring) return;
        clearTimeout(timer);
        timer = setTimeout(() => check("mutation"), 20);
      });
      obs.observe(content, { childList: true, subtree: true });
    }
    [80, 250, 600, 1200, 2400, 5000, 9000, 15000].forEach((ms) => setTimeout(() => check("delayed-" + ms), ms));
  }
  ["eduka:app-ready", "eduka:legacy-render-complete", "eduka:route-change", "popstate"].forEach((ev) => window.addEventListener(ev, () => setTimeout(() => check(ev), 40)));
  const originalPush = history.pushState;
  if (originalPush && !originalPush.__edukaProLockPatched) {
    history.pushState = function () { const r = originalPush.apply(this, arguments); setTimeout(() => check("pushState"), 40); return r; };
    history.pushState.__edukaProLockPatched = true;
  }
  const originalReplace = history.replaceState;
  if (originalReplace && !originalReplace.__edukaProLockPatched) {
    history.replaceState = function () { const r = originalReplace.apply(this, arguments); setTimeout(() => check("replaceState"), 40); return r; };
    history.replaceState.__edukaProLockPatched = true;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
