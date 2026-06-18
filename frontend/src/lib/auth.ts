import type { UserRole, User } from './types';
import { authApi } from './api';

const TOKEN_KEY = 'mp_token';
const USER_KEY = 'mp_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function login(username: string, password: string) {
  const res = await authApi.login({ username, password });
  const { access_token } = res.data;
  setToken(access_token);
  try {
    const userRes = await authApi.getCurrentUser();
    const user = userRes.data;
    setStoredUser(user);
    return user;
  } catch {
    return null;
  }
}

export async function logout() {
  removeToken();
}

export async function getCurrentUser(): Promise<User | null> {
  const stored = getStoredUser();
  if (stored) return stored;
  try {
    const res = await authApi.getCurrentUser();
    const user = res.data;
    setStoredUser(user);
    return user;
  } catch {
    return null;
  }
}

export function isRole(user: User | null, role: UserRole): boolean {
  return user?.role === role;
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  const permissions: Record<UserRole, string[]> = {
    consultant: ['work_orders', 'quotes', 'inspections'],
    technician: ['work_orders:assigned', 'inspections'],
    parts_staff: ['parts', 'shortages', 'parts_issue'],
    manager: [
      'work_orders',
      'quotes',
      'inspections',
      'parts',
      'shortages',
      'statistics',
      'parts_issue',
    ],
  };
  return permissions[user.role]?.includes(permission) ?? false;
}

export function canAccess(user: User | null, path: string): boolean {
  if (!user) return false;
  const role = user.role;
  const accessMap: Record<UserRole, string[]> = {
    consultant: ['/work-orders', '/quotes', '/inspections', '/'],
    technician: ['/work-orders', '/inspections', '/'],
    parts_staff: ['/parts', '/shortages', '/'],
    manager: [
      '/work-orders',
      '/quotes',
      '/inspections',
      '/parts',
      '/shortages',
      '/statistics',
      '/',
    ],
  };
  return accessMap[role]?.some((p) => path.startsWith(p)) ?? false;
}

export const roleLabels: Record<UserRole, string> = {
  consultant: '顾问',
  technician: '技师',
  parts_staff: '配件员',
  manager: '厂长',
};
