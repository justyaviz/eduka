const authScreen = document.querySelector("[data-auth-screen]");
const appShell = document.querySelector("[data-app-shell]");
const loginForm = document.querySelector("[data-login-form]");
const pageViews = document.querySelectorAll(".view");
const navButtons = document.querySelectorAll("[data-view]");
const toast = document.querySelector("[data-toast]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const financeSubnav = document.querySelector('[data-subnav="finance"]');
const settingsSubnav = document.querySelector('[data-subnav="settings"]');

let toastTimer;

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function setView(viewName) {
  pageViews.forEach((view) => view.classList.toggle("active", view.id === viewName));
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));

  const isFinance = ["finance", "withdrawals", "expenses", "salary", "debtors"].includes(viewName);
  financeSubnav.hidden = !isFinance;
  settingsSubnav.hidden = viewName !== "settings";
  document.body.classList.remove("menu-open");
}

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  authScreen.hidden = true;
  appShell.hidden = false;
  setView("dashboard");
  showToast("Kabinetga kirildi.");
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
