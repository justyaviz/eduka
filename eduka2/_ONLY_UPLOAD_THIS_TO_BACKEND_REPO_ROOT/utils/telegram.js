async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || process.env.LANDING_CHAT_ID;
  if (!token || !chatId) return { skipped:true };
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode:"HTML", disable_web_page_preview:true })
    });
    return await response.json();
  } catch (error) {
    console.error("Telegram error:", error);
    return { ok:false, error:error.message };
  }
}
module.exports = { sendTelegramMessage };
