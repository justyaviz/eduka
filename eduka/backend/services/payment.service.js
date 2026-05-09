"use strict";
function calculateDebt(student = {}, payments = []) {
  const paid = payments.filter((p) => String(p.student_id) === String(student.id)).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  return Math.max(Number(student.balance || student.due_amount || 0) - paid, 0);
}
function normalizePaymentMethod(method) {
  const value = String(method || "cash").toLowerCase();
  if (["cash", "naqd"].includes(value)) return "cash";
  if (["card", "plastik"].includes(value)) return "card";
  if (["click", "payme", "uzum", "alif"].includes(value)) return value;
  return "other";
}
module.exports = { calculateDebt, normalizePaymentMethod };
