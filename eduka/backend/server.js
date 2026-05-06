const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..", "frontend");
const port = Number(process.env.PORT) || 3000;
const sessionCookieName = "eduka_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;
const loginAttempts = new Map();
let pgPool;
let schemaReadyPromise;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendJsonWithHeaders(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", ...headers });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Payload too large"));
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    request.on("error", reject);
  });
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 9) return `998${digits}`;
  return digits;
}

function clientIp(request) {
  return String(request.headers["x-forwarded-for"] || request.socket.remoteAddress || "local").split(",")[0].trim();
}

function checkLoginRateLimit(request) {
  const key = `${clientIp(request)}:${new Date().toISOString().slice(0, 16)}`;
  const count = Number(loginAttempts.get(key) || 0) + 1;
  loginAttempts.set(key, count);

  if (loginAttempts.size > 2000) {
    const newestMinute = new Date().toISOString().slice(0, 16);
    for (const attemptKey of loginAttempts.keys()) {
      if (!attemptKey.endsWith(newestMinute)) loginAttempts.delete(attemptKey);
    }
  }

  return count <= 8;
}

function hashToken(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function verifyPassword(password, storedHash) {
  const parts = String(storedHash || "").split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const [, salt, expectedHash] = parts;
  const actualHash = crypto.scryptSync(String(password), salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (actualHash.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(actualHash, expectedBuffer);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function slugify(value) {
  return String(value || "center")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "center";
}

function parseCookies(request) {
  const cookies = {};
  const cookieHeader = request.headers.cookie || "";

  cookieHeader.split(";").forEach((cookie) => {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (!rawName) return;
    cookies[rawName] = decodeURIComponent(rawValue.join("="));
  });

  return cookies;
}

function buildSessionCookie(token, options = {}) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const maxAge = options.clear ? 0 : sessionMaxAgeSeconds;
  const value = options.clear ? "" : encodeURIComponent(token);
  return `${sessionCookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function getDbPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!pgPool) {
    let Pool;

    try {
      ({ Pool } = require("pg"));
    } catch {
      throw new Error("pg dependency is not installed");
    }

    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
    });
  }

  return pgPool;
}

async function ensureSchema(pool) {
  if (!schemaReadyPromise) {
    schemaReadyPromise = fs.promises
      .readFile(path.join(__dirname, "schema.sql"), "utf8")
      .then((schemaSql) => pool.query(schemaSql))
      .catch((error) => {
        schemaReadyPromise = null;
        throw error;
      });
  }

  await schemaReadyPromise;
}

function publicUser(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    organization: row.organization_id
      ? {
          id: row.organization_id,
          name: row.organization_name,
          phone: row.organization_phone,
          address: row.organization_address,
          status: row.organization_status,
          subscriptionStatus: row.subscription_status,
          trialEndsAt: row.trial_ends_at,
          licenseExpiresAt: row.license_expires_at,
          setupCompletedAt: row.setup_completed_at,
          needsOnboarding: !row.setup_completed_at
        }
      : null
  };
}

const rolePermissions = {
  super_admin: ["*"],
  owner: ["*"],
  admin: ["*"],
  ceo: ["*"],
  rahbar: ["*"],
  center_admin: ["*"],
  manager: ["read", "students:write", "leads:write", "groups:read", "teachers:read", "payments:write", "attendance:read"],
  menejer: ["read", "students:write", "leads:write", "groups:read", "teachers:read", "payments:write", "attendance:read"],
  teacher: ["read", "groups:read", "students:read", "attendance:write", "schedule:read"],
  oqituvchi: ["read", "groups:read", "students:read", "attendance:write", "schedule:read"],
  accountant: ["read", "students:read", "payments:write", "finance:write"],
  buxgalter: ["read", "students:read", "payments:write", "finance:write"],
  auditor: ["read", "audit:read"]
};

function hasPermission(user, permission) {
  const permissions = rolePermissions[String(user?.role || "").toLowerCase()] || [];
  return permissions.includes("*") || permissions.includes(permission) || ((permission === "read" || permission.endsWith(":read")) && permissions.includes("read"));
}

async function requireUser(request, response, permission = "read") {
  const user = await findSessionUser(request);

  if (!user) {
    sendJson(response, 401, { ok: false, message: "Unauthorized" });
    return null;
  }

  if (!hasPermission(user, permission)) {
    sendJson(response, 403, { ok: false, message: "Bu amal uchun ruxsat yo'q" });
    return null;
  }

  return user;
}

function asText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function asNumber(value, fallback = 0) {
  const number = Number(String(value ?? "").replace(/\s/g, ""));
  return Number.isFinite(number) ? number : fallback;
}

function asDate(value) {
  const text = asText(value);
  return text || null;
}

function requestQuery(request) {
  const [, rawQuery = ""] = request.url.split("?");
  return new URLSearchParams(rawQuery);
}

function pageOptions(query) {
  const page = Math.max(1, Number(query.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(query.get("limit") || 20)));
  return { page, limit, offset: (page - 1) * limit };
}

function withError(response, label, error) {
  console.error(`${label} failed: ${error.message}`);
  const statusCode = ["DATABASE_URL is not configured", "pg dependency is not installed"].includes(error.message) ? 503 : 500;
  sendJson(response, statusCode, { ok: false, message: error.message });
}

async function writeAudit(pool, user, action, entity, entityId, payload = {}) {
  try {
    await pool.query(
      "INSERT INTO audit_logs (organization_id, user_id, action, entity, entity_id, payload) VALUES ($1, $2, $3, $4, $5, $6)",
      [user.organization_id, user.id, action, entity, entityId || null, JSON.stringify(payload)]
    );
  } catch (error) {
    console.error(`Audit log failed: ${error.message}`);
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function firstEnvValue(names) {
  for (const name of names) {
    const value = String(process.env[name] || "").trim();
    if (value) return { name, value };
  }

  return { name: "", value: "" };
}

function getTelegramConfig(options = {}) {
  const tokenEnv = firstEnvValue(["TELEGRAM_BOT_TOKEN", "BOT_TOKEN", "TELEGRAM_TOKEN"]);
  const chatEnv = firstEnvValue([
    "TELEGRAM_CHAT_ID",
    "TELEGRAM_GROUP_ID",
    "TELEGRAM_ADMIN_CHAT_ID",
    "CHAT_ID"
  ]);
  const token = tokenEnv.value;
  const rawChatIds = chatEnv.value
    .split(",")
    .map((chatId) => chatId.trim())
    .filter(Boolean);

  if (!token || rawChatIds.length === 0) {
    if (options.allowMissing) {
      return {
        tokenPresent: Boolean(token),
        chatIdCount: rawChatIds.length,
        tokenEnvName: tokenEnv.name,
        chatEnvName: chatEnv.name,
        chatIds: []
      };
    }

    throw new Error("Telegram is not configured");
  }

  const chatIds = [];

  rawChatIds.forEach((chatId) => {
    if (!chatIds.includes(chatId)) chatIds.push(chatId);
  });

  return {
    token,
    chatIds,
    tokenPresent: true,
    chatIdCount: chatIds.length,
    tokenEnvName: tokenEnv.name,
    chatEnvName: chatEnv.name
  };
}

function postTelegramMessage(token, chatId, text) {
  const payload = JSON.stringify({
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true
  });

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${token}/sendMessage`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      },
      (telegramResponse) => {
        let responseBody = "";

        telegramResponse.on("data", (chunk) => {
          responseBody += chunk;
        });

        telegramResponse.on("end", () => {
          if (telegramResponse.statusCode >= 200 && telegramResponse.statusCode < 300) {
            resolve(responseBody);
            return;
          }

          let parsedBody = {};

          try {
            parsedBody = JSON.parse(responseBody);
          } catch {
            parsedBody = {};
          }

          const error = new Error(`Telegram returned ${telegramResponse.statusCode}: ${responseBody}`);
          const migrateToChatId = parsedBody.parameters?.migrate_to_chat_id;

          if (migrateToChatId) {
            error.migrateToChatId = String(migrateToChatId);
          }

          reject(error);
        });
      }
    );

    request.setTimeout(10_000, () => {
      request.destroy(new Error("Telegram request timed out"));
    });

    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}

function telegramApiRequest(token, methodName, payload = {}) {
  const payloadText = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${token}/${methodName}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payloadText)
        }
      },
      (telegramResponse) => {
        let responseBody = "";

        telegramResponse.on("data", (chunk) => {
          responseBody += chunk;
        });

        telegramResponse.on("end", () => {
          let parsedBody;

          try {
            parsedBody = JSON.parse(responseBody);
          } catch {
            parsedBody = { ok: false, description: responseBody };
          }

          if (telegramResponse.statusCode >= 200 && telegramResponse.statusCode < 300 && parsedBody.ok) {
            resolve(parsedBody);
            return;
          }

          reject(new Error(parsedBody.description || `Telegram returned ${telegramResponse.statusCode}`));
        });
      }
    );

    request.setTimeout(10_000, () => {
      request.destroy(new Error("Telegram request timed out"));
    });

    request.on("error", reject);
    request.write(payloadText);
    request.end();
  });
}

async function sendTelegramMessage(text) {
  const { token, chatIds, tokenEnvName, chatEnvName } = getTelegramConfig();
  let lastError;

  console.log(`Telegram config: token=${tokenEnvName || "missing"}, chat=${chatEnvName || "missing"}, candidates=${chatIds.length}`);

  for (const chatId of chatIds) {
    try {
      return await postTelegramMessage(token, chatId, text);
    } catch (error) {
      lastError = error;
      console.error(`Telegram send failed for chat ${chatId}: ${error.message}`);

      if (error.migrateToChatId && !chatIds.includes(error.migrateToChatId)) {
        console.log(`Telegram chat migrated. Retrying with ${error.migrateToChatId}`);

        try {
          return await postTelegramMessage(token, error.migrateToChatId, text);
        } catch (retryError) {
          lastError = retryError;
          console.error(`Telegram migrated chat retry failed for ${error.migrateToChatId}: ${retryError.message}`);
        }
      }
    }
  }

  throw lastError || new Error(`Telegram send failed. Tried chats: ${chatIds.join(", ")}`);
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      response.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  });
}

function sendRedirect(response, location) {
  response.writeHead(302, {
    "Location": location,
    "Cache-Control": "no-store"
  });
  response.end();
}

function sendAppShell(response) {
  sendFile(response, path.join(root, "app.html"));
}

function isPanelHost(request) {
  const host = String(request.headers.host || "").split(":")[0].toLowerCase();
  return ["app.", "crm.", "dashboard.", "panel."].some((prefix) => host.startsWith(prefix));
}

async function findSessionUser(request) {
  const token = parseCookies(request)[sessionCookieName];
  if (!token) return null;

  const pool = getDbPool();
  await ensureSchema(pool);
  const result = await pool.query(
    `SELECT
       u.id,
       u.full_name,
       u.email,
       u.phone,
       u.role,
       u.organization_id,
       o.name AS organization_name,
       o.phone AS organization_phone,
       o.address AS organization_address,
       o.status AS organization_status,
       o.subscription_status,
       o.trial_ends_at,
       o.license_expires_at,
       o.setup_completed_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN organizations o ON o.id = u.organization_id
     WHERE s.token_hash = $1
       AND s.expires_at > NOW()
       AND u.is_active = TRUE
     LIMIT 1`,
    [hashToken(token)]
  );

  return result.rows[0] || null;
}

