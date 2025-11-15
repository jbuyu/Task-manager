# PostgreSQL Setup Guide

## Quick Setup

1. **Create the database** (choose one method):

   **Option A: Using psql (if in PATH)**

   ```bash
   createdb task_management
   ```

   **Option B: Using full path (if installed via Homebrew)**

   ```bash
   /opt/homebrew/bin/createdb task_management
   # or
   /usr/local/bin/createdb task_management
   ```

   **Option C: Using psql directly**

   ```bash
   psql postgres -c "CREATE DATABASE task_management;"
   ```

2. **Create `.env` file** in `backend/` directory:

   ```bash
   cp .env.example .env
   ```

3. **Edit `.env`** and set your PostgreSQL credentials:

   ```env
   SECRET_KEY=<generated-secret-key>
   DEBUG=True
   DB_NAME=task_management
   DB_USER=your_postgres_username
   DB_PASS=your_postgres_password  # Leave empty if no password
   DB_HOST=localhost
   DB_PORT=5432
   ```

4. **Run migrations**:

   ```bash
   cd backend
   source .venv/bin/activate
   python manage.py migrate
   ```

5. **Create test users** (if needed):
   ```bash
   python manage.py shell
   ```
   Then in the shell:
   ```python
   from users.models import User
   User.objects.create_user(username='admin', password='admin123', role='Admin')
   User.objects.create_user(username='manager', password='manager123', role='Manager')
   User.objects.create_user(username='member', password='member123', role='Member')
   ```

## Verify Connection

Test the connection:

```bash
python manage.py dbshell
```

If it connects, you're all set!

## Troubleshooting

- **"psql: command not found"**: Add PostgreSQL to your PATH or use full path
- **"password authentication failed"**: Check your DB_USER and DB_PASS in .env
- **"database does not exist"**: Create the database first (see step 1)
- **"connection refused"**: Make sure PostgreSQL is running:
  ```bash
  # macOS with Homebrew
  brew services start postgresql
  ```
