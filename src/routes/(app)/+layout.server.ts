import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$server/db';
import { roles, permissions, rolePermissions } from '$server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	let userPerms: string[] = [];
	let roleName = 'visitor';
	let roleLabel = '游客';

	try {
		const [role] = await db.select({ id: roles.id, name: roles.name, label: roles.label }).from(roles).where(eq(roles.id, locals.user.roleId));
		if (role) {
			roleName = role.name;
			roleLabel = role.label;
		}

		const permRows = await db
			.select({ code: permissions.code })
			.from(rolePermissions)
			.innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
			.where(eq(rolePermissions.roleId, locals.user.roleId));
		userPerms = permRows.map((r) => r.code);
	} catch {
		userPerms = [];
	}

	return {
		user: {
			id: locals.user.id,
			username: locals.user.username,
			displayName: locals.user.displayName,
			roleId: locals.user.roleId,
			roleName,
			roleLabel,
			phone: locals.user.phone ?? null,
			permissions: userPerms
		}
	};
};
