# EduTrack Parent Portal Backend API

Production-ready REST API for the EduTrack Parent Student Results Portal. Built with Node.js, Express, and MongoDB.

## Features
- **Public Parent API**: Verify Student Barcode + Access Code, return JWT, serve student performance timeline & quiz history.
- **Admin Sync API**: Protected with `X-API-Key`. Enables seamless idempotent full sync from the EduTrack Electron App.
- **Security**: Rate limiting, Helmet HTTP headers, CORS origin protection, Mongo sanitization against NoSQL injection, bcrypt hashing for access codes.

## Quick Start (Local)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

## Deployment (Vercel)

Use a **separate** Vercel project for the API (not the Vite frontend).

1. Import this GitHub repo → new project (e.g. `edutrack-backend`).
2. **Settings → General → Root Directory:** `backend` (recommended).  
   Alternative: leave Root Directory **empty** (repo root uses root `server.js`).
3. **Settings → General → Framework Preset:** **Other** (must **not** be Vite).
4. **Build & Development:** leave **Build Command** and **Output Directory** empty (do not use “Static”).
5. **Environment variables:** `MONGODB_URI`, `JWT_SECRET`, `ADMIN_API_KEY`, `FRONTEND_URL`, `NODE_ENV=production`.
6. Deploy → **Deployment → Resources / Functions** must list **`api/index.js`** (Node). **Static only = wrong project or wrong Root Directory** (frontend uses static; backend must not).
7. Smoke test: `GET https://<your-backend>.vercel.app/api/health` → JSON `{ "status": "ok", ... }`.

If you still get `404 NOT_FOUND` (Vercel HTML), the preset or Root Directory is wrong — fix steps 2–4 and redeploy.

## Deployment (100% Free on Render.com)

1. Create a free MongoDB Atlas database cluster and obtain the `MONGODB_URI`.
2. Push this directory to a GitHub repository.
3. Create a new Web Service on [Render.com](https://render.com).
4. Set environment variables on Render: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_API_KEY`, `FRONTEND_URL`.
5. Set build command: `npm install` and start command: `npm start`.
6. To prevent Render's free tier from sleeping after 15 minutes, set up a free monitor at [UptimeRobot.com](https://uptimerobot.com) pinging `https://your-backend.onrender.com/api/health` every 5 minutes.
