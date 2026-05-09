const https = require("https");

const loginFlows = new Map();
let pollingStarted = false;
let pollingOffset = 0;

function safeToken() {
  return String(process.env.STUDENT_BOT_TOKEN || process.env.BOT_TOKEN || "").trim();
}

function apiRequest(token, methodName, payload = {}) {
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${token}/${methodName}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        }
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          let parsed = {};
          try {
            parsed = JSON.parse(responseBody);
          } catch {
            parsed = { ok: false, description: responseBody };
          }
          if (res.statusCode >= 200 && res.statusCode < 300 && parsed.ok) resolve(parsed);
          else reject(new Error(parsed.description || `Telegram returned ${res.statusCode}`));
        });
      }
    );
    req.setTimeout(15000, () => req.destroy(new Error("Telegram request timed out")));
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function sendMessage(token, chatId, text, replyMarkup) {
  return apiRequest(token, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {})
  }).catch((error) => {
    console.error(`Student bot sendMessage failed: ${error.message}`);
    throw error;
  });
}

function contactKeyboard() {
  return {
    resize_keyboard: true,
    one_time_keyboard: true,
    keyboard: [[{ text: "Telefon raqamni yuborish", request_contact: true }]]
  };
}

function webAppKeyboard(url) {
  return {
    inline_keyboard: [[{ text: "Student App'ni ochish", web_app: { url } }]]
  };
}

function confirmStudentKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "✅ Ha, bu menman", callback_data: "confirm_student" }],
      [{ text: "❌ Bekor qilish", callback_data: "cancel_login" }]
    ]
  };
}

function removeKeyboard() {
  return { remove_keyboard: true };
}

function normalizeContactPhone(message, deps) {
  const phone = message.contact?.phone_number || message.text || "";
  return deps.normalizePhone(phone);
}

async function askForContact(token, chatId) {
  loginFlows.set(String(chatId), { step: "phone" });
  await sendMessage(
    token,
    chatId,
    "Assalomu alaykum!\nEduka Student App'ga xush kelibsiz.\n\nKabinetga kirish uchun telefon raqamingizni yuboring.",
    contactKeyboard()
  );
}

async function findStudentByTelegram(deps, telegramUserId) {
  if (!process.env.DATABASE_URL) return null;
  const pool = deps.getDbPool();
  await deps.ensureSchema(pool);
  const result = await pool.query(
    `SELECT s.*, o.name AS organization_name, o.slug AS organization_slug, COALESCE(o.subdomain, o.slug) AS organization_subdomain
     FROM students s
     JOIN organizations o ON o.id=s.organization_id
     WHERE s.telegram_user_id=$1 AND s.student_app_enabled=TRUE AND s.student_app_blocked=FALSE
     ORDER BY s.last_student_app_login DESC NULLS LAST, s.id DESC
     LIMIT 1`,
    [String(telegramUserId)]
  );
  return result.rows[0] || null;
}

async function openAppForLinkedStudent(token, chatId, telegramUserId, deps) {
  const student = await findStudentByTelegram(deps, telegramUserId);
  if (!student) {
    await askForContact(token, chatId);
    return;
  }
  const payload = await deps.createLinkedStudentAppSession(student, String(telegramUserId), String(chatId));
  await sendMessage(token, chatId, "Quyidagi tugmani bosing — Student App login sahifasiz to'g'ridan-to'g'ri Bosh sahifada ochiladi.", webAppKeyboard(payload.webAppUrl));
}

