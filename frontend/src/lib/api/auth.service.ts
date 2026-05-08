import api from './axios';

// ── Session token cache helpers ──
const SESSION_CACHE_KEY = 'cp_session_cache';
const SESSION_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface SessionCache {
  data: any;
  timestamp: number;
}

function getCachedSession(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(SESSION_CACHE_KEY);
    if (!cached) return null;
    const parsed: SessionCache = JSON.parse(cached);
    // Check if cache is still valid
    if (Date.now() - parsed.timestamp < SESSION_CACHE_TTL) {
      return parsed.data;
    }
    // Expired — clear it
    localStorage.removeItem(SESSION_CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

function setCachedSession(data: any): void {
  if (typeof window === 'undefined') return;
  const cache: SessionCache = { data, timestamp: Date.now() };
  localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cache));
}

function clearCachedSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_CACHE_KEY);
}

export const AuthService = {
  login: async (data: any) => {
    try {
      const response = await api.post('auth/signin', data);
      if (response.data.token) {
        // Store in localStorage for the axios interceptor
        localStorage.setItem('user', JSON.stringify(response.data));
        // Cache the session to skip re-authentication on revisit
        setCachedSession(response.data);
      }
      return response.data;
    } catch (error: any) {
      // Re-throw with better error info
      if (error.response) {
        // Server responded with error status
        throw error;
      } else if (error.request) {
        // Request was made but no response (network error, CORS, backend down)
        throw new Error('Unable to reach the server. The backend may be starting up (Render free tier can take ~30 seconds). Please try again.');
      } else {
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  register: async (data: any) => {
    try {
      const response = await api.post('auth/signup', data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error;
      } else if (error.request) {
        throw new Error('Unable to reach the server. The backend may be starting up (Render free tier can take ~30 seconds). Please try again.');
      } else {
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  sendOtp: async (data: { email: string; name: string }) => {
    try {
      const response = await api.post('auth/send-otp', data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error;
      } else if (error.request) {
        throw new Error('Unable to reach the server. The backend may be starting up. Please try again.');
      } else {
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  verifyOtp: async (data: { email: string; otp: string }) => {
    try {
      const response = await api.post('auth/verify-otp', data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error;
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      } else {
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    clearCachedSession();
  },

  deleteAccount: async () => {
    try {
      const response = await api.delete('auth/delete-account');
      localStorage.removeItem('user');
      clearCachedSession();
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error;
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      } else {
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  forgotPassword: async (data: any) => {
    try {
      // Longer timeout: SMTP on Render free tier can be slow
      const response = await api.post('auth/forgot-password', data, { timeout: 60000 });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error;
      } else if (error.request) {
        throw new Error('The server is taking too long to respond. It may be waking up — please wait 30 seconds and try again.');
      } else {
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  resetPassword: async (data: any) => {
    try {
      const response = await api.post('auth/reset-password', data);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error;
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      } else {
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  validateResetToken: async (token: string) => {
    try {
      const response = await api.get(`auth/validate-reset-token?token=${encodeURIComponent(token)}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error;
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      } else {
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  googleLogin: async (credential: string) => {
    try {
      const response = await api.post('auth/google', { credential });
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
        setCachedSession(response.data);
      }
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error;
      } else if (error.request) {
        throw new Error('Unable to reach the server. Please try again.');
      } else {
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  },

  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) return JSON.parse(userStr);
    }
    return null;
  },

  /**
   * Check if there's a cached valid session.
   * Returning users skip the login API call if their session is still valid.
   */
  getCachedSession,

  /**
   * Clear the cached session (e.g. on logout or token expiry)
   */
  clearCachedSession,
};
