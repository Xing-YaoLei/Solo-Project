import { create } from 'zustand';
import type { UserInfo } from '@/types';
import { authApi } from '@/services/api';

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const initialToken = localStorage.getItem('token');
const initialUser = localStorage.getItem('user');

export const useAuthStore = create<AuthState>((set) => ({
  token: initialToken,
  user: initialUser ? JSON.parse(initialUser) : null,
  isAuthenticated: !!initialToken,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(email, password);
      if (res.success && res.data) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        set({
          token: res.data.token,
          user: res.data.user,
          isAuthenticated: true,
          isLoading: false
        });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (error) {
      set({ isLoading: false });
      return false;
    }
  },

  register: async (data: any) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register(data);
      if (res.success && res.data) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        set({
          token: res.data.token,
          user: res.data.user,
          isAuthenticated: true,
          isLoading: false
        });
        return true;
      }
      set({ isLoading: false });
      return false;
    } catch (error) {
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    try {
      const res = await authApi.getCurrentUser();
      if (res.success && res.data) {
        localStorage.setItem('user', JSON.stringify(res.data));
        set({ user: res.data, isAuthenticated: true });
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null, isAuthenticated: false });
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null, isAuthenticated: false });
    }
  }
}));

export const useRolePermissions = () => {
  const { user } = useAuthStore();
  const role = user?.role ?? 0;

  return {
    isAuditor: role === 1 || role === 3 || role === 4,
    isBusinessOwner: role === 2 || role === 3 || role === 4,
    isComplianceOfficer: role === 3 || role === 4,
    isManagement: role === 4,
    role
  };
};
