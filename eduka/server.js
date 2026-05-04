const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT) || 3000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Payload too large"));
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    request.on("error", reject);
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return Promise.reject(new Error("Telegram is not configured"));
  }

  const payload = JSON.stringify({
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true
  });

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${token}/sendMessage`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      },
      (telegramResponse) => {
        let responseBody = "";

        telegramResponse.on("data", (chunk) => {
          responseBody += chunk;
        });

        telegramResponse.on("end", () => {
          if (telegramResponse.statusCode >= 200 && telegramResponse.statusCode < 300) {
            resolve(responseBody);
            return;
          }

          reject(new Error(`Telegram returned ${telegramResponse.statusCode}`));
        });
      }
    );

    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      response.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }

    response.writeHead(200, { "Content-Type": contentType });
    response.end(content);
  });
}

async function handleDemoRequest(request, response) {
  try {
    const body = await readJsonBody(request);
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const lang = String(body.lang || "uz").trim().toUpperCase();

    if (!name || !phone) {
      sendJson(response, 400, { ok: false, message: "Name and phone are required" });
      return;
    }

    const message = [
      "📩 <b>Eduka demo so'rovi</b>",
      "",
      `<b>Ism:</b> ${escapeHtml(name)}`,
      `<b>Telefon:</b> ${escapeHtml(phone)}`,
      `<b>Til:</b> ${escapeHtml(lang)}`,
      `<b>Manba:</b> eduka.uz landing`,
      `<b>Vaqt:</b> ${new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" })}`
    ].join("\n");

    await sendTelegramMessage(message);
    sendJson(response, 200, { ok: true });
  } catch (error) {
    const isConfigError = error.message === "Telegram is not configured";
    sendJson(response, isConfigError ? 503 : 500, {
      ok: false,
      message: isConfigError ? "Telegram is not configured" : "Could not send request"
    });
  }
}

const server = http.createServer((request, response) => {
  const urlPath = decodeURIComponent(request.url.split("?")[0]);

  if (request.method === "POST" && urlPath === "/api/demo") {
    handleDemoRequest(request, response);
    return;
  }

  const routePath = urlPath === "/" ? "index.html" : urlPath.replace(/^[/\\]+/, "");
  const safePath = path.normalize(routePath).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = path.join(root, safePath);

  if (!requestedPath.startsWith(root)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  sendFile(response, requestedPath);
});

server.listen(port, () => {
  console.log(`Eduka landing is running on port ${port}`);
});
