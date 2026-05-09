(() => {
  const loginKeys = [
    "eduka_admin_session_v1",
    "eduka_admin_state_v2",
    "eduka_selected_center",
    "eduka_user",
    "eduka_session_user"
  ];

  function clearBrowserTenantState() {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith("eduka_tenant_session_") ||
          key.startsWith("eduka_center_") ||
          key.startsWith("eduka_crm_") ||
          key.includes("tenant") ||
          loginKeys.includes(key)
        ) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("eduka") || key.includes("tenant")) sessionStorage.removeItem(key);
      });
    } catch {}
  }

  async function logoutOldSession() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" }
      });
    } catch {}
  }

  async function postJson(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Login bajarilmadi");
    return data;
  }

  function isSuperRole(role) {
    return ["super_admin", "platform_owner", "platform_admin"].includes(String(role || "").toLowerCase());
  }

  document.addEventListener("DOMContentLoaded", async () => {
    clearBrowserTenantState();
    await logoutOldSession();

    const form = document.getElementById("ceoLoginForm");
    const errorBox = document.getElementById("ceoLoginError");
    const button = form?.querySelector("button");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      errorBox.textContent = "";
      button.disabled = true;
      button.textContent = "Tekshirilmoqda...";
      try {
        const body = Object.fromEntries(new FormData(form).entries());
        const payload = await postJson("/api/auth/login", body);
        const user = payload.user || payload;
        if (!isSuperRole(user.role)) {
          await logoutOldSession();
          throw new Error("Bu login CEO/Super Admin emas. Super Admin user: yaviz@eduka.uz bo‘lishi kerak.");
        }
        try {
          localStorage.setItem("eduka_admin_session_v1", JSON.stringify({
            id: user.id,
            fullName: user.fullName || user.full_name || "Yaviz Super Admin",
            email: user.email,
            role: user.role,
            loggedInAt: new Date().toISOString()
          }));
        } catch {}
        window.location.replace("/ceo/dashboard?v=21.8.3");
      } catch (error) {
        errorBox.textContent = error.message || "Login xato";
        button.disabled = false;
        button.textContent = "CEO panelga kirish";
      }
    });
  });
})();
