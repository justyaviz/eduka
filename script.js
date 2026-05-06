const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const languageButtons = document.querySelectorAll(".language-switcher button");
const leadForm = document.querySelector(".lead-form");
const modal = document.querySelector("[data-modal]");
const modalForm = document.querySelector(".modal-form");
const toast = document.querySelector(".toast");

let toastTimer;

function showToast(message) {
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
}

function openModal() {
  if (!modal) return;
  header?.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  window.setTimeout(() => {
    modal.querySelector("input")?.focus();
  }, 80);
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
}

window.addEventListener("load", () => {
  window.setTimeout(() => {
    document.body.classList.add("loaded");
  }, 650);
});

window.addEventListener("scroll", () => {
  header?.classList.toggle("scrolled", window.scrollY > 16);
});

menuToggle?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

document.querySelectorAll(".nav-links a, .header-actions a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll("[data-open-demo]").forEach((button) => {
  button.addEventListener("click", openModal);
});

document.querySelector("[data-open-login]")?.addEventListener("click", () => {
  showToast("CRM kabinet tayyorlanmoqda. Hozircha demo orqali tanishishingiz mumkin.");
});

document.querySelector("[data-close-modal]")?.addEventListener("click", closeModal);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    languageButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    showToast(`${button.textContent} tili tanlandi. To'liq tarjima keyingi bosqichda ulanadi.`);
  });
});

leadForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = leadForm.querySelector("input");
  const note = leadForm.querySelector(".form-note");

  if (!input.value.trim()) {
    input.focus();
    return;
  }

  note.textContent = "Rahmat! Demo uchun so'rovingiz qabul qilindi.";
  showToast("So'rov qabul qilindi. Tez orada bog'lanamiz.");
  leadForm.reset();
});

modalForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  showToast("Demo so'rovi qabul qilindi. Eduka jamoasi siz bilan bog'lanadi.");
  modalForm.reset();
  closeModal();
});

const revealTargets = document.querySelectorAll(
  ".about-section, .section-block, .split-section, .final-cta, .feature-grid article, .workflow-grid article, .price-card, .support-grid article"
);

revealTargets.forEach((target) => target.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("visible"));
}