async function loadUserById(pool, userId) {
  const result = await pool.query(
    `SELECT
       u.id,
       u.full_name,
       u.email,
       u.phone,
       u.role,
       u.organization_id,
       o.name AS organization_name,
       o.phone AS organization_phone,
       o.address AS organization_address,
       o.status AS organization_status,
       o.subscription_status,
       o.trial_ends_at,
       o.license_expires_at,
       o.setup_completed_at
     FROM users u
     LEFT JOIN organizations o ON o.id = u.organization_id
     WHERE u.id=$1 AND u.is_active=TRUE
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function sendSession(response, pool, userId) {
  const user = await loadUserById(pool, userId);
  if (!user) {
    sendJson(response, 404, { ok: false, message: "Foydalanuvchi topilmadi" });
    return;
  }

  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000);

  await pool.query(
    "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [user.id, hashToken(token), expiresAt]
  );

  sendJsonWithHeaders(response, 200, { ok: true, user: publicUser(user) }, { "Set-Cookie": buildSessionCookie(token) });
}

async function handleLoginRequest(request, response) {
  try {
    if (!checkLoginRateLimit(request)) {
      sendJson(response, 429, { ok: false, message: "Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring" });
      return;
    }

    const body = await readJsonBody(request);
    const credential = String(body.login || body.email || body.phone || "").trim();
    const password = String(body.password || "");
    const normalizedPhone = normalizePhone(credential);
    const normalizedEmail = credential.includes("@") ? credential.toLowerCase() : "";

    if ((!normalizedPhone && !normalizedEmail) || !password) {
      sendJson(response, 400, { ok: false, message: "Email yoki telefon va parol kerak" });
      return;
    }

    const pool = getDbPool();
    await ensureSchema(pool);
    const result = await pool.query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.phone,
         u.role,
         u.password_hash,
         u.organization_id,
         o.name AS organization_name,
         o.phone AS organization_phone,
         o.address AS organization_address,
         o.status AS organization_status,
         o.subscription_status,
         o.trial_ends_at,
         o.license_expires_at,
         o.setup_completed_at
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
       WHERE (u.normalized_phone = $1 OR LOWER(COALESCE(u.email, '')) = $2)
         AND u.is_active = TRUE
       LIMIT 1`,
      [normalizedPhone, normalizedEmail]
    );
    const user = result.rows[0];

    if (!user || !verifyPassword(password, user.password_hash)) {
      sendJson(response, 401, { ok: false, message: "Email/telefon yoki parol noto'g'ri" });
      return;
    }

    if (!["super_admin", "owner"].includes(String(user.role).toLowerCase()) && user.organization_status === "blocked") {
      sendJson(response, 403, { ok: false, message: "Markaz obunasi bloklangan. Support bilan bog'laning." });
      return;
    }

    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000);

    await pool.query(
      "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [user.id, hashToken(token), expiresAt]
    );

    delete user.password_hash;
    sendJsonWithHeaders(response, 200, { ok: true, user: publicUser(user) }, { "Set-Cookie": buildSessionCookie(token) });
  } catch (error) {
    console.error(`Login failed: ${error.message}`);
    const statusCode = ["DATABASE_URL is not configured", "pg dependency is not installed"].includes(error.message) ? 503 : 500;
    sendJson(response, statusCode, { ok: false, message: error.message });
  }
}

async function handleMeRequest(request, response) {
  try {
    const user = await findSessionUser(request);

    if (!user) {
      sendJson(response, 401, { ok: false, message: "Unauthorized" });
      return;
    }

    sendJson(response, 200, { ok: true, user: publicUser(user) });
  } catch (error) {
    console.error(`Session check failed: ${error.message}`);
    const statusCode = ["DATABASE_URL is not configured", "pg dependency is not installed"].includes(error.message) ? 503 : 500;
    sendJson(response, statusCode, { ok: false, message: error.message });
  }
}

async function handleLogoutRequest(request, response) {
  try {
    const token = parseCookies(request)[sessionCookieName];

    if (token) {
      await getDbPool().query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
    }
  } catch (error) {
    console.error(`Logout cleanup failed: ${error.message}`);
  }

  sendJsonWithHeaders(response, 200, { ok: true }, { "Set-Cookie": buildSessionCookie("", { clear: true }) });
}

async function handleRegisterRequest(request, response) {
  try {
    const body = await readJsonBody(request);
    const centerName = asText(body.center_name || body.centerName);
    const fullName = asText(body.full_name || body.fullName);
    const phone = asText(body.phone);
    const email = asText(body.email).toLowerCase();
    const password = String(body.password || "");
    const normalizedPhone = normalizePhone(phone);

    if (!centerName || !fullName || !normalizedPhone || password.length < 6) {
      sendJson(response, 400, { ok: false, message: "Markaz nomi, ism, telefon va kamida 6 belgili parol kerak" });
      return;
    }

    const pool = getDbPool();
    await ensureSchema(pool);
    const slug = `${slugify(centerName)}-${crypto.randomBytes(3).toString("hex")}`;
    const org = await pool.query(
      `INSERT INTO organizations (name, slug, phone, status, subscription_status, trial_ends_at, license_expires_at)
       VALUES ($1,$2,$3,'active','trial',NOW() + interval '7 days',NOW() + interval '7 days')
       RETURNING id`,
      [centerName, slug, phone]
    );
    const user = await pool.query(
      `INSERT INTO users (organization_id, full_name, email, phone, normalized_phone, role, password_hash)
       VALUES ($1,$2,$3,$4,$5,'center_admin',$6)
       RETURNING id`,
      [org.rows[0].id, fullName, email || null, phone, normalizedPhone, hashPassword(password)]
    );
    await sendSession(response, pool, user.rows[0].id);
  } catch (error) {
    withError(response, "Register", error);
  }
}

