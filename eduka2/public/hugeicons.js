
/*
  EDUKA icon system.
  Clean stroke-rounded SVG set inspired by Hugeicons style:
  24px grid, rounded caps/joins, 1.8 stroke, currentColor.
*/
(function () {
  const common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const icons = {
    phone: `<svg ${common}><path d="M6.4 3.8 8.7 3c.8-.3 1.6.1 1.9.9l.9 2.3c.2.6.1 1.2-.3 1.7l-1 1.1a12 12 0 0 0 4.8 4.8l1.1-1c.5-.4 1.1-.5 1.7-.3l2.3.9c.8.3 1.2 1.1.9 1.9l-.8 2.3c-.3.8-1 1.3-1.8 1.3C10.1 18.9 5.1 13.9 5.1 5.6c0-.8.5-1.5 1.3-1.8Z"/></svg>`,
    globe: `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.4 3.2 5.4 3.2 9S14.2 18.6 12 21c-2.2-2.4-3.2-5.4-3.2-9S9.8 5.4 12 3Z"/></svg>`,
    chevron: `<svg ${common}><path d="m7 10 5 5 5-5"/></svg>`,
    shield: `<svg ${common}><path d="M12 3.2 5 6v5.5c0 4.3 2.8 7.8 7 9.3 4.2-1.5 7-5 7-9.3V6l-7-2.8Z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/></svg>`,
    zap: `<svg ${common}><path d="m13 2.8-7.2 10h5.6L10.8 21l7.4-10.8h-5.6L13 2.8Z"/></svg>`,
    analytics: `<svg ${common}><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-8"/></svg>`,
    calendar: `<svg ${common}><path d="M7 3v3M17 3v3"/><rect x="4" y="5" width="16" height="16" rx="3"/><path d="M4 10h16"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/></svg>`,
    sun: `<svg ${common}><circle cx="12" cy="12" r="4"/><path d="M12 2.8v2.1M12 19.1v2.1M4.1 4.1l1.5 1.5M18.4 18.4l1.5 1.5M2.8 12h2.1M19.1 12h2.1M4.1 19.9l1.5-1.5M18.4 5.6l1.5-1.5"/></svg>`,
    grid: `<svg ${common}><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/></svg>`,
    users: `<svg ${common}><path d="M16.5 11.2a3 3 0 1 0-2.3-5.3"/><path d="M7.5 11.2a3 3 0 1 1 2.3-5.3"/><path d="M12 13.3c-3.8 0-6.2 1.7-6.2 4.1V19h12.4v-1.6c0-2.4-2.4-4.1-6.2-4.1Z"/><path d="M18 13.8c1.9.6 3 1.8 3 3.4V19h-2.8"/><path d="M6 13.8c-1.9.6-3 1.8-3 3.4V19h2.8"/></svg>`,
    card: `<svg ${common}><rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M3.5 10h17"/><path d="M7 15h4"/></svg>`,
    user: `<svg ${common}><circle cx="12" cy="8" r="3.4"/><path d="M5 20c.7-4.1 3.2-6.1 7-6.1s6.3 2 7 6.1"/></svg>`,
    facebook: `<svg ${common}><path d="M15 8.2h-1.7c-.9 0-1.3.5-1.3 1.4V12h3l-.5 3h-2.5v6"/><path d="M8.5 12h7"/></svg>`,
    instagram: `<svg ${common}><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.2"/><path d="M16.8 7.3h.01"/></svg>`,
    telegram: `<svg ${common}><path d="M20.5 4.5 3.8 11c-.9.4-.9 1.6.1 1.9l4.1 1.2 1.5 4.7c.3.9 1.5 1.1 2 .3l2.2-2.6 4.2 3c.8.6 1.9.1 2-1l2.3-12.2c.2-1.1-.7-2-1.7-1.8Z"/><path d="m8 14.1 7.8-5"/></svg>`,
    youtube: `<svg ${common}><path d="M21 9.5v5c0 1.7-1.3 3-3 3H6c-1.7 0-3-1.3-3-3v-5c0-1.7 1.3-3 3-3h12c1.7 0 3 1.3 3 3Z"/><path d="m10.5 9.7 4.3 2.3-4.3 2.3V9.7Z"/></svg>`,
    info: `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="M12 10.5v5M12 7.5h.01"/></svg>`,
    check: `<svg ${common}><circle cx="12" cy="12" r="9"/><path d="m8.2 12.2 2.4 2.4 5.2-5.4"/></svg>`,
    alert: `<svg ${common}><path d="M12 3.5 21 19H3l9-15.5Z"/><path d="M12 9v4M12 16.5h.01"/></svg>`
  };

  function applyIcons(root = document) {
    root.querySelectorAll("[data-hicon]").forEach((el) => {
      const name = el.getAttribute("data-hicon");
      if (icons[name]) {
        el.innerHTML = icons[name];
        el.classList.add("hicon-ready");
      }
    });

    // Replace selected legacy inline SVGs in header and outline button with Hugeicons-like strokes
    const phoneLinks = root.querySelectorAll(".phone svg, .outline-btn svg");
    phoneLinks.forEach((svg) => { svg.outerHTML = icons.phone; });
    const langSvg = root.querySelector(".lang svg:not(.chev)");
    if (langSvg) langSvg.outerHTML = icons.globe;
    const chev = root.querySelector(".lang .chev");
    if (chev) chev.outerHTML = icons.chevron;
  }

  window.EdukaHugeIcons = { icons, applyIcons };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => applyIcons());
  } else {
    applyIcons();
  }
})();
