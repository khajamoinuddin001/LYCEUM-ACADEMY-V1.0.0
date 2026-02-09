# 🎓 Lyceum Academy - Ultimate Enterprise ERP (Production Ready)

Lyceum Academy is a massive, multi-tenant Educational ERP and Learning Management System (LMS) designed for modern institutions. It integrates CRM, Accounting, Human Resources, Support, and Learning into a single, high-performance platform.

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Architecture](https://img.shields.io/badge/Architecture-Clean%20Code-orange)

---

## 🌍 The Feature Encyclopedia (100+ Features)

### 📊 1. Advanced CRM & Sales Pipeline
- **Smart Kanban Board**: Drag-and-drop lead management across custom stages (New, Qualified, Proposal, Won, Lost).
- **Enquiry Capture**: Automated lead generation from public website forms and direct manual entry.
- **Cascading Name Sync**: Proprietary logic to update contact names across Users, CRM, Finance, and Visitors simultaneously.
- **Contact Merging**: Intelligent deduplication tool to merge two contacts while preserving all history and documents.
- **Lead-to-Contact Conversion**: One-click workflow to transform prospects into full student profiles.
- **Activity Timeline**: Auto-generated chronological logs for every lead interaction.
- **Revenue Forecasting**: Real-time value calculation based on lead pipeline stages.
- **Note Repository**: Rich-text notes for internal team collaboration on specific opportunities.

### 📜 2. Intelligent Quotation & Document Engine
- **Template Builder**: Create and save reusable quotation templates for different services.
- **Dynamic PDF Generation**: Professional, branded PDF exports for all quotations and invoices.
- **Tax Configuration**: Automated GST/Tax calculations integrated into the quotation workflow.
- **AI Document Analysis**: Integrated Gemini AI to summarize and extract data from student uploads.
- **Private Vaulting**: Gated document storage with an "Admin-Only" private flag.
- **Avatar Management**: Direct photo capture or upload with automatic server-side resizing and storage.
- **Category-Based Filing**: Organize documents into Visa, Academic, Financial, and Legal categories.

### 📚 3. Global Learning Management System (LMS)
- **High-Performance Player**: Custom video engine optimized for smooth learning experiences.
- **Multi-Level Hierarchy**: Organize content by Course → Module → Lesson.
- **FIFO Progress Tracking**: Systematic lesson completion logic ensures students follow correct learning paths.
- **Coupon Engine**: Flexible discount system (percentage-based) with activation/deactivation toggles.
- **Student Performance Analytics**: Visual dashboards for instructors to track student completion rates.
- **Certificate Automation**: Automated PDF certificate issuance upon 100% course completion.
- **Discussion Threads**: Dedicated social space for every course lesson.
- **Manual & Auto Enrollment**: Support for both administrative enrollment and student self-purchase.
- **Course Metadata**: Support for prerequisites, instructors, and pricing tiers.

### 💰 4. Enterprise Accounting & Finance
- **Accounts Receivable (AR) Automation**: Invoices linked to contacts automatically deduct from the AR balance.
- **Multi-Type Transactions**: Support for Invoices, Bills, Income, and Expenses.
- **Vendor Management**: Comprehensive database for external suppliers and partners.
- **Expense Payee Tracking**: Categorized spending logs with default category mapping.
- **Status Lifecycle**: Track financial entities through Pending, Paid, Partially Paid, and Overdue states.
- **QR Payment Bridge**: Dynamic generation of UPI QR codes for instant student payments.
- **Profit & Loss Reports**: Automated monthly financial health checkups.
- **Transaction Printing**: Print-ready thermal and standard views for all receipts.
- **Partial Payment Support**: Logic to handle installment-based payments (Partial status).

### 🏢 5. Operational Excellence & Support
- **Ticket Desk**: Enterprise-grade support system with priority levels (Low, Medium, High).
- **Ticket Threading**: Real-time messaging conversation within support tickets.
- **File Attachments**: Support for multiple file uploads within support requests.
- **Task-Ticket Linking**: Ability to link development/ops tasks directly to support tickets.
- **Knowledge Base**: (Implicit) Integrated documentation and support history.
- **Visitor Registry**: Digital check-in/out with daily sequence numbers for high-traffic environments.
- **Host Notification**: Automatic mapping of visitors to staff members for efficient reception.
- **Global Search**: "Command + K" style modal to find any contact, lead, or task instantly.

### 👷 6. HR, Attendance & Payroll
- **Geofenced Check-in**: Biometric-level security requiring staff to be within 50m of office coordinates.
- **Punctuality Engine**: Status mapping (Present/Late) based on individual shift start times.
- **Automated Payroll**: Calculates net salary by factoring base pay, attendance, LOP (Loss of Pay), and holidays.
- **Leave Workflow**: Full Apply → Review → Approve/Reject cycle for staff time-off.
- **Shift Management**: Granular control over shift timings (Start/End) and working day selections.
- **Public Holiday Calendar**: System-wide holidays that automatically adjust payroll and deadlines.
- **Time Logs**: Active task tracking with start/end time duration calculation.

### 🔐 7. Security & Administration
- **RBAC (Role-Based Access Control)**: Granular permission gates for Admin, Staff, and Students.
- **User Impersonation**: Secure administrative tool to view the system as any specific user.
- **JWT Protection**: Secure API communication with individual route-level token validation.
- **Rate Limiting**: Protection against brute-force and DDoS attacks at the API level.
- **Security Headers**: Helmet.js integration for CSP, XSS protection, and frameguard.
- **Password Hygiene**: "Must Reset Password" flag for new user provisioning.
- **Password Recovery**: Secure forgot/reset password workflow with token validation.

### 🎨 8. Premium UI/UX & Aesthetics
- **Glassmorphism Design**: Modern, translucent UI components for a premium feel.
- **Framer Motion Animations**: Smooth page transitions and micro-interactions.
- **Multi-Theme Support**: Sleek, eye-friendly Dark Mode and High-Contrast Light Mode.
- **Ultra-Responsive**: Fluid grid system ensuring 100% usability on phones, tablets, and desktops.
- **Contextual Loaders**: Custom skeletons and loaders for seamless data fetching.
- **Quick-Create Modal**: Global entry point for adding Leads, Contacts, or Tasks from any page.

---

## 🛠 Tech Stack Details

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide |
| **Backend** | Node.js, Express, Multer, Bcrypt, JWT, Helmet |
| **Database** | PostgreSQL with advanced JSONB optimization & Connection Pooling |
| **AI** | Google Gemini 1.5 Integration |
| **DevOps** | PM2, Nginx, Shell Scripts (Production Deployment) |

---

## 🚀 Installation & Setup

### Requirements
- **Node.js** v18.0.0+
- **PostgreSQL** v15.0.0+

### Step-by-Step
1. **Clone & Install**:
   ```bash
   npm install
   cd server && npm install
   ```
2. **Environment**:
   Configure `server/.env` with your `DATABASE_URL`, `JWT_SECRET`, and `AI_GATEWAY_TOKEN`.
3. **Database Setup**:
   The system auto-migrates on cold start. Simply run the server.
4. **Development Launch**:
   ```bash
   # Root directory
   npm run dev
   # Server directory
   npm run dev
   ```

---

## 🔐 Support & Security

- **Security Audits**: The code is audited for common vulnerabilities (SQLi, XSS).
- **Default Admin**: `admin@lyceum.com` / `admin123` (Change immediately!)

---

## 📄 License

**Private Intellectual Property** - All rights reserved. 2026 Lyceum Academy.
