const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
const publicDir = path.join(__dirname, "public");

app.disable("x-powered-by");

// Healthcheck first
app.get(["/api/health", "/health", "/healthz"], (req, res) => {
  res.status(200).json({
    ok: true,
    status: "healthy",
    service: "eduka",
    publicExists: fs.existsSync(publicDir),
    root: __dirname,
    timestamp: new Date().toISOString()
  });
});

app.use(express.static(publicDir, {
  extensions: ["html"],
  maxAge: "1h",
  fallthrough: true
}));

function sendPage(res, fileName) {
  const filePath = path.join(publicDir, fileName);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  return res.status(200).send(`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>EDUKA</title><style>body{font-family:Arial,sans-serif;padding:40px}h1{color:#123cff}</style></head>
<body><h1>EDUKA server ishlayapti</h1><p>${fileName} topilmadi. GitHub'ga public papkani to'liq yuklang.</p></body></html>`);
}

app.get(["/", "/uz", "/index.html"], (req, res) => sendPage(res, "index.html"));
app.get(["/gamification", "/uz/gamification"], (req, res) => sendPage(res, "gamification.html"));
app.get(["/prices", "/uz/prices"], (req, res) => sendPage(res, "prices.html"));

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ ok: false, error: "Not found" });
  }
  if (req.path.includes("gamification")) return sendPage(res, "gamification.html");
  if (req.path.includes("prices")) return sendPage(res, "prices.html");
  return sendPage(res, "index.html");
});

app.listen(PORT, HOST, () => {
  console.log(`EDUKA running on ${HOST}:${PORT}`);
  console.log(`Public dir: ${publicDir}`);
});
