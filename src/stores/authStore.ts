import { create } from 'zustand';
import type { User } from '@/types';
import { users } from '@/mock/data';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: { id: 'U003', username: '王强', role: 'auditor', store_id: 'S001', region_id: 'R001', store_name: '健康大药房南京路店', region_name: '华东区' },
  isAuthenticated: true,
  login: (username: string, _password: string) => {
    const user = users.find((u) => u.username === username);
    if (user) {
      set({ user, isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));
