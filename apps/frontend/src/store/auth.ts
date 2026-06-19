import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { setToken, clearToken, subscribe, initTokenStore } from '@/lib/token';

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
  setTokenValue: (token: string | null) => void;
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
        initTokenStore();

        try {
          const stored = localStorage.getItem('auth-storage');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.state?.token) {
              set({ token: parsed.state.token });
            }
            if (parsed.state?.user) {
              set({ user: parsed.state.user });
            }
          } else {
            const t = localStorage.getItem('token');
            const u = localStorage.getItem('user');
            if (t) set({ token: t });
            if (u) {
              try { set({ user: JSON.parse(u) }); } catch (_) { /* ignore */ }
            }
          }
        } catch (_) { /* ignore */ }

        set({ initialized: true });
      },

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { username, password });
          const { accessToken, user } = response.data;
          set({ token: accessToken, user, isLoading: false });
          setToken(accessToken);
          if (typeof window !== 'undefined') {
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
        } catch (_) { /* ignore */ }
        set({ token: null, user: null });
        clearToken();
      },

      fetchProfile: async () => {
        try {
          const response = await api.get('/auth/profile');
          const user = response.data;
          set({ user });
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(user));
          }
          return true;
        } catch (error: any) {
          if (error.response?.status === 401) {
            set({ token: null, user: null });
            clearToken();
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

      setTokenValue: (token) => {
        set({ token });
        setToken(token);
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

subscribe((token) => {
  if (token === null) {
    useAuthStore.setState({ token: null, user: null });
  }
});
