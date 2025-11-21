# Deployment Guide

This document describes how to deploy the Team Task Management System on an Ubuntu 22.04 VPS with Django (Gunicorn) and React (static build) behind Nginx with HTTPS via Certbot.

## 1. Prerequisites

- Ubuntu 22.04 server with sudo access and DNS pointing to the host
- Python 3.12, Node.js 18+, and PostgreSQL 15 (optional if you prefer SQLite)
- System packages: `nginx`, `git`, `python3-venv`, `build-essential`, `ufw`, `certbot`, `python3-certbot-nginx`

## 2. Clone Repository

```bash
sudo mkdir -p /opt/task-app
sudo chown $USER /opt/task-app
cd /opt/task-app
git clone https://github.com/<your-org>/task-app.git .
```

## 3. Backend Setup (Gunicorn)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip wheel
pip install -r requirements.txt gunicorn psycopg2-binary
```

Create `.env` (copy `.env.example`) and set production values:

```
SECRET_KEY=change-me
DEBUG=False
DB_HOST=127.0.0.1
DB_NAME=task_app
DB_USER=task_app
DB_PASS=<secure-password>
ALLOWED_HOSTS=your-domain.com
CSRF_TRUSTED_ORIGINS=https://your-domain.com
```

Apply migrations and collect static assets:

```bash
python manage.py migrate
python manage.py collectstatic
```

### systemd service

`/etc/systemd/system/task-backend.service`:

```
[Unit]
Description=Task Management Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/task-app/backend
Environment="DJANGO_SETTINGS_MODULE=core.settings"
EnvironmentFile=/opt/task-app/backend/.env
ExecStart=/opt/task-app/backend/.venv/bin/gunicorn core.wsgi:application --bind 127.0.0.1:8001 --workers 3
Restart=always

[Install]
WantedBy=multi-user.target
```

Reload and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now task-backend
```

## 4. Frontend Build

```bash
cd /opt/task-app/frontend
npm install
npm run build
```

Copy the build to a static directory:

```bash
sudo mkdir -p /var/www/task-frontend
sudo cp -r dist/* /var/www/task-frontend/
```

## 5. Nginx Configuration

Create `/etc/nginx/sites-available/task-app`:

```
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /var/www/task-frontend;
        try_files $uri /index.html;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/task-app /etc/nginx/sites-enabled/task-app
sudo nginx -t
sudo systemctl reload nginx
```

## 6. HTTPS with Certbot

```bash
sudo certbot --nginx -d your-domain.com
```

Certbot updates Nginx to redirect HTTP → HTTPS and installs a renewal timer automatically.

## 7. Deployment Checklist

- [ ] `.env` populated with production secrets
- [ ] Database created with least-privilege user
- [ ] `python manage.py migrate` run
- [ ] `npm run build` executed and files deployed
- [ ] Gunicorn systemd service enabled and healthy
- [ ] Nginx proxy live with HTTPS via Certbot
- [ ] Admin credentials stored securely
- [ ] Monitoring/alerts configured (optional)

Keep `scripts/run_backend.sh` for local development; production uses Gunicorn + systemd.

