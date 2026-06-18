import { create } from 'zustand';
import type { User } from '@/types';
import { api } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  initFromLocalStorage: () => Promise<void>;
}

const tokenKey = 'auth_token';
const userKey = 'auth_user';

function readUserCache(): User | null {
  try {
    const raw = localStorage.getItem(userKey);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeUserCache(u: User | null) {
  try {
    if (u) localStorage.setItem(userKey, JSON.stringify(u));
    else localStorage.removeItem(userKey);
  } catch {}
}

export const useAuthStore = create<AuthState>((set) => ({
  user: readUserCache(),
  isAuthenticated: !!localStorage.getItem(tokenKey),
  loading: false,
  login: async (username, password) => {
    try {
      const res = await api.login(username, password);
      if (!res?.accessToken) return false;
      const me = await api.getCurrentUser();
      const user: User = {
        id: me?.id || '',
        username: me?.username || username,
        name: me?.fullName || username,
        role: (me?.role as any) || 'admin',
        region: '华东',
        createdAt: new Date().toISOString(),
      };
      writeUserCache(user);
      set({ user, isAuthenticated: true });
      return true;
    } catch (e) {
      console.error('login failed', e);
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem(tokenKey);
    writeUserCache(null);
    set({ user: null, isAuthenticated: false });
  },
  initFromLocalStorage: async () => {
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    try {
      const me = await api.getCurrentUser();
      if (me) {
        const user: User = {
          id: me.id,
          username: me.username,
          name: me.fullName || me.username,
          role: (me.role as any) || 'admin',
          region: '华东',
          createdAt: new Date().toISOString(),
        };
        writeUserCache(user);
        set({ user, isAuthenticated: true });
      } else {
        localStorage.removeItem(tokenKey);
        set({ isAuthenticated: false, user: null });
      }
    } catch {
      localStorage.removeItem(tokenKey);
      set({ isAuthenticated: false, user: null });
    }
  },
}));
