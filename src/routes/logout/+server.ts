import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

export const POST = async ({ cookies, locals }) => {
	if (locals.session) {
		await auth.invalidateSession(locals.session.id);
	}

	const sessionCookie = auth.createBlankSessionCookie();

	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes
	});

	throw redirect(302, '/login');
};
