const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const languageButtons = document.querySelectorAll("[data-lang]");
const modal = document.querySelector("[data-modal]");
const successModal = document.querySelector("[data-success-modal]");
const loginModal = document.querySelector("[data-login-modal]");
const modalForm = document.querySelector(".modal-form");
const toast = document.querySelector(".toast");
const billingButtons = document.querySelectorAll("[data-billing]");

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
    crmLeads: "Lidlar",
    crmReports: "Hisobotlar",
    today: "Bugungi ko'rsatkichlar",
    students: "O'quvchilar",
    payments: "To'lovlar",
    leads: "Lidlar",
    quickTasks: "Tezkor nazorat",
    taskDebt: "Qarzdor o'quvchilar",
    taskAttendance: "Bugungi davomad",
    taskLeads: "Sinov dars lidlari",
    heroFloatDebt: "Qarzdorlik",
    heroFloatAttendance: "Bugungi davomad",
    heroFloatLead: "Yangi lid",
    paymentGraph: "To'lov grafigi",
    tableStudent: "O'quvchi",
    tableGroup: "Guruh",
    tableStatus: "Holat",
    tablePayment: "To'lov",
    statusActive: "Faol",
    statusDebt: "Qarzdor",
    pipeNew: "Yangi lid",
    pipeTrial: "Sinov dars",
    pipePay: "To'lov",
    pipeGroup: "Guruh",
    partnerTitle: "Beta bosqichidagi birinchi hamkorlar",
    problemBadge: "Muammolarni tizimga aylantiring",
    problemTitle: "Dars jadvalidan moliyagacha bo'lgan jarayonlar bitta CRM ichida",
    problemText:
      "Excel, daftar, Telegram chat va alohida to'lov ro'yxatlari markaz o'sgan sari nazoratni qiyinlashtiradi. Eduka jarayonlarni birlashtirib, administrator va rahbar uchun aniq ko'rinish beradi.",
    audienceBadge: "Kimlar uchun",
    audienceTitle: "Eduka har xil formatdagi o'quv markazlarga moslashadi",
    aud1: "Til markazlari",
    aud1Text: "Guruhlar, darajalar, davomad va oylik to'lovlarni bir tizimda nazorat qiling.",
    aud2: "IT akademiyalar",
    aud2Text: "Modul, mentor, loyiha va o'quvchi progressini tartibli kuzating.",
    aud3: "Repetitor markazlari",
    aud3Text: "Individual va guruh darslarini, to'lov sanalarini va ota-onalar bilan aloqani soddalashtiring.",
    aud4: "Filialli markazlar",
    aud4Text: "Har bir filialdagi tushum, qarzdorlik va guruh samaradorligini alohida ko'ring.",
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
    workflowBadge: "Workflow",
    workflowTitle: "Yangi lid kelganidan to o'quvchi bitirgunigacha hammasi nazoratda",
    w1: "Lid qabul qilish",
    w1Text: "Instagram, Telegram yoki telefon orqali kelgan mijozlar sotuv bo'limida yo'qolib ketmaydi.",
    w2: "Sinov dars",
    w2Text: "Sinov dars vaqti, mas'ul menejer va natija bir joyda qayd etiladi.",
    w3: "Guruhga qo'shish",
    w3Text: "O'quvchi mos guruhga biriktiriladi, jadval va to'lov avtomatik ko'rinadi.",
    w4: "O'sishni kuzatish",
    w4Text: "Davomad, to'lov, reyting va hisobotlar orqali markaz holatini real vaqtga yaqin ko'ring.",
    gameBadge: "Gamification",
    gameTitle: "O'quvchini natija, reyting va yutuqlar orqali rag'batlantiring",
    gameText: "Ball, reyting, vazifa bajarish va darsdagi faollik orqali o'quvchilar motivatsiyasini oshirish mumkin.",
    topGroup: "Top guruh",
    weekly: "Haftalik faollik",
    integrationBadge: "Integratsiyalar",
    integrationTitle: "Telegram, SMS va to'lov tizimlariga tayyor arxitektura",
    integrationText:
      "Demo so'rovlari allaqachon Telegram guruhga yuboriladigan qilib ulandi. Keyingi bosqichda to'lov eslatmalari, dars bildirishnomalari va ota-onalarga xabarlar avtomatlashtiriladi.",
    pricingBadge: "Narxlar",
    pricingTitle: "Eduka tariflari o'quvchi soniga qarab moslashadi",
    billMonthly: "Oyma-oy",
    bill3: "3 oy",
    bill6: "6 oy",
    bill12: "12 oy",
    studentCount: "o'quvchi",
    perMonth: "so'm / oy",
    period3: "so'm / 3 oy",
    period6: "so'm / 6 oy - 10% chegirma",
    period12: "so'm / 12 oy - 16% chegirma",
    popular: "Ommabop",
    choose: "Tanlash",
    custom: "Kelishiladi",
    enterprise: "filialli markazlar",
    contact: "Bog'lanish",
    pAttendance: "Davomad va guruhlar",
    pPayments: "To'lov nazorati",
    pTelegram: "Telegram demo oqimi",
    pLeads: "Lidlar va sotuv pipeline",
    pReports: "Asosiy hisobotlar",
    pSupport: "Onboarding yordam",
    pBranches: "Filiallar nazorati",
    pCabinets: "Kabinetlar",
    pGame: "Gamification",
    pCustom: "Individual sozlash",
    pApi: "API va integratsiyalar",
    pManager: "Maxsus menejer",
    compareFeature: "Imkoniyat",
    compareStudents: "O'quvchi va guruhlar",
    compareAttendance: "Davomad CRM",
    compareLeads: "Lidlar pipeline",
    compareBranch: "Filiallar",
    compareManager: "Maxsus menejer",
    roadmapBadge: "Nega Eduka?",
    roadmapTitle: "O'quv markazingizda tartib, tezlik va nazorat paydo bo'ladi",
    rStep1: "01",
    rStep2: "02",
    rStep3: "03",
    rStep4: "04",
    r1: "Administrator ishi yengillashadi",
    r1Text: "O'quvchi, guruh, davomad va to'lov ma'lumotlari bitta oynada turadi.",
    r2: "Sotuv nazorati yo'qolmaydi",
    r2Text: "Lidlar, sinov darslar va qayta aloqa jarayoni aniq pipeline orqali yuradi.",
    r3: "Rahbar raqamni ko'radi",
    r3Text: "Tushum, qarzdorlik, filial va guruh samaradorligini real ko'rsatkichlarda kuzating.",
    r4: "Jamoa bir tizimda ishlaydi",
    r4Text: "O'qituvchi, administrator va sotuv bo'limi bir xil ma'lumot bilan ishlaydi.",
    salesCta: "Markazim uchun demo olish",
    salesCta2: "Tariflarni solishtirish",
    supportBadge: "Qo'llab-quvvatlash",
    supportTitle: "Ishga tushirishdan kundalik ishlatishgacha yordam beramiz",
    sTelegram: "Telegram orqali tez aloqa",
    sTelegramText: "Demo so'rov, savol va takliflar sotuv guruhiga tez yetib boradi.",
    sOnboarding: "Ishga tushirish yordami",
    sOnboardingText: "Markazingiz jarayonlarini tushunib, qaysi tarif va modul mosligini ko'rsatamiz.",
    sSecurity: "Ma'lumotlar nazorati",
    sSecurityText: "Rollar, ruxsatlar va jamoa kirishini tartibli boshqarish uchun tayyor yondashuv.",
    nProject: "boshlang'ich tarif",
    nPartners: "ilk hamkorlar",
    nModules: "asosiy modul",
    nLang: "til",
    testimonialBadge: "Mijozlar fikri",
    testimonialTitle: "O'quv markazlar Eduka orqali jarayonlarni tartibga solmoqda",
    t1: "\"Administrator endi kim to'lagan, kim qarzdor va kim darsga kelganini alohida ro'yxatlardan qidirmaydi.\"",
    t2: "\"Sinov darsga yozilgan lidlar yo'qolmaydi. Har bir mijozning keyingi qadami ko'rinib turadi.\"",
    t3: "\"Arzon, tushunarli va filiallar uchun kengayadigan CRM kerak edi. Eduka aynan shu ehtiyojga mos.\"",
    betaPartner: "Eduka hamkori",
    faqTitle: "Ko'p so'raladigan savollar",
    q1: "Eduka kimlar uchun?",
    a1: "O'quv markazlar, til maktablari, IT akademiyalar va kurs markazlari uchun.",
    q2: "Demo olish qancha vaqt oladi?",
    a2: "Formani to'ldirsangiz, sotuv jamoasi siz bilan bog'lanib markazingizga mos yechimni ko'rsatadi.",
    q3: "Narxlar nimaga qarab belgilanadi?",
    a3: "Tariflar o'quvchi soni va kerakli modullarga qarab tanlanadi. Start tarifi 299 000 so'mdan boshlanadi.",
    q4: "Eduka uch tilda ishlaydimi?",
    a4: "Ha, landing UZ/RU/EN tillarida. CRM interfeysi ham ko'p tilli ishlashga tayyorlanadi.",
    finalBadge: "Bugun boshlang",
    finalTitle: "O'quv markazingizni tartibga keltirishni bugun boshlang",
    finalText:
      "Eduka o'quv markaz CRM, davomad CRM, to'lov nazorati va o'quv markaz avtomatlashtirish jarayonlarini bitta joyga yig'adi.",
    finalButton: "Bepul konsultatsiya olish",
    footerText: "O'quv markazlari uchun professional CRM tizimi.",
    privacy: "Maxfiylik",
    terms: "Foydalanish shartlari",
    modalBadge: "Demo so'rovi",
    modalTitle: "Eduka'ni markazingizda sinab ko'ring",
    modalText: "Ma'lumotlarni qoldiring. So'rovingiz Eduka sotuv guruhiga yuboriladi.",
    sendDemo: "Demo so'rovini yuborish",
    namePlaceholder: "Ismingiz",
    centerPlaceholder: "O'quv markaz nomi",
    studentsPlaceholder: "O'quvchi soni",
    toastDemo: "Demo so'rovi yuborildi. Tez orada bog'lanamiz.",
    toastDemoError: "So'rov yuborilmadi. Iltimos, telefon orqali bog'laning: +998 99 893 90 00.",
    toastLogin: "CRM kabinet hozircha yopiq beta rejimida.",
    successTitle: "Arizangiz qabul qilindi",
    successText: "15 daqiqa ichida Eduka sotuv jamoasi siz bilan bog'lanadi va bepul konsultatsiya beradi.",
    successTelegram: "Telegram botga o'tish",
    betaBadge: "Yopiq beta",
    betaTitle: "CRM kabinet hozir yopiq beta rejimida",
    betaText: "Kirish faqat demo olgan va beta hamkor sifatida ulangan markazlar uchun ochiladi.",
    betaButton: "Beta ro'yxatga qo'shilish",
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
      "Eduka объединяет учеников, группы, посещаемость, платежи, долги и лиды. Сократите ручную работу, контролируйте команду и ясно видьте рост.",
    trial: "Получить демо",
    seePricing: "Смотреть цены",
    priceSignal: "Тарифы от 299 000 сум",
    betaSignal: "Новый проект: принимаем beta-партнеров",
    crmMenu: "Управление",
    crmStudents: "Ученики",
    crmGroups: "Группы",
    crmFinance: "Финансы",
    crmLeads: "Лиды",
    crmReports: "Отчеты",
    today: "Показатели сегодня",
    students: "Ученики",
    payments: "Платежи",
    leads: "Лиды",
    quickTasks: "Быстрый контроль",
    taskDebt: "Должники",
    taskAttendance: "Посещаемость сегодня",
    taskLeads: "Лиды на пробный урок",
    heroFloatDebt: "Долги",
    heroFloatAttendance: "Посещаемость",
    heroFloatLead: "Новый лид",
    paymentGraph: "График оплат",
    tableStudent: "Ученик",
    tableGroup: "Группа",
    tableStatus: "Статус",
    tablePayment: "Оплата",
    statusActive: "Активен",
    statusDebt: "Долг",
    pipeNew: "Новый лид",
    pipeTrial: "Пробный урок",
    pipePay: "Оплата",
    pipeGroup: "Группа",
    partnerTitle: "Первые партнеры beta-этапа",
    problemBadge: "Превратите хаос в систему",
    problemTitle: "От расписания до финансов - все процессы внутри одной CRM",
    problemText:
      "Excel, тетради, Telegram-чаты и отдельные списки оплат усложняют контроль при росте центра. Eduka объединяет процессы и дает руководителю прозрачную картину.",
    audienceBadge: "Для кого",
    audienceTitle: "Eduka подходит учебным центрам разных форматов",
    aud1: "Языковые центры",
    aud1Text: "Контролируйте группы, уровни, посещаемость и ежемесячные оплаты в одной системе.",
    aud2: "IT академии",
    aud2Text: "Отслеживайте модули, менторов, проекты и прогресс учеников.",
    aud3: "Репетиторские центры",
    aud3Text: "Упростите индивидуальные и групповые уроки, даты оплат и связь с родителями.",
    aud4: "Сетевые центры",
    aud4Text: "Смотрите выручку, долги и эффективность групп по каждому филиалу.",
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
    fLeads: "Лиды / продажи",
    fLeadsText: "Ведите клиента от пробного урока до первой оплаты.",
    fCabinet: "Кабинеты",
    fCabinetText: "Отдельный доступ для преподавателей, учеников и родителей.",
    fBranch: "Филиалы",
    fBranchText: "Смотрите показатели нескольких филиалов в едином dashboard.",
    fReports: "Отчеты",
    fReportsText: "Доход, эффективность групп, рост и работу команды в цифрах.",
    workflowBadge: "Workflow",
    workflowTitle: "От нового лида до выпуска ученика - все под контролем",
    w1: "Прием лида",
    w1Text: "Клиенты из Instagram, Telegram или телефона не теряются в отделе продаж.",
    w2: "Пробный урок",
    w2Text: "Время пробного урока, ответственный менеджер и результат фиксируются в одном месте.",
    w3: "Добавление в группу",
    w3Text: "Ученик назначается в подходящую группу, расписание и оплата видны автоматически.",
    w4: "Контроль роста",
    w4Text: "Посещаемость, платежи, рейтинг и отчеты показывают состояние центра почти в реальном времени.",
    gameBadge: "Геймификация",
    gameTitle: "Мотивируйте учеников рейтингами, баллами и достижениями",
    gameText: "Баллы, рейтинги, задания и активность на уроках помогают повышать мотивацию учеников.",
    topGroup: "Топ группа",
    weekly: "Активность за неделю",
    integrationBadge: "Интеграции",
    integrationTitle: "Архитектура готова к Telegram, SMS и платежным системам",
    integrationText:
      "Демо-заявки уже отправляются в Telegram-группу. Следующий этап - автоматические напоминания об оплате, занятиях и сообщения родителям.",
    pricingBadge: "Цены",
    pricingTitle: "Тарифы Eduka адаптируются под количество учеников",
    billMonthly: "Помесячно",
    bill3: "3 месяца",
    bill6: "6 месяцев",
    bill12: "12 месяцев",
    studentCount: "учеников",
    perMonth: "сум / мес",
    period3: "сум / 3 месяца",
    period6: "сум / 6 месяцев - скидка 10%",
    period12: "сум / 12 месяцев - скидка 16%",
    popular: "Популярный",
    choose: "Выбрать",
    custom: "Индивидуально",
    enterprise: "для сетевых центров",
    contact: "Связаться",
    pAttendance: "Посещаемость и группы",
    pPayments: "Контроль оплат",
    pTelegram: "Telegram demo flow",
    pLeads: "Лиды и sales pipeline",
    pReports: "Базовые отчеты",
    pSupport: "Помощь с onboarding",
    pBranches: "Контроль филиалов",
    pCabinets: "Кабинеты",
    pGame: "Геймификация",
    pCustom: "Индивидуальная настройка",
    pApi: "API и интеграции",
    pManager: "Персональный менеджер",
    compareFeature: "Возможность",
    compareStudents: "Ученики и группы",
    compareAttendance: "CRM посещаемости",
    compareLeads: "Pipeline лидов",
    compareBranch: "Филиалы",
    compareManager: "Персональный менеджер",
    roadmapBadge: "Почему Eduka?",
    roadmapTitle: "В вашем учебном центре появятся порядок, скорость и контроль",
    rStep1: "01",
    rStep2: "02",
    rStep3: "03",
    rStep4: "04",
    r1: "Администратору проще работать",
    r1Text: "Ученики, группы, посещаемость и оплаты находятся в одном окне.",
    r2: "Продажи под контролем",
    r2Text: "Лиды, пробные уроки и повторные касания идут через понятный pipeline.",
    r3: "Руководитель видит цифры",
    r3Text: "Отслеживайте выручку, долги, филиалы и эффективность групп в реальных показателях.",
    r4: "Команда работает в одной системе",
    r4Text: "Преподаватель, администратор и отдел продаж работают с одинаковыми данными.",
    salesCta: "Получить демо для центра",
    salesCta2: "Сравнить тарифы",
    supportBadge: "Поддержка",
    supportTitle: "Поможем с запуском и ежедневным использованием",
    sTelegram: "Быстрая связь через Telegram",
    sTelegramText: "Демо-заявки, вопросы и предложения быстро попадают в группу продаж.",
    sOnboarding: "Помощь при запуске",
    sOnboardingText: "Разберем процессы центра и покажем подходящий тариф и модули.",
    sSecurity: "Контроль данных",
    sSecurityText: "Готовый подход для ролей, доступов и аккуратного управления командой.",
    nProject: "стартовый тариф",
    nPartners: "первых партнера",
    nModules: "основных модулей",
    nLang: "языка",
    testimonialBadge: "Отзывы",
    testimonialTitle: "Учебные центры наводят порядок в процессах с Eduka",
    t1: "\"Администратор больше не ищет оплаты, долги и посещаемость в разных списках.\"",
    t2: "\"Лиды на пробный урок не теряются. По каждому клиенту виден следующий шаг.\"",
    t3: "\"Нам нужна была доступная CRM, которая понятна и масштабируется на филиалы. Eduka подходит под эту задачу.\"",
    betaPartner: "Партнер Eduka",
    faqTitle: "Частые вопросы",
    q1: "Для кого Eduka?",
    a1: "Для учебных центров, языковых школ, IT академий и курсов.",
    q2: "Сколько времени занимает получение демо?",
    a2: "Заполните форму, и команда продаж свяжется с вами, чтобы показать решение под ваш центр.",
    q3: "От чего зависит цена?",
    a3: "Тариф выбирается по количеству учеников и нужным модулям. Start начинается от 299 000 сум.",
    q4: "Eduka работает на трех языках?",
    a4: "Да, landing работает на UZ/RU/EN. CRM-интерфейс также готовится к многоязычной работе.",
    finalBadge: "Начните сегодня",
    finalTitle: "Начните наводить порядок в учебном центре уже сегодня",
    finalText:
      "Eduka объединяет CRM для учебного центра, посещаемость, контроль оплат и автоматизацию процессов в одном месте.",
    finalButton: "Получить бесплатную консультацию",
    footerText: "Профессиональная CRM для учебных центров.",
    privacy: "Конфиденциальность",
    terms: "Условия",
    modalBadge: "Демо-заявка",
    modalTitle: "Попробуйте Eduka в вашем центре",
    modalText: "Оставьте данные. Заявка будет отправлена в группу продаж Eduka.",
    sendDemo: "Отправить заявку",
    namePlaceholder: "Ваше имя",
    centerPlaceholder: "Название учебного центра",
    studentsPlaceholder: "Количество учеников",
    toastDemo: "Демо-заявка отправлена. Скоро свяжемся с вами.",
    toastDemoError: "Заявка не отправилась. Позвоните нам: +998 99 893 90 00.",
    toastLogin: "CRM кабинет пока в закрытой beta.",
    successTitle: "Заявка принята",
    successText: "В течение 15 минут команда продаж Eduka свяжется с вами и проведет бесплатную консультацию.",
    successTelegram: "Перейти в Telegram bot",
    betaBadge: "Закрытая beta",
    betaTitle: "CRM кабинет сейчас в закрытой beta",
    betaText: "Вход открыт только для центров, которые получили демо и подключены как beta-партнеры.",
    betaButton: "Записаться в beta",
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
    crmLeads: "Leads",
    crmReports: "Reports",
    today: "Today's metrics",
    students: "Students",
    payments: "Payments",
    leads: "Leads",
    quickTasks: "Quick control",
    taskDebt: "Students in debt",
    taskAttendance: "Today's attendance",
    taskLeads: "Trial lesson leads",
    heroFloatDebt: "Debt",
    heroFloatAttendance: "Attendance today",
    heroFloatLead: "New lead",
    paymentGraph: "Payment graph",
    tableStudent: "Student",
    tableGroup: "Group",
    tableStatus: "Status",
    tablePayment: "Payment",
    statusActive: "Active",
    statusDebt: "Debt",
    pipeNew: "New lead",
    pipeTrial: "Trial lesson",
    pipePay: "Payment",
    pipeGroup: "Group",
    partnerTitle: "First beta-stage partners",
    problemBadge: "Turn problems into a system",
    problemTitle: "From schedules to finance, all workflows inside one CRM",
    problemText:
      "Excel files, notebooks, Telegram chats and separate payment lists make control harder as a center grows. Eduka connects workflows and gives leaders a clear view.",
    audienceBadge: "Who it is for",
    audienceTitle: "Eduka adapts to different learning center formats",
    aud1: "Language centers",
    aud1Text: "Control groups, levels, attendance and monthly payments in one system.",
    aud2: "IT academies",
    aud2Text: "Track modules, mentors, projects and student progress in an organized way.",
    aud3: "Tutoring centers",
    aud3Text: "Simplify individual and group lessons, payment dates and parent communication.",
    aud4: "Multi-branch centers",
    aud4Text: "See revenue, debt and group performance separately for each branch.",
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
    workflowBadge: "Workflow",
    workflowTitle: "Everything is controlled from a new lead to student completion",
    w1: "Lead capture",
    w1Text: "Clients from Instagram, Telegram or phone calls do not get lost in sales.",
    w2: "Trial lesson",
    w2Text: "Trial lesson time, responsible manager and result are recorded in one place.",
    w3: "Add to group",
    w3Text: "The student is assigned to the right group, with schedule and payments visible automatically.",
    w4: "Track growth",
    w4Text: "Attendance, payments, ratings and reports show the center status close to real time.",
    gameBadge: "Gamification",
    gameTitle: "Motivate students with points, ratings and achievements",
    gameText: "Points, ratings, assignments and class activity can increase student motivation.",
    topGroup: "Top group",
    weekly: "Weekly activity",
    integrationBadge: "Integrations",
    integrationTitle: "Ready architecture for Telegram, SMS and payment systems",
    integrationText:
      "Demo requests already go to a Telegram group. Next, payment reminders, lesson notifications and parent messages can be automated.",
    pricingBadge: "Pricing",
    pricingTitle: "Eduka plans scale with your student count",
    billMonthly: "Monthly",
    bill3: "3 months",
    bill6: "6 months",
    bill12: "12 months",
    studentCount: "students",
    perMonth: "UZS / month",
    period3: "UZS / 3 months",
    period6: "UZS / 6 months - 10% off",
    period12: "UZS / 12 months - 16% off",
    popular: "Popular",
    choose: "Choose",
    custom: "Custom",
    enterprise: "for multi-branch centers",
    contact: "Contact us",
    pAttendance: "Attendance and groups",
    pPayments: "Payment control",
    pTelegram: "Telegram demo flow",
    pLeads: "Lead and sales pipeline",
    pReports: "Core reports",
    pSupport: "Onboarding help",
    pBranches: "Branch control",
    pCabinets: "Portals",
    pGame: "Gamification",
    pCustom: "Custom setup",
    pApi: "API and integrations",
    pManager: "Dedicated manager",
    compareFeature: "Feature",
    compareStudents: "Students and groups",
    compareAttendance: "Attendance CRM",
    compareLeads: "Lead pipeline",
    compareBranch: "Branches",
    compareManager: "Dedicated manager",
    roadmapBadge: "Why Eduka?",
    roadmapTitle: "Your learning center gets order, speed and clear control",
    rStep1: "01",
    rStep2: "02",
    rStep3: "03",
    rStep4: "04",
    r1: "Admin work gets easier",
    r1Text: "Students, groups, attendance and payment data live in one window.",
    r2: "Sales stays controlled",
    r2Text: "Leads, trial lessons and follow-ups move through a clear pipeline.",
    r3: "Leaders see the numbers",
    r3Text: "Track revenue, debt, branches and group performance through clear metrics.",
    r4: "The team works in one system",
    r4Text: "Teachers, admins and sales teams work with the same source of truth.",
    salesCta: "Get demo for my center",
    salesCta2: "Compare plans",
    supportBadge: "Support",
    supportTitle: "We help from setup to daily usage",
    sTelegram: "Fast Telegram contact",
    sTelegramText: "Demo requests, questions and ideas reach the sales group quickly.",
    sOnboarding: "Launch support",
    sOnboardingText: "We learn your center workflow and show the right plan and modules.",
    sSecurity: "Data control",
    sSecurityText: "A clear approach for roles, permissions and team access management.",
    nProject: "starting plan",
    nPartners: "first partners",
    nModules: "core modules",
    nLang: "languages",
    testimonialBadge: "Testimonials",
    testimonialTitle: "Learning centers organize their workflows with Eduka",
    t1: "\"Admins no longer search for payments, debts and attendance across separate lists.\"",
    t2: "\"Trial lesson leads do not disappear. Every client's next step is visible.\"",
    t3: "\"We needed an affordable CRM that is clear and can scale across branches. Eduka fits that need.\"",
    betaPartner: "Eduka partner",
    faqTitle: "Frequently asked questions",
    q1: "Who is Eduka for?",
    a1: "For learning centers, language schools, IT academies and course providers.",
    q2: "How long does it take to get a demo?",
    a2: "Fill the form and the sales team will contact you to show the right solution for your center.",
    q3: "What defines the price?",
    a3: "Plans are selected by student count and required modules. Start begins from 299,000 UZS.",
    q4: "Does Eduka work in three languages?",
    a4: "Yes, the landing works in UZ/RU/EN. The CRM interface is also being prepared for multilingual use.",
    finalBadge: "Start today",
    finalTitle: "Start organizing your learning center today",
    finalText:
      "Eduka brings learning center CRM, attendance CRM, payment control and process automation into one workspace.",
    finalButton: "Get free consultation",
    footerText: "Professional CRM for learning centers.",
    privacy: "Privacy",
    terms: "Terms",
    modalBadge: "Demo request",
    modalTitle: "Try Eduka in your center",
    modalText: "Leave your details. The request will be sent to the Eduka sales group.",
    sendDemo: "Send demo request",
    namePlaceholder: "Your name",
    centerPlaceholder: "Learning center name",
    studentsPlaceholder: "Student count",
    toastDemo: "Demo request sent. We will contact you soon.",
    toastDemoError: "Request was not sent. Please call us: +998 99 893 90 00.",
    toastLogin: "CRM portal is currently in private beta.",
    successTitle: "Your request is accepted",
    successText: "The Eduka sales team will contact you within 15 minutes and provide a free consultation.",
    successTelegram: "Open Telegram bot",
    betaBadge: "Closed beta",
    betaTitle: "CRM portal is currently in closed beta",
    betaText: "Login is open only for centers that received a demo and joined as beta partners.",
    betaButton: "Join beta list",
    toastLang: "language selected"
  }
};

