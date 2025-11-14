# Team Task Management System — Full Project Specification (Complete)

## 1. Overview

A full-stack Task Management Web Application for small teams. The system includes role-based permissions, session authentication, task CRUD operations, user management, and cloud deployment.

Technologies:

- **Frontend:** React 18+, TanStack Router, React Query, TypeScript, Tailwind (shadcn)
- **Backend:** Django 5+, Django REST Framework, Session Authentication
- **Database:** PostgreSQL (recommended)
- **Deployment:** Nginx + Gunicorn, Ubuntu VPS (DigitalOcean), HTTPS via Certbot

---

## 2. Core Functional Requirements

### 2.1 Authentication & Authorization

- Session-based login/logout using Django sessions.
- Middleware for CSRF protection.
- Roles:
  - **Admin:** full control (users, roles, tasks)
  - **Manager:** create/edit/assign tasks
  - **Member:** view/update assigned tasks
- Permissions enforced at both backend (DRF Permission Classes) and frontend (router guards).

### 2.2 Task Management

- Create, update, delete tasks
- Fields:
  - Title, description
  - Status: Todo / In Progress / Done
  - Deadline (datetime)
  - Assignee (FK → User)
- Features:
  - Filter by status
  - Filter by assignee
  - Manager can assign tasks
  - Member can update only their assigned tasks

### 2.3 User Management (Admin Only)

- Create users
- Edit user roles
- Activate/deactivate accounts
- List users with pagination

---

## 3. Backend Specification (Django + DRF)

### 3.1 Folder Structure

```
backend/
  manage.py
  core/
    settings.py
    urls.py
    wsgi.py
  users/
    models.py
    views.py
    serializers.py
    permissions.py
  tasks/
    models.py
    views.py
    serializers.py
    permissions.py
  auth/
    views.py
    serializers.py
```

### 3.2 Database Schema

#### Users

| Field     | Type                       | Notes        |
| --------- | -------------------------- | ------------ |
| id        | int                        | PK           |
| username  | string                     | unique       |
| email     | string                     | optional     |
| role      | enum(Admin/Manager/Member) | RBAC         |
| is_active | bool                       | default True |
| password  | hashed                     | —            |

#### Tasks

| Field       | Type     |
| ----------- | -------- |
| id          | int      |
| title       | string   |
| description | text     |
| status      | enum     |
| deadline    | datetime |
| assignee    | FK(User) |
| created_at  | datetime |
| updated_at  | datetime |

### 3.3 API Endpoints

#### Auth

- `POST /api/auth/login/`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`

#### Users (Admin)

- `GET /api/users/`
- `POST /api/users/`
- `PUT /api/users/{id}/`
- `DELETE /api/users/{id}/`

#### Tasks

- `GET /api/tasks/`
- `POST /api/tasks/`
- `GET /api/tasks/{id}/`
- `PUT /api/tasks/{id}/`
- `DELETE /api/tasks/{id}/`

### 3.4 Permission Classes

- `IsAdmin`
- `IsManagerOrAdmin`
- `IsAssigneeOrAdmin`
- `IsAuthenticated`

---

## 4. Frontend Specification (React + TanStack Router + React Query)

### 4.1 Folder Structure

```
frontend/
  src/
    api/
      auth.ts
      users.ts
      tasks.ts
    features/
      auth/
      users/
      tasks/
    components/
    pages/
      LoginPage.tsx
      Dashboard.tsx
      TasksPage.tsx
      UsersPage.tsx
      ProfilePage.tsx
    router/
      index.tsx
    hooks/
    utils/
```

### 4.2 Routing (TanStack Router)

- `/login`
- `/dashboard`
- `/tasks`
- `/tasks/:id`
- `/users` (admin only)
- `/profile`

Router Guards:

- redirect to `/login` if no session
- restrict user pages by role

### 4.3 React Query Integration

- Global QueryClient
- Query keys:
  - `["auth.me"]`
  - `["tasks"]`
  - `["users"]`
- Auto-refetch on focus

### 4.4 UI Requirements

- Clean, simple, functional
- Basic layout:
  - Sidebar (Dashboard, Tasks, Users, Profile)
  - Header (Logout)
- Forms:
  - Login form
  - Create/Edit task
  - User management

---

## 5. Deployment Specification

### 5.1 Backend Deployment

- Ubuntu 22.04 VPS
- Install Python 3.12, pip, venv
- Create systemd service for Gunicorn
- Nginx reverse proxy:
  - `/api/ → gunicorn`
  - `/ → React build`

### 5.2 Frontend Deployment

- Build React: `npm run build`
- Serve static files via Nginx

### 5.3 HTTPS

- Install certbot
- Generate certificates for domain

---

## 6. Environment Variables

### Backend `.env`

```
SECRET_KEY=
DEBUG=False
DB_HOST=
DB_NAME=
DB_USER=
DB_PASS=
DB_PORT=
```

### Frontend `.env`

```
VITE_API_URL="https://your-domain.com/api"
```

---

## 7. Testing Strategy

### Backend

- DRF API tests
- Permission tests
- Model tests

### Frontend

- Component tests (Vitest)
- API service tests (MSW)
- Route guard tests

---

## 8. Deliverables Checklist

- Frontend repository
- Backend repository
- README with setup instructions
- Full deployment on DigitalOcean
- Admin test credentials
- Architecture explanation doc

---

## 9. Roadmap (Recommended Order)

1. Set up Django project
2. Build Users app
3. Build Auth (session-based)
4. Build Tasks app
5. Configure permissions
6. Set up React + TanStack Router
7. Implement React Query + API services
8. Build pages progressively
9. Local staging test
10. Deploy backend
11. Deploy frontend
12. Final polish and docs

---

**End of Spec File.**
