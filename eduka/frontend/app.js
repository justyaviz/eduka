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

let toastTimer;
let activeModal = null;
let editingId = null;
const state = { students: [], leads: [], groups: [], teachers: [], payments: [], attendance: [] };

document.querySelectorAll(".side-nav button[data-icon]").forEach((button) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  button.dataset.icon.split(" M").forEach((segment, index) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", index ? `M${segment}` : segment);
    svg.append(path);
  });
  button.prepend(svg);
});

const statusLabels = {
  new: "Yangi",
  contacted: "Aloqa qilindi",
  trial: "Sinov darsi",
  paid: "To'lov qildi",
  lost: "Yo'qotildi",
  active: "Faol",
  frozen: "Muzlatilgan",
  left: "Ketgan",
  debtor: "Qarzdor",
  present: "Keldi",
  absent: "Kelmadi",
  late: "Kechikdi",
  excused: "Sababli"
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
      ["course_name", "Kurs", "text"],
      ["group_id", "Guruh", "select:groups"],
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
      ["course_name", "Kurs nomi", "text"],
      ["teacher_id", "O'qituvchi", "select:teachers"],
      ["teacher_name", "O'qituvchi ismi", "text"],
      ["days", "Kunlar", "text"],
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
      ["subjects", "Fanlar", "text"],
      ["salary_rate", "Oylik stavka", "number"],
      ["status", "Status", "select:activeStatus"]
    ]
  },
  payments: {
    title: "To'lov qo'shish",
    endpoint: "/api/payments",
    fields: [
      ["student_id", "Talaba", "select:students", true],
      ["amount", "Summa", "number", true],
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

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("uz-UZ")} UZS`;
}

function formatDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function showApp(user) {
  authScreen.hidden = true;
  appShell.hidden = false;
  centerName.textContent = user?.organization?.name || "ilm academy uz";
  setView("dashboard");
  refreshAll();
}

function showAuth() {
  authScreen.hidden = false;
  appShell.hidden = true;
}

function setView(viewName) {
  pageViews.forEach((view) => view.classList.toggle("active", view.id === viewName));
  navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
  financeSubnav.hidden = !["finance", "withdrawals", "expenses", "salary", "debtors"].includes(viewName);
  settingsSubnav.hidden = viewName !== "settings";
  document.body.classList.remove("menu-open");
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
  } catch {}
}

async function loadCollection(name, endpoint) {
  try {
    const payload = await api(endpoint);
    state[name] = payload.items || [];
  } catch (error) {
    showToast(error.message);
  }
}

async function refreshAll() {
  await Promise.all([
    loadSummary(),
    loadCollection("students", "/api/students"),
    loadCollection("leads", "/api/leads"),
    loadCollection("groups", "/api/groups"),
    loadCollection("teachers", "/api/teachers"),
    loadCollection("payments", "/api/payments"),
    loadCollection("attendance", "/api/attendance")
  ]);
  renderAll();
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

function resetTable(name, emptyText) {
  const table = document.querySelector(`[data-table="${name}"]`);
  if (!table) return null;
  table.querySelectorAll("div:not(:first-child)").forEach((node) => node.remove());
  if (!state[name]?.length && emptyText) row(table, [emptyText]);
  const counter = document.querySelector(`[data-count="${name}"]`);
  if (counter) counter.textContent = `Miqdor - ${state[name]?.length || 0}`;
  return table;
}

function actionButtons(resource, item) {
  const wrap = document.createElement("span");
  wrap.className = "row-actions";
  const edit = document.createElement("button");
  edit.type = "button";
  edit.textContent = "Tahrirlash";
  edit.addEventListener("click", () => openModal(resource, item));
  const remove = document.createElement("button");
  remove.type = "button";
  remove.textContent = "O'chirish";
  remove.addEventListener("click", () => deleteItem(resource, item.id));
  wrap.append(edit, remove);
  return wrap;
}

function renderAll() {
  let table = resetTable("students", "Hali talabalar yo'q. Talaba yaratish tugmasini bosing.");
  state.students.forEach((item) => row(table, [item.full_name, item.phone, item.parent_phone, item.course_name, item.group_name, statusLabels[item.status] || item.status, formatMoney(item.balance), item.note, actionButtons("students", item)]));

  table = resetTable("leads", "Hali lidlar yo'q. Lid yaratish orqali pipeline boshlang.");
  state.leads.forEach((item) => row(table, [item.full_name, item.phone, item.source, statusLabels[item.status] || item.status, item.manager_name, formatDate(item.next_contact_at), actionButtons("leads", item)]));

  table = resetTable("groups", "Hali guruhlar yo'q.");
  state.groups.forEach((item) => row(table, [item.name, item.course_name, item.teacher_full_name || item.teacher_name, item.days, `${formatDate(item.starts_at)} - ${formatDate(item.ends_at)}`, item.room, item.student_count || 0, actionButtons("groups", item)]));

  table = resetTable("teachers", "Hali o'qituvchilar yo'q.");
  state.teachers.forEach((item) => row(table, [item.full_name, item.phone, item.subjects, statusLabels[item.status] || item.status, formatMoney(item.salary_rate), actionButtons("teachers", item)]));

  table = resetTable("payments", "Hali to'lovlar yo'q.");
  let total = 0;
  state.payments.forEach((item) => {
    total += Number(item.amount || 0);
    row(table, [formatDate(item.paid_at), item.student_name, formatMoney(item.amount), item.payment_type, item.note, item.created_by_name]);
  });
  const financeTotal = document.querySelector("[data-finance-total]");
  if (financeTotal) financeTotal.textContent = formatMoney(total);

  table = resetTable("attendance", "Hali davomat belgilanmagan.");
  state.attendance.forEach((item) => row(table, [formatDate(item.lesson_date), item.student_name, item.group_name, statusLabels[item.status] || item.status, item.note]));

  renderPipeline();
}

function renderPipeline() {
  const pipeline = document.querySelector("[data-pipeline]");
  if (!pipeline) return;
  pipeline.innerHTML = "";
  ["new", "contacted", "trial", "paid", "lost"].forEach((status) => {
    const card = document.createElement("article");
    const count = state.leads.filter((lead) => lead.status === status).length;
    card.innerHTML = `<span>${statusLabels[status]}</span><strong>${count}</strong>`;
    pipeline.append(card);
  });
}

function selectOptions(type, value) {
  const staticOptions = {
    leadStatus: [["new", "Yangi"], ["contacted", "Aloqa qilindi"], ["trial", "Sinov darsi"], ["paid", "To'lov qildi"], ["lost", "Yo'qotildi"]],
    studentStatus: [["active", "Faol"], ["frozen", "Muzlatilgan"], ["left", "Ketgan"], ["debtor", "Qarzdor"]],
    activeStatus: [["active", "Faol"], ["archived", "Arxiv"]],
    attendanceStatus: [["present", "Keldi"], ["absent", "Kelmadi"], ["late", "Kechikdi"], ["excused", "Sababli"]],
    paymentType: [["naqd", "Naqd"], ["karta", "Karta"], ["click", "Click"], ["payme", "Payme"]]
  };
  const options = type === "groups" ? state.groups.map((item) => [item.id, item.name]) : type === "teachers" ? state.teachers.map((item) => [item.id, item.full_name]) : type === "students" ? state.students.map((item) => [item.id, item.full_name]) : staticOptions[type] || [];
  return `<option value="">Tanlang</option>${options.map(([id, label]) => `<option value="${id}" ${String(value || "") === String(id) ? "selected" : ""}>${label}</option>`).join("")}`;
}

function fieldHtml([name, label, type, required], item = {}) {
  const value = item[name] || "";
  if (type === "textarea") return `<label><span>${label}</span><textarea name="${name}" ${required ? "required" : ""}>${value || ""}</textarea></label>`;
  if (type.startsWith("select:")) return `<label><span>${label}</span><select name="${name}" ${required ? "required" : ""}>${selectOptions(type.split(":")[1], value)}</select></label>`;
  return `<label><span>${label}</span><input name="${name}" type="${type}" value="${String(value || "").slice(0, type === "datetime-local" ? 16 : 10)}" ${required ? "required" : ""} /></label>`;
}

function openModal(resource, item = null) {
  activeModal = resource;
  editingId = item?.id || null;
  const config = modalFields[resource];
  modalTitle.textContent = editingId ? `${config.title}ni tahrirlash` : config.title;
  modalForm.innerHTML = config.fields.map((field) => fieldHtml(field, item || {})).join("") + `<div class="modal-actions"><button type="button" data-close-modal>Bekor qilish</button><button type="submit">${editingId ? "Saqlash" : "Yaratish"}</button></div>`;
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
    await api(`${modalFields[resource].endpoint}/${id}`, { method: "DELETE" });
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
      body: JSON.stringify({ phone: formData.get("phone"), password: formData.get("password") })
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

modalForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const config = modalFields[activeModal];
  const data = Object.fromEntries(new FormData(modalForm).entries());
  const method = editingId ? "PUT" : "POST";
  const endpoint = editingId ? `${config.endpoint}/${editingId}` : config.endpoint;

  try {
    await api(endpoint, { method, body: JSON.stringify(data) });
    closeModal();
    await refreshAll();
    showToast(editingId ? "Ma'lumot saqlandi." : "Ma'lumot yaratildi.");
  } catch (error) {
    showToast(error.message);
  }
});

document.addEventListener("click", async (event) => {
  const openButton = event.target.closest("[data-open-modal]");
  if (openButton) openModal(openButton.dataset.openModal);
  if (event.target.closest("[data-close-modal]")) closeModal();

  if (event.target.closest("[data-logout]")) {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    showAuth();
    showToast("Tizimdan chiqildi.");
  }
});

document.querySelector("[data-forgot]")?.addEventListener("click", () => {
  showToast("Parol esdan chiqqan bo'lsa, Telegram adminiga yozing: @eduka_admin");
});

navButtons.forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
mobileMenu?.addEventListener("click", () => document.body.classList.toggle("menu-open"));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    document.body.classList.remove("menu-open");
    closeModal();
  }
});

checkSession();
