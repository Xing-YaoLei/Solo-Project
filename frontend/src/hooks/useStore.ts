import { create } from 'zustand';
import type { User } from '@/types';

interface AuthStore {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

const savedToken = localStorage.getItem('token');
const savedUser = localStorage.getItem('user');

export const useAuthStore = create<AuthStore>((set) => ({
  token: savedToken,
  user: savedUser ? JSON.parse(savedUser) : null,
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));

interface DeviceStore {
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  isMobile: window.innerWidth < 768,
  setIsMobile: (isMobile) => set({ isMobile }),
}));
