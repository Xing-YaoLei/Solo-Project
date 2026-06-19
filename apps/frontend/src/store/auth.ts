import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

export type UserRole = 'ADMIN' | 'MANAGER' | 'FRONTLINE';

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  department?: string;
  avatarUrl?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<boolean>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  initFromStorage: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      initialized: false,

      initFromStorage: () => {
        if (typeof window === 'undefined') return;
        try {
          const stored = localStorage.getItem('auth-storage');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.state?.token) {
              localStorage.setItem('token', parsed.state.token);
            }
            if (parsed.state?.user) {
              localStorage.setItem('user', JSON.stringify(parsed.state.user));
            }
          } else {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (token) {
              set({ token });
            }
            if (userStr) {
              try {
                set({ user: JSON.parse(userStr) });
              } catch (e) {
                // ignore
              }
            }
          }
        } catch (e) {
          // ignore
        }
        set({ initialized: true });
      },

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { username, password });
          const { accessToken, user } = response.data;
          set({ token: accessToken, user, isLoading: false });
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', accessToken);
            localStorage.setItem('user', JSON.stringify(user));
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw error.response?.data?.message || '登录失败';
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (e) {
          // ignore
        }
        set({ token: null, user: null });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('auth-storage');
        }
      },

      fetchProfile: async () => {
        try {
          const response = await api.get('/auth/profile');
          set({ user: response.data });
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(response.data));
          }
          return true;
        } catch (e: any) {
          if (e.response?.status === 401) {
            set({ token: null, user: null });
            if (typeof window !== 'undefined') {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('auth-storage');
            }
          }
          return false;
        }
      },

      setUser: (user) => {
        set({ user });
        if (user && typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user));
        }
      },

      setToken: (token) => {
        set({ token });
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('token', token);
          } else {
            localStorage.removeItem('token');
          }
        }
      },

      hasRole: (roles: UserRole[]) => {
        const state = get();
        if (!state.user) return false;
        return roles.includes(state.user.role);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
