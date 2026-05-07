const https = require("https");

function request(token, payload) {
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${token}/setWebhook`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        }
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          let parsed = {};
          try {
            parsed = JSON.parse(responseBody);
          } catch {
            parsed = { ok: false, description: responseBody };
          }
          if (parsed.ok) resolve(parsed);
          else reject(new Error(parsed.description || `Telegram returned ${res.statusCode}`));
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  const baseDomain = String(process.env.BASE_DOMAIN || "eduka.uz").replace(/^https?:\/\//, "");
  const secret = String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();

  if (!token) throw new Error("BOT_TOKEN is required");

  const payload = { url: `https://${baseDomain}/api/telegram/webhook` };
  if (secret) payload.secret_token = secret;
  await request(token, payload);
  console.log(`Telegram webhook configured for https://${baseDomain}/api/telegram/webhook`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
