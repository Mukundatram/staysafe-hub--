import axios from 'axios';

// In development, point directly to backend to avoid CRA proxy edge-cases.
const devBase = 'http://localhost:4000/api';
const api = axios.create({
  baseURL: (process.env.NODE_ENV === 'development' ? devBase : '/api'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('staysafe-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('staysafe-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
