const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const studentTelegramBot = require("./telegram-bot");
let bcrypt = null;

try {
  bcrypt = require("bcryptjs");
} catch {
  bcrypt = null;
}

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
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp",
  ".csv": "text/csv; charset=utf-8"
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
  const rawHash = String(storedHash || "");

  if (rawHash.startsWith("$2")) {
    return bcrypt ? bcrypt.compareSync(String(password), rawHash) : false;
  }

  const parts = rawHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const [, salt, expectedHash] = parts;
  const actualHash = crypto.scryptSync(String(password), salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (actualHash.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(actualHash, expectedBuffer);
}

function hashPassword(password) {
  if (bcrypt) {
    return bcrypt.hashSync(String(password), 10);
  }

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
    permissions: row.permissions || [],
    organization: row.organization_id
      ? {
          id: row.organization_id,
          name: row.organization_name,
          subdomain: row.organization_subdomain || row.organization_slug,
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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function validateTenantSubdomain(value) {
  const subdomain = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9-]{3,30}$/.test(subdomain)) return "Subdomain faqat lowercase harf, raqam va hyphen bo'lishi kerak";
  if (reservedSubdomains.has(subdomain)) return "Bu subdomain tizim uchun band qilingan";
  return "";
}

async function requirePlatformAdmin(request, response, permission = "centers.create") {
  const user = await requireSuperPermission(request, response, permission);
  if (!user) return null;
  return user;
}

function platformAdminAuthorized() {
  // Deprecated in v21.5.0: platform admin access must use a real session token,
  // not spoofable x-platform-admin-email headers. Kept only to avoid breaking old imports.
  return false;
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

function splitChatIds(value) {
  return String(value || "")
    .split(",")
    .map((chatId) => chatId.trim())
    .filter(Boolean);
}

function getLandingTelegramConfig(options = {}) {
  const tokenEnv = firstEnvValue(["LANDING_BOT_TOKEN", "TELEGRAM_BOT_TOKEN"]);
  const chatEnv = firstEnvValue(["LANDING_CHAT_ID", "TELEGRAM_CHAT_ID"]);
  const token = tokenEnv.value;
  const rawChatIds = splitChatIds(chatEnv.value);

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

    if (!token) throw new Error("Landing Telegram bot token is not configured");
    throw new Error("Landing Telegram chat id is not configured");
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

function getStudentTelegramConfig(options = {}) {
  const tokenEnv = firstEnvValue(["STUDENT_BOT_TOKEN", "BOT_TOKEN"]);
  const token = tokenEnv.value;

  if (!token) {
    if (options.allowMissing) {
      return {
        tokenPresent: false,
        tokenEnvName: tokenEnv.name,
        token: ""
      };
    }

    throw new Error("Student Telegram bot is not configured");
  }

  return {
    token,
    tokenPresent: true,
    tokenEnvName: tokenEnv.name
  };
}

function getStudentWebAppUrlBase() {
  return String(process.env.STUDENT_WEBAPP_URL || process.env.WEBAPP_URL || "https://eduka.uz/app").trim();
}

function telegramConfiguredLabel(isConfigured) {
  return isConfigured ? "yes" : "no";
}

function logTelegramConfigSummary() {
  const landing = getLandingTelegramConfig({ allowMissing: true });
  const student = getStudentTelegramConfig({ allowMissing: true });
  console.log("Telegram config:");
  console.log(`DATABASE_URL configured: ${Boolean(String(process.env.DATABASE_URL || "").trim())}`);
  console.log(`BASE_DOMAIN: ${String(process.env.BASE_DOMAIN || "eduka.uz").trim()}`);
  console.log(`LANDING_BOT_TOKEN configured: ${landing.tokenPresent}`);
  console.log(`LANDING_CHAT_ID configured: ${landing.chatIdCount > 0}`);
  console.log(`STUDENT_BOT_TOKEN configured: ${student.tokenPresent}`);
  console.log(`STUDENT_WEBAPP_URL configured: ${Boolean(getStudentWebAppUrlBase())}`);
  console.log(`TELEGRAM_WEBHOOK_SECRET configured: ${Boolean(String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim())}`);
}

function safeTelegramErrorMessage(error) {
  const tokens = [
    process.env.LANDING_BOT_TOKEN,
    process.env.STUDENT_BOT_TOKEN,
    process.env.TELEGRAM_BOT_TOKEN,
    process.env.BOT_TOKEN
  ]
    .map((token) => String(token || "").trim())
    .filter(Boolean);
  let message = String(error?.message || error || "Unknown Telegram error");
  for (const token of tokens) {
    message = message.split(token).join("[redacted-token]");
  }
  return message;
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

          const description = parsedBody.description || responseBody || `Telegram returned ${telegramResponse.statusCode}`;
          const error = new Error(description);
          error.telegramDescription = description;
          error.statusCode = telegramResponse.statusCode;
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

          const description = parsedBody.description || `Telegram returned ${telegramResponse.statusCode}`;
          const error = new Error(description);
          error.telegramDescription = description;
          error.statusCode = telegramResponse.statusCode;
          reject(error);
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

function landingMessageFromPayload(payload = {}) {
  const name = String(payload.name || payload.full_name || payload.fullName || "Kiritilmagan").trim();
  const phone = String(payload.phone || payload.tel || "Kiritilmagan").trim();
  const center = String(payload.center || payload.course || payload.service || payload.subject || "Kiritilmagan").trim();
  const note = String(payload.note || payload.comment || payload.message || payload.students || "").trim();

  return [
    "📩 <b>Yangi demo/ariza</b>",
    "",
    `👤 <b>Ism:</b> ${escapeHtml(name)}`,
    `📞 <b>Telefon:</b> ${escapeHtml(phone)}`,
    `🏫 <b>Markaz/Kurs:</b> ${escapeHtml(center)}`,
    `💬 <b>Izoh:</b> ${escapeHtml(note || "-")}`,
    "🌐 <b>Manba:</b> Eduka landing",
    `🕒 <b>Sana:</b> ${new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" })}`
  ].join("\n");
}

async function sendLandingTelegramMessage(payload) {
  const { token, chatIds, tokenEnvName, chatEnvName } = getLandingTelegramConfig();
  let lastError;
  const text = typeof payload === "string" ? payload : landingMessageFromPayload(payload);

  console.log(`Landing Telegram config: token=${tokenEnvName || "missing"}, chat=${chatEnvName || "missing"}, candidates=${chatIds.length}`);

  for (const chatId of chatIds) {
    try {
      return await postTelegramMessage(token, chatId, text);
    } catch (error) {
      lastError = error;
      console.error(`Telegram landing message failed for chat ${chatId}: ${safeTelegramErrorMessage(error)}`);

      if (error.migrateToChatId && !chatIds.includes(error.migrateToChatId)) {
        console.log(`Telegram chat migrated. Retrying with ${error.migrateToChatId}`);

        try {
          return await postTelegramMessage(token, error.migrateToChatId, text);
        } catch (retryError) {
          lastError = retryError;
          console.error(`Telegram landing migrated chat retry failed for ${error.migrateToChatId}: ${safeTelegramErrorMessage(retryError)}`);
        }
      }
    }
  }

  throw lastError || new Error("Telegram landing message failed");
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

    const noCache = [".html", ".js", ".css"].includes(extension);
    const headers = {
      "Content-Type": contentType,
      "Cache-Control": noCache ? "no-store, no-cache, must-revalidate, proxy-revalidate" : "public, max-age=86400",
      "X-Eduka-Version": "22.0.4"
    };
    if (noCache) {
      headers.Pragma = "no-cache";
      headers.Expires = "0";
    }
    response.writeHead(200, headers);
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

function sendCeoLoginShell(response) {
  sendFile(response, path.join(root, "ceo-login.html"));
}

function sendCeoConsoleShell(response) {
  sendFile(response, path.join(root, "ceo-console.html"));
}

function sendStudentAppShell(response) {
  sendFile(response, path.join(root, "student-app.html"));
}

function isPanelHost(request) {
  const host = String(request.headers.host || "").split(":")[0].toLowerCase();
  return ["app.", "crm.", "dashboard.", "panel."].some((prefix) => host.startsWith(prefix));
}

const reservedSubdomains = new Set(["www", "app", "api", "admin", "super", "ceo", "mail", "support", "help", "dashboard", "control", "billing"]);

function tenantSubdomainFromRequest(request, query = new URLSearchParams()) {
  const queryTenant = query.get("tenant");
  if (queryTenant) return String(queryTenant).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  const host = String(request.headers.host || "").split(":")[0].toLowerCase();
  if (!host.endsWith(".eduka.uz")) return "";
  const subdomain = host.split(".")[0];
  return reservedSubdomains.has(subdomain) ? "" : subdomain;
}

function hostKind(request) {
  const host = String(request.headers.host || "").split(":")[0].toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1" || host === "eduka.uz" || host === "www.eduka.uz") return "landing";
  if (host === "admin.eduka.uz" || host.startsWith("admin.")) return "admin";
  if (host === "app.eduka.uz" || ["app.", "crm.", "dashboard.", "panel."].some((prefix) => host.startsWith(prefix))) return "app";
  if (tenantSubdomainFromRequest(request)) return "tenant";
  return "landing";
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
       u.permissions,
       o.name AS organization_name,
       o.slug AS organization_slug,
       COALESCE(o.subdomain, o.slug) AS organization_subdomain,
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
       u.permissions,
       o.name AS organization_name,
       o.slug AS organization_slug,
       COALESCE(o.subdomain, o.slug) AS organization_subdomain,
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
         o.slug AS organization_slug,
         COALESCE(o.subdomain, o.slug) AS organization_subdomain,
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

async function handleTenantResolveRequest(request, response, subdomain) {
  try {
    const tenantSubdomain = String(subdomain || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!tenantSubdomain || reservedSubdomains.has(tenantSubdomain)) {
      sendJson(response, 404, { ok: false, message: "Tenant topilmadi" });
      return;
    }
    const pool = getDbPool();
    await ensureSchema(pool);
    const result = await pool.query(
      `SELECT id,
              name,
              COALESCE(subdomain, slug) AS subdomain,
              owner_name AS owner,
              phone,
              email,
              status,
              plan,
              monthly_payment
       FROM organizations
       WHERE lower(COALESCE(subdomain, slug))=lower($1)
       LIMIT 1`,
      [tenantSubdomain]
    );
    if (!result.rows.length) {
      sendJson(response, 404, { ok: false, message: "Tenant topilmadi" });
      return;
    }
    sendJson(response, 200, { ok: true, center: result.rows[0] });
  } catch (error) {
    const statusCode = ["DATABASE_URL is not configured", "pg dependency is not installed"].includes(error.message) ? 503 : 500;
    sendJson(response, statusCode, { ok: false, message: error.message });
  }
}

async function handleAdminCenterCreateRequest(request, response) {
  let client;
  try {
    const platformUser = await requirePlatformAdmin(request, response, "centers.create");
    if (!platformUser) return;

    const body = await readJsonBody(request);
    const name = asText(body.name);
    const subdomain = asText(body.subdomain).toLowerCase();
    const owner = asText(body.owner || body.ownerName);
    const phone = asText(body.phone);
    const email = asText(body.email).toLowerCase();
    const plan = asText(body.plan, "Start");
    const status = asText(body.status, "active");
    const trialDays = Math.max(0, Number(body.trialDays || body.trial_days || 7));
    const password = String(body.adminPassword || body.password || "12345678");
    const createAdmin = body.createAdmin !== false && body.createAdmin !== "false";
    const subdomainError = validateTenantSubdomain(subdomain);

    if (!name || !owner || !phone || !email || !plan) {
      sendJson(response, 400, { ok: false, message: "Markaz nomi, egasi, telefon, email va tarif kerak" });
      return;
    }
    if (!isValidEmail(email)) {
      sendJson(response, 400, { ok: false, message: "Email format noto'g'ri" });
      return;
    }
    if (subdomainError) {
      sendJson(response, 400, { ok: false, message: subdomainError });
      return;
    }

    const pool = getDbPool();
    await ensureSchema(pool);
    client = await pool.connect();
    await client.query("BEGIN");

    const duplicate = await client.query("SELECT id FROM organizations WHERE lower(COALESCE(subdomain, slug))=lower($1) LIMIT 1", [subdomain]);
    if (duplicate.rows.length) {
      await client.query("ROLLBACK");
      sendJson(response, 409, { ok: false, message: "Bu subdomain band" });
      return;
    }

    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    const centerResult = await client.query(
      `INSERT INTO organizations
        (name, slug, subdomain, owner_name, email, phone, address, plan, monthly_payment, status, subscription_status, trial_ends_at, license_expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'trial',$11,$11)
       RETURNING id, name, COALESCE(subdomain, slug) AS subdomain, owner_name AS owner, email, phone, address, plan, monthly_payment, status, subscription_status, trial_ends_at, license_expires_at, created_at`,
      [name, subdomain, subdomain, owner, email, phone, asText(body.address), plan, asNumber(body.monthlyPayment || body.monthly_payment), status, trialEndsAt]
    );
    const center = centerResult.rows[0];
    let adminUser = null;

    if (createAdmin) {
      const userResult = await client.query(
        `INSERT INTO users (organization_id, full_name, email, phone, normalized_phone, role, password_hash, is_active)
         VALUES ($1,$2,$3,$4,$5,'center_admin',$6,TRUE)
         ON CONFLICT (email) DO UPDATE
           SET organization_id=EXCLUDED.organization_id,
               full_name=EXCLUDED.full_name,
               phone=EXCLUDED.phone,
               normalized_phone=EXCLUDED.normalized_phone,
               role='center_admin',
               password_hash=EXCLUDED.password_hash,
               is_active=TRUE,
               updated_at=NOW()
         RETURNING id, full_name, email, phone, role, organization_id`,
        [center.id, owner, email, phone, `tenant-${subdomain}`, hashPassword(password)]
      );
      adminUser = userResult.rows[0];
    }

    await client.query(
      "INSERT INTO audit_logs (organization_id, user_id, action, entity, entity_id, payload) VALUES ($1, NULL, $2, $3, $4, $5)",
      [center.id, "center created", "center", center.id, JSON.stringify({ subdomain, adminEmail: createAdmin ? email : null })]
    );

    await client.query("COMMIT");
    sendJson(response, 201, { ok: true, center, adminUser, password: createAdmin ? password : null, loginLink: `https://${subdomain}.eduka.uz` });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {}
    }
    withError(response, "Admin center create", error);
  } finally {
    if (client) client.release();
  }
}

async function handleTenantLoginRequest(request, response) {
  try {
    if (!checkLoginRateLimit(request)) {
      sendJson(response, 429, { ok: false, message: "Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring" });
      return;
    }

    const body = await readJsonBody(request);
    const email = asText(body.email).toLowerCase();
    const password = String(body.password || "");
    const subdomain = asText(body.subdomain || tenantSubdomainFromRequest(request)).toLowerCase();
    const subdomainError = validateTenantSubdomain(subdomain);

    if (!email || !password || subdomainError) {
      sendJson(response, 400, { ok: false, message: "Email, parol va markaz subdomaini kerak" });
      return;
    }

    const pool = getDbPool();
    await ensureSchema(pool);
    const centerResult = await pool.query(
      "SELECT id, name, COALESCE(subdomain, slug) AS subdomain, status FROM organizations WHERE lower(COALESCE(subdomain, slug))=lower($1) LIMIT 1",
      [subdomain]
    );
    const center = centerResult.rows[0];
    if (!center) {
      sendJson(response, 404, { ok: false, message: "Bu o'quv markaz topilmadi" });
      return;
    }

    const userResult = await pool.query(
      `SELECT id, full_name, email, phone, role, password_hash, organization_id, is_active
       FROM users
       WHERE LOWER(COALESCE(email, ''))=$1
       LIMIT 1`,
      [email]
    );
    const user = userResult.rows[0];

    if (user && String(user.organization_id) !== String(center.id)) {
      await pool.query(
        "INSERT INTO audit_logs (organization_id, user_id, action, entity, entity_id, payload) VALUES ($1, NULL, $2, $3, $4, $5)",
        [center.id, "tenant login failed", "center", center.id, JSON.stringify({ email, reason: "wrong_center" })]
      );
      sendJson(response, 403, { ok: false, message: "Bu login ushbu markazga tegishli emas" });
      return;
    }

    if (!user || !user.is_active || !verifyPassword(password, user.password_hash)) {
      await pool.query(
        "INSERT INTO audit_logs (organization_id, user_id, action, entity, entity_id, payload) VALUES ($1, NULL, $2, $3, $4, $5)",
        [center.id, "tenant login failed", "center", center.id, JSON.stringify({ email, reason: "invalid_credentials" })]
      );
      sendJson(response, 401, { ok: false, message: "Email yoki parol noto'g'ri" });
      return;
    }

    if (center.status === "blocked") {
      sendJson(response, 403, { ok: false, message: "Markaz bloklangan. Support bilan bog'laning." });
      return;
    }

    await pool.query(
      "INSERT INTO audit_logs (organization_id, user_id, action, entity, entity_id, payload) VALUES ($1, $2, $3, $4, $5, $6)",
      [center.id, user.id, "tenant login success", "center", center.id, JSON.stringify({ email })]
    );

    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000);
    await pool.query("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)", [user.id, hashToken(token), expiresAt]);

    const sessionUser = await loadUserById(pool, user.id);
    sendJsonWithHeaders(response, 200, { ok: true, user: publicUser(sessionUser), center }, { "Set-Cookie": buildSessionCookie(token) });
  } catch (error) {
    withError(response, "Tenant login", error);
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
  sendJson(response, 410, { ok: false, message: "Demo login Eduka 19.7 da butunlay o'chirilgan. Super Admin orqali haqiqiy markaz va admin yarating." });
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
      if (body.skip) {
        await pool.query(
          "UPDATE organizations SET setup_completed_at=COALESCE(setup_completed_at, NOW()), updated_at=NOW() WHERE id=$1",
          [user.organization_id]
        );
        await writeAudit(pool, user, "skip", "onboarding", user.organization_id, { skipped: true });
        await pool.query("COMMIT");
        const fresh = await loadUserById(pool, user.id);
        sendJson(response, 200, { ok: true, skipped: true, user: publicUser(fresh) });
        return;
      }

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
  if (!["super_admin", "platform_owner", "platform_admin", "support_manager", "sales_manager", "finance_manager", "technical_manager"].includes(role)) {
    sendJson(response, 403, { ok: false, message: "Bu sahifa faqat platforma egasi uchun" });
    return null;
  }
  return user;
}

function superAdminPermissionsForRole(role) {
  const map = {
    super_admin: ["*"],
    platform_admin: ["centers.view", "centers.create", "centers.manage", "plans.manage", "billing.view", "billing.manage", "support.manage", "admins.manage", "audit.view"],
    platform_owner: ["*"],
    support_manager: ["centers.view", "support.manage", "audit.view"],
    sales_manager: ["centers.view", "centers.create", "plans.manage"],
    finance_manager: ["centers.view", "billing.view", "billing.manage", "audit.view"],
    technical_manager: ["centers.view", "domains.manage", "support.manage", "audit.view"]
  };
  return map[String(role || "").toLowerCase()] || [];
}

function hasSuperPermission(user, permission) {
  const base = superAdminPermissionsForRole(user?.role);
  const extra = Array.isArray(user?.permissions) ? user.permissions : [];
  const permissions = [...base, ...extra];
  return permissions.includes("*") || permissions.includes(permission);
}

async function requireSuperPermission(request, response, permission) {
  const user = await requireSuperUser(request, response);
  if (!user) return null;
  if (!hasSuperPermission(user, permission)) {
    sendJson(response, 403, { ok: false, message: "Bu platforma amali uchun ruxsat yo'q" });
    return null;
  }
  return user;
}

function generateTemporaryPassword(prefix = "Eduka") {
  return `${prefix}-${crypto.randomInt(10000, 99999)}`;
}

async function seedOrganizationRolesAndPermissions(client, organizationId) {
  const roleMap = {
    Owner: ["*"],
    Admin: ["students.view","students.create","students.update","groups.view","groups.create","teachers.view","teachers.create","payments.view","payments.create","attendance.view","attendance.manage","reports.view","settings.manage","users.manage","leads.view","leads.manage"],
    Manager: ["students.view","students.create","students.update","groups.view","teachers.view","payments.view","attendance.view","leads.view","leads.manage","reports.view"],
    Operator: ["students.view","students.create","leads.view","leads.manage"],
    Teacher: ["students.view","groups.view","attendance.view","attendance.manage","homeworks.manage"],
    Accountant: ["students.view","payments.view","payments.create","reports.view"],
    Student: ["student.app"],
    Parent: ["parent.app"]
  };
  for (const [roleName, permissions] of Object.entries(roleMap)) {
    const roleResult = await client.query(
      `INSERT INTO organization_roles (organization_id, name, is_system)
       VALUES ($1,$2,TRUE)
       ON CONFLICT (organization_id, name) DO UPDATE SET is_system=TRUE
       RETURNING id`,
      [organizationId, roleName]
    );
    const roleId = roleResult.rows[0].id;
    for (const permission of permissions) {
      await client.query(
        `INSERT INTO organization_permissions (organization_id, role_id, permission_key, enabled)
         VALUES ($1,$2,$3,TRUE)
         ON CONFLICT (role_id, permission_key) DO UPDATE SET enabled=TRUE`,
        [organizationId, roleId, permission]
      );
    }
  }
}

async function checkPlanLimit(pool, organizationId, limitName, tableName) {
  const limitColumn = `${limitName}_limit`;
  const org = (await pool.query(`SELECT ${limitColumn} AS max_count FROM organizations WHERE id=$1`, [organizationId])).rows[0];
  const maxCount = Number(org?.max_count || 0);
  if (!maxCount) return { ok: true };
  const count = Number((await pool.query(`SELECT COUNT(*)::int AS count FROM ${tableName} WHERE organization_id=$1`, [organizationId])).rows[0]?.count || 0);
  return count < maxCount ? { ok: true } : { ok: false, count, maxCount };
}

async function ensureFeature(pool, organizationId, featureKey) {
  const result = await pool.query(
    `SELECT enabled FROM organization_feature_flags WHERE organization_id=$1 AND feature_key=$2 LIMIT 1`,
    [organizationId, featureKey]
  );
  if (!result.rows.length) return true;
  return result.rows[0].enabled !== false;
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


function receiptSettingsDefaults(settings = {}) {
  const receipt = settings.receipt || {};
  return {
    enabled: receipt.enabled !== false,
    auto_print: receipt.auto_print !== false,
    center_name: receipt.center_name || settings.center_name || "EDUKA",
    address: receipt.address || "",
    phone: receipt.phone || "",
    prefix: receipt.prefix || "CHK",
    footer: receipt.footer || "TO'LOVINGIZ UCHUN RAHMAT",
    paper: receipt.paper || "80mm",
    show_qr: receipt.show_qr !== false,
    bot_username: receipt.bot_username || process.env.STUDENT_BOT_USERNAME || "edukauz_bot"
  };
}

async function getOrganizationSettings(pool, organizationId) {
  const result = await pool.query("SELECT settings FROM organization_settings WHERE organization_id=$1", [organizationId]);
  return result.rows[0]?.settings || {};
}

async function ensureDefaultPaymentTypes(pool, organizationId) {
  const defaults = ["Naqd pul", "Plastik karta", "Bank hisobi", "Click", "Payme", "Uzum"];
  for (const name of defaults) {
    await pool.query(
      `INSERT INTO payment_types (organization_id, name, type, active)
       VALUES ($1,$2,'Markaz',TRUE)
       ON CONFLICT DO NOTHING`,
      [organizationId, name]
    );
  }
}

async function createNotification(pool, user, title, body, type = "info") {
  try {
    await pool.query(
      `INSERT INTO notifications (organization_id, user_id, title, body, type)
       VALUES ($1,$2,$3,$4,$5)`,
      [user.organization_id, user.id || null, title, body, type]
    );
  } catch (error) {
    console.warn("Notification skipped:", error.message);
  }
}


async function handleStudentDirectPasswordRequest(request, response, studentId) {
  try {
    const user = await requireUser(request, response, "students:write");
    if (!user) return;
    const body = await readJsonBody(request);
    const password = String(body.password || body.app_password || "8888").trim();
    if (password.length < 4) return sendJson(response, 400, { ok: false, message: "Parol kamida 4 belgi bo'lishi kerak" });
    const pool = getDbPool();
    const result = await pool.query(
      `UPDATE students SET student_app_enabled=TRUE, student_app_blocked=FALSE, app_password_hash=$3, app_password_set_at=NOW(), app_password_reset_required=FALSE
       WHERE id=$1 AND organization_id=$2 RETURNING id, full_name, phone`,
      [studentId, user.organization_id, hashPassword(password)]
    );
    if (!result.rows[0]) return sendJson(response, 404, { ok: false, message: "Talaba topilmadi" });
    await createNotification(pool, user, "Student App parol yaratildi", `${result.rows[0].full_name} uchun Student App paroli yangilandi`, "success");
    await writeAudit(pool, user, "update", "student_app_password", studentId, { student_id: studentId });
    sendJson(response, 200, { ok: true, password, item: result.rows[0] });
  } catch (error) {
    withError(response, "Student App password", error);
  }
}

async function handleNotificationsRequest(request, response) {
  try {
    const user = await requireUser(request, response, request.method === "PUT" ? "read" : "read");
    if (!user) return;
    const pool = getDbPool();
    if (request.method === "GET") {
      const result = await pool.query(
        `SELECT id, title, body, type, is_read, created_at
         FROM notifications
         WHERE organization_id=$1 AND (user_id IS NULL OR user_id=$2 OR $3::text IN ('super_admin','owner','admin','ceo','center_admin'))
         ORDER BY is_read ASC, created_at DESC
         LIMIT 50`,
        [user.organization_id, user.id || null, String(user.role || '').toLowerCase()]
      );
      const unread = result.rows.filter((item) => !item.is_read).length;
      sendJson(response, 200, { ok: true, items: result.rows, unread });
      return;
    }
    const body = await readJsonBody(request).catch(() => ({}));
    if (body.id) {
      await pool.query("UPDATE notifications SET is_read=TRUE WHERE id=$1 AND organization_id=$2", [body.id, user.organization_id]);
    } else {
      await pool.query("UPDATE notifications SET is_read=TRUE WHERE organization_id=$1 AND (user_id IS NULL OR user_id=$2)", [user.organization_id, user.id || null]);
    }
    sendJson(response, 200, { ok: true });
  } catch (error) {
    withError(response, "Notifications", error);
  }
}


async function handleWorkflowReadinessRequest(request, response) {
  try {
    const user = await requireUser(request, response, "read");
    if (!user) return;
    const pool = getDbPool();
    const checks = await Promise.allSettled([
      pool.query("SELECT COUNT(*)::int AS count FROM students WHERE organization_id=$1", [user.organization_id]),
      pool.query("SELECT COUNT(*)::int AS count FROM groups WHERE organization_id=$1", [user.organization_id]),
      pool.query("SELECT COUNT(*)::int AS count FROM teachers WHERE organization_id=$1", [user.organization_id]),
      pool.query("SELECT COUNT(*)::int AS count FROM payment_types WHERE organization_id=$1", [user.organization_id]),
      pool.query("SELECT COUNT(*)::int AS count FROM notifications WHERE organization_id=$1", [user.organization_id]),
      pool.query("SELECT COUNT(*)::int AS count FROM payments WHERE organization_id=$1 AND receipt_no IS NOT NULL", [user.organization_id])
    ]);
    const value = (index) => checks[index].status === "fulfilled" ? Number(checks[index].value.rows[0]?.count || 0) : 0;
    sendJson(response, 200, { ok: true, workflow: {
      students: value(0), groups: value(1), teachers: value(2), payment_types: value(3), notifications: value(4), receipts: value(5),
      status: "ready",
      version: "21.2"
    }});
  } catch (error) {
    withError(response, "Workflow readiness", error);
  }
}

async function handleReceiptSettingsRequest(request, response) {
  try {
    const user = await requireUser(request, response, request.method === "PUT" ? "settings:write" : "read");
    if (!user) return;
    const pool = getDbPool();
    const settings = await getOrganizationSettings(pool, user.organization_id);
    if (request.method === "GET") {
      sendJson(response, 200, { ok: true, settings: receiptSettingsDefaults(settings) });
      return;
    }
    const body = await readJsonBody(request);
    const current = receiptSettingsDefaults(settings);
    const next = { ...current, ...body };
    const merged = { ...settings, receipt: next };
    await pool.query(
      `INSERT INTO organization_settings (organization_id, settings, updated_at)
       VALUES ($1,$2::jsonb,NOW())
       ON CONFLICT (organization_id) DO UPDATE SET settings=EXCLUDED.settings, updated_at=NOW()`,
      [user.organization_id, JSON.stringify(merged)]
    );
    await writeAudit(pool, user, "update", "receipt_settings", user.organization_id, next);
    sendJson(response, 200, { ok: true, settings: next });
  } catch (error) {
    withError(response, "Receipt settings", error);
  }
}

async function handlePaymentReceiptRequest(request, response, paymentId) {
  try {
    const user = await requireUser(request, response, "read");
    if (!user) return;
    const pool = getDbPool();
    const query = requestQuery(request);
    const markPrinted = query.get("mark") === "1" || request.method === "POST";
    if (markPrinted) {
      await pool.query("UPDATE payments SET receipt_printed_at=NOW(), receipt_status='printed' WHERE id=$1 AND organization_id=$2", [paymentId, user.organization_id]);
    }
    const result = await pool.query(
      `SELECT p.*, s.full_name AS student_name, s.phone AS student_phone, s.balance AS student_balance,
              g.name AS group_name, g.course_name, g.monthly_price AS group_monthly_price, g.room AS group_room,
              u.full_name AS cashier_name,
              o.name AS organization_name, o.phone AS organization_phone, o.address AS organization_address, o.logo_url AS organization_logo_url,
              ob.logo_url AS branding_logo_url,
              COALESCE(b.name, o.name) AS branch_name,
              GREATEST(COALESCE(p.due_amount, 0) - COALESCE(p.amount, 0) - COALESCE(p.discount, 0), 0)::numeric AS current_balance
       FROM payments p
       LEFT JOIN students s ON s.id=p.student_id
       LEFT JOIN groups g ON g.id=p.group_id
       LEFT JOIN users u ON u.id=p.created_by
       LEFT JOIN organizations o ON o.id=p.organization_id
       LEFT JOIN organization_branding ob ON ob.organization_id=o.id
       LEFT JOIN branches b ON b.id=s.branch_id
       WHERE p.id=$1 AND p.organization_id=$2`,
      [paymentId, user.organization_id]
    );
    if (!result.rows[0]) return sendJson(response, 404, { ok: false, message: "To'lov topilmadi" });
    const settings = receiptSettingsDefaults(await getOrganizationSettings(pool, user.organization_id));
    const payment = result.rows[0];
    if (!payment.receipt_no) {
      const receiptNo = `${settings.prefix}-${String(payment.id).padStart(6, "0")}`;
      const upd = await pool.query("UPDATE payments SET receipt_no=$3 WHERE id=$1 AND organization_id=$2 RETURNING receipt_no", [paymentId, user.organization_id, receiptNo]);
      payment.receipt_no = upd.rows[0]?.receipt_no || receiptNo;
    }
    const botUsername = settings.bot_username || "edukauz_bot";
    payment.telegram_deep_link = `https://t.me/${botUsername}?start=receipt_${encodeURIComponent(payment.receipt_no)}`;
    payment.qr_code_value = payment.telegram_deep_link;
    payment.course_amount = payment.due_amount || payment.group_monthly_price || payment.amount || 0;
    payment.current_balance = payment.current_balance ?? Math.max(Number(payment.due_amount || 0) - Number(payment.amount || 0) - Number(payment.discount || 0), 0);
    sendJson(response, 200, { ok: true, receipt: { settings, payment, printed_at: markPrinted ? new Date().toISOString() : payment.receipt_printed_at } });
  } catch (error) {
    withError(response, "Payment receipt", error);
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



async function saasDefaultFeatureFlags(planName = "Start") {
  const defaults = {
    Start: { students: true, groups: true, teachers: true, finance: true, attendance: true, leads: false, student_app: false, parent_app: false, sms: false, telegram: false, custom_domain: false, advanced_reports: false, multi_branch: false, teacher_salary: false, import_export: false, api_access: false, white_label: false, role_permission: false },
    Growth: { students: true, groups: true, teachers: true, finance: true, attendance: true, leads: true, student_app: true, parent_app: false, sms: false, telegram: true, custom_domain: false, advanced_reports: true, multi_branch: true, teacher_salary: true, import_export: true, api_access: false, white_label: false, role_permission: false },
    Pro: { students: true, groups: true, teachers: true, finance: true, attendance: true, leads: true, student_app: true, parent_app: true, sms: true, telegram: true, custom_domain: true, advanced_reports: true, multi_branch: true, teacher_salary: true, import_export: true, api_access: true, white_label: false, role_permission: true },
    Enterprise: { students: true, groups: true, teachers: true, finance: true, attendance: true, leads: true, student_app: true, parent_app: true, sms: true, telegram: true, custom_domain: true, advanced_reports: true, multi_branch: true, teacher_salary: true, import_export: true, api_access: true, white_label: true, role_permission: true }
  };
  return defaults[planName] || defaults.Start;
}

async function applyPlanFeatures(client, organizationId, tariffRow) {
  const planName = tariffRow?.name || "Start";
  const flags = tariffRow?.feature_flags || await saasDefaultFeatureFlags(planName);
  const featureEntries = Object.entries(flags || {});
  for (const [featureKey, enabled] of featureEntries) {
    await client.query(
      `INSERT INTO organization_feature_flags (organization_id, feature_key, enabled, source, updated_at)
       VALUES ($1,$2,$3,'plan',NOW())
       ON CONFLICT (organization_id, feature_key) DO UPDATE SET enabled=EXCLUDED.enabled, source='plan', updated_at=NOW()`,
      [organizationId, featureKey, Boolean(enabled)]
    );
  }
  await client.query(
    `UPDATE organizations SET plan=$2, monthly_payment=$3, student_limit=$4, teacher_limit=$5, branch_limit=$6, sms_limit=$7, storage_limit_mb=$8, updated_at=NOW()
     WHERE id=$1`,
    [organizationId, planName, asNumber(tariffRow?.monthly_price), asNumber(tariffRow?.student_limit, 100), asNumber(tariffRow?.teacher_limit, 5), asNumber(tariffRow?.branch_limit, 1), asNumber(tariffRow?.sms_limit), asNumber(tariffRow?.storage_limit_mb, 1024)]
  );
}

async function handleSuperDashboardRequest(request, response) {
  try {
    const user = await requireSuperUser(request, response);
    if (!user) return;
    const pool = getDbPool();
    const summary = await pool.query(`SELECT
      (SELECT COUNT(*)::int FROM organizations WHERE archived_at IS NULL) AS centers,
      (SELECT COUNT(*)::int FROM organizations WHERE status='active' AND archived_at IS NULL) AS active_centers,
      (SELECT COUNT(*)::int FROM organizations WHERE subscription_status='trial' AND archived_at IS NULL) AS trial_centers,
      (SELECT COUNT(*)::int FROM organizations WHERE subscription_status IN ('overdue','expired') AND archived_at IS NULL) AS overdue_centers,
      (SELECT COUNT(*)::int FROM organizations WHERE status='blocked' AND archived_at IS NULL) AS blocked_centers,
      (SELECT COUNT(*)::int FROM organizations WHERE created_at::date=CURRENT_DATE) AS new_today,
      COALESCE((SELECT SUM(monthly_payment) FROM organizations WHERE status='active' AND archived_at IS NULL),0)::numeric AS mrr,
      COALESCE((SELECT SUM(amount) FROM subscription_payments WHERE paid_at >= date_trunc('month', NOW()) AND status='paid'),0)::numeric AS monthly_revenue,
      COALESCE((SELECT SUM(amount) FROM subscription_invoices WHERE status IN ('unpaid','overdue')),0)::numeric AS expected_revenue,
      (SELECT COUNT(*)::int FROM support_tickets WHERE status IN ('open','in_progress')) AS open_support_tickets`);
    const charts = await pool.query(`WITH months AS (
        SELECT generate_series(date_trunc('month', NOW()) - interval '5 months', date_trunc('month', NOW()), interval '1 month') AS month
      )
      SELECT to_char(m.month, 'YYYY-MM') AS month,
        COALESCE((SELECT SUM(amount) FROM subscription_payments p WHERE date_trunc('month', p.paid_at)=m.month),0)::numeric AS revenue,
        (SELECT COUNT(*)::int FROM organizations o WHERE date_trunc('month', o.created_at)=m.month) AS new_centers
      FROM months m ORDER BY m.month`);
    const active = await pool.query(`SELECT o.id, o.name, COALESCE(o.subdomain,o.slug) AS subdomain, o.plan, o.status, o.subscription_status,
      (SELECT COUNT(*)::int FROM students WHERE organization_id=o.id) AS students_count,
      (SELECT COUNT(*)::int FROM audit_logs WHERE organization_id=o.id AND created_at > NOW() - interval '7 days') AS activity_count
      FROM organizations o WHERE archived_at IS NULL ORDER BY activity_count DESC, students_count DESC LIMIT 10`);
    sendJson(response, 200, { ok: true, summary: summary.rows[0], charts: charts.rows, activeCenters: active.rows, api: { status: 'healthy', version: '22.0.4', demoMode: false } });
  } catch (error) { withError(response, "Super dashboard", error); }
}

async function handleSuperPlansRequest(request, response, planId = null) {
  try {
    const user = await requireSuperUser(request, response); if (!user) return;
    const pool = getDbPool();
    if (["POST","PUT"].includes(request.method)) {
      const body = await readJsonBody(request);
      const flags = body.feature_flags || body.features || await saasDefaultFeatureFlags(asText(body.name, "Start"));
      if (request.method === "POST") {
        const result = await pool.query(`INSERT INTO tariffs (name, monthly_price, billing_period, student_limit, teacher_limit, branch_limit, group_limit, sms_limit, storage_limit_mb, feature_flags, support_level, is_active)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12) RETURNING *`,
          [asText(body.name), asNumber(body.monthly_price || body.price), asText(body.billing_period, "monthly"), asNumber(body.student_limit, 100), asNumber(body.teacher_limit, 5), asNumber(body.branch_limit, 1), asNumber(body.group_limit, 10), asNumber(body.sms_limit), asNumber(body.storage_limit_mb, 1024), JSON.stringify(flags), asText(body.support_level, "standard"), body.is_active !== false]);
        await writeAudit(pool, user, "create", "tariff", result.rows[0].id, body);
        sendJson(response, 201, { ok: true, item: result.rows[0] }); return;
      }
      const result = await pool.query(`UPDATE tariffs SET name=COALESCE(NULLIF($2,''), name), monthly_price=$3, billing_period=$4, student_limit=$5, teacher_limit=$6, branch_limit=$7, group_limit=$8, sms_limit=$9, storage_limit_mb=$10, feature_flags=$11::jsonb, support_level=$12, is_active=$13, updated_at=NOW() WHERE id=$1 RETURNING *`,
        [planId, asText(body.name), asNumber(body.monthly_price || body.price), asText(body.billing_period, "monthly"), asNumber(body.student_limit, 100), asNumber(body.teacher_limit, 5), asNumber(body.branch_limit, 1), asNumber(body.group_limit, 10), asNumber(body.sms_limit), asNumber(body.storage_limit_mb, 1024), JSON.stringify(flags), asText(body.support_level, "standard"), body.is_active !== false]);
      await writeAudit(pool, user, "update", "tariff", planId, body);
      sendJson(response, 200, { ok: true, item: result.rows[0] }); return;
    }
    const result = await pool.query(`SELECT * FROM tariffs ORDER BY monthly_price ASC, id ASC`);
    sendJson(response, 200, { ok: true, items: result.rows });
  } catch (error) { withError(response, "Super plans", error); }
}

async function handleSuperCenterWizardRequest(request, response) {
  let client;
  try {
    const user = await requireSuperPermission(request, response, 'centers.create'); if (!user) return;
    const body = await readJsonBody(request);
    const name = asText(body.name || body.center_name);
    const officialName = asText(body.official_name || body.officialName || name);
    const subdomain = asText(body.subdomain || body.slug).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
    const adminName = asText(body.admin_name || body.adminName || body.owner || body.owner_name);
    const adminEmail = asText(body.admin_email || body.adminEmail || body.email).toLowerCase();
    const adminPhone = asText(body.admin_phone || body.adminPhone || body.phone);
    const planName = asText(body.plan || body.tariff || "Start");
    const trialDays = Math.max(0, asNumber(body.trial_days || body.trialDays, 14));
    const password = body.auto_generate_password !== false ? generateTemporaryPassword() : asText(body.password || body.temporary_password, generateTemporaryPassword());
    const err = validateTenantSubdomain(subdomain);
    if (!name || !adminName || !isValidEmail(adminEmail) || !adminPhone || err) { sendJson(response, 400, { ok:false, message: err || "Markaz, admin email/telefon va subdomain kerak" }); return; }
    const pool = getDbPool(); await ensureSchema(pool); client = await pool.connect(); await client.query("BEGIN");
    const tariff = (await client.query("SELECT * FROM tariffs WHERE LOWER(name)=LOWER($1) LIMIT 1", [planName])).rows[0] || (await client.query("SELECT * FROM tariffs WHERE name='Start' LIMIT 1")).rows[0];
    const duplicate = await client.query("SELECT id FROM organizations WHERE lower(COALESCE(subdomain, slug))=lower($1) OR ($2<>'' AND lower(COALESCE(custom_domain,''))=lower($2)) LIMIT 1", [subdomain, asText(body.custom_domain).toLowerCase()]);
    if (duplicate.rows.length) { await client.query("ROLLBACK"); sendJson(response, 409, { ok:false, message:"Subdomain yoki domain band" }); return; }
    const trialEnds = new Date(Date.now() + trialDays*86400000);
    const org = (await client.query(`INSERT INTO organizations (name, slug, subdomain, owner_name, email, phone, address, logo_url, brand_color, custom_domain, billing_email, plan, monthly_payment, status, subscription_status, trial_ends_at, license_expires_at, student_limit, teacher_limit, branch_limit, sms_limit, storage_limit_mb)
      VALUES ($1,$2,$2,$3,$4,$5,$6,$7,$8,$9,$4,$10,$11,'active','trial',$12,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [name, subdomain, adminName, adminEmail, adminPhone, asText(body.address), asText(body.logo_url), asText(body.brand_color, "#0A84FF"), asText(body.custom_domain), tariff?.name || planName, asNumber(tariff?.monthly_price), trialEnds, asNumber(tariff?.student_limit,100), asNumber(tariff?.teacher_limit,5), asNumber(tariff?.branch_limit,1), asNumber(tariff?.sms_limit), asNumber(tariff?.storage_limit_mb,1024)])).rows[0];
    await client.query(`INSERT INTO users (organization_id, full_name, email, phone, normalized_phone, role, password_hash, is_active) VALUES ($1,$2,$3,$4,$5,'center_admin',$6,TRUE) RETURNING id`, [org.id, adminName, adminEmail, adminPhone, `tenant-${subdomain}-${crypto.randomInt(100000,999999)}`, hashPassword(password)]);
    const sub = (await client.query(`INSERT INTO subscriptions (organization_id, tariff_id, status, starts_at, ends_at, current_period_start, current_period_end, monthly_price, auto_renew, payment_status, next_payment_date) VALUES ($1,$2,'trial',NOW(),$3,NOW(),$3,$4,TRUE,'pending',$3) RETURNING *`, [org.id, tariff?.id || null, trialEnds, asNumber(tariff?.monthly_price)])).rows[0];
    await client.query(`INSERT INTO organization_domains (organization_id, domain, type, verification_status, ssl_status, is_primary) VALUES ($1,$2,'subdomain','verified','active',TRUE)`, [org.id, `${subdomain}.eduka.uz`]);
    if (asText(body.custom_domain)) await client.query(`INSERT INTO organization_domains (organization_id, domain, type, verification_status, ssl_status, is_primary) VALUES ($1,$2,'custom','pending_dns','pending',FALSE)`, [org.id, asText(body.custom_domain)]);
    await client.query(`INSERT INTO organization_branding (organization_id, logo_url, primary_color, student_app_name, white_label_enabled) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (organization_id) DO UPDATE SET logo_url=EXCLUDED.logo_url, primary_color=EXCLUDED.primary_color, student_app_name=EXCLUDED.student_app_name, white_label_enabled=EXCLUDED.white_label_enabled, updated_at=NOW()`, [org.id, asText(body.logo_url), asText(body.brand_color, "#0A84FF"), `${name} Student App`, Boolean(body.white_label_enabled)]);
    await client.query(`INSERT INTO organization_settings (organization_id, settings, updated_at) VALUES ($1,$2::jsonb,NOW()) ON CONFLICT (organization_id) DO UPDATE SET settings=EXCLUDED.settings, updated_at=NOW()`, [org.id, JSON.stringify({ language: 'uz', timezone: 'Asia/Tashkent', student_app_enabled: true, telegram_enabled: Boolean(body.telegram_enabled), sms_enabled: Boolean(body.sms_enabled) })]);
    await applyPlanFeatures(client, org.id, tariff);
    await seedOrganizationRolesAndPermissions(client, org.id);
    if (asNumber(tariff?.monthly_price) > 0) await client.query(`INSERT INTO subscription_invoices (organization_id, subscription_id, invoice_number, amount, status, due_date, note) VALUES ($1,$2,$3,$4,'unpaid',$5,'Auto-created during center wizard')`, [org.id, sub.id, `INV-${org.id}-${Date.now()}`, asNumber(tariff?.monthly_price), trialEnds]);
    await client.query(`INSERT INTO audit_logs (organization_id, user_id, action, entity, entity_id, payload) VALUES ($1,$2,'create_center_wizard','organization',$1,$3)`, [org.id, user.id, JSON.stringify({ plan: tariff?.name || planName, subdomain, custom_domain: body.custom_domain || null })]);
    await client.query("COMMIT");
    sendJson(response, 201, { ok: true, center: org, subscription: sub, login: { url: `https://${subdomain}.eduka.uz`, email: adminEmail, password }, dns: { type: 'CNAME', name: subdomain, value: 'cname.eduka.uz' } });
  } catch (error) { if (client) { try { await client.query("ROLLBACK"); } catch {} } withError(response, "Center wizard", error); } finally { if (client) client.release(); }
}

async function handleSuperCenterAdminResetRequest(request, response, centerId) {
  try {
    const user = await requireSuperUser(request, response); if (!user) return;
    const body = await readJsonBody(request);
    const password = asText(body.password, generateTemporaryPassword());
    const pool = getDbPool();
    const adminRow = await pool.query(`SELECT id FROM users WHERE organization_id=$1 AND role IN ('center_admin','admin','owner') ORDER BY CASE WHEN role='center_admin' THEN 0 WHEN role='owner' THEN 1 ELSE 2 END, id LIMIT 1`, [centerId]);
    const result = adminRow.rows[0]
      ? await pool.query(`UPDATE users SET password_hash=$2, updated_at=NOW() WHERE id=$1 RETURNING id, full_name, email, phone, role`, [adminRow.rows[0].id, hashPassword(password)])
      : { rows: [] };
    await writeAudit(pool, user, "admin_password_reset", "organization", centerId, { user: result.rows[0]?.email });
    sendJson(response, 200, { ok: true, admin: result.rows[0] || null, temporaryPassword: password });
  } catch (error) { withError(response, "Admin reset", error); }
}

async function handleSuperDomainsRequest(request, response, domainId = null) {
  try {
    const user = await requireSuperUser(request, response); if (!user) return;
    const pool = getDbPool();
    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const domain = asText(body.domain).toLowerCase();
      const result = await pool.query(`INSERT INTO organization_domains (organization_id, domain, type, verification_status, ssl_status, is_primary, dns_target) VALUES ($1,$2,$3,'pending_dns','pending',$4,$5) RETURNING *`, [body.organization_id, domain, asText(body.type, "custom"), Boolean(body.is_primary), asText(body.dns_target, "cname.eduka.uz")]);
      await writeAudit(pool, user, "create", "domain", result.rows[0].id, body);
      sendJson(response, 201, { ok: true, item: result.rows[0], dns: { type: 'CNAME', name: domain.split('.')[0], value: 'cname.eduka.uz' } }); return;
    }
    if (request.method === "PUT" && domainId) {
      const body = await readJsonBody(request);
      const result = await pool.query(`UPDATE organization_domains SET verification_status=COALESCE(NULLIF($2,''), verification_status), ssl_status=COALESCE(NULLIF($3,''), ssl_status), is_primary=COALESCE($4, is_primary), last_checked_at=NOW(), updated_at=NOW() WHERE id=$1 RETURNING *`, [domainId, asText(body.verification_status), asText(body.ssl_status), typeof body.is_primary === 'boolean' ? body.is_primary : null]);
      await pool.query(`INSERT INTO domain_verifications (organization_domain_id, check_type, status, details) VALUES ($1,'manual',$2,$3::jsonb)`, [domainId, result.rows[0]?.verification_status || 'pending', JSON.stringify(body)]);
      sendJson(response, 200, { ok: true, item: result.rows[0] }); return;
    }
    const result = await pool.query(`SELECT d.*, o.name AS center_name FROM organization_domains d LEFT JOIN organizations o ON o.id=d.organization_id ORDER BY d.id DESC LIMIT 300`);
    sendJson(response, 200, { ok: true, items: result.rows });
  } catch (error) { withError(response, "Super domains", error); }
}

async function handleSuperInvoicesRequest(request, response, invoiceId = null) {
  try {
    const user = await requireSuperUser(request, response); if (!user) return;
    const pool = getDbPool();
    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const invoiceNumber = asText(body.invoice_number, `EDU-${Date.now()}`);
      const result = await pool.query(`INSERT INTO subscription_invoices (organization_id, subscription_id, invoice_number, amount, status, due_date, note) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [body.organization_id, body.subscription_id || null, invoiceNumber, asNumber(body.amount), asText(body.status, 'unpaid'), asDate(body.due_date), asText(body.note)]);
      await writeAudit(pool, user, "create", "subscription_invoice", result.rows[0].id, body);
      sendJson(response, 201, { ok: true, item: result.rows[0] }); return;
    }
    if (request.method === "PUT" && invoiceId) {
      const body = await readJsonBody(request);
      const result = await pool.query(`UPDATE subscription_invoices SET status=COALESCE(NULLIF($2,''), status), paid_at=COALESCE($3::timestamptz, paid_at), payment_method=COALESCE(NULLIF($4,''), payment_method), note=COALESCE(NULLIF($5,''), note), updated_at=NOW() WHERE id=$1 RETURNING *`, [invoiceId, asText(body.status), asDate(body.paid_at), asText(body.payment_method), asText(body.note)]);
      sendJson(response, 200, { ok: true, item: result.rows[0] }); return;
    }
    const result = await pool.query(`SELECT i.*, o.name AS center_name, t.name AS plan_name FROM subscription_invoices i LEFT JOIN organizations o ON o.id=i.organization_id LEFT JOIN subscriptions s ON s.id=i.subscription_id LEFT JOIN tariffs t ON t.id=s.tariff_id ORDER BY i.id DESC LIMIT 300`);
    sendJson(response, 200, { ok: true, items: result.rows });
  } catch (error) { withError(response, "Super invoices", error); }
}

async function handleSuperAuditRequest(request, response) {
  try {
    const user = await requireSuperUser(request, response); if (!user) return;
    const result = await getDbPool().query(`SELECT a.*, u.full_name AS admin_name, o.name AS center_name FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id LEFT JOIN organizations o ON o.id=a.organization_id ORDER BY a.id DESC LIMIT 500`);
    sendJson(response, 200, { ok: true, items: result.rows });
  } catch (error) { withError(response, "Super audit", error); }
}

async function handleSuperSupportTicketsRequest(request, response, ticketId = null) {
  try {
    const user = await requireSuperUser(request, response); if (!user) return;
    const pool = getDbPool();
    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const result = await pool.query(`INSERT INTO support_tickets (organization_id, subject, category, priority, status, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [body.organization_id || null, asText(body.subject), asText(body.category, 'general'), asText(body.priority, 'normal'), asText(body.status, 'open'), user.id]);
      if (asText(body.message)) await pool.query(`INSERT INTO support_messages (ticket_id, sender_user_id, sender_type, message) VALUES ($1,$2,'admin',$3)`, [result.rows[0].id, user.id, asText(body.message)]);
      sendJson(response, 201, { ok: true, item: result.rows[0] }); return;
    }
    if (request.method === "PUT" && ticketId) {
      const body = await readJsonBody(request);
      const result = await pool.query(`UPDATE support_tickets SET status=COALESCE(NULLIF($2,''), status), priority=COALESCE(NULLIF($3,''), priority), updated_at=NOW() WHERE id=$1 RETURNING *`, [ticketId, asText(body.status), asText(body.priority)]);
      if (asText(body.message)) await pool.query(`INSERT INTO support_messages (ticket_id, sender_user_id, sender_type, message) VALUES ($1,$2,'admin',$3)`, [ticketId, user.id, asText(body.message)]);
      sendJson(response, 200, { ok: true, item: result.rows[0] }); return;
    }
    const result = await pool.query(`SELECT t.*, o.name AS center_name, u.full_name AS assigned_name, (SELECT message FROM support_messages WHERE ticket_id=t.id ORDER BY id DESC LIMIT 1) AS latest_message FROM support_tickets t LEFT JOIN organizations o ON o.id=t.organization_id LEFT JOIN users u ON u.id=t.assigned_to ORDER BY t.updated_at DESC, t.id DESC LIMIT 300`);
    sendJson(response, 200, { ok: true, items: result.rows });
  } catch (error) { withError(response, "Super support tickets", error); }
}



async function handleSuperCenterPlanRequest(request, response, centerId) {
  try {
    const user = await requireSuperPermission(request, response, "centers.manage");
    if (!user) return;
    const body = await readJsonBody(request);
    const planName = asText(body.plan || body.tariff || body.name, "Start");
    const pool = getDbPool();
    await ensureSchema(pool);
    const tariff = (await pool.query("SELECT * FROM tariffs WHERE LOWER(name)=LOWER($1) LIMIT 1", [planName])).rows[0]
      || (await pool.query("SELECT * FROM tariffs ORDER BY monthly_price ASC, id ASC LIMIT 1")).rows[0];
    if (!tariff) {
      sendJson(response, 404, { ok: false, message: "Tarif topilmadi" });
      return;
    }
    await applyPlanFeatures(pool, centerId, tariff);
    await pool.query(
      `UPDATE subscriptions SET tariff_id=$2, monthly_price=$3, status=COALESCE(NULLIF($4,''), status), updated_at=NOW()
       WHERE organization_id=$1`,
      [centerId, tariff.id, asNumber(tariff.monthly_price), asText(body.subscription_status)]
    );
    await writeAudit(pool, user, "change_center_plan", "organization", centerId, { plan: tariff.name });
    const updated = await pool.query("SELECT * FROM organizations WHERE id=$1", [centerId]);
    sendJson(response, 200, { ok: true, item: updated.rows[0], tariff });
  } catch (error) {
    withError(response, "Super center plan", error);
  }
}

async function handleSuperCenterFeaturesRequest(request, response, centerId) {
  try {
    const user = await requireSuperPermission(request, response, "centers.manage");
    if (!user) return;
    const body = await readJsonBody(request);
    const features = body.features || body.feature_flags || {};
    const pool = getDbPool();
    await ensureSchema(pool);
    for (const [featureKey, enabled] of Object.entries(features)) {
      await pool.query(
        `INSERT INTO organization_feature_flags (organization_id, feature_key, enabled, source, updated_at)
         VALUES ($1,$2,$3,'manual',NOW())
         ON CONFLICT (organization_id, feature_key)
         DO UPDATE SET enabled=EXCLUDED.enabled, source='manual', updated_at=NOW()`,
        [centerId, featureKey, Boolean(enabled)]
      );
    }
    await writeAudit(pool, user, "update_center_features", "organization", centerId, features);
    sendJson(response, 200, { ok: true, features });
  } catch (error) {
    withError(response, "Super center features", error);
  }
}

async function handleSuperAdminUsersRequest(request, response, adminUserId = null) {
  try {
    const user = await requireSuperPermission(request, response, "admins.manage");
    if (!user) return;
    const pool = getDbPool();
    await ensureSchema(pool);

    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const email = asText(body.email).toLowerCase();
      const fullName = asText(body.full_name || body.fullName || body.name);
      const phone = asText(body.phone);
      const role = asText(body.role, "support_manager");
      const password = body.auto_generate_password !== false ? generateTemporaryPassword() : asText(body.password, generateTemporaryPassword());
      if (!fullName || !isValidEmail(email)) {
        sendJson(response, 400, { ok: false, message: "Admin ismi va email kerak" });
        return;
      }
      const permissions = superAdminPermissionsForRole(role);
      const result = await pool.query(
        `INSERT INTO users (organization_id, full_name, email, phone, normalized_phone, role, password_hash, is_active, temporary_password, permissions, metadata)
         VALUES (NULL,$1,$2,$3,$4,$5,$6,TRUE,TRUE,$7::jsonb,$8::jsonb)
         ON CONFLICT (email) DO UPDATE SET full_name=EXCLUDED.full_name, phone=EXCLUDED.phone, role=EXCLUDED.role, password_hash=EXCLUDED.password_hash, is_active=TRUE, temporary_password=TRUE, permissions=EXCLUDED.permissions, metadata=EXCLUDED.metadata, updated_at=NOW()
         RETURNING id, full_name, email, phone, role, is_active, temporary_password, permissions, created_at, updated_at`,
        [fullName, email, phone || `admin-${Date.now()}`, normalizePhone(phone) || `admin-${Date.now()}-${crypto.randomInt(1000,9999)}`, role, hashPassword(password), JSON.stringify(permissions), JSON.stringify({ created_by: user.id, scope: 'platform' })]
      );
      await writeAudit(pool, user, "create_admin_user", "user", result.rows[0].id, { email, role });
      sendJson(response, 201, { ok: true, item: result.rows[0], temporaryPassword: password });
      return;
    }

    if (request.method === "PUT" && adminUserId) {
      const body = await readJsonBody(request);
      const permissions = body.permissions || superAdminPermissionsForRole(body.role);
      const result = await pool.query(
        `UPDATE users SET full_name=COALESCE(NULLIF($2,''), full_name), phone=COALESCE(NULLIF($3,''), phone), role=COALESCE(NULLIF($4,''), role), is_active=COALESCE($5, is_active), permissions=COALESCE($6::jsonb, permissions), updated_at=NOW()
         WHERE id=$1 AND organization_id IS NULL RETURNING id, full_name, email, phone, role, is_active, temporary_password, permissions, created_at, updated_at`,
        [adminUserId, asText(body.full_name || body.fullName || body.name), asText(body.phone), asText(body.role), typeof body.is_active === 'boolean' ? body.is_active : null, JSON.stringify(permissions || [])]
      );
      await writeAudit(pool, user, "update_admin_user", "user", adminUserId, body);
      sendJson(response, 200, { ok: true, item: result.rows[0] || null });
      return;
    }

    if (request.method === "DELETE" && adminUserId) {
      if (Number(adminUserId) === Number(user.id)) {
        sendJson(response, 400, { ok: false, message: "O'zingizni bloklay olmaysiz" });
        return;
      }
      const result = await pool.query(
        `UPDATE users SET is_active=FALSE, updated_at=NOW() WHERE id=$1 AND organization_id IS NULL RETURNING id, email, role, is_active`,
        [adminUserId]
      );
      await writeAudit(pool, user, "block_admin_user", "user", adminUserId, {});
      sendJson(response, 200, { ok: true, item: result.rows[0] || null });
      return;
    }

    const result = await pool.query(
      `SELECT id, full_name, email, phone, role, is_active, temporary_password, permissions, last_login_at, created_at, updated_at
       FROM users
       WHERE organization_id IS NULL AND role IN ('super_admin','owner','platform_owner','support_manager','sales_manager','finance_manager','technical_manager')
       ORDER BY id ASC`
    );
    sendJson(response, 200, { ok: true, items: result.rows });
  } catch (error) {
    withError(response, "Super admin users", error);
  }
}

async function handleSuperAdminUserResetRequest(request, response, adminUserId) {
  try {
    const user = await requireSuperPermission(request, response, "admins.manage");
    if (!user) return;
    const body = await readJsonBody(request);
    const password = asText(body.password, generateTemporaryPassword());
    const pool = getDbPool();
    const result = await pool.query(
      `UPDATE users SET password_hash=$2, temporary_password=TRUE, updated_at=NOW()
       WHERE id=$1 AND organization_id IS NULL
       RETURNING id, full_name, email, phone, role, is_active, temporary_password`,
      [adminUserId, hashPassword(password)]
    );
    await writeAudit(pool, user, "reset_admin_user_password", "user", adminUserId, { email: result.rows[0]?.email });
    sendJson(response, 200, { ok: true, item: result.rows[0] || null, temporaryPassword: password });
  } catch (error) {
    withError(response, "Super admin reset", error);
  }
}


async function handleSuperNotificationsRequest(request, response) {
  try {
    const user = await requireSuperUser(request, response); if (!user) return;
    const pool = getDbPool();
    const support = await pool.query(`SELECT 'Support ticket' AS title, subject AS body, priority AS type, updated_at AS created_at FROM support_tickets WHERE status IN ('open','in_progress') ORDER BY updated_at DESC LIMIT 8`);
    const invoices = await pool.query(`SELECT 'To‘lov kutilmoqda' AS title, CONCAT(o.name, ' · ', i.amount::text, ' UZS') AS body, i.status AS type, i.created_at FROM subscription_invoices i LEFT JOIN organizations o ON o.id=i.organization_id WHERE i.status IN ('unpaid','overdue') ORDER BY i.created_at DESC LIMIT 8`);
    const subs = await pool.query(`SELECT 'Obuna muddati tugayapti' AS title, o.name AS body, s.status AS type, s.updated_at AS created_at FROM subscriptions s LEFT JOIN organizations o ON o.id=s.organization_id WHERE s.current_period_end <= NOW() + interval '7 days' ORDER BY s.current_period_end ASC LIMIT 8`);
    sendJson(response, 200, { ok: true, items: [...support.rows, ...invoices.rows, ...subs.rows].slice(0,20) });
  } catch (error) { withError(response, "Super notifications", error); }
}

async function handleSuperCenterImpersonateRequest(request, response, centerId) {
  try {
    const user = await requireSuperPermission(request, response, "centers.manage"); if (!user) return;
    const pool = getDbPool();
    const admin = await pool.query(`SELECT id, email, full_name FROM users WHERE organization_id=$1 AND is_active=TRUE ORDER BY CASE WHEN role IN ('center_admin','owner','admin') THEN 0 ELSE 1 END, id ASC LIMIT 1`, [centerId]);
    if (!admin.rows[0]) { sendJson(response, 404, { ok: false, message: "Markaz admini topilmadi" }); return; }
    await writeAudit(pool, user, "impersonate_center", "organization", centerId, { target_user_id: admin.rows[0].id, target_email: admin.rows[0].email });
    const token = crypto.randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000);
    await pool.query("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)", [admin.rows[0].id, hashToken(token), expiresAt]);
    sendJsonWithHeaders(response, 200, { ok: true, redirect: "/admin/dashboard", user: admin.rows[0] }, { "Set-Cookie": buildSessionCookie(token) });
  } catch (error) { withError(response, "Super center login as", error); }
}

async function handleSuperSubscriptionActionRequest(request, response, subscriptionId) {
  try {
    const user = await requireSuperPermission(request, response, "billing.manage"); if (!user) return;
    const body = await readJsonBody(request);
    const days = Math.max(1, asNumber(body.days, 30));
    const action = asText(body.action, "extend");
    const status = action === "trial" ? "trial" : asText(body.status, "active");
    const pool = getDbPool();
    const result = await pool.query(`UPDATE subscriptions SET status=$2, current_period_end=COALESCE(current_period_end,NOW()) + ($3 || ' days')::interval, ends_at=COALESCE(ends_at,NOW()) + ($3 || ' days')::interval, next_payment_date=COALESCE(next_payment_date,NOW()) + ($3 || ' days')::interval, payment_status=CASE WHEN $2='trial' THEN 'pending' ELSE payment_status END, updated_at=NOW() WHERE id=$1 RETURNING *`, [subscriptionId, status, days]);
    if (result.rows[0]?.organization_id) {
      await pool.query(`UPDATE organizations SET subscription_status=$2, license_expires_at=$3, trial_ends_at=CASE WHEN $2='trial' THEN $3 ELSE trial_ends_at END, updated_at=NOW() WHERE id=$1`, [result.rows[0].organization_id, status, result.rows[0].current_period_end || result.rows[0].ends_at]);
    }
    await writeAudit(pool, user, `subscription_${action}`, "subscription", subscriptionId, { days, status });
    sendJson(response, 200, { ok: true, item: result.rows[0] || null });
  } catch (error) { withError(response, "Super subscription action", error); }
}

async function handleSuperPlatformPaymentsWriteRequest(request, response) {
  try {
    const user = await requireSuperPermission(request, response, "billing.manage"); if (!user) return;
    const body = await readJsonBody(request);
    const pool = getDbPool();
    const sub = body.subscription_id ? Number(body.subscription_id) : null;
    const invoice = body.invoice_id ? Number(body.invoice_id) : null;
    const result = await pool.query(`INSERT INTO subscription_payments (organization_id, subscription_id, invoice_id, amount, method, status, paid_at, note) VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::timestamptz,NOW()),$8) RETURNING *`, [body.organization_id, sub, invoice, asNumber(body.amount), asText(body.method, "manual"), asText(body.status, "paid"), asDate(body.paid_at), asText(body.note)]);
    if (invoice && asText(body.status, "paid") === "paid") await pool.query(`UPDATE subscription_invoices SET status='paid', paid_at=NOW(), payment_method=$2, updated_at=NOW() WHERE id=$1`, [invoice, asText(body.method, "manual")]);
    await writeAudit(pool, user, "create_platform_payment", "subscription_payment", result.rows[0].id, body);
    sendJson(response, 201, { ok: true, item: result.rows[0] });
  } catch (error) { withError(response, "Super platform payment", error); }
}

async function handleSuperGlobalSearchRequest(request, response, query) {
  try {
    const user = await requireSuperUser(request, response); if (!user) return;
    const q = `%${asText(query.get('q')).toLowerCase()}%`;
    const pool = getDbPool();
    const centers = await pool.query(`SELECT 'center' AS type, id, name AS title, COALESCE(email, phone, subdomain, slug) AS subtitle FROM organizations WHERE lower(name) LIKE $1 OR lower(COALESCE(email,'')) LIKE $1 OR lower(COALESCE(phone,'')) LIKE $1 OR lower(COALESCE(subdomain,slug,'')) LIKE $1 ORDER BY id DESC LIMIT 10`, [q]);
    const invoices = await pool.query(`SELECT 'invoice' AS type, i.id, i.invoice_number AS title, CONCAT(COALESCE(o.name,'-'), ' · ', i.amount::text, ' UZS') AS subtitle FROM subscription_invoices i LEFT JOIN organizations o ON o.id=i.organization_id WHERE lower(i.invoice_number) LIKE $1 OR lower(COALESCE(o.name,'')) LIKE $1 ORDER BY i.id DESC LIMIT 10`, [q]);
    const tickets = await pool.query(`SELECT 'support' AS type, t.id, t.subject AS title, COALESCE(o.name,'Platforma') AS subtitle FROM support_tickets t LEFT JOIN organizations o ON o.id=t.organization_id WHERE lower(t.subject) LIKE $1 OR lower(COALESCE(o.name,'')) LIKE $1 ORDER BY t.id DESC LIMIT 10`, [q]);
    sendJson(response, 200, { ok: true, items: [...centers.rows, ...invoices.rows, ...tickets.rows].slice(0,25) });
  } catch (error) { withError(response, "Super global search", error); }
}


async function handleOrgDashboardRequest(request, response) {
  try {
    const user = await requireUser(request, response, "read"); if (!user) return;
    const pool = getDbPool();
    const orgId = user.organization_id;
    const summary = await pool.query(`SELECT
      (SELECT COUNT(*)::int FROM leads WHERE organization_id=$1 AND created_at::date=CURRENT_DATE) AS new_leads,
      (SELECT COUNT(*)::int FROM leads WHERE organization_id=$1 AND status IN ('trial','trial_lesson')) AS trial_students,
      (SELECT COUNT(*)::int FROM students WHERE organization_id=$1 AND status='active') AS active_students,
      (SELECT COUNT(*)::int FROM students WHERE organization_id=$1 AND COALESCE(balance,0) < 0) AS debtors,
      COALESCE((SELECT SUM(amount) FROM payments WHERE organization_id=$1 AND paid_at::date=CURRENT_DATE),0)::numeric AS today_payments,
      COALESCE((SELECT SUM(amount) FROM payments WHERE organization_id=$1 AND paid_at >= date_trunc('month', NOW())),0)::numeric AS monthly_revenue,
      (SELECT COUNT(*)::int FROM lessons WHERE organization_id=$1 AND lesson_at::date=CURRENT_DATE) AS today_lessons,
      COALESCE((SELECT ROUND(100.0 * SUM(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0),1) FROM attendance_records WHERE organization_id=$1 AND created_at >= NOW() - interval '30 days'),0)::numeric AS attendance_percent`, [orgId]);
    const finance = await pool.query(`WITH days AS (SELECT generate_series(CURRENT_DATE - interval '13 days', CURRENT_DATE, interval '1 day') AS day) SELECT to_char(day,'YYYY-MM-DD') AS date, COALESCE((SELECT SUM(amount) FROM payments p WHERE p.organization_id=$1 AND p.paid_at::date=days.day::date),0)::numeric AS revenue, COALESCE((SELECT SUM(amount) FROM expenses e WHERE e.organization_id=$1 AND e.created_at::date=days.day::date),0)::numeric AS expenses FROM days ORDER BY day`, [orgId]);
    const activity = await pool.query(`SELECT action, entity, entity_id, created_at FROM audit_logs WHERE organization_id=$1 ORDER BY id DESC LIMIT 20`, [orgId]);
    const lessons = await pool.query(`SELECT l.*, g.name AS group_name, t.full_name AS teacher_name FROM lessons l LEFT JOIN groups g ON g.id=l.group_id LEFT JOIN teachers t ON t.id=g.teacher_id WHERE l.organization_id=$1 AND l.lesson_at::date=CURRENT_DATE ORDER BY l.lesson_at ASC LIMIT 20`, [orgId]);
    sendJson(response, 200, { ok: true, summary: summary.rows[0], charts: { finance: finance.rows }, todayLessons: lessons.rows, recentActivity: activity.rows });
  } catch (error) { withError(response, "Org dashboard", error); }
}

async function handleOrgBrandingRequest(request, response) {
  try {
    const user = await requireUser(request, response, request.method === "PUT" ? "settings:write" : "read"); if (!user) return;
    const pool = getDbPool();
    if (request.method === "PUT") {
      const body = await readJsonBody(request);
      const result = await pool.query(`INSERT INTO organization_branding (organization_id, logo_url, favicon_url, primary_color, secondary_color, accent_color, student_app_name, white_label_enabled, sms_sender_name, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) ON CONFLICT (organization_id) DO UPDATE SET logo_url=EXCLUDED.logo_url, favicon_url=EXCLUDED.favicon_url, primary_color=EXCLUDED.primary_color, secondary_color=EXCLUDED.secondary_color, accent_color=EXCLUDED.accent_color, student_app_name=EXCLUDED.student_app_name, white_label_enabled=EXCLUDED.white_label_enabled, sms_sender_name=EXCLUDED.sms_sender_name, updated_at=NOW() RETURNING *`, [user.organization_id, asText(body.logo_url), asText(body.favicon_url), asText(body.primary_color, '#0A84FF'), asText(body.secondary_color, '#111827'), asText(body.accent_color, '#22C55E'), asText(body.student_app_name, 'Eduka Student App'), Boolean(body.white_label_enabled), asText(body.sms_sender_name)]);
      sendJson(response, 200, { ok:true, item: result.rows[0] }); return;
    }
    const result = await pool.query(`SELECT * FROM organization_branding WHERE organization_id=$1`, [user.organization_id]);
    sendJson(response, 200, { ok:true, item: result.rows[0] || null });
  } catch (error) { withError(response, "Org branding", error); }
}

async function handleOrgUsersRequest(request, response) {
  try {
    const user = await requireUser(request, response, request.method === "POST" ? "users:manage" : "read"); if (!user) return;
    const pool = getDbPool();
    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const password = asText(body.password, generateTemporaryPassword());
      const result = await pool.query(`INSERT INTO users (organization_id, full_name, email, phone, normalized_phone, role, password_hash, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE) RETURNING id, full_name, email, phone, role, is_active`, [user.organization_id, asText(body.full_name || body.name), asText(body.email).toLowerCase(), asText(body.phone), `org-${user.organization_id}-${Date.now()}-${Math.random()}`, asText(body.role, 'manager'), hashPassword(password)]);
      sendJson(response, 201, { ok:true, item: result.rows[0], temporaryPassword: password }); return;
    }
    const result = await pool.query(`SELECT id, full_name, email, phone, role, is_active, created_at, updated_at FROM users WHERE organization_id=$1 ORDER BY id DESC`, [user.organization_id]);
    sendJson(response, 200, { ok:true, items: result.rows });
  } catch (error) { withError(response, "Org users", error); }
}

async function handleOrgRolesRequest(request, response) {
  try {
    const user = await requireUser(request, response, request.method === "POST" ? "settings:write" : "read"); if (!user) return;
    const pool = getDbPool();
    if (request.method === "POST") {
      const body = await readJsonBody(request);
      const role = await pool.query(`INSERT INTO organization_roles (organization_id, name, description, is_system) VALUES ($1,$2,$3,FALSE) ON CONFLICT (organization_id, name) DO UPDATE SET description=EXCLUDED.description RETURNING *`, [user.organization_id, asText(body.name), asText(body.description)]);
      for (const perm of body.permissions || []) await pool.query(`INSERT INTO organization_permissions (organization_id, role_id, permission_key, enabled) VALUES ($1,$2,$3,TRUE) ON CONFLICT (role_id, permission_key) DO UPDATE SET enabled=TRUE`, [user.organization_id, role.rows[0].id, asText(perm)]);
      sendJson(response, 201, { ok:true, item: role.rows[0] }); return;
    }
    const roles = await pool.query(`SELECT r.*, COALESCE(json_agg(p.permission_key) FILTER (WHERE p.enabled), '[]') AS permissions FROM organization_roles r LEFT JOIN organization_permissions p ON p.role_id=r.id WHERE r.organization_id=$1 GROUP BY r.id ORDER BY r.id`, [user.organization_id]);
    sendJson(response, 200, { ok:true, items: roles.rows });
  } catch (error) { withError(response, "Org roles", error); }
}

async function handleStudentProfessionalRequest(request, response, resource) {
  try {
    const session = await requireStudentAppSession(request, response);
    if (!session?.row) return;
    const pool = session.pool;
    const student = session.row;
    if (resource === 'dashboard') {
      const [payments, attendance, exams, homeworks, news, events] = await Promise.all([
        pool.query(`SELECT * FROM payments WHERE organization_id=$1 AND student_id=$2 ORDER BY paid_at DESC LIMIT 10`, [student.organization_id, student.id]),
        pool.query(`SELECT status, COUNT(*)::int AS count FROM attendance_records WHERE organization_id=$1 AND student_id=$2 GROUP BY status`, [student.organization_id, student.id]),
        pool.query(`SELECT * FROM student_exam_results WHERE organization_id=$1 AND student_id=$2 ORDER BY exam_date DESC NULLS LAST, id DESC LIMIT 5`, [student.organization_id, student.id]),
        pool.query(`SELECT * FROM student_tasks WHERE organization_id=$1 AND student_id=$2 ORDER BY due_date ASC NULLS LAST, id DESC LIMIT 5`, [student.organization_id, student.id]),
        pool.query(`SELECT * FROM student_news WHERE organization_id=$1 AND status='published' ORDER BY publish_date DESC NULLS LAST, id DESC LIMIT 5`, [student.organization_id]),
        pool.query(`SELECT * FROM student_events WHERE organization_id=$1 AND status='active' ORDER BY event_date ASC NULLS LAST, id DESC LIMIT 5`, [student.organization_id])
      ]);
      sendJson(response, 200, { ok:true, student, summary: { balance: student.balance || 0, coins: student.coins || 0, crystals: student.crystals || 0 }, payments: payments.rows, attendance: attendance.rows, exams: exams.rows, homeworks: homeworks.rows, news: news.rows, events: events.rows }); return;
    }
    if (resource === 'feedback' && request.method === 'POST') { const body = await readJsonBody(request); const result = await pool.query(`INSERT INTO student_feedback (organization_id, student_id, type, subject, message) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [student.organization_id, student.id, asText(body.type,'feedback'), asText(body.subject), asText(body.message)]); sendJson(response, 201, { ok:true, item: result.rows[0] }); return; }
    const resourceQueries = {
      payments: [`SELECT * FROM payments WHERE organization_id=$1 AND student_id=$2 ORDER BY paid_at DESC, id DESC LIMIT 100`, [student.organization_id, student.id]],
      attendance: [`SELECT * FROM attendance_records WHERE organization_id=$1 AND student_id=$2 ORDER BY lesson_date DESC, id DESC LIMIT 100`, [student.organization_id, student.id]],
      homeworks: [`SELECT * FROM student_tasks WHERE organization_id=$1 AND student_id=$2 ORDER BY due_date DESC NULLS LAST, id DESC LIMIT 100`, [student.organization_id, student.id]],
      exams: [`SELECT * FROM student_exam_results WHERE organization_id=$1 AND student_id=$2 ORDER BY exam_date DESC NULLS LAST, id DESC LIMIT 100`, [student.organization_id, student.id]],
      feedback: [`SELECT * FROM student_feedback WHERE organization_id=$1 AND student_id=$2 ORDER BY id DESC LIMIT 100`, [student.organization_id, student.id]],
      library: [`SELECT * FROM student_library_items WHERE organization_id=$1 AND status='published' ORDER BY id DESC LIMIT 100`, [student.organization_id]],
      dictionary: [`SELECT * FROM student_dictionary_words WHERE organization_id=$1 AND status='published' ORDER BY id DESC LIMIT 100`, [student.organization_id]],
      news: [`SELECT * FROM student_news WHERE organization_id=$1 AND status='published' ORDER BY publish_date DESC NULLS LAST, id DESC LIMIT 100`, [student.organization_id]],
      events: [`SELECT * FROM student_events WHERE organization_id=$1 AND status='active' ORDER BY event_date ASC NULLS LAST, id DESC LIMIT 100`, [student.organization_id]],
      referrals: [`SELECT * FROM student_referrals WHERE organization_id=$1 AND referrer_student_id=$2 ORDER BY id DESC LIMIT 100`, [student.organization_id, student.id]],
      group: [`SELECT g.* FROM groups g JOIN group_students gs ON gs.group_id=g.id WHERE gs.student_id=$2 AND g.organization_id=$1 ORDER BY g.id DESC LIMIT 20`, [student.organization_id, student.id]],
      study: [`SELECT * FROM student_tasks WHERE organization_id=$1 AND student_id=$2 ORDER BY due_date DESC NULLS LAST, id DESC LIMIT 100`, [student.organization_id, student.id]],
      rating: [`SELECT id, full_name, coins, crystals FROM students WHERE organization_id=$1 ORDER BY COALESCE(coins,0) DESC, COALESCE(crystals,0) DESC LIMIT 50`, [student.organization_id]]
    };
    const query = resourceQueries[resource];
    if (!query) { sendJson(response, 404, { ok:false, message:'Resource topilmadi' }); return; }
    const result = await pool.query(query[0], query[1]);
    sendJson(response, 200, { ok:true, items: result.rows, [resource]: result.rows });
  } catch (error) { withError(response, "Student professional", error); }
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
        `SELECT to_char(m.month_start, 'YYYY-MM') AS month, COALESCE(SUM(p.amount), 0)::numeric AS amount
         FROM generate_series(date_trunc('month', NOW()) - interval '5 months', date_trunc('month', NOW()), interval '1 month') AS m(month_start)
         LEFT JOIN payments p ON p.organization_id=$1 AND date_trunc('month', p.paid_at)=m.month_start
         GROUP BY m.month_start ORDER BY m.month_start`,
        [organizationId]
      ),
      pool.query("SELECT status, COUNT(*)::int AS count FROM leads WHERE organization_id=$1 GROUP BY status", [organizationId]),
      pool.query(
        `SELECT to_char(m.month_start, 'YYYY-MM') AS month, COUNT(s.id)::int AS count
         FROM generate_series(date_trunc('month', NOW()) - interval '5 months', date_trunc('month', NOW()), interval '1 month') AS m(month_start)
         LEFT JOIN students s ON s.organization_id=$1 AND date_trunc('month', s.created_at)=m.month_start
         GROUP BY m.month_start ORDER BY m.month_start`,
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
    const archived = asText(query.get("archive"));
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

    if (archived === "1") {
      where += " AND (archived_at IS NOT NULL OR status='archived')";
    } else if (!status) {
      where += " AND (archived_at IS NULL AND COALESCE(status, '') <> 'archived')";
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


function workflowNotificationFor(entity, action, row = {}) {
  const names = { students: "Talaba", groups: "Guruh", teachers: "O'qituvchi", courses: "Kurs", leads: "Lid" };
  const titleName = row.full_name || row.name || row.course_name || row.phone || `#${row.id || ''}`;
  const actionText = { create: "yaratildi", update: "yangilandi", delete: "arxivlandi" }[action] || action;
  const type = action === "delete" ? "warning" : action === "update" ? "info" : "success";
  return { title: `${names[entity] || entity} ${actionText}`, body: `${titleName} bo'yicha amal bajarildi`, type };
}

async function createRow(request, response, config) {
  try {
    const user = await requireUser(request, response, `${config.permission}:write`);
    if (!user) return;

    const body = await readJsonBody(request);
    const data = config.prepare(body, user);
    const pool = getDbPool();
    const result = await pool.query(config.insertSql, data.values);
    if (config.entity === "students" && result.rows[0]?.group_id) {
      await pool.query(
        `INSERT INTO group_students (organization_id, group_id, student_id)
         VALUES ($1,$2,$3)
         ON CONFLICT (organization_id, group_id, student_id) DO NOTHING`,
        [user.organization_id, result.rows[0].group_id, result.rows[0].id]
      );
    }
    const createdItem = result.rows[0];
    const notice = workflowNotificationFor(config.entity, "create", createdItem);
    Promise.allSettled([
      createNotification(pool, user, notice.title, notice.body, notice.type),
      writeAudit(pool, user, "create", config.entity, createdItem?.id, data.audit || body)
    ]).catch(() => {});
    sendJson(response, 201, { ok: true, item: createdItem });
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

    const notice = workflowNotificationFor(config.entity, "update", result.rows[0]);
    Promise.allSettled([
      createNotification(pool, user, notice.title, notice.body, notice.type),
      writeAudit(pool, user, "update", config.entity, id, { before: before.rows[0] || null, after: result.rows[0] })
    ]).catch(() => {});
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

    const notice = workflowNotificationFor(config.entity, "delete", before.rows[0] || { id });
    await createNotification(pool, user, notice.title, notice.body, notice.type);
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
    deleteSql: "UPDATE courses SET status='archived', archived_at=NOW() WHERE id=$1 AND organization_id=$2 RETURNING id",
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
    insertSql: `INSERT INTO students (organization_id, full_name, phone, parent_phone, birth_date, address, course_name, group_id, payment_type, discount, status, balance, note, gender, father_name, mother_name, tags)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
    updateSql: `UPDATE students SET full_name=$3, phone=$4, parent_phone=$5, birth_date=$6, address=$7, course_name=$8, group_id=$9, payment_type=$10, discount=$11, status=$12, balance=$13, note=$14, gender=$15, father_name=$16, mother_name=$17, tags=$18
      WHERE id=$1 AND organization_id=$2 RETURNING *`,
    deleteSql: "UPDATE students SET status='archived', archived_at=NOW() WHERE id=$1 AND organization_id=$2 RETURNING id",
    prepare: (body, user, id) => ({
      values: id
        ? [id, user.organization_id, asText(body.full_name), asText(body.phone), asText(body.parent_phone), asDate(body.birth_date), asText(body.address), asText(body.course_name), body.group_id || null, asText(body.payment_type), asNumber(body.discount), asText(body.status, "active"), asNumber(body.balance), asText(body.note), asText(body.gender), asText(body.father_name || body.fatherName), asText(body.mother_name || body.motherName), JSON.stringify(Array.isArray(body.tags) ? body.tags : String(body.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean))]
        : [user.organization_id, asText(body.full_name), asText(body.phone), asText(body.parent_phone), asDate(body.birth_date), asText(body.address), asText(body.course_name), body.group_id || null, asText(body.payment_type), asNumber(body.discount), asText(body.status, "active"), asNumber(body.balance), asText(body.note), asText(body.gender), asText(body.father_name || body.fatherName), asText(body.mother_name || body.motherName), JSON.stringify(Array.isArray(body.tags) ? body.tags : String(body.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean))]
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
    deleteSql: "UPDATE leads SET status='archived', archived_at=NOW() WHERE id=$1 AND organization_id=$2 RETURNING id",
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
    insertSql: `INSERT INTO groups (organization_id, name, course_name, status, teacher_id, teacher_name, days, start_time, end_time, monthly_price, starts_at, ends_at, room, teacher_salary, salary_type, chat_id, delivery_mode)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
    updateSql: `UPDATE groups SET name=$3, course_name=$4, status=$5, teacher_id=$6, teacher_name=$7, days=$8, start_time=$9, end_time=$10, monthly_price=$11, starts_at=$12, ends_at=$13, room=$14, teacher_salary=$15, salary_type=$16, chat_id=$17, delivery_mode=$18
      WHERE id=$1 AND organization_id=$2 RETURNING *`,
    deleteSql: "UPDATE groups SET status='archived', archived_at=NOW() WHERE id=$1 AND organization_id=$2 RETURNING id",
    prepare: (body, user, id) => ({
      values: id
        ? [id, user.organization_id, asText(body.name), asText(body.course_name), asText(body.status, "active"), body.teacher_id || null, asText(body.teacher_name), asText(body.days), asText(body.start_time), asText(body.end_time), asNumber(body.monthly_price), asDate(body.starts_at), asDate(body.ends_at), asText(body.room), asNumber(body.teacher_salary || body.salary_rate), asText(body.salary_type, "fixed"), asText(body.chat_id), asText(body.delivery_mode, "offline")]
        : [user.organization_id, asText(body.name), asText(body.course_name), asText(body.status, "active"), body.teacher_id || null, asText(body.teacher_name), asText(body.days), asText(body.start_time), asText(body.end_time), asNumber(body.monthly_price), asDate(body.starts_at), asDate(body.ends_at), asText(body.room), asNumber(body.teacher_salary || body.salary_rate), asText(body.salary_type, "fixed"), asText(body.chat_id), asText(body.delivery_mode, "offline")]
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
    insertSql: `INSERT INTO teachers (organization_id, full_name, phone, email, course_name, subjects, groups, login_enabled, status, salary_type, salary_rate, birth_date, gender, address, note)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    updateSql: `UPDATE teachers SET full_name=$3, phone=$4, email=$5, course_name=$6, subjects=$7, groups=$8, login_enabled=$9, status=$10, salary_type=$11, salary_rate=$12, birth_date=$13, gender=$14, address=$15, note=$16
      WHERE id=$1 AND organization_id=$2 RETURNING *`,
    deleteSql: "UPDATE teachers SET status='archived', archived_at=NOW() WHERE id=$1 AND organization_id=$2 RETURNING id",
    prepare: (body, user, id) => ({
      values: id
        ? [id, user.organization_id, asText(body.full_name), asText(body.phone), asText(body.email), asText(body.course_name), asText(body.subjects), asText(body.groups), Boolean(body.login_enabled), asText(body.status, "active"), asText(body.salary_type, "fixed"), asNumber(body.salary_rate), asDate(body.birth_date), asText(body.gender), asText(body.address), asText(body.note)]
        : [user.organization_id, asText(body.full_name), asText(body.phone), asText(body.email), asText(body.course_name), asText(body.subjects), asText(body.groups), Boolean(body.login_enabled), asText(body.status, "active"), asText(body.salary_type, "fixed"), asNumber(body.salary_rate), asDate(body.birth_date), asText(body.gender), asText(body.address), asText(body.note)]
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
    const settings = receiptSettingsDefaults(await getOrganizationSettings(pool, user.organization_id));
    const result = await pool.query(
      `INSERT INTO payments (organization_id, student_id, group_id, payment_month, due_amount, amount, paid_amount, discount, status, payment_type, note, created_by, paid_at, payment_date)
       VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,$10,$11,COALESCE($12::timestamptz,NOW()),COALESCE($13::date,CURRENT_DATE)) RETURNING *`,
      [
        user.organization_id,
        body.student_id || null,
        body.group_id || null,
        asText(body.payment_month),
        dueAmount,
        amount,
        discount,
        paymentStatusFrom(amount, dueAmount, discount, body.status),
        asText(body.payment_type, "Naqd pul"),
        asText(body.note),
        user.id,
        asDate(body.paid_at),
        asDate(body.payment_date || body.paid_at)
      ]
    );

    let item = result.rows[0];
    const receiptNo = `${settings.prefix}-${String(item.id).padStart(6, "0")}`;
    const updated = await pool.query(
      `UPDATE payments SET receipt_no=COALESCE(receipt_no,$3), receipt_status='created' WHERE id=$1 AND organization_id=$2 RETURNING *`,
      [item.id, user.organization_id, receiptNo]
    );
    item = updated.rows[0] || item;

    if (body.student_id) {
      await recalculateStudentBalance(pool, user.organization_id, body.student_id);
    }

    await createNotification(pool, user, "To'lov qabul qilindi", `${amount.toLocaleString("uz-UZ")} so'm to'lov amalga oshirildi. Chek: ${item.receipt_no}`, "success");
    await writeAudit(pool, user, "create", "payments", item.id, { ...body, receipt_no: item.receipt_no });
    sendJson(response, 201, { ok: true, item, receipt_no: item.receipt_no, print_receipt: settings.auto_print });
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

    if (!result.rows[0].receipt_no) {
      const settings = receiptSettingsDefaults(await getOrganizationSettings(pool, user.organization_id));
      await pool.query("UPDATE payments SET receipt_no=$3 WHERE id=$1 AND organization_id=$2", [paymentId, user.organization_id, `${settings.prefix}-${String(paymentId).padStart(6, "0")}`]);
    }

    await createNotification(pool, user, "To'lov yangilandi", `${Number(amount || 0).toLocaleString("uz-UZ")} so'm to'lov yozuvi yangilandi`, "info");
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

    await pool.query("UPDATE payments SET status='cancelled', archived_at=NOW() WHERE id=$1 AND organization_id=$2", [paymentId, user.organization_id]);
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
    const [student, payments, attendance, notes, discounts, exams, messages, tasks, gamification, history, groups] = await Promise.all([
      pool.query(
        `SELECT s.*, g.name AS group_name, g.course_name AS group_course, t.full_name AS teacher_name
         FROM students s
         LEFT JOIN groups g ON g.id=s.group_id
         LEFT JOIN teachers t ON t.id=g.teacher_id
         WHERE s.id=$1 AND s.organization_id=$2`,
        [studentId, user.organization_id]
      ),
      pool.query("SELECT p.*, g.name AS group_name FROM payments p LEFT JOIN groups g ON g.id=p.group_id WHERE p.student_id=$1 AND p.organization_id=$2 ORDER BY p.paid_at DESC", [studentId, user.organization_id]),
      pool.query(
        `SELECT a.*, g.name AS group_name
         FROM attendance_records a
         LEFT JOIN groups g ON g.id=a.group_id
         WHERE a.student_id=$1 AND a.organization_id=$2
         ORDER BY a.lesson_date DESC`,
        [studentId, user.organization_id]
      ),
      pool.query("SELECT * FROM student_notes WHERE student_id=$1 AND organization_id=$2 ORDER BY created_at DESC", [studentId, user.organization_id]),
      pool.query("SELECT d.*, g.name AS group_name FROM student_discounts d LEFT JOIN groups g ON g.id=d.group_id WHERE d.student_id=$1 AND d.organization_id=$2 ORDER BY created_at DESC", [studentId, user.organization_id]),
      pool.query("SELECT * FROM student_exam_results WHERE student_id=$1 AND organization_id=$2 ORDER BY exam_date DESC NULLS LAST, id DESC", [studentId, user.organization_id]),
      pool.query("SELECT * FROM crm_messages WHERE student_id=$1 AND organization_id=$2 ORDER BY created_at DESC", [studentId, user.organization_id]),
      pool.query("SELECT t.*, g.name AS group_name FROM student_tasks t LEFT JOIN groups g ON g.id=t.group_id WHERE t.student_id=$1 AND t.organization_id=$2 ORDER BY created_at DESC", [studentId, user.organization_id]),
      pool.query("SELECT * FROM gamification_transactions WHERE student_id=$1 AND organization_id=$2 ORDER BY created_at DESC", [studentId, user.organization_id]),
      pool.query("SELECT * FROM crm_history WHERE student_id=$1 AND organization_id=$2 ORDER BY created_at DESC LIMIT 200", [studentId, user.organization_id]),
      pool.query("SELECT g.* FROM groups g WHERE g.organization_id=$2 AND (g.id=(SELECT group_id FROM students WHERE id=$1 AND organization_id=$2) OR g.id IN (SELECT group_id FROM group_students WHERE organization_id=$2 AND student_id=$1)) ORDER BY g.id DESC", [studentId, user.organization_id])
    ]);

    if (!student.rows[0]) {
      sendJson(response, 404, { ok: false, message: "Talaba topilmadi" });
      return;
    }

    const due = payments.rows.reduce((sum, item) => sum + Number(item.due_amount || 0), 0);
    const paid = payments.rows.reduce((sum, item) => sum + Number(item.amount || 0) + Number(item.discount || 0), 0);
    const present = attendance.rows.filter((item) => ["present", "online"].includes(item.status)).length;
    const attendance_percent = attendance.rows.length ? Math.round((present / attendance.rows.length) * 100) : 0;
    sendJson(response, 200, {
      ok: true,
      profile: {
        student: student.rows[0],
        groups: groups.rows,
        payments: payments.rows,
        attendance: attendance.rows,
        notes: notes.rows,
        discounts: discounts.rows,
        exams: exams.rows,
        messages: messages.rows,
        tasks: tasks.rows,
        gamification: gamification.rows,
        history: history.rows,
        summary: { due, paid, balance: Math.max(due - paid, 0), attendance_percent }
      }
    });
  } catch (error) {
    withError(response, "Student profile", error);
  }
}



const crmExtensionConfigs = {
  notes: {
    table: "student_notes",
    scope: "student",
    fields: ["student_id", "title", "note", "priority", "remind_at", "status"],
    defaults: { title: "Eslatma", priority: "normal", status: "open" },
    order: "created_at DESC, id DESC"
  },
  discounts: {
    table: "student_discounts",
    scope: "student",
    fields: ["student_id", "group_id", "discount_type", "amount", "percent", "reason", "starts_at", "ends_at", "status"],
    defaults: { discount_type: "amount", amount: 0, percent: 0, status: "active" },
    order: "created_at DESC, id DESC"
  },
  messages: {
    table: "crm_messages",
    scope: "student",
    fields: ["student_id", "lead_id", "teacher_id", "channel", "recipient", "subject", "message", "status", "sent_at"],
    defaults: { channel: "manual", status: "queued" },
    order: "created_at DESC, id DESC"
  },
  tasks: {
    table: "student_tasks",
    scope: "studentOrGroup",
    fields: ["student_id", "group_id", "title", "description", "due_date", "max_score", "score", "status"],
    defaults: { max_score: 100, status: "assigned" },
    order: "created_at DESC, id DESC"
  },
  gamification: {
    table: "gamification_transactions",
    scope: "student",
    fields: ["student_id", "type", "amount", "reason", "source"],
    defaults: { type: "coin", amount: 0, source: "manual" },
    order: "created_at DESC, id DESC"
  },
  history: {
    table: "crm_history",
    scope: "studentOrGroup",
    fields: ["student_id", "group_id", "entity", "entity_id", "action", "title", "details"],
    defaults: { entity: "manual", action: "note", details: {} },
    order: "created_at DESC, id DESC"
  },
  exams: {
    table: "student_exam_results",
    scope: "student",
    fields: ["student_id", "title", "score", "max_score", "grade", "exam_date", "status"],
    defaults: { max_score: 100, status: "published" },
    order: "exam_date DESC NULLS LAST, id DESC"
  },
  "group-exams": {
    table: "group_exams",
    scope: "group",
    fields: ["group_id", "title", "exam_date", "pass_score", "max_score", "status", "note"],
    defaults: { pass_score: 60, max_score: 100, status: "planned" },
    order: "exam_date DESC NULLS LAST, id DESC"
  },
  "group-homeworks": {
    table: "group_homeworks",
    scope: "group",
    fields: ["group_id", "title", "description", "due_date", "status"],
    defaults: { status: "active" },
    order: "due_date DESC NULLS LAST, id DESC"
  },
  "group-notes": {
    table: "group_notes",
    scope: "group",
    fields: ["group_id", "note", "status"],
    defaults: { status: "active" },
    order: "created_at DESC, id DESC"
  }
};

function crmExtensionValue(field, body, defaults = {}) {
  if (Object.prototype.hasOwnProperty.call(body || {}, field)) return body[field];
  return defaults[field];
}

function crmExtensionNormalize(field, value) {
  if (["amount", "percent", "max_score", "score", "pass_score"].includes(field)) return asNumber(value);
  if (["student_id", "group_id", "lead_id", "teacher_id", "entity_id"].includes(field)) return value ? Number(value) : null;
  if (["remind_at", "sent_at"].includes(field)) return value ? new Date(value).toISOString() : null;
  if (["starts_at", "ends_at", "due_date", "exam_date"].includes(field)) return asDate(value);
  if (field === "details") return value && typeof value === "object" ? value : {};
  return asText(value);
}

async function insertCrmHistory(pool, user, payload) {
  await pool.query(
    `INSERT INTO crm_history (organization_id, student_id, group_id, entity, entity_id, action, title, details, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [user.organization_id, payload.student_id || null, payload.group_id || null, payload.entity || "system", payload.entity_id || null, payload.action || "change", payload.title || null, payload.details || {}, user.id]
  ).catch(() => {});
}

async function updateGamificationBalance(pool, organizationId, studentId) {
  if (!studentId) return;
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(CASE WHEN type='coin' THEN amount ELSE 0 END),0)::int AS coins,
       COALESCE(SUM(CASE WHEN type='crystal' THEN amount ELSE 0 END),0)::int AS crystals
     FROM gamification_transactions
     WHERE organization_id=$1 AND student_id=$2`,
    [organizationId, studentId]
  );
  await pool.query("UPDATE students SET coins=$3, crystals=$4 WHERE organization_id=$1 AND id=$2", [organizationId, studentId, result.rows[0].coins || 0, result.rows[0].crystals || 0]);
}

async function handleCrmExtensionRequest(request, response, config, parentId = null, rowId = null) {
  try {
    const user = await requireUser(request, response, request.method === "GET" ? "read" : "students:write");
    if (!user) return;
    const pool = getDbPool();
    await ensureSchema(pool);

    const parentColumn = config.scope === "group" ? "group_id" : "student_id";
    if (request.method === "GET" && !rowId) {
      const params = [user.organization_id];
      let where = "organization_id=$1";
      if (parentId) {
        params.push(parentId);
        where += ` AND ${parentColumn}=$${params.length}`;
      }
      const result = await pool.query(`SELECT * FROM ${config.table} WHERE ${where} ORDER BY ${config.order || "id DESC"}`, params);
      sendJson(response, 200, { ok: true, items: result.rows });
      return;
    }

    if (request.method === "POST" && !rowId) {
      const body = await readJsonBody(request);
      if (parentId && config.fields.includes(parentColumn)) body[parentColumn] = parentId;
      const fields = config.fields;
      const columns = ["organization_id", ...fields, "created_by"];
      const values = [user.organization_id, ...fields.map((field) => crmExtensionNormalize(field, crmExtensionValue(field, body, config.defaults || {}))), user.id];
      const placeholders = values.map((_, index) => `$${index + 1}`).join(",");
      const result = await pool.query(`INSERT INTO ${config.table} (${columns.join(",")}) VALUES (${placeholders}) RETURNING *`, values);
      const item = result.rows[0];
      if (config.table === "gamification_transactions") await updateGamificationBalance(pool, user.organization_id, item.student_id);
      await insertCrmHistory(pool, user, { student_id: item.student_id, group_id: item.group_id, entity: config.table, entity_id: item.id, action: "create", title: item.title || item.note || item.reason, details: item });
      await writeAudit(pool, user, "create", config.table, item.id, item);
      sendJson(response, 201, { ok: true, item });
      return;
    }

    if (request.method === "PUT" && rowId) {
      const body = await readJsonBody(request);
      const before = await pool.query(`SELECT * FROM ${config.table} WHERE id=$1 AND organization_id=$2`, [rowId, user.organization_id]);
      if (!before.rows[0]) return sendJson(response, 404, { ok: false, message: "Ma'lumot topilmadi" });
      const fields = config.fields.filter((field) => Object.prototype.hasOwnProperty.call(body, field));
      if (!fields.length) return sendJson(response, 200, { ok: true, item: before.rows[0] });
      const values = [rowId, user.organization_id, ...fields.map((field) => crmExtensionNormalize(field, body[field]))];
      const setSql = fields.map((field, index) => `${field}=$${index + 3}`).join(", ") + ", updated_at=NOW()";
      const result = await pool.query(`UPDATE ${config.table} SET ${setSql} WHERE id=$1 AND organization_id=$2 RETURNING *`, values);
      const item = result.rows[0];
      if (config.table === "gamification_transactions") await updateGamificationBalance(pool, user.organization_id, item.student_id);
      await insertCrmHistory(pool, user, { student_id: item.student_id, group_id: item.group_id, entity: config.table, entity_id: item.id, action: "update", title: item.title || item.note || item.reason, details: { before: before.rows[0], after: item } });
      await writeAudit(pool, user, "update", config.table, rowId, { before: before.rows[0], after: item });
      sendJson(response, 200, { ok: true, item });
      return;
    }

    if (request.method === "DELETE" && rowId) {
      const before = await pool.query(`SELECT * FROM ${config.table} WHERE id=$1 AND organization_id=$2`, [rowId, user.organization_id]);
      if (!before.rows[0]) return sendJson(response, 404, { ok: false, message: "Ma'lumot topilmadi" });
      await pool.query(`DELETE FROM ${config.table} WHERE id=$1 AND organization_id=$2`, [rowId, user.organization_id]);
      if (config.table === "gamification_transactions") await updateGamificationBalance(pool, user.organization_id, before.rows[0].student_id);
      await insertCrmHistory(pool, user, { student_id: before.rows[0].student_id, group_id: before.rows[0].group_id, entity: config.table, entity_id: rowId, action: "delete", title: before.rows[0].title || before.rows[0].note || before.rows[0].reason, details: before.rows[0] });
      await writeAudit(pool, user, "delete", config.table, rowId, { before: before.rows[0] });
      sendJson(response, 200, { ok: true });
      return;
    }

    sendJson(response, 405, { ok: false, message: "Bu amal qo'llab-quvvatlanmaydi" });
  } catch (error) {
    withError(response, `CRM extension ${config?.table || "unknown"}`, error);
  }
}

async function handleGroupProfileRequest(request, response, groupId) {
  try {
    const user = await requireUser(request, response, "groups:read");
    if (!user) return;
    const pool = getDbPool();
    await ensureSchema(pool);
    const [group, students, attendance, grades, homeworks, exams, discounts, notes, history, payments] = await Promise.all([
      pool.query(`SELECT g.*, t.full_name AS teacher_full_name FROM groups g LEFT JOIN teachers t ON t.id=g.teacher_id WHERE g.id=$1 AND g.organization_id=$2`, [groupId, user.organization_id]),
      pool.query(`SELECT s.* FROM students s WHERE s.organization_id=$2 AND (s.group_id=$1 OR s.id IN (SELECT student_id FROM group_students WHERE organization_id=$2 AND group_id=$1)) ORDER BY s.full_name`, [groupId, user.organization_id]),
      pool.query(`SELECT a.*, s.full_name AS student_name FROM attendance_records a LEFT JOIN students s ON s.id=a.student_id WHERE a.group_id=$1 AND a.organization_id=$2 ORDER BY a.lesson_date DESC, a.id DESC`, [groupId, user.organization_id]),
      pool.query(`SELECT t.*, s.full_name AS student_name FROM student_tasks t LEFT JOIN students s ON s.id=t.student_id WHERE t.group_id=$1 AND t.organization_id=$2 ORDER BY t.created_at DESC`, [groupId, user.organization_id]),
      pool.query(`SELECT * FROM group_homeworks WHERE group_id=$1 AND organization_id=$2 ORDER BY due_date DESC NULLS LAST, id DESC`, [groupId, user.organization_id]),
      pool.query(`SELECT * FROM group_exams WHERE group_id=$1 AND organization_id=$2 ORDER BY exam_date DESC NULLS LAST, id DESC`, [groupId, user.organization_id]),
      pool.query(`SELECT d.*, s.full_name AS student_name FROM student_discounts d LEFT JOIN students s ON s.id=d.student_id WHERE d.group_id=$1 AND d.organization_id=$2 ORDER BY d.created_at DESC`, [groupId, user.organization_id]),
      pool.query(`SELECT * FROM group_notes WHERE group_id=$1 AND organization_id=$2 ORDER BY created_at DESC`, [groupId, user.organization_id]),
      pool.query(`SELECT * FROM crm_history WHERE group_id=$1 AND organization_id=$2 ORDER BY created_at DESC LIMIT 200`, [groupId, user.organization_id]),
      pool.query(`SELECT p.*, s.full_name AS student_name FROM payments p LEFT JOIN students s ON s.id=p.student_id WHERE p.group_id=$1 AND p.organization_id=$2 ORDER BY p.paid_at DESC`, [groupId, user.organization_id])
    ]);
    if (!group.rows[0]) return sendJson(response, 404, { ok: false, message: "Guruh topilmadi" });
    const present = attendance.rows.filter((item) => ["present", "online"].includes(item.status)).length;
    const attendance_percent = attendance.rows.length ? Math.round((present / attendance.rows.length) * 100) : 0;
    sendJson(response, 200, { ok: true, profile: { group: group.rows[0], students: students.rows, attendance: attendance.rows, grades: grades.rows, homeworks: homeworks.rows, exams: exams.rows, discounts: discounts.rows, notes: notes.rows, history: history.rows, payments: payments.rows, summary: { student_count: students.rows.length, attendance_percent, payments_total: payments.rows.reduce((sum, p) => sum + Number(p.amount || 0), 0) } } });
  } catch (error) {
    withError(response, "Group profile", error);
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
    const archived = asText(query.get("archive"));
    const dateFrom = asDate(query.get("date_from"));
    const dateTo = asDate(query.get("date_to"));
    const params = [user.organization_id];
    let where = "WHERE p.organization_id=$1";
    if (archived === "1") {
      where += " AND p.archived_at IS NOT NULL";
    } else {
      where += " AND p.archived_at IS NULL";
    }
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


function csvCell(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ");
  return /[",;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function sendCsv(response, filename, rows, columns) {
  const header = columns.map(([key, label]) => csvCell(label || key)).join(",");
  const body = rows.map((row) => columns.map(([key]) => csvCell(row[key])).join(",")).join("\n");
  response.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`
  });
  response.end(`\ufeff${header}\n${body}`);
}

async function handleExportRequest(request, response, resource) {
  try {
    const user = await requireUser(request, response, "reports:read");
    if (!user) return;
    const pool = getDbPool();
    const query = requestQuery(request);
    const dateFrom = asDate(query.get("date_from"));
    const dateTo = asDate(query.get("date_to"));
    const allowed = {
      students: {
        filename: "eduka-students.csv",
        sql: `SELECT id, full_name, phone, parent_phone, course_name, status, balance, created_at FROM students WHERE organization_id=$1 ORDER BY id DESC LIMIT 5000`,
        params: [user.organization_id],
        columns: [["id","ID"],["full_name","FISH"],["phone","Telefon"],["parent_phone","Ota-ona"],["course_name","Kurs"],["status","Status"],["balance","Balans"],["created_at","Yaratilgan"]]
      },
      groups: {
        filename: "eduka-groups.csv",
        sql: `SELECT g.id, g.name, g.course_name, g.teacher_name, g.days, g.start_time, g.end_time, g.status, COUNT(s.id)::int AS student_count FROM groups g LEFT JOIN students s ON s.group_id=g.id WHERE g.organization_id=$1 GROUP BY g.id ORDER BY g.id DESC LIMIT 5000`,
        params: [user.organization_id],
        columns: [["id","ID"],["name","Guruh"],["course_name","Kurs"],["teacher_name","O'qituvchi"],["days","Kunlar"],["start_time","Boshlanish"],["end_time","Tugash"],["status","Status"],["student_count","Talabalar"]]
      },
      teachers: {
        filename: "eduka-teachers.csv",
        sql: `SELECT id, full_name, phone, email, course_name, subjects, status, salary_type, salary_rate FROM teachers WHERE organization_id=$1 ORDER BY id DESC LIMIT 5000`,
        params: [user.organization_id],
        columns: [["id","ID"],["full_name","FISH"],["phone","Telefon"],["email","Email"],["course_name","Kurs"],["subjects","Fanlar"],["status","Status"],["salary_type","Oylik turi"],["salary_rate","Stavka"]]
      },
      payments: null,
      attendance: null,
      debts: {
        filename: "eduka-debtors.csv",
        sql: `SELECT id, full_name, phone, parent_phone, course_name, balance, note FROM students WHERE organization_id=$1 AND COALESCE(balance,0)>0 ORDER BY balance DESC LIMIT 5000`,
        params: [user.organization_id],
        columns: [["id","ID"],["full_name","FISH"],["phone","Telefon"],["parent_phone","Ota-ona"],["course_name","Kurs"],["balance","Qarz"],["note","Izoh"]]
      }
    };
    const params = [user.organization_id];
    let config = allowed[resource];
    if (resource === "payments") {
      let where = "WHERE p.organization_id=$1";
      if (dateFrom) { params.push(dateFrom); where += ` AND p.paid_at::date >= $${params.length}::date`; }
      if (dateTo) { params.push(dateTo); where += ` AND p.paid_at::date <= $${params.length}::date`; }
      config = {
        filename: "eduka-payments.csv",
        sql: `SELECT p.id, s.full_name AS student_name, g.name AS group_name, p.payment_month, p.due_amount, p.amount, p.discount, p.status, p.payment_type, p.receipt_no, p.paid_at FROM payments p LEFT JOIN students s ON s.id=p.student_id LEFT JOIN groups g ON g.id=p.group_id ${where} ORDER BY p.paid_at DESC, p.id DESC LIMIT 5000`,
        params,
        columns: [["id","ID"],["student_name","Talaba"],["group_name","Guruh"],["payment_month","Oy"],["due_amount","Kerak"],["amount","To'landi"],["discount","Chegirma"],["status","Status"],["payment_type","Usul"],["receipt_no","Chek"],["paid_at","Sana"]]
      };
    }
    if (resource === "attendance") {
      let where = "WHERE a.organization_id=$1";
      if (dateFrom) { params.push(dateFrom); where += ` AND a.lesson_date >= $${params.length}::date`; }
      if (dateTo) { params.push(dateTo); where += ` AND a.lesson_date <= $${params.length}::date`; }
      config = {
        filename: "eduka-attendance.csv",
        sql: `SELECT a.id, a.lesson_date, s.full_name AS student_name, g.name AS group_name, a.status, a.note FROM attendance_records a LEFT JOIN students s ON s.id=a.student_id LEFT JOIN groups g ON g.id=a.group_id ${where} ORDER BY a.lesson_date DESC, a.id DESC LIMIT 5000`,
        params,
        columns: [["id","ID"],["lesson_date","Sana"],["student_name","Talaba"],["group_name","Guruh"],["status","Holat"],["note","Izoh"]]
      };
    }
    if (!config) {
      sendJson(response, 404, { ok: false, message: "Export turi topilmadi" });
      return;
    }
    const result = await pool.query(config.sql, config.params);
    await writeAudit(pool, user, "export", resource, null, { count: result.rows.length });
    sendCsv(response, config.filename, result.rows, config.columns);
  } catch (error) {
    withError(response, "Export", error);
  }
}

async function handlePaymentCancelRequest(request, response, paymentId) {
  try {
    const user = await requireUser(request, response, "payments:write");
    if (!user) return;
    const pool = getDbPool();
    const before = await pool.query("SELECT * FROM payments WHERE id=$1 AND organization_id=$2", [paymentId, user.organization_id]);
    if (!before.rows[0]) {
      sendJson(response, 404, { ok: false, message: "To'lov topilmadi" });
      return;
    }
    const result = await pool.query("UPDATE payments SET status='cancelled', archived_at=NOW() WHERE id=$1 AND organization_id=$2 RETURNING *", [paymentId, user.organization_id]);
    await writeAudit(pool, user, "cancel", "payments", paymentId, { before: before.rows[0] });
    sendJson(response, 200, { ok: true, item: result.rows[0] });
  } catch (error) {
    withError(response, "Cancel payment", error);
  }
}

async function handleDemoRequest(request, response) {
  try {
    const body = await readJsonBody(request);
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
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

    await sendLandingTelegramMessage({ ...body, name, phone, note: body.note || body.comment || body.message || `Til: ${lang}` });
    sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error(`Demo request failed: ${safeTelegramErrorMessage(error)}`);
    const isConfigError = error.message === "Landing Telegram bot token is not configured" || error.message === "Landing Telegram chat id is not configured";
    sendJson(response, isConfigError ? 503 : 500, {
      ok: false,
      message: isConfigError ? error.message : "Demo request failed",
      error: isConfigError ? error.message : "Demo request failed",
      telegramDescription: error.telegramDescription ? safeTelegramErrorMessage(error) : undefined
    });
  }
}

const simpleCrudConfigs = {
  rooms: {
    table: "rooms",
    permission: "settings",
    listSql: "SELECT * FROM rooms WHERE organization_id=$1 AND archived_at IS NULL ORDER BY id DESC",
    insertColumns: ["organization_id", "name", "capacity", "status"],
    fields: [
      ["name", asText],
      ["capacity", asNumber],
      ["status", (value) => asText(value, "active")]
    ]
  },
  "payment-types": {
    table: "payment_types",
    permission: "settings",
    listSql: "SELECT * FROM payment_types WHERE organization_id=$1 AND archived_at IS NULL ORDER BY active DESC, id DESC",
    insertColumns: ["organization_id", "name", "type", "active"],
    fields: [
      ["name", asText],
      ["type", (value) => asText(value, "Markaz")],
      ["active", (value) => value !== false]
    ]
  },
  "finance-transactions": {
    table: "finance_transactions",
    permission: "finance",
    listSql: "SELECT ft.*, pt.name AS payment_type_name FROM finance_transactions ft LEFT JOIN payment_types pt ON pt.id=ft.payment_type_id WHERE ft.organization_id=$1 AND ft.archived_at IS NULL ORDER BY ft.transaction_date DESC, ft.id DESC",
    insertColumns: ["organization_id", "type", "category", "amount", "payment_type_id", "employee_id", "reason", "note", "transaction_date"],
    fields: [
      ["type", (value) => asText(value, "income")],
      ["category", asText],
      ["amount", asNumber],
      ["payment_type_id", (value) => value || null],
      ["employee_id", (value) => value || null],
      ["reason", asText],
      ["note", asText],
      ["transaction_date", asDate]
    ]
  },
  tags: {
    table: "tags",
    permission: "settings",
    listSql: "SELECT * FROM tags WHERE organization_id=$1 ORDER BY id DESC",
    insertColumns: ["organization_id", "name", "color", "type"],
    fields: [
      ["name", asText],
      ["color", (value) => asText(value, "#168CFF")],
      ["type", (value) => asText(value, "student")]
    ]
  }
};

async function handleSimpleCrudRequest(request, response, config, id = null) {
  try {
    const user = await requireUser(request, response, request.method === "GET" ? "read" : `${config.permission}:write`);
    if (!user) return;
    const pool = getDbPool();

    if (request.method === "GET" && !id) {
      if (config.table === "payment_types") await ensureDefaultPaymentTypes(pool, user.organization_id);
      const result = await pool.query(config.listSql, [user.organization_id]);
      let items = result.rows;
      if (config.table === "finance_transactions" && request.edukaFinanceAlias && request.edukaFinanceAlias !== "transactions") {
        const aliasMap = {
          "extra-incomes": ["income", "extra-income", "extra_income"],
          salary: ["salary", "ish-haqi", "ish_haqi"],
          bonuses: ["bonus", "bonuses"],
          expenses: ["expense", "expenses", "xarajat"]
        };
        const allowed = aliasMap[request.edukaFinanceAlias] || [];
        items = items.filter((item) => allowed.includes(String(item.type || "").toLowerCase()) || allowed.includes(String(item.category || "").toLowerCase()));
      }
      sendJson(response, 200, { ok: true, items });
      return;
    }

    if (request.method === "POST" && !id) {
      const body = await readJsonBody(request);
      if (config.table === "finance_transactions" && request.edukaFinanceAlias && request.edukaFinanceAlias !== "transactions") {
        const aliasType = { "extra-incomes": "income", salary: "salary", bonuses: "bonus", expenses: "expense" }[request.edukaFinanceAlias];
        const aliasCategory = { "extra-incomes": "extra-income", salary: "salary", bonuses: "bonus", expenses: "expense" }[request.edukaFinanceAlias];
        body.type = body.type || aliasType;
        body.category = body.category || aliasCategory;
      }
      const values = [user.organization_id, ...config.fields.map(([name, mapper]) => mapper(body[name]))];
      const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
      const result = await pool.query(
        `INSERT INTO ${config.table} (${config.insertColumns.join(", ")}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      if (config.table === "finance_transactions") {
        const typeLabel = { income: "Qo'shimcha daromad", salary: "Ish haqi", bonus: "Bonus", expense: "Xarajat" }[String(result.rows[0].type || '').toLowerCase()] || "Moliya";
        await createNotification(pool, user, typeLabel, `${Number(result.rows[0].amount || 0).toLocaleString("uz-UZ")} so'm yozuv yaratildi`, result.rows[0].type === "expense" ? "warning" : "success");
      }
      await writeAudit(pool, user, "create", config.table, result.rows[0].id, body);
      sendJson(response, 201, { ok: true, item: result.rows[0] });
      return;
    }

    if (request.method === "PUT" && id) {
      const body = await readJsonBody(request);
      const assignments = config.fields.map(([name], index) => `${name}=$${index + 3}`);
      const values = [id, user.organization_id, ...config.fields.map(([name, mapper]) => mapper(body[name]))];
      const result = await pool.query(
        `UPDATE ${config.table} SET ${assignments.join(", ")} WHERE id=$1 AND organization_id=$2 RETURNING *`,
        values
      );
      if (!result.rows[0]) {
        sendJson(response, 404, { ok: false, message: "Ma'lumot topilmadi" });
        return;
      }
      await writeAudit(pool, user, "update", config.table, id, body);
      sendJson(response, 200, { ok: true, item: result.rows[0] });
      return;
    }

    if (request.method === "DELETE" && id) {
      const hasArchive = ["rooms", "payment_types", "finance_transactions"].includes(config.table);
      const result = await pool.query(
        hasArchive
          ? `UPDATE ${config.table} SET archived_at=NOW() WHERE id=$1 AND organization_id=$2 RETURNING id`
          : `DELETE FROM ${config.table} WHERE id=$1 AND organization_id=$2 RETURNING id`,
        [id, user.organization_id]
      );
      if (!result.rows[0]) {
        sendJson(response, 404, { ok: false, message: "Ma'lumot topilmadi" });
        return;
      }
      await writeAudit(pool, user, "delete", config.table, id);
      sendJson(response, 200, { ok: true });
      return;
    }

    sendJson(response, 405, { ok: false, message: "Method not allowed" });
  } catch (error) {
    withError(response, `Simple CRUD ${config.table}`, error);
  }
}

async function handleStaffAttendanceRequest(request, response, action = "", id = null) {
  try {
    const user = await requireUser(request, response, request.method === "GET" ? "read" : "attendance:write");
    if (!user) return;
    const pool = getDbPool();
    if (request.method === "GET") {
      const result = await pool.query(
        `SELECT sa.*, COALESCE(t.full_name, u.full_name, 'Xodim') AS employee_name
         FROM staff_attendance sa
         LEFT JOIN teachers t ON t.id=sa.employee_id AND t.organization_id=sa.organization_id
         LEFT JOIN users u ON u.id=sa.employee_id
         WHERE sa.organization_id=$1
         ORDER BY sa.date DESC, sa.id DESC`,
        [user.organization_id]
      );
      sendJson(response, 200, { ok: true, items: result.rows });
      return;
    }
    if (request.method === "POST" && ["check-in", "check-out"].includes(action)) {
      const body = await readJsonBody(request);
      const employeeId = body.employee_id || user.id;
      const date = asDate(body.date) || new Date().toISOString().slice(0, 10);
      const column = action === "check-in" ? "check_in" : "check_out";
      const status = action === "check-in" ? "present" : "completed";
      const result = await pool.query(
        `INSERT INTO staff_attendance (organization_id, employee_id, date, ${column}, status, note)
         VALUES ($1,$2,$3,CURRENT_TIME,$4,$5)
         ON CONFLICT DO NOTHING
         RETURNING *`,
        [user.organization_id, employeeId, date, status, asText(body.note)]
      );
      if (!result.rows[0]) {
        const updated = await pool.query(
          `UPDATE staff_attendance SET ${column}=CURRENT_TIME, status=$4, note=COALESCE(NULLIF($5,''), note)
           WHERE organization_id=$1 AND employee_id=$2 AND date=$3::date RETURNING *`,
          [user.organization_id, employeeId, date, status, asText(body.note)]
        );
        sendJson(response, 200, { ok: true, item: updated.rows[0] });
        return;
      }
      sendJson(response, 201, { ok: true, item: result.rows[0] });
      return;
    }
    if (request.method === "PUT" && id) {
      const body = await readJsonBody(request);
      const result = await pool.query(
        `UPDATE staff_attendance SET status=$3, note=$4, check_in=COALESCE($5::time, check_in), check_out=COALESCE($6::time, check_out)
         WHERE id=$1 AND organization_id=$2 RETURNING *`,
        [id, user.organization_id, asText(body.status, "present"), asText(body.note), body.check_in || null, body.check_out || null]
      );
      sendJson(response, 200, { ok: true, item: result.rows[0] });
      return;
    }
    sendJson(response, 405, { ok: false, message: "Method not allowed" });
  } catch (error) {
    withError(response, "Staff attendance", error);
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

    await sendLandingTelegramMessage(message);
    sendJson(response, 200, { ok: true, message: "Telegram test message sent" });
  } catch (error) {
    console.error(`Telegram test failed: ${safeTelegramErrorMessage(error)}`);
    sendJson(response, 500, { ok: false, message: safeTelegramErrorMessage(error) });
  }
}

async function handleTelegramHealth(response, shouldCheckTelegram) {
  const config = getLandingTelegramConfig({ allowMissing: true });
  const payload = {
    ok: true,
    configured: config.tokenPresent && config.chatIdCount > 0,
    tokenPresent: config.tokenPresent,
    chatIdCount: config.chatIdCount,
    tokenEnvName: config.tokenEnvName || null,
    chatEnvName: config.chatEnvName || null,
    supportedTokenEnv: ["LANDING_BOT_TOKEN", "TELEGRAM_BOT_TOKEN"],
    supportedChatEnv: ["LANDING_CHAT_ID", "TELEGRAM_CHAT_ID"]
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

const studentAppDefaultModules = [
  ["home", "Bosh sahifa", "Bugungi dars, to'lov, davomat va coin balans", "home", 10],
  ["schedule", "Jadval", "Dars kunlari, vaqt va xona", "calendar", 20],
  ["payments", "To'lovlar", "Balans, qarzdorlik va to'lov tarixi", "wallet", 30],
  ["attendance", "Davomat", "Davomat foizi va tarix", "check-circle", 40],
  ["coins", "Coinlar", "O'qituvchi bergan coinlar tarixi", "coins", 50],
  ["rewards", "Sovg'alar do'koni", "Coin evaziga sovg'alar olish", "gift", 60],
  ["rating", "Reyting", "Coin va natijalar bo'yicha reyting", "trophy", 70],
  ["achievements", "Yutuqlar", "Medal, streak va progress", "badge", 80],
  ["materials", "Materiallar", "PDF va video dars materiallari", "book-open", 90],
  ["notifications", "Bildirishnomalar", "To'lov, dars va coin xabarlari", "bell", 100]
];

function studentAppSecret() {
  const secret = String(process.env.STUDENT_APP_SESSION_SECRET || "").trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    console.warn("STUDENT_APP_SESSION_SECRET is not configured");
  }
  return "local-student-app-session-secret";
}

function hashStudentAppToken(token) {
  return crypto.createHmac("sha256", studentAppSecret()).update(String(token || "")).digest("hex");
}

function rawStudentAppToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function maskedName(fullName) {
  const text = asText(fullName, "O'quvchi");
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return `${parts[0]?.slice(0, 1) || "O"}***`;
  return `${parts[0]} ${parts[1].slice(0, 1)}.`;
}

function studentPublic(row) {
  if (!row) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    fullName: row.full_name,
    phone: row.phone,
    parentPhone: row.parent_phone,
    birthDate: row.birth_date,
    address: row.address,
    courseName: row.course_name,
    groupId: row.group_id,
    groupName: row.group_name,
    status: row.status,
    balance: Number(row.balance || 0),
    crystals: Number(row.crystals || 0),
    coins: Number(row.coins || 0),
    referralCode: row.referral_code,
    avatarUrl: row.avatar_url,
    lastStudentAppLogin: row.last_student_app_login,
    appPasswordResetRequired: Boolean(row.app_password_reset_required)
  };
}

function studentAppWebUrl(organization, token = "") {
  const base = getStudentWebAppUrlBase();
  const url = new URL(base);
  const cleanPath = url.pathname.replace(/\/+$/, "");
  if (cleanPath === "" || cleanPath.endsWith("/student-app") || cleanPath.endsWith("/app")) {
    url.pathname = `${cleanPath || "/app"}/home`;
  }
  if (token) url.searchParams.set("token", token);
  return url.toString();
}

async function ensureStudentAppDefaults(pool, organizationId) {
  if (!organizationId) return;
  await pool.query(
    `INSERT INTO student_app_settings (organization_id)
     VALUES ($1)
     ON CONFLICT (organization_id) DO NOTHING`,
    [organizationId]
  );

  for (const [key, title, description, icon, sortOrder] of studentAppDefaultModules) {
    await pool.query(
      `INSERT INTO student_app_modules (organization_id, key, title, description, icon, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (organization_id, key) DO NOTHING`,
      [organizationId, key, title, description, icon, sortOrder]
    );
  }
}

async function organizationBySubdomain(pool, subdomain) {
  const clean = String(subdomain || "").trim().toLowerCase();
  if (!clean) return null;
  const result = await pool.query(
    "SELECT * FROM organizations WHERE LOWER(COALESCE(subdomain, slug))=$1 OR LOWER(slug)=$1 LIMIT 1",
    [clean]
  );
  return result.rows[0] || null;
}

async function findStudentsByPhone(pool, phone, options = {}) {
  const normalized = normalizePhone(phone);
  const params = [`%${normalized.slice(-9)}%`];
  let where = "WHERE regexp_replace(COALESCE(s.phone,''), '\\D', '', 'g') LIKE $1 AND s.student_app_enabled=TRUE AND s.student_app_blocked=FALSE";

  if (options.organizationId) {
    params.push(options.organizationId);
    where += ` AND s.organization_id=$${params.length}`;
  }

  if (options.subdomain) {
    const org = await organizationBySubdomain(pool, options.subdomain);
    if (org?.id) {
      params.push(org.id);
      where += ` AND s.organization_id=$${params.length}`;
    }
  }

  const result = await pool.query(
    `SELECT s.*, o.name AS organization_name, o.slug AS organization_slug, COALESCE(o.subdomain, o.slug) AS organization_subdomain
     FROM students s
     JOIN organizations o ON o.id=s.organization_id
     ${where}
     ORDER BY s.id DESC
     LIMIT 10`,
    params
  );
  return result.rows;
}

async function createStudentAppSession(pool, student, meta = {}) {
  const token = rawStudentAppToken();
  const days = Math.max(1, Number(meta.sessionDays || 30));
  await pool.query(
    `INSERT INTO student_app_sessions (student_id, organization_id, telegram_user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1,$2,$3,$4,NOW() + ($5::text || ' days')::interval,$6,$7)`,
    [
      student.id,
      student.organization_id,
      meta.telegramUserId || student.telegram_user_id || null,
      hashStudentAppToken(token),
      String(days),
      meta.userAgent || "",
      meta.ipAddress || ""
    ]
  );
  return token;
}

async function createLinkedStudentAppSession(student, telegramUserId, telegramChatId) {
  const pool = getDbPool();
  await ensureSchema(pool);
  await ensureStudentAppDefaults(pool, student.organization_id);
  await pool.query(
    "UPDATE students SET telegram_user_id=$2, telegram_chat_id=$3, last_student_app_login=NOW() WHERE id=$1",
    [student.id, telegramUserId || null, telegramChatId || null]
  );
  const token = await createStudentAppSession(pool, student, {
    telegramUserId,
    userAgent: "telegram-bot",
    ipAddress: "telegram"
  });
  return {
    token,
    webAppUrl: studentAppWebUrl({ subdomain: student.organization_subdomain, slug: student.organization_slug }, token)
  };
}

async function requireStudentAppSession(request, response) {
  try {
    const authorization = String(request.headers.authorization || "");
    const headerToken = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
    const queryToken = requestQuery(request).get("token");
    const token = headerToken || queryToken;

    if (!token) {
      sendJson(response, 401, { ok: false, message: "Sessiya topilmadi" });
      return null;
    }

    const pool = getDbPool();
    await ensureSchema(pool);
    const result = await pool.query(
      `SELECT s.*, sess.id AS session_id, sess.expires_at, o.name AS organization_name, o.slug AS organization_slug,
              COALESCE(o.subdomain, o.slug) AS organization_subdomain, o.phone AS organization_phone
       FROM student_app_sessions sess
       JOIN students s ON s.id=sess.student_id AND s.organization_id=sess.organization_id
       JOIN organizations o ON o.id=s.organization_id
       WHERE sess.token_hash=$1
         AND sess.revoked_at IS NULL
         AND sess.expires_at > NOW()
         AND s.student_app_enabled=TRUE
         AND s.student_app_blocked=FALSE
       LIMIT 1`,
      [hashStudentAppToken(token)]
    );

    if (!result.rows[0]) {
      sendJson(response, 401, { ok: false, message: "Sessiya muddati tugagan" });
      return null;
    }

    await pool.query("UPDATE student_app_sessions SET last_used_at=NOW() WHERE id=$1", [result.rows[0].session_id]);
    return { pool, row: result.rows[0], token };
  } catch (error) {
    withError(response, "Student app session", error);
    return null;
  }
}

function fallbackStudentAppPayload() {
  throw new Error("Student App demo payload Eduka 19.7 da o'chirilgan. Real student session talab qilinadi.");
}

async function studentAppBasePayload(pool, row) {
  await ensureStudentAppDefaults(pool, row.organization_id);
  const [settings, modules, events, news, library, dictionary, exams, mockExams, referrals, extraLessons, feedback, payments, groups, attendance] = await Promise.all([
    pool.query("SELECT * FROM student_app_settings WHERE organization_id=$1 LIMIT 1", [row.organization_id]),
    pool.query("SELECT * FROM student_app_modules WHERE organization_id=$1 ORDER BY sort_order ASC, id ASC", [row.organization_id]),
    pool.query("SELECT * FROM student_events WHERE organization_id=$1 AND status='active' ORDER BY event_date ASC NULLS LAST, id DESC LIMIT 20", [row.organization_id]),
    pool.query("SELECT * FROM student_news WHERE organization_id=$1 AND status='published' ORDER BY publish_date DESC NULLS LAST, id DESC LIMIT 20", [row.organization_id]),
    pool.query("SELECT * FROM student_library_items WHERE organization_id=$1 AND status='published' ORDER BY id DESC LIMIT 100", [row.organization_id]),
    pool.query("SELECT * FROM student_dictionary_words WHERE organization_id=$1 AND status='published' ORDER BY word ASC LIMIT 200", [row.organization_id]),
    pool.query("SELECT * FROM student_exam_results WHERE organization_id=$1 AND student_id=$2 ORDER BY exam_date DESC NULLS LAST, id DESC", [row.organization_id, row.id]),
    pool.query("SELECT * FROM student_mock_exams WHERE organization_id=$1 AND status='active' ORDER BY exam_date ASC NULLS LAST, id DESC", [row.organization_id]),
    pool.query("SELECT * FROM student_referrals WHERE organization_id=$1 AND referrer_student_id=$2 ORDER BY id DESC", [row.organization_id, row.id]),
    pool.query("SELECT r.*, t.full_name AS teacher_name FROM student_extra_lesson_requests r LEFT JOIN teachers t ON t.id=r.teacher_id WHERE r.organization_id=$1 AND r.student_id=$2 ORDER BY r.id DESC", [row.organization_id, row.id]),
    pool.query("SELECT * FROM student_feedback WHERE organization_id=$1 AND student_id=$2 ORDER BY id DESC", [row.organization_id, row.id]),
    pool.query("SELECT p.*, g.name AS group_name FROM payments p LEFT JOIN groups g ON g.id=p.group_id WHERE p.organization_id=$1 AND p.student_id=$2 ORDER BY p.paid_at DESC", [row.organization_id, row.id]),
    pool.query("SELECT g.*, t.full_name AS teacher_name FROM groups g LEFT JOIN teachers t ON t.id=g.teacher_id WHERE g.organization_id=$1 AND (g.id=$2 OR g.id IN (SELECT group_id FROM group_students WHERE organization_id=$1 AND student_id=$3)) ORDER BY g.id DESC", [row.organization_id, row.group_id, row.id]),
    pool.query("SELECT * FROM attendance_records WHERE organization_id=$1 AND student_id=$2 ORDER BY lesson_date DESC LIMIT 60", [row.organization_id, row.id])
  ]);

  const paid = payments.rows.reduce((sum, item) => sum + Number(item.amount || 0) + Number(item.discount || 0), 0);
  const due = payments.rows.reduce((sum, item) => sum + Number(item.due_amount || 0), 0);
  const balance = Number(row.balance || Math.max(due - paid, 0));
  const present = attendance.rows.filter((item) => ["present", "online"].includes(item.status)).length;
  const attendancePercent = attendance.rows.length ? Math.round((present / attendance.rows.length) * 100) : 0;
  const student = studentPublic({ ...row, balance, group_name: groups.rows[0]?.name || row.group_name });

  return {
    student,
    organization: {
      id: row.organization_id,
      name: row.organization_name,
      subdomain: row.organization_subdomain,
      phone: row.organization_phone
    },
    settings: settings.rows[0] || {},
    modules: modules.rows,
    events: events.rows,
    news: news.rows,
    library: library.rows,
    dictionary: dictionary.rows,
    exams: exams.rows,
    mockExams: mockExams.rows,
    referrals: referrals.rows,
    extraLessons: extraLessons.rows,
    feedback: feedback.rows,
    payments: payments.rows,
    groups: groups.rows.map((group) => ({ ...group, attendance_percent: attendancePercent })),
    attendance: attendance.rows,
    lessons: groups.rows.map((group) => ({
      id: group.id,
      title: group.course_name || group.name,
      group_name: group.name,
      teacher_name: group.teacher_name || group.teacher_full_name,
      room: group.room,
      time: `${String(group.start_time || "09:00").slice(0, 5)} - ${String(group.end_time || "10:30").slice(0, 5)}`,
      status: "in_progress"
    })),
    ranking: [
      { student_id: row.id, full_name: row.full_name, score: Number(row.crystals || 0) + 160 },
      { student_id: 0, full_name: "Akbar", score: 320 },
      { student_id: -1, full_name: "Yahyobek", score: 210 }
    ].sort((a, b) => b.score - a.score),
    paymentSummary: { due, paid, balance }
  };
}

async function handleStudentAppAuthPhone(request, response) {
  try {
    const body = await readJsonBody(request);
    if (!process.env.DATABASE_URL) {
      sendJson(response, 503, { ok: false, found: false, message: "DATABASE_URL sozlanmagan" });
      return;
    }
    const pool = getDbPool();
    await ensureSchema(pool);
    const rows = await findStudentsByPhone(pool, body.phone, { organizationId: body.organization_id, subdomain: body.subdomain || tenantSubdomainFromRequest(request) });
    if (!rows.length) {
      sendJson(response, 200, { ok: true, found: false, message: "Bu telefon raqam bo'yicha o'quvchi topilmadi" });
      return;
    }
    sendJson(response, 200, {
      ok: true,
      found: true,
      requiresPassword: true,
      multipleOrganizations: rows.length > 1,
      maskedStudentName: maskedName(rows[0].full_name),
      organizationName: rows[0].organization_name,
      organizations: rows.map((row) => ({ id: row.organization_id, name: row.organization_name, subdomain: row.organization_subdomain }))
    });
  } catch (error) {
    withError(response, "Student app phone auth", error);
  }
}

async function studentAppPasswordLogin(payload, meta = {}) {
  const pool = getDbPool();
  await ensureSchema(pool);
  const rows = await findStudentsByPhone(pool, payload.phone, { organizationId: payload.organization_id, subdomain: payload.subdomain });
  const student = rows[0];
  if (!student) {
    const error = new Error("Bu telefon raqam bo'yicha o'quvchi topilmadi");
    error.statusCode = 404;
    throw error;
  }
  const password = String(payload.password || "");
  const normalizedStudentPhone = normalizePhone(student.phone);
  const temporaryPassword = normalizedStudentPhone.slice(-4);
  const demoPasswordEnabled = process.env.NODE_ENV !== "production" && process.env.STUDENT_APP_DEMO_PASSWORD;
  const configuredDemoPassword = demoPasswordEnabled ? String(process.env.STUDENT_APP_DEMO_PASSWORD) : "";
  const valid = student.app_password_hash
    ? verifyPassword(password, student.app_password_hash)
    : (password && (password === temporaryPassword || (demoPasswordEnabled && normalizedStudentPhone === "998931949200" && password === configuredDemoPassword)));
  if (!valid) {
    const error = new Error("Telefon raqam yoki parol noto'g'ri");
    error.statusCode = 401;
    throw error;
  }
  await ensureStudentAppDefaults(pool, student.organization_id);
  await pool.query(
    `UPDATE students
     SET telegram_user_id=COALESCE($2, telegram_user_id),
         telegram_chat_id=COALESCE($3, telegram_chat_id),
         last_student_app_login=NOW(),
         referral_code=COALESCE(referral_code, $4)
     WHERE id=$1`,
    [student.id, payload.telegram_user_id || null, payload.telegram_chat_id || null, `EDU${student.id}`]
  );
  const refreshed = { ...student, telegram_user_id: payload.telegram_user_id || student.telegram_user_id, telegram_chat_id: payload.telegram_chat_id || student.telegram_chat_id };
  const settings = await pool.query("SELECT session_days FROM student_app_settings WHERE organization_id=$1 LIMIT 1", [student.organization_id]);
  const token = await createStudentAppSession(pool, refreshed, {
    telegramUserId: payload.telegram_user_id,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
    sessionDays: settings.rows[0]?.session_days || 30
  });
  return {
    token,
    student: studentPublic(refreshed),
    organization: {
      id: student.organization_id,
      name: student.organization_name,
      subdomain: student.organization_subdomain
    },
    webAppUrl: studentAppWebUrl({ subdomain: student.organization_subdomain, slug: student.organization_slug }, token)
  };
}

async function handleStudentAppAuthPassword(request, response) {
  try {
    const body = await readJsonBody(request);
    const payload = await studentAppPasswordLogin(body, { userAgent: request.headers["user-agent"], ipAddress: clientIp(request) });
    sendJson(response, 200, { ok: true, ...payload });
  } catch (error) {
    sendJson(response, error.statusCode || 500, { ok: false, message: error.message });
  }
}

async function handleStudentAppLogout(request, response) {
  const session = await requireStudentAppSession(request, response);
  if (!session) return;
  await session.pool.query("UPDATE student_app_sessions SET revoked_at=NOW() WHERE token_hash=$1", [hashStudentAppToken(session.token)]);
  sendJson(response, 200, { ok: true, message: "Siz Student App'dan chiqdingiz" });
}

async function handleStudentAppMe(request, response) {
  if (!process.env.DATABASE_URL) {
    sendJson(response, 503, { ok: false, message: "Student App real rejimda ishlashi uchun DATABASE_URL sozlanishi shart" });
    return;
  }
  const session = await requireStudentAppSession(request, response);
  if (!session) return;
  const payload = await studentAppBasePayload(session.pool, session.row);
  sendJson(response, 200, { ok: true, ...payload });
}

async function handleStudentAppData(request, response, resource) {
  if (!process.env.DATABASE_URL) {
    sendJson(response, 503, { ok: false, message: "Student App real rejimda ishlashi uchun DATABASE_URL sozlanishi shart" });
    return;
  }
  const session = await requireStudentAppSession(request, response);
  if (!session) return;
  const payload = await studentAppBasePayload(session.pool, session.row);
  const responses = {
    home: payload,
    profile: payload,
    group: { student: payload.student, groups: payload.groups, attendance: payload.attendance },
    study: { lessons: payload.lessons, groups: payload.groups },
    rating: { ranking: payload.ranking, student: payload.student },
    library: { items: payload.library },
    dictionary: { items: payload.dictionary },
    exams: { exams: payload.exams, mockExams: payload.mockExams },
    referrals: { referrals: payload.referrals, referralCode: payload.student.referralCode },
    news: { news: payload.news, events: payload.events },
    payments: { payments: payload.payments, student: payload.student, paymentSummary: payload.paymentSummary },
    settings: { settings: payload.settings }
  };
  sendJson(response, 200, { ok: true, ...(responses[resource] || payload) });
}

async function handleStudentAppExtraLessonRegister(request, response) {
  const session = await requireStudentAppSession(request, response);
  if (!session) return;
  const body = await readJsonBody(request);
  const result = await session.pool.query(
    `INSERT INTO student_extra_lesson_requests (organization_id, student_id, teacher_id, requested_date, requested_time, purpose, price)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [session.row.organization_id, session.row.id, body.teacher_id || null, asDate(body.date), asText(body.time), asText(body.purpose), asNumber(body.price)]
  );
  sendJson(response, 201, { ok: true, item: result.rows[0], message: "Qo'shimcha dars so'rovi yuborildi" });
}

async function handleStudentAppFeedback(request, response) {
  const session = await requireStudentAppSession(request, response);
  if (!session) return;
  const body = await readJsonBody(request);
  if (!asText(body.message)) {
    sendJson(response, 400, { ok: false, message: "Xabar matni majburiy" });
    return;
  }
  const result = await session.pool.query(
    `INSERT INTO student_feedback (organization_id, student_id, type, subject, message)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [session.row.organization_id, session.row.id, asText(body.type, "Savol"), asText(body.subject), asText(body.message)]
  );
  sendJson(response, 201, { ok: true, item: result.rows[0], message: "Murojaatingiz yuborildi" });
}

async function handleStudentAppSettingsUpdate(request, response) {
  const session = await requireStudentAppSession(request, response);
  if (!session) return;
  const body = await readJsonBody(request);
  sendJson(response, 200, { ok: true, settings: body, message: "Sozlamalar saqlandi" });
}

async function handleStudentAppReferralShare(request, response) {
  const session = await requireStudentAppSession(request, response);
  if (!session) return;
  const code = session.row.referral_code || `EDU${session.row.id}`;
  const link = `https://${process.env.BASE_DOMAIN || "eduka.uz"}/?ref=${encodeURIComponent(code)}`;
  sendJson(response, 200, { ok: true, referralLink: link });
}

const studentAppAdminTables = {
  rewards: {
    table: "student_reward_products",
    fields: ["title", "description", "image_url", "coin_price", "stock", "category", "status"],
    defaults: { coin_price: 0, stock: 0, category: "Boshqalar", status: "active" },
    search: ["title", "description", "category", "status"]
  },
  "reward-redemptions": {
    table: "student_reward_redemptions",
    fields: ["student_id", "product_id", "product_title", "coin_price", "status", "admin_note"],
    defaults: { status: "pending" },
    search: ["product_title", "status", "admin_note"]
  },
  "coin-transactions": {
    table: "student_coin_transactions",
    fields: ["student_id", "teacher_id", "amount", "type", "reason", "source"],
    defaults: { type: "award", source: "admin_panel", amount: 0 },
    search: ["type", "reason", "source"]
  },
  achievements: {
    table: "student_achievements",
    fields: ["student_id", "key", "title", "description", "icon", "progress", "target", "completed_at"],
    defaults: { progress: 0, target: 1 },
    search: ["key", "title", "description"]
  },
  materials: {
    table: "student_library_items",
    fields: ["title", "type", "description", "cover_url", "file_url", "external_url", "course_id", "level", "status"],
    defaults: { type: "pdf", status: "published" },
    search: ["title", "type", "description"]
  },
  dictionary: {
    table: "student_dictionary_words",
    fields: ["word", "translation", "pronunciation", "example", "level", "category", "status"],
    defaults: { status: "published" },
    search: ["word", "translation", "category"]
  },
  library: {
    table: "student_library_items",
    fields: ["title", "type", "description", "cover_url", "file_url", "external_url", "course_id", "level", "status"],
    defaults: { type: "book", status: "published" },
    search: ["title", "type", "description"]
  },
  news: {
    table: "student_news",
    fields: ["title", "description", "image_url", "publish_date", "target_type", "target_group_id", "status"],
    defaults: { target_type: "all", status: "published" },
    search: ["title", "description"]
  },
  events: {
    table: "student_events",
    fields: ["title", "description", "image_url", "event_date", "event_time", "registration_enabled", "status"],
    defaults: { registration_enabled: false, status: "active" },
    search: ["title", "description"]
  },
  "mock-exams": {
    table: "student_mock_exams",
    fields: ["title", "description", "exam_date", "price", "registration_enabled", "status"],
    defaults: { registration_enabled: true, status: "active" },
    search: ["title", "description"]
  },
  exams: {
    table: "student_exam_results",
    fields: ["student_id", "title", "score", "max_score", "grade", "exam_date", "status"],
    defaults: { max_score: 100, status: "published" },
    search: ["title", "grade", "status"]
  },
  "extra-lessons": {
    table: "student_extra_lesson_requests",
    fields: ["student_id", "teacher_id", "requested_date", "requested_time", "purpose", "price", "status", "admin_note"],
    defaults: { status: "pending" },
    search: ["purpose", "status", "admin_note"]
  },
  referrals: {
    table: "student_referrals",
    fields: ["referrer_student_id", "referred_name", "referred_phone", "referred_student_id", "status", "reward_type", "reward_amount"],
    defaults: { status: "new", reward_type: "crystal", reward_amount: 0 },
    search: ["referred_name", "referred_phone", "status"]
  },
  feedback: {
    table: "student_feedback",
    fields: ["student_id", "type", "subject", "message", "status", "admin_reply"],
    defaults: { status: "new" },
    search: ["type", "subject", "message", "status"]
  }
};

async function handleAdminStudentAppDashboard(request, response) {
  try {
    const user = await requireUser(request, response, "read");
    if (!user) return;
    const pool = getDbPool();
    await ensureSchema(pool);
    await ensureStudentAppDefaults(pool, user.organization_id);
    const [result, latestLogins, latestReferrals, latestFeedback] = await Promise.all([
      pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM students WHERE organization_id=$1 AND student_app_enabled=TRUE) AS enabled_students,
        (SELECT COUNT(*)::int FROM students WHERE organization_id=$1 AND telegram_chat_id IS NOT NULL) AS telegram_linked,
        (SELECT COUNT(*)::int FROM students WHERE organization_id=$1 AND last_student_app_login::date=CURRENT_DATE) AS today_logins,
        (SELECT COUNT(*)::int FROM student_app_sessions WHERE organization_id=$1 AND revoked_at IS NULL AND expires_at > NOW()) AS active_sessions,
        (SELECT COUNT(*)::int FROM student_referrals WHERE organization_id=$1) AS referrals,
        (SELECT COUNT(*)::int FROM student_library_items WHERE organization_id=$1) AS library_items,
        (SELECT COUNT(*)::int FROM student_dictionary_words WHERE organization_id=$1) AS dictionary_words,
        (SELECT COUNT(*)::int FROM student_extra_lesson_requests WHERE organization_id=$1 AND status='pending') AS extra_lesson_requests,
        (SELECT COUNT(*)::int FROM student_feedback WHERE organization_id=$1 AND status='new') AS latest_feedback`,
        [user.organization_id]
      ),
      pool.query(
        `SELECT id, full_name, phone, last_student_app_login
         FROM students
         WHERE organization_id=$1 AND last_student_app_login IS NOT NULL
         ORDER BY last_student_app_login DESC
         LIMIT 8`,
        [user.organization_id]
      ),
      pool.query(
        `SELECT r.*, s.full_name AS referrer_name
         FROM student_referrals r
         LEFT JOIN students s ON s.id=r.referrer_student_id
         WHERE r.organization_id=$1
         ORDER BY r.id DESC
         LIMIT 8`,
        [user.organization_id]
      ),
      pool.query(
        `SELECT f.*, s.full_name AS student_name
         FROM student_feedback f
         LEFT JOIN students s ON s.id=f.student_id
         WHERE f.organization_id=$1
         ORDER BY f.id DESC
         LIMIT 8`,
        [user.organization_id]
      )
    ]);
    sendJson(response, 200, {
      ok: true,
      summary: result.rows[0],
      latestLogins: latestLogins.rows,
      latestReferrals: latestReferrals.rows,
      latestFeedback: latestFeedback.rows
    });
  } catch (error) {
    withError(response, "Student app dashboard", error);
  }
}

async function handleAdminStudentAppSettings(request, response) {
  try {
    const user = await requireUser(request, response, request.method === "GET" ? "read" : "settings:write");
    if (!user) return;
    const pool = getDbPool();
    await ensureSchema(pool);
    await ensureStudentAppDefaults(pool, user.organization_id);
    if (request.method === "GET") {
      const result = await pool.query("SELECT * FROM student_app_settings WHERE organization_id=$1 LIMIT 1", [user.organization_id]);
      sendJson(response, 200, { ok: true, settings: result.rows[0] });
      return;
    }
    const body = await readJsonBody(request);
    const result = await pool.query(
      `UPDATE student_app_settings SET
        enabled=$2, crystals_enabled=$3, coins_enabled=$4, rating_enabled=$5, referral_enabled=$6,
        library_enabled=$7, dictionary_enabled=$8, extra_lessons_enabled=$9, exams_enabled=$10,
        news_enabled=$11, payments_enabled=$12, complaints_enabled=$13, theme_primary=$14,
        app_name=$15, support_text=$16, session_days=$17, updated_at=NOW()
       WHERE organization_id=$1 RETURNING *`,
      [
        user.organization_id,
        body.enabled !== false,
        body.crystals_enabled !== false,
        body.coins_enabled !== false,
        body.rating_enabled !== false,
        body.referral_enabled !== false,
        body.library_enabled !== false,
        body.dictionary_enabled !== false,
        body.extra_lessons_enabled !== false,
        body.exams_enabled !== false,
        body.news_enabled !== false,
        body.payments_enabled !== false,
        body.complaints_enabled !== false,
        asText(body.theme_primary, "#0A84FF"),
        asText(body.app_name, "Eduka Student App"),
        asText(body.support_text),
        Math.max(1, Number(body.session_days || 30))
      ]
    );
    sendJson(response, 200, { ok: true, settings: result.rows[0] });
  } catch (error) {
    withError(response, "Student app settings", error);
  }
}

async function handleAdminStudentAppModules(request, response) {
  try {
    const user = await requireUser(request, response, request.method === "GET" ? "read" : "settings:write");
    if (!user) return;
    const pool = getDbPool();
    await ensureSchema(pool);
    await ensureStudentAppDefaults(pool, user.organization_id);
    if (request.method === "GET") {
      const result = await pool.query("SELECT * FROM student_app_modules WHERE organization_id=$1 ORDER BY sort_order, id", [user.organization_id]);
      sendJson(response, 200, { ok: true, items: result.rows });
      return;
    }
    const body = await readJsonBody(request);
    const modules = Array.isArray(body.modules) ? body.modules : [];
    const saved = [];
    for (const item of modules) {
      const result = await pool.query(
        `UPDATE student_app_modules SET title=$3, description=$4, icon=$5, enabled=$6, sort_order=$7
         WHERE id=$1 AND organization_id=$2 RETURNING *`,
        [item.id, user.organization_id, asText(item.title), asText(item.description), asText(item.icon), item.enabled !== false, asNumber(item.sort_order)]
      );
      if (result.rows[0]) saved.push(result.rows[0]);
    }
    sendJson(response, 200, { ok: true, items: saved });
  } catch (error) {
    withError(response, "Student app modules", error);
  }
}

async function handleAdminStudentAppAccess(request, response, action = "", studentId = null) {
  try {
    const user = await requireUser(request, response, action ? "students:write" : "students:read");
    if (!user) return;
    const pool = getDbPool();
    await ensureSchema(pool);
    if (!action) {
      const result = await pool.query(
        `SELECT s.id, s.full_name, s.phone, s.telegram_user_id, s.telegram_chat_id,
                s.student_app_enabled, s.student_app_blocked, s.app_password_set_at,
                s.app_password_reset_required, s.last_student_app_login, s.course_name,
                COALESCE(g.name, s.group_name) AS group_name,
                CASE
                  WHEN s.app_password_hash IS NULL THEN 'temporary_last4'
                  WHEN s.app_password_reset_required THEN 'reset_required'
                  ELSE 'set'
                END AS password_state
         FROM students s
         LEFT JOIN groups g ON g.id=s.group_id AND g.organization_id=s.organization_id
         WHERE s.organization_id=$1
         ORDER BY s.id DESC`,
        [user.organization_id]
      );
      sendJson(response, 200, { ok: true, items: result.rows });
      return;
    }
    const student = await pool.query("SELECT * FROM students WHERE id=$1 AND organization_id=$2", [studentId, user.organization_id]);
    if (!student.rows[0]) {
      sendJson(response, 404, { ok: false, message: "O'quvchi topilmadi" });
      return;
    }
    if (action === "enable" || action === "disable") {
      const enabled = action === "enable";
      await pool.query("UPDATE students SET student_app_enabled=$3, student_app_blocked=$4 WHERE id=$1 AND organization_id=$2", [studentId, user.organization_id, enabled, !enabled]);
      sendJson(response, 200, { ok: true, message: enabled ? "Student App faollashtirildi" : "Student App o'chirildi" });
      return;
    }
    if (action === "unlink-telegram") {
      await pool.query("UPDATE students SET telegram_user_id=NULL, telegram_chat_id=NULL WHERE id=$1 AND organization_id=$2", [studentId, user.organization_id]);
      sendJson(response, 200, { ok: true, message: "Telegram bog'lanishi uzildi" });
      return;
    }
    if (action === "generate-password" || action === "reset-password") {
      const password = String(crypto.randomInt(100000, 999999));
      await pool.query(
        `UPDATE students
         SET app_password_hash=$3, app_password_set_at=NOW(), app_password_reset_required=$4
         WHERE id=$1 AND organization_id=$2`,
        [studentId, user.organization_id, hashPassword(password), action === "reset-password"]
      );
      sendJson(response, 200, {
        ok: true,
        password,
        instruction: "Telegram botga kiring, telefon raqamingizni yuboring va parolingizni kiriting."
      });
      return;
    }
    if (action === "send-instruction") {
      const sent = await sendStudentTelegramMessage(pool, student.rows[0], "Telegram botga kiring, telefon raqamingizni yuboring va parolingizni kiriting.");
      sendJson(response, sent.ok ? 200 : 409, sent);
      return;
    }
    sendJson(response, 404, { ok: false, message: "Amal topilmadi" });
  } catch (error) {
    withError(response, "Student app access", error);
  }
}

async function handleAdminStudentAppTable(request, response, key, id = null) {
  const config = studentAppAdminTables[key];
  if (!config) {
    sendJson(response, 404, { ok: false, message: "Bo'lim topilmadi" });
    return;
  }
  try {
    const permission = request.method === "GET" ? "read" : "settings:write";
    const user = await requireUser(request, response, permission);
    if (!user) return;
    const pool = getDbPool();
    await ensureSchema(pool);
    if (request.method === "GET") {
      const query = requestQuery(request);
      const search = asText(query.get("search"));
      const params = [user.organization_id];
      let where = "WHERE organization_id=$1";
      if (search && config.search?.length) {
        params.push(`%${search}%`);
        where += ` AND (${config.search.map((field) => `${field} ILIKE $${params.length}`).join(" OR ")})`;
      }
      const result = await pool.query(`SELECT * FROM ${config.table} ${where} ORDER BY id DESC LIMIT 300`, params);
      sendJson(response, 200, { ok: true, items: result.rows });
      return;
    }
    if (request.method === "DELETE" && id) {
      await pool.query(`DELETE FROM ${config.table} WHERE id=$1 AND organization_id=$2`, [id, user.organization_id]);
      sendJson(response, 200, { ok: true });
      return;
    }
    const body = await readJsonBody(request);
    const values = config.fields.map((field) => hasOwn(body, field) ? body[field] : config.defaults[field] ?? null);
    if (request.method === "POST") {
      const columns = ["organization_id", ...config.fields];
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(",");
      const result = await pool.query(
        `INSERT INTO ${config.table} (${columns.join(",")}) VALUES (${placeholders}) RETURNING *`,
        [user.organization_id, ...values]
      );
      sendJson(response, 201, { ok: true, item: result.rows[0] });
      return;
    }
    if (request.method === "PUT" && id) {
      const setSql = config.fields.map((field, index) => `${field}=$${index + 3}`).join(",");
      const result = await pool.query(
        `UPDATE ${config.table} SET ${setSql} WHERE id=$1 AND organization_id=$2 RETURNING *`,
        [id, user.organization_id, ...values]
      );
      sendJson(response, result.rows[0] ? 200 : 404, result.rows[0] ? { ok: true, item: result.rows[0] } : { ok: false, message: "Ma'lumot topilmadi" });
      return;
    }
    sendJson(response, 405, { ok: false, message: "Method not allowed" });
  } catch (error) {
    withError(response, `Student app ${key}`, error);
  }
}

async function sendStudentTelegramMessage(pool, student, message) {
  if (!student?.telegram_chat_id) return { ok: false, message: "Student Telegram botga ulanmagan" };
  const config = getStudentTelegramConfig({ allowMissing: true });
  if (!config.tokenPresent) return { ok: false, message: "STUDENT_BOT_TOKEN sozlanmagan" };
  await postTelegramMessage(config.token, student.telegram_chat_id, message);
  return { ok: true, message: "Xabar yuborildi" };
}


async function findPaymentReceiptByNumber(receiptNumber) {
  const clean = asText(receiptNumber).replace(/^receipt_/i, "");
  if (!clean) return null;
  const pool = getDbPool();
  await ensureSchema(pool);
  const result = await pool.query(
    `SELECT p.*, s.full_name AS student_name, s.phone AS student_phone, s.balance AS student_balance,
            g.name AS group_name, g.course_name, g.monthly_price AS group_monthly_price, g.room AS group_room,
            u.full_name AS cashier_name,
            o.name AS organization_name, o.phone AS organization_phone, o.address AS organization_address, o.logo_url AS organization_logo_url,
            COALESCE(b.name, o.name) AS branch_name,
            GREATEST(COALESCE(p.due_amount, 0) - COALESCE(p.amount, 0) - COALESCE(p.discount, 0), 0)::numeric AS current_balance
     FROM payments p
     LEFT JOIN students s ON s.id=p.student_id
     LEFT JOIN groups g ON g.id=p.group_id
     LEFT JOIN users u ON u.id=p.created_by
     LEFT JOIN organizations o ON o.id=p.organization_id
     LEFT JOIN branches b ON b.id=s.branch_id
     WHERE p.receipt_no=$1
     ORDER BY p.id DESC
     LIMIT 1`,
    [clean]
  );
  const payment = result.rows[0];
  if (!payment) return null;
  const settings = receiptSettingsDefaults(await getOrganizationSettings(pool, payment.organization_id));
  payment.telegram_deep_link = `https://t.me/${settings.bot_username || "edukauz_bot"}?start=receipt_${encodeURIComponent(payment.receipt_no)}`;
  payment.qr_code_value = payment.telegram_deep_link;
  payment.course_amount = payment.due_amount || payment.group_monthly_price || payment.amount || 0;
  return { settings, payment };
}

async function handleTelegramWebhook(request, response) {
  const expectedSecret = String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
  if (expectedSecret) {
    const actualSecret = String(request.headers["x-telegram-bot-api-secret-token"] || "").trim();
    if (actualSecret !== expectedSecret) {
      console.error("Invalid Telegram webhook secret");
      if (actualSecret) {
        sendJson(response, 200, { ok: false, message: "Invalid webhook secret" });
        return;
      }
      console.error("Invalid Telegram webhook secret: missing secret header; accepting update with ordinary webhook fallback");
    }
  }
  try {
    const update = await readJsonBody(request);
    const message = update.message || update.edited_message || update.callback_query?.message || null;
    const text = String(update.message?.text || update.edited_message?.text || update.callback_query?.data || "").trim();
    console.log(
      `Telegram webhook update received: message=${Boolean(message)} text=${text ? text.slice(0, 40) : "-"} from=${Boolean(update.message?.from?.id || update.callback_query?.from?.id)} chat=${Boolean(message?.chat?.id)}`
    );
    await studentTelegramBot.handleUpdate(update, {
      getDbPool,
      ensureSchema,
      normalizePhone,
      studentAppPasswordLogin,
      createLinkedStudentAppSession,
      findStudentsByPhone,
      postTelegramMessage,
      getStudentTelegramConfig,
      studentAppWebUrl,
      findPaymentReceiptByNumber,
      hashPassword
    });
    sendJson(response, 200, { ok: true });
  } catch (error) {
    console.error(`Telegram webhook failed: ${error.message}`);
    sendJson(response, 200, { ok: false });
  }
}

async function handleTelegramSetWebhook(request, response) {
  try {
    const adminSecret = String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
    if (adminSecret && String(request.headers["x-telegram-webhook-secret"] || "").trim() !== adminSecret) {
      sendJson(response, 403, { ok: false, message: "Forbidden" });
      return;
    }
    const config = getStudentTelegramConfig({ allowMissing: true });
    if (!config.tokenPresent) {
      sendJson(response, 503, { ok: false, message: "STUDENT_BOT_TOKEN sozlanmagan" });
      return;
    }
    const baseDomain = String(process.env.BASE_DOMAIN || "eduka.uz").replace(/^https?:\/\//, "");
    const webhookUrl = `https://${baseDomain}/api/telegram/webhook`;
    const payload = { url: webhookUrl };
    if (adminSecret) payload.secret_token = adminSecret;
    await telegramApiRequest(config.token, "setWebhook", payload);
    sendJson(response, 200, { ok: true, webhookUrl });
  } catch (error) {
    sendJson(response, 500, { ok: false, message: error.message });
  }
}

function telegramStatusPayload() {
  const landing = getLandingTelegramConfig({ allowMissing: true });
  const student = getStudentTelegramConfig({ allowMissing: true });
  const studentWebAppUrl = getStudentWebAppUrlBase();
  return {
    ok: true,
    databaseUrlConfigured: Boolean(String(process.env.DATABASE_URL || "").trim()),
    baseDomain: String(process.env.BASE_DOMAIN || "eduka.uz").trim(),
    landingBotConfigured: landing.tokenPresent,
    landingChatConfigured: landing.chatIdCount > 0,
    studentBotConfigured: student.tokenPresent,
    studentWebAppUrlConfigured: Boolean(studentWebAppUrl),
    webhookSecretConfigured: Boolean(String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim()),
    studentWebAppUrl
  };
}

async function handleTelegramStatus(response) {
  sendJson(response, 200, telegramStatusPayload());
}

async function handleStudentBotInfo(response) {
  const config = getStudentTelegramConfig({ allowMissing: true });
  if (!config.tokenPresent) {
    sendJson(response, 503, { ok: false, error: "STUDENT_BOT_TOKEN sozlanmagan" });
    return;
  }

  try {
    const botInfo = await telegramApiRequest(config.token, "getMe");
    sendJson(response, 200, {
      ok: true,
      id: botInfo.result?.id || null,
      username: botInfo.result?.username || null,
      first_name: botInfo.result?.first_name || null
    });
  } catch (error) {
    console.error(`Student bot getMe failed: ${safeTelegramErrorMessage(error)}`);
    sendJson(response, 502, { ok: false, error: safeTelegramErrorMessage(error) });
  }
}

async function handleLandingBotInfo(response) {
  const config = getLandingTelegramConfig({ allowMissing: true });
  if (!config.tokenPresent) {
    sendJson(response, 503, { ok: false, error: "LANDING_BOT_TOKEN sozlanmagan" });
    return;
  }

  try {
    const botInfo = await telegramApiRequest(config.token, "getMe");
    sendJson(response, 200, {
      ok: true,
      id: botInfo.result?.id || null,
      username: botInfo.result?.username || null,
      first_name: botInfo.result?.first_name || null
    });
  } catch (error) {
    console.error(`Landing bot getMe failed: ${safeTelegramErrorMessage(error)}`);
    sendJson(response, 502, { ok: false, error: safeTelegramErrorMessage(error) });
  }
}

async function handleWebhookInfo(response) {
  const config = getStudentTelegramConfig({ allowMissing: true });
  if (!config.tokenPresent) {
    sendJson(response, 503, { ok: false, error: "STUDENT_BOT_TOKEN sozlanmagan" });
    return;
  }

  try {
    const webhookInfo = await telegramApiRequest(config.token, "getWebhookInfo");
    const result = webhookInfo.result || {};
    sendJson(response, 200, {
      ok: true,
      url: result.url || "",
      has_custom_certificate: Boolean(result.has_custom_certificate),
      pending_update_count: Number(result.pending_update_count || 0),
      last_error_date: result.last_error_date || null,
      last_error_message: result.last_error_message || null,
      max_connections: result.max_connections || null
    });
  } catch (error) {
    console.error(`Student webhook info failed: ${safeTelegramErrorMessage(error)}`);
    sendJson(response, 502, { ok: false, error: safeTelegramErrorMessage(error) });
  }
}

async function handleTestLandingMessage(request, response) {
  try {
    const body = request.method === "POST" ? await readJsonBody(request) : {};
    await sendLandingTelegramMessage({
      name: body.name || "Test User",
      phone: body.phone || "+998901234567",
      center: body.center || body.course || "Railway test",
      note: body.note || "Telegram landing test"
    });
    sendJson(response, 200, { ok: true, sent: true });
  } catch (error) {
    console.error(`Telegram landing test failed: ${safeTelegramErrorMessage(error)}`);
    sendJson(response, 500, {
      ok: false,
      error: safeTelegramErrorMessage(error),
      telegramDescription: error.telegramDescription ? safeTelegramErrorMessage(error) : undefined
    });
  }
}

async function handleTestStudentMessage(request, response, query) {
  const expectedSecret = String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
  if (expectedSecret && String(request.headers["x-telegram-webhook-secret"] || query.get("secret") || "").trim() !== expectedSecret) {
    sendJson(response, 403, { ok: false, error: "Forbidden" });
    return;
  }

  const chatId = String(query.get("chat_id") || "").trim();
  if (!chatId) {
    sendJson(response, 400, { ok: false, error: "chat_id required" });
    return;
  }

  const config = getStudentTelegramConfig({ allowMissing: true });
  if (!config.tokenPresent) {
    sendJson(response, 503, { ok: false, error: "STUDENT_BOT_TOKEN sozlanmagan" });
    return;
  }

  try {
    await postTelegramMessage(config.token, chatId, "Eduka Student bot test xabari.");
    sendJson(response, 200, { ok: true, sent: true });
  } catch (error) {
    console.error(`Student bot test message failed: ${safeTelegramErrorMessage(error)}`);
    sendJson(response, 500, {
      ok: false,
      error: safeTelegramErrorMessage(error),
      telegramDescription: error.telegramDescription ? safeTelegramErrorMessage(error) : undefined
    });
  }
}


async function handleGlobalSearchRequest(request, response, query) {
  try {
    const user = await requireUser(request, response, "read");
    if (!user) return;
    const q = String(query.get("q") || "").trim();
    if (q.length < 2) {
      sendJson(response, 200, { ok: true, results: [] });
      return;
    }
    const like = `%${q}%`;
    const pool = getDbPool();
    const organizationId = user.organization_id;
    const [students, groups, teachers, leads] = await Promise.all([
      pool.query("SELECT id, full_name AS title, phone AS subtitle, 'students' AS resource FROM students WHERE organization_id=$1 AND (full_name ILIKE $2 OR phone ILIKE $2 OR parent_phone ILIKE $2) ORDER BY id DESC LIMIT 8", [organizationId, like]),
      pool.query("SELECT id, name AS title, COALESCE(course_name, status, '') AS subtitle, 'groups' AS resource FROM groups WHERE organization_id=$1 AND (name ILIKE $2 OR course_name ILIKE $2) ORDER BY id DESC LIMIT 6", [organizationId, like]),
      pool.query("SELECT id, full_name AS title, phone AS subtitle, 'teachers' AS resource FROM teachers WHERE organization_id=$1 AND (full_name ILIKE $2 OR phone ILIKE $2 OR email ILIKE $2) ORDER BY id DESC LIMIT 6", [organizationId, like]),
      pool.query("SELECT id, full_name AS title, phone AS subtitle, 'leads' AS resource FROM leads WHERE organization_id=$1 AND (full_name ILIKE $2 OR phone ILIKE $2 OR status ILIKE $2) ORDER BY id DESC LIMIT 6", [organizationId, like])
    ]);
    sendJson(response, 200, { ok: true, results: [...students.rows, ...groups.rows, ...teachers.rows, ...leads.rows] });
  } catch (error) {
    withError(response, "Global search", error);
  }
}



// Eduka 22.1.0 — Student App 22 + Gamification overrides
async function ensureStudentGamificationDefaults(pool, organizationId) {
  if (!organizationId) return;
  await pool.query(
    `INSERT INTO student_app_settings (organization_id, enabled, coins_enabled, rating_enabled, library_enabled, payments_enabled, news_enabled, schedule_enabled, attendance_enabled, rewards_enabled, achievements_enabled, materials_enabled)
     VALUES ($1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE)
     ON CONFLICT (organization_id) DO NOTHING`,
    [organizationId]
  );
  await ensureStudentAppDefaults(pool, organizationId);
  const rewards = [
    ["Daftar (A5)", "O'quv daftar", 40, "Kitoblar"],
    ["Suv idishi", "Eduka brendli suv idishi", 120, "Boshqalar"],
    ["Quloqchin", "Bluetooth quloqchin", 180, "Gadjetlar"],
    ["Futbolka", "Eduka futbolkasi", 250, "Boshqalar"],
    ["Power Bank", "Telefon uchun power bank", 300, "Gadjetlar"],
    ["Vaucher (50 000 so'm)", "O'quv to'loviga chegirma vaucheri", 200, "Vaucher"]
  ];
  for (const [title, description, price, category] of rewards) {
    await pool.query(
      `INSERT INTO student_reward_products (organization_id, title, description, coin_price, stock, category, status)
       SELECT $1,$2,$3,$4,25,$5,'active'
       WHERE NOT EXISTS (SELECT 1 FROM student_reward_products WHERE organization_id=$1 AND LOWER(title)=LOWER($2))`,
      [organizationId, title, description, price, category]
    );
  }
}

function studentAppModuleEnabled(payload, key) {
  const settings = payload.settings || {};
  const map = {
    schedule: settings.schedule_enabled,
    attendance: settings.attendance_enabled,
    payments: settings.payments_enabled,
    coins: settings.coins_enabled,
    rewards: settings.rewards_enabled,
    rating: settings.rating_enabled,
    achievements: settings.achievements_enabled,
    materials: settings.materials_enabled ?? settings.library_enabled,
    notifications: settings.news_enabled,
    profile: settings.profile_enabled
  };
  if (map[key] === false) return false;
  const module = (payload.modules || []).find((item) => String(item.key) === key);
  return !module || module.enabled !== false;
}

function buildStudentAchievements(student, attendanceRows, coinRows) {
  const present = attendanceRows.filter((item) => ["present", "online"].includes(String(item.status))).length;
  const coins = Number(student.coins || 0);
  return [
    { key: "active_student", title: "Faol o'quvchi", description: "10 darsda qatnashish", progress: Math.min(present, 10), target: 10, icon: "medal", completed: present >= 10 },
    { key: "coin_collector", title: "Coin to'plash ustasi", description: "500 coin to'plash", progress: Math.min(coins, 500), target: 500, icon: "coin", completed: coins >= 500 },
    { key: "streak", title: "Ketma-ketlik", description: "7 kun faol bo'lish", progress: Math.min(Math.max(coinRows.length, present), 7), target: 7, icon: "flame", completed: Math.max(coinRows.length, present) >= 7 }
  ];
}

async function studentAppBasePayload(pool, row) {
  await ensureStudentGamificationDefaults(pool, row.organization_id);
  const queries = await Promise.all([
    pool.query("SELECT * FROM student_app_settings WHERE organization_id=$1 LIMIT 1", [row.organization_id]),
    pool.query("SELECT * FROM student_app_modules WHERE organization_id=$1 ORDER BY sort_order ASC, id ASC", [row.organization_id]),
    pool.query("SELECT * FROM student_library_items WHERE organization_id=$1 AND status='published' ORDER BY id DESC LIMIT 100", [row.organization_id]),
    pool.query("SELECT p.*, g.name AS group_name FROM payments p LEFT JOIN groups g ON g.id=p.group_id WHERE p.organization_id=$1 AND p.student_id=$2 ORDER BY p.paid_at DESC, p.id DESC LIMIT 100", [row.organization_id, row.id]),
    pool.query("SELECT g.*, t.full_name AS teacher_name FROM groups g LEFT JOIN teachers t ON t.id=g.teacher_id WHERE g.organization_id=$1 AND (g.id=$2 OR g.id IN (SELECT group_id FROM group_students WHERE organization_id=$1 AND student_id=$3)) ORDER BY g.id DESC", [row.organization_id, row.group_id, row.id]),
    pool.query("SELECT * FROM attendance_records WHERE organization_id=$1 AND student_id=$2 ORDER BY lesson_date DESC LIMIT 120", [row.organization_id, row.id]),
    pool.query("SELECT c.*, t.full_name AS teacher_name FROM student_coin_transactions c LEFT JOIN teachers t ON t.id=c.teacher_id WHERE c.organization_id=$1 AND c.student_id=$2 ORDER BY c.created_at DESC LIMIT 100", [row.organization_id, row.id]),
    pool.query("SELECT * FROM student_reward_products WHERE organization_id=$1 AND status='active' ORDER BY coin_price ASC, id DESC LIMIT 100", [row.organization_id]),
    pool.query("SELECT * FROM student_reward_redemptions WHERE organization_id=$1 AND student_id=$2 ORDER BY created_at DESC LIMIT 50", [row.organization_id, row.id])
  ]);
  const [settings, modules, library, payments, groups, attendance, coins, rewards, redemptions] = queries.map((q) => q.rows || []);
  const paid = payments.reduce((sum, item) => sum + Number(item.amount || 0) + Number(item.discount || 0), 0);
  const due = payments.reduce((sum, item) => sum + Number(item.due_amount || 0), 0);
  const balance = Math.max(Number(row.balance || 0), Math.max(due - paid, 0));
  const present = attendance.filter((item) => ["present", "online"].includes(String(item.status))).length;
  const attendancePercent = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
  const student = studentPublic({ ...row, balance, group_name: groups[0]?.name || row.group_name });
  student.attendancePercent = attendancePercent;
  const lessons = groups.map((group) => ({
    id: group.id,
    title: group.course_name || group.name,
    group_name: group.name,
    teacher_name: group.teacher_name || "-",
    room: group.room || "-",
    days: group.lesson_days || group.days || "Dushanba, Chorshanba, Juma",
    start_time: String(group.start_time || "09:00").slice(0, 5),
    end_time: String(group.end_time || "10:30").slice(0, 5),
    time: `${String(group.start_time || "09:00").slice(0, 5)} - ${String(group.end_time || "10:30").slice(0, 5)}`,
    status: "active"
  }));
  const notifications = [
    ...coins.slice(0, 8).map((item) => ({ id: `coin-${item.id}`, type: "coin", title: `${item.teacher_name || "Ustoz"} sizga ${item.amount} coin berdi`, description: item.reason || "Faol ishtirok uchun", time: item.created_at, unread: false })),
    ...payments.slice(0, 5).map((item) => ({ id: `payment-${item.id}`, type: "payment", title: "To'lov qabul qilindi", description: `${Number(item.amount || 0).toLocaleString("uz-UZ")} so'm to'lov tizimga kiritildi`, time: item.paid_at, unread: false }))
  ];
  const ranking = await pool.query(
    `SELECT id AS student_id, full_name, coins AS score, avatar_url
     FROM students WHERE organization_id=$1 AND student_app_enabled=TRUE
     ORDER BY coins DESC, id ASC LIMIT 30`,
    [row.organization_id]
  );
  const payload = {
    student,
    organization: { id: row.organization_id, name: row.organization_name, subdomain: row.organization_subdomain, phone: row.organization_phone },
    settings: settings[0] || {},
    modules,
    payments,
    groups,
    lessons,
    attendance,
    coinTransactions: coins,
    rewards,
    redemptions,
    achievements: buildStudentAchievements(student, attendance, coins),
    library,
    materials: library,
    notifications,
    ranking: ranking.rows,
    paymentSummary: { due, paid, balance },
    enabled: {}
  };
  for (const key of ["schedule", "attendance", "payments", "coins", "rewards", "rating", "achievements", "materials", "notifications", "profile"]) {
    payload.enabled[key] = studentAppModuleEnabled(payload, key);
  }
  return payload;
}

async function handleStudentAppData(request, response, resource) {
  if (!process.env.DATABASE_URL) {
    sendJson(response, 503, { ok: false, message: "Student App real rejimda ishlashi uchun DATABASE_URL sozlanishi shart" });
    return;
  }
  const session = await requireStudentAppSession(request, response);
  if (!session) return;
  const payload = await studentAppBasePayload(session.pool, session.row);
  const responses = {
    home: payload,
    dashboard: payload,
    profile: payload,
    group: { student: payload.student, groups: payload.groups, attendance: payload.attendance },
    study: { lessons: payload.lessons, groups: payload.groups },
    schedule: { lessons: payload.lessons, groups: payload.groups, enabled: payload.enabled },
    attendance: { attendance: payload.attendance, student: payload.student, enabled: payload.enabled },
    rating: { ranking: payload.ranking, student: payload.student, enabled: payload.enabled },
    achievements: { achievements: payload.achievements, enabled: payload.enabled },
    coins: { coinTransactions: payload.coinTransactions, student: payload.student, enabled: payload.enabled },
    rewards: { rewards: payload.rewards, redemptions: payload.redemptions, student: payload.student, enabled: payload.enabled },
    library: { items: payload.library, enabled: payload.enabled },
    materials: { items: payload.materials, enabled: payload.enabled },
    notifications: { notifications: payload.notifications, enabled: payload.enabled },
    news: { news: payload.notifications, events: [] },
    payments: { payments: payload.payments, student: payload.student, paymentSummary: payload.paymentSummary, enabled: payload.enabled },
    "payment-history": { payments: payload.payments, student: payload.student, paymentSummary: payload.paymentSummary, enabled: payload.enabled },
    settings: { settings: payload.settings }
  };
  sendJson(response, 200, { ok: true, ...(responses[resource] || payload) });
}

async function handleStudentRewardRedeem(request, response, productId) {
  const session = await requireStudentAppSession(request, response);
  if (!session) return;
  const pool = session.pool;
  const productResult = await pool.query("SELECT * FROM student_reward_products WHERE id=$1 AND organization_id=$2 AND status='active' LIMIT 1", [productId, session.row.organization_id]);
  const product = productResult.rows[0];
  if (!product) {
    sendJson(response, 404, { ok: false, message: "Sovg'a topilmadi" });
    return;
  }
  const price = Number(product.coin_price || 0);
  const currentCoins = Number(session.row.coins || 0);
  if (price > currentCoins) {
    sendJson(response, 409, { ok: false, message: "Coin yetarli emas" });
    return;
  }
  if (Number(product.stock || 0) <= 0) {
    sendJson(response, 409, { ok: false, message: "Sovg'a omborda qolmagan" });
    return;
  }
  await pool.query("BEGIN");
  try {
    await pool.query("UPDATE students SET coins=GREATEST(coins-$3,0), updated_at=NOW() WHERE id=$1 AND organization_id=$2", [session.row.id, session.row.organization_id, price]);
    await pool.query("UPDATE student_reward_products SET stock=GREATEST(stock-1,0), updated_at=NOW() WHERE id=$1 AND organization_id=$2", [product.id, session.row.organization_id]);
    const redemption = await pool.query(
      `INSERT INTO student_reward_redemptions (organization_id, student_id, product_id, product_title, coin_price, status)
       VALUES ($1,$2,$3,$4,$5,'pending') RETURNING *`,
      [session.row.organization_id, session.row.id, product.id, product.title, price]
    );
    await pool.query(
      `INSERT INTO student_coin_transactions (organization_id, student_id, amount, type, reason, source)
       VALUES ($1,$2,$3,'spend',$4,'reward_store')`,
      [session.row.organization_id, session.row.id, -price, `Sovg'a olindi: ${product.title}`]
    );
    await pool.query("COMMIT");
    sendJson(response, 200, { ok: true, redemption: redemption.rows[0], message: "Sovg'a so'rovi qabul qilindi" });
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function handleStudentAppProfileUpdate(request, response) {
  const session = await requireStudentAppSession(request, response);
  if (!session) return;
  const body = await readJsonBody(request);
  const result = await session.pool.query(
    `UPDATE students SET full_name=$3, phone=$4, parent_phone=$5, address=$6, email=$7, updated_at=NOW()
     WHERE id=$1 AND organization_id=$2 RETURNING *`,
    [session.row.id, session.row.organization_id, asText(body.full_name || body.fullName, session.row.full_name), asText(body.phone, session.row.phone), asText(body.parent_phone || body.parentPhone, session.row.parent_phone), asText(body.address, session.row.address), asText(body.email, session.row.email)]
  );
  sendJson(response, 200, { ok: true, student: studentPublic(result.rows[0]), message: "Profil saqlandi" });
}

async function handleStudentAppPasswordChange(request, response) {
  const session = await requireStudentAppSession(request, response);
  if (!session) return;
  const body = await readJsonBody(request);
  const current = String(body.current_password || body.currentPassword || "");
  const next = String(body.new_password || body.newPassword || "");
  if (!next || next.length < 6) {
    sendJson(response, 400, { ok: false, message: "Yangi parol kamida 6 belgidan iborat bo'lishi kerak" });
    return;
  }
  if (session.row.app_password_hash && !verifyPassword(current, session.row.app_password_hash)) {
    sendJson(response, 401, { ok: false, message: "Joriy parol noto'g'ri" });
    return;
  }
  await session.pool.query("UPDATE students SET app_password_hash=$3, app_password_set_at=NOW(), app_password_reset_required=FALSE WHERE id=$1 AND organization_id=$2", [session.row.id, session.row.organization_id, hashPassword(next)]);
  sendJson(response, 200, { ok: true, message: "Parol yangilandi" });
}

async function handleAdminAwardStudentCoins(request, response, studentId) {
  try {
    const user = await requireUser(request, response, "students:write");
    if (!user) return;
    const body = await readJsonBody(request);
    const amount = Math.max(1, Math.min(10000, Math.round(Number(body.amount || 0))));
    const reason = asText(body.reason, "Faol ishtirok uchun");
    const pool = getDbPool();
    await ensureSchema(pool);
    const student = await pool.query("SELECT * FROM students WHERE id=$1 AND organization_id=$2", [studentId, user.organization_id]);
    if (!student.rows[0]) {
      sendJson(response, 404, { ok: false, message: "O'quvchi topilmadi" });
      return;
    }
    await pool.query("UPDATE students SET coins=coins+$3, updated_at=NOW() WHERE id=$1 AND organization_id=$2", [studentId, user.organization_id, amount]);
    const tx = await pool.query(
      `INSERT INTO student_coin_transactions (organization_id, student_id, teacher_id, amount, type, reason, source, created_by)
       VALUES ($1,$2,$3,$4,'award',$5,'admin_panel',$6) RETURNING *`,
      [user.organization_id, studentId, body.teacher_id || null, amount, reason, user.id]
    );
    const linked = student.rows[0];
    if (linked.telegram_chat_id) {
      await sendStudentTelegramMessage(pool, linked, `🎉 Sizga <b>${amount} coin</b> berildi!\nSabab: ${reason}\n\nCoinlaringizni Student App ichidagi sovg'alar do'konida ishlatishingiz mumkin.`).catch(() => null);
    }
    sendJson(response, 200, { ok: true, item: tx.rows[0], message: `${amount} coin berildi` });
  } catch (error) {
    withError(response, "Award student coins", error);
  }
}

async function handleAdminRewardRedemptionAction(request, response, redemptionId, action) {
  try {
    const user = await requireUser(request, response, "settings:write");
    if (!user) return;
    const statusMap = { approve: "approved", reject: "rejected", complete: "completed" };
    const status = statusMap[action] || "pending";
    const pool = getDbPool();
    await ensureSchema(pool);
    const result = await pool.query(
      `UPDATE student_reward_redemptions SET status=$3, completed_at=CASE WHEN $3='completed' THEN NOW() ELSE completed_at END
       WHERE id=$1 AND organization_id=$2 RETURNING *`,
      [redemptionId, user.organization_id, status]
    );
    sendJson(response, result.rows[0] ? 200 : 404, result.rows[0] ? { ok: true, item: result.rows[0] } : { ok: false, message: "So'rov topilmadi" });
  } catch (error) {
    withError(response, "Reward redemption action", error);
  }
}

const server = http.createServer((request, response) => {
  const [rawUrlPath, rawQuery = ""] = request.url.split("?");
  const urlPath = decodeURIComponent(rawUrlPath);
  const query = new URLSearchParams(rawQuery);

  if (request.method === "GET" && ["/api/health", "/healthz", "/health"].includes(urlPath)) {
    sendJson(response, 200, {
      ok: true,
      status: "healthy",
      version: "21.8.4",
      time: new Date().toISOString(),
      database: Boolean(process.env.DATABASE_URL)
    });
    return;
  }

  if (request.method === "GET" && (urlPath === "/ceo/login" || urlPath === "/super/login")) {
    sendCeoLoginShell(response);
    return;
  }

  if (request.method === "GET" && (urlPath === "/ceo-login.html" || urlPath === "/admin-login.html")) {
    sendCeoLoginShell(response);
    return;
  }

  if (request.method === "GET" && (urlPath === "/ceo-console.html" || (urlPath.startsWith("/ceo/") && urlPath !== "/ceo/login") || urlPath === "/ceo")) {
    sendCeoConsoleShell(response);
    return;
  }

  if (request.method === "POST" && ["/api/demo", "/api/demo-request", "/api/contact", "/api/lead", "/api/register-demo"].includes(urlPath)) {
    handleDemoRequest(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/auth/login") {
    handleLoginRequest(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/auth/tenant-login") {
    handleTenantLoginRequest(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/auth/register") {
    handleRegisterRequest(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/auth/demo") {
    sendJson(response, 410, { ok: false, message: "Demo login o'chirilgan. Real markaz loginidan foydalaning." });
    return;
  }

  if (request.method === "GET" && ["/api/auth/me", "/api/me"].includes(urlPath)) {
    handleMeRequest(request, response);
    return;
  }

  const tenantResolveMatch = urlPath.match(/^\/api\/tenant\/resolve(?:\/([a-z0-9-]+))?$/);
  if (request.method === "GET" && tenantResolveMatch) {
    handleTenantResolveRequest(request, response, tenantResolveMatch[1] || query.get("subdomain") || tenantSubdomainFromRequest(request, query));
    return;
  }

  if (request.method === "POST" && urlPath === "/api/admin/centers") {
    handleAdminCenterCreateRequest(request, response);
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

  if (request.method === "GET" && ["/api/dashboard/stats", "/api/app/dashboard/stats"].includes(urlPath)) {
    handleAnalyticsRequest(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/app/global-search") {
    handleGlobalSearchRequest(request, response, query);
    return;
  }

  const exportMatch = urlPath.match(/^\/api(?:\/app)?\/export\/(students|groups|teachers|payments|attendance|debts)$/);
  if (exportMatch && request.method === "GET") {
    handleExportRequest(request, response, exportMatch[1]);
    return;
  }

  const appStudentProfileMatch = urlPath.match(/^\/api\/app\/students\/(\d+)\/profile$/);
  if (appStudentProfileMatch && request.method === "GET") {
    handleStudentProfileRequest(request, response, Number(appStudentProfileMatch[1]));
    return;
  }

  const appGroupProfileMatch = urlPath.match(/^\/api\/app\/groups\/(\d+)\/profile$/);
  if (appGroupProfileMatch && request.method === "GET") {
    handleGroupProfileRequest(request, response, Number(appGroupProfileMatch[1]));
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

  if (request.method === "GET" && urlPath === "/api/app/debts") {
    handleDebtsRequest(request, response);
    return;
  }

  if (urlPath === "/api/schedule" && ["GET", "POST"].includes(request.method)) {
    handleScheduleRequest(request, response);
    return;
  }

  if (["/api/app/schedule", "/api/app/journal"].includes(urlPath) && ["GET", "POST"].includes(request.method)) {
    handleScheduleRequest(request, response);
    return;
  }

  if (urlPath === "/api/settings" && ["GET", "PUT"].includes(request.method)) {
    handleSettingsRequest(request, response);
    return;
  }

  if (urlPath === "/api/app/settings" && ["GET", "PUT"].includes(request.method)) {
    handleSettingsRequest(request, response);
    return;
  }

  if (request.method === "GET" && ["/api/super/summary", "/api/super/dashboard"].includes(urlPath)) {
    if (urlPath === "/api/super/dashboard") handleSuperDashboardRequest(request, response);
    else handleSuperSummaryRequest(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/super/centers") {
    handleSuperCenterWizardRequest(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/super/centers/wizard") {
    handleSuperCenterWizardRequest(request, response);
    return;
  }

  const superCenterAdminResetMatch = urlPath.match(/^\/api\/super\/centers\/(\d+)\/admin-reset$/);
  if (superCenterAdminResetMatch && request.method === "POST") {
    handleSuperCenterAdminResetRequest(request, response, Number(superCenterAdminResetMatch[1]));
    return;
  }

  const superPlansMatch = urlPath.match(/^\/api\/super\/plans(?:\/(\d+))?$/);
  if (superPlansMatch && ["GET", "POST", "PUT"].includes(request.method)) {
    handleSuperPlansRequest(request, response, superPlansMatch[1] ? Number(superPlansMatch[1]) : null);
    return;
  }

  const superDomainsMatch = urlPath.match(/^\/api\/super\/domains(?:\/(\d+))?$/);
  if (superDomainsMatch && ["GET", "POST", "PUT"].includes(request.method)) {
    handleSuperDomainsRequest(request, response, superDomainsMatch[1] ? Number(superDomainsMatch[1]) : null);
    return;
  }

  const superInvoicesMatch = urlPath.match(/^\/api\/super\/invoices(?:\/(\d+))?$/);
  if (superInvoicesMatch && ["GET", "POST", "PUT"].includes(request.method)) {
    handleSuperInvoicesRequest(request, response, superInvoicesMatch[1] ? Number(superInvoicesMatch[1]) : null);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/super/audit") {
    handleSuperAuditRequest(request, response);
    return;
  }

  const superAdminUserResetMatch = urlPath.match(/^\/api\/super\/admin-users\/(\d+)\/reset-password$/);
  if (superAdminUserResetMatch && request.method === "POST") {
    handleSuperAdminUserResetRequest(request, response, Number(superAdminUserResetMatch[1]));
    return;
  }

  const superAdminUsersMatch = urlPath.match(/^\/api\/super\/admin-users(?:\/(\d+))?$/);
  if (superAdminUsersMatch && ["GET", "POST", "PUT", "DELETE"].includes(request.method)) {
    handleSuperAdminUsersRequest(request, response, superAdminUsersMatch[1] ? Number(superAdminUsersMatch[1]) : null);
    return;
  }

  const superSupportTicketsMatch = urlPath.match(/^\/api\/super\/support-tickets(?:\/(\d+))?$/);
  if (superSupportTicketsMatch && ["GET", "POST", "PUT"].includes(request.method)) {
    handleSuperSupportTicketsRequest(request, response, superSupportTicketsMatch[1] ? Number(superSupportTicketsMatch[1]) : null);
    return;
  }


  if (request.method === "GET" && urlPath === "/api/super/notifications") {
    handleSuperNotificationsRequest(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/super/global-search") {
    handleSuperGlobalSearchRequest(request, response, query);
    return;
  }

  const superCenterLoginAsMatch = urlPath.match(/^\/api\/super\/centers\/(\d+)\/login-as$/);
  if (superCenterLoginAsMatch && request.method === "POST") {
    handleSuperCenterImpersonateRequest(request, response, Number(superCenterLoginAsMatch[1]));
    return;
  }

  const superSubscriptionActionMatch = urlPath.match(/^\/api\/super\/subscriptions\/(\d+)\/action$/);
  if (superSubscriptionActionMatch && request.method === "PUT") {
    handleSuperSubscriptionActionRequest(request, response, Number(superSubscriptionActionMatch[1]));
    return;
  }

  if (request.method === "POST" && urlPath === "/api/super/payments") {
    handleSuperPlatformPaymentsWriteRequest(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/org/dashboard") {
    handleOrgDashboardRequest(request, response);
    return;
  }

  if (urlPath === "/api/org/branding" && ["GET", "PUT"].includes(request.method)) {
    handleOrgBrandingRequest(request, response);
    return;
  }

  if (urlPath === "/api/org/users" && ["GET", "POST"].includes(request.method)) {
    handleOrgUsersRequest(request, response);
    return;
  }

  if (urlPath === "/api/org/roles" && ["GET", "POST"].includes(request.method)) {
    handleOrgRolesRequest(request, response);
    return;
  }

  const studentProfessionalMatch = urlPath.match(/^\/api\/student\/(dashboard|payments|attendance|homeworks|exams|feedback|library|dictionary|news|events|referrals|group|study|rating)$/);
  if (studentProfessionalMatch && ["GET", "POST"].includes(request.method)) {
    handleStudentProfessionalRequest(request, response, studentProfessionalMatch[1]);
    return;
  }

  const superCenterPlanMatch = urlPath.match(/^\/api\/super\/centers\/(\d+)\/plan$/);
  if (superCenterPlanMatch && request.method === "PUT") {
    handleSuperCenterPlanRequest(request, response, Number(superCenterPlanMatch[1]));
    return;
  }

  const superCenterFeaturesMatch = urlPath.match(/^\/api\/super\/centers\/(\d+)\/features$/);
  if (superCenterFeaturesMatch && request.method === "PUT") {
    handleSuperCenterFeaturesRequest(request, response, Number(superCenterFeaturesMatch[1]));
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

  const appConvertLeadMatch = urlPath.match(/^\/api\/app\/leads\/(\d+)\/convert-to-student$/);
  if (appConvertLeadMatch && request.method === "POST") {
    handleLeadConvertRequest(request, response, Number(appConvertLeadMatch[1]));
    return;
  }

  const crudMatch = urlPath.match(/^\/api(?:\/app)?\/(students|leads|groups|teachers|courses)(?:\/(\d+))?$/);
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

  const studentDirectPasswordMatch = urlPath.match(/^\/api(?:\/app)?\/students\/(\d+)\/app-password$/);
  if (studentDirectPasswordMatch && request.method === "POST") {
    handleStudentDirectPasswordRequest(request, response, Number(studentDirectPasswordMatch[1]));
    return;
  }

  const studentProfileMatch = urlPath.match(/^\/api\/students\/(\d+)\/profile$/);
  if (studentProfileMatch && request.method === "GET") {
    handleStudentProfileRequest(request, response, Number(studentProfileMatch[1]));
    return;
  }



  const groupProfileMatch = urlPath.match(/^\/api\/groups\/(\d+)\/profile$/);
  if (groupProfileMatch && request.method === "GET") {
    handleGroupProfileRequest(request, response, Number(groupProfileMatch[1]));
    return;
  }

  const studentExtensionMatch = urlPath.match(/^\/api(?:\/app)?\/students\/(\d+)\/(notes|discounts|messages|tasks|gamification|history|exams)(?:\/(\d+))?$/);
  if (studentExtensionMatch && ["GET", "POST", "PUT", "DELETE"].includes(request.method)) {
    const [, parentId, resource, rowId] = studentExtensionMatch;
    handleCrmExtensionRequest(request, response, crmExtensionConfigs[resource], Number(parentId), rowId ? Number(rowId) : null);
    return;
  }

  const groupExtensionMatch = urlPath.match(/^\/api(?:\/app)?\/groups\/(\d+)\/(tasks|history|group-exams|group-homeworks|group-notes)(?:\/(\d+))?$/);
  if (groupExtensionMatch && ["GET", "POST", "PUT", "DELETE"].includes(request.method)) {
    const [, parentId, resource, rowId] = groupExtensionMatch;
    handleCrmExtensionRequest(request, response, crmExtensionConfigs[resource], Number(parentId), rowId ? Number(rowId) : null);
    return;
  }

  const extensionDirectMatch = urlPath.match(/^\/api\/app\/(notes|discounts|messages|tasks|gamification|history|exams|group-exams|group-homeworks|group-notes)(?:\/(\d+))?$/);
  if (extensionDirectMatch && ["GET", "POST", "PUT", "DELETE"].includes(request.method)) {
    const [, resource, rowId] = extensionDirectMatch;
    handleCrmExtensionRequest(request, response, crmExtensionConfigs[resource], null, rowId ? Number(rowId) : null);
    return;
  }

  const simpleCrudMatch = urlPath.match(/^\/api(?:\/app)?\/(rooms|payment-types|tags)(?:\/(\d+))?$/);
  if (simpleCrudMatch) {
    const [, resource, id] = simpleCrudMatch;
    handleSimpleCrudRequest(request, response, simpleCrudConfigs[resource], id ? Number(id) : null);
    return;
  }

  const financeAliasMatch = urlPath.match(/^\/api(?:\/app)?\/finance\/(extra-incomes|salary|bonuses|expenses|transactions)(?:\/(\d+))?$/);
  if (financeAliasMatch) {
    request.edukaFinanceAlias = financeAliasMatch[1];
    handleSimpleCrudRequest(request, response, simpleCrudConfigs["finance-transactions"], financeAliasMatch[2] ? Number(financeAliasMatch[2]) : null);
    return;
  }

  const financeTransactionsMatch = urlPath.match(/^\/api\/app\/finance\/transactions(?:\/(\d+))?$/);
  if (financeTransactionsMatch) {
    handleSimpleCrudRequest(request, response, simpleCrudConfigs["finance-transactions"], financeTransactionsMatch[1] ? Number(financeTransactionsMatch[1]) : null);
    return;
  }

  if (request.method === "GET" && /^\/api\/app\/reports\/[^/]+$/.test(urlPath)) {
    handleAnalyticsRequest(request, response);
    return;
  }

  const staffAttendanceActionMatch = urlPath.match(/^\/api\/app\/staff-attendance(?:\/(check-in|check-out|(\d+)))?$/);
  if (staffAttendanceActionMatch) {
    handleStaffAttendanceRequest(request, response, staffAttendanceActionMatch[1] || "", staffAttendanceActionMatch[2] ? Number(staffAttendanceActionMatch[2]) : null);
    return;
  }


  if (urlPath === "/api/app/notifications" && ["GET", "PUT"].includes(request.method)) {
    handleNotificationsRequest(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/app/workflow-readiness") {
    handleWorkflowReadinessRequest(request, response);
    return;
  }

  const receiptSettingsMatch = urlPath.match(/^\/api(?:\/app)?\/receipt-settings$/);
  if (receiptSettingsMatch && ["GET", "PUT"].includes(request.method)) {
    handleReceiptSettingsRequest(request, response);
    return;
  }

  const paymentReceiptMatch = urlPath.match(/^\/api(?:\/app)?\/payments\/(\d+)\/receipt$/);
  if (paymentReceiptMatch && ["GET", "POST"].includes(request.method)) {
    handlePaymentReceiptRequest(request, response, Number(paymentReceiptMatch[1]));
    return;
  }
  const publicReceiptMatch = urlPath.match(/^\/api\/public\/receipts\/([^/]+)$/);
  if (publicReceiptMatch && request.method === "GET") {
    findPaymentReceiptByNumber(decodeURIComponent(publicReceiptMatch[1]))
      .then((receipt) => receipt ? sendJson(response, 200, { ok: true, receipt }) : sendJson(response, 404, { ok: false, message: "Chek topilmadi" }))
      .catch((error) => withError(response, "Public receipt", error));
    return;
  }

  const paymentCancelMatch = urlPath.match(/^\/api(?:\/app)?\/payments\/(\d+)\/cancel$/);
  if (paymentCancelMatch && request.method === "POST") {
    handlePaymentCancelRequest(request, response, Number(paymentCancelMatch[1]));
    return;
  }

  const paymentMatch = urlPath.match(/^\/api(?:\/app)?\/payments(?:\/(\d+))?$/);
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

  const attendanceMatch = urlPath.match(/^\/api(?:\/app)?\/attendance(?:\/(\d+))?$/);
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

  if (request.method === "POST" && urlPath === "/api/telegram/webhook") {
    handleTelegramWebhook(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/telegram/set-webhook") {
    handleTelegramSetWebhook(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/telegram/status") {
    handleTelegramStatus(response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/telegram/student-bot-info") {
    handleStudentBotInfo(response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/telegram/landing-bot-info") {
    handleLandingBotInfo(response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/telegram/webhook-info") {
    handleWebhookInfo(response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/telegram/test-landing-message") {
    handleTestLandingMessage(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/telegram/test-student-message") {
    handleTestStudentMessage(request, response, query);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/student-app/auth/phone") {
    handleStudentAppAuthPhone(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/student-app/auth/password") {
    handleStudentAppAuthPassword(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/student-app/auth/logout") {
    handleStudentAppLogout(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/student-app/me") {
    handleStudentAppMe(request, response);
    return;
  }

  const studentDataMatch = urlPath.match(/^\/api\/student-app\/(home|dashboard|profile|group|study|schedule|attendance|rating|library|materials|dictionary|exams|achievements|coins|rewards|referrals|news|notifications|payments|payment-history|settings)$/);
  if (studentDataMatch && request.method === "GET") {
    handleStudentAppData(request, response, studentDataMatch[1]);
    return;
  }

  const studentRewardRedeemMatch = urlPath.match(/^\/api\/student-app\/rewards\/(\d+)\/redeem$/);
  if (studentRewardRedeemMatch && request.method === "POST") {
    handleStudentRewardRedeem(request, response, Number(studentRewardRedeemMatch[1]));
    return;
  }

  if (request.method === "POST" && urlPath === "/api/student-app/profile") {
    handleStudentAppProfileUpdate(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/student-app/password") {
    handleStudentAppPasswordChange(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/student-app/extra-lesson/register") {
    handleStudentAppExtraLessonRegister(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/student-app/feedback") {
    handleStudentAppFeedback(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/student-app/referrals/share") {
    handleStudentAppReferralShare(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/student-app/settings") {
    handleStudentAppSettingsUpdate(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/app/student-app/dashboard") {
    handleAdminStudentAppDashboard(request, response);
    return;
  }

  if (urlPath === "/api/app/student-app/settings" && ["GET", "PUT"].includes(request.method)) {
    handleAdminStudentAppSettings(request, response);
    return;
  }

  if (urlPath === "/api/app/student-app/modules" && ["GET", "PUT"].includes(request.method)) {
    handleAdminStudentAppModules(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/app/student-app/access/students") {
    handleAdminStudentAppAccess(request, response);
    return;
  }

  const studentAccessMatch = urlPath.match(/^\/api\/app\/student-app\/access\/(\d+)\/(generate-password|reset-password|enable|disable|unlink-telegram|send-instruction)$/);
  if (studentAccessMatch && request.method === "POST") {
    handleAdminStudentAppAccess(request, response, studentAccessMatch[2], Number(studentAccessMatch[1]));
    return;
  }

  const gamificationAwardMatch = urlPath.match(/^\/api\/app\/gamification\/students\/(\d+)\/coins$/);
  if (gamificationAwardMatch && request.method === "POST") {
    handleAdminAwardStudentCoins(request, response, Number(gamificationAwardMatch[1]));
    return;
  }

  const rewardRedemptionMatch = urlPath.match(/^\/api\/app\/gamification\/redemptions\/(\d+)\/(approve|reject|complete)$/);
  if (rewardRedemptionMatch && request.method === "POST") {
    handleAdminRewardRedemptionAction(request, response, Number(rewardRedemptionMatch[1]), rewardRedemptionMatch[2]);
    return;
  }

  const studentAdminTableMatch = urlPath.match(/^\/api\/app\/student-app\/(dictionary|library|materials|news|events|rewards|coin-transactions|reward-redemptions|achievements|referrals|extra-lessons|mock-exams|exams|feedback)(?:\/(\d+))?$/);
  if (studentAdminTableMatch && ["GET", "POST", "PUT", "DELETE"].includes(request.method)) {
    handleAdminStudentAppTable(request, response, studentAdminTableMatch[1], studentAdminTableMatch[2] ? Number(studentAdminTableMatch[2]) : null);
    return;
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

  if (request.method === "GET" && urlPath === "/" && (query.has("tenant") || ["admin", "tenant"].includes(hostKind(request)))) {
    sendAppShell(response);
    return;
  }

  if (request.method === "GET" && urlPath === "/" && hostKind(request) === "app") {
    sendStudentAppShell(response);
    return;
  }

  const appRouteRedirects = new Map([
    ["/super", "/ceo/dashboard"],
    ["/super/", "/ceo/dashboard"],
    ["/super/login", "/ceo/login"],
    ["/super/login/", "/ceo/login"],
    ["/app/", "/app"],
    ["/student-app/", "/app"],
    ["/admin/", "/admin"],
    ["/dashboard/", "/admin/dashboard"],
    ["/login/", "/admin/login"],
    ["/crm/", "/admin"],
    ["/panel/", "/admin"],
    ["/auth/login/", "/admin/auth/login"],
    ["/auth/register/", "/admin/auth/register"]
  ]);

  if (request.method === "GET" && appRouteRedirects.has(urlPath)) {
    sendRedirect(response, appRouteRedirects.get(urlPath));
    return;
  }

  // Public Student App lives at /app. The old /student-app URL remains as a redirect for backward compatibility.
  if (request.method === "GET" && (urlPath === "/student-app" || urlPath.startsWith("/student-app/"))) {
    sendRedirect(response, urlPath.replace(/^\/student-app/, "/app") || "/app");
    return;
  }

  if (request.method === "GET" && (urlPath === "/app" || urlPath.startsWith("/app/"))) {
    sendStudentAppShell(response);
    return;
  }

  const adminRoutes = new Set(["/admin", "/dashboard", "/login", "/crm", "/panel", "/auth/login", "/auth/register", "/auth/forgot-password"]);

  if (
    request.method === "GET" &&
    (adminRoutes.has(urlPath) || urlPath.startsWith("/admin/") || urlPath.startsWith("/super/") || urlPath === "/crm" || urlPath === "/panel")
  ) {
    sendAppShell(response);
    return;
  }

  if (request.method === "GET" && urlPath === "/app.html") {
    sendRedirect(response, "/admin");
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
  logTelegramConfigSummary();
  studentTelegramBot.startPollingIfEnabled({
    getDbPool,
    ensureSchema,
    normalizePhone,
    studentAppPasswordLogin,
    createLinkedStudentAppSession,
    findStudentsByPhone,
    postTelegramMessage,
    getStudentTelegramConfig,
    studentAppWebUrl,
    findPaymentReceiptByNumber,
    hashPassword
  });
});
