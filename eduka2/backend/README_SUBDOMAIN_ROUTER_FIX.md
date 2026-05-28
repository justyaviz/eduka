# EDUKA Subdomain Router Fix

Muammo:
markaz.eduka.uz ochilganda landing sahifa chiqib qolayotgan edi.

Tuzatildi:
- Host *.eduka.uz bo'lsa server app.html qaytaradi.
- markaz.eduka.uz endi Center CRM login/app ochadi.
- app login subdomain input avtomatik host bilan to'ladi.
- /api/health endi tenantSubdomain ni ham ko'rsatadi.

Muhim Railway/DNS:
1. Railway domain/certificate wildcard subdomainni qabul qilishi kerak.
2. DNSda wildcard record bo'lishi kerak:
   *.eduka.uz -> Railway service
3. Agar Cloudflare ishlatilsa:
   CNAME * -> Railway target
   yoki Railway custom domain wildcard sozlanadi.

Tekshir:
- https://markaz.eduka.uz/api/health
- tenantSubdomain chiqishi kerak
- https://markaz.eduka.uz/ landing emas app login ochishi kerak
