# Dayflow HRMS — Next-Gen Human Resource Management System

Dayflow HRMS is a modern, enterprise-grade **Human Resource Management System (HRMS)** and **Applicant Tracking System (ATS)** built with FastAPI, MongoDB Atlas, React 18, Vite, and TailwindCSS.

It provides a dual-portal ecosystem designed for both **Employee Self-Service** and **HR Administration & Management**, featuring real-time attendance tracking with half-day threshold alerts, automated payroll generation with PDF paystub downloads, visual recruitment Kanban pipelines, Excel-ready CSV exports, and real Gmail SMTP OTP authentication.

---

## 🌟 Key Features

### 👤 1. Employee Self-Service Portal
- **Dual-Pane Authentication & OTP Recovery**:
  - Sign in using Email or Employee ID with show/hide password toggles.
  - Interactive visual role selection cards (**Employee** vs **HR Admin**).
  - 2-Step Forgot Password with 6-digit OTP delivered live via Gmail SMTP.
- **My Profile & Avatar Changer**:
  - Tabbed profile management covering Personal Details, Private Bank & UAN details, Skills & Certifications, and Salary Structure.
  - **Interactive Profile Picture Uploader**: Direct computer file upload (Base64), professional avatar preset gallery, or custom image URL with instant app-wide header synchronization.
  - Country dial-code selector with auto-filling flags (`🇮🇳 +91`, `🇺🇸 +1`, `🇬🇧 +44`, etc.).
- **Daily & Weekly Attendance Hub**:
  - Daily Check-In / Check-Out logger with **7-Hour Work Shift Threshold**:
    - `< 7.0 Hours` ➔ Automatically recorded as **Half-Day** (Yellow 🟡) with real-time HR alert generated.
    - `>= 7.0 Hours` ➔ Recorded as **Full-Day Present** (Green 🟢) with HR notice.
  - **Mon-Sun Weekly Attendance View**: 7-day card breakdown displaying shift completion progress bars, worked hours per day, and status badges.
  - **Color-Coded Monthly Calendar**: Highlights Festive & Public Holidays (Purple 🟣), Pending Leaves (Orange 🟠), Present (Green 🟢), Half-Day (Yellow 🟡), On Leave (Blue 🔵), and Absent (Past days Red 🔴).
- **Time Off Requests**:
  - Submit leave requests with custom date ranges.
  - Real-time leave balance tracking (Paid Leave, Sick Leave, Casual Leave).
  - **Admin Remarks Column**: Displays HR comments and rationales on approved/rejected requests.
- **My Payroll & Paystubs**:
  - Role-based constant payday schedule matrix (1st, 5th, 10th, 15th).
  - Numerical payday formatting (`DD/MM/YYYY`).
  - Detailed earnings & deductions breakdown (Basic, HRA, Fixed Allowances, Deductions).
  - **One-Click Official PDF Paystub Download** generated on-the-fly via ReportLab.

---

### 🛡️ 2. HR Command Center & Administration Portal
- **HR Command Center Dashboard**:
  - High-contrast gradient header banner with ambient light glow and quick command buttons.
  - Real-time metrics: Total Active Staff, Attendance Rate %, Pending Approvals Count, Active Departments.
  - **Live Activity Audit Stream**: Streams real-time half-day alerts and full-day notices directly from employee check-outs.
- **Recruitment & Applicant Tracking System (ATS)**:
  - Interactive hiring pipeline Kanban board with 6 stages:
    `Applied` ➔ `Screening` ➔ `Interview` ➔ `Offer Extended` ➔ `Hired` / `Rejected`.
  - Candidate registration, interviewer notes, stage progression controls, and job search/filter.
  - Active Job Openings management (Title, Department, Location, Status toggle).
- **Workforce Directory & Management**:
  - Organization staff roster with instant search by Name, ID, or Email.
  - Add employee modal and profile editor.
  - Role assignment (**Employee** vs **Admin**).
  - **Rule #4 Soft-Deactivation Switcher**: Instantly freezes portal access and payroll eligibility.
- **Organization Attendance Hub**:
  - Organization-wide daily check-in/out audit table.
  - **Mon-Sun Weekly Team Attendance Breakdown**: Company-wide daily attendance rate %, team present count, and total shift hours logged across the organization.
  - **Admin Manual Attendance Override Modal**: Correct employee attendance records with custom status and audit reasons.
- **Leave Approvals Engine**:
  - Review pending leave applications with employee leave history context.
  - Approve or Reject with custom **Admin Remarks**.
  - **Auto-Sync Engine**: Approved leaves automatically propagate to the employee's attendance calendar as `Leave` (Sky Blue 🔵).
- **Payroll Control Engine**:
  - Organization-wide monthly payroll generation and payout finalization.
  - **Inline HR Payday Editor (`PUT /api/payroll/{slip_id}/payday`)**: HR can update custom disbursement dates (`DD/MM/YYYY`).
