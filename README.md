# VEMRE HRIS - Performance Management System

VEMRE HRIS is a comprehensive Human Resource Information System built for **Vemre Aremu Enterprise Limited**. It provides a robust platform for managing departments, employees, and performance through a data-driven KPI engine.

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **npm** or **yarn**

---

## 📦 Installation & Setup

### 1. Backend Setup (Django)

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   ```powershell
   # Windows
   python -m venv venv
   .\venv\Scripts\activate
   
   # Mac/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Seed the database** (Recommended for first-time setup):
   *Run this from the project root directory:*
   ```bash
   cd ..
   python seed_data.py
   ```
   This will create:
   - Default departments (HR, Operations, Marketing, Accounting, Customer Service)
   - Job roles with pre-configured KPI templates
   - Admin and HR manager accounts (see credentials below)

6. **Start the development server**:
   ```bash
   cd backend
   python manage.py runserver
   ```
   The backend API will be available at `http://127.0.0.1:8000`.

---

### 2. Frontend Setup (React + Vite)

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure API URL** (Optional - for local development):
   Create a `.env.local` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

---

## 🔐 Login Credentials

After running the `seed_data.py` script, use these credentials to log in:

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `hr_admin` | `admin123` | Full system access, user management, all modules |
| **HR Manager** | `hr_manager_user` | `hr123` | HR operations, employee management, KPI entry |

> **⚠️ Important**: Change these default passwords immediately after first login via the **User Management** page.

### How to Login

1. Open your browser and navigate to `http://localhost:5173`
2. Enter your username and password
3. Click **Sign In**
4. You'll be redirected to the Dashboard

### Troubleshooting Login Issues

If you encounter a **Network Error** during login:

1. **Ensure the backend server is running**:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Check the API URL**: If you have a `frontend/.env.local` file, ensure it points to the correct backend:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```
   
3. **For network access issues**: If the `.env.local` file contains a hardcoded IP address (e.g., `192.168.1.10`), update it to your current local IP or use `localhost` for local-only access.

4. **Restart the frontend server** after changing `.env.local`:
   ```bash
   npm run dev
   ```

---

## 🌐 Network Access (Access from Other Devices)

To allow other devices on the same local network to access the VEMRE HRIS:

### 1. Find Your Local IP Address

**Windows**:
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (e.g., `192.168.1.10`)

**Mac/Linux**:
```bash
ifconfig
# or
ip addr show
```

### 2. Configure Frontend for Network Access

Create or update `frontend/.env.local`:
```env
VITE_API_URL=http://<YOUR_IP_ADDRESS>:8000/api
```
Replace `<YOUR_IP_ADDRESS>` with your actual IP (e.g., `192.168.1.10`)

### 3. Start Servers with Network Support

**Backend** (bind to all network interfaces):
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

**Frontend** (allow external connections):
```bash
cd frontend
npm run dev -- --host
```

### 4. Access from Other Devices

Other users on the same network can access the application at:
- **Frontend**: `http://<YOUR_IP_ADDRESS>:5173`
- **Backend API**: `http://<YOUR_IP_ADDRESS>:8000/api`

> **Note**: Ensure your firewall allows connections on ports 5173 and 8000.

---

## 🚀 Production Deployment

For production deployment on a web server, follow these comprehensive instructions.

### Prerequisites for Production

- **Linux server** (Ubuntu 20.04+ recommended)
- **Python 3.10+**
- **PostgreSQL** (recommended) or MySQL
- **Nginx** (reverse proxy)
- **Gunicorn** (WSGI server) or **Daphne/Uvicorn** (ASGI server)
- **Domain name** (optional but recommended)
- **SSL certificate** (Let's Encrypt recommended)

---

### Production Deployment Steps

#### 1. Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install python3-pip python3-venv nginx postgresql postgresql-contrib -y
```

#### 2. Database Setup (PostgreSQL)

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE vemre_hris;
CREATE USER vemre_user WITH PASSWORD 'your_secure_password';
ALTER ROLE vemre_user SET client_encoding TO 'utf8';
ALTER ROLE vemre_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE vemre_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE vemre_hris TO vemre_user;
\q
```

#### 3. Backend Deployment

```bash
# Clone or upload your project
cd /var/www
sudo git clone <your-repo-url> vemre-hris
cd vemre-hris/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn psycopg2-binary python-dotenv
```

#### 4. Configure Environment Variables

Create `backend/.env`:
```env
SECRET_KEY=your-very-secure-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,your-server-ip

# Database
DB_NAME=vemre_hris
DB_USER=vemre_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
```

Update `backend/core/settings.py` to use PostgreSQL (uncomment the PostgreSQL section):
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}
```

#### 5. Run Migrations and Collect Static Files

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser  # Create your production admin account
```

