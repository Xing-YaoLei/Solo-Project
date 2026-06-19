import type { User, UserRole } from './types';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const authStorage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  setUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  removeUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(USER_KEY);
  },

  clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export function hasRole(userRole: UserRole | null, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export const roleLabels: Record<UserRole, string> = {
  advisor: '服务顾问',
  technician: '维修技师',
  partsClerk: '配件员',
  manager: '厂长',
};

export const roleBadgeColors: Record<UserRole, string> = {
  advisor: 'bg-blue-100 text-blue-800',
  technician: 'bg-green-100 text-green-800',
  partsClerk: 'bg-amber-100 text-amber-800',
  manager: 'bg-purple-100 text-purple-800',
};