async function handlePhone(token, chatId, message, deps) {
  if (!process.env.DATABASE_URL) {
    await sendMessage(token, chatId, "Hozircha baza ulanishi sozlanmagan. Iltimos, administratorga murojaat qiling.", removeKeyboard());
    return;
  }
  const phone = normalizeContactPhone(message, deps);
  const pool = deps.getDbPool();
  await deps.ensureSchema(pool);
  const students = await deps.findStudentsByPhone(pool, phone, {});
  if (!students.length) {
    loginFlows.delete(String(chatId));
    await sendMessage(token, chatId, "Bu telefon raqam bo'yicha o'quvchi topilmadi. Iltimos, o'quv markazingiz administratoriga murojaat qiling.", removeKeyboard());
    return;
  }
  if (students.length > 1) {
    loginFlows.set(String(chatId), { step: "organization", phone, attempts: 0 });
    await sendMessage(token, chatId, "Telefon raqam bir nechta markazda topildi. Markazingizni tanlang.", {
      inline_keyboard: students.map((student) => [{ text: student.organization_name, callback_data: `org:${student.organization_id}` }])
    });
    return;
  }
  loginFlows.set(String(chatId), { step: "password", phone, organizationId: students[0].organization_id, attempts: 0 });
  await sendMessage(token, chatId, "Student App kodingiz/parolingizni kiriting.", removeKeyboard());
}

function studentPreviewMessage(payload) {
  const student = payload.student || {};
  const org = payload.organization || {};
  return [
    "✅ Parol to'g'ri.",
    "",
    "Quyidagi ma'lumotlar sizniki bo'lsa tasdiqlang:",
    "",
    `<b>O'quvchi:</b> ${student.fullName || student.full_name || "-"}`,
    `<b>Telefon:</b> ${student.phone || "-"}`,
    `<b>Markaz:</b> ${org.name || student.organization_name || "-"}`,
    `<b>Guruh:</b> ${student.groupName || student.group_name || "-"}`,
    "",
    "Tasdiqlasangiz Telegram ID profilingizga ulanadi va Student App ochiladi."
  ].join("\n");
}

async function handlePassword(token, chatId, message, flow, deps) {
  if (flow.delayUntil && Date.now() < flow.delayUntil) {
    const seconds = Math.ceil((flow.delayUntil - Date.now()) / 1000);
    await sendMessage(token, chatId, `Juda ko'p noto'g'ri urinish bo'ldi. ${seconds} soniyadan keyin qayta urinib ko'ring.`);
    return;
  }

  try {
    const preview = deps.studentAppPasswordPreview
      ? await deps.studentAppPasswordPreview({ phone: flow.phone, password: message.text, organization_id: flow.organizationId })
      : await deps.studentAppPasswordLogin(
          {
            phone: flow.phone,
            password: message.text,
            organization_id: flow.organizationId,
            telegram_user_id: String(message.from?.id || ""),
            telegram_chat_id: String(chatId)
          },
          { userAgent: "telegram-bot", ipAddress: "telegram" }
        );

    loginFlows.set(String(chatId), {
      step: "confirm",
      phone: flow.phone,
      password: message.text,
      organizationId: flow.organizationId,
      telegramUserId: String(message.from?.id || ""),
      telegramChatId: String(chatId),
      studentId: preview.student?.id,
      preview
    });
    await sendMessage(token, chatId, studentPreviewMessage(preview), confirmStudentKeyboard());
  } catch {
    flow.attempts = Number(flow.attempts || 0) + 1;
    if (flow.attempts >= 5) {
      flow.delayUntil = Date.now() + 60_000;
      loginFlows.set(String(chatId), flow);
      await sendMessage(token, chatId, "Parol 5 marta noto'g'ri kiritildi. Xavfsizlik uchun 1 daqiqadan keyin qayta urinib ko'ring.");
      return;
    }
    loginFlows.set(String(chatId), flow);
    await sendMessage(token, chatId, `Telefon raqam yoki parol noto'g'ri. Yana ${5 - flow.attempts} ta urinish qoldi.`);
  }
}

