import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  name?: string;
  email: string;
  token: string;
  isGuest?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (user: User) => void;
  loginAsGuest: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      login: (user) => {
        // Also store in localStorage for axios interceptor compatibility
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isAuthenticated: true, isGuest: false });
      },
      loginAsGuest: () => {
        const guestUser: User = {
          id: 0,
          username: 'guest_user',
          name: 'Guest User',
          email: 'guest@codepulse.demo',
          token: 'guest-mode-token',
          isGuest: true,
        };
        // Don't store guest token for axios — guest doesn't hit real APIs
        localStorage.setItem('user', JSON.stringify(guestUser));
        set({ user: guestUser, isAuthenticated: true, isGuest: true });
      },
      logout: () => {
        // Clear both zustand persisted state AND the 'user' key used by axios interceptor
        localStorage.removeItem('user');
        // Clear the dashboard data cache
        const { invalidateAll } = require('@/lib/store/dashboard.store').useDashboardStore.getState();
        invalidateAll();
        set({ user: null, isAuthenticated: false, isGuest: false });
      },
    }),
    {
      name: 'auth-storage', 
    }
  )
);
