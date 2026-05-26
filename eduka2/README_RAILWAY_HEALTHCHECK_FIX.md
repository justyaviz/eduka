# EDUKA Railway Deploy

Railway sozlamalari:

Root Directory: bo‘sh
Build Command: npm run build
Start Command: npm run start:safe
Healthcheck Path: /api/health

Agar service Root Directory `backend` qilib turgan bo‘lsa:

Root Directory: backend
Build Command: npm run build
Start Command: npm run start:safe
Healthcheck Path: /api/health

Muhim:
- Healthcheck timeout: 300 seconds
- Service variables ichida PORT qo‘lda yozilmasin. Railway o‘zi beradi.
- /api/health, /health, /healthz hammasi 200 qaytaradi.
