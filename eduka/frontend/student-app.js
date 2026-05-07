const screen = document.querySelector("[data-student-screen]");
const phone = document.querySelector("[data-student-phone]");
const BOT_URL = "https://t.me/edukauz_bot";
const ASSET_BASE = "/assets/student-app";

const routeAliases = {
  "": "home",
  home: "home",
  study: "study",
  rating: "rating",
  profile: "profile-settings",
  "profile-settings": "profile-settings",
  "profile/settings": "profile-settings",
  referral: "referral",
  referrals: "referral",
  "extra-lesson": "extra-lesson",
  dictionary: "dictionary",
  library: "library",
  "exam-results": "exam-results",
  exams: "exam-results",
  "mock-exams": "exam-results",
  "my-group": "my-group",
  group: "my-group",
  payments: "payments",
  settings: "profile-settings"
};

const resourceByRoute = {
  home: "home",
  study: "study",
  rating: "rating",
  "profile-settings": "profile",
  referral: "referrals",
  "extra-lesson": "group",
  dictionary: "dictionary",
  library: "library",
  "exam-results": "exams",
  "my-group": "group",
  payments: "payments"
};

const navItems = [
  { key: "home", label: "Asosiy", icon: "home", route: "home" },
  { key: "study", label: "O'qish", icon: "study", route: "study" },
  { key: "rating", label: "Reyting", icon: "rating", route: "rating" },
  { key: "my-group", label: "Guruhim", icon: "users", route: "my-group" },
  { key: "profile", label: "Profil", icon: "profile", route: "profile-settings" }
];

const referenceData = {
  student: {
    id: 1,
    fullName: "Ali Abduvaliyev",
    phone: "+998 90 123 45 67",
    email: "ali.abduvaliyev@gmail.com",
    username: "@ali_edu",
    groupName: "KURS - A1",
    courseName: "IELTS Foundation",
    balance: -192308,
    crystals: 120,
    coins: 2450,
    referralCode: "ALI120",
    attendancePercent: 92
  },
  organization: { id: 1, name: "Eduka", subdomain: "app" },
  events: [
    {
      id: 1,
      title: "Speaking Club uchrashuvi",
      description: "Bugun, 15:00",
      event_date: "2026-05-24",
      event_time: "15:00",
      status: "active"
    }
  ],
  news: [],
  modules: [],
  lessons: [],
  groups: [
    {
      id: 1,
      name: "KURS - A1",
      course_name: "IELTS Foundation",
      teacher_name: "Gulnora Saidova",
      lesson_days: "Dushanba, Chorshanba, Juma",
      start_time: "19:00",
      end_time: "20:30",
      room: "204",
      students_count: 24,
      attendance_percent: 92
    }
  ],
  ranking: [
    { student_id: 2, full_name: "Akbar", score: 320 },
    { student_id: 1, full_name: "Ali", score: 280 },
    { student_id: 3, full_name: "Yahyobek", score: 210 },
    { student_id: 4, full_name: "Sarvinoz", score: 180 },
    { student_id: 5, full_name: "Diyor", score: 150 },
    { student_id: 6, full_name: "Kamron", score: 120 },
    { student_id: 7, full_name: "Madina", score: 110 },
    { student_id: 8, full_name: "Shahzod", score: 90 }
  ],
  library: [
    { id: 1, title: "Atomic Habits", author: "James Clear", type: "book", rating: 4.8, level: "A2-B1" },
    { id: 2, title: "Mindset", author: "Carol Dweck", type: "book", rating: 4.7, level: "B1" }
  ],
  dictionary: [],
  exams: [{ id: 1, title: "Grammatika imtihoni", score: 96, max_score: 100, points: 24, total_points: 25, grade: "A+", exam_date: "2024-05-18" }],
  mockExams: [],
  referrals: [],
  payments: [{ id: 1, payment_month: "2026-05", due_amount: 700000, amount: 507692, status: "partial", paid_at: "2026-05-05" }]
};

const appState = {
  base: null,
  loadingRoute: "",
  studyCourse: "",
  referralTab: "Hammasi",
  libraryTab: "Kitoblar",
  extraTeacher: "",
  lessonType: "Individual",
  extraNote: "",
  toastTimer: null
};

function telegramReady() {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.setHeaderColor?.("#f6f8fc");
    window.Telegram.WebApp.setBackgroundColor?.("#f6f8fc");
  }
}

function previewMode() {
  return new URLSearchParams(window.location.search).get("preview") === "1";
}

function getToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || localStorage.getItem("eduka_student_token") || "";
}

function saveToken(token) {
  if (token) localStorage.setItem("eduka_student_token", token);
}

function currentRoute() {
  const path = window.location.pathname.replace(/\/+$/, "");
  const raw = path.split("/").filter(Boolean).slice(1).join("/") || "home";
  return routeAliases[raw] || "home";
}

function routeUrl(route) {
  const query = previewMode() ? "?preview=1" : "";
  return `/student-app/${route}${query}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function number(value) {
  return Number(value || 0).toLocaleString("uz-UZ");
}

function money(value) {
  return `${number(value)} so'm`;
}

function firstName(name) {
  return String(name || "Ali").trim().split(/\s+/)[0] || "Ali";
}