async function seedDemoData(pool, organizationId, userId) {
  const existing = await pool.query("SELECT COUNT(*)::int AS total FROM students WHERE organization_id=$1", [organizationId]);
  if (existing.rows[0]?.total > 0) return;

  const courseRows = await Promise.all([
    pool.query("INSERT INTO courses (organization_id, name, price, duration, lesson_type) VALUES ($1,'IELTS',700000,'6 oy','group') RETURNING *", [organizationId]),
    pool.query("INSERT INTO courses (organization_id, name, price, duration, lesson_type) VALUES ($1,'English Beginner',500000,'4 oy','group') RETURNING *", [organizationId]),
    pool.query("INSERT INTO courses (organization_id, name, price, duration, lesson_type) VALUES ($1,'Matematika',450000,'5 oy','group') RETURNING *", [organizationId])
  ]);
  const teacher = await pool.query(
    "INSERT INTO teachers (organization_id, full_name, phone, course_name, subjects, login_enabled, salary_rate) VALUES ($1,'Madina Akramova','+998 90 111 22 33','IELTS','IELTS, Speaking',TRUE,3500000) RETURNING *",
    [organizationId]
  );
  const group = await pool.query(
    `INSERT INTO groups (organization_id, name, course_name, teacher_id, teacher_name, days, start_time, end_time, monthly_price, starts_at, room)
     VALUES ($1,'IELTS Morning A','IELTS',$2,'Madina Akramova','Dushanba, Chorshanba, Juma','09:00','10:30',700000,CURRENT_DATE,'2-xona') RETURNING *`,
    [organizationId, teacher.rows[0].id]
  );
  const students = [
    ["Ali Valiyev", "+998 99 893 99 99", "+998 90 222 33 44", "IELTS", 0],
    ["Sevara Karimova", "+998 90 444 55 66", "+998 91 777 88 99", "IELTS", 350000],
    ["Jasur Tursunov", "+998 93 123 45 67", "+998 94 765 43 21", "English Beginner", 0]
  ];

  for (const student of students) {
    const inserted = await pool.query(
      `INSERT INTO students (organization_id, full_name, phone, parent_phone, course_name, group_id, payment_type, status, balance, note)
       VALUES ($1,$2,$3,$4,$5,$6,'monthly','active',$7,'Demo ma''lumot') RETURNING id`,
      [organizationId, student[0], student[1], student[2], student[3], group.rows[0].id, student[4]]
    );
    await pool.query(
      `INSERT INTO group_students (organization_id, group_id, student_id)
       VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
      [organizationId, group.rows[0].id, inserted.rows[0].id]
    );
  }

  await pool.query(
    `INSERT INTO leads (organization_id, full_name, phone, status, source, manager_name, next_contact_at, note)
     VALUES
       ($1,'Bekzod Olimov','+998 95 222 11 00','new','Instagram','Admin',NOW() + interval '2 hours','IELTS bilan qiziqdi'),
       ($1,'Dilnoza Rahimova','+998 97 333 22 11','trial','Telegram bot','Admin',NOW() + interval '1 day','Sinov darsga yozildi')`,
    [organizationId]
  );
  await pool.query(
    `INSERT INTO payments (organization_id, student_id, group_id, payment_month, due_amount, amount, discount, status, payment_type, note, created_by)
     SELECT $1, s.id, $2, to_char(NOW(),'YYYY-MM'), 700000, 700000, 0, 'paid', 'naqd', 'Demo to''lov', $3
     FROM students s WHERE s.organization_id=$1 AND s.balance=0 LIMIT 2`,
    [organizationId, group.rows[0].id, userId]
  );
  await pool.query(
    "INSERT INTO lessons (organization_id, group_id, lesson_at, status) VALUES ($1,$2,NOW() + interval '3 hours','planned')",
    [organizationId, group.rows[0].id]
  );
}

async function handleDemoLoginRequest(request, response) {
  try {
    const pool = getDbPool();
    await ensureSchema(pool);
    const org = await pool.query(
      `INSERT INTO organizations (name, slug, phone, address, status, subscription_status, trial_ends_at, license_expires_at, setup_completed_at)
       VALUES ('Eduka Demo Center','eduka-demo','+998 99 893 90 00','Toshkent','active','trial',NOW() + interval '7 days',NOW() + interval '7 days',NOW())
       ON CONFLICT (slug) DO UPDATE SET updated_at=NOW()
       RETURNING id`,
    );
    const user = await pool.query(
      `INSERT INTO users (organization_id, full_name, email, phone, normalized_phone, role, password_hash)
       VALUES ($1,'Demo Admin','demo@eduka.uz','+998 90 123 45 67','998901234567','center_admin',$2)
       ON CONFLICT (normalized_phone) DO UPDATE SET organization_id=$1, email='demo@eduka.uz', role='center_admin', is_active=TRUE
       RETURNING id`,
      [org.rows[0].id, hashPassword("demo12345")]
    );
    await seedDemoData(pool, org.rows[0].id, user.rows[0].id);
    await sendSession(response, pool, user.rows[0].id);
  } catch (error) {
    withError(response, "Demo login", error);
  }
}

async function handleOnboardingRequest(request, response) {
  try {
    const user = await requireUser(request, response, "read");
    if (!user) return;
    const pool = getDbPool();

    if (request.method === "GET") {
      const [organization, courses, teachers, groups, students] = await Promise.all([
        pool.query("SELECT * FROM organizations WHERE id=$1", [user.organization_id]),
        pool.query("SELECT * FROM courses WHERE organization_id=$1 ORDER BY id DESC", [user.organization_id]),
        pool.query("SELECT * FROM teachers WHERE organization_id=$1 ORDER BY id DESC", [user.organization_id]),
        pool.query("SELECT * FROM groups WHERE organization_id=$1 ORDER BY id DESC", [user.organization_id]),
        pool.query("SELECT * FROM students WHERE organization_id=$1 ORDER BY id DESC", [user.organization_id])
      ]);
      sendJson(response, 200, { ok: true, organization: organization.rows[0], courses: courses.rows, teachers: teachers.rows, groups: groups.rows, students: students.rows });
      return;
    }

    const body = await readJsonBody(request);
    await pool.query("BEGIN");
    try {
      const center = body.center || {};
      await pool.query(
        `UPDATE organizations
         SET name=COALESCE(NULLIF($2,''), name), phone=$3, address=$4, logo_url=$5, has_branches=$6, setup_completed_at=NOW(), updated_at=NOW()
         WHERE id=$1`,
        [user.organization_id, asText(center.name), asText(center.phone), asText(center.address), asText(center.logo_url), Boolean(center.has_branches)]
      );

      for (const course of body.courses || []) {
        if (!asText(course.name)) continue;
        await pool.query(
          "INSERT INTO courses (organization_id, name, price, duration, lesson_type) VALUES ($1,$2,$3,$4,$5)",
          [user.organization_id, asText(course.name), asNumber(course.price), asText(course.duration), asText(course.lesson_type, "group")]
        );
      }

      for (const teacher of body.teachers || []) {
        if (!asText(teacher.full_name)) continue;
        await pool.query(
          "INSERT INTO teachers (organization_id, full_name, phone, course_name, subjects, login_enabled) VALUES ($1,$2,$3,$4,$5,$6)",
          [user.organization_id, asText(teacher.full_name), asText(teacher.phone), asText(teacher.course_name), asText(teacher.subjects || teacher.course_name), Boolean(teacher.login_enabled)]
        );
      }

      for (const group of body.groups || []) {
        if (!asText(group.name)) continue;
        await pool.query(
          `INSERT INTO groups (organization_id, name, course_name, teacher_name, days, start_time, end_time, monthly_price, starts_at, room)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [user.organization_id, asText(group.name), asText(group.course_name), asText(group.teacher_name), asText(group.days), asText(group.start_time), asText(group.end_time), asNumber(group.monthly_price), asDate(group.starts_at), asText(group.room)]
        );
      }

      for (const student of body.students || []) {
        if (!asText(student.full_name)) continue;
        await pool.query(
          `INSERT INTO students (organization_id, full_name, phone, parent_phone, course_name, payment_type, status, balance, note)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [user.organization_id, asText(student.full_name), asText(student.phone), asText(student.parent_phone), asText(student.course_name), asText(student.payment_type, "monthly"), asText(student.status, "active"), asNumber(student.balance), asText(student.note)]
        );
      }

      await writeAudit(pool, user, "complete", "onboarding", user.organization_id, body);
      await pool.query("COMMIT");
      const fresh = await loadUserById(pool, user.id);
      sendJson(response, 200, { ok: true, user: publicUser(fresh) });
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    withError(response, "Onboarding", error);
  }
}

async function requireSuperUser(request, response) {
  const user = await findSessionUser(request);
  const role = String(user?.role || "").toLowerCase();
  if (!user) {
    sendJson(response, 401, { ok: false, message: "Unauthorized" });
    return null;
  }
  if (!["super_admin", "owner"].includes(role)) {
    sendJson(response, 403, { ok: false, message: "Bu sahifa faqat platforma egasi uchun" });
    return null;
  }
  return user;
}

async function handleDebtsRequest(request, response) {
  try {
    const user = await requireUser(request, response, "read");
    if (!user) return;
    const query = requestQuery(request);
    const { page, limit, offset } = pageOptions(query);
    const search = asText(query.get("search"));
    const params = [user.organization_id];
    let searchWhere = "";
    if (search) {
      params.push(`%${search}%`);
      searchWhere = ` AND (s.full_name ILIKE $${params.length} OR s.phone ILIKE $${params.length} OR s.parent_phone ILIKE $${params.length} OR g.name ILIKE $${params.length})`;
    }

    const baseSql = `
      WITH payment_debts AS (
        SELECT
          p.organization_id,
          p.student_id,
          COALESCE(SUM(COALESCE(p.due_amount, 0)), 0)::numeric AS amount_due,
          COALESCE(SUM(COALESCE(p.amount, 0) + COALESCE(p.discount, 0)), 0)::numeric AS paid_amount,
          GREATEST(COALESCE(SUM(COALESCE(p.due_amount, 0) - COALESCE(p.amount, 0) - COALESCE(p.discount, 0)), 0), 0)::numeric AS remaining_debt,
          MAX(p.paid_at) AS last_payment_at,
          MIN(p.paid_at) FILTER (
            WHERE COALESCE(p.due_amount, 0) - COALESCE(p.amount, 0) - COALESCE(p.discount, 0) > 0
          ) AS first_debt_at
        FROM payments p
        WHERE p.organization_id=$1
          AND p.student_id IS NOT NULL
          AND p.status <> 'cancelled'
        GROUP BY p.organization_id, p.student_id
      )
      SELECT
        s.*,
        g.name AS group_name,
        payment_debts.amount_due,
        payment_debts.paid_amount,
        payment_debts.remaining_debt,
        payment_debts.remaining_debt AS balance,
        payment_debts.last_payment_at,
        GREATEST(0, (CURRENT_DATE - COALESCE(payment_debts.first_debt_at::date, s.created_at::date)))::int AS overdue_days
      FROM payment_debts
      JOIN students s ON s.id=payment_debts.student_id AND s.organization_id=payment_debts.organization_id
      LEFT JOIN groups g ON g.id=s.group_id
      WHERE payment_debts.remaining_debt > 0${searchWhere}
    `;

    const countResult = await getDbPool().query(`SELECT COUNT(*)::int AS total FROM (${baseSql}) debts`, params);
    params.push(limit, offset);
    const result = await getDbPool().query(
      `${baseSql}
       ORDER BY remaining_debt DESC, overdue_days DESC, id DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    sendJson(response, 200, { ok: true, items: result.rows, total: countResult.rows[0].total, page, limit });
  } catch (error) {
    withError(response, "Debts", error);
  }
}

async function handleScheduleRequest(request, response) {
  try {
    const user = await requireUser(request, response, request.method === "POST" ? "schedule:write" : "schedule:read");
    if (!user) return;
    const pool = getDbPool();

    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const result = await pool.query(
        "INSERT INTO lessons (organization_id, group_id, lesson_at, status) VALUES ($1,$2,$3,$4) RETURNING *",
        [user.organization_id, body.group_id || null, asText(body.lesson_at), asText(body.status, "planned")]
      );
      await writeAudit(pool, user, "create", "lessons", result.rows[0].id, body);
      sendJson(response, 201, { ok: true, item: result.rows[0] });
      return;
    }

    const query = requestQuery(request);
    const dateFrom = asDate(query.get("date_from")) || new Date().toISOString().slice(0, 10);
    const dateTo = asDate(query.get("date_to")) || dateFrom;
    const result = await pool.query(
      `SELECT l.*, g.name AS group_name, g.room, g.days, g.start_time, g.end_time, t.full_name AS teacher_name,
              (SELECT COUNT(*)::int FROM students s WHERE s.group_id=g.id) AS student_count
       FROM lessons l
       LEFT JOIN groups g ON g.id=l.group_id
       LEFT JOIN teachers t ON t.id=g.teacher_id
       WHERE l.organization_id=$1 AND l.lesson_at::date BETWEEN $2::date AND $3::date
       ORDER BY l.lesson_at ASC`,
      [user.organization_id, dateFrom, dateTo]
    );
    sendJson(response, 200, { ok: true, items: result.rows });
  } catch (error) {
    withError(response, "Schedule", error);
  }
}

async function handleSettingsRequest(request, response) {
  try {
    const user = await requireUser(request, response, request.method === "PUT" ? "settings:write" : "read");
    if (!user) return;
    const pool = getDbPool();

    if (request.method === "GET") {
      const [org, settings] = await Promise.all([
        pool.query("SELECT * FROM organizations WHERE id=$1", [user.organization_id]),
        pool.query("SELECT settings FROM organization_settings WHERE organization_id=$1", [user.organization_id])
      ]);
      sendJson(response, 200, { ok: true, organization: org.rows[0], settings: settings.rows[0]?.settings || {} });
      return;
    }

    const body = await readJsonBody(request);
    await pool.query(
      `UPDATE organizations SET name=COALESCE(NULLIF($2,''), name), phone=$3, address=$4, logo_url=$5, updated_at=NOW()
       WHERE id=$1`,
      [user.organization_id, asText(body.name), asText(body.phone), asText(body.address), asText(body.logo_url)]
    );
    await pool.query(
      `INSERT INTO organization_settings (organization_id, settings, updated_at)
       VALUES ($1,$2::jsonb,NOW())
       ON CONFLICT (organization_id) DO UPDATE SET settings=$2::jsonb, updated_at=NOW()`,
      [user.organization_id, JSON.stringify(body.settings || {})]
    );
    await writeAudit(pool, user, "update", "settings", user.organization_id, body);
    sendJson(response, 200, { ok: true });
  } catch (error) {
    withError(response, "Settings", error);
  }
}

