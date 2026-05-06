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

let toastTimer;
let activeModal = null;
let editingId = null;
let currentUser = null;
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
  audit: [],
  superCenters: [],
  superTariffs: [],
  superSubscriptions: [],
  superPayments: [],
  superSupport: [],
  analytics: {},
  superSummary: {}
};
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
  audit: "/api/audit-logs"
};
const uiState = {
  globalSearch: "",
  filters: {},
  page: { students: 1, leads: 1, groups: 1, courses: 1, teachers: 1, payments: 1, attendance: 1, debts: 1, audit: 1, superCenters: 1, superSubscriptions: 1, superPayments: 1 },
  perPage: { students: 10, leads: 10, groups: 10, courses: 10, teachers: 10, payments: 10, attendance: 10, debts: 10, audit: 10, superCenters: 10, superSubscriptions: 10, superPayments: 10 }
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
  positions: ["Lavozimlar ro'yhati", "Adminstrator, buxgalter, kassir, teacher va boshqa rollar", "roles"],
  employees: ["Xodimlar ro'yhati", "Xodimlar, rollar va ruxsatlarni boshqarish", "table"],
  rooms: ["Xonalar", "Xona bandligi va dars jadvali bilan bog'lash", "table"],
  branches: ["Filiallar", "Filial bo'yicha talabalar, tushum va xodimlar", "table"],
  telegram: ["Telegram xabarlar", "Qarzdorlik, davomat va lid eslatmalarini yuborish", "toggles"],
  holidays: ["Bayram kunlari", "Dam olish kunlari va o'quv kalendari", "table"],
  "receipt-settings": ["Chek sozlamalari", "Chek ko'rinishi, printer va fiskal sozlamalar", "receipt"],
  courses: ["Kurslar", "Kurs narxi, davomiyligi va darajalari", "table"],
  "sms-settings": ["SMS", "SMS sotib olish, auto sms va shablonlar", "toggles"],
  forms: ["Formalar", "Lid formalar va oddiy forma sozlamalari", "table"],
  tags: ["Teglar", "Talaba, lid va guruhlar uchun teglar", "table"],
  "payment-types": ["To'lov turlari", "Naqd, karta, Click, Payme va boshqa usullar", "table"],
  accounting: ["Hisob-kitoblar", "Tarif, billing va hisob-kitob sozlamalari", "cards"],
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
  market: ["Market", "Qo'shimcha modullar va integratsiyalar", "market"]
};

const routeByView = {
  dashboard: "/app/dashboard",
  students: "/app/students",
  groups: "/app/groups",
  courses: "/app/courses",
  teachers: "/app/teachers",
  schedule: "/app/schedule",
  attendance: "/app/attendance",
  finance: "/app/payments",
  debtors: "/app/debts",
  leads: "/app/leads",
  reports: "/app/reports",
  branches: "/app/branches",
  rooms: "/app/rooms",
  telegram: "/app/telegram",
  subscription: "/app/subscription",
  settings: "/app/settings",
  "super-dashboard": "/super/dashboard",
  "super-centers": "/super/centers",
  "super-tariffs": "/super/tariffs",
  "super-subscriptions": "/super/subscriptions",
  "super-payments": "/super/payments",
  "super-support": "/super/support",
  "super-settings": "/super/settings"
};

function viewFromPath(pathname = window.location.pathname) {
  const normalized = pathname.replace(/\/$/, "");
  if (/^\/app\/students\/\d+$/.test(normalized)) return "student-profile";
  if (/^\/app\/groups\/\d+$/.test(normalized)) return "group-profile";
  if (/^\/super\/centers\/\d+$/.test(normalized)) return "super-center-profile";
  if (normalized === "/super/centers") return "super-centers";
  if (normalized === "/super/tariffs") return "super-tariffs";
  if (normalized === "/super/subscriptions") return "super-subscriptions";
  if (normalized === "/super/payments") return "super-payments";
  if (normalized === "/super/support") return "super-support";
  if (normalized === "/super/settings") return "super-settings";
  if (normalized === "/super/dashboard" || normalized === "/super") return "super-dashboard";
  const match = Object.entries(routeByView).find(([, path]) => path === normalized);
  if (match) return match[0];
  if (["/app", "/crm", "/panel", "/dashboard"].includes(normalized)) return "dashboard";
  return "dashboard";
}

