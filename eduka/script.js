const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const languageButtons = document.querySelectorAll("[data-lang]");
const modal = document.querySelector("[data-modal]");
const modalForm = document.querySelector(".modal-form");
const toast = document.querySelector(".toast");

const translations = {
  uz: {
    loader: "CRM ishga tayyorlanmoqda",
    navFeatures: "Imkoniyatlar",
    navPricing: "Narxlar",
    navGame: "Gamification",
    navSupport: "Qo'llab-quvvatlash",
    navCareers: "Vakansiyalar",
    login: "Kirish",
    demo: "Demo olish",
    heroBadge: "Yangi avlod o'quv markazlari uchun CRM",
    heroTitle: "O'quv markazingizni yagona tizimda boshqaring",
    heroText:
      "Eduka o'quvchilar, guruhlar, davomad, to'lovlar, qarzdorlik va lidlarni bir joyda tartiblaydi. Qo'lda qilinadigan ishlarni kamaytiring, jamoangizni nazorat qiling va o'sishni aniq ko'ring.",
    trial: "Hoziroq demo oling",
    seePricing: "Narxlarni ko'rish",
    priceSignal: "Tariflar 299 000 so'mdan boshlanadi",
    betaSignal: "Yangi loyiha: beta hamkorlar qabul qilinmoqda",
    crmMenu: "Boshqaruv",
    crmStudents: "O'quvchilar",
    crmGroups: "Guruhlar",
    crmFinance: "Moliya",
    crmReports: "Hisobotlar",
    today: "Bugungi ko'rsatkichlar",
    students: "O'quvchilar",
    payments: "To'lovlar",
    leads: "Lidlar",
    quickTasks: "Tezkor nazorat",
    taskDebt: "Qarzdor o'quvchilar",
    taskAttendance: "Bugungi davomad",
    taskLeads: "Sinov dars lidlari",
    partnerTitle: "Beta bosqichidagi birinchi hamkorlar",
    problemBadge: "Muammolarni tizimga aylantiring",
    problemTitle: "Dars jadvalidan moliyagacha bo'lgan jarayonlar bitta CRM ichida",
    problemText:
      "Excel, daftar, Telegram chat va alohida to'lov ro'yxatlari markaz o'sgan sari nazoratni qiyinlashtiradi. Eduka jarayonlarni birlashtirib, administrator va rahbar uchun aniq ko'rinish beradi.",
    featuresBadge: "Imkoniyatlar",
    featuresTitle: "O'quv markazni boshqarish uchun kerakli modullar",
    fStudents: "O'quvchilar bazasi",
    fStudentsText: "Har bir o'quvchi profili, ota-ona raqami, statusi, to'lov va guruh tarixi.",
    fGroups: "Guruhlar va jadval",
    fGroupsText: "Guruh, fan, xona, o'qituvchi va dars kunlarini tartibli boshqaring.",
    fAttendance: "Davomad",
    fAttendanceText: "Keldi, kelmadi, kechikdi holatlari va oy yakunidagi davomad statistikasi.",
    fPayments: "To'lov va qarzdorlik",
    fPaymentsText: "To'lov muddati, chegirma, qarzdorlar va tushum nazorati.",
    fLeads: "Lidlar / sotuv bo'limi",
    fLeadsText: "Yangi mijozlarni sinov darsidan birinchi to'lovgacha kuzating.",
    fCabinet: "Kabinetlar",
    fCabinetText: "O'qituvchi, o'quvchi va ota-ona uchun alohida qulay kirish imkoniyati.",
    fBranch: "Filiallar",
    fBranchText: "Bir nechta filial ko'rsatkichlarini markazlashgan dashboardda ko'ring.",
    fReports: "Hisobotlar",
    fReportsText: "Daromad, guruh samaradorligi, o'sish va jamoa ishini raqamlarda kuzating.",
    gameBadge: "Gamification",
    gameTitle: "O'quvchini natija, reyting va yutuqlar orqali rag'batlantiring",
    gameText: "Ball, reyting, vazifa bajarish va darsdagi faollik orqali o'quvchilar motivatsiyasini oshirish mumkin.",
    topGroup: "Top guruh",
    weekly: "Haftalik faollik",
    pricingBadge: "Narxlar",
    pricingTitle: "Eduka tariflari o'quvchi soniga qarab moslashadi",
    studentCount: "o'quvchi",
    perMonth: "so'm / oy",
    popular: "Ommabop",
    choose: "Tanlash",
    custom: "Kelishiladi",
    enterprise: "filialli markazlar",
    contact: "Bog'lanish",
    supportBadge: "Qo'llab-quvvatlash",
    supportTitle: "Ishga tushirishdan kundalik ishlatishgacha yordam beramiz",
    sTelegram: "Telegram eslatmalar",
    sTelegramText: "To'lov, dars va vazifalar bo'yicha avtomatik xabarlar.",
    sOnboarding: "Onboarding",
    sOnboardingText: "Jamoangizga CRM bilan ishlashni tushuntirib, ma'lumotlarni tartiblaymiz.",
    sSecurity: "Xavfsizlik",
    sSecurityText: "Rollar, ruxsatlar va ma'lumotlarni boshqarish nazorati.",
    nProject: "yangi loyiha",
    nPartners: "ilk hamkorlar",
    nModules: "asosiy modul",
    nLang: "til",
    testimonialBadge: "Mijozlar fikri",
    testimonialTitle: "Beta hamkorlar bilan Eduka’ni real markazlarda sinaymiz",
    t1: "\"To'lov va davomadni bitta oynada ko'rish administrator ishini ancha yengillashtiradi.\"",
    t2: "\"Lidlar va guruhlar bo'yicha aniq pipeline bo'lishi sotuvni tartibga soladi.\"",
    t3: "\"Filiallar uchun oddiy, arzon va tushunarli CRM kerak edi. Eduka shu tomonga ketyapti.\"",
    betaPartner: "Beta hamkor",
    faqTitle: "Ko'p so'raladigan savollar",
    q1: "Eduka kimlar uchun?",
    a1: "O'quv markazlar, til maktablari, IT akademiyalar va kurs markazlari uchun.",
    q2: "Hozir loyiha tayyormi?",
    a2: "Eduka yangi loyiha. Beta hamkorlar orqali modullar bosqichma-bosqich ishga tushiriladi.",
    q3: "Telegram botga ulash mumkinmi?",
    a3: "Ha. Demo so'rovlarini Telegram bot yoki alohida guruhga yuborish mumkin.",
    q4: "Uch tilda ishlaydimi?",
    a4: "Sayt UZ/RU/EN tillarida. CRM interfeysi ham uch tilda rejalashtiriladi.",
    footerText: "O'quv markazlari uchun professional CRM tizimi.",
    modalBadge: "Demo so'rovi",
    modalTitle: "Eduka'ni markazingizda sinab ko'ring",
    modalText: "Telefon raqamingizni qoldiring. So'rovingiz Telegram bot yoki guruhga yuboriladigan qilib ulanadi.",
    sendDemo: "Demo so'rovini yuborish",
    namePlaceholder: "Ismingiz",
    toastDemo: "Demo so'rovi qabul qilindi. Telegram bot ulanishi keyingi bosqichda qo'shiladi.",
    toastLogin: "CRM kabinet hozircha yopiq beta rejimida.",
    toastLang: "tili tanlandi"
  },
  ru: {
    loader: "CRM готовится к запуску",
    navFeatures: "Возможности",
    navPricing: "Цены",
    navGame: "Геймификация",
    navSupport: "Поддержка",
    navCareers: "Вакансии",
    login: "Войти",
    demo: "Демо",
    heroBadge: "CRM для учебных центров нового поколения",
    heroTitle: "Управляйте учебным центром в единой системе",
    heroText:
      "Eduka объединяет учеников, группы, посещаемость, платежи, задолженности и лиды. Сократите ручную работу, контролируйте команду и видьте рост в цифрах.",
    trial: "Получить демо",
    seePricing: "Смотреть цены",
    priceSignal: "Тарифы начинаются от 299 000 сум",
    betaSignal: "Новый проект: принимаем beta-партнеров",
    crmMenu: "Управление",
    crmStudents: "Ученики",
    crmGroups: "Группы",
    crmFinance: "Финансы",
    crmReports: "Отчеты",
    today: "Показатели сегодня",
    students: "Ученики",
    payments: "Платежи",
    leads: "Лиды",
    quickTasks: "Быстрый контроль",
    taskDebt: "Должники",
    taskAttendance: "Посещаемость сегодня",
    taskLeads: "Лиды на пробный урок",
    partnerTitle: "Первые партнеры beta-этапа",
    problemBadge: "Превратите хаос в систему",
    problemTitle: "От расписания до финансов - все процессы внутри одной CRM",
    problemText:
      "Excel, тетради, Telegram-чаты и отдельные списки оплат усложняют контроль при росте центра. Eduka объединяет процессы и дает руководителю прозрачную картину.",
    featuresBadge: "Возможности",
    featuresTitle: "Модули для управления учебным центром",
    fStudents: "База учеников",
    fStudentsText: "Профиль ученика, контакты родителей, статус, история оплат и групп.",
    fGroups: "Группы и расписание",
    fGroupsText: "Управляйте группами, предметами, кабинетами, преподавателями и днями занятий.",
    fAttendance: "Посещаемость",
    fAttendanceText: "Присутствовал, отсутствовал, опоздал и статистика по итогам месяца.",
    fPayments: "Оплаты и долги",
    fPaymentsText: "Срок оплаты, скидки, должники и контроль поступлений.",
    fLeads: "Лиды / отдел продаж",
    fLeadsText: "Ведите клиента от пробного урока до первой оплаты.",
    fCabinet: "Кабинеты",
    fCabinetText: "Отдельный доступ для преподавателей, учеников и родителей.",
    fBranch: "Филиалы",
    fBranchText: "Смотрите показатели нескольких филиалов в едином dashboard.",
    fReports: "Отчеты",
    fReportsText: "Доход, эффективность групп, рост и работу команды в цифрах.",
    gameBadge: "Геймификация",
    gameTitle: "Мотивируйте учеников рейтингами, баллами и достижениями",
    gameText: "Баллы, рейтинги, задания и активность на уроках помогают повышать мотивацию учеников.",
    topGroup: "Топ группа",
    weekly: "Активность за неделю",
    pricingBadge: "Цены",
    pricingTitle: "Тарифы Eduka адаптируются под количество учеников",
    studentCount: "учеников",
    perMonth: "сум / мес",
    popular: "Популярный",
    choose: "Выбрать",
    custom: "Индивидуально",
    enterprise: "для сетевых центров",
    contact: "Связаться",
    supportBadge: "Поддержка",
    supportTitle: "Поможем с запуском и ежедневным использованием",
    sTelegram: "Telegram уведомления",
    sTelegramText: "Автоматические сообщения по оплатам, урокам и задачам.",
    sOnboarding: "Онбординг",
    sOnboardingText: "Поможем команде освоить CRM и привести данные в порядок.",
    sSecurity: "Безопасность",
    sSecurityText: "Роли, доступы и контроль управления данными.",
    nProject: "новый проект",
    nPartners: "первых партнера",
    nModules: "основных модулей",
    nLang: "языка",
    testimonialBadge: "Отзывы",
    testimonialTitle: "Тестируем Eduka с beta-партнерами в реальных центрах",
    t1: "\"Оплаты и посещаемость в одном окне заметно упрощают работу администратора.\"",
    t2: "\"Понятный pipeline по лидам и группам помогает навести порядок в продажах.\"",
    t3: "\"Нам нужна простая, доступная и понятная CRM для филиалов. Eduka движется в эту сторону.\"",
    betaPartner: "Beta партнер",
    faqTitle: "Частые вопросы",
    q1: "Для кого Eduka?",
    a1: "Для учебных центров, языковых школ, IT академий и курсов.",
    q2: "Проект уже готов?",
    a2: "Eduka - новый проект. Модули запускаются поэтапно вместе с beta-партнерами.",
    q3: "Можно подключить Telegram bot?",
    a3: "Да. Демо-заявки можно отправлять в Telegram bot или отдельную группу.",
    q4: "Будет ли три языка?",
    a4: "Сайт работает на UZ/RU/EN. Интерфейс CRM также планируется на трех языках.",
    footerText: "Профессиональная CRM для учебных центров.",
    modalBadge: "Демо-заявка",
    modalTitle: "Попробуйте Eduka в вашем центре",
    modalText: "Оставьте номер. Заявку можно подключить к Telegram bot или группе.",
    sendDemo: "Отправить заявку",
    namePlaceholder: "Ваше имя",
    toastDemo: "Демо-заявка принята. Telegram bot подключим на следующем этапе.",
    toastLogin: "CRM кабинет пока в закрытой beta.",
    toastLang: "язык выбран"
  },
  en: {
    loader: "CRM is getting ready",
    navFeatures: "Features",
    navPricing: "Pricing",
    navGame: "Gamification",
    navSupport: "Support",
    navCareers: "Careers",
    login: "Login",
    demo: "Get demo",
    heroBadge: "CRM for next-generation learning centers",
    heroTitle: "Manage your learning center in one system",
    heroText:
      "Eduka brings students, groups, attendance, payments, debts and leads into one workspace. Reduce manual work, control your team and see growth clearly.",
    trial: "Get a demo now",
    seePricing: "See pricing",
    priceSignal: "Plans start from 299,000 UZS",
    betaSignal: "New project: beta partners are welcome",
    crmMenu: "Management",
    crmStudents: "Students",
    crmGroups: "Groups",
    crmFinance: "Finance",
    crmReports: "Reports",
    today: "Today's metrics",
    students: "Students",
    payments: "Payments",
    leads: "Leads",
    quickTasks: "Quick control",
    taskDebt: "Students in debt",
    taskAttendance: "Today's attendance",
    taskLeads: "Trial lesson leads",
    partnerTitle: "First beta-stage partners",
    problemBadge: "Turn problems into a system",
    problemTitle: "From schedules to finance, all workflows inside one CRM",
    problemText:
      "Excel files, notebooks, Telegram chats and separate payment lists make control harder as a center grows. Eduka connects workflows and gives leaders a clear view.",
    featuresBadge: "Features",
    featuresTitle: "Modules for managing a learning center",
    fStudents: "Student database",
    fStudentsText: "Student profile, parent contacts, status, payment and group history.",
    fGroups: "Groups and schedule",
    fGroupsText: "Manage groups, subjects, rooms, teachers and lesson days.",
    fAttendance: "Attendance",
    fAttendanceText: "Present, absent, late statuses and monthly attendance statistics.",
    fPayments: "Payments and debt",
    fPaymentsText: "Payment dates, discounts, debtors and revenue control.",
    fLeads: "Leads / sales",
    fLeadsText: "Track clients from trial lesson to first payment.",
    fCabinet: "Portals",
    fCabinetText: "Separate access for teachers, students and parents.",
    fBranch: "Branches",
    fBranchText: "View multiple branch metrics in one dashboard.",
    fReports: "Reports",
    fReportsText: "Revenue, group performance, growth and team activity in numbers.",
    gameBadge: "Gamification",
    gameTitle: "Motivate students with points, ratings and achievements",
    gameText: "Points, ratings, assignments and class activity can increase student motivation.",
    topGroup: "Top group",
    weekly: "Weekly activity",
    pricingBadge: "Pricing",
    pricingTitle: "Eduka plans scale with your student count",
    studentCount: "students",
    perMonth: "UZS / month",
    popular: "Popular",
    choose: "Choose",
    custom: "Custom",
    enterprise: "for multi-branch centers",
    contact: "Contact us",
    supportBadge: "Support",
    supportTitle: "We help from setup to daily usage",
    sTelegram: "Telegram reminders",
    sTelegramText: "Automated messages for payments, lessons and tasks.",
    sOnboarding: "Onboarding",
    sOnboardingText: "We help your team learn the CRM and organize data.",
    sSecurity: "Security",
    sSecurityText: "Roles, permissions and data management control.",
    nProject: "new project",
    nPartners: "first partners",
    nModules: "core modules",
    nLang: "languages",
    testimonialBadge: "Testimonials",
    testimonialTitle: "We test Eduka with beta partners in real centers",
    t1: "\"Seeing payments and attendance in one window makes admin work much easier.\"",
    t2: "\"A clear lead and group pipeline helps organize sales.\"",
    t3: "\"We needed a simple, affordable CRM for branches. Eduka is moving in that direction.\"",
    betaPartner: "Beta partner",
    faqTitle: "Frequently asked questions",
    q1: "Who is Eduka for?",
    a1: "For learning centers, language schools, IT academies and course providers.",
    q2: "Is the project ready?",
    a2: "Eduka is a new project. Modules will launch step by step with beta partners.",
    q3: "Can Telegram bot be connected?",
    a3: "Yes. Demo requests can be sent to a Telegram bot or a dedicated group.",
    q4: "Will it support three languages?",
    a4: "The website supports UZ/RU/EN. The CRM interface is also planned in three languages.",
    footerText: "Professional CRM for learning centers.",
    modalBadge: "Demo request",
    modalTitle: "Try Eduka in your center",
    modalText: "Leave your number. The request can be connected to a Telegram bot or group.",
    sendDemo: "Send demo request",
    namePlaceholder: "Your name",
    toastDemo: "Demo request received. Telegram bot integration will be added next.",
    toastLogin: "CRM portal is currently in private beta.",
    toastLang: "language selected"
  }
};

