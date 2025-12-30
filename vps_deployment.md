# VPS Deployment Readiness Assessment & Checklist

## Current Status: ⚠️ NOT READY - Requires Configuration

Your application is **functionally working** but needs several production configurations before VPS deployment.

---

## Critical Issues to Address

### 🔴 HIGH PRIORITY (Must Fix Before Deployment)

#### 1. Environment Variables - Production Configuration
**Current Issues:**
- `server/.env` has hardcoded localhost database URL
- `JWT_SECRET` is set to "dev-secret-key" (INSECURE!)
- `.env` has localhost API URL
- CORS is set to `*` (allows all origins - security risk)

**Required Changes:**

**server/.env.production** (create new file):
```bash
DATABASE_URL=postgresql://username:password@your-vps-ip:5432/lyceum_db
JWT_SECRET=<generate-strong-random-secret-min-32-chars>
PORT=5002
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

**Frontend .env.production** (create new file):
```bash
VITE_API_URL=https://yourdomain.com/api
# OR if using subdomain:
# VITE_API_URL=https://api.yourdomain.com
```

#### 2. Security Hardening

**Missing Security Configurations:**
- No HTTPS/SSL configuration
- No rate limiting on sensitive endpoints (partially implemented)
- No input validation/sanitization
- Passwords stored with bcrypt (✅ GOOD)
- JWT authentication (✅ GOOD)

**Required:**
- Set up SSL certificate (Let's Encrypt recommended)
- Configure Nginx reverse proxy
- Add helmet middleware (✅ already installed)
- Implement request validation

#### 3. Database Migration Strategy

**Current Setup:**
- Using local PostgreSQL with specific user
- Database schema auto-initializes on startup (✅ GOOD)

**Required for VPS:**
- Install PostgreSQL on VPS
- Create production database user with limited privileges
- Update connection string in `.env.production`
- Run initial schema migration
- Create admin user on production DB

---

## 🟡 MEDIUM PRIORITY (Recommended Before Deployment)

### 4. Build & Deployment Process

**Frontend Build:**
```bash
npm run build  # Creates dist/ folder
```

**Backend:**
- No build step needed (Node.js runs directly)
- Ensure all dependencies in package.json

**Missing:**
- No PM2 or process manager configuration
- No deployment scripts
- No health check endpoint

### 5. Static File Serving

**Current:** Vite dev server (development only)

**Production Options:**
1. **Nginx serves frontend** (recommended)
2. **Express serves static files** (simpler)

### 6. Logging & Monitoring

**Current:** Console.log only

**Recommended:**
- Winston or Pino for structured logging
- Log rotation
- Error tracking (Sentry, etc.)

---

## ✅ WHAT'S ALREADY GOOD

1. **Authentication System** - JWT-based, secure
2. **Database Schema** - Auto-initialization works
3. **API Structure** - RESTful, well-organized
4. **Security Packages** - Helmet, bcrypt, rate-limiting installed
5. **CORS** - Configured (needs production update)
6. **Error Handling** - Try-catch blocks in place

---

## Deployment Checklist

### Pre-Deployment

- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Create `.env.production` files (backend & frontend)
- [ ] Update CORS_ORIGIN to your domain
- [ ] Build frontend (`npm run build`)
- [ ] Test production build locally
- [ ] Create `.gitignore` (exclude .env files)
- [ ] Set up Git repository

### VPS Setup

- [ ] Install Node.js (v18+ recommended)
- [ ] Install PostgreSQL
- [ ] Install Nginx
- [ ] Install PM2 (`npm install -g pm2`)
- [ ] Set up SSL certificate (certbot)
- [ ] Configure firewall (UFW)

### Database Setup

- [ ] Create PostgreSQL user for app
- [ ] Create production database
- [ ] Update DATABASE_URL in server/.env.production
- [ ] Run server once to initialize schema
- [ ] Create admin user (run create-admin.js)

### Application Deployment

- [ ] Clone/upload code to VPS
- [ ] Install dependencies (`npm install` in both root & server/)
- [ ] Copy `.env.production` to `.env` (or use PM2 env vars)
- [ ] Start backend with PM2
- [ ] Configure Nginx to serve frontend & proxy API
- [ ] Test all functionality

### Post-Deployment

- [ ] Verify login works
- [ ] Verify CRM drag-and-drop works
- [ ] Test all major features
- [ ] Set up automated backups (database)
- [ ] Configure monitoring/alerts
- [ ] Document deployment process

---

## Recommended VPS Specifications

**Minimum:**
- 1 CPU core
- 1GB RAM
- 20GB storage
- Ubuntu 20.04+ or similar

**Recommended:**
- 2 CPU cores
- 2GB RAM
- 40GB storage

---

## Quick Start Deployment Commands

### On VPS:

```bash
# Install dependencies
sudo apt update
sudo apt install -y nodejs npm postgresql nginx certbot python3-certbot-nginx

# Install PM2
sudo npm install -g pm2

# Setup PostgreSQL
sudo -u postgres createuser lyceum_user -P
sudo -u postgres createdb lyceum_db -O lyceum_user

# Clone your code
git clone <your-repo> /var/www/lyceum-academy
cd /var/www/lyceum-academy

# Install app dependencies
npm install
cd server && npm install && cd ..

# Build frontend
npm run build

# Start backend with PM2
cd server
pm2 start server.js --name lyceum-backend
pm2 save
pm2 startup

# Configure Nginx (see nginx config below)
```

---

## Sample Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend (static files)
    location / {
        root /var/www/lyceum-academy/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## Security Best Practices

1. **Never commit .env files** - Add to .gitignore
2. **Use strong JWT_SECRET** - Generate with: `openssl rand -base64 32`
3. **Enable HTTPS only** - Redirect HTTP to HTTPS
4. **Restrict CORS** - Set to your specific domain
5. **Use environment variables** - Never hardcode secrets
6. **Regular updates** - Keep dependencies updated
7. **Database backups** - Automate daily backups
8. **Limit database user** - Grant only necessary permissions

---

## Next Steps

1. **Create production environment files**
2. **Set up VPS and install required software**
3. **Deploy and test**
4. **Monitor and maintain**

> [!CAUTION]
> Do NOT deploy with current `.env` files - they contain development-only values that are insecure for production!
