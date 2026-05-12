import api from './axios';
import axios from 'axios';

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

/**
 * Centralized error handler for all auth service calls.
 * Provides detailed, actionable error messages instead of generic "An unexpected error occurred."
 */
function handleAuthError(error: any, context: string): Error {
  // 1. Server responded with an HTTP error (4xx, 5xx) — pass through as-is
  if (error.response) {
    return error;
  }

  // 2. Request was made but no response received (network/CORS/timeout/backend down)
  if (error.request) {
    // Check for timeout specifically
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new Error(
        `${context} timed out. The server may be starting up (Render free tier can take ~30 seconds). Please wait a moment and try again.`
      );
    }
    // CORS or network error (ERR_NETWORK in Chrome)
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return new Error(
        `Unable to connect to the server. This can happen if the backend is waking up, or if a browser extension (like an ad-blocker) is blocking the request. Please try disabling extensions or try again in a few seconds.`
      );
    }
    return new Error(
      `Unable to reach the server. The backend may be starting up — please wait a few seconds and try again.`
    );
  }

  // 3. Error occurred during request setup (before the request was sent)
  // This is the "An unexpected error occurred" case — provide real diagnostics
  console.error(`[CodePulse] ${context} setup error:`, error.message, error);
  return new Error(
    `${context} failed due to a connection issue. Please check your internet connection, try disabling browser extensions, or refresh the page and try again.`
  );
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
      // Silently ignore cancelled requests (guest mode)
      if (axios.isCancel(error)) throw error;
      throw handleAuthError(error, 'Login');
    }
  },

  register: async (data: any) => {
    try {
      const response = await api.post('auth/signup', data);
      return response.data;
    } catch (error: any) {
      if (axios.isCancel(error)) throw error;
      throw handleAuthError(error, 'Registration');
    }
  },

  sendOtp: async (data: { email: string; name: string }) => {
    try {
      const response = await api.post('auth/send-otp', data);
      return response.data;
    } catch (error: any) {
      if (axios.isCancel(error)) throw error;
      throw handleAuthError(error, 'OTP');
    }
  },

  verifyOtp: async (data: { email: string; otp: string }) => {
    try {
      const response = await api.post('auth/verify-otp', data);
      return response.data;
    } catch (error: any) {
      if (axios.isCancel(error)) throw error;
      throw handleAuthError(error, 'OTP verification');
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
      if (axios.isCancel(error)) throw error;
      throw handleAuthError(error, 'Account deletion');
    }
  },

  forgotPassword: async (data: any) => {
    try {
      // Longer timeout: SMTP on Render free tier can be slow
      const response = await api.post('auth/forgot-password', data, { timeout: 60000 });
      return response.data;
    } catch (error: any) {
      if (axios.isCancel(error)) throw error;
      throw handleAuthError(error, 'Password reset');
    }
  },

  resetPassword: async (data: any) => {
    try {
      const response = await api.post('auth/reset-password', data);
      return response.data;
    } catch (error: any) {
      if (axios.isCancel(error)) throw error;
      throw handleAuthError(error, 'Password reset');
    }
  },

  validateResetToken: async (token: string) => {
    try {
      const response = await api.get(`auth/validate-reset-token?token=${encodeURIComponent(token)}`);
      return response.data;
    } catch (error: any) {
      if (axios.isCancel(error)) throw error;
      throw handleAuthError(error, 'Token validation');
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
      if (axios.isCancel(error)) throw error;
      throw handleAuthError(error, 'Google Sign In');
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
