
/**
 * Eduka 21.4.4 Global Three-Dot Action Menu Fix
 * Fixes clipped/hidden dropdowns across all pages by rendering menus in document.body.
 * Load after app.js and payment-receipt-hotfix.js.
 */
(function () {
  const VERSION = "21.4.4-action-menu";
  let menu = null;
  let button = null;

  const ACTIONS = [
    { key: "view", label: "Ko'rish", icon: "eye" },
    { key: "edit", label: "Tahrirlash", icon: "edit" },
    { key: "receipt", label: "Chek", icon: "receipt", pay: true },
    { key: "print", label: "Chop etish", icon: "printer", pay: true },
    { key: "archive", label: "Arxivlash", icon: "archive" },
    { key: "delete", label: "O'chirish", icon: "trash", danger: true }
  ];

  function svg(name) {
    const p = {
      eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
      edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>',
      receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>',
      printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
      archive: '<path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>',
      trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
      dots: '<circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (p[name] || p.dots) + '</svg>';
  }

  function isDots(el) {
    if (!el) return false;
    if (el.matches('[data-action-menu],[data-row-actions],.row-actions,.action-menu,.kebab,.more-button,.more,.dots')) return true;
    const t = (el.textContent || '').trim();
    const a = ((el.getAttribute('aria-label') || '') + ' ' + (el.title || '')).toLowerCase();
    return t === '...' || t === '⋯' || t === '•••' || a.includes('more') || a.includes('action') || a.includes('amal');
  }

  function rowOf(btn) {
    return btn.closest('[data-row-id],tr,.table-row,.student-row,.crm-row,.student-card,.crm-card,article') || btn.closest('div');
  }

  function context(btn, row) {
    const view = document.querySelector('.view.active')?.id || '';
    const table = btn.closest('[data-table]')?.dataset.table || '';
    const tx = (row?.innerText || '').toLowerCase();
    return { payment: /payment|finance|tolov|to'lov|so'm|chek/.test(view + ' ' + table + ' ' + tx) };
  }

  function actionsFor(btn, row) {
    const raw = btn.getAttribute('data-actions');
    if (raw) {
      return raw.split(',').map(x => x.trim()).filter(Boolean).map(k => ACTIONS.find(a => a.key === k) || { key: k, label: k, icon: 'dots' });
    }
    const c = context(btn, row);
    return ACTIONS.filter(a => !a.pay || c.payment);
  }

  function close() {
    if (menu) menu.remove();
    if (button) button.classList.remove('eduka-menu-open');
    menu = null;
    button = null;
  }

  function place(m, btn) {
    const r = btn.getBoundingClientRect();
    const w = 220;
    let left = Math.min(window.innerWidth - w - 12, Math.max(12, r.right - w));
    let top = r.bottom + 8;
    m.style.left = left + 'px';
    m.style.top = top + 'px';
    m.style.width = w + 'px';
    requestAnimationFrame(() => {
      const mr = m.getBoundingClientRect();
      if (mr.bottom > window.innerHeight - 12) m.style.top = Math.max(12, r.top - mr.height - 8) + 'px';
      const nr = m.getBoundingClientRect();
      if (nr.right > window.innerWidth - 12) m.style.left = (window.innerWidth - nr.width - 12) + 'px';
      if (nr.left < 12) m.style.left = '12px';
    });
  }

  function nativeClick(action, btn, row) {
    const q = {
      view: '[data-action="view"],[data-row-action="view"],[aria-label*="Ko"],.view-action',
      edit: '[data-action="edit"],[data-row-action="edit"],[aria-label*="Tahrir"],.edit-action',
      receipt: '[data-action="receipt"],[data-row-action="receipt"],[aria-label*="Chek"],.receipt-action',
      print: '[data-action="print"],[data-row-action="print"],[aria-label*="Print"],[aria-label*="Chop"],.print-action',
      archive: '[data-action="archive"],[data-row-action="archive"],[aria-label*="Arxiv"],.archive-action',
      delete: '[data-action="delete"],[data-row-action="delete"],[aria-label*="Delete"],.delete-action'
    }[action.key];
    const native = q ? row?.querySelector(q) : null;
    if (native && native !== btn) return native.click();

    btn.dispatchEvent(new CustomEvent('eduka:row-action', { bubbles: true, detail: { action: action.key, row } }));
    const toast = document.querySelector('[data-toast]');
    if (toast) {
      toast.hidden = false;
      toast.className = 'toast ' + (action.danger ? 'toast-error' : 'toast-info');
      toast.textContent = action.label + ' tanlandi';
      setTimeout(() => { toast.hidden = true; }, 2200);
    }
  }

  function open(btn) {
    close();
    button = btn;
    button.classList.add('eduka-menu-open');
    const row = rowOf(btn);
    const actions = actionsFor(btn, row);

    const normal = actions.filter(a => !a.danger).map(a =>
      '<li class="element" role="menuitem" tabindex="0" data-menu-action="' + a.key + '">' + svg(a.icon) + '<span class="label">' + a.label + '</span></li>'
    ).join('');
    const danger = actions.filter(a => a.danger).map(a =>
      '<li class="element delete" role="menuitem" tabindex="0" data-menu-action="' + a.key + '">' + svg(a.icon) + '<span class="label">' + a.label + '</span></li>'
    ).join('');

    menu = document.createElement('div');
    menu.className = 'eduka-action-card';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = '<ul class="list primary-list">' + normal + '</ul>' + (danger ? '<div class="separator"></div><ul class="list danger-list">' + danger + '</ul>' : '');
    document.body.appendChild(menu);
    place(menu, btn);

    menu.addEventListener('click', e => {
      const item = e.target.closest('[data-menu-action]');
      if (!item) return;
      const action = actions.find(a => a.key === item.dataset.menuAction) || { key: item.dataset.menuAction, label: item.textContent.trim() };
      close();
      nativeClick(action, btn, row);
    });
  }

  function safeOverflow() {
    document.querySelectorAll('.table,[data-table],.crm-table,.panel,.card,.drawer,.modal,.content,.workspace').forEach(el => {
      el.classList.add('eduka-overflow-safe');
    });
  }

  function boot() {
    safeOverflow();
    document.addEventListener('click', e => {
      if (e.target.closest('.eduka-action-card')) return;
      const btn = e.target.closest('button,a');
      if (btn && isDots(btn)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return button === btn ? close() : open(btn);
      }
      close();
    }, true);

    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    new MutationObserver(safeOverflow).observe(document.body, { childList: true, subtree: true });
    console.log('Eduka ' + VERSION + ' loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
