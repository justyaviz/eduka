
(function(){
  const extra = {
    trophy:`<svg viewBox="0 0 24 24"><path d="M7 4h10v3h3v2a5 5 0 0 1-5 5h-.4A5.7 5.7 0 0 1 13 15.6V19h4v2H7v-2h4v-3.4A5.7 5.7 0 0 1 9.4 14H9a5 5 0 0 1-5-5V7h3V4Z"/><path d="M17 7v4h.5A2.5 2.5 0 0 0 20 8.5V7h-3ZM7 7v4h-.5A2.5 2.5 0 0 1 4 8.5V7h3Z"/></svg>`,
    star:`<svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>`,
    sparkles:`<svg viewBox="0 0 24 24"><path d="M12 3 10.5 8.5 5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3Z"/><path d="M19 15l-.8 2.2L16 18l2.2.8L19 21l.8-2.2L22 18l-2.2-.8L19 15Z"/></svg>`,
    "arrow-right":`<svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>`,
    location:`<svg viewBox="0 0 24 24"><path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
    clock:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
    briefcase:`<svg viewBox="0 0 24 24"><path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7"/><path d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"/><path d="M4 13h16"/><path d="M10 13v2h4v-2"/></svg>`,
    language:`<svg viewBox="0 0 24 24"><path d="M4 5h9"/><path d="M9 3v2"/><path d="M6 9c1 3 3 5 6 6"/><path d="M12 5c-.7 4-3 7-7 9"/><path d="M14 20l4-9 4 9"/><path d="M15.5 17h5"/></svg>`,
    telegram:`<svg viewBox="0 0 24 24"><path d="M21 4 3.8 11.2c-.9.4-.8 1.7.2 1.9l4.5 1.1 1.7 5.1c.3.9 1.4 1.1 2 .4l2.5-3 4.4 3.2c.8.6 2 .1 2.1-.9L23 5.2c.1-.8-.8-1.4-2-.9Z"/><path d="m8.5 14.2 9.6-6.4-7.9 8.8"/></svg>`,
    phone:`<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/></svg>`,
    globe:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21c-2.3-2.5-3.5-5.5-3.5-9S9.7 5.5 12 3Z"/></svg>`,
    chevron:`<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>`,
    facebook:`<svg viewBox="0 0 24 24"><path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v5h4v-5h3l1-4h-4V9c0-.6.4-1 1-1Z"/></svg>`,
    instagram:`<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><path d="M17.5 6.5h.01"/></svg>`,
    youtube:`<svg viewBox="0 0 24 24"><path d="M22 12s0-3.4-.4-5a2.8 2.8 0 0 0-2-2C17.8 4.5 12 4.5 12 4.5s-5.8 0-7.6.5a2.8 2.8 0 0 0-2 2C2 8.6 2 12 2 12s0 3.4.4 5a2.8 2.8 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.8 2.8 0 0 0 2-2c.4-1.6.4-5 .4-5Z"/><path d="m10 9 5 3-5 3V9Z"/></svg>`
  };
  document.querySelectorAll("[data-hicon]").forEach((el)=>{const n=el.getAttribute("data-hicon"); if(extra[n]){el.innerHTML=extra[n]; el.classList.add("hicon-ready");}});
  if(window.EdukaHugeIcons&&window.EdukaHugeIcons.applyIcons){window.EdukaHugeIcons.applyIcons();}
  document.querySelectorAll('.brand-links a[href^="/"], .brand-demo, .footer-demo').forEach((link)=>{
    link.addEventListener("click",(e)=>{
      const href=link.getAttribute("href");
      if(!href || href.includes("#") || link.target) return;
      e.preventDefault();
      document.querySelector("main")?.classList.add("page-leave");
      setTimeout(()=>{window.location.href=href;},180);
    });
  });
})();

(function(){const icons={help:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 0 1 4.5 1.2c0 1.8-2.3 2.1-2.3 4"/><path d="M12 17.5h.01"/></svg>`,check:`<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>`};document.querySelectorAll("[data-hicon]").forEach(el=>{const n=el.getAttribute("data-hicon");if(!el.innerHTML.trim()&&icons[n]){el.innerHTML=icons[n];el.classList.add("hicon-ready")}})})();

/* EDUKA_TOPBAR_ICON_PATCH */

(function(){
  const icons = {
    phone:`<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/></svg>`,
    globe:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21c-2.3-2.5-3.5-5.5-3.5-9S9.7 5.5 12 3Z"/></svg>`,
    chevron:`<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>`
  };
  document.querySelectorAll("[data-hicon]").forEach((el)=>{
    const n = el.getAttribute("data-hicon");
    if (icons[n] && !el.innerHTML.trim()) {
      el.innerHTML = icons[n];
      el.classList.add("hicon-ready");
    }
  });
})();

/* EDUKA_ENRICHED_EXTRA_ICONS */

(function(){
  const extraIcons = {
    school:`<svg viewBox="0 0 24 24"><path d="M4 10 12 5l8 5-8 5-8-5Z"/><path d="M6 12v5c2.5 2 9.5 2 12 0v-5"/><path d="M20 10v6"/></svg>`,
    code:`<svg viewBox="0 0 24 24"><path d="m8 9-4 3 4 3"/><path d="m16 9 4 3-4 3"/><path d="m14 5-4 14"/></svg>`,
    building:`<svg viewBox="0 0 24 24"><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16"/><path d="M17 9h1a2 2 0 0 1 2 2v10"/><path d="M8 7h4M8 11h4M8 15h4M9 21v-3h3v3"/></svg>`,
    video:`<svg viewBox="0 0 24 24"><rect x="3" y="6" width="14" height="12" rx="2"/><path d="m17 10 4-2v8l-4-2v-4Z"/></svg>`,
    users:`<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/></svg>`,
    students:`<svg viewBox="0 0 24 24"><path d="M12 14c3.3 0 6 1.8 6 4v1H6v-1c0-2.2 2.7-4 6-4Z"/><circle cx="12" cy="8" r="4"/><path d="m4 7 8-4 8 4-8 4-8-4Z"/></svg>`,
    groups:`<svg viewBox="0 0 24 24"><path d="M8 21v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1"/><circle cx="12" cy="10" r="3"/><path d="M3 20v-1a3 3 0 0 1 3-3"/><path d="M21 20v-1a3 3 0 0 0-3-3"/><circle cx="6" cy="11" r="2"/><circle cx="18" cy="11" r="2"/></svg>`,
    calendar:`<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>`,
    wallet:`<svg viewBox="0 0 24 24"><path d="M4 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h13"/><path d="M17 13h.01"/></svg>`,
    warning:`<svg viewBox="0 0 24 24"><path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5M12 17h.01"/></svg>`,
    teacher:`<svg viewBox="0 0 24 24"><path d="M3 4h18v12H3z"/><path d="M8 20h8M12 16v4"/><circle cx="8" cy="10" r="2"/><path d="M12 9h5M12 12h4"/></svg>`,
    lead:`<svg viewBox="0 0 24 24"><path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z"/></svg>`,
    chart:`<svg viewBox="0 0 24 24"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 15l4-4 3 3 5-7"/></svg>`,
    shield:`<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>`,
    database:`<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5"/><path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>`,
    bell:`<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>`
  };
  document.querySelectorAll("[data-hicon]").forEach((el)=>{
    const name = el.getAttribute("data-hicon");
    if (extraIcons[name]) {
      el.innerHTML = extraIcons[name];
      el.classList.add("hicon-ready");
    }
  });
})();
