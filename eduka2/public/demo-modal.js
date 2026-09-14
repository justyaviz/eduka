/* EDUKA demo modal — single real API flow (v0.2) */
(function () {
  const root = document.getElementById("demo-modal-root");
  if (!root) return;

  const form = root.querySelector("[data-demo-form]");
  const success = root.querySelector("[data-demo-success]");
  const submit = root.querySelector(".demo-submit");
  const managerStep = root.querySelector('[data-step="manager"]');
  const successBox = root.querySelector(".demo-success");
  let lastFocused = null;
  let pending = false;

  function ensureErrorBox() {
    if (!form) return null;
    let box = form.querySelector("[data-demo-error]");
    if (!box) {
      box = document.createElement("div");
      box.setAttribute("data-demo-error", "");
      box.setAttribute("role", "alert");
      box.hidden = true;
      box.style.cssText = "margin:10px 0 0;padding:12px 14px;border-radius:12px;background:#fff1f0;color:#b42318;font:700 13px/1.45 Manrope,sans-serif;";
      submit?.before(box);
    }
    return box;
  }

  const errorBox = ensureErrorBox();

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message || "So‘rov yuborilmadi. Iltimos, qayta urinib ko‘ring.";
    errorBox.hidden = false;
  }

  function clearError() {
    if (!errorBox) return;
    errorBox.hidden = true;
    errorBox.textContent = "";
  }

  function openDemo(event) {
    if (event) event.preventDefault();
    lastFocused = document.activeElement;
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("demo-modal-open");
    clearError();
    setTimeout(() => root.querySelector('input[name="name"]')?.focus(), 120);
  }

  function closeDemo() {
    if (pending) return;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("demo-modal-open");
    setTimeout(() => lastFocused?.focus?.(), 60);
  }

  function validate() {
    if (!form || !submit) return;
    submit.disabled = pending || !form.checkValidity();
  }

  function normalizePhone(raw) {
    const digits = String(raw || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("998")) return `+${digits}`;
    return `+998${digits}`;
  }

  async function submitDemo() {
    const data = Object.fromEntries(new FormData(form).entries());
    const payload = {
      name: String(data.name || "").trim(),
      center: String(data.center || "").trim(),
      phone: normalizePhone(data.phone),
      payment: String(data.payment || "Tanlanmagan").trim(),
      source: "landing"
    };

    pending = true;
    clearError();
    if (submit) {
      submit.disabled = true;
      submit.dataset.originalText = submit.dataset.originalText || submit.textContent;
      submit.textContent = "Yuborilmoqda…";
    }

    try {
      const response = await fetch("/api/demo-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      let result = null;
      try { result = await response.json(); } catch (_) {}

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Server so‘rovni qabul qilmadi");
      }

      form.hidden = true;
      success.hidden = false;
      successBox?.classList.remove("manager-done");
      managerStep?.classList.remove("is-active");

      window.dispatchEvent(new CustomEvent("eduka:demo-request-created", { detail: result.demo }));

      setTimeout(() => {
        successBox?.classList.add("manager-done");
        managerStep?.classList.add("is-active");
      }, 700);
    } catch (error) {
      showError(error.message || "So‘rov yuborilmadi. Internetni tekshirib qayta urinib ko‘ring.");
    } finally {
      pending = false;
      if (submit) {
        submit.textContent = submit.dataset.originalText || "Demo olish";
      }
      validate();
    }
  }

  document.querySelectorAll("[data-demo-open]").forEach((btn) => {
    btn.addEventListener("click", openDemo);
  });

  root.querySelectorAll("[data-demo-close]").forEach((btn) => {
    btn.addEventListener("click", closeDemo);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && root.classList.contains("is-open")) closeDemo();
  });

  form?.addEventListener("input", () => {
    clearError();
    validate();
  });
  form?.addEventListener("change", validate);
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pending || !form.checkValidity()) {
      form.reportValidity();
      validate();
      return;
    }
    await submitDemo();
  });

  root.querySelectorAll("[data-demo-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setTimeout(() => {
        if (!root.classList.contains("is-open") && !pending) {
          form.hidden = false;
          success.hidden = true;
          form.reset();
          clearError();
          managerStep?.classList.remove("is-active");
          successBox?.classList.remove("manager-done");
          validate();
        }
      }, 220);
    });
  });

  validate();
})();
