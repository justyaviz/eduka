# Eduka 22.7.1 — Student App Platform Promise Crash Fix

## Fixed

- Fixed production crash caused by missing `studentAppPlatformReadyPromise` declaration in `backend/server.js`.
- The server now safely reuses the Student App platform table initialization promise during schema bootstrap.
- Version updated to 22.7.1.

## Why it happened

`ensureSchema()` used `studentAppPlatformReadyPromise`, but the variable was not declared at module scope. In production this could throw a ReferenceError and show an error toast like:

```txt
studentAppPlatformReadyPromise is not defined
```

## Deploy note

Deploy normally. No SQL hotfix is required for this specific issue.
