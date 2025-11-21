# Team Task Management System

Full-stack task management application for small teams with role-based permissions and session authentication.

## Project Structure

This is a monorepo containing:

- **`/frontend`** - React 18 + TypeScript + Vite + TanStack Router + React Query
- **`/backend`** - Django 5+ + Django REST Framework + PostgreSQL

See [`team-task-management-spec.md`](./team-task-management-spec.md) for the complete specification.

## Quick Start

### Prerequisites

- **Python 3.10+** (required for Django 5)
- **Node.js 18+**
- **PostgreSQL** (optional; SQLite used for local dev if DB env vars not set)

### Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Copy .env.example to .env and configure (optional for local dev)
# For local dev, SQLite will be used if DB env vars are not set

python manage.py migrate
python manage.py runserver
```

The backend will run on `http://localhost:8000`.

#### One-command helper

For convenience, you can run everything above with:

```bash
./scripts/run_backend.sh
```

This script will create/activate the virtual environment (if needed), install dependencies, run migrations, and start the development server.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`.

## Deployment

The repository includes everything required to deploy on a VPS with Nginx + Gunicorn:

- `deploy/nginx.conf` – sample reverse proxy/static hosting config
- `deploy/gunicorn.service` – systemd unit for the Django backend
- `deploy/env.production.example` – environment variable template (copy to `/opt/task-app/backend/.env`)
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) – step-by-step server guide (packages, build, TLS)

High-level steps:

1. Provision an Ubuntu VPS (e.g., DigitalOcean) and clone this repo to `/opt/task-app`.
2. Configure backend env vars from `deploy/env.production.example` (secrets, DB credentials, allowed hosts).
3. Create a Python venv, install backend requirements + Gunicorn, run `migrate`/`collectstatic`.
4. Build the frontend (`npm run build`) and copy `frontend/dist` to `/var/www/task-frontend`.
5. Install the provided `gunicorn.service` and `nginx.conf`, then run Certbot to enable HTTPS.
6. Restart Nginx/Gunicorn; the SPA will be served via Nginx with `/api` proxied to Gunicorn.

### Railway Deployment

[Railway](https://railway.com/) can host multi-service apps (web + db) directly from your GitHub repo with containerized builds, instant Postgres provisioning, and built-in logs/metrics, so it’s a good fit for staging or production.

#### 1. Prep the repo

- Backend now reads `DATABASE_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS` from env vars; no extra code changes needed.
- Ensure `frontend/.env.production` contains `VITE_API_URL=https://<backend-service>.up.railway.app/api` (the backend public URL once known). For local testing you can keep the default.

#### 2. Create a Railway project

1. Sign in at Railway and create a new project.
2. Add a **PostgreSQL** resource (Railway will generate `DATABASE_URL`, `PGHOST`, `PGUSER`, `PGPASSWORD`, etc.).

#### 3. Deploy the backend service

1. Click _New Service → Deploy from GitHub_, select this repo, and point it to the `backend/` directory.
2. In the **Variables** tab, set:
   - `DATABASE_URL` (copy from the Railway Postgres resource)
   - `SECRET_KEY`, `ALLOWED_HOSTS=<backend-subdomain>.up.railway.app`, `CSRF_TRUSTED_ORIGINS=https://<backend-subdomain>.up.railway.app`, `CORS_ALLOWED_ORIGINS=https://<frontend-subdomain>.up.railway.app` (or `*` temporarily)
   - `DEBUG=False`, `SESSION_COOKIE_SECURE=True`, `CSRF_COOKIE_SECURE=True`
3. Set the start command to:
   ```
   python manage.py migrate && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
   ```
   Railway automatically injects `$PORT`.
4. Trigger a deploy; the backend will be reachable at `https://<backend-subdomain>.up.railway.app`.

#### 4. Deploy the frontend service

1. Add another Railway service from the same GitHub repo, root directory `frontend/`.
2. Add env vars:
   - `VITE_API_URL=https://<backend-subdomain>.up.railway.app/api`
3. Configure build/start commands (Railway auto-detects Vite, but you can override):
   - Build: `npm install && npm run build`
   - Start (Static): `npm run preview -- --host 0.0.0.0 --port $PORT`
   - For pure static hosting, you can instead select “Static Site” and point it at `dist/`.
4. After deploy, the frontend will be available at `https://<frontend-subdomain>.up.railway.app`.

#### 5. Wire everything up

- Update backend `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` with the frontend URL; update frontend `VITE_API_URL` if you later connect a custom domain.
- Use Railway’s Domains tab to add custom domains for each service if needed.
- Verify `/api/auth/me/` works via the frontend and that session cookies are sent (Railway already terminates HTTPS).

Railway’s metrics/logs view (per service) makes it easy to monitor deploys and scale vertically/horizontally when needed. When you push to the tracked branch, Railway rebuilds automatically; use PR environments for preview deploys if desired.

## Environment Variables

### Backend `.env` (optional for local dev)

```env
SECRET_KEY=your-secret-key-here
DEBUG=True

# PostgreSQL (leave empty to use SQLite for local dev)
DB_HOST=localhost
DB_NAME=
DB_USER=
DB_PASS=
DB_PORT=5432
```

### Frontend `.env` (optional)

```env
VITE_API_URL=http://localhost:8000/api
```

## Security Considerations

### Session Cookies

- **HttpOnly**: Enabled to prevent XSS attacks
- **Secure**: Set to `True` in production (requires HTTPS)
- **SameSite**: Set to `Lax` to prevent CSRF while allowing same-site requests

### CSRF Protection

- CSRF tokens are sent via cookies and read by the frontend
- Frontend sends token in `X-CSRFToken` header
- Django's `CsrfViewMiddleware` validates tokens on state-changing requests

### CORS

- Configured for local development (`localhost:5173`)
- `CORS_ALLOW_CREDENTIALS = True` required for session cookies
- In production, configure specific allowed origins

## Testing

### Backend

```bash
cd backend
source .venv/bin/activate
python manage.py test
```

### Frontend

```bash
cd frontend
npm test
```

## Current Status

This is the initial scaffold iteration. The following are in place:

- ✅ Frontend: Vite + React + TypeScript + TanStack Router + React Query
- ✅ Frontend: Axios client with CSRF handling and session cookie support
- ✅ Backend: Django project with apps `authapp`, `users`, `tasks`
- ✅ Backend: DRF configured with SessionAuthentication
- ✅ Backend: `/api/auth/me/` endpoint (returns 401 for unauthenticated users)
- ✅ Smoke tests for both frontend and backend

## Next Steps

See the spec for the full roadmap. Next iterations will include:

- User model and authentication views
- Task model and CRUD endpoints
- Permission classes
- Frontend pages and routing
- Login/logout flows
