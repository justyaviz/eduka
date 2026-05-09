(() => {
  "use strict";
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const storageKey = "eduka:21.7:ui";
  const profileRoutes = {
    students: (id) => `/admin/students/${id}`,
    groups: (id) => `/admin/groups/${id}`,
    teachers: (id) => `/admin/teachers/${id}`,
    leads: () => `/admin/leads`,
    centers: (id) => `/super/centers/${id}`
  };

  function getSettings() {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { return {}; }
  }
  function saveSettings(next) {
    localStorage.setItem(storageKey, JSON.stringify({ ...getSettings(), ...next }));
  }
  function toast(message, type = "success") {
    if (typeof window.showToast === "function") return window.showToast(message, type);
    console.log(`[Eduka ${type}] ${message}`);
  }
  function applyUiSettings() {
    const settings = getSettings();
    document.body.classList.toggle("eduka-dark", Boolean(settings.dark));
    document.body.classList.toggle("eduka-sidebar-collapsed", Boolean(settings.sidebarCollapsed));
  }
  function ensureToolbar() {
    const topbar = qs(".topbar, .crm-topbar, header");
    if (!topbar || qs("[data-eduka-core-toolbar]")) return;
    const toolbar = document.createElement("div");
    toolbar.className = "eduka-core-toolbar";
    toolbar.dataset.edukaCoreToolbar = "true";
    toolbar.innerHTML = `
      <button type="button" title="Command palette (Ctrl+K)" data-eduka-command-open>⌘K</button>
      <button type="button" title="Dark mode" data-eduka-dark-toggle>◐</button>
      <button type="button" title="Sidebar" data-eduka-sidebar-toggle>☰</button>
    `;
    topbar.append(toolbar);
  }
  function ensureCommandPalette() {
    if (qs("[data-eduka-command]")) return;
    const node = document.createElement("div");
    node.className = "eduka-command-backdrop";
    node.dataset.edukaCommand = "true";
    node.hidden = true;
    node.innerHTML = `
      <section class="eduka-command-palette" role="dialog" aria-modal="true" aria-label="Eduka global qidiruv">
        <div class="eduka-command-header"><input data-eduka-command-input placeholder="Talaba, guruh, o'qituvchi, lead yoki sahifa qidiring..." /></div>
        <div class="eduka-command-body" data-eduka-command-results></div>
      </section>`;
    document.body.append(node);
  }
  function defaultItems(query) {
    const views = [
      ["Dashboard", "dashboard", "/admin"],
      ["Talabalar", "students", "/admin/students"],
      ["Guruhlar", "groups", "/admin/groups"],
      ["O'qituvchilar", "teachers", "/admin/teachers"],
      ["Moliya", "finance", "/admin/finance"],
      ["Davomat", "attendance", "/admin/attendance"],
      ["Hisobotlar", "reports", "/admin/reports"],
      ["Sozlamalar", "settings", "/admin/settings"]
    ];
    return views.filter(([title]) => title.toLowerCase().includes(query.toLowerCase())).map(([title, resource, path]) => ({ title, subtitle: "Sahifa", resource, path }));
  }
  async function searchCommand(query) {
    const results = qs("[data-eduka-command-results]");
    if (!results) return;
    if (!query || query.trim().length < 2) {
      results.innerHTML = defaultItems("").map(renderItem).join("");
      return;
    }
    results.innerHTML = `<p style="padding:14px;color:var(--eduka-core-muted)">Qidirilmoqda...</p>`;
    try {
      const response = await fetch(`/api/app/global-search?q=${encodeURIComponent(query)}`, { credentials: "include" });
      const data = await response.json();
      const rows = [...(data.results || []), ...defaultItems(query)].slice(0, 20);
      results.innerHTML = rows.length ? rows.map(renderItem).join("") : `<p style="padding:14px;color:var(--eduka-core-muted)">Hech narsa topilmadi.</p>`;
    } catch {
      const rows = defaultItems(query);
      results.innerHTML = rows.length ? rows.map(renderItem).join("") : `<p style="padding:14px;color:var(--eduka-core-muted)">Offline qidiruvda natija yo'q.</p>`;
    }
  }
  function renderItem(item) {
    const resource = item.resource || "page";
    const id = item.id || "";
    const path = item.path || (profileRoutes[resource]?.(id) || "/admin");
    return `<button class="eduka-command-item" type="button" data-eduka-command-go data-path="${path}" data-resource="${resource}" data-id="${id}"><span><b>${escapeHtml(item.title || item.name || "Natija")}</b><br><small>${escapeHtml(item.subtitle || resource)}</small></span><small>${escapeHtml(resource)}</small></button>`;
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }
  function openCommand() {
    ensureCommandPalette();
    const box = qs("[data-eduka-command]");
    box.hidden = false;
    const input = qs("[data-eduka-command-input]");
    input.value = "";
    searchCommand("");
    setTimeout(() => input.focus(), 20);
  }
  function closeCommand() {
    const box = qs("[data-eduka-command]");
    if (box) box.hidden = true;
  }
  function hardenTables() {
    qsa("table").forEach((table) => {
      table.closest(".eduka-table-scroll") || table.parentElement?.classList.add("eduka-table-scroll");
    });
  }
  function init() {
    applyUiSettings();
    ensureToolbar();
    ensureCommandPalette();
    hardenTables();
    const observer = new MutationObserver(() => { ensureToolbar(); hardenTables(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-eduka-command-open]")) return openCommand();
    if (event.target.closest("[data-eduka-dark-toggle]")) {
      const dark = !document.body.classList.contains("eduka-dark");
      saveSettings({ dark });
      applyUiSettings();
      toast(dark ? "Dark mode yoqildi." : "Light mode yoqildi.");
      return;
    }
    if (event.target.closest("[data-eduka-sidebar-toggle]")) {
      const sidebarCollapsed = !document.body.classList.contains("eduka-sidebar-collapsed");
      saveSettings({ sidebarCollapsed });
      applyUiSettings();
      return;
    }
    const backdrop = event.target.closest("[data-eduka-command]");
    if (backdrop && event.target === backdrop) closeCommand();
    const go = event.target.closest("[data-eduka-command-go]");
    if (go) {
      closeCommand();
      if (typeof window.setView === "function" && go.dataset.resource && ["students", "groups", "teachers"].includes(go.dataset.resource)) {
        const map = { students: "student-profile", groups: "group-profile", teachers: "teacher-profile" };
        window.setView(map[go.dataset.resource], { route: go.dataset.path });
      } else {
        history.pushState({}, "", go.dataset.path);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }
  });
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openCommand();
    }
    if (event.key === "Escape") closeCommand();
  });
  document.addEventListener("input", (event) => {
    const input = event.target.closest("[data-eduka-command-input]");
    if (input) searchCommand(input.value);
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
