/* EDUKA support assistant — real request persistence (v0.2) */
(function () {
  const root = document.getElementById("support-chat-root");
  if (!root) return;

  const startView = root.querySelector("[data-support-start]");
  const chatView = root.querySelector("[data-support-chat]");
  const messagesEl = root.querySelector("[data-support-messages]");
  const leadForm = root.querySelector("[data-support-form]");
  const messageForm = root.querySelector("[data-message-form]");
  const selectedQuestionInput = root.querySelector("[data-selected-question]");
  const headMeta = root.querySelector(".support-chat-head p");

  let selectedQuestion = "";
  let leadData = null;
  let sending = false;
  let lastFocused = null;

  const botReplies = {
    narx: "Narxlar sahifasida amaldagi tariflar bor. So‘rovingiz menejerga ham yuborildi — sizga markazingiz hajmiga mos variant bo‘yicha bog‘lanishadi.",
    demo: "Demo olish mumkin. So‘rovingiz menejerga yuborildi va siz bilan ko‘rsatilgan telefon raqami orqali bog‘lanishadi.",
    telegram: "Telegram integratsiyasi bo‘yicha menejer sizga amaldagi imkoniyatlarni tushuntiradi. So‘rovingiz saqlandi.",
    crm: "EDUKA o‘quv markazidagi asosiy boshqaruv jarayonlarini bitta joyga yig‘ishga yordam beradi. Sizning savolingiz menejerga yuborildi."
  };

  if (headMeta) {
    headMeta.innerHTML = '<span class="online-dot"></span> Avtomatik yordamchi • So‘rovlar menejerga yuboriladi';
  }

  function nowTime() {
    return new Intl.DateTimeFormat("uz-UZ", { hour: "2-digit", minute: "2-digit" }).format(new Date());
  }

  function openChat() {
    lastFocused = document.activeElement;
    root.classList.add("is-open");
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("support-chat-open");
    setTimeout(() => root.querySelector('input[name="name"]')?.focus(), 100);
  }

  function closeChat() {
    if (sending) return;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("support-chat-open");
    setTimeout(() => lastFocused?.focus?.(), 60);
  }

  function addMessage(text, type = "bot") {
    if (!messagesEl) return;
    const item = document.createElement("div");
    item.className = `support-message ${type}`;
    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    const time = document.createElement("span");
    time.className = "support-time";
    time.textContent = nowTime();
    bubble.appendChild(time);
    item.appendChild(bubble);
    messagesEl.appendChild(item);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping(callback) {
    if (!messagesEl) return callback();
    const item = document.createElement("div");
    item.className = "support-message bot typing";
    item.innerHTML = '<div class="bubble"><i></i><i></i><i></i></div>';
    messagesEl.appendChild(item);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    setTimeout(() => {
      item.remove();
      callback();
    }, 600);
  }

  function getBotReply(message) {
    const text = String(message || "").toLowerCase();
    if (text.includes("narx") || text.includes("tarif") || text.includes("to‘lov") || text.includes("tolov")) return botReplies.narx;
    if (text.includes("demo") || text.includes("sinab")) return botReplies.demo;
    if (text.includes("telegram") || text.includes("bot")) return botReplies.telegram;
    if (text.includes("crm") || text.includes("imkoniyat")) return botReplies.crm;
    return "So‘rovingiz menejerga yuborildi. Javob uchun siz ko‘rsatgan telefon raqamidan foydalaniladi.";
  }

  async function persistSupport(payload) {
    const response = await fetch("/api/support-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    let result = null;
    try { result = await response.json(); } catch (_) {}
    if (!response.ok || !result?.ok) {
      throw new Error(result?.error || "Support so‘rovi yuborilmadi");
    }
    return result.support;
  }

  function setFormError(form, message) {
    if (!form) return;
    let box = form.querySelector("[data-support-error]");
    if (!box) {
      box = document.createElement("div");
      box.setAttribute("data-support-error", "");
      box.setAttribute("role", "alert");
      box.style.cssText = "margin:10px 0;padding:10px 12px;border-radius:10px;background:#fff1f0;color:#b42318;font:700 12px/1.4 Manrope,sans-serif;";
      form.prepend(box);
    }
    box.textContent = message || "So‘rov yuborilmadi. Qayta urinib ko‘ring.";
  }

  function clearFormError(form) {
    form?.querySelector("[data-support-error]")?.remove();
  }

  function startChat() {
    startView.hidden = true;
    chatView.hidden = false;
    messagesEl.innerHTML = "";
    addMessage(`Salom, ${leadData.name}! EDUKA yordamchisiga xush kelibsiz. So‘rovingiz tizimga qabul qilindi.`, "bot");

    if (selectedQuestion) {
      setTimeout(() => {
        addMessage(selectedQuestion, "user");
        showTyping(() => addMessage(getBotReply(selectedQuestion), "bot"));
      }, 250);
    } else {
      setTimeout(() => addMessage("Savolingizni yozishingiz mumkin — u menejerga yuboriladi.", "bot"), 250);
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

  leadForm?.addEventListener("input", () => clearFormError(leadForm));
  leadForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) return;

    const formData = new FormData(leadForm);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    if (!name || !phone) {
      leadForm.reportValidity();
      return;
    }

    const submit = leadForm.querySelector('button[type="submit"]');
    const oldText = submit?.textContent || "Chatni boshlash";
    sending = true;
    clearFormError(leadForm);
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Yuborilmoqda…";
    }

    try {
      const support = await persistSupport({ name, phone, question: selectedQuestion || null });
      leadData = { name, phone, supportId: support?.id || null };
      startChat();
    } catch (error) {
      setFormError(leadForm, error.message);
    } finally {
      sending = false;
      if (submit) {
        submit.disabled = false;
        submit.textContent = oldText;
      }
    }
  });

  async function sendMessage(message) {
    if (!leadData || !message || sending) return;
    sending = true;
    addMessage(message, "user");
    try {
      await persistSupport({
        name: leadData.name,
        phone: leadData.phone,
        question: selectedQuestion || null,
        message
      });
      showTyping(() => addMessage(getBotReply(message), "bot"));
    } catch (error) {
      addMessage("Xabar yuborilmadi. Iltimos, qayta urinib ko‘ring.", "bot");
    } finally {
      sending = false;
    }
  }

  root.querySelectorAll("[data-send-question]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const message = btn.dataset.sendQuestion || btn.textContent.trim();
      sendMessage(message);
    });
  });

  messageForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = messageForm.querySelector("input[name='message']");
    const message = String(input?.value || "").trim();
    if (!message) return;
    input.value = "";
    sendMessage(message);
  });
})();
