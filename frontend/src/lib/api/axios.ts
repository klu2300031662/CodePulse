import axios from 'axios';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

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