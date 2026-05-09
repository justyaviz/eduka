"use strict";
const rolePermissions = {
  SUPER_ADMIN: ["*"],
  OWNER: ["students.*", "groups.*", "teachers.*", "payments.*", "attendance.*", "reports.view", "settings.manage"],
  ADMIN: ["students.*", "groups.*", "teachers.*", "payments.*", "attendance.*", "reports.view"],
  CASHIER: ["students.view", "payments.*", "reports.finance"],
  TEACHER: ["students.view", "groups.view", "attendance.*"],
  RECEPTION: ["students.*", "leads.*", "groups.view"]
};
function can(role, permission) {
  const permissions = rolePermissions[role] || [];
  return permissions.includes("*") || permissions.includes(permission) || permissions.some((entry) => entry.endsWith(".*") && permission.startsWith(entry.slice(0, -1)));
}
module.exports = { rolePermissions, can };
