import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './routes/ProtectedRoute';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';

// Auth Pages
import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';

// Employee Pages
import { Profile } from './pages/employee/Profile';
import { Attendance } from './pages/employee/Attendance';
import { LeaveRequests } from './pages/employee/LeaveRequests';
import { Payroll } from './pages/employee/Payroll';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { EmployeeList } from './pages/admin/EmployeeList';
import { AttendanceRecords } from './pages/admin/AttendanceRecords';
import { LeaveApprovals } from './pages/admin/LeaveApprovals';
import { PayrollControl } from './pages/admin/PayrollControl';
import { Reports } from './pages/admin/Reports';
import { Recruitment } from './pages/admin/Recruitment';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Routes>
            {/* Excalidraw Employee Routes */}
            <Route path="/employee/profile" element={<Profile />} />
            <Route path="/employee/attendance" element={<Attendance />} />
            <Route path="/employee/time-off" element={<LeaveRequests />} />
            <Route path="/employee/payroll" element={<Payroll />} />

            {/* Aliases for backwards compatibility */}
            <Route path="/dashboard" element={<EmployeeDashboard />} />
            <Route path="/profile" element={<Navigate to="/employee/profile" replace />} />
            <Route path="/attendance" element={<Navigate to="/employee/attendance" replace />} />
            <Route path="/leave" element={<Navigate to="/employee/time-off" replace />} />
            <Route path="/payroll" element={<Navigate to="/employee/payroll" replace />} />

            {/* Excalidraw Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/employees" element={<EmployeeList />} />
              <Route path="/admin/attendance" element={<AttendanceRecords />} />
              <Route path="/admin/time-off" element={<LeaveApprovals />} />
              <Route path="/admin/payroll" element={<PayrollControl />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/recruitment" element={<Recruitment />} />
            </Route>

            {/* Default Catchall */}
            <Route path="*" element={<Navigate to="/employee/profile" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected App Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<AppLayout />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
