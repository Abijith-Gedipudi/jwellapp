import axios from 'axios';

// Simplest possible connection: just look for the 'api' folder relative to where we are
const api = axios.create({
  baseURL: '/crm/api',
});

api.interceptors.request.use(
  (config) => {
    // Convert routes like '/stores' to 'api.php?route=stores' for the PHP backend
    if (config.url && !config.url.includes('.php') && !config.url.startsWith('http')) {
      const route = config.url.replace(/^\/+/, '');
      config.url = 'api.php';
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
