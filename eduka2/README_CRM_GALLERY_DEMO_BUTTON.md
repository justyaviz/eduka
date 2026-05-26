# EDUKA CRM Gallery + Demo Button Code

Rasmlar GitHub'da shu papkada bo'lishi kerak:

public/assets/crm/dashboard.png
public/assets/crm/oquvchilar.png
public/assets/crm/tolovlar.png
public/assets/crm/guruhlar.png
public/assets/crm/davomat.png
public/assets/crm/hisobotlar.png
public/assets/crm/rollar.png
public/assets/crm/malumotlar.png
public/assets/crm/xabarnomalar.png

Qo'shilgan fayllar:
- public/crm-images-gallery.css
- public/crm-images-gallery.js
- public/crm-gallery-section.html

Backend service uchun:
- backend/public/crm-images-gallery.css
- backend/public/crm-images-gallery.js
- backend/public/crm-gallery-section.html

index.html ichida:
- CRM ko'rinishlari bo'limi image-galleryga almashtirildi.
- Rasm bosilganda katta preview modal ochiladi.
- "Hozir sinab ko‘ring — 7 kun bepul!" tugmasi Demo modalni ochadi.
- Agar eski demo modal topilmasa, fallback demo modal avtomatik yaratiladi.

Agar faqat copy-paste qilmoqchi bo'lsangiz:
_COPY_PASTE_CODE_SNIPPETS papkasidagi 3 ta fayldan foydalaning.

Railway:
Root Directory: backend
Build Command: npm run build
Start Command: npm run start:safe
Healthcheck Path: /api/health