async function handleSuperSummaryRequest(request, response) {
  try {
    const user = await requireSuperUser(request, response);
    if (!user) return;
    const pool = getDbPool();
    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM organizations) AS centers,
        (SELECT COUNT(*)::int FROM organizations WHERE status='active') AS active_centers,
        (SELECT COUNT(*)::int FROM organizations WHERE subscription_status='trial') AS trial_centers,
        (SELECT COUNT(*)::int FROM organizations WHERE status='blocked') AS blocked_centers,
        COALESCE((SELECT SUM(amount) FROM payments WHERE paid_at >= date_trunc('month', NOW())), 0)::numeric AS monthly_volume,
        (SELECT COUNT(*)::int FROM organizations WHERE created_at::date=CURRENT_DATE) AS new_today`
    );
    sendJson(response, 200, { ok: true, summary: result.rows[0] });
  } catch (error) {
    withError(response, "Super summary", error);
  }
}

async function handleSuperCentersRequest(request, response, centerId = null) {
  try {
    const user = await requireSuperUser(request, response);
    if (!user) return;
    const pool = getDbPool();

    if (request.method === "PUT" && centerId) {
      const body = await readJsonBody(request);
      const result = await pool.query(
        `UPDATE organizations SET status=COALESCE(NULLIF($2,''), status), subscription_status=COALESCE(NULLIF($3,''), subscription_status), license_expires_at=COALESCE($4::timestamptz, license_expires_at), updated_at=NOW()
         WHERE id=$1 RETURNING *`,
        [centerId, asText(body.status), asText(body.subscription_status), asDate(body.license_expires_at)]
      );
      sendJson(response, 200, { ok: true, item: result.rows[0] });
      return;
    }

    if (centerId) {
      const result = await pool.query(
        `SELECT o.*,
          (SELECT COUNT(*)::int FROM students WHERE organization_id=o.id) AS students_count,
          (SELECT COUNT(*)::int FROM groups WHERE organization_id=o.id) AS groups_count,
          (SELECT MAX(created_at) FROM audit_logs WHERE organization_id=o.id) AS last_activity_at
         FROM organizations o WHERE o.id=$1`,
        [centerId]
      );
      sendJson(response, 200, { ok: true, item: result.rows[0] });
      return;
    }

    const result = await pool.query(
      `SELECT o.*,
        (SELECT COUNT(*)::int FROM students WHERE organization_id=o.id) AS students_count,
        (SELECT COUNT(*)::int FROM groups WHERE organization_id=o.id) AS groups_count,
        (SELECT COUNT(*)::int FROM users WHERE organization_id=o.id) AS users_count,
        (SELECT MAX(created_at) FROM audit_logs WHERE organization_id=o.id) AS last_activity_at
       FROM organizations o
       ORDER BY o.id DESC
       LIMIT 200`
    );
    sendJson(response, 200, { ok: true, items: result.rows });
  } catch (error) {
    withError(response, "Super centers", error);
  }
}

async function handleSuperTariffsRequest(request, response) {
  try {
    const user = await requireSuperUser(request, response);
    if (!user) return;
    const pool = getDbPool();

    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const result = await pool.query(
        "INSERT INTO tariffs (name, monthly_price, student_limit, teacher_limit, branch_limit) VALUES ($1,$2,$3,$4,$5) RETURNING *",
        [asText(body.name), asNumber(body.monthly_price), asNumber(body.student_limit, 500), asNumber(body.teacher_limit, 10), asNumber(body.branch_limit, 1)]
      );
      sendJson(response, 201, { ok: true, item: result.rows[0] });
      return;
    }

    const result = await pool.query("SELECT * FROM tariffs ORDER BY monthly_price ASC, id ASC");
    sendJson(response, 200, { ok: true, items: result.rows });
  } catch (error) {
    withError(response, "Super tariffs", error);
  }
}

async function handleSuperSubscriptionsRequest(request, response) {
  try {
    const user = await requireSuperUser(request, response);
    if (!user) return;
    const result = await getDbPool().query(
      `SELECT s.*, o.name AS center_name, t.name AS tariff_name
       FROM subscriptions s
       LEFT JOIN organizations o ON o.id=s.organization_id
       LEFT JOIN tariffs t ON t.id=s.tariff_id
       ORDER BY s.id DESC
       LIMIT 200`
    );
    sendJson(response, 200, { ok: true, items: result.rows });
  } catch (error) {
    withError(response, "Super subscriptions", error);
  }
}

async function handleSuperPaymentsRequest(request, response) {
  try {
    const user = await requireSuperUser(request, response);
    if (!user) return;
    const result = await getDbPool().query(
      `SELECT p.*, o.name AS center_name
       FROM payments p
       LEFT JOIN organizations o ON o.id=p.organization_id
       ORDER BY p.paid_at DESC, p.id DESC
       LIMIT 200`
    );
    sendJson(response, 200, { ok: true, items: result.rows });
  } catch (error) {
    withError(response, "Super payments", error);
  }
}

async function handleSuperSupportRequest(request, response) {
  try {
    const user = await requireSuperUser(request, response);
    if (!user) return;
    const result = await getDbPool().query(
      `SELECT o.id, o.name AS center_name, 'Support izoh' AS subject,
              COALESCE(o.support_note, 'Hozircha support yozuvi yoq') AS message,
              o.updated_at AS created_at
       FROM organizations o
       ORDER BY o.updated_at DESC
       LIMIT 100`
    );
    sendJson(response, 200, { ok: true, items: result.rows });
  } catch (error) {
    withError(response, "Super support", error);
  }
}

async function handleSuperSettingsRequest(request, response) {
  try {
    const user = await requireSuperUser(request, response);
    if (!user) return;
    sendJson(response, 200, {
      ok: true,
      settings: {
        support_telegram: process.env.SUPPORT_TELEGRAM || "@eduka_admin",
        trial_days: 7,
        billing_lock_enabled: true
      }
    });
  } catch (error) {
    withError(response, "Super settings", error);
  }
}

async function handleLeadConvertRequest(request, response, leadId) {
  try {
    const user = await requireUser(request, response, "leads:write");
    if (!user) return;
    const pool = getDbPool();
    const leadResult = await pool.query("SELECT * FROM leads WHERE id=$1 AND organization_id=$2", [leadId, user.organization_id]);
    const lead = leadResult.rows[0];
    if (!lead) {
      sendJson(response, 404, { ok: false, message: "Lid topilmadi" });
      return;
    }
    const student = await pool.query(
      `INSERT INTO students (organization_id, full_name, phone, course_name, status, note)
       VALUES ($1,$2,$3,$4,'active',$5) RETURNING *`,
      [user.organization_id, lead.full_name, lead.phone, lead.course_name || "", `Liddan o'tkazildi: ${lead.note || ""}`]
    );
    await pool.query("UPDATE leads SET status='paid' WHERE id=$1 AND organization_id=$2", [leadId, user.organization_id]);
    await writeAudit(pool, user, "convert", "leads", leadId, { student_id: student.rows[0].id });
    sendJson(response, 201, { ok: true, item: student.rows[0] });
  } catch (error) {
    withError(response, "Lead convert", error);
  }
}

async function handleLeadStatusRequest(request, response, leadId) {
  try {
    const user = await requireUser(request, response, "leads:write");
    if (!user) return;
    const body = await readJsonBody(request);
    const result = await getDbPool().query(
      "UPDATE leads SET status=$3 WHERE id=$1 AND organization_id=$2 RETURNING *",
      [leadId, user.organization_id, asText(body.status, "new")]
    );
    if (!result.rows[0]) {
      sendJson(response, 404, { ok: false, message: "Lid topilmadi" });
      return;
    }
    await writeAudit(getDbPool(), user, "status", "leads", leadId, { status: body.status });
    sendJson(response, 200, { ok: true, item: result.rows[0] });
  } catch (error) {
    withError(response, "Lead status", error);
  }
}

