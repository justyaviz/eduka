# Eduka 27.0.0 — Production Stable Fix

This release focuses on production hardening, migration safety and real workflow readiness.

## Added
- Safe self-healing schema for old Railway databases.
- Production audit endpoint: `/api/production/audit`, `/api/production/audit27`, `/api/production/stable-check`.
- Stable tables for production issue logs and production audit runs.
- Idempotent migration and hotfix SQL for missing table/column errors.

## Hardened
- Student App session tables and token columns.
- Gamification tables: rewards, redemptions, coin transactions, notifications.
- Telegram notification logs.
- Parent access links.
- Finance cashdesk entries.
- Payment provider settings.
- Organization feature flags and plan fields.

## Purpose
Eduka 27.0.0 is not a feature-heavy release. It is a stability layer before live production use.
