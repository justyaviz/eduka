"use strict";
function resolveTenant(request) {
  const host = String(request?.headers?.host || "").split(":")[0];
  const subdomain = host.endsWith(".eduka.uz") ? host.replace(".eduka.uz", "") : null;
  return { host, subdomain };
}
module.exports = { resolveTenant };