async function handleSummaryRequest(request, response) {
  try {
    const user = await findSessionUser(request);

    if (!user) {
      sendJson(response, 401, { ok: false, message: "Unauthorized" });
      return;
    }

    const organizationId = user.organization_id;
    const pool = getDbPool();
    await ensureSchema(pool);
    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM leads WHERE organization_id = $1 AND status <> 'lost') AS active_leads,
        (SELECT COUNT(*)::int FROM students WHERE organization_id = $1 AND status = 'active') AS active_students,
        (SELECT COUNT(*)::int FROM groups WHERE organization_id = $1 AND status = 'active') AS active_groups,
        (SELECT COUNT(*)::int FROM students WHERE organization_id = $1 AND balance > 0) AS debtors,
        (SELECT COUNT(*)::int FROM leads WHERE organization_id = $1 AND status = 'trial') AS trial_students,
        (SELECT COUNT(DISTINCT student_id)::int FROM payments WHERE organization_id = $1 AND paid_at >= date_trunc('month', NOW())) AS paid_this_month,
        (SELECT COUNT(*)::int FROM students WHERE organization_id = $1 AND status = 'left_active_group') AS left_active_group,
        (SELECT COUNT(*)::int FROM leads WHERE organization_id = $1 AND status = 'left_after_trial') AS left_after_trial`,
      [organizationId]
    );

    sendJson(response, 200, { ok: true, summary: result.rows[0] });
  } catch (error) {
    console.error(`Summary failed: ${error.message}`);
    const statusCode = ["DATABASE_URL is not configured", "pg dependency is not installed"].includes(error.message) ? 503 : 500;
    sendJson(response, statusCode, { ok: false, message: error.message });
  }
}

async function handleAnalyticsRequest(request, response) {
  try {
    const user = await requireUser(request, response, "read");
    if (!user) return;

    const pool = getDbPool();
    const organizationId = user.organization_id;
    const [payments, leads, students, lessons, topGroups, smart] = await Promise.all([
      pool.query(
        `SELECT to_char(month, 'YYYY-MM') AS month, COALESCE(SUM(p.amount), 0)::numeric AS amount
         FROM generate_series(date_trunc('month', NOW()) - interval '5 months', date_trunc('month', NOW()), interval '1 month') month
         LEFT JOIN payments p ON p.organization_id=$1 AND date_trunc('month', p.paid_at)=month
         GROUP BY month ORDER BY month`,
        [organizationId]
      ),
      pool.query("SELECT status, COUNT(*)::int AS count FROM leads WHERE organization_id=$1 GROUP BY status", [organizationId]),
      pool.query(
        `SELECT to_char(month, 'YYYY-MM') AS month, COUNT(s.id)::int AS count
         FROM generate_series(date_trunc('month', NOW()) - interval '5 months', date_trunc('month', NOW()), interval '1 month') month
         LEFT JOIN students s ON s.organization_id=$1 AND date_trunc('month', s.created_at)=month
         GROUP BY month ORDER BY month`,
        [organizationId]
      ),
      pool.query(
        `SELECT l.*, g.name AS group_name
         FROM lessons l
         LEFT JOIN groups g ON g.id=l.group_id
         WHERE l.organization_id=$1 AND l.lesson_at::date=CURRENT_DATE
         ORDER BY l.lesson_at ASC LIMIT 8`,
        [organizationId]
      ),
      pool.query(
        `SELECT g.name, COUNT(s.id)::int AS students
         FROM groups g
         LEFT JOIN students s ON s.group_id=g.id
         WHERE g.organization_id=$1
         GROUP BY g.id
         ORDER BY students DESC, g.id DESC
         LIMIT 5`,
        [organizationId]
      ),
      pool.query(
        `SELECT
          COALESCE((SELECT SUM(amount) FROM payments WHERE organization_id=$1 AND paid_at::date=CURRENT_DATE), 0)::numeric AS today_revenue,
          COALESCE((SELECT SUM(amount) FROM payments WHERE organization_id=$1 AND paid_at::date=CURRENT_DATE - 1), 0)::numeric AS yesterday_revenue,
          (SELECT COUNT(*)::int FROM leads WHERE organization_id=$1 AND created_at::date=CURRENT_DATE) AS today_leads,
          (SELECT COUNT(*)::int FROM students WHERE organization_id=$1 AND balance > 0) AS debtors,
          COALESCE((SELECT SUM(balance) FROM students WHERE organization_id=$1 AND balance > 0), 0)::numeric AS debt_total,
          (SELECT COUNT(*)::int FROM leads WHERE organization_id=$1 AND status='paid') AS paid_leads,
          GREATEST((SELECT COUNT(*)::int FROM leads WHERE organization_id=$1), 1) AS all_leads,
          (SELECT COUNT(*)::int FROM leads WHERE organization_id=$1 AND next_contact_at <= NOW() AND status NOT IN ('paid','lost')) AS overdue_followups`,
        [organizationId]
      )
    ]);
    const smartRow = smart.rows[0] || {};
    const todayRevenue = Number(smartRow.today_revenue || 0);
    const yesterdayRevenue = Number(smartRow.yesterday_revenue || 0);
    const revenueGrowth = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : todayRevenue > 0 ? 100 : 0;
    const conversionRate = (Number(smartRow.paid_leads || 0) / Number(smartRow.all_leads || 1)) * 100;
    const alerts = [];
    if (Number(smartRow.debtors || 0) > 0) alerts.push(`${smartRow.debtors} ta qarzdor mavjud`);
    if (Number(smartRow.overdue_followups || 0) > 0) alerts.push(`${smartRow.overdue_followups} ta lidga qayta aloqa vaqti kelgan`);
    if (!alerts.length) alerts.push("Muhim ogohlantirish yo'q");

    sendJson(response, 200, {
      ok: true,
      analytics: {
        smart: {
          today_revenue: todayRevenue,
          yesterday_revenue: yesterdayRevenue,
          revenue_growth: revenueGrowth,
          today_leads: Number(smartRow.today_leads || 0),
          debtors: Number(smartRow.debtors || 0),
          debt_total: Number(smartRow.debt_total || 0),
          conversion_rate: conversionRate,
          overdue_followups: Number(smartRow.overdue_followups || 0),
          alerts
        },
        monthly_payments: payments.rows,
        lead_funnel: leads.rows,
        student_growth: students.rows,
        today_lessons: lessons.rows,
        top_groups: topGroups.rows
      }
    });
  } catch (error) {
    withError(response, "Analytics", error);
  }
}

async function handleAuditLogsRequest(request, response) {
  try {
    const user = await requireUser(request, response, "audit:read");
    if (!user) return;

    const query = requestQuery(request);
    const { page, limit, offset } = pageOptions(query);
    const search = asText(query.get("search"));
    const params = [user.organization_id];
    let where = "WHERE a.organization_id=$1";

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (a.action ILIKE $${params.length} OR a.entity ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`;
    }

    const countResult = await getDbPool().query(
      `SELECT COUNT(*)::int AS total FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ${where}`,
      params
    );
    params.push(limit, offset);
    const result = await getDbPool().query(
      `SELECT a.*, u.full_name AS user_name
       FROM audit_logs a
       LEFT JOIN users u ON u.id=a.user_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    sendJson(response, 200, { ok: true, items: result.rows, total: countResult.rows[0].total, page, limit });
  } catch (error) {
    withError(response, "Audit logs", error);
  }
}

async function listRows(request, response, config) {
  try {
    const user = await requireUser(request, response, `${config.permission}:read`);
    if (!user) return;

    const query = requestQuery(request);
    const { page, limit, offset } = pageOptions(query);
    const params = [user.organization_id];
    let where = "WHERE 1=1";
    const search = asText(query.get("search"));
    const status = asText(query.get("status"));
    const dateFrom = asDate(query.get("date_from"));
    const dateTo = asDate(query.get("date_to"));

    if (search && config.searchColumns?.length) {
      params.push(`%${search}%`);
      const searchIndex = params.length;
      where += ` AND (${config.searchColumns.map((column) => `${column}::text ILIKE $${searchIndex}`).join(" OR ")})`;
    }

    if (status && config.filterColumns?.status) {
      params.push(status);
      where += ` AND ${config.filterColumns.status} = $${params.length}`;
    }

    for (const [paramName, column] of Object.entries(config.filterColumns || {})) {
      if (paramName === "status") continue;
      const value = asText(query.get(paramName));
      if (!value) continue;
      params.push(`%${value}%`);
      where += ` AND ${column}::text ILIKE $${params.length}`;
    }

    if (dateFrom) {
      params.push(dateFrom);
      where += ` AND created_at::date >= $${params.length}::date`;
    }

    if (dateTo) {
      params.push(dateTo);
      where += ` AND created_at::date <= $${params.length}::date`;
    }

    if (config.entity === "students") {
      const finance = asText(query.get("finance"));
      const groupId = asText(query.get("group_id"));
      if (finance === "debt") where += " AND balance > 0";
      if (finance === "clear") where += " AND balance <= 0";
      if (groupId) {
        params.push(groupId);
        where += ` AND group_id=$${params.length}`;
      }
    }

    if (config.entity === "groups") {
      const startsAt = asDate(query.get("starts_at"));
      const endsAt = asDate(query.get("ends_at"));
      if (startsAt) {
        params.push(startsAt);
        where += ` AND starts_at >= $${params.length}::date`;
      }
      if (endsAt) {
        params.push(endsAt);
        where += ` AND COALESCE(ends_at, starts_at) <= $${params.length}::date`;
      }
    }

    const sort = config.sortColumns?.includes(query.get("sort")) ? query.get("sort") : config.defaultSort || "id";
    const order = query.get("order") === "asc" ? "ASC" : "DESC";
    const baseSql = `SELECT * FROM (${config.listSql}) data ${where}`;
    const countResult = await getDbPool().query(`SELECT COUNT(*)::int AS total FROM (${baseSql}) counted`, params);
    params.push(limit, offset);
    const result = await getDbPool().query(`${baseSql} ORDER BY ${sort} ${order} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
    sendJson(response, 200, { ok: true, items: result.rows, total: countResult.rows[0].total, page, limit });
  } catch (error) {
    withError(response, `List ${config.entity}`, error);
  }
}

async function getRow(request, response, config, id) {
  try {
    const user = await requireUser(request, response, `${config.permission}:read`);
    if (!user) return;
    const result = await getDbPool().query(`SELECT * FROM (${config.listSql}) data WHERE id=$2 LIMIT 1`, [user.organization_id, id]);
    if (!result.rows[0]) {
      sendJson(response, 404, { ok: false, message: "Ma'lumot topilmadi" });
      return;
    }
    sendJson(response, 200, { ok: true, item: result.rows[0] });
  } catch (error) {
    withError(response, `Get ${config.entity}`, error);
  }
}

async function createRow(request, response, config) {
  try {
    const user = await requireUser(request, response, `${config.permission}:write`);
    if (!user) return;

    const body = await readJsonBody(request);
    const data = config.prepare(body, user);
    const result = await getDbPool().query(config.insertSql, data.values);
    if (config.entity === "students" && result.rows[0]?.group_id) {
      await getDbPool().query(
        `INSERT INTO group_students (organization_id, group_id, student_id)
         VALUES ($1,$2,$3)
         ON CONFLICT (organization_id, group_id, student_id) DO NOTHING`,
        [user.organization_id, result.rows[0].group_id, result.rows[0].id]
      );
    }
    await writeAudit(getDbPool(), user, "create", config.entity, result.rows[0]?.id, data.audit || body);
    sendJson(response, 201, { ok: true, item: result.rows[0] });
  } catch (error) {
    withError(response, `Create ${config.entity}`, error);
  }
}

async function updateRow(request, response, config, id) {
  try {
    const user = await requireUser(request, response, `${config.permission}:write`);
    if (!user) return;

    const body = await readJsonBody(request);
    const data = config.prepare(body, user, id);
    const pool = getDbPool();
    const before = await pool.query(`SELECT * FROM ${config.entity} WHERE id=$1 AND organization_id=$2`, [id, user.organization_id]);
    const result = await pool.query(config.updateSql, data.values);

    if (!result.rows[0]) {
      sendJson(response, 404, { ok: false, message: "Ma'lumot topilmadi" });
      return;
    }

    if (config.entity === "students" && result.rows[0]?.group_id) {
      await pool.query(
        `INSERT INTO group_students (organization_id, group_id, student_id)
         VALUES ($1,$2,$3)
         ON CONFLICT (organization_id, group_id, student_id) DO UPDATE SET status='active'`,
        [user.organization_id, result.rows[0].group_id, result.rows[0].id]
      );
    }

    await writeAudit(pool, user, "update", config.entity, id, { before: before.rows[0] || null, after: result.rows[0] });
    sendJson(response, 200, { ok: true, item: result.rows[0] });
  } catch (error) {
    withError(response, `Update ${config.entity}`, error);
  }
}

async function deleteRow(request, response, config, id) {
  try {
    const user = await requireUser(request, response, `${config.permission}:write`);
    if (!user) return;

    const pool = getDbPool();
    const before = await pool.query(`SELECT * FROM ${config.entity} WHERE id=$1 AND organization_id=$2`, [id, user.organization_id]);
    const result = await pool.query(config.deleteSql, [id, user.organization_id]);

    if (!result.rows[0]) {
      sendJson(response, 404, { ok: false, message: "Ma'lumot topilmadi" });
      return;
    }

    await writeAudit(pool, user, "delete", config.entity, id, { before: before.rows[0] || null });
    sendJson(response, 200, { ok: true });
  } catch (error) {
    withError(response, `Delete ${config.entity}`, error);
  }
}