- **Reports & Analytics (Excel-Ready)**:
  - Synchronized metric cards linked to active portal modules.
  - **Microsoft Excel-Compatible CSV Downloads**: Embeds UTF-8 BOM (`\uFEFF`) so Excel opens CSV files cleanly with formatted columns and currency symbols (`₹`).
  - Available reports: Attendance Summary, Payroll Register, Leave Summary, and Employee Master Roster.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router v6, TailwindCSS, Lucide React Icons, Axios |
| **Backend API** | FastAPI (Python 3.10), Uvicorn, Motor (Async MongoDB), Pydantic v2, PyJWT |
| **Database** | MongoDB Atlas Cluster (`dayflow_hrms` collection) |
| **Email Engine** | Python `smtplib` + `asyncio.to_thread` with HTML email templates via Gmail SMTP |
| **Document Engine**| ReportLab (PDF Paystub Generation) |
| **Testing** | Pytest, Asyncio Test Suite |

---

## 📁 Repository Structure

```
Dayflow/
├── backend/
│   ├── app/
│   │   ├── core/           # Security, OAuth2 token handling & config settings
│   │   ├── db/             # MongoDB Atlas connection & database indexes
│   │   ├── models/         # Pydantic schemas (User, Employee, Attendance, Leave, Payroll, Recruitment)
│   │   ├── routers/        # FastAPI API endpoints (auth, employees, attendance, leave, payroll, dashboard, reports, recruitment)
│   │   ├── services/       # Core business logic handlers & DB CRUD operations
│   │   └── tests/          # Pytest unit & integration test cases
│   ├── .env                # Backend environment configuration
│   ├── main.py             # FastAPI entry point
│   ├── pytest.ini          # Pytest configuration
│   └── requirements.txt    # Python dependencies
└── frontend/
    ├── src/
    │   ├── api/            # Axios API client modules
    │   ├── components/     # Reusable UI components (Navbar, Sidebar, Card, Modal, StatusBadge)
    │   ├── context/        # Auth Context Provider & JWT state
    │   ├── pages/
    │   │   ├── admin/      # HR Admin views (Dashboard, Recruitment, EmployeeList, AttendanceRecords, LeaveApprovals, PayrollControl, Reports)
    │   │   ├── auth/       # Auth views (SignIn, SignUp)
    │   │   └── employee/   # Employee views (Profile, Attendance, LeaveRequests, Payroll, EmployeeDashboard)
    │   └── routes/         # Protected & Admin route guards
    ├── package.json        # Frontend dependencies
    └── vite.config.js      # Vite build configuration
```

---

## 🚀 Getting Started & Installation

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Active MongoDB Atlas connection URI

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables in `backend/.env`:
   ```ini
   PROJECT_NAME="Dayflow HRMS System"
   MONGODB_URL="mongodb+srv://<username>:<password>@cluster.mongodb.net/?appName=Cluster0"
   DATABASE_NAME="dayflow_hrms"
   SECRET_KEY="your-secret-key"
   ALGORITHM="HS256"
   ACCESS_TOKEN_EXPIRE_MINUTES=1440

   # SMTP Credentials for OTP Email Sending
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASSWORD="your-app-password"
   SMTP_FROM_EMAIL="your-email@gmail.com"
   SMTP_FROM_NAME="Dayflow HRMS System"
   ```

5. Run unit tests to verify installation:
   ```bash
   .\venv\Scripts\pytest
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   API interactive documentation will be available at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The application will launch at `http://localhost:5173`.

4. Build production bundle:
   ```bash
   npm run build
   ```

---

## 🔑 Default API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
| :---: | :--- | :--- | :---: |
| `POST` | `/api/auth/signup` | Register a new user account | Public |
| `POST` | `/api/auth/login` | Sign in & receive OAuth2 JWT bearer token | Public |
| `POST` | `/api/auth/forgot-password` | Request 6-digit OTP email | Public |
| `POST` | `/api/auth/reset-password` | Reset password using verified OTP | Public |
| `GET` | `/api/employees/me` | Fetch active user profile | Employee / Admin |
| `PUT` | `/api/employees/me` | Update phone, address, and profile picture avatar | Employee / Admin |
| `POST` | `/api/attendance/checkin` | Daily check-in | Employee / Admin |
| `POST` | `/api/attendance/checkout` | Daily check-out (Enforces 7-hr half-day rule) | Employee / Admin |
| `GET` | `/api/attendance/me` | Fetch employee attendance history | Employee / Admin |
| `GET` | `/api/leave/me` | Fetch employee time-off requests | Employee / Admin |
| `POST` | `/api/leave` | Apply for time off | Employee / Admin |
| `GET` | `/api/payroll/me` | Fetch employee payslips & download PDF | Employee / Admin |
| `GET` | `/api/recruitment/jobs` | List recruitment job openings | HR Admin |
| `POST` | `/api/recruitment/candidates` | Register job applicant in ATS pipeline | HR Admin |
| `PUT` | `/api/recruitment/candidates/{id}/stage` | Advance applicant hiring pipeline stage | HR Admin |
| `GET` | `/api/reports/csv/{report_type}` | Download Excel-ready CSV reports (`\uFEFF` UTF-8 BOM) | HR Admin |

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