function field(item, keys, fallback = "") {
  for (const key of keys) {
    if (item && item[key] !== undefined && item[key] !== null && item[key] !== "") return item[key];
  }
  return fallback;
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function initials(name) {
  return String(name || "O")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function normalizePayload(payload = {}, options = {}) {
  const demo = Boolean(options.demo);
  const sourceStudent = payload.student || {};
  const student = {
    ...(demo ? referenceData.student : {}),
    ...sourceStudent
  };
  student.fullName = field(student, ["fullName", "full_name"], demo ? referenceData.student.fullName : "O'quvchi");
  student.groupName = field(student, ["groupName", "group_name"], demo ? referenceData.student.groupName : "");
  student.courseName = field(student, ["courseName", "course_name"], demo ? referenceData.student.courseName : "");
  student.referralCode = field(student, ["referralCode", "referral_code"], demo ? referenceData.student.referralCode : "");
  student.avatarUrl = field(student, ["avatarUrl", "avatar_url"], "");
  student.crystals = Number(field(student, ["crystals"], demo ? referenceData.student.crystals : 0));
  student.coins = Number(field(student, ["coins"], demo ? referenceData.student.coins : 0));

  const items = list(payload.items);
  const library = list(payload.library).length ? list(payload.library) : items.some((item) => !item.word) ? items : demo ? referenceData.library : [];
  const dictionary = list(payload.dictionary).length ? list(payload.dictionary) : items.some((item) => item.word) ? items : demo ? referenceData.dictionary : [];

  return {
    student,
    organization: { ...(demo ? referenceData.organization : {}), ...(payload.organization || {}) },
    settings: payload.settings || {},
    modules: list(payload.modules),
    events: list(payload.events).length ? list(payload.events) : demo ? referenceData.events : [],
    news: list(payload.news),
    lessons: list(payload.lessons),
    groups: list(payload.groups).length ? list(payload.groups) : demo ? referenceData.groups : [],
    ranking: list(payload.ranking).length ? list(payload.ranking) : demo ? referenceData.ranking : [],
    library,
    dictionary,
    exams: list(payload.exams).length ? list(payload.exams) : demo ? referenceData.exams : [],
    mockExams: list(payload.mockExams || payload.mock_exams),
    referrals: list(payload.referrals),
    payments: list(payload.payments).length ? list(payload.payments) : demo ? referenceData.payments : [],
    paymentSummary: payload.paymentSummary || payload.payment_summary || null,
    referralCode: payload.referralCode || payload.referral_code || student.referralCode
  };
}

async function api(path, options = {}) {
  const token = getToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.message || "Ma'lumotlarni olib bo'lmadi");
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function loadData(route) {
  if (previewMode()) {
    appState.base = referenceData;
    return normalizePayload(referenceData, { demo: true });
  }

  const token = getToken();
  if (!token) {
    const error = new Error("login-required");
    error.status = 401;
    throw error;
  }

  saveToken(token);
  const resource = resourceByRoute[route] || "home";
  const [basePayload, pagePayload] = await Promise.all([
    appState.base ? Promise.resolve(appState.base) : api("/api/student-app/me"),
    api(`/api/student-app/${resource}`)
  ]);
  appState.base = basePayload;
  const merged = {
    ...basePayload,
    ...pagePayload,
    student: { ...(basePayload.student || {}), ...(pagePayload.student || {}) }
  };
  return normalizePayload(merged);
}

function icon(name, extraClass = "") {
  const icons = {
    home: '<path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>',
    study: '<path d="M5 4.5h9a4 4 0 0 1 4 4V20H8a3 3 0 0 1-3-3V4.5Z"/><path d="M8 8h7"/><path d="M8 11.5h7"/>',
    rating: '<path d="M5 20V10"/><path d="M12 20V4"/><path d="M19 20v-7"/><path d="M3.5 20h17"/>',
    users: '<path d="M16 20v-1.8a3.2 3.2 0 0 0-3.2-3.2H7.2A3.2 3.2 0 0 0 4 18.2V20"/><circle cx="10" cy="8" r="3.5"/><path d="M20 20v-1.4a2.7 2.7 0 0 0-2.7-2.7"/><path d="M16.5 5.2a3 3 0 0 1 0 5.6"/>',
    profile: '<circle cx="12" cy="7.5" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    bell: '<path d="M18 9a6 6 0 1 0-12 0c0 7-2.5 7-2.5 7h17S18 16 18 9"/><path d="M9.8 20a2.4 2.4 0 0 0 4.4 0"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    sliders: '<path d="M4 7h9"/><path d="M17 7h3"/><circle cx="15" cy="7" r="2"/><path d="M4 17h3"/><path d="M11 17h9"/><circle cx="9" cy="17" r="2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7h.01"/>',
    palette: '<path d="M12 3a9 9 0 0 0 0 18h1.2a2 2 0 0 0 1.5-3.3 1.7 1.7 0 0 1 1.3-2.8H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z"/><circle cx="7.8" cy="11" r=".8"/><circle cx="10" cy="7.8" r=".8"/><circle cx="14.1" cy="7.8" r=".8"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a13 13 0 0 1 0 18"/><path d="M12 3a13 13 0 0 0 0 18"/>',
    message: '<path d="M4 5h16v11H8l-4 4V5Z"/><path d="M8 9h8"/><path d="M8 12.5h5"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    plane: '<path d="m21 3-7.2 18-4-8.8L1 8.2 21 3Z"/><path d="M9.8 12.2 21 3"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M4 10h16"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"/><path d="M16 12h4"/><path d="M4 8h15"/>',
    id: '<rect x="4" y="5" width="16" height="14" rx="3"/><circle cx="9" cy="11" r="2"/><path d="M13 10h4"/><path d="M13 14h3"/><path d="M7 16a3 3 0 0 1 4 0"/>',
    instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.2"/><path d="M16.8 7.2h.01"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
    check: '<path d="m5 12 4 4 10-10"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v6h-6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m4.9 19.1 1.4-1.4"/><path d="m17.7 6.3 1.4-1.4"/>'
  };
  return `<svg class="sa-svg ${extraClass}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.info}</svg>`;
}

function asset(name, extraClass = "", alt = "") {
  return `<img class="sa-asset ${extraClass}" src="${ASSET_BASE}/${name}.svg" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />`;
}

function avatar(student, extraClass = "") {
  if (student.avatarUrl) {
    return `<span class="sa-avatar ${extraClass}"><img src="${escapeHtml(student.avatarUrl)}" alt="${escapeHtml(student.fullName)}" /></span>`;
  }
  return `<span class="sa-avatar ${extraClass}"><span>${escapeHtml(initials(student.fullName))}</span></span>`;
}

function showLoading() {
  screen.innerHTML = `
    <section class="sa-loading">
      <div>
        <div class="sa-loader"></div>
        <p>Yuklanmoqda...</p>
      </div>
    </section>
  `;
}

function simpleHeader(title, action = "", backRoute = "home") {
  return `
    <header class="sa-simple-header">
      <button class="sa-back" type="button" data-route="${escapeHtml(backRoute)}" aria-label="Orqaga">${icon("back")}</button>
      <h1>${escapeHtml(title)}</h1>
      <div class="sa-header-action">${action || ""}</div>
    </header>
  `;
}

function iconButton(iconName, label, attributes = "") {
  return `<button class="sa-icon-button" type="button" aria-label="${escapeHtml(label)}" ${attributes}>${icon(iconName)}</button>`;
}

function sectionHead(title, route = "") {
  return `
    <div class="sa-section-head">
      <h2>${escapeHtml(title)}</h2>
      ${route ? `<button class="sa-section-link" type="button" data-route="${escapeHtml(route)}">Barchasi ${icon("chevron")}</button>` : ""}
    </div>
  `;
}

function statCard({ label, value, assetName, tone = "blue" }) {
  return `
    <article class="sa-stat-card ${escapeHtml(tone)}">
      <div class="sa-stat-art">${asset(assetName, "", label)}</div>
      <div class="sa-stat-copy">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
      <button class="sa-plus" type="button" data-action="soft-toast" data-message="${escapeHtml(label)} bo'yicha ma'lumot ochildi" aria-label="Qo'shish">${icon("plus")}</button>
    </article>
  `;
}

function eventDateParts(event) {
  const raw = field(event, ["event_date", "date"], "2026-05-24");
  const [year, month, day] = String(raw).slice(0, 10).split("-");
  const months = ["YAN", "FEV", "MAR", "APR", "MAY", "IYUN", "IYUL", "AVG", "SEN", "OKT", "NOY", "DEK"];
  const monthIndex = Number(month) - 1;
  return {
    day: day || "24",
    month: months[monthIndex] || "MAY",
    year
  };
}

function eventCard(event = referenceData.events[0]) {
  const date = eventDateParts(event);
  const title = field(event, ["title"], "Speaking Club uchrashuvi");
  const time = String(field(event, ["event_time", "time"], "15:00")).slice(0, 5);
  return `
    <article class="sa-event-card">
      <div class="sa-calendar-badge"><strong>${escapeHtml(date.day)}</strong><span>${escapeHtml(date.month)}</span></div>
      <div class="sa-event-info">
        <strong>${escapeHtml(title)}</strong>
        <span>Bugun, ${escapeHtml(time)}</span>
        <div class="sa-mini-avatars" aria-label="Qatnashuvchilar">
          <i>A</i><i>S</i><i>D</i><b>+12</b>
        </div>
      </div>
      ${asset("microphone-3d", "event-mic", "Mikrofon")}
    </article>
  `;
}

function moduleCard({ label, assetName, tone, route }) {
  return `
    <button class="sa-module-card ${escapeHtml(tone)}" type="button" data-route="${escapeHtml(route)}">
      ${asset(assetName, "", label)}
      <strong>${escapeHtml(label)}</strong>
    </button>
  `;
}

function bottomNav(active) {
  return `
    <nav class="sa-bottom-nav" aria-label="Student App navigatsiyasi">
      ${navItems
        .map(
          (item) => `
            <button type="button" class="${item.key === active ? "active" : ""}" data-route="${item.route}">
              ${icon(item.icon)}
              <span>${escapeHtml(item.label)}</span>
            </button>
          `
        )
        .join("")}
    </nav>
  `;
}

function mount(content, { active = "home", pageClass = "", noBottom = false } = {}) {
  screen.innerHTML = `
    <section class="sa-page ${pageClass} ${noBottom ? "no-bottom" : ""}">
      <div class="sa-view">${content}</div>
    </section>
    ${noBottom ? "" : bottomNav(active)}
  `;
}

function premiumEmpty({ assetName, title, subtitle, compact = false, button = "" }) {
  return `
    <section class="sa-empty ${compact ? "compact" : ""}">
      ${asset(assetName, "empty-art", title)}
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(subtitle)}</p>
      ${button}
    </section>
  `;
}

function renderLoginRequired(expired = false) {
  screen.innerHTML = `
    <section class="sa-login">
      ${asset("class-group-3d", "login-art", "Student App")}
      <h1>${expired ? "Sessiya muddati tugagan" : "Bot orqali kiring"}</h1>
      <p>${expired ? "Kabinetni ochish uchun Telegram bot orqali qayta kiring." : "Student App xavfsiz Telegram havolasi orqali ochiladi. Telefon raqamingiz va parolingiz botda tekshiriladi."}</p>
      <a class="sa-primary-button" href="${BOT_URL}">Telegram botga o'tish</a>
    </section>
  `;
}

function renderHome(data) {
  const student = data.student;
  const modules = [
    { label: "Qo'shimcha dars", assetName: "teacher-support-3d", tone: "tone-purple", route: "extra-lesson" },
    { label: "Imtihonlarim", assetName: "exam-paper-3d", tone: "tone-blue", route: "exam-results" },
    { label: "Kutubxona", assetName: "library-books-3d", tone: "tone-orange", route: "library" },
    { label: "Lug'at", assetName: "dictionary-book-3d", tone: "tone-green", route: "dictionary" },
    { label: "So'zlarni taklif qilish", assetName: "group-plus-3d", tone: "tone-violet", route: "dictionary" },
    { label: "Reyting", assetName: "trophy-gold-3d", tone: "tone-yellow", route: "rating" }
  ];
  mount(
    `
      <header class="sa-topbar">
        <div class="sa-brand">
          ${avatar(student)}
          <div class="sa-brand-title">
            <strong>Eduka</strong>
            <span>Student App</span>
          </div>
        </div>
        ${iconButton("bell", "Bildirishnomalar", 'data-action="soft-toast" data-message="Bildirishnomalar hozircha yo\'q"')}
      </header>

      <section class="sa-greeting">
        <h1>Xayrli kun, ${escapeHtml(firstName(student.fullName))}!</h1>
        <p>Bugun yangi bilimlar sari yana bir qadam!</p>
      </section>

      <section class="sa-stats-grid">
        ${statCard({ label: "Kristallar", value: number(student.crystals || 0), assetName: "crystal-3d", tone: "blue" })}
        ${statCard({ label: "Tangalaring", value: number(student.coins || 0), assetName: "coins-3d", tone: "gold" })}
      </section>

      ${eventCard(data.events?.[0])}

      ${sectionHead("Foydali modullar", "profile-settings")}
      <section class="sa-module-grid">
        ${modules.map(moduleCard).join("")}
      </section>
    `,
    { active: "home" }
  );
}

function renderProfileSettings(data) {
  const student = data.student;
  const menu = [
    { iconName: "sun", title: "Ko'rinish", value: "Yorqin tema", tone: "tone-blue" },
    { iconName: "globe", title: "Til", value: "O'zbek tili", tone: "tone-green" },
    { iconName: "users", title: "Do'stlarni taklif qilish", value: "", tone: "tone-purple", route: "referral" },
    { iconName: "message", title: "Biz bilan bog'lanish", value: "", tone: "tone-violet" },
    { iconName: "info", title: "Dastur haqida", value: "v2.1.0", tone: "tone-muted" }
  ];
  mount(
    `
      ${simpleHeader("Profil sozlamalari", "", "home")}
      <article class="sa-profile-card">
        ${avatar(student, "large")}
        <div>
          <h2>${escapeHtml(student.fullName)}</h2>
          <p>${escapeHtml(student.username || "@ali_edu")}</p>
          <p>${escapeHtml(student.email || "ali.abduvaliyev@gmail.com")}</p>
        </div>
        <span class="sa-chevron">${icon("chevron")}</span>
      </article>

      <article class="sa-level-card">
        <div>
          <span>O'quvchi darajasi</span>
          <h2>Intiluvchan</h2>
          <p>245 000 / 300 000 XP</p>
          <div class="sa-progress"><i style="width: 82%"></i></div>
        </div>
        ${asset("crystal-3d", "level-crystal", "Kristall")}
      </article>

      <section class="sa-list-card settings">
        ${menu.map(settingRow).join("")}
      </section>

      <button class="sa-exit-button" type="button" data-action="logout">${icon("logout")}Dasturdan chiqish</button>
    `,
    { active: "profile" }
  );
}

function settingRow(item) {
  const attrs = item.route ? `data-route="${escapeHtml(item.route)}"` : `data-action="soft-toast" data-message="${escapeHtml(item.title)} ochildi"`;
  return `
    <button class="sa-menu-item" type="button" ${attrs}>
      <span class="sa-menu-icon ${escapeHtml(item.tone)}">${icon(item.iconName)}</span>
      <span class="sa-menu-title">${escapeHtml(item.title)}</span>
      <span class="sa-menu-value">${escapeHtml(item.value || "")}</span>
      <span class="sa-chevron">${icon("chevron")}</span>
    </button>
  `;
}

function renderRating(data) {
  const student = data.student;
  const ranking = (data.ranking.length ? data.ranking : referenceData.ranking)
    .map((item, index) => ({
      id: field(item, ["student_id", "id"], index + 1),
      name: field(item, ["full_name", "fullName", "name"], `O'quvchi ${index + 1}`),
      score: Number(field(item, ["score", "crystals", "points"], 0))
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  const first = ranking[0] || { name: "Akbar", score: 320 };
  const second = ranking[1] || { name: "Ali", score: 280 };
  const third = ranking[2] || { name: "Yahyobek", score: 210 };

  mount(
    `
      <section class="rating-hero">
        <div class="rating-head">
          <h1>Reyting</h1>
          ${iconButton("info", "Reyting haqida", 'data-action="soft-toast" data-message="Reyting kristallar asosida hisoblanadi"')}
        </div>
        <div class="sa-confetti"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="podium">
          ${podiumItem(second, 2, "silver", "trophy-silver-3d")}
          ${podiumItem(first, 1, "gold", "trophy-gold-3d")}
          ${podiumItem(third, 3, "bronze", "trophy-bronze-3d")}
        </div>
      </section>
      <section class="rating-list">
        ${ranking.slice(3).map((item, index) => ratingRow(item, index + 4, student)).join("")}
      </section>
    `,
    { active: "rating", pageClass: "rating-page" }
  );
}

function podiumItem(item, rank, tone, assetName) {
  return `
    <article class="podium-item ${escapeHtml(tone)}">
      ${asset(assetName, "podium-trophy", `Trophy ${rank}`)}
      <div class="podium-block">
        <div class="podium-rank">${rank}</div>
        <strong>${escapeHtml(firstName(item.name))}</strong>
        <span>${asset("crystal-3d", "inline-crystal", "Kristall")}${escapeHtml(number(item.score))}</span>
      </div>
    </article>
  `;
}

function ratingRow(item, rank, student) {
  return `
    <article class="rating-row ${String(item.id) === String(student.id) ? "current" : ""}">
      <span class="rating-rank">${rank}</span>
      <span class="rating-avatar">${escapeHtml(initials(item.name))}</span>
      <span class="rating-name">${escapeHtml(item.name)}</span>
      <span class="rating-score">${asset("crystal-3d", "inline-crystal", "Kristall")}${escapeHtml(number(item.score))}</span>
    </article>
  `;
}

function renderStudy(data) {
  const groups = data.groups.length ? data.groups : referenceData.groups;
  const selected = appState.studyCourse;
  const lessons = selected ? data.lessons : [];
  mount(
    `
      ${simpleHeader("O'qish", iconButton("sliders", "Filtr", 'data-action="soft-toast" data-message="Filtrlar ochildi"'), "home")}
      <section class="sa-control-row single">
        <select class="sa-select" data-control="study-course">
          <option value="">Kursni tanlang</option>
          ${groups
            .map((group) => {
              const label = field(group, ["course_name", "courseName", "name"], "Kurs");
              const value = String(group.id || label);
              return `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
            })
            .join("")}
        </select>
      </section>
      ${
        lessons.length
          ? `<section class="sa-card-list lesson-list">${lessons.map(lessonCard).join("")}</section>`
          : premiumEmpty({
              assetName: "books-study-3d",
              title: "Kurs tanlanmadi",
              subtitle: "O'qishni davom ettirish uchun kursni tanlang va bilim sayohatingizni davom ettiring."
            })
      }
    `,
    { active: "study" }
  );
}

function lessonCard(lesson) {
  const title = field(lesson, ["title", "group_name", "name"], "Dars");
  const time = field(lesson, ["time"], "10:00 - 10:45");
  const status = field(lesson, ["status"], "Kutilmoqda");
  return `
    <article class="sa-small-card lesson">
      <span class="sa-small-icon">${icon("study")}</span>
      <div class="sa-list-main">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(time)}</span>
      </div>
      <span class="sa-pill">${escapeHtml(status)}</span>
    </article>
  `;
}

function renderReferral(data) {
  const tab = appState.referralTab;
  const referrals = data.referrals || [];
  const visible = referrals.filter((item) => tab === "Hammasi" || String(item.status || "").toLowerCase().includes(tab.toLowerCase()));
  mount(
    `
      ${simpleHeader("Referral tizimi", "", "profile-settings")}
      <section class="sa-hero-banner referral">
        <div>
          <h2>Do'stlaringizni taklif qiling</h2>
          <p>va bonuslarga ega bo'ling!</p>
        </div>
        ${asset("gift-box-3d", "banner-gift", "Sovg'a")}
      </section>
      <div class="sa-tabs">
        ${["Hammasi", "Sinovda", "Aktiv"].map((item) => `<button class="sa-tab ${item === tab ? "active" : ""}" type="button" data-referral-tab="${item}">${item}</button>`).join("")}
      </div>
      ${
        visible.length
          ? `<section class="sa-card-list">${visible.map(referralCard).join("")}</section>`
          : premiumEmpty({
              assetName: "group-plus-3d",
              title: "Hozircha takliflar yo'q",
              subtitle: "Do'stlaringizni taklif qiling va birga o'qib, sovg'alarga ega bo'ling.",
              compact: true
            })
      }
      <button class="sa-primary-button sticky-cta" type="button" data-action="share-referral">${icon("plane")}Do'st taklif qilish</button>
    `,
    { active: "profile" }
  );
}

function referralCard(item) {
  return `
    <article class="sa-small-card">
      <span class="sa-small-icon">${icon("profile")}</span>
      <div class="sa-list-main">
        <strong>${escapeHtml(field(item, ["referred_name", "name"], "Do'stingiz"))}</strong>
        <span>${escapeHtml(field(item, ["referred_phone", "phone"], ""))}</span>
      </div>
      <span class="sa-pill">${escapeHtml(field(item, ["status"], "new"))}</span>
    </article>
  `;
}

function renderExtraLesson(data) {
  const groups = data.groups.length ? data.groups : referenceData.groups;
  const teachers = [...new Map(groups.map((group) => [field(group, ["teacher_id", "teacher_name"], field(group, ["teacher_name"], "Ustoz")), field(group, ["teacher_name"], "Ustoz")])).entries()];
  mount(
    `
      ${simpleHeader("Qo'shimcha dars", "", "home")}
      <section class="sa-form-card extra-form">
        <div class="sa-form-title">
          <h2>Qo'shimcha darsga ro'yxatdan o'tish</h2>
          ${asset("teacher-support-3d", "form-teacher", "Support teacher")}
        </div>
        <label>
          <span>Support teacherni tanlang</span>
          <select class="sa-select" data-control="extra-teacher">
            <option value="">Ustozni tanlang</option>
            ${teachers.map(([value, label]) => `<option value="${escapeHtml(String(value))}" ${appState.extraTeacher === String(value) ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
          </select>
        </label>

        <div class="sa-field-label">Dars turi</div>
        <div class="sa-choice-grid">
          ${lessonTypeCard("Individual", "1 o'quvchi")}
          ${lessonTypeCard("Guruhli", "2-6 o'quvchi")}
        </div>

        <label>
          <span>Izoh</span>
          <textarea class="sa-textarea" data-control="extra-note" placeholder="Ehtiyojingizni qisqacha yozing...">${escapeHtml(appState.extraNote)}</textarea>
        </label>

        <button class="${appState.extraTeacher ? "sa-primary-button" : "sa-disabled-button"}" type="button" data-action="register-extra" ${appState.extraTeacher ? "" : "disabled"}>Ro'yxatdan o'tish</button>
        <p class="sa-form-note">Tez orada ustoz siz bilan bog'lanadi.</p>
      </section>
    `,
    { active: "study" }
  );
}

function lessonTypeCard(type, subtitle) {
  return `
    <button class="sa-choice ${appState.lessonType === type ? "active" : ""}" type="button" data-lesson-type="${escapeHtml(type)}">
      <span>${appState.lessonType === type ? icon("check") : icon("users")}</span>
      <strong>${escapeHtml(type)}</strong>
      <small>${escapeHtml(subtitle)}</small>
    </button>
  `;
}

function renderDictionary(data) {
  const items = data.dictionary || [];
  mount(
    `
      ${simpleHeader("Lug'at", iconButton("search", "Qidiruv", 'data-action="soft-toast" data-message="Qidiruv ochildi"'), "study")}
      ${
        items.length
          ? `<section class="sa-card-list">${items.map(dictionaryCard).join("")}</section>`
          : premiumEmpty({
              assetName: "dictionary-book-3d",
              title: "Lug'at bo'sh",
              subtitle: "Yangi so'zlarni o'rganing va ularni lug'atga qo'shing.",
              button: `<button class="sa-primary-button" type="button" data-action="soft-toast" data-message="Yangi so'z qo'shish oynasi tayyor">${icon("plus")}Yangi so'z qo'shish</button>`
            })
      }
    `,
    { active: "study" }
  );
}

function dictionaryCard(item) {
  return `
    <article class="sa-small-card word-card">
      <span class="sa-small-icon">${icon("study")}</span>
      <div class="sa-list-main">
        <strong>${escapeHtml(field(item, ["word"], "So'z"))} <em>${escapeHtml(field(item, ["pronunciation"], ""))}</em></strong>
        <span>${escapeHtml(field(item, ["translation"], ""))}. ${escapeHtml(field(item, ["example"], ""))}</span>
      </div>
      <button class="sa-mini-button" type="button" data-action="soft-toast" data-message="So'z saqlandi">${icon("plus")}</button>
    </article>
  `;
}

function renderLibrary(data) {
  const tab = appState.libraryTab;
  const tabs = ["Kitoblar", "Audio kitoblar", "Videolar"];
  const items = data.library || [];
  const visible = items.filter((item) => {
    const type = String(field(item, ["type"], "book")).toLowerCase();
    if (tab === "Kitoblar") return type.includes("book") || type.includes("kitob");
    if (tab === "Audio kitoblar") return type.includes("audio");
    return type.includes("video");
  });
  mount(
    `
      ${simpleHeader("Kutubxona", iconButton("search", "Qidiruv", 'data-action="soft-toast" data-message="Qidiruv ochildi"'), "home")}
      <div class="sa-tabs library-tabs">
        ${tabs.map((item) => `<button class="sa-tab ${item === tab ? "active" : ""}" type="button" data-library-tab="${item}">${item}</button>`).join("")}
      </div>
      <section class="library-hero">
        ${asset("library-books-3d", "library-art", "Kutubxona")}
        <h2>Ilm manbalari siz uchun</h2>
        <p>Sevimli kitoblaringizni tanlang va bilimni o'zingiz bilan olib boring.</p>
      </section>
      ${
        visible.length
          ? `
            ${sectionHead("Tavsiya etilgan kitoblar", "library")}
            <section class="book-carousel">${visible.map(libraryCard).join("")}</section>
          `
          : premiumEmpty({
              assetName: "library-books-3d",
              title: "Kutubxona bo'sh",
              subtitle: "Hozircha bu bo'limda resurslar mavjud emas.",
              compact: true
            })
      }
    `,
    { active: "study" }
  );
}

function libraryCard(item) {
  const title = field(item, ["title"], "Atomic Habits");
  const author = field(item, ["author", "description"], "James Clear");
  const rating = field(item, ["rating"], "4.8");
  return `
    <article class="book-card">
      <div class="book-cover"><span>${escapeHtml(title.split(/\s+/).slice(0, 2).join(" "))}</span></div>
      <div class="book-info">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(author)}</span>
        <small>${icon("star")} ${escapeHtml(rating)}</small>
      </div>
      <button class="sa-mini-cta" type="button" data-action="soft-toast" data-message="${escapeHtml(title)} ochildi">O'qish</button>
    </article>
  `;
}

function renderExamResults(data) {
  const exams = data.exams.length ? data.exams : previewMode() ? referenceData.exams : [];
  if (!exams.length) {
    mount(
      `
        ${simpleHeader("Imtihon natijarim", "", "home")}
        <section class="sa-hero-banner exam">
          <div>
            <h2>Zo'r natijalar sari!</h2>
            <p>Doimiy mashq va intilish - muvaffaqiyat kaliti.</p>
          </div>
          ${asset("exam-paper-3d", "banner-exam", "Imtihon")}
        </section>
        ${premiumEmpty({
          assetName: "exam-paper-3d",
          title: "Natijalar yo'q",
          subtitle: "Hozircha imtihon natijalari mavjud emas.",
          compact: true
        })}
      `,
      { active: "study" }
    );
    return;
  }
  const latest = exams[0];
  const score = resultPercent(latest);
  const totalPoints = Number(field(latest, ["total_points", "max_points"], 25));
  const points = Number(field(latest, ["points"], Math.round((score / 100) * totalPoints)));
  mount(
    `
      ${simpleHeader("Imtihon natijarim", "", "home")}
      <section class="sa-hero-banner exam">
        <div>
          <h2>Zo'r natijalar sari!</h2>
          <p>Doimiy mashq va intilish - muvaffaqiyat kaliti.</p>
        </div>
        ${asset("exam-paper-3d", "banner-exam", "Imtihon")}
      </section>
      <section class="exam-result-card">
        <h2>So'nggi natijalar</h2>
        <div class="exam-result-main">
          <div class="grade-badge">${escapeHtml(field(latest, ["grade"], "A+"))}</div>
          <div class="exam-name">
            <strong>${escapeHtml(field(latest, ["title"], "Grammatika imtihoni"))}</strong>
            <span>${escapeHtml(formatDate(field(latest, ["exam_date"], "2024-05-18")))}</span>
          </div>
        </div>
        <div class="score-row">
          <strong>${score}%</strong>
          <span>${escapeHtml(points)} / ${escapeHtml(totalPoints)} ball</span>
        </div>
        <p>A'lo ish! Davom eting!</p>
      </section>
      <button class="sa-primary-button" type="button" data-action="soft-toast" data-message="Barcha natijalar ochildi">Barcha natijalarim</button>
    `,
    { active: "study" }
  );
}

function resultPercent(item) {
  const score = Number(field(item, ["score"], 0));
  const max = Number(field(item, ["max_score"], 100));
  if (score <= 100 && max === 100) return Math.round(score);
  return max ? Math.round((score / max) * 100) : 0;
}

function formatDate(value) {
  const text = String(value || "").slice(0, 10);
  const parts = text.split("-");
  if (parts.length !== 3) return text || "18 May, 2024";
  const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
  return `${Number(parts[2])} ${months[Number(parts[1]) - 1] || "May"}, ${parts[0]}`;
}

function renderMyGroup(data) {
  const student = data.student;
  const group = data.groups?.[0] || referenceData.groups[0];
  const groupName = field(group, ["name"], student.groupName || "KURS - A1");
  const teacher = field(group, ["teacher_name", "teacher_full_name"], "Gulnora Saidova");
  const days = field(group, ["lesson_days", "days"], "Dushanba, Chorshanba, Juma");
  const start = String(field(group, ["start_time"], "19:00")).slice(0, 5);
  const end = String(field(group, ["end_time"], "20:30")).slice(0, 5);
  mount(
    `
      ${simpleHeader("Mening guruhim", "", "home")}
      <article class="sa-group-card">
        ${avatar({ fullName: teacher }, "teacher")}
        <div>
          <strong>${escapeHtml(groupName)}</strong>
          <span>${escapeHtml(teacher)}</span>
          <small>Support teacher</small>
          <p>${icon("calendar")}${escapeHtml(days)}</p>
          <p>${icon("clock")}${escapeHtml(start)} - ${escapeHtml(end)}</p>
        </div>
        <span class="sa-chevron">${icon("chevron")}</span>
      </article>

      ${sectionHead("Mening balansim")}
      <section class="sa-balance-grid">
        ${statCard({ label: "Kristallar", value: number(student.crystals || 0), assetName: "crystal-3d", tone: "blue" })}
        ${statCard({ label: "Tangalaring", value: number(student.coins || 0), assetName: "coins-3d", tone: "gold" })}
      </section>

      <section class="sa-list-card group-info">
        ${infoRow("instagram", "Instagram sahifamiz", "@eduka_uz")}
        ${infoRow("wallet", "To'lov va balans", "", "payments")}
        ${infoRow("id", "Shaxsiy ma'lumotlar", "", "profile-settings")}
        ${infoRow("users", "Guruh a'zolari", "")}
      </section>
    `,
    { active: "my-group" }
  );
}

function infoRow(iconName, title, value, route = "") {
  const attrs = route ? `data-route="${escapeHtml(route)}"` : `data-action="soft-toast" data-message="${escapeHtml(title)} ochildi"`;
  return `
    <button class="sa-menu-item" type="button" ${attrs}>
      <span class="sa-menu-icon tone-blue">${icon(iconName)}</span>
      <span class="sa-menu-title">${escapeHtml(title)}</span>
      <span class="sa-menu-value">${escapeHtml(value || "")}</span>
      <span class="sa-chevron">${icon("chevron")}</span>
    </button>
  `;
}

function renderPayments(data) {
  const student = data.student;
  const payments = data.payments || [];
  const totalDue = payments.reduce((sum, item) => sum + Number(field(item, ["amount_due", "due_amount"], 0)), 0);
  const totalPaid = payments.reduce((sum, item) => sum + Number(field(item, ["paid_amount", "amount"], 0)), 0);
  const calculatedDebt = Math.max(totalDue - totalPaid, 0);
  const debt = Math.max(calculatedDebt, Math.abs(Math.min(Number(student.balance || 0), 0)));
  const rows = payments
    .slice(0, 8)
    .map((item) => {
      const due = Number(field(item, ["amount_due", "due_amount"], 0));
      const paid = Number(field(item, ["paid_amount", "amount"], 0));
      const status = String(field(item, ["status"], paid >= due ? "paid" : "debt")).toLowerCase();
      const date = String(field(item, ["payment_date", "paid_at", "created_at"], "")).slice(0, 10);
      const month = field(item, ["payment_month", "month"], "Joriy oy");
      return `
        <article class="sa-small-card">
          <span class="sa-small-icon">${icon("wallet")}</span>
          <div class="sa-list-main">
            <strong>${escapeHtml(month)}</strong>
            <span>${escapeHtml(date || "Sana kiritilmagan")} - ${escapeHtml(status)}</span>
          </div>
          <span class="sa-pill">${escapeHtml(money(paid || due))}</span>
        </article>
      `;
    })
    .join("");
  mount(
    `
      ${simpleHeader("Balans va to'lov", iconButton("refresh", "Yangilash", 'data-action="retry"'), "my-group")}
      <section class="sa-balance-grid">
        ${statCard({ label: "To'langan", value: money(totalPaid), assetName: "coins-3d", tone: "blue" })}
        ${statCard({ label: "Qoldiq", value: money(debt), assetName: "calendar-event-3d", tone: "gold" })}
      </section>
      <section class="sa-content-card payment-card">
        <h2 class="sa-card-title">To'lov tarixi</h2>
        ${
          payments.length
            ? `<div class="sa-card-list">${rows}</div>`
            : premiumEmpty({ assetName: "calendar-event-3d", title: "To'lovlar yo'q", subtitle: "Hozircha to'lov tarixi mavjud emas.", compact: true })
        }
      </section>
    `,
    { active: "my-group" }
  );
}

function renderError(error) {
  if (error.status === 401) {
    localStorage.removeItem("eduka_student_token");
    renderLoginRequired(error.message !== "login-required");
    return;
  }
  screen.innerHTML = `
    <section class="sa-login">
      ${asset("books-study-3d", "login-art", "Xatolik")}
      <h1>Xatolik yuz berdi</h1>
      <p>${escapeHtml(error.message || "Ma'lumotlarni yuklashda muammo yuz berdi.")}</p>
      <button class="sa-primary-button" type="button" data-action="retry">${icon("refresh")}Qayta urinish</button>
    </section>
  `;
}

async function renderCurrent() {
  const route = currentRoute();
  appState.loadingRoute = route;
  showLoading();
  try {
    const data = await loadData(route);
    if (appState.loadingRoute !== route) return;
    const renderers = {
      home: renderHome,
      "profile-settings": renderProfileSettings,
      rating: renderRating,
      study: renderStudy,
      referral: renderReferral,
      "extra-lesson": renderExtraLesson,
      dictionary: renderDictionary,
      library: renderLibrary,
      "exam-results": renderExamResults,
      "my-group": renderMyGroup,
      payments: renderPayments
    };
    (renderers[route] || renderHome)(data);
  } catch (error) {
    renderError(error);
  }
}

function navigate(route) {
  const normalized = routeAliases[route] || route || "home";
  history.pushState({}, "", routeUrl(normalized));
  renderCurrent();
}

function toast(message, type = "info") {
  const old = phone.querySelector(".sa-toast");
  if (old) old.remove();
  clearTimeout(appState.toastTimer);
  const node = document.createElement("div");
  node.className = `sa-toast ${type}`;
  const iconName = type === "success" ? "check" : type === "error" ? "info" : "info";
  node.innerHTML = `<span>${icon(iconName)}</span><span>${escapeHtml(message)}</span>`;
  phone.appendChild(node);
  appState.toastTimer = setTimeout(() => node.remove(), 2600);
}

async function logout() {
  try {
    const token = getToken();
    if (token) {
      await fetch("/api/student-app/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } finally {
    localStorage.removeItem("eduka_student_token");
    appState.base = null;
    renderLoginRequired();
  }
}

async function shareReferral() {
  const student = appState.base?.student || referenceData.student;
  const code = student.referralCode || student.referral_code || referenceData.student.referralCode;
  const shareUrl = `${window.location.origin}/?ref=${encodeURIComponent(code)}`;
  try {
    if (getToken() && !previewMode()) {
      await api("/api/student-app/referrals/share", { method: "POST", body: JSON.stringify({}) });
    }
  } catch (_error) {
    // Sharing remains available even if optional tracking is unavailable.
  }
  const text = "Eduka orqali o'quv markazimizga qo'shiling!";
  if (navigator.share) {
    navigator.share({ title: "Eduka Student App", text, url: shareUrl }).catch(() => {});
  } else if (window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`);
  } else {
    window.location.href = `tg://msg_url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
  }
  toast("Taklif havolasi tayyor", "success");
}

async function registerExtraLesson() {
  if (!appState.extraTeacher) return;
  try {
    if (getToken() && !previewMode()) {
      await api("/api/student-app/extra-lesson/register", {
        method: "POST",
        body: JSON.stringify({
          teacher_id: Number(appState.extraTeacher) || null,
          date: new Date().toISOString().slice(0, 10),
          time: "14:00",
          purpose: `${appState.lessonType}: ${appState.extraNote || "Qo'shimcha dars"}`,
          price: 0
        })
      });
    }
    toast("Qo'shimcha dars so'rovi yuborildi", "success");
  } catch (error) {
    toast(error.message || "So'rov yuborilmadi", "error");
  }
}

screen.addEventListener("click", (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    event.preventDefault();
    navigate(routeButton.getAttribute("data-route"));
    return;
  }

  const referralTab = event.target.closest("[data-referral-tab]");
  if (referralTab) {
    appState.referralTab = referralTab.getAttribute("data-referral-tab");
    renderCurrent();
    return;
  }

  const libraryTab = event.target.closest("[data-library-tab]");
  if (libraryTab) {
    appState.libraryTab = libraryTab.getAttribute("data-library-tab");
    renderCurrent();
    return;
  }

  const lessonType = event.target.closest("[data-lesson-type]");
  if (lessonType) {
    appState.lessonType = lessonType.getAttribute("data-lesson-type");
    renderCurrent();
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const action = actionButton.getAttribute("data-action");
  if (action === "logout") logout();
  if (action === "retry") renderCurrent();
  if (action === "soft-toast") toast(actionButton.getAttribute("data-message") || "Amal bajarildi");
  if (action === "share-referral") shareReferral();
  if (action === "register-extra") registerExtraLesson();
});

screen.addEventListener("change", (event) => {
  const control = event.target.getAttribute("data-control");
  if (control === "study-course") {
    appState.studyCourse = event.target.value;
    renderCurrent();
  }
  if (control === "extra-teacher") {
    appState.extraTeacher = event.target.value;
    renderCurrent();
  }
});

screen.addEventListener("input", (event) => {
  const control = event.target.getAttribute("data-control");
  if (control === "extra-note") {
    appState.extraNote = event.target.value;
  }
});

window.addEventListener("popstate", renderCurrent);
telegramReady();
renderCurrent();
