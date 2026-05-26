
(function () {
  const root = document.getElementById("support-chat-root");
  if (!root) return;

  const startView = root.querySelector("[data-support-start]");
  const chatView = root.querySelector("[data-support-chat]");
  const messagesEl = root.querySelector("[data-support-messages]");
  const leadForm = root.querySelector("[data-support-form]");
  const messageForm = root.querySelector("[data-message-form]");
  const selectedQuestionInput = root.querySelector("[data-selected-question]");

  let selectedQuestion = "";
  let leadData = null;

  const botReplies = {
    "narx": "Narxlar sahifasida Start, Basic, Pro va Premium tariflar bor. Sizga o‘quvchilar soniga qarab eng mos tarifni tanlashda yordam beramiz.",
    "demo": "Demo olish mumkin. Ismingiz va telefon raqamingiz qoldirilgandan keyin menejer siz bilan bog‘lanadi va demo vaqtini kelishadi.",
    "telegram": "Ha, Telegram bot integratsiyasi qo‘shish mumkin: xabarlar, to‘lov eslatmalari, o‘quvchi kabineti va bildirishnomalar uchun.",
    "crm": "EDUKA CRM o‘quvchilar, guruhlar, to‘lovlar, dars jadvali, davomat, hisobotlar va gamification jarayonlarini boshqarishga yordam beradi."
  };

  function nowTime() {
    return new Intl.DateTimeFormat("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date());
  }

  function openChat() {
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("support-chat-open");
  }

  function closeChat() {
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("support-chat-open");
  }

  function addMessage(text, type = "bot") {
    const item = document.createElement("div");
    item.className = `support-message ${type}`;
    item.innerHTML = `<div class="bubble">${text}<span class="support-time">${nowTime()}</span></div>`;
    messagesEl.appendChild(item);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping(callback) {
    const item = document.createElement("div");
    item.className = "support-message bot typing";
    item.innerHTML = `<div class="bubble"><i></i><i></i><i></i></div>`;
    messagesEl.appendChild(item);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    setTimeout(() => {
      item.remove();
      callback();
    }, 850);
  }

  function getBotReply(message) {
    const text = message.toLowerCase();
    if (text.includes("narx") || text.includes("tarif") || text.includes("to‘lov") || text.includes("tolov")) return botReplies.narx;
    if (text.includes("demo") || text.includes("sinab")) return botReplies.demo;
    if (text.includes("telegram") || text.includes("bot")) return botReplies.telegram;
    if (text.includes("crm") || text.includes("imkoniyat")) return botReplies.crm;
    return "Savolingiz qabul qilindi. Menejerimiz tez orada siz bilan bog‘lanadi. Qo‘shimcha savolingiz bo‘lsa, shu yerga yozishingiz mumkin.";
  }

  function startChat() {
    startView.hidden = true;
    chatView.hidden = false;
    messagesEl.innerHTML = "";

    addMessage(`Salom, ${leadData.name}! EDUKA yordam markaziga xush kelibsiz. Siz bilan bog‘lanish raqamingiz: ${leadData.phone}.`, "bot");

    if (selectedQuestion) {
      setTimeout(() => {
        addMessage(selectedQuestion, "user");
        showTyping(() => addMessage(getBotReply(selectedQuestion), "bot"));
      }, 450);
    } else {
      setTimeout(() => addMessage("Quyidagi tayyor savollardan birini tanlashingiz yoki o‘zingiz yozishingiz mumkin.", "bot"), 450);
    }
  }

  document.querySelectorAll("[data-support-open]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openChat();
    });
  });

  root.querySelectorAll("[data-support-close]").forEach((btn) => {
    btn.addEventListener("click", closeChat);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && root.classList.contains("is-open")) closeChat();
  });

  root.querySelectorAll("[data-question]").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll("[data-question]").forEach((item) => item.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      selectedQuestion = btn.dataset.question || "";
      if (selectedQuestionInput) selectedQuestionInput.value = selectedQuestion;
    });
  });

  leadForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(leadForm);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();

    if (!name || !phone) return;

    leadData = { name, phone, selectedQuestion, createdAt: new Date().toISOString() };

    try {
      const leads = JSON.parse(localStorage.getItem("eduka_support_leads") || "[]");
      leads.push(leadData);
      localStorage.setItem("eduka_support_leads", JSON.stringify(leads));
    } catch (error) {
      console.warn("Lead localStorage error:", error);
    }

    startChat();
  });

  root.querySelectorAll("[data-send-question]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const message = btn.dataset.sendQuestion || btn.textContent.trim();
      addMessage(message, "user");
      showTyping(() => addMessage(getBotReply(message), "bot"));
    });
  });

  messageForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = messageForm.querySelector("input[name='message']");
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, "user");
    input.value = "";

    showTyping(() => addMessage(getBotReply(message), "bot"));
  });
})();
