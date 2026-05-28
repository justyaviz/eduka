
/* ===== EDUKA PHASE 3.7 HARD PAGE GATE — CEO CENTERS OPEN, UNKNOWN CLOSED =====
   Maqsad:
   - CEO panelda bor o‘quv markazlar ochiladi.
   - Random/yo‘q subdomainlarda CRM HTML umuman ko‘rinmaydi.
   - Oldingi created_by_ceo/status=active sharti olib tashlandi, chunki eski CEO markazlarda bu maydonlar boshqacha bo‘lishi mumkin.
*/
const { Pool } = require("pg");

function phase35Host(req) {
  return String(req.headers["x-forwarded-host"] || req.headers.host || "").split(":")[0].toLowerCase();
}

function phase35RootDomain() {
  return String(process.env.BASE_DOMAIN || "eduka.uz")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

function phase35Subdomain(req) {
  const host = phase35Host(req);
  const root = phase35RootDomain();

  if (!host) return "main";
  if (host === root || host === "www." + root) return "main";
  if (host.includes("localhost") || host.includes("127.0.0.1") || host.includes("railway.app")) return "main";

  if (host.endsWith("." + root)) {
    return host.slice(0, -("." + root).length).split(".")[0] || "main";
  }

  return host.split(".")[0] || "main";
}

function phase35IsRoot(req) {
  const t = phase35Subdomain(req);
  return !t || t === "main" || t === "www";
}

function phase35NotFoundHtml(req) {
  const tenant = phase35Subdomain(req);
  const host = phase35Host(req);
  return `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>O‘quv markaz topilmadi — EDUKA</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:Inter,Arial,sans-serif;background:linear-gradient(135deg,#f7fbff,#eef4ff);color:#071137;min-height:100vh;display:grid;place-items:center;padding:24px}
  .card{width:min(560px,100%);background:#fff;border:1px solid #e4ebf6;border-radius:28px;box-shadow:0 30px 90px rgba(6,18,62,.14);padding:38px}
  .logo{display:flex;align-items:center;gap:12px;font-size:26px;font-weight:950;margin-bottom:22px}
  .mark{width:38px;height:38px;border-radius:11px;background:#1455ff;color:#fff;display:grid;place-items:center;font-weight:950}
  .badge{display:inline-flex;background:#fff1f2;color:#e11d48;border-radius:999px;padding:8px 14px;font-weight:900;margin-bottom:18px}
  h1{font-size:36px;line-height:1.05;margin:0 0 14px}
  p{font-size:16px;line-height:1.7;color:#5c6a86;margin:0 0 24px}
  b{color:#071137}
  .actions{display:flex;gap:12px;flex-wrap:wrap}
  a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border-radius:14px;text-decoration:none;font-weight:900}
  a.primary{background:#1455ff;color:#fff}
  a.secondary{background:#eef4ff;color:#1455ff}
  .host{margin-top:18px;color:#7b89a3;font-size:13px}
</style>
</head>
<body>
  <div class="card">
    <div class="logo"><div class="mark">↗</div><span>EDUKA</span></div>
    <span class="badge">Subdomain topilmadi</span>
    <h1>O‘quv markaz topilmadi</h1>
    <p><b>${tenant}.eduka.uz</b> subdomaini EDUKA CEO panelidagi o‘quv markazlar ro‘yxatida topilmadi. Linkni tekshiring yoki EDUKA admini bilan bog‘laning.</p>
    <div class="actions">
      <a class="primary" href="tel:+998998939000">+998 99 893 90 00</a>
      <a class="secondary" href="https://t.me/eduka_sales" target="_blank">Telegram support</a>
    </div>
    <div class="host">Host: ${host}</div>
  </div>
</body>
</html>`;
}

function phase35DbUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRIVATE_URL || process.env.PG_URL;
}

async function phase35DbQuery(sql, params) {
  const url = phase35DbUrl();
  if (!url) throw new Error("DATABASE_URL topilmadi");

  if (!global.__edukaPhase35Pool) {
    global.__edukaPhase35Pool = new Pool({
      connectionString: url,
      ssl: url.includes("railway") && !url.includes(".internal") ? { rejectUnauthorized:false } : false
    });
  }
  return global.__edukaPhase35Pool.query(sql, params || []);
}

