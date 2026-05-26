# Eduka 2.0 Railway Backend Root Fix

This package is compatible with a Railway service whose Root Directory is set to `backend`.

Railway settings:
- Root Directory: backend
- Build Command: npm run build
- Start Command: npm run start:safe
- Healthcheck Path: /api/health

The previous error `Failed to read app source directory` happens when Railway is configured to use `backend/` as Root Directory, but the GitHub repository does not contain a `backend` folder.
