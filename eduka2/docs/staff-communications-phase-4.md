# Staff and communications — phase 4

- Staff access screen lists employee login, assigned access role and account status, with direct selection for editing and a browser-generated random password option. Passwords are cleared after saving and are not persisted in frontend storage.
- Staff access validates employee/custom role IDs before SQL queries. Employee archive disables the account and increments its authentication version; restoring the employee card does not silently enable login. Updating contact details no longer overwrites the separate account login or status.
- Telegram settings include a tenant-scoped, owner/director-only automatic notification history, paginated on the server in batches of 25. Tokens and message bodies are not returned by this endpoint.
- Queue processing rechecks notification category preferences and source record state. Cancelled payments and completed tasks are suppressed. Configuration decryption failure no longer leaves the claimed row indefinitely processing; one center's invalid config does not block reminder generation for others.
- Delivery state means Telegram accepted a message, not that a person read it. Unknown delivery is not automatically retried to avoid duplicates. Test messages are outside this history.

Validation: isolated integration tests cover staff ID validation, revoked sessions, restore behavior, Telegram status history, tenant boundaries, disabled categories and cancelled payments. Telegram calls are mocked; no real messages sent for testing. Frontend typecheck/build passes. Authenticated browser/mobile visual acceptance remains pending.

Limits: no SMS changes, live chat integration, automatic retry engine or recovery of previously stranded processing rows is introduced here. Staff-card job role and login access role remain distinct concepts.
