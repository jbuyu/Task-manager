# Vercel Deployment Guide

This guide covers deploying the frontend to Vercel. For the backend, we recommend using Railway, Render, or Fly.io (see below).

## Option 1: Frontend on Vercel + Backend on Railway (Recommended)

This is the easiest and most reliable approach.

### Step 1: Deploy Backend to Railway

Follow the Railway deployment guide in `README.md` (lines 77-122) to deploy your Django backend.

**Important:** Note your backend URL (e.g., `https://your-backend.up.railway.app`)

### Step 2: Deploy Frontend to Vercel

1. **Install Vercel CLI** (optional, you can also use the web interface):
   ```bash
   npm i -g vercel
   ```

2. **Create `vercel.json`** in the project root:
   ```json
   {
     "buildCommand": "cd frontend && npm install && npm run build",
     "outputDirectory": "frontend/dist",
     "devCommand": "cd frontend && npm run dev",
     "installCommand": "cd frontend && npm install",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://your-backend.up.railway.app/api/$1"
       }
     ]
   }
   ```

3. **Set Environment Variables in Vercel:**
   - Go to your Vercel project settings → Environment Variables
   - Add: `VITE_API_URL=https://your-backend.up.railway.app/api`
   - Make sure to set it for Production, Preview, and Development environments

4. **Deploy:**
   - **Via CLI:** Run `vercel` in the project root
   - **Via GitHub:** Connect your repo to Vercel and it will auto-deploy

5. **Update Backend CORS Settings:**
   - In Railway, update your backend's `CORS_ALLOWED_ORIGINS` to include your Vercel URL:
     ```
     CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
     ```
   - Update `CSRF_TRUSTED_ORIGINS` similarly:
     ```
     CSRF_TRUSTED_ORIGINS=https://your-app.vercel.app
     ```

### Step 3: Configure Session Cookies

Since frontend and backend are on different domains, you'll need to adjust cookie settings:

**Backend (Railway) environment variables:**
```
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_SAMESITE=None
CSRF_COOKIE_SECURE=True
CSRF_COOKIE_SAMESITE=None
```

**Note:** `SameSite=None` requires `Secure=True` (HTTPS), which Railway provides automatically.

## Option 2: Frontend on Vercel + Backend on Render

[Render](https://render.com/) is another good option for Django backends:

1. Create a new **Web Service** on Render
2. Connect your GitHub repo, set root directory to `backend/`
3. Build command: `pip install -r requirements.txt && python manage.py migrate`
4. Start command: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
5. Add PostgreSQL database
6. Set environment variables (same as Railway)
7. Follow Step 2 above for Vercel frontend deployment

## Option 3: Frontend on Vercel + Backend on Fly.io

[Fly.io](https://fly.io/) is great for Django apps:

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Create `fly.toml` in `backend/` directory
3. Deploy: `fly deploy`
4. Follow Step 2 above for Vercel frontend deployment

## Important Notes

### CORS Configuration

When frontend and backend are on different domains:
- Backend must allow the frontend origin in `CORS_ALLOWED_ORIGINS`
- Cookies require `SameSite=None` and `Secure=True` for cross-origin requests

### API URL Configuration

The frontend uses `VITE_API_URL` environment variable. Set this in Vercel:
- Production: `https://your-backend.up.railway.app/api`
- Preview: Same as production (or use a staging backend)
- Development: `http://localhost:8000/api` (for local dev)

### Custom Domain

If you add a custom domain to Vercel:
1. Update backend `CORS_ALLOWED_ORIGINS` to include your custom domain
2. Update `CSRF_TRUSTED_ORIGINS` similarly
3. Update `VITE_API_URL` in Vercel if needed

## Troubleshooting

### Cookies Not Working

- Ensure `SESSION_COOKIE_SAMESITE=None` and `SESSION_COOKIE_SECURE=True` in backend
- Check that `CORS_ALLOW_CREDENTIALS=True` in Django settings
- Verify `withCredentials: true` in frontend API client (already configured)

### CORS Errors

- Double-check `CORS_ALLOWED_ORIGINS` includes your Vercel URL (with `https://`)
- Ensure backend allows credentials: `CORS_ALLOW_CREDENTIALS=True`

### API Requests Failing

- Verify `VITE_API_URL` is set correctly in Vercel environment variables
- Check that the backend URL is accessible (try `curl https://your-backend.up.railway.app/api/auth/me/`)

## Why Not Deploy Django to Vercel?

While technically possible, Django on Vercel's serverless functions has significant drawbacks:

- **Cold starts**: First request after inactivity can take 5-10+ seconds
- **Execution limits**: Functions timeout after 10s (Hobby) or 60s (Pro)
- **Database connections**: Connection pooling doesn't work well with serverless
- **State management**: Django's middleware and session handling expect persistent processes
- **Complexity**: Requires significant modifications to work properly

**Recommendation:** Use Railway, Render, or Fly.io for Django backends. They're designed for long-running applications and provide better performance, reliability, and developer experience.

