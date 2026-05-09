
/* =========================================================
   EDUKA 21.4.5 Premium UI + Hard Global Action Menu
   This version blocks old inline dropdowns and renders a real floating menu.
   ========================================================= */
(function () {
  const VERSION = "21.4.5-premium-ui-actions";
  let activeMenu = null;
  let activeBackdrop = null;
  let activeButton = null;
  let lastTriggerRect = null;

  const ACTIONS = [
    { key: "view", label: "Ko'rish", icon: "eye" },
    { key: "edit", label: "Tahrirlash", icon: "edit" },
    { key: "receipt", label: "Chek chiqarish", icon: "receipt", payment: true },
    { key: "print", label: "Chop etish", icon: "printer", payment: true },
    { key: "copy", label: "Nusxalash", icon: "copy" },
    { key: "archive", label: "Arxivlash", icon: "archive" },
    { key: "delete", label: "O'chirish", icon: "trash", danger: true }
  ];

  function icon(name) {
    const p = {
      eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>',
      receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>',
      printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
      copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
      archive: '<path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>',
      trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
      dots: '<circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/>'
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p[name] || p.dots}</svg>`;
  }

  function textOf(el) {
    return (el?.innerText || el?.textContent || "").replace(/\s+/g, " ").trim();
  }

  function looksLikeDotsElement(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    if (el.matches?.('[data-action-menu],[data-row-actions],[data-more],[data-kebab],.row-actions,.actions,.action-btn,.kebab,.more,.more-button,.dots,.ellipsis,[aria-haspopup="menu"]')) return true;

    const t = textOf(el);
    const aria = ((el.getAttribute?.("aria-label") || "") + " " + (el.getAttribute?.("title") || "")).toLowerCase();
    const cls = String(el.className || "").toLowerCase();

    if (t === "..." || t === "⋯" || t === "•••" || t === "…") return true;
    if (aria.includes("more") || aria.includes("action") || aria.includes("amal") || aria.includes("menu")) return true;
    if (cls.includes("more") || cls.includes("kebab") || cls.includes("ellipsis") || cls.includes("actions")) return true;

    const svgOnly = el.querySelectorAll?.("svg,circle").length >= 1 && t.length <= 3;
    if (svgOnly && (el.tagName === "BUTTON" || el.closest?.("button"))) return true;

    return false;
  }

  function findTriggerFromEvent(event) {
    const path = event.composedPath ? event.composedPath() : [];
    for (const node of path) {
      if (!(node instanceof Element)) continue;
      const clickable = node.closest?.('button,a,[role="button"],[tabindex],.action-btn,.row-actions,.more-button,.kebab,.dots');
      if (clickable && looksLikeDotsElement(clickable)) return clickable;
      if (looksLikeDotsElement(node)) return node;
    }

    const target = event.target instanceof Element ? event.target : null;
    if (!target) return null;
    const btn = target.closest('button,a,[role="button"],[tabindex],.action-btn,.row-actions,.more-button,.kebab,.dots');
    return looksLikeDotsElement(btn) ? btn : null;
  }

  function rowOf(trigger) {
    return trigger.closest?.('[data-row-id],tr,.table-row,.crm-row,.student-row,.teacher-row,.group-row,.payment-row,.student-card,.crm-card,article,.card') || trigger.parentElement;
  }

  function contextOf(trigger, row) {
    const bodyClass = document.body.className || "";
    const path = location.pathname.toLowerCase();
    const rowText = textOf(row).toLowerCase();
    const table = trigger.closest?.("[data-table]")?.dataset.table || "";
    const all = `${path} ${bodyClass} ${table} ${rowText}`;
    return {
      payment: /payment|payments|tolov|to'lov|moliya|finance|qarzdor|kassa|so'm|chek/.test(all),
      student: /student|talaba|o'quvchi|oquvchi/.test(all),
      group: /group|guruh/.test(all),
      teacher: /teacher|o'qituvchi|oqituvchi/.test(all)
    };
  }

  function actionsFor(trigger, row) {
    const raw = trigger.getAttribute?.("data-actions");
    if (raw) {
      return raw.split(",").map(x => x.trim()).filter(Boolean).map(key => {
        return ACTIONS.find(a => a.key === key) || { key, label: key, icon: "dots" };
      });
    }

    const ctx = contextOf(trigger, row);
    return ACTIONS.filter(a => {
      if (a.payment && !ctx.payment) return false;
      return true;
    });
  }

  function closeMenu() {
    if (activeMenu) activeMenu.remove();
    if (activeBackdrop) activeBackdrop.remove();
    if (activeButton) activeButton.classList.remove("eduka-menu-trigger-active");
    activeMenu = null;
    activeBackdrop = null;
    activeButton = null;
    document.querySelectorAll(".eduka-old-menu-suppressed").forEach(el => el.classList.remove("eduka-old-menu-suppressed"));
  }

  function placeMenu(menu, rect) {
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(260, Math.max(224, menu.offsetWidth || 224));

    let left = Math.min(vw - width - 12, Math.max(12, rect.right - width));
    let top = rect.bottom + gap;

    menu.style.width = width + "px";
    menu.style.left = left + "px";
    menu.style.top = top + "px";

    requestAnimationFrame(() => {
      const mr = menu.getBoundingClientRect();
      if (mr.bottom > vh - 12) {
        top = Math.max(12, rect.top - mr.height - gap);
        menu.style.top = top + "px";
      }
      const fixed = menu.getBoundingClientRect();
      if (fixed.right > vw - 12) menu.style.left = (vw - fixed.width - 12) + "px";
      if (fixed.left < 12) menu.style.left = "12px";
    });
  }

  function createMenu(trigger) {
    closeMenu();

    activeButton = trigger;
    activeButton.classList.add("eduka-menu-trigger-active");
    lastTriggerRect = trigger.getBoundingClientRect();

    const row = rowOf(trigger);
    const actions = actionsFor(trigger, row);
    const normal = actions.filter(a => !a.danger);
    const danger = actions.filter(a => a.danger);

    activeBackdrop = document.createElement("div");
    activeBackdrop.className = "eduka-menu-backdrop-click";
    document.body.appendChild(activeBackdrop);

    activeMenu = document.createElement("div");
    activeMenu.className = "eduka-floating-action-menu";
    activeMenu.setAttribute("role", "menu");
    activeMenu.innerHTML = `
      <ul class="eduka-menu-section">
        ${normal.map(action => `
          <li class="eduka-menu-item" role="menuitem" tabindex="0" data-action="${escapeAttr(action.key)}">
            ${icon(action.icon)}
            <span>${escapeHtml(action.label)}</span>
          </li>
        `).join("")}
      </ul>
      ${danger.length ? `<div class="eduka-menu-separator"></div><ul class="eduka-menu-section">
        ${danger.map(action => `
          <li class="eduka-menu-item danger" role="menuitem" tabindex="0" data-action="${escapeAttr(action.key)}">
            ${icon(action.icon)}
            <span>${escapeHtml(action.label)}</span>
          </li>
        `).join("")}
      </ul>` : ""}
    `;
    document.body.appendChild(activeMenu);
    placeMenu(activeMenu, lastTriggerRect);

    activeBackdrop.addEventListener("click", closeMenu);
    activeMenu.addEventListener("click", (event) => {
      const item = event.target.closest("[data-action]");
      if (!item) return;
      const action = actions.find(a => a.key === item.dataset.action) || { key: item.dataset.action, label: item.textContent.trim() };
      closeMenu();
      runAction(action, trigger, row);
    });
    activeMenu.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
      if (event.key === "Enter") event.target.click();
    });

    suppressOldMenus();
  }

  function selectorFor(actionKey) {
    const map = {
      view: '[data-action="view"],[data-row-action="view"],[aria-label*="Ko"],[title*="Ko"],.view-action,.show-action',
      edit: '[data-action="edit"],[data-row-action="edit"],[aria-label*="Tahrir"],[title*="Tahrir"],.edit-action',
      receipt: '[data-action="receipt"],[data-row-action="receipt"],[aria-label*="Chek"],[title*="Chek"],.receipt-action',
      print: '[data-action="print"],[data-row-action="print"],[aria-label*="Print"],[aria-label*="Chop"],[title*="Chop"],.print-action',
      copy: '[data-action="copy"],[data-row-action="copy"],[aria-label*="Copy"],[title*="Copy"],.copy-action',
      archive: '[data-action="archive"],[data-row-action="archive"],[aria-label*="Arxiv"],[title*="Arxiv"],.archive-action',
      delete: '[data-action="delete"],[data-row-action="delete"],[aria-label*="Delete"],[title*="Delete"],.delete-action'
    };
    return map[actionKey] || `[data-action="${CSS.escape(actionKey)}"],[data-row-action="${CSS.escape(actionKey)}"]`;
  }

  function runAction(action, trigger, row) {
    const native = row?.querySelector?.(selectorFor(action.key));
    if (native && native !== trigger && !looksLikeDotsElement(native)) {
      native.click();
      return;
    }

    trigger.dispatchEvent(new CustomEvent("eduka:row-action", {
      bubbles: true,
      detail: {
        action: action.key,
        label: action.label,
        row,
        rowId: row?.dataset?.rowId || row?.getAttribute?.("data-id") || null
      }
    }));

    showToast(`${action.label} tanlandi`, action.danger ? "error" : "info");
  }

  function suppressOldMenus() {
    setTimeout(() => {
      document.querySelectorAll(".dropdown-menu,.action-menu,.context-menu,.row-menu,.menu,.popover,[role='menu']").forEach(el => {
        if (el === activeMenu || activeMenu?.contains(el)) return;
        const rect = el.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0;
        if (visible) el.classList.add("eduka-old-menu-suppressed");
      });
    }, 0);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function showToast(message, type = "info") {
    const toast = document.querySelector("[data-toast]");
    if (toast) {
      toast.hidden = false;
      toast.className = `toast toast-${type}`;
      toast.textContent = message;
      clearTimeout(window.__edukaActionToastTimer);
      window.__edukaActionToastTimer = setTimeout(() => { toast.hidden = true; }, 2300);
      return;
    }
    console.log("[Eduka]", message);
  }

  function upgradeSearchInputs() {
    const selector = [
      'input[type="search"]',
      'input[placeholder*="Qidir"]',
      'input[placeholder*="qidir"]',
      'input[placeholder*="Search"]',
      'input[name*="search"]',
      '.search-input',
      '#search'
    ].join(",");

    document.querySelectorAll(selector).forEach(input => {
      if (input.closest(".eduka-search-wrap")) return;
      const parent = input.parentElement;
      if (!parent) return;
      const wrap = document.createElement("span");
      wrap.className = "eduka-search-wrap";
      parent.insertBefore(wrap, input);
      wrap.appendChild(input);
    });
  }

  function forceOverflowSafe() {
    document.querySelectorAll(".table,.crm-table,.table-wrap,.table-container,.data-table,.card,.panel,.content,.workspace,.drawer,.modal,[class*='table'],[class*='card'],[class*='panel']").forEach(el => {
      el.style.overflow = "visible";
    });
  }

  function boot() {
    upgradeSearchInputs();
    forceOverflowSafe();

    document.addEventListener("pointerdown", (event) => {
      const trigger = findTriggerFromEvent(event);
      if (!trigger) {
        if (!event.target.closest?.(".eduka-floating-action-menu")) closeMenu();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (activeButton === trigger) closeMenu();
      else createMenu(trigger);
    }, true);

    document.addEventListener("click", (event) => {
      const trigger = findTriggerFromEvent(event);
      if (trigger) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    }, true);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    new MutationObserver(() => {
      upgradeSearchInputs();
      forceOverflowSafe();
      if (activeMenu) suppressOldMenus();
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });

    console.log(`Eduka ${VERSION} loaded`);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
