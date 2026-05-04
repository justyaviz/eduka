const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const languageButtons = document.querySelectorAll(".language-switcher button");
const leadForm = document.querySelector(".lead-form");

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

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    languageButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
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
  leadForm.reset();
});
