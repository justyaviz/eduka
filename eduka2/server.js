const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

const publicDir = path.join(__dirname, "public");

app.disable("x-powered-by");

// Railway healthcheck — always first and always fast
app.get(["/api/health", "/health", "/healthz"], (req, res) => {
  res.status(200).type("application/json").send(JSON.stringify({
    ok: true,
    status: "healthy",
    service: "eduka-frontend",
    port: PORT,
    timestamp: new Date().toISOString()
  }));
});

// Static assets
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
  return res.status(404).send(`Missing file: ${fileName}`);
}

// Pages
app.get(["/", "/uz", "/index.html"], (req, res) => sendPage(res, "index.html"));
app.get(["/gamification", "/uz/gamification"], (req, res) => sendPage(res, "gamification.html"));
app.get(["/prices", "/uz/prices"], (req, res) => sendPage(res, "prices.html"));

// Fallback for direct refresh
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ ok: false, error: "Not found" });
  }

  if (req.path.includes("gamification")) {
    return sendPage(res, "gamification.html");
  }

  if (req.path.includes("prices")) {
    return sendPage(res, "prices.html");
  }

  return sendPage(res, "index.html");
});

const server = app.listen(PORT, HOST, () => {
  console.log(`EDUKA frontend is running on http://${HOST}:${PORT}`);
  console.log(`Healthcheck: /api/health`);
});

server.on("error", (error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