const crudConfigs = {
  courses: {
    entity: "courses",
    permission: "courses",
    listSql: `SELECT c.*,
        (SELECT COUNT(*)::int FROM groups g WHERE g.organization_id=c.organization_id AND g.course_name=c.name) AS groups_count,
        (SELECT COUNT(*)::int FROM students s WHERE s.organization_id=c.organization_id AND s.course_name=c.name) AS students_count
      FROM courses c WHERE c.organization_id=$1 ORDER BY c.id DESC`,
    searchColumns: ["name", "description", "duration", "lesson_type", "status"],
    filterColumns: { status: "status", lesson_type: "lesson_type" },
    sortColumns: ["id", "name", "price", "status", "created_at"],
    defaultSort: "id",
    insertSql: `INSERT INTO courses (organization_id, name, description, price, duration, level, lesson_type, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    updateSql: `UPDATE courses SET name=$3, description=$4, price=$5, duration=$6, level=$7, lesson_type=$8, status=$9
      WHERE id=$1 AND organization_id=$2 RETURNING *`,
    deleteSql: "DELETE FROM courses WHERE id=$1 AND organization_id=$2 RETURNING id",
    prepare: (body, user, id) => ({
      values: id
        ? [id, user.organization_id, asText(body.name), asText(body.description), asNumber(body.price), asText(body.duration), asText(body.level), asText(body.lesson_type, "group"), asText(body.status, "active")]
        : [user.organization_id, asText(body.name), asText(body.description), asNumber(body.price), asText(body.duration), asText(body.level), asText(body.lesson_type, "group"), asText(body.status, "active")]
    })
  },
  students: {
    entity: "students",
    permission: "students",
    listSql: `SELECT s.*, g.name AS group_name, COALESCE(SUM(p.amount), 0)::numeric AS paid_total
      FROM students s
      LEFT JOIN groups g ON g.id = s.group_id
      LEFT JOIN payments p ON p.student_id = s.id
      WHERE s.organization_id = $1
      GROUP BY s.id, g.name
      ORDER BY s.id DESC`,
    searchColumns: ["full_name", "phone", "parent_phone", "course_name", "group_name"],
    filterColumns: { status: "status", course_name: "course_name" },
    sortColumns: ["id", "full_name", "phone", "status", "balance", "created_at"],
    defaultSort: "id",
    insertSql: `INSERT INTO students (organization_id, full_name, phone, parent_phone, birth_date, address, course_name, group_id, payment_type, discount, status, balance, note)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    updateSql: `UPDATE students SET full_name=$3, phone=$4, parent_phone=$5, birth_date=$6, address=$7, course_name=$8, group_id=$9, payment_type=$10, discount=$11, status=$12, balance=$13, note=$14
      WHERE id=$1 AND organization_id=$2 RETURNING *`,
    deleteSql: "DELETE FROM students WHERE id=$1 AND organization_id=$2 RETURNING id",
    prepare: (body, user, id) => ({
      values: id
        ? [id, user.organization_id, asText(body.full_name), asText(body.phone), asText(body.parent_phone), asDate(body.birth_date), asText(body.address), asText(body.course_name), body.group_id || null, asText(body.payment_type), asNumber(body.discount), asText(body.status, "active"), asNumber(body.balance), asText(body.note)]
        : [user.organization_id, asText(body.full_name), asText(body.phone), asText(body.parent_phone), asDate(body.birth_date), asText(body.address), asText(body.course_name), body.group_id || null, asText(body.payment_type), asNumber(body.discount), asText(body.status, "active"), asNumber(body.balance), asText(body.note)]
    })
  },
  leads: {
    entity: "leads",
    permission: "leads",
    listSql: "SELECT * FROM leads WHERE organization_id=$1 ORDER BY id DESC",
    searchColumns: ["full_name", "phone", "source", "manager_name", "note"],
    filterColumns: { status: "status", manager_name: "manager_name" },
    sortColumns: ["id", "full_name", "status", "created_at", "next_contact_at"],
    defaultSort: "id",
    insertSql: `INSERT INTO leads (organization_id, full_name, phone, course_name, status, source, manager_name, next_contact_at, note)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    updateSql: `UPDATE leads SET full_name=$3, phone=$4, course_name=$5, status=$6, source=$7, manager_name=$8, next_contact_at=$9, note=$10
      WHERE id=$1 AND organization_id=$2 RETURNING *`,
    deleteSql: "DELETE FROM leads WHERE id=$1 AND organization_id=$2 RETURNING id",
    prepare: (body, user, id) => ({
      values: id
        ? [id, user.organization_id, asText(body.full_name), asText(body.phone), asText(body.course_name), asText(body.status, "new"), asText(body.source), asText(body.manager_name), asDate(body.next_contact_at), asText(body.note)]
        : [user.organization_id, asText(body.full_name), asText(body.phone), asText(body.course_name), asText(body.status, "new"), asText(body.source), asText(body.manager_name), asDate(body.next_contact_at), asText(body.note)]
    })
  },
  groups: {
    entity: "groups",
    permission: "groups",
    listSql: `SELECT g.*, t.full_name AS teacher_full_name, COUNT(s.id)::int AS student_count
      FROM groups g
      LEFT JOIN teachers t ON t.id = g.teacher_id
      LEFT JOIN students s ON s.group_id = g.id
      WHERE g.organization_id=$1
      GROUP BY g.id, t.full_name
      ORDER BY g.id DESC`,
    searchColumns: ["name", "course_name", "teacher_full_name", "teacher_name", "days", "room"],
    filterColumns: { status: "status", course_name: "course_name", teacher: "teacher_full_name", days: "days" },
    sortColumns: ["id", "name", "course_name", "status", "student_count"],
    defaultSort: "id",
    insertSql: `INSERT INTO groups (organization_id, name, course_name, status, teacher_id, teacher_name, days, start_time, end_time, monthly_price, starts_at, ends_at, room)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    updateSql: `UPDATE groups SET name=$3, course_name=$4, status=$5, teacher_id=$6, teacher_name=$7, days=$8, start_time=$9, end_time=$10, monthly_price=$11, starts_at=$12, ends_at=$13, room=$14
      WHERE id=$1 AND organization_id=$2 RETURNING *`,
    deleteSql: "DELETE FROM groups WHERE id=$1 AND organization_id=$2 RETURNING id",
    prepare: (body, user, id) => ({
      values: id
        ? [id, user.organization_id, asText(body.name), asText(body.course_name), asText(body.status, "active"), body.teacher_id || null, asText(body.teacher_name), asText(body.days), asText(body.start_time), asText(body.end_time), asNumber(body.monthly_price), asDate(body.starts_at), asDate(body.ends_at), asText(body.room)]
        : [user.organization_id, asText(body.name), asText(body.course_name), asText(body.status, "active"), body.teacher_id || null, asText(body.teacher_name), asText(body.days), asText(body.start_time), asText(body.end_time), asNumber(body.monthly_price), asDate(body.starts_at), asDate(body.ends_at), asText(body.room)]
    })
  },
  teachers: {
    entity: "teachers",
    permission: "teachers",
    listSql: "SELECT * FROM teachers WHERE organization_id=$1 ORDER BY id DESC",
    searchColumns: ["full_name", "phone", "email", "course_name", "subjects"],
    filterColumns: { status: "status", course_name: "course_name" },
    sortColumns: ["id", "full_name", "status", "created_at"],
    defaultSort: "id",
    insertSql: `INSERT INTO teachers (organization_id, full_name, phone, email, course_name, subjects, groups, login_enabled, status, salary_type, salary_rate)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    updateSql: `UPDATE teachers SET full_name=$3, phone=$4, email=$5, course_name=$6, subjects=$7, groups=$8, login_enabled=$9, status=$10, salary_type=$11, salary_rate=$12
      WHERE id=$1 AND organization_id=$2 RETURNING *`,
    deleteSql: "DELETE FROM teachers WHERE id=$1 AND organization_id=$2 RETURNING id",
    prepare: (body, user, id) => ({
      values: id
        ? [id, user.organization_id, asText(body.full_name), asText(body.phone), asText(body.email), asText(body.course_name), asText(body.subjects), asText(body.groups), Boolean(body.login_enabled), asText(body.status, "active"), asText(body.salary_type, "fixed"), asNumber(body.salary_rate)]
        : [user.organization_id, asText(body.full_name), asText(body.phone), asText(body.email), asText(body.course_name), asText(body.subjects), asText(body.groups), Boolean(body.login_enabled), asText(body.status, "active"), asText(body.salary_type, "fixed"), asNumber(body.salary_rate)]
    })
  }
};

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function paymentStatusFrom(amount, dueAmount, discount, fallback = "") {
  const explicitStatus = asText(fallback);
  if (explicitStatus) return explicitStatus;
  const remaining = Math.max(Number(dueAmount || 0) - Number(amount || 0) - Number(discount || 0), 0);
  if (remaining <= 0) return "paid";
  if (Number(amount || 0) > 0 || Number(discount || 0) > 0) return "partial";
  return "debt";
}

async function recalculateStudentBalance(pool, organizationId, studentId) {
  if (!studentId) return;
  const result = await pool.query(
    `SELECT GREATEST(COALESCE(SUM(COALESCE(due_amount, 0) - COALESCE(amount, 0) - COALESCE(discount, 0)), 0), 0)::numeric AS balance
     FROM payments
     WHERE organization_id=$1 AND student_id=$2 AND status <> 'cancelled'`,
    [organizationId, studentId]
  );
  const balance = result.rows[0]?.balance || 0;
  await pool.query(
    `UPDATE students
     SET balance=$3,
         status=CASE
           WHEN $3::numeric > 0 AND status IN ('active', 'debtor') THEN 'debtor'
           WHEN $3::numeric <= 0 AND status='debtor' THEN 'active'
           ELSE status
         END
     WHERE organization_id=$1 AND id=$2`,
    [organizationId, studentId, balance]
  );
}

async function handlePaymentCreate(request, response) {
  try {
    const user = await requireUser(request, response, "payments:write");
    if (!user) return;

    const body = await readJsonBody(request);
    const amount = asNumber(body.amount);
    const discount = asNumber(body.discount);
    const dueAmount = asNumber(body.due_amount, amount + discount);
    const pool = getDbPool();
    const result = await pool.query(
      `INSERT INTO payments (organization_id, student_id, group_id, payment_month, due_amount, amount, discount, status, payment_type, note, created_by, paid_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,COALESCE($12::timestamptz,NOW())) RETURNING *`,
      [
        user.organization_id,
        body.student_id || null,
        body.group_id || null,
        asText(body.payment_month),
        dueAmount,
        amount,
        discount,
        paymentStatusFrom(amount, dueAmount, discount, body.status),
        asText(body.payment_type, "naqd"),
        asText(body.note),
        user.id,
        asDate(body.paid_at)
      ]
    );

    if (body.student_id) {
      await recalculateStudentBalance(pool, user.organization_id, body.student_id);
    }

    await writeAudit(pool, user, "create", "payments", result.rows[0].id, body);
    sendJson(response, 201, { ok: true, item: result.rows[0] });
  } catch (error) {
    withError(response, "Create payments", error);
  }
}

async function handlePaymentUpdate(request, response, paymentId) {
  try {
    const user = await requireUser(request, response, "payments:write");
    if (!user) return;

    const body = await readJsonBody(request);
    const pool = getDbPool();
    const beforeResult = await pool.query("SELECT * FROM payments WHERE id=$1 AND organization_id=$2", [paymentId, user.organization_id]);
    const before = beforeResult.rows[0];

    if (!before) {
      sendJson(response, 404, { ok: false, message: "To'lov topilmadi" });
      return;
    }

    const amount = hasOwn(body, "amount") ? asNumber(body.amount) : Number(before.amount || 0);
    const discount = hasOwn(body, "discount") ? asNumber(body.discount) : Number(before.discount || 0);
    const dueAmount = hasOwn(body, "due_amount") ? asNumber(body.due_amount, amount + discount) : Number(before.due_amount || amount + discount);
    const studentId = hasOwn(body, "student_id") ? body.student_id || null : before.student_id;
    const groupId = hasOwn(body, "group_id") ? body.group_id || null : before.group_id;
    const result = await pool.query(
      `UPDATE payments
       SET student_id=$3, group_id=$4, payment_month=$5, due_amount=$6, amount=$7, discount=$8, status=$9, payment_type=$10, note=$11, paid_at=COALESCE($12::timestamptz, paid_at)
       WHERE id=$1 AND organization_id=$2
       RETURNING *`,
      [
        paymentId,
        user.organization_id,
        studentId,
        groupId,
        hasOwn(body, "payment_month") ? asText(body.payment_month) : before.payment_month,
        dueAmount,
        amount,
        discount,
        paymentStatusFrom(amount, dueAmount, discount, hasOwn(body, "status") ? body.status : before.status),
        hasOwn(body, "payment_type") ? asText(body.payment_type, "naqd") : before.payment_type,
        hasOwn(body, "note") ? asText(body.note) : before.note,
        hasOwn(body, "paid_at") ? asDate(body.paid_at) : null
      ]
    );

    await recalculateStudentBalance(pool, user.organization_id, before.student_id);
    if (String(before.student_id || "") !== String(studentId || "")) {
      await recalculateStudentBalance(pool, user.organization_id, studentId);
    }

    await writeAudit(pool, user, "update", "payments", paymentId, { before, after: result.rows[0] });
    sendJson(response, 200, { ok: true, item: result.rows[0] });
  } catch (error) {
    withError(response, "Update payments", error);
  }
}

async function handlePaymentDelete(request, response, paymentId) {
  try {
    const user = await requireUser(request, response, "payments:write");
    if (!user) return;

    const pool = getDbPool();
    const beforeResult = await pool.query("SELECT * FROM payments WHERE id=$1 AND organization_id=$2", [paymentId, user.organization_id]);
    const before = beforeResult.rows[0];
    if (!before) {
      sendJson(response, 404, { ok: false, message: "To'lov topilmadi" });
      return;
    }

    await pool.query("DELETE FROM payments WHERE id=$1 AND organization_id=$2", [paymentId, user.organization_id]);
    await recalculateStudentBalance(pool, user.organization_id, before.student_id);
    await writeAudit(pool, user, "delete", "payments", paymentId, { before });
    sendJson(response, 200, { ok: true });
  } catch (error) {
    withError(response, "Delete payments", error);
  }
}

async function handleStudentProfileRequest(request, response, studentId) {
  try {
    const user = await requireUser(request, response, "students:read");
    if (!user) return;

    const pool = getDbPool();
    const [student, payments, attendance] = await Promise.all([
      pool.query(
        `SELECT s.*, g.name AS group_name, g.course_name AS group_course, t.full_name AS teacher_name
         FROM students s
         LEFT JOIN groups g ON g.id=s.group_id
         LEFT JOIN teachers t ON t.id=g.teacher_id
         WHERE s.id=$1 AND s.organization_id=$2`,
        [studentId, user.organization_id]
      ),
      pool.query("SELECT * FROM payments WHERE student_id=$1 AND organization_id=$2 ORDER BY paid_at DESC", [studentId, user.organization_id]),
      pool.query(
        `SELECT a.*, g.name AS group_name
         FROM attendance_records a
         LEFT JOIN groups g ON g.id=a.group_id
         WHERE a.student_id=$1 AND a.organization_id=$2
         ORDER BY a.lesson_date DESC`,
        [studentId, user.organization_id]
      )
    ]);

    if (!student.rows[0]) {
      sendJson(response, 404, { ok: false, message: "Talaba topilmadi" });
      return;
    }

    sendJson(response, 200, { ok: true, profile: { student: student.rows[0], payments: payments.rows, attendance: attendance.rows } });
  } catch (error) {
    withError(response, "Student profile", error);
  }
}

async function listPayments(request, response) {
  try {
    const user = await requireUser(request, response, "read");
    if (!user) return;

    const query = requestQuery(request);
    const { page, limit, offset } = pageOptions(query);
    const search = asText(query.get("search"));
    const paymentType = asText(query.get("payment_type"));
    const status = asText(query.get("status"));
    const groupId = asText(query.get("group_id"));
    const groupName = asText(query.get("group_name"));
    const paymentMonth = asText(query.get("payment_month") || query.get("month"));
    const dateFrom = asDate(query.get("date_from"));
    const dateTo = asDate(query.get("date_to"));
    const params = [user.organization_id];
    let where = "WHERE p.organization_id=$1";
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (s.full_name ILIKE $${params.length} OR s.phone ILIKE $${params.length})`;
    }
    if (paymentType) {
      params.push(paymentType);
      where += ` AND p.payment_type=$${params.length}`;
    }
    if (status) {
      params.push(status);
      where += ` AND p.status=$${params.length}`;
    }
    if (groupId) {
      params.push(groupId);
      where += ` AND p.group_id=$${params.length}`;
    }
    if (groupName) {
      params.push(`%${groupName}%`);
      where += ` AND g.name ILIKE $${params.length}`;
    }
    if (paymentMonth) {
      params.push(paymentMonth);
      where += ` AND p.payment_month=$${params.length}`;
    }
    if (dateFrom) {
      params.push(dateFrom);
      where += ` AND p.paid_at::date >= $${params.length}::date`;
    }
    if (dateTo) {
      params.push(dateTo);
      where += ` AND p.paid_at::date <= $${params.length}::date`;
    }
    const countResult = await getDbPool().query(
      `SELECT COUNT(*)::int AS total
       FROM payments p
       LEFT JOIN students s ON s.id=p.student_id
       LEFT JOIN groups g ON g.id=p.group_id
       ${where}`,
      params
    );
    params.push(limit, offset);
    const result = await getDbPool().query(
      `SELECT p.*, s.full_name AS student_name, g.name AS group_name, u.full_name AS created_by_name,
              p.amount AS paid_amount,
              GREATEST(COALESCE(p.due_amount, 0) - COALESCE(p.amount, 0) - COALESCE(p.discount, 0), 0)::numeric AS remaining_debt
       FROM payments p
       LEFT JOIN students s ON s.id = p.student_id
       LEFT JOIN groups g ON g.id = p.group_id
       LEFT JOIN users u ON u.id = p.created_by
       ${where}
       ORDER BY p.paid_at DESC, p.id DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    sendJson(response, 200, { ok: true, items: result.rows, total: countResult.rows[0].total, page, limit });
  } catch (error) {
    withError(response, "List payments", error);
  }
}

async function handleAttendance(request, response) {
  try {
    const user = await requireUser(request, response, request.method === "POST" ? "attendance:write" : "attendance:read");
    if (!user) return;

    const pool = getDbPool();
    if (request.method === "GET") {
      const query = requestQuery(request);
      const { page, limit, offset } = pageOptions(query);
      const status = asText(query.get("status"));
      const search = asText(query.get("search"));
      const groupName = asText(query.get("group_name"));
      const lessonDate = asDate(query.get("lesson_date"));
      const params = [user.organization_id];
      let where = "WHERE a.organization_id=$1";
      if (status) {
        params.push(status);
        where += ` AND a.status=$${params.length}`;
      }
      if (lessonDate) {
        params.push(lessonDate);
        where += ` AND a.lesson_date=$${params.length}::date`;
      }
      if (search) {
        params.push(`%${search}%`);
        where += ` AND (s.full_name ILIKE $${params.length} OR g.name ILIKE $${params.length})`;
      }
      if (groupName) {
        params.push(`%${groupName}%`);
        where += ` AND g.name ILIKE $${params.length}`;
      }
      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM attendance_records a LEFT JOIN students s ON s.id=a.student_id LEFT JOIN groups g ON g.id=a.group_id ${where}`,
        params
      );
      params.push(limit, offset);
      const result = await pool.query(
        `SELECT a.*, s.full_name AS student_name, g.name AS group_name
         FROM attendance_records a
         LEFT JOIN students s ON s.id=a.student_id
         LEFT JOIN groups g ON g.id=a.group_id
         ${where}
         ORDER BY a.lesson_date DESC, a.id DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );
      sendJson(response, 200, { ok: true, items: result.rows, total: countResult.rows[0].total, page, limit });
      return;
    }

    const body = await readJsonBody(request);
    const records = Array.isArray(body.records) ? body.records : [body];
    const saved = [];
    for (const record of records) {
    const result = await pool.query(
      `INSERT INTO attendance_records (organization_id, group_id, student_id, lesson_date, status, note, marked_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (organization_id, group_id, student_id, lesson_date)
       DO UPDATE SET status=EXCLUDED.status, note=EXCLUDED.note, marked_by=EXCLUDED.marked_by
       RETURNING *`,
      [user.organization_id, record.group_id, record.student_id, asDate(record.lesson_date), asText(record.status, "present"), asText(record.note), user.id]
    );
      saved.push(result.rows[0]);
    }

    await writeAudit(pool, user, "upsert", "attendance_records", saved[0]?.id, { count: saved.length, records });
    sendJson(response, 200, { ok: true, item: saved[0], items: saved });
  } catch (error) {
    withError(response, "Attendance", error);
  }
}

async function handleAttendanceUpdate(request, response, attendanceId) {
  try {
    const user = await requireUser(request, response, "attendance:write");
    if (!user) return;

    const body = await readJsonBody(request);
    const pool = getDbPool();
    const before = await pool.query("SELECT * FROM attendance_records WHERE id=$1 AND organization_id=$2", [attendanceId, user.organization_id]);
    if (!before.rows[0]) {
      sendJson(response, 404, { ok: false, message: "Davomat yozuvi topilmadi" });
      return;
    }
    const result = await pool.query(
      `UPDATE attendance_records
       SET group_id=$3, student_id=$4, lesson_date=$5, status=$6, note=$7, marked_by=$8
       WHERE id=$1 AND organization_id=$2
       RETURNING *`,
      [
        attendanceId,
        user.organization_id,
        body.group_id || before.rows[0].group_id || null,
        body.student_id || before.rows[0].student_id || null,
        asDate(body.lesson_date) || before.rows[0].lesson_date,
        asText(body.status, before.rows[0].status || "present"),
        hasOwn(body, "note") ? asText(body.note) : before.rows[0].note,
        user.id
      ]
    );

    await writeAudit(pool, user, "update", "attendance_records", attendanceId, { before: before.rows[0] || null, after: result.rows[0] });
    sendJson(response, 200, { ok: true, item: result.rows[0] });
  } catch (error) {
    withError(response, "Update attendance", error);
  }
}

async function handleAttendanceDelete(request, response, attendanceId) {
  try {
    const user = await requireUser(request, response, "attendance:write");
    if (!user) return;

    const pool = getDbPool();
    const before = await pool.query("SELECT * FROM attendance_records WHERE id=$1 AND organization_id=$2", [attendanceId, user.organization_id]);
    const result = await pool.query("DELETE FROM attendance_records WHERE id=$1 AND organization_id=$2 RETURNING id", [attendanceId, user.organization_id]);
    if (!result.rows[0]) {
      sendJson(response, 404, { ok: false, message: "Davomat yozuvi topilmadi" });
      return;
    }
    await writeAudit(pool, user, "delete", "attendance_records", attendanceId, { before: before.rows[0] || null });
    sendJson(response, 200, { ok: true });
  } catch (error) {
    withError(response, "Delete attendance", error);
  }
}

async function listSimpleFinance(request, response, tableName, dateColumn) {
  try {
    const user = await requireUser(request, response, "read");
    if (!user) return;

    const result = await getDbPool().query(
      `SELECT * FROM ${tableName} WHERE organization_id=$1 ORDER BY ${dateColumn} DESC, id DESC`,
      [user.organization_id]
    );
    sendJson(response, 200, { ok: true, items: result.rows });
  } catch (error) {
    withError(response, `List ${tableName}`, error);
  }
}

async function createSimpleFinance(request, response, tableName, dateColumn, titleColumn) {
  try {
    const user = await requireUser(request, response, "finance:write");
    if (!user) return;

    const body = await readJsonBody(request);
    const pool = getDbPool();
    const result = await pool.query(
      `INSERT INTO ${tableName} (organization_id, ${titleColumn}, amount, ${dateColumn}, note, created_by)
       VALUES ($1,$2,$3,COALESCE($4::date,CURRENT_DATE),$5,$6) RETURNING *`,
      [user.organization_id, asText(body.title || body.teacher_id || "Kiritilmagan"), asNumber(body.amount), asDate(body[dateColumn]), asText(body.note), user.id]
    );

    await writeAudit(pool, user, "create", tableName, result.rows[0].id, body);
    sendJson(response, 201, { ok: true, item: result.rows[0] });
  } catch (error) {
    withError(response, `Create ${tableName}`, error);
  }
}

async function handleDemoRequest(request, response) {
  try {
    const body = await readJsonBody(request);
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const center = String(body.center || "Kiritilmagan").trim();
    const students = String(body.students || "Kiritilmagan").trim();
    const lang = String(body.lang || "uz").trim().toUpperCase();

    if (!name || !phone) {
      sendJson(response, 400, { ok: false, message: "Name and phone are required" });
      return;
    }

    if (process.env.DATABASE_URL) {
      await getDbPool().query(
        "INSERT INTO demo_requests (name, phone, center, students, lang) VALUES ($1, $2, $3, $4, $5)",
        [name, phone, center, students, lang]
      );
    }

    const message = [
      "<b>Eduka demo so'rovi</b>",
      "",
      `<b>Ism:</b> ${escapeHtml(name)}`,
      `<b>Telefon:</b> ${escapeHtml(phone)}`,
      `<b>Markaz:</b> ${escapeHtml(center)}`,
      `<b>O'quvchi soni:</b> ${escapeHtml(students)}`,
      `<b>Til:</b> ${escapeHtml(lang)}`,
      `<b>Manba:</b> eduka.uz landing`,
      `<b>Vaqt:</b> ${new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" })}`
    ].join("\n");

    await sendTelegramMessage(message);
    sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error(`Demo request failed: ${error.message}`);
    const isConfigError = error.message === "Telegram is not configured";
    sendJson(response, isConfigError ? 503 : 500, {
      ok: false,
      message: isConfigError ? "Telegram is not configured" : error.message
    });
  }
}

