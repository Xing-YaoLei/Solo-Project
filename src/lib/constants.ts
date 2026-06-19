export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['dashboard:view', 'dashboard:export', 'dashboard:share', 'inspection:view', 'inspection:edit', 'inventory:view', 'quotes:view', 'users:manage'],
  dispatcher: ['dashboard:view', 'dashboard:export', 'inspection:view', 'inventory:view', 'quotes:view'],
  inspector: ['dashboard:view', 'inspection:view', 'inspection:edit', 'inventory:view', 'quotes:view'],
  viewer: ['dashboard:view'],
};

export function hasPermission(role: string, permission: string): boolean {
  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;
  return rolePerms.includes(permission);
}
