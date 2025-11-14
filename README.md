# Team Task Management System

Full-stack task management application for small teams with role-based permissions and session authentication.

## Project Structure

This is a monorepo containing:

- **`/frontend`** - React 18 + TypeScript + Vite + TanStack Router + React Query
- **`/backend`** - Django 5+ + Django REST Framework + PostgreSQL

See [`team-task-management-spec.md`](./team-task-management-spec.md) for the complete specification.

## Quick Start

### Prerequisites

- **Python 3.10+** (required for Django 5; Python 3.9 uses Django 4.2)
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

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`.

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

