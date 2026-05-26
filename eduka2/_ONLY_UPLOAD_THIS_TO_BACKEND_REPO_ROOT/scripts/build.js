const fs = require("fs");
const path = require("path");

const here = __dirname;
const publicDir = path.join(here, "public");
const parentPublicDir = path.join(here, "..", "public");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });

  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  return true;
}

// Self-healing: Railway backend Root Directory bo'lsa va backend/public yo'q bo'lsa,
// repo rootdagi ../public papkadan avtomatik ko'chiradi.
if (!fs.existsSync(publicDir) && fs.existsSync(parentPublicDir)) {
  console.log("public/ topilmadi. ../public dan ko'chirilmoqda...");
  copyDir(parentPublicDir, publicDir);
}

// Fallback: public baribir bo'lmasa minimal ishlaydigan sahifa yaratadi
if (!fs.existsSync(publicDir)) {
  console.log("public/ topilmadi. Minimal fallback yaratilmoqda...");
  fs.mkdirSync(path.join(publicDir, "assets"), { recursive: true });
  fs.writeFileSync(path.join(publicDir, "index.html"), `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>EDUKA</title><style>body{font-family:Arial,sans-serif;padding:40px}h1{color:#123cff}</style></head>
<body><h1>EDUKA server ishlayapti</h1><p>public papka GitHub'ga to'liq yuklanmagan.</p></body></html>`);
  fs.writeFileSync(path.join(publicDir, "style.css"), "");
  fs.writeFileSync(path.join(publicDir, "script.js"), "");
  fs.writeFileSync(path.join(publicDir, "assets", "logo-icon.png"), "");
}

const required = [
  "public/index.html",
  "public/style.css",
  "public/script.js"
];

const missing = required.filter((file) => !fs.existsSync(path.join(here, file)));

if (missing.length) {
  console.warn("Ogohlantirish: ayrim fayllar topilmadi:", missing.join(", "));
} else {
  console.log("Build check passed. EDUKA static files are ready.");
}

process.exit(0);
