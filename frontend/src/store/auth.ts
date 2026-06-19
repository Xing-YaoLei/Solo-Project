import { create } from 'zustand';
import { api } from '../api';
import { User, RoleEnum } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  hasRole: (...roles: RoleEnum[]) => boolean;
}

export const useAuth = create<AuthState>((set, get) => ({
  token: localStorage.getItem('access_token'),
  user: localStorage.getItem('current_user')
    ? JSON.parse(localStorage.getItem('current_user') as string)
    : null,
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: async (username: string, password: string) => {
    const form = new FormData();
    form.append('username', username);
    form.append('password', password);
    const res = await api.post<{ access_token: string; token_type: string }>('/auth/login', form);
    const token = res.data.access_token;
    localStorage.setItem('access_token', token);
    set({ token, isAuthenticated: true });
    await get().fetchMe();
  },

  register: async (data: any) => {
    await api.post<User>('/auth/register', data);
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const res = await api.get<User>('/auth/me');
      localStorage.setItem('current_user', JSON.stringify(res.data));
      set({ user: res.data });
    } catch {
      get().logout();
    }
  },

  hasRole: (...roles: RoleEnum[]) => {
    const user = get().user;
    if (!user) return false;
    if (user.role === 'admin') return true;
    return roles.includes(user.role);
  },
}));