async function handleCallback(update, deps) {
  const token = safeToken();
  const callback = update.callback_query;
  const chatId = callback?.message?.chat?.id;
  if (!token || !chatId) return;
  const data = String(callback.data || "");
  const chatKey = String(chatId);

  if (data === "cancel_login") {
    loginFlows.delete(chatKey);
    if (callback?.id) await apiRequest(token, "answerCallbackQuery", { callback_query_id: callback.id, text: "Bekor qilindi" });
    await sendMessage(token, chatId, "Ro'yxatdan o'tish bekor qilindi. Qayta boshlash uchun /start yuboring.", removeKeyboard());
    return;
  }

  if (data === "confirm_student") {
    const flow = loginFlows.get(chatKey);
    if (!flow || flow.step !== "confirm") {
      if (callback?.id) await apiRequest(token, "answerCallbackQuery", { callback_query_id: callback.id, text: "Sessiya topilmadi" });
      await askForContact(token, chatId);
      return;
    }
    try {
      const payload = await deps.studentAppPasswordLogin(
        {
          phone: flow.phone,
          password: flow.password,
          organization_id: flow.organizationId,
          telegram_user_id: flow.telegramUserId,
          telegram_chat_id: flow.telegramChatId
        },
        { userAgent: "telegram-bot", ipAddress: "telegram" }
      );
      loginFlows.delete(chatKey);
      if (callback?.id) await apiRequest(token, "answerCallbackQuery", { callback_query_id: callback.id, text: "Tasdiqlandi" });
      await sendMessage(
        token,
        chatId,
        "✅ Telegram profilingiz Eduka Student App bilan bog'landi.\n\nQuyidagi tugmani bosing — Student App login sahifasiz to'g'ridan-to'g'ri Bosh sahifada ochiladi.",
        webAppKeyboard(payload.webAppUrl)
      );
      return;
    } catch (error) {
      console.error(`Telegram confirm failed: ${error.message}`);
      if (callback?.id) await apiRequest(token, "answerCallbackQuery", { callback_query_id: callback.id, text: "Xatolik" });
      await sendMessage(token, chatId, "Tasdiqlashda xatolik yuz berdi. Iltimos, /start orqali qayta urinib ko'ring.");
      return;
    }
  }

  if (data.startsWith("org:")) {
    const flow = loginFlows.get(chatKey);
    if (flow?.phone) {
      flow.step = "password";
      flow.organizationId = Number(data.slice(4));
      flow.attempts = Number(flow.attempts || 0);
      loginFlows.set(chatKey, flow);
      await apiRequest(token, "answerCallbackQuery", { callback_query_id: callback.id });
      await sendMessage(token, chatId, "Student App kodingiz/parolingizni kiriting.", removeKeyboard());
      return;
    }
  }
  if (callback?.id) await apiRequest(token, "answerCallbackQuery", { callback_query_id: callback.id });
}


function money(value) {
  return `${Number(value || 0).toLocaleString("uz-UZ")} so'm`;
}

function shortDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  return date.toLocaleString("uz-UZ", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(/,/g, "");
}

function paymentStatusUz(status, balance) {
  const raw = String(status || "").toLowerCase();
  if (["cancelled", "canceled"].includes(raw)) return "BEKOR QILINGAN";
  if (["covered", "closed", "debt_closed"].includes(raw)) return "QARZ QOPLANGAN";
  if (["debt", "debtor"].includes(raw)) return "QARZDOR";
  if (["partial", "partially_paid"].includes(raw) || Number(balance || 0) > 0) return "QISMAN TO'LANGAN";
  return "TO'LANGAN";
}

