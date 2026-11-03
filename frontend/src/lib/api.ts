import axios from 'axios';

const api = axios.create({
  // Set VITE_API_URL at build time for deployments (e.g. https://qorepath-api.onrender.com/api).
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3005/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Don't hijack 401s from the auth endpoints — those are handled by the
      // login/register pages (e.g. "Invalid email or password"). Only force a
      // redirect when a real, already-authenticated session has expired.
      const url = err.config?.url ?? '';
      const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register');
      const hasSession = !!localStorage.getItem('token');
      const isPublicPage = window.location.pathname.startsWith('/public');

      if (!isAuthRequest && hasSession && !isPublicPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export default api;
