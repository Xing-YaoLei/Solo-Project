export type UserRole = "manager" | "store_staff";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  storeId?: string | null;
}

export interface SessionData {
  user: AuthUser;
  expiresAt: Date;
}

export const ROLES = {
  MANAGER: "manager" as UserRole,
  STORE_STAFF: "store_staff" as UserRole,
};

export function hasPermission(user: AuthUser, requiredRole: UserRole): boolean {
  if (user.role === ROLES.MANAGER) return true;
  return user.role === requiredRole;
}

export function canAccessStore(user: AuthUser, storeId: string): boolean {
  if (user.role === ROLES.MANAGER) return true;
  return user.storeId === storeId;
}

export function getAccessibleStoreIds(user: AuthUser, allStoreIds: string[]): string[] {
  if (user.role === ROLES.MANAGER) return allStoreIds;
  return user.storeId ? [user.storeId] : [];
}
