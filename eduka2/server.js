require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const apiRoutes = require("./routes/api");
const { initDatabase } = require("./utils/init-db");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
const publicDir = path.join(__dirname, "public");

let dbReady = false;
let dbError = null;

app.disable("x-powered-by");
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.get(["/api/health", "/health", "/healthz"], (req, res) => {
  res.status(dbError ? 500 : 200).json({
    ok: !dbError,
    status: dbError ? "db_error" : "healthy",
    service: "eduka",
    publicExists: fs.existsSync(publicDir),
    dbReady,
    dbError: dbError ? dbError.message : null,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", apiRoutes);

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send("User-agent: *\nAllow: /\nSitemap: https://eduka.uz/sitemap.xml\n");
});

app.get("/sitemap.xml", (req, res) => {
  const urls = ["/", "/prices", "/gamification", "/vacancies", "/ceo"].map((urlPath) => {
    return `<url><loc>https://eduka.uz${urlPath}</loc><changefreq>weekly</changefreq><priority>${urlPath === "/" ? "1.0" : "0.8"}</priority></url>`;
  }).join("");
  res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});

app.use(express.static(publicDir, {
  extensions: ["html"],
  maxAge: "1h",
  fallthrough: true,
}));

function sendPage(res, fileName) {
  const filePath = path.join(publicDir, fileName);
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  return res.status(404).send(`Missing file: ${fileName}`);
}

app.get(["/", "/uz", "/index.html"], (req, res) => sendPage(res, "index.html"));
app.get(["/gamification", "/uz/gamification"], (req, res) => sendPage(res, "gamification.html"));
app.get(["/prices", "/uz/prices"], (req, res) => sendPage(res, "prices.html"));
app.get(["/vacancies", "/uz/vacancies"], (req, res) => sendPage(res, "vacancies.html"));
app.get(["/ceo", "/ceo/", "/ceo/login", "/ceo/dashboard", "/ceo/demo-requests", "/ceo/centers", "/ceo/tariffs", "/ceo/payments", "/ceo/roles", "/ceo/settings"], (req, res) => {
  sendPage(res, "ceo.html");
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ ok: false, error: "Not found" });
  if (req.path.startsWith("/ceo")) return sendPage(res, "ceo.html");
  if (req.path.includes("gamification")) return sendPage(res, "gamification.html");
  if (req.path.includes("prices")) return sendPage(res, "prices.html");
  if (req.path.includes("vacancies")) return sendPage(res, "vacancies.html");
  return sendPage(res, "index.html");
});

async function boot() {
  try {
    const result = await initDatabase();
    dbReady = !!result.ok;
    dbError = result.ok ? null : new Error(result.error || "Database init failed");
  } catch (error) {
    dbReady = false;
    dbError = error;
    console.error("❌ Database init failed:", error);
  }

  app.listen(PORT, HOST, () => {
    console.log(`EDUKA running on ${HOST}:${PORT}`);
    if (dbReady) console.log("✅ DB self-setup done");
    else console.log("⚠️ Server started, but DB is not ready:", dbError ? dbError.message : "unknown");
  });
}

boot();
