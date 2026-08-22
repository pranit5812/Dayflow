import axiosClient from './axiosClient';

export const employeeApi = {
  getMyProfile: () => axiosClient.get('/employees/me'),
  updateMyProfile: (data) => axiosClient.put('/employees/me', data),
  listEmployees: (params) => axiosClient.get('/employees', { params }),
  getEmployee: (id) => axiosClient.get(`/employees/${id}`),
  updateEmployeeAdmin: (id, data) => axiosClient.put(`/employees/${id}`, data),
  uploadDocument: (id, name, url) => axiosClient.post(`/employees/${id}/documents?doc_name=${encodeURIComponent(name)}&doc_url=${encodeURIComponent(url)}`),
};