#### 6. Setup Gunicorn (WSGI Server)

Create `/etc/systemd/system/vemre-hris.service`:
```ini
[Unit]
Description=VEMRE HRIS Gunicorn Daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/vemre-hris/backend
Environment="PATH=/var/www/vemre-hris/backend/venv/bin"
ExecStart=/var/www/vemre-hris/backend/venv/bin/gunicorn \
          --workers 3 \
          --bind unix:/var/www/vemre-hris/backend/gunicorn.sock \
          core.wsgi:application

[Install]
WantedBy=multi-user.target
```

Start and enable the service:
```bash
sudo systemctl start vemre-hris
sudo systemctl enable vemre-hris
sudo systemctl status vemre-hris
```

#### 7. Alternative: Setup Daphne (ASGI Server)

For ASGI support (if you plan to add WebSockets/async features):

```bash
pip install daphne
```

Create `/etc/systemd/system/vemre-hris-asgi.service`:
```ini
[Unit]
Description=VEMRE HRIS Daphne ASGI Daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/vemre-hris/backend
Environment="PATH=/var/www/vemre-hris/backend/venv/bin"
ExecStart=/var/www/vemre-hris/backend/venv/bin/daphne \
          -u /var/www/vemre-hris/backend/daphne.sock \
          core.asgi:application

[Install]
WantedBy=multi-user.target
```

#### 8. Frontend Build

```bash
cd /var/www/vemre-hris/frontend

# Install dependencies
npm install

# Create production environment file
echo "VITE_API_URL=https://yourdomain.com/api" > .env.production

# Build for production
npm run build
```

#### 9. Nginx Configuration

Create `/etc/nginx/sites-available/vemre-hris`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React build)
    location / {
        root /var/www/vemre-hris/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://unix:/var/www/vemre-hris/backend/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Admin
    location /admin {
        proxy_pass http://unix:/var/www/vemre-hris/backend/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Static files
    location /static/ {
        alias /var/www/vemre-hris/backend/static/;
    }

    # Media files
    location /media/ {
        alias /var/www/vemre-hris/backend/media/;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/vemre-hris /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 10. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts to configure SSL. Certbot will automatically update your Nginx configuration.

#### 11. Security Hardening

```bash
# Set proper permissions
sudo chown -R www-data:www-data /var/www/vemre-hris
sudo chmod -R 755 /var/www/vemre-hris

# Protect sensitive files
sudo chmod 600 /var/www/vemre-hris/backend/.env

# Setup firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## ✨ Core Features

### 📋 HR Management
- **Departments**: Manage company structure and team metadata
- **Employees**: Maintain detailed employee records with **Bulk CSV Import**
- **Job Roles**: Define roles with specific KPI templates
- **RBAC**: Role-based access control (Admin, HR, Manager)

### 📈 KPI & Appraisal Engine
- **KPI Templates**: Pre-configured metrics for each job role
- **Monthly Entry**: Streamlined performance data entry
- **Auto-Scoring**: Weighted score calculation
- **Rankings**: Real-time performance leaderboards
- **Appraisal History**: Complete audit trail

### 📊 Analytics & Reporting
- **Dashboard**: Real-time workforce statistics
- **Performance Charts**: Visual performance trends
- **Department Analytics**: Team-level insights
- **Export Capabilities**: CSV/Excel export for reports

### 🛡️ Security & Compliance
- **Audit Logs**: Complete activity tracking
- **JWT Authentication**: Secure token-based auth
- **Role Permissions**: Granular access control
- **Data Validation**: Input sanitization and validation

---

## 📚 Additional Information

### Tech Stack

**Backend**:
- Django 5.2
- Django REST Framework
- SQLite (development) / PostgreSQL (production)
- JWT Authentication

**Frontend**:
- React 18
- TypeScript
- Vite
- TailwindCSS
- Axios

### Support & Maintenance

For technical support or feature requests, contact the development team.

---

*Developed for **Vemre Aremu Enterprise Limited** - A comprehensive HR performance management solution for real-world enterprise operations.*

*Powered by **Acenet Technology** - Email: ope_adedotun@live.com*