function receiptMessage(receipt) {
  const p = receipt?.payment || {};
  const s = receipt?.settings || {};
  const paid = Number(p.amount || p.paid_amount || 0);
  const due = Number(p.due_amount || p.course_amount || p.group_monthly_price || paid || 0);
  const discount = Number(p.discount || 0);
  const balance = Math.max(due - paid - discount, 0);
  const status = paymentStatusUz(p.status, balance);
  return [
    "✅ <b>To'lov tasdiqlandi!</b>",
    "",
    `🧾 <b>Chek raqami:</b> ${p.receipt_no || "-"}`,
    `🏫 <b>Markaz:</b> ${p.organization_name || s.center_name || "Eduka"}`,
    `📍 <b>Filial:</b> ${p.branch_name || p.organization_address || s.address || "Asosiy markaz"}`,
    `👤 <b>O'quvchi:</b> ${p.student_name || "-"}`,
    `📚 <b>Kurs:</b> ${p.course_name || "-"}`,
    `👥 <b>Guruh:</b> ${p.group_name || "-"}`,
    "",
    `💳 <b>To'lov turi:</b> ${p.payment_type || "-"}`,
    `💰 <b>Kurs / guruh summasi:</b> ${money(due)}`,
    `📌 <b>To'lanishi kerak:</b> ${money(due)}`,
    `✅ <b>To'langan summa:</b> ${money(paid)}`,
    `📊 <b>Hozirgi balans:</b> ${money(balance)}`,
    "",
    `👨‍💼 <b>Administrator:</b> ${p.cashier_name || "-"}`,
    `📅 <b>Sana:</b> ${shortDateTime(p.paid_at || p.payment_date || p.created_at)}`,
    `📌 <b>Holati:</b> ${status}`,
    balance > 0 ? `📊 <b>Qolgan balans:</b> ${money(balance)}` : "",
    "",
    "Rahmat! To'lovingiz tizimda saqlandi."
  ].filter(Boolean).join("\n");
}

async function sendReceiptByStartParam(token, chatId, startParam, deps, telegramUserId) {
  const receiptKey = String(startParam || "").replace(/^receipt_/i, "");
  if (!receiptKey || !deps.findPaymentReceiptByNumber) return false;
  const receipt = await deps.findPaymentReceiptByNumber(receiptKey);
  if (!receipt) {
    await sendMessage(token, chatId, "Chek topilmadi. Iltimos, chek raqamini tekshiring yoki administratorga murojaat qiling.");
    return true;
  }

  // QR orqali kirgan studentni chekdagi student profiliga avtomatik bog'lash.
  try {
    const studentId = receipt.payment?.student_id || receipt.payment?.studentId;
    const organizationId = receipt.payment?.organization_id || receipt.payment?.organizationId;
    if (studentId && organizationId && process.env.DATABASE_URL) {
      const pool = deps.getDbPool();
      await deps.ensureSchema(pool);
      const current = await pool.query("SELECT id, full_name, telegram_user_id, telegram_chat_id FROM students WHERE id=$1 AND organization_id=$2", [studentId, organizationId]);
      const student = current.rows[0];
      if (student) {
        if (!student.telegram_user_id || String(student.telegram_user_id) === String(telegramUserId || "")) {
          await pool.query("UPDATE students SET telegram_user_id=$3, telegram_chat_id=$4, last_student_app_login=COALESCE(last_student_app_login, NOW()) WHERE id=$1 AND organization_id=$2", [studentId, organizationId, String(telegramUserId || ""), String(chatId)]);
        } else {
          await sendMessage(token, chatId, "Bu o'quvchi profili boshqa Telegram akkauntga bog'langan. Administratorga murojaat qiling.");
          return true;
        }
      }
    }
  } catch (error) {
    console.error(`Receipt Telegram link warning: ${error.message}`);
  }

  await sendMessage(token, chatId, receiptMessage(receipt));
  return true;
}

