# EduTrack Parent Portal

Monorepo: **frontend** (Vite/React) + **backend** (Express/MongoDB).

## Vercel — use two projects

| Vercel project | Root Directory | Framework preset | Env vars |
|----------------|----------------|------------------|----------|
| `edutrack-portal` (UI) | **`frontend`** | **Vite** | `VITE_API_URL=https://edutrack-backend.vercel.app` |
| `edutrack-backend` (API) | **`backend`** | **Other** (Express) | `MONGODB_URI`, `JWT_SECRET`, `ADMIN_API_KEY`, `FRONTEND_URL`, `NODE_ENV=production` |

Do **not** leave Root Directory empty on the frontend project. The repo root is configured for the API only (`server.js`, root `vercel.json`); an empty root on the portal project produces **404 NOT_FOUND** on `/`.

After changing Root Directory, redeploy and open `/` — you should see the login page, not a Vercel error page.

## Local development

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

See `backend/README.md` for API details.
