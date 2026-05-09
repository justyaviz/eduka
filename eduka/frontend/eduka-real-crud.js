(() => {
  "use strict";
  const coreResources = new Set(["students", "groups", "teachers", "courses", "payments", "attendance", "debts"]);
  const exportMap = {
    students: "/api/app/export/students",
    groups: "/api/app/export/groups",
    teachers: "/api/app/export/teachers",
    courses: "/api/app/export/courses",
    payments: "/api/app/export/payments",
    attendance: "/api/app/export/attendance",
    debtors: "/api/app/export/debts",
    debts: "/api/app/export/debts",
    reports: "/api/app/export/payments",
    finance: "/api/app/export/payments",
    staff: "/api/app/export/attendance"
  };

  function toast(message, type = "success") {
    if (typeof window.showToast === "function") return window.showToast(message, type);
    console.log(`[Eduka ${type}] ${message}`);
  }

  async function json(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "So'rov bajarilmadi");
    return payload;
  }

  function download(url) {
    const link = document.createElement("a");
    link.href = url;
    link.download = "";
    document.body.append(link);
    link.click();
    link.remove();
  }

  function setLoading(button, loading) {
    if (!button) return;
    button.disabled = loading;
    if (loading) {
      button.dataset.oldText = button.textContent;
      button.textContent = "Yuklanmoqda...";
    } else if (button.dataset.oldText) {
      button.textContent = button.dataset.oldText;
      delete button.dataset.oldText;
    }
  }

  function currentResourceFromView() {
    const path = location.pathname;
    if (path.includes("students")) return "students";
    if (path.includes("groups")) return "groups";
    if (path.includes("teachers")) return "teachers";
    if (path.includes("courses")) return "courses";
    if (path.includes("attendance")) return "attendance";
    if (path.includes("debt")) return "debts";
    if (path.includes("finance") || path.includes("payment") || path.includes("report")) return "payments";
    const active = document.querySelector(".view.active, .view:not([hidden])");
    return active?.id || "reports";
  }

  async function handleServerExport(button) {
    const rawResource = button.dataset.resource || button.dataset.generatedResource || currentResourceFromView();
    const resource = rawResource === "debtors" ? "debts" : rawResource;
    const url = exportMap[resource] || exportMap[currentResourceFromView()] || exportMap.reports;
    const params = new URLSearchParams();
    document.querySelectorAll(`[data-filter-scope="${resource}"] [data-filter], [data-filter-scope="${rawResource}"] [data-filter]`).forEach((field) => {
      if (field.value) params.set(field.dataset.filter, field.value);
    });
    const finalUrl = params.toString() ? `${url}?${params}` : url;
    download(finalUrl);
    toast("Excel/CSV export serverdan tayyorlandi.");
  }

  async function cancelPayment(button) {
    const id = button.dataset.id;
    if (!id) return toast("To'lov ID topilmadi.", "warning");
    if (!confirm("To'lovni bekor qilamizmi?")) return;
    setLoading(button, true);
    try {
      await json(`/api/app/payments/${id}/cancel`, { method: "POST", body: JSON.stringify({}) });
      toast("To'lov bekor qilindi.");
      location.reload();
    } catch (error) {
      toast(error.message, "error");
    } finally {
      setLoading(button, false);
    }
  }

  async function openProfileFromSearch(resource, id) {
    if (!id) return;
    if (typeof window.setView === "function") {
      const map = { students: "student-profile", groups: "group-profile", teachers: "teacher-profile" };
      if (map[resource]) return window.setView(map[resource], { route: `/admin/${resource}/${id}` });
    }
    history.pushState({}, "", `/admin/${resource}/${id}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function addRealActionBadges() {
    document.querySelectorAll("[data-crm-action]").forEach((button) => {
      const action = button.dataset.crmAction;
      const resource = button.dataset.resource || button.dataset.generatedResource;
      const isReal = ["export-excel", "export-pdf", "save-attendance-page", "save-settings", "view", "edit", "delete", "payment", "convert-lead", "lead-status"].includes(action) || coreResources.has(resource);
      button.classList.toggle("eduka-real-action", Boolean(isReal));
    });
  }

  function ensureFinanceQuickActions() {
    document.querySelectorAll('[data-resource="payments"][data-id]').forEach((node) => {
      const row = node.closest("tr, article, div");
      if (!row || row.querySelector("[data-crm-action='cancel-payment']")) return;
      const id = node.dataset.id;
      const holder = row.querySelector("td:last-child, .lead-actions, .row-actions") || row;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "eduka-danger-mini";
      btn.dataset.crmAction = "cancel-payment";
      btn.dataset.id = id;
      btn.textContent = "Bekor qilish";
      holder.append(btn);
    });
  }

  function init() {
    addRealActionBadges();
    ensureFinanceQuickActions();
    const observer = new MutationObserver(() => {
      addRealActionBadges();
      ensureFinanceQuickActions();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-crm-action]");
    if (!button) return;
    const action = button.dataset.crmAction;
    if (action === "export-excel") {
      event.preventDefault();
      event.stopPropagation();
      await handleServerExport(button);
      return;
    }
    if (action === "cancel-payment") {
      event.preventDefault();
      event.stopPropagation();
      await cancelPayment(button);
      return;
    }
    if (action === "view" && button.dataset.resource && button.dataset.id) {
      const resource = button.dataset.resource;
      if (["students", "groups", "teachers"].includes(resource)) {
        event.preventDefault();
        event.stopPropagation();
        await openProfileFromSearch(resource, button.dataset.id);
      }
    }
  }, true);

  window.edukaRealCrud = { json, handleServerExport, openProfileFromSearch };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