async function handleTelegramTest(response) {
  try {
    const message = [
      "<b>Eduka test xabari</b>",
      "",
      "Telegram ulanishi ishlayapti.",
      `<b>Vaqt:</b> ${new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" })}`
    ].join("\n");

    await sendTelegramMessage(message);
    sendJson(response, 200, { ok: true, message: "Telegram test message sent" });
  } catch (error) {
    console.error(`Telegram test failed: ${error.message}`);
    sendJson(response, 500, { ok: false, message: error.message });
  }
}

async function handleTelegramHealth(response, shouldCheckTelegram) {
  const config = getTelegramConfig({ allowMissing: true });
  const payload = {
    ok: true,
    configured: config.tokenPresent && config.chatIdCount > 0,
    tokenPresent: config.tokenPresent,
    chatIdCount: config.chatIdCount,
    tokenEnvName: config.tokenEnvName || null,
    chatEnvName: config.chatEnvName || null,
    supportedTokenEnv: ["TELEGRAM_BOT_TOKEN", "BOT_TOKEN", "TELEGRAM_TOKEN"],
    supportedChatEnv: ["TELEGRAM_CHAT_ID", "TELEGRAM_GROUP_ID", "TELEGRAM_ADMIN_CHAT_ID", "CHAT_ID"]
  };

  if (!shouldCheckTelegram || !config.tokenPresent) {
    sendJson(response, 200, payload);
    return;
  }

  try {
    const botInfo = await telegramApiRequest(config.token, "getMe");
    payload.bot = {
      ok: true,
      username: botInfo.result?.username || null,
      name: botInfo.result?.first_name || null
    };
  } catch (error) {
    payload.bot = { ok: false, error: error.message };
  }

  payload.chats = [];

  for (const chatId of config.chatIds || []) {
    try {
      const chatInfo = await telegramApiRequest(config.token, "getChat", { chat_id: chatId });
      payload.chats.push({
        chatId,
        ok: true,
        type: chatInfo.result?.type || null,
        title: chatInfo.result?.title || null
      });
    } catch (error) {
      payload.chats.push({ chatId, ok: false, error: error.message });
    }
  }

  sendJson(response, 200, payload);
}

