# Deployment Guide: VEMRE HRIS

This guide outlines the steps to deploy the HRIS application to a live domain.

## 1. Backend Deployment (Django)
We recommend using a platform like **DigitalOcean**, **AWS**, or **PythonAnywhere**.

### Prerequisites
- Python 3.10+
- PostgreSQL (Recommended for production)
- Domain name with DNS access

### Steps
1. **Prepare Settings**: 
   Update `backend/backend/settings.py`:
   - `DEBUG = False`
   - `ALLOWED_HOSTS = ['yourdomain.com', 'api.yourdomain.com']`
   - Configure `DATABASES` for PostgreSQL.
2. **Environment Variables**: Use a `.env` file for `SECRET_KEY`, `DB_NAME`, `DB_USER`, etc.
3. **Static Files**: Run `python manage.py collectstatic`.
4. **Web Server**: Use **Gunicorn** or **uWSGI** with **Nginx** as a reverse proxy.

## 2. Frontend Deployment (React/Vite)
We recommend **Vercel**, **Netlify**, or hosting on the same server as the backend.

### Steps
1. **Environment Variables**:
   In `frontend/.env.production`, set:
   `VITE_API_URL=https://api.yourdomain.com/v1`
2. **Build**: Run `npm run build` in the `frontend` directory.
3. **Host**: Upload the contents of the `dist` folder to your static hosting provider or Nginx `/var/www/` directory.

## 3. SSL Configuration
Always use HTTPS. Use **Certbot** (Let's Encrypt) to generate free SSL certificates for your domain.

---
**Production Launch Checklist:**
- [ ] Change Superadmin default password.
- [ ] Ensure all CORS settings allow your frontend domain.
- [ ] Verify database backups are configured.
