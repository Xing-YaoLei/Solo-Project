import { create } from 'zustand';
import type { User, UserRole } from '@/types';
import { authApi } from '@/api';

interface AuthState {
  token: string | null;
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('access_token'),
  currentUser: (() => {
    const saved = localStorage.getItem('current_user');
    return saved ? JSON.parse(saved) : null;
  })(),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(username, password);
      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      set({ token: access_token, isAuthenticated: true });
      await get().fetchCurrentUser();
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    set({
      token: null,
      currentUser: null,
      isAuthenticated: false,
    });
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const response = await authApi.getMe();
      const user = response.data;
      localStorage.setItem('current_user', JSON.stringify(user));
      set({ currentUser: user });
    } catch (error) {
      get().logout();
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  hasRole: (...roles: UserRole[]) => {
    const user = get().currentUser;
    return !!user && roles.includes(user.role);
  },
}));
