(function(){
  const extra = {
    trophy:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v3h3v2a5 5 0 0 1-5 5h-.4A5.7 5.7 0 0 1 13 15.6V19h4v2H7v-2h4v-3.4A5.7 5.7 0 0 1 9.4 14H9a5 5 0 0 1-5-5V7h3V4Z"/><path d="M17 7v4h.5A2.5 2.5 0 0 0 20 8.5V7h-3ZM7 7v4h-.5A2.5 2.5 0 0 1 4 8.5V7h3Z"/></svg>`,
    target:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6"/></svg>`,
    medal:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l-2 5h-4L8 3Z"/><circle cx="12" cy="13" r="4"/><path d="m10 17-1 4 3-1.5 3 1.5-1-4"/></svg>`,
    star:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>`,
    sparkles:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 10.5 8.5 5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3Z"/><path d="M19 15l-.8 2.2L16 18l2.2.8L19 21l.8-2.2L22 18l-2.2-.8L19 15Z"/></svg>`,
    cart:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h2l2.2 10.2a2 2 0 0 0 2 1.6h6.7a2 2 0 0 0 1.9-1.4L21 8H7.1"/><circle cx="10" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></svg>`,
    play:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 7 8 5-8 5V7Z"/></svg>`,
    "arrow-right":`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>`
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