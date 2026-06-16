import type { Role } from "./mock-data";

export interface RoleCheckResult {
  allowed: boolean;
  status: number;
  error?: string;
}

export function requireRole(
  userRole: Role | undefined,
  allowedRoles: Role[]
): RoleCheckResult {
  if (!userRole) {
    return { allowed: false, status: 401, error: "未登录或登录已过期" };
  }
  if (!allowedRoles.includes(userRole)) {
    return { allowed: false, status: 403, error: "权限不足，该操作仅限管理层或管理员" };
  }
  return { allowed: true, status: 200 };
}

export function parseRoleFromHeader(headers: Headers): Role | undefined {
  const role = headers.get("x-user-role") as Role | undefined;
  return role || undefined;
}

export function parseUserIdFromHeader(headers: Headers): string | undefined {
  return headers.get("x-user-id") || undefined;
}
