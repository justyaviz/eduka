
(function () {
  function buildCrmImageModal() {
    if (document.querySelector(".crm-image-modal")) return;

    const modal = document.createElement("div");
    modal.className = "crm-image-modal";
    modal.innerHTML = `
      <div class="crm-image-modal__box">
        <button class="crm-image-modal__close" type="button" aria-label="Yopish">×</button>
        <img src="" alt="EDUKA CRM preview" />
      </div>
    `;
    document.body.appendChild(modal);

    const img = modal.querySelector("img");
    const close = modal.querySelector(".crm-image-modal__close");

    function closeModal() {
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(() => { img.src = ""; }, 180);
    }

    close.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });

    document.querySelectorAll("[data-crm-preview]").forEach((card) => {
      card.addEventListener("click", () => {
        const src = card.getAttribute("data-crm-preview");
        if (!src) return;
        img.src = src;
        modal.classList.add("is-open");
        document.body.style.overflow = "hidden";
      });
    });
  }

  function ensureDemoModalFallback() {
    let existing = document.querySelector(".demo-modal-overlay:not(.eduka-demo-fallback), .demo-modal-root, #demo-modal");
    if (existing) return existing;

    let modal = document.querySelector(".eduka-demo-fallback");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "eduka-demo-fallback";
    modal.innerHTML = `
      <div class="demo-modal-box">
        <button class="demo-close-btn" type="button" aria-label="Yopish">×</button>
        <h2>Demo olish</h2>
        <form class="demo-form">
          <label>Ismingiz</label>
          <input required type="text" placeholder="Ismingizni kiriting" />

          <label>Markaz nomi</label>
          <input required type="text" placeholder="Markaz nomini kiriting" />

          <label>Telefon raqami</label>
          <div class="phone-row">
            <input type="text" value="+998" readonly class="phone-code" />
            <input required type="text" placeholder="99 123 45 67" />
          </div>

          <label>To‘lov rejimi</label>
          <select required>
            <option value="">To‘lov rejimini tanlang</option>
            <option>Oylik (Kalendar)</option>
            <option>Kunlik</option>
            <option>Modul</option>
            <option>Guruh boshlanish sanasi</option>
            <option>Kurs uchun to‘lov</option>
            <option>Individual</option>
          </select>

          <label>Parol</label>
          <input type="password" placeholder="Kamida 8 ta belgi" />

          <label class="checkbox-row">
            <input type="checkbox" required />
            <span>Men Maxfiylik siyosatini o‘qib chiqdim va shaxsiy ma’lumotlarni qayta ishlashga roziman</span>
          </label>

          <button type="submit" class="demo-submit-btn">Demo olish</button>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      modal.classList.remove("is-open");
      modal.style.display = "none";
      document.body.style.overflow = "";
    };

    modal.querySelector(".demo-close-btn").addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });

    modal.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      const btn = modal.querySelector(".demo-submit-btn");
      btn.disabled = true;
      btn.textContent = "Menejerga yuborildi ✓";
      setTimeout(() => {
        closeModal();
        btn.disabled = false;
        btn.textContent = "Demo olish";
        modal.querySelector("form").reset();
      }, 1200);
    });

    return modal;
  }

  function openDemoModal() {
    const modal = ensureDemoModalFallback();

    if (modal.classList.contains("eduka-demo-fallback")) {
      modal.style.display = "flex";
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
      return;
    }

    modal.classList.add("is-open", "active", "open");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function bindDemoButtons() {
    const selectors = [
      "[data-demo-open]",
      "a[href='#demo']",
      "button[data-demo-open]",
      ".topbar-demo-btn",
      ".hero-primary-btn"
    ];

    document.querySelectorAll(selectors.join(",")).forEach((el) => {
      el.setAttribute("data-demo-open", "");
      el.addEventListener("click", (event) => {
        event.preventDefault();
        openDemoModal();
      });
    });

    document.querySelectorAll("a,button").forEach((el) => {
      const text = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (
        text.includes("hozir sinab") ||
        text.includes("7 kun bepul") ||
        text.includes("try now") ||
        text.includes("попроб")
      ) {
        el.setAttribute("data-demo-open", "");
        if (el.tagName === "A") el.setAttribute("href", "#demo");
        el.addEventListener("click", (event) => {
          event.preventDefault();
          openDemoModal();
        });
      }
    });
  }

  function init() {
    buildCrmImageModal();
    bindDemoButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("load", init);
  window.addEventListener("eduka:open-demo", openDemoModal);
})();
