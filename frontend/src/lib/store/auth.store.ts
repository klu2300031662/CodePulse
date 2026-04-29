import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  name?: string;
  email: string;
  token: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => {
        // Also store in localStorage for axios interceptor compatibility
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        // Clear both zustand persisted state AND the 'user' key used by axios interceptor
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage', 
    }
  )
);
