# 🚀 Quick Deploy Script for Hostinger VPS

This script automates the deployment process on your Hostinger VPS.

## Prerequisites

- Hostinger VPS with Ubuntu/Debian
- SSH access to your VPS
- Domain name pointed to VPS IP
- PostgreSQL installed
- Node.js 20.x installed
- PM2 installed globally

## Quick Deploy Steps

### 1. On Your Local Machine

```bash
# Build the frontend
npm run build

# Create deployment package
tar -czf lyceum-deploy.tar.gz dist/ server/ ecosystem.config.cjs package.json
```

### 2. Upload to VPS

```bash
# Upload the package
scp lyceum-deploy.tar.gz user@your-vps-ip:/home/user/

# SSH into VPS
ssh user@your-vps-ip
```

### 3. On Your VPS

```bash
# Extract package
cd /home/user
tar -xzf lyceum-deploy.tar.gz
cd lyceum-academy

# Install dependencies
npm install --production
cd server
npm install --production
cd ..

# Create environment file
cat > server/.env << 'EOF'
DATABASE_URL=postgresql://lyceum_user:your-password@localhost:5432/lyceum_academy
JWT_SECRET=$(openssl rand -base64 32)
PORT=5002
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
EOF

# Create admin user
cd server
node create-admin.js
cd ..

# Setup frontend files
sudo mkdir -p /var/www/lyceum-academy
sudo cp -r dist/* /var/www/lyceum-academy/
sudo chown -R www-data:www-data /var/www/lyceum-academy

# Start backend with PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# Setup Nginx (if not already done)
sudo cp nginx.conf /etc/nginx/sites-available/lyceum-academy
sudo ln -s /etc/nginx/sites-available/lyceum-academy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 4. Verify Deployment

```bash
# Check backend status
pm2 status
pm2 logs lyceum-academy

# Test health endpoint
curl http://localhost:5002/health

# Visit your domain
# https://yourdomain.com
```

## Update Deployment

When you need to update the application:

```bash
# On local machine
npm run build
tar -czf lyceum-update.tar.gz dist/ server/

# Upload and extract on VPS
scp lyceum-update.tar.gz user@your-vps-ip:/home/user/lyceum-academy/
ssh user@your-vps-ip
cd /home/user/lyceum-academy
tar -xzf lyceum-update.tar.gz

# Update frontend
sudo cp -r dist/* /var/www/lyceum-academy/

# Update and restart backend
cd server
npm install --production
pm2 restart lyceum-academy
```

## Troubleshooting

### Backend won't start
```bash
pm2 logs lyceum-academy --lines 50
cat server/.env
```

### Database connection issues
```bash
psql -h localhost -U lyceum_user -d lyceum_academy
# Check if database exists and user has permissions
```

### Frontend not loading
```bash
sudo nginx -t
sudo systemctl status nginx
ls -la /var/www/lyceum-academy/
```

## Monitoring

```bash
# View logs
pm2 logs lyceum-academy

# Monitor resources
pm2 monit

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('lyceum_academy'));"
```

## Backup

```bash
# Backup database
pg_dump -h localhost -U lyceum_user lyceum_academy > backup_$(date +%Y%m%d).sql

# Backup files
tar -czf backup_files_$(date +%Y%m%d).tar.gz /var/www/lyceum-academy/
```

---

**For detailed instructions, see HOSTINGER_VPS_SETUP.md**