function roleKey(role = currentUser?.role) {
  return String(role || "").toLowerCase();
}

function isSuperRole(role = currentUser?.role) {
  return ["super_admin", "owner"].includes(roleKey(role));
}

const superViews = new Set([
  "super-dashboard",
  "super-centers",
  "super-center-profile",
  "super-tariffs",
  "super-subscriptions",
  "super-payments",
  "super-support",
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
  "schedule",
  "attendance",
  "teacher-attendance",
  "finance",
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
  "positions",
  "employees",
  "holidays",
  "receipt-settings",
  "sms-settings",
  "forms",
  "tags",
  "payment-types",
  "accounting",
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
  "archive-students",
  "archive-teachers",
  "archive-employees",
  "archive-groups",
  "archive-finance",
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
  return allowedViewsForRole().has(viewName);
}

function defaultViewForRole(role = currentUser?.role) {
  return isSuperRole(role) ? "super-dashboard" : "dashboard";
}

function navViewFor(viewName) {
  if (viewName === "student-profile") return "students";
  if (viewName === "group-profile") return "groups";
  if (viewName === "super-center-profile") return "super-centers";
  return viewName;
}

function routeForView(viewName, options = {}) {
  if (options.route) return options.route;
  if (viewName === "student-profile") return `/app/students/${profileIdFromPath("students") || state.students[0]?.id || ""}`;
  if (viewName === "group-profile") return `/app/groups/${profileIdFromPath("groups") || state.groups[0]?.id || ""}`;
  if (viewName === "super-center-profile") return `/super/centers/${profileIdFromPath("centers") || state.superCenters[0]?.id || ""}`;
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
    section.innerHTML = generatedViewHtml(title, description, type);
    content.append(section);
  });
  refreshIcons();
}

function generatedViewHtml(title, description, type) {
  if (type === "form") {
    return `<section class="settings-panel"><h1>${title}</h1><p>${description}</p><div class="settings-form"><label>Administrator telegram username<input placeholder="https://t.me/" /></label><label>Telegram kanal<input placeholder="https://t.me/" /></label><label>YouTube<input placeholder="https://www.youtube.com/" /></label><label>Instagram<input placeholder="https://www.instagram.com/" /></label><label>Operator raqami<input placeholder="+998 __ ___ __ __" /></label><label>Viloyat<select><option>Farg'ona viloyati</option><option>Toshkent shahri</option></select></label></div><div class="modal-actions"><button type="button">Saqlash</button></div></section>`;
  }
  if (type === "toggles") {
    const rows = ["Chegirma o'qituvchilarga ta'sir qilsin", "To'lov qilingandan so'ng chek chiqarish", "To'lov yaratishda sana tanlansin", "Qarzdor talabani bloklash", "Yangi lid nomerini SMS orqali tasdiqlash", "Davomatdan keyin ota-onaga xabar yuborish"];
    return `<section class="settings-panel"><h1>${title}</h1><p>${description}</p><div class="toggle-list">${rows.map((row, index) => `<label><input type="checkbox" ${index === 1 ? "checked" : ""}/><span>${row}</span></label>`).join("")}</div></section>`;
  }
  if (type === "roles") {
    return `<section class="settings-panel"><div class="page-head"><h1>${title}</h1><button class="section-action" type="button">Lavozim qo'shish</button></div><p>${description}</p><div class="role-list">${["Exerciser", "Developer", "Kassir", "Chop etuvchi", "Marketolog", "Adminstrator", "Buxgalter", "Teacher"].map((role) => `<article><b>${role[0]}</b><span>${role}</span><small>global</small></article>`).join("")}</div></section>`;
  }
  if (type === "receipt") {
    return `<section class="split-panels"><article><div class="page-head"><h1>${title}</h1><button class="section-action">Tahrirlash</button></div><div class="table simple-table"><div><b>T/R</b><b>Nomi</b></div><div class="table-empty">Ma'lumot topilmadi</div></div></article><article><h1>Chek ko'rinishi</h1><div class="receipt-preview">EDUKA<br/>O'quv markazi cheki</div></article></section>`;
  }
  if (type === "market") {
    return `<section class="settings-panel"><h1>${title}</h1><p>${description}</p><div class="settings-grid"><article><h2>Telegram bot</h2><p>Davomat va qarzdorlik xabarlari.</p></article><article><h2>Excel import/export</h2><p>Talabalar va moliya fayllari.</p></article><article><h2>SMS gateway</h2><p>Auto SMS va shablonlar.</p></article></div></section>`;
  }
  return `<section class="settings-panel"><div class="page-head list-head"><h1>${title}</h1><label><span>15</span><input value="15" /></label><button class="section-action" type="button">Qo'shish</button></div><p>${description}</p><div class="filters"><input placeholder="Qidirish" /><button>Tozalash</button><button>Excelga eksport qilish</button></div><div class="table simple-table"><div><b>T/R</b><b>Nomi</b><b>Holat</b><b>Yaratilgan vaqt</b><b>Amallar</b></div><div class="table-empty">Ma'lumot topilmadi</div></div></section>`;
}

