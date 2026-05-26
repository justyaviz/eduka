const plans = {
  monthly: {
    icon: '📅', title: 'Oylik (Kalendar)',
    desc: 'O‘quvchi yoki tashkilot har oy boshidan oxirigacha, ya’ni kalendar oyiga asoslanib to‘lov qiladi. Har oy uchun alohida to‘lov undiriladi va oylik davr tugagach, keyingi oy uchun to‘lov qayta hisoblanadi.',
    example: 'Agar o‘quvchi 10-iyun kuni obuna bo‘lsa, to‘lov 1-iyundan 30-iyungacha bo‘lgan davr uchun hisoblanadi.',
    pros: ['Hisob-kitob oddiy va tushunarli.', 'Oylik reja va budjetni boshqarish qulay.', 'Har oy yangilanadi, foydalanishni davom ettirish oson.'],
    cons: ['Oy o‘rtasida boshlansa ham, to‘liq oy uchun to‘lov olinadi.', 'Uzoq muddatli kontraktlarga nisbatan qimmatroq bo‘lishi mumkin.']
  },
  daily: {
    icon: '☀️', title: 'Kunlik',
    desc: 'O‘quvchi guruhdagi har bir o‘quv kuni uchun belgilangan narx asosida to‘lov qiladi. Dars bo‘lmagan kunlar uchun to‘lov olinmaydi.',
    example: 'Agar o‘quvchi oy davomida 18 kun darsda qatnashsa, u faqat shu 18 kun uchun to‘lov qiladi.',
    pros: ['Faqat qatnashgan kunlar uchun to‘lov.', 'O‘quvchiga adolatli va moslashuvchan.', 'Darslar soniga mos ravishda aniq hisob-kitob.'],
    cons: ['Hisob-kitob murakkabroq bo‘lishi mumkin.', 'Oylik rejimdan ko‘ra narx biroz yuqoriroq bo‘lishi mumkin.']
  },
  module: {
    icon: '📘', title: 'Modul',
    desc: 'Kurs bo‘yicha o‘quvchilarga modul asosida to‘lov olish modeli. Har bir modul alohida narxga ega bo‘ladi.',
    example: 'Kurs 4 moduldan iborat. O‘quvchi faqat 1- va 2-modullarni tanladi. U faqat shu modullar uchun to‘lov qiladi.',
    pros: ['O‘quvchilar faqat kerakli modullar uchun to‘lov qiladi.', 'O‘quv rejasini individual tanlash imkonini beradi.', 'Modullar narxini mustaqil belgilash mumkin.'],
    cons: ['Modullar soni ko‘p bo‘lsa, tanlash qiyin bo‘lishi mumkin.', 'Boshqaruv biroz murakkablashadi.']
  },
  group: {
    icon: '👥', title: 'Guruh boshlanish sanasi',
    desc: 'Bu rejimda guruhdagi o‘quvchilardan pul yechib olish sanasi guruh boshlanish sanasi hisoblanadi.',
    example: 'Guruh 14-sanada ochilsa, har oyning 14-sanasi o‘quvchilar uchun to‘lov kuni hisoblanadi.',
    pros: ['Guruh bilan ishlashda juda qulay.', 'To‘lov sanasi hamma uchun bir xil bo‘ladi.', 'Hisobotlar tartibli yuritiladi.'],
    cons: ['Turli guruhlar har xil sanaga to‘g‘ri kelishi mumkin.', 'Kalendar nazoratini talab qiladi.']
  },
  course: {
    icon: '💳', title: 'Kurs uchun to‘lov',
    desc: 'Bu rejimda o‘quvchi butun kurs davomiyligi uchun bir martalik to‘lovni amalga oshiradi.',
    example: '6 oylik kurs uchun umumiy to‘lov 6 000 000 so‘m bo‘lsa, platforma shu summani kurs qarzdorligi sifatida kiritadi.',
    pros: ['Uzoq kurslar uchun qulay.', 'Daromad oldindan ko‘rinadi.', 'Online kurslar uchun mos.'],
    cons: ['Boshqa to‘lov rejimlariga mos kelmasligi mumkin.', 'Qisman qatnashuvchilar uchun moslashuv kamroq.']
  },
  individual: {
    icon: '👤', title: 'Individual',
    desc: 'Bu rejimda o‘quvchi qachon guruhda faollashtirilsa, har oyning o‘sha sanasida platforma avtomatik pul yechadi.',
    example: 'O‘quvchi 15-sanada faollashtirilgan bo‘lsa, har oyning 15-sanasi to‘lov kuni hisoblanadi.',
    pros: ['O‘quvchining kelgan sanasiga mos to‘lov.', 'Moslashuvchan yondashuv.', 'Individual ta’lim uchun qulay.'],
    cons: ['Barcha to‘lovlar bir kunda tushmaydi.', 'Sanalar har xil bo‘lgani uchun nazorat talab qiladi.']
  }
};

const planCard = document.getElementById('planCard');
const tabs = document.querySelectorAll('.tab');

function renderPlan(key) {
  const p = plans[key];
  planCard.innerHTML = `
    <div class="plan-title"><div class="plan-emoji">${p.icon}</div><h3>${p.title}</h3></div>
    <p class="plan-desc">${p.desc}</p>
    <div class="example"><b>Misol:</b><p>${p.example}</p></div>
    <div class="pros-cons">
      <div class="pros"><h4>Afzalliklari:</h4><ul>${p.pros.map(item => `<li>${item}</li>`).join('')}</ul></div>
      <div class="cons"><h4>Kamchiliklari:</h4><ul>${p.cons.map(item => `<li>${item}</li>`).join('')}</ul></div>
    </div>`;
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderPlan(tab.dataset.plan);
  });
});

const style = document.createElement('style');
style.textContent = `.plan-emoji{width:92px;height:92px;display:grid;place-items:center;border-radius:22px;background:#edf3ff;font-size:44px}`;
document.head.appendChild(style);

const menu = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');
if (menu) {
  menu.addEventListener('click', () => {
    nav.style.display = nav.style.display === 'flex' ? '' : 'flex';
    nav.style.position = 'absolute';
    nav.style.left = '12px';
    nav.style.right = '12px';
    nav.style.top = '80px';
    nav.style.background = '#fff';
    nav.style.border = '1px solid #e8ecf7';
    nav.style.padding = '18px';
    nav.style.borderRadius = '16px';
    nav.style.flexDirection = 'column';
  });
}
