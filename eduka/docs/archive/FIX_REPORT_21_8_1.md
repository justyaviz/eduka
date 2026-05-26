# Fix Report 21.8.1

Requested state:
- No demo centers
- No students
- No teachers
- No sample groups/payments
- Only platform owner remains

Owner login:
- Email: `yaviz@eduka.uz`
- Password: `owner` by default, or Railway variable `SUPER_ADMIN_PASSWORD` if set

Deployment fix:
- Added `railway.json` with `/api/health`
- Safe start command runs migration, but starts server even if migration returns a warning
- Health endpoint returns 200 without database queries
