import axios from 'axios';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://codepulse-backend-ktl0.onrender.com';
const API_URL = `${rawApiUrl.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');

    if (userStr) {
      const user = JSON.parse(userStr);

      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
  }

  return config;
});

export default api;