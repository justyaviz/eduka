const screen = document.querySelector("[data-student-screen]");
const navItems = [
  ["home", "Bosh sahifa"],
  ["profile", "Profil"],
  ["study", "Darslar"],
  ["rating", "Reyting"]
];

function getToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || localStorage.getItem("eduka_student_token") || "";
}

function saveToken(token) {
  if (token) localStorage.setItem("eduka_student_token", token);
}

function money(value) {
  return `${Number(value || 0).toLocaleString("uz-UZ")} so'm`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function api(path) {
  const token = getToken();
  const response = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.message || "Student App ma'lumotlarini olib bo'lmadi");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function renderLoginRequired() {
  screen.innerHTML = `
    <section class="empty-state">
      <div class="app-badge">Eduka Student App</div>
      <h1>Bot orqali kiring</h1>
      <p>Student App faqat Telegram bot orqali berilgan xavfsiz link bilan ochiladi.</p>
      <a class="primary-action" href="https://t.me/edukauz_bot">Telegram botni ochish</a>
    </section>
  `;
}

function statCard(label, value) {
  return `<article class="stat-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function list(items, empty, mapItem) {
  if (!items?.length) return `<p class="muted">${escapeHtml(empty)}</p>`;
  return `<div class="list">${items.map(mapItem).join("")}</div>`;
}

function shell(title, body, active = "home") {
  screen.innerHTML = `
    <header class="student-header">
      <div>
        <span>Eduka</span>
        <h1>${escapeHtml(title)}</h1>
      </div>
      <button type="button" data-logout>Chiqish</button>
    </header>
    <section class="student-content">${body}</section>
    <nav class="student-nav">
      ${navItems.map(([key, label]) => `<a class="${key === active ? "active" : ""}" href="/student-app/${key}${window.location.search}">${escapeHtml(label)}</a>`).join("")}
    </nav>
  `;
  screen.querySelector("[data-logout]")?.addEventListener("click", logout);
}

async function logout() {
  try {
    const token = getToken();
    if (token) {
      await fetch("/api/student-app/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    }
  } finally {
    localStorage.removeItem("eduka_student_token");
    renderLoginRequired();
  }
}

function renderHome(payload) {
  const student = payload.student || {};
  shell(
    `Salom, ${student.fullName || "o'quvchi"}`,
    `
      <div class="stats-grid">
        ${statCard("Balans", money(student.balance))}
        ${statCard("Kristallar", student.crystals || 0)}
        ${statCard("Tangalar", student.coins || 0)}
      </div>
      <h2>Bugungi darslar</h2>
      ${list(payload.lessons, "Bugun darslar yo'q", (lesson) => `
        <article class="item">
          <b>${escapeHtml(lesson.title || lesson.group_name)}</b>
          <span>${escapeHtml(lesson.time || "")}</span>
        </article>
      `)}
      <h2>Yangiliklar</h2>
      ${list(payload.news, "Yangiliklar yo'q", (item) => `
        <article class="item">
          <b>${escapeHtml(item.title)}</b>
          <span>${escapeHtml(item.description || item.publish_date || "")}</span>
        </article>
      `)}
    `,
    "home"
  );
}

function renderProfile(payload) {
  const student = payload.student || {};
  shell(
    "Profil",
    `
      <article class="profile-card">
        <div class="avatar">${escapeHtml(String(student.fullName || "O").slice(0, 1))}</div>
        <h2>${escapeHtml(student.fullName || "O'quvchi")}</h2>
        <p>${escapeHtml(student.phone || "")}</p>
      </article>
      <div class="stats-grid">
        ${statCard("Guruh", student.groupName || "-")}
        ${statCard("Kurs", student.courseName || "-")}
        ${statCard("Referral", student.referralCode || "-")}
      </div>
    `,
    "profile"
  );
}

function renderStudy(payload) {
  shell(
    "Darslar",
    list(payload.lessons, "Darslar topilmadi", (lesson) => `
      <article class="item">
        <b>${escapeHtml(lesson.title || lesson.group_name)}</b>
        <span>${escapeHtml([lesson.teacher_name, lesson.room, lesson.time].filter(Boolean).join(" | "))}</span>
      </article>
    `),
    "study"
  );
}

function renderRating(payload) {
  shell(
    "Reyting",
    list(payload.ranking, "Reyting hali shakllanmagan", (item, index) => `
      <article class="item rating-row">
        <b>${index + 1}. ${escapeHtml(item.full_name)}</b>
        <span>${escapeHtml(item.score || 0)} ball</span>
      </article>
    `),
    "rating"
  );
}

async function boot() {
  const token = getToken();
  if (!token) {
    renderLoginRequired();
    return;
  }
  saveToken(token);
  screen.innerHTML = `<section class="loading">Yuklanmoqda...</section>`;
  try {
    const view = window.location.pathname.split("/").filter(Boolean)[1] || "home";
    const payload = await api(`/api/student-app/${view}`);
    if (view === "profile") renderProfile(payload);
    else if (view === "study") renderStudy(payload);
    else if (view === "rating") renderRating(payload);
    else renderHome(payload);
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem("eduka_student_token");
      renderLoginRequired();
      return;
    }
    screen.innerHTML = `<section class="empty-state"><h1>Xatolik</h1><p>${escapeHtml(error.message)}</p></section>`;
  }
}

boot();
