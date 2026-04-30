import api from './axios';

export const AuthService = {
  login: async (data: any) => {
    try {
      const response = await api.post('auth/signin', data);
      if (response.data.token) {
        // Store in localStorage for the axios interceptor
        localStorage.setItem('user', JSON.stringify(response.data));
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

  logout: () => {
    localStorage.removeItem('user');
  },

  forgotPassword: async (data: any) => {
    try {
      const response = await api.post('auth/forgot-password', data);
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

  googleLogin: async (credential: string) => {
    try {
      const response = await api.post('auth/google', { credential });
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
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
};
