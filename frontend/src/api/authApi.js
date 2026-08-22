import axiosClient from './axiosClient';

export const authApi = {
  signup: (userData) => axiosClient.post('/auth/signup', userData),
  login: (credentials) => axiosClient.post('/auth/login', credentials),
  refresh: (refreshToken) => axiosClient.post(`/auth/refresh?refresh_token=${refreshToken}`),
  getMe: () => axiosClient.get('/auth/me'),
  forgotPassword: (loginId) => axiosClient.post('/auth/forgot-password', { login_id: loginId }),
  resetPassword: (loginId, otpCode, newPassword) => axiosClient.post('/auth/reset-password', { login_id: loginId, otp_code: otpCode, new_password: newPassword }),
};
