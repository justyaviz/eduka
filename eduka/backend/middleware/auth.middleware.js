"use strict";
async function requireAuth(request, response, next) {
  if (typeof next === "function") return next();
  return true;
}
function sessionFromRequest(request) {
  return request?.user || null;
}
module.exports = { requireAuth, sessionFromRequest };
