'use client';

import { create } from 'zustand';
import type { User } from '@scenic/shared';
import { login as apiLogin, logout as apiLogout } from '@/lib/api/auth';

const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
};

const removeCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
  user: null,
  isAuthenticated: !!localStorage.getItem('auth_token'),

  login: async (phone: string, password: string) => {
    const response = await apiLogin({ phone, password });
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('auth_user', JSON.stringify(response.user));
    setCookie('auth_token', response.token);
    set({
      token: response.token,
      user: response.user,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      await apiLogout();
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      removeCookie('auth_token');
      set({
        token: null,
        user: null,
        isAuthenticated: false,
      });
    }
  },

  setAuth: (token: string, user: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    setCookie('auth_token', token);
    set({ token, user, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    removeCookie('auth_token');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
