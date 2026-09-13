# Weekly Report Generator & Team Dashboard

Node.js (Express) + MySQL backend implementing the assignment's
authentication, report/review workflow, projects, dashboard, and an AI Chat
Assistant foundation. Pairs with a frontend built separately.

## 1. Installing dependencies for backend

```bash
cd backend
npm install
```

Requires Node.js 18+ and a running MySQL 8.x server.

## 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` — your MySQL connection
- `JWT_SECRET` — any long random string
- `ANTHROPIC_API_KEY` — leave blank for now (see AI Chat Assistant section below)

## 3. Running the database

Create the database once (MySQL shell or GUI of your choice):

```sql
CREATE DATABASE weekly_reports_db;
```

Then create the tables from the models:

```bash
npm run db:init
```

Seed a realistic demo dataset (1 manager, 5 team members, 4 projects, 4 weeks
of reports per member across every status, including a full needs_correction
→ edited → resubmitted → approved cycle so version history has real data):

```bash
npm run db:seed
```

Demo logins (all seeded with password `Password123!`):
- Manager: `manager@example.com`
- Team members: `alex@example.com`, `jordan@example.com`, `sam@example.com`,
  `morgan@example.com`, `taylor@example.com`

## 4. Running the backend

```bash
npm run dev     # nodemon, auto-restarts on change
# or
npm start       # plain node
```

Server starts on `http://localhost:5000`
Health check: `GET /api/health`


## 5. Installing dependencies for frontend

```bash
cd frontend
npm install
```

## 6. Create a .env file for frontend
for backend url
``` bash
 VITE_API_URL = http://localhost:5000 
 ```

## API overview

All endpoints are namespaced under `/api`. Every route except
`/auth/register` and `/auth/login` requires `Authorization: Bearer <token>`.

| Area | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Users (manager only) | `GET /users`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id` |
| Projects | `GET/POST/PATCH/DELETE /projects`, `POST /projects/:id/assign` |
| Reports (own reports) | `POST /reports`, `GET /reports`, `GET /reports/:id`, `PUT /reports/:id`, `POST /reports/:id/submit`, `GET /reports/:id/versions`, `GET /reports/:id/versions/:versionId` |
| Review (manager only) | `GET /review/reports`, `GET /review/reports/:id`, `POST /review/reports/:id/approve`, `POST /review/reports/:id/request-changes`, `GET /review/reports/:id/comments` |
| Dashboard (manager only) | `GET /dashboard/summary`, `GET /dashboard/charts/tasks-trend`, `GET /dashboard/charts/status-by-member`, `GET /dashboard/charts/workload-by-project`, `GET /dashboard/charts/hours-by-type`, `GET /dashboard/activity-feed` |
| AI Chat Assistant (manager only, foundation) | `GET /ai/status`, `POST /ai/chat` |

Full endpoint list, request/response shapes, and design rationale are in
`BACKEND_REPORT.md`.

## AI Chat Assistant — status

The foundation is wired up (`src/services/ai.service.js`, `src/routes/ai.routes.js`)
but makes no external calls. `GET /api/ai/status` reports `{configured: false}`
until you set `ANTHROPIC_API_KEY` in `.env`. See `BACKEND_REPORT.md` for exactly
what's left to wire up once you have a key.

## Notes

- `npm run db:sync` uses `sequelize.sync({ alter: true })` for convenience.
  For production use, swap this for real migrations (`sequelize-cli`) — see
  "Possible future improvements" in `BACKEND_REPORT.md`.
- `npm run db:sync:force` drops and recreates all tables — use only in dev.
