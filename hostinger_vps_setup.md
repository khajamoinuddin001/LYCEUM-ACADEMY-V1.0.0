# Hostinger VPS Deployment Guide - Lyceum Academy

Complete step-by-step guide to deploy Lyceum Academy on Hostinger VPS with PostgreSQL.

---

## 📋 Prerequisites

- Hostinger VPS account (recommended: VPS 1 or higher)
- Domain name pointed to your VPS IP
- SSH access to your VPS
- Basic terminal knowledge

---

## 🚀 Part 1: Initial VPS Setup

### 1.1 Connect to Your VPS

```bash
ssh root@your-vps-ip
```

### 1.2 Update System

```bash
apt update && apt upgrade -y
```

### 1.3 Create Non-Root User

```bash
adduser lyceum
usermod -aG sudo lyceum
su - lyceum
```

---

## 🗄️ Part 2: Install PostgreSQL

### 2.1 Install PostgreSQL 15

```bash
sudo apt install -y postgresql postgresql-contrib
```

### 2.2 Start PostgreSQL Service

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2.3 Create Database and User

```bash
sudo -u postgres psql
```

In PostgreSQL shell:

```sql
CREATE DATABASE lyceum_academy;
CREATE USER lyceum_user WITH ENCRYPTED PASSWORD 'your-strong-password-here';
GRANT ALL PRIVILEGES ON DATABASE lyceum_academy TO lyceum_user;
\q
```

### 2.4 Test Connection

```bash
psql -h localhost -U lyceum_user -d lyceum_academy
# Enter password when prompted
# Type \q to exit
```

---

## 📦 Part 3: Install Node.js & PM2

### 3.1 Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3.2 Verify Installation

```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### 3.3 Install PM2 Globally

```bash
sudo npm install -g pm2
```

---

## 🌐 Part 4: Install & Configure Nginx

### 4.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 4.2 Configure Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### 4.3 Test Nginx

```bash
sudo systemctl start nginx
sudo systemctl enable nginx
# Visit http://your-vps-ip in browser - you should see Nginx welcome page
```

---

## 📥 Part 5: Deploy Application

### 5.1 Install Git

```bash
sudo apt install -y git
```

### 5.2 Clone Your Repository

```bash
cd /home/lyceum
git clone https://github.com/yourusername/lyceum-academy.git
# OR upload files via SFTP to /home/lyceum/lyceum-academy
```

### 5.3 Install Dependencies

```bash
cd lyceum-academy

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 5.4 Create Environment File

```bash
cd server
nano .env
```

Add the following (replace with your actual values):

