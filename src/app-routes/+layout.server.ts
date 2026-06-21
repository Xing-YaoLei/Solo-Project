import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async (event) => {
	const pathname = event.url.pathname;
	const isAuthPage = pathname === '/login' || pathname === '/signup';

	if (!event.locals.user && !isAuthPage) {
		throw redirect(302, '/login');
	}

	if (event.locals.user && isAuthPage) {
		throw redirect(302, '/');
	}

	return {
		user: event.locals.user
	};
};
