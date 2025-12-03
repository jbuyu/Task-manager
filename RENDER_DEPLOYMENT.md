# Render Deployment Guide

Complete guide to deploy the entire stack (PostgreSQL, Django backend, and React frontend) to Render using the `render.yaml` configuration file.

## Prerequisites

- GitHub account with this repository pushed
- Render account (sign up at [render.com](https://render.com))
- 5-10 minutes for initial deployment

---

## Quick Start: One-Click Deployment

### Step 1: Connect Repository to Render

1. Go to [render.com](https://render.com) and sign in (GitHub OAuth recommended)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Select the repository containing this project
5. Render will detect the `render.yaml` file automatically

### Step 2: Review Configuration

Render will show you a preview of what will be created:

- ✅ **PostgreSQL Database** (`task-management-db`)
- ✅ **Django Backend** (`task-management-backend`)
- ✅ **React Frontend** (`task-management-frontend`)

### Step 3: Deploy Everything

1. Click **"Apply"** or **"Create Blueprint"**
2. Render will automatically:
   - Provision PostgreSQL database
   - Build and deploy Django backend
   - Build and deploy React frontend
   - Set up all environment variables
   - Configure CORS and cookie settings
3. Wait 5-10 minutes for all services to deploy

### Step 4: Access Your Application

Once deployment completes:

1. **Frontend URL:** `https://task-management-frontend.onrender.com`
2. **Backend URL:** `https://task-management-backend.onrender.com`
3. Test the application by visiting the frontend URL

---

## What Render Does Automatically

The `render.yaml` file tells Render to:

### 1. Provision PostgreSQL Database
- Creates a PostgreSQL instance
- Generates connection string automatically
- Links it to the backend service

### 2. Build and Deploy Backend
- Installs Python dependencies
- Runs database migrations
- Starts Gunicorn server
- Sets up environment variables:
  - Database connection (from PostgreSQL service)
  - Secret key (auto-generated)
  - CORS origins (from frontend service)
  - Cookie settings for cross-origin

### 3. Build and Deploy Frontend
- Installs Node.js dependencies
- Builds React app with Vite
- Sets API URL (from backend service)
- Serves static files via CDN

### 4. Configure Environment Variables
- Automatically links services together
- Sets CORS origins based on actual service URLs
- Configures API URLs dynamically

---

## Manual Deployment (Alternative)

If you prefer to set up services manually instead of using the Blueprint:

### Step 1: Create PostgreSQL Database

1. Go to Render Dashboard → **"New +"** → **"PostgreSQL"**
2. Name: `task-management-db`
3. Database: `task_management`
4. User: `taskuser`
5. Plan: **Free** (or choose paid plan)
6. Click **"Create Database"**
7. **Note the connection string** (you'll need it later)

### Step 2: Create Backend Web Service

1. Go to Render Dashboard → **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `task-management-backend`
   - **Environment:** `Python 3`
   - **Region:** Choose closest to you
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt && python manage.py migrate`
   - **Start Command:** `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
4. Click **"Advanced"** → **"Add Environment Variable"**:
   ```
   DATABASE_URL=<paste connection string from Step 1>
   SECRET_KEY=<generate a secure random key>
   DEBUG=False
   ALLOWED_HOSTS=task-management-backend.onrender.com
   CORS_ALLOWED_ORIGINS=https://task-management-frontend.onrender.com
   CSRF_TRUSTED_ORIGINS=https://task-management-frontend.onrender.com
   SESSION_COOKIE_SECURE=True
   CSRF_COOKIE_SECURE=True
   SESSION_COOKIE_SAMESITE=None
   CSRF_COOKIE_SAMESITE=None
   DB_SSL=True
   ```
5. Click **"Create Web Service"**

### Step 3: Create Frontend Static Site

1. Go to Render Dashboard → **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `task-management-frontend`
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Click **"Advanced"** → **"Add Environment Variable"**:
   ```
   VITE_API_URL=https://task-management-backend.onrender.com/api
   ```
   (Update this after backend deploys with the actual backend URL)
5. Click **"Create Static Site"**

### Step 4: Update Backend CORS Settings

1. Once frontend deploys, note its URL
2. Go to backend service → **"Environment"** tab
3. Update `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` with the frontend URL
4. Render will automatically redeploy

---

## Creating Initial Users

After deployment, you need to create users. You have several options:

### Option 1: Use Django Admin (Recommended)

1. Create a superuser via Render Shell:
   - Go to backend service → **"Shell"** tab
   - Run:
     ```bash
     python manage.py createsuperuser
     ```
   - Follow prompts to create admin user
   - Access admin at: `https://task-management-backend.onrender.com/admin/`

2. Create test users via Django shell:
   ```bash
   python manage.py shell
   ```
   Then in the shell:
   ```python
   from users.models import User
   User.objects.create_user(username='admin', password='admin123', role='Admin', email='admin@example.com')
   User.objects.create_user(username='manager', password='manager123', role='Manager', email='manager@example.com')
   User.objects.create_user(username='member', password='member123', role='Member', email='member@example.com')
   ```

### Option 2: Use the create_users.py Script

1. Go to backend service → **"Shell"** tab
2. Run:
   ```bash
   python create_users.py
   ```
3. This will create the three test users automatically

### Option 3: Add to Build Command (One-Time)

Temporarily modify the build command in Render:

1. Go to backend service → **"Settings"** → **"Build Command"**
2. Change to:
   ```
   pip install -r requirements.txt && python manage.py migrate && python create_users.py || true && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
   ```
3. Save and redeploy
4. After users are created, remove `python create_users.py || true &&` from the command

---

## Understanding render.yaml

The `render.yaml` file uses Render's Blueprint syntax:

```yaml
services:
  # Database service
  - type: pspg  # PostgreSQL
    name: task-management-db
    plan: free
    
  # Backend web service
  - type: web
    name: task-management-backend
    runtime: python
    buildCommand: ...
    startCommand: ...
    envVars:
      - key: DATABASE_URL
        fromDatabase: ...  # Auto-link to database
      - key: CORS_ALLOWED_ORIGINS
        fromService: ...   # Auto-link to frontend
        
  # Frontend static site
  - type: web
    name: task-management-frontend
    runtime: node
    buildCommand: ...
    envVars:
      - key: VITE_API_URL
        fromService: ...   # Auto-link to backend
```

**Key Features:**
- `fromDatabase`: Automatically gets connection string from database service
- `fromService`: Automatically gets URL from another service
- `generateValue`: Render generates a secure random value
- Services are linked automatically

---

## Custom Domain Setup

### Add Custom Domain to Frontend

1. Go to frontend service → **"Settings"** → **"Custom Domains"**
2. Add your domain (e.g., `app.yourdomain.com`)
3. Follow DNS instructions to point domain to Render
4. Wait for SSL certificate (usually 1-2 minutes)

### Add Custom Domain to Backend

1. Go to backend service → **"Settings"** → **"Custom Domains"**
2. Add your domain (e.g., `api.yourdomain.com`)
3. Follow DNS instructions
4. Update environment variables:
   ```
   ALLOWED_HOSTS=task-management-backend.onrender.com,api.yourdomain.com
   CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
   CSRF_TRUSTED_ORIGINS=https://app.yourdomain.com
   ```
5. Update frontend environment variable:
   ```
   VITE_API_URL=https://api.yourdomain.com/api
   ```

---

## Troubleshooting

### Backend Issues

**Problem: Database connection errors**
- Verify `DATABASE_URL` is set correctly
- Check that PostgreSQL service is running
- Ensure `psycopg2-binary` is in `requirements.txt`

**Problem: Build fails**
- Check build logs for specific errors
- Verify Python version (Render uses Python 3.11 by default)
- Ensure all dependencies are in `requirements.txt`

**Problem: Migrations not running**
- Check build command includes `python manage.py migrate`
- Review build logs for migration errors
- Try running migrations manually via Shell

**Problem: CORS errors**
- Verify `CORS_ALLOWED_ORIGINS` includes frontend URL (with `https://`)
- Check that `CORS_ALLOW_CREDENTIALS=True` in Django settings
- Ensure `SESSION_COOKIE_SAMESITE=None` and `SESSION_COOKIE_SECURE=True`

**Problem: 500 errors**
- Check Render logs for detailed error messages
- Verify `SECRET_KEY` is set
- Ensure `DEBUG=False` in production

### Frontend Issues

**Problem: API requests failing**
- Verify `VITE_API_URL` is set correctly
- Check browser console for CORS errors
- Ensure backend URL is accessible

**Problem: Build fails**
- Check build logs for specific errors
- Verify Node.js version (Render uses Node 18+)
- Ensure all dependencies are in `package.json`

**Problem: Blank page**
- Check browser console for errors
- Verify API URL is correct
- Check that backend is running

### General Issues

**Problem: Services not linking**
- Verify service names match in `render.yaml`
- Check that all services are in the same Render account
- Ensure Blueprint was created correctly

**Problem: Environment variables not updating**
- Changes require redeployment
- Check that variables are set in correct service
- Verify variable names match exactly

**Problem: Slow cold starts**
- Render free tier spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Consider upgrading to paid plan for always-on service

---

## Render Free Tier Limitations

### Free Tier Limits:
- **Web Services:** Spin down after 15 minutes of inactivity
- **PostgreSQL:** 90 days retention, 1GB storage
- **Bandwidth:** 100GB/month
- **Build time:** 10 minutes max

### Free Tier Considerations:
- First request after spin-down has ~30-60 second cold start
- Database backups are automatic but limited retention
- Good for development/staging, consider paid for production

### Upgrading:
- **Starter Plan:** $7/month per service (always-on, no cold starts)
- **Professional Plan:** $25/month per service (more resources)

---

## Deployment Checklist

### Before Deployment
- [ ] Repository pushed to GitHub
- [ ] `render.yaml` file is in repository root
- [ ] `gunicorn` is in `backend/requirements.txt`
- [ ] `create_users.py` exists in backend directory (optional)

### After Deployment
- [ ] All three services deployed successfully
- [ ] Backend URL accessible
- [ ] Frontend URL accessible
- [ ] Database migrations ran successfully
- [ ] Test users created
- [ ] Frontend can connect to backend API
- [ ] Login works
- [ ] Session cookies are set
- [ ] Protected routes work

### Post-Deployment
- [ ] Test full application flow
- [ ] Verify CORS is working
- [ ] Check cookie settings
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring/alerts (optional)

---

## Continuous Deployment

Render automatically deploys when you push to your connected branch:

1. **Push to GitHub:** `git push origin main`
2. **Render detects changes:** Automatically starts new deployment
3. **Builds and deploys:** All services update automatically
4. **Zero downtime:** New version goes live after successful build

**Note:** Database migrations run automatically on each backend deployment (from build command).

---

## Cost Estimates

### Free Tier (Development/Staging)
- **PostgreSQL:** Free (90-day retention)
- **Backend Web Service:** Free (spins down after inactivity)
- **Frontend Static Site:** Free
- **Total:** $0/month

### Starter Plan (Production)
- **PostgreSQL:** $7/month
- **Backend Web Service:** $7/month (always-on)
- **Frontend Static Site:** Free
- **Total:** ~$14/month

### Professional Plan (High Traffic)
- **PostgreSQL:** $20/month
- **Backend Web Service:** $25/month
- **Frontend Static Site:** Free
- **Total:** ~$45/month

---

## Next Steps

1. **Monitor deployments:** Check Render dashboard for logs and metrics
2. **Set up alerts:** Configure email notifications for deployment failures
3. **Backup strategy:** Render handles PostgreSQL backups automatically
4. **Custom domains:** Add your own domain for a professional look
5. **Environment management:** Create separate Blueprints for staging/production

---

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Render Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Django on Render Guide](https://render.com/docs/deploy-django)
- [Static Sites on Render](https://render.com/docs/static-sites)
- Project README.md for local development setup

---

## Comparison: Blueprint vs Manual Setup

| Feature | Blueprint (render.yaml) | Manual Setup |
|---------|------------------------|--------------|
| Setup Time | 5 minutes | 15-20 minutes |
| Environment Variables | Auto-configured | Manual setup |
| Service Linking | Automatic | Manual |
| Updates | Easy (edit YAML) | Manual per service |
| Best For | New deployments | Existing services |

**Recommendation:** Use Blueprint for new deployments, manual setup for existing services or fine-grained control.

