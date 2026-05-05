const authScreen = document.querySelector("[data-auth-screen]");
const appShell = document.querySelector("[data-app-shell]");
const loginForm = document.querySelector("[data-login-form]");
const pageViews = document.querySelectorAll(".view");
const navButtons = document.querySelectorAll("[data-view]");
const toast = document.querySelector("[data-toast]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const financeSubnav = document.querySelector('[data-subnav="finance"]');
const settingsSubnav = document.querySelector('[data-subnav="settings"]');
const centerName = document.querySelector("[data-center-name]");

let toastTimer;

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3600);
}

function showApp(user) {
  authScreen.hidden = true;
  appShell.hidden = false;

  if (user?.organization?.name) {
    centerName.textContent = user.organization.name;
  }

  setView("dashboard");
  loadSummary();
}

function showAuth() {
  authScreen.hidden = false;
  appShell.hidden = true;
}

function setView(viewName) {
  pageViews.forEach((view) => view.classList.toggle("active", view.id === viewName));
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));

  const isFinance = ["finance", "withdrawals", "expenses", "salary", "debtors"].includes(viewName);
  financeSubnav.hidden = !isFinance;
  settingsSubnav.hidden = viewName !== "settings";
  document.body.classList.remove("menu-open");
}

async function readJson(response) {
  return response.json().catch(() => ({}));
}

async function checkSession() {
  try {
    const response = await fetch("/api/auth/me", { credentials: "same-origin" });

    if (!response.ok) {
      showAuth();
      return;
    }

    const payload = await readJson(response);
    showApp(payload.user);
  } catch {
    showAuth();
  }
}

async function loadSummary() {
  try {
    const response = await fetch("/api/app/summary", { credentials: "same-origin" });
    if (!response.ok) return;

    const payload = await readJson(response);
    const summary = payload.summary || {};

    document.querySelectorAll("[data-summary]").forEach((node) => {
      const value = summary[node.dataset.summary];
      node.textContent = Number(value || 0).toLocaleString("uz-UZ");
    });
  } catch {
    // Dashboard stays at zero if the database is temporarily unavailable.
  }
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = loginForm.querySelector("button[type='submit']");
  const formData = new FormData(loginForm);

  submitButton.disabled = true;
  submitButton.textContent = "Tekshirilmoqda...";

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        phone: formData.get("phone"),
        password: formData.get("password")
      })
    });
    const payload = await readJson(response);

    if (!response.ok) {
      throw new Error(payload.message || "Kirish amalga oshmadi");
    }

    showApp(payload.user);
    showToast("Kabinetga muvaffaqiyatli kirildi.");
  } catch (error) {
    showToast(`${error.message}. Parol esdan chiqqan bo'lsa, Telegram adminiga yozing: @eduka_admin`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Kirish";
  }
});

document.querySelector("[data-forgot]")?.addEventListener("click", () => {
  showToast("Parol esdan chiqqan bo'lsa, Telegram adminiga yozing: @eduka_admin");
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

mobileMenu?.addEventListener("click", () => {
  document.body.classList.toggle("menu-open");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") document.body.classList.remove("menu-open");
});

checkSession();
