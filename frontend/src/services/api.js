import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/public`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token
api.interceptors.request.use(
  (config) => {
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
