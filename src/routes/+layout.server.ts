import { redirect, type ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ locals, url }) => {
	const user = locals.user;

	const isLoginPage = url.pathname === '/login';

	if (!user && !isLoginPage) {
		throw redirect(302, '/login');
	}

	if (user && isLoginPage) {
		throw redirect(302, '/');
	}

	return {
		user: user
			? {
					id: user.id,
					username: user.username,
					name: user.name,
					role: user.role
				}
			: null
	};
};
