# Complete Home Server Setup Guide for Lyceum Academy

## 🏠 Turn Your Old PC into a Web Server

This guide will help you host Lyceum Academy on your old PC and access it from anywhere on the internet.

---

## 📋 Prerequisites

### Hardware Requirements
- **Minimum:**
  - 2GB RAM (4GB recommended)
  - 20GB free storage (40GB recommended)
  - Stable internet connection (upload speed 5+ Mbps)
  - Ethernet cable (more stable than WiFi)

### What You'll Need
- Old PC/Laptop
- USB drive (8GB+) for Ubuntu installation
- Router admin access
- Your ISP doesn't block port 80/443 (most don't)

---

## 🚀 Step 1: Install Ubuntu Server

### Download Ubuntu Server
1. Go to: https://ubuntu.com/download/server
2. Download **Ubuntu Server 22.04 LTS**
3. Create bootable USB using **Rufus** (Windows) or **Etcher** (Mac/Linux)

### Install Ubuntu
1. Boot from USB (press F12/F2/Del during startup)
2. Select "Install Ubuntu Server"
3. Follow prompts:
   - Language: English
   - Keyboard: Your layout
   - Network: Use DHCP (automatic)
   - Storage: Use entire disk
   - Profile:
     - Your name: `lyceum`
     - Server name: `lyceum-server`
     - Username: `lyceum`
     - Password: **Strong password!**
   - Install OpenSSH server: **YES** ✅
   - Featured snaps: Skip (press Enter)

4. Wait for installation (10-15 minutes)
5. Reboot and remove USB

### First Login
```bash
# Login with your username and password
# Update system
sudo apt update && sudo apt upgrade -y
```

---

## 🌐 Step 2: Network Configuration

### Find Your Local IP
```bash
ip addr show
# Look for something like: 192.168.1.XXX
```

### Set Static IP (Recommended)

**Edit netplan config:**
```bash
sudo nano /etc/netplan/00-installer-config.yaml
```

**Replace with:**
```yaml
network:
  version: 2
  ethernets:
    enp0s3:  # Your interface name (check with 'ip addr')
      dhcp4: no
      addresses:
        - 192.168.1.100/24  # Choose an IP outside DHCP range
      routes:
        - to: default
          via: 192.168.1.1  # Your router IP
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

**Apply:**
```bash
sudo netplan apply
```

---

## 🔧 Step 3: Install Required Software

### Install Everything at Once
```bash
# Update package list
sudo apt update

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install UFW firewall
sudo apt install -y ufw
```

### Verify Installations
```bash
node --version   # Should show v18.x.x
npm --version
psql --version
nginx -v
pm2 --version
```

---

## 🗄️ Step 4: Setup PostgreSQL Database

### Configure PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL prompt:
CREATE USER lyceum_user WITH PASSWORD 'your_strong_password_here';
CREATE DATABASE lyceum_db OWNER lyceum_user;
GRANT ALL PRIVILEGES ON DATABASE lyceum_db TO lyceum_user;
\q
```

### Allow Local Connections
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

**Add this line:**
```
local   lyceum_db   lyceum_user   md5
```

**Restart PostgreSQL:**
```bash
sudo systemctl restart postgresql
```

### Test Connection
```bash
psql -U lyceum_user -d lyceum_db -h localhost
# Enter password when prompted
# Type \q to exit
```

---

## 📦 Step 5: Deploy Your Application

### Create Application Directory
```bash
sudo mkdir -p /var/www/lyceum-academy
sudo chown -R $USER:$USER /var/www/lyceum-academy
cd /var/www/lyceum-academy
```

### Upload Your Code

**Option 1: Using Git (Recommended)**
```bash
# If you have a GitHub repo
git clone https://github.com/yourusername/lyceum-academy.git .
```

