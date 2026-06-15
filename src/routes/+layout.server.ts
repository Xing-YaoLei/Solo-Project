import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { initRoles } from '../server/auth/service';

const publicRoutes = ['/login', '/register'];

export const load: LayoutServerLoad = async (event) => {
	try {
		await initRoles();
	} catch (e) {
		console.error('Failed to init roles:', e);
	}

	const sessionId = event.cookies.get('auth_session');

	if (publicRoutes.includes(event.url.pathname)) {
		if (sessionId) {
			throw redirect(302, '/dashboard');
		}
		return { user: null };
	}

	if (!sessionId) {
		throw redirect(302, '/login');
	}

	return { user: null };
};
