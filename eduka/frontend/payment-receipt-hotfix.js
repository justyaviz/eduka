
/**
 * Eduka 21.4.3 Payment Hotfix
 * Fixes: payment modal freezing, group/course amount auto-fill, payment submit, auto receipt print.
 * Load after /app.js.
 */
(() => {
  const VERSION = "21.4.3-payment-hotfix";
  const API = {
    students: "/api/students?limit=500",
    groups: "/api/groups?limit=500",
    courses: "/api/courses?limit=500",
    payments: "/api/payments"
  };

  const cache = { students: [], groups: [], courses: [], paymentTypes: [] };
  let booted = false;

  const money = (value) => {
    const n = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const fmt = (value) => {
    const n = money(value);
    return new Intl.NumberFormat("uz-UZ").format(n) + " so'm";
  };

  const today = () => new Date().toISOString().slice(0, 10);

  const currentMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const text = (v) => String(v ?? "").trim();

  const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.rows)) return payload.rows;
    if (Array.isArray(payload?.students)) return payload.students;
    if (Array.isArray(payload?.groups)) return payload.groups;
    if (Array.isArray(payload?.courses)) return payload.courses;
    return [];
  };

  async function apiGet(url) {
    const res = await fetch(url, { credentials: "include", headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error(await safeMessage(res));
    return await res.json();
  }

  async function apiPost(url, body) {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await safeMessage(res));
    return await res.json();
  }

  async function safeMessage(res) {
    try {
      const j = await res.json();
      return j.message || j.error || `${res.status} ${res.statusText}`;
    } catch {
      return `${res.status} ${res.statusText}`;
    }
  }

  function toast(message, type = "info") {
    const node = document.querySelector("[data-toast]");
    if (node) {
      node.hidden = false;
      node.className = `toast toast-${type}`;
      node.textContent = message;
      clearTimeout(window.__edukaToastHotfixTimer);
      window.__edukaToastHotfixTimer = setTimeout(() => { node.hidden = true; }, 3500);
      return;
    }
    console[type === "error" ? "error" : "log"](`[Eduka] ${message}`);
  }

  function option(value, label, selected = false) {
    const o = document.createElement("option");
    o.value = value;
    o.textContent = label;
    if (selected) o.selected = true;
    return o;
  }

  function first(...values) {
    for (const value of values) {
      if (value !== undefined && value !== null && String(value).trim() !== "") return value;
    }
    return "";
  }

  function rowId(row) {
    return String(first(row.id, row.student_id, row.group_id, row.course_id));
  }

  function findStudent(id) {
    return cache.students.find((s) => String(s.id) === String(id) || String(s.student_id) === String(id));
  }

  function findGroup(id) {
    return cache.groups.find((g) => String(g.id) === String(id) || String(g.group_id) === String(id));
  }

  function findCourseByGroup(group) {
    if (!group) return null;
    const courseId = first(group.course_id, group.courseId);
    const courseName = first(group.course_name, group.course, group.courseName);
    return cache.courses.find((c) =>
      String(c.id) === String(courseId) ||
      String(c.name || c.title || "").toLowerCase() === String(courseName).toLowerCase()
    );
  }

  function groupPrice(group) {
    const course = findCourseByGroup(group);
    return money(first(
      group?.monthly_price,
      group?.price,
      group?.group_price,
      group?.amount,
      course?.price,
      course?.monthly_price,
      0
    ));
  }

  function studentBalance(student) {
    return money(first(student?.balance, student?.debt, student?.debt_amount, 0));
  }

  function guessModalForm() {
    const modal = document.querySelector("[data-modal]:not([hidden]), .modal:not([hidden]), dialog[open], .drawer:not([hidden])");
    const forms = [...document.querySelectorAll("form")];
    const visibleForms = forms.filter((form) => form.offsetParent !== null);
    const byTitle = visibleForms.find((form) => {
      const scope = form.closest("[data-modal], .modal, dialog, .drawer") || form.parentElement;
      const title = (scope?.textContent || "").toLowerCase();
      return title.includes("to'lov") || title.includes("tolov") || title.includes("payment");
    });
    return byTitle || modal?.querySelector("form") || visibleForms.at(-1) || null;
  }

  function byName(form, names) {
    for (const name of names) {
      const el = form.querySelector(`[name="${name}"], [data-field="${name}"], #${CSS.escape(name)}`);
      if (el) return el;
    }
    return null;
  }

  function findField(form, candidates, type = "") {
    const exact = byName(form, candidates);
    if (exact) return exact;

    const fields = [...form.querySelectorAll("input, select, textarea")];
    const lowerCandidates = candidates.map((x) => String(x).toLowerCase());
    return fields.find((el) => {
      const label = (el.closest("label")?.textContent || el.placeholder || el.name || el.id || "").toLowerCase();
      if (type && el.tagName.toLowerCase() !== type) return false;
      return lowerCandidates.some((c) => label.includes(c));
    }) || null;
  }

  function setValue(el, value) {
    if (!el) return;
    el.value = String(value ?? "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function loadReferenceData() {
    const [students, groups, courses] = await Promise.allSettled([
      apiGet(API.students),
      apiGet(API.groups),
      apiGet(API.courses)
    ]);
    if (students.status === "fulfilled") cache.students = normalizeList(students.value);
    if (groups.status === "fulfilled") cache.groups = normalizeList(groups.value);
    if (courses.status === "fulfilled") cache.courses = normalizeList(courses.value);
  }

  function enhancePaymentForm() {
    const form = guessModalForm();
    if (!form || form.dataset.paymentHotfix === "1") return;
    const formText = (form.closest("[data-modal], .modal, dialog, .drawer")?.textContent || form.textContent || "").toLowerCase();
    if (!formText.includes("to'lov") && !formText.includes("tolov") && !formText.includes("payment")) return;

    form.dataset.paymentHotfix = "1";

    const studentEl = findField(form, ["student_id", "student", "talaba", "o'quvchi", "oquvchi"], "select");
    const groupEl = findField(form, ["group_id", "group", "guruh"], "select");
    const amountEl = findField(form, ["amount", "paid_amount", "narx", "summa", "to'langan"]);
    const dueEl = findField(form, ["due_amount", "to'lanishi", "tolanishi", "kerak", "haqdorlik"]);
    const monthEl = findField(form, ["payment_month", "month", "oy"]);
    const dateEl = findField(form, ["payment_date", "paid_at", "sana"]);
    const typeEl = findField(form, ["payment_type", "payment_method", "to'lov usuli", "tolov usuli", "usul"]);

    if (studentEl && studentEl.tagName === "SELECT" && studentEl.options.length <= 1 && cache.students.length) {
      studentEl.innerHTML = "";
      studentEl.append(option("", "Talabani tanlang"));
      cache.students.forEach((s) => {
        const label = `${first(s.full_name, s.name, s.fullName, "Talaba")} ${first(s.phone, "")}`.trim();
        studentEl.append(option(first(s.id, s.student_id), label));
      });
    }

    if (groupEl && groupEl.tagName === "SELECT" && groupEl.options.length <= 1 && cache.groups.length) {
      groupEl.innerHTML = "";
      groupEl.append(option("", "Guruhni tanlang"));
      cache.groups.forEach((g) => {
        const label = `${first(g.name, g.title, "Guruh")} — ${fmt(groupPrice(g))}`;
        groupEl.append(option(first(g.id, g.group_id), label));
      });
    }

    if (dateEl && !dateEl.value) setValue(dateEl, today());
    if (monthEl && !monthEl.value) setValue(monthEl, currentMonth());
    if (typeEl && typeEl.tagName === "SELECT" && typeEl.options.length <= 1) {
      typeEl.innerHTML = "";
      ["Naqd pul", "Plastik karta", "Bank hisobi", "Click", "Payme", "Uzum"].forEach((x) => typeEl.append(option(x, x)));
    }

    const refreshAmount = () => {
      const group = findGroup(groupEl?.value);
      const student = findStudent(studentEl?.value);
      const price = groupPrice(group);
      const balance = studentBalance(student);
      const due = balance > 0 ? balance : price;
      if (dueEl) setValue(dueEl, due || price || "");
      if (amountEl && (!amountEl.value || money(amountEl.value) === 0)) setValue(amountEl, due || price || "");
      const helperId = "eduka-payment-helper-2143";
      let helper = form.querySelector(`#${helperId}`);
      if (!helper) {
        helper = document.createElement("div");
        helper.id = helperId;
        helper.style.cssText = "margin:10px 0;padding:10px 12px;border-radius:12px;background:#eef6ff;border-left:4px solid #2563eb;font-weight:700;color:#0f172a";
        form.insertBefore(helper, form.firstChild);
      }
      helper.textContent = `To'lanishi kerak: ${fmt(due || price || 0)}${group ? ` • Guruh: ${first(group.name, group.title)}` : ""}`;
    };

    studentEl?.addEventListener("change", () => {
      const student = findStudent(studentEl.value);
      const studentGroupId = first(student?.group_id, student?.groupId);
      if (studentGroupId && groupEl) setValue(groupEl, studentGroupId);
      refreshAmount();
    });

    groupEl?.addEventListener("change", refreshAmount);
    refreshAmount();
  }

  function collectPaymentPayload(form) {
    const studentEl = findField(form, ["student_id", "student", "talaba", "o'quvchi", "oquvchi"]);
    const groupEl = findField(form, ["group_id", "group", "guruh"]);
    const amountEl = findField(form, ["amount", "paid_amount", "narx", "summa", "to'langan"]);
    const dueEl = findField(form, ["due_amount", "to'lanishi", "tolanishi", "kerak", "haqdorlik"]);
    const monthEl = findField(form, ["payment_month", "month", "oy"]);
    const dateEl = findField(form, ["payment_date", "paid_at", "sana"]);
    const typeEl = findField(form, ["payment_type", "payment_method", "to'lov usuli", "tolov usuli", "usul"]);
    const noteEl = findField(form, ["note", "izoh"]);

    const group = findGroup(groupEl?.value);
    const student = findStudent(studentEl?.value);
    const basePrice = groupPrice(group);
    const due = money(dueEl?.value) || studentBalance(student) || basePrice;
    const paid = money(amountEl?.value) || due;

    return {
      student_id: studentEl?.value || student?.id,
      group_id: groupEl?.value || group?.id || student?.group_id || null,
      payment_month: monthEl?.value || currentMonth(),
      month: monthEl?.value || currentMonth(),
      due_amount: due,
      amount: paid,
      paid_amount: paid,
      discount: 0,
      payment_type: typeEl?.value || "Naqd pul",
      payment_method: typeEl?.value || "Naqd pul",
      payment_date: dateEl?.value || today(),
      status: paid >= due ? "paid" : "partial",
      note: noteEl?.value || ""
    };
  }

  function validatePayload(payload) {
    if (!payload.student_id) return "Talabani tanlang";
    if (!payload.group_id) return "Guruhni tanlang";
    if (!payload.amount || payload.amount <= 0) return "To'lov summasini kiriting";
    return "";
  }

  function receiptNo(payment) {
    return first(payment.receipt_no, payment.receiptNo, `CHK-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${String(first(payment.id, Date.now())).slice(-5).padStart(5, "0")}`);
  }

  function buildReceiptHtml(payment, payload) {
    const student = findStudent(payload.student_id) || {};
    const group = findGroup(payload.group_id) || {};
    const course = findCourseByGroup(group) || {};
    const rno = receiptNo(payment);
    const bot = "edukauz_bot";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`https://t.me/${bot}?start=receipt_${rno}`)}`;

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${rno}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, sans-serif; color:#111; background:white; }
  .receipt { width: 72mm; margin: 0 auto; padding: 4mm 2mm; }
  .center { text-align:center; }
  .logo { width:48px;height:48px;object-fit:contain;margin-bottom:4px; }
  h1 { margin: 4px 0 0; font-size: 22px; letter-spacing:1px; }
  h2 { margin: 10px 0; font-size: 24px; letter-spacing:1px; }
  .line { border-top:1px dashed #111; margin:10px 0; }
  .row { display:flex; align-items:flex-end; gap:6px; margin:10px 0; font-size:13px; }
  .row span:first-child { white-space:nowrap; color:#333; }
  .dots { border-bottom:1px dashed #aaa; flex:1; transform: translateY(-4px); }
  .row b { text-align:right; max-width:38mm; }
  .box { border:1.5px solid #111; border-radius:8px; padding:8px; margin:12px 0; }
  .money { display:flex; justify-content:space-between; gap:10px; padding:9px 0; border-bottom:1px dotted #999; font-size:15px; }
  .money:last-child { border-bottom:0; }
  .money b { font-size:17px; }
  .qr { width:42mm; height:42mm; object-fit:contain; margin:8px auto; display:block; }
  .thanks { font-weight:900; font-size:18px; margin-top:10px; }
</style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <img class="logo" src="/assets/logo_icon.webp" onerror="this.style.display='none'">
      <h1>${escapeHtml(first(window.__EDUKA_CENTER_NAME__, "EDUKA"))}</h1>
      <div style="font-size:18px">•</div>
      <h2>TO'LOV CHEKI</h2>
    </div>
    <div class="line"></div>
    ${receiptRow("To'lov chek nomeri", rno)}
    ${receiptRow("Filial / markaz", escapeHtml(first(window.__EDUKA_CENTER_NAME__, "ALOO ACADEMY")))}
    ${receiptRow("Sana va vaqt", new Date().toLocaleString("uz-UZ"))}
    ${receiptRow("O'quvchi ism", escapeHtml(first(student.full_name, student.name, "-")))}
    ${receiptRow("Kurs nomi", escapeHtml(first(course.name, group.course_name, "-")))}
    ${receiptRow("Guruh", escapeHtml(first(group.name, "-")))}
    ${receiptRow("To'lov turi", escapeHtml(payload.payment_type))}
    ${receiptRow("Kurs / guruh summasi", fmt(groupPrice(group)))}
    <div class="box">
      <div class="money"><span>To'lanishi kerak</span><b>${fmt(payload.due_amount)}</b></div>
      <div class="money"><span>To'langan summa</span><b>${fmt(payload.amount)}</b></div>
      <div class="money"><span>Hozirgi balans</span><b>${fmt(Math.max(0, money(payload.due_amount) - money(payload.amount)))}</b></div>
    </div>
    ${receiptRow("Administrator", escapeHtml(first(window.__EDUKA_USER_NAME__, "Admin")))}
    ${receiptRow("Status / holati", payload.status === "paid" ? "QISMAN/TO'LIQ TO'LANGAN" : "QISMAN TO'LANGAN")}
    <div class="line"></div>
    <div class="center">To'lov holatini istalgan vaqtda tekshiring</div>
    <img class="qr" src="${qrUrl}">
    <div class="center">To'lovlarni onlayn kuzatib boring<br>Hoziroq balansni tekshiring</div>
    <div class="line"></div>
    <div class="center thanks">TO'LOVINGIZ UCHUN RAHMAT</div>
  </div>
  <script>
    window.onload = () => setTimeout(() => { window.focus(); window.print(); }, 350);
    window.onafterprint = () => setTimeout(() => window.close(), 300);
  </script>
</body>
</html>`;
  }

  function receiptRow(label, value) {
    return `<div class="row"><span>${label}</span><i class="dots"></i><b>${value}</b></div>`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (m) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[m]));
  }

  function printReceipt(payment, payload) {
    const html = buildReceiptHtml(payment || {}, payload);
    const win = window.open("", "_blank", "width=430,height=800");
    if (!win) {
      toast("Print oynasi bloklandi. Brauzer popup ruxsatini yoqing.", "error");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  async function submitPayment(form, event) {
    const payload = collectPaymentPayload(form);
    const error = validatePayload(payload);
    if (error) {
      toast(error, "error");
      return;
    }

    const submitter = event?.submitter || form.querySelector('[type="submit"], button:not([type])');
    const oldText = submitter?.textContent;
    if (submitter) {
      submitter.disabled = true;
      submitter.textContent = "Saqlanmoqda...";
    }

    try {
      const result = await apiPost(API.payments, payload);
      const payment = result.payment || result.data || result.item || result.row || result;
      toast("To'lov qabul qilindi. Chek chiqarilmoqda...", "success");
      printReceipt(payment, payload);
      const closeBtn = form.closest("[data-modal], .modal, dialog, .drawer")?.querySelector('[data-close], .close, [aria-label="Yopish"]');
      closeBtn?.click();
      setTimeout(() => location.reload(), 1200);
    } catch (err) {
      console.error(err);
      toast(`To'lov qabul qilinmadi: ${err.message}`, "error");
    } finally {
      if (submitter) {
        submitter.disabled = false;
        submitter.textContent = oldText || "Saqlash";
      }
    }
  }

  function isPaymentForm(form) {
    if (!(form instanceof HTMLFormElement)) return false;

    // Do not hijack the general CRM drawer for students/groups/teachers.
    // The student drawer contains labels like "To'lov turi" and the calculated
    // "To'lanishi kerak" helper, so the old text-based detector incorrectly
    // treated student creation as a payment submit and showed "Talabani tanlang".
    const drawer = form.closest("[data-crm-drawer]");
    const drawerType = drawer?.dataset?.drawerType || drawer?.getAttribute("data-drawer-type") || "";
    if (drawer && drawerType && drawerType !== "payments") return false;

    if (form.matches("[data-payment-form], [data-crm-payment-form]")) return true;
    if (drawerType === "payments") return true;
    if (form.dataset.resource === "payments" || form.dataset.type === "payments") return true;

    const studentField = findField(form, ["student_id", "student", "talaba", "o'quvchi", "oquvchi"]);
    const amountField = findField(form, ["amount", "paid_amount", "narx", "summa", "to'langan"]);
    const monthField = findField(form, ["payment_month", "month", "oy"]);
    const methodField = findField(form, ["payment_type", "payment_method", "to'lov usuli", "tolov usuli", "usul"]);

    // A real payment form must have a student selector plus payment amount/month/method fields.
    // Student create forms can have payment_type/discount/balance, but they do not have student_id.
    return Boolean(studentField && (amountField || monthField || methodField));
  }

  function interceptPaymentSubmit(event) {
    const form = event.target;
    if (!isPaymentForm(form)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    submitPayment(form, event);
  }

  async function boot() {
    if (booted) return;
    booted = true;
    try {
      await loadReferenceData();
    } catch (err) {
      console.warn("Eduka payment hotfix data load warning:", err.message);
    }

    document.addEventListener("submit", interceptPaymentSubmit, true);
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest('[data-open-modal="payments"], button, a');
      if (!trigger) return;
      const txt = (trigger.textContent || "").toLowerCase();
      const isPayment = trigger.matches('[data-open-modal="payments"]') || txt.includes("to'lov qilish") || txt.includes("tolov qilish");
      if (isPayment) setTimeout(enhancePaymentForm, 150);
    }, true);

    document.addEventListener("change", () => setTimeout(enhancePaymentForm, 20), true);

    const mo = new MutationObserver(() => setTimeout(enhancePaymentForm, 30));
    mo.observe(document.body, { childList: true, subtree: true });

    setTimeout(enhancePaymentForm, 700);
    console.log(`Eduka ${VERSION} loaded`);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
