"use strict";
function receiptNumber(prefix = "CHK", date = new Date(), id = Date.now()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${prefix}-${y}${m}${d}-${String(id).slice(-6)}`;
}
module.exports = { receiptNumber };
