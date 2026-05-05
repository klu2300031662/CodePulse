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

// Helper to check if current user is guest
function isGuestUser(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.isGuest === true;
    }
  } catch {}
  return false;
}

// ── Request Interceptor: Attach JWT token OR cancel for guest users ──
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');

    if (userStr) {
      const user = JSON.parse(userStr);

      if (user.isGuest) {
        // Guest users should never hit the real API.
        // Cancel the request with a silent error that components can catch gracefully.
        const cancelSource = axios.CancelToken.source();
        config.cancelToken = cancelSource.token;
        cancelSource.cancel('Guest mode — API call skipped');
        return config;
      }

      if (user.token) {
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
    // Silently ignore cancelled requests (guest mode)
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (typeof window !== 'undefined' && error.response) {
      const status = error.response.status;

      // Auto-logout on 401 (expired/invalid token) — skip for guest users
      if (status === 401) {
        const currentPath = window.location.pathname;
        // Don't redirect if already on auth pages or if this is a login/signup request
        const isAuthPage = currentPath.startsWith('/login') || currentPath.startsWith('/register') || currentPath.startsWith('/forgot-password') || currentPath.startsWith('/reset-password');
        const isAuthRequest = error.config?.url?.includes('auth/');

        if (!isAuthPage && !isAuthRequest && !isGuestUser()) {
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