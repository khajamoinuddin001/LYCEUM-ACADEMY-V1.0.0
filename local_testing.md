# Local Testing Guide - PostgreSQL Setup

Quick guide to test the application locally with PostgreSQL before deploying to VPS.

---

## 📋 Prerequisites

- macOS (you're on Mac)
- Homebrew installed
- Node.js 18+ installed

---

## 🗄️ Step 1: Install PostgreSQL

```bash
# Install PostgreSQL 15
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Add to PATH (add to ~/.zshrc for permanent)
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
```

---

## 🔧 Step 2: Create Database

```bash
# Create database
createdb lyceum_academy_dev

# Verify it was created
psql -l | grep lyceum
```

---

## ⚙️ Step 3: Configure Environment

```bash
cd "/Users/mohammedkhajamoinuddin/Downloads/lyceum-academy fully functional 2/server"

# Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql://$(whoami)@localhost:5432/lyceum_academy_dev
JWT_SECRET=dev-secret-key-change-in-production
PORT=5002
NODE_ENV=development
CORS_ORIGIN=*
EOF
```

---

## 📦 Step 4: Install Dependencies

```bash
# Install backend dependencies
cd "/Users/mohammedkhajamoinuddin/Downloads/lyceum-academy fully functional 2/server"
npm install

# Install frontend dependencies
cd "/Users/mohammedkhajamoinuddin/Downloads/lyceum-academy fully functional 2"
npm install
```

---

## 🚀 Step 5: Start Application

### Terminal 1 - Backend

```bash
cd "/Users/mohammedkhajamoinuddin/Downloads/lyceum-academy fully functional 2/server"
npm run dev
```

You should see:
```
✅ Connected to PostgreSQL database
✅ Database schema initialized successfully
🚀 Server running on port 5002
📡 API available at http://localhost:5002/api
🔐 Auth endpoints at http://localhost:5002/api/auth
🗄️  Database: PostgreSQL
🌍 Environment: development
```

### Terminal 2 - Frontend

```bash
cd "/Users/mohammedkhajamoinuddin/Downloads/lyceum-academy fully functional 2"
npm run dev
```

Frontend will start on `http://localhost:3000`

---

## 🧪 Step 6: Run Tests

### Terminal 3 - Automated Tests

```bash
cd "/Users/mohammedkhajamoinuddin/Downloads/lyceum-academy fully functional 2/server"
node test-deployment.js
```

This will test:
- ✅ Health check
- ✅ User registration
- ✅ User login
- ✅ Protected routes
- ✅ Contact creation
- ✅ Data retrieval
- ✅ Data persistence
- ✅ Document upload (New)

---

## 🌐 Step 7: Manual Testing

1. **Open Browser**: Go to `http://localhost:3000`

2. **Register a User**:
   - Click "Register" or "Sign Up"
   - Fill in details
   - Submit

3. **Login**:
   - Use the credentials you just created
   - Should redirect to dashboard

4. **Test Pages**:
   - Navigate to Contacts
   - Create a new contact
   - **Test Document Upload**:
     - Click on the new contact
     - Go to "Documents" tab
     - Upload a file
     - Verify it appears in the list
     - Download it to check content
   - Navigate to CRM
   - Create a lead
   - Check other modules

5. **Test Persistence**:
   - Stop the backend (Ctrl+C in Terminal 1)
   - Restart it (`npm run dev`)
   - Refresh browser
   - Login again
   - Verify your data is still there

---

## 🔍 Troubleshooting

### PostgreSQL Not Starting

```bash
# Check status
brew services list | grep postgresql

# Restart
brew services restart postgresql@15

# Check logs
tail -f /opt/homebrew/var/log/postgresql@15.log
```

### Database Connection Error

```bash
# Test connection
psql -d lyceum_academy_dev

# If database doesn't exist
createdb lyceum_academy_dev

# Check DATABASE_URL in .env
cat server/.env
```

### Backend Won't Start

```bash
# Check if port 5002 is in use
lsof -i :5002

# Kill process if needed
kill -9 <PID>

# Check server logs
cd server
npm run dev
```

### Frontend Can't Connect to Backend

1. Verify backend is running on port 5002
2. Check browser console for errors
3. Verify CORS is allowing requests

---

## 📊 Database Management

### View Tables

```bash
psql -d lyceum_academy_dev

# List tables
\dt

# View users
SELECT * FROM users;

# View contacts
SELECT * FROM contacts;

# Exit
\q
```

### Reset Database

```bash
# Drop and recreate
dropdb lyceum_academy_dev
createdb lyceum_academy_dev

# Restart backend to reinitialize schema
cd server
npm run dev
```

---

## ✅ Success Checklist

- [ ] PostgreSQL installed and running
- [ ] Database created
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can register a user
- [ ] Can login
- [ ] Can create contacts
- [ ] Data persists after restart
- [ ] All pages load correctly

---

## 🎯 Next Steps

Once local testing is complete:

1. ✅ Commit your changes to Git
2. ✅ Push to GitHub/GitLab
3. ✅ Follow `HOSTINGER_VPS_SETUP.md` for deployment
4. ✅ Deploy to production VPS

---

## 🆘 Need Help?

Check these files:
- `HOSTINGER_VPS_SETUP.md` - Full deployment guide
- `server/test-deployment.js` - Automated tests
- `server/.env.example` - Environment variables template
