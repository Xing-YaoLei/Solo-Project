import { create } from 'zustand';
import type { User } from '@/types';
import { authApi } from '@/api';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (username, password) => {
        const res = await authApi.login({ username, password });
        set({ user: res.user, token: res.access_token });
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));
      },
      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      },
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
