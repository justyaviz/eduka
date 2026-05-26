const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");

app.disable("x-powered-by");

app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    status: "healthy",
    service: "eduka",
    timestamp: new Date().toISOString()
  });
});

// Static files
app.use(express.static(publicDir, {
  extensions: ["html"],
  maxAge: "1h"
}));

// Pages
app.get(["/", "/uz"], (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get(["/gamification", "/uz/gamification"], (req, res) => {
  res.sendFile(path.join(publicDir, "gamification.html"));
});

// Fallback for Railway/direct refresh
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ ok: false, error: "Not found" });
  }

  if (req.path.includes("gamification")) {
    return res.sendFile(path.join(publicDir, "gamification.html"));
  }

  return res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`EDUKA running on port ${PORT}`);
});
