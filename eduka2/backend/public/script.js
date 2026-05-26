const plans = {
  monthly: {
    title: 'Oylik (Kalendar)',
    icon: 'calendar',
    text: 'O‘quvchi yoki tashkilot har oy boshidan oxirigacha, ya’ni kalendar oyiga asoslanib to‘lov qiladi. Har oy uchun alohida to‘lov undiriladi va oylik davr tugagach, keyingi oy uchun to‘lov qayta hisoblanadi.',
    example: 'Agar siz 10-iyun kuni obuna bo‘lsangiz, to‘lov 1-iyundan 30-iyungacha bo‘lgan davr uchun hisoblanadi. Keyingi to‘lov 1-iyuldan boshlab avtomatik ravishda yangilanadi.',
    pros: ['Hisob-kitob oddiy va tushunarli.', 'Oylik reja va byudjetni boshqarish qulay.', 'Har oy yangilanadi, foydalanishni davom ettirish oson.', 'Qisqa muddatli foydalanish uchun mos.'],
    cons: ['Oy o‘rtasida boshlansa ham, to‘liq oy uchun to‘lov olinadi.', 'Uzun muddatli kontraktlarga nisbatan qimmatroq bo‘lishi mumkin.', 'Tez-tez yangilanishlar sabab to‘lov nazorati talab etiladi.']
  },
  daily: {
    title: 'Kunlik',
    icon: 'calendar',
    text: 'O‘quvchi guruhdagi har bir o‘quv kuni uchun belgilangan narx asosida to‘lov qiladi. Dars bo‘lmagan kunlar uchun to‘lov olinmaydi. Bu rejim o‘quv jadvaliga moslashuvchan.',
    example: 'Agar o‘quvchi oy davomida 18 kun darsda qatnashsa, u faqat shu 18 kun uchun to‘lov qiladi.',
    pros: ['Faqat qatnashgan kunlar uchun to‘lov.', 'O‘quvchiga adolatli va moslashuvchan.', 'Darslar soniga mos aniq hisob-kitob.', 'Dam olish va bayram kunlarida to‘lov olinmaydi.'],
    cons: ['Hisob-kitob murakkabroq bo‘lishi mumkin.', 'Oylik rejimdan ko‘ra nazorat ko‘proq talab qiladi.', 'Kunlar soni o‘zgarishi daromad barqarorligiga ta’sir qilishi mumkin.']
  },
  module: {
    title: 'Modul',
    icon: 'module',
    text: 'Kurs bo‘yicha o‘quvchilarga modul asosida to‘lov olish modeli. Har bir modul alohida narxga ega bo‘lib, o‘quvchilar faqat tanlangan modul uchun to‘lov qiladilar.',
    example: 'Kurs 4 moduldan iborat. O‘quvchi faqat 1- va 2-modullarni tanladi. U faqat shu modullar uchun to‘lov qiladi.',
    pros: ['O‘quvchilar faqat kerakli modullar uchun to‘lov qiladi.', 'Moslashuvchan: o‘quv rejasini individual tanlash imkonini beradi.', 'Sotuvlarni bosqichma-bosqich oshirishga yordam beradi.', 'Modullar narxini mustaqil belgilash imkoniyati mavjud.'],
    cons: ['Modullar soni ko‘p bo‘lsa, tanlash qiyin bo‘lishi mumkin.', 'Daromad barqarorligi pasayishi mumkin.', 'Hisob-kitob va boshqaruv biroz murakkablashadi.']
  },
  start: {
    title: 'Guruh boshlanish sanasi',
    icon: 'users',
    text: 'Bu modelda to‘lov guruh boshlanish sanasiga bog‘lanadi. O‘quvchi guruhga qo‘shilganda guruhning umumiy sikli bo‘yicha hisob-kitob qilinadi.',
    example: 'Guruh 14-sanada ochilsa, har oyning 14-sanasi to‘lov kuni sifatida belgilanadi.',
    pros: ['Guruhlar bo‘yicha moliyani boshqarish oson.', 'To‘lov kuni doim bir xil bo‘ladi.', 'Admin va o‘qituvchi uchun monitoring qulay.'],
    cons: ['Turli guruhlarda sanalar ko‘payib ketishi mumkin.', 'Oy ichida qo‘shilgan o‘quvchilar uchun alohida hisob kerak bo‘ladi.']
  },
  course: {
    title: 'Kurs uchun to‘lov',
    icon: 'card',
    text: 'O‘quvchi butun kurs davomiyligi uchun bir martalik yoki bosqichli to‘lov amalga oshiradi. Bu uzoq muddatli kurslar uchun qulay.',
    example: '6 oylik kurs uchun umumiy to‘lov 6 000 000 so‘m bo‘lsa, tizim bu summani kurs davomiyligi bo‘yicha nazorat qiladi.',
    pros: ['Katta kurslar uchun aniq moliyaviy reja.', 'Daromadni oldindan prognoz qilish oson.', 'Kurs paketlarini sotish uchun qulay.'],
    cons: ['Boshqa to‘lov rejimlariga mos kelmasligi mumkin.', 'Bekor qilish yoki muzlatish uchun alohida qoida kerak.']
  },
  individual: {
    title: 'Individual',
    icon: 'person',
    text: 'Individual o‘quvchilar uchun mos model. To‘lov o‘quvchining shaxsiy jadvali, dars sanasi yoki kelishilgan davr bo‘yicha hisoblanadi.',
    example: 'O‘quvchi 15-sanada faollashtirilsa, har oyning 15-sanasi to‘lov kuni sifatida belgilanadi.',
    pros: ['Har bir o‘quvchiga alohida shart qo‘yish mumkin.', 'Yakka tartibdagi darslar uchun juda qulay.', 'Moslashuvchan ta’lim modeli yaratiladi.'],
    cons: ['Ko‘p o‘quvchi bo‘lsa, nazorat murakkablashadi.', 'Har xil sanalar moliyaviy monitoringni ko‘paytiradi.']
  }
};

