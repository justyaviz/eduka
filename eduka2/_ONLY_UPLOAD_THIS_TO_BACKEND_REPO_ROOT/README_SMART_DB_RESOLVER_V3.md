# EDUKA Smart DB Resolver V3

Bu versiyada database ulanish smart resolver orqali ishlaydi.

Kod quyidagi ENV'larni ketma-ket sinaydi:
- DATABASE_URL
- DATABASE_PRIVATE_URL
- POSTGRES_URL
- POSTGRES_PRIVATE_URL
- POSTGRES_DATABASE_URL
- PGHOST + PGUSER + PGPASSWORD + PGDATABASE

Qaysi biri ishlasa, avtomatik o'shani tanlaydi.

Tekshirish:
- /api/health
- /api/server-status
- /api/debug/db
- /api/debug/init-db

Login:
ceo@eduka.uz
admin123

Agar /api/debug/db da hammasi failed bo'lsa, Postgres service Variables'dagi URL/passwordlar noto'g'ri yoki app service'ga ulanmagan.
