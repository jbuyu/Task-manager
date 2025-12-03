# Railway + Vercel Deployment Guide

Complete step-by-step guide to deploy the Django backend to Railway and the React frontend to Vercel.

## Prerequisites

- GitHub account with this repository pushed
- Railway account (sign up at [railway.app](https://railway.app))
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Basic understanding of environment variables

---

## Part 1: Deploy Backend to Railway

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in (GitHub OAuth recommended)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository from the list
5. Railway will create a new project

### Step 2: Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically provision a PostgreSQL database
4. **Important:** Note the database name (e.g., `railway`)

### Step 3: Configure Backend Service

1. In your Railway project, you should see a service (if not, click **"+ New"** → **"GitHub Repo"** → select your repo)
2. Click on the service to open its settings
3. Go to the **"Settings"** tab
4. Under **"Root Directory"**, set it to: `backend`
5. Under **"Build Command"**, leave it empty (Railway will auto-detect)
6. Under **"Start Command"**, set it to:
   ```
   python manage.py migrate && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
   ```

### Step 4: Install Gunicorn

1. Open `backend/requirements.txt`
2. Add `gunicorn` if it's not already there:
   ```
   Django>=5.0,<6.0
   djangorestframework>=3.14.0
   psycopg2-binary>=2.9.0
   python-dotenv>=1.0.0
   django-cors-headers>=4.0.0
   django-filter>=24.0
   dj-database-url>=2.2.0
   gunicorn>=21.2.0
   ```
3. Commit and push this change to GitHub

### Step 5: Set Environment Variables

1. In Railway, go to your backend service
2. Click on the **"Variables"** tab
3. Click **"+ New Variable"** and add the following:

   **Required Variables:**
   ```
   DATABASE_URL=<automatically set by Railway PostgreSQL>
   ```
   (Railway automatically sets this when you add PostgreSQL - you'll see it in the Variables tab)

   ```
   SECRET_KEY=<generate-a-secure-random-key>
   ```
   Generate a secret key:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(50))"
   ```

   ```
   DEBUG=False
   ```

   ```
   ALLOWED_HOSTS=*.up.railway.app,your-custom-domain.com
   ```
   (Replace `your-custom-domain.com` if you have one, otherwise just use `*.up.railway.app`)

   ```
   CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app
   ```
   (We'll update this after deploying to Vercel - use placeholder for now)

   ```
   CSRF_TRUSTED_ORIGINS=https://your-app.vercel.app
   ```
   (We'll update this after deploying to Vercel - use placeholder for now)

   ```
   SESSION_COOKIE_SECURE=True
   CSRF_COOKIE_SECURE=True
   SESSION_COOKIE_SAMESITE=None
   CSRF_COOKIE_SAMESITE=None
   ```
   (Required for cross-origin cookies between Vercel and Railway)

   **Optional but Recommended:**
   ```
   DB_SSL=True
   ```

### Step 6: Deploy Backend

1. Railway will automatically detect your GitHub push and start deploying
2. You can watch the deployment logs in the **"Deployments"** tab
3. Wait for the deployment to complete (usually 2-5 minutes)
4. Once deployed, Railway will assign a URL like: `https://your-backend-production.up.railway.app`
5. **Copy this URL** - you'll need it for the frontend configuration

### Step 7: Verify Backend Deployment

1. Test the backend API:
   ```bash
   curl https://your-backend-production.up.railway.app/api/auth/me/
   ```
   You should get a `401 Unauthorized` response (this is expected - it means the API is working)

2. Check Railway logs:
   - Go to your service → **"Deployments"** tab
   - Click on the latest deployment
   - Check for any errors in the logs

### Step 8: Run Database Migrations

Migrations should run automatically from the start command, but verify:

1. Go to your Railway service → **"Deployments"** tab
2. Check the logs for: `Operations to perform:`
3. If migrations didn't run, you can trigger them manually:
   - Go to **"Settings"** → **"Deploy"**
   - Click **"Redeploy"**

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Install Vercel CLI (Optional)

You can deploy via the web interface, but CLI is useful for testing:

```bash
npm i -g vercel
```

### Step 2: Prepare Frontend for Production

1. The `vercel.json` file is already configured in the project root
2. Verify your frontend build works locally:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
   This should create a `dist/` folder without errors

### Step 3: Deploy via Vercel Web Interface

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub OAuth recommended)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset:** Vite (should auto-detect)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (should auto-detect)
   - **Output Directory:** `dist` (should auto-detect)
   - **Install Command:** `npm install` (should auto-detect)

### Step 4: Set Environment Variables in Vercel

1. In your Vercel project settings, go to **"Environment Variables"**
2. Add the following variable:

   ```
   VITE_API_URL=https://your-backend-production.up.railway.app/api
   ```
   (Replace with your actual Railway backend URL from Step 6)

3. Make sure to set it for:
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development** (optional, for local dev)

### Step 5: Deploy Frontend

1. Click **"Deploy"**
2. Vercel will:
   - Install dependencies
   - Build your React app
   - Deploy to their CDN
3. Wait for deployment to complete (usually 1-2 minutes)
4. Once deployed, Vercel will assign a URL like: `https://your-app.vercel.app`
5. **Copy this URL** - you'll need it to update backend CORS settings

### Step 6: Update Backend CORS Settings

Now that you have your Vercel URL, update Railway backend environment variables:

1. Go back to Railway → Your backend service → **"Variables"** tab
2. Update `CORS_ALLOWED_ORIGINS`:
   ```
   CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app
   ```
   (Vercel creates multiple URLs - include both the main one and preview URLs)

3. Update `CSRF_TRUSTED_ORIGINS`:
   ```
   CSRF_TRUSTED_ORIGINS=https://your-app.vercel.app
   ```

4. Railway will automatically redeploy with the new environment variables

### Step 7: Verify Full Stack Deployment

1. **Test Frontend:**
   - Open `https://your-app.vercel.app` in your browser
   - You should see the login page

2. **Test API Connection:**
   - Open browser DevTools → Network tab
   - Try to log in with test credentials
   - Check that API requests go to your Railway backend URL
   - Verify cookies are being set (check Application → Cookies)

3. **Test Authentication:**
   - Log in with test credentials (you may need to create users in the database first)
   - Verify session cookies are working
   - Check that you can navigate to protected routes

---

## Part 3: Create Initial Users

Since your database is empty, you'll need to create users. You have two options:

### Option A: Django Admin (Recommended)

1. Create a superuser:
   - In Railway, go to your backend service → **"Deployments"** tab
   - Click on the latest deployment → **"View Logs"**
   - Or use Railway's CLI/terminal feature if available

2. Alternatively, add this to your start command temporarily:
   ```
   python manage.py migrate && python manage.py createsuperuser --noinput --username admin --email admin@example.com || true && python manage.py shell -c "from users.models import User; User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123')" && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
   ```

### Option B: Use Django Shell via Railway

1. Railway doesn't have a direct shell, but you can create a one-time script:

   Create `backend/create_users.py`:
   ```python
   import os
   import django
   
   os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
   django.setup()
   
   from users.models import User
   
   # Create test users
   users = [
       {'username': 'admin', 'password': 'admin123', 'role': 'Admin', 'email': 'admin@example.com'},
       {'username': 'manager', 'password': 'manager123', 'role': 'Manager', 'email': 'manager@example.com'},
       {'username': 'member', 'password': 'member123', 'role': 'Member', 'email': 'member@example.com'},
   ]
   
   for user_data in users:
       if not User.objects.filter(username=user_data['username']).exists():
           User.objects.create_user(**user_data)
           print(f"Created user: {user_data['username']}")
       else:
           print(f"User {user_data['username']} already exists")
   ```

2. Add to start command temporarily:
   ```
   python manage.py migrate && python create_users.py && gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
   ```

3. After users are created, remove `python create_users.py &&` from the start command

---

## Part 4: Custom Domain (Optional)

### Add Custom Domain to Vercel

1. In Vercel project settings → **"Domains"**
2. Add your custom domain (e.g., `app.yourdomain.com`)
3. Follow DNS instructions to point your domain to Vercel
4. Wait for SSL certificate provisioning (usually 1-2 minutes)

### Add Custom Domain to Railway Backend

1. In Railway backend service → **"Settings"** → **"Networking"**
2. Add your custom domain (e.g., `api.yourdomain.com`)
3. Update Railway environment variables:
   ```
   ALLOWED_HOSTS=*.up.railway.app,api.yourdomain.com
   CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
   CSRF_TRUSTED_ORIGINS=https://app.yourdomain.com
   ```

4. Update Vercel environment variable:
   ```
   VITE_API_URL=https://api.yourdomain.com/api
   ```

---

## Troubleshooting

### Backend Issues

**Problem: Database connection errors**
- Verify `DATABASE_URL` is set correctly in Railway Variables
- Check that PostgreSQL service is running
- Ensure `psycopg2-binary` is in `requirements.txt`

**Problem: Migrations not running**
- Check deployment logs for migration errors
- Verify start command includes `python manage.py migrate`
- Try redeploying the service

**Problem: 500 errors**
- Check Railway logs for detailed error messages
- Verify `SECRET_KEY` is set
- Check `DEBUG=False` in production (don't use `DEBUG=True`)

**Problem: CORS errors**
- Verify `CORS_ALLOWED_ORIGINS` includes your Vercel URL (with `https://`)
- Check that `CORS_ALLOW_CREDENTIALS=True` in Django settings (should be default)
- Ensure `SESSION_COOKIE_SAMESITE=None` and `SESSION_COOKIE_SECURE=True`

### Frontend Issues

**Problem: API requests failing**
- Verify `VITE_API_URL` is set correctly in Vercel environment variables
- Check browser console for CORS errors
- Ensure backend URL is accessible (try `curl https://your-backend.up.railway.app/api/auth/me/`)

**Problem: Cookies not working**
- Verify backend has `SESSION_COOKIE_SAMESITE=None` and `SESSION_COOKIE_SECURE=True`
- Check that `withCredentials: true` is set in API client (already configured)
- Ensure both frontend and backend are using HTTPS

**Problem: Build fails**
- Check Vercel build logs for specific errors
- Verify Node.js version (should be 18+)
- Ensure all dependencies are in `package.json`

### General Issues

**Problem: Changes not reflecting**
- Railway: Check that you've pushed changes to GitHub
- Vercel: Check that environment variables are set correctly
- Both: Wait a few minutes for deployments to complete

**Problem: Session not persisting**
- Verify cookie settings match between frontend and backend
- Check browser DevTools → Application → Cookies
- Ensure `SESSION_COOKIE_SAMESITE=None` (required for cross-origin)

---

## Deployment Checklist

### Backend (Railway)
- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] Backend service configured with correct root directory
- [ ] Start command includes migrations and Gunicorn
- [ ] `gunicorn` added to `requirements.txt`
- [ ] All environment variables set:
  - [ ] `DATABASE_URL` (auto-set by Railway)
  - [ ] `SECRET_KEY`
  - [ ] `DEBUG=False`
  - [ ] `ALLOWED_HOSTS`
  - [ ] `CORS_ALLOWED_ORIGINS`
  - [ ] `CSRF_TRUSTED_ORIGINS`
  - [ ] `SESSION_COOKIE_SECURE=True`
  - [ ] `CSRF_COOKIE_SECURE=True`
  - [ ] `SESSION_COOKIE_SAMESITE=None`
  - [ ] `CSRF_COOKIE_SAMESITE=None`
- [ ] Backend deployed successfully
- [ ] Backend URL noted
- [ ] Test users created

### Frontend (Vercel)
- [ ] Vercel project created
- [ ] Repository connected
- [ ] Root directory set to `frontend`
- [ ] Build settings configured correctly
- [ ] `VITE_API_URL` environment variable set
- [ ] Frontend deployed successfully
- [ ] Frontend URL noted
- [ ] Backend CORS settings updated with Vercel URL

### Testing
- [ ] Frontend loads correctly
- [ ] API requests reach backend
- [ ] Login works
- [ ] Session cookies are set
- [ ] Protected routes work
- [ ] Logout works

---

## Cost Estimates

### Railway
- **Hobby Plan:** $5/month (includes $5 credit)
- **Pro Plan:** $20/month (includes $20 credit)
- PostgreSQL: Included in plan
- Bandwidth: Included

### Vercel
- **Hobby Plan:** Free (with limitations)
- **Pro Plan:** $20/month per user
- Bandwidth: 100GB/month on Hobby, unlimited on Pro

**Total Estimated Cost:** $5-25/month depending on plan choices

---

## Next Steps

1. **Set up monitoring:** Consider adding error tracking (Sentry, etc.)
2. **Set up CI/CD:** Both Railway and Vercel auto-deploy on git push
3. **Backup strategy:** Railway PostgreSQL backups are automatic
4. **Custom domains:** Add your own domain for a professional look
5. **Environment management:** Set up staging environments for testing

---

## Support Resources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- Project README.md for local development setup

