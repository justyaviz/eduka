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
    phone: row.phone,
    role: row.role,
    organization: row.organization_id
      ? {
          id: row.organization_id,
          name: row.organization_name,
          licenseExpiresAt: row.license_expires_at
        }
      : null
  };
}

const rolePermissions = {
  admin: ["*"],
  ceo: ["*"],
  rahbar: ["*"],
  manager: ["read", "students:write", "leads:write", "groups:read", "teachers:read", "attendance:read"],
  menejer: ["read", "students:write", "leads:write", "groups:read", "teachers:read", "attendance:read"],
  teacher: ["read", "groups:read", "students:read", "attendance:write"],
  oqituvchi: ["read", "groups:read", "students:read", "attendance:write"],
  accountant: ["read", "students:read", "payments:write", "finance:write"],
  buxgalter: ["read", "students:read", "payments:write", "finance:write"]
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

async function findSessionUser(request) {
  const token = parseCookies(request)[sessionCookieName];
  if (!token) return null;

  const pool = getDbPool();
  await ensureSchema(pool);
  const result = await pool.query(
    `SELECT
       u.id,
       u.full_name,
       u.phone,
       u.role,
       u.organization_id,
       o.name AS organization_name,
       o.license_expires_at
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

async function handleLoginRequest(request, response) {
  try {
    if (!checkLoginRateLimit(request)) {
      sendJson(response, 429, { ok: false, message: "Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring" });
      return;
    }

    const body = await readJsonBody(request);
    const phone = String(body.phone || "").trim();
    const password = String(body.password || "");
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone || !password) {
      sendJson(response, 400, { ok: false, message: "Telefon raqam va parol kerak" });
      return;
    }

    const pool = getDbPool();
    await ensureSchema(pool);
    const result = await pool.query(
      `SELECT
         u.id,
         u.full_name,
         u.phone,
         u.role,
         u.password_hash,
         u.organization_id,
         o.name AS organization_name,
         o.license_expires_at
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
       WHERE u.normalized_phone = $1
         AND u.is_active = TRUE
       LIMIT 1`,
      [normalizedPhone]
    );
    const user = result.rows[0];

    if (!user || !verifyPassword(password, user.password_hash)) {
      sendJson(response, 401, { ok: false, message: "Telefon raqam yoki parol noto'g'ri" });
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

async function listRows(request, response, config) {
  try {
    const user = await requireUser(request, response, `${config.permission}:read`);
    if (!user) return;

    const result = await getDbPool().query(config.listSql, [user.organization_id]);
    sendJson(response, 200, { ok: true, items: result.rows });
  } catch (error) {
    withError(response, `List ${config.entity}`, error);
  }
}

async function createRow(request, response, config) {
  try {
    const user = await requireUser(request, response, `${config.permission}:write`);
    if (!user) return;

    const body = await readJsonBody(request);
    const data = config.prepare(body, user);
    const result = await getDbPool().query(config.insertSql, data.values);
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
    const result = await getDbPool().query(config.updateSql, data.values);

    if (!result.rows[0]) {
      sendJson(response, 404, { ok: false, message: "Ma'lumot topilmadi" });
      return;
    }

    await writeAudit(getDbPool(), user, "update", config.entity, id, data.audit || body);
    sendJson(response, 200, { ok: true, item: result.rows[0] });
  } catch (error) {
    withError(response, `Update ${config.entity}`, error);
  }
}

async function deleteRow(request, response, config, id) {
  try {
    const user = await requireUser(request, response, `${config.permission}:write`);
    if (!user) return;

    const result = await getDbPool().query(config.deleteSql, [id, user.organization_id]);

    if (!result.rows[0]) {
      sendJson(response, 404, { ok: false, message: "Ma'lumot topilmadi" });
      return;
    }

    await writeAudit(getDbPool(), user, "delete", config.entity, id);
    sendJson(response, 200, { ok: true });
  } catch (error) {
    withError(response, `Delete ${config.entity}`, error);
  }
}

const crudConfigs = {
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
    insertSql: `INSERT INTO students (organization_id, full_name, phone, parent_phone, birth_date, course_name, group_id, status, balance, note)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    updateSql: `UPDATE students SET full_name=$3, phone=$4, parent_phone=$5, birth_date=$6, course_name=$7, group_id=$8, status=$9, balance=$10, note=$11
      WHERE id=$1 AND organization_id=$2 RETURNING *`,
    deleteSql: "DELETE FROM students WHERE id=$1 AND organization_id=$2 RETURNING id",
    prepare: (body, user, id) => ({
      values: id
        ? [id, user.organization_id, asText(body.full_name), asText(body.phone), asText(body.parent_phone), asDate(body.birth_date), asText(body.course_name), body.group_id || null, asText(body.status, "active"), asNumber(body.balance), asText(body.note)]
        : [user.organization_id, asText(body.full_name), asText(body.phone), asText(body.parent_phone), asDate(body.birth_date), asText(body.course_name), body.group_id || null, asText(body.status, "active"), asNumber(body.balance), asText(body.note)]
    })
  },
  leads: {
    entity: "leads",
    permission: "leads",
    listSql: "SELECT * FROM leads WHERE organization_id=$1 ORDER BY id DESC",
    insertSql: `INSERT INTO leads (organization_id, full_name, phone, status, source, manager_name, next_contact_at, note)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    updateSql: `UPDATE leads SET full_name=$3, phone=$4, status=$5, source=$6, manager_name=$7, next_contact_at=$8, note=$9
      WHERE id=$1 AND organization_id=$2 RETURNING *`,
    deleteSql: "DELETE FROM leads WHERE id=$1 AND organization_id=$2 RETURNING id",
    prepare: (body, user, id) => ({
      values: id
        ? [id, user.organization_id, asText(body.full_name), asText(body.phone), asText(body.status, "new"), asText(body.source), asText(body.manager_name), asDate(body.next_contact_at), asText(body.note)]
        : [user.organization_id, asText(body.full_name), asText(body.phone), asText(body.status, "new"), asText(body.source), asText(body.manager_name), asDate(body.next_contact_at), asText(body.note)]
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
    insertSql: `INSERT INTO groups (organization_id, name, course_name, status, teacher_id, teacher_name, days, starts_at, ends_at, room)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    updateSql: `UPDATE groups SET name=$3, course_name=$4, status=$5, teacher_id=$6, teacher_name=$7, days=$8, starts_at=$9, ends_at=$10, room=$11
      WHERE id=$1 AND organization_id=$2 RETURNING *`,
    deleteSql: "DELETE FROM groups WHERE id=$1 AND organization_id=$2 RETURNING id",
    prepare: (body, user, id) => ({
      values: id
        ? [id, user.organization_id, asText(body.name), asText(body.course_name), asText(body.status, "active"), body.teacher_id || null, asText(body.teacher_name), asText(body.days), asDate(body.starts_at), asDate(body.ends_at), asText(body.room)]
        : [user.organization_id, asText(body.name), asText(body.course_name), asText(body.status, "active"), body.teacher_id || null, asText(body.teacher_name), asText(body.days), asDate(body.starts_at), asDate(body.ends_at), asText(body.room)]
    })
  },
  teachers: {
    entity: "teachers",
    permission: "teachers",
    listSql: "SELECT * FROM teachers WHERE organization_id=$1 ORDER BY id DESC",
    insertSql: `INSERT INTO teachers (organization_id, full_name, phone, subjects, status, salary_rate)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    updateSql: `UPDATE teachers SET full_name=$3, phone=$4, subjects=$5, status=$6, salary_rate=$7
      WHERE id=$1 AND organization_id=$2 RETURNING *`,
    deleteSql: "DELETE FROM teachers WHERE id=$1 AND organization_id=$2 RETURNING id",
    prepare: (body, user, id) => ({
      values: id
        ? [id, user.organization_id, asText(body.full_name), asText(body.phone), asText(body.subjects), asText(body.status, "active"), asNumber(body.salary_rate)]
        : [user.organization_id, asText(body.full_name), asText(body.phone), asText(body.subjects), asText(body.status, "active"), asNumber(body.salary_rate)]
    })
  }
};

async function handlePaymentCreate(request, response) {
  try {
    const user = await requireUser(request, response, "payments:write");
    if (!user) return;

    const body = await readJsonBody(request);
    const amount = asNumber(body.amount);
    const pool = getDbPool();
    const result = await pool.query(
      `INSERT INTO payments (organization_id, student_id, amount, payment_type, note, created_by, paid_at)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::timestamptz,NOW())) RETURNING *`,
      [user.organization_id, body.student_id || null, amount, asText(body.payment_type, "naqd"), asText(body.note), user.id, asDate(body.paid_at)]
    );

    if (body.student_id) {
      await pool.query("UPDATE students SET balance = GREATEST(balance - $1, 0) WHERE id=$2 AND organization_id=$3", [amount, body.student_id, user.organization_id]);
    }

    await writeAudit(pool, user, "create", "payments", result.rows[0].id, body);
    sendJson(response, 201, { ok: true, item: result.rows[0] });
  } catch (error) {
    withError(response, "Create payments", error);
  }
}

async function listPayments(request, response) {
  try {
    const user = await requireUser(request, response, "read");
    if (!user) return;

    const result = await getDbPool().query(
      `SELECT p.*, s.full_name AS student_name, u.full_name AS created_by_name
       FROM payments p
       LEFT JOIN students s ON s.id = p.student_id
       LEFT JOIN users u ON u.id = p.created_by
       WHERE p.organization_id=$1
       ORDER BY p.paid_at DESC, p.id DESC`,
      [user.organization_id]
    );
    sendJson(response, 200, { ok: true, items: result.rows });
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
      const result = await pool.query(
        `SELECT a.*, s.full_name AS student_name, g.name AS group_name
         FROM attendance_records a
         LEFT JOIN students s ON s.id=a.student_id
         LEFT JOIN groups g ON g.id=a.group_id
         WHERE a.organization_id=$1
         ORDER BY a.lesson_date DESC, a.id DESC`,
        [user.organization_id]
      );
      sendJson(response, 200, { ok: true, items: result.rows });
      return;
    }

    const body = await readJsonBody(request);
    const result = await pool.query(
      `INSERT INTO attendance_records (organization_id, group_id, student_id, lesson_date, status, note, marked_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (organization_id, group_id, student_id, lesson_date)
       DO UPDATE SET status=EXCLUDED.status, note=EXCLUDED.note, marked_by=EXCLUDED.marked_by
       RETURNING *`,
      [user.organization_id, body.group_id, body.student_id, asDate(body.lesson_date), asText(body.status, "present"), asText(body.note), user.id]
    );

    await writeAudit(pool, user, "upsert", "attendance_records", result.rows[0].id, body);
    sendJson(response, 200, { ok: true, item: result.rows[0] });
  } catch (error) {
    withError(response, "Attendance", error);
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

  if (request.method === "GET" && urlPath === "/api/auth/me") {
    handleMeRequest(request, response);
    return;
  }

  if (request.method === "POST" && urlPath === "/api/auth/logout") {
    handleLogoutRequest(request, response);
    return;
  }

  if (request.method === "GET" && urlPath === "/api/app/summary") {
    handleSummaryRequest(request, response);
    return;
  }

  const crudMatch = urlPath.match(/^\/api\/(students|leads|groups|teachers)(?:\/(\d+))?$/);
  if (crudMatch) {
    const [, resource, id] = crudMatch;
    const config = crudConfigs[resource];

    if (request.method === "GET" && !id) {
      listRows(request, response, config);
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

  if (urlPath === "/api/payments") {
    if (request.method === "GET") {
      listPayments(request, response);
      return;
    }

    if (request.method === "POST") {
      handlePaymentCreate(request, response);
      return;
    }
  }

  if (urlPath === "/api/attendance" && ["GET", "POST"].includes(request.method)) {
    handleAttendance(request, response);
    return;
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
