# Eduka 22.8.1 — GitHub Asset Storage

## Added
- Permanent GitHub-based image storage for:
  - student profile photos
  - teacher profile photos
  - center/branch logos
  - admin/user avatars via generic endpoint
- New backend endpoint: `POST /api/assets/upload`.
- New student endpoint: `POST /api/student-app/avatar`.
- New database table: `uploaded_assets`.
- New columns:
  - `students.avatar_url`
  - `teachers.avatar_url`
  - `users.avatar_url`
  - `organizations.logo_url`
- Student App profile edit drawer now supports profile photo upload.
- Admin/CRM profile pages now show image upload cards for students, teachers, and center logos.

## Required Railway Variables
- `GITHUB_ASSETS_TOKEN` — GitHub personal access token with contents write access.
- `GITHUB_ASSETS_REPO` — asset repo, example: `justyaviz/eduka-assets`.
- `GITHUB_ASSETS_BRANCH` — default: `main`.
- `GITHUB_ASSETS_DIR` — default: `eduka-assets`.

## Storage Path Format
Images are saved to GitHub like:

```txt
eduka-assets/<center-or-branch-name>/<entity>/<entity-id>/<timestamp>-<filename>.jpg
```

Example:

```txt
eduka-assets/edu-test/student/12/1710000000000-a1b2c3d4-profile.jpg
```

## Migration
- `backend/migrations/016_github_asset_storage.sql`
- hotfix: `backend/hotfix-22.8.1-github-assets.sql`
