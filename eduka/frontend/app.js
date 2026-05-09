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
const modal = document.querySelector("[data-modal]");
const modalForm = document.querySelector("[data-modal-form]");
const modalTitle = document.querySelector("[data-modal-title]");
const onboarding = document.querySelector("[data-onboarding]");
const onboardingSteps = document.querySelector("[data-onboarding-steps]");
const onboardingForm = document.querySelector("[data-onboarding-form]");

const EDUKA_VERSION = "21.8.0";
function finishBoot() {
  document.body.classList.remove("is-booting");
  window.setTimeout(() => document.querySelector("[data-boot-loader]")?.remove(), 700);
}
function allowDevelopmentFallback() {
  const host = window.location.hostname;
  const devHost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(host);
  return devHost && localStorage.getItem("eduka_allow_demo") === "1";
}
window.addEventListener("load", () => window.setTimeout(finishBoot, 650));

let toastTimer;
let activeModal = null;
let editingId = null;
let currentUser = null;
let currentTenant = null;
const state = {
  students: [],
  leads: [],
  groups: [],
  courses: [],
  teachers: [],
  payments: [],
  attendance: [],
  debts: [],
  schedule: [],
  rooms: [],
  paymentTypes: [],
  extraIncomes: [],
  expenses: [],
  salaryPayments: [],
  bonuses: [],
  financeTransactions: [],
  staffAttendance: [],
  notifications: [],
  audit: [],
  superCenters: [],
  superTariffs: [],
  superSubscriptions: [],
  superPayments: [],
  superSupport: [],
  analytics: {},
  superSummary: {},
  studentApp: {
    dashboard: {},
    latestLogins: [],
    latestReferrals: [],
    latestFeedback: [],
    access: [],
    modules: [],
    settings: {},
    library: [],
    dictionary: [],
    news: [],
    events: [],
    referrals: [],
    extraLessons: [],
    exams: [],
    feedback: [],
    telegramStatus: {},
    webhookInfo: {},
    loading: false,
    error: ""
  }
};
const adminRouteKeys = [
  "login",
  "dashboard",
  "centers",
  "centers-new",
  "center-profile",
  "subdomains",
  "subscriptions",
  "payments",
  "plans",
  "demo-requests",
  "support",
  "admin-users",
  "audit-log",
  "settings",
  "not-found"
];
const adminViews = new Set(adminRouteKeys.map((key) => `admin-${key}`));
const adminProtectedViews = new Set([...adminViews].filter((view) => view !== "admin-login"));
const stateMeta = {};
const endpoints = {
  students: "/api/students",
  leads: "/api/leads",
  groups: "/api/groups",
  courses: "/api/courses",
  teachers: "/api/teachers",
  payments: "/api/payments",
  attendance: "/api/attendance",
  debts: "/api/debts",
  rooms: "/api/rooms",
  paymentTypes: "/api/payment-types",
  staffAttendance: "/api/app/staff-attendance",
  notifications: "/api/app/notifications",
  financeTransactions: "/api/app/finance/transactions",
  extraIncomes: "/api/app/finance/extra-incomes",
  salaryPayments: "/api/app/finance/salary",
  bonuses: "/api/app/finance/bonuses",
  expenses: "/api/app/finance/expenses",
  audit: "/api/audit-logs"
};
const uiState = {
  globalSearch: "",
  filters: {},
  page: { students: 1, leads: 1, groups: 1, courses: 1, teachers: 1, payments: 1, attendance: 1, debts: 1, notifications: 1, audit: 1, superCenters: 1, superSubscriptions: 1, superPayments: 1 },
  perPage: { students: 10, leads: 10, groups: 10, courses: 10, teachers: 10, payments: 10, attendance: 10, debts: 10, notifications: 10, audit: 10, superCenters: 10, superSubscriptions: 10, superPayments: 10 }
};

const uiIcons = {
  archive: "archive",
  bell: "bell",
  check: "check",
  edit: "pencil",
  "log-out": "log-out",
  menu: "menu",
  plus: "plus",
  trash: "trash-2",
  "user-plus": "user-plus",
  users: "users",
  wallet: "wallet"
};

const generatedViews = {
  "center-info": ["Markaz ma'lumotlari", "Telegram, YouTube, Instagram, operator va support kontaktlari", "form"],
  "general-settings": ["Umumiy sozlamalar", "Chek, davomat, qarzdorlik va o'qituvchi ruxsatlari", "toggles"],
  "office-settings": ["Ofis", "Lavozimlar, xodimlar, xonalar va bayram kunlari", "cards"],
  "learning-settings": ["O'quv bo'limi", "Kurslar, sabablar, testlar, ballar va imtihon shablonlari", "cards"],
  reasons: ["Sabablar", "Ketish, muzlatish va davomat sabablarini boshqarish", "table"],
  "level-test": ["Daraja testi", "Student daraja testlari va savollar sozlamasi", "table"],
  points: ["Ballar", "Davomat, imtihon va gamification ballari", "table"],
  "exam-templates": ["Imtihon shablonlari", "Imtihon formatlari, ball va chegirma qoidalari", "table"],
  positions: ["Lavozimlar ro'yhati", "Adminstrator, buxgalter, kassir, teacher va boshqa rollar", "roles"],
  employees: ["Xodimlar ro'yhati", "Xodimlar, rollar va ruxsatlarni boshqarish", "table"],
  rooms: ["Xonalar", "Xona bandligi va dars jadvali bilan bog'lash", "table"],
  branches: ["Filiallar", "Filial bo'yicha talabalar, tushum va xodimlar", "table"],
  telegram: ["Telegram xabarlar", "Qarzdorlik, davomat va lid eslatmalarini yuborish", "toggles"],
  holidays: ["Bayram kunlari", "Dam olish kunlari va o'quv kalendari", "table"],
  "receipt-settings": ["Chek sozlamalari", "Chek ko'rinishi, printer va fiskal sozlamalar", "receipt"],
  courses: ["Kurslar", "Kurs narxi, davomiyligi va darajalari", "table"],
  "sms-settings": ["SMS", "SMS sotib olish, auto sms va shablonlar", "toggles"],
  "sms-buy": ["SMS sotib olish", "SMS paketlari, balans va xarid tarixi", "market"],
  "sms-auto": ["Auto SMS", "Davomat, qarzdorlik va lid avtomatik xabarlari", "toggles"],
  "sms-templates": ["SMS shablonlari", "Professional SMS matnlarini CRUD orqali boshqarish", "table"],
  forms: ["Formalar", "Lid formalar va oddiy forma sozlamalari", "table"],
  "lead-forms": ["Lid formalar", "Marketing va referral lid formalarini sozlash", "table"],
  "simple-form": ["Oddiy forma", "Tezkor ro'yxatdan o'tish formasini sozlash", "form"],
  "referral-forms": ["Referral formalar", "Do'st taklif qilish formasi va mukofot qoidalari", "table"],
  tags: ["Teglar", "Talaba, lid va guruhlar uchun teglar", "table"],
  "payment-types": ["To'lov turlari", "Naqd, karta, Click, Payme va boshqa usullar", "table"],
  integrations: ["Integratsiyalar", "Telegram bot, SMS provayder, webhook va API kalitlar", "cards"],
  accounting: ["Hisob-kitoblar", "Tarif, billing va hisob-kitob sozlamalari", "cards"],
  "finance-cash": ["Kassa", "Naqd, karta, bank hisoblari va transferlar", "market"],
  "finance-overview": ["Moliya", "To'lovlar, kassa, daromad, xarajat va qarzdorlik", "report"],
  "course-report": ["Kurs hisoboti", "Kurslar bo'yicha o'sish va rentabellik", "report"],
  "teacher-efficiency": ["O'qituvchi samaradorligi", "Davomat, to'lov va guruh natijalari", "report"],
  "cashflow-report": ["Pul oqimi", "Daromad, chiqim, maosh va sof foyda", "report"],
  "salary-report": ["Ish haqi hisoboti", "O'qituvchi va xodimlar ish haqi", "report"],
  "lead-report": ["Lid hisobotlari", "Manba, menejer va konversiya bo'yicha", "report"],
  "removed-students-report": ["Guruhdan o'chirilganlar hisoboti", "Ketgan talabalar va sabablar", "report"],
  "points-report": ["Ballar hisoboti", "Gamification va reyting ballari", "report"],
  "exam-report": ["Imtihon hisoboti", "Imtihon natijalari va sertifikatlar", "report"],
  "discount-report": ["Chegirma hisoboti", "Chegirmalar, qaytarimlar va ta'siri", "report"],
  "sent-sms-report": ["Yuborilgan SMSlar", "SMS loglari va yetkazilish holati", "report"],
  "worktime-report": ["Ish vaqti hisoboti", "Xodimlar ish vaqti va davomati", "report"],
  journals: ["Jurnallar", "Audit, tizim loglari va harakatlar tarixi", "report"],
  "coin-report": ["Tanga/Kristal hisoboti", "Gamification mukofotlari", "report"],
  "archive-leads": ["Arxiv: Lidlar", "Arxivlangan lidlar", "archive"],
  "archive-students": ["Arxiv: Talabalar", "Arxivlangan talabalar", "archive"],
  "archive-teachers": ["Arxiv: O'qituvchilar", "Arxivlangan o'qituvchilar", "archive"],
  "archive-employees": ["Arxiv: Xodimlar", "Arxivlangan xodimlar", "archive"],
  "archive-groups": ["Arxiv: Guruhlar", "Arxivlangan guruhlar", "archive"],
  "archive-finance": ["Arxiv: Moliya", "Arxivlangan moliya yozuvlari", "archive"],
  "archive-finance-payments": ["Arxiv: To'lovlar", "Arxivlangan to'lovlar", "archive"],
  "archive-finance-salary": ["Arxiv: Ish haqi", "Arxivlangan ish haqi yozuvlari", "archive"],
  "archive-finance-expenses": ["Arxiv: Xarajatlar", "Arxivlangan xarajatlar", "archive"],
  "archive-finance-extra-income": ["Arxiv: Qo'shimcha daromadlar", "Arxivlangan qo'shimcha daromadlar", "archive"],
  "archive-finance-bonuses": ["Arxiv: Bonuslar", "Arxivlangan bonuslar", "archive"],
  archive: ["Arxiv", "Arxivlangan barcha yozuvlar va tiklash oqimi", "archive"],
  market: ["Market", "Qo'shimcha modullar va integratsiyalar", "market"]
};

const studentAppAdminViews = [
  "student-app-dashboard",
  "student-app-access",
  "student-app-modules",
  "student-app-library",
  "student-app-dictionary",
  "student-app-academic-help",
  "student-app-news",
  "student-app-events",
  "student-app-offers",
  "student-app-referrals",
  "student-app-extra-lessons",
  "student-app-exams",
  "student-app-feedback",
  "student-app-settings"
];

const studentAppRouteByView = {
  "student-app-dashboard": "/admin/settings/student-app/dashboard",
  "student-app-access": "/admin/settings/student-app/access",
  "student-app-modules": "/admin/settings/student-app/modules",
  "student-app-library": "/admin/settings/student-app/library",
  "student-app-dictionary": "/admin/settings/student-app/dictionary",
  "student-app-academic-help": "/admin/settings/student-app/academic-help",
  "student-app-news": "/admin/settings/student-app/news",
  "student-app-events": "/admin/settings/student-app/events",
  "student-app-offers": "/admin/settings/student-app/offers",
  "student-app-referrals": "/admin/settings/student-app/referrals",
  "student-app-extra-lessons": "/admin/settings/student-app/extra-lessons",
  "student-app-exams": "/admin/settings/student-app/exams",
  "student-app-feedback": "/admin/settings/student-app/feedback",
  "student-app-settings": "/admin/settings/student-app/settings"
};

const routeByView = {
  dashboard: "/admin/dashboard",
  students: "/admin/students",
  groups: "/admin/groups",
  courses: "/admin/courses",
  teachers: "/admin/teachers",
  schedule: "/admin/schedule",
  attendance: "/admin/attendance",
  finance: "/admin/payments",
  "finance-overview": "/admin/finance",
  "finance-cash": "/admin/finance/cash",
  debtors: "/admin/debts",
  leads: "/admin/leads",
  reports: "/admin/reports",
  branches: "/admin/branches",
  rooms: "/admin/settings/office/rooms",
  telegram: "/admin/telegram",
  "teacher-attendance": "/admin/staff-attendance",
  subscription: "/admin/subscription",
  settings: "/admin/settings",
  "extra-income": "/admin/finance/extra-income",
  expenses: "/admin/finance/expenses",
  salary: "/admin/finance/salary",
  bonuses: "/admin/finance/bonuses",
  "payment-types": "/admin/settings/forms/payment-types",
  "center-info": "/admin/settings/center",
  "general-settings": "/admin/settings/general",
  "office-settings": "/admin/settings/office",
  positions: "/admin/settings/office/positions",
  employees: "/admin/settings/office/employees",
  holidays: "/admin/settings/office/holidays",
  "receipt-settings": "/admin/settings/office/receipt",
  "learning-settings": "/admin/settings/learning",
  reasons: "/admin/settings/learning/reasons",
  "level-test": "/admin/settings/learning/level-test",
  points: "/admin/settings/learning/points",
  "exam-templates": "/admin/settings/learning/exam-templates",
  "sms-settings": "/admin/settings/sms",
  "sms-buy": "/admin/settings/sms/buy",
  "sms-auto": "/admin/settings/sms/auto",
  "sms-templates": "/admin/settings/sms/templates",
  forms: "/admin/settings/forms",
  "lead-forms": "/admin/settings/forms/lead-forms",
  "simple-form": "/admin/settings/forms/simple-form",
  "referral-forms": "/admin/settings/forms/referral-forms",
  tags: "/admin/settings/tags",
  integrations: "/admin/settings/integrations",
  accounting: "/admin/settings/accounting",
  archive: "/admin/archive",
  "archive-finance": "/admin/archive/finance",
  "archive-finance-payments": "/admin/archive/finance/payments",
  "archive-finance-salary": "/admin/archive/finance/salary",
  "archive-finance-expenses": "/admin/archive/finance/expenses",
  "archive-finance-extra-income": "/admin/archive/finance/extra-income",
  "archive-finance-bonuses": "/admin/archive/finance/bonuses",
  "course-report": "/admin/reports/courses",
  "teacher-efficiency": "/admin/reports/teacher-performance",
  "cashflow-report": "/admin/reports/cash-flow",
  "salary-report": "/admin/reports/salary",
  "lead-report": "/admin/reports/leads",
  "removed-students-report": "/admin/reports/group-removed",
  "points-report": "/admin/reports/points",
  "exam-report": "/admin/reports/exams",
  "discount-report": "/admin/reports/discounts",
  "sent-sms-report": "/admin/reports/sent-sms",
  "worktime-report": "/admin/reports/work-time",
  journals: "/admin/reports/journals",
  "coin-report": "/admin/reports/coins-crystals",
  market: "/admin/market",
  "super-dashboard": "/ceo/dashboard",
  "super-centers": "/ceo/centers",
  "super-tariffs": "/ceo/tariffs",
  "super-subscriptions": "/ceo/subscriptions",
  "super-payments": "/ceo/payments",
  "super-support": "/ceo/support",
  "super-domains": "/ceo/domains",
  "super-invoices": "/ceo/invoices",
  "super-settings": "/ceo/settings"
};
Object.assign(routeByView, studentAppRouteByView);
adminRouteKeys.forEach((key) => {
  routeByView[`admin-${key}`] = `/ceo/${key}`;
});
routeByView["admin-login"] = "/ceo/login";
routeByView["admin-dashboard"] = "/ceo/dashboard";
// 21.8.3: /ceo/dashboard must render the real Super Admin dashboard, not CRM dashboard.
routeByView["admin-centers-new"] = "/ceo/centers/new";
routeByView["admin-center-profile"] = "/ceo/centers";
routeByView["super-center-profile"] = "/ceo/centers";
routeByView["admin-demo-requests"] = "/ceo/demo-requests";
routeByView["admin-admin-users"] = "/ceo/admin-users";
routeByView["admin-audit-log"] = "/ceo/audit-log";
routeByView["admin-not-found"] = "/ceo/not-found";

function viewFromPath(pathname = window.location.pathname) {
  const normalized = pathname.replace(/\/$/, "") || "/";

  // 21.4.1 route guard fix:
  // /admin is the education-center CRM. /super is the Eduka platform owner panel.
  // Previously every /admin/* path was captured as an admin(super) route first,
  // so /admin/students became admin-not-found/admin-login and opened the rahbariyat login.
  if (normalized === "/super/login") {
    window.history.replaceState({ viewName: "admin-login" }, "", "/ceo/login");
    return "admin-login";
  }
  if (normalized.startsWith("/super")) {
    window.history.replaceState({}, "", normalized.replace(/^\/super/, "/ceo"));
    return viewFromPath(window.location.pathname);
  }
  if (normalized === "/ceo/login") return "admin-login";
  if (normalized === "/ceo" || normalized === "/ceo/dashboard") return "super-dashboard";
  if (normalized === "/ceo/centers/new") return "admin-centers-new";
  if (/^\/ceo\/centers\/\d+$/.test(normalized)) return "super-center-profile";
  if (normalized.startsWith("/ceo/")) {
    const ceoMap = {
      dashboard: "super-dashboard",
      centers: "super-centers",
      tariffs: "super-tariffs",
      subscriptions: "super-subscriptions",
      payments: "super-payments",
      support: "super-support",
      domains: "super-domains",
      invoices: "super-invoices",
      settings: "super-settings"
    };
    const slug = normalized.replace("/ceo/", "");
    if (ceoMap[slug]) return ceoMap[slug];
    const view = `admin-${slug}`;
    return adminViews.has(view) ? view : "admin-not-found";
  }

  if (normalized === "/admin" || normalized === "/admin/login" || normalized === "/admin/dashboard") return "dashboard";
  if (normalized === "/admin/settings/student-app") return "student-app-dashboard";
  if (normalized.startsWith("/admin/settings/student-app/")) {
    const slug = normalized.replace("/admin/settings/student-app/", "");
    const view = `student-app-${slug}`;
    return studentAppAdminViews.includes(view) ? view : "student-app-dashboard";
  }
  const routeAliases = {
    "/admin/finance": "finance",
    "/admin/finance/income": "extra-income",
    "/admin/finance/cash": "finance-cash",
    "/admin/journal": "attendance",
    "/admin/groups/journal": "attendance",
    "/admin/settings/center": "center-info",
    "/admin/settings/student-app/dashboard": "student-app-dashboard",
    "/admin/settings/student-app/modules": "student-app-modules",
    "/admin/settings/student-app/dictionary": "student-app-dictionary",
    "/admin/settings/student-app/academic-help": "student-app-academic-help",
    "/admin/settings/student-app/news": "student-app-news",
    "/admin/settings/student-app/offers": "student-app-offers",
    "/admin/settings/student-app/events": "student-app-events",
    "/admin/settings/student-app/library": "student-app-library",
    "/admin/settings/student-app/settings": "student-app-settings",
    "/admin/reports/finance": "reports",
    "/admin/reports/attendance": "attendance",
    "/admin/archive": "archive",
    "/admin/archive/leads": "archive-leads",
    "/admin/archive/students": "archive-students",
    "/admin/archive/teachers": "archive-teachers",
    "/admin/archive/employees": "archive-employees",
    "/admin/archive/groups": "archive-groups",
    "/admin/archive/finance": "archive-finance",
    "/admin/archive/finance/payments": "archive-finance-payments",
    "/admin/archive/finance/salary": "archive-finance-salary",
    "/admin/archive/finance/expenses": "archive-finance-expenses",
    "/admin/archive/finance/extra-income": "archive-finance-extra-income",
    "/admin/archive/finance/bonuses": "archive-finance-bonuses"
  };
  if (routeAliases[normalized]) return routeAliases[normalized];
  if (/^\/admin\/groups\/\d+\/journal$/.test(normalized)) return "attendance";
  if (/^\/admin\/students\/\d+$/.test(normalized)) return "student-profile";
  if (/^\/admin\/groups\/\d+$/.test(normalized)) return "group-profile";
  if (/^\/admin\/teachers\/\d+$/.test(normalized)) return "teacher-profile";
  if (normalized === "/admin/rooms" || normalized === "/admin/settings/office/rooms") return "rooms";
  if (normalized === "/admin/settings/learning/courses") return "courses";
  if (normalized === "/admin/settings/forms/payment-types") return "payment-types";
  if (/^\/ceo\/centers\/\d+$/.test(normalized)) return "super-center-profile";
  if (normalized === "/ceo/centers") return "super-centers";
  if (normalized === "/ceo/tariffs") return "super-tariffs";
  if (normalized === "/ceo/subscriptions") return "super-subscriptions";
  if (normalized === "/ceo/payments") return "super-payments";
  if (normalized === "/ceo/support") return "super-support";
  if (normalized === "/ceo/domains") return "super-domains";
  if (normalized === "/ceo/invoices") return "super-invoices";
  if (normalized === "/ceo/settings") return "super-settings";
  if (normalized === "/ceo/dashboard" || normalized === "/super") return "super-dashboard";
  const match = Object.entries(routeByView).find(([, path]) => path === normalized);
  if (match) return match[0];
  if (["/admin", "/crm", "/panel", "/dashboard"].includes(normalized)) return "dashboard";
  return "dashboard";
}

function roleKey(role = currentUser?.role) {
  return String(role || "").toLowerCase();
}

function isSuperRole(role = currentUser?.role) {
  return ["super_admin", "platform_owner", "platform_admin"].includes(roleKey(role));
}

function isPlatformPath(pathname = window.location.pathname) {
  return pathname.startsWith("/ceo") || pathname.startsWith("/super");
}

function isPlatformLoginPath(pathname = window.location.pathname) {
  return pathname === "/ceo/login" || pathname === "/super/login";
}

function normalizePlatformPath() {
  if (isPlatformPath()) {
    window.history.replaceState({}, "", window.location.pathname.replace(/^\/super/, "/ceo") + window.location.search + window.location.hash);
  }
}

function clearTenantUiContext() {
  currentTenant = null;
  window.currentTenant = null;
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("eduka_tenant_session_") || key.startsWith("eduka_center_")) localStorage.removeItem(key);
  });
}

const superViews = new Set([
  "super-dashboard",
  "super-centers",
  "super-center-profile",
  "super-tariffs",
  "super-subscriptions",
  "super-payments",
  "super-support",
  "super-domains",
  "super-invoices",
  "super-settings"
]);

const centerAdminViews = new Set([
  "dashboard",
  "students",
  "student-profile",
  "groups",
  "group-profile",
  "courses",
  "teachers",
  "teacher-profile",
  "schedule",
  "attendance",
  "teacher-attendance",
  "finance",
  "finance-overview",
  "finance-cash",
  "withdrawals",
  "extra-income",
  "expenses",
  "salary",
  "bonuses",
  "debtors",
  "leads",
  "reports",
  "branches",
  "rooms",
  "telegram",
  "settings",
  "subscription",
  "reminders",
  "rating",
  "center-info",
  "general-settings",
  "office-settings",
  "learning-settings",
  "positions",
  "employees",
  "reasons",
  "level-test",
  "points",
  "exam-templates",
  "holidays",
  "receipt-settings",
  "sms-settings",
  "sms-buy",
  "sms-auto",
  "sms-templates",
  "forms",
  "lead-forms",
  "simple-form",
  "referral-forms",
  "tags",
  "integrations",
  "payment-types",
  "accounting",
  ...studentAppAdminViews,
  "course-report",
  "teacher-efficiency",
  "cashflow-report",
  "salary-report",
  "lead-report",
  "removed-students-report",
  "points-report",
  "exam-report",
  "discount-report",
  "sent-sms-report",
  "worktime-report",
  "journals",
  "coin-report",
  "archive-leads",
  "archive",
  "archive-students",
  "archive-teachers",
  "archive-employees",
  "archive-groups",
  "archive-finance",
  "archive-finance-payments",
  "archive-finance-salary",
  "archive-finance-expenses",
  "archive-finance-extra-income",
  "archive-finance-bonuses",
  "market"
]);

function allowedViewsForRole(role = currentUser?.role) {
  const normalized = roleKey(role);
  if (isSuperRole(normalized)) return superViews;
  if (["manager", "menejer"].includes(normalized)) return new Set(["dashboard", "students", "student-profile", "groups", "group-profile", "finance", "debtors", "attendance", "leads"]);
  if (["teacher", "oqituvchi"].includes(normalized)) return new Set(["dashboard", "groups", "group-profile", "attendance", "schedule"]);
  if (["student", "parent"].includes(normalized)) return new Set(["dashboard"]);
  if (["accountant", "buxgalter"].includes(normalized)) return new Set(["dashboard", "students", "student-profile", "finance", "withdrawals", "expenses", "salary", "debtors", "reports"]);
  return centerAdminViews;
}

function isViewAllowed(viewName) {
  if (viewName === "access-denied") return true;
  if (viewName === "admin-login") return true;
  if (adminViews.has(viewName)) return isSuperRole();
  return allowedViewsForRole().has(viewName);
}

function defaultViewForRole(role = currentUser?.role) {
  if (isPlatformPath()) return isAdminAuthenticated() ? "admin-dashboard" : "admin-login";
  if (window.location.pathname.startsWith("/admin")) return "dashboard";
  return isSuperRole(role) ? "admin-dashboard" : "dashboard";
}

function navViewFor(viewName) {
  if (viewName === "admin-center-profile") return "admin-centers";
  if (viewName === "super-center-profile") return "super-centers";
  if (viewName === "student-profile") return "students";
  if (viewName === "group-profile") return "groups";
  if (viewName === "teacher-profile") return "teachers";
  if (viewName === "super-center-profile") return "super-centers";
  return viewName;
}

function routeForView(viewName, options = {}) {
  if (options.route) return options.route;
  if (viewName === "admin-center-profile") return `/ceo/centers/${adminProfileIdFromPath() || adminState.centers[0]?.id || ""}`;
  if (viewName === "student-profile") return `/admin/students/${profileIdFromPath("students") || state.students[0]?.id || ""}`;
  if (viewName === "group-profile") return `/admin/groups/${profileIdFromPath("groups") || state.groups[0]?.id || ""}`;
  if (viewName === "teacher-profile") return `/admin/teachers/${profileIdFromPath("teachers") || state.teachers[0]?.id || ""}`;
  if (viewName === "super-center-profile") return `/ceo/centers/${profileIdFromPath("centers") || state.superCenters[0]?.id || ""}`;
  return routeByView[viewName];
}

function svgIcon(name) {
  const icon = document.createElement("i");
  icon.setAttribute("data-lucide", uiIcons[name] || name || "circle");
  icon.setAttribute("aria-hidden", "true");
  return icon;
}

function refreshIcons() {
  window.lucide?.createIcons({ attrs: { "stroke-width": 1.8 } });
}

document.querySelectorAll(".side-nav button[data-lucide-icon]").forEach((button) => {
  button.prepend(svgIcon(button.dataset.lucideIcon));
});

document.querySelectorAll("[data-ui-icon]").forEach((button) => {
  button.prepend(svgIcon(button.dataset.uiIcon));
});

refreshIcons();

function createGeneratedViews() {
  const content = document.querySelector(".content");
  Object.entries(generatedViews).forEach(([id, [title, description, type]]) => {
    if (document.getElementById(id)) return;
    const section = document.createElement("section");
    section.className = "view generated-view";
    section.id = id;
    section.innerHTML = generatedViewHtml(id, title, description, type);
    content.append(section);
  });
  refreshIcons();
}

function ensureStudentAppNavigation() {
  if (!settingsSubnav || settingsSubnav.querySelector("[data-student-app-nav]")) return;
  settingsSubnav.insertAdjacentHTML("beforeend", `
    <div class="subnav-group student-app-nav" data-student-app-nav>
      <button type="button" data-view="student-app-dashboard">Student App</button>
      <div class="nested">
        <button type="button" data-view="student-app-dashboard">Dashboard</button>
        <button type="button" data-view="student-app-access">O'quvchilar kirishi</button>
        <button type="button" data-view="student-app-modules">Modullar</button>
        <button type="button" data-view="student-app-library">Kutubxona</button>
        <button type="button" data-view="student-app-dictionary">Lug'atlar</button>
        <button type="button" data-view="student-app-academic-help">Akademik yordam</button>
        <button type="button" data-view="student-app-news">Yangiliklar</button>
        <button type="button" data-view="student-app-offers">Takliflar</button>
        <button type="button" data-view="student-app-events">Tadbirlar</button>
        <button type="button" data-view="student-app-referrals">Referral</button>
        <button type="button" data-view="student-app-extra-lessons">Qo'shimcha dars</button>
        <button type="button" data-view="student-app-exams">Imtihonlar</button>
        <button type="button" data-view="student-app-feedback">Taklif va shikoyatlar</button>
        <button type="button" data-view="student-app-settings">Sozlamalar</button>
      </div>
    </div>`);
}

function ensureStudentAppViews() {
  const content = document.querySelector(".content");
  if (!content) return;
  studentAppAdminViews.forEach((view) => {
    if (document.getElementById(view)) return;
    const section = document.createElement("section");
    section.className = "view student-app-admin-view";
    section.id = view;
    section.innerHTML = `<div class="student-app-admin-page" data-student-app-page="${view}"></div>`;
    content.append(section);
  });
}

function generatedViewHtml(viewId, title, description, type) {
  if (type === "form") {
    return `<section class="settings-panel" data-generated-settings="${viewId}"><h1>${title}</h1><p>${description}</p><div class="settings-form"><label>Administrator telegram username<input name="telegram_admin" placeholder="https://t.me/" /></label><label>Telegram kanal<input name="telegram_channel" placeholder="https://t.me/" /></label><label>YouTube<input name="youtube" placeholder="https://www.youtube.com/" /></label><label>Instagram<input name="instagram" placeholder="https://www.instagram.com/" /></label><label>Operator raqami<input name="operator_phone" placeholder="+998 __ ___ __ __" /></label><label>Viloyat<select name="region"><option>Farg\'ona viloyati</option><option>Toshkent shahri</option></select></label></div><div class="modal-actions"><button type="button" data-crm-action="save-generated-settings" data-generated-resource="${viewId}">Saqlash</button></div></section>`;
  }
  if (type === "toggles") {
    const rows = ["Chegirma o'qituvchilarga ta'sir qilsin", "To'lov qilingandan so'ng chek chiqarish", "To'lov yaratishda sana tanlansin", "Qarzdor talabani bloklash", "Yangi lid nomerini SMS orqali tasdiqlash", "Davomatdan keyin ota-onaga xabar yuborish"];
    return `<section class="settings-panel" data-generated-settings="${viewId}"><h1>${title}</h1><p>${description}</p><div class="toggle-list">${rows.map((row, index) => `<label><input name="toggle_${index}" type="checkbox" ${index === 1 ? "checked" : ""}/><span>${row}</span></label>`).join("")}</div><div class="modal-actions"><button type="button" data-crm-action="save-generated-settings" data-generated-resource="${viewId}">Saqlash</button></div></section>`;
  }
  if (type === "roles") {
    return `<section class="settings-panel generated-entity-page" data-generated-resource="${viewId}"><div class="page-head"><h1>${title}</h1><button class="section-action" type="button" data-crm-action="generated-add" data-generated-resource="${viewId}">Lavozim qo\'shish</button></div><p>${description}</p><div class="role-list" data-generated-list="${viewId}">${["Exerciser", "Developer", "Kassir", "Chop etuvchi", "Marketolog", "Adminstrator", "Buxgalter", "Teacher"].map((role) => `<article><b>${role[0]}</b><span>${role}</span><small>global</small></article>`).join("")}</div></section>`;
  }
  if (type === "receipt") {
    return `<section class="split-panels receipt-settings-page"><article><div class="page-head"><h1>${title}</h1><button class="section-action" type="submit" form="receipt-settings-form">Saqlash</button></div><p>${description}</p><form id="receipt-settings-form" data-receipt-settings-form class="settings-form receipt-settings-form"><label>Chek prefiksi<input name="prefix" value="CHK" /></label><label>Markaz nomi<input name="center_name" value="EDUKA" /></label><label>Telegram bot username<input name="bot_username" value="edukauz_bot" placeholder="edukauz_bot" /></label><label>Telefon<input name="phone" placeholder="+998" /></label><label>Manzil<input name="address" placeholder="Markaz manzili" /></label><label>Pastki matn<input name="footer" value="TO'LOVINGIZ UCHUN RAHMAT" /></label><label>Qog'oz<select name="paper"><option value="80mm">80mm</option><option value="58mm">58mm</option><option value="a4">A4</option></select></label><label class="check-field"><input name="enabled" type="checkbox" checked /><span>Chek chiqarish yoqilsin</span></label><label class="check-field"><input name="auto_print" type="checkbox" checked /><span>To'lovdan keyin avtomatik chek chiqarish</span></label></form></article><article><h1>Chek ko'rinishi</h1><div class="receipt-preview receipt-preview-pro"><b>EDUKA</b><span>Thermal printer uchun 80mm chek</span><hr/><p>Chek: CHK-2026-0512-00586</p><p>Talaba: Muhammadali Rashidov</p><p>QR: https://t.me/edukauz_bot?start=receipt_...</p><small>Logo markaz sozlamasidagi Logo URL orqali chiqadi.</small></div></article></section>`;
  }
  if (type === "market") {
    return `<section class="settings-panel" data-generated-settings="${viewId}"><h1>${title}</h1><p>${description}</p><div class="settings-grid"><article><h2>Telegram bot</h2><p>Davomat va qarzdorlik xabarlari.</p><button type="button" data-crm-action="save-generated-settings" data-generated-resource="${viewId}">Ulash</button></article><article><h2>Excel import/export</h2><p>Talabalar va moliya fayllari.</p><button type="button" data-crm-action="export-excel" data-resource="reports">Export</button></article><article><h2>SMS gateway</h2><p>Auto SMS va shablonlar.</p><button type="button" data-crm-action="save-generated-settings" data-generated-resource="${viewId}">Sozlash</button></article></div></section>`;
  }
  return `<section class="settings-panel generated-entity-page" data-generated-resource="${viewId}"><div class="page-head list-head"><h1>${title}</h1><label><span>15</span><input data-generated-limit="${viewId}" value="15" /></label><button class="section-action" type="button" data-crm-action="generated-add" data-generated-resource="${viewId}">Qo\'shish</button></div><p>${description}</p><div class="filters"><input placeholder="Qidirish" data-generated-search="${viewId}" /><button type="button" data-crm-action="generated-clear" data-generated-resource="${viewId}">Tozalash</button><button type="button" data-crm-action="generated-export" data-generated-resource="${viewId}">Excelga eksport qilish</button></div><div class="table simple-table" data-generated-table="${viewId}"><div><b>T/R</b><b>Nomi</b><b>Holat</b><b>Yaratilgan vaqt</b><b>Amallar</b></div><div class="table-empty">Ma\'lumot topilmadi</div></div></section>`;
}

ensureStudentAppNavigation();
createGeneratedViews();
ensureStudentAppViews();

const statusLabels = {
  NEW: "Yangi",
  CONTACTED: "Aloqa qilindi",
  TRIAL_LESSON: "Sinov darsi",
  BECAME_STUDENT: "O'quvchiga aylandi",
  REJECTED: "Rad etdi",
  LATER: "Keyinroq",
  PAID: "To'langan",
  PARTIAL: "Qisman to'langan",
  DEBT: "Qarzdor",
  OVERDUE: "Muddati o'tgan",
  CANCELLED: "Bekor qilingan",
  PRESENT: "Keldi",
  ABSENT: "Kelmadi",
  LATE: "Kechikdi",
  EXCUSED: "Sababli",
  ONLINE: "Online qatnashdi",
  new: "Yangi",
  contacted: "Aloqa qilindi",
  trial: "Sinov darsi",
  paid: "To'lov qildi",
  lost: "Yo'qotildi",
  partial: "Qisman to'langan",
  debt: "Qarzdor",
  overdue: "Muddati o'tgan",
  cancelled: "Bekor qilingan",
  active: "Faol",
  frozen: "Muzlatilgan",
  left: "Ketgan",
  debtor: "Qarzdor",
  present: "Keldi",
  absent: "Kelmadi",
  late: "Kechikdi",
  excused: "Sababli",
  online: "Online qatnashdi",
  trialing: "Trial",
  trial: "Sinov darsi",
  blocked: "Bloklangan",
  archived: "Arxiv",
  planned: "Rejalashtirilgan",
  completed: "O'tilgan",
  cancelled: "Bekor qilingan",
  fixed: "Fixed",
  per_lesson: "Darsbay",
  percentage: "Foiz"
};

const modalFields = {
  students: {
    title: "Talaba yaratish",
    endpoint: "/api/students",
    fields: [
      ["full_name", "Ism", "text", true],
      ["phone", "Telefon", "tel"],
      ["parent_phone", "Ota-ona telefoni", "tel"],
      ["birth_date", "Tug'ilgan sana", "date"],
      ["address", "Manzil", "text"],
      ["course_name", "Kurs", "select:courses"],
      ["group_id", "Guruh", "select:groups"],
      ["payment_type", "To'lov turi", "select:paymentType"],
      ["discount", "Chegirma", "number"],
      ["status", "Status", "select:studentStatus"],
      ["balance", "Balans", "number"],
      ["note", "Izoh", "textarea"]
    ]
  },
  leads: {
    title: "Lid yaratish",
    endpoint: "/api/leads",
    fields: [
      ["full_name", "Ism", "text", true],
      ["phone", "Telefon", "tel"],
      ["course_name", "Qiziqqan kurs", "select:courses"],
      ["source", "Manba", "text"],
      ["status", "Pipeline holati", "select:leadStatus"],
      ["manager_name", "Menejer", "text"],
      ["next_contact_at", "Qayta aloqa sanasi", "datetime-local"],
      ["note", "Izoh", "textarea"]
    ]
  },
  groups: {
    title: "Guruh yaratish",
    endpoint: "/api/groups",
    fields: [
      ["name", "Guruh nomi", "text", true],
      ["course_name", "Kurs nomi", "select:courses"],
      ["teacher_id", "O'qituvchi", "select:teachers"],
      ["teacher_name", "O'qituvchi ismi", "text"],
      ["days", "Kunlar", "text"],
      ["start_time", "Boshlanish vaqti", "time"],
      ["end_time", "Tugash vaqti", "time"],
      ["monthly_price", "Oylik narx", "number"],
      ["starts_at", "Boshlanish sanasi", "date"],
      ["ends_at", "Tugash sanasi", "date"],
      ["room", "Xona", "text"],
      ["status", "Status", "select:activeStatus"]
    ]
  },
  teachers: {
    title: "O'qituvchi yaratish",
    endpoint: "/api/teachers",
    fields: [
      ["full_name", "Ism", "text", true],
      ["phone", "Telefon", "tel"],
      ["email", "Email", "email"],
      ["course_name", "Fan/kurs", "select:courses"],
      ["subjects", "Fanlar", "text"],
      ["groups", "Guruhlar", "text"],
      ["login_enabled", "Login berilsinmi?", "checkbox"],
      ["salary_type", "Ish haqi turi", "select:salaryType"],
      ["salary_rate", "Oylik stavka", "number"],
      ["status", "Status", "select:activeStatus"]
    ]
  },
  courses: {
    title: "Kurs yaratish",
    endpoint: "/api/courses",
    fields: [
      ["name", "Kurs nomi", "text", true],
      ["description", "Tavsif", "textarea"],
      ["price", "Narxi", "number", true],
      ["duration", "Davomiyligi", "text"],
      ["level", "Daraja", "text"],
      ["lesson_type", "Dars turi", "select:lessonType"],
      ["status", "Status", "select:activeStatus"]
    ]
  },
  payments: {
    title: "To'lov qo'shish",
    endpoint: "/api/payments",
    fields: [
      ["student_id", "Talaba", "select:students", true],
      ["group_id", "Guruh", "select:groups"],
      ["payment_month", "Oy", "month"],
      ["due_amount", "To'lanishi kerak", "number"],
      ["amount", "Summa", "number", true],
      ["discount", "Chegirma", "number"],
      ["status", "Status", "select:paymentStatus"],
      ["payment_type", "To'lov usuli", "select:paymentType"],
      ["paid_at", "To'lov sanasi", "datetime-local"],
      ["note", "Izoh", "textarea"]
    ]
  },
  attendance: {
    title: "Davomat belgilash",
    endpoint: "/api/attendance",
    fields: [
      ["group_id", "Guruh", "select:groups", true],
      ["student_id", "Talaba", "select:students", true],
      ["lesson_date", "Dars sanasi", "date", true],
      ["status", "Holat", "select:attendanceStatus"],
      ["note", "Izoh", "textarea"]
    ]
  },
  expenses: {
    title: "Xarajat qo'shish",
    endpoint: "/api/expenses",
    fields: [["title", "Nomi", "text", true], ["amount", "Summa", "number", true], ["spent_at", "Sana", "date"], ["note", "Izoh", "textarea"]]
  },
  withdrawals: {
    title: "Yechib olish",
    endpoint: "/api/withdrawals",
    fields: [["title", "Nomi", "text", true], ["amount", "Summa", "number", true], ["withdrawn_at", "Sana", "date"], ["note", "Izoh", "textarea"]]
  },
  schedule: {
    title: "Dars qo'shish",
    endpoint: "/api/schedule",
    fields: [["group_id", "Guruh", "select:groups", true], ["lesson_at", "Dars vaqti", "datetime-local", true], ["status", "Status", "select:lessonStatus"]]
  }
};

function toastTypeFromMessage(message, fallback = "success") {
  const text = String(message || "").toLowerCase();
  if (text.includes("xato") || text.includes("noto'g'ri") || text.includes("error") || text.includes("yopiq")) return "error";
  if (text.includes("ogohlantirish") || text.includes("tekshiring") || text.includes("tanlang")) return "warning";
  if (text.includes("ochildi") || text.includes("tayyor") || text.includes("qabul qilindi")) return "info";
  return fallback;
}

function showToast(message, type = "") {
  const kind = type || toastTypeFromMessage(message);
  let stack = document.querySelector("[data-toast-stack]");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "toast-stack";
    stack.dataset.toastStack = "";
    document.body.append(stack);
  }
  const icons = { success: "check-circle-2", error: "x-circle", warning: "triangle-alert", info: "info" };
  const item = document.createElement("div");
  item.className = `toast toast-${kind} show`;
  item.setAttribute("role", "alert");
  item.innerHTML = `<i data-lucide="${icons[kind] || icons.info}"></i><span>${escapeHtml(message)}</span><button type="button" aria-label="Yopish">×</button>`;
  item.querySelector("button")?.addEventListener("click", () => item.remove());
  stack.append(item);
  refreshIcons();
  window.setTimeout(() => {
    item.classList.remove("show");
    window.setTimeout(() => item.remove(), 220);
  }, 4200);
  if (toast) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show", `toast-${kind}`);
    toastTimer = window.setTimeout(() => {
      toast.className = "toast";
    }, 2400);
  }
}

async function readJson(response) {
  return response.json().catch(() => ({}));
}

function adminApiHeaders() {
  const session = typeof adminSession === "function" ? adminSession() : null;
  return session?.email ? { "X-Platform-Admin-Email": session.email } : {};
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...tenantApiHeaders(), ...adminApiHeaders(), ...(options.headers || {}) },
    ...options
  });
  const payload = await readJson(response);
  if (!response.ok) throw new Error(payload.message || "So'rov bajarilmadi");
  return payload;
}

function serviceFor(resource) {
  const services = window.crmServices || {};
  return {
    students: services.studentService,
    leads: services.leadService,
    groups: services.groupService,
    courses: services.courseService,
    teachers: services.teacherService,
    payments: services.paymentService,
    attendance: services.attendanceService,
    debts: services.debtService,
    schedule: services.scheduleService,
    rooms: services.roomService,
    paymentTypes: services.paymentTypeService,
    staffAttendance: services.staffAttendanceService,
    financeTransactions: services.financeTransactionService,
    extraIncomes: services.financeTransactionService,
    salaryPayments: services.financeTransactionService,
    bonuses: services.financeTransactionService,
    expenses: services.financeTransactionService
  }[resource];
}

async function safeApi(path, options, fallback) {
  try {
    return await api(path, options);
  } catch (error) {
    if (allowDevelopmentFallback() && typeof fallback === "function") return fallback(error);
    throw error;
  }
}

function profileIdFromPath(segment) {
  const match = window.location.pathname.match(new RegExp(`/${segment}/(\\d+)`));
  return match ? Number(match[1]) : null;
}

function mockSummary() {
  const mock = window.crmMock || {};
  const students = mock.students || [];
  const groups = mock.groups || [];
  const teachers = mock.teachers || [];
  const leads = mock.leads || [];
  const payments = mock.payments || [];
  return {
    active_leads: leads.filter((lead) => ["new", "contacted", "trial"].includes(lead.status)).length,
    trial_students: leads.filter((lead) => lead.status === "trial").length,
    active_students: students.filter((student) => student.status === "active").length,
    paid_this_month: payments.filter((payment) => Number(payment.amount || 0) > 0).length,
    debtors: students.filter((student) => Number(student.balance || 0) > 0).length,
    groups: groups.length,
    teachers: teachers.length,
    today_lessons: (mock.schedule || []).length
  };
}

function mockAnalytics() {
  const mock = window.crmMock || {};
  const payments = mock.payments || [];
  const students = mock.students || [];
  const leads = mock.leads || [];
  const debtTotal = students.reduce((sum, student) => sum + Number(student.balance || 0), 0);
  const revenue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return {
    smart: {
      today_revenue: payments[0]?.amount || 0,
      revenue_growth: 12.4,
      today_leads: leads.filter((lead) => formatDate(lead.created_at) === "2026-05-06").length,
      conversion_rate: leads.length ? (leads.filter((lead) => lead.status === "paid").length / leads.length) * 100 : 0,
      debt_total: debtTotal,
      debtors: students.filter((student) => Number(student.balance || 0) > 0).length,
      alerts: [
        `${formatMoney(debtTotal)} qarzdorlik nazoratda`,
        `${leads.length} ta lid pipeline'da turibdi`,
        `${(mock.schedule || []).length} ta bugungi dars bor`
      ]
    },
    monthly_payments: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => ({ month, amount: Math.round((revenue / 6) * (0.65 + index * 0.1)) })),
    student_growth: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month, index) => ({ month, count: 80 + index * 18 })),
    lead_funnel: ["new", "contacted", "trial", "paid", "lost"].map((status) => ({ status, count: leads.filter((lead) => lead.status === status).length })),
    top_groups: (mock.groups || []).map((group) => ({ name: group.name, students: group.student_count || 0 }))
  };
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("uz-UZ")} UZS`;
}

function formatDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function includesText(value, query) {
  if (!query) return true;
  return String(value || "").toLowerCase().includes(query.toLowerCase());
}

function itemSearchText(item) {
  return Object.values(item || {}).join(" ");
}

function dateInRange(value, from, to) {
  const date = formatDate(value);
  if (!date) return true;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function filteredItems(resource) {
  const filters = uiState.filters[resource] || {};
  const globalQuery = uiState.globalSearch.trim();
  return (state[resource] || []).filter((item) => {
    if (globalQuery && !includesText(itemSearchText(item), globalQuery)) return false;
    if (filters.search && !includesText(itemSearchText(item), filters.search)) return false;
    if (filters.status && String(item.status || "").toLowerCase() !== String(filters.status).toLowerCase()) return false;
    if (filters.group_id && String(item.group_id || "") !== String(filters.group_id)) return false;
    if (filters.finance === "debt" && Number(item.balance || 0) <= 0) return false;
    if (filters.finance === "clear" && Number(item.balance || 0) > 0) return false;
    if (filters.course_name && !includesText(item.course_name, filters.course_name)) return false;
    if (filters.manager_name && !includesText(item.manager_name, filters.manager_name)) return false;
    if (filters.teacher && !includesText(`${item.teacher_full_name || ""} ${item.teacher_name || ""}`, filters.teacher)) return false;
    if (filters.days && !includesText(item.days, filters.days)) return false;
    if (filters.group_name && !includesText(item.group_name, filters.group_name)) return false;
    if (filters.payment_type && item.payment_type !== filters.payment_type) return false;
    if (filters.lesson_date && formatDate(item.lesson_date) !== filters.lesson_date) return false;
    if (!dateInRange(item.created_at || item.paid_at || item.next_contact_at, filters.date_from, filters.date_to)) return false;
    if (filters.starts_at && formatDate(item.starts_at) < filters.starts_at) return false;
    if (filters.ends_at && formatDate(item.ends_at) > filters.ends_at) return false;
    return true;
  });
}

function pagedItems(resource) {
  if (stateMeta[resource]) {
    const total = Number(stateMeta[resource].total || state[resource]?.length || 0);
    const perPage = Number(uiState.perPage[resource] || stateMeta[resource].limit || 10);
    return {
      items: state[resource] || [],
      total,
      maxPage: Math.max(1, Math.ceil(total / perPage))
    };
  }
  const items = filteredItems(resource);
  const perPage = Number(uiState.perPage[resource] || 10);
  const maxPage = Math.max(1, Math.ceil(items.length / perPage));
  uiState.page[resource] = Math.min(uiState.page[resource] || 1, maxPage);
  const start = (uiState.page[resource] - 1) * perPage;
  return { items: items.slice(start, start + perPage), total: items.length, maxPage };
}

function showApp(user) {
  currentUser = user;
  hideAdminLogin();
  authScreen.hidden = true;
  appShell.hidden = false;
  centerName.textContent = currentTenant?.centerName || user?.organization?.name || "Eduka CRM";
  applyRoleUi(user?.role);
  const role = String(user?.role || "").toLowerCase();
  if (user?.organization?.needsOnboarding && !["super_admin", "owner"].includes(role)) {
    openOnboarding();
  }
  const pathView = viewFromPath();
  const initialView = isPlatformPath()
    ? (isSuperRole(role) ? pathView : "admin-login")
    : (isSuperRole(role) && !window.location.pathname.startsWith("/admin") ? "admin-dashboard" : pathView);
  setView(initialView, { replace: true });
  if (isPlatformPath()) return;
  refreshAll();
}

function showAuth() {
  authScreen.hidden = false;
  appShell.hidden = true;
  closeOnboarding();
}

const onboardingData = {
  center: {},
  courses: [{ name: "IELTS", price: 700000, duration: "6 oy", lesson_type: "group" }],
  teachers: [{}],
  groups: [{}],
  students: [{}]
};
let onboardingStep = 0;
const onboardingTitles = [
  ["Markaz ma'lumotlari", "Nomi, telefon, manzil va filial holatini kiriting."],
  ["Kurslar qo'shish", "Eng asosiy kursni kiriting, keyin Kurslar sahifasida ko'paytirasiz."],
  ["O'qituvchi qo'shish", "Birinchi o'qituvchini kursga bog'lang."],
  ["Birinchi guruh", "Dars kunlari, vaqti, xona va narxni belgilang."],
  ["Birinchi o'quvchi", "Guruhga birinchi o'quvchini biriktirib dashboardni ishga tushiring."]
];

function openOnboarding() {
  if (!onboarding) return;
  onboarding.hidden = false;
  renderOnboarding();
}

function closeOnboarding() {
  if (onboarding) onboarding.hidden = true;
}

function renderOnboarding() {
  if (!onboardingSteps || !onboardingForm) return;
  onboardingSteps.innerHTML = onboardingTitles.map(([title], index) => `<span class="${index === onboardingStep ? "active" : ""}">${index + 1}. ${title}</span>`).join("");
  const [title, description] = onboardingTitles[onboardingStep];
  const isLastStep = onboardingStep === onboardingTitles.length - 1;
  onboardingForm.innerHTML = `<h3>${title}</h3><p>${description}</p>${onboardingFields(onboardingStep)}<div class="modal-actions">${onboardingStep ? '<button type="button" data-onboarding-back>Ortga</button>' : ""}${isLastStep ? '<button type="button" class="ghost" data-onboarding-skip>Keyinroq to\'ldiraman</button>' : ""}<button type="submit" data-onboarding-submit>${isLastStep ? "Dashboardga o\'tish" : "Davom etish"}</button></div>`;
}

function onboardingFields(step) {
  if (step === 0) {
    return `<label><span>O'quv markaz nomi</span><input name="name" required value="${currentUser?.organization?.name || ""}" /></label><label><span>Telefon raqam</span><input name="phone" value="${currentUser?.organization?.phone || ""}" /></label><label><span>Manzil</span><input name="address" /></label><label><span>Logo URL</span><input name="logo_url" placeholder="https://..." /></label><label class="check-field"><input name="has_branches" type="checkbox" value="1" /><span>Filial bor</span></label>`;
  }
  if (step === 1) {
    return `<label><span>Kurs nomi</span><input name="name" required value="IELTS" /></label><label><span>Narxi</span><input name="price" type="number" value="700000" /></label><label><span>Davomiyligi</span><input name="duration" value="6 oy" /></label><label><span>Dars turi</span><select name="lesson_type"><option value="group">Guruh</option><option value="individual">Individual</option></select></label>`;
  }
  if (step === 2) {
    return `<label><span>Ism familiya</span><input name="full_name" required /></label><label><span>Telefon</span><input name="phone" /></label><label><span>Fan/kurs</span><input name="course_name" value="${onboardingData.courses[0]?.name || ""}" /></label><label class="check-field"><input name="login_enabled" type="checkbox" value="1" /><span>Login berilsin</span></label>`;
  }
  if (step === 3) {
    return `<label><span>Guruh nomi</span><input name="name" required placeholder="IELTS Morning A" /></label><label><span>Kurs</span><input name="course_name" value="${onboardingData.courses[0]?.name || ""}" /></label><label><span>O'qituvchi</span><input name="teacher_name" value="${onboardingData.teachers[0]?.full_name || ""}" /></label><label><span>Dars kunlari</span><input name="days" placeholder="Dushanba, Chorshanba, Juma" /></label><label><span>Boshlanish</span><input name="start_time" type="time" value="09:00" /></label><label><span>Tugash</span><input name="end_time" type="time" value="10:30" /></label><label><span>Oylik narx</span><input name="monthly_price" type="number" value="${onboardingData.courses[0]?.price || 0}" /></label><label><span>Xona</span><input name="room" /></label>`;
  }
  return `<label><span>Ism familiya</span><input name="full_name" required /></label><label><span>Telefon</span><input name="phone" /></label><label><span>Ota-ona telefoni</span><input name="parent_phone" /></label><label><span>Kurs</span><input name="course_name" value="${onboardingData.courses[0]?.name || ""}" /></label><label><span>To'lov holati</span><select name="status"><option value="active">Faol</option><option value="debtor">Qarzdor</option></select></label><label><span>Balans</span><input name="balance" type="number" value="0" /></label>`;
}

function saveOnboardingStep() {
  const data = Object.fromEntries(new FormData(onboardingForm).entries());
  if (onboardingStep === 0) onboardingData.center = { ...data, has_branches: data.has_branches === "1" };
  if (onboardingStep === 1) onboardingData.courses = [data];
  if (onboardingStep === 2) onboardingData.teachers = [{ ...data, login_enabled: data.login_enabled === "1" }];
  if (onboardingStep === 3) onboardingData.groups = [data];
  if (onboardingStep === 4) onboardingData.students = [data];
}

function setView(viewName, options = {}) {
  ensureAdminShell();
  ensureCrmShell();
  if (isPlatformPath() && !isAdminAuthenticated() && viewName !== "admin-login") return;
  if (!document.getElementById(viewName)) viewName = defaultViewForRole();
  if (!isViewAllowed(viewName)) {
    const fallback = defaultViewForRole();
    showToast("Bu sahifa sizning rolingiz uchun yopiq.");
    viewName = fallback;
    options = { ...options, replace: true };
  }
  pageViews.forEach((view) => view.classList.toggle("active", view.id === viewName));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewName));
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === navViewFor(viewName)));
  const financeViews = ["finance", "finance-overview", "finance-cash", "withdrawals", "extra-income", "expenses", "salary", "bonuses", "debtors"];
  const settingsViews = ["settings", "center-info", "general-settings", "office-settings", "learning-settings", "positions", "employees", "rooms", "holidays", "receipt-settings", "courses", "reasons", "level-test", "points", "exam-templates", "sms-settings", "sms-buy", "sms-auto", "sms-templates", "forms", "lead-forms", "simple-form", "referral-forms", "tags", "payment-types", "integrations", "accounting", ...studentAppAdminViews];
  const reportViews = ["reports", "course-report", "teacher-efficiency", "cashflow-report", "salary-report", "lead-report", "removed-students-report", "points-report", "exam-report", "discount-report", "sent-sms-report", "worktime-report", "journals", "coin-report"];
  const archiveViews = ["archive", "archive-leads", "archive-students", "archive-teachers", "archive-employees", "archive-groups", "archive-finance", "archive-finance-payments", "archive-finance-salary", "archive-finance-expenses", "archive-finance-extra-income", "archive-finance-bonuses"];
  const superSubnav = document.querySelector('[data-subnav="super"]');
  if (financeSubnav) financeSubnav.hidden = !financeViews.includes(viewName);
  if (settingsSubnav) settingsSubnav.hidden = !settingsViews.includes(viewName);
  const reportsSubnav = document.querySelector('[data-subnav="reports"]');
  const archiveSubnav = document.querySelector('[data-subnav="archive"]');
  if (reportsSubnav) reportsSubnav.hidden = !reportViews.includes(viewName);
  if (archiveSubnav) archiveSubnav.hidden = !archiveViews.includes(viewName);
  if (superSubnav) superSubnav.hidden = !superViews.has(viewName);
  document.body.classList.remove("menu-open");
  const route = routeForView(viewName, options);
  if (route && !options.skipRoute && window.location.pathname !== route) {
    if (options.replace) window.history.replaceState({ viewName }, "", route);
    else window.history.pushState({ viewName }, "", route);
  }
  if (adminViews.has(viewName)) renderAdminView(viewName);
  renderCrmTopbar(viewName);
  renderProfiles();
  refreshIcons();
}

async function checkSession() {
  try {
    loadSharedTenantRegistry();
    normalizePlatformPath();

    if (isPlatformPath()) {
      clearTenantUiContext();
      try {
        const payload = await api("/api/auth/me");
        if (!isSuperRole(payload.user?.role)) {
          try { await api("/api/auth/logout", { method: "POST" }); } catch {}
          localStorage.removeItem(adminSessionKey);
          showAdminLogin("Bu sahifa faqat Eduka CEO / Super Admin uchun.");
          return;
        }
        currentUser = payload.user;
        localStorage.setItem(adminSessionKey, JSON.stringify({
          id: payload.user.id,
          fullName: payload.user.fullName || payload.user.full_name || "Yaviz Super Admin",
          email: payload.user.email,
          role: payload.user.role,
          loggedInAt: new Date().toISOString()
        }));
        if (isPlatformLoginPath()) window.history.replaceState({ viewName: "super-dashboard" }, "", "/ceo/dashboard");
        showApp(payload.user);
        return;
      } catch {
        localStorage.removeItem(adminSessionKey);
        showAdminLogin();
        return;
      }
    }

    if (await applyTenantContext()) return;
    if (document.querySelector(".tenant-not-found")) return;
    try {
      const payload = await api("/api/auth/me");
      if (isSuperRole(payload.user?.role)) {
        window.history.replaceState({ viewName: "super-dashboard" }, "", "/ceo/dashboard");
        showApp(payload.user);
        return;
      }
      showApp(payload.user);
    } catch {
      showAuth();
    }
  } finally {
    finishBoot();
  }
}


async function loadSummary() {
  try {
    const payload = await api("/api/app/summary");
    const summary = payload.summary || {};
    document.querySelectorAll("[data-summary]").forEach((node) => {
      node.textContent = Number(summary[node.dataset.summary] || 0).toLocaleString("uz-UZ");
    });
  } catch (error) {
    if (allowDevelopmentFallback()) {
      const summary = mockSummary();
      document.querySelectorAll("[data-summary]").forEach((node) => {
        node.textContent = Number(summary[node.dataset.summary] || 0).toLocaleString("uz-UZ");
      });
      return;
    }
    document.querySelectorAll("[data-summary]").forEach((node) => {
      node.textContent = "0";
    });
    showToast(error.message || "Dashboard statistikasi yuklanmadi");
  }
}

async function loadAnalytics() {
  try {
    const payload = await api("/api/app/analytics");
    state.analytics = payload.analytics || {};
  } catch (error) {
    state.analytics = allowDevelopmentFallback() ? mockAnalytics() : { monthly_payments: [], lead_funnel: [], attendance_trend: [], debt_trend: [], activity: [], top_groups: [] };
    if (!allowDevelopmentFallback()) showToast(error.message || "Analytics ma'lumotlari yuklanmadi");
  }
}

async function loadCollection(name, endpoint) {
  try {
    const payload = await api(withQuery(name, endpoint));
    state[name] = payload.items || [];
    stateMeta[name] = { total: payload.total ?? state[name].length, page: payload.page || uiState.page[name] || 1, limit: payload.limit || uiState.perPage[name] || 10 };
  } catch (error) {
    if (allowDevelopmentFallback() && currentTenant?.subdomain) {
      const saved = loadCrmLocalState();
      state[name] = Array.isArray(saved[name]) ? saved[name] : [];
      delete stateMeta[name];
      return;
    }
    if (allowDevelopmentFallback()) {
      const service = serviceFor(name);
      if (service?.list) {
        state[name] = await service.list();
        delete stateMeta[name];
        return;
      }
    }
    state[name] = [];
    delete stateMeta[name];
    if (!/ruxsat|Unauthorized/i.test(error.message)) showToast(error.message);
  }
}

function syncFinanceBucketsFromTransactions(items = state.financeTransactions || []) {
  const rows = Array.isArray(items) ? items : [];
  const normalize = (item) => ({
    ...item,
    date: item.transaction_date || item.date || item.created_at,
    payment_type: item.payment_type_name || item.payment_type || item.source || "Naqd pul",
    employee_name: item.employee_name || item.staff_name || item.teacher_name || ""
  });
  state.financeTransactions = rows.map(normalize);
  state.extraIncomes = state.financeTransactions.filter((item) => ["income", "extra-income", "extra_income"].includes(String(item.type || "").toLowerCase()) || ["extra-income", "extra_income", "income"].includes(String(item.category || "").toLowerCase()));
  state.expenses = state.financeTransactions.filter((item) => ["expense", "expenses", "xarajat"].includes(String(item.type || "").toLowerCase()) || ["expense", "expenses", "xarajat"].includes(String(item.category || "").toLowerCase()));
  state.salaryPayments = state.financeTransactions.filter((item) => ["salary", "ish-haqi", "ish_haqi"].includes(String(item.type || "").toLowerCase()) || ["salary", "ish-haqi", "ish_haqi"].includes(String(item.category || "").toLowerCase()));
  state.bonuses = state.financeTransactions.filter((item) => ["bonus", "bonuses"].includes(String(item.type || "").toLowerCase()) || ["bonus", "bonuses"].includes(String(item.category || "").toLowerCase()));
}

async function loadFinanceBuckets() {
  try {
    const payload = await api("/api/app/finance/transactions");
    syncFinanceBucketsFromTransactions(payload.items || []);
  } catch (error) {
    state.financeTransactions = [];
    state.extraIncomes = [];
    state.expenses = [];
    state.salaryPayments = [];
    state.bonuses = [];
    if (!/ruxsat|Unauthorized/i.test(error.message)) showToast(error.message || "Moliya yozuvlari yuklanmadi", "warning");
  }
}

async function loadSchedule() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const payload = await api(`/api/schedule?date_from=${today}&date_to=${today}`);
    state.schedule = payload.items || [];
  } catch (error) {
    if (allowDevelopmentFallback()) {
      state.schedule = await (window.crmServices?.scheduleService?.list?.() || Promise.resolve(window.crmMock?.schedule || []));
      return;
    }
    state.schedule = [];
    showToast(error.message || "Dars jadvali yuklanmadi", "warning");
  }
}

async function loadSuperData() {
  const role = String(currentUser?.role || "").toLowerCase();
  if (!["super_admin", "owner"].includes(role)) return;
  try {
    const [dashboard, centers, tariffs, subscriptions, invoices, payments, domains, support, audit] = await Promise.allSettled([
      api("/api/super/dashboard"),
      api("/api/super/centers"),
      api("/api/super/plans"),
      api("/api/super/subscriptions"),
      api("/api/super/invoices"),
      api("/api/super/payments"),
      api("/api/super/domains"),
      api("/api/super/support-tickets"),
      api("/api/super/audit")
    ]);
    const value = (result, fallback = {}) => result.status === "fulfilled" ? result.value : fallback;
    const dashboardPayload = value(dashboard, {});
    state.superDashboard = dashboardPayload;
    state.superSummary = dashboardPayload.summary || {};
    state.superCenters = value(centers, { items: [] }).items || [];
    state.superTariffs = value(tariffs, { items: [] }).items || [];
    state.superSubscriptions = value(subscriptions, { items: [] }).items || [];
    state.superInvoices = value(invoices, { items: [] }).items || [];
    state.superPayments = value(payments, { items: [] }).items || [];
    state.superDomains = value(domains, { items: [] }).items || [];
    state.superSupport = value(support, { items: [] }).items || [];
    state.superAudit = value(audit, { items: [] }).items || [];
  } catch (error) {
    console.error("Super admin API failed", error);
    state.superSummary = {};
    state.superCenters = [];
    state.superTariffs = [];
    state.superSubscriptions = [];
    state.superPayments = [];
    state.superSupport = [];
  }
}

async function loadStudentAppAdminData() {
  if (!currentUser || isSuperRole(currentUser.role)) return;
  const service = window.crmServices?.studentAppAdminService;
  if (!service) return;
  state.studentApp.loading = true;
  state.studentApp.error = "";
  try {
    const [
      dashboard,
      telegramStatus,
      webhookInfo,
      settings,
      modules,
      access,
      library,
      dictionary,
      news,
      events,
      referrals,
      extraLessons,
      exams,
      feedback
    ] = await Promise.allSettled([
      service.dashboard(),
      service.status(),
      service.webhookInfo(),
      service.settings(),
      service.modules(),
      service.access(),
      service.list("library"),
      service.list("dictionary"),
      service.list("news"),
      service.list("events"),
      service.list("referrals"),
      service.list("extra-lessons"),
      service.list("exams"),
      service.list("feedback")
    ]);
    const value = (result, fallback) => result.status === "fulfilled" ? result.value : fallback;
    const dashboardPayload = value(dashboard, {});
    state.studentApp.dashboard = dashboardPayload.summary || {};
    state.studentApp.latestLogins = dashboardPayload.latestLogins || [];
    state.studentApp.latestReferrals = dashboardPayload.latestReferrals || [];
    state.studentApp.latestFeedback = dashboardPayload.latestFeedback || [];
    state.studentApp.telegramStatus = value(telegramStatus, {});
    state.studentApp.webhookInfo = value(webhookInfo, {});
    state.studentApp.settings = value(settings, {}).settings || {};
    state.studentApp.modules = value(modules, []);
    state.studentApp.access = value(access, []);
    state.studentApp.library = value(library, []);
    state.studentApp.dictionary = value(dictionary, []);
    state.studentApp.news = value(news, []);
    state.studentApp.events = value(events, []);
    state.studentApp.referrals = value(referrals, []);
    state.studentApp.extraLessons = value(extraLessons, []);
    state.studentApp.exams = value(exams, []);
    state.studentApp.feedback = value(feedback, []);
  } catch (error) {
    state.studentApp.error = error.message;
  } finally {
    state.studentApp.loading = false;
  }
}

function withQuery(resource, endpoint) {
  const query = new URLSearchParams();
  const filters = uiState.filters[resource] || {};
  const search = filters.search || uiState.globalSearch;
  if (search) query.set("search", search);
  Object.entries(filters).forEach(([key, value]) => {
    if (!value || key === "search") return;
    query.set(key, value);
  });
  query.set("page", uiState.page[resource] || 1);
  query.set("limit", uiState.perPage[resource] || 10);
  return `${endpoint}?${query.toString()}`;
}

async function refreshAll() {
  await Promise.all([
    loadSummary(),
    loadAnalytics(),
    loadCollection("students", endpoints.students),
    loadCollection("leads", endpoints.leads),
    loadCollection("groups", endpoints.groups),
    loadCollection("courses", endpoints.courses),
    loadCollection("teachers", endpoints.teachers),
    loadCollection("payments", endpoints.payments),
    loadCollection("attendance", endpoints.attendance),
    loadCollection("debts", endpoints.debts),
    loadCollection("rooms", endpoints.rooms),
    loadCollection("paymentTypes", endpoints.paymentTypes),
    loadCollection("staffAttendance", endpoints.staffAttendance),
    loadCollection("notifications", endpoints.notifications),
    loadCollection("audit", endpoints.audit)
  ]);
  await Promise.all([loadFinanceBuckets(), loadSchedule(), loadSuperData(), loadStudentAppAdminData()]);
  syncCrmLocalState();
  renderAll();
}

function applyRoleUi(role) {
  const normalized = String(role || "").toLowerCase();
  const allowed = allowedViewsForRole(normalized);

  document.querySelectorAll("[data-view]").forEach((button) => {
    if (button.closest("[data-admin-nav]")) {
      button.hidden = !isSuperRole(normalized);
      return;
    }
    if (button.hasAttribute("data-super-only") && !isSuperRole(normalized)) {
      button.hidden = true;
      return;
    }
    if (isSuperRole(normalized) && !button.hasAttribute("data-super-only")) {
      button.hidden = true;
      return;
    }
    button.hidden = !allowed.has(button.dataset.view);
  });

  document.querySelectorAll("[data-open-modal]").forEach((button) => {
    const resource = button.dataset.openModal;
    button.hidden = !canWrite(resource);
  });
}

function canWrite(resource) {
  const role = String(currentUser?.role || "").toLowerCase();
  if (["super_admin", "owner"].includes(role)) return String(resource || "").startsWith("super");
  if (["admin", "ceo", "rahbar", "center_admin"].includes(role)) return true;
  if (["manager", "menejer"].includes(role)) return ["students", "leads", "payments"].includes(resource);
  if (["teacher", "oqituvchi"].includes(role)) return resource === "attendance";
  if (["accountant", "buxgalter"].includes(role)) return ["payments", "expenses", "withdrawals"].includes(resource);
  return false;
}

function row(table, values) {
  const div = document.createElement("div");
  values.forEach((value) => {
    const span = document.createElement("span");
    if (value instanceof Node) span.append(value);
    else span.textContent = value ?? "";
    div.append(span);
  });
  table.append(div);
}

function emptyRow(table, text) {
  const div = document.createElement("div");
  div.className = "table-empty";
  div.textContent = text;
  table.append(div);
}

function resetTable(name, emptyText) {
  const table = document.querySelector(`[data-table="${name}"]`);
  if (!table) return null;
  table.querySelectorAll("div:not(:first-child)").forEach((node) => node.remove());
  const counter = document.querySelector(`[data-count="${name}"]`);
  return table;
}

function renderPager(resource, total, maxPage) {
  const table = document.querySelector(`[data-table="${resource}"]`);
  if (!table) return;
  let pager = table.nextElementSibling;
  if (!pager || !pager.classList.contains("table-pager")) {
    pager = document.createElement("div");
    pager.className = "table-pager";
    table.after(pager);
  }

  pager.innerHTML = "";
  const info = document.createElement("span");
  info.textContent = `${total} ta yozuv`;
  const select = document.createElement("select");
  [10, 20, 50].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = `${value}/sahifa`;
    option.selected = Number(uiState.perPage[resource]) === value;
    select.append(option);
  });
  select.addEventListener("change", () => {
    uiState.perPage[resource] = Number(select.value);
    uiState.page[resource] = 1;
    refreshAll();
  });
  const prev = document.createElement("button");
  prev.type = "button";
  prev.textContent = "Oldingi";
  prev.disabled = uiState.page[resource] <= 1;
  prev.addEventListener("click", () => {
    uiState.page[resource] -= 1;
    refreshAll();
  });
  const page = document.createElement("strong");
  page.textContent = `${uiState.page[resource]} / ${maxPage}`;
  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "Keyingi";
  next.disabled = uiState.page[resource] >= maxPage;
  next.addEventListener("click", () => {
    uiState.page[resource] += 1;
    refreshAll();
  });
  pager.append(info, select, prev, page, next);
}

function renderResource(resource, emptyText, renderer) {
  const table = resetTable(resource, emptyText);
  if (!table) return;
  const { items, total, maxPage } = pagedItems(resource);
  if (!total) emptyRow(table, emptyText);
  items.forEach((item) => renderer(table, item));
  const counter = document.querySelector(`[data-count="${resource}"]`);
  if (counter) counter.textContent = `Miqdor - ${total}`;
  renderPager(resource, total, maxPage);
}


function receiptStatusUz(status, debt) {
  const raw = String(status || "").toLowerCase();
  if (["cancelled", "canceled", "bekor"].includes(raw)) return "BEKOR QILINGAN";
  if (["debt", "qarzdor"].includes(raw)) return "QARZDOR";
  if (["covered", "closed", "debt_closed"].includes(raw)) return "QARZ QOPLANGAN";
  if (["partial", "partially_paid"].includes(raw) || Number(debt || 0) > 0) return "QISMAN TO'LANGAN";
  return "TO'LANGAN";
}

function receiptDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  return date.toLocaleString("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).replace(/,/g, "");
}

function receiptLogoHtml(data) {
  const logo = data.logoUrl || data.logo_url || data.organization_logo_url || data.branding_logo_url || "";
  if (logo) {
    return `<img class="receipt-logo-img" src="${escapeHtml(logo)}" alt="${escapeHtml(data.centerName || data.center_name || "Logo")}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" /><div class="receipt-logo-fallback" style="display:none">🎓</div>`;
  }
  return `<div class="receipt-logo-fallback">🎓</div>`;
}

function paymentReceiptHtml(receipt) {
  const p = receipt.payment || {};
  const s = receipt.settings || {};
  const total = Number(p.amount || p.paid_amount || 0);
  const due = Number(p.due_amount || p.course_amount || total || 0);
  const discount = Number(p.discount || 0);
  const debt = Math.max(due - total - discount, 0);
  const receiptNumber = p.receipt_no || p.receiptNumber || p.receipt_number || "EDU-000001";
  const centerName = s.center_name || p.organization_name || p.center_name || "EDUKA";
  const branchName = p.branch_name || p.organization_branch_name || p.organization_address || s.address || "Asosiy markaz";
  const courseName = p.course_name || p.payment_month || "-";
  const groupName = p.group_name || "-";
  const paymentType = p.payment_type || p.method || "-";
  const administratorName = p.cashier_name || p.created_by_name || currentUser?.fullName || currentUser?.name || "-";
  const statusText = receiptStatusUz(p.status, debt);
  const botUsername = s.bot_username || p.bot_username || "edukauz_bot";
  const qrValue = p.qr_code_value || p.qrCodeValue || p.telegram_deep_link || `https://t.me/${botUsername}?start=receipt_${encodeURIComponent(receiptNumber)}`;
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=170x170&margin=1&data=${encodeURIComponent(qrValue)}`;
  const dataForLogo = { ...p, ...s, centerName };
  const leader = (label, value, extraClass = "") => `<div class="leader ${extraClass}"><span>${escapeHtml(label)}</span><i></i><b>${escapeHtml(value || "-")}</b></div>`;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Chek ${escapeHtml(receiptNumber)}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #eef3f8; color: #111; font-family: Arial, Helvetica, sans-serif; }
  body { display: flex; justify-content: center; padding: 18px 0 28px; }
  .receipt-shell { width: 80mm; max-width: 80mm; background: #fff; border-radius: 10px; box-shadow: 0 18px 60px rgba(15,23,42,.22); overflow: hidden; }
  .receipt { width: 80mm; min-height: 100mm; padding: 12px 12px 18px; background: #fff; }
  .head { text-align: center; }
  .receipt-logo-img { display: block; max-width: 46px; max-height: 46px; object-fit: contain; margin: 0 auto 6px; filter: grayscale(1) contrast(1.18); }
  .receipt-logo-fallback { width: 48px; height: 48px; line-height: 46px; margin: 0 auto 6px; font-size: 28px; text-align: center; border: 2px solid #111; border-radius: 50%; }
  .brand { font-size: 26px; line-height: 1.05; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .decor { display: flex; align-items: center; justify-content: center; gap: 9px; margin: 12px 0 10px; }
  .decor:before, .decor:after { content:""; width: 54px; border-top: 1px solid #111; }
  .decor span { width: 5px; height: 5px; background: #111; border-radius: 50%; }
  .title { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .dash { border: 0; border-top: 2px dashed #111; margin: 13px 0 13px; }
  .leader { display: flex; align-items: baseline; gap: 8px; padding: 7px 0; font-size: 13.5px; line-height: 1.25; }
  .leader span { white-space: nowrap; color: #222; }
  .leader i { flex: 1; border-bottom: 2px dotted #aaa; transform: translateY(-3px); }
  .leader b { max-width: 48%; text-align: right; font-size: 14px; font-weight: 900; color: #111; overflow-wrap: anywhere; }
  .amount-box { margin: 14px 0 13px; border: 1.5px solid #111; border-radius: 6px; overflow: hidden; }
  .amount-row { display: grid; grid-template-columns: 34px 1fr auto; align-items: center; gap: 9px; padding: 10px; border-bottom: 1px dotted #999; }
  .amount-row:last-child { border-bottom: 0; }
  .amount-icon { width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border: 1.4px solid #111; border-radius: 50%; font-size: 15px; }
  .amount-label { font-size: 14px; font-weight: 800; }
  .amount-value { font-size: 15px; font-weight: 900; white-space: nowrap; }
  .status b { text-transform: uppercase; letter-spacing: .02em; }
  .center-note { text-align: center; font-size: 13px; margin: 11px 0 8px; }
  .thin-line { border: 0; border-top: 1px solid #111; margin: 7px 14px 12px; }
  .qr { text-align: center; }
  .qr img { width: 136px; height: 136px; object-fit: contain; image-rendering: pixelated; }
  .qr p { margin: 5px 0 0; font-size: 12.5px; line-height: 1.34; }
  .thanks { margin: 12px 0 0; text-align: center; font-size: 20px; font-weight: 900; letter-spacing: .03em; text-transform: uppercase; }
  .actions { display: flex; gap: 10px; justify-content: center; padding: 14px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
  .actions button { border: 0; border-radius: 999px; padding: 10px 14px; color: #fff; background: #2563eb; font-weight: 800; cursor: pointer; }
  .actions button:last-child { color: #111827; background: #e5e7eb; }
  @media print {
    html, body { width: 80mm; margin: 0 !important; padding: 0 !important; background: #fff !important; display: block; }
    .receipt-shell { width: 80mm; max-width: 80mm; box-shadow: none; border-radius: 0; }
    .receipt { width: 80mm; padding: 10px 10px 14px; }
    .actions { display: none !important; }
    .leader { page-break-inside: avoid; }
    .amount-box, .qr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <main class="receipt-shell">
    <section class="receipt">
      <header class="head">
        ${receiptLogoHtml(dataForLogo)}
        <div class="brand">${escapeHtml(centerName)}</div>
        <div class="decor"><span></span></div>
        <h1 class="title">TO'LOV CHEKI</h1>
      </header>
      <hr class="dash" />
      ${leader("To'lov chek nomeri", receiptNumber)}
      ${leader("Filial / markaz", branchName)}
      ${leader("Sana va vaqt", receiptDateTime(p.paid_at || p.payment_date || p.created_at))}
      ${leader("O'quvchi ism", p.student_name || "-")}
      ${leader("Kurs nomi", courseName)}
      ${leader("Guruh", groupName)}
      ${leader("To'lov turi", paymentType)}
      ${leader("Kurs / guruh summasi", formatMoney(due))}
      <section class="amount-box">
        <div class="amount-row"><span class="amount-icon">▤</span><span class="amount-label">To'lanishi kerak</span><b class="amount-value">${formatMoney(due)}</b></div>
        <div class="amount-row"><span class="amount-icon">✓</span><span class="amount-label">To'langan summa</span><b class="amount-value">${formatMoney(total)}</b></div>
        <div class="amount-row"><span class="amount-icon">▣</span><span class="amount-label">Hozirgi balans</span><b class="amount-value">${formatMoney(debt)}</b></div>
      </section>
      ${leader("Administrator", administratorName)}
      ${leader("Status / holati", statusText, "status")}
      <hr class="dash" />
      <div class="center-note">To'lov holatini istalgan vaqtda tekshiring</div>
      <hr class="thin-line" />
      <section class="qr">
        <img src="${qrImage}" alt="QR: ${escapeHtml(qrValue)}" />
        <p>To'lovlarni onlayn kuzatib boring<br/>Hoziroq balansni tekshiring</p>
      </section>
      <hr class="dash" />
      <div class="thanks">TO'LOVINGIZ UCHUN RAHMAT</div>
    </section>
    <div class="actions"><button onclick="window.print()">Chekni chop etish</button><button onclick="window.close()">Yopish</button></div>
  </main>
  <script>setTimeout(function(){ window.print(); }, 450);</script>
</body>
</html>`;
}

async function printPaymentReceipt(paymentId) {
  if (!paymentId) return;
  try {
    const result = await api(`/api/payments/${paymentId}/receipt?mark=1`);
    const win = window.open("", "_blank", "width=420,height=700");
    if (!win) {
      showToast("Brauzer popupni blokladi. Popup ruxsatini yoqing.", "warning");
      return;
    }
    win.document.open();
    win.document.write(paymentReceiptHtml(result.receipt || {}));
    win.document.close();
    showToast("Chek chiqarish oynasi ochildi.", "success");
  } catch (error) {
    showToast(error.message || "Chek chiqarilmadi", "error");
  }
}

async function loadReceiptSettings() {
  const form = document.querySelector("[data-receipt-settings-form]");
  if (!form) return;
  try {
    const result = await api("/api/app/receipt-settings");
    const settings = result.settings || {};
    Object.entries(settings).forEach(([key, value]) => {
      const input = form.elements[key];
      if (!input) return;
      if (input.type === "checkbox") input.checked = value !== false;
      else input.value = value ?? "";
    });
  } catch {}
}

function actionButtons(resource, item) {
  const wrap = document.createElement("span");
  wrap.className = "row-actions";
  if (resource === "students") {
    const profile = document.createElement("button");
    profile.type = "button";
    profile.append(svgIcon("user-plus"), document.createTextNode("Profil"));
    profile.addEventListener("click", () => setView("student-profile", { route: `/admin/students/${item.id}` }));
    wrap.append(profile);
  }
  if (resource === "groups") {
    const profile = document.createElement("button");
    profile.type = "button";
    profile.append(svgIcon("layers"), document.createTextNode("Profil"));
    profile.addEventListener("click", () => setView("group-profile", { route: `/admin/groups/${item.id}` }));
    wrap.append(profile);
  }
  if (resource === "payments") {
    const receipt = document.createElement("button");
    receipt.type = "button";
    receipt.append(svgIcon("receipt-text"), document.createTextNode("Chek"));
    receipt.addEventListener("click", () => printPaymentReceipt(item.id));
    wrap.append(receipt);
  }
  if (resource === "leads" && canWrite(resource)) {
    const convert = document.createElement("button");
    convert.type = "button";
    convert.append(svgIcon("check"), document.createTextNode("Student"));
    convert.addEventListener("click", () => convertLead(item.id));
    wrap.append(convert);
  }
  if (!canWrite(resource)) return wrap;
  const edit = document.createElement("button");
  edit.type = "button";
  edit.append(svgIcon("edit"), document.createTextNode("Tahrirlash"));
  edit.addEventListener("click", () => openModal(resource, item));
  const remove = document.createElement("button");
  remove.type = "button";
  remove.append(svgIcon("trash"), document.createTextNode("O'chirish"));
  remove.addEventListener("click", () => deleteItem(resource, item.id));
  wrap.append(edit, remove);
  return wrap;
}

function debtActions(item) {
  const wrap = document.createElement("span");
  wrap.className = "row-actions";
  const telegram = document.createElement("button");
  telegram.type = "button";
  telegram.append(svgIcon("send"), document.createTextNode("Telegram"));
  telegram.addEventListener("click", () => showToast(`${item.full_name} uchun qarzdorlik xabari tayyorlandi.`));
  const payment = document.createElement("button");
  payment.type = "button";
  payment.append(svgIcon("wallet"), document.createTextNode("To'lov"));
  payment.addEventListener("click", () => openModal("payments", { student_id: item.id, amount: item.balance, _prefill: true }));
  wrap.append(telegram, payment);
  return wrap;
}

async function convertLead(leadId) {
  const lead = state.leads.find((item) => Number(item.id) === Number(leadId));
  try {
    await safeApi(`/api/leads/${leadId}/convert-to-student`, { method: "POST", body: JSON.stringify({}) }, async () => {
      if (!lead) return {};
      if (currentTenant?.subdomain) {
        state.students.unshift({
          id: nextCrmId("students"),
          full_name: lead.full_name,
          fullName: lead.full_name,
          phone: lead.phone,
          course_name: lead.course_name,
          course: lead.course_name,
          status: "active",
          balance: 0,
          note: `Liddan o'tkazildi: ${lead.note || ""}`,
          created_at: new Date().toISOString()
        });
        lead.status = "paid";
        persistCrmCollections();
        return { ok: true };
      }
      await window.crmServices?.studentService?.create?.({
        full_name: lead.full_name,
        phone: lead.phone,
        course_name: lead.course_name,
        status: "active",
        payment_status: "debt",
        balance: 0,
        note: `Liddan o'tkazildi: ${lead.note || ""}`
      });
      await window.crmServices?.leadService?.update?.(leadId, { ...lead, status: "paid" });
      return { ok: true };
    });
    await refreshAll();
    showToast("Lid o'quvchiga o'tkazildi.");
  } catch (error) {
    showToast(error.message);
  }
}

function renderSchedule() {
  const board = document.querySelector("[data-schedule-board]");
  if (!board) return;
  board.innerHTML = "";
  const items = state.schedule || [];
  if (!items.length) {
    board.innerHTML = `<div class="empty-state">Bugun darslar yo'q. Guruh yoki dars qo'shsangiz jadval shu yerda ko'rinadi.</div>`;
    return;
  }
  items.forEach((lesson) => {
    const card = document.createElement("article");
    card.innerHTML = `
      <time>${String(lesson.lesson_at || "").slice(11, 16) || "00:00"}</time>
      <h3>${lesson.group_name || "Guruh"}</h3>
      <p>O'qituvchi: ${lesson.teacher_name || "-"}</p>
      <p>Xona: ${lesson.room || "-"}</p>
      <strong>${lesson.student_count || 0} ta o'quvchi</strong>`;
    board.append(card);
  });
}

function renderSuper() {
  Object.entries(state.superSummary || {}).forEach(([key, value]) => {
    const node = document.querySelector(`[data-super-summary="${key}"]`);
    if (!node) return;
    node.textContent = key.includes("volume") ? formatMoney(value) : Number(value || 0).toLocaleString("uz-UZ");
  });
  const table = document.querySelector('[data-table="superCenters"]');
  if (!table) return;
  table.querySelectorAll("div:not(:first-child)").forEach((node) => node.remove());
  if (!state.superCenters?.length) {
    emptyRow(table, "Markazlar hali yo'q.");
  } else state.superCenters.forEach((center) => {
    const actions = document.createElement("span");
    actions.className = "row-actions";
    const profile = document.createElement("button");
    profile.type = "button";
    profile.append(svgIcon("building-2"), document.createTextNode("Profil"));
    profile.addEventListener("click", () => setView("super-center-profile", { route: `/ceo/centers/${center.id}` }));
    const block = document.createElement("button");
    block.type = "button";
    block.append(svgIcon(center.status === "blocked" ? "check" : "shield"), document.createTextNode(center.status === "blocked" ? "Aktiv" : "Bloklash"));
    block.addEventListener("click", async () => {
      await api(`/api/super/centers/${center.id}`, { method: "PUT", body: JSON.stringify({ status: center.status === "blocked" ? "active" : "blocked" }) });
      await refreshAll();
    });
    actions.append(profile, block);
    row(table, [center.name, center.phone, badge(center.status), center.subscription_status, center.students_count, center.groups_count, formatDate(center.last_activity_at), actions]);
  });
  renderSuperTable("superCentersFull", state.superCenters, (center) => [center.name, center.owner || center.owner_name, center.phone, center.plan || center.tariff_name || "Pro", center.subscription_status, center.students_count || 0, center.branches_count || 1, badge(center.status), superCenterActions(center)]);
  renderSuperTable("superSubscriptions", state.superSubscriptions, (item) => [item.center_name || item.organization_name || item.center || "Ilm Academy Uz", item.tariff_name || item.plan || "Pro", badge(item.status || "active"), formatDate(item.starts_at || item.created_at), formatDate(item.ends_at || item.expires_at), money(item.amount || item.monthly_price)]);
  renderSuperTable("superPayments", state.superPayments, (item) => [item.center_name || item.center || "Ilm Academy Uz", formatDate(item.paid_at || item.date), money(item.amount), item.payment_type || item.method || "bank", badge(item.status || "paid")]);
  const tariffNode = document.querySelector("[data-super-tariffs]");
  if (tariffNode) {
    const plans = state.superTariffs?.length ? state.superTariffs : (window.crmMock?.plans || []);
    tariffNode.innerHTML = plans.map((plan) => `<article class="plan-card"><span>${plan.name}</span><h2>${formatMoney(plan.monthly_price || plan.price)}</h2><p>${plan.student_limit} o'quvchi · ${plan.teacher_limit} o'qituvchi · ${plan.branch_limit} filial</p><button type="button">Tahrirlash</button></article>`).join("");
  }
  const renderBars = (selector, items, valueKey, labelKey = "month") => {
    const node = document.querySelector(selector);
    if (!node) return;
    const max = Math.max(1, ...items.map((item) => Number(item[valueKey] || 0)));
    node.innerHTML = items.map((item) => `<span style="height:${Math.max(6, Math.round(Number(item[valueKey] || 0) / max * 100))}%" title="${item[labelKey]}: ${item[valueKey] || 0}"><small>${String(item[labelKey] || '').slice(5) || '-'}</small></span>`).join("") || `<div class="empty-state">Grafik uchun ma'lumot yo'q.</div>`;
  };
  renderBars('[data-super-chart="revenue"]', state.superDashboard?.charts || [], 'revenue');
  renderBars('[data-super-chart="centers"]', state.superDashboard?.charts || [], 'new_centers');
  const apiStatus = document.querySelector('[data-super-api-status]');
  if (apiStatus) {
    const api = state.superDashboard?.api || { status: 'unknown', version: '19.5' };
    apiStatus.innerHTML = `<span>API</span>${badge(api.status || 'unknown')}<span>Versiya</span><strong>${api.version || '19.5'}</strong><span>Demo</span>${badge(api.demoMode ? 'on' : 'off')}`;
  }
  renderSuperTable("superDomains", state.superDomains, (item) => [item.center_name || '-', item.domain, item.type, badge(item.verification_status), badge(item.ssl_status), item.dns_target || 'cname.eduka.uz']);
  renderSuperTable("superInvoices", state.superInvoices, (item) => [item.center_name || '-', item.invoice_number, money(item.amount), badge(item.status), formatDate(item.due_date), formatDate(item.paid_at)]);
  const support = document.querySelector("[data-super-support]");
  if (support) {
    support.innerHTML = (state.superSupport || []).map((ticket) => `<article><strong>${ticket.center_name || 'Platforma'}</strong><span>${ticket.subject}</span><p>${ticket.latest_message || ticket.message || ''}</p><small>${formatDate(ticket.created_at)}</small></article>`).join("") || `<div class="empty-state">Support so'rovlari yo'q.</div>`;
  }
}

function renderSuperTable(name, items, mapper) {
  const table = document.querySelector(`[data-table="${name}"]`);
  if (!table) return;
  table.querySelectorAll("div:not(:first-child)").forEach((node) => node.remove());
  if (!items?.length) {
    emptyRow(table, "Ma'lumot topilmadi.");
    return;
  }
  items.forEach((item) => row(table, mapper(item)));
}

function superCenterActions(center) {
  const actions = document.createElement("span");
  actions.className = "row-actions";
  const profile = document.createElement("button");
  profile.type = "button";
  profile.append(svgIcon("building-2"), document.createTextNode("Profil"));
  profile.addEventListener("click", () => setView("super-center-profile", { route: `/ceo/centers/${center.id}` }));
  const trial = document.createElement("button");
  trial.type = "button";
  trial.append(svgIcon("badge-check"), document.createTextNode("Trial"));
  trial.addEventListener("click", () => showToast(`${center.name} uchun trial muddati uzaytirildi.`));
  actions.append(profile, trial);
  return actions;
}

async function openStudentProfile(studentId) {
  try {
    const payload = await api(`/api/students/${studentId}/profile`);
    const profile = payload.profile;
    const student = profile.student;
    activeModal = null;
    editingId = null;
    modalTitle.textContent = `${student.full_name} profili`;
    modalForm.innerHTML = `
      <div class="profile-grid">
        <article><span>Telefon</span><strong>${student.phone || "-"}</strong></article>
        <article><span>Ota-ona</span><strong>${student.parent_phone || "-"}</strong></article>
        <article><span>Guruh</span><strong>${student.group_name || "-"}</strong></article>
        <article><span>Balans</span><strong>${formatMoney(student.balance)}</strong></article>
      </div>
      <div class="profile-columns">
        <section><h3>To'lov tarixi</h3>${profile.payments.map((item) => `<p><b>${formatDate(item.paid_at)}</b><span>${formatMoney(item.amount)} - ${item.payment_type || ""}</span></p>`).join("") || "<p>To'lov yo'q</p>"}</section>
        <section><h3>Davomat tarixi</h3>${profile.attendance.map((item) => `<p><b>${formatDate(item.lesson_date)}</b><span>${statusLabels[item.status] || item.status} - ${item.group_name || ""}</span></p>`).join("") || "<p>Davomat yo'q</p>"}</section>
      </div>
      <div class="modal-actions"><button type="button" data-close-modal>Yopish</button></div>`;
    modal.hidden = false;
  } catch (error) {
    showToast(error.message);
  }
}

function badge(value) {
  const span = document.createElement("span");
  const normalized = String(value || "active");
  span.className = `status-badge status-${normalized}`;
  span.textContent = statusLabels[normalized] || normalized;
  return span;
}

function money(value) {
  const span = document.createElement("span");
  span.className = Number(value || 0) > 0 ? "money money-danger" : "money";
  span.textContent = formatMoney(value);
  return span;
}

function overdueDays(item) {
  const base = formatDate(item.last_payment_at || item.created_at || "2026-05-01");
  const days = Math.max(1, Math.round((new Date("2026-05-06") - new Date(base || "2026-05-01")) / 86400000));
  return `${days} kun`;
}

function renderDebtSummary() {
  const node = document.querySelector("[data-debt-summary]");
  const template = document.querySelector("[data-debt-template]");
  if (!node) return;
  const debts = state.debts || [];
  const total = debts.reduce((sum, item) => sum + Number(item.balance || 0), 0);
  node.innerHTML = [
    ["Jami qarzdorlik", formatMoney(total)],
    ["Qarzdor talabalar", debts.length],
    ["Muddati o'tganlar", debts.filter((item) => Number(item.balance || 0) > 0).length],
    ["Bu oy undirilgan", formatMoney((state.payments || []).reduce((sum, item) => sum + Number(item.amount || 0), 0))]
  ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join("");
  if (template) template.textContent = "Assalomu alaykum. Farzandingizning o'quv markazidagi to'lovi bo'yicha {amount} so'm qoldiq mavjud. Iltimos, to'lovni amalga oshiring.";
}

function renderAttendanceFlow() {
  const groupSelect = document.querySelector("[data-attendance-group]");
  const studentsNode = document.querySelector("[data-attendance-students]");
  document.querySelectorAll('select[data-filter="group_id"]').forEach((select) => {
    const value = select.value;
    select.innerHTML = selectOptions("groups", value);
  });
  if (!groupSelect || !studentsNode) return;
  const previous = groupSelect.value || state.groups[0]?.id || "";
  groupSelect.innerHTML = selectOptions("groups", previous);
  const selectedGroup = groupSelect.value || previous;
  const students = state.students.filter((student) => String(student.group_id) === String(selectedGroup));
  studentsNode.innerHTML = students.length
    ? students.map((student) => `
      <article data-attendance-student="${student.id}">
        <div><strong>${student.full_name}</strong><span>${student.phone || ""}</span></div>
        <select data-attendance-status>
          <option value="present">Keldi</option>
          <option value="absent">Kelmadi</option>
          <option value="late">Kechikdi</option>
          <option value="excused">Sababli</option>
          <option value="online">Online qatnashdi</option>
        </select>
      </article>`).join("")
    : `<div class="empty-state">Guruh tanlang, o'quvchilar shu yerda chiqadi.</div>`;
}

function renderReports() {
  const summary = document.querySelector("[data-report-summary]");
  if (!summary) return;
  const revenue = (state.payments || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const debt = (state.debts || []).reduce((sum, item) => sum + Number(item.balance || 0), 0);
  const activeGroups = (state.groups || []).filter((group) => group.status !== "archived").length;
  const conversion = state.leads.length ? Math.round((state.leads.filter((lead) => lead.status === "paid").length / state.leads.length) * 100) : 0;
  summary.innerHTML = [
    ["Kunlik tushum", formatMoney(Math.round(revenue / 12))],
    ["Haftalik tushum", formatMoney(Math.round(revenue / 4))],
    ["Oylik tushum", formatMoney(revenue)],
    ["Jami qarzdorlik", formatMoney(debt)],
    ["Yangi talabalar", state.students.length],
    ["Faol guruhlar", activeGroups],
    ["Davomat foizi", "91%"],
    ["Lead konversiya", `${conversion}%`]
  ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join("");
  renderBarChart('[data-report-chart="daily"]', state.analytics.monthly_payments || mockAnalytics().monthly_payments, "amount", "month");
  renderBarChart('[data-report-chart="conversion"]', state.analytics.lead_funnel || mockAnalytics().lead_funnel, "count", "status");
  const teachers = document.querySelector('[data-report-chart="teachers"]');
  if (teachers) {
    teachers.innerHTML = (state.teachers || []).map((teacher, index) => `<div><span>${index + 1}. ${teacher.full_name}</span><strong>${teacher.attendance_activity || "92%"}</strong></div>`).join("") || "Ma'lumot topilmadi";
  }
}

function renderSubscription() {
  const node = document.querySelector("[data-subscription]");
  if (!node) return;
  const plans = state.superTariffs?.length ? state.superTariffs : (window.crmMock?.plans || []);
  const current = currentUser?.organization || window.crmMock?.users?.centerAdmin?.organization || {};
  node.innerHTML = `
    <article class="current-plan">
      <span>Hozirgi tarif</span>
      <h2>${current.plan || "Pro"}</h2>
      <p>Muddati: ${formatDate(current.licenseExpiresAt || current.license_expires_at || "2026-06-06")} gacha</p>
      <ul><li>O'quvchi limiti: 500</li><li>O'qituvchi limiti: 10</li><li>Filial limiti: 1</li></ul>
      <div class="usage-progress"><span style="width:${Math.min(100, Math.round(((state.students || []).length / 500) * 100))}%"></span></div>
      <div class="export-actions"><button type="button" data-crm-action="upgrade-plan">Tarifni yangilash</button><button type="button" data-crm-action="extend-subscription">Obunani uzaytirish</button><button type="button" data-crm-action="download-invoice">Invoice yuklab olish</button><button type="button" data-crm-action="contact-support">Support bilan bog'lanish</button></div>
    </article>
    ${plans.map((plan) => `<article class="plan-card"><span>${escapeHtml(plan.name)}</span><h2>${formatMoney(plan.monthly_price || plan.price)}</h2><p>${plan.student_limit || 0} o'quvchi, ${plan.teacher_limit || 0} o'qituvchi, ${plan.branch_limit || 0} filial</p><ul>${(plan.features || ["CRM", "Hisobotlar"]).map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}</ul><button type="button" data-crm-action="upgrade-plan">Tarifni tanlash</button></article>`).join("")}`;
}

function findByPathOrFirst(collection, segment) {
  const id = profileIdFromPath(segment);
  return (collection || []).find((item) => Number(item.id) === Number(id)) || collection?.[0] || null;
}

function renderProfiles() {
  const studentNode = document.querySelector("[data-student-profile]");
  if (studentNode) {
    const student = findByPathOrFirst(state.students, "students");
    studentNode.innerHTML = student ? `
      <div class="page-head"><div><h1>${student.full_name}</h1><p>${student.course_name || "-"} · ${student.group_name || "-"}</p></div><button type="button" data-view="students">Ro'yxatga qaytish</button></div>
      <div class="profile-tabs"><button class="active">Asosiy ma'lumotlar</button><button>Guruhlar</button><button>To'lov tarixi</button><button>Davomat tarixi</button><button>Izohlar</button><button>Hujjatlar</button></div>
      <div class="profile-grid">
        <article><span>Telefon</span><strong>${student.phone || "-"}</strong></article>
        <article><span>Ota-ona telefoni</span><strong>${student.parent_phone || "-"}</strong></article>
        <article><span>Tug'ilgan sana</span><strong>${formatDate(student.birth_date) || "-"}</strong></article>
        <article><span>Balans</span><strong>${formatMoney(student.balance)}</strong></article>
      </div>
      <div class="profile-columns">
        <section><h3>To'lov tarixi</h3>${state.payments.filter((item) => String(item.student_id) === String(student.id)).map((item) => `<p><b>${formatDate(item.paid_at)}</b><span>${formatMoney(item.amount)} - ${statusLabels[item.status] || item.status}</span></p>`).join("") || "<p>To'lov yo'q</p>"}</section>
        <section><h3>Davomat tarixi</h3>${state.attendance.filter((item) => item.student_name === student.full_name || String(item.student_id) === String(student.id)).map((item) => `<p><b>${formatDate(item.lesson_date)}</b><span>${statusLabels[item.status] || item.status} - ${item.group_name || ""}</span></p>`).join("") || "<p>Davomat yo'q</p>"}</section>
      </div>` : `<div class="empty-state">Talaba topilmadi.</div>`;
  }

  const groupNode = document.querySelector("[data-group-profile]");
  if (groupNode) {
    const group = findByPathOrFirst(state.groups, "groups");
    const groupStudents = state.students.filter((student) => String(student.group_id) === String(group?.id));
    groupNode.innerHTML = group ? `
      <div class="page-head"><div><h1>${group.name}</h1><p>${group.course_name || "-"} · ${group.teacher_full_name || group.teacher_name || "-"}</p></div><button type="button" data-view="groups">Ro'yxatga qaytish</button></div>
      <div class="profile-tabs"><button class="active">Guruh ma'lumotlari</button><button>Students</button><button>Attendance</button><button>Payments</button><button>Schedule</button><button>Teacher</button></div>
      <div class="profile-grid">
        <article><span>Dars kunlari</span><strong>${group.days || "-"}</strong></article>
        <article><span>Vaqt</span><strong>${group.start_time || ""} - ${group.end_time || ""}</strong></article>
        <article><span>Xona</span><strong>${group.room || "-"}</strong></article>
        <article><span>Narx</span><strong>${formatMoney(group.monthly_price)}</strong></article>
      </div>
      <section class="settings-panel"><h3>O'quvchilar</h3><div class="mini-list">${groupStudents.map((student) => `<span>${student.full_name}</span>`).join("") || "Talaba yo'q"}</div></section>` : `<div class="empty-state">Guruh topilmadi.</div>`;
  }

  const centerNode = document.querySelector("[data-super-center-profile]");
  if (centerNode) {
    const center = findByPathOrFirst(state.superCenters, "centers");
    centerNode.innerHTML = center ? `
      <div class="page-head"><div><h1>${center.name}</h1><p>${center.owner || center.owner_name || "-"} · ${center.phone || "-"}</p></div><button type="button" data-view="super-centers">Markazlarga qaytish</button></div>
      <div class="profile-grid">
        <article><span>Tarif</span><strong>${center.plan || center.tariff_name || "Pro"}</strong></article>
        <article><span>Obuna muddati</span><strong>${formatDate(center.license_expires_at || center.licenseExpiresAt)}</strong></article>
        <article><span>O'quvchilar</span><strong>${center.students_count || 0}</strong></article>
        <article><span>Filiallar</span><strong>${center.branches_count || 1}</strong></article>
        <article><span>Oxirgi aktivlik</span><strong>${formatDate(center.last_activity_at)}</strong></article>
        <article><span>Status</span><strong>${statusLabels[center.status] || center.status}</strong></article>
      </div>
      <div class="export-actions"><button type="button" data-crm-action="super-center-block" data-id="${center.id}">Bloklash</button><button type="button" data-crm-action="super-center-tariff" data-id="${center.id}">Tarif o'zgartirish</button><button type="button" data-crm-action="super-center-trial" data-id="${center.id}">Trial berish</button><button type="button" data-crm-action="super-center-login" data-id="${center.id}">Login qilib kirish</button><button type="button" data-crm-action="super-center-support" data-id="${center.id}">Support izoh</button></div>` : `<div class="empty-state">Markaz topilmadi.</div>`;
  }
}

function renderAll() {
  loadReceiptSettings();
  renderResource("students", "Hali talabalar yo'q. Talaba yaratish tugmasini bosing.", (table, item) => row(table, [item.full_name, item.phone, item.group_name, item.course_name, badge(item.payment_status || (Number(item.balance || 0) > 0 ? "debt" : "paid")), item.attendance_percent || "-", badge(item.status), actionButtons("students", item)]));
  renderResource("leads", "Hali lidlar yo'q. Lid yaratish orqali pipeline boshlang.", (table, item) => row(table, [item.full_name, item.phone, item.course_name, item.source, badge(item.status), item.manager_name, formatDate(item.next_contact_at), actionButtons("leads", item)]));
  renderResource("groups", "Hali guruhlar yo'q.", (table, item) => row(table, [item.name, item.course_name, item.teacher_full_name || item.teacher_name, item.days, `${item.start_time || ""} - ${item.end_time || ""}`, item.room, item.student_count || 0, money(item.monthly_price), badge(item.status), actionButtons("groups", item)]));
  renderResource("courses", "Hali kurslar yo'q.", (table, item) => row(table, [item.name, item.description, money(item.price), item.duration, item.level || "-", item.lesson_type === "individual" ? "Individual" : "Guruh", item.groups_count || 0, item.students_count || 0, badge(item.status), actionButtons("courses", item)]));
  renderResource("teachers", "Hali o'qituvchilar yo'q.", (table, item) => row(table, [item.full_name, item.phone, item.email, item.subjects || item.course_name, item.groups || "-", statusLabels[item.salary_type] || item.salary_type || "fixed", badge(item.status), actionButtons("teachers", item)]));

  let total = 0;
  filteredItems("payments").forEach((item) => {
    total += Number(item.amount || 0);
  });
  renderResource("payments", "Hali to'lovlar yo'q.", (table, item) => row(table, [item.student_name, item.group_name, item.payment_month, money(item.due_amount || item.amount), money(item.paid_amount || item.amount), money(item.remaining_debt ?? Math.max(Number(item.due_amount || 0) - Number(item.amount || 0) - Number(item.discount || 0), 0)), badge(item.status || (Number(item.remaining_debt || 0) > 0 ? "partial" : "paid")), formatDate(item.paid_at), item.payment_type || item.method, actionButtons("payments", item)]));
  const financeTotal = document.querySelector("[data-finance-total]");
  if (financeTotal) financeTotal.textContent = formatMoney(total);

  renderResource("attendance", "Hali davomat belgilanmagan.", (table, item) => row(table, [formatDate(item.lesson_date), item.student_name, item.group_name, badge(item.status), item.note]));
  renderResource("debts", "Qarzdor o'quvchilar yo'q.", (table, item) => row(table, [item.full_name, item.phone, item.parent_phone, item.group_name, money(item.balance), overdueDays(item), formatDate(item.last_payment_at), debtActions(item)]));
  renderResource("audit", "Audit log hali bo'sh.", (table, item) => row(table, [formatDate(item.created_at), item.user_name, item.action, `${item.entity} ${auditChange(item.payload)}`, item.entity_id]));
  renderDebtSummary();
  renderAttendanceFlow();
  renderPipeline();
  renderSchedule();
  renderSuper();
  renderAnalytics();
  renderReports();
  renderSubscription();
  renderCrmDashboard();
  renderCrmStudents();
  renderCrmGroups();
  renderCrmTeachers();
  renderCrmCourses();
  renderCrmPayments();
  renderCrmExtraIncomePage();
  renderCrmSalaryPage();
  renderCrmBonusesPage();
  renderCrmExpensesPage();
  renderCrmCashPage();
  renderCrmDebts();
  renderCrmLeads();
  renderCrmAttendancePage();
  renderCrmSchedulePage();
  renderCrmReportsPage();
  renderCrmSettingsPage();
  renderCrmStaffAttendancePage();
  renderCrmRoomsPage();
  renderCrmPaymentTypesPage();
  renderCrmArchivePage();
  renderCrmMarketPage();
  renderCrmPermissionMatrixPage();
  renderCrmStudentAppPages();
  renderCrmTopbar(viewFromPath());
  renderProfiles();
  renderCrmProfiles();
  renderGeneratedEntities();
  renderGeneratedReports();
  refreshIcons();
}

function auditChange(payload) {
  const data = typeof payload === "string" ? JSON.parse(payload || "{}") : payload || {};
  if (data.before && data.after) return "(oldingi/yangi qiymat saqlandi)";
  if (data.before) return "(o'chirilgan qiymat saqlandi)";
  return "";
}

function renderPipeline() {
  const pipeline = document.querySelector("[data-pipeline]");
  if (!pipeline) return;
  pipeline.innerHTML = "";
  ["new", "contacted", "trial", "paid", "lost"].forEach((status) => {
    const card = document.createElement("article");
    const leads = state.leads.filter((lead) => lead.status === status);
    card.className = "kanban-column";
    card.dataset.status = status;
    card.innerHTML = `<header><span>${statusLabels[status]}</span><strong>${leads.length}</strong></header>`;
    leads.forEach((lead) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.draggable = true;
      chip.dataset.leadId = lead.id;
      chip.innerHTML = `<b>${lead.full_name}</b><small>${lead.phone || ""}</small>`;
      chip.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", String(lead.id)));
      card.append(chip);
    });
    card.addEventListener("dragover", (event) => event.preventDefault());
    card.addEventListener("drop", async (event) => {
      event.preventDefault();
      const leadId = Number(event.dataTransfer.getData("text/plain"));
      const lead = state.leads.find((item) => item.id === leadId);
      if (!lead || lead.status === status) return;
      await safeApi(`/api/leads/${leadId}`, { method: "PUT", body: JSON.stringify({ ...lead, status }) }, async () => {
        await window.crmServices?.leadService?.update?.(leadId, { ...lead, status });
        return { ok: true };
      });
      await refreshAll();
      showToast("Lid statusi o'zgartirildi.");
    });
    pipeline.append(card);
  });
}

function renderBarChart(selector, rows, valueKey, labelKey) {
  const node = document.querySelector(selector);
  if (!node) return;
  node.innerHTML = "";
  const max = Math.max(1, ...rows.map((rowItem) => Number(rowItem[valueKey] || 0)));
  rows.forEach((rowItem) => {
    const bar = document.createElement("div");
    const value = Number(rowItem[valueKey] || 0);
    bar.innerHTML = `<span>${rowItem[labelKey]}</span><strong>${value.toLocaleString("uz-UZ")}</strong><i style="height:${Math.max(8, (value / max) * 100)}%"></i>`;
    node.append(bar);
  });
}

function renderAnalytics() {
  const smart = state.analytics.smart || {};
  const smartNodes = {
    today_revenue: formatMoney(smart.today_revenue),
    revenue_growth: `${Number(smart.revenue_growth || 0).toFixed(1)}% kechagiga nisbatan`,
    today_leads: Number(smart.today_leads || 0).toLocaleString("uz-UZ"),
    conversion_rate: `${Number(smart.conversion_rate || 0).toFixed(1)}%`,
    debt_total: formatMoney(smart.debt_total),
    debtors: `${Number(smart.debtors || 0)} qarzdor`
  };
  Object.entries(smartNodes).forEach(([key, value]) => {
    const node = document.querySelector(`[data-smart="${key}"]`);
    if (node) node.textContent = value;
  });
  const alerts = document.querySelector("[data-alerts]");
  if (alerts) {
    alerts.innerHTML = "";
    (smart.alerts || ["Muhim ogohlantirish yo'q"]).forEach((text) => {
      const item = document.createElement("p");
      item.textContent = text;
      alerts.append(item);
    });
  }

  renderBarChart('[data-chart="monthly_payments"]', state.analytics.monthly_payments || [], "amount", "month");
  renderBarChart('[data-chart="student_growth"]', state.analytics.student_growth || [], "count", "month");

  const funnel = document.querySelector('[data-chart="lead_funnel"]');
  if (funnel) {
    funnel.innerHTML = "";
    const rows = state.analytics.lead_funnel || [];
    const max = Math.max(1, ...rows.map((item) => Number(item.count || 0)));
    rows.forEach((item) => {
      const line = document.createElement("div");
      line.innerHTML = `<span>${statusLabels[item.status] || item.status}</span><strong>${item.count}</strong><i style="width:${Math.max(6, (Number(item.count || 0) / max) * 100)}%"></i>`;
      funnel.append(line);
    });
  }

  const ranks = document.querySelector('[data-chart="top_groups"]');
  if (ranks) {
    ranks.innerHTML = "";
    (state.analytics.top_groups || []).forEach((item, index) => {
      const line = document.createElement("div");
      line.innerHTML = `<span>${index + 1}. ${item.name || "Guruh"}</span><strong>${item.students}</strong>`;
      ranks.append(line);
    });
    if (!ranks.children.length) ranks.textContent = "Hali guruhlar yo'q.";
  }
}

function selectOptions(type, value) {
  const staticOptions = {
    leadStatus: [["new", "Yangi"], ["contacted", "Aloqa qilindi"], ["trial", "Sinov darsi"], ["paid", "To'lov qildi"], ["lost", "Yo'qotildi"], ["later", "Keyinroq"]],
    studentStatus: [["active", "Faol"], ["frozen", "Muzlatilgan"], ["left", "Ketgan"], ["debtor", "Qarzdor"]],
    activeStatus: [["active", "Faol"], ["archived", "Arxiv"]],
    attendanceStatus: [["present", "Keldi"], ["absent", "Kelmadi"], ["late", "Kechikdi"], ["excused", "Sababli"], ["online", "Online qatnashdi"]],
    lessonType: [["group", "Guruh"], ["individual", "Individual"]],
    lessonStatus: [["planned", "Rejalashtirilgan"], ["completed", "O'tilgan"], ["cancelled", "Bekor qilingan"]],
    salaryType: [["fixed", "Fixed"], ["per_lesson", "Darsbay"], ["percentage", "Foiz"]],
    paymentStatus: [["paid", "To'langan"], ["partial", "Qisman to'langan"], ["debt", "Qarzdor"], ["overdue", "Muddati o'tgan"], ["cancelled", "Bekor qilingan"]],
    paymentType: [["naqd", "Naqd"], ["karta", "Karta"], ["click", "Click"], ["payme", "Payme"], ["uzum", "Uzum"], ["bank", "Bank"]]
  };
  const options =
    type === "groups"
      ? state.groups.map((item) => [item.id, item.name])
      : type === "teachers"
        ? state.teachers.map((item) => [item.id, item.full_name])
        : type === "students"
          ? state.students.map((item) => [item.id, item.full_name])
          : type === "courses"
            ? state.courses.map((item) => [item.name, item.name])
            : staticOptions[type] || [];
  return `<option value="">Tanlang</option>${options.map(([id, label]) => `<option value="${id}" ${String(value || "") === String(id) ? "selected" : ""}>${label}</option>`).join("")}`;
}

function fieldHtml([name, label, type, required], item = {}) {
  const value = item[name] || "";
  if (type === "checkbox") return `<label class="check-field"><input name="${name}" type="checkbox" value="1" ${value ? "checked" : ""} /><span>${label}</span></label>`;
  if (type === "textarea") return `<label><span>${label}</span><textarea name="${name}" ${required ? "required" : ""}>${value || ""}</textarea></label>`;
  if (type.startsWith("select:")) return `<label><span>${label}</span><select name="${name}" ${required ? "required" : ""}>${selectOptions(type.split(":")[1], value)}</select></label>`;
  const clippedValue = ["date", "month", "time", "datetime-local"].includes(type) ? String(value || "").slice(0, type === "datetime-local" ? 16 : 10) : String(value || "");
  return `<label><span>${label}</span><input name="${name}" type="${type}" value="${clippedValue}" ${required ? "required" : ""} /></label>`;
}

function openModal(resource, item = null) {
  activeModal = resource;
  editingId = item?._prefill ? null : item?.id || null;
  const config = modalFields[resource];
  modalTitle.textContent = editingId ? `${config.title}ni tahrirlash` : config.title;
  modalForm.innerHTML = config.fields.map((field) => fieldHtml(field, item || {})).join("") + `<div class="modal-actions"><button type="button" data-close-modal>Bekor qilish</button><button type="submit">${editingId ? "Saqlash" : "Yaratish"}</button></div>`;
  if (resource === "attendance") {
    modalForm.querySelector(".modal-actions")?.insertAdjacentHTML("afterbegin", '<button type="button" data-attendance-all>Keldi: hammasi</button>');
  }
  modal.hidden = false;
  modalForm.querySelector("[name]")?.focus();
}

function closeModal() {
  modal.hidden = true;
  modalForm.innerHTML = "";
  activeModal = null;
  editingId = null;
}

const adminStorageKey = "eduka_admin_state_v2";
const legacyAdminStorageKeys = ["eduka_admin_state_v1"];
const adminSessionKey = "eduka_admin_session_v1";
const adminAccounts = []; // 21.8.3: client-side demo CEO accounts removed. Login uses /api/auth/login only.
const reservedSubdomains = ["www", "app", "api", "admin", "super", "mail", "support", "help", "dashboard", "control", "billing"];
const adminMenu = [
  ["admin-dashboard", "Dashboard"],
  ["admin-centers", "O'quv markazlar"],
  ["admin-centers-new", "Yangi markaz"],
  ["admin-subdomains", "Subdomainlar"],
  ["admin-subscriptions", "Obunalar"],
  ["admin-payments", "To'lovlar"],
  ["admin-plans", "Tariflar"],
  ["admin-demo-requests", "So'rovlar"],
  ["admin-support", "Support"],
  ["admin-admin-users", "Adminlar"],
  ["admin-audit-log", "Audit log"],
  ["admin-settings", "Sozlamalar"]
];
const adminState = loadAdminState();
let activeAdminTab = "overview";
let activeAdminSettingsTab = "general";

function adminSession() {
  try {
    return JSON.parse(localStorage.getItem(adminSessionKey) || "null");
  } catch {
    return null;
  }
}

function isAdminAuthenticated() {
  return Boolean(adminSession()?.email);
}

function currentAdmin() {
  return adminSession() || currentUser || { fullName: "Yaviz Super Admin", email: "yaviz@eduka.uz", role: "super_admin" };
}

async function adminLogin(email, password) {
  const payload = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  const user = payload.user;
  if (!isSuperRole(user?.role)) {
    try { await api("/api/auth/logout", { method: "POST" }); } catch {}
    throw new Error("Bu login Super Admin emas. /ceo/login faqat platforma egasi uchun.");
  }
  const session = {
    id: user.id,
    fullName: user.fullName || user.full_name || "Yaviz Super Admin",
    email: user.email,
    role: user.role,
    loggedInAt: new Date().toISOString()
  };
  localStorage.setItem(adminSessionKey, JSON.stringify(session));
  currentUser = { ...user, role: String(user.role || "super_admin").toLowerCase() };
  addAuditLog("login", "admin", session.email, "-", "success");
  return currentUser;
}


function adminLogout() {
  const session = adminSession();
  if (session) addAuditLog("logout", "admin", session.email, "active", "ended");
  localStorage.removeItem(adminSessionKey);
  currentUser = null;
  showAdminLogin();
}

function showAdminLogin(error = "") {
  authScreen.hidden = true;
  appShell.hidden = true;
  closeModal();
  closeOnboarding();
  let screen = document.querySelector("[data-admin-login-screen]");
  if (!screen) {
    screen = document.createElement("main");
    screen.className = "admin-login-screen";
    screen.dataset.adminLoginScreen = "";
    document.body.append(screen);
  }
  screen.hidden = false;
  screen.innerHTML = `
    <section class="admin-login-card">
      <a class="brand" href="/">
        <span class="logo-mark"><img src="/assets/logo_icon.webp" alt="" /></span>
        <span>EDUKA</span>
      </a>
      <div>
        <span class="admin-login-eyebrow">CEO Control Center</span>
        <h1>Eduka CEO / Super Admin kirish paneli</h1>
        <p>Markazlar, obunalar, to'lovlar va platforma sozlamalarini bitta joydan boshqaring.</p>
      </div>
      <form class="admin-login-form" data-admin-login-form>
        <label>Email<input name="email" type="email" autocomplete="username" required /></label>
        <label>Parol<input name="password" type="password" autocomplete="current-password" required /></label>
        <div class="form-error" data-admin-login-error>${error}</div>
        <button type="submit">Kirish</button>
      </form>
    </section>`;
  if (!isPlatformLoginPath()) window.history.replaceState({ viewName: "admin-login" }, "", "/ceo/login");
}

function hideAdminLogin() {
  const screen = document.querySelector("[data-admin-login-screen]");
  if (screen) screen.hidden = true;
}

function adminUserFromSession() {
  const session = adminSession();
  if (!session) return null;
  return { id: session.id, fullName: session.fullName, email: session.email, role: session.role.toLowerCase(), organization: null };
}

function adminProfileIdFromPath() {
  const match = window.location.pathname.match(/\/(?:ceo|super)\/centers\/(\d+)/);
  return match ? Number(match[1]) : null;
}

function seedAdminState() {
  const plans = [
    { id: 1, name: "Start", price: 290000, studentLimit: 100, teacherLimit: 5, branchLimit: 1, groupLimit: 25, telegramEnabled: false, reportsEnabled: false, apiAccess: false, customDomainEnabled: false, supportLevel: "Basic" },
    { id: 2, name: "Pro", price: 590000, studentLimit: 500, teacherLimit: 20, branchLimit: 3, groupLimit: 80, telegramEnabled: true, reportsEnabled: true, apiAccess: false, customDomainEnabled: false, supportLevel: "Standard" },
    { id: 3, name: "Business", price: 990000, studentLimit: 2000, teacherLimit: 100, branchLimit: 10, groupLimit: 200, telegramEnabled: true, reportsEnabled: true, apiAccess: true, customDomainEnabled: true, supportLevel: "Priority" }
  ].map((plan) => ({
    ...plan,
    billingPeriod: "monthly",
    status: "active"
  }));
  return {
    _version: 2,
    centers: [],
    plans,
    subscriptions: [],
    payments: [],
    demoRequests: [],
    supportTickets: [],
    adminUsers: [
      { id: 1, name: "Eduka egasi", email: "admin@eduka.uz", role: "OWNER", status: "active", lastLogin: "-", createdAt: "2026-05-07", twoFa: true },
      { id: 2, name: "Platforma menejeri", email: "manager@eduka.uz", role: "SUPER_ADMIN", status: "active", lastLogin: "-", createdAt: "2026-05-07", twoFa: false }
    ],
    auditLogs: [],
    settings: {
      general: { platformName: "Eduka", supportEmail: "support@eduka.uz", defaultLanguage: "uz", defaultCurrency: "UZS" },
      domains: { mainDomain: "eduka.uz", wildcardDomain: "*.eduka.uz", reservedSubdomains: reservedSubdomains.join(", ") },
      billing: { defaultTrialDays: 7, invoicePrefix: "EDU", tax: "0", paymentMethods: "cash, card, click, payme, bank" },
      notifications: { telegram: "Faol", email: "Faol", sms: "Faol" },
      security: { require2fa: false, sessionTimeout: 60, allowedRoles: "OWNER, SUPER_ADMIN, SALES_MANAGER, SUPPORT_MANAGER, FINANCE_MANAGER, TECH_ADMIN" },
      integrations: { telegramBot: "", paymentGateway: "Click / Payme", emailService: "SMTP" }
    }
  };
}

function loadAdminState() {
  try {
    const saved = JSON.parse(localStorage.getItem(adminStorageKey) || "null");
    if (saved?.centers && saved?.plans) return normalizeAdminState(saved);
  } catch {
    localStorage.removeItem(adminStorageKey);
  }
  legacyAdminStorageKeys.forEach((key) => localStorage.removeItem(key));
  const seeded = seedAdminState();
  localStorage.setItem(adminStorageKey, JSON.stringify(seeded));
  return seeded;
}

function saveAdminState() {
  adminState._version = 2;
  localStorage.setItem(adminStorageKey, JSON.stringify(adminState));
  saveSharedTenantRegistry();
}

function saveSharedTenantRegistry() {
  const registry = {
    centers: adminState.centers,
    adminUsers: adminState.adminUsers.filter((user) => user.centerId || user.centerSubdomain),
    savedAt: new Date().toISOString()
  };
  try {
    const value = encodeURIComponent(JSON.stringify(registry));
    const domain = window.location.hostname.endsWith(".eduka.uz") || window.location.hostname === "eduka.uz" ? "; domain=.eduka.uz" : "";
    document.cookie = `eduka_tenant_registry=${value}; path=/; max-age=31536000; SameSite=Lax${domain}`;
  } catch {}
}

function loadSharedTenantRegistry() {
  const cookie = String(document.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith("eduka_tenant_registry="));
  if (!cookie) return;
  try {
    const registry = JSON.parse(decodeURIComponent(cookie.split("=").slice(1).join("=")));
    if (Array.isArray(registry.centers) && registry.centers.length && !adminState.centers.length) adminState.centers = registry.centers;
    if (Array.isArray(registry.adminUsers)) {
      registry.adminUsers.forEach((user) => {
        if (!adminState.adminUsers.some((item) => item.email === user.email && item.centerId === user.centerId)) adminState.adminUsers.push(user);
      });
    }
  } catch {}
}

function normalizeAdminState(saved) {
  const base = seedAdminState();
  if (saved._version !== 2) {
    localStorage.setItem(adminStorageKey, JSON.stringify(base));
    return base;
  }
  return {
    ...base,
    ...saved,
    _version: 2,
    centers: Array.isArray(saved.centers) ? saved.centers : [],
    plans: Array.isArray(saved.plans) && saved.plans.length ? saved.plans : base.plans,
    subscriptions: Array.isArray(saved.subscriptions) ? saved.subscriptions : [],
    payments: Array.isArray(saved.payments) ? saved.payments : [],
    demoRequests: Array.isArray(saved.demoRequests) ? saved.demoRequests : [],
    supportTickets: Array.isArray(saved.supportTickets) ? saved.supportTickets : [],
    auditLogs: Array.isArray(saved.auditLogs) ? saved.auditLogs : [],
    adminUsers: Array.isArray(saved.adminUsers) && saved.adminUsers.length ? saved.adminUsers : base.adminUsers,
    settings: saved.settings && typeof saved.settings === "object" ? { ...base.settings, ...saved.settings } : base.settings
  };
}

function resetAdminOperationalData() {
  adminState.centers = [];
  adminState.subscriptions = [];
  adminState.payments = [];
  adminState.demoRequests = [];
  adminState.supportTickets = [];
  adminState.auditLogs = [];
  saveAdminState();
}

function nextAdminId(collection) {
  return Math.max(0, ...collection.map((item) => Number(item.id) || 0)) + 1;
}

function addAuditLog(action, targetType, targetName, oldValue = "-", newValue = "-") {
  adminState.auditLogs.unshift({
    id: nextAdminId(adminState.auditLogs),
    admin: currentAdmin()?.fullName || "Eduka egasi",
    action,
    targetType,
    targetName,
    oldValue: String(oldValue ?? "-"),
    newValue: String(newValue ?? "-"),
    ip: "127.0.0.1",
    date: new Date().toISOString()
  });
  saveAdminState();
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("uz-UZ").replace(/,/g, " ")} so'm`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "center";
}

function tenantFromLocation() {
  const queryTenant = new URLSearchParams(window.location.search).get("tenant");
  if (queryTenant) return slugify(queryTenant);
  const host = window.location.hostname.toLowerCase();
  const parts = host.split(".");
  if (host === "eduka.uz" || host === "www.eduka.uz" || host === "localhost" || host === "127.0.0.1") return "";
  if (parts.length >= 3 && parts.slice(-2).join(".") === "eduka.uz") {
    const subdomain = parts[0];
    return reservedSubdomains.includes(subdomain) ? "" : subdomain;
  }
  return "";
}

function domainMode() {
  const host = window.location.hostname.toLowerCase();
  if (host === "admin.eduka.uz") return "admin";
  if (host === "app.eduka.uz") return "app";
  if (host === "eduka.uz" || host === "www.eduka.uz" || host === "localhost" || host === "127.0.0.1") return "root";
  const subdomain = host.endsWith(".eduka.uz") ? host.split(".")[0] : "";
  if (reservedSubdomains.includes(subdomain)) return subdomain;
  return subdomain ? "tenant" : "root";
}

function tenantSessionKey(subdomain = tenantFromLocation()) {
  return `eduka_tenant_session_${slugify(subdomain)}`;
}

function tenantDataStorageKey(subdomain = currentTenant?.subdomain || tenantFromLocation() || "default") {
  return `eduka_center_${slugify(subdomain)}_crm_v1`;
}

function tenantApiHeaders() {
  const tenant = currentTenant;
  window.currentTenant = tenant || null;
  return tenant?.subdomain ? { "X-Tenant-Subdomain": tenant.subdomain, "X-Center-Id": String(tenant.centerId || "") } : {};
}

function resolveTenantCenter(subdomain = tenantFromLocation()) {
  if (!subdomain || reservedSubdomains.includes(subdomain)) return null;
  return adminState.centers.find((item) => String(item.subdomain || "").toLowerCase() === subdomain);
}

function tenantUsersFor(center) {
  if (!center) return [];
  return adminState.adminUsers.filter((user) => String(user.centerId || "") === String(center.id) || user.centerSubdomain === center.subdomain);
}

function tenantSession(subdomain = tenantFromLocation()) {
  try {
    const session = JSON.parse(localStorage.getItem(tenantSessionKey(subdomain)) || "null");
    if (session?.centerSubdomain === subdomain) return session;
  } catch {
    localStorage.removeItem(tenantSessionKey(subdomain));
  }
  return null;
}

function setTenantSession(center, user) {
  const session = {
    centerId: center.id,
    centerName: center.name,
    centerSubdomain: center.subdomain,
    userRole: user.role,
    userEmail: user.email,
    userName: user.name || user.fullName || center.owner,
    loggedInAt: new Date().toISOString()
  };
  localStorage.setItem(tenantSessionKey(center.subdomain), JSON.stringify(session));
  currentTenant = { subdomain: center.subdomain, centerId: center.id, centerName: center.name, session };
  window.currentTenant = currentTenant;
  return session;
}

function tenantUserFromSession(center, session) {
  return {
    id: session.userEmail,
    fullName: session.userName,
    email: session.userEmail,
    role: "center_admin",
    organization: { id: center.id, name: center.name, subdomain: center.subdomain }
  };
}

function renderTenantNotFound(subdomain) {
  authScreen.hidden = false;
  appShell.hidden = true;
  authScreen.innerHTML = `<section class="login-panel tenant-not-found"><a class="brand" href="https://eduka.uz"><span class="logo-mark"><img src="/assets/logo_icon.webp" alt="" /></span><span>EDUKA</span></a><h1>Bu o'quv markaz topilmadi</h1><p class="login-copy">Siz kiritgan subdomain Eduka platformasida ro'yxatdan o'tmagan.</p><div class="tenant-chip">${escapeHtml(subdomain)}</div><div class="modal-actions"><a class="demo-login" href="https://eduka.uz">Eduka bosh sahifasiga qaytish</a><a class="forgot-link" href="mailto:support@eduka.uz">Support bilan bog'lanish</a><button type="button" onclick="window.location.reload()">Qayta urinish</button></div></section>`;
}

function renderTenantLogin(center, error = "") {
  currentTenant = { subdomain: center.subdomain, centerId: center.id, centerName: center.name };
  window.currentTenant = currentTenant;
  authScreen.hidden = false;
  appShell.hidden = true;
  authScreen.innerHTML = `<section class="login-panel tenant-login-panel"><a class="brand" href="https://eduka.uz"><span class="logo-mark"><img src="/assets/logo_icon.webp" alt="" /></span><span>EDUKA</span></a><div><span class="admin-login-eyebrow">${escapeHtml(center.name)}</span><h1>${escapeHtml(center.name)} kabinetiga kirish</h1><p class="login-copy">Kabinetga kirish uchun login ma'lumotlaringizni kiriting.</p></div><form data-tenant-login-form><label>Email<input name="email" type="email" autocomplete="username" required /></label><label>Parol<input name="password" type="password" autocomplete="current-password" required /></label><div class="form-error" data-tenant-login-error>${escapeHtml(error)}</div><button type="submit">Kirish</button></form><button class="forgot-link" type="button" data-tenant-forgot>Parol esdan chiqdimi?</button></section>`;
}

async function resolveTenantCenterFromApi(subdomain) {
  try {
    const payload = await api(`/api/tenant/resolve/${encodeURIComponent(subdomain)}`);
    if (!payload.center) return null;
    const center = {
      id: payload.center.id,
      name: payload.center.name,
      subdomain: payload.center.subdomain,
      owner: payload.center.owner,
      phone: payload.center.phone,
      email: payload.center.email,
      status: payload.center.status || "active",
      plan: payload.center.plan || "Start",
      subscriptionStatus: "active",
      studentsCount: 0,
      teachersCount: 0,
      groupsCount: 0,
      branchesCount: 1,
      monthlyPayment: Number(payload.center.monthly_payment || 0),
      registeredAt: new Date().toISOString().slice(0, 10),
      subscriptionEndsAt: "",
      lastActivityAt: new Date().toISOString().slice(0, 10),
      supportNotes: []
    };
    if (!adminState.centers.some((item) => String(item.id) === String(center.id) || item.subdomain === center.subdomain)) {
      adminState.centers.push(center);
      saveAdminState();
    }
    return center;
  } catch {
    return null;
  }
}

async function applyTenantContext() {
  const mode = domainMode();
  if (mode === "admin" && !window.location.pathname.startsWith("/admin")) {
    window.history.replaceState({ viewName: "admin-login" }, "", "/admin/login");
  }
  if (mode === "admin" || window.location.pathname.startsWith("/admin")) return false;
  const tenant = tenantFromLocation();
  if (!tenant) {
    currentTenant = null;
    window.currentTenant = null;
    return false;
  }
  const center = resolveTenantCenter(tenant) || await resolveTenantCenterFromApi(tenant);
  if (!center) {
    renderTenantNotFound(tenant);
    return true;
  }
  const session = tenantSession(tenant);
  currentTenant = { subdomain: center.subdomain, centerId: center.id, centerName: center.name, session };
  window.currentTenant = currentTenant;
  if (!session) {
    renderTenantLogin(center);
    return true;
  }
  centerName.textContent = center.name;
  showApp(tenantUserFromSession(center, session));
  if (!window.location.pathname.startsWith("/admin")) setView("dashboard", { route: `/admin/dashboard${window.location.search}`, replace: true });
  return true;
}

async function handleTenantLogin(form) {
  const tenant = tenantFromLocation();
  const center = resolveTenantCenter(tenant) || await resolveTenantCenterFromApi(tenant);
  const errorNode = form.querySelector("[data-tenant-login-error]");
  if (!center) {
    renderTenantNotFound(tenant);
    return;
  }
  const data = Object.fromEntries(new FormData(form).entries());
  const submitButton = form.querySelector("button[type='submit']");
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Tekshirilmoqda...";
  }
  try {
    const payload = await api("/api/auth/tenant-login", {
      method: "POST",
      body: JSON.stringify({ email: data.email, password: data.password, subdomain: center.subdomain })
    });
    const session = setTenantSession(center, {
      email: payload.user?.email || data.email,
      name: payload.user?.fullName || center.owner || center.name,
      role: payload.user?.role || "center_admin"
    });
    addAuditLog("tenant login success", "center", center.name, "-", session.userEmail);
    saveAdminState();
    showApp(payload.user || tenantUserFromSession(center, session));
    setView("dashboard", { route: `/admin/dashboard${window.location.search}`, replace: true });
    showToast("Kabinet ochildi.");
    return;
  } catch (error) {
    const hasLocalFallback = tenantUsersFor(center).length > 0;
    if (!hasLocalFallback && errorNode) errorNode.textContent = error.message || "Email yoki parol noto'g'ri";
    if (!hasLocalFallback) {
      addAuditLog("tenant login failed", "center", center.name, data.email || "-", error.message || "failed");
      saveAdminState();
      showToast(error.message || "Email yoki parol noto'g'ri");
      return;
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Kirish";
    }
  }

  const user = tenantUsersFor(center).find((item) => item.email.toLowerCase() === String(data.email || "").toLowerCase().trim() && String(item.password || "") === String(data.password || ""));
  if (!user) {
    const anyEmail = adminState.adminUsers.find((item) => item.email.toLowerCase() === String(data.email || "").toLowerCase().trim());
    const message = anyEmail ? "Bu login ushbu markazga tegishli emas" : "Email yoki parol noto'g'ri";
    if (errorNode) errorNode.textContent = message;
    addAuditLog("tenant login failed", "center", center.name, data.email || "-", message);
    showToast(message);
    return;
  }
  const session = setTenantSession(center, user);
  addAuditLog("tenant login success", "center", center.name, "-", user.email);
  saveAdminState();
  showApp(tenantUserFromSession(center, session));
  setView("dashboard", { route: `/admin/dashboard${window.location.search}`, replace: true });
  showToast("Kabinet ochildi.");
}

function tenantLogout() {
  if (currentTenant?.subdomain) {
    localStorage.removeItem(tenantSessionKey(currentTenant.subdomain));
    addAuditLog("tenant logout", "center", currentTenant.centerName, "active", "ended");
    saveAdminState();
    const center = resolveTenantCenter(currentTenant.subdomain);
    currentUser = null;
    if (center) renderTenantLogin(center);
    else showAuth();
    showToast("Tizimdan chiqildi.");
    return true;
  }
  return false;
}

function renderBadge(value) {
  const label = {
    active: "Aktiv",
    blocked: "Bloklangan",
    trial: "Sinov",
    expired: "Muddati o'tgan",
    paid: "To'langan",
    pending: "Kutilmoqda",
    overdue: "Muddati o'tgan",
    paused: "Pauza",
    cancelled: "Bekor qilingan",
    healthy: "Barqaror",
    ready: "Tayyor",
    secure: "Himoyalangan",
    NEW: "Yangi",
    CONTACTED: "Aloqa qilindi",
    DEMO_SCHEDULED: "Uchrashuv belgilandi",
    TRIAL_CREATED: "Sinov ochildi",
    CUSTOMER: "Mijozga aylandi",
    REJECTED: "Rad etildi",
    LATER: "Keyinroq",
    OPEN: "Ochiq",
    IN_PROGRESS: "Jarayonda",
    WAITING_CUSTOMER: "Mijoz javobi kutilmoqda",
    RESOLVED: "Hal qilindi",
    CLOSED: "Yopilgan"
  }[value] || value || "-";
  return `<span class="status-badge ${String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}">${label}</span>`;
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function validateSubdomain(value, currentCenterId = null) {
  const subdomain = String(value || "").trim().toLowerCase();
  if (!subdomain) return "Subdomain required.";
  if (/\s/.test(subdomain)) return "Subdomain ichida bo'sh joy bo'lmasin.";
  if (!/^[a-z0-9-]+$/.test(subdomain)) return "Faqat lowercase latin harflar, raqamlar va hyphen ishlating.";
  if (subdomain.length < 3 || subdomain.length > 30) return "Subdomain 3-30 belgi bo'lishi kerak.";
  if (reservedSubdomains.includes(subdomain)) return "Bu subdomain tizim uchun band qilingan";
  if (adminState.centers.some((center) => center.subdomain === subdomain && center.id !== currentCenterId)) return "Bu subdomain band.";
  return "";
}

function adminFilter(collection, keys = []) {
  const search = document.querySelector("[data-admin-search]")?.value?.toLowerCase().trim() || "";
  const status = document.querySelector("[data-admin-filter='status']")?.value || "";
  const plan = document.querySelector("[data-admin-filter='plan']")?.value || "";
  const payment = document.querySelector("[data-admin-filter='payment']")?.value || "";
  const method = document.querySelector("[data-admin-filter='method']")?.value || "";
  const activity = document.querySelector("[data-admin-filter='activity']")?.value || "";
  return collection.filter((item) => {
    const text = keys.map((key) => item[key]).join(" ").toLowerCase();
    if (search && !text.includes(search)) return false;
    if (status && item.status !== status && item.subscriptionStatus !== status) return false;
    if (plan && item.plan !== plan) return false;
    if (payment && item.paymentStatus !== payment) return false;
    if (method && item.method !== method) return false;
    if (activity === "recent" && item.lastActivityAt < "2026-05-05") return false;
    if (activity === "stale" && item.lastActivityAt >= "2026-05-05") return false;
    return true;
  });
}

function ensureAdminShell() {
  const content = document.querySelector(".content");
  if (!document.getElementById("admin-dashboard")) {
    content.insertAdjacentHTML("beforeend", adminRouteKeys.map((key) => `<section class="view admin-view" id="admin-${key}"><div data-admin-root></div></section>`).join(""));
  }
  const sidebar = document.querySelector(".sidebar");
  let nav = document.querySelector("[data-admin-nav]");
  if (!nav) {
    nav = document.createElement("nav");
    nav.className = "side-nav admin-side-nav";
    nav.dataset.adminNav = "";
    nav.innerHTML = adminMenu.map(([view, label]) => `<button type="button" data-view="${view}">${label}</button>`).join("");
    sidebar.insertBefore(nav, document.querySelector(".sidebar-footer"));
  }

  // 21.4.2 hard route isolation:
  // /admin is the learning-center CRM. /super is the Eduka platform owner panel.
  // Never use platform-owner auth guard on /admin/* pages.
  const inSuper = isPlatformPath();
  if (inSuper && !isAdminAuthenticated() && !isPlatformLoginPath()) {
    showAdminLogin();
    return;
  }
  hideAdminLogin();

  const createStudent = document.querySelector(".create-student");
  if (createStudent) createStudent.hidden = inSuper;
  document.querySelectorAll(".side-nav:not([data-admin-nav]), .side-subnav").forEach((node) => {
    node.hidden = inSuper;
  });
  nav.hidden = !inSuper;
  document.querySelector(".license-banner")?.classList.toggle("admin-hidden", inSuper);
  document.body.classList.toggle("admin-mode", inSuper);
  if (centerName) centerName.textContent = inSuper ? "Platform Control Center" : (currentUser?.organization?.name || currentTenant?.centerName || "Eduka CRM");
  const topbar = document.querySelector(".topbar");
  let adminHeader = document.querySelector("[data-admin-header]");
  if (!adminHeader) {
    adminHeader = document.createElement("div");
    adminHeader.className = "admin-header-tools";
    adminHeader.dataset.adminHeader = "";
    topbar?.append(adminHeader);
  }
  adminHeader.hidden = !inSuper;
  if (inSuper) {
    const admin = currentAdmin();
    adminHeader.innerHTML = `<button type="button" data-admin-action="toast" data-message="Bildirishnomalar markazi ochildi.">Bildirishnomalar</button><button type="button" data-admin-action="profile-menu">${admin.fullName}</button><button type="button" data-admin-logout>Chiqish</button>`;
  }
}

function adminLayout(title, actions = "") {
  return `<div class="admin-page-head"><div><span>Eduka Platform</span><h1>${title}</h1></div><div class="admin-actions">${actions}</div></div>`;
}

function adminTable(headers, rows, empty = "Ma'lumot topilmadi") {
  return `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${headers.map((head) => `<th>${head}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.join("") : `<tr><td colspan="${headers.length}"><div class="empty-state">${empty}</div></td></tr>`}</tbody></table></div>`;
}

function adminSummary() {
  const active = adminState.centers.filter((center) => center.status === "active");
  const trial = adminState.centers.filter((center) => center.subscriptionStatus === "trial");
  const expired = adminState.centers.filter((center) => center.subscriptionStatus === "expired");
  const blocked = adminState.centers.filter((center) => center.status === "blocked");
  return {
    centers: adminState.centers.length,
    active: active.length,
    trial: trial.length,
    expired: expired.length,
    blocked: blocked.length,
    mrr: adminState.subscriptions.filter((item) => item.status === "active").reduce((sum, item) => sum + Number(item.price || 0), 0),
    today: adminState.centers.filter((center) => center.registeredAt === new Date().toISOString().slice(0, 10)).length,
    students: adminState.centers.reduce((sum, center) => sum + Number(center.studentsCount || 0), 0),
    teachers: adminState.centers.reduce((sum, center) => sum + Number(center.teachersCount || 0), 0),
    groups: adminState.centers.reduce((sum, center) => sum + Number(center.groupsCount || 0), 0)
  };
}

function renderAdminDashboard() {
  const summary = adminSummary();
  const cards = [
    ["Jami markazlar", summary.centers],
    ["Aktiv markazlar", summary.active],
    ["Trial markazlar", summary.trial],
    ["Expired markazlar", summary.expired],
    ["Blocked markazlar", summary.blocked],
    ["MRR oylik daromad", formatCurrency(summary.mrr)],
    ["Bugungi yangi", summary.today],
    ["Jami o'quvchilar", summary.students],
    ["Jami o'qituvchilar", summary.teachers],
    ["Jami guruhlar", summary.groups]
  ];
  const expiring = adminState.centers.filter((center) => center.subscriptionEndsAt <= "2026-06-10");
  const debts = adminState.subscriptions.filter((item) => ["overdue", "pending"].includes(item.paymentStatus));
  return `${adminLayout("Platform Control Center", '<button type="button" data-admin-action="go" data-target="admin-centers">Barcha markazlar</button>')}
    <div class="admin-kpis">${cards.map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong></article>`).join("")}</div>
    <div class="admin-dashboard-grid">
      ${adminMiniList("Oxirgi ro'yxatdan o'tgan markazlar", adminState.centers.slice(0, 5), "admin-centers-new", "Hali o'quv markazlar qo'shilmagan", "Yangi markaz yaratish")}
      ${adminMiniList("Obunasi tugayotgan markazlar", expiring, "admin-subscriptions", "Hali o'quv markazlar qo'shilmagan")}
      ${adminMiniList("Qarzdor markazlar", debts.map((item) => ({ name: item.centerName, status: item.paymentStatus })), "admin-payments", "To'lovlar mavjud emas")}
      ${adminMiniList("Eng faol markazlar", [...adminState.centers].sort((a, b) => b.studentsCount - a.studentsCount).slice(0, 5), "admin-centers", "Hali o'quv markazlar qo'shilmagan")}
      ${adminMiniList("Bugungi so'rovlar", adminState.demoRequests.filter((item) => item.createdAt === new Date().toISOString().slice(0, 10)).map((item) => ({ name: item.centerName, status: item.status })), "admin-demo-requests", "So'rovlar mavjud emas")}
      <section class="admin-panel"><div class="page-head"><h2>Platforma holati</h2><button type="button" data-admin-action="go" data-target="admin-settings">Details</button></div><div class="admin-status"><span>API</span>${renderBadge("healthy")}<span>Ma'lumotlar</span>${renderBadge("secure")}<span>Billing</span>${renderBadge("ready")}</div></section>
    </div>`;
}

function adminMiniList(title, items, target, empty = "Ma'lumot yo'q", actionLabel = "Barchasi") {
  return `<section class="admin-panel"><div class="page-head"><h2>${title}</h2><button type="button" data-admin-action="go" data-target="${target}">${actionLabel}</button></div>${items.length ? items.map((item) => `<div class="admin-list-row"><span>${item.name || item.centerName}</span>${renderBadge(item.status || item.subscriptionStatus || "active")}<button type="button" data-admin-action="go" data-target="${target}">Ochish</button></div>`).join("") : `<div class="empty-state">${empty}</div>`}</section>`;
}

function renderAdminCenters() {
  const centers = adminFilter(adminState.centers, ["name", "subdomain", "owner", "phone", "email", "plan"]);
  const rows = centers.map((center) => `<tr data-admin-row="${center.id}"><td><button type="button" class="link-button" data-admin-action="profile" data-id="${center.id}">${center.name}</button></td><td>${center.subdomain}</td><td>${center.owner}</td><td>${center.phone}</td><td>${center.email}</td><td>${center.plan}</td><td>${renderBadge(center.status)}</td><td>${center.studentsCount}</td><td>${center.branchesCount}</td><td>${formatCurrency(center.monthlyPayment)}</td><td>${formatDate(center.subscriptionEndsAt)}</td><td>${formatDate(center.lastActivityAt)}</td><td class="admin-row-actions">${centerActions(center)}</td></tr>`);
  return `${adminLayout("O'quv markazlar", '<button type="button" data-admin-action="go" data-target="admin-centers-new">Yangi markaz</button>')}
    ${adminFilters("Markaz, egasi, subdomain", ["status", "plan", "subscription", "activity"])}
    ${adminTable(["Markaz", "Subdomain", "Egasi", "Telefon", "Email", "Tarif", "Status", "O'quvchilar", "Filial", "Oylik to'lov", "Obuna tugashi", "Oxirgi aktivlik", "Amallar"], rows, "Hali o'quv markazlar qo'shilmagan")}`;
}

function centerActions(center) {
  return `<button type="button" data-admin-action="profile" data-id="${center.id}">Profil</button>
    <button type="button" data-admin-modal="change-plan" data-id="${center.id}">Tarif</button>
    <button type="button" data-admin-modal="extend-trial" data-id="${center.id}">Trial uzaytirish</button>
    <button type="button" data-admin-modal="edit-subdomain" data-id="${center.id}">Subdomain</button>
    <button type="button" data-admin-modal="login-as-center" data-id="${center.id}">Markazga kirish</button>
    <button type="button" data-admin-action="toggle-center" data-id="${center.id}">${center.status === "blocked" ? "Aktivlashtirish" : "Bloklash"}</button>
    <button type="button" data-admin-modal="support-note" data-id="${center.id}">Izoh</button>`;
}

function adminFilters(placeholder, filters = []) {
  const options = {
    status: '<select data-admin-filter="status"><option value="">Status</option><option value="active">Aktiv</option><option value="blocked">Bloklangan</option><option value="trial">Sinov</option><option value="expired">Muddati o‘tgan</option><option value="OPEN">Ochiq</option><option value="RESOLVED">Hal qilingan</option></select>',
    plan: `<select data-admin-filter="plan"><option value="">Tarif</option>${adminState.plans.map((plan) => `<option>${plan.name}</option>`).join("")}</select>`,
    subscription: '<select data-admin-filter="status"><option value="">Obuna</option><option value="active">Aktiv</option><option value="trial">Sinov</option><option value="expired">Muddati o‘tgan</option><option value="paused">Pauza</option></select>',
    activity: '<select data-admin-filter="activity"><option value="">Aktivlik</option><option value="recent">Yaqinda faol</option><option value="stale">Sokin</option></select>',
    payment: '<select data-admin-filter="payment"><option value="">To‘lov statusi</option><option value="paid">To‘langan</option><option value="pending">Kutilmoqda</option><option value="overdue">Muddati o‘tgan</option><option value="trial">Sinov</option></select>',
    method: '<select data-admin-filter="method"><option value="">To‘lov usuli</option><option value="bank">Bank</option><option value="click">Click</option><option value="payme">Payme</option><option value="card">Karta</option></select>'
  };
  return `<div class="admin-filters"><input data-admin-search placeholder="${placeholder}" />${filters.map((key) => options[key] || "").join("")}<button type="button" data-admin-action="reset-filters">Filtrlarni tozalash</button></div>`;
}

function renderAdminCenterForm() {
  return `${adminLayout("Yangi markaz yaratish", '<button type="button" data-admin-action="go" data-target="admin-centers">Centers</button>')}
    <form class="admin-form" data-admin-create-center>
      ${centerFormFields({ plan: "Pro", status: "active", trialDays: 7, studentLimit: 500, teacherLimit: 12, branchLimit: 2 })}
      <div class="modal-actions"><button type="button" data-admin-action="check-subdomain">Subdomain tekshirish</button><button type="submit">Yaratish</button></div>
    </form>`;
}

function centerFormFields(center = {}) {
  return `<div class="center-wizard-progress" aria-label="Yangi markaz yaratish bosqichlari">
      <span class="active">1. Markaz</span><span>2. Domen</span><span>3. Admin</span><span>4. Tarif</span>
    </div>
    <section class="admin-form-section"><h3>Markaz ma'lumotlari</h3><p>O'quv markaz nomi va aloqa ma'lumotlarini kiriting.</p>
      <div class="admin-form-grid">
        <label>Markaz nomi<input name="name" value="${center.name || ""}" placeholder="Masalan: ALOO ACADEMY" required /></label>
        <label>Subdomain<input name="subdomain" value="${center.subdomain || ""}" placeholder="aloo-academy" required /><small>Natija: subdomain.eduka.uz</small></label>
        <label>Egasi ism familiyasi<input name="owner" value="${center.owner || ""}" placeholder="Masalan: Yahyobek" required /></label>
        <label>Telefon<input name="phone" value="${center.phone || ""}" placeholder="+998901234567" required /></label>
        <label>Email<input name="email" value="${center.email || ""}" placeholder="admin@center.uz" required /></label>
        <label>Manzil<input name="address" value="${center.address || ""}" placeholder="Viloyat, shahar, ko'cha" /></label>
      </div>
    </section>
    <section class="admin-form-section"><h3>Tarif va limitlar</h3><p>Markaz qaysi imkoniyatlardan foydalanishini belgilang.</p>
      <div class="admin-form-grid compact">
        <label>Tarif<select name="plan" required>${adminState.plans.map((plan) => `<option ${plan.name === center.plan ? "selected" : ""}>${plan.name}</option>`).join("")}</select></label>
        <label>Trial muddati<input name="trialDays" type="number" value="${center.trialDays ?? 7}" min="0" /></label>
        <label>O'quvchi limiti<input name="studentLimit" type="number" value="${center.studentLimit ?? center.studentsCount ?? 0}" min="0" /></label>
        <label>O'qituvchi limiti<input name="teacherLimit" type="number" value="${center.teacherLimit ?? center.teachersCount ?? 0}" min="0" /></label>
        <label>Filial limiti<input name="branchLimit" type="number" value="${center.branchLimit ?? center.branchesCount ?? 1}" min="1" /></label>
        <label>Status<select name="status"><option value="active" ${center.status === "active" ? "selected" : ""}>active</option><option value="blocked" ${center.status === "blocked" ? "selected" : ""}>blocked</option></select></label>
      </div>
    </section>
    <section class="admin-form-section"><h3>Admin kirishi</h3><p>Markaz egasi uchun alohida login/parol yaratiladi.</p>
      <div class="admin-option-list">
        <label class="check-field"><input name="createAdmin" type="checkbox" checked /><span><b>Admin login yaratish</b><small>Markaz egasi tizimga alohida kiradi.</small></span></label>
        <label class="check-field"><input name="autoPassword" type="checkbox" checked /><span><b>Parolni auto-generate qilish</b><small>Xavfsiz vaqtinchalik parol avtomatik yaratiladi.</small></span></label>
        <label class="admin-password-field">Admin parol<input name="adminPassword" value="${center.adminPassword || "12345678"}" /><small>Auto-generate o'chirilsa, shu parol ishlatiladi.</small></label>
        <label class="check-field muted"><input name="starterData" type="checkbox" /><span><b>Boshlang'ich ma'lumot bilan yaratish</b><small>Faqat test/demo ko'rsatish uchun: namunaviy kurs, guruh va talaba qo'shadi. Real markazda belgilanmasin.</small></span></label>
      </div>
    </section>
    <div class="form-error" data-admin-form-error></div>`;
}

function renderAdminCenterProfile() {
  const center = adminState.centers.find((item) => item.id === adminProfileIdFromPath());
  if (!center) return `${adminLayout("Center not found")}<div class="empty-state">Markaz topilmadi. <button type="button" data-admin-action="go" data-target="admin-centers">Back to centers</button></div>`;
  const tabs = ["overview", "users", "subscription", "usage", "payments", "support notes", "technical"];
  return `${adminLayout(center.name, '<button type="button" data-admin-action="go" data-target="admin-centers">Back</button>')}
    <div class="admin-profile-actions">${centerActions(center)}<button type="button" data-admin-action="reset-center-password" data-id="${center.id}">Admin parolini yangilash</button><button type="button" data-admin-modal="send-message" data-id="${center.id}">Xabar yuborish</button></div>
    <div class="tabs">${tabs.map((tab) => `<button type="button" class="${activeAdminTab === tab ? "active" : ""}" data-admin-action="tab" data-tab="${tab}">${tab}</button>`).join("")}</div>
    <section class="admin-panel">${renderCenterTab(center)}</section>`;
}

function renderCenterTab(center) {
  if (activeAdminTab === "users") return adminTable(["Name", "Role", "Status"], [`<tr><td>${center.owner}</td><td>Owner</td><td>${renderBadge("active")}</td></tr>`]);
  if (activeAdminTab === "subscription") return adminTable(["Plan", "Status", "End date", "Monthly"], [`<tr><td>${center.plan}</td><td>${renderBadge(center.subscriptionStatus)}</td><td>${formatDate(center.subscriptionEndsAt)}</td><td>${formatCurrency(center.monthlyPayment)}</td></tr>`]);
  if (activeAdminTab === "usage") return `<div class="admin-kpis"><article><span>Students</span><strong>${center.studentsCount}</strong></article><article><span>Teachers</span><strong>${center.teachersCount}</strong></article><article><span>Groups</span><strong>${center.groupsCount}</strong></article><article><span>Branches</span><strong>${center.branchesCount}</strong></article></div>`;
  if (activeAdminTab === "payments") return renderAdminPayments(center.id);
  if (activeAdminTab === "support notes") return (center.supportNotes || []).map((note) => `<div class="admin-list-row"><span>${note.text}</span><small>${formatDate(note.date)}</small></div>`).join("") || `<div class="empty-state">Support note yo'q</div>`;
  if (activeAdminTab === "technical") return `<div class="profile-grid"><article><span>URL</span><strong>https://${center.subdomain}.eduka.uz</strong></article><article><span>SSL</span><strong>Faol</strong></article><article><span>Tenant status</span><strong>${renderBadge(center.status)}</strong></article></div>`;
  return `<div class="profile-grid">${Object.entries({ Nomi: center.name, Subdomain: center.subdomain, Link: `<a href="https://${center.subdomain}.eduka.uz" target="_blank" rel="noreferrer">https://${center.subdomain}.eduka.uz</a>`, Egasi: center.owner, Telefon: center.phone, Email: center.email, Manzil: center.address, Tarif: center.plan, "Ro'yxatdan o'tgan": center.registeredAt, "Oxirgi aktivlik": center.lastActivityAt }).map(([key, value]) => `<article><span>${key}</span><strong>${value || "-"}</strong></article>`).join("")}<article><span>Status</span><strong>${renderBadge(center.status)}</strong></article></div>`;
}

function renderAdminSubdomains() {
  const rows = adminFilter(adminState.centers, ["name", "subdomain"]).map((center) => `<tr><td>${center.subdomain}</td><td>${center.name}</td><td>https://${center.subdomain}.eduka.uz</td><td>${renderBadge(center.status)}</td><td>${renderBadge("healthy")}</td><td>${formatDate(center.registeredAt)}</td><td>${formatDate(center.lastActivityAt)}</td><td><button type="button" data-admin-modal="edit-subdomain" data-id="${center.id}">Tahrirlash</button></td></tr>`);
  return `${adminLayout("Subdomainlar", '<button type="button" data-admin-action="tenant-check">Tenant tekshirish</button>')}${adminFilters("Subdomain yoki markaz", ["status"])}<div class="admin-panel"><b>Reserved:</b> ${reservedSubdomains.join(", ")}</div>${adminTable(["Subdomain", "Markaz", "To'liq URL", "Status", "SSL", "Yaratilgan", "Oxirgi ishlatilgan", "Amallar"], rows, "Hali o'quv markazlar qo'shilmagan")}`;
}

function renderAdminSubscriptions() {
  const rows = adminFilter(adminState.subscriptions, ["centerName", "plan"]).map((item) => `<tr><td>${item.centerName}</td><td>${item.plan}</td><td>${formatCurrency(item.price)}</td><td>${formatDate(item.startDate)}</td><td>${formatDate(item.endDate)}</td><td>${renderBadge(item.status)}</td><td>${item.autoRenew ? "Faol" : "O'chiq"}</td><td>${renderBadge(item.paymentStatus)}</td><td><button type="button" data-admin-modal="extend-subscription" data-id="${item.id}">Uzaytirish</button><button type="button" data-admin-modal="subscription-plan" data-id="${item.id}">Tarif</button><button type="button" data-admin-action="subscription-status" data-id="${item.id}" data-status="cancelled">Bekor qilish</button><button type="button" data-admin-action="subscription-status" data-id="${item.id}" data-status="paused">Pauza</button><button type="button" data-admin-action="create-invoice" data-id="${item.id}">Invoice</button></td></tr>`);
  return `${adminLayout("Obunalar")}${adminSubscriptionCards()}${adminFilters("Markaz yoki tarif", ["status", "plan", "payment"])}${adminTable(["Markaz", "Tarif", "Narx", "Boshlanish", "Tugash", "Status", "Auto renew", "To'lov", "Amallar"], rows, "Hali obunalar mavjud emas")}`;
}

function adminSubscriptionCards() {
  const active = adminState.subscriptions.filter((item) => item.status === "active").length;
  const trial = adminState.subscriptions.filter((item) => item.status === "trial").length;
  const expired = adminState.subscriptions.filter((item) => item.status === "expired").length;
  const mrr = adminState.subscriptions.filter((item) => item.status === "active").reduce((sum, item) => sum + Number(item.price || 0), 0);
  return `<div class="admin-kpis"><article><span>Active</span><strong>${active}</strong></article><article><span>Trial</span><strong>${trial}</strong></article><article><span>Expired</span><strong>${expired}</strong></article><article><span>MRR</span><strong>${formatCurrency(mrr)}</strong></article></div>`;
}

function renderAdminPayments(centerId = null) {
  const list = centerId ? adminState.payments.filter((item) => item.centerId === centerId) : adminFilter(adminState.payments, ["centerName", "invoiceNumber", "note"]);
  const rows = list.map((item) => `<tr><td>${item.centerName}</td><td>${item.plan}</td><td>${formatCurrency(item.amount)}</td><td>${formatDate(item.paymentDate)}</td><td>${item.method}</td><td>${renderBadge(item.status)}</td><td>${item.invoiceNumber}</td><td>${item.note}</td><td><button type="button" data-admin-modal="payment" data-id="${item.id}">Tahrirlash</button><button type="button" data-admin-action="mark-paid" data-id="${item.id}">To'langan</button><button type="button" data-admin-action="download-invoice" data-id="${item.id}">Invoice</button><button type="button" data-admin-action="delete-payment" data-id="${item.id}">O'chirish</button></td></tr>`);
  if (centerId) return adminTable(["Center", "Plan", "Amount", "Date", "Method", "Status", "Invoice", "Note", "Actions"], rows);
  const monthly = adminState.payments.filter((item) => item.paymentDate?.startsWith("2026-05")).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const yearly = adminState.payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const pending = adminState.payments.filter((item) => item.status === "pending").length;
  const overdue = adminState.subscriptions.filter((item) => item.paymentStatus === "overdue").length;
  return `${adminLayout("Platforma to'lovlari", '<button type="button" data-admin-modal="payment">To‘lov qo‘shish</button>')}<div class="admin-kpis"><article><span>Oylik tushum</span><strong>${formatCurrency(monthly)}</strong></article><article><span>Yillik tushum</span><strong>${formatCurrency(yearly)}</strong></article><article><span>Kutilayotgan</span><strong>${pending}</strong></article><article><span>Muddati o‘tgan markazlar</span><strong>${overdue}</strong></article></div>${adminFilters("Markaz, invoice, izoh", ["status", "method"])}${adminTable(["Markaz", "Tarif", "Summa", "Sana", "Usul", "Status", "Invoice", "Izoh", "Amallar"], rows, "To'lovlar mavjud emas")}`;
}

function renderAdminPlans() {
  const rows = adminState.plans.map((plan) => `<tr><td>${plan.name}</td><td>${formatCurrency(plan.price)}</td><td>${plan.billingPeriod}</td><td>${plan.studentLimit}</td><td>${plan.teacherLimit}</td><td>${plan.branchLimit}</td><td>${plan.groupLimit}</td><td>${plan.telegramEnabled ? "Ha" : "Yo'q"}</td><td>${plan.reportsEnabled ? "Ha" : "Yo'q"}</td><td>${plan.apiAccess ? "Ha" : "Yo'q"}</td><td>${plan.customDomainEnabled ? "Ha" : "Yo'q"}</td><td>${plan.supportLevel}</td><td>${renderBadge(plan.status)}</td><td><button type="button" data-admin-modal="plan" data-id="${plan.id}">Tahrirlash</button><button type="button" data-admin-action="toggle-plan" data-id="${plan.id}">${plan.status === "active" ? "O'chirish" : "Aktivlashtirish"}</button><button type="button" data-admin-action="delete-plan" data-id="${plan.id}">Delete</button></td></tr>`);
  return `${adminLayout("Tariflar", '<button type="button" data-admin-modal="plan">Tarif qo‘shish</button>')}<div class="plans-grid">${adminState.plans.map((plan) => `<article class="plan-card"><span>${plan.name}</span><h2>${formatCurrency(plan.price)}</h2><p>${plan.studentLimit} o'quvchi · ${plan.supportLevel}</p></article>`).join("")}</div>${adminTable(["Nomi", "Narx", "Period", "O'quvchi", "O'qituvchi", "Filial", "Guruh", "Telegram", "Hisobot", "API", "Custom domain", "Support", "Status", "Amallar"], rows)}`;
}

function renderAdminDemoRequests() {
  const rows = adminFilter(adminState.demoRequests, ["centerName", "contactPerson", "phone", "email"]).map((item) => `<tr><td>${item.centerName}</td><td>${item.contactPerson}</td><td>${item.phone}</td><td>${item.email}</td><td>${item.interestedPlan}</td><td>${item.source}</td><td>${renderBadge(item.status)}</td><td>${item.responsibleAdmin}</td><td>${formatDate(item.createdAt)}</td><td><button type="button" data-admin-action="demo-status" data-id="${item.id}" data-status="CONTACTED">Aloqa qilindi</button><button type="button" data-admin-modal="demo-note" data-id="${item.id}">Uchrashuv/izoh</button><button type="button" data-admin-action="trial-center" data-id="${item.id}">Sinov ochish</button><button type="button" data-admin-action="demo-status" data-id="${item.id}" data-status="CUSTOMER">Mijozga aylantirish</button><button type="button" data-admin-action="delete-demo" data-id="${item.id}">O'chirish</button></td></tr>`);
  return `${adminLayout("So'rovlar")}${adminFilters("Markaz, kontakt, telefon", ["status", "plan"])}${adminTable(["Markaz", "Kontakt", "Telefon", "Email", "Tarif", "Manba", "Status", "Mas'ul", "Yaratilgan", "Amallar"], rows, "So'rovlar mavjud emas")}`;
}

function renderAdminSupport() {
  const rows = adminFilter(adminState.supportTickets, ["centerName", "subject", "category", "assignedAdmin"]).map((item) => `<tr><td>${item.centerName}</td><td>${item.subject}</td><td>${item.category}</td><td>${renderBadge(item.priority)}</td><td>${renderBadge(item.status)}</td><td>${item.assignedAdmin}</td><td>${formatDate(item.createdAt)}</td><td><button type="button" data-admin-modal="ticket" data-id="${item.id}">Details</button><button type="button" data-admin-action="ticket-status" data-id="${item.id}" data-status="IN_PROGRESS">Jarayonda</button><button type="button" data-admin-action="ticket-status" data-id="${item.id}" data-status="RESOLVED">Hal qilish</button><button type="button" data-admin-action="ticket-status" data-id="${item.id}" data-status="CLOSED">Yopish</button></td></tr>`);
  return `${adminLayout("Support", '<button type="button" data-admin-modal="ticket">Ticket yaratish</button>')}${adminFilters("Ticket, markaz, kategoriya", ["status"])}${adminTable(["Markaz", "Mavzu", "Kategoriya", "Prioritet", "Status", "Mas'ul", "Yaratilgan", "Amallar"], rows, "Support murojaatlari mavjud emas")}`;
}

function renderAdminUsers() {
  const rows = adminFilter(adminState.adminUsers, ["name", "email", "role"]).map((user) => `<tr><td>${user.name}</td><td>${user.email}</td><td>${roleLabel(user.role)}</td><td>${renderBadge(user.status)}</td><td>${formatDate(user.lastLogin)}</td><td>${formatDate(user.createdAt)}</td><td><button type="button" data-admin-modal="admin-user" data-id="${user.id}">Tahrirlash</button><button type="button" data-admin-action="toggle-admin-user" data-id="${user.id}">${user.status === "blocked" ? "Aktivlashtirish" : "Bloklash"}</button><button type="button" data-admin-action="reset-admin-password" data-id="${user.id}">Parolni yangilash</button><button type="button" data-admin-action="toggle-2fa" data-id="${user.id}">2FA</button></td></tr>`);
  return `${adminLayout("Adminlar", '<button type="button" data-admin-modal="admin-user">Admin qo‘shish</button>')}${adminFilters("Ism, email, rol", ["status"])}${adminTable(["Ism", "Email", "Rol", "Status", "Oxirgi kirish", "Yaratilgan", "Amallar"], rows)}`;
}

function roleLabel(role) {
  return {
    OWNER: "Egasi",
    SUPER_ADMIN: "Super admin",
    SALES_MANAGER: "Sotuv menejeri",
    SUPPORT_MANAGER: "Support menejeri",
    FINANCE_MANAGER: "Moliya menejeri",
    TECH_ADMIN: "Texnik admin"
  }[role] || role || "-";
}

function renderAdminAuditLog() {
  const rows = adminFilter(adminState.auditLogs, ["admin", "action", "targetType", "targetName"]).map((log) => `<tr><td>${log.admin}</td><td>${log.action}</td><td>${log.targetType}</td><td>${log.targetName}</td><td>${log.oldValue}</td><td>${log.newValue}</td><td>${log.ip}</td><td>${formatDate(log.date)}</td></tr>`);
  return `${adminLayout("Audit log", '<button type="button" data-admin-action="export-audit">Export</button>')}${adminFilters("Admin, action, target", ["status"])}${adminTable(["Admin", "Action", "Target type", "Target name", "Old value", "New value", "IP", "Date"], rows, "Audit yozuvlari mavjud emas")}`;
}

function renderAdminSettings() {
  const tabs = ["general", "domains", "billing", "notifications", "security", "integrations"];
  const data = adminState.settings[activeAdminSettingsTab] || {};
  return `${adminLayout("Sozlamalar", '<button type="button" data-admin-action="reset-data">Boshlang\'ich holatga qaytarish</button>')}<div class="tabs">${tabs.map((tab) => `<button type="button" class="${activeAdminSettingsTab === tab ? "active" : ""}" data-admin-action="settings-tab" data-tab="${tab}">${tab}</button>`).join("")}</div><form class="admin-form" data-admin-settings-form data-section="${activeAdminSettingsTab}">${Object.entries(data).map(([key, value]) => `<label>${key}<input name="${key}" value="${value}" /></label>`).join("")}<div class="modal-actions"><button type="submit">Saqlash</button></div></form>`;
}

function renderAdminView(viewName) {
  ensureAdminShell();
  document.querySelectorAll("[data-admin-nav] [data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === navViewFor(viewName)));
  const root = document.querySelector(`#${viewName} [data-admin-root]`);
  if (!root) return;
  const map = {
    "admin-dashboard": renderAdminDashboard,
    "admin-centers": renderAdminCenters,
    "admin-centers-new": renderAdminCenterForm,
    "admin-center-profile": renderAdminCenterProfile,
    "admin-subdomains": renderAdminSubdomains,
    "admin-subscriptions": renderAdminSubscriptions,
    "admin-payments": renderAdminPayments,
    "admin-plans": renderAdminPlans,
    "admin-demo-requests": renderAdminDemoRequests,
    "admin-support": renderAdminSupport,
    "admin-admin-users": renderAdminUsers,
    "admin-audit-log": renderAdminAuditLog,
    "admin-settings": renderAdminSettings
  };
  root.innerHTML = (map[viewName] || (() => `${adminLayout("Admin route topilmadi")}<div class="empty-state">Noma'lum admin route. <button type="button" data-admin-action="go" data-target="admin-dashboard">Dashboard</button></div>`))();
  refreshIcons();
}

function adminOpenModal(type, id = null) {
  activeModal = `admin-${type}`;
  editingId = id ? Number(id) : null;
  const center = adminState.centers.find((item) => item.id === editingId);
  const subscription = adminState.subscriptions.find((item) => item.id === editingId);
  const payment = adminState.payments.find((item) => item.id === editingId) || {};
  const plan = adminState.plans.find((item) => item.id === editingId) || {};
  const adminUser = adminState.adminUsers.find((item) => item.id === editingId) || {};
  const ticket = adminState.supportTickets.find((item) => item.id === editingId) || {};
  modalTitle.textContent = type.replace(/-/g, " ");
  if (type === "change-plan" || type === "subscription-plan") modalForm.innerHTML = `<label>Tarif<select name="plan">${adminState.plans.map((item) => `<option ${item.name === (center?.plan || subscription?.plan) ? "selected" : ""}>${item.name}</option>`).join("")}</select></label>${adminModalActions()}`;
  else if (type === "extend-trial" || type === "extend-subscription") modalForm.innerHTML = `<label>Kunlar<input name="days" type="number" value="7" /></label>${adminModalActions()}`;
  else if (type === "edit-subdomain") modalForm.innerHTML = `<label>Subdomain<input name="subdomain" value="${center?.subdomain || ""}" /></label><div class="form-error" data-admin-form-error></div>${adminModalActions("Tekshirish va saqlash")}`;
  else if (type === "support-note" || type === "demo-note" || type === "send-message") modalForm.innerHTML = `<label>Izoh<textarea name="note" required></textarea></label>${adminModalActions()}`;
  else if (type === "login-as-center") modalForm.innerHTML = `<div class="success-box"><h3>${center?.name || "Markaz"}</h3><p>Xavfsiz kirish havolasi tayyorlandi. Amal audit logga yoziladi.</p><p><a href="https://${center?.subdomain || "center"}.eduka.uz" target="_blank" rel="noreferrer">https://${center?.subdomain || "center"}.eduka.uz</a></p></div><div class="modal-actions"><button type="button" data-close-modal>Bekor qilish</button><button type="button" data-admin-action="open-tenant" data-id="${center?.id || ""}">Markazga kirish</button></div>`;
  else if (type === "payment") modalForm.innerHTML = `<label>Center<select name="centerId">${adminState.centers.map((item) => `<option value="${item.id}" ${item.id === payment.centerId ? "selected" : ""}>${item.name}</option>`).join("")}</select></label><label>Amount<input name="amount" type="number" value="${payment.amount || ""}" required /></label><label>Date<input name="paymentDate" type="date" value="${payment.paymentDate || "2026-05-06"}" /></label><label>Method<select name="method"><option>bank</option><option>click</option><option>payme</option><option>card</option></select></label><label>Status<select name="status"><option>paid</option><option>pending</option><option>overdue</option></select></label><label>Note<input name="note" value="${payment.note || ""}" /></label>${adminModalActions()}`;
  else if (type === "plan") modalForm.innerHTML = `<label>Name<input name="name" value="${plan.name || ""}" required /></label><label>Price<input name="price" type="number" value="${plan.price || 0}" /></label><label>Student limit<input name="studentLimit" type="number" value="${plan.studentLimit || 0}" /></label><label>Teacher limit<input name="teacherLimit" type="number" value="${plan.teacherLimit || 0}" /></label><label>Branch limit<input name="branchLimit" type="number" value="${plan.branchLimit || 0}" /></label><label>Group limit<input name="groupLimit" type="number" value="${plan.groupLimit || 0}" /></label><label>Support<input name="supportLevel" value="${plan.supportLevel || "Basic"}" /></label><label>Status<select name="status"><option>active</option><option>inactive</option></select></label>${adminModalActions()}`;
  else if (type === "admin-user") modalForm.innerHTML = `<label>Name<input name="name" value="${adminUser.name || ""}" required /></label><label>Email<input name="email" value="${adminUser.email || ""}" required /></label><label>Role<select name="role">${["OWNER", "SUPER_ADMIN", "SALES_MANAGER", "SUPPORT_MANAGER", "FINANCE_MANAGER", "TECH_ADMIN"].map((role) => `<option ${role === adminUser.role ? "selected" : ""}>${role}</option>`).join("")}</select></label><label>Status<select name="status"><option>active</option><option>blocked</option></select></label>${adminModalActions()}`;
  else if (type === "ticket") modalForm.innerHTML = `<label>Center<select name="centerId">${adminState.centers.map((item) => `<option value="${item.id}" ${item.id === ticket.centerId ? "selected" : ""}>${item.name}</option>`).join("")}</select></label><label>Subject<input name="subject" value="${ticket.subject || ""}" required /></label><label>Category<select name="category">${["login", "payment", "telegram bot", "subdomain", "bug", "feature request"].map((item) => `<option>${item}</option>`).join("")}</select></label><label>Priority<select name="priority"><option>low</option><option>medium</option><option>high</option><option>urgent</option></select></label><label>Status<select name="status"><option>OPEN</option><option>IN_PROGRESS</option><option>WAITING_CUSTOMER</option><option>RESOLVED</option><option>CLOSED</option></select></label><label>Reply/note<textarea name="note">${ticket.history?.map((item) => `${item.author}: ${item.text}`).join("\n") || ""}</textarea></label>${adminModalActions()}`;
  modal.hidden = false;
}

function adminModalActions(label = "Saqlash") {
  return `<div class="modal-actions"><button type="button" data-close-modal>Bekor qilish</button><button type="submit">${label}</button></div>`;
}

function handleAdminModalSubmit() {
  const type = activeModal.replace("admin-", "");
  const data = Object.fromEntries(new FormData(modalForm).entries());
  const center = adminState.centers.find((item) => item.id === editingId);
  if ((type === "change-plan" || type === "subscription-plan") && data.plan) {
    const old = center?.plan || adminState.subscriptions.find((item) => item.id === editingId)?.plan;
    const targetCenter = center || adminState.centers.find((item) => item.id === adminState.subscriptions.find((sub) => sub.id === editingId)?.centerId);
    if (targetCenter) {
      targetCenter.plan = data.plan;
      targetCenter.monthlyPayment = adminState.plans.find((plan) => plan.name === data.plan)?.price || targetCenter.monthlyPayment;
      adminState.subscriptions.filter((item) => item.centerId === targetCenter.id).forEach((item) => {
        item.plan = data.plan;
        item.price = targetCenter.monthlyPayment;
      });
      addAuditLog("plan changed", "center", targetCenter.name, old, data.plan);
    }
  } else if ((type === "extend-trial" || type === "extend-subscription") && data.days) {
    const targetCenter = center || adminState.centers.find((item) => item.id === adminState.subscriptions.find((sub) => sub.id === editingId)?.centerId);
    if (targetCenter) {
      const date = new Date(targetCenter.subscriptionEndsAt || Date.now());
      date.setDate(date.getDate() + Number(data.days || 0));
      targetCenter.subscriptionEndsAt = date.toISOString().slice(0, 10);
      targetCenter.subscriptionStatus = "trial";
      adminState.subscriptions.filter((item) => item.centerId === targetCenter.id).forEach((item) => {
        item.endDate = targetCenter.subscriptionEndsAt;
        item.status = "trial";
      });
      addAuditLog("trial extended", "center", targetCenter.name, "-", `${data.days} days`);
    }
  } else if (type === "edit-subdomain" && center) {
    const error = validateSubdomain(data.subdomain, center.id);
    if (error) {
      modalForm.querySelector("[data-admin-form-error]").textContent = error;
      return;
    }
    const old = center.subdomain;
    center.subdomain = data.subdomain;
    addAuditLog("subdomain changed", "center", center.name, old, data.subdomain);
  } else if (type === "support-note" && center) {
    center.supportNotes = center.supportNotes || [];
    center.supportNotes.unshift({ text: data.note, date: new Date().toISOString() });
    addAuditLog("support note added", "center", center.name, "-", data.note);
  } else if (type === "send-message" && center) {
    addAuditLog("message sent", "center", center.name, "-", data.note);
  } else if (type === "login-as-center" && center) {
    addAuditLog("login as center", "center", center.name, "-", center.subdomain);
  } else if (type === "payment") {
    savePayment(data);
  } else if (type === "plan") {
    savePlan(data);
  } else if (type === "admin-user") {
    saveAdminUser(data);
  } else if (type === "ticket") {
    saveTicket(data);
  } else if (type === "demo-note") {
    const request = adminState.demoRequests.find((item) => item.id === editingId);
    if (request) {
      request.notes = request.notes || [];
      request.notes.unshift(data.note);
      request.status = "DEMO_SCHEDULED";
    }
  }
  saveAdminState();
  closeModal();
  renderAdminView(viewFromPath());
  showToast("Admin action saqlandi.");
}

function savePayment(data) {
  const center = adminState.centers.find((item) => item.id === Number(data.centerId));
  if (!center) return showToast("Avval o'quv markaz yarating.");
  const item = editingId ? adminState.payments.find((payment) => payment.id === editingId) : { id: nextAdminId(adminState.payments) };
  Object.assign(item, { centerId: center.id, centerName: center.name, plan: center.plan, amount: Number(data.amount || 0), paymentDate: data.paymentDate, method: data.method, status: data.status, invoiceNumber: item.invoiceNumber || `EDU-${String(nextAdminId(adminState.payments)).padStart(4, "0")}`, note: data.note });
  if (!editingId) adminState.payments.unshift(item);
  addAuditLog("payment created", "payment", item.invoiceNumber, "-", item.status);
}

function savePlan(data) {
  const item = editingId ? adminState.plans.find((plan) => plan.id === editingId) : { id: nextAdminId(adminState.plans), billingPeriod: "monthly" };
  Object.assign(item, { name: data.name, price: Number(data.price || 0), studentLimit: Number(data.studentLimit || 0), teacherLimit: Number(data.teacherLimit || 0), branchLimit: Number(data.branchLimit || 0), groupLimit: Number(data.groupLimit || 0), telegramEnabled: true, reportsEnabled: true, apiAccess: data.name === "Business", customDomainEnabled: data.name === "Business", supportLevel: data.supportLevel, status: data.status });
  if (!editingId) adminState.plans.push(item);
}

function saveAdminUser(data) {
  if (!validateEmail(data.email)) return showToast("Email format noto'g'ri.");
  if (adminState.adminUsers.some((user) => user.email === data.email && user.id !== editingId)) return showToast("Bu email bilan admin bor.");
  const owners = adminState.adminUsers.filter((user) => user.role === "OWNER" && user.status !== "blocked");
  const current = adminState.adminUsers.find((user) => user.id === editingId);
  if (current?.role === "OWNER" && owners.length === 1 && data.role !== "OWNER") return showToast("Yagona OWNER rolini o'zgartirib bo'lmaydi.");
  const item = editingId ? current : { id: nextAdminId(adminState.adminUsers), createdAt: new Date().toISOString().slice(0, 10), lastLogin: "-" };
  Object.assign(item, data);
  if (!editingId) adminState.adminUsers.unshift(item);
  addAuditLog("admin created", "admin", item.name, "-", item.role);
}

function saveTicket(data) {
  const center = adminState.centers.find((item) => item.id === Number(data.centerId));
  if (!center) return showToast("Avval o'quv markaz yarating.");
  const item = editingId ? adminState.supportTickets.find((ticket) => ticket.id === editingId) : { id: nextAdminId(adminState.supportTickets), createdAt: new Date().toISOString().slice(0, 10), history: [] };
  Object.assign(item, { centerId: center.id, centerName: center.name, subject: data.subject, category: data.category, priority: data.priority, status: data.status, assignedAdmin: "Support Manager" });
  if (data.note) item.history.unshift({ author: currentUser?.fullName || "Admin", text: data.note, date: new Date().toISOString() });
  if (!editingId) adminState.supportTickets.unshift(item);
}

function showCenterCreatedModal(center, data, centerPassword) {
  modalTitle.textContent = "Markaz yaratildi";
  modalForm.innerHTML = `<div class="success-box"><h3>${escapeHtml(center.name)}</h3><p>Login link: https://${escapeHtml(center.subdomain)}.eduka.uz</p>${data.createAdmin ? `<p>Admin login: ${escapeHtml(data.email)}</p><p>Parol: ${escapeHtml(centerPassword)}</p>` : ""}</div><div class="modal-actions"><button type="button" data-admin-action="open-tenant" data-id="${center.id}">Markazga kirish</button><button type="button" data-admin-action="profile" data-id="${center.id}">Markaz profilini ochish</button><button type="button" data-admin-action="new-center-reset">Yangi markaz yaratish</button></div>`;
  modal.hidden = false;
}

function createCenterLocally(data) {
  const plan = adminState.plans.find((item) => item.name === data.plan);
  const id = nextAdminId(adminState.centers);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + Number(data.trialDays || 7));
  const center = { id, name: data.name, subdomain: data.subdomain, owner: data.owner, phone: data.phone, email: data.email, address: data.address, plan: data.plan, status: data.status, subscriptionStatus: "trial", studentsCount: data.starterData ? 12 : 0, teachersCount: 0, groupsCount: 0, branchesCount: Number(data.branchLimit || 1), monthlyPayment: plan?.price || 0, registeredAt: new Date().toISOString().slice(0, 10), subscriptionEndsAt: endDate.toISOString().slice(0, 10), lastActivityAt: new Date().toISOString().slice(0, 10), supportNotes: [] };
  adminState.centers.unshift(center);
  adminState.subscriptions.unshift({ id: nextAdminId(adminState.subscriptions), centerId: id, centerName: center.name, plan: center.plan, price: center.monthlyPayment, startDate: center.registeredAt, endDate: center.subscriptionEndsAt, status: "trial", autoRenew: true, paymentStatus: "trial" });
  const centerPassword = data.autoPassword ? (data.adminPassword || "12345678") : (data.adminPassword || "12345678");
  if (data.createAdmin) adminState.adminUsers.unshift({ id: nextAdminId(adminState.adminUsers), name: data.owner, email: data.email, password: centerPassword, role: "CENTER_ADMIN", status: "active", lastLogin: "-", createdAt: center.registeredAt, twoFa: false, centerId: id, centerSubdomain: center.subdomain });
  addAuditLog("center created", "center", center.name, "-", center.status);
  saveAdminState();
  showCenterCreatedModal(center, data, centerPassword);
  return center;
}

async function handleCreateCenter(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  data.subdomain = slugify(data.subdomain);
  data.createAdmin = Boolean(data.createAdmin);
  data.autoPassword = Boolean(data.autoPassword);
  const error = !data.name ? "Markaz nomi required." : validateSubdomain(data.subdomain) || (!data.owner ? "Owner required." : "") || (!data.phone ? "Phone required." : "") || (!validateEmail(data.email) ? "Email format noto'g'ri." : "") || (!data.plan ? "Plan required." : "");
  form.querySelector("[data-admin-form-error]").textContent = error;
  if (error) return;
  try {
    const payload = await api("/api/admin/centers", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        monthlyPayment: adminState.plans.find((item) => item.name === data.plan)?.price || 0
      })
    });
    const dbCenter = payload.center || {};
    const center = {
      id: Number(dbCenter.id),
      name: dbCenter.name || data.name,
      subdomain: dbCenter.subdomain || data.subdomain,
      owner: dbCenter.owner || data.owner,
      phone: dbCenter.phone || data.phone,
      email: dbCenter.email || data.email,
      address: dbCenter.address || data.address,
      plan: dbCenter.plan || data.plan,
      status: dbCenter.status || data.status,
      subscriptionStatus: dbCenter.subscription_status || "trial",
      studentsCount: 0,
      teachersCount: 0,
      groupsCount: 0,
      branchesCount: Number(data.branchLimit || 1),
      monthlyPayment: Number(dbCenter.monthly_payment || adminState.plans.find((item) => item.name === data.plan)?.price || 0),
      registeredAt: String(dbCenter.created_at || new Date().toISOString()).slice(0, 10),
      subscriptionEndsAt: String(dbCenter.license_expires_at || dbCenter.trial_ends_at || "").slice(0, 10),
      lastActivityAt: new Date().toISOString().slice(0, 10),
      supportNotes: []
    };
    adminState.centers = adminState.centers.filter((item) => String(item.id) !== String(center.id) && item.subdomain !== center.subdomain);
    adminState.centers.unshift(center);
    adminState.subscriptions = adminState.subscriptions.filter((item) => String(item.centerId) !== String(center.id));
    adminState.subscriptions.unshift({ id: nextAdminId(adminState.subscriptions), centerId: center.id, centerName: center.name, plan: center.plan, price: center.monthlyPayment, startDate: center.registeredAt, endDate: center.subscriptionEndsAt, status: "trial", autoRenew: true, paymentStatus: "trial" });
    const centerPassword = payload.password || data.adminPassword || "12345678";
    if (data.createAdmin && !adminState.adminUsers.some((user) => user.email.toLowerCase() === data.email.toLowerCase())) {
      adminState.adminUsers.unshift({ id: nextAdminId(adminState.adminUsers), name: data.owner, email: data.email, password: centerPassword, role: "CENTER_ADMIN", status: "active", lastLogin: "-", createdAt: center.registeredAt, twoFa: false, centerId: center.id, centerSubdomain: center.subdomain });
    }
    addAuditLog("center created", "center", center.name, "-", center.status);
    saveAdminState();
    showCenterCreatedModal(center, data, centerPassword);
  } catch (error) {
    if (/DATABASE_URL|pg dependency/i.test(error.message || "")) {
      createCenterLocally(data);
      return;
    }
    form.querySelector("[data-admin-form-error]").textContent = error.message || "Markaz yaratib bo'lmadi.";
    showToast(error.message || "Markaz yaratib bo'lmadi.");
  }
}

function updateAdminState(action, id, value = null) {
  const center = adminState.centers.find((item) => item.id === Number(id));
  if (action === "toggle-center" && center) {
    const old = center.status;
    center.status = center.status === "blocked" ? "active" : "blocked";
    addAuditLog(center.status === "blocked" ? "center blocked" : "center unblocked", "center", center.name, old, center.status);
  }
  if (action === "subscription-status") {
    const sub = adminState.subscriptions.find((item) => item.id === Number(id));
    if (sub) {
      sub.status = value;
      addAuditLog("subscription status changed", "subscription", sub.centerName, "-", value);
    }
  }
  if (action === "mark-paid") {
    const payment = adminState.payments.find((item) => item.id === Number(id));
    if (payment) {
      payment.status = "paid";
      addAuditLog("payment marked paid", "payment", payment.invoiceNumber, "-", "paid");
    }
  }
  if (action === "delete-payment") {
    if (!window.confirm("To'lovni o'chirishni tasdiqlaysizmi?")) return;
    adminState.payments = adminState.payments.filter((item) => item.id !== Number(id));
  }
  if (action === "toggle-plan") {
    const plan = adminState.plans.find((item) => item.id === Number(id));
    if (plan) {
      plan.status = plan.status === "active" ? "inactive" : "active";
      addAuditLog("plan status changed", "plan", plan.name, "-", plan.status);
    }
  }
  if (action === "delete-plan") {
    const plan = adminState.plans.find((item) => item.id === Number(id));
    if (adminState.centers.some((item) => item.plan === plan?.name)) return showToast("Bu plan ishlatilmoqda, delete bloklandi.");
    if (!window.confirm("Tarifni o'chirishni tasdiqlaysizmi?")) return;
    adminState.plans = adminState.plans.filter((item) => item.id !== Number(id));
    addAuditLog("plan deleted", "plan", plan?.name, "active", "deleted");
  }
  if (action === "demo-status") {
    const req = adminState.demoRequests.find((item) => item.id === Number(id));
    if (req) {
      req.status = value;
      addAuditLog("request status changed", "request", req.centerName, "-", value);
    }
  }
  if (action === "delete-demo") {
    if (!window.confirm("So'rovni o'chirishni tasdiqlaysizmi?")) return;
    adminState.demoRequests = adminState.demoRequests.filter((item) => item.id !== Number(id));
  }
  if (action === "ticket-status") {
    const ticket = adminState.supportTickets.find((item) => item.id === Number(id));
    if (ticket) {
      ticket.status = value;
      if (value === "CLOSED") addAuditLog("support ticket closed", "ticket", ticket.subject, "-", value);
    }
  }
  if (action === "toggle-admin-user") {
    const user = adminState.adminUsers.find((item) => item.id === Number(id));
    const owners = adminState.adminUsers.filter((item) => item.role === "OWNER" && item.status !== "blocked");
    if (user?.role === "OWNER" && owners.length === 1) return showToast("Yagona OWNER bloklanmaydi.");
    if (user) {
      user.status = user.status === "blocked" ? "active" : "blocked";
      addAuditLog("admin status changed", "admin", user.email, "-", user.status);
    }
  }
  if (action === "reset-center-password" && center) addAuditLog("center password reset", "center", center.name, "-", "sent");
  if (action === "reset-admin-password") {
    const user = adminState.adminUsers.find((item) => item.id === Number(id));
    if (user) addAuditLog("admin password reset", "admin", user.email, "-", "sent");
  }
  if (action === "toggle-2fa") {
    const user = adminState.adminUsers.find((item) => item.id === Number(id));
    if (user) {
      user.twoFa = !user.twoFa;
      addAuditLog("admin 2fa changed", "admin", user.email, "-", user.twoFa ? "enabled" : "disabled");
    }
  }
  if (action === "create-invoice") {
    const sub = adminState.subscriptions.find((item) => item.id === Number(id));
    if (sub) addAuditLog("invoice created", "subscription", sub.centerName, "-", sub.plan);
  }
  if (action === "download-invoice") showToast("Invoice tayyorlandi.");
  if (action === "export-audit") showToast("Audit export tayyorlandi.");
  if (action === "tenant-check") showToast("Tenant routing tekshirildi.");
  saveAdminState();
  renderAdminView(viewFromPath());
}

const crmCollections = ["students", "groups", "teachers", "courses", "payments", "attendance", "debts", "schedule", "leads", "rooms", "paymentTypes", "staffAttendance"];
const crmListState = { students: {}, groups: {}, teachers: {} };
const crmDrawerState = { open: false, type: "", itemId: null, dirty: false, prefill: null };

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function loadCrmLocalState() {
  if (!allowDevelopmentFallback()) return {};
  try {
    const saved = JSON.parse(localStorage.getItem(tenantDataStorageKey()) || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    localStorage.removeItem(tenantDataStorageKey());
    return {};
  }
}

function syncCrmLocalState() {
  const saved = loadCrmLocalState();
  crmCollections.forEach((key) => {
    if (currentTenant?.subdomain && !stateMeta[key] && Array.isArray(saved[key])) state[key] = saved[key];
    else if (Array.isArray(saved[key]) && saved[key].length) state[key] = saved[key];
  });
}

function persistCrmCollections() {
  if (!allowDevelopmentFallback()) return;
  const payload = {};
  crmCollections.forEach((key) => {
    payload[key] = state[key] || [];
  });
  localStorage.setItem(tenantDataStorageKey(), JSON.stringify(payload));
}

function nextCrmId(resource) {
  return Math.max(0, ...(state[resource] || []).map((item) => Number(item.id) || 0)) + 1;
}

function crmCenterTitle() {
  return currentUser?.organization?.name || centerName?.textContent || "ALOO ACADEMY";
}

function isAppCrmRoute(viewName = viewFromPath()) {
  return centerAdminViews.has(viewName) && !superViews.has(viewName) && !adminViews.has(viewName);
}

function ensureCrmShell() {
  const content = document.querySelector(".content");
  if (content && !document.getElementById("teacher-profile")) {
    content.insertAdjacentHTML("beforeend", '<section class="view" id="teacher-profile"><div class="profile-page" data-teacher-profile></div></section>');
  }
  if (!document.querySelector("[data-crm-drawer]")) {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="crm-drawer-backdrop" data-crm-drawer-backdrop></div>
      <aside class="crm-drawer" data-crm-drawer aria-hidden="true"><form data-crm-drawer-form></form></aside>`);
  }
  const topbar = document.querySelector(".topbar");
  if (topbar && !document.querySelector("[data-crm-topbar-tools]")) {
    topbar.insertAdjacentHTML("beforeend", `
      <div class="crm-topbar-popovers" data-crm-topbar-tools hidden>
        <div class="crm-popover crm-quick-panel" data-crm-panel="quick" hidden></div>
        <div class="crm-popover crm-notification-panel" data-crm-panel="notifications" hidden></div>
        <div class="crm-popover crm-task-panel" data-crm-panel="tasks" hidden></div>
        <div class="crm-popover crm-avatar-menu" data-crm-panel="avatar" data-crm-avatar-menu hidden></div>
      </div>`);
  }
}

function renderCrmTopbar(viewName = viewFromPath()) {
  ensureCrmShell();
  const inApp = isAppCrmRoute(viewName) && !isPlatformPath();
  document.body.classList.toggle("crm-app-mode", inApp);
  const tools = document.querySelector("[data-crm-topbar-tools]");
  if (tools) tools.hidden = !inApp;
  const search = document.querySelector("[data-global-search]");
  if (search && inApp) search.placeholder = "Qidirish";
  const title = document.querySelector(".center-name");
  if (title && inApp) title.textContent = crmCenterTitle();
  const profileButton = document.querySelector('[data-crm-action="avatar-menu"] span');
  if (profileButton && inApp) profileButton.textContent = (currentUser?.fullName || currentTenant?.centerName || "Profil").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  renderCrmTopbarPanels();
}

function renderCrmTopbarPanels() {
  const quick = document.querySelector('[data-crm-panel="quick"]');
  if (quick) {
    const items = [
      ["schedule", "Dars jadvali", "calendar-days"],
      ["rooms", "Xonalar", "door-open"],
      ["finance-cash", "Kassa", "wallet"],
      ["teacher-attendance", "Xodimlar davomati", "user-round-check"],
      ["leads", "Lidlar", "kanban"],
      ["reports", "Hisobotlar", "bar-chart-3"],
      ["groups", "Guruhlar", "layers"],
      ["courses", "Kurslar", "book-open"],
      ["payment-types", "To'lov turlari", "credit-card"],
      ["student-app-dashboard", "Student App", "smartphone"],
      ["attendance", "Davomat", "clipboard-check"]
    ];
    quick.innerHTML = `<header><strong>Tezkor menyu</strong><span>Eng ko'p ishlatiladigan bo'limlar</span></header><div>${items.map(([view, label, icon]) => `<button type="button" data-view="${view}"><i data-lucide="${icon}"></i><span>${label}</span></button>`).join("")}</div>`;
  }
  const notifications = document.querySelector('[data-crm-panel="notifications"]');
  if (notifications) {
    const apiNotifications = Array.isArray(state.notifications) ? state.notifications.slice(0, 8) : [];
    const debts = debtItems().slice(0, 2);
    const latestLead = (state.leads || [])[0];
    const fallback = [
      latestLead ? { title: "Yangi lid", body: `${latestLead.full_name || latestLead.name} - ${latestLead.phone || ""}`, type: "info" } : { title: "Leadlar", body: "Yangi murojaatlar shu yerda ko'rinadi", type: "info" },
      debts[0] ? { title: "Qarzdorlik eslatmasi", body: `${debts[0].full_name || debts[0].fullName}: ${formatMoney(debts[0].balance || debts[0].remaining_debt)}`, type: "warning" } : { title: "Qarzdorlik", body: "Bugun muhim qarzdorlik yo'q", type: "success" },
      { title: "Bugungi dars", body: `${(state.schedule || []).length || (state.groups || []).length} ta dars rejalashtirilgan`, type: "info" },
      { title: "To'lov", body: `${formatMoney((state.payments || []).reduce((sum, item) => sum + Number(item.amount || item.paid_amount || 0), 0))} qabul qilingan`, type: "success" }
    ];
    const list = apiNotifications.length ? apiNotifications : fallback;
    const iconByType = { success: "check-circle-2", error: "x-circle", warning: "triangle-alert", info: "info", default: "bell" };
    notifications.innerHTML = `<header><strong>Bildirishnomalar</strong><button type="button" data-crm-action="mark-notifications">Hammasini o'qildi</button></header>${list.map((item) => `<article class="crm-alert-row ${escapeHtml(item.type || 'info')}"><i data-lucide="${iconByType[item.type] || iconByType.default}"></i><div><b>${escapeHtml(item.title || 'Bildirishnoma')}</b><span>${escapeHtml(item.body || item.message || '')}</span></div></article>`).join("")}`;
  }
  const tasks = document.querySelector('[data-crm-panel="tasks"]');
  if (tasks) {
    const lessons = (state.schedule || []).slice(0, 4);
    const fallback = lessons.length ? lessons : (state.groups || []).slice(0, 4).map((group) => ({ group_name: group.name, teacher_name: group.teacher_full_name || group.teacher_name, lesson_at: `${new Date().toISOString().slice(0, 10)}T${group.start_time || group.startTime || "09:00"}` }));
    tasks.innerHTML = `<header><strong>Bugungi vazifalar</strong><span>${new Date().toISOString().slice(0, 10)}</span></header>${fallback.map((lesson) => `<article><i data-lucide="clock-3"></i><div><b>${escapeHtml(String(lesson.lesson_at || "").slice(11, 16) || "09:00")}</b><span>${escapeHtml(lesson.group_name || crmGroupName(lesson.group_id))} / ${escapeHtml(lesson.teacher_name || "-")}</span></div></article>`).join("") || `<article><i data-lucide="sparkles"></i><div><b>Vazifa yo'q</b><span>Bugun uchun jadval bo'sh.</span></div></article>`}`;
  }
  const avatar = document.querySelector('[data-crm-panel="avatar"]');
  if (avatar) {
    avatar.innerHTML = `<div class="crm-profile-card"><b>${escapeHtml(currentUser?.fullName || currentUser?.full_name || "Eduka admin")}</b><span>${escapeHtml(currentUser?.role || "CENTER_ADMIN")} / ${escapeHtml(crmCenterTitle())}</span></div><button type="button" data-crm-action="profile-toast">Profil</button><button type="button" data-view="settings">Sozlamalar</button><button type="button" data-view="subscription">Tarif / Obuna</button><button type="button" data-crm-action="contact-support">Support</button><button type="button" data-logout>Chiqish</button>`;
  }
}

function closeCrmPanels(except = "") {
  document.querySelectorAll("[data-crm-panel]").forEach((panel) => {
    panel.hidden = !except || panel.dataset.crmPanel !== except;
  });
}

function toggleCrmPanel(name) {
  document.querySelectorAll("[data-crm-panel]").forEach((panel) => {
    if (panel.dataset.crmPanel === name) panel.hidden = !panel.hidden;
    else panel.hidden = true;
  });
}

function globalSearchItems(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return [];
  const sources = [
    ["students", "Talaba", "students", state.students, (item) => `${item.full_name || item.fullName} ${item.phone || ""} ${item.group_name || ""}`],
    ["groups", "Guruh", "groups", state.groups, (item) => `${item.name || ""} ${item.course_name || item.course || ""} ${item.teacher_name || ""}`],
    ["teachers", "O'qituvchi", "teachers", state.teachers, (item) => `${item.full_name || item.fullName} ${item.phone || ""} ${item.course_name || item.course || ""}`],
    ["leads", "Lid", "leads", state.leads, (item) => `${item.full_name || item.name || ""} ${item.phone || ""} ${item.course_name || ""}`],
    ["payments", "To'lov", "finance", state.payments, (item) => `${item.student_name || ""} ${item.group_name || ""} ${item.payment_type || ""}`]
  ];
  return sources.flatMap(([resource, label, view, items, text]) => (items || []).filter((item) => text(item).toLowerCase().includes(q)).slice(0, 4).map((item) => ({
    resource,
    label,
    view,
    id: item.id,
    title: item.full_name || item.fullName || item.name || item.student_name || item.group_name || label,
    subtitle: item.phone || item.course_name || item.group_name || item.payment_type || ""
  }))).slice(0, 10);
}

function renderGlobalSearchResults() {
  const resultsNode = document.querySelector("[data-global-results]");
  const search = document.querySelector("[data-global-search]");
  if (!resultsNode || !search) return;
  const items = globalSearchItems(search.value);
  resultsNode.hidden = !search.value.trim();
  resultsNode.innerHTML = items.length
    ? items.map((item) => `<button type="button" data-global-result="${item.view}" data-resource="${item.resource}" data-id="${item.id}"><span>${escapeHtml(item.label)}</span><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.subtitle)}</small></button>`).join("")
    : `<div class="crm-search-empty">Natija topilmadi</div>`;
}

function crmGroupName(groupId, fallback = "") {
  const group = state.groups.find((item) => String(item.id) === String(groupId));
  return group?.name || fallback || "-";
}

function crmTeacherName(teacherId, fallback = "") {
  const teacher = state.teachers.find((item) => String(item.id) === String(teacherId));
  return teacher?.fullName || teacher?.full_name || fallback || "-";
}

function crmStudentGroups(student) {
  const ids = Array.isArray(student.groupIds) ? student.groupIds : [student.group_id].filter(Boolean);
  const names = ids.map((id) => crmGroupName(id)).filter((name) => name && name !== "-");
  if (student.group_name && !names.includes(student.group_name)) names.push(student.group_name);
  return names;
}

function crmGroupTeachers(group) {
  const ids = Array.isArray(group.teacherIds) ? group.teacherIds : [group.teacher_id].filter(Boolean);
  const names = ids.map((id) => crmTeacherName(id)).filter((name) => name && name !== "-");
  const fallback = group.teacher_full_name || group.teacher_name;
  if (fallback && !names.includes(fallback)) names.push(fallback);
  return names;
}

function crmTeacherGroups(teacher) {
  const ids = Array.isArray(teacher.groupIds) ? teacher.groupIds : [];
  const names = ids.map((id) => crmGroupName(id)).filter((name) => name && name !== "-");
  if (teacher.groups && !names.includes(teacher.groups)) names.push(teacher.groups);
  return names;
}

function crmFilterValue(resource, key) {
  return crmListState[resource]?.[key] || "";
}

function crmSelectOptions(values, selected, emptyLabel) {
  const unique = [...new Set(values.filter(Boolean))];
  return `<option value="">${emptyLabel}</option>${unique.map((value) => `<option value="${escapeHtml(value)}" ${String(value) === String(selected) ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}`;
}

function crmPill(items, empty = "-") {
  const list = Array.isArray(items) ? items : String(items || "").split(",").map((item) => item.trim()).filter(Boolean);
  return list.length ? list.map((item) => `<span class="crm-tag">${escapeHtml(item)}</span>`).join("") : `<span class="crm-muted">${empty}</span>`;
}

function crmActionMenu(resource, id) {
  const labels = {
    students: ["Ko'rish", "Tahrirlash", "To'lov qo'shish", "Guruhga biriktirish", "Xabar yuborish", "O'chirish"],
    groups: ["Ko'rish", "Tahrirlash", "Talaba qo'shish", "Davomat olish", "To'lovlarni ko'rish", "O'chirish"],
    teachers: ["Ko'rish", "Tahrirlash", "Guruhlarini ko'rish", "Dars jadvali", "Xabar yuborish", "O'chirish"],
    courses: ["Tahrirlash", "Faol/Nofaol", "O'chirish"],
    payments: ["Tahrirlash", "Chek", "Qarzdorlik", "O'chirish"],
    leads: ["Tahrirlash", "Status", "O'quvchiga aylantirish", "O'chirish"],
    rooms: ["Tahrirlash", "Jadvalni ko'rish", "O'chirish"],
    paymentTypes: ["Tahrirlash", "Faol/Nofaol", "O'chirish"]
  }[resource];
  const actions = {
    students: ["view", "edit", "payment", "assign-group", "message", "delete"],
    groups: ["view", "edit", "add-student", "attendance", "payments", "delete"],
    teachers: ["view", "edit", "groups", "schedule", "message", "delete"],
    courses: ["edit", "toggle-status", "delete"],
    payments: ["edit", "invoice", "debt", "delete"],
    leads: ["edit", "lead-status", "convert-lead", "delete"],
    rooms: ["edit", "schedule", "delete"],
    paymentTypes: ["edit", "toggle-payment-type", "delete"]
  }[resource];
  if (!labels || !actions) return "";
  return `<details class="crm-actions-menu">
    <summary aria-label="Amallar"><i data-lucide="more-horizontal"></i></summary>
    <div>${actions.map((action, index) => `<button type="button" data-crm-action="${action}" data-resource="${resource}" data-id="${id}">${labels[index]}</button>`).join("")}</div>
  </details>`;
}

function crmEmptyState(text, actionLabel = "", action = "") {
  return `<div class="crm-empty-state"><i data-lucide="inbox"></i><strong>${escapeHtml(text)}</strong>${actionLabel ? `<button type="button" class="crm-primary-button" ${action}>${escapeHtml(actionLabel)}</button>` : ""}</div>`;
}

function crmStatCard(label, value, icon, target, hint = "") {
  return `<button class="crm-stat-card" type="button" data-view="${target}"><i data-lucide="${icon}"></i><span>${escapeHtml(label)}</span><strong>${value}</strong><small>${escapeHtml(hint)}</small></button>`;
}

function crmMiniPanel(title, items, mapper, empty, actionTarget = "") {
  return `<section class="crm-panel"><div class="crm-panel-head"><h2>${escapeHtml(title)}</h2>${actionTarget ? `<button type="button" data-view="${actionTarget}">Ko'rish</button>` : ""}</div><div class="crm-mini-list">${items.length ? items.map(mapper).join("") : `<div class="crm-mini-empty">${escapeHtml(empty)}</div>`}</div></section>`;
}

const studentAppResourceConfig = {
  library: {
    title: "Kutubxona",
    backend: "library",
    stateKey: "library",
    columns: ["Nomi", "Turi", "Daraja", "Holat"],
    fields: [
      ["title", "Nomi", "text", true],
      ["type", "Turi", "select", true, ["book", "audio", "video", "podcast", "file"]],
      ["description", "Izoh", "textarea"],
      ["level", "Daraja", "text"],
      ["external_url", "Havola", "url"],
      ["cover_url", "Muqova URL", "url"],
      ["status", "Holat", "select", true, ["published", "draft"]]
    ],
    row: (item) => [item.title, item.type, item.level || "-", item.status]
  },
  dictionary: {
    title: "Lug'atlar",
    backend: "dictionary",
    stateKey: "dictionary",
    columns: ["So'z", "Tarjima", "Daraja", "Holat"],
    fields: [
      ["word", "So'z", "text", true],
      ["translation", "Tarjima", "text", true],
      ["pronunciation", "Talaffuz", "text"],
      ["example", "Misol", "textarea"],
      ["category", "Kategoriya", "text"],
      ["level", "Daraja", "text"],
      ["status", "Holat", "select", true, ["published", "draft"]]
    ],
    row: (item) => [item.word, item.translation, item.level || "-", item.status]
  },
  news: {
    title: "Yangiliklar",
    backend: "news",
    stateKey: "news",
    columns: ["Sarlavha", "Sana", "Target", "Holat"],
    fields: [
      ["title", "Sarlavha", "text", true],
      ["description", "Matn", "textarea"],
      ["image_url", "Rasm URL", "url"],
      ["publish_date", "Chop etish sanasi", "date"],
      ["target_type", "Target", "select", true, ["all", "group"]],
      ["status", "Holat", "select", true, ["published", "draft"]]
    ],
    row: (item) => [item.title, formatDate(item.publish_date), item.target_type || "all", item.status]
  },
  events: {
    title: "Tadbirlar",
    backend: "events",
    stateKey: "events",
    columns: ["Nomi", "Sana", "Vaqt", "Holat"],
    fields: [
      ["title", "Nomi", "text", true],
      ["description", "Izoh", "textarea"],
      ["image_url", "Rasm URL", "url"],
      ["event_date", "Tadbir sanasi", "date"],
      ["event_time", "Vaqt", "time"],
      ["registration_enabled", "Ro'yxatdan o'tish", "checkbox"],
      ["status", "Holat", "select", true, ["active", "draft", "closed"]]
    ],
    row: (item) => [item.title, formatDate(item.event_date), item.event_time || "-", item.status]
  },
  referrals: {
    title: "Referral",
    backend: "referrals",
    stateKey: "referrals",
    columns: ["Taklif qiluvchi", "Taklif qilingan", "Telefon", "Mukofot"],
    fields: [
      ["referrer_student_id", "Taklif qiluvchi student ID", "number", true],
      ["referred_name", "Taklif qilingan FISH", "text", true],
      ["referred_phone", "Telefon", "text"],
      ["status", "Holat", "select", true, ["new", "trial", "active", "rewarded"]],
      ["reward_type", "Mukofot turi", "select", true, ["crystal", "coin"]],
      ["reward_amount", "Mukofot miqdori", "number"]
    ],
    row: (item) => [item.referrer_name || item.referrer_student_id, item.referred_name, item.referred_phone || "-", `${item.reward_amount || 0} ${item.reward_type || ""}`]
  },
  "extra-lessons": {
    title: "Qo'shimcha dars",
    backend: "extra-lessons",
    stateKey: "extraLessons",
    columns: ["Student", "Sana", "Vaqt", "Holat"],
    fields: [
      ["student_id", "Student ID", "number", true],
      ["teacher_id", "O'qituvchi ID", "number"],
      ["requested_date", "Sana", "date"],
      ["requested_time", "Vaqt", "time"],
      ["purpose", "Maqsad", "textarea"],
      ["price", "Narx", "number"],
      ["status", "Holat", "select", true, ["pending", "approved", "rejected", "done"]],
      ["admin_note", "Admin izohi", "textarea"]
    ],
    row: (item) => [item.student_name || item.student_id, formatDate(item.requested_date), item.requested_time || "-", item.status]
  },
  exams: {
    title: "Imtihonlar",
    backend: "exams",
    stateKey: "exams",
    columns: ["Student", "Imtihon", "Ball", "Sana"],
    fields: [
      ["student_id", "Student ID", "number", true],
      ["title", "Imtihon nomi", "text", true],
      ["score", "Ball", "number"],
      ["max_score", "Maksimal ball", "number"],
      ["grade", "Baho", "text"],
      ["exam_date", "Sana", "date"],
      ["status", "Holat", "select", true, ["published", "draft"]]
    ],
    row: (item) => [item.student_name || item.student_id, item.title, `${item.score || 0}/${item.max_score || 100}`, formatDate(item.exam_date)]
  },
  feedback: {
    title: "Taklif va shikoyatlar",
    backend: "feedback",
    stateKey: "feedback",
    columns: ["Student", "Turi", "Mavzu", "Holat"],
    fields: [
      ["student_id", "Student ID", "number", true],
      ["type", "Turi", "select", true, ["suggestion", "question", "complaint"]],
      ["subject", "Mavzu", "text"],
      ["message", "Xabar", "textarea", true],
      ["status", "Holat", "select", true, ["new", "in_progress", "closed"]],
      ["admin_reply", "Javob", "textarea"]
    ],
    row: (item) => [item.student_name || item.student_id, item.type, item.subject || "-", item.status]
  }
};

function studentAppStatusBadge(value) {
  const normalized = String(value ?? "").toLowerCase();
  const label = {
    true: "Yoqilgan",
    false: "O'chirilgan",
    set: "Parol bor",
    temporary_last4: "Oxirgi 4 raqam",
    reset_required: "Reset kerak",
    published: "Chop etilgan",
    draft: "Qoralama",
    active: "Faol",
    pending: "Kutilmoqda",
    approved: "Tasdiqlandi",
    rejected: "Rad etildi",
    closed: "Yopildi",
    new: "Yangi"
  }[normalized] || value || "-";
  const type = ["true", "set", "published", "active", "approved"].includes(normalized) ? "success" : ["false", "rejected", "closed"].includes(normalized) ? "danger" : "warning";
  return `<span class="crm-badge badge-${type}">${escapeHtml(label)}</span>`;
}

function studentAppCard(label, value, icon, hint = "") {
  return `<article class="student-app-kpi"><i data-lucide="${icon}"></i><span>${escapeHtml(label)}</span><strong>${Number(value || 0).toLocaleString("uz-UZ")}</strong><small>${escapeHtml(hint)}</small></article>`;
}

function studentAppPageShell(view, title, description, action = "") {
  const node = document.querySelector(`[data-student-app-page="${view}"]`);
  if (!node) return null;
  node.innerHTML = `<header class="student-app-admin-head"><div><span>Sozlamalar / Student App</span><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>${action}</header><div data-student-app-body></div>`;
  return node.querySelector("[data-student-app-body]");
}

function renderStudentAppDashboard() {
  const summary = state.studentApp.dashboard || {};
  const status = state.studentApp.telegramStatus || {};
  const webhook = state.studentApp.webhookInfo || {};
  const body = studentAppPageShell(
    "student-app-dashboard",
    "Student App boshqaruvi",
    "O'quvchilar Telegram orqali kirishi, mobil kabinet modullari va bot holatini shu yerdan boshqaring.",
    `<button type="button" class="crm-primary-button" data-student-app-action="preview">Student App preview</button>`
  );
  if (!body) return;
  body.innerHTML = `
    <section class="student-app-kpi-grid">
      ${studentAppCard("Student App yoqilgan", summary.enabled_students, "smartphone", "O'quvchilar")}
      ${studentAppCard("Telegram ulangan", summary.telegram_linked, "send", "Bog'langanlar")}
      ${studentAppCard("Bugun kirganlar", summary.today_logins, "calendar-check", "Bugungi login")}
      ${studentAppCard("Faol sessiyalar", summary.active_sessions, "key-round", "Tokenlar")}
      ${studentAppCard("Referral soni", summary.referrals, "gift", "Takliflar")}
      ${studentAppCard("Kutubxona", summary.library_items, "library", "Materiallar")}
      ${studentAppCard("Lug'at", summary.dictionary_words, "book-open", "So'zlar")}
      ${studentAppCard("Qo'shimcha dars", summary.extra_lesson_requests, "graduation-cap", "Kutilmoqda")}
    </section>
    <section class="student-app-admin-grid">
      <article class="student-app-status-card">
        <h2>Bot holati</h2>
        <div><span>Landing bot</span>${studentAppStatusBadge(Boolean(status.landingBotConfigured))}</div>
        <div><span>Landing chat</span>${studentAppStatusBadge(Boolean(status.landingChatConfigured))}</div>
        <div><span>Student bot</span>${studentAppStatusBadge(Boolean(status.studentBotConfigured))}</div>
        <div><span>WebApp URL</span>${studentAppStatusBadge(Boolean(status.studentWebAppUrlConfigured))}</div>
        <div><span>Webhook secret</span>${studentAppStatusBadge(Boolean(status.webhookSecretConfigured))}</div>
        <small>${escapeHtml(status.studentWebAppUrl || "https://eduka.uz/student-app")}</small>
      </article>
      <article class="student-app-status-card">
        <h2>Webhook</h2>
        <div><span>URL</span><b>${escapeHtml(webhook.url || "Sozlanmagan")}</b></div>
        <div><span>Pending updates</span><b>${Number(webhook.pending_update_count || 0)}</b></div>
        <div><span>Oxirgi xato</span><b>${escapeHtml(webhook.last_error_message || "Yo'q")}</b></div>
        <button type="button" data-student-app-action="open-webhook-doc">Webhook ko'rsatmasi</button>
      </article>
    </section>
    <section class="student-app-admin-grid">
      ${studentAppMiniList("Oxirgi kirganlar", state.studentApp.latestLogins, (item) => `${item.full_name || "-"} <small>${formatDate(item.last_student_app_login)}</small>`)}
      ${studentAppMiniList("Oxirgi referral", state.studentApp.latestReferrals, (item) => `${item.referred_name || "-"} <small>${item.status || "new"}</small>`)}
      ${studentAppMiniList("Oxirgi feedback", state.studentApp.latestFeedback, (item) => `${item.student_name || item.subject || "-"} <small>${item.status || "new"}</small>`)}
    </section>`;
}

function studentAppMiniList(title, items, mapper) {
  return `<article class="crm-panel"><div class="crm-panel-head"><h2>${escapeHtml(title)}</h2></div><div class="student-app-mini-list">${items?.length ? items.map((item) => `<div>${mapper(item)}</div>`).join("") : `<div class="crm-mini-empty">Hozircha ma'lumot yo'q</div>`}</div></article>`;
}

function renderStudentAppAccess() {
  const body = studentAppPageShell("student-app-access", "O'quvchilar kirishi", "Telegram bot orqali Student Appga kiradigan o'quvchilar paroli va access holatini boshqaring.");
  if (!body) return;
  const rows = (state.studentApp.access || []).map((student) => `
    <tr>
      <td><b>${escapeHtml(student.full_name)}</b><small>${escapeHtml(student.course_name || "")}</small></td>
      <td>${escapeHtml(student.phone || "-")}</td>
      <td>${escapeHtml(student.group_name || "-")}</td>
      <td>${studentAppStatusBadge(Boolean(student.student_app_enabled) && !student.student_app_blocked)}</td>
      <td>${studentAppStatusBadge(Boolean(student.telegram_chat_id))}</td>
      <td>${formatDate(student.last_student_app_login) || "-"}</td>
      <td>${studentAppStatusBadge(student.password_state)}</td>
      <td>
        <div class="student-app-actions">
          <button type="button" data-student-app-action="${student.student_app_enabled ? "disable-access" : "enable-access"}" data-id="${student.id}">${student.student_app_enabled ? "O'chirish" : "Yoqish"}</button>
          <button type="button" data-student-app-action="generate-password" data-id="${student.id}">Parol</button>
          <button type="button" data-student-app-action="reset-password" data-id="${student.id}">Reset</button>
          <button type="button" data-student-app-action="instruction" data-id="${student.id}">Instruksiya</button>
          <button type="button" data-student-app-action="send-instruction" data-id="${student.id}">Telegram</button>
          <button type="button" data-student-app-action="unlink-telegram" data-id="${student.id}">Unlink</button>
        </div>
      </td>
    </tr>`).join("");
  body.innerHTML = `<section class="crm-table-card"><table class="crm-table student-app-table"><thead><tr><th>FISH</th><th>Telefon</th><th>Guruh</th><th>Student App</th><th>Telegram</th><th>Oxirgi kirish</th><th>Parol</th><th>Harakatlar</th></tr></thead><tbody>${rows || `<tr><td colspan="8">${crmEmptyState("O'quvchilar topilmadi")}</td></tr>`}</tbody></table></section>`;
}

function renderStudentAppModules() {
  const body = studentAppPageShell("student-app-modules", "Modullar", "Student App ichida ko'rinadigan foydali bo'limlarni yoqing, o'chiring va tartiblang.");
  if (!body) return;
  body.innerHTML = `<section class="student-app-module-grid">${(state.studentApp.modules || []).map((module) => `
    <article class="student-app-module-card">
      <div><i>${escapeHtml(module.icon || "App")}</i><h2>${escapeHtml(module.title)}</h2><p>${escapeHtml(module.description || "")}</p></div>
      <button type="button" class="crm-toggle ${module.enabled ? "active" : ""}" data-student-app-action="toggle-module" data-id="${module.id}"><span></span></button>
    </article>`).join("") || crmEmptyState("Modullar topilmadi")}</section>`;
}

function renderStudentAppResource(resource) {
  const config = studentAppResourceConfig[resource];
  if (!config) return;
  const view = `student-app-${resource}`;
  const body = studentAppPageShell(view, config.title, `${config.title} bo'limini Student App uchun boshqaring.`, `<button type="button" class="crm-primary-button" data-student-app-action="add-resource" data-resource="${resource}">Qo'shish</button>`);
  if (!body) return;
  const items = state.studentApp[config.stateKey] || [];
  body.innerHTML = `<section class="crm-table-card"><table class="crm-table student-app-table"><thead><tr>${config.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}<th>Harakatlar</th></tr></thead><tbody>${items.length ? items.map((item) => `<tr>${config.row(item).map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}<td><div class="student-app-actions"><button type="button" data-student-app-action="edit-resource" data-resource="${resource}" data-id="${item.id}">Tahrirlash</button><button type="button" data-student-app-action="delete-resource" data-resource="${resource}" data-id="${item.id}">O'chirish</button></div></td></tr>`).join("") : `<tr><td colspan="${config.columns.length + 1}">${crmEmptyState("Hozircha ma'lumot yo'q", "Qo'shish", `data-student-app-action="add-resource" data-resource="${resource}"`)}</td></tr>`}</tbody></table></section>`;
}

function renderStudentAppSettings() {
  const settings = state.studentApp.settings || {};
  const body = studentAppPageShell("student-app-settings", "Student App sozlamalari", "Mobil kabinet nomi, ranglari, modul ruxsatlari va sessiya muddatini sozlang.", `<button type="button" class="crm-primary-button" data-student-app-action="save-settings">Saqlash</button>`);
  if (!body) return;
  const toggles = [
    ["enabled", "Student App faol"],
    ["crystals_enabled", "Kristallar"],
    ["coins_enabled", "Tangalar"],
    ["rating_enabled", "Reyting"],
    ["referral_enabled", "Referral"],
    ["library_enabled", "Kutubxona"],
    ["dictionary_enabled", "Lug'at"],
    ["extra_lessons_enabled", "Qo'shimcha dars"],
    ["exams_enabled", "Imtihonlar"],
    ["news_enabled", "Yangiliklar"],
    ["payments_enabled", "To'lovlar"],
    ["complaints_enabled", "Taklif va shikoyatlar"]
  ];
  body.innerHTML = `<section class="settings-panel student-app-settings-form" data-student-app-settings-form>
    <div class="settings-form">
      <label>App nomi<input name="app_name" value="${escapeHtml(settings.app_name || "Eduka Student App")}" /></label>
      <label>Asosiy rang<input name="theme_primary" type="color" value="${escapeHtml(settings.theme_primary || "#0A84FF")}" /></label>
      <label>Sessiya muddati (kun)<input name="session_days" type="number" min="1" value="${escapeHtml(settings.session_days || 30)}" /></label>
      <label>Support matni<textarea name="support_text">${escapeHtml(settings.support_text || "")}</textarea></label>
    </div>
    <div class="student-app-toggle-grid">${toggles.map(([key, label]) => `<label><span>${escapeHtml(label)}</span><input type="checkbox" name="${key}" ${settings[key] !== false ? "checked" : ""} /></label>`).join("")}</div>
  </section>`;
}

function renderStudentAppInfoPage(view, title, description, rows = []) {
  const body = studentAppPageShell(view, title, description, `<button type="button" class="crm-primary-button" data-crm-action="save-generated-settings">Saqlash</button>`);
  if (!body) return;
  body.innerHTML = `<section class="settings-panel"><div class="settings-form">${rows.map((row) => `<label>${escapeHtml(row)}<input value="" placeholder="Qiymat kiriting" /></label>`).join("")}</div><div class="toggle-list"><label><input type="checkbox" checked /><span>Student Appda ko'rsatilsin</span></label><label><input type="checkbox" /><span>Faqat aktiv o'quvchilar uchun</span></label></div></section>`;
}

function renderCrmStudentAppPages() {
  ensureStudentAppNavigation();
  ensureStudentAppViews();
  renderStudentAppDashboard();
  renderStudentAppAccess();
  renderStudentAppModules();
  ["library", "dictionary", "news", "events", "referrals", "extra-lessons", "exams", "feedback"].forEach(renderStudentAppResource);
  renderStudentAppInfoPage("student-app-academic-help", "Akademik yordam", "Support teacher, qo'shimcha izoh va o'quvchiga yordam sozlamalari.", ["Mas'ul o'qituvchi", "Javob berish vaqti", "Qo'llab-quvvatlash matni"]);
  renderStudentAppInfoPage("student-app-offers", "Takliflar", "Student App ichidagi maxsus takliflar, bonuslar va kampaniyalar.", ["Taklif nomi", "Bonus miqdori", "Amal qilish muddati"]);
  renderStudentAppSettings();
}

function studentAppFieldHtml(field, item = {}) {
  const [name, label, type = "text", required = false, options = []] = field;
  const value = item[name] ?? "";
  if (type === "textarea") {
    return `<label><span>${escapeHtml(label)}${required ? " *" : ""}</span><textarea name="${name}" ${required ? "required" : ""}>${escapeHtml(value)}</textarea></label>`;
  }
  if (type === "select") {
    return `<label><span>${escapeHtml(label)}${required ? " *" : ""}</span><select name="${name}" ${required ? "required" : ""}>${options.map((option) => `<option value="${escapeHtml(option)}" ${String(option) === String(value) ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></label>`;
  }
  if (type === "checkbox") {
    return `<label class="student-app-modal-check"><input type="checkbox" name="${name}" ${value === true || value === "true" ? "checked" : ""} /><span>${escapeHtml(label)}</span></label>`;
  }
  return `<label><span>${escapeHtml(label)}${required ? " *" : ""}</span><input name="${name}" type="${type}" value="${escapeHtml(value)}" ${required ? "required" : ""} /></label>`;
}

function openStudentAppResourceModal(resource, id = "") {
  const config = studentAppResourceConfig[resource];
  if (!config) return;
  const item = (state.studentApp[config.stateKey] || []).find((entry) => String(entry.id) === String(id)) || {};
  activeModal = "student-app-resource";
  editingId = item.id || null;
  modalTitle.textContent = editingId ? `${config.title}: tahrirlash` : `${config.title}: qo'shish`;
  modalForm.dataset.studentAppResource = resource;
  modalForm.innerHTML = `<div class="student-app-modal-grid">${config.fields.map((field) => studentAppFieldHtml(field, item)).join("")}</div><div class="modal-actions"><button type="button" data-close-modal>Bekor qilish</button><button type="submit">Saqlash</button></div>`;
  modal.hidden = false;
  modalForm.querySelector("[name]")?.focus();
}

async function handleStudentAppResourceSubmit() {
  const resource = modalForm.dataset.studentAppResource;
  const config = studentAppResourceConfig[resource];
  if (!config) return;
  const service = window.crmServices?.studentAppAdminService;
  const data = Object.fromEntries(new FormData(modalForm).entries());
  config.fields.forEach(([name, , type]) => {
    if (type === "checkbox") data[name] = Boolean(modalForm.querySelector(`[name="${name}"]`)?.checked);
  });
  try {
    if (editingId) await service.update(config.backend, editingId, data);
    else await service.create(config.backend, data);
    closeModal();
    await loadStudentAppAdminData();
    renderCrmStudentAppPages();
    showToast(editingId ? "Ma'lumot yangilandi." : "Ma'lumot yaratildi.", "success");
  } catch (error) {
    showToast(error.message, "error");
  }
}

function showStudentAppPasswordModal(studentId, password) {
  const student = (state.studentApp.access || []).find((item) => String(item.id) === String(studentId));
  activeModal = null;
  editingId = null;
  modalTitle.textContent = "Student App paroli";
  modalForm.innerHTML = `<div class="student-app-secret-box">
    <p>${escapeHtml(student?.full_name || "O'quvchi")} uchun parol yaratildi. Bu parol faqat bir marta ko'rsatiladi.</p>
    <strong>${escapeHtml(password)}</strong>
    <small>Telegram botga kiring, telefon raqamingizni yuboring va parolingizni kiriting.</small>
  </div>
  <div class="modal-actions">
    <button type="button" data-student-app-action="copy-password" data-password="${escapeHtml(password)}">Copy</button>
    <button type="button" data-close-modal>Yopish</button>
  </div>`;
  modal.hidden = false;
}

function showStudentAppInstructionModal(studentId) {
  const student = (state.studentApp.access || []).find((item) => String(item.id) === String(studentId));
  const instruction = "Telegram'da @edukauz_bot ga kiring, /start bosing, telefon raqamingizni yuboring va parolingizni kiriting.";
  activeModal = null;
  editingId = null;
  modalTitle.textContent = "Login instruktsiyasi";
  modalForm.innerHTML = `<div class="student-app-secret-box">
    <p><b>${escapeHtml(student?.full_name || "O'quvchi")}</b></p>
    <textarea readonly>${instruction}</textarea>
  </div>
  <div class="modal-actions">
    <button type="button" data-student-app-action="copy-instruction" data-instruction="${escapeHtml(instruction)}">Copy instruction</button>
    <button type="button" data-student-app-action="open-bot">Open bot link</button>
    <button type="button" data-close-modal>Yopish</button>
  </div>`;
  modal.hidden = false;
}

async function handleStudentAppAction(button) {
  const action = button.dataset.studentAppAction;
  const service = window.crmServices?.studentAppAdminService;
  if (action === "preview") {
    window.open("/student-app/home?preview=1", "_blank", "noopener,noreferrer");
    return;
  }
  if (action === "open-webhook-doc") {
    showToast("Webhook: node backend/set-telegram-webhook.js orqali STUDENT_BOT_TOKEN va TELEGRAM_WEBHOOK_SECRET bilan sozlanadi.", "info");
    return;
  }
  if (action === "open-bot") {
    window.open("https://t.me/edukauz_bot", "_blank", "noopener,noreferrer");
    return;
  }
  if (action === "copy-password" || action === "copy-instruction") {
    const value = button.dataset.password || button.dataset.instruction || "";
    await navigator.clipboard?.writeText(value).catch(() => {});
    showToast("Nusxalandi.", "success");
    return;
  }
  if (action === "instruction") {
    showStudentAppInstructionModal(button.dataset.id);
    return;
  }
  if (["enable-access", "disable-access", "generate-password", "reset-password", "unlink-telegram", "send-instruction"].includes(action)) {
    const apiAction = {
      "enable-access": "enable",
      "disable-access": "disable",
      "generate-password": "generate-password",
      "reset-password": "reset-password",
      "unlink-telegram": "unlink-telegram",
      "send-instruction": "send-instruction"
    }[action];
    try {
      const result = await service.accessAction(button.dataset.id, apiAction);
      await loadStudentAppAdminData();
      renderCrmStudentAppPages();
      if (result.password) showStudentAppPasswordModal(button.dataset.id, result.password);
      showToast(result.message || "Amal bajarildi.", result.ok === false ? "warning" : "success");
    } catch (error) {
      showToast(error.message, "error");
    }
    return;
  }
  if (action === "toggle-module") {
    const module = (state.studentApp.modules || []).find((item) => String(item.id) === String(button.dataset.id));
    if (!module) return;
    module.enabled = !module.enabled;
    try {
      state.studentApp.modules = await service.saveModules(state.studentApp.modules);
      renderStudentAppModules();
      showToast(module.enabled ? "Modul faollashtirildi." : "Modul o'chirildi.", module.enabled ? "success" : "warning");
    } catch (error) {
      module.enabled = !module.enabled;
      showToast(error.message, "error");
    }
    return;
  }
  if (action === "add-resource") {
    openStudentAppResourceModal(button.dataset.resource);
    return;
  }
  if (action === "edit-resource") {
    openStudentAppResourceModal(button.dataset.resource, button.dataset.id);
    return;
  }
  if (action === "delete-resource") {
    if (!window.confirm("Ma'lumotni o'chirishni tasdiqlaysizmi?")) return;
    const config = studentAppResourceConfig[button.dataset.resource];
    try {
      await service.remove(config.backend, button.dataset.id);
      await loadStudentAppAdminData();
      renderCrmStudentAppPages();
      showToast("Ma'lumot o'chirildi.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
    return;
  }
  if (action === "save-settings") {
    const form = document.querySelector("[data-student-app-settings-form]");
    if (!form) return;
    const data = Object.fromEntries(new FormData(form).entries());
    form.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      data[input.name] = input.checked;
    });
    try {
      const result = await service.saveSettings(data);
      state.studentApp.settings = result.settings || data;
      renderStudentAppSettings();
      showToast("Student App sozlamalari saqlandi.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }
}

function paymentRemainder(payment) {
  return Math.max(Number(payment.due_amount || payment.dueAmount || payment.amount || 0) - Number(payment.amount || payment.paid_amount || 0) - Number(payment.discount || 0), 0);
}

function debtItems() {
  const apiDebts = (state.debts || []).filter((item) => Number(item.balance || item.remaining_debt || 0) > 0);
  if (apiDebts.length) return apiDebts;
  return (state.students || []).filter((student) => Number(student.balance || 0) > 0).map((student) => ({
    ...student,
    full_name: student.full_name || student.fullName,
    parent_phone: student.parent_phone || student.parentPhone,
    group_name: student.group_name || crmStudentGroups(student)[0],
    balance: Number(student.balance || 0)
  }));
}

function filteredCrmStudents() {
  const filters = crmListState.students || {};
  return (state.students || []).filter((student) => {
    const name = student.fullName || student.full_name || "";
    const groups = crmStudentGroups(student).join(" ");
    const teacher = student.teacher || student.teacher_full_name || "";
    const tags = Array.isArray(student.tags) ? student.tags.join(" ") : student.tags || "";
    if (filters.name && !includesText(name, filters.name)) return false;
    if (filters.phone && !includesText(student.phone, filters.phone)) return false;
    if (filters.parentPhone && !includesText(student.parentPhone || student.parent_phone, filters.parentPhone)) return false;
    if (filters.group && !groups.includes(filters.group)) return false;
    if (filters.course && !includesText(student.course || student.course_name, filters.course)) return false;
    if (filters.teacher && !includesText(teacher, filters.teacher)) return false;
    if (filters.tags && !includesText(tags, filters.tags)) return false;
    if (filters.status && String(student.status || "active") !== filters.status) return false;
    return true;
  });
}

function filteredCrmGroups() {
  const filters = crmListState.groups || {};
  return (state.groups || []).filter((group) => {
    const teachers = crmGroupTeachers(group).join(" ");
    const price = String(group.price || group.monthly_price || "");
    const days = Array.isArray(group.lessonDays) ? group.lessonDays.join(" ") : group.days || "";
    if (filters.name && !includesText(group.name, filters.name)) return false;
    if (filters.price && !includesText(price, filters.price)) return false;
    if (filters.course && !includesText(group.course || group.course_name, filters.course)) return false;
    if (filters.teacher && !includesText(teachers, filters.teacher)) return false;
    if (filters.room && !includesText(group.room, filters.room)) return false;
    if (filters.days && !includesText(days, filters.days)) return false;
    if (filters.tags && !includesText(Array.isArray(group.tags) ? group.tags.join(" ") : group.tags, filters.tags)) return false;
    return true;
  });
}

function filteredCrmTeachers() {
  const filters = crmListState.teachers || {};
  return (state.teachers || []).filter((teacher) => {
    const groups = crmTeacherGroups(teacher).join(" ");
    if (filters.name && !includesText(teacher.fullName || teacher.full_name, filters.name)) return false;
    if (filters.phone && !includesText(teacher.phone, filters.phone)) return false;
    if (filters.salary && String(teacher.salaryType || teacher.salary_type || "") !== filters.salary) return false;
    if (filters.group && !includesText(groups, filters.group)) return false;
    return true;
  });
}


function crmTrendLine(items, labelKey = "month", valueKey = "amount") {
  const safeItems = Array.isArray(items) && items.length ? items.slice(0, 8) : [];
  const max = Math.max(1, ...safeItems.map((item) => Number(item[valueKey] || item.count || item.value || 0)));
  if (!safeItems.length) return `<div class="modern-empty">Grafik uchun real ma'lumot hali yo'q</div>`;
  return `<div class="crm-chart-lines">${safeItems.map((item) => {
    const value = Number(item[valueKey] || item.count || item.value || 0);
    const label = item[labelKey] || item.status || item.name || item.date || "-";
    return `<div class="crm-chart-line"><span>${escapeHtml(label)}</span><div class="crm-chart-track"><i style="width:${Math.max(8, Math.round((value / max) * 100))}%"></i></div><strong>${valueKey === "amount" ? formatMoney(value) : value.toLocaleString("uz-UZ")}</strong></div>`;
  }).join("")}</div>`;
}

function crmFunnel20(leads) {
  const statuses = [
    ["new", "Yangi lid"],
    ["contacted", "Bog'lanildi"],
    ["trial", "Sinov darsi"],
    ["paid", "To'lov qildi"],
    ["lost", "Rad etdi"]
  ];
  return `<div class="crm-funnel-20">${statuses.map(([key, label]) => {
    const count = (leads || []).filter((lead) => (lead.status || "new") === key).length;
    return `<div class="crm-funnel-step"><span>${label}</span><strong>${count}</strong></div>`;
  }).join("")}</div>`;
}

function crmActivity20() {
  const payments = (state.payments || []).slice(0, 3).map((item) => ({ icon: "💳", title: `${crmStudentName(item.student_id)} to'lov qildi`, sub: formatMoney(item.amount || item.paid_amount) }));
  const leads = (state.leads || []).slice(0, 3).map((item) => ({ icon: "🎯", title: item.full_name || item.name || "Yangi lead", sub: statusLabels[item.status] || item.status || "Yangi" }));
  const students = (state.students || []).slice(0, 3).map((item) => ({ icon: "🎓", title: item.full_name || item.fullName || "Talaba", sub: item.phone || "Profil" }));
  const items = [...payments, ...leads, ...students].slice(0, 7);
  if (!items.length) return `<div class="modern-empty">Oxirgi aktivlik hali yo'q</div>`;
  return `<div class="crm-activity-feed">${items.map((item) => `<article><i>${item.icon}</i><div><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.sub)}</span></div></article>`).join("")}</div>`;
}

function crmDashboard20Insights({ students, groups, leads, attendance, debtTotal, revenue, attendancePercent }) {
  const conversion = leads.length ? Math.round((leads.filter((lead) => ["paid", "active"].includes(lead.status)).length / leads.length) * 100) : 0;
  const avgGroup = groups.length ? Math.round(students.length / groups.length) : 0;
  const risk = debtTotal > 0 ? "Qarzdorlik nazorat talab qiladi" : "Qarzdorlik xavfi past";
  return `<div class="crm-insight-grid">
    <article class="crm-insight"><span>Lead conversion</span><strong>${conversion}%</strong><small>Sinovdan to'lovga o'tish</small></article>
    <article class="crm-insight"><span>Guruh sig'imi</span><strong>${avgGroup}</strong><small>O'rtacha talaba / guruh</small></article>
    <article class="crm-insight"><span>Risk holati</span><strong>${escapeHtml(risk)}</strong><small>${formatMoney(debtTotal)} qarzdorlik</small></article>
  </div>`;
}

function renderCrmDashboard() {
  const section = document.getElementById("dashboard");
  if (!section || !isAppCrmRoute("dashboard")) return;
  const students = state.students || [];
  const groups = state.groups || [];
  const teachers = state.teachers || [];
  const payments = state.payments || [];
  const leads = state.leads || [];
  const attendance = state.attendance || [];
  const revenue = payments.reduce((sum, item) => sum + Number(item.amount || item.paid_amount || 0), 0);
  const debts = debtItems();
  const debtTotal = debts.reduce((sum, item) => sum + Number(item.balance || item.remaining_debt || 0), 0);
  const present = attendance.filter((item) => ["present", "online"].includes(item.status)).length;
  const attendancePercent = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
  const today = new Date().toISOString().slice(0, 10);
  const todayLessons = (state.schedule || []).filter((item) => String(item.lesson_at || item.lesson_date || "").slice(0, 10) === today);
  const lessonsForToday = todayLessons.length ? todayLessons : (state.groups || []).slice(0, 6).map((group) => ({ group_id: group.id, group_name: group.name, teacher_name: group.teacher_full_name || group.teacher_name, lesson_at: `${today}T${group.start_time || group.startTime || "09:00"}`, room: group.room, student_count: group.student_count || group.studentCount || 0 }));
  const newStudents = students.slice(0, 5);
  const recentPayments = payments.slice(0, 5);
  section.innerHTML = `
    <div class="crm-dashboard">
      <div class="crm-hero">
        <div><span>${escapeHtml(crmCenterTitle())}</span><h1>CRM boshqaruv paneli</h1><p>O'quv markazingizning asosiy ko'rsatkichlari, talabalar statistikasi va umumiy faoliyatini bir ko'zda kuzating.</p></div>
        <div class="crm-hero-actions"><button type="button" class="crm-primary-button" data-crm-action="quick-add-student"><i data-lucide="user-plus"></i>Yangi talaba</button><button type="button" class="crm-soft-button" data-view="reports">Hisobot</button></div>
      </div>
      <div class="dashboard-filter-row"><select><option>2026</option><option>2025</option></select><select><option>May</option><option>Iyun</option><option>Iyul</option></select><button type="button" data-crm-action="center-menu">${escapeHtml(crmCenterTitle())}</button></div>
      <div class="crm-stat-grid">
        ${crmStatCard("Jami talabalar", students.length, "graduation-cap", "students", "ro'yxatni ochish")}
        ${crmStatCard("Faol guruhlar", groups.filter((g) => g.status !== "archived").length, "layers", "groups", "darslar nazorati")}
        ${crmStatCard("Bugungi darslar", lessonsForToday.length, "calendar-days", "schedule", "jadvalga o'tish")}
        ${crmStatCard("Oylik tushum", formatMoney(revenue), "wallet", "finance", "to'lovlar")}
        ${crmStatCard("Qarzdorlik", formatMoney(debtTotal), "badge-alert", "debtors", `${debts.length} talaba`)}
        ${crmStatCard("Yangi leadlar", leads.filter((l) => ["new", "contacted"].includes(l.status)).length, "kanban", "leads", "pipeline")}
        ${crmStatCard("Davomat foizi", `${attendancePercent}%`, "clipboard-check", "attendance", "saqlangan yozuvlar")}
        ${crmStatCard("O'qituvchilar", teachers.length, "user-check", "teachers", "jamoa")}
      </div>
      <div class="crm-dashboard-grid">
        ${crmMiniPanel("Bugungi darslar", lessonsForToday, (item) => `<article><b>${escapeHtml(item.group_name || crmGroupName(item.group_id, "Guruh"))}</b><span>${String(item.lesson_at || "").slice(11, 16) || item.start_time || "-"}</span><button type="button" data-view="attendance">Davomat</button></article>`, "Bugun darslar mavjud emas", "schedule")}
        ${crmMiniPanel("Oxirgi to'lovlar", recentPayments, (item) => `<article><b>${escapeHtml(item.student_name || crmStudentName(item.student_id))}</b><span>${formatMoney(item.amount || item.paid_amount)}</span><button type="button" data-view="finance">Batafsil</button></article>`, "Hali to'lovlar mavjud emas", "finance")}
        ${crmMiniPanel("Qarzdor talabalar", debts.slice(0, 5), (item) => `<article><b>${escapeHtml(item.full_name || item.fullName)}</b><span>${formatMoney(item.balance || item.remaining_debt)}</span><button type="button" data-view="debtors">Ko'rish</button></article>`, "Qarzdor talabalar yo'q", "debtors")}
        ${crmMiniPanel("Yangi talabalar", newStudents, (item) => `<article><b>${escapeHtml(item.full_name || item.fullName)}</b><span>${escapeHtml(item.phone || "-")}</span><button type="button" data-crm-action="view" data-resource="students" data-id="${item.id}">Profil</button></article>`, "Hali talabalar qo'shilmagan", "students")}
        <section class="crm-panel wide"><div class="crm-panel-head"><h2>Oylik tushum grafigi</h2><button type="button" data-view="reports">Hisobot</button></div><div class="bar-chart" data-chart="monthly_payments"></div></section>
        ${crmMiniPanel("Leadlar statusi", leads.slice(0, 6), (item) => `<article><b>${escapeHtml(item.full_name || item.name)}</b><span>${statusLabels[item.status] || item.status || "Yangi"}</span><button type="button" data-view="leads">Ochish</button></article>`, "Leadlar mavjud emas", "leads")}
      </div>
      <div class="crm-dashboard-20">
        <section class="crm-panel wide"><div class="crm-panel-head"><div><h2>Eduka 20.0 analytics</h2><p>Daromad, qarzdorlik va o'sish real ma'lumotlar asosida.</p></div><button type="button" data-view="reports">Batafsil</button></div>${crmDashboard20Insights({ students, groups, leads, attendance, debtTotal, revenue, attendancePercent })}<div style="margin-top:16px">${crmTrendLine(state.analytics.monthly_payments || [], "month", "amount")}</div></section>
        <section class="crm-panel"><div class="crm-panel-head"><h2>Lead funnel</h2><button type="button" data-view="leads">Pipeline</button></div>${crmFunnel20(leads)}</section>
        <section class="crm-panel"><div class="crm-panel-head"><h2>Oxirgi aktivlik</h2><button type="button" data-view="reports">Loglar</button></div>${crmActivity20()}</section>
      </div>
    </div>`;
  renderBarChart('[data-chart="monthly_payments"]', state.analytics.monthly_payments || [], "amount", "month");
}

function crmStudentName(id) {
  const student = (state.students || []).find((item) => String(item.id) === String(id));
  return student?.full_name || student?.fullName || "-";
}

function renderCrmStudents() {
  const section = document.getElementById("students");
  if (!section) return;
  const items = filteredCrmStudents();
  const groupOptions = crmSelectOptions((state.groups || []).map((item) => item.name), crmFilterValue("students", "group"), "Guruhni tanlang");
  const courseOptions = crmSelectOptions([...(state.courses || []).map((item) => item.name), ...(state.students || []).map((item) => item.course || item.course_name)], crmFilterValue("students", "course"), "Kurs");
  const teacherOptions = crmSelectOptions([...(state.teachers || []).map((item) => item.fullName || item.full_name), ...(state.students || []).map((item) => item.teacher || item.teacher_full_name)], crmFilterValue("students", "teacher"), "O'qituvchi bo'yicha");
  section.innerHTML = `
    <div class="crm-list-page">
      <div class="crm-list-head"><div><h1>Talabalar ro'yxati</h1><p>Talabalar, guruhlar va balanslarni boshqarish</p></div><div class="crm-head-actions"><label class="crm-page-size"><span>20</span><input value="20" inputmode="numeric" aria-label="Sahifa hajmi" /></label><button class="crm-soft-button" type="button" data-crm-action="active-students-report">Aktiv talabalar hisoboti</button><button class="crm-icon-button" type="button" data-crm-action="toggle-view" aria-label="Ko'rinish"><i data-lucide="layout-grid"></i></button><button class="crm-primary-button" type="button" data-open-modal="students"><i data-lucide="plus"></i>Yangi talaba qo'shish</button></div></div>
      <div class="crm-filter-grid" data-crm-filter-scope="students">
        <input data-crm-filter="name" value="${escapeHtml(crmFilterValue("students", "name"))}" placeholder="Ism orqali qidirish" />
        <input data-crm-filter="phone" value="${escapeHtml(crmFilterValue("students", "phone"))}" placeholder="Telefon raqam orqali qidirish" />
        <input data-crm-filter="parentPhone" value="${escapeHtml(crmFilterValue("students", "parentPhone"))}" placeholder="Ota-ona raqami" />
        <select data-crm-filter="group">${groupOptions}</select>
        <select data-crm-filter="course">${courseOptions}</select>
        <select data-crm-filter="teacher">${teacherOptions}</select>
        <input data-crm-filter="tags" value="${escapeHtml(crmFilterValue("students", "tags"))}" placeholder="Teglar" />
        <select data-crm-filter="status"><option value="">Barcha talabalar</option><option value="active" ${crmFilterValue("students", "status") === "active" ? "selected" : ""}>Faol</option><option value="frozen" ${crmFilterValue("students", "status") === "frozen" ? "selected" : ""}>Muzlatilgan</option><option value="left" ${crmFilterValue("students", "status") === "left" ? "selected" : ""}>Ketgan</option><option value="debtor" ${crmFilterValue("students", "status") === "debtor" ? "selected" : ""}>Qarzdor</option></select>
        <button class="crm-soft-button" type="button" data-crm-action="reset-filters" data-resource="students">Tozalash</button>
        <button class="crm-icon-button" type="button" data-crm-action="filter-settings" aria-label="Filter sozlamalari"><i data-lucide="sliders-horizontal"></i></button>
      </div>
      <div class="crm-total-badge">Jami: ${items.length}</div>
      <div class="crm-table-card"><table class="crm-table"><thead><tr><th>T/R</th><th><input type="checkbox" aria-label="Barchasini tanlash" /></th><th>FISH</th><th>Telefon</th><th>Ota-ona telefoni</th><th>Guruhlar</th><th>Kurs</th><th>Balans</th><th>Status</th><th>Amallar</th></tr></thead><tbody>${items.length ? items.map((student, index) => {
        const name = student.fullName || student.full_name || "-";
        const balance = Number(student.balance || 0);
        return `<tr data-crm-row="students" data-id="${student.id}"><td>${index + 1}</td><td><input type="checkbox" aria-label="${escapeHtml(name)}" /></td><td><button class="crm-link" type="button" data-crm-action="view" data-resource="students" data-id="${student.id}">${escapeHtml(name)}</button></td><td>${escapeHtml(student.phone || "-")}</td><td>${escapeHtml(student.parentPhone || student.parent_phone || "-")}</td><td>${crmPill(crmStudentGroups(student))}</td><td>${escapeHtml(student.course || student.course_name || "-")}</td><td><strong class="${balance > 0 ? "crm-money debt" : "crm-money"}">${formatMoney(balance)}</strong></td><td>${renderBadge(student.status || (balance > 0 ? "debtor" : "active"))}</td><td><button class="crm-row-icon" type="button" data-crm-action="flag" data-resource="students" data-id="${student.id}" aria-label="Belgilash"><i data-lucide="flag"></i></button>${crmActionMenu("students", student.id)}</td></tr>`;
      }).join("") : `<tr><td colspan="10">${crmEmptyState("Hali talabalar qo'shilmagan", "Yangi talaba qo'shish", 'data-open-modal="students"')}</td></tr>`}</tbody></table></div>
      <div class="crm-export-actions"><button type="button" data-crm-action="import-excel" data-resource="students">Exceldan import qilish</button><button type="button" data-crm-action="export-excel" data-resource="students">Excelga eksport qilish</button></div>
    </div>`;
}

function renderCrmGroups() {
  const section = document.getElementById("groups");
  if (!section) return;
  const items = filteredCrmGroups();
  const courseOptions = crmSelectOptions([...(state.courses || []).map((item) => item.name), ...(state.groups || []).map((item) => item.course || item.course_name)], crmFilterValue("groups", "course"), "Kurs bo'yicha");
  const teacherOptions = crmSelectOptions((state.teachers || []).map((item) => item.fullName || item.full_name), crmFilterValue("groups", "teacher"), "O'qituvchi bo'yicha");
  section.innerHTML = `
    <div class="crm-list-page">
      <div class="crm-list-head"><div><h1>Guruhlar ro'yxati</h1><p>Dars vaqtlari, o'qituvchilar va narxlar nazorati</p></div><button class="crm-primary-button" type="button" data-open-modal="groups"><i data-lucide="plus"></i>Yangi guruh qo'shish</button></div>
      <div class="crm-filter-grid" data-crm-filter-scope="groups">
        <input data-crm-filter="name" value="${escapeHtml(crmFilterValue("groups", "name"))}" placeholder="Ism orqali qidirish" />
        <input data-crm-filter="price" value="${escapeHtml(crmFilterValue("groups", "price"))}" placeholder="Narx bo'yicha" />
        <select data-crm-filter="course">${courseOptions}</select>
        <select data-crm-filter="teacher">${teacherOptions}</select>
        <input data-crm-filter="room" value="${escapeHtml(crmFilterValue("groups", "room"))}" placeholder="Xona bo'yicha" />
        <input data-crm-filter="days" value="${escapeHtml(crmFilterValue("groups", "days"))}" placeholder="Kun bo'yicha" />
        <input data-crm-filter="tags" value="${escapeHtml(crmFilterValue("groups", "tags"))}" placeholder="Teglar bo'yicha" />
        <button class="crm-soft-button" type="button" data-crm-action="reset-filters" data-resource="groups">Tozalash</button>
        <button class="crm-icon-button" type="button" data-crm-action="filter-settings" aria-label="Filter sozlamalari"><i data-lucide="sliders-horizontal"></i></button>
      </div>
      <div class="crm-legend"><span><i></i>Barchasi</span><span><i class="trial"></i>Sinov darsida</span></div>
      <div class="crm-table-card"><table class="crm-table"><thead><tr><th>T/R</th><th>Nomi</th><th>Narx</th><th>Dars vaqti</th><th>Kurs</th><th>O'qituvchi</th><th>Dars kunlari</th><th>Talabalar soni</th><th>Status</th><th>Amallar</th></tr></thead><tbody>${items.length ? items.map((group, index) => {
        const days = Array.isArray(group.lessonDays) ? group.lessonDays.join(", ") : group.days || "-";
        const price = group.price || group.monthly_price || 0;
        return `<tr data-crm-row="groups" data-id="${group.id}"><td>${index + 1}</td><td><button class="crm-link" type="button" data-crm-action="view" data-resource="groups" data-id="${group.id}">${escapeHtml(group.name || "-")}</button><div class="crm-count-pills"><span>${group.studentCount || group.student_count || 0}</span><span>${crmGroupTeachers(group).length || 1}</span></div></td><td>${formatMoney(price)}</td><td>${escapeHtml(group.startTime || group.start_time || "08:30")} - ${escapeHtml(group.endTime || group.end_time || "10:00")}</td><td>${escapeHtml(group.course || group.course_name || "-")}</td><td>${crmPill(crmGroupTeachers(group), "O'qituvchi tanlanmagan")}</td><td>${crmPill(days.split(",").map((day) => day.trim()))}</td><td>${group.studentCount || group.student_count || 0}</td><td>${renderBadge(group.status || "active")}</td><td>${crmActionMenu("groups", group.id)}</td></tr>`;
      }).join("") : `<tr><td colspan="10">${crmEmptyState("Hali guruhlar mavjud emas", "Yangi guruh yaratish", 'data-open-modal="groups"')}</td></tr>`}</tbody></table></div>
      <div class="crm-export-actions"><button type="button" data-crm-action="export-excel" data-resource="groups">Excelga eksport qilish</button></div>
    </div>`;
}

function renderCrmTeachers() {
  const section = document.getElementById("teachers");
  if (!section) return;
  const items = filteredCrmTeachers();
  const groupOptions = crmSelectOptions((state.groups || []).map((item) => item.name), crmFilterValue("teachers", "group"), "Guruhni tanlang");
  section.innerHTML = `
    <div class="crm-list-page">
      <div class="crm-list-head"><div><h1>O'qituvchilar ro'yxati</h1><p>O'qituvchilar, ish haqi va guruh biriktirish</p></div><div class="crm-head-actions"><button class="crm-icon-button" type="button" data-crm-action="teacher-message" aria-label="Xabar yuborish"><i data-lucide="mail"></i></button><button class="crm-primary-button" type="button" data-open-modal="teachers"><i data-lucide="plus"></i>Yangi o'qituvchi qo'shish</button></div></div>
      <div class="crm-filter-grid" data-crm-filter-scope="teachers">
        <input data-crm-filter="name" value="${escapeHtml(crmFilterValue("teachers", "name"))}" placeholder="Ism orqali qidirish" />
        <input data-crm-filter="phone" value="${escapeHtml(crmFilterValue("teachers", "phone"))}" placeholder="Telefon raqam orqali qidirish" />
        <select data-crm-filter="salary"><option value="">Maosh turi bo'yicha</option><option value="fixed" ${crmFilterValue("teachers", "salary") === "fixed" ? "selected" : ""}>Oylik</option><option value="per_lesson" ${crmFilterValue("teachers", "salary") === "per_lesson" ? "selected" : ""}>Darsbay</option><option value="percentage" ${crmFilterValue("teachers", "salary") === "percentage" ? "selected" : ""}>Foiz</option></select>
        <select data-crm-filter="group">${groupOptions}</select>
        <button class="crm-soft-button" type="button" data-crm-action="reset-filters" data-resource="teachers">Tozalash</button>
      </div>
      <div class="crm-table-card"><table class="crm-table"><thead><tr><th>T/R</th><th><input type="checkbox" aria-label="Barchasini tanlash" /></th><th>Nomi</th><th>Telefon</th><th>Email</th><th>Guruhlar</th><th>Ish haqi turi</th><th>Tug'ilgan sana</th><th>Status</th><th>Amallar</th></tr></thead><tbody>${items.length ? items.map((teacher, index) => {
        const name = teacher.fullName || teacher.full_name || "-";
        const groups = crmTeacherGroups(teacher);
        const salaryType = teacher.salaryType || teacher.salary_type || "percentage";
        const salaryValue = teacher.salaryValue || teacher.salary_rate || 50;
        return `<tr data-crm-row="teachers" data-id="${teacher.id}"><td>${index + 1}</td><td><input type="checkbox" aria-label="${escapeHtml(name)}" /></td><td><button class="crm-link" type="button" data-crm-action="view" data-resource="teachers" data-id="${teacher.id}">${escapeHtml(name)}</button></td><td>${escapeHtml(teacher.phone || "-")}</td><td>${escapeHtml(teacher.email || "-")}</td><td>${crmPill(groups, "Guruh biriktirilmagan")}</td><td>${escapeHtml(salaryValue)} [${statusLabels[salaryType] || salaryType}]</td><td>${formatDate(teacher.birthDate || teacher.birth_date) || "-"}</td><td>${renderBadge(teacher.status || "active")}</td><td>${crmActionMenu("teachers", teacher.id)}</td></tr>`;
      }).join("") : `<tr><td colspan="10">${crmEmptyState("Hali o'qituvchi qo'shilmagan", "Yangi o'qituvchi qo'shish", 'data-open-modal="teachers"')}</td></tr>`}</tbody></table></div>
      <div class="crm-export-actions"><button type="button" data-crm-action="export-excel" data-resource="teachers">Excelga eksport qilish</button></div>
    </div>`;
}

function renderCrmCourses() {
  const section = document.getElementById("courses");
  if (!section) return;
  const courses = filteredItems("courses");
  section.innerHTML = `<div class="crm-list-page">
    <div class="crm-list-head"><div><h1>Kurslar</h1><p>Kurs narxi, davomiyligi va statusini boshqaring</p></div><button class="crm-primary-button" type="button" data-open-modal="courses"><i data-lucide="plus"></i>Yangi kurs qo'shish</button></div>
    <div class="crm-filter-grid" data-filter-scope="courses"><input data-filter="search" placeholder="Kurs nomi bo'yicha qidirish" /><select data-filter="status"><option value="">Status</option><option value="active">Faol</option><option value="archived">Arxiv</option></select><button class="crm-soft-button" type="button" data-crm-action="reset-ui-filters" data-resource="courses">Filtrlarni tozalash</button></div>
    <div class="crm-card-grid">${courses.length ? courses.map((course) => `<article class="crm-course-card"><div><span>${renderBadge(course.status || "active")}</span><h2>${escapeHtml(course.name || "-")}</h2><p>${escapeHtml(course.description || "Tavsif kiritilmagan")}</p></div><div class="crm-course-meta"><span>${formatMoney(course.price)}</span><span>${escapeHtml(course.duration || "-")}</span><span>${course.lesson_type === "individual" ? "Individual" : "Guruh"}</span></div><div class="crm-card-actions"><button type="button" data-crm-action="edit" data-resource="courses" data-id="${course.id}">Tahrirlash</button>${crmActionMenu("courses", course.id)}</div></article>`).join("") : crmEmptyState("Hali kurslar mavjud emas", "Yangi kurs qo'shish", 'data-open-modal="courses"')}</div>
  </div>`;
}


function crmFinanceTabs(active = "finance") {
  const tabs = [
    ["finance", "To'lovlar", "wallet"],
    ["extra-income", "Qo'shimcha daromadlar", "circle-dollar-sign"],
    ["salary", "Ish haqi", "badge-dollar-sign"],
    ["bonuses", "Bonuslar", "gift"],
    ["expenses", "Xarajatlar", "receipt"],
    ["debtors", "Qarzdorlar", "badge-alert"],
    ["finance-cash", "Kassa", "landmark"]
  ];
  return `<nav class="finance-modern-tabs">${tabs.map(([view, label, icon]) => `<button type="button" class="${active === view ? "active" : ""}" data-view="${view}"><i data-lucide="${icon}"></i>${label}</button>`).join("")}</nav>`;
}

function crmFinanceAmount(item) {
  return Number(item.amount || item.paid_amount || item.price || item.sum || 0);
}

function crmFinanceMethod(item) {
  return item.payment_type || item.method || item.paymentMethod || "Naqd pul";
}

function crmFinanceSource(item) {
  return item.source || item.from || item.account || item.taken_from || "kassa";
}

function crmFinanceDate(item, fallback = new Date().toISOString().slice(0, 10)) {
  return formatDate(item.paid_at || item.spent_at || item.transaction_date || item.date || item.created_at) || fallback;
}

function crmFinanceTable(headers, rows, empty = "Ma'lumot topilmadi") {
  return `<div class="finance-pro-table"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.join("") : `<tr><td colspan="${headers.length}" class="finance-empty-cell">${empty}</td></tr>`}</tbody></table></div>`;
}

function crmMoneyClass(value) {
  const n = Number(value || 0);
  if (n < 0) return "danger";
  if (n > 0) return "success";
  return "muted";
}

function renderCrmExtraIncomePage() {
  const section = document.getElementById("extra-income");
  if (!section) return;
  const items = state.extraIncomes || [];
  const total = items.reduce((sum, item) => sum + crmFinanceAmount(item), 0);
  section.innerHTML = `<div class="finance-pro-page">
    ${crmFinanceTabs("extra-income")}
    <div class="finance-pro-head"><div><h1>Qo'shimcha daromadlar</h1><p>Mahsulot, xizmat, market va boshqa daromadlarni boshqaring.</p></div><button class="crm-primary-button" type="button" data-open-modal="extraIncomes"><i data-lucide="plus"></i>Yangi daromad qo'shish</button></div>
    <div class="finance-kpi-grid"><article><span>Jami daromad</span><strong class="success">${formatMoney(total)}</strong></article><article><span>Yozuvlar</span><strong>${items.length}</strong></article><article><span>O'rtacha summa</span><strong>${formatMoney(items.length ? Math.round(total / items.length) : 0)}</strong></article></div>
    <div class="finance-filter-bar"><input type="date" value="2026-05-01" /><input type="date" value="2026-05-31" /><select><option>Bo'lim bo'yicha</option></select><select><option>To'lov usuli</option></select><input placeholder="Ism orqali qidirish" /><button type="button">Tozalash</button></div>
    ${crmFinanceTable(["T/R", "NARX", "TANGALAR", "SANA", "DAROMAD TURI", "TO'LOV USULI", "XARIDOR FISH", "HODIM", "IZOH"], items.map((item, index) => `<tr><td>${index + 1}</td><td><b class="success">${formatMoney(crmFinanceAmount(item))}</b></td><td>${item.coins || 0}</td><td>${crmFinanceDate(item)}</td><td>${escapeHtml(item.category || item.type || "Qo'shimcha")}</td><td>${escapeHtml(crmFinanceMethod(item))}</td><td>${escapeHtml(item.customer_name || item.client || "-")}</td><td>${escapeHtml(item.staff_name || item.employee || currentUser.name || "CEO")}</td><td>${escapeHtml(item.note || "-")}</td></tr>`))}
  </div>`;
}

function renderCrmExpensesPage() {
  const section = document.getElementById("expenses");
  if (!section) return;
  const items = state.expenses || [];
  const total = items.reduce((sum, item) => sum + crmFinanceAmount(item), 0);
  section.innerHTML = `<div class="finance-pro-page">
    ${crmFinanceTabs("expenses")}
    <div class="finance-pro-head"><div><h1>Xarajatlar</h1><p>O'zgaruvchi xarajatlar, rejalashtirish va xodimlarga bog'liq chiqimlar.</p></div><button class="crm-primary-button" type="button" data-open-modal="expenses"><i data-lucide="plus"></i>Yangi xarajat qo'shish</button></div>
    <div class="finance-kpi-grid"><article><span>Jami xarajat</span><strong class="danger">${formatMoney(total)}</strong></article><article><span>Kassa orqali</span><strong>${formatMoney(items.filter(i => crmFinanceSource(i)==="kassa").reduce((s,i)=>s+crmFinanceAmount(i),0))}</strong></article><article><span>Hisob orqali</span><strong>${formatMoney(items.filter(i => crmFinanceSource(i)==="hisob").reduce((s,i)=>s+crmFinanceAmount(i),0))}</strong></article></div>
    <div class="finance-filter-bar"><input placeholder="Sabab bo'yicha" /><select><option>Bo'limni tanlang</option></select><input type="date" value="2026-05-01" /><input type="date" placeholder="Gacha" /><button type="button">Tozalash</button></div>
    ${crmFinanceTable(["T/R", "SABAB", "XARAJAT TURI", "NARX", "TO'LOV USULI", "QAYERDAN OLINGANLIGI", "SANA", "HODIM"], items.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.reason || item.title || item.note || "-")}</td><td>${escapeHtml(item.category || item.type || "O'zgaruvchi")}</td><td><b class="danger">${formatMoney(crmFinanceAmount(item))}</b></td><td>${escapeHtml(crmFinanceMethod(item))}</td><td>${escapeHtml(crmFinanceSource(item))}</td><td>${crmFinanceDate(item)}</td><td>${escapeHtml(item.staff_name || currentUser.name || "CEO")}</td></tr>`))}
  </div>`;
}

function renderCrmSalaryPage() {
  const section = document.getElementById("salary");
  if (!section) return;
  const teachers = state.teachers || [];
  const paid = (state.salaryPayments || []).reduce((sum, item) => sum + crmFinanceAmount(item), 0);
  const expected = teachers.reduce((sum, teacher) => sum + Number(teacher.salaryValue || teacher.salary_rate || 0), 0);
  section.innerHTML = `<div class="finance-pro-page">
    ${crmFinanceTabs("salary")}
    <div class="finance-pro-head"><div><h1>Ish haqi</h1><p>O'qituvchi va xodimlar maoshi, to'langan/qoldiq summalar.</p></div><button class="crm-primary-button" type="button" data-open-modal="salaryPayments"><i data-lucide="plus"></i>Ish haqi qo'shish</button></div>
    <div class="finance-kpi-grid"><article><span>Hisoblangan</span><strong>${formatMoney(expected)}</strong></article><article><span>To'langan</span><strong class="success">${formatMoney(paid)}</strong></article><article><span>Qoldiq</span><strong class="danger">${formatMoney(Math.max(expected - paid, 0))}</strong></article></div>
    <div class="finance-filter-bar"><select><option>Xodim bo'yicha</option></select><input type="month" value="2026-05" /><select><option>Maosh turi</option></select><button type="button">Tozalash</button></div>
    ${crmFinanceTable(["T/R", "HODIM", "GURUHLAR", "MAOSH TURI", "HISOBLANGAN", "TO'LANGAN", "QOLDIQ", "SANA", "IZOH"], teachers.map((teacher, index) => { const salary = Number(teacher.salaryValue || teacher.salary_rate || 0); const teacherPaid = (state.salaryPayments || []).filter(p => String(p.employee_id || p.teacher_id) === String(teacher.id)).reduce((s,p)=>s+crmFinanceAmount(p),0); return `<tr><td>${index + 1}</td><td>${escapeHtml(teacher.full_name || teacher.fullName || "-")}</td><td>${crmPill(crmTeacherGroups(teacher), "-")}</td><td>${statusLabels[teacher.salary_type || teacher.salaryType] || teacher.salary_type || "Foiz"}</td><td>${formatMoney(salary)}</td><td><b class="success">${formatMoney(teacherPaid)}</b></td><td><b class="danger">${formatMoney(Math.max(salary - teacherPaid, 0))}</b></td><td>${crmFinanceDate(teacher, "-")}</td><td>${escapeHtml(teacher.note || "-")}</td></tr>`; }))}
  </div>`;
}

function renderCrmBonusesPage() {
  const section = document.getElementById("bonuses");
  if (!section) return;
  const items = state.bonuses || [];
  const total = items.reduce((sum, item) => sum + crmFinanceAmount(item), 0);
  section.innerHTML = `<div class="finance-pro-page">
    ${crmFinanceTabs("bonuses")}
    <div class="finance-pro-head"><div><h1>Bonuslar</h1><p>Xodim va o'qituvchilar uchun qo'shimcha rag'batlantirish.</p></div><button class="crm-primary-button" type="button" data-open-modal="bonuses"><i data-lucide="plus"></i>Yangi bonus qo'shish</button></div>
    <div class="finance-kpi-grid"><article><span>Jami bonus</span><strong class="success">${formatMoney(total)}</strong></article><article><span>Bonuslar soni</span><strong>${items.length}</strong></article><article><span>O'rtacha bonus</span><strong>${formatMoney(items.length ? Math.round(total / items.length) : 0)}</strong></article></div>
    <div class="finance-filter-bar"><input type="date" value="2026-05-01" /><input type="date" value="2026-05-31" /><select><option>Xodim bo'yicha</option></select><select><option>To'lov turi bo'yicha</option></select><button type="button">Tozalash</button></div>
    ${crmFinanceTable(["T/R", "SANA", "NARX", "HODIM", "TO'LOV TURI", "QAYERDAN OLINGANLIGI", "IZOH"], items.map((item, index) => `<tr><td>${index + 1}</td><td>${crmFinanceDate(item)}</td><td><b class="success">${formatMoney(crmFinanceAmount(item))}</b></td><td>${escapeHtml(item.employee_name || item.staff_name || "-")}</td><td>${escapeHtml(crmFinanceMethod(item))}</td><td>${escapeHtml(crmFinanceSource(item))}</td><td>${escapeHtml(item.note || "-")}</td></tr>`))}
  </div>`;
}

function renderCrmCashPage() {
  const section = document.getElementById("finance-cash");
  if (!section) return;
  const payments = state.payments || [];
  const tx = state.financeTransactions || [];
  const cash = payments.filter((item) => ["naqd", "cash", "naqd pul"].includes(String(crmFinanceMethod(item)).toLowerCase())).reduce((s,i)=>s+crmFinanceAmount(i),0);
  const card = payments.filter((item) => ["karta", "card", "plastik karta", "click", "payme", "uzum"].includes(String(crmFinanceMethod(item)).toLowerCase())).reduce((s,i)=>s+crmFinanceAmount(i),0);
  const bank = payments.filter((item) => ["bank", "bank hisobi"].includes(String(crmFinanceMethod(item)).toLowerCase())).reduce((s,i)=>s+crmFinanceAmount(i),0);
  const total = Math.max(cash + card + bank, 1);
  section.innerHTML = `<div class="finance-pro-page">
    ${crmFinanceTabs("finance-cash")}
    <div class="finance-cash-board">
      <section class="cash-big-card"><strong class="success">${formatMoney(cash)}</strong><span>Kassadagi jami naqd pullar</span></section>
      <section class="cash-big-card"><strong class="danger">${formatMoney(card)}</strong><span>Kassadagi jami boshqa pullar</span></section>
      <section class="cash-big-card wide"><strong class="success">${formatMoney(bank)}</strong><span>Hisobdagi naqd pul</span></section>
      <section class="cash-big-card wide"><strong class="danger">0 so'm</strong><span>Hisobdagi naqd bo'lmagan pul</span></section>
      <section class="finance-flow-card"><header><h2>Kirimlar</h2><button type="button">batafsil</button></header>${[["Naqd pul", cash, "banknote"], ["Plastik karta", card, "credit-card"], ["Bank hisobi", bank, "landmark"]].map(([label, value, icon]) => `<div><i data-lucide="${icon}"></i><b>${formatMoney(value)}</b><span>${label}</span><em><strong style="width:${Math.round((Number(value)/total)*100)}%"></strong></em><small>${Math.round((Number(value)/total)*100)}%</small></div>`).join("")}</section>
      <section class="finance-flow-card"><header><h2>Chiqimlar</h2><button type="button">batafsil</button></header>${[["Naqd pul", 0, "banknote"], ["Plastik karta", 0, "credit-card"], ["Bank hisobi", 0, "landmark"]].map(([label, value, icon]) => `<div><i data-lucide="${icon}"></i><b>${formatMoney(value)}</b><span>${label}</span><em><strong style="width:0%"></strong></em><small>0%</small></div>`).join("")}</section>
      <button class="finance-transfer-cta" type="button" data-crm-action="cash-transfer">Kassadagi pulni hisobga o'tkazish →</button>
    </div>
    <div class="finance-pro-head compact"><div><h2>O'tkazmalar ro'yhati</h2><p>Kassa va hisob harakatlari.</p></div><button class="crm-icon-button" type="button" data-crm-action="filter-settings"><i data-lucide="settings"></i></button></div>
    <div class="finance-filter-bar"><input placeholder="Dan" /><input placeholder="Gacha" /><select><option>Tur bo'yicha</option></select><button type="button">Tozalash</button></div>
    ${crmFinanceTable(["T/R", "SANA", "NARX", "HODIM", "TURI", "SABAB"], tx.map((item, index) => `<tr><td>${index + 1}</td><td>${crmFinanceDate(item)}</td><td>${formatMoney(crmFinanceAmount(item))}</td><td>${escapeHtml(item.staff_name || currentUser.name || "CEO")}</td><td>${escapeHtml(item.type || "Kassa o'tkazma")}</td><td>${escapeHtml(item.category || item.reason || "-")}</td></tr>`), "O'tkazmalar hali mavjud emas")}
  </div>`;
}

function renderCrmPayments() {
  const section = document.getElementById("finance");
  if (!section) return;
  const items = filteredItems("payments");
  const revenue = (state.payments || []).reduce((sum, item) => sum + Number(item.amount || item.paid_amount || 0), 0);
  const debtTotal = debtItems().reduce((sum, item) => sum + Number(item.balance || item.remaining_debt || 0), 0);
  const cash = items.filter((item) => ["naqd", "cash"].includes(String(item.payment_type || item.method || "").toLowerCase())).reduce((sum, item) => sum + Number(item.amount || item.paid_amount || 0), 0);
  const card = items.filter((item) => ["karta", "card", "click", "payme", "uzum"].includes(String(item.payment_type || item.method || "").toLowerCase())).reduce((sum, item) => sum + Number(item.amount || item.paid_amount || 0), 0);
  const bank = items.filter((item) => ["bank"].includes(String(item.payment_type || item.method || "").toLowerCase())).reduce((sum, item) => sum + Number(item.amount || item.paid_amount || 0), 0);
  const total = Math.max(1, cash + card + bank);
  section.innerHTML = `<div class="crm-list-page">
    <div class="crm-list-head"><div><h1>Moliya va kassa</h1><p>Daromad va xarajatlarni kuzatib boring, to'lovlarni boshqaring va markaz moliyasini nazorat qiling</p></div><button class="crm-primary-button" type="button" data-open-modal="payments"><i data-lucide="wallet"></i>To'lov qo'shish</button></div>
    <div class="finance-cash-grid">
      <section class="finance-total-card"><article><strong class="success">${formatMoney(cash)}</strong><span>Kassadagi jami naqd pullar</span></article><article><strong class="danger">${formatMoney(card)}</strong><span>Kassadagi jami boshqa pullar</span></article></section>
      <section class="finance-total-card wide"><article><strong class="success">${formatMoney(revenue)}</strong><span>Hisobdagi naqd pul</span></article><article><strong class="danger">-${formatMoney(debtTotal).replace("-", "")}</strong><span>Hisobdagi naqd bo'lmagan pul</span></article></section>
      <section class="finance-flow-card"><header><h2>Kirimlar</h2><button type="button" data-crm-action="export-excel" data-resource="payments">batafsil</button></header>${[["Naqd pul", cash, "banknote"], ["Plastik karta", card, "credit-card"], ["Bank hisobi", bank, "landmark"]].map(([label, value, icon]) => `<div><i data-lucide="${icon}"></i><b>${formatMoney(value)}</b><span>${label}</span><em><strong style="width:${Math.round((Number(value) / total) * 100)}%"></strong></em><small>${Math.round((Number(value) / total) * 100)}%</small></div>`).join("")}</section>
      <section class="finance-flow-card"><header><h2>Chiqimlar</h2><button type="button" data-crm-action="export-excel" data-resource="expenses">batafsil</button></header>${[["Naqd pul", 0, "banknote"], ["Plastik karta", 0, "credit-card"], ["Bank hisobi", 0, "landmark"]].map(([label, value, icon]) => `<div><i data-lucide="${icon}"></i><b>${formatMoney(value)}</b><span>${label}</span><em><strong style="width:0%"></strong></em><small>0%</small></div>`).join("")}</section>
      <button class="finance-transfer-cta" type="button" data-crm-action="cash-transfer">Kassadagi pulni hisobga o'tkazish -></button>
    </div>
    <div class="crm-summary-strip"><article><span>Oylik tushum</span><strong>${formatMoney(revenue)}</strong></article><article><span>Jami qarzdorlik</span><strong>${formatMoney(debtTotal)}</strong></article><article><span>To'lovlar soni</span><strong>${items.length}</strong></article></div>
    <div class="crm-filter-grid" data-filter-scope="payments"><input data-filter="search" placeholder="Talaba yoki guruh" /><input data-filter="payment_month" placeholder="Oy" /><select data-filter="status"><option value="">Status</option><option value="paid">To'langan</option><option value="partial">Qisman</option><option value="debt">Qarzdor</option></select><select data-filter="payment_type"><option value="">To'lov usuli</option><option value="naqd">Naqd</option><option value="karta">Karta</option><option value="click">Click</option><option value="payme">Payme</option><option value="bank">Bank</option></select><button class="crm-soft-button" type="button" data-crm-action="reset-ui-filters" data-resource="payments">Filtrlarni tozalash</button></div>
    <div class="crm-table-card"><table class="crm-table"><thead><tr><th>Talaba</th><th>Guruh</th><th>Oy</th><th>To'lanishi kerak</th><th>To'langan</th><th>Chegirma</th><th>Qoldiq</th><th>Status</th><th>Sana</th><th>Usul</th><th>Amallar</th></tr></thead><tbody>${items.length ? items.map((item) => `<tr><td>${escapeHtml(item.student_name || crmStudentName(item.student_id))}</td><td>${escapeHtml(item.group_name || crmGroupName(item.group_id))}</td><td>${escapeHtml(item.payment_month || "-")}</td><td>${formatMoney(item.due_amount || item.amount)}</td><td>${formatMoney(item.amount || item.paid_amount)}</td><td>${formatMoney(item.discount || 0)}</td><td>${formatMoney(paymentRemainder(item))}</td><td>${renderBadge(item.status || (paymentRemainder(item) ? "partial" : "paid"))}</td><td>${formatDate(item.paid_at || item.paymentDate)}</td><td>${escapeHtml(item.payment_type || item.method || "-")}</td><td>${crmActionMenu("payments", item.id)}</td></tr>`).join("") : `<tr><td colspan="11">${crmEmptyState("Hali to'lovlar mavjud emas", "To'lov qo'shish", 'data-open-modal="payments"')}</td></tr>`}</tbody></table></div>
  </div>`;
}

function renderCrmDebts() {
  const section = document.getElementById("debtors");
  if (!section) return;
  const items = debtItems();
  const total = items.reduce((sum, item) => sum + Number(item.balance || item.remaining_debt || 0), 0);
  section.innerHTML = `<div class="finance-pro-page debtor-pro-page">
    ${crmFinanceTabs("debtors")}
    <div class="finance-pro-head"><div><h1>Qarzdorlar</h1><p>To'lov muddati o'tgan talabalar, balans va tezkor xabarlar.</p></div><button class="crm-icon-button" type="button" data-crm-action="debt-message"><i data-lucide="mail"></i></button></div>
    <div class="finance-kpi-grid"><article><span>Jami qarzdorlik</span><strong class="danger">${formatMoney(total)}</strong></article><article><span>Qarzdor talabalar</span><strong>${items.length}</strong></article><article><span>O'rtacha qarz</span><strong>${formatMoney(items.length ? Math.round(total / items.length) : 0)}</strong></article></div>
    <div class="finance-filter-bar"><input placeholder="Dan" /><input placeholder="Gacha" /><input placeholder="Ism orqali qidirish" /><input placeholder="Telefon raqam orqali qidirish" /><select><option>Guruhni tanlang</option></select><select><option>Barcha status</option></select><button type="button">Tozalash</button></div>
    <p class="finance-total-line">Jami: <b class="danger">${formatMoney(total)}</b> / ${items.length} ta</p>
    ${crmFinanceTable(["T/R", "FISH", "TELEFON RAQAM", "GURUH", "BALANS", "IZOH", "AMALLAR"], items.map((item, index) => `<tr><td>${index + 1}</td><td><button class="crm-link" type="button" data-view="student-profile" data-id="${item.id}">${escapeHtml(item.full_name || item.fullName)}</button></td><td>${escapeHtml(item.phone || "-")}</td><td>${escapeHtml(item.group_name || crmStudentGroups(item)[0] || "-")}</td><td><b class="danger">${formatMoney(item.balance || item.remaining_debt || 0)}</b></td><td>${escapeHtml(item.note || "-")}</td><td><button type="button" data-crm-action="payment" data-resource="students" data-id="${item.id}">To'lov</button> ${crmActionMenu("students", item.id)}</td></tr>`), "Qarzdor talabalar yo'q")}
  </div>`;
}


function renderCrmLeads() {
  const section = document.getElementById("leads");
  if (!section) return;
  const items = filteredItems("leads");
  const columns = [
    { key: "new", title: "So'rov", statuses: ["new", "contacted", "later"], tone: "blue" },
    { key: "trial", title: "Sinov darsidagi talabalar", statuses: ["trial"], tone: "cyan" },
    { key: "active", title: "Aktiv talabalar", statuses: ["active", "became_student", "BECAME_STUDENT"], tone: "green" },
    { key: "paid", title: "To'lov qilgan talabalar", statuses: ["paid"], tone: "violet" }
  ];
  section.innerHTML = `<div class="crm-list-page">
    <div class="crm-list-head"><div><h1>Leadlar pipeline</h1><p>Yangi murojaatlar, sinov darslari va o'quvchiga aylanish jarayonini kanban ko'rinishida boshqaring</p></div><div class="crm-head-actions"><button class="crm-soft-button" type="button" data-crm-action="filter-settings">Filtrlar</button><button class="crm-primary-button" type="button" data-open-modal="leads"><i data-lucide="plus"></i>Lead qo'shish</button></div></div>
    <div class="crm-filter-grid" data-filter-scope="leads"><input data-filter="search" placeholder="Ism yoki telefon" /><input data-filter="course_name" placeholder="Kurs" /><input data-filter="manager_name" placeholder="Mas'ul manager" /><select data-filter="status"><option value="">Barcha statuslar</option><option value="new">Yangi</option><option value="trial">Sinov darsi</option><option value="paid">To'lov qildi</option></select><button class="crm-soft-button" type="button" data-crm-action="reset-ui-filters" data-resource="leads">Tozalash</button></div>
    <div class="crm-kanban crm-lead-kanban">${columns.map((column) => {
      const leads = items.filter((lead) => column.statuses.includes(lead.status || "new"));
      return `<section class="lead-column lead-${column.tone}" data-status="${column.key}"><h2>${column.title}<span>${leads.length}</span></h2><button class="lead-add-button" type="button" data-open-modal="leads"><i data-lucide="plus"></i>Qo'shish</button>${leads.map((lead) => `<article class="lead-card" draggable="true" data-lead-id="${lead.id}"><div><b>${escapeHtml(lead.full_name || lead.name || "-")}</b><span>${escapeHtml(lead.phone || "-")}</span></div><small>${escapeHtml(lead.course_name || lead.course || "Kurs tanlanmagan")} / ${escapeHtml(lead.source || "Manba yo'q")}</small><em>${formatDate(lead.created_at || lead.next_contact_at) || "Bugun"}</em><div class="lead-actions"><button type="button" data-crm-action="lead-status" data-resource="leads" data-id="${lead.id}">Status</button><button type="button" data-crm-action="convert-lead" data-resource="leads" data-id="${lead.id}">O'quvchi</button>${crmActionMenu("leads", lead.id)}</div></article>`).join("") || `<div class="lead-empty"><i data-lucide="sparkles"></i><span>Yangi card qo'shing</span></div>`}</section>`;
    }).join("")}</div>
    <div class="crm-table-card"><table class="crm-table"><thead><tr><th>Lead</th><th>Telefon</th><th>Kurs</th><th>Manba</th><th>Status</th><th>Mas'ul</th><th>Sana</th><th>Amallar</th></tr></thead><tbody>${items.length ? items.map((lead) => `<tr><td>${escapeHtml(lead.full_name || lead.name || "-")}</td><td>${escapeHtml(lead.phone || "-")}</td><td>${escapeHtml(lead.course_name || "-")}</td><td>${escapeHtml(lead.source || "-")}</td><td>${renderBadge(lead.status || "new")}</td><td>${escapeHtml(lead.manager_name || "-")}</td><td>${formatDate(lead.created_at || lead.next_contact_at)}</td><td>${crmActionMenu("leads", lead.id)}</td></tr>`).join("") : `<tr><td colspan="8">${crmEmptyState("Leadlar ro'yxati bo'sh", "Lead qo'shish", 'data-open-modal="leads"')}</td></tr>`}</tbody></table></div>
  </div>`;
}

function renderCrmAttendancePage() {
  const section = document.getElementById("attendance");
  if (!section) return;
  const groupOptions = selectOptions("groups", state.groups[0]?.id || "");
  const records = state.attendance || [];
  const selectedGroup = state.groups[0] || {};
  section.innerHTML = `<div class="crm-list-page">
    <div class="crm-list-head"><div><h1>Davomat jurnali</h1><p>Guruh bo'yicha dars sanalari, talaba statuslari va oylik davomatni rangli jurnal-gridda boshqaring</p></div><button class="crm-primary-button" type="button" data-crm-action="save-attendance-page"><i data-lucide="check"></i>Davomatni saqlash</button></div>
    <section class="crm-attendance-builder attendance-journal-shell">
      <aside class="journal-group-card">
        <h2>${escapeHtml(selectedGroup.name || "Guruh tanlang")}</h2>
        <p><b>O'qituvchi:</b> ${escapeHtml(selectedGroup.teacher_full_name || selectedGroup.teacher_name || crmGroupTeachers(selectedGroup)[0] || "-")}</p>
        <p><b>Narx:</b> ${formatMoney(selectedGroup.monthly_price || selectedGroup.price || 0)}</p>
        <p><b>Vaqt:</b> ${escapeHtml(selectedGroup.start_time || selectedGroup.startTime || "09:00")} - ${escapeHtml(selectedGroup.end_time || selectedGroup.endTime || "10:30")}</p>
        <p><b>Kurs:</b> ${escapeHtml(selectedGroup.course_name || selectedGroup.course || "-")}</p>
        <p><b>Xona:</b> ${escapeHtml(selectedGroup.room || "-")}</p>
        <div class="journal-legend"><span class="present-dot"></span>Keldi <span class="absent-dot"></span>Kelmadi <span class="late-dot"></span>Kechikdi <span class="excused-dot"></span>Sababli</div>
      </aside>
      <div class="journal-main">
        <div class="crm-filter-grid"><select data-attendance-group>${groupOptions}</select><input type="date" data-attendance-date value="${new Date().toISOString().slice(0, 10)}" /><input type="time" data-attendance-time value="09:00" /><button type="button" class="crm-soft-button" data-attendance-mark-all>Keldi: hammasi</button></div>
        ${attendanceJournalHtml(selectedGroup)}
        <div class="attendance-students" data-attendance-students hidden></div>
      </div>
    </section>
    <div class="crm-table-card"><table class="crm-table"><thead><tr><th>Sana</th><th>Guruh</th><th>O'qituvchi</th><th>Keldi</th><th>Kelmadi</th><th>Kechikdi</th><th>Amallar</th></tr></thead><tbody>${records.length ? records.slice(0, 20).map((item) => `<tr><td>${formatDate(item.lesson_date)}</td><td>${escapeHtml(item.group_name || crmGroupName(item.group_id))}</td><td>${escapeHtml(item.teacher_name || "-")}</td><td>${item.status === "present" ? 1 : 0}</td><td>${item.status === "absent" ? 1 : 0}</td><td>${item.status === "late" ? 1 : 0}</td><td><button type="button" data-view="attendance">Batafsil</button></td></tr>`).join("") : `<tr><td colspan="7">${crmEmptyState("Hali davomat belgilanmagan")}</td></tr>`}</tbody></table></div>
  </div>`;
  renderAttendanceFlow();
}

function attendanceJournalHtml(group) {
  const groupId = group?.id || state.groups[0]?.id || "";
  const students = state.students.filter((student) => String(student.group_id || student.groupIds?.[0] || "") === String(groupId)).slice(0, 12);
  const list = students.length ? students : (state.students || []).slice(0, 8);
  const dates = ["03", "05", "07", "10", "12", "14", "17", "19"].map((day) => `${day} may`);
  const statuses = ["present", "present", "late", "present", "excused", "present", "absent", "present"];
  return `<div class="attendance-journal"><div class="journal-head"><b>Talabalar</b>${dates.map((date) => `<span>${date}</span>`).join("")}</div>${list.map((student, rowIndex) => `<div class="journal-row" data-attendance-student="${student.id}"><b>${rowIndex + 1}. ${escapeHtml(student.full_name || student.fullName)}</b>${dates.map((_, index) => {
    const status = statuses[(rowIndex + index) % statuses.length];
    const icons = { present: "check", absent: "flag", late: "clock-3", excused: "badge-help", online: "wifi" };
    return `<button type="button" class="attendance-cell status-${status}" data-attendance-cell data-status="${status}" aria-label="${statusLabels[status] || status}"><i data-lucide="${icons[status]}"></i></button>`;
  }).join("")}<select data-attendance-status hidden><option value="present">Keldi</option><option value="absent">Kelmadi</option><option value="late">Kechikdi</option><option value="excused">Sababli</option><option value="online">Online</option></select></div>`).join("") || `<div class="journal-empty">${crmEmptyState("Bu guruhda talaba topilmadi", "Talaba qo'shish", 'data-open-modal="students"')}</div>`}</div>`;
}

function renderCrmSchedulePage() {
  const section = document.getElementById("schedule");
  if (!section) return;
  const items = scheduleItems();
  section.innerHTML = `<div class="crm-list-page">
    <div class="crm-list-head"><div><h1>Dars jadvali va xonalar</h1><p>Jurnal va xonalar boshqaruvi: darslarni vaqt, xona va o'qituvchi bo'yicha rangli gridda kuzating</p></div><div class="crm-head-actions"><div class="segmented"><button type="button" class="active" data-crm-action="schedule-mode">Gorizontal</button><button type="button" data-crm-action="schedule-mode">Kunlik</button><button type="button" data-crm-action="schedule-mode">Haftalik</button></div><button class="crm-primary-button" type="button" data-open-modal="schedule"><i data-lucide="plus"></i>Dars qo'shish</button></div></div>
    <div class="crm-filter-grid"><input type="date" value="${new Date().toISOString().slice(0, 10)}" /><select><option>${escapeHtml(crmCenterTitle())}</option></select><select><option>O'qituvchi bo'yicha</option>${(state.teachers || []).map((teacher) => `<option>${escapeHtml(teacher.full_name || teacher.fullName)}</option>`).join("")}</select><select><option>Xona bo'yicha</option>${crmRooms().map((room) => `<option>${escapeHtml(room.name)}</option>`).join("")}</select><button class="crm-soft-button" type="button" data-crm-action="filter-settings">Filtr</button></div>
    ${scheduleGridHtml(items)}
  </div>`;
}

function scheduleItems() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.schedule?.length) {
    return state.schedule.map((lesson) => ({
      ...lesson,
      group_name: lesson.group_name || crmGroupName(lesson.group_id),
      start_time: String(lesson.lesson_at || "").slice(11, 16) || lesson.start_time || "09:00",
      end_time: lesson.end_time || "10:30",
      room: lesson.room || crmGroupName(lesson.group_id, "") || "1-xona",
      student_count: lesson.student_count || 0
    }));
  }
  return (state.groups || []).map((group, index) => ({
    id: group.id,
    group_id: group.id,
    group_name: group.name,
    teacher_name: group.teacher_full_name || group.teacher_name || crmGroupTeachers(group)[0],
    room: group.room || `${(index % 6) + 1}-xona`,
    lesson_at: `${today}T${group.start_time || group.startTime || "09:00"}`,
    start_time: group.start_time || group.startTime || "09:00",
    end_time: group.end_time || group.endTime || "10:30",
    student_count: group.student_count || group.studentCount || 0,
    course_name: group.course_name || group.course
  }));
}

function scheduleGridHtml(items) {
  const times = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"];
  const rooms = crmRooms();
  const lessonColors = ["#8b5cf6", "#22c55e", "#06b6d4", "#f43f5e", "#eab308", "#3b82f6", "#f97316"];
  const timeIndex = (value) => Math.max(1, times.indexOf(value) + 1 || 1);
  return `<div class="room-schedule"><div class="room-time-head"><b>Xona/vaqt</b>${times.map((time) => `<span>${time}</span>`).join("")}</div>${rooms.map((room) => {
    const roomLessons = items.filter((lesson) => String(lesson.room || "1-xona").toLowerCase() === String(room.name).toLowerCase());
    return `<div class="room-row"><button type="button" data-view="rooms">${escapeHtml(room.name)}</button><div class="room-track">${roomLessons.map((lesson, index) => {
      const start = timeIndex(lesson.start_time || String(lesson.lesson_at || "").slice(11, 16));
      const end = Math.max(start + 2, timeIndex(lesson.end_time || "10:30"));
      const color = lessonColors[(Number(lesson.group_id || lesson.id || index) || index) % lessonColors.length];
      return `<article class="lesson-block" style="--start:${start};--end:${Math.min(end, times.length + 1)};--lesson:${color}" data-crm-action="schedule-edit"><b>${escapeHtml(lesson.group_name || crmGroupName(lesson.group_id))}</b><span>${escapeHtml(lesson.teacher_name || "-")}</span><small>${escapeHtml(lesson.start_time || String(lesson.lesson_at || "").slice(11, 16) || "09:00")} - ${escapeHtml(lesson.end_time || "10:30")}</small><em>talabalar: ${lesson.student_count || 0}</em></article>`;
    }).join("")}</div></div>`;
  }).join("")}</div>`;
}

function legacyRenderCrmReportsPage_v214() {
  const section = document.getElementById("reports");
  if (!section) return;
  const revenue = (state.payments || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const debt = debtItems().reduce((sum, item) => sum + Number(item.balance || 0), 0);
  section.innerHTML = `<div class="crm-list-page">
    <div class="crm-list-head"><div><h1>Hisobotlar</h1><p>Moliyaviy, o'quv va konversiya ko'rsatkichlari</p></div><div class="crm-head-actions"><button class="crm-soft-button" type="button" data-crm-action="export-excel" data-resource="reports">Excel</button><button class="crm-soft-button" type="button" data-crm-action="export-pdf">PDF</button></div></div>
    <div class="crm-filter-grid"><input type="date" value="${new Date().toISOString().slice(0, 10)}" /><input type="date" value="${new Date().toISOString().slice(0, 10)}" /></div>
    <div class="crm-stat-grid">${crmStatCard("Kunlik tushum", formatMoney(Math.round(revenue / 30)), "wallet", "finance")}${crmStatCard("Oylik tushum", formatMoney(revenue), "bar-chart-3", "finance")}${crmStatCard("Jami qarzdorlik", formatMoney(debt), "badge-alert", "debtors")}${crmStatCard("Yangi talabalar", state.students.length, "user-plus", "students")}${crmStatCard("Faol guruhlar", state.groups.filter((g) => g.status !== "archived").length, "layers", "groups")}${crmStatCard("Davomat foizi", "92%", "clipboard-check", "attendance")}</div>
    <div class="crm-dashboard-grid"><section class="crm-panel wide"><div class="crm-panel-head"><h2>Kunlik tushum</h2></div><div class="bar-chart" data-report-chart="daily"></div></section><section class="crm-panel"><div class="crm-panel-head"><h2>Lead conversion</h2></div><div class="funnel-chart" data-report-chart="conversion"></div></section><section class="crm-panel"><div class="crm-panel-head"><h2>O'qituvchi samaradorligi</h2></div><div class="rank-list" data-report-chart="teachers"></div></section></div>
  </div>`;
  renderBarChart('[data-report-chart="daily"]', state.analytics.monthly_payments || [], "amount", "month");
  renderBarChart('[data-report-chart="conversion"]', state.analytics.lead_funnel || [], "count", "status");
}

function legacyRenderCrmSettingsPage_v214() {
  const section = document.getElementById("settings");
  if (!section) return;
  const saved = loadCrmLocalState().settings || {};
  section.innerHTML = `<div class="crm-list-page">
    <div class="crm-list-head"><div><h1>Sozlamalar</h1><p>Markaz ma'lumotlari, rollar va bildirishnomalar</p></div><button class="crm-primary-button" type="button" data-crm-action="save-settings">Saqlash</button></div>
    <form class="crm-settings-grid" data-crm-settings-form>
      <article><h2>Markaz ma'lumotlari</h2><label>Nomi<input name="centerName" value="${escapeHtml(saved.centerName || crmCenterTitle())}" /></label><label>Telefon<input name="phone" value="${escapeHtml(saved.phone || "")}" /></label><label>Manzil<input name="address" value="${escapeHtml(saved.address || "")}" /></label></article>
      <article><h2>To'lov sozlamalari</h2><label>Oylik to'lov kuni<input name="paymentDay" type="number" value="${saved.paymentDay || 5}" /></label><label>Valyuta<select name="currency"><option>UZS</option></select></label></article>
      <article><h2>Telegram bot</h2><label>Bot token<input name="telegramToken" value="${escapeHtml(saved.telegramToken || "")}" /></label><label class="crm-check-field"><input name="telegramEnabled" type="checkbox" ${saved.telegramEnabled ? "checked" : ""} /><span>Davomat va qarzdorlik xabarlari</span></label><strong>${saved.telegramToken ? "Ulandi" : "Token kiritilmagan"}</strong></article>
      <article><h2>Xavfsizlik</h2><label class="crm-check-field"><input name="require2fa" type="checkbox" ${saved.require2fa ? "checked" : ""} /><span>2FA talab qilinsin</span></label><label>Session timeout<input name="timeout" type="number" value="${saved.timeout || 60}" /></label></article>
    </form>
  </div>`;
}

function crmRooms() {
  const saved = Array.isArray(state.rooms) && state.rooms.length ? state.rooms : [];
  const fromGroups = [...new Set((state.groups || []).map((group) => group.room).filter(Boolean))].map((name, index) => ({ id: index + 1, name, capacity: 10 + index * 2 }));
  const base = saved.length ? saved : fromGroups;
  return base.length ? base : Array.from({ length: 8 }, (_, index) => ({ id: index + 1, name: `${index + 1}-xona`, capacity: 12 + index }));
}

function crmPaymentTypes() {
  const saved = Array.isArray(state.paymentTypes) && state.paymentTypes.length ? state.paymentTypes : [];
  return saved.length ? saved : [
    { id: 1, name: "Bank hisobi", type: "Tizim", active: true },
    { id: 2, name: "Plastik karta", type: "Tizim", active: true },
    { id: 3, name: "Naqd pul", type: "Tizim", active: true }
  ];
}

function crmCollectionFor(resource) {
  if (resource === "rooms") return crmRooms();
  if (resource === "paymentTypes") return crmPaymentTypes();
  return state[resource] || [];
}

function ensureEditableCrmCollection(resource) {
  if ((resource === "rooms" || resource === "paymentTypes") && !(state[resource] || []).length) {
    state[resource] = crmCollectionFor(resource).map((item) => ({ ...item }));
    persistCrmCollections();
  }
}

function legacyRenderCrmStaffAttendancePage_v214() {
  const section = document.getElementById("teacher-attendance");
  if (!section) return;
  const employees = (state.teachers || []).map((teacher, index) => ({
    id: teacher.id,
    name: teacher.full_name || teacher.fullName,
    role: "O'qituvchi",
    photo: "",
    checkedIn: Boolean(state.staffAttendance.find((entry) => String(entry.employee_id || entry.id) === String(teacher.id))?.check_in || state.staffAttendance.find((entry) => String(entry.employee_id || entry.id) === String(teacher.id))?.checkedIn),
    arrived: state.staffAttendance.find((entry) => String(entry.employee_id || entry.id) === String(teacher.id))?.check_in || state.staffAttendance.find((entry) => String(entry.employee_id || entry.id) === String(teacher.id))?.arrived || ""
  }));
  const rows = employees.length ? employees : [{ id: 1, name: "Eduka Admin", role: "Administrator", checkedIn: false, arrived: "" }];
  const onTime = rows.filter((row) => row.checkedIn).length;
  section.innerHTML = `<div class="crm-list-page staff-attendance-page">
    <div class="crm-list-head"><div><h1>Xodimlar davomati</h1><p>Ustozlar va xodimlarning kelish-ketish vaqtini nazorat qiling</p></div><div class="crm-head-actions"><div class="segmented"><button type="button" class="active">Barchasi</button><button type="button">Ustozlar</button><button type="button">Hodimlar</button></div><button class="crm-soft-button" type="button"><i data-lucide="calendar"></i>${new Date().toISOString().slice(0, 10)}</button></div></div>
    <div class="crm-stat-grid staff-kpis">${crmStatCard("Jami xodimlar", rows.length, "users", "teacher-attendance")}${crmStatCard("O'z vaqtida", onTime, "check-circle-2", "teacher-attendance")}${crmStatCard("Kech qolgan", 0, "clock-3", "teacher-attendance")}${crmStatCard("Kelmagan", rows.length - onTime, "x-circle", "teacher-attendance")}</div>
    <div class="crm-table-card"><table class="crm-table staff-table"><thead><tr><th>F.I</th><th>Lavozim</th><th>Keldi</th><th>Ketdi</th><th>Harakat</th></tr></thead><tbody>${rows.map((row) => `<tr><td><span class="staff-avatar">${escapeHtml(row.name).slice(0, 1).toUpperCase()}</span>${escapeHtml(row.name)}</td><td>${escapeHtml(row.role)}</td><td>${row.arrived || "-"}</td><td>${row.checkedIn ? "-" : "18:00"}</td><td><button type="button" class="crm-primary-button" data-staff-check="${row.id}">${row.checkedIn ? "Ketdi" : "Keldi"}</button></td></tr>`).join("")}</tbody></table></div>
  </div>`;
}

function renderCrmRoomsPage() {
  const section = document.getElementById("rooms");
  if (!section) return;
  ensureEditableCrmCollection("rooms");
  const rooms = crmRooms();
  section.innerHTML = `<div class="crm-list-page">
    <div class="crm-list-head"><div><h1>Xonalar ro'yxati</h1><p>Xona sig'imi, bandligi va guruhlar bilan bog'lanishini kuzating</p></div><button class="crm-primary-button" type="button" data-open-modal="rooms"><i data-lucide="plus"></i>Xona qo'shish</button></div>
    <div class="crm-table-card"><table class="crm-table rooms-table"><thead><tr><th>T/R</th><th>Nomi</th><th>Sig'imi</th><th>Guruhlar</th><th>Vaqt</th><th>Harakatlar</th></tr></thead><tbody>${rooms.map((room, index) => {
      const groups = (state.groups || []).filter((group) => String(group.room || "").toLowerCase() === String(room.name).toLowerCase());
      return `<tr><td>${index + 1}</td><td><b>${escapeHtml(room.name)}</b></td><td>${room.capacity || "-"} o'rin</td><td>${groups.map((group) => escapeHtml(group.name)).join("<br>") || "-"}</td><td>${groups.map((group) => `${escapeHtml(group.start_time || group.startTime || "09:00")}-${escapeHtml(group.end_time || group.endTime || "10:30")}`).join("<br>") || "-"}</td><td>${crmActionMenu("rooms", room.id)}</td></tr>`;
    }).join("")}</tbody></table></div>
  </div>`;
}

function renderCrmPaymentTypesPage() {
  const section = document.getElementById("payment-types");
  if (!section) return;
  ensureEditableCrmCollection("paymentTypes");
  const types = crmPaymentTypes();
  section.innerHTML = `<div class="crm-list-page">
    <div class="crm-list-head"><div><h1>Mavjud to'lov turlari</h1><p>Naqd, karta, bank va boshqa to'lov usullarini boshqaring</p></div><button class="crm-primary-button" type="button" data-open-modal="paymentTypes"><i data-lucide="plus"></i>To'lov turi qo'shish</button></div>
    <div class="crm-table-card"><table class="crm-table payment-type-table"><thead><tr><th>T/R</th><th>Nomi</th><th>Turi</th><th>Holati</th><th>Harakatlar</th></tr></thead><tbody>${types.map((type, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(type.name)}</td><td>${escapeHtml(type.type || "Markaz")}</td><td><button type="button" class="crm-toggle ${type.active ? "active" : ""}" data-crm-action="toggle-payment-type" data-id="${type.id}"><span></span></button></td><td>${crmActionMenu("paymentTypes", type.id)}</td></tr>`).join("")}</tbody></table></div>
  </div>`;
}

function crmDrawerTitle() {
  return {
    students: crmDrawerState.itemId ? "Talabani tahrirlash" : "Yangi talaba qo'shish",
    groups: crmDrawerState.itemId ? "Guruhni tahrirlash" : "Yangi guruh qo'shish",
    teachers: crmDrawerState.itemId ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish",
    courses: crmDrawerState.itemId ? "Kursni tahrirlash" : "Yangi kurs qo'shish",
    payments: crmDrawerState.itemId ? "To'lovni tahrirlash" : "To'lov qo'shish",
    extraIncomes: crmDrawerState.itemId ? "Daromadni tahrirlash" : "Yangi daromad qo'shish",
    salaryPayments: crmDrawerState.itemId ? "Ish haqini tahrirlash" : "Ish haqi to'lash",
    bonuses: crmDrawerState.itemId ? "Bonusni tahrirlash" : "Yangi bonus qo'shish",
    expenses: crmDrawerState.itemId ? "Xarajatni tahrirlash" : "Yangi xarajat qo'shish",
    leads: crmDrawerState.itemId ? "Leadni tahrirlash" : "Lead qo'shish",
    rooms: crmDrawerState.itemId ? "Xonani tahrirlash" : "Xona qo'shish",
    paymentTypes: crmDrawerState.itemId ? "To'lov turini tahrirlash" : "To'lov turi qo'shish"
  }[crmDrawerState.type] || "Ma'lumot";
}

function crmDrawerItem() {
  return (state[crmDrawerState.type] || []).find((item) => String(item.id) === String(crmDrawerState.itemId)) || crmDrawerState.prefill || {};
}

function crmDrawerFields(type, item = {}) {
  const groupOptions = (state.groups || []).map((group) => `<option value="${group.id}" ${String(item.group_id || item.groupIds?.[0]) === String(group.id) ? "selected" : ""}>${escapeHtml(group.name)}</option>`).join("");
  const teacherOptions = (state.teachers || []).map((teacher) => `<option value="${teacher.id}" ${String(item.teacher_id || item.teacherIds?.[0]) === String(teacher.id) ? "selected" : ""}>${escapeHtml(teacher.fullName || teacher.full_name)}</option>`).join("");
  const courseValues = [...new Set([...(state.courses || []).map((course) => course.name), ...(state.groups || []).map((group) => group.course || group.course_name), ...(state.students || []).map((student) => student.course || student.course_name)].filter(Boolean))];
  const courseOptions = courseValues.map((name) => `<option value="${escapeHtml(name)}" ${String(item.course || item.course_name || "") === String(name) ? "selected" : ""}>${escapeHtml(name)}</option>`).join("");
  if (type === "students") {
    const notifications = Array.isArray(item.notificationChannels) ? item.notificationChannels : [];
    return `
      <div class="crm-form-layout">
        <section class="crm-form-section-block">
          <div class="crm-form-section-head"><h3>Asosiy ma'lumotlar</h3><p>Talabaning kontakt va profil ma'lumotlarini kiriting.</p></div>
          <div class="crm-form-grid-2">
            <label><span>FISH *</span><input name="fullName" required value="${escapeHtml(item.fullName || item.full_name)}" placeholder="Talabaning FISH" /></label>
            <label><span>Telefon raqam *</span><input name="phone" required placeholder="+(998) __-___-__-__" value="${escapeHtml(item.phone)}" /></label>
            <label><span>Tug'ilgan sana</span><input name="birthDate" type="date" value="${formatDate(item.birthDate || item.birth_date)}" /></label>
            <label><span>Ota-ona telefon raqami</span><input name="parentPhone" value="${escapeHtml(item.parentPhone || item.parent_phone)}" placeholder="+(998) __-___-__-__" /></label>
            <div class="crm-field wide">
              <span>Jinsi</span>
              <div class="crm-radio-row">
                <label class="crm-radio-pill"><input type="radio" name="gender" value="male" ${item.gender === "male" ? "checked" : ""} /><span>Erkak</span></label>
                <label class="crm-radio-pill"><input type="radio" name="gender" value="female" ${item.gender === "female" ? "checked" : ""} /><span>Ayol</span></label>
              </div>
            </div>
            <label class="wide"><span>Manzili</span><textarea name="address" placeholder="Yashash manzili">${escapeHtml(item.address)}</textarea></label>
          </div>
        </section>
        <section class="crm-form-section-block">
          <div class="crm-form-section-head"><h3>Ota-ona va izohlar</h3><p>Talabaga bog'liq qo'shimcha ma'lumotlar.</p></div>
          <div class="crm-form-grid-2">
            <label><span>Otasi</span><input name="fatherName" value="${escapeHtml(item.fatherName)}" placeholder="FISH" /></label>
            <label><span>Onasi</span><input name="motherName" value="${escapeHtml(item.motherName)}" placeholder="FISH" /></label>
            <label class="wide"><span>Izoh</span><textarea name="note" placeholder="Talaba haqida izoh">${escapeHtml(item.note)}</textarea></label>
            <div class="crm-field wide">
              <span>Bildirish kanallari</span>
              <div class="crm-quick-actions-row">
                <label class="crm-quick-action"><input type="checkbox" name="channel_telegram" ${notifications.includes("telegram") ? "checked" : ""} /><span>Telegram</span></label>
                <label class="crm-quick-action"><input type="checkbox" name="channel_call" ${notifications.includes("call") ? "checked" : ""} /><span>Qo'ng'iroq</span></label>
                <label class="crm-quick-action"><input type="checkbox" name="channel_visit" ${notifications.includes("visit") ? "checked" : ""} /><span>Tashrif</span></label>
                <label class="crm-quick-action"><input type="checkbox" name="channel_document" ${notifications.includes("document") ? "checked" : ""} /><span>Hujjat</span></label>
                <label class="crm-quick-action"><input type="checkbox" name="channel_sms" ${notifications.includes("sms") ? "checked" : ""} /><span>SMS</span></label>
              </div>
            </div>
          </div>
        </section>
        <section class="crm-form-section-block">
          <div class="crm-form-section-head"><h3>Akademik ulanish</h3><p>Talabani guruh va kurs jarayoniga biriktirish.</p></div>
          <div class="crm-form-grid-2">
            <label><span>Kurs</span><select name="course"><option value="">Kurs</option>${courseOptions}</select></label>
            <label><span>Guruhni tanlang</span><select name="groupId"><option value="">Guruhni tanlang</option>${groupOptions}</select></label>
            <label><span>O'qituvchi</span><select name="teacherId"><option value="">O'qituvchi bo'yicha</option>${teacherOptions}</select></label>
            <label><span>Status</span><select name="status"><option value="active" ${item.status === "active" ? "selected" : ""}>Faol</option><option value="frozen" ${item.status === "frozen" ? "selected" : ""}>Muzlatilgan</option><option value="left" ${item.status === "left" ? "selected" : ""}>Ketgan</option><option value="debtor" ${item.status === "debtor" ? "selected" : ""}>Qarzdor</option></select></label>
            <label><span>Boshlanish sanasi</span><input name="startDate" type="date" value="${formatDate(item.startDate || item.created_at)}" /></label>
            <label><span>To'lov turi</span><select name="paymentType"><option value="monthly" ${(item.paymentType || item.payment_type || "monthly") === "monthly" ? "selected" : ""}>Oylik</option><option value="lesson" ${(item.paymentType || item.payment_type) === "lesson" ? "selected" : ""}>Darsbay</option></select></label>
            <label><span>Chegirma</span><input name="discount" type="number" min="0" value="${Number(item.discount || 0)}" /></label>
            <label><span>Teglar</span><input name="tags" value="${escapeHtml(Array.isArray(item.tags) ? item.tags.join(", ") : item.tags)}" placeholder="masalan: VIP, Qarzdor" /></label>
            <label class="wide"><span>Parol</span><input name="password" type="text" value="${escapeHtml(item.password_preview || item.password || "")}" placeholder="Ixtiyoriy login paroli" /></label>
          </div>
        </section>
      </div>`;
  }
  if (type === "groups") {
    const daySet = new Set(Array.isArray(item.lessonDays) ? item.lessonDays.map(String) : String(item.days || "").split(",").map((part) => part.trim()).filter(Boolean));
    return `
      <div class="crm-form-layout">
        <section class="crm-form-section-block">
          <div class="crm-form-section-head"><h3>Guruh ma'lumotlari</h3><p>Guruh nomi, kurs va narx bilan bog'liq asosiy ma'lumotlar.</p></div>
          <div class="crm-form-grid-2">
            <label class="wide"><span>Guruh nomi *</span><input name="name" required value="${escapeHtml(item.name)}" placeholder="Masalan: HARVARD" /></label>
            <label><span>Kurs *</span><select name="course"><option value="">Kursni tanlang</option>${courseOptions}</select></label>
            <label><span>Guruh narxi *</span><input name="price" type="number" min="0" value="${Number(item.price || item.monthly_price || 250000)}" placeholder="so'm" /></label>
            <label class="wide"><span>Xona *</span><input name="room" value="${escapeHtml(item.room)}" placeholder="Xonani tanlang" /></label>
          </div>
        </section>
        <section class="crm-form-section-block">
          <div class="crm-form-section-head"><h3>Dars jadvali</h3><p>Kun, vaqt va start sanasini sozlang.</p></div>
          <div class="crm-form-grid-2">
            <div class="crm-field wide">
              <span>Dars kunini tanlang</span>
              <div class="crm-day-selector">
                <label class="crm-check-tile"><input type="checkbox" name="lessonDaysSet" value="Toq kunlar" ${daySet.has("Toq kunlar") ? "checked" : ""} /><span>Toq kunlar</span></label>
                <label class="crm-check-tile"><input type="checkbox" name="lessonDaysSet" value="Juft kunlar" ${daySet.has("Juft kunlar") ? "checked" : ""} /><span>Juft kunlar</span></label>
                <label class="crm-check-tile"><input type="checkbox" name="lessonDaysSet" value="Dushanba" ${daySet.has("Dushanba") ? "checked" : ""} /><span>Dushanba</span></label>
                <label class="crm-check-tile"><input type="checkbox" name="lessonDaysSet" value="Chorshanba" ${daySet.has("Chorshanba") ? "checked" : ""} /><span>Chorshanba</span></label>
                <label class="crm-check-tile"><input type="checkbox" name="lessonDaysSet" value="Juma" ${daySet.has("Juma") ? "checked" : ""} /><span>Juma</span></label>
                <label class="crm-check-tile"><input type="checkbox" name="lessonDaysSet" value="Boshqa" ${daySet.has("Boshqa") ? "checked" : ""} /><span>Boshqa</span></label>
              </div>
            </div>
            <label><span>Boshlanish vaqti *</span><input name="startTime" type="time" value="${item.startTime || item.start_time || "08:30"}" /></label>
            <label><span>Tugash vaqti *</span><input name="endTime" type="time" value="${item.endTime || item.end_time || "10:00"}" /></label>
            <label class="wide"><span>Qo'shimcha kunlar</span><input name="lessonDays" value="${escapeHtml(Array.from(daySet).filter((day) => !["Toq kunlar","Juft kunlar","Dushanba","Chorshanba","Juma","Boshqa"].includes(day)).join(", ") || item.days || "")}" placeholder="Masalan: Seshanba, Payshanba" /></label>
            <label class="wide"><span>Boshlanish sanasi *</span><input name="startDate" type="date" value="${formatDate(item.startDate || item.starts_at)}" /></label>
          </div>
        </section>
        <section class="crm-form-section-block">
          <div class="crm-form-section-head"><h3>Mas'ul va integratsiyalar</h3><p>O'qituvchi, maosh va kanal sozlamalari.</p></div>
          <div class="crm-form-grid-2">
            <label class="wide"><span>O'qituvchi *</span><select name="teacherId"><option value="">O'qituvchini tanlang</option>${teacherOptions}</select></label>
            <label><span>O'qituvchi maoshi *</span><input name="teacherSalary" type="number" min="0" value="${Number(item.teacher_salary || item.salary_rate || 0)}" placeholder="so'm" /></label>
            <label><span>Maosh turi *</span><select name="salaryType"><option value="fixed" ${(item.salary_type || "fixed") === "fixed" ? "selected" : ""}>Oylik</option><option value="percentage" ${(item.salary_type) === "percentage" ? "selected" : ""}>Foiz</option><option value="per_lesson" ${(item.salary_type) === "per_lesson" ? "selected" : ""}>Darsbay</option></select></label>
            <label class="wide"><span>Telegram Chat ID</span><input name="chatId" value="${escapeHtml(item.chat_id || "")}" placeholder="Masalan: -100..." /></label>
            <div class="crm-field wide">
              <span>Format</span>
              <div class="crm-radio-row">
                <label class="crm-radio-pill"><input type="radio" name="deliveryMode" value="offline" ${(item.delivery_mode || "offline") === "offline" ? "checked" : ""} /><span>offline</span></label>
                <label class="crm-radio-pill"><input type="radio" name="deliveryMode" value="online" ${(item.delivery_mode) === "online" ? "checked" : ""} /><span>online</span></label>
              </div>
            </div>
            <label><span>Status</span><select name="status"><option value="active" ${item.status === "active" ? "selected" : ""}>Faol</option><option value="trial" ${item.status === "trial" ? "selected" : ""}>Sinov darsida</option><option value="archived" ${item.status === "archived" ? "selected" : ""}>Arxiv</option></select></label>
            <label class="wide"><span>Izoh</span><textarea name="note" placeholder="Guruh bo'yicha izoh">${escapeHtml(item.note)}</textarea></label>
          </div>
        </section>
      </div>`;
  }
  if (type === "courses") {
    return `
      <label><span>Kurs nomi *</span><input name="name" required value="${escapeHtml(item.name)}" /></label>
      <label><span>Oylik narx</span><input name="price" type="number" min="0" value="${Number(item.price || 0)}" /></label>
      <label><span>Davomiylik</span><input name="duration" value="${escapeHtml(item.duration)}" /></label>
      <label><span>Daraja</span><input name="level" value="${escapeHtml(item.level)}" /></label>
      <label><span>Turi</span><select name="lesson_type"><option value="group" ${item.lesson_type !== "individual" ? "selected" : ""}>Guruh</option><option value="individual" ${item.lesson_type === "individual" ? "selected" : ""}>Individual</option></select></label>
      <label><span>Status</span><select name="status"><option value="active" ${item.status !== "archived" ? "selected" : ""}>Faol</option><option value="archived" ${item.status === "archived" ? "selected" : ""}>Arxiv</option></select></label>
      <label class="wide"><span>Tavsif</span><textarea name="description">${escapeHtml(item.description)}</textarea></label>`;
  }
  if (type === "rooms") {
    return `
      <label class="wide"><span>Nomi *</span><input name="name" required value="${escapeHtml(item.name)}" placeholder="1-xona" /></label>
      <label class="wide"><span>Xona sig'imi</span><input name="capacity" type="number" min="1" value="${Number(item.capacity || 12)}" /></label>
      <label class="wide"><span>Izoh</span><textarea name="note">${escapeHtml(item.note)}</textarea></label><label class="crm-check-field wide"><input name="print_receipt" type="checkbox" checked /><span>Saqlagandan keyin chek chiqarish</span></label>`;
  }
  if (type === "paymentTypes") {
    return `
      <label class="wide"><span>Nomi *</span><input name="name" required value="${escapeHtml(item.name)}" placeholder="Naqd pul" /></label>
      <label><span>Turi</span><select name="type"><option value="Markaz">Markaz</option><option value="Tizim" ${item.type === "Tizim" ? "selected" : ""}>Tizim</option></select></label>
      <label class="crm-check-field"><input name="active" type="checkbox" ${item.active !== false ? "checked" : ""} /><span>Faol</span></label>`;
  }
  if (["extraIncomes", "salaryPayments", "bonuses", "expenses"].includes(type)) {
    const staffOptions = (state.teachers || []).map((teacher) => `<option value="${teacher.id}" ${String(item.employee_id || item.teacher_id) === String(teacher.id) ? "selected" : ""}>${escapeHtml(teacher.full_name || teacher.fullName)}</option>`).join("");
    const labels = {
      extraIncomes: ["Yangi daromad qo'shish", "Daromad turi", "Xaridor FISH", "Daromad haqida izoh"],
      salaryPayments: ["Ish haqi to'lash", "Maosh turi", "Xodimni tanlang", "Ish haqi izohi"],
      bonuses: ["Yangi bonus qo'shish", "Bonus turi", "Xodim", "Bonus sababi"],
      expenses: ["Yangi xarajat qo'shish", "Bo'limni tanlang", "Xodimni tanlang", "Xarajat sababi"]
    }[type];
    return `<div class="finance-drawer-form">
      <section class="crm-form-section-block"><div class="crm-form-section-head"><h3>${labels[0]}</h3><p>Summa, usul, manba va izohlarni to'ldiring.</p></div>
        <div class="crm-form-grid-2">
          <label class="wide"><span>${type === "expenses" ? "Sabab" : labels[2]} ${type === "extraIncomes" ? "" : "*"}</span>${type === "expenses" ? `<textarea name="reason" required placeholder="Sabab">${escapeHtml(item.reason || item.note || "")}</textarea>` : `<select name="employee_id"><option value="">${labels[2]}</option>${staffOptions}</select>`}</label>
          ${type === "extraIncomes" ? `<label><span>Xaridor FISH</span><input name="customer_name" value="${escapeHtml(item.customer_name || "")}" placeholder="Xaridor" /></label>` : ""}
          <label><span>Narx *</span><input name="amount" type="number" required value="${Number(item.amount || 0)}" placeholder="so'm" /></label>
          <label><span>${labels[1]} *</span><select name="category"><option value="${escapeHtml(item.category || "default")}">${escapeHtml(item.category || labels[1])}</option><option value="kassa">Kassa</option><option value="hisob">Hisob</option><option value="marketing">Marketing</option><option value="office">Ofis</option></select></label>
          <label><span>To'lov usuli *</span><select name="payment_type"><option value="Naqd pul">Naqd pul</option><option value="Plastik karta">Plastik karta</option><option value="Bank hisobi">Bank hisobi</option></select></label>
          <div class="crm-field wide"><span>Qayerdan olinganligi *</span><div class="crm-radio-row"><label class="crm-radio-pill"><input type="radio" name="source" value="kassa" ${(item.source || "kassa") === "kassa" ? "checked" : ""} /><span>kassa</span></label><label class="crm-radio-pill"><input type="radio" name="source" value="hisob" ${item.source === "hisob" ? "checked" : ""} /><span>hisob</span></label></div></div>
          <label class="wide"><span>Sana *</span><input name="date" type="date" value="${crmFinanceDate(item)}" /></label>
          <label class="wide"><span>Izoh</span><textarea name="note" placeholder="${labels[3]}">${escapeHtml(item.note || "")}</textarea></label>
        </div>
      </section>
    </div>`;
  }
  if (type === "payments") {
    const studentOptions = (state.students || []).map((student) => `<option value="${student.id}" ${String(item.student_id) === String(student.id) ? "selected" : ""}>${escapeHtml(student.full_name || student.fullName)}</option>`).join("");
    const groupOptionsPayment = (state.groups || []).map((group) => `<option value="${group.id}" ${String(item.group_id) === String(group.id) ? "selected" : ""}>${escapeHtml(group.name)}</option>`).join("");
    return `
      <label><span>Talaba *</span><select name="student_id" required><option value="">Talaba tanlang</option>${studentOptions}</select></label>
      <label><span>Guruh</span><select name="group_id"><option value="">Guruh</option>${groupOptionsPayment}</select></label>
      <label><span>Oy</span><input name="payment_month" value="${escapeHtml(item.payment_month || new Date().toISOString().slice(0, 7))}" /></label>
      <label><span>To'lanishi kerak</span><input name="due_amount" type="number" value="${Number(item.due_amount || item.amount || 0)}" /></label>
      <label><span>To'langan summa</span><input name="amount" type="number" value="${Number(item.amount || 0)}" /></label>
      <label><span>Chegirma</span><input name="discount" type="number" value="${Number(item.discount || 0)}" /></label>
      <label><span>To'lov usuli</span><select name="payment_type"><option value="Naqd pul" ${(item.payment_type || "Naqd pul") === "Naqd pul" || item.payment_type === "naqd" ? "selected" : ""}>Naqd pul</option><option value="Plastik karta" ${item.payment_type === "Plastik karta" || item.payment_type === "karta" ? "selected" : ""}>Plastik karta</option><option value="Click" ${item.payment_type === "Click" || item.payment_type === "click" ? "selected" : ""}>Click</option><option value="Payme" ${item.payment_type === "Payme" || item.payment_type === "payme" ? "selected" : ""}>Payme</option><option value="Bank hisobi" ${item.payment_type === "Bank hisobi" || item.payment_type === "bank" ? "selected" : ""}>Bank hisobi</option></select></label>
      <label><span>Sana</span><input name="paid_at" type="date" value="${formatDate(item.paid_at) || new Date().toISOString().slice(0, 10)}" /></label>
      <label class="wide"><span>Izoh</span><textarea name="note">${escapeHtml(item.note)}</textarea></label>`;
  }
  if (type === "leads") {
    return `
      <label><span>Ism *</span><input name="full_name" required value="${escapeHtml(item.full_name || item.name)}" /></label>
      <label><span>Telefon *</span><input name="phone" required value="${escapeHtml(item.phone)}" /></label>
      <label><span>Qiziqqan kurs</span><select name="course_name"><option value="">Kurs</option>${courseOptions}</select></label>
      <label><span>Manba</span><input name="source" value="${escapeHtml(item.source || "Instagram")}" /></label>
      <label><span>Status</span><select name="status"><option value="new">Yangi</option><option value="contacted">Aloqa qilindi</option><option value="trial">Sinov dars</option><option value="paid">O'quvchiga aylandi</option><option value="lost">Rad etdi</option><option value="later">Keyinroq</option></select></label>
      <label><span>Mas'ul manager</span><input name="manager_name" value="${escapeHtml(item.manager_name)}" /></label>
      <label class="wide"><span>Izoh</span><textarea name="note">${escapeHtml(item.note)}</textarea></label>`;
  }
  return `
    <label><span>FISH *</span><input name="fullName" required value="${escapeHtml(item.fullName || item.full_name)}" /></label>
    <label><span>Telefon raqam *</span><input name="phone" required placeholder="+(998) __-___-__-__" value="${escapeHtml(item.phone)}" /></label>
    <label><span>Email</span><input name="email" type="email" value="${escapeHtml(item.email)}" /></label>
    <label><span>Tug'ilgan sana</span><input name="birthDate" type="date" value="${formatDate(item.birthDate || item.birth_date)}" /></label>
    <label><span>Jinsi</span><select name="gender"><option value="">Tanlang</option><option value="male" ${item.gender === "male" ? "selected" : ""}>Erkak</option><option value="female" ${item.gender === "female" ? "selected" : ""}>Ayol</option></select></label>
    <label><span>Manzil</span><input name="address" value="${escapeHtml(item.address)}" /></label>
    <label><span>Fan/Kurs</span><select name="course"><option value="">Fan/Kurs</option>${courseOptions}</select></label>
    <label><span>Guruhlar</span><select name="groupId"><option value="">Guruhni tanlang</option>${groupOptions}</select></label>
    <label><span>Maosh turi</span><select name="salaryType"><option value="fixed" ${(item.salaryType || item.salary_type) === "fixed" ? "selected" : ""}>Oylik</option><option value="per_lesson" ${(item.salaryType || item.salary_type) === "per_lesson" ? "selected" : ""}>Darsbay</option><option value="percentage" ${(item.salaryType || item.salary_type || "percentage") === "percentage" ? "selected" : ""}>Foiz</option></select></label>
    <label><span>Maosh qiymati</span><input name="salaryValue" type="number" min="0" value="${Number(item.salaryValue || item.salary_rate || 50)}" /></label>
    <label class="crm-check-field"><input name="loginEnabled" type="checkbox" ${item.loginEnabled ? "checked" : ""} /><span>Login yaratish</span></label>
    <label class="wide"><span>Izoh</span><textarea name="note">${escapeHtml(item.note)}</textarea></label>`;
}

function renderDrawer() {
  const drawer = document.querySelector("[data-crm-drawer]");
  const form = document.querySelector("[data-crm-drawer-form]");
  const backdrop = document.querySelector("[data-crm-drawer-backdrop]");
  if (!drawer || !form || !backdrop) return;
  drawer.classList.toggle("open", crmDrawerState.open);
  drawer.classList.toggle("is-wide", ["students", "groups"].includes(crmDrawerState.type));
  backdrop.classList.toggle("open", crmDrawerState.open);
  drawer.setAttribute("aria-hidden", crmDrawerState.open ? "false" : "true");
  drawer.dataset.drawerType = crmDrawerState.type || "";
  if (!crmDrawerState.open) {
    form.innerHTML = "";
    return;
  }
  form.innerHTML = `
    <header class="crm-drawer-head"><div><span>Eduka CRM</span><h2>${crmDrawerTitle()}</h2></div><button type="button" data-crm-action="close-drawer" aria-label="Yopish"><i data-lucide="x"></i></button></header>
    <div class="crm-drawer-body">${crmDrawerFields(crmDrawerState.type, crmDrawerItem())}<div class="form-error" data-crm-drawer-error></div></div>
    <footer class="crm-drawer-footer"><button type="button" data-crm-action="close-drawer">Yopish</button><button type="submit">Saqlash</button></footer>`;
  refreshIcons();
}

function openDrawer(type, item = null) {
  crmDrawerState.open = true;
  crmDrawerState.type = type;
  crmDrawerState.itemId = item?.id || null;
  crmDrawerState.prefill = item && !item.id ? item : null;
  crmDrawerState.dirty = false;
  renderDrawer();
}

function closeDrawer(force = false) {
  if (!force && crmDrawerState.dirty && !window.confirm("Kiritilgan ma'lumotlar saqlanmagan. Yopilsinmi?")) return;
  crmDrawerState.open = false;
  crmDrawerState.type = "";
  crmDrawerState.itemId = null;
  crmDrawerState.prefill = null;
  crmDrawerState.dirty = false;
  renderDrawer();
}

function validateCrmDrawer(type, data) {
  if ((type === "students" || type === "teachers") && !data.fullName?.trim()) return "FISH majburiy.";
  if (type === "groups" && !data.name?.trim()) return "Guruh nomi majburiy.";
  if (type === "courses" && !data.name?.trim()) return "Kurs nomi majburiy.";
  if (type === "rooms" && !data.name?.trim()) return "Xona nomi majburiy.";
  if (type === "paymentTypes" && !data.name?.trim()) return "To'lov turi nomi majburiy.";
  if (type === "leads" && !data.full_name?.trim()) return "Ism majburiy.";
  if (type === "payments" && !data.student_id) return "Talaba tanlang.";
  if ((type === "students" || type === "teachers") && normalizeDigits(data.phone).length < 9) return "Telefon raqamni to'g'ri kiriting.";
  if (type === "leads" && normalizeDigits(data.phone).length < 9) return "Telefon raqamni to'g'ri kiriting.";
  if (data.email && !validateEmail(data.email)) return "Email formatini tekshiring.";
  return "";
}

function crmApiPayload(resource, item) {
  if (resource === "students") return { full_name: item.full_name, phone: item.phone, parent_phone: item.parent_phone, birth_date: item.birth_date, address: item.address, course_name: item.course_name, group_id: item.group_id || null, payment_type: item.paymentType || item.payment_type, discount: item.discount, status: item.status, balance: item.balance, note: item.note };
  if (resource === "groups") return { name: item.name, course_name: item.course_name, status: item.status, teacher_id: item.teacher_id || null, teacher_name: item.teacher_name, days: item.days, start_time: item.start_time, end_time: item.end_time, monthly_price: item.monthly_price, starts_at: item.starts_at, room: item.room, note: item.note };
  if (resource === "teachers") return { full_name: item.full_name, phone: item.phone, email: item.email, course_name: item.course_name, groups: crmTeacherGroups(item).join(", "), login_enabled: item.loginEnabled, status: item.status, salary_type: item.salary_type, salary_rate: item.salary_rate, note: item.note };
  if (resource === "courses") return { name: item.name, description: item.description, price: item.price, duration: item.duration, level: item.level, lesson_type: item.lesson_type, status: item.status };
  if (["extraIncomes", "salaryPayments", "bonuses", "expenses"].includes(resource)) return { type: item.type, category: item.category, amount: item.amount, payment_type_id: item.payment_type_id || null, employee_id: item.employee_id || null, reason: item.reason || item.title || item.note, note: item.note, transaction_date: item.transaction_date || item.date, payment_type: item.payment_type, source: item.source, customer_name: item.customer_name };
  if (resource === "payments") return { student_id: item.student_id || null, group_id: item.group_id || null, payment_month: item.payment_month, due_amount: item.due_amount, amount: item.amount, discount: item.discount, payment_type: item.payment_type, paid_at: item.paid_at, payment_date: item.paid_at, note: item.note };
  if (resource === "leads") return { full_name: item.full_name, phone: item.phone, course_name: item.course_name, source: item.source, status: item.status, manager_name: item.manager_name, note: item.note };
  return item;
}

async function saveCrmDrawer(form) {
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  const lessonDaysSet = formData.getAll("lessonDaysSet").filter(Boolean);
  if (lessonDaysSet.length) data.lessonDaysSet = lessonDaysSet;
  const error = validateCrmDrawer(crmDrawerState.type, data);
  const errorNode = form.querySelector("[data-crm-drawer-error]");
  if (error) {
    if (errorNode) errorNode.textContent = error;
    return;
  }
  const resource = crmDrawerState.type;
  const editing = Boolean(crmDrawerState.itemId);
  const existing = crmDrawerItem();
  let item;
  if (resource === "students") {
    const notificationChannels = ["telegram", "call", "visit", "document", "sms"].filter((key) => data[`channel_${key}`] === "on");
    item = { ...existing, id: editing ? existing.id : nextCrmId("students"), fullName: data.fullName.trim(), full_name: data.fullName.trim(), phone: data.phone, parentPhone: data.parentPhone, parent_phone: data.parentPhone, birthDate: data.birthDate, birth_date: data.birthDate, gender: data.gender, address: data.address, fatherName: data.fatherName, motherName: data.motherName, note: data.note, groupIds: data.groupId ? [Number(data.groupId)] : [], group_id: data.groupId || "", group_name: crmGroupName(data.groupId, existing.group_name), course: data.course || state.groups.find((entry) => String(entry.id) === String(data.groupId))?.course_name || existing.course, course_name: data.course || state.groups.find((entry) => String(entry.id) === String(data.groupId))?.course_name || existing.course_name, teacher: crmTeacherName(data.teacherId, existing.teacher || existing.teacher_full_name), teacher_id: data.teacherId || "", status: data.status || "active", tags: String(data.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean), balance: Number(existing.balance || 0), discount: Number(data.discount || 0), paymentType: data.paymentType || "monthly", payment_type: data.paymentType || "monthly", startDate: data.startDate || existing.startDate, created_at: existing.created_at || data.startDate || new Date().toISOString().slice(0, 10), password_preview: data.password || existing.password_preview || "", notificationChannels };
  } else if (resource === "groups") {
    const selectedDays = Array.isArray(data.lessonDaysSet) ? data.lessonDaysSet : [data.lessonDaysSet].filter(Boolean);
    const customDays = String(data.lessonDays || "").split(",").map((day) => day.trim()).filter(Boolean);
    const lessonDays = [...selectedDays, ...customDays].filter(Boolean);
    item = { ...existing, id: editing ? existing.id : nextCrmId("groups"), name: data.name.trim(), course: data.course, course_name: data.course, teacherIds: data.teacherId ? [Number(data.teacherId)] : [], teacher_id: data.teacherId || "", teacher_name: crmTeacherName(data.teacherId, existing.teacher_name), teacher_full_name: crmTeacherName(data.teacherId, existing.teacher_full_name), room: data.room, price: Number(data.price || 0), monthly_price: Number(data.price || 0), startTime: data.startTime, start_time: data.startTime, endTime: data.endTime, end_time: data.endTime, lessonDays, days: lessonDays.join(", "), startDate: data.startDate, starts_at: data.startDate, status: data.status || "active", note: data.note, studentCount: existing.studentCount || existing.student_count || 0, student_count: existing.student_count || existing.studentCount || 0, teacher_salary: Number(data.teacherSalary || existing.teacher_salary || 0), salary_rate: Number(data.teacherSalary || existing.salary_rate || 0), salary_type: data.salaryType || existing.salary_type || "fixed", chat_id: data.chatId || existing.chat_id || "", delivery_mode: data.deliveryMode || existing.delivery_mode || "offline" };
  } else if (resource === "courses") {
    item = { ...existing, id: editing ? existing.id : nextCrmId("courses"), name: data.name.trim(), description: data.description, price: Number(data.price || 0), duration: data.duration, level: data.level, lesson_type: data.lesson_type || "group", status: data.status || "active" };
  } else if (resource === "rooms") {
    item = { ...existing, id: editing ? existing.id : nextCrmId("rooms"), name: data.name.trim(), capacity: Number(data.capacity || 0), note: data.note };
  } else if (resource === "paymentTypes") {
    item = { ...existing, id: editing ? existing.id : nextCrmId("paymentTypes"), name: data.name.trim(), type: data.type || "Markaz", active: data.active === "on" };
  } else if (["extraIncomes", "salaryPayments", "bonuses", "expenses"].includes(resource)) {
    const staff = state.teachers.find((entry) => String(entry.id) === String(data.employee_id));
    const typeByResource = { extraIncomes: "income", salaryPayments: "salary", bonuses: "bonus", expenses: "expense" };
    const categoryByResource = { extraIncomes: "extra-income", salaryPayments: "salary", bonuses: "bonus", expenses: "expense" };
    item = { ...existing, id: editing ? existing.id : nextCrmId(resource), type: typeByResource[resource], category: data.category || categoryByResource[resource], employee_id: data.employee_id || "", teacher_id: data.employee_id || "", employee_name: staff?.full_name || staff?.fullName || data.employee_name || "", staff_name: staff?.full_name || staff?.fullName || currentUser?.fullName || currentUser?.name || "CEO", customer_name: data.customer_name || "", reason: data.reason || data.note || "", title: data.reason || data.category || data.note || "", amount: Number(data.amount || 0), payment_type_id: data.payment_type_id || null, payment_type: data.payment_type || "Naqd pul", source: data.source || "kassa", transaction_date: data.date || data.transaction_date || new Date().toISOString().slice(0, 10), date: data.date || new Date().toISOString().slice(0, 10), created_at: existing.created_at || new Date().toISOString(), note: data.note };
  } else if (resource === "payments") {
    const student = state.students.find((entry) => String(entry.id) === String(data.student_id));
    const group = state.groups.find((entry) => String(entry.id) === String(data.group_id || student?.group_id));
    item = { ...existing, id: editing ? existing.id : nextCrmId("payments"), student_id: data.student_id, student_name: student?.full_name || student?.fullName || "", group_id: data.group_id || student?.group_id || "", group_name: group?.name || student?.group_name || "", payment_month: data.payment_month, due_amount: Number(data.due_amount || 0), amount: Number(data.amount || 0), discount: Number(data.discount || 0), status: paymentStatusFrom(data.amount, data.due_amount, data.discount), payment_type: data.payment_type, paid_at: data.paid_at, note: data.note };
    if (student) student.balance = paymentRemainder(item);
  } else if (resource === "leads") {
    item = { ...existing, id: editing ? existing.id : nextCrmId("leads"), full_name: data.full_name.trim(), phone: data.phone, course_name: data.course_name, source: data.source, status: data.status || "new", manager_name: data.manager_name, note: data.note, created_at: existing.created_at || new Date().toISOString() };
  } else {
    item = { ...existing, id: editing ? existing.id : nextCrmId("teachers"), fullName: data.fullName.trim(), full_name: data.fullName.trim(), phone: data.phone, email: data.email, birthDate: data.birthDate, birth_date: data.birthDate, gender: data.gender, address: data.address, course: data.course, course_name: data.course, groupIds: data.groupId ? [Number(data.groupId)] : [], salaryType: data.salaryType, salary_type: data.salaryType, salaryValue: Number(data.salaryValue || 0), salary_rate: Number(data.salaryValue || 0), loginEnabled: data.loginEnabled === "on", status: existing.status || "active", note: data.note };
  }
  try {
    const endpoint = endpoints[resource] || modalFields[resource]?.endpoint;
    if (endpoint) {
      const result = await api(editing ? `${endpoint}/${item.id}` : endpoint, { method: editing ? "PUT" : "POST", body: JSON.stringify(crmApiPayload(resource, item)) });
      if (result.item) item = { ...item, ...result.item };
      if (resource === "students" && data.password && item.id) {
        await api(`/api/students/${item.id}/app-password`, { method: "POST", body: JSON.stringify({ password: data.password }) });
        item.student_app_enabled = true;
        item.password_preview = data.password;
      }
      if (resource === "payments" && data.print_receipt === "on" && item.id) await printPaymentReceipt(item.id);
      if (Array.isArray(state[resource])) {
        if (editing) state[resource] = state[resource].map((entry) => String(entry.id) === String(item.id) ? item : entry);
        else state[resource].unshift(item);
      }
      if (["extraIncomes", "salaryPayments", "bonuses", "expenses"].includes(resource)) await loadFinanceBuckets();
    } else {
      if (editing) state[resource] = state[resource].map((entry) => String(entry.id) === String(item.id) ? item : entry);
      else state[resource].unshift(item);
      if (allowDevelopmentFallback()) persistCrmCollections();
    }
  } catch (error) {
    if (allowDevelopmentFallback()) {
      if (editing) state[resource] = state[resource].map((entry) => String(entry.id) === String(item.id) ? item : entry);
      else state[resource].unshift(item);
      persistCrmCollections();
    } else {
      if (errorNode) errorNode.textContent = error.message || "Ma'lumot saqlanmadi";
      showToast(error.message || "Ma'lumot saqlanmadi", "error");
      return;
    }
  }
  closeDrawer(true);
  if (stateMeta[resource] || ["extraIncomes", "salaryPayments", "bonuses", "expenses"].includes(resource)) await refreshAll();
  else renderAll();
  showToast(editing ? "Ma'lumotlar saqlandi." : "Yangi ma'lumot ro'yxatga qo'shildi.");
}

function crmInitials(name = "") {
  return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "ST";
}

function crmStudentCoinBalance(student) {
  if (Number.isFinite(Number(student.coins || student.tanga || student.coin_balance))) return Number(student.coins || student.tanga || student.coin_balance || 0);
  const attendanceCount = state.attendance.filter((item) => String(item.student_id || "") === String(student.id) || item.student_name === (student.full_name || student.fullName)).length;
  return attendanceCount * 10;
}

function crmStudentCrystalBalance(student) {
  if (Number.isFinite(Number(student.crystals || student.kristal || student.crystal_balance))) return Number(student.crystals || student.kristal || student.crystal_balance || 0);
  const paymentCount = state.payments.filter((item) => String(item.student_id || "") === String(student.id)).length;
  return paymentCount * 2;
}

function crmStudentsForGroup(group) {
  return (state.students || []).filter((student) => {
    const ids = Array.isArray(student.groupIds) ? student.groupIds.map(String) : [String(student.group_id || "")].filter(Boolean);
    return ids.includes(String(group.id)) || String(student.group_name || "") === String(group.name);
  });
}

function crmAttendanceForStudent(student) {
  return (state.attendance || []).filter((item) => String(item.student_id || "") === String(student.id) || item.student_name === (student.full_name || student.fullName));
}

function crmAttendanceForGroup(group) {
  return (state.attendance || []).filter((item) => String(item.group_id || "") === String(group.id) || item.group_name === group.name);
}

function crmProfileEmpty(title, hint = "Hozircha ma'lumot topilmadi.") {
  return `<div class="profile-empty"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(hint)}</span></div>`;
}

function crmProfileTable(headers, rows, emptyTitle = "Ma'lumot topilmadi", emptyHint = "Bu bo'lim uchun yozuvlar hali mavjud emas.") {
  return `<div class="profile-table-wrap"><table class="profile-table"><thead><tr>${headers.map((head) => `<th>${head}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.join("") : `<tr><td colspan="${headers.length}">${crmProfileEmpty(emptyTitle, emptyHint)}</td></tr>`}</tbody></table></div>`;
}

function crmStudentHistory(student, payments, attendance, groups) {
  const events = [];
  if (student.created_at || student.startDate || student.birth_date) {
    events.push({ date: student.created_at || student.startDate || student.birth_date, title: "Talaba qo'shildi", detail: crmCenterTitle() });
  }
  groups.forEach((group) => events.push({ date: group.starts_at || group.startDate || student.created_at, title: "Guruhga biriktirildi", detail: group.name }));
  payments.forEach((payment) => events.push({ date: payment.paid_at || payment.paymentDate, title: "To'lov qo'shildi", detail: `${formatMoney(payment.amount || payment.paid_amount || 0)} · ${payment.group_name || crmGroupName(payment.group_id)}` }));
  attendance.forEach((item) => events.push({ date: item.lesson_date, title: "Davomat qayd etildi", detail: `${statusLabels[item.status] || item.status} · ${item.group_name || ""}` }));
  return events.filter((item) => item.date).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 12);
}

function crmStudentProfileMarkup(student) {
  const payments = (state.payments || []).filter((item) => String(item.student_id || "") === String(student.id));
  const attendance = crmAttendanceForStudent(student);
  const groups = crmStudentGroups(student).map((name) => (state.groups || []).find((entry) => entry.name === name || String(entry.id) === String(student.group_id))).filter(Boolean);
  const coins = crmStudentCoinBalance(student);
  const crystals = crmStudentCrystalBalance(student);
  const history = crmStudentHistory(student, payments, attendance, groups);
  const discounts = payments.filter((item) => Number(item.discount || 0) > 0);
  const coinRows = [
    { section: "Attendance", type: "coins", amount: Math.max(coins - Math.floor(crystals * 0.5), 0), date: student.created_at || new Date().toISOString().slice(0, 10) },
    { section: "Exam", type: "coins", amount: Math.floor(coins / 2), date: student.created_at || new Date().toISOString().slice(0, 10) },
    { section: "Reason", type: "crystal", amount: crystals, date: student.created_at || new Date().toISOString().slice(0, 10) }
  ].filter((row) => Number(row.amount) > 0);
  return `
    <div class="profile-page-head">
      <div><button class="crm-back-link" type="button" data-view="students">← Ro'yxatga qaytish</button><h1>${escapeHtml(student.full_name || student.fullName)}</h1><p>${escapeHtml(student.course_name || student.course || "-")} / ${escapeHtml(crmStudentGroups(student)[0] || "-")}</p></div>
      <div class="crm-head-actions"><button type="button" data-crm-action="edit" data-resource="students" data-id="${student.id}">Tahrirlash</button><button type="button" data-crm-action="payment" data-resource="students" data-id="${student.id}">To'lov qo'shish</button></div>
    </div>
    <div class="profile-shell" data-profile-root="student">
      <aside class="profile-sidebar">
        <section class="profile-card profile-hero-card">
          <div class="profile-avatar">${escapeHtml(crmInitials(student.full_name || student.fullName))}</div>
          <div class="profile-hero-meta"><h2>${escapeHtml(student.full_name || student.fullName)}</h2><p>ID: ${escapeHtml(String(student.id || "-"))}</p></div>
          <div class="profile-metric-pills">
            <span class="metric-pill ${Number(student.balance || 0) > 0 ? "danger" : ""}">${formatMoney(student.balance || 0)} balans</span>
            <span class="metric-pill gold">${coins} tanga</span>
            <span class="metric-pill mint">${crystals} kristal</span>
          </div>
          <div class="profile-summary-list compact">
            <div><span>Telefon raqam</span><strong>${escapeHtml(student.phone || "-")}</strong></div>
            <div><span>Tug'ilgan sana</span><strong>${formatDate(student.birth_date || student.birthDate) || "-"}</strong></div>
            <div><span>Ota-ona</span><strong>${escapeHtml(student.parent_phone || student.parentPhone || "-")}</strong></div>
            <div><span>Qo'shilgan sana</span><strong>${formatDate(student.created_at || student.startDate) || "-"}</strong></div>
          </div>
          <button class="profile-link-button" type="button" data-crm-action="edit" data-resource="students" data-id="${student.id}">+ qo'shimcha ma'lumot</button>
        </section>
        <section class="profile-card note-card">
          <div class="profile-card-head"><h3>Eslatma</h3><button type="button" data-crm-action="edit" data-resource="students" data-id="${student.id}">✎</button></div>
          <p>${escapeHtml(student.note || "Izoh kiritilmagan")}</p>
        </section>
      </aside>
      <section class="profile-main">
        <div class="profile-tabs-wrap">
          <div class="profile-tabs">
            <button class="active" type="button" data-crm-action="profile-tab" data-profile-target="groups">Guruhlar</button>
            <button type="button" data-crm-action="profile-tab" data-profile-target="payments">To'lovlar</button>
            <button type="button" data-crm-action="profile-tab" data-profile-target="wallet">Tanga/Kristal hisobi</button>
            <button type="button" data-crm-action="profile-tab" data-profile-target="note">Eslatma</button>
            <button type="button" data-crm-action="profile-tab" data-profile-target="discounts">Chegirma</button>
            <button type="button" data-crm-action="profile-tab" data-profile-target="exams">Imtihonlar</button>
            <button type="button" data-crm-action="profile-tab" data-profile-target="history">Tarix</button>
            <button type="button" data-crm-action="profile-tab" data-profile-target="purchases">Xaridlar</button>
            <button type="button" data-crm-action="profile-tab" data-profile-target="sms">SMS</button>
          </div>
        </div>
        <section class="profile-panel active" data-profile-panel="groups">
          <div class="profile-panel-grid">${groups.length ? groups.map((group) => `<article class="profile-info-card"><div class="profile-info-card-head"><h3>${escapeHtml(group.name)}</h3><span class="profile-chip">${escapeHtml(group.status || "active")}</span></div><div class="profile-summary-list"><div><span>O'qituvchi</span><strong>${escapeHtml(crmGroupTeachers(group)[0] || "-")}</strong></div><div><span>Dars kunlari</span><strong>${escapeHtml(group.days || group.lessonDays?.join(", ") || "-")}</strong></div><div><span>Vaqti</span><strong>${escapeHtml(group.start_time || group.startTime || "-")} - ${escapeHtml(group.end_time || group.endTime || "-")}</strong></div><div><span>Narxi</span><strong>${formatMoney(group.monthly_price || group.price || 0)}</strong></div></div><div class="profile-info-card-footer"><button type="button" data-view="group-profile" data-id="${group.id}">Davomat &amp; Baho →</button></div></article>`).join("") : crmProfileEmpty("Guruh biriktirilmagan", "Talabani guruhga qo'shgandan so'ng bu yerda ko'rinadi.")}</div>
        </section>
        <section class="profile-panel" data-profile-panel="payments" hidden>
          ${crmProfileTable(["SANA", "NARX", "GURUH", "HOLATI", "TO'LOV TURI"], payments.map((item) => `<tr><td>${formatDate(item.paid_at || item.paymentDate) || "-"}</td><td><strong class="${paymentRemainder(item) > 0 ? "text-danger" : "text-success"}">${formatMoney(item.amount || item.paid_amount || 0)}</strong> <small>(${paymentRemainder(item)} so'm qoldiq)</small></td><td>${escapeHtml(item.group_name || crmGroupName(item.group_id))}</td><td>${renderBadge(item.status || (paymentRemainder(item) ? "partial" : "paid"))}</td><td>${escapeHtml(item.payment_type || item.method || "-")}</td></tr>`), "To'lov topilmadi", "Bu talaba uchun hali to'lovlar kiritilmagan.")}
        </section>
        <section class="profile-panel" data-profile-panel="wallet" hidden>
          <div class="wallet-summary"><div><b>Tangalar:</b> <span class="metric-pill gold">${coins}</span></div><div><b>Kristall:</b> <span class="metric-pill mint">${crystals}</span></div></div>
          ${crmProfileTable(["BO'LIM", "TURI", "SONI", "YARATILGAN VAQTI"], coinRows.map((row) => `<tr><td>${escapeHtml(row.section)}</td><td><span class="profile-chip ${row.type === "coins" ? "gold" : "mint"}">${row.type === "coins" ? "coins" : "crystal"}</span></td><td>${escapeHtml(String(row.amount))}</td><td>${formatDate(row.date) || "-"}</td></tr>`), "Wallet yozuvlari yo'q", "Tanga va kristal harakatlari shu yerda chiqadi.")}
        </section>
        <section class="profile-panel" data-profile-panel="note" hidden>
          <article class="profile-rich-note"><h3>Eslatma</h3><p>${escapeHtml(student.note || "Bu talaba uchun izoh kiritilmagan.")}</p></article>
        </section>
        <section class="profile-panel" data-profile-panel="discounts" hidden>
          ${crmProfileTable(["GURUH", "QIYMAT", "OY", "SABAB"], discounts.map((item) => `<tr><td>${escapeHtml(item.group_name || crmGroupName(item.group_id))}</td><td>${formatMoney(item.discount || 0)}</td><td>${escapeHtml(item.payment_month || "-")}</td><td>${escapeHtml(item.note || "Chegirma qo'llangan")}</td></tr>`), "Chegirma mavjud emas", "Bu talaba uchun hali chegirma kiritilmagan.")}
        </section>
        <section class="profile-panel" data-profile-panel="exams" hidden>
          ${crmProfileTable(["NOMI", "SANA", "BAL", "O'RNI", "GURUH"], (student.exams || []).map((item) => `<tr><td>${escapeHtml(item.name || item.title || "Imtihon")}</td><td>${formatDate(item.date) || "-"}</td><td>${escapeHtml(String(item.score || item.ball || "-"))}</td><td>${escapeHtml(String(item.rank || item.place || "-"))}</td><td>${escapeHtml(item.group_name || crmStudentGroups(student)[0] || "-")}</td></tr>`), "Imtihon topilmadi", "Imtihon natijalari kiritilganda shu yerda ko'rinadi.")}
        </section>
        <section class="profile-panel" data-profile-panel="history" hidden>
          <div class="timeline-list">${history.length ? history.map((event) => `<article><strong>${escapeHtml(event.title)}</strong><span>${escapeHtml(event.detail || "")}</span><time>${formatDate(event.date) || "-"}</time></article>`).join("") : crmProfileEmpty("Tarix topilmadi", "Jarayonlarga ulangan loglar shu yerda chiqadi.")}</div>
        </section>
        <section class="profile-panel" data-profile-panel="purchases" hidden>
          ${crmProfileTable(["NOMI", "SUMMA", "TANGALAR", "TO'LOV USULI", "SANA"], (student.purchases || []).map((item) => `<tr><td>${escapeHtml(item.name || item.title || "-")}</td><td>${formatMoney(item.amount || 0)}</td><td>${escapeHtml(String(item.coins || 0))}</td><td>${escapeHtml(item.payment_type || "-")}</td><td>${formatDate(item.date) || "-"}</td></tr>`), "Ma'lumot topilmadi", "Talaba market yoki shop xaridlari shu yerda ko'rinadi.")}
        </section>
        <section class="profile-panel" data-profile-panel="sms" hidden>
          ${crmProfileTable(["KANAL", "MATN", "HOLAT", "VAQT"], (student.smsHistory || []).map((item) => `<tr><td>${escapeHtml(item.channel || "SMS")}</td><td>${escapeHtml(item.text || item.message || "-")}</td><td>${renderBadge(item.status || "sent")}</td><td>${formatDate(item.date || item.created_at) || "-"}</td></tr>`), "Xabarlar yo'q", "SMS va boshqa yuborilgan xabarlar shu yerda ko'rinadi.")}
        </section>
      </section>
    </div>`;
}

function crmGroupProfileMarkup(group) {
  const groupStudents = crmStudentsForGroup(group);
  const attendance = crmAttendanceForGroup(group);
  const payments = (state.payments || []).filter((item) => String(item.group_id || "") === String(group.id) || item.group_name === group.name);
  const dates = [...new Set(attendance.map((item) => formatDate(item.lesson_date)).filter(Boolean))].slice(0, 8);
  const dateHeaders = dates.length ? dates : [];
  const gradingDates = dateHeaders.length ? dateHeaders : [formatDate(group.starts_at || group.startDate) || "Bugun"];
  const discountRows = payments.filter((item) => Number(item.discount || 0) > 0);
  const history = [{ date: group.starts_at || group.startDate, title: "Guruh yaratildi", detail: group.name }, ...groupStudents.map((student) => ({ date: student.created_at || group.starts_at, title: "Talaba guruhga qo'shildi", detail: student.full_name || student.fullName }))].filter((item) => item.date).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 12);
  return `
    <div class="profile-page-head">
      <div><button class="crm-back-link" type="button" data-view="groups">← Ro'yxatga qaytish</button><h1>${escapeHtml(group.name)}</h1><p>${escapeHtml(group.course_name || group.course || "-")} / ${escapeHtml(crmGroupTeachers(group)[0] || "-")}</p></div>
      <div class="crm-head-actions"><button type="button" data-crm-action="edit" data-resource="groups" data-id="${group.id}">Tahrirlash</button><button type="button" data-view="attendance">Davomat olish</button></div>
    </div>
    <div class="profile-shell" data-profile-root="group">
      <aside class="profile-sidebar">
        <section class="profile-card profile-hero-card">
          <div class="profile-hero-meta stacked"><h2>${escapeHtml(group.name)}</h2><p>O'qituvchi: <b>${escapeHtml(crmGroupTeachers(group)[0] || "-")}</b></p><p>Narx: <b>${formatMoney(group.monthly_price || group.price || 0)}</b></p><p>Vaqt: <b>${escapeHtml(group.start_time || group.startTime || "-")} - ${escapeHtml(group.end_time || group.endTime || "-")}</b></p><p>Kurs: <b>${escapeHtml(group.course_name || group.course || "-")}</b></p><p>Xona: <b>${escapeHtml(group.room || "-")}</b></p><p>Dars kunlari: <b>${escapeHtml(group.days || group.lessonDays?.join(", ") || "-")}</b></p></div>
          <div class="profile-student-list">${groupStudents.map((student, index) => `<div class="student-row"><span>${index + 1}</span><b>${escapeHtml(student.full_name || student.fullName)}</b><small>${escapeHtml(student.phone || "-")}</small></div>`).join("") || `<div class="profile-empty-inline">Talaba biriktirilmagan</div>`}</div>
          <div class="profile-side-actions"><button type="button" data-open-modal="students">Talaba qo'shish</button><button type="button" data-crm-action="active-students-report">+ arxivlanganlar</button></div>
        </section>
      </aside>
      <section class="profile-main">
        <div class="profile-tabs-wrap"><div class="profile-tabs">
          <button class="active" type="button" data-crm-action="profile-tab" data-profile-target="attendance">Davomat</button>
          <button type="button" data-crm-action="profile-tab" data-profile-target="grading">Baholash</button>
          <button type="button" data-crm-action="profile-tab" data-profile-target="homework">Mashqlar</button>
          <button type="button" data-crm-action="profile-tab" data-profile-target="discounts">Chegirma</button>
          <button type="button" data-crm-action="profile-tab" data-profile-target="exams">Imtihonlar</button>
          <button type="button" data-crm-action="profile-tab" data-profile-target="history">Tarix</button>
          <button type="button" data-crm-action="profile-tab" data-profile-target="note">Izoh</button>
        </div></div>
        <section class="profile-panel active" data-profile-panel="attendance">
          ${dateHeaders.length ? crmProfileTable(["TALABALAR", ...dateHeaders], groupStudents.map((student) => `<tr><td>${escapeHtml(student.full_name || student.fullName)}</td>${dateHeaders.map((date) => { const record = attendance.find((item) => (String(item.student_id || "") === String(student.id) || item.student_name === (student.full_name || student.fullName)) && formatDate(item.lesson_date) === date); const status = record?.status || ""; const label = status === "present" ? "✓" : status === "late" ? "◔" : status === "absent" ? "✕" : ""; return `<td><span class="status-cell ${status || "empty"}">${label}</span></td>`; }).join("")}</tr>`), "Davomat topilmadi", "Bu guruh uchun hali davomat yozuvlari yo'q.") : crmProfileEmpty("Davomat topilmadi", "Dars o'tilgach davomat jurnali shu yerda chiqadi.")}
        </section>
        <section class="profile-panel" data-profile-panel="grading" hidden>
          ${crmProfileTable(["TALABALAR", ...gradingDates], groupStudents.map((student) => `<tr><td>${escapeHtml(student.full_name || student.fullName)}</td>${gradingDates.map((date, index) => `<td><input class="profile-cell-input" type="text" value="${escapeHtml(String(student.grades?.[index] || student.score || 5))}" /></td>`).join("")}</tr>`), "Baholar topilmadi", "Baholash natijalari kiritilgandan keyin shu yerda ko'rinadi.")}
        </section>
        <section class="profile-panel" data-profile-panel="homework" hidden>
          ${crmProfileTable(["TALABALAR", ...gradingDates], groupStudents.map((student, rowIndex) => `<tr><td>${escapeHtml(student.full_name || student.fullName)}</td>${gradingDates.map((date, colIndex) => `<td><span class="profile-chip gold">${rowIndex === 0 && colIndex === 0 ? "TAKRORLASH" : `${student.homeworkPercent || 0}%`}</span></td>`).join("")}</tr>`), "Mashqlar topilmadi", "Uyga vazifa va mashq foizlari shu yerda aks etadi.")}
        </section>
        <section class="profile-panel" data-profile-panel="discounts" hidden>
          ${crmProfileTable(["TALABA", "QIYMAT", "OY", "SABAB"], discountRows.map((item) => `<tr><td>${escapeHtml(item.student_name || "-")}</td><td>${formatMoney(item.discount || 0)}</td><td>${escapeHtml(item.payment_month || "-")}</td><td>${escapeHtml(item.note || "Chegirma")}</td></tr>`), "Chegirma topilmadi", "Bu guruh uchun chegirma yozuvlari mavjud emas.")}
        </section>
        <section class="profile-panel" data-profile-panel="exams" hidden>
          ${crmProfileTable(["TALABA", "SANA", "BAL", "STATUS"], groupStudents.flatMap((student) => (student.exams || []).map((exam) => `<tr><td>${escapeHtml(student.full_name || student.fullName)}</td><td>${formatDate(exam.date) || "-"}</td><td>${escapeHtml(String(exam.score || exam.ball || "-"))}</td><td>${renderBadge(exam.status || "done")}</td></tr>`)), "Imtihon natijalari topilmadi", "Guruh imtihonlari shu bo'limda ko'rinadi.")}
        </section>
        <section class="profile-panel" data-profile-panel="history" hidden>
          <div class="timeline-list">${history.length ? history.map((event) => `<article><strong>${escapeHtml(event.title)}</strong><span>${escapeHtml(event.detail || "")}</span><time>${formatDate(event.date) || "-"}</time></article>`).join("") : crmProfileEmpty("Tarix topilmadi", "Guruhga oid tarix loglari shu yerda ko'rinadi.")}</div>
        </section>
        <section class="profile-panel" data-profile-panel="note" hidden>
          <article class="profile-rich-note"><h3>Izoh</h3><p>${escapeHtml(group.note || "Guruh bo'yicha izoh kiritilmagan.")}</p></article>
        </section>
      </section>
    </div>`;
}

function renderCrmProfiles() {
  const studentNode = document.querySelector("[data-student-profile]");
  if (studentNode) {
    const student = findByPathOrFirst(state.students, "students");
    if (student) studentNode.innerHTML = crmStudentProfileMarkup(student);
  }
  const groupNode = document.querySelector("[data-group-profile]");
  if (groupNode) {
    const group = findByPathOrFirst(state.groups, "groups");
    if (group) groupNode.innerHTML = crmGroupProfileMarkup(group);
  }
  const teacherNode = document.querySelector("[data-teacher-profile]");
  if (teacherNode) {
    const teacher = findByPathOrFirst(state.teachers, "teachers");
    const groups = teacher ? crmTeacherGroups(teacher) : [];
    teacherNode.innerHTML = teacher ? `
      <div class="page-head"><div><h1>${escapeHtml(teacher.fullName || teacher.full_name)}</h1><p>${escapeHtml(teacher.course || teacher.course_name || "Fan/Kurs")} · ${groups.length || 0} ta guruh</p></div><button type="button" data-view="teachers">Ro'yxatga qaytish</button></div>
      <div class="profile-tabs"><button class="active">Asosiy ma'lumotlar</button><button>Guruhlar</button><button>Dars jadvali</button><button>Talabalar</button><button>Maosh sozlamalari</button></div>
      <div class="profile-grid">
        <article><span>Telefon</span><strong>${escapeHtml(teacher.phone || "-")}</strong></article>
        <article><span>Email</span><strong>${escapeHtml(teacher.email || "-")}</strong></article>
        <article><span>Tug'ilgan sana</span><strong>${formatDate(teacher.birthDate || teacher.birth_date) || "-"}</strong></article>
        <article><span>Ish haqi</span><strong>${escapeHtml(teacher.salaryValue || teacher.salary_rate || 0)} ${statusLabels[teacher.salaryType || teacher.salary_type] || ""}</strong></article>
      </div>
      <section class="settings-panel"><h3>Guruhlar</h3><div class="mini-list">${groups.map((name) => `<span>${escapeHtml(name)}</span>`).join("") || "Guruh biriktirilmagan"}</div></section>` : `<div class="empty-state">O'qituvchi topilmadi.</div>`;
  }
}


function crmDownloadFile(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function crmCsvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function crmExportCollection(resource, rows = []) {
  const labels = {
    students: ["id", "full_name", "phone", "parent_phone", "course_name", "group_name", "balance", "status"],
    groups: ["id", "name", "course_name", "teacher_full_name", "monthly_price", "start_time", "end_time", "days", "room", "status"],
    teachers: ["id", "full_name", "phone", "email", "course_name", "salary_type", "salary_rate", "status"],
    courses: ["id", "name", "price", "duration", "level", "lesson_type", "status"],
    payments: ["id", "student_name", "group_name", "payment_month", "due_amount", "amount", "discount", "status", "payment_type", "paid_at"],
    leads: ["id", "full_name", "phone", "course_name", "source", "status", "manager_name", "next_contact_at"],
    reports: ["metric", "value"]
  };
  let data = rows.length ? rows : crmCollectionFor(resource);
  if (resource === "students") data = filteredCrmStudents();
  if (resource === "groups") data = filteredCrmGroups();
  if (resource === "teachers") data = filteredCrmTeachers();
  if (resource === "payments") data = state.payments || [];
  if (resource === "reports") {
    data = [
      { metric: "Talabalar", value: (state.students || []).length },
      { metric: "Guruhlar", value: (state.groups || []).length },
      { metric: "O'qituvchilar", value: (state.teachers || []).length },
      { metric: "To'lovlar", value: (state.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0) },
      { metric: "Qarzdorlik", value: debtItems().reduce((s, d) => s + Number(d.balance || d.remaining_debt || 0), 0) }
    ];
  }
  const headers = labels[resource] || Object.keys(data[0] || { id: "", name: "" });
  const csv = [headers.join(";"), ...data.map((row) => headers.map((key) => crmCsvEscape(row[key] ?? row[camelCase(key)] ?? "")).join(";"))].join("\n");
  crmDownloadFile(`eduka-${resource}-${new Date().toISOString().slice(0, 10)}.csv`, "\ufeff" + csv, "text/csv;charset=utf-8");
  showToast(`${resource} CSV eksport qilindi.`);
}

function camelCase(key) {
  return String(key).replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());
}

function crmPrintHtml(title, body) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!win) {
    crmDownloadFile(`${title.toLowerCase().replace(/\s+/g, "-")}.html`, body, "text/html;charset=utf-8");
    showToast("Brauzer popupni blokladi. Fayl yuklab olindi.", "warning");
    return;
  }
  win.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#172033}h1{margin:0 0 16px}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #e5e7eb;padding:8px;text-align:left}.muted{color:#64748b}.total{font-size:20px;font-weight:700}</style></head><body>${body}</body></html>`);
  win.document.close();
  win.focus();
  window.setTimeout(() => win.print(), 300);
}

function crmBuildInvoiceHtml(payment) {
  const studentName = payment?.student_name || crmStudentName(payment?.student_id) || "Talaba";
  const rows = [
    ["Talaba", studentName],
    ["Guruh", payment?.group_name || crmGroupName(payment?.group_id) || "-"],
    ["Oy", payment?.payment_month || new Date().toISOString().slice(0, 7)],
    ["To'lov turi", payment?.payment_type || "-"],
    ["To'lanishi kerak", formatMoney(payment?.due_amount || payment?.amount || 0)],
    ["To'langan", formatMoney(payment?.amount || 0)],
    ["Chegirma", formatMoney(payment?.discount || 0)],
    ["Holati", statusLabels[payment?.status] || payment?.status || "-"],
    ["Sana", formatDate(payment?.paid_at || payment?.created_at || new Date().toISOString())]
  ];
  return `<h1>Eduka to'lov cheki</h1><p class="muted">${escapeHtml(crmCenterTitle())}</p><table>${rows.map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join("")}</table><p class="total">Jami: ${escapeHtml(formatMoney(payment?.amount || 0))}</p>`;
}

function crmImportCsv(resource) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv,text/csv";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const lines = String(reader.result || "").split(/\r?\n/).filter(Boolean);
      const headers = lines.shift()?.split(/[;,]/).map((h) => h.trim()) || [];
      let created = 0;
      for (const line of lines) {
        const cells = line.split(/[;,]/);
        const payload = {};
        headers.forEach((key, index) => { if (key) payload[key] = cells[index] || ""; });
        if (!payload.full_name && payload.name) payload.full_name = payload.name;
        if (!payload.full_name && !payload.name) continue;
        await serviceFor(resource)?.create?.(payload);
        created += 1;
      }
      await refreshAll();
      showToast(`${created} ta yozuv import qilindi.`);
    };
    reader.readAsText(file);
  });
  input.click();
}

function crmOpenMessagePreview(target, purpose = "general") {
  const name = target?.full_name || target?.fullName || target?.name || "mijoz";
  const phone = target?.phone || "telefon kiritilmagan";
  const debt = Number(target?.balance || target?.remaining_debt || 0);
  const text = purpose === "debt"
    ? `Assalomu alaykum, ${name}. Eduka bo'yicha ${formatMoney(debt)} qarzdorlik mavjud. Iltimos, to'lovni yaqin muddatda amalga oshiring.`
    : `Assalomu alaykum, ${name}. Eduka o'quv markazidan xabar.`;
  const note = window.prompt(`${phone} raqamiga yuboriladigan xabar preview:`, text);
  if (note === null) return;
  const saved = loadCrmLocalState();
  saved.messages = Array.isArray(saved.messages) ? saved.messages : [];
  saved.messages.unshift({ id: Date.now(), to: phone, text: note, createdAt: new Date().toISOString(), status: "preview" });
  if (allowDevelopmentFallback()) localStorage.setItem(tenantDataStorageKey(), JSON.stringify({ ...loadCrmLocalState(), ...saved }));
  showToast("Xabar preview sifatida saqlandi.");
}

function crmActiveStudentsReport() {
  const students = filteredCrmStudents().filter((student) => (student.status || "active") === "active");
  const html = `<h1>Aktiv talabalar hisoboti</h1><p class="muted">${escapeHtml(crmCenterTitle())} — ${new Date().toLocaleDateString()}</p><table><thead><tr><th>#</th><th>FISH</th><th>Telefon</th><th>Guruh</th><th>Balans</th></tr></thead><tbody>${students.map((s, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(s.full_name || s.fullName)}</td><td>${escapeHtml(s.phone || "-")}</td><td>${escapeHtml(s.group_name || crmStudentGroups(s).join(", ") || "-")}</td><td>${escapeHtml(formatMoney(s.balance || 0))}</td></tr>`).join("")}</tbody></table>`;
  crmPrintHtml("Aktiv talabalar hisoboti", html);
}


function generatedStorageKey() {
  return `${tenantDataStorageKey()}:generated-modules`;
}

function loadGeneratedStore() {
  try { return JSON.parse(localStorage.getItem(generatedStorageKey()) || "{}"); } catch { return {}; }
}

function saveGeneratedStore(store) {
  localStorage.setItem(generatedStorageKey(), JSON.stringify(store || {}));
}

function generatedResourceTitle(resource) {
  return generatedViews[resource]?.[0] || resource || "Modul";
}

function generatedRows(resource) {
  const store = loadGeneratedStore();
  return Array.isArray(store[resource]) ? store[resource] : [];
}

function setGeneratedRows(resource, rows) {
  const store = loadGeneratedStore();
  store[resource] = rows;
  saveGeneratedStore(store);
}

function renderGeneratedEntities(resource = null) {
  const tables = resource ? [...document.querySelectorAll(`[data-generated-table="${resource}"]`)] : [...document.querySelectorAll("[data-generated-table]")];
  tables.forEach((table) => {
    const key = table.dataset.generatedTable;
    const query = document.querySelector(`[data-generated-search="${key}"]`)?.value?.toLowerCase() || "";
    const rows = generatedRows(key).filter((item) => String(item.name || "").toLowerCase().includes(query));
    table.querySelectorAll("div:not(:first-child)").forEach((node) => node.remove());
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "table-empty";
      empty.textContent = "Ma'lumot topilmadi. Qo'shish tugmasi orqali birinchi yozuvni yarating.";
      table.append(empty);
      return;
    }
    rows.forEach((item, index) => {
      const line = document.createElement("div");
      line.innerHTML = `<span>${index + 1}</span><span>${escapeHtml(item.name)}</span><span>${renderBadge(item.status || "active")}</span><span>${formatDate(item.created_at || item.createdAt)}</span><span class="row-actions"><button type="button" data-crm-action="generated-edit" data-generated-resource="${key}" data-id="${item.id}">Tahrirlash</button><button type="button" data-crm-action="generated-delete" data-generated-resource="${key}" data-id="${item.id}">O'chirish</button></span>`;
      table.append(line);
    });
  });

  const lists = resource ? [...document.querySelectorAll(`[data-generated-list="${resource}"]`)] : [...document.querySelectorAll("[data-generated-list]")];
  lists.forEach((list) => {
    const key = list.dataset.generatedList;
    const defaults = key === "positions" ? ["Exerciser", "Developer", "Kassir", "Chop etuvchi", "Marketolog", "Administrator", "Buxgalter", "Teacher"] : [];
    const rows = generatedRows(key);
    const data = rows.length ? rows.map((row) => row.name) : defaults;
    list.innerHTML = data.map((name) => `<article><b>${escapeHtml(String(name)[0] || "E")}</b><span>${escapeHtml(name)}</span><small>${rows.length ? "local" : "global"}</small></article>`).join("");
  });
}

function renderGeneratedReports() {
  document.querySelectorAll(".generated-view").forEach((section) => {
    const meta = generatedViews[section.id];
    if (!meta || meta[2] !== "report") return;
    const panel = section.querySelector(".settings-panel");
    if (!panel || panel.dataset.reportReady === "1") return;
    const totalPaid = (state.payments || []).reduce((sum, p) => sum + Number(p.amount || p.paid_amount || 0), 0);
    const totalDebt = debtItems().reduce((sum, d) => sum + Number(d.balance || d.remaining_debt || 0), 0);
    panel.dataset.reportReady = "1";
    panel.insertAdjacentHTML("beforeend", `<div class="generated-report-grid"><article><span>Talabalar</span><b>${(state.students || []).length}</b></article><article><span>Guruhlar</span><b>${(state.groups || []).length}</b></article><article><span>Tushum</span><b>${escapeHtml(formatMoney(totalPaid))}</b></article><article><span>Qarzdorlik</span><b>${escapeHtml(formatMoney(totalDebt))}</b></article></div><div class="modal-actions"><button type="button" data-crm-action="export-excel" data-resource="reports">Excel export</button><button type="button" data-crm-action="export-pdf" data-resource="reports">PDF/Print</button></div>`);
  });
}

function handleGeneratedAdd(resource, id = null) {
  const rows = generatedRows(resource);
  const current = rows.find((item) => String(item.id) === String(id));
  const label = generatedResourceTitle(resource);
  const name = window.prompt(`${label} uchun nom kiriting:`, current?.name || "");
  if (name === null) return;
  const cleanName = name.trim();
  if (!cleanName) return showToast("Nom bo'sh bo'lmasligi kerak.", "warning");
  if (current) {
    current.name = cleanName;
    current.updated_at = new Date().toISOString();
  } else {
    rows.unshift({ id: Date.now(), name: cleanName, status: "active", created_at: new Date().toISOString() });
  }
  setGeneratedRows(resource, rows);
  renderGeneratedEntities(resource);
  showToast(current ? "Yozuv yangilandi." : "Yozuv qo'shildi.");
}

function handleGeneratedDelete(resource, id) {
  if (!window.confirm("Yozuvni o'chirishni tasdiqlaysizmi?")) return;
  setGeneratedRows(resource, generatedRows(resource).filter((item) => String(item.id) !== String(id)));
  renderGeneratedEntities(resource);
  showToast("Yozuv o'chirildi.");
}

function exportGeneratedResource(resource) {
  const rows = generatedRows(resource);
  const csv = ["id;name;status;created_at", ...rows.map((row) => [row.id, crmCsvEscape(row.name), row.status || "active", row.created_at || ""].join(";"))].join("\n");
  crmDownloadFile(`eduka-${resource}-${new Date().toISOString().slice(0, 10)}.csv`, "\ufeff" + csv, "text/csv;charset=utf-8");
  showToast(`${generatedResourceTitle(resource)} eksport qilindi.`);
}

function clearGeneratedSearch(resource) {
  document.querySelectorAll(`[data-generated-search="${resource}"]`).forEach((field) => { field.value = ""; });
  renderGeneratedEntities(resource);
  showToast("Qidiruv tozalandi.");
}

function unsupportedAction(label = "Bu tugma") {
  showToast(`${label} hali real workflow'ga ulanmagan. Tugma endi soxta muvaffaqiyat ko'rsatmaydi.`, "warning");
}

async function handleCrmAction(action, button) {
  const resource = button.dataset.resource;
  const id = button.dataset.id;
  ensureEditableCrmCollection(resource);
  const collection = crmCollectionFor(resource);
  const item = collection.find((entry) => String(entry.id) === String(id));

  const generatedResource = button.dataset.generatedResource;
  if (action === "generated-add") return handleGeneratedAdd(generatedResource || viewFromPath());
  if (action === "generated-edit") return handleGeneratedAdd(generatedResource || viewFromPath(), button.dataset.id);
  if (action === "generated-delete") return handleGeneratedDelete(generatedResource || viewFromPath(), button.dataset.id);
  if (action === "generated-export") return exportGeneratedResource(generatedResource || viewFromPath());
  if (action === "generated-clear") return clearGeneratedSearch(generatedResource || viewFromPath());

  if (action === "avatar-menu") return toggleCrmPanel("avatar");
  if (action === "quick-tools") return toggleCrmPanel("quick");
  if (action === "notifications") return toggleCrmPanel("notifications");
  if (action === "tasks") return toggleCrmPanel("tasks");
  if (action === "close-drawer") return closeDrawer();
  if (action === "quick-add-student") return openDrawer("students");
  if (action === "center-menu") return setView("settings");
  if (action === "profile-toast") return setView("settings");

  if (action === "mark-notifications") {
    try { await api("/api/app/notifications", { method: "PUT", body: JSON.stringify({ all: true }) }); } catch {}
    state.notifications = (state.notifications || []).map((item) => ({ ...item, is_read: true }));
    document.querySelector('[data-crm-panel="notifications"]')?.setAttribute("hidden", "");
    showToast("Bildirishnomalar o'qildi deb belgilandi.");
    return;
  }

  if (action === "reset-filters") {
    crmListState[resource] = {};
    renderAll();
    showToast("Filterlar tozalandi.");
    return;
  }
  if (action === "reset-ui-filters") {
    uiState.filters[resource] = {};
    document.querySelectorAll(`[data-filter-scope="${resource}"] [data-filter]`).forEach((field) => { field.value = ""; });
    renderAll();
    showToast("Filtrlar tozalandi.");
    return;
  }

  if (action === "view" && resource === "students") return setView("student-profile", { route: `/admin/students/${id}` });
  if (action === "view" && resource === "groups") return setView("group-profile", { route: `/admin/groups/${id}` });
  if (action === "view" && resource === "teachers") return setView("teacher-profile", { route: `/admin/teachers/${id}` });
  if (action === "edit" && item) return openDrawer(resource, item);

  if (action === "delete" && item) {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    await safeApi(`${modalFields[resource]?.endpoint || endpoints[resource]}/${id}`, { method: "DELETE" }, async () => {
      await serviceFor(resource)?.remove?.(id);
      return { ok: true };
    });
    state[resource] = collection.filter((entry) => String(entry.id) !== String(id));
    persistCrmCollections();
    await refreshAll();
    showToast("Ma'lumot o'chirildi.");
    return;
  }

  if (action === "toggle-status" && item) {
    item.status = item.status === "active" ? "archived" : "active";
    await safeApi(`${modalFields[resource]?.endpoint || endpoints[resource]}/${id}`, { method: "PUT", body: JSON.stringify(item) }, async () => {
      await serviceFor(resource)?.update?.(id, item);
      return { ok: true };
    });
    persistCrmCollections();
    await refreshAll();
    showToast(item.status === "active" ? "Status faollashtirildi." : "Status arxivlandi.");
    return;
  }

  if (action === "toggle-payment-type") {
    const paymentType = (state.paymentTypes || []).find((entry) => String(entry.id) === String(id));
    if (paymentType) {
      paymentType.active = !paymentType.active;
      await safeApi(`/api/payment-types/${id}`, { method: "PUT", body: JSON.stringify(paymentType) }, async () => ({ ok: true }));
      persistCrmCollections();
      renderAll();
      showToast(paymentType.active ? "To'lov turi faollashtirildi." : "To'lov turi o'chirildi.", paymentType.active ? "success" : "warning");
    }
    return;
  }

  if (action === "convert-lead") {
    await convertLead(id);
    return;
  }
  if (action === "lead-status" && item) {
    const flow = ["new", "contacted", "trial", "became_student", "paid", "later"];
    const current = flow.indexOf(item.status || "new");
    item.status = flow[(current + 1) % flow.length];
    await safeApi(`/api/leads/${id}/status`, { method: "PUT", body: JSON.stringify({ status: item.status }) }, async () => {
      await serviceFor("leads")?.update?.(id, item);
      return { ok: true };
    });
    persistCrmCollections();
    await refreshAll();
    showToast(`Lead statusi: ${statusLabels[item.status] || item.status}`);
    return;
  }

  if (action === "import-excel") return crmImportCsv(resource || "students");
  if (action === "export-excel") return crmExportCollection(resource || viewFromPath() || "reports");
  if (action === "export-pdf") {
    const title = "Eduka hisobot";
    const body = `<h1>${title}</h1><p class="muted">${escapeHtml(crmCenterTitle())}</p><table><tr><th>Talabalar</th><td>${(state.students || []).length}</td></tr><tr><th>Guruhlar</th><td>${(state.groups || []).length}</td></tr><tr><th>O'qituvchilar</th><td>${(state.teachers || []).length}</td></tr><tr><th>To'lovlar</th><td>${escapeHtml(formatMoney((state.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)))}</td></tr></table>`;
    crmPrintHtml(title, body);
    return;
  }
  if (action === "active-students-report") return crmActiveStudentsReport();

  if (action === "toggle-view" || action === "filter-settings") {
    document.body.classList.toggle("crm-compact-view");
    showToast("Ko'rinish sozlamalari yangilandi.");
    return;
  }

  if (action === "payment") {
    const student = state.students.find((entry) => String(entry.id) === String(id));
    return openDrawer("payments", { student_id: id, group_id: student?.group_id, due_amount: student?.balance || 0, amount: 0, discount: 0, payment_month: new Date().toISOString().slice(0, 7), _prefill: true });
  }

  if (action === "assign-group") {
    const student = state.students.find((entry) => String(entry.id) === String(id));
    if (!student) return showToast("Talaba topilmadi.", "warning");
    const names = (state.groups || []).map((g) => `${g.id}: ${g.name}`).join("\n");
    const selected = window.prompt(`Qaysi guruhga biriktiramiz? ID kiriting:\n${names}`, student.group_id || "");
    if (!selected) return;
    const group = (state.groups || []).find((g) => String(g.id) === String(selected));
    if (!group) return showToast("Guruh topilmadi.", "warning");
    const updated = { ...student, group_id: group.id, group_name: group.name, course_name: group.course_name || student.course_name };
    await safeApi(`/api/students/${id}`, { method: "PUT", body: JSON.stringify(updated) }, async () => {
      await serviceFor("students")?.update?.(id, updated);
      return { ok: true };
    });
    Object.assign(student, updated);
    persistCrmCollections();
    await refreshAll();
    showToast(`${student.full_name || student.fullName} ${group.name} guruhiga biriktirildi.`);
    return;
  }

  if (action === "flag" && item) {
    item.flagged = !item.flagged;
    item.note = item.flagged ? `${item.note || ""} Kuzatuvga olindi.`.trim() : item.note;
    persistCrmCollections();
    renderAll();
    showToast(item.flagged ? "Talaba kuzatuvga olindi." : "Kuzatuv belgisi olib tashlandi.");
    return;
  }

  if (action === "add-student") return openDrawer("students", { group_id: id, _prefill: true });
  if (action === "attendance") return setView("attendance");
  if (action === "payments") return setView("finance");

  if (action === "invoice" || action === "download-invoice") {
    const payment = item || (state.payments || [])[0] || { amount: 0 };
    crmPrintHtml("Eduka invoice", crmBuildInvoiceHtml(payment));
    return;
  }

  if (action === "debt") return setView("debtors");
  if (action === "debt-message") {
    const target = debtItems().find((entry) => String(entry.id) === String(id)) || (state.students || []).find((entry) => String(entry.id) === String(id));
    crmOpenMessagePreview(target, "debt");
    return;
  }
  if (action === "debt-message-all") {
    debtItems().forEach((target) => crmOpenMessagePreview(target, "debt"));
    return;
  }
  if (action === "called" && id) {
    const saved = loadCrmLocalState();
    saved.calls = Array.isArray(saved.calls) ? saved.calls : [];
    saved.calls.unshift({ id: Date.now(), student_id: id, createdAt: new Date().toISOString(), status: "called" });
    if (allowDevelopmentFallback()) localStorage.setItem(tenantDataStorageKey(), JSON.stringify({ ...loadCrmLocalState(), ...saved }));
    showToast("Qo'ng'iroq holati belgilandi.");
    return;
  }

  if (action === "groups" && resource === "teachers") {
    const teacher = state.teachers.find((entry) => String(entry.id) === String(id));
    const groups = (state.groups || []).filter((g) => String(g.teacher_id) === String(id) || String(g.teacher_name || g.teacher_full_name || "").toLowerCase() === String(teacher?.full_name || teacher?.fullName || "").toLowerCase());
    alert(groups.map((g) => `${g.name} — ${g.days || "kun tanlanmagan"}`).join("\n") || "Bu o'qituvchiga guruh biriktirilmagan.");
    return;
  }

  if (action === "schedule") return setView("schedule");
  if (action === "schedule-edit") return openDrawer("schedule", item || {});
  if (action === "schedule-mode") {
    document.querySelectorAll('[data-crm-action="schedule-mode"]').forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    showToast(`${button.textContent.trim()} jadval ko'rinishi tanlandi.`);
    return;
  }
  if (action === "message" || action === "teacher-message") {
    crmOpenMessagePreview(item || (state.teachers || [])[0] || {}, "general");
    return;
  }
  if (action === "profile-tab") {
    const tabs = button.closest(".profile-tabs");
    tabs?.querySelectorAll("button").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    const root = button.closest("[data-profile-root]");
    const target = button.dataset.profileTarget;
    root?.querySelectorAll("[data-profile-panel]").forEach((panel) => {
      const active = panel.dataset.profilePanel === target;
      panel.hidden = !active;
      panel.classList.toggle("active", active);
    });
    return;
  }

  if (action === "cash-transfer") {
    const amount = window.prompt("Kassadan hisobga o'tkaziladigan summa:", "0");
    if (amount === null) return;
    state.financeTransactions = state.financeTransactions || [];
    state.financeTransactions.unshift({ id: nextCrmId("financeTransactions"), type: "transfer", category: "Kassa o'tkazma", amount: Number(amount || 0), transaction_date: new Date().toISOString().slice(0, 10) });
    persistCrmCollections();
    showToast("Kassa o'tkazmasi saqlandi.");
    return;
  }

  if (action === "save-generated-settings") {
    const key = button.dataset.generatedResource || viewFromPath();
    const scope = button.closest("[data-generated-settings]") || document.getElementById(key) || document;
    const fields = Object.fromEntries([...scope.querySelectorAll("input, select, textarea")].map((field) => [field.name || field.previousElementSibling?.textContent || field.placeholder || "field", field.type === "checkbox" ? field.checked : field.value]));
    const saved = loadCrmLocalState();
    saved.generatedSettings = { ...(saved.generatedSettings || {}), [key]: fields };
    if (allowDevelopmentFallback()) localStorage.setItem(tenantDataStorageKey(), JSON.stringify({ ...loadCrmLocalState(), ...saved }));
    showToast("Sozlamalar real saqlandi.");
    return;
  }

  if (action?.startsWith("super-center-")) {
    const center = (state.superCenters || []).find((entry) => String(entry.id) === String(id));
    if (!center) return showToast("Markaz topilmadi.", "warning");
    if (action === "super-center-block") {
      center.status = center.status === "blocked" ? "active" : "blocked";
      try { await api(`/api/super/centers/${id}`, { method: "PUT", body: JSON.stringify({ status: center.status }) }); } catch {}
      renderAll();
      showToast(center.status === "blocked" ? "Markaz bloklandi." : "Markaz aktivlashtirildi.");
      return;
    }
    if (action === "super-center-tariff") {
      const plan = window.prompt("Yangi tarif nomi:", center.plan || center.tariff_name || "Pro");
      if (plan === null) return;
      center.plan = plan.trim() || center.plan;
      renderAll();
      showToast("Tarif yangilandi.");
      return;
    }
    if (action === "super-center-trial") {
      const days = Number(window.prompt("Necha kun trial qo'shiladi?", "7") || 0);
      if (!days) return;
      const base = new Date(center.license_expires_at || Date.now());
      base.setDate(base.getDate() + days);
      center.license_expires_at = base.toISOString();
      center.subscription_status = "trial";
      renderAll();
      showToast(`${days} kun trial qo'shildi.`);
      return;
    }
    if (action === "super-center-login") {
      const subdomain = center.subdomain || center.slug || "demo";
      window.open(`https://${subdomain}.eduka.uz/admin/login`, "_blank", "noopener,noreferrer");
      showToast("Markaz login oynasi ochildi.");
      return;
    }
    if (action === "super-center-support") {
      const note = window.prompt("Support izohini kiriting:", center.support_note || "");
      if (note === null) return;
      center.support_note = note;
      renderAll();
      showToast("Support izohi saqlandi.");
      return;
    }
  }

  if (action === "upgrade-plan" || action === "extend-subscription") {
    setView("subscription");
    showToast("Tarif/obuna bo'limi ochildi.");
    return;
  }
  if (action === "contact-support") {
    window.location.href = "mailto:support@eduka.uz?subject=Eduka%20support";
    return;
  }

  if (action === "save-settings") {
    const form = document.querySelector("[data-crm-settings-form]");
    const saved = loadCrmLocalState();
    saved.settings = Object.fromEntries(new FormData(form).entries());
    saved.settings.telegramEnabled = Boolean(form?.querySelector('[name="telegramEnabled"]')?.checked);
    saved.settings.require2fa = Boolean(form?.querySelector('[name="require2fa"]')?.checked);
    if (allowDevelopmentFallback()) localStorage.setItem(tenantDataStorageKey(), JSON.stringify({ ...loadCrmLocalState(), ...saved }));
    if (saved.settings.centerName) {
      centerName.textContent = saved.settings.centerName;
      if (currentUser?.organization) currentUser.organization.name = saved.settings.centerName;
    }
    renderCrmTopbar();
    showToast("Sozlamalar saqlandi.");
    return;
  }

  if (action === "save-attendance-page") {
    const groupId = document.querySelector("[data-attendance-group]")?.value;
    const lessonDate = document.querySelector("[data-attendance-date]")?.value;
    const records = [...document.querySelectorAll("[data-attendance-student]")].map((item) => ({
      group_id: groupId,
      student_id: item.dataset.attendanceStudent,
      lesson_date: lessonDate,
      status: item.querySelector("[data-attendance-status]")?.value || "present"
    }));
    if (!groupId || !lessonDate || !records.length) {
      showToast("Guruh, sana va o'quvchilarni tekshiring.");
      return;
    }
    await safeApi("/api/attendance", { method: "POST", body: JSON.stringify({ records }) }, async () => {
      records.forEach((record) => {
        const student = state.students.find((entry) => String(entry.id) === String(record.student_id));
        const group = state.groups.find((entry) => String(entry.id) === String(groupId));
        state.attendance.unshift({ id: nextCrmId("attendance"), ...record, student_name: student?.full_name || student?.fullName, group_name: group?.name, teacher_name: group?.teacher_full_name || group?.teacher_name });
      });
      persistCrmCollections();
      return { ok: true };
    });
    await refreshAll();
    showToast("Davomat saqlandi.");
    return;
  }

  unsupportedAction(button.textContent.trim() || action || "Bu tugma");
}
async function deleteItem(resource, id) {
  try {
    await safeApi(`${modalFields[resource].endpoint}/${id}`, { method: "DELETE" }, async () => {
      await serviceFor(resource)?.remove?.(id);
      return { ok: true };
    });
    await refreshAll();
    showToast("Ma'lumot o'chirildi.");
  } catch (error) {
    showToast(error.message);
  }
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = loginForm.querySelector("button[type='submit']");
  const formData = new FormData(loginForm);
  submitButton.disabled = true;
  submitButton.textContent = "Tekshirilmoqda...";

  try {
    const payload = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ login: formData.get("login"), password: formData.get("password") })
    });
    showApp(payload.user);
    showToast("Kabinetga muvaffaqiyatli kirildi.");
  } catch (error) {
    showToast(`${error.message}. Parol esdan chiqqan bo'lsa, Telegram adminiga yozing: @eduka_admin`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Kirish";
  }
});

// Demo login was removed in Eduka 19.7 production hardening.


modalForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (String(activeModal || "").startsWith("admin-")) {
    handleAdminModalSubmit();
    return;
  }
  if (activeModal === "student-app-resource") {
    await handleStudentAppResourceSubmit();
    return;
  }
  const config = modalFields[activeModal];
  const data = Object.fromEntries(new FormData(modalForm).entries());
  const phoneFields = ["phone", "parent_phone"].filter((name) => data[name]);
  const invalidPhone = phoneFields.find((name) => normalizeDigits(data[name]).length < 9);
  const invalidNumber = ["balance", "amount", "salary_rate"].find((name) => data[name] && Number(data[name]) < 0);

  if (invalidPhone) {
    showToast("Telefon raqam kamida 9 ta raqamdan iborat bo'lishi kerak.");
    return;
  }

  if (invalidNumber) {
    showToast("Summa va balans manfiy bo'lmasligi kerak.");
    return;
  }

  if (activeModal === "students" && data.phone && !editingId && state.students.some((item) => normalizeDigits(item.phone) === normalizeDigits(data.phone))) {
    showToast("Bu telefon raqam bilan talaba allaqachon mavjud.");
    return;
  }

  const method = editingId ? "PUT" : "POST";
  const endpoint = editingId ? `${config.endpoint}/${editingId}` : config.endpoint;

  try {
    await safeApi(endpoint, { method, body: JSON.stringify(data) }, async () => {
      const service = serviceFor(activeModal);
      if (editingId) await service?.update?.(editingId, data);
      else await service?.create?.(data);
      return { ok: true };
    });
    closeModal();
    await refreshAll();
    showToast(editingId ? "Ma'lumot saqlandi." : "Ma'lumot yaratildi.");
  } catch (error) {
    showToast(error.message);
  }
});

function normalizeDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

// Eduka 21.8.0 public UI hooks for production-core and real-crud layers.
window.showToast = window.showToast || showToast;
window.setView = window.setView || setView;

document.addEventListener("click", async (event) => {
  if (event.target.closest("[data-tenant-forgot]")) {
    showToast("Parolni tiklash so'rovi qabul qilindi.");
    return;
  }

  if (event.target.closest("[data-admin-logout]")) {
    adminLogout();
    showToast("Tizimdan chiqildi.");
    return;
  }

  const adminModalButton = event.target.closest("[data-admin-modal]");
  if (adminModalButton) {
    adminOpenModal(adminModalButton.dataset.adminModal, adminModalButton.dataset.id);
    return;
  }

  const adminAction = event.target.closest("[data-admin-action]");
  if (adminAction) {
    const action = adminAction.dataset.adminAction;
    if (action === "go") setView(adminAction.dataset.target);
    else if (action === "profile") {
      closeModal();
      setView("super-center-profile", { route: `/ceo/centers/${adminAction.dataset.id}` });
    }
    else if (action === "toast") showToast(adminAction.dataset.message || "Amal tayyor.");
    else if (action === "reset-filters") {
      document.querySelectorAll(".admin-filters input, .admin-filters select").forEach((field) => {
        field.value = "";
      });
      renderAdminView(viewFromPath());
    } else if (action === "check-subdomain") {
      const input = document.querySelector('[data-admin-create-center] [name="subdomain"]');
      const error = validateSubdomain(input?.value);
      showToast(error || "Subdomain bo'sh va ishlatishga tayyor.");
    } else if (action === "tab") {
      activeAdminTab = adminAction.dataset.tab;
      renderAdminView(viewFromPath());
    } else if (action === "settings-tab") {
      activeAdminSettingsTab = adminAction.dataset.tab;
      renderAdminView("admin-settings");
    } else if (action === "new-center-reset") {
      closeModal();
      setView("admin-centers-new", { replace: true });
    } else if (action === "open-tenant") {
      const center = adminState.centers.find((item) => item.id === Number(adminAction.dataset.id));
      if (center) {
        addAuditLog("subdomain opened", "center", center.name, "-", center.subdomain);
        saveAdminState();
        window.open(`https://${center.subdomain}.eduka.uz`, "_blank", "noopener,noreferrer");
        showToast("Markaz kabineti yangi oynada ochildi.");
      }
    } else if (action === "reset-data") {
      if (window.confirm("Boshlang'ich holatga qaytarishni tasdiqlaysizmi? Markazlar, obunalar, to'lovlar, so'rovlar, support va audit yozuvlari tozalanadi.")) {
        resetAdminOperationalData();
        renderAdminView("admin-settings");
        showToast("Boshlang'ich holat tiklandi.");
      }
    } else if (action === "trial-center") {
      const req = adminState.demoRequests.find((item) => item.id === Number(adminAction.dataset.id));
      if (req) {
        const form = document.createElement("form");
        form.innerHTML = `<input name="name" value="${req.centerName}"><input name="subdomain" value="${slugify(req.centerName).slice(0, 20)}"><input name="owner" value="${req.contactPerson}"><input name="phone" value="${req.phone}"><input name="email" value="${req.email}"><input name="address" value=""><input name="plan" value="${req.interestedPlan}"><input name="trialDays" value="7"><input name="branchLimit" value="1"><input name="status" value="active"><input name="createAdmin" value="on"><div data-admin-form-error></div>`;
        await handleCreateCenter(form);
        req.status = "TRIAL_CREATED";
        saveAdminState();
        closeModal();
        renderAdminView("admin-demo-requests");
        showToast("Trial center yaratildi.");
      }
    } else {
      updateAdminState(action, adminAction.dataset.id, adminAction.dataset.status);
    }
    return;
  }

  const crmActionButton = event.target.closest("[data-crm-action]");
  if (crmActionButton) {
    event.preventDefault();
    await handleCrmAction(crmActionButton.dataset.crmAction, crmActionButton);
    return;
  }

  const studentAppButton = event.target.closest("[data-student-app-action]");
  if (studentAppButton) {
    event.preventDefault();
    await handleStudentAppAction(studentAppButton);
    return;
  }

  const globalResult = event.target.closest("[data-global-result]");
  if (globalResult) {
    const resource = globalResult.dataset.resource;
    const id = globalResult.dataset.id;
    document.querySelector("[data-global-results]")?.setAttribute("hidden", "");
    if (resource === "students") setView("student-profile", { route: `/admin/students/${id}` });
    else if (resource === "groups") setView("group-profile", { route: `/admin/groups/${id}` });
    else if (resource === "teachers") setView("teacher-profile", { route: `/admin/teachers/${id}` });
    else setView(globalResult.dataset.globalResult || "dashboard");
    return;
  }

  const attendanceCell = event.target.closest("[data-attendance-cell]");
  if (attendanceCell) {
    const nextStatus = {
      present: "absent",
      absent: "late",
      late: "excused",
      excused: "online",
      online: "present"
    };
    const icons = { present: "check", absent: "flag", late: "clock-3", excused: "badge-help", online: "wifi" };
    const current = attendanceCell.dataset.status || "present";
    const status = nextStatus[current] || "present";
    attendanceCell.dataset.status = status;
    attendanceCell.className = `attendance-cell status-${status}`;
    attendanceCell.innerHTML = `<i data-lucide="${icons[status]}"></i>`;
    const select = attendanceCell.closest("[data-attendance-student]")?.querySelector("[data-attendance-status]");
    if (select) select.value = status;
    refreshIcons();
    showToast(`Davomat statusi: ${statusLabels[status] || status}`, "info");
    return;
  }

  const staffButton = event.target.closest("[data-staff-check]");
  if (staffButton) {
    const id = staffButton.dataset.staffCheck;
    const now = new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
    const existing = (state.staffAttendance || []).find((entry) => String(entry.id) === String(id));
    try {
      if (existing?.checkedIn) await window.crmServices?.staffAttendanceService?.checkOut?.(id);
      else await window.crmServices?.staffAttendanceService?.checkIn?.(id);
    } catch {
      // Local tenant fallback keeps the attendance button responsive without DATABASE_URL.
    }
    if (existing) {
      existing.checkedIn = !existing.checkedIn;
      if (existing.checkedIn) existing.arrived = existing.arrived || now;
      else existing.left = now;
    } else {
      state.staffAttendance.unshift({ id, checkedIn: true, arrived: now, left: "" });
    }
    persistCrmCollections();
    renderAll();
    showToast(existing?.checkedIn === false ? "Xodim ketish vaqti belgilandi." : "Xodim kelish vaqti belgilandi.");
    return;
  }

  if (!event.target.closest(".topbar, [data-crm-panel]")) {
    document.querySelectorAll("[data-crm-panel]").forEach((panel) => {
      panel.hidden = true;
    });
    document.querySelector("[data-global-results]")?.setAttribute("hidden", "");
  }

  if (event.target.closest("[data-crm-drawer-backdrop]")) {
    closeDrawer();
    return;
  }

  const crmRow = event.target.closest("[data-crm-row]");
  if (crmRow && !event.target.closest("button, a, input, select, textarea, details, summary")) {
    const resource = crmRow.dataset.crmRow;
    const id = crmRow.dataset.id;
    if (resource === "students") setView("student-profile", { route: `/admin/students/${id}` });
    if (resource === "groups") setView("group-profile", { route: `/admin/groups/${id}` });
    if (resource === "teachers") setView("teacher-profile", { route: `/admin/teachers/${id}` });
    return;
  }

  const viewButton = event.target.closest("[data-view]");
  if (viewButton && !event.target.closest("[data-open-modal]")) {
    setView(viewButton.dataset.view);
  }

  const openButton = event.target.closest("[data-open-modal]");
  if (openButton) {
    const resource = openButton.dataset.openModal;
    if (["students", "groups", "teachers", "courses", "payments", "leads", "rooms", "paymentTypes", "extraIncomes", "salaryPayments", "bonuses", "expenses"].includes(resource)) openDrawer(resource);
    else openModal(resource);
  }
  if (event.target.closest("[data-close-modal]")) closeModal();

  const genericUiButton = event.target.closest(".generated-view button, .settings-panel button, .export-actions button, .segmented button");
  if (genericUiButton && !genericUiButton.dataset.view && !genericUiButton.dataset.crmAction && !genericUiButton.dataset.studentAppAction && !genericUiButton.dataset.openModal) {
    const label = genericUiButton.textContent.trim() || "Tugma";
    unsupportedAction(label);
    return;
  }

  if (event.target.closest("[data-attendance-all]")) {
    const groupId = modalForm.querySelector('[name="group_id"]')?.value;
    const lessonDate = modalForm.querySelector('[name="lesson_date"]')?.value;
    if (!groupId || !lessonDate) {
      showToast("Avval guruh va dars sanasini tanlang.");
      return;
    }
    const records = state.students
      .filter((student) => String(student.group_id) === String(groupId))
      .map((student) => ({ group_id: groupId, student_id: student.id, lesson_date: lessonDate, status: "present" }));
    if (!records.length) {
      showToast("Bu guruhda talaba topilmadi.");
      return;
    }
    await safeApi("/api/attendance", { method: "POST", body: JSON.stringify({ records }) }, async () => {
      for (const record of records) await window.crmServices?.attendanceService?.create?.({ ...record, lesson_date: lessonDate });
      return { ok: true };
    });
    closeModal();
    await refreshAll();
    showToast("Guruh bo'yicha davomat belgilandi.");
  }

  if (event.target.closest("[data-attendance-mark-all]")) {
    document.querySelectorAll("[data-attendance-status]").forEach((select) => {
      select.value = "present";
    });
    showToast("Barcha o'quvchilar 'keldi' qilib belgilandi.");
  }

  if (event.target.closest("[data-attendance-save]")) {
    const groupId = document.querySelector("[data-attendance-group]")?.value;
    const lessonDate = document.querySelector("[data-attendance-date]")?.value;
    const records = [...document.querySelectorAll("[data-attendance-student]")].map((item) => ({
      group_id: groupId,
      student_id: item.dataset.attendanceStudent,
      lesson_date: lessonDate,
      status: item.querySelector("[data-attendance-status]")?.value || "present"
    }));
    if (!groupId || !lessonDate || !records.length) {
      showToast("Guruh, sana va o'quvchilarni tekshiring.");
      return;
    }
    await safeApi("/api/attendance", { method: "POST", body: JSON.stringify({ records }) }, async () => {
      for (const record of records) {
        const student = state.students.find((item) => String(item.id) === String(record.student_id));
        const group = state.groups.find((item) => String(item.id) === String(groupId));
        await window.crmServices?.attendanceService?.create?.({
          ...record,
          student_name: student?.full_name,
          group_name: group?.name,
          teacher_name: group?.teacher_full_name || group?.teacher_name
        });
      }
      return { ok: true };
    });
    await refreshAll();
    showToast("Davomat saqlandi.");
  }

  if (event.target.closest("[data-logout]")) {
    if (tenantLogout()) return;
    if (window.location.pathname.startsWith("/admin")) {
      adminLogout();
      showToast("Tizimdan chiqildi.");
      return;
    }
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    showAuth();
    showToast("Tizimdan chiqildi.");
  }
});

document.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-lead-id]");
  if (!card) return;
  event.dataTransfer?.setData("text/plain", card.dataset.leadId);
  card.classList.add("dragging");
});

document.addEventListener("dragend", (event) => {
  event.target.closest("[data-lead-id]")?.classList.remove("dragging");
});

document.addEventListener("dragover", (event) => {
  const column = event.target.closest(".lead-column");
  if (!column) return;
  event.preventDefault();
  column.classList.add("drop-ready");
});

document.addEventListener("dragleave", (event) => {
  event.target.closest(".lead-column")?.classList.remove("drop-ready");
});

document.addEventListener("drop", async (event) => {
  const column = event.target.closest(".lead-column");
  if (!column) return;
  event.preventDefault();
  document.querySelectorAll(".lead-column.drop-ready").forEach((item) => item.classList.remove("drop-ready"));
  const leadId = event.dataTransfer?.getData("text/plain");
  const lead = (state.leads || []).find((item) => String(item.id) === String(leadId));
  if (!lead) return;
  const statusMap = { new: "new", trial: "trial", active: "became_student", paid: "paid" };
  const status = statusMap[column.dataset.status] || "new";
  if (lead.status === status) return;
  const previous = lead.status;
  lead.status = status;
  persistCrmCollections();
  try {
    await api(`/api/leads/${lead.id}`, { method: "PUT", body: JSON.stringify(crmApiPayload("leads", lead)) });
  } catch {
    lead.status = status;
  }
  renderAll();
  showToast(`Lead "${lead.full_name || lead.name}" statusi ${statusLabels[status] || status} holatiga o'tdi.`, previous === "paid" ? "warning" : "success");
});

document.querySelector("[data-global-search]")?.addEventListener("input", (event) => {
  uiState.globalSearch = event.target.value;
  Object.keys(uiState.page).forEach((resource) => {
    uiState.page[resource] = 1;
  });
  renderGlobalSearchResults();
  refreshAll();
});

document.addEventListener("input", (event) => {
  if (event.target.closest("[data-crm-drawer]")) crmDrawerState.dirty = true;
  const generatedSearch = event.target.closest("[data-generated-search]");
  if (generatedSearch) {
    renderGeneratedEntities(generatedSearch.dataset.generatedSearch);
    return;
  }
  const uiField = event.target.closest("[data-filter]");
  if (uiField) {
    const scope = uiField.closest("[data-filter-scope]");
    const resource = scope?.dataset.filterScope;
    if (resource) {
      uiState.filters[resource] = uiState.filters[resource] || {};
      uiState.filters[resource][uiField.dataset.filter] = uiField.value;
      uiState.page[resource] = 1;
      renderAll();
    }
    return;
  }
  const crmField = event.target.closest("[data-crm-filter]");
  if (crmField) {
    const scope = crmField.closest("[data-crm-filter-scope]");
    const resource = scope?.dataset.crmFilterScope;
    if (resource) {
      crmListState[resource] = crmListState[resource] || {};
      crmListState[resource][crmField.dataset.crmFilter] = crmField.value;
      if (resource === "students") renderCrmStudents();
      if (resource === "groups") renderCrmGroups();
      if (resource === "teachers") renderCrmTeachers();
      refreshIcons();
    }
    return;
  }
  if (event.target.closest(".admin-filters")) renderAdminView(viewFromPath());
});

document.addEventListener("change", (event) => {
  if (event.target.closest("[data-crm-drawer]")) crmDrawerState.dirty = true;
  const uiField = event.target.closest("[data-filter]");
  if (uiField) {
    const scope = uiField.closest("[data-filter-scope]");
    const resource = scope?.dataset.filterScope;
    if (resource) {
      uiState.filters[resource] = uiState.filters[resource] || {};
      uiState.filters[resource][uiField.dataset.filter] = uiField.value;
      uiState.page[resource] = 1;
      renderAll();
    }
    return;
  }
  const crmField = event.target.closest("[data-crm-filter]");
  if (crmField) {
    const scope = crmField.closest("[data-crm-filter-scope]");
    const resource = scope?.dataset.crmFilterScope;
    if (resource) {
      crmListState[resource] = crmListState[resource] || {};
      crmListState[resource][crmField.dataset.crmFilter] = crmField.value;
      if (resource === "students") renderCrmStudents();
      if (resource === "groups") renderCrmGroups();
      if (resource === "teachers") renderCrmTeachers();
      refreshIcons();
    }
    return;
  }
  if (event.target.closest(".admin-filters")) renderAdminView(viewFromPath());
});

document.addEventListener("submit", async (event) => {

  const receiptSettingsForm = event.target.closest("[data-receipt-settings-form]");
  if (receiptSettingsForm) {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(receiptSettingsForm).entries());
    raw.enabled = receiptSettingsForm.elements.enabled?.checked !== false;
    raw.auto_print = receiptSettingsForm.elements.auto_print?.checked !== false;
    try {
      await api("/api/app/receipt-settings", { method: "PUT", body: JSON.stringify(raw) });
      showToast("Chek sozlamalari saqlandi.", "success");
    } catch (error) {
      showToast(error.message || "Chek sozlamalari saqlanmadi", "error");
    }
    return;
  }

  const tenantLoginForm = event.target.closest("[data-tenant-login-form]");
  if (tenantLoginForm) {
    event.preventDefault();
    await handleTenantLogin(tenantLoginForm);
    return;
  }

  const crmDrawerForm = event.target.closest("[data-crm-drawer-form]");
  if (crmDrawerForm) {
    event.preventDefault();
    await saveCrmDrawer(crmDrawerForm);
    return;
  }

  const adminLoginForm = event.target.closest("[data-admin-login-form]");
  if (adminLoginForm) {
    event.preventDefault();
    const button = adminLoginForm.querySelector("button[type='submit']");
    const errorNode = adminLoginForm.querySelector("[data-admin-login-error]");
    const data = Object.fromEntries(new FormData(adminLoginForm).entries());
    button.disabled = true;
    button.textContent = "Tekshirilmoqda...";
    try {
      const user = await adminLogin(data.email, data.password);
      button.disabled = false;
      button.textContent = "Kirish";
      hideAdminLogin();
      if (window.location.pathname !== "/ceo/dashboard") window.history.replaceState({ viewName: "admin-dashboard" }, "", "/ceo/dashboard");
      showApp(user);
      setView("admin-dashboard", { replace: true });
      showToast("CEO Control Center ochildi.");
    } catch (error) {
      button.disabled = false;
      button.textContent = "Kirish";
      errorNode.textContent = error.message || "Email yoki parol noto'g'ri.";
    }
    return;
  }

  const centerForm = event.target.closest("[data-admin-create-center]");
  if (centerForm) {
    event.preventDefault();
    await handleCreateCenter(centerForm);
    return;
  }
  const settingsForm = event.target.closest("[data-admin-settings-form]");
  if (settingsForm) {
    event.preventDefault();
    const section = settingsForm.dataset.section;
    adminState.settings[section] = Object.fromEntries(new FormData(settingsForm).entries());
    addAuditLog("settings updated", "settings", section, "-", "saved");
    saveAdminState();
    showToast("Settings saqlandi.");
    renderAdminView("admin-settings");
  }
});

document.querySelectorAll("[data-filter-scope]").forEach((scope) => {
  scope.addEventListener("input", (event) => {
    const field = event.target.closest("[data-filter]");
    if (!field) return;
    const resource = scope.dataset.filterScope;
    uiState.filters[resource] = uiState.filters[resource] || {};
    uiState.filters[resource][field.dataset.filter] = field.value;
    uiState.page[resource] = 1;
    refreshAll();
  });

  scope.addEventListener("change", (event) => {
    const field = event.target.closest("[data-filter]");
    if (!field) return;
    const resource = scope.dataset.filterScope;
    uiState.filters[resource] = uiState.filters[resource] || {};
    uiState.filters[resource][field.dataset.filter] = field.value;
    uiState.page[resource] = 1;
    refreshAll();
  });
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-attendance-group]")) renderAttendanceFlow();
});

document.querySelector("[data-forgot]")?.addEventListener("click", () => {
  showToast("Parol esdan chiqqan bo'lsa, Telegram adminiga yozing: @eduka_admin");
});

async function finishOnboarding({ skip = false } = {}) {
  const submitButton = onboardingForm?.querySelector("[data-onboarding-submit]");
  const skipButton = onboardingForm?.querySelector("[data-onboarding-skip]");
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = skip ? "O'tkazilmoqda..." : "Dashboard ochilmoqda...";
  }
  if (skipButton) skipButton.disabled = true;

  try {
    const payload = await safeApi("/api/onboarding", {
      method: "POST",
      body: JSON.stringify(skip ? { skip: true } : onboardingData)
    }, async () => {
      if (!skip) {
        for (const course of onboardingData.courses || []) await window.crmServices?.courseService?.create?.(course);
        for (const teacher of onboardingData.teachers || []) await window.crmServices?.teacherService?.create?.(teacher);
        for (const group of onboardingData.groups || []) await window.crmServices?.groupService?.create?.(group);
        for (const student of onboardingData.students || []) await window.crmServices?.studentService?.create?.(student);
      }
      return { user: { ...currentUser, organization: { ...(currentUser?.organization || {}), ...onboardingData.center, needsOnboarding: false, setupCompletedAt: new Date().toISOString() } } };
    });

    currentUser = payload.user || currentUser;
    if (currentUser?.organization) {
      currentUser.organization.needsOnboarding = false;
      currentUser.organization.setupCompletedAt = currentUser.organization.setupCompletedAt || new Date().toISOString();
    }
    closeOnboarding();
    centerName.textContent = currentUser?.organization?.name || "Eduka CRM";
    await refreshAll();
    setView("dashboard", { replace: true });
    showToast(skip ? "Setup keyinroq davom ettiriladi. Dashboard ochildi." : "Markaz sozlandi. Dashboard tayyor.");
  } catch (error) {
    showToast(error.message || "Setup yakunlanmadi. Ma'lumotlarni tekshiring.", "error");
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Dashboardga o'tish";
    }
    if (skipButton) skipButton.disabled = false;
  }
}

onboardingForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveOnboardingStep();
  if (onboardingStep < onboardingTitles.length - 1) {
    onboardingStep += 1;
    renderOnboarding();
    return;
  }
  await finishOnboarding({ skip: false });
});

onboarding?.addEventListener("click", async (event) => {
  if (event.target.closest("[data-onboarding-back]")) {
    saveOnboardingStep();
    onboardingStep = Math.max(0, onboardingStep - 1);
    renderOnboarding();
  }
  if (event.target.closest("[data-onboarding-skip]")) {
    await finishOnboarding({ skip: true });
  }
});

window.addEventListener("popstate", () => setView(viewFromPath(), { skipRoute: true }));
mobileMenu?.addEventListener("click", () => document.body.classList.toggle("menu-open"));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document.body.classList.remove("menu-open");
    closeDrawer();
    closeModal();
  }
});

checkSession();



/* ===== Eduka v20.4 Settings, Reports, Archive, Market, Permissions Upgrade ===== */
function crmNumberCompact(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("uz-UZ", { notation: number >= 1000000000 ? "compact" : "standard" }).format(number);
}

function crmDateToday() {
  return new Date().toISOString().slice(0, 10);
}

function crmMiniKpi(title, value, hint, tone = "") {
  return `<article class="crm-204-kpi ${tone}"><span>${escapeHtml(title)}</span><strong>${escapeHtml(String(value))}</strong><small>${escapeHtml(hint || "")}</small></article>`;
}

function crmFinanceRows(kind) {
  if (kind === "payments") return state.payments || [];
  if (kind === "extraIncome") return state.extraIncome || state.extra_income || [];
  if (kind === "salary") return state.salary || state.salaries || [];
  if (kind === "bonuses") return state.bonuses || [];
  if (kind === "expenses") return state.expenses || [];
  return [];
}

function renderCrmReportsPage() {
  const section = document.getElementById("reports");
  if (!section) return;
  const revenue = (state.payments || []).reduce((sum, item) => sum + Number(item.amount || item.paid_amount || 0), 0);
  const expenses = (state.expenses || []).reduce((sum, item) => sum + Number(item.amount || item.price || 0), 0);
  const salaries = (state.salary || state.salaries || []).reduce((sum, item) => sum + Number(item.amount || item.price || 0), 0);
  const debt = debtItems().reduce((sum, item) => sum + Math.abs(Number(item.balance || 0)), 0);
  const activeStudents = (state.students || []).filter((item) => item.status !== "archived" && item.status !== "left").length;
  const activeGroups = (state.groups || []).filter((item) => item.status !== "archived").length;
  const paidStudents = new Set((state.payments || []).map((item) => item.student_id || item.student_name).filter(Boolean)).size;
  const conversion = (state.leads || []).length ? Math.round((paidStudents / Math.max(state.leads.length, 1)) * 100) : 0;
  section.innerHTML = `<div class="crm-list-page reports-204-page">
    <div class="crm-204-hero">
      <div>
        <span class="crm-204-eyebrow">Reports center</span>
        <h1>Hisobotlar</h1>
        <p>Daromad, qarzdorlik, davomat, lead va o'qituvchi samaradorligini bitta joyda kuzating.</p>
      </div>
      <div class="crm-head-actions">
        <button class="crm-soft-button" type="button" data-crm-action="export-excel" data-resource="reports">Excel export</button>
        <button class="crm-primary-button" type="button" data-crm-action="export-pdf">PDF export</button>
      </div>
    </div>
    <div class="crm-204-filterbar">
      <label>Davr<input type="date" value="${crmDateToday()}" /></label>
      <label>Gacha<input type="date" value="${crmDateToday()}" /></label>
      <label>Filial<select><option>${escapeHtml(crmCenterTitle())}</option></select></label>
      <label>Format<select><option>Kunlik</option><option>Haftalik</option><option>Oylik</option></select></label>
    </div>
    <div class="crm-204-kpi-grid">
      ${crmMiniKpi("Oylik tushum", formatMoney(revenue), "To'lovlar asosida", "success")}
      ${crmMiniKpi("Sof foyda", formatMoney(revenue - expenses - salaries), "Tushum - xarajat - ish haqi", "primary")}
      ${crmMiniKpi("Qarzdorlik", formatMoney(debt), `${debtItems().length} ta yozuv`, "danger")}
      ${crmMiniKpi("Faol talabalar", activeStudents, "Real CRM holati", "")}
      ${crmMiniKpi("Faol guruhlar", activeGroups, "Arxivdan tashqari", "")}
      ${crmMiniKpi("Lead conversion", `${conversion}%`, "Lead → to'lov", "warning")}
    </div>
    <div class="crm-204-report-grid">
      <section class="crm-204-card wide"><div class="crm-204-card-head"><h2>Kunlik tushum dinamikasi</h2><span>${formatMoney(revenue)}</span></div><div class="crm-204-bars">${(state.analytics?.monthly_payments || [{ month: "May", amount: revenue }]).map((item) => `<div><i style="height:${Math.min(100, Math.max(8, Number(item.amount || 0) / Math.max(revenue, 1) * 100))}%"></i><span>${escapeHtml(item.month || item.date || "-")}</span></div>`).join("")}</div></section>
      <section class="crm-204-card"><div class="crm-204-card-head"><h2>O'qituvchi samaradorligi</h2><span>${(state.teachers || []).length} ta</span></div><div class="crm-204-rank">${(state.teachers || []).slice(0, 6).map((teacher, index) => `<article><b>${index + 1}</b><span>${escapeHtml(teacher.full_name || teacher.fullName)}</span><strong>${(state.groups || []).filter((group) => String(group.teacher_id || "") === String(teacher.id) || group.teacher_name === (teacher.full_name || teacher.fullName)).length} guruh</strong></article>`).join("") || crmProfileEmpty("O'qituvchi yo'q", "O'qituvchi qo'shilgach samaradorlik chiqadi.")}</div></section>
      <section class="crm-204-card"><div class="crm-204-card-head"><h2>Qarzdorlik xavfi</h2><span>${debtItems().length} ta</span></div><div class="crm-204-risk">${debtItems().slice(0, 5).map((item) => `<article><span>${escapeHtml(item.full_name || item.student_name || "-")}</span><b>${formatMoney(Math.abs(Number(item.balance || 0)))}</b></article>`).join("") || crmProfileEmpty("Qarzdor yo'q", "Hozircha qarzdorlik ko'rinmadi.")}</div></section>
    </div>
  </div>`;
}

function renderCrmSettingsPage() {
  const section = document.getElementById("settings");
  if (!section) return;
  const saved = loadCrmLocalState().settings || {};
  const modules = [
    ["students.create", "Talaba qo'shish"], ["payments.create", "To'lov qabul qilish"], ["groups.manage", "Guruh boshqarish"],
    ["reports.view", "Hisobotlarni ko'rish"], ["settings.manage", "Sozlamalarni o'zgartirish"], ["market.manage", "Market boshqarish"],
    ["archive.restore", "Arxivdan tiklash"], ["finance.manage", "Moliya boshqarish"], ["student_app.enable", "Student App"]
  ];
  section.innerHTML = `<div class="crm-list-page settings-204-page">
    <div class="crm-204-hero">
      <div><span class="crm-204-eyebrow">Control panel</span><h1>Sozlamalar</h1><p>Markaz profili, rollar, huquqlar, bildirishnoma va integratsiyalarni professional boshqaring.</p></div>
      <button class="crm-primary-button" type="button" data-crm-action="save-settings">Saqlash</button>
    </div>
    <form class="settings-204-grid" data-crm-settings-form>
      <article class="settings-204-card"><h2>Markaz profili</h2><label>Nomi<input name="centerName" value="${escapeHtml(saved.centerName || crmCenterTitle())}" /></label><label>Telefon<input name="phone" value="${escapeHtml(saved.phone || "")}" placeholder="+998" /></label><label>Manzil<textarea name="address">${escapeHtml(saved.address || "")}</textarea></label></article>
      <article class="settings-204-card"><h2>Billing & to'lov</h2><label>Oylik to'lov kuni<input name="paymentDay" type="number" value="${saved.paymentDay || 5}" /></label><label>Valyuta<select name="currency"><option>UZS</option></select></label><label class="crm-check-field"><input type="checkbox" name="autoDebt" ${saved.autoDebt !== false ? "checked" : ""}/><span>Qarzdorlikni avtomatik hisoblash</span></label></article>
      <article class="settings-204-card"><h2>Telegram / SMS</h2><label>Telegram Bot Token<input name="telegramToken" value="${escapeHtml(saved.telegramToken || "")}" placeholder="123456:ABC..." /></label><label>SMS provider<select name="smsProvider"><option>Eskiz</option><option>Play Mobile</option><option>Manual</option></select></label><label class="crm-check-field"><input name="telegramEnabled" type="checkbox" ${saved.telegramEnabled ? "checked" : ""} /><span>Davomat va qarzdorlik xabarlari</span></label></article>
      <article class="settings-204-card"><h2>Xavfsizlik</h2><label class="crm-check-field"><input name="require2fa" type="checkbox" ${saved.require2fa ? "checked" : ""} /><span>2FA talab qilinsin</span></label><label>Session timeout<input name="timeout" type="number" value="${saved.timeout || 60}" /></label><label>Allowed domain<input name="allowedDomain" value="${escapeHtml(saved.allowedDomain || "")}" placeholder="academy.uz" /></label></article>
      <article class="settings-204-card wide"><h2>Role & permission matrix</h2><div class="permission-matrix">${["Owner","Admin","Manager","Teacher","Accountant"].map((role) => `<div class="permission-row"><strong>${role}</strong>${modules.map(([key,label], index) => `<label><input type="checkbox" name="perm_${role}_${key}" ${role === "Owner" || (role === "Admin" && index < 7) || (role === "Accountant" && key.includes("finance") || key.includes("payments")) || (role === "Teacher" && ["reports.view"].includes(key)) ? "checked" : ""}/><span>${label}</span></label>`).join("")}</div>`).join("")}</div></article>
    </form>
  </div>`;
}

function renderCrmPermissionMatrixPage() {
  const section = document.getElementById("permissions");
  if (!section) return;
  section.innerHTML = `<div class="crm-list-page"><div class="crm-204-hero"><div><h1>Ruxsatlar</h1><p>Har bir rol uchun backend va UI ruxsatlarini boshqaring.</p></div></div></div>`;
}

function renderCrmStaffAttendancePage() {
  const section = document.getElementById("teacher-attendance");
  if (!section) return;
  const rows = (state.teachers || []).map((teacher, index) => {
    const attendance = (state.staffAttendance || []).find((entry) => String(entry.employee_id || entry.id) === String(teacher.id));
    return { id: teacher.id, name: teacher.full_name || teacher.fullName, role: "O'qituvchi", checkIn: attendance?.check_in || attendance?.arrived || "", checkOut: attendance?.check_out || "", status: attendance?.status || (attendance?.check_in ? "present" : "absent") };
  });
  const people = rows.length ? rows : [{ id: 1, name: "Eduka Admin", role: "Administrator", checkIn: "", checkOut: "", status: "absent" }];
  section.innerHTML = `<div class="crm-list-page staff-204-page">
    <div class="crm-204-hero"><div><span class="crm-204-eyebrow">HR Attendance</span><h1>Xodimlar davomati</h1><p>O'qituvchi va xodimlarning kelish-ketish holatini nazorat qiling.</p></div><button class="crm-primary-button" type="button" data-crm-action="export-excel" data-resource="staff">Excel export</button></div>
    <div class="crm-204-kpi-grid">${crmMiniKpi("Jami xodimlar", people.length, "Barcha xodimlar")}${crmMiniKpi("Kelgan", people.filter((p) => p.status === "present").length, "Bugungi")}${crmMiniKpi("Kechikkan", people.filter((p) => p.status === "late").length, "Bugungi", "warning")}${crmMiniKpi("Kelmagan", people.filter((p) => p.status === "absent").length, "Bugungi", "danger")}</div>
    <div class="crm-204-filterbar"><input placeholder="Ism orqali qidirish" /><select><option>Barcha rollar</option><option>O'qituvchi</option><option>Admin</option></select><input type="date" value="${crmDateToday()}" /></div>
    <div class="staff-204-grid">${people.map((item) => `<article class="staff-204-card"><div class="staff-avatar">${escapeHtml(item.name).slice(0,1).toUpperCase()}</div><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.role)}</p></div><span class="status-pill ${item.status}">${statusLabels[item.status] || item.status}</span><div class="staff-times"><span>Keldi: <b>${item.checkIn || "-"}</b></span><span>Ketdi: <b>${item.checkOut || "-"}</b></span></div><button type="button" data-staff-check="${item.id}">${item.status === "present" ? "Ketdi" : "Keldi"}</button></article>`).join("")}</div>
  </div>`;
}

function renderCrmArchivePage() {
  const node = document.querySelector("[data-crm-archive-page]") || document.getElementById("archive");
  if (!node) return;
  const archiveGroups = [
    ["Lidlar", state.leads || [], "archive-leads"], ["Talabalar", state.students || [], "archive-students"], ["O'qituvchilar", state.teachers || [], "archive-teachers"],
    ["Guruhlar", state.groups || [], "archive-groups"], ["To'lovlar", state.payments || [], "archive-finance-payments"], ["Xarajatlar", state.expenses || [], "archive-finance-expenses"]
  ];
  node.innerHTML = `<div class="crm-list-page archive-204-page">
    <div class="crm-204-hero"><div><span class="crm-204-eyebrow">Archive vault</span><h1>Arxiv</h1><p>O'chirilgan yoki yopilgan ma'lumotlarni qidirish, ko'rish va tiklash.</p></div><button class="crm-soft-button" type="button">Arxiv eksport</button></div>
    <div class="crm-204-kpi-grid">${archiveGroups.map(([title, list, view]) => crmMiniKpi(title, list.filter((item) => item.status === "archived" || item.deleted_at).length, `${list.length} jami`, "")).join("")}</div>
    <div class="archive-204-grid">${archiveGroups.map(([title, list, view]) => `<article class="archive-204-card"><div><h2>${title}</h2><p>${list.length} ta yozuv</p></div><div class="archive-preview">${list.slice(0,4).map((item) => `<span>${escapeHtml(item.full_name || item.fullName || item.name || item.student_name || item.action || "-")}</span>`).join("") || "<span>Ma'lumot yo'q</span>"}</div><button type="button" data-view="${view}">Ko'rish →</button></article>`).join("")}</div>
  </div>`;
}

function renderCrmMarketPage() {
  const node = document.querySelector("[data-crm-market-page]") || document.getElementById("market");
  if (!node) return;
  const products = state.products || [
    { id: 1, name: "IELTS Workbook", type: "Kitob", price: 45000, stock: 24 },
    { id: 2, name: "Speaking Club", type: "Xizmat", price: 120000, stock: 8 },
    { id: 3, name: "Eduka Premium Voucher", type: "Voucher", price: 0, stock: 100 }
  ];
  const orders = state.orders || [];
  node.innerHTML = `<div class="crm-list-page market-204-page">
    <div class="crm-204-hero"><div><span class="crm-204-eyebrow">Student market</span><h1>Market</h1><p>Mahsulot, xizmat, voucher va o'quvchilar xaridlari uchun mini-commerce modul.</p></div><button class="crm-primary-button" type="button" data-open-modal="products">Mahsulot qo'shish</button></div>
    <div class="crm-204-kpi-grid">${crmMiniKpi("Mahsulotlar", products.length, "Aktiv katalog")}${crmMiniKpi("Buyurtmalar", orders.length, "Jami order")}${crmMiniKpi("Ombor", products.reduce((s,p)=>s+Number(p.stock||0),0), "Qoldiq")}${crmMiniKpi("Tushum", formatMoney(orders.reduce((s,o)=>s+Number(o.amount||0),0)), "Market orqali")}</div>
    <div class="market-204-layout">
      <section class="crm-204-card wide"><div class="crm-204-card-head"><h2>Mahsulotlar</h2><input placeholder="Qidirish" /></div><div class="market-product-grid">${products.map((product) => `<article><div class="market-icon">${escapeHtml(product.name).slice(0,1).toUpperCase()}</div><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.type || "Mahsulot")}</p><strong>${formatMoney(product.price || 0)}</strong><span>Qoldiq: ${product.stock || 0}</span></article>`).join("")}</div></section>
      <section class="crm-204-card"><div class="crm-204-card-head"><h2>Oxirgi xaridlar</h2><span>${orders.length}</span></div>${orders.slice(0,8).map((order) => `<div class="mini-payment-row"><span>${escapeHtml(order.student_name || order.customer || "-")}</span><b>${formatMoney(order.amount || 0)}</b></div>`).join("") || crmProfileEmpty("Xaridlar yo'q", "Market xaridlari shu yerda chiqadi.")}</section>
    </div>
  </div>`;
}
