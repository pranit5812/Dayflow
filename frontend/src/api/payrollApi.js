import axiosClient from './axiosClient';

export const payrollApi = {
  getMyPayroll: () => axiosClient.get('/payroll/me'),
  updateSalaryStructure: (employeeId, data) => axiosClient.put(`/payroll/${employeeId}/salary-structure`, data),
  generatePayroll: (data) => axiosClient.post('/payroll/generate', data),
  finalizeSlip: (slipId) => axiosClient.post(`/payroll/${slipId}/finalize`),
  updatePayday: (slipId, scheduled_disbursement_date) => axiosClient.put(`/payroll/${slipId}/payday`, { scheduled_disbursement_date }),
  listAll: (params) => axiosClient.get('/payroll', { params }),
};
