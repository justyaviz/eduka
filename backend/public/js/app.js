document.querySelectorAll('[data-demo]').forEach((btn)=>{btn.addEventListener('click',()=>{window.location.href='/uz/demo'})});
const year = document.querySelector('[data-year]'); if(year) year.textContent = new Date().getFullYear();