const server = http.createServer((request, response) => {
  const [rawUrlPath, rawQuery = ""] = request.url.split("?");
  const urlPath = decodeURIComponent(rawUrlPath);
  const query = new URLSearchParams(rawQuery);

  if (request.method === "POST" && urlPath === "/api/demo") {
    handleDemoRequest(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/auth/login") {
    handleLoginRequest(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/auth/register") {
    handleRegisterRequest(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/auth/demo") {
    handleDemoLoginRequest(request, response);
    return;
  }

  if (request.method === "GET" && ["/api/auth/me", "/api/me"].includes(urlPath)) {
    handleMeRequest(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/auth/logout") {
    handleLogoutRequest(request, response);
    return;
  }

  if (urlPath === "/api/onboarding" && ["GET", "POST", "PUT"].includes(request.method)) {
    handleOnboardingRequest(request, response);
    return;
  }

  if (request.method === "GET" && ["/api/app/summary", "/api/dashboard"].includes(urlPath)) {
    handleSummaryRequest(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/app/analytics") {
    handleAnalyticsRequest(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/reports") {
    handleAnalyticsRequest(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/audit-logs") {
    handleAuditLogsRequest(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/debts") {
    handleDebtsRequest(request, response);
    return;
  }

  if (urlPath === "/api/schedule" && ["GET", "POST"].includes(request.method)) {
    handleScheduleRequest(request, response);
    return;
  }

  if (urlPath === "/api/settings" && ["GET", "PUT"].includes(request.method)) {
    handleSettingsRequest(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/super/summary") {
    handleSuperSummaryRequest(request, response);
    return;
  }

  const superCenterStatusMatch = urlPath.match(/^\/api\/super\/centers\/(\d+)\/status$/);
  if (superCenterStatusMatch && request.method === "PUT") {
    handleSuperCentersRequest(request, response, Number(superCenterStatusMatch[1]));
    return;
  }

  const superCenterMatch = urlPath.match(/^\/api\/super\/centers(?:\/(\d+))?$/);
  if (superCenterMatch && ["GET", "PUT"].includes(request.method)) {
    handleSuperCentersRequest(request, response, superCenterMatch[1] ? Number(superCenterMatch[1]) : null);
    return;
  }

  if (urlPath === "/api/super/tariffs" && ["GET", "POST"].includes(request.method)) {
    handleSuperTariffsRequest(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/super/subscriptions") {
    handleSuperSubscriptionsRequest(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/super/payments") {
    handleSuperPaymentsRequest(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/super/support") {
    handleSuperSupportRequest(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/super/settings") {
    handleSuperSettingsRequest(request, response);
    return;
  }

  const leadStatusMatch = urlPath.match(/^\/api\/leads\/(\d+)\/status$/);
  if (leadStatusMatch && request.method === "PUT") {
    handleLeadStatusRequest(request, response, Number(leadStatusMatch[1]));
    return;
  }

  const convertLeadMatch = urlPath.match(/^\/api\/leads\/(\d+)\/convert-to-student$/);
  if (convertLeadMatch && request.method === "POST") {
    handleLeadConvertRequest(request, response, Number(convertLeadMatch[1]));
    return;
  }

  const crudMatch = urlPath.match(/^\/api\/(students|leads|groups|teachers|courses)(?:\/(\d+))?$/);
  if (crudMatch) {
    const [, resource, id] = crudMatch;
    const config = crudConfigs[resource];

    if (request.method === "GET" && !id) {
      listRows(request, response, config);
      return;
    }

    if (request.method === "GET" && id) {
      getRow(request, response, config, Number(id));
      return;
    }

    if (request.method === "POST" && !id) {
      createRow(request, response, config);
      return;
    }

    if (request.method === "PUT" && id) {
      updateRow(request, response, config, Number(id));
      return;
    }

    if (request.method === "DELETE" && id) {
      deleteRow(request, response, config, Number(id));
      return;
    }
  }

  const studentProfileMatch = urlPath.match(/^\/api\/students\/(\d+)\/profile$/);
  if (studentProfileMatch && request.method === "GET") {
    handleStudentProfileRequest(request, response, Number(studentProfileMatch[1]));
    return;
  }

  const paymentMatch = urlPath.match(/^\/api\/payments(?:\/(\d+))?$/);
  if (paymentMatch) {
    const paymentId = paymentMatch[1] ? Number(paymentMatch[1]) : null;

    if (request.method === "GET" && !paymentId) {
      listPayments(request, response);
      return;
    }

    if (request.method === "POST" && !paymentId) {
      handlePaymentCreate(request, response);
      return;
    }

    if (request.method === "PUT" && paymentId) {
      handlePaymentUpdate(request, response, paymentId);
      return;
    }

    if (request.method === "DELETE" && paymentId) {
      handlePaymentDelete(request, response, paymentId);
      return;
    }
  }

  const attendanceMatch = urlPath.match(/^\/api\/attendance(?:\/(\d+))?$/);
  if (attendanceMatch) {
    const attendanceId = attendanceMatch[1] ? Number(attendanceMatch[1]) : null;

    if (["GET", "POST"].includes(request.method) && !attendanceId) {
      handleAttendance(request, response);
      return;
    }

    if (request.method === "PUT" && attendanceId) {
      handleAttendanceUpdate(request, response, attendanceId);
      return;
    }

    if (request.method === "DELETE" && attendanceId) {
      handleAttendanceDelete(request, response, attendanceId);
      return;
    }
  }

  if (urlPath === "/api/expenses") {
    if (request.method === "GET") {
      listSimpleFinance(request, response, "expenses", "spent_at");
      return;
    }

    if (request.method === "POST") {
      createSimpleFinance(request, response, "expenses", "spent_at", "title");
      return;
    }
  }

  if (urlPath === "/api/withdrawals") {
    if (request.method === "GET") {
      listSimpleFinance(request, response, "withdrawals", "withdrawn_at");
      return;
    }

    if (request.method === "POST") {
      createSimpleFinance(request, response, "withdrawals", "withdrawn_at", "title");
      return;
    }
  }

  if (request.method === "GET" && ["/api/telegram-health", "/api/telegram-health/"].includes(urlPath)) {
    handleTelegramHealth(response, query.get("check") === "1");
    return;
  }

  if (
    request.method === "GET" &&
    ["/api/telegram-test", "/api/telegram-test/", "/api/test-telegram", "/api/test-telegram/"].includes(urlPath)
  ) {
    handleTelegramTest(response);
    return;
  }

  if (request.method === "GET" && urlPath === "/" && isPanelHost(request)) {
    sendAppShell(response);
    return;
  }

  const appRouteRedirects = new Map([
    ["/app/", "/app"],
    ["/dashboard/", "/dashboard"],
    ["/login/", "/login"],
    ["/crm/", "/crm"],
    ["/panel/", "/panel"],
    ["/auth/login/", "/auth/login"],
    ["/auth/register/", "/auth/register"]
  ]);

  if (request.method === "GET" && appRouteRedirects.has(urlPath)) {
    sendRedirect(response, appRouteRedirects.get(urlPath));
    return;
  }

  const appRoutes = new Set(["/app", "/dashboard", "/login", "/crm", "/panel", "/auth/login", "/auth/register", "/auth/forgot-password"]);

  if (
    request.method === "GET" &&
    (appRoutes.has(urlPath) || urlPath.startsWith("/app/") || urlPath.startsWith("/super/"))
  ) {
    sendAppShell(response);
    return;
  }

  if (request.method === "GET" && urlPath === "/app.html") {
    sendRedirect(response, "/app");
    return;
  }

  const routePath = urlPath === "/" ? "index.html" : urlPath.replace(/^[/\\]+/, "");
  const safePath = path.normalize(routePath).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = path.join(root, safePath);

  if (!requestedPath.startsWith(root)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  sendFile(response, requestedPath);
});

server.listen(port, () => {
  console.log(`Eduka landing is running on port ${port}`);
});
