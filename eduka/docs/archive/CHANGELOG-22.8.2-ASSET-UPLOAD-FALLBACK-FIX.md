# Eduka 22.8.2 — Asset Upload Fallback Fix

## Fixed
- Student App profile photo upload no longer fails with a vague `Not Found` message when GitHub repo/token is missing, invalid, private without access, or misconfigured.
- GitHub upload remains the primary storage target when `GITHUB_ASSETS_TOKEN` and `GITHUB_ASSETS_REPO` are valid.
- If GitHub upload fails, Eduka now falls back to database storage so the student profile photo is still saved and immediately visible.
- Backend now returns clearer `storage`, `warning`, and `message` fields for asset uploads.

## Important Railway variables for GitHub storage

```env
GITHUB_ASSETS_TOKEN=github_pat_or_classic_token
GITHUB_ASSETS_REPO=justyaviz/eduka-assets
GITHUB_ASSETS_BRANCH=main
GITHUB_ASSETS_DIR=eduka-assets
ASSET_UPLOAD_FALLBACK=database
```

If you want uploads to fail instead of falling back to database, set:

```env
ASSET_UPLOAD_FALLBACK=off
```
