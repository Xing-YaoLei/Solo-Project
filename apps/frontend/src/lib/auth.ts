import { UserRole } from '@/store/auth';

export function hasRole(userRole: UserRole | undefined, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'ADMIN';
}

export function isManager(role: UserRole | undefined): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function isFrontline(role: UserRole | undefined): boolean {
  return role === 'FRONTLINE';
}
