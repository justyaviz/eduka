# Railway fix

This ZIP is flattened for Railway. `package.json` is at the ZIP root and includes:

- `npm run build`
- `npm run start:safe`

Railway settings:

- Root Directory: empty
- Build Command: `npm run build`
- Start Command: `npm run start:safe`
- Healthcheck Path: `/api/health`

The app serves the Vite build from `dist/` and returns 200 OK on `/api/health`.
