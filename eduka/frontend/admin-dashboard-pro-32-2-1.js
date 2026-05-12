(() => {
  const root = document.querySelector('[data-dashboard-root]');
  if (!root) return;
  const $ = (sel) => document.querySelector(sel);
  const fmt = new Intl.NumberFormat('uz-UZ');
  const money = (value) => `${fmt.format(Number(value || 0))} so‘m`;
  const safeNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const api = async (url) => {
    const response = await fetch(url, { credentials: 'include', headers: { 'Accept': 'application/json' } });
    if (response.status === 401 || response.status === 403) {
      location.href = '/admin/login';
      return null;
    }
    if (!response.ok) throw new Error(`API ${response.status}: ${url}`);
    return response.json();
  };
  const setText = (name, value) => {
    const el = document.querySelector(`[data-kpi="${name}"]`);
    if (el) el.textContent = value;
  };
  const setHint = (name, value) => {
    const el = document.querySelector(`[data-kpi="${name}"]`);
    if (el) el.textContent = value;
  };
  const pick = (obj, keys, fallback = 0) => {
    for (const key of keys) {
      if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    return fallback;
  };
  function normalizeOverview(payloads) {
    const data = Object.assign({}, ...payloads.filter(Boolean).map((item) => item.data || item));
    const overview = data.overview || data.summary || data.kpis || data;
    return {
      centerName: pick(data, ['center_name', 'centerName', 'organization_name'], 'Eduka CRM'),
      students: safeNumber(pick(overview, ['active_students', 'students', 'student_count', 'total_students'], 0)),
      groups: safeNumber(pick(overview, ['active_groups', 'groups', 'group_count', 'total_groups'], 0)),
      teachers: safeNumber(pick(overview, ['teachers', 'teacher_count', 'active_teachers'], 0)),
      lessons: safeNumber(pick(overview, ['today_lessons', 'lessons_today', 'todayLessons'], 0)),
      debtors: safeNumber(pick(overview, ['debtors', 'debtor_count', 'debtors_count'], 0)),
      debtAmount: safeNumber(pick(overview, ['debt_amount', 'total_debt', 'debts_sum'], 0)),
      revenue: safeNumber(pick(overview, ['today_revenue', 'today_payments', 'payments_today_sum', 'revenue_today'], 0)),
      monthlyRevenue: safeNumber(pick(overview, ['monthly_revenue', 'payments_month_sum', 'revenue_month'], 0)),
      attendance: safeNumber(pick(overview, ['attendance_rate', 'attendance_percent', 'today_attendance_rate'], 0)),
      leads: safeNumber(pick(overview, ['new_leads', 'leads', 'lead_count'], 0)),
      paymentsCount: safeNumber(pick(overview, ['today_payment_count', 'payments_today_count'], 0))
    };
  }
  function renderLessons(items) {
    const box = $('[data-today-lessons]');
    const lessons = Array.isArray(items) ? items : [];
    if (!box) return;
    if (!lessons.length) {
      box.innerHTML = `<div class="eduka-alert muted"><div><strong>Bugungi darslar topilmadi</strong><small>Jadval qo‘shilgach bu yerda ko‘rinadi.</small></div><span class="eduka-badge">Bo‘sh</span></div>`;
      return;
    }
    box.innerHTML = lessons.slice(0, 6).map((lesson) => `
      <div class="eduka-row">
        <div><strong>${lesson.group_name || lesson.group || 'Guruh'}</strong><small>${lesson.teacher_name || lesson.teacher || 'O‘qituvchi'} · ${lesson.room_name || lesson.room || 'Xona'} · ${lesson.starts_at || lesson.start_time || ''}</small></div>
        <span class="eduka-badge ${lesson.status === 'completed' ? 'success' : lesson.status === 'live' ? 'warning' : ''}">${lesson.status || 'pending'}</span>
      </div>`).join('');
  }
  function renderActions(data) {
    const box = $('[data-action-center]');
    if (!box) return;
    const actions = [];
    if (data.debtors > 0) actions.push({ title: 'Qarzdorlik nazorati', text: `${data.debtors} ta qarzdor, jami ${money(data.debtAmount)}`, type: 'danger', href: '/admin/debts' });
    if (data.lessons > 0) actions.push({ title: 'Bugungi davomat', text: `${data.lessons} ta dars bo‘yicha davomatni tekshiring`, type: 'warning', href: '/admin/attendance' });
    if (data.leads > 0) actions.push({ title: 'Yangi leadlar', text: `${data.leads} ta yangi lead bor`, type: 'success', href: '/admin/leads' });
    if (!actions.length) actions.push({ title: 'Tizim barqaror', text: 'Hozircha shoshilinch vazifa yo‘q.', type: 'success', href: '/admin/dashboard' });
    box.innerHTML = actions.map((action) => `<a class="eduka-alert" href="${action.href}"><div><strong>${action.title}</strong><small>${action.text}</small></div><span class="eduka-badge ${action.type}">${action.type === 'danger' ? 'Muhim' : action.type === 'warning' ? 'Bugun' : 'OK'}</span></a>`).join('');
  }
  function renderPayments(data) {
    const box = $('[data-payments-summary]');
    if (!box) return;
    box.innerHTML = `
      <div class="eduka-row"><div><strong>Bugungi tushum</strong><small>${data.paymentsCount || 0} ta to‘lov</small></div><span class="eduka-badge success">${money(data.revenue)}</span></div>
      <div class="eduka-row"><div><strong>Oylik tushum</strong><small>Joriy oy bo‘yicha</small></div><span class="eduka-badge">${money(data.monthlyRevenue)}</span></div>
      <div class="eduka-row"><div><strong>Qarzdorlik</strong><small>${data.debtors} ta talaba</small></div><span class="eduka-badge danger">${money(data.debtAmount)}</span></div>`;
  }
  async function loadDashboard() {
    try {
      const [crm32, crm30, ops31] = await Promise.allSettled([
        api('/api/app/crm32/full-system'),
        api('/api/app/crm30/overview'),
        api('/api/app/operations31/today-lessons')
      ]);
      const payloads = [crm32, crm30].filter((r) => r.status === 'fulfilled').map((r) => r.value);
      const data = normalizeOverview(payloads);
      const lessonsPayload = ops31.status === 'fulfilled' ? ops31.value : null;
      const lessons = Array.isArray(lessonsPayload?.data) ? lessonsPayload.data : Array.isArray(lessonsPayload?.lessons) ? lessonsPayload.lessons : [];
      if (data.centerName) {
        document.querySelectorAll('[data-center-name]').forEach((el) => (el.textContent = data.centerName));
        const avatar = $('[data-center-avatar]');
        if (avatar) avatar.textContent = String(data.centerName).trim().charAt(0).toUpperCase() || 'E';
      }
      setText('students', fmt.format(data.students));
      setText('lessons', fmt.format(data.lessons || lessons.length));
      setText('debtors', fmt.format(data.debtors));
      setText('attendance', data.attendance ? `${Math.round(data.attendance)}%` : '—');
      setText('groups', fmt.format(data.groups));
      setText('leads', fmt.format(data.leads));
      setText('todayRevenue', money(data.revenue));
      setHint('todayRevenueHint', data.revenue ? 'Bugungi to‘lovlar bo‘yicha' : 'Bugun to‘lov yozilmagan');
      renderLessons(lessons);
      renderActions(data);
      renderPayments(data);
    } catch (error) {
      console.error('[Eduka dashboard pro] load failed', error);
      renderLessons([]);
      const action = $('[data-action-center]');
      if (action) action.innerHTML = `<div class="eduka-alert"><div><strong>Dashboard API ulanmagan</strong><small>${error.message || 'Ma’lumotlarni yuklab bo‘lmadi.'}</small></div><span class="eduka-badge warning">Offline</span></div>`;
      const payments = $('[data-payments-summary]');
      if (payments) payments.innerHTML = `<div class="eduka-alert muted"><div><strong>Ma’lumot kutilyapti</strong><small>API yoki database tayyor bo‘lganda avtomatik ko‘rinadi.</small></div></div>`;
    }
  }
  $('[data-refresh]')?.addEventListener('click', loadDashboard);
  $('[data-logout]')?.addEventListener('click', async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch (_) {}
    location.href = '/admin/login';
  });
  $('[data-mobile-menu]')?.addEventListener('click', () => root.classList.toggle('menu-open'));
  document.querySelector('[data-global-search]')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const q = encodeURIComponent(event.currentTarget.value.trim());
      if (q) location.href = `/admin/students?q=${q}`;
    }
  });
  loadDashboard();
  setInterval(loadDashboard, 60_000);
})();