const priceTable = {
  start: { 1: 299000, 3: 850000, 6: 1600000, 12: 3000000 },
  basic: { 1: 499000, 3: 1420000, 6: 2700000, 12: 5100000 },
  pro: { 1: 899000, 3: 2560000, 6: 4850000, 12: 9200000 }
};

let currentLang = localStorage.getItem("eduka-lang") || "uz";
let currentBilling = "1";
let toastTimer;
let countersPlayed = false;

function formatPrice(value) {
  return new Intl.NumberFormat("uz-UZ").format(value);
}

function periodKey(months) {
  if (months === "1") return "perMonth";
  if (months === "3") return "period3";
  if (months === "6") return "period6";
  return "period12";
}

function updatePrices(months = currentBilling) {
  currentBilling = months;
  document.querySelectorAll(".price-card[data-plan]").forEach((card) => {
    const plan = card.dataset.plan;
    const priceNode = card.querySelector("[data-price]");
    const periodNode = card.querySelector("[data-period]");

    if (!priceNode || !periodNode) return;

    if (plan === "premium") {
      priceNode.textContent = translations[currentLang].custom;
      periodNode.textContent = translations[currentLang].enterprise;
      return;
    }

    priceNode.textContent = formatPrice(priceTable[plan][months]);
    periodNode.textContent = translations[currentLang][periodKey(months)];
  });

  billingButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.billing === months);
  });
}

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
  const dictionary = translations[lang] || translations.uz;

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

  updatePrices(currentBilling);
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

