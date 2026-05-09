"use strict";
function buildStudentPaymentMessage({ studentName = "Talaba", amount = 0, receipt = "" } = {}) {
  return `✅ To'lov tasdiqlandi\n👤 ${studentName}\n💳 Summa: ${amount}\n🧾 Chek: ${receipt}`;
}
function buildAttendanceMessage({ studentName = "Talaba", status = "present", date = "" } = {}) {
  return `📚 Davomat\n👤 ${studentName}\n📌 Holat: ${status}\n🗓 ${date}`;
}
module.exports = { buildStudentPaymentMessage, buildAttendanceMessage };
