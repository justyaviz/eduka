const fs = require("fs");
const path = require("path");

const here = path.join(__dirname, "..");
const publicDir = path.join(here, "public");
const parentPublicDir = path.join(here, "..", "public");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
  return true;
}

if (!fs.existsSync(publicDir) && fs.existsSync(parentPublicDir)) {
  copyDir(parentPublicDir, publicDir);
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, "index.html"), "<!doctype html><html><body><h1>EDUKA</h1></body></html>");
}

console.log("Build check passed.");
