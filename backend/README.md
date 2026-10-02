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

1. Create a Vercel project from this repo.
2. **Root Directory:** set to `backend` (Project → Settings → General).
3. Add env vars: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_API_KEY`, `FRONTEND_URL`, `NODE_ENV=production`.
4. Deploy, then open `GET /api/health` on your deployment URL (JSON, not HTML 404).

If Root Directory is left at the repo root, the root `vercel.json` + `api/index.js` fallback is used instead.

## Deployment (100% Free on Render.com)

1. Create a free MongoDB Atlas database cluster and obtain the `MONGODB_URI`.
2. Push this directory to a GitHub repository.
3. Create a new Web Service on [Render.com](https://render.com).
4. Set environment variables on Render: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_API_KEY`, `FRONTEND_URL`.
5. Set build command: `npm install` and start command: `npm start`.
6. To prevent Render's free tier from sleeping after 15 minutes, set up a free monitor at [UptimeRobot.com](https://uptimerobot.com) pinging `https://your-backend.onrender.com/api/health` every 5 minutes.
