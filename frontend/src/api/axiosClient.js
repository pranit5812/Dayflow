import axios from 'axios';

const axiosClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dayflow_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if unauthorized and not already on login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('dayflow_access_token');
        localStorage.removeItem('dayflow_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data?.detail || error.message || 'An unexpected error occurred');
  }
);

export default axiosClient;