async function phase37TableExists(tableName) {
  try {
    const q = await phase35DbQuery(
      `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1 LIMIT 1`,
      [tableName]
    );
    return !!q.rows[0];
  } catch(e) {
    return false;
  }
}

async function phase37Columns(tableName) {
  const q = await phase35DbQuery(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
    [tableName]
  );
  return new Set(q.rows.map(r => r.column_name));
}

function phase37CandidateConditions(cols, paramIndex) {
  const p = `$${paramIndex}`;
  const cond = [];

  // Eng asosiy: CEO kartada ko‘rinayotgan subdomain shu joylardan birida saqlangan bo‘lishi mumkin.
  for (const c of ["subdomain", "slug", "tenant", "tenant_slug", "domain", "host", "name"]) {
    if (cols.has(c)) {
      if (c === "domain" || c === "host") {
        cond.push(`lower(${c}) = lower(${p})`);
        cond.push(`lower(${c}) = lower(${p} || '.eduka.uz')`);
      } else {
        cond.push(`lower(${c}) = lower(${p})`);
      }
    }
  }

  return cond.length ? "(" + cond.join(" OR ") + ")" : null;
}

function phase37NotDeletedCondition(cols) {
  const parts = [];
  if (cols.has("deleted_at")) parts.push("deleted_at IS NULL");
  if (cols.has("is_deleted")) parts.push("COALESCE(is_deleted, FALSE) = FALSE");
  if (cols.has("archived_at")) parts.push("archived_at IS NULL");
  return parts.length ? parts.join(" AND ") : "TRUE";
}

async function phase37FindCenterRecord(tenant) {
  // Avval organizations: CEO paneldagi O‘quv markazlar odatda shu yerda.
  for (const table of ["organizations", "centers", "education_centers", "crm_centers"]) {
    if (!(await phase37TableExists(table))) continue;

    const cols = await phase37Columns(table);
    const match = phase37CandidateConditions(cols, 1);
    if (!match) continue;

    const notDeleted = phase37NotDeletedCondition(cols);

    const q = await phase35DbQuery(
      `SELECT *, '${table}' AS __source_table
       FROM ${table}
       WHERE ${match}
         AND ${notDeleted}
       LIMIT 1`,
      [tenant]
    );

    if (q.rows[0]) return q.rows[0];
  }

  return null;
}

async function phase35TenantExists(req) {
  if (phase35IsRoot(req)) return true;
  const tenant = phase35Subdomain(req);
  const row = await phase37FindCenterRecord(tenant);
  return !!row;
}

async function phase37GetTenantRecord(req) {
  if (phase35IsRoot(req)) return null;
  return phase37FindCenterRecord(phase35Subdomain(req));
}

function installPhase35HardPageGate(app) {
  // Bu middleware static/app fallbackdan OLDIN chaqirilishi kerak.
  app.use(async (req, res, next) => {
    try {
      if (req.method !== "GET") return next();

      if (phase35IsRoot(req)) return next();

      const ok = await phase35TenantExists(req);

      if (!ok) {
        if ((req.path || "").startsWith("/api/")) {
          return res.status(404).json({
            ok:false,
            code:"TENANT_NOT_FOUND",
            tenant:phase35Subdomain(req),
            host:phase35Host(req),
            message:"O‘quv markaz topilmadi. Iltimos, EDUKA admini bilan bog‘laning.",
            support:{ phone:"+998 99 893 90 00", telegram:"https://t.me/eduka_sales" }
          });
        }
        return res.status(404).send(phase35NotFoundHtml(req));
      }

      return next();
    } catch (e) {
      // Xavfsizlik: DB xato bo‘lsa random subdomain CRM ochilmasin.
      if (!phase35IsRoot(req)) {
        return res.status(404).send(phase35NotFoundHtml(req));
      }
      return next();
    }
  });
}

module.exports = {
  installPhase35HardPageGate,
  phase35Subdomain,
  phase35Host,
  phase35TenantExists,
  phase35NotFoundHtml,
  phase37GetTenantRecord,
  phase37FindCenterRecord
};
