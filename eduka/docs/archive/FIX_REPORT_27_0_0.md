# Fix Report — Eduka 27.0.0

## Problem areas covered
- `relation does not exist`
- `column does not exist`
- duplicate migration runs
- older Railway PostgreSQL databases missing new Student App/Gamification/Finance tables
- session isolation audit for CEO/Admin/Student/Parent areas

## New audit URL
Open after deploy:

```txt
/api/production/audit27
```

It returns table existence, counts, session notes and token/Telegram readiness.

## Manual fallback
If Railway still crashes before server starts, run:

```txt
backend/hotfix-27.0.0-production-stable-fix.sql
```

in Railway Postgres → Query, then redeploy.
