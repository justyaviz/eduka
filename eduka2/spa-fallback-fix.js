
/* ===== EDUKA PHASE 3.5 SPA FALLBACK HARD GATE ===== */
let phase35Gate = null;
try { phase35Gate = require("./hard-page-gate"); } catch(e) { phase35Gate = null; }

async function phase35BlockUnknownBeforeSend(req, res) {
  if (!phase35Gate) return false;
  try {
    const t = phase35Gate.phase35Subdomain(req);
    if (!t || t === "main" || t === "www") return false;
    const ok = await phase35Gate.phase35TenantExists(req);
    if (!ok) {
      res.status(404).send(phase35Gate.phase35NotFoundHtml(req));
      return true;
    }
    return false;
  } catch(e) {
    const t = phase35Gate.phase35Subdomain(req);
    if (t && t !== "main" && t !== "www") {
      res.status(404).send(phase35Gate.phase35NotFoundHtml(req));
      return true;
    }
    return false;
  }
}


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

  app.get(["/app", "/app/", "/app/*"], async (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    if (await phase35BlockUnknownBeforeSend(req, res)) return;
    if (!appIndex) return res.status(404).send("EDUKA app index.html not found");
    return res.sendFile(appIndex);
  });

  app.get(["/dashboard", "/teachers", "/students", "/groups", "/finance", "/settings"], (req, res, next) => {
    if (!appIndex) return next();
    return res.redirect("/app/dashboard");
  });
}

module.exports = { installEdukaSpaFallback };
