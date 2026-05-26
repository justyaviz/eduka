const fs = require("fs");
const path = require("path");

const required = [
  "public/index.html",
  "public/style.css",
  "public/script.js",
  "public/assets/logo-icon.png"
];

let missing = [];
for (const file of required) {
  if (!fs.existsSync(path.join(__dirname, file))) {
    missing.push(file);
  }
}

if (missing.length) {
  console.error("Missing required files:", missing.join(", "));
  process.exit(1);
}

console.log("Build check passed. Static EDUKA site is ready.");
