import axios from 'axios';

// ==============================
// BASE URL
// ==============================
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  withCredentials: false,
});

// ==============================
// REQUEST INTERCEPTOR (ADD TOKEN)
// ==============================
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==============================
// RESPONSE INTERCEPTOR (HANDLE ERRORS)
// ==============================
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Unauthorized (Token expired / invalid)
    if (error.response?.status === 401) {
      console.warn('Session expired. Redirecting to login...');

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Prevent infinite redirect loop
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Optional: handle 500 errors
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

export default API;