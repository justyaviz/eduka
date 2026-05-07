const https = require("https");

const loginFlows = new Map();
let pollingStarted = false;
let pollingOffset = 0;

function safeToken() {
  return String(process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN || "").trim();
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
  });
}

function contactKeyboard() {
  return {
    resize_keyboard: true,
    one_time_keyboard: true,
    keyboard: [[{ text: "📱 Telefon raqamni yuborish", request_contact: true }]]
  };
}

function webAppKeyboard(url) {
  return {
    inline_keyboard: [[{ text: "🚀 Student App'ni ochish", web_app: { url } }]]
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
    "Assalomu alaykum! Eduka Student App'ga xush kelibsiz.\n\nKabinetga kirish uchun telefon raqamingizni yuboring.",
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
  await sendMessage(token, chatId, "Quyidagi tugma orqali Student App'ni ochishingiz mumkin.", webAppKeyboard(payload.webAppUrl));
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
    loginFlows.set(String(chatId), { step: "organization", phone });
    await sendMessage(token, chatId, "Telefon raqam bir nechta markazda topildi. Markazingizni tanlang.", {
      inline_keyboard: students.map((student) => [{ text: student.organization_name, callback_data: `org:${student.organization_id}` }])
    });
    return;
  }
  loginFlows.set(String(chatId), { step: "password", phone, organizationId: students[0].organization_id });
  await sendMessage(token, chatId, "Parolingizni kiriting.", removeKeyboard());
}

async function handlePassword(token, chatId, message, flow, deps) {
  try {
    const payload = await deps.studentAppPasswordLogin(
      {
        phone: flow.phone,
        password: message.text,
        organization_id: flow.organizationId,
        telegram_user_id: String(message.from?.id || ""),
        telegram_chat_id: String(chatId)
      },
      { userAgent: "telegram-bot", ipAddress: "telegram" }
    );
    loginFlows.delete(String(chatId));
    await sendMessage(token, chatId, "✅ Muvaffaqiyatli kirdingiz.\n\nQuyidagi tugma orqali Student App'ni ochishingiz mumkin.", webAppKeyboard(payload.webAppUrl));
  } catch (error) {
    await sendMessage(token, chatId, "Telefon raqam yoki parol noto'g'ri. Qayta urinib ko'ring.");
  }
}

async function handleCallback(update, deps) {
  const token = safeToken();
  const callback = update.callback_query;
  const chatId = callback?.message?.chat?.id;
  if (!token || !chatId) return;
  const data = String(callback.data || "");
  if (data.startsWith("org:")) {
    const flow = loginFlows.get(String(chatId));
    if (flow?.phone) {
      flow.step = "password";
      flow.organizationId = Number(data.slice(4));
      loginFlows.set(String(chatId), flow);
      await apiRequest(token, "answerCallbackQuery", { callback_query_id: callback.id });
      await sendMessage(token, chatId, "Parolingizni kiriting.", removeKeyboard());
    }
  }
}

async function handleCommand(token, message, deps) {
  const chatId = message.chat.id;
  const text = String(message.text || "").trim();
  if (text === "/start") return askForContact(token, chatId);
  if (text === "/help") {
    await sendMessage(token, chatId, "Yordam kerak bo'lsa o'quv markazingiz administratoriga murojaat qiling yoki Student App ichidagi 'Mas'ullarga yozish' bo'limidan foydalaning.");
    return;
  }
  if (text === "/app") {
    await openAppForLinkedStudent(token, chatId, message.from?.id, deps);
    return;
  }
  if (text === "/logout") {
    if (process.env.DATABASE_URL) {
      const pool = deps.getDbPool();
      await deps.ensureSchema(pool);
      await pool.query("UPDATE student_app_sessions SET revoked_at=NOW() WHERE telegram_user_id=$1 AND revoked_at IS NULL", [String(message.from?.id || "")]);
    }
    loginFlows.delete(String(chatId));
    await sendMessage(token, chatId, "Siz Student App'dan chiqdingiz.");
    return;
  }
  if (text === "/profile") {
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
  }
}

async function handleUpdate(update, deps) {
  const token = safeToken();
  if (!token) return;
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
    return;
  }
  if (flow.step === "password") {
    await handlePassword(token, chatId, message, flow, deps);
    return;
  }
  await sendMessage(token, chatId, "Kerakli amalni tanlang.", {
    inline_keyboard: [[{ text: "Student App", callback_data: "noop" }]]
  });
}

function startPollingIfEnabled(deps) {
  const token = safeToken();
  if (!token) {
    console.log("BOT_TOKEN not configured, skipping Telegram bot startup");
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
