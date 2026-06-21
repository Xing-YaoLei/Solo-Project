import type { LayoutServerLoad } from './$types';
import { lucia } from '$lib/server/auth/lucia';
import { redirect } from '@sveltejs/kit';
import type { User } from '$lib/server/db/schema';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const sessionId = cookies.get(lucia.sessionCookieName);

	if (!sessionId) {
		if (!url.pathname.startsWith('/login') && !url.pathname.startsWith('/register')) {
			throw redirect(302, '/login');
		}
		return { user: null };
	}

	const { session, user } = await lucia.validateSession(sessionId);

	if (!session) {
		if (!url.pathname.startsWith('/login') && !url.pathname.startsWith('/register')) {
			throw redirect(302, '/login');
		}
		return { user: null };
	}

	if (url.pathname.startsWith('/login') || url.pathname.startsWith('/register')) {
		throw redirect(302, '/');
	}

	return {
		user: user as User | null
	};
};
