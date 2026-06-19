import { redirect, type RequestHandler } from '@sveltejs/kit';
import { MOCK_COOKIE_NAME } from '../../hooks.server';

export const POST: RequestHandler = async (event) => {
	event.cookies.delete(MOCK_COOKIE_NAME, { path: '/' });

	try {
		const { lucia } = await import('$lib/server/auth/lucia');
		if (event.locals.session) {
			await lucia.invalidateSession(event.locals.session.id);
		}
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '.',
			...sessionCookie.attributes
		});
	} catch (e) {
		// ignore lucia errors in mock mode
	}

	throw redirect(302, '/login');
};