createGeneratedViews();

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

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3600);
}

async function readJson(response) {
  return response.json().catch(() => ({}));
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
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
    schedule: services.scheduleService
  }[resource];
}

async function safeApi(path, options, fallback) {
  try {
    return await api(path, options);
  } catch (error) {
    if (typeof fallback === "function") return fallback(error);
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
  authScreen.hidden = true;
  appShell.hidden = false;
  centerName.textContent = user?.organization?.name || "ilm academy uz";
  applyRoleUi(user?.role);
  const role = String(user?.role || "").toLowerCase();
  if (user?.organization?.needsOnboarding && !["super_admin", "owner"].includes(role)) {
    openOnboarding();
  }
  const pathView = viewFromPath();
  const initialView = isSuperRole(role)
    ? (window.location.pathname.startsWith("/super") ? pathView : "super-dashboard")
    : (window.location.pathname.startsWith("/super") ? "dashboard" : pathView);
  setView(initialView, { replace: true });
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
  onboardingForm.innerHTML = `<h3>${title}</h3><p>${description}</p>${onboardingFields(onboardingStep)}<div class="modal-actions">${onboardingStep ? '<button type="button" data-onboarding-back>Ortga</button>' : ""}<button type="submit">${onboardingStep === onboardingTitles.length - 1 ? "Dashboardga o'tish" : "Davom etish"}</button></div>`;
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
  const financeViews = ["finance", "withdrawals", "extra-income", "expenses", "salary", "bonuses", "debtors"];
  const settingsViews = ["settings", "center-info", "general-settings", "office-settings", "positions", "employees", "rooms", "holidays", "receipt-settings", "sms-settings", "forms", "tags", "payment-types", "accounting"];
  const reportViews = ["reports", "course-report", "teacher-efficiency", "cashflow-report", "salary-report", "lead-report", "removed-students-report", "points-report", "exam-report", "discount-report", "sent-sms-report", "worktime-report", "journals", "coin-report"];
  const archiveViews = ["archive-leads", "archive-students", "archive-teachers", "archive-employees", "archive-groups", "archive-finance"];
  const superSubnav = document.querySelector('[data-subnav="super"]');
  financeSubnav.hidden = !financeViews.includes(viewName);
  settingsSubnav.hidden = !settingsViews.includes(viewName);
  document.querySelector('[data-subnav="reports"]').hidden = !reportViews.includes(viewName);
  document.querySelector('[data-subnav="archive"]').hidden = !archiveViews.includes(viewName);
  if (superSubnav) superSubnav.hidden = !superViews.has(viewName);
  document.body.classList.remove("menu-open");
  const route = routeForView(viewName, options);
  if (route && !options.skipRoute && window.location.pathname !== route) {
    if (options.replace) window.history.replaceState({ viewName }, "", route);
    else window.history.pushState({ viewName }, "", route);
  }
  renderProfiles();
  refreshIcons();
}

async function checkSession() {
  try {
    const payload = await api("/api/auth/me");
    showApp(payload.user);
  } catch {
    showAuth();
  }
}

async function loadSummary() {
  try {
    const payload = await api("/api/app/summary");
    const summary = payload.summary || {};
    document.querySelectorAll("[data-summary]").forEach((node) => {
      node.textContent = Number(summary[node.dataset.summary] || 0).toLocaleString("uz-UZ");
    });
  } catch {
    const summary = mockSummary();
    document.querySelectorAll("[data-summary]").forEach((node) => {
      node.textContent = Number(summary[node.dataset.summary] || 0).toLocaleString("uz-UZ");
    });
  }
}

async function loadAnalytics() {
  try {
    const payload = await api("/api/app/analytics");
    state.analytics = payload.analytics || {};
  } catch {
    state.analytics = mockAnalytics();
  }
}

async function loadCollection(name, endpoint) {
  try {
    const payload = await api(withQuery(name, endpoint));
    state[name] = payload.items || [];
    stateMeta[name] = { total: payload.total ?? state[name].length, page: payload.page || uiState.page[name] || 1, limit: payload.limit || uiState.perPage[name] || 10 };
  } catch (error) {
    const service = serviceFor(name);
    if (service?.list) {
      state[name] = await service.list();
      delete stateMeta[name];
      return;
    }
    if (!/ruxsat|Unauthorized/i.test(error.message)) showToast(error.message);
  }
}

async function loadSchedule() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const payload = await api(`/api/schedule?date_from=${today}&date_to=${today}`);
    state.schedule = payload.items || [];
  } catch {
    state.schedule = await (window.crmServices?.scheduleService?.list?.() || Promise.resolve(window.crmMock?.schedule || []));
  }
}