```env
DATABASE_URL=postgresql://lyceum_user:your-strong-password-here@localhost:5432/lyceum_academy
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=5002
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

Save and exit (Ctrl+X, then Y, then Enter)

### 5.5 Generate Strong JWT Secret

```bash
openssl rand -base64 32
# Copy the output and update JWT_SECRET in .env file
```

---

## 🏗️ Part 6: Build Frontend

### 6.1 Build Production Bundle

```bash
cd /home/lyceum/lyceum-academy
npm run build
```

This creates a `dist` folder with optimized frontend files.

### 6.2 Create Web Directory

```bash
sudo mkdir -p /var/www/lyceum-academy
sudo cp -r dist/* /var/www/lyceum-academy/
sudo chown -R www-data:www-data /var/www/lyceum-academy
```

---

## 🚀 Part 7: Start Backend with PM2

### 7.1 Start Application

```bash
cd /home/lyceum/lyceum-academy
pm2 start ecosystem.config.cjs
```

### 7.2 Save PM2 Configuration

```bash
pm2 save
pm2 startup
# Follow the instructions shown (copy and run the command)
```

### 7.3 Check Status

```bash
pm2 status
pm2 logs lyceum-academy
```

---

## 🌐 Part 8: Configure Nginx

### 8.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/lyceum-academy
```

Paste the following (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/lyceum-academy;
    index index.html;

    # Frontend - serve index.html for all routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API - proxy to Node.js server
    location /api {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5002;
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

### 8.2 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/lyceum-academy /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## 🔒 Part 9: Setup SSL (HTTPS)

### 9.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 9.2 Get SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 9.3 Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

---

## ✅ Part 10: Create Admin User

### 10.1 Connect to Database

```bash
psql -h localhost -U lyceum_user -d lyceum_academy
```

### 10.2 Create Admin User

```sql
-- First, you need to hash the password
-- Use bcrypt with 10 rounds: password 'admin123' becomes:
-- $2a$10$... (you'll need to generate this)

INSERT INTO users (name, email, password, role, permissions)
VALUES (
    'Admin User',
    'admin@lyceum.com',
    '$2a$10$YourHashedPasswordHere',
    'Admin',
    '{}'::jsonb
);

\q
```

**Note:** To generate a hashed password, you can use the registration endpoint or use an online bcrypt tool.

---

## 🧪 Part 11: Test Deployment

### 11.1 Test Health Endpoint

```bash
curl http://localhost:5002/health
# Should return: {"status":"ok","timestamp":"...","database":"connected"}
```

### 11.2 Test Frontend

Visit `https://yourdomain.com` in your browser - you should see the login page.

### 11.3 Run Automated Tests

```bash
cd /home/lyceum/lyceum-academy/server
npm install node-fetch
node test-deployment.js
```

### 11.4 Test Login

1. Go to `https://yourdomain.com`
2. Try logging in with:
   - Email: `admin@lyceum.com`
   - Password: `admin123`
3. Navigate through different pages (Dashboard, Contacts, CRM, etc.)

---

## 📊 Part 12: Monitoring & Maintenance

### 12.1 View Logs

```bash
# PM2 logs
pm2 logs lyceum-academy

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### 12.2 Restart Services

```bash
# Restart backend
pm2 restart lyceum-academy

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 12.3 Update Application

```bash
cd /home/lyceum/lyceum-academy
git pull origin main

# Rebuild frontend
npm run build
sudo cp -r dist/* /var/www/lyceum-academy/

# Restart backend
pm2 restart lyceum-academy
```

---

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if database exists
sudo -u postgres psql -l

# Test connection
psql -h localhost -U lyceum_user -d lyceum_academy
```

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs lyceum-academy --lines 100

# Check environment variables
cd /home/lyceum/lyceum-academy/server
cat .env

# Restart PM2
pm2 restart lyceum-academy
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## 🎯 Performance Optimization

### Enable PostgreSQL Connection Pooling

Already configured in `database.js` with max 20 connections.

### Enable Nginx Caching

Add to your Nginx config:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

location /api {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    # ... rest of proxy settings
}
```

### Monitor Resource Usage

```bash
# CPU and Memory
htop

# Disk usage
df -h

# Database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('lyceum_academy'));"
```

---

## 🔒 Security Checklist

- [x] PostgreSQL password is strong
- [x] JWT_SECRET is randomly generated
- [x] Firewall (UFW) is enabled
- [x] SSL/HTTPS is configured
- [x] Non-root user is used
- [x] Rate limiting is enabled
- [x] Helmet security headers are active
- [ ] Regular backups are scheduled
- [ ] Fail2ban is installed (optional)

---

## 📦 Backup Strategy

### Database Backup

```bash
# Create backup
pg_dump -h localhost -U lyceum_user lyceum_academy > backup_$(date +%Y%m%d).sql

# Restore backup
psql -h localhost -U lyceum_user lyceum_academy < backup_20231130.sql
```

### Automated Daily Backups

```bash
# Create backup script
nano /home/lyceum/backup.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/lyceum/backups"
mkdir -p $BACKUP_DIR
pg_dump -h localhost -U lyceum_user lyceum_academy > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Make executable and add to cron:

```bash
chmod +x /home/lyceum/backup.sh
crontab -e
# Add: 0 2 * * * /home/lyceum/backup.sh
```

---

## 🎉 Deployment Complete!

Your Lyceum Academy application is now live at `https://yourdomain.com`

**Next Steps:**
1. Create your admin user
2. Test all functionality
3. Set up regular backups
4. Monitor logs for any issues
5. Share the URL with your users!

**Support:**
- Check logs: `pm2 logs lyceum-academy`
- Monitor: `pm2 monit`
- Health check: `https://yourdomain.com/health`
