# Eduka 22.0.0 — Full CEO System

## Added
- Fully separated CEO console from Center CRM.
- Modern simple CEO console UI with Inter/system font stack.
- CEO dashboard KPI, profile card, quick actions, notifications.
- Center list, center creation wizard, block/activate, plan change, feature flags.
- Center admin password reset and login-as-center workflow.
- Tariff CRUD UI with limits and feature flags.
- Subscriptions actions: trial and extend.
- Billing: platform payments and invoices.
- Support ticket create/reply/close.
- CEO admin create/edit/reset/block.
- Audit log and global Ctrl+K search.
- Mobile responsive CEO console.

## Important separation
- CEO URL: `/ceo/login`, `/ceo/dashboard`.
- Center CRM URL: `/admin/login`, `/admin/dashboard`.
- CEO roles accepted: `super_admin`, `platform_owner`, `platform_admin`, `support_manager`, `sales_manager`, `finance_manager`, `technical_manager`.
- Center owner role is no longer accepted as CEO.
