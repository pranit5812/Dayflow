import axiosClient from './axiosClient';

export const leaveApi = {
  apply: (data) => axiosClient.post('/leave/apply', data),
  getMyLeaves: () => axiosClient.get('/leave/me'),
  getMyBalance: () => axiosClient.get('/leave/balance/me'),
  getEmployeeBalance: (id) => axiosClient.get(`/leave/balance/${id}`),
  listAll: (params) => axiosClient.get('/leave', { params }),
  review: (id, reviewData) => axiosClient.post(`/leave/${id}/review`, reviewData),
};
