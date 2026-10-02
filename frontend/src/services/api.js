import axios from 'axios';

// Ensure base URL has no trailing slashes and properly points to /api/public
const getBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').trim().replace(/\/+$/, '');
  
  if (envUrl.endsWith('/api/public')) {
    return envUrl;
  }
  if (envUrl.endsWith('/api')) {
    return `${envUrl}/public`;
  }
  return `${envUrl}/api/public`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token and normalize path slashes
api.interceptors.request.use(
  (config) => {
    if (config.url) {
      config.url = config.url.replace(/^\/+/, '/');
    }
    const token = sessionStorage.getItem('portal_jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const verifyParent = async (barcode, accessCode = '') => {
  const res = await api.post('/verify', { barcode, accessCode });
  return res.data;
};

export const fetchStudentResults = async (barcode) => {
  const res = await api.get(`/student/${barcode}/results`);
  return res.data;
};

export default api;
