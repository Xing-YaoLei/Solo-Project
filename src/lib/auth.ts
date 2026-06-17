export type UserRole = 'admin' | 'inspector' | 'maintenance' | 'finance' | 'tenant';

export const rolePermissions: Record<UserRole, string[]> = {
	admin: ['inspection', 'contracts', 'utilities', 'work-orders', 'approvals', 'archives', 'dashboard'],
	inspector: ['inspection', 'work-orders'],
	maintenance: ['work-orders'],
	finance: ['contracts', 'utilities', 'approvals'],
	tenant: ['work-orders', 'contracts', 'utilities']
};

export const roleLabels: Record<UserRole, string> = {
	admin: '园区管理员',
	inspector: '巡检员',
	maintenance: '维修人员',
	finance: '财务人员',
	tenant: '租户'
};

export function hasPermission(role: UserRole, module: string): boolean {
	return rolePermissions[role]?.includes(module) ?? false;
}

export function getAccessibleModules(role: UserRole): string[] {
	return rolePermissions[role] ?? [];
}
