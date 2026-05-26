
(function(){
  const translations = {
"Kimlar uchun?": {"en": "Who is it for?", "ru": "Для кого?"},
"EDUKA turli ta’lim bizneslari uchun moslashadi": {"en": "EDUKA adapts to different education businesses", "ru": "EDUKA подходит для разных образовательных бизнесов"},
"O‘quv markazingiz qaysi yo‘nalishda bo‘lishidan qat’i nazar, boshqaruv, to‘lov, dars jadvali va hisobotlar bir joyda ishlaydi.": {"en": "No matter your center’s direction, management, payments, schedules, and reports work in one place.", "ru": "Независимо от направления вашего центра, управление, платежи, расписание и отчёты работают в одном месте."},
"O‘quv markazlar": {"en": "Learning centers", "ru": "Учебные центры"},
"IT akademiyalar": {"en": "IT academies", "ru": "IT-академии"},
"Til kurslari": {"en": "Language courses", "ru": "Языковые курсы"},
"Filialli markazlar": {"en": "Multi-branch centers", "ru": "Центры с филиалами"},
"Online kurslar": {"en": "Online courses", "ru": "Онлайн-курсы"},
"Repititor jamoalari": {"en": "Tutor teams", "ru": "Команды репетиторов"},
"Avtomatlashtirish": {"en": "Automation", "ru": "Автоматизация"},
"EDUKA bilan nima avtomatlashadi?": {"en": "What does EDUKA automate?", "ru": "Что автоматизирует EDUKA?"},
"Qo‘lda bajariladigan takroriy ishlarni kamaytiring, xatolarni qisqartiring va boshqaruvni real vaqt rejimida nazorat qiling.": {"en": "Reduce repetitive manual work, minimize errors, and control management in real time.", "ru": "Сократите ручную работу, уменьшите ошибки и контролируйте управление в реальном времени."},
"O‘quvchilar bazasi": {"en": "Student database", "ru": "База учеников"},
"Qarzdorlik": {"en": "Debts", "ru": "Задолженность"},
"Davomat": {"en": "Attendance", "ru": "Посещаемость"},
"Ustozlar": {"en": "Teachers", "ru": "Преподаватели"},
"Lidlar": {"en": "Leads", "ru": "Лиды"},
"Hisobotlar": {"en": "Reports", "ru": "Отчёты"},
"Telegram xabarnomalar": {"en": "Telegram notifications", "ru": "Telegram-уведомления"},
"Ishga tushirish": {"en": "Launch process", "ru": "Запуск"},
"CRM qanday ishga tushadi?": {"en": "How is the CRM launched?", "ru": "Как запускается CRM?"},
"Markazingizni tizimga ulash jarayoni sodda, tez va bosqichma-bosqich amalga oshiriladi.": {"en": "Connecting your center to the system is simple, fast, and step-by-step.", "ru": "Подключение вашего центра проходит просто, быстро и поэтапно."},
"Demo qoldirasiz": {"en": "You submit a demo request", "ru": "Вы оставляете заявку на демо"},
"Menejer bog‘lanadi": {"en": "A manager contacts you", "ru": "Менеджер связывается с вами"},
"Tizim sozlanadi": {"en": "The system is configured", "ru": "Система настраивается"},
"Xodimlar o‘rgatiladi": {"en": "Staff are trained", "ru": "Сотрудники обучаются"},
"CRM ishga tushadi": {"en": "CRM goes live", "ru": "CRM запускается"},
"CRM ko‘rinishlari": {"en": "CRM previews", "ru": "Виды CRM"},
"EDUKA ichki paneli qanday ko‘rinadi?": {"en": "What does the EDUKA internal panel look like?", "ru": "Как выглядит внутренняя панель EDUKA?"},
"Boshqaruv paneli": {"en": "Dashboard", "ru": "Панель управления"},
"To‘lovlar": {"en": "Payments", "ru": "Платежи"},
"Ishonch va xavfsizlik": {"en": "Trust and security", "ru": "Доверие и безопасность"},
"Ma’lumotlaringiz xavfsiz va nazorat ostida": {"en": "Your data is secure and under control", "ru": "Ваши данные защищены и под контролем"},
"Rollar bo‘yicha kirish": {"en": "Role-based access", "ru": "Доступ по ролям"},
"Ma’lumotlar tartibi": {"en": "Structured data", "ru": "Структура данных"},
"Xabarnomalar": {"en": "Notifications", "ru": "Уведомления"},
"O‘quv markazingizni EDUKA bilan avtomatlashtiring": {"en": "Automate your learning center with EDUKA", "ru": "Автоматизируйте учебный центр с EDUKA"},
"Demo qoldiring — menejer siz bilan bog‘lanib, markazingizga mos CRM yechimni tushuntirib beradi.": {"en": "Leave a demo request — a manager will contact you and explain the CRM solution that fits your center.", "ru": "Оставьте заявку на демо — менеджер свяжется с вами и объяснит CRM-решение под ваш центр."},
"Sahifalar": {"en": "Pages", "ru": "Страницы"},
"EDUKA — ta’lim markazlari uchun yaratilgan zamonaviy va professional CRM platforma.": {"en": "EDUKA is a modern and professional CRM platform created for education centers.", "ru": "EDUKA — современная профессиональная CRM-платформа для учебных центров."},
"Ijtimoiy tarmoqlar": {"en": "Social media", "ru": "Социальные сети"},
"Qo‘llab-quvvatlash": {"en": "Support", "ru": "Поддержка"},
"Barcha huquqlar himoyalangan.": {"en": "All rights reserved.", "ru": "Все права защищены."},
"Foydalanish shartlari": {"en": "Terms of use", "ru": "Условия использования"},
"Maxfiylik siyosati": {"en": "Privacy policy", "ru": "Политика конфиденциальности"},
"EDUKA raqamlarda": {"en": "EDUKA in numbers", "ru": "EDUKA в цифрах"},
"EDUKA foydalanuvchilari raqamlarda": {"en": "EDUKA users in numbers", "ru": "Пользователи EDUKA в цифрах"},
"O‘quv markazlari, filiallar, guruhlar va o‘quvchilar uchun yagona zamonaviy boshqaruv platformasi.": {"en": "A unified modern management platform for learning centers, branches, groups, and students.", "ru": "Единая современная платформа управления для учебных центров, филиалов, групп и учеников."},
"O‘quv markazlari": {"en": "Learning centers", "ru": "Учебные центры"},
"Filiallar": {"en": "Branches", "ru": "Филиалы"},
"Guruhlar": {"en": "Groups", "ru": "Группы"},
"O‘quvchilar": {"en": "Students", "ru": "Ученики"},
  "O‘quv markazingizni yangi bosqichga olib chiqing!": {
    "en": "Take your learning center to the next level!",
    "ru": "Выведите свой учебный центр на новый уровень!"
  },
  "EDUKA — o‘quv markazlari uchun yaratilgan zamonaviy CRM va avtomatlashtirish platformasi. Jarayonlarni soddalashtiring, savdoni oshiring va o‘quvchilarga ajoyib tajriba taqdim eting.": {
    "en": "EDUKA is a modern CRM and automation platform built for learning centers. Simplify processes, increase sales, and deliver a better student experience.",
    "ru": "EDUKA — современная CRM и платформа автоматизации для учебных центров. Упрощайте процессы, увеличивайте продажи и создавайте лучший опыт для учеников."
  },
  "Hozir sinab ko‘ring — 7 kun bepul!": {
    "en": "Try now — 7 days free!",
    "ru": "Попробуйте сейчас — 7 дней бесплатно!"
  },
  "Sotuv bo‘limi": {
    "en": "Sales department",
    "ru": "Отдел продаж"
  },
  "Xavfsiz va ishonchli": {
    "en": "Safe and reliable",
    "ru": "Безопасно и надежно"
  },
  "Tez va samarali": {
    "en": "Fast and efficient",
    "ru": "Быстро и эффективно"
  },
  "Ma’lumotga asoslangan": {
    "en": "Data-driven",
    "ru": "На основе данных"
  },
  "O‘quv markazlarining ishonchli hamkori": {
    "en": "A trusted partner for learning centers",
    "ru": "Надёжный партнёр учебных центров"
  },
  "Minglab o‘quv markazlari bizga ishonadi. Ularning o‘sishi va muvaffaqiyatida texnologiyamiz doimiy hamroh.": {
    "en": "Thousands of learning centers trust us. Our technology supports their growth and success every day.",
    "ru": "Нам доверяют тысячи учебных центров. Наши технологии помогают им расти и добиваться успеха."
  },
  "Muammolarni unuting!": {
    "en": "Forget the problems!",
    "ru": "Забудьте о проблемах!"
  },
  "Barcha jarayonlarni tartibga soling": {
    "en": "Organize every process",
    "ru": "Организуйте все процессы"
  },
  "O‘quvchi sonini bir necha barobar oshiring": {
    "en": "Grow your student numbers faster",
    "ru": "Увеличьте количество учеников в несколько раз"
  },
  "O‘quvchilarni baholang va taqqoslang": {
    "en": "Evaluate and compare students",
    "ru": "Оценивайте и сравнивайте учеников"
  },
  "Vazifalarni rejalashtiring va nazorat qiling": {
    "en": "Plan and track tasks",
    "ru": "Планируйте и контролируйте задачи"
  },
  "Zamonaviy texnologiyalar bilan yanada qulayroq": {
    "en": "More convenient with modern technologies",
    "ru": "Удобнее с современными технологиями"
  },
  "Moliyani oson boshqaring": {
    "en": "Manage finances easily",
    "ru": "Управляйте финансами легко"
  },
  "Ta’lim biznesingizni istalgan joydan boshqaring": {
    "en": "Manage your education business from anywhere",
    "ru": "Управляйте образовательным бизнесом из любой точки"
  },
  "Talaba va ustozlar uchun zamonaviy ilovalar": {
    "en": "Modern apps for students and teachers",
    "ru": "Современные приложения для учеников и преподавателей"
  },
  "Moslashuvchan va ishonchli hisob-kitob": {
    "en": "Flexible and reliable billing",
    "ru": "Гибкие и надежные расчёты"
  },
  "Markazingizga mos eng qulay to‘lov tizimini tanlang. Turli to‘lov davrlarida o‘quvchilardan to‘lov qabul qiling va moliyaviy jarayonlarni soddalashtiring.": {
    "en": "Choose the most convenient payment system for your center. Accept payments in different cycles and simplify financial workflows.",
    "ru": "Выберите удобную систему оплаты для вашего центра. Принимайте платежи в разных периодах и упрощайте финансовые процессы."
  },
  "Oylik (Kalendar)": {
    "en": "Monthly (Calendar)",
    "ru": "Ежемесячно (Календарь)"
  },
  "Kunlik": {
    "en": "Daily",
    "ru": "Ежедневно"
  },
  "Modul": {
    "en": "Module",
    "ru": "Модуль"
  },
  "Guruh boshlanish sanasi": {
    "en": "Group start date",
    "ru": "Дата начала группы"
  },
  "Kurs uchun to‘lov": {
    "en": "Course payment",
    "ru": "Оплата за курс"
  },
  "Individual": {
    "en": "Individual",
    "ru": "Индивидуально"
  },
  "Ko‘p beriladigan savollar": {
    "en": "Frequently asked questions",
    "ru": "Часто задаваемые вопросы"
  },
  "EDUKA nima va u qanday ishlaydi?": {
    "en": "What is EDUKA and how does it work?",
    "ru": "Что такое EDUKA и как она работает?"
  },
  "EDUKA’ni foydalanish uchun texnik talablar bormi?": {
    "en": "Are there technical requirements to use EDUKA?",
    "ru": "Есть ли технические требования для использования EDUKA?"
  },
  "Ma’lumotlarim xavfsizligi qanday ta’minlanadi?": {
    "en": "How is my data security ensured?",
    "ru": "Как обеспечивается безопасность моих данных?"
  },
  "To‘lovlar va tariflar qanday ishlaydi?": {
    "en": "How do payments and tariffs work?",
    "ru": "Как работают платежи и тарифы?"
  },
  "EDUKA’da ma’lumotlarni import qilish mumkinmi?": {
    "en": "Can I import data into EDUKA?",
    "ru": "Можно ли импортировать данные в EDUKA?"
  },
  "Narxlar": {
    "en": "Pricing",
    "ru": "Цены"
  },
  "Qo‘llab-quvvatlash": {
    "en": "Support",
    "ru": "Поддержка"
  },
  "Vakansiyalar": {
    "en": "Vacancies",
    "ru": "Вакансии"
  },
  "Demo olish": {
    "en": "Get a demo",
    "ru": "Получить демо"
  },
  "Tarif": {
    "en": "Plan",
    "ru": "Тариф"
  },
  "Start": {
    "en": "Start",
    "ru": "Start"
  },
  "Basic": {
    "en": "Basic",
    "ru": "Basic"
  },
  "Pro": {
    "en": "Pro",
    "ru": "Pro"
  },
  "Premium": {
    "en": "Premium",
    "ru": "Premium"
  },
  "0–100 ta o‘quvchi": {
    "en": "0–100 students",
    "ru": "0–100 учеников"
  },
  "100–300 ta o‘quvchi": {
    "en": "100–300 students",
    "ru": "100–300 учеников"
  },
  "300–1000 ta o‘quvchi": {
    "en": "300–1000 students",
    "ru": "300–1000 учеников"
  },
  "1000+ o‘quvchi": {
    "en": "1000+ students",
    "ru": "1000+ учеников"
  },
  "3 oy": {
    "en": "3 months",
    "ru": "3 месяца"
  },
  "6 oy": {
    "en": "6 months",
    "ru": "6 месяцев"
  },
  "9 oy": {
    "en": "9 months",
    "ru": "9 месяцев"
  },
  "12 oy": {
    "en": "12 months",
    "ru": "12 месяцев"
  },
  "Platforma uchun to‘lov": {
    "en": "Platform payment",
    "ru": "Оплата платформы"
  },
  "Xavfsiz va qulay to‘lov — bir necha bosqichda yakunlang": {
    "en": "Safe and convenient payment — completed in a few steps",
    "ru": "Безопасная и удобная оплата — в несколько шагов"
  },
  "To‘lov qilish": {
    "en": "Make payment",
    "ru": "Оплатить"
  },
  "9 oylik tarifda +1 oy bonus": {
    "en": "+1 bonus month with the 9-month plan",
    "ru": "+1 месяц бонусом при тарифе на 9 месяцев"
  },
  "12 oylik tarifda +2 oy bonus": {
    "en": "+2 bonus months with the 12-month plan",
    "ru": "+2 месяца бонусом при тарифе на 12 месяцев"
  },
  "Gamification moduli": {
    "en": "Gamification module",
    "ru": "Модуль геймификации"
  },
  "O‘quvchilarning motivatsiyasini oshirish uchun maxsus modul. Har oy 150 000 so‘m.": {
    "en": "A special module to increase student motivation. 150,000 UZS per month.",
    "ru": "Специальный модуль для повышения мотивации учеников. 150 000 сум в месяц."
  },
  "Batafsil ma’lumot": {
    "en": "More details",
    "ru": "Подробнее"
  },
  "EDUKA Gamification": {
    "en": "EDUKA Gamification",
    "ru": "Геймификация EDUKA"
  },
  "O‘quv jarayonini qiziqarli va samarali qiling. O‘quvchilar uchun coin, reyting va real mukofot tizimini ishga tushiring.": {
    "en": "Make learning more engaging and effective. Launch coins, rankings, and real rewards for students.",
    "ru": "Сделайте обучение интереснее и эффективнее. Запустите монеты, рейтинги и реальные награды для учеников."
  },
  "Ko‘rish": {
    "en": "View",
    "ru": "Смотреть"
  },
  "Asosiy xususiyatlar": {
    "en": "Key features",
    "ru": "Основные возможности"
  },
  "O‘quvchilarning qiziqishini oshirish uchun EDUKA’ga mos zamonaviy tizim": {
    "en": "A modern system for EDUKA to increase student engagement",
    "ru": "Современная система EDUKA для повышения интереса учеников"
  },
  "Zamonaviy gamification tizimi": {
    "en": "Modern gamification system",
    "ru": "Современная система геймификации"
  },
  "Coin, reyting, badge va mukofotlar orqali o‘quvchilarni darslarga faolroq jalb qiling.": {
    "en": "Use coins, rankings, badges, and rewards to make students more active in lessons.",
    "ru": "Используйте монеты, рейтинги, бейджи и награды, чтобы повысить активность учеников."
  },
  "Sarafan marketing": {
    "en": "Word-of-mouth marketing",
    "ru": "Сарафанный маркетинг"
  },
  "Do‘stini olib kelgan o‘quvchiga bonus coin berib, markazingizga tabiiy reklama oqimini yarating.": {
    "en": "Give bonus coins to students who bring friends and create organic promotion for your center.",
    "ru": "Давайте бонусные монеты ученикам, которые приводят друзей, и создавайте естественную рекламу центра."
  },
  "Motivatsiyani oshirish": {
    "en": "Increase motivation",
    "ru": "Повышение мотивации"
  },
  "Davomat, baho va uyga vazifa natijalari asosida coin berib, o‘quvchilarni rag‘batlantiring.": {
    "en": "Reward students with coins based on attendance, grades, and homework results.",
    "ru": "Мотивируйте учеников монетами за посещаемость, оценки и домашние задания."
  },
  "Mukofot tizimi": {
    "en": "Reward system",
    "ru": "Система наград"
  },
  "Ichki shop orqali o‘quvchilar coin evaziga real sovg‘alar yoki bonuslarga ega bo‘lishadi.": {
    "en": "Students can exchange coins for real gifts or bonuses through the internal shop.",
    "ru": "Ученики могут обменивать монеты на реальные подарки или бонусы во внутреннем магазине."
  },
  "Ichki do‘kon": {
    "en": "Internal shop",
    "ru": "Внутренний магазин"
  },
  "Markaz brendi tushirilgan mahsulotlar, kuponlar va sovg‘alarni tizimga joylang.": {
    "en": "Add branded products, coupons, and gifts to the system.",
    "ru": "Добавляйте брендированные товары, купоны и подарки в систему."
  },
  "Moslashuvchan boshqaruv": {
    "en": "Flexible management",
    "ru": "Гибкое управление"
  },
  "Coin qiymati, qoidalar, shop va bonuslarni har bir markaz ehtiyojiga mos sozlang.": {
    "en": "Configure coin values, rules, shop items, and bonuses for each center’s needs.",
    "ru": "Настраивайте стоимость монет, правила, магазин и бонусы под потребности каждого центра."
  },
  "Gamification modulini yoqing": {
    "en": "Enable the gamification module",
    "ru": "Подключите модуль геймификации"
  },
  "EDUKA bilan o‘quvchilarga faqat dars emas, qiziqarli tajriba bering.": {
    "en": "With EDUKA, give students not just lessons, but an engaging experience.",
    "ru": "С EDUKA давайте ученикам не только уроки, но и увлекательный опыт."
  },
  "Narxlarni ko‘rish": {
    "en": "View pricing",
    "ru": "Посмотреть цены"
  },
  "EDUKA Careers": {
    "en": "EDUKA Careers",
    "ru": "Карьера в EDUKA"
  },
  "EDUKA jamoasiga qo‘shiling va ta’lim texnologiyalarini rivojlantirishda ishtirok eting.": {
    "en": "Join the EDUKA team and take part in developing education technologies.",
    "ru": "Присоединяйтесь к команде EDUKA и участвуйте в развитии образовательных технологий."
  },
  "Sotuv menejeri": {
    "en": "Sales manager",
    "ru": "Менеджер по продажам"
  },
  "Toshkent": {
    "en": "Tashkent",
    "ru": "Ташкент"
  },
  "Offline": {
    "en": "Offline",
    "ru": "Офлайн"
  },
  "Ariza qoldirish": {
    "en": "Apply now",
    "ru": "Оставить заявку"
  },
  "Til talablari:": {
    "en": "Language requirements:",
    "ru": "Требования к языкам:"
  },
  "O‘zbek tili": {
    "en": "Uzbek language",
    "ru": "Узбекский язык"
  },
  "Rus tili (majburiy)": {
    "en": "Russian language (required)",
    "ru": "Русский язык (обязательно)"
  },
  "EDUKA jamoasiga tajribali va kommunikabel sotuv menejerini qidirmoqdamiz. Siz o‘quv markazlari bilan ishlaysiz va ularga EDUKA CRM platformasini taqdim etasiz.": {
    "en": "We are looking for an experienced and communicative sales manager for the EDUKA team. You will work with learning centers and present the EDUKA CRM platform to them.",
    "ru": "Мы ищем опытного и коммуникабельного менеджера по продажам в команду EDUKA. Вы будете работать с учебными центрами и презентовать им CRM-платформу EDUKA."
  },
  "Vazifalar:": {
    "en": "Responsibilities:",
    "ru": "Обязанности:"
  },
  "Talablar:": {
    "en": "Requirements:",
    "ru": "Требования:"
  },
  "Yangi mijozlarni izlash va ular bilan aloqa o‘rnatish": {
    "en": "Find new clients and establish contact",
    "ru": "Поиск новых клиентов и установление контакта"
  },
  "O‘quv markazlariga EDUKA CRM platformasini taqdim etish": {
    "en": "Present the EDUKA CRM platform to learning centers",
    "ru": "Презентация CRM-платформы EDUKA учебным центрам"
  },
  "Mijozlar bilan muzokaralar olib borish va shartnomalar tuzish": {
    "en": "Negotiate with clients and sign contracts",
    "ru": "Переговоры с клиентами и заключение договоров"
  },
  "CRM tizimida mijozlar bazasini yuritish": {
    "en": "Maintain the client database in the CRM system",
    "ru": "Ведение клиентской базы в CRM-системе"
  },
  "Oylik sotuv rejalarini bajarish": {
    "en": "Meet monthly sales targets",
    "ru": "Выполнение ежемесячных планов продаж"
  },
  "Mijozlar bilan uzoq muddatli munosabatlarni rivojlantirish": {
    "en": "Develop long-term relationships with clients",
    "ru": "Развитие долгосрочных отношений с клиентами"
  },
  "Sotuv sohasida kamida 1 yillik tajriba": {
    "en": "At least 1 year of sales experience",
    "ru": "Опыт в продажах не менее 1 года"
  },
  "Rus tilini yaxshi bilish (majburiy)": {
    "en": "Good knowledge of Russian (required)",
    "ru": "Хорошее знание русского языка (обязательно)"
  },
  "O‘zbek tilini bilish": {
    "en": "Knowledge of Uzbek",
    "ru": "Знание узбекского языка"
  },
  "Kommunikabellik va ishontirish qobiliyati": {
    "en": "Communication and persuasion skills",
    "ru": "Коммуникабельность и навыки убеждения"
  },
  "Natijaga yo‘naltirilganlik": {
    "en": "Result-oriented mindset",
    "ru": "Ориентация на результат"
  },
  "CRM tizimlari bilan ishlash tajribasi (afzallik)": {
    "en": "Experience with CRM systems (advantage)",
    "ru": "Опыт работы с CRM-системами (преимущество)"
  },
  "B2B sotuv tajribasi (afzallik)": {
    "en": "B2B sales experience (advantage)",
    "ru": "Опыт B2B-продаж (преимущество)"
  },
  "Biz taklif qilamiz:": {
    "en": "We offer:",
    "ru": "Мы предлагаем:"
  },
  "Raqobatbardosh ish haqi + bonuslar": {
    "en": "Competitive salary + bonuses",
    "ru": "Конкурентная зарплата + бонусы"
  },
  "Professional rivojlanish imkoniyatlari": {
    "en": "Professional growth opportunities",
    "ru": "Возможности профессионального развития"
  },
  "Zamonaviy ofis muhiti": {
    "en": "Modern office environment",
    "ru": "Современная офисная среда"
  },
  "Do‘stona jamoa": {
    "en": "Friendly team",
    "ru": "Дружная команда"
  },
  "Karyera o‘sishi imkoniyati": {
    "en": "Career growth opportunity",
    "ru": "Возможность карьерного роста"
  },
  "Ish haqi:": {
    "en": "Salary:",
    "ru": "Зарплата:"
  },
  "Kelishiladi (asosiy ish haqi + sotuv bonuslari)": {
    "en": "Negotiable (base salary + sales bonuses)",
    "ru": "По договорённости (оклад + бонусы за продажи)"
  },
  "Telegram orqali bog‘lanish": {
    "en": "Contact via Telegram",
    "ru": "Связаться через Telegram"
  },
  "Boshqa vakansiyalar hozircha yo‘q. Lekin siz o‘z rezyumeingizni": {
    "en": "There are no other vacancies at the moment. But you can send your resume to",
    "ru": "Других вакансий пока нет. Но вы можете отправить резюме на"
  },
  "ga yuborishingiz mumkin.": {
    "en": ".",
    "ru": "."
  },
  "O‘quv markazlari uchun professional CRM tizimi": {
    "en": "Professional CRM system for learning centers",
    "ru": "Профессиональная CRM-система для учебных центров"
  },
  "Biz haqimizda": {
    "en": "About us",
    "ru": "О нас"
  },
  "Bosh sahifa": {
    "en": "Home",
    "ru": "Главная"
  },
  "Resurslar": {
    "en": "Resources",
    "ru": "Ресурсы"
  },
  "Qo‘llanmalar": {
    "en": "Guides",
    "ru": "Руководства"
  },
  "Video darslar": {
    "en": "Video lessons",
    "ru": "Видеоуроки"
  },
  "API hujjatlari": {
    "en": "API docs",
    "ru": "API-документация"
  },
  "Kontaktlar": {
    "en": "Contacts",
    "ru": "Контакты"
  },
  "Ijtimoiy Tarmoqlar": {
    "en": "Social media",
    "ru": "Социальные сети"
  },
  "Toshkent, O‘zbekiston": {
    "en": "Tashkent, Uzbekistan",
    "ru": "Ташкент, Узбекистан"
  },
  "Ismingiz": {
    "en": "Your name",
    "ru": "Ваше имя"
  },
  "Ismingizni kiriting": {
    "en": "Enter your name",
    "ru": "Введите ваше имя"
  },
  "Markaz nomi": {
    "en": "Center name",
    "ru": "Название центра"
  },
  "Markaz nomini kiriting": {
    "en": "Enter center name",
    "ru": "Введите название центра"
  },
  "Telefon raqami": {
    "en": "Phone number",
    "ru": "Номер телефона"
  },
  "To‘lov rejimi": {
    "en": "Payment mode",
    "ru": "Режим оплаты"
  },
  "To‘lov rejimini tanlang": {
    "en": "Select payment mode",
    "ru": "Выберите режим оплаты"
  },
  "Parol": {
    "en": "Password",
    "ru": "Пароль"
  },
  "Kamida 8 ta belgi": {
    "en": "At least 8 characters",
    "ru": "Минимум 8 символов"
  },
  "Men": {
    "en": "I have read the",
    "ru": "Я прочитал(а)"
  },
  "Maxfiylik siyosatini": {
    "en": "Privacy Policy",
    "ru": "Политику конфиденциальности"
  },
  "o‘qib chiqdim va shaxsiy ma’lumotlarni qayta ishlashga roziman": {
    "en": "and agree to the processing of personal data",
    "ru": "и согласен(на) на обработку персональных данных"
  },
  "Adminga yuborildi": {
    "en": "Sent to admin",
    "ru": "Отправлено администратору"
  },
  "Arizangiz EDUKA admin paneliga qabul qilindi.": {
    "en": "Your request has been received in the EDUKA admin panel.",
    "ru": "Ваша заявка принята в админ-панель EDUKA."
  },
  "Menejerga yuborildi": {
    "en": "Sent to manager",
    "ru": "Отправлено менеджеру"
  },
  "Menejer tez orada siz bilan bog‘lanadi.": {
    "en": "A manager will contact you shortly.",
    "ru": "Менеджер скоро свяжется с вами."
  },
  "Yopish": {
    "en": "Close",
    "ru": "Закрыть"
  },
  "EDUKA yordam markazi": {
    "en": "EDUKA Help Center",
    "ru": "Центр помощи EDUKA"
  },
  "Real-time chat • Odatda 1–2 daqiqada javob": {
    "en": "Real-time chat • Usually replies in 1–2 minutes",
    "ru": "Онлайн-чат • Обычно отвечаем за 1–2 минуты"
  },
  "Assalomu alaykum 👋": {
    "en": "Hello 👋",
    "ru": "Здравствуйте 👋"
  },
  "Chatni boshlash uchun ismingiz va telefon raqamingizni qoldiring. Keyin savolingizni yuborishingiz mumkin.": {
    "en": "Leave your name and phone number to start the chat. Then you can send your question.",
    "ru": "Оставьте имя и номер телефона, чтобы начать чат. Затем вы сможете отправить вопрос."
  },
  "EDUKA narxlari haqida ma’lumot kerak": {
    "en": "I need information about EDUKA pricing",
    "ru": "Нужна информация о ценах EDUKA"
  },
  "Demo olishni xohlayman": {
    "en": "I want to get a demo",
    "ru": "Хочу получить демо"
  },
  "CRM imkoniyatlarini bilmoqchiman": {
    "en": "I want to learn about CRM features",
    "ru": "Хочу узнать о возможностях CRM"
  },
  "Chatni boshlash": {
    "en": "Start chat",
    "ru": "Начать чат"
  },
  "Xabaringizni yozing...": {
    "en": "Write your message...",
    "ru": "Напишите сообщение..."
  },
  "Narxlar qanday?": {
    "en": "What are the prices?",
    "ru": "Какие цены?"
  },
  "Demo olish mumkinmi?": {
    "en": "Can I get a demo?",
    "ru": "Можно получить демо?"
  },
  "Telegram bot integratsiyasi bormi?": {
    "en": "Is there Telegram bot integration?",
    "ru": "Есть интеграция с Telegram-ботом?"
  },
  "O'quv markazingizni yangi bosqichga olib chiqing!": {
    "en": "Take your learning center to the next level!",
    "ru": "Выведите свой учебный центр на новый уровень!"
  },
  "EDUKA — o'quv markazlari uchun yaratilgan zamonaviy CRM va avtomatlashtirish platformasi. Jarayonlarni soddalashtiring, savdoni oshiring va o'quvchilarga ajoyib tajriba taqdim eting.": {
    "en": "EDUKA is a modern CRM and automation platform built for learning centers. Simplify processes, increase sales, and deliver a better student experience.",
    "ru": "EDUKA — современная CRM и платформа автоматизации для учебных центров. Упрощайте процессы, увеличивайте продажи и создавайте лучший опыт для учеников."
  },
  "Hozir sinab ko'ring — 7 kun bepul!": {
    "en": "Try now — 7 days free!",
    "ru": "Попробуйте сейчас — 7 дней бесплатно!"
  },
  "Sotuv bo'limi": {
    "en": "Sales department",
    "ru": "Отдел продаж"
  },
  "Ma'lumotga asoslangan": {
    "en": "Data-driven",
    "ru": "На основе данных"
  },
  "O'quv markazlarining ishonchli hamkori": {
    "en": "A trusted partner for learning centers",
    "ru": "Надёжный партнёр учебных центров"
  },
  "Minglab o'quv markazlari bizga ishonadi. Ularning o'sishi va muvaffaqiyatida texnologiyamiz doimiy hamroh.": {
    "en": "Thousands of learning centers trust us. Our technology supports their growth and success every day.",
    "ru": "Нам доверяют тысячи учебных центров. Наши технологии помогают им расти и добиваться успеха."
  },
  "O'quvchi sonini bir necha barobar oshiring": {
    "en": "Grow your student numbers faster",
    "ru": "Увеличьте количество учеников в несколько раз"
  },
  "O'quvchilarni baholang va taqqoslang": {
    "en": "Evaluate and compare students",
    "ru": "Оценивайте и сравнивайте учеников"
  },
  "Ta'lim biznesingizni istalgan joydan boshqaring": {
    "en": "Manage your education business from anywhere",
    "ru": "Управляйте образовательным бизнесом из любой точки"
  },
  "Markazingizga mos eng qulay to'lov tizimini tanlang. Turli to'lov davrlarida o'quvchilardan to'lov qabul qiling va moliyaviy jarayonlarni soddalashtiring.": {
    "en": "Choose the most convenient payment system for your center. Accept payments in different cycles and simplify financial workflows.",
    "ru": "Выберите удобную систему оплаты для вашего центра. Принимайте платежи в разных периодах и упрощайте финансовые процессы."
  },
  "Kurs uchun to'lov": {
    "en": "Course payment",
    "ru": "Оплата за курс"
  },
  "Ko'p beriladigan savollar": {
    "en": "Frequently asked questions",
    "ru": "Часто задаваемые вопросы"
  },
  "EDUKA'ni foydalanish uchun texnik talablar bormi?": {
    "en": "Are there technical requirements to use EDUKA?",
    "ru": "Есть ли технические требования для использования EDUKA?"
  },
  "Ma'lumotlarim xavfsizligi qanday ta'minlanadi?": {
    "en": "How is my data security ensured?",
    "ru": "Как обеспечивается безопасность моих данных?"
  },
  "To'lovlar va tariflar qanday ishlaydi?": {
    "en": "How do payments and tariffs work?",
    "ru": "Как работают платежи и тарифы?"
  },
  "EDUKA'da ma'lumotlarni import qilish mumkinmi?": {
    "en": "Can I import data into EDUKA?",
    "ru": "Можно ли импортировать данные в EDUKA?"
  },
  "Qo'llab-quvvatlash": {
    "en": "Support",
    "ru": "Поддержка"
  },
  "0–100 ta o'quvchi": {
    "en": "0–100 students",
    "ru": "0–100 учеников"
  },
  "100–300 ta o'quvchi": {
    "en": "100–300 students",
    "ru": "100–300 учеников"
  },
  "300–1000 ta o'quvchi": {
    "en": "300–1000 students",
    "ru": "300–1000 учеников"
  },
  "1000+ o'quvchi": {
    "en": "1000+ students",
    "ru": "1000+ учеников"
  },
  "Platforma uchun to'lov": {
    "en": "Platform payment",
    "ru": "Оплата платформы"
  },
  "Xavfsiz va qulay to'lov — bir necha bosqichda yakunlang": {
    "en": "Safe and convenient payment — completed in a few steps",
    "ru": "Безопасная и удобная оплата — в несколько шагов"
  },
  "To'lov qilish": {
    "en": "Make payment",
    "ru": "Оплатить"
  },
  "O'quvchilarning motivatsiyasini oshirish uchun maxsus modul. Har oy 150 000 so'm.": {
    "en": "A special module to increase student motivation. 150,000 UZS per month.",
    "ru": "Специальный модуль для повышения мотивации учеников. 150 000 сум в месяц."
  },
  "Batafsil ma'lumot": {
    "en": "More details",
    "ru": "Подробнее"
  },
  "O'quv jarayonini qiziqarli va samarali qiling. O'quvchilar uchun coin, reyting va real mukofot tizimini ishga tushiring.": {
    "en": "Make learning more engaging and effective. Launch coins, rankings, and real rewards for students.",
    "ru": "Сделайте обучение интереснее и эффективнее. Запустите монеты, рейтинги и реальные награды для учеников."
  },
  "Ko'rish": {
    "en": "View",
    "ru": "Смотреть"
  },
  "O'quvchilarning qiziqishini oshirish uchun EDUKA'ga mos zamonaviy tizim": {
    "en": "A modern system for EDUKA to increase student engagement",
    "ru": "Современная система EDUKA для повышения интереса учеников"
  },
  "Coin, reyting, badge va mukofotlar orqali o'quvchilarni darslarga faolroq jalb qiling.": {
    "en": "Use coins, rankings, badges, and rewards to make students more active in lessons.",
    "ru": "Используйте монеты, рейтинги, бейджи и награды, чтобы повысить активность учеников."
  },
  "Do'stini olib kelgan o'quvchiga bonus coin berib, markazingizga tabiiy reklama oqimini yarating.": {
    "en": "Give bonus coins to students who bring friends and create organic promotion for your center.",
    "ru": "Давайте бонусные монеты ученикам, которые приводят друзей, и создавайте естественную рекламу центра."
  },
  "Davomat, baho va uyga vazifa natijalari asosida coin berib, o'quvchilarni rag'batlantiring.": {
    "en": "Reward students with coins based on attendance, grades, and homework results.",
    "ru": "Мотивируйте учеников монетами за посещаемость, оценки и домашние задания."
  },
  "Ichki shop orqali o'quvchilar coin evaziga real sovg'alar yoki bonuslarga ega bo'lishadi.": {
    "en": "Students can exchange coins for real gifts or bonuses through the internal shop.",
    "ru": "Ученики могут обменивать монеты на реальные подарки или бонусы во внутреннем магазине."
  },
  "Ichki do'kon": {
    "en": "Internal shop",
    "ru": "Внутренний магазин"
  },
  "Markaz brendi tushirilgan mahsulotlar, kuponlar va sovg'alarni tizimga joylang.": {
    "en": "Add branded products, coupons, and gifts to the system.",
    "ru": "Добавляйте брендированные товары, купоны и подарки в систему."
  },
  "EDUKA bilan o'quvchilarga faqat dars emas, qiziqarli tajriba bering.": {
    "en": "With EDUKA, give students not just lessons, but an engaging experience.",
    "ru": "С EDUKA давайте ученикам не только уроки, но и увлекательный опыт."
  },
  "Narxlarni ko'rish": {
    "en": "View pricing",
    "ru": "Посмотреть цены"
  },
  "EDUKA jamoasiga qo'shiling va ta'lim texnologiyalarini rivojlantirishda ishtirok eting.": {
    "en": "Join the EDUKA team and take part in developing education technologies.",
    "ru": "Присоединяйтесь к команде EDUKA и участвуйте в развитии образовательных технологий."
  },
  "O'zbek tili": {
    "en": "Uzbek language",
    "ru": "Узбекский язык"
  },
  "EDUKA jamoasiga tajribali va kommunikabel sotuv menejerini qidirmoqdamiz. Siz o'quv markazlari bilan ishlaysiz va ularga EDUKA CRM platformasini taqdim etasiz.": {
    "en": "We are looking for an experienced and communicative sales manager for the EDUKA team. You will work with learning centers and present the EDUKA CRM platform to them.",
    "ru": "Мы ищем опытного и коммуникабельного менеджера по продажам в команду EDUKA. Вы будете работать с учебными центрами и презентовать им CRM-платформу EDUKA."
  },
  "Yangi mijozlarni izlash va ular bilan aloqa o'rnatish": {
    "en": "Find new clients and establish contact",
    "ru": "Поиск новых клиентов и установление контакта"
  },
  "O'quv markazlariga EDUKA CRM platformasini taqdim etish": {
    "en": "Present the EDUKA CRM platform to learning centers",
    "ru": "Презентация CRM-платформы EDUKA учебным центрам"
  },
  "O'zbek tilini bilish": {
    "en": "Knowledge of Uzbek",
    "ru": "Знание узбекского языка"
  },
  "Natijaga yo'naltirilganlik": {
    "en": "Result-oriented mindset",
    "ru": "Ориентация на результат"
  },
  "Do'stona jamoa": {
    "en": "Friendly team",
    "ru": "Дружная команда"
  },
  "Karyera o'sishi imkoniyati": {
    "en": "Career growth opportunity",
    "ru": "Возможность карьерного роста"
  },
  "Telegram orqali bog'lanish": {
    "en": "Contact via Telegram",
    "ru": "Связаться через Telegram"
  },
  "Boshqa vakansiyalar hozircha yo'q. Lekin siz o'z rezyumeingizni": {
    "en": "There are no other vacancies at the moment. But you can send your resume to",
    "ru": "Других вакансий пока нет. Но вы можете отправить резюме на"
  },
  "O'quv markazlari uchun professional CRM tizimi": {
    "en": "Professional CRM system for learning centers",
    "ru": "Профессиональная CRM-система для учебных центров"
  },
  "Qo'llanmalar": {
    "en": "Guides",
    "ru": "Руководства"
  },
  "Toshkent, O'zbekiston": {
    "en": "Tashkent, Uzbekistan",
    "ru": "Ташкент, Узбекистан"
  },
  "To'lov rejimi": {
    "en": "Payment mode",
    "ru": "Режим оплаты"
  },
  "To'lov rejimini tanlang": {
    "en": "Select payment mode",
    "ru": "Выберите режим оплаты"
  },
  "o'qib chiqdim va shaxsiy ma'lumotlarni qayta ishlashga roziman": {
    "en": "and agree to the processing of personal data",
    "ru": "и согласен(на) на обработку персональных данных"
  },
  "Menejer tez orada siz bilan bog'lanadi.": {
    "en": "A manager will contact you shortly.",
    "ru": "Менеджер скоро свяжется с вами."
  },
  "EDUKA narxlari haqida ma'lumot kerak": {
    "en": "I need information about EDUKA pricing",
    "ru": "Нужна информация о ценах EDUKA"
  }
};
  const storageKey = "eduka_language";
  const supported = ["uz", "en", "ru"];

  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function saveOriginals() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const value = normalizeText(node.nodeValue);
        if (!value) return NodeFilter.FILTER_REJECT;
        if (node.parentElement && ["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      if (!node.parentElement.dataset.i18nOriginal) {
        node.parentElement.dataset.i18nOriginal = normalizeText(node.nodeValue);
      }
      if (!node.dataset) {
        // Text nodes cannot store dataset. Keep custom property.
      }
      if (!node.__i18nOriginal) node.__i18nOriginal = normalizeText(node.nodeValue);
    });

    document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach((el) => {
      if (!el.dataset.i18nPlaceholder) el.dataset.i18nPlaceholder = el.getAttribute("placeholder") || "";
    });

    document.querySelectorAll("option").forEach((el) => {
      if (!el.dataset.i18nOriginal) el.dataset.i18nOriginal = normalizeText(el.textContent);
    });

    document.querySelectorAll("[aria-label]").forEach((el) => {
      if (!el.dataset.i18nAria) el.dataset.i18nAria = el.getAttribute("aria-label") || "";
    });
  }

  function translateString(original, lang) {
    const key = normalizeText(original);
    if (lang === "uz") return original;
    if (translations[key] && translations[key][lang]) return translations[key][lang];
    return original;
  }

  function applyLanguage(lang) {
    if (!supported.includes(lang)) lang = "uz";
    document.documentElement.lang = lang;
    localStorage.setItem(storageKey, lang);

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const value = normalizeText(node.nodeValue);
        if (!value) return NodeFilter.FILTER_REJECT;
        if (node.parentElement && ["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      const original = node.__i18nOriginal || normalizeText(node.nodeValue);
      if (!node.__i18nOriginal) node.__i18nOriginal = original;
      const translated = translateString(original, lang);
      if (translated !== original || lang === "uz") {
        node.nodeValue = node.nodeValue.replace(normalizeText(node.nodeValue), translated);
      }
    });

    document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach((el) => {
      const original = el.dataset.i18nPlaceholder || el.getAttribute("placeholder") || "";
      el.setAttribute("placeholder", translateString(original, lang));
    });

    document.querySelectorAll("option").forEach((el) => {
      const original = el.dataset.i18nOriginal || normalizeText(el.textContent);
      el.textContent = translateString(original, lang);
    });

    document.querySelectorAll("[aria-label]").forEach((el) => {
      const original = el.dataset.i18nAria || el.getAttribute("aria-label") || "";
      el.setAttribute("aria-label", translateString(original, lang));
    });

    document.querySelectorAll("[data-current-lang]").forEach((el) => {
      el.textContent = lang.toUpperCase();
    });

    document.querySelectorAll("[data-set-lang]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.setLang === lang);
    });

    updateTitle(lang);
  }

  function updateTitle(lang) {
    const path = window.location.pathname;
    const map = {
      uz: {
        prices: "Narxlar | EDUKA",
        gamification: "Gamification | EDUKA",
        vacancies: "Vakansiyalar | EDUKA",
        home: "EDUKA — O‘quv markazlari uchun CRM"
      },
      en: {
        prices: "Pricing | EDUKA",
        gamification: "Gamification | EDUKA",
        vacancies: "Vacancies | EDUKA",
        home: "EDUKA — CRM for learning centers"
      },
      ru: {
        prices: "Цены | EDUKA",
        gamification: "Геймификация | EDUKA",
        vacancies: "Вакансии | EDUKA",
        home: "EDUKA — CRM для учебных центров"
      }
    };
    const page = path.includes("prices") ? "prices" : path.includes("gamification") ? "gamification" : path.includes("vacancies") ? "vacancies" : "home";
    document.title = map[lang][page] || map.uz[page];
  }

  function bindDropdown() {
    document.querySelectorAll("[data-lang-dropdown]").forEach((dropdown) => {
      const toggle = dropdown.querySelector("[data-lang-toggle]");
      toggle?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll("[data-lang-dropdown]").forEach((d) => {
          if (d !== dropdown) d.classList.remove("is-open");
        });
        dropdown.classList.toggle("is-open");
      });
    });

    document.querySelectorAll("[data-set-lang]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const lang = btn.dataset.setLang || "uz";
        applyLanguage(lang);
        document.querySelectorAll("[data-lang-dropdown]").forEach((d) => d.classList.remove("is-open"));
      });
    });

    document.addEventListener("click", () => {
      document.querySelectorAll("[data-lang-dropdown]").forEach((d) => d.classList.remove("is-open"));
    });
  }

  function init() {
    saveOriginals();
    bindDropdown();
    applyLanguage(localStorage.getItem(storageKey) || "uz");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.EdukaLanguage = { applyLanguage };
})();
