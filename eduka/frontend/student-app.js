const screen = document.querySelector("[data-student-screen]");
const phone = document.querySelector("[data-student-phone]");
const BOT_URL = "https://t.me/edukauz_bot";

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
  { key: "home", label: "Asosiy", icon: "🏠", route: "home" },
  { key: "study", label: "O‘qish", icon: "📖", route: "study" },
  { key: "rating", label: "Reyting", icon: "📊", route: "rating" },
  { key: "profile", label: "Profil", icon: "👤", route: "profile-settings" }
];

const referenceData = {
  student: {
    id: 1,
    fullName: "Ali Abduvaliyev",
    phone: "+998 90 123 45 67",
    email: "ali.abduvaliyev@gmail.com",
    groupName: "KURS - A1",
    courseName: "IELTS Foundation",
    balance: -192308,
    crystals: 120,
    coins: 2450,
    referralCode: "ALI120",
    attendancePercent: 92
  },
  organization: { name: "Eduka" },
  events: [
    { id: 1, title: "Speaking Club", description: "Suhbat mashqi", event_date: "2026-05-24", event_time: "15:00" }
  ],
  news: [],
  modules: [],
  lessons: [],
  groups: [
    {
      id: 1,
      name: "KURS - A1",
      course_name: "IELTS Foundation",
      teacher_name: "Mr. John",
      lesson_days: "Dushanba, Chorshanba, Juma",
      start_time: "18:00",
      end_time: "19:30",
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
    { student_id: 5, full_name: "Diyor", score: 150 }
  ],
  library: [],
  dictionary: [],
  exams: [],
  mockExams: [],
  referrals: [],
  payments: [
    { id: 1, payment_month: "2026-05", due_amount: 700000, amount: 507692, status: "partial", paid_at: "2026-05-05" }
  ]
};

const appState = {
  base: null,
  resource: {},
  loadingRoute: "",
  studyCourse: "",
  referralTab: "Hammasi",
  libraryTab: "Hammasi",
  extraTeacher: "",
  toastTimer: null
};

function telegramReady() {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.setHeaderColor?.("#f5f7fb");
    window.Telegram.WebApp.setBackgroundColor?.("#f5f7fb");
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
  return `${number(value)} so‘m`;
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

function initials(name) {
  return String(name || "O")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function normalizePayload(payload = {}) {
  const student = {
    ...referenceData.student,
    ...(payload.student || {})
  };
  student.fullName = field(student, ["fullName", "full_name"], referenceData.student.fullName);
  student.groupName = field(student, ["groupName", "group_name"], referenceData.student.groupName);
  student.courseName = field(student, ["courseName", "course_name"], referenceData.student.courseName);
  student.referralCode = field(student, ["referralCode", "referral_code"], referenceData.student.referralCode);
  student.avatarUrl = field(student, ["avatarUrl", "avatar_url"], "");

  const merged = {
    ...referenceData,
    ...payload,
    student,
    organization: { ...referenceData.organization, ...(payload.organization || {}) },
    events: payload.events || referenceData.events,
    news: payload.news || referenceData.news,
    lessons: payload.lessons || referenceData.lessons,
    groups: payload.groups || referenceData.groups,
    ranking: payload.ranking?.length ? payload.ranking : referenceData.ranking,
    library: payload.items && payload.items[0]?.type ? payload.items : payload.library || payload.items || referenceData.library,
    dictionary: payload.items && payload.items[0]?.word ? payload.items : payload.dictionary || referenceData.dictionary,
    exams: payload.exams || referenceData.exams,
    mockExams: payload.mockExams || payload.mock_exams || referenceData.mockExams,
    referrals: payload.referrals || referenceData.referrals,
    payments: payload.payments || referenceData.payments
  };
  return merged;
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
    const error = new Error(payload.message || "Ma’lumotlarni olib bo‘lmadi");
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function loadData(route) {
  if (previewMode() && !getToken()) {
    appState.base = normalizePayload(referenceData);
    appState.resource = {};
    return normalizePayload(referenceData);
  }

  const token = getToken();
  if (!token) {
    const error = new Error("login-required");
    error.status = 401;
    throw error;
  }

  saveToken(token);
  const resource = resourceByRoute[route] || "home";
  const [base, page] = await Promise.all([
    appState.base ? Promise.resolve(appState.base) : api("/api/student-app/me"),
    api(`/api/student-app/${resource}`)
  ]);
  appState.base = normalizePayload(base);
  appState.resource = normalizePayload(page);
  return normalizePayload({ ...appState.base, ...appState.resource });
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

function avatar(student, extraClass = "") {
  if (student.avatarUrl) {
    return `<span class="sa-avatar ${extraClass}"><img src="${escapeHtml(student.avatarUrl)}" alt="${escapeHtml(student.fullName)}" /></span>`;
  }
  return `<span class="sa-avatar ${extraClass}">${escapeHtml(initials(student.fullName))}</span>`;
}

function simpleHeader(title, action = "", backRoute = "home") {
  return `
    <header class="sa-simple-header">
      <button class="sa-back" type="button" data-route="${escapeHtml(backRoute)}" aria-label="Orqaga">‹</button>
      <h1>${escapeHtml(title)}</h1>
      ${action || ""}
    </header>
  `;
}

function sectionHead(title, route = "") {
  return `
    <div class="sa-section-head">
      <h2>${escapeHtml(title)}</h2>
      ${route ? `<button class="sa-section-link" type="button" data-route="${escapeHtml(route)}">Barchasi ›</button>` : ""}
    </div>
  `;
}

function statCard({ label, value, icon, tone = "blue" }) {
  return `
    <article class="sa-stat-card ${escapeHtml(tone)}">
      <div class="sa-stat-copy">
        <span>${escapeHtml(label)}</span>
        <strong><b>${escapeHtml(icon)}</b>${escapeHtml(value)}</strong>
      </div>
      <button class="sa-plus" type="button" data-action="soft-toast" data-message="${escapeHtml(label)} bo‘yicha ma’lumot ochildi">+</button>
    </article>
  `;
}

function eventCard(event = referenceData.events[0]) {
  const title = field(event, ["title"], "Speaking Club");
  const description = field(event, ["description"], "Suhbat mashqi");
  const time = field(event, ["event_time", "time"], "15:00");
  const day = String(field(event, ["event_date", "date"], "2026-05-24")).slice(-2);
  return `
    <article class="sa-event-card">
      <div class="sa-calendar" data-month="MAY">${escapeHtml(day)}</div>
      <div class="sa-event-info">
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(description)}</span>
        <small>Bugun, ${escapeHtml(String(time).slice(0, 5))}</small>
      </div>
      <div class="sa-mini-avatars" aria-label="Qatnashuvchilar">
        <i>A</i><i>S</i><i>D</i><b>+12</b>
      </div>
    </article>
  `;
}

function moduleCard(label, icon, tone, route) {
  return `
    <button class="sa-module-card ${escapeHtml(tone)}" type="button" data-route="${escapeHtml(route)}">
      <span>${escapeHtml(icon)}</span>
      <strong>${escapeHtml(label)}</strong>
    </button>
  `;
}

function illustration(type) {
  const map = {
    study: ["📘", "🔎", "book"],
    bunny: ["🐰", "", "bunny"],
    "book-bunny": ["🐰", "📖", "book-bunny"],
    "books-bunny": ["🐰", "📚", "books-bunny"],
    exam: ["🐰", "📄", "bunny"],
    gift: ["🎁", "💎", "gift"],
    group: ["👥", "📘", "group"]
  };
  const [main, accent, klass] = map[type] || map.bunny;
  return `<div class="sa-illustration ${klass}"><span class="main">${main}</span>${accent ? `<span class="accent">${accent}</span>` : ""}</div>`;
}

function emptyState(type, title, subtitle, compact = false) {
  return `
    <div class="sa-empty ${compact ? "compact" : ""}">
      ${illustration(type)}
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(subtitle)}</p>
    </div>
  `;
}

function bottomNav(active) {
  return `
    <nav class="sa-bottom-nav" aria-label="Student App navigatsiyasi">
      ${navItems
        .map(
          (item) => `
            <button type="button" class="${item.key === active ? "active" : ""}" data-route="${item.route}">
              <i>${item.icon}</i>
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

function renderLoginRequired(expired = false) {
  screen.innerHTML = `
    <section class="sa-login">
      ${illustration("group")}
      <h1>${expired ? "Sessiya muddati tugagan" : "Bot orqali kiring"}</h1>
      <p>${expired ? "Kabinetni ochish uchun Telegram bot orqali qayta kiring." : "Student App xavfsiz Telegram havolasi orqali ochiladi. Telefon raqamingiz va parolingiz botda tekshiriladi."}</p>
      <a class="sa-primary-button" href="${BOT_URL}">Telegram botga o‘tish</a>
    </section>
  `;
}

function renderHome(data) {
  const student = data.student;
  const modules = [
    ["Mening guruhim", "👥", "tone-purple", "my-group"],
    ["Imtihonlarim", "📋", "tone-blue", "exam-results"],
    ["Kutubxona", "📚", "tone-orange", "library"],
    ["Lug‘atlar", "🅰️", "tone-green", "dictionary"],
    ["Qo‘shimcha dars", "🎓", "tone-violet", "extra-lesson"],
    ["Reyting", "🏆", "tone-yellow", "rating"]
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
        <button class="sa-icon-button" type="button" data-action="soft-toast" data-message="Bildirishnomalar hozircha yo‘q">🔔</button>
      </header>

      <section class="sa-greeting">
        <h1>Xayrli kun, ${escapeHtml(firstName(student.fullName))}! 👋</h1>
        <p>Bugun yangi bilimlar sari yana bir qadam!</p>
      </section>

      <section class="sa-stats-grid">
        ${statCard({ label: "Kristallar", value: number(student.crystals || 0), icon: "💎", tone: "blue" })}
        ${statCard({ label: "Tangalaring", value: number(student.coins || 0), icon: "🪙", tone: "gold" })}
      </section>

      ${sectionHead("Tadbirlar", "news")}
      ${eventCard(data.events?.[0])}

      ${sectionHead("Foydali modullar", "profile-settings")}
      <section class="sa-module-grid">
        ${modules.map(([label, icon, tone, route]) => moduleCard(label, icon, tone, route)).join("")}
      </section>
    `,
    { active: "home" }
  );
}

function renderProfileSettings(data) {
  const student = data.student;
  const menu = [
    ["🎨", "Mavzuni o‘zgartirish", "Light", "tone-violet"],
    ["🌐", "Til", "O‘zbek tili", "tone-green"],
    ["👥", "Do‘stlarni taklif qilish", "", "tone-purple", "referral"],
    ["💬", "Biz bilan bog‘lanish", "", "tone-blue"],
    ["ℹ️", "Dastur haqida", "v2.1.0", "tone-orange"]
  ];
  mount(
    `
      ${simpleHeader("Profil sozlamalari", "", "home")}
      <article class="sa-profile-card">
        ${avatar(student)}
        <div>
          <h2>${escapeHtml(student.fullName)}</h2>
          <p>O‘quvchi</p>
          <p>${escapeHtml(student.email || "ali.abduvaliyev@gmail.com")}</p>
        </div>
        <span class="sa-chevron">›</span>
      </article>

      <div class="sa-section-label">Sozlamalar</div>
      <section class="sa-list-card">
        ${menu
          .map(
            ([icon, title, value, tone, route]) => `
              <button class="sa-menu-item" type="button" ${route ? `data-route="${route}"` : `data-action="soft-toast" data-message="${escapeHtml(title)} ochildi"`}>
                <span class="sa-menu-icon ${tone}">${icon}</span>
                <span class="sa-menu-title">${escapeHtml(title)}</span>
                <span class="sa-menu-value">${escapeHtml(value || "")}</span>
                <span class="sa-chevron">›</span>
              </button>
            `
          )
          .join("")}
      </section>

      <button class="sa-exit-button" type="button" data-action="logout">Dasturdan chiqish</button>
    `,
    { active: "profile" }
  );
}

function renderRating(data) {
  const student = data.student;
  const ranking = (data.ranking?.length ? data.ranking : referenceData.ranking)
    .map((item, index) => ({
      id: field(item, ["student_id", "id"], index + 1),
      name: field(item, ["full_name", "fullName", "name"], `O‘quvchi ${index + 1}`),
      score: Number(field(item, ["score", "crystals", "points"], 0))
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  const top = [ranking[0], ranking[1], ranking[2]].filter(Boolean);
  const first = top[0] || referenceData.ranking[0];
  const second = top[1] || referenceData.ranking[1];
  const third = top[2] || referenceData.ranking[2];
  const podiumName = (item) => firstName(item.name || item.full_name);
  const podiumScore = (item) => Number(item.score || 0);
  mount(
    `
      <section class="rating-hero">
        <div class="rating-head">
          <h1>Reyting</h1>
          <div class="rating-badges"><span>💎</span><span>⭐</span></div>
        </div>
        <div class="podium">
          <div class="podium-item second">
            <div class="podium-cup">🥈</div>
            <div class="podium-block">
              <div class="podium-rank">2</div>
              <div class="podium-name">${escapeHtml(podiumName(second))}</div>
              <div class="podium-score">💎 ${escapeHtml(podiumScore(second))}</div>
            </div>
          </div>
          <div class="podium-item first">
            <div class="podium-cup">🏆</div>
            <div class="podium-block">
              <div class="podium-rank">1</div>
              <div class="podium-name">${escapeHtml(podiumName(first))}</div>
              <div class="podium-score">💎 ${escapeHtml(podiumScore(first))}</div>
            </div>
          </div>
          <div class="podium-item third">
            <div class="podium-cup">🥉</div>
            <div class="podium-block">
              <div class="podium-rank">3</div>
              <div class="podium-name">${escapeHtml(podiumName(third))}</div>
              <div class="podium-score">💎 ${escapeHtml(podiumScore(third))}</div>
            </div>
          </div>
        </div>
      </section>
      <section class="rating-list">
        ${ranking
          .slice(0, 5)
          .map(
            (item, index) => `
              <article class="rating-row ${String(item.id) === String(student.id) ? "current" : ""}">
                <span class="rating-rank">${index + 1}</span>
                <span class="rating-avatar">${escapeHtml(initials(item.name))}</span>
                <span class="rating-name">${escapeHtml(item.name)}</span>
                <span class="rating-score">💎 ${escapeHtml(item.score)}</span>
              </article>
            `
          )
          .join("")}
      </section>
    `,
    { active: "rating", pageClass: "rating-page" }
  );
}

function renderStudy(data) {
  const groups = data.groups?.length ? data.groups : referenceData.groups;
  const selected = appState.studyCourse;
  const lessons = selected ? data.lessons || [] : [];
  mount(
    `
      ${simpleHeader("O‘qish", `<button class="sa-icon-button" type="button" data-action="soft-toast" data-message="Filtrlar ochildi">⚙️</button>`, "home")}
      <section class="sa-control-row">
        <select class="sa-select" data-control="study-course">
          <option value="">Kursni tanlang</option>
          ${groups
            .map((group) => {
              const label = field(group, ["course_name", "courseName", "name"], "Kurs");
              return `<option value="${escapeHtml(String(group.id || label))}" ${selected === String(group.id || label) ? "selected" : ""}>${escapeHtml(label)}</option>`;
            })
            .join("")}
        </select>
        <button class="sa-icon-button" type="button" data-action="soft-toast" data-message="Kurs ma’lumotlari yangilandi">💲</button>
      </section>
      ${
        lessons.length
          ? `<section class="sa-card-list">${lessons.map(lessonCard).join("")}</section>`
          : emptyState("study", "Ma’lumot topilmadi", "Hozircha bu bo‘limda ma’lumot mavjud emas.")
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
    <article class="sa-small-card">
      <span class="sa-small-icon">📘</span>
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
      <section class="sa-banner referral">
        <h2>Do‘stlaringizni taklif qiling va bonuslarga ega bo‘ling!</h2>
        <div class="sa-banner-art">🎁</div>
      </section>
      <div class="sa-tabs">
        ${["Hammasi", "Sinovda", "Aktiv"].map((item) => `<button class="sa-tab ${item === tab ? "active" : ""}" type="button" data-referral-tab="${item}">${item}</button>`).join("")}
      </div>
      ${
        visible.length
          ? `<section class="sa-card-list">${visible.map(referralCard).join("")}</section>`
          : emptyState("bunny", "Ma’lumot topilmadi", "Hali hech qanday referral qo‘shilmagan.", true)
      }
      <button class="sa-primary-button" type="button" data-action="share-referral">✈️ Taklif havolasini yuborish</button>
    `,
    { active: "profile" }
  );
}

function referralCard(item) {
  return `
    <article class="sa-small-card">
      <span class="sa-small-icon">👤</span>
      <div class="sa-list-main">
        <strong>${escapeHtml(field(item, ["referred_name", "name"], "Do‘stingiz"))}</strong>
        <span>${escapeHtml(field(item, ["referred_phone", "phone"], ""))}</span>
      </div>
      <span class="sa-pill">${escapeHtml(field(item, ["status"], "new"))}</span>
    </article>
  `;
}

function renderExtraLesson(data) {
  const groups = data.groups?.length ? data.groups : referenceData.groups;
  const teachers = [...new Map(groups.map((group) => [field(group, ["teacher_id", "teacher_name"], field(group, ["teacher_name"], "Ustoz")), field(group, ["teacher_name"], "Ustoz")])).entries()];
  mount(
    `
      ${simpleHeader("Qo‘shimcha dars", `<button class="sa-icon-button" type="button" data-action="soft-toast" data-message="So‘rovlar tarixi ochildi">🕘</button>`, "profile-settings")}
      <section class="sa-form-card">
        <h2>Qo‘shimcha darsga ro‘yxatdan o‘tish</h2>
        <label>
          Support teacherni tanlash
          <select class="sa-select" data-control="extra-teacher">
            <option value="">Ustozni tanlang</option>
            ${teachers.map(([value, label]) => `<option value="${escapeHtml(String(value))}" ${appState.extraTeacher === String(value) ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
          </select>
        </label>
      </section>
      <div style="height: 318px"></div>
      <button class="${appState.extraTeacher ? "sa-primary-button" : "sa-disabled-button"}" type="button" data-action="register-extra" ${appState.extraTeacher ? "" : "disabled"}>Ro‘yxatdan o‘tish</button>
    `,
    { active: "profile" }
  );
}

function renderDictionary(data) {
  const items = data.dictionary || [];
  mount(
    `
      ${simpleHeader("Lug‘at", `<button class="sa-icon-button" type="button" data-action="soft-toast" data-message="Saqlangan so‘zlar ochildi">🔖</button>`, "study")}
      ${
        items.length
          ? `<section class="sa-card-list">${items.map(dictionaryCard).join("")}</section>`
          : emptyState("book-bunny", "Ma’lumot topilmadi", "Lug‘atga so‘zlar hali qo‘shilmagan.")
      }
    `,
    { active: "study" }
  );
}

function dictionaryCard(item) {
  return `
    <article class="sa-small-card">
      <span class="sa-small-icon">🅰️</span>
      <div class="sa-list-main">
        <strong>${escapeHtml(field(item, ["word"], "So‘z"))} <span>${escapeHtml(field(item, ["pronunciation"], ""))}</span></strong>
        <span>${escapeHtml(field(item, ["translation"], ""))}. ${escapeHtml(field(item, ["example"], ""))}</span>
      </div>
      <button class="sa-mini-button" type="button" data-action="soft-toast" data-message="So‘z saqlandi">🔖</button>
    </article>
  `;
}

function renderLibrary(data) {
  const tab = appState.libraryTab;
  const tabs = ["Hammasi", "Kitoblar", "Audio kitoblar", "Videolar"];
  const items = data.library || [];
  const visible = items.filter((item) => tab === "Hammasi" || String(field(item, ["type"], "")).toLowerCase().includes(tab.toLowerCase().split(" ")[0]));
  mount(
    `
      ${simpleHeader("Kutubxona", `<button class="sa-icon-button" type="button" data-action="soft-toast" data-message="Qidiruv ochildi">🔎</button>`, "home")}
      <div class="sa-tabs">
        ${tabs.map((item) => `<button class="sa-tab ${item === tab ? "active" : ""}" type="button" data-library-tab="${item}">${item}</button>`).join("")}
      </div>
      ${
        visible.length
          ? `<section class="sa-card-list">${visible.map(libraryCard).join("")}</section>`
          : emptyState("books-bunny", "Ma’lumot topilmadi", "Hozircha kutubxonada hech narsa yo‘q.")
      }
    `,
    { active: "profile" }
  );
}

function libraryCard(item) {
  return `
    <article class="sa-small-card">
      <span class="sa-small-icon">📚</span>
      <div class="sa-list-main">
        <strong>${escapeHtml(field(item, ["title"], "Resurs"))}</strong>
        <span>${escapeHtml([field(item, ["type"], ""), field(item, ["level"], "")].filter(Boolean).join(" • "))}</span>
      </div>
      <span class="sa-pill">★ 4.8</span>
    </article>
  `;
}

function renderExamResults(data) {
  const exams = data.exams || [];
  mount(
    `
      ${simpleHeader("Imtihon natijarim", "", "profile-settings")}
      <section class="sa-banner exam">
        <h2>Sizning imtihon natijalaringiz</h2>
        <div class="sa-banner-art">📄</div>
      </section>
      <div style="height: 14px"></div>
      <section class="sa-content-card" style="padding: 16px;">
        <h2 class="sa-card-title">Imtihon natijarim</h2>
        ${
          exams.length
            ? `<div class="sa-card-list" style="margin-top: 12px;">${exams.map(examCard).join("")}</div>`
            : emptyState("exam", "Ma’lumot topilmadi", "Hozircha natijalar mavjud emas.", true)
        }
      </section>
    `,
    { active: "profile" }
  );
}

function examCard(item) {
  const score = Number(field(item, ["score"], 0));
  const max = Number(field(item, ["max_score"], 100));
  return `
    <article class="sa-small-card">
      <span class="sa-small-icon">📝</span>
      <div class="sa-list-main">
        <strong>${escapeHtml(field(item, ["title"], "Imtihon"))}</strong>
        <span>${escapeHtml(field(item, ["exam_date"], ""))}</span>
      </div>
      <span class="sa-pill">${score}/${max}</span>
    </article>
  `;
}

function renderMyGroup(data) {
  const student = data.student;
  const group = data.groups?.[0] || referenceData.groups[0];
  const groupName = field(group, ["name"], student.groupName || "KURS - A1");
  const teacher = field(group, ["teacher_name", "teacher_full_name"], "Mr. John");
  const studentsCount = Number(field(group, ["students_count", "studentsCount"], 24));
  mount(
    `
      ${simpleHeader("Mening guruhim", "", "profile-settings")}
      <article class="sa-group-card">
        <span class="sa-3d-icon">👥</span>
        <div>
          <strong>${escapeHtml(groupName)}</strong>
          <span>Guruh rahbari: ${escapeHtml(teacher)}</span>
          <span>${escapeHtml(studentsCount)} nafar o‘quvchi</span>
        </div>
        <span class="sa-chevron" style="color: #fff">›</span>
      </article>

      ${sectionHead("Mening balansim")}
      <section class="sa-balance-grid">
        ${statCard({ label: "Kristallar", value: number(student.crystals || 0), icon: "💎", tone: "blue" })}
        ${statCard({ label: "Tangalaring", value: number(student.coins || 0), icon: "🪙", tone: "gold" })}
      </section>

      ${sectionHead("Sozlamalar va ma’lumotlar")}
      <section class="sa-list-card">
        ${infoRow("📸", "Ijtimoiy sahifalarim", "kiritilgan")}
        ${infoRow("💳", "To‘lov va balans", money(student.balance || 0))}
        ${infoRow("👤", "Shaxsiy ma’lumotlar", "kiritilgan")}
      </section>
    `,
    { active: "profile" }
  );
}

function renderPayments(data) {
  const student = data.student;
  const payments = data.payments || [];
  const totalDue = payments.reduce((sum, item) => sum + Number(field(item, ["amount_due", "due_amount"], 0)), 0);
  const totalPaid = payments.reduce((sum, item) => sum + Number(field(item, ["paid_amount", "amount"], 0)), 0);
  const calculatedDebt = Math.max(totalDue - totalPaid, 0);
  const debt = Math.max(calculatedDebt, Math.abs(Math.min(Number(student.balance || 0), 0)));
  const statusLabels = {
    paid: "To'langan",
    partial: "Qisman",
    debt: "Qarzdor",
    overdue: "Kechikkan",
    cancelled: "Bekor qilingan"
  };
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
          <span class="sa-small-icon">💳</span>
          <div class="sa-list-main">
            <strong>${escapeHtml(month)}</strong>
            <span>${escapeHtml(date || "Sana kiritilmagan")} · ${escapeHtml(statusLabels[status] || status)}</span>
          </div>
          <span class="sa-pill">${escapeHtml(money(paid || due))}</span>
        </article>
      `;
    })
    .join("");
  mount(
    `
      ${simpleHeader("Balans va to'lov", `<button class="sa-icon-button" type="button" data-action="retry" aria-label="Yangilash">↻</button>`, "profile-settings")}
      <section class="sa-balance-grid">
        ${statCard({ label: "To'langan", value: money(totalPaid), icon: "💳", tone: "blue" })}
        ${statCard({ label: "Qoldiq", value: money(debt), icon: "⚠️", tone: "gold" })}
      </section>
      <section class="sa-content-card" style="margin-top: 14px; padding: 16px;">
        <h2 class="sa-card-title">To'lov tarixi</h2>
        ${
          payments.length
            ? `<div class="sa-card-list" style="margin-top: 12px;">${rows}</div>`
            : emptyState("exam", "Ma'lumot topilmadi", "Hozircha to'lovlar mavjud emas.", true)
        }
      </section>
    `,
    { active: "profile" }
  );
}

function infoRow(icon, title, value) {
  return `
    <button class="sa-menu-item" type="button" data-action="soft-toast" data-message="${escapeHtml(title)} ochildi">
      <span class="sa-menu-icon">${escapeHtml(icon)}</span>
      <span class="sa-menu-title">${escapeHtml(title)}</span>
      <span class="sa-menu-value">${escapeHtml(value)}</span>
      <span class="sa-chevron">›</span>
    </button>
  `;
}

function renderError(error) {
  if (error.status === 401) {
    localStorage.removeItem("eduka_student_token");
    renderLoginRequired(error.message !== "login-required");
    return;
  }
  screen.innerHTML = `
    <section class="sa-login">
      ${illustration("study")}
      <h1>Xatolik yuz berdi</h1>
      <p>${escapeHtml(error.message || "Ma’lumotlarni yuklashda muammo yuz berdi.")}</p>
      <button class="sa-primary-button" type="button" data-action="retry">Qayta urinish</button>
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
  node.innerHTML = `<span>${type === "success" ? "✅" : type === "error" ? "⚠️" : "ℹ️"}</span><span>${escapeHtml(message)}</span>`;
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
  const code = student.referralCode || referenceData.student.referralCode;
  const shareUrl = `${window.location.origin}/?ref=${encodeURIComponent(code)}`;
  try {
    if (getToken()) {
      await api("/api/student-app/referrals/share", { method: "POST", body: JSON.stringify({}) });
    }
  } catch (_error) {
    // The share action still works even if the optional tracking request is unavailable.
  }
  const text = "Eduka orqali o‘quv markazimizga qo‘shiling!";
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
          purpose: "Qo‘shimcha dars",
          price: 0
        })
      });
    }
    toast("Qo‘shimcha dars so‘rovi yuborildi", "success");
  } catch (error) {
    toast(error.message || "So‘rov yuborilmadi", "error");
  }
}

screen.addEventListener("click", (event) => {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    event.preventDefault();
    navigate(routeButton.getAttribute("data-route"));
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

screen.addEventListener("click", (event) => {
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
  }
});

window.addEventListener("popstate", renderCurrent);
telegramReady();
renderCurrent();
