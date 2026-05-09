const https = require("https");

function telegramRequest(token, methodName, payload = {}) {
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${token}/${methodName}`,
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
          if (res.statusCode >= 200 && res.statusCode < 300 && parsed.ok) {
            resolve(parsed);
            return;
          }
          reject(new Error(parsed.description || `Telegram returned ${res.statusCode}`));
        });
      }
    );
    req.setTimeout(15000, () => req.destroy(new Error("Telegram request timed out")));
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function webhookBaseDomain() {
  const configuredWebAppUrl = String(process.env.STUDENT_WEBAPP_URL || "").trim();
  if (configuredWebAppUrl) {
    try {
      return new URL(configuredWebAppUrl).hostname;
    } catch {
      // Fall back to BASE_DOMAIN below.
    }
  }
  return String(process.env.BASE_DOMAIN || "eduka.uz").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

async function main() {
  const token = String(process.env.STUDENT_BOT_TOKEN || process.env.BOT_TOKEN || "").trim();
  const secret = String(process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
  const webhookUrl = `https://${webhookBaseDomain()}/api/telegram/webhook`;

  console.log(`Student bot: ${token ? "configured" : "not configured"}`);
  console.log(`Webhook URL: ${webhookUrl}`);
  console.log(`Secret: ${secret ? "configured" : "not configured"}`);

  if (!token) throw new Error("STUDENT_BOT_TOKEN is required");

  const payload = { url: webhookUrl };
  if (secret) payload.secret_token = secret;

  const response = await telegramRequest(token, "setWebhook", payload);
  console.log(`Telegram response ok: ${Boolean(response.ok)}`);

  const webhookInfo = await telegramRequest(token, "getWebhookInfo");
  console.log(`Webhook info url: ${webhookInfo.result?.url || ""}`);
  console.log(`Pending updates: ${Number(webhookInfo.result?.pending_update_count || 0)}`);
}

main().catch((error) => {
  console.error(`Telegram webhook setup failed: ${error.message}`);
  process.exit(1);
});
