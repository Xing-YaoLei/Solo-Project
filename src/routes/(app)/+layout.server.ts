import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	return {
		user: {
			id: locals.user.id,
			username: locals.user.username,
			displayName: locals.user.displayName,
			roleId: locals.user.roleId,
			roleName: locals.user.roleName,
			roleLabel: locals.user.roleLabel,
			phone: locals.user.phone ?? null,
			permissions: locals.user.permissions
		}
	};
};
