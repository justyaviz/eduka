
/* ===== EDUKA PHASE 3.9 FORCE TENANT SYSTEM INSTALL =====
   Bu fayl server ishga tushishi bilan tenant tekshiruv, debug va status routelarni majburiy ulaydi.
*/
const { Pool } = require("pg");

function p39DbUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRIVATE_URL || process.env.PG_URL;
}

function p39Pool() {
  const url = p39DbUrl();
  if (!url) throw new Error("DATABASE_URL topilmadi");
  if (!global.__edukaP39Pool) {
    global.__edukaP39Pool = new Pool({
      connectionString: url,
      ssl: url.includes("railway") && !url.includes(".internal") ? { rejectUnauthorized:false } : false
    });
  }
  return global.__edukaP39Pool;
}

async function p39Query(sql, params) {
  return p39Pool().query(sql, params || []);
}

function p39Host(req) {
  return String(req.headers["x-forwarded-host"] || req.headers.host || "").split(":")[0].toLowerCase();
}

function p39RootDomain() {
  return String(process.env.BASE_DOMAIN || "eduka.uz")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

function p39Subdomain(req) {
  const host = p39Host(req);
  const root = p39RootDomain();

  if (!host) return "main";
  if (host === root || host === "www." + root) return "main";
  if (host.includes("localhost") || host.includes("127.0.0.1") || host.includes("railway.app")) return "main";

  if (host.endsWith("." + root)) {
    return host.slice(0, -("." + root).length).split(".")[0] || "main";
  }

  return host.split(".")[0] || "main";
}

function p39IsRoot(req) {
  const t = p39Subdomain(req);
  return !t || t === "main" || t === "www";
}

function p39Slug(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['‘’`ʻʼ]/g, "")
    .replace(/&/g, " va ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function p39TableExists(tableName) {
  const q = await p39Query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1 LIMIT 1`,
    [tableName]
  );
  return !!q.rows[0];
}

async function p39Columns(tableName) {
  const q = await p39Query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
    [tableName]
  );
  return new Set(q.rows.map(r => r.column_name));
}

function p39NotDeleted(cols) {
  const parts = [];
  if (cols.has("deleted_at")) parts.push("deleted_at IS NULL");
  if (cols.has("is_deleted")) parts.push("COALESCE(is_deleted, FALSE) = FALSE");
  if (cols.has("archived_at")) parts.push("archived_at IS NULL");
  return parts.length ? parts.join(" AND ") : "TRUE";
}

async function p39FindCenter(tenant) {
  const wanted = p39Slug(tenant);
  const tables = ["organizations", "centers", "education_centers", "crm_centers", "schools", "tenants"];

  for (const table of tables) {
    const exists = await p39TableExists(table).catch(() => false);
    if (!exists) continue;

    const cols = await p39Columns(table);
    const direct = [];

    for (const c of ["subdomain", "slug", "tenant", "tenant_slug"]) {
      if (cols.has(c)) direct.push(`lower(${c}) = lower($1)`);
    }
    for (const c of ["domain", "host"]) {
      if (cols.has(c)) {
        direct.push(`lower(${c}) = lower($1)`);
        direct.push(`lower(${c}) = lower($1 || '.eduka.uz')`);
      }
    }

    if (direct.length) {
      const q = await p39Query(
        `SELECT *, '${table}' AS __source_table
         FROM ${table}
         WHERE (${direct.join(" OR ")})
           AND ${p39NotDeleted(cols)}
         LIMIT 1`,
        [tenant]
      );
      if (q.rows[0]) return q.rows[0];
    }

    const nameCols = ["name", "center_name", "organization_name", "title"].filter(c => cols.has(c));
    if (nameCols.length) {
      const q = await p39Query(
        `SELECT *, '${table}' AS __source_table
         FROM ${table}
         WHERE ${p39NotDeleted(cols)}
         ORDER BY id DESC
         LIMIT 1000`,
        []
      );

      for (const row of q.rows) {
        const values = [
          row.subdomain,
          row.slug,
          row.tenant,
          row.name,
          row.center_name,
          row.organization_name,
          row.title
        ];
        if (values.some(v => p39Slug(v) === wanted)) return row;
      }
    }
  }

  return null;
}

function p39NotFoundPayload(req) {
  return {
    ok:false,
    code:"TENANT_NOT_FOUND",
    tenant:p39Subdomain(req),
    host:p39Host(req),
    message:"O‘quv markaz topilmadi. Iltimos, EDUKA admini bilan bog‘laning.",
    support:{ phone:"+998 99 893 90 00", telegram:"https://t.me/eduka_sales" }
  };
}

function p39NotFoundHtml(req) {
  const data = p39NotFoundPayload(req);
  return `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>O‘quv markaz topilmadi — EDUKA</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif;background:linear-gradient(135deg,#f7fbff,#eef4ff);color:#071137;min-height:100vh;display:grid;place-items:center;padding:24px}.card{width:min(560px,100%);background:#fff;border:1px solid #e4ebf6;border-radius:28px;box-shadow:0 30px 90px rgba(6,18,62,.14);padding:38px}.logo{display:flex;align-items:center;gap:12px;font-size:26px;font-weight:950;margin-bottom:22px}.mark{width:38px;height:38px;border-radius:11px;background:#1455ff;color:#fff;display:grid;place-items:center;font-weight:950}.badge{display:inline-flex;background:#fff1f2;color:#e11d48;border-radius:999px;padding:8px 14px;font-weight:900;margin-bottom:18px}h1{font-size:36px;line-height:1.05;margin:0 0 14px}p{font-size:16px;line-height:1.7;color:#5c6a86;margin:0 0 24px}b{color:#071137}.actions{display:flex;gap:12px;flex-wrap:wrap}a{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border-radius:14px;text-decoration:none;font-weight:900}a.primary{background:#1455ff;color:#fff}a.secondary{background:#eef4ff;color:#1455ff}.host{margin-top:18px;color:#7b89a3;font-size:13px}
</style>
</head>
<body>
<div class="card">
<div class="logo"><div class="mark">↗</div><span>EDUKA</span></div>
<span class="badge">Subdomain topilmadi</span>
<h1>O‘quv markaz topilmadi</h1>
<p><b>${data.tenant}.eduka.uz</b> subdomaini EDUKA CEO panelidagi o‘quv markazlar ro‘yxatida topilmadi.</p>
<div class="actions"><a class="primary" href="tel:+998998939000">+998 99 893 90 00</a><a class="secondary" href="https://t.me/eduka_sales" target="_blank">Telegram support</a></div>
<div class="host">Host: ${data.host}</div>
</div>
</body>
</html>`;
}

async function p39EnsureSubdomains() {
  const exists = await p39TableExists("organizations").catch(() => false);
  if (!exists) return;
  await p39Query(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subdomain TEXT`);
  await p39Query(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`);
  await p39Query(`
    UPDATE organizations
    SET subdomain = trim(both '-' from regexp_replace(lower(coalesce(name, '')), '[^a-z0-9]+', '-', 'g'))
    WHERE (subdomain IS NULL OR subdomain = '')
      AND COALESCE(name, '') <> ''
  `);
}


async function p40ReadJsonBody(req) {
  if (req.body && typeof req.body === "object" && Object.keys(req.body).length) return req.body;

  return new Promise((resolve) => {
    let raw = "";
    req.on("data", chunk => { raw += chunk; if (raw.length > 1024 * 1024) req.destroy(); });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch(e) { resolve({}); }
    });
    req.on("error", () => resolve({}));
  });
}

async function p40EnsureAuthTables() {
  await p39Query(`
    CREATE TABLE IF NOT EXISTS crm_sessions (
      id SERIAL PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      tenant TEXT NOT NULL,
      admin_id INTEGER,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await p39Query(`
    CREATE TABLE IF NOT EXISTS crm_tenant_admins (
      id SERIAL PRIMARY KEY,
      tenant TEXT NOT NULL,
      name TEXT,
      email TEXT,
      phone TEXT,
      password TEXT,
      role TEXT DEFAULT 'admin',
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

function p40Token() {
  return "eduka_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 18);
}

function p40Clean(v) {
  return String(v || "").trim();
}

async function p40FindAdminInTenantAdmins(tenant, org, login, password) {
  const tenantVariants = Array.from(new Set([
    p39Slug(tenant),
    tenant,
    p39Slug(org && org.subdomain),
    org && org.subdomain,
    p39Slug(org && org.name),
    org && org.name
  ].filter(Boolean).map(v => String(v).toLowerCase())));

  const q = await p39Query(`
    SELECT *
    FROM crm_tenant_admins
    WHERE lower(tenant) = ANY($1::text[])
      AND COALESCE(status, 'active') <> 'deleted'
      AND (
        lower(COALESCE(email,'')) = lower($2)
        OR regexp_replace(COALESCE(phone,''), '[^0-9]', '', 'g') = regexp_replace($2, '[^0-9]', '', 'g')
        OR lower(COALESCE(name,'')) = lower($2)
        OR lower(COALESCE(role,'')) = lower($2)
      )
      AND COALESCE(password,'') = $3
    LIMIT 1
  `, [tenantVariants, login, password]);

  return q.rows[0] || null;
}

function p40OrgLoginMatches(org, login, password) {
  if (!org) return false;

  const logins = [
    org.email,
    org.phone,
    org.owner_phone,
    org.owner_email,
    org.owner_name,
    org.name,
    org.login,
    org.admin_login,
    org.username
  ].filter(Boolean).map(v => String(v).trim().toLowerCase());

  const inputLogin = String(login || "").trim().toLowerCase();
  const inputPhone = String(login || "").replace(/[^0-9]/g, "");

  const loginOk = logins.some(v => {
    const phone = String(v).replace(/[^0-9]/g, "");
    return v === inputLogin || (phone && phone === inputPhone);
  });

  const passwords = [
    org.admin_password,
    org.password,
    org.owner_password,
    org.crm_password,
    org.login_password
  ].filter(Boolean).map(v => String(v).trim());

  const passwordOk = passwords.includes(String(password || "").trim());

  return loginOk && passwordOk;
}

async function p40EnsureAdminFromOrganization(tenant, org) {
  if (!org) return null;

  const email = p40Clean(org.email || org.owner_email || ("admin@" + p39Slug(tenant) + ".eduka.uz"));
  const phone = p40Clean(org.phone || org.owner_phone || "");
  const name = p40Clean(org.owner_name || org.name || "Admin");
  const password = p40Clean(org.admin_password || org.password || org.owner_password || org.crm_password || org.login_password);

  if (!password) return null;

  const t = p39Slug(tenant);
  const q = await p39Query(`
    INSERT INTO crm_tenant_admins(tenant, name, email, phone, password, role, status)
    VALUES($1,$2,$3,$4,$5,'admin','active')
    ON CONFLICT DO NOTHING
    RETURNING *
  `, [t, name, email, phone, password]);

  if (q.rows[0]) return q.rows[0];

  const f = await p39Query(`
    SELECT *
    FROM crm_tenant_admins
    WHERE lower(tenant)=lower($1)
      AND COALESCE(password,'')=$2
    LIMIT 1
  `, [t, password]);

  return f.rows[0] || null;
}

async function p40CreateSession(tenant, adminId) {
  const token = p40Token();
  await p39Query(`
    INSERT INTO crm_sessions(token, tenant, admin_id, expires_at)
    VALUES($1,$2,$3,NOW()+INTERVAL '30 days')
  `, [token, p39Slug(tenant), adminId || null]);
  return token;
}

function installPhase39TenantSystem(app) {
  if (app.__edukaPhase39Installed) return;
  app.__edukaPhase39Installed = true;


  /* ===== EDUKA PHASE 4.0 FORCE TENANT LOGIN ===== */
  app.post("/api/tenant/login", async (req, res) => {
    try {
      await p39EnsureSubdomains();
      await p40EnsureAuthTables();

      if (p39IsRoot(req)) {
        return res.status(400).json({ ok:false, code:"ROOT_LOGIN_DISABLED", error:"Root domain uchun markaz login kerak emas." });
      }

      const tenant = p39Subdomain(req);
      const org = await p39FindCenter(tenant);

      if (!org) {
        return res.status(404).json(p39NotFoundPayload(req));
      }

      const body = await p40ReadJsonBody(req);
      const login = p40Clean(body.email || body.phone || body.login);
      const password = p40Clean(body.password);

      if (!login || !password) {
        return res.status(400).json({ ok:false, code:"EMPTY_LOGIN", error:"Login yoki parol kiritilmagan" });
      }

      let admin = await p40FindAdminInTenantAdmins(tenant, org, login, password);

      if (!admin && p40OrgLoginMatches(org, login, password)) {
        admin = await p40EnsureAdminFromOrganization(tenant, org);
      }

      if (!admin) {
        return res.status(401).json({
          ok:false,
          code:"BAD_CREDENTIALS",
          error:"Login yoki parol xato",
          tenant,
          hint:"CEO panelda ko‘rsatilgan login/parol yoki Telegramga yuborilgan ma’lumotni kiriting."
        });
      }

      const token = await p40CreateSession(tenant, admin.id);

      return res.json({
        ok:true,
        version:"phase40",
        token,
        tenant:p39Slug(tenant),
        organization:{
          id:org.id,
          name:org.name || org.center_name || org.organization_name || tenant,
          subdomain:org.subdomain || p39Slug(tenant),
          status:org.status || null
        },
        user:{
          id:admin.id,
          name:admin.name || org.owner_name || "Admin",
          email:admin.email || org.email || "",
          phone:admin.phone || org.phone || "",
          role:admin.role || "admin"
        }
      });
    } catch(e) {
      return res.status(500).json({
        ok:false,
        code:"LOGIN_SERVER_ERROR",
        error:"Login tekshirishda server xatosi",
        realError:e.message
      });
    }
  });

  // Debug route — ENG OLDIN. Shu route chiqmasa, fayl ulanmagan bo‘ladi.
  app.get("/api/debug/tenant-center-v39", async (req, res) => {
    try {
      await p39EnsureSubdomains();
      const tenant = p39Subdomain(req);
      const found = p39IsRoot(req) ? null : await p39FindCenter(tenant);
      res.json({
        ok: !!found || p39IsRoot(req),
        version:"phase39",
        host:p39Host(req),
        tenant,
        root:p39IsRoot(req),
        found:!!found,
        sourceTable: found ? found.__source_table : null,
        slug:p39Slug(tenant),
        record: found ? {
          id: found.id,
          name: found.name,
          subdomain: found.subdomain,
          domain: found.domain,
          host: found.host,
          status: found.status,
          phone: found.phone,
          email: found.email,
          owner_name: found.owner_name
        } : null
      });
    } catch(e) {
      res.status(500).json({ ok:false, version:"phase39", error:e.message, stack:String(e.stack || "").split("\n").slice(0,3) });
    }
  });

  app.get("/api/tenant/status", async (req, res, next) => {
    try {
      await p39EnsureSubdomains();

      if (p39IsRoot(req)) {
        return res.json({ ok:true, version:"phase39", tenant:"main", isRoot:true, exists:true, authenticated:true });
      }

      const tenant = p39Subdomain(req);
      const found = await p39FindCenter(tenant);

      if (!found) return res.status(404).json(p39NotFoundPayload(req));

      return res.json({
        ok:true,
        version:"phase39",
        tenant,
        isRoot:false,
        exists:true,
        approved:true,
        loginRequired:true,
        authenticated:false,
        organization:{
          id:found.id,
          name:found.name || found.center_name || found.organization_name || tenant,
          subdomain:found.subdomain || tenant,
          status:found.status || null,
          phone:found.phone || "",
          email:found.email || "",
          ownerName:found.owner_name || found.ownerName || ""
        }
      });
    } catch(e) {
      res.status(500).json({ ok:false, version:"phase39", error:e.message });
    }
  });

  // HTML/asset gate — random subdomainlarda CRM ko‘rinmaydi.
  app.use(async (req, res, next) => {
    try {
      if (req.method !== "GET") return next();
      if (p39IsRoot(req)) return next();

      // Debug/status routelar yuqorida allaqachon ishlaydi.
      if ((req.path || "").startsWith("/api/debug/tenant-center-v39")) return next();
      if ((req.path || "").startsWith("/api/tenant/status")) return next();

      await p39EnsureSubdomains();
      const found = await p39FindCenter(p39Subdomain(req));

      if (!found) {
        if ((req.path || "").startsWith("/api/")) {
          return res.status(404).json(p39NotFoundPayload(req));
        }
        return res.status(404).send(p39NotFoundHtml(req));
      }

      return next();
    } catch(e) {
      if (!p39IsRoot(req)) {
        return res.status(404).send(p39NotFoundHtml(req));
      }
      return next();
    }
  });
}

module.exports = {
  installPhase39TenantSystem,
  p39Subdomain,
  p39FindCenter,
  p39Slug
};
