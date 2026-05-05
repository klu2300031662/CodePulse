import axios from 'axios';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://codepulse-backend-ktl0.onrender.com';
const API_URL = `${rawApiUrl.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s timeout (Render free tier cold starts)
});

// ── Request Interceptor: Attach JWT token (skip for guest mode) ──
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');

    if (userStr) {
      const user = JSON.parse(userStr);

      // Skip attaching token for guest users — they don't have a real JWT
      if (user.token && !user.isGuest) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
  }

  return config;
});

// ── Response Interceptor: Handle errors globally ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response) {
      const status = error.response.status;

      // Auto-logout on 401 (expired/invalid token)
      if (status === 401) {
        const currentPath = window.location.pathname;
        // Don't redirect if already on auth pages or if this is a login/signup request
        const isAuthPage = currentPath.startsWith('/login') || currentPath.startsWith('/register') || currentPath.startsWith('/forgot-password') || currentPath.startsWith('/reset-password');
        const isAuthRequest = error.config?.url?.includes('auth/');

        if (!isAuthPage && !isAuthRequest) {
          localStorage.removeItem('user');
          localStorage.removeItem('auth-storage');
          window.location.href = '/login?session=expired';
        }
      }

      // Normalize error message from backend ErrorResponse format
      const data = error.response.data;
      if (data && typeof data === 'object') {
        // Backend sends { status, error, message, path, timestamp, details }
        error.backendMessage = data.message || data.error || 'An error occurred';
        error.backendDetails = data.details || null;
      }
    }

    return Promise.reject(error);
  }
);

export default api;