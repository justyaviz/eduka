(function () {
  const mock = window.crmMock || {};

  function delay(value) {
    return new Promise((resolve) => window.setTimeout(() => resolve(structuredClone(value)), 120));
  }

  function nextId(items) {
    return Math.max(0, ...items.map((item) => Number(item.id || 0))) + 1;
  }

  function list(name) {
    return delay(mock[name] || []);
  }

  function get(name, id) {
    return delay((mock[name] || []).find((item) => String(item.id) === String(id)) || null);
  }

  function create(name, payload) {
    const item = { id: nextId(mock[name] || []), ...payload };
    mock[name] = mock[name] || [];
    mock[name].unshift(item);
    return delay(item);
  }

  function update(name, id, payload) {
    mock[name] = (mock[name] || []).map((item) => (String(item.id) === String(id) ? { ...item, ...payload } : item));
    return get(name, id);
  }

  function remove(name, id) {
    mock[name] = (mock[name] || []).filter((item) => String(item.id) !== String(id));
    return delay({ ok: true });
  }

  function service(name) {
    return {
      list: () => list(name),
      get: (id) => get(name, id),
      create: (payload) => create(name, payload),
      update: (id, payload) => update(name, id, payload),
      remove: (id) => remove(name, id)
    };
  }

  window.crmServices = {
    authService: {
      demoLogin: () => delay(mock.users?.centerAdmin),
      superLogin: () => delay(mock.users?.superAdmin)
    },
    studentService: service("students"),
    courseService: service("courses"),
    teacherService: service("teachers"),
    groupService: service("groups"),
    paymentService: service("payments"),
    debtService: { list: () => delay((mock.students || []).filter((student) => Number(student.balance || 0) > 0)) },
    attendanceService: service("attendance"),
    scheduleService: service("schedule"),
    leadService: service("leads"),
    reportService: {
      summary: () => delay({
        daily_revenue: 2700000,
        weekly_revenue: 18400000,
        monthly_revenue: 42500000,
        total_debt: 8200000,
        new_students: 18,
        left_students: 3,
        active_groups: 32,
        teacher_performance: "92%",
        attendance_percentage: "91%",
        lead_conversion: "38%"
      })
    },
    settingsService: {
      get: () => delay({
        center: mock.users?.centerAdmin?.organization,
        paymentDay: 5,
        methods: ["cash", "card", "click", "payme"],
        telegram: { attendanceMessages: true, debtReminders: true }
      })
    },
    superAdminService: {
      centers: () => delay(mock.centers || []),
      plans: () => delay(mock.plans || []),
      subscriptions: () => delay(mock.subscriptions || []),
      payments: () => delay(mock.platformPayments || []),
      support: () => delay(mock.supportTickets || []),
      summary: () => delay({
        centers: (mock.centers || []).length,
        active_centers: (mock.centers || []).filter((center) => center.status === "active").length,
        trial_centers: (mock.centers || []).filter((center) => center.subscription_status === "trial").length,
        expired_centers: (mock.centers || []).filter((center) => center.subscription_status === "expired").length,
        monthly_volume: 128000000,
        new_today: 4
      })
    }
  };
})();
