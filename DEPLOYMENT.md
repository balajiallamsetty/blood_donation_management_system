# Deployment Guide

This guide outlines how to deploy the Blood Donation Management System in development, staging, and production. It includes manual Node.js deployment and an optional Docker Compose path.

## Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas connection string (recommended) or a reachable MongoDB 6+
- A domain (optional, for production)
- Admin secret to create the first admin user

Optional (for containerized deploys):
- Docker 24+ and Docker Compose v2

## Environment Variables

Create `backend/.env` with:

```
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<a_strong_random_secret>
ADMIN_SECRET_KEY=<secret_used_to_create_admin_accounts>
# Optional email (SendGrid)
SENDGRID_API_KEY=
EMAIL_FROM=no-reply@example.com
# Node env: set to production on prod
NODE_ENV=production
```

Create `frontend/.env` (optional, for Google Maps)

```
VITE_GOOGLE_MAPS_API_KEY=
VITE_API_BASE=http://localhost:5000/api/v1
```

Notes:
- The frontend already defaults to `http://localhost:5000/api/v1` in `src/api/Http.js`. You can override with `VITE_API_BASE` if you decide to make it configurable later.
- Never commit real secrets.

## One-Time Setup (Local Dev)

From `/backend`:
```
npm install
npm run dev
```

From `/frontend` (new terminal):
```
npm install
npm run dev
```

Open the app at the Vite dev URL (usually http://localhost:5173) and the backend at http://localhost:5000.

## Creating the First Admin

Call `POST /api/v1/auth/signupAdmin` with body:
```
{ "name":"Admin", "email":"admin@example.com", "password":"StrongPass123!", "secretKey":"<ADMIN_SECRET_KEY>" }
```
Use the returned token in the Admin dashboard.

## Production (Manual Node.js on a VM)

1. Provision a VM (Ubuntu 22.04 LTS or Windows Server is fine) and install Node 18 and MongoDB or use MongoDB Atlas.
2. Clone the repo and set `.env` files as above.
3. Build frontend:
```
cd frontend
npm ci
npm run build
```
4. Serve frontend build via a static server (choose one):
   - Easiest: `npm i -g serve` then `serve -s dist -l 5173` (or use Nginx/Apache)
   - Recommended: Use Nginx to reverse proxy `/` to frontend `dist` folder
5. Start backend:
```
cd backend
npm ci
NODE_ENV=production node server.js
```
6. Reverse proxy (optional):
   - Nginx proxies `/api/` to `http://localhost:5000/`
   - Serve frontend at `/`

### Nginx Sample (Ubuntu)

```
server {
  listen 80;
  server_name yourdomain.com;

  location /api/ {
    proxy_pass http://127.0.0.1:5000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    root /var/www/blood-frontend/dist;
    try_files $uri /index.html;
  }
}
```

## Production (Docker Compose)

A `docker-compose.yml` exists at repo root. If empty, create one like below:

```
version: "3.9"
services:
  mongo:
    image: mongo:7
    restart: unless-stopped
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  backend:
    build:
      context: ./backend
    environment:
      PORT: 5000
      MONGO_URI: mongodb://mongo:27017/blood
      JWT_SECRET: ${JWT_SECRET}
      ADMIN_SECRET_KEY: ${ADMIN_SECRET_KEY}
      SENDGRID_API_KEY: ${SENDGRID_API_KEY}
      EMAIL_FROM: ${EMAIL_FROM}
      NODE_ENV: production
    depends_on:
      - mongo
    ports:
      - "5000:5000"

  frontend:
    build:
      context: ./frontend
    environment:
      VITE_API_BASE: http://localhost:5000/api/v1
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  mongo_data:
```

Then run:
```
docker compose build
docker compose up -d
```

Note: If you prefer serving the frontend as a static site (recommended), you can replace the `frontend` service with an Nginx container serving the built `dist` directory.

## Security Hardening Checklist
- Set `NODE_ENV=production` in production
- Use long random `JWT_SECRET`
- Restrict admin creation with a strong `ADMIN_SECRET_KEY`
- Enable HTTPS via a reverse proxy (Nginx/Traefik) with TLS certificates (Let’s Encrypt)
- Configure CORS to only allow your frontend origin in production
- Store secrets using platform-specific secret managers (Azure Key Vault, AWS Secrets Manager, etc.)
- Create DB users with least privileges; restrict network access to MongoDB

## Backups & Monitoring
- Enable MongoDB backups (Atlas backup or cron dumps)
- Centralize logs (e.g., CloudWatch, ELK/Opensearch, Azure Monitor)
- Add health checks: `GET /` returns a simple JSON; optionally add `/healthz` with DB check

## Troubleshooting
- 304 or cached responses during dev: Dev server disables ETag and sets `Cache-Control: no-store`.
- SSE not connecting: Ensure `/api/v1/requests/stream` is not blocked by proxies and that it’s registered before param routes.
- 404 on `/admin/overview`: Restart backend to pick up new routes; frontend falls back to individual calls if unavailable.
- Mongoose CastError on `/:id`: Controllers validate ObjectId format to return 400 for invalid ids.

## CI/CD (Optional)
- Build frontend on push and upload `dist` as artifact
- Build and push backend Docker image to a registry
- Deploy via GitHub Actions to your server/VM or a container platform (ECS/AKS/Heroku/Render/Fly.io)

---
If you want, I can tailor a production-ready `docker-compose.yml` or add a simple Nginx container to serve the frontend `dist`. Let me know your target host (Linux/Windows, with/without Docker) and database (Atlas vs self-hosted).