async function loadSuperData() {
  const role = String(currentUser?.role || "").toLowerCase();
  if (!["super_admin", "owner"].includes(role)) return;
  try {
    const [summary, centers, tariffs, subscriptions, payments, support] = await Promise.all([
      api("/api/super/summary"),
      api("/api/super/centers"),
      api("/api/super/tariffs"),
      api("/api/super/subscriptions"),
      api("/api/super/payments"),
      api("/api/super/support")
    ]);
    state.superSummary = summary.summary || {};
    state.superCenters = centers.items || [];
    state.superTariffs = tariffs.items || [];
    state.superSubscriptions = subscriptions.items || [];
    state.superPayments = payments.items || [];
    state.superSupport = support.items || [];
  } catch (error) {
    const service = window.crmServices?.superAdminService;
    state.superSummary = await (service?.summary?.() || Promise.resolve({}));
    state.superCenters = await (service?.centers?.() || Promise.resolve(window.crmMock?.centers || []));
    state.superTariffs = await (service?.plans?.() || Promise.resolve(window.crmMock?.plans || []));
    state.superSubscriptions = await (service?.subscriptions?.() || Promise.resolve(window.crmMock?.subscriptions || []));
    state.superPayments = await (service?.payments?.() || Promise.resolve(window.crmMock?.platformPayments || []));
    state.superSupport = await (service?.support?.() || Promise.resolve(window.crmMock?.supportTickets || []));
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
    loadCollection("audit", endpoints.audit)
  ]);
  await Promise.all([loadSchedule(), loadSuperData()]);
  renderAll();
}

