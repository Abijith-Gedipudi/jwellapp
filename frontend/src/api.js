import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const usesPhpRouter = apiBaseUrl.includes('/crm/api');

const api = axios.create({
  baseURL: apiBaseUrl,
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    if (usesPhpRouter && config.url && !config.url.startsWith('api.php')) {
      const route = config.url.replace(/^\/+/, '');
      config.baseURL = `${apiBaseUrl.replace(/\/$/, '')}/api.php`;
      config.url = '';
      config.params = { route, ...(config.params || {}) };
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
