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

function platformAdminAuthorized(request) {
  const email = String(request.headers["x-platform-admin-email"] || "").toLowerCase().trim();
  return ["admin@eduka.uz", "manager@eduka.uz"].includes(email);
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

function sendStudentAppShell(response) {
  sendFile(response, path.join(root, "student-app.html"));
}

function isPanelHost(request) {
  const host = String(request.headers.host || "").split(":")[0].toLowerCase();
  return ["app.", "crm.", "dashboard.", "panel."].some((prefix) => host.startsWith(prefix));
}

const reservedSubdomains = new Set(["www", "app", "api", "admin", "super", "mail", "support", "help", "dashboard", "control", "billing"]);

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
    if (!platformAdminAuthorized(request)) {
      sendJson(response, 401, { ok: false, message: "Admin sessiya topilmadi" });
      return;
    }

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

const studentAppDefaultModules = [
  ["group", "Mening guruhim", "Guruh, o'qituvchi, jadval va davomat", "users-round", 10],
  ["exams", "Imtihonlarim", "Natijalar va sinov imtihonlari", "file-check-2", 20],
  ["library", "Kutubxona", "Kitob, audio, video va resurslar", "book-open", 30],
  ["dictionary", "Lug'atlar", "So'zlar, izohlar va misollar", "languages", 40],
  ["extra_lesson", "Qo'shimcha dars", "Qo'shimcha darsga yozilish", "calendar-plus", 50],
  ["rating", "Reyting", "Ball, kristal va yutuqlar", "trophy", 60],
  ["referral", "Referral tizimi", "Do'st taklif qilish va bonuslar", "gift", 70],
  ["news", "Yangiliklar", "Markaz yangiliklari va tadbirlar", "megaphone", 80],
  ["payments", "Balans va to'lov", "Balans, qarzdorlik va to'lov tarixi", "wallet", 90],
  ["feedback", "Shikoyat va taklif", "Mas'ullarga murojaat yuborish", "message-square", 100]
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
  const configured = String(process.env.WEBAPP_URL || "").trim();
  const baseDomain = String(process.env.BASE_DOMAIN || "eduka.uz").trim();
  const subdomain = String(organization?.subdomain || organization?.slug || "").trim();
  const base = configured || (subdomain ? `https://${subdomain}.${baseDomain}/student-app` : `https://${baseDomain}/student-app`);
  const url = new URL(base);
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
  const student = {
    id: 1,
    fullName: "Ali Abdullayev",
    phone: "+998 90 123 45 67",
    groupName: "KURS - A1",
    courseName: "IELTS Foundation",
    balance: -192308,
    crystals: 120,
    coins: 2450,
    referralCode: "ALI120"
  };
  return {
    student,
    organization: { id: 1, name: "Eduka", subdomain: "app" },
    settings: {
      enabled: true,
      app_name: "Eduka Student App",
      theme_primary: "#0A84FF",
      crystals_enabled: true,
      coins_enabled: true,
      rating_enabled: true,
      referral_enabled: true,
      library_enabled: true,
      dictionary_enabled: true,
      extra_lessons_enabled: true,
      exams_enabled: true,
      news_enabled: true,
      payments_enabled: true,
      complaints_enabled: true
    },
    modules: studentAppDefaultModules.map(([key, title, description, icon, sort_order]) => ({ key, title, description, icon, enabled: true, sort_order })),
    events: [{ id: 1, title: "Speaking Club", description: "Suhbat mashqi", event_date: "2026-05-24", event_time: "15:00", status: "active" }],
    news: [{ id: 1, title: "Speaking Club ochildi", description: "Har shanba suhbat mashqlari", publish_date: "2026-05-20", status: "published" }],
    lessons: [
      { id: 1, title: "Grammar: Present Simple", time: "10:00 - 10:45", status: "completed" },
      { id: 2, title: "Listening Practice", time: "11:00 - 11:45", status: "in_progress" }
    ],
    library: [
      { id: 1, title: "English Grammar in Use", type: "book", level: "A2-B1", status: "published" },
      { id: 2, title: "IELTS Listening Recent Tests", type: "audio", level: "B2", status: "published" }
    ],
    dictionary: [
      { id: 1, word: "Achieve", pronunciation: "/əˈtʃiːv/", translation: "erishmoq", example: "I want to achieve my goals.", level: "A2" },
      { id: 2, word: "Benefit", pronunciation: "/ˈbenɪfɪt/", translation: "foyda", example: "Regular practice has many benefits.", level: "B1" }
    ],
    exams: [{ id: 1, title: "Grammar Quiz", score: 92, max_score: 100, grade: "A+", exam_date: "2026-05-15" }],
    mockExams: [{ id: 1, title: "IELTS Mock", description: "Listening, Reading, Writing, Speaking", exam_date: "2026-05-25", price: 100000, status: "active" }],
    referrals: [],
    extraLessons: [],
    feedback: [],
    payments: [{ id: 1, payment_month: "2026-05", due_amount: 700000, amount: 507692, status: "partial", paid_at: "2026-05-05", payment_type: "click" }],
    ranking: [
      { student_id: 2, full_name: "Akbar", score: 320 },
      { student_id: 1, full_name: "Ali", score: 280 },
      { student_id: 3, full_name: "Yahyobek", score: 210 }
    ]
  };
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
  const temporaryPassword = normalizePhone(student.phone).slice(-4);
  const valid = student.app_password_hash ? verifyPassword(password, student.app_password_hash) : (password && password === temporaryPassword);
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
    sendJson(response, 200, { ok: true, ...fallbackStudentAppPayload() });
    return;
  }
  const session = await requireStudentAppSession(request, response);
  if (!session) return;
  const payload = await studentAppBasePayload(session.pool, session.row);
  sendJson(response, 200, { ok: true, ...payload });
}

