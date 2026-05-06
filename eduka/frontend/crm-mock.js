window.crmMock = {
  users: {
    centerAdmin: {
      id: 1,
      fullName: "Eduka Admin",
      email: "admin@eduka.uz",
      phone: "+998 90 123 45 67",
      role: "center_admin",
      organization: {
        id: 1,
        name: "Ilm Academy Uz",
        phone: "+998 99 893 90 00",
        address: "Toshkent, Chilonzor",
        status: "active",
        plan: "Pro",
        subscriptionStatus: "trial",
        trialEndsAt: "2026-06-06",
        licenseExpiresAt: "2026-06-06",
        setupCompletedAt: "2026-05-06",
        needsOnboarding: false
      }
    },
    superAdmin: {
      id: 99,
      fullName: "Platforma egasi",
      email: "owner@eduka.uz",
      phone: "+998 90 000 00 00",
      role: "super_admin",
      organization: null
    }
  },
  courses: [
    { id: 1, name: "IELTS", description: "IELTS intensive kursi", price: 700000, duration: "6 oy", level: "B1-C1", lesson_type: "group", status: "active", groups_count: 4, students_count: 56 },
    { id: 2, name: "English Beginner", description: "Boshlang'ich ingliz tili", price: 500000, duration: "4 oy", level: "A0-A2", lesson_type: "group", status: "active", groups_count: 3, students_count: 42 },
    { id: 3, name: "Matematika", description: "Maktab va abituriyentlar uchun", price: 450000, duration: "5 oy", level: "Basic", lesson_type: "individual", status: "active", groups_count: 2, students_count: 18 }
  ],
  teachers: [
    { id: 1, full_name: "Madina Akramova", phone: "+998 90 111 22 33", email: "madina@eduka.uz", course_name: "IELTS", subjects: "IELTS, Speaking", groups: "IELTS Morning A, IELTS Evening B", salary_type: "fixed", salary_rate: 3500000, status: "active", students_count: 32, attendance_activity: "94%" },
    { id: 2, full_name: "Sardor Karimov", phone: "+998 93 444 55 66", email: "sardor@eduka.uz", course_name: "Matematika", subjects: "Algebra, Geometriya", groups: "Math A1", salary_type: "per_lesson", salary_rate: 120000, status: "active", students_count: 18, attendance_activity: "91%" }
  ],
  groups: [
    { id: 1, name: "IELTS Morning A", course_name: "IELTS", teacher_id: 1, teacher_full_name: "Madina Akramova", days: "Dush, Chor, Juma", start_time: "09:00", end_time: "10:30", room: "2-xona", student_count: 14, monthly_price: 700000, status: "active", starts_at: "2026-05-01" },
    { id: 2, name: "Beginner Kids", course_name: "English Beginner", teacher_id: 1, teacher_full_name: "Madina Akramova", days: "Sesh, Pay, Shan", start_time: "15:00", end_time: "16:30", room: "1-xona", student_count: 16, monthly_price: 500000, status: "active", starts_at: "2026-05-03" },
    { id: 3, name: "Math A1", course_name: "Matematika", teacher_id: 2, teacher_full_name: "Sardor Karimov", days: "Dush, Chor", start_time: "18:00", end_time: "19:30", room: "4-xona", student_count: 9, monthly_price: 450000, status: "active", starts_at: "2026-05-02" }
  ],
  students: [
    { id: 1, full_name: "Ali Valiyev", first_name: "Ali", last_name: "Valiyev", phone: "+998 99 893 99 99", parent_phone: "+998 90 222 33 44", birth_date: "2010-04-12", address: "Chilonzor", course_name: "IELTS", group_id: 1, group_name: "IELTS Morning A", payment_status: "paid", attendance_percent: "96%", status: "active", balance: 0, note: "Speaking kuchli" },
    { id: 2, full_name: "Sevara Karimova", first_name: "Sevara", last_name: "Karimova", phone: "+998 90 444 55 66", parent_phone: "+998 91 777 88 99", birth_date: "2011-08-21", address: "Yunusobod", course_name: "IELTS", group_id: 1, group_name: "IELTS Morning A", payment_status: "partial", attendance_percent: "89%", status: "debtor", balance: 350000, note: "Qayta aloqa kerak" },
    { id: 3, full_name: "Jasur Tursunov", first_name: "Jasur", last_name: "Tursunov", phone: "+998 93 123 45 67", parent_phone: "+998 94 765 43 21", birth_date: "2009-11-03", address: "Sergeli", course_name: "English Beginner", group_id: 2, group_name: "Beginner Kids", payment_status: "paid", attendance_percent: "92%", status: "active", balance: 0, note: "" },
    { id: 4, full_name: "Dilshod Raximov", first_name: "Dilshod", last_name: "Raximov", phone: "+998 95 888 77 66", parent_phone: "+998 97 111 22 33", birth_date: "2008-01-18", address: "Olmazor", course_name: "Matematika", group_id: 3, group_name: "Math A1", payment_status: "overdue", attendance_percent: "78%", status: "debtor", balance: 450000, note: "3 kundan beri qarzdor" }
  ],
  payments: [
    { id: 1, student_id: 1, student_name: "Ali Valiyev", group_id: 1, group_name: "IELTS Morning A", payment_month: "2026-05", due_amount: 700000, amount: 700000, paid_amount: 700000, remaining_debt: 0, status: "paid", paid_at: "2026-05-02", payment_type: "naqd", method: "cash", note: "May oyi" },
    { id: 2, student_id: 2, student_name: "Sevara Karimova", group_id: 1, group_name: "IELTS Morning A", payment_month: "2026-05", due_amount: 700000, amount: 350000, paid_amount: 350000, remaining_debt: 350000, status: "partial", paid_at: "2026-05-03", payment_type: "click", method: "click", note: "Qisman" },
    { id: 3, student_id: 4, student_name: "Dilshod Raximov", group_id: 3, group_name: "Math A1", payment_month: "2026-05", due_amount: 450000, amount: 0, paid_amount: 0, remaining_debt: 450000, status: "overdue", paid_at: "", payment_type: "bank", method: "bank", note: "Muddati o'tgan" }
  ],
  leads: [
    { id: 1, full_name: "Bekzod Olimov", phone: "+998 95 222 11 00", course_name: "IELTS", source: "Instagram", status: "new", manager_name: "Admin", next_contact_at: "2026-05-06T15:00", note: "IELTS bilan qiziqdi", created_at: "2026-05-06" },
    { id: 2, full_name: "Dilnoza Rahimova", phone: "+998 97 333 22 11", course_name: "English Beginner", source: "Telegram bot", status: "trial", manager_name: "Admin", next_contact_at: "2026-05-07T10:00", note: "Sinov darsga yozildi", created_at: "2026-05-05" },
    { id: 3, full_name: "Sherzod Ismoilov", phone: "+998 99 222 44 55", course_name: "Matematika", source: "Website", status: "contacted", manager_name: "Menejer", next_contact_at: "2026-05-08T12:00", note: "Narx so'radi", created_at: "2026-05-04" }
  ],
  attendance: [
    { id: 1, lesson_date: "2026-05-06", group_name: "IELTS Morning A", teacher_name: "Madina Akramova", student_name: "Ali Valiyev", status: "present", present_count: 13, absent_count: 1, late_count: 0, note: "" },
    { id: 2, lesson_date: "2026-05-06", group_name: "Beginner Kids", teacher_name: "Madina Akramova", student_name: "Jasur Tursunov", status: "late", present_count: 14, absent_count: 1, late_count: 1, note: "10 daqiqa kechikdi" }
  ],
  schedule: [
    { id: 1, group_name: "IELTS Morning A", teacher_name: "Madina Akramova", room: "2-xona", lesson_at: "2026-05-06T09:00:00", student_count: 14, status: "planned" },
    { id: 2, group_name: "Beginner Kids", teacher_name: "Madina Akramova", room: "1-xona", lesson_at: "2026-05-06T15:00:00", student_count: 16, status: "planned" },
    { id: 3, group_name: "Math A1", teacher_name: "Sardor Karimov", room: "4-xona", lesson_at: "2026-05-06T18:00:00", student_count: 9, status: "planned" }
  ],
  centers: [
    { id: 1, name: "Ilm Academy Uz", owner: "Eduka Admin", phone: "+998 99 893 90 00", plan: "Pro", subscription_status: "trial", license_expires_at: "2026-06-06", students_count: 248, branches_count: 1, groups_count: 32, users_count: 8, last_activity_at: "2026-05-06", status: "active" },
    { id: 2, name: "Aloo Academy", owner: "Jamshid Aliyev", phone: "+998 90 555 66 77", plan: "Business", subscription_status: "active", license_expires_at: "2026-09-01", students_count: 410, branches_count: 3, groups_count: 48, users_count: 21, last_activity_at: "2026-05-05", status: "active" },
    { id: 3, name: "Future School", owner: "Malika Xasanova", phone: "+998 94 333 22 11", plan: "Start", subscription_status: "expired", license_expires_at: "2026-05-01", students_count: 72, branches_count: 1, groups_count: 9, users_count: 4, last_activity_at: "2026-04-30", status: "blocked" }
  ],
  plans: [
    { name: "Start", price: 199000, student_limit: 150, teacher_limit: 4, branch_limit: 1, features: ["Dashboard", "Students", "Payments"] },
    { name: "Pro", price: 399000, student_limit: 500, teacher_limit: 12, branch_limit: 2, features: ["All CRM", "Telegram", "Reports"] },
    { name: "Business", price: 799000, student_limit: 2000, teacher_limit: 50, branch_limit: 10, features: ["Multi-branch", "Priority support", "Advanced reports"] }
  ],
  subscriptions: [
    { id: 1, center_name: "Ilm Academy Uz", tariff_name: "Pro", status: "trial", starts_at: "2026-05-06", ends_at: "2026-06-06", amount: 0 },
    { id: 2, center_name: "Aloo Academy", tariff_name: "Business", status: "active", starts_at: "2026-05-01", ends_at: "2026-09-01", amount: 799000 },
    { id: 3, center_name: "Future School", tariff_name: "Start", status: "expired", starts_at: "2026-04-01", ends_at: "2026-05-01", amount: 199000 }
  ],
  platformPayments: [
    { id: 1, center_name: "Aloo Academy", paid_at: "2026-05-03", amount: 799000, payment_type: "bank", status: "paid" },
    { id: 2, center_name: "Future School", paid_at: "2026-04-01", amount: 199000, payment_type: "click", status: "paid" }
  ],
  supportTickets: [
    { id: 1, center_name: "Ilm Academy Uz", subject: "Telegram bot ulash", message: "Bot tokenni tekshirib berish kerak.", created_at: "2026-05-06" },
    { id: 2, center_name: "Aloo Academy", subject: "Tarif yangilash", message: "Business plan invoice so'raldi.", created_at: "2026-05-05" }
  ]
};
