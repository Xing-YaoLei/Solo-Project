import { create } from 'zustand';
import type { User } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  login: async (username, password) => {
    const response = await authService.login({ username, password });
    localStorage.setItem('token', response.token);
    set({ token: response.token, isAuthenticated: true });
    await useAuthStore.getState().loadUser();
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  loadUser: async () => {
    try {
      const user = await authService.getMe();
      set({ user });
    } catch {
      useAuthStore.getState().logout();
    }
  },
}));