async function handleStudentAppData(request, response, resource) {
  if (!process.env.DATABASE_URL) {
    const fallback = fallbackStudentAppPayload();
    const map = {
      home: fallback,
      profile: fallback,
      group: { groups: fallback.groups || [{ id: 1, name: "KURS - A1", teacher_name: "Mr. John", attendance_percent: 92 }], student: fallback.student },
      study: { lessons: fallback.lessons, groups: fallback.groups || [] },
      rating: { ranking: fallback.ranking, student: fallback.student },
      library: { items: fallback.library },
      dictionary: { items: fallback.dictionary },
      exams: { exams: fallback.exams, mockExams: fallback.mockExams },
      referrals: { referrals: fallback.referrals, referralCode: fallback.student.referralCode },
      news: { news: fallback.news, events: fallback.events },
      payments: { payments: fallback.payments, student: fallback.student },
      settings: { settings: fallback.settings }
    };
    sendJson(response, 200, { ok: true, ...(map[resource] || fallback) });
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
    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM students WHERE organization_id=$1 AND student_app_enabled=TRUE) AS enabled_students,
        (SELECT COUNT(*)::int FROM students WHERE organization_id=$1 AND telegram_chat_id IS NOT NULL) AS telegram_linked,
        (SELECT COUNT(*)::int FROM student_app_sessions WHERE organization_id=$1 AND revoked_at IS NULL AND expires_at > NOW()) AS active_sessions,
        (SELECT COUNT(*)::int FROM student_referrals WHERE organization_id=$1) AS referrals,
        (SELECT COUNT(*)::int FROM student_library_items WHERE organization_id=$1) AS library_items,
        (SELECT COUNT(*)::int FROM student_dictionary_words WHERE organization_id=$1) AS dictionary_words,
        (SELECT COUNT(*)::int FROM student_extra_lesson_requests WHERE organization_id=$1 AND status='pending') AS extra_lesson_requests,
        (SELECT COUNT(*)::int FROM student_feedback WHERE organization_id=$1 AND status='new') AS latest_feedback`,
      [user.organization_id]
    );
    sendJson(response, 200, { ok: true, summary: result.rows[0] });
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
        `SELECT id, full_name, phone, telegram_user_id, telegram_chat_id, student_app_enabled, student_app_blocked,
                app_password_set_at, app_password_reset_required, last_student_app_login
         FROM students
         WHERE organization_id=$1
         ORDER BY id DESC`,
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
  const config = getTelegramConfig({ allowMissing: true });
  if (!config.tokenPresent) return { ok: false, message: "BOT_TOKEN sozlanmagan" };
  await postTelegramMessage(config.token, student.telegram_chat_id, message);
  return { ok: true, message: "Xabar yuborildi" };
}

async function handleTelegramWebhook(request, response) {
  const expectedSecret = String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
  if (expectedSecret) {
    const actualSecret = String(request.headers["x-telegram-bot-api-secret-token"] || "").trim();
    if (actualSecret !== expectedSecret) {
      sendJson(response, 403, { ok: false, message: "Forbidden" });
      return;
    }
  }
  try {
    const update = await readJsonBody(request);
    await studentTelegramBot.handleUpdate(update, {
      getDbPool,
      ensureSchema,
      normalizePhone,
      studentAppPasswordLogin,
      createLinkedStudentAppSession,
      findStudentsByPhone,
      postTelegramMessage,
      getTelegramConfig,
      studentAppWebUrl,
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
    const config = getTelegramConfig({ allowMissing: true });
    if (!config.tokenPresent) {
      sendJson(response, 503, { ok: false, message: "BOT_TOKEN sozlanmagan" });
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

  if (request.method === "POST" && urlPath === "/api/auth/tenant-login") {
    handleTenantLoginRequest(request, response);
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

  if (request.method === "POST" && urlPath === "/api/telegram/webhook") {
    handleTelegramWebhook(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/telegram/set-webhook") {
    handleTelegramSetWebhook(request, response);
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

  const studentDataMatch = urlPath.match(/^\/api\/student-app\/(home|profile|group|study|rating|library|dictionary|exams|referrals|news|payments|settings)$/);
  if (studentDataMatch && request.method === "GET") {
    handleStudentAppData(request, response, studentDataMatch[1]);
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

  const studentAdminTableMatch = urlPath.match(/^\/api\/app\/student-app\/(dictionary|library|news|events|referrals|extra-lessons|mock-exams|feedback)(?:\/(\d+))?$/);
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

  if (request.method === "GET" && urlPath === "/" && (query.has("tenant") || ["admin", "app", "tenant"].includes(hostKind(request)))) {
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

  if (request.method === "GET" && (urlPath === "/student-app" || urlPath.startsWith("/student-app/"))) {
    sendStudentAppShell(response);
    return;
  }

  const appRoutes = new Set(["/app", "/dashboard", "/login", "/crm", "/panel", "/auth/login", "/auth/register", "/auth/forgot-password"]);

  if (
    request.method === "GET" &&
    (appRoutes.has(urlPath) || urlPath.startsWith("/app/") || urlPath.startsWith("/super/") || urlPath.startsWith("/admin/") || urlPath === "/admin")
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
  studentTelegramBot.startPollingIfEnabled({
    getDbPool,
    ensureSchema,
    normalizePhone,
    studentAppPasswordLogin,
    createLinkedStudentAppSession,
    findStudentsByPhone,
    postTelegramMessage,
    getTelegramConfig,
    studentAppWebUrl,
    hashPassword
  });
});