let currentLang = localStorage.getItem("eduka-lang") || "uz";
let toastTimer;

function showToast(message) {
  if (!toast) return;
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("eduka-lang", lang);
  const dictionary = translations[lang];

  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (dictionary[key]) node.textContent = dictionary[key];
  });

  document.querySelectorAll("[data-placeholder]").forEach((node) => {
    const key = `${node.dataset.placeholder}Placeholder`;
    if (dictionary[key]) node.placeholder = dictionary[key];
  });

  languageButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === lang);
  });
}

function openModal() {
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  window.setTimeout(() => modal.querySelector("input")?.focus(), 80);
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
}

window.addEventListener("load", () => {
  applyLanguage(currentLang);
  window.setTimeout(() => document.body.classList.add("loaded"), 550);
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
  showToast(translations[currentLang].toastLogin);
});

document.querySelector("[data-close-modal]")?.addEventListener("click", closeModal);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang);
    showToast(`${button.textContent} ${translations[currentLang].toastLang}`);
  });
});

modalForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  showToast(translations[currentLang].toastDemo);
  modalForm.reset();
  closeModal();
});

const revealTargets = document.querySelectorAll(
  ".partner-section, .problem-section, .section-block, .split-section, .numbers-section, .testimonial-section, .faq-section"
);

revealTargets.forEach((target) => target.classList.add("reveal"));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

revealTargets.forEach((target) => revealObserver.observe(target));
