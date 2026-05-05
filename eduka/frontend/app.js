const authScreen = document.querySelector("[data-auth-screen]");
const appShell = document.querySelector("[data-app-shell]");
const loginForm = document.querySelector("[data-login-form]");
const roleSelect = document.querySelector("[data-role-select]");
const roleLabel = document.querySelector("[data-role-label]");
const pageTitle = document.querySelector("[data-page-title]");
const toast = document.querySelector("[data-toast]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

const titles = {
  dashboard: "Dashboard",
  students: "O'quvchilar",
  leads: "Lidlar / Sotuv bo'limi",
  groups: "Guruhlar",
  attendance: "Davomad",
  payments: "To'lovlar",
  schedule: "Dars jadvali",
  teachers: "O'qituvchilar",
  reports: "Hisobotlar",
  branches: "Filiallar",
  staff: "Xodimlar va rollar",
  settings: "Sozlamalar",
  gamification: "Gamification"
};

const roleNames = {
  owner: "Rahbar paneli",
  manager: "Menejer paneli",
  teacher: "O'qituvchi paneli",
  accountant: "Buxgalter paneli",
  admin: "Admin paneli"
};

const roleAccess = {
  owner: ["dashboard", "students", "leads", "groups", "attendance", "payments", "schedule", "teachers", "reports", "branches", "staff", "settings", "gamification"],
  admin: ["dashboard", "students", "leads", "groups", "attendance", "payments", "schedule", "teachers", "reports", "branches", "staff", "settings", "gamification"],
  manager: ["dashboard", "students", "leads", "groups", "schedule", "reports"],
  teacher: ["dashboard", "groups", "attendance", "schedule", "gamification"],
  accountant: ["dashboard", "students", "payments", "reports", "branches"]
};

let toastTimer;

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function setView(viewName) {
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewName));
  document.querySelectorAll(".side-nav button").forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
  pageTitle.textContent = titles[viewName] || "Dashboard";
  document.body.classList.remove("menu-open");
}

function applyRole(role) {
  const allowedViews = roleAccess[role] || roleAccess.owner;
  roleLabel.textContent = roleNames[role] || roleNames.owner;

  document.querySelectorAll(".side-nav button").forEach((button) => {
    button.hidden = !allowedViews.includes(button.dataset.view);
  });

  setView(allowedViews[0]);
}

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  authScreen.hidden = true;
  appShell.hidden = false;
  applyRole(roleSelect.value);
  showToast("Kabinet demo rejimda ochildi.");
});

document.querySelector("[data-send-code]")?.addEventListener("click", () => {
  showToast("SMS/Telegram kod yuborish oqimi keyingi bosqichda ulanadi.");
});

document.querySelector("[data-forgot]")?.addEventListener("click", () => {
  showToast("Parolni tiklash linki SMS yoki Telegram orqali yuboriladi.");
});

document.querySelectorAll(".side-nav button").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

mobileMenu?.addEventListener("click", () => {
  document.body.classList.toggle("menu-open");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") document.body.classList.remove("menu-open");
});
