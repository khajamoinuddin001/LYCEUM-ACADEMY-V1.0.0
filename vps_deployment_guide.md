# Lyceum Academy - DEFINITIVE VPS Deployment & Nginx Configuration

If you are still seeing CORS errors while visited `www.lyceumacad.com`, it's because your frontend is trying to talk to the non-`www` backend. The **only** stable way to fix this is to force your VPS to use exactly one domain.

## Step 1: Update VPS Code & Restart Backend
1. Pull the latest code (I just updated `server/sockets/lms.js` to be even more permissive).
2. Restart your backend process.

## Step 2: NEW Nginx Configuration (Force Redirect)

Open your config file:
```bash
nano /etc/nginx/sites-available/lyceumacad.com
```

**DELETE EVERYTHING in the file** and paste this exact, complete configuration. It handles SSL, your frontend, your API, and forces the `www` to non-`www` redirect.

```nginx
# 1. REDIRECT: All HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name lyceumacad.com www.lyceumacad.com;
    return 301 https://lyceumacad.com$request_uri;
}

# 2. REDIRECT: HTTPS 'www' to HTTPS 'non-www'
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.lyceumacad.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/lyceumacad.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lyceumacad.com/privkey.pem;

    return 301 https://lyceumacad.com$request_uri;
}

# 3. MAIN SERVER BLOCK: lyceumacad.com
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name lyceumacad.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/lyceumacad.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lyceumacad.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Client upload limits
    client_max_body_size 50M;

    # Frontend - Static Files
    root /var/www/lyceum-academy/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://localhost:5002/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Connect timeouts
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Socket.IO Proxy (The fix for your CORS/Polling issue)
    location /socket.io/ {
        proxy_pass http://localhost:5002/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_buffering off;
        proxy_read_timeout 86400;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # static cache
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Step 3: Reload Nginx
1. Verify: `sudo nginx -t`
2. Reload: `sudo systemctl reload nginx`

## Why this works:
By forcing a redirect from `www` to non-`www`, the browser will immediately refresh and change the domain in the address bar to `https://lyceumacad.com`. Now, when your frontend talks to the backend, it's on the **same domain**, so CORS is no longer triggered and the connection will be 100% stable. 🚀
