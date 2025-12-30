# Lyceum Academy - Production Ready ERP

A comprehensive, production-ready academy management system with CRM, LMS, Accounting, and more. Built for performance and scalability with PostgreSQL.

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)

---

## 📚 Documentation Hub

Everything you need to run, test, and deploy this application:

### 🚀 Deployment
- **[HOSTINGER_VPS_SETUP.md](./HOSTINGER_VPS_SETUP.md)** - ⭐️ **Start Here for Production!** Complete step-by-step guide to deploy on Hostinger VPS.
- **[QUICK_DEPLOY.md](./QUICK_DEPLOY.md)** - Fast deployment commands for experienced users.
- **[PRODUCTION_READY.md](./PRODUCTION_READY.md)** - Summary of production features and readiness.

### 💻 Development
- **[LOCAL_TESTING.md](./LOCAL_TESTING.md)** - How to set up PostgreSQL and run the app locally on macOS/Linux.

---

## ✨ Production Features

- **👥 Multi-User Support** - Admin, Employee, and Student roles
- **🔐 Secure Authentication** - JWT with Helmet security headers & Rate Limiting
- **📊 CRM System** - Lead management, quotations, and pipeline tracking
- **📚 LMS** - Learning Management System with video courses
- **💰 Accounting** - Invoices, payments, and transaction tracking
- **📅 Calendar** - Event management and scheduling
- **📝 Contacts** - Comprehensive student/contact profiles (38+ fields)
- **⚡️ High Performance** - PostgreSQL connection pooling & JSONB optimization

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+

### 1. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 2. Configure Environment
Create `server/.env`:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/lyceum_academy_dev
JWT_SECRET=your-secret-key
PORT=10000
NODE_ENV=development
```

Create `.env` (root):
```env
VITE_API_URL=http://localhost:10000/api
```

### 3. Run Application
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
npm run dev
```

---

## 🔐 Default Admin User

When you deploy using our scripts, an admin user is created:

- **Email:** `admin@lyceum.com`
- **Password:** `admin123` (Change this immediately!)

To create a new admin manually:
```bash
cd server
node create-admin.js
```

---

## 📦 Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite (Build Tool)
- Tailwind CSS (Styling)
- Lucide Icons

**Backend:**
- Node.js + Express
- PostgreSQL (Database)
- `pg` (Driver with Connection Pooling)
- `helmet` + `express-rate-limit` (Security)

---

## 🧪 Testing

Run our comprehensive automated test suite:

```bash
cd server
node test-deployment.js
```

Checks: Health, Auth, Database, CRUD, Persistence.

---

## 📄 License

Private - All rights reserved
