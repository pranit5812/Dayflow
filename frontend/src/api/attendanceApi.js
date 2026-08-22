import axiosClient from './axiosClient';

export const attendanceApi = {
  checkIn: () => axiosClient.post('/attendance/checkin'),
  checkOut: () => axiosClient.post('/attendance/checkout'),
  getToday: () => axiosClient.get('/attendance/today'),
  getMyHistory: (month) => axiosClient.get('/attendance/me', { params: { month } }),
  listAll: (params) => axiosClient.get('/attendance', { params }),
  manualUpdate: (data) => axiosClient.put('/attendance/manual', data),
};
