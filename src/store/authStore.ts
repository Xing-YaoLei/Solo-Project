import { create } from 'zustand';
import type { User } from '@/types';
import { mockUsers, mockCurrentUser } from '@/mock/data';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: mockCurrentUser,
  isAuthenticated: true,
  login: async (username, password) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const user = mockUsers.find(u => u.username === username);
    if (user && password === '123456') {
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => {
    set({ user: null, isAuthenticated: false });
  },
}));