async function handleCommand(token, message, deps) {
  const chatId = message.chat.id;
  const rawText = String(message.text || "").trim();
  const parts = rawText.split(/\s+/).filter(Boolean);
  const commandWord = (parts[0] || "").split("@")[0].toLowerCase();
  const command = commandWord.startsWith("/") ? commandWord : `/${commandWord}`;
  const startParam = parts.slice(1).join(" ");
  if (command === "/start") {
    if (startParam && startParam.startsWith("receipt_")) {
      const handled = await sendReceiptByStartParam(token, chatId, startParam, deps, message.from?.id);
      if (handled) return;
    }
    const linkedStudent = await findStudentByTelegram(deps, message.from?.id);
    if (linkedStudent) {
      const payload = await deps.createLinkedStudentAppSession(linkedStudent, String(message.from?.id || ""), String(chatId));
      await sendMessage(token, chatId, "Siz allaqachon ro'yxatdan o'tgansiz. Qayta ro'yxatdan o'tish shart emas.\n\nStudent App'ni ochish uchun quyidagi tugmani bosing.", webAppKeyboard(payload.webAppUrl));
      return;
    }
    return askForContact(token, chatId);
  }
  if (command === "/help") {
    await sendMessage(token, chatId, "Yordam kerak bo'lsa o'quv markazingiz administratoriga murojaat qiling yoki Student App ichidagi 'Mas'ullarga yozish' bo'limidan foydalaning.");
    return;
  }
  if (command === "/app") {
    await openAppForLinkedStudent(token, chatId, message.from?.id, deps);
    return;
  }
  if (command === "/logout") {
    if (process.env.DATABASE_URL) {
      const pool = deps.getDbPool();
      await deps.ensureSchema(pool);
      await pool.query("UPDATE student_app_sessions SET revoked_at=NOW() WHERE telegram_user_id=$1 AND revoked_at IS NULL", [String(message.from?.id || "")]);
    }
    loginFlows.delete(String(chatId));
    await sendMessage(token, chatId, "Siz Student App'dan chiqdingiz.");
    return;
  }
  if (command === "/profile") {
    const student = await findStudentByTelegram(deps, message.from?.id);
    if (!student) {
      await askForContact(token, chatId);
      return;
    }
    await sendMessage(
      token,
      chatId,
      `<b>${student.full_name}</b>\nGuruh: ${student.group_name || student.course_name || "-"}\nBalans: ${student.balance || 0} so'm\nKristallar: ${student.crystals || 0}\nTangalar: ${student.coins || 0}\nOxirgi login: ${student.last_student_app_login || "-"}`
    );
    return;
  }
  await sendMessage(token, chatId, "Noma'lum komanda. /start, /app, /help yoki /logout komandalaridan foydalaning.");
}

async function handleUpdate(update, deps) {
  const token = safeToken();
  if (!token) {
    console.log("Student bot not configured");
    return;
  }
  if (update.callback_query) {
    await handleCallback(update, deps);
    return;
  }
  const message = update.message;
  if (!message?.chat?.id) return;
  const chatId = message.chat.id;
  const text = String(message.text || "").trim();
  if (text.startsWith("/")) {
    await handleCommand(token, message, deps);
    return;
  }
  const flow = loginFlows.get(String(chatId));
  if (!flow || flow.step === "phone") {
    if (message.contact || text) await handlePhone(token, chatId, message, deps);
    else await askForContact(token, chatId);
    return;
  }
  if (flow.step === "password") {
    await handlePassword(token, chatId, message, flow, deps);
    return;
  }
  if (flow.step === "confirm") {
    await sendMessage(token, chatId, "Ma'lumotlaringizni tasdiqlash uchun xabardagi ✅ tugmani bosing yoki /start orqali qayta boshlang.");
    return;
  }
  await sendMessage(token, chatId, "Kerakli amalni tanlang. /app komandasi orqali Student App'ni ochishingiz mumkin.");
}

function startPollingIfEnabled(deps) {
  const token = safeToken();
  if (!token) {
    console.log("Student bot not configured");
    return;
  }
  if (String(process.env.ENABLE_BOT_POLLING || "").toLowerCase() !== "true") {
    console.log("Telegram bot polling disabled; webhook mode is ready");
    return;
  }
  if (pollingStarted) return;
  pollingStarted = true;
  const poll = async () => {
    try {
      const response = await apiRequest(token, "getUpdates", { timeout: 25, offset: pollingOffset });
      for (const update of response.result || []) {
        pollingOffset = Math.max(pollingOffset, Number(update.update_id) + 1);
        await handleUpdate(update, deps);
      }
    } catch (error) {
      console.error(`Telegram polling failed: ${error.message}`);
    } finally {
      setTimeout(poll, 1000);
    }
  };
  poll();
}

module.exports = {
  handleUpdate,
  startPollingIfEnabled
};
