import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  isCoach: () => boolean;
  isAdmin: () => boolean;
}

const getStoredToken = () => localStorage.getItem('token');
const getStoredUser = (): User | null => {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getStoredToken(),
  user: getStoredUser(),
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
  isCoach: () => get().user?.role === 1 || get().user?.role === 2,
  isAdmin: () => get().user?.role === 2
}));
