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

export function hasRole(userRole: UserRole | null | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
}

export const roleLabels: Record<UserRole, string> = {
  ADVISOR: '服务顾问',
  TECHNICIAN: '维修技师',
  PARTS_CLERK: '配件员',
  MANAGER: '厂长',
};

export const roleBadgeColors: Record<UserRole, string> = {
  ADVISOR: 'bg-blue-100 text-blue-800',
  TECHNICIAN: 'bg-green-100 text-green-800',
  PARTS_CLERK: 'bg-amber-100 text-amber-800',
  MANAGER: 'bg-purple-100 text-purple-800',
};

export const workOrderStatusLabels: Record<string, string> = {
  PENDING: '待处理',
  IN_PROGRESS: '进行中',
  WAITING_PARTS: '待配件',
  QUALITY_CHECK: '质检中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

export const workOrderStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  WAITING_PARTS: 'bg-orange-100 text-orange-800',
  QUALITY_CHECK: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-slate-100 text-slate-800',
};

export const partRequestStatusLabels: Record<string, string> = {
  PENDING: '待审批',
  APPROVED: '已批准',
  REJECTED: '已拒绝',
  PROCURING: '采购中',
  COMPLETED: '已完成',
};

export const maintenanceTypeLabels: Record<string, string> = {
  OIL_CHANGE: '机油更换',
  TIRE_ROTATION: '轮胎换位',
  BRAKE_SERVICE: '刹车保养',
  TRANSMISSION_SERVICE: '变速箱保养',
  COOLANT_SERVICE: '冷却液更换',
  BATTERY_CHECK: '电瓶检查',
  TIMING_BELT: '正时皮带',
  GENERAL_INSPECTION: '综合检查',
  CUSTOM: '自定义',
};
