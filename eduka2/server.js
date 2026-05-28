require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
const publicDir = path.join(__dirname, "public");

let dbReady = false;
let dbError = null;
let dbStarted = false;
const { installRealCrmEngine } = require('./real-crm-engine');

function normalizeHost(host) {
  return String(host || "")
    .split(":")[0]
    .toLowerCase()
    .trim();
}

function isEdukaSubdomain(host) {
  const h = normalizeHost(host);
  if (!h.endsWith(".eduka.uz")) return false;
  if (h === "eduka.uz") return false;
  if (h === "www.eduka.uz") return false;
  return true;
}

function getTenantSubdomain(host) {
  const h = normalizeHost(host);
  if (!isEdukaSubdomain(h)) return null;
  return h.replace(".eduka.uz", "");
}

function sendPage(res, fileName) {
  const filePath = path.join(publicDir, fileName);
  if (fs.existsSync(filePath)) return res.sendFile(filePath);

  const fallback = path.join(publicDir, "index.html");
  if (fs.existsSync(fallback)) return res.sendFile(fallback);

  return res.status(200).send(`<!doctype html>
  <html lang="uz">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EDUKA</title></head>
    <body style="font-family:Arial,sans-serif;padding:40px">
      <h1>EDUKA server online</h1>
      <p>Missing public file: ${fileName}</p>
      <p>Health: /api/health</p>
    </body>
  </html>`);
}

app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get(["/api/health", "/health", "/healthz"], (req, res) => {
  res.status(200).json({
    ok: true,
    status: "healthy",
    service: "eduka",
    server: "online",
    dbReady,
    dbStarted,
    dbError: dbError ? dbError.message : null,
    host: normalizeHost(req.headers.host),
    tenantSubdomain: getTenantSubdomain(req.headers.host),
    publicExists: fs.existsSync(publicDir),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/server-status", (req, res) => {
  res.status(dbError ? 500 : 200).json({
    ok: !dbError,
    dbReady,
    dbStarted,
    dbError: dbError ? dbError.message : null,
    databaseUrlExists: !!process.env.DATABASE_URL,
    postgresUrlExists: !!process.env.POSTGRES_URL,
    postgresPrivateUrlExists: !!process.env.POSTGRES_PRIVATE_URL,
    pgHostExists: !!process.env.PGHOST,
    nodeEnv: process.env.NODE_ENV || null,
    host: normalizeHost(req.headers.host),
    tenantSubdomain: getTenantSubdomain(req.headers.host),
  });
});

try {
  const apiRoutes = require("./routes/api");
  const centerRoutes = require("./routes/center-api");
  app.use("/api", apiRoutes);
  app.use("/api/app", centerRoutes);
} catch (error) {
  dbError = error;
  console.error("❌ API routes load error:", error.message);

  app.use("/api", (req, res) => {
    res.status(500).json({
      ok: false,
      error: "API routes load error",
      realError: error.message,
    });
  });
}

/*
  CRITICAL FIX:
  express.static() index.html ni avtomatik berib yubormasligi uchun
  tenant root routing static'dan OLDIN turadi.
*/
app.get("/", (req, res) => {
  if (isEdukaSubdomain(req.headers.host)) return sendPage(res, "app.html");
  return sendPage(res, "index.html");
});

app.get(["/uz", "/index.html"], (req, res) => {
  if (isEdukaSubdomain(req.headers.host)) return sendPage(res, "app.html");
  return sendPage(res, "index.html");
});

app.get(["/gamification", "/uz/gamification"], (req, res) => {
  if (isEdukaSubdomain(req.headers.host)) return sendPage(res, "app.html");
  return sendPage(res, "gamification.html");
});

app.get(["/prices", "/uz/prices"], (req, res) => {
  if (isEdukaSubdomain(req.headers.host)) return sendPage(res, "app.html");
  return sendPage(res, "prices.html");
});

app.get(["/vacancies", "/uz/vacancies"], (req, res) => {
  if (isEdukaSubdomain(req.headers.host)) return sendPage(res, "app.html");
  return sendPage(res, "vacancies.html");
});

app.get(["/ceo", "/ceo/", "/ceo/login", "/ceo/dashboard", "/ceo/demo-requests", "/ceo/centers", "/ceo/tariffs", "/ceo/payments", "/ceo/roles", "/ceo/settings"], (req, res) => {
  sendPage(res, "ceo.html");
});

app.get(["/app", "/app/", "/app/login", "/app/dashboard", "/app/students", "/app/groups", "/app/payments", "/app/attendance", "/app/reports", "/app/settings"], (req, res) => {
  sendPage(res, "app.html");
});

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send("User-agent: *\nAllow: /\nSitemap: https://eduka.uz/sitemap.xml\n");
});

app.get("/sitemap.xml", (req, res) => {
  const urls = ["/", "/prices", "/gamification", "/vacancies", "/ceo", "/app/login"].map((urlPath) => {
    return `<url><loc>https://eduka.uz${urlPath}</loc><changefreq>weekly</changefreq><priority>${urlPath === "/" ? "1.0" : "0.8"}</priority></url>`;
  }).join("");
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});

/*
  Static assets:
  index:false bo'lmasa / so'rovida public/index.html avtomatik chiqib ketadi.
*/
app.use(express.static(publicDir, {
  extensions: ["html"],
  maxAge: "1h",
  fallthrough: true,
  index: false,
}));

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ ok: false, error: "Not found" });
  if (req.path.startsWith("/ceo")) return sendPage(res, "ceo.html");
  if (req.path.startsWith("/app")) return sendPage(res, "app.html");

  if (isEdukaSubdomain(req.headers.host)) {
    return sendPage(res, "app.html");
  }

  if (req.path.includes("gamification")) return sendPage(res, "gamification.html");
  if (req.path.includes("prices")) return sendPage(res, "prices.html");
  if (req.path.includes("vacancies")) return sendPage(res, "vacancies.html");

  return sendPage(res, "index.html");
});

installRealCrmEngine(app);
app.listen(PORT, HOST, () => {
  console.log(`✅ EDUKA running on ${HOST}:${PORT}`);
  console.log(`✅ Healthcheck ready: /api/health`);

  setTimeout(async () => {
    try {
      dbStarted = true;
      const { initDatabase } = require("./utils/init-db");
      const result = await initDatabase();
      dbReady = !!result.ok;
      dbError = result.ok ? null : new Error(result.error || "Database init failed");
      if (dbReady) console.log("✅ DB self-setup done");
      else console.log("⚠️ DB setup failed:", dbError.message);
    } catch (error) {
      dbReady = false;
      dbError = error;
      console.error("❌ Background DB setup failed:", error.message);
    }
  }, 1500);
});