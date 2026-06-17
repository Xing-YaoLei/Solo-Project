import { create } from 'zustand';
import type { User } from '@/types';
import { users } from '@/mock/data';
import { authApi } from '@/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setToken: (token: string) => void;
}

const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJVMDAzIiwicm9sZSI6ImF1ZGl0b3IiLCJleHAiOjE5Njc5MDAwMDB9.mocktoken';

const getStoredToken = () => localStorage.getItem('auth_token');
const setStoredToken = (token: string) => localStorage.setItem('auth_token', token);
const clearStoredToken = () => localStorage.removeItem('auth_token');

export const useAuthStore = create<AuthState>((set) => {
  const storedToken = getStoredToken();
  const defaultUser = users.find(u => u.id === 'U003') || null;

  return {
    user: storedToken ? defaultUser : null,
    isAuthenticated: !!storedToken,
    token: storedToken,

    setToken: (token: string) => {
      setStoredToken(token);
      set({ token, isAuthenticated: true });
    },

    login: async (username: string, password: string) => {
      try {
        const res = await authApi.login({ username, password });
        const token = res.data.access_token;
        setStoredToken(token);
        const user = users.find((u) => u.username === username) || defaultUser;
        set({ user, isAuthenticated: true, token });
        return true;
      } catch (e) {
        console.warn('Auth API failed, using mock login');
        const user = users.find((u) => u.username === username);
        if (user) {
          setStoredToken(MOCK_TOKEN);
          set({ user, isAuthenticated: true, token: MOCK_TOKEN });
          return true;
        }
        return false;
      }
    },

    logout: () => {
      clearStoredToken();
      set({ user: null, isAuthenticated: false, token: null });
    },
  };
});