function applyRoleUi(role) {
  const normalized = String(role || "").toLowerCase();
  const allowed = allowedViewsForRole(normalized);

  document.querySelectorAll("[data-view]").forEach((button) => {
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
  const { items, total, maxPage } = pagedItems(resource);
  if (!total) emptyRow(table, emptyText);
  items.forEach((item) => renderer(table, item));
  const counter = document.querySelector(`[data-count="${resource}"]`);
  if (counter) counter.textContent = `Miqdor - ${total}`;
  renderPager(resource, total, maxPage);
}

function actionButtons(resource, item) {
  const wrap = document.createElement("span");
  wrap.className = "row-actions";
  if (resource === "students") {
    const profile = document.createElement("button");
    profile.type = "button";
    profile.append(svgIcon("user-plus"), document.createTextNode("Profil"));
    profile.addEventListener("click", () => setView("student-profile", { route: `/app/students/${item.id}` }));
    wrap.append(profile);
  }
  if (resource === "groups") {
    const profile = document.createElement("button");
    profile.type = "button";
    profile.append(svgIcon("layers"), document.createTextNode("Profil"));
    profile.addEventListener("click", () => setView("group-profile", { route: `/app/groups/${item.id}` }));
    wrap.append(profile);
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
    profile.addEventListener("click", () => setView("super-center-profile", { route: `/super/centers/${center.id}` }));
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
  const support = document.querySelector("[data-super-support]");
  if (support) {
    support.innerHTML = (state.superSupport || []).map((ticket) => `<article><strong>${ticket.center_name}</strong><span>${ticket.subject}</span><p>${ticket.message}</p><small>${formatDate(ticket.created_at)}</small></article>`).join("") || `<div class="empty-state">Support so'rovlari yo'q.</div>`;
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
  profile.addEventListener("click", () => setView("super-center-profile", { route: `/super/centers/${center.id}` }));
  const trial = document.createElement("button");
  trial.type = "button";
  trial.append(svgIcon("badge-check"), document.createTextNode("Trial"));
  trial.addEventListener("click", () => showToast(`${center.name} uchun trial uzaytirish placeholder.`));
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
      <div class="export-actions"><button type="button">Tarifni yangilash</button><button type="button">Invoice yuklab olish</button></div>
    </article>
    ${plans.map((plan) => `<article class="plan-card"><span>${plan.name}</span><h2>${formatMoney(plan.monthly_price || plan.price)}</h2><p>${plan.student_limit} o'quvchi, ${plan.teacher_limit} o'qituvchi, ${plan.branch_limit} filial</p><ul>${(plan.features || ["CRM", "Hisobotlar"]).map((feature) => `<li>${feature}</li>`).join("")}</ul><button type="button">Upgrade</button></article>`).join("")}`;
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
      <div class="export-actions"><button type="button">Bloklash</button><button type="button">Tarif o'zgartirish</button><button type="button">Trial berish</button><button type="button">Login qilib kirish</button><button type="button">Support izoh</button></div>` : `<div class="empty-state">Markaz topilmadi.</div>`;
  }
}

function renderAll() {
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
  renderProfiles();
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

document.querySelector("[data-demo-login]")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = "Demo ochilmoqda...";
  try {
    const payload = await api("/api/auth/demo", { method: "POST", body: JSON.stringify({}) });
    showApp(payload.user);
    showToast("Demo akkaunt haqiqiy PostgreSQL ma'lumotlari bilan ochildi.");
  } catch (error) {
    const user = await window.crmServices?.authService?.demoLogin?.();
    if (user) {
      showApp(user);
      showToast("Demo mock data bilan ochildi. Real API tayyor struktura orqali ulanadi.");
    } else {
      showToast(error.message);
    }
  } finally {
    button.disabled = false;
    button.textContent = "Demo akkaunt bilan kirish";
  }
});

modalForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
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

document.addEventListener("click", async (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton && !event.target.closest("[data-open-modal]")) {
    setView(viewButton.dataset.view);
  }

  const openButton = event.target.closest("[data-open-modal]");
  if (openButton) openModal(openButton.dataset.openModal);
  if (event.target.closest("[data-close-modal]")) closeModal();

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
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    showAuth();
    showToast("Tizimdan chiqildi.");
  }
});

document.querySelector("[data-global-search]")?.addEventListener("input", (event) => {
  uiState.globalSearch = event.target.value;
  Object.keys(uiState.page).forEach((resource) => {
    uiState.page[resource] = 1;
  });
  refreshAll();
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

onboardingForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveOnboardingStep();
  if (onboardingStep < onboardingTitles.length - 1) {
    onboardingStep += 1;
    renderOnboarding();
    return;
  }
  try {
    const payload = await safeApi("/api/onboarding", { method: "POST", body: JSON.stringify(onboardingData) }, async () => {
      for (const course of onboardingData.courses || []) await window.crmServices?.courseService?.create?.(course);
      for (const teacher of onboardingData.teachers || []) await window.crmServices?.teacherService?.create?.(teacher);
      for (const group of onboardingData.groups || []) await window.crmServices?.groupService?.create?.(group);
      for (const student of onboardingData.students || []) await window.crmServices?.studentService?.create?.(student);
      return { user: { ...currentUser, organization: { ...(currentUser?.organization || {}), ...onboardingData.center, needsOnboarding: false } } };
    });
    currentUser = payload.user || currentUser;
    closeOnboarding();
    centerName.textContent = currentUser?.organization?.name || "ilm academy uz";
    await refreshAll();
    setView("dashboard");
    showToast("Markaz sozlandi. Dashboard tayyor.");
  } catch (error) {
    showToast(error.message);
  }
});

onboarding?.addEventListener("click", (event) => {
  if (event.target.closest("[data-onboarding-back]")) {
    saveOnboardingStep();
    onboardingStep = Math.max(0, onboardingStep - 1);
    renderOnboarding();
  }
});

window.addEventListener("popstate", () => setView(viewFromPath(), { skipRoute: true }));
mobileMenu?.addEventListener("click", () => document.body.classList.toggle("menu-open"));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document.body.classList.remove("menu-open");
    closeModal();
  }
});

checkSession();
