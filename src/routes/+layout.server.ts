import { redirect, type ServerLoad } from '@sveltejs/kit';
import type { UserRole } from '$lib/server/db/schema';

export const load: ServerLoad = async ({ locals, url }) => {
	const pathname = url.pathname;
	const publicPaths = ['/login', '/register'];

	if (!locals.user && !publicPaths.includes(pathname)) {
		throw redirect(302, '/login');
	}

	if (locals.user && publicPaths.includes(pathname)) {
		throw redirect(302, '/');
	}

	const rolePermissions: Record<string, UserRole[]> = {
		'/users': ['admin'],
		'/users/new': ['admin'],
		'/dashboard': ['admin', 'manager'],
		'/elderly/new': ['admin', 'manager'],
		'/elderly/[id]/edit': ['admin', 'manager'],
		'/medications/new': ['admin', 'manager', 'nurse']
	};

	if (locals.user) {
		for (const [pattern, roles] of Object.entries(rolePermissions)) {
			const regex = new RegExp('^' + pattern.replace(/\[.*?\]/g, '[^/]+') + '$');
			if (regex.test(pathname) && !roles.includes(locals.user.role)) {
				throw redirect(302, '/');
			}
		}
	}

	return {
		user: locals.user
	};
};
