# Email Configuration Guide for Forgot Password

## Quick Setup (Gmail - Recommended for Testing)

### Step 1: Enable 2-Factor Authentication on Gmail
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Lyceum Academy" as the name
4. Click "Generate"
5. Copy the 16-character password (remove spaces)

### Step 3: Add to server/.env
```bash
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
FRONTEND_URL=http://localhost:3000
```

### Step 4: Test Email
```bash
cd server
node -e "import('./email.js').then(m => m.testEmailConfig())"
```

---

## Production Setup Options

### Option 1: SendGrid (Recommended for Production)
1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Create API key
3. Update server/.env:
```bash
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-api-key
EMAIL_USER=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Option 2: Mailgun
1. Sign up at https://mailgun.com
2. Get SMTP credentials
3. Update server/.env:
```bash
EMAIL_SERVICE=mailgun
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=postmaster@yourdomain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
FRONTEND_URL=https://yourdomain.com
```

### Option 3: AWS SES
1. Set up AWS SES
2. Verify domain
3. Get SMTP credentials
4. Update server/.env:
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-aws-smtp-username
EMAIL_PASSWORD=your-aws-smtp-password
FRONTEND_URL=https://yourdomain.com
```

---

## Environment Variables Reference

### Required Variables
- `EMAIL_USER`: Sender email address
- `EMAIL_PASSWORD`: Email password or API key
- `FRONTEND_URL`: Your frontend URL (for reset links)

### Optional Variables
- `EMAIL_SERVICE`: 'gmail' or leave empty for custom SMTP
- `SMTP_HOST`: SMTP server hostname (default: smtp.gmail.com)
- `SMTP_PORT`: SMTP port (default: 587)
- `SMTP_SECURE`: 'true' for port 465, 'false' for others

---

## Testing

### Test Email Sending
```bash
curl -X POST http://localhost:5002/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'
```

### Check Server Logs
```bash
# Look for "Password reset email sent" message
pm2 logs lyceum-backend
```

---

## Troubleshooting

### "Invalid login" error with Gmail
- Make sure 2-Factor Authentication is enabled
- Use App Password, not regular password
- Remove spaces from app password

### Emails going to spam
- Set up SPF, DKIM, and DMARC records for your domain
- Use a professional email service (SendGrid/Mailgun)
- Warm up your sending domain gradually

### "Connection timeout" error
- Check firewall settings
- Verify SMTP port is not blocked
- Try different SMTP_PORT (587 or 465)

### Rate limiting issues
- Default: 60 requests per hour per email
- Adjust in server/routes/auth.js if needed

---

## Security Best Practices

1. **Never commit .env files** - Already in .gitignore
2. **Use strong app passwords** - Not your regular email password
3. **Enable HTTPS in production** - For secure reset links
4. **Monitor email sending** - Watch for abuse
5. **Set up email alerts** - For failed deliveries

---

## For Home Server Deployment

If deploying on your old PC:
1. Gmail works fine for low volume (< 500 emails/day)
2. Make sure your ISP doesn't block SMTP ports
3. Consider using a relay service if blocked
4. Set FRONTEND_URL to your DuckDNS/No-IP domain

---

## Quick Start Commands

```bash
# Add to server/.env
echo "EMAIL_SERVICE=gmail" >> server/.env
echo "EMAIL_USER=your-email@gmail.com" >> server/.env
echo "EMAIL_PASSWORD=your-app-password" >> server/.env
echo "FRONTEND_URL=http://localhost:3000" >> server/.env

# Restart server
pm2 restart lyceum-backend

# Test
curl -X POST http://localhost:5002/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## Email Template Customization

To customize the email template, edit `server/email.js`:
- Change colors, fonts, layout
- Add your logo
- Modify text content
- Adjust button styling

The current template uses:
- Lyceum blue (#2A6F97) for branding
- Responsive design
- Professional layout
- Clear call-to-action button
