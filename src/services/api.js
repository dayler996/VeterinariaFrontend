import axios from 'axios';

const api = axios.create({
  baseURL: `/api`,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Request: añade el token si existe ── */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ── Response: maneja 401 SIN provocar loop de recargas ── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');

      // Solo redirige si NO estamos ya en una pantalla pública.
      // Sin esta condición, un 401 en /login causaría un loop infinito
      // (recarga → 401 → recarga → 401 → …)
      const path = window.location.pathname;
      const publicPaths = ['/login', '/register', '/forgot-password'];
      if (!publicPaths.includes(path)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;