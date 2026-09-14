
/* ===== EDUKA Real Demo Request Bridge ===== */
(function () {
  if (window.__EDUKA_DEMO_REAL_BRIDGE__) return;
  window.__EDUKA_DEMO_REAL_BRIDGE__ = true;

  const KEY = "eduka_demo_requests_real";

  function normalizePhone(prefix, phone) {
    const p = String(prefix || "+998").replace(/[^\d+]/g, "") || "+998";
    const n = String(phone || "").replace(/\D/g, "");
    if (String(phone || "").trim().startsWith("+")) return String(phone).trim();
    return `${p} ${n}`.replace("+998 ", "+998 ");
  }

  function saveDemoRequest(form) {
    const inputs = Array.from(form.querySelectorAll("input, select, textarea"));
    const getByName = (name) => form.querySelector(`[name="${name}"]`)?.value || "";

    const name =
      getByName("name") ||
      inputs.find((el) => /ism|name/i.test(el.placeholder || "") && el.type !== "hidden")?.value ||
      "";

    const center =
      getByName("center") ||
      getByName("centerName") ||
      inputs.find((el) => /markaz|center/i.test(el.placeholder || ""))?.value ||
      "";

    const phone =
      getByName("phone") ||
      inputs.find((el) => /99|telefon|phone/i.test(el.placeholder || "") && el.type !== "hidden")?.value ||
      "";

    const payment =
      getByName("payment") ||
      getByName("paymentMode") ||
      form.querySelector("select")?.value ||
      "";

    const request = {
      id: `DR-${Date.now()}`,
      name: String(name || "").trim() || "Noma’lum",
      center: String(center || "").trim() || "Noma’lum markaz",
      phone: normalizePhone("+998", phone),
      payment: String(payment || "").trim() || "Tanlanmagan",
      status: "Yangi",
      manager: "Tayinlanmagan",
      source: "Landing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const list = JSON.parse(localStorage.getItem(KEY) || "[]");
      list.unshift(request);
      localStorage.setItem(KEY, JSON.stringify(list));
      localStorage.setItem("eduka_demo_requests", JSON.stringify(list));
      window.dispatchEvent(new CustomEvent("eduka:demo-request-created", { detail: request }));
    } catch (error) {
      console.warn("EDUKA demo request save error:", error);
    }

    return request;
  }

  document.addEventListener("submit", function (event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    const modal = form.closest(".demo-modal-root, .demo-modal-overlay, .eduka-demo-fallback, #demo-modal-root, #demo-modal");
    const formText = (form.textContent || "").toLowerCase();

    if (modal || formText.includes("demo olish") || form.querySelector("[name='center'], [name='payment']")) {
      saveDemoRequest(form);
    }
  }, true);
})();
