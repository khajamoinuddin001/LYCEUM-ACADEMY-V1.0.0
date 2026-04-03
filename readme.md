# 🎓 Lyceum Academy - Ultimate Enterprise ERP (Production Ready)

Lyceum Academy is a massive, multi-tenant Educational ERP and Learning Management System (LMS) designed for modern institutions. It integrates CRM, Accounting, Human Resources, Support, and Learning into a single, high-performance platform.

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Architecture](https://img.shields.io/badge/Architecture-Clean%20Code-orange)

---

## 🌍 The Application Encyclopedia (All Modules & Features)

Lyceum Academy is an ecosystem of interconnected applications. Each module is designed to handle a specific domain of institutional management.

### 💰 1. Enterprise Finance & Accounting
*The backbone of the institution's financial health.*
- **Quotation Management**: Build reusable templates, generate professional PDFs, and track quotation status.
- **Invoice & Billing**: Automated invoicing linked to student profiles with support for partial/installment payments.
- **Accounts Receivable (AR)**: Real-time tracking of pending student fees with automated balance updates.
- **Expense & Purchase Tracking**: Manage vendor payments, utility bills, and internal office expenses.
- **QR Payment Bridge**: Dynamic UPI QR code generation for instant, contactless student payments.
- **Profit & Loss Analytics**: Automated monthly and yearly financial reports for strategic planning.
- **Tax & GST Engine**: Configurable tax rules integrated into every financial transaction.
- **Coupon & Discount Logic**: Create percentage-based or fixed-value discounts for course enrollments.
- **Vendor Registry**: Database of all external suppliers with transaction history.

### 📚 2. Global Learning Management System (LMS)
*A high-performance learning environment for students and teachers.*
- **Advanced Course Player**: Optimized video delivery engine with progress tracking and persistence.
- **Course & Module Builder**: Multi-level hierarchy (Course → Module → Lesson) with rich content support.
- **Interactive Quizzes**: Build assessments with multiple question types and automated grading.
- **Live Class Sync**: Real-time synchronization for virtual classrooms (slides, navigation, and attendance).
- **Certificate Automation**: Instant PDF certificate generation upon 100% course completion.
- **Discussion Forums**: Social learning threads integrated into every lesson for peer-to-peer support.
- **Course Analytics**: Visual dashboards for instructors to monitor student completion and engagement.
- **Manual & Auto Enrollment**: Secure administrative enrollment or student self-purchasing workflows.

### 📊 3. CRM & Sales Pipeline
*Turning enquiries into enrollments.*
- **Smart Kanban Board**: Drag-and-drop lead management across custom stages (New, Qualified, Won, Lost).
- **Automated Enquiry Capture**: Leads from website forms and external triggers are piped directly into the CRM.
- **Contact Merging**: Intelligent deduplication tool to merge student profiles while preserving documents.
- **Cascading Name Sync**: Proprietary logic to sync updates across CRM, Finance, and Security modules.
- **Revenue Forecasting**: Real-time pipeline value calculation based on lead probability and course costs.

### 👷 4. Human Resources & Payroll
*Managing staff performance and compensation.*
- **Geofenced Biometric Attendance**: Secure check-in/out requiring staff to be within 50m of office coordinates.
- **Automated Payroll Engine**: Calculates net salary by factoring base pay, attendance, LOP, and holidays.
- **Performance Dashboards**: Track individual and department-level efficiency and attendance streaks.
- **Leave Management**: Full digital workflow for staff time-off requests and approvals.
- **Shift & Holiday Config**: Granular control over working hours and system-wide public holidays.

### 🛂 5. Visa Operations & University Portal
*Global education logistics management.*
- **Application Tracking**: End-to-end management of university applications and visa filing status.
- **DS-160 Support**: Automated tracking and document management for US Visa applications.
- **Destination Portal**: Manage university databases and application requirements for different countries.
- **Document Vault**: Secure, gated storage for sensitive student documents (Passport, Bank Statements).

### 🤖 6. Automation & AI Engine
*Smart workflows and intelligent insights.*
- **Rule Builder**: Create custom "If-This-Then-That" triggers for automated notifications and status updates.
- **Email Template Library**: Rich-text template builder for automated student communications.
- **Gemini AI Integration**: Automated document summary and data extraction from student uploads.
- **Task Automation**: Auto-assignment of tasks based on lead or application status changes.

### 🛎️ 7. Reception & Visitor Management
*The digital front-office.*
- **Digital Guestbook**: Register visitors, track entry/exit times, and assign digital sequence numbers.
- **Appointment Scheduling**: Digital calendar for managing walk-ins and pre-booked meetings.
- **Host Notifications**: Automatic alerts to staff members when their guest arrives at reception.

### 🎯 8. Mock Interviews & Question Bank
*Preparing students for success.*
- **Session Scheduling**: Manage mock interview slots for various career paths or visa types.
- **Question Repository**: A categorized bank of standard interview questions and model answers.
- **Feedback Forms**: Detailed assessment criteria for instructors to evaluate student performance.

---

## 🛠 Technical Architecture

### Frontend (React 19)
- **Vite**: High-speed build tool and development server.
- **Zustand**: Lightweight, high-performance state management.
- **Framer Motion**: Premium micro-animations and page transitions.
- **Socket.io-Client**: Real-time bidirectional communication for LMS and Notifications.
- **Lucide Icons**: Consistent, scalable vector icons.
- **Tailwind CSS**: Utility-first CSS for responsive, modern UI design.

### Backend (Node.js & Express)
- **PostgreSQL**: Relational database with JSONB optimization for flexible data structures.
- **JWT (JSON Web Tokens)**: Secure, stateless authentication.
- **Helmet.js**: Production-grade security headers (CSP, XSS protection).
- **Express-Rate-Limit**: Protection against brute-force and DDoS attacks.
- **Multer**: Secure file upload handling and storage.

---

## 📂 Project Structure
```text
├── src/
│   ├── features/       # Modular application logic (LMS, HR, CRM, etc.)
│   ├── components/     # Shared UI components (Modals, Buttons, Tables)
│   ├── store/          # Zustand state definitions
│   ├── hooks/          # Shared React hooks
│   ├── utils/          # API services and helpers
│   └── app.tsx         # Main routing and navigation
├── server/
│   ├── routes/         # Express API endpoints
│   ├── database.js     # DB Connection and Migration logic
│   ├── automation.js   # Automation engine core
│   ├── sockets/        # Real-time socket event handlers
│   └── server.js       # Entry point for Node.js
└── deployment/         # Nginx configs and PM2 ecosystem files
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** v18+ 
- **PostgreSQL** v15+ 

### Step-by-Step
1. **Repository Installation**:
   ```bash
   npm install
   cd server && npm install
   ```
2. **Environment Configuration**:
   Create a `.env` in the `server/` directory:
   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/lyceum
   JWT_SECRET=your_super_secret_key
   PORT=5000
   AI_GATEWAY_TOKEN=your_google_ai_token
   ```
3. **Database Launch**:
   The system auto-migrates on start. Simply run the server.
4. **Launch Development**:
   ```bash
   # Terminal 1: Client
   npm run dev
   # Terminal 2: Server
   cd server && npm run dev
   ```

---

## 🔐 Security & Access Control
- **RBAC**: Multi-tenant support with Admin, Staff, and Student roles.
- **User Impersonation**: Administrative tool to debug issues by viewing the system as a specific user.
- **Secure Provisioning**: Mandatory "Password Reset" flag for all new system-generated accounts.

---

## 📄 License
**Private Intellectual Property** - All rights reserved. 2026 Lyceum Academy.
