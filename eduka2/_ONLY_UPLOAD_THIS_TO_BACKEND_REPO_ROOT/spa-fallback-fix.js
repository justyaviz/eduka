
/* ===== EDUKA SPA REFRESH FALLBACK FIX ===== */
function installEdukaSpaFallback(app, express) {
  const path = require("path");
  const fs = require("fs");

  const possibleAppIndexes = [
    path.join(process.cwd(), "public", "app", "index.html"),
    path.join(process.cwd(), "backend", "public", "app", "index.html"),
    path.join(__dirname, "public", "app", "index.html"),
    path.join(__dirname, "backend", "public", "app", "index.html")
  ];

  const appIndex = possibleAppIndexes.find((p) => fs.existsSync(p));

  app.get(["/app", "/app/", "/app/*"], (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    if (!appIndex) return res.status(404).send("EDUKA app index.html not found");
    return res.sendFile(appIndex);
  });

  app.get(["/dashboard", "/teachers", "/students", "/groups", "/finance", "/settings"], (req, res, next) => {
    if (!appIndex) return next();
    return res.redirect("/app/dashboard");
  });
}

module.exports = { installEdukaSpaFallback };