function iconSvg(type){
  const paths = {
    calendar:'M7 2v3M17 2v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z',
    module:'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
    users:'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.8 0-5 1.4-5 3v2h10v-2c0-1.6-2.2-3-5-3Zm8 0c-.6 0-1.2.1-1.7.2 1.1.8 1.7 1.7 1.7 2.8v2h5v-2c0-1.6-2.2-3-5-3Z',
    card:'M3 6h18v12H3V6Zm3 3h12M6 15h6',
    person:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9c.7-4 3.5-6 8-6s7.3 2 8 6'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[type] || paths.calendar}"/></svg>`;
}

function renderPlan(key='monthly'){
  const data = plans[key] || plans.monthly;
  const card = document.getElementById('plan-card');
  card.innerHTML = `
    <div class="plan-title">
      <span class="plan-icon">${key === 'monthly' ? '<img src="/assets/logo-icon.png" alt="">' : iconSvg(data.icon)}</span>
      <h3>${data.title}</h3>
    </div>
    <p>${data.text}</p>
    <div class="example">
      ${iconSvg('calendar')}
      <div><b>Misol:</b><p>${data.example}</p></div>
    </div>
    <div class="pros-cons">
      <div class="pros"><h4>Afzalliklari:</h4><ul>${data.pros.map(i=>`<li>${i}</li>`).join('')}</ul></div>
      <div class="cons"><h4>Kamchiliklari:</h4><ul>${data.cons.map(i=>`<li>${i}</li>`).join('')}</ul></div>
    </div>`;
}

const tabButtons = document.querySelectorAll('.tabs button');
tabButtons.forEach(btn => btn.addEventListener('click', () => {
  tabButtons.forEach(item => item.classList.remove('active'));
  btn.classList.add('active');
  renderPlan(btn.dataset.plan);
}));
renderPlan('monthly');

document.querySelector('.mobile-menu')?.addEventListener('click', () => {
  document.body.classList.toggle('menu-open');
});
