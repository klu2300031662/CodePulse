import api from './axios';

export const AuthService = {
  login: async (data: any) => {
    const response = await api.post('auth/signin', data);
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  register: async (data: any) => {
    const response = await api.post('auth/signup', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('user');
  },

  forgotPassword: async (data: any) => {
    const response = await api.post('auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: any) => {
    const response = await api.post('auth/reset-password', data);
    return response.data;
  },

  googleDemo: async () => {
    const response = await api.post('auth/google-demo');
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) return JSON.parse(userStr);
    }
    return null;
  },
};