function openSuccessModal() {
  if (!successModal) return;
  successModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeSuccessModal() {
  if (!successModal) return;
  successModal.hidden = true;
  document.body.style.overflow = "";
}

function openLoginModal() {
  if (!loginModal) return;
  loginModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLoginModal() {
  if (!loginModal) return;
  loginModal.hidden = true;
  document.body.style.overflow = "";
}

function closeAllModals() {
  closeModal();
  closeSuccessModal();
  closeLoginModal();
}

function playCounters() {
  if (countersPlayed) return;
  countersPlayed = true;

  document.querySelectorAll("[data-count]").forEach((node) => {
    const target = Number(node.dataset.count);
    const suffix = target === 8 ? "+" : "";
    const startedAt = performance.now();

    function tick(now) {
      const progress = Math.min((now - startedAt) / 1000, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = `${Math.round(target * eased)}${suffix}`;

      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
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
  button.addEventListener("click", () => {
    closeLoginModal();
    openModal();
  });
});

document.querySelector("[data-open-login]")?.addEventListener("click", () => {
  openLoginModal();
});

document.querySelector("[data-close-modal]")?.addEventListener("click", closeModal);
document.querySelector("[data-close-success]")?.addEventListener("click", closeSuccessModal);
document.querySelector("[data-close-login]")?.addEventListener("click", closeLoginModal);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

successModal?.addEventListener("click", (event) => {
  if (event.target === successModal) closeSuccessModal();
});

loginModal?.addEventListener("click", (event) => {
  if (event.target === loginModal) closeLoginModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAllModals();
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang);
    showToast(`${button.textContent} ${translations[currentLang].toastLang}`);
  });
});

billingButtons.forEach((button) => {
  button.addEventListener("click", () => updatePrices(button.dataset.billing));
});

modalForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = modalForm.querySelector("button[type='submit']");
  const formData = new FormData(modalForm);

  submitButton.disabled = true;
  modalForm.classList.remove("sent");

  try {
    const response = await fetch("/api/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        phone: formData.get("phone"),
        center: formData.get("center"),
        students: formData.get("students"),
        lang: currentLang
      })
    });

    if (!response.ok) throw new Error("Request failed");

    modalForm.classList.add("sent");
    showToast(translations[currentLang].toastDemo);
    window.setTimeout(() => {
      modalForm.reset();
      closeModal();
      modalForm.classList.remove("sent");
      openSuccessModal();
    }, 650);
  } catch {
    showToast(translations[currentLang].toastDemoError);
  } finally {
    submitButton.disabled = false;
  }
});

const revealTargets = document.querySelectorAll(
  ".partner-section, .problem-section, .section-block, .audience-section, .split-section, .workflow-section, .integration-section, .roadmap-section, .numbers-section, .testimonial-section, .faq-section, .final-cta-section"
);

revealTargets.forEach((target) => target.classList.add("reveal"));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      if (entry.target.classList.contains("numbers-section")) playCounters();
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.14 }
);

revealTargets.forEach((target) => revealObserver.observe(target));
