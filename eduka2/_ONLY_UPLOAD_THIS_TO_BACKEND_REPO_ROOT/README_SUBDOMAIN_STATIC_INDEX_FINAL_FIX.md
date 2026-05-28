# EDUKA final subdomain fix

Sabab:
express.static(publicDir) root / da index.html ni avtomatik berib yuborayotgan edi.
Shuning uchun markaz.eduka.uz host tenant deb aniqlansa ham landing ochilib qolayotgan edi.

Tuzatildi:
- app.get("/") static'dan oldinga ko'chirildi.
- express.static(..., { index: false }) qo'yildi.
- *.eduka.uz hostlar endi app.html qaytaradi.

Tekshir:
1. Deploy
2. Incognito yoki Ctrl+F5
3. https://markaz.eduka.uz/api/health -> tenantSubdomain: "markaz"
4. https://markaz.eduka.uz/ -> Center CRM login
