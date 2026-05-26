const fs = require("fs");
const path = require("path");

const required = [
  "public/index.html",
  "public/style.css",
  "public/script.js",
  "public/assets/logo-icon.png"
];

const missing = required.filter((file) => !fs.existsSync(path.join(__dirname, file)));

if (missing.length) {
  console.error("Missing required files:", missing.join(", "));
  process.exit(1);
}

console.log("Build check passed. EDUKA static files are ready.");