**Option 2: Using SCP from your Mac**
```bash
# On your Mac, run:
scp -r "/Users/mohammedkhajamoinuddin/Downloads/lyceum-academy fully functional 2/"* lyceum@YOUR_SERVER_IP:/var/www/lyceum-academy/
```

### Install Dependencies
```bash
cd /var/www/lyceum-academy

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Configure Environment Variables

**Backend .env:**
```bash
nano server/.env
```

**Add:**
```bash
DATABASE_URL=postgresql://lyceum_user:your_strong_password_here@localhost:5432/lyceum_db
JWT_SECRET=Y9UJWw/ogi9ZQq5ZOkJ62v3CKkUdB18vgO+e/bRD/1Q=
PORT=5002
NODE_ENV=production
CORS_ORIGIN=http://YOUR_PUBLIC_IP
```

**Frontend .env:**
```bash
nano .env
```

**Add:**
```bash
VITE_API_URL=http://YOUR_PUBLIC_IP/api
```

### Build Frontend
```bash
npm run build
```

### Start Backend with PM2
```bash
pm2 start server/server.js --name lyceum-backend
pm2 save
pm2 startup
# Copy and run the command it shows
```

---

## 🌍 Step 6: Configure Nginx

### Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/lyceum
```

**Add:**
```nginx
server {
    listen 80;
    server_name _;  # Accept all hostnames

    # Frontend (static files)
    location / {
        root /var/www/lyceum-academy/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
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
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for long requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Max upload size
    client_max_body_size 50M;
}
```

### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/lyceum /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

---

## 🔒 Step 7: Configure Firewall

```bash
# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS (for future SSL)
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 🌐 Step 8: Router Port Forwarding

### Access Your Router
1. Open browser: `http://192.168.1.1` (or `192.168.0.1`)
2. Login (usually admin/admin or on router sticker)

### Setup Port Forwarding

**Add these rules:**

| Service | External Port | Internal IP | Internal Port | Protocol |
|---------|---------------|-------------|---------------|----------|
| HTTP    | 80            | 192.168.1.100 | 80          | TCP      |
| HTTPS   | 443           | 192.168.1.100 | 443         | TCP      |

**Common Router Interfaces:**
- **TP-Link:** Advanced → NAT Forwarding → Virtual Servers
- **Netgear:** Advanced → Port Forwarding
- **D-Link:** Advanced → Port Forwarding
- **Asus:** WAN → Virtual Server / Port Forwarding

---

## 🔗 Step 9: Dynamic DNS Setup (Free Domain)

### Option 1: No-IP (Recommended)

1. **Sign up:** https://www.noip.com/sign-up
2. **Create hostname:** `yourname.ddns.net`
3. **Install DUC (Dynamic Update Client):**

```bash
cd /usr/local/src
sudo wget http://www.noip.com/client/linux/noip-duc-linux.tar.gz
sudo tar xzf noip-duc-linux.tar.gz
cd noip-2.1.9-1
sudo make
sudo make install

# Configure (enter your No-IP credentials)
sudo /usr/local/bin/noip2 -C

# Start service
sudo /usr/local/bin/noip2

# Auto-start on boot
sudo nano /etc/systemd/system/noip2.service
```

**Add:**
```ini
[Unit]
Description=No-IP Dynamic DNS Update Client
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/bin/noip2

[Install]
WantedBy=multi-user.target
```

**Enable:**
```bash
sudo systemctl enable noip2
sudo systemctl start noip2
```

### Option 2: DuckDNS (Simpler)

1. **Sign up:** https://www.duckdns.org
2. **Create subdomain:** `yourname.duckdns.org`
3. **Install updater:**

```bash
mkdir ~/duckdns
cd ~/duckdns
nano duck.sh
```

**Add:**
```bash
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=yourname&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns/duck.log -K -
```

**Make executable and schedule:**
```bash
chmod +x duck.sh
crontab -e
# Add: */5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
```

---

## 🔐 Step 10: SSL Certificate (HTTPS)

### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Get Certificate
```bash
sudo certbot --nginx -d yourname.ddns.net
# Follow prompts, choose redirect HTTP to HTTPS
```

### Auto-Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot auto-renews via systemd timer
sudo systemctl status certbot.timer
```

---

## ✅ Step 11: Verify Everything Works

### Check Services
```bash
# PostgreSQL
sudo systemctl status postgresql

# Nginx
sudo systemctl status nginx

# PM2
pm2 status

# Check logs
pm2 logs lyceum-backend
```

### Test Locally
```bash
# From server
curl http://localhost

# Should show your frontend
```

### Test Externally
1. **Find your public IP:** https://whatismyipaddress.com
2. **Visit:** `http://YOUR_PUBLIC_IP`
3. **Or:** `http://yourname.ddns.net`

---

## 🛡️ Security Best Practices

### 1. Change Default SSH Port
```bash
sudo nano /etc/ssh/sshd_config
# Change: Port 22 → Port 2222
sudo systemctl restart sshd
sudo ufw allow 2222/tcp
sudo ufw delete allow 22/tcp
```

### 2. Disable Root Login
```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 3. Install Fail2Ban
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Regular Updates
```bash
# Create update script
nano ~/update.sh
```

**Add:**
```bash
#!/bin/bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
pm2 update
```

```bash
chmod +x ~/update.sh
# Run weekly: crontab -e
# Add: 0 3 * * 0 ~/update.sh
```

---

## 💾 Automated Backups

### Database Backup Script
```bash
mkdir -p ~/backups
nano ~/backup-db.sh
```

**Add:**
```bash
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U lyceum_user lyceum_db > $BACKUP_DIR/lyceum_db_$DATE.sql
# Keep only last 7 days
find $BACKUP_DIR -name "lyceum_db_*.sql" -mtime +7 -delete
```

**Schedule:**
```bash
chmod +x ~/backup-db.sh
crontab -e
# Add: 0 2 * * * ~/backup-db.sh
```

---

## 🔧 Troubleshooting

### Can't Access from Internet
```bash
# Check if ports are open
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Check firewall
sudo ufw status

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check PM2
pm2 status
pm2 logs
```

### Database Connection Issues
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
psql -U lyceum_user -d lyceum_db -h localhost

# Check logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### High CPU/Memory Usage
```bash
# Monitor resources
htop

# Check PM2
pm2 monit

# Restart if needed
pm2 restart lyceum-backend
```

---

## 📊 Monitoring

### Setup Monitoring Dashboard
```bash
# Install Netdata (optional)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Access at: http://YOUR_IP:19999
```

### PM2 Monitoring
```bash
pm2 monit  # Real-time monitoring
pm2 logs   # View logs
```

---

## 🎉 You're Done!

Your Lyceum Academy is now accessible at:
- **Local:** `http://192.168.1.100`
- **Internet:** `http://yourname.ddns.net` or `http://YOUR_PUBLIC_IP`

### Next Steps
1. Share the URL with users
2. Monitor server performance
3. Set up regular backups
4. Consider upgrading to HTTPS (already covered!)

---

## 📞 Need Help?

**Common Issues:**
- Port forwarding not working → Check router firewall
- Can't access externally → ISP might block ports (call them)
- Slow performance → Check upload speed, upgrade if needed
- Database errors → Check PostgreSQL logs

**Useful Commands:**
```bash
pm2 restart all          # Restart app
sudo systemctl restart nginx  # Restart web server
sudo systemctl restart postgresql  # Restart database
pm2 logs --lines 100     # View recent logs
```

---

> [!TIP]
> **Pro Tip:** Keep your server in a cool, dust-free area with good ventilation. Consider a UPS (Uninterruptible Power Supply) to prevent data loss during power outages!

> [!WARNING]
> **Important:** Your home IP might change if your ISP doesn't provide a static IP. That's why Dynamic DNS (No-IP/DuckDNS) is crucial!
