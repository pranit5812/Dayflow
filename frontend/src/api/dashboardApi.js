import axiosClient from './axiosClient';

export const dashboardApi = {
  getEmployeeDashboard: () => axiosClient.get('/dashboard/employee'),
  getAdminDashboard: () => axiosClient.get('/dashboard/admin'),
};

export const reportsApi = {
  getPaystubPdfUrl: (slipId) => `/api/reports/paystub/${slipId}/pdf`,
  getAttendanceCsvUrl: (month) => `/api/reports/attendance/csv?month=${month}`,
  getPayrollCsvUrl: (month) => `/api/reports/payroll/csv?month=${month}`,
};
