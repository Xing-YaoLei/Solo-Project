import { create } from 'zustand';
import type { User } from '@/types';
import { authApi } from '@/api';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isLoading: false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(username, password);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      set({ user: response.user, token: response.access_token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const user = await authApi.getMe();
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
    }
  },

  hasRole: (roles) => {
    const { user } = get();
    if (!user) return false;
    return roles.includes(user.role);
  },
}));
