# EDUKA CRM operational release

## Implemented and tested
- Removed generic page Print buttons; payment receipt printing remains.
- Owners/directors provision and disable individual staff accounts with bcrypt passwords (12+ characters), built-in or custom roles. Account changes do not put passwords into generic JSON records or audit history. Revocation and role updates are checked live. Tenant JWTs cannot authorize CEO APIs.
- Monthly payroll previews: base salary + unique attended group/date lessons × lesson rate + net student group receipts × percentage + bonuses − penalties. Refunds reduce the percentage base. Rates are configured per employee. Generated month entries cannot be manually rewritten; payout is an explicit action, creates one expense, and repeated requests return the same payout. It records an accounting expense; it does not transfer money through a bank. Payroll corrections/reversals still need a separate workflow.
- Coin awards from attendance are opt-in in System settings (0 disables). Awards reference their attendance source; retries do not add a second award. Reversing attendance reverses the award only if it will not make the balance negative. Rewards have coin prices and stock; redemption is transactional and idempotent. Existing coin ranking reports remain available.
- Persistent support conversation per center and staff account. Client polls every 10 seconds, shows an unread badge; no false operator-online claim. Operator page: `/ceo/support.html`, using the existing CEO sign-in session. CEO landing/dashboard design files were not changed. Historical anonymous support_requests are not copied into these authenticated conversations. No AI provider is connected.
- Direct CEO center creation atomically provisions a director, returns generated credentials once and starts without business/demo rows. Existing demo conversion uses cryptographically random passwords. Registration reserves common subdomains and checks equivalent short/full domain duplicates.
- CRM writes enforce student/branch tariff caps and trial/subscription deadlines. Expired users can still read and contact support. This is not yet a full audit of every legacy API's billing enforcement.
- Record transport uses cursor pages of up to 500 rows, filtered by authorized entities. The UI still hydrates all authorized records for its existing reports; this is an incremental transport improvement, not a finished large-dataset architecture.
- Migration history and a PostgreSQL advisory lock serialize the two Railway service startups. Existing tariff edits no longer get overwritten by the seed script on restart.

## Telegram adapter ready, not enabled
`EDUKA_TELEGRAM_CENTERS` is a server-only JSON map keyed by center UUID. Each entry accepts `token`, `chatId`, and explicit boolean `payments` / `reminders`. No shared landing bot fallback is used. Configure via Railway secrets, never generic CRM fields or this document. Per-center recipient verification and a test delivery are required before enabling production notifications.

Database outbox commits together with a payment. Due task reminders are deduplicated by task/date using Asia/Tashkent dates. Workers claim one row at a time using SKIP LOCKED; Telegram errors are recorded. Unknown delivery is not automatically retried (to avoid duplicate messages). A crashed processing item needs manual reconciliation. Delivery status endpoint: `/api/crm/notification-status` for owner/director. The integration card shows configuration, not verified delivery.
Reference: https://core.telegram.org/bots/api#sendmessage

## Still outstanding / external prerequisites
- SMS: choose Eskiz/Playmobile/etc., provide a merchant account, approved sender/template and server credential; adapter and delivery tests are still pending.
- Online payments: merchant IDs, sandbox keys and per-center settlement model are missing. Click/Payme callbacks, idempotency, refunds, sandbox acceptance and fiscal linkage are still pending. References: https://docs.click.uz/ and https://developer.help.paycom.uz/metody-merchant-api/ . No live payment acceptance is claimed.
- Fiscal receipts: operator contract/configuration and fiscal product/tax fields are missing. Current receipt is an internal confirmation.
- Hikvision: device model/firmware, reachable endpoint, account and student/device identity mapping are missing. No device event adapter is claimed.
- AI support: provider/account, server key and allowed knowledge/data policy are missing. Current chat is operator-backed.
- Canonical legacy changes are now captured by PostgreSQL triggers and reconciled on CRM reads/writes. Existing rich fields are preserved; payments and cancellations refresh balances once. Direct edits to the legacy student balance column are deliberately not imported as money: financial adjustments must be ledger records. Legacy payroll tables outside the canonical map and external device/marketing schemas still need dedicated mappings.
- Automated off-host PostgreSQL backups, retention and a restore drill remain unverified. The available Railway connector exposes no backup management operation. Migration history is not a backup.
- Full responsive browser acceptance remains pending: the available browser blocked the local preview address. Build/types and isolated PostgreSQL/HTTP tests are not a substitute for that visual check.

## Verification
`npm run build` and `npm test`. Tests use a disposable PGlite PostgreSQL database and synthetic accounts; no production records or messages are created. They cover tenant separation, empty-center onboarding, staff login/revocation, CEO-token separation, payroll duplicate protection, ledger refunds/discounts, coins/rewards, operator replies, tariff caps/expiry, pagination and private files.
