## Backend Service

Express + Mongoose API providing authentication, donor/request management, inventory, admin analytics and Server-Sent Events (SSE) for real-time request updates.

### Tech Stack
- Node.js / Express
- MongoDB / Mongoose
- JWT auth (Bearer tokens)
- Role-based & ownership middleware
- SSE endpoint for live request stream
- SendGrid (optional) for email notifications

### Environment Variables (`.env`)
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=<strong_random_secret>
ADMIN_SECRET_KEY=<secret_for_admin_signup>
SENDGRID_API_KEY=
EMAIL_FROM=no-reply@example.com
NODE_ENV=development
CORS_ORIGIN= # optional comma-separated origins for production, e.g. https://your-frontend.vercel.app
```

### Install & Run (Dev)
```
npm install
npm run dev
```
API base: `http://localhost:5000/api/v1`

### Key Endpoints (Summary)
- POST /auth/signup, /auth/login
- POST /auth/signupAdmin (requires `secretKey`)
- GET /requests (list), POST /requests (create)
- GET /requests/stream (SSE live updates)
- GET /requests/:id
- PATCH /requests/:id/status (owner or donor)
- POST /requests/:id/fulfill (donor fulfill)
- GET /admin/overview (aggregated admin snapshot)

### SSE Usage
Connect to `/api/v1/requests/stream` with EventSource on the frontend. Each update emits JSON: `{ type, data }`.

### ObjectId Validation
Controllers validate ID format before querying to avoid CastErrors. Invalid IDs return `400 { error: 'Invalid ID format' }`.

### Indexes
Added on frequently filtered fields (users, donations, hospitals, requests) for performance.

### Deployment Notes
Set `NODE_ENV=production` in production. Keep secrets out of version control. Use reverse proxy (Nginx) if serving behind a domain. See `../DEPLOYMENT.md`.

### Troubleshooting
- CastError on `/requests/stream`: Ensure route order (/stream before `/:id`). Already fixed.
- Admin dashboard missing metrics: Confirm `/admin/overview` route deployed; frontend falls back gracefully.
- CORS issues: In production set `CORS_ORIGIN` to your frontend origin(s), e.g. `https://your-frontend.vercel.app`.

### License
Internal / Proprietary (update if needed).
