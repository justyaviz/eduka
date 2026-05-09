const fs = require("fs");
const path = require("path");

const frontend = path.join(__dirname, "frontend");
const appHtml = path.join(frontend, "app.html");

if (!fs.existsSync(appHtml)) {
  console.error("app.html topilmadi:", appHtml);
  process.exit(1);
}

let html = fs.readFileSync(appHtml, "utf8");

function ensureBeforeHeadClose(line) {
  if (html.includes(line)) return;
  html = html.replace("</head>", `  ${line}\n</head>`);
}

function ensureBeforeBodyClose(line) {
  if (html.includes(line)) return;
  html = html.replace("</body>", `  ${line}\n</body>`);
}

html = html.replace(/\/app\.js\?v=[0-9.]+/g, "/app.js?v=21.4.5");

ensureBeforeHeadClose('<link rel="stylesheet" href="/premium-ui-actions.css?v=21.4.5" />');
ensureBeforeBodyClose('<script src="/premium-ui-actions.js?v=21.4.5"></script>');

fs.writeFileSync(appHtml, html);
console.log("Eduka 21.4.5 UI patch app.html ichiga qo'shildi.");
