(function () {
  const mock = window.crmMock || {};
  const allowDemoFallback = new URLSearchParams(window.location.search).get("demo") === "1" || localStorage.getItem("eduka_allow_demo") === "1";

  function requireApi(error) {
    if (allowDemoFallback) return null;
    throw error;
  }
  const endpointByName = {
    students: "/api/students",
    courses: "/api/courses",
    teachers: "/api/teachers",
    groups: "/api/groups",
    payments: "/api/payments",
    debts: "/api/debts",
    attendance: "/api/attendance",
    schedule: "/api/schedule",
    leads: "/api/leads",
    rooms: "/api/rooms",
    paymentTypes: "/api/payment-types",
    financeTransactions: "/api/app/finance/transactions",
    staffAttendance: "/api/app/staff-attendance",
    tags: "/api/tags"
  };

  function clone(value) {
    return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  }

  function delay(value) {
    return new Promise((resolve) => window.setTimeout(() => resolve(clone(value)), 120));
  }

  function nextId(items) {
    return Math.max(0, ...items.map((item) => Number(item.id || 0))) + 1;
  }

  async function readJson(response) {
    return response.json().catch(() => ({}));
  }

  async function request(path, options = {}) {
    const tenant = window.currentTenant || {};
    const tenantHeaders = tenant.subdomain ? { "X-Tenant-Subdomain": tenant.subdomain, "X-Center-Id": String(tenant.centerId || "") } : {};
    const response = await fetch(path, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...tenantHeaders, ...(options.headers || {}) },
      ...options
    });
    const payload = await readJson(response);
    if (!response.ok) throw new Error(payload.message || "API so'rovi bajarilmadi");
    return payload;
  }

  function withQuery(path, query = {}) {
    const params = new URLSearchParams();
    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, value);
    });
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  }

  function listMock(name) {
    return delay(mock[name] || []);
  }

  function getMock(name, id) {
    return delay((mock[name] || []).find((item) => String(item.id) === String(id)) || null);
  }

  function createMock(name, payload) {
    const item = { id: nextId(mock[name] || []), ...payload };
    mock[name] = mock[name] || [];
    mock[name].unshift(item);
    return delay(item);
  }

  function updateMock(name, id, payload) {
    mock[name] = (mock[name] || []).map((item) => (String(item.id) === String(id) ? { ...item, ...payload } : item));
    return getMock(name, id);
  }

  function removeMock(name, id) {
    mock[name] = (mock[name] || []).filter((item) => String(item.id) !== String(id));
    return delay({ ok: true });
  }

  function service(name) {
    const endpoint = endpointByName[name];
    return {
      list: async (query = {}) => {
        try {
          const payload = await request(withQuery(endpoint, query));
          return payload.items || [];
        } catch (error) {
          requireApi(error);
          return listMock(name);
        }
      },
      get: async (id) => {
        try {
          const payload = await request(`${endpoint}/${id}`);
          return payload.item || payload.profile || null;
        } catch (error) {
          requireApi(error);
          return getMock(name, id);
        }
      },
      create: async (payload) => {
        try {
          const result = await request(endpoint, { method: "POST", body: JSON.stringify(payload) });
          return result.item || result.items?.[0] || null;
        } catch (error) {
          requireApi(error);
          return createMock(name, payload);
        }
      },
      update: async (id, payload) => {
        try {
          const result = await request(`${endpoint}/${id}`, { method: "PUT", body: JSON.stringify(payload) });
          return result.item || null;
        } catch (error) {
          requireApi(error);
          return updateMock(name, id, payload);
        }
      },
      remove: async (id) => {
        try {
          return await request(`${endpoint}/${id}`, { method: "DELETE" });
        } catch (error) {
          requireApi(error);
          return removeMock(name, id);
        }
      }
    };
  }

  function mockDebts() {
    const studentsById = new Map((mock.students || []).map((student) => [String(student.id), student]));
    const debts = new Map();

    (mock.payments || []).forEach((payment) => {
      if (!payment.student_id || payment.status === "cancelled") return;
      const due = Number(payment.due_amount || 0);
      const paid = Number(payment.amount || 0) + Number(payment.discount || 0);
      const remaining = Math.max(due - paid, 0);
      if (remaining <= 0) return;
      const key = String(payment.student_id);
      const current = debts.get(key) || { amount_due: 0, paid_amount: 0, remaining_debt: 0 };
      current.amount_due += due;
      current.paid_amount += paid;
      current.remaining_debt += remaining;
      current.last_payment_at = payment.paid_at || current.last_payment_at;
      debts.set(key, current);
    });

    const computed = [...debts.entries()].map(([studentId, debt]) => ({
      ...(studentsById.get(studentId) || {}),
      ...debt,
      balance: debt.remaining_debt,
      overdue_days: 5
    }));

    if (computed.length) return delay(computed);
    return delay((mock.students || []).filter((student) => Number(student.balance || 0) > 0));
  }

  window.crmServices = {
    authService: {
      demoLogin: async () => {
        try {
          const payload = await request("/api/auth/demo", { method: "POST", body: JSON.stringify({}) });
          return payload.user;
        } catch (error) {
          requireApi(error);
          return delay(mock.users?.centerAdmin);
        }
      },
      superLogin: () => delay(mock.users?.superAdmin)
    },
    studentService: service("students"),
    courseService: service("courses"),
    teacherService: service("teachers"),
    groupService: service("groups"),
    paymentService: service("payments"),
    debtService: {
      list: async (query = {}) => {
        try {
          const payload = await request(withQuery(endpointByName.debts, query));
          return payload.items || [];
        } catch (error) {
          requireApi(error);
          return mockDebts();
        }
      }
    },
    attendanceService: service("attendance"),
    scheduleService: service("schedule"),
    roomService: service("rooms"),
    paymentTypeService: service("paymentTypes"),
    financeTransactionService: service("financeTransactions"),
    tagService: service("tags"),
    staffAttendanceService: {
      ...service("staffAttendance"),
      checkIn: async (employeeId) => request("/api/app/staff-attendance/check-in", { method: "POST", body: JSON.stringify({ employee_id: employeeId }) }),
      checkOut: async (employeeId) => request("/api/app/staff-attendance/check-out", { method: "POST", body: JSON.stringify({ employee_id: employeeId }) })
    },
    leadService: {
      ...service("leads"),
      convertToStudent: async (id) => {
        try {
          const payload = await request(`/api/leads/${id}/convert-to-student`, { method: "POST", body: JSON.stringify({}) });
          return payload.item || null;
        } catch (error) {
          requireApi(error);
          const lead = (mock.leads || []).find((item) => String(item.id) === String(id));
          if (!lead) return null;
          const student = await createMock("students", {
            full_name: lead.full_name,
            phone: lead.phone,
            course_name: lead.course_name,
            status: "active",
            note: `Liddan o'tkazildi: ${lead.note || ""}`
          });
          await updateMock("leads", id, { status: "paid" });
          return student;
        }
      }
    },
    reportService: {
      summary: async () => {
        try {
          const payload = await request("/api/reports");
          return payload.analytics || payload.summary || {};
        } catch (error) {
          requireApi(error);
          return delay({
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
          });
        }
      }
    },
    settingsService: {
      get: async () => {
        try {
          return await request("/api/settings");
        } catch (error) {
          requireApi(error);
          return delay({
            center: mock.users?.centerAdmin?.organization,
            paymentDay: 5,
            methods: ["cash", "card", "click", "payme"],
            telegram: { attendanceMessages: true, debtReminders: true }
          });
        }
      }
    },
    studentAppAdminService: {
      dashboard: async () => request("/api/app/student-app/dashboard"),
      status: async () => request("/api/telegram/status"),
      webhookInfo: async () => request("/api/telegram/webhook-info"),
      settings: async () => request("/api/app/student-app/settings"),
      saveSettings: async (payload) => request("/api/app/student-app/settings", { method: "PUT", body: JSON.stringify(payload) }),
      modules: async () => (await request("/api/app/student-app/modules")).items || [],
      saveModules: async (modules) => (await request("/api/app/student-app/modules", { method: "PUT", body: JSON.stringify({ modules }) })).items || [],
      access: async () => (await request("/api/app/student-app/access/students")).items || [],
      accessAction: async (studentId, action) => request(`/api/app/student-app/access/${studentId}/${action}`, { method: "POST", body: JSON.stringify({}) }),
      list: async (resource) => (await request(`/api/app/student-app/${resource}`)).items || [],
      create: async (resource, payload) => (await request(`/api/app/student-app/${resource}`, { method: "POST", body: JSON.stringify(payload) })).item,
      update: async (resource, id, payload) => (await request(`/api/app/student-app/${resource}/${id}`, { method: "PUT", body: JSON.stringify(payload) })).item,
      remove: async (resource, id) => request(`/api/app/student-app/${resource}/${id}`, { method: "DELETE" })
    },
    superAdminService: {
      centers: async () => {
        try {
          return (await request("/api/super/centers")).items || [];
        } catch (error) {
          requireApi(error);
          return delay(mock.centers || []);
        }
      },
      plans: async () => {
        try {
          return (await request("/api/super/tariffs")).items || [];
        } catch (error) {
          requireApi(error);
          return delay(mock.plans || []);
        }
      },
      subscriptions: async () => {
        try {
          return (await request("/api/super/subscriptions")).items || [];
        } catch (error) {
          requireApi(error);
          return delay(mock.subscriptions || []);
        }
      },
      payments: async () => {
        try {
          return (await request("/api/super/payments")).items || [];
        } catch (error) {
          requireApi(error);
          return delay(mock.platformPayments || []);
        }
      },
      support: async () => {
        try {
          return (await request("/api/super/support")).items || [];
        } catch (error) {
          requireApi(error);
          return delay(mock.supportTickets || []);
        }
      },
      summary: async () => {
        try {
          return (await request("/api/super/summary")).summary || {};
        } catch (error) {
          requireApi(error);
          return delay({
            centers: (mock.centers || []).length,
            active_centers: (mock.centers || []).filter((center) => center.status === "active").length,
            trial_centers: (mock.centers || []).filter((center) => center.subscription_status === "trial").length,
            expired_centers: (mock.centers || []).filter((center) => center.subscription_status === "expired").length,
            monthly_volume: 128000000,
            new_today: 4
          });
        }
      }
    }
  };
})();
