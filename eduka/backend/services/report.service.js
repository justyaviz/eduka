"use strict";
function kpiSnapshot({ students = [], groups = [], teachers = [], payments = [], attendance = [] } = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const todayRevenue = payments.filter((p) => String(p.paid_at || p.created_at || "").slice(0, 10) === today).reduce((s, p) => s + Number(p.amount || 0), 0);
  const debtors = students.filter((s) => Number(s.balance || 0) > 0);
  return {
    active_students: students.filter((s) => (s.status || "active") === "active").length,
    active_groups: groups.filter((g) => (g.status || "active") === "active").length,
    active_teachers: teachers.filter((t) => (t.status || "active") === "active").length,
    today_revenue: todayRevenue,
    debtors: debtors.length,
    debt_total: debtors.reduce((s, item) => s + Number(item.balance || 0), 0),
    attendance_records: attendance.length
  };
}
module.exports = { kpiSnapshot };
